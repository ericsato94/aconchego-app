import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { Icon } from '../../components/Icon'
import { ScoreRing } from '../../components/ScoreRing'
import { RECORDING } from '../../config/app'
import { READING_SCRIPT, randomPhrase } from '../../data/recordingScript'
import { useRecorder, type RecorderResult } from '../../hooks/useRecorder'
import { clock } from '../../lib/format'
import { recordingsService } from '../../services/recordings'
import { voiceApi } from '../../services/voiceApi'
import { useApp } from '../../store/appContext'
import { usePlayer } from '../../store/playerContext'
import { useToast } from '../../store/toastContext'
import type { RecordingQuality } from '../../types'
import './voice.css'

type Step = 1 | 2 | 3

const STEPS = ['Frase de teste', 'Leitura da história', 'Finalizar']

function qualityOf(takes: RecorderResult[]): RecordingQuality {
  const duration = takes.reduce((a, t) => a + t.duration, 0)
  let score = 96
  if (takes.some((t) => t.volume === 'baixo')) score -= 22
  if (takes.some((t) => t.volume === 'alto')) score -= 12
  if (takes.some((t) => t.noisy)) score -= 18
  const reading = takes[1]
  if (reading && reading.duration < RECORDING.readingTargetSeconds) score -= 10
  const volume = takes.some((t) => t.volume === 'baixo') ? 'baixo' : takes.some((t) => t.volume === 'alto') ? 'alto' : 'bom'
  return { score: Math.max(40, score), volume, noisy: takes.some((t) => t.noisy), duration: Math.round(duration) }
}

function usePlayback() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  useEffect(() => () => audio.current?.pause(), [])
  const toggle = (id: string, take: RecorderResult) => {
    audio.current?.pause()
    if (playing === id || take.simulated || !take.blob.size) {
      setPlaying(null)
      return
    }
    const el = new Audio(URL.createObjectURL(take.blob))
    el.onended = () => setPlaying(null)
    el.play().catch(() => setPlaying(null))
    audio.current = el
    setPlaying(id)
  }
  return { playing, toggle }
}

