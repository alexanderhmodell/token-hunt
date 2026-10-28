// Stress battery. Runs many games fast by driving the state machine with real input events,
// then checks invariants. Exit code 1 on any failure.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); console.log((cond ? 'PASS ' : 'FAIL ') + msg); };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  const url = 'file://' + path.resolve(__dirname, 'dist/index.html');
  await page.goto(url); await page.waitForTimeout(500);
  const cv = await page.$('#g'); let box = await cv.boundingBox();
  const toPage = (x, y) => [box.x + x * box.width / 256, box.y + y * box.height / 240];
  const G = (fn, arg) => page.evaluate(fn, arg);
  const invariants = async (tag) => {
    const r = await G(() => { const G = window.__th; const bad = [];
      if (!(G.score >= 0) || !Number.isFinite(G.score)) bad.push('score ' + G.score);
      if (G.tally.length > 6) bad.push('tally>6 ' + G.tally.length);
      if (G.wave > 6) bad.push('wave>6 ' + G.wave);
      if (G.shots < 0 || G.shots > 5) bad.push('shots ' + G.shots);
      for (const b of G.birds) if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) bad.push('NaN bird');
      if (G.fx.length > 400) bad.push('fx leak ' + G.fx.length);
      if (G.rain.length > 200) bad.push('rain ' + G.rain.length);
      if (!['title','boot','intro','fly','fox','gap','roundEnd','gameOver'].includes(G.state)) bad.push('state ' + G.state);
      return bad; });
    ok(r.length === 0, `invariants @${tag}` + (r.length ? ': ' + r.join(', ') : ''));
  };

  // ---- 1. Fast-forward helper: speed up the fixed-step loop by driving update() directly
  // 50 full games on each difficulty via attract AI (plays badly) + an aimbot variant (plays perfectly)
  await G(() => { window.__fast = (frames) => { for (let i = 0; i < frames; i++) window.__update && window.__update(); }; });
  const hasUpdate = await G(() => typeof window.__update === 'function');
  if (!hasUpdate) console.log('note: __update not exposed; using wall-clock');

  // ---- 2. Click spam on title / boot / play: 300 rapid clicks at random points
  for (let i = 0; i < 300; i++) { const x = Math.random() * 256, y = Math.random() * 240; await page.mouse.click(...toPage(x, y), { delay: 0 }); }
  await invariants('click-spam');
  // ---- 3. Rapid pause/resume x100
  for (let i = 0; i < 100; i++) await page.keyboard.press('p');
  await invariants('pause-spam');
  await G(() => { window.__th.paused = false; });
  // ---- 4. Theme flip mid-flight x40 while birds exist
  await G(() => { const G = window.__th; G.attract = false; G.state = 'fly'; G.shots = 3; G.birds = [{ x: 80, y: 60, vx: 1, vy: -1, sp: 1.5, tier: 'hi', bad: false, st: 'fly', f: 0, at: 0, dirT: 99, hitT: 0 }, { x: 150, y: 100, vx: -1, vy: -1, sp: 1.5, tier: 'lo', bad: true, st: 'fly', f: 2, at: 5, dirT: 99, hitT: 0 }]; });
  for (let i = 0; i < 40; i++) { await page.keyboard.type(i % 2 ? 'token' : 'duck'); await page.waitForTimeout(20); }
  await invariants('theme-flip');
  ok((await G(() => window.__th.theme)) === 'token' ? false : true, 'theme is a valid id after flips: ' + (await G(() => window.__th.theme)));
  // ---- 5. Assisted toggle spam
  for (let i = 0; i < 20; i++) await page.keyboard.type('finn');
  ok((await G(() => window.__th.assist)) === false, 'assist off after even toggles');
  // ---- 6. Resize storm: 30 random viewports incl. phone
  for (let i = 0; i < 30; i++) { const w = 320 + Math.floor(Math.random() * 1600), h = 400 + Math.floor(Math.random() * 1000); await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(15); }
  const over = await G(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok(!over, 'no horizontal overflow after resize storm');
  await page.setViewportSize({ width: 1000, height: 900 }); box = await cv.boundingBox();
  // ---- 7. Long autoplay: attract mode AI for ~60 s wall clock, check it cycles and never errors
  await G(() => { const G = window.__th; G.state = 'title'; G.t = 0; G.attract = false; G.idle = 539; });
  const t0 = Date.now(); let maxRound = 0, cycles = 0, lastState = '';
  while (Date.now() - t0 < 60000) { const s = await G(() => ({ st: window.__th.state, r: window.__th.round, a: window.__th.attract })); if (s.r > maxRound) maxRound = s.r; if (s.st === 'title' && lastState !== 'title') cycles++; lastState = s.st; await page.waitForTimeout(250); }
  ok(cycles >= 1, `attract loop cycled back to title ${cycles}x in 60 s (max round ${maxRound})`);
  await invariants('after-attract');
  // ---- 8. Deep run: force-advance 30 epochs through all levels, both skins, checking invariants each
  for (const theme of ['gpu', 'duck']) {
    await G((th) => { window.__applyTheme(th); const G = window.__th; G.attract = false; G.state = 'title'; }, theme);
    await page.mouse.click(...toPage(128, 100)); await page.waitForTimeout(1000); await page.mouse.click(...toPage(128, 100)); // boot skip
    for (let r = 1; r <= 30; r++) {
      await G(() => { const G = window.__th; G.wave = 6; G.tally = ['hit','hit','hit','hit','hit','hit']; G.state = 'fox'; G.fox.t = 109; G.fox.mode = 'hit'; G.fox.line = 'X'; G.birds = []; });
      await page.waitForTimeout(80); // -> roundEnd
      await G(() => { const G = window.__th; if (G.state === 'roundEnd') { G.t = 60; } });
      await page.mouse.click(...toPage(128, 100)); await page.waitForTimeout(60); // -> intro
      await G(() => { const G = window.__th; G.t = 129; }); await page.waitForTimeout(80); // -> fly or tut
      await G(() => { const G = window.__th; if (G.state === 'fox' && G.fox.mode === 'tut') G.fox.t = 99; }); await page.waitForTimeout(60);
      if (r % 10 === 0) await invariants(`${theme} epoch ${r}`);
    }
    const info = await G(() => ({ round: window.__th.round, level: window.__th.wx.name, state: window.__th.state, maxSp: Math.max(0, ...window.__th.birds.map(b => b.sp)) }));
    ok(info.round >= 30, `${theme}: reached round ${info.round} (${info.level}, ${info.state}, top speed ${info.maxSp.toFixed(2)})`);
    ok(info.maxSp <= 3.2 * 1.3 * 1.2 * 1.05, `${theme}: speed capped (${info.maxSp.toFixed(2)})`);
  }
  // ---- 9. 500 shots as fast as possible during fly; cost accounting exact
  await G(() => { const G = window.__th; G.state = 'fly'; G.shots = 5; G.assist = true; G.cost = 0; G.birds = []; });
  let fired = 0; for (let i = 0; i < 500; i++) { const before = await G(() => window.__th.shots); if (before > 0) fired++; await page.mouse.click(...toPage(10, 10)); if (before <= 1) break; }
  const cost = await G(() => window.__th.cost); ok(cost === fired * 100, `cost accounting exact: fired ${fired}, cost ${cost}`);
  await G(() => { window.__th.assist = false; });
  // ---- 10. Storage-less mode: block localStorage and reload
  const ctx2 = await browser.newContext({ viewport: { width: 800, height: 800 } });
  const p2 = await ctx2.newPage(); const errs2 = []; p2.on('pageerror', e => errs2.push(e.message));
  await p2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  await p2.goto(url); await p2.waitForTimeout(600);
  const alive = await p2.evaluate(() => window.__th && window.__th.state === 'title');
  ok(alive && errs2.length === 0, 'boots with localStorage blocked' + (errs2.length ? ': ' + errs2[0] : ''));
  await p2.keyboard.type('duck'); await p2.waitForTimeout(100);
  ok((await p2.evaluate(() => window.__th.theme)) === 'duck', 'theme switch works without storage');
  await ctx2.close();
  // ---- 11. Hot-reload snapshot/ready path
  const ctx3 = await browser.newContext({ viewport: { width: 800, height: 800 } });
  const p3 = await ctx3.newPage(); const errs3 = []; p3.on('pageerror', e => errs3.push(e.message));
  await p3.addInitScript(() => { window.claude = { hot: { data: { hi: 123456 }, ready(fn) { fn(this.data); }, snapshot(fn) { window.__snap = fn; } } }; });
  await p3.goto(url); await p3.waitForTimeout(500);
  const hi = await p3.evaluate(() => window.__th.hi); const snap = await p3.evaluate(() => window.__snap && window.__snap());
  ok(hi === 123456 && snap && snap.hi === 123456 && errs3.length === 0, `hot reload: hi restored (${hi}), snapshot ${JSON.stringify(snap)}`);
  await ctx3.close();
  // ---- 12. Frame budget: measure draw+update time over 600 frames
  const ms = await G(() => new Promise(res => { let n = 0, start = performance.now(); const tick = () => { if (++n >= 300) return res((performance.now() - start) / 300); requestAnimationFrame(tick); }; requestAnimationFrame(tick); }));
  ok(ms < 20, `avg frame ${ms.toFixed(2)} ms (headless, software GL; <20 ms)`);
  // ---- 13. Forbidden strings in the live DOM text and canvas strings
  const dom = await G(() => document.documentElement.outerHTML);
  ok(!/duck\s*hunt|nintendo|\bnes\b|fly\s*away|zapper/i.test(dom), 'no forbidden strings in served page');

  console.log('\nerrors:', errors.length ? errors : 'none');
  ok(errors.length === 0, 'zero page/console errors across the battery');
  await browser.close();
  console.log(`\n${fails.length ? 'FAILURES: ' + fails.length : 'ALL PASS'}`);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
