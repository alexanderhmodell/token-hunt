// Visual regression (E8): canonical states rendered deterministically (seeded sim + fx, CRT off, rAF pumped at exactly 60 Hz,
// loop clock reset) and pixel-diffed against goldens/*.png at a 0.5% tolerance. The 256x240 game canvas is compared, not the page.
//   node visual_test.js                    compare against goldens/
//   node visual_test.js --update-goldens   rewrite goldens/ (review them first: they are the spec)
const { chromium, launchOpts } = require('./pw');
const fs = require('fs'), path = require('path');
const url = 'file://' + path.resolve(__dirname, 'dist/index.html');
const GOLD = path.resolve(__dirname, 'goldens'), SHOTS = path.resolve(__dirname, 'shots');
const UPDATE = process.argv.includes('--update-goldens'), TOL = 0.005;
const fails = []; const ok = (c, m) => { if (!c) fails.push(m); console.log((c ? 'PASS ' : 'FAIL ') + m); };
// each setup runs in the page after the sim and fx streams are seeded; then the loop is pumped `frames` steps
const STATES = {
  title: { frames: 32, setup: () => { const G = window.__th; window.__applyTheme('gpu'); G.state = 'title'; G.t = 0; G.amb = { x: 40, y: 50, t: 0 }; G.titleFox = 30; } },
  boot: { frames: 70, setup: () => { const G = window.__th; window.__applyTheme('gpu'); G.state = 'boot'; G.t = 0; G.boot = { t: 0, line: -1 }; } },
  intro: { frames: 40, setup: () => { const G = window.__th; G.round = 4; window.__applyTheme('gpu'); G.state = 'intro'; G.t = 0; G.wave = 0; } },
  fly: { frames: 12, setup: () => { const G = window.__th; G.round = 2; window.__applyTheme('gpu'); G.state = 'fly'; G.shots = 2; G.flightT = -1e9; G.nextLightning = 1e9; G.mouse = { x: 150, y: 96, on: true, touch: false };
    G.birds = [{ x: 50, y: 60, vx: 1, vy: -0.4, sp: 1.1, tier: 'hi', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }, { x: 130, y: 100, vx: -0.8, vy: -0.5, sp: 1, tier: 'lo', bad: false, st: 'fly', f: 2, at: 3, dirT: 1e9, hitT: 0 },
      { x: 180, y: 40, vx: 0.5, vy: 0.3, sp: 0.6, tier: 'lo', bad: true, st: 'fly', f: 1, at: 5, dirT: 1e9, hitT: 0 }]; } },
  critic: { frames: 6, setup: () => { const G = window.__th; window.__applyTheme('gpu'); G.state = 'fox'; G.wave = 1; G.birds = []; G.fox = { mode: 'hit', t: 30, x: 112, count: 1, line: 'GREAT QUESTION!' }; } },
  roundEnd: { frames: 50, setup: () => { const G = window.__th; G.round = 2; window.__applyTheme('gpu'); G.state = 'roundEnd'; G.t = 0; G.tally = ['hit', 'hit', 'miss', 'hit', 'hit', 'hit']; G.perfect = false; G.birds = []; } },
  gameOver: { frames: 80, setup: () => { const G = window.__th; G.round = 3; window.__applyTheme('gpu'); G.state = 'gameOver'; G.t = 0; G.birds = []; G.score = 4200; G.cost = 1800; G.newRecord = false;
    G.run = { shots: 30, hits: 12, timeouts: 3, hServed: 1, hDodged: 2, bestCombo: 5, frontier: 2 }; G.fox = { mode: 'miss', t: 0, x: 112, count: 0, line: '12 OF 30 SHOTS LANDED. I COUNTED.' }; } },
  duckStorm: { frames: 12, setup: () => { const G = window.__th; G.round = 2; window.__applyTheme('duck'); G.state = 'fly'; G.shots = 3; G.flightT = -1e9; G.nextLightning = 1e9; G.mouse.on = false;
    G.birds = [{ x: 70, y: 70, vx: 1, vy: -0.5, sp: 1.1, tier: 'hi', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }, { x: 150, y: 90, vx: -1, vy: -0.3, sp: 1, tier: 'lo', bad: true, st: 'fly', f: 2, at: 6, dirT: 1e9, hitT: 0 }]; } },
  boss: { frames: 10, setup: () => { const G = window.__th; G.round = 4; window.__applyTheme('gpu'); G.state = 'fly'; G.shots = 12; G.flightT = 0; G.nextLightning = 1e9; G.mouse.on = false;
    G.swarm = { t: 0, stopped: 0, breached: 0, total: 2, boss: true, killed: false, escaped: false };
    G.birds = [{ boss: true, x: 90, y: 34, y0: 34, vx: 0.42, vy: 0, sp: 0.42, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0, hp: 4 }, { x: 120, y: 90, vx: 0.7, vy: 1.1, sp: 1.2, tier: 'lo', bad: false, agent: true, st: 'fly', f: 0, at: 10, dirT: 1e9, hitT: 0 }]; } },
};
const PUMP = () => { localStorage.setItem('th.crt', '0'); localStorage.setItem('th.seen', '1'); localStorage.setItem('th.muted', '1'); localStorage.setItem('th.theme', 'gpu'); localStorage.setItem('th.diff', 'medium');
  const q = []; let now = 1000; window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.__pump = n => { for (let i = 0; i < n; i++) { now += 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) cb(now); } }; window.__pumpNow = () => now; };
