/** Tipos e acesso às métricas do painel (sempre pelo servidor, com o cookie de admin). */
export interface Metrics {
  days: number
  from?: string
  to?: string
  funnel: {
    /** Abriram a página do quiz (antes de começar). Ausente até a migração do banco. */
    landing?: number
    started: number
    completed: number
    leads: number
    results: number
    sales: number
    /** Rolaram a oferta até os planos/preços. */
    engaged?: number
    checkout: number
    purchases: number
    revenue: number
  }
  steps: Array<{ step: number; questionId: string; sessions: number }>
  answers: Array<{ questionId: string; answer: string; sessions: number }>
  sources: Array<{ source: string; sessions: number; leads: number; purchases: number }>
  daily: Array<{ day: string; started: number; completed: number; leads: number; checkout: number; purchases: number }>
}

export type LeadStage = 'lead_submitted' | 'result_viewed' | 'sales_viewed' | 'offer_engaged' | 'checkout_started' | 'purchase'

export interface Lead {
  id: string
  name: string
  email: string | null
  whatsapp: string | null
  /** Aceitou receber contato (LGPD): só esses podem ser chamados. */
  consent: boolean
  createdAt: string
  identity: string | null
  answers: Record<string, string>
  source: string
  campaign: string | null
  stage: LeadStage
  plan: string | null
}

export class Unauthorized extends Error {}

/** Período do painel: dias de São Paulo no formato AAAA-MM-DD, de `from` até `to` (inclusive). */
export interface Range {
  from: string
  to: string
}

export type Preset = 'hoje' | 'ontem' | 7 | 30 | 90 | 'datas'

/** Hoje no fuso de São Paulo (AAAA-MM-DD). */
export const todaySP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

export const addDays = (day: string, n: number) => new Date(Date.parse(day) + n * 86_400_000).toISOString().slice(0, 10)

export function presetRange(preset: Exclude<Preset, 'datas'>, today: string): Range {
  if (preset === 'hoje') return { from: today, to: today }
  if (preset === 'ontem') return { from: addDays(today, -1), to: addDays(today, -1) }
  return { from: addDays(today, -(preset - 1)), to: today }
}

/** "18/11" */
export const fmtDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`

/** "Dia 18/11" ou "18/10 a 18/11" */
export const rangeLabel = (r: Range) => (r.from === r.to ? `Dia ${fmtDay(r.from)}` : `${fmtDay(r.from)} a ${fmtDay(r.to)}`)

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...init })
  const body = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (res.status === 401) throw new Unauthorized(body.error ?? 'Não autorizado.')
  if (!res.ok) throw new Error(body.error ?? `Erro ${res.status}`)
  return body
}

export const adminApi = {
  session: () => call<{ authenticated: boolean }>('/api/admin/session').then((r) => r.authenticated),
  login: (username: string, password: string) =>
    call('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  logout: () => call('/api/admin/logout', { method: 'POST' }),
  metrics: (r: Range) => call<Metrics>(`/api/admin/metrics?from=${r.from}&to=${r.to}`),
  leads: (r: Range) => call<{ leads: Lead[] }>(`/api/admin/leads?from=${r.from}&to=${r.to}`).then((res) => res.leads),
}

export const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)
export const fmtPct = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
export const fmtInt = (value: number) => value.toLocaleString('pt-BR')
export const fmtMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
