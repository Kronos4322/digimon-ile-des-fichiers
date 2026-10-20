'use strict';
// =====================================================================
//  MENUS : carte d'infos, menu principal (Digivice), options, équipe, DigiDex   (sac : ui/sac.js, boutique : ui/boutique.js, nom : ui/nom.js)
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;

  const statusTag = (c, m, x, y) => {
    if (m.hp <= 0) return UI.tag(c, 'K.O.', x, y, '#a02030');
    if (m.status) return UI.tag(c, DW.STATUS_NAME[m.status], x, y, DW.STATUS_COL[m.status]);
    return 0;
  };

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
    if ((await DW.ask(`Supprimer la partie ${n} (${info.name}) ? Elle sera perdue pour toujours !`, ['Non', 'Oui, supprimer'], null, 0)) !== 1) return;
    if ((await DW.ask('Vraiment ? Cette action est définitive.', ['Non', 'Oui, j\'en suis sûr'], null, 0)) !== 1) return;
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
        this.close(() => DW.Life.educate(k === 'feliciter'));   // (joué sur la carte, menu fermé : overworld.js)
      } else if (k === 'systeme') {
        const r = await DW.ask('Système du Digivice :', ['Sauvegarder', "Fichier sur l'ordinateur", 'Options', 'Supprimer une partie', 'Écran titre', 'Retour']);
        if (r === 0) await this.act('sauver');
        else if (r === 1) await DW.saveFileMenu();
        else if (r === 2) await this.act('options');
        else if (r === 3) await deleteSave();
        else if (r === 4) await this.act('titre');
      } else if (k === 'sac') await Game.push(new DW.BagScene({}));
      else if (k === 'dex') await Game.push(new DexScene());
      else if (k === 'cartes') await Game.push(new DW.AlbumScene());
      else if (k === 'carte') await Game.push(new DW.WorldMapScene());
      else if (k === 'journal') await Game.push(new DW.Story.JournalScene());
      else if (k === 'dormir') {
        const m = DW.Care.lead();
        if (!m) { await DW.say("Tu n'as pas encore de partenaire."); return; }
        if (!DW.Life.sleepy(m)) { const S = DW.Life.sched(m); await DW.say(`${m.name} n'a pas sommeil (il se couche vers ${S.bed} h). Il peut se reposer une heure chez Jijimon, ou dans sa chambre.`); return; }
        if ((await DW.ask(`Faire dormir ${m.name} ici jusqu'au matin ?`)) !== 0) return;
        this.close(async () => { await DW.Life.sleep(false); await DW.say(`Bonjour ! ${m.name} a bien dormi et se sent en forme.`); });
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
      const st = DW.state, t = this.t, items = this.items, n = items.length;
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
      const [label, , help] = RING[items[this.i][0]];
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
        Audio.sfx('move'); O.save();
      }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); }
    }
    rows() { const O = DW.Options; return [['Vitesse du texte', O.SPEEDS[O.textSpeed].name], ['Son', Audio.muted ? 'Coupé' : 'Activé']]; }
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
        // (réduit pour tenir dans sa ligne, et découpé au cadre : un grand Champion ne recouvre plus ses voisins)
        c.save(); c.beginPath(); c.rect(10, y + 2, 36, 26); c.clip();
        DW.Sprites.draw(c, spr, 28, y + 27 + bob, { silhouette: false, alpha: m.hp > 0 ? 1 : 0.5, scale: Math.min(1, 25 / spr.h, 34 / spr.w) });
        c.restore();
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

})();
