'use strict';
// =====================================================================
//  DIGIVOLUTION : séquence animée (ÉCHAP pour annuler, sauf scénario)
//  1) le Digimon se charge de lumière dans un tunnel aux couleurs de son élément
//  2) sa silhouette alterne avec la nouvelle forme en grandissant
//  3) explosion d'anneaux, particules de l'élément, bannière du nouveau nom
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W, H = DW.H, CY = 112;

  // couleurs et particules par élément (premier type de la nouvelle forme)
  const ELEM = {
    'Feu': { a: '#ff7a1a', b: '#ffd040', bg: ['#5a1606', '#0e0302'], p: 'ember' },
    'Eau': { a: '#2a8ae8', b: '#a8e4ff', bg: ['#0a2a6a', '#020614'], p: 'bubble' },
    'Glace': { a: '#6ad0f0', b: '#ffffff', bg: ['#14406a', '#020814'], p: 'snow' },
    'Plante': { a: '#4ac04a', b: '#e0ff90', bg: ['#0e4a1a', '#020a04'], p: 'leaf' },
    'Électrique': { a: '#f8e030', b: '#ffffff', bg: ['#3a3a0a', '#060602'], p: 'spark' },
    'Air': { a: '#8ad0ff', b: '#ffffff', bg: ['#1a4a7a', '#030814'], p: 'spark' },
    'Insecte': { a: '#8ac040', b: '#f0ff90', bg: ['#2a3a0a', '#050802'], p: 'leaf' },
    'Terre': { a: '#c08a4a', b: '#f0d8a0', bg: ['#3a2410', '#080402'], p: 'ember' },
    'Ténèbres': { a: '#a04ad0', b: '#f0c0ff', bg: ['#2a0a3a', '#060208'], p: 'spark' },
    'Lumière': { a: '#ffe080', b: '#ffffff', bg: ['#4a3a10', '#080602'], p: 'spark' },
  };
  const elemOf = sp => ELEM[(DW.SPECIES[sp].types || [])[0]] || { a: '#6ab0ff', b: '#ffffff', bg: ['#2a3aa0', '#02030e'], p: 'spark' };

  class EvolutionScene extends DW.Scene {
    constructor(mon, to, o = {}) {
      super();
      this.mon = mon; this.from = mon.sp; this.to = to; this.o = o;
      this.E = elemOf(o.dedigi ? mon.sp : to);
      this.v = { white: 0, flash: 0, glow: 0, morph: 0, ring: 0, banner: 0, shake: 0 };
      this.showNew = false; this.cancelReq = false;
      this.streaks = Array.from({ length: 50 }, () => this.streak(true));
      this.parts = [];
      this.shards = [];
    }
    streak(init) { return { a: Math.random() * Math.PI * 2, r: init ? Math.random() * 220 : 4, v: 0.8 + Math.random() * 1.4 }; }
    enter() { this.run().then(r => this.close(r)); }
    // éclats de données qui s'échappent du corps
    burst(n, speed) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random());
        this.shards.push({ x: W / 2, y: CY, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: 0.8 + Math.random() * 0.8, t: 0, sz: 1 + Math.floor(Math.random() * 3) });
      }
    }
    async run() {
      const oldName = this.mon.name, newName = DW.SPECIES[this.to].name;
      Audio.play('evolve');
      await DW.say(this.o.dedigi ? `Le Digivice libère les données de ${oldName}...` : this.o.story ? `Le Digivice s'illumine ! ${oldName} est enveloppé d'une lumière éclatante !` : `Le Digivice réagit ! ${oldName} rassemble ses données...`);
      DW.tween(this.v, { glow: 1 }, 1.0);
      await DW.tween(this.v, { white: 1 }, 0.9);
      this.burst(30, 60);
      // alternance des silhouettes, de plus en plus rapide, la taille glisse vers la nouvelle forme
      let t = 0;
      const dur = 3.8;
      while (t < dur) {
        const per = DW.lerp(0.42, 0.04, t / dur);
        this.showNew = !this.showNew;
        this.v.morph = t / dur;
        Audio.sfx('evotick');
        if (Math.random() < 0.5) this.burst(4, 50);
        await DW.wait(per);
        t += per;
        if (!this.o.story && !this.o.manual && !this.o.dedigi && this.cancelReq) {
          this.showNew = false; this.v.morph = 0;
          await DW.tween(this.v, { white: 0, glow: 0 }, 0.5);
          Audio.stop();
          await DW.say(`Hein ? ${oldName} a cessé de digivoluer...`);
          return false;
        }
      }
      // explosion de lumière : la nouvelle forme apparaît
      this.showNew = true; this.v.morph = 1;
      this.v.flash = 1; this.v.ring = 0; this.v.shake = 1;
      this.burst(60, 140);
      Audio.sfx('evolve'); Audio.sfx('super');
      DW.tween(this.v, { flash: 0 }, 1.0);
      DW.tween(this.v, { ring: 1 }, 1.4, DW.linear);
      DW.tween(this.v, { shake: 0 }, 0.6);
      await DW.tween(this.v, { white: 0 }, 1.0);
      Audio.play('victory');
      await DW.tween(this.v, { banner: 1 }, 0.4);
      await DW.say(this.o.dedigi ? `${oldName} dé-digivolue en... ${newName} !` : `${oldName} digivolve en... ${newName} !`);
      return true;
    }
    update() { if (Input.hit('back')) this.cancelReq = true; }
    tick(dt) {
      const sp = 1 + this.v.glow * 2;
      this.streaks.forEach((s, i) => { s.r *= 1 + s.v * sp * dt; s.r += 6 * dt; if (s.r > 260) this.streaks[i] = this.streak(false); });
      // particules de l'élément (flammes, bulles, feuilles, flocons, étincelles)
      const n = this.v.glow * 26;
      if (this.parts.length < n) this.parts.push({ x: W / 2 + (Math.random() - 0.5) * 140, y: CY + 40 + Math.random() * 40, vy: -20 - Math.random() * 40, ph: Math.random() * 6, life: 0, max: 1.4 + Math.random() * 1.6, s: 1 + Math.random() * 2 });
      this.parts.forEach(p => { p.life += dt; p.y += p.vy * dt; p.x += Math.sin(this.t * 3 + p.ph) * 12 * dt; });
      this.parts = this.parts.filter(p => p.life < p.max);
      this.shards.forEach(s => { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 30 * dt; });
      this.shards = this.shards.filter(s => s.t < s.life);
    }
    drawPart(c, p) {
      const E = this.E, a = Math.max(0, 1 - p.life / p.max), x = Math.round(p.x), y = Math.round(p.y);
      if (E.p === 'ember') {
        c.fillStyle = `rgba(255,${120 + Math.floor(p.ph * 20)},40,${a})`; c.fillRect(x, y, p.s, p.s);
        c.fillStyle = `rgba(255,240,160,${a * 0.8})`; c.fillRect(x, y, 1, 1);
      } else if (E.p === 'bubble') {
        c.strokeStyle = `rgba(200,240,255,${a})`; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, p.s + 1, 0, 7); c.stroke();
        c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(x - 1, y - 1, 1, 1);
      } else if (E.p === 'leaf') {
        c.save(); c.translate(x, y); c.rotate(this.t * 2 + p.ph); c.fillStyle = `rgba(140,230,90,${a})`;
        c.beginPath(); c.ellipse(0, 0, 3, 1.4, 0, 0, 7); c.fill(); c.restore();
      } else if (E.p === 'snow') {
        c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3);
      } else {
        c.fillStyle = `rgba(255,255,220,${a})`; c.fillRect(x, y - 1, 1, 3); c.fillRect(x - 1, y, 3, 1);
      }
    }
    draw(c) {
      const t = this.t, E = this.E, sh = this.v.shake;
      c.save();
      if (sh > 0) c.translate((Math.random() - 0.5) * 6 * sh, (Math.random() - 0.5) * 6 * sh);
      // fond : tunnel de lumière aux couleurs de l'élément
      const g = c.createRadialGradient(W / 2, CY, 6, W / 2, CY, 230);
      g.addColorStop(0, E.bg[0]); g.addColorStop(1, E.bg[1]);
      c.fillStyle = g; c.fillRect(-10, -10, W + 20, H + 20);
      c.save(); c.globalCompositeOperation = 'lighter';
      this.streaks.forEach(s => {
        const r2 = s.r * 1.2;
        c.strokeStyle = E.a; c.globalAlpha = Math.min(0.7, s.r / 160) * (0.4 + this.v.glow * 0.6); c.lineWidth = Math.max(0.6, s.r / 100);
        c.beginPath(); c.moveTo(W / 2 + Math.cos(s.a) * s.r, CY + Math.sin(s.a) * s.r); c.lineTo(W / 2 + Math.cos(s.a) * r2, CY + Math.sin(s.a) * r2); c.stroke();
      });
      c.globalAlpha = 1;
      // hexagones qui tournent
      for (let r = 0; r < 4; r++) {
        const z = ((r / 4) + t * 0.25) % 1, rad = 30 + z * 170;
        c.strokeStyle = E.b; c.globalAlpha = (1 - z) * (0.15 + this.v.glow * 0.35); c.lineWidth = 1 + z * 2;
        c.beginPath();
        for (let k = 0; k <= 6; k++) { const an = k * Math.PI / 3 + t * (r % 2 ? -0.5 : 0.5); c.lineTo(W / 2 + Math.cos(an) * rad, CY + Math.sin(an) * rad * 0.7); }
        c.stroke();
      }
      c.globalAlpha = 1;
      // rayons derrière le Digimon
      if (this.v.glow > 0) {
        c.translate(W / 2, CY);
        for (let i = 0; i < 14; i++) {
          c.rotate(Math.PI / 7 + Math.sin(t * 0.5) * 0.01);
          c.fillStyle = E.b; c.globalAlpha = 0.07 * this.v.glow;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(220, -10 - Math.sin(t * 4 + i) * 6); c.lineTo(220, 10); c.fill();
        }
        c.setTransform(c.getTransform().a, 0, 0, c.getTransform().d, 0, 0);
        c.globalAlpha = 1;
        // halo central
        const hg = c.createRadialGradient(W / 2, CY, 2, W / 2, CY, 70);
        hg.addColorStop(0, `rgba(255,255,255,${0.5 * this.v.glow})`); hg.addColorStop(0.4, E.a + '55'); hg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = hg; c.fillRect(W / 2 - 80, CY - 80, 160, 160);
      }
      c.restore();
      if (sh > 0) { c.save(); c.translate((Math.random() - 0.5) * 6 * sh, (Math.random() - 0.5) * 6 * sh); }
      // particules de l'élément
      this.parts.forEach(p => this.drawPart(c, p));
      // le Digimon : silhouette blanche qui alterne et change de taille
      const sp = this.showNew ? this.to : this.from;
      const spr = DW.Sprites.battle(sp), other = DW.Sprites.battle(this.showNew ? this.from : this.to);
      // pendant la transformation, les deux formes sont ramenées vers une taille intermédiaire
      const k = this.v.white > 0.5 && this.v.morph < 1 ? DW.lerp(1, other.h / spr.h, 0.5 * Math.sin(this.v.morph * Math.PI)) : 1;
      const bob = Math.sin(t * 2) * 2 * this.v.glow;
      DW.Sprites.draw(c, spr, W / 2, CY + spr.h * k / 2 + bob, { white: this.v.white, frame: Math.floor(t * 4), scale: k });
      // éclats de données
      this.shards.forEach(s => { c.fillStyle = s.t < 0.2 ? '#ffffff' : E.b; c.globalAlpha = Math.max(0, 1 - s.t / s.life); c.fillRect(Math.round(s.x), Math.round(s.y), s.sz, s.sz); });
      c.globalAlpha = 1;
      // anneaux de l'explosion finale
      if (this.v.ring > 0 && this.v.ring < 1) {
        for (let i = 0; i < 3; i++) {
          const r = this.v.ring * (140 + i * 40) - i * 14; if (r <= 0) continue;
          c.strokeStyle = i === 1 ? E.a : E.b; c.globalAlpha = 1 - this.v.ring; c.lineWidth = 3 - i * 0.6;
          c.beginPath(); c.ellipse(W / 2, CY, r, r * 0.55, 0, 0, 7); c.stroke();
        }
        c.globalAlpha = 1;
      }
      if (sh > 0) c.restore();
      // bannière du nouveau nom
      if (this.v.banner > 0) {
        const b = this.v.banner, y = 20, w = W * b;
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(W / 2 - w / 2, y - 12, w, 22);
        c.fillStyle = E.a; c.fillRect(W / 2 - w / 2, y - 12, w, 2); c.fillRect(W / 2 - w / 2, y + 8, w, 2);
        c.globalAlpha = b;
        UI.text(c, DW.SPECIES[this.to].name.toUpperCase(), W / 2, y + 4, { size: 14, align: 'center', bold: true, color: E.b === '#ffffff' ? '#ffffff' : E.b });
        UI.text(c, DW.SPECIES[this.to].stage, W / 2 + w / 2 - 8, y + 5, { size: 7, align: 'right', color: '#c8d0e8' });
        c.globalAlpha = 1;
      }
      if (this.v.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.v.flash})`; c.fillRect(0, 0, W, H); }
      if (!this.o.story && !this.o.manual && !this.o.dedigi && this.v.white > 0.5) UI.text(c, 'ÉCHAP : annuler', W - 6, 12, { size: 7, align: 'right', color: '#8a9ad0' });
    }
  }
  DW.EvolutionScene = EvolutionScene;
})();
