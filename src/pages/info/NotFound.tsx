import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'

export default function NotFound() {
  return (
    <div className="container page">
      <EmptyState
        icon="moon"
        title="Página não encontrada"
        text="Essa página foi dormir mais cedo. Que tal voltar para o início?"
        action={<Link to="/" className="btn btn--primary btn--sm">Ir para o início</Link>}
      />
    </div>
  )
}
