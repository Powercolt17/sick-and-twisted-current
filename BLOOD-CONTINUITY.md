# Blood Money continuity update — 2026-09-23

This checkout is the current-account continuation of the approved game. The user
explicitly requested a new private Site after the old account's project was not
accessible. Use this checkout's .openai/hosting.json, not old IDs in historical docs.

## Requested and implemented

- The existing lit cigarette now stays attached to all 32 mouth poses during the
  rightward draw, aim, recoil and return. It uses the same torso deformation as
  the figure and retains ember/smoke, mute-independent visual behavior, background
  motion and reduced-motion behavior. No replacement character artwork was used.
- A stage-clearing kill retains the fully drawn gun while the enemy reaction
  finishes. The target consumes that held pose once, rotates the existing aim
  upward over400ms, fires at the existing560ms cue, and then holsters once.
  There is no second draw from idle and no second holster-draw sound. Standalone
  nonlethal enemy shots and the final-tier kill retain their normal return.
- +2 FREE SPINS matches the user's Recording2026-09-23 141252.mp4 and the approved
  target preview: floating cream Georgia text, larger+2, gold BOUNTY CLAIMED label,
  thin side rules, soft shadow and bottom placement. No wooden dialog or duplicate
  popup. It enters after the target settles at3320ms, once per stage advance.
  Held lower rolls still grant two spins and say HIGHER MULTIPLIER KEPT.
- A much stronger struck-steel ding plays on target contact at655ms: a short
  noisy strike and five inharmonic decaying resonances. It uses the existing
  master mute/limiter. Nodes disconnect at completion; no audio file was added.

## Verification

- All24 Node test files passed. Added continuous held-gun/raised-target/one-return
  checks, mouth registration, reaction cleanup, one-time handoff and cancellation.
- Full desktop and phone-emulated walkthroughs:12 spins, two+2 grants, final4×,
  $42.90 reward, $10,042.90 balance, no runtime or missing-asset errors.
- Desktop live-clock sampling verifies frame31 after kill contact and a raised
  target timeline. Reviewed held-kill, retarget and target-fire captures.
- Five viewport layouts and all five faces, held10×, pause, reset and reduced
  motion passed. Narrow-screen entrance width leaves room for the scale accent.
- Offline Web Audio render: peak0.400609, first200ms RMS0.082239, no clipped or
  non-finite samples, silent ended tail, exact zero output through mute. These
  are signal checks, not a claim of subjective listening or real-device testing.

Source modules: blood-cigarette.js, blood-gunslinger*.js, blood-duel.js,
blood-target-audio.js, blood-promotion.js/.css and game.js. Cache entrygame254,
gunslinger2, gunslinger-motion2, duel6, promotion6. Odds/payouts are unchanged.
Verification artifacts remain outside dist in ../work/continuity-*.