(async () => {
  if (!fs.existsSync(GOLD)) fs.mkdirSync(GOLD);
  const browser = await chromium.launch(launchOpts);
  for (const [name, st] of Object.entries(STATES)) {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 860 } }); await ctx.addInitScript(PUMP);
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(url); await page.waitForTimeout(150);
    const png = await page.evaluate(([setup, frames]) => { window.__pump(3); window.__seedRun(424242); window.__seedFx(777); const G = window.__th; G.attract = false; G.paused = false; G.idle = 0; G.trauma = 0; G.freeze = 0; G.toast = null;
      (0, eval)('(' + setup + ')')(); window.__loopReset(window.__pumpNow()); window.__pump(frames); return document.getElementById('g').toDataURL('image/png'); }, [st.setup.toString(), st.frames]);
    const buf = Buffer.from(png.split(',')[1], 'base64'); const gold = path.join(GOLD, name + '.png');
    if (UPDATE || !fs.existsSync(gold)) { fs.writeFileSync(gold, buf); console.log(`WROTE goldens/${name}.png${UPDATE ? '' : ' (no golden yet)'}`); await ctx.close(); continue; }
    const d = await page.evaluate(async ([a, b]) => { const load = async (src) => { const img = new Image(); img.src = src; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return { w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data }; };
      const A = await load(a), B = await load(b); if (A.w !== B.w || A.h !== B.h) return { size: false };
      let bad = 0; const n = A.w * A.h; const D = new Uint8ClampedArray(A.d.length);
      for (let i = 0; i < A.d.length; i += 4) { const diff = Math.max(Math.abs(A.d[i] - B.d[i]), Math.abs(A.d[i + 1] - B.d[i + 1]), Math.abs(A.d[i + 2] - B.d[i + 2])); if (diff > 16) { bad++; D[i] = 255; D[i + 3] = 255; } else { D[i] = D[i + 1] = D[i + 2] = A.d[i] >> 2; D[i + 3] = 255; } }
      const c = document.createElement('canvas'); c.width = A.w; c.height = A.h; c.getContext('2d').putImageData(new ImageData(D, A.w, A.h), 0, 0);
      return { size: true, ratio: bad / n, bad, diffPng: c.toDataURL('image/png') }; }, [png, 'data:image/png;base64,' + fs.readFileSync(gold).toString('base64')]);
    const pass = d.size && d.ratio <= TOL && errs.length === 0;
    if (!pass) { fs.writeFileSync(path.join(SHOTS, `vr_${name}_actual.png`), buf); if (d.diffPng) fs.writeFileSync(path.join(SHOTS, `vr_${name}_diff.png`), Buffer.from(d.diffPng.split(',')[1], 'base64')); }
    ok(pass, `visual ${name}: ${d.size ? (d.ratio * 100).toFixed(3) + '% pixels differ (' + d.bad + ')' : 'size mismatch'} (tolerance ${TOL * 100}%)` + (errs.length ? ' errors: ' + errs[0] : ''));
    await ctx.close();
  }
  // determinism of the harness itself: render one state twice in fresh pages, expect 0 differing pixels
  if (!UPDATE) {
    const shotOf = async () => { const ctx = await browser.newContext({ viewport: { width: 900, height: 860 } }); await ctx.addInitScript(PUMP); const page = await ctx.newPage(); await page.goto(url); await page.waitForTimeout(150);
      const s = await page.evaluate((setup) => { window.__pump(3); window.__seedRun(424242); window.__seedFx(777); (0, eval)('(' + setup + ')')(); window.__loopReset(window.__pumpNow()); window.__pump(12); return document.getElementById('g').toDataURL('image/png'); }, STATES.duckStorm.setup.toString()); await ctx.close(); return s; };
    const a = await shotOf(), b = await shotOf(); ok(a === b, 'visual harness is deterministic (same state rendered twice -> identical PNG)');
  }
  await browser.close();
  console.log(`\n${fails.length ? 'FAILURES: ' + fails.length : UPDATE ? 'GOLDENS UPDATED' : 'ALL PASS'}`);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
