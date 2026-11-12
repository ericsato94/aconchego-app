import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import lionSleeping from '../../assets/lion-sleeping.webp'
import { InstallGuide } from '../../components/InstallGuide'
import { externalBrowserUrl, inAppBrowser } from '../../lib/platform'
import { pixel } from '../../quiz/pixel'
import { QuizLayout } from './QuizLayout'

/** Página para onde a plataforma de pagamento redireciona depois da compra. */
export default function Thanks() {
  const inApp = Boolean(inAppBrowser())
  useEffect(() => {
    pixel.purchase()
  }, [])
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
        {inApp ? (
          // Veio pelo anúncio (navegador do Instagram/Facebook): leva para o navegador do celular
          // antes do cadastro, para a pessoa conseguir instalar o app e não perdê-lo ao fechar o Instagram.
          <div className="thanks-inapp card">
            <h2 className="thanks-inapp__title">Antes de criar a conta, abra no navegador</h2>
            <p className="thanks-inapp__text">Assim você instala o Aconchego no celular e encontra o app sempre que precisar.</p>
            <a href={externalBrowserUrl('/cadastro?origem=compra')} className="btn btn--primary btn--block quiz-cta">
              Abrir no navegador
            </a>
            <InstallGuide variant="inapp" />
            <Link to="/cadastro?origem=compra" className="thanks-inapp__skip">
              Continuar por aqui mesmo
            </Link>
          </div>
        ) : (
          <Link to="/cadastro?origem=compra" className="btn btn--primary btn--block quiz-cta">
            Criar minha conta
          </Link>
        )}
      </section>
    </QuizLayout>
  )
}
