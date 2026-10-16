import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { timeAgo } from '../../lib/format'
import { useApp } from '../../store/appContext'
import './notifications.css'

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, actions } = useApp()
  const navigate = useNavigate()
  const hasUnread = data.notifications.some((n) => !n.read)

  // Marca como lidas ao fechar, para o destaque de "nova" aparecer enquanto o painel está aberto.
  useEffect(() => {
    if (!open || !hasUnread) return
    return () => actions.markNotificationsRead()
  }, [open, hasUnread, actions])

  return (
    <Modal open={open} onClose={onClose} title="Notificações" variant="drawer">
      {data.notifications.length === 0 ? (
        <EmptyState icon="bell" title="Tudo tranquilo por aqui" text="Avisaremos quando sua voz ficar pronta e na hora da história." />
      ) : (
        <ul className="notif-list" role="list">
          {data.notifications.map((n) => (
            <li key={n.id}>
              <button
                className={`notif${n.read ? '' : ' notif--new'}`}
                onClick={() => {
                  onClose()
                  if (n.link) navigate(n.link)
                }}
              >
                <span className="notif__icon">
                  <Icon name="bell" size={18} />
                </span>
                <span className="notif__text">
                  <strong>{n.title}</strong>
                  <span>{n.body}</span>
                  <small>{timeAgo(n.at)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
