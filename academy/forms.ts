// =====================================================================
//  Formas (套路 / Taolu) — MVP-1: 梅花拳 Mei Hua Quan
// ---------------------------------------------------------------------
//  A Forma é DADO, não código: uma sequência de movimentos que qualquer
//  renderizador (2D single-file OU Babylon) transforma em "jogável".
//
//  ⚠️ FIDELIDADE COREOGRÁFICA = CAMADA 3 (playtest da Amanda).
//  Esta é uma primeira passada plausível de 12 movimentos para dar o
//  MECANISMO. `choreographyVerified: false` sinaliza que a coreografia
//  ainda precisa da validação de quem pratica Choy Lay Fut de verdade.
// =====================================================================

import type { KungFuForm, FormMove } from "./types";

const moves: FormMove[] = [
  { index: 0,  han: "预备",   pinyin: "yùbèi",       meaning_pt: "atenção / preparar", breath: "-", count: 0, cue_pt: "Pés juntos, coluna ereta, olhar à frente. Silencie a mente.", vocabRefs: ["yubei", "li"] },
  { index: 1,  han: "起势",   pinyin: "qǐshì",       meaning_pt: "abrir a Forma",        breath: "吸", count: 1, cue_pt: "Levante as mãos inspirando; abra para 马步 (postura do cavalo).", vocabRefs: ["qishi", "mabu", "xi"] },
  { index: 2,  han: "左桥手", pinyin: "zuǒ qiáoshǒu", meaning_pt: "braço-ponte esquerdo", breath: "呼", count: 2, cue_pt: "Antebraço esquerdo desvia em ponte; expire no contato.", vocabRefs: ["qiaoshou", "hu"] },
  { index: 3,  han: "右直拳", pinyin: "yòu zhíquán",  meaning_pt: "soco reto direito",     breath: "呼", count: 3, cue_pt: "Gire a 腰 (cintura); o punho sai da lombar, não do ombro.", vocabRefs: ["quan", "yao", "hu"] },
  { index: 4,  han: "弓步冲拳", pinyin: "gōngbù chōngquán", meaning_pt: "soco em avanço (postura do arco)", breath: "呼", count: 4, cue_pt: "Avance para 弓步 empurrando o soco; peso 60% na perna da frente.", vocabRefs: ["gongbu", "quan"] },
  { index: 5,  han: "左掌", pinyin: "zuǒ zhǎng",     meaning_pt: "palma esquerda",       breath: "呼", count: 5, cue_pt: "Palma corta na horizontal; dedos firmes, base da mão à frente.", vocabRefs: ["zhang"] },
  { index: 6,  han: "虚步捶", pinyin: "xūbù chuí",    meaning_pt: "martelo em postura vazia", breath: "呼", count: 6, cue_pt: "Recue o peso para 虚步; o 捶 desce em arco longo — assinatura de CLF.", vocabRefs: ["xubu", "chuiquan"] },
  { index: 7,  han: "右踢腿", pinyin: "yòu tītuǐ",    meaning_pt: "chute frontal direito", breath: "呼", count: 7, cue_pt: "Chute com 足 (pé) na altura da cintura; recolha rápido para não perder base.", vocabRefs: ["ti"] },
  { index: 8,  han: "马步双桥", pinyin: "mǎbù shuāng qiáo", meaning_pt: "duplo braço-ponte em postura do cavalo", breath: "吸", count: 8, cue_pt: "Volte ao centro em 马步; ambos antebraços em ponte, inspirando.", vocabRefs: ["mabu", "qiaoshou", "xi"] },
  { index: 9,  han: "转身掌", pinyin: "zhuǎnshēn zhǎng", meaning_pt: "palma com giro de corpo", breath: "呼", count: 9, cue_pt: "Gire 180° pela 腰; a palma acompanha o giro, olhar lidera o movimento.", vocabRefs: ["zhang", "yao"] },
  { index: 10, han: "弓步冲拳", pinyin: "gōngbù chōngquán", meaning_pt: "soco em avanço (repetição espelhada)", breath: "呼", count: 10, cue_pt: "Repita o avanço no lado oposto — simetria fecha a sequência.", vocabRefs: ["gongbu", "quan"] },
  { index: 11, han: "收势", pinyin: "shōushì",     meaning_pt: "encerrar a Forma",     breath: "吸", count: 11, cue_pt: "Recolha as mãos ao dan tian, retorne os pés, reverência (礼). 恒心.", vocabRefs: ["shoushi", "li", "hengxin"] },
];

export const MEI_HUA_QUAN: KungFuForm = {
  id: "meihuaquan",
  han: "梅花拳",
  pinyin: "Méihuā Quán",
  meaning_pt: "Punho da Flor de Ameixa",
  style: "Choy Lay Fut (蔡李佛)",
  difficulty: 1,
  moves,
  choreographyVerified: false, // ← aguarda playtest da Amanda (Camada 3)
};

export const FORMS: KungFuForm[] = [MEI_HUA_QUAN];

export const formById = (id: string): KungFuForm | undefined =>
  FORMS.find((f) => f.id === id);

/** XP concedido ao completar a Forma inteira sem pular movimentos. */
export const formCompletionXp = (form: KungFuForm): number =>
  form.moves.length * 8 * form.difficulty;
