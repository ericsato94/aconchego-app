/** Configurações centrais do app. Altere aqui nome, cores do PWA e parâmetros simulados. */
export const APP = {
  name: 'Aconchego',
  fullName: 'Aconchego — Histórias com a sua voz',
  tagline: 'Histórias que abraçam com a sua voz',
  description:
    'Grave sua voz uma vez e seu filho ouve histórias contadas por você, todas as noites.',
  themeColor: '#4FC3F7',
  backgroundColor: '#FFF9F3',
} as const

/** Regras de plano (ver Resumo do app, seção 4). */
export const PLAN_RULES = {
  freeStoryLimit: 3,
} as const

/** Parâmetros da gravação guiada. */
export const RECORDING = {
  phraseMinSeconds: 3,
  phraseMaxSeconds: 30,
  /** Mínimo de leitura para a clonagem (o roteiro completo leva ~2,5–3 min). */
  readingTargetSeconds: 120,
} as const

/** Simulação local da geração da voz (em produção: até 10 minutos, via API de clonagem). */
export const VOICE = {
  processingSeconds: 25,
  consentVersion: '1.0',
} as const
