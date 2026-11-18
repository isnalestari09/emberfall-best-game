// EMBERFALL — Lantern of the Last Grove. Original top-down wave-survival arena shooter.
// Tuning, palette and field in one place. Logical field 1280x720, renderer scales to window.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const PLAYER = {
  radius: 16, speed: 265, hp: 100, fireInterval: 0.34, bulletSpeed: 620,
  bulletDamage: 22, bulletRadius: 5, dashSpeed: 780, dashTime: 0.16, dashCooldown: 2.2,
  pickupRadius: 90, contactDamageCooldown: 0.7,
};
export const WAVES = { total: 10, intermission: 4, bossWaves: [5, 10] };
export const ENEMY = {
  mote:   { hp: 26,  speed: 95,  radius: 13, damage: 9,  score: 10, xp: 1, color: '#ff7a3c' },
  wisp:   { hp: 18,  speed: 175, radius: 11, damage: 7,  score: 15, xp: 1, color: '#b78cff' },
  brute:  { hp: 130, speed: 52,  radius: 24, damage: 18, score: 30, xp: 3, color: '#e5534b' },
  spitter:{ hp: 34,  speed: 70,  radius: 14, damage: 8,  score: 25, xp: 2, color: '#5ee6a8' },
  boss:   { hp: 900, speed: 58,  radius: 42, damage: 24, score: 500, xp: 20, color: '#ff2e63' },
};
export const POOL = { enemies: 96, bullets: 160, ebullets: 96, gems: 160, particles: 420, texts: 48 };
export const PALETTE = {
  backdrop: '#0a0d12', grove: '#101a14', grove2: '#0d1510', tree: '#1d3a28', treeDark: '#142a1d',
  rock: '#3a4152', path: '#1a2230', player: '#ffd166', playerCore: '#fff3c4',
  bullet: '#ffcf5c', gem: '#7df9ff', heart: '#ff5c7a', text: '#f2ead8', muted: '#9aa78f',
  panel: 'rgba(12,18,14,0.88)', panelEdge: '#3d5a44', danger: '#ff4d4d', gold: '#f2c94c',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'emberfall.best';
export const WAVE_KEY = 'emberfall.wave';
// Level-up cards. id, title, blurb, apply(stats).
export const CARDS = [
  { id: 'damage',  title: 'Ember Rounds',  blurb: '+30% bullet damage',        apply: (s) => { s.damage *= 1.3; } },
  { id: 'rate',    title: 'Rapid Lantern', blurb: '+25% fire rate',           apply: (s) => { s.fireInterval *= 0.8; } },
  { id: 'multi',   title: 'Split Flame',   blurb: '+1 bullet per shot',       apply: (s) => { s.shots += 1; } },
  { id: 'pierce',  title: 'Piercing Light',blurb: 'Bullets pierce +1 enemy',  apply: (s) => { s.pierce += 1; } },
  { id: 'speed',   title: 'Swift Boots',   blurb: '+15% move speed',          apply: (s) => { s.speed *= 1.15; } },
  { id: 'dash',    title: 'Ghost Dash',    blurb: 'Dash recharges 40% faster',apply: (s) => { s.dashCooldown *= 0.6; } },
  { id: 'heart',   title: 'Warm Hearth',   blurb: '+25 max HP and heal 25',   apply: (s) => { s.maxHp += 25; s.heal = 25; } },
  { id: 'magnet',  title: 'Ember Magnet',  blurb: '+70% pickup radius',       apply: (s) => { s.pickupRadius *= 1.7; } },
];