function RecordVoiceFlow() {
  const { user, data, actions } = useApp()
  const player = usePlayer()
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState<Step>(1)
  const [phrase, setPhrase] = useState(() => randomPhrase())
  const [takes, setTakes] = useState<{ phrase?: RecorderResult; reading?: RecorderResult }>({})
  const maxSeconds = step === 1 ? RECORDING.phraseMaxSeconds : RECORDING.readingTargetSeconds * 3
  const rec = useRecorder(maxSeconds)
  const playback = usePlayback()

  const target = step === 1 ? RECORDING.phraseMaxSeconds : RECORDING.readingTargetSeconds
  const minimum = step === 1 ? RECORDING.phraseMinSeconds : RECORDING.readingTargetSeconds
  const current = rec.result
  const tooShort = current ? current.duration < minimum : false
  const recording = rec.status === 'recording'
  const shownSeconds = current ? current.duration : rec.live.seconds
  const volume = current?.volume ?? rec.live.volume
  const noisy = current?.noisy ?? rec.live.noisy

  useEffect(() => player.pause(), []) // eslint-disable-line react-hooks/exhaustive-deps -- pausa a história só ao entrar

  const goTo = (next: Step) => {
    rec.reset()
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const accept = async () => {
    if (!current || tooShort || !user) return
    const kind = step === 1 ? 'phrase' : 'reading'
    setTakes((t) => ({ ...t, [kind]: current }))
    if (current.blob.size) await recordingsService.save(user.id, kind, current.blob).catch(() => undefined)
    goTo(step === 1 && !takes.reading ? 2 : 3)
  }

  const finish = () => {
    if (!takes.phrase || !takes.reading) return
    void actions.startVoice(phrase, qualityOf([takes.phrase, takes.reading]))
    toast('Gravação enviada! Estamos preparando sua voz.', 'success')
    navigate('/voz/preparando', { replace: true })
  }

  const micLabel = recording
    ? 'Gravando… toque para parar'
    : rec.status === 'requesting'
      ? 'Aguardando o microfone…'
      : current
        ? 'Toque para gravar de novo'
        : 'Toque para gravar'

  return (
    <div className="container page record">
      <header className="record__head">
        <div className="record__back">
          <BackButton fallback="/" />
        </div>
        <h1 className="record__title">Gravação da sua voz</h1>
        <p className="record__sub">
          Siga as etapas e fale com calma.
          <br />
          Sua voz é única e especial!
        </p>
        <ol className="stepper" aria-label="Etapas">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Step
            const state = n < step ? 'done' : n === step ? 'current' : 'todo'
            return (
              <li key={label} className={`stepper__item is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                <span className="stepper__dot">{state === 'done' ? <Icon name="check" size={18} /> : n}</span>
                <span className="stepper__label">{label}</span>
              </li>
            )
          })}
        </ol>
      </header>

      {data.voice.error && step === 1 && !current && (
        <p className="form-error" role="alert">
          Não conseguimos criar sua voz: {data.voice.error}
        </p>
      )}

      {step < 3 ? (
        <div className="record__grid">
          <section className="record__panel">
            <span className="record__badge-icon">
              <Icon name="mic" size={28} />
            </span>
            <span className="record__pill">{STEPS[step - 1]}</span>
            <p className="record__instruction">
              {step === 1 ? (
                <>
                  Leia a frase abaixo em voz alta
                  <br />
                  para verificarmos que é você.
                </>
              ) : (
                <>
                  Leia a história inteira como se contasse para seu filho, seguindo a emoção indicada em cada trecho. Pelo
                  menos {clock(RECORDING.readingTargetSeconds)} de fala.
                </>
              )}
            </p>

            {step === 1 ? (
              <blockquote className="record__quote">“{phrase}”</blockquote>
            ) : (
              <div className="record__script" tabIndex={0} aria-label="Roteiro de leitura">
                {READING_SCRIPT.map((part) => (
                  <div key={part.text} className="record__part">
                    <span className="record__mood">{part.mood}</span>
                    <p>{part.text}</p>
                  </div>
                ))}
              </div>
            )}

            {rec.status === 'error' ? (
              <div className="record__error" role="alert">
                <strong>
                  {rec.error === 'denied'
                    ? 'Não temos permissão para usar o microfone.'
                    : rec.error === 'nodevice'
                      ? 'Nenhum microfone encontrado.'
                      : 'Este navegador não permite gravar aqui.'}
                </strong>
                <span>
                  {rec.error === 'denied'
                    ? 'Libere o microfone nas configurações do navegador e tente de novo.'
                    : 'A gravação exige um navegador moderno e conexão segura (HTTPS ou localhost).'}
                </span>
                <div className="record__error-actions">
                  <button className="btn btn--primary btn--sm" onClick={rec.start}>
                    Tentar novamente
                  </button>
                  <button className="btn btn--secondary btn--sm" onClick={rec.simulate}>
                    Simular gravação (demonstração)
                  </button>
                </div>
              </div>
            ) : (
              <div className="record__mic-wrap">
                <button
                  className={`record__mic${recording ? ' is-recording' : ''}`}
                  onClick={recording ? rec.stop : rec.start}
                  disabled={rec.status === 'requesting'}
                  aria-label={micLabel}
                  style={{ '--level': Math.min(1, rec.live.level * 6) } as CSSProperties}
                >
                  <span className="record__ring record__ring--1" />
                  <span className="record__ring record__ring--2" />
                  <span className="record__mic-core">
                    {recording ? <span className="record__stop" /> : <Icon name="mic" size={40} />}
                  </span>
                </button>
                <span className="record__mic-label" aria-live="polite">
                  {micLabel}
                </span>
              </div>
            )}

            {current && !recording && (
              <div className="record__review">
                {tooShort ? (
                  <p className="record__warn" role="alert">
                    A gravação ficou curta ({clock(current.duration)}). Grave pelo menos {clock(minimum)}.
                  </p>
                ) : (
                  <p className="record__ok">
                    <Icon name="check" size={18} /> {current.simulated ? 'Gravação simulada registrada.' : 'Ótima gravação!'}
                  </p>
                )}
                <div className="record__review-actions">
                  {!current.simulated && (
                    <button className="btn btn--secondary btn--sm" onClick={() => playback.toggle('current', current)}>
                      <Icon name={playback.playing === 'current' ? 'pause' : 'play'} size={18} />
                      {playback.playing === 'current' ? 'Pausar' : 'Ouvir'}
                    </button>
                  )}
                  <button className="btn btn--primary btn--sm" onClick={accept} disabled={tooShort}>
                    Continuar
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="record__side">
            <section className="quality card" aria-label="Qualidade da gravação">
              <h2 className="quality__title">Qualidade da gravação</h2>
              <div className="quality__grid">
                <div className={`quality__tile${volume && volume !== 'bom' ? ' is-warn' : ''}`}>
                  <span className="quality__bars" aria-hidden="true">
                    {[0.35, 0.6, 0.85, 1].map((h, i) => (
                      <span
                        key={h}
                        style={{ height: `${h * 100}%` }}
                        className={recording && rec.live.level * 8 > i ? 'is-on' : volume === 'bom' || !volume ? 'is-on' : ''}
                      />
                    ))}
                  </span>
                  <span>Volume</span>
                  <strong>{volume ?? '—'}</strong>
                </div>
                <div className={`quality__tile${noisy ? ' is-warn' : ''}`}>
                  <Icon name="wave" size={26} />
                  <span>{noisy ? 'Ruído detectado' : 'Sem ruídos significativos'}</span>
                </div>
                <div className="quality__tile">
                  <Icon name="clock" size={26} />
                  <span>Duração</span>
                  <strong className="quality__time">
                    {clock(shownSeconds)} / {clock(target)}
                  </strong>
                </div>
              </div>
            </section>

            <button
              className="retake"
              onClick={() => {
                if (step === 1) setPhrase((p) => randomPhrase(p))
                rec.reset()
              }}
            >
              <Icon name="refresh" size={34} />
              <span>
                <strong>Precisa regravar?</strong>
                Você pode refazer a gravação quantas vezes for necessário.
              </span>
            </button>

            <ul className="record__tips card">
              <li>Escolha um lugar silencioso, longe da TV.</li>
              <li>Segure o celular a um palmo da boca.</li>
              <li>Fale como se contasse a história ao seu filho.</li>
            </ul>
          </aside>
        </div>
      ) : (
        <section className="finalize card">
          <ScoreRing value={qualityOf([takes.phrase!, takes.reading!]).score} label="qualidade" size={128} />
          <div className="finalize__body">
            <h2 className="finalize__title">Tudo pronto para criar sua voz!</h2>
            <p>Revise as gravações. Se quiser, regrave alguma etapa antes de enviar.</p>
            <ul className="finalize__takes" role="list">
              {(['phrase', 'reading'] as const).map((kind, i) => {
                const take = takes[kind]!
                return (
                  <li key={kind} className="finalize__take">
                    <span className="finalize__take-n">{i + 1}</span>
                    <span className="finalize__take-text">
                      <strong>{STEPS[i]}</strong>
                      <small>
                        {clock(take.duration)} · volume {take.volume}
                        {take.simulated ? ' · simulada' : ''}
                      </small>
                    </span>
                    {!take.simulated && (
                      <button className="play-btn play-btn--soft" onClick={() => playback.toggle(kind, take)} aria-label={`Ouvir ${STEPS[i]}`}>
                        <Icon name={playback.playing === kind ? 'pause' : 'play'} size={16} />
                      </button>
                    )}
                    <button className="btn btn--ghost btn--sm" onClick={() => goTo((i + 1) as Step)}>
                      Regravar
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="finalize__note">
              <Icon name="shieldInfo" size={18} /> Sua gravação é usada só para criar a sua voz e pode ser apagada a qualquer momento no Perfil.
            </p>
            <button className="btn btn--primary btn--block" onClick={finish}>
              Criar minha voz
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

/**
 * Gravar a voz faz parte dos planos pagos. Sem plano (e com o servidor de voz configurado),
 * mostra o convite para assinar; sem servidor (desenvolvimento), segue em modo demonstração.
 */
export default function RecordVoice() {
  const { actions } = useApp()
  const toast = useToast()
  const [state, setState] = useState<'checking' | 'open' | 'locked'>('checking')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    voiceApi.status().then((s) => alive && setState(!s.configured || s.allowed ? 'open' : 'locked'))
    return () => {
      alive = false
    }
  }, [])

  const recheck = async () => {
    setBusy(true)
    try {
      const allowed = await actions.refreshAccess()
      if (allowed) setState('open')
      else toast('Ainda não encontramos um pagamento com o e-mail da sua conta.', 'info')
    } catch {
      toast('Não foi possível verificar agora. Tente de novo em instantes.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'open') return <RecordVoiceFlow />
  if (state === 'checking') return <div className="container page" aria-busy="true" />

  return (
    <div className="container page">
      <section className="voice-status card">
        <span className="record__badge-icon">
          <Icon name="mic" size={28} />
        </span>
        <h1 className="voice-status__title">Grave a sua voz</h1>
        <p className="voice-status__text">
          A voz clonada faz parte dos planos Mensal e Anual. Assine e, em poucos minutos, todas as histórias passam a
          ser contadas por você.
        </p>
        <div className="voice-status__actions">
          <Link to="/planos" className="btn btn--plan">
            <Icon name="sparkles" size={20} />
            Ver planos
          </Link>
          <button className="btn btn--secondary" onClick={recheck} disabled={busy}>
            <Icon name="refresh" size={20} />
            {busy ? 'Verificando…' : 'Já assinei — verificar'}
          </button>
          <Link to="/historias" className="btn btn--ghost">
            Ouvir as histórias grátis
          </Link>
        </div>
        <p className="voice-status__note">Use no pagamento o mesmo e-mail da sua conta para a liberação ser automática.</p>
      </section>
    </div>
  )
}
