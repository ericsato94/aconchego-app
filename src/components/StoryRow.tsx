import { Link } from 'react-router-dom'
import type { Story } from '../types'
import { Icon } from './Icon'
import { StoryCover } from './StoryCover'
import './StoryRow.css'

interface Props {
  story: Story
  meta: string
  onPlay: () => void
  playing?: boolean
}

/** Linha de lista com capa, título, metadados e botão de play ("Histórias recentes"). */
export function StoryRow({ story, meta, onPlay, playing }: Props) {
  return (
    <div className="story-row">
      <Link to={`/historias/${story.id}`} className="story-row__link">
        <StoryCover story={story} className="story-row__cover" />
        <span className="story-row__text">
          <span className="story-row__title">{story.title}</span>
          <span className="story-row__meta">{meta}</span>
        </span>
      </Link>
      <button
        className="play-btn play-btn--soft story-row__play"
        onClick={onPlay}
        aria-label={`${playing ? 'Pausar' : 'Ouvir'} ${story.title}`}
      >
        <Icon name={playing ? 'pause' : 'play'} size={18} />
      </button>
    </div>
  )
}
