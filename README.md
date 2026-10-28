# Token Hunt

An original 8-bit arcade game in one HTML file. You are a GPU cluster. Requests fly in with wings; you have three VRAM per flight to serve them before they time out. The load changes every epoch, and a chatbot rises from the rack row to comment on your aim.

- **Play:** open `dist/index.html` in any browser, or host that one file anywhere (itch.io, Vercel, GitHub Pages).
- **Controls:** click or tap to serve · `M` mute · `P`/`Esc` pause · `1`/`2`/`3` difficulty · Space/Enter to advance. Wait on the title and it plays itself.
- **No assets.** Every sprite is hand-pixeled in `sprites.py`, the font is a 3×5 bitmap, and all audio (shot, chiptune loop, packet rain, thunder) is synthesized live with the Web Audio API. Native 256×240, scaled pixel-perfect, CRT overlay.
- **Two skins.** Token Hunt (default) and Fowl Weather, the original meadow version. Both share every mechanic.

## Build

```bash
python3 build.py        # injects sprites → dist/artifact.html (body for claude.ai Artifact) + dist/index.html (standalone)
python3 preview_sprites.py   # renders sprites_preview.png; look at it after any sprite change
node test.js            # headless Playwright playtest → shots/*.png, shots/sheet.png
node og.js              # renders dist/og.png (link preview card) from the title screen
node stress.js          # stress battery: invariants under click/pause/skin spam, 30 epochs per skin, no-storage boot, hot reload
node stress2.js         # touch emulation, keyboard + state fuzz, blur/focus, keyboard paths, 150 s aimbot run
```

`build.py` refuses to emit a build containing any third-party game names or trademarks (see `FORBIDDEN`).

## Layout

| Path | What |
|---|---|
| `game_body.html` | the whole game (styles + markup + one script) with a `/*__SPRITES__*/` placeholder |
| `sprites.py` | palette, sprites, icons, 3×5 font, 5×7 title face |
| `build.py` | sprite injection, IP guard, two outputs |
| `test.js` | headless state-machine playtest and screenshots |
| `PLAN.md` | the v2 implementation plan with checkpoints, gates, and a zero-touch mode |
| `dist/SUBMISSION.md` | hackathon blurb, hosting steps, demo-video shot list |
| `legacy/` | Fowl Weather v1.0 source, kept for the duck skin; never shipped directly |

## Credits

Built by Claude (Anthropic) end to end — code, pixel art, and synthesized audio — designed, directed, and playtested by Alex Modell. Homage to the 1980s light-gun arcade genre; no third-party characters, art, or names.

MIT License — see `LICENSE`.
