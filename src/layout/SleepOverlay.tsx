import { useEffect, useState } from 'react'
import lionSleeping from '../assets/lion-sleeping.webp'
import { Icon } from '../components/Icon'
import { clock } from '../lib/format'
import { catalog } from '../services/catalog'
import { useApp } from '../store/appContext'
import { usePlayer } from '../store/playerContext'
import './SleepOverlay.css'

const DIM_AFTER_MS = 8000

/** Tela escura do modo hora de dormir: mínimo de luz, timer e fade-out automático. */
export function SleepOverlay() {
  const player = usePlayer()
  const { activeChild } = useApp()
  const [now, setNow] = useState(() => Date.now())
  const [dimmed, setDimmed] = useState(false)
  const active = Boolean(player.sleep)

  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [active])

  useEffect(() => {
    if (!active || dimmed) return
    const timer = window.setTimeout(() => setDimmed(true), DIM_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [active, dimmed])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      setDimmed(false)
      if (e.key === 'Escape') {
        player.stop()
        player.endSleep()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, player])

  if (!player.sleep) return null
  const { sleep } = player
  const story = player.storyId ? catalog.byId(player.storyId) : undefined
  const remaining = Math.max(0, Math.round((sleep.endsAt - now) / 1000))
  const exit = () => {
    player.stop()
    player.endSleep()
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined)
  }

  return (
    <div
      className={`sleep-overlay${dimmed ? ' is-dimmed' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Modo hora de dormir"
      onPointerDown={() => setDimmed(false)}
    >
      <div className="sleep-overlay__stars" aria-hidden="true" />
      <div className="sleep-overlay__content">
        <div className="sleep-overlay__art">
          <img src={lionSleeping} alt="" />
        </div>

        {sleep.finished ? (
          <>
            <h2 className="sleep-overlay__title">Bons sonhos{activeChild ? `, ${activeChild.name}` : ''}!</h2>
            <p className="sleep-overlay__sub">A história terminou com calma. Até amanhã.</p>
            <button className="btn btn--sun" onClick={exit}>
              Sair do modo dormir
            </button>
          </>
        ) : (
          <>
            <h2 className="sleep-overlay__title">Boa noite{activeChild ? `, ${activeChild.name}` : ''}!</h2>
            <p className="sleep-overlay__sub">
              {story ? story.title : ''}
              {player.loading ? ' · preparando a narração…' : ''}
            </p>
            <p className="sleep-overlay__timer" aria-live="off">
              <Icon name="moon" size={18} /> {clock(remaining)}
            </p>
            <div className="sleep-overlay__controls">
              <button
                className="sleep-overlay__play"
                onClick={player.toggle}
                aria-label={player.status === 'playing' ? 'Pausar' : 'Continuar'}
              >
                <Icon name={player.status === 'playing' ? 'pause' : 'play'} size={30} />
              </button>
            </div>
            <button className="sleep-overlay__exit" onClick={exit}>
              Encerrar modo dormir
            </button>
          </>
        )}
      </div>
    </div>
  )
}
