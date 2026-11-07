import { elevenlabs } from '../_lib/elevenlabs.js'
import { accountAccess, json, requireUser, route } from '../_lib/http.js'
import { HttpError, supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { newVoiceId, withTemporaryVoice } from '../_lib/voices.js'

/**
 * POST /api/voices { name, paths[] } — registra a voz clonada.
 * As gravações já foram enviadas pelo app ao armazenamento (recordings/<user_id>/…). A voz não fica
 * na ElevenLabs: é recriada a partir delas só na hora de narrar (ver _lib/voices.ts). Aqui fazemos
 * uma clonagem de teste para garantir que as gravações servem, e guardamos o registro.
 */
/** GET /api/voices — acesso da conta: pode criar voz clonada? qual plano pago está em vigor? */
export const GET = route(async (request) => {
  const user = await requireUser(request)
  return json(await accountAccess(user.email))
})

export const POST = route(async (request) => {
  const { id: userId, email } = await requireUser(request)
  if (!(await accountAccess(email)).allowed) {
    throw new HttpError(403, 'A voz clonada faz parte dos planos Mensal e Anual. Assine para gravar a sua voz.')
  }
  const body = (await request.json().catch(() => null)) as { name?: string; paths?: unknown } | null
  const paths = Array.isArray(body?.paths) ? body.paths.filter((p): p is string => typeof p === 'string') : []
  if (!paths.length || paths.length > 4 || paths.some((p) => !p.startsWith(`${userId}/`) || p.includes('..'))) {
    throw new HttpError(400, 'Gravações inválidas.')
  }

  // Clonagem de teste (desfeita na hora): falha aqui se a gravação não servir.
  await withTemporaryVoice(paths, async () => undefined)

  const voiceId = newVoiceId()
  const { error } = await supabaseAdmin()
    .from('voices')
    .insert({ voice_id: voiceId, user_id: userId, model: elevenlabs.modelId, recording_paths: paths, name: String(body?.name ?? '').slice(0, 80) || null })
  if (error) throw error
  return json({ voiceId }, 201)
})
