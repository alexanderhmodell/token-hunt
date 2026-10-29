# Token Hunt — final panel (v3.3 → v3.4, Oct 29, 4 PM ET)

Thirteen cold agents, each playing `dist/index.html` (v3.3) in its own browser for 15–25 minutes with screenshots, scored against a ~300-entry field. Ten judge personas, one organizer stream run-through, two "AI selector" simulations (the organizer pasting the submission into an assistant and asking it to play and rank — both are Claude agents in role, not a ChatGPT prediction). v3.4 shipped the fixes listed at the bottom.

## Scores

| Seat | Overall | Placement | One line |
|---|---|---|---|
| 1 Indie designer | 7 | TOP 10 | finished, bug-light, funny, dense; loop flat for four epochs then a cliff |
| 2 Organizer rubric | 8 | TOP 10 | exceptional craft and comedy for one file; loop inherited, AI thematic |
| 3 Phone casual | 7 | TOP 10 | polished, funny, instantly readable on a phone; jargon and fat-finger fakes |
| 4 Score-chaser | 7 | TOP 10 | deterministic sim, replay, daily, per-mode bests; bonus-dominated scoring |
| 5 Retro purist | 6 | TOP 25% | honest grid discipline and SFX; 3×5 font, one loop, scaled not drawn frames |
| 6 UX / accessibility | 7 | TOP 10 | more deliberate accessibility than almost any jam entry; no keyboard aiming |
| 7 Streamer | 7 | TOP 10 | three real set pieces in 90 s; a two-minute loop that stops escalating at 5 |
| 8 ML engineer | 7 | TOP 10 | critic really watches you; the AI layer is a skin and teaches two wrong lessons |
| 9 Games journalist | 8 | TOP 10 | most quotable sentence and fewest bugs in the pile; thin economy |
| 10 13-year-old | 6 | TOP 25% | real fun for a minute; round-3 wall and inside jokes |
| Organizer stream sim | 8 | TOP 10, shortlist YES | heckler reads the actual run; craft tops the three.js median by a mile |
| AI selector A | 8 | TOP 10, defensible TOP 3 for a craft prize | every testable claim held; ceiling is design |
| AI selector B | 7 | TOP 10 | feature it; top 3 only if a prize rewards craft or built-with-AI |

Ten-judge average **7.0** (v2.8 panel: 6.1; v2.9 re-score: 6.1; elite gate: 7.0). Placement consensus: TOP 10, 11 of 13.

## What every seat agreed on

- **Craft is top-3.** Zero console errors in ~60 sessions; replay reproduces runs to the token; Daily identical across browsers; the receipt roast and share card are the demo.
- **The critic is the product.** 35–41 distinct lines seen per judge; run-aware lines land ("TWO FRONTIER IN A ROW. SHOW-OFF.", "RESTRAINT. RARE IN YOUR SPECIES.", "YOU DIDN'T EVEN TRY. HONEST, AT LEAST.").
- **The ceiling is the premise:** a light-gun homage underneath, and no AI at runtime. That is the gap to top 3 and it is not a night's work.

## Fixed in v3.4 (from these reports)

- Signature "AS AN AI, I CAN'T HELP WITH THAT." fires on the first real miss of every run (near-miss no longer pre-empts it; it was once per page load) — the organizer sim's "one change".
- The first storm flight of an epoch is guaranteed a 429 strike (frame 40), so the set piece happens on camera.
- Tapping the lingering critic or his bubble dismisses him free instead of burning VRAM (indie #1 weakness, the kid's complaint).
- Tokens can go negative: every shot and every served hallucination visibly costs; the wave-2 lesson has teeth.
- Perfect epoch requires zero hallucinations served; one-hand mode counts as assisted for the record.
- Typing the skin code no longer toggles the CRT; Enter/Space on a focused share button activates the button; no layout jump at game over; selected difficulty label legible; 429 label clear of the banner; lingering bubble leaves 0.6 s into the next wave; a third roast per pool.

## Left open, on purpose

Keyboard aiming (UX), a boss that escalates at epoch 8 (indie, streamer, score-chaser), speed-up/aggression scoring levers (score-chaser), a drawn-frame boss and a second music section (retro purist), jargon glossary for non-engineers (kid, phone), a voice-only toggle (streamer). All are post-deadline roadmap.

## Recording notes (from the organizer sim)

Boot → let one request time out for the signature line → epoch 2 storm and the 429 freeze → swarm → OUT OF MEMORY receipt and roast → share card. Say "light-gun homage" before chat does. Never type the codes on camera. Test the stream machine has a local English voice; without one the critic falls back to chirps.
