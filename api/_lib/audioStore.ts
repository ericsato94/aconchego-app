import { AwsClient } from 'aws4fetch'
import { supabaseAdmin } from './supabaseAdmin.js'

/**
 * Armazenamento das narrações geradas (áudios mp3).
 * - Com as chaves da Cloudflare R2 configuradas: guarda no R2 (10 GB grátis e download sem custo).
 * - Sem elas: guarda no Supabase Storage (bucket "narrations").
 * O caminho salvo no banco indica onde está: "r2:<chave>" (R2) ou "<chave>" (Supabase),
 * então áudios antigos continuam tocando depois da troca.
 */
const R2_PREFIX = 'r2:'
const SUPABASE_BUCKET = 'narrations'

function r2() {
  const account = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_BUCKET?.trim()
  if (!account || !accessKeyId || !secretAccessKey || !bucket) return null
  return {
    client: new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' }),
    url: (key: string) => `https://${account}.r2.cloudflarestorage.com/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`,
  }
}

async function check(res: Response, what: string) {
  if (!res.ok) throw new Error(`R2 ${what}: ${res.status} ${(await res.text()).slice(0, 200)}`)
}

export const audioStore = {
  /** Guarda o áudio e devolve o caminho a salvar no banco. */
  async put(key: string, audio: Buffer, contentType = 'audio/mpeg'): Promise<string> {
    const store = r2()
    if (store) {
      const res = await store.client.fetch(store.url(key), {
        method: 'PUT',
        body: new Uint8Array(audio),
        headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=31536000, immutable' },
      })
      await check(res, 'upload')
      return R2_PREFIX + key
    }
    const { error } = await supabaseAdmin().storage.from(SUPABASE_BUCKET).upload(key, audio, { contentType, upsert: true })
    if (error) throw error
    return key
  },

  /** Link temporário para o app tocar o áudio. */
  async signedUrl(path: string, seconds: number): Promise<string> {
    if (path.startsWith(R2_PREFIX)) {
      const store = r2()
      if (!store) throw new Error('R2 não configurado.')
      const url = new URL(store.url(path.slice(R2_PREFIX.length)))
      url.searchParams.set('X-Amz-Expires', String(seconds))
      const signed = await store.client.sign(url.toString(), { method: 'GET', aws: { signQuery: true } })
      return signed.url
    }
    const { data, error } = await supabaseAdmin().storage.from(SUPABASE_BUCKET).createSignedUrl(path, seconds)
    if (error || !data) throw error ?? new Error('Falha ao preparar o áudio.')
    return data.signedUrl
  },

  /** Apaga áudios (ex.: o responsável excluiu a voz). */
  async remove(paths: string[]) {
    const store = r2()
    const inR2 = paths.filter((p) => p.startsWith(R2_PREFIX))
    const inSupabase = paths.filter((p) => !p.startsWith(R2_PREFIX))
    if (inSupabase.length) await supabaseAdmin().storage.from(SUPABASE_BUCKET).remove(inSupabase)
    if (inR2.length && store) {
      await Promise.all(
        inR2.map(async (p) => {
          const res = await store.client.fetch(store.url(p.slice(R2_PREFIX.length)), { method: 'DELETE' })
          if (res.status !== 404) await check(res, 'exclusão')
        }),
      )
    }
  },
}
