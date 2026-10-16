import { createHash } from 'node:crypto'
import { elevenlabs, SETTINGS_VERSION, toSpeech } from './_lib/elevenlabs.js'
import { json, requireUser, requireVoiceOwner, route } from './_lib/http.js'
import { HttpError, supabaseAdmin } from './_lib/supabaseAdmin.js'

const MAX_TEXT = 4800
/** Quebra dupla entre parágrafos: gera uma pausa natural na narração. */
const PARAGRAPH_JOIN = '\n\n'
/** Validade do link do áudio entregue ao app. */
const SIGNED_URL_SECONDS = 60 * 60

/**
 * POST /api/narration { voiceId, speed, paragraphs[] }
 * Gera a história inteira numa única chamada (ritmo consistente) e guarda no Supabase;
 * nas próximas vezes devolve direto do cache, sem custo na ElevenLabs.
 * Resposta: { audioUrl, duration, starts[] } — starts = segundo em que cada parágrafo começa.
 */
export const POST = route(async (request) => {
  const { id: userId } = await requireUser(request)
  const body = (await request.json().catch(() => null)) as { voiceId?: string; speed?: number; paragraphs?: unknown } | null
  const voiceId = body?.voiceId ?? ''
  const speed = Number(body?.speed ?? 0.9)
  const original = Array.isArray(body?.paragraphs)
    ? body.paragraphs.filter((p): p is string => typeof p === 'string' && p.trim().length > 0).map((p) => p.trim())
    : []
  const size = original.reduce((n, p) => n + p.length, 0)
  if (!original.length || size > MAX_TEXT || !(speed >= 0.7 && speed <= 1.2)) throw new HttpError(400, 'Parâmetros inválidos.')
  await requireVoiceOwner(voiceId, userId)

  const paragraphs = original.map(toSpeech)
  const text = paragraphs.join(PARAGRAPH_JOIN)
  const key = createHash('sha256')
    .update(`${voiceId}\n${elevenlabs.modelId}@${speed.toFixed(2)}@${SETTINGS_VERSION}\n${text}`)
    .digest('hex')
    .slice(0, 32)

  const admin = supabaseAdmin()
  const bucket = admin.storage.from('narrations')
  const { data: cached } = await admin.from('narrations').select('storage_path, duration, starts').eq('key', key).maybeSingle()

  let meta = cached
  if (!meta) {
    const { audio, charStarts, duration } = await elevenlabs.narrate(voiceId, text, speed)
    // Converte a posição de cada parágrafo no texto em segundos de áudio.
    const starts: number[] = []
    let offset = 0
    for (const p of paragraphs) {
      starts.push(charStarts[offset] ?? starts[starts.length - 1] ?? 0)
      offset += p.length + PARAGRAPH_JOIN.length
    }
    const storagePath = `${voiceId}/${key}.mp3`
    const upload = await bucket.upload(storagePath, audio, { contentType: 'audio/mpeg', upsert: true })
    if (upload.error) throw upload.error
    meta = { storage_path: storagePath, duration, starts }
    const { error } = await admin.from('narrations').upsert({ key, voice_id: voiceId, ...meta })
    if (error) throw error
  }

  const { data: signed, error } = await bucket.createSignedUrl(meta.storage_path, SIGNED_URL_SECONDS)
  if (error || !signed) throw error ?? new HttpError(500, 'Falha ao preparar o áudio.')
  return json({ audioUrl: signed.signedUrl, duration: meta.duration, starts: meta.starts })
})
