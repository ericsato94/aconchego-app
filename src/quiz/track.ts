/** Envia os eventos do funil para o servidor, que grava no banco (Supabase). */
export type QuizEventType =
  | 'quiz_started'
  | 'question_answered'
  | 'quiz_completed'
  | 'result_viewed'
  | 'sales_viewed'
  | 'checkout_started'

interface EventPayload {
  sessionId: string
  type: QuizEventType
  step?: number
  questionId?: string
  answer?: string
  plan?: string
  source?: Record<string, string | null>
}

const SOURCE_KEY = 'quiz:source'

/** Origem do tráfego: guarda os parâmetros UTM e o site de origem da primeira página aberta. */
export function captureSource() {
  try {
    if (sessionStorage.getItem(SOURCE_KEY)) return
    const params = new URLSearchParams(window.location.search)
    const width = window.innerWidth
    const source = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      referrer: document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : null,
      landing: window.location.pathname + window.location.search,
      device: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
    }
    sessionStorage.setItem(SOURCE_KEY, JSON.stringify(source))
  } catch {
    /* sessionStorage indisponível: segue sem origem */
  }
}

function readSource(): Record<string, string | null> {
  try {
    return JSON.parse(sessionStorage.getItem(SOURCE_KEY) ?? '{}') as Record<string, string | null>
  } catch {
    return {}
  }
}

export function track(payload: EventPayload) {
  const body = JSON.stringify(payload.type === 'quiz_started' ? { ...payload, source: readSource() } : payload)
  // keepalive: o evento chega mesmo se a página for trocada logo em seguida (ex.: checkout).
  return fetch('/api/quiz/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined)
}

export async function saveLead(data: {
  sessionId: string
  name: string
  email?: string
  whatsapp?: string
  consent: boolean
  answers: Record<string, string>
  identity: string
}) {
  const res = await fetch('/api/quiz/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Não foi possível enviar. Tente de novo.')
  }
}
