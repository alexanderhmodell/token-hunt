// Scripted ~60 s trailer WITH SOUND, captured from inside the page. Output: dist/trailer.mp4 (1024x960, 30 fps, h264 + aac).
//
//   node trailer.js
//   env  CRT=lite|off   lite (default): force the lite WebGL CRT look; off: the plain pixel canvas
//        SEED=<int>     seeds Math.random() so every run plays the same waves (default 20261029)
//        NORMALIZE=0    keep the capture's own level (default: peak-normalise to -3 dBFS, a pure gain, no compression)
//        PRESET=medium  x264 preset      KEEP=1  keep video_tmp/      ENCODE_ONLY=1  re-encode the last video_tmp/ capture
//
// No screen recorder and no audio device, everything is taken inside the page:
//   video  an offscreen 512x480 compositor canvas copies #crtgl (the WebGL CRT canvas) when it is displayed, else #g, once per
//          animation frame, and canvas.captureStream(0) + track.requestFrame() hands every one of those frames to the encoder (60 fps).
//          (captureStream(60) in its automatic mode thins the stream to ~35 fps with uneven gaps: ~10% of the 30 fps output frames
//          then repeat their predecessor, against ~1% with requestFrame.) 512x480 is deliberate: a 1024x960 compositor
//          makes the VP8 encoder starve a 2-core box (stalls up to 190 ms, which would also underrun the music scheduler's 250 ms
//          lookahead); at 512x480 it holds 60 fps. ffmpeg upscales 2x with nearest-neighbour, so the pixels stay square.
//   audio  window.__audioNodes() (already exposed by the game) hands over the last node of the audio graph, the DynamicsCompressor
//          that feeds ac.destination. A MediaStreamAudioDestinationNode connected to it in parallel is the audio track: exactly the
//          mix a player hears, with the game's own output chain untouched. Everything is Web Audio, except the critic's
//          speechSynthesis voice, which no tap can hear: it is switched off here so the typewriter chirps carry the lines.
//   MediaRecorder muxes both (webm, vp8 + opus); the chunks stream to Node as base64; ffmpeg makes the mp4.
//   The share card is a DOM overlay, not canvas pixels, so the page also renders it into a 1024x960 still (the real #cardimg)
//   and ffmpeg lays that still over the last seconds.
// If the captured audio is silent the script says so and stops without writing an mp4.
const { chromium, launchOpts } = require('./pw');
const path = require('path'); const fs = require('fs'); const { spawnSync } = require('child_process');

const ROOT = __dirname, TMP = path.join(ROOT, 'video_tmp'), OUT = path.join(ROOT, 'dist', 'trailer.mp4');
const CRT = (process.env.CRT || 'lite').toLowerCase(), SEED = (process.env.SEED || '20261029') | 0;
const NORMALIZE = process.env.NORMALIZE !== '0', PRESET = process.env.PRESET || 'medium', KEEP = process.env.KEEP === '1';
const CAP = { W: 512, H: 480, vbps: 6e6, abps: 192e3, CW: 1024, CH: 960 }; // compositor size, bitrates, closer-still size
const sleep = ms => new Promise(r => setTimeout(r, ms));
const WEBM = path.join(TMP, 'trailer.webm'), STILL = path.join(TMP, 'closer.png'), META = path.join(TMP, 'meta.json');
let clock = Date.now(); const mark = s => console.log('[' + ((Date.now() - clock) / 1000).toFixed(1).padStart(5) + 's] ' + s);

