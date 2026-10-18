'use strict';
// =====================================================================
//  MINI-JEUX DE L'ÎLE
//  - ARROSAGE (Village des Yokomon, après le chapitre 3) : 8 fleurs se dessèchent sous le soleil du désert ;
//    en 30 secondes, déplace l'arrosoir (flèches) et arrose (ESPACE) avant qu'elles ne fanent. Une partie par jour.
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W, H = DW.H;
  const day = () => Math.floor(DW.state.clock / 1440);

  class WateringScene extends DW.Scene {
    constructor() {
      super();
      this.T = 30; this.sel = 0; this.cd = 0; this.drops = []; this.done = false;
      this.fl = Array.from({ length: 8 }, (_, i) => ({ w: 0.7 + Math.random() * 0.3, rate: 0.045 + Math.random() * 0.05, dead: false, x: 52 + (i % 4) * 72, y: i < 4 ? 112 : 186 }));
    }
    get alive() { return this.fl.filter(f => !f.dead).length; }
    update(dt) {
      if (this.done) { if (Input.hit('ok') || Input.hit('back')) this.close(this.alive); return; }
      this.T -= dt; this.cd -= dt;
      if (Input.hit('left')) { this.sel = (this.sel + 7) % 8; Audio.sfx('move'); }
      if (Input.hit('right')) { this.sel = (this.sel + 1) % 8; Audio.sfx('move'); }
      if (Input.hit('up') || Input.hit('down')) { this.sel = (this.sel + 4) % 8; Audio.sfx('move'); }
      if (Input.hit('ok') && this.cd <= 0) {
        const f = this.fl[this.sel]; this.cd = 0.22;
        if (!f.dead) { f.w = Math.min(1, f.w + 0.42); Audio.sfx('select'); for (let k = 0; k < 8; k++) this.drops.push({ x: f.x - 6 + Math.random() * 12, y: f.y - 46, v: 40 + Math.random() * 40, t: 0 }); }
      }
      // le soleil tape de plus en plus fort
      const heat = 1 + (30 - this.T) / 22;
      for (const f of this.fl) if (!f.dead) { f.w -= f.rate * heat * dt; if (f.w <= 0) { f.w = 0; f.dead = true; Audio.sfx('debuff'); } }
      for (const d of this.drops) { d.t += dt; d.y += d.v * dt; }
      this.drops = this.drops.filter(d => d.t < 0.6);
      if (this.T <= 0 || !this.alive) { this.T = Math.max(0, this.T); this.done = true; Audio.sfx(this.alive >= 6 ? 'fanfare' : 'select'); }
    }
    flower(c, f, t, sel) {
      const k = f.dead ? 0 : f.w, droop = f.dead ? 1 : Math.max(0, 0.5 - k) * 2;
      // pot de terre
      c.fillStyle = '#8a5a34'; c.beginPath(); c.moveTo(f.x - 13, f.y - 6); c.lineTo(f.x + 13, f.y - 6); c.lineTo(f.x + 10, f.y + 8); c.lineTo(f.x - 10, f.y + 8); c.closePath(); c.fill();
      c.fillStyle = '#a8744a'; c.fillRect(f.x - 14, f.y - 9, 28, 4);
      c.fillStyle = k > 0.25 ? '#4a3420' : '#9a8460'; c.fillRect(f.x - 12, f.y - 8, 24, 2);
      // tige qui ploie quand la fleur a soif
      const tx = f.x + droop * 10, ty = f.y - 34 + droop * 14;
      c.strokeStyle = f.dead ? '#8a7a4a' : '#3a8a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(f.x, f.y - 8); c.quadraticCurveTo(f.x, f.y - 26, tx, ty); c.stroke();
      c.fillStyle = f.dead ? '#9a8a5a' : '#4aa04a'; c.beginPath(); c.ellipse(f.x - 5, f.y - 18, 5, 2, -0.5, 0, 7); c.fill(); c.beginPath(); c.ellipse(f.x + 5, f.y - 22, 5, 2, 0.5, 0, 7); c.fill();
      // fleur bleue des Yokomon (pétales), qui pâlit puis brunit
      const col = f.dead ? '#8a6a4a' : k > 0.5 ? '#4a6ae8' : k > 0.25 ? '#7a8ad0' : '#a8a0b8';
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + droop; c.fillStyle = col; c.beginPath(); c.ellipse(tx + Math.cos(a) * 6, ty + Math.sin(a) * 5, 5, 3, a, 0, 7); c.fill(); }
      c.fillStyle = f.dead ? '#6a5a3a' : '#ffe060'; c.beginPath(); c.arc(tx, ty, 3, 0, 7); c.fill();
      // jauge d'eau
      UI.bar(c, f.x - 16, f.y + 13, 32, 3, k, k > 0.5 ? '#5ab0ff' : k > 0.25 ? '#f0c040' : '#ff5a5a');
      if (sel) {   // l'arrosoir au-dessus de la fleur choisie
        const bx = f.x + 10, by = f.y - 60 + Math.sin(t * 6) * 1.5;
        c.fillStyle = '#5a8ad0'; c.fillRect(bx - 8, by - 6, 14, 10); c.fillStyle = '#3a6ab0'; c.fillRect(bx - 8, by + 2, 14, 2);
        c.strokeStyle = '#3a6ab0'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 8, by); c.lineTo(bx - 16, by - 6); c.stroke();
        c.beginPath(); c.arc(bx, by - 8, 4, Math.PI, 0); c.stroke();
        UI.text(c, '▼', f.x, f.y - 70, { size: 8, align: 'center', color: '#ffffff', shadow: false });
      }
    }
    draw(c) {
      const t = this.t;
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8ad0ff'); g.addColorStop(0.35, '#fff2c0'); g.addColorStop(0.36, '#d8c890'); g.addColorStop(1, '#a89860');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // soleil du désert
      const sx = W - 40, sy = 30, rg = c.createRadialGradient(sx, sy, 4, sx, sy, 40); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.3, '#fff0a0'); rg.addColorStop(1, 'rgba(255,240,160,0)');
      c.fillStyle = rg; c.fillRect(sx - 40, sy - 40, 80, 80);
      this.fl.forEach((f, i) => this.flower(c, f, t, i === this.sel && !this.done));
      for (const d of this.drops) { c.fillStyle = `rgba(120,190,255,${1 - d.t / 0.6})`; c.fillRect(d.x, d.y, 2, 3); }
      UI.text(c, 'ARROSAGE DES FLEURS', 10, 16, { size: 10, bold: true, color: '#3a2a10', shadow: false });
      UI.text(c, `${Math.ceil(this.T)} s`, W - 10, 16, { size: 10, align: 'right', bold: true, color: this.T < 8 ? '#c02020' : '#3a2a10', shadow: false });
      UI.text(c, `Fleurs : ${this.alive} / 8`, 10, 30, { size: 8, color: '#3a2a10', shadow: false });
      if (!this.done) UI.text(c, 'FLÈCHES : choisir   ESPACE : arroser', W / 2, H - 6, { size: 7, align: 'center', color: '#3a2a10', shadow: false });
      else { UI.box(c, 60, 92, 200, 56); UI.text(c, this.alive >= 6 ? 'Magnifique !' : this.alive >= 3 ? 'Pas mal !' : 'Oh non...', W / 2, 114, { size: 11, align: 'center', bold: true, color: '#ffe070' }); UI.text(c, `${this.alive} fleur${this.alive > 1 ? 's' : ''} sauvée${this.alive > 1 ? 's' : ''} — ESPACE`, W / 2, 134, { size: 8, align: 'center' }); }
    }
  }

  const MJ = DW.MiniJeux = {
    WateringScene,
    async arrosage(name = 'Yokomon') {
      const s = DW.state;
      if (s.flags.arrosage === day()) { await DW.say("Les fleurs ont assez bu pour aujourd'hui ! Reviens demain, il fera encore chaud.", name); return; }
      if ((await DW.ask("Le soleil du désert dessèche nos fleurs... Tu nous aides à les arroser ? (30 secondes, une fois par jour)", ['Oui !', 'Plus tard'], name)) !== 0) return;
      s.flags.arrosage = day();
      const n = await DW.Game.push(new WateringScene());
      const bits = n >= 8 ? 400 : n >= 6 ? 250 : n >= 3 ? 120 : 30;
      s.bits += bits;
      let gift = '';
      if (n >= 6) { const extra = DW.giveItem('digichampi', 2); gift = ` et 2 ${DW.ITEMS.digichampi.name}s${DW.extraMsg(extra)}`; }
      await DW.say(n >= 8 ? `Toutes les fleurs sont sauvées ! Tu es un vrai jardinier ! Voici ${bits} Bits${gift} !` : `Merci ! ${n} fleur${n > 1 ? 's' : ''} sur 8. Voici ${bits} Bits${gift}.`, name);
      DW.state.party.forEach(m => m.addHappy(n >= 6 ? 4 : 1));
    },
  };
})();
