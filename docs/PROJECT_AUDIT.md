# MATSURI RPG — Project Audit

**Audit Date:** 2026-06-30  
**Stack:** React 18 · TypeScript · PixiJS 8.5.2 · Supabase · Tailwind CSS · Vite  
**Viewport:** 900×560 px · World: 2700×900 px

---

## 1. Rendering Architecture

**Current status:** Functional 18-layer pipeline defined in `src/engine/RenderPipeline.ts`.  
Layer hierarchy:
```
app.stage
├── sky           (clouds, dragon, parallax elements)
├── mountains     (scrolling silhouettes, parallax 0.06×)
└── world         (scrolls 1:1 with camera)
    ├── bgDecoration
    ├── ground
    ├── autotile
    ├── roads
    ├── water
    ├── overlays
    ├── infra
    ├── ysort     (Y-sorted every frame)
    └── particles
```
**Missing:** No lighting layer, no shadow layer, no foreground-overlay (above player) layer.  
**Technical debt:** All zone builders add sprites in a single pass; no dirty-flag or culling — every sprite is drawn every frame regardless of camera visibility.  
**Suggested improvements:** Frustum culling; separate foreground layer for overhanging roofs; ambient-occlusion pass via RenderTexture.  
**Priority:** Medium (performance impact only noticeable past ~500 visible sprites).

---

## 2. Game Loop

**Current status:** Single `app.ticker.add()` callback inside `GameScene.tsx` (lines ~267–382). Handles: input resolution, player movement, camera, NPC patrol, particles, birds, smoke, water shimmer.  
**Missing:** Fixed timestep physics; entity-component loop; event dispatching separate from rendering.  
**Technical debt:** All game logic is monolithic inside one ticker callback, making it untestable and hard to extend.  
**Suggested improvements:** Extract a `GameLoop` class with `update(dt)` → separate system calls; use `PIXI.Ticker.shared` and allow pausing.  
**Priority:** High — prerequisite for combat, quest triggers, and dialogue.

---

## 3. Scene System

**Current status:** Single scene — `GameScene.tsx`. AuthScreen is a separate React component. No scene manager exists.  
**Missing:** Scene manager, scene stack (for menus overlaid on game), transition effects.  
**Technical debt:** `GameScene` mounts once and never unmounts during play. Cleanup is partial (only removes keydown listener; PixiJS ticker is destroyed on unmount).  
**Suggested improvements:** `SceneManager` class with `push/pop/replace` and fade transitions.  
**Priority:** Medium.

---

## 4. Camera

**Current status:** Implemented in `GameScene.tsx` ticker. Smooth follow with 0.1 lerp, clamped to world bounds `[0, WW-W]` × `[0, WH-H]`.  
**Missing:** Camera shake, letterbox for cutscenes, look-ahead (lead player direction), zone-transition lock.  
**Technical debt:** Camera state (`camX`, `camY`) is local variables — no Camera class, can't be queried by other systems.  
**Suggested improvements:** Extract `Camera` class; expose `worldToScreen` / `screenToWorld` helpers.  
**Priority:** Low for current scope; needed for cutscenes.

---

## 5. Input

**Current status:** Dual input: keyboard (`KeyboardEvent` listeners in `GameScene.tsx`) + virtual joystick (`src/input/MobileControls.tsx`). Shared state via `moveInput` object in `src/input/InputState.ts`.  
**Missing:** Gamepad API support; rebindable keys; `interact` and `attack` events from `InputEvents` are defined but not consumed.  
**Technical debt:** Two separate `keydown` listeners registered (one inside `init`, one outside) — the outer one is redundant.  
**Suggested improvements:** Consolidate to a single `InputManager`; hook `InputEvents.on('interact')` to NPC proximity detection.  
**Priority:** Medium (interact event needed for Phase 4 NPC system).

---

## 6. Tile Renderer

**Current status:** `ctx.gt(col, row, w, h)` produces `PIXI.TilingSprite` from `ground-atlas.png`. Used throughout zone builders. Tile size 128 px.  
**Missing:** True autotile blending (Wang tiles / blob tiles). The atlas `grass-autotile-47.png` and `Grass 47 Blob Autotile.png` exist but are not used for terrain transitions.  
**Technical debt:** Ground is laid as flat rectangular tiles — no corner blending at zone borders.  
**Suggested improvements:** Implement 47-tile blob autotile algorithm reading terrain type per tile cell and selecting the correct atlas frame.  
**Priority:** High (visual quality, Phase 3 World).

