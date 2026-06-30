/**
 * extract-atlas.js
 * Extracts all sprite groups from the reference spec sheet (1536×1024)
 * and writes organized atlas PNG files to public/assets/.
 *
 * Usage: node scripts/extract-atlas.js
 *
 * Source positions were determined by pixel-level scanning of the reference image.
 */

const fs   = require('fs');
const path = require('path');
const { PNG } = require('/home/user/MTSR/node_modules/pngjs/lib/png.js');

// ─── Paths ───────────────────────────────────────────────────────────────────
const REF = '/root/.claude/uploads/6f9830c3-37f8-50ec-a95c-4a2d9f6fe5c3/544dbc20-32E42262C53B4262836999C8613B4E92.png';
const OUT = path.join(__dirname, '../public/assets');

const ref = PNG.sync.read(fs.readFileSync(REF));
const RW = ref.width;   // 1536
const RH = ref.height;  // 1024

// ─── Core helpers ────────────────────────────────────────────────────────────

/** Get RGBA of pixel (x,y) in reference */
function refPx(x, y) {
  const i = (Math.max(0,Math.min(RH-1,y)) * RW + Math.max(0,Math.min(RW-1,x))) * 4;
  return [ref.data[i], ref.data[i+1], ref.data[i+2], ref.data[i+3]];
}

/** Extract a region from ref as a new PNG (RGBA) */
function extract(sx, sy, sw, sh) {
  const out = new PNG({ width: sw, height: sh, filterType: -1 });
  out.data.fill(0);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const [r,g,b,a] = refPx(sx+x, sy+y);
      const di = (y*sw+x)*4;
      out.data[di]=r; out.data[di+1]=g; out.data[di+2]=b; out.data[di+3]=a;
    }
  }
  return out;
}

/** Nearest-neighbour resize */
function resize(src, dw, dh) {
  const out = new PNG({ width: dw, height: dh, filterType: -1 });
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(src.width -1, Math.floor(x * src.width  / dw));
      const sy = Math.min(src.height-1, Math.floor(y * src.height / dh));
      const si = (sy * src.width + sx) * 4;
      const di = (y  * dw        + x)  * 4;
      out.data[di]=src.data[si]; out.data[di+1]=src.data[si+1];
      out.data[di+2]=src.data[si+2]; out.data[di+3]=src.data[si+3];
    }
  }
  return out;
}

/** Blit sprite onto atlas at (dx,dy) */
function blit(atlas, sprite, dx, dy) {
  for (let y = 0; y < sprite.height; y++) {
    for (let x = 0; x < sprite.width; x++) {
      const ax = dx+x, ay = dy+y;
      if (ax >= atlas.width || ay >= atlas.height || ax < 0 || ay < 0) continue;
      const si = (y*sprite.width+x)*4;
      const di = (ay*atlas.width+ax)*4;
      atlas.data[di]=sprite.data[si]; atlas.data[di+1]=sprite.data[si+1];
      atlas.data[di+2]=sprite.data[si+2]; atlas.data[di+3]=sprite.data[si+3];
    }
  }
}

/** Create blank RGBA atlas */
function mkAtlas(w, h) {
  const a = new PNG({ width: w, height: h, filterType: -1 });
  a.data.fill(0);
  return a;
}

/** Save PNG to public/assets/ */
function save(png, name) {
  const p = path.join(OUT, name);
  fs.writeFileSync(p, PNG.sync.write(png));
  console.log(`✓ ${name}  ${png.width}×${png.height}`);
}

/** Remove dark background (ref bg ≈ rgb 18,18,18) → transparent */
function removeDarkBg(png) {
  for (let i = 0; i < png.data.length; i += 4) {
    const r=png.data[i], g=png.data[i+1], b=png.data[i+2];
    if (r < 42 && g < 42 && b < 42) png.data[i+3] = 0;
  }
  return png;
}

/** Tight dark-bg removal — only removes true background (≤20), preserves near-dark sprites */
function removeDarkBgTight(png) {
  for (let i = 0; i < png.data.length; i += 4) {
    const r=png.data[i], g=png.data[i+1], b=png.data[i+2];
    if (r <= 20 && g <= 20 && b <= 20) png.data[i+3] = 0;
  }
  return png;
}

