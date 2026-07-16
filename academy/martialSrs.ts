// =====================================================================
//  SRS do Deck Marcial — repetição espaçada (Leitner) sobre MARTIAL_VOCAB
// ---------------------------------------------------------------------
//  Lógica pura + helpers de localStorage. Espelha o SRS do dojo geral,
//  mas sobre o vocabulário marcial (posturas, golpes, virtude...).
//  Persistência remota opcional via cultivationSync.recordMartialReview.
// =====================================================================

import type { MartialTerm } from "./types";
import { MARTIAL_VOCAB } from "./martialVocab";

export const MARTIAL_BOX_INTERVALS = [0, 1, 3, 7, 16, 35]; // dias por caixa
const MAX_BOX = MARTIAL_BOX_INTERVALS.length - 1;
export const MARTIAL_SRS_KEY = "matsuri-martial-srs-v1";

export interface MartialProgress {
  box: number;
  lastSeen: string | null; // YYYY-MM-DD
  streak: number;
  correct: number;
  wrong: number;
}
export type MartialProgressMap = Record<string, MartialProgress>;

/** Patch pronto para cultivationSync.recordMartialReview. */
export interface MartialReviewOutcome {
  map: MartialProgressMap;
  patch: { box: number; streak: number; correct: boolean; nextReviewAt: string };
}

const DAY = 86400000;
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((+new Date(b) - +new Date(a)) / DAY);

export function emptyMartialProgress(): MartialProgress {
  return { box: 0, lastSeen: null, streak: 0, correct: 0, wrong: 0 };
}

export function freshMartialProgress(): MartialProgressMap {
  const map: MartialProgressMap = {};
  MARTIAL_VOCAB.forEach((t) => { map[t.id] = emptyMartialProgress(); });
  return map;
}

export function intervalForBox(box: number): number {
  return MARTIAL_BOX_INTERVALS[Math.min(box, MAX_BOX)];
}

export function isMartialDue(p: MartialProgress | undefined, now: string = todayStr()): boolean {
  if (!p || !p.lastSeen) return true; // nunca visto = vencido
  return daysBetween(p.lastSeen, now) >= intervalForBox(p.box);
}

/** Termos vencidos hoje (embaralhados para a sessão). */
export function dueMartialTerms(map: MartialProgressMap, now: string = todayStr()): MartialTerm[] {
  const due = MARTIAL_VOCAB.filter((t) => isMartialDue(map[t.id], now));
  const pool = due.length ? due : MARTIAL_VOCAB;
  return [...pool].sort(() => Math.random() - 0.5);
}

/** Aplica uma resposta e devolve novo mapa + patch para persistência remota. */
export function reviewMartialTerm(
  map: MartialProgressMap,
  termId: string,
  correct: boolean,
  now: string = todayStr(),
): MartialReviewOutcome {
  const p = map[termId] || emptyMartialProgress();
  const box = correct ? Math.min(p.box + 1, MAX_BOX) : 0;
  const streak = correct ? p.streak + 1 : 0;
  const next: MartialProgress = {
    box,
    lastSeen: now,
    streak,
    correct: p.correct + (correct ? 1 : 0),
    wrong: p.wrong + (correct ? 0 : 1),
  };
  const nextReviewAt = new Date(+new Date(now) + intervalForBox(box) * DAY).toISOString();
  return { map: { ...map, [termId]: next }, patch: { box, streak, correct, nextReviewAt } };
}

/** Quantos termos marciais estão consolidados (caixa >= 4). */
export function martialConsolidated(map: MartialProgressMap): number {
  return MARTIAL_VOCAB.filter((t) => (map[t.id]?.box ?? 0) >= 4).length;
}

// ── localStorage (offline-first; o sync remoto é opcional) ──────────
export function loadMartialProgress(): MartialProgressMap {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(MARTIAL_SRS_KEY) : null;
    if (!raw) return freshMartialProgress();
    return { ...freshMartialProgress(), ...JSON.parse(raw) };
  } catch { return freshMartialProgress(); }
}
export function saveMartialProgress(map: MartialProgressMap): void {
  try { if (typeof localStorage !== "undefined") localStorage.setItem(MARTIAL_SRS_KEY, JSON.stringify(map)); } catch { /* ok */ }
}
