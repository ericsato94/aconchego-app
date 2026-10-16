import type { IconName } from '../components/Icon'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  /** Rotas adicionais que mantêm este item ativo. */
  match: RegExp
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', icon: 'home', match: /^\/($|gravar-voz|voz)/ },
  { to: '/historias', label: 'Histórias', icon: 'books', match: /^\/(historias|progresso)/ },
  { to: '/favoritos', label: 'Favoritos', icon: 'star', match: /^\/favoritos/ },
  { to: '/sono', label: 'Sono', icon: 'moon', match: /^\/sono/ },
  { to: '/perfil', label: 'Perfil', icon: 'gear', match: /^\/(perfil|planos|privacidade|ajuda)/ },
]
