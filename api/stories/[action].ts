import { accountAccess, json, requireUser, route } from '../_lib/http.js'
import { limitMessage, storyUsage, type StoryUsage } from '../_lib/storyLimits.js'
import { checkRequest, MOODS, reviewStory, StoryBlocked, writeStory, type Mood, type StoryRequest } from '../_lib/storyWriter.js'
import { HttpError, supabaseAdmin } from '../_lib/supabaseAdmin.js'

/**
 * Histórias criadas por IA.
 *   GET  /api/stories/list    → { stories, usage }
 *   POST /api/stories/create  { childName?, age, about, mood } → { story, usage }
 *   POST /api/stories/report  { id, reason } — pais denunciam uma história
 *   POST /api/stories/delete  { id }
 */
const STORY_FIELDS = 'id, title, summary, paragraphs, mood, request, created_at'

async function planOf(email: string): Promise<StoryUsage['plan']> {
  const access = await accountAccess(email)
  if (access.source === 'time') return 'time'
  return access.plan ?? 'gratis'
}

const action = (request: Request) => new URL(request.url).pathname.split('/').pop()

export const GET = route(async (request) => {
  if (action(request) !== 'list') throw new HttpError(404, 'Rota não encontrada.')
  const { id: userId, email } = await requireUser(request)
  const [{ data, error }, usage] = await Promise.all([
    supabaseAdmin()
      .from('custom_stories')
      .select(STORY_FIELDS)
      .eq('user_id', userId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(100),
    planOf(email).then((plan) => storyUsage(userId, plan)),
  ])
  if (error) throw error
  return json({ stories: data ?? [], usage })
})

function readRequest(b: Record<string, unknown>): StoryRequest {
  const about = typeof b.about === 'string' ? b.about.trim().replace(/\s+/g, ' ') : ''
  if (about.length < 3) throw new HttpError(400, 'Conte em poucas palavras sobre o que vai ser a história.')
  if (about.length > 300) throw new HttpError(400, 'Use até 300 caracteres para descrever a história.')
  const name = typeof b.childName === 'string' ? b.childName.trim() : ''
  if (name && !/^[\p{L}][\p{L} '-]{0,29}$/u.test(name)) throw new HttpError(400, 'Use só o primeiro nome da criança.')
  const age = Number(b.age)
  const mood = (MOODS as readonly string[]).includes(String(b.mood)) ? (String(b.mood) as Mood) : 'calma'
  return { about, childName: name || null, age: Number.isInteger(age) && age >= 1 && age <= 10 ? age : 5, mood }
}

async function create(request: Request) {
  const { id: userId, email } = await requireUser(request)
  const req = readRequest((await request.json().catch(() => ({}))) as Record<string, unknown>)
  const plan = await planOf(email)
  const usage = await storyUsage(userId, plan)
  const blockedByLimit = limitMessage(usage)
  if (blockedByLimit) throw new HttpError(429, blockedByLimit)

  const admin = supabaseAdmin()
  const log = (status: 'ready' | 'blocked' | 'failed', storyId: string | null = null) =>
    admin.from('story_generations').insert({ user_id: userId, story_id: storyId, status })

  try {
    await checkRequest(req)
    const story = await writeStory(req)
    await reviewStory(story)
    const { data, error } = await admin
      .from('custom_stories')
      .insert({ user_id: userId, status: 'ready', ...story, mood: req.mood, request: req })
      .select(STORY_FIELDS)
      .single()
    if (error) throw error
    await log('ready', data.id)
    return json({ story: data, usage: { ...usage, used: usage.used + 1, today: usage.today + 1 } }, 201)
  } catch (err) {
    if (err instanceof StoryBlocked) {
      // Fica registrado (sem texto) para revisão e conta como tentativa do dia.
      const { data } = await admin
        .from('custom_stories')
        .insert({ user_id: userId, status: 'blocked', request: req, mood: req.mood, block_reason: err.message.slice(0, 300) })
        .select('id')
        .single()
      await log('blocked', data?.id ?? null)
      throw new HttpError(422, err.message)
    }
    await log('failed')
    if (err instanceof HttpError) throw err
    console.error('[stories] falha ao criar história', err)
    throw new HttpError(502, 'Não conseguimos criar a história agora. Tente de novo em instantes.')
  }
}

function storyId(id: unknown) {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'História inválida.')
  return id
}

export const POST = route(async (request) => {
  const a = action(request)
  if (a === 'create') return create(request)

  const { id: userId } = await requireUser(request)
  const b = (await request.json().catch(() => ({}))) as { id?: unknown; reason?: unknown }
  const id = storyId(b.id)
  const admin = supabaseAdmin()

  if (a === 'report') {
    const reason = typeof b.reason === 'string' ? b.reason.trim().slice(0, 500) : ''
    const { error } = await admin
      .from('custom_stories')
      .update({ reported_at: new Date().toISOString(), report_reason: reason || 'sem motivo informado' })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    console.warn(`[stories] história denunciada: ${id}`)
    return json({ ok: true })
  }
  if (a === 'delete') {
    const { error } = await admin.from('custom_stories').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    return json({ ok: true })
  }
  throw new HttpError(404, 'Rota não encontrada.')
})
