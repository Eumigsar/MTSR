/**
 * scan-coords.cjs
 * Scans specific regions of the reference image to find exact sprite boundaries.
 */
const fs = require('fs');
const { PNG } = require('/home/user/MTSR/node_modules/pngjs/lib/png.js');

const REF = '/root/.claude/uploads/6f9830c3-37f8-50ec-a95c-4a2d9f6fe5c3/544dbc20-32E42262C53B4262836999C8613B4E92.png';
const ref = PNG.sync.read(fs.readFileSync(REF));
const RW = ref.width, RH = ref.height;

function px(x, y) {
  const i = (Math.max(0,Math.min(RH-1,y)) * RW + Math.max(0,Math.min(RW-1,x))) * 4;
  return [ref.data[i], ref.data[i+1], ref.data[i+2], ref.data[i+3]];
}

function isDark(r,g,b) { return r < 42 && g < 42 && b < 42; }
function isLight(r,g,b) {
  const hi=Math.max(r,g,b), lo=Math.min(r,g,b);
  return r > 185 && g > 185 && b > 185 && (hi-lo) < 35;
}

function scanRow(y, x0, x1) {
  // Returns true if any non-dark pixel found in row y between x0 and x1
  for (let x = x0; x < x1; x++) {
    const [r,g,b] = px(x, y);
    if (!isDark(r,g,b)) return true;
  }
  return false;
}

function firstNonDarkRow(x0, x1, y0, y1) {
  for (let y = y0; y <= y1; y++) {
    if (scanRow(y, x0, x1)) return y;
  }
  return -1;
}

function lastNonDarkRow(x0, x1, y0, y1) {
  for (let y = y1; y >= y0; y--) {
    if (scanRow(y, x0, x1)) return y;
  }
  return -1;
}

// Scan column range
function scanCol(x, y0, y1) {
  for (let y = y0; y < y1; y++) {
    const [r,g,b] = px(x, y);
    if (!isDark(r,g,b)) return true;
  }
  return false;
}

function firstNonDarkCol(y0, y1, x0, x1) {
  for (let x = x0; x <= x1; x++) {
    if (scanCol(x, y0, y1)) return x;
  }
  return -1;
}

function lastNonDarkCol(y0, y1, x0, x1) {
  for (let x = x1; x >= x0; x--) {
    if (scanCol(x, y0, y1)) return x;
  }
  return -1;
}

console.log('=== BUILDINGS SCAN (x=500-1000, y=50-300) ===');
// Find the large building sprite start (skip golden header text)
// Golden text color is approximately r≈200, g≈160, b≈50
// Let's find where BUILDING SPRITES start vs where golden text is
for (let y = 50; y <= 250; y += 5) {
  let hasGolden = false, hasBuildingPixel = false;
  for (let x = 500; x < 700; x++) {
    const [r,g,b] = px(x, y);
    if (!isDark(r,g,b)) {
      // Golden text: high R, moderate G, low B
      if (r > 150 && g > 100 && b < 80) hasGolden = true;
      else hasBuildingPixel = true;
    }
  }
  if (hasGolden || hasBuildingPixel) {
    console.log(`y=${y}: golden=${hasGolden} building=${hasBuildingPixel}`);
  }
}

