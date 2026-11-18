import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Confetti } from '../../components/Confetti'
import { Icon } from '../../components/Icon'
import { coupon, copyCode } from '../../quiz/coupon'
import { mmss, useCountdown } from '../../quiz/useCountdown'
import './DiscountWheel.css'

const C = coupon.config
const SLICE = 360 / C.slices.length
const COLORS = ['#FFD54F', '#2F9BEF', '#FF5E92', '#5B6CF0', '#FF8A3D', '#26A69A']
/** Posição inicial (a fatia premiada fora do ponteiro) e quantas voltas a roleta dá. */
const START = -SLICE * 2.5
const TURNS = 6

type Phase = 'ready' | 'spinning' | 'won' | 'coupon'

/** Texto de cada fatia na vertical, ao longo do raio (do centro para a borda), a esta distância do centro. */
const LABEL_R = 88

/** Fatia em SVG: centro (150,150), raio 140, ângulos em graus a partir do topo, no sentido horário. */
function slicePath(i: number) {
  const a0 = ((i * SLICE - SLICE / 2 - 90) * Math.PI) / 180
  const a1 = ((i * SLICE + SLICE / 2 - 90) * Math.PI) / 180
  const p = (a: number) => `${150 + 140 * Math.cos(a)} ${150 + 140 * Math.sin(a)}`
  return `M150 150 L${p(a0)} A140 140 0 0 1 ${p(a1)} Z`
}

/**
 * Roleta de desconto da oferta. A primeira fatia (o desconto do cupom) é sempre a que sai;
 * o título deixa claro que todo mundo ganha. Ao resgatar, o cupom vale por `minutes` na página.
 */
export function DiscountWheel({ onClose }: { onClose: (expiresAt: number | null) => void }) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [angle, setAngle] = useState(START)
  const [until, setUntil] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const left = Math.min(useCountdown(until), C.minutes * 60_000)
  const primary = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primary.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(coupon.activeUntil())
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  useEffect(() => {
    primary.current?.focus()
  }, [phase])

  const spin = () => {
    // Para na fatia premiada (0° = topo), com um pequeno desvio para não parecer milimétrico.
    const jitter = (Math.random() - 0.5) * SLICE * 0.5
    setAngle(TURNS * 360 + jitter)
    setPhase('spinning')
  }

  const redeem = () => {
    setUntil(coupon.redeem())
    setPhase('coupon')
  }

  const copy = async () => {
    if (await copyCode()) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    }
  }

  return createPortal(
    <div className="wheel" role="dialog" aria-modal="true" aria-labelledby="wheel-title">
      {phase === 'won' && <Confetti />}
      <div className="wheel__panel">
        <button className="wheel__close" onClick={() => onClose(coupon.activeUntil())} aria-label="Fechar">
          <Icon name="close" size={22} />
        </button>
        <p className="wheel__eyebrow">Black Friday</p>
        <h2 id="wheel-title" className="wheel__title">{C.title}</h2>

        {phase !== 'coupon' && (
          <>
            <p className="wheel__sub">{C.subtitle}</p>
            <div className="wheel__stage">
              <span className="wheel__pointer" aria-hidden="true" />
              <svg
                className="wheel__disc"
                viewBox="0 0 300 300"
                style={{ transform: `rotate(${angle}deg)` }}
                onTransitionEnd={() => phase === 'spinning' && setPhase('won')}
                aria-hidden="true"
              >
                <circle cx="150" cy="150" r="148" fill="#FFF6D6" />
                {C.slices.map((label, i) => (
                  <g key={label}>
                    <path d={slicePath(i)} fill={COLORS[i % COLORS.length]} stroke="#FFF6D6" strokeWidth="3" />
                    <text
                      x="150"
                      y={150 - LABEL_R}
                      dominantBaseline="middle"
                      transform={`rotate(${i * SLICE} 150 150) rotate(-90 150 ${150 - LABEL_R})`}
                      textAnchor="middle"
                      className={i === 0 ? 'wheel__label wheel__label--best' : 'wheel__label'}
                    >
                      {label}
                    </text>
                  </g>
                ))}
                <circle cx="150" cy="150" r="30" fill="#0B1330" stroke="#FFD54F" strokeWidth="5" />
              </svg>
            </div>
          </>
        )}

        {phase === 'ready' && (
          <button ref={primary} className="btn btn--sun btn--block wheel__cta" onClick={spin}>
            {C.spin}
          </button>
        )}
        {phase === 'spinning' && <p className="wheel__status" aria-live="polite">Girando…</p>}
        {phase === 'won' && (
          <div className="wheel__won" aria-live="polite">
            <p className="wheel__won-title">{C.wonTitle}</p>
            <p className="wheel__won-text">{C.wonText}</p>
            <button ref={primary} className="btn btn--sun btn--block wheel__cta" onClick={redeem}>
              {C.redeem}
            </button>
          </div>
        )}

        {phase === 'coupon' && (
          <div className="wheel__coupon">
            <p className="wheel__won-text">{C.wonText}</p>
            <span className="wheel__coupon-label">{C.couponLabel}</span>
            <button className="wheel__code" onClick={copy} aria-label={`Copiar o cupom ${C.code}`}>
              <strong>{C.code}</strong>
              <span>{copied ? C.copied : C.copy}</span>
            </button>
            <p className="wheel__howto">{C.howTo}</p>
            <p className="wheel__timer">
              {C.hurry} <strong>{mmss(left)}</strong>
            </p>
            <button
              ref={primary}
              className="btn btn--sun btn--block wheel__cta"
              onClick={async () => {
                await copy()
                onClose(until)
              }}
            >
              {C.use}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
