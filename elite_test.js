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

  await browser.close();
  console.log(`\n${fails.length ? 'FAILURES: ' + fails.length + '\n - ' + fails.join('\n - ') : 'ALL PASS'}`);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
