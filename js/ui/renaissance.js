'use strict';
// =====================================================================
//  MORT ET RENAISSANCE D'UN DIGIMON (cinématique)
//  1) Le Digimon, seul dans la nuit des données, sur un halo de lumière ;
//  2) il se défait du bas vers le haut en milliers de pixels qui s'envolent, avec des 0 et des 1 ;
//  3) les données tourbillonnent et redescendent se rassembler en un DigiŒuf lumineux ;
//  4) l'œuf bat comme un cœur, un éclair blanc... puis l'éclosion (HatchScene).
//  ESPACE accélère une fois l'œuf formé. Utilisé par game/life.js (mort au combat, fin de vie).
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W, H = DW.H;
  const CX = W / 2, FEET = 150, EGG_Y = 128;
  const T_SHOW = 1.4, T_DISS = 4.6, T_GATHER = 7.0, T_EGG = 8.6, T_END = 9.6;
  const ease = t => t * t * (3 - 2 * t);

  class RebirthScene extends DW.Scene {
    constructor(m, nextSp) {
      super();
      this.m = m; this.next = nextSp;
      this.spr = DW.Sprites.battle(m.sp);
      this.k = Math.min(1.4, 96 / this.spr.h, 120 / this.spr.w);
      this.flash = 0;
      // le Digimon devient une poussière de pixels : un point toutes les 2 cases de son dessin
      const w = Math.ceil(this.spr.w * this.k) + 4, h = Math.ceil(this.spr.h * this.k) + 4, cv = DW.Art.canvas(w, h), x = cv.getContext('2d');
      DW.Sprites.draw(x, this.spr, w / 2, h - 2, { scale: this.k });
      const data = x.getImageData(0, 0, w, h).data;
      this.parts = [];
      for (let py = 0; py < h; py += 2) for (let px = 0; px < w; px += 2) {
        const i = (py * w + px) * 4; if (data[i + 3] < 120) continue;
        const r = Math.random();
        this.parts.push({ x0: CX - w / 2 + px, y0: FEET + 2 - h + py, col: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
          // moment où le grain se détache : du bas vers le haut, un peu au hasard
          t0: T_SHOW + (1 - py / h) * 1.8 + r * 0.5, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 40, sw: Math.random() * 6, ang: Math.random() * 6.28, rad: 30 + Math.random() * 60 });
      }
      this.digits = Array.from({ length: 26 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, v: 10 + Math.random() * 20, d: Math.random() < 0.5 ? '0' : '1', a: Math.random() }));
      this.cut = { h, top: FEET + 2 - h };
    }
    enter() { Audio.stop(); Audio.sfx('evolve'); }
    update(dt) {
      if (this.t > T_EGG - 1 && !this.beat) { this.beat = true; Audio.sfx('select'); }
      if (this.t > T_EGG && !this.boom) { this.boom = true; Audio.sfx('super'); this.flash = 1; }
      if (Input.hit('ok') && this.t > T_GATHER) this.t = Math.max(this.t, T_END - 0.3);
      if (this.t >= T_END) this.close();
    }
    tick(dt) { this.flash = Math.max(0, this.flash - dt * 1.6); }
    draw(c) {
      const t = this.t;
      // nuit des données : dégradé bleu nuit, quadrillage numérique qui défile
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#02060f'); g.addColorStop(0.6, '#081a2e'); g.addColorStop(1, '#0c2a3a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(80,200,255,0.07)'; c.lineWidth = 1;
      for (let y = (t * 12) % 16; y < H; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      for (let x = 0; x < W; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      c.font = UI.font(7);
      for (const d of this.digits) { const y = (d.y - t * d.v + H * 4) % H; c.fillStyle = `rgba(120,255,200,${0.15 + 0.25 * Math.sin(t * 2 + d.a * 6) ** 2})`; c.fillText(d.d, d.x, y); }
      // halo au sol
      const halo = t < T_DISS ? 1 : Math.max(0.3, 1 - (t - T_DISS) * 0.3);
      const rg = c.createRadialGradient(CX, FEET, 2, CX, FEET, 70); rg.addColorStop(0, `rgba(160,240,255,${0.45 * halo})`); rg.addColorStop(1, 'rgba(160,240,255,0)');
      c.fillStyle = rg; c.fillRect(CX - 80, FEET - 40, 160, 60);
      c.fillStyle = `rgba(200,250,255,${0.25 * halo})`; c.beginPath(); c.ellipse(CX, FEET + 2, 38, 7, 0, 0, 7); c.fill();

      // 1-2) le Digimon, effacé du bas vers le haut à mesure que ses pixels s'envolent
      if (t < T_DISS + 1) {
        const k = DW.clamp((t - T_SHOW) / 2.3, 0, 1), cutY = this.cut.top + this.cut.h * (1 - k);
        c.save(); c.beginPath(); c.rect(0, 0, W, cutY); c.clip();
        DW.Sprites.draw(c, this.spr, CX, FEET + Math.sin(t * 2) * 0.8, { scale: this.k, frame: Math.floor(t * 3), white: k > 0 ? 0.25 + 0.4 * Math.sin(t * 20) ** 2 : 0 });
        c.restore();
        // liseré lumineux à la frontière
        if (k > 0 && k < 1) { c.fillStyle = 'rgba(200,255,255,0.8)'; c.fillRect(CX - 50, cutY - 1, 100, 1.5); }
      }
      // les grains : envol, tourbillon, puis retour vers l'œuf
      const gat = DW.clamp((t - T_DISS) / (T_GATHER - T_DISS), 0, 1), ge = ease(gat);
      for (const p of this.parts) {
        if (t < p.t0) continue;
        const a = t - p.t0;
        // envol : vers le haut, en spirale
        let x = p.x0 + p.vx * a + Math.sin(a * 3 + p.sw) * 6, y = p.y0 + p.vy * a - a * a * 6;
        // tourbillon autour du centre, puis rassemblement sur la forme de l'œuf
        if (gat > 0) {
          const ang = p.ang + t * 2.2, R = p.rad * (1 - ge) + 6 * ge;
          const ex = CX + Math.cos(ang) * R * 0.9, ey = EGG_Y - 10 + Math.sin(ang) * R * 1.2;
          x = x + (ex - x) * Math.min(1, ge * 1.4); y = y + (ey - y) * Math.min(1, ge * 1.4);
        }
        const al = gat > 0 ? 1 - ge * 0.85 : Math.max(0.2, 1 - a * 0.25);
        c.globalAlpha = al;
        c.fillStyle = a < 0.6 && gat === 0 ? p.col : (Math.floor(p.sw * 10) % 3 ? '#9af8ff' : '#e8fff4');
        c.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
      c.globalAlpha = 1;
      // 3-4) le DigiŒuf qui se forme, puis bat comme un cœur
      if (t > T_DISS + 0.8) {
        const e = DW.clamp((t - T_DISS - 0.8) / (T_GATHER - T_DISS - 0.6), 0, 1), spr = DW.eggSprite(this.next);
        const beat = t > T_GATHER ? 1 + 0.06 * Math.max(0, Math.sin((t - T_GATHER) * 9)) : 1;
        const lg = c.createRadialGradient(CX, EGG_Y - 18, 2, CX, EGG_Y - 18, 60); lg.addColorStop(0, `rgba(255,255,230,${0.6 * e})`); lg.addColorStop(1, 'rgba(255,255,230,0)');
        c.fillStyle = lg; c.fillRect(CX - 70, EGG_Y - 80, 140, 120);
        // rayons de lumière
        c.save(); c.translate(CX, EGG_Y - 18); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 10; i++) { c.rotate(Math.PI / 5); c.fillStyle = `rgba(160,255,240,${0.06 * e})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(-4, -70); c.lineTo(4, -70); c.closePath(); c.fill(); }
        c.restore();
        c.save(); c.globalAlpha = e; c.translate(CX, EGG_Y); c.scale(1.4 * beat, 1.4 * beat); c.drawImage(spr.img, -16, -38); c.restore();
        if (e < 1) { c.save(); c.globalAlpha = (1 - e) * 0.8; c.translate(CX, EGG_Y); c.scale(1.4, 1.4); c.globalCompositeOperation = 'lighter'; c.drawImage(spr.img, -16, -38); c.restore(); }
      }
      // légendes
      const name = this.m.name;
      if (t > 0.4 && t < T_DISS) UI.text(c, `${name}...`, CX, 30, { size: 11, align: 'center', bold: true, color: '#c8f4ff', shadowColor: 'rgba(0,30,60,0.9)' });
      if (t > T_SHOW + 0.4 && t < T_DISS + 0.6) UI.text(c, 'Ses données s\'envolent...', CX, H - 26, { size: 9, align: 'center', color: '#a0e8ff' });
      if (t > T_DISS + 0.6) UI.text(c, '...et se rassemblent en un DigiŒuf.', CX, H - 26, { size: 9, align: 'center', color: '#fff0c0' });
      if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.flash})`; c.fillRect(0, 0, W, H); }
    }
  }
  DW.RebirthScene = RebirthScene;
})();
