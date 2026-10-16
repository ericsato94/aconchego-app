import { useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import lionSleeping from '../../assets/lion-sleeping.webp'
import { Icon } from '../../components/Icon'
import { StoryCover } from '../../components/StoryCover'
import { Toggle } from '../../components/Toggle'
import { catalog, storyMinutes } from '../../services/catalog'
import { useApp } from '../../store/appContext'
import { usePlayer } from '../../store/playerContext'
import './sleep.css'

const TIMERS = [10, 15, 20, 30, 45]

export default function Sleep() {
  const { data, actions, activeChild } = useApp()
  const player = usePlayer()
  const [params] = useSearchParams()
  const available = catalog.all().filter((s) => catalog.canAccess(s, data.plan))
  const preferred = params.get('historia')
  const [storyId, setStoryId] = useState(
    () =>
      available.find((s) => s.id === preferred)?.id ??
      available.find((s) => s.tags.includes('sono'))?.id ??
      available[0]?.id,
  )
  const { sleepTimerMin, sleepVolume, sleepAutoNext } = data.settings

  const start = () => {
    if (!storyId) return
    player.startSleep(storyId, sleepTimerMin, sleepVolume, sleepAutoNext)
    document.documentElement.requestFullscreen?.().catch(() => undefined)
  }

  return (
    <div className="container page sleep">
      <div className="sleep__layout">
        <section className="sleep__hero">
          <span className="sleep__star sleep__star--1" aria-hidden="true" />
          <span className="sleep__star sleep__star--2" aria-hidden="true" />
          <span className="sleep__star sleep__star--3" aria-hidden="true" />
          <div className="sleep__art">
            <img src={lionSleeping} alt="" />
          </div>
          <h1 className="sleep__title">Modo hora de dormir</h1>
          <p className="sleep__lead">
            Tela escura, volume baixinho e a história termina sozinha com um fade-out suave
            {activeChild ? ` para ${activeChild.name} dormir tranquila` : ''}.
          </p>
          <ul className="sleep__features" role="list">
            <li><Icon name="moon" size={18} /> Tela escura e sem distrações</li>
            <li><Icon name="clock" size={18} /> Timer com fim automático</li>
            <li><Icon name="volume" size={18} /> Volume baixo e fade-out</li>
          </ul>
        </section>

        <section className="sleep__setup card" aria-label="Configurar">
          <div className="sleep__group">
            <h2 className="sleep__label">Qual história?</h2>
            <div className="sleep__stories" role="radiogroup" aria-label="História">
              {available.map((s) => (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={storyId === s.id}
                  className="sleep__story"
                  onClick={() => setStoryId(s.id)}
                >
                  <StoryCover story={s} className="sleep__story-cover" />
                  <span className="sleep__story-title">{s.title}</span>
                  <small>{storyMinutes(s)} min</small>
                </button>
              ))}
            </div>
          </div>

          <div className="sleep__group">
            <h2 className="sleep__label">Desligar depois de</h2>
            <div className="sleep__chips" role="radiogroup" aria-label="Timer">
              {TIMERS.map((m) => (
                <button
                  key={m}
                  className="chip"
                  role="radio"
                  aria-checked={sleepTimerMin === m}
                  onClick={() => actions.updateSettings({ sleepTimerMin: m })}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>

          <div className="sleep__group">
            <label className="sleep__label" htmlFor="sleep-volume">
              Volume <span className="muted">{Math.round(sleepVolume * 100)}%</span>
            </label>
            <div className="sleep__volume">
              <Icon name="volume" size={20} />
              <input
                id="sleep-volume"
                type="range"
                className="range"
                min={0.1}
                max={1}
                step={0.05}
                value={sleepVolume}
                onChange={(e) => actions.updateSettings({ sleepVolume: Number(e.target.value) })}
                style={{ '--pct': `${((sleepVolume - 0.1) / 0.9) * 100}%` } as CSSProperties}
              />
            </div>
          </div>

          <Toggle
            checked={sleepAutoNext}
            onChange={(v) => actions.updateSettings({ sleepAutoNext: v })}
            label="Emendar a próxima história"
            description="Continua com outra história até o timer acabar."
          />

          <button className="btn btn--sun btn--block" onClick={start} disabled={!storyId}>
            <Icon name="moon" size={20} />
            Começar
          </button>
        </section>
      </div>
    </div>
  )
}
