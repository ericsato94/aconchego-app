import type { Story } from '../types'
import './StoryCover.css'

interface Props {
  story: Story
  className?: string
}

/** Capa ilustrada da história. */
export function StoryCover({ story, className = '' }: Props) {
  const { cover } = story
  return (
    <div className={`cover ${className}`} style={{ background: cover.bg }}>
      <img src={cover.src} alt="" loading="lazy" draggable={false} style={cover.focus ? { objectPosition: cover.focus } : undefined} />
    </div>
  )
}
