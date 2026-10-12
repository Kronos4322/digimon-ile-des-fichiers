'use strict';
// =====================================================================
//  EXPLORATION : déplacement sur grille, PNJ, herbes hautes, scripts
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H, TS = 16;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const WALK = 0.24, RUN = 0.13; // secondes par case

  class Overworld extends DW.Scene {
    constructor(mapId, x, y, dir) {
      super();
      this.locked = false; this.stepCd = 3; this.shake = 0; this.flashA = 0; this.big = null;
      this.weather = new DW.Time.Weather();
      this.load(mapId, x, y, dir);
      DW.ow = this;
    }
    load(mapId, x, y, dir = 'down') {
      this.wilds = [];
      if (DW.MAPS[mapId].build) DW.MAPS[mapId].build();
      if (DW.MAPS[mapId].populate) DW.MAPS[mapId].populate();
      this.map = DW.getMap(mapId); this.mapId = mapId;
      this.gfx = DW.World.prepare(this.map);
      // cartes voisines (sorties et portes) : préparées pendant qu'on explore ; les autres sont libérées
      const near = new Set([mapId, ...(this.map.warps || []).map(w => w.to), ...(this.map.doors || []).map(d => d.to)]);
      this.near = [...near].filter(id => id !== mapId && DW.MAPS[id]);
      for (const id in DW.MAPS) if (!near.has(id) && DW.MAPS[id].gfx) DW.World.unprepare(DW.MAPS[id]);
      this.amb = new DW.World.Ambient(this.map);
      this.rustle = {};
      const st = DW.state;
      st.map = mapId; st.x = x; st.y = y;
      this.p = { x, y, dir, moving: false, sx: x, sy: y, tx: x, ty: y, t: 0, step: 0, run: false, turnT: 0 };
      this.f = { x, y, sx: x, sy: y, tx: x, ty: y, t: 0, moving: false, face: dir === 'left' ? 'left' : 'right' };
      // le partenaire se place derrière le joueur
      const [bx, by] = DIRS[OPP[dir]];
      if (!this.solid(x + bx, y + by)) Object.assign(this.f, { x: x + bx, y: y + by, sx: x + bx, sy: y + by, tx: x + bx, ty: y + by });
      st.visited[mapId] = true;
      // une ville atteinte devient le point de réapparition
      const rs = this.map.respawn;
      if (rs) st.heal = Array.isArray(rs) ? { map: mapId, x: rs[0], y: rs[1] } : { ...rs };
      if (DW.Story.decorate) DW.Story.decorate(this);
      // Digimon qui se promènent : position affichée interpolée
      for (const n of this.map.npcs || []) {
        n.hx = n.hx != null ? n.hx : n.x;
        n.hy = n.hy != null ? n.hy : n.y;
        if (n.wander) {
          n.x = n.home ? n.home[0] : n.x;
          n.y = n.home ? n.home[1] : n.y;
          n.home = [n.x, n.y]; n.mv = null; n.wt = Math.random() * 3;
        }
      }
      DW.Wild.spawn(this);
      this.banner = { t: 0 };
      this.bannerT = 2.6;
      Audio.play(this.map.music);
      // script d'arrivée (lancé dès que la scène est libre)
      this.onEnter = this.map.onEnter || null;
    }
    tileAt(x, y) { return (this.map.rows[y] || '')[x] || '#'; }
    npcVisible(n) { return !n.cond || n.cond(DW.state); }
    npcAt(x, y) { return (this.map.npcs || []).find(n => n.x === x && n.y === y && this.npcVisible(n)); }
    solid(x, y) {
      if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) return true;
      return DW.SOLID.has(this.tileAt(x, y)) || this.gfx.solid.has(x + ',' + y) || !!this.npcAt(x, y) || DW.Care.poopAt(this.mapId, x, y) || !!DW.Wild.at(this, x, y);
    }
    get partner() { return DW.state.party.find(m => m.hp > 0) || null; }

    // ---------------------------------------------------------- logique
    update(dt) {
      const P = this.p;
      if (P.moving) {
        P.t += dt / (P.run ? RUN : WALK);
        if (this.f.moving) this.f.t = Math.min(1, P.t);
        if (P.t < 1) return;
        const over = Math.min(P.t - 1, 0.5);
        this.finishStep();
        if (P.forced) { P.forced = false; const r = P.forcedR; P.forcedR = null; r && r(); return; }
        const ev = this.checkStep();
        if (ev) { this.runScript(ev); return; }
        // enchaînement fluide si la touche reste enfoncée
        const d = !this.locked && Input.dir();
        if (d) { P.dir = d; this.tryMove(d, Input.isDown('run'), over); }
        return;
      }
      if (this.locked) return;
      if (this.onEnter) { const f = this.onEnter; this.onEnter = null; this.runScript(f); return; }
      const wc = DW.Wild.contact(this);
      if (wc) { this.runScript(wc); return; }
      if (Input.hit('back') || Input.hit('menu')) { Audio.sfx('select'); this.runScript(async () => { await Game.push(new DW.MenuScene()); }); return; }
      if (Input.hit('ok')) { this.interact(); return; }
      const d = Input.dir();
      if (!d) { P.turnT = 0; return; }
      // appui bref dans une nouvelle direction = se tourner sur place
      if (d !== P.dir) { P.dir = d; P.turnT = 0.09; return; }
      if (P.turnT > 0) { P.turnT -= dt; return; }
      this.tryMove(d, Input.isDown('run'), 0);
    }
    tick(dt) {
      if (this.shake > 0) this.shake -= dt;
      if (this.banner.t < this.bannerT + 0.5) this.banner.t += dt;
      if (Game.top() === this) this.background();
      if (!this.locked && Game.top() === this) { DW.state.time += dt; DW.Time.advance(dt, this.map.climate); DW.Care.update(this, dt); DW.Companion.update(this, dt); }
      this.weather.update(dt);
      const rain = !this.map.indoor && DW.Time.weather() === 'rain';
      this.wet = DW.clamp((this.wet || 0) + (rain ? 0.25 : -0.02) * dt, 0, 1);
      if (DW.saveFlash > 0) DW.saveFlash -= dt;
      this.amb.update(dt);
      if (!this.locked && Game.top() === this) DW.Wild.update(this, dt);
      if (!this.locked) this.wanderNpcs(dt); else for (const n of this.map.npcs || []) if (n.mv) this.stepNpc(n, dt);
      for (const k in this.rustle) { this.rustle[k] -= dt; if (this.rustle[k] <= 0) delete this.rustle[k]; }
    }
    // ---------------------------------------------------------- Digimon qui flânent (wander : rayon autour de leur place)
    wanderNpcs(dt) {
      const P = this.p, F = this.f;
      for (const n of this.map.npcs || []) {
        if (!n.wander || !this.npcVisible(n)) continue;
        if (n.mv) { this.stepNpc(n, dt); continue; }
        n.wt -= dt;
        if (n.wt > 0) continue;
        n.wt = 1.2 + Math.random() * 3.5;
        const [dx, dy] = DIRS[DW.pick(['up', 'down', 'left', 'right'])], nx = n.x + dx, ny = n.y + dy;
        if (Math.abs(nx - n.home[0]) > n.wander || Math.abs(ny - n.home[1]) > n.wander) continue;
        const busy = (nx === P.x && ny === P.y) || (nx === P.tx && ny === P.ty) || (nx === F.x && ny === F.y) || (nx === F.tx && ny === F.ty);
        if (busy || this.solid(nx, ny) || DW.World.isTall(this.tileAt(nx, ny))) continue;
        if (dx) n.face = dx > 0 ? 'right' : 'left';
        n.mv = { sx: n.x, sy: n.y, t: 0 };
        n.x = nx; n.y = ny;
      }
    }
    stepNpc(n, dt) {
      n.mv.t += dt / 0.42;
      const k = Math.min(1, n.mv.t);
      n.hx = DW.lerp(n.mv.sx, n.x, k); n.hy = DW.lerp(n.mv.sy, n.y, k);
      if (k >= 1) n.mv = null;
    }
    // travail de fond, ~3 ms par image : fin de l'eau animée, puis cartes voisines
    background() {
      if (!DW.World.prepareSome(this.map, 3)) return;
      // cartes voisines : seulement quand le héros est immobile (aucune saccade en marchant)
      if (this.p.moving || Input.dir()) return;
      for (const id of this.near || []) {
        const M = DW.MAPS[id];
        if (M.gfx && !M._prep) continue;
        if (M.build) M.build();
        DW.World.prepareSome(DW.getMap(id), 3);
        return;
      }
    }
    tryMove(d, run, over) {
      const P = this.p;
      P.dir = d;
      const [dx, dy] = DIRS[d], nx = P.x + dx, ny = P.y + dy;
      if (nx < 0 || ny < 0 || nx >= this.map.w || ny >= this.map.h) {
        const w = (this.map.warps || []).find(w => w.dir === d && P.x >= w.x && P.x < w.x + (w.w || 1) && P.y >= w.y && P.y < w.y + (w.h || 1));
        if (w && w.cond && !w.cond(DW.state)) {
          if (!this.bumpT || this.t - this.bumpT > 0.4) { Audio.sfx('bump'); this.bumpT = this.t; this.runScript(async () => { await DW.say(typeof w.lock === 'function' ? w.lock() : w.lock); }); }
          return false;
        }
        if (w) this.runScript(() => this.doWarp(w));
        return false;
      }
      const door = (this.map.doors || []).find(o => o.dir === d && nx >= o.x && nx < o.x + (o.w || 1) && ny === o.y && (!o.cond || o.cond(DW.state)));
      if (door) { this.runScript(() => this.enterDoor(door, nx)); return false; }
      if (this.solid(nx, ny)) {
        if (!this.bumpT || this.t - this.bumpT > 0.4) { Audio.sfx('bump'); this.bumpT = this.t; }
        return false;
      }
      this.startMove(nx, ny, run, over);
      return true;
    }
    startMove(nx, ny, run, over = 0) {
      const P = this.p, F = this.f;
      DW.Companion.wake(this);
      Object.assign(P, { moving: true, sx: P.x, sy: P.y, tx: nx, ty: ny, t: over, run });
      P.step++;
      if (DW.World.isTall(this.tileAt(nx, ny))) this.rustle[nx + ',' + ny] = 0.5;
      if (!this.partner) Object.assign(F, { moving: false, x: P.x, y: P.y, sx: P.x, sy: P.y, tx: P.x, ty: P.y });   // sans partenaire : la place reste collée au héros
      else if (F.x !== P.x || F.y !== P.y) {
        Object.assign(F, { moving: true, sx: F.x, sy: F.y, tx: P.x, ty: P.y, t: over });
        if (P.x > F.x) F.face = 'right'; else if (P.x < F.x) F.face = 'left';
        if (DW.World.isTall(this.tileAt(P.x, P.y))) this.rustle[P.x + ',' + P.y] = 0.5;
      }
    }
    finishStep() {
      const P = this.p, F = this.f;
      Object.assign(P, { moving: false, x: P.tx, y: P.ty, sx: P.tx, sy: P.ty, t: 0 });
      if (F.moving) Object.assign(F, { moving: false, x: F.tx, y: F.ty, sx: F.tx, sy: F.ty, t: 0 });
      DW.state.x = P.x; DW.state.y = P.y;
    }
    // renvoie un script à lancer (déclencheur, rencontre) ou null
    checkStep() {
      const P = this.p, st = DW.state;
      this.stepCd--;
      for (const tr of this.map.triggers || []) {
        if (P.x >= tr.x && P.x < tr.x + (tr.w || 1) && P.y >= tr.y && P.y < tr.y + (tr.h || 1) && (!tr.cond || tr.cond(st))) return tr.run;
      }
      // Digimon sauvages visibles (wild.js) : le contact lance le combat
      const wc = DW.Wild.contact(this);
      if (wc) return wc;
      return DW.Companion.stepFind(this);
    }
    forceStep(d) {
      const P = this.p;
      P.dir = d;
      const [dx, dy] = DIRS[d];
      return new Promise(r => { P.forced = true; P.forcedR = r; this.startMove(P.x + dx, P.y + dy, false); });
    }
    async doWarp(w) {
      const P = this.p;
      await DW.fade(1, 0.3);
      const nx = w.tx + (P.x - w.x), ny = w.ty + (P.y - w.y);
      this.load(w.to, nx, ny, P.dir);
      DW.autosave();
      await DW.fade(0, 0.3);
    }
    async enterDoor(o, nx) {
      Audio.sfx('door');
      await DW.fade(1, 0.25);
      this.load(o.to, o.tx + (nx - o.x), o.ty, o.dir);
      DW.autosave();
      await DW.fade(0, 0.25);
    }
    async runScript(fn) {
      if (this.locked) return;
      this.locked = true;
      try { await fn(this); } catch (e) { DW.reportError(e, 'script'); }
      this.locked = false;
    }
    interact() {
      const P = this.p, [dx, dy] = DIRS[P.dir], x = P.x + dx, y = P.y + dy;
      const n = this.npcAt(x, y);
      if (n) {
        if (P.dir === 'left') n.face = 'right'; else if (P.dir === 'right') n.face = 'left';
        this.runScript(ow => n.talk(ow, n));
        return true;
      }
      const sign = this.map.signs && this.map.signs[`${x},${y}`];
      if (sign) { this.runScript(typeof sign === 'function' ? sign : async () => { await DW.say(sign); }); return true; }
      if (DW.Care.poopAt(this.mapId, x, y)) { this.runScript(() => DW.Care.clean(this.mapId, x, y)); return true; }
      const info = DW.World.info(this.tileAt(x, y));
      if (info.train) { this.runScript(() => DW.Training.atSpot(info.train)); return true; }
      if (info.toilet) { this.runScript(() => DW.Care.toilet()); return true; }
      const act = this.map.tileActs && this.map.tileActs[this.tileAt(x, y)];
      if (act) { this.runScript(act); return true; }
      const F = this.f, pt = this.partner;
      if (pt && F.x === x && F.y === y) { this.runScript(() => this.talkPartner(pt)); return true; }
      return false;
    }
    async talkPartner(m) {
      if (await DW.Life.talk(m)) return;
      const lines = m.hp < m.maxHp / 3
        ? [`${m.name} a l'air épuisé... Il faudrait le soigner.`]
        : [`${m.name} te regarde avec un grand sourire.`, `${m.name} : J'ai un petit creux... On mange quand ?`,
          `${m.name} : Je te protégerai, quoi qu'il arrive !`, `${m.name} sautille joyeusement à tes côtés.`,
          `${m.name} : Tu crois qu'on retrouvera les autres enfants ?`, `${m.name} renifle l'air avec curiosité.`];
      m.addHappy(1);
      DW.Companion.wake(this); DW.Companion.emote(this, m.happy >= 60 ? 'heart' : 'note', 2.4);
      await DW.say(DW.Care.talkLine(m) || DW.pick(lines));
    }

    // ---------------------------------------------------------- combats
    // éclairs de rencontre ; on en profite pour dessiner les sprites du combat (évite un gel au 1er affichage)
    battleKey() { return this.map.bg === 'foret' && this.map.theme ? 'foret@' + this.map.theme : this.map.bg; }
    async encounterFx(o = {}) {
      const S = DW.Sprites, st = DW.state, me = st.party.find(m => m.hp > 0);
      const warm = [() => o.enemy && S.battle(o.enemy.sp), () => me && S.battle(me.sp), () => DW.World.battleBg(o.bg || this.battleKey()),
        () => o.enemy && S.pose(o.enemy.sp, 'attack'), () => me && S.pose(me.sp, 'attack'), () => o.enemy && S.pose(o.enemy.sp, 'hurt'), () => me && S.pose(me.sp, 'hurt')];
      for (let i = 0; i < 3; i++) {
        this.flashA = 1; await DW.wait(0.07); if (warm[i * 2]) warm[i * 2]();
        this.flashA = 0; await DW.wait(0.07); if (warm[i * 2 + 1]) warm[i * 2 + 1]();
      }
      if (warm[6]) warm[6]();
    }
    async battle(o) {
      const st = DW.state;
      // toute l'équipe K.O. (après une défaite sans conséquence) : pas de combat possible
      if (!st.party.some(m => m.hp > 0)) {
        await DW.say("Tes Digimon sont trop épuisés pour se battre... Fais-les soigner d'abord !");
        Audio.play(this.map.music);
        return 'none';
      }
      Audio.play(o.music || (o.boss ? 'boss' : 'battle'));
      await this.encounterFx({ enemy: o.enemy, bg: o.bg || this.battleKey() });
      if (!o.boss) { const zs = st.zoneSeen[this.mapId] = st.zoneSeen[this.mapId] || {}; zs[o.enemy.sp] = true; }
      const res = await Game.push(new DW.BattleScene({ bg: this.battleKey(), ...o }));
      this.stepCd = 4;
      // Digivolution possible : on propose la table des Digivolutions
      for (const m of st.party) {
        if (!m.evoPending || m.hp <= 0) continue;
        m.evoPending = false;
        if (!DW.Evo.available(m).length || (DW.AutoEvo && DW.AutoEvo.on())) continue;
        Audio.play('evolve');
        const r = await DW.ask(`Le Digivice vibre ! ${m.name} peut digivoluer. Ouvrir la table des Digivolutions ?`);
        if (r === 0) await Game.push(new DW.EvoTableScene(st.party.indexOf(m)));
      }
      Audio.play(this.map.music);
      const lead = DW.state.party[0];
      if (lead && res === 'win') DW.Life.moment('good', 'une belle victoire');
      if (lead && lead.hp > 0 && lead.hp < lead.maxHp / 4 && !lead.hurt && Math.random() < 0.35) {
        lead.hurt = DW.state.clock;
        DW.Care.toast(`${lead.name} s'est blessé pendant le combat ! (Bandage)`, '#ff8a8a');
      }
      if (res === 'lose' && !o.canLose) await this.blackout();
      else DW.autosave();
      return res;
    }
    async blackout() {
      const st = DW.state;
      await DW.say('Tu perds connaissance...');
      await DW.fade(1, 0.6);
      st.bits = Math.floor(st.bits / 2);
      st.party.forEach(m => m.heal());
      const hp = st.heal;
      this.load(hp.map, hp.x, hp.y, 'down');
      await DW.wait(0.5);
      await DW.fade(0, 0.6);
      await DW.say('Tu te réveilles. Tes Digimon ont récupéré... mais tu as perdu la moitié de tes Bits.');
    }

    // ---------------------------------------------------------- rendu
    pos(e) { const k = e.moving ? Math.min(1, e.t) : 0; return { x: DW.lerp(e.sx, e.tx, k), y: DW.lerp(e.sy, e.ty, k) }; }
    camera() {
      const pp = this.pos(this.p);
      const px = Math.round(pp.x * TS) + 8, py = Math.round(pp.y * TS) + 8;
      const mw = this.map.w * TS, mh = this.map.h * TS;
      const cx = mw <= W ? Math.round((mw - W) / 2) : DW.clamp(px - W / 2, 0, mw - W);
      const cy = mh <= H ? Math.round((mh - H) / 2) : DW.clamp(py - H / 2, 0, mh - H);
      return { cx, cy };
    }
    // case "occupée" visuellement (pour les herbes devant les pieds)
    standTile(e) { return e.moving && e.t > 0.3 ? [e.tx, e.ty] : [e.x, e.y]; }
    draw(c) {
      const cam = this.camera(), { cx, cy } = cam, g = this.gfx;
      const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 6) : 0;
      c.save(); c.translate(-cx + sx, -cy);
      // sol fixe + calque d'eau animé (seulement la partie visible)
      c.drawImage(g.ground, 0, 0);
      if (g.water && g.water.frames.length) { const w = g.water, fr = w.frames[Math.floor(this.t * g.fps) % w.frames.length]; c.drawImage(fr, w.x, w.y); }
      const vx0 = cx - 48, vx1 = cx + W + 48, vy0 = cy - 16, vy1 = cy + H + 64;
      if (this.wet > 0.02 && g.puddles) this.drawPuddles(c, g.puddles, vx0, vx1, vy0, vy1);
      // herbes hautes (couche arrière)
      const tallFrame = (tx, ty) => this.rustle[tx + ',' + ty] ? Math.floor(this.t * 14) % 3 : [0, 1, 2, 1][Math.floor(this.t * 1.6 + tx * 0.4 + ty * 0.25) % 4];
      for (const tg of g.tall) {
        const X = tg.tx * TS, Y = tg.ty * TS;
        if (X < vx0 || X > vx1 || Y < vy0 || Y > vy1) continue;
        c.drawImage(DW.World.tall(tg.kind, tg.v, tallFrame(tg.tx, tg.ty)), X, Y - 8);
      }
      // objets & personnages triés en profondeur
      // direction et intensité des ombres selon l'heure
      const hr = DW.Time.hour(), L = DW.Time.light();
      this.sun = { dx: DW.clamp((hr - 12.5) / 6, -1.2, 1.2), a: this.map.indoor ? 0 : 0.24 * (1 - Math.min(1, L.dark * 1.6)) * (DW.Time.weather() === 'clear' ? 1 : 0.45) };
      // liste réutilisée d'une image à l'autre ; les objets du décor y entrent tels quels (clé de tri o.s)
      const list = this._list || (this._list = []);
      list.length = 0;
      // ombres portées qui suivent la course du soleil (longues le matin et le soir) : un seul remplissage, au sol, sous tout le reste
      const sun = this.sun, shade = sun.a > 0.01;
      if (shade) { c.fillStyle = `rgba(0,20,10,${sun.a})`; c.beginPath(); }
      for (const o of g.objs) {
        if (o.x < vx0 - 30 || o.x > vx1 + 30 || o.y < vy0 || o.y > vy1 + 40) continue;
        if (o.s === undefined) o.s = o.sort;
        list.push(o);
        if (shade && !o.flat) {
          const rw = Math.min(16, o.spr.w / 3) * (1 + Math.abs(sun.dx) * (o.big ? 0.9 : 0.4)), sx = o.x + 2 + sun.dx * (o.big ? 10 : 4);
          c.moveTo(sx + rw, o.y); c.ellipse(sx, o.y, rw, 3, 0, 0, 7);
        }
      }
      if (shade) c.fill();
      for (const [x, y] of DW.state.poops[this.mapId] || []) list.push({ s: y - 0.02, ent: 'poop', x, y, tile: [x, y] });
      for (const n of this.map.npcs || []) {
        if (!this.npcVisible(n)) continue;
        const hy = n.hy != null ? n.hy : n.y;
        list.push({ s: hy, ent: 'npc', n, tile: [n.x, n.y] });
      }
      DW.Wild.entries(this, list);
      const P = this.p, F = this.f, pt = this.partner;
      const pp = this.pos(P);
      if (pt && !(F.x === P.x && F.y === P.y && !F.moving)) {
        const fp = this.pos(F);
        list.push({ s: fp.y - 0.01, ent: 'follower', fp, tile: this.standTile(F) });
      }
      list.push({ s: pp.y, ent: 'player', tile: this.standTile(P) });
      list.sort((a, b) => a.s - b.s);
      let playerIdx = -1, playerRect = null;
      list.forEach((e, i) => {
        if (e.spr) {
          const o = e, s = o.spr;
          const img = o.sprs ? o.sprs[Math.floor(this.t * o.fps + o.x * 0.013) % o.sprs.length].img : s.img;
          const X = Math.round(o.x - s.w / 2), Y = Math.round(o.y - s.h + 1);
          // le feuillage (haut du sprite) ondule doucement au vent ; sans décalage, un seul dessin suffit
          const sway = o.big && !o.flat ? Math.round(Math.sin(this.t * 1.3 + o.x * 0.07) * 0.8 + Math.sin(this.t * 0.37 + o.y * 0.05) * 0.5) : 0;
          if (sway) {
            const cut = Math.round(s.h * 0.62);
            c.drawImage(img, 0, 0, s.w, cut, X + sway, Y, s.w, cut);
            c.drawImage(img, 0, cut, s.w, s.h - cut, X, Y + cut, s.w, s.h - cut);
          } else c.drawImage(img, X, Y);
          return;
        }
        if (e.ent === 'poop') DW.Care.drawPoop(c, e.x * TS + 8, e.y * TS + 12);
        else if (e.ent === 'npc' && e.n.pickup) this.drawPickup(c, e.n.x * TS + 8, e.n.y * TS + 13);
        else if (e.ent === 'npc') {
          const n = e.n, X = n.hx != null ? n.hx : n.x, Y = n.hy != null ? n.hy : n.y;
          this.drawMon(c, n.sp, X * TS + 8, Y * TS + 15, n.face === 'left', n.mv ? this.t * 12 : this.t * 1.6 + n.x * 0.37, !!n.mv);
          if (n.gear) DW.Story.drawGear(c, X * TS + 8, Y * TS + 15, this.t, n.sp);
        }
        else if (e.ent === 'wild') DW.Wild.draw(this, c, e.w);
        else if (e.ent === 'follower') DW.Companion.draw(this, c, pt, e.fp.x * TS + 8, e.fp.y * TS + 15);
        else { playerIdx = i; playerRect = this.drawPlayer(c, pp); }
        const [tx, ty] = e.tile;
        const ch = this.tileAt(tx, ty);
        if (DW.World.isTall(ch)) {
          const spr = DW.World.tall(DW.World.tallKind(this.map, DW.World.info(ch).tall), Math.floor(DW.Art.hash(tx, ty, 70) * 4), tallFrame(tx, ty));
          c.drawImage(spr, 0, 15, 16, 9, tx * TS, ty * TS + 7, 16, 9);
        }
      });
      // héros caché derrière un grand objet : silhouette translucide
      if (playerRect) {
        let hidden = false;
        for (let i = playerIdx + 1; i < list.length && !hidden; i++) { const e = list[i]; hidden = !!(e.spr && e.big && overlap(playerRect, objRect(e))); }
        if (hidden) { c.globalAlpha = 0.45; this.drawPlayer(c, pp, true); c.globalAlpha = 1; }
      }
      if (this.big) {
        const spr = DW.Sprites.battle(this.big.sp);
        DW.Sprites.draw(c, spr, cx + W / 2 + this.big.x, cy + this.big.y, { flip: true, frame: Math.floor(this.t * 6) });
      }
      this.amb.drawWorld(c, cam);
      // barrières de données sur les passages encore fermés
      for (const w of this.map.warps || []) if (w.cond && !w.cond(DW.state)) {
        for (let yy = w.y; yy < w.y + (w.h || 1); yy++) for (let xx = w.x; xx < w.x + (w.w || 1); xx++) {
          const X = xx * TS, Y = yy * TS, a = 0.35 + 0.15 * Math.sin(this.t * 4 + xx + yy);
          c.fillStyle = `rgba(60,255,160,${a * 0.5})`; c.fillRect(X, Y, TS, TS);
          c.fillStyle = `rgba(160,255,210,${a})`;
          for (let k = 0; k < 4; k++) c.fillRect(X + ((k * 5 + Math.floor(this.t * 12)) % TS), Y + 1, 1, TS - 2);
          c.fillRect(X, Y + ((Math.floor(this.t * 20) + xx * 3) % TS), TS, 1);
        }
      }
      c.restore();
      this.amb.drawScreen(c, cam);
      if (!this.map.indoor) this.weather.draw(c);
      const lights = this.amb.lights().map(L => ({ ...L, x: L.x - cx, y: L.y - cy }));
      lights.push({ x: Math.round(pp.x * TS) + 8 - cx, y: Math.round(pp.y * TS) + 4 - cy, r: 52 });
      DW.Time.drawLight(c, lights, this.map.indoor ? 0.75 : 1, this.map.dark);
      if (!this.locked || Game.top() === this) { DW.Time.drawClock(c, W - 92, 6); DW.Care.drawHUD(c, DW.Care.lead(), W - 152, 6); }
      DW.Care.drawToasts(c);
      if (DW.saveFlash > 0) {
        c.globalAlpha = Math.min(1, DW.saveFlash);
        c.drawImage(DW.Icons.menu('sauver'), W - 22, H - 22);
        UI.text(c, 'Sauvegardé', W - 26, H - 10, { size: 7, align: 'right' });
        c.globalAlpha = 1;
      }
      if (this.flashA) { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); }
      // bandeau du nom de la zone
      const bt = this.banner.t;
      if (bt < this.bannerT + 0.5) {
        const k = bt < 0.3 ? bt / 0.3 : bt > this.bannerT ? 1 - (bt - this.bannerT) / 0.5 : 1;
        const w = UI.measure(c, this.map.name, 10) + 24;
        UI.box(c, -6 + (k - 1) * (w + 10), 8, w, 20);
        UI.text(c, this.map.name, 6 + (k - 1) * (w + 10), 22, { size: 10 });
      }
    }
    // flaques après la pluie : reflet du ciel (bleu le jour, orangé au crépuscule, sombre la nuit),
    // reflets des lanternes la nuit, ronds de pluie
    drawPuddles(c, list, x0, x1, y0, y1) {
      const hr = DW.Time.hour(), L = DW.Time.light(), dusk = (hr > 17 && hr < 20.5) || (hr > 5 && hr < 7.5);
      const sky = L.dark > 0.55 ? [40, 56, 110] : dusk ? [236, 150, 110] : [150, 196, 236];
      const a = this.wet, rain = DW.Time.weather() === 'rain', lamps = L.dark > 0.3 ? this.amb.lights() : [];
      for (const p of list) {
        if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
        const k = Math.min(1, a * 1.4), rx = p.rx * k, ry = p.ry * k;
        if (rx < 1) continue;
        c.fillStyle = `rgba(20,30,50,${0.35 * a})`; c.beginPath(); c.ellipse(p.x, p.y + 0.6, rx + 0.8, ry + 0.6, 0, 0, 7); c.fill();
        c.fillStyle = `rgba(${sky[0]},${sky[1]},${sky[2]},${0.6 * a})`; c.beginPath(); c.ellipse(p.x, p.y, rx, ry, 0, 0, 7); c.fill();
        c.fillStyle = `rgba(255,255,255,${0.5 * a})`; c.fillRect(Math.round(p.x - rx * 0.5), Math.round(p.y - ry * 0.4), Math.max(1, Math.round(rx * 0.5)), 1);
        for (const l of lamps) if (Math.abs(l.x - p.x) < 30 && p.y > l.y && p.y - l.y < 60) { c.fillStyle = `rgba(255,220,130,${0.7 * a})`; c.fillRect(Math.round(p.x - 1), Math.round(p.y - ry * 0.6), 2, Math.max(1, Math.round(ry * 1.2))); break; }
        if (rain) {
          const ph = (this.t * 1.3 + p.x * 0.07) % 1, r = ph * rx;
          c.strokeStyle = `rgba(255,255,255,${(1 - ph) * 0.6})`; c.lineWidth = 0.6;
          c.beginPath(); c.ellipse(p.x + (p.y % 3) - 1, p.y, r, r * ry / rx, 0, 0, 7); c.stroke();
        }
      }
    }
    drawPlayer(c, pp, ghost) {
      const P = this.p;
      // cycle de marche à 4 temps : pied droit, passage, pied gauche, passage
      const frame = P.moving ? ((P.step % 2) * 2 + (P.t < 0.5 ? 1 : 2)) % 4 : 0;
      const spr = DW.Sprites.hero(P.dir, frame);
      const bob = P.moving && frame % 2 === 1 ? -1 : 0;
      const X = Math.round(pp.x * TS + 8 - spr.w / 2), Y = Math.round(pp.y * TS + 17 - spr.h) + bob;
      if (!ghost) {
        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.beginPath(); c.ellipse(Math.round(pp.x * TS) + 8, Math.round(pp.y * TS) + 15, 7.5, 2.8, 0, 0, 7); c.fill();
      }
      c.drawImage(spr.img, X, Y);
      return { x: X + 3, y: Y + 2, w: spr.w - 6, h: spr.h - 2 };
    }
    drawPickup(c, x, y) {
      const b = Math.round(Math.sin(this.t * 3) * 1.5);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x, y + 2, 4, 1.6, 0, 0, 7); c.fill();
      c.drawImage(DW.Icons.item('capsule'), x - 8, y - 14 + b);
      const k = (this.t * 1.5) % 1;
      if (k < 0.5) { c.fillStyle = `rgba(255,255,220,${1 - k * 2})`; c.fillRect(x + 3, y - 14 + b, 1, 3); c.fillRect(x + 2, y - 13 + b, 3, 1); }
    }
    drawMon(c, sp, x, y, flip, t, moving) {
      const spr = DW.Sprites.ow(sp);
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.beginPath(); c.ellipse(x, y, spr.w / 2.8, 2.5, 0, 0, 7); c.fill();
      DW.Sprites.draw(c, spr, x, y + 2 - (moving ? Math.abs(Math.round(Math.sin(t) * 1.5)) : 0), { flip, frame: moving ? 0 : Math.floor(t) });
    }
  }
  const objRect = o => ({ x: o.x - o.spr.w / 2, y: o.y - o.spr.h, w: o.spr.w, h: o.spr.h * 0.8 });
  const overlap = (a, b) => a.x + 3 < b.x + b.w && a.x + a.w - 3 > b.x && a.y + 4 < b.y + b.h && a.y + a.h > b.y;
  DW.Overworld = Overworld;

  DW.learnEvoMoves = async m => {
    for (const [l, id] of m.d.learn) if ((l === 0 || l === m.level) && !m.knows(id)) await DW.learnMove(m, id);
  };
})();
