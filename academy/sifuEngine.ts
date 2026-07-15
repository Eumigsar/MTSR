// =====================================================================
//  Sifu Virtual — motor híbrido (diálogo roteirizado + regras)
// ---------------------------------------------------------------------
//  100% offline e gratuito: NÃO chama GPT/LLM pago. Combina falas
//  roteirizadas com um verificador de regras de tom e de gramática
//  básica. Determinístico e testável.
// =====================================================================

import type { SifuVerdict, Tone } from "./types";

// Falas roteirizadas do Sifu — escolhidas de forma determinística (rotação),
// para variar sem depender de aleatoriedade ou de rede.
const PRAISE = [
  { zh: "很好！稳如泰山。", pt: "Muito bem! Firme como o Monte Tai." },
  { zh: "对了，气沉下去了。", pt: "Isso — o qi assentou." },
  { zh: "好功夫，继续。", pt: "Bom kung fu. Continue." },
];

const ENCOURAGE = [
  { zh: "不要急，再来一次。", pt: "Sem pressa — de novo." },
  { zh: "错是吃苦，苦后有功。", pt: "Errar é comer amargo; do amargo vem a força." },
  { zh: "呼吸，重心放低。", pt: "Respire, baixe o centro de gravidade." },
];

function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

const TONE_NAME: Record<Tone, string> = {
  0: "neutro (轻声)",
  1: "1 — alto e plano",
  2: "2 — subindo",
  3: "3 — desce-e-sobe",
  4: "4 — caindo",
};

/**
 * Avalia o palpite de tom do aluno. `seed` (ex.: nº de tentativas) dá
 * variação determinística nas falas do Sifu.
 */
export function checkTone(expected: Tone, answered: Tone, seed = 0): SifuVerdict {
  if (expected === answered) {
    const p = pick(PRAISE, seed);
    return { ok: true, line_zh: p.zh, line_pt: p.pt, corrections: [] };
  }
  const e = pick(ENCOURAGE, seed);
  const hint =
    (expected === 3 && answered === 2) || (expected === 2 && answered === 3)
      ? "Tom 2 sobe direto; tom 3 primeiro AFUNDA e depois sobe — é a confusão mais comum."
      : `Você disse tom ${answered} (${TONE_NAME[answered]}); o correto é tom ${expected} (${TONE_NAME[expected]}).`;
  return { ok: false, line_zh: e.zh, line_pt: e.pt, corrections: [hint] };
}

/** Regras de gramática básica que o Sifu sabe checar sem IA. */
export interface GrammarCheck {
  input: string;      // frase montada pelo aluno (hanzi)
  intent: "afirmar_adjetivo" | "negar_ser" | "negar_ter" | "livre";
}

/**
 * Verificador de gramática por regras. Cobre os erros mais frequentes de
 * iniciante; retorna correções objetivas, não uma "conversa" com IA.
 */
export function checkGrammar(check: GrammarCheck, seed = 0): SifuVerdict {
  const s = check.input.replace(/\s+/g, "");
  const corrections: string[] = [];

  switch (check.intent) {
    case "afirmar_adjetivo":
      // 我是高 ✗  → adjetivo predicativo usa 很, não 是.
      if (/是[高大好小忙累冷热]/.test(s) || /^我是很/.test(s)) {
        corrections.push("Adjetivo não leva 是. Use 很: 我很好 (não 我是好).");
      }
      break;
    case "negar_ser":
      // negar 是 → 不是; usar 没是 é erro.
      if (s.includes("没是")) corrections.push("Para negar 是, use 不是 — nunca 没是.");
      if (!s.includes("不是") && s.includes("是")) corrections.push("Faltou o 不 antes de 是 para negar.");
      break;
    case "negar_ter":
      // negar 有 → 没有; 不有 é erro clássico.
      if (s.includes("不有")) corrections.push("有 se nega com 没: 没有 — nunca 不有.");
      break;
    case "livre":
    default:
      break;
  }

  if (corrections.length === 0) {
    const p = pick(PRAISE, seed);
    return { ok: true, line_zh: p.zh, line_pt: p.pt, corrections: [] };
  }
  const e = pick(ENCOURAGE, seed);
  return { ok: false, line_zh: e.zh, line_pt: e.pt, corrections };
}

/** Saudação/instrução roteirizada para abrir uma sessão no Pátio. */
export function sifuGreeting(stageName_pt: string): SifuVerdict {
  return {
    ok: true,
    line_zh: "来，站好。今天我们练梅花拳。",
    line_pt: `Venha, posicione-se. Hoje treinamos 梅花拳. (Estágio: ${stageName_pt})`,
    corrections: [],
  };
}
