import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import lionReading from '../../assets/lion-reading.webp'
import { Icon } from '../../components/Icon'
import { greetingText, isChildName } from '../../data/greetings'
import { narrator } from '../../services/narrator'
import { recordingsService } from '../../services/recordings'
import { useApp } from '../../store/appContext'
import { useToast } from '../../store/toastContext'
import './voice.css'

/** Passo 7 do fluxo: ouvir uma frase curta com a nova voz e aprovar (ou regravar). */
export default function VoiceTest() {
  const { user, data, actions, activeChild } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const [speaking, setSpeaking] = useState(false)
  const [original, setOriginal] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let url: string | null = null
    if (user) {
      recordingsService.get(user.id, 'reading').then((blob) => {
        if (blob?.size) {
          url = URL.createObjectURL(blob)
          setOriginal(url)
        }
      })
    }
    return () => {
      narrator.stop()
      audio.current?.pause()
      if (url) URL.revokeObjectURL(url)
    }
  }, [user])

  if (data.voice.status === 'none') return <Navigate to="/gravar-voz" replace />
  if (data.voice.status === 'processing') return <Navigate to="/voz/preparando" replace />

  const listen = () => {
    audio.current?.pause()
    if (speaking) {
      narrator.stop()
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    const childName = activeChild && isChildName(activeChild.name) ? activeChild.name : undefined
    const { voiceId } = data.voice
    narrator.say(greetingText('test', childName), {
      rate: data.settings.narrationRate,
      cloud: voiceId ? { voiceId, ref: { greeting: { kind: 'test', childName } } } : undefined,
      onEnd: () => setSpeaking(false),
    })
  }

  const playOriginal = () => {
    narrator.stop()
    setSpeaking(false)
    if (!original) return
    audio.current?.pause()
    audio.current = new Audio(original)
    audio.current.play().catch(() => undefined)
  }

  const approve = () => {
    actions.approveVoice()
    toast('Voz aprovada! Escolha a primeira história.', 'success')
    navigate('/', { replace: true })
  }

  return (
    <div className="container page">
      <section className="voice-status card">
        <div className="voice-status__art">
          <img src={lionReading} alt="" />
        </div>
        <h1 className="voice-status__title">Ouça como ficou</h1>
        <p className="voice-status__text">Toque para ouvir uma frase com a sua nova voz. Se gostar, é só aprovar.</p>
        <div className={`wave-anim${speaking ? '' : ' is-idle'}`} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="voice-status__actions">
          <button className="btn btn--secondary" onClick={listen}>
            <Icon name={speaking ? 'pause' : 'play'} size={20} />
            {speaking ? 'Parar' : 'Ouvir frase de teste'}
          </button>
          {original && (
            <button className="btn btn--ghost btn--sm" onClick={playOriginal}>
              Comparar com a gravação original
            </button>
          )}
          <button className="btn btn--primary" onClick={approve}>
            <Icon name="check" size={20} />
            Aprovar minha voz
          </button>
          <button className="btn btn--ghost" onClick={() => navigate('/gravar-voz')}>
            <Icon name="refresh" size={20} />
            Regravar
          </button>
        </div>
        <p className="voice-status__note">
          {data.voice.voiceId
            ? 'Voz criada com a ElevenLabs a partir da sua gravação.'
            : 'Modo demonstração: sem o servidor de voz, a narração usa a síntese de voz do aparelho.'}
        </p>
      </section>
    </div>
  )
}
