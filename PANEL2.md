# Token Hunt — cold panel #2 (v2.8 → v2.9)

Four fresh judge agents, no prior exposure to the build or the earlier panel, each playing `dist/index.html` (v2.8, commit 77639ac) in its own browser for 10–40 minutes with screenshots. Scores are theirs; the fix column is what shipped in v2.9 (843c56f).

## Scores on v2.8

| Judge | Overall | One-line verdict |
|---|---|---|
| Phone casual (iPhone 13 touch) | 7 | Fun, polished riff with a great roast card; held back by tiny text, a half-empty screen and a title touch bug |
| Indie designer | 6.5 | Witty, technically immaculate reskin whose best joke runs out before the difficulty arrives |
| AI-tools organizer | 6 | Top-10 craft, not top-3 game, because the AI is paint, not play |
| Hardcore score-chaser | 5 | Polished, fair, readable, but scoring is one lever plus a free pause-aim exploit and an Easy-marathon leaderboard |

Panel #1 (v2.3, earlier in the day) averaged 6.0; this panel averaged 6.1 on v2.8 with harsher personas.

## Findings and what shipped

| # | Finding (judge) | Confirmed in code | v2.9 |
|---|---|---|---|
| 1 | Tap on the visible center of EASY/HARD/DAILY starts the game on Medium (phone) | yes — `titleTap` received the finger-lifted y | fixed: row uses raw y |
| 2 | After 3 straight hits every bubble is one of two streak lines (indie, organizer) | yes — `streak.hit>=3` overrode all pools | fires at 3/6/9 only |
| 3 | Lines ≥44 chars leave before finishing typing; swarm-loss line readable 70 ms (indie) | yes — fixed FOX_LEAVE=60 | dwell scales with length; tap finishes typing, second tap dismisses |
| 4 | "GOOD CALL" never fired in 52 dodges when the real request was also served (organizer) | yes — ranked below hit lines | fires on any clean dodge |
| 5 | Lightning + thunder continue over the OUT OF MEMORY panel (organizer) | yes | gated off at game over |
| 6 | Esc does not close the share card (organizer) | yes | Esc/Enter/Space close it |
| 7 | SHARE CARD / COPY TEXT cover the HUD's bottom row on phones (phone, organizer) | yes — `bottom:-14px` | sit under the cabinet on touch devices |
| 8 | Requests and the guaranteed hallucination spawn behind the rack panels (organizer, indie) | yes — spawn x 10–222 | spawn x 58–198 |
| 9 | Hallucinations look real a third of the time (phone, hardcore) | yes — 1/3 clean frames | 1/4 clean, 2/4 glitched, 1/4 red |
| 10 | Swarm gives no instructions; "THE SWARM WON" after 3 of 4 (phone) | — | "STOP ALL 4 … SHOTS: n" + live AGENTS STOPPED counter; 5 shots on Easy/Medium |
| 11 | Critic runs dry: ~30 lines, pools of 2 (indie, organizer) | — | pools 5–8 + 12 run-aware pools keyed to the last two waves |
| 12 | Pause-aim exploit: pause, aim, unpause, click (hardcore) | yes | sky hidden while paused; 0.4 s READY lockout after resume |
| 13 | 5 pointerdowns in one frame burn 3 VRAM (hardcore) | yes | one shot per 4 frames |
| 14 | Combo never decays on a miss; permanent after six hits (hardcore) | yes | wasted shot halves the combo |
| 15 | Easy marathon beats Hard on one global BEST; perfect bonus unscaled (hardcore) | yes | BEST per mode; perfect bonus × mode multiplier |
| 16 | Daily not deterministic: steering consumed the shared RNG (hardcore) | yes | per-request seeded steering; verified identical spawns with and without shooting |
| 17 | 429 freeze keeps the flight clock running (hardcore) | yes | clock stops while any request is frozen |
| 18 | Plateau: need caps at 5, levels loop, 67%-accuracy script reaches epoch 13 (indie, organizer, hardcore) | yes | rules by epoch: 4 frontier-look hallucinations, 5 bursts of three, 7+ speed/doubles/hallucination rate keep climbing |
| 19 | Receipt line "0 / 4 DODGED" reads as 0 of 4 (phone) | — | "0 SERVED / 4 DODGED" |
| 20 | BEST shows 000000 all run (organizer) | by design on a fresh profile | ticks live when the run beats it |
| 21 | Attract resets the chosen difficulty (organizer) | not reproducible — difficulty persists through attract in the harness | — |
| 22 | Swarm "effectively unwinnable" (organizer) | not reproduced — perfect-aim bot 8/8, ±10 px scatter at 0.5 s/shot 11/12 with 4 shots | 5 shots on Easy/Medium anyway |