---

## 7. Character Renderer

**Current status:** `AtlasRegistry.loadCharAtlas` (for `chars-atlas.png`, gray bg removal) and `loadWalkTex` (for `chars-atlas1.png`, RGBA). `mkAtlasFrames(tex, charIdx, dir)` extracts 32×32 frames from the 12-wide grid.  
**Missing:** Idle animation (currently stops on frame 0); run animation distinct from walk; equipment overlays; name labels on all NPCs.  
**Technical debt:** Character index assignments are hardcoded — charIdx 0=player, 1=sifu, 2-7=walkers, 8=dragon. If the atlas layout changes, these break silently.  
**Suggested improvements:** Define a `CharacterDef` registry (see Character System section below); drive `charIdx` from named entries.  
**Priority:** High (Phase 2).

---

## 8. Collision

**Current status:** Not implemented. Player is soft-clamped to world bounds only (`x ∈ [16, WW-16]`, `y ∈ [520, WH-16]`).  
**Missing:** Tile-based collision map; building/wall collision; NPC push-away; water impassable.  
**Technical debt:** None — no legacy collision code to maintain.  
**Suggested improvements:** Encode a boolean collision grid (WW/TILE_SIZE × WH/TILE_SIZE) per zone; check grid cell on player move.  
**Priority:** High (Phase 3 World).

---

## 9. NPC System

**Current status:** 1 static NPC (Sifu Liang) with click dialogue; 6 patrol NPCs walking between bounds. Patrol reversal on boundary hit.  
**Missing:** NPC state machine (idle/walk/talk); proximity detection (auto-trigger dialogue on approach); facing direction update for stationary NPC; NPC schedules (time-based behavior).  
**Technical debt:** NPC definitions are inlined in `GameScene.tsx`; no separation between NPC data and rendering.  
**Suggested improvements:** `NPCDef` data array in `src/world/npcs.ts`; `NPCManager` class handles update loop and interact events.  
**Priority:** High (Phase 4).

---

## 10. Dialogue System

**Current status:** Single hardcoded string shown in a React overlay (`npcText` state). Click to dismiss.  
**Missing:** Branching dialogue; choice nodes; dialogue scripting format (JSON/YAML); portrait display; typewriter effect; sound on character display.  
**Technical debt:** Dialogue content is hardcoded in component JSX.  
**Suggested improvements:** `src/dialogue/DialogueRunner.ts` consuming JSON dialogue trees; DialogueBox React component with typewriter + choices.  
**Priority:** Medium (Phase 4).

---

## 11. Inventory

**Current status:** UI panel exists (`src/components/InventoryPanel.tsx`). Data model in `src/rpg/itemData.ts` (14 items). Zustand store (`gameStore`) tracks `inventory[]` and `equipped{}`. Supabase tables `items` and `player_inventory` present.  
**Missing:** Drag-and-drop equip; item tooltips; item use (consumables apply stat changes); drop/discard. Equip stat application to player stats is not implemented in the game loop.  
**Technical debt:** `xp_bonus` and other item effects are stored in JSON but never read during gameplay.  
**Suggested improvements:** `StatsEngine.ts` that aggregates base stats + equipment bonuses + talent bonuses into effective stats used by the game loop.  
**Priority:** Medium (Phase 6).

---

## 12. Quest System

**Current status:** 5 Hanzi orbs act as collectible objectives. `gameStore` tracks `missions[]` with `currentMission` and `missionProgress`. `submitAnswer()` advances mission progress and awards rewards.  
**Missing:** Formal quest definition format; multi-step quests; quest log UI; NPC quest givers; quest markers on world.  
**Technical debt:** Quest logic is embedded in `submitAnswer()` in the store.  
**Suggested improvements:** `src/quests/questData.ts` with typed `QuestDef`; `QuestManager` tracks state per character via Supabase `story_flags`.  
**Priority:** Medium (Phase 7).

---

## 13. Save System

**Current status:** Supabase persistence in `gameStore.ts` via `loadAll()` (loads inventory, talents, learning stats) and individual save calls. Position is saved to `characters.position_x/y`.  
**Missing:** Auto-save on position change (throttled); offline fallback (localStorage); save-on-exit hook.  
**Technical debt:** Demo mode bypasses all persistence silently — no local save either.  
**Suggested improvements:** Throttled position auto-save (every 5 s); localStorage cache for offline play; explicit "Saved!" feedback in HUD.  
**Priority:** Low.

