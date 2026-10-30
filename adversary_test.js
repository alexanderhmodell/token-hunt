// v4.1 checks: the adversary in the waves (what it learns, what it prints, what its fakes do), the epoch card, the boss
// firewall, rule/tip/title widths, and a Daily that never depends on how you play.  node adversary_test.js [url]
const { chromium, launchOpts } = require('./pw'); const path = require('path');
const FILE = process.argv[2] || 'file://' + path.resolve(__dirname, 'dist/index.html');
const SHOTS = path.resolve(__dirname, 'shots');
const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });
const out = []; const rep = (n, ok, how) => out.push({ n, ok: !!ok, how });
const LIB = () => { window.__wait = f => new Promise(r => { let n = 0; const t = () => (++n >= f ? r() : requestAnimationFrame(t)); requestAnimationFrame(t); });
  window.__click = (x, y) => { const cv = document.getElementById('g'), r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + x * r.width / 256, clientY: r.top + y * r.height / 240, pointerType: 'mouse', button: 0, isPrimary: true, bubbles: true })); }; };
(async () => {
  const b = await chromium.launch(launchOpts);
  const p = await b.newPage({ viewport: { width: 1000, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(FILE); await p.waitForTimeout(300); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(LIB);
  // widths: every rule card, tip and title line fits its band
  const widths = await p.evaluate(() => { const bad = []; const w7 = s => s.length * 6 - 1; const th0 = window.__th.theme;
    for (const id of ['gpu', 'duck']) { window.__applyTheme(id); const T = window.__T();
      for (const src of [T.rules || {}, T.rulesAdv || {}]) for (const k in src) if (src[k] && w7(src[k]) > 246) bad.push(id + ' rule ' + k + ' ' + w7(src[k]));
      for (const k in (T.tips || {})) if (w7(T.tips[k]) > 240) bad.push(id + ' tip ' + k + ' ' + w7(T.tips[k]));
      if (w7(T.tagline[1]) > 150) bad.push(id + ' tagline ' + w7(T.tagline[1]));
      for (const l of T.howto) if (w7(l) > 146) bad.push(id + ' howto ' + l + ' ' + w7(l));
      const X = T.adv; const worst = [X.served + ' 10/12 ' + X.hi + ' -> ' + X.fake + ' 80% ' + X.hi, X.served + ' 10/12 ' + X.lo + ' -> ' + X.fake + ' 80% ' + X.lo, 'SERVE TIME 9.9S -> ' + X.fake + ' LOOK REAL 1.5S', X.served + ' ' + X.hi + ' FASTER -> ' + X.fake + ' 80% ' + X.hi, 'DODGED 10/12 -> ' + X.hide, X.served + ' 10/12 ' + X.fake + ' -> MORE ' + X.fake, X.fake + ' GLITCH LESS: 75% -> 60%', X.ver + '12 ' + X.head];
      for (const l of worst) if (w7(l) > 240) bad.push(id + ' card ' + l + ' ' + w7(l)); }
    window.__applyTheme(th0); return bad; });
  rep('all rule cards, tips, title lines and card lines fit', widths.length === 0, widths.join('; ') || 'ok');
  // epoch 1, played: serve purple fast when possible, let the tutorial fake go
  const r1 = await p.evaluate(async () => { const G = window.__th; window.__click(128, 100); await __wait(3); G.boot.t = 999; await __wait(3); G.t = 999; await __wait(3); if (G.state === 'fox') { G.fox.t = 999; await __wait(3); }
    let f = 0; while (G.state !== 'roundEnd' && G.state !== 'gameOver' && f++ < 60 * 90) { await __wait(1);
      if (G.state === 'fox' && G.fox.t > 20) G.fox.t = 999; if (G.state === 'intro') G.t = 999;
      if (G.state === 'fly' && f % 5 === 0 && G.shots > 0) { const real = G.birds.filter(x => x.st === 'fly' && !x.bad && !x.agent && !x.boss && x.at >= 20);
        if (real.length) { const t = real.find(x => x.tier === 'hi') || real[0]; G.lastShotF = -99; window.__click(t.x + 12, t.y + 10); } } }
    await __wait(5); return { state: G.state, update: G.adv.update, policy: G.adv.policy, ver: G.adv.ver }; });
  rep('epoch 1 trains model v2 and prints what it will do', r1.state === 'roundEnd' && r1.ver === 2 && r1.update && r1.update.length >= 2 && r1.update.every(l => l.includes('->')), JSON.stringify(r1.update));
  rep('policy matches the card: colour 80/20, serve time 15..90 frames, glitch 60%', r1.policy && (r1.policy.tierHi === 0.8 || r1.policy.tierHi === 0.2) && r1.policy.hide >= 15 && r1.policy.hide <= 90 && r1.policy.duty === 0.6, JSON.stringify(r1.policy));
  // the card: a first tap shows every line, the second continues
  await p.evaluate(async () => { const G = window.__th; G.t = 45; await __wait(2); window.__click(128, 100); await __wait(2); });
  await p.screenshot({ path: SHOTS + '/adv_card_all.png' });
  const r2 = await p.evaluate(async () => { const G = window.__th; const a = { shown: G.advShown, state: G.state }; window.__click(128, 100); await __wait(3); a.after = G.state; return a; });
  rep('epoch card: first tap shows all, second continues', r2.shown === true && r2.state === 'roundEnd' && r2.after === 'intro', JSON.stringify(r2));
  // epoch 2: a trained fake must spawn by the 2nd wave, in the printed colour, passing for real until its hide time
  const r3 = await p.evaluate(async () => { const G = window.__th; G.t = 999; await __wait(3); let f = 0, built = null, look = [];
    while (f++ < 60 * 40 && !built) { await __wait(1); if (G.state === 'fox') G.fox.t = 999; if (G.state === 'intro') G.t = 999;
      const h = G.birds.find(x => x.bad && x.adv && x.st === 'fly'); if (h) built = { tier: h.tier, hide: h.hide, duty: h.duty, ep: G.epochWaves, at: h.at }; }
    // watch its look for 80 frames: freeze the request in place so it stays on screen
    const h = G.birds.find(x => x.bad && x.adv); if (h) { for (let i = 0; i < 80; i++) { h.vx = 0; h.vy = 0; h.dirT = 1e9; G.flightT = 0; const at = h.at; await __wait(1); look.push([at, window.__render().birds.length]); } }
    return { built, policy: G.adv.policy, epochBuilt: G.adv.epochBuilt, round: G.round }; });
  rep('epoch 2 builds a trained fake by its 2nd wave', r3.built && r3.built.ep <= 3 && r3.epochBuilt >= 1, JSON.stringify(r3.built) + ' epochBuilt ' + r3.epochBuilt);
  rep('the trained fake carries the learned hide/duty', r3.built && r3.built.hide === r3.policy.hide && r3.built.duty === r3.policy.duty, JSON.stringify({ b: r3.built, p: r3.policy }));
  // colour: sample many trained fakes under the learned policy; about 4 in 5 wear the printed colour
  const rc = await p.evaluate(async () => { const G = window.__th; const want = G.adv.policy.tierHi > 0.5 ? 'hi' : 'lo'; let n = 0, same = 0; G.forceHalluc = true;
    for (let i = 0; i < 60; i++) { G.state = 'gap'; G.t = 99; G.round = 3; G.wave = 0; G.epochWaves = 2; G.tally = []; G.swarmDone = true; G.bossDone = true; G.birds = []; await __wait(2);
      const h = G.birds.find(x => x.bad && x.adv); if (h) { n++; if (h.tier === want) same++; } }
    G.forceHalluc = false; return { n, same, want }; });
  rep('trained fakes wear the printed colour 4 times in 5', rc.n >= 40 && rc.same / rc.n > 0.65 && rc.same / rc.n < 0.95, JSON.stringify(rc));
  // phase check: freeze the sim (hit-stop), then compare the fake's pixels with the same request drawn as a real one; equal = clean
  const r4 = await p.evaluate(async () => { const G = window.__th; const res = []; G.state = 'fly'; G.flightT = 0; G.linger = null; G.tip = null;
    const h = { x: 20, y: 40, px: 20, py: 40, vx: 0.01, vy: 0, sp: 0, tier: 'hi', bad: true, adv: true, duty: 0.5, hide: 30, hideTag: false, ph0: 0, st: 'fly', f: 0, at: 0, dirT: 1e9, hitT: 0 };
    G.birds = [h]; G.freeze = 1e9; const grab = () => Array.from(document.getElementById('g').getContext('2d').getImageData(14, 30, 36, 34).data).join(',');
    for (let a = 0; a < 70; a++) { h.at = a; h.bad = true; await __wait(1); const fake = grab(); h.bad = false; await __wait(1); const real = grab(); h.bad = true; res.push(fake === real ? 0 : 1); }
    G.freeze = 0; G.birds = []; return res; });
  const early = r4.slice(0, 30), late = r4.slice(30, 70); const earlyGrey = early.filter(v => v).length, lateGrey = late.filter(v => v).length;
  rep('trained fake passes for real before its hide time, then glitches', earlyGrey === 0 && lateGrey >= 15 && lateGrey <= 25, 'glitch frames before hide ' + earlyGrey + '/30, after ' + lateGrey + '/40 (duty 0.5 -> ~20)');
  // the gotcha: serving a trained fake holds the game and spells out the trap; a fake you never had time for is not a dodge
  const rg = await p.evaluate(async () => { const G = window.__th; const o = {}; G.state = 'fly'; G.flightT = 30; G.shots = 3; G.freeze = 0; G.gotcha = null; G.linger = null;
    const h = { x: 120, y: 80, vx: 0, vy: 0, sp: 0, tier: 'hi', bad: true, adv: true, duty: 0.5, hide: 36, hideTag: false, ph0: 0, st: 'fly', f: 0, at: 20, dirT: 1e9, hitT: 0 };
    const r = { x: 60, y: 90, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 20, dirT: 1e9, hitT: 0 };
    G.birds = [r, h]; const f0 = G.adv.fooled; G.lastShotF = -99; window.__click(h.x + 12, h.y + 10); await __wait(2);
    o.gotcha = G.gotcha && { fired: G.gotcha.fired, hide: G.gotcha.hide }; o.freeze = G.freeze; o.fooled = G.adv.fooled - f0;
    return o; });
  await p.screenshot({ path: SHOTS + '/adv_gotcha.png' });
  rep('gotcha: a served trained fake freezes the game and shows the trap', rg.gotcha && rg.gotcha.fired >= 20 && rg.gotcha.hide === 36 && rg.freeze >= 30 && rg.fooled === 1, JSON.stringify(rg));
  const rd = await p.evaluate(async () => { const G = window.__th; await __wait(80); G.state = 'fly'; G.flightT = 30; G.shots = 3; G.freeze = 0; const d0 = G.run.hDodged, o0 = G.adv.obs.dodged;
    const h = { x: 160, y: 60, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: true, adv: true, duty: 0.5, hide: 0, ph0: 0, st: 'fly', f: 0, at: 5, dirT: 1e9, hitT: 0 };
    const r = { x: 60, y: 90, vx: 0, vy: 0, sp: 0, tier: 'lo', bad: false, st: 'fly', f: 0, at: 5, dirT: 1e9, hitT: 0 };
    G.birds = [r, h]; G.lastShotF = -99; window.__click(r.x + 12, r.y + 10); await __wait(90); return { dodged: G.run.hDodged - d0, obs: G.adv.obs.dodged - o0, state: G.state }; });
  rep('a fake you never had time for is not a dodge', rd.dodged === 0 && rd.obs === 0, JSON.stringify(rd));
  // boss: deploys shielded (free taps), firewall blocks damage for free, kill takes the splinters with it; intro counts real HP
  const r5 = await p.evaluate(async () => { const G = window.__th; const o = {};
    G.round = 8; G.wave = 2; G.tally = ['hit', 'hit']; G.bossDone = false; G.swarmDone = true; G.birds = []; G.state = 'gap'; G.t = 99; await __wait(3); o.line = G.fox.line;
    if (G.state === 'fox') { G.fox.t = 999; await __wait(3); }
    const bo = G.birds.find(x => x.boss); if (!bo) return { none: true, state: G.state };
    o.enter = bo.enter; const s0 = G.shots; window.__click(Math.max(2, bo.x + 30), bo.y + 20); G.lastShotF = -99; await __wait(2); o.freeDeploy = G.shots === s0 && bo.hp === bo.hp0;
    while (bo.enter) await __wait(1); bo.vx *= 0.1; // slow it so the test fits on screen
    while (((bo.fw || 0) % 60) < window.__fw.open + 2) await __wait(1); const s1 = G.shots, h1 = bo.hp; G.lastShotF = -99; window.__click(bo.x + 24, bo.y + 20); await __wait(2); o.freeFirewall = G.shots === s1 && bo.hp === h1;
    while (((bo.fw || 0) % 60) >= window.__fw.open || ((bo.fw || 0) % 60) < 2) await __wait(1);
    let guard = 0; while (bo.st === 'fly' && bo.hp > 0 && guard++ < 400) { if (!(((bo.fw || 0) % 60) >= window.__fw.open) && G.freeze === 0) { G.lastShotF = -99; G.shots = Math.max(G.shots, 3); window.__click(bo.x + 24, bo.y + 20); } await __wait(4); }
    o.killed = G.swarm && G.swarm.killed; o.agentsLeft = G.birds.filter(x => x.agent && x.st === 'fly').length; o.hp0 = bo.hp0; return o; });
  rep('epoch-8 intro counts the real HP', r5.line && /NINE/.test(r5.line) === /HITS/.test(r5.line), JSON.stringify(r5.line));
  rep('boss: deploying and firewalled taps are free', r5.freeDeploy && r5.freeFirewall, JSON.stringify(r5));
  rep('boss: killed, and its splinters fall with it', r5.killed && r5.agentsLeft === 0, JSON.stringify(r5));
  // rule cards follow the mode: no epoch-4 tag rule with the adversary on; Daily keeps the mimic card
  const r6 = await p.evaluate(async () => { const G = window.__th; const T = window.__T(); return { adv4: (T.rulesAdv && 4 in T.rulesAdv) ? T.rulesAdv[4] : 'missing', fixed4: T.rules[4], adv2: T.rulesAdv[2], fixed2: T.rules[2] || null }; });
  rep('rule cards: adversary runs get no epoch-4 tag card; Daily keeps the mimic card', r6.adv4 === null && /PURPLE|GOLD/.test(r6.fixed4) && r6.fixed2 === null && /TRAIN|STUDY/.test(r6.adv2), JSON.stringify(r6));
  // Daily: what spawns never depends on how you play (a breach no longer skips the burst roll)
  const daily = async (lose) => { const ctx = await b.newContext({ viewport: { width: 800, height: 760 } }); const p2 = await ctx.newPage(); await p2.goto(FILE); await p2.waitForTimeout(300); await p2.evaluate(LIB); await p2.keyboard.press('4'); await p2.waitForTimeout(100);
    const r = await p2.evaluate(async lose => { const G = window.__th; window.__click(128, 100); await __wait(3); G.boot.t = 999; await __wait(3); const seq = []; let f = 0, last = -1;
      while (seq.length < 34 && f++ < 60 * 240) { await __wait(1); if (G.state === 'intro') G.t = 999; if (G.state === 'fox') G.fox.t = 999; if (G.state === 'roundEnd') { G.t = 999; } if (G.state === 'gameOver') break;
        if (G.state === 'fly' && G.wavesStarted !== last && !G.swarm) { last = G.wavesStarted; seq.push(G.round + ':' + G.birds.map(x => (x.bad ? 'F' : x.tier[0]) + (x.x - (x.vx + G.wind * 0.9) * x.at).toFixed(1)).join(',')); /* back to the spawn point */ if (lose && seq.length % 4 === 0) G.vramLost = 1; }
        if (G.state === 'fly' && G.flightT > 14 && f % 4 === 0) { const t = G.birds.find(x => x.st === 'fly' && !x.bad && (lose || !(x.boss || x.agent)));
          if (t) { G.lastShotF = -99; G.shots = Math.max(G.shots, 2); if (t.boss) { t.enter = false; t.fw = 0; } window.__click(t.x + (t.boss ? 24 : t.agent ? 6 : 12), t.y + (t.boss ? 20 : t.agent ? 5 : 10)); }
          else if (!lose) { for (const x of G.birds) if ((x.boss || x.agent) && x.st === 'fly') { if (x.boss) x.x = x.vx > 0 ? 300 : -100; else x.y = 999; } } } }
      return { seq, daily: G.daily, advOn: G.adv && G.adv.on, round: G.round }; }, lose); await ctx.close(); return r; };
  const dA = await daily(false), dB = await daily(true);
  const n = Math.min(dA.seq.length, dB.seq.length); let same = n > 10; for (let i = 0; i < n; i++) if (dA.seq[i] !== dB.seq[i]) { same = false; break; }
  rep('Daily: adversary off, and spawns are identical whether you lose VRAM or hit the boss', dA.advOn === false && same, 'daily ' + dA.daily + '/' + dB.daily + ', epochs ' + dA.round + '/' + dB.round + ', compared ' + n + ' waves' + (same ? '' : ' first diff ' + dA.seq.find((x, i) => x !== dB.seq[i])));
  rep('no page errors', errs.length === 0, errs.join(';') || 'none');
  await b.close(); for (const o of out) console.log(`${o.ok ? 'PASS' : 'FAIL'} ${o.n} — ${o.how}`); const all = out.every(o => o.ok); console.log(all ? 'ALL PASS' : 'FAILED'); process.exit(all ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
