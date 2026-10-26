import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useApp } from '../../store/appContext'

/** Card "Criar história": atalho para a história personalizada do dia. */
export function CreatePromo() {
  const { activeChild } = useApp()
  return (
    <Link to="/criar-historia" className="create-promo">
      <span className="create-promo__icon" aria-hidden="true">
        <Icon name="sparkles" size={26} />
      </span>
      <span className="create-promo__body">
        <span className="create-promo__title">Criar uma história nova</span>
        <span className="create-promo__text">
          Conte um tema e a gente escreve uma história só {activeChild ? `para ${activeChild.name}` : 'para o seu filho'}.
        </span>
      </span>
      <Icon name="chevronRight" size={22} className="create-promo__chevron" />
    </Link>
  )
}
