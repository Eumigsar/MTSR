const { chromium } = require('/home/user/MTSR/node_modules/playwright/index.js');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 1200 });

  const atlases = [
    { name: 'terrain-atlas.png',    w: 256,  h: 96  },
    { name: 'buildings-atlas.png',  w: 512,  h: 256 },
    { name: 'characters-atlas.png', w: 160,  h: 192 },
    { name: 'trees-atlas.png',      w: 384,  h: 96  },
    { name: 'props-atlas.png',      w: 224,  h: 128 },
    { name: 'water-atlas.png',      w: 320,  h: 128 },
    { name: 'effects-atlas.png',    w: 352,  h: 96  },
  ];

  const scale = 3;  // display at 3× for clarity
  let html = `
  <html><head><style>
    body { background: #222; font-family: monospace; padding: 10px; }
    .atlas { margin: 10px; display: inline-block; vertical-align: top; }
    .atlas h3 { color: #0f0; margin: 4px 0; font-size: 11px; }
    .atlas canvas { border: 1px solid #444; image-rendering: pixelated; display: block; }
    .checkerboard { background-image: linear-gradient(45deg, #333 25%, transparent 25%),
      linear-gradient(-45deg, #333 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #333 75%),
      linear-gradient(-45deg, transparent 75%, #333 75%);
      background-size: 8px 8px;
      background-position: 0 0, 0 4px, 4px -4px, -4px 0px; }
  </style></head><body>
  <h2 style="color:#fff">Atlas Verification — ${new Date().toISOString()}</h2>
  `;

  for (const a of atlases) {
    html += `
    <div class="atlas">
      <h3>${a.name} (${a.w}×${a.h} → ${a.w*scale}×${a.h*scale})</h3>
      <div class="checkerboard">
        <img src="http://localhost:5176/assets/${a.name}"
             width="${a.w*scale}" height="${a.h*scale}"
             style="image-rendering:pixelated; display:block;" />
      </div>
    </div>`;
  }

  html += '</body></html>';

  await page.setContent(html);
  await page.waitForTimeout(2000);

  const screenshotPath = '/tmp/claude-0/-home-user-MTSR/6f9830c3-37f8-50ec-a95c-4a2d9f6fe5c3/scratchpad/atlases-verify.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to:', screenshotPath);
  await browser.close();
})();
