// Elite pass (v3) tests. ONLY=E0,E1 runs a subset. Exit code 1 on any failure.
//   E0 determinism + replay   E1 WebGL CRT   E2 speech + mouth   E3 mixed audio   E4 interpolation + trauma
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const url = 'file://' + path.resolve(__dirname, 'dist/index.html');
const fails = []; const ok = (c, m) => { if (!c) fails.push(m); console.log((c ? 'PASS ' : 'FAIL ') + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean); const want = k => !ONLY.length || ONLY.includes(k);
const hookErrors = (page, arr) => { page.on('pageerror', e => arr.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) arr.push('CONSOLE ' + m.text()); }); };
// in-page helpers installed on every page: a primary-pointer tap in logical coords, and a bot step
const HELPERS = () => {
  window.__tap = (x, y, type) => { const cv = document.getElementById('g'); const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + x * r.width / 256, clientY: r.top + y * r.height / 240, pointerType: type || 'mouse', button: 0, isPrimary: true, bubbles: true, cancelable: true })); };
  // mode 'aim': serve real requests (with deliberate misses and the odd hallucination); mode 'miss': shoot the sky
  window.__bot = (mode, mem) => { const G = window.__th, tap = window.__tap;
    if (G.replay) return;
    if (G.state === 'boot' && G.boot.t > 30) tap(128, 100);
    else if (G.state === 'title') tap(128, 100);
    else if (G.state === 'intro' && G.t > 30 && Math.random() < 0.3) tap(128, 100);
    else if (G.state === 'fly') {
      const b = G.birds.find(b => b.st === 'fly' && !b.bad), bad = G.birds.find(b => b.st === 'fly' && b.bad);
      if (G.shots > 0 && G.flightT > 10 && G.flightT - (mem.last || 0) > 14) { mem.last = G.flightT;
        if (mode === 'miss' || (mode === 'mix' && G.tally.length >= 2) || !b) tap(5 + Math.random() * 30, 5 + Math.random() * 20);
        else if (Math.random() < 0.12) tap(b.x + 60, b.y - 30); // deliberate miss
        else if (bad && Math.random() < 0.05) tap(bad.x + 12, bad.y + 10);
        else tap(b.x + 12 + b.vx * 2, b.y + 10 + b.vy * 2, Math.random() < 0.3 ? 'touch' : 'mouse'); }
    }
    else if (G.state === 'fox' && G.fox.t > 40 && Math.random() < 0.2) tap(128, 100);
    else if (G.state === 'roundEnd' && G.t > 55) { tap(128, 100); mem.last = 0; }
    else if (G.state === 'gap') mem.last = 0;
    else if (G.state === 'gameOver' && G.t > 75 && mem.restart) tap(128, 100);
    if (G.state === 'fly' && Math.random() < 0.004) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' })); // recorded key input
  };
};
const newPage = async (browser, opts) => { const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, ...(opts || {}) }); const page = await ctx.newPage(); const errs = []; hookErrors(page, errs); await page.addInitScript(HELPERS); return { ctx, page, errs }; };
const runBot = (page, mode, ms, until) => page.evaluate(async ([mode, ms, until]) => { const mem = { restart: !until }; const t0 = performance.now(); while (performance.now() - t0 < ms) { await new Promise(r => setTimeout(r, 40)); if (until && eval(until)) return true; window.__bot(mode, mem); } return false; }, [mode, ms, until]);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });

  // ---------------------------------------------------------------- E0 determinism + replay
  if (want('E0')) {
    const { ctx, page, errs } = await newPage(browser);
    await page.goto(url); await sleep(500);
    await runBot(page, 'aim', 60000);
    // capture the live state and replay the recording headlessly three times, all in one synchronous block
    const r = await page.evaluate(async () => {
      for (let i = 0; i < 100 && !window.__th.recOn; i++) await new Promise(r => setTimeout(r, 50));
      const G = window.__th; const live = window.__simStats(); const run = { init: G.recInit, rec: G.rec.map(e => e.slice()), frames: G.frame };
      const reps = [0, 1, 2].map(() => window.__replay(run, { headless: true, toFrame: live.frame }));
      return { live, reps, inputs: run.rec.length, keys: run.rec.filter(e => e[1] === 'k').length, touches: run.rec.filter(e => e[1] === 't').length, seed: run.init.seed };
    });
    const L = JSON.stringify(r.live);
    console.log(`  live @frame ${r.live.frame}: seed ${r.seed}, ${r.inputs} inputs (${r.touches} touch, ${r.keys} keys), round ${r.live.round}, score ${r.live.score}, state ${r.live.state}, run ${JSON.stringify(r.live.run)}`);
    ok(r.live.frame > 2500 && r.inputs > 50, `E0: recorded a real run (${r.live.frame} frames, ${r.inputs} inputs)`);
    r.reps.forEach((s, i) => { const same = JSON.stringify(s) === L; ok(same, `E0: replay ${i + 1}/3 identical (score ${s.score}, tally ${s.tally.map(t => t[0]).join('')}, round ${s.round}, run stats, birds, rng state)` + (same ? '' : '\n    live ' + L + '\n    rep  ' + JSON.stringify(s))); });
    // a recording replayed with one input removed must diverge (the test can tell runs apart)
    const div = await page.evaluate(() => { const G = window.__th; const run = { init: G.recInit, rec: G.rec.slice(), frames: G.frame }; if (!run.init) return null; const a = window.__replay(run, { headless: true, toFrame: 2400 }); const i = run.rec.findIndex(e => e[0] > 300 && e[1] === 't'); const run2 = { ...run, rec: run.rec.filter((e, j) => j !== i) }; const b = window.__replay(run2, { headless: true, toFrame: 2400 }); return JSON.stringify(a) !== JSON.stringify(b); });
    ok(div === true, 'E0: dropping one input changes the outcome (replay is input-sensitive, not a fluke)');

    // WATCH REPLAY from the game-over panel: end the run, play a fresh short run to game over, watch it back at 2x
    await runBot(page, 'miss', 90000, "window.__th.state==='gameOver'&&window.__th.t>80");
    await page.evaluate(() => window.__tap(128, 100)); // restart (recorded)
    const ended = await runBot(page, 'mix', 60000, "window.__th.state==='gameOver'&&window.__th.t>80");
    const lr = await page.evaluate(() => { const G = window.__th; return G.lastRun ? { score: G.score, round: G.round, frames: G.lastRun.frames, inputs: G.lastRun.rec.length, tally: G.tally.map(t => t[0]).join('') } : null; });
    ok(ended && lr && lr.frames > 300, `E0: short run ended in game over with a recording (${JSON.stringify(lr)})`);
    await page.screenshot({ path: path.resolve(__dirname, 'shots', 'e0_gameover_replay_button.png') });
    await page.evaluate(() => window.__tap(190, 121)); await sleep(100);
    const st = await page.evaluate(() => ({ replay: !!window.__th.replay, state: window.__th.state, frame: window.__th.frame, brag: !document.getElementById('brag').hidden }));
    ok(st.replay && st.state === 'intro' && !st.brag, `E0: WATCH REPLAY starts the replay (${JSON.stringify(st)})`);
    const w0 = Date.now(); await sleep(2000); const f1 = await page.evaluate(() => window.__th.frame); const rate = (f1 - st.frame) / ((Date.now() - w0) / 1000);
    ok(rate > 95, `E0: replay runs at ~2x (${rate.toFixed(0)} sim frames/s, real-time is 60)`);
    await page.screenshot({ path: path.resolve(__dirname, 'shots', 'e0_replay_badge.png') });
    // let it finish on its own
    let fin = null; const t0 = Date.now(); while (Date.now() - t0 < 30000) { fin = await page.evaluate(() => ({ replay: !!window.__th.replay, state: window.__th.state, score: window.__th.score, round: window.__th.round, tally: window.__th.tally.map(t => t[0]).join(''), brag: !document.getElementById('brag').hidden })); if (!fin.replay) break; await sleep(100); }
    ok(fin && !fin.replay && fin.state === 'gameOver' && fin.score === lr.score && fin.round === lr.round && fin.tally === lr.tally && fin.brag, `E0: replay plays to the same game over (score ${fin && fin.score} vs ${lr.score}, tally ${fin && fin.tally})`);
    // watch again and tap to skip: lands on the identical game-over state
    await page.evaluate(() => { window.__th.t = 100; }); await page.keyboard.press('r'); await sleep(300);
    const again = await page.evaluate(() => !!window.__th.replay);
    await page.evaluate(() => window.__tap(128, 100)); await sleep(100);
    const sk = await page.evaluate(() => ({ replay: !!window.__th.replay, state: window.__th.state, score: window.__th.score, tally: window.__th.tally.map(t => t[0]).join('') }));
    ok(again && !sk.replay && sk.state === 'gameOver' && sk.score === lr.score && sk.tally === lr.tally, `E0: R replays, tap skips to the same end (${JSON.stringify(sk)})`);
    ok(errs.length === 0, 'E0: zero page errors' + (errs.length ? ' ' + errs[0] : ''));
    await ctx.close();
  }

  // ---------------------------------------------------------------- E1 WebGL CRT
  if (want('E1')) {
    const pngStats = (page, a, b) => page.evaluate(async ([a, b]) => {
      const load = async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
      const A = await load(a); let s = 0, s2 = 0; const n = A.length / 4; for (let i = 0; i < A.length; i += 4) { const l = (A[i] + A[i + 1] + A[i + 2]) / 3; s += l; s2 += l * l; }
      const r = { mean: s / n, sd: Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)) };
      if (b) { const B = await load(b); let d = 0; for (let i = 0; i < A.length; i += 4) d += (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])) / 3; r.diff = d / n; }
      return r; }, [a.toString('base64'), b ? b.toString('base64') : null]);
    const raf = (page, n = 180) => page.evaluate((n) => new Promise(res => { let k = 0, s = performance.now(); const tk = () => { if (++k >= n) return res((performance.now() - s) / n); requestAnimationFrame(tk); }; requestAnimationFrame(tk); }), n);
    const clipOf = async (page) => { const b = await (await page.$('#g')).boundingBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
    const freeze = (page) => page.evaluate(() => { const G = window.__th; G.state = 'fly'; G.paused = false; G.attract = false; G.round = 2; G.wx = window.__T().levels[0]; G.rain = []; G.shots = 3; G.flightT = 30; G.mouse.on = false;
      G.birds = [{ x: 60, y: 50, vx: 0, vy: 0, sp: 0, tier: 'hi', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }, { x: 150, y: 90, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 2, at: 0, dirT: 1e9, hitT: 0 }]; G.flightT = -1e9; });
    {
      const { ctx, page, errs } = await newPage(browser);
      await page.goto(url); await sleep(700);
      const c0 = await page.evaluate(() => window.__crt());
      console.log(`  auto: tier ${c0.tier}, calibration ${JSON.stringify(c0.cal)}, backing ${c0.w}x${c0.h}`);
      ok(c0.ok && c0.want, `E1: WebGL post-process initialised (${c0.cal && c0.cal.renderer})`);
      ok(c0.active ? (c0.canvasShown && !c0.overlay) : (!c0.canvasShown && c0.overlay), `E1: DOM matches the selected tier (active=${c0.active}, GL canvas shown=${c0.canvasShown}, CSS overlay=${c0.overlay})`);
      // screenshots: full, lite, off — all non-blank, all different
      await freeze(page); const shots = {};
      for (const [name, t] of [['full', 2], ['lite', 1]]) { await page.evaluate((t) => window.__crtTier(t), t); await sleep(250); shots[name] = await page.screenshot({ clip: await clipOf(page) }); }
      await page.evaluate(() => window.__toggleCRT()); await sleep(250); shots.off = await page.screenshot({ clip: await clipOf(page) });
      const off = await page.evaluate(() => window.__crt());
      ok(!off.active && !off.canvasShown && off.overlay, 'E1: CRT OFF hides the GL canvas and restores the CSS scanlines');
      const fs = await pngStats(page, shots.full, shots.off), ls = await pngStats(page, shots.lite, shots.off), os = await pngStats(page, shots.off), fl = await pngStats(page, shots.full, shots.lite);
      ok(fs.sd > 20 && ls.sd > 20 && os.sd > 20, `E1: full, lite and off frames are non-blank (luma sd ${fs.sd.toFixed(1)} / ${ls.sd.toFixed(1)} / ${os.sd.toFixed(1)})`);
      ok(fs.diff > 6 && ls.diff > 3 && fl.diff > 3, `E1: CRT frames differ from the plain frame (mean abs diff full ${fs.diff.toFixed(1)}, lite ${ls.diff.toFixed(1)}, full-vs-lite ${fl.diff.toFixed(1)})`);
      require('fs').writeFileSync(path.resolve(__dirname, 'shots', 'e1_full.png'), shots.full); require('fs').writeFileSync(path.resolve(__dirname, 'shots', 'e1_lite.png'), shots.lite); require('fs').writeFileSync(path.resolve(__dirname, 'shots', 'e1_off.png'), shots.off);
      // frame time per tier (work = update+draw+post-process, synced with readPixels so GPU time counts) and rAF interval
      const perf = {};
      for (const [name, t] of [['full', 2], ['lite', 1], ['off', -1]]) {
        await page.evaluate((t) => { if (t < 0) { if (window.__crt().want) window.__toggleCRT(); } else { if (!window.__crt().want) window.__toggleCRT(); window.__crtTier(t); } }, t); await sleep(300);
        const w = await page.evaluate(() => window.__perf(150)); const r = await raf(page); perf[name] = { work: +w.avg.toFixed(2), p95: +w.p95.toFixed(2), raf: +r.toFixed(2), tier: (await page.evaluate(() => window.__crt())).tier, active: w.crt, px: w.w + 'x' + w.h };
      }
      console.log('  frame time (ms): ' + JSON.stringify(perf));
      await page.evaluate(() => { if (!window.__crt().want) window.__toggleCRT(); window.__crtTier(0); });
      // auto quality on a fresh load: calibration + governor must settle at a tier that holds the frame rate
      { const p2 = await ctx.newPage(); await p2.goto(url); await sleep(500); await p2.evaluate(() => { const G = window.__th; G.state = 'fly'; G.attract = false; G.wx = window.__T().levels[1]; G.birds = []; G.flightT = -1e9; });
        await sleep(7000); const a = await p2.evaluate(() => window.__crt()); const r = await raf(p2, 240); const w = await p2.evaluate(() => window.__perf(120));
        console.log(`  auto after 7 s: tier ${a.tier} (active ${a.active}), governor steps ${a.governed}, raf ${r.toFixed(2)} ms, work ${w.avg.toFixed(2)} ms`);
        ok(r <= 18, `E1: auto quality holds ~60 fps headless (raf ${r.toFixed(2)} ms at tier ${a.tier}${a.active ? '' : ' = CSS fallback'})`); await p2.close(); }
      // input stays aligned with the curved image: click where a sprite is DISPLAYED (inverse barrel) near the corners
      await page.evaluate(() => window.__crtTier(2)); await sleep(150);
      const box = await clipOf(page);
      const inv = (x, y) => { const K = 0.08, N = 1 + K * 0.25; const t = [x / 256, y / 240]; let u = t.slice(); for (let i = 0; i < 20; i++) { const cx = u[0] - .5, cy = u[1] - .5, k = (1 + K * (cx * cx + cy * cy)) / N; u = [.5 + (t[0] - .5) / k, .5 + (t[1] - .5) / k]; } return [box.x + u[0] * box.width, box.y + u[1] * box.height]; };
      let hits = 0; const spots = [[4, 30], [228, 30], [4, 140], [228, 140], [110, 8], [110, 145], [30, 90], [210, 70]];
      for (const [bx, by] of spots) {
        await page.evaluate(([bx, by]) => { const G = window.__th; G.state = 'fly'; G.paused = false; G.shots = 3; G.flightT = 30; G.tally = []; G.birds = [{ x: bx, y: by, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; }, [bx, by]);
        await page.mouse.click(...inv(bx + 12, by + 10)); await sleep(60);
        if (await page.evaluate(() => window.__th.tally.includes('hit') || window.__th.birds[0].st !== 'fly')) hits++;
      }
      ok(hits === spots.length, `E1: mouse clicks on displayed sprites under barrel distortion hit (${hits}/${spots.length}, incl. corners)`);
      // keyboard C toggles; typing the vcc code does not
      const w0 = await page.evaluate(() => window.__crt().want); await page.keyboard.press('c'); await sleep(50); const w1 = await page.evaluate(() => window.__crt().want);
      await page.keyboard.press('c'); await sleep(50);
      await page.evaluate(() => { window.__th.state = 'title'; }); const a0 = await page.evaluate(() => window.__th.assist); await page.keyboard.type('vcc'); await sleep(50);
      const after = await page.evaluate(() => ({ want: window.__crt().want, assist: window.__th.assist }));
      ok(w1 === !w0 && after.want === w0 && after.assist === !a0, `E1: C toggles the CRT; typing VCC toggles assist without flipping the CRT (${w0}->${w1}->${after.want}, assist ${a0}->${after.assist})`);
      if (after.assist) await page.keyboard.type('vcc');
      // the third HUD icon toggles it too
      await page.evaluate(() => { window.__th.state = 'fly'; window.__th.birds = []; }); const i0 = await page.evaluate(() => window.__crt().want);
      await page.evaluate(() => window.__tap(220, 6)); await sleep(50); const i1 = await page.evaluate(() => window.__crt().want);
      await page.evaluate(() => window.__tap(220, 6)); await sleep(50);
      ok(i1 === !i0, `E1: CRT icon (215,2) toggles (${i0}->${i1})`);
      // context loss -> 2D fallback -> restore
      const lost = await page.evaluate(async () => { const gl = document.getElementById('crtgl').getContext('webgl'); const ext = gl.getExtension('WEBGL_lose_context'); ext.loseContext(); await new Promise(r => setTimeout(r, 200)); const a = window.__crt(); ext.restoreContext(); await new Promise(r => setTimeout(r, 400)); return { a, b: window.__crt() }; });
      ok(lost.a.lost && !lost.a.active && lost.a.overlay && !lost.a.canvasShown && lost.b.ok && !lost.b.lost, `E1: webglcontextlost falls back to 2D, restored re-initialises (lost: active=${lost.a.active}; restored: ok=${lost.b.ok}, tier ${lost.b.tier}, err ${lost.b.err})`);
      await sleep(300);
      ok(errs.length === 0, 'E1: zero page errors' + (errs.length ? ' ' + errs[0] : ''));
      await ctx.close();
    }
    // no WebGL at all: getContext('webgl') stubbed to null
    {
      const { ctx, page, errs } = await newPage(browser);
      await page.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { return /webgl/.test(t) ? null : g.call(this, t, o); }; });
      await page.goto(url); await sleep(600);
      const c = await page.evaluate(() => window.__crt());
      await page.evaluate(() => window.__tap(128, 100)); await sleep(150); const st = await page.evaluate(() => window.__th.state);
      await freeze(page); await sleep(150); const shot = await page.screenshot({ clip: await clipOf(page) }); const s = await pngStats(page, shot);
      await page.keyboard.press('c'); await sleep(80); const toast = await page.evaluate(() => window.__th.toast && window.__th.toast.txt);
      ok(!c.ok && !c.active && !c.canvasShown && c.overlay && st === 'boot' && s.sd > 20, `E1: WebGL stubbed off -> 2D canvas + CSS scanlines, game starts, frame non-blank (err "${c.err}", sd ${s.sd.toFixed(1)})`);
      ok(/CRT (OFF|UNAVAILABLE)/.test(toast || '') && errs.length === 0, `E1: toggling without WebGL is harmless (toast "${toast}"), zero errors`);
      await ctx.close();
    }
    // reduced motion: CRT off by default
    {
      const { ctx, page, errs } = await newPage(browser, { reducedMotion: 'reduce' });
      await page.goto(url); await sleep(600);
      const c = await page.evaluate(() => window.__crt());
      ok(!c.want && !c.active && errs.length === 0, `E1: prefers-reduced-motion starts with the CRT off (want=${c.want})`);
      await ctx.close();
    }
  }

  await browser.close();
  console.log(`\n${fails.length ? 'FAILURES: ' + fails.length + '\n - ' + fails.join('\n - ') : 'ALL PASS'}`);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
