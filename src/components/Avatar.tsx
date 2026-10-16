import lionHead from '../assets/lion-head.webp'
import './Avatar.css'

const TINTS = ['#e4f3fe', '#fff3d6', '#ffe6ee', '#eeeaff', '#e5f5e6']

interface Props {
  size?: number
  /** Usado para escolher a cor de fundo de forma estável. */
  seed?: string
  ring?: boolean
  label?: string
}

export function Avatar({ size = 48, seed = '', ring, label }: Props) {
  const tint = TINTS[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length]
  return (
    <span
      className={`avatar${ring ? ' avatar--ring' : ''}`}
      style={{ width: size, height: size, background: tint }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <img src={lionHead} alt="" draggable={false} />
    </span>
  )
}
