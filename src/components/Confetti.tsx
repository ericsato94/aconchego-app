import type { CSSProperties } from 'react'
import './Confetti.css'

const COLORS = ['#FFD54F', '#FF8A3D', '#FF5E92', '#8B5CF6', '#4FC3F7', '#66BB6A']

/** Peças do confete (sorteadas uma vez ao carregar o módulo). */
const PIECES = Array.from({ length: 70 }, (_, i) => ({
  left: Math.random() * 100,
  delay: Math.random() * 0.6,
  duration: 2.2 + Math.random() * 1.6,
  drift: (Math.random() - 0.5) * 160,
  spin: 360 + Math.random() * 720,
  color: COLORS[i % COLORS.length],
  round: i % 3 === 0,
}))

/** Confete em CSS (sem bibliotecas); some sozinho e respeita "reduzir movimento". */
export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {PIECES.map((p, i) => (
        <i
          key={i}
          className={p.round ? 'is-round' : undefined}
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
