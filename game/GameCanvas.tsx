import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core";
import { createAcademyScene } from "./AcademyScene";

// =====================================================================
//  GameCanvas — monta o Engine Babylon num <canvas> e roda o loop.
// ---------------------------------------------------------------------
//  Drop-in React: <GameCanvas />. Cria a AcademyScene, roda o render
//  loop, trata resize e descarta tudo no unmount.
// =====================================================================

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const academy = createAcademyScene(engine, canvas);

    engine.runRenderLoop(() => academy.scene.render());
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      academy.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", outline: "none", touchAction: "none" }}
    />
  );
}
