import { estimateSeconds, stripCues } from './catalog'
import { voiceApi, type NarrationMeta, type NarrationRef } from './voiceApi'

/**
 * Narração das histórias.
 * - Com `voiceId`: toca o áudio gerado pela ElevenLabs com a voz clonada (via servidor, com cache).
 * - Sem voz clonada: toca a narração padrão já gravada do catálogo (`preset`), quando existe.
 * - Sem nenhum dos dois, ou se o áudio falhar: usa a síntese de voz pt-BR do aparelho.
 * - Sem síntese no aparelho: segue em modo silencioso temporizado (progresso e timer continuam).
 */
export interface SpeakOptions {
  rate?: number
  volume?: number
  pitch?: number
  /** Voz clonada na ElevenLabs e o que ela vai narrar (sempre em velocidade normal). */
  cloud?: { voiceId: string; ref: NarrationRef }
  /** Narração padrão pronta (arquivo estático do app), usada quando não há voz clonada. */
  preset?: NarrationMeta
  /** Começa neste segundo do áudio (em vez do início do parágrafo `from`). Só vale para áudio pronto. */
  startSeconds?: number
  onIndex?: (index: number) => void
  /** Tempo real do áudio tocando (s) e a duração total. Não é chamado na voz do aparelho. */
  onTime?: (seconds: number, duration: number, starts: number[]) => void
  onEnd?: () => void
  /** true enquanto a narração com a voz clonada está sendo gerada (só na primeira vez de cada história). */
  onLoading?: (loading: boolean) => void
  /** Título mostrado na tela de bloqueio. */
  media?: { title: string }
  /** O áudio foi pausado por fora do app (tela de bloqueio, fone, ligação). */
  onExternalPause?: () => void
  /** Play pela tela de bloqueio. */
  onExternalPlay?: () => void
}

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

/** 0,1 s de silêncio: tocado dentro do toque do usuário para liberar o som (iPhone, inclusive no app instalado). */
const SILENCE = 'data:audio/mpeg;base64,//NAxAAAAANIAAAAAExBTUU0LjBVVVVVVVVVVVVVVVVMQU1FNC4wVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEWwAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FNC4wVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUU0LjBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUU0LjBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'

const BASE_RATE = 0.95
/** Recuo ao retomar um parágrafo, para não começar no meio de uma respiração. */
const RESUME_BACKOFF_S = 0.15
const MAX_CACHED = 12

