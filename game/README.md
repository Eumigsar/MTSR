# Camada 3D (Babylon) — Academia Matsuri · `/game`

Scaffold da camada 3D em **Babylon.js** (MIT, gratuito). Gera os **6 mestres
procedurais** com `CharacterFactory` — sem assets externos, só primitivas
coloridas segundo a `CharacterSpec` de cada mestre.

## Conteúdo

| Arquivo | O quê |
|---|---|
| `characterData.ts` | Specs dos 6 mestres (文博, 花岚, 云道长, 婆婆, 金财, 小宝): paleta, silhueta, chapéu, objeto, registro de fala. Puro. |
| `CharacterFactory.ts` | Monta cada mestre a partir de primitivas (corpo, faixa, cabeça, chapéu, objeto) → `TransformNode`. |
| `AcademyScene.ts` | Pátio mínimo: chão, luz, câmera orbital, 6 mestres em semicírculo. |
| `GameCanvas.tsx` | Componente React que monta o `Engine`, roda o render loop e descarta no unmount. |
| `index.ts` | Barrel. |

## Uso

```tsx
import { GameCanvas } from './game'

// Em um container com altura definida:
<div style={{ width: '100%', height: '100vh' }}>
  <GameCanvas />
</div>
```

## Os 6 mestres

| id | 汉字 | Papel | Silhueta / chapéu / objeto | NPC 2D |
|----|------|-------|----------------------------|--------|
| `wenbo` | 文博 | Letrado — caligrafia/radicais | slender · scholar · livro | wen_bo |
| `hualan` | 花岚 | Poeta — tons/musicalidade | slender · kerchief · leque | hua_lan |
| `yundaozhang` | 云道长 | Daoísta — Cultivo/respiração | tall · daoist · 拂尘 | — |
| `popo` | 婆婆 | Vocabulário do dia a dia | stooped · kerchief · bengala | grandma_zhang |
| `jincai` | 金财 | Mercador — números/trocas | broad · cap · moeda | — |
| `xiaobao` | 小宝 | Aprendiz curioso | small · — · — | little_wu |

## ⚠️ Estado de verificação (importante)

Este scaffold foi escrito num ambiente **sem `node_modules` instalado** (nem o
Babylon). Por isso:

- ✅ **Verificado:** estrutura/sintaxe via `esbuild` (barrel bundle limpo) e os
  **dados** dos mestres via `npm test` (6 asserts).
- ❌ **NÃO verificado ainda:** a API real do Babylon (não há `@babylonjs/core`
  instalado) e a renderização 3D (não há navegador nesta sessão).

**Antes de confiar na cena, rode localmente:**
```bash
npm install          # baixa @babylonjs/core (já está no package.json)
npm run dev          # e monte <GameCanvas /> numa rota/tela para o smoke test
```
Usei só API estável e antiga do Babylon (`MeshBuilder`, `StandardMaterial`,
`Color3/4`, `Vector3`, `ArcRotateCamera`, `HemisphericLight`, `Engine`,
`Scene`) e o **barrel raiz** `@babylonjs/core` (evita os footguns de
side-effect/tree-shaking do `attachControl`), para minimizar surpresas.
