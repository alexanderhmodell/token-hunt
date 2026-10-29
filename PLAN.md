# Token Hunt — v2 implementation plan

Written for a Claude session (Fable or Opus) to execute cold. Everything needed is in this folder. Read this file top to bottom before touching code.

---

## ---STATUS-CHECK---

- **Project:** Token Hunt (hackathon game). Working title history: Fowl Weather v1.0 → Token Hunt v1.1.
- **Phase:** v2 feature build. v1.1 is published and playable; nothing below is required for a valid submission.
- **Last step:** v2.9 shipped on `main` (cold panel #2 fixes; suite green). Elite pass delegated on branch `elite`.
- **Next step:** Alex: Vercel import (if not done), Gate 0 playtest of v2.3, record, submit. Any tuning from the playtest → v2.4. Phase B only after submission.
- **Hard deadline:** Thu Oct 29, 2026, 5:00 PM ET. Alex still has to host, record a 60–90 s video, and submit, so **the last v2 publish must land by Thu 12:00 PM ET.** Whatever is published at that moment ships.
- **Blockers:** none for CP1. **Gate 0 (section 1a) must be satisfied before CP2 starts.**
- **Open decisions for Alex:** (a) what "finn" and "vcc" refer to — both are readable in the shipped source by anyone, so change them if either names a person or entity you'd rather not expose; (b) license (MIT suggested).

---

## 1. Goal, non-goals, cut line

**Goal:** a submission a judge enjoys in the first 90 seconds of video or play. Every Phase A item is visible inside that window or is required by one that is.

**Non-goals for Phase A:** monetization-style retention loops (energy, streak guilt, gacha), public leaderboards, backend of any kind, 3D, engines, asset files, anything that adds a second screen.

**Cut line:** if a checkpoint slips, cut in this order: A12 → A11 → A10 → A1b/A2 (duck skin + codes; Alex asked for them but no judge sees them) → A6 → A5 → A4. Never cut A1a, A3, A7, A8, A9. **Hard stop: whatever is published at Thu 12:00 PM ET ships.**

**The ordering rule:** build what a judge sees in the first 90 seconds of video or play first; everything else after, and only if the clock allows. This is why the theme refactor and the codes (which Alex asked for, and which ship) come *after* the feel and mechanics work, not before.

---

## 1a. Gate 0 — human playtest (blocks CP2, not CP1)

The game has never been played by a person. The headless harness proves the state machine; it proves nothing about feel. **Before CP2 begins**, Alex plays the current published build for ten minutes on a phone AND on a laptop and answers these in the chat (one line each is fine):

1. Does sound start on the first tap? Is the gunshot too loud relative to the music?
2. Is the hitbox fair? (Did a shot that looked like a hit miss, or vice versa?)
3. Is epoch 1 fun or tedious? Too slow / too fast?
4. Does the bot's bubble stay up long enough to read on a phone?
5. On touch, does your finger hide the request? Would an offset crosshair help?
6. Anything ugly, confusing, or that made you stop?

The executing session turns the answers into a `TUNING` list at the top of CP2 and applies them before any CP2 feature. **If no answers arrive by the time CP1 is published, do not wait.** Run the agent self-review below, record its results as the TUNING list, and continue.

**Gate 0 fallback — agent self-review (no human available):**
- Record a 30 s headless playthrough (Playwright `recordVideo`, 1024×960) and view 6–8 extracted frames (`ffmpeg -i out.webm -vf fps=0.25 f%02d.png`). Look for: bubble unreadable, sprites clipped, HUD overlap, dead time > 2 s between waves.
- Hitbox: assert the hit test rectangle equals the sprite's opaque bounds ± 3 px for every flyer sprite (compute from `SPR` in a test, not by eye).
- Bubble dwell: assert the critic line is visible ≥ 75 frames (1.25 s) at the slowest difficulty; raise `fox` state length if not.
- Audio proportions: assert gunshot peak gain ≤ 2.2× the music lead gain in `SFX`/`music` constants (0.55 vs 0.06 today is too hot — set shot noise to 0.35).
- Touch: enable the offset crosshair (A7, "finger offset": on `pointerType==='touch'` draw and test the shot 18 px above the touch point) by default; a phone judge is likelier than a mouse judge to be annoyed.

**Judging criteria:** if Alex supplies the hackathon rubric at any point, stop, re-rank Phase A against it, note the re-rank in the change log, continue. Heuristics: a rubric that rewards *theme* → spend CP3 time on title/intro polish; *technical* → mention the zero-asset synthesized pipeline in the blurb and video; *fun* → bias toward A7/A8 tuning over new mechanics; *use of AI* → the disclosure line in A13 becomes the first sentence of the blurb.

---

## 1b. Alex's track (the critical path)

Only Alex can do these. Nothing in Phase A is on the critical path; these are.

| When | Task | Time |
|---|---|---|
| Tonight | Gate 0 playtest + answers (above) | 15 min |
| Tonight | Find the judging criteria / theme / host; paste the link | 2 min |
| Tonight | Decide on "finn" / "vcc" and the license | 2 min |
| Tonight | Say "push" so the repo goes to GitHub; import it at vercel.com/new (Framework: Other, Output Directory `dist`). From then on deploys are automatic. | 3 min |
| Thu 9:00 AM | Confirm the Vercel URL loads on your phone and sound starts on first tap. Optional: itch.io page too (slug check: `token-hunt`). | 5 min |
| Thu 9:15 AM | Record the 60–90 s video per SUBMISSION.md, with audio captured | 20 min |
| Thu by 1:00 PM | Submit (form + video + link) | 10 min |
| Thu 1:00–5:00 PM | Buffer. If a later checkpoint publishes, re-upload index.html (5 min). Re-record only if a visible feature changed. | — |

Host and record off whatever is published at 9 AM. Do not wait for a later checkpoint.

---

## 1c. Zero-touch mode — defaults for every decision, fallbacks for every human task

If Alex is unreachable, the executing session makes these calls without asking. None is irreversible.

| Decision / task | Default |
|---|---|
| Judging criteria unknown | Assume fun + polish + the AI wink. Build in checkpoint order as written. |
| "finn" / "vcc" | Keep as given. They are readable in source; accepted. |
| License | MIT, copyright Alex Modell 2026 (LICENSE file is in the repo; delete or replace). |
| Gate 0 playtest | Agent self-review above. |
| Hosting | **Vercel.** Preferred: push the repo to GitHub (`gh repo create token-hunt --public --source . --push`; outward-facing, needs one "yes" from Alex), then Alex imports it once at vercel.com/new (Framework: Other, Output Directory: `dist`). After that every commit auto-deploys to the same URL and no human step remains. Fallback: Alex drags a folder containing only `dist/index.html` onto vercel.com/new. The private claude.ai artifact stays the playtest link only. |
| Demo video | Agent fallback: scripted 75 s Playwright `recordVideo` playthrough (title → epoch 1 hits and a miss → forced storm via `__th` → round clear → game over), converted to MP4 with ffmpeg. **It is silent** (headless has no audio device); a 20-minute human screen recording with sound is strictly better. Ship the silent one only if Alex has not recorded by Thu 1 PM. |
| Submission form | Agent fallback: Claude in Chrome fills the itch.io project page and the hackathon form from SUBMISSION.md in Alex's signed-in browser, stops before the final Submit/Publish click. **Outward-facing: needs one "yes" and Chrome open with the extension.** |
| Blurb disclosure | Use the A13 wording verbatim. |
| Anything else | Pick the option that ships, note it in the change log. |

**Model/tier guidance:** run this as ONE session, sequentially. The whole game is a single HTML body; parallel subagents editing one file cost more in merge pain than they save. Opus or Fable for the session. Sonnet is fine for A4, A9, A10, A11, A13 if you must delegate, but only one editor at a time.

---

## 2. Pre-flight checklist

Run these before writing a line. All must pass.

```bash
cd token-hunt
python3 -c "import PIL; print('PIL ok')"
node --version                               # 22.x in the Anthropic cloud container
ls /opt/pw-browsers/chromium-*/chrome-linux64/chrome   # headless Chromium (container only)
python3 build.py                             # emits dist/artifact.html + dist/index.html; asserts no forbidden strings
mkdir -p shots && node test.js               # headless playtest; must end with "errors: none" (a CDN ERR_TUNNEL line is expected in the sandbox and is not an error)
```

- [ ] build.py passes (IP guard included)
- [ ] test.js runs through title → fly → hit → critic → miss → critic → storm → round clear → game over without a PAGEERROR
- [ ] You have read `game_body.html` fully once (≈400 lines) and `sprites.py`
- [ ] You know the artifact URL above; republish to it with `url` if in a new conversation, otherwise same `file_path`
- [ ] Git: `git log --oneline` shows the v1.1 commit; commit after every checkpoint

**Things the sandbox cannot verify** (say so in the handoff, never claim them tested): audio output, touch feel on a real phone, the Google-Fonts footer face (CDN blocked in sandbox, loads on the real web).

---

## 3. Architecture as it stands (v1.1)

| File | Role |
|---|---|
| `sprites.py` | Single source of truth for pixel art: `PALETTE` (letter → hex), `SPRITES` (name → rows of letters), `ICONS`, `FONT` (3×5), `BIG` (5×7 title face). `to_js()` emits them as JS consts. `check()` validates. |
| `game_body.html` | The whole game: `<title>`, `<style>`, markup, one IIFE `<script>`. Contains the literal `/*__SPRITES__*/` placeholder that build.py replaces. No `<html>/<head>/<body>` tags (the Artifact tool wraps it). |
| `build.py` | Injects sprites, writes `dist/artifact.html` (body only, for the Artifact tool) and `dist/index.html` (standalone with doctype/head, for itch.io/Vercel). Asserts forbidden strings are absent. |
| `test.js` | Playwright headless playtest. Drives the state machine via mouse events and `window.__th`, screenshots to `shots/`. |
| `preview_sprites.py` | Renders every sprite to `sprites_preview.png` at 6× for eyeballing. Run after any sprite change and LOOK at the image. |
| `legacy/` | Fowl Weather v1.0 source (sprites + body + built html). Needed for A1's duck skin. Reference only; never ship `legacy/` files. |
| `dist/SUBMISSION.md` | Blurb, hosting steps, video shot list. Update at the end. |

**Canvas:** 256×240 logical, scaled by CSS with `image-rendering: pixelated`. Sky 0–200, HUD 200–240. `GROUND=168` (floor line where the critic's feet sit), `FRONT=188` (front rack row / grass that the critic rises from behind).

**State machine (`G.state`):** `title → intro(130f) → fly → fox(110f) → gap(24f) → fly … → roundEnd(300f) → intro … | gameOver`. "fox" is the critic state (legacy name; the object is `G.fox`). `update()` runs at a fixed 60 Hz; `draw()` every rAF.

**Key functions:** `startGame`, `startWave`, `spawnBird`, `newDir`, `shoot(x,y)`, `updateBirds`, `endRound`, `nextRound`, `handleTap`, `update`, `draw*` (Sky, Scenery, GrassFront, Bird, Fox, Rain, Fx, HUD, Banner, Title, Crosshair, Mute). Text: `text`, `textS` (shadowed), `textC` (centered), `bigText` (title face). Sprites: `S[key]` canvases; `+'L'` = mirrored, `+'W'` = white silhouette (hit flash).

**Audio:** all Web Audio, created on first pointerdown. `SFX.*`, `music.start/stop` (64-step loop), `rainStart/rainStop`. Mute persisted at `th.muted`. High score at `th.hi`.

**Conventions to keep:** no external assets; only cdnjs/Google Fonts allowed and only for the footer font; no `alert/confirm/prompt` (sandbox returns null); no `<a download>`; every localStorage access in try/catch; `window.__th = G` stays exposed for tests; all colors in sprites via PALETTE letters; strings UPPERCASE (font is caps-only).

---

## 4. Guardrails (read twice)

**IP — never ship any of these, in either skin:** the strings "Duck Hunt", "Nintendo", "NES", "Zapper", "Famicom", "FLY AWAY"; a duck-silhouette tally with a red quota line; a pink/salmon miss flash; the critic holding your kill up by the feet; the critic rising-and-laughing-at-a-miss as its *only* reaction. `build.py` greps for the strings; the visual rules are on you. The duck skin is original art of a real animal in an original meadow. It is an homage to a genre, never to one game.

**Artifact sandbox:** `prompt()` returns null, so the mobile cheat-code entry must be a real DOM `<input>`. Clipboard write works only inside a click handler and may reject; fall back to selectable text. Device motion/gyro is refused; do not build on it.

**Do not:** add a framework, split into multiple files, introduce a build step beyond build.py, add a backend, or change the 256×240 canvas.

---

## 5. Phase A — ship by Thu 12:00 PM ET

**Execute in checkpoint order, not numeric order.** Item IDs are stable so cross-references hold. Each item: spec → touch points → acceptance → estimate (agent-minutes) → cut priority (1 = never cut).

### Checkpoint structure (judge-visible first)
- **CP1 — feel** (~1.5 h): A1a (T indirection, gpu only) → A3 (variety) → A9 (pause) → A7 (juice) → A8 (reactive critic). Publish **v2.0**, commit, send index.html. *This build alone is a better submission than v1.1; if everything after slips, ship it.*
- **Gate 0** (section 1a) resolves here: apply the TUNING list before CP2.
- **CP2 — mechanics** (~1.2 h): A4 (difficulty) → A5 (tiers + cost) → A6 (hallucinations). Publish **v2.1**, commit.
- **CP3 — Alex's asks** (~1.2 h): A1b (duck skin) → A2 (codes). Publish **v2.2**, commit.
- **CP4 — polish** (~35 min): A10 → A11 → A12 → A13 (docs, README, disclosure). Publish **v2.3**, commit, send index.html + SUBMISSION.md.
At each CP: `python3 build.py && node test.js`, look at `shots/sheet.png`, publish, commit with the change-log line.

---

### A1a — Theme indirection, gpu only  (cut priority 1, ~15 min)

**Spec.** Introduce `THEMES` and `let T = THEMES.gpu` with the exact shape under A1b, populated for `gpu` only. Move every fiction string, sprite key, level table, and CSS color the script hard-codes behind `T`. Add `applyTheme(id)` (sets `T`, the CSS vars, `canvas.style.background`, persists `th.theme`). `THEMES.duck` is a stub that throws if selected. Every later item reads through `T`, so A1b becomes data entry plus the meadow scenery port.

**Acceptance.** Pixel-identical to v1.1 after the refactor (diff two title screenshots with PIL). No bare sprite keys (`'bot'`, `'req0'`…) or fiction strings outside `THEMES`.

### A1b — Duck skin  (cut priority 3, ~45 min)

**Spec.** Two themes: `gpu` (Token Hunt, default) and `duck` (Fowl Weather). Switching is instant at any state (all sprites pre-baked at boot; draw functions resolve keys through `T` every frame).

**Sprites.** Merge `legacy/fowl_sprites.py` into `sprites.py`: one `PALETTE` (resolve the two `K`/`D` near-duplicates to the gpu values), one `SPRITES` dict with both sets (`bird0-2, fall → birdFall, gold0-2, goldFall, fox, foxLaugh` + existing `req0-2, fall, bot*`). Drop `paw`. Merge `BIG` to cover both titles (F O W L E A T H R + T O K E N H U). Run `preview_sprites.py` and look.

**Theme shape (implement exactly; A3–A8 add fields noted there):**
```js
const THEMES = {
  gpu: {
    id:'gpu', titleA:'TOKEN', titleB:'HUNT', titleColor:'#3cd0ff',
    tagline:['YOU ARE A GPU CLUSTER.','SERVE THE REQUESTS. SURVIVE THE LOAD.'],
    howto:['CLICK OR TAP TO SERVE','3 VRAM PER FLIGHT'],
    start:'TAP TO BOOT', restart:'TAP TO REBOOT',
    spr:{ fly:['req0','req1','req2'], flyHi:['fr0','fr1','fr2'], fall:'fall', fallHi:'frFall',
          critic:'bot', criticHappy:'botHappy', criticFlat:'botFlat' },
    ammoIcon:'vram',
    hud:{ ammo:'VRAM', served:'SERVED', need:'NEED', score:'TOKENS', round:'EPOCH', best:'BEST', cost:'COMPUTE' },
    levels:[ /* current LOADS, reordered per A3 */ ],
    banners:{ escaped:'504 TIMEOUT', escapedTint:'rgba(255,77,77,0.22)', clear:'EPOCH %R COMPLETE', survived:'%L SURVIVED',
              perfect:'99.9% UPTIME! +10000', over:'OUT OF MEMORY', overColor:'#ff4d4d', unit:'TOKENS' },
    boltLabel:'429',
    lines:{ /* see A8 */ },
    scenery:'datacenter',  // selects drawScenery/drawGrassFront variant
    css:{ cab:'#0a0a12', bezel:'#262238', accent:'#3cd0ff', glow:'rgba(138,92,245,.18)', canvasBg:'#2a6fd6' },
  },
  duck: {
    id:'duck', titleA:'FOWL', titleB:'WEATHER', titleColor:'#f0b22e',
    tagline:['SHOOT THE BIRDS.','BEAT THE WEATHER.'],
    howto:['CLICK OR TAP TO SHOOT','3 SHELLS PER FLIGHT'],
    start:'TAP TO START', restart:'TAP TO PLAY AGAIN',
    spr:{ fly:['bird0','bird1','bird2'], flyHi:['gold0','gold1','gold2'], fall:'birdFall', fallHi:'goldFall',
          critic:'fox', criticHappy:'foxLaugh', criticFlat:'fox' },
    ammoIcon:'shell',
    hud:{ ammo:'SHELLS', served:'HIT', need:'NEED', score:'SCORE', round:'ROUND', best:'TOP', cost:'SHELLS USED' },
    levels:[ CLEAR SKIES / BREEZY / STORM / RAIN / GUSTS / DUSK with the legacy sky/grass colors; tags '0 KNOTS','WIND FROM THE WEST','LIGHTNING','LOW VISIBILITY','SHIFTING WIND','GOLDEN HOUR' ],
    banners:{ escaped:'FLEW OFF', escapedTint:'rgba(90,110,160,0.28)', clear:'ROUND %R CLEAR', survived:'%L CONQUERED',
              perfect:'PERFECT!! +10000', over:'GAME OVER', overColor:'#f7f4e9', unit:'SCORE' },
    boltLabel:null,
    lines:{ /* see A8 */ },
    scenery:'meadow',
    css:{ cab:'#0b0a0f', bezel:'#2a2430', accent:'#f0b22e', glow:'rgba(60,188,252,.14)', canvasBg:'#3cbcfc' },
  }
};
```

**Duck-skin critic behavior (IP-deliberate):** the fox uses the SAME bubble-dialogue system as the bot. On a HIT the fox shows `foxLaugh` (read as a grin/cheer) with an approving line. On a MISS the fox shows neutral `fox` with a deadpan line. He never holds the bird. This inverts the famous beat on purpose; keep it that way.

**Scenery.** Port `drawScenery` + `drawGrassFront` from `legacy/fowl_weather_body.html` as `drawMeadow` / `drawMeadowFront`; current ones become `drawDatacenter` / `drawRackRow`. `draw()` picks by `T.scenery`. Dusk sun vs. status LED, rain colors, cloud colors come from `T.levels[i]`.

**CSS.** On theme switch set the five `--cab/--bezel/--accent/--glow` vars and `canvas.style.background` from `T.css`.

**Touch points.** `sprites.py` (merge), top of script (THEMES, `let T`), every `S[...]` and string literal in draw*/banner/HUD/title, `LOADS` → `T.levels`, `setWeather`, boot (read `th.theme`).

**Acceptance.** `__th.theme='duck'; applyTheme()` from the console mid-flight changes sprites, HUD labels, scenery and sky on the next frame with no error; `test.js` gets a `duck` pass that screenshots title + storm in the duck skin; build.py guard passes; `preview_sprites.py` image reviewed.

---

### A2 — Code entry (cheat) system  (cut priority 1, ~25 min)

**Spec.** A letter ring buffer (last 8 keydown letters, any state except when the hidden input has focus). After each key, test `endsWith` against the code table. Mobile: tapping the title logo 7 times within 4 s focuses a visually-hidden `<input id="code" inputmode="text" autocapitalize="off" autocomplete="off">` (1×1 px, opacity 0, NOT `display:none`) so the keyboard appears; its `input` event feeds the same buffer; blur after a match or 6 s idle.

| Code | Effect |
|---|---|
| `duck` | `applyTheme('duck')`, toast `SKIN: FOWL WEATHER` |
| `token` | `applyTheme('gpu')`, toast `SKIN: TOKEN HUNT` (was `gpu`; contains the P hotkey) |
| `finn`, `vcc` | toggle **assisted mode**: `G.assist=true`; score awards ×3; flyer speed ×0.75; ammo 5; critic line `ACCESS GRANTED. DON'T TELL THE JUDGES.`; HUD tag `ASSISTED 3X` at (120,229) replacing nothing (shift level name if needed); high score goes to `th.hiAssist` and the HUD BEST shows whichever applies; game-over panel reads `ASSISTED RUN` under the score. Session-only (not persisted). Typing again turns it off. |

**Toast.** `G.toast={txt,t}`: centered, y=180, 90 frames, shadowed text, drawn after HUD.

**Touch points.** keydown handler, new `codes()` fn, hidden input markup, `ptsFor`, `startWave` (ammo), `spawnBird` (speed), HUD, game-over panel, high-score save/load.

**Acceptance.** test.js types `d,u,c,k` via `page.keyboard.type('duck')` and asserts `__th.theme==='duck'`; types `finn` and asserts `__th.assist===true` and a hit awards 1500 at epoch 1; types `gpu` and asserts theme back. Codes are readable in source; that is accepted.

---

### A3 — Front-load the variety  (cut priority 1, ~15 min)

**Spec.** `EPOCH_LEN = 6` (was 10). Quota table `need(r)`: `[3,3,4,4,5,5,5,6]` then 6, before difficulty offset (A4). Reorder levels in BOTH themes so the storm is epoch 3: gpu `IDLE, TRAFFIC SPIKE, VIRAL LAUNCH, LATENCY, AUTOSCALE, MAINTENANCE`; duck `CLEAR SKIES, BREEZY, STORM, RAIN, GUSTS, DUSK`. Tally bar: 6 cells, keep 11 px pitch. Epoch 1 flyer speed ×0.85 (all difficulties). `flightT` limit unchanged.

**Acceptance.** A judge's first 90 s now covers ~1.5 epochs and the storm arrives at ~2:00. test.js round-clear injection updated to 6-slot tallies.

---

### A4 — Difficulty select  (cut priority 2, ~20 min)

**Spec.** Title screen shows `EASY  MEDIUM  HARD` at y=140 (shift the TAP TO START line to 160). Select by tap/click on the word, keys `1/2/3`, or `←/→`. Selected word in accent color with `>` `<` brackets. Persist `th.diff`. HUD shows `E`/`M`/`H` after the round label (`EPOCH 01 M`).

| | ammo | speed | need offset | doubles from | halluc rate (A6) | score mult |
|---|---|---|---|---|---|---|
| Easy | 4 | 0.85 | −1 (min 2) | epoch 3 @35% | 1/9 | ×1.0 |
| Medium | 3 | 1.0 | 0 | epoch 2 @35% | 1/7 | ×1.5 |
| Hard | 3 | 1.2 | +1 | epoch 1 @50% | 1/5 | ×2.0 |

Score mult applies at award time (stacks with assisted ×3 and tier value). Show `X1.5` beside the score label only when ≠1.

**Acceptance.** Selecting Hard then starting gives `__th.shots===3`, flyer `sp` ≈ 1.2× Medium, `need(1)===4`. Persisted across reload.

---

### A5 — Request tiers + compute cost  (cut priority 2, ~25 min)

**Spec.** Replace the gold/enterprise variant. Each real flyer has `tier:'lo'|'hi'`.

| tier | gpu name | duck name | p | value | speed | dirT | sprite |
|---|---|---|---|---|---|---|---|
| lo | OPEN-WEIGHT | MALLARD | 0.72 | 300 | ×0.85 | 30–70 | `T.spr.fly` (green stamp for gpu: recolor `C`→`E`, `c`→light green `#a9f0b5`; add palette letter `e`) |
| hi | FRONTIER | GOLDEN | 0.28 | 1000 | ×1.3 | 15–40 (jittery) | `T.spr.flyHi` (gpu: purple stamp `P`, wings `p`; duck: existing gold) |

Each shot costs **100** (`COST`), tracked as `G.cost`. `G.score` = gross revenue; display `NET = score − cost`, floored at 0 for the HUD. HUD right column: `TOKENS 001200` at y=213, `COMPUTE -000300` at y=221 (small, dim). Round-clear panel adds a line `NET +0900`. Title howto line 3 becomes `FRONTIER REQUESTS PAY 3X. THEY'RE FAST.` / duck `GOLDEN BIRDS PAY 3X. THEY'RE FAST.`

**Touch points.** `spawnBird`, `ptsFor`, `shoot` (cost), `drawBird` (sprite by tier), HUD, banners, sprites.py (gpu hi-tier variants `fr0-2`, `frFall`).

**Acceptance.** Over 200 spawns, hi-tier share within 0.22–0.34; a hi hit at epoch 1 Medium awards 1500 (1000 × 1.5); three shots add 300 to `__th.cost`.

---

### A6 — Hallucinations  (cut priority 2, ~25 min)

**Spec.** Per wave, with probability `hallucRate` (A4), spawn ONE extra flyer `{bad:true, tier:'lo'}` that does **not** count toward `G.wave` or the tally. Visual: alternate every 4 frames between the normal lo sprite and a `glitch` variant baked at boot (seeded RNG replaces 18% of non-transparent pixels with `R` or `K`); a garbled label (`??%#`, `#@!?`, cycling every 10 f) floats 6 px above it; movement is twitchier (`dirT` 10–25). Duck skin: same treatment, label `DECOY`, flicker between mallard and a flat wood recolor (`G,g→T`, `B,b→b`, `W→L`).

Serving it: `−500` revenue (score floors at 0), combo reset (A7), critic line `lines.hallucServed`, falls with a red `X` instead of the OK stamp (bake `fallBad`). Letting it escape: no penalty; critic prefers `lines.hallucEscaped` if nothing more important happened that wave.

**Acceptance.** Force `G.forceHalluc=true` in test, assert the extra flyer has `bad`, that serving it reduces score by 500 and does not push to the tally, and that `G.wave` is unchanged.

---

### A7 — Juice  (cut priority 2, ~25 min)

**Spec.**
- **Hit-stop:** on a hit set `G.freeze=3`; `update()` decrements and returns early while >0 (draw continues).
- **Shake:** miss shot 2, lo hit 4, hi hit 6, hallucination served 5 (already have `G.shake`).
- **Muzzle flash:** 2 frames; 8-point starburst 7 px around the crosshair in `#fff6c8`.
- **Score pop:** `textS` scale 2 for hi-tier and for ×2+ combos; drifts up 0.7 px/f.
- **Combo:** `G.combo` increments per served real request, resets on escape/hallucination. Multiplier = `combo<3?1 : combo<6?2 : 3`, applied at award. Show `X2`/`X3` at (160,205) with a 10-frame flash when it changes; hide at ×1.
- **Quota tick glow:** when `hits === need−1`, the gold tick blinks at 8 f.
- **Near miss:** `shoot()` records `G.lastShot={x,y}`; on escape, if any shot that wave landed within 24 px of a flyer's center, set `G.nearMiss=true` for the critic.

**Acceptance.** Visual on the contact sheet (muzzle flash frame, X2 label). Unit: after 3 consecutive hits `__th.combo===3` and the next award is doubled.

---

### A8 — Reactive critic dialogue  (cut priority 3, ~20 min)

**Spec.** Track `G.streak={hit:0,miss:0}` and `G.lastLine`. Selection priority (first match wins): `cheatFirst` → `hallucServed` → `nearMiss` → `miss3` (miss streak ≥3) → `hit3` (hit streak ≥3) → `hit2` (two served this wave) → `hit` → `hallucEscaped` → `miss`. Never repeat `G.lastLine` back-to-back. Lines live in `T.lines`; both themes need all keys. Keep every line ≤ 36 chars (fits the bubble at 256 wide).

gpu:
- hit: `GREAT QUESTION!` · `HAPPY TO HELP!` · `CERTAINLY! HERE IS YOUR ANSWER.` · `I HOPE THIS HELPS!`
- hit2: `BATCHED. VERY EFFICIENT.` · `TWO AT ONCE? IMPRESSIVE.`
- hit3: `YOU ARE ON A STREAK. NOTED.` · `I HAVE UPDATED MY WEIGHTS.`
- miss: `AS AN AI, I CAN'T HELP WITH THAT.` · `TRY REPHRASING YOUR REQUEST.` · `THAT IS OUTSIDE MY TRAINING DATA.`
- miss3: `LET'S TRY A SIMPLER QUESTION.` · `HAVE YOU CONSIDERED EASY MODE?`
- nearMiss: `SO CLOSE. I FELT THAT.` · `OFF BY ONE. CLASSIC.`
- hallucServed: `I APOLOGIZE. THAT WAS INCORRECT.` · `YOU SERVED A HALLUCINATION.`
- hallucEscaped: `GOOD CALL. THAT ONE WAS MADE UP.`
- perfect: `99.9% UPTIME. I AM IMPRESSED.`
- over: `HAVE YOU TRIED TURNING IT OFF AND ON?` · `CONSIDER UPGRADING YOUR PLAN.` · `YOUR SESSION HAS EXPIRED.`
- cheatFirst: `ACCESS GRANTED. DON'T TELL THE JUDGES.`
- tutorial: `TAP A REQUEST TO SERVE IT.`

duck:
- hit: `NICE SHOT.` · `DINNER.` · `YOU'RE GETTING THE HANG OF IT.`
- hit2: `TWO! SHOW-OFF.`
- hit3: `ALRIGHT, I'M IMPRESSED.`
- miss: `THE WIND TOOK THAT ONE.` · `SHOOTING AT CLOUDS AGAIN?` · `I SAW THAT.`
- miss3: `MAYBE TRY EASY MODE.`
- nearMiss: `A FEATHER. YOU GOT A FEATHER.`
- hallucServed: `THAT WAS A DECOY.`
- hallucEscaped: `GOOD EYE. WOODEN.`
- perfect: `NOT A SINGLE ONE GOT AWAY.`
- over: `THE BIRDS SEND THEIR REGARDS.` · `BETTER LUCK NEXT SEASON.`
- cheatFirst: `WELL, THAT'S CHEATING. CARRY ON.`
- tutorial: `TAP A BIRD.`

**Acceptance.** Force three misses in test and assert the critic line is one of `miss3`.

---

### A9 — Pause  (cut priority 1, ~15 min)

**Spec.** `G.paused`. Toggle with `P`, `Escape`, or tapping a pause icon at (229,2) 11×9 (left of mute; draw `||`). Only pausable in `intro/fly/fox/gap`. While paused: `update()` skips (keep `G.t` frozen), `draw()` adds `panel` with `PAUSED` / `TAP TO RESUME`; `music.stop(); rainStop()`; resume restarts both. Auto-pause on `visibilitychange` hidden and on `window blur`. Any tap on the canvas while paused resumes (do not fire a shot).

**Acceptance.** test.js presses `p`, waits 500 ms, asserts `__th.t` unchanged; presses `p` again, asserts it advances.

---

### A10 — Instant restart  (cut priority 3, ~10 min)

**Spec.** Game over: after 70 f, tap/Space/Enter calls `startGame()` directly with the current difficulty (skip title). A small `MENU` label at the panel's bottom-left (tap target 40×10) returns to the title.

---

### A11 — Brag line + copy  (cut priority 3, ~15 min)

**Spec.** On game over, reveal an HTML button under the canvas (`#brag`, styled like `.foot`, hidden otherwise): `COPY RESULT`. Text: `TOKEN HUNT · 847,000 TOKENS · EPOCH 7 · OUT OF MEMORY · <location.href>` (duck: `FOWL WEATHER · SCORE 12,500 · ROUND 7`). `navigator.clipboard.writeText` inside the click handler; on rejection, swap the button for a selectable `<div>` with the text. Toast `COPIED` on success.

---

### A12 — First-session tutorial  (cut priority 4, ~10 min)

**Spec.** First wave of a session only (`th.seen` flag): critic rises for 60 f before the wave with `lines.tutorial`, then the wave starts. Epoch 1 speed ×0.85 is already in A3.

---

### A13 — Tests, release, docs  (cut priority 1, ~30 min)

- Extend `test.js` with the acceptance checks above; keep the contact sheet (`shots/sheet.png`) and look at it before every publish.
- `build.py` guard stays; add `"hallucination"`-free check? No — that word is ours. Leave the list as is.
- Publish `dist/artifact.html` to the existing artifact URL. Send `dist/index.html` and `dist/SUBMISSION.md` to Alex.
- Update `SUBMISSION.md`: difficulty select, tiers + cost, hallucinations in the blurb; "there's an easter egg or two" (never list the codes); video shot list: add a hallucination serve and an X3 combo. Keep the itch tag advice.
- Add `README.md` (what it is, how to run: open index.html; how to build: `python3 build.py`; how to test; the two skins; "no assets, everything synthesized") and `LICENSE` (MIT, Alex Modell, 2026; already in the repo, keep unless Alex replaces it).
- **Disclosure line, verbatim, in the blurb and the itch page:** "Built by Claude (Anthropic) end to end — code, pixel art, and synthesized audio — designed, directed, and playtested by Alex Modell. No downloaded assets." It is the first sentence if the rubric scores use of AI, otherwise the last paragraph.
- Commit `v2.3` with the change log entry.

---

## 6. Phase B — after submission (do not start before Thu 5 PM)

In rough value order:
1. Top-5 initials table (3-letter entry on game over, per-browser), assisted runs marked ★.
2. Daily seed (same spawn pattern for everyone; seed from the date; `DAILY` toggle on title).
3. Prompt-injection request (gpu: red, `IGNORE PREVIOUS INSTRUCTIONS`; duck: a goose) — serving it steals one ammo for the epoch.
4. Cache-hit: same tier twice in a row → next shot free.
5. Handheld mode: 4-shade green palette toggle (`gb` code), sprite flicker >8 per line.
6. Shared leaderboard via the artifact `db` capability (needs moderation; only if the game gets traction).
7. Datacenter meta-layer (spend tokens between epochs on racks) — this is the v3 "product" direction, not hackathon work.

---

## 7. Change log

- **v1.0 (Oct 27)** Fowl Weather. Canvas engine, mallard/fox, 6 weathers, synthesized audio, CRT. Published.
- **v1.1 (Oct 28)** Token Hunt reskin: request packets, chatbot critic with dialogue, datacenter scenery, load levels, VRAM/SERVED/TOKENS HUD. IP flags cleared (no silhouettes, no pink flash, no hold-the-kill, no "NES"). Published.
- **v2.0 (Oct 28, CP1 — published)** theme indirection (`THEMES`/`T`/`applyTheme`, gpu only), 6-request epochs with VIRAL LAUNCH at epoch 3, epoch-1 speed ×0.85, pause (P/Esc/icon/blur/hidden tab), hit-stop, scaled shake, muzzle flash, combo ×2/×3, quota-tick glow, near-miss detection, streak-aware critic lines, touch aim lifted 18 px, gunshot gain 0.55→0.35. Gate 0 fallback items applied: touch offset, shot gain. Still open from Gate 0: hitbox-vs-sprite assertion, bubble dwell assertion, recorded-playthrough review.
- **v2.1 (Oct 28, CP2 — published)** Gate 0 fallback: hitbox margin verified (+3..+6 px), bubble dwell 76 f. Easy/Medium/Hard on the title (keys 1/2/3, arrows, tap; persisted; HUD tag + score mult), open-weight/frontier tiers (green/purple, 300/1000, ×0.85/×1.3 speed) with ×100 compute cost per shot and NET on panels, hallucinations (1/9–1/5 by difficulty, glitch flicker + garbled label, −500 if served, never tallied), `wrong` SFX, `<` `=` glyphs. Title copy shortened; title critic moved to x=214.
- **v2.3 (Oct 28, CP3+CP4 — published)** Duck skin (Fowl Weather: mallard/gold tiers, wooden decoy as the hallucination, fox critic with bubble dialogue and no catch pose, meadow scenery, weather levels, storm at round 3). Codes: `duck`, `token`, `finn`, `vcc` via keyboard buffer or 7 logo taps → hidden input; assisted mode (×3, 5 ammo, ×0.75 speed, separate best, "ASSISTED RUN" on panels). Instant restart + MENU label. Brag line with clipboard + fallback. First-session tutorial bubble. BIOS boot crawl (tap to skip after 40 f). Attract mode after 9 s idle (AI aims with error; any tap exits; never saves scores). Bot voice chirps as bubble text types in. OG image + meta tags (`dist/og.png`, relative og:image). Fixed: code `gpu` renamed `token` because P is the pause hotkey.
- **v2.4 (Oct 28, stress test — published)** Headless battery `stress.js` (click spam, pause spam, 40 mid-flight skin flips, assisted toggles, 30-viewport resize storm, 60 s attract run, 30 epochs per skin with invariants, exact cost accounting, localStorage-blocked boot, hot-reload snapshot, frame budget, forbidden strings): ALL PASS. Real-browser pass in Alex's Chrome (macOS, DPR 2): renders at 2× integer scale, Press Start 2P loads, **AudioContext `running` + music on after first click**, 60 fps over a 20 s scripted play session, zero console errors, phone width (400 px) no overflow, touch aim offset verified (y 100 → 82), pause/resume with music stop/start, codes via keyboard. Bugs found and fixed: (1) title kept the demo's HUD after exiting attract mode; (2) logo taps started the game so the 7-tap mobile code entry was unreachable — logo band (y<70) now only counts taps; (3) skin switch on the title left the previous skin's level name/footer. Demo AI aim tightened (±4 px, lead on velocity).
- **v2.5 (Oct 28, stress pass 2 — published)** `stress2.js`: Chromium iPhone-13 touch emulation (real touch events: tap-to-start, lifted aim hits, 7 logo taps open code entry, pause/mute tap targets), 3000-key keyboard fuzz across all states, 1500 random-state draw fuzz + 200 clicks, blur/focus/visibility cycling, keyboard start/restart paths, 150 s aimbot run (reached epoch 8, all 6 loads, 17 doubles, 5 hallucinations, 7 perfects, combo 34, zero errors). Bugs found and fixed: (1) Space/Enter on the title no longer started the game after the logo-band change; (2) restart from game over replayed the BIOS crawl every time — now straight to epoch 1; (3) a hallucination kept circling for up to 7 s after the real request was served — hallucinations leave as soon as no real request is airborne; (4) that early exit tripped the 504 TIMEOUT banner/tint on a won wave — banner ignores hallucinations; (5) attract mode returned to the title after clearing epoch 1 and never showed the storm — demo now plays through epoch 3; (6) one shot could hit two overlapping flyers (a hallucination crossing your target cost you 500) — a shot hits only the nearest; (7) glitch tag used '@', which has no glyph; (8) first intro shortened to 95 f (first serve ≈3 s after boot skip); (9) iOS audio unlock added on pointerup/click (iOS does not count pointerdown as a gesture); (10) attract auto-resumes when the tab returns, real play stays paused.
- **v2.6 (Oct 28, hardening — published)** quota never demands a perfect epoch; key auto-repeat ignored; right/middle mouse and non-primary touches don't fire; score popups clamped on screen; reduced-motion disables shake; PointerEvent fallback for old browsers; verifier (`verify_v25.js`) confirms each fix in the shipped file.
- **v2.7 (Oct 28, simulated panel → amendments)** Three independent judge agents (indie designer, AI-tools organizer, casual phone player) scored v2.6 at 6/10 each with convergent findings. Changes: **pacing** — critic dwell 110→78 f and tap-skippable after 36 f, gap 24→12, intro 130→90 (70 in epoch 1, tap-skippable), tutorial 70→60, round-clear auto-advance 300→200 and tappable after 40, boot skippable after 10 f; **tension** — NEED [3,4,4,5,5,5…] capped at 5, Medium/Hard lose the epoch-1 slowdown, doubles from epoch 1 on Medium, a hallucination is guaranteed in wave 2 of a fresh session, level order now TRAFFIC SPIKE → VIRAL LAUNCH → LATENCY → AUTOSCALE → MAINTENANCE → IDLE (storm ≈45 s in); **weather is mechanical** — wind push ×2 with a HUD arrow, LATENCY shortens the flight window 30%, a 429 strike holds the bolt 10 f and freezes every in-flight request 40 f with a RATE LIMITED tag (shots on frozen requests pop 429 and cost nothing); **feel** — screen shake actually works (was `rnd(-1,1)|0` = 0 forever), shake scales 2–8, frontier hits get 5 f hit-stop and a 35% flash, served hallucinations a red flash, hit SFX pitch rises per combo tier, music transposes and changes tempo per load; **critic** — a miss never gets praise (hallucEscaped only when no real request escaped), first miss of a session is always the signature line; **one score number** — TOKENS shows net (revenue − compute) everywhere, BEST tracks net; **phone** — touch hitbox extends 20 px down, 8 px up/sides (thumb-on-sprite 33% → 100%), lift 18→8 with a tap marker, pause/mute tap zones 24×24, MENU target wider, keyboard hints hidden on touch, screen anchored near the top on narrow viewports, attract after 20 s idle (was 9) and a tap on the demo starts a real game, NEED blinks for 2.5 s when it rises, hallucinations alternate glitch/red silhouette; **honesty** — Google Fonts removed, so the page makes zero network requests and the footer says so; COPY RESULT overlays the screen instead of shifting it.
- **v2.8 (Oct 28, roadmap items pulled forward)** Run stats (shots, hits, timeouts, hallucinations served/dodged, best combo, frontier served); stat-driven roast on game over (hallucinations ≥2 → accuracy <40% → combo ≥6 → timeouts ≥4 → epoch ≥4 → generic), both skins; receipt on the game-over panel; **Daily** as a fourth title option (seeded RNG for every spawn/tier/hallucination/wind decision; day number from 2026-10-29; HUD and card show DAILY #n); **share card** — 1080×1080 PNG drawn from the game's own font and sprites with the bot's line word-wrapped, Web Share with file on phones, download on desktop, copy-text fallback in the sandbox; haptics via navigator.vibrate on hits/hallucinations/game over (Android; iOS Safari has no API).
- **v2.8b (Oct 28)** Scenery racks replaced by labeled **GPU nodes** (GPU 0-3 / 4-5 cabinets, spinning fans, per-card utilization bars that rise with the load and go red in the storm). **Rogue agent swarm** wave once per epoch from epoch 3 (epoch 2 on Hard/Daily): four red drones dive at the racks; each stop pays 200×mult, all four pays +1,000×mult; any breach costs 1 VRAM for the rest of the epoch (capped at 1); own critic lines. Duck skin gets hawks. Hallucinations kept: they test restraint, the swarm tests urgency. Generic "GPU" only — no vendor marks (DGX/NVIDIA are trademarks).
- **v2.9 (Oct 28, cold panel #2 — four fresh judges scored v2.8 at 7 / 6.5 / 6 / 5)** Every judge-visible finding fixed: title mode row ignored a thumb's finger-lift offset (tap on EASY started Medium); critic repeated the two streak lines on every hit after a 3-streak (now fires at 3/6/9 only); lines ≥44 chars left before finishing typing (bubble now stays for the line length, tap finishes typing, second tap dismisses); GOOD CALL never fired when you also served the real request (now fires on any clean dodge); lightning kept striking over the game-over panel; Esc did not close the share card; share/copy buttons covered the HUD on phones (now under the cabinet); requests spawned behind the rack panels at the edges; hallucination sprite was clean 1/3 of the time (now 1/4). **Critic depth:** pools 2–3 → 5–8 lines each, plus run-aware lines keyed to the last two waves (frontier in a row, last shot, first-try, after a hallucination, 429 wait, frontier escaped, no shots fired, all shots wasted). **Score-chaser fixes:** pause hides the sky and resume has a 0.4 s READY lockout (no pause-aim); one shot per 4 frames (duplicate pointer events never burn VRAM); a wasted shot halves the combo; perfect bonus scales with the mode (10k/15k/20k) and BEST is per mode; the flight clock stops during a 429 hold; each request steers from its own seeded stream so Daily spawns are identical regardless of when you shoot. **Swarm:** 5 shots on Easy/Medium (one miss forgiven), 4 on Hard/Daily; STOP ALL 4 hint with the shot count; live AGENTS STOPPED n/4 counter. **New rules by epoch** (announced on the epoch card): 4 = hallucinations can wear frontier purple; 5 = bursts of three; 7+ = speed, doubles and hallucination rate keep climbing and the flight clock floor drops to 150. BEST ticks live when the run beats it. HALLUCINATIONS receipt line reads '0 SERVED / 4 DODGED'.
- **v3 elite pass:** see `ELITE.md`; executes on branch `elite`; merges into `main` only through its §5 gates by Thu 11 AM ET.
- **Phase B remains:** top-5 initials, injection request, cache hit, handheld palette, shared leaderboard, runtime-generated lines (needs a model endpoint; breaks zero-network). top-5 initials, daily seed, injection request, cache hit, handheld palette, shared leaderboard.

Append a dated line per publish. Keep `legacy/` untouched.
