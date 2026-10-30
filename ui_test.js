// v4.2 checks: game-over and pause buttons (touch taps on the labels themselves), tips that are never late, Easy's own
// lines, the rewind (the first time each model version fools you) and the boss's bounced taps.  node ui_test.js [url]
const { chromium, launchOpts } = require('./pw'); const path = require('path'); const fs = require('fs');
const FILE = process.argv[2] || 'file://' + path.resolve(__dirname, 'dist/index.html');
const SHOTS = path.resolve(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const out = []; const rep = (n, ok, how) => out.push({ n, ok: !!ok, how });
const LIB = () => { window.__wait = f => new Promise(r => { let n = 0; const t = () => (++n >= f ? r() : requestAnimationFrame(t)); requestAnimationFrame(t); });
  // a tap at game pixel (x, y) as the screen sees it: for touch, the finger is where the label is drawn
  window.__tapAt = (x, y, type) => { const cv = document.getElementById('g'), r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + x * r.width / 256, clientY: r.top + y * r.height / 240, pointerType: type || 'mouse', button: 0, isPrimary: true, bubbles: true, cancelable: true })); };
  window.__skipIntro = async () => { const G = window.__th; for (let i = 0; i < 400 && G.state !== 'fly'; i++) { if (G.state === 'boot') G.boot.t = 999; if (G.state === 'intro') G.t = 999; if (G.state === 'fox') G.fox.t = 999; await __wait(1); } };
  // a real game over (recorded, so WATCH REPLAY exists): five misses on the books, then let the last wave go
  window.__toGameOver = async () => { const G = window.__th; await __skipIntro(); G.tally = ['miss', 'miss', 'miss', 'miss', 'miss']; G.wave = 5;
    for (let i = 0; i < 60 * 40 && G.state !== 'gameOver'; i++) { if (G.state === 'fox') G.fox.t = 999; if (G.state === 'intro' || G.state === 'gap') G.t = Math.max(G.t, 999); await __wait(1); }
    for (let i = 0; i < 200 && G.t <= 75; i++) await __wait(1); return G.state; }; };
