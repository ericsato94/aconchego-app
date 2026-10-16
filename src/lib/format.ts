import type { ListenEntry } from '../types'

export const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0')

/** 75 → "01:15" */
export const clock = (seconds: number) => `${pad2(seconds / 60)}:${pad2(seconds % 60)}`

/** 5040 → "1h 24min" */
export function duration(seconds: number) {
  const minutes = Math.round(seconds / 60)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return m ? `${h}h ${pad2(m)}min` : `${h}h`
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

export function daysAgoLabel(iso: string) {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((start(new Date()) - start(new Date(iso))) / 86_400_000)
  if (diff <= 0) return 'hoje'
  if (diff === 1) return 'ontem'
  return `${diff} dias atrás`
}

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  return daysAgoLabel(iso)
}

/** Dias consecutivos com escuta, contando até hoje (ou ontem, se hoje ainda não houve). */
export function streakDays(history: ListenEntry[]) {
  const days = new Set(history.map((h) => dayKey(new Date(h.at))))
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Últimos 7 dias (mais antigo → hoje) com indicação de escuta. */
export function lastWeek(history: ListenEntry[]) {
  const days = new Set(history.map((h) => dayKey(new Date(h.at))))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      day: d.getDate(),
      active: days.has(dayKey(d)),
      today: i === 6,
    }
  })
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
