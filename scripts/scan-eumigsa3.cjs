/**
 * scan-eumigsa3.cjs — Precise sprite bounds per section
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

// ── Generic: find column groups in a y-band, return [{x0,x1}] ────────────────
function colGroups(x0, x1, y0, y1, minCount=1) {
  const groups = [];
  let inG = false, gx = -1;
  for (let x = x0; x <= x1; x++) {
    let cnt = 0;
    for (let y = y0; y <= y1; y++) {
      const [r,g,b] = px(x, y);
      if (isSp(r,g,b)) cnt++;
    }
    if (cnt >= minCount && !inG) { inG = true; gx = x; }
    else if (cnt < minCount && inG) {
      inG = false;
      const mx = Math.round((gx + x - 1) / 2);
      let fy=y1, ly=y0;
      for (let y=y0; y<=y1; y++) {
        const [r,g,b]=px(mx,y);
        if (isSp(r,g,b)) { fy=Math.min(fy,y); ly=Math.max(ly,y); }
      }
      groups.push({ x0:gx, x1:x-1, y0:fy, y1:ly });
    }
  }
  if (inG) {
    const mx = Math.round((gx + x1) / 2);
    let fy=y1, ly=y0;
    for (let y=y0; y<=y1; y++) {
      const [r,g,b]=px(mx,y);
      if (isSp(r,g,b)) { fy=Math.min(fy,y); ly=Math.max(ly,y); }
    }
    groups.push({ x0:gx, x1, y0:fy, y1:ly });
  }
  return groups;
}

// ── SECTION 01: CHARACTERS ────────────────────────────────────────────────────
console.log('\n=== SECTION 01: CHARACTERS (x=7..510) ===');
// Top set (6 chars): first find the name label row, then the 4 direction bands
// Scan y=40..220 for first set
{
  // Find where each character starts horizontally
  // Look at a row in the middle of the first direction band
  // From band scan: y=66..115 is first band, mid=90
  const Y_SAMPLE = 90;
  const grps = colGroups(7, 510, Y_SAMPLE - 5, Y_SAMPLE + 5, 1);
  console.log(`Character columns at y≈${Y_SAMPLE} (top set):`);
  grps.forEach((g,i) => console.log(`  char${i}: x=${g.x0}..${g.x1} w=${g.x1-g.x0+1}`));

  // Full scan of character section - find all sprite column groups across full height
  const ALL_CHARS = colGroups(7, 510, 60, 462, 3);
  console.log(`\nAll column groups in chars section (minCount=3):`);
  ALL_CHARS.forEach((g,i) => console.log(`  grp${i}: x=${g.x0}..${g.x1} w=${g.x1-g.x0+1} y=${g.y0}..${g.y1} h=${g.y1-g.y0+1}`));
}

// Scan char section row by row for gaps (find 4 direction bands precisely)
console.log('\nRow-by-row sprite count in chars section (x=7..510):');
for (let y = 60; y <= 462; y += 3) {
  let cnt = 0;
  for (let x = 7; x <= 510; x++) {
    const [r,g,b] = px(x,y);
    if (isSp(r,g,b)) cnt++;
  }
  if (cnt < 2) process.stdout.write(`|y${y}| `);
}
console.log('\n(gap rows shown above)');

// ── SECTION 02: NATURE ────────────────────────────────────────────────────────
console.log('\n\n=== SECTION 02: NATURE (x=513..978) ===');
// Two bands: y=17..222 (trees), y=236..431 (plants/rocks)
// Trees first
{
  console.log('Tree row (band y=17..222):');
  const grps = colGroups(513, 978, 17, 222, 2);
  grps.forEach((g,i) => console.log(`  tree${i}: x=${g.x0}..${g.x1} w=${g.x1-g.x0+1} y=${g.y0}..${g.y1} h=${g.y1-g.y0+1}`));

  console.log('Plants/rocks row (band y=236..431):');
  // Split into two sub-rows by finding gaps
  // First find the gap between row 1 and row 2 within this band
  for (let y = 236; y <= 431; y++) {
    let cnt = 0;
    for (let x = 513; x <= 978; x++) {
      const [r,g,b] = px(x,y); if (isSp(r,g,b)) cnt++;
    }
    if (cnt < 2) process.stdout.write(`|y${y}| `);
  }
  console.log('');
}

// Scan nature as multiple sub-bands
{
  // Row 2: approx y=236..431. Find sub-band splits
  let bands = [], inB=false, bY0=-1, lastY=-1;
  for (let y = 236; y <= 431; y++) {
    let cnt=0;
    for (let x=513; x<=978; x++) { const[r,g,b]=px(x,y); if(isSp(r,g,b)) cnt++; }
    if (cnt>1 && !inB) { inB=true; bY0=y; }
    else if (cnt<=1 && inB) { inB=false; if(lastY-bY0>3) bands.push([bY0,lastY]); }
    if (cnt>1) lastY=y;
  }
  if (inB) bands.push([bY0, 431]);

  for (const [by0, by1] of bands) {
    const grps = colGroups(513, 978, by0, by1, 2);
    console.log(`\nNature sub-band y=${by0}..${by1}:`);
    grps.forEach((g,i) => console.log(`  sprite${i}: x=${g.x0}..${g.x1} w=${g.x1-g.x0+1} y=${g.y0}..${g.y1} h=${g.y1-g.y0+1}`));
  }
}

// ── SECTION 03: BUILDINGS ─────────────────────────────────────────────────────
console.log('\n\n=== SECTION 03: BUILDINGS (x=983..1528) ===');
{
  // From band scan: bands at y=65..188 (large buildings), y=213..357, y=405..451
  const BLDS = [
    [65, 188],
    [213, 357],
    [405, 451],
  ];
  for (const [by0, by1] of BLDS) {
    // Find sub-bands within this larger band
    let sBands=[], inB=false, bY0=-1, lastY=-1;
    for(let y=by0;y<=by1;y++) {
      let cnt=0;
      for(let x=983;x<=1528;x++) { const[r,g,b]=px(x,y); if(isSp(r,g,b)) cnt++; }
      if(cnt>2&&!inB) { inB=true; bY0=y; }
      else if(cnt<=2&&inB) { inB=false; if(lastY-bY0>3) sBands.push([bY0,lastY]); }
      if(cnt>2) lastY=y;
    }
    if(inB) sBands.push([bY0, by1]);

    console.log(`\nBuildings band y=${by0}..${by1}:`);
    for(const [sy0,sy1] of sBands) {
      const grps = colGroups(983, 1528, sy0, sy1, 2);
      console.log(`  sub-band y=${sy0}..${sy1}:`);
      grps.forEach((g,i) => console.log(`    bld${i}: x=${g.x0}..${g.x1} w=${g.x1-g.x0+1} y=${g.y0}..${g.y1} h=${g.y1-g.y0+1}`));
    }
  }
}

// ── SECTION 04: PROPS ────────────────────────────────────────────────────────
console.log('\n\n=== SECTION 04: PROPS (x=7..510) ===');
{
  // Bands: y=527..567, y=620..665, y=716..753 (main content rows)
  const BANDS = [[527,567],[620,665],[716,753]];
  for (const [by0,by1] of BANDS) {
    const grps = colGroups(7, 510, by0, by1, 2);
    console.log(`\nProp band y=${by0}..${by1}:`);
    grps.forEach((g,i) => console.log(`  prop${i}: x=${g.x0}..${g.x1} w=${g.x1-g.x0+1} y=${g.y0}..${g.y1} h=${g.y1-g.y0+1}`));
  }
}

// ── SECTION 05: TERRAIN ──────────────────────────────────────────────────────
console.log('\n\n=== SECTION 05: TERRAIN (x=513..978) ===');
{
  // Two rows of terrain tiles: y=526..613, y=651..746
  for (const [by0,by1] of [[526,613],[651,746]]) {
    const grps = colGroups(513, 978, by0, by1, 5);
    console.log(`\nTerrain band y=${by0}..${by1}:`);
    grps.forEach((g,i) => console.log(`  tile${i}: x=${g.x0}..${g.x1} w=${g.x1-g.x0+1} y=${g.y0}..${g.y1} h=${g.y1-g.y0+1}`));
  }
}

// ── SECTION 06: EFFECTS ──────────────────────────────────────────────────────
console.log('\n\n=== SECTION 06: EFFECTS (x=983..1528) ===');
{
  for (const [by0,by1] of [[541,605],[670,744]]) {
    const grps = colGroups(983, 1528, by0, by1, 2);
    console.log(`\nEffects band y=${by0}..${by1}:`);
    grps.forEach((g,i) => console.log(`  fx${i}: x=${g.x0}..${g.x1} w=${g.x1-g.x0+1} y=${g.y0}..${g.y1} h=${g.y1-g.y0+1}`));
  }
}
