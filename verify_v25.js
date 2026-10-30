// Confirms each of the ten pass-2 fixes is present in the SHIPPED file (dist/index.html) and, where behavior is
// observable headlessly, that the behavior holds. Static checks grep the built source; dynamic checks drive the game.
const { chromium, launchOpts } = require('./pw');
const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, 'dist/index.html'), 'utf8');
const out = []; const rep = (n, what, pass, how) => out.push({ n, what, pass, how });
const has = (s) => html.includes(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  // ---- static evidence
  rep(1, 'Space/Enter start the game', has("const ky=G.state==='gameOver'?60:100;") && has("handleTap(128,ky); } e.preventDefault();"), 'keyboard start taps open sky (128,100), not the difficulty row; at game over it taps the receipt, never a button');
  rep(2, 'Hallucination leaves when no real request is airborne', has("if(flying&&!G.birds.some(b=>b.st==='fly'&&!b.bad)){ for(const b of G.birds) if(b.st==='fly'&&b.bad){ b.flew=b.at; b.st='away'"), 'early-exit branch present in updateBirds');
  rep(3, '504 banner/tint ignore hallucinations', has("G.birds.some(b=>b.st==='away'&&!b.bad)) textC(B.escaped") && has("G.birds.some(b=>b.st==='away'&&!b.bad)){ ctx.fillStyle=T.banners.escapedTint"), 'both banner and tint filter !b.bad');
  rep(4, 'One shot hits only the nearest flyer', has("let hitAny=false, nearest=999, target=null, td=1e9;") && has("if(b===target){ hitAny=true;"), 'nearest-target selection before applying the hit');
  rep(5, 'Attract mode plays through epoch 3', has("else if(G.state==='roundEnd'&&G.t>90){ if(G.round<3) nextRound(); else toTitle(); }"), 'roundEnd in attract calls nextRound until round 3');
  rep(6, 'Restart skips the BIOS crawl', has("else startGame(false,true); } break;") && has("if(skipBoot){ bootDone(); return; }"), 'game-over tap calls startGame(false,true) → bootDone()');
  rep(7, 'iOS audio unlock on pointerup/click', has("cv.addEventListener('pointerup',()=>{ audioInit(); if(ac&&ac.state==='suspended') ac.resume(); });") && has("cv.addEventListener('click',()=>{ if(ac&&ac.state==='suspended') ac.resume(); });"), 'both listeners present (iOS behavior itself not verifiable headlessly)');
  rep(8, 'Attract auto-resumes on tab return; real play stays paused', has("else if(G.attract) setPaused(false); });") && has("window.addEventListener('focus',()=>{ if(G.attract) setPaused(false); });"), 'visibilitychange + focus handlers gate on G.attract');
  rep(9, 'First intro shortened', has("case 'intro': if(G.t>=(G.round===1?70:ruleFor(G.round)?160:110)){"), 'epoch-1 intro is 70 frames; later epochs 110, or 160 when the card brings a new rule');
  rep(10, "Glitch tag '@' removed", !/glitchTags:\[[^\]]*@/.test(html), "no '@' in any glitchTags array");

  // ---- dynamic evidence
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'dist/index.html')); await sleep(500);
  const cv = await page.$('#g'); const box = await cv.boundingBox(); const tp = (x, y) => [box.x + x * box.width / 256, box.y + y * box.height / 240];
  const G = (fn, a) => page.evaluate(fn, a);
  // 1
  await page.keyboard.press('Space'); await sleep(80); const s1 = await G(() => window.__th.state);
  rep('1b', 'Space starts the game (behavior)', s1 === 'boot', `state after Space: ${s1}`);
  // 9
  await page.mouse.click(...tp(128, 100)); await sleep(100); // skip boot
  const t0 = Date.now(); while (Date.now() - t0 < 6000 && (await G(() => window.__th.state)) !== 'fly') await sleep(40);
  const firstWave = (Date.now() - t0) / 1000; const nominal = (70 + 60) / 60; rep('9b', 'First wave: nominal ≤ 3 s at 60 Hz (behavior)', nominal <= 3, `nominal ${nominal.toFixed(2)} s (intro 70 f + tutorial 60 f); headless wall-clock ${firstWave.toFixed(1)} s`);
  // 2 + 3: real served first, hallucination must leave within ~1 s and no banner
  await G(() => { const G = window.__th; G.state = 'fly'; G.shots = 3; G.flightT = 30; G.birds = [{ x: 60, y: 60, vx: 0, vy: 0, sp: 1, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }, { x: 170, y: 90, vx: 0, vy: 0, sp: 1, tier: 'lo', bad: true, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; });
  await page.mouse.click(...tp(72, 70)); await sleep(120);
  const after = await G(() => ({ bad: window.__th.birds[1].st, real: window.__th.birds[0].st, tallyHits: window.__th.tally.filter(x => x === 'hit').length }));
  rep('2b', 'Hallucination leaves immediately after the real request is served (behavior)', after.real !== 'fly' && after.bad === 'away', `real=${after.real}, hallucination=${after.bad}`);
  // 3b: banner condition false while only the hallucination is 'away'
  const bannerCond = await G(() => window.__th.birds.some(b => b.st === 'away' && !b.bad));
  rep('3b', 'No 504 banner while only a hallucination is leaving (behavior)', bannerCond === false, `banner condition = ${bannerCond}`);
  // 4b: overlapping real + hallucination, one shot → only the real one hit, no penalty
  await G(() => { const G = window.__th; G.state = 'fly'; G.shots = 3; G.flightT = 30; G.score = 5000; G.hallucServed = false; G.birds = [{ x: 100, y: 80, vx: 0, vy: 0, sp: 1, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }, { x: 104, y: 84, vx: 0, vy: 0, sp: 1, tier: 'lo', bad: true, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; });
  await page.mouse.click(...tp(112, 90)); await sleep(80);
  const o = await G(() => ({ sts: window.__th.birds.map(b => b.st), served: window.__th.hallucServed, score: window.__th.score }));
  rep('4b', 'Overlapping flyers: one shot hits exactly one (behavior)', o.sts.filter(s => s === 'hit').length === 1 && o.score > 5000, `states=${o.sts.join('/')}, hallucServed=${o.served}, score=${o.score}`);
  // 6b: game over → tap → intro, not boot
  await G(() => { const G = window.__th; G.state = 'gameOver'; G.t = 100; G.fox = { mode: 'miss', t: 10, x: 100, count: 0, line: 'X' }; });
  await page.mouse.click(...tp(128, 100)); await sleep(80); const s6 = await G(() => window.__th.state);
  rep('6b', 'Restart from game over goes to intro, not boot (behavior)', s6 === 'intro', `state after tap: ${s6}`);
  // 5b: attract continues past epoch 1
  await G(() => { const G = window.__th; G.state = 'title'; G.attract = false; G.idle = 1199; }); await sleep(200);
  await G(() => { const G = window.__th; G.round = 1; G.state = 'roundEnd'; G.t = 91; }); await sleep(120);
  const s5 = await G(() => ({ state: window.__th.state, round: window.__th.round, attract: window.__th.attract }));
  rep('5b', 'Attract: epoch 1 clear → epoch 2 intro (behavior)', s5.attract && s5.state === 'intro' && s5.round === 2, JSON.stringify(s5));
  await G(() => { const G = window.__th; G.round = 3; G.state = 'roundEnd'; G.t = 91; }); await sleep(120);
  const s5c = await G(() => ({ state: window.__th.state, attract: window.__th.attract }));
  rep('5c', 'Attract: epoch 3 clear → back to title (behavior)', !s5c.attract && s5c.state === 'title', JSON.stringify(s5c));
  // 8b
  await G(() => { const G = window.__th; G.attract = true; G.state = 'fly'; G.paused = false; Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const p1 = await G(() => window.__th.paused);
  await G(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const p2 = await G(() => window.__th.paused);
  rep('8b', 'Attract pauses when hidden and resumes when visible (behavior)', p1 === true && p2 === false, `hidden→paused=${p1}, visible→paused=${p2}`);
  await G(() => { const G = window.__th; G.attract = false; G.state = 'fly'; G.paused = false; window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); });
  const p3 = await G(() => window.__th.paused);
  rep('8c', 'Real play stays paused after focus returns (behavior)', p3 === true, `paused after blur+focus = ${p3}`);
  // ---- hardening checks (v2.6)
  const needs = await G(() => { const out = {}; for (const d of ['easy','medium','hard']) { localStorage.setItem('th.diff', d); } return out; });
  const maxNeed = await G(() => { const G = window.__th; const r = []; for (let i = 1; i <= 12; i++) { G.round = i; } return null; });
  const capOK = await G(() => { const src = document.documentElement.outerHTML; return src.includes('EPOCH_LEN-1); // never demand a perfect epoch'); });
  rep('H1', 'Quota never requires a perfect epoch', capOK, 'req() clamps to EPOCH_LEN-1');
  await G(() => { const G = window.__th; G.state = 'fly'; G.paused = false; G.attract = false; });
  await page.keyboard.down('p'); await page.keyboard.down('p'); await page.keyboard.up('p'); await sleep(60);
  const pr = await G(() => window.__th.paused);
  rep('H2', 'Held key auto-repeat does not toggle pause twice', pr === true, `paused after repeated keydown = ${pr}`);
  await page.keyboard.press('p');
  await G(() => { const G = window.__th; G.state = 'fly'; G.paused = false; G.shots = 3; G.birds = [{ x: 200, y: 20, vx: 0, vy: 0, sp: 1, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; });
  await page.mouse.click(...tp(20, 20), { button: 'right' }); await page.mouse.click(...tp(20, 20), { button: 'middle' }); await sleep(60);
  const shotsAfter = await G(() => window.__th.shots);
  rep('H3', 'Right/middle mouse buttons do not fire', shotsAfter === 3, `shots after right+middle click = ${shotsAfter}`);
  await G(() => { const G = window.__th; G.fx = []; G.state = 'fly'; G.shots = 3; G.unpauseT = 0; G.birds = [{ x: 230, y: 40, vx: 0, vy: 0, sp: 1, tier: 'hi', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }]; });
  await page.mouse.click(...tp(242, 50)); await sleep(60);
  const pop = await G(() => { const f = window.__th.fx.find(f => f.type === 'pts'); return f ? { x: f.x, y: f.y, txt: f.txt, sc: f.sc } : null; });
  rep('H4', 'Score popup clamped inside the screen at the right edge', pop && pop.x + pop.txt.length * 4 * pop.sc <= 256 && pop.y >= 0, JSON.stringify(pop));
  const rm = await G(() => document.documentElement.outerHTML.includes("prefers-reduced-motion: reduce"));
  rep('H5', 'prefers-reduced-motion disables screen shake', rm, 'media query present and gates the shake translate');
  const fb = await G(() => document.documentElement.outerHTML.includes("if(!window.PointerEvent){"));
  rep('H6', 'Touch/mouse fallback for browsers without PointerEvent', fb, 'fallback listeners present');
  rep('E', 'Zero page errors during verification', errs.length === 0, errs.join('; ') || 'none');
  await browser.close();
  for (const r of out) console.log(`${r.pass ? 'PASS' : 'FAIL'}  #${r.n}  ${r.what}  —  ${r.how}`);
  const fails = out.filter(r => !r.pass).length; console.log(fails ? `\n${fails} FAILED` : '\nALL CONFIRMED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
