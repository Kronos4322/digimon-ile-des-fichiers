'use strict';
// =====================================================================
//  DIGIMON : instance, stats, expérience, attaques ; réglages d'équilibrage (échelle, stades)
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
      this.parcours = (o.parcours || []).slice();          // formes passées, la plus ancienne d'abord (renaissance, dé-digivolution)
      this.wins = o.wins || 0;
      this.tr = Object.assign({ hp: 0, mp: 0, atk: 0, def: 0, spd: 0, int: 0 }, o.tr || {}); // points d'entraînement
      this.chips = Object.assign({ hp: 0, mp: 0, atk: 0, def: 0, spd: 0, int: 0 }, o.chips || {}); // puces (bonus permanents)
      this.equip = Object.assign({}, o.equip || {});                                 // équipement porté { arme, armure, acc } (data/equipements.js)
      this.raw = Object.assign({}, o.raw || {});                                    // entraînement « Statistique »
      this.res = Object.assign({}, o.res || {});                                    // résistances aux éléments (Gymnase, maps/gymnase.js)
      this.abi = o.abi || 0;                                                         // ABI : repousse les plafonds d'entraînement
      this.tired = o.tired || 0;                                                     // fatigue 0-100
      this.hunger = o.hunger || 0; this.need = o.need || 0; this.thirst = o.thirst || 0;                          // faim / toilettes 0-100 (voir care.js)
      // vie (voir life.js) : erreurs de soin, discipline, corpulence, renaissances, durée de vie, sommeil, maladie, blessure
      this.mistakes = o.mistakes || 0;                     // erreurs de soin
      this.disc = o.disc != null ? o.disc : 40;            // discipline
      this.fat = o.fat || 0;                               // corpulence
      this.lives = o.lives || 0;                           // renaissances
      this.kos = o.kos || 0;                               // K.O. en combat (au 3e, il meurt : game/life.js)
      this.lifespan = o.lifespan || 30;                    // durée de vie (jours)
      this.life2 = o.life2 || !o.lifespan;                 // (déjà à la durée de vie de 30 jours)
      this.slept = o.slept != null ? o.slept : this.born;  // dernier sommeil
      this.sick = o.sick || 0; this.hurt = o.hurt || 0;    // maladie, blessure
      this.germs = o.germs || 0;                           // négligences accumulées (risque de maladie, voir life.js)
      this.boost = o.boost || 0;                           // bonus de la prochaine séance d'entraînement (Super carotte, Tai...)
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
    bonus(k) { const t = (this.tr && this.tr[k]) || 0, r = (this.raw && this.raw[k]) || 0; return t * this.level / 100 + t / 3 + r * 0.8 + ((this.chips && this.chips[k]) || 0) + (DW.equipBonus ? DW.equipBonus(this, k) : 0); }
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
        // (les techniques ne s'apprennent plus en montant de niveau : voir DW.tryLearn, selon l'Intelligence et le hasard)
      }
      return ev;
    }
    stats() { return { hp: this.maxHp, mp: this.maxMp, atk: this.stat('atk'), def: this.stat('def'), spd: this.stat('spd'), int: this.stat('int') }; }
    // première Digivolution dont toutes les conditions sont remplies
    evoTarget() {
      const a = DW.Evo.available(this);
      return a.length ? a[0].to : null;
    }
    // après un changement des PV / PM maximum (Digivolution, équipement) : PV et PM suivent l'écart, dans leurs bornes
    reajuster(hp0, mp0) {
      this.hp = DW.clamp(this.hp + this.maxHp - hp0, this.hp > 0 ? 1 : 0, this.maxHp);
      this.mp = DW.clamp(this.mp + this.maxMp - mp0, 0, this.maxMp);
    }
    evolve(to) {
      const hp0 = this.maxHp, mp0 = this.maxMp;
      // une forme obtenue est débloquée dans la table des Digivolutions (l'avoir seulement croisée ne suffit pas)
      if (DW.state) { DW.state.seen[to] = true; DW.state.owned = DW.state.owned || {}; DW.state.owned[to] = true; }
      // ABI (Cyber Sleuth) : +1 en digivoluant, +2 en dé-digivoluant (le stade d'arrivée est plus bas)
      const ST = ['Bébé', 'Entraînement', 'Disciple', 'Champion', 'Ultime', 'Méga'];
      const bas = ST.indexOf(DW.SPECIES[to].stage) < ST.indexOf(this.d.stage);
      this.abi = (this.abi || 0) + (bas ? 2 : 1);
      // parcours : une dé-digivolution revient sur ses pas (les formes d'avant restent connues)
      if (bas) { const i = this.parcours.lastIndexOf(to); this.parcours = i >= 0 ? this.parcours.slice(0, i) : []; }
      else this.parcours.push(this.sp);
      this.sp = to;
      this.evoAt = DW.state ? DW.state.clock : 0;
      this.reajuster(hp0, mp0);   // (une dé-digivolution laissait des PM au-dessus du maximum)
    }
    toJSON() {
      return { sp: this.sp, level: this.level, xp: this.xp, iv: this.iv, moves: this.moves, hp: this.hp,
        status: this.status, slp: this.slp, nick: this.nick, uid: this.uid, happy: this.happy, born: this.born, wins: this.wins, tr: this.tr, tired: this.tired, hunger: Math.round(this.hunger), need: Math.round(this.need), thirst: Math.round(this.thirst || 0), mp: this.mp,
        mistakes: this.mistakes, kos: this.kos || 0, disc: this.disc, fat: this.fat, lives: this.lives, lifespan: this.lifespan, life2: !!this.life2, slept: this.slept, sick: this.sick, hurt: this.hurt, germs: Math.round(this.germs || 0), chips: this.chips, evoAt: this.evoAt, parcours: this.parcours, abi: this.abi || 0, raw: this.raw || {}, res: this.res || {}, equip: this.equip || {}, boost: this.boost || 0 };
    }
    static from(o) {
      const m = new Digimon(o.sp, o.level, o);
      m.xp = o.xp; m.hp = o.hp; m.status = o.status || null; m.slp = o.slp || 0;
      return m;
    }
  }
  DW.Digimon = Digimon;

  // ------------------------------------------------------------ apprentissage d'attaque (6 techniques au maximum ; true : apprise)
  DW.MAX_MOVES = 6;
  DW.learnMove = async (mon, id) => {
    const mv = DW.MOVES[id];
    if (mon.knows(id)) return false;
    if (mon.moves.length < DW.MAX_MOVES) {
      mon.moves.push({ id });
      DW.Audio.sfx('levelup');
      await DW.say(`${mon.name} apprend ${mv.name} !`);
      return true;
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
        return true;
      }
    }
    await DW.say(`${mon.name} n'a pas appris ${mv.name}.`);
    return false;
  };

  // ------------------------------------------------------------ équilibrage
  // échelle des statistiques (façon Digimon World 1) : PV/PM ×20 jusqu'à 9999, Attaque/Défense/Vitesse/Intelligence ×4 jusqu'à 999
  DW.SCALE = { hp: 20, mp: 20, stat: 4, capHp: 9999, capStat: 999 };
  // réglages d'équilibrage des combats (mesurés avec un simulateur : 4 à 6 tours à niveau égal, ~50 % des PV restants)
  // wildDmg : les Digimon sauvages frappent moins fort (le partenaire élevé avec soin domine sa zone, comme dans Digimon World 1)
  // lvGap : ±6 % de dégâts par niveau d'écart entre l'attaquant et sa cible (borné ×0,7 – ×1,5) : grandir compte, même au début
  DW.STAGE_MULT = { 'Bébé': 0.85, 'Entraînement': 0.92, 'Disciple': 1, 'Champion': 1.55, 'Ultime': 2, 'Méga': 2.5 };
  DW.BALANCE = { dmg: 0.6, wildDmg: 1.05, lvGap: 0.06 };   // wildDmg 0,8 → 1,05 : la partie test réaliste gagnait 47 combats sur 48 (dev/playtest.js)
})();
