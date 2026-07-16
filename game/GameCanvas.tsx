import { useEffect, useRef, useState } from "react";
import { Engine, Vector3, Matrix } from "@babylonjs/core";
import { createAcademyScene, type AcademySceneHandle } from "./AcademyScene";
import { masterById, type CharacterSpec } from "./characterData";
import { checkTone } from "../academy/sifuEngine";
import type { Tone } from "../academy/types";

const TONE_HEX: Record<number, string> = { 1: "#C9A227", 2: "#7B2D3E", 3: "#2F5233", 4: "#B3401F" };

// =====================================================================
//  GameCanvas — Engine Babylon + labels flutuantes + diálogo dos mestres
// ---------------------------------------------------------------------
//  As labels (nome 汉字 de cada mestre) são um overlay DOM cujas posições
//  são projetadas world→tela a cada frame (sem re-render do React).
//  Clicar num mestre (3D ou na label) abre o diálogo com suas falas.
// =====================================================================

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const handleRef = useRef<AcademySceneHandle | null>(null);
  const labelEls = useRef<Map<string, HTMLSpanElement>>(new Map());

  const [labels, setLabels] = useState<{ id: string; han: string }[]>([]);
  const [active, setActive] = useState<CharacterSpec | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [toneVerdict, setToneVerdict] = useState<{ text: string; ok: boolean } | null>(null);
  const [breathStep, setBreathStep] = useState(0);

  const openMaster = (id: string) => {
    setActive(masterById(id) ?? null);
    setLineIdx(0); setToneVerdict(null); setBreathStep(0);
  };

  const guessTone = (expected: Tone, guess: Tone) => {
    const v = checkTone(expected, guess, guess);
    setToneVerdict({ text: `${v.line_zh} — ${v.line_pt}${v.corrections[0] ? " (" + v.corrections[0] + ")" : ""}`, ok: v.ok });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const handle = createAcademyScene(engine, canvas, { onPickMaster: openMaster });
    engineRef.current = engine;
    handleRef.current = handle;
    setLabels(handle.masters.map((m) => ({ id: m.id, han: m.han })));

    const up = new Vector3(0, 2.9, 0);
    const idMx = Matrix.Identity();
    engine.runRenderLoop(() => {
      handle.scene.render();
      const w = engine.getRenderWidth(), h = engine.getRenderHeight();
      const sx = canvas.clientWidth / w, sy = canvas.clientHeight / h;
      const vp = handle.camera.viewport.toGlobal(w, h);
      handle.masters.forEach((m) => {
        const el = labelEls.current.get(m.id);
        if (!el) return;
        const p = Vector3.Project(m.node.position.add(up), idMx, handle.scene.getTransformMatrix(), vp);
        if (p.z < 0 || p.z > 1) { el.style.display = "none"; return; }
        el.style.display = "block";
        el.style.transform = `translate(-50%,-100%) translate(${p.x * sx}px, ${p.y * sy}px)`;
      });
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      handle.dispose();
      engine.dispose();
      engineRef.current = null;
      handleRef.current = null;
    };
  }, []);

  const line = active?.speech[lineIdx % Math.max(active.speech.length, 1)];
  const drill = active?.drill;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#1A1612" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", outline: "none", touchAction: "none" }} />

      {/* Labels flutuantes */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {labels.map((l) => (
          <span
            key={l.id}
            ref={(el) => { if (el) labelEls.current.set(l.id, el); else labelEls.current.delete(l.id); }}
            onClick={() => openMaster(l.id)}
            style={{
              position: "absolute", top: 0, left: 0, display: "none", pointerEvents: "auto", cursor: "pointer",
              fontFamily: "'Songti SC', Georgia, serif", fontSize: 15, fontWeight: 700, color: "#F2C230",
              background: "rgba(26,22,18,0.72)", border: "1px solid #5B2C3E", borderRadius: 999,
              padding: "2px 10px", whiteSpace: "nowrap", textShadow: "0 1px 2px #000",
            }}
          >
            {l.han}
          </span>
        ))}
      </div>

      {/* Diálogo do mestre */}
      {active && line && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, pointerEvents: "none" }}>
          <div style={{
            maxWidth: 560, margin: "0 auto", pointerEvents: "auto",
            background: "#221D17", border: "1px solid #5B2C3E", borderRadius: 14, padding: "16px 18px",
            fontFamily: "'Helvetica Neue', Arial, sans-serif", boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div>
                <span style={{ fontFamily: "'Songti SC', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#F2C230" }}>{active.han}</span>
                <span style={{ fontSize: 12, color: "#C9BFAE", marginLeft: 8 }}>{active.pinyin} · {active.name_pt}</span>
              </div>
              <button onClick={() => setActive(null)} style={{ background: "none", border: "none", color: "#8A8478", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 11, letterSpacing: "1px", color: "#C97A8C", textTransform: "uppercase", marginBottom: 10 }}>{active.role_pt}</div>
            <div style={{ fontFamily: "'Songti SC', Georgia, serif", fontSize: 19, color: "#F5EFE6", marginBottom: 4 }}>{line.zh}</div>
            <div style={{ fontSize: 13.5, color: "#E8D5DA", lineHeight: 1.5, marginBottom: 14 }}>{line.pt}</div>

            {/* Drill de tom (花岚, 金财) */}
            {drill && drill.kind === "tone" && (
              <div style={{ background: "#1F1A15", border: "1px solid #3A3226", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, color: "#C9BFAE", marginBottom: 8 }}>
                  Drill: qual o tom de <b style={{ color: "#F2C230", fontFamily: "'Songti SC', Georgia, serif" }}>{drill.han}</b> ({drill.pinyin.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "·")})?
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4].map((t) => (
                    <button key={t} onClick={() => guessTone(drill.answer, t as Tone)}
                      style={{ width: 44, height: 40, background: "#2A241D", border: `2px solid ${TONE_HEX[t]}`, color: TONE_HEX[t], borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{t}</button>
                  ))}
                </div>
                {toneVerdict && <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.5, color: toneVerdict.ok ? "#D9EFDA" : "#E8B4B4" }}>{toneVerdict.text}</div>}
              </div>
            )}

            {/* Exercício de respiração (云道长) */}
            {drill && drill.kind === "breathing" && (
              <div style={{ background: "#1F1A15", border: "1px solid #3A3226", borderRadius: 10, padding: 12, marginBottom: 14, textAlign: "center" }}>
                {breathStep >= drill.cycles * 2 ? (
                  <div style={{ fontSize: 13, color: "#D9EFDA" }}>气沉丹田。 Respiração completa — {drill.cycles} ciclos. 心自静。</div>
                ) : (
                  <>
                    <div style={{ fontFamily: "'Songti SC', Georgia, serif", fontSize: 30, color: breathStep % 2 === 0 ? "#C9A227" : "#7B2D3E", marginBottom: 4 }}>{breathStep % 2 === 0 ? "吸" : "呼"}</div>
                    <div style={{ fontSize: 12.5, color: "#C9BFAE", marginBottom: 10 }}>
                      {breathStep % 2 === 0 ? "Inspire, o qi desce ao dan tian…" : "Expire, solte a tensão…"} ({Math.floor(breathStep / 2) + 1}/{drill.cycles})
                    </div>
                    <button onClick={() => setBreathStep((s) => s + 1)} style={{ background: "#2A241D", color: "#C9BFAE", border: "1px solid #3A3226", borderRadius: 999, padding: "6px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{breathStep % 2 === 0 ? "呼 →" : "吸 →"}</button>
                  </>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {active.speech.length > 1 && (
                <button
                  onClick={() => setLineIdx((i) => i + 1)}
                  style={{ background: "#2A241D", color: "#C9BFAE", border: "1px solid #3A3226", borderRadius: 999, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  próxima fala →
                </button>
              )}
              <button
                onClick={() => setActive(null)}
                style={{ background: "#F2C230", color: "#1A1612", border: "none", borderRadius: 999, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                礼 · reverência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
