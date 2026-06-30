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
function isGolden(r,g,b) { return r>150 && g>100 && b<80 && r>b*2; }

// ─── Find water section tiles ────────────────────────────────────────────────
console.log('=== WATER SECTION detailed scan ===');
console.log('Scanning x=23 (col0), y=600-720:');
for (let y = 600; y <= 720; y++) {
  const [r,g,b] = px(40, y); // midpoint of first tile column
  const dark = isDark(r,g,b);
  const gold = isGolden(r,g,b);
  if (!dark) console.log(`  y=${y}: rgb(${r},${g},${b}) ${gold?'[GOLDEN]':''}`);
}

// Find where the main water tile section actually starts
// Check the exact y position where the terrain section 3rd row ends vs water section
console.log('\n=== Terrain row positions check ===');
console.log('Row 2 (y=285) col0 sample:');
for (let y=280; y<=310; y++) {
  const [r,g,b] = px(40, y);
  if (!isDark(r,g,b)) console.log(`  y=${y}: rgb(${r},${g},${b})`);
}

// ─── Find water row 0 actual position ────────────────────────────────────────
console.log('\n=== Water tile grid scan (looking for repeating 53-wide pattern) ===');
// From visual analysis, water tiles should start around y=635-660
// Let's find where a row of 8 tiles exists with non-dark content
for (let y = 600; y <= 760; y++) {
  let tileCount = 0;
  const T_COLS = [23, 85, 147, 209, 271, 333, 395, 457];
  for (const tx of T_COLS) {
    let hasPx = false;
    for (let dx = 0; dx < 53; dx++) {
      const [r,g,b] = px(tx+dx, y);
      if (!isDark(r,g,b)) { hasPx = true; break; }
    }
    if (hasPx) tileCount++;
  }
  if (tileCount >= 4) {
    const sample = T_COLS.map(tx => { const [r,g,b]=px(tx+26,y); return `(${r},${g},${b})`; });
    console.log(`  y=${y}: ${tileCount}/8 tiles have content — ${sample.slice(0,4).join(' ')}`);
  }
}

// ─── Exact building sprite boundaries ────────────────────────────────────────
console.log('\n=== BUILDING SPRITE: Row-by-row golden check in x=524-720 ===');
for (let y=60; y<=270; y+=1) {
  let goldenCount=0, spriteCount=0;
  for (let x=524; x<=720; x++) {
    const [r,g,b] = px(x,y);
    if (isGolden(r,g,b)) goldenCount++;
    else if (!isDark(r,g,b)) spriteCount++;
  }
  if (goldenCount > 0 || (spriteCount > 0 && y <= 100)) {
    console.log(`  y=${y}: golden=${goldenCount} sprite=${spriteCount}`);
  }
}

// ─── Find exact bounds for all 3 buildings ────────────────────────────────────
console.log('\n=== Building 1 (large) exact scan — x=480-730 ===');
{
  let fy=-1, ly=-1;
  for (let y=50; y<=290; y++) {
    let hasSp = false;
    for (let x=480; x<730; x++) {
      const [r,g,b]=px(x,y);
      if (!isDark(r,g,b) && !isGolden(r,g,b)) { hasSp=true; break; }
    }
    if (hasSp) { if(fy<0) fy=y; ly=y; }
  }
  let lx=-1, rx=-1;
  for (let x=480; x<730; x++) {
    for (let y=fy; y<=ly; y++) {
      const [r,g,b]=px(x,y);
      if (!isDark(r,g,b) && !isGolden(r,g,b)) { if(lx<0) lx=x; rx=x; break; }
    }
  }
  console.log(`  Sprite rows: y=${fy}..${ly} h=${ly-fy+1}`);
  console.log(`  Sprite cols: x=${lx}..${rx} w=${rx-lx+1}`);
  console.log(`  Suggested extraction: (${lx}, ${fy}, ${rx-lx+1}, ${ly-fy+1})`);
}

