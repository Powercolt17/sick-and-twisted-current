# Approved Blood Money showdown
Approved background: OpenArt GPT Image 2.5 Sunburst generation JOPDOZQRCqrt6hfau1Qq, resource tjvgj717riSAPDHWuvNv, 3584x2016.
The user rejected the generated environment videos and approved a controlled lantern-only loop made from this exact still.
Runtime: assets/feature-scenes/blood-money-background.mp4 (1920x1080, 30 fps, 8 s, silent), -mobile.mp4 (960x540), and a matching full-resolution-for-runtime JPEG fallback.
Only the three existing lantern flames and their nearby light change. The source scene stays fixed; raw first/end loop frames match exactly. The animated mask covers 1.38% of the image.
Rebuild the master with tools/blood-duel/build_lantern_background.py (Pillow, NumPy, opencv-python-headless, imageio-ffmpeg). Copy the output to the runtime path, then encode the mobile copy with ffmpeg scale=960:540, libx264 preset slow crf 18, no audio, faststart.
The earlier feature background is retained in source-art/previous-blood-background. The approved intro film is unchanged.
