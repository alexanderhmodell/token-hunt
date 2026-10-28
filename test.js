// Headless playtest: drives the game through its states and screenshots key frames.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'dist/index.html'));
  await page.waitForTimeout(600);
  const shot = (n) => page.screenshot({ path: path.resolve(__dirname, 'shots', n + '.png') });
  await shot('01_title');

  const cv = await page.$('#g');
  const box = await cv.boundingBox();
  const toPage = (x, y) => [box.x + x * box.width / 256, box.y + y * box.height / 240];

  // start game
  await page.mouse.click(...toPage(128, 100));
  await page.waitForTimeout(300);
  let st = await page.evaluate(() => ({ state: window.__fw.state, wx: window.__fw.wx.name }));
  console.log('after start:', st);
  await shot('02_intro');
  await page.waitForTimeout(2200);
  st = await page.evaluate(() => ({ state: window.__fw.state, birds: window.__fw.birds.map(b => [b.st, Math.round(b.x), Math.round(b.y)]) }));
  console.log('wave 1:', st);
  // move mouse over the bird and shoot it (aim at bird center)
  for (let i = 0; i < 3; i++) {
    const b = await page.evaluate(() => { const b = window.__fw.birds.find(b => b.st === 'fly'); return b ? { x: b.x + 12, y: b.y + 10 } : null; });
    if (!b) break;
    await page.mouse.move(...toPage(b.x, b.y));
    await page.waitForTimeout(30);
    await shot('03_aim' + i);
    await page.mouse.click(...toPage(b.x, b.y));
    await page.waitForTimeout(120);
    const after = await page.evaluate(() => ({ shots: window.__fw.shots, birds: window.__fw.birds.map(b => b.st), score: window.__fw.score, tally: window.__fw.tally }));
    console.log('shot', i, after);
    if (after.birds.some(s => s === 'hit')) break;
  }
  await page.waitForTimeout(500);
  await shot('04_hit_or_fall');
  await page.waitForTimeout(900);
  await shot('05_fall');
  // wait for fox
  for (let k = 0; k < 40; k++) { const s = await page.evaluate(() => window.__fw.state); if (s === 'fox') break; await page.waitForTimeout(100); }
  await page.waitForTimeout(600);
  console.log('fox:', await page.evaluate(() => ({ state: window.__fw.state, fox: window.__fw.fox })));
  await shot('06_fox');

  // force a miss: wait for next wave, then fire 3 shots into the sky corner
  for (let k = 0; k < 60; k++) { const s = await page.evaluate(() => window.__fw.state); if (s === 'fly') break; await page.waitForTimeout(100); }
  for (let i = 0; i < 3; i++) { await page.mouse.click(...toPage(5, 5)); await page.waitForTimeout(80); }
  await page.waitForTimeout(250);
  await shot('07_flyaway');
  for (let k = 0; k < 60; k++) { const s = await page.evaluate(() => window.__fw.state); if (s === 'fox') break; await page.waitForTimeout(100); }
  await page.waitForTimeout(700);
  await shot('08_fox_laugh');
  console.log('after miss:', await page.evaluate(() => ({ tally: window.__fw.tally, fox: window.__fw.fox.mode })));

  // jump to storm round to check weather rendering, then force round end + game over screens
  await page.evaluate(() => { const G = window.__fw; G.round = 5; G.state = 'intro'; G.t = 0; });
  await page.evaluate(() => { const G = window.__fw; G.wx = { name:'VIRAL LAUNCH', sky:'#2a1f4a', floor:'#1c1830', wind:0.8, rain:2, cloud:'#4e4472', storm:true, tag:'429 RATE LIMITS' }; G.rain = []; for (let i = 0; i < 130; i++) G.rain.push({ x: Math.random() * 256, y: Math.random() * 188, l: 3 }); G.lightning = 3; });
  await page.waitForTimeout(80);
  await shot('09_storm_intro');
  await page.evaluate(() => { const G = window.__fw; G.state = 'roundEnd'; G.t = 0; G.tally = ['hit', 'hit', 'miss', 'hit', 'hit', 'hit', 'hit', 'miss', 'hit', 'hit']; G.perfect = false; });
  await page.waitForTimeout(100);
  await shot('10_round_clear');
  await page.evaluate(() => { const G = window.__fw; G.state = 'gameOver'; G.t = 100; G.newRecord = true; G.fox = { mode: 'laugh', t: 30, x: 112, count: 0, line: 'HAVE YOU TRIED TURNING IT OFF AND ON?' }; });
  await page.waitForTimeout(100);
  await shot('11_game_over');
  // dusk + rain look
  await page.evaluate(() => { const G = window.__fw; G.state = 'fly'; G.wx = { name:'MAINTENANCE', sky:'#c9623f', floor:'#2b2535', wind:0.2, rain:0, cloud:'#f0b48a', dusk:true, tag:'DEPLOY WINDOW' }; G.rain = []; G.birds = [{ x: 80, y: 60, vx: 1, vy: -1, sp: 1.5, gold: true, st: 'fly', f: 0, at: 0, dirT: 999, hitT: 0 }, { x: 160, y: 100, vx: -1, vy: -1, sp: 1.5, gold: false, st: 'fly', f: 2, at: 0, dirT: 999, hitT: 0 }]; G.shots = 2; G.flightT = 0; G.round = 6; });
  await page.waitForTimeout(100);
  await shot('12_dusk_two_birds');

  // phone-width layout
  await page.setViewportSize({ width: 390, height: 760 });
  await page.waitForTimeout(200);
  await shot('13_phone');

  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