console.log('\n=== BUILDINGS: exact bbox of large building sprite (x=500-750) ===');
{
  // Find first row that has non-dark, non-golden pixels
  let firstSpriteRow = -1;
  for (let y = 50; y <= 280; y++) {
    let hasSpritePixel = false;
    for (let x = 500; x < 750; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b)) {
        // Not golden (golden: r>150 g>100 b<80 and ratio r/b > 2.5)
        if (!(r > 150 && g > 100 && b < 80 && r > b * 2)) {
          hasSpritePixel = true;
          break;
        }
      }
    }
    if (hasSpritePixel) {
      firstSpriteRow = y;
      break;
    }
  }
  console.log('First sprite pixel row (non-dark, non-golden):', firstSpriteRow);

  // Find last row
  let lastSpriteRow = -1;
  for (let y = 280; y >= 50; y--) {
    let hasSpritePixel = false;
    for (let x = 500; x < 750; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b)) {
        if (!(r > 150 && g > 100 && b < 80 && r > b * 2)) {
          hasSpritePixel = true;
          break;
        }
      }
    }
    if (hasSpritePixel) {
      lastSpriteRow = y;
      break;
    }
  }
  console.log('Last sprite pixel row:', lastSpriteRow);
  console.log('Height:', lastSpriteRow - firstSpriteRow + 1);

  // Left and right bounds
  const lc = firstNonDarkCol(firstSpriteRow, lastSpriteRow, 480, 750);
  const rc = lastNonDarkCol(firstSpriteRow, lastSpriteRow, 480, 750);
  console.log('Sprite x bounds:', lc, 'to', rc, 'width:', rc - lc + 1);
}

console.log('\n=== MEDIUM BUILDING (x=700-860) ===');
{
  let firstSpriteRow = -1;
  for (let y = 50; y <= 280; y++) {
    let hasSpritePixel = false;
    for (let x = 700; x < 860; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b) && !(r > 150 && g > 100 && b < 80 && r > b * 2)) {
        hasSpritePixel = true; break;
      }
    }
    if (hasSpritePixel) { firstSpriteRow = y; break; }
  }
  let lastSpriteRow = -1;
  for (let y = 280; y >= 50; y--) {
    let hasSpritePixel = false;
    for (let x = 700; x < 860; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b) && !(r > 150 && g > 100 && b < 80 && r > b * 2)) {
        hasSpritePixel = true; break;
      }
    }
    if (hasSpritePixel) { lastSpriteRow = y; break; }
  }
  const lc = firstNonDarkCol(firstSpriteRow, lastSpriteRow, 700, 860);
  const rc = lastNonDarkCol(firstSpriteRow, lastSpriteRow, 700, 860);
  console.log(`Medium: y=${firstSpriteRow}..${lastSpriteRow} h=${lastSpriteRow-firstSpriteRow+1}, x=${lc}..${rc} w=${rc-lc+1}`);
}

console.log('\n=== HOUSE (x=860-1000) ===');
{
  let firstSpriteRow = -1;
  for (let y = 50; y <= 280; y++) {
    let hasSpritePixel = false;
    for (let x = 860; x < 1000; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b) && !(r > 150 && g > 100 && b < 80 && r > b * 2)) {
        hasSpritePixel = true; break;
      }
    }
    if (hasSpritePixel) { firstSpriteRow = y; break; }
  }
  let lastSpriteRow = -1;
  for (let y = 280; y >= 50; y--) {
    let hasSpritePixel = false;
    for (let x = 860; x < 1000; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b) && !(r > 150 && g > 100 && b < 80 && r > b * 2)) {
        hasSpritePixel = true; break;
      }
    }
    if (hasSpritePixel) { lastSpriteRow = y; break; }
  }
  const lc = firstNonDarkCol(firstSpriteRow, lastSpriteRow, 860, 1000);
  const rc = lastNonDarkCol(firstSpriteRow, lastSpriteRow, 860, 1000);
  console.log(`House: y=${firstSpriteRow}..${lastSpriteRow} h=${lastSpriteRow-firstSpriteRow+1}, x=${lc}..${rc} w=${rc-lc+1}`);
}

console.log('\n=== SMALL PROPS (Gate, Well, Shrine etc) x=475-950, y=240-390 ===');
{
  // Find start y of the props section below buildings
  let firstRow = -1;
  for (let y = 240; y <= 390; y++) {
    if (scanRow(y, 475, 950)) { firstRow = y; break; }
  }
  let lastRow = -1;
  for (let y = 390; y >= 240; y--) {
    if (scanRow(y, 475, 950)) { lastRow = y; break; }
  }
  console.log(`Props row: y=${firstRow}..${lastRow} h=${lastRow-firstRow+1}`);

  // Find col starts for each prop item in this range
  console.log('Scanning for prop column starts...');
  let inProp = false;
  let propStart = -1;
  for (let x = 475; x < 960; x++) {
    const hasContent = scanCol(x, firstRow, lastRow);
    if (hasContent && !inProp) {
      inProp = true;
      propStart = x;
    } else if (!hasContent && inProp) {
      inProp = false;
      console.log(`  Prop group: x=${propStart}..${x-1} w=${x-propStart}`);
    }
  }
}

