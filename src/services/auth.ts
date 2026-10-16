import type { AuthError as SupabaseAuthError, User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '../types'
import { supabase } from './supabase'

/** Contas reais com o Supabase Auth (e-mail e senha). */
export const DEMO_USER = {
  name: 'Thiago Lucas',
  email: 'thiago@email.com',
  password: 'aconchego-demo',
} as const

export class AuthError extends Error {}

const MESSAGES: Record<string, string> = {
  user_already_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
  email_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
  invalid_credentials: 'E-mail ou senha incorretos.',
  weak_password: 'Senha fraca. Use pelo menos 6 caracteres.',
  email_address_invalid: 'Este e-mail não parece válido.',
  validation_failed: 'Confira o e-mail e a senha.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  over_email_send_rate_limit: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  signup_disabled: 'Novos cadastros estão temporariamente fechados.',
}

function translate(error: SupabaseAuthError): AuthError {
  return new AuthError(MESSAGES[error.code ?? ''] ?? 'Não foi possível concluir agora. Tente novamente.')
}

export function toUser(u: SupabaseUser): User {
  const meta = u.user_metadata as { name?: string; full_name?: string }
  const email = u.email ?? ''
  return {
    id: u.id,
    name: meta.name ?? meta.full_name ?? email.split('@')[0],
    email,
    provider: email === DEMO_USER.email ? 'demo' : u.app_metadata.provider === 'google' ? 'google' : 'email',
    createdAt: u.created_at,
  }
}

const normalize = (email: string) => email.trim().toLowerCase()

export const authService = {
  async currentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getSession()
    return data.session ? toUser(data.session.user) : null
  },

  async signUp(name: string, email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: normalize(email),
      password,
      options: { data: { name: name.trim() } },
    })
    if (error) throw translate(error)
    if (!data.session || !data.user) {
      throw new AuthError('Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.')
    }
    return toUser(data.user)
  },

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalize(email), password })
    if (error) throw translate(error)
    return toUser(data.user)
  },

  /** Conta de demonstração: entra; se ainda não existir neste projeto, cria. */
  async signInDemo(): Promise<{ user: User; isNew: boolean }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email: DEMO_USER.email, password: DEMO_USER.password })
    if (!error) return { user: toUser(data.user), isNew: false }
    if (error.code !== 'invalid_credentials') throw translate(error)
    return { user: await this.signUp(DEMO_USER.name, DEMO_USER.email, DEMO_USER.password), isNew: true }
  },

  /** O login com Google só aparece ativo quando o provedor estiver ligado no Supabase. */
  async googleEnabled(): Promise<boolean> {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      })
      const body = (await res.json()) as { external?: { google?: boolean } }
      return Boolean(body.external?.google)
    } catch {
      return false
    }
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw translate(error)
  },

  async updateProfile(name: string, email: string): Promise<{ user: User; emailPending: boolean }> {
    const { data: current } = await supabase.auth.getUser()
    const emailChanged = normalize(email) !== current.user?.email
    const { data, error } = await supabase.auth.updateUser({
      data: { name: name.trim() },
      ...(emailChanged ? { email: normalize(email) } : {}),
    })
    if (error) throw translate(error)
    return { user: toUser(data.user), emailPending: emailChanged && data.user.email !== normalize(email) }
  },

  async signOut() {
    await supabase.auth.signOut()
  },
}