// ---------------------------------------------------------------------------------------------------------------- in-page code
// Runs in the page after the first real click (that click is what makes the game build its AudioContext).
function installCapture(cfg) {
  const { W, H, vbps, abps, CW, CH } = cfg;
  const nodes = window.__audioNodes();
  if (!nodes) throw new Error('the game has no AudioContext yet (it is created on the first real pointerdown)');
  const { ac, comp } = nodes; if (ac.state !== 'running') ac.resume();
  const dest = ac.createMediaStreamDestination(); comp.connect(dest); // the audio tap: parallel to ac.destination

  const g = document.getElementById('g'), glc = document.getElementById('crtgl'), cardBox = document.getElementById('cardbox'), cardImg = document.getElementById('cardimg');
  const out = document.createElement('canvas'); out.width = W; out.height = H; const o = out.getContext('2d', { alpha: false }); o.imageSmoothingEnabled = false;
  const vtrack = out.captureStream(0).getVideoTracks()[0]; // 0: a frame is sent only when requestFrame() is called, which the loop below does once per animation frame
  const source = () => (!glc.hidden && glc.width ? glc : g); // the CRT canvas when it is displayed, else the pixel canvas
  const cardUp = () => !cardBox.hidden && cardImg.complete && cardImg.naturalWidth > 0;
  function paintCard(c2, cw, ch, size) { // the game's overlay look: a dimmed screen, the 1080x1080 card in a bezel-coloured frame
    c2.fillStyle = 'rgba(5,5,10,0.88)'; c2.fillRect(0, 0, cw, ch);
    const x = Math.round((cw - size) / 2), y = Math.round((ch - size) / 2), b = Math.max(2, Math.round(size * 0.006));
    c2.save(); c2.shadowColor = 'rgba(138,92,245,0.45)'; c2.shadowBlur = Math.round(size * 0.06); c2.fillStyle = '#262238'; c2.fillRect(x - b, y - b, size + 2 * b, size + 2 * b); c2.restore();
    c2.imageSmoothingEnabled = true; c2.imageSmoothingQuality = 'high'; c2.drawImage(cardImg, x, y, size, size); c2.imageSmoothingEnabled = false;
  }
  let t0 = null, tCard = null, armed = false, frames = 0, last = performance.now(); const ivl = [], slowAt = []; // slowAt: [seconds into the recording, ms] of every frame over 60 ms
  (function loop() { // registered after the game's own rAF, so it always copies the frame the game just finished
    const now = performance.now(); ivl.push(now - last); if (armed && t0 !== null && now - last > 60 && slowAt.length < 40) slowAt.push([+((now - t0) / 1000).toFixed(1), Math.round(now - last)]); last = now; if (armed && t0 === null) t0 = now;
    const s = source(); o.drawImage(s, 0, 0, s.width, s.height, 0, 0, W, H);
    if (cardUp()) { if (tCard === null && t0 !== null) tCard = (now - t0) / 1000; paintCard(o, W, H, Math.round(H * 0.92)); }
    vtrack.requestFrame(); frames++; requestAnimationFrame(loop);
  })();

  const stream = new MediaStream([vtrack, dest.stream.getAudioTracks()[0]]);
  const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: vbps, audioBitsPerSecond: abps });
  const b64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result.slice(fr.result.indexOf(';base64,') + 8)) /* not indexOf(','): the mime type "codecs=vp8,opus" has one */; fr.onerror = rej; fr.readAsDataURL(blob); });
  const parts = []; // kept in memory while recording (base64-ing and shipping them every second would hitch the game); drain() sends them after stop()
  rec.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
  rec.start(1000); armed = true;
  window.__cap = {
    mimeType,
    closer() { // 1024x960 still of the share-card scene: the live frame, dimmed, with the real card on top
      const c = document.createElement('canvas'); c.width = CW; c.height = CH; const c2 = c.getContext('2d', { alpha: false }); c2.imageSmoothingEnabled = false;
      const s = source(); c2.drawImage(s, 0, 0, s.width, s.height, 0, 0, CW, CH); paintCard(c2, CW, CH, Math.round(CH * 0.92)); return c.toDataURL('image/png').split(',')[1];
    },
    async stop() {
      const done = new Promise(r => rec.addEventListener('stop', r, { once: true })); rec.stop(); await done; armed = false;
      const iv = ivl.slice(5).sort((a, b) => a - b);
      return { mimeType, chunks: parts.length, tCard, frames, n: iv.length, p50: iv[iv.length >> 1], p95: iv[Math.floor(iv.length * 0.95)], max: iv[iv.length - 1], slow: iv.filter(x => x > 25).length, slowAt, ac: ac.state, ct: ac.currentTime };
    },
    async drain() { // the whole recording to Node as base64, in 6 MB slices
      const blob = new Blob(parts); for (let o = 0; o < blob.size; o += 6 << 20) await window.__capChunk(await b64(blob.slice(o, o + (6 << 20)))); return blob.size;
    },
  };
}

