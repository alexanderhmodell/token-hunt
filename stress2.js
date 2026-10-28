// Stress pass 2: touch emulation, keyboard fuzz, state-mutation fuzz, blur/focus cycling, long aimbot run.
const { chromium, devices } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const fails = []; const ok = (c, m) => { if (!c) fails.push(m); console.log((c ? 'PASS ' : 'FAIL ') + m); };
const url = 'file://' + path.resolve(__dirname, 'dist/index.html');
const hookErrors = (page, arr) => { page.on('pageerror', e => arr.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) arr.push('CONSOLE ' + m.text()); }); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const ONLY = process.env.ONLY || '';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });

  // ---------- A. Touch emulation (iPhone-ish): real touch events through Chromium
  {
    const ctx = await browser.newContext({ ...devices['iPhone 13'], defaultBrowserType: 'chromium' });
    const page = await ctx.newPage(); const errs = []; hookErrors(page, errs);
    await page.goto(url); await sleep(600);
    const box = await (await page.$('#g')).boundingBox();
    const tp = (x, y) => [box.x + x * box.width / 256, box.y + y * box.height / 240];
    ok(box.width <= 390 && box.width > 300, `touch: canvas fits phone width (${Math.round(box.width)}px of 390)`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); ok(!over, 'touch: no horizontal overflow');
    // tap below the logo starts the game
    await page.touchscreen.tap(...tp(128, 150)); await sleep(150);
    ok((await page.evaluate(() => window.__th.state)) === 'boot', 'touch: tap starts the game (boot)');
    await sleep(900); await page.touchscreen.tap(...tp(128, 150)); await sleep(150); // skip boot
    // wait for first wave (shorter intro + tutorial)
    let t0 = Date.now(); while (Date.now() - t0 < 9000 && (await page.evaluate(() => window.__th.state)) !== 'fly') await sleep(60);
    const t1 = (Date.now() - t0) / 1000; ok(await page.evaluate(() => window.__th.state === 'fly'), `touch: first wave reached (${t1.toFixed(1)} s after boot skip)`);
    // touch aim offset: tap directly ON the bird should still hit because the offset is applied to both aim and hit test
    const b = await page.evaluate(() => { for (const b of window.__th.birds) { b.vx = 0; b.vy = 0; b.dirT = 1e9; } const b = window.__th.birds.find(b => b.st === 'fly' && !b.bad); return b ? { x: b.x + 12, y: b.y + 10 } : null; });
    if (b) { await page.touchscreen.tap(...tp(b.x, b.y + 18)); await sleep(100); } // finger 18px below where it wants to aim
    ok(await page.evaluate(() => window.__th.tally.includes('hit')), 'touch: lifted aim hits the bird when the finger is 18px below it');
    // 7 logo taps open the code input on touch
    await page.evaluate(() => { const G = window.__th; G.state = 'title'; G.attract = false; G.idle = 0; });
    for (let i = 0; i < 7; i++) { await page.touchscreen.tap(...tp(128, 40)); await sleep(30); }
    await sleep(150);
    ok(await page.evaluate(() => document.activeElement && document.activeElement.id === 'code'), 'touch: 7 logo taps focus the code input');
    ok((await page.evaluate(() => window.__th.state)) === 'title', 'touch: logo taps did not start the game');
    await page.keyboard.type('duck'); await sleep(150);
    ok((await page.evaluate(() => window.__th.theme)) === 'duck', 'touch: code typed into the input switches skin');
    await page.evaluate(() => document.activeElement.blur());
    // pause icon / mute icon tap targets at phone scale
    await page.evaluate(() => { const G = window.__th; G.state = 'fly'; G.paused = false; });
    await page.touchscreen.tap(...tp(234, 7)); await sleep(80); ok(await page.evaluate(() => window.__th.paused), 'touch: pause icon tap target works');
    await page.touchscreen.tap(...tp(128, 100)); await sleep(80); ok(await page.evaluate(() => !window.__th.paused), 'touch: tap resumes');
    const mutedBefore = await page.evaluate(() => localStorage.getItem('th.muted'));
    await page.touchscreen.tap(...tp(248, 7)); await sleep(80); const mutedAfter = await page.evaluate(() => localStorage.getItem('th.muted')); ok(mutedBefore !== mutedAfter, 'touch: mute icon tap target works');
    await page.touchscreen.tap(...tp(248, 7)); await sleep(50);
    ok(errs.length === 0, 'touch: zero errors' + (errs.length ? ' ' + errs[0] : ''));
    await ctx.close();
  }

  // ---------- B. Keyboard fuzz: 3000 random keys across random states
  {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
    const page = await ctx.newPage(); const errs = []; hookErrors(page, errs);
    await page.goto(url); await sleep(500);
    const keys = ['a','b','c','d','u','k','t','o','e','n','f','i','v','g','p','u','m','1','2','3','Escape',' ','Enter','ArrowLeft','ArrowRight','Tab','Shift','x','z'];
    const states = ['title','boot','intro','fly','fox','gap','roundEnd','gameOver'];
    for (let i = 0; i < 3000; i++) {
      if (i % 100 === 0) await page.evaluate((st) => { const G = window.__th; G.state = st; G.t = 50; G.paused = false; G.attract = false; if (st === 'boot') G.boot = { t: 50, line: 1 }; if (st === 'fox') { G.fox.t = 30; G.fox.line = 'X'; G.fox.mode = 'hit'; } }, states[(i / 100 | 0) % states.length]);
      await page.keyboard.press(keys[Math.floor(Math.random() * keys.length)]);
    }
    await sleep(300);
    const st = await page.evaluate(() => ({ state: window.__th.state, theme: window.__th.theme, score: window.__th.score }));
    ok(errs.length === 0 && ['gpu','duck'].includes(st.theme) && Number.isFinite(st.score), `keyboard fuzz: 3000 keys, no errors, state ${st.state}, theme ${st.theme}`);
    await ctx.close();
  }

  // ---------- C. State-mutation fuzz: random partial state + random input, draw must never throw
  {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
    const page = await ctx.newPage(); const errs = []; hookErrors(page, errs);
    await page.goto(url); await sleep(500);
    const box = await (await page.$('#g')).boundingBox();
    const r = await page.evaluate(async () => {
      const G = window.__th; const states = ['title','boot','intro','fly','fox','gap','roundEnd','gameOver'];
      const rnd = (a, b) => a + Math.random() * (b - a); let thrown = 0;
      window.addEventListener('error', () => thrown++);
      for (let i = 0; i < 1500; i++) {
        G.state = states[Math.floor(Math.random() * states.length)]; G.t = Math.floor(rnd(0, 400)); G.round = Math.floor(rnd(1, 40)); G.wave = Math.floor(rnd(0, 7));
        G.tally = Array.from({ length: Math.floor(rnd(0, 7)) }, () => Math.random() < 0.6 ? 'hit' : 'miss'); G.shots = Math.floor(rnd(0, 6)); G.score = Math.floor(rnd(0, 1e6)); G.cost = Math.floor(rnd(0, 1e5));
        G.combo = Math.floor(rnd(0, 12)); G.paused = Math.random() < 0.1; G.attract = Math.random() < 0.2; G.assist = Math.random() < 0.3; G.freeze = Math.floor(rnd(0, 4));
        G.fox = { mode: ['hit','miss','tut'][Math.floor(rnd(0, 3))], t: Math.floor(rnd(0, 120)), x: Math.floor(rnd(-10, 260)), count: Math.floor(rnd(0, 3)), line: ['A','GREAT QUESTION!','HAVE YOU TRIED TURNING IT OFF AND ON?'][Math.floor(rnd(0, 3))] };
        G.boot = { t: Math.floor(rnd(0, 200)), line: Math.floor(rnd(-1, 5)) };
        G.birds = Array.from({ length: Math.floor(rnd(0, 4)) }, () => ({ x: rnd(-30, 280), y: rnd(-30, 200), vx: rnd(-3, 3), vy: rnd(-3, 3), sp: rnd(0.5, 4), tier: Math.random() < 0.5 ? 'hi' : 'lo', bad: Math.random() < 0.3, st: ['fly','hit','fall','landed','away','gone'][Math.floor(rnd(0, 6))], f: Math.floor(rnd(0, 4)), at: Math.floor(rnd(0, 500)), dirT: rnd(1, 80), hitT: Math.floor(rnd(0, 30)), lx: rnd(0, 230) }));
        if (Math.random() < 0.3) window.__applyTheme(Math.random() < 0.5 ? 'duck' : 'gpu');
        if (Math.random() < 0.2) { const lv = window.__T().levels; G.wx = lv[Math.floor(rnd(0, lv.length))]; G.lightning = Math.floor(rnd(0, 4)); }
        await new Promise(r => requestAnimationFrame(r)); // one real update+draw
      }
      G.paused = false; G.attract = false; G.freeze = 0; G.state = 'title'; G.t = 0; window.__applyTheme('gpu');
      return thrown;
    });
    ok(r === 0 && errs.length === 0, `state fuzz: 1500 random states drawn, ${r} throws, ${errs.length} console errors`);
    // random clicks while fuzzing continues
    for (let i = 0; i < 200; i++) { await page.evaluate(() => { const G = window.__th; G.state = ['title','fly','fox','roundEnd','gameOver','boot'][Math.floor(Math.random() * 6)]; G.t = 100; G.boot = { t: 50, line: 1 }; }); await page.mouse.click(box.x + Math.random() * box.width, box.y + Math.random() * box.height); }
    ok(errs.length === 0, 'state fuzz + clicks: no errors');
    await ctx.close();
  }

  // ---------- D. Blur / focus / visibility cycling in play and in attract
  {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
    const page = await ctx.newPage(); const errs = []; hookErrors(page, errs);
    await page.goto(url); await sleep(500);
    await page.evaluate(() => { const G = window.__th; G.state = 'fly'; G.attract = false; });
    await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await sleep(50);
    ok(await page.evaluate(() => window.__th.paused), 'blur pauses real play');
    await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await sleep(50);
    ok(await page.evaluate(() => window.__th.paused), 'focus does NOT auto-resume real play (user must tap)');
    await page.evaluate(() => { const G = window.__th; G.paused = false; G.attract = true; G.state = 'fly'; });
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); await sleep(50);
    ok(await page.evaluate(() => window.__th.paused), 'hidden tab pauses attract');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); await sleep(50);
    ok(await page.evaluate(() => !window.__th.paused), 'visible tab auto-resumes attract');
    for (let i = 0; i < 200; i++) { await page.evaluate(() => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); }); }
    ok(errs.length === 0, 'blur/focus x200: no errors');
    await ctx.close();
  }

  // ---------- E. Keyboard start + restart path
  {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
    const page = await ctx.newPage(); const errs = []; hookErrors(page, errs);
    await page.goto(url); await sleep(500);
    await page.keyboard.press('Space'); await sleep(100); console.log('after Space:', await page.evaluate(() => ({ state: window.__th.state, diff: window.__th.diff })));
    ok((await page.evaluate(() => window.__th.state)) === 'boot', 'Space on title starts the game');
    await page.evaluate(() => { const G = window.__th; G.state = 'gameOver'; G.t = 100; G.fox = { mode: 'miss', t: 10, x: 100, count: 0, line: 'X' }; });
    await page.keyboard.press('Enter'); await sleep(100);
    const st = await page.evaluate(() => window.__th.state);
    ok(st === 'intro', `Enter on game over restarts straight into epoch 1 (state ${st}, no BIOS)`);
    ok(errs.length === 0, 'keyboard paths: no errors');
    await ctx.close();
  }

  // ---------- F. Long aimbot run (ONLY=F runs just this): 150 s of real-time play reaching late epochs naturally
  {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
    const page = await ctx.newPage(); const errs = []; hookErrors(page, errs);
    await page.goto(url); await sleep(500);
    const res = await page.evaluate(async () => {
      const G = window.__th; const cv = document.getElementById('g'); const R = () => cv.getBoundingClientRect();
      const tap = (x, y) => { const r = R(); cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + x * r.width / 256, clientY: r.top + y * r.height / 240, pointerType: 'mouse', bubbles: true, cancelable: true })); };
      const seen = { levels: new Set(), halluc: 0, hallucServed: 0, doubles: 0, hi: 0, perfect: 0, maxRound: 1, maxCombo: 0, maxBirds: 0, lines: new Set() };
      tap(128, 100); // start (y=150 is the difficulty row)
      const t0 = performance.now();
      while (performance.now() - t0 < 150000) {
        await new Promise(r => setTimeout(r, 40));
        if (G.state === 'boot' && G.boot.t > 41) tap(128, 100);
        else if (G.state === 'title') tap(128, 100);
        else if (G.state === 'fly') {
          seen.maxBirds = Math.max(seen.maxBirds, G.birds.length);
          if (G.birds.filter(b => !b.bad).length >= 2 && G.flightT < 3) seen.doubles++;
          const bad = G.birds.find(b => b.bad && b.st === 'fly'); if (bad && G.flightT === 1) seen.halluc++;
          const b = G.birds.find(b => b.st === 'fly' && !b.bad);
          if (b && G.shots > 0 && G.flightT > 10 && (G.flightT - (seen.lastShot || 0)) > 14) { seen.lastShot = G.flightT; if (b.tier === 'hi') seen.hi++; tap(b.x + 12 + b.vx * 2, b.y + 10 + b.vy * 2); }
          else if (bad && G.shots > 0 && Math.random() < 0.01) { tap(bad.x + 12, bad.y + 10); seen.hallucServed++; }
        }
        else if (G.state === 'roundEnd' && G.t > 55) { if (G.perfect) seen.perfect++; tap(128, 100); seen.lastShot = 0; }
        else if (G.state === 'gap' || G.state === 'fox') seen.lastShot = 0;
        else if (G.state === 'gameOver' && G.t > 75) tap(128, 100);
        if (G.state === 'fox' && G.fox.line) seen.lines.add(G.fox.line);
        seen.levels.add(G.wx.name); seen.maxRound = Math.max(seen.maxRound, G.round); seen.maxCombo = Math.max(seen.maxCombo, G.combo);
      }
      return { ...seen, levels: [...seen.levels], lines: seen.lines.size, finalScore: G.score, finalRound: G.round, fx: G.fx.length, state: G.state };
    });
    console.log('aimbot run:', JSON.stringify(res));
    ok(res.maxRound >= 4, `aimbot reached epoch ${res.maxRound} in 150 s (levels: ${res.levels.join(', ')})`);
    ok(res.halluc > 0, `hallucinations spawned naturally (${res.halluc})`);
    ok(res.lines >= 4, `critic used ${res.lines} distinct lines`);
    ok(res.fx < 200, `particle list bounded (${res.fx})`);
    ok(errs.length === 0, 'long run: no errors' + (errs.length ? ' ' + errs[0] : ''));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${fails.length ? 'FAILURES: ' + fails.length + '\n - ' + fails.join('\n - ') : 'ALL PASS'}`);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
