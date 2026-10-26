import { STORIES } from '../data/stories'
import type { PlanId, Story } from '../types'
import { customStories } from './customStories'

/** Acesso ao catálogo + histórias criadas pela família (use `useCustomStories` para re-renderizar). */
export const catalog = {
  all: (): Story[] => [...customStories.all(), ...STORIES],
  byId: (id: string) => (id.startsWith('custom:') ? customStories.byId(id) : STORIES.find((s) => s.id === id)),
  free: () => [...customStories.all(), ...STORIES.filter((s) => s.free)],
  canAccess: (story: Story, plan: PlanId) => story.free || plan !== 'free',
}

/** Remove as marcações de emoção da narração ([happy], [whispers]…) para exibir ou ler no aparelho. */
export const stripCues = (text: string) => text.replace(/\[[a-z ]+\]\s*/gi, '').trim()

const WORDS_PER_MINUTE = 120

export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

/** Duração estimada em segundos de um trecho narrado. */
export const estimateSeconds = (text: string) => Math.max(2, (wordCount(stripCues(text)) / WORDS_PER_MINUTE) * 60)

export function storyMinutes(story: Story) {
  const total = story.paragraphs.reduce((acc, p) => acc + estimateSeconds(p), 0)
  return Math.max(1, Math.round(total / 60))
}

export function remainingMinutes(story: Story, position: number) {
  const rest = story.paragraphs.slice(position).reduce((acc, p) => acc + estimateSeconds(p), 0)
  return Math.max(1, Math.round(rest / 60))
}
