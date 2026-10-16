import { estimateSeconds, stripCues } from './catalog'
import { voiceApi, type NarrationMeta } from './voiceApi'

/**
 * Narração das histórias.
 * - Com `voiceId`: toca o áudio gerado pela ElevenLabs com a voz clonada (via servidor, com cache).
 * - Sem voz clonada, ou se a nuvem falhar: usa a síntese de voz pt-BR do aparelho.
 * - Sem síntese no aparelho: segue em modo silencioso temporizado (progresso e timer continuam).
 */
export interface SpeakOptions {
  rate?: number
  volume?: number
  pitch?: number
  /** Voz clonada na ElevenLabs. */
  voiceId?: string
  onIndex?: (index: number) => void
  onEnd?: () => void
  /** true enquanto a narração com a voz clonada está sendo gerada (só na primeira vez de cada história). */
  onLoading?: (loading: boolean) => void
}

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
const AudioCtx: typeof AudioContext | undefined =
  typeof window !== 'undefined'
    ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
    : undefined

const BASE_RATE = 0.95
/** Margem antes de começar: evita que a saída de som (ex.: Bluetooth) engula as primeiras palavras. */
const LEAD_IN_S = 0.3
/** Recuo ao retomar um parágrafo, para não começar no meio de uma respiração. */
const RESUME_BACKOFF_S = 0.15
const MAX_CACHED = 12

/** Converte a velocidade escolhida no app (0,8 / 0,95 / 1,1) para a da ElevenLabs (≈ 0,76 / 0,9 / 1,05). */
const cloudSpeed = (rate: number) => Math.min(1.2, Math.max(0.7, Math.round(rate * 0.95 * 100) / 100))

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = synth?.getVoices() ?? []
  return (
    voices.find((v) => v.lang === 'pt-BR' && /luciana|francisca|google/i.test(v.name)) ??
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === 'pt-br') ??
    voices.find((v) => v.lang.toLowerCase().startsWith('pt'))
  )
}

