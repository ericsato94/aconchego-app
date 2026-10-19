import braveLion from '../../assets/covers/brave-lion.webp'
import castle from '../../assets/covers/castle.webp'
import fox from '../../assets/covers/fox.webp'
import lion from '../../assets/covers/lion.webp'
import panda from '../../assets/covers/panda.webp'
import river from '../../assets/covers/river.webp'
import star from '../../assets/covers/star.webp'
import whale from '../../assets/covers/whale.webp'
import lionReading from '../../assets/lion-reading.webp'
import lionSleeping from '../../assets/lion-sleeping.webp'
import type { QuizImageKey } from '../../quiz/config'

/** Imagens usadas nas respostas do quiz — as mesmas ilustrações do app. */
const IMAGES: Record<QuizImageKey, { src: string; bg: string; contain?: boolean }> = {
  castelo: { src: castle, bg: '#2d3f8a' },
  leao: { src: lion, bg: '#bfe3f7' },
  'leao-corajoso': { src: braveLion, bg: '#bfe3f7' },
  baleia: { src: whale, bg: '#9fd5f6' },
  raposa: { src: fox, bg: '#d9e9b7' },
  'leao-dormindo': { src: lionSleeping, bg: '#eaf5fd' },
  'leao-lendo': { src: lionReading, bg: '#dcf0fc', contain: true },
  estrelas: { src: star, bg: '#24387e' },
  lua: { src: panda, bg: '#2d4a9a' },
  musica: { src: river, bg: '#9fd5f6' },
}

export function QuizImage({ name, className = '' }: { name: QuizImageKey; className?: string }) {
  const image = IMAGES[name] ?? IMAGES.estrelas
  return (
    <span className={`quiz-img ${className}`} style={{ background: image.bg }}>
      <img src={image.src} alt="" draggable={false} style={image.contain ? { objectFit: 'contain', padding: '6%' } : undefined} />
    </span>
  )
}
