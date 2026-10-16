import { useSyncExternalStore } from 'react'
import { pwa } from '../services/pwa'
import { Icon } from './Icon'

/** Exibido apenas quando o navegador permite instalar o app. */
export function InstallButton({ className = 'btn btn--secondary' }: { className?: string }) {
  const canInstall = useSyncExternalStore(pwa.subscribe, pwa.canInstall, () => false)
  if (!canInstall) return null
  return (
    <button className={className} onClick={() => pwa.install()}>
      <Icon name="download" size={18} />
      Instalar o app
    </button>
  )
}
