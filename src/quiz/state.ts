import { storage } from '../services/storage'

/**
 * Estado da pessoa no quiz (respostas e nome), mantido no aparelho só para montar o
 * resultado e a página de vendas. Os EVENTOS do funil vão para o banco (ver track.ts).
 */
export interface QuizState {
  sessionId: string
  answers: Record<string, string>
  name?: string
  completed?: boolean
  leadSaved?: boolean
  viewed?: Partial<Record<'result' | 'sales', boolean>>
  /** Início da sessão (ms): recomeçar logo depois reaproveita a mesma sessão. */
  startedAt?: number
  /** Eventos únicos já enviados nesta sessão (abriu a página, começou, chegou nos planos). */
  sent?: Partial<Record<'landing' | 'started' | 'engaged', boolean>>
}

/** Voltar e tocar em "Começar" dentro deste tempo não abre outra sessão (não conta a pessoa duas vezes). */
const REUSE_MS = 30 * 60_000

const KEY = 'quiz:state'

const newSessionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
      )

export const quizState = {
  get(): QuizState | null {
    return storage.get<QuizState | null>(KEY, null)
  },
  start(): QuizState {
    const state: QuizState = { sessionId: newSessionId(), answers: {}, startedAt: Date.now(), sent: {} }
    storage.set(KEY, state)
    return state
  },
  /** Sessão em andamento (não concluída e recente) ou uma nova. */
  ensure(): QuizState {
    const current = this.get()
    if (current && !current.leadSaved && current.startedAt && Date.now() - current.startedAt < REUSE_MS) return current
    return this.start()
  },
  /** Marca um evento único como enviado; devolve false se já tinha sido. */
  markSent(key: 'landing' | 'started' | 'engaged'): boolean {
    const current = this.get()
    if (!current || current.sent?.[key]) return false
    this.update({ sent: { ...current.sent, [key]: true } })
    return true
  },
  update(patch: Partial<QuizState>): QuizState | null {
    const current = this.get()
    if (!current) return null
    const next = { ...current, ...patch }
    storage.set(KEY, next)
    return next
  },
  answer(questionId: string, optionId: string) {
    const current = this.get()
    if (!current) return null
    return this.update({ answers: { ...current.answers, [questionId]: optionId } })
  },
  reset() {
    storage.remove(KEY)
  },
}
