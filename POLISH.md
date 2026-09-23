# Presentation polish validation — 2026-09-20

## Changes
- Feature intros present one complete film composition on portrait screens. The matching feature background enters during the closing dissolve instead of appearing behind the title as duplicate artwork.
- Hang's rendered dissolve and automatic handoff both follow its 6.5-second endpoint. Skipping preserves the film's portrait framing.
- Offer headings have dedicated space above the artwork. Phone and tablet actions have 44px touch targets; short landscape menus scroll instead of shrinking into cramped cards.
- Hang capture, upgrade and extra-spin notices occupy the space above the paying grid. On portrait, they temporarily replace the feature heading, which returns after the notice.
- Large Hang totals and result controls fit small portrait and short landscape screens. Overflow remains scrollable.
- Action feedback returns immediately when idle and cleans up its bounded event list in place, avoiding idle per-frame array allocations.

## Verification
- All 10 Node regression suites pass. The intro regression now checks the single composition and half-dissolved Hang title at 6.1 seconds.
- Browser layout inspection: 320×568, 393×852, 844×390, 820×1180, 1440×900 and 1920×1080. No horizontal menu overflow; headings stay clear of artwork.
- Tablet regression: all six action targets are at least 44px, aligned and inside their cards.
- Result layout: $600,000.00, three captured outlaws and 24 completed spins at 320×568, 393×852, 844×390 and 1440×900. No amount overflow; Continue reachable.
- All three feature intros visually inspected on the 393×852 phone viewport.
- Complete deterministic 15-spin Hang feature on desktop and 393×852 DPR 3 phone emulation with 4× CPU slowdown: retrigger counter, all lock/upgrade events, exact payout and return to base game pass with no runtime errors.
- Offer effects pause in the closed menu, honor reduced motion, and keep buttons fixed. Confirmation lifecycle passes.

No outcome probabilities, RTP tables, audio files or animation assets changed in this pass. Checks used Chromium/Edge, not physical iPhone Safari. These results do not establish a universal device performance guarantee or a measured retention effect.
