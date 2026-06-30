/**
 * scan-props2.cjs — Find individual prop sprite bounds precisely.
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

// ─── Row 0 props: column groups in y=420-480 (below golden label band) ──────
console.log('=== ROW 0 PROPS: Column groups (x=541-840, y=420-480) ===');
{
  let inGroup = false, gx = -1;
  for (let x = 541; x <= 840; x++) {
    let count = 0;
    for (let y = 420; y <= 480; y++) {
      const [r,g,b] = px(x, y);
      if (isSprite(r,g,b)) count++;
    }
    if (count >= 2 && !inGroup) { inGroup = true; gx = x; }
    else if (count < 2 && inGroup) {
      inGroup = false;
      const mx = Math.round((gx + x - 1) / 2);
      let fy = 1000, ly = 0;
      for (let y = 360; y <= 560; y++) {
        const [r,g,b] = px(mx, y);
        if (isSprite(r,g,b)) { fy=Math.min(fy,y); ly=Math.max(ly,y); }
      }
      // Sample pixel at midpoint
      const [r,g,b] = px(mx, Math.round((fy+ly)/2));
      console.log(`  x=${gx}..${x-1} w=${x-gx}  y=${fy}..${ly} h=${ly-fy+1}  mid:(${r},${g},${b})`);
    }
  }
  if (inGroup) {
    const mx = Math.round((gx + 840) / 2);
    let fy=1000, ly=0;
    for (let y=360; y<=560; y++) {
      const [r,g,b]=px(mx,y); if(isSprite(r,g,b)){fy=Math.min(fy,y);ly=Math.max(ly,y);}
    }
    console.log(`  x=${gx}..840 w=${840-gx+1}  y=${fy}..${ly} h=${ly-fy+1}`);
  }
}

// ─── Check what's at y=390 (the suspicious "299 pixel" row) ──────────────────
console.log('\n=== What is at y=390-395, x=541-840? (sample every 20px) ===');
for (let y = 388; y <= 400; y++) {
  const samples = [];
  for (let x = 541; x <= 841; x += 20) {
    const [r,g,b] = px(x, y);
    if (!isDark(r,g,b)) samples.push(`x${x}:(${r},${g},${b})`);
  }
  if (samples.length > 0) console.log(`  y=${y}: ${samples.join(' ')}`);
}

// ─── Row 1 props with tighter scan (y=455-510) ──────────────────────────────
console.log('\n=== ROW 1 PROPS: Column groups (x=475-840, y=455-510) ===');
{
  let inGroup = false, gx = -1;
  for (let x = 475; x <= 840; x++) {
    let count = 0;
    for (let y = 455; y <= 510; y++) {
      const [r,g,b] = px(x, y);
      if (isSprite(r,g,b)) count++;
    }
    if (count >= 3 && !inGroup) { inGroup = true; gx = x; }
    else if (count < 3 && inGroup) {
      inGroup = false;
      const mx = Math.round((gx + x - 1) / 2);
      let fy = 1000, ly = 0;
      for (let y = 430; y <= 560; y++) {
        const [r,g,b] = px(mx, y);
        if (isSprite(r,g,b)) { fy=Math.min(fy,y); ly=Math.max(ly,y); }
      }
      const [r,g,b] = px(mx, Math.round((fy+ly)/2));
      console.log(`  x=${gx}..${x-1} w=${x-gx}  y=${fy}..${ly} h=${ly-fy+1}  mid:(${r},${g},${b})`);
    }
  }
  if (inGroup) {
    const mx=Math.round((gx+840)/2);
    let fy=1000,ly=0;
    for(let y=430;y<=560;y++){const[r,g,b]=px(mx,y);if(isSprite(r,g,b)){fy=Math.min(fy,y);ly=Math.max(ly,y);}}
    console.log(`  x=${gx}..840 w=${840-gx+1}  y=${fy}..${ly}`);
  }
}

// ─── Full props region overview — what does the reference image actually show ─
console.log('\n=== OVERVIEW: what is at x=541-840, every y=5, all pixel types ===');
for (let y = 360; y <= 580; y += 5) {
  let dark = 0, golden = 0, light = 0, sprite = 0;
  for (let x = 541; x <= 840; x++) {
    const [r,g,b] = px(x, y);
    if (isDark(r,g,b)) dark++;
    else if (isGolden(r,g,b)) golden++;
    else if (isLight(r,g,b)) light++;
    else sprite++;
  }
  if (golden > 0 || sprite > 20 || light > 20) {
    console.log(`  y=${y}: dark=${dark} golden=${golden} light=${light} sprite=${sprite}`);
  }
}
