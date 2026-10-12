'use strict';
// =====================================================================
//  COMBAT au tour par tour (logique Pokémon, ambiance Digimon World)
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const POS = { p: { x: 84, y: 176 }, e: { x: 236, y: 117 } };
  const FXCOL = {
    'Feu': ['#ff6a1a', '#ffd040'], 'Eau': ['#4aa8ff', '#e0f4ff'], 'Plante': ['#40c848', '#b8f878'],
    'Électrique': ['#ffe030', '#ffffff'], 'Glace': ['#98ecff', '#ffffff'], 'Terre': ['#9a6a38', '#d8a860'],
    'Air': ['#b8c8ff', '#ffffff'], 'Insecte': ['#98c020', '#e8f860'], 'Ténèbres': ['#6a3a8a', '#c890f0'],
    'Lumière': ['#fff0a0', '#ffffff'], 'Neutre': ['#ffffff', '#ffe0a0'],
  };
  const SFX = { 'Feu': 'fire', 'Eau': 'water', 'Électrique': 'elec', 'Plante': 'leaf', 'Glace': 'water' };
  const STAT_NAME = { atk: "L'Attaque", def: 'La Défense', spd: 'La Vitesse' };
  const ST_TXT = { brn: 'est brûlé', psn: 'est empoisonné', par: 'est paralysé', slp: "s'endort" };

  class BattleScene extends DW.Scene {
    constructor(o) {
      super();
      this.o = o; this.enemy = o.enemy; this.wild = !o.boss; this.st = DW.state;
      this.active = null; this.activeIdx = 0; this.parts = new Set(); this.runTries = 0;
      this.text = ''; this.shown = 0; this.mode = 'none'; this.cursor = 0; this.mcursor = 0;
      this.spr = {
        p: { dx: 0, dy: 0, alpha: 1, vis: false, scale: 1, white: 0, blink: 0 },
        e: { dx: 200, dy: 0, alpha: 1, vis: true, scale: 1, white: 0, blink: 0 },
      };
      this.hud = { p: false, e: false };
      this.hpShow = { p: 0, e: 0 }; this.xpShow = { v: 0 };
      this.fx = []; this.fxd = []; this.pt = []; this.shake = 0; this.flash = 0; this.bars = { v: 1 };
      this.weather = new DW.Time.Weather(); this.lvPanel = null;
      this.stages = { p: { atk: 0, def: 0, spd: 0 }, e: { atk: 0, def: 0, spd: 0 } };
      // jauge d'énergie (0-100) : se remplit en frappant et en encaissant ; pleine = coup spécial
      this.energy = { p: 0, e: 0 }; this.energyShow = { p: 0, e: 0 };
      this.seenMoves = new Set();   // techniques ennemies observées (apprentissage façon Digimon World)
      this.banner = null;
      this.bg = o.bg || 'foret';
      this.clouds = [0, 1, 2, 3].map(i => ({ x: i * 90 + Math.random() * 40, y: 10 + Math.random() * 30, s: 0.6 + Math.random() * 0.6 }));
    }
    enter() {
      this.run().then(async r => {
        this.mode = 'none';
        await DW.fade(1, 0.45);
        this.close(r);
        DW.fade(0, 0.45);
      });
    }
    mon(side) { return side === 'p' ? this.active : this.enemy; }
    label(side) { return side === 'e' && this.wild ? `${this.enemy.name} sauvage` : this.mon(side).name; }

    // ---------------------------------------------------------- messages & menus
    msg(t, auto = 1.1) {
      this.text = t; this.shown = 0; this.mode = 'msg'; this.msgT = 0; this.auto = auto;
      return new Promise(r => (this.msgR = r));
    }
    menu(mode) { this.mode = mode; return new Promise(r => (this.menuR = r)); }
    resolveMenu(v) { this.mode = 'none'; const r = this.menuR; this.menuR = null; r && r(v); }
    update(dt) {
      if (this.mode === 'msg') {
        const L = this.text.length;
        this.holdOk = Input.isDown('ok') ? (this.holdOk || 0) + dt : 0;
        const ff = DW.Options.fastForward(this.holdOk);
        if (this.shown < L) { this.shown += dt * DW.Options.cps() * 1.2 * (ff ? 4 : 1); if (Input.hit('ok')) this.shown = L; return; }
        this.msgT += dt;
        if (Input.hit('ok') || (this.auto && this.msgT > (ff ? 0.1 : this.auto))) {
          this.mode = 'none'; const r = this.msgR; this.msgR = null; r && r();
        }
      } else if (this.mode === 'cmd') {
        let c = this.cursor;
        if (Input.hit('left') || Input.hit('right')) c ^= 1;
        if (Input.hit('up') || Input.hit('down')) c ^= 2;
        if (c !== this.cursor) { this.cursor = c; Audio.sfx('move'); }
        if (Input.hit('ok')) { Audio.sfx('select'); this.resolveMenu(this.cursor); }
        if (Input.hit('back') && this.cursor !== 3) { this.cursor = 3; Audio.sfx('move'); }
      } else if (this.mode === 'moves') {
        const n = this.active.moves.length;
        let c = this.mcursor;
        if (Input.hit('left') || Input.hit('right')) c ^= 1;
        if (Input.hit('up')) c = (c - 2 + 6) % 6;
        if (Input.hit('down')) c = (c + 2) % 6;
        if (c < n && c !== this.mcursor) { this.mcursor = c; Audio.sfx('move'); }
        if (Input.hit('ok')) { Audio.sfx('select'); this.resolveMenu(this.mcursor); }
        if (Input.hit('menu') && this.energy.p >= 100 && DW.sigOf(this.active)) { Audio.sfx('evolve'); this.resolveMenu('special'); }
        if (Input.hit('back')) { Audio.sfx('back'); this.resolveMenu(-1); }
      }
    }

    // ---------------------------------------------------------- déroulement
    async run() {
      await this.intro();
      while (true) {
        const action = await this.playerTurn();
        if (action.type === 'run') {
          if (!this.wild) { await this.msg('Impossible de fuir ce combat !'); continue; }
          this.runTries++;
          const ps = this.eff('p', 'spd'), es = this.eff('e', 'spd');
          const ch = DW.clamp(0.5 + (ps - es) / (es * 2) + this.runTries * 0.12, 0.25, 1);
          if (Math.random() < ch) { Audio.sfx('run'); await this.msg('Tu prends la fuite !'); return 'run'; }
          await this.msg('Impossible de fuir !');
          const r = await this.enemyOnly();
          if (r) return r;
          continue;
        }
        const r = await this.doTurn(action);
        if (r) return r;
      }
    }
    async intro() {
      Audio.sfx('encounter');
      this.st.seen[this.enemy.sp] = true;
      this.hpShow.e = this.enemy.hp;
      await DW.tween(this.bars, { v: 0 }, 0.5);
      await DW.tween(this.spr.e, { dx: 0 }, 0.55);
      this.hud.e = true;
      await this.msg(this.o.intro || (this.wild ? `Un ${this.enemy.name} sauvage apparaît !` : `${this.enemy.name} attaque !`));
      const idx = this.st.party.findIndex(m => m.hp > 0);
      await this.sendOut(idx);
    }
    async sendOut(idx) {
      const m = this.st.party[idx];
      this.active = m; this.activeIdx = idx; this.parts.add(m);
      this.stages.p = { atk: 0, def: 0, spd: 0 };
      this.mcursor = 0;
      Object.assign(this.spr.p, { dx: -30, dy: 0, vis: true, white: 1, scale: 0.15, alpha: 1 });
      this.hpShow.p = m.hp; this.xpShow.v = m.xpRatio();
      const p = this.msg(`En avant, ${m.name} !`, 0.7);
      Audio.sfx('sendout');
      await DW.tween(this.spr.p, { dx: 0, scale: 1 }, 0.35);
      await DW.tween(this.spr.p, { white: 0 }, 0.25);
      this.hud.p = true;
      await p;
    }
    async withdraw() {
      await this.msg(`${this.active.name}, reviens !`, 0.6);
      this.hud.p = false;
      await DW.tween(this.spr.p, { white: 1 }, 0.15);
      await DW.tween(this.spr.p, { scale: 0.1, dx: -30 }, 0.25);
      this.spr.p.vis = false;
    }
    async playerTurn() {
      // mode « Ordres » (Digimon World 1) : le partenaire agit seul ; ESPACE pour reprendre la main
      if (DW.Options.battleMode === 1) {
        const P = this.active;
        this.text = `${P.name} se bat tout seul... (ESPACE : donner un ordre)`; this.shown = 999;
        let t = 0, take = false;
        while (t < 0.9) { await DW.wait(0.05); t += 0.05; if (DW.Input.isDown('ok')) { take = true; break; } }
        if (!take) return this.autoPick();
        while (DW.Input.isDown('ok')) await DW.wait(0.05);
      }
      while (true) {
        const P = this.active;
        this.text = `Que doit faire ${P.name} ?`; this.shown = 999;
        const c = await this.menu('cmd');
        if (c === 0) {
          if (P.moves.every(m => !P.canPay(m.id))) { await this.msg(`${P.name} n'a plus assez de PM !`); return { type: 'move', slot: -1 }; }
          if (this.mcursor >= P.moves.length) this.mcursor = 0;
          const m = await this.menu('moves');
          if (m === 'special') return { type: 'move', special: true };
          if (m < 0) continue;
          if (!P.canPay(P.moves[m].id)) { await this.msg(`Pas assez de PM ! (${DW.mpCost(P.moves[m].id)} PM nécessaires)`); continue; }
          return { type: 'move', slot: m };
        }
        if (c === 1) {
          const r = await Game.push(new DW.BagScene({ battle: true }));
          if (!r) continue;
          return { type: 'item', ...r };
        }
        if (c === 2) {
          const idx = await Game.push(new DW.PartyScene({ mode: 'switch', activeIdx: this.activeIdx }));
          if (idx == null || idx < 0) continue;
          return { type: 'switch', idx };
        }
        return { type: 'run' };
      }
    }
    // choix automatique du partenaire (mode « Ordres ») : coup spécial dès que possible, sinon la technique
    // la plus adaptée (efficacité, élément, soin quand il faut), en ménageant ses PM
    autoPick() {
      const P = this.active, E = this.enemy;
      if (this.energy.p >= 100 && DW.sigOf(P)) return { type: 'move', special: true, auto: true };
      const opts = P.moves.map((m, i) => ({ m, i })).filter(o => P.canPay(o.m.id));
      if (!opts.length) return { type: 'move', slot: -1, auto: true };
      const scored = opts.map(o => {
        const mv = DW.MOVES[o.m.id], cost = DW.mpCost(o.m.id);
        let w = mv.pow ? mv.pow * DW.typeMult(mv.type, E.d.types) * (P.d.types.includes(mv.type) ? 1.5 : 1) : 25;
        if (mv.heal) w = P.hp < P.maxHp * 0.4 ? 200 : 1;
        if (mv.st && !mv.pow && E.status) w = 2;
        if (P.mp < P.maxMp * 0.3) w /= 1 + cost / 4;
        return { o, w: Math.max(1, w * w) };
      });
      return { type: 'move', slot: DW.weighted(scored).o.i, auto: true };
    }
    aiPick() {
      const E = this.enemy, P = this.active;
      if (this.energy.e >= 100 && DW.sigOf(E) && Math.random() < 0.7) return { id: DW.sigOf(E), special: true };
      const usable = E.moves.filter(m => E.canPay(m.id));
      if (!usable.length) return { id: 'lutte' };
      const scored = usable.map(m => {
        const mv = DW.MOVES[m.id];
        let w = mv.pow ? mv.pow * DW.typeMult(mv.type, P.d.types) * (E.d.types.includes(mv.type) ? 1.5 : 1) : 35;
        if (mv.st && !mv.pow && P.status) w = 5;
        if (mv.heal) w = E.hp < E.maxHp * 0.45 ? 120 : 2;
        return { m, w: Math.max(1, w) };
      });
      return DW.weighted(scored).m;
    }
    async enemyOnly() {
      const em = this.aiPick();
      await this.useMove('e', em);
      return (await this.checkFaints()) || (await this.endOfTurn());
    }
    async doTurn(action) {
      const em = this.aiPick();
      if (action.type === 'switch') {
        await this.withdraw();
        await this.sendOut(action.idx);
        return this.enemyOnly();
      }
      if (action.type === 'item') {
        const mon = this.st.party[action.target];
        const before = mon.hp;
        Audio.sfx('heal');
        const txt = DW.useItem(action.item, mon);
        if (mon === this.active && mon.hp !== before) {
          this.sparkle('p', '#80ff90');
          this.hpShow.p = before;
          await DW.tween(this.hpShow, { p: mon.hp }, 0.5);
        }
        await this.msg(txt);
        return this.enemyOnly();
      }
      // attaques (un Digimon mal discipliné n'en fait parfois qu'à sa tête)
      const P = this.active, E = this.enemy;
      let pm = action.special ? { id: DW.sigOf(P), special: true } : action.slot < 0 ? { id: 'lutte' } : P.moves[action.slot];
      if (!action.special && !action.auto && P === this.st.party[0] && DW.Life.disobeys(P)) {
        const usable = P.moves.filter(mm => P.canPay(mm.id));
        if (Math.random() < 0.5 || !usable.length) { await this.msg(`${P.name} n'en fait qu'à sa tête et regarde ailleurs...`); return this.enemyOnly(); }
        pm = DW.pick(usable);
        await this.msg(`${P.name} n'écoute pas et choisit lui-même son attaque !`, 0.8);
      }
      const pri = id => DW.MOVES[id].pri || 0;
      let pFirst;
      if (pri(pm.id) !== pri(em.id)) pFirst = pri(pm.id) > pri(em.id);
      else {
        const ps = this.eff('p', 'spd'), es = this.eff('e', 'spd');
        pFirst = ps === es ? Math.random() < 0.5 : ps > es;
      }
      const order = pFirst ? [['p', P, pm], ['e', E, em]] : [['e', E, em], ['p', P, pm]];
      for (const [side, mon, mv] of order) {
        if (mon.hp <= 0) continue;
        if (side === 'p' && mon !== this.active) continue;
        await this.useMove(side, mv);
        const r = await this.checkFaints();
        if (r) return r;
        if (this.switchedAfterKO) { this.switchedAfterKO = false; return null; }
      }
      return this.endOfTurn();
    }
    gainEnergy(side, n) {
      const was = this.energy[side];
      this.energy[side] = Math.min(100, was + n);
      if (was < 100 && this.energy[side] >= 100 && side === 'p' && this.active && DW.sigOf(this.active)) this.energyFull = 1.5;
    }
    async endOfTurn() {
      this.gainEnergy('p', 6); this.gainEnergy('e', 6);
      if (this.energyFull) { this.energyFull = 0; await this.msg(`Énergie au maximum ! ${this.active.name} peut lancer ${DW.MOVES[DW.sigOf(this.active)].name} (ATTAQUE puis ENTRÉE) !`, 1.4); }
      for (const side of ['p', 'e']) {
        const m = this.mon(side);
        if (!m || m.hp <= 0) continue;
        if (m.status === 'psn' || m.status === 'brn') {
          const dmg = Math.max(1, Math.floor(m.maxHp / (m.status === 'psn' ? 8 : 16)));
          this.spr[side].blink = 0.3;
          await this.applyDamage(side, dmg);
          await this.msg(`${this.label(side)} souffre ${m.status === 'psn' ? 'du poison' : 'de sa brûlure'} !`);
          const r = await this.checkFaints();
          if (r) return r;
          if (this.switchedAfterKO) { this.switchedAfterKO = false; return null; }
        }
      }
      return null;
    }
    async checkFaints() {
      const E = this.enemy, P = this.active;
      if (E.hp <= 0) {
        await this.faint('e');
        await this.msg(`${this.label('e')} est vaincu ! Ses données se dispersent...`);
        if (!this.o.noMusic) Audio.play('victory');
        await this.giveXp();
        return 'win';
      }
      if (P.hp <= 0) {
        await this.faint('p');
        await this.msg(`${P.name} est K.O. !`);
        if (!this.st.party.some(m => m.hp > 0)) {
          await this.msg(`${this.st.name} n'a plus de Digimon en état de se battre !`, 1.4);
          return 'lose';
        }
        const idx = await Game.push(new DW.PartyScene({ mode: 'switch', forced: true, activeIdx: this.activeIdx, title: 'REMPLAÇANT' }));
        await this.sendOut(idx);
        this.switchedAfterKO = true;
      }
      return null;
    }

    // ---------------------------------------------------------- calculs
    stageMul(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }
    eff(side, k) {
      const m = this.mon(side);
      let v = m.stat(k) * this.stageMul(this.stages[side][k] || 0);
      if (k === 'atk' && m.status === 'brn') v *= 0.5;
      if (k === 'spd' && m.status === 'par') v *= 0.5;
      return Math.max(1, v);
    }
    calc(uSide, mv, user, tgt, mult = 1) {
      const tSide = uSide === 'p' ? 'e' : 'p';
      const A = this.eff(uSide, mv.contact ? 'atk' : 'int'), Dd = this.eff(tSide, mv.contact ? 'def' : 'int');
      const base = Math.floor(Math.floor(Math.floor(2 * user.level / 5 + 2) * mv.pow * A / Dd) / 50) + 2;
      const stab = user.d.types.includes(mv.type) ? 1.5 : 1;
      const tm = DW.typeMult(mv.type, tgt.d.types);
      const attr = DW.ATTR_ADV[user.d.attr] === tgt.d.attr ? 1.2 : 1;
      const crit = Math.random() < (uSide === 'p' && user.happy > 80 ? 1 / 10 : 1 / 16) ? 1.5 : 1;
      const rnd = (0.85 + Math.random() * 0.15) * DW.Time.weatherMult(mv.type) * (uSide === 'p' ? 1 + (user.happy - 50) / 500 : 1);
      return { dmg: Math.max(1, Math.floor(base * stab * tm * attr * crit * rnd * mult)), tm, crit: crit > 1, attr: attr > 1 };
    }
    async useMove(uSide, slot) {
      const user = this.mon(uSide), tSide = uSide === 'p' ? 'e' : 'p', tgt = this.mon(tSide);
      const mv = DW.MOVES[slot.id], who = this.label(uSide);
      if (user.status === 'slp') {
        user.slp--;
        if (user.slp <= 0) { user.status = null; await this.msg(`${who} se réveille !`); }
        else { await this.msg(`${who} dort profondément...`); return; }
      }
      if (user.status === 'par' && Math.random() < 0.25) {
        this.sparkle(uSide, '#ffe030');
        await this.msg(`${who} est paralysé ! Il ne peut pas attaquer !`); return;
      }
      if (!slot.special) user.mp = Math.max(0, user.mp - DW.mpCost(slot.id));
      if (uSide === 'e' && slot.id !== 'lutte') this.seenMoves.add(slot.id);
      if (slot.special) {
        // coup spécial : bandeau, éclair, tremblement
        this.energy[uSide] = 0;
        this.banner = { text: mv.name, who, side: uSide, t: 0 };
        Audio.sfx('evolve'); this.flash = 0.8; this.shake = 0.4;
        await this.msg(`${who} déchaîne son coup spécial : ${mv.name} !`, 0.9);
        this.banner = null;
      } else await this.msg(`${who} utilise ${mv.name} !`, 0.45);
      if (!slot.special && mv.acc && Math.random() * 100 >= mv.acc) {
        Audio.sfx('swoosh');
        await this.msg(`Mais ${who} rate son attaque !`); return;
      }
      if (mv.pow > 0) {
        await this.attackAnim(uSide, mv);
        const r = this.calc(uSide, mv, user, tgt, slot.special ? 1.5 : 1);
        if (slot.special) { this.shake = 0.7; this.flash = 0.5; }
        await this.hitAnim(tSide, r.tm);
        await this.applyDamage(tSide, r.dmg);
        // énergie : celui qui frappe et celui qui encaisse
        if (!slot.special) this.gainEnergy(uSide, 22);
        this.gainEnergy(tSide, 6 + Math.round(r.dmg / tgt.maxHp * 60));
        if (r.crit) await this.msg('Coup critique !', 0.8);
        if (r.tm > 1) await this.msg("C'est super efficace !", 0.8);
        else if (r.tm < 1) await this.msg("Ce n'est pas très efficace...", 0.8);
        if (r.attr) await this.msg(`Avantage d'attribut ! (${user.d.attr} > ${tgt.d.attr})`, 0.8);
        if (slot.id === 'lutte') {
          await this.applyDamage(uSide, Math.max(1, Math.floor(user.maxHp / 4)));
          await this.msg(`${who} se blesse en luttant !`);
        }
        if (tgt.hp > 0 && mv.st && Math.random() < mv.st.ch) await this.inflict(tSide, mv.st.s, false);
        if (tgt.hp > 0 && mv.sc && Math.random() < (mv.sc.ch || 1)) await this.statChange(mv.sc.who === 'self' ? uSide : tSide, mv.sc.s, mv.sc.n);
      } else {
        await DW.playFX(this, mv, uSide);
        if (mv.heal) {
          // soin : rend une part des PV max
          const n = Math.min(user.maxHp - user.hp, Math.floor(user.maxHp * mv.heal));
          if (n <= 0) await this.msg(`Les PV de ${who} sont déjà au maximum !`);
          else { Audio.sfx('heal'); this.sparkle(uSide, '#80ff90'); const from = user.hp; user.hp += n; this.hpShow[uSide] = from; await DW.tween(this.hpShow, { [uSide]: user.hp }, 0.5); await this.msg(`${who} récupère ${n} PV !`); }
        }
        if (mv.st) await this.inflict(tSide, mv.st.s, true);
        if (mv.sc) await this.statChange(mv.sc.who === 'self' ? uSide : tSide, mv.sc.s, mv.sc.n);
      }
    }
    async inflict(side, s, announce) {
      const m = this.mon(side);
      const immune = (s === 'brn' && m.d.types.includes('Feu')) || (s === 'par' && m.d.types.includes('Électrique'));
      if (m.status || immune) { if (announce) await this.msg(`Ça n'a aucun effet sur ${this.label(side)}...`); return; }
      m.status = s;
      if (s === 'slp') m.slp = DW.rand(1, 3);
      Audio.sfx('status');
      this.sparkle(side, DW.STATUS_COL[s]);
      await this.msg(`${this.label(side)} ${ST_TXT[s]} !`);
    }
    async statChange(side, s, n) {
      const st = this.stages[side], who = this.label(side);
      if ((n > 0 && st[s] >= 6) || (n < 0 && st[s] <= -6)) {
        await this.msg(`${STAT_NAME[s]} de ${who} ne peut plus ${n > 0 ? 'monter' : 'baisser'} !`); return;
      }
      st[s] = DW.clamp(st[s] + n, -6, 6);
      Audio.sfx(n > 0 ? 'buff' : 'debuff');
      this.sparkle(side, n > 0 ? '#ff8060' : '#6080ff', n > 0 ? -1 : 1);
      const txt = n > 0 ? (n > 1 ? 'augmente beaucoup' : 'augmente') : (n < -1 ? 'baisse beaucoup' : 'baisse');
      await this.msg(`${STAT_NAME[s]} de ${who} ${txt} !`);
    }
    async applyDamage(side, dmg) {
      const m = this.mon(side), from = m.hp;
      m.hp = Math.max(0, m.hp - dmg);
      this.hpShow[side] = from;
      await DW.tween(this.hpShow, { [side]: m.hp }, 0.25 + Math.min(0.6, dmg / m.maxHp), DW.linear);
    }

    // ---------------------------------------------------------- expérience
    async giveXp() {
      const E = this.enemy;
      const alive = [...this.parts].filter(m => m.hp > 0 && this.st.party.includes(m));
      if (alive.length) {
        const total = Math.floor(E.d.xp * E.level / 7 * (this.wild ? 1 : 1.5));
        const each = Math.max(1, Math.floor(total / alive.length));
        for (const m of alive) {
          m.wins++; m.addHappy(2); DW.Life.addFat(m, -0.4);
          await this.msg(`${m.name} gagne ${each} points d'EXP !`, 0.8);
          const events = m.addXp(each);
          for (const ev of events) {
            if (ev.type === 'level') {
              if (m === this.active) { await DW.tween(this.xpShow, { v: 1 }, 0.4); this.xpShow.v = 0; this.hpShow.p = m.hp; }
              Audio.sfx('levelup');
              this.lvPanel = { m, before: ev.before, after: m.stats() };
              await this.msg(`${m.name} passe au niveau ${ev.level} !`, 2.2);
              this.lvPanel = null;
            } else if (ev.type === 'learn') await DW.learnMove(m, ev.move);
          }
          if (m === this.active) await DW.tween(this.xpShow, { v: m.xpRatio() }, 0.5);
          if (m === this.active) await this.observe(m);
          if (events.length && m.evoTarget()) m.evoPending = true;
        }
      }
      const bits = Math.floor(E.level * (this.wild ? 5 : 25) + DW.rand(0, E.level * 2));
      this.st.bits += bits;
      await this.msg(`Tu récupères ${bits} Bits !`, 0.9);
    }

    // ---------------------------------------------------------- observation
    // Comme dans Digimon World : une technique ennemie vue en combat peut être retenue,
    // si elle est de l'élément du Digimon (ou neutre) et pas trop puissante pour son stade.
    async observe(m) {
      const young = ['Bébé', 'Entraînement', 'Disciple'].includes(m.d.stage);
      const pool = [...this.seenMoves].filter(id => {
        const mv = DW.MOVES[id];
        return mv && !m.knows(id) && (mv.type === 'Neutre' || m.d.types.includes(mv.type)) && !(young && mv.pow > 90);
      });
      if (!pool.length) return;
      const ch = Math.min(0.6, 0.3 + m.stat('int') / 400);
      if (Math.random() >= ch) return;
      const id = DW.pick(pool);
      Audio.sfx('buff');
      await this.msg(`${m.name} a bien observé ${DW.MOVES[id].name} pendant le combat...`, 1.2);
      await DW.learnMove(m, id);
    }

    // ---------------------------------------------------------- animations
    center(side) { const s = this.spr[side], m = this.mon(side); const h = m ? DW.Sprites.battle(m.sp).h : 70; return { x: POS[side].x + s.dx, y: POS[side].y + s.dy - h * 0.45 }; }
    async attackAnim(uSide, mv) {
      this.spr[uSide].pose = 'attack';
      try { await DW.playFX(this, mv, uSide); } finally { this.spr[uSide].pose = null; }
    }
    async hitAnim(side, tm) {
      const s = this.spr[side];
      if (tm === 0) return;
      Audio.sfx(tm > 1 ? 'super' : tm < 1 ? 'weak' : 'hit');
      s.blink = 0.45; s.pose = 'hurt'; setTimeout(() => { if (s.pose === 'hurt') s.pose = null; }, 500);
      if (tm > 1) { this.shake = 0.5; this.flash = 0.6; }
      const c = this.center(side);
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 60;
        this.pt.push({ x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.35, max: 0.35, col: i % 2 ? '#ffffff' : '#ffd040', size: 2 });
      }
      await DW.wait(0.35);
    }
    sparkle(side, col, dir = -1) {
      const c = this.center(side);
      for (let i = 0; i < 16; i++) {
        this.pt.push({ x: c.x + DW.rand(-22, 22), y: c.y + DW.rand(-10, 30), vx: 0, vy: dir * (25 + Math.random() * 30),
          life: 0.7 + Math.random() * 0.3, max: 1, col, size: 2 });
      }
    }
    async faint(side) {
      const s = this.spr[side], m = this.mon(side);
      Audio.sfx('faint');
      // dissolution en données
      const spr = DW.Sprites.battle(m.sp), d = spr.data.data, sc = 1;
      const x0 = POS[side].x + s.dx - spr.w * sc / 2, y0 = POS[side].y + s.dy - spr.h * sc;
      for (let y = 0; y < spr.h; y++) for (let x = 0; x < spr.w; x++) {
        const i = (y * spr.w + x) * 4;
        if (d[i + 3] < 128 || Math.random() < 0.2) continue;
        const px = side === 'e' ? spr.w - 1 - x : x;
        this.pt.push({ x: x0 + px * sc, y: y0 + y * sc, vx: (Math.random() - 0.5) * 20, vy: -(10 + Math.random() * 50),
          life: 0.5 + Math.random() * 1.0 + (spr.h - y) * 0.01, max: 1.5, col: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`, size: 1.5, data: true });
      }
      s.vis = false;
      this.hud[side] = false;
      await DW.wait(1.1);
    }
    tick(dt) {
      for (const s of Object.values(this.spr)) if (s.blink > 0) s.blink -= dt;
      if (this.shake > 0) this.shake -= dt;
      if (this.flash > 0) this.flash -= dt * 2;
      for (let i = this.fxd.length - 1; i >= 0; i--) { this.fxd[i].t += dt; if (this.fxd[i].t > this.fxd[i].dur) this.fxd.splice(i, 1); }
      this.weather.update(dt);
      for (let i = this.fx.length - 1; i >= 0; i--) { this.fx[i].t += dt; if (this.fx[i].t > this.fx[i].dur) this.fx.splice(i, 1); }
      for (let i = this.pt.length - 1; i >= 0; i--) {
        const p = this.pt[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.data) p.vx += (Math.random() - 0.5) * 60 * dt;
        if (p.life <= 0) this.pt.splice(i, 1);
      }
      this.clouds.forEach(cl => { cl.x += cl.s * 6 * dt; if (cl.x > W + 40) cl.x = -60; });
    }

    // ---------------------------------------------------------- rendu
    drawBg(c) {
      const t = this.t;
      c.drawImage(DW.World.battleBg(this.bg), 0, 0);
      // nuages
      c.fillStyle = 'rgba(255,255,255,0.9)';
      this.clouds.forEach(cl => {
        c.beginPath(); c.ellipse(cl.x, cl.y, 20 * cl.s + 8, 5 * cl.s + 3, 0, 0, 7); c.ellipse(cl.x + 10, cl.y - 4, 11 * cl.s + 4, 6 * cl.s + 2, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(200,220,255,0.6)'; c.fillRect(cl.x - 18 * cl.s - 6, cl.y + 2, 36 * cl.s + 14, 2); c.fillStyle = 'rgba(255,255,255,0.9)';
      });
      const base = this.bg.split('@')[0];
      if (base === 'plage') {
        c.fillStyle = 'rgba(200,240,255,0.8)';
        for (let i = 0; i < 18; i++) {
          const x = ((i * 53 + t * (6 + (i % 3) * 3)) % (W + 20)) - 10, y = 72 + (i % 6) * 4.5;
          if (Math.sin(t * 2 + i) > -0.2) c.fillRect(Math.round(x), Math.round(y), 4 + (i % 3) * 2, 1);
        }
      } else if (base === 'foret') {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          const x = 60 + i * 110 + Math.sin(t * 0.4 + i) * 8, a = 0.06 + 0.03 * Math.sin(t * 0.7 + i * 2);
          const g = c.createLinearGradient(x, 0, x - 50, 200);
          g.addColorStop(0, `rgba(255,250,200,${a})`); g.addColorStop(1, 'rgba(255,250,200,0)');
          c.fillStyle = g; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 24, 0); c.lineTo(x - 40, 200); c.lineTo(x - 80, 200); c.fill();
        }
        c.restore();
      }
      DW.World.platform(c, this.bg, POS.e.x, POS.e.y - 3, 56, 12);
      DW.World.platform(c, this.bg, POS.p.x, POS.p.y - 3, 64, 14);
    }
    drawMon(c, side) {
      const s = this.spr[side], m = this.mon(side);
      if (!s.vis || !m) return;
      if (s.blink > 0 && Math.floor(s.blink * 20) % 2) return;
      const spr = DW.Sprites.battle(m.sp);
      const frame = Math.floor(this.t * 4 + (side === 'e' ? 2 : 0));
      if (s.pose) { DW.Sprites.draw(c, DW.Sprites.pose(m.sp, s.pose), POS[side].x + s.dx, POS[side].y + s.dy, { scale: s.scale, flip: side === 'e', white: s.white, alpha: s.alpha }); return; }
      DW.Sprites.draw(c, spr, POS[side].x + s.dx, POS[side].y + s.dy, { scale: s.scale, flip: side === 'e', white: s.white, alpha: s.alpha, frame });
    }
    drawHud(c) {
      if (this.hud.e) {
        const E = this.enemy;
        UI.box(c, 8, 10, 136, 40);
        UI.text(c, E.name, 15, 24, { size: 10, bold: true });
        UI.text(c, `N.${E.level}`, 137, 24, { size: 9, align: 'right', color: '#ffd860' });
        if (E.status) UI.tag(c, DW.STATUS_NAME[E.status], 15 + UI.measure(c, E.name, 10, true) + 4, 15, DW.STATUS_COL[E.status]);
        UI.text(c, 'PV', 15, 35, { size: 7, bold: true, color: '#ffd860' });
        const r = this.hpShow.e / E.maxHp;
        UI.bar(c, 29, 30, 108, 4, r, UI.hpColor(r));
        let x = 15;
        E.d.types.forEach(t => { x += UI.typeTag(c, t, x, 38, 6) + 2; });
        UI.tag(c, E.d.attr.toUpperCase(), x + 1, 38, '#4a5a90', 6);
        if (this.st.caught[E.sp]) { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(137, 42, 2.4, 0, 7); c.fill(); }
        if (DW.sigOf(E)) this.drawEnergy(c, 'e', 12, 54, 88);
      }
      if (this.hud.p && this.active) {
        const P = this.active;
        UI.box(c, 172, 122, 142, 52);
        UI.text(c, P.name, 179, 136, { size: 10, bold: true });
        UI.text(c, `N.${P.level}`, 307, 136, { size: 9, align: 'right', color: '#ffd860' });
        if (P.status) UI.tag(c, DW.STATUS_NAME[P.status], 179 + UI.measure(c, P.name, 10, true) + 4, 127, DW.STATUS_COL[P.status]);
        UI.text(c, 'PV', 179, 147, { size: 7, bold: true, color: '#ffd860' });
        const r = this.hpShow.p / P.maxHp;
        UI.bar(c, 193, 142, 114, 4, r, UI.hpColor(r));
        UI.text(c, `${Math.ceil(this.hpShow.p)} / ${P.maxHp}`, 307, 160, { size: 9, align: 'right' });
        UI.text(c, `PM ${P.mp}/${P.maxMp}`, 179, 160, { size: 8, color: '#8ad0ff' });
        UI.text(c, 'EXP', 179, 169.5, { size: 6, bold: true, color: '#7ac0ff' });
        UI.bar(c, 195, 166, 112, 2, this.xpShow.v, '#48a8f8');
        if (DW.sigOf(P)) this.drawEnergy(c, 'p', 176, 116, 96);
      }
    }
    drawEnergy(c, side, x, y, w) {
      const v = this.energyShow[side] = DW.lerp(this.energyShow[side], this.energy[side], 0.15), full = this.energy[side] >= 100;
      c.fillStyle = '#0a1426'; c.fillRect(x - 1, y - 1, w + 2, 5);
      const g = c.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#ff9a3a'); g.addColorStop(1, full ? '#fff070' : '#ffd040');
      c.fillStyle = g; c.fillRect(x, y, Math.round(w * v / 100), 3);
      if (full) { c.fillStyle = `rgba(255,255,220,${0.4 + 0.4 * Math.sin(this.t * 10)})`; c.fillRect(x, y, w, 3); }
      UI.text(c, full ? 'SPÉCIAL !' : 'ÉNERGIE', x + w + 3, y + 4, { size: 6, color: full ? '#fff070' : '#ffb060' });
    }
    drawBanner(c) {
      const b = this.banner;
      if (!b) return;
      b.t += 1 / 60;
      const k = Math.min(1, b.t * 4), y = b.side === 'p' ? 70 : 96;
      c.fillStyle = 'rgba(10,10,30,0.75)'; c.fillRect(0, y - 16, W, 30);
      c.fillStyle = b.side === 'p' ? '#ffb040' : '#ff5a5a'; c.fillRect(0, y - 16, W, 2); c.fillRect(0, y + 12, W, 2);
      UI.text(c, `★ ${b.text} ★`, W / 2 + (1 - k) * (b.side === 'p' ? -200 : 200), y + 4, { size: 14, align: 'center', color: '#fff4c0', bold: true });
    }
    drawBottom(c) {
      if (this.mode === 'moves') {
        UI.box(c, 4, 180, 206, 56);
        const P = this.active;
        P.moves.forEach((m, i) => {
          const x = 20 + (i % 2) * 96, y = 194 + (i >> 1) * 16;
          UI.text(c, DW.MOVES[m.id].name, x, y, { size: 8, color: P.canPay(m.id) ? '#fff' : '#8a8aa0' });
        });
        UI.cursor(c, 10 + (this.mcursor % 2) * 96, 190.5 + (this.mcursor >> 1) * 16, this.t);
        const mm = P.moves[this.mcursor], mv = DW.MOVES[mm.id];
        UI.box(c, 212, 180, 104, 56);
        const cost = DW.mpCost(mm.id);
        UI.text(c, cost ? `${cost} PM` : 'Gratuit', 220, 196, { size: 9, color: P.canPay(mm.id) ? '#9ad0ff' : '#f05050' });
        UI.text(c, `${P.mp}/${P.maxMp}`, 308, 196, { size: 8, align: 'right', color: '#c8d4ff' });
        UI.typeTag(c, mv.type, 220, 202, 7);
        const tm = DW.typeMult(mv.type, this.enemy.d.types);
        if (mv.pow && this.st.seen[this.enemy.sp] && tm !== 1)
          UI.text(c, tm > 1 ? 'Efficace !' : 'Peu efficace', 308, 210, { size: 7, align: 'right', color: tm > 1 ? '#80ff80' : '#ffa080' });
        UI.text(c, mv.pow ? `Puissance ${mv.pow}` : 'Attaque de statut', 220, 229, { size: 8, color: '#c8d4ff' });
        const sig = DW.sigOf(P);
        if (sig && this.energy.p >= 100) { UI.box(c, 4, 160, 206, 18, 'dwsel'); UI.text(c, `ENTRÉE : ★ ${DW.MOVES[sig].name} (spécial)`, 12, 172, { size: 8, color: '#fff070' }); }
        return;
      }
      UI.box(c, 4, 180, 312, 56);
      if (this.mode === 'cmd') {
        UI.wrap(c, this.text, 160, 10).forEach((l, i) => UI.text(c, l, 16, 200 + i * 14));
        UI.box(c, 184, 184, 128, 48, 'light');
        const labels = ['ATTAQUE', 'OBJETS', 'DIGIMON', 'FUITE'];
        labels.forEach((s, i) => UI.text(c, s, 200 + (i % 2) * 58, 203 + (i >> 1) * 20, { size: 9, bold: true, color: '#1a2050', shadow: false }));
        UI.cursor(c, 191 + (this.cursor % 2) * 58, 199.5 + (this.cursor >> 1) * 20, this.t);
        return;
      }
      let n = Math.floor(this.shown);
      UI.wrap(c, this.text, 290, 10).slice(0, 3).forEach((l, i) => {
        UI.text(c, l.slice(0, Math.max(0, n)), 16, 200 + i * 14);
        n -= l.length;
      });
    }
    draw(c) {
      const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 8 * this.shake) : 0;
      c.save(); c.translate(sx, 0);
      this.drawBg(c);
      this.drawMon(c, 'e');
      this.drawMon(c, 'p');
      for (const f of this.fx) {
        if (f.t < 0) continue;
        const k = f.t / f.dur;
        const x = DW.lerp(f.x0, f.x1, k), y = DW.lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 12 + Math.sin(f.ph + k * 20) * f.wob;
        c.fillStyle = f.col; c.beginPath(); c.arc(x, y, f.size * (1 - k * 0.3), 0, 7); c.fill();
      }
      for (const p of this.pt) {
        c.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max * 0.5)));
        c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      c.globalAlpha = 1;
      for (const e of this.fxd) if (e.t >= 0) { c.save(); e.draw(c, Math.min(1, e.t / e.dur), e.t); c.restore(); }
      c.restore();
      this.weather.draw(c);
      DW.Time.drawLight(c, null, 0.55);
      if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(0.7, this.flash)})`; c.fillRect(0, 0, W, H); }
      this.drawHud(c);
      this.drawBanner(c);
      this.drawBottom(c);
      if (this.lvPanel) {
        const { m, before, after } = this.lvPanel;
        UI.box(c, 196, 60, 118, 116);
        UI.label(c, 'NIVEAU ' + m.level, 202, 65);
        [['hp', 'PV'], ['atk', 'Attaque'], ['def', 'Défense'], ['spd', 'Vitesse'], ['int', 'Intell.']].forEach(([k, lab], j) => {
          const y = 92 + j * 16;
          UI.text(c, lab, 204, y, { size: 9, color: '#8ae0f0' });
          UI.text(c, String(after[k]), 276, y, { size: 9, align: 'right' });
          UI.text(c, '+' + (after[k] - before[k]), 306, y, { size: 9, align: 'right', color: '#7aff8a' });
        });
      }
      if (this.bars.v > 0) {
        const h = this.bars.v * H / 2;
        c.fillStyle = '#000'; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h);
      }
    }
  }
  DW.BattleScene = BattleScene;
})();
