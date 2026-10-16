import { createContext, useContext } from 'react'
import type { Child, PlanId, RecordingQuality, Settings, User, UserData } from '../types'

export interface AppActions {
  signUp(name: string, email: string, password: string, child?: Omit<Child, 'id'>): Promise<void>
  signIn(email: string, password: string): Promise<void>
  signInWithGoogle(): Promise<void>
  signInDemo(): Promise<void>
  signOut(): Promise<void>
  /** Retorna true quando a troca de e-mail aguarda confirmação. */
  updateProfile(name: string, email: string): Promise<boolean>
  acceptConsent(items: string[]): Promise<void>
  addChild(child: Omit<Child, 'id'>): void
  updateChild(child: Child): void
  removeChild(id: string): void
  setActiveChild(id: string): void
  toggleFavorite(storyId: string): boolean
  saveProgress(storyId: string, position: number, total: number, completed?: boolean): void
  addListen(storyId: string, seconds: number): void
  setPlan(plan: PlanId): void
  updateSettings(patch: Partial<Settings>): void
  startVoice(phrase: string, quality: RecordingQuality): Promise<void>
  approveVoice(): void
  deleteVoice(): Promise<void>
  markNotificationsRead(): void
}

export interface AppState {
  /** loading = verificando a sessão salva ao abrir o app. */
  status: 'loading' | 'ready'
  user: User | null
  data: UserData
  activeChild?: Child
  actions: AppActions
}

export const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp precisa estar dentro de <AppProvider>')
  return ctx
}
