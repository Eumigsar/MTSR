import React, { useMemo, useState } from "react";
import { MEI_HUA_QUAN, formCompletionXp } from "./forms";
import { vocabById } from "./martialVocab";
import { FOUNDATION_REALM, stageForXp, progressToNext, stageAdvanced, XP_TABLE } from "./cultivation";
import { sifuGreeting, checkTone } from "./sifuEngine";
import type { Tone } from "./types";

// =====================================================================
//  Pátio de Treino (练武场) — MVP-1 jogável
// ---------------------------------------------------------------------
//  Componente React PORTÁTIL na identidade da academia 2D (preto/dourado/
//  vinho). Junta: saudação do Sifu, sequência jogável da Forma 梅花拳,
//  drill de tom, e a barra de Cultivo (Reino 1 — Fundação).
//
//  Persistência: por padrão usa localStorage (grátis, offline). Pode ser
//  sobrescrita via props para plugar no Supabase/Pocketbase depois.
// =====================================================================

const PATIO_KEY = "matsuri-patio-xp-v1";

function loadXp(): number {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(PATIO_KEY) : null;
    return raw ? Number(raw) || 0 : 0;
  } catch { return 0; }
}
function saveXp(xp: number) {
  try { if (typeof localStorage !== "undefined") localStorage.setItem(PATIO_KEY, String(xp)); } catch { /* ok */ }
}

const TONE_COLOR: Record<Tone, string> = {
  1: "#C9A227", 2: "#7B2D3E", 3: "#2F5233", 4: "#B3401F", 0: "#8A8478",
};

export interface PatioTreinoProps {
  initialXp?: number;
  onXpChange?: (xp: number) => void; // hook para persistir em Supabase/Pocketbase
}

