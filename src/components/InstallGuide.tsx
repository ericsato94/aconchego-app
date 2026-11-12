import lionHead from '../assets/lion-head.webp'
import { isIOS } from '../lib/platform'
import './InstallGuide.css'

export type InstallVariant = 'ios' | 'android' | 'inapp'

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
)

const PlusSquare = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8v8M8 12h8" />
  </svg>
)

const Dots = ({ vertical }: { vertical?: boolean }) => (
  <span className={`ig-dots${vertical ? ' ig-dots--v' : ''}`} aria-hidden="true">
    <i />
    <i />
    <i />
  </span>
)

/** Texto dos passos de cada caso. */
function steps(variant: InstallVariant) {
  if (variant === 'ios')
    return [
      <>Toque em <b>Compartilhar</b> <ShareIcon /> na barra do Safari</>,
      <>Role e toque em <b>Adicionar à Tela de Início</b> <PlusSquare /></>,
      <>Toque em <b>Adicionar</b>. Pronto: o Aconchego fica na sua tela inicial</>,
    ]
  if (variant === 'android')
    return [
      <>Toque no menu <Dots vertical /> no canto de cima</>,
      <>Toque em <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>)</>,
      <>Confirme em <b>Instalar</b>. Pronto: o Aconchego fica na sua tela inicial</>,
    ]
  return [
    <>Toque em <Dots vertical={!isIOS()} /> no canto de cima da tela</>,
    <>Escolha <b>{isIOS() ? 'Abrir no navegador externo' : 'Abrir no Chrome'}</b></>,
    <>No navegador, entre na sua conta e instale o Aconchego</>,
  ]
}

/** Celular animado mostrando onde tocar, seguido dos passos por escrito. */
export function InstallGuide({ variant }: { variant: InstallVariant }) {
  const ios = isIOS()
  const menu = variant === 'ios' ? null : <Dots vertical={variant === 'android' || !ios} />
  const rows =
    variant === 'ios'
      ? ['Copiar', 'Adicionar à Tela de Início', 'Favoritos']
      : variant === 'android'
        ? ['Nova guia', 'Instalar app', 'Compartilhar']
        : ['Copiar link', ios ? 'Abrir no navegador externo' : 'Abrir no Chrome', 'Denunciar']

  return (
    <div className="install-guide">
      <div className={`ig-phone ig-phone--${variant}`} aria-hidden="true">
        <div className="ig-screen">
          <div className="ig-topbar">
            <span className="ig-url">aconchegoapp.online</span>
            {menu}
          </div>
          <div className="ig-page">
            <img src={lionHead} alt="" />
            <i />
            <i />
            <i className="short" />
          </div>
          {variant === 'ios' && (
            <div className="ig-toolbar">
              <span className="ig-share">
                <ShareIcon />
              </span>
            </div>
          )}
          <div className="ig-sheet">
            {rows.map((row, i) => (
              <span key={row} className={i === 1 ? 'ig-row ig-row--target' : 'ig-row'}>
                {row}
              </span>
            ))}
          </div>
          <div className="ig-home">
            {variant === 'inapp' ? (
              <span className="ig-browser">
                <span className="ig-url">aconchegoapp.online</span>
                <img src={lionHead} alt="" />
              </span>
            ) : (
              <>
                <i />
                <i />
                <i />
                <span className="ig-app">
                  <img src={lionHead} alt="" />
                  <small>Aconchego</small>
                </span>
              </>
            )}
          </div>
          <span className="ig-finger" />
        </div>
      </div>
      <ol className="install-guide__steps">
        {steps(variant).map((s, i) => (
          <li key={i}>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
