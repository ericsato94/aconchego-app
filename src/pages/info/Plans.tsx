import { useState } from 'react'
import { BackButton } from '../../components/BackButton'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { useApp } from '../../store/appContext'
import { useToast } from '../../store/toastContext'
import type { PlanId } from '../../types'
import './info.css'

const PLANS: Array<{ id: PlanId; name: string; price: string; note: string; features: string[]; highlight?: boolean }> = [
  { id: 'free', name: 'Grátis', price: 'R$ 0', note: 'para sempre', features: ['Clone da sua voz', '3 histórias narradas', 'Modo hora de dormir'] },
  {
    id: 'monthly',
    name: 'Mensal',
    price: 'R$ 19,90',
    note: 'por mês',
    features: ['Biblioteca completa', '1 voz da família', 'Histórias novas toda semana', 'Modo hora de dormir'],
  },
  {
    id: 'annual',
    name: 'Anual',
    price: 'R$ 147,00',
    note: 'por ano · ≈ R$ 12,25/mês',
    features: ['Biblioteca completa', 'Até 3 vozes (mãe, pai, avó)', 'Histórias novas toda semana', 'Modo hora de dormir'],
    highlight: true,
  },
]

export default function Plans() {
  const { data, actions } = useApp()
  const toast = useToast()
  const [pending, setPending] = useState<PlanId | null>(null)
  const chosen = PLANS.find((p) => p.id === pending)

  const confirm = () => {
    if (!pending) return
    actions.setPlan(pending)
    toast(pending === 'free' ? 'Você voltou ao plano gratuito' : 'Plano ativado! Biblioteca liberada.', 'success')
    setPending(null)
  }

  return (
    <div className="container page">
      <header className="info-head">
        <BackButton fallback="/perfil" />
        <div>
          <h1 className="page-title">Planos</h1>
          <p className="page-subtitle">Mais histórias com a sua voz, todas as noites.</p>
        </div>
      </header>

      <div className="plans">
        {PLANS.map((plan) => {
          const current = data.plan === plan.id
          return (
            <section key={plan.id} className={`plan${plan.highlight ? ' plan--highlight' : ''}${current ? ' is-current' : ''}`}>
              {plan.highlight && <span className="plan__ribbon">Melhor custo</span>}
              <h2 className="plan__name">{plan.name}</h2>
              <p className="plan__price">
                <strong>{plan.price}</strong>
                <span>{plan.note}</span>
              </p>
              <ul className="plan__features" role="list">
                {plan.features.map((f) => (
                  <li key={f}>
                    <Icon name="check" size={18} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`btn btn--block ${current ? 'btn--secondary' : plan.highlight ? 'btn--plan' : 'btn--primary'}`}
                disabled={current}
                onClick={() => setPending(plan.id)}
              >
                {current ? 'Plano atual' : plan.id === 'free' ? 'Voltar ao gratuito' : `Assinar ${plan.name.toLowerCase()}`}
              </button>
            </section>
          )
        })}
      </div>

      <p className="plans__note muted">
        Versão local: a assinatura é simulada e nenhum valor é cobrado. Na versão das lojas, o pagamento será feito pela Apple ou Google.
      </p>

      <Modal
        open={Boolean(chosen)}
        onClose={() => setPending(null)}
        title={chosen?.id === 'free' ? 'Voltar ao plano gratuito?' : `Assinar plano ${chosen?.name}?`}
        size="sm"
        footer={
          <>
            <button className="btn btn--secondary btn--sm" onClick={() => setPending(null)}>
              Cancelar
            </button>
            <button className="btn btn--primary btn--sm" onClick={confirm}>
              Confirmar
            </button>
          </>
        }
      >
        <p className="muted">
          {chosen?.id === 'free'
            ? 'Você continuará com acesso às 3 histórias gratuitas.'
            : `${chosen?.price} ${chosen?.note}. Simulação: nenhuma cobrança será feita.`}
        </p>
      </Modal>
    </div>
  )
}
