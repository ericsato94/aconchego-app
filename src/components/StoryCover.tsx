import type { Story } from '../types'
import { Icon } from './Icon'
import './StoryCover.css'

interface Props {
  story: Story
  className?: string
}

/** Capa da história: ilustração original quando existe; senão, arte neutra com a paleta da marca. */
export function StoryCover({ story, className = '' }: Props) {
  const { cover } = story
  if (cover.kind === 'image') {
    return (
      <div className={`cover ${className}`} style={{ background: cover.bg }}>
        <img src={cover.src} alt="" loading="lazy" draggable={false} />
      </div>
    )
  }
  return (
    <div
      className={`cover cover--art ${className}`}
      style={{ background: `linear-gradient(160deg, ${cover.from}, ${cover.to})` }}
    >
      <span className="cover__dot cover__dot--1" />
      <span className="cover__dot cover__dot--2" />
      <span className="cover__dot cover__dot--3" />
      {cover.image ? (
        <img className="cover__figure" src={cover.image} alt="" loading="lazy" draggable={false} />
      ) : (
        <Icon name={cover.icon} className="cover__icon" />
      )}
      <span className="cover__cloud" />
    </div>
  )
}
