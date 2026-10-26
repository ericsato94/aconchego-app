import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import lionReading from '../../assets/lion-reading.webp'
import { BackButton } from '../../components/BackButton'
import { Icon } from '../../components/Icon'
import { isChildName } from '../../data/greetings'
import { customStories, StoryApiError, useCustomStories, type StoryMood, type StoryUsage } from '../../services/customStories'
import { useApp } from '../../store/appContext'
import './create.css'

const MOODS: Array<{ id: StoryMood; label: string }> = [
  { id: 'calma', label: 'Calminha' },
  { id: 'aventura', label: 'Aventura' },
  { id: 'divertida', label: 'Divertida' },
  { id: 'amizade', label: 'Amizade' },
]

const IDEAS = [
  'Um dinossauro que tem medo do escuro',
  'O primeiro dia na escola nova',
  'Uma viagem de foguete até a lua',
  'Um cachorrinho que quer fazer amigos',
]

const STEPS = ['Lendo o seu pedido…', 'Escrevendo a história…', 'Conferindo se está tudo certo para crianças…']
const MAX_ABOUT = 300

function usageText(u: StoryUsage) {
  if (u.plan === 'gratis') return u.used >= u.limit ? 'Você já usou a sua história de teste.' : 'Você tem 1 história de teste grátis.'
  const left = Math.max(0, u.limit - u.used)
  return `${left} de ${u.limit} histórias disponíveis neste mês · até ${u.dayLimit} por dia`
}

export default function CreateStory() {
  const { activeChild } = useApp()
  const { usage, loaded } = useCustomStories()
  const navigate = useNavigate()
  const childName = activeChild && isChildName(activeChild.name) ? activeChild.name : ''
  const [useName, setUseName] = useState(Boolean(childName))
  const [about, setAbout] = useState('')
  const [mood, setMood] = useState<StoryMood>('calma')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<{ text: string; limit?: boolean } | null>(null)

  useEffect(() => {
    customStories.load()
  }, [])

  useEffect(() => {
    if (!busy) return
    const timer = window.setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 6000)
    return () => window.clearInterval(timer)
  }, [busy])

  const free = usage?.plan === 'gratis'
  const outOfStories = Boolean(usage && (usage.used >= usage.limit || usage.today >= usage.dayLimit))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || about.trim().length < 3) return
    setStep(0)
    setBusy(true)
    setError(null)
    try {
      const story = await customStories.create({
        about: about.trim(),
        mood,
        age: activeChild?.age ?? 5,
        childName: useName && childName ? childName : undefined,
      })
      navigate(`/historias/${story.id}`, { replace: true })
    } catch (err) {
      const status = err instanceof StoryApiError ? err.status : 0
      setError({
        text: err instanceof Error ? err.message : 'Não foi possível criar a história.',
        limit: status === 429,
      })
      setBusy(false)
    }
  }

  if (busy) {
    return (
      <div className="container page create">
        <div className="create__busy card" role="status" aria-live="polite">
          <img src={lionReading} alt="" className="create__busy-art" />
          <h1 className="page-title">Criando a história…</h1>
          <p className="create__busy-step">
            <span className="create__spinner" aria-hidden="true" />
            {STEPS[step]}
          </p>
          <p className="page-subtitle">Leva menos de um minuto. Não feche esta tela.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container page create">
      <header className="create__bar">
        <BackButton fallback="/" />
      </header>

      <div className="create__head">
        <h1 className="page-title">Criar história</h1>
        <p className="page-subtitle">
          Conte sobre o que você quer que seja a história de hoje{childName ? ` para ${childName}` : ''}.
        </p>
        {usage && <p className={`create__usage${outOfStories ? ' is-out' : ''}`}>{usageText(usage)}</p>}
      </div>

      {outOfStories && usage ? (
        <div className="card create__limit">
          <Icon name={free ? 'crown' : 'calendar'} size={28} />
          <p>
            {free
              ? 'Assine para criar até 6 histórias por mês, narradas com a sua voz.'
              : usage.used >= usage.limit
                ? 'Você já criou todas as histórias deste mês. O limite renova no dia 1º.'
                : 'Você já criou as histórias de hoje. Amanhã tem mais!'}
          </p>
          {free ? (
            <Link to="/planos" className="btn btn--plan btn--block">Ver planos</Link>
          ) : (
            <Link to="/historias?filtro=criadas" className="btn btn--secondary btn--block">Ver minhas histórias</Link>
          )}
        </div>
      ) : (
        <form className="card create__form" onSubmit={submit}>
          <label className="field">
            <span className="field__label">Sobre o que vai ser a história?</span>
            <textarea
              className="input create__about"
              value={about}
              maxLength={MAX_ABOUT}
              rows={3}
              required
              placeholder="Ex.: um ursinho que aprende a dividir os brinquedos"
              onChange={(e) => setAbout(e.target.value)}
            />
            <span className="field__hint create__count">{about.length}/{MAX_ABOUT}</span>
          </label>

          <div className="chips create__ideas" aria-label="Ideias">
            {IDEAS.map((idea) => (
              <button key={idea} type="button" className="chip" onClick={() => setAbout(idea)}>
                {idea}
              </button>
            ))}
          </div>

          <fieldset className="field create__fieldset">
            <legend className="field__label">Clima da história</legend>
            <div className="chips" role="radiogroup" aria-label="Clima da história">
              {MOODS.map((m) => (
                <button key={m.id} type="button" className="chip" role="radio" aria-checked={mood === m.id} onClick={() => setMood(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>

          {childName && (
            <label className="create__check">
              <input type="checkbox" checked={useName} onChange={(e) => setUseName(e.target.checked)} />
              <span>
                {childName} participa da história ({activeChild?.age} {activeChild?.age === 1 ? 'ano' : 'anos'})
              </span>
            </label>
          )}

          {error && (
            <p className="field__error create__error" role="alert">
              {error.text}
              {error.limit && free && (
                <>
                  {' '}
                  <Link to="/planos">Ver planos</Link>
                </>
              )}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={!loaded || about.trim().length < 3}>
            <Icon name="sparkles" size={20} />
            Criar história
          </button>

          <p className="create__note">
            <Icon name="shield" size={16} />
            Toda história passa por filtros de segurança para crianças antes de chegar até você.
            {free && ' No teste grátis, a história usa a narração padrão.'}
          </p>
        </form>
      )}
    </div>
  )
}
