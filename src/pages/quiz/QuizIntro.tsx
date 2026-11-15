import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import lionReading from '../../assets/lion-reading.webp'
import { Icon } from '../../components/Icon'
import { QUIZ } from '../../quiz/config'
import { quizState } from '../../quiz/state'
import { captureSource, track } from '../../quiz/track'
import { QuizLayout } from './QuizLayout'
import { pixel } from '../../quiz/pixel'

export default function QuizIntro() {
  const navigate = useNavigate()
  // Abriu a página do quiz: conta uma vez por sessão (mostra quantos chegam e não começam).
  useEffect(() => {
    captureSource()
    const state = quizState.ensure()
    if (quizState.markSent('landing')) void track({ sessionId: state.sessionId, type: 'landing_viewed' })
  }, [])

  const start = () => {
    const state = quizState.ensure()
    // Recomeçar logo depois não conta a mesma pessoa duas vezes.
    if (quizState.markSent('started')) {
      void track({ sessionId: state.sessionId, type: 'quiz_started' })
      pixel.quizStart()
    }
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
          <ul className="quiz-intro__perks" role="list">
            <li>
              <Icon name="mic" size={16} /> Sua voz
            </li>
            <li>
              <Icon name="books" size={16} /> Histórias
            </li>
            <li>
              <Icon name="moon" size={16} /> Hora de dormir
            </li>
          </ul>
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
