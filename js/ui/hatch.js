'use strict';
// =====================================================================
//  DIGIŒUFS : choix d'un œuf (EggScene) et éclosion (HatchScene)
//  Éclosion : on frotte l'œuf (ESPACE) jusqu'à ce qu'il se fende, puis il éclate en lumière.
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W, H = DW.H;

  // fond pastel de la nurserie (dégradé + bulles qui montent)
  function nurseryBg(c, t, glow = 0) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffd6e8'); g.addColorStop(0.55, '#d8e8ff'); g.addColorStop(1, '#fff4d8');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) {
      const x = (i * 53 + Math.sin(t * 0.6 + i) * 10) % W, y = H - ((t * (10 + (i % 5) * 4) + i * 37) % (H + 20));
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1;
      c.beginPath(); c.arc(x, y, 2 + (i % 4), 0, 7); c.stroke();
    }
    if (glow > 0) {
      const rg = c.createRadialGradient(W / 2, 112, 4, W / 2, 112, 120);
      rg.addColorStop(0, `rgba(255,255,255,${glow})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = rg; c.fillRect(0, 0, W, H);
    }
  }
  DW.nurseryBg = nurseryBg;

  // ------------------------------------------------------------ choix de l'œuf
  class EggScene extends DW.Scene {
    constructor(list = DW.EGG_ORDER) { super(); this.list = list; this.i = 0; }
    update() {
      const n = this.list.length;
      if (Input.hit('left')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('right')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('ok')) { Audio.sfx('select'); this.close(this.list[this.i]); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(null); }
    }
    draw(c) {
      const t = this.t, n = this.list.length;
      nurseryBg(c, t);
      UI.text(c, 'CHOISIS UN DIGIŒUF', W / 2, 22, { size: 12, align: 'center', bold: true, color: '#8a3a6a', shadowColor: 'rgba(255,255,255,0.8)' });
      this.list.forEach((sp, j) => {
        const sel = j === this.i, x = W / 2 + (j - (n - 1) / 2) * 56, bob = sel ? Math.sin(t * 5) * 2 : 0;
        // coussin
        c.fillStyle = sel ? '#ff9ac0' : '#f6c0d6'; c.beginPath(); c.ellipse(x, 126, 22, 6, 0, 0, 7); c.fill();
        const spr = DW.eggSprite(sp), k = sel ? 1.25 : 1;
        c.save(); c.translate(x, 124 + bob); if (sel) c.rotate(Math.sin(t * 7) * 0.06); c.scale(k, k);
        c.drawImage(spr.img, -16, -38); c.restore();
        if (sel) UI.text(c, '▼', x, 64 + Math.sin(t * 6) * 2, { size: 9, align: 'center', color: '#e0508a', shadow: false });
      });
      UI.box(c, 14, 158, 292, 52);
      UI.wrap(c, DW.EGGS[this.list[this.i]].hint, 270, 10).forEach((l, k) => UI.text(c, l, 26, 177 + k * 14));
      UI.text(c, '◀ ▶ choisir   ESPACE prendre   ÉCHAP plus tard', W / 2, 228, { size: 7, align: 'center', color: '#6a5a8a', shadow: false });
    }
  }
  DW.EggScene = EggScene;

  // ------------------------------------------------------------ éclosion
  class HatchScene extends DW.Scene {
    constructor(sp, o = {}) {
      super();
      this.sp = sp; this.o = o;
      this.rubs = 0; this.need = 6; this.wob = 0; this.phase = 'rub';
      this.v = { glow: 0, flash: 0, mon: 0 };
      this.cracks = []; this.parts = [];
      // tracé des fissures (zigzag qui s'allonge à chaque frottement)
      let x = 0, y = -6;
      for (let i = 0; i < this.need; i++) { const nx = x + (i % 2 ? 4 : -4) + (Math.random() - 0.5) * 2, ny = y + (i < 3 ? -3 : 3) + (Math.random() - 0.5) * 2; this.cracks.push([x, y, nx, ny]); x = nx; y = ny; }
    }
    enter() { Audio.play('evolve'); }
    update() {
      if (this.phase !== 'rub') { if (this.phase === 'done' && Input.hit('ok')) this.close(this.sp); return; }
      if (Input.hit('ok')) {
        this.rubs++; this.wob = 1; Audio.sfx(this.rubs >= this.need ? 'evolve' : 'shake');
        for (let i = 0; i < 6; i++) this.parts.push({ x: W / 2 + (Math.random() - 0.5) * 30, y: 110 + (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 30, t: 0 });
        if (this.rubs >= this.need) this.hatch();
      }
    }
    async hatch() {
      this.phase = 'burst';
      await DW.tween(this.v, { glow: 1 }, 0.8);
      this.v.flash = 1; Audio.sfx('super');
      for (let i = 0; i < 40; i++) { const a = Math.random() * 7, s = 40 + Math.random() * 100; this.parts.push({ x: W / 2, y: 110, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, star: true }); }
      this.phase = 'out';
      DW.tween(this.v, { flash: 0 }, 0.8);
      await DW.tween(this.v, { mon: 1 }, 0.6);
      Audio.sfx('fanfare');
      this.phase = 'done';
      DW.tween(this.v, { glow: 0.35 }, 1.2);
    }
    tick(dt) {
      if (this.wob > 0) this.wob = Math.max(0, this.wob - dt * 2.5);
      this.parts.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; });
      this.parts = this.parts.filter(p => p.t < 1.2);
      if (this.v.glow > 0 && this.v.glow < 1 && this.phase === 'burst') this.wob = 0.6;
    }
    draw(c) {
      const t = this.t, name = DW.SPECIES[this.sp].name;
      nurseryBg(c, t, this.v.glow * 0.8);
      // rayons de lumière quand l'œuf s'ouvre
      if (this.v.glow > 0) {
        c.save(); c.translate(W / 2, 112); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = `rgba(255,240,200,${0.12 * this.v.glow})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(200, -10); c.lineTo(200, 10); c.fill(); }
        c.restore();
      }
      // ombre
      c.fillStyle = 'rgba(120,80,140,0.25)'; c.beginPath(); c.ellipse(W / 2, 150, 26, 6, 0, 0, 7); c.fill();
      if (this.phase === 'rub' || this.phase === 'burst') {
        const spr = DW.eggSprite(this.sp), wob = Math.sin(t * 30) * 0.18 * this.wob;
        c.save(); c.translate(W / 2, 150); c.rotate(wob); c.scale(2, 2);
        c.drawImage(spr.img, -16, -39);
        // fissures
        c.strokeStyle = '#3a2a3a'; c.lineWidth = 0.9;
        for (let i = 0; i < this.rubs && i < this.cracks.length; i++) { const [x1, y1, x2, y2] = this.cracks[i]; c.beginPath(); c.moveTo(x1, y1 - 16); c.lineTo(x2, y2 - 16); c.stroke(); }
        c.restore();
      } else {
        // morceaux de coquille au sol et le bébé qui apparaît
        const spr = DW.eggSprite(this.sp);
        c.save(); c.translate(W / 2 - 30, 150); c.rotate(-0.5); c.drawImage(spr.img, 0, 24, 32, 16, -16, -8, 32, 16); c.restore();
        c.save(); c.translate(W / 2 + 30, 150); c.rotate(0.5); c.drawImage(spr.img, 0, 24, 32, 16, -16, -8, 32, 16); c.restore();
        const mon = DW.Sprites.battle(this.sp), hop = this.phase === 'done' ? Math.abs(Math.sin(t * 4)) * 6 : 0;
        DW.Sprites.draw(c, mon, W / 2, 150 - hop, { scale: 0.6 + 0.6 * this.v.mon, white: 1 - this.v.mon, frame: Math.floor(t * 4) });
      }
      this.parts.forEach(p => { c.fillStyle = p.star ? '#fff6a0' : '#ffffff'; c.globalAlpha = Math.max(0, 1 - p.t / 1.2); c.fillRect(Math.round(p.x), Math.round(p.y), p.star ? 2 : 1, p.star ? 2 : 1); });
      c.globalAlpha = 1;
      if (this.v.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.v.flash})`; c.fillRect(0, 0, W, H); }
      // consignes
      UI.box(c, 14, 182, 292, 44);
      if (this.phase === 'rub') {
        UI.text(c, "L'œuf bouge ! Frotte-le doucement pour l'aider à éclore.", 24, 200, { size: 9 });
        const k = this.rubs / this.need;
        c.fillStyle = '#3a2a4a'; c.fillRect(24, 208, 200, 6); c.fillStyle = '#ff8ac0'; c.fillRect(24, 208, Math.round(200 * k), 6);
        UI.text(c, 'ESPACE !', 290, 214, { size: 9, align: 'right', color: Math.floor(t * 3) % 2 ? '#ffe680' : '#ffffff' });
      } else if (this.phase === 'done') {
        UI.text(c, `L'œuf a éclos : c'est ${name} !`, 24, 200, { size: 10, bold: true, color: '#ffe680' });
        UI.text(c, 'ESPACE', 296, 220, { size: 7, align: 'right', color: '#9ab0e8' });
      }
    }
  }
  DW.HatchScene = HatchScene;
})();