/** Remove light checkered background (trees) → transparent */
function removeLightBg(png) {
  for (let i = 0; i < png.data.length; i += 4) {
    const r=png.data[i], g=png.data[i+1], b=png.data[i+2];
    const hi=Math.max(r,g,b), lo=Math.min(r,g,b);
    if (r > 185 && g > 185 && b > 185 && (hi-lo) < 35) png.data[i+3] = 0;
  }
  return png;
}

/** Remove golden section-label text → transparent.
 *  Label text: warm yellow r=165-240, g=115-220, b=70-135. r-b always >55.
 *  Building/tree sprite pixels are cooler/darker (r<160 typically). */
function removeGoldenLabel(png) {
  for (let i = 0; i < png.data.length; i += 4) {
    const r=png.data[i], g=png.data[i+1], b=png.data[i+2];
    if (r > 165 && g > 115 && (r - b) > 55 && r > b * 1.4) png.data[i+3] = 0;
  }
  return png;
}

// ─── 1. TERRAIN ATLAS (256×96) ───────────────────────────────────────────────
// 8 cols × 3 rows, each tile 32×32.
// Source position confirmed by pixel scanning:
//   Col x-starts: 23, 85, 147, 209, 271, 333, 395, 457  (53 px wide each)
//   Row y-starts: 112, 198, 285                          (57 px tall each)
//
// Row 0: GRASS1  GRASS2  GRASS3  DIRT1   DIRT2   SAND1   SAND2   STONE1
// Row 1: STONE2  STONE3  WATER1  WATER2  WATER3  ROAD1   ROAD2   WOODFLOOR
// Row 2: FFLOOR  MTN1    MTN2    SNOW1   SNOW2   BRIDGE1 BRIDGE2 STAIRS

const T_COLS = [23, 85, 147, 209, 271, 333, 395, 457];
const T_ROWS = [112, 198, 285];
const T_SW = 53, T_SH = 57, TILE = 32;

;(() => {
  const atlas = mkAtlas(8*TILE, 3*TILE);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      const raw = extract(T_COLS[c], T_ROWS[r], T_SW, T_SH);
      blit(atlas, resize(raw, TILE, TILE), c*TILE, r*TILE);
    }
  }
  save(atlas, 'terrain-atlas.png');
})();

// ─── 2. BUILDINGS ATLAS (512×256) ────────────────────────────────────────────
// Row 0 (y=0):
//   x=0   : Large Building 128×128  (src bbox 524,71  w=196 h=184)
//   x=128 : Medium Building 96×96  (src bbox 710,82  w=133 h=163)
//   x=224 : House 64×64            (src bbox 880,98  w=105 h=127)
//   x=288 : Gate 64×64             (src bbox 475,255 w=50  h=105)
//   x=352 : (padding)
//
// Row 1 (y=128):
//   x=0   : Well 32×32             (src 540,279 w=45 h=81)
//   x=32  : Shrine 48×48           (src 595,255 w=50 h=105)
//   x=80  : Lantern 16×32          (src 655,287 w=50 h=73)
//   x=96  : Sign 16×32             (src 715,292 w=50 h=68)
//   x=112 : Fence 32×32            (src 765,255 w=41 h=105)
//   x=144 : Bridge 64×32           (src 883,255 w=42 h=105)

