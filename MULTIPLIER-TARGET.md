# Blood Money target and shared quick draw — 2026-09-23

## Current behavior
The original idle character now glances right and draws his revolver in one
connected 500ms animation. After a 60ms aiming beat, the shot, muzzle flash and
recoil share the same clock. He lowers smoothly back to the exact original idle.
Both enemy shots and multiplier shots use this renderer and aim at their actual
hit points. Enemy reaction clips retain their existing measured contact timing.

The approved iron support and WIN MULTIPLIER header remain fixed above the right
lantern. The solid beveled disc rotates vertically around its horizontal axle:
fire560ms, impact655ms, rapid650ms rotation, 1550ms deceleration, 340ms damped catch.
It makes three revolutions. The final painting changes while hidden in the last
turn. +2 spins appears3320ms, after the disc settles; the sequence ends5150ms.
Hidden-tab pause, mute, reduced motion, reset and a Canvas2D fallback are supported.
The target remains readable when WebGL is unavailable. Only the current value
is displayed. Phones retain the existing hidden foreground hero.

## Authoritative reward rules
Starts at1×. Each of the two legitimate enemy advances awards+2 spins and draws:
2×69.5%,4×20%,6×7%,8×2.5%,10×1%. Keep max(current,roll), even when the new roll is
lower. Both spin grants still apply when the multiplier is held. The third enemy
is the final tier, with no further advancement roll. The killing tumble uses the
old multiplier; later tumbles and spins use the resolved new multiplier.

blood-rules.js owns the weights and duplicate-safe claims. blood-bounty.js rolls
once during resolution from a stream independent of the symbol path. Rendering
never rolls again. The unchanged12,600 catalog seeds and terminal bounty states
are retained. blood-profiles.js stores their paytable totals before boosts, by
stage. blood-math.js integrates all multiplier branches and both extra-spin
grants across42 modeled states and calibrates one fixed catalog weighting to the
existing96.7% demo return target. Credits, losses, bet and player history never
enter that weighting. Existing fractional-cent and round-cap accounting remain.

## Assets and provenance
The approved1×/2×/4×/rear atlas is OpenArt history aR28Mr0kdF7pYae365x4,
gpt-image-2-5-sunburst:image2image, resource5lhUg43PGBecsFXcfwxt.
Its original2880×960RGB render has a baked checkerboard; runtime isolates the
fixed support and discs so the checkerboard is never drawn. The selected art now
uses quality96 WebP (1,337,782bytes) to fit the hosting asset budget.

6×/8×/10× faces: OpenArt GPT Image2 edit, historyOd3TfM4D8TsNN6kVDZr2,
resourceSEv0FZojpdz0rGj24k8n,3072×1024RGB; quality96 WebP1,114,670bytes.
The clip meshes use those actual raster textures, with a24-unit thick rim and
lighting. Canvas2D fallback uses the same textures and a shaded edge.

Hero draw: OpenArt Kling3 Omni historyteJQCWvYtVV84la6Oj0f, with a built-in
image_gen identity-preserving endpoint. Final asset, exact prompts, registration
and measured muzzle/shoulder geometry are documented in tools/blood-hero/.

## Verification
- All24 Node test files pass, including all12,600 paths, exact multiplier ticket
  weights, no decreases, duplicate grants, independent EV reconstruction,
  fractional cents, cap handling, last-spin extension and all9 enemy impacts.
- Full local Edge desktop and phone-emulated walkthroughs: two awards,12 spins,
  4× final multiplier,$42.90 exact reward and credited balance; no runtime errors
  or failed assets. The walkthrough deliberately demonstrates2× then4×.
- Actual in-game captures reviewed across the idle, glance, draw, aim, flash,
  recoil and return, and the target's impact, fast flips, slowdown and catch.
- All five target faces, held10×, reveal timing, reset and reduced motion checked
  through the actual promotion renderer. Five viewport sizes:1564×928,1366×768,
  390×844,320×568,844×390; no overflow. WebGL-disabled fallback also checked.
- Rare10× then lower-roll-held10× full feature:12 spins,$126.10 reward,
  $10,126.10 final balance, no runtime errors or failed resources. Test-only
  module interception forced the rolls; production odds were unchanged.
- Real phones/Safari, device FPS and subjective sound balance are not measured.

Cache: game253,promotion5,target2,target-motion2,duel5,rules2,bounty81,math81,
briefing124,game-info129,gunslinger1. Owner-private audience is preserved.
The unused legacy theme.mp3 is preserved in tools/archived-media, outside the
published payload. Current music uses the explicit MUSIC_TRACKS paths. Include
tar headers and padding when checking the256MiB expanded archive limit.

## Original target generation prompt
Create ONE 4096×1024 production game sprite strip with genuine transparent alpha, exactly FOUR equal 1024×1024 square cells side by side. Each cell contains the same front-facing mounted shooting-range target mechanism, with no perspective. Treat the supplied Actual Sick and Twisted artwork ONLY as the visual style reference. Replace the wooden sign concept with a round cast-iron shooting target paddle on a HORIZONTAL left-to-right axle through the paddle center. This axle allows the paddle to flip end-over-end TOP TO BOTTOM, rotating around its horizontal axis; it is not a vertical spinner, prize wheel, or side-to-side rotating sign. Exact registration in every 1024×1024 cell: circle center at local x=50%, y=54%; circle diameter 62% of the cell. Bearing pivots align horizontally through the center. Wrought-iron upright side support yoke remains outside the disc, with visible bearings. A thin fixed dark iron header at local y=5–18% carries exactly 'WIN MULTIPLIER' in distressed but clearly legible ivory Western slab-serif painted letters. A short rusty mounting base sits at local y=90%. Keep all mechanism framing, header, geometry, registration, scale, material patterns, texture, bullet dents, light, shadows, and position identical across all four cells. First cell: huge distressed ivory-painted '1×' centered on the dark charred iron paddle face. Second cell: same face with '2×'. Third cell: same face with '4×'. Each of these three front faces has faded oxblood-red concentric bullseye rings, while the huge central ivory multiplier dominates and stays legible at small game size. Fourth cell: the same paddle's rear face in aged unmarked dark metal, with no numeral, no lettering, no bullseye markings on the rear; its fixed header still reads 'WIN MULTIPLIER'. The only change among the first three states is the central numeral; the fourth uses the blank rear face while maintaining precisely identical registration and mechanism. Corroded wrought and cast iron, rivets, bullet dents, restrained dried-blood-colored wear, dark aged metal, subtle warm highlights. Any aged timber must be limited to a small mounting base. Match the supplied gritty illustrated Western horror art: hand-painted and engraved textures, inked outlines, heavy tactile wear, and restrained dusty colors. Not a real photograph, toy, cartoon, neon design, glossy 3D render, casino interface, or prize wheel. Fully isolated asset with actual alpha transparency outside the entire mechanism, no painted checkerboard and no solid background. No people, guns, reels, town, landscape, scenery, or environment. Do not paint motion blur, sparks, muzzle flashes, or shot lines: those will be animated later. No progression rows, compartment boxes, arrows, locked tiers, extra numerals, logo, watermark, or UI chrome.

