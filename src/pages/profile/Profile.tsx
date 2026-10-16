import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/Avatar'
import { ChildModal } from '../../components/ChildModal'
import { Icon, type IconName } from '../../components/Icon'
import { InstallButton } from '../../components/InstallButton'
import { plural } from '../../lib/format'
import { useApp } from '../../store/appContext'
import { usePlayer } from '../../store/playerContext'
import type { Child } from '../../types'
import { DeleteVoiceModal, EditProfileModal, NotificationSettingsModal, SettingsModal, SignOutModal } from './ProfileModals'
import './profile.css'

type ModalId = 'edit' | 'settings' | 'notifications' | 'delete' | 'signout' | null

const PLAN_LABEL = { free: 'Plano Gratuito', monthly: 'Plano Mensal', annual: 'Plano Anual' } as const

export default function Profile() {
  const { user, data } = useApp()
  const player = usePlayer()
  const navigate = useNavigate()
  const [modal, setModal] = useState<ModalId>(null)
  const [childModal, setChildModal] = useState<{ open: boolean; child?: Child }>({ open: false })
  const close = () => setModal(null)

  const hasVoice = data.voice.status !== 'none'
  const settingsRows: Array<{ icon: IconName; title: string; text: string; onClick: () => void }> = [
    {
      icon: 'mic',
      title: hasVoice ? 'Regravar minha voz' : 'Gravar minha voz',
      text: hasVoice
        ? 'Grave de novo para deixar a voz ainda mais parecida com você.'
        : 'Em poucos minutos, as histórias ganham a sua voz.',
      onClick: () => navigate('/gravar-voz'),
    },
    {
      icon: 'trash',
      title: 'Excluir minha voz',
      text: hasVoice ? 'Apaga sua voz e todos os dados relacionados.' : 'Nenhuma voz gravada no momento.',
      onClick: () => (hasVoice ? setModal('delete') : navigate('/gravar-voz')),
    },
    { icon: 'bell', title: 'Notificações', text: 'Lembretes e novidades do app', onClick: () => setModal('notifications') },
    { icon: 'shieldInfo', title: 'Política de privacidade', text: 'Como usamos seus dados', onClick: () => navigate('/privacidade') },
    { icon: 'help', title: 'Ajuda e suporte', text: 'Tire suas dúvidas', onClick: () => navigate('/ajuda') },
  ]

  return (
    <div className="container page profile">
      <div className="profile__layout">
        <div className="profile__col">
          <section className="profile__hero">
            <span className="profile__cloud" aria-hidden="true" />
            <button className="icon-btn profile__gear" onClick={() => setModal('settings')} aria-label="Configurações">
              <Icon name="gear" size={28} />
            </button>
            <Avatar size={128} seed={user?.name} ring />
            <h1 className="profile__name">{user?.name}</h1>
            <p className="profile__email">{user?.email}</p>
            <button className="btn btn--secondary btn--sm profile__edit" onClick={() => setModal('edit')}>
              Editar perfil
            </button>
          </section>

          <section className="section">
            <h2 className="section-title">{data.children.length > 1 ? 'Suas crianças' : 'Sua criança'}</h2>
            <div className="card kids">
              {data.children.map((child) => (
                <div key={child.id} className="kid">
                  <Link to="/progresso" className="kid__link" aria-label={`Progresso de ${child.name}`}>
                    <Avatar size={56} seed={child.name} />
                    <span className="kid__text">
                      <strong>{child.name}</strong>
                      <span>
                        {plural(child.age, 'ano', 'anos')}
                        {data.children.length > 1 && child.id === data.activeChildId ? ' · principal' : ''}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={22} className="kid__chevron" />
                  </Link>
                  <button className="icon-btn kid__edit" onClick={() => setChildModal({ open: true, child })} aria-label={`Editar ${child.name}`}>
                    <Icon name="edit" size={18} />
                  </button>
                </div>
              ))}
              <button className="kids__add" onClick={() => setChildModal({ open: true })}>
                <Icon name="plus" size={20} />
                {data.children.length ? 'Adicionar outra criança' : 'Adicionar criança'}
              </button>
            </div>
          </section>
        </div>

        <div className="profile__col">
          <section className={`plan-card${data.plan === 'free' ? '' : ' is-paid'}`}>
            <div className="plan-card__head">
              <Icon name="sparkles" size={34} className="plan-card__icon" />
              <h2 className="plan-card__title">{PLAN_LABEL[data.plan]}</h2>
              <span className="badge badge--plan">{data.plan === 'free' ? 'MVP' : 'ATIVO'}</span>
            </div>
            <p className="plan-card__text">
              {data.plan === 'free'
                ? 'Acesso a 3 histórias por enquanto.'
                : data.plan === 'annual'
                  ? 'Biblioteca completa e até 3 vozes na família.'
                  : 'Biblioteca completa com a sua voz.'}
            </p>
            <Link to="/planos" className="btn btn--plan btn--block">
              {data.plan === 'free' ? 'Ver planos completos' : 'Gerenciar plano'}
            </Link>
          </section>

          <section className="card settings-list" aria-label="Configurações da conta">
            {settingsRows.map((row) => (
              <button key={row.title} className="settings-row" onClick={row.onClick}>
                <Icon name={row.icon} size={26} className="settings-row__icon" />
                <span className="settings-row__text">
                  <strong>{row.title}</strong>
                  <span>{row.text}</span>
                </span>
                <Icon name="chevronRight" size={20} className="settings-row__chevron" />
              </button>
            ))}
          </section>

          <InstallButton className="btn btn--secondary btn--block" />

          <button className="btn btn--danger-outline btn--block" onClick={() => setModal('signout')}>
            <Icon name="logout" size={20} />
            Sair da conta
          </button>
        </div>
      </div>

      <EditProfileModal open={modal === 'edit'} onClose={close} />
      <SettingsModal open={modal === 'settings'} onClose={close} />
      <NotificationSettingsModal open={modal === 'notifications'} onClose={close} />
      <DeleteVoiceModal open={modal === 'delete'} onClose={close} />
      <SignOutModal open={modal === 'signout'} onClose={close} onConfirm={() => player.stop()} />
      <ChildModal open={childModal.open} child={childModal.child} onClose={() => setChildModal({ open: false })} />
    </div>
  )
}
