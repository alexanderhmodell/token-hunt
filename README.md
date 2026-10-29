# Token Hunt

[![test](https://github.com/alexanderhmodell/token-hunt/actions/workflows/test.yml/badge.svg)](https://github.com/alexanderhmodell/token-hunt/actions/workflows/test.yml)

An original 8-bit arcade game in one HTML file. You are a GPU cluster. Requests fly in with wings; you have three VRAM per flight to serve them before they time out. Some are hallucinations, and they train on you: after every epoch an adversary model reads your habits (the colour you serve most readily, your time to fire, whether you read its tag) and builds the next epoch's fakes to exploit them, printing exactly what it learned. The load changes every epoch, and a chatbot rises from the rack row to comment on your aim.

- **Play:** open `dist/index.html` in any browser, or host that one file anywhere (itch.io, Vercel, GitHub Pages).
- **Controls:** click or tap to serve · arrows + `Z`/`X`/Enter to aim and fire · `M` mute · `P`/`Esc` pause · `C` CRT · `R` watch replay, `Esc` menu (game over) · `1`-`4` or the arrows on the title for difficulty (4 = Daily) · Space/Enter to advance. Wait on the title and it plays itself.
- **No assets.** Every sprite is hand-pixeled in `sprites.py`, the fonts are 3×5 and 5×7 bitmaps, and all audio (shot, chiptune loop, packet rain, thunder) is synthesized live with the Web Audio API. Native 256×240, scaled pixel-perfect, CRT overlay.
- **Two skins.** Token Hunt (default) and Fowl Weather, the original meadow version. Both share every mechanic.

## Build

```bash
python3 build.py        # injects sprites → dist/artifact.html (body for claude.ai Artifact) + dist/index.html (standalone)
python3 preview_sprites.py   # renders sprites_preview.png; look at it after any sprite change
node test.js            # headless Playwright playtest → shots/*.png, shots/sheet.png
node og.js              # renders dist/og.png (link preview card) from the title screen
node stress.js          # stress battery: invariants under click/pause/skin spam, 30 epochs per skin, no-storage boot, hot reload
node stress2.js         # touch emulation, keyboard + state fuzz, blur/focus, keyboard paths, 150 s aimbot run
node elite_test.js      # v3 systems: replay determinism, WebGL CRT tiers, speech, audio mix, interpolation, boss, flow, gates (ONLY=E0,E3 for a subset)
node visual_test.js     # 9 canonical states rendered deterministically, pixel-diffed against goldens/ (0.5%); --update-goldens to rewrite
node adversary_test.js  # the adversary (what it learns, prints and builds), the epoch card, the boss firewall, text widths, Daily independence
node trailer.js         # ~60 s scripted trailer with game audio, recorded in the page -> dist/trailer.mp4 (git-ignored)
```

Tests find Playwright and Chromium at this sandbox's paths by default (`pw.js`); set `PLAYWRIGHT_MODULE=playwright CHROME_PATH=` to use an npm install and its bundled browser. `.github/workflows/test.yml` runs the whole suite on every push in the Playwright container and fails if the committed `dist/` does not match the source.

## Engine (v3 `elite`)

- **Deterministic sim + replays.** Fixed 60 Hz steps; all gameplay randomness comes from per-run seeded streams, cosmetics from their own stream. Every run records its inputs by sim frame, so the game-over panel can **WATCH REPLAY** (2×, tap to skip) and tests replay runs bit for bit.
- **Interpolated rendering.** Positions lerp between sim steps, so 120 Hz screens get in-between frames.
- **WebGL CRT** (`C` / third HUD icon): curvature, scanlines, aperture grille, bloom, chromatic aberration, phosphor persistence; quality tier chosen by timing real frames, CSS fallback without WebGL.
- **The bot speaks** through the browser's own `speechSynthesis` (local voices only), with mouth flaps and an eased entrance.
- **Mixed audio:** buses, compressor, sidechain ducking on hits and speech, stereo by screen position, music layers that build with your combo and the weather.
- **The adversary** (`advTrain`): running statistics per epoch, no rng, so replays and the seed stay deterministic; it sits out the Daily so everyone gets the same requests.
- **Every 4th epoch a DDoS boss** behind a firewall, stronger each time; Easy/Medium quietly hold you in a 65–75% success channel (capped below Hard).

`build.py` refuses to emit a build containing any third-party game names or trademarks (see `FORBIDDEN`).

## Layout

| Path | What |
|---|---|
| `game_body.html` | the whole game (styles + markup + one script) with a `/*__SPRITES__*/` placeholder |
| `sprites.py` | palette, sprites, icons, 3×5 font, 5×7 title face |
| `build.py` | sprite injection, IP guard, two outputs |
| `test.js` | headless state-machine playtest and screenshots |
| `PLAN.md` | the v2 implementation plan with checkpoints, gates, and a zero-touch mode |
| `SUBMISSION.md` | submission blurb, one-liner, originality note |
| `trailer.js` | records a ~60 s trailer with game audio, in the page → `dist/trailer.mp4` |
| `PANEL2.md`–`PANEL4.md` | the judge panels and what each changed |
| `legacy/` | Fowl Weather v1.0 source, kept for the duck skin; never shipped directly |

## Credits

Built by Claude (Anthropic) end to end — code, pixel art, and synthesized audio — designed, directed, and playtested by Alex Modell. Homage to the 1980s light-gun arcade genre; no third-party characters, art, or names.

MIT License — see `LICENSE`.
