// =====================================================================
//  Camada 3D (Babylon) — especificação dos 6 mestres procedurais
// ---------------------------------------------------------------------
//  Dados puros consumidos por CharacterFactory.ts. Nenhum asset externo:
//  cada mestre é montado com primitivas coloridas (política "procedural",
//  tecnologia gratuita). `spriteRef` mantém continuidade com o NPC 2D
//  equivalente já existente no MATSU-RI.
// =====================================================================

export type Silhouette = "tall" | "broad" | "slender" | "stooped" | "round" | "small";
export type HatType = "scholar" | "conical" | "daoist" | "kerchief" | "cap" | "none";
export type HeldObject = "book" | "fan" | "flywhisk" | "cane" | "coin" | "none";

export interface Palette {
  robe: string; // cor principal do manto
  trim: string; // cor de detalhe/acabamento
  skin: string; // tom de pele
}

export interface SpeechLine {
  zh: string;
  pt: string;
}

export interface CharacterSpec {
  id: string;
  han: string;
  pinyin: string;
  name_pt: string;
  role_pt: string;
  palette: Palette;
  silhouette: Silhouette;
  hat: HatType;
  object: HeldObject;
  /** Registro de fala próprio — usado por diálogos e pelo Sifu híbrido. */
  speech: SpeechLine[];
  /** NPC 2D correspondente no MATSU-RI (public/assets/*_walk.png). */
  spriteRef?: string;
}

export const MASTERS: CharacterSpec[] = [
  {
    id: "wenbo",
    han: "文博",
    pinyin: "Wén Bó",
    name_pt: "Wen Bo, o Letrado",
    role_pt: "Mestre da caligrafia e dos radicais",
    palette: { robe: "#274060", trim: "#C9A227", skin: "#E7C6A5" },
    silhouette: "slender",
    hat: "scholar",
    object: "book",
    speech: [
      { zh: "一笔一画，皆有其理。", pt: "Cada traço, cada pincelada, tem sua razão." },
      { zh: "先识其形，再明其义。", pt: "Primeiro reconheça a forma; depois, entenda o sentido." },
    ],
    spriteRef: "wen_bo_walk",
  },
  {
    id: "hualan",
    han: "花岚",
    pinyin: "Huā Lán",
    name_pt: "Hua Lan, a Poeta",
    role_pt: "Mestra dos tons e da musicalidade",
    palette: { robe: "#2F6E5B", trim: "#E8A0B0", skin: "#EBC9A8" },
    silhouette: "slender",
    hat: "kerchief",
    object: "fan",
    speech: [
      { zh: "声调如歌，起伏有情。", pt: "Os tons são canção — sobem e descem com emoção." },
      { zh: "三声下沉，再上扬。", pt: "O terceiro tom afunda, depois sobe de novo." },
    ],
    spriteRef: "hua_lan_walk",
  },
  {
    id: "yundaozhang",
    han: "云道长",
    pinyin: "Yún Dàozhǎng",
    name_pt: "Yun, o Mestre Daoísta",
    role_pt: "Guardião do Cultivo (气) e da respiração",
    palette: { robe: "#8A8478", trim: "#EDE7DA", skin: "#E2C4A2" },
    silhouette: "tall",
    hat: "daoist",
    object: "flywhisk",
    speech: [
      { zh: "气沉丹田，心自静。", pt: "O qi assenta no dan tian; a mente se aquieta sozinha." },
      { zh: "无为而无不为。", pt: "Não force nada, e nada ficará por fazer." },
    ],
  },
  {
    id: "popo",
    han: "婆婆",
    pinyin: "Pópo",
    name_pt: "Vovó Zhang",
    role_pt: "Mestra do vocabulário do dia a dia",
    palette: { robe: "#7B3F2E", trim: "#C97A2A", skin: "#E4BE9A" },
    silhouette: "stooped",
    hat: "kerchief",
    object: "cane",
    speech: [
      { zh: "吃了吗？坐下歇歇。", pt: "Já comeu? Senta e descansa um pouco." },
      { zh: "慢慢来，功夫是时间。", pt: "Devagar — kung fu é tempo." },
    ],
    spriteRef: "grandma_zhang_walk",
  },
  {
    id: "jincai",
    han: "金财",
    pinyin: "Jīn Cái",
    name_pt: "Jin Cai, o Mercador",
    role_pt: "Mestre dos números e das trocas",
    palette: { robe: "#8C1C2B", trim: "#F2C230", skin: "#E7C098" },
    silhouette: "broad",
    hat: "cap",
    object: "coin",
    speech: [
      { zh: "一二三，数清楚才不吃亏！", pt: "Um, dois, três — conte direito pra não sair no prejuízo!" },
      { zh: "买卖公道，人心自来。", pt: "Comércio justo atrai as pessoas por si só." },
    ],
  },
  {
    id: "xiaobao",
    han: "小宝",
    pinyin: "Xiǎo Bǎo",
    name_pt: "Pequeno Bao",
    role_pt: "Aprendiz curioso — pratica com você",
    palette: { robe: "#3E7CB1", trim: "#F2C230", skin: "#F0CBA6" },
    silhouette: "small",
    hat: "none",
    object: "none",
    speech: [
      { zh: "这个字怎么念？教教我！", pt: "Como se lê esse caractere? Me ensina!" },
      { zh: "我们一起练拳吧！", pt: "Vamos treinar kung fu juntos!" },
    ],
    spriteRef: "little_wu_walk",
  },
];

export const masterById = (id: string): CharacterSpec | undefined =>
  MASTERS.find((m) => m.id === id);
