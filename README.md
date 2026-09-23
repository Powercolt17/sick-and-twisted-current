# Sick & Twisted

A six-reel, four-row gritty Western slot. `dist/` is the authored source and the deployable site.

- Handoff guide: AGENTS.md (also CLAUDE.md). Start there.
- Run: `python -m http.server 8080 --directory dist`, open http://localhost:8080/ (`?debug=1&intro=0` for the debug object).
- Tests: `node tests/<name>.test.mjs` (19 files).
- Blood Money duel art pipeline: tools/blood-duel/. Headless testing of the real game: tools/headless/.