---

## 14. Audio

**Current status:** Not implemented. No audio files in `/assets`. No Web Audio API or Howler.js integration.  
**Missing:** Background music (looping ambient), SFX on interaction, footstep sounds, UI sounds.  
**Suggested improvements:** Add `howler` package; `AudioManager.ts` with BGM fade-in/out on zone transition; SFX pool for hit, pickup, dialogue.  
**Priority:** Low (Phase 8 polish).

---

## 15. UI

**Current status:**  
- `HUD.tsx` — QI bar, XP bar, Yuan, mission tracker, 3 panel buttons.  
- `CharacterPanel.tsx` — Stats display, stat point allocation.  
- `InventoryPanel.tsx` — Grid view with equip slots.  
- `TalentTreePanel.tsx` — Talent tree by element.  
- `LearningModal.tsx` — Hanzi quiz with tone input.  
- `MissionRewardModal.tsx` — Reward display.  
- `AuthScreen.tsx` — Login / signup / demo.  
**Missing:** Mini-map, dialogue box component, quest log panel, settings panel (audio/controls), pause menu.  
**Technical debt:** Panel open/close state is duplicated across store and local state in some panels. Tailwind class strings are long but readable.  
**Priority:** Low for new panels; Medium for missing dialogue box.

---

## 16. Asset Loading

**Current status:** `AtlasRegistry.load()` fires 5 parallel fetches (ground, building, nature, props, tileset). Character atlases loaded separately via `loadCharAtlas` / `loadWalkTex`. No loading screen progress; `init()` awaits all before rendering.  
**Missing:** Loading progress bar; error handling for failed fetches (onerror on Image); lazy loading for unused zones.  
**Technical debt:** `loadTex` has only `img.onload`, no `img.onerror` — a 404 causes `Promise.all` to hang silently forever (root cause of the original 404 bug).  
**Suggested improvements:** Add `img.onerror = () => reject(new Error(...))` to both loader methods; show a loading progress bar during init.  
**Priority:** High (robustness).

---

## 17. Atlas Loading

**Current status:**  
- `loadTex(src)` — loads PNG via canvas, preserves alpha. Used for RGBA atlases.  
- `loadAndRemoveBg(src)` — loads JPEG/RGB via canvas, removes near-white/grey pixels (R,G,B > 185 and max-min < 35). Used for `chars-atlas.png` and `tileset.png`.  
- `loadCharAtlas(src)` — public alias for `loadAndRemoveBg`, used for character atlas.  
**Missing:** WebP/AVIF support; texture compression (basis/KTX2) for large atlases.  
**Technical debt:** Background removal threshold (185/35) was calibrated for the gray ~234 background — if a different atlas has a lighter background, it may clip incorrectly.  
**Priority:** Low.

---

## 18. Supabase Integration

**Current status:** Auth (email/password), characters table, profiles (auto-created on signup via trigger), hanzi_master, learning_progress, player_learning_stats (SM-2), story_flags, items, player_inventory, talents, player_talents. All with RLS.  
**Missing:** Realtime subscriptions (multiplayer presence); edge functions (server-side validation); storage bucket for user avatars.  
**Technical debt:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set as Vercel env vars — not documented.  
**Suggested improvements:** Add `.env.example`; validate env vars at startup with user-friendly error.  
**Priority:** Low (auth works; no new tables needed for Phase 1-4).

---

## 19. Vercel Configuration

**Current status:** `vercel.json` sets `framework: vite`, `buildCommand: npm run build`, `outputDirectory: dist`, SPA rewrite `/(.*) → /index.html`.  
**Missing:** Environment variable documentation; preview deployment configuration.  
**Technical debt:** None.  
**Priority:** None (done).

---

## 20. Build Configuration

**Current status:** `vite.config.ts` uses `@vitejs/plugin-react`. `package.json` build script: `tsc && vite build`. Output in `dist/`.  
**Missing:** Code splitting (main bundle is 745 kB gzipped 220 kB — PixiJS is large); source maps for production debugging.  
**Suggested improvements:** Move PixiJS to a separate chunk via `manualChunks`; enable `build.sourcemap: true` for staging.  
**Priority:** Low (Phase 8).

