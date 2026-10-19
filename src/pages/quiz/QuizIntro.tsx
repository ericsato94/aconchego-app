import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import lionReading from '../../assets/lion-reading.webp'
import { Icon } from '../../components/Icon'
import { QUIZ } from '../../quiz/config'
import { quizState } from '../../quiz/state'
import { captureSource, track } from '../../quiz/track'
import { QuizLayout } from './QuizLayout'

export default function QuizIntro() {
  const navigate = useNavigate()
  useEffect(captureSource, [])

  const start = () => {
    const state = quizState.start()
    void track({ sessionId: state.sessionId, type: 'quiz_started' })
    navigate('/quiz/1')
  }

  return (
    <QuizLayout wide>
      <section className="quiz-intro">
        <div className="quiz-intro__art">
          <img src={lionReading} alt="" />
        </div>
        <div className="quiz-intro__body">
          <span className="quiz-eyebrow">{QUIZ.intro.eyebrow}</span>
          <h1 className="quiz-title quiz-title--hero">{QUIZ.intro.title}</h1>
          <p className="quiz-lead">{QUIZ.intro.subtitle}</p>
          <button className="btn btn--primary btn--block quiz-cta" onClick={start}>
            {QUIZ.intro.button}
            <Icon name="chevronRight" size={20} />
          </button>
          <p className="quiz-note">
            <Icon name="shield" size={16} /> {QUIZ.intro.note}
          </p>
        </div>
      </section>
    </QuizLayout>
  )
}
