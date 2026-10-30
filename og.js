// Renders dist/og.png (1200x630), the link-preview card: a live gameplay frame on the left (the game's own pixels, 2.5x,
// nearest-neighbour) and the hook in the game's own 5x7 face on the right. Composed inside the page from #g, so it always
// matches the shipped build. node og.js  (after python3 build.py)
const { chromium, launchOpts } = require('./pw'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(launchOpts);
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.goto('file://' + path.resolve(__dirname, 'dist/index.html')); await p.waitForTimeout(600);
  const html = fs.readFileSync(path.resolve(__dirname, 'dist/index.html'), 'utf8'); // the 5x7 face, straight from the build (the game keeps it in its closure)
  const FONT7 = JSON.parse(/const FONT7=(\{.*?\});/.exec(html)[1]);
  // a mid-epoch moment: a purple frontier request under the crosshair, a green one, a grey FAKE ghost, the critic heckling
  await p.evaluate(() => { const G = window.__th; window.__applyTheme('gpu'); G.seen = true; G.round = 3; G.wave = 3; G.tally = ['hit', 'hit', 'miss'];
    G.state = 'fly'; G.shots = 2; G.flightT = -1e9; G.nextLightning = 1e9; G.score = 48250; G.cost = 1200; G.combo = 4; G.tip = null; G.toast = null;
    G.mouse = { x: 63, y: 71, on: true, touch: false };
    G.birds = [{ x: 51, y: 61, vx: 0, vy: 0, sp: 0, tier: 'hi', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 },
      { x: 150, y: 100, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 2, at: 3, dirT: 1e9, hitT: 0 },
      { x: 186, y: 40, vx: 0, vy: 0, sp: 0, tier: 'hi', bad: true, st: 'fly', f: 1, at: 9, dirT: 1e9, hitT: 0 }];
    G.linger = { line: 'TWO FRONTIER IN A ROW. SHOW-OFF.', x: 120, mode: 'hit', count: 0, t: 52, len: 1e9 }; });
  await p.waitForTimeout(140);
  const png = await p.evaluate(async FONT7 => { const GLY7 = {}; for (const k in FONT7) GLY7[k] = FONT7[k].split(' '); const G = window.__th;
    // wait for a frame where the fake shows its grey static and reads FAKE (its look cycles with its age)
    await new Promise(r => { const ok = () => { const f = G.birds.find(b => b.bad), a = f ? f.at : 0; return f && ((a >> 2) & 3) % 2 === 1 && ((a / 10 | 0) % 4) % 2 === 0; };
      const chk = () => ok() ? r() : requestAnimationFrame(chk); requestAnimationFrame(chk); });
    const W = 1200, H = 630, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = '#0a0a12'; x.fillRect(0, 0, W, H);
    for (let yy = 0; yy < H; yy += 4) { x.fillStyle = 'rgba(138,92,245,0.035)'; x.fillRect(0, yy, W, 1); } // faint scanlines on the cabinet
    const S = 2.5, fw = 256 * S, fh = 240 * S, fx = 22, fy = Math.round((H - fh) / 2);
    x.save(); x.shadowColor = 'rgba(138,92,245,0.55)'; x.shadowBlur = 36; x.fillStyle = '#262238'; x.fillRect(fx - 6, fy - 6, fw + 12, fh + 12); x.restore();
    x.drawImage(document.getElementById('g'), 0, 0, 256, 240, fx, fy, fw, fh);
    const g7 = (s, X, Y, k, col) => { x.fillStyle = col; let cx = X; for (const ch of String(s).toUpperCase()) { const g = GLY7[ch] || GLY7[' ']; if (g) for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r][q] === '1') x.fillRect(cx + q * k, Y + r * k, k, k); cx += 6 * k; } };
    const g7s = (s, X, Y, k, col) => { g7(s, X + k, Y + k, k, '#1a1420'); g7(s, X, Y, k, col); };
    const L = fx + fw + 42; // right column
    g7s('TOKEN', L, 74, 11, '#f7f4e9'); g7s('HUNT', L, 74 + 92, 11, '#3cd0ff');
    g7s('THE FAKES', L, 292, 5, '#e6e2f0'); g7s('TRAIN ON YOU.', L, 340, 5, '#b99cff');
    g7('SERVE THE REAL REQUESTS.', L, 412, 3, '#e2ccff'); g7('FAKES NEVER FLAP.', L, 440, 3, '#e2ccff'); g7('IT LEARNS HOW YOU PLAY.', L, 468, 3, '#e2ccff');
    g7('PLAYS IN ANY BROWSER', L, 548, 3, '#3cd0ff'); g7('ONE FILE. ZERO ASSETS.', L, 576, 3, '#8a84a3');
    return c.toDataURL('image/png').split(',')[1]; }, FONT7);
  fs.writeFileSync(path.resolve(__dirname, 'dist/og.png'), Buffer.from(png, 'base64'));
  await b.close(); console.log('dist/og.png written');
})();
