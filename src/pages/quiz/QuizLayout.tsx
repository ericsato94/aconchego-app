import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.webp'
import { Icon } from '../../components/Icon'
import './quiz.css'

interface Props {
  children: ReactNode
  /** 0–100; omitido = sem barra. */
  progress?: number
  progressLabel?: string
  back?: string | false
  wide?: boolean
}

/** Moldura das telas do quiz e da página de vendas: fundo céu, logo e barra de progresso. */
export function QuizLayout({ children, progress, progressLabel, back, wide }: Props) {
  const navigate = useNavigate()
  return (
    <div className="quiz">
      <header className="quiz__top">
        <div className="quiz__bar">
          {back ? (
            <button className="icon-btn" onClick={() => navigate(back)} aria-label="Voltar">
              <Icon name="chevronLeft" size={26} />
            </button>
          ) : (
            <span className="quiz__spacer" />
          )}
          <Link to="/quiz" className="quiz__logo" aria-label="Aconchego">
            <img src={logo} alt="Aconchego" />
          </Link>
          <span className="quiz__spacer" />
        </div>
        {progress !== undefined && (
          <div className="quiz__progress">
            <div
              className="progress"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={progressLabel ?? 'Progresso do quiz'}
            >
              <div className="progress__bar" style={{ width: `${progress}%` }} />
            </div>
            {progressLabel && <span>{progressLabel}</span>}
          </div>
        )}
      </header>
      <main className={`quiz__main${wide ? ' quiz__main--wide' : ''}`}>{children}</main>
    </div>
  )
}
