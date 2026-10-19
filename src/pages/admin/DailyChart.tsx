import { useEffect, useMemo, useRef, useState } from 'react'
import { fmtInt } from './metrics'

interface Point {
  day: string
  value: number
}

const H = 240
const PAD = { top: 16, right: 16, bottom: 28, left: 40 }

const dayLabel = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

/** Escala "redonda" para o eixo Y (0, 5, 10… ou 0, 20, 40…). */
function niceMax(max: number) {
  if (max <= 4) return 4
  const step = 10 ** Math.floor(Math.log10(max))
  const nice = [1, 2, 2.5, 5, 10].map((n) => n * step).find((v) => v * 4 >= max) ?? max
  return nice * 4
}

/** Uma série por vez (escolhida no seletor): área + linha, cruz e dica ao passar o dedo/mouse. */
export function DailyChart({ points, label }: { points: Point[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { x, y, max, ticks, line, area } = useMemo(() => {
    const top = niceMax(Math.max(0, ...points.map((p) => p.value)))
    const innerW = width - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const xf = (i: number) => PAD.left + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2)
    const yf = (v: number) => PAD.top + innerH - (v / top) * innerH
    const path = points.map((p, i) => `${i ? 'L' : 'M'}${xf(i).toFixed(1)},${yf(p.value).toFixed(1)}`).join(' ')
    return {
      x: xf,
      y: yf,
      max: top,
      ticks: [0, 1, 2, 3, 4].map((i) => (top / 4) * i),
      line: path,
      area: `${path} L${xf(points.length - 1)},${yf(0)} L${xf(0)},${yf(0)} Z`,
    }
  }, [points, width])

  const labelEvery = Math.max(1, Math.ceil(points.length / Math.floor((width - 60) / 56)))

  const onMove = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || !points.length) return
    const innerW = width - PAD.left - PAD.right
    const i = Math.round(((clientX - rect.left - PAD.left) / innerW) * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, i)))
  }

  const h = hover !== null ? points[hover] : null

  return (
    <div
      ref={ref}
      className="daily-chart"
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseLeave={() => setHover(null)}
      onTouchStart={(e) => onMove(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
    >
      <svg width={width} height={H} role="img" aria-label={`${label} por dia; máximo da escala ${fmtInt(max)}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="daily-chart__grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="daily-chart__axis" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {fmtInt(Math.round(t))}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text key={p.day} className="daily-chart__axis" x={x(i)} y={H - 8} textAnchor="middle">
              {dayLabel(p.day)}
            </text>
          ) : null,
        )}
        <path className="daily-chart__area" d={area} />
        <path className="daily-chart__line" d={line} />
        {h && hover !== null && (
          <g>
            <line className="daily-chart__cross" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} />
            <circle className="daily-chart__dot" cx={x(hover)} cy={y(h.value)} r={5} />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="daily-chart__tip"
          style={{ left: Math.min(width - 130, Math.max(0, x(hover) - 65)), top: Math.max(0, y(h.value) - 62) }}
        >
          <span>{dayLabel(h.day)}</span>
          <strong>
            {fmtInt(h.value)} <small>{label.toLowerCase()}</small>
          </strong>
        </div>
      )}
    </div>
  )
}
