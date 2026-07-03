import type { HanziData } from '../types'

export type MasterAction =
  | 'standing'
  | 'bow'
  | 'point-self'
  | 'gesture-come'
  | 'shake-head'
  | 'nod'
  | 'sweep-arm'
  | 'meditate'
  | 'clap'
  | 'point-up'

export interface DecompositionPart {
  char: string
  meaning: string
  note?: string
}

export interface Lesson {
  id: string
  act: number
  storyContext: string
  masterAction: MasterAction
  hanzi: HanziData
  challengePrompt: string
  options: string[]
  correctIndex: number
  decomposition: DecompositionPart[]
  masterInsight: string
}

export const CURRICULUM: Lesson[] = [
  {
    id: 'ni',
    act: 1,
    storyContext:
      'A mestre Chin se vira para você. Seus olhos calmos encontram os seus. Ela coloca a mão no peito e pronuncia lentamente:',
    masterAction: 'point-self',
    hanzi: {
      hanzi: '你',
      pinyin: 'nǐ',
      pinyin_base: 'ni',
      tone: 3,
      meaning_pt: 'você',
      etymology:
        '人 (pessoa) + 尔 (arcaico: você). Uma pessoa que se dirige a outra.',
      hsk_level: 1,
      stroke_count: 7,
    },
    challengePrompt:
      'Ela aponta para VOCÊ. O que esta palavra significa?',
    options: ['eu', 'você', 'ele', 'nós'],
    correctIndex: 1,
    decomposition: [
      { char: '人', meaning: 'pessoa', note: 'radical da humanidade' },
      { char: '尔', meaning: 'você (arcaico)', note: 'componente fonético' },
    ],
    masterInsight:
      'Em mandarim, 你 (nǐ) é o "você" cotidiano. Para revelar profundo respeito — a um mestre, a um ancião — usa-se 您 (nín). O mesmo caractere, mas com o coração 心 abaixo.',
  },
  {
    id: 'hao',
    act: 1,
    storyContext:
      'A mestre Chin sorri levemente. Com as mãos juntas, ela inclina a cabeça e diz uma única sílaba. Você sente que é uma saudação, uma bênção — algo bom.',
    masterAction: 'bow',
    hanzi: {
      hanzi: '好',
      pinyin: 'hǎo',
      pinyin_base: 'hao',
      tone: 3,
      meaning_pt: 'bom / bem',
      etymology:
        '女 (mulher) + 子 (filho). Os antigos acreditavam: onde há mãe e filho, há bondade.',
      hsk_level: 1,
      stroke_count: 6,
    },
    challengePrompt:
      'Ela inclina a cabeça com calma e pronuncia 好. O que este gesto-palavra transmite?',
    options: ['perigo', 'bom / bem', 'triste', 'rápido'],
    correctIndex: 1,
    decomposition: [
      { char: '女', meaning: 'mulher / mãe', note: 'radical feminino' },
      { char: '子', meaning: 'filho / criança', note: 'radical infantil' },
    ],
    masterInsight:
      '好 pode ser intensificado: 很好 (hěn hǎo) = muito bom; 最好 (zuì hǎo) = o melhor. Juntos com 你, você já sabe dizer 你好 — olá!',
  },
  {
    id: 'wo',
    act: 1,
    storyContext:
      'A mestre Chin aponta para si mesma com um único dedo. Ela repete o gesto três vezes, sempre apontando para o próprio peito, antes de falar.',
    masterAction: 'point-self',
    hanzi: {
      hanzi: '我',
      pinyin: 'wǒ',
      pinyin_base: 'wo',
      tone: 3,
      meaning_pt: 'eu / mim',
      etymology:
        'Uma mão segurando uma alabarda — o guerreiro que defende a si mesmo. Eu.',
      hsk_level: 1,
      stroke_count: 7,
    },
    challengePrompt:
      'Ela aponta repetidamente para SI MESMA. Qual é o significado?',
    options: ['você', 'ele', 'eu / mim', 'nós'],
    correctIndex: 2,
    decomposition: [
      { char: '手', meaning: 'mão', note: 'componente esquerdo' },
      { char: '戈', meaning: 'alabarda (arma)', note: 'componente direito' },
    ],
    masterInsight:
      '我 é o "eu" universal do mandarim. Sozinho significa "eu"; com 们 (men) vira 我们 (wǒmen) — "nós". O sufixo 们 transforma qualquer pronome no plural.',
  },
  {
    id: 'shi',
    act: 2,
    storyContext:
      'Chin aponta para um jovem aprendiz treinando no pátio e diz uma frase curta. Depois aponta para você e repete. Parece ser uma declaração — uma confirmação de identidade.',
    masterAction: 'sweep-arm',
    hanzi: {
      hanzi: '是',
      pinyin: 'shì',
      pinyin_base: 'shi',
      tone: 4,
      meaning_pt: 'ser / é / sim',
      etymology:
        'Sol (日) + correto (正). O que é iluminado pelo sol é verdadeiro. É.',
      hsk_level: 1,
      stroke_count: 9,
    },
    challengePrompt:
      'Ela confirma a identidade de cada pessoa no pátio. O que este caractere faz na frase?',
    options: ['perguntar', 'negar', 'ser / é', 'querer'],
    correctIndex: 2,
    decomposition: [
      { char: '日', meaning: 'sol', note: 'parte superior' },
      { char: '正', meaning: 'correto / reto', note: 'parte inferior' },
    ],
    masterInsight:
      '是 é o verbo "ser" em mandarim — mas nunca se conjuga. 我是学生 (wǒ shì xuésheng) = "eu sou estudante". A negação usa 不是 (bú shì). Simples assim.',
  },
  {
    id: 'bu',
    act: 2,
    storyContext:
      'O aprendiz tenta um golpe incorreto. A mestre Chin sacode a cabeça, para com a mão aberta, e pronuncia uma sílaba breve e firme. Tudo para.',
    masterAction: 'shake-head',
    hanzi: {
      hanzi: '不',
      pinyin: 'bù',
      pinyin_base: 'bu',
      tone: 4,
      meaning_pt: 'não / negação',
      etymology:
        'Uma semente que não consegue brotar através da terra — bloqueio, negação.',
      hsk_level: 1,
      stroke_count: 4,
    },
    challengePrompt:
      'Ela para tudo com um gesto firme. O que este caractere expressa?',
    options: ['sim', 'talvez', 'não / negação', 'rapidamente'],
    correctIndex: 2,
    decomposition: [
      { char: '不', meaning: 'negação', note: 'caractere primitivo — uma semente bloqueada' },
    ],
    masterInsight:
      '不 muda de tom dependendo do que vem depois: antes de tom 4, vira 2° tom: 不是 (bú shì). Isso é sandhi tonal — o mandarim é uma língua que flui.',
  },
  {
    id: 'xie',
    act: 2,
    storyContext:
      'Um aprendiz mais velho oferece água à mestre Chin. Ela recebe com as duas mãos, inclina a cabeça e fala com suavidade. O jovem cora de orgulho.',
    masterAction: 'bow',
    hanzi: {
      hanzi: '谢谢',
      pinyin: 'xièxie',
      pinyin_base: 'xiexie',
      tone: 4,
      meaning_pt: 'obrigado(a)',
      etymology:
        '言 (fala) + 射 (atirar). Palavras que atingem o coração — gratidão expressa.',
      hsk_level: 1,
      stroke_count: 12,
    },
    challengePrompt:
      'Ela recebe com gratidão e pronuncia algo suave. O que ela diz?',
    options: ['adeus', 'com licença', 'obrigado(a)', 'de nada'],
    correctIndex: 2,
    decomposition: [
      { char: '言', meaning: 'fala / palavra', note: 'radical esquerdo' },
      { char: '射', meaning: 'atirar / disparar', note: 'componente direito' },
    ],
    masterInsight:
      'Em mandarim, a gratidão se duplica: 谢 sozinho existe, mas 谢谢 é mais caloroso. A reduplicação suaviza e intensifica ao mesmo tempo — uma beleza única do idioma.',
  },
  {
    id: 'qing',
    act: 3,
    storyContext:
      'A mestre Chin abre a porta do dojo com uma mão e, com a outra, faz um gesto suave convidando você a entrar. Ela diz algo gentil, nunca uma ordem.',
    masterAction: 'gesture-come',
    hanzi: {
      hanzi: '请',
      pinyin: 'qǐng',
      pinyin_base: 'qing',
      tone: 3,
      meaning_pt: 'por favor / convidar',
      etymology:
        '言 (fala) + 青 (azul-verde, jovem). Palavras jovens e frescas — um pedido gentil.',
      hsk_level: 1,
      stroke_count: 10,
    },
    challengePrompt:
      'Ela gesticula suavemente para que você entre. O que a palavra transmite?',
    options: ['sair', 'esperar', 'por favor / convidar', 'proibido'],
    correctIndex: 2,
    decomposition: [
      { char: '言', meaning: 'fala', note: 'radical esquerdo — comunicação' },
      { char: '青', meaning: 'verde / jovem', note: 'componente fonético' },
    ],
    masterInsight:
      '请 é a pedra fundamental da cortesia em mandarim. 请进 (qǐng jìn) = "pode entrar"; 请坐 (qǐng zuò) = "por favor, sente-se". Com 请, qualquer pedido vira convite.',
  },
  {
    id: 'yi',
    act: 3,
    storyContext:
      'A mestre levanta um único dedo. Ela o mantém erguido por um longo silêncio. Depois diz: "Tudo começa com um."',
    masterAction: 'point-up',
    hanzi: {
      hanzi: '一',
      pinyin: 'yī',
      pinyin_base: 'yi',
      tone: 1,
      meaning_pt: 'um / unidade',
      etymology:
        'Um único traço horizontal. O primordial. O Tao gerou o Um.',
      hsk_level: 1,
      stroke_count: 1,
    },
    challengePrompt:
      'Um único dedo. Um único traço. O que representa?',
    options: ['vazio', 'dez', 'um / unidade', 'infinito'],
    correctIndex: 2,
    decomposition: [
      { char: '一', meaning: 'um', note: 'o caractere mais simples da escrita chinesa' },
    ],
    masterInsight:
      '一 também muda de tom: antes de tons 1, 2 ou 3 → vira tom 4 (yì). Antes de tom 4 → vira tom 2 (yí). O mandarim é música — os tons dançam entre si.',
  },
  {
    id: 'xue',
    act: 3,
    storyContext:
      'Chin apanha um pincel. Com movimentos lentos e deliberados, ela escreve no papel. Depois aponta para você, para o pincel, e depois para o papel novamente.',
    masterAction: 'gesture-come',
    hanzi: {
      hanzi: '学',
      pinyin: 'xué',
      pinyin_base: 'xue',
      tone: 2,
      meaning_pt: 'estudar / aprender',
      etymology:
        'Mãos sobre um telhado com um filho embaixo. Conhecimento sendo transmitido de cima para baixo.',
      hsk_level: 1,
      stroke_count: 8,
    },
    challengePrompt:
      'Ela mostra o ato de escrever e aponta para você. O que ela pede?',
    options: ['ensinar', 'esquecer', 'estudar / aprender', 'desistir'],
    correctIndex: 2,
    decomposition: [
      { char: '爻', meaning: 'hexagrama / padrão', note: 'parte superior — conhecimento' },
      { char: '子', meaning: 'filho / criança', note: 'parte inferior — o aprendiz' },
    ],
    masterInsight:
      '学 é a essência do Confucionismo: 学而时习之，不亦说乎 — "Estudar e praticar constantemente, não é isso uma alegria?" (Confúcio). Esta palavra de 8 traços carrega 2500 anos de sabedoria.',
  },
  {
    id: 'xin',
    act: 4,
    storyContext:
      'O sol se põe sobre o dojo. A mestre Chin para diante de você, coloca a mão sobre o próprio peito e fecha os olhos por um momento. Quando os abre, há algo diferente no olhar.',
    masterAction: 'meditate',
    hanzi: {
      hanzi: '心',
      pinyin: 'xīn',
      pinyin_base: 'xin',
      tone: 1,
      meaning_pt: 'coração / mente',
      etymology:
        'A forma de um coração humano com três câmaras e um ponto de movimento vital. Os antigos chineses acreditavam que o coração era o centro do pensamento.',
      hsk_level: 1,
      stroke_count: 4,
    },
    challengePrompt:
      'Ela coloca a mão no peito e fecha os olhos. O que este caractere significa?',
    options: ['mão', 'corpo', 'coração / mente', 'tempo'],
    correctIndex: 2,
    decomposition: [
      { char: '心', meaning: 'coração', note: 'pictograma do coração — caractere primitivo' },
    ],
    masterInsight:
      '心 é um dos radicais mais presentes no mandarim. 想 (xiǎng, pensar), 忘 (wàng, esquecer), 忍 (rěn, suportar) — todos têm 心 em sua raiz. Na filosofia chinesa, coração e mente são a mesma coisa.',
  },
]