;(() => {
  const atlas = mkAtlas(512, 256);

  // Extract, remove dark bg AND golden label text, resize, blit
  const place = (sx,sy,sw,sh, dx,dy, dw,dh) =>
    blit(atlas, removeGoldenLabel(removeDarkBg(resize(extract(sx,sy,sw,sh), dw,dh))), dx, dy);

  // Row 0 — major buildings.
  // sy=93 skips the golden section-header band that sits at y=71-92.
  // sh=148 ends at y=240 (same endpoint) so no caption bleed-through.
  place(524, 93,  200, 148,   0,  0, 128, 128);  // Large Building
  place(710, 93,  155, 148, 128,  0,  96,  96);  // Medium Building
  place(865, 93,   65, 148, 224,  0,  64,  64);  // House (sw=65: x=865-929, avoids "3D FLOOR" label at x=930+)
  // sy=268 skips annotation band that sits at y=240-267 above props section.
  place(475, 268,  52,  87, 288,  0,  64,  64);  // Gate

  // Row 1 — architectural props (sy=270 skips label band y=258-269)
  place(540, 270,  50,  85,   0, 128,  32,  32); // Well
  place(595, 270,  55,  85,  32, 128,  48,  48); // Shrine
  place(655, 272,  55,  78,  80, 128,  16,  32); // Lantern
  place(715, 277,  55,  73,  96, 128,  16,  32); // Sign
  place(765, 270,  46,  85, 112, 128,  32,  32); // Fence
  place(883, 270,  47,  85, 144, 128,  64,  32); // Bridge

  save(atlas, 'buildings-atlas.png');
})();

// ─── 3. CHARACTERS ATLAS (160×192) ───────────────────────────────────────────
// 5 character types × 4 directions.
// Atlas cols = character index (0-4), atlas rows = direction (0=DOWN 1=LEFT 2=RIGHT 3=UP).
// Each cell: 32×48.
//
// Source: Characters section x=1038..1247, y=112..387
//   Col starts (42 px each): 1038, 1080, 1122, 1164, 1206
//   Row starts (68 px each): 112, 182, 252, 322  (DOWN, LEFT, RIGHT, UP)

const CH_COLS = [1038, 1080, 1122, 1164, 1206];
const CH_ROWS = [112, 182, 252, 322];
const CH_SW = 42, CH_SH = 68;

;(() => {
  const atlas = mkAtlas(5*32, 4*48);
  for (let d = 0; d < 4; d++) {
    for (let c = 0; c < 5; c++) {
      const raw = extract(CH_COLS[c], CH_ROWS[d], CH_SW, CH_SH);
      removeDarkBg(raw);
      blit(atlas, resize(raw, 32, 48), c*32, d*48);
    }
  }
  save(atlas, 'characters-atlas.png');
})();

// ─── 4. TREES ATLAS (384×96) ─────────────────────────────────────────────────
// Single row, bottom-aligned. Trees have light/checkered background → remove.
//
// Sprite sizes and source positions (from pixel scanning):
//   Small  32×48  src(14,  408, 74,  122)  atlas x=0
//   Medium 64×64  src(90,  400, 100, 135)  atlas x=32
//   Large  96×96  src(185, 395, 135, 143)  atlas x=96
//   Pine   64×96  src(310, 395, 90,  143)  atlas x=192
//   Bamboo 64×96  src(393, 395, 70,  143)  atlas x=256
//   Cherry 64×64  src(455, 400, 85,  140)  atlas x=320

// Start all trees at y=370 (above the golden section label at y=408-418).
// removeLightBg removes checkered background; removeGoldenLabel removes section label text.
// sy=419 skips the dark golden-label header band at y=408-418.
// sh=115 ends at y=533, before the white-on-dark label band at y=534-560.
const TREES = [
  { sx:13,  sy:419, sw:76,  sh:115, dw:32, dh:48,  ax:0   },  // Small
  { sx:88,  sy:419, sw:111, sh:115, dw:64, dh:64,  ax:32  },  // Medium
  { sx:180, sy:419, sw:156, sh:115, dw:96, dh:96,  ax:96  },  // Large
  { sx:305, sy:419, sw:96,  sh:115, dw:64, dh:96,  ax:192 },  // Pine
  { sx:388, sy:419, sw:68,  sh:115, dw:64, dh:96,  ax:256 },  // Bamboo
  { sx:450, sy:419, sw:91,  sh:115, dw:64, dh:64,  ax:320 },  // Cherry
];

;(() => {
  const atlas = mkAtlas(384, 96);
  for (const t of TREES) {
    const raw = removeGoldenLabel(removeLightBg(extract(t.sx, t.sy, t.sw, t.sh)));
    blit(atlas, resize(raw, t.dw, t.dh), t.ax, 96 - t.dh);  // bottom-align
  }
  save(atlas, 'trees-atlas.png');
})();

