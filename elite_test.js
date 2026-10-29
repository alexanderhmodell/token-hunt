// Elite pass (v3) tests. ONLY=E0,E1 runs a subset. Exit code 1 on any failure.
//   E0 determinism + replay   E1 WebGL CRT   E2 speech + mouth   E3 mixed audio   E4 interpolation + trauma
const { chromium, launchOpts } = require('./pw');
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
    if (G.state === 'fly' && mode !== 'miss' && Math.random() < 0.006) { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' })); mem.unpauses = (mem.unpauses || 0) + 1; } // pause + resume: the READY lockout is sim state
  };
};
const newPage = async (browser, opts) => { const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, ...(opts || {}) }); const page = await ctx.newPage(); const errs = []; hookErrors(page, errs); await page.addInitScript(HELPERS); return { ctx, page, errs }; };
const runBot = (page, mode, ms, until) => page.evaluate(async ([mode, ms, until]) => { const mem = { restart: !until }; const t0 = performance.now(); while (performance.now() - t0 < ms) { await new Promise(r => setTimeout(r, 40)); if (until && eval(until)) return true; window.__bot(mode, mem); } return false; }, [mode, ms, until]);

(async () => {
  const browser = await chromium.launch(launchOpts);

  // ---------------------------------------------------------------- E0 determinism + replay
  if (want('E0')) {
    const { ctx, page, errs } = await newPage(browser);
    await page.goto(url); await sleep(500);
    await runBot(page, 'aim', 60000);
    await runBot(page, 'aim', 90000, "window.__th.recOn&&window.__th.frame>=2400&&window.__th.state!=='gameOver'"); // capture inside a long recording
    // capture the live state and replay the recording headlessly three times, all in one synchronous block
    const r = await page.evaluate(async () => {
      for (let i = 0; i < 100 && !window.__th.recOn; i++) await new Promise(r => setTimeout(r, 50));
      const G = window.__th; const live = window.__simStats(); const run = { init: G.recInit, rec: G.rec.map(e => e.slice()), frames: G.frame };
      const reps = [0, 1, 2].map(() => window.__replay(run, { headless: true, toFrame: live.frame }));
      return { live, reps, inputs: run.rec.length, keys: run.rec.filter(e => e[1] === 'k').length, touches: run.rec.filter(e => e[1] === 't').length, unpauses: run.rec.filter(e => e[1] === 'u').length, seed: run.init.seed };
    });
    const L = JSON.stringify(r.live);
    console.log(`  live @frame ${r.live.frame}: seed ${r.seed}, ${r.inputs} inputs (${r.touches} touch, ${r.keys} keys, ${r.unpauses} unpauses), round ${r.live.round}, score ${r.live.score}, state ${r.live.state}, run ${JSON.stringify(r.live.run)}`);
    ok(r.live.frame > 2500 && r.inputs > 50, `E0: recorded a real run (${r.live.frame} frames, ${r.inputs} inputs)`);
    r.reps.forEach((s, i) => { const same = JSON.stringify(s) === L; ok(same, `E0: replay ${i + 1}/3 identical (score ${s.score}, tally ${s.tally.map(t => t[0]).join('')}, round ${s.round}, run stats, birds, rng state)` + (same ? '' : '\n    live ' + L + '\n    rep  ' + JSON.stringify(s))); });
    // a recording replayed with one input removed must diverge (the test can tell runs apart)
    const div = await page.evaluate(() => { const G = window.__th; const run = { init: G.recInit, rec: G.rec.slice(), frames: G.frame }; if (!run.init) return null; const a = JSON.stringify(window.__replay(run, { headless: true, toFrame: 2400 })); const cand = run.rec.map((e, j) => [e, j]).filter(([e]) => e[0] > 300 && e[0] < 2300 && (e[1] === 't' || e[1] === 'm')).slice(0, 8); // some taps are no-ops (READY lockout, 4-frame debounce)
      for (const [, j] of cand) { const b = JSON.stringify(window.__replay({ ...run, rec: run.rec.filter((e, k) => k !== j) }, { headless: true, toFrame: 2400 })); if (b !== a) return true; } return false; });
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
    const freeze = (page) => page.evaluate(() => { const G = window.__th; G.state = 'fly'; G.paused = false; G.attract = false; G.round = 2; G.wx = window.__T().levels[0]; G.rain = []; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = 30; G.mouse.on = false;
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
        ok(r <= 18.5, `E1: auto quality holds ~60 fps headless (raf ${r.toFixed(2)} ms at tier ${a.tier}${a.active ? '' : ' = CSS fallback'})`); await p2.close(); }
      // governor: feed synthetic frame intervals (tier forced to full first)
      const gv = await page.evaluate(() => { const rep = (a, n) => Array.from({ length: n }, (_, i) => a[i % a.length]); const r = {};
        window.__crtTier(2); r.smooth = window.__crtGovern(rep([16.7], 270));
        r.dropped30 = window.__crtGovern(rep([16.7, 16.7, 33.3], 180));
        r.slow = window.__crtGovern(rep([33.3], 180));
        r.spikes = (window.__crtTier(2), window.__crtGovern(rep([...Array(29).fill(16.7), 400], 270))); window.__crtTier(2); return r; });
      ok(gv.smooth === 2 && gv.dropped30 === 1 && gv.slow === 0 && gv.spikes === 2, `E1: governor keeps full at 60 Hz, steps down on 1-in-3 dropped frames then on 30 Hz, ignores rare spikes (${JSON.stringify(gv)})`);
      // input stays aligned with the curved image: click where a sprite is DISPLAYED (inverse barrel) near the corners
      await page.evaluate(() => window.__crtTier(2)); await sleep(150);
      const box = await clipOf(page);
      const inv = (x, y) => { const K = 0.08, N = 1 + K * 0.25; const t = [x / 256, y / 240]; let u = t.slice(); for (let i = 0; i < 20; i++) { const cx = u[0] - .5, cy = u[1] - .5, k = (1 + K * (cx * cx + cy * cy)) / N; u = [.5 + (t[0] - .5) / k, .5 + (t[1] - .5) / k]; } return [box.x + u[0] * box.width, box.y + u[1] * box.height]; };
      let hits = 0; const spots = [[4, 30], [228, 30], [4, 140], [228, 140], [110, 8], [110, 145], [30, 90], [210, 70]];
      for (const [bx, by] of spots) {
        await page.evaluate(([bx, by]) => { const G = window.__th; G.state = 'fly'; G.paused = false; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = 30; G.tally = []; G.birds = [{ x: bx, y: by, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; }, [bx, by]);
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

  // ---------------------------------------------------------------- E2 the bot speaks
  if (want('E2')) {
    const STUB = () => {
      window.__ss = { spoken: [], cancels: 0, last: null };
      const voices = [{ name: 'Google US English', lang: 'en-US', localService: false }, { name: 'Samantha', lang: 'en-US', localService: true }, { name: 'Thomas', lang: 'fr-FR', localService: true }];
      const ss = { getVoices: () => voices, addEventListener() {}, cancel() { window.__ss.cancels++; window.__ss.last = null; },
        speak(u) { const S = window.__ss; S.spoken.push(u.text); S.last = u; S.meta = { voice: u.voice && u.voice.name, pitch: u.pitch, rate: u.rate, volume: u.volume };
          setTimeout(() => { if (S.last !== u) return; u.onstart && u.onstart(); let i = 0; const iv = setInterval(() => { if (S.last !== u || i++ > 6) { clearInterval(iv); if (S.last === u && u.onend) u.onend(); return; } u.onboundary && u.onboundary({ name: 'word' }); }, 90); }, 15); } };
      Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true });
      window.SpeechSynthesisUtterance = function (t) { this.text = t; this.volume = 1; };
    };
    const spoken = (page) => page.evaluate(() => window.__ss.spoken.filter(t => t.trim()));
    const foxAt = (page, t, line, mode) => page.evaluate(([t, line, mode]) => { const G = window.__th; G.paused = false; G.attract = false; G.replay = null; G.state = 'fox'; G.wave = 1; G.fox = { mode: mode || 'hit', t, x: 112, count: 0, line }; }, [t, line, mode]);
    {
      const { ctx, page, errs } = await newPage(browser); await page.addInitScript(STUB);
      await page.goto(url); await sleep(500);
      await foxAt(page, 10, 'GREAT QUESTION!'); await sleep(400);
      ok((await spoken(page)).length === 0, 'E2: no speech before the first user gesture');
      await page.evaluate(() => { window.__th.state = 'title'; }); await page.evaluate(() => window.__tap(128, 100)); await sleep(100);
      const v = await page.evaluate(() => window.__voice());
      ok(v.ok && v.gesture && v.voice === 'Samantha', `E2: picks a local English voice, never a network one (${v.voice})`);
      // play: every critic appearance is spoken exactly once, with its own line
      const seen = await page.evaluate(async () => { const mem = { restart: true }, lines = []; let inApp = false, lastT = 999; const t0 = performance.now();
        while (performance.now() - t0 < 30000) { await new Promise(r => setTimeout(r, 40)); const G = window.__th; const up = G.state === 'fox' || G.state === 'gameOver';
          if (up && G.fox.t >= 17) { if (!inApp || G.fox.t < lastT) lines.push(G.fox.line); inApp = true; lastT = G.fox.t; } else if (!up) { inApp = false; lastT = 999; }
          window.__bot('aim', mem); }
        return lines; });
      const sp = await spoken(page); const want2 = await page.evaluate((ls) => ls.map(l => window.__speechText(l)), seen);
      const meta = await page.evaluate(() => window.__ss.meta);
      ok(seen.length >= 6 && sp.length === seen.length && sp.every((t, i) => t === want2[i]), `E2: speak() once per critic line with that line's text (${sp.length} spoken / ${seen.length} lines, e.g. "${sp[0]}")`);
      ok(meta && meta.pitch === 1.4 && meta.rate === 1.15 && meta.volume === 1, `E2: pitch 1.4, rate 1.15, full volume when unmuted (${JSON.stringify(meta)})`);
      // skip cancels the line in progress
      await foxAt(page, 14, 'I HOPE THIS HELPS!'); await sleep(250); const c0 = await page.evaluate(() => ({ c: window.__ss.cancels, talking: window.__voice().talking, open: window.__voice().open }));
      await page.evaluate(() => { window.__th.fox.t = 40; }); await page.evaluate(() => window.__tap(128, 100)); await sleep(60);
      const c1 = await page.evaluate(() => ({ c: window.__ss.cancels, talking: window.__voice().talking, t: window.__th.fox.t }));
      ok(c0.talking && c1.c === c0.c + 1 && !c1.talking, `E2: tapping to skip the critic cancels its speech (cancels ${c0.c} -> ${c1.c})`);
      ok(c0.open > 0, `E2: mouth flaps on speech word boundaries (${c0.open} open-mouth frames drawn)`);
      // mute silences the voice; replays never speak
      await page.keyboard.press('m'); const n0 = (await spoken(page)).length; await foxAt(page, 14, 'TRY REPHRASING YOUR REQUEST.'); await sleep(300); const n1 = (await spoken(page)).length;
      await page.keyboard.press('m');
      ok(n1 === n0, `E2: muted -> no speech (${n0} -> ${n1})`);
      const n2 = (await spoken(page)).length; const rp = await page.evaluate(() => { const G = window.__th; if (!G.recInit) return 'none'; window.__replay({ init: G.recInit, rec: G.rec.slice(), frames: G.frame }, { headless: true, toFrame: 2000 }); return 'ok'; });
      const n3 = (await spoken(page)).length; ok(rp === 'ok' && n3 === n2, `E2: replays are silent (${n2} -> ${n3})`);
      // entrance: peek, 3 px dip, ~4 px overshoot, settle; exit eases in
      const ys = await page.evaluate(() => { window.__th.fox.line = 'OK.'; return Array.from({ length: 160 }, (_, t) => window.__criticY(t, false)); });
      const top = 200 - 44, minY = Math.min(...ys.slice(10, 24)), dip = ys[10] - ys[6];
      let L = 24; while (L < 140 && ys[L] === top) L++; // the dwell scales with the line (v2.9b: typed at 2 chars/frame, then hold >= 40 f)
      ok(Math.abs(dip - 3) < 0.01 && top - minY > 3 && top - minY < 5 && L >= 50 && L < 140 && (ys[L + 16] - ys[L + 15]) > (ys[L + 2] - ys[L + 1]) && ys[L + 18] >= 199.9,
        `E2: entrance dips ${dip.toFixed(1)} px, overshoots ${(top - minY).toFixed(1)} px, settles at ${top} until f${L}; exit accelerates (${(ys[L + 2] - ys[L + 1]).toFixed(2)} -> ${(ys[L + 16] - ys[L + 15]).toFixed(2)} px/f)`);
      // faces: talking frame + the game-over roast face
      await foxAt(page, 18, 'CERTAINLY! HERE IS YOUR ANSWER.'); await page.evaluate(() => { window.__th.birds = []; }); await sleep(120);
      await page.screenshot({ path: path.resolve(__dirname, 'shots', 'e2_talk.png') });
      await page.evaluate(() => { const G = window.__th; G.state = 'gameOver'; G.t = 100; G.fox = { mode: 'miss', t: 40, x: 112, count: 0, line: '12 OF 30 SHOTS LANDED. I COUNTED.' }; }); await sleep(120);
      await page.screenshot({ path: path.resolve(__dirname, 'shots', 'e2_roast.png') });
      ok(errs.length === 0, 'E2: zero page errors' + (errs.length ? ' ' + errs[0] : ''));
      await ctx.close();
    }
    {
      // no speech API: chirp typewriter + typewriter-driven mouth flap
      const { ctx, page, errs } = await newPage(browser); await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
      await page.goto(url); await sleep(500); await page.evaluate(() => window.__tap(128, 100)); await sleep(100);
      await foxAt(page, 14, 'THAT IS OUTSIDE MY TRAINING DATA.'); await sleep(500);
      const v = await page.evaluate(() => window.__voice());
      ok(!v.ok && v.said === 0 && v.open > 0 && errs.length === 0, `E2: without speechSynthesis the typewriter drives the mouth (${v.open} open frames), zero errors`);
      await ctx.close();
    }
  }

  // ---------------------------------------------------------------- E3 mixed, adaptive audio
  if (want('E3')) {
    const { ctx, page, errs } = await newPage(browser);
    await page.addInitScript(() => { const ss = { getVoices: () => [{ name: 'Samantha', lang: 'en-US', localService: true }], addEventListener() {}, cancel() {}, speak(u) { if (u.text.trim()) setTimeout(() => { u.onstart && u.onstart(); window.__spokeAt = performance.now(); }, 10); } };
      Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; }; });
    await page.goto(url); await sleep(500);
    await page.evaluate(() => window.__tap(128, 100)); await sleep(200); await page.evaluate(() => window.__tap(128, 100)); await sleep(300); // gesture + boot skip -> music on
    const m0 = await page.evaluate(() => window.__mix());
    ok(m0 && m0.state === 'running' && m0.on && m0.comp.threshold === -18 && m0.comp.ratio === 4, `E3: master -> compressor (-18 dB, 4:1) graph is live (${m0 && m0.state}, music ${m0 && m0.on})`);
    ok(m0 && m0.buses.music > 0 && m0.buses.sfx > 0 && m0.buses.voice > 0 && m0.layers.base === 1 && m0.layers.arp === 0 && m0.layers.drums === 0 && m0.layers.storm === 0, `E3: music/sfx/voice buses + 4 music layers, only base audible at rest (${JSON.stringify(m0 && m0.layers)})`);
    // stereo position follows screen x
    const pan = await page.evaluate(async () => { const G = window.__th, out = [];
      for (const bx of [8, 220]) { G.state = 'fly'; G.paused = false; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = 30; G.birds = [{ x: bx, y: 60, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; window.__tap(bx + 12, 70); await new Promise(r => setTimeout(r, 30)); out.push(window.__mix().lastPan); }
      return out; });
    ok(pan[0] < -0.5 && pan[1] > 0.5, `E3: SFX pan by screen x (left hit ${pan[0].toFixed(2)}, right hit ${pan[1].toFixed(2)})`);
    // sidechain: a hit ducks the music bus -8 dB for ~180 ms, then it recovers
    const duck = await page.evaluate(async () => { const G = window.__th; G.state = 'fly'; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = 30; G.birds = [{ x: 110, y: 60, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }];
      await new Promise(r => setTimeout(r, 400)); const before = window.__mix().duck, n0 = window.__mix().ducks; window.__tap(122, 70); await new Promise(r => setTimeout(r, 70)); const during = window.__mix().duck; await new Promise(r => setTimeout(r, 450)); return { before, during, after: window.__mix().duck, n: window.__mix().ducks - n0 }; });
    ok(duck.n === 1 && duck.before > 0.99 && Math.abs(20 * Math.log10(duck.during) + 8) < 0.6 && duck.after > 0.99, `E3: hit ducks music ${(20 * Math.log10(duck.during)).toFixed(1)} dB, recovers to ${duck.after.toFixed(2)}`);
    // vertical layering, quantized to the bar: combo >= 3 -> arpeggio, >= 6 -> drums, storm load -> sub-bass layer
    await page.evaluate(() => { const G = window.__th; G.state = 'intro'; G.t = -1e6; G.birds = []; G.wx = window.__T().levels[0]; G.combo = 0; });
    const waitLayer = (cond, ms) => page.evaluate(async ([cond, ms]) => { const t0 = performance.now(); let m; while (performance.now() - t0 < ms) { m = window.__mix(); if (eval(cond)) return { ok: true, t: performance.now() - t0, m }; await new Promise(r => setTimeout(r, 50)); } return { ok: false, m }; }, [cond, ms]);
    await page.evaluate(() => { window.__th.combo = 3; });
    const mid = await waitLayer('m.layers.arp > 0.05 && m.layers.arp < 0.95', 6000);
    const a3 = await waitLayer('m.layers.arp > 0.99', 6000);
    ok(mid.ok && a3.ok && a3.m.layers.drums === 0, `E3: combo 3 fades the arpeggio in over a bar (seen at ${mid.m && mid.m.layers.arp.toFixed(2)} mid-fade, full after ${(a3.t / 1000).toFixed(1)} s), drums stay out`);
    await page.evaluate(() => { window.__th.combo = 6; });
    const d6 = await waitLayer('m.layers.drums > 0.99', 6500);
    ok(d6.ok && d6.m.layers.arp > 0.99, `E3: combo 6 adds the drum layer (${(d6.t / 1000).toFixed(1)} s to full)`);
    await page.evaluate(() => { const G = window.__th; G.wx = window.__T().levels[1]; });
    const st = await waitLayer('m.layers.storm > 0.99', 6500);
    ok(st.ok, 'E3: storm load adds the sub-bass + fast-hat layer');
    await page.evaluate(() => { const G = window.__th; G.combo = 0; G.wx = window.__T().levels[0]; });
    const off = await waitLayer('m.layers.arp < 0.01 && m.layers.drums < 0.01 && m.layers.storm < 0.01', 6500);
    ok(off.ok && off.m.layers.base === 1, `E3: combo break + calm load fade every layer back out (${JSON.stringify(off.m && off.m.layers)})`);
    // levels: meter the compressor output and the buses with every layer on and hits landing
    await page.evaluate(() => { const G = window.__th; G.state = 'intro'; G.t = -1e6; G.combo = 6; G.wx = window.__T().levels[1]; });
    await waitLayer('m.layers.drums > 0.99 && m.layers.storm > 0.99', 7000);
    const lv = await page.evaluate(async () => { const N = window.__audioNodes(), ac = N.ac; const meter = (node) => { const a = ac.createAnalyser(); a.fftSize = 2048; node.connect(a); const buf = new Float32Array(a.fftSize); let peak = 0, ss = 0, n = 0; return { a, read() { a.getFloatTimeDomainData(buf); for (const v of buf) { peak = Math.max(peak, Math.abs(v)); ss += v * v; n++; } }, get() { return { peak, rms: Math.sqrt(ss / Math.max(1, n)) }; } }; };
      const M = { out: meter(N.comp), music: meter(N.music), sfx: meter(N.sfx) }; const G = window.__th; const t0 = performance.now(); let k = 0;
      while (performance.now() - t0 < 3000) { await new Promise(r => setTimeout(r, 20)); for (const m of Object.values(M)) m.read();
        if (++k % 15 === 0) { G.state = 'fly'; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = 30; G.birds = [{ x: 40 + (k % 4) * 50, y: 60, vx: 0, vy: 0, sp: 0, tier: k % 2 ? 'hi' : 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; window.__tap(52 + (k % 4) * 50, 70); G.state = 'intro'; G.t = -1e6; G.combo = 6; } }
      const db = v => +(20 * Math.log10(Math.max(1e-6, v))).toFixed(1); const o = {}; for (const k2 in M) { const g = M[k2].get(); o[k2] = { peakDb: db(g.peak), rmsDb: db(g.rms) }; } return o; });
    console.log('  levels (dBFS): ' + JSON.stringify(lv));
    ok(lv.out.peakDb < 0 && lv.out.rmsDb > -40 && lv.music.rmsDb > -45 && lv.sfx.peakDb > -30, `E3: full mix never clips at the output (peak ${lv.out.peakDb} dBFS, rms ${lv.out.rmsDb}) and music + sfx are both audible`);
    await page.evaluate(() => { const G = window.__th; G.combo = 0; G.wx = window.__T().levels[0]; });
    // the bot starting to speak also ducks the music
    const sd = await page.evaluate(async () => { const G = window.__th; const n0 = window.__mix().ducks; G.state = 'fox'; G.wave = 1; G.fox = { mode: 'hit', t: 14, x: 112, count: 0, line: 'HAPPY TO HELP!' };
      await new Promise(r => setTimeout(r, 120)); return { n: window.__mix().ducks - n0, duck: window.__mix().duck, spoke: !!window.__spokeAt }; });
    ok(sd.spoke && sd.n === 1 && sd.duck < 0.6, `E3: speech start ducks the music (${sd.n} duck, gain ${sd.duck.toFixed(2)})`);
    ok(errs.length === 0, 'E3: zero page errors' + (errs.length ? ' ' + errs[0] : ''));
    await ctx.close();
  }

  // ---------------------------------------------------------------- E4 interpolation, trauma shake, squash & stretch
  if (want('E4')) {
    const { ctx, page, errs } = await newPage(browser);
    // a 120 Hz display: rAF is driven by hand with timestamps 8.33 ms apart
    await page.addInitScript(() => { const q = []; let now = null; window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
      window.__pump = (n, every) => { const out = []; for (let i = 0; i < n; i++) { if (now === null) now = performance.now(); now += 1000 / 120; const cbs = q.splice(0); for (const cb of cbs) cb(now); if (!every || i % every === 0) out.push({ f: window.__th.frame, r: window.__render() }); } return out; }; });
    await page.goto(url); await sleep(400);
    const res = await page.evaluate(() => { const G = window.__th; window.__pump(4); G.attract = false; G.state = 'fly'; G.paused = false; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = -1e9; G.wx = window.__T().levels[5];
      G.birds = [{ x: 30, y: 120, vx: 1.6, vy: -0.7, sp: 1.75, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }, { x: 200, y: 40, vx: -1.2, vy: 0.5, sp: 1.3, tier: 'hi', bad: false, st: 'fly', f: 1, at: 0, dirT: 1e9, hitT: 0 }];
      const f0 = G.frame; const out = window.__pump(600); return { steps: G.frame - f0, out }; });
    let between = 0, moved = 0, nan = 0, monotonic = true, lastX = null;
    for (let i = 1; i < res.out.length; i++) { const a = res.out[i - 1], b = res.out[i]; for (const bb of b.r.birds) if (!bb.slice(0, 2).every(Number.isFinite)) nan++;
      if (a.f === b.f && a.r.birds.length && b.r.birds.length) { between++; if (Math.abs(a.r.birds[0][0] - b.r.birds[0][0]) > 0.2) moved++; }
      const x = b.r.birds[0] && b.r.birds[0][0]; if (i < 240 && lastX != null && x != null && x < lastX - 0.01) monotonic = false; if (x != null) lastX = x; }
    ok(Math.abs(res.steps - 300) <= 2, `E4: 600 frames at 120 Hz advance the fixed 60 Hz sim exactly ${res.steps} steps`);
    ok(between > 250 && moved / between > 0.95 && nan === 0, `E4: rendered positions move between sim steps (${moved}/${between} in-between frames differ, ${nan} NaN)`);
    ok(monotonic, 'E4: interpolated motion is monotonic (no back-steps across step boundaries)');
    // trauma: hit adds .25, frontier .4, lightning .5; decays 1.6/s; offset = 9 * trauma^2 * noise
    const tr = await page.evaluate(() => { const G = window.__th, o = {};
      const hit = (tier) => { G.trauma = 0; G.state = 'fly'; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = 30; G.freeze = 0; G.birds = [{ x: 110, y: 60, vx: 0, vy: 0, sp: 0, tier, bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; window.__tap(122, 70); return G.trauma; };
      o.lo = hit('lo'); o.hi = hit('hi');
      G.birds = []; G.freeze = 0; G.trauma = 1; window.__pump(2); const t0 = G.trauma, f0 = G.frame; window.__pump(30); o.decayPerSec = (t0 - G.trauma) / ((G.frame - f0) / 60);
      G.trauma = 0; G.state = 'fly'; G.birds = []; G.wx = window.__T().levels[1]; G.nextLightning = 1; G.freeze = 0; window.__pump(4); o.lightning = G.trauma;
      let mx = 0; G.trauma = 1; for (let t = 0; t < 4000; t += 7) { const [x, y] = window.__shakeOffset(t); mx = Math.max(mx, Math.abs(x), Math.abs(y)); } o.max1 = mx;
      mx = 0; G.trauma = 0.25; for (let t = 0; t < 4000; t += 7) { const [x, y] = window.__shakeOffset(t); mx = Math.max(mx, Math.abs(x), Math.abs(y)); } o.max025 = mx; G.trauma = 0; return o; });
    ok(Math.abs(tr.lo - 0.25) < 1e-9 && Math.abs(tr.hi - 0.4) < 1e-9, `E4: a hit adds 0.25 trauma, a frontier hit 0.4 (${tr.lo}, ${tr.hi})`);
    ok(Math.abs(tr.decayPerSec - 1.6) < 0.05, `E4: trauma decays ${tr.decayPerSec.toFixed(2)}/s`);
    ok(tr.lightning > 0.4 && tr.lightning <= 0.5, `E4: lightning adds 0.5 trauma (${tr.lightning.toFixed(3)} after two steps of decay)`);
    ok(tr.max1 > 7 && tr.max1 <= 9 && tr.max025 <= 9 * 0.0625 + 1e-9, `E4: shake = 9 px x trauma^2 x noise (max ${tr.max1.toFixed(2)} px at 1.0, ${tr.max025.toFixed(2)} px at 0.25)`);
    // look: squash on the downstroke, hit pop, spin, agent trail
    await page.evaluate(() => { const G = window.__th; G.wx = window.__T().levels[0]; G.state = 'fly'; G.freeze = 0; G.trauma = 0; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = -1e9;
      G.birds = [{ x: 40, y: 40, vx: 0.01, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 2, at: 1, dirT: 1e9, hitT: 0 }, { x: 100, y: 40, vx: 0.01, vy: 0, sp: 0, tier: 'hi', bad: false, st: 'hit', f: 0, at: 0, dirT: 1e9, hitT: 4 },
        { x: 160, y: 60, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fall', f: 0, at: 3, dirT: 1e9, hitT: 0 }, { x: 200, y: 100, vx: 0.8, vy: 1.2, sp: 1.2, tier: 'lo', bad: false, agent: true, st: 'fly', f: 0, at: 20, dirT: 1e9, hitT: 0 }];
      for (const b of G.birds) { b.px = b.x; b.py = b.y; } G.freeze = 1e6; window.__pump(2); });
    await page.screenshot({ path: path.resolve(__dirname, 'shots', 'e4_feel.png') });
    await page.evaluate(() => { window.__th.freeze = 0; });
    ok(errs.length === 0, 'E4: zero page errors' + (errs.length ? ' ' + errs[0] : ''));
    await ctx.close();
  }

  // ---------------------------------------------------------------- E5 DDoS boss (Tier 2)
  if (want('E5')) {
    const { ctx, page, errs } = await newPage(browser);
    await page.goto(url); await sleep(500);
    await page.evaluate(() => window.__tap(128, 100)); await sleep(150); await page.evaluate(() => window.__tap(128, 100)); await sleep(150);
    const toBoss = (round) => page.evaluate((round) => { const G = window.__th; G.attract = false; G.paused = false; G.round = round; G.bossDone = false; G.swarmDone = true; G.wave = 2; G.birds = []; G.vramLost = 0; G.state = 'gap'; G.t = 11; }, round);
    const waitFor = (cond, ms) => page.evaluate(async ([cond, ms]) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (eval(cond)) return true; await new Promise(r => setTimeout(r, 30)); } return false; }, [cond, ms]);
    await toBoss(3); await sleep(250);
    ok(await page.evaluate(() => { const G = window.__th; return !G.birds.some(b => b.boss) && !(G.state === 'fox' && G.fox.mode === 'warn'); }), 'E5: no boss in epoch 3');
    await toBoss(4); await sleep(150);
    const warn = await page.evaluate(() => ({ state: window.__th.state, mode: window.__th.fox.mode, line: window.__th.fox.line }));
    ok(warn.state === 'fox' && warn.mode === 'warn' && /DDOS|40,000/.test(warn.line), `E5: epoch 4 — the bot warns first ("${warn.line}")`);
    ok(await waitFor("window.__th.birds.some(b=>b.boss&&b.st==='fly')", 4000), 'E5: then the DDoS arrives');
    await page.screenshot({ path: path.resolve(__dirname, 'shots', 'e5_boss_arrives.png') });
    // fight: six hits, every second one splits off two agents
    const fight = await page.evaluate(async () => { const G = window.__th, log = [];
      const boss = () => G.birds.find(b => b.boss); const t0 = performance.now();
      while (boss() && boss().st === 'fly' && performance.now() - t0 < 15000) { const b = boss(); if (b.x > 4 && b.x < 204 && G.freeze === 0) { window.__tap(b.x + 24, b.y + 20); log.push({ hp: b.hp, agents: G.birds.filter(a => a.agent).length }); if (b.hp === 3) window.__shotAt3 = 1; } await new Promise(r => setTimeout(r, 120)); }
      const b = boss(); return { hp: b && b.hp, st: b && b.st, killed: G.swarm && G.swarm.killed, agents: G.birds.filter(a => a.agent).length, log, score: G.score }; });
    ok(fight.killed && fight.hp === 0 && fight.st === 'gone', `E5: six hits mitigate it (hp after each tap: ${fight.log.map(l => l.hp).join(',')})`);
    ok(fight.agents === 6, `E5: every 2nd hit split off two rogue agents (${fight.agents} spawned)`);
    // clear the agents, the wave ends with the win line
    await page.evaluate(async () => { const G = window.__th; const t0 = performance.now(); while (performance.now() - t0 < 12000 && G.state === 'fly') { const a = G.birds.find(b => b.agent && b.st === 'fly'); if (a && G.freeze === 0 && G.shots > 0) window.__tap(a.x + 6, a.y + 5); await new Promise(r => setTimeout(r, 90)); } });
    const after = await page.evaluate(() => ({ state: window.__th.state, mode: window.__th.fox.mode, line: window.__th.fox.line }));
    ok(after.state === 'fox' && after.mode === 'hit' && /MITIGATED|ABSORBED/.test(after.line), `E5: after the fight the bot reacts ("${after.line}")`);
    // escape path: costs a VRAM for the epoch and gets the loss line
    await page.evaluate(() => { window.__th.round = 7; }); await toBoss(8); await waitFor("window.__th.birds.some(b=>b.boss&&b.st==='fly')", 4000);
    await page.evaluate(() => { const b = window.__th.birds.find(b => b.boss); b.x = b.vx > 0 ? 250 : -48; });
    ok(await waitFor("window.__th.state==='fox'", 3000), 'E5: an escaped boss ends the wave');
    const esc = await page.evaluate(() => ({ v: window.__th.vramLost, line: window.__th.fox.line, mode: window.__th.fox.mode }));
    ok(esc.v === 1 && esc.mode === 'miss' && /DDOS|OUTAGE/.test(esc.line), `E5: escape costs 1 VRAM and the bot gloats ("${esc.line}")`);
    // music: the boss layer comes in while it is on screen
    await page.evaluate(() => { const G = window.__th; G.state = 'gameOver'; G.t = 100; G.fox.t = 100; }); await page.evaluate(() => window.__tap(128, 100)); await sleep(150); // fresh run: music on again
    await toBoss(12); await waitFor("window.__th.birds.some(b=>b.boss&&b.st==='fly')", 4000);
    await page.evaluate(() => { const b = window.__th.birds.find(b => b.boss); b.vx *= 0.2; });
    ok(await waitFor("window.__mix()&&window.__mix().layers.boss>0.99", 6500), 'E5: unique boss music layer fades in');
    await page.screenshot({ path: path.resolve(__dirname, 'shots', 'e5_boss_fight.png') });
    ok(errs.length === 0, 'E5: zero page errors' + (errs.length ? ' ' + errs[0] : ''));
    await ctx.close();
  }

  // ---------------------------------------------------------------- E6 flow-channel difficulty (Tier 2)
  if (want('E6')) {
    const { ctx, page, errs } = await newPage(browser);
    await page.goto(url); await sleep(500);
    await page.keyboard.press('2'); await page.evaluate(() => window.__tap(128, 100)); await sleep(150); await page.evaluate(() => window.__tap(128, 100)); await sleep(100);
    const r = await page.evaluate(() => { const G = window.__th, o = {}; const reset = () => { G.flow = { speed: 1, halluc: 0, hist: [] }; };
      reset(); for (let i = 0; i < 7; i++) window.__flowNote(true); o.before8 = G.flow.speed; window.__flowNote(true); o.after8 = +G.flow.speed.toFixed(4); o.h8 = +G.flow.halluc.toFixed(4);
      for (let i = 0; i < 20; i++) window.__flowNote(true); o.cap = +G.flow.speed.toFixed(4); o.hcap = +G.flow.halluc.toFixed(4);
      reset(); const seq = [1, 1, 0, 1, 1, 0, 1, 1]; seq.forEach(v => window.__flowNote(!!v)); o.inBand = G.flow.speed; // 6/8 = 75%: hold
      reset(); for (let i = 0; i < 8; i++) window.__flowNote(false); o.low = +G.flow.speed.toFixed(4); o.hlow = +G.flow.halluc.toFixed(4);
      o.diffMedium = window.__flowOn();
      return o; });
    ok(r.before8 === 1 && Math.abs(r.after8 - 1.06) < 1e-9 && Math.abs(r.h8 - 0.05) < 1e-9, `E6: after a full window of 8 served waves: speed x${r.after8}, hallucinations +${r.h8}`);
    ok(r.cap === 1.3 && r.hcap === 0.15, `E6: nudges are capped (speed x${r.cap}, hallucinations +${r.hcap})`);
    ok(r.inBand === 1, `E6: 6 of 8 (75%) is inside the 65-75% channel: no change (x${r.inBand})`);
    ok(r.low < 1 && r.hlow < 0, `E6: 8 failed waves ease off (speed x${r.low}, hallucinations ${r.hlow})`);
    // integration: a wave spawned with flow speed 1.2 flies exactly 1.2x faster than the same wave at 1.0 (same rng state)
    const sp = await page.evaluate(async () => { const G = window.__th; const out = [];
      for (const f of [1, 1.2]) { G.flow = { speed: f, halluc: 0, hist: [] }; G.rng.set(window.__r0 || (window.__r0 = G.rng.get())); G.birds = []; G.wave = 0; G.round = 2; G.swarmDone = true; G.bossDone = true; G.state = 'gap'; G.t = 11; G.paused = false;
        await new Promise(r => setTimeout(r, 80)); out.push(G.birds.length ? G.birds[0].sp : null); }
      return out; });
    ok(sp[0] && sp[1] && Math.abs(sp[1] / sp[0] - 1.2) < 1e-9, `E6: spawn speed follows the flow factor (${sp[0] && sp[0].toFixed(3)} -> ${sp[1] && sp[1].toFixed(3)})`);
    // Hard and Daily are never adjusted
    const fixed = await page.evaluate(() => { const G = window.__th, o = {}; for (const d of ['hard', 'daily']) { G.diff = d; G.daily = d === 'daily'; G.flow = { speed: 1, halluc: 0, hist: [] }; for (let i = 0; i < 12; i++) window.__flowNote(true); o[d] = G.flow.speed; } G.diff = 'medium'; G.daily = false; return o; });
    ok(fixed.hard === 1 && fixed.daily === 1 && r.diffMedium, `E6: Hard and Daily stay fixed (x${fixed.hard}, x${fixed.daily})`);
    ok(errs.length === 0, 'E6: zero page errors' + (errs.length ? ' ' + errs[0] : ''));
    await ctx.close();
  }

  // ---------------------------------------------------------------- E9 accessibility (Tier 2)
  if (want('E9')) {
    const { ctx, page, errs } = await newPage(browser);
    await page.goto(url); await sleep(500);
    await page.evaluate(() => window.__tap(128, 100)); await sleep(150); await page.evaluate(() => window.__tap(128, 100)); await sleep(150);
    // a hallucination carries a dashed outline (shape cue, independent of its colour)
    const dash = await page.evaluate(async () => { const G = window.__th; G.state = 'fly'; G.paused = false; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = -1e9; G.nextLightning = 1e9;
      G.birds = [{ x: 100, y: 60, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: true, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }, { x: 60, y: 110, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }];
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); G.freeze = 1e6; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const b = G.birds[0], x0 = Math.round(b.x) - 1, y0 = Math.round(b.y) - 1, d = document.getElementById('g').getContext('2d').getImageData(0, 0, 256, 240).data;
      const red = (x, y) => { const i = (y * 256 + x) * 4; return d[i] === 230 && d[i + 1] === 226 && d[i + 2] === 240; }; // the ghost outline colour (v3.5) let on = 0, n = 0;
      for (let i = 0; i < 26; i++) { n += 2; on += red(x0 + i, y0) + red(x0 + i, y0 + 21); } for (let j = 0; j < 22; j++) { n += 2; on += red(x0, y0 + j) + red(x0 + 25, y0 + j); }
      const r2 = G.birds[1]; let onReal = 0; for (let i = 0; i < 26; i++) onReal += red(Math.round(r2.x) - 1 + i, Math.round(r2.y) - 1); G.freeze = 0; return { frac: on / n, onReal }; });
    ok(dash.frac > 0.35 && dash.frac < 0.65 && dash.onReal === 0, `E9: hallucinations get a dashed outline (${(dash.frac * 100).toFixed(0)}% of the box perimeter dashed; real requests none)`);
    // captions when muted
    await page.keyboard.press('m');
    const caps = await page.evaluate(async () => { const G = window.__th; G.state = 'fly'; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.birds = [{ x: 100, y: 60, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; window.__tap(112, 70); await new Promise(r => setTimeout(r, 50)); return window.__caps(); });
    await page.screenshot({ path: path.resolve(__dirname, 'shots', 'e9_captions.png') });
    await page.keyboard.press('m'); const capsUnmuted = await page.evaluate(async () => { const G = window.__th; G.shots = 3; G.lastShotF = -99; G.birds = [{ x: 100, y: 60, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; const n = window.__caps().length; window.__tap(112, 70); return window.__caps().length - n; });
    ok(caps.includes('(DING)') && capsUnmuted === 0, `E9: muted -> sound captions (${caps.join(' ')}); unmuted -> none`);
    // one-hand mode: code THUMB; the crosshair drifts onto the nearest real request and a tap on the HUD fires there
    await page.evaluate(() => { window.__th.state = 'title'; }); await page.keyboard.type('thumb'); await sleep(60);
    const on = await page.evaluate(() => window.__oneHand());
    const oh = await page.evaluate(async () => { const G = window.__th; G.state = 'fly'; G.paused = false; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = -1e9; G.tally = []; G.mouse = { x: 20, y: 20, on: true, touch: false };
      G.birds = [{ x: 150, y: 80, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }, { x: 40, y: 30, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: true, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }];
      await new Promise(r => setTimeout(r, 1500)); const tb = G.birds[0], m = { x: G.mouse.x, y: G.mouse.y, dx: G.mouse.x - (tb.x + 12), dy: G.mouse.y - (tb.y + 10) }; window.__tap(60, 226, 'touch'); await new Promise(r => setTimeout(r, 60)); return { m, hit: G.birds[0].st, bad: G.birds[1].st, tally: G.tally.slice() }; });
    ok(on && Math.abs(oh.m.dx) < 15 && Math.abs(oh.m.dy) < 13 && oh.hit === 'hit' && (oh.bad === 'fly' || oh.bad === 'away'), `E9: one-hand mode (THUMB): crosshair trails the drifting request by ${Math.hypot(oh.m.dx, oh.m.dy).toFixed(1)} px (slow tracking, inside its hitbox), a HUD tap served it, the hallucination was ignored` + (oh.hit === "hit" && (oh.bad === "fly" || oh.bad === "away") ? "" : " " + JSON.stringify(oh)));
    await page.screenshot({ path: path.resolve(__dirname, 'shots', 'e9_onehand.png') });
    await page.evaluate(() => { window.__th.state = 'title'; }); await page.keyboard.type('thumb'); await sleep(60);
    ok(!(await page.evaluate(() => window.__oneHand())) && errs.length === 0, 'E9: THUMB toggles it back off; zero page errors' + (errs.length ? ' ' + errs[0] : ''));
    await ctx.close();
  }

  // ---------------------------------------------------------------- GATES: ELITE.md section 5 items that can be measured here
  if (want('GATES')) {
    const size = require('fs').statSync(path.resolve(__dirname, 'dist/index.html')).size;
    ok(size <= 160 * 1024, `GATE 7: dist/index.html is ${(size / 1024).toFixed(1)} KB (<= 160 KB)`);
    const { devices } = require('./pw');
    const ctx = await browser.newContext({ ...devices['iPhone 13'] }); const page = await ctx.newPage(); const errs = []; hookErrors(page, errs);
    await page.goto(url); await sleep(600);
    const box = await (await page.$('#g')).boundingBox(); const tp = (x, y) => [box.x + x * box.width / 256, box.y + y * box.height / 240];
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    await page.touchscreen.tap(...tp(128, 100)); await sleep(900); await page.touchscreen.tap(...tp(128, 100)); await sleep(100);
    const t0 = Date.now(); let st = ''; while (Date.now() - t0 < 9000) { st = await page.evaluate(() => window.__th.state); if (st === 'fly') break; await sleep(40); }
    const firstServe = (Date.now() - t0) / 1000;
    ok(!over && st === 'fly', `GATE 5: phone (iPhone 13 emulation): no horizontal overflow, first serve ${firstServe.toFixed(1)} s wall-clock after boot skip (nominal 70+60 frames = 2.2 s)`);
    let hits = 0;
    for (let i = 0; i < 12; i++) {
      const b = await page.evaluate((i) => { const G = window.__th; G.state = 'fly'; G.paused = false; G.shots = 3; G.lastShotF = -99; G.unpauseT = 0; G.flightT = 30; G.tally = []; G.freeze = 0;
        G.birds = [{ x: 8 + (i % 4) * 62, y: 24 + Math.floor(i / 4) * 50, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; const b = G.birds[0]; return { x: b.x + 12, y: b.y + 10 }; }, i);
      await page.touchscreen.tap(...tp(b.x, b.y)); await sleep(70);
      if (await page.evaluate(() => window.__th.tally.includes('hit'))) hits++;
    }
    ok(hits === 12, `GATE 5: thumb-on-sprite taps hit ${hits}/12 across the whole field (corners included)`);
    ok(errs.length === 0, 'GATE: phone run zero errors' + (errs.length ? ' ' + errs[0] : ''));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${fails.length ? 'FAILURES: ' + fails.length + '\n - ' + fails.join('\n - ') : 'ALL PASS'}`);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
