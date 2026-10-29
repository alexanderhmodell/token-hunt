# Token Hunt — elite pass (v3) execution brief

For a cold Claude Opus session. Read this file, `PLAN.md` §3 (architecture) and §4 (guardrails), and `game_body.html` in full before writing code.

## 0. The rule that overrides everything

**`main` is the submission.** v2.8 on `main` ships Thu Oct 29 by 1 PM ET no matter what happens here. All elite work happens on branch `elite`. Never push to `main`. The lead session merges `elite` into `main` only if every gate in §5 passes by **Thu 11:00 AM ET**; otherwise `elite` waits for after the hackathon. Commit after every item with a change-log line; push the branch after every item so nothing is lost.

Commit trailer (use exactly):
```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01By4qdYUXYenybRd6ToezpS
```
Set `git config user.name Claude` and `git config user.email noreply@anthropic.com` in the worktree first.

## 1. What "elite" means here

The game already works and is tested. The gap to a top-3 entry is not features; it is **perceived production value per second of video** and **engineering a judge can see**. Every item below is chosen because it is (a) visible in a 60-second video or the first 90 seconds of play, or (b) the infrastructure that makes (a) safe. Principles, in priority order:

1. **Determinism first.** One seeded RNG drives all simulation; rendering may use its own. Same seed + same inputs = same run, bit for bit. This unlocks replays, ghost runs, reproducible bug reports, and replay-based tests.
2. **Fixed-step simulation, interpolated rendering.** Sim stays 60 Hz; render interpolates positions by the accumulator alpha so 120 Hz ProMotion phones look buttery and 30 Hz phones don't stutter.
3. **Juice is a system, not sprinkles.** Easing curves, squash-and-stretch, hit-stop, trauma-based screen shake (shake = trauma², trauma decays), and layered feedback on every hit. Each event gets sound + motion + light + text, tuned together.
4. **The character is the product.** The chatbot must speak, emote, and react with timing. Voice, mouth-flap, eyebrows, and an entrance with anticipation and overshoot.
5. **Audio is mixed, not summed.** A master bus with a compressor, a music bus that ducks under hits (sidechain), stereo position by screen x, and music that layers up with intensity.
6. **Zero-dependency stays true.** No libraries, no network, no asset files. Everything new is code: WebGL shaders as strings, speech via the browser's built-in `speechSynthesis`, audio via Web Audio. Every new system degrades gracefully when the API is missing.
7. **Every system ships with a test.** Extend `stress.js`/`stress2.js`/`verify_v25.js` or add `elite_test.js`. The suite must stay green on every commit.
8. **No IP.** Never use NVIDIA/DGX/H100/Blackwell or any vendor mark in art or text. Generic "GPU" only. `build.py`'s FORBIDDEN list stays; add `nvidia`, `dgx`, `h100`, `geforce`, `rtx` to it in E0.

## 2. Tier 1 — video-visible (do in order)

### E0 — Determinism + replay core (≈60 min)
- Route every simulation random through `G.rng` (today some spawns use it; `rnd()` in fx and lightning still uses `Math.random`). Split into `simRng` (seeded per run: daily seed or a fresh 32-bit seed stored on `G.seed`) and `fxRng` (cosmetic only: particles, shake jitter, chirp pitch).
- Record inputs as `[frame, type, x, y]` (pointerdown in logical coords, key codes) into `G.rec`. The sim must consume inputs only on frame boundaries.
- `replay(seed, rec)` resets state and feeds inputs at their frames; draw normally. Expose `window.__replay`.
- Game-over panel gets **WATCH REPLAY** (plays your last run at 2× with a REPLAY badge; tap to exit).
- Test: record a 60 s aimbot run, replay it headlessly, assert identical final score, tally, round, and run stats. Run it 3× to prove stability.

### E1 — WebGL CRT post-process (≈75 min)
- Render the 256×240 game canvas as a texture into a fullscreen WebGL quad. Fragment shader: barrel distortion (k≈0.08), RGB mask / aperture grille, scanlines with brightness-dependent thickness, mild chromatic aberration (0.6 px), bloom (two-pass separable blur at quarter res, add 0.25), vignette, phosphor persistence (blend 15% of the previous frame), subtle noise. Integer-scaled source, `NEAREST` sampling before the shader.
- The existing CSS scanline overlay is removed when WebGL runs; kept as the fallback.
- `prefers-reduced-motion` and a new **CRT ON/OFF** toggle (key `C`, and a third HUD icon) disable it. Fall back to 2D on context loss or no WebGL. Handle `webglcontextlost` / `restored`.
- Perf budget: ≤ 3 ms GPU per frame at 1024×960 on integrated graphics; measure with `EXT_disjoint_timer_query` when available, otherwise frame time.
- Test: screenshot with CRT on and off; assert both render non-blank and differ; assert fallback path when `getContext('webgl')` is stubbed to null.

