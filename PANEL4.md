# Token Hunt — blind A/B panel (v4 "K" vs v3.5 "Q", Oct 29, 6:20–8:10 PM ET)

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
