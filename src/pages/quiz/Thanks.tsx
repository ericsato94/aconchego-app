import { Link } from 'react-router-dom'
import lionSleeping from '../../assets/lion-sleeping.webp'
import { QuizLayout } from './QuizLayout'

/** Página para onde a plataforma de pagamento redireciona depois da compra. */
export default function Thanks() {
  return (
    <QuizLayout>
      <section className="quiz-loading">
        <div className="quiz-loading__art">
          <img src={lionSleeping} alt="" />
        </div>
        <h1 className="quiz-title">Bem-vindo(a) ao Aconchego!</h1>
        <p className="quiz-lead">
          Sua compra foi confirmada. Agora é só criar a sua conta com o mesmo e-mail e gravar a sua voz.
        </p>
        <Link to="/cadastro?origem=compra" className="btn btn--primary btn--block quiz-cta">
          Criar minha conta
        </Link>
      </section>
    </QuizLayout>
  )
}