---

## Asset Validation

| File | Dimensions | Format | Loaded By | Status |
|---|---|---|---|---|
| `chars-atlas.png` | 1536×1024 | RGB (gray bg ~234) | `loadCharAtlas` | ✅ Used — player + sifu frames |
| `chars-atlas1.png` | 1536×1024 | RGBA | `loadWalkTex` | ✅ Used — NPC walkers + dragon |
| `ground-atlas.png` | — | RGBA PNG | `loadTex` | ✅ Used — `ctx.gt()` tile fills |
| `building-atlas.png` | — | RGBA PNG | `loadTex` | ✅ Used — `ctx.bsp()` facades |
| `nature-atlas.png` | — | RGBA PNG | `loadTex` | ✅ Used — `ctx.nsp()` trees/rocks |
| `props-atlas.png` | — | RGBA PNG | `loadTex` | ✅ Used — `ctx.psp()` props |
| `tileset.png` | — | JPEG (no alpha) | `loadAndRemoveBg` | ✅ Used — `ctx.tsp()` (lanterns etc.) |
| `bg-login.png` | — | PNG | `<img>` in AuthScreen | ✅ Used — login background |
| `grass-autotile-47.png` | — | PNG | Not loaded | ⚠️ Unused — reserved for Phase 3 autotile |
| `Grass 47 Blob Autotile.png` | — | PNG | Not loaded | ⚠️ Unused — alternate blob autotile source |
| `pixel-art-autotile-atlas.png` | — | PNG | Not loaded | ⚠️ Unused — reserved for Phase 3 |
| `pixel-art-overlay-atlas.png` | — | PNG | Not loaded | ⚠️ Unused — reserved for terrain overlays |

**Unused atlases explanation:** The four unused atlases (`grass-autotile-47.png`, `Grass 47 Blob Autotile.png`, `pixel-art-autotile-atlas.png`, `pixel-art-overlay-atlas.png`) are intentionally deferred for Phase 3 (World) when autotile blending will be implemented. They must not be removed.

---

## Character System

### Atlas Layout (auto-determined from CLAUDE.md + sprites.json)

**chars-atlas.png**
- Size: 1536×1024 px
- Color: RGB with gray background ~234 (requires `loadAndRemoveBg`)
- Frame size: 32×32 px
- Frames per direction: 4
- Directions: 4 (down=0, left=1, right=2, up=3)
- Characters per row: 1536 / (32 × 4) = **12**
- Character rows: 1024 / (32 × 4) = **8**
- Total character slots: 96

**chars-atlas1.png**
- Size: 1536×1024 px
- Color: RGBA transparent (watercolor style)
- Same grid layout as chars-atlas.png

### Reusable Character Atlas Definition

```typescript
// Each character occupies a 128×128 block in the atlas grid.
// charIdx = character slot (0-95, left-to-right, top-to-bottom)
// dir: 0=down, 1=left, 2=right, 3=up
// Returns 4 animation frames for that direction.
const mkAtlasFrames = (tex, charIdx, dir) => {
  const col = charIdx % 12
  const row = Math.floor(charIdx / 12)
  return [0,1,2,3].map(f => new PIXI.Texture({
    source: tex.source,
    frame: new PIXI.Rectangle((col*4+f)*32, (row*4+dir)*32, 32, 32),
  }))
}
```

### Current Character Assignments

| charIdx | Atlas | Character |
|---|---|---|
| 0 | chars-atlas | Player (apprentice blue) |
| 1 | chars-atlas | Sifu Liang |
| 0-5 | chars-atlas1 | 6 wandering NPCs |
| 8 | chars-atlas1 | Dragon (Xiao Long) |

---

## World Rendering

| Feature | Status | Notes |
|---|---|---|
| Autotile support | ⚠️ Partial | Atlas files present; algorithm not implemented |
| Terrain blending | ❌ Missing | Hard zone borders at x=540, 1080, etc. |
| Y-sort | ✅ Implemented | All ysortLay children sorted by `.y` every frame |
| Object layering | ✅ Implemented | 18-layer pipeline; infra below ysort |
| Collision layers | ❌ Missing | No collision grid |
| Decorations | ✅ Implemented | Particles: leaves, smoke, birds, water shimmer |
| Lighting | ❌ Missing | No ambient occlusion or shadow layer |
