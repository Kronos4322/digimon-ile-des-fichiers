'use strict';
// =====================================================================
//  OBJETS ET SAC : effet des objets sur un Digimon (canUse / useItem), apprentissage, sac de voyage, giveItem
// =====================================================================
(function () {
  // ------------------------------------------------------------ objets
  // l'objet a-t-il un effet sur ce Digimon ? (battle : utilisé pendant un combat)
  DW.canUse = (id, m, battle) => {
    const it = DW.ITEMS[id];
    switch (it.use) {
      case 'heal': {
        if (m.hp <= 0) return false;
        // nourriture : hors combat seulement, quand il a faim (ou soif, ou pour un effet spécial)
        if (it.food != null) return !battle && (m.hunger >= 5 || (it.drink && (m.thirst || 0) >= 5) || !!(it.chip || it.boost || it.disc || it.happy || it.tired || it.life || it.fat < 0));
        const special = it.chip || it.boost || it.disc || it.happy || it.fat || it.tired || it.life;
        return m.hp < m.maxHp || (it.mp || it.mpFull) && m.mp < m.maxMp || (it.cure && m.status) || (!battle && !!special);   // (la nourriture : ligne d'au-dessus)
      }
      case 'mp': return m.hp > 0 && (m.mp < m.maxMp || (!battle && m.hunger >= 5 && it.food));
      case 'cure': return m.hp > 0 && !!m.status;
      case 'revive': return m.hp <= 0;
      case 'sick': return !!m.sick || !!m.hurt || (m.germs || 0) >= 50;   // aussi en prévention, quand la santé flanche
      case 'hurt': return !!m.hurt;
      case 'chip': return !battle;
      case 'manual': return !battle && !!DW.nextMove(m);
      case 'buff': case 'protect': return !!battle && m.hp > 0;
      case 'evo': return !battle && m.hp > 0 && m.d.stage === it.from;
      case 'equip': {   // (remplace celui du même emplacement, qui revient dans le sac : il faut de la place)
        const old = m.equip && m.equip[it.slot];
        return !battle && (!old || DW.bagRoom(old) > 0 || (DW.state.bag[id] || 0) === 1);
      }
      default: return false;
    }
  };
  // retire un équipement (il revient dans le sac s'il y a de la place) ; renvoie le message
  DW.unequip = (m, slot) => {
    const id = m.equip && m.equip[slot]; if (!id) return '';
    if (!DW.bagRoom(id)) return 'Ton sac est plein : impossible de le retirer.';
    const hp0 = m.maxHp, mp0 = m.maxMp; delete m.equip[slot]; DW.giveItem(id);
    m.reajuster(hp0, mp0);
    return `${DW.ITEMS[id].name} retourne dans le sac.`;
  };
  // applique les bonus permanents d'un objet (puces, fruits) ; renvoie le texte des gains
  function applyChips(m, chip) {
    const NAMES = { hp: 'PV', mp: 'PM', atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intelligence' }, hp0 = m.maxHp, mp0 = m.maxMp, out = [];
    for (const k in chip) { const v0 = k === 'hp' ? hp0 : k === 'mp' ? mp0 : m.stat(k); m.chips[k] = (m.chips[k] || 0) + chip[k]; const v1 = k === 'hp' ? m.maxHp : k === 'mp' ? m.maxMp : m.stat(k); out.push(`${NAMES[k]} +${v1 - v0}`); }
    m.hp += m.maxHp - hp0; m.mp += m.maxMp - mp0;
    return out.join(', ');
  }
  // applique l'objet et renvoie le message
  DW.useItem = (id, m) => {
    const it = DW.ITEMS[id], st = DW.state;
    st.bag[id] = Math.max(0, (st.bag[id] || 0) - 1);
    if (it.use === 'heal' || it.use === 'mp') {
      const hp0 = m.hp, mp0 = m.mp, txt = [];
      if (it.use === 'heal') m.hp = Math.min(m.maxHp, it.full ? m.maxHp : m.hp + (it.amt || 0));
      if (it.use === 'mp' || it.mp || it.mpFull) m.mp = Math.min(m.maxMp, it.mpFull ? m.maxMp : m.mp + (it.use === 'mp' ? it.amt || 0 : it.mp || 0));
      if (it.cure) { m.status = null; m.slp = 0; }
      const fed = it.food && DW.Care && DW.Care.feed(m, it.food);
      if (it.drink && DW.Care.drink(m, it.drink)) txt.push('soif étanchée');
      if (it.happy) m.addHappy(it.happy);
      if (it.disc && DW.Life) { DW.Life.addDisc(m, it.disc); txt.push(`discipline ${it.disc > 0 ? '+' : ''}${it.disc}`); }
      if (it.fat && DW.Life) { DW.Life.addFat(m, it.fat); if (Math.abs(it.fat) >= 1 || it.fat < 0) txt.push(it.fat > 0 ? 'il grossit' : 'il maigrit'); }
      if (it.tired) { m.tired = Math.max(0, m.tired - it.tired); txt.push('plus de fatigue'); }
      if (it.boost) { m.boost = (m.boost || 0) + it.boost; txt.push(`prochaine séance +${m.boost} point${m.boost > 1 ? 's' : ''}`); }
      if (it.life) { m.lifespan += it.life; txt.push(`vie +${it.life} jour`); }
      if (it.chip) txt.push(applyChips(m, it.chip));
      if (it.risky && Math.random() < it.risky) { m.sick = m.sick || st.clock; txt.push('... mais il tombe malade !'); }
      if (m.hp > hp0) txt.unshift(`+${m.hp - hp0} PV`);
      if (m.mp > mp0) txt.unshift(`+${m.mp - mp0} PM`);
      // (ventre plein = 4 repas ; la faim revient 4 à 14 fois par jour selon le stade — game/care.js)
      const more = fed && m.hunger > 5 ? Math.ceil(m.hunger / (100 / DW.Care.portions(m))) : 0;
      const fedTxt = !fed ? '' : more ? ` (il a encore faim : encore ${more} repas)` : ' (rassasié !)';
      return `${m.name} ${it.drink ? 'boit à grandes gorgées' : it.food ? 'mange avec appétit' : 'utilise ' + it.name}${fedTxt}${txt.length ? ' : ' + txt.join(', ') : ''} !`;
    }
    if (it.use === 'cure') { m.status = null; m.slp = 0; return `${m.name} est en pleine forme !`; }
    if (it.use === 'revive') { m.hp = it.full ? m.maxHp : Math.floor(m.maxHp / 2); if (it.full) m.mp = m.maxMp; m.status = null; return `${m.name} reprend connaissance !`; }
    if (it.use === 'sick') { const was = m.sick || m.hurt; m.sick = 0; m.hurt = 0; m.germs = 0; m.addHappy(2); return was ? `${m.name} est guéri !` : `${m.name} reprend des couleurs. Il ne tombera pas malade !`; }
    if (it.use === 'hurt') { m.hurt = 0; return `La blessure de ${m.name} est soignée !`; }
    if (it.use === 'chip') return `${m.name} absorbe la puce : ${applyChips(m, it.chip)} !`;
    if (it.use === 'equip') {
      m.equip = m.equip || {};
      const old = m.equip[it.slot], hp0 = m.maxHp, mp0 = m.maxMp;
      m.equip[it.slot] = id;
      if (old) DW.giveItem(old, 1);   // (de la place : vérifié par DW.canUse)
      m.reajuster(hp0, mp0);
      return `${m.name} s'équipe : ${it.name} (${DW.equipText(it.st)})${old ? ` — ${DW.ITEMS[old].name} retourne dans le sac` : ''} !`;
    }
    return '';
  };
  // prochaine technique de l'espèce que le Digimon ne connaît pas encore (Manuel de technique)
  // APPRENTISSAGE (comme Digimon World 1) : après une victoire, un Digimon peut comprendre tout seul une technique
  // de son espèce (déjà à sa portée par le niveau) ; la chance dépend surtout de son INTELLIGENCE — rare au début
  DW.learnChance = m => DW.clamp(0.03 + m.stat('int') / (900 * DW.SCALE.stat), 0.03, 0.3);
  DW.tryLearn = m => {
    const pool = m.d.learn.filter(([l, id]) => l > 0 && l <= m.level && !m.knows(id) && DW.MOVES[id]).map(([, id]) => id);
    return pool.length && Math.random() < DW.learnChance(m) ? pool[0] : null;
  };
  DW.nextMove = m => { for (const [l, id] of m.d.learn) if (l > 0 && !m.knows(id) && DW.MOVES[id]) return id; return null; };
  // SAC DE VOYAGE (comme Digimon World 1) : 10 exemplaires de chaque objet, et un nombre limité de SORTES d'objets
  // (20 places, +4 avec chaque Grand sac acheté au Bazar). Plein : on ne peut plus rien ramasser, il faut
  // passer à la maison (coffre : tout sauf la nourriture ; frigo : la nourriture) ou à la Banque de Kunemon.
  DW.BAG_MAX = 10;
  DW.bagSlots = () => 20 + (DW.Home && DW.Home.owned('sac1') ? 4 : 0) + (DW.Home && DW.Home.owned('sac2') ? 4 : 0);
  DW.bagUsed = () => Object.keys(DW.state.bag).filter(k => DW.state.bag[k] > 0).length;
  DW.bagRoom = id => (DW.state.bag[id] || 0) > 0 || DW.bagUsed() < DW.bagSlots() ? Math.max(0, DW.BAG_MAX - (DW.state.bag[id] || 0)) : 0;
  DW.isFood = id => DW.ITEMS[id] && DW.ITEMS[id].food != null;
  // renvoie le nombre d'objets laissés sur place (0 si tout tient dans le sac)
  DW.giveItem = (id, n = 1) => {
    const st = DW.state, add = Math.min(n, DW.bagRoom(id)), extra = n - add;
    st.bag[id] = (st.bag[id] || 0) + add;
    return extra;
  };
  DW.extraMsg = extra => (extra ? `  (Ton sac est plein : ${extra} laissé${extra > 1 ? 's' : ''} sur place... Range tes affaires à la maison !)` : '');

})();
