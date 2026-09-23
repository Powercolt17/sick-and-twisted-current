# Hang ’Em High

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
