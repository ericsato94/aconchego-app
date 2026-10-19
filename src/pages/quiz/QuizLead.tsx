import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { QUIZ } from '../../quiz/config'
import { buildResult } from '../../quiz/result'
import { quizState } from '../../quiz/state'
import { saveLead } from '../../quiz/track'
import { QuizLayout } from './QuizLayout'

/** Máscara simples de WhatsApp brasileiro: (11) 91234-5678 */
function maskPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function QuizLead() {
  const navigate = useNavigate()
  const state = quizState.get()
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [name, setName] = useState(state?.name ?? '')
  const [contact, setContact] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!state) return <Navigate to="/quiz" replace />
  if (!state.completed) return <Navigate to="/quiz/1" replace />
  if (state.leadSaved) return <Navigate to="/quiz/resultado" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await saveLead({
        sessionId: state.sessionId,
        name,
        ...(channel === 'email' ? { email: contact } : { whatsapp: contact }),
        consent,
        answers: state.answers,
        identity: buildResult(state.answers).identityKey,
      })
      quizState.update({ name: name.trim(), leadSaved: true })
      navigate('/quiz/resultado', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar.')
      setBusy(false)
    }
  }

  return (
    <QuizLayout progress={100}>
      <section className="quiz-lead-form">
        <span className="quiz-badge">
          <Icon name="sparkles" size={18} /> Resultado pronto
        </span>
        <h1 className="quiz-title">{QUIZ.lead.title}</h1>
        <p className="quiz-lead">{QUIZ.lead.subtitle}</p>

        <form className="auth-form quiz-form" onSubmit={submit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label className="field">
            <span className="field__label">{QUIZ.lead.nameLabel}</span>
            <input className="input" required autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <div className="quiz-channel" role="radiogroup" aria-label="Como prefere receber">
            {(['whatsapp', 'email'] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={channel === c}
                className="chip"
                onClick={() => {
                  setChannel(c)
                  setContact('')
                }}
              >
                {c === 'whatsapp' ? QUIZ.lead.whatsappLabel : QUIZ.lead.emailLabel}
              </button>
            ))}
          </div>

          <label className="field">
            <span className="field__label">{channel === 'whatsapp' ? QUIZ.lead.whatsappLabel : QUIZ.lead.emailLabel}</span>
            {channel === 'whatsapp' ? (
              <input
                className="input"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(11) 91234-5678"
                value={contact}
                onChange={(e) => setContact(maskPhone(e.target.value))}
              />
            ) : (
              <input
                className="input"
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="voce@email.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            )}
          </label>

          <label className="check quiz-consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{QUIZ.lead.consent}</span>
          </label>

          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Enviando…' : QUIZ.lead.button}
          </button>
        </form>
      </section>
    </QuizLayout>
  )
}
