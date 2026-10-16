import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.webp'
import { BackButton } from '../../components/BackButton'
import { AuthError, DEMO_USER } from '../../services/auth'
import { useApp } from '../../store/appContext'
import { AuthLayout } from './AuthLayout'

export default function Login() {
  const { actions } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      // As regras de rota levam ao início (ou ao consentimento, se faltar).
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Não foi possível entrar. Tente novamente.')
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(() => actions.signIn(email, password))
  }

  return (
    <AuthLayout top={<><BackButton fallback="/bem-vindo" /><img className="auth__mini-logo" src={logo} alt="Aconchego" /><span style={{ width: 44 }} /></>}>
      <div>
        <h1 className="auth-title">Que bom te ver de novo!</h1>
        <p className="auth-sub">Entre para continuar as histórias de onde parou.</p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {error && <p className="form-error" role="alert">{error}</p>}
        <label className="field">
          <span className="field__label">E-mail</span>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="field">
          <span className="field__label">Senha</span>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        <button className="btn btn--primary btn--block" disabled={busy}>
          Entrar
        </button>
      </form>

      <div className="demo-box">
        <span>
          <strong>Quer só conhecer?</strong> Entre na conta de demonstração ({DEMO_USER.email}) com histórico, voz pronta e
          a Sofia já cadastrada.
        </span>
        <button className="btn btn--secondary btn--sm" onClick={() => run(actions.signInDemo)} disabled={busy}>
          Entrar com conta de demonstração
        </button>
      </div>

      <p className="auth-switch">
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>
    </AuthLayout>
  )
}