console.log('\n=== Building 2 (medium) exact scan — x=700-870 ===');
{
  let fy=-1, ly=-1;
  for (let y=50; y<=290; y++) {
    let hasSp = false;
    for (let x=700; x<870; x++) {
      const [r,g,b]=px(x,y);
      if (!isDark(r,g,b) && !isGolden(r,g,b)) { hasSp=true; break; }
    }
    if (hasSp) { if(fy<0) fy=y; ly=y; }
  }
  let lx=-1, rx=-1;
  for (let x=700; x<870; x++) {
    for (let y=fy; y<=ly; y++) {
      const [r,g,b]=px(x,y);
      if (!isDark(r,g,b) && !isGolden(r,g,b)) { if(lx<0) lx=x; rx=x; break; }
    }
  }
  console.log(`  Sprite rows: y=${fy}..${ly} h=${ly-fy+1}`);
  console.log(`  Sprite cols: x=${lx}..${rx} w=${rx-lx+1}`);
}

console.log('\n=== Building 3 (house) exact scan — x=860-1000 ===');
{
  let fy=-1, ly=-1;
  for (let y=50; y<=290; y++) {
    let hasSp = false;
    for (let x=860; x<1000; x++) {
      const [r,g,b]=px(x,y);
      if (!isDark(r,g,b) && !isGolden(r,g,b)) { hasSp=true; break; }
    }
    if (hasSp) { if(fy<0) fy=y; ly=y; }
  }
  let lx=-1, rx=-1;
  for (let x=860; x<1000; x++) {
    for (let y=fy; y<=ly; y++) {
      const [r,g,b]=px(x,y);
      if (!isDark(r,g,b) && !isGolden(r,g,b)) { if(lx<0) lx=x; rx=x; break; }
    }
  }
  console.log(`  Sprite rows: y=${fy}..${ly} h=${ly-fy+1}`);
  console.log(`  Sprite cols: x=${lx}..${rx} w=${rx-lx+1}`);
}

// ─── Small props section (Gate, Well, etc.) ───────────────────────────────────
console.log('\n=== Small props scan (x=475-950, y=235-395) ===');
{
  // Find first/last rows with sprite content (non-dark, non-golden)
  let fy=-1, ly=-1;
  for (let y=235; y<=395; y++) {
    let hasSp=false;
    for (let x=475; x<950; x++) {
      const [r,g,b]=px(x,y);
      if (!isDark(r,g,b) && !isGolden(r,g,b)) { hasSp=true; break; }
    }
    if (hasSp) { if(fy<0) fy=y; ly=y; }
  }
  console.log(`  Sprite rows: y=${fy}..${ly} h=${ly-fy+1}`);

  // Find column groups
  console.log('  Column groups in this range:');
  let inGroup=false, gStart=-1;
  for (let x=475; x<950; x++) {
    let hasPx=false;
    for (let y=fy; y<=ly; y++) {
      const [r,g,b]=px(x,y);
      if (!isDark(r,g,b) && !isGolden(r,g,b)) { hasPx=true; break; }
    }
    if (hasPx && !inGroup) { inGroup=true; gStart=x; }
    else if (!hasPx && inGroup) {
      inGroup=false;
      console.log(`    x=${gStart}..${x-1} w=${x-gStart}`);
    }
  }
}

// ─── Check specific pixels in problematic buildings area ──────────────────────
console.log('\n=== Sample pixels in building area near header ===');
for (let y=70; y<=100; y++) {
  const pixels = [];
  for (let x=524; x<=700; x+=20) {
    const [r,g,b]=px(x,y);
    if (!isDark(r,g,b)) pixels.push(`x${x}:(${r},${g},${b})${isGolden(r,g,b)?'G':''}`);
  }
  if (pixels.length > 0) console.log(`  y=${y}: ${pixels.join(' ')}`);
}
