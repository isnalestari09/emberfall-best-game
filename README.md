# EMBERFALL — Lantern of the Last Grove

A complete original top-down wave-survival arena shooter for
[make.fun](https://make.fun/bounty/best-game-01) — **best-game-01**.

The grove is falling to ash. You are the last lantern keeper: keep your
lantern lit, survive all 10 waves, and fell the Ash Titan.

## How to play

- **WASD / Arrow keys** — move
- **Mouse** — aim
- **Hold Click / Space** — shoot lantern flame
- **Shift** — dash (brief invulnerability, cooldown shown as a ring)
- **P / Esc** — pause, **M** — mute, **R** — restart, **Enter** — start / restart
- **1 / 2 / 3 or click a card** — pick a level-up boon

## Systems

- 10 waves with an intermission banner, escalating spawns, and a boss
  (the Ash Titan) on waves 5 and 10. Survive wave 10 to win.
- 5 enemy types with distinct behaviour: Ember Motes (chase), Wisps
  (fast zig-zag), Brutes (slow tanks), Spitters (ranged, keep distance),
  and the Ash Titan (radial bullet bursts, summons motes).
- Ember gems drop from kills; collecting them earns XP. Each level-up
  pauses the game and offers 3 boons from a deck of 8: damage, fire
  rate, split flame, piercing, move speed, faster dash, max HP/heal,
  magnet radius.
- Score with a kill combo multiplier, wave-clear bonuses, best
  score/wave saved in `localStorage`, floating damage numbers, particles,
  screen shake, hit flash, and a lantern glow.
- All art is drawn in code on canvas and all sound is synthesized live
  with WebAudio — no audio or image files, no network requests, no
  libraries. The game runs offline from its own files.

## Files

- `game/` — the playable game as static files (`index.html` + ES modules
  under `game/src/`). Open `game/index.html` in desktop Chrome, or run
  `node serve.ts` and open http://localhost:8080.
- `screenshots/` — 4 real renders of the game's own code, staged with
  `?shot=start|play|boss|end&seed=1` (see `shots.json`).
- `main.ts` — the Node 22 program that hands the entry in (copies
  `game/` + `screenshots/` to `/output` and writes `dossier.json`).
- `vendor/makefun-game.ts` — copied unchanged from the make.fun kit.
- `sessions/` — the build session record for this entry.

## Test locally

```sh
node serve.ts            # serves game/ on http://localhost:8080
# then play it in Chrome, or take the screenshots with headless Chrome:
#   chrome --headless=new --screenshot --window-size=1280,720 \
#     --virtual-time-budget=8000 "http://localhost:8080/?shot=play&seed=1"
MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/dossier.json
```

MIT licensed (see `LICENSE`).
