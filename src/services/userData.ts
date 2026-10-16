import type { ConsentRecord, UserData } from '../types'
import { VOICE } from '../config/app'
import { storage, uid } from './storage'
import { supabase } from './supabase'

/**
 * Dados do usuário (crianças, voz, progresso, preferências).
 * Fonte da verdade: tabela user_data no Supabase. Uma cópia local deixa a abertura
 * do app instantânea e permite uso offline; as alterações sobem com um pequeno atraso.
 */
const cacheKey = (userId: string) => `data:${userId}`
const SAVE_DELAY_MS = 800

export function defaultUserData(): UserData {
  return {
    children: [],
    voice: { status: 'none' },
    favorites: [],
    progress: {},
    history: [],
    plan: 'free',
    settings: {
      bedtimeReminder: false,
      reminderTime: '20:00',
      news: true,
      weeklySummary: true,
      narrationRate: 0.95,
      sleepVolume: 0.4,
      sleepTimerMin: 20,
      sleepAutoNext: true,
    },
    notifications: [],
  }
}

const merge = (stored: Partial<UserData> | null): UserData => {
  const base = defaultUserData()
  return stored ? { ...base, ...stored, settings: { ...base.settings, ...stored.settings } } : base
}

const daysAgo = (days: number, hour = 20) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 15, 0, 0)
  return d.toISOString()
}

/** Estado inicial da conta demonstração — reproduz o cenário das telas de referência. */
export function demoUserData(userId: string): UserData {
  const base = defaultUserData()
  const sofia = { id: uid(), name: 'Sofia', age: 4 }
  return {
    ...base,
    children: [sofia],
    activeChildId: sofia.id,
    consent: {
      id: uid(),
      userId,
      version: VOICE.consentVersion,
      acceptedAt: daysAgo(6, 19),
      items: ['voz-biometrica', 'dados-crianca', 'politica'],
    },
    // Na demonstração a voz é simulada (a voz clonada fica restrita às contas autorizadas).
    voice: {
      status: 'ready',
      mode: 'local',
      phrase: 'Hoje é um ótimo dia para viver grandes aventuras.',
      startedAt: daysAgo(6, 19),
      readyAt: daysAgo(6, 19),
      approvedAt: daysAgo(6, 19),
      quality: { score: 86, volume: 'bom', noisy: false, duration: 64 },
    },
    favorites: ['o-leao-e-o-ratinho', 'a-baleia-e-o-mar', 'o-raposo-e-a-cegonha'],
    progress: {
      'o-leao-e-o-ratinho': { position: 3, total: 9, updatedAt: daysAgo(0, 8) },
    },
    history: [
      { id: uid(), storyId: 'o-leao-e-o-ratinho', at: daysAgo(0, 8), seconds: 1080 },
      { id: uid(), storyId: 'a-baleia-e-o-mar', at: daysAgo(1), seconds: 1140 },
      { id: uid(), storyId: 'o-raposo-e-a-cegonha', at: daysAgo(2), seconds: 960 },
      { id: uid(), storyId: 'a-baleia-e-o-mar', at: daysAgo(3), seconds: 1020 },
      { id: uid(), storyId: 'o-leao-e-o-ratinho', at: daysAgo(4), seconds: 840 },
    ],
    notifications: [
      {
        id: uid(),
        title: 'Sua voz está pronta!',
        body: 'Ouça como ficou e escolha a primeira história da Sofia.',
        at: daysAgo(6, 19),
        read: true,
        link: '/',
      },
      {
        id: uid(),
        title: 'Resumo da semana',
        body: 'Sofia ouviu 5 histórias com a sua voz. Que orgulho!',
        at: daysAgo(0, 9),
        read: false,
        link: '/progresso',
      },
    ],
  }
}

const timers = new Map<string, number>()
const pending = new Map<string, () => void>()

// Envia na hora o que estiver pendente quando o app fecha ou vai para o segundo plano.
if (typeof window !== 'undefined') {
  const flush = () => pending.forEach((push) => push())
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush())
}

const newer = (a?: string, b?: string) => (a ?? '') > (b ?? '')

export const userDataRepo = {
  /** Cópia local (abre o app na hora, antes da resposta do servidor). */
  cached(userId: string): UserData | null {
    const stored = storage.get<Partial<UserData> | null>(cacheKey(userId), null)
    return stored ? merge(stored) : null
  },

  /** Busca no Supabase. `null` = conta ainda sem dados (primeiro acesso). */
  async load(userId: string): Promise<UserData | null> {
    const [{ data, error }, consent] = await Promise.all([
      supabase.from('user_data').select('data').eq('user_id', userId).maybeSingle(),
      supabase
        .from('consents')
        .select('id, version, items, accepted_at')
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    if (error) throw error
    if (!data) return null
    const merged = merge(data.data as Partial<UserData>)
    if (consent.data) {
      merged.consent = {
        id: consent.data.id,
        userId,
        version: consent.data.version,
        items: consent.data.items,
        acceptedAt: consent.data.accepted_at,
      }
    }
    return merged
  },

  /** A versão mais recente entre a do aparelho e a da nuvem. */
  pickLatest(local: UserData | null, remote: UserData | null) {
    if (!remote) return { data: local, localIsNewer: Boolean(local) }
    if (local && newer(local.savedAt, remote.savedAt)) return { data: local, localIsNewer: true }
    return { data: remote, localIsNewer: false }
  },

  /** Salva local na hora e no Supabase com um pequeno atraso (agrupa mudanças rápidas). */
  save(userId: string, data: UserData, immediate = false) {
    const value = data.savedAt ? data : { ...data, savedAt: new Date().toISOString() }
    storage.set(cacheKey(userId), value)
    window.clearTimeout(timers.get(userId))
    const push = () => {
      timers.delete(userId)
      pending.delete(userId)
      void supabase
        .from('user_data')
        .upsert({ user_id: userId, data: value, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          // Os dados continuam no aparelho e sobem junto na próxima alteração.
          if (error) console.warn('Falha ao salvar os dados na nuvem.', error.message)
        })
    }
    if (immediate) push()
    else {
      pending.set(userId, push)
      timers.set(userId, window.setTimeout(push, SAVE_DELAY_MS))
    }
  },

  /** Registra o aceite LGPD na tabela imutável de consentimentos. */
  async recordConsent(userId: string, version: string, items: string[]): Promise<ConsentRecord> {
    const { data, error } = await supabase
      .from('consents')
      .insert({ user_id: userId, version, items, user_agent: navigator.userAgent.slice(0, 300) })
      .select('id, accepted_at')
      .single()
    if (error) throw error
    return { id: data.id, userId, version, items, acceptedAt: data.accepted_at }
  },

  /** Atualiza só a cópia do aparelho (quando a da nuvem já é a mais recente). */
  cacheOnly(userId: string, data: UserData) {
    storage.set(cacheKey(userId), data)
  },

}
