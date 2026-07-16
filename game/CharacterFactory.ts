// =====================================================================
//  CharacterFactory — mestres procedurais em Babylon (sem assets externos)
// ---------------------------------------------------------------------
//  Cada mestre é montado a partir de primitivas coloridas segundo sua
//  CharacterSpec (paleta, silhueta, chapéu, objeto). Retorna um
//  TransformNode raiz para posicionar/animar na cena.
//
//  Usa apenas API estável e antiga do Babylon (MeshBuilder, StandardMaterial,
//  Color3, Vector3, TransformNode) para minimizar risco sem deps instaladas.
// =====================================================================

import { Scene, TransformNode, MeshBuilder, StandardMaterial, Color3, Vector3 } from "@babylonjs/core";
import type { AbstractMesh } from "@babylonjs/core";
import type { CharacterSpec, Silhouette } from "./characterData";

const SIL: Record<Silhouette, { h: number; d: number; lean: number }> = {
  tall:    { h: 2.2, d: 0.9,  lean: 0 },
  broad:   { h: 1.8, d: 1.35, lean: 0 },
  slender: { h: 2.0, d: 0.7,  lean: 0 },
  stooped: { h: 1.5, d: 0.95, lean: 0.28 },
  round:   { h: 1.5, d: 1.2,  lean: 0 },
  small:   { h: 1.1, d: 0.7,  lean: 0 },
};

function mat(scene: Scene, hex: string, name: string): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.FromHexString(hex);
  m.specularColor = new Color3(0.1, 0.1, 0.1); // pouco brilho — visual pixel/fosco
  return m;
}

function paint(mesh: AbstractMesh, scene: Scene, hex: string, tag: string): void {
  mesh.material = mat(scene, hex, `${tag}-mat`);
}

/** Monta um mestre e devolve o TransformNode raiz (base nos pés, y=0). */
export function buildCharacter(scene: Scene, spec: CharacterSpec, position = Vector3.Zero()): TransformNode {
  const root = new TransformNode(`master-${spec.id}`, scene);
  root.position = position.clone();

  const s = SIL[spec.silhouette];
  const { robe, trim, skin } = spec.palette;

  // ── Corpo (manto) ──
  const body = MeshBuilder.CreateCylinder(`${spec.id}-body`, {
    height: s.h, diameterTop: s.d * 0.7, diameterBottom: s.d, tessellation: 12,
  }, scene);
  body.position.y = s.h / 2;
  body.rotation.x = s.lean; // costas curvadas p/ silhueta "stooped"
  paint(body, scene, robe, `${spec.id}-body`);
  body.parent = root;

  // ── Faixa/trim na cintura ──
  const sash = MeshBuilder.CreateCylinder(`${spec.id}-sash`, {
    height: 0.18, diameter: s.d * 0.95, tessellation: 12,
  }, scene);
  sash.position.y = s.h * 0.55;
  paint(sash, scene, trim, `${spec.id}-sash`);
  sash.parent = root;

  // ── Cabeça ──
  const headY = s.h + 0.28;
  const head = MeshBuilder.CreateSphere(`${spec.id}-head`, { diameter: 0.6, segments: 12 }, scene);
  head.position.y = headY;
  head.position.z = s.lean * 0.6; // acompanha a curvatura
  paint(head, scene, skin, `${spec.id}-head`);
  head.parent = root;

  // ── Chapéu ──
  const hat = buildHat(scene, spec, headY);
  if (hat) hat.parent = root;

  // ── Objeto na mão ──
  const held = buildObject(scene, spec, s.h);
  if (held) held.parent = root;

  return root;
}

function buildHat(scene: Scene, spec: CharacterSpec, headY: number): AbstractMesh | null {
  const c = spec.palette.trim;
  const top = headY + 0.34;
  switch (spec.hat) {
    case "scholar": {
      const h = MeshBuilder.CreateBox(`${spec.id}-hat`, { width: 0.7, height: 0.22, depth: 0.7 }, scene);
      h.position.y = top; paint(h, scene, c, `${spec.id}-hat`); return h;
    }
    case "conical": {
      const h = MeshBuilder.CreateCylinder(`${spec.id}-hat`, { height: 0.5, diameterTop: 0, diameterBottom: 0.9, tessellation: 16 }, scene);
      h.position.y = top; paint(h, scene, c, `${spec.id}-hat`); return h;
    }
    case "daoist": {
      const h = MeshBuilder.CreateCylinder(`${spec.id}-hat`, { height: 0.32, diameter: 0.34, tessellation: 12 }, scene);
      h.position.y = top; paint(h, scene, c, `${spec.id}-hat`); return h;
    }
    case "kerchief": {
      const h = MeshBuilder.CreateSphere(`${spec.id}-hat`, { diameter: 0.66, segments: 10 }, scene);
      h.scaling.y = 0.5; h.position.y = headY + 0.18; paint(h, scene, c, `${spec.id}-hat`); return h;
    }
    case "cap": {
      const h = MeshBuilder.CreateCylinder(`${spec.id}-hat`, { height: 0.24, diameter: 0.62, tessellation: 12 }, scene);
      h.position.y = top - 0.05; paint(h, scene, c, `${spec.id}-hat`); return h;
    }
    case "none":
    default:
      return null;
  }
}

function buildObject(scene: Scene, spec: CharacterSpec, bodyH: number): AbstractMesh | null {
  const side = new Vector3(0.7, bodyH * 0.45, 0);
  const c = spec.palette.trim;
  switch (spec.object) {
    case "book": {
      const o = MeshBuilder.CreateBox(`${spec.id}-obj`, { width: 0.4, height: 0.5, depth: 0.12 }, scene);
      o.position = side; paint(o, scene, "#EDE7DA", `${spec.id}-obj`); return o;
    }
    case "fan": {
      const o = MeshBuilder.CreateBox(`${spec.id}-obj`, { width: 0.5, height: 0.5, depth: 0.03 }, scene);
      o.position = side; o.rotation.z = 0.5; paint(o, scene, c, `${spec.id}-obj`); return o;
    }
    case "flywhisk": {
      const handle = MeshBuilder.CreateCylinder(`${spec.id}-obj`, { height: 0.9, diameter: 0.06, tessellation: 8 }, scene);
      handle.position = side; paint(handle, scene, "#5A4632", `${spec.id}-obj`);
      const tuft = MeshBuilder.CreateSphere(`${spec.id}-obj-tuft`, { diameter: 0.3, segments: 8 }, scene);
      tuft.position = side.add(new Vector3(0, 0.5, 0)); tuft.scaling.y = 1.4;
      paint(tuft, scene, "#EDE7DA", `${spec.id}-obj-tuft`); tuft.parent = handle;
      return handle;
    }
    case "cane": {
      const o = MeshBuilder.CreateCylinder(`${spec.id}-obj`, { height: bodyH, diameter: 0.07, tessellation: 8 }, scene);
      o.position = new Vector3(0.7, bodyH / 2, 0); paint(o, scene, "#5A4632", `${spec.id}-obj`); return o;
    }
    case "coin": {
      const o = MeshBuilder.CreateCylinder(`${spec.id}-obj`, { height: 0.05, diameter: 0.4, tessellation: 20 }, scene);
      o.position = side; o.rotation.x = Math.PI / 2; paint(o, scene, "#F2C230", `${spec.id}-obj`); return o;
    }
    case "none":
    default:
      return null;
  }
}
