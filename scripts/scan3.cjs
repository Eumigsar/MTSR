/**
 * scan3.cjs – Find precise sprite boundaries in the buildings section,
 * and identify annotation label colors/positions so we can crop them out.
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
const isDark = (r,g,b) => r<42 && g<42 && b<42;

// ─── Find the "BUILDINGS" header position ────────────────────────────────────
// Scan a wide x range, low y, for bright non-dark pixels that look like header text
console.log('=== Looking for header text "BUILDINGS" above y=80 ===');
for (let y = 0; y <= 75; y++) {
  let count = 0;
  const samples = [];
  for (let x = 400; x < 1100; x++) {
    const [r,g,b] = px(x, y);
    if (!isDark(r,g,b)) {
      count++;
      if (samples.length < 6) samples.push(`x${x}:(${r},${g},${b})`);
    }
  }
  if (count > 3) console.log(`  y=${y}: ${count} bright pixels — ${samples.join(' ')}`);
}

// ─── Look for "LARGE BUILDING 128×128" text label ────────────────────────────
// This label appears somewhere in or near the large building extraction area.
// Let's scan the building region x=480-730, y=71-350 for rows with MANY bright pixels
// that look like text (high uniform brightness)
console.log('\n=== Rows with annotation-like text in building region (x=524-724) ===');
for (let y = 71; y <= 350; y++) {
  let whitePx = 0, brightPx = 0, spriteColor = 0;
  for (let x = 524; x < 724; x++) {
    const [r,g,b] = px(x, y);
    if (isDark(r,g,b)) continue;
    // White/near-white text: all channels high
    if (r > 190 && g > 190 && b > 190) whitePx++;
    // Bright but non-white: could be golden text or building highlight
    else if (r > 160) brightPx++;
    // Normal sprite color (r<160): building tiles, walls, etc
    else spriteColor++;
  }
  const total = whitePx + brightPx + spriteColor;
  if (total > 0 && (whitePx > 3 || (whitePx > 0 && spriteColor < 5))) {
    // Suspicious: lots of white pixels with little building color = text annotation
    console.log(`  y=${y}: white=${whitePx} bright=${brightPx} sprite=${spriteColor} ← SUSPECT LABEL`);
  } else if (total > 10 && spriteColor > 10) {
    // Normal building content
    // just print a summary
  }
}

// ─── Find where the large building sprite ACTUALLY ends ─────────────────────
console.log('\n=== Large building content per row (x=524-650) ===');
let inContent = false, lastContentRow = 71;
for (let y = 71; y <= 350; y++) {
  let spriteCount = 0;
  for (let x = 524; x < 650; x++) {
    const [r,g,b] = px(x, y);
    // Building sprite pixels: non-dark, not too bright (building colors: r<200 usually)
    if (!isDark(r,g,b) && !(r>190 && g>190 && b>190)) {
      spriteCount++;
    }
  }
  if (spriteCount > 5) {
    lastContentRow = y;
    if (!inContent) { inContent = true; }
  } else if (inContent && spriteCount === 0) {
    inContent = false;
  }
  if (spriteCount > 0) {
    process.stdout.write(`y=${y}(${spriteCount}) `);
  }
}
console.log('\nLast sprite row:', lastContentRow);

// ─── Look for white label text BELOW the building sprites ────────────────────
console.log('\n=== White text rows below building in x=524-700 ===');
for (let y = 200; y <= 340; y++) {
  let wh = 0;
  for (let x = 524; x < 700; x++) {
    const [r,g,b] = px(x, y);
    if (r > 200 && g > 200 && b > 200) wh++;
  }
  if (wh > 2) {
    const sample = [];
    for (let x=524; x<700; x+=20) {
      const [r,g,b]=px(x,y);
      if (!isDark(r,g,b)) sample.push(`x${x}:(${r},${g},${b})`);
    }
    console.log(`  y=${y}: ${wh} white-ish pixels — ${sample.slice(0,5).join(' ')}`);
  }
}

// ─── Check what's at the TOP of the buildings atlas (y=71-80 in source) ──────
console.log('\n=== Source pixels at y=50-75, x=470-750 (looking for large header) ===');
for (let y = 35; y <= 75; y++) {
  const hits = [];
  for (let x = 470; x <= 750; x += 5) {
    const [r,g,b] = px(x,y);
    if (!isDark(r,g,b)) hits.push(`x${x}:(${r},${g},${b})`);
  }
  if (hits.length > 0) console.log(`  y=${y}: ${hits.join(' ')}`);
}

// ─── Check the buildings-atlas output region more carefully ──────────────────
// The buildings-atlas.png was written to public/assets. Read it back to see actual pixels.
const ATLAS = '/home/user/MTSR/public/assets/buildings-atlas.png';
const atlas = PNG.sync.read(fs.readFileSync(ATLAS));
const AW = atlas.width, AH = atlas.height;

function apx(x, y) {
  const i = (Math.max(0,Math.min(AH-1,y))*AW + Math.max(0,Math.min(AW-1,x)))*4;
  return [atlas.data[i], atlas.data[i+1], atlas.data[i+2], atlas.data[i+3]];
}

console.log('\n=== Buildings atlas TOP rows (what\'s visible in atlas rows 0-15) ===');
for (let ay = 0; ay <= 20; ay++) {
  const whites = [], goldens = [], others = [];
  for (let ax = 0; ax < 130; ax++) {
    const [r,g,b,a] = apx(ax, ay);
    if (a === 0) continue;  // transparent
    if (r>200 && g>200 && b>200) whites.push(`x${ax}:(${r},${g},${b})`);
    else if (r>170 && g>120 && b<110 && r>b*1.5) goldens.push(`x${ax}:(${r},${g},${b})`);
    else if (r>30) others.push(`x${ax}:(${r},${g},${b})`);
  }
  if (whites.length+goldens.length+others.length > 0) {
    console.log(`  atlas y=${ay}: white=${whites.length} golden=${goldens.length} other=${others.length}`);
    if (whites.length > 0) console.log(`    whites: ${whites.slice(0,4).join(' ')}`);
    if (goldens.length > 0) console.log(`    goldens: ${goldens.slice(0,4).join(' ')}`);
    if (others.length > 0) console.log(`    others: ${others.slice(0,4).join(' ')}`);
  }
}

// Scan the full atlas for rows that look like text (many white pixels in a row)
console.log('\n=== Buildings atlas: rows with suspicious white text ===');
for (let ay = 0; ay < AH; ay++) {
  let wh = 0;
  for (let ax = 0; ax < AW; ax++) {
    const [r,g,b,a] = apx(ax, ay);
    if (a > 0 && r > 200 && g > 200 && b > 200) wh++;
  }
  if (wh > 3) console.log(`  atlas y=${ay}: ${wh} white pixels`);
}
