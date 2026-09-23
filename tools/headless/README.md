# Headless testing of the real game (Playwright)

gamebm.py opens dist/ in headless Chromium with three test-only workarounds (the game itself is untouched):
- every file is served straight from disk through a route (the simple http.server dropped responses under load);
- MP4 requests are answered with VP9 WebM copies (Playwright's Chromium has no H.264; make them with
  `ffmpeg -i X.mp4 -c:v libvpx-vp9 -b:v 1.5M -deadline realtime -cpu-used 8 X.webm` into the V folder);
- HTMLImageElement.decode is retried (that Chromium rejects valid images at random, which the game treats as fatal).

```python
from gamebm import open_game, enter_bm
b, page, logs = await open_game(p, viewport=(1323,743), dpr=2)
await enter_bm(page, demo=True)            # the scripted Blood Money walkthrough
await page.evaluate("()=>window.__bloodDuel.debug")
```
Edit D (dist path) and V (webm folder) at the top. enter_bm(begin=False) stays on the briefing (no spins), which is
the place to drive the duel by hand: window.__bloodDuel.start(level,stamps), hit(n, kill).
A full Blood Money run takes minutes; run it in the background and log to a file.
