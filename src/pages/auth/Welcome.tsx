import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { authService } from '../../services/auth'
import { useApp } from '../../store/appContext'
import { useToast } from '../../store/toastContext'
import { AuthLayout } from './AuthLayout'

export default function Welcome() {
  const { actions } = useApp()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const google = async () => {
    setBusy(true)
    try {
      if (!(await authService.googleEnabled())) {
        toast('O login com Google será ativado em breve. Por enquanto, crie uma conta com e-mail.')
        return
      }
      await actions.signInWithGoogle()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Não foi possível entrar com o Google.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout heroLogo>
      <div>
        <h1 className="welcome__headline">A voz de quem você ama, agora em histórias.</h1>
        <p className="welcome__lead">
          Em <strong>5 minutos</strong> de gravação, seu filho dorme ouvindo a sua voz, todas as noites.
        </p>
      </div>

      <ul className="values" role="list">
        <li className="values__item">
          <Icon name="heart" style={{ color: 'var(--c-pink)' }} />
          Conexão emocional
        </li>
        <li className="values__item">
          <Icon name="shield" style={{ color: 'var(--c-sky)' }} />
          Segurança e confiança
        </li>
        <li className="values__item">
          <Icon name="star" style={{ color: 'var(--c-sun)' }} />
          Diversão e aprendizado
        </li>
      </ul>

      <div className="auth-actions">
        <Link to="/cadastro" className="btn btn--primary btn--block">
          Criar conta
        </Link>
        <button className="btn btn--secondary btn--block" onClick={google} disabled={busy}>
          <Icon name="google" size={22} />
          Continuar com Google
        </button>
        <div className="divider">ou</div>
        <p className="auth-switch">
          Já tem uma conta? <Link to="/entrar">Entrar</Link>
        </p>
      </div>

    </AuthLayout>
  )
}
