'use strict';
// =====================================================================
//  CINÉMATIQUE : LA DÉFAITE DE SHELLMON (fin du chapitre 1), mise en scène comme l'introduction
//  (bandes cinéma, légendes, plans successifs) :
//   1) la grande coquille : Shellmon vacille et s'effondre dans un nuage de sable ;
//   2) l'Engrenage Noir, seul sur fond noir, se désagrège en données ;
//   3) coucher de soleil sur la plage des cabines : le héros, son partenaire, Tai et Agumon, côte à côte.
// =====================================================================
(function () {
  const { UI, Audio } = DW;
  const W = DW.W, H = DW.H;

  class ShellmonCinema extends DW.Scene {
    constructor() {
      super();
      this.mode = 'cave'; this.cap = { a: 0 }; this.line = ''; this.bars = { v: 0 };
      this.v = { shake: 0, fire: 0, boom: 0, gear: 0, data: 0, cage: 0, run: 0, glow: 0, walk: 0, sun: 0 };
      this.flash = 0; this.xf = null;
      this.data = Array.from({ length: 140 }, () => ({ x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 70, s: 1 + Math.random() * 2, c: Math.random() < 0.5 ? '#9af0ff' : '#ffffff' }));
      this.dust = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 4 + Math.random() * 10 }));
      this.buf = DW.Art.canvas(W, H);
    }
    enter() { this.run().then(() => this.close()); }
    update() { if (DW.Input.hit('ok')) this.skip = true; }
    tick(dt) { if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.6); }
    async show(txt, hold = 2.8) {
      this.line = txt; this.skip = false;
      await DW.tween(this.cap, { a: 1 }, 0.4);
      let t = 0; while (t < hold && !this.skip) { await DW.wait(0.05); t += 0.05; }
      await DW.tween(this.cap, { a: 0 }, 0.3);
    }
    // fondu enchaîné vers un autre plan
    cut(mode, dur = 0.8) {
      const x = this.buf.getContext('2d'); x.clearRect(0, 0, W, H);
      const cap = this.cap.a; this.cap.a = 0; this.draw(x); this.cap.a = cap;
      this.mode = mode; this.xf = { v: 1 };
      return DW.tween(this.xf, { v: 0 }, dur);
    }
    async run() {
      const s = DW.state, pt = s.party.find(m => m.hp > 0) || s.party[0];
      this.pt = pt ? pt.sp : 'agumon';
      DW.tween(this.bars, { v: 1 }, 0.8);
      await DW.fade(0, 0.6);
      // 1) Shellmon vaincu : il vacille, blanchit et s'effondre dans le sable
      DW.tween(this.v, { shake: 1 }, 0.8);
      await this.show("Shellmon vacille... puis s'effondre dans un grand nuage de sable.", 2.4);
      Audio.sfx('roar'); this.flash = 0.9;
      await DW.tween(this.v, { boom: 1 }, 1.4);
      // 2) l'Engrenage Noir, seul, qui se désagrège (fin du tremblement : les plans suivants sont stables)
      this.v.shake = 0;
      await this.cut('gear', 0.9);
      Audio.stop(); Audio.sfx('evolve');
      await DW.tween(this.v, { gear: 1 }, 1.4);
      await this.show("Un Engrenage Noir s'est arraché de sa coquille...", 2.2);
      Audio.sfx('hit');
      await DW.tween(this.v, { data: 1 }, 2.4, DW.linear);
      await this.show('... et se désagrège en mille éclats de données.', 2.2);
      // 3) coucher de soleil sur la plage
      await this.cut('beach', 1.2);
      Audio.play('beach');
      DW.tween(this.v, { sun: 1 }, 6);
      await DW.tween(this.v, { walk: 1 }, 2.4);
      await this.show(`Le soir tombe sur la Plage des Cabines. ${s.name} et Tai regardent la mer, leurs Digimon à leurs pieds.`, 3);
      await this.show("Tai est libre. Mais quelque part sur l'île, six autres enfants attendent encore qu'on les retrouve...", 3.2);
      await DW.fade(1, 0.9);
      this.bars.v = 0;
    }

    // ---------------------------------------------------------- dessin
    draw(c) {
      const t = this.t, v = this.v;
      c.save();
      if (this.mode === 'cave') this.drawCave(c, t);
      else if (this.mode === 'gear') this.drawGear(c, t);
      else this.drawBeach(c, t);
      c.restore();
      if (this.xf && this.xf.v > 0) { c.globalAlpha = this.xf.v; c.drawImage(this.buf, 0, 0); c.globalAlpha = 1; }
      if (this.flash > 0) { c.fillStyle = `rgba(255,250,230,${Math.min(1, this.flash)})`; c.fillRect(0, 0, W, H); }
      const bh = Math.round(24 * this.bars.v);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, bh); c.fillRect(0, H - bh, W, bh);
      if (this.cap.a > 0) {
        c.globalAlpha = this.cap.a;
        const ls = UI.wrap(c, this.line, 296, 9).slice(0, 2), y0 = H - 26 - (ls.length - 1) * 12;
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, y0 - 12, W, ls.length * 12 + 7);
        ls.forEach((l, i) => UI.text(c, l, W / 2, y0 + i * 12, { size: 9, align: 'center' }));
        c.globalAlpha = 1;
      }
    }
    caveBg(c, t) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0e06'); g.addColorStop(0.55, '#4a3018'); g.addColorStop(1, '#8a6a3a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // lagune turquoise au fond, reflets
      c.fillStyle = '#1a5a6a'; c.beginPath(); c.ellipse(W / 2, 112, 150, 22, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(120,230,240,0.35)'; for (let i = 0; i < 9; i++) c.fillRect(40 + i * 28 + Math.sin(t * 2 + i) * 6, 108 + (i % 3) * 5, 14, 1);
      // piliers de grès en silhouette, braseros
      for (const x of [22, 70, 250, 298]) { c.fillStyle = '#2a1a0c'; c.fillRect(x - 8, 40, 16, 120); c.fillStyle = '#3a2614'; c.fillRect(x - 11, 36, 22, 6); }
      for (const x of [46, 274]) { const f = 0.8 + 0.2 * Math.sin(t * 13 + x); const rg = c.createRadialGradient(x, 130, 2, x, 130, 50 * f); rg.addColorStop(0, 'rgba(255,170,70,0.55)'); rg.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = rg; c.fillRect(x - 60, 70, 120, 120); c.fillStyle = '#ffb040'; c.beginPath(); c.ellipse(x, 128, 4 * f, 7 * f, 0, 0, 7); c.fill(); }
      for (const d of this.dust) { d.y -= d.v * 0.016; if (d.y < 0) d.y = H; c.fillStyle = 'rgba(255,220,160,0.35)'; c.fillRect(d.x, d.y, 1, 1); }
    }
    drawCave(c, t) {
      const v = this.v;
      this.caveBg(c, t);
      const sh = DW.Sprites.battle('shellmon');
      c.save(); c.globalAlpha = 1 - v.boom * 0.9;
      DW.Sprites.draw(c, sh, W / 2 + Math.sin(t * 34) * 4 * v.shake * (1 - v.boom), 176 + v.boom * 26, { frame: Math.floor(t * 6), scale: 1.4 - v.boom * 0.2, white: v.boom > 0.05 ? Math.min(1, v.boom * 2) : 0 });
      c.restore();
      // nuage de sable
      if (v.boom > 0) for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 20 + v.boom * 70; c.fillStyle = `rgba(214,184,130,${0.6 * (1 - v.boom)})`; c.beginPath(); c.arc(W / 2 + Math.cos(a) * r, 176 + Math.sin(a) * r * 0.3, 8 + v.boom * 8, 0, 7); c.fill(); }
    }
    drawGear(c, t) {
      const v = this.v;
      // gros plan sombre sur la coquille fendue
      c.fillStyle = '#0a0604'; c.fillRect(0, 0, W, H);
      const rg = c.createRadialGradient(W / 2, 140, 10, W / 2, 140, 160); rg.addColorStop(0, '#5a2a3a'); rg.addColorStop(1, '#0a0604'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
      // l'Engrenage Noir qui s'arrache en tournoyant
      if (v.data < 1) {
        const gy = DW.lerp(150, 110, DW.ease(v.gear)), a = t * 2.4, sc = 1.6 + v.gear * 1.2;
        c.save(); c.translate(W / 2, gy); c.rotate(a); c.scale(sc, sc);
        c.globalAlpha = 1 - v.data;
        c.fillStyle = '#16121c'; c.strokeStyle = '#8a5ab8'; c.lineWidth = 1.2;
        c.beginPath(); for (let i = 0; i < 20; i++) { const r = i % 2 ? 12 : 17, an = i / 20 * Math.PI * 2; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#3a2a4a'; c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill();
        c.restore(); c.globalAlpha = 1;
      }
      // données qui s'envolent
      if (v.data > 0) { c.save(); c.globalCompositeOperation = 'lighter'; for (const p of this.data) { const k = v.data * 2.2; c.fillStyle = p.c; c.globalAlpha = Math.max(0, 1 - v.data); c.fillRect(W / 2 + p.x + p.vx * k, 110 + p.y + p.vy * k, p.s, p.s); } c.restore(); c.globalAlpha = 1; }
    }
    drawBeach(c, t) {
      const v = this.v;
      // ciel de coucher de soleil, soleil qui descend, mer dorée
      const g = c.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, DW.Art ? '#3a2a6a' : '#3a2a6a'); g.addColorStop(0.5, '#e86a4a'); g.addColorStop(1, '#ffc070');
      c.fillStyle = g; c.fillRect(0, 0, W, 150);
      const sy = 96 + v.sun * 40; const rg = c.createRadialGradient(W / 2, sy, 4, W / 2, sy, 60); rg.addColorStop(0, '#fff4c0'); rg.addColorStop(0.3, '#ffc060'); rg.addColorStop(1, 'rgba(255,140,60,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, 150);
      c.fillStyle = '#ffe8a0'; c.beginPath(); c.arc(W / 2, sy, 16, 0, 7); c.fill();
      c.fillStyle = '#c85a3a'; c.fillRect(0, 130, W, 40);
      for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(255,220,150,${0.3 + 0.3 * Math.sin(t * 2 + i)})`; c.fillRect(W / 2 - 40 + Math.sin(i * 7) * 50, 134 + i * 2, 20 - i, 1); }
      // sable et cabines en silhouette
      c.fillStyle = '#3a2018'; c.fillRect(0, 168, W, H - 168);
      for (const x of [20, 44, 68]) { c.fillStyle = '#2a1410'; c.fillRect(x, 120, 16, 50); c.fillRect(x - 2, 116, 20, 6); }
      // le héros, son partenaire, Tai et Agumon en silhouette, qui avancent puis s'arrêtent
      const k = DW.ease(v.walk), dark = { white: 0, alpha: 1 };
      const sil = (img, x, y, w, h) => { const cv = DW.Art.canvas(w, h), x2 = cv.getContext('2d'); x2.drawImage(img, 0, 0, w, h); x2.globalCompositeOperation = 'source-in'; x2.fillStyle = '#1a0c08'; x2.fillRect(0, 0, w, h); c.drawImage(cv, Math.round(x - w / 2), Math.round(y - h)); };
      const me = DW.Sprites.hero('up', Math.floor(t * 6) % 4), tai = DW.Sprites.hero('up', (Math.floor(t * 6) + 2) % 4, 'tai');
      sil(me.img, 150 + k * 30, 192, me.w * 1.6, me.h * 1.6);
      sil(tai.img, 186 + k * 30, 192, tai.w * 1.6, tai.h * 1.6);
      const ps = DW.Sprites.battle(this.pt), ag = DW.Sprites.battle('agumon');
      sil(ps.img, 124 + k * 30, 194, ps.w * 0.7, ps.h * 0.7);
      sil(ag.img, 222 + k * 30, 194, ag.w * 0.7, ag.h * 0.7);
      void dark;
    }
  }
  DW.ShellmonCinema = ShellmonCinema;
})();