type WakeLockSentinelLike = { release(): Promise<void> }
type NavigatorWithWakeLock = Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> } }

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
  /**
   * Player dos áudios prontos (voz clonada e narração padrão). Um <audio> comum, e não Web Audio:
   * é o que toca no app instalado do iPhone, com a tela bloqueada e com a chave de silencioso ligada.
   */
  private audio: HTMLAudioElement | null = null
  private tracker: number | undefined
  private wakeLock: WakeLockSentinelLike | null = null
  private narrations = new Map<string, Promise<NarrationMeta>>()

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    // No iPhone o volume do <audio> é sempre o do aparelho (o fade do modo sono só vale nos outros).
    if (this.audio) this.audio.volume = this.volume
  }

  stop() {
    this.runId++
    window.clearTimeout(this.timer)
    window.clearTimeout(this.watchdog)
    window.clearInterval(this.tracker)
    synth?.cancel()
    const audio = this.audio
    if (audio) {
      audio.onended = audio.onerror = audio.onpause = audio.onplaying = audio.onloadedmetadata = null
      audio.pause()
    }
    this.releaseWakeLock()
  }

  private element() {
    if (!this.audio) {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.setAttribute('playsinline', '')
      this.audio = audio
    }
    return this.audio
  }

  /** Chamado dentro do toque do usuário: o iPhone só deixa este player tocar depois disso. */
  private unlock() {
    const audio = this.element()
    audio.src = SILENCE
    audio.play().catch(() => undefined)
  }

  /** Mantém a tela acesa enquanto a história toca (onde o navegador permitir). */
  private keepScreenOn() {
    const nav = navigator as NavigatorWithWakeLock
    if (this.wakeLock || !nav.wakeLock || document.visibilityState !== 'visible') return
    nav.wakeLock
      .request('screen')
      .then((lock) => (this.wakeLock = lock))
      .catch(() => undefined)
  }

  private releaseWakeLock() {
    this.wakeLock?.release().catch(() => undefined)
    this.wakeLock = null
  }

  /** Busca (uma vez) os dados da narração; o próprio navegador guarda o arquivo de áudio em cache. */
  private narration(key: string, resolve: () => Promise<NarrationMeta>) {
    let item = this.narrations.get(key)
    if (!item) {
      item = resolve()
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

    // Voz do aparelho, parágrafo a parágrafo: sem áudio pronto ou se ele falhar.
    const deviceFrom = (index: number) => {
      if (run !== this.runId) return
      if (index >= texts.length) return opts.onEnd?.()
      opts.onIndex?.(index)
      this.playDevice(texts[index], rate, opts.pitch, run, () => deviceFrom(index + 1))
    }

    const { cloud, preset } = opts
    // Se a voz clonada falhar, tenta a narração padrão antes da voz do aparelho.
    const playPreset = () => (preset ? this.playAudio(from, preset, run, opts, () => deviceFrom(from)) : deviceFrom(from))
    if (cloud) {
      this.unlock()
      const key = `${cloud.voiceId}\n${JSON.stringify(cloud.ref)}`
      this.playAudio(from, this.narration(key, () => voiceApi.narration(cloud.voiceId, cloud.ref)), run, opts, playPreset)
    } else if (preset) {
      // Arquivo já conhecido: dá o play direto, ainda dentro do toque do usuário.
      playPreset()
    } else {
      deviceFrom(from)
    }
  }

  /** Toca a história inteira de uma vez, acompanhando o parágrafo atual pelas marcações de tempo. */
  private playAudio(from: number, ready: NarrationMeta | Promise<NarrationMeta>, run: number, opts: SpeakOptions, fallback: () => void) {
    const loadingTimer = window.setTimeout(() => run === this.runId && opts.onLoading?.(true), 300)
    const fail = () => {
      window.clearTimeout(loadingTimer)
      opts.onLoading?.(false)
      if (run !== this.runId) return
      window.clearInterval(this.tracker)
      fallback()
    }

    const start = (meta: NarrationMeta) => {
      if (run !== this.runId) return
      const audio = this.element()
      const starts = meta.starts
      const indexAt = (seconds: number) => {
        let index = 0
        while (index + 1 < starts.length && seconds >= starts[index + 1]) index++
        return index
      }
      let duration = meta.duration
      let current = from
      /** Só depois que o áudio da história começa: ignora pausa/fim do silêncio usado para liberar o som. */
      let started = false

      // A posição certa é aplicada assim que os dados do arquivo chegam.
      audio.onloadedmetadata = () => {
        if (run !== this.runId || audio.src.startsWith('data:')) return
        duration = meta.duration || audio.duration
        const offset =
          opts.startSeconds !== undefined
            ? Math.max(0, Math.min(opts.startSeconds, duration - 0.5))
            : Math.max(0, (starts[from] ?? 0) - (from > 0 ? RESUME_BACKOFF_S : 0))
        audio.currentTime = offset
        current = opts.startSeconds !== undefined ? indexAt(offset) : from
        opts.onIndex?.(current)
        opts.onTime?.(offset, duration, starts)
      }
      audio.onplaying = () => {
        if (run !== this.runId || audio.src.startsWith('data:')) return
        started = true
        window.clearTimeout(loadingTimer)
        opts.onLoading?.(false)
        this.keepScreenOn()
        window.clearInterval(this.tracker)
        // Acompanha o parágrafo que está sendo falado (destaque, progresso e retomada) e o tempo real.
        this.tracker = window.setInterval(() => {
          if (run !== this.runId) return
          const position = Math.min(duration, audio.currentTime)
          opts.onTime?.(position, duration, starts)
          const index = indexAt(position)
          if (index !== current) {
            current = index
            opts.onIndex?.(index)
          }
        }, 250)
      }
      // Pausa vinda de fora (tela de bloqueio, fone, ligação): o app acompanha.
      audio.onpause = () => {
        if (run !== this.runId || !started || audio.ended) return
        window.clearInterval(this.tracker)
        opts.onExternalPause?.()
      }
      audio.onended = () => {
        if (run !== this.runId || !started) return
        window.clearInterval(this.tracker)
        this.releaseWakeLock()
        opts.onTime?.(duration, duration, starts)
        opts.onEnd?.()
      }
      audio.onerror = () => {
        if (!audio.src.startsWith('data:')) fail()
      }
      audio.volume = this.volume
      audio.src = meta.audioUrl
      audio.play().catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) fail()
      })
      this.updateMediaSession(opts)
    }

    if (ready instanceof Promise) ready.then(start).catch(fail)
    else start(ready)
  }

  /** Título e botões da tela de bloqueio / central de controle. */
  private updateMediaSession(opts: SpeakOptions) {
    if (!('mediaSession' in navigator) || !opts.media) return
    const session = navigator.mediaSession
    session.metadata = new MediaMetadata({
      title: opts.media.title,
      artist: 'Aconchego',
      artwork: [{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
    })
    session.setActionHandler('play', () => opts.onExternalPlay?.())
    session.setActionHandler('pause', () => this.audio?.pause())
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
