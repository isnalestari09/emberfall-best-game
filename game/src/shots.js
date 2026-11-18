// Screenshot scenes behind ?shot=start|play|boss|end. Each plays the real rules forward
// from a fresh world with a simple autopilot (kite away from enemies, shoot the nearest),
// so the frame is what a real game looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

// Steer the player: run from the nearest enemy, shoot at it, dash when crowded.
function autopilot(state) {
  const p = state.player;
  let nearest = null; let nd = Infinity;
  for (const e of state.enemies) {
    if (!e.active) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < nd) { nd = d; nearest = e; }
  }
  let dx = 0; let dy = 0;
  if (nearest) {
    const away = nd < 170 ? 1 : -0.25;
    dx = ((p.x - nearest.x) / (nd || 1)) * away;
    dy = ((p.y - nearest.y) / (nd || 1)) * away;
    // drift toward centre so the pilot does not hug a wall
    dx += (640 - p.x) / 640 * 0.3; dy += (360 - p.y) / 360 * 0.3;
    const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    return { dx, dy, aimX: nearest.x, aimY: nearest.y, firing: true, dash: nd < 90 };
  }
  return { dx: 0, dy: -0.4, aimX: p.x, aimY: p.y - 100, firing: false, dash: false };
}

function simulate(world, seconds, audio) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    const input = autopilot(world.state);
    world.step(STEP, input, audio, true);
    if (world.state.over || world.state.won) break;
    // level-up cards would pause a real game; the pilot just takes the first card.
    if (world.state.waveState === 'levelup') world.applyCard(0);
  }
}

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'boss' && name !== 'end') {
    simulate(world, 3, null);
    return { screen: SCREEN_TITLE, best: 0, bestWave: 0 };
  }
  if (name === 'boss') {
    // Jump the real simulation to the first boss wave (wave 5), then play it out
    // briefly, with the keeper healed, so the frame shows the fight, not its end.
    world.state.wave = 4; world.state.waveState = 'intermission'; world.state.intermission = 0.1;
    world.state.player.hp = world.state.stats.maxHp;
    simulate(world, 14, null);
    if (world.state.over) { world.state.over = false; world.state.waveState = 'fighting'; world.state.player.hp = world.state.stats.maxHp; }
    return { screen: SCREEN_PLAY, best: world.state.score, bestWave: world.state.wave };
  }
  if (name === 'end') {
    simulate(world, 200, null);
    if (!world.state.over && !world.state.won) {
      // The pilot survived too long: leave it one hit from death and let the grove finish it.
      world.state.player.hp = 1; world.state.player.invuln = 0;
      simulate(world, 40, null);
    }
    if (world.state.won) return { screen: SCREEN_WIN, best: world.state.score, bestWave: world.state.wave };
    return { screen: SCREEN_OVER, best: world.state.score, bestWave: world.state.wave };
  }
  // Play until a wave is properly busy, then freeze the frame there.
  for (let s = 0; s < 240; s += 1) {
    simulate(world, 0.25, null);
    const busy = world.state.enemies.filter((e) => e.active).length;
    if (world.state.wave >= 2 && busy >= 10) break;
    if (world.state.over || world.state.won) break;
  }
  return { screen: SCREEN_PLAY, best: world.state.score, bestWave: world.state.wave };
}
