/**
 * scan-eumigsa4.cjs — Final detailed scan for char columns and terrain grid size
 */
const fs = require('fs');
const { PNG } = require('/home/user/MTSR/node_modules/pngjs/lib/png.js');

const REF = '/root/.claude/uploads/6f9830c3-37f8-50ec-a95c-4a2d9f6fe5c3/2df6dca8-D2D90596A75B418EB5FCCE1D28C9BCD3.png';
const ref = PNG.sync.read(fs.readFileSync(REF));
const W = ref.width, H = ref.height;

function px(x, y) {
  const i = (Math.max(0, Math.min(H-1, y)) * W + Math.max(0, Math.min(W-1, x))) * 4;
  return [ref.data[i], ref.data[i+1], ref.data[i+2], ref.data[i+3]];
}
const isLight = (r,g,b) => r > 210 && g > 210 && b > 210;
const isDark  = (r,g,b) => r < 60  && g < 60  && b < 60;
const isSp    = (r,g,b) => !isLight(r,g,b) && !isDark(r,g,b);

// ── CHARS: Find void columns (character gap columns) ─────────────────────────
console.log('=== CHARS: Void column scan (y=66..420, x=7..510) ===');
// Scan how many sprite pixels each x column has across ALL direction bands
const charColCounts = [];
for (let x = 7; x <= 510; x++) {
  let cnt = 0;
  for (let y = 66; y <= 420; y++) {
    const [r,g,b] = px(x, y);
    if (isSp(r,g,b)) cnt++;
  }
  charColCounts.push(cnt);
}
// Find char boundaries: sequences of low-count columns
let inVoid = false, vStart = 7;
const voids = [];
for (let i = 0; i < charColCounts.length; i++) {
  const x = i + 7;
  if (charColCounts[i] < 3 && !inVoid) { inVoid = true; vStart = x; }
  else if (charColCounts[i] >= 3 && inVoid) {
    inVoid = false;
    if (x - vStart > 3) voids.push({ x0: vStart, x1: x - 1, w: x - vStart });
  }
}
if (inVoid) voids.push({ x0: vStart, x1: 510, w: 510 - vStart + 1 });

console.log('Character gap voids:');
voids.forEach(v => console.log(`  void x=${v.x0}..${v.x1} w=${v.w}`));

// Derive character slot boundaries
console.log('\nCharacter slots (between voids):');
const slots = [];
let slotX = 7;
for (const v of voids) {
  if (v.x0 > slotX) {
    slots.push({ x0: slotX, x1: v.x0 - 1 });
    slotX = v.x1 + 1;
  }
}
if (slotX <= 510) slots.push({ x0: slotX, x1: 510 });
slots.forEach((s,i) => console.log(`  slot${i}: x=${s.x0}..${s.x1} w=${s.x1-s.x0+1}`));

// ── CHARS: Direction band Y-ranges ───────────────────────────────────────────
console.log('\n=== CHARS: Direction band Y-scan (x=7..510) ===');
let inBand = false, bandY0 = -1, lastRowY = -1;
const bands = [];
for (let y = 60; y <= 462; y++) {
  let cnt = 0;
  for (let x = 7; x <= 510; x++) {
    const [r,g,b] = px(x, y); if (isSp(r,g,b)) cnt++;
  }
  if (cnt > 3 && !inBand) { inBand = true; bandY0 = y; }
  else if (cnt <= 3 && inBand) { inBand = false; if (lastRowY - bandY0 > 5) bands.push([bandY0, lastRowY]); }
  if (cnt > 3) lastRowY = y;
}
if (inBand) bands.push([bandY0, 462]);
console.log('Direction bands:');
bands.forEach((b,i) => console.log(`  dir${i}: y=${b[0]}..${b[1]} h=${b[1]-b[0]+1}`));

// ── CHARS: Find frame columns within first character slot ─────────────────────
console.log('\n=== CHARS: Frame columns within first slot (using slot0 from above) ===');
if (slots.length > 0) {
  const s = slots[0];
  // Scan col counts within this slot across first direction band
  let inFrm = false, fStart = -1, lastFx = -1;
  console.log(`Scanning slot x=${s.x0}..${s.x1} in first dir band y=${bands.length>0?bands[0][0]:66}..${bands.length>0?bands[0][1]:115}:`);
  const y0 = bands.length > 0 ? bands[0][0] : 66;
  const y1 = bands.length > 0 ? bands[0][1] : 115;
  const frameGroups = [];
  for (let x = s.x0; x <= s.x1; x++) {
    let cnt = 0;
    for (let y = y0; y <= y1; y++) { const [r,g,b]=px(x,y); if(isSp(r,g,b)) cnt++; }
    if (cnt > 1 && !inFrm) { inFrm = true; fStart = x; }
    else if (cnt <= 1 && inFrm) { inFrm = false; if(lastFx - fStart >= 3) frameGroups.push([fStart, lastFx]); }
    if (cnt > 1) lastFx = x;
  }
  if (inFrm) frameGroups.push([fStart, s.x1]);
  frameGroups.forEach((f,i) => console.log(`  frame${i}: x=${f[0]}..${f[1]} w=${f[1]-f[0]+1}`));
}

