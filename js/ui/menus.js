'use strict';
// =====================================================================
//  MENUS : menu principal, équipe, résumé, sac, DigiDex, boutique, nom
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;

  const statusTag = (c, m, x, y) => {
    if (m.hp <= 0) return UI.tag(c, 'K.O.', x, y, '#a02030');
    if (m.status) return UI.tag(c, DW.STATUS_NAME[m.status], x, y, DW.STATUS_COL[m.status]);
    return 0;
  };

  // ------------------------------------------------------------ carte d'infos (choix du partenaire)
  class InfoCard extends DW.Scene {
    constructor(sp) { super(); this.overlay = true; this.sp = sp; }
    draw(c) {
      const d = DW.SPECIES[this.sp];
      UI.box(c, 40, 14, 240, 150);
      c.fillStyle = 'rgba(120,220,255,0.10)'; c.fillRect(48, 22, 92, 92);
      DW.Sprites.draw(c, DW.Sprites.battle(this.sp), 94, 112, { frame: Math.floor(this.t * 4) });
      UI.text(c, d.name, 148, 38, { size: 14, bold: true, color: '#d8f6ff' });
      UI.text(c, `Niveau : ${d.stage}`, 148, 52, { size: 9, color: '#8ae0f0' });
      UI.text(c, `Attribut : ${d.attr}`, 148, 64, { size: 9, color: '#8ae0f0' });
      let x = 148;
      d.types.forEach(t => { x += UI.typeTag(c, t, x, 70) + 3; });
      const evo = d.evo ? DW.SPECIES[d.evo.to].name : '?';
      UI.text(c, `Digivolue en : ${evo}`, 148, 96, { size: 9, color: '#8ae0f0' });
      UI.wrap(c, d.desc, 222, 9).slice(0, 3).forEach((l, i) =>
        UI.text(c, l, 50, 128 + i * 11, { size: 9, color: '#e0f8ff' }));
    }
  }
  DW.InfoCard = InfoCard;

  // ------------------------------------------------------------ menu principal (ENTRÉE ou Échap)
  class MenuScene extends DW.Scene {
    constructor() { super(); this.overlay = true; this.i = 0; }
    get items() {
      return [['digimon', 'DIGIMON'], ['evo', 'DIGIVOLUTION'], ['sac', 'OBJETS'], ['dex', 'DIGIDEX'], ['cartes', 'ALBUM'], ['journal', 'JOURNAL'], ['carte', 'CARTE'], ['dormir', 'DORMIR'],
        ['sauver', 'SAUVEGARDER'], ['options', 'OPTIONS'], ['titre', 'ÉCRAN TITRE'], ['retour', 'RETOUR']];
    }
    update() {
      const n = this.items.length;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back') || Input.hit('menu')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('ok')) { Audio.sfx('select'); this.act(this.items[this.i][0]); }
    }
    async act(k) {
      const st = DW.state;
      if (k === 'digimon') {
        if (!st.party.length) await DW.say("Tu n'as pas encore de partenaire Digimon !");
        else await Game.push(new PartyScene({ mode: 'view' }));
      } else if (k === 'evo') {
        if (!st.party.length) await DW.say("Tu n'as pas encore de partenaire Digimon !");
        else await Game.push(new DW.EvoTableScene(0));
      } else if (k === 'sac') await Game.push(new BagScene({}));
      else if (k === 'dex') await Game.push(new DexScene());
      else if (k === 'cartes') await Game.push(new DW.AlbumScene());
      else if (k === 'carte') await Game.push(new DW.WorldMapScene());
      else if (k === 'journal') await Game.push(new DW.Story.JournalScene());
      else if (k === 'dormir') {
        const m = DW.Care.lead();
        if (!m) { await DW.say("Tu n'as pas encore de partenaire."); return; }
        if (!DW.Life.sleepy(m) && m.tired < 60) { await DW.say(`${m.name} n'a pas sommeil. (Il a sommeil à partir de 21 h, ou quand il est fatigué.)`); return; }
        if ((await DW.ask(`Faire dormir ${m.name} ici jusqu'au matin ?`)) !== 0) return;
        this.close();
        await DW.Life.sleep(false);
        await DW.say(`Bonjour ! ${m.name} a bien dormi et se sent en forme.`);
      }
      else if (k === 'sauver') {
        const r = await DW.ask('Sauvegarder ta progression ?');
        if (r === 0) {
          const ok = DW.save();
          Audio.sfx('save');
          await DW.say(ok ? `${st.name} sauvegarde sa partie dans le Digivice !` : 'Erreur : impossible de sauvegarder.');
        }
      } else if (k === 'options') await Game.push(new OptionsScene());
      else if (k === 'titre') {
        const r = await DW.ask("Retourner à l'écran titre ?", ['Sauvegarder et quitter', 'Quitter sans sauvegarder', 'Annuler']);
        if (r === 2 || r < 0) return;
        if (r === 0) DW.save();
        await DW.fade(1, 0.4);
        Audio.stop();
        DW.ow = null;
        Game.replaceAll(new DW.TitleScene());
        DW.fade(0, 0.4);
      }
      else this.close();
    }
    draw(c) {
      const st = DW.state;
      // carte du joueur
      UI.box(c, 6, 6, 150, 62);
      UI.label(c, 'DIGISÉLECTIONNÉ', 12, 11);
      UI.text(c, st.name, 14, 34, { size: 12, color: '#ffe070' });
      UI.text(c, `${st.bits} Bits`, 148, 34, { size: 9, align: 'right' });
      const m = Math.floor(st.time / 60), h = Math.floor(m / 60);
      UI.text(c, `Temps de jeu  ${h}h${String(m % 60).padStart(2, '0')}`, 14, 47, { size: 8, color: '#8ae0f0' });
      UI.text(c, `DigiDex  ${Object.keys(st.owned).length} / ${DW.DEX_ORDER.length}`, 14, 59, { size: 8, color: '#8ae0f0' });
      const pt = st.party[0];
      if (pt) DW.Sprites.draw(c, DW.Sprites.ow(pt.sp), 130, 64, { frame: Math.floor(this.t * 2) });
      // zone + horloge
      UI.box(c, 6, 72, 150, 22);
      UI.text(c, DW.ow ? DW.ow.map.name : '', 12, 86, { size: 8 });
      DW.Time.drawClock(c, 6, 98);
      // liste
      const items = this.items, w = 118, x = W - w - 6, rowH = 16.5;
      UI.box(c, x, 6, w, items.length * rowH + 10);
      items.forEach(([ic, s], i) => {
        const y = 11 + i * rowH;
        if (i === this.i) UI.box(c, x + 4, y, w - 8, rowH - 2, 'dwsel');
        c.drawImage(DW.Icons.menu(ic), x + 8, y + 1);
        UI.text(c, s, x + 28, y + 12, { size: 9, color: i === this.i ? '#ffffff' : '#bfeaf6' });
      });
    }
  }
  DW.MenuScene = MenuScene;

  // ------------------------------------------------------------ options
  class OptionsScene extends DW.Scene {
    constructor() { super(); this.overlay = true; this.i = 0; }
    update() {
      const O = DW.Options;
      const n = this.rows().length;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      const d = Input.hit('left') ? -1 : Input.hit('right') || Input.hit('ok') ? 1 : 0;
      if (d) {
        if (this.i === 0) O.textSpeed = (O.textSpeed + d + O.SPEEDS.length) % O.SPEEDS.length;
        else if (this.i === 1) Audio.toggleMute();
        else if (this.i === 2) O.battleMode ^= 1;
        else if (this.i === 3) DW.state.flags.autoEvo = !DW.state.flags.autoEvo;
        else { DW.state.flags.solo = !DW.state.flags.solo; this.moved = DW.applyPartyMax(); }
        Audio.sfx('move'); O.save();
      }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); }
    }
    // les deux dernières lignes sont des règles de la partie en cours (enregistrées dans la sauvegarde)
    rows() {
      const O = DW.Options, f = DW.state.flags, r = [['Vitesse du texte', O.SPEEDS[O.textSpeed].name], ['Son', Audio.muted ? 'Coupé' : 'Activé'], ['Combat', O.battleMode ? 'Ordres (DW1)' : 'Manuel']];
      if (f.starter) r.push(['Digivolution', f.autoEvo ? "Selon l'âge (DW1)" : 'Au choix'], ['Équipe', f.solo ? '1 partenaire (DW1)' : '6 Digimon']);
      return r;
    }
    draw(c) {
      const x = 40, rows = this.rows(), y = 60 - (rows.length - 3) * 10;
      UI.box(c, x, y, 240, 116 + (rows.length - 3) * 20);
      UI.label(c, 'OPTIONS', x + 6, y + 5);
      rows.forEach(([k, v], j) => {
        const yy = y + 32 + j * 20;
        if (j === this.i) UI.box(c, x + 6, yy - 12, 228, 17, 'dwsel');
        UI.text(c, k, x + 14, yy, { size: 10 });
        UI.text(c, '◀  ' + v + '  ▶', x + 226, yy, { size: 10, align: 'right', color: '#ffe070' });
      });
      const tip = this.i === 2 ? 'Ordres : ton Digimon se bat tout seul, comme dans Digimon World. Appuie sur ESPACE pendant le combat pour lui donner un ordre.'
        : this.i === 3 ? "Selon l'âge : ton Digimon digivolue tout seul en grandissant, vers la meilleure forme dont il remplit les conditions."
        : this.i === 4 ? (this.moved ? `${this.moved} Digimon envoyé(s) à la DigiFerme.` : "1 partenaire : les autres Digimon attendent à la DigiFerme (Jardin de Yokomon).")
        : 'Astuce : maintiens Maj (ou ESPACE) pour faire défiler les dialogues en accéléré.';
      const ty = y + 36 + rows.length * 20;
      UI.wrap(c, tip, 220, 8).forEach((l, j) => UI.text(c, l, x + 12, ty + j * 10, { size: 8, color: '#8ae0f0' }));
    }
  }
  DW.OptionsScene = OptionsScene;

  // ------------------------------------------------------------ équipe
  class PartyScene extends DW.Scene {
    constructor(o = {}) { super(); this.o = o; this.i = o.activeIdx || 0; this.swap = -1; }
    get party() { return DW.state.party; }
    update() {
      const n = this.party.length;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back')) {
        if (this.o.forced) return;
        Audio.sfx('back');
        if (this.swap >= 0) { this.swap = -1; return; }
        this.close(-1); return;
      }
      if (Input.hit('ok')) { Audio.sfx('select'); this.handle(); }
    }
    async handle() {
      const m = this.party[this.i], o = this.o;
      if (this.swap >= 0) {
        const p = this.party;
        [p[this.swap], p[this.i]] = [p[this.i], p[this.swap]];
        this.swap = -1; return;
      }
      if (o.mode === 'select') { this.close(this.i); return; }
      if (o.mode === 'switch') {
        if (m.hp <= 0) { await DW.say(`${m.name} est K.O. et ne peut pas se battre !`); return; }
        if (this.i === o.activeIdx) { await DW.say(`${m.name} est déjà au combat !`); return; }
        const r = await DW.choose(['ENVOYER', 'RÉSUMÉ', 'RETOUR'], { x: 212, y: 150, w: 100 });
        if (r === 0) this.close(this.i);
        else if (r === 1) await Game.push(new DW.SummaryScene(this.i));
        return;
      }
      const r = await DW.choose(['RÉSUMÉ', 'DÉPLACER', 'RETOUR'], { x: 212, y: 150, w: 100 });
      if (r === 0) await Game.push(new DW.SummaryScene(this.i));
      else if (r === 1) this.swap = this.i;
    }
    draw(c) {
      UI.menuBg(c, this.t, this.o.title || 'DIGIMON');
      this.party.forEach((m, i) => {
        const y = 26 + i * 33, sel = i === this.i;
        UI.box(c, 8, y, 304, 30, this.swap === i ? 'orange' : sel ? 'dwsel' : 'dw');
        const spr = DW.Sprites.ow(m.sp);
        const bob = sel ? Math.round(Math.sin(this.t * 8)) : 0;
        DW.Sprites.draw(c, spr, 28, y + 26 + bob, { silhouette: false, alpha: m.hp > 0 ? 1 : 0.5 });
        UI.text(c, m.name, 48, y + 13, { size: 10, bold: true });
        UI.text(c, `N.${m.level}`, 48, y + 25, { size: 9, color: '#ffd860' });
        statusTag(c, m, 74, y + 17);
        UI.text(c, 'PV', 150, y + 13, { size: 8, color: '#ffd860', bold: true });
        const r = m.hp / m.maxHp;
        UI.bar(c, 166, y + 7, 100, 5, r, UI.hpColor(r));
        UI.text(c, `${m.hp} / ${m.maxHp}`, 266, y + 25, { size: 9, align: 'right' });
        UI.text(c, m.d.stage, 300, y + 13, { size: 7, align: 'right', color: '#9ab0e8' });
        if (sel) UI.cursor(c, 2, y + 15, this.t);
      });
      const hint = this.swap >= 0 ? 'Choisis la nouvelle place.' : this.o.forced ? 'Choisis le Digimon à envoyer.' : 'ESPACE : choisir   ÉCHAP : retour';
      UI.text(c, hint, W / 2, 234, { size: 8, align: 'center', color: '#9ab0e8' });
    }
  }
  DW.PartyScene = PartyScene;

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
      const t = await Game.push(new PartyScene({ mode: 'select', title: it.name.toUpperCase() }));
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
  class BankScene extends DW.Scene {
    constructor() { super(); this.i = 0; this.side = 0; }
    move(id, all) {
      const st = DW.state; st.bank = st.bank || {};
      const from = this.side ? st.bank : st.bag, have = from[id] || 0;
      let n = all ? have : Math.min(1, have);
      if (!this.side) { st.bank[id] = (st.bank[id] || 0) + n; st.bag[id] = have - n; }
      else {
        n = Math.min(n, DW.bagRoom(id));
        if (!n && have) { Audio.sfx('bump'); this.msg = 'Ton sac est plein pour cet objet !'; this.msgT = 2; return; }
        st.bag[id] = (st.bag[id] || 0) + n;
        st.bank[id] = have - n;
      }
      if (n) { Audio.sfx('buy'); this.msg = `${DW.ITEMS[id].name} x${n} ${this.side ? 'retiré' : 'déposé'}${n > 1 ? 's' : ''}`; this.msgT = 1.6; } else Audio.sfx('bump');
    }
    update() {
      const n = DW.ITEM_ORDER.length;
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('left') || Input.hit('right')) { this.side ^= 1; Audio.sfx('move'); }
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('ok')) this.move(DW.ITEM_ORDER[this.i], false);
      if (Input.hit('menu')) this.move(DW.ITEM_ORDER[this.i], true);
    }
    tick(dt) { if (this.msgT > 0) this.msgT -= dt; }
    draw(c) {
      const st = DW.state, bank = st.bank || {}, L = DW.ITEM_ORDER, ROWS = 5;
      // liste défilante : 5 objets visibles autour du curseur
      const top = DW.clamp(this.i - 2, 0, Math.max(0, L.length - ROWS));
      UI.menuBg(c, this.t, 'BANQUE');
      for (let s = 0; s < 2; s++) {
        const x = 8 + s * 156;
        UI.box(c, x, 26, 148, 26, this.side === s ? 'dwsel' : 'dw');
        UI.text(c, s ? 'BANQUE' : `SAC (${DW.BAG_MAX} max)`, x + 74, 43, { size: 9, align: 'center', color: '#ffe070' });
        UI.box(c, x, 56, 148, 122);
        if (top > 0) UI.text(c, '▲', x + 74, 62, { size: 7, align: 'center', color: '#8ae0f0' });
        if (top + ROWS < L.length) UI.text(c, '▼', x + 74, 177, { size: 7, align: 'center', color: '#8ae0f0' });
        L.slice(top, top + ROWS).forEach((id, j) => {
          const i = top + j, y = 64 + j * 22, n = (s ? bank : st.bag)[id] || 0;
          if (i === this.i && this.side === s) UI.box(c, x + 3, y - 2, 142, 21, 'dwsel');
          c.globalAlpha = n ? 1 : 0.4;
          c.drawImage(DW.Icons.item(id), x + 8, y);
          UI.text(c, DW.ITEMS[id].name, x + 28, y + 11, { size: 9, color: '#c8ffd0' });
          UI.text(c, String(n), x + 138, y + 11, { size: 10, align: 'right' });
          c.globalAlpha = 1;
        });
      }
      UI.box(c, 8, 182, W - 16, 52);
      UI.text(c, this.msgT > 0 ? this.msg : (this.side ? 'Retirer vers le sac.' : 'Déposer à la banque.'), 16, 200, { size: 10, color: this.msgT > 0 ? '#7aff8a' : '#ffffff' });
      UI.text(c, 'ESPACE : 1 objet   ENTRÉE : tout   ←/→ : sac ou banque   ÉCHAP : sortir', 16, 222, { size: 7, color: '#6ab8d0' });
    }
  }
  DW.BankScene = BankScene;

  // ------------------------------------------------------------ DigiDex
  class DexScene extends DW.Scene {
    constructor() { super(); this.i = 0; this.scroll = 0; }
    update() {
      const n = DW.DEX_ORDER.length;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back') || Input.hit('ok')) { Audio.sfx('back'); this.close(); }
      if (this.i < this.scroll) this.scroll = this.i;
      if (this.i > this.scroll + 11) this.scroll = this.i - 11;
    }
    draw(c) {
      const st = DW.state;
      UI.menuBg(c, this.t, 'DIGIDEX');
      UI.text(c, `Vus : ${Object.keys(st.seen).length}   Obtenus : ${Object.keys(st.owned).length}`, 312, 17, { size: 9, align: 'right', color: '#9ab0e8' });
      UI.box(c, 8, 26, 130, 208);
      for (let k = 0; k < 12; k++) {
        const idx = this.scroll + k, sp = DW.DEX_ORDER[idx];
        if (!sp) break;
        const y = 42 + k * 16, seen = st.seen[sp];
        UI.text(c, String(idx + 1).padStart(3, '0'), 24, y, { size: 8, color: '#9ab0e8' });
        UI.text(c, seen ? DW.SPECIES[sp].name : '- - - - -', 46, y, { size: 10, color: seen ? '#fff' : '#6a7aa8' });
        if (st.owned[sp]) { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(128, y - 3.5, 2.5, 0, 7); c.fill(); }
      }
      UI.cursor(c, 13, 38.5 + (this.i - this.scroll) * 16, this.t);
      const sp = DW.DEX_ORDER[this.i], d = DW.SPECIES[sp];
      UI.box(c, 144, 26, 168, 208);
      c.fillStyle = 'rgba(120,220,255,0.08)'; c.fillRect(152, 34, 152, 100);
      if (st.seen[sp]) {
        const spr = DW.Sprites.battle(sp);
        DW.Sprites.draw(c, spr, 228, 132, { frame: Math.floor(this.t * 4) });
        UI.text(c, d.name, 152, 148, { size: 12, bold: true, color: '#d8f6ff' });
        let x = 152;
        d.types.forEach(t => { x += UI.typeTag(c, t, x, 153) + 3; });
        UI.tag(c, d.attr.toUpperCase(), x + 2, 153, '#4a5a90');
        UI.text(c, d.stage, 304, 148, { size: 8, align: 'right', color: '#d8f6ff' });
        const txt = st.owned[sp] ? d.desc : 'Obtiens ce Digimon (DigiŒuf, Digivolution) pour en savoir plus.';
        UI.wrap(c, txt, 152, 9).slice(0, 6).forEach((l, i) => UI.text(c, l, 152, 178 + i * 10.5, { size: 9, color: '#e0f8ff' }));
      } else {
        UI.text(c, '???', 228, 90, { size: 20, align: 'center', bold: true, color: '#8a94c0', shadow: false });
      }
    }
  }
  DW.DexScene = DexScene;

  // ------------------------------------------------------------ boutique
  class ShopScene extends DW.Scene {
    constructor(stock) { super(); this.stock = stock; this.i = 0; this.qty = 0; }
    update() {
      const st = DW.state;
      if (this.qty > 0) {
        const it = DW.ITEMS[this.stock[this.i]], max = Math.max(1, Math.min(DW.bagRoom(this.stock[this.i]), Math.floor(st.bits / it.price)));
        if (Input.hit('up') || Input.hit('right')) { this.qty = this.qty >= max ? 1 : this.qty + 1; Audio.sfx('move'); }
        if (Input.hit('down') || Input.hit('left')) { this.qty = this.qty <= 1 ? max : this.qty - 1; Audio.sfx('move'); }
        if (Input.hit('back')) { this.qty = 0; Audio.sfx('back'); }
        if (Input.hit('ok')) {
          const cost = it.price * this.qty;
          if (cost > st.bits) { Audio.sfx('bump'); this.qty = 0; return; }
          st.bits -= cost; DW.giveItem(this.stock[this.i], this.qty);
          Audio.sfx('buy'); this.msg = `Merci ! ${it.name} x${this.qty}`; this.msgT = 2; this.qty = 0;
        }
        return;
      }
      const n = this.stock.length + 1;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('ok')) {
        if (this.i >= this.stock.length) { Audio.sfx('back'); this.close(); return; }
        const it = DW.ITEMS[this.stock[this.i]];
        if (st.bits < it.price) { Audio.sfx('bump'); this.msg = "Tu n'as pas assez de Bits !"; this.msgT = 2; return; }
        if (!DW.bagRoom(this.stock[this.i])) { Audio.sfx('bump'); this.msg = `Sac plein (${DW.BAG_MAX} max) !`; this.msgT = 2; return; }
        Audio.sfx('select'); this.qty = 1;
      }
    }
    tick(dt) { if (this.msgT > 0) this.msgT -= dt; }
    draw(c) {
      const st = DW.state;
      UI.menuBg(c, this.t, 'BOUTIQUE');
      UI.box(c, 8, 26, 210, 150);
      this.stock.forEach((id, i) => {
        const it = DW.ITEMS[id];
        UI.text(c, it.name, 26, 44 + i * 16, { size: 10 });
        UI.text(c, `${it.price} B`, 208, 44 + i * 16, { size: 10, align: 'right', color: '#ffd860' });
      });
      UI.text(c, 'QUITTER', 26, 44 + this.stock.length * 16, { size: 10, color: '#9ab0e8' });
      UI.cursor(c, 15, 40.5 + this.i * 16, this.t);
      UI.box(c, 224, 26, 88, 56);
      UI.text(c, 'Bits', 232, 42, { size: 9, color: '#9ab0e8' });
      UI.text(c, String(st.bits), 304, 56, { size: 11, align: 'right', bold: true, color: '#ffd860' });
      const id = this.stock[this.i];
      if (id) UI.text(c, `Possédé : ${st.bag[id] || 0}`, 232, 74, { size: 8, color: '#9ab0e8' });
      if (this.qty > 0) {
        const it = DW.ITEMS[id];
        UI.box(c, 224, 90, 88, 48, 'orange');
        UI.text(c, `x ${this.qty}`, 268, 108, { size: 12, align: 'center', bold: true });
        UI.text(c, `${it.price * this.qty} B`, 268, 128, { size: 10, align: 'center' });
      }
      UI.box(c, 8, 180, 304, 54);
      const txt = this.msgT > 0 ? this.msg : this.qty > 0 ? 'Combien ? (Haut/Bas puis ESPACE)' : id ? DW.ITEMS[id].desc : 'À bientôt !';
      UI.wrap(c, txt, 286, 10).forEach((l, i) => UI.text(c, l, 18, 198 + i * 14));
    }
  }
  DW.ShopScene = ShopScene;

  // ------------------------------------------------------------ saisie du nom
  class NameScene extends DW.Scene {
    constructor(def) { super(); this.name = ''; this.def = def || 'Tai'; }
    enter() { Input.textMode = true; }
    update() {
      for (const k of Input.typed) {
        if (k === 'Enter') {
          Input.textMode = false;
          Audio.sfx('select');
          this.close(this.name.trim() || this.def);
          return;
        }
        if (k === 'Backspace') this.name = this.name.slice(0, -1);
        else if (this.name.length < 10 && /^[\p{L}\p{N} '\-]$/u.test(k)) { this.name += k; Audio.sfx('text'); }
      }
    }
    draw(c) {
      UI.menuBg(c, this.t);
      UI.box(c, 40, 60, 240, 100);
      UI.text(c, 'Comment t\'appelles-tu ?', 160, 84, { size: 12, align: 'center', bold: true });
      UI.box(c, 70, 96, 180, 24, 'dark');
      const caret = Math.floor(this.t * 2) % 2 ? '_' : ' ';
      UI.text(c, this.name + caret, 160, 113, { size: 13, align: 'center', color: '#ffd860' });
      UI.text(c, DW.Touch && DW.Touch.on ? 'Touche le champ pour écrire, puis OK' : 'Tape ton nom au clavier puis ENTRÉE', 160, 140, { size: 8, align: 'center', color: '#9ab0e8' });
      UI.text(c, `(vide = "${this.def}")`, 160, 151, { size: 8, align: 'center', color: '#6a7aa8' });
    }
  }
  DW.NameScene = NameScene;
})();
