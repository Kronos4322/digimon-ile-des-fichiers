'use strict';
// =====================================================================
//  FICHE DIGIMON (style Digimon World) : onglets Statut / Techniques
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
      if (Input.hit('left') || Input.hit('right')) { this.tab ^= 1; Audio.sfx('move'); }
      if (this.tab === 0) {
        if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
        if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      } else {
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
      UI.tabs(c, ['Statut', 'Techniques'], this.tab);
      UI.text(c, `${this.i + 1} / ${DW.state.party.length}`, W - 10, 16, { size: 8, align: 'right', color: '#7ac8dc' });
      UI.box(c, 4, 22, W - 8, H - 26);
      if (this.tab === 0) this.drawStatus(c, m, d); else this.drawTech(c, m);
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
      [['VIE', `${m.age}/${Math.round(m.lifespan)} j`], ['POIDS', `${m.weight} kg`], ['VICTOIRES', `${m.wins}`], ['STADE', d.stage]].forEach(([k, v], j) => {
        const xx = 146 + j * 42;
        UI.text(c, k, xx, 63, { size: 6, color: '#5ad8ff' });
        field(c, xx, 64, 40, v);
      });
      const ready = DW.Evo.available(m).length;
      const evo = ready ? 'PRÊT ! (table des Digivolutions)' : d.evo ? `dès le niveau ${d.evo.lvl} + entraînement (voir la table)` : (d.stage === 'Méga' ? 'Stade maximal atteint' : '???');
      UI.text(c, `Digivolution : ${evo}`, 14, 87, { size: 8, color: '#c8f0ff' });
      // séparation
      c.fillStyle = 'rgba(90,220,240,0.35)'; c.fillRect(8, 92, W - 16, 1);
      // CONDITION + sprite
      UI.label(c, 'CONDITION', 12, 97);
      const spr = DW.Sprites.battle(m.sp);
      c.fillStyle = 'rgba(120,220,255,0.06)'; c.fillRect(12, 110, 132, 116);
      DW.Sprites.draw(c, spr, 118, 143, { frame: Math.floor(this.t * 4), scale: Math.min(1, 36 / spr.h, 56 / spr.w) });
      const r = m.hp / m.maxHp;
      for (let k = 0; k < 3; k++) heart(c, 20 + k * 11, 117, r > k / 3 + 0.01);
      const cond = m.hp <= 0 ? 'K.O.' : m.status ? DW.STATUS_NAME[m.status] : m.sick ? 'Malade' : m.hurt ? 'Blessé' : DW.Life.sleepy(m) ? 'Somnolent' : 'En forme';
      UI.text(c, cond, 18, 134, { size: 9, color: cond === 'En forme' ? '#a0ffb0' : '#ff8a8a' });
      // santé : négligences accumulées (life.js) — plus la barre baisse, plus la maladie guette
      const hl = DW.Life.healthLabel(m), hv = 1 - (m.germs || 0) / 100, hc = m.sick || m.germs >= 80 ? '#ff5a5a' : m.germs >= 50 ? '#f0a040' : '#5ad07a';
      UI.text(c, `Santé : ${hl}`, 84, 165, { size: 7, color: hc });
      UI.bar(c, 84, 168, 40, 4, m.sick ? 0 : hv, hc);
      UI.text(c, 'Bonheur', 18, 148, { size: 7, color: '#ff8ac0' });
      UI.bar(c, 18, 151, 60, 4, m.happy / 100, '#ff6ab0');
      UI.text(c, `Fatigue ${m.tired} %`, 84, 148, { size: 7, color: m.tired >= 100 ? '#ff7a7a' : '#ffd070' });
      UI.bar(c, 84, 151, 40, 4, m.tired / 100, m.tired >= 100 ? '#ff5a5a' : '#f0b040');
      UI.text(c, 'EXP', 18, 165, { size: 7, color: '#7ab8ff' });
      UI.bar(c, 18, 168, 60, 4, m.xpRatio(), '#48a8f8');
      UI.text(c, `Suivant : ${Math.max(0, DW.xpForLevel(m.level + 1) - m.xp)}`, 18, 182, { size: 7, color: '#c8f0ff' });
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
      UI.text(c, `${DW.Life.fatLabel(m)} · reste ${DW.Life.daysLeft(m)} j · vie n°${m.lives + 1} · ${DW.Life.sched(m).name} · K.O. ${m.kos || 0}/3`, 18, 228, { size: 7, color: (m.kos || 0) >= 2 ? '#ff8a8a' : '#c8f0ff' });
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
