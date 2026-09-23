# Outlaw’s Mark — All In

Dead Man’s Bounty has been removed: no cash tokens, separate bounty award, popup, asset load or game-rule entry remains.

On eligible All In paid spins, one regular symbol is marked after landing. Red crosshairs identify every visible instance. The character fires once; all marked symbols become boxed Wilds on the same frame. The resulting board then pays and tumbles normally. Full-column Wilds take precedence; special symbols are not marked.

## Mathematical contract
- Complete-round theoretical All In RTP: 96.2%.
- Mark incidence: 3.83521653% per All In paid spin, including eligible MAX outcomes.
- Eligible outcomes branch into Mark with fixed probability 40%. The aggregate rate depends on the weighted complete-path catalog.
- The marked landing board and converted board are selected before presentation. Every visible occurrence of the selected ordinary symbol is one of the converted positions.
- Conversion uses an existing calibrated substitute configuration, replacing those substitutes with equivalent boxed Wilds. The initial regular-symbol board is evaluated only after conversion.
- Every marked variant retains the original path’s full payout, tumble gravity, feature trigger and connected MAX result. There is no added cash award, balance/history-dependent selection or post-win trimming.
- Mark and sequential Shot Wild conversion do not run on the same board. Both remain available as distinct All In routes. Other modes keep their existing behavior.
- All In’s pre-bounty distribution is restored: 85.37244542% terminal misses, unchanged feature/MAX probabilities and shared cap.
- This is the local demo model, not a certified real-money engine.

## Presentation and lifecycle
Uses the existing character, sound samples, boxed Wilds, smoke, render loop and pause clock. One short caption on the lower wooden rail and crosshairs replace the rejected full-screen popup. No new artwork, video, canvas cache or idle animation loop is added. The roughly one-and-a-half-second timeline includes an aiming hold; Turbo shortens it and reduced motion suppresses impact flourishes. Hidden-tab time cannot advance the conversion.

## Validation
- All 11 Node suites pass.
- 921 eligible ordinary paths, 2,504 symbol variants across all ten regular symbols: exact pay, currency scaling, cap, every matching position, gravity, mode isolation and single-shot behavior checked.
- Eligible connected MAX paths remain capped MAX wins.
- Seeded 50,000-spin sampler produced 1,938 marked spins (3.876%); exact aggregate incidence is reported above.
- Actual browser spins at 1440×900, 393×852 with 4× CPU slowdown, 320×568 reduced motion and 844×390 Turbo passed: visible marks, one shot, simultaneous conversion, correct ledger/balance, pause/resume and cleanup.
- A full-column Wild coexists correctly with Mark. Cash bounty DOM and tiles are absent.
- Existing two-shot wild lighting, full-column landing, expiry and reduced-motion checks pass on desktop and phone emulation.
- Physical iPhone Safari was not available; browser emulation is not real-device certification.

## Demo preview
Menu → Demo Previews → Outlaw’s Mark runs a fixed six-symbol conversion and its winning tumbles without charging or crediting the balance. A separate board snapshot restores the prior symbols, mode and multipliers afterward. Two successive runs passed through the actual menu on desktop and phone, including preservation of an existing paid-round ledger.

## Animation refinement — 2026-09-21
- Target acquisition eases into a firm lock before the single shot. Unmarked cells dim during aiming, then recover after impact.
- The recoil reaches its peak in 35 ms, holds for 45 ms, and recovers into a planted-foot torso brace with cloth follow-through. Ordinary and bonus gunshot timings retain their defaults.
- All selected cells still convert on one frame. An expanding powder wipe conceals the source-to-Wild cut, followed by a 7.5% stamp overshoot and engraved smoke. Synchronized impact and stamp samples reinforce the reveal.
- The caption is lettered directly onto the lower wooden rail. It never covers the logo or paying grid and has no backing panel to linger after the text.
- Mark now completes in 1.53 seconds. Its following win volley fires after 60 ms (scaled by Turbo), preserving bullet spacing, flight times and the single audio burst. Only the first payout following Mark receives this shortened lead-in.
- Pause/resume and Turbo use the same presentation clock. Reduced motion omits the recoil brace, wipe, scale overshoot and camera impulse.

## Refinement validation
- All 12 Node regression suites passed, including held recoil, caption geometry, continuous reveal, synchronized volley timing, exact payouts and mode isolation.
- Desktop, phone with 4x CPU throttling, small reduced-motion phone and landscape Turbo browser runs passed conversion, payout, pause/resume and cleanup checks.
- Desktop and phone menu previews passed two consecutive replays, immediate volley handoff, board restoration and unchanged credits.
- Controlled timeline frames were reviewed from targeting through the win handoff, plus the portrait caption layout.

## Screen flash
Every ordinary Shot Wild gunshot and the single Outlaw's Mark gunshot now trigger the same full-scene cream flash. It peaks at 34% opacity, holds for 18 ms, and fades over 90 ms into the existing warm afterglow. The shared effect coalesces duplicate events, pauses with the game, and is suppressed by reduced motion. Browser checks verified both shots of an ordinary conversion, one Mark shot on portrait, reduced-motion suppression and clean completion. The firing-frame capture was visually reviewed.
