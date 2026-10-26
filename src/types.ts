export type PlanId = 'free' | 'monthly' | 'annual'

export type VoiceStatus = 'none' | 'processing' | 'review' | 'ready'

export interface User {
  id: string
  name: string
  email: string
  provider: 'email' | 'google' | 'demo'
  createdAt: string
}

export interface ConsentRecord {
  id: string
  userId: string
  version: string
  acceptedAt: string
  items: string[]
}

export interface Child {
  id: string
  name: string
  age: number
}

export interface RecordingQuality {
  /** 0–100 */
  score: number
  volume: 'baixo' | 'bom' | 'alto'
  noisy: boolean
  duration: number
}

export interface VoiceProfile {
  status: VoiceStatus
  /** cloud = ElevenLabs; local = simulação (sem servidor/chave ou gravação simulada). */
  mode?: 'cloud' | 'local'
  /** ID da voz clonada na ElevenLabs. */
  voiceId?: string
  /** Última falha ao criar a voz, exibida na tela de gravação. */
  error?: string
  phrase?: string
  startedAt?: string
  readyAt?: string
  approvedAt?: string
  quality?: RecordingQuality
}

export interface StoryProgress {
  /** índice da frase onde a reprodução parou */
  position: number
  total: number
  updatedAt: string
  completedAt?: string
}

export interface ListenEntry {
  id: string
  storyId: string
  at: string
  seconds: number
}

export interface AppNotification {
  id: string
  title: string
  body: string
  at: string
  read: boolean
  link?: string
}

export interface Settings {
  bedtimeReminder: boolean
  reminderTime: string
  news: boolean
  weeklySummary: boolean
  narrationRate: number
  sleepVolume: number
  sleepTimerMin: number
  sleepAutoNext: boolean
}

export interface UserData {
  /** Momento da última alteração (resolve conflito entre a cópia do aparelho e a da nuvem). */
  savedAt?: string
  children: Child[]
  activeChildId?: string
  consent?: ConsentRecord
  voice: VoiceProfile
  favorites: string[]
  progress: Record<string, StoryProgress>
  history: ListenEntry[]
  plan: PlanId
  settings: Settings
  notifications: AppNotification[]
}

export interface CoverArt {
  kind: 'image'
  src: string
  /** Cor de fundo enquanto a imagem carrega. */
  bg: string
  /** Ponto que deve ficar visível nos recortes (CSS object-position), ex.: "center top" para capas com título. */
  focus?: string
}

/** Texto de uma história (sem imagem): compartilhado entre o app e o servidor. */
export interface StoryText {
  id: string
  title: string
  summary: string
  ageRange: [number, number]
  tags: Array<'sono' | 'aventura' | 'amizade' | 'natureza'>
  free: boolean
  /** Parágrafos do texto narrado. */
  paragraphs: string[]
}

export interface Story extends StoryText {
  cover: CoverArt
  /** Criada por IA para esta família (não faz parte do catálogo). */
  custom?: boolean
}
