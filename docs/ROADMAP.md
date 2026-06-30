# MATSURI RPG — Development Roadmap

**Last updated:** 2026-06-30  
**Current state:** World renders, player moves, 5 Hanzi orbs collectible, Supabase auth works, Vercel deployed.

---

## Phase 1 — Rendering Foundation

**Objective:** Make the rendering pipeline robust and extendable before adding content.

### Tasks
- Add `img.onerror` handler to `loadTex` and `loadAndRemoveBg` so failed fetches throw instead of hanging.
- Add loading progress bar (React overlay, count assets loaded / total).
- Add frustum culling: skip sprites whose world bounds fall outside `[camX, camX+W] × [camY, camY+H]`.
- Add foreground layer (above ysort) for overhanging roofs and bridges.
- Extract `Camera` class from `GameScene.tsx` ticker locals; expose `worldToScreen(wx, wy)`.

**Files involved:**
- `src/engine/AtlasRegistry.ts` — error handling
- `src/engine/RenderPipeline.ts` — culling, foreground layer
- `src/components/GameScene.tsx` — camera extraction, loading overlay
- New: `src/engine/Camera.ts`

**Estimated complexity:** Medium (2–3 days)  
**Dependencies:** None (standalone foundation work)  
**Expected result:** Game loads with visible progress feedback; no silent hangs on missing assets; sprites outside camera are not rendered.

---

## Phase 2 — Character System

**Objective:** Replace hardcoded charIdx assignments with a typed registry; add idle/run animations; add NPC name labels.

### Tasks
- Create `src/world/charDefs.ts` — `CharacterDef` type: `{ id, atlas, charIdx, name, nameCn, scale }`.
- Register all current characters: player, sifu, 6 walkers, dragon.
- Add `idle` frame (frame 0 of each direction) as a distinct state; stop on idle frame 0 when not moving.
- Add run animation: higher `animationSpeed` when `speedMult >= RUN_THRESHOLD`.
- Add floating name labels above all named NPCs (PIXI.Text, hidden until proximity).
- Verify `mkAtlasFrames` grid math against actual atlas pixel positions by inspecting atlas in browser.

**Files involved:**
- `src/components/GameScene.tsx` — player/NPC creation refactor
- `src/engine/AtlasRegistry.ts` — no changes needed
- New: `src/world/charDefs.ts`

**Estimated complexity:** Medium (2–3 days)  
**Dependencies:** Phase 1 (Camera for proximity checks)  
**Expected result:** All characters rendered from named registry; player has distinct walk/run/idle; NPCs show names on approach.

---

## Phase 3 — World & Collision

**Objective:** Implement autotile terrain blending, collision grid, and zone transition zones.

### Tasks
- Load `grass-autotile-47.png` in `AtlasRegistry`; expose via `ctx.atsp()`.
- Implement 47-blob autotile algorithm: encode terrain type per 32×32 cell; look up 4-bit neighbor mask → autotile frame index.
- Replace hard zone borders with blended transition tiles.
- Build collision grid from zone builder data: a boolean `Uint8Array` of size `(WW/32) × (WH/32)`.
- Add collision check in `GameScene.tsx` player movement: test cell at `(player.x ± dx, player.y ± dy)` before applying move.
- Mark water, buildings, and walls as impassable in the collision grid.
- Load `pixel-art-overlay-atlas.png` for overlay details (moss, cracks, puddles).

**Files involved:**
- `src/engine/AtlasRegistry.ts` — new atlas loaders
- `src/engine/RenderPipeline.ts` — autotile layer wired up
- `src/world/buildWorld.ts`, `src/world/zones/*.ts` — collision grid population
- `src/components/GameScene.tsx` — collision check in tick
- New: `src/engine/CollisionGrid.ts`, `src/engine/AutoTiler.ts`

**Estimated complexity:** High (5–7 days)  
**Dependencies:** Phase 1 (rendering layers must be stable)  
**Expected result:** Smooth terrain transitions at zone borders; player cannot walk through walls or water.

---

## Phase 4 — NPC System & Dialogue

**Objective:** Give NPCs state machines and scriptable dialogue trees; hook interact input.

