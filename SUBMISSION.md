# Token Hunt — submission copy

Copy-paste ready. Play it: https://token-hunt-seven.vercel.app

---

## Blurb

**Token Hunt** — a light-gun arcade homage where you're a GPU cluster, the dog is a chatbot, and the fakes train on you.

Requests fly in with wings. You have three VRAM per flight to serve them before they time out. Open-weight requests (green) are cheap and slow; frontier requests (purple) pay triple and are harder to catch. Every shot burns compute, so the score is revenue minus cost, and a request served inside 0.75 s pays double: latency is revenue.

Some requests are fakes: grey, glitching ghosts tagged FAKE (the critic calls serving one a hallucination). Serve one and it costs you. And they learn, the way spam learns to game a predictable filter. After every epoch an adversary model reads your habits off your play (which colour you serve most readily, how fast you serve, whether you read its tag) and builds the next epoch's fakes to exploit them: they wear your colour, pass for a real request for your measured serve time (up to a second), flicker their tag once you've learned to read it, and glitch less as the model trains (down to 40% of the time). The epoch card prints what it learned and what it will do next ("SERVE TIME 0.4S -> FAKES LOOK REAL 0.4S"), and when one fools you the game stops to show you the trap. Beat it by breaking your own habits: wait a beat longer, mix up your colours, and give up some of that latency bonus to do it. It's an online opponent model (running statistics, not a neural net), deterministic, entirely in your browser, with no network.

From epoch 3 (epoch 2 on Hard and Daily) a rogue agent swarm dives at your GPU nodes: stop all four before they reach the racks. Every fourth epoch a DDoS attack slides in and keeps rotating its IPs; hit it between rotations, and it comes back stronger each time. Bursts of three arrive with an autoscaled extra VRAM. Every epoch's load changes how you aim: a traffic spike pushes requests sideways, autoscaling gusts shove them around, latency makes them time out sooner, and a viral launch brings 429 strikes that freeze requests mid-air until the rate limit clears. The music shifts key, tempo and layers with the load.

Let a request get away and a smug chatbot rises from the rack row and says, out loud: "As an AI, I can't help with that." It watches what you do (two frontier in a row, your last shot, waiting out a 429, letting a fake go) and says so, while the next wave is already in the air. When you finally run out of memory it reads your receipt back, roasts you with it, makes you a share card, and offers to replay your run at double speed.

Easy, Medium, Hard, and a Daily where everyone gets the same requests (the adversary sits the Daily out, so it stays fair). Easy and Medium also nudge their pace to keep you in the zone; Hard and the Daily stay fixed. A BIOS boot, an attract mode, a WebGL CRT that calibrates itself to your GPU (press C), captions when muted, keyboard play (arrows + Z), a one-hand mode (type THUMB on the title), and deterministic replays. A couple more easter eggs for people who read the source.

Built by Claude (Anthropic) end to end (code, pixel art, shaders and synthesized audio), designed, directed and playtested by Alex Modell. One HTML file, no engine, zero assets, zero network requests: every sprite is hand-pixeled in code, the two bitmap fonts (3×5 and 5×7) are data, the CRT is a shader string, the voice is the browser's own, and every other sound is synthesized live with the Web Audio API. Native 256×240, scaled to fill your screen. Mouse, touch or keyboard.

**Controls:** click or tap to serve · arrows + Z (or X / Enter) to aim and fire · M mute · P / Esc pause · C CRT on/off · 1-4 or the arrows on the title for difficulty (4 = Daily) · Space / Enter to advance.

---

## One line

A light-gun arcade homage where you're a GPU cluster serving winged requests, while the fakes train on your habits to fool you and a chatbot heckles you out loud. One file, zero assets, zero network, built in two days with Claude.

---

## Originality and AI use

Built by Claude (Anthropic) end to end, designed, directed and playtested by Alex Modell. No downloaded assets: no sprites, fonts or sound files. It's a homage to 1980s light-gun arcade games (mechanics aren't protected); no third-party characters, names, screen designs or artwork appear. The adversary is real and inspectable: its whole model is a few dozen lines of the page's source (search for `advTrain`), and every number it acts on is shown on the epoch card.
