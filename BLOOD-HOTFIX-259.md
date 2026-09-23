# Blood Money: Ringleader and reference panels

## Defect and correction

The resolver required `state.level < 2` to earn a bounty hit. Ringleader symbols
therefore paid and showed reel hit effects but could not request a duel shot.
Final-stage health now progresses from zero through three; the third genuine
paying-target event requests the existing kill clip. Health persists between
spins and is mapped to the existing terminal math state, index 6. After defeat,
later wins still pay but do not shoot the absent enemy or grant extra rewards.
Only the two existing stage advances grant two spins and a multiplier roll.

## Reference artwork

The user supplied the exact entry and ending compositions and then explicitly
required the current game background to remain behind both panels.

- `assets/blood-plates/approved-entry-hd.webp`: built-in imagegen restoration of
  the user's 406×264 entry reference. Prompt: faithfully restore sharp detail,
  preserve composition, all lettering, portrait, button and frame; remove the
  clipped bottom-left 'dit' artifact; no scene outside the wooden board.
- `assets/blood-plates/approved-receipt-clean.webp`: built-in imagegen edit of
  the ending reference. Prompt: preserve exact composition and all static
  lettering/button/wood; remove only $820.30, 12, 6× and the left wanted poster,
  filling those regions with matching wood for live application content.
- `assets/blood-plates/approved-receipt-reference.webp`: format-converted user
  reference. CSS exposes only the Ringleader poster, including its original
  contract stamp; other targets use their existing portraits and live seal.
- Receipt scene outside the wooden board is cropped away by CSS. No replacement
  backdrop is displayed. Live numbers use bundled OFL Anton, with its license.

The starting panel uses the restored art for the standard eight-spin award;
other awarded counts retain the existing live-text fallback. Both buttons keep
their click/keyboard handlers, focus gates, semantic labels, and pause behavior.
Receipt values always reflect the snapshot, including zero and long amounts.
The restoration and live number font are close reconstructions, not a claim of
pixel identity to the low-resolution reference.

## Verification

All 27 Node test files pass, including new real-resolver → timeline → nine-shot
duel regression in normal/Turbo/reduced motion, duplicate suppression, final
health restoration, and every terminal catalog trajectory/payout. The complete
in-app browser walkthrough ends with Ringleader defeated, 12 spins and $42.90.
Entry and receipt components were visually checked over the existing game
art, with actual Continue behavior and large-reward formatting. A local-only
component QA page is at work/reel-drop-preview/blood-hotfix.html, outside dist.
Real physical phones and Safari have not been tested.

Entry cache game259, briefing125, receipt4, CSS124, bounty82, duel8, bank133.
Hang feature enhancement work remains paused outside this checkout.
