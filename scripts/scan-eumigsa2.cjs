/**
 * scan-eumigsa2.cjs — Find exact section bounds and sprite positions per section
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
const isSprite = (r,g,b,a) => a > 0 && !isLight(r,g,b) && !isDark(r,g,b);

// ── Find all vertical dividers (try lower threshold) ─────────────────────────
console.log('=== Vertical dark cols (threshold 40%) ===');
for (let x = 5; x < W - 5; x++) {
  let dk = 0;
  for (let y = 0; y < H; y += 2) {
    const [r,g,b] = px(x, y);
    if (isDark(r,g,b)) dk++;
  }
  const pct = dk / (H / 2);
  if (pct > 0.40 && (x < 10 || x > W-10 || (x > 400 && x < 1200))) {
    if (pct > 0.70 || x > 400)
      process.stdout.write(`x=${x}(${(pct*100).toFixed(0)}%) `);
  }
}
console.log();

// ── Look at pixels along probable divider columns ─────────────────────────────
console.log('\n=== Pixel samples at x=507-517 (checking chars/nature divider) ===');
for (let y = 0; y < H; y += 20) {
  const [r,g,b] = px(512, y);
  if (!isLight(r,g,b)) process.stdout.write(`y=${y}:(${r},${g},${b}) `);
}
console.log();

console.log('\n=== Pixel samples at x=508 ===');
let dk508=0, lt508=0, sp508=0;
for (let y=0; y<H; y++) {
  const [r,g,b]=px(508,y);
  if(isDark(r,g,b)) dk508++;
  else if(isLight(r,g,b)) lt508++;
  else sp508++;
}
console.log(`  x=508: dark=${dk508} light=${lt508} sprite=${sp508}`);

for (let xTest of [505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515]) {
  let dk=0,lt=0,sp=0;
  for(let y=0;y<H;y++) {
    const [r,g,b]=px(xTest,y);
    if(isDark(r,g,b)) dk++;
    else if(isLight(r,g,b)) lt++;
    else sp++;
  }
  console.log(`  x=${xTest}: dark=${dk} light=${lt} sprite=${sp}`);
}

// ── Scan section header rows to find exact y positions ───────────────────────
console.log('\n=== Section boundary row scan — count VERY dark rows ===');
// Looking for rows where nearly full-width is dark (section borders)
for (let y = 0; y < H; y++) {
  let dkFull = 0;
  for (let x = 0; x < W; x++) {
    const [r,g,b] = px(x, y);
    if (r < 30 && g < 30 && b < 30) dkFull++;
  }
  const pct = dkFull / W;
  if (pct > 0.50) console.log(`  y=${y}: ${(pct*100).toFixed(1)}% very dark`);
}

// ── Now scan each expected section for sprite column groups ───────────────────
// From prior scan: top sections y=7..462, bottom sections y=468..772
// Columns: left x=7..508, mid x=513..978, right x=983..1528 (approximate)

// Use these confirmed section dividers:
const SECTIONS = [
  { name:'01-CHARS',    x0:7,   y0:7,   x1:508, y1:462 },
  { name:'02-NATURE',   x0:513, y0:7,   x1:978, y1:462 },
  { name:'03-BUILDINGS',x0:983, y0:7,   x1:1528,y1:462 },
  { name:'04-PROPS',    x0:7,   y0:468, x1:508, y1:772 },
  { name:'05-TERRAIN',  x0:513, y0:468, x1:978, y1:772 },
  { name:'06-EFFECTS',  x0:983, y0:468, x1:1528,y1:772 },
];

for (const sec of SECTIONS) {
  console.log(`\n=== ${sec.name}: x=${sec.x0}..${sec.x1} y=${sec.y0}..${sec.y1} ===`);
  // Find sprite content bounds
  let mnX=sec.x1,mxX=sec.x0,mnY=sec.y1,mxY=sec.y0;
  for(let y=sec.y0;y<=sec.y1;y++) {
    for(let x=sec.x0;x<=sec.x1;x++) {
      const[r,g,b,a]=px(x,y);
      if(!isLight(r,g,b)&&!isDark(r,g,b)){
        if(x<mnX)mnX=x; if(x>mxX)mxX=x;
        if(y<mnY)mnY=y; if(y>mxY)mxY=y;
      }
    }
  }
  console.log(`  Sprite content: x=${mnX}..${mxX} y=${mnY}..${mxY}`);

  // Find label row(s) — rows at top of section that have fewer sprite pixels
  // (text labels are sparse, sprite rows are dense)
  const rowCounts = [];
  for(let y=sec.y0;y<=mnY+10;y++) {
    let cnt=0;
    for(let x=sec.x0;x<=sec.x1;x++) {
      const[r,g,b]=px(x,y);
      if(!isLight(r,g,b)&&!isDark(r,g,b)) cnt++;
    }
    rowCounts.push({y, cnt});
  }
  // Find where sprite content actually starts
  let contentStartY = mnY;
  for(let i=0;i<rowCounts.length;i++) {
    if(rowCounts[i].cnt > 5) { contentStartY = rowCounts[i].y; break; }
  }
  console.log(`  Content starts at y=${contentStartY}`);

  // Find horizontal bands (sub-rows within section)
  console.log('  Sprite row bands:');
  let inBand = false, bandY0 = -1, lastY = -1;
  for(let y=sec.y0;y<=sec.y1+1;y++) {
    let cnt=0;
    for(let x=sec.x0;x<=sec.x1;x++) {
      const[r,g,b]=px(x,y);
      if(!isLight(r,g,b)&&!isDark(r,g,b)) cnt++;
    }
    if(cnt>2 && !inBand) { inBand=true; bandY0=y; }
    else if(cnt<=2 && inBand) {
      inBand=false;
      if(lastY - bandY0 > 3) console.log(`    band y=${bandY0}..${lastY} h=${lastY-bandY0+1}`);
    }
    if(cnt>2) lastY=y;
  }
  if(inBand) console.log(`    band y=${bandY0}..${sec.y1} h=${sec.y1-bandY0+1}`);
}
