/** Anel de progresso circular (Branding Book: "Barra de progresso — 72% da meta"). */
export function ScoreRing({ value, label, size = 112 }: { value: number; label: string; size?: number }) {
  const r = 44
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${value}% ${label}`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#dbe9f7" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--c-primary)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.8s var(--ease)' }}
      />
      <text x="50" y="50" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="22" fill="var(--c-navy)">
        {value}%
      </text>
      <text x="50" y="66" textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--c-text-muted)">
        {label}
      </text>
    </svg>
  )
}
