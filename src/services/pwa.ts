import { registerSW } from 'virtual:pwa-register'

/**
 * Ativa o service worker (app offline + instalação). Não roda no funil de vendas (quiz/oferta):
 * na 1ª visita ele baixa ~2 MB do app inteiro, disputando a internet com a página do anúncio.
 */
let registered = false
export function registerServiceWorker() {
  if (registered || typeof window === 'undefined') return
  registered = true
  registerSW({ immediate: true })
}

export const isFunnelPath = (path: string) => /^\/(quiz|oferta)(\/|$)/.test(path)

/** Captura o convite de instalação do navegador (Chrome/Edge/Android) para oferecer um botão próprio. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

export const pwa = {
  canInstall: () => deferred !== null,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  async install() {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    emit()
    return outcome === 'accepted'
  },
}
