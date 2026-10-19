'use strict';
// =====================================================================
//  SAC ET BANQUE : objets du sac (utiliser, jeter), banque de Kunemon, coffre et frigo de la maison
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W;

  // ------------------------------------------------------------ sac (deux colonnes avec icônes)
  class BagScene extends DW.Scene {
    constructor(o = {}) { super(); this.o = o; this.i = 0; }
    get list() { return DW.ITEM_ORDER.filter(id => (DW.state.bag[id] || 0) > 0); }
    update() {
      const L = this.list, n = L.length;
      if (Input.hit('back')) { Audio.sfx('back'); this.close(null); return; }
      if (!n) { if (Input.hit('ok')) this.close(null); return; }
      let i = this.i;
      if (Input.hit('left') || Input.hit('right')) i ^= 1;
      if (Input.hit('up')) i -= 2;
      if (Input.hit('down')) i += 2;
      i = DW.clamp(i, 0, n - 1);
      if (i !== this.i) { this.i = i; Audio.sfx('move'); }
      if (Input.hit('ok')) { Audio.sfx('select'); this.use(L[this.i]); }
    }
    async use(id) {
      const it = DW.ITEMS[id], st = DW.state;
      if (['home', 'potty', 'bell', 'none', 'passive'].includes(it.use)) {
        if (it.use === 'none' || it.use === 'passive') { await DW.say(it.desc); return; }
        if (this.o.battle) { await DW.say("Ça ne sert à rien en plein combat !"); return; }
        if (it.use === 'bell') { st.bag[id]--; st.bellUntil = st.clock + 120; st.repelUntil = 0; await DW.say('Ding ding ! Tous les Digimon sauvages des environs accourent...'); }
        if (it.use === 'potty') { if (!DW.Care || !st.party.length) return; st.bag[id]--; this.close(null); await DW.Care.toilet(); return; }
        if (it.use === 'home') { st.bag[id]--; this.close(null); DW.Audio.sfx('swoosh'); await DW.fade(1, 0.5, '#ffffff'); await DW.ow.charger('village', 20, 16, 'down'); await DW.fade(0, 0.5); await DW.say('Le Pilote automatique te ramène à la Ville des Fichiers !'); return; }
        this.i = DW.clamp(this.i, 0, Math.max(0, this.list.length - 1)); return;
      }
      if (it.use === 'evo') {
        if (this.o.battle) { await DW.say("Ce n'est pas le moment !"); return; }
        const t = await Game.push(new DW.PartyScene({ mode: 'select', title: it.name.toUpperCase() }));
        if (t == null || t < 0) return;
        const mon = st.party[t];
        if (!DW.canUse(id, mon)) { await DW.say(`Ça ne marche que sur un Digimon de stade ${it.from}.`); return; }
        if ((await DW.ask(`Utiliser ${it.name} : ${mon.name} va digivoluer en ${DW.SPECIES[it.to].name}. D'accord ?`)) !== 0) return;
        st.bag[id]--; this.close(null);
        await Game.push(new DW.EvolutionScene(mon, it.to, { manual: true }));
        mon.evolve(it.to); st.seen[it.to] = true; if (st.owned) st.owned[it.to] = true;
        await DW.learnEvoMoves(mon); DW.autosave(); return;
      }
      if (it.use === 'repel') {
        if (this.o.battle) { await DW.say("Ça ne sert à rien en plein combat !"); return; }
        st.bag[id]--; st.repelUntil = st.clock + 120;
        await DW.say("Tu te parfumes... Les Digimon sauvages vont te laisser tranquille pendant 2 heures.");
        this.i = DW.clamp(this.i, 0, Math.max(0, this.list.length - 1)); return;
      }
      if (it.use === 'manual') {
        const m = st.party[0]; if (!m) return;
        const mv = DW.nextMove(m);
        if (!mv) { await DW.say(`${m.name} connaît déjà toutes les techniques de son espèce.`); return; }
        st.bag[id]--; await DW.say(`${m.name} étudie le manuel...`); await DW.learnMove(m, mv);
        this.i = DW.clamp(this.i, 0, Math.max(0, this.list.length - 1)); return;
      }
      if (it.use === 'pack') {
        if (this.o.battle) { await DW.say("Ce n'est pas le moment d'ouvrir des cartes !"); return; }
        st.bag[id]--; await DW.Cards.openPack(); this.i = DW.clamp(this.i, 0, Math.max(0, this.list.length - 1)); return;
      }
      if (!st.party.length) { await DW.say("Tu n'as aucun Digimon !"); return; }
      if (it.use === 'buff' || it.use === 'protect') {
        if (!this.o.battle) { await DW.say('Cet objet ne sert que pendant un combat.'); return; }
        this.close({ item: id, target: 0 }); return;
      }
      const t = await Game.push(new DW.PartyScene({ mode: 'select', title: it.name.toUpperCase() }));
      if (t == null || t < 0) return;
      const mon = st.party[t];
      if (!DW.canUse(id, mon, this.o.battle)) { await DW.say("Ça n'aura aucun effet."); return; }
      if (this.o.battle) { this.close({ item: id, target: t }); return; }
      Audio.sfx('heal');
      if (it.use === 'heal') mon.addHappy(2);
      await DW.say(DW.useItem(id, mon));
      this.i = DW.clamp(this.i, 0, Math.max(0, this.list.length - 1));
    }
    draw(c) {
      UI.menuBg(c, this.t, 'OBJETS');
      const L = this.list;
      UI.text(c, `Sac : ${DW.bagUsed()}/${DW.bagSlots()} sortes`, W / 2 + 10, 17, { size: 8, align: 'center', color: DW.bagUsed() >= DW.bagSlots() ? '#ffb070' : '#9ab0e8' });
      UI.text(c, `${DW.state.bits} Bits`, W - 12, 17, { size: 9, align: 'right', color: '#ffe070' });
      UI.box(c, 6, 26, W - 12, 150);
      if (!L.length) UI.text(c, 'Ton sac est vide.', W / 2, 100, { size: 10, align: 'center', color: '#8ae0f0' });
      // 6 lignes visibles (12 objets) : la liste défile avec le curseur
      const ROWS = 6, rows = Math.ceil(L.length / 2), top = DW.clamp((this.i >> 1) - 2, 0, Math.max(0, rows - ROWS));
      if (top > 0) UI.text(c, '▲', W / 2, 33, { size: 7, align: 'center', color: '#8ae0f0' });
      if (top + ROWS < rows) UI.text(c, '▼', W / 2, 175, { size: 7, align: 'center', color: '#8ae0f0' });
      L.forEach((id, i) => {
        const col = i % 2, row = (i >> 1) - top, x = 14 + col * 150, y = 34 + row * 22;
        if (row < 0 || row >= ROWS) return;
        if (i === this.i) UI.box(c, x - 4, y - 3, 146, 21, 'dwsel');
        c.drawImage(DW.Icons.item(id), x, y);
        UI.text(c, DW.ITEMS[id].name, x + 20, y + 11, { size: 10, color: '#c8ffd0' });
        UI.text(c, `${DW.state.bag[id]}/${DW.BAG_MAX}`, x + 136, y + 11, { size: 10, align: 'right', color: DW.state.bag[id] >= DW.BAG_MAX ? '#ffd070' : '#ffffff' });
      });
      UI.box(c, 6, 180, W - 12, 54);
      const id = L[this.i];
      UI.wrap(c, id ? DW.ITEMS[id].desc : '', 286, 10).forEach((l, i) => UI.text(c, l, 16, 198 + i * 14));
      UI.text(c, 'ÉCHAP : retour', W - 14, 230, { size: 7, align: 'right', color: '#6ab8d0' });
    }
  }
  DW.BagScene = BagScene;

  // ------------------------------------------------------------ Banque : déposer / retirer des objets
  // Gauche/Droite : sac ou banque   Haut/Bas : objet   ESPACE : 1 objet   ENTRÉE : tout   ÉCHAP : sortir
  // banque et coffre : seuls les objets que tu possèdes apparaissent ; le frigo montre aussi les nourritures qui manquent (grisées)
  class BankScene extends DW.Scene {
    // o.store : 'bank' (coffre, Banque : tout SAUF la nourriture) ou 'fridge' (frigo : la nourriture seulement, 20 de chaque)
    constructor(o = {}) { super(); this.i = 0; this.side = 0; this.title = o.title || 'BANQUE'; this.store = o.store || 'bank'; }
    get box() { const st = DW.state; return (st[this.store] = st[this.store] || {}); }
    accepts(id) { return this.store === 'fridge' ? DW.isFood(id) : !DW.isFood(id); }
    get list() {
      const st = DW.state, bank = this.box, have = id => (bank[id] || 0) > 0 || ((st.bag[id] || 0) > 0 && this.accepts(id));
      // le frigo montre toutes les nourritures, même absentes (grisées, à la fin) : on voit ce qui manque
      if (this.store === 'fridge') { const all = DW.ITEM_ORDER.filter(id => DW.isFood(id)); return all.filter(have).concat(all.filter(id => !have(id))); }
      return DW.ITEM_ORDER.filter(have);
    }
    move(id, all) {
      const st = DW.state, bank = this.box;
      const from = this.side ? bank : st.bag, have = from[id] || 0;
      let n = all ? have : Math.min(1, have);
      if (!this.side && !this.accepts(id)) { Audio.sfx('bump'); this.msg = this.store === 'fridge' ? 'Seule la nourriture va au frigo !' : 'La nourriture ne se range pas ici : mets-la au frigo !'; this.msgT = 2; return; }
      if (!this.side && this.store === 'fridge') n = Math.min(n, Math.max(0, 20 - (bank[id] || 0)));
      if (!this.side) { bank[id] = (bank[id] || 0) + n; st.bag[id] = have - n; }
      else {
        n = Math.min(n, DW.bagRoom(id));
        if (!n && have) { Audio.sfx('bump'); this.msg = 'Ton sac est plein pour cet objet !'; this.msgT = 2; return; }
        st.bag[id] = (st.bag[id] || 0) + n;
        bank[id] = have - n;
      }
      if (n) { Audio.sfx('buy'); this.msg = `${DW.ITEMS[id].name} x${n} ${this.side ? 'retiré' : 'déposé'}${n > 1 ? 's' : ''}`; this.msgT = 1.6; } else Audio.sfx('bump');
    }
    update() {
      const L = this.list, n = Math.max(1, L.length);
      if (this.i >= n) this.i = n - 1;
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('left') || Input.hit('right')) { this.side ^= 1; Audio.sfx('move'); }
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (!L.length) return;
      if (Input.hit('ok')) this.move(L[this.i], false);
      if (Input.hit('menu')) this.move(L[this.i], true);
    }
    tick(dt) { if (this.msgT > 0) this.msgT -= dt; }
    draw(c) {
      const st = DW.state, bank = this.box, L = this.list, ROWS = 5;
      // liste défilante : 5 objets visibles autour du curseur
      const top = DW.clamp(this.i - 2, 0, Math.max(0, L.length - ROWS));
      UI.menuBg(c, this.t, this.title);
      if (!L.length) UI.text(c, "Ton sac est vide... Rien à ranger pour l'instant.", W / 2, 120, { size: 9, align: 'center', color: '#c8f0ff' });
      for (let s = 0; s < 2; s++) {
        const x = 8 + s * 156;
        UI.box(c, x, 26, 148, 26, this.side === s ? 'dwsel' : 'dw');
        UI.text(c, s ? this.title : `SAC ${DW.bagUsed()}/${DW.bagSlots()} sortes`, x + 74, 43, { size: 9, align: 'center', color: '#ffe070' });
        UI.box(c, x, 56, 148, 122);
        if (top > 0) UI.text(c, '▲', x + 74, 62, { size: 7, align: 'center', color: '#8ae0f0' });
        if (top + ROWS < L.length) UI.text(c, '▼', x + 74, 177, { size: 7, align: 'center', color: '#8ae0f0' });
        L.slice(top, top + ROWS).forEach((id, j) => {
          const i = top + j, y = 64 + j * 22, n = (s ? bank : st.bag)[id] || 0;
          if (i === this.i && this.side === s) UI.box(c, x + 3, y - 2, 142, 21, 'dwsel');
          c.globalAlpha = n ? 1 : 0.4;
          c.drawImage(DW.Icons.item(id), x + 8, y);
          { const nf = UI.fit(c, DW.ITEMS[id].name, 92, 9); UI.text(c, nf.s, x + 28, y + 11, { size: nf.size, color: '#c8ffd0' }); }
          UI.text(c, String(n), x + 138, y + 11, { size: 10, align: 'right' });
          c.globalAlpha = 1;
        });
      }
      UI.box(c, 8, 182, W - 16, 52);
      UI.text(c, this.msgT > 0 ? this.msg : (this.side ? 'Reprendre dans le sac.' : 'Ranger ici.'), 16, 200, { size: 10, color: this.msgT > 0 ? '#7aff8a' : '#ffffff' });
      UI.hints(c, [['ok', '1 objet'], ['menu', 'tout'], ['back', 'sortir']], W - 16, 222);
      UI.text(c, '←/→ : sac ou ' + this.title.toLowerCase(), 16, 222, { size: 7, color: '#6ab8d0' });
    }
  }
  DW.BankScene = BankScene;

})();
