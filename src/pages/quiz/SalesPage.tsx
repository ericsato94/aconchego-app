import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import lionReading from '../../assets/lion-reading.webp'
import { Icon } from '../../components/Icon'
import { StoryCover } from '../../components/StoryCover'
import { firstName } from '../../lib/format'
import { QUIZ, fill } from '../../quiz/config'
import { buildResult } from '../../quiz/result'
import { quizState } from '../../quiz/state'
import { track, trafficSource } from '../../quiz/track'
import { QuizLayout } from './QuizLayout'

/** Página de vendas, personalizada pelas respostas do quiz. */
export default function SalesPage() {
  const navigate = useNavigate()
  const state = quizState.get()
  const result = state ? buildResult(state.answers) : null
  const O = QUIZ.offer
  const [planId, setPlanId] = useState(result?.recommendedPlan ?? O.plans[0].id)

  useEffect(() => {
    if (!state?.leadSaved || state.viewed?.sales) return
    void track({ sessionId: state.sessionId, type: 'sales_viewed' })
    quizState.update({ viewed: { ...state.viewed, sales: true } })
  }, [state])

  if (!state || !result) return <Navigate to="/quiz" replace />
  if (!state.leadSaved) return <Navigate to="/quiz/resultado" replace />

  const name = firstName(state.name ?? '')
  const plan = O.plans.find((p) => p.id === planId) ?? O.plans[0]

  const checkout = () => {
    void track({ sessionId: state.sessionId, type: 'checkout_started', plan: plan.id })
    if (plan.checkoutUrl) {
      // A sessão do quiz vai em "sck" (a Cakto devolve no aviso de compra) e a origem do anúncio
      // segue junto nos parâmetros UTM, para aparecer também nos relatórios da plataforma.
      const url = new URL(plan.checkoutUrl)
      url.searchParams.set('sck', state.sessionId)
      for (const [key, value] of Object.entries(trafficSource())) {
        if (value && key.startsWith('utm_')) url.searchParams.set(key, value)
      }
      window.location.href = url.toString()
    } else {
      navigate(`/cadastro?origem=quiz&plano=${plan.id}`)
    }
  }

  return (
    <QuizLayout wide back="/quiz/resultado">
      <article className="sales">
        <section className="sales__hero">
          <div className="sales__hero-text">
            <span className="quiz-eyebrow">{result.identity.name}</span>
            <h1 className="quiz-title quiz-title--hero">{fill(O.headline, { name })}</h1>
            <p className="quiz-lead">{O.subheadline}</p>
            <a href="#oferta" className="btn btn--primary quiz-cta">
              Ver a oferta <Icon name="chevronDown" size={20} />
            </a>
          </div>
          <img className="sales__hero-art" src={lionReading} alt="" />
        </section>

        {result.painText && (
          <section className="quiz-panel quiz-panel--pain sales__pain">
            <Icon name="heart" size={26} />
            <p>{result.painText}</p>
          </section>
        )}

        <section className="sales__section">
          <h2 className="sales__h2">Como funciona</h2>
          <ol className="sales__steps">
            {O.howItWorks.map((s, i) => (
              <li key={s.title}>
                <span className="sales__step-n">{i + 1}</span>
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="sales__section">
          <h2 className="sales__h2">
            Histórias escolhidas para {result.age ? `uma criança de ${result.age.toLowerCase()}` : 'o seu filho'}
          </h2>
          <div className="sales__stories">
            {result.stories.map((s) => (
              <div key={s.id} className="sales__story">
                <StoryCover story={s} />
                <strong>{s.title}</strong>
                <span>{s.summary}</span>
              </div>
            ))}
          </div>
        </section>

        {result.objection && (
          <section className="quiz-panel sales__objection">
            <h2 className="quiz-panel__title">
              <Icon name="check" size={20} /> {result.objection.title}
            </h2>
            <p>{result.objection.text}</p>
          </section>
        )}

        <section className="sales__offer" id="oferta">
          <div className="sales__benefits">
            <h2 className="sales__h2">O que você recebe</h2>
            <ul role="list">
              {O.benefits.map((b) => (
                <li key={b}>
                  <Icon name="check" size={18} /> {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="sales__plans" role="radiogroup" aria-label="Escolha o plano">
            {O.plans.map((p) => (
              <button
                key={p.id}
                role="radio"
                aria-checked={planId === p.id}
                className="sales__plan"
                onClick={() => setPlanId(p.id)}
              >
                {p.id === result.recommendedPlan && <span className="sales__ribbon">{O.recommendedLabel}</span>}
                <span className="sales__plan-name">{p.name}</span>
                <span className="sales__price">
                  <strong>{p.price}</strong> {p.period}
                </span>
                {p.note && <span className="sales__note">{p.note}</span>}
                <ul role="list">
                  {p.features.map((f) => (
                    <li key={f}>
                      <Icon name="check" size={16} /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
            <button className="btn btn--sun btn--block sales__checkout" onClick={checkout}>
              {O.checkoutButton} · {plan.price}
            </button>
            {O.guarantee && (
              <p className="sales__guarantee">
                <Icon name="shield" size={18} /> {O.guarantee}
              </p>
            )}
            <Link to="/cadastro?origem=quiz" className="btn btn--ghost btn--block btn--sm">
              {O.freeAlternative}
            </Link>
          </div>
        </section>

        <section className="sales__section">
          <h2 className="sales__h2">Perguntas frequentes</h2>
          <div className="faq">
            {O.faq.map((item) => (
              <details key={item.q} className="faq__item card">
                <summary>
                  {item.q}
                  <Icon name="chevronDown" size={20} />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </article>
    </QuizLayout>
  )
}
