# Blood Money Ringleader hotfix and reference panels — game259

Ringleader now accepts three real paying-target hits, including the existing death reaction on hit three. Final-stage health 0–3 maps to canonical catalog index 6; no payout, seed, multiplier odds or extra-spin changes. No rewards after final death. Tests/blood-ringleader.test.mjs exercises real resolver→timeline→duel across normal/Turbo/reduced motion and terminal-state catalog invariance. All 27 tests pass; the complete browser walkthrough reaches Ringleader defeated, 12 spins and $42.90.

Entry and receipt follow user-supplied reference artwork, with the game's existing backdrop kept. Receipt values and target remain live. See BLOOD-HOTFIX-259.md for asset provenance and QA. Hang enhancements are paused outside this checkout in work/hang-enhancements-paused; do not publish them as part of this fix.

# Restored original Outlaw Wild — game258

The user rejected the gallows and generated reel-drop experiments. Hang Em High again uses the original assets/outlaw-hanging full-column Outlaw Wild, its existing stepped drop, persistent reel multiplier, and existing upgrade motion. The three-bay gallows, boxed-Wild substitution, replacement character, expanded mobile gallows header, and new capture choreography are no longer active. Original Outlaw artwork also returns to the closing cards. Outcome math and all other features are unchanged. Local port 8771 serves the real game with no experimental injection.

# Current: Persistent gallows — game257

Hang now has its own generated three-bay gallows and clean character sprite. Confirmed captures use a 3.1s rope/catch/lift/settle sequence, then dock beside the reels (above them on phones). Captured reels become four boxed Wilds; the old full-reel hanging art remains in other modes. After three captures, the 2.45s Tighten the Noose sequence reveals the doubled value at 1000ms. See HANG_FEATURE.md. Math and payout rules are unchanged. All 26 tests, two full desktop/phone iterations and paused/reduced/keyboard lifecycle checks pass. Cache game257.

# Previous: Hang presentation revision — game256

Hang now uses a continuous background, Hang-only portrait crop, combined multiplier readout, pausable rope-pull/catch at 560ms, highlighted upgraded reel and delayed multiplier reveal. The result has staged cards, exact count-up, stamp and keyboard continuation. Read HANG_FEATURE.md. All 25 tests and complete desktop/phone feature walkthroughs pass. Rules, payouts and Blood Money are unchanged. The static payload remains close to the hosting limit.

# Current: weighted death / separated reward / pitched scatter sound

Read the current polish revision in BLOOD-CONTINUITY.md first. Game255 is the latest authored source.

# Current account: cigarette / continuous kill-to-target / bottom spin reward

Read BLOOD-CONTINUITY.md first. It supersedes prior target choreography and reward-layout notes. Use this checkout's hosting manifest for the new private Site. Game entry v254; all 24 checks pass.

# Sick & Twisted: project handoff (AGENTS.md)

## Current shared quick draw and random multiplier — 2026-09-23
Supersedes the fixed1→2→4 rules and first target implementation below. Blood Money
uses a registered32-frame rightward draw from the exact original idle for BOTH
the target and enemy shots. Fire560ms; actual muzzle and enemy impact agree.
The solid target spins three times, slows to reveal and then grants its+2-spin
moment. Starts1×; rolls2/4/6/8/10 at69.5/20/7/2.5/1%, keeps the higher result;
two advances, one+2 grant each. Outcome resolution owns the roll. The12,600 seeds
are retained and their new multiplier branches are included in the fixed96.7%
demo return model. See MULTIPLIER-TARGET.md and tools/blood-hero/PROMPTS.md.
All24 tests and desktop/phone walkthroughs pass. Native asset conversion and
local Edge verified; physical phones, Safari and sound balance remain untested.
Cache game253. The static payload remains close to256MiB: check before adding art.


