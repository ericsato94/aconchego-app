import castle from '../../assets/covers/castle.webp'
import fox from '../../assets/covers/fox.webp'
import lion from '../../assets/covers/lion.webp'
import whale from '../../assets/covers/whale.webp'
import lionReading from '../../assets/lion-reading.webp'
import lionSleeping from '../../assets/lion-sleeping.webp'
import { Icon } from '../../components/Icon'
import type { QuizImageKey } from '../../quiz/config'

/** Imagens usadas nas respostas do quiz — as mesmas ilustrações do app. */
const PHOTOS: Partial<Record<QuizImageKey, { src: string; bg: string; contain?: boolean }>> = {
  castelo: { src: castle, bg: '#2d3f8a' },
  leao: { src: lion, bg: '#bfe3f7' },
  baleia: { src: whale, bg: '#9fd5f6' },
  raposa: { src: fox, bg: '#d9e9b7' },
  'leao-dormindo': { src: lionSleeping, bg: '#eaf5fd' },
  'leao-lendo': { src: lionReading, bg: '#dcf0fc', contain: true },
}

const ART: Partial<Record<QuizImageKey, { icon: 'star' | 'moon' | 'music'; from: string; to: string }>> = {
  estrelas: { icon: 'star', from: '#24387e', to: '#5a6fd6' },
  lua: { icon: 'moon', from: '#6a4fd8', to: '#a88bf8' },
  musica: { icon: 'music', from: '#3f9f57', to: '#7fd18a' },
}

export function QuizImage({ name, className = '' }: { name: QuizImageKey; className?: string }) {
  const photo = PHOTOS[name]
  if (photo) {
    return (
      <span className={`quiz-img ${className}`} style={{ background: photo.bg }}>
        <img src={photo.src} alt="" draggable={false} style={photo.contain ? { objectFit: 'contain', padding: '6%' } : undefined} />
      </span>
    )
  }
  const art = ART[name] ?? ART.estrelas!
  return (
    <span className={`quiz-img quiz-img--art ${className}`} style={{ background: `linear-gradient(160deg, ${art.from}, ${art.to})` }}>
      <Icon name={art.icon} />
    </span>
  )
}
