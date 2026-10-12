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
      this.tr = Object.assign({ hp: 0, atk: 0, def: 0, spd: 0, int: 0 }, o.tr || {}); // points d'entraînement
      this.chips = Object.assign({ hp: 0, atk: 0, def: 0, spd: 0, int: 0 }, o.chips || {}); // puces (bonus permanents)
      this.tired = o.tired || 0;                                                     // fatigue 0-100
      this.hunger = o.hunger || 0; this.need = o.need || 0;                          // faim / toilettes 0-100 (voir care.js)
      // vie (voir life.js) : erreurs de soin, discipline, corpulence, renaissances, durée de vie, sommeil, maladie, blessure
      this.mistakes = o.mistakes || 0; this.disc = o.disc != null ? o.disc : 40; this.fat = o.fat || 0; this.lives = o.lives || 0;
      this.lifespan = o.lifespan || 16; this.slept = o.slept != null ? o.slept : this.born; this.sick = o.sick || 0; this.hurt = o.hurt || 0;
      this.moves = o.moves ? o.moves.map(m => ({ ...m })) : this.defaultMoves();
      this.nick = o.nick || null;
      this.uid = o.uid || Math.random().toString(36).slice(2, 10);
      this.status = null; this.slp = 0;
      this.hp = this.maxHp;
      this.mp = o.mp != null ? Math.min(o.mp, this.maxMp) : this.maxMp;
    }
    get d() { return DW.SPECIES[this.sp]; }
    get name() { return this.nick || this.d.name; }
    stat(k) {
      const b = this.d.base[k] || 50, iv = this.iv[k] || 0;
      const t = (this.tr && this.tr[k]) || 0, bonus = Math.floor(t * this.level / 100) + Math.round(t / 3) + ((this.chips && this.chips[k]) || 0);
      if (k === 'hp') return Math.floor((2 * b + iv) * this.level / 100) + this.level + 10 + bonus;
      return Math.floor((2 * b + iv) * this.level / 100) + 5 + bonus;
    }
    get maxHp() { return this.stat('hp'); }
    // PM : dépendent de l'Intelligence et du niveau ; rendus par le repos et le sommeil
    get maxMp() { const b = this.d.base.int || 50, iv = this.iv.int || 0; return Math.floor((2 * b + iv) * this.level / 100) + this.level + 10; }
    canPay(id) { return this.mp >= DW.mpCost(id); }
    // âge en jours de jeu depuis l'arrivée dans l'équipe
    get age() { return Math.max(0, Math.floor(((DW.state ? DW.state.clock : 0) - this.born) / 1440)); }
    get weight() { return Math.max(1, Math.round(this.d.kg * (1 + (this.level - 5) * 0.01) * (1 + (this.fat || 0) * 0.04))); }
    addHappy(n) { this.happy = DW.clamp(this.happy + n, 0, 100); }
    defaultMoves() {
      const ids = [];
      for (const [l, m] of this.d.learn) if (l <= this.level && !ids.includes(m)) ids.push(m);
      return ids.slice(-DW.MAX_MOVES).map(id => ({ id, pp: DW.MOVES[id].pp }));
    }
    knows(id) { return this.moves.some(m => m.id === id); }
    heal() {
      this.hp = this.maxHp; this.mp = this.maxMp; this.status = null; this.slp = 0; this.tired = 0;
      this.moves.forEach(m => (m.pp = DW.MOVES[m.id].pp));
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
    stats() { return { hp: this.maxHp, atk: this.stat('atk'), def: this.stat('def'), spd: this.stat('spd'), int: this.stat('int') }; }
    // première Digivolution dont toutes les conditions sont remplies
    evoTarget() {
      const a = DW.Evo.available(this);
      return a.length ? a[0].to : null;
    }
    evolve(to) {
      const oldMax = this.maxHp;
      this.sp = to;
      this.evoAt = DW.state ? DW.state.clock : 0;
      this.hp = DW.clamp(this.hp + (this.maxHp - oldMax), 1, this.maxHp);
    }
    toJSON() {
      return { sp: this.sp, level: this.level, xp: this.xp, iv: this.iv, moves: this.moves, hp: this.hp,
        status: this.status, slp: this.slp, nick: this.nick, uid: this.uid, happy: this.happy, born: this.born, wins: this.wins, tr: this.tr, tired: this.tired, hunger: Math.round(this.hunger), need: Math.round(this.need), mp: this.mp,
        mistakes: this.mistakes, disc: this.disc, fat: this.fat, lives: this.lives, lifespan: this.lifespan, slept: this.slept, sick: this.sick, hurt: this.hurt, chips: this.chips, evoAt: this.evoAt };
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
      mon.moves.push({ id, pp: mv.pp });
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
        mon.moves[i] = { id, pp: mv.pp };
        DW.Audio.sfx('levelup');
        await DW.say(`1, 2 et... Tadaa ! ${mon.name} oublie ${old} et apprend ${mv.name} !`);
        return;
      }
    }
    await DW.say(`${mon.name} n'a pas appris ${mv.name}.`);
  };

  // ------------------------------------------------------------ objets
  DW.canUse = (id, m, battle) => {
    const it = DW.ITEMS[id];
    if (it.use === 'heal') return m.hp > 0 && (m.hp < m.maxHp || (!battle && m.hunger >= 5));
    if (it.use === 'cure') return m.hp > 0 && !!m.status;
    if (it.use === 'revive') return m.hp <= 0;
    if (it.use === 'sick') return !!m.sick;
    if (it.use === 'hurt') return !!m.hurt;
    if (it.use === 'chip') return !battle && m.chips[it.stat] < 20;
    if (it.use === 'mp') return m.hp > 0 && m.mp < m.maxMp;
    if (it.use === 'manual') return !battle && !!DW.nextMove(m);
    return false;
  };
  // applique l'objet et renvoie le message
  DW.useItem = (id, m) => {
    const it = DW.ITEMS[id], st = DW.state;
    st.bag[id] = Math.max(0, (st.bag[id] || 0) - 1);
    if (it.use === 'heal') {
      const before = m.hp;
      m.hp = Math.min(m.maxHp, m.hp + it.amt);
      const fed = DW.Care && DW.Care.feed(m, it.food || 0);
      if (it.happy) m.addHappy(it.happy);
      if (it.disc && DW.Life) DW.Life.addDisc(m, it.disc);
      if (it.fat && DW.Life) DW.Life.addFat(m, it.fat);
      if (it.risky && Math.random() < 0.2) { m.status = 'psn'; return `${m.name} mange le champignon... Beurk, il était vénéneux !`; }
      return `${m.name} mange avec appétit${m.hp > before ? ` et récupère ${m.hp - before} PV` : ''}${fed ? ' (faim apaisée)' : ''} !`;
    }
    if (it.use === 'cure') { m.status = null; m.slp = 0; return `${m.name} est en pleine forme !`; }
    if (it.use === 'revive') { m.hp = Math.floor(m.maxHp / 2); m.status = null; return `${m.name} reprend connaissance !`; }
    if (it.use === 'sick') { m.sick = 0; m.addHappy(2); return `${m.name} n'est plus malade !`; }
    if (it.use === 'hurt') { m.hurt = 0; return `La blessure de ${m.name} est soignée !`; }
    if (it.use === 'chip') { const hp0 = m.maxHp; m.chips[it.stat] += it.amt; if (it.stat === 'hp') m.hp += m.maxHp - hp0; return `${m.name} absorbe la puce : ${DW.Training.STATS[it.stat].stat} +${it.amt} !`; }
    if (it.use === 'mp') { const b = m.mp; m.mp = Math.min(m.maxMp, m.mp + it.amt); return `${m.name} récupère ${m.mp - b} PM !`; }
    return '';
  };
  // prochaine technique de l'espèce que le Digimon ne connaît pas encore (Manuel de technique)
  DW.nextMove = m => { for (const [l, id] of m.d.learn) if (l > 0 && !m.knows(id) && DW.MOVES[id]) return id; return null; };
  // sac : 10 exemplaires de chaque objet au maximum ; le surplus est mis de côté à la Banque
  DW.BAG_MAX = 10;
  DW.bagRoom = id => Math.max(0, DW.BAG_MAX - (DW.state.bag[id] || 0));
  // renvoie le nombre d'objets mis de côté (0 si tout tient dans le sac)
  DW.giveItem = (id, n = 1) => {
    const st = DW.state, add = Math.min(n, DW.bagRoom(id)), extra = n - add;
    st.bag[id] = (st.bag[id] || 0) + add;
    if (extra > 0) { st.bank = st.bank || {}; st.bank[id] = (st.bank[id] || 0) + extra; }
    return extra;
  };
  DW.extraMsg = extra => (extra ? `  (Sac plein : ${extra} mis de côté${DW.Town && DW.Town.has('kunemon') ? ' à la Banque' : ''}.)` : '');

  // ------------------------------------------------------------ état de partie & sauvegarde
  const KEY = 'digimon_ile_des_fichiers_save';
  DW.SAVE_V = 2; // v2 : Digimon sauvages visibles, Engrenages Noirs, puces, règles DW1
  DW.newState = () => ({
    name: 'Tai', hero: 'tai', party: [], box: [], bag: {}, bits: 300, flags: {}, seen: {}, caught: {},
    map: 'maison', x: 12, y: 5, dir: 'down', heal: { map: 'maison', x: 12, y: 5 }, time: 0, recruits: {},
    clock: 8 * 60, weather: { type: 'clear', until: 12 * 60 }, visited: {}, zoneSeen: {}, poops: {}, bank: {}, wildGone: {}, gears: {}, daily: {}, v: DW.SAVE_V,
  });
  DW.state = DW.newState();
  DW.addDigimon = mon => {
    const st = DW.state;
    st.seen[mon.sp] = st.caught[mon.sp] = true;
    if (st.party.length < (DW.partyMax ? DW.partyMax() : 6)) { st.party.push(mon); return 'party'; }
    st.box.push(mon); return 'box';
  };
  // résumé affiché sur l'écran titre
  DW.saveInfo = () => {
    try {
      const o = JSON.parse(localStorage.getItem(KEY));
      if (!o) return null;
      const m = DW.MAPS[o.map];
      return { name: o.name, time: o.time || 0, place: m ? m.name : '?', partner: o.party && o.party[0] ? o.party[0].sp : null,
        level: o.party && o.party[0] ? o.party[0].level : 0, dex: Object.keys(o.caught || {}).length, day: Math.floor((o.clock || 0) / 1440) + 1, savedAt: o.savedAt };
    } catch (e) { return null; }
  };
  // sauvegarde automatique silencieuse (changement de zone, après un combat)
  DW.autosave = () => { if (DW.state.flags.starter) { DW.save(); DW.saveFlash = 2; } };
  DW.hasSave = () => { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };
  DW.save = () => {
    const st = DW.state;
    if (DW.ow) { st.map = DW.ow.mapId; st.x = DW.ow.p.x; st.y = DW.ow.p.y; st.dir = DW.ow.p.dir; }
    st.savedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; }
  };
  DW.load = () => {
    try {
      const o = JSON.parse(localStorage.getItem(KEY));
      if (!o) return false;
      const st = Object.assign(DW.newState(), o);
      if (!DW.MAPS[st.map]) Object.assign(st, { map: 'maison', x: 12, y: 5 });
      if (!DW.MAPS[st.heal.map]) st.heal = { map: 'maison', x: 12, y: 5 };
      st.recruits = st.recruits || {};
      // migration des anciennes sauvegardes
      if ((o.v || 1) < 2) { st.flags.autoEvo = !!st.flags.autoEvo; st.flags.solo = !!st.flags.solo; st.wildGone = {}; st.gears = st.gears || {}; }
      st.v = DW.SAVE_V;
      for (const box of [st.bag, st.bank || {}]) for (const k in box) if (!DW.ITEMS[k]) delete box[k];
      st.party = (o.party || []).map(Digimon.from);
      st.box = (o.box || []).map(Digimon.from);
      DW.state = st;
      return true;
    } catch (e) { return false; }
  };
})();
