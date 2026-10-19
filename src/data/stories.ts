import type { Story } from '../types'
import castle from '../assets/covers/castle.webp'
import lion from '../assets/covers/lion.webp'
import whale from '../assets/covers/whale.webp'
import fox from '../assets/covers/fox.webp'
import star from '../assets/covers/star.webp'
import panda from '../assets/covers/panda.webp'
import braveLion from '../assets/covers/brave-lion.webp'
import river from '../assets/covers/river.webp'

/**
 * Catálogo local (V1). Em produção virá da API/banco — ver src/services/catalog.ts.
 * Textos originais, adaptados de fábulas de domínio público.
 *
 * Marcações entre colchetes ([happy], [sad], [whispers]…) orientam a emoção da narração
 * apenas no modelo eleven_v3. Não aparecem na tela e são removidas para os outros modelos
 * (inclusive o eleven_v4, em uso), que tiram a emoção do próprio texto.
 */
export const STORIES: Story[] = [
  {
    id: 'o-leao-e-o-ratinho',
    title: 'O Leão e o Ratinho',
    summary: 'Um leão poderoso descobre que até o menor dos amigos pode ajudar muito.',
    ageRange: [2, 8],
    tags: ['amizade', 'aventura'],
    free: true,
    cover: { kind: 'image', src: lion, bg: '#bfe3f7' },
    paragraphs: [
      '[softly] Era uma vez, numa floresta cheia de árvores altas, um leão enorme que adorava tirar sonecas à sombra.',
      'Certa tarde, um ratinho distraído passou correndo bem por cima do nariz do leão! [surprised] O leão acordou num susto e, com uma patada, prendeu o ratinho.',
      '[scared] — Por favor, senhor leão, me solte! — pediu o ratinho, tremendo. — Um dia, eu posso ajudar você.',
      '[laughs] O leão deu uma gargalhada tão alta que as folhas balançaram.\n— Um bichinho tão pequeno, me ajudar? — disse ele, rindo. Mas achou o ratinho tão corajoso que resolveu soltá-lo.',
      'Alguns dias depois, o leão caiu numa rede de cordas grossas. [worried] Quanto mais ele puxava, mais preso ficava. Então, rugiu bem alto, pedindo ajuda.',
      '[excited] Lá longe, o ratinho ouviu o rugido e veio correndo! Com seus dentinhos afiados, roeu corda por corda, com muita paciência, até a rede se abrir.',
      '[happy] O leão saiu livre e olhou para o amigo com carinho.\n— Você tinha razão, ratinho. Não importa o tamanho. Importa o coração.',
      '[warmly] Desde aquele dia, o leão e o ratinho viraram melhores amigos. E todas as tardes, tiravam a soneca juntos, debaixo da mesma árvore.',
      '[softly] Fim. Boa noite, meu amor.',
    ],
  },
  {
    id: 'a-baleia-e-o-mar',
    title: 'A Baleia e o Mar',
    summary: 'Uma baleia azul canta para o oceano e descobre que nunca está sozinha.',
    ageRange: [2, 7],
    tags: ['sono', 'natureza'],
    free: true,
    cover: { kind: 'image', src: whale, bg: '#9fd5f6' },
    paragraphs: [
      '[softly] Bem longe, onde o mar é muito, muito azul, morava uma baleia chamada Lua. Ela era grande como um barco e gentil como uma brisa.',
      'Todas as noites, Lua subia até a superfície para olhar as estrelas. [sad] Mas, às vezes, se sentia sozinha naquele mar tão grande.',
      'Um dia, ela resolveu cantar. [warmly] Sua canção era longa e macia, e viajou pela água como uma onda de carinho.',
      'Logo, um cardume de peixinhos prateados apareceu, dançando em volta dela.\n[excited] — Que música bonita! — disseram eles.',
      'Depois chegou uma tartaruga bem velhinha, devagar, devagarinho.\n[warmly] — Eu ouvi a sua canção lá do fundo do mar — contou ela, sorrindo.',
      '[surprised] E, de muito longe, outra baleia respondeu com a sua própria canção! [happy] Lua sorriu: o mar inteiro estava ouvindo.',
      '[softly] Naquela noite, Lua boiou bem quietinha, embalada pelas ondas, enquanto as estrelas piscavam lá no céu.',
      '[whispers] Quando a gente compartilha o que tem de bonito, nunca está sozinho. Agora, feche os olhinhos e escute o mar. Boa noite.',
    ],
  },
  {
    id: 'o-raposo-e-a-cegonha',
    title: 'O Raposo e a Cegonha',
    summary: 'Um raposo espertinho aprende, num jantar diferente, a pensar no outro.',
    ageRange: [3, 8],
    tags: ['amizade'],
    free: true,
    cover: { kind: 'image', src: fox, bg: '#d9e9b7' },
    paragraphs: [
      'Numa clareira da floresta, morava um raposo muito espertinho, que adorava pregar peças nos vizinhos.',
      '[mischievously] Um dia, ele convidou a cegonha para jantar. Preparou uma sopa cheirosa e serviu num prato bem rasinho.',
      'O raposo lambeu a sopa num instante. [sad] Mas a cegonha, com seu bico comprido e fino, não conseguiu tomar quase nada.',
      'Mesmo assim, agradeceu com educação.\n[warmly] — Amanhã, venha jantar na minha casa — convidou ela.',
      'No dia seguinte, a cegonha serviu uma comida deliciosa, dentro de um jarro alto e estreito. E comeu tranquila, com o seu bico comprido.',
      '[sighs] Já o raposo só conseguia cheirar. Ficou com a barriga roncando e entendeu como a amiga tinha se sentido.',
      '[sad] — Desculpe, cegonha. Eu não pensei em você — disse ele, envergonhado.\n[happy] A cegonha sorriu e trouxe dois pratos: um rasinho e um jarro alto.',
      '[laughs] E os dois jantaram juntos, rindo muito. [warmly] Porque ser amigo é pensar no jeitinho do outro. Fim.',
    ],
  },
  {
    id: 'o-pequeno-principe',
    title: 'O Pequeno Príncipe',
    summary: 'Um príncipe pequenino deixa o castelo para descobrir o que torna um reino feliz.',
    ageRange: [4, 8],
    tags: ['aventura'],
    free: false,
    cover: { kind: 'image', src: castle, bg: '#2d3f8a' },
    paragraphs: [
      '[softly] No alto de uma colina, num castelo de torres cor-de-rosa, vivia um príncipe tão pequenino que cabia dentro de uma bota!',
      'Todos no castelo diziam que, um dia, ele seria rei. Mas o príncipe tinha uma pergunta:\n[curious] — O que deixa um reino feliz?',
      '[excited] Numa manhã, ele colocou a coroinha no bolso e desceu a colina para descobrir.',
      'Na padaria, viu o padeiro dividindo pão quentinho com quem não tinha. Na praça, viu crianças ensinando um jogo novo para uma menina tímida.',
      'Perto do rio, encontrou um velhinho plantando árvores que só dariam sombra muitos anos depois.\n[curious] — Para quem são essas árvores? — perguntou o príncipe.\n[warmly] — Para quem vier depois de mim — respondeu o velhinho.',
      '[softly] Quando as estrelas apareceram, o príncipe voltou para o castelo com o coração cheinho.',
      '[excited] — Já sei! — disse ele à rainha. — Um reino é feliz quando as pessoas cuidam umas das outras.',
      '[warmly] A rainha sorriu e lhe deu um beijo na testa. [softly] E o pequeno príncipe dormiu sonhando com árvores, pão quentinho e amigos novos. Boa noite.',
    ],
  },
  {
    id: 'a-estrelinha-perdida',
    title: 'A Estrelinha Perdida',
    summary: 'Uma estrelinha cai do céu e conta com a ajuda de uma criança para voltar para casa.',
    ageRange: [2, 6],
    tags: ['sono', 'aventura'],
    free: false,
    cover: { kind: 'image', src: star, bg: '#24387e', focus: 'center top' },
    paragraphs: [
      '[softly] Numa noite bem clarinha, uma estrelinha brincava de pega-pega com as outras estrelas. [surprised] E, de repente, escorregou do céu!',
      'Plim! Ela caiu bem devagar no jardim de uma casa, em cima de uma folha de alface.',
      '[curious] Uma menina, que olhava pela janela, viu a luzinha piscando. Calçou os chinelos e foi ver de perto.',
      '[sad] — Estou perdida — disse a estrelinha, com a luz fraquinha de tristeza. — Quero voltar para o céu.',
      'A menina pensou, pensou, [excited] e teve uma ideia! Subiu no balanço e começou a balançar, cada vez mais alto, com a estrelinha nas mãos.',
      '[happy] No balanço mais alto de todos, ela abriu as mãos. E a estrelinha deu um pulo e voou de volta para o céu, brilhando forte!',
      '[warmly] Lá de cima, a estrelinha piscou duas vezes para a menina. Era o seu jeito de dizer: obrigada.',
      '[whispers] Desde então, toda noite, a estrela mais brilhante do céu fica de olho na janela da menina, cuidando do seu sono. Boa noite.',
    ],
  },
  {
    id: 'o-panda-e-o-sonho',
    title: 'O Panda e o Sonho',
    summary: 'Um pandinha que não conseguia dormir descobre o caminho para o país dos sonhos.',
    ageRange: [2, 6],
    tags: ['sono'],
    free: false,
    cover: { kind: 'image', src: panda, bg: '#2d4a9a', focus: 'center top' },
    paragraphs: [
      'No meio de uma floresta de bambus, morava um pandinha chamado Bambu, que nunca, nunca queria dormir.',
      '[mischievously] — Eu não estou com sono! — dizia ele, rolando de um lado para o outro. [softly] Mas seus olhinhos já estavam pesados.',
      'Sua mãe se deitou ao lado dele e disse, baixinho:\n[whispers] — Vamos fazer uma viagem até o país dos sonhos?',
      '[softly] — Primeiro, respire bem fundo, como se cheirasse uma flor. Agora, solte o ar devagar, como se soprasse uma nuvem.',
      '[softly] Bambu respirou fundo e imaginou uma nuvem macia, bem fofinha, que o levava para cima, para cima.',
      '[warmly] Na nuvem, ele viu um rio de leite morno, árvores de algodão e estrelas que cantavam bem baixinho.',
      '[softly] Cada vez que respirava, a nuvem ficava mais quentinha. E os pensamentos de Bambu ficavam leves, bem leves.',
      '[whispers] Quando a mãe olhou de novo, Bambu já estava dormindo, com um sorriso no rosto. Agora é a sua vez. Respire fundo. Boa noite.',
    ],
  },
  {
    id: 'o-leao-corajoso',
    title: 'O Leão Corajoso',
    summary: 'O rei da floresta revela que ser corajoso também é admitir que sentimos medo.',
    ageRange: [3, 8],
    tags: ['aventura', 'amizade'],
    free: false,
    cover: { kind: 'image', src: braveLion, bg: '#bfe3f7', focus: 'center top' },
    paragraphs: [
      '[excited] Todo mundo na floresta achava que o leão Juba não tinha medo de nada. Afinal, ele era o rei!',
      '[whispers] Mas Juba tinha um segredo: ele morria de medo do escuro.',
      '[worried] Uma noite, a lua se escondeu atrás das nuvens e a floresta ficou bem escura. Os filhotes ficaram assustados.',
      'Juba sentiu o coração bater forte. Pensou em fingir que estava tudo bem, mas resolveu contar a verdade.',
      '[softly] — Eu também tenho medo do escuro — disse ele.\n[surprised] Os filhotes arregalaram os olhos.\n— O rei também tem medo?',
      '[warmly] — Tenho, sim. E sabe o que eu faço? Chamo os amigos para ficarem pertinho. Juntos, o escuro fica menor.',
      '[happy] Os vaga-lumes ouviram e vieram acender suas luzinhas. E os filhotes se aconchegaram na juba do leão.',
      '[warmly] Naquela noite, todos aprenderam que ser corajoso não é não ter medo. É ter medo e, mesmo assim, encontrar um jeito, com quem a gente ama. [softly] Boa noite.',
    ],
  },
  {
    id: 'a-cancao-do-rio',
    title: 'A Canção do Rio',
    summary: 'Um rio pequenino atravessa campos e cidades cantando até chegar ao mar.',
    ageRange: [2, 7],
    tags: ['sono', 'natureza'],
    free: false,
    cover: { kind: 'image', src: river, bg: '#9fd5f6', focus: 'center top' },
    paragraphs: [
      '[softly] Lá no alto da montanha, entre pedras cobertas de musgo, nasceu um riozinho fininho como um fio de prata.',
      '[happy] Ele descia cantando: plic, ploc, plic, ploc! E a sua música acordava as flores do caminho.',
      'Passou por um campo de girassóis, que viraram a cabeça para ouvir. Passou por uma fazenda, onde os patinhos nadaram junto.',
      '[excited] Foi crescendo, crescendo, porque outros riozinhos vinham se juntar à cantoria.',
      'Quando chegou à cidade, as crianças se debruçaram na ponte para ouvir.\n[laughs] — Plic, ploc! — cantavam elas também.',
      '[whispers] À noite, o rio ficava mais calmo, e a canção virava um sussurro: shhh, shhh, dizia ele para a lua.',
      '[warmly] E, depois de muito caminhar, o rio chegou ao mar, que o abraçou com uma onda bem grande.',
      '[whispers] Escute: plic, ploc, shhh. É o rio cantando para você dormir. Boa noite.',
    ],
  },
]
