/**
 * Pixel da Meta (Facebook/Instagram Ads) no funil: quiz, página de vendas e página de obrigado.
 * Carregado só nessas telas (o app em si não é rastreado).
 *
 * Eventos enviados:
 *   PageView          — cada tela do funil
 *   QuizStart         — começou o quiz (personalizado)
 *   QuizComplete      — respondeu todas as perguntas (personalizado)
 *   Lead              — deixou nome e contato
 *   ViewContent       — abriu a oferta
 *   InitiateCheckout  — clicou para pagar (valor do plano)
 *   Purchase          — chegou à página de obrigado vindo do checkout (valor do plano, uma vez por compra)
 */
export const META_PIXEL_ID = '1932425814373684'

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: Fbq }
declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

/** Plano escolhido no checkout: lido na página de obrigado para o valor da compra. */
const CHECKOUT_KEY = 'quiz:checkout'

function fbq(...args: unknown[]) {
  if (typeof window === 'undefined') return
  if (!window.fbq) {
    // Código padrão da Meta (fila até o script carregar).
    const queue = function (...a: unknown[]) {
      if (queue.callMethod) queue.callMethod(...a)
      else queue.queue.push(a)
    } as Fbq
    queue.push = queue
    queue.loaded = true
    queue.version = '2.0'
    queue.queue = []
    window.fbq = window._fbq = queue
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
    window.fbq('init', META_PIXEL_ID)
  }
  window.fbq(...args)
}

export const pixel = {
  pageView: () => fbq('track', 'PageView'),
  quizStart: () => fbq('trackCustom', 'QuizStart'),
  quizComplete: () => fbq('trackCustom', 'QuizComplete'),
  lead: () => fbq('track', 'Lead'),
  viewContent: (plan: string) => fbq('track', 'ViewContent', { content_name: plan, content_type: 'product' }),

  initiateCheckout(plan: { id: string; name: string; value: number }) {
    fbq('track', 'InitiateCheckout', { value: plan.value, currency: 'BRL', content_name: plan.name, content_ids: [plan.id] })
    try {
      localStorage.setItem(CHECKOUT_KEY, JSON.stringify({ ...plan, at: Date.now() }))
    } catch {
      /* armazenamento indisponível: a compra é registrada sem valor */
    }
  },

  /** Compra: só se a pessoa passou pelo checkout do funil, e uma única vez por checkout. */
  purchase() {
    try {
      const saved = JSON.parse(localStorage.getItem(CHECKOUT_KEY) ?? 'null') as { id: string; name: string; value: number; at: number } | null
      if (!saved || Date.now() - saved.at > 2 * 86_400_000) return
      localStorage.removeItem(CHECKOUT_KEY)
      fbq('track', 'Purchase', { value: saved.value, currency: 'BRL', content_name: saved.name, content_ids: [saved.id] }, { eventID: `compra-${saved.at}` })
    } catch {
      /* armazenamento indisponível */
    }
  },
}
