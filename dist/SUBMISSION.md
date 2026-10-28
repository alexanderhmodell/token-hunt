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

## 3. Host it on Vercel

**Preferred (one-time, then automatic):** the repo is on GitHub → vercel.com/new → Import `token-hunt` → Framework Preset **Other** → Output Directory **`dist`** → Deploy. Copy the `*.vercel.app` URL. Every later commit redeploys it.

**Quick fallback:** vercel.com/new → drag a folder containing only `index.html` → Deploy.

Open the URL on your phone once: first tap should start the game with sound.

**Optional itch.io mirror** (judges browse there): Create new project → Kind **HTML** → upload `index.html` zipped → "played in the browser" → viewport 1024×960 → tags: arcade, pixel-art, retro, chiptune, ai, html5. Slug `token-hunt` if free.

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

Built by Claude (Anthropic) end to end — code, pixel art, and synthesized audio — designed, directed, and playtested by Alex Modell. No downloaded assets: no sprites, fonts, or sound files. It's an homage to 1980s light-gun arcade games (mechanics aren't protected); no third-party characters, names, screen designs, or artwork appear. The chatbot that heckles you is the joke.

---

## 6. Files

- `index.html` — the whole game, self-contained, host anywhere.
- Playtest link (private artifact) — in the chat.
