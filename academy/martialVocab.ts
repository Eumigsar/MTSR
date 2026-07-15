// =====================================================================
//  Banco Marcial de Vocabulário — MVP-1
// ---------------------------------------------------------------------
//  Vocabulário de Choy Lay Fut + comandos de pátio + virtude marcial.
//  Alimenta o SRS Leitner existente e o Pátio de Treino. Cada termo traz
//  âncora no estilo que a Amanda já usa (kung fu real + C-pop).
//  Conteúdo — Camada 1 (autônomo). Fidelidade fina = revisão da Amanda.
// =====================================================================

import type { MartialTerm } from "./types";

export const MARTIAL_VOCAB: MartialTerm[] = [
  // ---------- Posturas (步) ----------
  { id: "mabu", han: "马步", pinyin: "mǎbù", tone: 3, meaning_pt: "postura do cavalo", hsk: 0, radicals: ["马 (cavalo)", "止 (pé/parar)"], domain: "postura", anchor: "A base de tudo em Choy Lay Fut — as pernas viram raízes. 马 (cavalo) é o mesmo caractere que você monta na academia." , usedInForms: ["meihuaquan"] },
  { id: "gongbu", han: "弓步", pinyin: "gōngbù", tone: 1, meaning_pt: "postura do arco (avanço)", hsk: 0, radicals: ["弓 (arco)", "止 (pé)"], domain: "postura", anchor: "弓 é literalmente um arco esticado — a perna da frente dobra, a de trás estica, como a corda antes de soltar a flecha.", usedInForms: ["meihuaquan"] },
  { id: "xubu", han: "虚步", pinyin: "xūbù", tone: 1, meaning_pt: "postura vazia (peso atrás)", hsk: 0, radicals: ["虍 (tigre)", "止 (pé)"], domain: "postura", anchor: "虚 = vazio: o pé da frente quase não toca o chão, pronto para chutar. Peso todo atrás, como um tigre agachado.", usedInForms: ["meihuaquan"] },

  // ---------- Golpes e mãos (手/拳/掌) ----------
  { id: "quan", han: "拳", pinyin: "quán", tone: 2, meaning_pt: "punho", hsk: 0, radicals: ["手 (mão)", "龹 (mãos juntas)"], domain: "golpe", anchor: "O caractere do seu próprio estilo: 蔡李佛拳. A mão está desenhada dentro dele.", usedInForms: ["meihuaquan"] },
  { id: "zhang", han: "掌", pinyin: "zhǎng", tone: 3, meaning_pt: "palma", hsk: 0, radicals: ["手 (mão)", "尚"], domain: "golpe", anchor: "Palma aberta — 手 (mão) embaixo. Em CLF a palma corta e empurra, não só o punho.", usedInForms: ["meihuaquan"] },
  { id: "qiaoshou", han: "桥手", pinyin: "qiáoshǒu", tone: 2, meaning_pt: "braço-ponte (bridge hand)", hsk: 0, radicals: ["木 (madeira)", "手 (mão)"], domain: "golpe", anchor: "桥 = ponte. O antebraço vira uma ponte de madeira que conecta e desvia o ataque — assinatura das artes do sul.", usedInForms: ["meihuaquan"] },
  { id: "chuiquan", han: "捶", pinyin: "chuí", tone: 2, meaning_pt: "soco de martelo (golpe circular descendente)", hsk: 0, radicals: ["手 (mão)", "垂 (pendurar)"], domain: "golpe", anchor: "O golpe circular longo característico de Choy Lay Fut — o braço 'pendura' (垂) e desce como martelo.", usedInForms: ["meihuaquan"] },
  { id: "ti", han: "踢", pinyin: "tī", tone: 1, meaning_pt: "chutar", hsk: 4, radicals: ["足 (pé)", "易"], domain: "golpe", anchor: "足 (pé) na frente deixa claro: tudo que começa com 足 é trabalho de perna.", usedInForms: ["meihuaquan"] },

  // ---------- Corpo e respiração ----------
  { id: "qi", han: "气", pinyin: "qì", tone: 4, meaning_pt: "qi / respiração / energia vital", hsk: 3, radicals: ["气 (vapor)"], domain: "corpo", anchor: "O vapor que sobe — respiração e energia são a mesma palavra. Sincronize 气 com cada golpe da Forma." },
  { id: "yao", han: "腰", pinyin: "yāo", tone: 1, meaning_pt: "cintura/lombar", hsk: 5, radicals: ["月 (carne)", "要"], domain: "corpo", anchor: "月 (carne) do lado esquerdo = parte do corpo. A força de CLF nasce na 腰, não no braço." },
  { id: "xi", han: "吸", pinyin: "xī", tone: 1, meaning_pt: "inspirar", hsk: 4, radicals: ["口 (boca)", "及"], domain: "corpo", anchor: "口 (boca) puxando o ar para dentro — a fase de recolher antes de expandir.", usedInForms: ["meihuaquan"] },
  { id: "hu", han: "呼", pinyin: "hū", tone: 1, meaning_pt: "expirar", hsk: 4, radicals: ["口 (boca)", "乎"], domain: "corpo", anchor: "口 soprando para fora — o 'ha!' que sai junto com o golpe. 吸/呼 são o par da respiração marcial.", usedInForms: ["meihuaquan"] },

  // ---------- Virtude marcial (武德) ----------
  { id: "wude", han: "武德", pinyin: "wǔdé", tone: 3, meaning_pt: "virtude marcial / ética do guerreiro", hsk: 0, radicals: ["止 (parar) + 戈 (lança)", "彳 + 心 (coração)"], domain: "virtude", anchor: "武 = parar (止) a lança (戈): a arte marcial serve para ENCERRAR a violência, não buscá-la. 德 é o coração reto." },
  { id: "li", han: "礼", pinyin: "lǐ", tone: 3, meaning_pt: "etiqueta / reverência", hsk: 5, radicals: ["礻 (altar)", "乙"], domain: "virtude", anchor: "A reverência antes e depois da Forma. 礻 é o radical de tudo que é ritual/sagrado." },
  { id: "hengxin", han: "恒心", pinyin: "héngxīn", tone: 2, meaning_pt: "perseverança / constância", hsk: 0, radicals: ["忄 (coração)", "心 (coração)"], domain: "virtude", anchor: "Coração (心) constante — a mesma disciplina do streak diário do dojo. 功夫 é 恒心 aplicada ao tempo." },
  { id: "shifu", han: "师父", pinyin: "shīfu", tone: 1, meaning_pt: "mestre (sifu)", hsk: 0, radicals: ["巾 (estandarte)", "父 (pai)"], domain: "virtude", anchor: "师父 (sifu) carrega 父 (pai): o mestre de kung fu é figura paterna, não só instrutor." },

  // ---------- Comandos de pátio (o Sifu ordena) ----------
  { id: "qishi", han: "起势", pinyin: "qǐshì", tone: 3, meaning_pt: "posição inicial (abrir a Forma)", hsk: 0, radicals: ["走 (andar) + 己", "执 (segurar)"], domain: "comando", anchor: "O comando que abre toda Taolu — 'assuma a postura'. Sempre o movimento 1.", usedInForms: ["meihuaquan"] },
  { id: "shoushi", han: "收势", pinyin: "shōushì", tone: 1, meaning_pt: "encerramento (fechar a Forma)", hsk: 0, radicals: ["收 (recolher)", "执"], domain: "comando", anchor: "O oposto de 起势 — recolhe a energia e fecha. 收 = guardar/recolher. Sempre o último movimento.", usedInForms: ["meihuaquan"] },
  { id: "yubei", han: "预备", pinyin: "yùbèi", tone: 4, meaning_pt: "preparar / atenção", hsk: 0, radicals: ["页 (cabeça)", "备 (preparar)"], domain: "comando", anchor: "O 'perfilar!' antes de começar. O Sifu grita 预备 e você endireita a coluna.", usedInForms: ["meihuaquan"] },
  { id: "kaishi", han: "开始", pinyin: "kāishǐ", tone: 1, meaning_pt: "começar", hsk: 2, radicals: ["开 (abrir)", "女 + 台"], domain: "comando", anchor: "开 (abrir) o portão do treino. Você já viu 开始 em qualquer app — aqui é a ordem de iniciar a Forma." },

  // ---------- Números (ritmam a contagem da Forma) ----------
  { id: "yi", han: "一", pinyin: "yī", tone: 1, meaning_pt: "um", hsk: 1, radicals: ["traço único"], domain: "numero", anchor: "A contagem que ritma a Forma: 一二三四. Primeiro traço, primeira postura.", usedInForms: ["meihuaquan"] },
  { id: "er", han: "二", pinyin: "èr", tone: 4, meaning_pt: "dois", hsk: 1, radicals: ["dois traços"], domain: "numero", anchor: "Dois traços. O Sifu conta o tempo da Taolu em voz alta.", usedInForms: ["meihuaquan"] },
  { id: "san", han: "三", pinyin: "sān", tone: 1, meaning_pt: "três", hsk: 1, radicals: ["três traços"], domain: "numero", anchor: "Três traços. Depois de 三 os números viram formas próprias.", usedInForms: ["meihuaquan"] },
  { id: "si", han: "四", pinyin: "sì", tone: 4, meaning_pt: "quatro", hsk: 1, radicals: ["囗 (cerca)", "儿"], domain: "numero", anchor: "四 fecha o primeiro compasso de 4 tempos da sequência.", usedInForms: ["meihuaquan"] },
  { id: "wu", han: "五", pinyin: "wǔ", tone: 3, meaning_pt: "cinco", hsk: 1, radicals: ["二 + 乂"], domain: "numero", anchor: "五 (cinco) — como as cinco pétalas da flor de ameixa (梅花) que dá nome à Forma." },
];

export const vocabById = (id: string): MartialTerm | undefined =>
  MARTIAL_VOCAB.find((t) => t.id === id);

export const vocabByDomain = (domain: MartialTerm["domain"]): MartialTerm[] =>
  MARTIAL_VOCAB.filter((t) => t.domain === domain);