// Exact shots, like demo_video.js: the crosshair glides to the live target over ~10 frames, then the shot is fired from inside the page
// at the target's current centre (read and fired in one task, so it cannot miss). kind: real | frozen | fake | agent | boss
function installShooter() {
  const G = window.__th, cv = document.getElementById('g'), nap = ms => new Promise(r => setTimeout(r, ms));
  const ev = (type, x, y) => { const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent(type, { clientX: r.left + x * r.width / 256, clientY: r.top + y * r.height / 240, pointerType: 'mouse', button: 0, isPrimary: true, bubbles: true, cancelable: true })); };
  const isReal = b => !b.bad && !b.agent && !b.boss;
  const pick = {
    real: () => G.birds.find(b => b.st === 'fly' && isReal(b) && !(b.frozen > 0)),
    frozen: () => G.birds.find(b => b.st === 'fly' && isReal(b) && b.frozen > 0),
    fake: () => G.birds.find(b => b.st === 'fly' && b.bad),
    agent: () => G.birds.filter(b => b.st === 'fly' && b.agent).sort((a, b) => b.y - a.y)[0], // the one closest to the racks
    boss: () => G.birds.find(b => b.st === 'fly' && b.boss),
  };
  const centre = b => b.boss ? [b.x + 24, b.y + 20] : b.agent ? [b.x + 6, b.y + 5] : [b.x + 12, b.y + 10];
  window.__tr = {
    count: kind => G.birds.filter(b => b.st === 'fly' && (kind === 'real' ? isReal(b) : kind === 'fake' ? b.bad : kind === 'agent' ? b.agent : kind === 'boss' ? b.boss : false)).length,
    async fire(kind, o = {}) {
      const { steps = 10, gain = 0.45, errX = 0, errY = 0 } = o; let b = pick[kind](); if (!b) return false;
      for (let i = 0; i < steps; i++) { b = pick[kind]() || b; const [cx, cy] = centre(b); G.mouse.on = true; G.mouse.x += (cx + errX - G.mouse.x) * gain; G.mouse.y += (cy + errY - G.mouse.y) * gain; await nap(33); }
      b = pick[kind]() || b; let [x, y] = centre(b); x += errX; y += errY; if (x > 215 && y < 20) y = 24; // keep clear of the HUD icons
      ev('pointermove', x, y); ev('pointerdown', x, y); return true;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------- Node side
function ff(args, tool) { const r = spawnSync(tool || 'ffmpeg', (tool ? [] : ['-hide_banner', '-nostdin']).concat(args), { encoding: 'utf8', maxBuffer: 1 << 28 }); if (r.status !== 0) { console.error((r.stderr || '').slice(-3000)); throw new Error((tool || 'ffmpeg') + ' failed'); } return (r.stderr || '') + (r.stdout || ''); }
function volume(file) { const e = ff(['-i', file, '-vn', '-af', 'volumedetect', '-f', 'null', '-']); const m = /mean_volume:\s*(-?[\d.]+) dB/.exec(e), x = /max_volume:\s*(-?[\d.]+) dB/.exec(e); return { mean: m ? +m[1] : -Infinity, max: x ? +x[1] : -Infinity }; }
function cadence(file) { // video packet timing of the capture: packets per second, longest gap, and how many 30 fps output frames repeat their predecessor
  const p = ff(['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', file], 'ffprobe').trim().split('\n').map(Number).sort((a, b) => a - b);
  let max = 0, j = 0, dup = 0, tot = 0, prev = -1; for (let k = 1; k < p.length; k++) max = Math.max(max, p[k] - p[k - 1]);
  for (let k = 0; k / 30 < p[p.length - 1]; k++) { while (j < p.length - 1 && p[j + 1] <= k / 30 + 1 / 60) j++; if (j === prev) dup++; prev = j; tot++; }
  return { fps: p.length / p[p.length - 1], max: max * 1000, repeat: 100 * dup / tot };
}

async function record() {
  fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
  const out = fs.createWriteStream(WEBM);
  const browser = await chromium.launch({ ...launchOpts, args: ['--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 1000 } });
  await ctx.addInitScript(seed => {
    let a = seed >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; // same waves every run
    try { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); } catch (e) {} // not Web Audio: cannot be tapped, so the chirp path is used
  }, SEED);
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.exposeFunction('__capChunk', b64 => { out.write(Buffer.from(b64, 'base64')); });
  await page.goto('file://' + path.join(ROOT, 'dist/index.html')); await sleep(500);

  const G = (fn, a) => page.evaluate(fn, a);
  const box = await (await page.$('#g')).boundingBox();
  const click = (x, y) => page.mouse.click(box.x + x * box.width / 256, box.y + y * box.height / 240); // logical 256x240 -> page
  const waitFor = async (fn, arg, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await G(fn, arg)) return true; await sleep(40); } return false; };
  const waitState = (st, ms) => waitFor(s => window.__th.state === s, st, ms);
  const waitWave = (n, ms = 14000) => waitFor(n => window.__th.state === 'fly' && window.__th.wavesStarted > n && !window.__th.swarm, n, ms); // a new ordinary wave is flying
  const fire = (kind, o) => G(a => window.__tr.fire(a.kind, a.o), { kind, o });
  const count = kind => G(k => window.__tr.count(k), kind);
  const fireAll = async (kind, o, max = 4) => { let n = 0; for (let i = 0; i < max && await count(kind); i++) { if (await fire(kind, o)) n++; await sleep(330); } return n; };
  const line = () => G(() => window.__th.fox.line);
  // finish the current epoch with a rigged tally (the epoch-clear panel plays for real), tap it away, land on the next epoch's intro card
  // hold: how long the EPOCH COMPLETE panel stays up before the tap (the first one carries the adversary's MODEL UPDATE, so it gets time to be read)
  const clearEpoch = async (round, tally, hold = 1000) => {
    await G(a => { const g = window.__th; g.round = a.round; g.wave = 6; g.tally = a.tally; g.state = 'fox'; g.fox.t = 109; g.fox.mode = 'hit'; g.fox.line = 'HAPPY TO HELP!'; g.birds = []; g.linger = null; g.swarm = null; }, { round, tally });
    if (!await waitState('roundEnd', 4000)) mark('WARN no roundEnd');
    const upd = await G(() => window.__th.adv && window.__th.adv.update); if (upd) mark('model update: ' + upd.join(' | '));
    await sleep(hold); for (let k = 0; k < 3 && await G(() => window.__th.state === 'roundEnd'); k++) { await click(128, 100); await sleep(160); } // a first tap shows every line, the next continues
    if (!await waitState('intro', 3000)) mark('WARN no intro');
  };

  // ---- set-up, not recorded: skip the tutorial, pick the CRT look, make the first real click (it creates the AudioContext)
  await G(c => { const g = window.__th; g.seen = true; if (c === 'off') { if (window.__crt().active) window.__toggleCRT(); } else window.__crtTier(1); g.toast = null; }, CRT);
  await click(128, 30); await sleep(250); // title screen, y < 70: only counts as a logo tap, but it is a real pointerdown
  console.log('crt:', JSON.stringify(await G(() => { const c = window.__crt(); return { active: c.active, tier: c.tier, canvas: c.w + 'x' + c.h }; })), 'audio:', JSON.stringify(await G(() => window.__audio())));
  await G(installShooter);
  await G(installCapture, CAP);
  clock = Date.now(); let result, still = null;
  try {
    // ---- 1  title (2 s)
    mark('title'); await G(() => { window.__th.titleFox = 0; }); // the bot peeks for the whole shot
    await sleep(2000);
    // ---- 2  boot
    mark('boot'); await click(128, 100); // startGame() has run: the flow channel exists
    await G(() => { window.__th.flow.halluc = -1; }); // no random hallucinations: the only fakes in the trailer are the scripted ones (forceHalluc)
    await sleep(1300); await G(() => { window.__th.boot.t = 999; });
    // ---- 3  epoch 1: a hit
    await waitState('fly', 6000); mark('epoch 1, wave 1: a hit');
    await G(() => { const g = window.__th; g.wavesStarted = 2; g.wave = 1; }); // the next wave is not the game's scripted tutorial hallucination
    await sleep(600); await fireAll('real');
    // ---- 4  a request escapes -> "AS AN AI, I CAN'T HELP WITH THAT."
    await waitWave(2); mark('wave 2: let it escape');
    await G(() => { window.__th.wave = 2; }); await sleep(1500);
    await G(() => { const g = window.__th; g.flightT = 99999; g.forceHalluc = true; }); // time out; the next wave carries a hallucination
    await waitState('fox', 6000); mark('critic: ' + await line()); await sleep(900);
    // ---- 5  a hallucination (grey ghost tagged FAKE) let go
    await waitWave(3); await G(() => { const g = window.__th; g.forceHalluc = false; g.wave = 3; }); mark('wave 3: ghost let go');
    await sleep(1500); await fireAll('real'); // serving the real one sends the ghost away
    await G(() => { window.__th.forceHalluc = true; });
    await waitState('fox', 8000); mark('critic: ' + await line()); await sleep(700);
    // ---- 6  a hallucination served on purpose (-500)
    await waitWave(4); await G(() => { const g = window.__th; g.forceHalluc = false; g.wave = 4; }); mark('wave 4: serve the fake');
    await sleep(1000); await fire('fake'); await sleep(550); await fireAll('real');
    await waitState('fox', 8000); mark('critic: ' + await line()); await sleep(1500);
    // ---- 7  epoch 2, VIRAL LAUNCH: a 429 strike freezes the requests
    await clearEpoch(1, ['hit', 'miss', 'hit', 'hit', 'hit', 'hit'], 3800); mark('epoch 2: storm intro'); // THE ADVERSARY TRAINED ON YOU, read in full
    await waitState('fly', 4000);
    if (await waitFor(() => window.__th.birds.some(b => b.frozen > 0), null, 4000)) { mark('429 strike: requests frozen'); await sleep(700); }
    await fireAll('real', {}, 6); await waitState('fox', 8000); mark('critic: ' + await line()); await sleep(1100);
    // ---- 7b  the adversary's first trained fake passes for a real request for the player's own reaction time: serve it
    if (await waitFor(() => window.__th.state === 'fly' && window.__th.birds.some(b => b.bad && b.adv && b.st === 'fly'), null, 9000)) {
      mark('trained fake: ' + JSON.stringify(await G(() => { const h = window.__th.birds.find(b => b.bad && b.adv); return { tier: h.tier, hide: h.hide, at: h.at }; })));
      await sleep(120); await fire('fake', { steps: 6, gain: 0.5 }); // fooled: the game holds and rewinds the trap (taps would skip it)
      if (await waitFor(() => { const g = window.__th.gotcha; return !g || !(g.t < g.end); }, null, 6000)) mark('rewind played'); await sleep(500); await fireAll('real');
      await waitState('fox', 8000); mark('critic: ' + await line()); await sleep(1500); } else mark('WARN no trained fake in epoch 2');
    // ---- 8  epoch 3, ROGUE AGENTS LOOSE: stop three, one gets through
    await clearEpoch(2, ['hit', 'hit', 'miss', 'hit', 'hit', 'hit']); mark('epoch 3: swarm intro');
    await G(() => { const g = window.__th; g.wave = 3; g.tally = ['hit', 'hit', 'hit']; g.swarmDone = false; }); // the swarm arrives once 3 requests are in
    await waitFor(() => window.__th.state === 'fly' && window.__th.swarm && !window.__th.swarm.boss, null, 6000); mark('swarm');
    await sleep(1200);
    for (let i = 0; i < 3; i++) { await waitFor(() => { const a = window.__th.birds.filter(b => b.st === 'fly' && b.agent); return a.length && Math.max(...a.map(b => b.y)) > 30; }, null, 3000); await fire('agent', { steps: 5, gain: 0.6 }); await sleep(380); }
    await waitState('fox', 8000); mark('critic: ' + await line()); await sleep(1100);
    // ---- 9  epoch 4, the DDoS boss fight, to the kill
    await clearEpoch(3, ['hit', 'hit', 'miss', 'hit', 'hit', 'hit']); mark('epoch 4: boss intro');
    await G(() => { const g = window.__th; g.wave = 2; g.tally = ['hit', 'hit']; g.bossDone = false; }); // the boss arrives once 2 requests are in
    await waitFor(() => window.__th.birds.some(b => b.boss && b.st === 'fly'), null, 9000); mark('DDoS boss');
    await waitFor(() => { const b = window.__th.birds.find(b => b.boss); return b && b.x + 24 > 24 && b.x + 24 < 232; }, null, 6000);
    for (let i = 0, t = Date.now(); i < 60 && Date.now() - t < 16000; i++) {
      const s = await G(() => { const g = window.__th, b = g.birds.find(b => b.boss && b.st === 'fly'), a = g.birds.filter(b => b.agent && b.st === 'fly'); return { boss: !!b, hp: b ? b.hp : 0, agents: a.length, low: a.length ? Math.max(...a.map(x => x.y)) : -1, shots: g.shots }; });
      if ((!s.boss && !s.agents) || s.shots <= 0) break;
      if (s.boss && !(s.agents && s.low > 105) && await G(() => { const b = window.__th.birds.find(b => b.boss && b.st === 'fly'); return b && (b.enter || ((b.fw || 0) % 60) >= window.__fw.open - 9); })) { await sleep(90); i--; continue; } // wait out the IP rotation
      { const k = s.agents && (s.low > 105 || !s.boss) ? 'agent' : 'boss'; await fire(k, k === 'boss' ? { steps: 2, gain: 0.9 } : { steps: 4, gain: 0.7 }); await sleep(k === 'boss' ? 80 : 200); } // rapid fire into each opening
    }
    await waitState('fox', 10000); mark('boss down. critic: ' + await line()); await sleep(1500);
    // ---- 10  OUT OF MEMORY: receipt and roast
    await G(() => { const g = window.__th; g.round = 4; g.wave = 6; g.tally = ['hit', 'hit', 'miss', 'miss', 'miss', 'miss']; g.state = 'fox'; g.fox.t = 109; g.fox.mode = 'miss'; g.fox.line = 'TRY REPHRASING YOUR REQUEST.'; g.birds = []; g.linger = null; g.swarm = null; });
    await waitState('gameOver', 4000); mark('game over. roast: ' + await line()); await sleep(4200); // jingle, receipt, roast, NEW BEST
    // ---- 11  the share card, held for 4 s
    mark('share card'); await page.click('#share');
    if (!await waitFor(() => { const b = document.getElementById('cardbox'), i = document.getElementById('cardimg'); return !b.hidden && i.complete && i.naturalWidth > 0; }, null, 4000)) mark('WARN share card did not open');
    await sleep(250); still = await G(() => window.__cap.closer()); await sleep(3800);
    mark('end');
  } finally {
    result = await G(() => window.__cap.stop()); await G(() => window.__cap.drain()); out.end(); await new Promise(r => out.on('finish', r));
    console.log('game state at the end:', JSON.stringify(await G(() => { const g = window.__th; return { state: g.state, round: g.round, score: g.score, net: g.score - g.cost, muted: localStorage.getItem('th.muted'), governed: window.__crt().governed, run: g.run }; })));
    await browser.close();
  }
  if (still) fs.writeFileSync(STILL, Buffer.from(still, 'base64'));
  fs.writeFileSync(META, JSON.stringify({ ...result, still: !!still, crt: CRT, seed: SEED }));
  console.log('recorder:', JSON.stringify(result), 'webm', (fs.statSync(WEBM).size / 1e6).toFixed(1) + ' MB');
  console.log('frame pacing (rAF): p50 ' + result.p50.toFixed(1) + ' ms, p95 ' + result.p95.toFixed(1) + ' ms, max ' + result.max.toFixed(0) + ' ms, ' + result.slow + ' of ' + result.n + ' frames over 25 ms');
}

function encode() {
  const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
  const cad = cadence(WEBM); console.log('captured video: ' + cad.fps.toFixed(0) + ' frames/s, longest gap ' + cad.max.toFixed(0) + ' ms, ' + cad.repeat.toFixed(1) + '% of the 30 fps output frames repeat the previous one');
  const raw = volume(WEBM); console.log('captured audio (raw): mean_volume ' + raw.mean + ' dB, max_volume ' + raw.max + ' dB');
  if (!(raw.mean > -50)) { console.error('AUDIO CAPTURE IS SILENT (mean ' + raw.mean + ' dB, max ' + raw.max + ' dB). Not writing an mp4: ' + WEBM + ' kept for inspection.'); process.exit(3); }
  const gain = NORMALIZE ? Math.max(0, Math.min(12, -3 - raw.max)) : 0; // a pure gain that puts the loudest peak at -3 dBFS (AAC can overshoot its input by ~1 dB)
  const lay = meta.still && meta.tCard != null;
  const tOn = lay ? Math.max(0, meta.tCard - 0.05) : 0; // the sharp card goes on a frame or so early rather than late (late would show the 512x480 card for a moment)
  const vf = '[0:v]fps=30,scale=1024:960:flags=neighbor,format=yuv420p[b];' + (lay ? '[1:v]format=yuv420p[c];[b][c]overlay=0:0:enable=\'gte(t,' + tOn.toFixed(3) + ')\':shortest=1[v]' : '[b]null[v]');
  ff(['-y', '-i', WEBM].concat(lay ? ['-loop', '1', '-framerate', '30', '-i', STILL] : [], ['-filter_complex', vf, '-map', '[v]', '-map', '0:a',
    '-af', 'aresample=async=1:first_pts=0' + (gain > 0.05 ? ',volume=' + gain.toFixed(2) + 'dB' : ''),
    '-c:v', 'libx264', '-preset', PRESET, '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', OUT]));
  const probe = JSON.parse(ff(['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,duration:format=duration,size', '-of', 'json', OUT], 'ffprobe'));
  const fin = volume(OUT);
  console.log('dist/trailer.mp4:', JSON.stringify(probe.streams.map(s => s.codec_type === 'video' ? s.codec_name + ' ' + s.width + 'x' + s.height + ' ' + s.r_frame_rate : s.codec_name)), (+probe.format.duration).toFixed(2) + ' s', (probe.format.size / 1e6).toFixed(1) + ' MB');
  console.log('final audio: mean_volume ' + fin.mean + ' dB, max_volume ' + fin.max + ' dB' + (gain > 0.05 ? ' (peak gain +' + gain.toFixed(1) + ' dB applied)' : ''));
  if (!probe.streams.some(s => s.codec_type === 'audio') || !(fin.mean > -50)) { console.error('FINAL MP4 HAS NO USABLE AUDIO'); process.exit(3); }
  if (!KEEP) fs.rmSync(TMP, { recursive: true, force: true });
}

(async () => {
  for (const f of ['dist/index.html']) if (!fs.existsSync(path.join(ROOT, f))) throw new Error('missing ' + f + ' (run python3 build.py)');
  if (process.env.ENCODE_ONLY !== '1') await record();
  encode();
})().catch(e => { console.error(e); process.exit(1); });
