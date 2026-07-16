// =====================================================================
//  Academia Matsuri — ponto de entrada dos módulos de conteúdo/lógica
// ---------------------------------------------------------------------
//  Tudo aqui é portátil: importável tanto pela academia 2D single-file
//  (mandarim-dojo.tsx) quanto pela futura camada 3D Babylon (/game).
// =====================================================================

export * from "./types";
export { MARTIAL_VOCAB, vocabById, vocabByDomain } from "./martialVocab";
export { FORMS, MEI_HUA_QUAN, formById, formCompletionXp } from "./forms";
export {
  REALMS,
  FOUNDATION_REALM,
  XP_TABLE,
  totalXp,
  stageForXp,
  progressToNext,
  stageAdvanced,
} from "./cultivation";
export { checkTone, checkGrammar, sifuGreeting } from "./sifuEngine";
export { createCultivationSync, cultivationRowFor } from "./cultivationSync";
export {
  dueMartialTerms, reviewMartialTerm, isMartialDue, martialConsolidated,
  freshMartialProgress, loadMartialProgress, saveMartialProgress,
  MARTIAL_BOX_INTERVALS,
} from "./martialSrs";
export type { MartialProgress, MartialProgressMap, MartialReviewOutcome } from "./martialSrs";
export type { CultivationSync, SyncResult, MartialReviewPatch } from "./cultivationSync";
