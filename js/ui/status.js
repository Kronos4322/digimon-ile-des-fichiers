'use strict';
// =====================================================================
//  FICHE DIGIMON (style Digimon World) : onglets Statut / Techniques / Digivolution / Résistances / Équipement
//  Gauche/Droite : onglet   Haut/Bas : Digimon (Statut) ou attaque (Techniques)
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W, H = DW.H;

  const heart = (c, x, y, full) => {
    c.fillStyle = full ? '#ff5a8a' : '#3a2a3a';
    c.beginPath(); c.arc(x - 2, y, 2.4, 0, 7); c.arc(x + 2, y, 2.4, 0, 7); c.fill();
    c.beginPath(); c.moveTo(x - 4.4, y + 0.8); c.lineTo(x, y + 5); c.lineTo(x + 4.4, y + 0.8); c.fill();
    if (full) { c.fillStyle = '#ffd0e0'; c.fillRect(x - 3, y - 1.4, 1, 1); }
  };
  const field = (c, x, y, w, txt, col) => UI.field(c, x, y, w, txt, col);
  const PARAMS = [['hp', 'PV', '#ff5a8a'], ['mp', 'PM', '#4ad0e8'], ['atk', 'Att', '#ff8a3a'], ['def', 'Déf', '#ffd040'], ['spd', 'Vit', '#5ae0a0'], ['int', 'Int', '#7ab0ff']];

  class SummaryScene extends DW.Scene {
    constructor(i) { super(); this.i = i; this.tab = 0; this.mv = 0; }
    get mon() { return DW.state.party[this.i]; }
    update() {
      const n = DW.state.party.length;
      if (this.busy) return;
      if (Input.hit('left')) { this.tab = (this.tab + 4) % 5; Audio.sfx('move'); }
      if (Input.hit('right')) { this.tab = (this.tab + 1) % 5; Audio.sfx('move'); }
      if (this.tab === 4) {
        this.slot = this.slot || 0;
        if (Input.hit('up')) { this.slot = (this.slot + 2) % 3; Audio.sfx('move'); }
        if (Input.hit('down')) { this.slot = (this.slot + 1) % 3; Audio.sfx('move'); }
        if (Input.hit('ok')) { Audio.sfx('select'); this.busy = true; this.equipMenu().finally(() => { this.busy = false; }); return; }
        if (Input.hit('back')) { Audio.sfx('back'); this.close(); }
        return;
      }
      if (this.tab === 2 && Input.hit('ok')) { Audio.sfx('select'); DW.Game.push(new DW.EvoTableScene(this.i)); return; }
      if (this.tab === 0) {
        if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
        if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      } else if (this.tab === 1) {
        const m = this.mon.moves.length;
        if (Input.hit('up')) { this.mv = (this.mv + m - 1) % m; Audio.sfx('move'); }
        if (Input.hit('down')) { this.mv = (this.mv + 1) % m; Audio.sfx('move'); }
      }
      if (Input.hit('back') || Input.hit('ok')) { Audio.sfx('back'); this.close(); }
    }
    draw(c) {
      const m = this.mon, d = m.d;
      UI.menuBg(c, this.t);
      // onglets
      UI.tabs(c, ['Statut', 'Techniques', 'Évolution', 'Résist.', 'Équipement'], this.tab, 7, 62);
      if (DW.state.party.length > 1) UI.text(c, `${this.i + 1} / ${DW.state.party.length}`, W - 10, H - 7, { size: 7, align: 'right', color: '#7ac8dc' });   // (en bas : il recouvrait le 4e onglet)
      UI.box(c, 4, 22, W - 8, H - 26);
      if (this.tab === 0) this.drawStatus(c, m, d); else if (this.tab === 1) this.drawTech(c, m); else if (this.tab === 2) this.drawEvo(c, m, d); else if (this.tab === 3) this.drawRes(c, m, d); else this.drawEquip(c, m);
    }
    // onglet Équipement (comme Digimon World 2003) : arme, armure, accessoire ; ESPACE pour changer ou retirer
    drawEquip(c, m) {
      UI.label(c, 'ÉQUIPEMENT', 12, 28);
      const spr = DW.Sprites.battle(m.sp);
      DW.Sprites.draw(c, spr, 60, 150, { frame: Math.floor(this.t * 4), scale: Math.min(1, 70 / spr.h, 80 / spr.w) });
      UI.text(c, m.name, 60, 168, { size: 9, align: 'center', color: '#ffe070' });
      DW.EQUIP_SLOTS.forEach(([slot, lab], j) => {
        const y = 44 + j * 44, sel = j === (this.slot || 0), id = (m.equip || {})[slot], it = id && DW.ITEMS[id];
        UI.box(c, 112, y, W - 124, 38, sel ? 'dwsel' : 'dw');
        UI.text(c, lab.toUpperCase(), 120, y + 11, { size: 7, color: '#5ad8ff' });
        if (it) { c.drawImage(DW.Icons.item(id), 120, y + 16); UI.text(c, it.name, 140, y + 27, { size: 9, color: '#ffffff' }); UI.text(c, DW.equipText(it.st), W - 18, y + 11, { size: 7, align: 'right', color: '#7aff8a' }); }
        else UI.text(c, '— rien —', 140, y + 27, { size: 9, color: '#6a8aa0' });
      });
      UI.text(c, `Att ${m.stat('atk')} · Déf ${m.stat('def')} · Vit ${m.stat('spd')} · Int ${m.stat('int')}`, W / 2, 196, { size: 8, align: 'center', color: '#c8f0ff' });
      UI.text(c, 'ESPACE : changer / retirer   ·   Le Bazar en vend quand la ville grandit', W / 2, H - 14, { size: 7, align: 'center', color: '#ffe070' });
    }
    async equipMenu() {
      const m = this.mon, [slot, lab] = DW.EQUIP_SLOTS[this.slot || 0], st = DW.state;
      const own = Object.keys(st.bag).filter(id => st.bag[id] > 0 && DW.ITEMS[id] && DW.ITEMS[id].use === 'equip' && DW.ITEMS[id].slot === slot);
      const cur = (m.equip || {})[slot];
      const opts = [...own.map(id => `${DW.ITEMS[id].name} (${DW.equipText(DW.ITEMS[id].st)})`), ...(cur ? ['Retirer'] : []), 'Retour'];
      if (!own.length && !cur) { await DW.say(`Aucun objet « ${lab} » dans ton sac. Le Bazar en vend !`); return; }
      const i = await DW.choose(opts, { y: 20 });
      if (i < 0 || opts[i] === 'Retour') return;
      if (opts[i] === 'Retirer') { const t = DW.unequip(m, slot); if (t) await DW.say(t); return; }
      Audio.sfx('buff');
      await DW.say(DW.useItem(own[i], m));
    }
    // onglet Résistances : ce que le Gymnase a endurci, et les dégâts reçus de chaque élément (élément du Digimon compris)
    drawRes(c, m, d) {
      UI.label(c, 'RÉSISTANCES', 12, 28);
      UI.text(c, 'Endurcies au Gymnase : plus la valeur est haute, moins l\'élément le blesse.', 14, 46, { size: 7, color: '#8ae0f0' });
      const types = Object.keys(DW.TYPES).filter(t => t !== 'Neutre');
      types.forEach((t, j) => {
        const half = Math.ceil(types.length / 2), col = j < half ? 0 : 1, x = col ? 164 : 12, row = j < half ? j : j - half;
        const yy = 64 + row * 27, v = (m.res || {})[t] || 0, mult = DW.typeMult(t, d.types) * (1 - (DW.Gymnase ? DW.Gymnase.resist(m, t) : 0));
        UI.box(c, x, yy - 10, 146, 24, 'dark');
        UI.typeTag(c, t, x + 6, yy - 6, 6);
        UI.bar(c, x + 6, yy + 8, 80, 3, v / 100, DW.TYPES[t].c);
        UI.text(c, `${v}`, x + 92, yy + 11, { size: 7, color: '#ffffff' });
        // (pas de pourcentage : un mot, comme dans Digimon World)
        const lab = mult >= 1.15 ? 'Point faible' : mult <= 0.6 ? 'Très résistant' : mult <= 0.9 ? 'Résiste' : 'Normal', good = mult <= 0.9, bad = mult >= 1.15;
        UI.text(c, lab, x + 140, yy + 3, { size: 8, align: 'right', color: good ? '#7aff8a' : bad ? '#ff8a8a' : '#c8f0ff' });
      });
      UI.text(c, 'Selon son élément et son entraînement au Gymnase.', W / 2, H - 12, { size: 7, align: 'center', color: '#ffe070' });
    }
    // onglet Digivolution : un aperçu, ESPACE ouvre la table complète (conditions, digivoluer)
    drawEvo(c, m, d) {
      DW.Sprites.draw(c, DW.Sprites.battle(m.sp), 70, 130, { frame: Math.floor(this.t * 4) });
      UI.text(c, `${m.name} — ${d.stage}`, 130, 50, { size: 11, bold: true, color: '#d8f6ff' });
      const opts = (DW.Evo && DW.Evo.options ? DW.Evo.options(m.sp) : []).slice(0, 5);
      UI.text(c, opts.length ? 'Peut digivoluer en :' : 'Pas de Digivolution connue.', 130, 70, { size: 9, color: '#8ae0f0' });
      opts.forEach((o, i) => UI.text(c, '• ' + ((DW.state.owned || {})[o.to] ? DW.SPECIES[o.to].name : '???'), 136, 86 + i * 13, { size: 9, color: '#ffffff' }));
      if (DW.Evo.available(m).length) UI.text(c, 'PRÊT À DIGIVOLUER !', W / 2 + 40, 170, { size: 12, align: 'center', bold: true, color: Math.floor(this.t * 3) % 2 ? '#ffe070' : '#7aff8a' });
      UI.text(c, `Appétit : ${DW.Care.appetiteLabel(m)}   ·   Corpulence : ${DW.Life.fatLabel(m)}`, 130, 186, { size: 8, color: '#8ae0f0' });
      UI.text(c, 'ESPACE : table des Digivolutions (conditions, digivoluer)', W / 2, H - 16, { size: 8, align: 'center', color: '#ffe070' });
    }
    drawStatus(c, m, d) {
      // PROFIL
      UI.label(c, 'PROFIL', 12, 28);
      UI.text(c, 'NOM', 14, 50, { size: 8, color: '#5ad8ff' }); field(c, 40, 42, 96, m.name, '#ffe070');
      UI.text(c, 'DIGI', 14, 63, { size: 8, color: '#5ad8ff' }); field(c, 40, 55, 96, d.name);
      UI.text(c, 'SPÉCIAL', 146, 36, { size: 7, color: '#5af070' });
      let x = 146;
      d.types.forEach(t => { x += UI.typeTag(c, t, x, 40, 6) + 2; });
      UI.text(c, 'ATTRIBUT', 230, 36, { size: 7, color: '#f0e050' });
      UI.tag(c, d.attr.toUpperCase(), 230, 40, '#3a6a9a', 6);
      UI.text(c, 'NIVEAU', 270, 36, { size: 7, color: '#ff70d0' });
      UI.text(c, `${m.level}`, 286, 50, { size: 11, align: 'center' });
      [['ÂGE', `${m.age} j`], ['POIDS', `${m.weight} kg`], ['VICTOIRES', `${m.wins}`], ['STADE', d.stage]].forEach(([k, v], j) => {
        const xx = 146 + j * 42;
        UI.text(c, k, xx, 63, { size: 6, color: '#5ad8ff' });
        field(c, xx, 64, 40, v);
      });
      // rythme de vie : diurne (soleil) ou nocturne (lune), et ses heures de sommeil
      { const S = DW.Life.sched(m), night = S.bed < 12 || /noct/i.test(S.name || ''), ix = 20, iy = 84;
        if (night) { c.fillStyle = '#f0e090'; c.beginPath(); c.arc(ix, iy, 4.5, 0, 7); c.fill(); c.fillStyle = '#16304a'; c.beginPath(); c.arc(ix + 2.4, iy - 1.6, 4, 0, 7); c.fill(); }
        else { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(ix, iy, 3.6, 0, 7); c.fill(); c.strokeStyle = '#ffd040'; c.lineWidth = 1; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.beginPath(); c.moveTo(ix + Math.cos(a) * 5, iy + Math.sin(a) * 5); c.lineTo(ix + Math.cos(a) * 6.8, iy + Math.sin(a) * 6.8); c.stroke(); } }
        const hh = v => `${Math.floor(v)} h`;
        UI.text(c, `${night ? 'Nocturne' : 'Diurne'} : il dort de ${hh(S.bed)} à ${hh(S.wake)}`, 30, 87, { size: 8, color: '#c8f0ff' });
        if (DW.Evo.available(m).length) UI.text(c, '★ Prêt à digivoluer !', W - 14, 87, { size: 8, align: 'right', color: Math.floor(this.t * 3) % 2 ? '#ffe070' : '#7aff8a' }); }
      // séparation
      c.fillStyle = 'rgba(90,220,240,0.35)'; c.fillRect(8, 92, W - 16, 1);
      // CONDITION + sprite
      UI.label(c, 'CONDITION', 12, 97);
      const spr = DW.Sprites.battle(m.sp);
      c.fillStyle = 'rgba(120,220,255,0.06)'; c.fillRect(12, 110, 132, 116);
      // le Digimon dans son cadre (à droite, au-dessus de la santé)
      c.fillStyle = 'rgba(120,220,255,0.08)'; c.fillRect(90, 112, 52, 46); c.strokeStyle = 'rgba(120,220,255,0.3)'; c.lineWidth = 1; c.strokeRect(90.5, 112.5, 51, 45);
      DW.Sprites.draw(c, spr, 116, 155, { frame: Math.floor(this.t * 4), scale: Math.min(1, 40 / spr.h, 46 / spr.w) });
      { const k = m.kos || 0; for (let i = 0; i < 3; i++) heart(c, 22 + i * 12, 118, i >= k); }   // 3 cœurs : les K.O. (au 3e, il meurt)
      const cond = m.hp <= 0 ? 'K.O.' : m.status ? DW.STATUS_NAME[m.status] : m.sick ? 'Malade' : m.hurt ? 'Blessé' : DW.Life.sleepy(m) ? 'Somnolent' : 'En forme';
      UI.text(c, cond, 18, 134, { size: 9, color: cond === 'En forme' ? '#a0ffb0' : '#ff8a8a' });
      // santé : négligences accumulées (life.js) — plus la barre baisse, plus la maladie guette
      const hl = DW.Life.healthLabel(m), hv = 1 - (m.germs || 0) / 100, hc = m.sick || m.germs >= 80 ? '#ff5a5a' : m.germs >= 50 ? '#f0a040' : '#5ad07a';
      UI.text(c, `Santé : ${hl}`, 84, 165, { size: 7, color: hc });
      UI.bar(c, 84, 168, 40, 4, m.sick ? 0 : hv, hc);
      UI.text(c, 'Bonheur', 18, 148, { size: 7, color: '#ff8ac0' });
      UI.bar(c, 18, 151, 60, 4, m.happy / 100, '#ff6ab0');
      UI.text(c, 'EXP', 18, 165, { size: 7, color: '#7ab8ff' });
      UI.bar(c, 18, 168, 60, 4, m.xpRatio(), '#48a8f8');
      UI.text(c, `Suivant : ${m.level >= 100 ? '—' : Math.max(0, DW.xpForLevel(m.level + 1) - m.xp)}`, 18, 182, { size: 7, color: '#c8f0ff' });   // (N.100 : le niveau maximal)
      if (m === DW.state.party[0]) {
        UI.text(c, `Faim ${Math.round(m.hunger)} %`, 18, 196, { size: 7, color: m.hunger >= 70 ? '#ff7a7a' : '#ffd070' });
        UI.bar(c, 18, 199, 60, 4, m.hunger / 100, m.hunger >= 70 ? '#ff5a5a' : '#f0b040');
        UI.text(c, `Toilettes ${Math.round(m.need)} %`, 84, 196, { size: 7, color: m.need >= 75 ? '#ff7a7a' : '#d8b890' });
        UI.bar(c, 84, 199, 40, 4, m.need / 100, m.need >= 75 ? '#ff5a5a' : '#a07850');
      } else UI.text(c, '(faim : Digimon de tête seulement)', 18, 196, { size: 6, color: '#6ab8d0' });
      // vie : discipline, erreurs de soin, corpulence, renaissances
      DW.Life.init(m);
      UI.text(c, `Discipline ${Math.round(m.disc)}`, 18, 211, { size: 7, color: '#9ad0ff' });
      UI.bar(c, 18, 214, 60, 4, m.disc / 100, '#5a9ae8');
      UI.text(c, `Erreurs de soin ${m.mistakes}`, 84, 211, { size: 7, color: m.mistakes >= 5 ? '#ff7a7a' : '#c8f0ff' });
      UI.text(c, `${DW.Life.fatLabel(m)} · vie n°${m.lives + 1}`, 18, 228, { size: 7, color: '#c8f0ff' });
      // PARAMÈTRES
      UI.label(c, 'PARAMÈTRES', 152, 97);
      PARAMS.forEach(([k, lab, col], j) => {
        const y = 116 + j * 19, v = m.stat(k), cur = k === 'hp' ? m.hp : k === 'mp' ? m.mp : null, rr = cur != null ? cur / Math.max(1, v) : 0;
        c.fillStyle = col; c.beginPath(); c.arc(158, y - 3, 3, 0, 7); c.fill();
        UI.text(c, lab, 164, y, { size: 9 });
        UI.text(c, cur != null ? `${cur} / ${v}` : String(v), 304, y, { size: 9, align: 'right' });
        UI.text(c, `entr. ${m.tr[k]}/${DW.Training.cap(m)}`, 206, y, { size: 7, color: m.tr[k] >= DW.Training.cap(m) ? '#ffd070' : '#7aff8a' });
        UI.bar(c, 190, y + 3, 114, 3, cur != null ? rr : Math.min(1, v / ((m.level * 2.6 + 30) * DW.SCALE.stat)), k === 'hp' ? UI.hpColor(rr) : k === 'mp' ? '#5a8aff' : '#4ad8e8');
      });
    }
    drawTech(c, m) {
      UI.label(c, 'TECHNIQUES', 12, 28);
      UI.text(c, `PM ${m.mp} / ${m.maxMp}`, W - 14, 34, { size: 8, align: 'right', color: '#8ad0ff' });
      m.moves.forEach((mm, j) => {
        const mv = DW.MOVES[mm.id], y = 40 + j * 17, sel = j === this.mv, sig = DW.sigOf(m) === mm.id;
        UI.box(c, 10, y - 2, W - 20, 16, sel ? 'dwsel' : 'dw');
        UI.text(c, (sig ? '★ ' : '') + mv.name, 18, y + 9, { size: 9, color: sig ? '#ffd070' : sel ? '#ffffff' : '#c8f0ff' });
        UI.typeTag(c, mv.type, 140, y + 2, 6);
        UI.text(c, mv.heal ? 'Soin' : mv.pow ? `Puis. ${mv.pow}` : 'Statut', 214, y + 9, { size: 8, color: '#8ae0f0' });
        const cost = DW.mpCost(mm.id);
        UI.text(c, cost ? `${cost} PM` : 'Gratuit', W - 18, y + 9, { size: 8, align: 'right', color: '#9ad0ff' });
      });
      const mv = DW.MOVES[m.moves[this.mv].id];
      UI.box(c, 10, 146, W - 20, 82);
      UI.text(c, `Précision : ${mv.acc ? mv.acc + ' %' : 'infaillible'}`, 18, 160, { size: 8, color: '#8ae0f0' });
      UI.text(c, mv.contact ? 'Corps à corps (Attaque)' : (mv.pow ? 'À distance (Intelligence)' : 'Technique de soutien'), W - 18, 160, { size: 8, align: 'right', color: '#8ae0f0' });
      UI.wrap(c, mv.desc, 280, 10).forEach((l, i) => UI.text(c, l, 18, 178 + i * 13));
      // attaques à venir
      const next = m.d.learn.filter(([l, id]) => l > m.level && !m.knows(id)).slice(0, 2);
      if (next.length) UI.text(c, 'À apprendre : ' + next.map(([l, id]) => `${DW.MOVES[id].name} (N.${l})`).join(', '), 18, 212, { size: 7, color: '#ffe070' });
      // coup spécial (signature) : se lance en combat quand la jauge d'énergie est pleine
      const sig = DW.sigOf(m);
      if (sig) UI.text(c, `★ Coup spécial : ${DW.MOVES[sig].name}  (jauge d'énergie pleine → ATTAQUE puis ENTRÉE)`, 18, 224, { size: 7, color: '#ffb060' });
    }
  }
  DW.SummaryScene = SummaryScene;
})();