## Shooting target multiplier - 2026-09-23 (current)
The approved OpenArt iron target replaces the standalone timber board below.
Its support stays fixed above the right lantern. Each stage upgrade triggers the
existing hero's shot, a tracer and metal impact, two vertical end-over-end flips,
then a damped catch at 2x or 4x. The current face changes while turned away.
All motion uses the bank's pausable clock. The +2-spin panel enters at 900ms;
presentation ends at 3600ms. Mute/reduced motion and reset are respected.
Full local desktop/phone feature runs and five viewport layouts pass, with two
grants, twelve spins and the unchanged $42.90 scripted return. Physical phones,
Safari and subjective sound balance remain unverified. See MULTIPLIER-TARGET.md
for asset provenance and verification. Cache: game252, blood-promotion4, target1.
The expanded static payload is near the 256 MiB limit; check before adding media.

## Standalone multiplier backboard - 2026-09-23
Supersedes the carved counter below. A generated transparent timber sign sits in
the open upper-right space above the oil lantern. It shows WIN MULTIPLIER and only
the current 1x, 2x or 4x value. No tier ladder remains. The upgrade uses the bank's
pausable clock: number impact at 520ms, board recoil, brief warm flash, debris and
dust, plus a once-only sound/camera cue. Reduced motion removes movement/particles;
mute is respected. Stop/start clears effects and restores 1x. The existing +2-spin
reward and payout rules are unchanged. See MULTIPLIER-BACKBOARD.md for provenance.
Five viewport checks passed (320px portrait through 1564px desktop), including
effect reset and paused-clock stability. Desktop and phone-emulated full runs
retained two grants, twelve spins, 4x final boost and the $42.90 scripted return.
Physical phones and Safari remain untested. Cache: game251, blood-promotion3.

## Carved multiplier - 2026-09-23
The Blood Money multiplier now sits directly on the original header timber on desktop.
The separate brass plate, outline, bolts and ladder are removed. Recessed, warm cut
lettering follows the timber's angle. Phone headers use a rough crop of the approved
title timber with the same engraving treatment. Only presentation and cache versions
changed; stage rewards and payout rules are unchanged. Five viewport layouts checked
from 320px portrait to 1564px desktop, with no text overflow or failed assets.
Current cache entry: game.js?v=250; blood-promotion.js/css?v=2.

## Blood Money progression — 2026-09-23
Blood Money now starts at 1x, advances to 2x for the Gunfighter and 4x for the
Ringleader. Each of the two target advances awards +2 free spins once, extending
the eight starting spins to twelve when both targets are cleared. The winning
kill tumble uses its old multiplier; subsequent tumbles use the new stage.
`blood-rules.js` owns the rules and duplicate-grant protection. `blood-promotion.js`
and its CSS draw the persistent upper-right multiplier and 2.8-second reward moment,
using the bank's pausable clock. The phone header keeps the badge above the reward.
The briefing and rules explain the ladder; the receipt shows actual spins played
and the final multiplier. The 12,600 existing catalog seeds and their terminal
states were retained and repriced. The full extra-spin model retains the existing
fixed 96.7% demo return target. No player history enters the sampler.
All 22 Node test files pass. Full desktop and phone-emulation walkthroughs verify
two grants, 12 played spins, 4x final stage, exact $42.90 walkthrough return and
clean reset. Five viewport layouts plus reduced-motion presentation checked.
Cache entry: game.js?v=249. Physical phones and Safari are not tested.

## Previous Sick and Twisted 2 revision
Blood Money's briefing and closing receipt now use live responsive HTML/CSS (`blood-briefing.js`,
`blood-receipt.js`, `blood-contract.css`) on the approved wood texture. The former baked briefing
and receipt plate renderers are historical. `blood-bank.receiptSnapshot` supplies the pausable
presentation clock; payout logic is unchanged. Phone dialogs use the full safe viewport.
All 21 test files and complete desktop/phone-emulation feature runs pass; see ANIMATION-QA.md.
Current cache entry is game.js?v=248. Dialog edges now use the approved painted reel timber.
The closing screen has a distinct BOUNTY PAID layout; the seal contacts at the existing stamp cue.
This saved project now publishes separately at https://sick-and-twisted-2.bracarty17.chatgpt.site (owner-private).
The export handoff below is historical. See ANIMATION-QA.md and tools/blood-duel/README.md for the current
animation implementation and verification. The old Rustler replacement recommendation was investigated
and rejected due to broken pose joins; do not swap those clips in without another visual review.
Native MP4 playback is now checked in Edge. Real-device/Safari performance remains unverified.


