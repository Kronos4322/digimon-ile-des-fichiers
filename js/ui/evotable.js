'use strict';
// =====================================================================
//  TABLE DES DIGIVOLUTIONS
//  Gauche : dé-digivolution   Centre : Digimon   Droite : Digivolutions
//  Haut/Bas : choisir   Gauche/Droite : colonne   ENTRÉE : Digimon suivant
//  ESPACE : digivoluer / dé-digivoluer   ÉCHAP : retour
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W;
  const OK = '#7aff8a', NO = '#ff7a7a';

  class EvoTableScene extends DW.Scene {
    constructor(i = 0) { super(); this.i = i; this.col = 1; this.sel = 0; }
    get m() { return DW.state.party[this.i]; }
    get opts() { return DW.Evo.options(this.m.sp); }
    get prev() { return DW.Evo.prev1(this.m.sp, this.m.parcours); }
    update() {
      const n = this.opts.length;
      if (Input.hit('menu')) { this.i = (this.i + 1) % DW.state.party.length; this.sel = 0; this.col = this.opts.length ? 1 : 0; Audio.sfx('move'); }
      if (Input.hit('left') && this.prev && this.col === 1) { this.col = 0; Audio.sfx('move'); }
      if (Input.hit('right') && n && this.col === 0) { this.col = 1; Audio.sfx('move'); }
      if (this.col === 1 && n) {
        if (Input.hit('up')) { this.sel = (this.sel + n - 1) % n; Audio.sfx('move'); }
        if (Input.hit('down')) { this.sel = (this.sel + 1) % n; Audio.sfx('move'); }
      }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('ok')) this.act();
    }
    async act() {
      const m = this.m, st = DW.state;
      if (this.col === 0 && this.prev) {
        const to = this.prev;
        Audio.sfx('select');
        const r = await DW.ask(`Faire dé-digivoluer ${m.name} en ${DW.SPECIES[to].name} ? (niveau et entraînement conservés, ABI +2 : son potentiel augmente)`);
        if (r !== 0) return;
        await Game.push(new DW.EvolutionScene(m, to, { dedigi: true }));
        m.evolve(to);
        this.col = 1; this.sel = 0;
        DW.autosave();
        return;
      }
      const o = this.opts[this.sel];
      if (!o) return;
      const chk = DW.Evo.check(m, o);
      if (!chk.ok) { Audio.sfx('bump'); await DW.say('Les conditions ne sont pas encore remplies. Entraîne-toi et gagne des combats !'); return; }
      Audio.sfx('select');
      const name = (st.owned || {})[o.to] ? DW.SPECIES[o.to].name : '???';
      const F = DW.Evo.partenaireFusion(m, o);
      const r = await DW.ask(F ? `Fusionner ${m.name} et ${F.name} en ${name} ? (${F.name} quitte l'équipe : ils ne font plus qu'un)` : `Faire digivoluer ${m.name} en ${name} ?`);
      if (r !== 0) return;
      if (F) { st.party.splice(st.party.indexOf(F), 1); this.i = st.party.indexOf(m); await DW.say(`${m.name} et ${F.name} unissent leurs données... Le courage et l'amitié ne font plus qu'un !`); }
      await Game.push(new DW.EvolutionScene(m, o.to, { manual: true }));
      m.evolve(o.to);
      st.seen[o.to] = st.owned[o.to] = true;
      await DW.learnEvoMoves(m);
      this.sel = 0;
      DW.autosave();
    }
    icon(c, sp, x, y, known) {
      const spr = DW.Sprites.ow(sp), k = Math.min(1, 22 / spr.h, 22 / spr.w);   // tient dans le cadre
      DW.Sprites.draw(c, spr, x, y, { silhouette: !known, frame: known ? Math.floor(this.t * 2) : 0, scale: k });
    }
    draw(c) {
      const m = this.m, st = DW.state, t = this.t;
      UI.menuBg(c, t);
      UI.box(c, 6, 4, 190, 18, 'dwsel');
      UI.text(c, 'DIGIVOLUTION / DÉ-DIGIVOLUTION', 13, 17, { size: 9 });
      UI.box(c, 222, 4, 92, 18);
      UI.text(c, `Équipe  ${this.i + 1} / ${st.party.length}`, 268, 16, { size: 8, align: 'center' });
      // en-têtes
      UI.box(c, 6, 28, 96, 16); UI.text(c, 'Dé-digivoluer', 54, 39.5, { size: 8, align: 'center', color: '#8ae0f0' });
      UI.box(c, 214, 28, 100, 16); UI.text(c, 'Digivoluer', 264, 39.5, { size: 8, align: 'center', color: '#8ae0f0' });
      // Digimon central
      UI.box(c, 108, 26, 102, 28, 'dwsel');
      this.icon(c, m.sp, 124, 51, true);
      UI.text(c, m.name, 140, 38, { size: 9, color: '#ffe070' });
      UI.text(c, `N.${m.level}  ${m.d.stage}`, 140, 49, { size: 7, color: '#c8f0ff' });
      { const sp = DW.Sprites.battle(m.sp); DW.Sprites.draw(c, sp, 159, 164, { frame: Math.floor(t * 4), scale: Math.min(1, 96 / sp.w, 104 / sp.h) }); }   // reste dans la colonne du milieu
      // flèches
      const opts = this.opts, prev = this.prev;
      c.strokeStyle = '#5ad8f0'; c.fillStyle = '#5ad8f0'; c.lineWidth = 1.4;
      const arrow = (x1, y1, x2, y2) => {
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
        const d = Math.sign(x2 - x1) || 1;
        c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - d * 4, y2 - 3); c.lineTo(x2 - d * 4, y2 + 3); c.fill();
      };
      const VIS = 4, top = Math.max(0, Math.min(this.sel - VIS + 1, opts.length - VIS)), shown = opts.slice(top, top + VIS);
      if (shown.length) {
        const yl = 66 + (shown.length - 1) * 28;
        c.beginPath(); c.moveTo(196, 54); c.lineTo(196, yl); c.stroke();
        shown.forEach((o, j) => arrow(196, 66 + j * 28, 212, 66 + j * 28));
      }
      if (prev) { c.beginPath(); c.moveTo(122, 54); c.lineTo(122, 66); c.stroke(); arrow(122, 66, 104, 66); }
      // dé-digivolution
      if (prev) {
        const sel = this.col === 0;
        UI.box(c, 6, 52, 96, 28, sel ? 'dwsel' : 'dw');
        this.icon(c, prev, 20, 77, true);
        UI.text(c, DW.SPECIES[prev].name, 34, 64, { size: 8, color: sel ? '#ffffff' : '#c8f0ff' });
        UI.text(c, 'Possible !', 34, 75, { size: 7, color: OK });
      } else UI.text(c, '—', 54, 66, { size: 9, align: 'center', color: '#5a8aa0' });
      // digivolutions
      if (top > 0) UI.text(c, '▲', 306, 50, { size: 7, color: '#8ae0f0' });
      if (top + VIS < opts.length) UI.text(c, '▼', 306, 166, { size: 7, color: '#8ae0f0' });
      shown.forEach((o, jj) => {
        const j = top + jj, y = 52 + jj * 28, sel = this.col === 1 && j === this.sel;
        const known = !!(st.owned || {})[o.to], chk = DW.Evo.check(m, o);
        UI.box(c, 214, y, 100, 26, sel ? 'dwsel' : 'dw');
        this.icon(c, o.to, 228, y + 24, known);
        { const nf = UI.fit(c, known ? DW.SPECIES[o.to].name : '???', 68, 8); UI.text(c, nf.s, 242, y + 12, { size: nf.size, color: sel ? '#ffffff' : '#c8f0ff' }); }
        UI.text(c, chk.ok ? 'Possible !' : 'Pas encore...', 242, y + 23, { size: 7, color: chk.ok ? OK : NO });
      });
      if (!opts.length) UI.text(c, m.d.stage === 'Méga' ? 'Stade maximal' : 'Aucune connue', 264, 66, { size: 8, align: 'center', color: '#5a8aa0' });
      // conditions
      UI.box(c, 6, 168, W - 12, 66);
      if (this.col === 0 && prev) {
        UI.label(c, 'DÉ-DIGIVOLUTION', 12, 173);
        UI.wrap(c, `${m.name} redevient ${DW.SPECIES[prev].name}. Son niveau, ses attaques et son entraînement sont conservés.`, 290, 9)
          .forEach((l, j) => UI.text(c, l, 14, 198 + j * 12, { size: 9 }));
      } else if (opts[this.sel]) {
        const o = opts[this.sel], chk = DW.Evo.check(m, o);
        UI.label(c, 'CONDITIONS', 12, 173);
        UI.text(c, (st.owned || {})[o.to] ? DW.SPECIES[o.to].name : 'Forme inconnue', 90, 182, { size: 9, color: '#ffe070' });
        chk.rows.forEach((r, j) => {
          const x = 14 + (j % 2) * 150, y = 196 + Math.floor(j / 2) * 10.5;
          UI.text(c, r.ok ? '✔' : '✘', x, y, { size: 8, color: r.ok ? OK : NO });
          UI.text(c, `${r.label} ${r.cmp || ''}${r.need}`, x + 11, y, { size: 8 });
          UI.text(c, `(${r.have})`, x + 140, y, { size: 7, align: 'right', color: r.ok ? '#8ae0a0' : '#e09090' });
        });
      }
      UI.hints(c, [['ok', 'digivoluer'], ['back', 'retour']], W - 12, 238);
    }
  }
  DW.EvoTableScene = EvoTableScene;
})();
