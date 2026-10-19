import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import lionSleeping from '../../assets/lion-sleeping.webp'
import { Icon } from '../../components/Icon'
import { QUIZ } from '../../quiz/config'
import { quizState } from '../../quiz/state'
import { QuizLayout } from './QuizLayout'

/** Tela de processamento (3 a 5 s) com mensagens em sequência. */
export default function QuizLoading() {
  const navigate = useNavigate()
  const state = quizState.get()
  const { messages, seconds, title } = QUIZ.loading
  const total = Math.min(5, Math.max(3, seconds)) * 1000
  const [current, setCurrent] = useState(0)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (!state?.completed) return
    const started = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started
      setPct(Math.min(100, (elapsed / total) * 100))
      setCurrent(Math.min(messages.length - 1, Math.floor((elapsed / total) * messages.length)))
      if (elapsed >= total) {
        window.clearInterval(timer)
        navigate('/quiz/cadastro', { replace: true })
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [state?.completed, total, messages.length, navigate])

  if (!state) return <Navigate to="/quiz" replace />
  if (!state.completed) return <Navigate to="/quiz/1" replace />

  return (
    <QuizLayout progress={100}>
      <section className="quiz-loading" aria-live="polite">
        <div className="quiz-loading__art">
          <img src={lionSleeping} alt="" />
          <svg className="quiz-loading__ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" />
            <circle cx="50" cy="50" r="46" style={{ strokeDashoffset: 289 * (1 - pct / 100) }} />
          </svg>
        </div>
        <h1 className="quiz-title">{title}</h1>
        <ul className="quiz-loading__steps" role="list">
          {messages.map((m, i) => (
            <li key={m} className={i < current ? 'is-done' : i === current ? 'is-current' : ''}>
              <span className="quiz-loading__dot">{i < current ? <Icon name="check" size={14} /> : null}</span>
              {m}
            </li>
          ))}
        </ul>
      </section>
    </QuizLayout>
  )
}
