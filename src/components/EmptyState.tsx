import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import './EmptyState.css'

interface Props {
  icon: IconName
  title: string
  text: string
  action?: ReactNode
}

export function EmptyState({ icon, title, text, action }: Props) {
  return (
    <div className="empty card">
      <span className="empty__icon">
        <Icon name={icon} size={34} />
      </span>
      <h3 className="empty__title">{title}</h3>
      <p className="empty__text">{text}</p>
      {action}
    </div>
  )
}
