import { timingSafeEqual, createHash } from 'node:crypto'
import { json, route } from '../_lib/http.js'
import { HttpError, supabaseAdmin } from '../_lib/supabaseAdmin.js'

/**
 * Funil do quiz de vendas. Todos os eventos ficam no banco (Supabase), nunca no navegador.
 *   POST /api/quiz/event     { sessionId, type, step?, questionId?, answer?, plan?, source? }
 *   POST /api/quiz/lead      { sessionId, name, email?, whatsapp?, consent, answers, identity }
 *   POST /api/quiz/purchase  aviso da plataforma de pagamento (cabeçalho x-quiz-secret)
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG = /^[a-z0-9-]{1,40}$/
const CLIENT_EVENTS = new Set([
  'quiz_started', 'question_answered', 'quiz_completed', 'result_viewed', 'sales_viewed', 'checkout_started',
])

const text = (value: unknown, max: number) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null

async function body(request: Request) {
  const raw = await request.text()
  if (raw.length > 8_000) throw new HttpError(413, 'Requisição grande demais.')
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new HttpError(400, 'Requisição inválida.')
  }
}

/** Garante a sessão; no início do quiz grava a origem do tráfego. */
async function ensureSession(sessionId: string, source?: Record<string, unknown>) {
  const row = {
    id: sessionId,
    utm_source: text(source?.utm_source, 80),
    utm_medium: text(source?.utm_medium, 80),
    utm_campaign: text(source?.utm_campaign, 120),
    referrer: text(source?.referrer, 300),
    landing_path: text(source?.landing, 200),
    device: ['mobile', 'tablet', 'desktop'].includes(String(source?.device)) ? String(source?.device) : null,
  }
  const { error } = await supabaseAdmin()
    .from('quiz_sessions')
    .upsert(row, { onConflict: 'id', ignoreDuplicates: !source })
  if (error) throw error
}

async function trackEvent(request: Request) {
  const b = await body(request)
  const sessionId = String(b.sessionId ?? '')
  const type = String(b.type ?? '')
  if (!UUID.test(sessionId) || !CLIENT_EVENTS.has(type)) throw new HttpError(400, 'Evento inválido.')
  const questionId = b.questionId == null ? null : String(b.questionId)
  const answer = b.answer == null ? null : String(b.answer)
  const plan = b.plan == null ? null : String(b.plan)
  if ((questionId && !SLUG.test(questionId)) || (answer && !SLUG.test(answer)) || (plan && !SLUG.test(plan))) {
    throw new HttpError(400, 'Evento inválido.')
  }
  const step = Number.isInteger(b.step) && Number(b.step) >= 1 && Number(b.step) <= 30 ? Number(b.step) : null

  await ensureSession(sessionId, type === 'quiz_started' ? (b.source as Record<string, unknown>) ?? {} : undefined)
  const { error } = await supabaseAdmin()
    .from('quiz_events')
    .insert({ session_id: sessionId, type, step, question_id: questionId, answer, plan })
  if (error) throw error
  return json({ ok: true }, 201)
}

async function saveLead(request: Request) {
  const b = await body(request)
  const sessionId = String(b.sessionId ?? '')
  const name = text(b.name, 80)
  const email = text(b.email, 160)?.toLowerCase() ?? null
  const whatsapp = text(b.whatsapp, 30)?.replace(/[^\d+]/g, '') || null
  if (!UUID.test(sessionId) || !name) throw new HttpError(400, 'Informe o seu nome.')
  if (!email && !whatsapp) throw new HttpError(400, 'Informe o WhatsApp ou o e-mail.')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new HttpError(400, 'Este e-mail não parece válido.')
  if (whatsapp && whatsapp.replace(/\D/g, '').length < 10) throw new HttpError(400, 'Confira o número de WhatsApp com DDD.')
  const answers = typeof b.answers === 'object' && b.answers ? b.answers : {}
  if (JSON.stringify(answers).length > 2_000) throw new HttpError(400, 'Respostas inválidas.')

  await ensureSession(sessionId)
  const admin = supabaseAdmin()
  const { error } = await admin.from('quiz_leads').upsert({
    session_id: sessionId,
    name,
    email,
    whatsapp,
    contact_consent: b.consent === true,
    answers,
    identity: text(b.identity, 40),
  })
  if (error) throw error
  const { error: eventError } = await admin.from('quiz_events').insert({ session_id: sessionId, type: 'lead_submitted' })
  if (eventError) throw eventError
  return json({ ok: true }, 201)
}

const sameSecret = (a: string, b: string) =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())

/** Compra confirmada pela plataforma de pagamento (identifica pela sessão do quiz ou pelo e-mail do cadastro). */
async function recordPurchase(request: Request) {
  const secret = process.env.QUIZ_WEBHOOK_SECRET
  if (!secret) throw new HttpError(503, 'Webhook de compras não configurado.')
  if (!sameSecret(request.headers.get('x-quiz-secret') ?? '', secret)) throw new HttpError(401, 'Não autorizado.')
  const b = await body(request)
  const admin = supabaseAdmin()

  let sessionId = UUID.test(String(b.sessionId ?? '')) ? String(b.sessionId) : null
  const email = text(b.email, 160)?.toLowerCase()
  if (!sessionId && email) {
    const { data } = await admin
      .from('quiz_leads')
      .select('session_id')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    sessionId = data?.session_id ?? null
  }
  if (!sessionId) return json({ ok: false, error: 'Compra sem sessão do quiz correspondente.' }, 202)

  const plan = text(b.plan, 40)
  const value = Number(b.value)
  await ensureSession(sessionId)
  const { error } = await admin.from('quiz_events').insert({
    session_id: sessionId,
    type: 'purchase',
    plan: plan && SLUG.test(plan) ? plan : null,
    value: Number.isFinite(value) && value >= 0 ? value : null,
  })
  if (error) throw error
  return json({ ok: true }, 201)
}

export const POST = route(async (request) => {
  const action = new URL(request.url).pathname.split('/').pop()
  if (action === 'event') return trackEvent(request)
  if (action === 'lead') return saveLead(request)
  if (action === 'purchase') return recordPurchase(request)
  throw new HttpError(404, 'Rota não encontrada.')
})
