// =====================================================================
//  Camada 3D (Babylon) da Academia — ponto de entrada
// =====================================================================

export { MASTERS, masterById } from "./characterData";
export type { CharacterSpec, Palette, SpeechLine, Silhouette, HatType, HeldObject } from "./characterData";
export { buildCharacter } from "./CharacterFactory";
export { createAcademyScene } from "./AcademyScene";
export type { AcademySceneHandle } from "./AcademyScene";
export { default as GameCanvas } from "./GameCanvas";