// ── TERRAIN: Measure tile grid size ──────────────────────────────────────────
console.log('\n\n=== TERRAIN: Measure tile size in first block (GRASS: x=527..624, y=529..611) ===');
// Find internal grid lines within the grass block
// Look for rows/cols with notably fewer pixels (tile borders)
{
  const tx0=527, tx1=624, ty0=529, ty1=611;
  console.log('Row pixel counts (looking for horizontal grid lines):');
  for (let y = ty0; y <= ty1; y++) {
    let cnt = 0;
    for (let x = tx0; x <= tx1; x++) {
      const [r,g,b] = px(x, y); if (isSp(r,g,b)) cnt++;
    }
    if (cnt < 3) process.stdout.write(`y=${y}(${cnt}) `);
  }
  console.log('');
  console.log('Col pixel counts (looking for vertical grid lines):');
  for (let x = tx0; x <= tx1; x++) {
    let cnt = 0;
    for (let y = ty0; y <= ty1; y++) {
      const [r,g,b] = px(x, y); if (isSp(r,g,b)) cnt++;
    }
    if (cnt < 3) process.stdout.write(`x=${x}(${cnt}) `);
  }
  console.log('');

  // Sample pixels along center row and center col to find the actual tile boundaries
  const cy = Math.round((ty0+ty1)/2);
  const cx = Math.round((tx0+tx1)/2);
  console.log(`\nPixel values across center col x=${cx}, y=${ty0}..${ty1}:`);
  for (let y = ty0; y <= ty1; y += 2) {
    const [r,g,b] = px(cx, y);
    if (isDark(r,g,b)) process.stdout.write(`y=${y}D `);
  }
  console.log('');

  // How many distinct tiles fit? The 47-blob is 7 wide × 7 tall
  // Expected: grid lines at every (ty1-ty0+1)/7 ≈ 83/7 ≈ 11.9 rows
  const tileH = (ty1 - ty0 + 1) / 7;
  const tileW = (tx1 - tx0 + 1) / 7;
  console.log(`\nExpected tile size: ${tileW.toFixed(1)}×${tileH.toFixed(1)} px (if 7×7 grid)`);
  console.log(`Expected tile size: ${((tx1-tx0+1)/7).toFixed(1)}×${((ty1-ty0+1)/7).toFixed(1)} px`);
}

// ── TERRAIN: Measure actual grid lines ───────────────────────────────────────
{
  const tx0=527, tx1=624, ty0=529, ty1=611;
  // Find dark pixel runs in the grass block
  console.log('\nDark pixel positions in first terrain block (center column):');
  const cx = Math.round((tx0+tx1)/2);
  for (let y = ty0; y <= ty1; y++) {
    const [r,g,b] = px(cx, y);
    if (r<80&&g<80&&b<80) console.log(`  y=${y}: (${r},${g},${b})`);
  }

  // Find dark rows within block
  console.log('\nRows with 10+ dark pixels in terrain block 1:');
  for (let y = ty0; y <= ty1; y++) {
    let dk = 0;
    for (let x = tx0; x <= tx1; x++) { const [r,g,b]=px(x,y); if(r<80&&g<80&&b<80) dk++; }
    if (dk > 8) console.log(`  y=${y}: ${dk} dark px`);
  }
  // Find dark cols within block
  console.log('Cols with 5+ dark pixels in terrain block 1:');
  for (let x = tx0; x <= tx1; x++) {
    let dk = 0;
    for (let y = ty0; y <= ty1; y++) { const [r,g,b]=px(x,y); if(r<80&&g<80&&b<80) dk++; }
    if (dk > 4) console.log(`  x=${x}: ${dk} dark px`);
  }
}

// ── NATURE: Sample tree sprites ───────────────────────────────────────────────
console.log('\n\n=== NATURE: Tree sprite bounds (row 1: y=17..222) ===');
// From scan3: tree0=Sakura x=513..539, tree3=Bambu x=574..657, tree5=Pinheiro x=666..746, tree10=Carvalho x=763..848, tree11=Oak x=855..966
// Let me get full bounds including y range
const trees = [
  { name:'SAKURA',  x0:513, x1:556, y0:40, y1:222 },
  { name:'BAMBU',   x0:560, x1:665, y0:40, y1:222 },
  { name:'PINHEIRO',x0:666, x1:760, y0:40, y1:222 },
  { name:'CARVALHO',x0:763, x1:860, y0:40, y1:222 },
];
for (const t of trees) {
  let mnX=t.x1,mxX=t.x0,mnY=t.y1,mxY=t.y0;
  for(let y=t.y0;y<=t.y1;y++) for(let x=t.x0;x<=t.x1;x++) {
    const[r,g,b]=px(x,y); if(isSp(r,g,b)){
      if(x<mnX)mnX=x;if(x>mxX)mxX=x;if(y<mnY)mnY=y;if(y>mxY)mxY=y;
    }
  }
  console.log(`  ${t.name}: x=${mnX}..${mxX} w=${mxX-mnX+1} y=${mnY}..${mxY} h=${mxY-mnY+1}`);
}

// NATURE row 2: plants+rocks (y=236..431)
console.log('\n=== NATURE: Plants+rocks row 2 (y=236..431) ===');
// These appear as 2 sub-sections based on prior scan
// First sub-section (smaller plants): approx y=236..280
// Second sub-section (rocks): approx y=290..431
// Let's check where the sub-sections are
for(let y=236;y<=431;y++) {
  let cnt=0;
  for(let x=513;x<=978;x++){const[r,g,b]=px(x,y);if(isSp(r,g,b))cnt++;}
  if(cnt<2) process.stdout.write(`y=${y}(${cnt}) `);
}
console.log('');
