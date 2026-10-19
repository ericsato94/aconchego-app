import { supabaseAdmin } from './supabaseAdmin.js'

/**
 * Assinaturas pagas, por e-mail do comprador (tabela entitlements, alimentada pelo webhook).
 * Liberam a voz clonada e as histórias pagas para a conta do app com o mesmo e-mail.
 */
export type PaidPlan = 'mensal' | 'anual'

/** Dias extras depois do vencimento, para a renovação ter tempo de chegar. */
const GRACE_DAYS = 3

const ACTIVATE = new Set(['purchase_approved', 'subscription_created', 'subscription_renewed', 'subscription_late_recovered', 'subscription_resumed'])
const CANCEL = new Set(['subscription_canceled'])
const REVOKE = new Set(['refund', 'chargeback'])

function periodEnd(from: Date, plan: PaidPlan) {
  const end = new Date(from)
  if (plan === 'anual') end.setFullYear(end.getFullYear() + 1)
  else end.setMonth(end.getMonth() + 1)
  end.setDate(end.getDate() + GRACE_DAYS)
  return end
}

/** Atualiza a assinatura a partir de um evento da plataforma. Retorna o que foi feito. */
export async function applyPaymentEvent(event: string, email: string, plan: PaidPlan | null, paidAt: Date, orderId: string | null) {
  const admin = supabaseAdmin()
  const { data: current } = await admin.from('entitlements').select('*').eq('email', email).maybeSingle()
  const now = new Date()

  if (ACTIVATE.has(event)) {
    const chosen: PaidPlan = plan ?? (current?.plan as PaidPlan | undefined) ?? 'mensal'
    const end = periodEnd(paidAt, chosen)
    // Nunca encurta um período já pago (ex.: aviso antigo chegando atrasado).
    const keep = current && new Date(current.current_period_end) > end ? current.current_period_end : end.toISOString()
    const { error } = await admin.from('entitlements').upsert({
      email,
      plan: chosen,
      status: 'active',
      current_period_end: keep,
      last_event: event,
      last_order_id: orderId,
      updated_at: now.toISOString(),
    })
    if (error) throw error
    return 'ativada'
  }
  if (!current) return 'ignorado'
  if (CANCEL.has(event)) {
    // Cancelou a renovação: o acesso continua até o fim do período pago.
    const { error } = await admin
      .from('entitlements')
      .update({ status: 'canceled', last_event: event, last_order_id: orderId, updated_at: now.toISOString() })
      .eq('email', email)
    if (error) throw error
    return 'cancelada'
  }
  if (REVOKE.has(event)) {
    // Reembolso ou chargeback: corta o acesso na hora.
    const { error } = await admin
      .from('entitlements')
      .update({ status: 'revoked', current_period_end: now.toISOString(), last_event: event, last_order_id: orderId, updated_at: now.toISOString() })
      .eq('email', email)
    if (error) throw error
    return 'revogada'
  }
  return 'ignorado'
}

/** Plano pago em vigor para o e-mail (ou null). */
export async function activePlan(email: string): Promise<{ plan: PaidPlan; until: string } | null> {
  if (!email) return null
  const { data } = await supabaseAdmin()
    .from('entitlements')
    .select('plan, status, current_period_end')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  if (!data || data.status === 'revoked' || new Date(data.current_period_end) <= new Date()) return null
  return { plan: (data.plan as PaidPlan) ?? 'mensal', until: data.current_period_end }
}
