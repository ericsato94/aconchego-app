/** Cliente mínimo da API da ElevenLabs (clonagem instantânea, narração e exclusão). */
// Lidas a cada chamada (variáveis de ambiente da Vercel ou do .env local).
// ELEVENLABS_BASE_URL só é usado em testes (servidor simulado).
const base = () => process.env.ELEVENLABS_BASE_URL?.trim() || 'https://api.elevenlabs.io/v1'
const apiKey = () => process.env.ELEVENLABS_API_KEY?.trim() ?? ''
const currentModel = () => process.env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_v4'

export class ElevenLabsError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Traduz erros da API para mensagens que o app pode mostrar ao usuário. */
async function fail(res: Response): Promise<never> {
  let detail = ''
  try {
    const body = (await res.json()) as { detail?: { message?: string; status?: string } | string }
    detail = typeof body.detail === 'string' ? body.detail : (body.detail?.message ?? body.detail?.status ?? '')
  } catch {
    /* corpo não é JSON */
  }
  const friendly: Record<number, string> = {
    401: 'Chave da ElevenLabs inválida ou sem permissão.',
    402: 'Créditos ou plano da ElevenLabs insuficientes para esta operação.',
    429: 'Muitas solicitações à ElevenLabs. Tente de novo em instantes.',
  }
  const message = friendly[res.status] ?? `ElevenLabs respondeu ${res.status}${detail ? `: ${detail}` : ''}`
  console.error(`[elevenlabs] ${res.status} ${detail}`)
  throw new ElevenLabsError(res.status >= 500 ? 502 : res.status, message)
}

const headers = () => ({ 'xi-api-key': apiKey() })

/**
 * Ajustes de voz por modelo. Estabilidade mais baixa e "style" mais alto = mais emoção e variação;
 * valores altos soam monótonos ("cara de IA").
 */
function voiceSettings(speed: number) {
  if (currentModel().startsWith('eleven_v3')) {
    // v3: estabilidade aceita 0 (criativa), 0.5 (natural) ou 1 (robusta).
    return { stability: 0.5, similarity_boost: 0.85, speed }
  }
  // Escolhido na comparação de vozes (versão "E", eleven_v4): estabilidade intermediária,
  // expressiva sem acelerar/frear entre frases; semelhança alta para preservar a voz do responsável.
  return { stability: 0.5, similarity_boost: 0.9, style: 0.35, use_speaker_boost: true, speed }
}

/** Versão dos ajustes e do preparo do texto: muda a chave do cache quando eles mudam. */
export const SETTINGS_VERSION = 'v4'

/** Só o eleven_v3 entende marcações de emoção ([happy], [whispers]…); nos outros elas seriam lidas em voz alta. */
const supportsCues = () => currentModel().startsWith('eleven_v3')

/**
 * Prepara o texto para a voz:
 * - diálogos com travessão viram aspas (“…”, disse ele), que a voz lê sem pausas estranhas;
 * - remove as marcações de emoção quando o modelo não as entende.
 */
export function toSpeech(paragraph: string) {
  const lines = paragraph.split('\n').map((line) => {
    const cue = line.match(/^((?:\[[a-z ]+\]\s*)*)— (.*)$/i)
    if (!cue) return line
    const [, tags, rest] = cue
    // Partes alternadas: fala — narração — fala…
    const parts = rest.split(' — ')
    const spoken = parts.map((part, i) => (i % 2 === 0 ? `“${part.trim()}”` : part.trim())).join(' ')
    return `${tags}${spoken}`
  })
  const text = lines.join('\n')
  return supportsCues() ? text : text.replace(/\[[a-z ]+\]\s*/gi, '')
}

export const elevenlabs = {
  get configured() {
    return apiKey().length > 0
  },
  get modelId() {
    return currentModel()
  },

  async createVoice(name: string, files: File[]): Promise<string> {
    const form = new FormData()
    form.set('name', name)
    form.set('description', 'Voz de responsável — app Aconchego (consentimento registrado no app).')
    form.set('remove_background_noise', 'true')
    files.forEach((file, i) => form.append('files', file, file.name || `amostra-${i + 1}.webm`))
    const res = await fetch(`${base()}/voices/add`, { method: 'POST', headers: headers(), body: form })
    if (!res.ok) await fail(res)
    const { voice_id } = (await res.json()) as { voice_id: string }
    return voice_id
  },

  /**
   * Narra um texto inteiro numa única chamada (ritmo e entonação consistentes do começo ao fim)
   * e devolve o áudio + o instante em que cada caractere é falado.
   * speed: 0.7 (devagar) a 1.2 (rápido); 1 = ritmo natural da voz.
   */
  async narrate(voiceId: string, text: string, speed: number): Promise<{ audio: Buffer; charStarts: number[]; duration: number }> {
    const res = await fetch(`${base()}/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: currentModel(), voice_settings: voiceSettings(speed) }),
    })
    if (!res.ok) await fail(res)
    const body = (await res.json()) as {
      audio_base64: string
      alignment?: { character_start_times_seconds: number[]; character_end_times_seconds: number[] }
    }
    const ends = body.alignment?.character_end_times_seconds ?? []
    return {
      audio: Buffer.from(body.audio_base64, 'base64'),
      charStarts: body.alignment?.character_start_times_seconds ?? [],
      duration: ends.length ? ends[ends.length - 1] : 0,
    }
  },

  async deleteVoice(voiceId: string) {
    const res = await fetch(`${base()}/voices/${voiceId}`, { method: 'DELETE', headers: headers() })
    // 404/400 = já não existe na ElevenLabs: trata como excluída.
    if (!res.ok && res.status !== 404 && res.status !== 400) await fail(res)
  },
}
