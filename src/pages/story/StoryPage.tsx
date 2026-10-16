import { useEffect, useRef, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'
import { StoryCover } from '../../components/StoryCover'
import { clock } from '../../lib/format'
import { catalog, estimateSeconds, storyMinutes, stripCues } from '../../services/catalog'
import { useApp } from '../../store/appContext'
import { usePlayer } from '../../store/playerContext'
import { useToast } from '../../store/toastContext'
import './story.css'

const TAG_LABEL = { sono: 'Para dormir', aventura: 'Aventura', amizade: 'Amizade', natureza: 'Natureza' } as const

export default function StoryPage() {
  const { id = '' } = useParams()
  const story = catalog.byId(id)
  const { data, actions } = useApp()
  const player = usePlayer()
  const toast = useToast()
  const textRef = useRef<HTMLOListElement>(null)

  const isCurrent = player.storyId === id && player.status !== 'idle'
  const saved = data.progress[id]
  const position = isCurrent ? player.position : saved && !saved.completedAt ? saved.position : 0
  const playing = isCurrent && player.status === 'playing'

  useEffect(() => {
    if (!playing) return
    textRef.current
      ?.querySelector(`[data-index="${position}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [playing, position])

  if (!story) {
    return (
      <div className="container page">
        <EmptyState
          icon="books"
          title="História não encontrada"
          text="Ela pode ter saído do catálogo."
          action={<Link to="/historias" className="btn btn--primary btn--sm">Ver histórias</Link>}
        />
      </div>
    )
  }

  const locked = !catalog.canAccess(story, data.plan)
  const favorite = data.favorites.includes(story.id)
  const times = story.paragraphs.map(estimateSeconds)
  const totalSeconds = times.reduce((a, b) => a + b, 0)
  const elapsed = times.slice(0, position).reduce((a, b) => a + b, 0)
  const total = story.paragraphs.length

  const togglePlay = () => (isCurrent ? player.toggle() : player.play(story.id))
  const seek = (to: number) => (isCurrent ? player.seek(to) : player.play(story.id, Math.max(0, Math.min(total - 1, to))))
  const toggleFavorite = () => {
    const added = actions.toggleFavorite(story.id)
    toast(added ? 'Adicionada aos favoritos' : 'Removida dos favoritos', added ? 'success' : 'info')
  }

  return (
    <div className="container page story">
      <header className="story__bar">
        <BackButton fallback="/historias" />
        <button
          className={`icon-btn story__fav${favorite ? ' is-on' : ''}`}
          onClick={toggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Icon name="star" size={26} />
        </button>
      </header>

      <div className="story__layout">
        <section className="story__player card">
          <StoryCover story={story} className="story__cover" />
          <div className="story__heading">
            <h1 className="story__title">{story.title}</h1>
            <p className="story__meta">
              <span><Icon name="clock" size={15} /> {storyMinutes(story)} min</span>
              <span>{story.ageRange[0]}–{story.ageRange[1]} anos</span>
              {story.tags.slice(0, 1).map((t) => <span key={t}>{TAG_LABEL[t]}</span>)}
            </p>
          </div>

          {locked ? (
            <div className="story__locked">
              <Icon name="crown" size={28} />
              <p>
                <strong>Esta história faz parte dos planos completos.</strong>
                <br />O plano gratuito inclui 3 histórias com a sua voz.
              </p>
              <Link to="/planos" className="btn btn--plan btn--block">
                Ver planos completos
              </Link>
            </div>
          ) : (
            <>
              <p className={`story__voice${data.voice.status === 'ready' ? '' : ' is-default'}`}>
                <Icon name={data.voice.status === 'ready' ? 'heart' : 'mic'} size={16} />
                {data.voice.status === 'ready' ? 'Narrado com a sua voz' : 'Narração padrão — grave sua voz para personalizar'}
              </p>

              <div className="story__timeline">
                <input
                  type="range"
                  className="range"
                  min={0}
                  max={total - 1}
                  step={1}
                  value={Math.min(position, total - 1)}
                  onChange={(e) => seek(Number(e.target.value))}
                  aria-label="Trecho da história"
                  aria-valuetext={`Trecho ${position + 1} de ${total}`}
                  style={{ '--pct': `${(position / Math.max(1, total - 1)) * 100}%` } as CSSProperties}
                />
                <div className="story__times">
                  <span>{clock(elapsed)}</span>
                  <span>{clock(totalSeconds)}</span>
                </div>
              </div>

              {isCurrent && player.loading && (
                <p className="story__loading" role="status">
                  <span className="story__spinner" aria-hidden="true" />
                  Preparando a narração com a sua voz… (só na primeira vez)
                </p>
              )}

              <div className="story__controls">
                <button className="icon-btn story__skip" onClick={() => seek(position - 1)} aria-label="Trecho anterior" disabled={position === 0}>
                  <Icon name="rewind" size={26} />
                </button>
                <button className="story__play" onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Ouvir'}>
                  <Icon name={playing ? 'pause' : 'play'} size={34} />
                </button>
                <button className="icon-btn story__skip" onClick={() => seek(position + 1)} aria-label="Próximo trecho" disabled={position >= total - 1}>
                  <Icon name="forward" size={26} />
                </button>
              </div>

              <Link to={`/sono?historia=${story.id}`} className="btn btn--secondary btn--block story__sleep">
                <Icon name="moon" size={20} />
                Ouvir no modo hora de dormir
              </Link>
            </>
          )}
        </section>

        <section className="story__content">
          <div className="card story__about">
            <h2 className="section-title">Sobre a história</h2>
            <p>{story.summary}</p>
          </div>
          {!locked && (
            <div className="card story__text">
              <h2 className="section-title">Acompanhe a leitura</h2>
              <ol ref={textRef} className="story__paragraphs">
                {story.paragraphs.map(stripCues).map((p, i) => (
                  <li key={i} data-index={i} className={isCurrent && i === position ? 'is-current' : undefined}>
                    <button onClick={() => seek(i)} aria-label={`Ouvir a partir deste trecho: ${p}`}>
                      {p}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
