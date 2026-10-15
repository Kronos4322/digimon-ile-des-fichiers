'use strict';
// =====================================================================
//  COMBAT EN ARÈNE (comme Digimon World 1) : TON DIGIMON SE BAT TOUT SEUL — il se place, attaque avec la
//  technique que tu lui as donnée et esquive selon sa Vitesse. Toi, tu es le dresseur : la roue (ESPACE) sert à
//  changer de technique, lancer un objet, demander une garde ou fuir. Les flèches sont facultatives (guider pour esquiver).
//  Le combat se joue sur une CARTE DE COMBAT à part,
//  un terrain d'un écran fait du sol et de la bordure de la carte où l'on était (clairière en
//  forêt, sable et eau à la plage...). Les deux Digimon s'y déplacent en temps réel ; le héros
//  regarde depuis le bord. À la fin, on revient sur la carte normale, à la même place.
//   - flèches : déplacer son Digimon (sans ordre, il se place tout seul)
//   - ESPACE : choisir une technique ou un objet (le combat continue pendant le choix) ; elle part vers l'endroit
//     où se trouve l'adversaire au moment du tir : s'il a bougé, c'est raté !
//   - ENTRÉE : coup spécial quand la jauge d'énergie est pleine (à charger)
//   - pousser contre le bord gauche ou droit du terrain : fuir (combat sauvage)
//  Les calculs (dégâts, statuts, EXP, observation des techniques) viennent de game/battle.js.
//  Rendu : ui/arenaui.js
// =====================================================================
(function () {
  const { Input, Audio, Game } = DW;
  // terrain (coordonnées écran : position des pieds)
  const F = { x0: 22, x1: 298, y0: 118, y1: 204 };
  let IMM = null;   // carte de combat en cours (sinon : fond de combat dessiné, ex. sans carte)
  // ------------------------------------------------------------ carte de combat : une grande clairière naturelle
  // (36 × 24 cases, plus grande que l'écran : la caméra suit le combat)
  // sol = case praticable la plus fréquente de la carte d'origine ; bordure = obstacle le plus fréquent
  const FW = 36, FH = 24, HERO = { x: 5 * 16 + 8, y: 12 * 16 + 14 };
  const FIELD_CACHE = {};
  function fieldMap(src) {
    const key = [src.theme, src.climate, src.ambient, src.bg, src.indoor ? 1 : 0].join('|');
    if (FIELD_CACHE[key]) return FIELD_CACHE[key];
    const count = {};
    for (const r of src.rows) for (const ch of r) count[ch] = (count[ch] || 0) + 1;
    const by = list => list.filter(ch => count[ch]).sort((p, q) => count[q] - count[p])[0];
    const ground = by(['.', 's', 'v', '=', 'z', 'o', '1']) || '.';
    const border = by([...DW.SOLID].filter(ch => ch !== '#' && ch !== '~' && !'|5'.includes(ch))) || 'T';
    const water = count['~'] > 40 && !src.indoor;
    const deco = ['f', 'j'].filter(ch => count[ch] && !DW.SOLID.has(ch));
    const tall = [',', ';'].find(ch => count[ch] && !DW.SOLID.has(ch));
    const seed = [...key].reduce((h, ch) => h * 31 + ch.charCodeAt(0) | 0, 7) & 1023;
    const H = (x, y, k) => DW.Art.hash(x, y, seed + k), N = (x, y) => DW.Art.fbm(x * 0.18, y * 0.18, seed);
    const g = [];
    for (let y = 0; y < FH; y++) {
      let r = '';
      for (let x = 0; x < FW; x++) {
        // bord irrégulier : ellipse déformée par du bruit
        const d = Math.hypot((x + 0.5 - FW / 2) / (FW / 2 - 1.5), (y + 0.5 - FH / 2) / (FH / 2 - 1.5)) + (N(x, y) - 0.5) * 0.45;
        if (d > 1) r += water && y < FH / 2 && d > 1.05 ? '~' : border;
        else if (d > 0.62 && H(x, y, 1) < 0.07) r += border;   // quelques arbres ou rochers isolés près du bord
        else if (tall && d > 0.55 && N(x + 40, y) > 0.6) r += tall;   // touffes d'herbes hautes
        else if (deco.length && H(x, y, 2) < 0.04) r += deco[Math.floor(H(x, y, 3) * deco.length)];
        else r += ground;
      }
      g.push([...r]);
    }
    // places de départ dégagées (héros, partenaire, adversaire)
    for (const [cx, cy] of [[5, 12], [9, 12], [26, 11]]) for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) if (g[y] && g[y][x]) g[y][x] = ground;
    const m = { name: 'Combat', rows: g.map(r => r.join('')), w: FW, h: FH, theme: src.theme, climate: src.climate, ambient: src.ambient, bg: src.bg, indoor: src.indoor, dark: src.dark, npcs: [], warps: [], objects: [], triggers: [] };
    return (FIELD_CACHE[key] = m);
  }
  const TICK = 3;                                   // secondes par « tour » (régénération, poison...)
  const ST_SEC = { psn: 12, brn: 12, par: 9, slp: 5 };
  const ST_END = { psn: "n'est plus empoisonné", brn: "n'est plus brûlé", par: "n'est plus paralysé", slp: 'se réveille' };
  const MP_REGEN = 0.06;
  const depth = y => IMM ? 0.5 + (y - F.y0) / (F.y1 - F.y0) * 0.18 : 0.55 + (y - F.y0) / (F.y1 - F.y0) * 0.25;   // échelle selon la profondeur
  // quadrillage caché du terrain (le joueur ne le voit pas) : une attaque frappe une ou plusieurs dalles
  const G = { cols: 8, rows: 4 };
  const setField = (x0, x1, y0, y1, cell) => {
    Object.assign(F, { x0, x1, y0, y1 });
    if (cell) { G.cols = Math.round((x1 - x0) / cell); G.rows = Math.round((y1 - y0) / cell); } else { G.cols = 8; G.rows = 4; }
    G.w = (F.x1 - F.x0) / G.cols; G.h = (F.y1 - F.y0) / G.rows;
  };
  setField(F.x0, F.x1, F.y0, F.y1);
  const cellOf = (x, y) => [DW.clamp(Math.floor((x - F.x0) / G.w), 0, G.cols - 1), DW.clamp(Math.floor((y - F.y0) / G.h), 0, G.rows - 1)];
  const cellCenter = ([cx, cy]) => ({ x: F.x0 + (cx + 0.5) * G.w, y: F.y0 + (cy + 0.5) * G.h });
  // portée des techniques, comme dans Digimon World 1 (d'après leur effet visuel) :
  //  corps à corps : il faut rejoindre l'adversaire ; frappe sa dalle
  //  proche : à moins de quelques pas (rayons, souffles, jets) ; frappe sa dalle et les voisines
  //  loin : de n'importe où ; une dalle (une croix pour les grosses attaques)
  //  tout le terrain : touche partout, mais moins fort
  const RANGE_FX = { flamebeam: 'near', waterbeam: 'near', icebreath: 'near', wire: 'near', spores: 'near', web: 'near', vine: 'near', shock: 'near', bubbles: 'near',
    bluefire: 'near', firestorm: 'near', icespikes: 'near', petalstorm: 'near', toxiccloud: 'near', acidspray: 'near',
    wave: 'field', blizzard: 'field', roar: 'field', tornado: 'field', tidalwave: 'field', thunderstorm: 'field', quake: 'field' };
  const REACH = { melee: 44, near: 120 };
  const SHAPE_MULT = { melee: 1.1, near: 1, far: 0.95, field: 0.6, self: 1 };
  const SHAPE_NAME = { melee: 'corps à corps', near: 'proche', far: 'loin', field: 'tout le terrain', self: 'sur soi' };
  function shapeOf(mv, special) {
    if (!mv.pow && !mv.st && (mv.heal || mv.sc)) return 'self';
    if (!mv.pow && mv.sc && mv.sc.who === 'self') return 'self';
    if (special) return RANGE_FX[mv.fx] === 'field' ? 'field' : 'far';
    if (mv.contact) return 'melee';
    return RANGE_FX[mv.fx] || 'far';
  }
  function zoneOf(shape, [cx, cy]) {
    const out = [], add = (x, y) => { if (x >= 0 && y >= 0 && x < G.cols && y < G.rows) out.push(x + ',' + y); };
    if (shape === 'field') { for (let y = 0; y < G.rows; y++) for (let x = 0; x < G.cols; x++) add(x, y); }
    else if (shape === 'near' || shape === 'big') { add(cx, cy); add(cx - 1, cy); add(cx + 1, cy); add(cx, cy - 1); add(cx, cy + 1); }
    else if (shape === 'huge') { for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) add(cx + x, cy + y); }
    else add(cx, cy);
    return new Set(out);
  }

  class ArenaScene extends DW.BattleScene {
    constructor(o) {
      super(o);
      this.arena = true;
      // carte de combat de la région (sauf combats sans carte : tests, menus)
      const src = !o.noMap && DW.ow && DW.ow.map;
      // un boss peut avoir son arène dessinée sur mesure (ArenaScene.FIELDS, ex. le Grand Arbre de Kuwagamon)
      const custom = o.field && ArenaScene.FIELDS[o.field];
      IMM = this.field = custom ? (custom._map || (custom._map = custom())) : src ? fieldMap(src) : null;
      if (this.field) {
        this.gfx = DW.World.prepare(this.field);
        setField(16, FW * 16 - 16, 20, FH * 16 - 6, 32);
        this.home = { x: 9 * 16 + 8, y: 12 * 16 + 14 };
        this.B = { p: this.body(this.home.x, this.home.y, 1), e: this.body(26 * 16 + 8, 11 * 16 + 14, -1) };
        this.hero = HERO;
        this.cam = { x: 0, y: 0 }; this.camTo(1);
      } else {
        setField(22, 298, 118, 204);
        this.B = { p: this.body(84, 186, 1), e: this.body(236, 140, -1) };
      }
      this.pops = []; this.log = null; this.live = false; this.cmd = 0; this.fleeT = 0; this.clock = 0;
      // ALLIÉ (boss scénarisés) : o.ally = { at: 0.5, from, sp, lvl, hero, name, move, join } — quand l'ennemi tombe à
      // la moitié de ses PV, un enfant délivré et son Digimon (qui digivolue) entrent dans le combat et attaquent seuls
      this.allyCfg = o.ally && this.field ? o.ally : null; this.ally = null;
    }
    // ---------------------------------------------------------- l'allié : apparition, déplacement, attaques automatiques
    allyTick(dt) {
      const C = this.allyCfg, E = this.enemy, be = this.B.e;
      if (!C || !this.live) return;
      if (!this.ally) {
        if (this.allyJoining || E.hp > E.maxHp * (C.at || 0.5)) return;
        this.allyJoining = true;
        (async () => {
          const was = this.mode; this.mode = 'msg';
          await super.msg(C.join || `${C.name} entre dans le combat !`, 1.8);
          const pre = new DW.Digimon(C.from || C.sp, C.lvl);
          if (C.from && C.from !== C.sp) await DW.Game.push(new DW.EvolutionScene(pre, C.sp, { story: true }));
          DW.Audio.play('boss');
          const m = new DW.Digimon(C.sp, C.lvl); m.heal();
          this.ally = { m, b: this.body(this.B.p.x - 30, Math.min(F.y1 - 4, this.B.p.y + 40), 1), cd: 1.4, n: 0 };
          this.allyHero = { x: this.hero.x + 4, y: Math.min(F.y1, this.hero.y + 24), id: C.hero };
          DW.state.seen[C.sp] = true;
          this.shake = 0.6; this.flash = 0.6; DW.Audio.sfx('super');
          this.mode = was === 'msg' ? 'live' : was; this.live = true;
          this.say(`${m.name} se bat à tes côtés !`);
        })();
        return;
      }
      const A = this.ally, b = A.b;
      // se place de l'autre côté de l'ennemi, à distance d'attaque
      const side = b.x < be.x ? -1 : 1, tx = DW.clamp(be.x + side * 74, F.x0 + 10, F.x1 - 10), ty = DW.clamp(be.y + 26, F.y0 + 6, F.y1 - 4);
      const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
      if (d > 4) { const v = Math.min(d, 80 * dt); b.x += dx / d * v; b.y += dy / d * v; b.vx = dx / d * 80; b.vy = dy / d * 80; } else { b.vx = b.vy = 0; }
      b.face = be.x > b.x ? 1 : -1;
      A.cd -= dt;
      if (A.cd > 0 || E.hp <= 0) return;
      A.cd = 2.2 + Math.random() * 0.9; A.n++;
      const mv = DW.MOVES[C.move] || { name: 'Attaque', type: 'Feu' }, big = A.n % 4 === 0;
      // dégâts : une part des PV de l'ennemi (l'allié est fort, sans finir le combat à ta place)
      const dmg = Math.max(1, Math.round(E.maxHp * (big ? 0.1 : 0.055) * (0.85 + Math.random() * 0.3)));
      this.say(`${A.m.name} : ${mv.name} !`);
      DW.Elem.impact(this, this.center('e'), mv.type, big);
      DW.Elem.decal(this, be.x, be.y + 2, mv.type, big);
      DW.Audio.sfx(big ? 'super' : 'hit');
      this.hitStop = big ? 0.15 : 0.06; if (big) { this.shake = 0.5; this.flash = 0.3; }
      this.applyDamage('e', dmg);
      this.pop('e', '-' + dmg, '#ffb060', big);
      be.vx = (be.x > b.x ? 1 : -1) * (50 + dmg / E.maxHp * 200);
      this.checkKO();
    }
    // caméra : centrée entre les deux Digimon, sans sortir de la carte de combat
    camTo(k) {
      if (!this.field) return;
      const bp = this.B.p, be = this.B.e;
      const tx = DW.clamp((bp.x + be.x) / 2 - DW.W / 2, 0, FW * 16 - DW.W), ty = DW.clamp((bp.y + be.y) / 2 - 130, 0, FH * 16 - 214);
      this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
    }
    body(x, y, face) { return { x, y, face, vx: 0, vy: 0, cast: null, cd: 1.2, idle: 0, dodge: 0, stT: 0, wob: Math.random() * 6 }; }

    // ---------------------------------------------------------- messages : pendant le combat, ils ne bloquent rien
    msg(t, auto) {
      if (this.live) { this.say(t); return Promise.resolve(); }
      return super.msg(t, auto);
    }
    say(t) { this.log = { text: t, t: 2.6 }; }
    pop(side, text, col, big) { const b = this.B[side]; this.pops.push({ x: b.x, y: b.y - 40, text, col: col || '#ffffff', t: 0, big }); }
    popAt(x, y, text, col) { this.pops.push({ x, y, text, col: col || '#ffffff', t: 0 }); }

    // ---------------------------------------------------------- position des Digimon (utilisée par les effets visuels)
    scaleOf(side) { return depth(this.B[side].y) * (this.spr[side].scale || 1); }
    center(side) {
      const b = this.B[side], m = this.mon(side), h = m ? DW.Sprites.battle(m.sp).h : 60;
      return { x: b.x, y: b.y - h * this.scaleOf(side) * 0.45 };
    }

    // ---------------------------------------------------------- déroulement
    async run() {
      await this.intro();
      if (!this.st.flags.arenaTuto) {
        this.st.flags.arenaTuto = true;
        await super.msg("COMBAT EN ARÈNE ! Ton Digimon se bat tout seul : il attaque avec la technique que tu lui donnes et esquive de lui-même.", 2.5);
        await super.msg('ESPACE : la roue du dresseur (changer de technique, lancer un objet, garde, fuite). ENTRÉE : coup spécial quand son énergie est pleine.', 2.5);
        await super.msg("Si tu veux, guide-le avec les flèches pour esquiver toi-même. Bon courage !", 2.2);
      }
      this.live = true; this.mode = 'live';
      const r = await new Promise(res => (this.endR = res));
      return this.outro(r);
    }
    async intro() {
      Audio.sfx('encounter');
      this.st.seen[this.enemy.sp] = true; (this.st.fought = this.st.fought || {})[this.enemy.sp] = true;
      this.hpShow.e = this.enemy.hp;
      this.spr.e.dx = 0;
      // l'adversaire entre sur le terrain par la droite
      const ex = this.B.e.x; this.B.e.x = this.field ? this.cam.x + DW.W + 30 : DW.W + 30;
      await DW.tween(this.bars, { v: 0 }, 0.5);
      await DW.tween(this.B.e, { x: ex }, 0.55);
      this.hud.e = true;
      await super.msg(this.o.intro || (this.wild ? `Un ${this.enemy.name} sauvage apparaît !` : `${this.enemy.name} attaque !`));
      const idx = this.st.party.findIndex(m => m.hp > 0);
      if (idx < 0) throw new Error('aucun Digimon en état de se battre');
      await this.sendOut(idx);
    }
    async sendOut(idx) {
      const m = this.st.party[idx];
      this.active = m; this.activeIdx = idx; this.parts.add(m);
      this.stages.p = { atk: 0, def: 0, spd: 0 };
      const home = this.home || { x: 84, y: 186 };
      Object.assign(this.B.p, { x: home.x, y: home.y, vx: 0, vy: 0, cast: null, cd: 0.5 });
      Object.assign(this.spr.p, { dx: 0, dy: 0, vis: true, white: 1, scale: 0.15, alpha: 1 });
      this.hpShow.p = m.hp; this.xpShow.v = m.xpRatio();
      Audio.sfx('sendout');
      const p = this.live ? (this.say(`En avant, ${m.name} !`), null) : super.msg(`En avant, ${m.name} !`, 0.7);
      await DW.tween(this.spr.p, { scale: 1 }, 0.35);
      await DW.tween(this.spr.p, { white: 0 }, 0.25);
      this.hud.p = true;
      if (p) await p;
    }
    end(r) {
      if (!this.live) return;
      this.live = false; this.mode = 'none';
      const f = this.endR; this.endR = null; f && f(r);
    }
    async outro(r) {
      this.B.p.cast = this.B.e.cast = null;
      if (r === 'win') {
        await this.faint('e');
        await super.msg(`${this.label('e')} est vaincu ! Ses données se dispersent...`);
        if (!this.o.noMusic) Audio.play('victory');
        await this.giveXp();
        return 'win';
      }
      if (r === 'lose') {
        await this.faint('p');
        await super.msg(`${this.active.name} est K.O. !`);
        await super.msg(`${this.st.name} n'a plus de Digimon en état de se battre !`, 1.4);
        return 'lose';
      }
      Audio.sfx('run');
      await super.msg('Tu prends la fuite !');
      return 'run';
    }
    async faint(side) {
      const s = this.spr[side], m = this.mon(side), b = this.B[side];
      Audio.sfx('faint');
      const spr = DW.Sprites.battle(m.sp), d = spr.data.data, sc = this.scaleOf(side);
      const x0 = b.x - spr.w * sc / 2, y0 = b.y - spr.h * sc, flip = b.face < 0;
      for (let y = 0; y < spr.h; y += 1) for (let x = 0; x < spr.w; x++) {
        const i = (y * spr.w + x) * 4;
        if (d[i + 3] < 128 || Math.random() < 0.35) continue;
        const px = flip ? spr.w - 1 - x : x;
        this.pt.push({ x: x0 + px * sc, y: y0 + y * sc, vx: (Math.random() - 0.5) * 20, vy: -(10 + Math.random() * 50),
          life: 0.5 + Math.random() * 1.0 + (spr.h - y) * 0.01, max: 1.5, col: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`, size: 1.5, data: true });
      }
      s.vis = false; this.hud[side] = false;
      await DW.wait(1.1);
    }

    // ---------------------------------------------------------- entrées et simulation
    update(dt) {
      if (this.mode === 'live') return this.sim(dt);
      // menu ouvert : le combat CONTINUE (l'ennemi attaque toujours, ton Digimon se débrouille seul)
      if (this.mode === 'acmd') { this.cmdInput(); if (this.mode === 'acmd') this.sim(dt, true); return; }
      return super.update(dt);
    }
    // ROUE DE COMMANDES (comme Digimon Story Cyber Sleuth), toujours affichée en bas à droite :
    //  ESPACE ouvre la roue ; ESPACE = Attaque (dernière technique) ; ↑ Garde ; → Techniques ; ← Objets ; ↓ Fuite
    //  le combat continue pendant le choix
    cmdList() {
      if (this.sub === 'items') return this.battleItems().map(id => ({ k: 'use', id, n: this.st.bag[id] }));
      if (this.sub === 'moves') return this.active.moves.map((m, i) => ({ k: 'move', i, id: m.id }));
      return [];
    }
    battleItems() {
      const ok = ['heal', 'mp', 'cure', 'buff', 'protect'];
      return Object.keys(this.st.bag).filter(id => this.st.bag[id] > 0 && DW.ITEMS[id] && ok.includes(DW.ITEMS[id].use));
    }
    cmdInput() {
      if (this.sub === 'wheel') return this.wheelInput();
      const L = this.cmdList();
      if (!L.length) { this.sub = 'wheel'; this.say("Tu n'as aucun objet utile en combat !"); return; }
      this.cmd = DW.clamp(this.cmd, 0, L.length - 1);
      if (Input.hit('up')) { this.cmd = (this.cmd - 1 + L.length) % L.length; Audio.sfx('move'); }
      if (Input.hit('down')) { this.cmd = (this.cmd + 1) % L.length; Audio.sfx('move'); }
      if (Input.hit('back') || Input.hit('left')) { Audio.sfx('back'); this.sub = 'wheel'; return; }
      if (!Input.hit('ok')) return;
      const c = L[this.cmd];
      if (c.k === 'use') return this.throwItem(c.id);
      this.lastMove = c.i;
      this.useMoveCmd(c.i);
    }
    wheelInput() {
      const P = this.active, bp = this.B.p;
      if (Input.hit('back')) { Audio.sfx('back'); this.mode = 'live'; return; }
      if (Input.hit('ok')) return this.useMoveCmd(DW.clamp(this.lastMove || 0, 0, P.moves.length - 1));
      if (Input.hit('right')) { Audio.sfx('select'); this.sub = 'moves'; this.cmd = this.lastMove || 0; return; }
      if (Input.hit('left')) {
        if (this.throwCd > 0) { Audio.sfx('bump'); this.say('Attends un peu avant de lancer un autre objet !'); return; }
        Audio.sfx('select'); this.sub = 'items'; this.cmd = 0; return;
      }
      if (Input.hit('up')) {
        // garde : moitié moins de dégâts pendant un court instant
        if (this.guardCd > 0) { Audio.sfx('bump'); this.say('Pas encore prêt à se protéger !'); return; }
        Audio.sfx('buff'); bp.guard = 1.6; this.guardCd = 4; this.mode = 'live';
        this.pop('p', 'GARDE', '#8ad0ff'); return;
      }
      if (Input.hit('down')) {
        if (!this.wild) { Audio.sfx('bump'); this.say('Impossible de fuir ce combat !'); return; }
        Audio.sfx('run'); this.autoFlee = bp.x < (F.x0 + F.x1) / 2 ? -1 : 1; this.mode = 'live';
        this.say(`${P.name} court vers le bord pour fuir !`);
      }
    }
    useMoveCmd(i) {
      const P = this.active, mv = P.moves[i];
      if (!mv) return;
      if (!P.canPay(mv.id)) { Audio.sfx('bump'); this.say(`Pas assez de PM ! (${DW.mpCost(mv.id)} PM nécessaires)`); return; }
      Audio.sfx('select'); this.mode = 'live'; this.lastMove = i;
      // un Digimon mal discipliné n'en fait parfois qu'à sa tête
      if (P === this.st.party[0] && DW.Life.disobeys(P)) {
        const usable = P.moves.filter(mm => P.canPay(mm.id));
        if (Math.random() < 0.5 || !usable.length) { this.say(`${P.name} n'en fait qu'à sa tête et regarde ailleurs...`); this.B.p.cd = 1.2; return; }
        this.say(`${P.name} n'écoute pas et choisit lui-même son attaque !`);
        return this.startCast('p', DW.pick(usable));
      }
      this.startCast('p', mv);
    }
    // comme dans Digimon World : le héros LANCE l'objet à son Digimon ; le combat continue pendant le vol
    throwItem(id) {
      const it = DW.ITEMS[id], P = this.active;
      if (it.use !== 'buff' && it.use !== 'protect' && !DW.canUse(id, P, true)) { Audio.sfx('bump'); this.say("Ça n'aura aucun effet."); return; }
      Audio.sfx('swoosh'); this.st.bag[id]--;
      this.sub = 'wheel'; this.mode = 'live';
      const h = this.hero || { x: 26, y: 200 };
      this.throws = this.throws || [];
      this.throws.push({ id, t: 0, dur: 0.6, x0: h.x, y0: h.y - 16 });
      this.throwCd = 2.5;
      this.say(`${this.st.name} lance ${it.name} à ${P.name} !`);
    }
    flyItems(dt) {
      if (this.throwCd > 0) this.throwCd -= dt;
      for (const f of this.throws || []) {
        f.t += dt;
        const b = this.B.p, k = Math.min(1, f.t / f.dur);
        f.x = DW.lerp(f.x0, b.x, k); f.y = DW.lerp(f.y0, b.y - 20, k) - Math.sin(k * Math.PI) * 40;
        if (k >= 1) { f.done = true; this.landItem(f.id); }
      }
      if (this.throws) this.throws = this.throws.filter(f => !f.done);
    }
    async landItem(id) {
      const it = DW.ITEMS[id], P = this.active;
      if (it.use === 'buff' || it.use === 'protect') {
        if (it.use === 'protect') { this.protect = true; Audio.sfx('buff'); this.pop('p', 'PROTECTION', '#c8e0ff'); }
        else for (const k in it.st) await this.statChange('p', k, it.st[k]);
        return;
      }
      const hp0 = P.hp, mp0 = P.mp;
      this.st.bag[id] = (this.st.bag[id] || 0) + 1;   // (DW.useItem retire l'objet : il l'a déjà été au lancer)
      const txt = DW.useItem(id, P);
      Audio.sfx('heal'); this.sparkle('p', '#80ff90');
      if (P.hp !== hp0) { this.hpShow.p = hp0; DW.tween(this.hpShow, { p: P.hp }, 0.5); this.pop('p', '+' + (P.hp - hp0) + ' PV', '#80ff90'); }
      if (P.mp !== mp0) this.pop('p', '+' + (P.mp - mp0) + ' PM', '#8ad0ff');
      if (it.cure) P.stS = null;
      this.say(txt);
    }
    spd(side) { return this.eff(side, 'spd'); }
    // vitesse de déplacement (px/s) : très différente d'un Digimon à l'autre
    //  Vitesse (stat) + stade (un bébé trottine, un Champion fonce) ; paralysie : moitié moins vite
    moveSpeed(side) {
      const m = this.mon(side), v = this.spd(side) / DW.SCALE.stat;
      const stage = { 'Bébé': 0.75, 'Entraînement': 0.85, 'Disciple': 1, 'Champion': 1.15, 'Ultime': 1.25, 'Méga': 1.35 }[m.d.stage] || 1;
      return DW.clamp(30 + v * 1.3, 32, 150) * stage * (m.status === 'par' ? 0.5 : 1);
    }
    sim(dt, menu) {
      if (this.hitStop > 0) { this.hitStop -= dt; return; }   // l'image se fige un instant à l'impact
      const P = this.active, E = this.enemy, bp = this.B.p, be = this.B.e;
      // ordres du joueur
      if (!menu && Input.hit('ok') && !bp.cast && P.status !== 'slp') { this.sub = 'wheel'; this.mode = 'acmd'; Audio.sfx('select'); return; }
      if (this.guardCd > 0) this.guardCd -= dt;
      if (bp.guard > 0) bp.guard -= dt;
      if (!menu && Input.hit('menu') && !bp.cast && this.energy.p >= 100 && DW.sigOf(P) && P.status !== 'slp') { this.special('p'); return; }
      // horloge du combat : régénération, statuts
      this.clock += dt;
      if (this.clock >= TICK) { this.clock -= TICK; this.turnTick(); if (!this.live) return; }
      for (const side of ['p', 'e']) this.statusTime(side, dt);
      this.flyItems(dt);
      // déplacements
      this.movePlayer(dt, menu);
      this.moveEnemy(dt);
      for (const side of ['p', 'e']) { const b = this.B[side]; if (b.cd > 0) b.cd -= dt; }
      // fuite : pousser contre le bord gauche ou droit
      const mid = (F.x0 + F.x1) / 2, span = (F.x1 - F.x0) / 2;
      const L = Input.isDown('left') || this.autoFlee < 0, R = Input.isDown('right') || this.autoFlee > 0;
      const pushing = !menu && ((bp.stuck < 0 && L && bp.x < mid - span * 0.55) || (bp.stuck > 0 && R && bp.x > mid + span * 0.55));
      if (pushing && this.wild && !bp.cast) {
        this.fleeT += dt;
        if (this.fleeT >= 1) {
          this.fleeT = 0; this.runTries++;
          const ps = this.spd('p'), es = this.spd('e'), d = Math.hypot(bp.x - be.x, bp.y - be.y);
          const ch = DW.clamp(0.5 + (ps - es) / (es * 2) + this.runTries * 0.12 + (d > 140 ? 0.15 : 0), 0.25, 1);
          if (Math.random() < ch) return this.end('run');
          this.say('Impossible de fuir !'); Audio.sfx('bump');
          bp.x += bp.x < mid ? 26 : -26; be.cd = Math.min(be.cd, 0.3); this.autoFlee = 0;
        }
      } else if (pushing && !this.wild) { if (!this.noFleeSaid) { this.noFleeSaid = 1; this.say('Impossible de fuir ce combat !'); } }
      else this.fleeT = Math.max(0, this.fleeT - dt * 2);
      // le partenaire se bat tout seul avec la technique choisie (comme dans Digimon World 1)
      if (!bp.cast && bp.cd <= 0 && P.status !== 'slp' && !this.autoFlee && !(bp.guard > 0)) this.autoAttack();
      // l'ennemi attaque quand il est prêt
      if (!be.cast && be.cd <= 0 && E.status !== 'slp') {
        if (this.energy.e >= 100 && DW.sigOf(E) && Math.random() < 0.7) this.special('e');
        else { const em = this.aiPick(); this.startCast('e', E.moves.find(m => m.id === em.id) || em); }
      }
      this.allyTick(dt);
      // incantations en cours
      for (const side of ['p', 'e']) {
        const b = this.B[side], c = b.cast, o = this.B[side === 'p' ? 'e' : 'p'];
        if (!c) continue;
        if (c.phase === 'approach') {
          // mêlée : rejoindre l'adversaire (abandon au bout d'un moment s'il fuit)
          c.t += dt;
          if (Math.hypot(o.x - b.x, (o.y - b.y) * 1.4) < c.reach) this.lock(side, c.shape === 'melee' ? 0.18 : side === 'e' ? 0.45 : 0.25);
          else if (c.t > 2.4) { b.cast = null; b.cd = 0.6; this.popAt(b.x, b.y - 40, 'trop loin...', '#c8d4ff'); }
        } else if (c.phase === 'wind') { c.wind -= dt; if (c.wind <= 0) this.release(side); }
      }
      if (this.log) { this.log.t -= dt; if (this.log.t <= 0) this.log = null; }
    }
    // déplacement du partenaire : flèches, sinon il se place tout seul à bonne distance
    movePlayer(dt, menu) {
      const b = this.B.p, P = this.active, e = this.B.e;
      if (this.approach(b, e, dt)) return;
      if (P.status === 'slp' || (b.cast && b.cast.phase === 'wind')) { b.vx = b.vy = 0; return; }
      const sp = this.moveSpeed('p') * (Input.isDown('run') ? 1.45 : 1);
      let ix = menu ? 0 : (Input.isDown('right') ? 1 : 0) - (Input.isDown('left') ? 1 : 0), iy = menu ? 0 : (Input.isDown('down') ? 1 : 0) - (Input.isDown('up') ? 1 : 0);
      if (b.guard > 0) { b.vx = b.vy = 0; return; }
      if (this.autoFlee) { if (!menu && (ix || iy)) this.autoFlee = 0; else { ix = this.autoFlee; iy = Math.sign((F.y0 + F.y1) / 2 - b.y) * 0.3; } }
      if (menu) b.idle = Math.max(b.idle, 0.7);
      // esquive automatique (annulée si le joueur le guide)
      if (b.dodgeTo && !ix && !iy) { const dx = b.dodgeTo.x - b.x, dy = b.dodgeTo.y - b.y, d = Math.hypot(dx, dy); if (d < 3 || b.dodge <= 0) b.dodgeTo = null; else { b.dodge -= dt; b.vx = dx / d * sp * 1.4; b.vy = dy / d * sp * 1.4; return this.step(b, e, dt); } }
      if (ix || iy) { b.dodgeTo = null; b.idle = 0; const n = Math.hypot(ix, iy); b.vx = ix / n * sp; b.vy = iy / n * sp * 0.75; }
      else {
        b.idle += dt;
        if (b.idle > 0.6) this.aiMove(b, e, this.prefDist(P), sp * 0.6, dt);
        else { b.vx *= 0.8; b.vy *= 0.8; }
      }
      this.step(b, e, dt);
    }
    moveEnemy(dt) {
      const b = this.B.e, E = this.enemy, p = this.B.p;
      if (this.approach(b, p, dt)) return;
      if (E.status === 'slp' || (b.cast && b.cast.phase === 'wind')) { b.vx = b.vy = 0; return; }
      const sp = this.moveSpeed('e') * 0.9;
      if (b.dodgeTo) { const dx = b.dodgeTo.x - b.x, dy = b.dodgeTo.y - b.y, d = Math.hypot(dx, dy); if (d < 3 || b.dodge <= 0) b.dodgeTo = null; else { b.vx = dx / d * sp * 1.4; b.vy = dy / d * sp * 1.4; b.dodge -= dt; return this.step(b, p, dt); } }
      if (b.dodge > 0) { b.dodge -= dt; }
      else this.aiMove(b, p, this.prefDist(E), sp * 0.7, dt);
      this.step(b, p, dt);
    }
    // attaque automatique du partenaire : la technique choisie (sinon la première qu'il peut payer)
    autoAttack() {
      const P = this.active, L = P.moves;
      if (!L.length) return;
      let i = DW.clamp(this.lastMove || 0, 0, L.length - 1);
      if (!P.canPay(L[i].id)) i = L.findIndex(m => P.canPay(m.id));
      // un Digimon mal discipliné hésite parfois
      if (P === this.st.party[0] && DW.Life.disobeys(P) && Math.random() < 0.5) { this.B.p.cd = 1; this.pop('p', '...', '#c8d4ff'); return; }
      this.startCast('p', i >= 0 ? L[i] : { id: 'lutte' });
      this.B.p.cd = 0;
    }
    // attaque au corps à corps : le Digimon court vers l'adversaire
    approach(b, o, dt) {
      if (!b.cast || b.cast.phase !== 'approach') return false;
      const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy) || 1, sp = 120;
      b.vx = dx / d * sp; b.vy = dy / d * sp * 0.8;
      this.step(b, o, dt);
      return true;
    }
    // distance idéale : au contact pour qui frappe au corps à corps, à distance sinon
    prefDist(m) { const melee = m.moves.filter(mm => DW.MOVES[mm.id] && DW.MOVES[mm.id].contact).length; return melee * 2 > m.moves.length ? 46 : 100; }
    aiMove(b, o, want, sp, dt) {
      const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy) || 1;
      let tx = 0, ty = 0;
      if (d > want + 14) { tx = dx / d; ty = dy / d; }
      else if (d < want - 14) { tx = -dx / d; ty = -dy / d; }
      // tourne autour de l'adversaire de temps en temps
      ty += Math.sin(this.t * 0.9 + b.wob) * 0.5;
      const n = Math.hypot(tx, ty);
      const k = 1 - Math.pow(0.02, dt);
      b.vx += ((n > 0.1 ? tx / n * sp : 0) - b.vx) * k; b.vy += ((n > 0.1 ? ty / n * sp * 0.75 : 0) - b.vy) * k;
    }
    // case infranchissable de la carte de combat (arbre, eau, rocher...)
    blocked(x, y) {
      const m = this.field;
      if (!m) return false;
      const tx = Math.floor(x / 16), ty = Math.floor((y - 3) / 16);
      if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return true;
      return DW.SOLID.has(m.rows[ty][tx]) || this.gfx.solid.has(tx + ',' + ty);
    }
    step(b, o, dt) {
      // les obstacles de la carte arrêtent le déplacement (axe par axe : on glisse le long)
      const nx = DW.clamp(b.x + b.vx * dt, F.x0, F.x1), ny = DW.clamp(b.y + b.vy * dt, F.y0, F.y1);
      b.stuck = 0;
      if (!this.blocked(nx, b.y) && nx === b.x + b.vx * dt) b.x = nx; else if (Math.abs(b.vx) > 1) b.stuck = Math.sign(b.vx);
      if (!this.blocked(b.x, ny)) b.y = ny;
      // les deux Digimon ne se traversent pas
      const R = 24, dx = b.x - o.x, dy = (b.y - o.y) * 1.6, d = Math.hypot(dx, dy);
      if (d < R && d > 0) {
        const qx = DW.clamp(o.x + dx / d * R, F.x0, F.x1), qy = DW.clamp(o.y + dy / d * R / 1.6, F.y0, F.y1);
        if (!this.blocked(qx, qy)) { b.x = qx; b.y = qy; }
      }
      if (Math.abs(o.x - b.x) > 4) b.face = o.x > b.x ? 1 : -1;
    }
    // un « tour » toutes les 3 secondes : énergie, PM, poison, brûlure, fin des statuts
    turnTick() {
      this.gainEnergy('p', 3); this.gainEnergy('e', 3);
      for (const side of ['p', 'e']) {
        const m = this.mon(side);
        if (!m || m.hp <= 0) continue;
        m.mp = Math.min(m.maxMp, m.mp + Math.ceil(m.maxMp * MP_REGEN));
        if (m.status === 'psn' || m.status === 'brn') {
          const dmg = Math.max(1, Math.floor(m.maxHp / (m.status === 'psn' ? 12 : 16)));
          this.spr[side].blink = 0.3;
          this.applyDamage(side, dmg);
          this.pop(side, '-' + dmg, m.status === 'psn' ? '#c080ff' : '#ff9040');
          this.checkKO();
        }
      }
      if (this.energyFull) { this.energyFull = 0; this.say(`Énergie au maximum ! ENTRÉE : ${DW.MOVES[DW.sigOf(this.active)].name} !`); }
    }
    statusTime(side, dt) {
      const m = this.mon(side);
      if (!m || !m.status) return;
      if (m.stS == null) m.stS = ST_SEC[m.status] || 8;
      m.stS -= dt;
      if (m.stS <= 0) { this.say(`${this.label(side)} ${ST_END[m.status]} !`); m.status = null; m.stS = null; m.slp = 0; }
    }
    // statuts en secondes (au lieu des tours)
    async inflict(side, s, announce) {
      const was = this.mon(side).status;
      await super.inflict(side, s, announce);
      const m = this.mon(side);
      if (m.status === s && was !== s) { m.stS = ST_SEC[s]; this.pop(side, { psn: 'POISON', brn: 'BRÛLURE', par: 'PARALYSIE', slp: 'SOMMEIL' }[s], DW.STATUS_COL[s]); }
    }

    // ---------------------------------------------------------- techniques
    startCast(side, slot) {
      const b = this.B[side], mv = DW.MOVES[slot.id];
      if (!mv) return;
      const shape = shapeOf(mv, slot.special);
      const o = this.B[side === 'p' ? 'e' : 'p'], reach = REACH[shape] || 0, far = reach && Math.hypot(o.x - b.x, (o.y - b.y) * 1.4) >= reach;
      b.cast = { slot, mv, shape, reach, phase: far ? 'approach' : 'wind', t: 0 };
      b.vx = b.vy = 0;
      if (side === 'e') this.pop('e', mv.name, '#ffb0a0');
      if (!far) this.lock(side, shape === 'melee' ? 0.2 : side === 'e' ? 0.6 : 0.3);
    }
    // la zone d'impact est fixée sur la dalle de la cible : elle s'allume, on a le temps d'en sortir
    lock(side, wind) {
      const c = this.B[side].cast, tb = this.B[side === 'p' ? 'e' : 'p'];
      c.phase = 'wind'; c.wind = wind;
      if (c.shape === 'self') return;
      let cell = cellOf(tb.x, tb.y);
      // précision ratée : la zone tombe à côté
      if (!c.slot.special && c.mv.acc && Math.random() * 100 >= c.mv.acc && c.shape !== 'field')
        cell = [DW.clamp(cell[0] + DW.pick([-1, 1]), 0, G.cols - 1), DW.clamp(cell[1] + DW.pick([-1, 0, 1]), 0, G.rows - 1)];
      c.cell = cell; c.zone = zoneOf(c.shape === 'far' && c.mv.pow >= 90 ? 'big' : c.shape, cell);
      // l'ennemi visé tente parfois de sortir de la zone (selon sa vitesse)
      // (un Digimon sauvage esquive deux fois moins souvent qu'un boss : les combats ordinaires restent abordables)
      if (side === 'p' && c.shape !== 'field' && Math.random() < DW.clamp(0.25 + (this.spd('e') - this.spd('p')) / (this.spd('p') * 3), 0.1, 0.55) * (this.wild ? 0.5 : 1)) {
        let best = null, bd = 1e9;
        for (let y = 0; y < G.rows; y++) for (let x = 0; x < G.cols; x++) {
          if (c.zone.has(x + ',' + y)) continue;
          const p = cellCenter([x, y]), d = Math.hypot(p.x - tb.x, p.y - tb.y);
          if (d < bd) { bd = d; best = p; }
        }
        if (best) { tb.dodgeTo = best; tb.dodge = 0.9; }
      }
      // ton Digimon esquive tout seul lui aussi (selon sa Vitesse), sauf si tu le guides avec les flèches
      if (side === 'e' && c.shape !== 'field' && Math.random() < DW.clamp(0.14 + (this.spd('p') - this.spd('e')) / (this.spd('e') * 3), 0.05, 0.4)) {   // (moins souvent : la Vitesse entraînée compte, et le guider aux flèches sert)
        let best = null, bd = 1e9;
        for (let y = 0; y < G.rows; y++) for (let x = 0; x < G.cols; x++) {
          if (c.zone.has(x + ',' + y)) continue;
          const p = cellCenter([x, y]), d = Math.hypot(p.x - tb.x, p.y - tb.y);
          if (d < bd && !this.blocked(p.x, p.y)) { bd = d; best = p; }
        }
        if (best) { tb.dodgeTo = best; tb.dodge = 0.9; }
      }
    }
    async special(side) {
      const m = this.mon(side), b = this.B[side], mv = DW.MOVES[DW.sigOf(m)];
      this.energy[side] = 0;
      const shape = shapeOf(mv, true) === 'field' ? 'field' : 'huge';   // un coup spécial frappe toujours une grande zone
      b.cast = { slot: { id: DW.sigOf(m), special: true }, mv, shape, phase: 'hold', t: 0 };
      this.banner = { text: mv.name, who: this.label(side), side, t: 0 };
      Audio.sfx('evolve'); this.flash = 0.8; this.shake = 0.4;
      let v;
      if (side === 'p') { this.mode = 'none'; await DW.wait(0.6); this.banner = null; v = await this.chargeUp(); }
      else { await DW.wait(0.6); this.banner = null; v = 25 + Math.random() * 50; }
      if (!this.live) return;
      this.mode = 'live';
      b.cast.mult = 1.1 + v / 100;
      this.say(v >= 95 ? 'Charge MAXIMALE !!' : `Charge : ${Math.round(v)} %`);
      this.lock(side, side === 'e' ? 0.7 : 0.3);
    }
    // la technique part vers la zone verrouillée ; touchée si la cible y est encore à l'impact
    async release(side) {
      const b = this.B[side], c = b.cast, user = this.mon(side), tSide = side === 'p' ? 'e' : 'p', tb = this.B[tSide], tgt = this.mon(tSide), mv = c.mv;
      c.phase = 'fly';
      if (user.status === 'par' && Math.random() < 0.2) { this.sparkle(side, '#ffe030'); this.pop(side, 'PARALYSÉ', '#ffe030'); b.cast = null; b.cd = 1; return; }
      if (!c.slot.special) user.mp = Math.max(0, user.mp - DW.mpCost(c.slot.id));
      if (side === 'e' && c.slot.id !== 'lutte') this.seenMoves.add(c.slot.id);
      if (!c.slot.special) this.say(`${this.label(side)} utilise ${mv.name} !`);
      // soins et techniques sur soi : immédiats
      if (c.shape === 'self') {
        if (this.live) await this.useMoveSelf(side, mv);
        b.cast = null; b.cd = this.cooldown(side, mv); return;
      }
      const at = c.shape === 'field' ? { x: tb.x, y: tb.y } : cellCenter(c.cell);
      const h = DW.Sprites.battle(tgt.sp).h * depth(at.y) * 0.45;
      const a = this.center(side), aim = { x: at.x, y: at.y - h };
      const saveT = { x: tb.x, y: tb.y };
      try { await DW.playFXAt(this, mv, side, a, aim); } catch (e) { DW.reportError(e, 'arène'); }
      b.cast = null; b.cd = this.cooldown(side, mv);
      if (!this.live) return;
      const ax = at.x, ay = at.y;
      // touché ?
      const hit = tgt.hp > 0 && c.zone.has(cellOf(tb.x, tb.y).join(','));
      if (!hit) {
        DW.Elem.impact(this, { x: ax, y: ay - 10 }, mv.type, false); DW.Elem.decal(this, ax, ay, mv.type, false);
        Audio.sfx('swoosh');
        this.popAt(ax, ay - 30, 'RATÉ !', '#c8d4ff');
        if (side === 'e') this.say(`${this.active.name} esquive !`);
        return;
      }
      if (!mv.pow) {
        if (mv.st) await this.inflict(tSide, mv.st.s, true);
        if (mv.sc) await this.statChange(tSide, mv.sc.s, mv.sc.n);
        return;
      }
      const r = this.calc(side, mv, user, tgt, (c.slot.special ? c.mult || 1.5 : 1) * (SHAPE_MULT[c.shape] || 1) * (tb.guard > 0 ? 0.5 : 1));
      if (tb.guard > 0) this.pop(tSide, 'PARÉ', '#8ad0ff');
      if (c.slot.special) { this.shake = 0.7; this.flash = 0.5; }
      // signature de l'élément : impact, marque au sol, image figée un instant (game/fxelem.js)
      DW.Elem.impact(this, this.center(tSide), mv.type, c.slot.special);
      DW.Elem.decal(this, tb.x, tb.y + 2, mv.type, c.slot.special);
      this.hitStop = c.slot.special ? 0.18 : r.crit ? 0.12 : 0.06;
      this.hitAnim(tSide, r.tm);
      if (tgt.status === 'slp') { tgt.status = null; tgt.stS = null; this.pop(tSide, 'RÉVEILLÉ', '#ffffff'); }
      this.applyDamage(tSide, r.dmg);
      this.pop(tSide, '-' + r.dmg, r.tm > 1 ? '#ffe040' : r.tm < 1 ? '#a0b0c8' : '#ffffff', r.crit || c.slot.special);
      // recul
      const kx = tb.x - saveT.x, dir = Math.sign(tb.x - b.x) || 1;
      tb.vx = dir * (60 + r.dmg / tgt.maxHp * 200) + kx; tb.dodge = 0.25;
      if (!c.slot.special) this.gainEnergy(side, 12);
      this.gainEnergy(tSide, 4 + Math.round(r.dmg / tgt.maxHp * 35));
      if (r.crit) this.popAt(tb.x, tb.y - 62, 'CRITIQUE !', '#ff8060');
      else if (r.tm > 1) this.popAt(tb.x, tb.y - 62, 'SUPER EFFICACE !', '#ffe040');
      else if (r.tm < 1) this.popAt(tb.x, tb.y - 62, 'peu efficace', '#a0b0c8');
      if (c.slot.id === 'lutte') { const n = Math.max(1, Math.floor(user.maxHp / 4)); this.applyDamage(side, n); this.pop(side, '-' + n, '#ff8080'); }
      if (tgt.hp > 0 && mv.st && Math.random() < mv.st.ch) await this.inflict(tSide, mv.st.s, false);
      if (tgt.hp > 0 && mv.sc && Math.random() < (mv.sc.ch || 1)) await this.statChange(mv.sc.who === 'self' ? side : tSide, mv.sc.s, mv.sc.n);
      this.checkKO();
    }
    async useMoveSelf(side, mv) {
      const user = this.mon(side), who = this.label(side);
      await DW.playFX(this, mv, side);
      if (mv.heal) {
        const n = Math.min(user.maxHp - user.hp, Math.floor(user.maxHp * mv.heal));
        if (n > 0) { Audio.sfx('heal'); this.sparkle(side, '#80ff90'); this.hpShow[side] = user.hp; user.hp += n; DW.tween(this.hpShow, { [side]: user.hp }, 0.5); this.pop(side, '+' + n, '#80ff90'); }
        else this.say(`Les PV de ${who} sont déjà au maximum !`);
      }
      if (mv.sc) await this.statChange(side, mv.sc.s, mv.sc.n);
    }
    // temps de récupération après une technique : plus long pour les grosses attaques, plus court si rapide
    cooldown(side, mv) {
      const base = 0.7 + (mv.pow || 40) / 90, sp = this.spd(side) / (this.spd('p') + this.spd('e')) * 2;
      return (side === 'e' ? base * 1.25 + Math.random() * 1.2 : base + 0.4 + Math.random() * 0.4) / DW.clamp(sp, 0.7, 1.4);
    }
    checkKO() {
      if (!this.live) return;
      if (this.enemy.hp <= 0) return this.end('win');
      if (this.active.hp <= 0) {
        const idx = this.st.party.findIndex(m => m.hp > 0);
        if (idx < 0) return this.end('lose');
        this.say(`${this.active.name} est K.O. !`);
        this.sendOut(idx);
      }
    }
    close(r) {
      IMM = null;
      super.close(r);
    }
    tick(dt) {
      super.tick(dt);
      DW.Elem.tickDecals(this, dt);
      this.camTo(1 - Math.pow(0.04, dt));
      for (let i = this.pops.length - 1; i >= 0; i--) { const p = this.pops[i]; p.t += dt; if (p.t > 1.1) this.pops.splice(i, 1); }
    }
  }
  ArenaScene.FIELDS = {};   // cartes de combat des boss : { clé: () => carte 36 × 24 (rows, paintGround, objects, fx) }
  ArenaScene.FIELD = F; ArenaScene.GRID = G; ArenaScene.shapeOf = shapeOf; ArenaScene.SHAPE_NAME = SHAPE_NAME; ArenaScene.fieldMap = fieldMap;
  ArenaScene.depth = depth;
  DW.ArenaScene = ArenaScene;
})();
