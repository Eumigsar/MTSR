// =====================================================================
//  Sistema de Cultivo (修炼) — MVP-1: Reino 1 — Fundação (筑基)
// ---------------------------------------------------------------------
//  Xianxia aplicado ao aprendizado: XP vem de treino físico real,
//  vocabulário dominado, Formas completas e streak. Lógica pura e
//  determinística — testável, sem backend, tecnologia gratuita.
//
//  Roadmap dos Reinos (só o Reino 1 é jogável no MVP-1):
//    1. 筑基  Fundação          ← ESTE
//    2. 金丹  Núcleo Dourado    (futuro)
//    3. 元婴  Ascensão          (futuro)
// =====================================================================

import type { CultivationRealm, CultivationStage, XpEvent } from "./types";

const foundationStages: CultivationStage[] = [
  { id: "f1", order: 1, han: "凝气", pinyin: "níngqì",  name_pt: "Condensar o Qi",       xpRequired: 0,    blurb_pt: "O primeiro sopro consciente. Você sente a respiração (气) mover-se com o corpo." },
  { id: "f2", order: 2, han: "筑基", pinyin: "zhùjī",   name_pt: "Assentar a Fundação",   xpRequired: 120,  blurb_pt: "As posturas viram raiz. 马步 já não treme — a base está assentada." },
  { id: "f3", order: 3, han: "通脉", pinyin: "tōngmài", name_pt: "Abrir os Meridianos",   xpRequired: 320,  blurb_pt: "Respiração e movimento sincronizam. 吸/呼 acompanham cada golpe da Forma." },
  { id: "f4", order: 4, han: "固元", pinyin: "gùyuán",  name_pt: "Firmar a Essência",     xpRequired: 640,  blurb_pt: "A primeira Forma flui inteira. Vocabulário e corpo falam a mesma língua." },
  { id: "f5", order: 5, han: "圆满", pinyin: "yuánmǎn", name_pt: "Plenitude da Fundação", xpRequired: 1100, blurb_pt: "Fundação completa. O portão do Núcleo Dourado (金丹) começa a brilhar." },
];

export const FOUNDATION_REALM: CultivationRealm = {
  id: "foundation",
  order: 1,
  han: "筑基",
  pinyin: "Zhùjī",
  name_pt: "Reino da Fundação",
  stages: foundationStages,
};

export const REALMS: CultivationRealm[] = [FOUNDATION_REALM];

/** XP por fonte — valores base, ajustáveis quando a arquitetura completa chegar. */
export const XP_TABLE = {
  vocab: 5,          // por termo promovido de caixa
  forma: 1,          // multiplicado pela Forma (ver forms.ts)
  treino_fisico: 15, // por sessão de treino físico registrada
  streak: 10,        // por dia consecutivo
  sifu: 3,           // por resposta correta ao Sifu
} as const;

/** Soma total de XP a partir do log de eventos. */
export function totalXp(events: XpEvent[]): number {
  return events.reduce((sum, e) => sum + (e.amount || 0), 0);
}

/** Estágio atual dado um XP acumulado (dentro do Reino da Fundação). */
export function stageForXp(xp: number, realm: CultivationRealm = FOUNDATION_REALM): CultivationStage {
  let current = realm.stages[0];
  for (const s of realm.stages) {
    if (xp >= s.xpRequired) current = s;
    else break;
  }
  return current;
}

/** Progresso [0..1] rumo ao PRÓXIMO estágio (1 se já é o último). */
export function progressToNext(xp: number, realm: CultivationRealm = FOUNDATION_REALM): number {
  const stages = realm.stages;
  const idx = stages.findIndex((s) => s.id === stageForXp(xp, realm).id);
  if (idx >= stages.length - 1) return 1;
  const cur = stages[idx].xpRequired;
  const next = stages[idx + 1].xpRequired;
  return Math.max(0, Math.min(1, (xp - cur) / (next - cur)));
}

/** Verdadeiro se `xp` cruzou o limiar de um novo estágio ao passar de `prevXp`. */
export function stageAdvanced(prevXp: number, xp: number, realm: CultivationRealm = FOUNDATION_REALM): CultivationStage | null {
  const before = stageForXp(prevXp, realm);
  const after = stageForXp(xp, realm);
  return before.id !== after.id ? after : null;
}
