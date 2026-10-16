import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../../components/Avatar'
import { ChildModal } from '../../components/ChildModal'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { StoryRow } from '../../components/StoryRow'
import { daysAgoLabel, duration, lastWeek, plural, streakDays } from '../../lib/format'
import { catalog, storyMinutes } from '../../services/catalog'
import { useApp } from '../../store/appContext'
import { usePlayer } from '../../store/playerContext'
import './progress.css'

export default function Progress() {
  const { data, activeChild } = useApp()
  const player = usePlayer()
  const [childOpen, setChildOpen] = useState(false)
  const [weekOpen, setWeekOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const totalSeconds = data.history.reduce((acc, h) => acc + h.seconds, 0)
  const streak = streakDays(data.history)
  const recent = showAll ? data.history : data.history.slice(0, 3)
  const quality = data.voice.quality?.score ?? 0
  const bars = [0.25, 0.4, 0.55, 0.7, 0.85, 1].map((h) => h * Math.max(0.35, quality / 100))

  const stats = [
    { icon: 'play' as const, value: data.history.length, label: 'histórias ouvidas', tone: 'blue' },
    { icon: 'clock' as const, value: duration(totalSeconds), label: 'tempo total', tone: 'blue' },
    { icon: 'star' as const, value: data.favorites.length, label: 'histórias favoritas', tone: 'sun' },
    { icon: 'calendar' as const, value: plural(streak, 'dia', 'dias'), label: 'sequência atual', tone: 'blue' },
  ]

  return (
    <div className="container page progress-page">
      <header className="progress-page__head">
        <div>
          <h1 className="page-title">Seu progresso</h1>
          <p className="page-subtitle">
            Cada história é um passo a mais
            <br />
            para noites mais tranquilas.
          </p>
        </div>
        <button className="icon-btn progress-page__cal" onClick={() => setWeekOpen(true)} aria-label="Ver semana">
          <Icon name="calendar" size={28} />
        </button>
      </header>

      <div className="progress-page__grid">
        <section className="card progress-child">
          {activeChild ? (
            <button className="progress-child__row" onClick={() => setChildOpen(true)}>
              <Avatar size={76} seed={activeChild.name} ring />
              <span className="progress-child__name">
                <strong>{activeChild.name}</strong>
                <span>{plural(activeChild.age, 'ano', 'anos')}</span>
              </span>
              <Icon name="chevronRight" size={26} />
            </button>
          ) : (
            <button className="progress-child__row" onClick={() => setChildOpen(true)}>
              <Avatar size={76} seed="nova" ring />
              <span className="progress-child__name">
                <strong>Adicionar criança</strong>
                <span>Para acompanhar o progresso dela</span>
              </span>
              <Icon name="plus" size={24} />
            </button>
          )}
          <dl className="stats">
            {stats.map((s) => (
              <div key={s.label} className={`stat stat--${s.tone}`}>
                <Icon name={s.icon} size={30} />
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section progress-recent">
          <div className="section-head">
            <h2 className="section-title">Histórias recentes</h2>
            {data.history.length > 3 && (
              <button className="link-more" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Ver menos' : 'Ver todos'} <Icon name={showAll ? 'chevronDown' : 'chevronRight'} size={16} />
              </button>
            )}
          </div>
          {recent.length ? (
            <div className="card">
              {recent.map((entry) => {
                const story = catalog.byId(entry.storyId)
                if (!story) return null
                const playing = player.storyId === story.id && player.status === 'playing'
                return (
                  <StoryRow
                    key={entry.id}
                    story={story}
                    meta={`${storyMinutes(story)} min  •  ${daysAgoLabel(entry.at)}`}
                    playing={playing}
                    onPlay={() => (player.storyId === story.id && player.status !== 'idle' ? player.toggle() : player.play(story.id))}
                  />
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon="books"
              title="Nenhuma história ainda"
              text="As histórias ouvidas aparecem aqui."
              action={<Link to="/historias" className="btn btn--primary btn--sm">Escolher história</Link>}
            />
          )}
        </section>

        <Link to={data.voice.status === 'none' ? '/gravar-voz' : '/perfil'} className="voice-evo">
          <Icon name="wave" size={36} className="voice-evo__icon" />
          <span className="voice-evo__text">
            <strong>Evolução da sua voz</strong>
            <span>
              {data.voice.status === 'none'
                ? 'Grave sua voz para começar.'
                : quality >= 80
                  ? 'Qualidade cada vez melhor!'
                  : 'Dica: regrave em um lugar silencioso.'}
            </span>
          </span>
          <span className="voice-evo__bars" aria-label={`Qualidade ${quality}%`}>
            {bars.map((h, i) => (
              <span key={i} style={{ height: `${h * 100}%` }} />
            ))}
          </span>
        </Link>

        {activeChild && data.history.length > 0 && (
          <div className="cheer">
            <Avatar size={52} seed={activeChild.name} />
            <p>{activeChild.name} já está se acostumando com a sua voz!</p>
            <Icon name="heart" size={26} className="cheer__heart" />
          </div>
        )}
      </div>

      <ChildModal open={childOpen} onClose={() => setChildOpen(false)} child={activeChild} />

      <Modal open={weekOpen} onClose={() => setWeekOpen(false)} title="Últimos 7 dias" description="Dias com pelo menos uma história ouvida." size="sm">
        <ol className="week" role="list">
          {lastWeek(data.history).map((d) => (
            <li key={`${d.label}${d.day}`} className={`week__day${d.active ? ' is-active' : ''}${d.today ? ' is-today' : ''}`}>
              <span>{d.label}</span>
              <strong>{d.day}</strong>
              <Icon name={d.active ? 'star' : 'moon'} size={18} />
            </li>
          ))}
        </ol>
        <p className="week__summary">
          Sequência atual: <strong>{plural(streak, 'dia', 'dias')}</strong>
        </p>
      </Modal>
    </div>
  )
}
