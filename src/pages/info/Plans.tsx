import { useState } from 'react'
import { BackButton } from '../../components/BackButton'
import { Icon } from '../../components/Icon'
import { QUIZ } from '../../quiz/config'
import { useApp } from '../../store/appContext'
import { useToast } from '../../store/toastContext'
import './info.css'

/** Planos pagos vêm da mesma configuração da oferta do quiz (preço e link de checkout da Cakto). */
const PAID = QUIZ.offer.plans
const APP_PLAN: Record<string, 'monthly' | 'annual'> = { mensal: 'monthly', anual: 'annual' }

export default function Plans() {
  const { user, data, actions } = useApp()
  const toast = useToast()
  const [checking, setChecking] = useState(false)
  const isPaid = data.plan !== 'free'

  const refresh = async () => {
    setChecking(true)
    try {
      const allowed = await actions.refreshAccess()
      toast(
        allowed ? 'Plano ativo! A voz clonada e todas as histórias estão liberadas.' : 'Ainda não encontramos um pagamento com o seu e-mail.',
        allowed ? 'success' : 'info',
      )
    } catch {
      toast('Não foi possível verificar agora. Tente de novo em instantes.', 'error')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="container page">
      <header className="info-head">
        <BackButton fallback="/perfil" />
        <div>
          <h1 className="page-title">Planos</h1>
          <p className="page-subtitle">Grave sua voz e libere todas as histórias para a hora de dormir.</p>
        </div>
      </header>

      <div className="plans">
        <section className={`plan${!isPaid ? ' is-current' : ''}`}>
          <h2 className="plan__name">Grátis</h2>
          <p className="plan__price">
            <strong>R$ 0</strong>
            <span>para sempre</span>
          </p>
          <ul className="plan__features" role="list">
            <li>
              <Icon name="check" size={18} /> 3 histórias com a narração padrão
            </li>
            <li>
              <Icon name="check" size={18} /> Modo hora de dormir
            </li>
          </ul>
          <button className="btn btn--block btn--secondary" disabled>
            {isPaid ? 'Incluído' : 'Plano atual'}
          </button>
        </section>

        {PAID.map((plan) => {
          const current = data.plan === APP_PLAN[plan.id]
          const highlight = plan.id === 'anual'
          return (
            <section key={plan.id} className={`plan${highlight ? ' plan--highlight' : ''}${current ? ' is-current' : ''}`}>
              {highlight && <span className="plan__ribbon">Melhor custo</span>}
              <h2 className="plan__name">{plan.name}</h2>
              <p className="plan__price">
                <strong>{plan.price}</strong>
                <span>
                  {plan.period}
                  {plan.note ? ` · ${plan.note}` : ''}
                </span>
              </p>
              <ul className="plan__features" role="list">
                <li>
                  <Icon name="check" size={18} /> Voz clonada: as histórias com a sua voz
                </li>
                {plan.features.map((f) => (
                  <li key={f}>
                    <Icon name="check" size={18} /> {f}
                  </li>
                ))}
              </ul>
              {current ? (
                <button className="btn btn--block btn--secondary" disabled>
                  Plano atual
                </button>
              ) : (
                <a
                  className={`btn btn--block ${highlight ? 'btn--plan' : 'btn--primary'}`}
                  href={plan.checkoutUrl || undefined}
                  aria-disabled={!plan.checkoutUrl}
                >
                  Assinar {plan.name.toLowerCase()}
                </a>
              )}
            </section>
          )
        })}
      </div>

      <section className="card info-card plans__how">
        <h2 className="section-title">Como liberar depois de pagar</h2>
        <p>
          No pagamento, use o mesmo e-mail da sua conta: <strong>{user?.email}</strong>. A liberação é automática,
          assim que o pagamento for aprovado.
        </p>
        <button className="btn btn--secondary btn--sm" onClick={refresh} disabled={checking}>
          <Icon name="refresh" size={18} />
          {checking ? 'Verificando…' : 'Já paguei — verificar meu plano'}
        </button>
        <p className="muted plans__note">
          A assinatura é processada pela Cakto. Para cancelar ou trocar de plano, use o e-mail de confirmação da compra.
        </p>
      </section>
    </div>
  )
}
