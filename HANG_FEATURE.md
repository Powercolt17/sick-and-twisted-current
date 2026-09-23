# Restored original Outlaw Wild — game258

The user rejected the gallows and generated reel-drop experiments. Hang Em High again uses the original assets/outlaw-hanging full-column Outlaw Wild, its existing stepped drop, persistent reel multiplier, and existing upgrade motion. The three-bay gallows, boxed-Wild substitution, replacement character, expanded mobile gallows header, and new capture choreography are no longer active. Original Outlaw artwork also returns to the closing cards. Outcome math and all other features are unchanged. Local port 8771 serves the real game with no experimental injection.

# Hang ’Em High

## Persistent gallows — game257

Supersedes the game256 capture and upgrade choreography below. `hang-gallows.js` renders a three-position gallows from two original transparent assets: weathered timber/iron frame and intact outlaw. OpenArt was signed out; the built-in image generator produced both using the existing slot artwork as reference. Provenance is in source-art/gallows-provenance.txt and source-art/gallows-outlaw-provenance.txt.

A confirmed capture brings the gallows forward over a dimmed scene, reveals the outlaw, lowers the rope, lifts him, catches at 1450ms, releases a small timber-dust accent and settles before docking at 3100ms. The occupied bay persists. The corresponding locked reel displays four approved boxed-Wild tiles and its current multiplier. Normal/other-feature full-reel hangs use their original path and artwork.

Once three bays are occupied, upgrades use Tighten the Noose: pull, catch and reveal the doubled multiplier at 1000ms, then dock at 2450ms. Tension at 400ms and impact at catch are once-only pausable cues; mute is preserved. Paying spins pulse the captured multiplier plates. Mobile uses the gallows above the reels with a 440-unit header. Result cards use the intact new character.

All outcomes remain owned by the existing Hang kernel: three persistent reel locks, additive multipliers, doubling up to 64, existing retriggers, crediting and caps. No new random rolls or payout model changes.

Verification: 26 node test files pass. Two complete desktop/390px phone review iterations finish with three locks, one doubling, 15 spins, the same $1,046.40 scripted award and no asset/runtime failures. Lifecycle checks cover pause/resume, once-only cues, exact count-up, keyboard continuation, restored controls, zero awards and reduced motion. Physical Safari devices and subjective sound balance remain untested.

## Presentation revision — September 23, game256

One continuous feature background replaces the duplicate desktop gallows crop. Portrait Hang gameplay uses a 900-unit viewport, enlarging the six reels while retaining the complete frame. Other features retain their existing view geometry.

Captures have a physical catch, short reel accent and a clear notice above the grid. Upgrades pull the existing figure, catch at 560ms, reveal the doubled multiplier and settle with bounded sway. The affected reel receives a short brass highlight and sparse debris. The combined readout changes at the same reveal. Existing tension, impact and stamp samples are synchronized by the pausable presentation clock; mute is preserved. No generated media or outcome changes were introduced.

The ending has sequential outlaw cards, a 1.5-second exact award count-up after a short lead-in, and a Sentence Served stamp. Hidden tabs pause the count-up; reduced motion skips it. The continuation button has keyboard support and restores the underlying controls after exit.

Validation: all 25 node test files pass; two complete desktop/390px-phone walkthrough iterations finish with three locks, one doubling, 15 spins and the unchanged $1,046.40 scripted award. No runtime errors or failed assets. Lifecycle checks cover a paused reveal, once-only impact, paused count-up, exact final cents, keyboard dismissal, restored controls, reduced motion and zero payout. Final desktop/phone stills and upgrade frame sequence inspected. Physical devices, Safari and subjective sound balance were not tested.

Starts with twelve free spins and up to three permanent full-reel Wilds. The first capture arrives by spin three. Captures enter at ×8. After three locks, further events double a non-maxed lock, up to ×64. Captures and upgrades can happen on a new spin or after a paying tumble. All locks survive wins, TNT, tumbles, later spins and retriggers. Multipliers add together; Win Boost remains 1×.

Three or more visible scatters on an unlocked, final settled board award three extra spins, once per spin. Up to four retriggers are allowed, for a maximum of 24 spins. The counter updates at the +3 FREE SPINS announcement, before play continues. The completed-spin count includes all extra spins.

Symbol groups need a regular instance of the paying symbol in their connected reels. Locked columns are excluded from clear cells and gravity. MAX remains inactive.

## Mathematics

`hang-kernel.js` constructs complete seeded trajectories including all tumble captures and retriggers. Candidate parameters are 30% spin-start event checks, 8% checks following a paying tumble, and 4% scatter draws while retriggers remain available. These are generator parameters, not the final marginal gameplay probabilities: complete paths receive fixed calibrated weights.

`tools/bake-hang.mjs` reproduces the 12,000-entry catalog. `hang-math.js` uses a fixed payout shoulder of 0.75 feature-buy costs and power 4, then calibrates its tilt to 96.40% of the 499× purchase: 481.036× expected return before cent rounding. Purchased and naturally triggered features use the same distribution. Selection never uses balance, previous results, bet size, timing, turbo or player history. Candidate generation rejects nonterminating paths and totals above 60,000×; it never changes a displayed win. The other modes retain their existing feature EV. This is an uncertified demo-credit model.

Weighted audit:
- Median return: 74.3888% of the feature-buy cost.
- Below half the buy: 17.4259%.
- Half to three quarters: 33.2277%.
- Three quarters to below the buy: 22.8931%.
- One to below five buys: 25.6977%.
- Five buys or more: 0.7557%.
- At least one retrigger: 20.1517%; average duration: 12.6706 spins.
- At least one tumble capture/upgrade: 21.8599%.
- All three locks reached: 26.0659%, compared with 7.6160% previously.

These are distribution statistics, not guaranteed returns per feature. More weight on ordinary returns reduces the frequency of very large payouts at the same RTP.

## Validation

`node --test tests/*.test.mjs` checks all 12,000 Hang trajectories, exact catalog awards, remaining-spin accounting, all retrigger limits, lock persistence, upgrades, gravity, terminal boards, TNT, boxed-Wild equivalence, currency rounding, caps and the other modes' existing RTP tests. Browser verification uses desktop and throttled iPhone-sized Chromium layouts; this does not substitute for physical iPhone Safari testing.
