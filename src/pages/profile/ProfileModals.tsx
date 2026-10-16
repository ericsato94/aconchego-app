import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { Toggle } from '../../components/Toggle'
import { AuthError } from '../../services/auth'
import { useApp } from '../../store/appContext'
import { useToast } from '../../store/toastContext'

interface ModalProps {
  open: boolean
  onClose: () => void
}

export function EditProfileModal({ open, onClose }: ModalProps) {
  return open ? <EditProfileForm open={open} onClose={onClose} /> : null
}

function EditProfileForm({ open, onClose }: ModalProps) {
  const { user, actions } = useApp()
  const toast = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const emailPending = await actions.updateProfile(name, email)
      toast(emailPending ? 'Perfil salvo. Confirme o novo e-mail pelo link que enviamos.' : 'Perfil atualizado', 'success')
      onClose()
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Não foi possível salvar.')
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar perfil"
      footer={
        <button type="submit" form="profile-form" className="btn btn--primary btn--sm" disabled={busy}>
          Salvar alterações
        </button>
      }
    >
      <form id="profile-form" className="form-grid form-grid--2" onSubmit={submit}>
        {error && <p className="form-error" role="alert" style={{ gridColumn: '1 / -1' }}>{error}</p>}
        <label className="field">
          <span className="field__label">Nome</span>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" data-autofocus />
        </label>
        <label className="field">
          <span className="field__label">E-mail</span>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
      </form>
    </Modal>
  )
}

const RATES = [
  { value: 0.8, label: 'Devagar' },
  { value: 0.95, label: 'Normal' },
  { value: 1.1, label: 'Rápida' },
]

export function SettingsModal({ open, onClose }: ModalProps) {
  const { data, actions } = useApp()
  return (
    <Modal open={open} onClose={onClose} title="Configurações" size="sm">
      <div className="field">
        <span className="field__label">Velocidade da narração</span>
        <div className="sleep__chips" role="radiogroup" aria-label="Velocidade da narração">
          {RATES.map((r) => (
            <button
              key={r.value}
              className="chip"
              role="radio"
              aria-checked={data.settings.narrationRate === r.value}
              onClick={() => actions.updateSettings({ narrationRate: r.value })}
            >
              {r.label}
            </button>
          ))}
        </div>
        <span className="field__hint">Vale para todas as histórias e para o modo hora de dormir.</span>
      </div>
    </Modal>
  )
}

export function NotificationSettingsModal({ open, onClose }: ModalProps) {
  const { data, actions } = useApp()
  const toast = useToast()
  const { settings } = data

  const setReminder = async (on: boolean) => {
    if (on && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const result = await Notification.requestPermission()
      if (result !== 'granted') toast('Sem permissão do navegador: o lembrete aparecerá dentro do app.')
    }
    actions.updateSettings({ bedtimeReminder: on })
  }

  return (
    <Modal open={open} onClose={onClose} title="Notificações" description="Escolha o que você quer receber." size="sm">
      <div className="toggle-list">
        <Toggle
          checked={settings.bedtimeReminder}
          onChange={setReminder}
          label="Lembrete da hora de dormir"
          description="Um aviso no horário habitual da história."
        />
        {settings.bedtimeReminder && (
          <label className="field toggle-list__time">
            <span className="field__label">Horário</span>
            <input
              className="input"
              type="time"
              value={settings.reminderTime}
              onChange={(e) => actions.updateSettings({ reminderTime: e.target.value })}
            />
          </label>
        )}
        <Toggle
          checked={settings.weeklySummary}
          onChange={(v) => actions.updateSettings({ weeklySummary: v })}
          label="Resumo semanal"
          description="Quantas histórias foram ouvidas na semana."
        />
        <Toggle
          checked={settings.news}
          onChange={(v) => actions.updateSettings({ news: v })}
          label="Novidades do app"
          description="Histórias novas toda semana."
        />
      </div>
    </Modal>
  )
}

export function DeleteVoiceModal({ open, onClose }: ModalProps) {
  const { actions } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await actions.deleteVoice()
      onClose()
      toast('Sua voz foi excluída', 'success')
      navigate('/')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Não foi possível excluir agora. Tente de novo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Excluir minha voz?"
      description="Vamos apagar sua voz clonada e todas as gravações. Essa ação não pode ser desfeita."
      size="sm"
      footer={
        <>
          <button className="btn btn--secondary btn--sm" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--danger btn--sm" onClick={confirm} disabled={busy}>
            {busy ? 'Excluindo…' : 'Excluir definitivamente'}
          </button>
        </>
      }
    >
      <p className="muted">As histórias continuam disponíveis com a narração padrão, e você pode gravar de novo quando quiser.</p>
    </Modal>
  )
}

export function SignOutModal({ open, onClose, onConfirm }: ModalProps & { onConfirm: () => void }) {
  const { actions } = useApp()
  const navigate = useNavigate()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sair da conta?"
      size="sm"
      footer={
        <>
          <button className="btn btn--secondary btn--sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn--danger btn--sm"
            onClick={async () => {
              onConfirm()
              await actions.signOut()
              navigate('/bem-vindo', { replace: true })
            }}
          >
            Sair
          </button>
        </>
      }
    >
      <p className="muted">Seus dados continuam salvos neste aparelho para quando você voltar.</p>
    </Modal>
  )
}
