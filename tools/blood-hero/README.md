# Registered Blood Money quick draw

The exact existing faithful-character/figure-0.webp frame0 is the idle reference.
The aiming endpoint was created with built-in image_gen, then registered to the
source. OpenArt Kling 3 Omni generated the connected draw between these frames:
history `teJQCWvYtVV84la6Oj0f`, project `w5gUHjBfCbVX8rcw2eUd`, 3 seconds, silent.
Exact prompts are in PROMPTS.md and measured geometry is in asset.json.

Runtime files: dist/assets/blood-hero/hero-draw.webp and hero-draw.json.
32 transparent 640×640 cells, 8 columns, 4 rows; WebP quality88, alphaQuality100.
The native 274×491 original maps into each cell at 1.25×, offset40,10.
The original lower body is fixed below cellY396, with a short seam above it.
Frame0 alpha matches the registered original; no strongly green opaque pixels.

Runtime samples one frame, never dissolves silhouettes. A 500ms draw is followed
by a 60ms aim, connected recoil, hold, 460ms lowering and idle join. The same
renderer handles target and enemy shots. Its upper figure aims at the actual
hit point; feet, lower body and contact shadows stay planted. The muzzle flash
follows the moving barrel; the tracer leaves the fire-time barrel position.
Enemy animation contact still uses each clip's measured impact time.

Source MP4, PNG frames, exact idle and generation endpoints are retained outside
the release in the task workspace outputs/hero-draw. Only the selected atlas and
runtime frame metadata ship. The existing viewer-directed shooting animation
continues to serve the original screen/boxed-Wild effects.