Export date: 2026-09-22. Handoff from Claude to ChatGPT. CLAUDE.md is an identical copy of this file.
Live deployment: Cloudflare Worker green-sound-27d0 (bracarty17.workers.dev), deployed by uploading
sick-and-twisted-site.zip (the contents of dist/) as a new deployment, then hard-refreshing and checking the
page loads game.js?v=244. Older live reference: https://sick-and-twisted.bracarty17.chatgpt.site

## State at this handoff (read first)
- NEW: the Blood Money duel (dist/blood-duel.js) replaces the wanted board entirely on desktop and tablet. Full
  description in "Current approved behavior" below; art pipeline and every OpenArt id in tools/blood-duel/README.md.
- Tested in headless Chromium against the real game (tools/headless/): the scripted walkthrough takes the Rustler and
  the Gunfighter through all three shots each and brings the Ringleader to the doorway; the Ringleader's three shots
  were driven directly; no runtime errors. All 19 tests in tests/ pass (node, each exits 0).
- NOT verified: real iPhone/Android FPS, Safari, and the MP4 path (headless tests used VP9 copies of the videos).
- Open items, in priority order:
  1. Rustler continuity: his shipped kneel/kill clips move the shoulder wound to the other shoulder. Replacement
     clips exist in the user's OpenArt account (hsrtzbIBlR7Vtk3VSJjo, lwBtAaJBwc5Rjw7H6XjY); see
     tools/blood-duel/README.md "Open item" to swap them in.
  2. The doorway clean plate (dist/assets/blood-duel/doorway.webp) is hand-built; the shelving inside repeats a
     little. An OpenArt clean plate of the Blood Money film frame would be better.
  3. Phones keep the header poster (phone layouts never draw the gunslinger); the duel is desktop/tablet only.
  4. The scripted walkthrough ends before the Ringleader's stamps; a longer script would show all nine shots.
- The user's standards: every change is judged inside the real Blood Money scene; characters must stand on real
  surfaces at correct scale and light; every wound and dropped prop must carry forward across clips; smooth motion
  (no pops, no hitches); fast iteration. Measure, don't claim.

## Instructions for the assistant
Continue this existing project (previously worked on in ChatGPT, then Claude, now back to ChatGPT). Read this guide and inspect the actual source before editing. Preserve the approved gritty Western artwork, six-reel/four-row layout, gameplay and outcome math. Make focused changes rather than rebuilding the game. The user wants polished mobile presentation, strong scatter landings, clear sound, and reliable performance. Ask what to change next if no new task is supplied. Do not claim visual or audio quality, real-device FPS, or test results that you have not actually checked.

## Delivery
- Sick-and-Twisted-Complete-Project.zip contains all 427 tracked files from the source snapshot, with current handoff documentation replacing stale export metadata. The previous handoff and metadata remain under export-history/ for provenance. All runtime assets and outcome catalogs are included.
- This handoff is also CLAUDE.md inside the ZIP.
- Sick-and-Twisted-Readable-Source.md provides application code, tests, and configuration as text for chat context. Generated outcome catalogs and binary assets are in the ZIP, not repeated in the text companion.

Extract the ZIP into a coding workspace. If your Claude interface does not accept ZIPs, upload the two Markdown companions for context and make the extracted project available to Claude Code or its coding environment. The text companion alone is not a runnable replacement for the ZIP.

## Run
`dist/` IS THE AUTHORED SOURCE. Do not delete it or assume a separate src/ tree can rebuild it.

From the extracted Sick-and-Twisted directory:
```sh
python -m http.server 8080 --directory dist
```
Open http://localhost:8080/. This route needs no package installation.

For Vite development:
```sh
npm ci
npm run dev
```
The package lock pins dependencies. Use a Node version compatible with the included Vite release. There is no npm build script. Serve dist/ directly for static hosting. Adapt the Vite allowedHosts setting only for the chosen development environment. File URLs will not work reliably with ES modules and asset loading.