### Tasks
- Create `src/world/npcs.ts` — `NPCDef[]` array with: `{ id, charDef, worldX, worldY, patrolMin, patrolMax, dialogue }`.
- Create `src/engine/NPCManager.ts` — update loop: patrol, idle, detect player proximity (< 80 px), trigger interact event.
- Hook `InputEvents.on('interact')` in `GameScene.tsx` to activate nearest NPC within range.
- Create `src/dialogue/dialogueData.ts` — JSON dialogue trees: nodes with text, speaker, choices, next node id.
- Create `src/components/DialogueBox.tsx` — typewriter text effect, choice buttons, portrait sprite.
- Wire `story_flags` Supabase table to dialogue choice outcomes (flag `met_sifu_liang`, etc.).
- Consume `InputEvents.on('attack')` for attack action placeholder.

**Files involved:**
- `src/input/InputState.ts` — InputEvents already defined, needs consumers
- `src/components/GameScene.tsx` — NPC creation moved to NPCManager
- New: `src/world/npcs.ts`, `src/engine/NPCManager.ts`, `src/dialogue/dialogueData.ts`, `src/components/DialogueBox.tsx`

**Estimated complexity:** High (5–7 days)  
**Dependencies:** Phase 2 (CharacterDef registry), Phase 3 (collision for proximity)  
**Expected result:** Player presses E near NPC → dialogue box opens with typewriter; branching choices set story flags; patrol NPCs react to player.

---

## Phase 5 — Combat

**Objective:** Turn-based or action encounter system using RPG stats (strength, spirit, wisdom, agility).

### Tasks
- Design combat model: action RPG (real-time, proximity triggers) or menu-based (encounter zones).
- Create `src/rpg/CombatEngine.ts` — damage formula using strength/spirit, defense, crit from agility.
- Create `src/rpg/enemyData.ts` — enemy definitions with stats, drop tables, Hanzi loot.
- Create `src/components/CombatUI.tsx` — HP bars, action buttons (Attack / Skill / Item / Flee).
- Hook talent effects (e.g., `crit_chance`, `boss_damage`, `dmg_reduction`) into CombatEngine.
- Reward: XP grant (via `gameStore.gainXP`), Yuan, possible item drop.
- Define encounter zones in world (triggered by walking into marked tiles).

**Files involved:**
- `src/rpg/levelSystem.ts` — XP formula already present
- `src/rpg/talentData.ts` — effect JSON to be consumed
- `src/stores/gameStore.ts` — `gainXP`, `current_hp`, `max_hp` already tracked
- New: `src/rpg/CombatEngine.ts`, `src/rpg/enemyData.ts`, `src/components/CombatUI.tsx`

**Estimated complexity:** High (7–10 days)  
**Dependencies:** Phase 3 (collision/encounter zones), Phase 4 (story flags gate encounters)  
**Expected result:** Player encounters enemies in designated zones; combat resolves via stats; loot and XP awarded on victory.

---

## Phase 6 — Inventory & Equipment

**Objective:** Make equipment affect gameplay; enable consumable use; add shop NPC.

### Tasks
- Implement `src/rpg/StatsEngine.ts` — aggregates `base stats + equipped item bonuses + active talent bonuses`.
- Replace raw `character.strength` etc. with `StatsEngine.effective(character)` wherever stats are used.
- Implement consumable use: `Chá de Ginseng` restores `heal_qi` points; `Pergaminho de Sabedoria` applies XP multiplier for duration.
- Add item tooltip on hover in `InventoryPanel`.
- Add drag-and-drop equip (or click-to-equip).
- Add shop NPC (Zhāng Merchant) in Zone 3 Village; inventory defined in `src/rpg/shopData.ts`.
- Sync equipped items to Supabase `player_inventory.equipped` column.

**Files involved:**
- `src/components/InventoryPanel.tsx` — tooltip, drag/drop
- `src/stores/gameStore.ts` — consumable use action
- `src/rpg/itemData.ts` — no changes needed (data complete)
- New: `src/rpg/StatsEngine.ts`, `src/rpg/shopData.ts`

