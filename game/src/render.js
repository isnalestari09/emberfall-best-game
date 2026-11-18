// Drawing only: world state + screen in, pixels out. 1280x720 logical field scaled to window.
import { ENEMY, FIELD, FONT, PALETTE, WAVES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';
export const SCREEN_LEVELUP = 'levelup';

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();
  function font(size) { if (!fonts.has(size)) fonts.set(size, `700 ${size}px ${FONT}`); return fonts.get(size); }
  function fontN(size) { if (!fonts.has('n' + size)) fonts.set('n' + size, `${size}px ${FONT}`); return fonts.get('n' + size); }
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const w = Math.round(window.innerWidth * ratio); const h = Math.round(window.innerHeight * ratio);
    canvas.width = w; canvas.height = h;
    view.scale = Math.min(w / FIELD.width, h / FIELD.height);
    view.x = (w - FIELD.width * view.scale) / 2; view.y = (h - FIELD.height * view.scale) / 2;
  }
  function text(value, x, y, size, color, align, bold) {
    context.font = bold ? font(size) : fontN(size); context.fillStyle = color;
    context.textAlign = align || 'left'; context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }
  function panel(x, y, w, h) {
    context.fillStyle = PALETTE.panel; context.strokeStyle = PALETTE.panelEdge; context.lineWidth = 2;
    context.beginPath(); context.roundRect(x, y, w, h, 14); context.fill(); context.stroke();
  }
  function bar(x, y, w, h, frac, color, bg) {
    context.fillStyle = bg || 'rgba(0,0,0,0.55)'; context.fillRect(x, y, w, h);
    context.fillStyle = color; context.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  }

  function drawWorld(state) {
    const p = state.player;
    const shx = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    const shy = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    context.save();
    context.translate(view.x + shx * view.scale, view.y + shy * view.scale);
    context.scale(view.scale, view.scale);
    // grove floor
    context.fillStyle = PALETTE.grove; context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.grove2;
    for (let gx = 0; gx < FIELD.width; gx += 160) for (let gy = 0; gy < FIELD.height; gy += 160) {
      if (((gx + gy) / 160) % 2 === 0) context.fillRect(gx, gy, 160, 160);
    }
    // winding path
    context.strokeStyle = PALETTE.path; context.lineWidth = 46; context.lineCap = 'round';
    context.beginPath(); context.moveTo(0, 360); context.bezierCurveTo(320, 300, 640, 430, 1280, 360); context.stroke();
    context.strokeStyle = 'rgba(255,209,102,0.05)'; context.lineWidth = 2;
    for (let i = 0; i < 40; i += 1) { const x = (i * 97) % FIELD.width; const y = (i * 61) % FIELD.height; context.fillStyle = 'rgba(255,180,80,0.10)'; context.beginPath(); context.arc(x, y, 2, 0, Math.PI * 2); context.fill(); }
    // obstacles
    for (const o of state.obstacles) {
      if (o.kind === 'tree') {
        context.fillStyle = PALETTE.treeDark; context.beginPath(); context.arc(o.x, o.y + 6, o.r + 6, 0, Math.PI * 2); context.fill();
        context.fillStyle = PALETTE.tree; context.beginPath(); context.arc(o.x, o.y, o.r, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#2c5a3a'; context.beginPath(); context.arc(o.x - 8, o.y - 8, o.r * 0.45, 0, Math.PI * 2); context.fill();
      } else {
        context.fillStyle = PALETTE.rock; context.beginPath(); context.arc(o.x, o.y, o.r, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#4a5268'; context.beginPath(); context.arc(o.x - 6, o.y - 6, o.r * 0.5, 0, Math.PI * 2); context.fill();
      }
    }
    // gems
    for (const g of state.gems) {
      if (!g.active) continue;
      const bob = Math.sin(g.t * 4) * 2;
      context.fillStyle = PALETTE.gem; context.save(); context.translate(g.x, g.y + bob); context.rotate(Math.PI / 4);
      context.fillRect(-5, -5, 10, 10); context.restore();
    }
    // enemy bullets
    for (const b of state.ebullets) {
      if (!b.active) continue;
      context.fillStyle = '#ff5c8a'; context.beginPath(); context.arc(b.x, b.y, 7, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#ffd7e2'; context.beginPath(); context.arc(b.x, b.y, 3, 0, Math.PI * 2); context.fill();
    }
    // enemies
    for (const e of state.enemies) {
      if (!e.active) continue;
      const def = ENEMY[e.kind];
      context.save(); context.translate(e.x, e.y);
      if (e.kind === 'boss') {
        context.fillStyle = 'rgba(255,46,99,0.25)'; context.beginPath(); context.arc(0, 0, e.radius + 12 + Math.sin(e.t * 3) * 4, 0, Math.PI * 2); context.fill();
      }
      context.fillStyle = e.flash > 0 ? '#ffffff' : def.color;
      context.beginPath(); context.arc(0, 0, e.radius, 0, Math.PI * 2); context.fill();
      // eyes
      context.fillStyle = '#1a0b0b';
      const ex = e.kind === 'brute' ? 8 : 5; const ey = -3;
      context.beginPath(); context.arc(-ex, ey, 3, 0, Math.PI * 2); context.arc(ex, ey, 3, 0, Math.PI * 2); context.fill();
      if (e.kind === 'wisp') { context.fillStyle = 'rgba(183,140,255,0.5)'; context.beginPath(); context.arc(0, -e.radius - 4, 5, 0, Math.PI * 2); context.fill(); }
      if (e.kind === 'spitter') { context.fillStyle = '#0d2b1d'; context.beginPath(); context.arc(0, 6, 5, 0, Math.PI * 2); context.fill(); }
      // hp bar
      if (e.hp < e.maxHp) {
        context.fillStyle = 'rgba(0,0,0,0.6)'; context.fillRect(-e.radius, -e.radius - 12, e.radius * 2, 5);
        context.fillStyle = '#ff5c5c'; context.fillRect(-e.radius, -e.radius - 12, e.radius * 2 * (e.hp / e.maxHp), 5);
      }
      context.restore();
    }
    // player bullets
    for (const b of state.bullets) {
      if (!b.active) continue;
      context.fillStyle = PALETTE.bullet; context.beginPath(); context.arc(b.x, b.y, 6, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#fff6d8'; context.beginPath(); context.arc(b.x, b.y, 2.5, 0, Math.PI * 2); context.fill();
    }
    // player: lantern keeper with glow
    const blink = p.invuln > 0 && Math.floor(state.time * 12) % 2 === 0;
    if (!blink) {
      const glow = context.createRadialGradient(p.x, p.y, 8, p.x, p.y, 150);
      glow.addColorStop(0, 'rgba(255,209,102,0.35)'); glow.addColorStop(1, 'rgba(255,209,102,0)');
      context.fillStyle = glow; context.beginPath(); context.arc(p.x, p.y, 150, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#2b3a2e'; context.beginPath(); context.arc(p.x, p.y, PLAYER_R(p), 0, Math.PI * 2); context.fill();
      context.fillStyle = PALETTE.player; context.beginPath(); context.arc(p.x, p.y, 13, 0, Math.PI * 2); context.fill();
      // lantern held toward aim
      const lx = p.x + Math.cos(p.angle) * 20; const ly = p.y + Math.sin(p.angle) * 20;
      context.fillStyle = '#8a6d2f'; context.fillRect(lx - 4, ly - 6, 8, 12);
      context.fillStyle = PALETTE.playerCore; context.beginPath(); context.arc(lx, ly, 5, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#1a0b0b'; context.beginPath(); context.arc(p.x - 4, p.y - 2, 2.4, 0, Math.PI * 2); context.arc(p.x + 4, p.y - 2, 2.4, 0, Math.PI * 2); context.fill();
    }
    // dash cooldown ring
    if (p.dashCd > 0) {
      context.strokeStyle = 'rgba(125,249,255,0.7)'; context.lineWidth = 3;
      context.beginPath(); context.arc(p.x, p.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p.dashCd / state.stats.dashCooldown)); context.stroke();
    }
    // particles
    for (const pt of state.particles) {
      if (!pt.active) continue;
      context.globalAlpha = Math.max(0, pt.life / pt.max);
      context.fillStyle = pt.color; context.beginPath(); context.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
    // floating texts
    for (const t of state.texts) {
      if (!t.active) continue;
      context.globalAlpha = Math.min(1, t.life / 0.4);
      text(t.text, t.x, t.y, t.size, t.color, 'center', true);
    }
    context.globalAlpha = 1;
    // vignette + flash
    const vg = context.createRadialGradient(640, 360, 300, 640, 360, 760);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    context.fillStyle = vg; context.fillRect(0, 0, FIELD.width, FIELD.height);
    if (state.flash > 0) { context.fillStyle = `rgba(255,240,200,${state.flash * 0.5})`; context.fillRect(0, 0, FIELD.width, FIELD.height); }
    context.restore();

    // HUD (screen space, unscaled by shake)
    context.save(); context.translate(view.x, view.y); context.scale(view.scale, view.scale);
    text(`SCORE ${state.score}`, 20, 34, 22, PALETTE.text, 'left', true);
    text(`WAVE ${Math.max(1, state.wave)} / ${WAVES.total}`, 20, 62, 17, PALETTE.muted, 'left', true);
    text(`KILLS ${state.kills}   COMBO x${state.combo}`, 20, 86, 15, state.combo >= 5 ? PALETTE.gold : PALETTE.muted, 'left', true);
    // HP + XP bars top right
    bar(880, 20, 380, 16, p.hp / state.stats.maxHp, '#ff5c7a');
    text(`HP ${Math.ceil(p.hp)} / ${state.stats.maxHp}`, 880, 52, 14, PALETTE.text, 'left', true);
    bar(880, 60, 380, 10, state.xp / state.xpNext, PALETTE.gem);
    text(`LV ${state.level}   XP ${state.xp}/${state.xpNext}`, 880, 86, 14, PALETTE.text, 'left', true);
    if (state.waveState === 'intermission' && state.wave < WAVES.total) {
      text(`WAVE ${state.wave + 1} IN ${Math.ceil(state.intermission)}…`, 640, 130, 26, PALETTE.gold, 'center', true);
    }
    if (WAVES.bossWaves.includes(state.wave) && state.enemies.some((e) => e.active && e.kind === 'boss')) {
      const boss = state.enemies.find((e) => e.active && e.kind === 'boss');
      text('ASH TITAN', 640, 116, 18, '#ff5c7a', 'center', true);
      bar(440, 124, 400, 10, boss.hp / boss.maxHp, '#ff2e63');
    }
    context.restore();
  }
  function PLAYER_R() { return 16; }

  function drawTitle(state, best, bestWave) {
    drawWorld(state);
    context.save(); context.translate(view.x, view.y); context.scale(view.scale, view.scale);
    context.fillStyle = 'rgba(5,8,6,0.55)'; context.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(290, 110, 700, 500);
    text('EMBERFALL', 640, 190, 64, PALETTE.gold, 'center', true);
    text('Lantern of the Last Grove', 640, 228, 22, PALETTE.text, 'center', false);
    text('The grove is falling to ash. Keep your lantern lit,', 640, 290, 18, PALETTE.muted, 'center', false);
    text('survive all 10 waves — and face the Ash Titan.', 640, 316, 18, PALETTE.muted, 'center', false);
    text('WASD / Arrows — move      Mouse — aim', 640, 368, 17, PALETTE.text, 'center', false);
    text('Hold Click / Space — shoot      Shift — dash', 640, 394, 17, PALETTE.text, 'center', false);
    text('Collect ember gems to level up and pick a boon.', 640, 420, 17, PALETTE.text, 'center', false);
    text('P — pause      M — mute      R — restart', 640, 446, 17, PALETTE.text, 'center', false);
    text('PRESS ENTER OR CLICK TO BEGIN', 640, 520, 22, PALETTE.player, 'center', true);
    if (best > 0) text(`Best score ${best}   •   Best wave ${bestWave}`, 640, 560, 16, PALETTE.muted, 'center', false);
    context.restore();
  }

  function drawPaused(state) {
    drawWorld(state);
    context.save(); context.translate(view.x, view.y); context.scale(view.scale, view.scale);
    context.fillStyle = 'rgba(5,8,6,0.6)'; context.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(440, 260, 400, 200);
    text('PAUSED', 640, 330, 40, PALETTE.text, 'center', true);
    text('P / Esc to resume — R to restart', 640, 380, 17, PALETTE.muted, 'center', false);
    text(`Score ${state.score}   •   Wave ${state.wave}   •   Level ${state.level}`, 640, 414, 16, PALETTE.muted, 'center', false);
    context.restore();
  }

  function drawOver(state, best, win) {
    drawWorld(state);
    context.save(); context.translate(view.x, view.y); context.scale(view.scale, view.scale);
    context.fillStyle = 'rgba(5,8,6,0.65)'; context.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(340, 170, 600, 380);
    text(win ? 'THE GROVE IS SAVED!' : 'THE LANTERN FADES…', 640, 250, 36, win ? PALETTE.gold : '#ff5c7a', 'center', true);
    text(win ? 'You survived all 10 waves and felled the Ash Titan.' : `The embers took you on wave ${state.wave}.`, 640, 296, 18, PALETTE.text, 'center', false);
    text(`Score ${state.score}`, 640, 350, 26, PALETTE.text, 'center', true);
    text(`Kills ${state.kills}   •   Best combo x${state.bestCombo}   •   Level ${state.level}`, 640, 386, 17, PALETTE.muted, 'center', false);
    text(`Best score ${best}`, 640, 416, 17, PALETTE.muted, 'center', false);
    text('PRESS R OR ENTER TO PLAY AGAIN', 640, 486, 20, PALETTE.player, 'center', true);
    context.restore();
  }

  function drawLevelup(state) {
    drawWorld(state);
    context.save(); context.translate(view.x, view.y); context.scale(view.scale, view.scale);
    context.fillStyle = 'rgba(5,8,6,0.6)'; context.fillRect(0, 0, FIELD.width, FIELD.height);
    text('LEVEL UP!', 640, 150, 44, PALETTE.gold, 'center', true);
    text('Choose a boon — click a card or press 1 / 2 / 3', 640, 190, 18, PALETTE.text, 'center', false);
    state.choices.forEach((card, i) => {
      const x = 290 + i * 240; const y = 240;
      panel(x, y, 220, 220);
      text(`${i + 1}`, 400 + i * 240 - 90, y + 44, 20, PALETTE.gold, 'center', true);
      text(card.title, x + 110, y + 96, 20, PALETTE.text, 'center', true);
      text(card.blurb, x + 110, y + 132, 16, PALETTE.muted, 'center', false);
      text(card.blurb.includes('+') ? '' : '', x + 110, y + 160, 14, PALETTE.muted, 'center', false);
    });
    context.restore();
  }

  function draw(state, screen, best, bestWave) {
    resize();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop; context.fillRect(0, 0, canvas.width, canvas.height);
    if (screen === SCREEN_TITLE) drawTitle(state, best, bestWave);
    else if (screen === SCREEN_PAUSED) drawPaused(state);
    else if (screen === SCREEN_OVER) drawOver(state, best, false);
    else if (screen === SCREEN_WIN) drawOver(state, best, true);
    else if (screen === SCREEN_LEVELUP) drawLevelup(state);
    else drawWorld(state);
  }

  return { draw, view };
}
