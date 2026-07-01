/**
 * extract-eumigsa.cjs — Extract all sprites from EUMIGSA RPG ASSETS v1.0 spec sheet.
 *
 * Produces 6 atlas PNG files in public/assets/:
 *   characters-atlas.png  (576×288)
 *   nature-atlas.png      (packed, ~512×384)
 *   buildings-atlas.png   (512×320)
 *   props-atlas.png       (512×256)
 *   terrain-atlas.png     (896×448 — 4×2 arrangement of 7×7 autotile @ 32×32 each)
 *   effects-atlas.png     (480×192)
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('/home/user/MTSR/node_modules/pngjs/lib/png.js');

const REF_PATH = '/root/.claude/uploads/6f9830c3-37f8-50ec-a95c-4a2d9f6fe5c3/2df6dca8-D2D90596A75B418EB5FCCE1D28C9BCD3.png';
const OUT_DIR  = '/home/user/MTSR/public/assets';

const ref = PNG.sync.read(fs.readFileSync(REF_PATH));
const RW = ref.width, RH = ref.height;
console.log(`Ref: ${RW}×${RH}`);

// ─── Pixel helpers ────────────────────────────────────────────────────────────
function rpx(x, y) {
  const i = (Math.max(0,Math.min(RH-1,y))*RW + Math.max(0,Math.min(RW-1,x)))*4;
  return [ref.data[i], ref.data[i+1], ref.data[i+2], ref.data[i+3]];
}
function cpx(png, x, y) {
  const i = (Math.max(0,Math.min(png.height-1,y))*png.width + Math.max(0,Math.min(png.width-1,x)))*4;
  return [png.data[i], png.data[i+1], png.data[i+2], png.data[i+3]];
}
function spx(png, x, y, r, g, b, a) {
  const i = (y*png.width + x)*4;
  png.data[i]=r; png.data[i+1]=g; png.data[i+2]=b; png.data[i+3]=a;
}

// Background colours in the spec sheet (parchment/white/label-gold)
function isBackground(r, g, b) {
  if (r > 210 && g > 210 && b > 210) return true;                   // white/light
  if (r > 150 && g > 115 && b < 90 && r - b > 50 && r > b * 1.5)   // golden label text
    return true;
  return false;
}

// ─── Core ops ─────────────────────────────────────────────────────────────────
function mkPNG(w, h) {
  const p = new PNG({ width: w, height: h, filterType: -1 });
  p.data.fill(0);
  return p;
}

// Crop a region from ref and return new PNG with background removed
function extract(sx, sy, sw, sh) {
  const out = mkPNG(sw, sh);
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++) {
      const [r,g,b,a] = rpx(sx+x, sy+y);
      spx(out, x, y, r, g, b, isBackground(r,g,b) ? 0 : 255);
    }
  return out;
}

// Find tight non-transparent bounding box
function bounds(png) {
  let mnX=png.width, mxX=-1, mnY=png.height, mxY=-1;
  for (let y=0; y<png.height; y++)
    for (let x=0; x<png.width; x++) {
      const i=(y*png.width+x)*4;
      if (png.data[i+3] > 0) {
        if(x<mnX)mnX=x; if(x>mxX)mxX=x;
        if(y<mnY)mnY=y; if(y>mxY)mxY=y;
      }
    }
  return mnX>mxX ? null : { x:mnX, y:mnY, w:mxX-mnX+1, h:mxY-mnY+1 };
}

// Nearest-neighbour resize
function resize(src, dw, dh) {
  const dst = mkPNG(dw, dh);
  const sw = src.width, sh = src.height;
  for (let dy=0; dy<dh; dy++)
    for (let dx=0; dx<dw; dx++) {
      const sx = Math.min(sw-1, Math.floor(dx*sw/dw));
      const sy = Math.min(sh-1, Math.floor(dy*sh/dh));
      const [r,g,b,a] = cpx(src, sx, sy);
      spx(dst, dx, dy, r, g, b, a);
    }
  return dst;
}

// Blit src into dst at (dx,dy)
function blit(dst, src, dx, dy) {
  for (let y=0; y<src.height; y++)
    for (let x=0; x<src.width; x++) {
      const [r,g,b,a] = cpx(src, x, y);
      if (a > 0 && dx+x < dst.width && dy+y < dst.height)
        spx(dst, dx+x, dy+y, r, g, b, a);
    }
}

// Extract + auto-crop to tight bounds + resize to target
function extractAndScale(sx, sy, sw, sh, tw, th) {
  const raw = extract(sx, sy, sw, sh);
  const bb  = bounds(raw);
  if (!bb) return mkPNG(tw, th);
  const tight = mkPNG(bb.w, bb.h);
  for (let y=0; y<bb.h; y++)
    for (let x=0; x<bb.w; x++) {
      const [r,g,b,a] = cpx(raw, bb.x+x, bb.y+y);
      spx(tight, x, y, r, g, b, a);
    }
  return resize(tight, tw, th);
}

function save(png, name) {
  const p = path.join(OUT_DIR, name);
  fs.writeFileSync(p, PNG.sync.write(png));
  console.log(`Saved ${name} (${png.width}×${png.height})`);
}

// ─── SECTION 01: CHARACTERS ───────────────────────────────────────────────────
// 12 characters = 2 sets × 6 chars
// Each char: 3 directions × 3 frames @ 32×48
// Atlas layout: 6 chars/row × 3 frames × 32 = 576 wide; 2 sets × 3 dirs × 48 = 288 tall
{
  const CHAR_SLOTS = [
    [17, 97], [106, 173], [192, 258], [281, 347], [373, 441], [471, 510],
  ];
  // Direction bands: [set1, set2]
  const DIR_BANDS = [
    [[66,115], [122,167], [173,217]],   // set 1
    [[276,319],[326,368], [376,420]],   // set 2
  ];
  const FRAME_W = 32, FRAME_H = 48;
  const atlas = mkPNG(576, 288);

  for (let set = 0; set < 2; set++) {
    for (let ci = 0; ci < 6; ci++) {
      const [sx0, sx1] = CHAR_SLOTS[ci];
      const slotW = sx1 - sx0 + 1;
      const frameSlotW = Math.floor(slotW / 3);

      for (let dir = 0; dir < 3; dir++) {
        const [sy0, sy1] = DIR_BANDS[set][dir];
        const slotH = sy1 - sy0 + 1;

        for (let fr = 0; fr < 3; fr++) {
          const fsx = sx0 + fr * frameSlotW;
          const fsw = (fr < 2) ? frameSlotW : (sx1 - fsx + 1);
          const sprite = extractAndScale(fsx, sy0, fsw, slotH, FRAME_W, FRAME_H);

          const ax = ci * 96 + fr * FRAME_W;
          const ay = set * 144 + dir * FRAME_H;
          blit(atlas, sprite, ax, ay);
        }
      }
    }
  }
  save(atlas, 'characters-atlas.png');
}

// ─── SECTION 02: NATURE ──────────────────────────────────────────────────────
// Trees (row 1: y=17..222), plants+rocks (row 2: y=236..431)
// Atlas layout: row of trees, then row of plants, then rocks
{
  // Trees — fixed bounds from scan
  const TREES = [
    { name:'SAKURA',   sx:513, sy:47,  sw:28,  sh:171, tw:48,  th:96  },
    { name:'BAMBU',    sx:566, sy:40,  sw:92,  sh:183, tw:48,  th:128 },
    { name:'PINHEIRO', sx:666, sy:47,  sw:91,  sh:176, tw:64,  th:96  },
    { name:'CARVALHO', sx:763, sy:47,  sw:98,  sh:176, tw:96,  th:128 },
  ];

  // Nature row 2: scan column groups
  // From scan: two large groups — left half has plants/small items, right half has rocks
  // Detailed group discovery for row 2
  const R2_Y0 = 236, R2_Y1 = 431;
  function colGroupsNature() {
    const groups = [];
    let inG=false, gx=-1, lastX=-1;
    for (let x=513; x<=978; x++) {
      let cnt=0;
      for (let y=R2_Y0; y<=R2_Y1; y++) {
        const [r,g,b]=rpx(x,y);
        if(!isBackground(r,g,b) && r < 200) cnt++;  // stricter: not even dark-grey
      }
      if (cnt>2 && !inG) { inG=true; gx=x; }
      else if (cnt<=2 && inG) {
        inG=false;
        const mx=Math.round((gx+lastX)/2);
        let fy=R2_Y1,ly=R2_Y0;
        for(let y=R2_Y0;y<=R2_Y1;y++){
          const[r,g,b]=rpx(mx,y);
          if(!isBackground(r,g,b)&&r<200){fy=Math.min(fy,y);ly=Math.max(ly,y);}
        }
        if(ly-fy+1>10) groups.push({x0:gx,x1:lastX,y0:fy,y1:ly});
      }
      let cnt2=0;
      for(let y=R2_Y0;y<=R2_Y1;y++){const[r,g,b]=rpx(x,y);if(!isBackground(r,g,b)&&r<200)cnt2++;}
      if(cnt2>2)lastX=x;
    }
    return groups;
  }
  const r2Grps = colGroupsNature();
  console.log('Nature row 2 groups:');
  r2Grps.forEach((g,i)=>console.log(`  grp${i}: x=${g.x0}..${g.x1} y=${g.y0}..${g.y1} w=${g.x1-g.x0+1} h=${g.y1-g.y0+1}`));

  // Assign nature row 2 sprites: expect ~9 sprites (5 plants + 4 rocks)
  // Target sizes: small plants 32×48, medium rocks 48×48, large rocks 64×64, cliffs 80×64
  const R2_TARGETS = [
    {tw:32,th:48},{tw:32,th:48},{tw:32,th:48},{tw:32,th:48},{tw:32,th:32},   // plants
    {tw:48,th:48},{tw:64,th:64},{tw:64,th:64},{tw:80,th:64},                 // rocks
  ];

  // Build nature atlas
  // Row 0: 4 trees (max height 128, y=0..127)
  // Row 1: plants (height 48, y=128..175)
  // Row 2: rocks  (height 64, y=176..239)
  const ATLAS_W = 512, ATLAS_H = 384;
  const nat = mkPNG(ATLAS_W, ATLAS_H);

  // Place trees at top
  let tx = 0;
  for (const t of TREES) {
    const spr = extractAndScale(t.sx, t.sy, t.sw, t.sh, t.tw, t.th);
    blit(nat, spr, tx, 128 - t.th); // bottom-align at y=128
    tx += t.tw + 4;
  }

  // Place plants and rocks from row 2 groups
  let px2 = 0, py2 = 136;  // plants start at y=136 (below trees)
  for (let i = 0; i < Math.min(r2Grps.length, R2_TARGETS.length); i++) {
    const g = r2Grps[i];
    const {tw,th} = R2_TARGETS[i];
    const spr = extractAndScale(g.x0, g.y0, g.x1-g.x0+1, g.y1-g.y0+1, tw, th);
    // New row after plants (i >= 5)
    if (i === 5) { px2 = 0; py2 = 208; }
    blit(nat, spr, px2, py2);
    px2 += tw + 4;
  }
  save(nat, 'nature-atlas.png');
}

// ─── SECTION 03: BUILDINGS ───────────────────────────────────────────────────
// Row 1 (y=65..188): Casa P (64×64), Casa M (96×96), Casa G (128×128)
// Row 2 (y=213..357): Templo (128×128), Pagoda (96×128), Portão Torii (64×64)
// Row 3 (y=405..451): Ponte Madeira, Ponte Pedra, Poço, Cerca, Lanterna
{
  const BLDS = [
    // [sx, sy, sw, sh, tw, th, ax, ay]  ax/ay = atlas position
    // Row 1 — houses
    [1004,74,  98, 115, 64,  64,  0,   0  ],
    [1142,74, 145, 107, 96,  96,  68,  0  ],
    [1318,74, 192, 113, 128, 128, 168, 0  ],
    // Row 2 — temple/pagoda/torii
    [ 993,213, 163, 145, 128, 128, 0,  132],
    [1190,213,  97, 143,  96, 128, 132,132],
    [1363,227, 113,  59,  64,  64, 232,196],   // Torii portal — narrower in source
    // Row 3 — bridges, well, fence, lantern
    [1001,412, 102,  39,  64,  32, 0,  268],
    [1138,410, 108,  38,  64,  32, 68, 268],
    [1280,410,  39,  41,  32,  32, 136,268],
    [1359,421,  54,  27,  32,  32, 172,268],
    [1462,405,  25,  45,  32,  48, 208,268],
  ];
  const bld = mkPNG(512, 320);
  for (const [sx,sy,sw,sh,tw,th,ax,ay] of BLDS) {
    const spr = extractAndScale(sx, sy, sw, sh, tw, th);
    blit(bld, spr, ax, ay);
  }
  save(bld, 'buildings-atlas.png');
}

// ─── SECTION 04: PROPS ───────────────────────────────────────────────────────
// 3 rows of props, 8 per row
// Row 1 y=527..567: BANCO CAIXA BARRIL VASO MESA CADEIRA PERGAMINHO LIVRO
// Row 2 y=620..665: SINALA POSTE ESTATUA BANDEIRA ALTAR VASO_GRANDE CAIXOTE SACO
// Row 3 y=716..753: CARRINHO BALDE CORREIO FOGUEIRA LAVANDERIA SINOS POTE FAROL_PEDRA
{
  const PROP_ROWS = [
    { y0:527, y1:567, props:[
      [19,71],[89,121],[154,184],[212,234],[261,309],[332,360],[390,425],[456,490]
    ]},
    { y0:620, y1:665, props:[
      [24,62],[93,117],[143,185],[212,242],[268,316],[341,373],[399,437],[461,490]
    ]},
    { y0:716, y1:753, props:[
      [17,62],[85,109],[143,169],[196,231],[257,315],[344,371],[404,429],[461,486]
    ]},
  ];
  const PROP_W = 48, PROP_H = 64;
  const PROPS_ACROSS = 8;
  const props = mkPNG(PROPS_ACROSS * PROP_W, 3 * PROP_H);

  for (let row = 0; row < PROP_ROWS.length; row++) {
    const { y0, y1, props: rp } = PROP_ROWS[row];
    for (let col = 0; col < rp.length; col++) {
      const [sx0, sx1] = rp[col];
      const spr = extractAndScale(sx0, y0, sx1-sx0+1, y1-y0+1, PROP_W, PROP_H);
      blit(props, spr, col * PROP_W, row * PROP_H);
    }
  }
  save(props, 'props-atlas.png');
}

// ─── SECTION 05: TERRAIN ─────────────────────────────────────────────────────
// 8 terrain types, each a 7×7 autotile block at ~14×12 px in spec
// Scaled to 32×32 per tile → each type = 224×224 atlas area
// Layout: 4 types per row, 2 rows → 896×448
{
  const TERRAIN_TYPES = [
    // [name, sx, sy, sw, sh]    row 1
    { name:'GRASS', sx:527, sy:529, sw:98, sh:83 },
    { name:'DIRT',  sx:641, sy:529, sw:95, sh:85 },
    { name:'STONE', sx:752, sy:528, sw:98, sh:82 },
    { name:'SAND',  sx:865, sy:528, sw:98, sh:86 },
    // row 2
    { name:'SNOW',  sx:527, sy:654, sw:97, sh:93 },
    { name:'WATER', sx:641, sy:654, sw:95, sh:93 },
    { name:'ROAD',  sx:752, sy:651, sw:98, sh:96 },
    { name:'LAVA',  sx:865, sy:651, sw:98, sh:96 },
  ];

  const TILE_COUNT = 7;   // 7×7 autotile
  const TILE_SZ    = 32;  // output tile size
  const TYPE_SZ    = TILE_COUNT * TILE_SZ;  // 224
  const terrain = mkPNG(4 * TYPE_SZ, 2 * TYPE_SZ);  // 896×448

  for (let ti = 0; ti < TERRAIN_TYPES.length; ti++) {
    const t = TERRAIN_TYPES[ti];
    const raw = extract(t.sx, t.sy, t.sw, t.sh);

    const col = ti % 4;
    const row = Math.floor(ti / 4);
    const atx = col * TYPE_SZ;
    const aty = row * TYPE_SZ;

    // Extract each of the 7×7 tiles from the raw block
    const srcTileW = t.sw / TILE_COUNT;
    const srcTileH = t.sh / TILE_COUNT;

    for (let tr = 0; tr < TILE_COUNT; tr++) {
      for (let tc = 0; tc < TILE_COUNT; tc++) {
        const tsx = Math.round(tc * srcTileW);
        const tsy = Math.round(tr * srcTileH);
        const tsw = Math.round(srcTileW);
        const tsh = Math.round(srcTileH);

        // Crop tile from raw block
        const tile = mkPNG(tsw, tsh);
        for (let y=0; y<tsh; y++)
          for (let x=0; x<tsw; x++) {
            const [r,g,b,a]=cpx(raw, tsx+x, tsy+y);
            spx(tile, x, y, r, g, b, a);
          }

        // Scale tile to 32×32
        const scaledTile = resize(tile, TILE_SZ, TILE_SZ);
        blit(terrain, scaledTile, atx + tc*TILE_SZ, aty + tr*TILE_SZ);
      }
    }
    process.stdout.write(`terrain ${t.name} done. `);
  }
  console.log('');
  save(terrain, 'terrain-atlas.png');
}

// ─── SECTION 06: EFFECTS ─────────────────────────────────────────────────────
// Row 1 (y=541..605): NEBLINA FOLHAS PÉTALAS CHUVA NEVE RAIO_DE_SOL
// Row 2 (y=670..744): FAÍSCAS FOGO POEIRA LUZ_MÍSTICA ÁGUA_BORBOLHANDO FOGO_AZUL
{
  const EFF_ROWS = [
    { y0:541, y1:605, groups:[
      [997,1065],[1094,1150],[1180,1241],[1273,1326],[1359,1413],[1445,1507]
    ]},
    { y0:670, y1:744, groups:[
      [996,1068],[1085,1145],[1162,1230],[1248,1318],[1347,1409],[1448,1506]
    ]},
  ];
  const EFF_W = 80, EFF_H = 80;
  const eff = mkPNG(6 * EFF_W, 2 * EFF_H);

  for (let row = 0; row < EFF_ROWS.length; row++) {
    const { y0, y1, groups } = EFF_ROWS[row];
    for (let col = 0; col < groups.length; col++) {
      const [sx0, sx1] = groups[col];
      const spr = extractAndScale(sx0, y0, sx1-sx0+1, y1-y0+1, EFF_W, EFF_H);
      blit(eff, spr, col * EFF_W, row * EFF_H);
    }
  }
  save(eff, 'effects-atlas.png');
}

console.log('\nAll atlases extracted successfully!');
