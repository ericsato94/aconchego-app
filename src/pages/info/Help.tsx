import { BackButton } from '../../components/BackButton'
import { Icon } from '../../components/Icon'
import './info.css'

const FAQ = [
  {
    q: 'Quanto tempo leva para minha voz ficar pronta?',
    a: 'Depois da gravação (cerca de 5 minutos de fala), a voz fica pronta em até 10 minutos. Avisamos por notificação, e você pode explorar as histórias enquanto espera.',
  },
  {
    q: 'Por que preciso ler uma frase aleatória?',
    a: 'É a forma de confirmar que a voz gravada é sua. Assim ninguém consegue clonar a voz de outra pessoa sem permissão.',
  },
  {
    q: 'Minha gravação ficou ruim. Posso refazer?',
    a: 'Pode, quantas vezes quiser. Escolha um lugar silencioso, segure o celular a um palmo da boca e fale com calma.',
  },
  {
    q: 'Como funciona o modo hora de dormir?',
    a: 'Você escolhe a história e o timer. A tela fica escura, o volume baixo e a história termina sozinha com um fade-out suave.',
  },
  {
    q: 'Como apago a minha voz?',
    a: 'No Perfil, toque em “Excluir minha voz”. Apagamos a voz e todas as gravações. As histórias continuam com a narração padrão.',
  },
  {
    q: 'O que inclui o plano gratuito?',
    a: 'O clone da sua voz e 3 histórias completas. Os planos Mensal e Anual liberam a biblioteca inteira.',
  },
]

export default function Help() {
  return (
    <div className="container page">
      <header className="info-head">
        <BackButton fallback="/perfil" />
        <div>
          <h1 className="page-title">Ajuda e suporte</h1>
          <p className="page-subtitle">Respostas rápidas para as dúvidas mais comuns.</p>
        </div>
      </header>
      <div className="faq">
        {FAQ.map((item) => (
          <details key={item.q} className="faq__item card">
            <summary>
              {item.q}
              <Icon name="chevronDown" size={20} />
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
