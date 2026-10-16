import { elevenlabs } from './_lib/elevenlabs.js'
import { json } from './_lib/http.js'

/** GET /api/health — o app usa para saber se a voz clonada está disponível. */
export function GET() {
  const supabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  return json({ elevenlabs: elevenlabs.configured && supabase, model: elevenlabs.modelId })
}
