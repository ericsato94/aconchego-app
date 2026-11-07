import { randomBytes } from 'node:crypto'
import { elevenlabs, ElevenLabsError } from './elevenlabs.js'
import { HttpError, supabaseAdmin } from './supabaseAdmin.js'

/**
 * Voz sob demanda: guardamos só as gravações do responsável (bucket "recordings") e recriamos a voz
 * na ElevenLabs apenas para gerar uma narração, apagando logo depois. Assim nenhuma voz ocupa vaga
 * na conta: poucas vagas atendem qualquer número de assinantes. A voz sai igual porque é sempre
 * clonada das mesmas gravações. Narrações prontas ficam em cache e não precisam da voz.
 */

/** Prefixo das vozes temporárias na ElevenLabs (permite limpar sobras se algo falhar no meio). */
const TEMP_PREFIX = 'aconchego-tmp-'
/** Uma voz temporária mais velha que isto é sobra de uma execução interrompida. */
const STALE_MS = 10 * 60_000

/** Código da voz no app (estável; não é o id da ElevenLabs). */
export const newVoiceId = () => 'av' + randomBytes(12).toString('hex')

export async function recordingFiles(paths: string[]) {
  const admin = supabaseAdmin()
  return Promise.all(
    paths.map(async (path) => {
      const { data, error } = await admin.storage.from('recordings').download(path)
      if (error || !data) throw new HttpError(400, 'Não encontramos a gravação da voz. Grave novamente.')
      return new File([data], path.split('/').pop() ?? 'amostra.webm', { type: data.type || 'audio/webm' })
    }),
  )
}

/** Apaga vozes temporárias esquecidas (ex.: função encerrada no meio da narração). */
async function sweepStaleVoices() {
  for (const voice of await elevenlabs.listVoices(TEMP_PREFIX)) {
    if (Date.now() - voice.createdAt > STALE_MS) await elevenlabs.deleteVoice(voice.id).catch(() => undefined)
  }
}

async function cloneTemporary(files: File[]) {
  const name = `${TEMP_PREFIX}${Date.now()}`
  try {
    return await elevenlabs.createVoice(name, files)
  } catch (err) {
    // Sem vaga: limpa sobras e tenta mais uma vez.
    if (!(err instanceof ElevenLabsError) || ![400, 403, 422].includes(err.status)) throw err
    await sweepStaleVoices()
    return elevenlabs.createVoice(name, files)
  }
}

/** Recria a voz a partir das gravações, executa `task` com o id temporário e apaga a voz em seguida. */
export async function withTemporaryVoice<T>(recordingPaths: string[], task: (elevenVoiceId: string) => Promise<T>): Promise<T> {
  if (!recordingPaths.length) throw new HttpError(409, 'Grave a sua voz novamente para continuar.')
  const elevenVoiceId = await cloneTemporary(await recordingFiles(recordingPaths))
  try {
    return await task(elevenVoiceId)
  } finally {
    await elevenlabs.deleteVoice(elevenVoiceId).catch(() => undefined)
  }
}

/** Gravações da voz do usuário (e confere que a voz é dele). */
export async function voiceRecordings(voiceId: string, userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin().from('voices').select('user_id, recording_paths').eq('voice_id', voiceId).maybeSingle()
  if (error) throw error
  if (!data || data.user_id !== userId) throw new HttpError(404, 'Voz não encontrada.')
  return data.recording_paths as string[]
}
