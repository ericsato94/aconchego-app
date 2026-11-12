import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './Tour.css'

export interface TourStep {
  /** Seletor do elemento destacado (ex.: '[data-tour="voice"]'). */
  target: string
  title: string
  text: string
}

const PAD = 8
const GAP = 14
const CARD_W = 340

/** Primeiro elemento visível que corresponde ao seletor (o menu existe na barra lateral e na barra de baixo). */
function visible(selector: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
  })
}

/**
 * Tour guiado: escurece a tela, ilumina um elemento por vez e mostra um card ao lado,
 * com setinha apontando para onde tocar. Passos cujo elemento não está na tela são pulados.
 */
export function Tour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [active] = useState(() => steps.filter((s) => visible(s.target)))
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [cardH, setCardH] = useState(180)
  const cardRef = useRef<HTMLDivElement>(null)
  const step = active[index]

  // Rola até o elemento da vez e acompanha a posição dele (rolagem, teclado, giro da tela).
  useEffect(() => {
    if (!step) return
    const el = visible(step.target)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    let frame = 0
    let last = ''
    const follow = () => {
      const r = visible(step.target)?.getBoundingClientRect()
      const key = r ? `${r.top}|${r.left}|${r.width}|${r.height}` : ''
      if (key !== last) {
        last = key
        setRect(r ?? null)
      }
      frame = requestAnimationFrame(follow)
    }
    follow()
    return () => cancelAnimationFrame(frame)
  }, [step])

  const ready = rect !== null
  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
    cardRef.current?.focus()
  }, [index, ready])

  const next = useCallback(() => (index + 1 < active.length ? setIndex(index + 1) : onDone()), [index, active.length, onDone])
  const back = () => setIndex((i) => Math.max(0, i - 1))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [next, onDone])

  useEffect(() => {
    if (!active.length) onDone()
  }, [active.length, onDone])

  if (!step || !rect) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  // Destaque com folga em volta, sem passar das bordas da tela (ex.: itens do menu de baixo).
  const hx0 = Math.max(4, rect.left - PAD)
  const hy0 = Math.max(4, rect.top - PAD)
  const hx1 = Math.min(vw - 4, rect.right + PAD)
  const hy1 = Math.min(vh - 4, rect.bottom + PAD)
  const hole = { top: hy0, left: hx0, width: hx1 - hx0, height: hy1 - hy0 }
  const cardW = Math.min(CARD_W, vw - 32)
  // Card abaixo do elemento; se não couber, acima; se nenhum couber, no rodapé da tela.
  const below = hole.top + hole.height + GAP + cardH <= vh - 16
  const above = hole.top - GAP - cardH >= 16
  const top = below ? hole.top + hole.height + GAP : above ? hole.top - GAP - cardH : vh - cardH - 16
  const centerX = rect.left + rect.width / 2
  const left = Math.min(Math.max(16, centerX - cardW / 2), vw - cardW - 16)
  const arrowX = Math.min(Math.max(24, centerX - left), cardW - 24)
  const side = below ? 'top' : above ? 'bottom' : null

  return createPortal(
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour__hole" style={hole} />
      <div
        ref={cardRef}
        className="tour__card"
        style={{ top, left, width: cardW }}
        tabIndex={-1}
        aria-live="polite"
      >
        {side && <span className={`tour__arrow tour__arrow--${side}`} style={{ left: arrowX }} aria-hidden="true" />}
        <p className="tour__count">
          {index + 1} de {active.length}
        </p>
        <h2 id="tour-title" className="tour__title">
          {step.title}
        </h2>
        <p className="tour__text">{step.text}</p>
        <div className="tour__actions">
          <button className="tour__skip" onClick={onDone}>
            Pular
          </button>
          <div className="tour__dots" aria-hidden="true">
            {active.map((s, i) => (
              <span key={s.target} className={i === index ? 'is-on' : undefined} />
            ))}
          </div>
          {index > 0 && (
            <button className="btn btn--secondary btn--sm" onClick={back}>
              Voltar
            </button>
          )}
          <button className="btn btn--primary btn--sm" onClick={next}>
            {index + 1 < active.length ? 'Próximo' : 'Começar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
