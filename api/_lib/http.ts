import { ElevenLabsError } from './elevenlabs.js'
import { activePlan } from './entitlements.js'
import { HttpError, supabaseAdmin } from './supabaseAdmin.js'

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/** Envolve um handler: converte erros conhecidos em respostas com mensagem em português. */
export function route(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (err) {
      if (err instanceof HttpError || err instanceof ElevenLabsError) return json({ error: err.message }, err.status)
      console.error(err)
      return json({ error: 'Erro inesperado no servidor.' }, 500)
    }
  }
}

/** Confere o login (token do Supabase enviado pelo app). */
export async function requireUser(request: Request): Promise<{ id: string; email: string }> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'Entre na sua conta para continuar.')
  const { data, error } = await supabaseAdmin().auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Sessão expirada. Entre novamente.')
  return { id: data.user.id, email: (data.user.email ?? '').toLowerCase() }
}

/**
 * E-mails do time com acesso liberado sem pagar (testes).
 * VOICE_ALLOWED_EMAILS: lista separada por vírgula; "*" libera para todos; vazio = ninguém.
 */
export function isTeamEmail(email: string) {
  const list = (process.env.VOICE_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes('*') || (email !== '' && list.includes(email))
}

/**
 * Acesso da conta: plano pago (pelo webhook da plataforma de pagamento, mesmo e-mail) ou time.
 * Só quem tem acesso cria voz clonada (gasta créditos da ElevenLabs) e ouve as histórias pagas.
 */
export async function accountAccess(email: string) {
  const paid = await activePlan(email)
  if (paid) return { allowed: true, plan: paid.plan, until: paid.until, source: 'assinatura' as const }
  if (isTeamEmail(email)) return { allowed: true, plan: 'anual' as const, until: null, source: 'time' as const }
  return { allowed: false, plan: null, until: null, source: null }
}

/** Garante que a voz pertence ao usuário. */
export async function requireVoiceOwner(voiceId: string, userId: string) {
  if (!/^[A-Za-z0-9]{8,40}$/.test(voiceId)) throw new HttpError(400, 'Voz inválida.')
  const { data, error } = await supabaseAdmin().from('voices').select('user_id').eq('voice_id', voiceId).maybeSingle()
  if (error) throw error
  if (!data || data.user_id !== userId) throw new HttpError(404, 'Voz não encontrada.')
}