## Current approved behavior
- Mobile: character hidden; centered slot with key scene details visible around it; mobile scene crops and cached detailed ground backgrounds. Desktop character remains. Keep all mode-specific scenery.
- Performance: static raster caches and a mobile render budget are present. The user wants stable 30 FPS or better on mobile. Actual iPhone FPS has NOT been measured; verify on a device before making performance claims.
- Scatter teases: two landed scatters activate the shared anticipation system. Three and four scatters may continue teasing for four and five. No fake scatter symbols or altered outcomes.
- Rope art: transparent OpenArt burning-rope atlas at assets/bonus-tease/burning-rope-atlas.webp. Both sides of each active lane use it. Concurrent cascade lanes have separate burn clocks and vacancy heights. Do not revert to old line/spark rails.
- Cascade tease: survivors fall first, genuine incoming tiles fill the vacant upper spaces. Incoming tiles descend visibly before landing. Every active refill lane can display ropes concurrently.
- Rope sound: assets/bonus-tease/rope-burn.wav, supplied by user. One prominent shared natural-speed looping voice follows the tease, with music ducked beneath it. Do not stack one burn loop per lane.
- Miss ending: assets/bonus-tease/rope-fizzle.wav plays once after the final settle for an unsuccessful two-scatter tease. It must not fire on feature wins or cancellation.
- Feature confirmation clips (new, 2026-09-21): after a scatter trigger settles and the existing 900 ms confirmed-board beat, a user-approved Seedance 2.0 clip of the scatter outlaw dying plays on every confirmed scatter cell via dist/scatter-death.js, then holds its dead frame until the feature clears it. The deaths escalate with the trigger. Blood Money (3 scatters, assets/scatter-death/blood-money.*): shot; the four impacts (460/1290/2000/2670 ms, measured frame by frame) each fire the game's revolver sample (`shot`, panned to the cells) and an impact-motion kick. Hang ’Em High (4 scatters, hang-em-high.* served as ?v=2, the thick-rope take that replaced the first, subtler hanging): a heavy noose drops and hangs him; cues at 200 ms (drop: `tension`), 620 ms (cinch: `slam` + `rip`, kick), 2150 ms (dead: low `tension`). Hell to Pay (5+ scatters, natural trigger and the purchased entry board, hell-to-pay.*): he burns to a flaming skull; cues at 950 ms (ignite: the tease's `ropeBurn` one-shot), 1420 ms (flare: `impactw`, kick), 2600 ms (skull: `stamp`, kick). No new audio files were added; the hang and hell cues reuse approved samples and can be swapped in the onCue handler in game.js. All clips are 576×576, silent, 5.04 s, mp4 with a webm fallback; one video element per clip feeds all cells. A spin press skips to the dead frame; hidden tabs pause; Turbo plays at 1.5×; autoplay refusal or a load failure skips the clip and the feature continues. Runs for natural triggers, feature buys and menu demos. The scatter landing, slam, sounds and rope tease are unchanged, as are all feature intros and math. The old procedural burn in live-scatter-burn.js is still imported only by the dormant hell-intro.js poster engine. Original Seedance generations with audio live in the user's OpenArt account; only the silent game encodes are bundled.
- Feature buys (2026-09-21): the confirmation step is gone. Pressing BUY FEATURE on a shop card charges the price and starts the feature in one press (shop.js buyNow). A balance that cannot cover the price buys nothing: the button flashes red and the status line reports the price and balance. The confirm-view markup and CSS remain in index.html/shop.css but are no longer opened; the rules copy in game-info.js was updated to match. Double-press protection is kept.
- Blood Money briefing, contract poster and receipt (2026-09-21): the artwork is four OpenArt (Nano Banana Pro, 2K, scatter as style reference) plates in assets/blood-plates/ (briefing.webp 1623×2440, poster.webp 1475×2647, receipt-card.webp 857×1430, receipt-ledger.webp 1694×1427), generated on flat green and keyed to alpha. Static lettering is painted (WANTED, DEAD OR ALIVE, the 4× BOOST sticker, dashed 01/02/03 circles, FREE SPINS / REWARD labels, HUNT. COLLECT. UPGRADE. and its copy and button, CONTRACT CLOSED, REWARD PAID, 8 FREE SPINS COMPLETED / 4× BOUNTY BOOST) and the plates are blank where values are live. blood-contract.js PLATES holds the band rectangles in plate pixels; heroPlate/receiptPlate draw the plate, the live portrait into its frame, Rokkitt 900 slab text into the name, crime, count, next, spins, reward and amount bands, and red seals over the dashed circles for earned stamps. The briefing card (blood-briefing.js + blood-contract.css) is the briefing plate with the game's Rustler portrait positioned into its empty frame and an invisible hit area over the painted BEGIN THE HUNT button; live markup stays for screen readers; the card fills 96% of the stage height on desktop and the whole stage on portrait phones. Vector renderers remain as fallbacks and for the phone header and compact receipt. If the constants painted into the plates ever change (8 spins, 4× boost), regenerate those plates.
- Blood Money in-feature display (2026-09-21, approved via preview pages): dist/blood-wall.js (presentation only) draws one big WANTED poster of the current target, using the outlaws' own approved poster art (assets/ink-western/{rustler,gunfighter,ringleader}.webp), hung on the OpenArt oak board (assets/blood-wall/board.webp; BOARD table gives the nail and poster placement as fractions). Stamps are shots, timed off the bounty timeline: during the last WALL_TIME.flight ms before `land` the approved muzzle flash (assets/blood-wall/flash.webp) fires at the board's left edge and the approved bullet (bullet.webp) crosses to the next hole; at `land` the whole poster flashes for 70 ms, the point of impact burns bright for 120 ms, a puff (puff.webp) and twenty-six paper slivers fly under gravity, the poster jolts hard on its nail (spring), an impact-motion camera kick fires (game.js setTimeout at T.land) and a painted bullet hole stays at a fixed position per outlaw and stamp. Holes are drawn to read at 50 px: a scorch ring pressed into the paper, the torn-rim sprite (hole-0/1/2.webp) multiplied in so it darkens rather than lightens, and a black puncture at the centre. The bullet sprite is not used in flight (invisible at speed); a bright tracer streak with a glowing head runs from the muzzle flash to the hit during WALL_TIME.flight (140 ms). The revolver sample fires at the flash (game.js setTimeout at T.land minus flight) and the old stamp cue plays nothing. On the third hole the timeline's turn window (portraitDuration = WALL_TIME.turn = 1300 ms) runs the roll-up (pageRoll): the finished poster rolls up from its foot into a shaded paper tube that climbs to the nail (the tube face carries the page image, cylinder shading, ragged ends, and throws a shadow on the next outlaw's poster already beneath) for 80% of the window, then the roll tears off and drops away for the last 20%. It stays inside the board and reads at any size; the rip sample plays at T.turn+120. window.__wallLog, if set, records per-frame flight/impact/turn values for debugging. Free spins and winnings stay in the HUD; nothing else is drawn there. Desktop: the board fills the dock (side box). Portrait phones: the poster sits in the header strip's left lane (the dock is never drawn there: blood-bank mobile() is true when the shell layout is portrait). blood-bank.js maps timeline state to the wall (wallState/drawWall; appearance() supplies flight and impactAge) and no longer draws the flying stamp; docking, briefing, receipt and the upgrade banner are unchanged. The debug object exposes bloodBank.focused so event presentation can be captured. The scripted Blood Money preview (#blood-preview) is the fastest way to review the sequence.
- Blood Money duel (2026-09-22, in review): dist/blood-duel.js (presentation only) replaces the wanted board entirely on desktop and tablet: no board in the briefing, no dock fly-in (blood-bank drawDocking {board:false}), no fallback board. The wanted outlaw stands on the bank porch of the Blood Money film, in the doorway the money-bag robber fills; assets/blood-duel/doorway.webp (hand-built clean plate in film pixels, doorway.json) is laid over the film for the whole feature. Each outlaw has his own three Seedance 2.0 clips (start/end-frame chained so every wound and dropped prop carries forward; keyed, scene-graded to the robber he replaces, lantern-lit, baked into assets/blood-duel/{rustler,gunfighter,ringleader}-{hit1,hit2,kill}.webp). duel.json holds per outlaw: scale, anchor, wound points, and per clip the frame timing, per-frame scale multipliers and the measured impact time. Rustler: shoulder, knee, head shot. Gunfighter: draws and has his gun hand shot out (revolver stays on the porch), gut shot, pulls a second gun and is shot in the chest, spins, face-down. Ringleader (carries the money sack): thigh shot and drops the sack, chest shot and stays standing laughing, heart shot, both knees, face-first. When a clip has a lead-in (the Gunfighter's draws) it starts first and our gunslinger's draw is held so the round lands on the measured impact frame. Each stamp: presentBounty calls bloodDuel.hit before collecting; our gunslinger draws on a dedicated createScreenShootout instance; the stamp is collected as the round lands; the third shot always kills in bullet time (duel clock 0.22x, canvas CSS grayscale). The dead man lies 2.6 s, then the next outlaw fades into the doorway; after the Ringleader the doorway stays empty. The duel follows bloodBank.state every frame. Phones keep the header poster. Scripted review: startBonus(8,'DEAD',0,true) with ?debug=1 (window.__bloodDuel.debug); the walkthrough reaches the Ringleader but ends before his stamps, so drive him with window.__bloodDuel.start(2,0) and hit(n,kill) on the briefing screen.
- Oil lantern (2026-09-21, approved via preview page): dist/lantern-light.js draws the OpenArt bracket and lantern (assets/lantern/{bracket,lantern}.webp; hook, pivot and flame points in the BRACKET/LANTERN tables) bolted to the reel frame's right post (position derived from G exactly as reel-frame.js derives the post), drawn right after reelFrame.border() and before the brand figure. A damped pendulum on the hook with a faint breeze plus a 3.5° idle sway, a two-speed flame flicker, a warm additive spill on the post and scene and a glow on the glass. impactMotion.kick is wrapped in game.js so every camera kick nudges the lantern; the Blood Money landing nudges it too. Ambience only, no game state, honours reduced motion (no swing).
- Ground dressing (2026-09-22): four OpenArt ground props (crates, casings, grave, campfire) and dist/ground-props.js were added and then removed the same day at the user's direction; nothing of them remains in dist. The ground strip below the rails is the approved backdrop only.
- Full-screen presentation (2026-09-22): a desktop cover layout with mirrored/blurred side wings was tried and removed the same day at the user's direction; the stage is back to the original centred, height-fitted layout with plain dark sides. An OpenArt outpaint of assets/ink-refined/frontier.webp to 21:9 was generated (historyId cbouni9eYmlm9Ahidzwo) but not used; if painted wings are ever wanted, that render is the starting point. index.html links style.css?v=17.
- Scatter landing: scatter-slam.js supplies contact compression, tight rebound, dust and camera impulse for newly arriving scatters. Existing scatter symbols must not re-slam during a refill. Reduced motion suppresses the effect.
- Latest scatter audio: assets/sfx/scatter-impact-a.wav and scatter-impact-b.wav are the two user-approved supplied effects. Measured output loudness is approximately -10.99 and -11.02 LUFS. Each scatter independently selects either sample, with playback rate .95 or 1.05 (exactly minus/plus five percent). Start at offset zero on contact, including multiple simultaneous scatters. Old Western scatter audio and the extra slam audio layer are no longer active. Master mute and limiting remain.
- Latest pacing: normal spins/refills take roughly 12% longer. NORMAL_SPIN_MOTION reserves 480 ms scatter spacing and 90 ms additional travel per extra scatter in a column (before scale). Turbo remains on the original timing; feature-buy entry timing is separate. Same-column symbols still arrive as part of their real reel strip; do not describe this as independent row-stop logic.

## Key code
- dist/game.js: render loop, audio loading/mix, controls, round orchestration, reel and cascade call sites.
- dist/index.html and dist/style.css: UI and layout.
- dist/reel-motion.js: reel trajectories and contact scheduling; NORMAL_SPIN_MOTION vs REEL_MOTION vs FEATURE_BUY_MOTION.
- dist/tumble-motion.js and cascade-kernel.js: refill presentation and exact gravity mapping.
- dist/scatter-anticipation.js: actual landed-scatter state, rope drawing, success/miss completion cues.
- dist/scatter-audio.js: random sample choice, per-hit pitch and voice management.
- dist/scatter-slam.js and impact-motion.js: landing and board motion.
- dist/blood-wall.js: Blood Money target poster, shots and page turn (presentation only).
- dist/blood-duel.js: Blood Money duel on the bank porch (presentation only; desktop and tablet).
- dist/lantern-light.js: the swinging oil lantern on the right post (ambience only).
- dist/scatter-death.js: feature confirmation clips (Blood Money shooting, Hang ’Em High hanging, Hell to Pay burning) on the confirmed scatter cells (presentation only).
- dist/mobile-view.js, mobile-render-budget.js, mode-background.js, feature-scenes.js, and related scenery modules: mobile scene composition and rendering cost.
- dist/math.js and generated *catalog*, *paths*, cascade-data modules: authoritative game rules and outcomes. Keep unchanged for cosmetic work.
- dist/blood-*, hang-*, hell-*: feature-specific math and presentation.
- dist/assets/: all shipped imagery, fonts, sprites, video, sound and music, including retained historical assets. Trace active imports before removing anything.

## Verification
Recent focused checks passed before this export:
```sh
node tests/normal-spin-pace.test.mjs
node tests/scatter-audio.test.mjs
node tests/scatter-slam.test.mjs
node tests/scatter-tease.test.mjs
node tests/scatter-death.test.mjs
```
After the scatter execution changes, all 19 test files in tests/ were run individually and passed on Node 22. Headless Chromium (Playwright) checks with forced boards passed: three scatters at 1440×900 and an iPhone-sized 390×844 layout (Blood Money clip on the three cells, hold, hand-off to the intro) four scatters at 1440×900 (Hang ’Em High clip on the four cells, hold, hand-off), five scatters at 1440×900 and a purchased Hell to Pay through the actual shop dialog (Hell to Pay clip on the five cells, hold, hand-off), with no runtime errors. That Chromium lacks H.264, so those runs exercised the WebM fallback; the MP4 path and physical iPhone Safari playback were NOT verified in this environment.
Other tests are included in tests/. Do not claim the whole suite passed merely because it is present. Some older implementation notes are historical; current source wins over those notes. Do not run catalog-generation tools as routine setup.

Development URL `/?debug=1&intro=0` exposes window.__sickTwisted for controlled fixtures, including force(grid), spin(), setGrid(), scatterDropNow(), and state snapshots. Inspect the actual debug object in game.js for exact signatures. Keep temporary QA pages out of release output.

## Important boundaries
- Preserve result math, odds, payout accounting and resolved symbol grids while adjusting presentation. This is a demo-credit game, not a certified real-money backend.
- Keep import query-string versions consistent when editing modules; update the game.js version in index.html to invalidate caches.
- Both pause/resume and skip/turbo paths matter. Preserve cleanup of sound and visual effects.
- The user's generated gunshot/chain combinations were preview experiments and were NOT adopted as the scatter sound. The two scatter-impact WAVs named above are the current approved effects.
- Source and assets are complete. node_modules, .git history, local preview sessions, credentials, and unused conversation uploads are not needed to run this snapshot and are not bundled. Install dependencies from package-lock.json if using Vite.
- .openai/hosting.json is included as provenance only. Do not attempt automatic deployment to the prior account. The user can choose the next hosting environment.

## Integrity
EXPORT-MANIFEST.json records SHA-256 and byte size of every packaged file except itself. Application files are unchanged from the source commit. Only export handoff/manifest documents are replaced, with originals retained in export-history/. No game code was modified for the export.

