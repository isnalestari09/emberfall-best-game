// Keyboard + mouse input. WASD/arrows move, mouse aims, hold click (or hold Space) to shoot,
// Shift or Space (tap) dashes, P/Escape pauses, M mutes, Enter/Space confirms, R restarts, 1-3 pick a card.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;
export const ACTION_DASH = 16;

export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: 640, y: 360, down: false };
  let actions = 0;
  let cardPick = 0;

  function key(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    if (e.type === 'keydown') {
      if (!e.repeat) {
        if (k === 'Enter' || k === ' ') actions |= ACTION_CONFIRM;
        if (k === 'p' || k === 'P' || k === 'Escape') actions |= ACTION_PAUSE;
        if (k === 'r' || k === 'R') actions |= ACTION_RESTART;
        if (k === 'm' || k === 'M') actions |= ACTION_MUTE;
        if (k === 'Shift') actions |= ACTION_DASH;
        if (k === '1') cardPick = 1;
        if (k === '2') cardPick = 2;
        if (k === '3') cardPick = 3;
      }
      keys.add(k);
    } else keys.delete(k);
  }
  function move(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
  }
  window.addEventListener('keydown', key);
  window.addEventListener('keyup', key);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mousedown', (e) => { move(e); mouse.down = true; if (e.button === 0) actions |= ACTION_CONFIRM; });
  window.addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    mouse,
    takeActions() { const a = actions; actions = 0; return a; },
    takeCardPick() { const c = cardPick; cardPick = 0; return c; },
    direction() {
      let x = 0; let y = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) x += 1;
      if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) y += 1;
      if (x && y) { x *= 0.7071; y *= 0.7071; }
      return { x, y };
    },
    // Aim in logical field coordinates: the canvas is scaled, so un-scale the mouse.
    aim(scale, ox, oy) { return { x: (mouse.x - ox) / scale, y: (mouse.y - oy) / scale }; },
    firing() { return mouse.down || keys.has(' '); },
    dashPressed() { return keys.has('Shift'); },
  };
}
