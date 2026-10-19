/** Tipos e acesso às métricas do painel (sempre pelo servidor, com o cookie de admin). */
export interface Metrics {
  days: number
  funnel: {
    started: number
    completed: number
    leads: number
    results: number
    sales: number
    checkout: number
    purchases: number
    revenue: number
  }
  steps: Array<{ step: number; questionId: string; sessions: number }>
  answers: Array<{ questionId: string; answer: string; sessions: number }>
  sources: Array<{ source: string; sessions: number; leads: number; purchases: number }>
  daily: Array<{ day: string; started: number; completed: number; leads: number; checkout: number; purchases: number }>
}

export class Unauthorized extends Error {}

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
  metrics: (days: number) => call<Metrics>(`/api/admin/metrics?days=${days}`),
}

export const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)
export const fmtPct = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
export const fmtInt = (value: number) => value.toLocaleString('pt-BR')
export const fmtMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
