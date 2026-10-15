'use strict';
// =====================================================================
//  CINÉMATIQUE : LA POURSUITE DE KUWAGAMON (épisode 1 de l'animé)
//  La première fois qu'on entre dans la forêt : un bourdonnement, une ombre rouge passe au-dessus des arbres,
//  Kuwagamon fond sur le héros et son bébé, qui courent jusqu'au bord du ravin ; le bébé crache ses petites
//  bulles... et Kuwagamon remonte et s'envole vers le Grand Arbre de la Clairière. La menace est posée.
//  3 plans, bandes cinéma et légendes, image stable (seuls les personnages bougent).
// =====================================================================
(function () {
  const { UI, Audio } = DW;
  const W = DW.W, H = DW.H;

  class KuwaChaseScene extends DW.Scene {
    constructor() {
      super();
      this.mode = 'sky'; this.cap = { a: 0 }; this.line = ''; this.bars = { v: 0 };
      this.v = { pass: 0, dive: 0, run: 0, bub: 0, up: 0 };
      this.buf = DW.Art.canvas(W, H); this.xf = null; this.flash = 0;
      this.bg = DW.World.battleBg('foret');
    }
    enter() { this.run().then(() => this.close()); }
    update() { if (DW.Input.hit('ok')) this.skip = true; }
    tick(dt) { if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.6); }
    async show(txt, hold = 2.6) {
      this.line = txt; this.skip = false;
      await DW.tween(this.cap, { a: 1 }, 0.4);
      let t = 0; while (t < hold && !this.skip) { await DW.wait(0.05); t += 0.05; }
      await DW.tween(this.cap, { a: 0 }, 0.3);
    }
    cut(mode, dur = 0.8) {
      const x = this.buf.getContext('2d'); x.clearRect(0, 0, W, H);
      const cap = this.cap.a; this.cap.a = 0; this.draw(x); this.cap.a = cap;
      this.mode = mode; this.xf = { v: 1 };
      return DW.tween(this.xf, { v: 0 }, dur);
    }
    async run() {
      const s = DW.state, pt = s.party.find(m => m.hp > 0) || s.party[0];
      this.pt = pt ? pt.sp : 'koromon'; this.ptName = pt ? pt.name : 'ton Digimon';
      DW.tween(this.bars, { v: 1 }, 0.8);
      await DW.fade(0, 0.5);
      // 1) une ombre rouge passe au-dessus de la forêt
      Audio.sfx('roar');
      await this.show('BZZZZZZ... Un bourdonnement énorme fait trembler les feuilles.', 2);
      await DW.tween(this.v, { pass: 1 }, 1.6, DW.linear);
      await this.show("Une ombre rouge passe au-dessus des arbres... puis fait demi-tour !", 2.2);
      // 2) il fond sur le héros, qui court avec son bébé
      await this.cut('chase', 0.7);
      Audio.play('boss');
      DW.tween(this.v, { run: 1 }, 2.6, DW.linear);
      await DW.wait(0.6);
      Audio.sfx('swoosh');
      await DW.tween(this.v, { dive: 1 }, 1.6);
      await this.show(`Kuwagamon ! Ses pinces claquent juste derrière toi... Cours, ${s.name} !`, 2.4);
      // 3) au bord du ravin, le bébé crache ses bulles ; Kuwagamon remonte et s'envole vers la Clairière
      Audio.sfx('water');
      await DW.tween(this.v, { bub: 1 }, 1.2);
      await this.show(`${this.ptName} se met devant toi et crache ses petites bulles de toutes ses forces !`, 2.4);
      Audio.sfx('roar'); this.flash = 0.5;
      await DW.tween(this.v, { up: 1 }, 1.6);
      await this.show("Surpris, Kuwagamon remonte... et file vers le Grand Arbre de la Clairière, au cœur de la forêt.", 2.8);
      await this.show("Ce monstre terrorise l'île. Un jour, il faudra l'affronter.", 2.4);
      await DW.fade(1, 0.6);
      this.bars.v = 0;
    }
    draw(c) {
      const t = this.t, v = this.v;
      c.drawImage(this.bg, 0, 0);
      const ku = DW.Sprites.battle('kuwagamon');
      if (this.mode === 'sky') {
        c.fillStyle = 'rgba(0,30,10,0.25)'; c.fillRect(0, 0, W, H);
        // l'ombre de Kuwagamon qui traverse le ciel, de gauche à droite
        const x = DW.lerp(-60, W + 60, v.pass), y = 50 + Math.sin(v.pass * 6) * 6;
        DW.Sprites.draw(c, ku, x, y + 30, { scale: 0.6, silhouette: true, frame: Math.floor(t * 8) });
      } else {
        c.fillStyle = 'rgba(0,20,10,0.2)'; c.fillRect(0, 0, W, H);
        // bord du ravin à droite
        c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(W - 40, 170); c.lineTo(W, 170); c.lineTo(W, H); c.lineTo(W - 56, H); c.fill();
        // le héros et son bébé courent vers la droite, jusqu'au bord
        const hx = DW.lerp(60, 238, Math.min(1, v.run)), stop = v.run >= 1;
        const hs = DW.Sprites.hero(stop ? 'left' : 'right', stop ? 0 : Math.floor(t * 10) % 4);
        const ps = DW.Sprites.battle(this.pt), px = stop && v.bub > 0 ? hx - 34 : hx - 22;
        DW.Sprites.draw(c, ps, px, 212, { scale: Math.min(0.9, 40 / ps.h), flip: v.bub > 0, frame: Math.floor(t * 6) });
        c.drawImage(hs.img, Math.round(hx - hs.w), Math.round(214 - hs.h * 2), hs.w * 2, hs.h * 2);
        // les bulles du bébé
        if (v.bub > 0 && v.up < 1) for (let i = 0; i < 9; i++) { const k = (v.bub * 1.4 + i * 0.12) % 1, bx = px - 10 - k * 70, by = 196 - k * 60 - Math.sin(i + t * 6) * 4; c.strokeStyle = 'rgba(200,240,255,0.9)'; c.lineWidth = 1; c.beginPath(); c.arc(bx, by, 2.5 + (i % 3), 0, 7); c.stroke(); }
        // Kuwagamon qui plonge depuis le haut à gauche, puis remonte et s'envole
        const kx = DW.lerp(-40, hx - 110, v.dive) + v.up * -40, ky = DW.lerp(-30, 150, v.dive) - v.up * 220;
        if (v.dive > 0) DW.Sprites.draw(c, ku, kx, ky + 60, { scale: 1.1, frame: Math.floor(t * 10), flip: false });
      }
      if (this.xf && this.xf.v > 0) { c.globalAlpha = this.xf.v; c.drawImage(this.buf, 0, 0); c.globalAlpha = 1; }
      if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, this.flash)})`; c.fillRect(0, 0, W, H); }
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
  }
  DW.KuwaChaseScene = KuwaChaseScene;

  // la première entrée dans la forêt (Lisière, Sentier, Prairie, Bois des Géants, Clairière) lance la scène
  const FOREST = ['lisiere', 'sentier', 'prairie', 'geants', 'clairiere'];
  DW.KuwaChase = {
    // (appelé au chargement d'une carte : la scène part dès que l'exploration reprend la main)
    hook(ow) {
      const s = DW.state;
      if (ow.onEnter || s.flags.kuwaChase || s.flags.kuwagamon || !FOREST.includes(ow.mapId) || !s.party.length) return;
      ow.onEnter = async () => {
        s.flags.kuwaChase = true;
        await DW.fade(1, 0.4);
        await DW.Game.push(new KuwaChaseScene());
        DW.Audio.play(ow.map.music);
        await DW.fade(0, 0.6);
        DW.autosave();
      };
    },
  };
})();
