import { BackButton } from '../../components/BackButton'
import './info.css'

export default function Privacy() {
  return (
    <div className="container page">
      <header className="info-head">
        <BackButton fallback="/perfil" />
        <div>
          <h1 className="page-title">Política de privacidade</h1>
          <p className="page-subtitle">Em linguagem simples, sem letras miúdas.</p>
        </div>
      </header>
      <article className="card info-card prose">
        <h2>O que coletamos</h2>
        <ul>
          <li>Seu nome e e-mail, para criar a conta.</li>
          <li>A gravação da sua voz, para criar a narração das histórias.</li>
          <li>Nome e idade da criança (opcional), para sugerir histórias adequadas.</li>
          <li>Quais histórias foram ouvidas, para mostrar o progresso e retomar de onde parou.</li>
        </ul>
        <h2>Sua voz é um dado sensível</h2>
        <p>
          Pela LGPD, a voz é um dado biométrico. Por isso pedimos sua autorização explícita, guardamos a data do aceite e
          usamos a voz apenas para narrar histórias para a sua família. Nunca vendemos nem compartilhamos sua voz para
          outros fins.
        </p>
        <p>
          Para evitar que alguém clone a voz de outra pessoa, pedimos que você leia uma frase aleatória na hora da
          gravação.
        </p>
        <h2>Dados da criança</h2>
        <p>Coletamos o mínimo possível e só com a autorização do responsável legal.</p>
        <h2>Seus direitos</h2>
        <p>
          Você pode excluir sua voz e todas as gravações em um toque, no Perfil, em “Excluir minha voz”. Também pode editar
          seus dados ou sair da conta quando quiser.
        </p>
        <h2>Nesta versão</h2>
        <p>
          Esta é a versão local do Aconchego: todos os dados ficam guardados apenas neste aparelho (no navegador). Nada é
          enviado para servidores.
        </p>
      </article>
    </div>
  )
}
