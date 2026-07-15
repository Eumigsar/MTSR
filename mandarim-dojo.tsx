import React, { useState, useEffect, useMemo } from "react";
import PatioTreino from "./academy/PatioTreino";

// =====================================================================
//  MANDARIM DOJO — agora com um "Sifu Agent" que decide a sessão sozinho
// ---------------------------------------------------------------------
//  Arquitetura (tudo neste arquivo pra continuar sendo um artefato único):
//    · MEMÓRIA   → log append-only de tentativas (attempts[]) + estado
//                  derivado por item (items{}). Fonte da verdade = attempts.
//    · PADRÕES   → detectPatterns(): confusão de tom, radicais fracos, mix
//                  de tipos de erro.
//    · DECISÃO   → planSession(): vencidos vs novos, reforçar-vs-expandir,
//                  fila ponderada. Pura, determinística, offline.
//    · GERAÇÃO   → maybeGenerate(): quando há cluster consolidado (caixa 4+),
//                  forja 3–5 frases novas no estilo âncora. Usa
//                  window.claude.complete se existir; senão, template.
//    · RELATÓRIO → buildReport(): ponto fraco de hoje, prioridade de amanhã,
//                  % consolidado.
// =====================================================================

// ---- Data: characters tied to Amanda's real anchors (kung fu, C-pop, daily study) ----
const DECK = [
  { id: "shi", han: "是", pinyin: "shì", tone: 4, meaning: "ser / é", radicals: ["日 (sol)", "疋 (pé/andar)"], anchor: "Tom 4 cai como um golpe reto de Choy Lay Fut — direto, sem hesitação. 'Eu SOU' é uma afirmação, não uma pergunta." },
  { id: "bu", han: "不", pinyin: "bù", tone: 4, meaning: "não (negação)", radicals: ["一 (traço)", "raiz pictográfica de raiz presa"], anchor: "Junto com 是 forma 不是 — o par mais repetido do mandarim básico. Pense nele como o 'bloqueio' antes do golpe de 是." },
  { id: "hen", han: "很", pinyin: "hěn", tone: 3, meaning: "muito", radicals: ["彳 (passo curto)", "艮 (parar/duro)"], anchor: "Tom 3 desce e sobe — como um agachamento de base antes de avançar. 很好 (muito bom) é seu 'ok, próximo movimento'." },
  { id: "le", han: "了", pinyin: "le", tone: 0, meaning: "partícula de ação concluída", radicals: ["子 (criança, forma simplificada)"], anchor: "Marca que o golpe já aconteceu — passado. Sem tom próprio, ele é o 'silêncio' depois do movimento." },
  { id: "mei", han: "没", pinyin: "méi", tone: 2, meaning: "não (com 有/ação passada)", radicals: ["氵 (água)", "殳 (bastão)"], anchor: "Tom 2 sobe, como uma pergunta que nega. 没有 é diferente de 不 — guarde isso como dois estilos de defesa diferentes." },
  { id: "nihao", han: "你好", pinyin: "nǐ hǎo", tone: 0, meaning: "olá", radicals: ["亻(pessoa) + 女 (mulher/mão-ombro)"], anchor: "A saudação de abertura — como a reverência (礼, lǐ) antes de começar um kata." },
  { id: "xiexie", han: "谢谢", pinyin: "xièxie", tone: 4, meaning: "obrigado(a)", radicals: ["言 (fala) + 身 (corpo) + 寸 (mão/medida)"], anchor: "Repetição do mesmo caractere — como bater duas vezes o punho no peito ao agradecer o mestre." },
  { id: "quan", han: "拳", pinyin: "quán", tone: 2, meaning: "punho / boxe (como em Choy Lay Fut, 蔡李佛拳)", radicals: ["龹 (mãos entrelaçadas)", "手 (mão)"], anchor: "Literalmente o caractere do seu próprio treino. A mão está desenhada dentro do caractere." },
  { id: "gongfu", han: "功夫", pinyin: "gōngfu", tone: 0, meaning: "trabalho duro / kung fu", radicals: ["工 (trabalho) + 力 (força)", "夫 (homem adulto)"], anchor: "Não significa só 'luta' — significa tempo + esforço investido em qualquer habilidade. Seu mandarim também é 功夫." },
  { id: "pengyou", han: "朋友", pinyin: "péngyou", tone: 2, meaning: "amigo(a)", radicals: ["月月 (duas luas/carnes lado a lado)", "又 (mão repetida)"], anchor: "Dois radicais idênticos lado a lado — como dois parceiros de treino espelhando o movimento." },
  { id: "xihuan", han: "喜欢", pinyin: "xǐhuan", tone: 3, meaning: "gostar de", radicals: ["士豆 (tambor/alegria)", "欠 (respiração/desejo)"], anchor: "Use nas suas frases sobre C-pop: 我喜欢草東没有派对 (eu gosto de No Party for Cao Dong)." },
  { id: "yinyue", han: "音乐", pinyin: "yīnyuè", tone: 1, meaning: "música", radicals: ["音 (som)", "乐 (alegria/instrumento)"], anchor: "音 tem 日 (sol) dentro — som que 'nasce'. Ligue à sua playlist de comute." },
  { id: "xianzai", han: "现在", pinyin: "xiànzài", tone: 4, meaning: "agora", radicals: ["王 (jade/rei) + 见 (ver)", "在 (estar em)"], anchor: "'Ver o que está presente' — o momento exato de um golpe, nem antes nem depois." },
  { id: "jintian", han: "今天", pinyin: "jīntiān", tone: 1, meaning: "hoje", radicals: ["人 (pessoa) + 一 (traço)", "大一 (grande + traço = céu)"], anchor: "今 parece uma pessoa sob um teto — o dia que você está vivendo agora, debaixo do mesmo céu (天)." },
  { id: "laoshi", han: "老师", pinyin: "lǎoshī", tone: 3, meaning: "professor(a) / mestre", radicals: ["耂 (velho) + 匕", "巾 (pano/estandarte)"], anchor: "O radical 'velho' (耂) marca sabedoria — pense no seu sifu de Choy Lay Fut." },

  // --- Expansão: gramática (是/很/了/没), tempo, números, perguntas, verbos, família ---
  { id: "wo", han: "我", pinyin: "wǒ", tone: 3, meaning: "eu", radicals: ["手 (mão) + 戈 (lança, forma antiga)"], anchor: "Base de toda frase — sua 'postura inicial' antes de qualquer golpe verbal." },
  { id: "ni", han: "你", pinyin: "nǐ", tone: 3, meaning: "você", radicals: ["亻(pessoa) + 尔"], anchor: "亻 aparece de novo — 'pessoa' é o radical mais comum do seu vocabulário atual." },
  { id: "ta", han: "他/她", pinyin: "tā", tone: 1, meaning: "ele / ela", radicals: ["亻(pessoa) ou 女 (mulher) + 也"], anchor: "Mesmo som, radical diferente muda o gênero — só a 'mão' (亻→女) troca." },
  { id: "you", han: "有", pinyin: "yǒu", tone: 3, meaning: "ter / haver", radicals: ["月 (carne/lua) + 又 (mão)"], anchor: "Contraste direto: 没有 = não ter (passado/estado), enquanto 不是 = não ser. Dois golpes diferentes." },
  { id: "meiyou", han: "没有", pinyin: "méiyǒu", tone: 2, meaning: "não ter / não há", radicals: ["氵(água) + 殳", "月 + 又"], anchor: "A negação que você já viu em 没 — aqui combinada com 有. É o par que mais confunde, treine junto." },
  { id: "bushi", han: "不是", pinyin: "bú shì", tone: 4, meaning: "não é / não ser", radicals: ["一 + raiz", "日 + 疋"], anchor: "O par oposto de 是 — memorize como bloqueio-e-golpe: primeiro nega (不), depois afirma o quê (是)." },
  { id: "shenme", han: "什么", pinyin: "shénme", tone: 2, meaning: "o quê", radicals: ["亻(pessoa) + 十", "麼 simplificado"], anchor: "Pergunta mais básica — pense nela como 'qual movimento?' antes de reagir." },
  { id: "shei", han: "谁", pinyin: "shéi", tone: 2, meaning: "quem", radicals: ["言 (fala) + 隹 (pássaro)"], anchor: "Tem 言 (fala) dentro — faz sentido, é a pergunta que abre uma conversa." },
  { id: "nar", han: "哪儿/哪里", pinyin: "nǎr / nǎlǐ", tone: 3, meaning: "onde", radicals: ["口 (boca) + 那", "里 (dentro/distância)"], anchor: "口 (boca) aparece porque é uma pergunta falada — onde no espaço, como orientação num tatame." },
  { id: "weishenme", han: "为什么", pinyin: "wèishénme", tone: 4, meaning: "por quê", radicals: ["为 (por causa de) + 什么"], anchor: "Junta 'por causa de' + 'o quê' — literalmente 'por causa do quê'." },
  { id: "xianzai_qu", han: "去", pinyin: "qù", tone: 4, meaning: "ir", radicals: ["土 (terra) + 厶"], anchor: "Tom 4, reto e decidido — o passo à frente num avanço de kung fu." },
  { id: "lai", han: "来", pinyin: "lái", tone: 2, meaning: "vir", radicals: ["pictograma de trigo/espigas"], anchor: "Oposto de 去 — o movimento de recuo/retorno depois do avanço." },
  { id: "chi", han: "吃", pinyin: "chī", tone: 1, meaning: "comer", radicals: ["口 (boca) + 乞"], anchor: "口 de novo — todo verbo ligado à boca carrega esse radical (吃, 喝, 谢)." },
  { id: "he", han: "喝", pinyin: "hē", tone: 1, meaning: "beber", radicals: ["口 (boca) + 曷"], anchor: "Mesma família de 吃 — associe os dois numa frase sobre chá depois do treino." },
  { id: "shui", han: "睡觉", pinyin: "shuìjiào", tone: 4, meaning: "dormir", radicals: ["目 (olho) + 垂", "见 (ver) + 觉"], anchor: "目 (olho) fechando — o caractere literalmente mostra o olho se fechando pra dormir." },
  { id: "kan", han: "看", pinyin: "kàn", tone: 4, meaning: "ver / assistir", radicals: ["手 (mão) sobre 目 (olho)"], anchor: "Uma mão sobre o olho, feito viseira — o caractere é a própria ação desenhada." },
  { id: "ting", han: "听", pinyin: "tīng", tone: 1, meaning: "ouvir / escutar", radicals: ["口 (boca) + 斤"], anchor: "Use em 我听音乐 (eu escuto música) — direto pro seu hábito de comute." },
  { id: "yi", han: "一", pinyin: "yī", tone: 1, meaning: "um", radicals: ["traço único"], anchor: "O traço mais simples possível — a base de toda contagem, como a primeira postura de um kata." },
  { id: "er", han: "二", pinyin: "èr", tone: 4, meaning: "dois", radicals: ["dois traços"], anchor: "Dois traços empilhados — visualmente literal." },
  { id: "san", han: "三", pinyin: "sān", tone: 1, meaning: "três", radicals: ["três traços"], anchor: "Padrão se mantém até aqui — depois de 三 os números ganham formas próprias." },
  { id: "xingqi", han: "星期", pinyin: "xīngqī", tone: 1, meaning: "semana", radicals: ["日 (sol) + 生", "其"], anchor: "星期一 = segunda, 星期二 = terça... o número que você já decorou (一二三) entra direto aqui." },
  { id: "nianji", han: "年", pinyin: "nián", tone: 2, meaning: "ano", radicals: ["pictograma de colheita"], anchor: "Originalmente representa uma colheita — o ciclo de um ano inteiro de trabalho." },
  { id: "mingtian", han: "明天", pinyin: "míngtiān", tone: 2, meaning: "amanhã", radicals: ["日 (sol) + 月 (lua)", "大 + 一"], anchor: "Sol + lua juntos = 明 (claridade) — o dia que ainda vai clarear. Contraste com 今天 (hoje) e 昨天 (ontem)." },
  { id: "zuotian", han: "昨天", pinyin: "zuótiān", tone: 2, meaning: "ontem", radicals: ["日 (sol) + 乍", "大 + 一"], anchor: "Combine com 了 nas suas frases de passado: 昨天我学习了 (ontem eu estudei)." },
];

