// Scripted ~75 s demo recording (silent — headless has no audio device). Output: dist/demo.mp4 via ffmpeg.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'); const fs = require('fs'); const { execSync } = require('child_process');
const outDir = path.resolve(__dirname, 'video_tmp'); fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 1000 }, recordVideo: { dir: outDir, size: { width: 1024, height: 1000 } } });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'dist/index.html')); await sleep(400);
  await page.evaluate(() => { try { localStorage.removeItem('th.seen'); } catch (e) {} window.__th.seen = false; });
  const cv = await page.$('#g'); const box = await cv.boundingBox();
  const tp = (x, y) => [box.x + x * box.width / 256, box.y + y * box.height / 240];
  const G = (fn, a) => page.evaluate(fn, a);
  const waitState = async (st, ms = 10000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await G(() => window.__th.state)) === st) return true; await sleep(50); } return false; };
  // Exact, instant shots: glide the crosshair to the live bird position over ~10 frames, then fire from inside the page.
  const shootLive = (bad, errX, errY) => G(async ({ bad, errX, errY }) => { const G = window.__th; const cv = document.getElementById('g');
    const ev = (type, x, y) => { const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent(type, { clientX: r.left + x * r.width / 256, clientY: r.top + y * r.height / 240, pointerType: 'mouse', button: 0, isPrimary: true, bubbles: true, cancelable: true })); };
    const pick = () => G.birds.find(b => b.st === 'fly' && !!b.bad === bad); let b = pick(); if (!b) return false;
    for (let i = 0; i < 10; i++) { b = pick() || b; const tx = b.x + 12 + errX, ty = b.y + 10 + errY; G.mouse.on = true; G.mouse.x += (tx - G.mouse.x) * 0.45; G.mouse.y += (ty - G.mouse.y) * 0.45; await new Promise(r => setTimeout(r, 33)); }
    b = pick() || b; let x = b.x + 12 + errX, y = b.y + 10 + errY; if (x > 215 && y < 20) y = 24; ev('pointermove', x, y); ev('pointerdown', x, y); return true; }, { bad, errX, errY });
  const shootAt = async (b, errX = 0, errY = 0) => shootLive(false, errX, errY);
  const liveBird = async (bad = false) => G((bad) => { const b = window.__th.birds.find(b => b.st === 'fly' && !!b.bad === bad); return b ? { x: b.x, y: b.y } : null; }, bad);

  // 0:00 title — let the bot peek, then boot
  await sleep(4000);
  await page.mouse.click(...tp(128, 100));
  await sleep(3200); // BIOS crawl plays in full
  await waitState('fly', 12000);
  // epoch 1: two serves, one deliberate miss, one timeout
  for (let i = 0; i < 2; i++) { const b = await liveBird(); if (b) { await shootAt(b); } await sleep(2600); await waitState('fly', 8000); }
  await shootLive(false, -45, 30); await sleep(700); await shootLive(false, 40, 35); await sleep(700); await G(() => { const cv = document.getElementById('g'); const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + 30 * r.width / 256, clientY: r.top + 40 * r.height / 240, pointerType: 'mouse', button: 0, isPrimary: true, bubbles: true, cancelable: true })); });
  await sleep(3200); await waitState('fly', 8000);
  // hallucination: force one; let it go, then serve the real one
  await G(() => { window.__th.forceHalluc = true; });
  await waitState('fly', 8000); await sleep(200);
  await G(() => { window.__th.forceHalluc = false; });
  { const real = await liveBird(false); if (real) await shootAt(real); }
  await sleep(3000); await waitState('fly', 8000);
  // force another and serve it on purpose for the apology
  await G(() => { window.__th.forceHalluc = true; }); await waitState('fly', 8000); await sleep(300); await G(() => { window.__th.forceHalluc = false; });
  await shootLive(true, 0, 0);
  await sleep(3200);
  // jump to the storm
  await G(() => { const G = window.__th; G.round = 1; G.wave = 6; G.tally = ['hit','hit','hit','hit','hit','miss']; G.state = 'fox'; G.fox.t = 109; G.fox.mode = 'hit'; G.fox.line = 'HAPPY TO HELP!'; G.birds = []; });
  await sleep(1500); await page.mouse.click(...tp(128, 100)); // skip round-clear panel
  await waitState('intro', 5000); await sleep(2300); await waitState('fly', 8000);
  for (let i = 0; i < 4; i++) { const b = await liveBird(); if (b) await shootAt(b); await sleep(2500); await waitState('fly', 8000); }
  // game over: burn the rest
  await G(() => { const G = window.__th; G.tally = ['hit','hit','miss','miss','miss','miss']; G.wave = 6; G.state = 'fox'; G.fox.t = 109; G.fox.mode = 'miss'; G.fox.line = 'TRY REPHRASING YOUR REQUEST.'; G.birds = []; });
  await sleep(5000);
  // closer: back to title, type duck
  await page.mouse.click(...tp(60, 110)); await sleep(1500);
  await page.keyboard.type('duck', { delay: 120 }); await sleep(3500);
  console.log('end state:', JSON.stringify(await G(() => ({ score: window.__th.score, theme: window.__th.theme, state: window.__th.state, muted: localStorage.getItem('th.muted') }))));
  await ctx.close(); await browser.close();
  const webm = fs.readdirSync(outDir).find(f => f.endsWith('.webm'));
  execSync(`ffmpeg -y -loglevel error -i "${path.join(outDir, webm)}" -vf "crop=1024:960:0:0,scale=1024:960:flags=neighbor" -c:v libx264 -pix_fmt yuv420p -crf 18 -r 30 "${path.resolve(__dirname, 'dist/demo.mp4')}"`);
  const sz = fs.statSync(path.resolve(__dirname, 'dist/demo.mp4')).size;
  console.log('dist/demo.mp4', (sz / 1e6).toFixed(1), 'MB');
  fs.rmSync(outDir, { recursive: true, force: true });
})().catch(e => { console.error(e); process.exit(1); });
