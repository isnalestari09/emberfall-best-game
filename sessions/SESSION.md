# Build session record — EMBERFALL (best-game-01)

This file is the session record for this entry, written by the agent that built it.
This harness keeps no provider token-usage log, so no token counts are claimed here;
times are the agent's own wall-clock times (UTC) for each step.

## Timeline (2026-11-18, UTC)

- 15:46 — Read the bounty brief at https://make.fun/bounty/best-game-01
  ($1,000, 10 places paid, 1st $400; ends 2026-11-18 18:00 UTC).
  Fetched the official kit: `curl -sSL "https://make.fun/c/best-game-01/kit" | tar xz`.
  Verified `vendor/makefun-game.ts` sha256 matches the kit copy.
- 15:47 — Designed EMBERFALL: original top-down wave-survival arena shooter.
  Wrote game/src/config.js, random.js, input.js, audio.js (all sound synthesized
  with WebAudio; no audio files, no libraries, no network).
- 15:48 — Wrote game/src/world.js (waves, 5 enemy types, boss, XP/level-ups,
  dash, combo, particles) and game/src/render.js (canvas renderer, HUD, panels).
- 15:49 — Wrote game/src/shots.js (autopilot staging), game/src/main.js
  (fixed-timestep loop, title/play/pause/levelup/over/win screens) and
  game/index.html. Wrote main.ts (kit dossier builder), shots.json, README.md.
- 15:50 — Syntax-checked every module (`node --input-type=module --check`).
  Headless Chrome in this VM refuses to start (Hatch WebGL domain policy),
  so screenshots were rendered with @napi-rs/canvas in Node, using the game's
  own stageShot() + renderer with seed 1 — real renders of the game's code.
  First pass: 1-start (title), 2-play (wave 2), 3-boss (wave 5), 4-end (wave 9).
- 15:51 — Inspected all 4 screenshots. Fixed the boss shot (it had caught the
  player dead) by staging the boss fight briefly with the keeper healed, and
  moved the wave-clear text off the end panel.
- 15:52 — Playtest found waves too thin (autopilot killed faster than spawns):
  raised spawn density (8 + wave*4 enemies, interval 0.55s base). Re-rendered.
  Ran `MAKEFUN_OUTPUT_DIR=out node main.ts`: dossier.json built (269 KB).
- 15:53 — Full headless playthroughs with a decent-human autopilot (smart card
  picks, kiting, dash): seed 1 WIN wave 10 in 164s, score 11,234; seed 2 game
  over wave 10, score 10,542; seed 3 game over wave 7, score 5,683.
  Verified main.js entry point runs and sets window.__shotReady.
  Verified no network references in game/ and that serve.ts returns HTTP 200.

## What was built

- Game: EMBERFALL — Lantern of the Last Grove (see README.md).
- Entry root: ~/workspace/makefun/best-game/entry/
  - main.ts, game/, screenshots/ (4 JPEGs, each under 256 KiB),
    vendor/makefun-game.ts (kit copy, unchanged), serve.ts, shots.json,
    LICENSE (MIT), README.md, sessions/ (this file).
- The kit itself is kept outside the entry at
  ~/workspace/makefun/best-game/best-game-01-kit/ for reference.

## Not done (needs the owner)

- No account was created, no sign-in, no submission. To submit, the owner
  (or their connected agent) must: create a public GitHub repo owned by their
  account, created after the competition opened, under an OSI-approved
  license, with this entry at its root; then run the kit CLI
  (`node cli/makefun.mjs`) to enter best-game-01 before 2026-11-18 18:00 UTC.
