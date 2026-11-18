import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { json, route } from '../_lib/http.js'
import { HttpError, supabaseAdmin } from '../_lib/supabaseAdmin.js'

/**
 * Painel de métricas — login validado só no servidor.
 *   POST /api/admin/login    { username, password } → cookie de sessão (HttpOnly, assinado)
 *   POST /api/admin/logout
 *   GET  /api/admin/session  → { authenticated }
 *   GET  /api/admin/metrics?from=AAAA-MM-DD&to=AAAA-MM-DD (ou ?days=7|30|90)
 * Credenciais nas variáveis ADMIN_USERNAME, ADMIN_PASSWORD e ADMIN_SESSION_SECRET.
 */
const COOKIE = 'aconchego_admin'
const SESSION_HOURS = 12
const ALLOWED_DAYS = new Set([7, 30, 90])

const digest = (value: string) => createHash('sha256').update(value).digest()
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b))

function config() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!username || !password || !secret || secret.length < 32) {
    throw new HttpError(503, 'Painel sem credenciais configuradas no servidor.')
  }
  return { username, password, secret }
}

const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url')

function sessionCookie(request: Request, value: string, maxAge: number) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}

function isAuthenticated(request: Request) {
  const { secret } = config()
  const cookie = request.headers.get('cookie') ?? ''
  const token = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
  if (!token) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature || Number(expires) < Date.now()) return false
  return same(signature, sign(`admin.${expires}`, secret))
}

async function login(request: Request) {
  const { username, password, secret } = config()
  const b = (await request.json().catch(() => ({}))) as { username?: unknown; password?: unknown }
  const ok = same(String(b.username ?? ''), username) && same(String(b.password ?? ''), password)
  if (!ok) {
    // Atraso fixo: dificulta tentativas em massa.
    await new Promise((r) => setTimeout(r, 800))
    throw new HttpError(401, 'Usuário ou senha incorretos.')
  }
  const expires = Date.now() + SESSION_HOURS * 3_600_000
  const value = `${expires}.${sign(`admin.${expires}`, secret)}`
  const response = json({ ok: true })
  response.headers.set('Set-Cookie', sessionCookie(request, value, SESSION_HOURS * 3600))
  return response
}

/** Hoje no fuso de São Paulo, no formato AAAA-MM-DD. */
const todaySP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
const DATE = /^\d{4}-\d{2}-\d{2}$/
const dayDiff = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)

/**
 * Período pedido pelo painel: `from` e `to` (AAAA-MM-DD, dias de São Paulo, inclusive) ou,
 * no formato antigo, `days` (os últimos N dias até hoje).
 */
function period(request: Request) {
  const q = new URL(request.url).searchParams
  const today = todaySP()
  if (q.has('from') || q.has('to')) {
    const from = q.get('from') ?? ''
    const to = q.get('to') ?? ''
    if (!DATE.test(from) || !DATE.test(to) || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
      throw new HttpError(400, 'Datas inválidas.')
    }
    if (from > to) throw new HttpError(400, 'A data inicial é depois da final.')
    if (dayDiff(from, to) > 366) throw new HttpError(400, 'Escolha um período de até 1 ano.')
    return { from, to, today }
  }
  const days = Number(q.get('days') ?? 30)
  if (!ALLOWED_DAYS.has(days)) throw new HttpError(400, 'Período inválido.')
  const from = new Date(Date.parse(today) - (days - 1) * 86_400_000).toISOString().slice(0, 10)
  return { from, to: today, today }
}

/** Início do dia (00:00 em São Paulo) como data/hora UTC. */
const startOfDaySP = (day: string) => new Date(`${day}T00:00:00-03:00`)

async function metrics(request: Request) {
  if (!isAuthenticated(request)) throw new HttpError(401, 'Entre para ver o painel.')
  const { from, to, today } = period(request)
  const admin = supabaseAdmin()
  const { data, error } = await admin.rpc('quiz_metrics_range', { p_from: from, p_to: to })
  if (!error) return json(data)
  // Banco ainda sem a função por data: períodos que terminam hoje ainda funcionam pela antiga.
  if (error.code === 'PGRST202' && to === today) {
    const old = await admin.rpc('quiz_metrics', { p_days: dayDiff(from, to) + 1 })
    if (old.error) throw old.error
    return json(old.data)
  }
  if (error.code === 'PGRST202') throw new HttpError(503, 'Para ver dias passados, rode a atualização do banco (metricas_por_data).')
  throw error
}

/** Ordem das etapas depois do cadastro: mostra até onde cada lead chegou. */
const STAGES = ['lead_submitted', 'result_viewed', 'sales_viewed', 'offer_engaged', 'checkout_started', 'purchase'] as const

/** GET /api/admin/leads?from=…&to=… — quem deixou contato no quiz, com origem e até onde chegou. */
async function leads(request: Request) {
  if (!isAuthenticated(request)) throw new HttpError(401, 'Entre para ver o painel.')
  const { from, to } = period(request)
  const since = startOfDaySP(from).toISOString()
  const until = new Date(startOfDaySP(to).getTime() + 86_400_000).toISOString()
  const admin = supabaseAdmin()
  const { data: rows, error } = await admin
    .from('quiz_leads')
    .select('session_id, name, email, whatsapp, contact_consent, answers, identity, created_at')
    .gte('created_at', since)
    .lt('created_at', until)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  const ids = (rows ?? []).map((r) => r.session_id)
  const [{ data: sessions }, { data: events }] = await Promise.all([
    ids.length ? admin.from('quiz_sessions').select('id, utm_source, utm_campaign, referrer').in('id', ids) : { data: [] },
    ids.length ? admin.from('quiz_events').select('session_id, type, plan').in('session_id', ids).in('type', [...STAGES]) : { data: [] },
  ])
  const list = (rows ?? []).map((r) => {
    const s = sessions?.find((x) => x.id === r.session_id)
    const ev = (events ?? []).filter((e) => e.session_id === r.session_id)
    const stage = [...STAGES].reverse().find((t) => ev.some((e) => e.type === t)) ?? 'lead_submitted'
    const referrerHost = s?.referrer ? s.referrer.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : null
    return {
      id: r.session_id,
      name: r.name,
      email: r.email,
      whatsapp: r.whatsapp,
      consent: r.contact_consent,
      createdAt: r.created_at,
      identity: r.identity,
      answers: r.answers,
      source: s?.utm_source || referrerHost || 'direto',
      campaign: s?.utm_campaign ?? null,
      stage,
      plan: ev.find((e) => e.type === 'checkout_started')?.plan ?? null,
    }
  })
  return json({ leads: list })
}

const action = (request: Request) => new URL(request.url).pathname.split('/').pop()

export const POST = route(async (request) => {
  const a = action(request)
  if (a === 'login') return login(request)
  if (a === 'logout') {
    const response = json({ ok: true })
    response.headers.set('Set-Cookie', sessionCookie(request, '', 0))
    return response
  }
  throw new HttpError(404, 'Rota não encontrada.')
})

export const GET = route(async (request) => {
  const a = action(request)
  if (a === 'session') return json({ authenticated: isAuthenticated(request) })
  if (a === 'metrics') return metrics(request)
  if (a === 'leads') return leads(request)
  throw new HttpError(404, 'Rota não encontrada.')
})
