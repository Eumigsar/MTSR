// =====================================================================
//  Suíte de testes da Academia — executável, sem framework.
// ---------------------------------------------------------------------
//  Bundla os módulos TS com esbuild e roda asserts com node puro.
//  Uso:  node academy/tests.mjs
//  (esbuild já é dependência transitiva do Vite; nada novo a instalar.)
// =====================================================================
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "academy-tests-"));
const out = join(dir, "academy.mjs");
execFileSync("npx", [
  "esbuild", "academy/index.ts", "--bundle", "--format=esm",
  "--external:react", "--external:@supabase/supabase-js", `--outfile=${out}`,
], { stdio: ["ignore", "ignore", "inherit"] });

// martialSrs usa localStorage (guardado por try/catch) — não é tocado aqui.
const A = await import(pathToFileURL(out).href);

let pass = 0, fail = 0;
const t = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? "✓" : "✗ FAIL") + " " + name); };

// ---- Vocab ----
t("vocab: 25 termos", A.MARTIAL_VOCAB.length === 25);
t("vocab: domínio postura = 3", A.vocabByDomain("postura").length === 3);

// ---- Forma ----
t("forma: 12 movimentos", A.MEI_HUA_QUAN.moves.length === 12);
t("forma: abre 预备 / fecha 收势", A.MEI_HUA_QUAN.moves[0].han === "预备" && A.MEI_HUA_QUAN.moves.at(-1).han === "收势");
t("forma: choreographyVerified=false", A.MEI_HUA_QUAN.choreographyVerified === false);
t("forma: XP conclusão = 96", A.formCompletionXp(A.MEI_HUA_QUAN) === 96);

// ---- Cultivo ----
t("cultivo: 5 estágios", A.FOUNDATION_REALM.stages.length === 5);
t("cultivo: xp 0 => 凝气", A.stageForXp(0).han === "凝气");
t("cultivo: xp 700 => 固元 (f4)", A.stageForXp(700).han === "固元");
t("cultivo: stageAdvanced 110->130 sobe", A.stageAdvanced(110, 130)?.han === "筑基");
t("cultivo: stageAdvanced 0->50 null", A.stageAdvanced(0, 50) === null);
t("cultivo: cultivationRowFor(2000) => f5", A.cultivationRowFor(2000).stage_id === "f5");

// ---- Sifu ----
t("sifu: tom certo ok", A.checkTone(3, 3).ok === true);
t("sifu: tom 3 vs 2 explica AFUNDA", (() => { const v = A.checkTone(3, 2); return !v.ok && /AFUNDA/.test(v.corrections[0]); })());
t("sifu: 我是好 corrige (usar 很)", A.checkGrammar({ input: "我是好", intent: "afirmar_adjetivo" }).corrections.length > 0);
t("sifu: 不有 corrige (usar 没有)", A.checkGrammar({ input: "我不有钱", intent: "negar_ter" }).corrections.some((c) => /没有/.test(c)));

// ---- Sync (no-op seguro) ----
const s = A.createCultivationSync(null, null);
t("sync: desabilitado sem client", s.enabled === false);
t("sync: recordXp no-op resolve ok:false", (await s.recordXp("forma", 96)).ok === false);

// ---- SRS Marcial ----
const fresh = A.freshMartialProgress();
t("srs marcial: mapa inicial cobre 25 termos", Object.keys(fresh).length === 25);
t("srs marcial: termo novo é due", A.isMartialDue(fresh["mabu"]) === true);
const r1 = A.reviewMartialTerm(fresh, "mabu", true);
t("srs marcial: acerto sobe caixa 0->1", r1.map["mabu"].box === 1);
t("srs marcial: patch tem nextReviewAt ISO", /\d{4}-\d\d-\d\dT/.test(r1.patch.nextReviewAt));
const r2 = A.reviewMartialTerm(r1.map, "mabu", false);
t("srs marcial: erro zera a caixa", r2.map["mabu"].box === 0 && r2.map["mabu"].wrong === 1);
t("srs marcial: consolidados começa em 0", A.martialConsolidated(fresh) === 0);

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
