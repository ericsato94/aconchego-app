import { Link, Outlet, useLocation } from 'react-router-dom'
import logo from '../assets/logo.webp'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { InstallButton } from '../components/InstallButton'
import { useApp } from '../store/appContext'
import { MiniPlayer } from './MiniPlayer'
import { NAV_ITEMS } from './navItems'
import { SleepOverlay } from './SleepOverlay'
import './AppLayout.css'

export function AppLayout() {
  const { pathname } = useLocation()
  const { data, activeChild } = useApp()
  const isActive = (match: RegExp) => match.test(pathname)

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <Link to="/" className="sidebar__logo" aria-label="Aconchego — início">
          <img src={logo} alt="Aconchego" />
        </Link>
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="sidebar__item"
              aria-current={isActive(item.match) ? 'page' : undefined}
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar__foot">
          {activeChild && (
            <Link to="/progresso" className="sidebar__child">
              <Avatar size={40} seed={activeChild.name} />
              <span>
                <strong>{activeChild.name}</strong>
                <small>Ver progresso</small>
              </span>
              <Icon name="chevronRight" size={18} />
            </Link>
          )}
          {data.plan === 'free' && (
            <Link to="/planos" className="sidebar__plan">
              <Icon name="sparkles" size={20} />
              <span>
                <strong>Plano Gratuito</strong>
                <small>Conheça os planos completos</small>
              </span>
            </Link>
          )}
          <InstallButton className="btn btn--ghost btn--sm" />
        </div>
      </aside>

      <main className="shell__main" id="conteudo">
        <Outlet />
      </main>

      <MiniPlayer />

      <nav className="bottom-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="bottom-nav__item"
            aria-current={isActive(item.match) ? 'page' : undefined}
          >
            <Icon name={item.icon} size={26} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <SleepOverlay />
    </div>
  )
}
