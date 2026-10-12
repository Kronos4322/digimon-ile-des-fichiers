'use strict';
// =====================================================================
//  DIGIFERME (au Jardin de Yokomon) : Digimon en réserve
//  Haut/Bas : choisir   ESPACE : prendre / échanger   D : déposer   ÉCHAP : retour
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;

  class FarmScene extends DW.Scene {
    constructor() { super(); this.i = 0; }
    get box() { return DW.state.box; }
    update() {
      const n = this.box.length + 1; // dernière ligne : déposer un Digimon de l'équipe
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('ok')) { Audio.sfx('select'); this.act(); }
    }
    async act() {
      const st = DW.state;
      if (this.i === this.box.length) {
        if (st.party.length <= 1) { await DW.say('Il te faut garder au moins un Digimon avec toi !'); return; }
        const j = await Game.push(new DW.PartyScene({ mode: 'select', title: 'DÉPOSER' }));
        if (j == null || j < 0) return;
        const [m] = st.party.splice(j, 1);
        m.heal(); st.box.push(m);
        await DW.say(`${m.name} part se reposer au Jardin.`);
        return;
      }
      const m = this.box[this.i];
      if (st.party.length < 6) {
        this.box.splice(this.i, 1); st.party.push(m);
        await DW.say(`${m.name} rejoint ton équipe !`);
      } else {
        const j = await Game.push(new DW.PartyScene({ mode: 'select', title: 'ÉCHANGER' }));
        if (j == null || j < 0) return;
        const out = st.party[j]; out.heal();
        st.party[j] = m; this.box[this.i] = out;
        await DW.say(`${m.name} rejoint l'équipe, ${out.name} reste au Jardin.`);
      }
      this.i = Math.min(this.i, this.box.length);
    }
    draw(c) {
      UI.menuBg(c, this.t, 'DIGIFERME');
      UI.text(c, `${this.box.length} Digimon au Jardin`, W - 12, 17, { size: 8, align: 'right', color: '#8ae0f0' });
      UI.box(c, 6, 26, 186, 208);
      const rows = this.box.map(m => `${m.name}  N.${m.level}`).concat(['➜ Déposer un Digimon']);
      const top = Math.max(0, Math.min(this.i - 5, rows.length - 11));
      rows.slice(top, top + 11).forEach((s, k) => {
        const idx = top + k, y = 34 + k * 18;
        if (idx === this.i) UI.box(c, 10, y - 2, 178, 17, 'dwsel');
        if (idx < this.box.length) DW.Sprites.draw(c, DW.Sprites.ow(this.box[idx].sp), 22, y + 14, { frame: 0 });
        UI.text(c, s, 38, y + 10, { size: 9, color: idx === this.box.length ? '#ffe070' : '#ffffff' });
      });
      const m = this.box[this.i];
      UI.box(c, 198, 26, 116, 208);
      if (m) {
        DW.Sprites.draw(c, DW.Sprites.battle(m.sp), 256, 120, { frame: Math.floor(this.t * 4) });
        UI.text(c, m.name, 256, 138, { size: 10, align: 'center', color: '#ffe070' });
        UI.text(c, `${m.d.stage}  ·  N.${m.level}`, 256, 152, { size: 8, align: 'center' });
        UI.text(c, 'ESPACE : prendre', 256, 220, { size: 7, align: 'center', color: '#8ae0f0' });
      } else UI.wrap(c, "Dépose ici les Digimon que tu n'emmènes pas. Ils se reposent et restent en pleine forme.", 100, 8).forEach((l, k) => UI.text(c, l, 206, 50 + k * 11, { size: 8, color: '#c8f0ff' }));
    }
  }
  DW.FarmScene = FarmScene;
})();
