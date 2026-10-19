import { useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { StoryCover } from '../../components/StoryCover'
import { firstName } from '../../lib/format'
import { QUIZ, fill } from '../../quiz/config'
import { buildResult } from '../../quiz/result'
import { quizState } from '../../quiz/state'
import { track } from '../../quiz/track'
import { useToast } from '../../store/toastContext'
import { QuizImage } from './QuizImage'
import { QuizLayout } from './QuizLayout'

export default function QuizResult() {
  const navigate = useNavigate()
  const toast = useToast()
  const state = quizState.get()

  useEffect(() => {
    if (!state?.leadSaved || state.viewed?.result) return
    void track({ sessionId: state.sessionId, type: 'result_viewed' })
    quizState.update({ viewed: { ...state.viewed, result: true } })
  }, [state])

  if (!state) return <Navigate to="/quiz" replace />
  if (!state.leadSaved) return <Navigate to={state.completed ? '/quiz/cadastro' : '/quiz/1'} replace />

  const result = buildResult(state.answers)
  const { identity } = result
  const R = QUIZ.result

  const share = async () => {
    const url = `${window.location.origin}/quiz`
    const text = fill(R.shareText, { identity: identity.name })
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Quiz Aconchego', text, url })
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        toast('Link copiado! É só colar para quem você quiser.', 'success')
      }
    } catch {
      /* compartilhamento cancelado */
    }
  }

  const restart = () => {
    quizState.reset()
    navigate('/quiz')
  }

  return (
    <QuizLayout wide>
      <section className="quiz-result">
        <div className="quiz-result__hero">
          <QuizImage name={identity.image} className="quiz-result__img" />
          <div>
            <span className="quiz-eyebrow">
              {R.eyebrow}, {firstName(state.name ?? '')}
            </span>
            <h1 className="quiz-title quiz-title--hero">{identity.name}</h1>
            <p className="quiz-lead">{identity.description}</p>
          </div>
        </div>

        <div className="quiz-result__grid">
          <div className="quiz-result__col">
            {result.painText && (
              <article className="quiz-panel quiz-panel--pain">
                <Icon name="heart" size={26} />
                <p>{result.painText}</p>
              </article>
            )}
            {result.objection && (
              <article className="quiz-panel">
                <h2 className="quiz-panel__title">
                  <Icon name="check" size={20} /> {result.objection.title}
                </h2>
                <p>{result.objection.text}</p>
              </article>
            )}
          </div>

          <article className="quiz-panel quiz-preview" aria-label={R.previewTitle}>
            <h2 className="quiz-panel__title">{R.previewTitle}</h2>
            <div className="quiz-preview__stories">
              {result.stories.map((s, i) => (
                <div key={s.id} className={`quiz-preview__story${i > 0 ? ' is-locked' : ''}`}>
                  <StoryCover story={s} />
                  <span>{s.title}</span>
                  {i > 0 && (
                    <span className="quiz-lock" aria-label="Bloqueado">
                      <Icon name="lock" size={16} />
                    </span>
                  )}
                </div>
              ))}
            </div>
            <ol className="quiz-preview__nights">
              {R.previewNights.map((night, i) => (
                <li key={night} className={i >= R.visibleNights ? 'is-locked' : ''} aria-hidden={i >= R.visibleNights}>
                  {night}
                </li>
              ))}
            </ol>
            <p className="quiz-preview__locked">
              <Icon name="lock" size={16} /> {R.lockedNote}
            </p>
          </article>
        </div>

        <div className="quiz-result__actions">
          <Link to="/oferta" className="btn btn--primary btn--block quiz-cta">
            {R.cta}
            <Icon name="chevronRight" size={20} />
          </Link>
          <div className="quiz-result__secondary">
            <button className="btn btn--secondary btn--sm" onClick={share}>
              <Icon name="sparkles" size={18} /> {R.share}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={restart}>
              <Icon name="refresh" size={18} /> {R.restart}
            </button>
          </div>
        </div>
      </section>
    </QuizLayout>
  )
}
