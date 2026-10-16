import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import lionReading from '../../assets/lion-reading.webp'
import { Icon } from '../../components/Icon'
import { narrator } from '../../services/narrator'
import { useApp } from '../../store/appContext'
import { usePlayer } from '../../store/playerContext'

/** Card de destaque do Início: muda conforme o estado da voz (sem voz → gerando → aprovar → pronta). */
export function VoiceHero() {
  const { data, activeChild } = useApp()
  const player = usePlayer()
  const { voice } = data
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (voice.status !== 'processing') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [voice.status])

  const listen = () => {
    player.pause()
    narrator.say(
      `Oi${activeChild ? `, ${activeChild.name}` : ''}! Esta é a minha voz. Hoje à noite, eu vou te contar uma história.`,
      { rate: data.settings.narrationRate, voiceId: voice.voiceId },
    )
  }

  let content
  if (voice.status === 'ready') {
    content = (
      <>
        <h2 className="hero__title">Sua voz já está pronta!</h2>
        <p className="hero__text">Agora é só escolher uma história e ouvir junto com seu filho.</p>
        <button className="hero__cta" onClick={listen}>
          <Icon name="play" size={22} />
          Ouvir minha voz
        </button>
      </>
    )
  } else if (voice.status === 'review') {
    content = (
      <>
        <h2 className="hero__title">Sua voz ficou pronta!</h2>
        <p className="hero__text">Ouça como ficou e aprove antes da primeira história.</p>
        <Link to="/voz/teste" className="hero__cta">
          <Icon name="play" size={22} />
          Ouvir e aprovar
        </Link>
      </>
    )
  } else if (voice.status === 'processing') {
    const start = new Date(voice.startedAt ?? now).getTime()
    const end = new Date(voice.readyAt ?? now).getTime()
    const pct = Math.min(100, ((now - start) / Math.max(1, end - start)) * 100)
    content = (
      <>
        <h2 className="hero__title">Sua voz está sendo preparada</h2>
        <p className="hero__text">Enquanto isso, explore as histórias. Avisamos quando ficar pronta.</p>
        <div className="hero__progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <Link to="/voz/preparando" className="hero__cta">
          Acompanhar
        </Link>
      </>
    )
  } else {
    content = (
      <>
        <h2 className="hero__title">Grave sua voz</h2>
        <p className="hero__text">Em 5 minutos de gravação, as histórias ganham a sua voz.</p>
        <Link to="/gravar-voz" className="hero__cta">
          <Icon name="mic" size={22} />
          Gravar minha voz
        </Link>
      </>
    )
  }

  return (
    <section className="hero" aria-label="Sua voz">
      <span className="hero__star hero__star--1" aria-hidden="true" />
      <span className="hero__star hero__star--2" aria-hidden="true" />
      <span className="hero__star hero__star--3" aria-hidden="true" />
      <span className="hero__cloud" aria-hidden="true" />
      <img className="hero__art" src={lionReading} alt="" />
      <div className="hero__body">{content}</div>
    </section>
  )
}
