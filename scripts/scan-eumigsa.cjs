/**
 * scan-eumigsa.cjs — Map section boundaries and sprite positions
 * in 2df6dca8 spec sheet (EUMIGSA RPG ASSETS v1.0)
 */
const fs = require('fs');
const { PNG } = require('/home/user/MTSR/node_modules/pngjs/lib/png.js');

const REF = '/root/.claude/uploads/6f9830c3-37f8-50ec-a95c-4a2d9f6fe5c3/2df6dca8-D2D90596A75B418EB5FCCE1D28C9BCD3.png';
const ref = PNG.sync.read(fs.readFileSync(REF));
const W = ref.width, H = ref.height;
console.log(`=== Image: ${W} × ${H} ===\n`);

function px(x, y) {
  const i = (Math.max(0, Math.min(H-1, y)) * W + Math.max(0, Math.min(W-1, x))) * 4;
  return [ref.data[i], ref.data[i+1], ref.data[i+2], ref.data[i+3]];
}

const isLight = (r,g,b) => r > 200 && g > 200 && b > 200;
const isDark  = (r,g,b) => r < 60  && g < 60  && b < 60;
const isSprite = (r,g,b) => !isLight(r,g,b) && !isDark(r,g,b);

// ── Find horizontal section dividers (full-width dark rows) ──────────────────
console.log('=== Horizontal dark-band positions (section dividers) ===');
for (let y = 0; y < H; y++) {
  let darkCount = 0;
  for (let x = 0; x < W; x += 4) {
    const [r,g,b] = px(x, y);
    if (isDark(r,g,b)) darkCount++;
  }
  const pct = darkCount / (W / 4);
  if (pct > 0.70) console.log(`  y=${y}: ${(pct*100).toFixed(0)}% dark`);
}

// ── Find vertical section dividers ──────────────────────────────────────────
console.log('\n=== Vertical dark-band positions (column dividers) ===');
for (let x = 0; x < W; x++) {
  let darkCount = 0;
  for (let y = 0; y < H; y += 4) {
    const [r,g,b] = px(x, y);
    if (isDark(r,g,b)) darkCount++;
  }
  const pct = darkCount / (H / 4);
  if (pct > 0.70) console.log(`  x=${x}: ${(pct*100).toFixed(0)}% dark`);
}

// ── Sample key areas to understand section layout ────────────────────────────
console.log('\n=== Row content overview (sprite pixel count per y, sampling each 10px) ===');
for (let y = 0; y < H; y += 10) {
  let sp = 0, lt = 0, dk = 0;
  for (let x = 0; x < W; x += 4) {
    const [r,g,b] = px(x, y);
    if (isSprite(r,g,b)) sp++;
    else if (isLight(r,g,b)) lt++;
    else dk++;
  }
  if (sp > 5) console.log(`  y=${y}: sprite=${sp} light=${lt} dark=${dk}`);
}

// ── Characters section: find where characters start (expect 12 columns of sprites) ─
console.log('\n=== Characters section — column groups (y=60, scanning full width) ===');
{
  let inGrp = false, gx = -1;
  const Y_MID = 100; // approximate middle of first character row
  for (let x = 0; x < W / 2; x++) {
    let count = 0;
    for (let y = Y_MID; y <= Y_MID + 48; y++) {
      const [r,g,b] = px(x, y);
      if (isSprite(r,g,b)) count++;
    }
    if (count >= 2 && !inGrp) { inGrp = true; gx = x; }
    else if (count < 2 && inGrp) {
      inGrp = false;
      console.log(`  char col: x=${gx}..${x-1} w=${x-gx}`);
    }
  }
}

// ── Find sprite bounding boxes in each quadrant ──────────────────────────────
// Sample all 4 corners of the main content area
const QUADS = [
  { name: 'TOP-LEFT (chars)',     x0:0,    y0:30,   x1: W/2,  y1: H*0.45 },
  { name: 'TOP-MID (nature)',     x0: W/3, y0:30,   x1: W*2/3,y1: H*0.45 },
  { name: 'TOP-RIGHT (buildings)',x0: W*2/3, y0:30, x1: W,    y1: H*0.45 },
  { name: 'BOT-LEFT (props)',     x0:0,    y0:H*0.45,x1:W/3,  y1: H*0.75 },
  { name: 'BOT-MID (terrain)',    x0:W/3,  y0:H*0.45,x1:W*2/3,y1: H*0.75 },
  { name: 'BOT-RIGHT (effects)',  x0:W*2/3,y0:H*0.45,x1:W,    y1: H*0.75 },
];

for (const q of QUADS) {
  let minX=W, maxX=0, minY=H, maxY=0, total=0;
  for (let y = Math.round(q.y0); y < Math.round(q.y1); y++) {
    for (let x = Math.round(q.x0); x < Math.round(q.x1); x++) {
      const [r,g,b] = px(x, y);
      if (isSprite(r,g,b)) {
        total++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (total > 0)
    console.log(`\n${q.name}: sprite bounds x=${minX}..${maxX} y=${minY}..${maxY} total=${total}`);
}

// ── Detect header label rows (text lines above each section) ─────────────────
console.log('\n=== Rows with suspicious golden/dark text (label rows) ===');
for (let y = 0; y < H * 0.8; y++) {
  let goldenCount = 0;
  for (let x = 0; x < W; x += 3) {
    const [r,g,b] = px(x, y);
    if (r > 150 && g > 100 && b < 80 && r > b * 1.5) goldenCount++;
  }
  if (goldenCount > 3) console.log(`  y=${y}: ${goldenCount} golden pixels`);
}
