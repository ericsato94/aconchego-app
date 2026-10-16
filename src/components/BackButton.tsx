import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

/** Volta no histórico; se a página foi aberta direto (deep link), vai para o destino padrão. */
export function BackButton({ fallback = '/', label = 'Voltar' }: { fallback?: string; label?: string }) {
  const navigate = useNavigate()
  return (
    <button
      className="icon-btn"
      aria-label={label}
      onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback, { replace: true }))}
    >
      <Icon name="chevronLeft" size={26} />
    </button>
  )
}
