// Boot and the one loop. Fixed 1/60 s steps, input every frame, renderer paints the state.
// Screens: title, play, paused, levelup (card pick), game over, win.
// ?seed=N fixes the waves. ?shot=start|play|boss|end stages that scene, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP, WAVE_KEY, WAVES } from './config.js';
import { createRandom } from './random.js';
import { EVENT_LEVELUP, EVENT_OVER, EVENT_WIN, createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_DASH, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { SCREEN_LEVELUP, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, createRenderer } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readNum(key) { try { return Number.parseInt(window.localStorage.getItem(key) ?? '0', 10) || 0; } catch { return 0; } }
function saveNum(key, value) { try { window.localStorage.setItem(key, String(value)); } catch { /* private mode */ } }

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, scene.bestWave);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readNum(BEST_KEY); let bestWave = readNum(WAVE_KEY);
  let accumulator = 0; let last = performance.now();
  let muted = false;

  function announce(message) { status.textContent = message; }
  function recordBest() {
    if (world.state.score > best) { best = world.state.score; saveNum(BEST_KEY, best); }
    if (world.state.wave > bestWave) { bestWave = world.state.wave; saveNum(WAVE_KEY, bestWave); }
  }
  function startGame() {
    world.reset(); accumulator = 0; screen = SCREEN_PLAY;
    audio.unlock();
    announce(`Playing. Survive ${WAVES.total} waves.`);
  }
  function endGame(win) {
    recordBest();
    screen = win ? SCREEN_WIN : SCREEN_OVER;
    announce(win ? `You won! Score ${world.state.score}.` : `Game over. Score ${world.state.score}. Best ${best}.`);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) { muted = audio.toggleMute(); announce(muted ? 'Muted.' : 'Sound on.'); }
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) { startGame(); return; }
    if (screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) startGame();
      world.step(STEP, { dx: 0, dy: 0, aimX: 640, aimY: 200, firing: false, dash: false }, null, true);
      renderer.draw(world.state, screen, best, bestWave);
      return;
    }
    if (screen === SCREEN_LEVELUP) {
      const pick = input.takeCardPick();
      let clicked = -1;
      // mouse click on a card: cards are at x 290/530/770, y 240-460 in logical coords
      if (actions & ACTION_CONFIRM) {
        const a = input.aim(renderer.view.scale, renderer.view.x, renderer.view.y);
        if (a.y >= 240 && a.y <= 460) {
          if (a.x >= 290 && a.x < 510) clicked = 0;
          else if (a.x >= 530 && a.x < 750) clicked = 1;
          else if (a.x >= 770 && a.x < 990) clicked = 2;
        }
      }
      const choice = pick > 0 ? pick - 1 : clicked;
      if (choice >= 0 && world.applyCard(choice)) {
        screen = SCREEN_PLAY;
        announce('Boon chosen. Fight on!');
      }
      renderer.draw(world.state, screen, best, bestWave);
      return;
    }
    if (actions & ACTION_PAUSE && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
    }
    if (screen === SCREEN_PAUSED) { renderer.draw(world.state, screen, best, bestWave); accumulator = 0; return; }
    if (screen === SCREEN_OVER || screen === SCREEN_WIN) {
      if (actions & ACTION_CONFIRM) startGame();
      renderer.draw(world.state, screen, best, bestWave);
      return;
    }
    // play
    while (accumulator >= STEP) {
      const dir = input.direction();
      const aim = input.aim(renderer.view.scale, renderer.view.x, renderer.view.y);
      const events = world.step(STEP, {
        dx: dir.x, dy: dir.y, aimX: aim.x, aimY: aim.y,
        firing: input.firing(), dash: (actions & ACTION_DASH) || input.dashPressed(),
      }, audio, false);
      accumulator -= STEP;
      if (events & EVENT_OVER) { endGame(false); break; }
      if (events & EVENT_WIN) { endGame(true); break; }
      if (events & EVENT_LEVELUP) { screen = SCREEN_LEVELUP; announce('Level up! Choose a boon.'); break; }
    }
    renderer.draw(world.state, screen, best, bestWave);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
  });
  announce('Emberfall. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
