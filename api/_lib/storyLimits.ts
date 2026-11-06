import { supabaseAdmin } from './supabaseAdmin.js'

/**
 * Limites de criação de histórias (preço × custo — ver README).
 * Custo por história ≈ R$ 0,60–0,75 (texto + filtros + narração com a voz clonada).
 */
export const STORY_LIMITS = {
  /** Plano grátis: criar histórias personalizadas é exclusivo dos planos pagos. */
  freeTotal: 0,
  /** Planos Mensal e Anual: histórias por mês. */
  paidPerMonth: 6,
  /** E-mails do time (testes). */
  teamPerMonth: 50,
  /** Histórias prontas por dia (todos os planos pagos). */
  perDay: 2,
  /** Tentativas por dia, incluindo as bloqueadas pelos filtros (evita abuso). */
  attemptsPerDay: 5,
} as const

/** Conta ilimitada: número alto em vez de Infinity (que vira null no JSON enviado ao app). */
const UNLIMITED = 9999

const startOfMonthSP = () => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const offset = new Date().getTime() - now.getTime()
  return new Date(new Date(now.getFullYear(), now.getMonth(), 1).getTime() + offset).toISOString()
}

const startOfDaySP = () => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const offset = new Date().getTime() - now.getTime()
  return new Date(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() + offset).toISOString()
}

export interface StoryUsage {
  plan: 'gratis' | 'mensal' | 'anual' | 'time' | 'ilimitado'
  used: number
  limit: number
  period: 'total' | 'mes'
  today: number
  dayLimit: number
  attemptsToday: number
}

export async function storyUsage(userId: string, plan: StoryUsage['plan']): Promise<StoryUsage> {
  const admin = supabaseAdmin()
  const count = async (since: string | null, statuses: string[]) => {
    let q = admin.from('story_generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).in('status', statuses)
    if (since) q = q.gte('created_at', since)
    const { count: n, error } = await q
    if (error) throw error
    return n ?? 0
  }
  const free = plan === 'gratis'
  const unlimited = plan === 'ilimitado'
  const [used, today, attemptsToday] = await Promise.all([
    count(free ? null : startOfMonthSP(), ['ready']),
    count(startOfDaySP(), ['ready']),
    count(startOfDaySP(), ['ready', 'blocked', 'failed']),
  ])
  return {
    plan,
    used,
    limit: free ? STORY_LIMITS.freeTotal : unlimited ? UNLIMITED : plan === 'time' ? STORY_LIMITS.teamPerMonth : STORY_LIMITS.paidPerMonth,
    period: free ? 'total' : 'mes',
    today,
    dayLimit: free ? STORY_LIMITS.freeTotal : unlimited ? UNLIMITED : STORY_LIMITS.perDay,
    attemptsToday,
  }
}

export const FREE_PLAN_MESSAGE = 'Criar histórias personalizadas está disponível nos planos Mensal e Anual.'

/** Mensagem de bloqueio por limite (ou null se ainda pode criar). */
export function limitMessage(u: StoryUsage) {
  if (u.plan === 'gratis') return FREE_PLAN_MESSAGE
  if (u.plan === 'ilimitado') return null
  if (u.used >= u.limit) return `Você já criou as ${u.limit} histórias deste mês. O limite renova no dia 1º.`
  if (u.today >= u.dayLimit) return 'Você já criou as histórias de hoje. Amanhã tem mais!'
  if (u.attemptsToday >= STORY_LIMITS.attemptsPerDay) return 'Muitas tentativas hoje. Tente de novo amanhã.'
  return null
}
