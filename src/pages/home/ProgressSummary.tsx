import { Link } from 'react-router-dom'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { duration, streakDays } from '../../lib/format'
import { useApp } from '../../store/appContext'

/** Resumo de progresso — visível no Início a partir do desktop (coluna lateral). */
export function ProgressSummary() {
  const { data, activeChild } = useApp()
  const seconds = data.history.reduce((acc, h) => acc + h.seconds, 0)

  return (
    <Link to="/progresso" className="summary card">
      <div className="summary__head">
        <Avatar size={44} seed={activeChild?.name ?? 'crianca'} />
        <span>
          <strong>{activeChild ? `Progresso de ${activeChild.name}` : 'Seu progresso'}</strong>
          <small>Últimas noites</small>
        </span>
        <Icon name="chevronRight" size={20} />
      </div>
      <dl className="summary__stats">
        <div>
          <dt>Histórias</dt>
          <dd>{data.history.length}</dd>
        </div>
        <div>
          <dt>Tempo</dt>
          <dd>{duration(seconds)}</dd>
        </div>
        <div>
          <dt>Sequência</dt>
          <dd>{streakDays(data.history)} dias</dd>
        </div>
      </dl>
    </Link>
  )
}
