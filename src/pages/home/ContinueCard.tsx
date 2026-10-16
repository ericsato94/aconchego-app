import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { StoryCover } from '../../components/StoryCover'
import { remainingMinutes } from '../../services/catalog'
import { useApp } from '../../store/appContext'
import { usePlayer } from '../../store/playerContext'
import type { Story } from '../../types'

export function ContinueCard({ story }: { story: Story }) {
  const { data } = useApp()
  const player = usePlayer()
  const progress = data.progress[story.id]
  const position = progress?.position ?? 0
  const total = progress?.total || story.paragraphs.length
  const isCurrent = player.storyId === story.id
  const playing = isCurrent && player.status === 'playing'

  return (
    <div className="continue card">
      <Link to={`/historias/${story.id}`} className="continue__cover-link" aria-label={story.title}>
        <StoryCover story={story} className="continue__cover" />
      </Link>
      <div className="continue__body">
        <Link to={`/historias/${story.id}`} className="continue__title">
          {story.title}
        </Link>
        <p className="continue__sub">{data.voice.status === 'ready' ? 'Narrado com a sua voz' : 'Narração padrão'}</p>
        <div className="continue__row">
          <div className="continue__progress">
            <div className="progress">
              <div className="progress__bar" style={{ width: `${(position / total) * 100}%` }} />
            </div>
            <span>{remainingMinutes(story, position)} min restantes</span>
          </div>
          <button
            className="play-btn"
            onClick={() => (isCurrent ? player.toggle() : player.play(story.id))}
            aria-label={playing ? 'Pausar' : `Continuar ${story.title}`}
          >
            <Icon name={playing ? 'pause' : 'play'} size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
