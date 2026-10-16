import { useState, type FormEvent } from 'react'
import { useApp } from '../store/appContext'
import { useToast } from '../store/toastContext'
import type { Child } from '../types'
import { Modal } from './Modal'

const AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface Props {
  open: boolean
  onClose: () => void
  /** Ausente = adicionar nova criança. */
  child?: Child
}

export function ChildModal(props: Props) {
  // Remonta o formulário a cada abertura para começar com os dados certos.
  return props.open ? <ChildForm key={props.child?.id ?? 'new'} {...props} /> : null
}

function ChildForm({ open, onClose, child }: Props) {
  const { data, actions } = useApp()
  const toast = useToast()
  const [name, setName] = useState(child?.name ?? '')
  const [age, setAge] = useState(String(child?.age ?? 4))
  const [confirmRemove, setConfirmRemove] = useState(false)
  const isActive = child && data.activeChildId === child.id

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (child) actions.updateChild({ ...child, name: name.trim(), age: Number(age) })
    else actions.addChild({ name: name.trim(), age: Number(age) })
    toast(child ? 'Dados atualizados' : `${name.trim()} foi adicionada(o)!`, 'success')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={child ? `Editar ${child.name}` : 'Adicionar criança'}
      description="Usamos nome e idade apenas para personalizar e filtrar as histórias."
      size="sm"
      footer={
        <>
          {child && (
            <button
              type="button"
              className="btn btn--danger-outline btn--sm"
              onClick={() => {
                if (!confirmRemove) return setConfirmRemove(true)
                actions.removeChild(child.id)
                toast('Criança removida')
                onClose()
              }}
            >
              {confirmRemove ? 'Confirmar remoção' : 'Remover'}
            </button>
          )}
          <button type="submit" form="child-form" className="btn btn--primary btn--sm">
            Salvar
          </button>
        </>
      }
    >
      <form id="child-form" className="form-grid form-grid--2" onSubmit={submit}>
        <label className="field">
          <span className="field__label">Nome</span>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} data-autofocus />
        </label>
        <label className="field">
          <span className="field__label">Idade</span>
          <select className="input" value={age} onChange={(e) => setAge(e.target.value)}>
            {AGES.map((a) => (
              <option key={a} value={a}>
                {a} {a === 1 ? 'ano' : 'anos'}
              </option>
            ))}
          </select>
        </label>
        {child && data.children.length > 1 && !isActive && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => { actions.setActiveChild(child.id); onClose() }}>
            Tornar criança principal
          </button>
        )}
      </form>
    </Modal>
  )
}
