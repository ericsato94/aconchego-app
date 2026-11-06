import { createContext, useContext } from 'react'

export type PlayerStatus = 'idle' | 'playing' | 'paused'

export interface SleepSession {
  endsAt: number
  minutes: number
  volume: number
  autoNext: boolean
  finished: boolean
}

export interface PlayerState {
  storyId?: string
  status: PlayerStatus
  position: number
  total: number
  /** Narração com a voz clonada sendo gerada (primeira vez de cada história). */
  loading?: boolean
  /** Tempo real do áudio (s) e duração total — só quando a narração é um áudio pronto. */
  elapsed?: number
  duration?: number
  sleep?: SleepSession
}

export interface PlayerApi extends PlayerState {
  play(storyId: string, from?: number): void
  toggle(): void
  pause(): void
  seek(position: number): void
  /** Pula para um segundo exato do áudio (linha do tempo). */
  seekTime(seconds: number): void
  stop(): void
  startSleep(storyId: string, minutes: number, volume: number, autoNext: boolean): void
  endSleep(): void
}

export const PlayerContext = createContext<PlayerApi | null>(null)

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer precisa estar dentro de <PlayerProvider>')
  return ctx
}
