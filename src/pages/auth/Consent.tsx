import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.webp'
import { Icon } from '../../components/Icon'
import { VOICE } from '../../config/app'
import { useApp } from '../../store/appContext'
import { AuthLayout } from './AuthLayout'

const ITEMS = [
  {
    id: 'voz-biometrica',
    label:
      'Autorizo o Aconchego a tratar a minha voz como dado biométrico, exclusivamente para criar a narração das histórias. Confirmo que vou gravar apenas a minha própria voz.',
  },
  {
    id: 'dados-crianca',
    label:
      'Sou responsável legal pela criança cadastrada e autorizo o uso do nome e da idade dela apenas para personalizar a experiência.',
  },
  { id: 'politica', label: 'Li e concordo com a Política de Privacidade.' },
]

export default function Consent() {
  const { actions, data } = useApp()
  const navigate = useNavigate()
  const [checked, setChecked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const all = checked.length === ITEMS.length

  const accept = async () => {
    setBusy(true)
    setError('')
    try {
      await actions.acceptConsent(checked)
      navigate(data.voice.status === 'none' ? '/gravar-voz' : '/', { replace: true })
    } catch {
      setError('Não foi possível registrar o seu aceite. Verifique a conexão e tente de novo.')
      setBusy(false)
    }
  }

  return (
    <AuthLayout top={<><span style={{ width: 44 }} /><img className="auth__mini-logo" src={logo} alt="Aconchego" /><span style={{ width: 44 }} /></>}>
      <div>
        <h1 className="auth-title">Sua voz, seus dados</h1>
        <p className="auth-sub">Antes de gravar, explicamos em poucas palavras como cuidamos de tudo.</p>
      </div>

      <div className="consent__summary">
        <div className="consent__point">
          <Icon name="shieldInfo" />
          <span>
            <strong>Protegida</strong>Sua voz é guardada com criptografia e nunca é vendida.
          </span>
        </div>
        <div className="consent__point">
          <Icon name="mic" />
          <span>
            <strong>Só a sua</strong>Uma frase aleatória confirma que a voz gravada é sua.
          </span>
        </div>
        <div className="consent__point">
          <Icon name="trash" />
          <span>
            <strong>Exclusão em um toque</strong>Apague sua voz e as gravações quando quiser.
          </span>
        </div>
        <div className="consent__point">
          <Icon name="heart" />
          <span>
            <strong>Pensado para crianças</strong>Coletamos o mínimo de dados da criança.
          </span>
        </div>
      </div>

      <div className="consent__list" role="group" aria-label="Autorizações">
        {ITEMS.map((item) => (
          <label key={item.id} className="check">
            <input
              type="checkbox"
              checked={checked.includes(item.id)}
              onChange={(e) =>
                setChecked((c) => (e.target.checked ? [...c, item.id] : c.filter((x) => x !== item.id)))
              }
            />
            <span>
              {item.id === 'politica' ? (
                <>
                  Li e concordo com a{' '}
                  <Link to="/privacidade" target="_blank" rel="noopener">
                    Política de Privacidade
                  </Link>
                  .
                </>
              ) : (
                item.label
              )}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn--primary btn--block" disabled={!all || busy} onClick={accept}>
        Aceitar e continuar
      </button>
      <p className="consent__meta">
        Versão {VOICE.consentVersion} do termo. Registramos data e hora do seu aceite.
      </p>
    </AuthLayout>
  )
}
