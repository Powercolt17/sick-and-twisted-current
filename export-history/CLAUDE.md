# Sick & Twisted — Claude handoff

## Start here
This is Carter's GODLESS SLOTS Western slot project, exported on 2026-09-20 from published version 122.
Source commit: `0bad648cc0837123e0fc000973e4b40eb4fc299f`.
Live reference: https://dead-deader-recreation.bracarty888.chatgpt.site

Three delivery files:
1. `Sick-and-Twisted-Full-Project.zip`: complete current tracked project, including every game asset, source module, outcome table, test, tool, lockfile and project configuration. Extract this to work on the actual game. All files are under `Sick-and-Twisted/`.
2. `Sick-and-Twisted-Claude-Handoff.md`: this guide.
3. `Sick-and-Twisted-Readable-Source.md`: convenient text context for Claude, with application code and documentation. Large generated outcome tables, third-party code and binary assets are omitted from this text companion but included intact in the ZIP.

For a chat that cannot accept or unpack the ZIP, attach the two Markdown files for context, and make the extracted project available in Claude's coding environment. The Markdown companion alone is not a runnable game.

## Prompt to give Claude
> Continue my existing Sick & Twisted game from this export. First read CLAUDE.md and inspect the actual source. Preserve the approved gritty, hand-painted Western art, existing gameplay and math unless I explicitly request changes. Make focused edits in this project, not a recreation. The current source is authoritative over earlier conversation ideas. Use my actual assets and symbols. Run the game, inspect desktop and mobile, and verify the affected interactions. Do not give me an invented 9/10 score. Explain concrete improvements and any remaining issues. Ask me what I want changed next if I have not given a new task.

## Run locally
This is a static HTML/CSS/ES-module game. `dist/` is the authored application source, not disposable build output.

Simplest preview, from the extracted project root:
```sh
python -m http.server 8080 --directory dist
```
Open http://localhost:8080/ in a browser. Do not open index.html directly with file://; modules and asset loading need HTTP.

Optional Vite development:
```sh
npm ci
npm run dev
```
Use a Node version supported by the included Vite dependency and package lock. The existing Vite config serves `dist/` and permits the prior preview host `terminal.local`; adjust the development host allowlist only if needed for your environment. No npm build script is configured. Static hosting should serve `dist/` directly, preserving case-sensitive paths.

Existing Node checks, from the project root:
```sh
node tests/bounty-booster.test.mjs
node tests/hang-feature.test.mjs
node tests/outlaw-motion.test.mjs
```
Some older source comments refer to `tools/verify-rtp.mjs`; that file is not present in this snapshot. Do not claim it was run. `tools/bake-hang.mjs` regenerates a catalog; do not run it as routine setup.

## Project map
- `dist/index.html`, `dist/style.css`: page, layout, controls and UI structure.
- `dist/game.js`: main orchestration, state, rendering, spins and mode transitions.
- `dist/math.js`: shared costs, RTP targets, probabilities, symbols and round math.
- `dist/cascade-kernel.js`, `cascade-data.js`, `scatter-paths.js`, `bomb-paths.js`: evaluation and outcome paths.
- `dist/blood-*`: Blood Money math, catalog, presentation and art.
- `dist/hang-*`: Hang 'Em High math, catalog, sticky Wild feature, presentation and offer art.
- `dist/hell-*`: Hell to Pay art/presentation and offer fire animation.
- `dist/shop.js`, `shop.css`: buy/enhancer catalog, artwork placement, prices and confirmation flow.
- `dist/hang-offer.js`: recent enlarged cowboy offer art with fixed gallows and CSS sway.
- `dist/hell-offer.js`: recent animated fire around approved rider offer art.
- `dist/outlaw-motion.js`: shared hanging full-column Wild animation and four-step entrance.
- `dist/trickster-grid.js`: Trickster multiplier presentation.
- `dist/mode-background.js`: mode background transitions.
- `dist/feature-entry.js`, `feature-intro.js` when present, and feature-specific intro modules: feature entry sequencing; inspect game imports for active paths.
- `dist/approved-win.js`, `win-controller.js`, other win modules: approved win sequences, payouts and effects. Trace imports before replacing anything; several historical modules/assets remain tracked.
- `dist/assets/`: all images, fonts, sprites, videos, music and sound effects used by this project, plus retained historical assets.
- `HANG_FEATURE.md`, `TRICKSTER_BACKGROUND.md`: implementation notes.
- `tests/`, `tools/`: regression checks and catalog generation.