const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16, 35]; // Leitner-ish: box 0 = review now, box 5 = mastered-ish
const MAX_BOX = BOX_INTERVALS_DAYS.length - 1;
const CONSOLIDATED_BOX = 4;      // caixa a partir da qual um item conta como "consolidado"
const STORAGE_KEY = "mandarim-dojo-progress-v1"; // legado (v1) — só leitura, pra migrar
const STORAGE_KEY_V2 = "mandarim-dojo-state-v2";
const MAX_ATTEMPTS = 3000;       // teto do log pra não crescer sem limite
const SESSION_CAP = 15;          // máx. de cartas por sessão
const NEW_PER_SESSION = 4;       // quantos itens novos no modo "expandir"
const REINFORCE_DUE_THRESHOLD = 12; // acima disso, só reforço (sem novos)
const LOW_ACCURACY = 0.6;        // abaixo disso, só reforço

// Radicais-chave que rastreamos pra detectar padrões (ex: 氵, 口, 亻...)
const KEY_RADICALS = ["氵", "口", "亻", "月", "言", "手", "目", "日", "女", "彳", "土", "心", "宀", "又", "见"];

const TONE_LABELS = { 1: "1 (alto/plano)", 2: "2 (subindo)", 3: "3 (desce-sobe)", 4: "4 (caindo)", 0: "neutro" };

