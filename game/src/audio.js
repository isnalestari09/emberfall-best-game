// All sound is synthesized live with WebAudio — no audio files, everything original.
// A tiny synth: short oscillator blips with envelopes, plus filtered noise for hits.
export function createAudio() {
  let ctx = null; let muted = false; let master = null;
  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
      } catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (muted || !ensure()) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq) {
    if (muted || !ensure()) return;
    const t = ctx.currentTime; const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t);
  }
  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    shoot() { tone(720, 0.09, 'square', 0.10, 240); },
    hit() { noise(0.08, 0.16, 1200); },
    kill() { tone(220, 0.18, 'sawtooth', 0.12, 60); noise(0.14, 0.12, 900); },
    hurt() { tone(140, 0.25, 'sawtooth', 0.18, 70); },
    pickup() { tone(880, 0.07, 'sine', 0.12, 1320); },
    levelup() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.14), i * 70)); },
    wave() { tone(196, 0.4, 'triangle', 0.16, 392); tone(294, 0.4, 'triangle', 0.10, 392); },
    boss() { tone(82, 0.7, 'sawtooth', 0.20, 41); noise(0.5, 0.10, 400); },
    dash() { noise(0.12, 0.10, 2400); },
    win() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.14), i * 110)); },
    over() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.14), i * 140)); },
  };
}
