// Renders dist/og.png (1200x630) from the title screen for link previews.
const { chromium, launchOpts } = require('./pw'); const path = require('path');
(async () => {
  const b = await chromium.launch(launchOpts);
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + path.resolve(__dirname, 'dist/index.html')); await p.waitForTimeout(700);
  await p.evaluate(() => { const G = window.__th; G.t = 16; G.titleFox = 60; G.amb.x = 40; G.amb.y = 60; }); await p.waitForTimeout(50);
  await p.screenshot({ path: path.resolve(__dirname, 'dist/og.png') });
  await b.close(); console.log('dist/og.png written');
})();
