import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Cliente com a chave de serviço: só no servidor (ignora RLS — sempre conferir o dono antes). */
let client: SupabaseClient | null = null

export function supabaseAdmin() {
  if (!client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new HttpError(503, 'Servidor sem configuração do Supabase.')
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return client
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
