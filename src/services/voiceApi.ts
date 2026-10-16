/**
 * Cliente do servidor do Aconchego (server/index.ts), que fala com a ElevenLabs.
 * O app nunca vê a chave da API.
 */
export class VoiceApiError extends Error {}

import { accessToken } from './supabase'

let health: Promise<boolean> | null = null

export interface NarrationMeta {
  audioUrl: string
  duration: number
  /** Instante (s) em que cada parágrafo começa a ser falado. */
  starts: number[]
}

/** Chamada ao servidor com o login do usuário (o servidor confere dono e permissões). */
async function request<T>(input: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new VoiceApiError(body.error ?? `Erro ${res.status} no servidor de voz.`)
  }
  return res.json() as Promise<T>
}

export const voiceApi = {
  /** true quando o servidor está configurado e o usuário logado pode criar voz clonada. */
  isAvailable(): Promise<boolean> {
    health ??= fetch('/api/health')
      .then((r) => (r.ok ? (r.json() as Promise<{ elevenlabs: boolean }>) : { elevenlabs: false }))
      .then((b) => (b.elevenlabs ? request<{ allowed: boolean }>('/api/voices').then((v) => v.allowed) : false))
      .catch(() => false)
      .then((ok) => {
        if (!ok) window.setTimeout(() => (health = null), 15_000) // tenta de novo depois
        return ok
      })
    return health
  },

  /** Cria a voz a partir das gravações já enviadas ao armazenamento (caminhos recordings/<user_id>/…). */
  async createVoice(name: string, paths: string[]): Promise<string> {
    const { voiceId } = await request<{ voiceId: string }>('/api/voices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, paths }),
    })
    return voiceId
  },

  /** Esquece o resultado em cache (ex.: depois de trocar de conta). */
  reset() {
    health = null
  },

  async deleteVoice(voiceId: string) {
    await request('/api/voices/' + encodeURIComponent(voiceId), { method: 'DELETE' })
  },

  /** Gera (ou busca no cache) a narração de um texto inteiro com a voz clonada. */
  narration: (voiceId: string, speed: number, paragraphs: string[]) =>
    request<NarrationMeta>('/api/narration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceId, speed, paragraphs }),
    }),
}
