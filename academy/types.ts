// =====================================================================
//  Academia Matsuri (蔡李佛学院) — contratos de tipo compartilhados
// ---------------------------------------------------------------------
//  Estes tipos são o "encaixe" entre os bancos de conteúdo (vocabulário,
//  Formas, Cultivo) e QUALQUER renderizador — tanto a academia 2D
//  single-file (mandarim-dojo.tsx) quanto a futura camada 3D Babylon.
//  Zero dependência de runtime: só tipos. Tudo em tecnologia gratuita.
// =====================================================================

export type Tone = 0 | 1 | 2 | 3 | 4; // 0 = neutro/轻声

/** Uma entrada do banco marcial de vocabulário. */
export interface MartialTerm {
  id: string;
  han: string;
  pinyin: string;
  tone: Tone;              // tom da sílaba tônica principal (para o SRS/tom-drills)
  meaning_pt: string;
  hsk: number;             // 1–6; 0 = fora do HSK (jargão marcial)
  radicals: string[];      // radicais-chave (ex.: "手 (mão)")
  domain: MartialDomain;   // agrupador temático
  anchor: string;          // âncora mnemônica no estilo Choy Lay Fut / C-pop
  usedInForms?: string[];  // ids de Formas que usam este termo
}

export type MartialDomain =
  | "postura"     // 马步, 弓步...
  | "golpe"       // 拳, 掌, 桥手...
  | "corpo"       // partes do corpo, respiração
  | "virtude"     // 武德, 礼, 恒心 — ética marcial
  | "comando"     // ordens do Sifu no pátio
  | "numero";     // contagem para ritmar a Forma

/** Um movimento único dentro de uma Forma (Taolu). */
export interface FormMove {
  index: number;
  han: string;            // nome do movimento em chinês
  pinyin: string;
  meaning_pt: string;
  breath: "吸" | "呼" | "-"; // inspira / expira / neutro — ritmo de respiração
  count: number;          // tempo/contagem da sequência (1..n)
  cue_pt: string;         // instrução curta ("baixe o centro de gravidade")
  vocabRefs: string[];    // ids do banco marcial reforçados neste movimento
}

/** Uma Forma completa (套路). */
export interface KungFuForm {
  id: string;
  han: string;
  pinyin: string;
  meaning_pt: string;
  style: string;          // ex.: "Choy Lay Fut (蔡李佛)"
  difficulty: 1 | 2 | 3;
  moves: FormMove[];
  /** IMPORTANTE: a fidelidade coreográfica é validação da Amanda (Camada 3). */
  choreographyVerified: boolean;
}

/** Um estágio dentro de um Reino de Cultivo. */
export interface CultivationStage {
  id: string;
  order: number;
  han: string;
  pinyin: string;
  name_pt: string;
  xpRequired: number;     // XP acumulado para ENTRAR neste estágio
  blurb_pt: string;
}

/** Um Reino de Cultivo (境界). */
export interface CultivationRealm {
  id: string;
  order: number;
  han: string;
  pinyin: string;
  name_pt: string;
  stages: CultivationStage[];
}

/** Fonte de XP — treino físico real, vocabulário, Forma, streak. */
export type XpSource = "vocab" | "forma" | "treino_fisico" | "streak" | "sifu";

export interface XpEvent {
  source: XpSource;
  amount: number;
  ts: string;             // ISO
  note?: string;
}

/** Resultado da avaliação do Sifu híbrido (motor de regras, sem GPT pago). */
export interface SifuVerdict {
  ok: boolean;
  line_zh: string;        // fala do Sifu em chinês
  line_pt: string;        // tradução/comentário em português
  corrections: string[];  // apontamentos objetivos (tom, gramática)
}