export default function PatioTreino({ initialXp, onXpChange }: PatioTreinoProps) {
  const [xp, setXp] = useState<number>(() => initialXp ?? loadXp());
  const [moveIdx, setMoveIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [advancedTo, setAdvancedTo] = useState<string | null>(null);
  const [toneDrill, setToneDrill] = useState<{ verdict: string; ok: boolean } | null>(null);

  const form = MEI_HUA_QUAN;
  const move = form.moves[moveIdx];
  const stage = useMemo(() => stageForXp(xp, FOUNDATION_REALM), [xp]);
  const prog = useMemo(() => progressToNext(xp, FOUNDATION_REALM), [xp]);
  const greeting = useMemo(() => sifuGreeting(stage.name_pt), [stage.name_pt]);

  const grantXp = (amount: number) => {
    const next = xp + amount;
    const climbed = stageAdvanced(xp, next, FOUNDATION_REALM);
    setXp(next);
    saveXp(next);
    onXpChange?.(next);
    if (climbed) setAdvancedTo(`${climbed.han} · ${climbed.name_pt}`);
  };

  const startForm = () => { setStarted(true); setFinished(false); setMoveIdx(0); setAdvancedTo(null); };

  const nextMove = () => {
    if (moveIdx + 1 < form.moves.length) {
      setMoveIdx(moveIdx + 1);
    } else {
      setFinished(true);
      setStarted(false);
      grantXp(formCompletionXp(form)); // Forma completa concede XP de Cultivo
    }
  };
  const prevMove = () => setMoveIdx(Math.max(0, moveIdx - 1));

  // Drill de tom: usa o tom real do primeiro termo do movimento atual.
  const drillTerm = move ? vocabById(move.vocabRefs[0]) : undefined;
  const doToneGuess = (t: Tone) => {
    if (!drillTerm) return;
    const v = checkTone(drillTerm.tone, t, xp);
    setToneDrill({ verdict: `${v.line_zh} — ${v.line_pt}${v.corrections[0] ? " (" + v.corrections[0] + ")" : ""}`, ok: v.ok });
    if (v.ok) grantXp(XP_TABLE.sifu);
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <header style={S.header}>
          <div style={S.eyebrow}>练武场 · PÁTIO DE TREINO</div>
          <h1 style={S.title}>{form.han} <span style={S.titlePinyin}>{form.pinyin}</span></h1>
          <p style={S.subtitle}>{form.meaning_pt} — {form.style}</p>
        </header>

        {/* Barra de Cultivo (Reino 1 — Fundação) */}
        <div style={S.cultivoBar}>
          <div style={S.cultivoTop}>
            <span style={S.cultivoRealm}>{FOUNDATION_REALM.han} {FOUNDATION_REALM.name_pt}</span>
            <span style={S.cultivoStage}>{stage.han} · {stage.name_pt}</span>
          </div>
          <div style={S.track}><div style={{ ...S.fill, width: `${Math.round(prog * 100)}%` }} /></div>
          <div style={S.cultivoXp}>{xp} XP · {stage.blurb_pt}</div>
        </div>

        {advancedTo && <div style={S.levelUp}>境界突破！ Avanço de estágio: <strong>{advancedTo}</strong></div>}

        {/* Fala do Sifu */}
        <div style={S.sifuBox}>
          <div style={S.sifuLabel}>师父 SIFU</div>
          <div style={S.sifuZh}>{greeting.line_zh}</div>
          <div style={S.sifuPt}>{greeting.line_pt}</div>
        </div>

        {/* Estado inicial / concluído */}
        {!started && (
          <div style={S.card}>
            {finished ? (
              <>
                <div style={S.doneTitle}>套路完成 — Forma concluída</div>
                <p style={S.doneNote}>Você percorreu os {form.moves.length} movimentos. +{formCompletionXp(form)} XP de Cultivo. 恒心！</p>
              </>
            ) : (
              <p style={S.doneNote}>Postura pronta? O Sifu conta o tempo: 一、二、三、四. Cada movimento traz o vocabulário marcial que ele reforça.</p>
            )}
            <button style={S.primaryBtn} onClick={startForm}>{finished ? "Repetir a Forma" : "起势 · Iniciar a Forma"}</button>
          </div>
        )}

        {/* Sequência jogável */}
        {started && move && (
          <div style={S.card}>
            <div style={S.moveCount}>时 {move.count} / {form.moves.length - 1}</div>
            <div style={S.moveHanRow}>
              <span style={S.moveHan}>{move.han}</span>
              {move.breath !== "-" && <span style={S.breath}>{move.breath === "吸" ? "吸 inspira" : "呼 expira"}</span>}
            </div>
            <div style={S.movePinyin}>{move.pinyin} — {move.meaning_pt}</div>
            <div style={S.cue}>{move.cue_pt}</div>

            {/* Vocabulário reforçado no movimento */}
            <div style={S.vocabRow}>
              {move.vocabRefs.map((ref) => {
                const term = vocabById(ref);
                if (!term) return null;
                return (
                  <span key={ref} style={{ ...S.vocabChip, borderColor: TONE_COLOR[term.tone] }}>
                    <b style={{ color: TONE_COLOR[term.tone] }}>{term.han}</b> {term.pinyin}
                  </span>
                );
              })}
            </div>

            {/* Drill de tom do termo principal do movimento */}
            {drillTerm && (
              <div style={S.drill}>
                <div style={S.drillPrompt}>Qual o tom de <b>{drillTerm.han}</b> ({drillTerm.pinyin.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "·")})?</div>
                <div style={S.drillRow}>
                  {[1, 2, 3, 4].map((t) => (
                    <button key={t} style={{ ...S.drillBtn, borderColor: TONE_COLOR[t as Tone], color: TONE_COLOR[t as Tone] }} onClick={() => doToneGuess(t as Tone)}>{t}</button>
                  ))}
                </div>
                {toneDrill && <div style={{ ...S.drillVerdict, color: toneDrill.ok ? "#D9EFDA" : "#E8B4B4" }}>{toneDrill.verdict}</div>}
              </div>
            )}

            <div style={S.navRow}>
              <button style={S.ghostBtn} onClick={prevMove} disabled={moveIdx === 0}>← anterior</button>
              <button style={S.primaryBtn} onClick={nextMove}>{moveIdx + 1 < form.moves.length ? "próximo →" : "收势 · Encerrar"}</button>
            </div>
          </div>
        )}

        {!form.choreographyVerified && (
          <div style={S.warn}>⚠️ Coreografia ainda não validada por praticante de Choy Lay Fut (playtest da Amanda — ver PENDENTE-AMANDA.md).</div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#1A1612", color: "#F5EFE6", fontFamily: "'Georgia', 'Songti SC', serif", padding: "24px 16px 48px", boxSizing: "border-box" },
  container: { maxWidth: 480, margin: "0 auto" },
  header: { textAlign: "center", marginBottom: 18 },
  eyebrow: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 11, letterSpacing: "2.5px", color: "#C9A227", marginBottom: 8 },
  title: { fontSize: 32, margin: "0 0 6px", fontWeight: 700, color: "#F2C230" },
  titlePinyin: { fontSize: 16, color: "#C9BFAE", fontFamily: "'Helvetica Neue', Arial, sans-serif" },
  subtitle: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 13, color: "#C9BFAE", margin: 0 },
  cultivoBar: { background: "#221D17", border: "1px solid #3A3226", borderRadius: 12, padding: "12px 14px", marginBottom: 14 },
  cultivoTop: { display: "flex", justifyContent: "space-between", fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12, marginBottom: 8 },
  cultivoRealm: { color: "#9E9484" },
  cultivoStage: { color: "#F2C230", fontWeight: 700 },
  track: { height: 8, borderRadius: 4, background: "#2A241D", overflow: "hidden" },
  fill: { height: "100%", background: "#C9A227", transition: "width 0.4s ease" },
  cultivoXp: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 11, color: "#8A8478", marginTop: 6, lineHeight: 1.4 },
  levelUp: { background: "#2A1E22", border: "1px solid #5B2C3E", color: "#F2C230", borderRadius: 8, padding: "8px 12px", fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 13, textAlign: "center", marginBottom: 14 },
  sifuBox: { background: "#2A1E22", border: "1px solid #5B2C3E", borderRadius: 10, padding: "12px 14px", marginBottom: 14 },
  sifuLabel: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 10, letterSpacing: "1.5px", color: "#C97A8C", marginBottom: 6, fontWeight: 700 },
  sifuZh: { fontSize: 18, color: "#F5EFE6", marginBottom: 2 },
  sifuPt: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12.5, color: "#E8D5DA" },
  card: { background: "#221D17", border: "1px solid #3A3226", borderRadius: 14, padding: "24px 20px", textAlign: "center", marginBottom: 14 },
  moveCount: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12, color: "#8A8478", marginBottom: 8 },
  moveHanRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 6 },
  moveHan: { fontSize: 46, fontWeight: 700, color: "#F2C230", lineHeight: 1.1 },
  breath: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 11, color: "#1A1612", background: "#C9A227", padding: "2px 10px", borderRadius: 20, fontWeight: 700 },
  movePinyin: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 15, color: "#C9BFAE", marginBottom: 12 },
  cue: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 13.5, color: "#E8D5DA", lineHeight: 1.5, marginBottom: 16 },
  vocabRow: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 },
  vocabChip: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12, background: "#2A241D", padding: "5px 10px", borderRadius: 8, border: "1px solid #3A3226" },
  drill: { background: "#1F1A15", border: "1px solid #3A3226", borderRadius: 10, padding: "12px", marginBottom: 16 },
  drillPrompt: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 13, color: "#C9BFAE", marginBottom: 10 },
  drillRow: { display: "flex", gap: 8, justifyContent: "center" },
  drillBtn: { width: 48, height: 44, background: "#2A241D", border: "2px solid", borderRadius: 10, fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: 16, cursor: "pointer" },
  drillVerdict: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12.5, marginTop: 10, lineHeight: 1.5 },
  navRow: { display: "flex", gap: 10 },
  primaryBtn: { flex: 1, background: "#F2C230", color: "#1A1612", border: "none", borderRadius: 999, padding: "12px 20px", fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  ghostBtn: { flex: 1, background: "#2A241D", color: "#C9BFAE", border: "1px solid #3A3226", borderRadius: 999, padding: "12px 20px", fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  doneTitle: { fontSize: 20, color: "#F2C230", fontWeight: 700, marginBottom: 10 },
  doneNote: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 13, color: "#C9BFAE", lineHeight: 1.5, marginBottom: 16 },
  warn: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 11, color: "#C9A227", background: "#2A241D", border: "1px solid #3A3226", borderRadius: 8, padding: "8px 12px", lineHeight: 1.5, textAlign: "center" },
};
