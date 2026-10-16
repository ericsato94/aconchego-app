import { elevenlabs } from '../_lib/elevenlabs.js'
import { json, requireUser, requireVoiceOwner, route } from '../_lib/http.js'
import { supabaseAdmin } from '../_lib/supabaseAdmin.js'

/**
 * DELETE /api/voices/:id — exclui a voz na ElevenLabs e tudo ligado a ela
 * (narrações geradas e gravações), exigência da LGPD.
 */
export const DELETE = route(async (request) => {
  const { id: userId } = await requireUser(request)
  const voiceId = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '')
  await requireVoiceOwner(voiceId, userId)

  await elevenlabs.deleteVoice(voiceId)

  const admin = supabaseAdmin()
  const { data: narrations } = await admin.from('narrations').select('storage_path').eq('voice_id', voiceId)
  const audioPaths = (narrations ?? []).map((n) => n.storage_path)
  if (audioPaths.length) await admin.storage.from('narrations').remove(audioPaths)

  const { data: recordings } = await admin.storage.from('recordings').list(userId)
  if (recordings?.length) await admin.storage.from('recordings').remove(recordings.map((f) => `${userId}/${f.name}`))

  // Apaga a voz; o cache de narrações sai junto (on delete cascade).
  const { error } = await admin.from('voices').delete().eq('voice_id', voiceId)
  if (error) throw error
  return json({ ok: true })
})
