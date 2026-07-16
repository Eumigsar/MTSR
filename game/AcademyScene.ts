// =====================================================================
//  AcademyScene — pátio 3D mínimo com os 6 mestres procedurais
// ---------------------------------------------------------------------
//  Constrói chão, luz, câmera orbital e enfileira os mestres via
//  CharacterFactory. Sem assets externos. API estável do Babylon.
// =====================================================================

import { Scene, Engine, ArcRotateCamera, HemisphericLight, MeshBuilder, StandardMaterial, Color3, Color4, Vector3 } from "@babylonjs/core";
import { MASTERS } from "./characterData";
import { buildCharacter } from "./CharacterFactory";

export interface AcademySceneHandle {
  scene: Scene;
  dispose(): void;
}

/** Cria a cena da Academia dentro de um Engine já existente. */
export function createAcademyScene(engine: Engine, canvas: HTMLCanvasElement): AcademySceneHandle {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.10, 0.086, 0.071, 1); // #1A1612 (identidade do dojo)

  // Câmera orbital sobre o pátio
  const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 3, 14, new Vector3(0, 1, 0), scene);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 26;
  camera.upperBetaLimit = Math.PI / 2.05; // não deixa passar por baixo do chão
  camera.wheelPrecision = 30;
  camera.attachControl(canvas, true);

  // Luz suave vinda de cima (top-left, como o style guide do mundo)
  const light = new HemisphericLight("light", new Vector3(-0.5, 1, -0.3), scene);
  light.intensity = 0.95;
  light.groundColor = new Color3(0.15, 0.13, 0.11);

  // Chão do pátio (pedra clara)
  const ground = MeshBuilder.CreateGround("patio", { width: 20, height: 20 }, scene);
  const gmat = new StandardMaterial("patio-mat", scene);
  gmat.diffuseColor = Color3.FromHexString("#3A3226");
  gmat.specularColor = new Color3(0.05, 0.05, 0.05);
  ground.material = gmat;

  // Enfileira os 6 mestres em semicírculo, de frente para a câmera
  const n = MASTERS.length;
  MASTERS.forEach((spec, i) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    const angle = Math.PI * (0.15 + 0.7 * t); // arco frontal
    const radius = 6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 1;
    buildCharacter(scene, spec, new Vector3(x, 0, z));
  });

  return {
    scene,
    dispose: () => scene.dispose(),
  };
}
