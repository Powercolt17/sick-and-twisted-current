# Blood Money animation QA — September 2026

This revision changes presentation only. Bounty outcomes and payout math are unchanged.

## What changed
- All nine reactions use measured contact frames and hit locations; 65/85 ms tracers replace the extended pre-impact freeze.
- Kill slow motion applies only to the first 240 ms after contact, followed by full-speed collapse.
- Dense source frames and optical-flow intermediate cells replace runtime pose cross-fades.
- Smaller blood particles use elapsed time. Dropped hats, guns and the money sack survive keying.
- Rustler's original shoulder injury persists as a tracked sleeve decal. Original source discoloration remains; the proposed replacement takes failed continuity review and were not used.
- Body contact has one small camera/audio cue; the final pose holds at least 500 ms before settlement.
- Hidden tabs pause the duel; normal/Turbo/reduced-motion timing and cleanup use the same active clock.

## Verification
- All 20 Node regression test files pass, including the new nine-shot duel suite.
- Edge headless with native MP4 playback: all nine reactions driven through the real game canvas, with impact/reaction/end captures and a 22-second recorded review before the final 500 ms settlement hold was added.
- Full scripted desktop Blood Money run: six successful shots across Rustler/Gunfighter, Ringleader entry, receipt and return to base play. No page errors or failed resource requests. $38.80 demo award; ending balance $10,038.80 at $1 bet.
- Emulated 390x844 phone, Turbo: complete feature, matching $38.80 award, return to base play, no page errors or failed requests. The existing phone poster presentation is intentional.
- Unit coverage includes all nine impacts in normal/Turbo and reduced motion, no-draw settlement, hidden-tab pause, sequential-shot guards, one landing cue per death, final hold and cleanup.

## Limits
The visual judgment applies to the captured desktop presentation. Phone checks are browser emulation; physical iOS/Android performance and Safari have not been tested. No listening test was performed for the new landing sample; its cue timing and one-shot behavior were checked. Optical-flow interpolation can deform small occluded details, and the source clips retain minor costume variation.

## Deployment packaging
Unused HD stage/symbol variants, the old brand panel and letterpress paper are preserved under source-art/unused-reference rather than deployed. Active artwork is unchanged. These files have no runtime HTML, CSS, JS or JSON references.

## Approved showdown background integration
- Replaced the Blood Money desktop/mobile background and still fallback with the approved lantern-only artwork. Centered its desktop crop so both sides are equally visible.
- Moved the hero and enemy to the same street floor, with more comparable scale. Shared transforms keep muzzle flashes and wound targets aligned. Removed the old doorway repaint overlay.
- Edge browser: all nine reactions accepted, no page errors or failed requests. Inspected starting poses and a complete fallen Gunfighter; all nine frame bounds remain inside the horizontal canvas.
- Full desktop and emulated phone runs both return to normal with $38.80 awarded and balance $10,038.80. Phone uses the established poster layout; no physical device claim.
- The original scene and master source art remain under source-art for reversal/rebuild. Feature intro and payout math are unchanged.


## Blood Money briefing and receipt redesign
- Replaced the baked briefing plate and canvas receipt with responsive live typography on the approved weathered board texture. The full wanted artwork, oxblood button, closed-contract seal, and brass details now form one composition.
- The briefing displays the actual awarded spins and boost. The receipt maps internal symbol IDs through OUTLAW_FILES, displays the actual final target, and counts exact cents on the existing pausable bounty timeline. It never modifies rewards, outcomes, or account values.
- Portrait phone dialogs fill the safe viewport. Desktop stays over the showdown. Keyboard focus stays inside the active dialog and the HUD is restored after dismissal.
- All 21 Node test files passed. New receipt coverage verifies zero/one-cent/large payouts, exact final cents, reduced motion, hidden-tab pause, and duplicate-close protection.
- Visually checked 320x568, 390x844, 844x390, 1366x768 and 1564x928 layouts, including $1,000,000.00. No panel scrolling, amount overflow, or document overflow in these checks; all tested action buttons remain on screen.
- Final full desktop and emulated 390x844 phone feature runs: correct Ringleader portrait, $38.80 receipt, $10,038.80 ending balance, keyboard Tab containment, HUD restoration, and return to base play. No page errors or failed requests.
- No new generated imagery or video assets. Physical device and Safari checks remain unperformed.

## Final timber-and-iron presentation pass
- Composed the dialog edges from the approved reel-frame timber artwork, with forged corners and stronger material contrast. Enlarged the instruction copy and three stamp markers.
- The receipt is a distinct BOUNTY PAID composition, with the contract seal applied to the final target poster, larger gold reward typography, finite warm light and dust accents. Zero rewards say HUNT COMPLETE.
- The seal reaches contact at the existing 800 ms stamp cue, with a brief damped rebound. The count-up, seal, rebound, light and dust all derive from the bounty timeline's pausable clock. Reduced motion reveals the final state immediately and suppresses dust.
- Reward font sizing follows the final amount to avoid resizing during the count-up.
- All 21 tests passed; focused receipt tests rerun after the final cue-alignment adjustment passed. Added paused-reveal, reduced-motion and exact seal-contact checks.
- Final layout checks at 320x568, 390x844, 844x390, 1366x768 and 1564x928: no card/document/amount overflow and all actions on screen. Also checked $9,999.99 and $1,000,000.00.
- Complete desktop and emulated phone feature runs: $38.80 total, $10,038.80 ending balance, correct Ringleader portrait, keyboard containment and HUD restoration. No runtime errors or failed asset requests.
- The existing sound cue timing was verified in code; no new listening or physical-device/Safari performance claim.


## Blood Money progression â€” 2026-09-23
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

The full feature captures contain real resolved walkthrough outcomes. The separate
responsive-layout fixtures hold the promotion at 900ms to inspect its geometry;
they do not test outcome accounting. Badge labels stay inside their frame, the
reward does not cover the badge, and no horizontal overflow appears at 320x568,
390x844, 844x390, 1366x768 or 1564x928. Browser runs report no page errors or failed
asset requests. The last-spin retrigger, same-spin double advance, duplicate grant,
1,614 upgraded cascade paths, fractional cents and pause-clock cases are covered
by the focused progression test. Audio reuses existing approved impact/rip cues;
no new sound asset or listening-quality claim.
