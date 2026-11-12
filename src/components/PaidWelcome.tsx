import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import lionReading from '../assets/lion-reading.webp'
import { useApp } from '../store/appContext'
import { Icon, type IconName } from './Icon'
import { Modal } from './Modal'
import './PaidWelcome.css'

/** O que cada plano pago inclui (manter igual aos limites do servidor em api/_lib/storyLimits.ts). */
const BENEFITS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'mic', title: 'Histórias com a sua voz', text: 'Grave uma vez e 1 voz da família narra todas as histórias.' },
  { icon: 'sparkles', title: 'Até 6 histórias personalizadas por mês', text: 'Com o seu filho como personagem (até 2 por dia).' },
  { icon: 'books', title: 'Biblioteca completa', text: 'Todas as histórias do catálogo liberadas.' },
  { icon: 'moon', title: 'Modo hora de dormir', text: 'Tela escura, volume baixinho e timer para desligar sozinho.' },
]

const COLORS = ['#FFD54F', '#FF8A3D', '#FF5E92', '#8B5CF6', '#4FC3F7', '#66BB6A']

/** Peças do confete (sorteadas uma vez ao carregar o módulo). */
const PIECES = Array.from({ length: 70 }, (_, i) => ({
  left: Math.random() * 100,
  delay: Math.random() * 0.6,
  duration: 2.2 + Math.random() * 1.6,
  drift: (Math.random() - 0.5) * 160,
  spin: 360 + Math.random() * 720,
  color: COLORS[i % COLORS.length],
  round: i % 3 === 0,
}))

/** Confete em CSS (sem bibliotecas); some sozinho e respeita "reduzir movimento". */
function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {PIECES.map((p, i) => (
        <i
          key={i}
          className={p.round ? 'is-round' : undefined}
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

/**
 * Boas-vindas ao plano pago: aparece uma vez quando a conta é reconhecida como paga
 * (e de novo se mudar de plano). No primeiro acesso, espera o tour terminar.
 */
export function PaidWelcome() {
  const { data, actions } = useApp()
  const navigate = useNavigate()
  const paid = data.plan === 'monthly' || data.plan === 'annual'
  const open = paid && Boolean(data.settings.tourDoneAt) && data.settings.paidWelcomeFor !== data.plan
  if (!open) return null

  const close = () => actions.updateSettings({ paidWelcomeFor: data.plan })
  const needsVoice = data.voice.status === 'none'
  const go = () => {
    close()
    navigate(needsVoice ? '/gravar-voz' : '/historias')
  }

  return (
    <>
      <Confetti />
      <Modal
        open
        onClose={close}
        size="sm"
        title={`Parabéns! Você agora é assinante ${data.plan === 'annual' ? 'Anual' : 'Mensal'}`}
        footer={
          <>
            <button className="btn btn--primary btn--block" onClick={go} data-autofocus>
              <Icon name={needsVoice ? 'mic' : 'play'} size={20} />
              {needsVoice ? 'Gravar minha voz' : 'Começar a ouvir'}
            </button>
            <button className="btn btn--ghost btn--block" onClick={close}>
              Fechar
            </button>
          </>
        }
      >
        <div className="paid-welcome">
          <img src={lionReading} alt="" className="paid-welcome__art" />
          <p className="paid-welcome__lead">Obrigado por fazer parte do Aconchego! Veja tudo o que o seu plano inclui:</p>
          <ul className="paid-welcome__list" role="list">
            {BENEFITS.map((b) => (
              <li key={b.title}>
                <span className="paid-welcome__icon">
                  <Icon name={b.icon} size={20} />
                </span>
                <span>
                  <strong>{b.title}</strong>
                  <small>{b.text}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  )
}
