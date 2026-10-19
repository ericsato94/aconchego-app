import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { QUESTIONS } from '../../quiz/config'
import { quizState } from '../../quiz/state'
import { track } from '../../quiz/track'
import { QuizImage } from './QuizImage'
import { QuizLayout } from './QuizLayout'

/** Uma pergunta por tela. A resposta avança sozinha depois de um instante de destaque. */
export default function QuizQuestion() {
  const { step = '1' } = useParams()
  const navigate = useNavigate()
  const index = Number(step) - 1
  const question = QUESTIONS[index]
  const state = quizState.get()
  const [picked, setPicked] = useState<string | null>(null)

  if (!state) return <Navigate to="/quiz" replace />
  if (!question) return <Navigate to="/quiz/1" replace />
  // Não pula perguntas: volta para a primeira sem resposta.
  const firstMissing = QUESTIONS.findIndex((q) => !state.answers[q.id])
  if (firstMissing !== -1 && firstMissing < index) return <Navigate to={`/quiz/${firstMissing + 1}`} replace />

  const selected = picked ?? state.answers[question.id]
  const total = QUESTIONS.length

  const choose = (optionId: string) => {
    if (picked) return
    setPicked(optionId)
    quizState.answer(question.id, optionId)
    void track({ sessionId: state.sessionId, type: 'question_answered', step: index + 1, questionId: question.id, answer: optionId })
    window.setTimeout(() => {
      setPicked(null)
      if (index + 1 < total) {
        navigate(`/quiz/${index + 2}`)
      } else {
        quizState.update({ completed: true })
        void track({ sessionId: state.sessionId, type: 'quiz_completed' })
        navigate('/quiz/analisando')
      }
    }, 320)
  }

  return (
    <QuizLayout
      progress={((index + (selected ? 1 : 0)) / total) * 100}
      progressLabel={`Pergunta ${index + 1} de ${total}`}
      back={index === 0 ? '/quiz' : `/quiz/${index}`}
      wide={question.kind === 'image'}
    >
      <section className="quiz-question" key={question.id}>
        <h1 className="quiz-title">{question.title}</h1>
        {question.subtitle && <p className="quiz-lead">{question.subtitle}</p>}

        {question.kind === 'image' ? (
          <div className="quiz-options quiz-options--image" role="radiogroup" aria-label={question.title}>
            {question.options.map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={selected === o.id}
                className="quiz-card"
                onClick={() => choose(o.id)}
              >
                <QuizImage name={o.image ?? 'estrelas'} className="quiz-card__img" />
                <span className="quiz-card__label">{o.label}</span>
                <span className="quiz-card__check" aria-hidden="true">
                  <Icon name="check" size={16} />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="quiz-options" role="radiogroup" aria-label={question.title}>
            {question.options.map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={selected === o.id}
                className="quiz-option"
                onClick={() => choose(o.id)}
              >
                <span className="quiz-option__radio" aria-hidden="true">
                  <Icon name="check" size={14} />
                </span>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </section>
    </QuizLayout>
  )
}
