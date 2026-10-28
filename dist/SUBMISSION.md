# Token Hunt — hackathon submission kit

**Deadline: Thu Oct 29, 5:00 PM ET.** Everything below is copy-paste ready. Never type "Duck Hunt" or "NES" anywhere public.

---

## 1. Submission blurb (paste into the form)

**Token Hunt** — an original 8-bit arcade game where you are a GPU cluster.

Requests fly in with wings; you have three VRAM per flight to serve them before they time out. Every epoch the load changes: a traffic spike drifts them sideways, autoscaling gusts shove them around, latency rains packets, and a viral launch brings 429 rate-limit lightning. Hit the quota or you're out of memory. Enterprise customers (gold) are worth triple. A perfect epoch pays 10,000 tokens for 99.9% uptime.

And when you miss, a smug little chatbot rises from the rack row to tell you "As an AI, I can't help with that."

Built in a day as a single HTML file — no engine, no asset files. Every sprite is hand-pixeled in code, the font is a 3×5 bitmap, and all sound (gunshot, chiptune loop, packet drizzle, thunder) is synthesized live with the Web Audio API. Native 256×240 scaled pixel-perfect with a CRT overlay. Mouse or touch.

**Controls:** click or tap to serve · M to mute · Space/Enter to advance.

---

## 2. One-line version

8-bit arcade shooter where you're a GPU cluster serving winged requests through traffic spikes, 429 storms, and a chatbot that mocks your misses — original art and live-synthesized chiptune.

---

## 3. Host it (5 minutes)

### itch.io (recommended)
1. Zip `index.html` by itself → `token-hunt.zip`.
2. itch.io → Dashboard → **Create new project**. Title: Token Hunt · Kind: **HTML** · upload the zip · check **"This file will be played in the browser."**
3. Viewport **1024 × 960**, enable **fullscreen button** and **mobile friendly**.
4. Visibility **Public** → Save → copy the link.
5. Tags: arcade, pixel-art, retro, chiptune, ai, html5. (Not: duck, hunt, nintendo.)

### Vercel
Add New → Project → upload a folder containing only `index.html` · Framework: Other · Deploy.

Open the link on your phone once to confirm the first tap starts the game with sound.

---

## 4. Demo video (60–90 s, no narration needed)

Record with QuickTime (⌘⇧5) at a ~1000px-wide browser window so the game is 4× and scanlines show.

1. **0:00–0:08** Title. Let the bot peek up. Tap to boot — fanfare.
2. **0:08–0:30** Epoch 1 (IDLE). Serve two requests, deliberately miss one so the bot delivers "As an AI, I can't help with that." Let one time out ("504 TIMEOUT").
3. **0:30–0:50** Jump to VIRAL LAUNCH — packet rain, a 429 lightning strike with thunder. Serve a gold enterprise request if one appears.
4. **0:50–1:05** An epoch-complete panel (ideally "99.9% UPTIME! +10000"), then OUT OF MEMORY with the bot's send-off.
5. **1:05–1:15** End on the title screen.

To jump to the storm for the recording, open the console (⌥⌘J) mid-epoch and paste:
```js
__th.round = 4; __th.wave = 10; __th.tally = Array(10).fill('hit'); __th.state = 'fox'; __th.fox.t = 109;
```
That rolls into EPOCH 05 — VIRAL LAUNCH after a "perfect" panel (tap to skip). Use `5` for MAINTENANCE, `2` for LATENCY. Order: IDLE → TRAFFIC SPIKE → LATENCY → AUTOSCALE → VIRAL LAUNCH → MAINTENANCE.

---

## 5. If asked about originality / AI use

All art, code, and audio are original to this project; no sprites, fonts, or sound files were downloaded. It's an homage to 1980s light-gun arcade games (mechanics aren't protected); no third-party characters, names, screen designs, or artwork appear. Built with Claude as the coding partner — which is the joke.

---

## 6. Files

- `index.html` — the whole game, self-contained, host anywhere.
- Playtest link (private artifact) — in the chat.