class Narrator {
  private runId = 0
  private timer: number | undefined
  private watchdog: number | undefined
  private volume = 1
  private ttsBroken = !synth
  /** Canal de áudio da voz clonada (Web Audio: volume suave e sem cortes no início). */
  private ctx: AudioContext | null = null
  private gain: GainNode | null = null
  private source: AudioBufferSourceNode | null = null
  private tracker: number | undefined
  private narrations = new Map<string, Promise<{ meta: NarrationMeta; buffer: AudioBuffer }>>()

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.ctx && this.gain) this.gain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.4)
  }

  stop() {
    this.runId++
    window.clearTimeout(this.timer)
    window.clearTimeout(this.watchdog)
    window.clearInterval(this.tracker)
    synth?.cancel()
    if (this.source) {
      this.source.onended = null
      try {
        this.source.stop()
      } catch {
        /* já parado */
      }
      this.source = null
    }
  }

  /** Cria/retoma o canal de áudio. Chamado dentro do toque do usuário (libera o som no iOS). */
  private audioContext() {
    if (!AudioCtx) return null
    if (!this.ctx) {
      this.ctx = new AudioCtx()
      this.gain = this.ctx.createGain()
      this.gain.connect(this.ctx.destination)
    }
    this.gain!.gain.value = this.volume
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => undefined)
    return this.ctx
  }

  /** Gera/baixa (uma vez) a narração do texto inteiro e decodifica o áudio. */
  private narration(voiceId: string, speed: number, texts: string[]) {
    const ctx = this.ctx!
    const key = `${voiceId}\n${speed}\n${texts.join('\n')}`
    let item = this.narrations.get(key)
    if (!item) {
      item = voiceApi.narration(voiceId, speed, texts).then(async (meta) => {
        const res = await fetch(meta.audioUrl)
        if (!res.ok) throw new Error(`audio ${res.status}`)
        return { meta, buffer: await ctx.decodeAudioData(await res.arrayBuffer()) }
      })
      item.catch(() => this.narrations.delete(key))
      this.narrations.set(key, item)
      if (this.narrations.size > MAX_CACHED) this.narrations.delete(this.narrations.keys().next().value!)
    }
    return item
  }

  speak(texts: string[], from: number, opts: SpeakOptions = {}) {
    this.stop()
    const run = this.runId
    if (opts.volume !== undefined) this.setVolume(opts.volume)
    const rate = opts.rate ?? BASE_RATE

    // Voz do aparelho, parágrafo a parágrafo: sem voz clonada ou se a nuvem falhar.
    const deviceFrom = (index: number) => {
      if (run !== this.runId) return
      if (index >= texts.length) return opts.onEnd?.()
      opts.onIndex?.(index)
      this.playDevice(texts[index], rate, opts.pitch, run, () => deviceFrom(index + 1))
    }

    if (opts.voiceId && this.audioContext()) {
      this.playCloud(texts, from, opts.voiceId, cloudSpeed(rate), run, opts, () => deviceFrom(from))
    } else {
      deviceFrom(from)
    }
  }

  /** Toca a história inteira de uma vez, acompanhando o parágrafo atual pelas marcações de tempo. */
  private playCloud(
    texts: string[],
    from: number,
    voiceId: string,
    speed: number,
    run: number,
    opts: SpeakOptions,
    fallback: () => void,
  ) {
    const loadingTimer = window.setTimeout(() => run === this.runId && opts.onLoading?.(true), 300)
    this.narration(voiceId, speed, texts)
      .then(({ meta, buffer }) => {
        window.clearTimeout(loadingTimer)
        opts.onLoading?.(false)
        const ctx = this.ctx
        if (run !== this.runId || !ctx || !this.gain) return

        const offset = Math.max(0, (meta.starts[from] ?? 0) - (from > 0 ? RESUME_BACKOFF_S : 0))
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(this.gain)
        source.onended = () => {
          if (run !== this.runId) return
          window.clearInterval(this.tracker)
          opts.onEnd?.()
        }
        this.source = source
        const startAt = ctx.currentTime + LEAD_IN_S
        source.start(startAt, offset)

        // Acompanha o parágrafo que está sendo falado (destaque, progresso e retomada).
        let current = from
        opts.onIndex?.(from)
        this.tracker = window.setInterval(() => {
          if (run !== this.runId) return
          const position = offset + (ctx.currentTime - startAt)
          let index = current
          while (index + 1 < meta.starts.length && position >= meta.starts[index + 1]) index++
          if (index !== current) {
            current = index
            opts.onIndex?.(index)
          }
        }, 200)
      })
      .catch(() => {
        window.clearTimeout(loadingTimer)
        opts.onLoading?.(false)
        if (run === this.runId) fallback()
      })
  }

  private playDevice(text: string, rate: number, pitch: number | undefined, run: number, advance: () => void) {
    const simulate = () => {
      this.timer = window.setTimeout(advance, (estimateSeconds(text) * 1000) / rate)
    }
    if (this.ttsBroken || !synth) return simulate()

    const utter = new SpeechSynthesisUtterance(stripCues(text))
    utter.lang = 'pt-BR'
    const voice = pickVoice()
    if (voice) utter.voice = voice
    utter.rate = rate
    utter.pitch = pitch ?? 1
    utter.volume = this.volume
    let started = false
    utter.onstart = () => {
      started = true
      window.clearTimeout(this.watchdog)
    }
    utter.onend = () => {
      if (run === this.runId) advance()
    }
    utter.onerror = (event) => {
      if (run !== this.runId || event.error === 'interrupted' || event.error === 'canceled') return
      window.clearTimeout(this.watchdog)
      this.ttsBroken = true
      simulate()
    }
    synth.speak(utter)
    // Alguns navegadores (ou ambientes sem áudio) nunca iniciam a fala: cai para o modo temporizado.
    window.clearTimeout(this.watchdog)
    this.watchdog = window.setTimeout(() => {
      if (run !== this.runId || started) return
      this.ttsBroken = true
      synth.cancel()
      simulate()
    }, 2500)
  }

  /** Fala uma frase curta (ex.: teste da voz). */
  say(text: string, opts: Omit<SpeakOptions, 'onIndex'> = {}) {
    this.speak([text], 0, opts)
  }
}

export const narrator = new Narrator()

// Carrega a lista de vozes cedo (Chrome popula de forma assíncrona).
synth?.getVoices()
