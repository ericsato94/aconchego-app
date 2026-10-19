import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { json, route } from '../_lib/http.js'
import { HttpError, supabaseAdmin } from '../_lib/supabaseAdmin.js'

/**
 * Painel de métricas — login validado só no servidor.
 *   POST /api/admin/login    { username, password } → cookie de sessão (HttpOnly, assinado)
 *   POST /api/admin/logout
 *   GET  /api/admin/session  → { authenticated }
 *   GET  /api/admin/metrics?days=7|30|90
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

async function metrics(request: Request) {
  if (!isAuthenticated(request)) throw new HttpError(401, 'Entre para ver o painel.')
  const days = Number(new URL(request.url).searchParams.get('days') ?? 30)
  if (!ALLOWED_DAYS.has(days)) throw new HttpError(400, 'Período inválido.')
  const { data, error } = await supabaseAdmin().rpc('quiz_metrics', { p_days: days })
  if (error) throw error
  return json(data)
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
  throw new HttpError(404, 'Rota não encontrada.')
})
