# Token Hunt — hackathon submission kit

**Deadline: Thu Oct 29, 5:00 PM ET.** Everything below is copy-paste ready. Never type "Duck Hunt" or "NES" anywhere public. Never list the codes (`duck`, `token`, `finn`, `vcc`) publicly; "easter eggs" is enough. Never write NVIDIA, DGX, H100 or any vendor name; the art says "GPU" on purpose.

---

## 1. Submission blurb (paste into the form)

**Token Hunt** — an original 8-bit arcade game where you are a GPU cluster.

Requests fly in with wings. You have three VRAM per flight to serve them before they time out. Open-weight requests are cheap and slow; frontier requests pay triple and fly fast; every shot burns compute, so the score is revenue minus cost. One in seven requests is a hallucination — glitchy, lying — and serving it costs you. From epoch 3, a rogue agent swarm dives at your GPU nodes; stop all four before they reach the racks or one gets in and eats your VRAM for the rest of the epoch. Hallucinations test restraint; the swarm tests urgency. From epoch 4 the rules keep arriving: hallucinations start wearing frontier purple, then traffic comes in bursts of three, then the load just keeps climbing. Every epoch the load changes and it changes how you aim: a traffic spike pushes requests sideways, autoscaling gusts shove them back and forth, latency makes them time out sooner, and a viral launch brings 429 strikes that freeze the requests mid-air until the rate limit clears. The music shifts key and tempo with the load. Miss, and a smug chatbot rises from the rack row: "As an AI, I can't help with that." It watches what you do — serve two frontier requests in a row, spend your last shot, wait out a 429, let a hallucination go — and says so. When you finally run out of memory it reads your receipt back to you — accuracy, best combo, hallucinations served — and roasts you with it. Then it makes you a share card.

Easy, Medium, Hard, and a Daily mode where everyone gets the same requests. A BIOS boot sequence. An attract mode that plays itself if you wait. Open-weight and frontier requests, compute cost, combos, 429 freezes, and a hallucination that is guaranteed to show up in your second wave. A couple of easter eggs for people who read the source.

Built by Claude (Anthropic) end to end — code, pixel art, and synthesized audio — designed, directed, and playtested by Alex Modell. One HTML file, no engine, zero assets, zero network requests: every sprite is hand-pixeled in code, the font is a 3×5 bitmap, and all sound (shots, chiptune loop, packet rain, thunder, the bot's voice) is synthesized live with the Web Audio API. Native 256×240, pixel-perfect scaling, CRT overlay. Mouse or touch.

**Controls:** click or tap to serve · tap to skip the chatter · M mute · P / Esc pause · 1/2/3/4 difficulty (4 = Daily) · Space/Enter advance.

---

## 2. One-line version

8-bit arcade shooter where you're a GPU cluster serving winged requests through traffic spikes, 429 storms, and hallucinations — while a chatbot mocks your misses. One file, zero assets, built in a day with Claude.

---

## 3. Host it on Vercel

**Preferred (one-time, then automatic):** the repo is on GitHub → vercel.com/new → Import `token-hunt` → Framework Preset **Other** → Output Directory **`dist`** → Deploy. Copy the `*.vercel.app` URL. Every later commit redeploys it.

**Quick fallback:** vercel.com/new → drag a folder containing only `index.html` → Deploy.

Open the URL on your phone once: first tap should start the game with sound.

**Optional itch.io mirror** (judges browse there): Create new project → Kind **HTML** → upload `index.html` zipped → "played in the browser" → viewport 1024×960 → tags: arcade, pixel-art, retro, chiptune, ai, html5. Slug `token-hunt` if free.

---

## 4. Demo video (60–90 s, no narration needed)

Record with QuickTime (⌘⇧5) at a ~1000 px-wide browser window so the game is 4× and scanlines show. **Capture system audio** (QuickTime: choose an audio source like BlackHole/Loopback, or record with OBS). The bot's voice chirps and the chiptune are half the charm.

0. **0:00–0:03** Title card over black (add in iMovie/CapCut): **"Built in 24 hours. One file. Zero assets."**
1. **0:03–0:10** Title screen with the bot peeking. Tap → the BIOS boot crawl runs ("4 GPUS DETECTED… CHATBOT ONLINE"). Let it finish once; it's the hook.
2. **0:10–0:30** Epoch 1. Serve two requests (one purple/frontier if it shows), deliberately miss one so the bot says "As an AI, I can't help with that." Let one time out for "504 TIMEOUT."
3. **0:30–0:45** A hallucination appears (glitchy, "??%#"). Let it go — bot: "Good call, that one was made up." Then serve one on purpose for the −500 and "I apologize, that was incorrect."
4. **0:45–1:05** Epoch 2 (VIRAL LAUNCH) arrives on its own ~45 s in: packet rain, a 429 strike freezes the requests mid-air with RATE LIMITED tags, an X2 combo flash.
5. **1:05–1:20** OUT OF MEMORY: the receipt panel, the bot's personalized roast, then tap SHARE CARD and show the 1080×1080 card it generates (on a phone this opens the share sheet; on desktop it opens full-screen — right-click to save).
6. **1:20–1:25** Optional closer: type `duck` on the title and cut as the skin flips to Fowl Weather. Don't explain it.

Console jump to the storm (⌥⌘J), mid-epoch:
```js
__th.round = 1; __th.wave = 6; __th.tally = Array(6).fill('hit'); __th.state = 'fox'; __th.fox.t = 109;
```
Rolls into EPOCH 02 — VIRAL LAUNCH after a round-clear panel (tap to skip). Order is TRAFFIC SPIKE → VIRAL LAUNCH → LATENCY → AUTOSCALE → MAINTENANCE → IDLE. Force a hallucination next wave: `__th.forceHalluc = true` (the second wave of a fresh session always has one anyway).

---

## 5. If asked about originality / AI use

Built by Claude (Anthropic) end to end — code, pixel art, and synthesized audio — designed, directed, and playtested by Alex Modell. No downloaded assets: no sprites, fonts, or sound files. It's an homage to 1980s light-gun arcade games (mechanics aren't protected); no third-party characters, names, screen designs, or artwork appear. The chatbot that heckles you is the joke.

---

## 6. Files

- `index.html` — the whole game, self-contained, host anywhere. `og.png` beside it is the link-preview card (relative `og:image`; Discord/Slack/Facebook resolve it, Twitter wants an absolute URL — update the tag with the Vercel URL once known).
- Playtest link (private artifact) — in the chat.
