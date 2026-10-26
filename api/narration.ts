import { createHash } from 'node:crypto'
import { elevenlabs, SETTINGS_VERSION, toSpeech } from './_lib/elevenlabs.js'
import { accountAccess, json, requireUser, requireVoiceOwner, route } from './_lib/http.js'
import { HttpError, supabaseAdmin } from './_lib/supabaseAdmin.js'
import { greetingText, isChildName } from '../src/data/greetings.js'
import { STORY_TEXTS } from '../src/data/storyTexts.js'

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
/** Velocidade fixa da voz clonada (o ritmo "Normal" aprovado): mudar de velocidade não gera áudio de novo. */
const NARRATION_SPEED = 0.9

type NarrationRef = { storyId?: unknown; greeting?: { kind?: unknown; childName?: unknown } }

/**
 * Só narra textos que o servidor conhece: história do catálogo, história criada (e aprovada) da
 * própria família ou frase de teste da voz. Nunca texto livre enviado pelo app.
 */
async function resolveParagraphs(ref: NarrationRef, userId: string): Promise<string[]> {
  if (ref.greeting) {
    const kind = ref.greeting.kind === 'hero' ? 'hero' : ref.greeting.kind === 'test' ? 'test' : null
    if (!kind) throw new HttpError(400, 'Parâmetros inválidos.')
    const name = typeof ref.greeting.childName === 'string' && isChildName(ref.greeting.childName) ? ref.greeting.childName : undefined
    return [greetingText(kind, name)]
  }
  const storyId = String(ref.storyId ?? '')
  if (storyId.startsWith('custom:')) {
    const id = storyId.slice('custom:'.length)
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'História inválida.')
    const { data } = await supabaseAdmin()
      .from('custom_stories')
      .select('paragraphs')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'ready')
      .maybeSingle()
    if (!data) throw new HttpError(404, 'História não encontrada.')
    return data.paragraphs as string[]
  }
  const story = STORY_TEXTS.find((s) => s.id === storyId)
  if (!story) throw new HttpError(404, 'História não encontrada.')
  return story.paragraphs
}

/**
 * POST /api/narration { voiceId, storyId } ou { voiceId, greeting: { kind, childName } }
 * Gera a narração inteira numa única chamada (ritmo consistente) e guarda no Supabase;
 * nas próximas vezes devolve direto do cache, sem custo na ElevenLabs.
 * Resposta: { audioUrl, duration, starts[] } — starts = segundo em que cada parágrafo começa.
 */
export const POST = route(async (request) => {
  const { id: userId, email } = await requireUser(request)
  if (!(await accountAccess(email)).allowed) {
    throw new HttpError(403, 'A narração com a sua voz faz parte dos planos Mensal e Anual.')
  }
  const body = ((await request.json().catch(() => null)) ?? {}) as NarrationRef & { voiceId?: string }
  const voiceId = body.voiceId ?? ''
  await requireVoiceOwner(voiceId, userId)
  const original = await resolveParagraphs(body, userId)
  const speed = NARRATION_SPEED

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
