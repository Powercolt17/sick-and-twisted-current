# Preserved legacy media

theme.mp3 was previously packaged at dist/assets/music/theme.mp3. It has no
runtime references: theme-music.js explicitly selects last-stand-at-dusk.flac,
blood-money.flac, and desolate-trails.mp3. Preserved here without changing its
bytes so the static deployment stays below the 256 MiB expanded archive limit,
including tar headers and padding. No active game asset was removed.
