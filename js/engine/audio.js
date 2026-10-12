'use strict';
// =====================================================================
//  AUDIO : bruitages et musiques chiptune (WebAudio)
// =====================================================================
(function () {

  // ------------------------------------------------------------ audio (chiptune WebAudio)
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(n) {
    const m = /^([A-G]#?)(\d)$/.exec(n);
    if (!m) return 0;
    const midi = (+m[2] + 1) * 12 + NOTE[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function parse(str) {
    return str.replace(/\|/g, ' ').trim().split(/\s+/).map(tok => {
      const [n, d] = tok.split('/');
      return { f: n === '-' ? 0 : freq(n), d: d ? +d : 1 };
    });
  }
  const Audio = DW.Audio = {
    ctx: null, muted: false, cur: null, timer: null, pending: null, vol: 0.22,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : this.vol;
      this.master.connect(this.ctx.destination);
      this.mus = this.ctx.createGain(); this.mus.gain.value = 0.5; this.mus.connect(this.master);
      this.fx = this.ctx.createGain(); this.fx.gain.value = 0.9; this.fx.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.pending) { const p = this.pending; this.pending = null; this.play(p); }
    },
    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : this.vol;
    },
    tone(f, t, d, type = 'square', vol = 0.3, dest, slide) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.linearRampToValueAtTime(vol * 0.6, t + d * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(dest || this.fx);
      o.start(t); o.stop(t + d + 0.03);
    },
    noise(t, d, vol = 0.3, cutoff = 3000) {
      const c = this.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      s.buffer = this.noiseBuf; f.type = 'lowpass'; f.frequency.value = cutoff;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f); f.connect(g); g.connect(this.fx);
      s.start(t); s.stop(t + d + 0.02);
    },
    seq(notes, step, type = 'square', vol = 0.2) {
      const t = this.ctx.currentTime;
      notes.forEach((n, i) => { if (n) this.tone(freq(n), t + i * step, step * 1.1, type, vol); });
    },
    sfx(name) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      switch (name) {
        case 'text': this.tone(1320, t, 0.025, 'square', 0.03); break;
        case 'move': this.tone(880, t, 0.04, 'square', 0.08); break;
        case 'select': this.tone(1046, t, 0.05, 'square', 0.1); this.tone(1568, t + 0.04, 0.06, 'square', 0.08); break;
        case 'back': this.tone(660, t, 0.06, 'square', 0.1, null, 440); break;
        case 'bump': this.tone(110, t, 0.08, 'square', 0.12, null, 70); break;
        case 'hit': this.noise(t, 0.18, 0.5, 2500); this.tone(220, t, 0.15, 'square', 0.15, null, 60); break;
        case 'super': this.noise(t, 0.3, 0.6, 4000); this.tone(330, t, 0.25, 'sawtooth', 0.18, null, 50); break;
        case 'weak': this.noise(t, 0.1, 0.3, 1200); break;
        case 'swoosh': this.noise(t, 0.15, 0.25, 6000); break;
        case 'fire': this.noise(t, 0.35, 0.35, 1800); this.tone(180, t, 0.3, 'sawtooth', 0.1, null, 400); break;
        case 'water': for (let i = 0; i < 5; i++) this.tone(600 + i * 180, t + i * 0.05, 0.06, 'sine', 0.15, null, 1200 + i * 200); break;
        case 'elec': for (let i = 0; i < 6; i++) this.tone(DW.rand(800, 2000), t + i * 0.035, 0.04, 'square', 0.1); break;
        case 'leaf': this.noise(t, 0.25, 0.2, 5000); this.tone(900, t, 0.2, 'triangle', 0.12, null, 1400); break;
        case 'buff': this.seq(['C5', 'E5', 'G5', 'C6'], 0.05, 'square', 0.1); break;
        case 'debuff': this.seq(['C6', 'G5', 'E5', 'C5'], 0.05, 'square', 0.1); break;
        case 'status': this.seq(['A5', 'F5', 'A5', 'F5'], 0.06, 'triangle', 0.15); break;
        case 'encounter': this.seq(['C5', 'D#5', 'G5', 'C6', 'G5', 'C6'], 0.06, 'square', 0.12); break;
        case 'heal': this.seq(['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], 0.09, 'triangle', 0.25); break;
        case 'levelup': this.seq(['G5', 'A5', 'B5', 'D6', '', 'G6'], 0.07, 'square', 0.12); break;
        case 'faint': this.tone(600, t, 0.6, 'square', 0.12, null, 60); break;
        case 'sendout': this.tone(300, t, 0.15, 'square', 0.1, null, 1200); break;
        case 'capsule': this.tone(400, t, 0.3, 'triangle', 0.2, null, 1600); break;
        case 'shake': this.tone(180, t, 0.07, 'square', 0.15); this.tone(140, t + 0.08, 0.07, 'square', 0.15); break;
        case 'caught': this.seq(['C5', 'E5', 'G5', 'E5', 'G5', 'C6', '', 'C6'], 0.08, 'square', 0.12); break;
        case 'ring': for (let i = 0; i < 10; i++) this.tone(i % 2 ? 1400 : 1700, t + i * 0.05, 0.05, 'square', 0.08); for (let i = 0; i < 10; i++) this.tone(i % 2 ? 1400 : 1700, t + 0.7 + i * 0.05, 0.05, 'square', 0.08); break;
        case 'roar': this.noise(t, 1.0, 0.5, 900); this.tone(90, t, 0.9, 'sawtooth', 0.2, null, 45); break;
        case 'evotick': this.tone(1600, t, 0.04, 'triangle', 0.08); break;
        case 'evolve': this.noise(t, 0.6, 0.4, 8000); this.seq(['C6', 'E6', 'G6', 'C7'], 0.06, 'triangle', 0.2); break;
        case 'buy': this.tone(1318, t, 0.06, 'square', 0.1); this.tone(1760, t + 0.06, 0.12, 'square', 0.1); break;
        case 'run': this.noise(t, 0.4, 0.2, 3000); break;
        case 'save': this.seq(['E5', 'G5', 'C6'], 0.08, 'triangle', 0.2); break;
        case 'thunder': this.noise(t, 1.6, 0.35, 400); this.tone(60, t, 1.2, 'sawtooth', 0.08, null, 35); break;
        case 'explode': this.noise(t, 0.5, 0.6, 1500); this.tone(120, t, 0.4, 'square', 0.15, null, 40); break;
        case 'beam': this.tone(300, t, 0.6, 'sawtooth', 0.1, null, 900); this.noise(t, 0.6, 0.2, 5000); break;
        case 'slash': this.noise(t, 0.08, 0.4, 7000); this.tone(1400, t, 0.08, 'square', 0.06, null, 600); break;
        case 'flush': this.noise(t, 0.9, 0.35, 1400); for (let i = 0; i < 6; i++) this.tone(500 - i * 50, t + 0.1 + i * 0.1, 0.12, 'sine', 0.06, null, 300 - i * 30); break;
        case 'door': this.tone(240, t, 0.12, 'triangle', 0.12, null, 180); this.noise(t + 0.1, 0.12, 0.15, 900); this.tone(160, t + 0.18, 0.08, 'square', 0.08); break;
      }
    },
    play(name) {
      if (!this.ctx) { this.pending = name; return; }
      if (this.cur && this.cur.name === name) return;
      this.stop();
      const tr = DW.MUSIC && DW.MUSIC[name];
      if (!tr) return;
      const t0 = this.ctx.currentTime + 0.08;
      this.cur = {
        name, loop: tr.loop !== false, step: 60 / tr.bpm / 2,
        ch: tr.ch.map(ch => ({ ...ch, notes: parse(ch.n), i: 0, time: t0, done: false })),
      };
      this.timer = setInterval(() => this.sched(), 30);
      this.sched();
    },
    sched() {
      const c = this.cur;
      if (!c) return;
      const now = this.ctx.currentTime;
      let alldone = true;
      for (const ch of c.ch) {
        while (!ch.done && ch.time < now + 0.25) {
          if (ch.i >= ch.notes.length) { if (c.loop) ch.i = 0; else { ch.done = true; break; } }
          const nt = ch.notes[ch.i++];
          const d = nt.d * c.step;
          if (nt.f) this.tone(nt.f, ch.time, d * (ch.gate || 0.9), ch.w || 'square', ch.v || 0.12, this.mus);
          ch.time += d;
        }
        if (!ch.done) alldone = false;
      }
      if (alldone) this.stop();
    },
    stop() { clearInterval(this.timer); this.timer = null; this.cur = null; },
  };
})();
