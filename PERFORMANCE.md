# Mobile and desktop stability validation — 2026-09-20

Reported issue: Hang ’Em High intro crashing on iPhone 15. The original crash was not reproduced in desktop browser emulation. These changes address confirmed resource-retention and playback-failure paths; physical iPhone Safari validation remains outstanding.

## Changes
- Videos acquire decoders only when needed. Completed intros, inactive modes, and exited features detach their video sources and release buffers.
- Feature background loading begins near the end of its intro, instead of decoding alongside it from entry. The original full-HD files, frame timing, transitions, and audio remain in use.
- Slow loading can be continued immediately. Failed or stalled films hand off to the already confirmed feature. Autoplay refusal offers Play Intro and Continue.
- A discarded video frame cannot terminate the game render loop.
- The main render loop follows requestAnimationFrame and stops drawing while hidden. Fully covered background layers are not repainted.
- The menu and reels share prepared Hang artwork. Multiplier rasters store the lettering band and use a bounded cache; transient tumble posters and inactive win canvases release their native backing stores.
- Bounty Booster has Trickster-gold 5× lettering on a red coin background.

## Validation
- All Node regression tests pass, including media ownership, cancellation, stall recovery, feature awards, all mode math, and multiplier cache budgets.
- Chromium/Edge: complete 12-spin Hang features on desktop and an emulated iPhone 15 viewport (393×852, DPR 3), including 4× CPU throttling, intro rotation and pause/resume.
- Intro/skip/handoff on 320×568 phones, 852×393 landscape, 820×1180 tablets, and 1920×1080 DPR 2 desktop.
- A 360×740 DPR 2 phone profile with 6× CPU slowdown, 400 ms network latency and 512 kbps download: Continue escaped an intro still loading and reached the confirmed feature in 875 ms, with no runtime errors.
- Nine repeat-entry cycles across Blood Money, Hang ’Em High and Hell to Pay: autoplay denial, injected unavailable-frame error, stalled decoder, duplicate Continue and cleanup.
- Animated Trickster/All In switching and repeated MAX celebrations, including hidden-tab recovery and hidden canvas release.
- Pixel comparison against the prior multiplier renderer: zero changed channel values for 1, 2, 4, 8, 16, 32, 64, 128 and 1024.
- The measured mid-intro decoder count fell from four loaded videos to one; a second decoder is allowed for the original ending crossfade. After feature exit, no feature decoder remains attached.

These are functional and allocation checks, not a measured frame-rate guarantee on physical phones. Safari/WebKit and physical low-memory devices were not available in this environment. RNG, payout tables, RTP targets, animation assets and feature sequencing were not edited.