console.log('\n=== TREES SECTION (x=0-475, y=370-555) ===');
{
  // Find where trees section header ends and actual sprites start
  for (let y = 370; y <= 430; y++) {
    let hasGolden = false, hasSprite = false;
    for (let x = 0; x < 475; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b)) {
        if (r > 150 && g > 100 && b < 80 && r > b * 2) hasGolden = true;
        else if (r > 5 || g > 5 || b > 5) hasSprite = true;
      }
    }
    if (hasGolden || hasSprite) console.log(`y=${y}: golden=${hasGolden} sprite=${hasSprite}`);
  }

  // Find exact tree sprite extents
  console.log('\nTree bbox scans:');
  const treeX = [
    {x0:10, x1:88,  label:'SmallTree'},
    {x0:88, x1:198, label:'MedTree'},
    {x0:180, x1:335,label:'LargeTree'},
    {x0:305, x1:400,label:'PineTree'},
    {x0:388, x1:455,label:'BambooTree'},
    {x0:450, x1:540,label:'CherryTree'},
  ];
  for (const t of treeX) {
    // find first/last row with non-light content
    let fr = -1, lr = -1;
    for (let y = 370; y <= 560; y++) {
      let has = false;
      for (let x = t.x0; x < t.x1; x++) {
        const [r,g,b] = px(x, y);
        if (!isDark(r,g,b) && !isLight(r,g,b)) { has = true; break; }
      }
      if (has) { if (fr < 0) fr = y; lr = y; }
    }
    const lc = firstNonDarkCol(fr, lr, t.x0, t.x1);
    const rc = lastNonDarkCol(fr, lr, t.x0, t.x1);
    console.log(`  ${t.label}: y=${fr}..${lr} h=${lr-fr+1}, x=${lc}..${rc} w=${rc-lc+1}`);
  }
}

console.log('\n=== WATER SECTION SCAN (x=0-560, y=650-880) ===');
{
  // Find rows with content
  for (let y = 650; y <= 880; y += 3) {
    let hasGolden = false, hasSprite = false;
    for (let x = 0; x < 560; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b)) {
        if (r > 150 && g > 100 && b < 80 && r > b * 2) hasGolden = true;
        else hasSprite = true;
      }
    }
    if (hasGolden || hasSprite) console.log(`y=${y}: golden=${hasGolden} sprite=${hasSprite}`);
  }

  // Find actual tile rows
  console.log('\nWater tile row scan (look for 53-wide tiles):');
  // Sample first tile column (x=23 to 76)
  for (let y = 650; y <= 880; y++) {
    let hasContent = false;
    for (let x = 23; x < 76; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b) && !(r > 150 && g > 100 && b < 80 && r > b * 2)) {
        hasContent = true; break;
      }
    }
    if (hasContent) {
      const [r,g,b] = px(40, y);
      process.stdout.write(`y=${y}(${r},${g},${b}) `);
    }
  }
  console.log();
}

console.log('\n=== PROPS SECTION SCAN (x=475-840, y=365-540) ===');
{
  // Row-by-row scan to find golden header vs sprites
  for (let y = 365; y <= 540; y += 2) {
    let hasGolden = false, hasSprite = false;
    for (let x = 475; x < 840; x++) {
      const [r,g,b] = px(x, y);
      if (!isDark(r,g,b)) {
        if (r > 150 && g > 100 && b < 80 && r > b * 2) hasGolden = true;
        else hasSprite = true;
      }
    }
    if (hasGolden || hasSprite) console.log(`y=${y}: golden=${hasGolden} sprite=${hasSprite}`);
  }
}
