// The world: player, waves, enemies, bullets, gems, particles, obstacles, scoring, levelling.
// Fixed-step simulation, no rendering here. Pools are allocated once at reset.
import { CARDS, ENEMY, FIELD, PLAYER, POOL, WAVES } from './config.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_WIN = 4;
export const EVENT_LEVELUP = 8;
export const EVENT_WAVE = 16;
export const EVENT_KILL = 32;

const TAU = Math.PI * 2;

function makePool(n, factory) { const a = []; for (let i = 0; i < n; i += 1) a.push(factory()); return a; }

export function createWorld(random) {
  const state = {
    time: 0, score: 0, kills: 0, wave: 0, combo: 0, comboTimer: 0, bestCombo: 0,
    xp: 0, level: 1, xpNext: 8, shake: 0, flash: 0, waveState: 'intermission',
    intermission: 2.5, spawnLeft: 0, spawnTimer: 0, spawnKinds: [], bossSpawned: false,
    choices: [], levelPending: 0, won: false, over: false,
    player: null, enemies: [], bullets: [], ebullets: [], gems: [], particles: [], texts: [],
    obstacles: [], stats: null,
  };

  function freshStats() {
    return {
      damage: PLAYER.bulletDamage, fireInterval: PLAYER.fireInterval, shots: 1, pierce: 0,
      speed: PLAYER.speed, dashCooldown: PLAYER.dashCooldown, pickupRadius: PLAYER.pickupRadius,
      maxHp: PLAYER.hp, heal: 0,
    };
  }

  function reset() {
    state.time = 0; state.score = 0; state.kills = 0; state.wave = 0; state.combo = 0;
    state.comboTimer = 0; state.bestCombo = 0; state.xp = 0; state.level = 1; state.xpNext = 8;
    state.shake = 0; state.flash = 0; state.waveState = 'intermission'; state.intermission = 2.5;
    state.spawnLeft = 0; state.spawnTimer = 0; state.spawnKinds = []; state.bossSpawned = false;
    state.choices = []; state.levelPending = 0; state.won = false; state.over = false;
    state.stats = freshStats();
    state.player = {
      x: FIELD.width / 2, y: FIELD.height / 2, vx: 0, vy: 0, hp: PLAYER.hp, angle: -Math.PI / 2,
      fireCd: 0, dashCd: 0, dashTime: 0, dashDirX: 0, dashDirY: -1, invuln: 0, contactCd: 0,
    };
    state.enemies = makePool(POOL.enemies, () => ({ active: false, kind: 'mote', x: 0, y: 0, vx: 0, vy: 0, hp: 1, maxHp: 1, speed: 0, radius: 10, damage: 0, score: 0, xp: 0, t: 0, shootCd: 0, flash: 0 }));
    state.bullets = makePool(POOL.bullets, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, damage: 0, pierce: 0, life: 0 }));
    state.ebullets = makePool(POOL.ebullets, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, damage: 0, life: 0 }));
    state.gems = makePool(POOL.gems, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, value: 1, t: 0 }));
    state.particles = makePool(POOL.particles, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 3, color: '#fff' }));
    state.texts = makePool(POOL.texts, () => ({ active: false, x: 0, y: 0, life: 0, text: '', color: '#fff', size: 16 }));
    // Fixed grove: trees and rocks the player and enemies walk around (same every run).
    state.obstacles = [
      { x: 180, y: 150, r: 34, kind: 'tree' }, { x: 1100, y: 140, r: 34, kind: 'tree' },
      { x: 170, y: 580, r: 30, kind: 'tree' }, { x: 1110, y: 590, r: 34, kind: 'tree' },
      { x: 640, y: 110, r: 26, kind: 'rock' }, { x: 640, y: 620, r: 26, kind: 'rock' },
      { x: 320, y: 360, r: 22, kind: 'rock' }, { x: 960, y: 360, r: 22, kind: 'rock' },
    ];
  }

  function spawnParticle(x, y, color, n, speed, life, size) {
    for (let i = 0; i < n; i += 1) {
      const p = state.particles.find((q) => !q.active); if (!p) return;
      const a = random.next() * TAU; const s = speed * random.range(0.3, 1);
      p.active = true; p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
      p.life = p.max = life * random.range(0.6, 1.2); p.size = size * random.range(0.7, 1.3); p.color = color;
    }
  }
  function addText(x, y, text, color, size) {
    const t = state.texts.find((q) => !q.active); if (!t) return;
    t.active = true; t.x = x; t.y = y; t.life = 0.9; t.text = text; t.color = color; t.size = size || 16;
  }
  function dropGem(x, y, value) {
    const g = state.gems.find((q) => !q.active); if (!g) return;
    g.active = true; g.x = x; g.y = y; const a = random.next() * TAU;
    g.vx = Math.cos(a) * 90; g.vy = Math.sin(a) * 90; g.value = value; g.t = random.next() * TAU;
  }

  function waveComposition(wave) {
    const kinds = [];
    const total = 8 + wave * 4;
    for (let i = 0; i < total; i += 1) {
      const r = random.next();
      if (wave >= 4 && r < 0.12) kinds.push('brute');
      else if (wave >= 3 && r < 0.28) kinds.push('spitter');
      else if (wave >= 2 && r < 0.52) kinds.push('wisp');
      else kinds.push('mote');
    }
    return kinds;
  }

  function startWave(wave) {
    state.wave = wave; state.waveState = 'fighting';
    state.spawnKinds = waveComposition(wave); state.spawnLeft = state.spawnKinds.length;
    state.spawnTimer = 0.4; state.bossSpawned = false;
    if (WAVES.bossWaves.includes(wave)) { state.spawnLeft += 1; }
    return EVENT_WAVE;
  }

  function spawnEnemy(kind) {
    const e = state.enemies.find((q) => !q.active); if (!e) return;
    const def = ENEMY[kind]; const edge = random.int(0, 3);
    let x; let y;
    if (edge === 0) { x = random.range(40, FIELD.width - 40); y = 30; }
    else if (edge === 1) { x = random.range(40, FIELD.width - 40); y = FIELD.height - 30; }
    else if (edge === 2) { x = 30; y = random.range(40, FIELD.height - 40); }
    else { x = FIELD.width - 30; y = random.range(40, FIELD.height - 40); }
    const hpScale = 1 + (state.wave - 1) * 0.09;
    e.active = true; e.kind = kind; e.x = x; e.y = y; e.vx = 0; e.vy = 0;
    e.hp = e.maxHp = Math.round(def.hp * hpScale); e.speed = def.speed * random.range(0.9, 1.1);
    e.radius = def.radius; e.damage = def.damage; e.score = def.score; e.xp = def.xp;
    e.t = random.next() * TAU; e.shootCd = random.range(1, 2.4); e.flash = 0;
    spawnParticle(x, y, def.color, 8, 120, 0.4, 3);
  }

  function fireBullet(angle) {
    const b = state.bullets.find((q) => !q.active); if (!b) return;
    const p = state.player; const s = state.stats;
    b.active = true; b.x = p.x + Math.cos(angle) * 22; b.y = p.y + Math.sin(angle) * 22;
    b.vx = Math.cos(angle) * PLAYER.bulletSpeed; b.vy = Math.sin(angle) * PLAYER.bulletSpeed;
    b.damage = s.damage; b.pierce = s.pierce; b.life = 1.1;
  }

  function shoot(audio) {
    const p = state.player; const s = state.stats;
    if (p.fireCd > 0) return;
    p.fireCd = s.fireInterval;
    const n = s.shots; const spread = 0.11;
    for (let i = 0; i < n; i += 1) {
      const off = (i - (n - 1) / 2) * spread;
      fireBullet(p.angle + off);
    }
    spawnParticle(p.x + Math.cos(p.angle) * 24, p.y + Math.sin(p.angle) * 24, '#ffcf5c', 2, 80, 0.2, 2);
    if (audio) audio.shoot();
  }

  function killEnemy(e, audio) {
    e.active = false; state.kills += 1;
    state.combo += 1; state.comboTimer = 3;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    const mult = 1 + Math.min(state.combo, 20) * 0.05;
    const gained = Math.round(e.score * mult);
    state.score += gained;
    addText(e.x, e.y - e.radius, `+${gained}`, '#f2c94c', 15);
    spawnParticle(e.x, e.y, ENEMY[e.kind].color, e.kind === 'boss' ? 40 : 14, 220, 0.6, 4);
    for (let i = 0; i < e.xp; i += 1) dropGem(e.x + random.range(-14, 14), e.y + random.range(-14, 14), 1);
    if (e.kind === 'boss') {
      dropGem(e.x, e.y, 5);
      state.flash = 0.4; state.shake = 14;
      addText(e.x, e.y - 60, 'ASH TITAN DOWN!', '#ff5c7a', 24);
    }
    if (audio) audio.kill();
  }

  function gainXp(n, audio) {
    state.xp += n;
    while (state.xp >= state.xpNext) {
      state.xp -= state.xpNext; state.level += 1; state.xpNext = 8 + state.level * 6;
      state.levelPending += 1;
    }
    if (state.levelPending > 0 && state.waveState !== 'levelup') {
      state.waveState = 'levelup'; state.levelPending -= 1;
      const pool = [...CARDS];
      state.choices = [];
      for (let i = 0; i < 3; i += 1) state.choices.push(pool.splice(random.int(0, pool.length - 1), 1)[0]);
      if (audio) audio.levelup();
      return EVENT_LEVELUP;
    }
    return 0;
  }

  function applyCard(index) {
    const card = state.choices[index]; if (!card) return false;
    card.apply(state.stats);
    if (state.stats.heal) { state.player.hp = Math.min(state.stats.maxHp, state.player.hp + state.stats.heal); state.stats.heal = 0; }
    state.choices = [];
    state.waveState = state.spawnLeft > 0 || state.enemies.some((e) => e.active) ? 'fighting' : 'intermission';
    if (state.waveState === 'intermission') state.intermission = 2;
    if (state.levelPending > 0) {
      state.levelPending -= 1; state.waveState = 'levelup';
      const pool = [...CARDS]; state.choices = [];
      for (let i = 0; i < 3; i += 1) state.choices.push(pool.splice(random.int(0, pool.length - 1), 1)[0]);
    }
    return true;
  }

  function pushOutOfObstacles(body) {
    for (const o of state.obstacles) {
      const dx = body.x - o.x; const dy = body.y - o.y; const d = Math.hypot(dx, dy);
      const min = o.r + (body.radius || 16);
      if (d > 0 && d < min) { body.x = o.x + (dx / d) * min; body.y = o.y + (dy / d) * min; }
    }
  }

  function step(dt, input, audio, demo) {
    let events = 0;
    state.time += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
    if (state.comboTimer > 0) { state.comboTimer -= dt; if (state.comboTimer <= 0) state.combo = 0; }
    const p = state.player; const s = state.stats;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.contactCd > 0) p.contactCd -= dt;
    if (p.fireCd > 0) p.fireCd -= dt;
    if (p.dashCd > 0) p.dashCd -= dt;

    // --- wave flow ---
    if (state.waveState === 'intermission') {
      state.intermission -= dt;
      if (state.intermission <= 0 && !state.won && !state.over) {
        events |= startWave(state.wave + 1);
        if (audio) { if (WAVES.bossWaves.includes(state.wave)) audio.boss(); else audio.wave(); }
      }
    } else if (state.waveState === 'fighting') {
      if (state.spawnLeft > 0) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          state.spawnTimer = Math.max(0.22, 0.55 - state.wave * 0.04);
          if (WAVES.bossWaves.includes(state.wave) && !state.bossSpawned) { spawnEnemy('boss'); state.bossSpawned = true; }
          else { spawnEnemy(state.spawnKinds.pop()); }
          state.spawnLeft -= 1;
        }
      } else if (!state.enemies.some((e) => e.active)) {
        const bonus = 50 * state.wave;
        state.score += bonus;
        addText(FIELD.width / 2, 140, `WAVE ${state.wave} CLEAR  +${bonus}`, '#7df9ff', 22);
        if (state.wave >= WAVES.total) {
          state.won = true; state.waveState = 'won';
          if (audio) audio.win();
          return events | EVENT_WIN;
        }
        state.waveState = 'intermission'; state.intermission = WAVES.intermission;
      }
    }

    // --- player ---
    const aimDx = (input.aimX ?? p.x) - p.x; const aimDy = (input.aimY ?? p.y) - p.y;
    if (Math.hypot(aimDx, aimDy) > 4) p.angle = Math.atan2(aimDy, aimDx);
    if (input.dash && p.dashCd <= 0 && p.dashTime <= 0 && (input.dx || input.dy)) {
      p.dashTime = PLAYER.dashTime; p.dashCd = s.dashCooldown; p.invuln = Math.max(p.invuln, 0.25);
      p.dashDirX = input.dx; p.dashDirY = input.dy;
      spawnParticle(p.x, p.y, '#7df9ff', 10, 160, 0.35, 3);
      if (audio) audio.dash();
    }
    if (p.dashTime > 0) {
      p.dashTime -= dt;
      p.x += p.dashDirX * PLAYER.dashSpeed * dt; p.y += p.dashDirY * PLAYER.dashSpeed * dt;
    } else {
      p.x += input.dx * s.speed * dt; p.y += input.dy * s.speed * dt;
    }
    p.x = Math.max(20, Math.min(FIELD.width - 20, p.x));
    p.y = Math.max(20, Math.min(FIELD.height - 20, p.y));
    pushOutOfObstacles(p);
    if (input.firing && state.waveState === 'fighting') shoot(audio);

    // --- enemies ---
    for (const e of state.enemies) {
      if (!e.active) continue;
      e.t += dt; if (e.flash > 0) e.flash -= dt;
      const dx = p.x - e.x; const dy = p.y - e.y; const d = Math.hypot(dx, dy) || 1;
      let mx = dx / d; let my = dy / d;
      if (e.kind === 'wisp') { const w = Math.sin(e.t * 5) * 0.7; const px = -my * w; const py = mx * w; mx += px; my += py; const m = Math.hypot(mx, my) || 1; mx /= m; my /= m; }
      if (e.kind === 'spitter' && d < 240) { mx = -mx; my = -my; }
      e.x += mx * e.speed * dt; e.y += my * e.speed * dt;
      e.x = Math.max(e.radius, Math.min(FIELD.width - e.radius, e.x));
      e.y = Math.max(e.radius, Math.min(FIELD.height - e.radius, e.y));
      pushOutOfObstacles(e);
      // separation
      for (const o of state.enemies) {
        if (!o.active || o === e) continue;
        const sx = e.x - o.x; const sy = e.y - o.y; const sd = Math.hypot(sx, sy);
        const min = e.radius + o.radius;
        if (sd > 0 && sd < min) { e.x += (sx / sd) * (min - sd) * 0.3; e.y += (sy / sd) * (min - sd) * 0.3; }
      }
      if (e.kind === 'spitter') {
        e.shootCd -= dt;
        if (e.shootCd <= 0 && d < 420) {
          e.shootCd = 2.4;
          const b = state.ebullets.find((q) => !q.active);
          if (b) { b.active = true; b.x = e.x; b.y = e.y; b.vx = (dx / d) * 230; b.vy = (dy / d) * 230; b.damage = e.damage; b.life = 3; }
        }
      }
      if (e.kind === 'boss') {
        e.shootCd -= dt;
        if (e.shootCd <= 0) {
          e.shootCd = 3;
          for (let i = 0; i < 10; i += 1) {
            const b = state.ebullets.find((q) => !q.active); if (!b) break;
            const a = (i / 10) * TAU;
            b.active = true; b.x = e.x; b.y = e.y; b.vx = Math.cos(a) * 170; b.vy = Math.sin(a) * 170; b.damage = 12; b.life = 4;
          }
          spawnEnemy('mote'); spawnEnemy('mote');
        }
      }
      // contact damage
      if (d < e.radius + PLAYER.radius && p.invuln <= 0 && p.contactCd <= 0 && !state.over) {
        p.hp -= e.damage; p.contactCd = PLAYER.contactDamageCooldown; p.invuln = 0.9;
        state.combo = 0; state.shake = 10;
        spawnParticle(p.x, p.y, '#ff5c7a', 12, 200, 0.5, 4);
        if (audio) audio.hurt();
        events |= EVENT_HIT;
        if (p.hp <= 0) {
          p.hp = 0; state.over = true; state.waveState = 'over';
          spawnParticle(p.x, p.y, '#ffd166', 40, 260, 0.9, 5);
          if (audio) audio.over();
          return events | EVENT_OVER;
        }
      }
    }

    // --- player bullets ---
    for (const b of state.bullets) {
      if (!b.active) continue;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < 0 || b.x > FIELD.width || b.y < 0 || b.y > FIELD.height) { b.active = false; continue; }
      for (const e of state.enemies) {
        if (!e.active) continue;
        const dx = e.x - b.x; const dy = e.y - b.y;
        if (dx * dx + dy * dy < (e.radius + PLAYER.bulletRadius) * (e.radius + PLAYER.bulletRadius)) {
          e.hp -= b.damage; e.flash = 0.12;
          addText(e.x, e.y - e.radius - 6, String(Math.round(b.damage)), '#ffffff', 13);
          spawnParticle(b.x, b.y, '#ffcf5c', 4, 140, 0.25, 3);
          if (audio) audio.hit();
          if (b.pierce > 0) { b.pierce -= 1; } else { b.active = false; }
          if (e.hp <= 0) { killEnemy(e, audio); events |= EVENT_KILL; events |= gainXp(e.xp, audio); }
          break;
        }
      }
    }

    // --- enemy bullets ---
    for (const b of state.ebullets) {
      if (!b.active) continue;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < 0 || b.x > FIELD.width || b.y < 0 || b.y > FIELD.height) { b.active = false; continue; }
      const dx = p.x - b.x; const dy = p.y - b.y;
      if (dx * dx + dy * dy < (PLAYER.radius + 7) * (PLAYER.radius + 7) && p.invuln <= 0 && !state.over) {
        b.active = false; p.hp -= b.damage; p.invuln = 0.7; state.combo = 0; state.shake = 8;
        if (audio) audio.hurt();
        events |= EVENT_HIT;
        if (p.hp <= 0) {
          p.hp = 0; state.over = true; state.waveState = 'over';
          if (audio) audio.over();
          return events | EVENT_OVER;
        }
      }
    }

    // --- gems ---
    for (const g of state.gems) {
      if (!g.active) continue;
      g.t += dt;
      const dx = p.x - g.x; const dy = p.y - g.y; const d = Math.hypot(dx, dy) || 1;
      if (d < s.pickupRadius) { g.x += (dx / d) * 420 * dt; g.y += (dy / d) * 420 * dt; }
      else { g.x += g.vx * dt; g.y += g.vy * dt; g.vx *= 0.92; g.vy *= 0.92; }
      if (d < PLAYER.radius + 12) {
        g.active = false; state.score += 2;
        events |= gainXp(g.value, audio);
        if (audio) audio.pickup();
      }
    }

    // --- particles & texts ---
    for (const pt of state.particles) { if (!pt.active) continue; pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vx *= 0.96; pt.vy *= 0.96; if (pt.life <= 0) pt.active = false; }
    for (const t of state.texts) { if (!t.active) continue; t.life -= dt; t.y -= 30 * dt; if (t.life <= 0) t.active = false; }

    // ambient embers drift up (visual only, spawned sparsely)
    if (random.next() < dt * 6) spawnParticle(random.range(0, FIELD.width), FIELD.height + 10, '#ff9a3c', 1, 20, 2.5, 2);
    return events;
  }

  reset();
  return { state, reset, step, applyCard, startWave };
}
