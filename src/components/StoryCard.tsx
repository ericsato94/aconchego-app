import { Link } from 'react-router-dom'
import type { Story } from '../types'
import { storyMinutes } from '../services/catalog'
import { Icon } from './Icon'
import { StoryCover } from './StoryCover'
import './StoryCard.css'

interface Props {
  story: Story
  locked?: boolean
  favorite?: boolean
}

/** Card vertical (carrossel "Histórias gratuitas" e grades da biblioteca). */
export function StoryCard({ story, locked, favorite }: Props) {
  return (
    <Link to={`/historias/${story.id}`} className="story-card" aria-label={`${story.title}${locked ? ' (premium)' : ''}`}>
      <div className="story-card__media">
        <StoryCover story={story} className="story-card__cover" />
        {locked && (
          <span className="story-card__lock" title="Disponível nos planos completos">
            <Icon name="crown" size={14} />
          </span>
        )}
        {favorite && (
          <span className="story-card__fav" title="Favorita">
            <Icon name="star" size={14} />
          </span>
        )}
      </div>
      <div className="story-card__body">
        <h3 className="story-card__title">{story.title}</h3>
        <span className="story-card__meta">
          <Icon name="clock" size={14} />
          {storyMinutes(story)} min
        </span>
      </div>
    </Link>
  )
}