## Not changed, on purpose

- Text size on phones (phone judge): the 256×240 canvas scales to the width; larger text means fewer pixels for everything else. Landscape is the answer on a phone.
- Shot cost (hardcore): changing the economy the night before submission is a balance risk with no time to re-tune; the combo halving adds the missing cost to a wasted shot.
- New critic characters or more weather: paint on the same loop. The panel's consistent ask was rules, which v2.9 adds from epoch 4.
- The share card has no URL yet: it needs the Vercel URL from Alex.

## Re-score on v2.9 (four new cold judges)

| Judge | v2.8 | v2.9 | What they still want |
|---|---|---|---|
| Phone casual | 7 | 6 | bubbles readable (fixed in v2.9b), swarm too fast for a thumb (slowed on touch), playfield in the top half (now centered) |
| Indie designer | 6.5 | 6 | bubble dwell (fixed), hallucination tell too obvious for the mimic rule (fixed), cliff at epoch 4 and breach snowball (softened) |
| Organizer | 6 | 6.5 | 429 legibility (banner + red blink added), skip-taps burning VRAM (grace added), re-record the demo with audio (Alex) |
| Score-chaser | 5 | 6 | assist code laundering the BEST (fixed), mode on card/brag (added), combo bank (capped at 5 after a miss), hold-fire incentive (EFFICIENT bonus) |

Different cold agents score with ±0.5 noise, so the honest read is: 6.1 → 6.1 on the first re-score, with the remaining complaints now concrete and mostly fixed in v2.9b. The structural ceiling the panel keeps naming — a light-gun core and no runtime AI — is not something a night of fixes changes.

## Elite merge gate (ELITE.md §5) — v3.0

| Gate | Result |
|---|---|
| 1 build clean, FORBIDDEN extended | pass |
| 2 test / verify / stress / stress2 / elite_test green | pass (one harness threshold line under load; replays identical 3/3) |
| 3 replay determinism 3/3 | pass |
| 4 ≤16.7 ms with CRT on; 2D fallback | pass on a real GPU (M3: full tier, avg 16.67 ms, p95 18.4, none over 20); headless auto-selects the CSS fallback; stubbed WebGL falls back |
| 5 phone: thumb hits, no overflow, first serve ≤3 s | pass (3/3, no overflow, 2.2 s) |
| 6 fresh panel ≥ main on every judge | pass: phone 7 (6), indie 7 (6), organizer 7 (6.5) |
| 7 ≤160 KB | pass (146 KB) |

What the elite-build judges still asked for, shipped as v3.1: the critic no longer blocks the loop (bubble lingers over the next wave), dead epochs end at once, the swarm hint clears the agents' path, bursts actually happen, mid-flight icon taps need precision, and the pitch owns the homage. Still open by design: no runtime LLM (zero-network is the badge), and the light-gun core.

## Verification on v2.9

`test.js`, `verify_v25.js`, `stress.js`, `stress2.js`: all pass, zero page errors. `v29_probe.js` (19 checks: touch mode row ×4, phone button placement, pause-aim lockout ×2, debounce, combo halving, perfect bonus per mode, per-mode BEST, swarm shots per mode, rule unlocks, bubble dwell, Daily determinism): 19/19.
