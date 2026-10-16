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

  // ------------------------------------------------------------ menu principal : le Digivice (ENTRÉE ou Échap)
  // Un anneau d'icônes hexagonales qui tourne : l'entrée choisie vient à gauche, son nom s'affiche en bandeau.
  // À droite, les fiches de l'équipe ; en bas, les Bits et l'aide. Haut/Bas ou Gauche/Droite : tourner l'anneau.
  const RING = {   // [clé, nom, couleur de l'hexagone, aide]
    digimon: ['Digimon', '#e8a030', 'Fiche de ton partenaire : statut, techniques, Digivolution (gauche / droite).'],
    feliciter: ['Féliciter', '#e85a8a', 'Féliciter ton partenaire : parfait juste après un exploit (bonheur).'],
    gronder: ['Gronder', '#c84a3a', 'Gronder ton partenaire : utile juste après une bêtise (discipline).'],
    sac: ['Objets', '#c8783a', 'Ton sac : nourriture, remèdes, objets de combat...'],
    dex: ['DigiDex', '#d84a4a', 'Tous les Digimon que tu as rencontrés ou élevés.'],
    cartes: ['Album', '#4a7ad8', 'Ta collection de cartes Digimon.'],
    journal: ['Journal', '#e8c840', 'Ton enquête : ce que tu as découvert sur l\'île.'],
    carte: ['Carte', '#5ab8a8', 'La carte de l\'Île des Fichiers et des lieux visités.'],
    dormir: ['Dormir', '#7a5ad8', 'Faire dormir ton partenaire jusqu\'à son réveil (seulement quand il a sommeil).'],
    systeme: ['Système', '#5a6a8a', 'Sauvegarder, options, supprimer une partie, écran titre.'],
  };
  // supprimer une partie (un des 3 emplacements) : double confirmation
  async function deleteSave() {
    const slots = [1, 2, 3].map(n => [n, DW.saveInfo(n)]).filter(([, i]) => i);
    if (!slots.length) { await DW.say('Aucune partie sauvegardée.'); return; }
    const k = await DW.choose(slots.map(([n, i]) => `Partie ${n} : ${i.name}, jour ${i.day}${n === DW.slot ? ' (en cours)' : ''}`).concat(['Annuler']));
    if (k < 0 || k >= slots.length) return;
    const [n, info] = slots[k];
    if ((await DW.ask(`Supprimer la partie ${n} (${info.name}) ? Elle sera perdue pour toujours !`, ['Non', 'Oui, supprimer'])) !== 1) return;
    if ((await DW.ask('Vraiment ? Cette action est définitive.', ['Non', 'Oui, j\'en suis sûr'])) !== 1) return;
    DW.deleteSave(n);
    Audio.sfx('bump');
    await DW.say(n === DW.slot ? `Partie ${n} supprimée. (Ta partie en cours continue : sauvegarde-la si tu veux la garder.)` : `Partie ${n} supprimée.`);
  }
  class MenuScene extends DW.Scene {
    constructor() { super(); this.overlay = true; this.i = 0; this.rot = 0; }
    get items() { return Object.keys(RING).map(k => [k, RING[k][0]]); }
    update(dt) {
      const n = this.items.length;
      const d = Input.hit('up') || Input.hit('left') ? -1 : Input.hit('down') || Input.hit('right') ? 1 : 0;
      if (d) { this.i = (this.i + d + n) % n; Audio.sfx('move'); }
      // l'anneau rattrape doucement la sélection (le plus court chemin)
      let diff = this.i - this.rot; diff = ((diff % n) + n * 1.5) % n - n / 2;
      this.rot += diff * Math.min(1, (dt || 0.016) * 12);
      if (Input.hit('back') || Input.hit('menu')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('ok')) { Audio.sfx('select'); this.act(this.items[this.i][0]); }
    }
    async act(k) {
      const st = DW.state;
      if (k === 'digimon') {
        if (!st.party.length) await DW.say("Tu n'as pas encore de partenaire Digimon !");
        else if (st.party.length === 1) await Game.push(new DW.SummaryScene(0));   // un seul Digimon : directement sa fiche
        else await Game.push(new PartyScene({ mode: 'view' }));
      } else if (k === 'feliciter' || k === 'gronder') {
        if (!st.party.length) { await DW.say("Tu n'as pas encore de partenaire Digimon !"); return; }
        this.close();
        await DW.Life.educate(k === 'feliciter');
      } else if (k === 'systeme') {
        const r = await DW.ask('Système du Digivice :', ['Sauvegarder', 'Options', 'Supprimer une partie', 'Écran titre', 'Retour']);
        if (r === 0) await this.act('sauver');
        else if (r === 1) await this.act('options');
        else if (r === 2) await deleteSave();
        else if (r === 3) await this.act('titre');
      } else if (k === 'sac') await Game.push(new BagScene({}));
      else if (k === 'dex') await Game.push(new DexScene());
      else if (k === 'cartes') await Game.push(new DW.AlbumScene());
      else if (k === 'carte') await Game.push(new DW.WorldMapScene());
      else if (k === 'journal') await Game.push(new DW.Story.JournalScene());
      else if (k === 'dormir') {
        const m = DW.Care.lead();
        if (!m) { await DW.say("Tu n'as pas encore de partenaire."); return; }
        if (!DW.Life.sleepy(m)) { const S = DW.Life.sched(m); await DW.say(`${m.name} n'a pas sommeil (il se couche vers ${S.bed} h). Il peut se reposer une heure chez Jijimon, ou dans sa chambre.`); return; }
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
    // le Digivice : anneau d'icônes, fiches de l'équipe, Bits, aide
    draw(c) {
      const st = DW.state, t = this.t, items = this.items, n = items.length, look = DW.heroLook();
      // fond bleu nuit, quadrillage de circuits, bandes lumineuses
      const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#062a5a'); g.addColorStop(0.55, '#0a1c44'); g.addColorStop(1, '#04102a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(80,180,255,0.10)'; c.lineWidth = 0.6;
      for (let x = (t * 8) % 16; x < W; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0; y < H; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.fillStyle = 'rgba(255,210,80,0.5)'; c.fillRect(0, 64, W, 1); c.fillRect(0, 170, W, 1);
      // --- l'anneau (à gauche)
      const cx = 86, cy = 118, R = 70;
      const rg = c.createRadialGradient(cx, cy, 10, cx, cy, R + 16); rg.addColorStop(0, '#2a5aa8'); rg.addColorStop(0.6, '#123a78'); rg.addColorStop(1, 'rgba(10,30,70,0)');
      c.fillStyle = rg; c.beginPath(); c.arc(cx, cy, R + 16, 0, 7); c.fill();
      c.strokeStyle = '#8ad0ff'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R + 12, 0, 7); c.stroke();
      c.strokeStyle = 'rgba(160,220,255,0.5)'; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R - 14, 0, 7); c.stroke();
      for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2 + t * 0.2; c.fillStyle = k % 4 ? 'rgba(160,220,255,0.35)' : '#cfeaff'; c.fillRect(cx + Math.cos(a) * (R + 7) - 0.5, cy + Math.sin(a) * (R + 7) - 0.5, 1.4, 1.4); }
      // centre : l'écusson du héros
      c.fillStyle = '#0a2a5a'; c.beginPath(); c.arc(cx, cy, 26, 0, 7); c.fill();
      c.strokeStyle = '#cfeaff'; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, 26, 0, 7); c.stroke();
      const ci = DW.Crests ? DW.Crests.ORDER.indexOf(st.hero) : -1;
      if (ci >= 0) { const cr = DW.World.obj('crest', ci); c.drawImage(cr.img, cx - 8, cy - 30, 16, 19); }   // au-dessus du bandeau
      // les hexagones : l'entrée choisie est à gauche (angle π)
      const hex = (x, y, r, col, on) => {
        c.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath();
        const hg = c.createLinearGradient(x, y - r, x, y + r); hg.addColorStop(0, col); hg.addColorStop(1, '#1a1a2a');
        c.fillStyle = hg; c.fill(); c.lineWidth = on ? 2 : 1.4; c.strokeStyle = on ? '#ffffff' : '#cfe0f0'; c.stroke();
      };
      // bandeau du choix (au travers de l'anneau, comme dans le modèle) : dessiné AVANT les icônes, qui restent toutes visibles
      const [label, col, help] = RING[items[this.i][0]];
      const by = cy - 8;
      c.fillStyle = 'rgba(10,40,90,0.9)'; c.beginPath(); c.moveTo(cx - R + 16, by); c.lineTo(cx + R - 10, by); c.lineTo(cx + R - 18, by + 16); c.lineTo(cx - R + 16, by + 16); c.fill();
      c.strokeStyle = '#8ad0ff'; c.lineWidth = 1; c.stroke();
      UI.text(c, label, cx + 2, by + 12, { size: 11, align: 'center', color: '#ffffff' });
      // l'entrée suivante est en dessous de la sélection : Bas descend le long de l'anneau
      items.forEach(([k], i) => {
        const a = Math.PI - (i - this.rot) / n * Math.PI * 2, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, on = i === this.i;
        const r = on ? 14 + Math.sin(t * 6) * 0.6 : 11;
        if (on) { c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(x, y, 4, x, y, 24); gg.addColorStop(0, RING[k][1] + 'aa'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - 24, y - 24, 48, 48); c.restore(); }   // halo de la sélection
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(x + 1.5, y + 2, r, 0, 7); c.fill();   // ombre portée
        hex(x, y, r, RING[k][1], on);
        const ic = DW.Icons.menu(k), z = on ? 17 : 12; c.drawImage(ic, x - z / 2, y - z / 2, z, z);
      });
      // titre « Digivice »
      c.fillStyle = 'rgba(10,40,90,0.9)'; c.beginPath(); c.moveTo(0, 4); c.lineTo(98, 4); c.lineTo(88, 22); c.lineTo(0, 22); c.fill();
      c.strokeStyle = '#8ad0ff'; c.stroke();
      UI.text(c, 'Digivice', 8, 18, { size: 12, color: '#ffffff' });
      // --- la fiche du partenaire (à droite) : un seul Digimon à la fois
      const px = 178, pw = W - px - 6, m = st.party[0];
      c.fillStyle = 'rgba(10,40,90,0.9)'; c.beginPath(); c.moveTo(px + 10, 6); c.lineTo(W - 6, 6); c.lineTo(W - 16, 22); c.lineTo(px, 22); c.fill(); c.strokeStyle = '#8ad0ff'; c.stroke();
      UI.text(c, 'Partenaire', px + pw / 2, 18, { size: 9, align: 'center', color: '#ffffff' });
      { const y = 30, h = 168;
        const cg = c.createLinearGradient(px, y, px, y + h); cg.addColorStop(0, 'rgba(225,242,255,0.96)'); cg.addColorStop(1, 'rgba(150,200,240,0.92)');
        c.fillStyle = cg; c.beginPath(); c.moveTo(px, y); c.lineTo(px + pw - 10, y); c.lineTo(px + pw, y + 10); c.lineTo(px + pw, y + h); c.lineTo(px + 10, y + h); c.lineTo(px, y + h - 10); c.closePath(); c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.stroke();
        if (!m) UI.text(c, "Pas encore de partenaire.", px + pw / 2, y + 80, { size: 8, align: 'center', color: '#3a5a7a', shadow: false });
        else {
          const d = m.d, dark = '#0a2a5a';
          // portrait sur un disque lumineux
          const dg = c.createRadialGradient(px + 38, y + 44, 4, px + 38, y + 44, 34); dg.addColorStop(0, 'rgba(255,255,255,0.95)'); dg.addColorStop(1, 'rgba(160,210,250,0)');
          c.fillStyle = dg; c.beginPath(); c.arc(px + 38, y + 44, 34, 0, 7); c.fill();
          const sp = DW.Sprites.battle(m.sp); DW.Sprites.draw(c, sp, px + 38, y + 72, { frame: Math.floor(t * 4), scale: Math.min(1, 56 / sp.h, 60 / sp.w) });
          const nf = UI.fit(c, m.name, pw - 82, 10); UI.text(c, nf.s, px + 78, y + 16, { size: nf.size, color: dark, shadow: false });
          UI.text(c, d.stage, px + 78, y + 28, { size: 7, color: '#3a6a9a', shadow: false });
          UI.text(c, `N.${m.level}`, px + pw - 8, y + 28, { size: 9, align: 'right', color: dark, shadow: false });
          let tx = px + 78; d.types.forEach(tp => { tx += UI.typeTag(c, tp, tx, y + 34, 6) + 2; });
          const bar = (yy, lab, v, max, col2, txt) => {
            UI.text(c, lab, px + 8, yy + 3, { size: 7, color: dark, shadow: false });
            c.fillStyle = '#0a1a30'; c.fillRect(px + 52, yy - 2, pw - 60, 5); c.fillStyle = col2; c.fillRect(px + 52, yy - 2, (pw - 60) * Math.max(0, Math.min(1, v / max)), 5);
            if (txt) UI.text(c, txt, px + pw - 8, yy - 4, { size: 6, align: 'right', color: dark, shadow: false });
          };
          bar(y + 88, 'PV', m.hp, m.maxHp, UI.hpColor(m.hp / m.maxHp), `${m.hp} / ${m.maxHp}`);
          bar(y + 104, 'PM', m.mp, m.maxMp, '#4a8aff', `${m.mp} / ${m.maxMp}`);
          bar(y + 120, 'Bonheur', m.happy, 100, '#ff6ab0');
          bar(y + 134, 'Faim', Math.round(m.hunger || 0), 100, (m.hunger || 0) >= 70 ? '#ff5a5a' : '#f0b040');
          const hl = DW.Life ? DW.Life.healthLabel(m) : '';
          UI.text(c, `Santé : ${hl}`, px + 8, y + 154, { size: 7, color: m.sick || (m.germs || 0) >= 80 ? '#c83a3a' : '#2a7a4a', shadow: false });
          if (DW.Life) UI.text(c, `Âge : ${m.age} j`, px + pw - 8, y + 154, { size: 7, align: 'right', color: dark, shadow: false });
        }
      }
      // --- Bits (porte-monnaie) et ligne d'aide
      c.fillStyle = 'rgba(10,40,90,0.95)'; c.fillRect(0, 206, 172, 14); c.strokeStyle = '#ffd040'; c.lineWidth = 1; c.strokeRect(0.5, 206.5, 171, 13);
      UI.text(c, 'BITS', 6, 216, { size: 8, color: '#ffd040' });
      UI.text(c, `${st.bits}`, 164, 216, { size: 9, align: 'right', color: '#ffffff' });
      c.fillStyle = 'rgba(4,16,40,0.95)'; c.fillRect(0, 224, W, 16);
      const hf = UI.fit(c, help, 196, 7); UI.text(c, hf.s, 6, 235, { size: hf.size, color: '#cfeaff' });
      UI.hints(c, [['ok', 'OK'], ['back', 'Retour']], W - 6, 235);
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
        else O.classic = !O.classic;
        Audio.sfx('move'); O.save();
      }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); }
    }
    rows() { const O = DW.Options; return [['Vitesse du texte', O.SPEEDS[O.textSpeed].name], ['Son', Audio.muted ? 'Coupé' : 'Activé'], ['Combats', O.classic ? 'Tour par tour' : 'Arène']]; }
    draw(c) {
      const x = 40, rows = this.rows(), y = 70;
      UI.box(c, x, y, 240, 76 + rows.length * 20);
      UI.label(c, 'OPTIONS', x + 6, y + 5);
      rows.forEach(([k, v], j) => {
        const yy = y + 32 + j * 20;
        if (j === this.i) UI.box(c, x + 6, yy - 12, 228, 17, 'dwsel');
        UI.text(c, k, x + 14, yy, { size: 10 });
        UI.text(c, '◀  ' + v + '  ▶', x + 226, yy, { size: 10, align: 'right', color: '#ffe070' });
      });
      const tip = 'Astuce : maintiens Maj (ou ESPACE) pour faire défiler les dialogues en accéléré.';
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
      if (['home', 'potty', 'bell', 'none', 'passive'].includes(it.use)) {
        if (it.use === 'none' || it.use === 'passive') { await DW.say(it.desc); return; }
        if (this.o.battle) { await DW.say("Ça ne sert à rien en plein combat !"); return; }
        if (it.use === 'bell') { st.bag[id]--; st.bellUntil = st.clock + 120; st.repelUntil = 0; await DW.say('Ding ding ! Tous les Digimon sauvages des environs accourent...'); }
        if (it.use === 'potty') { if (!DW.Care || !st.party.length) return; st.bag[id]--; this.close(null); await DW.Care.toilet(); return; }
        if (it.use === 'home') { st.bag[id]--; this.close(null); DW.Audio.sfx('swoosh'); await DW.fade(1, 0.5, '#ffffff'); DW.ow.load('village', 20, 16, 'down'); await DW.fade(0, 0.5); await DW.say('Le Pilote automatique te ramène à la Ville des Fichiers !'); return; }
        this.i = DW.clamp(this.i, 0, Math.max(0, this.list.length - 1)); return;
      }
      if (it.use === 'evo') {
        if (this.o.battle) { await DW.say("Ce n'est pas le moment !"); return; }
        const t = await Game.push(new PartyScene({ mode: 'select', title: it.name.toUpperCase() }));
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
  // seuls les objets que tu possèdes (dans le sac ou ici) apparaissent : rien n'est dévoilé à l'avance
  class BankScene extends DW.Scene {
    // o.store : 'bank' (coffre, Banque : tout SAUF la nourriture) ou 'fridge' (frigo : la nourriture seulement, 20 de chaque)
    constructor(o = {}) { super(); this.i = 0; this.side = 0; this.title = o.title || 'BANQUE'; this.store = o.store || 'bank'; }
    get box() { const st = DW.state; return (st[this.store] = st[this.store] || {}); }
    accepts(id) { return this.store === 'fridge' ? DW.isFood(id) : !DW.isFood(id); }
    get list() { const st = DW.state, bank = this.box; return DW.ITEM_ORDER.filter(id => (bank[id] || 0) > 0 || ((st.bag[id] || 0) > 0 && this.accepts(id))); }
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
    // stock : liste d'objets, ou nom de boutique (DW.SHOPS, stock selon le niveau de la ville)
    constructor(stock) { super(); this.src = stock; this.i = 0; this.qty = 0; this.sell = false; this.top = 0; }
    get stock() { return this.sell ? DW.ITEM_ORDER.filter(id => (DW.state.bag[id] || 0) > 0) : typeof this.src === 'string' ? DW.shopStock(this.src) : this.src; }
    price(id) { const it = DW.ITEMS[id]; return this.sell ? (it.sell || Math.floor(it.price / 2)) : Math.ceil(it.price * (DW.Collab ? DW.Collab.priceMult() : 1)); }   // (Comptoir du Bazar : -15 %)
    update() {
      const st = DW.state, L = this.stock;
      if (this.qty > 0) {
        const id = L[this.i], it = DW.ITEMS[id];
        const max = this.sell ? st.bag[id] || 0 : Math.max(1, Math.min(DW.bagRoom(id), Math.floor(st.bits / this.price(id))));
        if (Input.hit('up') || Input.hit('right')) { this.qty = this.qty >= max ? 1 : this.qty + 1; Audio.sfx('move'); }
        if (Input.hit('down') || Input.hit('left')) { this.qty = this.qty <= 1 ? max : this.qty - 1; Audio.sfx('move'); }
        if (Input.hit('back')) { this.qty = 0; Audio.sfx('back'); }
        if (Input.hit('ok')) {
          const sum = this.price(id) * this.qty;
          if (this.sell) { st.bag[id] -= this.qty; st.bits += sum; this.msg = `Vendu ! +${sum} Bits`; this.i = Math.min(this.i, Math.max(0, this.stock.length - 1)); }
          else { if (sum > st.bits) { Audio.sfx('bump'); this.qty = 0; return; } st.bits -= sum; DW.giveItem(id, this.qty); this.msg = `Merci ! ${it.name} x${this.qty}`; }
          Audio.sfx('buy'); this.msgT = 2; this.qty = 0;
        }
        return;
      }
      const n = L.length + 1;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('left') || Input.hit('right')) { this.sell = !this.sell; this.i = 0; this.top = 0; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('ok')) {
        if (this.i >= L.length) { Audio.sfx('back'); this.close(); return; }
        const id = L[this.i];
        if (!this.sell) {
          if (st.bits < DW.ITEMS[id].price) { Audio.sfx('bump'); this.msg = "Tu n'as pas assez de Bits !"; this.msgT = 2; return; }
          if (!DW.bagRoom(id)) { Audio.sfx('bump'); this.msg = `Sac plein (${DW.BAG_MAX} max) !`; this.msgT = 2; return; }
        }
        Audio.sfx('select'); this.qty = 1;
      }
      // fenêtre de 8 lignes qui suit le curseur
      if (this.i < this.top) this.top = this.i; if (this.i > this.top + 7) this.top = this.i - 7;
    }
    tick(dt) { if (this.msgT > 0) this.msgT -= dt; }
    draw(c) {
      const st = DW.state, L = this.stock;
      UI.menuBg(c, this.t, this.sell ? 'VENDRE' : 'BOUTIQUE');
      UI.box(c, 8, 26, 210, 150);
      UI.text(c, this.sell ? '◀ ACHETER' : 'VENDRE ▶', 210, 22, { size: 7, align: 'right', color: '#9ab0e8' });
      const rows = L.concat(['__quit']).slice(this.top, this.top + 8);
      rows.forEach((id, k) => {
        const y = 44 + k * 16;
        if (id === '__quit') { UI.text(c, 'QUITTER', 26, y, { size: 10, color: '#9ab0e8' }); return; }
        const it = DW.ITEMS[id];
        c.drawImage(DW.Icons.item(id), 12, y - 11, 12, 12);
        UI.text(c, it.name + (this.sell ? ` ×${st.bag[id]}` : ''), 26, y, { size: 9 });
        UI.text(c, `${this.price(id)} B`, 210, y, { size: 9, align: 'right', color: '#ffd860' });
      });
      if (this.top > 0) UI.text(c, '▲', 113, 34, { size: 7, align: 'center', color: '#ffe070' });
      if (this.top + 8 < L.length + 1) UI.text(c, '▼', 113, 174, { size: 7, align: 'center', color: '#ffe070' });
      UI.cursor(c, 15, 40.5 + (this.i - this.top) * 16, this.t);
      UI.box(c, 224, 26, 88, 56);
      UI.text(c, 'Bits', 232, 42, { size: 9, color: '#9ab0e8' });
      UI.text(c, String(st.bits), 304, 56, { size: 11, align: 'right', bold: true, color: '#ffd860' });
      const id = L[this.i];
      UI.box(c, 8, 180, 304, 54);
      if (id) {
        const it = DW.ITEMS[id];
        UI.wrap(c, it.desc, 290, 8).slice(0, 3).forEach((l, k) => UI.text(c, l, 16, 196 + k * 11, { size: 8, color: '#c8f0ff' }));
        UI.text(c, `Dans le sac : ${st.bag[id] || 0}`, 304, 76, { size: 7, align: 'right', color: '#9ab0e8' });
      } else UI.text(c, this.sell ? 'Rien à vendre.' : 'La boutique est vide... Fais grandir la ville !', 16, 200, { size: 8, color: '#c8f0ff' });
      if (this.qty > 0) {
        UI.box(c, 224, 90, 88, 50);
        UI.text(c, `× ${this.qty}`, 268, 110, { size: 12, align: 'center', color: '#ffffff' });
        UI.text(c, `${this.price(id) * this.qty} B`, 268, 128, { size: 9, align: 'center', color: '#ffd860' });
      }
      if (this.msgT > 0) UI.text(c, this.msg, 268, 160, { size: 8, align: 'center', color: '#7aff8a' });
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
      UI.text(c, DW.Touch && DW.Touch.on ? 'Touche le champ pour écrire, puis OK' : 'Tape ton nom au clavier puis Entrée', 160, 140, { size: 8, align: 'center', color: '#9ab0e8' });
      UI.text(c, `(vide = "${this.def}")`, 160, 151, { size: 8, align: 'center', color: '#6a7aa8' });
    }
  }
  DW.NameScene = NameScene;
})();
