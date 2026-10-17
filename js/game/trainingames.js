'use strict';
// =====================================================================
//  MINI-JEUX D'ENTRAÎNEMENT : le Digimon fait vraiment l'exercice
//    Sprint (spd)      : il court autour de la piste ovale, ESPACE pour sauter chaque haie
//    Endurance (hp)    : marteler ESPACE pour soulever l'haltère au-dessus de sa tête
//    Frappe (atk)      : frapper le sac quand il revient vers lui
//    Garde (def)       : se protéger au moment où chaque rocher arrive
//    Méditation (int)  : retenir puis reproduire une suite de flèches
//    Énergie (mp)      : capter l'éclair du cristal de données
//  Chaque jeu = 3 essais notés 0 (raté), 1 (bien) ou 2 (parfait) via scene.hit(r, x, y).
//  dif (0 → 1) : difficulté selon les points déjà acquis (training.js).
// =====================================================================
(function () {
  const { UI, Input } = DW;
  const W = DW.W, TAU = Math.PI * 2;

  // Digimon de la séance (sprite de combat), éventuellement dans une pose
  const mon = (c, sc, x, y, o = {}) => {
    const spr = o.pose ? DW.Sprites.pose(sc.m.sp, o.pose) : DW.Sprites.battle(sc.m.sp);
    DW.Sprites.draw(c, spr, x, y, { frame: Math.floor(sc.t * (o.fps || 6)), flip: o.flip, scale: o.scale });
  };
  const shadow = (c, x, y, rx) => { c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x, y, rx, rx * 0.28, 0, 0, TAU); c.fill(); };
  const arena = (c, sc) => { c.drawImage(DW.World.battleBg('foret@town'), 0, 0); DW.World.platform(c, 'foret@town', 160, 168, 120, 18); };

  // ------------------------------------------------------------ Sprint : tour de piste et haies
  class Sprint {
    constructor(sc) {
      this.sc = sc; this.a = Math.PI / 2; this.w = (0.62 + sc.dif * 0.55) * (sc.m.tired >= 60 ? 1.12 : 1);
      this.H = [0.85, 2.85, 4.85].map(o => ({ a: Math.PI / 2 + o, st: 0 }));   // st : 0 à venir, 1 franchie, -1 renversée
      this.jump = 0; this.slow = 0; this.next = 0; this.hint = 'ESPACE juste avant chaque haie pour sauter !';
    }
    pos(a) { return [160 + 118 * Math.cos(a), 114 + 50 * Math.sin(a)]; }
    update(dt) {
      const sc = this.sc;
      if (this.slow > 0) this.slow -= dt;
      this.a += dt * this.w * (this.slow > 0 ? 0.45 : 1);
      if (this.jump > 0) this.jump -= dt;
      const h = this.H[this.next];
      if (!h) return;
      const tau = (h.a - this.a) / this.w;                         // secondes avant la haie
      if (Input.hit('ok') && this.jump <= 0) {
        this.jump = 0.45;
        if (tau <= 1.2) {                                          // saut qui vise cette haie (sommet à +0,22 s) ; trop tôt = il retombe sur la haie
          const e = Math.abs(tau - 0.22), r = e < 0.07 * (1 - sc.dif * 0.35) ? 2 : e < 0.17 ? 1 : 0;
          h.st = r ? 1 : -1; if (!r) this.slow = 0.5;
          this.next++; sc.hit(r, ...this.pos(h.a));
        }
      }
      if (tau < -0.05 && h.st === 0) { h.st = -1; this.slow = 0.6; this.next++; sc.hit(0, ...this.pos(h.a)); }  // pas sauté : il trébuche
    }
    draw(c) {
      const sc = this.sc, t = sc.t;
      c.fillStyle = '#4a8a3a'; c.fillRect(0, 0, W, 240);
      for (let i = 0; i < 60; i++) { c.fillStyle = i % 2 ? '#3f7e33' : '#58984a'; c.fillRect((i * 53) % W, 44 + (i * 37) % 140, 2, 1); }
      // piste
      c.strokeStyle = '#b8864a'; c.lineWidth = 26; c.beginPath(); c.ellipse(160, 114, 118, 50, 0, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1;
      for (const k of [-12, 0, 12]) { c.beginPath(); c.ellipse(160, 114, 118 + k, 50 + k, 0, 0, TAU); c.stroke(); }
      c.fillStyle = '#5aa04a'; c.beginPath(); c.ellipse(160, 114, 100, 34, 0, 0, TAU); c.fill();
      // haies
      for (const [i, h] of this.H.entries()) {
        const [x, y] = this.pos(h.a), nx = -Math.sin(h.a) * 118, ny = Math.cos(h.a) * 50, L = Math.hypot(nx, ny), px = -ny / L, py = nx / L;
        if (i === this.next) { c.strokeStyle = `rgba(255,240,120,${0.4 + 0.3 * Math.sin(t * 10)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, 12, 6, 0, 0, TAU); c.stroke(); }
        c.save(); c.translate(x, y); c.rotate(Math.atan2(py, px) + (h.st < 0 ? 0.9 : 0));
        c.fillStyle = h.st < 0 ? '#8a8a8a' : '#ffffff'; c.fillRect(-11, -4, 22, 3);
        c.fillStyle = h.st < 0 ? '#6a6a6a' : '#e04a3a'; for (let k = -11; k < 11; k += 6) c.fillRect(k, -4, 3, 3);
        c.fillStyle = '#5a4a3a'; c.fillRect(-11, -1, 2, 5); c.fillRect(9, -1, 2, 5);
        c.restore();
        if (h.st > 0) UI.text(c, '✓', x, y - 10, { size: 8, align: 'center', color: '#7aff8a' });
      }
      // le Digimon court (sprite d'exploration agrandi), saut en cloche
      const [x, y] = this.pos(this.a), dx = -Math.sin(this.a), j = this.jump > 0 ? Math.sin((1 - this.jump / 0.45) * Math.PI) * 18 : 0;
      shadow(c, x, y + 2, 9 - j * 0.2);
      const spr = DW.Sprites.ow(sc.m.sp);
      DW.Sprites.draw(c, spr, x, y + 3 - j - Math.abs(Math.sin(t * 14)) * 1.5, { flip: dx < 0, frame: Math.floor(t * 10), scale: 1.4 });
      if (this.slow > 0) UI.text(c, '!', x + 8, y - 26 - j, { size: 10, color: '#ff8a8a' });
    }
  }

  // ------------------------------------------------------------ Endurance : soulever l'haltère
  class Lift {
    constructor(sc) { this.sc = sc; this.h = 0; this.max = 0; this.time = 3.2; this.top = 0; this.pause = 0.6; this.hint = "Martèle ESPACE pour lever l'haltère au-dessus de sa tête !"; }
    update(dt) {
      const sc = this.sc;
      if (this.pause > 0) { this.pause -= dt; return; }
      if (sc.hits.length >= 3) return;
      if (Input.hit('ok')) { this.h = Math.min(1, this.h + 0.085 * (1 - sc.dif * 0.45) * (sc.m.tired >= 60 ? 0.85 : 1)); this.push = 0.12; }
      if (this.push > 0) this.push -= dt;
      this.h = Math.max(0, this.h - dt * (0.28 + sc.dif * 0.32));
      this.max = Math.max(this.max, this.h);
      this.top = this.h >= 0.98 ? this.top + dt : 0;
      this.time -= dt;
      if (this.top >= 0.5 || this.time <= 0) {
        const r = this.top >= 0.5 ? 2 : this.max >= 0.6 ? 1 : 0;
        sc.hit(r, 150, 120 - this.max * 40);
        Object.assign(this, { h: 0, max: 0, time: 3.2, top: 0, pause: 0.9 });
      }
    }
    draw(c) {
      const sc = this.sc, t = sc.t, effort = this.push > 0;
      arena(c, sc);
      shadow(c, 150, 170, 26);
      mon(c, sc, 150, 172, { pose: effort ? 'attack' : null, fps: effort ? 10 : 5 });
      // l'haltère part du ventre et monte au-dessus de la tête
      const sh0 = DW.Sprites.battle(sc.m.sp).h, low = 172 - sh0 * 0.3, high = 172 - sh0 * 1.02 - 6;
      const O = DW.World.obj('weights', 0), y = low + (high - low) * this.h, sh = effort ? (Math.random() - 0.5) * 2 : 0;
      c.drawImage(O.img, Math.round(150 - O.w + sh), Math.round(y - O.h * 2), O.w * 2, O.h * 2);
      // repère du sommet
      c.strokeStyle = 'rgba(255,240,120,0.7)'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(104, high - O.h * 2); c.lineTo(196, high - O.h * 2); c.stroke(); c.setLineDash([]);
      if (this.pause <= 0 && sc.hits.length < 3) UI.text(c, Math.ceil(this.time) + '', 214, 92, { size: 14, align: 'center', color: '#ffffff' });
      if (this.top > 0) UI.text(c, 'Tiens bon !', 150, 70, { size: 9, align: 'center', color: '#ffe070' });
    }
  }

  // ------------------------------------------------------------ Frappe : le sac de frappe se balance
  class Punch {
    constructor(sc) { this.sc = sc; this.ph = Math.random() * TAU; this.w = (2.0 + sc.dif * 1.2) * (sc.m.tired >= 60 ? 1.08 : 1); this.lunge = 0; this.wait = 0.6;   /* (difficile : le sac va moins vite qu'avant, on peut suivre) */ this.hint = 'ESPACE quand le sac revient tout près pour frapper fort !'; }
    get bx() { return 214 + 46 * Math.sin(this.ph); }   // position du bas du sac (le Digimon frappe vers x = 172)
    update(dt) {
      const sc = this.sc;
      this.ph += dt * this.w;
      if (this.lunge > 0) this.lunge -= dt;
      if (this.wait > 0) { this.wait -= dt; return; }
      if (sc.hits.length >= 3 || !Input.hit('ok')) return;
      const d = Math.abs(this.bx - 172), r = d < 9 ? 2 : d < 20 ? 1 : 0;
      this.lunge = 0.35; this.wait = 0.7;
      if (r) this.kick = 0.5;
      sc.hit(r, this.bx, 120);
    }
    draw(c) {
      const sc = this.sc;
      arena(c, sc);
      // potence et sac suspendu (il pivote autour du crochet)
      c.fillStyle = '#5a4030'; c.fillRect(262, 50, 5, 122); c.fillRect(196, 48, 71, 5);
      c.fillStyle = '#3a2a20'; c.fillRect(262, 50, 2, 122);
      if (this.kick > 0) this.kick -= 1 / 60;
      const ang = Math.asin(DW.clamp((this.bx - 214) / 72, -1, 1)) + (this.kick > 0 ? this.kick * 0.5 : 0);
      c.save(); c.translate(214, 53); c.rotate(-ang);
      c.strokeStyle = '#2a2018'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 40); c.stroke();
      c.fillStyle = '#8a2a22'; c.beginPath(); c.ellipse(0, 46, 11, 6, 0, 0, TAU); c.fill();
      c.fillStyle = '#c83a30'; c.fillRect(-11, 46, 22, 52); c.beginPath(); c.ellipse(0, 98, 11, 6, 0, 0, TAU); c.fill();
      c.fillStyle = '#e8564a'; c.fillRect(-7, 48, 4, 48);
      c.fillStyle = '#2a2a30'; c.fillRect(-11, 56, 22, 4); c.fillRect(-11, 84, 22, 4);
      c.restore();
      const lx = this.lunge > 0 ? Math.sin((1 - this.lunge / 0.35) * Math.PI) * 30 : 0;
      shadow(c, 126 + lx, 170, 24);
      mon(c, sc, 126 + lx, 172, { pose: this.lunge > 0 ? 'attack' : null });
    }
  }

  // ------------------------------------------------------------ Garde : des rochers arrivent
  class Guard {
    constructor(sc) { this.sc = sc; this.rock = null; this.wait = 0.8; this.guard = 0; this.hint = 'ESPACE quand le rocher arrive sur lui pour encaisser !'; }
    throw() { const v = (1.0 - this.sc.dif * 0.35) * (0.85 + Math.random() * 0.3); this.rock = { t: 0, dur: v, x0: 330, y0: 70 + Math.random() * 30, done: false }; }
    update(dt) {
      const sc = this.sc;
      if (this.guard > 0) this.guard -= dt;
      if (!this.rock) { if (sc.hits.length >= 3) return; this.wait -= dt; if (this.wait <= 0) this.throw(); return; }
      const R = this.rock; R.t += dt;
      if (R.bounce) { if (R.t > R.dur + 0.6) { this.rock = null; this.wait = 0.5 + Math.random() * 1.1; } return; }
      const tau = R.dur - R.t;
      if (Input.hit('ok')) {
        this.guard = 0.4;
        const e = Math.abs(tau), r = e < 0.06 ? 2 : e < 0.14 ? 1 : 0;
        if (r || tau < 0.4) { R.bounce = r > 0; sc.hit(r, 140, 130); if (!r) { sc.shake = 0.3; this.rock = null; this.wait = 0.8 + Math.random(); } return; }
      }
      if (tau < -0.1) { sc.shake = 0.35; sc.hit(0, 140, 130); this.rock = null; this.wait = 0.8 + Math.random(); }
    }
    draw(c) {
      const sc = this.sc;
      arena(c, sc);
      shadow(c, 126, 170, 24);
      mon(c, sc, 126, 172, { pose: this.guard > 0 ? 'hurt' : null });
      if (this.guard > 0) { c.strokeStyle = `rgba(120,200,255,${this.guard * 2})`; c.lineWidth = 2; c.beginPath(); c.arc(140, 140, 30, -1.2, 1.2); c.stroke(); }
      const R = this.rock;
      if (!R) return;
      const k = Math.min(1.2, R.t / R.dur);
      let x = R.x0 + (148 - R.x0) * k, y = R.y0 + (140 - R.y0) * k - Math.sin(Math.min(1, k) * Math.PI) * 40;
      if (R.bounce) { const b = (R.t - R.dur) / 0.6; x = 148 + b * 160; y = 140 - Math.sin(b * Math.PI) * 60 + b * 20; }
      const O = DW.World.obj('rock', 0);
      shadow(c, x, 172, 8);
      c.save(); c.translate(x, y); c.rotate(R.t * 8); c.drawImage(O.img, -O.w / 2, -O.h / 2); c.restore();
    }
  }

  // ------------------------------------------------------------ Méditation : suite de flèches à reproduire
  const ARROW = { up: '▲', down: '▼', left: '◀', right: '▶' }, KEYS = Object.keys(ARROW);
  class Meditate {
    constructor(sc) { this.sc = sc; this.round = 0; this.hint = 'Retiens les flèches, puis reproduis-les avec les directions.'; this.newRound(0.8); }
    newRound(delay) {
      const n = 3 + this.round + (this.sc.dif > 0.5 ? 1 : 0);
      this.seq = Array.from({ length: n }, () => DW.pick(KEYS)); this.i = 0; this.err = 0; this.show = -delay; this.input = false; this.lit = null;
      this.step = 0.62 - this.sc.dif * 0.22;
    }
    update(dt) {
      const sc = this.sc;
      if (sc.hits.length >= 3) return;
      if (this.lit) { this.lit.t -= dt; if (this.lit.t <= 0) this.lit = null; }
      if (!this.input) { this.show += dt; if (this.show >= this.seq.length * this.step) this.input = true; return; }
      const k = KEYS.find(d => Input.hit(d));
      if (!k) return;
      if (k === this.seq[this.i]) { this.i++; this.lit = { k, t: 0.25, ok: true }; DW.Audio.sfx('move'); }
      else { this.err++; this.lit = { k, t: 0.3, ok: false }; DW.Audio.sfx('bump'); }
      if (this.err >= 2 || this.i >= this.seq.length) {
        sc.hit(this.err >= 2 ? 0 : this.err ? 1 : 2, 150, 70);
        this.round++; this.newRound(1);
      }
    }
    draw(c) {
      const sc = this.sc, t = sc.t;
      arena(c, sc);
      // cercle de pierres et aura
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { c.strokeStyle = `rgba(150,120,255,${0.3 - i * 0.08})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(150, 164, 46 + i * 10 + Math.sin(t * 3) * 3, 12 + i * 3, 0, 0, TAU); c.stroke(); }
      c.restore();
      mon(c, sc, 150, 172, { fps: 3 });
      // la suite : montrée une flèche à la fois, puis des cases à remplir
      const n = this.seq.length, x0 = 160 - (n - 1) * 11;
      if (!this.input) {
        const j = Math.floor(this.show / this.step);
        if (j >= 0 && j < n && this.show % this.step < this.step * 0.75) UI.text(c, ARROW[this.seq[j]], 150, 76, { size: 22, align: 'center', color: '#c8a8ff' });
        UI.text(c, j < 0 ? 'Concentre-toi...' : 'Retiens bien !', 150, 52, { size: 8, align: 'center', color: '#ffffff' });
      } else {
        for (let j = 0; j < n; j++) UI.text(c, j < this.i ? ARROW[this.seq[j]] : '·', x0 + j * 22, 70, { size: 12, align: 'center', color: j < this.i ? '#7aff8a' : '#8a9ad0' });
        if (this.lit && !this.lit.ok) UI.text(c, ARROW[this.lit.k], 150, 96, { size: 14, align: 'center', color: '#ff7a7a' });
        UI.text(c, 'À toi !', 150, 52, { size: 8, align: 'center', color: '#ffe070' });
      }
    }
  }

  // ------------------------------------------------------------ Énergie : l'éclair du cristal
  class Crystal {
    constructor(sc) { this.sc = sc; this.wait = 0.6; this.cycle(); this.beam = 0; this.hint = 'Le cristal se charge... ESPACE pile au moment de l\'éclair !'; }
    cycle() { const d = this.sc.dif; this.build = (1.5 + Math.random() * 0.8) * (1 - d * 0.2); this.win = 0.42 - d * 0.14; this.c = 0; this.used = false; }   // plus facile : fenêtre plus large
    update(dt) {
      const sc = this.sc;
      if (this.beam > 0) this.beam -= dt;
      if (this.wait > 0) { this.wait -= dt; return; }
      if (sc.hits.length >= 3) return;
      this.c += dt;
      const flash = this.c >= this.build && this.c < this.build + this.win;
      if (Input.hit('ok') && !this.used) {
        this.used = true;
        const r = flash ? ((this.c - this.build) < this.win * 0.45 ? 2 : 1) : 0;
        if (r) this.beam = 0.6;
        sc.hit(r, 214, 90);
        this.wait = 0.7; this.cycle(); return;
      }
      if (this.c >= this.build + this.win) { sc.hit(0, 214, 90); this.wait = 0.7; this.cycle(); }
    }
    draw(c) {
      const sc = this.sc, t = sc.t, k = this.wait > 0 ? 0 : Math.min(1, this.c / this.build), flash = this.wait <= 0 && this.c >= this.build;
      arena(c, sc);
      const O = DW.World.obj('datacrystal', 0);
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(214, 112, 2, 214, 112, 30 + k * 30 + (flash ? 30 : 0));
      g.addColorStop(0, flash ? 'rgba(255,255,255,0.9)' : `rgba(90,220,255,${0.15 + k * 0.45 + (k > 0.7 ? Math.random() * 0.2 : 0)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(150, 40, 130, 140);
      c.restore();
      c.drawImage(O.img, Math.round(214 - O.w), Math.round(170 - O.h * 2), O.w * 2, O.h * 2);
      if (this.beam > 0) { c.strokeStyle = `rgba(160,240,255,${this.beam})`; c.lineWidth = 3; c.beginPath(); c.moveTo(206, 110); c.lineTo(130, 140); c.stroke(); }
      shadow(c, 120, 170, 22);
      mon(c, sc, 120, 172, { pose: this.beam > 0 ? 'attack' : null, fps: 4 });
    }
  }

  DW.TRAIN_GAMES = { spd: Sprint, hp: Lift, atk: Punch, def: Guard, int: Meditate, mp: Crystal };
})();