// ─── 5. PROPS ATLAS (224×128) ────────────────────────────────────────────────
// Row 0 (y=0, h=64):
//   PedraP 16×16  sx=475,390 sw=60,sh=65   ax=0
//   PedraM 32×32  sx=525,388 sw=75,sh=34   ax=16
//   PedraG 64×64  sx=590,390 sw=85,sh=80   ax=48
//   Toco   32×32  sx=657,390 sw=73,sh=65   ax=112
//   Flores 16×16  sx=718,407 sw=59,sh=51   ax=144
//   Capim  16×16  sx=770,407 sw=65,sh=51   ax=160
//
// Row 1 (y=64, h=64):
//   Caixa    32×32  sx=475,460 sw=50,sh=70   ax=0
//   Barril   32×32  sx=524,455 sw=59,sh=80   ax=32
//   Vaso     32×32  sx=580,455 sw=70,sh=80   ax=64
//   Mesa     32×32  sx=640,455 sw=80,sh=80   ax=96
//   Banco    32×16  sx=710,465 sw=55,sh=44   ax=128
//   Fogueira 32×32  sx=786,455 sw=69,sh=85   ax=160

// Pixel-scan confirmed exact sprite bounds (no golden/white labels):
//   SmallRock x=554-573: sprite y=463-477 (15px tall)
//   MedRock   x=616-663: sprite y=446-477 (32px tall)
//   LargeProp x=687-764: sprite y=430-477 (48px tall)
//   SmallProp2 x=800-840: sprite y=439-477 (39px), golden labels mixed in y=440-459 → removeGoldenLabel
// White annotation labels at y=487-494 are excluded by these sh values (sprites end at y=477).
const PROPS_R0 = [
  { sx:554, sy:463, sw:20, sh:15, dw:16, dh:16, ax:0   },  // SmallRock
  { sx:616, sy:446, sw:48, sh:32, dw:32, dh:32, ax:16  },  // MedRock
  { sx:687, sy:430, sw:78, sh:48, dw:64, dh:48, ax:48  },  // LargeProp
  { sx:800, sy:439, sw:41, sh:39, dw:32, dh:32, ax:112 },  // SmallProp2
];

;(() => {
  const atlas = mkAtlas(224, 128);
  for (const p of PROPS_R0) {
    const raw = removeGoldenLabel(removeDarkBg(extract(p.sx, p.sy, p.sw, p.sh)));
    blit(atlas, resize(raw, p.dw, p.dh), p.ax, 64 - p.dh);  // bottom-align in row 0
  }
  save(atlas, 'props-atlas.png');
})();

// ─── 6. WATER ATLAS (320×96) ─────────────────────────────────────────────────
// Water tiles are in the terrain atlas (WATER1/2/3 at row 1, cols 2-4).
// This atlas adds the special water features: coasts, bridges, boat, dock, river tiles.
//
// Water section: x=10-555, y=695-870
// Row 0 (y=695-755, similar 53px-wide cells as terrain):
//   Água 1,2,3 (32×32)  Costa 1-4 (32×32)  Cachora (32×32)
// Row 1 (y=760-870):
//   Ponte Madeira (64×32)  Ponte Pedra (64×32)  Doca (64×32)  Barco (48×32)
//   Rio Curva (32×32)  Rio Esquina (32×32)  Rio Junção (32×32)
// Row 2: Lagoa 64×64

// Row 0 tile positions (same 53px × 57px cadence as terrain, starting x=23).
// Scan confirmed blue water tiles appear at y=648-705; label text at y=656-692
// is overlaid on them and will be removed by removeGoldenLabel.
const W_ROW0_Y = 648;
const W_TILES = [
  { col:0, name:'agua1'   }, { col:1, name:'agua2'   }, { col:2, name:'agua3'   },
  { col:3, name:'costa1'  }, { col:4, name:'costa2'  }, { col:5, name:'costa3'  },
  { col:6, name:'costa4'  }, { col:7, name:'cachora' },
];

