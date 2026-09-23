# Blood Money duel: art pipeline

The duel (dist/blood-duel.js) plays three Seedance 2.0 clips per outlaw on the bank porch of the Blood Money film.
This folder rebuilds its sprite sheets and dist/assets/blood-duel/duel.json from the source clips.

```sh
pip install numpy opencv-python-headless pillow     # ffmpeg on PATH
python tools/blood-duel/build_duel.py               # all three outlaws
python tools/blood-duel/build_duel.py ringleader    # optional single-outlaw rebuild
python tools/blood-duel/smooth_duel.py              # required after either rebuild
```
Then bump the `?v=` on the clip files in blood-duel.js (load()) and on the blood-duel.js import in game.js, and
game.js?v= in index.html. Set FFMPEG_BINARY to an absolute executable path when ffmpeg is not on PATH.
The smoothing pass marks each clip, so a partial rebuild only interpolates newly rebuilt clips.
Do not run smoothing alone on an already smoothed release.

## Sources (sources/)
| file | outlaw | what happens | OpenArt |
|---|---|---|---|
| rustler-hit1.mp4 | Rustler | shot in the shoulder, staggers, clutches it | 4GbGQppRRwQNdEh830nN |
| rustler-hit2.mp4 | Rustler | chest shot, drops to one knee | 38ZFLmCek2i9WMCpP3EU |
| rustler-kill.mp4 | Rustler | head shot, falls backward dead | AaFaxvSoAFB3zFtaf71X |
| gunfighter-hit1.mp4 | Gunfighter | draws; gun hand shot out, revolver drops | p7MjzK3f03YCXQ9WMdjh |
| gunfighter-hit2.mp4 | Gunfighter | gut shot, doubled over, reaches for a second gun | QPoXvgJaQKtskRZa9z3u |
| gunfighter-kill.mp4 | Gunfighter | pulls the second gun, chest shot, spins, face-down | LmdTSGCk9xtANICXEIvt |
| ringleader-hit1.mp4 | Ringleader | thigh shot, drops the money sack, bills spill | BKBngHZViM7inb96pGyI |
| ringleader-hit2.mp4 | Ringleader | chest shot, stays standing, laughs | F2bAg94gWArMKy7adBa9 |
| ringleader-kill.mp4 | Ringleader | heart shot, both knees, face-first | QdfxagUwubjeFPpLnnLa |

All are 720x1280 (9:16), 4 s, 24 fps, flat #00FF00, generated in the user's OpenArt account (bracarty333@gmail.com)
with start and end frames so each clip begins on the pose the previous one ended on.

Pose stills (Nano Banana Pro, image2image, all edits of the game's own gunslinger figure, upload s8pZoDDtvN3w44gK1Qvx):
- Rustler: standing FFbAWadjr4UbnqTdBkCY, shot one Lb4WjtkeDMGIC7TI3vuu, kneeling (old) bbipqJNEWVkSdRhrfGCM,
  kneeling repainted from shot one VVq8i15p6Js1aqY3s3eG.
- Gunfighter: standing 7klL4Rlub5LQD7FrrUha, shot one ND1WqoauuNPy52CDu0cD, shot two ieT1IP48tU3lbx1H21Fr.
- Ringleader: standing jwGu2e4KEaMRFzPMzFBb, with sack SF8kinc7Yt8p0DRytm8O, shot one DwUwVClALASuApEbuvvk,
  shot two 4iklbm4DjtMtPKVCpMfH.

## Continuity rule (learned the hard way)
Every wound and every dropped prop must carry forward. Paint each pose FROM THE PREVIOUS POSE (never from the clean
standing figure), and in every prompt name each existing wound by its side of the image ("the shoulder on the
right-hand side of the image") and say it stays there; name props that must stay where they lie. Prompts for
clips: locked-off camera, whole figure hat to boots, no muzzle flash / smoke / bullet streak in frame.
Check every join (last frame of clip N vs first frame of clip N+1): the shipped Gunfighter and Ringleader joins
differ by ~6 (compression noise), 0% strongly differing pixels.

## September 2026 animation revision
All nine takes now retain their source frames with measured impact positions and retimed recovery.
The two proposed Rustler replacement takes were inspected and rejected: hit2 snaps back to standing
at the end, and kill starts standing rather than kneeling. The original takes remain. A tracked dark
sleeve injury carries the first shoulder wound forward; existing baked-in source discoloration remains.

smooth_duel.py inserts optical-flow in-betweens across gaps over 30 ms using premultiplied alpha.
Runtime chooses one cell instead of cross-dissolving silhouettes. Compare fast hands, hats and the
fallen bodies when regenerating: interpolation can introduce local deformation around occlusions.

dist/blood-duel-motion.js aligns clip contact to muzzle timing. Kill emphasis begins only after impact
and lasts 240 ms; the previous whole-scene slow clock is removed. Body landing adds a single subtle
camera/audio cue. Particles advance from elapsed time, hidden pages pause the duel, and completion
is handled by update rather than drawing. Final feature settlement waits for the actual reaction.

Run `node --test tests/*.test.mjs`. blood-duel.test.mjs covers all nine shots in normal, turbo and
reduced-motion configurations, contact timing, duplicate guards, pause/resume, landing cues and cleanup.
See ANIMATION-QA.md for browser verification and limitations.

## Placement and look (current showdown)
- dist/blood-duel-stage.js owns both character placements. Hero x=16, y=37, scale=.88 is applied to idle/draw/recoil and to the muzzle point. Enemy center=1095, ground=590, scale=1.30 is applied to every atlas cell and wound location.
- Both fighters stand on the dirt in the new centered background. The previous bank doorway patch is neither loaded nor drawn.
- Enemy buffers are enlarged to include the full fall. All alpha bounds across all nine clips fit horizontally from x=982 through 1205.5, within the 1212-wide scene. Props can extend slightly below the main canvas into the continuous ground layer.
- Existing baked warm grading is retained, as are the hero's contact shadows. Enemy contact shadow is widened for the new scale.
- See source-art/blood-showdown/README.md for the approved still and deterministic lantern animation.
