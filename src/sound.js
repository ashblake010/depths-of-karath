// ── Sound Module ───────────────────────────────────────────────────────────
const Sound = {
  ctx: null,
  enabled: true,
  masterVol: 0.18,

  init() {
    try {
      Sound.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { Sound.enabled = false; }
  },

  // Resume context on first user gesture (required by browsers)
  resume() {
    if(Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume();
  },

  // ── Core synth helpers ───────────────────────────────────────────────────
  _osc(type, freq, start, dur, volStart, volEnd, dest) {
    if(!Sound.enabled || !Sound.ctx) return null;
    const g = Sound.ctx.createGain();
    g.connect(dest || Sound.ctx.destination);
    g.gain.setValueAtTime(volStart * Sound.masterVol, start);
    g.gain.linearRampToValueAtTime(volEnd * Sound.masterVol, start + dur);
    const o = Sound.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    o.connect(g);
    o.start(start);
    o.stop(start + dur + 0.01);
    return { osc: o, gain: g };
  },

  _noise(start, dur, vol, filterFreq = 2000) {
    if(!Sound.enabled || !Sound.ctx) return;
    const bufLen = Sound.ctx.sampleRate * dur;
    const buf = Sound.ctx.createBuffer(1, bufLen, Sound.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = Sound.ctx.createBufferSource();
    src.buffer = buf;
    const filt = Sound.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = filterFreq;
    filt.Q.value = 0.8;
    const g = Sound.ctx.createGain();
    g.gain.setValueAtTime(vol * Sound.masterVol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.connect(filt); filt.connect(g); g.connect(Sound.ctx.destination);
    src.start(start); src.stop(start + dur + 0.01);
  },

  // ── Sound Effects ────────────────────────────────────────────────────────
  play(name) {
    if(!Sound.enabled || !Sound.ctx) return;
    Sound.resume();
    const t = Sound.ctx.currentTime;
    switch(name) {

      case 'step':
        Sound._noise(t, 0.06, 0.4, 180);
        Sound._osc('sine', 90, t, 0.05, 0.3, 0, null);
        break;

      case 'attack':
        Sound._osc('sawtooth', 220, t,      0.04, 1.0, 0.1, null);
        Sound._osc('sawtooth', 180, t+0.03, 0.06, 0.8, 0,   null);
        Sound._noise(t, 0.07, 0.5, 800);
        break;

      case 'player_hit':
        Sound._osc('square', 150, t,      0.03, 1.0, 0.2, null);
        Sound._osc('square', 100, t+0.03, 0.08, 0.8, 0,   null);
        Sound._noise(t, 0.12, 0.9, 300);
        break;

      case 'enemy_hit':
        Sound._osc('sawtooth', 300, t,      0.02, 1.2, 0.3, null);
        Sound._osc('sawtooth', 200, t+0.02, 0.06, 0.8, 0,   null);
        Sound._noise(t, 0.08, 0.6, 600);
        break;

      case 'enemy_death':
        Sound._osc('sawtooth', 250, t,      0.04, 1.0, 0.3, null);
        Sound._osc('sawtooth', 130, t+0.04, 0.10, 0.8, 0,   null);
        Sound._noise(t, 0.18, 0.7, 400);
        break;

      case 'pickup':
        Sound._osc('sine', 660, t,       0.06, 0.6, 0.3, null);
        Sound._osc('sine', 880, t+0.05,  0.06, 0.5, 0,   null);
        Sound._osc('sine', 1100, t+0.10, 0.07, 0.4, 0,   null);
        break;

      case 'level_up': {
        const notes = [330, 440, 550, 660, 880];
        notes.forEach((freq, i) => {
          Sound._osc('sine',     freq,     t + i*0.07, 0.10, 0.7, 0, null);
          Sound._osc('triangle', freq*1.5, t + i*0.07, 0.10, 0.3, 0, null);
        });
        break;
      }

      case 'stairs':
        Sound._osc('sine', 220, t,      0.12, 0.8, 0.2, null);
        Sound._osc('sine', 330, t+0.08, 0.12, 0.6, 0.1, null);
        Sound._osc('sine', 440, t+0.16, 0.14, 0.5, 0,   null);
        Sound._noise(t, 0.28, 0.3, 1200);
        break;

      case 'skill_warrior':
        Sound._osc('square', 80,  t,      0.08, 1.2, 0.4, null);
        Sound._osc('square', 60,  t+0.06, 0.12, 0.9, 0,   null);
        Sound._noise(t, 0.15, 1.0, 200);
        break;

      case 'skill_rogue':
        Sound._noise(t,      0.04, 1.0, 3000);
        Sound._noise(t+0.04, 0.04, 0.7, 2000);
        Sound._osc('triangle', 400, t, 0.08, 0.5, 0, null);
        break;

      case 'skill_mage': {
        const mNotes = [440, 550, 660, 880, 1100, 1320];
        mNotes.forEach((freq, i) => {
          Sound._osc('sine', freq, t + i*0.025, 0.15, 0.6, 0, null);
        });
        Sound._noise(t, 0.2, 0.4, 1800);
        break;
      }

      case 'boss_appear':
        Sound._osc('sawtooth', 55,  t,      0.3,  1.5, 0.5, null);
        Sound._osc('sawtooth', 50,  t+0.1,  0.4,  1.2, 0.3, null);
        Sound._osc('square',   110, t,      0.2,  0.8, 0.1, null);
        Sound._noise(t, 0.4, 1.2, 150);
        break;

      case 'combat_start':
        Sound._osc('square', 180, t,      0.06, 0.8, 0.2, null);
        Sound._osc('square', 240, t+0.05, 0.06, 0.7, 0,   null);
        Sound._noise(t, 0.1, 0.5, 500);
        break;

      case 'flee':
        Sound._osc('sine', 440, t,      0.05, 0.5, 0.1, null);
        Sound._osc('sine', 330, t+0.05, 0.05, 0.4, 0.1, null);
        Sound._osc('sine', 220, t+0.10, 0.08, 0.3, 0,   null);
        break;

      case 'crit':
        Sound._osc('square', 880, t,      0.03, 1.5, 0.5, null);
        Sound._osc('square', 660, t+0.02, 0.05, 1.0, 0,   null);
        Sound._noise(t, 0.07, 1.0, 2000);
        break;

      case 'curse':
        Sound._osc('sawtooth', 110, t,      0.15, 0.7, 0.1, null);
        Sound._osc('sawtooth', 82,  t+0.08, 0.20, 0.5, 0,   null);
        Sound._noise(t, 0.25, 0.4, 200);
        break;

      case 'poison_tick':
        Sound._osc('sine', 180, t, 0.08, 0.3, 0, null);
        Sound._noise(t, 0.06, 0.2, 400);
        break;

      case 'game_over':
        Sound._osc('sawtooth', 220, t,      0.3,  1.0, 0.2, null);
        Sound._osc('sawtooth', 165, t+0.15, 0.4,  0.9, 0.1, null);
        Sound._osc('sawtooth', 110, t+0.35, 0.5,  0.8, 0,   null);
        Sound._noise(t, 0.5, 0.5, 100);
        break;
    }
  },
};
