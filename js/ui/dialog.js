'use strict';
// =====================================================================
//  DIALOGUES : boîte de texte, questions, menus de choix
// =====================================================================
(function () {
  const { UI, Input, Game, ctx } = DW;
  const W = DW.W, H = DW.H;
  // ------------------------------------------------------------ boîte de dialogue
  class DialogScene extends DW.Scene {
    constructor(text, o = {}) {
      super();
      this.overlay = true; this.o = o;
      const lines = UI.wrap(ctx, text, 290, 10);
      this.pages = [];
      for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
      this.page = 0; this.shown = 0; this.choice = 0;
    }
    get pageLen() { return this.pages[this.page].join('').length; }
    update(dt) {
      const full = this.pageLen;
      // avance rapide : Maj maintenu, ou ESPACE maintenu
      this.holdOk = Input.isDown('ok') ? (this.holdOk || 0) + dt : 0;
      const ff = DW.Options.fastForward(this.holdOk);
      if (this.shown < full) {
        const before = Math.floor(this.shown);
        this.shown += dt * DW.Options.cps() * (ff ? 4 : 1);
        if (Math.floor(this.shown) !== before && before % 3 === 0) DW.Audio.sfx('text');
        if (Input.hit('ok') || Input.hit('back')) this.shown = full;
        this.waitT = 0;
        return;
      }
      const last = this.page === this.pages.length - 1;
      if (ff && !(last && this.o.choices)) {
        this.waitT = (this.waitT || 0) + dt;
        if (this.waitT > 0.12) { this.waitT = 0; if (last) this.close(); else { this.page++; this.shown = 0; } }
        return;
      }
      if (last && this.o.choices) {
        const n = this.o.choices.length;
        if (Input.hit('up')) { this.choice = (this.choice + n - 1) % n; DW.Audio.sfx('move'); }
        if (Input.hit('down')) { this.choice = (this.choice + 1) % n; DW.Audio.sfx('move'); }
        if (Input.hit('ok')) { DW.Audio.sfx('select'); this.close(this.choice); }
        else if (Input.hit('back')) { DW.Audio.sfx('back'); this.close(n - 1); }
        return;
      }
      if (Input.hit('ok') || Input.hit('back')) {
        DW.Audio.sfx('select');
        if (last) this.close(); else { this.page++; this.shown = 0; }
      }
    }
    draw(c) {
      UI.box(c, 6, 180, 308, 56);
      if (this.o.speaker) {
        const por = portrait(this.o.speaker), lx = por ? 66 : 12;
        if (por) drawPortrait(c, por, this.t);
        const w = UI.measure(c, this.o.speaker, 9, true) + 14;
        UI.box(c, lx, 167, w, 16, 'orange');
        UI.text(c, this.o.speaker, lx + 7, 178.5, { size: 9, bold: true });
      }
      let n = Math.floor(this.shown);
      this.pages[this.page].forEach((ln, i) => {
        const s = ln.slice(0, Math.max(0, n));
        n -= ln.length;
        UI.text(c, s, 16, 196 + i * 14, { size: 10 });
      });
      const done = this.shown >= this.pageLen;
      const last = this.page === this.pages.length - 1;
      if (done && !(last && this.o.choices)) UI.downArrow(c, 302, 226, this.t);
      // aide : bouton à presser (clavier ou manette), en onglet au-dessus du coin droit de la boîte
      if (!(done && last && this.o.choices)) {
        const txt = done ? (last ? 'fermer' : 'suivant') : 'maintenir : accélérer', w = UI.btnW(c, 'ok') + 3 + UI.measure(c, txt, 7) + 10;
        c.globalAlpha = 0.92; UI.box(c, 314 - w, 168, w, 14); c.globalAlpha = 1;
        UI.hints(c, [['ok', txt]], 309, 178);
      }
      if (done && last && this.o.choices) {
        const ch = this.o.choices;
        const w = Math.max(...ch.map(s => UI.measure(c, s, 10))) + 28;
        const h = ch.length * 14 + 10;
        const x = 314 - w, y = 176 - h;
        UI.box(c, x, y, w, h);
        ch.forEach((s, i) => UI.text(c, s, x + 18, y + 16 + i * 14));
        UI.cursor(c, x + 8, y + 12.5 + this.choice * 14, this.t);
      }
    }
  }
  // ------------------------------------------------------------ portrait de celui qui parle (Digimon ou héros)
  let byName = null;
  function portrait(name) {
    if (!byName) { byName = {}; for (const id in DW.SPECIES) byName[DW.SPECIES[id].name.toLowerCase()] = id; }
    const sp = byName[String(name).toLowerCase()];
    if (sp && DW.SPECIES[sp]) return { sp };
    const st = DW.state;
    if (st && (name === st.name || (DW.HEROES && DW.HEROES[st.hero] && name === DW.HEROES[st.hero].name))) return { hero: true };
    return null;
  }
  function drawPortrait(c, p, t) {
    const x = 6, y = 118, s = 56;
    UI.box(c, x, y, s, s);
    c.save(); UI.rr(c, x + 3, y + 3, s - 6, s - 6, 3); c.clip();
    const g = c.createRadialGradient(x + s / 2, y + s * 0.4, 4, x + s / 2, y + s / 2, s * 0.7);
    g.addColorStop(0, '#2a7a96'); g.addColorStop(1, '#06202c'); c.fillStyle = g; c.fillRect(x, y, s, s);
    if (p.hero) {
      const spr = DW.Sprites.hero('down', 0);
      c.imageSmoothingEnabled = false; c.drawImage(spr.img, 0, 0, spr.w, spr.h * 0.6, x + s / 2 - spr.w, y + 6, spr.w * 2, spr.h * 1.2);
    } else {
      const spr = DW.Sprites.battle(p.sp), k = Math.min(1.4, (s + 10) / Math.max(spr.w, spr.h));
      // cadré sur le haut du corps (la tête), petite respiration
      const by = Math.sin(t * 2) * 0.8;
      DW.Sprites.draw(c, spr, x + s / 2, y + s + spr.h * k * 0.18 + by, { scale: k, frame: 0 });
    }
    c.restore();
  }
  DW.DialogScene = DialogScene;
  DW.say = (text, speaker) => Game.push(new DialogScene(text, { speaker }));
  DW.ask = (text, choices = ['Oui', 'Non'], speaker) => Game.push(new DialogScene(text, { speaker, choices }));

  // ------------------------------------------------------------ menu de choix générique
  class ChoiceScene extends DW.Scene {
    constructor(opts, o = {}) {
      super();
      this.overlay = true; this.opts = opts; this.o = o; this.i = o.start || 0;
      this.w = o.w || Math.max(...opts.map(s => UI.measure(ctx, s, 10))) + 30;
      this.h = opts.length * 14 + 10;
      this.x = o.x != null ? o.x : W - this.w - 8;
      this.y = o.y != null ? o.y : H - this.h - 64;
    }
    update() {
      const n = this.opts.length;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; DW.Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; DW.Audio.sfx('move'); }
      if (Input.hit('ok')) { DW.Audio.sfx('select'); this.close(this.i); }
      else if (Input.hit('back') && this.o.cancel !== false) { DW.Audio.sfx('back'); this.close(-1); }
    }
    draw(c) {
      UI.box(c, this.x, this.y, this.w, this.h);
      this.opts.forEach((s, i) => UI.text(c, s, this.x + 18, this.y + 16 + i * 14));
      UI.cursor(c, this.x + 8, this.y + 12.5 + this.i * 14, this.t);
    }
  }
  DW.ChoiceScene = ChoiceScene;
  DW.choose = (opts, o) => Game.push(new ChoiceScene(opts, o || {}));
})();
