'use strict';
// =====================================================================
//  DIGIMON : instance, stats, expérience, attaques, objets, sauvegarde
// =====================================================================
(function () {
  DW.xpForLevel = l => (l <= 1 ? 0 : Math.floor(Math.pow(l, 3) * 0.8));

  class Digimon {
    constructor(sp, level = 5, o = {}) {
      this.sp = sp;
      this.level = level;
      this.xp = DW.xpForLevel(level);
      this.iv = o.iv || { hp: DW.rand(0, 15), atk: DW.rand(0, 15), def: DW.rand(0, 15), spd: DW.rand(0, 15), int: DW.rand(0, 15) };
      if (this.iv.int == null) this.iv.int = DW.rand(0, 15);
      this.happy = o.happy != null ? o.happy : 50;          // bonheur 0-100
      this.born = o.born != null ? o.born : (DW.state ? DW.state.clock : 0); // date d'arrivée (minutes de jeu)
      this.evoAt = o.evoAt != null ? o.evoAt : this.born;                      // date de la dernière Digivolution
      this.wins = o.wins || 0;
      this.tr = Object.assign({ hp: 0, mp: 0, atk: 0, def: 0, spd: 0, int: 0 }, o.tr || {}); // points d'entraînement
      this.chips = Object.assign({ hp: 0, mp: 0, atk: 0, def: 0, spd: 0, int: 0 }, o.chips || {}); // puces (bonus permanents)
      this.raw = Object.assign({}, o.raw || {});                                    // entraînement « Statistique »
      this.abi = o.abi || 0;                                                         // ABI : repousse les plafonds d'entraînement
      this.tired = o.tired || 0;                                                     // fatigue 0-100
      this.hunger = o.hunger || 0; this.need = o.need || 0; this.thirst = o.thirst || 0;                          // faim / toilettes 0-100 (voir care.js)
      // vie (voir life.js) : erreurs de soin, discipline, corpulence, renaissances, durée de vie, sommeil, maladie, blessure
      this.mistakes = o.mistakes || 0;                     // erreurs de soin
      this.disc = o.disc != null ? o.disc : 40;            // discipline
      this.fat = o.fat || 0;                               // corpulence
      this.lives = o.lives || 0;
      this.kos = o.kos || 0;                               // K.O. en combat (au 3e, il meurt : game/life.js)                           // renaissances
      this.lifespan = o.lifespan || 30;                    // durée de vie (jours)
      this.life2 = o.life2 || !o.lifespan;                 // (déjà à la durée de vie de 30 jours)
      this.slept = o.slept != null ? o.slept : this.born;  // dernier sommeil
      this.sick = o.sick || 0; this.hurt = o.hurt || 0;    // maladie, blessure
      this.germs = o.germs || 0;                           // négligences accumulées (risque de maladie, voir life.js)
      this.moves = o.moves ? o.moves.map(m => ({ id: m.id })) : this.defaultMoves();
      this.nick = o.nick || null;
      this.uid = o.uid || Math.random().toString(36).slice(2, 10);
      this.status = null; this.slp = 0;
      this.hp = this.maxHp;
      this.mp = o.mp != null ? Math.min(o.mp, this.maxMp) : this.maxMp;
    }
    get d() { return DW.SPECIES[this.sp]; }
    get name() { return this.nick || this.d.name; }
    // échelle façon Digimon World : PV et PM en milliers (max 9999), autres stats en centaines (max 999)
    // (le calcul « brut » reste celui d'origine, puis il est multiplié par DW.SCALE)
    // bonus d'entraînement non arrondi : multiplié par DW.SCALE, chaque point se voit sur la stat (+6 PV, +1 Attaque...)
    // entraînement (tr : compte pour les Digivolutions), entraînement « Statistique » (raw : stat directe), puces
    bonus(k) { const t = (this.tr && this.tr[k]) || 0, r = (this.raw && this.raw[k]) || 0; return t * this.level / 100 + t / 3 + r * 0.8 + ((this.chips && this.chips[k]) || 0); }
    // STADE : un vrai fossé entre les stades (un Champion écrase un Disciple du même niveau), comme dans Digimon World
    get stageMult() { return DW.STAGE_MULT[this.d.stage] || 1; }
    stat(k) {
      if (k === 'mp') return this.maxMp;
      const S = DW.SCALE, b = this.d.base[k] || 50, iv = this.iv[k] || 0, bonus = this.bonus(k), g = this.stageMult;
      if (k === 'hp') return Math.min(S.capHp, Math.floor((Math.floor((2 * b + iv) * this.level / 100) + this.level + 10 + bonus) * S.hp * g));
      return Math.min(S.capStat, Math.floor((Math.floor((2 * b + iv) * this.level / 100) + 5 + bonus) * S.stat * g));
    }
    get maxHp() { return this.stat('hp'); }
    // PM : dépendent de l'Intelligence et du niveau, et de l'entraînement PM ; rendus par le repos et le sommeil
    get maxMp() { const S = DW.SCALE, b = this.d.base.int || 50, iv = this.iv.int || 0; return Math.min(S.capHp, Math.floor((Math.floor((2 * b + iv) * this.level / 100) + this.level + 10 + this.bonus('mp')) * S.mp)); }
    canPay(id) { return this.mp >= DW.mpCost(id); }
    // âge en jours de jeu depuis l'arrivée dans l'équipe
    get age() { return Math.max(0, Math.floor(((DW.state ? DW.state.clock : 0) - this.born) / 1440)); }
    get weight() { return Math.max(1, Math.round(this.d.kg * (1 + (this.level - 5) * 0.01) * (1 + (this.fat || 0) * 0.04))); }
    addHappy(n) { this.happy = DW.clamp(this.happy + n, 0, 100); }
    defaultMoves() {
      const ids = [];
      for (const [l, m] of this.d.learn) if (l <= this.level && !ids.includes(m)) ids.push(m);
      return ids.slice(-DW.MAX_MOVES).map(id => ({ id }));
    }
    knows(id) { return this.moves.some(m => m.id === id); }
    heal() {
      this.hp = this.maxHp; this.mp = this.maxMp; this.status = null; this.slp = 0; this.tired = 0;
    }
    xpRatio() {
      const a = DW.xpForLevel(this.level), b = DW.xpForLevel(this.level + 1);
      return (this.xp - a) / Math.max(1, b - a);
    }
    addXp(n) {
      const ev = [];
      this.xp += n;
      while (this.level < 100 && this.xp >= DW.xpForLevel(this.level + 1)) {
        const oldMax = this.maxHp, oldMp = this.maxMp;
        const before = this.stats();
        this.level++;
        if (this.hp > 0) this.hp += this.maxHp - oldMax;
        this.mp += this.maxMp - oldMp;
        ev.push({ type: 'level', level: this.level, before });
        for (const [l, m] of this.d.learn) if (l === this.level && !this.knows(m)) ev.push({ type: 'learn', move: m });
      }
      return ev;
    }
    stats() { return { hp: this.maxHp, mp: this.maxMp, atk: this.stat('atk'), def: this.stat('def'), spd: this.stat('spd'), int: this.stat('int') }; }
    // première Digivolution dont toutes les conditions sont remplies
    evoTarget() {
      const a = DW.Evo.available(this);
      return a.length ? a[0].to : null;
    }
    evolve(to) {
      const oldMax = this.maxHp;
      // ABI (Cyber Sleuth) : +1 en digivoluant, +2 en dé-digivoluant (le stade d'arrivée est plus bas)
      const ST = ['Bébé', 'Entraînement', 'Disciple', 'Champion', 'Ultime', 'Méga'];
      this.abi = (this.abi || 0) + (ST.indexOf(DW.SPECIES[to].stage) < ST.indexOf(this.d.stage) ? 2 : 1);
      this.sp = to;
      this.evoAt = DW.state ? DW.state.clock : 0;
      this.hp = DW.clamp(this.hp + (this.maxHp - oldMax), 1, this.maxHp);
    }
    toJSON() {
      return { sp: this.sp, level: this.level, xp: this.xp, iv: this.iv, moves: this.moves, hp: this.hp,
        status: this.status, slp: this.slp, nick: this.nick, uid: this.uid, happy: this.happy, born: this.born, wins: this.wins, tr: this.tr, tired: this.tired, hunger: Math.round(this.hunger), need: Math.round(this.need), thirst: Math.round(this.thirst || 0), mp: this.mp,
        mistakes: this.mistakes, kos: this.kos || 0, disc: this.disc, fat: this.fat, lives: this.lives, lifespan: this.lifespan, life2: !!this.life2, slept: this.slept, sick: this.sick, hurt: this.hurt, germs: Math.round(this.germs || 0), chips: this.chips, evoAt: this.evoAt, abi: this.abi || 0, raw: this.raw || {} };
    }
    static from(o) {
      const m = new Digimon(o.sp, o.level, o);
      m.xp = o.xp; m.hp = o.hp; m.status = o.status || null; m.slp = o.slp || 0;
      return m;
    }
  }
  DW.Digimon = Digimon;

  // ------------------------------------------------------------ apprentissage d'attaque (6 techniques au maximum)
  DW.MAX_MOVES = 6;
  DW.learnMove = async (mon, id) => {
    const mv = DW.MOVES[id];
    if (mon.knows(id)) return;
    if (mon.moves.length < DW.MAX_MOVES) {
      mon.moves.push({ id });
      DW.Audio.sfx('levelup');
      await DW.say(`${mon.name} apprend ${mv.name} !`);
      return;
    }
    await DW.say(`${mon.name} veut apprendre ${mv.name}... Mais ${mon.name} connaît déjà ${DW.MAX_MOVES} techniques.`);
    const r = await DW.ask(`Oublier une attaque pour apprendre ${mv.name} ?`);
    if (r === 0) {
      // écran de comparaison : avantages et inconvénients de chaque échange
      const i = await DW.Game.push(new DW.ForgetScene(mon, id));
      if (i >= 0 && i < DW.MAX_MOVES) {
        const old = DW.MOVES[mon.moves[i].id].name;
        mon.moves[i] = { id };
        DW.Audio.sfx('levelup');
        await DW.say(`1, 2 et... Tadaa ! ${mon.name} oublie ${old} et apprend ${mv.name} !`);
        return;
      }
    }
    await DW.say(`${mon.name} n'a pas appris ${mv.name}.`);
  };

  // ------------------------------------------------------------ objets
  const STAGES = ['Bébé', 'Entraînement', 'Disciple', 'Champion', 'Ultime', 'Méga'];
  // l'objet a-t-il un effet sur ce Digimon ? (battle : utilisé pendant un combat)
  DW.canUse = (id, m, battle) => {
    const it = DW.ITEMS[id];
    switch (it.use) {
      case 'heal': {
        if (m.hp <= 0) return false;
        // nourriture : hors combat seulement, quand il a faim (ou soif, ou pour un effet spécial)
        if (it.food != null) return !battle && (m.hunger >= 5 || (it.drink && (m.thirst || 0) >= 5) || !!(it.chip || it.boost || it.disc || it.happy || it.tired || it.life || it.fat < 0));
        const special = it.chip || it.boost || it.disc || it.happy || it.fat || it.tired || it.life;
        return m.hp < m.maxHp || (it.mp || it.mpFull) && m.mp < m.maxMp || (it.cure && m.status) || (!battle && (m.hunger >= 5 || special));
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
      default: return false;
    }
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
      if (it.drink) { m.thirst = Math.max(0, (m.thirst || 0) - it.drink); txt.push('soif étanchée'); }
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
      return `${m.name} ${it.drink ? 'boit à grandes gorgées' : it.food ? 'mange avec appétit' : 'utilise ' + it.name}${fed ? ' (faim apaisée)' : ''}${txt.length ? ' : ' + txt.join(', ') : ''} !`;
    }
    if (it.use === 'cure') { m.status = null; m.slp = 0; return `${m.name} est en pleine forme !`; }
    if (it.use === 'revive') { m.hp = it.full ? m.maxHp : Math.floor(m.maxHp / 2); if (it.full) m.mp = m.maxMp; m.status = null; return `${m.name} reprend connaissance !`; }
    if (it.use === 'sick') { const was = m.sick || m.hurt; m.sick = 0; m.hurt = 0; m.germs = 0; m.addHappy(2); return was ? `${m.name} est guéri !` : `${m.name} reprend des couleurs. Il ne tombera pas malade !`; }
    if (it.use === 'hurt') { m.hurt = 0; return `La blessure de ${m.name} est soignée !`; }
    if (it.use === 'chip') return `${m.name} absorbe la puce : ${applyChips(m, it.chip)} !`;
    return '';
  };
  DW.ITEM_STAGES = STAGES;
  // prochaine technique de l'espèce que le Digimon ne connaît pas encore (Manuel de technique)
  DW.nextMove = m => { for (const [l, id] of m.d.learn) if (l > 0 && !m.knows(id) && DW.MOVES[id]) return id; return null; };
  // SAC DE VOYAGE (comme Digimon World 1) : 10 exemplaires de chaque objet, et un nombre limité de SORTES d'objets
  // (10 places, +4 avec chaque Grand sac acheté au Bazar). Plein : on ne peut plus rien ramasser, il faut
  // passer à la maison (coffre : tout sauf la nourriture ; frigo : la nourriture) ou à la Banque de Kunemon.
  DW.BAG_MAX = 10;
  DW.bagSlots = () => 10 + (DW.Home && DW.Home.owned('sac1') ? 4 : 0) + (DW.Home && DW.Home.owned('sac2') ? 4 : 0);
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

  // ------------------------------------------------------------ état de partie & sauvegarde
  // Trois emplacements : la sauvegarde, la copie précédente (écrite juste avant chaque sauvegarde)
  // et une copie « illisible » mise de côté si le chargement échoue (jamais écrasée par une nouvelle partie).
  // 3 emplacements de sauvegarde (DW.slot = 1, 2 ou 3) ; l'emplacement 1 garde le nom d'origine (anciennes parties)
  const BASE = 'digimon_ile_des_fichiers_save';
  DW.slot = 1; DW.SLOTS = 3;
  const keyOf = n => (n > 1 ? BASE + '_' + n : BASE);
  const K = { get KEY() { return keyOf(DW.slot); }, get BAK() { return keyOf(DW.slot) + '_precedente'; }, get BROKEN() { return keyOf(DW.slot) + '_illisible'; } };
  // échelle des statistiques (façon Digimon World 1) : PV/PM ×20 jusqu'à 9999, Attaque/Défense/Vitesse/Intelligence ×4 jusqu'à 999
  DW.SCALE = { hp: 20, mp: 20, stat: 4, capHp: 9999, capStat: 999 };
  // réglages d'équilibrage des combats (mesurés avec un simulateur : 4 à 6 tours à niveau égal, ~50 % des PV restants)
  // wildDmg : les Digimon sauvages frappent moins fort (le partenaire élevé avec soin domine sa zone, comme dans Digimon World 1)
  // lvGap : ±6 % de dégâts par niveau d'écart entre l'attaquant et sa cible (borné ×0,7 – ×1,5) : grandir compte, même au début
  DW.STAGE_MULT = { 'Bébé': 0.85, 'Entraînement': 0.92, 'Disciple': 1, 'Champion': 1.55, 'Ultime': 2, 'Méga': 2.5 };
  DW.BALANCE = { dmg: 0.6, wildDmg: 0.8, lvGap: 0.06 };   // wildDmg 0,9 → 0,8 après la partie test du chapitre 1 (dev/playtest.js)
  DW.SAVE_V = 5; // v2 : Digimon sauvages visibles, Engrenages Noirs, puces, règles DW1 — v3 : « obtenus » (owned), plus de PP — v4 : cartes faites à la main agrandies ×2 — v5 : PV / PM en milliers (×20)
  DW.newState = () => ({
    name: 'Tai', hero: 'tai', party: [], box: [], bag: {}, bits: 300, flags: {}, seen: {}, owned: {},
    map: 'maison', x: 12, y: 5, dir: 'down', heal: { map: 'maison', x: 12, y: 5 }, time: 0, recruits: {},
    clock: 8 * 60, weather: { type: 'clear', until: 12 * 60 }, visited: {}, zoneSeen: {}, poops: {}, bank: {}, wildGone: {}, gears: {}, daily: {},
    orphans: [], v: DW.SAVE_V,
  });
  DW.state = DW.newState();
  DW.addDigimon = mon => {
    const st = DW.state;
    st.seen[mon.sp] = st.owned[mon.sp] = true;
    if (st.party.length < 6) { st.party.push(mon); return 'party'; }
    st.box.push(mon); return 'box';
  };
  const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  // supprimer un emplacement (la sauvegarde et sa copie précédente)
  DW.deleteSave = n => { const keep = DW.slot; DW.slot = n; try { localStorage.removeItem(K.KEY); localStorage.removeItem(K.BAK); } catch (e) { /* stockage indisponible */ } finally { DW.slot = keep; } };
  // résumé affiché sur l'écran titre
  DW.saveInfo = (slot = DW.slot) => {
    const keep = DW.slot; DW.slot = slot;
    try {
      const o = JSON.parse(read(K.KEY) || read(K.BAK));
      if (!o) return null;
      const m = DW.MAPS[o.map], lead = o.party && o.party[0];
      return { name: o.name, time: o.time || 0, place: m ? m.name : '?', partner: lead && DW.SPECIES[lead.sp] ? lead.sp : null,
        level: lead ? lead.level : 0, dex: Object.keys(o.owned || o.caught || {}).length, day: Math.floor((o.clock || 0) / 1440) + 1, savedAt: o.savedAt };
    } catch (e) { return null; } finally { DW.slot = keep; }
  };
  // sauvegarde automatique silencieuse (changement de zone, après un combat)
  const warnedFlags = new Set();
  DW.autosave = () => { if (DW.state.flags.starter) { DW.save(); DW.saveFlash = 2; } };
  DW.hasSave = () => !!(read(K.KEY) || read(K.BAK));
  DW.save = () => {
    const st = DW.state;
    if (DW.ow) { st.map = DW.ow.mapId; st.x = DW.ow.p.x; st.y = DW.ow.p.y; st.dir = DW.ow.p.dir; }
    st.savedAt = Date.now();
    const unknown = Object.keys(st.flags).filter(k => DW.flagKnown && !DW.flagKnown(k) && !warnedFlags.has(k));
    if (unknown.length) { unknown.forEach(k => warnedFlags.add(k)); console.warn('Drapeaux non déclarés dans js/data/flags.js :', unknown.join(', ')); }
    let json;
    try { json = JSON.stringify(st); } catch (e) { DW.reportError(e, 'sauvegarde'); return false; }
    const old = read(K.KEY);
    if (old && old !== json) write(K.BAK, old);
    return write(K.KEY, json);
  };

  // Digimon d'une sauvegarde : une espèce ou une technique disparue du jeu ne doit pas tout casser.
  // Un Digimon d'espèce inconnue est gardé tel quel dans st.orphans (et rendu si l'espèce revient).
  function revive(o) {
    if (!o || !DW.SPECIES[o.sp]) return null;
    const moves = (o.moves || []).filter(m => m && DW.MOVES[m.id]).map(m => ({ id: m.id }));
    const m = Digimon.from({ ...o, moves: moves.length ? moves : null });
    if (!Number.isFinite(m.hp)) m.hp = m.maxHp;
    m.hp = DW.clamp(m.hp, 0, m.maxHp);
    return m;
  }
  function parseState(raw) {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') throw new Error('sauvegarde vide');
    const st = Object.assign(DW.newState(), o);
    if (!DW.MAPS[st.map]) Object.assign(st, { map: 'maison', x: 12, y: 5 });
    if (!st.heal || !DW.MAPS[st.heal.map]) st.heal = { map: 'maison', x: 12, y: 5 };
    st.recruits = st.recruits || {}; st.flags = st.flags || {}; st.bag = st.bag || {}; st.bank = st.bank || {};
    // migration des anciennes sauvegardes
    const v = o.v || 1;
    if (v < 2) { st.wildGone = {}; st.gears = st.gears || {}; }
      for (const k of ['autoEvo', 'solo']) delete st.flags[k];   // anciennes règles au choix (retirées)
    if (v < 3) { st.owned = Object.assign({}, o.caught || {}, o.owned || {}); delete st.caught; }
    if (v < 4) {   // positions sur les cartes agrandies ×2 (MapKit.ZOOM)
      const Zm = DW.MapKit.ZOOM, zp = (id, x, y) => DW.MapKit.zpt(id, x, y);
      if (Zm[st.map]) [st.x, st.y] = zp(st.map, st.x, st.y);
      if (Zm[st.heal.map]) [st.heal.x, st.heal.y] = zp(st.heal.map, st.heal.x, st.heal.y);
      for (const id in st.poops || {}) if (Zm[id]) st.poops[id] = st.poops[id].map(([x, y]) => zp(id, x, y));
    }
    st.v = DW.SAVE_V;
    for (const box of [st.bag, st.bank, st.fridge || {}]) for (const k in box) if (!DW.ITEMS[k]) delete box[k];
    const orphans = (st.orphans || []).slice();
    st.orphans = [];
    // v5 : PV et PM passent à l'échelle Digimon World (×20) ; les PV restants suivent
    if (v < 5) for (const x of [...(o.party || []), ...(o.box || []), ...orphans]) if (x) { if (Number.isFinite(x.hp)) x.hp *= DW.SCALE.hp; if (Number.isFinite(x.mp)) x.mp *= DW.SCALE.mp; }
    const keep = list => list.map(x => { const m = revive(x); if (!m && x) st.orphans.push(x); return m; }).filter(Boolean);
    st.party = keep(o.party || []);
    st.box = keep(o.box || []).concat(keep(orphans));   // espèce revenue dans le jeu : retour dans la boîte
    if (!st.party.length && st.box.length) st.party.push(st.box.shift());
    return st;
  }
  // message à afficher après le chargement (copie de secours utilisée, Digimon mis de côté...)
  DW.loadNote = null;
  DW.load = () => {
    DW.loadNote = null;
    const main = read(K.KEY);
    try {
      if (!main) throw new Error('aucune sauvegarde');
      DW.state = parseState(main);
    } catch (e) {
      const bak = read(K.BAK);
      if (main) { write(K.BROKEN, main); DW.reportError(e, 'chargement'); }
      try { DW.state = parseState(bak); } catch (e2) { return false; }
      DW.loadNote = 'La dernière sauvegarde était illisible : la sauvegarde précédente a été chargée (l\'autre est conservée à part).';
    }
    if (DW.state.orphans.length) {
      const n = DW.state.orphans.length;
      DW.loadNote = (DW.loadNote ? DW.loadNote + ' ' : '') +
        `${n} Digimon d'une espèce absente de cette version ${n > 1 ? 'sont mis' : 'est mis'} de côté (rien n'est perdu).`;
    }
    return true;
  };
})();
