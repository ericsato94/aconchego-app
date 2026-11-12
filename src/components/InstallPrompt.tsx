import { useState, useSyncExternalStore } from 'react'
import { externalBrowserUrl, inAppBrowser, isIOS, isMobile, isStandalone } from '../lib/platform'
import { pwa } from '../services/pwa'
import { useApp } from '../store/appContext'
import { Icon } from './Icon'
import { InstallGuide, type InstallVariant } from './InstallGuide'
import { Modal } from './Modal'

/** Depois de dispensar, só pergunta de novo após alguns dias. */
const ASK_AGAIN_DAYS = 3

/**
 * Convite para instalar o app (PWA) no celular. Aparece depois que a pessoa ouviu a primeira
 * história e terminou o tour; não aparece para quem já abriu pelo app instalado.
 * No navegador do Instagram/Facebook, ensina primeiro a abrir no navegador do aparelho.
 */
export function InstallPrompt() {
  const { data, actions } = useApp()
  const canInstall = useSyncExternalStore(pwa.subscribe, pwa.canInstall, () => false)
  const [closed, setClosed] = useState(false)
  const [now] = useState(() => Date.now())

  const dismissedAt = data.settings.installDismissedAt
  const recentlyDismissed = dismissedAt && now - new Date(dismissedAt).getTime() < ASK_AGAIN_DAYS * 86_400_000
  const open =
    !closed && isMobile() && !isStandalone() && data.history.length > 0 && Boolean(data.settings.tourDoneAt) && !recentlyDismissed
  if (!open) return null

  const inApp = Boolean(inAppBrowser())
  const variant: InstallVariant = inApp ? 'inapp' : isIOS() ? 'ios' : 'android'
  const dismiss = () => {
    setClosed(true)
    actions.updateSettings({ installDismissedAt: new Date().toISOString() })
  }
  const install = async () => {
    if (await pwa.install()) setClosed(true)
  }

  return (
    <Modal
      open
      onClose={dismiss}
      size="sm"
      title={inApp ? 'Abra no navegador para instalar' : 'Instale o Aconchego no seu celular'}
      description={
        inApp
          ? 'Pelo Instagram não dá para instalar. Abra o Aconchego no navegador do celular, leva só um toque.'
          : 'Ele fica na tela inicial como um app: abre mais rápido e a história continua com a tela bloqueada.'
      }
      footer={
        <>
          {inApp ? (
            <a className="btn btn--primary btn--block" href={externalBrowserUrl()} data-autofocus>
              <Icon name="chevronRight" size={20} />
              Abrir no navegador
            </a>
          ) : variant === 'android' && canInstall ? (
            <button className="btn btn--primary btn--block" onClick={install} data-autofocus>
              <Icon name="download" size={20} />
              Instalar agora
            </button>
          ) : (
            <button className="btn btn--primary btn--block" onClick={dismiss} data-autofocus>
              Entendi
            </button>
          )}
          <button className="btn btn--ghost btn--block" onClick={dismiss}>
            Agora não
          </button>
        </>
      }
    >
      <InstallGuide variant={variant} />
    </Modal>
  )
}
