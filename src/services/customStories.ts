import { useSyncExternalStore } from 'react'
import lionReading from '../assets/lion-reading.webp'
import lionSleeping from '../assets/lion-sleeping.webp'
import type { Story } from '../types'
import { accessToken } from './supabase'

/**
 * Histórias criadas por IA para esta família (servidor: api/stories/[action].ts).
 * Ficam junto do catálogo com o id "custom:<uuid>" — o mesmo que o servidor usa para narrar.
 */
export type StoryMood = 'calma' | 'aventura' | 'divertida' | 'amizade'

export interface StoryUsage {
  plan: 'gratis' | 'mensal' | 'anual' | 'time'
  used: number
  limit: number
  period: 'total' | 'mes'
  today: number
  dayLimit: number
  attemptsToday: number
}

export interface NewStory {
  childName?: string
  age: number
  about: string
  mood: StoryMood
}

interface StoryRow {
  id: string
  title: string
  summary: string
  paragraphs: string[]
  mood: StoryMood | null
  request: { age?: number } | null
  created_at: string
}

export class StoryApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

const COVER: Record<StoryMood, Story['cover']> = {
  calma: { kind: 'image', src: lionSleeping, bg: '#2d3f8a' },
  aventura: { kind: 'image', src: lionReading, bg: '#bfe3f7' },
  divertida: { kind: 'image', src: lionReading, bg: '#ffe2a8' },
  amizade: { kind: 'image', src: lionReading, bg: '#d9e9b7' },
}
const TAGS: Record<StoryMood, Story['tags']> = { calma: ['sono'], aventura: ['aventura'], divertida: ['aventura'], amizade: ['amizade'] }

const toStory = (row: StoryRow): Story => {
  const mood = row.mood ?? 'calma'
  const age = row.request?.age ?? 5
  return {
    id: `custom:${row.id}`,
    title: row.title,
    summary: row.summary,
    paragraphs: row.paragraphs,
    ageRange: [Math.max(1, age - 1), Math.min(10, age + 2)],
    tags: TAGS[mood],
    free: true,
    custom: true,
    cover: COVER[mood],
  }
}

let state: { stories: Story[]; usage: StoryUsage | null; loaded: boolean } = { stories: [], usage: null, loaded: false }
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()
const set = (next: Partial<typeof state>) => {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const token = await accessToken()
  const res = await fetch(`/api/stories/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new StoryApiError(data.error ?? 'Não foi possível falar com o servidor.', res.status)
  return data
}

export const customStories = {
  all: () => state.stories,
  byId: (id: string) => state.stories.find((s) => s.id === id),

  /** Busca as histórias da conta logada (uma vez por sessão). */
  load(force = false) {
    if (loading && !force) return loading
    loading = request<{ stories: StoryRow[]; usage: StoryUsage }>('list')
      .then(({ stories, usage }) => set({ stories: stories.map(toStory), usage, loaded: true }))
      .catch(() => {
        loading = null
        set({ loaded: true })
      })
    return loading
  },

  async create(input: NewStory) {
    try {
      const { story, usage } = await request<{ story: StoryRow; usage: StoryUsage }>('create', input)
      const created = toStory(story)
      set({ stories: [created, ...state.stories], usage })
      return created
    } catch (err) {
      // Bloqueio e falha também contam como tentativa: atualiza o contador.
      customStories.load(true)
      throw err
    }
  },

  async remove(id: string) {
    await request('delete', { id: id.replace(/^custom:/, '') })
    set({ stories: state.stories.filter((s) => s.id !== id) })
  },

  report: (id: string, reason: string) => request('report', { id: id.replace(/^custom:/, ''), reason }),

  /** Ao sair da conta. */
  reset() {
    loading = null
    set({ stories: [], usage: null, loaded: false })
  },
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Re-renderiza quando as histórias criadas mudam. */
export const useCustomStories = () => useSyncExternalStore(subscribe, () => state)
