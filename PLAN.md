# Token Hunt — v2 implementation plan

Written for a Claude session (Fable or Opus) to execute cold. Everything needed is in this folder. Read this file top to bottom before touching code.

---

## ---STATUS-CHECK---

- **Project:** Token Hunt (hackathon game). Working title history: Fowl Weather v1.0 → Token Hunt v1.1.
- **Phase:** v2 feature build. v1.1 is published and playable; nothing below is required for a valid submission.
- **Last step (Oct 29, night):** v4 beat v3.5 13/13 in a blind A/B panel (ten-judge average 7.6 vs 6.4, PANEL4.md); v4.1 on branch `v4` applies the panel's fixes: the adversary moves into the waves (trained fakes every epoch, a disguise timed to your own reaction, exact printed policy), boss firewall, Daily fully independent of play, text layering, music B section. Before that: v3.4 shipped on `main` — the submission build (final panel average 7.0; consensus TOP 10 of ~300). Before that v3.2 (title/controls) and v3.1: elite pass merged (all seven ELITE.md §5 gates passed, panel 7/7/7 vs 6/6.5/6) plus the non-blocking critic and dead-epoch cut. Suite green (test, verify, stress, stress2, elite_test, visual_test, probes).
- **Next step:** Alex: Vercel import, phone playthrough through a swarm and the epoch-4 boss, record 60–90 s with system audio (the critic speaks; end on the share card), submit. `main` = v3.5 (live on Vercel); v4 develops on branch `v4` and merges only through its gates.
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
- **v2.9b (Oct 28–29, re-score panel on v2.9: 6 / 6.5 / 6 / 6)** Critic bubble: types 2 chars/frame and holds 1.8 frames per character (40–90) so every line is readable; drawn after the front row so the racks never cover it; game-over bubble clears the panel. Hallucination tell: from epoch 4 the glitch tag shows only on the red frame, so the mimic rule bites; the fake never spawns on top of a real request (clearest slot, else skipped). Swarm: fires on the first wave at or after the third (doubles no longer skip it); the hint stays on screen for the first 200 frames; a breach costs 1 VRAM for the next wave only and that wave is never a burst of three; on touch devices agents start higher and 22% slower. Curve: NEED=[3,4,4,4,5…] (5 of 6 from epoch 5). Skip-tap grace: an empty-sky tap in the first 18 frames of a wave is free. 429 legibility: frozen requests blink red and a centered '429 RATE LIMITED' banner shows while any request is held. Score integrity: a run that ever had the assist code on records only to the assisted best, and the panel/card/brag carry the mode (EASY/MEDIUM/HARD/DAILY #n) and ASSISTED; a wasted shot drops the combo to at most 5 (out of ×3); clearing a wave with VRAM to spare pays EFFICIENT +100×mult per shot; the wave-2 hallucination is guaranteed in every real game (not just the first per page load); the epoch card shows fresh VRAM; the NEW RULE line sits on a dark band and the card holds 70 frames before a tap can skip it; Daily seed anchored on Oct 28 so no two days share a number; the perfect line no longer blinks blank. Phone: cabinet vertically centered so the sky sits nearer the thumb; DAILY caption on a band; footer clears the share buttons on desktop too. Fallback demo.mp4 re-rendered from this build and ends on the game-over receipt instead of the hidden skin.
- **v3.0 (Oct 29, elite pass merged — branch `elite` 1a7a695, fast-forwarded onto main)** E0 deterministic sim + input recording + WATCH REPLAY at 2× with a ghost cursor; E1 WebGL CRT (barrel, mask, scanlines, aberration, bloom, phosphor) with GPU calibration, a frame-time governor, context-loss recovery and a C toggle (verified on an M3: full tier, locked 60 fps through the storm); E2 the critic speaks via speechSynthesis with mouth flaps on word boundaries and an eased entrance; E3 mixed audio (compressor bus, sidechain ducking, stereo by x, bar-quantized layers, captions); E4 interpolated rendering, trauma shake, squash, hit flash/pop, spin on fall; E5 DDoS boss every 4th epoch; E6 flow-channel difficulty on Easy/Medium; E7 GitHub CI; E8 visual goldens; E9 accessibility (dashed outline on hallucinations, captions, one-hand mode). Gate 6 panel on the elite build: phone 7, indie 7, organizer 7 (baseline 6 / 6 / 6.5).
- **v3.1 (Oct 29)** Non-blocking critic: once the line is typed the next wave launches and the bubble lingers over play (roughly doubles shooting density; the panel's #1 blocker three times running). Dead epochs end at once: when the quota is out of reach the critic says so and the run ends instead of playing out dead waves (also fixes the praise-then-OUT-OF-MEMORY whiplash). Swarm hint clears the agents' path after 80 frames; 429 banner moved out of the flight lane; bursts of three on ~30% of eligible waves from epoch 5 (was ~16%); mid-flight the HUD icons take only a precise tap; Daily title clears the front row; roast grammar ('A STREAK OF 18'). Pitch rewritten to own the light-gun homage and name the boss, the voice, the CRT and the replay.
- **v3.2 (Oct 29, 3 PM — Alex's title/controls pass)** Difficulty row labelled, selected mode boxed, keys spelled out; ↑↓ and ←→ both change it; pulsing ring + SOUND ON/OFF at the speaker icon until the first tap; **Space pauses mid-flight** (Space/Enter resume; Enter still starts); 'WATCH DEMO - W' on the title launches the attract demo on tap or W; 'duck' toggles between the two skins; 'finn' greets the Finn fam with its own lines and toast; game over shows 'N TO BEAT' under BEST when the run fell short. Title and critic goldens re-recorded. Suite green.
- **v3.3 (Oct 29, 3:50 PM — final)** MISS pops at the tap point on a wasted shot; 'COMBO X2 · 3 IN A ROW' / 'X3 · 6 IN A ROW' pops the first time the multiplier climbs; three generic critic lines sharpened. Suite green. **Frozen for submission.**
- **v3.4 (Oct 29, 4:35 PM — final panel fixes, the actual submission build)** Signature line fires on the first real miss of every run (near-miss no longer preempts it; resets per run); typing the skin code no longer toggles the CRT; a tap on the lingering critic or his bubble dismisses him free instead of burning VRAM; tokens can go negative so every shot and every served hallucination visibly costs (HUD shows -00300); a perfect epoch requires zero hallucinations served; one-hand mode counts as assisted for the record; no layout jump at game over (footer gap reserved); selected difficulty label without shadow; the first storm flight of an epoch is guaranteed a 429 strike at frame 40; small 429 label clear of the banner; third roast line per pool; Enter/Space on a focused share button activates the button; lingering bubble leaves 0.6 s into the next wave. Final 10-judge panel + organizer sim + two AI-selector sims: see PANEL3.md.
- **v3.4b/v3.5 (Oct 29, 5 PM)** finn and vcc both welcome the Finn fam (no 'assisted' wording anywhere); duck shows KEEP CALM AND QUACK ON across the screen; red reserved for targets (hallucinations are grey static ghosts tagged FAKE, 429-frozen requests icy blue); the game fills the window (integer scale only when it costs <12%). Deployed to Vercel.
- **v4 (Oct 29–30, branch `v4`; deadline moved to Fri 5 PM, Alex submits by noon)** **The fakes train on you:** an online adversary (pure sim state, no rng in training, replay-exact, off in Daily and the demo) trains after every cleared epoch on which tier you serve, where you aim (lane histogram of shots) and whether its tag gives it away, then builds the next epoch's fakes to fool you — your colour (P(purple) = 1.25 × your purple share), your lane (tried first, never on top of a real request), no tag once you dodge ≥75%, +5% fake rate when you fall for half of them. The round-clear panel shows the MODEL UPDATE with the evidence ('YOU SERVE PURPLE 67% > FAKES WEAR PURPLE'); the epoch-2 card says 'NEW: THE FAKES NOW TRAIN ON YOU'; the critic has advServed/advServedHi/advDodged lines; the roast pool roastAdv fires at ≥2 tailored fakes served; receipt and share card show 'MODEL FOOLED YOU k/m'. **TTFT bonus:** a request served within 30 frames of arriving pays ×2, within 50 frames ×1.5 ('FAST X2'). Perfect bonus 10k → 6k × mult. Bursts of three come with AUTOSCALE +1 VRAM (HUD shows the extra chip). Boss LV2/LV3 at epochs 8/12 (HP 6/9/12, speed +25%/level, VRAM +3/level, payout ×level, wider health bar with LV tag). **5×7 font** (FONT7, 61 glyphs) for the critic bubble (wrapped to two lines, shared geometry with tap-to-dismiss), tips, rule lines and a title rules card. **First-time tips** (frontier, fake, frozen, fast; once per browser). Keyboard aiming: hold arrows to move the crosshair, Enter/Z/X fires (recorded as a tap, replay-exact). One-hand runs labelled ONE-HAND (not Finn fam). Agents' hitbox +2 px. Pitch leads with the adversary.
- **v4.1 (Oct 29 night, branch `v4`; from the 13-seat blind A/B panel, PANEL4.md)** **The adversary moves into the waves.** It now learns what is actually yours: the colour you serve most readily as a share of what showed up (not the traffic mix), and your mean time to fire; it acts on exactly what it prints (fakes wear that colour, all of them; trained fakes pass for a real request for your time to fire, then glitch in bursts that shrink each version: 60 → 50 → 40% of each 16-frame cycle; the tag only flickers after ≥2 dodges at 75%); a trained fake every epoch from epoch 2 (two after you fall for half), never on top of a real request; lanes removed. When one fools you a pop names the version (MODEL V3 FOOLED YOU). The epoch card is 5×7, observation in white and response in purple, and the first tap shows every line before the second continues. Rule cards follow the mode (the epoch-4 mimic card only with the adversary off, i.e. Daily). **Boss:** slides in shielded, then a firewall cycle (open 50 f, up 30 f, icy box = wait, taps free), splinters fall with it, the intro counts the real HP, its bar clears the icons; its splinters draw from its own stream. **Daily is independent of play** (burst roll unconditional and blind to lost VRAM; probe compares two different Daily runs over 34 waves through epoch 9). **Scoring:** FAST windows 0.75 s / 1.25 s folded into the score pop; free early taps 8 frames (was a free spray); Easy/Medium ramp capped ×1.12 / +4% fakes (Medium never outruns Hard); epoch 5 needs 4 of 6; no burst on an epoch's first wave; a breach voids the perfect epoch; Daily best per day. **Text:** tips queue in the top band; the lingering bubble sits behind requests and leaves 0.3 s into the wave; burst/lost-VRAM notices by the VRAM readout; title copy fits between the racks and leads with THE FAKES TRAIN ON YOU.; share card overprint fixed. **Lines:** no repeats in the last six, first-shot line less often, honest roast counts, '99.9% UPTIME' never after an outage. **Input/a11y:** keyboard voice unlock (was commented out since v3.3b), focus ring on Tab only, 'thumb' no longer mutes, corner icons ignore taps after a shot, demo tap opens the menu, held arrows cleared on blur, Esc = menu at game over, share dialog takes focus and keeps Tab, code input off the Tab order, hollow missed tally slots, CRT off drops CSS scanlines, softer flashes under reduced motion. **Music:** arp follows the chord, B section (A A B A), stingers in key, 25%/12.5% pulse leads. **Ship:** inline favicon (no network request), absolute og:image on a new link card, kit moved out of `dist/`.
- **v3 elite pass:** see `ELITE.md`; executes on branch `elite`; merges into `main` only through its §5 gates by Thu 11 AM ET.
  - **E0 (Oct 28, `elite`) determinism + replay.** Every simulation random now comes from two per-run seeded streams (`G.rng` spawns/flight, `G.rng2` dialogue/lightning/critic placement, both from `G.seed`: daily seed or a fresh 32-bit one); `fxRng` is cosmetic only (particles, rain, shake, chirp pitch, flap SFX). Draw no longer mutates state (`needFlash` and flash reset moved into `update`). `startGame` resets every transient (`resetRunState`). Runs record `[frame,type,x,y]` (`m` mouse tap, `t` touch tap, `k` key) stamped with the sim frame; inputs reach the sim only between steps. `bootDone` snapshots seed, rng state, settings and cross-run state; `window.__replay(run,{headless,toFrame})`. Game-over panel: **WATCH REPLAY >** (or `R`) plays the last run at 2× with a REPLAY badge and a ghost cursor gliding to each recorded tap; tap/Space skips to the identical end (silent fast-forward). Hi score never updates from a replay. `elite_test.js` E0: 60 s bot run (mouse + touch taps, keys, deliberate misses, hallucination serves, intro/critic skips) replayed headlessly 3× → identical score, tally, round, run stats, bird positions and rng state; dropping one input diverges; WATCH REPLAY runs at 2×, ends on the same game over, R + tap-skip lands on the same state.
  - **E1 (Oct 28, `elite`) WebGL CRT post-process.** The 256×240 canvas is uploaded as a texture each frame and drawn through a WebGL quad over `#g` (`#crtgl`, pointer-events none, so `#g` still owns input and layout): barrel distortion k=0.08 normalised so the whole frame stays visible, sharp-texel sampling, radial chromatic aberration 0.6 px, brightness-dependent scanlines, aperture grille (faded out below 1.6 px per texel), quarter-res two-pass separable bloom (+0.25), vignette, interleaved-gradient noise, 15% phosphor persistence (constant-alpha blend on a preserved buffer). Pointer coordinates go through the same barrel map, so clicks land on what you see (8/8 corner hits). **Quality tiers:** startup timing of real renders picks full (native res × DPR≤2) on GPUs, lite (flat, ≤2× source: scanlines, bloom, vignette, noise) on software renderers (SwiftShader/llvmpipe detected), off if lite doesn't fit; a runtime governor steps down a tier when the clipped-mean frame interval exceeds 18 ms for ~3 s ("CRT LITE/OFF: KEEPING 60 FPS"). `__crtTier(n)` forces a tier (e.g. full quality for an offline capture). CSS scanline overlay is the fallback (no WebGL, `webglcontextlost`, reduced motion, toggle off); restore re-initialises. Toggle: **C** key (not while typing `vcc`), third HUD icon at (215,2), persisted `th.crt`; reduced motion defaults off. Footer lists `C CRT`. Headless (SwiftShader, 2 shared cores) frame cost: full 45–60 ms, lite 15–23 ms, off 0.9 ms of work; auto settles on the CSS fallback there at 16.6 ms. `preview_sprites.py` now writes next to itself (was hard-coded to the main checkout). Tests E1: tiers render non-blank and differ, perf per tier, auto holds 60 fps, barrel-mapped corner clicks, C/icon/VCC, context loss/restore, WebGL stubbed to null, reduced motion.
  - **E2 (Oct 28, `elite`) the bot speaks.** Every critic line (wave result, tutorial, swarm, game-over roast) goes to `speechSynthesis` when its bubble appears: **local voices only** (prefers Samantha/Daniel/Google/Karen/Moira/Zira/David/Fred/Alex among `localService:true` English voices — network voices such as Chrome's "Google US English" are skipped to keep zero network), pitch 1.4, rate 1.15, sentence-cased text with acronyms kept (AI, GPU, VRAM…). Off until the first gesture (iOS primed with a silent utterance inside it), silenced by mute, cancelled on skip, pause, title and replay start; never in replays or the demo. No API / no local voice → chirp typewriter as before (chirps also stop while a voice carries the line). New sprites: talk frames `botO`, `botHappyO`, `botFlatO`, `foxO`, `foxLaughO` and a smug roast face `botSmug`/`botSmugO` (raised brow, half-lid, smirk). One face per mood (hit happy, miss flat, tutorial neutral, game-over smug/laughing fox); the mouth flaps on utterance word boundaries, or every 4 frames while the typewriter runs. Entrance: peek, 3 px dip (anticipation), spring up with a 4.2 px ease-out-back overshoot, settle; exit eases in. Speech is cosmetic — the sim never reads it. Tests E2 (stubbed speechSynthesis): nothing before a gesture, local voice chosen, speak() once per critic line with that line's text over a 30 s bot run, pitch/rate/volume, skip cancels, mouth flaps on boundaries, mute and replays silent, entrance curve numbers, no-API fallback flaps with the typewriter.
  - **E3 (Oct 28, `elite`) mixed, adaptive audio.** Graph: every voice → optional `StereoPanner` (pan = screen x, −0.8…0.8) → **sfx** or **voice** bus (critic chirps, laugh, blips); music → four layer gains → **duck** gain → **music** bus; buses → master (mute) → `DynamicsCompressor` (−18 dB, 4:1, knee 6, 4 ms / 200 ms) → out. **Sidechain:** hits, frontier hits, served hallucinations and the bot starting to speak duck the music −8 dB for 180 ms (gain automation, 120 ms release). **Vertical layering:** base loop always; arpeggio layer at combo ≥ 3; drum layer (kick/snare) at combo ≥ 6; sub-bass + fast hats in the storm/autoscale loads; layer changes quantized to the next bar and faded over one bar, notes for a silent layer are not scheduled. Rain moved onto the sfx bus. Measured headless with analysers on a full mix (all layers + hits every 300 ms): output peak −7.3 dBFS, RMS −24 dBFS; music RMS −29, sfx RMS −27. Also fixed in the E0 test hook: a headless replay to frame N now applies inputs stamped at N (they arrived after the last step) before reading the state — the E0 check caught one such trailing tap. CRT governor now uses a clipped mean (each interval capped at 50 ms) instead of the median, which missed a steady one-in-three dropped-frame pattern (avg 21.9 ms, median 16.7); `__crtGovern(intervals)` test hook. Tests E3: compressor settings and live graph, buses and layers at rest, left/right pan, −8.0 dB duck and recovery, arpeggio mid-fade then full, drums at 6, storm layer, everything fades back, speech-start duck, levels.
  - **E4 (Oct 28, `elite`) feel.** **Interpolation:** every sim step first copies positions to `px,py` (birds, particles, score pops, clouds, rain, title flyer); `draw` renders at `lerp(prev, cur, alpha)` with `alpha = accumulator/step` (1 while paused; jumps > 24 px — wraps, teleports — snap), and the critic's rise/settle/exit curve is sampled at the fractional frame, so 120 Hz screens get in-between frames and 30 Hz ones don't stutter. **Trauma shake** replaces `G.shake`: hit +0.25, frontier +0.4, served hallucination +0.5, lightning +0.5, breach/escape +0.6, decay 1.6/s (held during hit-stop), offset = 9 px · trauma² · smooth value noise, integer-rounded, world only (HUD steady), off under reduced motion; no rng, so replays shake identically. **Squash & stretch:** requests squash to 90% height on the wing downstroke; a hit is a 3-frame white flash plus a 1.3× pop easing back over 10 frames; served/shot requests coin-flip spin (scaleX = cos) while falling; rogue agents jitter ±1 px and drag a fading red trail; score pops rise 20 px on ease-out-cubic and fade instead of blinking. Sprite scaling is nearest-neighbour (`imageSmoothingEnabled=false`). Tests E4 (rAF driven by hand at 120 Hz): 600 frames = exactly 300 sim steps, 299/300 in-between frames render a different position, monotonic motion, no NaN; trauma amounts, 1.60/s decay, lightning, offset bound.
  - **Merge `main` v2.9 → `elite` (Oct 28 late).** All 16 `game_body.html` conflicts resolved by hand, keeping every v2.9 behavior: `foxTyped/foxLeave/foxLen` drive the eased critic curve (exit starts at `foxLeave()`), first tap finishes typing and the second dismisses (and cancels speech); `pickLine`/`ctxLine` run-aware lines with the 80% coin moved from `Math.random` to the sim stream `G.rng2` so replays say the same lines; per-bird `b.r` steering stays seeded from the sim rng; `G.wf` facts, `G.prevHi`, `G.prevHallucServed`, `G.unpauseT` and the 4-frame shot debounce clock `G.lastShotF` are reset in `resetRunState`; v2.9's `G.shake=` writes became trauma adds; lightning keeps v2.9's game-over gating + `G.wf.frozen` and uses the sim rng. **Determinism fix found in the merge:** the 0.4 s READY lockout after unpausing is sim state, so the unpause is now recorded as an input (`u`) and replays apply it. Also: lightning no longer freezes rogue agents (their frozen timer never thawed, so an agent struck during a storm-epoch swarm could not be shot). `ELITE` tests: the E2 curve test now pins a short line (dwell depends on line length since v2.9).
  - **E5 (Oct 28, `elite`, Tier 2) DDoS boss.** Every 4th epoch (4, 8, 12…) the wave after the second request is a boss wave instead of the swarm: the critic warns first (flat face, `bossIn` lines, its own dwell), then a **48×40 DDoS** (gpu: spiky red malware ball; duck: an angry **THUNDERHEAD** with a lightning bolt — both generated procedurally in `sprites.py` from shape masks + an angry face, no hand-typed rows) crosses slowly (0.42 px/f, bobbing ±7 px, ~12 s edge to edge). 6 hits (+300×mult each, 3 f hit-stop, white flash + 1.12× pop, pitch rises per hit, combo counts); **every 2nd hit splits off two rogue agents** that dive at the racks (6 total, the last pair on the kill; a splinter that reaches the racks costs 300 tokens, not VRAM — with VRAM loss, a 3-shot epoch needing 5/6 became a wall for the bot and would for players); a kill pays +5,000×mult with an 8 f freeze, flash and 24-particle burst; escaping costs 1 VRAM for the epoch and resets the combo. VRAM 14 for the wave (16 assisted), shown as `×14` when the ammo row would overflow. Health bar plate at the top (name + 6 cells, the next cell flashes white on a hit; v2.9's swarm counter is hidden in boss waves). Unique **boss music layer** (sawtooth minor riff + bandpass snare, quantized/faded like the others). Dialogue after: `bossWin`/`bossLoss` pools in both skins. Lightning never freezes the boss or its agents. Deterministic (G.rng), so replays include it (the E0 bot now meets it at epoch 4 and must keep a ≥2400-frame recording before capture). Tests E5: none in epoch 3, warning line then boss in epoch 4, 6 hits → mitigated, 6 agents spawned, win line after clearing them, escape → −1 VRAM + loss line, boss layer fades in.
  - **E6 (Oct 28, `elite`, Tier 2) flow-channel difficulty.** Easy and Medium only (Hard, Daily, assisted and demo runs stay fixed so scores remain fair and comparable). A wave succeeds when every real request in it is served; once the last 8 waves are known, a success rate above 75% nudges request speed ×1.06 and the hallucination chance +1/20 after every wave, below 65% eases them back (÷1.06, −1/20); clamped to speed ×0.75…×1.3 and hallucinations −0.10…+0.15 on top of the mode's own rate and v2.9's late-epoch ramp. Pure sim state reset per run, so replays and seeds stay deterministic. Tests E6: one nudge after a full window, caps, 6/8 holds, 8 failures ease off, spawn speed follows the factor exactly (same rng state, ×1.2), Hard/Daily never move.
  - **E7 (Oct 28, `elite`, Tier 2) CI.** `.github/workflows/test.yml` runs on every push/PR in `mcr.microsoft.com/playwright:v1.63.0-noble` (same Playwright as the sandbox): `build.py` (IP guard), then a diff check that the committed `dist/` matches the source, `test.js`, `verify_v25.js`, `stress.js`, `stress2.js`, `elite_test.js`; screenshots uploaded as an artifact. Tests now load Playwright through `pw.js` (sandbox paths by default; `PLAYWRIGHT_MODULE` / `CHROME_PATH=` for CI); `test.js` exits non-zero on page errors. README badge + engine section. Vercel deploys `main` only, so `main` stays green by merging only green branches.
  - **E8 (Oct 28, `elite`, Tier 2) visual regression.** `visual_test.js` renders 9 canonical states (title, BIOS boot, epoch-4 intro with its rule card, storm flight with a hallucination, critic bubble, round clear, game over + roast face, duck-skin storm, boss fight) in fresh pages with the sim and fx streams seeded (`__seedRun`, `__seedFx`), CRT off, rAF pumped at exactly 60 Hz and the loop clock reset (`__loopReset`), then compares the 256×240 game canvas to `goldens/*.png`: a pixel counts as different if any channel moves > 16; fail above 0.5%; on failure it writes `shots/vr_<state>_actual.png` and a red diff map. `--update-goldens` rewrites them (they were reviewed on a contact sheet before committing). Self-check: the same state rendered twice in two pages is byte-identical. Runs in CI.
  - **E9 (Oct 28, `elite`, Tier 2) accessibility.** **Shape cue:** an airborne hallucination gets a marching dashed outline whenever its glitch tag shows (always before epoch 4, the red frame after) (1 px, 2-on/2-off, phase follows its animation), so it reads without colour or flicker. **Captions when muted:** meaningful sounds post a caption in the top-left corner — (DING), (GOLD CHIME), (ERROR BUZZ), (THUNDER), (WHOOSH), (BOT LAUGHS), (FANFARE), (EPOCH CLEAR), (PERFECT!), (GAME OVER JINGLE) — max 3, 1.5 s each, moved below the REPLAY badge during replays; never during silent fast-forward. **One-hand mode** (code `THUMB`, typed or via the 7-tap logo entry; persisted `th.onehand`): the crosshair drifts toward the nearest real request (exponential follow, 7% per frame, ignores hallucinations) and any tap on the racks/HUD (y ≥ 176) fires at the crosshair; the shot is recorded at the crosshair point, so replays stay exact; HUD shows ONE-HAND and a blinking TAP THE HUD TO FIRE hint; touch moves no longer drag the crosshair in this mode. Goldens refreshed (fly + duck storm now show the outline). Tests E9: outline covers ~50% of the box perimeter and never a real request, captions only while muted, THUMB on → crosshair trails a drifting request inside its hitbox and a HUD tap serves it while the hallucination is ignored, THUMB off.
  - **Merge `main` v2.9b → `elite` (Oct 29 early).** All 17 `game_body.html` conflicts resolved by hand, keeping every v2.9b behavior: the critic types 2 chars/frame (chirp, typewriter mouth flap and bubble all follow it) and its bubble is drawn after the front row via `drawFox(0)`/`drawFox(1)`→`drawBubble`, with the game-over bubble at `y-19`; from epoch 4 the glitch tag shows only on the red frame (the E9 dashed outline now follows the same rule, so the shape cue never tells more than the colour); frozen requests blink the `R` sprite and the centered `429 RATE LIMITED` banner shows; clearest-slot hallucination spawn keeps E6's `flowHalluc()` term; swarm on the first wave at or after the third (boss rounds still skip it, and the boss check got the same `>=` fix so a double on wave 1 can no longer skip the boss); swarm hint for its first 200 frames (not on boss waves); VRAM loss applies to the next wave only (`G.lostNow` drives the HUD; the ×N ammo readout for >6 stays); burst-of-three never on a VRAM-short wave; empty-sky grace in the first 18 frames counts the boss hitbox as something under the tap; combo cap 5 after a waste; EFFICIENT bonus; `runAssisted`/`modeTag()` score integrity; `wavesStarted` reset per real game. **Determinism fix found in the merge:** v2.9b's touch-slowed swarm read `document.body.classList` when the swarm spawned, so a replay on a different device would diverge; the touch class is now snapshotted at run start (`G.touchRun`, in the replay snapshot). Kept from E4: the 3-frame white hit flash (v2.9b's flicker not taken) and the needFlash/flash reset in the sim step (v2.9b's draw-time copies dropped). `ELITE` tests: the E2 curve test measures the dwell from the curve instead of pinning a number.
- **Phase B remains:** top-5 initials, injection request, cache hit, handheld palette, shared leaderboard, runtime-generated lines (needs a model endpoint; breaks zero-network). top-5 initials, daily seed, injection request, cache hit, handheld palette, shared leaderboard.

Append a dated line per publish. Keep `legacy/` untouched.
