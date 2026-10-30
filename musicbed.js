// Records a music-only bed for the sizzle cut: the game's own chiptune with every layer up (arp, drums, storm, boss), no SFX.
// Usage: node musicbed.js out.webm [seconds]   -> webm (opus) of the game's music bus only
const { chromium, launchOpts } = require('./pw'); const path = require('path'); const fs = require('fs');
const OUT = process.argv[2] || 'video_tmp/musicbed.webm', SECS = +(process.argv[3] || 46);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ ...launchOpts, args: ['--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const p = await (await b.newContext({ viewport: { width: 800, height: 760 } })).newPage();
  await p.addInitScript(() => { try { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); } catch (e) {} });
  const chunks = []; await p.exposeFunction('__mbChunk', b64 => chunks.push(Buffer.from(b64, 'base64')));
  await p.goto('file://' + path.join(__dirname, 'dist/index.html')); await sleep(400);
  const box = await (await p.$('#g')).boundingBox(); await p.mouse.click(box.x + 128 * box.width / 256, box.y + 30 * box.height / 240); await sleep(300); // a real click builds the AudioContext
  await p.mouse.click(box.x + 128 * box.width / 256, box.y + 100 * box.height / 240); await sleep(200); // start a run: the music starts when the boot ends
  await p.evaluate(async () => { const G = window.__th; for (let i = 0; i < 300 && G.state !== 'intro' && G.state !== 'fly'; i++) { if (G.state === 'boot') G.boot.t = 999; await new Promise(r => requestAnimationFrame(r)); } });
  const info = await p.evaluate(async (secs) => {
    const G = window.__th, n = window.__audioNodes(); const { ac } = n; if (ac.state !== 'running') await ac.resume();
    // the music bus only: tap it, and silence the SFX and voice buses
    n.sfx.gain.value = 0; n.voice.gain.value = 0; const BUSN = n.music;
    G.state = 'fly'; G.combo = 9; G.freeze = 1e9; G.birds = [{ boss: true, st: 'fly', x: -200, y: -200, vx: 0, vy: 0, hp: 9, fw: 0 }]; G.wx = Object.assign({}, G.wx, { storm: true });
    return { hasBus: !!BUSN, state: ac.state };
  }, SECS);
  console.log('setup', JSON.stringify(info));
  await p.evaluate(async (secs) => {
    const n = window.__audioNodes(), ac = n.ac; const dest = ac.createMediaStreamDestination(); n.comp.connect(dest);
    const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
    const b64 = blob => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result.slice(fr.result.indexOf(';base64,') + 8)); fr.readAsDataURL(blob); });
    const parts = []; rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
    rec.start(1000);
    await new Promise(r => setTimeout(r, secs * 1000)); const done = new Promise(r => rec.addEventListener('stop', r, { once: true })); rec.stop(); await done;
    for (const x of parts) await window.__mbChunk(await b64(x));
  }, SECS);
  fs.writeFileSync(OUT, Buffer.concat(chunks)); console.log('music bed', OUT, (fs.statSync(OUT).size / 1e3).toFixed(0) + ' kB');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
