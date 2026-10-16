/** Frases de verificação: uma é sorteada a cada gravação (prova de que a voz é de quem grava). */
export const VERIFICATION_PHRASES = [
  'Hoje é um ótimo dia para viver grandes aventuras.',
  'A lua acendeu o céu para contar uma história nova.',
  'Um leão gentil guardou um segredo dentro do livro azul.',
  'As estrelas piscam devagar quando chega a hora de sonhar.',
  'O vento trouxe um abraço quentinho lá do outro lado do mar.',
  'Cada noite tem uma história esperando por você.',
]

export const randomPhrase = (except?: string) => {
  const pool = VERIFICATION_PHRASES.filter((p) => p !== except)
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Roteiro de leitura (~2,5–3 min): passa por emoções e entonações diferentes
 * (calma, alegria, tristeza, surpresa, perguntas, sussurro). Quanto mais variada a
 * gravação, melhor a voz clonada reproduz a emoção nas histórias.
 */
export const READING_SCRIPT: Array<{ mood: string; text: string }> = [
  {
    mood: 'Calma, como no começo de uma história',
    text: 'Era uma vez uma menina chamada Clara, que morava numa casinha amarela, bem pertinho do rio. Da janela do quarto, ela via os barquinhos passando devagar e as garças pescando na beira da água.',
  },
  {
    mood: 'Alegre e animada',
    text: 'Toda manhã, ela abria a janela, respirava fundo e gritava: bom dia, sol! Bom dia, passarinhos! Hoje vai ser um dia incrível! E os passarinhos respondiam cantando, todos ao mesmo tempo.',
  },
  {
    mood: 'Curiosa, com perguntas',
    text: 'Um dia, ela ouviu um barulhinho diferente vindo do jardim. Quem está aí? perguntou, curiosa. Será um gato? Um sapo? Ou será um bicho que eu nunca vi?',
  },
  {
    mood: 'Surpresa',
    text: 'Clara afastou as folhas da roseira e levou um susto. Nossa! Era um filhote de tartaruga, pequenininho, do tamanho de uma moeda!',
  },
  {
    mood: 'Triste, com pena',
    text: 'A tartaruguinha estava sozinha e tremia de medo. Eu me perdi da minha mãe, disse ela, com a voz bem fraquinha. Clara sentiu o coração apertar.',
  },
  {
    mood: 'Carinhosa e acolhedora',
    text: 'Calma, calma. Não precisa ter medo, disse Clara, com muito carinho. Eu vou te ajudar a encontrar a sua família. Prometo.',
  },
  {
    mood: 'Aventura, com ritmo',
    text: 'Juntas, elas atravessaram o quintal, pularam as poças, passaram pela horta de alfaces, contornaram o galinheiro e desceram a trilha de pedrinhas até a beira do rio.',
  },
  {
    mood: 'Suspense, mais baixinho',
    text: 'De repente, as folhas do mato começaram a balançar. Tchic, tchic, tchic. Clara parou, segurou a respiração e ficou bem quietinha. O que será que estava escondido ali?',
  },
  {
    mood: 'Engraçada, com vozes diferentes',
    text: 'Era só um sapo gordo e sonolento! Ei, vocês acordaram o meu cochilo! reclamou ele, com uma voz grossa e engraçada. Desculpe, senhor sapo! respondeu Clara, segurando o riso.',
  },
  {
    mood: 'Feliz, emocionada',
    text: 'E lá estava a mamãe tartaruga, procurando por toda parte! Que alegria! A família estava reunida de novo. A mamãe agradeceu tanto, mas tanto, que Clara até ficou vermelha.',
  },
  {
    mood: 'Divertida',
    text: 'Na volta para casa, Clara foi pulando e cantando: tartaruga, tartaruguinha, nunca mais vai ficar sozinha! E o cachorro Pipoca corria atrás dela, latindo de alegria.',
  },
  {
    mood: 'Tranquila, mais lenta',
    text: 'Quando a noite chegou, o céu ficou cheio de estrelas. Clara vestiu o pijama, escovou os dentes e se deitou bem quentinha, debaixo do cobertor.',
  },
  {
    mood: 'Sussurrando, para dormir',
    text: 'Antes de fechar os olhos, ela pensou: ajudar alguém deixa o coração quentinho. Boa noite, Clara. Boa noite, tartaruguinha. Agora é hora de sonhar.',
  },
]
