import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.webp'
import { BackButton } from '../../components/BackButton'
import { AuthError } from '../../services/auth'
import { useApp } from '../../store/appContext'
import { AuthLayout } from './AuthLayout'

const AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function SignUp() {
  const { actions } = useApp()
  const [form, setForm] = useState({ name: '', email: '', password: '', childName: '', childAge: '4' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const shortPassword = form.password.length > 0 && form.password.length < 6

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) return
    setBusy(true)
    setError('')
    try {
      await actions.signUp(
        form.name,
        form.email,
        form.password,
        form.childName.trim() ? { name: form.childName.trim(), age: Number(form.childAge) } : undefined,
      )
      // As regras de rota levam ao consentimento assim que a conta abre.
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Não foi possível criar a conta. Tente novamente.')
      setBusy(false)
    }
  }

  return (
    <AuthLayout top={<><BackButton fallback="/bem-vindo" /><img className="auth__mini-logo" src={logo} alt="Aconchego" /><span style={{ width: 44 }} /></>}>
      <div>
        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-sub">Leva menos de um minuto. Depois, é só gravar sua voz.</p>
      </div>

      <form className="auth-form" onSubmit={submit} noValidate={false}>
        {error && <p className="form-error" role="alert">{error}</p>}
        <fieldset className="fieldset">
          <legend>Seus dados</legend>
          <label className="field">
            <span className="field__label">Seu nome</span>
            <input className="input" required value={form.name} onChange={set('name')} autoComplete="name" placeholder="Como você quer ser chamado(a)" />
          </label>
          <label className="field">
            <span className="field__label">E-mail</span>
            <input className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" placeholder="voce@email.com" />
          </label>
          <label className="field">
            <span className="field__label">Senha</span>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              aria-invalid={shortPassword}
              aria-describedby="senha-hint"
            />
            <span id="senha-hint" className={shortPassword ? 'field__error' : 'field__hint'}>
              Mínimo de 6 caracteres.
            </span>
          </label>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Sua criança (opcional)</legend>
          <div className="form-grid form-grid--2">
            <label className="field">
              <span className="field__label">Nome</span>
              <input className="input" value={form.childName} onChange={set('childName')} placeholder="Ex.: Sofia" />
            </label>
            <label className="field">
              <span className="field__label">Idade</span>
              <select className="input" value={form.childAge} onChange={set('childAge')}>
                {AGES.map((a) => (
                  <option key={a} value={a}>
                    {a} {a === 1 ? 'ano' : 'anos'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <span className="field__hint">Usamos só para filtrar histórias por idade. Você pode mudar depois.</span>
        </fieldset>

        <button className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Criando…' : 'Continuar'}
        </button>
        <p className="auth-switch">
          Já tem uma conta? <Link to="/entrar">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
