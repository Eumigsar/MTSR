/**
 * scan-props.cjs
 * Find exact column groups for nature props (rocks, barrels, etc.)
 * in the region x=541-840, y=390-560 (after cherry tree ends at x=540).
 * Also scans PROPS_R1 y=455-560 range.
 */
const fs = require('fs');
const { PNG } = require('/home/user/MTSR/node_modules/pngjs/lib/png.js');

const REF = '/root/.claude/uploads/6f9830c3-37f8-50ec-a95c-4a2d9f6fe5c3/544dbc20-32E42262C53B4262836999C8613B4E92.png';
const ref = PNG.sync.read(fs.readFileSync(REF));
const RW = ref.width, RH = ref.height;

function px(x, y) {
  const i = (Math.max(0,Math.min(RH-1,y))*RW + Math.max(0,Math.min(RW-1,x)))*4;
  return [ref.data[i], ref.data[i+1], ref.data[i+2], ref.data[i+3]];
}
function isDark(r,g,b) { return r<42 && g<42 && b<42; }
function isGolden(r,g,b) { return r>165 && g>115 && (r-b)>55 && r>b*1.4; }
function isLight(r,g,b) {
  const hi=Math.max(r,g,b), lo=Math.min(r,g,b);
  return r>185 && g>185 && b>185 && (hi-lo)<35;
}
function isSprite(r,g,b) { return !isDark(r,g,b) && !isGolden(r,g,b) && !isLight(r,g,b); }

// ─── Find sprite content in entire PROPS region ────────────────────────────
// First: what y range actually has sprite content in x=541-840?
console.log('=== Y range of props content (x=541-840) ===');
let firstY = -1, lastY = -1;
for (let y = 360; y <= 580; y++) {
  let count = 0;
  for (let x = 541; x < 840; x++) {
    const [r,g,b] = px(x, y);
    if (isSprite(r,g,b)) count++;
  }
  if (count > 3) {
    if (firstY < 0) firstY = y;
    lastY = y;
    process.stdout.write(`y=${y}(${count}) `);
  }
}
console.log(`\nFirst: ${firstY}, Last: ${lastY}`);

// ─── Column groups in the prop sprite area ────────────────────────────────
console.log('\n=== Column groups in x=541-840 (y range confirmed above) ===');
const Y0 = Math.max(360, firstY);
const Y1 = Math.min(580, lastY);
let inGroup = false, gx = -1;
for (let x = 541; x <= 840; x++) {
  let count = 0;
  for (let y = Y0; y <= Y1; y++) {
    const [r,g,b] = px(x, y);
    if (isSprite(r,g,b)) count++;
  }
  if (count > 0 && !inGroup) { inGroup = true; gx = x; }
  else if (count === 0 && inGroup) {
    inGroup = false;
    console.log(`  x=${gx}..${x-1}  w=${x-gx}`);
    // sample from middle of this group
    const mx = Math.round((gx + x - 1) / 2);
    let fy = -1, ly = -1;
    for (let y = Y0; y <= Y1; y++) {
      const [r,g,b] = px(mx, y);
      if (isSprite(r,g,b)) { if (fy<0) fy=y; ly=y; }
    }
    if (fy >= 0) console.log(`    sprite y=${fy}..${ly} h=${ly-fy+1} at mid-x=${mx}`);
  }
}
if (inGroup) {
  console.log(`  x=${gx}..840  w=${840-gx+1}`);
}

// ─── Row-by-row detail for PROPS_R0 (upper props, rocks/stumps y=390-460) ──
console.log('\n=== Row 0 detailed (x=541-840, y=380-480) ===');
for (let y = 380; y <= 480; y++) {
  let wh = 0, sp = 0, gld = 0;
  for (let x = 541; x < 840; x++) {
    const [r,g,b] = px(x, y);
    if (isLight(r,g,b)) wh++;
    else if (isGolden(r,g,b)) gld++;
    else if (isSprite(r,g,b)) sp++;
  }
  if (sp > 0 || gld > 0) {
    process.stdout.write(`y=${y}(sp:${sp} g:${gld}) `);
  }
}
console.log();

// ─── Row-by-row detail for PROPS_R1 (lower props, barrels/vases y=455-560) ─
console.log('\n=== Row 1 detailed (x=475-840, y=450-565) ===');
for (let y = 450; y <= 565; y++) {
  let sp = 0, gld = 0;
  for (let x = 475; x < 840; x++) {
    const [r,g,b] = px(x, y);
    if (isGolden(r,g,b)) gld++;
    else if (isSprite(r,g,b)) sp++;
  }
  if (sp > 0 || gld > 0) {
    process.stdout.write(`y=${y}(sp:${sp} g:${gld}) `);
  }
}
console.log();

// ─── Col groups for PROPS_R1 (y=455-560, x=475-840) ─────────────────────
console.log('\n=== Column groups for Row 1 props (x=475-840, y=455-560) ===');
inGroup = false; gx = -1;
for (let x = 475; x <= 840; x++) {
  let count = 0;
  for (let y = 455; y <= 560; y++) {
    const [r,g,b] = px(x, y);
    if (isSprite(r,g,b)) count++;
  }
  if (count > 0 && !inGroup) { inGroup = true; gx = x; }
  else if (count === 0 && inGroup) {
    inGroup = false;
    const mx = Math.round((gx + x - 1) / 2);
    let fy = -1, ly = -1;
    for (let y = 455; y <= 560; y++) {
      const [r,g,b] = px(mx, y);
      if (isSprite(r,g,b)) { if (fy<0) fy=y; ly=y; }
    }
    console.log(`  x=${gx}..${x-1} w=${x-gx}  sprite-y=${fy}..${ly} h=${fy>=0?ly-fy+1:0}`);
  }
}
if (inGroup) console.log(`  x=${gx}..840 w=${840-gx+1}`);