**Estimated complexity:** Medium (4–5 days)  
**Dependencies:** Phase 5 (StatsEngine feeds into combat)  
**Expected result:** Equipping a Pincel de Bambu grants +5% XP visibly in HUD; consumables have timed effects; shop lets player spend Yuan.

---

## Phase 7 — Quests & Story

**Objective:** Replace hardcoded orb objectives with a proper quest system; add story progression.

### Tasks
- Create `src/quests/questData.ts` — typed `QuestDef[]`: id, title, steps, rewards, prerequisite flags.
- Create `src/engine/QuestManager.ts` — tracks active quest, current step, completion; writes `story_flags` to Supabase.
- Port existing 5-orb mission into QuestDef format as "Quest 0: Os Números do Dao".
- Add quest log panel (`src/components/QuestLogPanel.tsx`).
- Add quest markers (!) above NPC quest givers on world.
- Add world map (simple zone diagram) accessible from HUD.
- Write 3 additional quest chains: Zone 2 (calligraphy trials), Zone 4 (mountain ascent), Zone 5 (temple rite).

**Files involved:**
- `src/stores/gameStore.ts` — `missions` → migrate to `QuestManager`
- `src/components/HUD.tsx` — quest log button
- New: `src/quests/questData.ts`, `src/engine/QuestManager.ts`, `src/components/QuestLogPanel.tsx`

**Estimated complexity:** Medium-High (5–7 days)  
**Dependencies:** Phase 4 (dialogue gates quests), Phase 5 (combat quests)  
**Expected result:** Player can track multiple quests; story flags gate quest availability; progress persists via Supabase.

---

## Phase 8 — Optimization & Polish

**Objective:** Prepare for public release: performance, audio, accessibility, code quality.

### Tasks
- **Code splitting:** Move PixiJS to separate chunk via `vite.config.ts` `manualChunks`; add dynamic imports for panels.
- **Audio:** Add `howler`; implement `AudioManager.ts` with ambient BGM per zone (fade on transition), SFX on: interact, combat hit, level up, quest complete.
- **Asset compression:** Convert large atlases to WebP; evaluate KTX2/basis for GPU texture compression.
- **Accessibility:** Add keyboard navigation for all modals; `aria-label` on canvas wrapper.
- **Error handling:** `img.onerror` in all loaders (Phase 1 prerequisite); global `window.onerror` → toast notification.
- **Offline/PWA:** Add service worker for caching assets; manifest for installable app.
- **Minification:** Enable `build.sourcemap: 'hidden'` for Sentry integration.
- **Code quality:** Extract `GameScene.tsx` game loop into `src/engine/GameLoop.ts`; write unit tests for `StatsEngine`, `CombatEngine`, `QuestManager`.
- **Gamepad support:** Add Gamepad API polling in `InputManager`.

**Files involved:**
- `vite.config.ts` — chunking, PWA plugin
- `src/engine/AtlasRegistry.ts` — error handling
- `src/components/GameScene.tsx` — extract to GameLoop
- New: `src/engine/AudioManager.ts`, `public/sw.js`, `public/manifest.json`

**Estimated complexity:** High (ongoing, 2+ weeks)  
**Dependencies:** All previous phases  
**Expected result:** Lighthouse score > 85; load time < 3 s on 4G; audio feedback on all interactions; game installable as PWA.

---

## Dependency Graph

```
Phase 1 (Rendering)
    └── Phase 2 (Characters)
            └── Phase 3 (World/Collision)
                    └── Phase 4 (NPCs/Dialogue)
                            ├── Phase 5 (Combat)
                            │       └── Phase 6 (Inventory)
                            │               └── Phase 7 (Quests)
                            └── Phase 7 (Quests)
                                        └── Phase 8 (Optimization)
```

---

## Immediate Next Actions (start of Phase 1)

1. Add `img.onerror` to `AtlasRegistry.loadTex` and `loadAndRemoveBg`.
2. Add asset loading progress overlay in `GameScene.tsx`.
3. Extract `Camera` class.
4. Verify autotile atlas pixel coordinates before implementing blob algorithm.