### E2 — The bot speaks (≈60 min)
- `speechSynthesis` reads each critic line: pick a local voice (prefer names containing "Google", "Samantha", "Daniel", or any `localService:true`), `pitch 1.4`, `rate 1.15`, `volume` tied to the master mute. Cancel on skip/next line. If no voices or the API is missing, keep the chirp typewriter.
- **Mouth flap:** add 2 mouth frames per critic sprite (open/closed) in `sprites.py` for bot and fox; flap on `boundary` events from the utterance, or every 4 frames while the typewriter runs when speech is unavailable.
- **Entrance with anticipation:** critic dips 3 px before rising, overshoots 4 px, settles (ease-out-back). Exit ease-in. Eyebrow/eye change on hit vs miss vs roast.
- Voice is **on by default only after the first user gesture** and is toggled by the mute icon together with audio.
- Test: stub `speechSynthesis` and assert `speak` is called once per line with the line text; assert cancel on skip.

### E3 — Mixed, adaptive audio (≈60 min)
- Buses: `master → DynamicsCompressor(threshold −18, ratio 4)`, `musicBus`, `sfxBus`, `voiceBus`. Music ducks −8 dB for 180 ms on every hit and on speech start (sidechain via gain automation).
- `StereoPannerNode` on each SFX by screen x (−0.8…0.8).
- **Vertical layering:** base loop always; add an arpeggio layer at combo ≥ 3, a drum layer at combo ≥ 6, and a sub-bass + faster hats layer in storm/autoscale. Layers fade in over one bar on the beat grid (quantize changes to the next bar).
- Test: assert node graph exists and layer gains change when combo crosses thresholds (read `gain.value` after a forced combo).

### E4 — Feel: interpolation, trauma shake, squash & stretch (≈60 min)
- Store `px,py` (previous positions) each sim step; render at `lerp(prev, cur, alpha)`.
- Replace `G.shake` with `G.trauma` (0..1). Offset = maxShake · trauma² · noise(t); trauma decays 1.6/s. Hit adds 0.25, frontier 0.4, breach 0.6, lightning 0.5.
- Requests: wing-flap squash (scaleY 0.9 on downstroke), hit = 3-frame white flash + 1.3× scale pop + spin while falling. Agents: jitter and a red trail. Score pops ease-out-cubic upward and fade.
- Test: run 600 frames headless with a forced 120 Hz rAF (override `requestAnimationFrame` timing) and assert positions rendered between sim steps differ (interpolation active) and no NaN.

## 3. Tier 2 — depth (only after Tier 1 is green and pushed)

- **E5 DDoS boss** every 4th epoch: a 48×40 sprite that crosses slowly, takes 6 hits, and splits into a rogue swarm on each 2nd hit; health bar; unique music layer; bot dialogue before and after.
- **E6 Flow-channel difficulty:** rolling accuracy over the last 8 waves; nudge speed ±6% and hallucination rate ±1/20 to hold 65–75% success on Easy/Medium (off on Hard and Daily, which must stay fair and comparable).
- **E7 CI:** `.github/workflows/test.yml` runs `build.py`, `test.js`, `verify_v25.js`, `stress.js`, `stress2.js`, `elite_test.js` on push with the Playwright image; add the badge to README. Vercel deploys `main` only, so a red build never ships.
- **E8 Visual regression:** golden screenshots of 8 canonical states at fixed seeds; pixel-diff with a 0.5% tolerance; update with `--update-goldens`.
- **E9 Accessibility:** color-independent cues (hallucination already flickers; add a dashed outline), on-screen captions for SFX in a corner when muted, one-hand mode (tap anywhere on the bottom third to fire at the crosshair which auto-tracks the nearest target slowly) behind a toggle.

## 4. Things not to do

No libraries, no build tooling beyond `build.py`, no multi-file split, no service worker in the artifact build, no network calls, no LLM endpoint, no monetization, no vendor marks, no changes to `main`.

## 5. Merge gates (lead session checks these)

1. `python3 build.py` clean (FORBIDDEN list extended).
2. `test.js`, `verify_v25.js`, `stress.js`, `stress2.js`, `elite_test.js`: all pass, zero page errors.
3. Replay determinism test passes 3/3.
4. Average frame time in headless ≤ 16.7 ms with CRT on; 2D fallback works with WebGL stubbed off.
5. Phone emulation: thumb-on-sprite hits 12/12; no horizontal overflow; first serve ≤ 3 s after boot skip.
6. A fresh 3-judge panel scores the `elite` build ≥ the `main` build on every judge's overall.
7. File size ≤ 160 KB.

## 6. Report back

When Tier 1 is done (or at 9:00 AM ET Thu, whichever first), stop, push `elite`, and report: items done, test results verbatim, frame-time numbers, anything cut and why, and the exact commit SHA to merge.
