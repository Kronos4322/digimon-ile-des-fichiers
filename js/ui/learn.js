'use strict';
// =====================================================================
//  OUBLIER UNE TECHNIQUE : comparaison détaillée avant de choisir
//  Haut/Bas : technique à oublier (la dernière ligne = ne pas apprendre)
//  ESPACE : confirmer   ÉCHAP : ne pas apprendre
//  Pour la technique sélectionnée, on compare avec la nouvelle :
//  puissance, précision, coût en PM, élément (bonus si c'est celui du Digimon), contact/distance, effet,
//  puis les AVANTAGES et INCONVÉNIENTS de l'échange.
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W;
  const GOOD = '#7aff8a', BAD = '#ff8a7a';

  // texte de l'effet secondaire d'une technique
  const STAT = { atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intelligence' }, STS = { brn: 'brûlure', psn: 'poison', par: 'paralysie', slp: 'sommeil' };
  function effect(mv) {
    const out = [];
    if (mv.st) out.push(`${Math.round((mv.st.ch || 1) * 100)} % ${STS[mv.st.s] || mv.st.s}`);
    if (mv.sc) out.push(`${mv.sc.who === 'self' ? 'soi' : 'ennemi'} : ${STAT[mv.sc.s]} ${mv.sc.n > 0 ? '+' : ''}${mv.sc.n}${mv.sc.ch && mv.sc.ch < 1 ? ` (${Math.round(mv.sc.ch * 100)} %)` : ''}`);
    if (mv.pri) out.push('frappe en premier');
    if (mv.heal) out.push(`soigne ${Math.round(mv.heal * 100)} % des PV`);
    return out.join(', ') || 'aucun';
  }
  // puissance « réelle » pour ce Digimon (bonus d'élément ×1.5)
  const real = (mon, mv) => (mv.pow || 0) * (mon.d.types.includes(mv.type) ? 1.5 : 1);

  // avantages / inconvénients d'apprendre « nw » à la place de « old » (oldId, nwId : leurs identifiants)
  function compare(mon, old, nw, others, oldId, nwId) {
    const pros = [], cons = [];
    const d = Math.round(real(mon, nw) - real(mon, old));
    if (nw.pow && old.pow) { if (d > 0) pros.push(`Plus puissante (+${d} avec le bonus d'élément)`); else if (d < 0) cons.push(`Moins puissante (${d} avec le bonus d'élément)`); }
    if (nw.pow && !old.pow) pros.push('Inflige des dégâts (l\'ancienne n\'en fait pas)');
    if (!nw.pow && old.pow) cons.push('N\'inflige aucun dégât');
    const an = nw.acc || 100, ao = old.acc || 100;
    if (an > ao) pros.push(`Plus précise (${nw.acc ? an + ' %' : 'infaillible'} contre ${ao} %)`);
    else if (an < ao) cons.push(`Moins précise (${an} % contre ${old.acc ? ao + ' %' : 'infaillible'})`);
    const cn = DW.mpCost(nw), co = DW.mpCost(old);
    if (cn < co) pros.push(`Moins coûteuse (${cn} PM contre ${co})`); else if (cn > co) cons.push(`Plus coûteuse (${cn} PM contre ${co})`);
    const sn = mon.d.types.includes(nw.type), so = mon.d.types.includes(old.type);
    if (sn && !so) pros.push(`Élément ${nw.type} : bonus ×1.5 pour ${mon.d.name}`); else if (so && !sn) cons.push(`Perd le bonus d'élément (${old.type})`);
    if (nw.pow && old.pow && nw.contact !== old.contact) (nw.contact ? (mon.stat('atk') >= mon.stat('int') ? pros : cons) : (mon.stat('int') >= mon.stat('atk') ? pros : cons))
      .push(nw.contact ? `Corps à corps : utilise l'Attaque (${mon.stat('atk')})` : `À distance : utilise l'Intelligence (${mon.stat('int')})`);
    if ((nw.st || nw.sc) && !(old.st || old.sc)) pros.push(`Effet en plus : ${effect(nw)}`);
    if ((old.st || old.sc) && !(nw.st || nw.sc)) cons.push(`Perd l'effet : ${effect(old)}`);
    // couverture : dernière technique d'un élément, ou dernière technique offensive
    if (old.type !== nw.type && !others.some(m => m.type === old.type)) cons.push(`Plus aucune technique ${old.type}`);
    if (old.pow && !nw.pow && !others.some(m => m.pow)) cons.push('Plus aucune technique offensive !');
    if (nw.type !== old.type && !others.some(m => m.type === nw.type)) pros.push(`Nouvel élément : ${nw.type}`);
    // (le coup spécial ne dépend pas des techniques connues : il reste, même si on oublie la technique signature)
    const sig = DW.sigOf(mon);
    if (sig === nwId) pros.push('Sa technique signature'); else if (sig === oldId) cons.push('Sa technique signature (le coup spécial reste)');
    return { pros, cons };
  }

  class ForgetScene extends DW.Scene {
    constructor(mon, id) { super(); this.mon = mon; this.nwId = id; this.nw = DW.MOVES[id]; this.i = 0; }
    update() {
      const n = this.mon.moves.length + 1;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(-1); return; }
      if (Input.hit('ok')) { Audio.sfx('select'); this.close(this.i < this.mon.moves.length ? this.i : -1); }
    }
    row(c, mv, y, sel, tag, cost) {
      UI.box(c, 6, y, 150, 16, sel ? 'dwsel' : 'dw');
      UI.text(c, mv.name, 12, y + 11, { size: 8, color: tag ? '#ffe070' : sel ? '#ffffff' : '#c8f0ff' });
      UI.typeTag(c, mv.type, 98, y + 4, 6);
      if (tag) UI.text(c, tag, 150, y + 11, { size: 6, align: 'right', color: '#ffe070' });
      else if (cost) UI.text(c, DW.mpCost(mv) ? `${DW.mpCost(mv)} PM` : 'Gratuit', 150, y + 11, { size: 6, align: 'right', color: '#8ae0f0' });
    }
    draw(c) {
      const m = this.mon, nw = this.nw, t = this.t;
      UI.menuBg(c, t, 'TECHNIQUES');
      UI.text(c, `Apprendre ${nw.name} : oublier laquelle ?`, W - 10, 17, { size: 7, align: 'right', color: '#ffe070' });
      m.moves.forEach((mm, j) => this.row(c, DW.MOVES[mm.id], 26 + j * 18, this.i === j, null, true));
      this.row(c, nw, 26 + m.moves.length * 18 + 4, this.i === m.moves.length, 'NOUVELLE');
      UI.cursor(c, 2, 34 + this.i * 18 + (this.i === m.moves.length ? 4 : 0), t);
      // fiche comparative
      UI.box(c, 160, 26, W - 166, 208);
      if (this.i === m.moves.length) {
        UI.label(c, 'NE PAS APPRENDRE', 166, 30);
        UI.wrap(c, `${m.name} garde ses ${DW.MAX_MOVES} techniques et renonce à ${nw.name}.`, 144, 9).forEach((l, j) => UI.text(c, l, 168, 58 + j * 13, { size: 9 }));
        UI.text(c, 'ESPACE : confirmer', 168, 224, { size: 7, color: '#6ab8d0' });
        return;
      }
      const old = DW.MOVES[m.moves[this.i].id], others = m.moves.filter((x, j) => j !== this.i).map(x => DW.MOVES[x.id]);
      UI.label(c, 'COMPARAISON', 166, 30);
      UI.text(c, 'Oubliée', 232, 52, { size: 7, align: 'center', color: BAD });
      UI.text(c, 'Nouvelle', 286, 52, { size: 7, align: 'center', color: GOOD });
      const rows = [
        ['Puissance', o => (o.pow ? `${o.pow}${m.d.types.includes(o.type) ? '×1.5' : ''}` : '—')],
        ['Précision', o => (o.acc ? o.acc + ' %' : '∞')],
        ['Coût', o => (DW.mpCost(o) ? DW.mpCost(o) + ' PM' : 'gratuit')],
        ['Portée', o => (!o.pow ? 'soutien' : o.contact ? 'contact' : 'distance')],
      ];
      rows.forEach(([lab, f], j) => {
        const y = 66 + j * 12;
        UI.text(c, lab, 168, y, { size: 7, color: '#8ae0f0' });
        UI.text(c, f(old), 232, y, { size: 8, align: 'center' });
        UI.text(c, f(nw), 286, y, { size: 8, align: 'center' });
      });
      const { pros, cons } = compare(m, old, nw, others, m.moves[this.i].id, this.nwId);
      let y = 122;
      UI.text(c, 'AVANTAGES', 168, y, { size: 7, color: GOOD }); y += 11;
      (pros.length ? pros : ['Aucun']).slice(0, 4).forEach(p => { UI.wrap(c, '+ ' + p, 142, 7).forEach(l => { UI.text(c, l, 168, y, { size: 7, color: pros.length ? '#c8ffd0' : '#8aa0a8' }); y += 9; }); });
      y += 3;
      UI.text(c, 'INCONVÉNIENTS', 168, y, { size: 7, color: BAD }); y += 11;
      (cons.length ? cons : ['Aucun']).slice(0, 4).forEach(p => { UI.wrap(c, '− ' + p, 142, 7).forEach(l => { if (y < 230) UI.text(c, l, 168, y, { size: 7, color: cons.length ? '#ffd0c8' : '#8aa0a8' }); y += 9; }); });
      // effets en bas à gauche
      UI.box(c, 6, 156, 150, 78);
      UI.text(c, `Effet (oubliée) : ${effect(old)}`, 12, 170, { size: 7, color: '#ffd0c8' });
      UI.text(c, `Effet (nouvelle) : ${effect(nw)}`, 12, 181, { size: 7, color: '#c8ffd0' });
      UI.wrap(c, nw.desc, 138, 7).slice(0, 3).forEach((l, j) => UI.text(c, l, 12, 195 + j * 10, { size: 7 }));
      UI.text(c, 'ESPACE : oublier   ÉCHAP : renoncer', 12, 230, { size: 6, color: '#6ab8d0' });
    }
  }
  DW.ForgetScene = ForgetScene;
})();