// sy=760 is the start of bridge/dock sprites; sh=22 captures tops before annotation band at y=782+.
const W_ROW1 = [
  { sx:15,  sy:760, sw:100, sh:22, dw:64, dh:32, ax:0,   name:'ponte-madeira'  },
  { sx:120, sy:760, sw:100, sh:22, dw:64, dh:32, ax:64,  name:'ponte-pedra'    },
  { sx:225, sy:760, sw:100, sh:22, dw:64, dh:32, ax:128, name:'doca'           },
  { sx:323, sy:760, sw: 80, sh:22, dw:48, dh:32, ax:192, name:'barco'          },
  { sx:403, sy:760, sw: 53, sh:22, dw:32, dh:32, ax:240, name:'rio-curva'      },
  { sx:456, sy:760, sw: 53, sh:22, dw:32, dh:32, ax:272, name:'rio-esquina'    },
  { sx:509, sy:760, sw: 53, sh:22, dw:32, dh:32, ax:304, name:'rio-juncao'     },
];

;(() => {
  const atlas = mkAtlas(320, 128);

  // Row 0: tile-sized water features (golden label text cleaned up)
  for (let i = 0; i < W_TILES.length; i++) {
    const c = W_TILES[i].col;
    const raw = removeGoldenLabel(extract(T_COLS[c] ?? (23 + c * 62), W_ROW0_Y, T_SW, T_SH));
    blit(atlas, resize(raw, 32, 32), i * 32, 0);
  }

  // Row 1: bridges, dock, boat, river — remove dark bg + golden label text
  for (const w of W_ROW1) {
    const raw = removeGoldenLabel(removeDarkBg(extract(w.sx, w.sy, w.sw, w.sh)));
    blit(atlas, resize(raw, w.dw, w.dh), w.ax, 32);
  }

  save(atlas, 'water-atlas.png');
})();

// ─── 7. EFFECTS ATLAS (352×96) ───────────────────────────────────────────────
// Effects section: x=550-1035, y=675-870
// Sombra Árvore  64×64   sx≈552,680 sw≈85,sh≈85
// Sombra Prédio  96×96   sx≈640,675 sw≈125,sh≈95
// Névoa          64×64   sx≈770,680 sw≈85,sh≈85
// Raio de Sol    64×64   sx≈860,670 sw≈85,sh≈85
// Folhas         32×32   sx≈552,760 sw≈50,sh≈50
// Pétalas        32×32   sx≈605,760 sw≈50,sh≈50
// Faíscas        32×32   sx≈660,760 sw≈50,sh≈50
// Chuva          32×32   sx≈715,760 sw≈50,sh≈50

// Row 1 (ay=0): sy bumped +20 to skip top annotation labels; sh trimmed at bottom too.
// Row 2 (ay=64): sy=820+ to land below the water-section label zone at y=760-815.
const EFFECTS = [
  { sx:552,sy:700,sw:85,sh:50,  dw:64,dh:64, ax:0,  ay:0 },   // Sombra Arvore
  { sx:640,sy:695,sw:125,sh:55, dw:96,dh:96, ax:64, ay:0 },   // Sombra Predio
  { sx:770,sy:700,sw:85,sh:50,  dw:64,dh:64, ax:160,ay:0 },   // Nevoa
  { sx:860,sy:690,sw:85,sh:50,  dw:64,dh:64, ax:224,ay:0 },   // Raio Sol
  // Row 2 shifted to x=800+ to clear the water-section annotation zone at x<600.
  { sx:800,sy:820,sw:50,sh:40,  dw:32,dh:32, ax:0,  ay:64 },  // Folhas
  { sx:855,sy:820,sw:50,sh:40,  dw:32,dh:32, ax:32, ay:64 },  // Petalas
  { sx:910,sy:820,sw:50,sh:40,  dw:32,dh:32, ax:64, ay:64 },  // Faiscas
  { sx:965,sy:820,sw:50,sh:40,  dw:32,dh:32, ax:96, ay:64 },  // Chuva
];

;(() => {
  const atlas = mkAtlas(352, 96);
  for (const e of EFFECTS) {
    const raw = removeGoldenLabel(removeDarkBg(extract(e.sx, e.sy, e.sw, e.sh)));
    blit(atlas, resize(raw, e.dw, e.dh), e.ax, e.ay);
  }
  save(atlas, 'effects-atlas.png');
})();

console.log('\nAll atlases written to public/assets/');