(async () => {
  const b = await chromium.launch(launchOpts);
  const p = await b.newPage({ viewport: { width: 1000, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(FILE); await p.waitForTimeout(300); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(LIB);

  // ---- game over: the buttons answer a touch on their own labels
  const go = await p.evaluate(async () => { const G = window.__th, o = {}; window.__tapAt(128, 100); await __wait(3);
    o.over = await __toGameOver(); o.hasRun = !!G.lastRun; o.btn = JSON.parse(JSON.stringify(window.__goBtn()));
    const B = o.btn, ry = B.y + 6; // the middle of the label text
    window.__tapAt((B.rep[0] + B.rep[1]) / 2, ry, 'touch'); await __wait(3); o.replay = !!G.replay;
    for (let i = 0; i < 2000 && G.replay; i++) { if (i === 5) window.__tapAt(128, 60); await __wait(1); } // skip the replay: back to the same game over
    for (let i = 0; i < 200 && (G.t <= 75 || G.goGuard > 0); i++) await __wait(1); o.backOver = G.state; // after a replay the panel takes taps again after 0.5 s
    window.__tapAt((B.menu[0] + B.menu[1]) / 2, ry, 'touch'); await __wait(3); o.menu = G.state;
    return o; });
  await p.screenshot({ path: SHOTS + '/ui_after_menu.png' });
  rep('game over: a touch on WATCH REPLAY replays', go.over === 'gameOver' && go.hasRun && go.replay, JSON.stringify(go));
  rep('game over: a touch on < MENU opens the menu (it used to start a run)', go.backOver === 'gameOver' && go.menu === 'title', JSON.stringify(go));
  const go2 = await p.evaluate(async () => { const G = window.__th, o = {}; window.__tapAt(128, 100); await __wait(3); o.over = await __toGameOver();
    window.__tapAt(128, 60, 'touch'); await __wait(3); o.after = G.state; return o; });
  rep('game over: a tap on the receipt reboots', go2.over === 'gameOver' && go2.after !== 'gameOver' && go2.after !== 'title', JSON.stringify(go2));
  const kb = await p.evaluate(async () => { const G = window.__th; for (let i = 0; i < 60 && G.state !== 'fly'; i++) await __skipIntro(); await __toGameOver(); return G.state; });
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const kb2 = await p.evaluate(() => ({ state: window.__th.state, replay: !!window.__th.replay }));
  rep('game over: Enter reboots, never a button', kb === 'gameOver' && kb2.state !== 'title' && !kb2.replay && kb2.state !== 'gameOver', JSON.stringify(kb2));

  // ---- pause: a MENU button (touch) and Q
  const ps = await p.evaluate(async () => { const G = window.__th, o = {}; await __skipIntro(); o.fly = G.state;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true })); await __wait(2); o.paused = G.paused; const q = window.__pauseQ();
    window.__tapAt((q[0] + q[1]) / 2, (q[2] + q[3]) / 2, 'touch'); await __wait(3); o.after = G.state; o.pausedAfter = G.paused;
    window.__tapAt(128, 100); await __wait(3); await __skipIntro(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true })); await __wait(2);
    window.__tapAt(128, 60, 'touch'); await __wait(2); o.resumed = !G.paused && G.state === 'fly';
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true })); await __wait(2); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true })); await __wait(3); o.q = G.state;
    return o; });
  rep('pause: the MENU button quits to the menu', ps.fly === 'fly' && ps.paused && ps.after === 'title' && !ps.pausedAfter, JSON.stringify(ps));
  rep('pause: a tap elsewhere resumes; Q quits', ps.resumed && ps.q === 'title', JSON.stringify(ps));

  // ---- tips: FAST only in epoch 1; the firewall tip shows during the fight and is gone after it
  const tp = await p.evaluate(async () => { const G = window.__th, o = {}; try { localStorage.removeItem('th.tips'); } catch (e) {}
    window.__tapAt(128, 100); await __wait(3); await __skipIntro(); window.__resetTips();
    G.round = 2; G.tip = null; G.tipQ = []; G.flightT = 30; G.shots = 3; G.lastShotF = -99; G.freeze = 0;
    G.birds = [{ x: 110, y: 70, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 10, dirT: 1e9, hitT: 0 }]; window.__tapAt(122, 80); await __wait(2);
    o.fastInEpoch2 = !!(G.tip && G.tip.id === 'fast') || (G.tipQ || []).includes('fast');
    G.tip = null; G.tipQ = []; G.round = 4; G.wave = 2; G.tally = ['hit', 'hit']; G.bossDone = false; G.swarmDone = true; G.birds = []; G.state = 'gap'; G.t = 99; await __wait(3);
    if (G.state === 'fox') { G.fox.t = 999; await __wait(3); } const bo = G.birds.find(x => x.boss); o.boss = !!bo;
    for (let i = 0; i < 400 && !(G.tip && G.tip.id === 'firewall'); i++) await __wait(1); const t0 = G.tip ? G.tip.t : -1; await __wait(20);
    o.firewallShown = !!(G.tip && G.tip.id === 'firewall' && G.tip.t > t0 && G.swarm && G.swarm.boss);
    G.swarm = null; G.birds = []; G.state = 'fly'; await __wait(3); o.droppedAfter = !(G.tip && G.tip.id === 'firewall');
    return o; });
  rep('tips: no FAST tip after epoch 1 (it argued with the trained fakes)', !tp.fastInEpoch2, JSON.stringify(tp));
  rep('tips: the firewall tip shows during the boss fight, never after it', tp.boss && tp.firewallShown && tp.droppedAfter, JSON.stringify(tp));

  // ---- Easy never suggests Easy mode
  const ez = await p.evaluate(() => { const G = window.__th, L = window.__T().lines; const d0 = G.diff; G.diff = 'easy'; const seen = new Set(); for (let i = 0; i < 60; i++) seen.add(window.__line('miss3')); G.diff = 'medium'; const med = new Set(); for (let i = 0; i < 60; i++) med.add(window.__line('miss3')); G.diff = d0;
    return { easy: [...seen], medium: [...med] }; });
  rep('Easy: three timeouts never suggest Easy mode', ez.easy.length && !ez.easy.some(s => /EASY MODE\?|TRY EASY/.test(s)) && ez.medium.some(s => /EASY MODE/.test(s)), JSON.stringify(ez));

  // ---- the rewind: a trained fake that flew, fooled you; the game holds, taps do not fire, a later tap skips
  const rw = await p.evaluate(async () => { const G = window.__th, o = {}; window.__tapAt(128, 100); await __wait(3); await __skipIntro();
    G.state = 'fly'; G.flightT = 30; G.shots = 3; G.freeze = 0; G.gotcha = null; G.linger = null; G.adv.rewound = -1; G.fx = []; G.adv.hideLine = 'SERVE TIME 0.7S -> FAKES LOOK REAL 0.7S';
    const h = { x: 60, y: 120, vx: 0.8, vy: -0.4, sp: 1, tier: 'hi', bad: true, adv: true, duty: 0.5, hide: 40, hideTag: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 };
    const real = () => ({ x: 200, y: 24, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 20, dirT: 1e9, hitT: 0 }); // fakes leave once no real request is up
    G.birds = [real(), h]; await __wait(26); o.trail = (h.trail || []).length / 5; const s0 = G.shots, sc0 = G.score; G.lastShotF = -99;
    window.__tapAt(h.x + 12, h.y + 10); await __wait(2); const g = G.gotcha; o.full = g && g.full; o.end = g && g.end; o.n = g && g.n; o.freeze = G.freeze; o.ln = g && g.ln;
    o.pop = G.fx.some(f => f.type === 'pts' && /^-\d/.test(f.txt) && f.sc === 2); o.pen = sc0 - G.score;
    const s1 = G.shots; G.lastShotF = -99; window.__tapAt(128, 60); await __wait(2); o.noShotInHold = G.shots === s1 && !!G.gotcha && G.gotcha.t < G.gotcha.end && G.freeze > 0;
    for (let i = 0; i < 40 && G.gotcha && G.gotcha.t < 24; i++) await __wait(1); G.lastShotF = -99; window.__tapAt(128, 60); await __wait(2); o.skipped = G.freeze === 0 && G.gotcha && G.gotcha.t >= G.gotcha.end && G.shots === s1;
    for (let i = 0; i < 80 && G.gotcha; i++) await __wait(1); o.cleared = !G.gotcha;
    // a second fool by the same version: the short card, no replay
    const h2 = { x: 120, y: 60, vx: 0.6, vy: 0, sp: 1, tier: 'lo', bad: true, adv: true, duty: 0.5, hide: 40, hideTag: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 };
    G.birds = [real(), h2]; G.shots = 3; await __wait(20); G.lastShotF = -99; window.__tapAt(h2.x + 12, h2.y + 10); await __wait(2); o.second = G.gotcha && { full: G.gotcha.full, end: G.gotcha.end };
    return o; });
  await p.screenshot({ path: SHOTS + '/ui_rewind_short.png' });
  rep('rewind: the first fool of a version holds and replays (2 s trail, the card line kept)', rw.full && rw.trail >= 20 && rw.end >= 100 && rw.freeze >= 90 && rw.ln === 'SERVE TIME 0.7S -> FAKES LOOK REAL 0.7S', JSON.stringify(rw));
  rep('rewind: the bill is in the panel, not a frozen pop over the replay', !rw.pop && rw.pen > 0, JSON.stringify(rw));
  rep('rewind: taps during the hold never fire; after 0.33 s one skips it', rw.noShotInHold && rw.skipped && rw.cleared, JSON.stringify(rw));
  rep('rewind: a second fool by the same version gets the short card', rw.second && !rw.second.full && rw.second.end === 48, JSON.stringify(rw));

  // ---- boss: a tap on the rotating IPs bounces: no VRAM, no damage, but points and combo
  const bs = await p.evaluate(async () => { const G = window.__th, o = {}; G.gotcha = null; G.freeze = 0;
    G.round = 4; G.wave = 2; G.tally = ['hit', 'hit']; G.bossDone = false; G.swarmDone = true; G.birds = []; G.state = 'gap'; G.t = 99; await __wait(3);
    if (G.state === 'fox') { G.fox.t = 999; await __wait(3); } const bo = G.birds.find(x => x.boss); if (!bo) return { none: true };
    while (bo.enter) await __wait(1); bo.vx *= 0.1; while (((bo.fw || 0) % 60) < window.__fw.open + 2) await __wait(1);
    G.combo = 4; const s1 = G.shots, h1 = bo.hp, sc1 = G.score; G.lastShotF = -99; window.__tapAt(bo.x + 24, bo.y + 20); await __wait(2);
    o.vram = G.shots === s1; o.hp = bo.hp === h1; o.pen = sc1 - G.score; o.combo = G.combo; o.mult = { easy: 1, medium: 1.5, hard: 2, daily: 1.5 }[G.diff]; return o; });
  rep('boss: a tap on the rotating IPs costs points and the combo, never VRAM', bs.vram && bs.hp && bs.pen === Math.round(300 * bs.mult) && bs.combo === 0, JSON.stringify(bs));

  // ---- v4m: late arrivals, 429 freezes fakes, FAST by age, the closing window, disguise clamp
  const lm = await p.evaluate(async () => { const G = window.__th, o = {}; G.gotcha = null; G.freeze = 0; G.swarm = null; G.state = 'fly'; G.flightT = 30; G.shots = 3; G.round = 5; G.wx = window.__T().levels[0];
    const real = { x: 120, y: 80, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0, hold: 20 };
    const fake = { x: 40, y: 60, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: true, adv: true, duty: 0.5, hide: 60, hideTag: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 };
    G.birds = [real, fake]; await __wait(3); o.fakeStays = fake.st === 'fly'; o.heldUnseen = !window.__render().birds.some(r => Math.abs(r[0] - 120) < 1 && Math.abs(r[1] - 80) < 1);
    const s0 = G.shots; G.lastShotF = -99; window.__tapAt(132, 90); await __wait(2); o.heldNotHit = real.st === 'fly' && G.shots === s0 - 1; // the tap is a miss: nothing was there yet
    for (let i = 0; i < 40 && real.hold > 0; i++) await __wait(1); await __wait(2); o.arrives = real.hold === 0 && real.at > 0;
    // a 429 now freezes the fake too
    G.birds = [{ x: 120, y: 80, vx: 0.5, vy: 0, sp: 1, tier: 'lo', bad: false, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }, { x: 40, y: 60, vx: 0.5, vy: 0, sp: 1, tier: 'lo', bad: true, adv: true, duty: 0.5, hide: 60, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 }];
    G.wx = window.__T().levels.find(l => l.storm) || G.wx; G.nextLightning = 1; await __wait(3); o.fakeFrozen = G.birds[1].frozen > 0 && G.birds[0].frozen > 0;
    // FAST by age: frozen 40 frames, served at at~10 -> not x2
    for (let i = 0; i < 60 && G.birds[0].frozen > 0; i++) await __wait(1); const r0 = G.birds[0]; for (let i = 0; i < 60 && (r0.age || 0) < 70; i++) await __wait(1); o.age = r0.age; o.at = r0.at; const sc = G.score; G.lastShotF = -99; G.shots = 3; window.__tapAt(r0.x + 12, r0.y + 10); await __wait(2);
    o.fastPop = G.fx.filter(f => f.type === 'pts' && /FAST/.test(f.txt)).length;
    // the window keeps closing; a disguise never outlasts 60% of it
    G.round = 33; o.limit33 = window.__flightLimit(); G.round = 26; o.limit26 = window.__flightLimit(); G.round = 5;
    return o; });
  rep('late arrival: a held request is unseen and untouchable, the fake stays up, then it arrives', lm.fakeStays && lm.heldUnseen && lm.heldNotHit && lm.arrives, JSON.stringify(lm));
  rep('a 429 freezes the fakes too, and the FAST clock runs through it', lm.fakeFrozen && lm.age >= 70 && lm.at <= 36 && lm.fastPop === 0, JSON.stringify(lm));
  rep('the flight window keeps closing after epoch 26 (0.8 s by 33)', lm.limit26 === 90 && lm.limit33 === 48, JSON.stringify(lm));
  const hc = await p.evaluate(async () => { const G = window.__th, o = { n: 0, held: 0, multi: 0, clamp: true }; G.state = 'gap'; G.freeze = 0; G.gotcha = null;
    const P = G.adv.policy || (G.adv.policy = { tierHi: 0.8, hide: 90, hideTag: false, rateUp: true, duty: 0.6 }); P.hide = 90; G.adv.on = true; G.round = 21;
    const lat = window.__T().levels.find(l => l.shortFlight); if (lat) G.wx = lat;
    for (let k = 0; k < 40; k++) { G.birds = []; G.wave = 0; G.swarmDone = true; G.bossDone = true; G.state = 'gap'; G.t = 999; G.epochWaves = 3; G.adv.epochBuilt = 0; await __wait(2);
      if (G.state !== 'fly') continue; o.n++; if (G.birds.length >= 2) o.multi++; if (G.birds.some(b => b.hold > 0)) o.held++; for (const b of G.birds) if (b.adv && b.hide > Math.floor(window.__flightLimit() * 0.6)) o.clamp = false; }
    o.limit = window.__flightLimit(); return o; });
  rep('adversary waves: about half the multi-request waves stagger one arrival; disguises fit the window', hc.n >= 20 && hc.held >= Math.max(3, hc.multi * 0.2) && hc.held <= hc.multi * 0.8 && hc.clamp, JSON.stringify(hc));

  // ---- v4.3: top 5 with initials, providers, PROD DB, boss rotation, fake bill, colour habit
  const ini = await p.evaluate(async () => { const G = window.__th, o = {}; try { localStorage.removeItem(window.__top().key); localStorage.removeItem('th.ini'); } catch (e) {}
    window.__tapAt(128, 100); await __wait(3); await __skipIntro(); G.tally = ['miss', 'miss', 'miss', 'miss', 'miss']; G.wave = 5; G.score = 50000; G.cost = 0;
    for (let i = 0; i < 60 * 40 && G.state !== 'gameOver'; i++) { if (G.state === 'fox') G.fox.t = 999; if (G.state === 'intro' || G.state === 'gap') G.t = Math.max(G.t, 999); await __wait(1); }
    await __wait(45); o.entry = !!G.entry; o.brag = !document.getElementById('brag').hidden;
    for (const k of ['q', 'a', 'z']) document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); await __wait(2);
    window.__tapAt(152, 66, 'touch'); await __wait(2); // touch: top half of the third letter -> Z+1 = A
    o.letters = G.entry && G.entry.c.map(i => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i]).join('');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await __wait(3);
    o.saved = !G.entry && G.topList && G.topList[G.topRank] && G.topList[G.topRank].n; o.rank = G.topRank; o.stored = window.__top().list.map(e => e.n + e.s).join(','); o.bragAfter = !document.getElementById('brag').hidden;
    window.__tapAt(128, 60); await __wait(3); o.guarded = G.state === 'gameOver'; await __wait(30); window.__tapAt(128, 60); await __wait(3); o.reboot = G.state; return o; }); // a tap right after saving cannot reboot; one 0.5 s later does
  rep('top 5: a run that makes the table asks for initials (keys and touch), saves them, then the share buttons', ini.entry && !ini.brag && ini.letters === 'QAA' && ini.saved === 'QAA' && ini.rank === 2 && /QAA45000|QAA/.test(ini.stored) && ini.bragAfter && ini.guarded && ini.reboot !== 'gameOver', JSON.stringify(ini));
  const ini2 = await p.evaluate(async () => { const G = window.__th, o = {}; await __skipIntro(); G.tally = ['miss', 'miss', 'miss', 'miss', 'miss']; G.wave = 5; G.score = 100; G.cost = 0;
    for (let i = 0; i < 60 * 40 && G.state !== 'gameOver'; i++) { if (G.state === 'fox') G.fox.t = 999; if (G.state === 'intro' || G.state === 'gap') G.t = Math.max(G.t, 999); await __wait(1); } await __wait(30); o.lowEntry = !!G.entry;
    window.__tapAt(128, 60); await __wait(3); await __skipIntro(); G.runAssisted = true; G.tally = ['miss', 'miss', 'miss', 'miss', 'miss']; G.wave = 5; G.score = 999999; G.cost = 0;
    for (let i = 0; i < 60 * 40 && G.state !== 'gameOver'; i++) { if (G.state === 'fox') G.fox.t = 999; if (G.state === 'intro' || G.state === 'gap') G.t = Math.max(G.t, 999); await __wait(1); } await __wait(30); o.assistEntry = !!G.entry; G.runAssisted = false; return o; });
  rep('top 5: a low score or an assisted run never asks', !ini2.lowEntry && !ini2.assistEntry, JSON.stringify(ini2));
  const pv = await p.evaluate(async () => { const G = window.__th, T = window.__T(), o = {}; o.who = T.levels.map(l => l.who).filter(Boolean).length; o.quips = T.levels.every(l => !l.who || (l.quips && l.quips.length >= 2));
    o.widths = T.levels.filter(l => l.who).every(l => (T.trafficFrom + l.who + ': ' + l.whoTag).length * 4 - 1 <= 250 && l.quips.every(q => q.length <= 76));
    o.forbidden = /grok|gemini|chatgpt|claude|openai|anthropic|google|xai|nvidia|apple/i.test(JSON.stringify(T.levels)); return o; });
  rep('providers: six parody providers, each with quips, no real marks, lines fit', pv.who === 6 && pv.quips && pv.widths && !pv.forbidden, JSON.stringify(pv));
  const pd = await p.evaluate(async () => { const G = window.__th, o = {}; window.__tapAt(128, 60); await __wait(3); await __skipIntro(); G.round = 6; G.state = 'fly'; G.freeze = 0; G.gotcha = null; G.shots = 3; G.flightT = 30; G.unpauseT = 0;
    G.birds = [{ x: 200, y: 30, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 20, dirT: 1e9, hitT: 0 }]; G.props = [{ x: 60, y0: 80, y: 80, vx: 0, t: 0, st: 'fly' }]; await __wait(2);
    const sc = G.score; G.combo = 4; G.lastShotF = -99; window.__tapAt(68, 88); await __wait(3); const q = G.props[0]; o.fell = q && q.st === 'fall'; o.pen = sc - G.score; o.combo = G.combo; o.fact = G.wf.prod; o.tally = G.tally.length;
    G.props = [{ x: 100, y0: 80, y: 80, vx: 0, t: 0, st: 'fly' }]; G.birds = [{ x: 104, y: 92, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 20, dirT: 1e9, hitT: 0 }]; G.shots = 3; G.lastShotF = -99; await __wait(2);
    window.__tapAt(116, 104); await __wait(3); o.requestWins = G.props[0].st === 'fly' && G.birds[0].st !== 'fly'; return o; });
  rep('PROD DB: shooting it costs big, resets the combo, it falls, no slot used; a request under the tap wins', pd.fell && pd.pen >= 4000 && pd.combo === 0 && pd.fact && pd.requestWins, JSON.stringify(pd));
  const br = await p.evaluate(async () => { const G = window.__th, o = {}; G.props = []; G.round = 4; G.wave = 2; G.tally = ['hit', 'hit']; G.bossDone = false; G.swarmDone = true; G.birds = []; G.state = 'gap'; G.t = 99; await __wait(3);
    if (G.state === 'fox') { G.fox.t = 999; await __wait(3); } const bo = G.birds.find(x => x.boss); if (!bo) return { none: true }; while (bo.enter) await __wait(1); bo.vx *= 0.05;
    while (((bo.fw || 0) % 60) >= window.__fw.open || ((bo.fw || 0) % 60) > 2) await __wait(1); const hp0 = bo.hp; let hits = 0;
    for (let k = 0; k < 6; k++) { if (((bo.fw || 0) % 60) >= window.__fw.open) break; G.lastShotF = -99; G.shots = 9; const h = bo.hp; window.__tapAt(bo.x + 24, bo.y + 20); await __wait(5); if (bo.hp < h) hits++; }
    o.hitsInOpening = hits; o.shieldUp = ((bo.fw || 0) % 60) >= window.__fw.open; o.open = window.__fw.open; return o; });
  rep('boss: three hits per opening, then it rotates', br.hitsInOpening === 3 && br.shieldUp && br.open === 26, JSON.stringify(br));
  const fb = await p.evaluate(async () => { const G = window.__th, o = {}; G.swarm = null; G.state = 'fly'; G.freeze = 0; G.gotcha = null; G.shots = 3; G.flightT = 30;
    const f = { x: 120, y: 80, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: true, st: 'fly', f: 0, at: 10, age: 10, dirT: 1e9, hitT: 0 }; G.birds = [{ x: 200, y: 30, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 20, dirT: 1e9, hitT: 0 }, f];
    G.combo = 0; const s0 = G.score; G.lastShotF = -99; window.__tapAt(132, 90); await __wait(3); o.fastPen = s0 - G.score; o.lo = window.__T().tiers ? 0 : 0; return o; });
  rep('a fake served inside the FAST window bills its FAST value twice', fb.fastPen > 0, JSON.stringify(fb));

  // ---- v4.4: a PROD DB in the air when the skin has none is ignored, not a throw (state fuzz found it)
  const sk = await p.evaluate(async () => { const G = window.__th, o = {}; G.state = 'fly'; G.freeze = 0; G.swarm = null; G.birds = []; G.shots = 3; G.flightT = 30;
    G.props = [{ x: 120, y0: 80, y: 80, vx: 0, t: 0, st: 'fly' }]; window.__applyTheme('duck'); await __wait(3); G.lastShotF = -99; const s0 = G.score; window.__tapAt(128, 88); await __wait(3);
    o.score = G.score - s0; o.still = (G.props || []).filter(q => q.st === 'fly').length; window.__applyTheme('gpu'); G.props = []; return o; });
  rep('a PROD DB under a skin without one is neither drawn nor billed', sk.score > -1000, JSON.stringify(sk));
  // ---- v4.4: the glitch hunter's fixes (initials need OK, a paused replay resumes on a tap, MENU from it cleans up)
  const gh = await p.evaluate(async () => { const G = window.__th, o = {}; const key = k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    G.state = 'title'; G.paused = false; G.replay = null; G.entry = null; window.__tapAt(128, 100); await __wait(3); await __skipIntro(); G.score = 999999; G.cost = 0;
    await __toGameOver(); o.entry = !!G.entry;
    if (G.entry) { window.__tapAt(40, 40); await __wait(2); o.offTapSaved = !G.entry; key('Enter'); await __wait(2); o.saved = !G.entry; }
    await __wait(40); key('r'); await __wait(20); o.replay = !!G.replay; key('p'); await __wait(2); o.paused = G.paused;
    window.__tapAt(128, 40); await __wait(2); o.resumed = !G.paused && !!G.replay;
    key('p'); await __wait(2); const q = window.__pauseQ(); window.__tapAt((q[0] + q[1]) / 2, (q[2] + q[3]) / 2); await __wait(3); o.quit = G.state === 'title' && !G.replay; o.freeze = G.freeze; return o; });
  rep('initials: a tap off the letters never saves, Enter does; a paused replay resumes on a tap and quits from MENU', gh.entry && !gh.offTapSaved && gh.saved && gh.replay && gh.paused && gh.resumed && gh.quit && !gh.freeze, JSON.stringify(gh));
  rep('no page errors', errs.length === 0, errs.join(' | ') || 'none');
  for (const r of out) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.n + ' — ' + r.how);
  const bad = out.filter(r => !r.ok).length; console.log(bad ? bad + ' FAILED' : 'ALL PASS'); await b.close(); process.exit(bad ? 1 : 0);
})();
