import type { ReactNode } from 'react'
import logo from '../../assets/logo.webp'
import { Clouds } from '../../components/Clouds'
import './auth.css'

interface Props {
  children: ReactNode
  /** Logo grande no topo (tela de boas-vindas) ou compacto (demais telas) no mobile. */
  heroLogo?: boolean
  top?: ReactNode
}

/** Mobile: fundo céu com conteúdo em coluna. Desktop: painel da marca à esquerda + conteúdo à direita. */
export function AuthLayout({ children, heroLogo, top }: Props) {
  return (
    <div className={`auth${heroLogo ? ' auth--hero' : ''}`}>
      <section className="auth__brand" aria-hidden={!heroLogo}>
        <Clouds />
        <img className="auth__logo" src={logo} alt={heroLogo ? 'Aconchego — Histórias que abraçam com a sua voz' : ''} />
        <p className="auth__quote">“Aqui, toda história tem a sua voz.”</p>
      </section>
      <section className="auth__content">
        {top && <div className="auth__top">{top}</div>}
        <div className="auth__inner">{children}</div>
      </section>
    </div>
  )
}