## Current product and priorities
Six reels, four rows. USD demo credits. Gritty Western identity: distressed ink, bone/cream, dark timber, dried red accents. Avoid glossy generic imagery, cartoon styling, oversized type, clutter and distorted artwork. Keep the left gunslinger grounded and visible across modes. Preserve approved reel frame, symbols, MAX coin, sounds and feature intros.

The buy menu is compact: three columns/two rows on desktop, two columns on phones. Independent artwork, captions, trigger labels, prices and buttons. Do not enlarge the whole menu to improve one picture. Keep controls usable, purchase costs clear, and confirmation/cancel behavior intact.

Current prices at a $1 base bet, from the shipped catalog/math:
- Bounty Booster: $3 per spin; 5× base bonus-trigger chance.
- Trickster Spins: $75 per spin; doubling position multipliers.
- All In Spins: $2,000 per spin; 50× ordinary win boost. Older conversation mentions of 200× are stale.
- Blood Money: $99 feature purchase; 8 free spins, bounty upgrades; 3-scatter trigger.
- Hang 'Em High: $499; 12 free spins, up to 3 sticky Wild reels and upgrades; 4-scatter trigger.
- Hell to Pay: $799; starts with 3 full-reel Outlaw Wilds, one tumble round; 5-scatter trigger.

Use source constants as the authority. Do not silently change game odds to match artwork or copy.

## Math and release boundaries
This is an uncertified demo-credit game, not a connected real-money Stake backend. Exporting it does not create a Stake-certified integration or carry hosting authorization into Claude.
Configured RTP cap: 96.70%; maximum target spread: 0.50 percentage points. Current targets in math.js: normal .967, boost .966, trickster .962, allin .962, deadbuy .967, deaderbuy .964, outlaws .962, maxfree .964.
Outcome probabilities must not depend on player balance, history or losses. Preserve tumble, payout, rounding, cap and Wild persistence logic when changing visuals. The finite outcome catalogs are required runtime data and are all in the ZIP.

## Latest completed work included
- Bounty Booster 5× badge and matching fivefold bonus-trigger probabilities.
- Matte ink-style Blood Money banknote illustration.
- Hell to Pay larger approved rider art, edge fire animation, clear starting-Wild wording and BUY FEATURE button.
- Hang 'Em High enlarged hat/face/rope/coat close-up, brighter midtones with preserved dark ink, fixed timber and gentle whole-layer sway, improved spacing and BUY FEATURE button. It intentionally uses an upper-body close-up, not a new full-body drawing.
- Both offer art treatments also appear in purchase confirmation. Motion pauses in hidden views/closed menus; reduced-motion preferences are supported.

Latest visual QA in the prior session covered desktop and phone menu layout, confirmation details, cancellation and animation shutdown. That is not a guarantee of 60 FPS on every device or an independent quality score. Recheck any changed paths.

## Guardrails for the next developer
- Make edits in dist; never erase it by assuming it can be rebuilt from another src folder.
- Keep asset filenames, import query strings and case-sensitive paths consistent; bump cache versions after changes where this project uses them.
- Preserve base/feature four-step Wild drops, turbo/skip, music continuity, separate mode backgrounds and the shared character/UI placement.
- Use actual supplied art and sounds. Export includes current game assets, not every unrelated marketing deliverable or original source project from other conversations.
- Do not auto-publish to the previous Sites project. `.openai/hosting.json` is retained for provenance; it supplies no credentials. Arrange deployment in the user's chosen environment only when asked.
- No API tokens, browser session state, node_modules or Git history are included. Install dependencies from the lockfile. This is a complete source-and-assets snapshot, not a full Git-history export.
- Keep temporary QA fixtures out of release output. Archived pre-existing debug/QA files are retained for completeness; do not assume they are normal player entry points.

## Integrity
`EXPORT-MANIFEST.json` in the ZIP records the size and SHA-256 of every original tracked project file. The 384 source files are byte-for-byte from the published version's commit. Added CLAUDE.md and this handoff guide are documentation only; gameplay source was not changed for export.
