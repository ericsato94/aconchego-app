import { supabase } from './supabase'

/**
 * Amostras de voz gravadas.
 * - No aparelho (IndexedDB): para ouvir e comparar com a voz criada.
 * - No Supabase (bucket privado "recordings/<user_id>/"): enviadas para criar a voz.
 */
const DB_NAME = 'aconchego'
const STORE = 'recordings'

export type RecordingKind = 'phrase' | 'reading'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }).finally(() => db.close())
}

const key = (userId: string, kind: RecordingKind) => `${userId}:${kind}`

export const recordingsService = {
  save: (userId: string, kind: RecordingKind, blob: Blob) =>
    tx('readwrite', (s) => s.put(blob, key(userId, kind))).then(() => undefined),

  get: (userId: string, kind: RecordingKind) =>
    tx<Blob | undefined>('readonly', (s) => s.get(key(userId, kind))).catch(() => undefined),

  /** Envia a gravação ao armazenamento privado do usuário e devolve o caminho. */
  async upload(userId: string, kind: RecordingKind, blob: Blob): Promise<string> {
    const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'
    const path = `${userId}/${kind}.${ext}`
    const { error } = await supabase.storage
      .from('recordings')
      .upload(path, blob, { upsert: true, contentType: blob.type.split(';')[0] || 'audio/webm' })
    if (error) throw new Error('Não foi possível enviar a gravação. Verifique a conexão e tente de novo.')
    return path
  },

  async removeAll(userId: string) {
    await Promise.all(
      (['phrase', 'reading'] as const).map((kind) =>
        tx('readwrite', (s) => s.delete(key(userId, kind))).catch(() => undefined),
      ),
    )
  },
}
