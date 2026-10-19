import raw from './quiz.config.json'

/** Tipos do arquivo de configuração (quiz.config.json). Edite os textos lá, não aqui. */
export type QuizImageKey =
  | 'castelo' | 'leao' | 'baleia' | 'raposa' | 'leao-dormindo' | 'leao-lendo' | 'estrelas' | 'lua' | 'musica'

export interface QuizOption {
  id: string
  label: string
  image?: QuizImageKey
  tier?: 'basico' | 'familia'
}

export interface QuizQuestion {
  id: string
  kind: 'text' | 'image'
  role?: 'pain' | 'budget' | 'objection'
  title: string
  subtitle?: string
  options: QuizOption[]
}

export interface Identity {
  name: string
  image: QuizImageKey
  description: string
  stories: string[]
}

export interface Plan {
  id: string
  name: string
  price: string
  period: string
  note?: string
  value: number
  features: string[]
  checkoutUrl: string
}

interface QuizConfig {
  intro: { eyebrow: string; title: string; subtitle: string; button: string; note: string }
  questions: QuizQuestion[]
  loading: { title: string; seconds: number; messages: string[] }
  lead: {
    title: string
    subtitle: string
    nameLabel: string
    whatsappLabel: string
    emailLabel: string
    consent: string
    button: string
  }
  identities: Record<string, Identity>
  painEcho: Record<string, string>
  objectionAnswers: Record<string, { title: string; text: string }>
  result: {
    eyebrow: string
    previewTitle: string
    previewNights: string[]
    visibleNights: number
    lockedNote: string
    cta: string
    share: string
    shareText: string
    restart: string
  }
  offer: {
    headline: string
    subheadline: string
    howItWorks: Array<{ title: string; text: string }>
    benefits: string[]
    plans: Plan[]
    recommendByTier: Record<'basico' | 'familia', string>
    recommendedLabel: string
    checkoutButton: string
    freeAlternative: string
    guarantee: string
    faq: Array<{ q: string; a: string }>
  }
}

export const QUIZ = raw as unknown as QuizConfig
export const QUESTIONS = QUIZ.questions

export const questionByRole = (role: QuizQuestion['role']) => QUESTIONS.find((q) => q.role === role)

/** Troca {chave} pelos valores (ex.: "{name}, ..."). */
export const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
