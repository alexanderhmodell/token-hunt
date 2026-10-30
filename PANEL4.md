# Token Hunt — blind A/B panel (v4 "K" vs v3.5 "Q", Oct 29, early evening)

Thirteen cold agents, each playing both builds in its own headless browser (no GPU, no audio) for 25–55 minutes with
screenshots, not told which was newer. Ten judge personas, one organizer stream run-through, two "AI selector" simulations
(the organizer pasting the submission into an assistant and asking it to play and rank; both are Claude agents in role).
Build K = v4 (the adversary, FAST bonus, autoscale, boss LV2, 5×7 font, tips, keyboard aim). Build Q = v3.5 (live then).

## Scores

| Seat | K (v4) | Q (v3.5) | Pick |
|---|---|---|---|
| 1 Indie designer | 7.5 · TOP 10 | 6.5 · TOP 25% | K |
| 2 Organizer rubric | 8 · TOP 10 | 7 · TOP 25% | K |
| 3 Phone casual | 8 · TOP 10 | 6 · TOP 25% | K |
| 4 Score-chaser | 7 · TOP 10 | 6 · TOP 25% | K |
| 5 Retro purist | 7.5 · TOP 10 | 6.5 · TOP 25% | K |
| 6 UX / accessibility | 7 · TOP 10 | 6 · TOP 25% | K |
| 7 Streamer | 8 · TOP 10 | 7 · TOP 25% | K |
| 8 ML engineer | 8 · TOP 10 | 6 · TOP 25% | K |
| 9 Games journalist | 8 · TOP 10 | 7 · TOP 25% | K |
| 10 13-year-old | 7 · TOP 10 | 6 · TOP 25% | K |
| Organizer stream sim | 8 · shortlist YES | 6 · shortlist NO | K |
| AI selector A | 8 · TOP 10 | 7 · TOP 25% | K |
| AI selector B | 7.5 · TOP 10 | 7 · TOP 25% | K |

Ten-judge average: **K 7.6, Q 6.4.** 13 of 13 seats would submit K. Side by side, v3.5 dropped from its PANEL3 7.0 to 6.4.

## Why K won (in their words)

