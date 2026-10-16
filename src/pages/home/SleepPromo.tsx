import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'

/** Card "Modo hora de dormir" (mockup: fundo noturno, lua e botão amarelo). */
export function SleepPromo() {
  return (
    <section className="sleep-promo" aria-label="Modo hora de dormir">
      <span className="sleep-promo__sparkle sleep-promo__sparkle--1" aria-hidden="true" />
      <span className="sleep-promo__sparkle sleep-promo__sparkle--2" aria-hidden="true" />
      <span className="sleep-promo__cloud" aria-hidden="true" />
      <Icon name="moon" className="sleep-promo__moon" />
      <div className="sleep-promo__body">
        <h2 className="sleep-promo__title">Modo hora de dormir</h2>
        <p className="sleep-promo__text">Deixe o app no modo noturno e o sono vem mais rápido.</p>
        <Link to="/sono" className="btn btn--sun btn--sm sleep-promo__cta">
          Ativar agora
        </Link>
      </div>
    </section>
  )
}
