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
  let st = await page.evaluate(() => ({ state: window.__th.state, wx: window.__th.wx.name }));
  console.log('after start:', st);
  await shot('02_intro');
  await page.waitForTimeout(2200);
  st = await page.evaluate(() => ({ state: window.__th.state, birds: window.__th.birds.map(b => [b.st, Math.round(b.x), Math.round(b.y)]) }));
  console.log('wave 1:', st);
  // move mouse over the bird and shoot it (aim at bird center)
  for (let i = 0; i < 3; i++) {
    const b = await page.evaluate(() => { const b = window.__th.birds.find(b => b.st === 'fly'); return b ? { x: b.x + 12, y: b.y + 10 } : null; });
    if (!b) break;
    await page.mouse.move(...toPage(b.x, b.y));
    await page.waitForTimeout(30);
    await shot('03_aim' + i);
    await page.mouse.click(...toPage(b.x, b.y));
    await page.waitForTimeout(120);
    const after = await page.evaluate(() => ({ shots: window.__th.shots, birds: window.__th.birds.map(b => b.st), score: window.__th.score, tally: window.__th.tally }));
    console.log('shot', i, after);
    if (after.birds.some(s => s === 'hit')) break;
  }
  await page.waitForTimeout(500);
  await shot('04_hit_or_fall');
  await page.waitForTimeout(900);
  await shot('05_fall');
  // wait for fox
  for (let k = 0; k < 40; k++) { const s = await page.evaluate(() => window.__th.state); if (s === 'fox') break; await page.waitForTimeout(100); }
  await page.waitForTimeout(600);
  console.log('fox:', await page.evaluate(() => ({ state: window.__th.state, fox: window.__th.fox })));
  await shot('06_fox');

  // force a miss: wait for next wave, then fire 3 shots into the sky corner
  for (let k = 0; k < 60; k++) { const s = await page.evaluate(() => window.__th.state); if (s === 'fly') break; await page.waitForTimeout(100); }
  for (let i = 0; i < 3; i++) { await page.mouse.click(...toPage(5, 5)); await page.waitForTimeout(80); }
  await page.waitForTimeout(250);
  await shot('07_flyaway');
  for (let k = 0; k < 60; k++) { const s = await page.evaluate(() => window.__th.state); if (s === 'fox') break; await page.waitForTimeout(100); }
  await page.waitForTimeout(700);
  await shot('08_fox_laugh');
  console.log('after miss:', await page.evaluate(() => ({ tally: window.__th.tally, fox: window.__th.fox.mode })));

  // jump to storm round to check weather rendering, then force round end + game over screens
  await page.evaluate(() => { const G = window.__th; G.round = 5; G.state = 'intro'; G.t = 0; });
  await page.evaluate(() => { const G = window.__th; G.wx = window.__T().levels[2]; G.rain = []; for (let i = 0; i < 130; i++) G.rain.push({ x: Math.random() * 256, y: Math.random() * 188, l: 3 }); G.lightning = 3; });
  await page.waitForTimeout(80);
  await shot('09_storm_intro');
  await page.evaluate(() => { const G = window.__th; G.state = 'roundEnd'; G.t = 0; G.tally = ['hit','hit','miss','hit','hit','hit']; G.perfect = false; });
  await page.waitForTimeout(100);
  await shot('10_round_clear');
  await page.evaluate(() => { const G = window.__th; G.state = 'gameOver'; G.t = 100; G.newRecord = true; G.fox = { mode: 'miss', t: 30, x: 112, count: 0, line: 'HAVE YOU TRIED TURNING IT OFF AND ON?' }; });
  await page.waitForTimeout(100);
  await shot('11_game_over');
  // dusk + rain look
  await page.evaluate(() => { const G = window.__th; G.state = 'fly'; G.wx = window.__T().levels[5]; G.rain = []; G.birds = [{ x: 80, y: 60, vx: 1, vy: -1, sp: 1.5, gold: true, st: 'fly', f: 0, at: 0, dirT: 999, hitT: 0 }, { x: 160, y: 100, vx: -1, vy: -1, sp: 1.5, gold: false, st: 'fly', f: 2, at: 0, dirT: 999, hitT: 0 }]; G.shots = 2; G.flightT = 0; G.round = 6; });
  await page.waitForTimeout(100);
  await shot('12_dusk_two_birds');

  // CP1 checks: pause freezes t; combo multiplier; storm is epoch 3; theme hooks exist
  await page.evaluate(() => { const G = window.__th; G.state = 'fly'; G.paused = false; });
  await page.keyboard.press('p'); await page.waitForTimeout(100);
  const t1 = await page.evaluate(() => window.__th.t); await page.waitForTimeout(400);
  const t2 = await page.evaluate(() => window.__th.t);
  console.log('pause holds t:', t1 === t2, '| paused =', await page.evaluate(() => window.__th.paused));
  await page.keyboard.press('p'); await page.waitForTimeout(200);
  console.log('resume advances t:', (await page.evaluate(() => window.__th.t)) > t2);
  const combo = await page.evaluate(() => { const G = window.__th; G.combo = 3; return [G.combo, window.__T().levels[2].name, typeof window.__applyTheme]; });
  console.log('combo=3 →', combo);
  await page.evaluate(() => { window.__th.combo = 0; });
  // CP2 checks: difficulty, tiers, cost, hallucination
  await page.evaluate(() => { const G = window.__th; G.state = 'title'; G.t = 0; });
  await page.keyboard.press('3'); await page.waitForTimeout(50);
  const d = await page.evaluate(() => window.__th.diff); console.log('hard selected:', d === 'hard');
  await page.mouse.click(...toPage(128, 100)); await page.waitForTimeout(2400);
  const hardWave = await page.evaluate(() => ({ shots: window.__th.shots, birds: window.__th.birds.map(b => [b.tier, b.bad, +b.sp.toFixed(2)]) }));
  console.log('hard wave:', JSON.stringify(hardWave));
  const tiers = await page.evaluate(() => { const G = window.__th; let hi = 0; for (let i = 0; i < 400; i++) { G.round = 1; const b = (function(){ return window.__spawn ? window.__spawn() : null; })(); } return 'n/a'; });
  const costBefore = await page.evaluate(() => window.__th.cost);
  await page.mouse.click(...toPage(5, 5)); await page.waitForTimeout(80);
  console.log('shot costs 100:', (await page.evaluate(() => window.__th.cost)) - costBefore === 100);
  // force a hallucination wave
  await page.evaluate(() => { const G = window.__th; G.forceHalluc = true; G.state = 'gap'; G.t = 23; G.birds = []; });
  await page.waitForTimeout(300);
  const hw = await page.evaluate(() => { const G = window.__th; return { wave: G.wave, birds: G.birds.map(b => b.bad), tally: G.tally.length }; });
  console.log('halluc wave:', JSON.stringify(hw));
  const bad = await page.evaluate(() => { const b = window.__th.birds.find(b => b.bad); return b ? { x: b.x + 12, y: b.y + 10 } : null; });
  const scoreBefore = await page.evaluate(() => { window.__th.score = 2000; return 2000; });
  if (bad) { await page.mouse.click(...toPage(bad.x, bad.y)); await page.waitForTimeout(100); }
  const after = await page.evaluate(() => ({ score: window.__th.score, served: window.__th.hallucServed, tally: window.__th.tally.length, wave: window.__th.wave }));
  console.log('served hallucination → -500, no tally change:', JSON.stringify(after), '| expected score 1500, served true');
  await page.evaluate(() => { window.__th.forceHalluc = false; });
  await page.waitForTimeout(1500); await shot('14_halluc_critic');
  await page.evaluate(() => { const G = window.__th; G.state = 'title'; G.t = 0; }); await page.waitForTimeout(100); await shot('15_title_diff');
  // phone-width layout
  await page.setViewportSize({ width: 390, height: 760 });
  await page.waitForTimeout(200);
  await shot('13_phone');

  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
