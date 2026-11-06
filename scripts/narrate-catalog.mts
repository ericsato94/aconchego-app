/**
 * Gera (uma única vez) a narração padrão das histórias do catálogo com uma voz da ElevenLabs
 * e salva os áudios em public/narracao/ + as marcações de tempo em src/data/defaultNarrations.ts.
 * Quem não tem voz clonada ouve esses arquivos: tocar não gasta crédito; só rodar este script.
 *
 * Uso: npx tsx scripts/narrate-catalog.mts <voiceId> [storyId…]
 * (sem storyId: só as histórias que ainda não têm áudio ou cujo texto mudou)
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { elevenlabs, SETTINGS_VERSION, toSpeech } from '../api/_lib/elevenlabs.ts'
import { STORY_TEXTS } from '../src/data/storyTexts.ts'

for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const [voiceId, ...only] = process.argv.slice(2)
if (!voiceId) throw new Error('Informe o voiceId da ElevenLabs.')

const PARAGRAPH_JOIN = '\n\n'
const SPEED = 0.9
const AUDIO_DIR = 'public/narracao'
const DATA_FILE = 'src/data/defaultNarrations.ts'

type Entry = { file: string; duration: number; starts: number[] }
const current: Record<string, Entry> = existsSync(DATA_FILE)
  ? JSON.parse(readFileSync(DATA_FILE, 'utf8').match(/= (\{[\s\S]*\})\s*$/)![1])
  : {}

mkdirSync(AUDIO_DIR, { recursive: true })
for (const story of STORY_TEXTS) {
  const paragraphs = story.paragraphs.map(toSpeech)
  const text = paragraphs.join(PARAGRAPH_JOIN)
  // O nome do arquivo muda com a voz, o modelo e o texto: o app nunca toca uma versão velha do cache.
  const hash = createHash('sha256')
    .update(`${voiceId}\n${elevenlabs.modelId}@${SPEED}@${SETTINGS_VERSION}\n${text}`)
    .digest('hex')
    .slice(0, 10)
  const file = `/narracao/${story.id}-${hash}.mp3`
  const wanted = only.length ? only.includes(story.id) : current[story.id]?.file !== file
  if (!wanted) continue

  const { audio, charStarts, duration } = await elevenlabs.narrate(voiceId, text, SPEED)
  const starts: number[] = []
  let offset = 0
  for (const p of paragraphs) {
    starts.push(charStarts[offset] ?? starts[starts.length - 1] ?? 0)
    offset += p.length + PARAGRAPH_JOIN.length
  }
  writeFileSync(`public${file}`, audio)
  current[story.id] = { file, duration: Math.round(duration * 100) / 100, starts: starts.map((s) => Math.round(s * 100) / 100) }
  console.log(`${story.id}: ${text.length} caracteres, ${duration.toFixed(1)} s`)
}

writeFileSync(
  DATA_FILE,
  `/** Narração padrão do catálogo (gerada por scripts/narrate-catalog.mts — não editar à mão). */\n` +
    `export const DEFAULT_NARRATIONS: Record<string, { file: string; duration: number; starts: number[] }> = ${JSON.stringify(current, null, 2)}\n`,
)
