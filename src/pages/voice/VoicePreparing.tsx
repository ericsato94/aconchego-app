import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import lionReading from '../../assets/lion-reading.webp'
import { useApp } from '../../store/appContext'
import { useToast } from '../../store/toastContext'
import './voice.css'

/** Passo 6 do fluxo: espera da geração da voz (simulada localmente). */
export default function VoicePreparing() {
  const { data } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const [now, setNow] = useState(() => Date.now())
  const { voice } = data
  const notifSupported = typeof Notification !== 'undefined'
  const [permission, setPermission] = useState(() => (notifSupported ? Notification.permission : 'denied'))

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (voice.status === 'review') navigate('/voz/teste', { replace: true })
  }, [voice.status, navigate])

  if (voice.status === 'none') return <Navigate to="/gravar-voz" replace />
  // Regravação que falhou volta para a gravação, onde o erro é mostrado (a voz anterior continua valendo).
  if (voice.status === 'ready') return <Navigate to={voice.error ? '/gravar-voz' : '/'} replace />

  const start = new Date(voice.startedAt ?? now).getTime()
  const end = new Date(voice.readyAt ?? now).getTime()
  const pct = Math.min(100, ((now - start) / Math.max(1, end - start)) * 100)
  const secondsLeft = Math.max(0, Math.ceil((end - now) / 1000))

  const askNotify = async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
    toast(result === 'granted' ? 'Combinado! Avisaremos quando ficar pronta.' : 'Tudo bem, o aviso aparecerá aqui no app.')
  }

  return (
    <div className="container page">
      <section className="voice-status card">
        <div className="voice-status__art">
          <img src={lionReading} alt="" />
        </div>
        <div className="wave-anim" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <h1 className="voice-status__title">Sua voz está sendo preparada</h1>
        <p className="voice-status__text">
          Estamos ensinando o Aconchego a contar histórias do seu jeito. Você pode explorar o app enquanto isso.
        </p>
        <div className="voice-status__bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Preparo da voz">
          <div className="progress">
            <div className="progress__bar" style={{ width: `${pct}%` }} />
          </div>
          <p className="voice-status__eta">
            {secondsLeft > 0 && voice.mode !== 'cloud'
              ? `Falta${secondsLeft === 1 ? '' : 'm'} cerca de ${secondsLeft} segundo${secondsLeft === 1 ? '' : 's'}`
              : 'Quase lá…'}
          </p>
        </div>
        <div className="voice-status__actions">
          <Link to="/historias" className="btn btn--primary">
            Explorar histórias enquanto isso
          </Link>
          {notifSupported && permission === 'default' && (
            <button className="btn btn--secondary" onClick={askNotify}>
              Avisar quando estiver pronta
            </button>
          )}
        </div>
        <p className="voice-status__note">
          {voice.mode === 'cloud'
            ? 'Sua gravação foi enviada com segurança para criar a voz. Costuma levar menos de um minuto.'
            : 'Modo demonstração: o servidor de voz não está configurado, então o preparo é simulado.'}
        </p>
      </section>
    </div>
  )
}
