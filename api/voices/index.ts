import { elevenlabs } from '../_lib/elevenlabs.js'
import { canCloneVoice, json, requireUser, route } from '../_lib/http.js'
import { HttpError, supabaseAdmin } from '../_lib/supabaseAdmin.js'

/**
 * POST /api/voices { name, paths[] } — cria a voz clonada.
 * As gravações já foram enviadas pelo app ao armazenamento (recordings/<user_id>/…);
 * aqui o servidor as busca e envia à ElevenLabs.
 */
/** GET /api/voices — o usuário logado pode criar voz clonada? */
export const GET = route(async (request) => {
  const user = await requireUser(request)
  return json({ allowed: canCloneVoice(user.email) })
})

export const POST = route(async (request) => {
  const { id: userId, email } = await requireUser(request)
  if (!canCloneVoice(email)) {
    throw new HttpError(403, 'A voz clonada está liberada só para o time durante os testes.')
  }
  const body = (await request.json().catch(() => null)) as { name?: string; paths?: unknown } | null
  const paths = Array.isArray(body?.paths) ? body.paths.filter((p): p is string => typeof p === 'string') : []
  if (!paths.length || paths.length > 4 || paths.some((p) => !p.startsWith(`${userId}/`) || p.includes('..'))) {
    throw new HttpError(400, 'Gravações inválidas.')
  }

  const admin = supabaseAdmin()
  const files = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await admin.storage.from('recordings').download(path)
      if (error || !data) throw new HttpError(400, 'Não encontramos a gravação enviada. Grave novamente.')
      return new File([data], path.split('/').pop() ?? 'amostra.webm', { type: data.type || 'audio/webm' })
    }),
  )

  const voiceId = await elevenlabs.createVoice(String(body?.name ?? 'Aconchego').slice(0, 80), files)
  const { error } = await admin.from('voices').insert({ voice_id: voiceId, user_id: userId, model: elevenlabs.modelId })
  if (error) {
    await elevenlabs.deleteVoice(voiceId).catch(() => undefined)
    throw error
  }
  return json({ voiceId }, 201)
})