function toneColor(tone) {
  switch (tone) {
    case 1: return "#C9A227"; // gold, flat high
    case 2: return "#7B2D3E"; // wine, rising
    case 3: return "#2F5233"; // deep jade, dip
    case 4: return "#B3401F"; // strike red-orange, falling
    default: return "#8A8478"; // neutral, toneless
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

// Extrai os radicais-chave presentes num card (deriva "erro por radical" de graça).
function radicalTagsOf(card) {
  const joined = (card.radicals || []).join(" ") + " " + card.han;
  return KEY_RADICALS.filter((r) => joined.includes(r));
}

// =====================================================================
//  MEMÓRIA — estado inicial, migração v1→v2, derivação
// =====================================================================

function emptyItem() {
  return { box: 0, lastSeen: null, streak: 0, seen: 0, correct: 0, wrong: 0 };
}

function freshState() {
  const items = {};
  DECK.forEach((c) => { items[c.id] = emptyItem(); });
  return { version: 2, items, attempts: [], generated: [], lastGenSignature: null };
}

// Aceita tanto o formato v2 quanto o v1 legado ({id:{box,lastSeen,streak}}).
function normalizeState(parsed) {
  const base = freshState();
  if (!parsed) return base;
  if (parsed.version === 2 && parsed.items) {
    return {
      version: 2,
      items: { ...base.items, ...parsed.items },
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      generated: Array.isArray(parsed.generated) ? parsed.generated : [],
      lastGenSignature: parsed.lastGenSignature ?? null,
    };
  }
  // v1: mapa direto de progresso — migra preservando box/lastSeen/streak.
  const items = { ...base.items };
  Object.keys(parsed).forEach((id) => {
    const p = parsed[id];
    if (p && typeof p === "object") {
      items[id] = { ...emptyItem(), ...items[id], box: p.box ?? 0, lastSeen: p.lastSeen ?? null, streak: p.streak ?? 0 };
    }
  });
  return { version: 2, items, attempts: [], generated: [], lastGenSignature: null };
}

// =====================================================================
//  PADRÕES — detectPatterns(): confusão de tom, radicais fracos, mix de erro
// =====================================================================

function detectPatterns(attempts, deckById) {
  const wrong = attempts.filter((a) => !a.correct);

  // --- Confusão de tom: matriz esperado→respondido (só quando houve palpite) ---
  const tonePairs = {};
  wrong.forEach((a) => {
    if (a.errorType === "tone" && a.expectedTone && a.answeredTone && a.expectedTone !== a.answeredTone) {
      const key = a.expectedTone + "->" + a.answeredTone;
      tonePairs[key] = (tonePairs[key] || 0) + 1;
    }
  });
  let toneConfusion = null;
  Object.keys(tonePairs).forEach((k) => {
    if (!toneConfusion || tonePairs[k] > toneConfusion.count) {
      const [from, to] = k.split("->").map(Number);
      toneConfusion = { from, to, count: tonePairs[k] };
    }
  });
  if (toneConfusion && toneConfusion.count < 2) toneConfusion = null; // exige recorrência

  // --- Radicais fracos: taxa de erro por radical-chave, com exposição mínima ---
  const radStats = {}; // radical -> {wrong, total}
  attempts.forEach((a) => {
    const card = deckById[a.itemId];
    if (!card) return;
    radicalTagsOf(card).forEach((r) => {
      if (!radStats[r]) radStats[r] = { wrong: 0, total: 0 };
      radStats[r].total += 1;
      if (!a.correct) radStats[r].wrong += 1;
    });
  });
  const weakRadicals = Object.keys(radStats)
    .map((r) => ({ radical: r, wrong: radStats[r].wrong, total: radStats[r].total, rate: radStats[r].wrong / radStats[r].total }))
    .filter((s) => s.wrong >= 3 && s.rate >= 0.4)
    .sort((a, b) => b.wrong - a.wrong);

  // --- Mix de tipos de erro ---
  const errorMix = { tone: 0, radical: 0, meaning: 0, untagged: 0 };
  wrong.forEach((a) => {
    if (a.errorType && errorMix[a.errorType] !== undefined) errorMix[a.errorType] += 1;
    else errorMix.untagged += 1;
  });

  return { toneConfusion, weakRadicals, errorMix, totalWrong: wrong.length };
}

function recentAccuracy(attempts, window = 20) {
  const slice = attempts.slice(-window);
  if (!slice.length) return 1;
  const ok = slice.filter((a) => a.correct).length;
  return ok / slice.length;
}

// =====================================================================
//  DECISÃO — planSession(): pura, determinística, offline
// =====================================================================

function intervalForBox(box) {
  return BOX_INTERVALS_DAYS[Math.min(box, MAX_BOX)];
}

function isDue(item) {
  if (!item || !item.lastSeen) return false; // "novo", tratado à parte
  return daysBetween(item.lastSeen, todayStr()) >= intervalForBox(item.box);
}
function overdueDays(item) {
  if (!item || !item.lastSeen) return 0;
  return daysBetween(item.lastSeen, todayStr()) - intervalForBox(item.box);
}

function planSession(state, deck) {
  const deckById = {};
  deck.forEach((c) => { deckById[c.id] = c; });
  const items = state.items;
  const patterns = detectPatterns(state.attempts, deckById);
  const accuracy = recentAccuracy(state.attempts);

  const seenIds = deck.filter((c) => items[c.id] && items[c.id].lastSeen);
  const dueReview = seenIds.filter((c) => isDue(items[c.id]));
  const newPool = deck.filter((c) => !items[c.id] || !items[c.id].lastSeen);

  // Decisão reforçar-vs-expandir.
  let mode; // 'reinforce' | 'expand'
  let reason;
  if (dueReview.length >= REINFORCE_DUE_THRESHOLD) {
    mode = "reinforce";
    reason = `${dueReview.length} caracteres venceram — dia de reforço, sem material novo.`;
  } else if (accuracy < LOW_ACCURACY && state.attempts.length >= 8) {
    mode = "reinforce";
    reason = `Sua precisão recente está em ${Math.round(accuracy * 100)}% — o Sifu segura vocabulário novo até firmar a base.`;
  } else {
    mode = "expand";
    reason = newPool.length
      ? `Base firme (${Math.round(accuracy * 100)}% recente) — hora de abrir ${Math.min(NEW_PER_SESSION, newPool.length)} caractere(s) novo(s).`
      : `Você já viu o deck inteiro — reforçando os vencidos e forjando frases novas.`;
  }

  const activeWeakRadicals = patterns.weakRadicals.map((w) => w.radical);
  const matchesWeak = (card) => {
    const tags = radicalTagsOf(card);
    if (tags.some((t) => activeWeakRadicals.includes(t))) return true;
    if (patterns.toneConfusion && (card.tone === patterns.toneConfusion.from || card.tone === patterns.toneConfusion.to)) return true;
    return false;
  };

  // Peso da fila: atraso + histórico de erro + casa com padrão fraco ativo.
  const weightOf = (card) => {
    const it = items[card.id] || emptyItem();
    return overdueDays(it) * 2 + it.wrong * 1.5 + (matchesWeak(card) ? 3 : 0) + (MAX_BOX - it.box) * 0.4;
  };

  const reviewQueue = [...dueReview].sort((a, b) => weightOf(b) - weightOf(a));
  const newItems = mode === "expand" ? newPool.slice(0, NEW_PER_SESSION) : [];

  let queue = [...reviewQueue, ...newItems];
  // Rede de segurança: nunca deixa a sessão vazia.
  if (!queue.length) {
    const fallback = newPool.length ? newPool.slice(0, NEW_PER_SESSION) : [...seenIds].sort((a, b) => weightOf(b) - weightOf(a)).slice(0, 6);
    queue = fallback.length ? fallback : [...deck].sort(() => Math.random() - 0.5).slice(0, 6);
  }
  queue = queue.slice(0, SESSION_CAP);

  return { mode, reason, patterns, accuracy, dueCount: dueReview.length, newCount: newItems.length, queue };
}

// =====================================================================
//  GERAÇÃO — maybeGenerate(): frases novas no estilo âncora
//  Usa window.claude.complete se existir; senão, cai num banco de templates.
// =====================================================================

function consolidatedCards(state, deck) {
  return deck.filter((c) => state.items[c.id] && state.items[c.id].box >= CONSOLIDATED_BOX);
}
function generationSignature(cards) {
  return cards.map((c) => c.id).sort().join(",");
}

function templateSentences(vocab) {
  // Fallback determinístico: monta frases a partir do vocabulário consolidado.
  const has = (id) => vocab.some((v) => v.id === id);
  const out = [];
  if (has("wo") && has("xihuan") && has("yinyue")) {
    out.push({ han: "我很喜欢音乐", pinyin: "wǒ hěn xǐhuan yīnyuè", meaning: "eu gosto muito de música", anchor: "Diga isso pensando na sua playlist de comute — 草東没有派对 no talo.", uses: ["wo", "xihuan", "yinyue"] });
  }
  if (has("wo") && has("gongfu")) {
    out.push({ han: "我今天练功夫了", pinyin: "wǒ jīntiān liàn gōngfu le", meaning: "eu treinei kung fu hoje", anchor: "了 fecha o golpe: a ação de Choy Lay Fut de hoje já aconteceu.", uses: ["wo", "jintian", "gongfu", "le"] });
  }
  if (has("ni") && has("chi") && has("le")) {
    out.push({ han: "你吃了吗", pinyin: "nǐ chī le ma", meaning: "você já comeu?", anchor: "A saudação mais chinesa que existe — 口 (boca) em 吃 pedindo o próximo movimento.", uses: ["ni", "chi", "le"] });
  }
  if (has("wo") && has("meiyou") && has("shui")) {
    out.push({ han: "我没有睡觉", pinyin: "wǒ méiyǒu shuìjiào", meaning: "eu não dormi", anchor: "没有 nega o passado — 目 (olho) que não chegou a fechar.", uses: ["wo", "meiyou", "shui"] });
  }
  if (has("ta") && has("shi") && has("laoshi")) {
    out.push({ han: "她是老师", pinyin: "tā shì lǎoshī", meaning: "ela é professora", anchor: "是 reto como golpe — afirmação sem hesitar, igual seu sifu.", uses: ["ta", "shi", "laoshi"] });
  }
  return out.slice(0, 5);
}

async function maybeGenerate(vocab) {
  // vocab: cards consolidados. Tenta LLM, cai pra template.
  const vocabList = vocab.map((c) => `${c.han} (${c.pinyin}, ${c.meaning})`).join("; ");
  const canLLM = typeof window !== "undefined" && window.claude && typeof window.claude.complete === "function";

  if (canLLM) {
    const prompt = `Você é o Sifu de um dojo de mandarim para uma aluna brasileira que treina Choy Lay Fut kung fu e curte C-pop (No Party for Cao Dong / 草東没有派对).
Gere de 3 a 5 frases curtas de nível iniciante-intermediário usando SOMENTE este vocabulário já consolidado por ela: ${vocabList}.
Cada frase deve trazer uma "âncora" mnemônica ligada a kung fu OU a bandas/música (C-pop), no mesmo espírito das âncoras que ela já usa.
Responda APENAS com um array JSON válido, sem texto fora dele, no formato:
[{"han":"...","pinyin":"...","meaning":"tradução em português","anchor":"âncora curta em português","uses":["id1","id2"]}]
Onde "uses" lista os caracteres do vocabulário usados. Não invente caracteres fora do vocabulário fornecido.`;
    try {
      const raw = await window.claude.complete(prompt);
      const match = String(raw).match(/\[[\s\S]*\]/);
      const arr = JSON.parse(match ? match[0] : raw);
      const clean = (Array.isArray(arr) ? arr : [])
        .filter((s) => s && s.han && s.pinyin && s.meaning)
        .slice(0, 5)
        .map((s) => ({ han: s.han, pinyin: s.pinyin, meaning: s.meaning, anchor: s.anchor || "", uses: Array.isArray(s.uses) ? s.uses : [] }));
      if (clean.length) return { source: "llm", sentences: clean };
    } catch (e) {
      // cai pro fallback
    }
  }
  return { source: "template", sentences: templateSentences(vocab) };
}

// Converte frases geradas em cards de deck (caixa 0, entram no fluxo normal).
function sentencesToCards(sentences) {
  const stamp = Date.now();
  return sentences.map((s, i) => ({
    id: `gen-${stamp}-${i}`,
    han: s.han,
    pinyin: s.pinyin,
    tone: 0,
    meaning: s.meaning,
    radicals: [],
    anchor: s.anchor || "Frase forjada pelo Sifu a partir do que você já domina.",
    generated: true,
    uses: s.uses || [],
  }));
}

// =====================================================================
//  RELATÓRIO — buildReport(): ponto fraco, prioridade de amanhã, %
// =====================================================================

function buildReport(sessionAttempts, state, deck) {
  const deckById = {};
  deck.forEach((c) => { deckById[c.id] = c; });
  const wrong = sessionAttempts.filter((a) => !a.correct);

  // Ponto fraco de hoje.
  let weakPoint = "Nenhum ponto fraco marcante — sessão limpa. 很好!";
  if (wrong.length) {
    const mix = { tone: 0, radical: 0, meaning: 0 };
    const tonePairs = {};
    const radHits = {};
    wrong.forEach((a) => {
      if (a.errorType && mix[a.errorType] !== undefined) mix[a.errorType] += 1;
      if (a.errorType === "tone" && a.expectedTone && a.answeredTone && a.expectedTone !== a.answeredTone) {
        const k = a.expectedTone + "->" + a.answeredTone;
        tonePairs[k] = (tonePairs[k] || 0) + 1;
      }
      const card = deckById[a.itemId];
      if (card) radicalTagsOf(card).forEach((r) => { radHits[r] = (radHits[r] || 0) + 1; });
    });
    const dominant = Object.keys(mix).sort((a, b) => mix[b] - mix[a])[0];
    if (dominant === "tone" && Object.keys(tonePairs).length) {
      const topPair = Object.keys(tonePairs).sort((a, b) => tonePairs[b] - tonePairs[a])[0];
      const [f, t] = topPair.split("->");
      weakPoint = `Tom: você trocou tom ${f} por tom ${t} (${tonePairs[topPair]}× hoje).`;
    } else if (dominant === "radical" || (mix.radical && Object.keys(radHits).length)) {
      const topRad = Object.keys(radHits).sort((a, b) => radHits[b] - radHits[a])[0];
      weakPoint = `Radical: caracteres com ${topRad} te derrubaram (${radHits[topRad]}× hoje).`;
    } else if (dominant === "meaning") {
      weakPoint = `Significado: o problema hoje foi lembrar o sentido, não a forma.`;
    } else {
      weakPoint = `${wrong.length} caractere(s) voltaram pra caixa 0 — o Sifu vai priorizá-los amanhã.`;
    }
  }

  // Prioridade de amanhã: olha o plano do próximo dia.
  const nextPlan = planSession(state, deck);
  let tomorrowPriority;
  if (nextPlan.patterns.weakRadicals.length) {
    tomorrowPriority = `Drills do radical ${nextPlan.patterns.weakRadicals[0].radical}.`;
  } else if (nextPlan.patterns.toneConfusion) {
    const tc = nextPlan.patterns.toneConfusion;
    tomorrowPriority = `Separar tom ${tc.from} de tom ${tc.to}.`;
  } else if (nextPlan.queue.length) {
    tomorrowPriority = `Revisar ${nextPlan.queue.slice(0, 3).map((c) => c.han).join(" · ")}${nextPlan.queue.length > 3 ? "…" : ""}.`;
  } else {
    tomorrowPriority = "Nada vence amanhã — descanso ou frase nova de bônus.";
  }

  const total = deck.length;
  const consolidated = deck.filter((c) => state.items[c.id] && state.items[c.id].box >= CONSOLIDATED_BOX).length;
  const consolidatedPct = Math.round((consolidated / total) * 100);

  return { weakPoint, tomorrowPriority, consolidatedPct, consolidated, total };
}

// =====================================================================
//  COMPONENTE
// =====================================================================

export default function MandarimDojo() {
  const [state, setState] = useState(() => freshState());
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState("briefing"); // briefing | session | complete
  const [plan, setPlan] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionResults, setSessionResults] = useState({ acertos: 0, erros: 0 });
  const [sessionAttempts, setSessionAttempts] = useState([]);
  const [error, setError] = useState(null);
  const [view, setView] = useState("dojo"); // dojo (SRS) | patio (Forma/Cultivo)

  // Sub-fluxo de marcação de erro
  const [tagging, setTagging] = useState(false);      // mostrando "onde travou?"
  const [awaitTone, setAwaitTone] = useState(false);  // mostrando palpite de tom

  // Relatório + geração
  const [report, setReport] = useState(null);
  const [genState, setGenState] = useState({ status: "idle", cards: [], source: null }); // idle|working|done|none

  // Deck efetivo = base + frases geradas
  const deck = useMemo(() => [...DECK, ...(state.generated || [])], [state.generated]);

  // ---- Carrega estado persistido (com migração v1 → v2) ----
  useEffect(() => {
    (async () => {
      try {
        const v2 = await window.storage.get(STORAGE_KEY_V2, false);
        if (v2 && v2.value) {
          setState(normalizeState(JSON.parse(v2.value)));
        } else {
          const v1 = await window.storage.get(STORAGE_KEY, false);
          if (v1 && v1.value) setState(normalizeState(JSON.parse(v1.value)));
        }
      } catch (e) {
        // sem progresso salvo — tudo bem
      }
      setLoaded(true);
    })();
  }, []);

  const persist = async (next) => {
    try {
      await window.storage.set(STORAGE_KEY_V2, JSON.stringify(next), false);
    } catch (e) {
      setError("Não consegui salvar seu progresso agora, mas a sessão continua normalmente.");
    }
  };

  // ---- Ao carregar, o agente monta o plano e mostra o briefing ----
  useEffect(() => {
    if (loaded) {
      setPlan(planSession(state, deck));
      setMode("briefing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const startSession = () => {
    const freshPlan = planSession(state, deck);
    setPlan(freshPlan);
    setQueue(freshPlan.queue);
    setCurrent(0);
    setRevealed(false);
    setTagging(false);
    setAwaitTone(false);
    setSessionResults({ acertos: 0, erros: 0 });
    setSessionAttempts([]);
    setReport(null);
    setGenState({ status: "idle", cards: [], source: null });
    setMode("session");
  };

  const beginBriefing = () => {
    setPlan(planSession(state, deck));
    setMode("briefing");
  };

  // ---- Registra uma tentativa (grava attempt + atualiza item derivado) ----
  const record = (card, correct, errorType, answeredTone) => {
    const it = state.items[card.id] || emptyItem();
    const nextBox = correct ? Math.min(it.box + 1, MAX_BOX) : 0;
    const attempt = {
      itemId: card.id,
      ts: new Date().toISOString(),
      correct,
      errorType: correct ? null : (errorType || null),
      expectedTone: card.tone || null,
      answeredTone: answeredTone || null,
    };
    const nextAttempts = [...state.attempts, attempt].slice(-MAX_ATTEMPTS);
    const nextState = {
      ...state,
      items: {
        ...state.items,
        [card.id]: {
          box: nextBox,
          lastSeen: todayStr(),
          streak: correct ? it.streak + 1 : 0,
          seen: it.seen + 1,
          correct: it.correct + (correct ? 1 : 0),
          wrong: it.wrong + (correct ? 0 : 1),
        },
      },
      attempts: nextAttempts,
    };
    setState(nextState);
    persist(nextState);

    setSessionResults((s) => ({ acertos: s.acertos + (correct ? 1 : 0), erros: s.erros + (correct ? 0 : 1) }));
    setSessionAttempts((a) => [...a, attempt]);

    // Avança / encerra
    setTagging(false);
    setAwaitTone(false);
    if (current + 1 < queue.length) {
      setCurrent(current + 1);
      setRevealed(false);
    } else {
      finishSession(nextState);
    }
  };

  const finishSession = (finalState) => {
    const allSession = [...sessionAttempts]; // último attempt já entrou via setState assíncrono; recompomos abaixo
    // Recompõe: sessionAttempts pode não ter o último ainda por causa do setState; usamos os attempts do estado final.
    const sessionCount = allSession.length + 1; // inclui o atual
    const sessAtt = finalState.attempts.slice(-sessionCount);
    setReport(buildReport(sessAtt, finalState, [...DECK, ...(finalState.generated || [])]));
    setMode("complete");
    triggerGeneration(finalState);
  };

  // ---- Geração de conteúdo novo quando há cluster consolidado ----
  const triggerGeneration = async (curState) => {
    const fullDeck = [...DECK, ...(curState.generated || [])];
    const consolidated = consolidatedCards(curState, fullDeck).filter((c) => !c.generated);
    const signature = generationSignature(consolidated);
    if (consolidated.length < 4 || signature === curState.lastGenSignature) {
      setGenState({ status: "none", cards: [], source: null });
      return;
    }
    setGenState({ status: "working", cards: [], source: null });
    const { source, sentences } = await maybeGenerate(consolidated);
    if (!sentences.length) {
      setGenState({ status: "none", cards: [], source: null });
      return;
    }
    const newCards = sentencesToCards(sentences);
    const nextState = {
      ...curState,
      generated: [...(curState.generated || []), ...newCards],
      items: { ...curState.items, ...Object.fromEntries(newCards.map((c) => [c.id, emptyItem()])) },
      lastGenSignature: signature,
    };
    setState(nextState);
    persist(nextState);
    setGenState({ status: "done", cards: newCards, source });
  };

  // ---- Handlers de resposta ----
  const answerKnew = () => record(queue[current], true, null, null);
  const openTagging = () => setTagging(true);
  const chooseErrorType = (type) => {
    if (type === "tone") setAwaitTone(true);
    else record(queue[current], false, type, null);
  };
  const chooseToneGuess = (t) => record(queue[current], false, "tone", t);
  const skipTag = () => record(queue[current], false, null, null);

  // ---- Métricas de faixa (idênticas ao original) ----
  const masteredCount = Object.keys(state.items).filter((id) => state.items[id].box >= CONSOLIDATED_BOX).length;
  const beltStage = Math.min(Math.floor((masteredCount / deck.length) * 5), 4);
  const beltNames = ["Faixa branca", "Faixa amarela", "Faixa laranja", "Faixa verde", "Faixa roxa"];
  const beltColors = ["#EDE7DA", "#F2C230", "#D97A2A", "#2F5233", "#5B2C6F"];

  const card = queue[current];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.eyebrow}>道场 · DOJO DE MANDARIM</div>
          <h1 style={styles.title}>Mandarim Dojo</h1>
          <p style={styles.subtitle}>
            Radical por radical, tom por tom — como um golpe de Choy Lay Fut: primeiro a base, depois a força.
          </p>
        </header>

        <nav style={styles.tabBar}>
          <button
            style={{ ...styles.tab, ...(view === "dojo" ? styles.tabActive : {}) }}
            onClick={() => setView("dojo")}
          >
            复习 · Revisão
          </button>
          <button
            style={{ ...styles.tab, ...(view === "patio" ? styles.tabActive : {}) }}
            onClick={() => setView("patio")}
          >
            练武 · Pátio de Treino
          </button>
        </nav>

        {view === "patio" && <PatioTreino />}

        {view === "dojo" && (<>
        <div style={styles.beltBar}>
          <div style={styles.beltTrack}>
            <div
              style={{
                ...styles.beltFill,
                width: `${Math.min((masteredCount / deck.length) * 100, 100)}%`,
                background: beltColors[beltStage],
              }}
            />
          </div>
          <div style={styles.beltLabel}>
            {beltNames[beltStage]} — {masteredCount}/{deck.length} caracteres consolidados
          </div>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {!loaded && <div style={styles.loading}>Carregando seu progresso…</div>}

        {/* ---------- BRIEFING: o plano do Sifu ---------- */}
        {loaded && mode === "briefing" && plan && (
          <div style={styles.card}>
            <div style={styles.briefEyebrow}>O SIFU ANALISOU SEU HISTÓRICO</div>
            <div style={styles.briefMode}>
              {plan.mode === "reinforce" ? "Hoje: dia de reforço" : "Hoje: reforço + material novo"}
            </div>
            <p style={styles.briefReason}>{plan.reason}</p>

            <div style={styles.briefStats}>
              <div style={styles.briefStat}><strong>{plan.dueCount}</strong><span>vencidos</span></div>
              <div style={styles.briefStat}><strong>{plan.newCount}</strong><span>novos</span></div>
              <div style={styles.briefStat}><strong>{Math.round(plan.accuracy * 100)}%</strong><span>precisão</span></div>
            </div>

            {(plan.patterns.toneConfusion || plan.patterns.weakRadicals.length > 0) && (
              <div style={styles.anchorBox}>
                <div style={styles.anchorLabel}>PADRÃO FRACO ATIVO</div>
                <div style={styles.anchorText}>
                  {plan.patterns.toneConfusion && (
                    <div>• Você confunde <strong>tom {plan.patterns.toneConfusion.from}</strong> com <strong>tom {plan.patterns.toneConfusion.to}</strong> ({plan.patterns.toneConfusion.count}×). O Sifu vai intercalar esses cartões.</div>
                  )}
                  {plan.patterns.weakRadicals.slice(0, 2).map((w) => (
                    <div key={w.radical}>• Radical <strong>{w.radical}</strong>: {w.wrong} erros em {w.total} encontros — priorizado hoje.</div>
                  ))}
                </div>
              </div>
            )}

            <button style={styles.revealBtn} onClick={startSession}>
              Começar treino ({queue.length || plan.queue.length} cartas)
            </button>
          </div>
        )}

        {/* ---------- SESSÃO ---------- */}
        {loaded && mode === "session" && card && (
          <div style={styles.sessionWrap}>
            <div style={styles.progressLine}>
              {current + 1} / {queue.length} nesta sessão
            </div>

            <div style={styles.card}>
              <div style={styles.hanWrap}>
                <span style={{ ...styles.han, color: toneColor(card.tone) }}>{card.han}</span>
                {card.tone > 0 && (
                  <span style={{ ...styles.toneDot, background: toneColor(card.tone) }}>
                    tom {card.tone}
                  </span>
                )}
                {card.generated && <span style={styles.genBadge}>frase do Sifu</span>}
              </div>
              <div style={styles.pinyin}>{card.pinyin}</div>

              {!revealed ? (
                <button style={styles.revealBtn} onClick={() => setRevealed(true)}>
                  Revelar significado e âncora
                </button>
              ) : (
                <div style={styles.revealArea}>
                  <div style={styles.meaning}>{card.meaning}</div>
                  {card.radicals.length > 0 && (
                    <div style={styles.radicalsRow}>
                      {card.radicals.map((r, i) => (
                        <span key={i} style={styles.radicalChip}>{r}</span>
                      ))}
                    </div>
                  )}
                  <div style={styles.anchorBox}>
                    <div style={styles.anchorLabel}>ÂNCORA</div>
                    <div style={styles.anchorText}>{card.anchor}</div>
                  </div>

                  {/* Estado 1: botões normais */}
                  {!tagging && (
                    <div style={styles.answerRow}>
                      <button style={{ ...styles.answerBtn, ...styles.answerNo }} onClick={openTagging}>
                        Ainda travei
                      </button>
                      <button style={{ ...styles.answerBtn, ...styles.answerYes }} onClick={answerKnew}>
                        Já domino
                      </button>
                    </div>
                  )}

                  {/* Estado 2: onde travou? */}
                  {tagging && !awaitTone && (
                    <div style={styles.tagWrap}>
                      <div style={styles.tagPrompt}>Onde travou? <span style={styles.tagHint}>(ajuda o Sifu a te priorizar)</span></div>
                      <div style={styles.tagRow}>
                        <button style={styles.tagBtn} onClick={() => chooseErrorType("tone")}>Tom</button>
                        <button style={styles.tagBtn} onClick={() => chooseErrorType("radical")}>Radical / traços</button>
                        <button style={styles.tagBtn} onClick={() => chooseErrorType("meaning")}>Significado</button>
                      </div>
                      <button style={styles.skipTag} onClick={skipTag}>Só travei, não sei dizer →</button>
                    </div>
                  )}

                  {/* Estado 3: qual tom você achou? */}
                  {tagging && awaitTone && (
                    <div style={styles.tagWrap}>
                      <div style={styles.tagPrompt}>Qual tom você achou que era?</div>
                      <div style={styles.tagRow}>
                        {[1, 2, 3, 4].map((t) => (
                          <button
                            key={t}
                            style={{ ...styles.tagBtn, borderColor: toneColor(t), color: toneColor(t) }}
                            onClick={() => chooseToneGuess(t)}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <button style={styles.skipTag} onClick={skipTag}>Não sei →</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- RELATÓRIO ---------- */}
        {loaded && mode === "complete" && report && (
          <div style={styles.completeCard}>
            <div style={styles.completeTitle}>Relatório do Sifu</div>
            <div style={styles.completeStats}>
              <div><strong>{sessionResults.acertos}</strong> dominados</div>
              <div><strong>{sessionResults.erros}</strong> pra revisar</div>
            </div>

            <div style={styles.reportRow}>
              <div style={styles.reportLabel}>PONTO FRACO DE HOJE</div>
              <div style={styles.reportValue}>{report.weakPoint}</div>
            </div>
            <div style={styles.reportRow}>
              <div style={styles.reportLabel}>PRIORIDADE DE AMANHÃ</div>
              <div style={styles.reportValue}>{report.tomorrowPriority}</div>
            </div>
            <div style={styles.reportRow}>
              <div style={styles.reportLabel}>DECK CONSOLIDADO</div>
              <div style={styles.reportValue}>
                {report.consolidatedPct}% ({report.consolidated}/{report.total} caracteres na caixa {CONSOLIDATED_BOX}+)
              </div>
            </div>

            {/* Geração de frases novas */}
            {genState.status === "working" && (
              <div style={styles.genBox}><div style={styles.genTitle}>O Sifu está forjando frases novas…</div></div>
            )}
            {genState.status === "done" && genState.cards.length > 0 && (
              <div style={styles.genBox}>
                <div style={styles.genTitle}>
                  Novas frases desbloqueadas {genState.source === "llm" ? "" : "· do pergaminho"} — já entraram no seu deck:
                </div>
                {genState.cards.map((c) => (
                  <div key={c.id} style={styles.genItem}>
                    <span style={styles.genHan}>{c.han}</span>
                    <span style={styles.genMeaning}>{c.pinyin} — {c.meaning}</span>
                  </div>
                ))}
              </div>
            )}

            <p style={styles.completeNote}>
              Erro aqui não é falha — é 吃苦 (comer amargo): o caractere só volta mais forte na próxima rodada.
            </p>
            <button style={styles.revealBtn} onClick={beginBriefing}>Ver plano da próxima sessão</button>
          </div>
        )}
        </>)}

        {view === "dojo" && (
          <footer style={styles.footer}>
            O Sifu decide sozinho o que priorizar: lê seu histórico de erros (tom, radical, significado), agenda por repetição espaçada (1 → 3 → 7 → 16 → 35 dias) e forja frases novas quando você consolida um grupo. Cada erro zera a caixa, sem culpa.
          </footer>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1A1612",
    color: "#F5EFE6",
    fontFamily: "'Georgia', 'Songti SC', serif",
    padding: "24px 16px 48px",
    boxSizing: "border-box",
  },
  container: { maxWidth: 480, margin: "0 auto" },
  header: { textAlign: "center", marginBottom: 20 },
  eyebrow: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 11,
    letterSpacing: "2.5px",
    color: "#C9A227",
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    margin: "0 0 8px",
    fontWeight: 700,
    color: "#F2C230",
    letterSpacing: "0.5px",
  },
  subtitle: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 13.5,
    color: "#C9BFAE",
    lineHeight: 1.5,
    margin: 0,
  },
  tabBar: { display: "flex", gap: 8, marginBottom: 18 },
  tab: {
    flex: 1,
    background: "#221D17",
    color: "#9E9484",
    border: "1px solid #3A3226",
    borderRadius: 999,
    padding: "9px 10px",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: 12.5,
    cursor: "pointer",
  },
  tabActive: { background: "#2A1E22", color: "#F2C230", borderColor: "#5B2C3E" },
  beltBar: { marginBottom: 20 },
  beltTrack: {
    height: 8,
    borderRadius: 4,
    background: "#2A241D",
    overflow: "hidden",
  },
  beltFill: { height: "100%", transition: "width 0.4s ease" },
  beltLabel: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 11.5,
    color: "#9E9484",
    marginTop: 6,
    textAlign: "center",
  },
  errorBanner: {
    background: "#3A2020",
    color: "#E8B4B4",
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: 12.5,
    marginBottom: 14,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  loading: { textAlign: "center", color: "#9E9484", padding: 40 },
  sessionWrap: {},
  progressLine: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 11.5,
    color: "#8A8478",
    textAlign: "right",
    marginBottom: 8,
  },
  card: {
    background: "#221D17",
    border: "1px solid #3A3226",
    borderRadius: 14,
    padding: "32px 20px",
    textAlign: "center",
  },
  // Briefing
  briefEyebrow: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 10.5,
    letterSpacing: "1.8px",
    color: "#C9A227",
    marginBottom: 10,
  },
  briefMode: { fontSize: 24, color: "#F2C230", fontWeight: 700, marginBottom: 10 },
  briefReason: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 13.5,
    color: "#C9BFAE",
    lineHeight: 1.5,
    marginBottom: 18,
  },
  briefStats: { display: "flex", justifyContent: "center", gap: 22, marginBottom: 18 },
  briefStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  hanWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 6 },
  han: { fontSize: 72, lineHeight: 1, fontWeight: 700 },
  toneDot: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 10.5,
    color: "#1A1612",
    padding: "2px 10px",
    borderRadius: 20,
    fontWeight: 700,
  },
  genBadge: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 9.5,
    letterSpacing: "1px",
    color: "#C97A8C",
    border: "1px solid #5B2C3E",
    borderRadius: 20,
    padding: "2px 8px",
    textTransform: "uppercase",
  },
  pinyin: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 17,
    color: "#C9BFAE",
    marginBottom: 22,
  },
  revealBtn: {
    background: "#F2C230",
    color: "#1A1612",
    border: "none",
    borderRadius: 999,
    padding: "12px 24px",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
  },
  revealArea: { textAlign: "left" },
  meaning: {
    fontSize: 19,
    color: "#F5EFE6",
    textAlign: "center",
    marginBottom: 14,
    fontWeight: 600,
  },
  radicalsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 18,
  },
  radicalChip: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 11.5,
    background: "#2A241D",
    color: "#C9A227",
    padding: "5px 10px",
    borderRadius: 8,
    border: "1px solid #3A3226",
  },
  anchorBox: {
    background: "#2A1E22",
    border: "1px solid #5B2C3E",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 20,
  },
  anchorLabel: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 10,
    letterSpacing: "1.5px",
    color: "#C97A8C",
    marginBottom: 6,
    fontWeight: 700,
  },
  anchorText: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 13.5,
    color: "#E8D5DA",
    lineHeight: 1.5,
  },
  answerRow: { display: "flex", gap: 10 },
  answerBtn: {
    flex: 1,
    border: "none",
    borderRadius: 999,
    padding: "13px 10px",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: 13.5,
    cursor: "pointer",
  },
  answerNo: { background: "#3A2020", color: "#E8B4B4" },
  answerYes: { background: "#2F5233", color: "#D9EFDA" },
  // Tagging de erro
  tagWrap: { marginTop: 4 },
  tagPrompt: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 13,
    color: "#E8B4B4",
    marginBottom: 10,
    textAlign: "center",
  },
  tagHint: { color: "#8A8478", fontSize: 11 },
  tagRow: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 10 },
  tagBtn: {
    flex: 1,
    minWidth: 64,
    background: "#2A241D",
    color: "#E8D5DA",
    border: "1px solid #5B2C3E",
    borderRadius: 999,
    padding: "10px 8px",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  skipTag: {
    background: "none",
    border: "none",
    color: "#8A8478",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 12,
    cursor: "pointer",
    width: "100%",
    padding: "4px 0",
  },
  completeCard: {
    background: "#221D17",
    border: "1px solid #3A3226",
    borderRadius: 14,
    padding: "32px 20px",
    textAlign: "center",
  },
  completeTitle: { fontSize: 22, color: "#F2C230", fontWeight: 700, marginBottom: 14 },
  completeStats: {
    display: "flex",
    justifyContent: "center",
    gap: 24,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    color: "#F5EFE6",
    marginBottom: 18,
  },
  reportRow: { textAlign: "left", marginBottom: 14 },
  reportLabel: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 10,
    letterSpacing: "1.5px",
    color: "#C9A227",
    marginBottom: 4,
    fontWeight: 700,
  },
  reportValue: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    color: "#F5EFE6",
    lineHeight: 1.5,
  },
  genBox: {
    background: "#2A1E22",
    border: "1px solid #5B2C3E",
    borderRadius: 10,
    padding: "14px",
    margin: "18px 0",
    textAlign: "left",
  },
  genTitle: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 12.5,
    color: "#C97A8C",
    fontWeight: 700,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  genItem: { display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 },
  genHan: { fontSize: 22, color: "#F2C230", fontWeight: 700 },
  genMeaning: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 12.5,
    color: "#E8D5DA",
  },
  completeNote: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 12.5,
    color: "#9E9484",
    marginBottom: 20,
    lineHeight: 1.5,
  },
  footer: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: 11,
    color: "#6E6858",
    textAlign: "center",
    marginTop: 26,
    lineHeight: 1.6,
  },
};