- "The only version where the AI theme is a mechanic": the fakes retrain on your habits and show you what they learned.
- The 5×7 face: the critic, tips and rule cards are readable on a phone (Q's 3×5 bubble is ~7 CSS px tall on an iPhone).
- Score decisions: FAST ×2, +1 VRAM on bursts, an escalating epoch-8 boss, keyboard play.

## What every seat said was still wrong with K, and what v4.1 did

| Finding | v4.1 |
|---|---|
| The adversary is narrated, not felt: 0–2 trained fakes per epoch, grey 3 frames in 4 whatever it learned | A trained fake every epoch from 2 (two after you fall for one); it passes for real for exactly your measured time to fire, then glitches in bursts that shrink each version (60 → 50 → 40%) |
| Its insights echo the spawn mix ("SERVE GREEN 67%" = 72% of traffic; "AIM CENTER" = where requests spawn); lanes didn't match | Colour is your serve rate per colour, not a share of traffic; lanes removed; it prints the exact policy ("FAKES GO GREEN" = all of them) |
| "FAKES STAY GREEN", then a purple fake and "YOU LOVE PURPLE" | Fakes wear exactly the printed colour |
| Tag hiding after one dodge; the epoch-4 card re-announced it | Needs 2+ dodges at 75%; the fixed epoch-4 rule only shows with the adversary off (Daily) |
| Any tap skipped the card as line one typed | First tap shows every line, second continues; 5×7, observation in white, response in purple |
| Share card: FRONTIER SERVED printed over MODEL FOOLED YOU | Fixed; score line clear of the panel edge; the bubble tail is a tail |
| Epoch-5 rule 257 px on a 256 px screen | Shortened; a probe checks every card, tip and title line |
| A tip overwrote another in the same frame (the FAKE tip lost) | Tips queue; they sit in the top band now |
| LV2 boss announced "SIX HITS" | Counts the real HP |
| Boss dies before it is on screen (3 s piñata); splinters outlive it | Slides in shielded, then a firewall cycle (icy box = wait, taps free); splinters fall with it; bar clears the icons |
| Bubble over the spawn row in the FAST window; popups stack | Bubble behind the requests, gone 0.3 s into the wave; FAST folded into the score pop; burst and lost-VRAM notices by the VRAM readout |
| Keyboard players never hear the voice | Fixed (the unlock call sat inside a comment since v3.3b) |
| Free spray at the spawn row (free misses for 18 frames) | 8 frames |
| Medium harder than Hard (hidden ramp to ×1.3) | Ramp capped at ×1.12 / +4% fakes |
| Epoch-5 cliff; bursts on an epoch's first wave | Epoch 5 needs 4 of 6; no burst on a first wave |
| Daily diverged after the boss (its splinters drew from the spawn RNG) and after a breach | Boss splinters have their own stream; the burst roll is unconditional; a probe compares two different Daily runs wave by wave |
| Repeated lines ("FIRST TRY..." 7× a run) | No repeats inside the last six; the first-shot line fires less |
| Roast "2 FAKES BUILT... ALL SERVED" with 2 of 9 | "2 OF MY 9 FAKES GOT YOU" |
| "99.9% UPTIME" right after "THE DDOS GOT THROUGH" | A breach or escape voids the perfect epoch |
| Title copy over the rack labels | Shorter lines on a card between the racks; the hook "THE FAKES TRAIN ON YOU." under the logo |
| 'thumb' muted (M); corner icons stole taps after a shot; demo tap started the old difficulty | Fixed |
| HELD arrows survived blur; Esc had no game-over action; share dialog never took focus; hidden input was a Tab stop | Fixed |
| Tally red/green read the same in greyscale | Missed slots are hollow |
| CRT off left the CSS scanlines | Fixed |
| Arp stacked a major triad on D minor; stingers stayed in C | Arp follows the chord; stingers follow the key; a B section (A A B A); 25% / 12.5% pulse leads |
| favicon.ico request | Inline icon |
| The public kit carried internal do/don't notes | Kit moved out of the deployed folder and rewritten |

## Left as is

Jargon (VRAM, EPOCH) is the joke; the bot pops up every wave by design; a one-file 256×240 loop is still a light-gun homage underneath.

---

# Confirmation panel on v4.1 (Oct 29, evening)

Six cold seats on the v4.1 build (after the fixes above), single build, same harness.

| Seat | Score | Placement | One line |
|---|---|---|---|
| Organizer stream sim | 8 | TOP 10, shortlist YES | "Narrowly no as his own pick, strong for the assisted pick." One change: make getting fooled the clip |
| AI selector B (Claude) | 8 | **TOP 3** | "Feature it. Everything pitched exists and works... belongs on the podium" |
| AI selector A (rubric) | 8.5 | TOP 10, strong top-3 contender | "Execution is top-3 calibre"; waiting past the 1.0 s cap beat the model |
| ML engineer | 8 | TOP 10 | Adaptation real and causal: 67/67 trained fakes matched their card |
| Score-chaser | 6 | TOP 25% | Boss a piñata, the card a free tell, no kill screen |
| Phone casual | 8 | TOP 10 | Readable, rewarding; small text and stacked pops at peak moments |

Average 7.75; both AI-selector simulations put it in or at the edge of the top 3.

## Applied after the confirmation panel

- **The gotcha** (organizer's one change): when a trained fake fools you the game holds 0.8 s and shows the trap: "MODEL V3 FOOLED YOU / YOU FIRED AT 0.42S / IT LOOKED REAL FOR 0.60S".
- **Honest model:** dodges count only for fakes that glitched and were on screen 0.67 s; close serve rates go to the colour you serve faster; an unseen colour keeps the prior; SERVE TIME prints your real mean; the burst starts the frame the disguise ends.
- **Arms race:** disguise follows your serve time up to 1.5 s; glitch shrinks to 30% by v6; 80% of trained fakes wear the printed colour ("FAKES 80% PURPLE"), so the card is exact but not a free tell; more trained fakes from epoch 12; the flight window keeps closing from epoch 17.
- **Boss:** rotates IPs (hittable 20 of every 60 frames), splinters that reach the racks cost a VRAM, and it walks off fast once you can't hurt it.
- **Scoring:** a fake costs twice the request it imitates; no free misses; FAST ×2 inside 0.6 s, ×1.5 inside 1.1 s; doubles spawn less predictably.
- **Daily:** 429 strikes come from the seed per wave and tick only in flight.
- Tips by priority and below the 429 banner; mixed waves never praised; game-over panel clears a two-line roast; touch drops keyboard hints; share dialog opaque; one-hand fixes; FINN twice; HUD best on the assisted board.

---

# Re-check panel on the v4.1 final build (Oct 29, night)

Three cold seats on the build that made the trailer, same harness: the organizer stream simulation, a phone casual player on an emulated iPhone 13 with real touch, and a score-chaser (about 20 bot runs, 18 boss fights, long runs to epoch 47).

| Seat | Score | Placement | One line |
|---|---|---|---|
| Organizer stream sim | 8 | **TOP 3**, shortlist YES | "Today it's my assistant-backed pick." One change: when a trained fake fools you, hold and rewind its last second with the disguise peeled off, beside the card line that built it |
| Phone casual | 7 | TOP 10 | Playing in seconds, rewarded at once, the adversary is real; Easy never bites, a tap on < MENU started a run, small grey labels |
| Score-chaser | 7 (was 6) | TOP 10 (was TOP 25%) | The adversary punishes any fixed style, but a lone request was always real, mashing beat the boss, a 429 left only the fake moving, and runs never ended |

## Applied (v4.2)

- **The rewind** (the organizer's one change): the first time each model version fools you, the game dims, rewinds the fake along its path as you saw it, plays it forward as what it was (the grey ghost, tagged, with its own clock), stops on your crosshair and prints the card line that built the trap ("IT LEARNED THIS FROM YOU / SERVE TIME 0.5S -> FAKES LOOK REAL 0.5S"). A tap skips it after 0.33 s and never fires into the frozen sky; later fools by the same version keep the short card; the trap's bill is in its panel. Then one tip: WAIT A BEAT LONGER. THE FAKES GLITCH.
- **The adversary got harder to read:** in the waves it builds, one request (real or fake) may arrive up to 0.7 s late, so a lone request can be the trap; a 429 freezes the fakes too; trained fakes sign their tag (MODEL V3) once they show, and a dodged one says DODGED; a disguise never outlasts 60% of its wave.
- **Boss:** a tap on the rotating IPs bounces (no VRAM or damage, but points and your combo); the openings are 26 frames of every 60, long enough to time, and the icy box blinks before it drops; the firewall tip shows during the fight, never after it; the HP bar never runs over the name.
- **Scoring:** the FAST clock keeps running through a 429; the long game ends (from epoch 26 the flight window closes to 0.8 s by epoch 33); the card prints serve time and disguise from one rounded number.
- **Phone:** game-over MENU and WATCH REPLAY are real 5x7 buttons and a touch on the label works (it used to start a run); pause has a MENU button (and Q); purple vs green reads on the body (saturated wings and a tier-coloured flap); the epoch card's prompt is 5x7.
- **Tips and lines:** FAST only in epoch 1 (it argued with the trained fakes); Easy never suggests Easy mode; Easy's pace may climb a little further (still under Medium's).
- **Collisions:** pops draw above particles; penalties and the swarm banner sit on a dark backing; COMBO sits under its own score pop; boss hits pop beside the boss; the COPIED toast clears the critic.
- New CI suite `ui_test.js` (buttons under real touch, tips, Easy lines, the rewind, the boss's bounced taps, late arrivals, 429, the closing window).

## Left as is

Card-reading still beats snap-shooting (the score-chaser's best line): reading the card and breaking your habit is the counterplay the game teaches, and the model answers by moving the disguise to your new timing up to its cap. Daily keeps Medium's multiplier (each mode has its own best). Touch keeps its larger hit box.

---

# Re-check on v4.2 (Oct 29, late night) and v4.3

Same three seats, cold, on v4.2 (the rewind build).

| Seat | Score | Placement | One line |
|---|---|---|---|
| Organizer stream sim | 8 | **TOP 3**, shortlist YES | "Leaning yes" as his own pick: the rewind landed at 0:35 without the pitch; chat caught the colour line misreading him ("SERVED GREEN FASTER? I shot purple four times") |
| Phone casual | 8 (was 7) | TOP 10 | "That rewind is excellent"; IDLE promised a rest and was the hardest epoch; small 3x5 text; a few overlaps |
| Score-chaser (new seat) | 6 | TOP 25% | Snap-shooting out-earned the adversary (a fake cost 2x its base value, FAST doubled everything); fakes turned sooner than real requests; the boss's hit-stop held its openings open |

## Applied (v4.3)

- **Alex's asks:** a local **top 5 with initials** per mode (seeded, the critic holds the top score as BOT; type or tap the letters; assisted runs never enter; browser only, still zero network); every epoch's traffic comes from a **parody model provider** (CHADGPT 6, GRAWK 5, LOCAL 70B Q4, GEMMY 3 ULTRA, CLAWD 5, WRAPPER.AI) named on the epoch card, in the clear line and in two critic quips each; **PROD DB** from epoch 6, a database on a drone tagged DO NOT TOUCH (shoot it: YOU DROPPED PROD, a big bill, combo reset, the critic asks for the incident commander); **rogue agents** drawn 1.5x with an AGENT tag and a warning card on epoch 3.
- **An honest colour read** (the organizer's one change): the colour it learns is the one you serve first when both are up; with no habit and serve times under 0.15 s apart it prints NO COLOR HABIT -> FAKES 50/50 instead of guessing.
- **Score:** a fake bills twice what it pretended to be worth with combo and FAST included; trained fakes steer like real requests (no early-turn tell); disguises are at least 0.30 s (the card and the rewind agree).
- **Boss:** three hits per opening, then it rotates (the hit-stop no longer stretches an opening); openings by mode (Easy 32, Medium 26, Hard 22 of 60 frames); hit pops beside it in rows, BLOCKED under it, its label on a backing.
- **Readability:** the trap panel goes where the fake's path is not; tips stay off a top panel; the 429 label only when something froze and clear of its tip; the swarm hint without a box over the agents; the lingering critic holds no envelopes; replay skip shows the buttons at once; epoch cards with news hold 2.7 s; IDLE reads LOW TRAFFIC. HIGH STANDARDS.; the signature line ("AS AN AI, I CAN'T HELP WITH THAT.") plays the first time a request gets away, even in a wave where another was served.
- A reload snapshot of one mode's best no longer leaks into the others.
