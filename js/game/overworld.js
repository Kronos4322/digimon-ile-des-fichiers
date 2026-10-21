'use strict';
// =====================================================================
//  EXPLORATION : déplacement sur grille, PNJ, herbes hautes, scripts
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H, TS = 16;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = DW.OPP;
  const SIGN_STAT = ['hp', 'atk', 'def', 'spd', 'int', 'mp'];   // pictogramme des panneaux du Terrain d'entraînement (v) → poste
  // (seul le feuillage ondule au vent : jamais les maisons ni les grands décors)
  const SWAY = { tree: 1, oak: 1, birch: 1, bigtree: 1, palm: 1, pine: 1, fruittree: 1, jungletree: 1, swamptree: 1, cycad: 1, acacia: 1, baobab: 1, mangrove: 1, candytree: 1 };
  const WALK = 0.2, RUN = 0.11; // secondes par case (×√2 en diagonale : même vitesse dans toutes les directions)

  // DONNÉES D'UNE CARTE avant de la dessiner (aussi pour une voisine préparée à l'avance : son décor de première visite
  // est posé AVANT, sinon le dessin fait à l'avance serait jeté en entrant)
  DW.preparerCarte = mapId => {
    if (DW.MAPS[mapId].build) DW.MAPS[mapId].build();
    if (DW.MAPS[mapId].populate) DW.MAPS[mapId].populate();
    const map = DW.getMap(mapId);
    if (DW.MapKit.dress) DW.MapKit.dress(map, mapId);   // ensembles de décor par région, posés à la première visite (maps/decor.js)
    if (DW.Distrib) { DW.Distrib.signs(map, mapId); DW.Distrib.place(map, mapId); }   // panneaux au bord des chemins, distributeurs (maps/distrib.js)
    if (DW.Antre) DW.Antre.hole(map, mapId);   // le trou entre les cabines de la plage (maps/antre.js)
    if (DW.YokoVillage) DW.YokoVillage.place(map, mapId);   // le tronc creux vers le village des Poyomon (maps/yokomon.js)
    pnjHorsDecor(map);
    return map;
  };
  // un personnage n'est jamais DANS le décor : un rocher ou un arbre posé dans l'éditeur de cartes peut avoir pris sa
  // place ; il se décale alors sur la case libre la plus proche (vérifié une fois par état de la carte)
  function pnjHorsDecor(map) {
    const O = map.objects || [], N = map.npcs || [], cle = O.length + ':' + N.length;
    if (map._pnjCle === cle && map._pnjObj === O && map._pnjRows === map.rows) return;
    map._pnjCle = cle; map._pnjObj = O; map._pnjRows = map.rows;
    const occ = new Set();
    for (const o of O) if (!o.walk && !o.top) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y);
    for (const n of N) {
      if (n.shadow || n.gate || n.walk || n.x == null) continue;
      const ch = (map.rows[n.y] || '')[n.x];
      if (ch === undefined || !(DW.SOLID.has(ch) || occ.has(n.x + ',' + n.y))) continue;
      const [x, y] = DW.MapKit.freeNear(map, n.x, n.y, 4);
      if (x !== n.x || y !== n.y) { n.x = x; n.y = y; if (n.home) n.home = [x, y]; }
    }
  }
  class Overworld extends DW.Scene {
    constructor(mapId, x, y, dir) {
      super();
      this.locked = false; this.stepCd = 3; this.shake = 0; this.flashA = 0; this.big = null;
      this.weather = new DW.Time.Weather();
      this.load(mapId, x, y, dir);
      DW.ow = this;
    }
    // changer de carte en douceur : la carte est préparée par petits morceaux pendant l'écran noir du fondu
    // (« Chargement... » : core.js), puis on y entre ; déjà prête (préparée à l'avance) = immédiat
    async charger(mapId, x, y, dir = 'down') {
      // (carte dont les images sont chargées à part — la grotte de Shellmon : gfx/textures.js, TARDIFS — on les attend)
      const dossier = DW.MAPS[mapId] && DW.MAPS[mapId].textures;
      if (dossier && DW.Textures && DW.Textures.dossier) { DW.chargement = { texte: 'Chargement...' }; try { await DW.Textures.dossier(dossier); } finally { DW.chargement = null; } }
      const M = DW.preparerCarte(mapId);
      if (!DW.World.pret(M)) {
        // gros morceaux (~50 ms) : entre deux, seulement l'écran de chargement (core.js), et aucune préparation de fond
        DW.chargement = { texte: 'Chargement...' }; this.enChargement = true;
        try { while (!DW.World.prepareSome(M, 50) && !DW.World.pret(M)) await new Promise(r => setTimeout(r, 0)); }
        finally { DW.chargement = null; this.enChargement = false; }
      }
      this.load(mapId, x, y, dir);
    }
    load(mapId, x, y, dir = 'down') {
      this.wilds = [];
      this.map = DW.preparerCarte(mapId); this.mapId = mapId;
      this.gfx = DW.World.prepare(this.map);
      // cartes voisines (sorties, portes, portails) : préparées pendant qu'on explore ; les autres sont libérées
      const near = new Set([mapId, ...(this.map.warps || []).map(w => w.to), ...(this.map.doors || []).map(d => d.to), ...(this.map.portails || []).map(o => o.to)]);
      this.near = [...near].filter(id => id !== mapId && DW.MAPS[id]);
      for (const id in DW.MAPS) if (!near.has(id) && DW.MAPS[id].gfx) DW.World.unprepare(DW.MAPS[id]);
      this.amb = new DW.World.Ambient(this.map); DW.Vivant.init(this);
      this.rustle = {};
      // jamais dans un obstacle : si la case d'arrivée est prise (arbre ou rocher posé au bord d'un passage, retouche
      // de carte...), le héros arrive sur la case libre la plus proche
      if (this.solid(x, y)) { const c = this.caseLibre(x, y); if (c) { x = c[0]; y = c[1]; } }
      const st = DW.state;
      st.map = mapId; st.x = x; st.y = y;
      this.p = { x, y, dir, moving: false, sx: x, sy: y, tx: x, ty: y, t: 0, step: 0, run: false, turnT: 0 };
      this.f = { x, y, sx: x, sy: y, tx: x, ty: y, t: 0, moving: false, face: dir === 'left' ? 'left' : 'right' };
      // le partenaire se place derrière le joueur (sinon sur une case libre à côté : il doit rester visible)
      const [bx, by] = DIRS[OPP[dir]];
      // (de préférence loin des autres personnages, dont le sprite pourrait le cacher)
      const nearNpc = (cx, cy) => (this.map.npcs || []).some(n => this.npcVisible(n) && Math.abs(n.x - cx) <= 1 && Math.abs(n.y - cy) <= 1);
      // face à l'écran, le héros cacherait un partenaire placé derrière lui : il se met alors sur le côté
      const order = dir === 'down' ? [[-1, 0], [1, 0], [bx, by], [0, 1]] : [[bx, by], [-1, 0], [1, 0], [0, 1], [0, -1]];
      const cand = order.filter(([ox, oy]) => !this.solid(x + ox, y + oy));
      for (const [ox, oy] of [...cand.filter(([ox, oy]) => !nearNpc(x + ox, y + oy)), ...cand]) {
        Object.assign(this.f, { x: x + ox, y: y + oy, sx: x + ox, sy: y + oy, tx: x + ox, ty: y + oy, face: ox < 0 ? 'right' : 'left' });
        break;
      }
      st.visited[mapId] = true;
      // une ville atteinte devient le point de réapparition
      const rs = this.map.respawn;
      if (rs) st.heal = Array.isArray(rs) ? { map: mapId, x: rs[0], y: rs[1] } : { ...rs };
      if (DW.Story.decorate) DW.Story.decorate(this);
      if (DW.Quetes) DW.Quetes.decorate(this);   // (les personnages des quêtes annexes : game/quetes.js)
      if (DW.Ground) DW.Ground.decorate(this);   // trouvailles au sol du jour (game/sol.js)
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
    npcVisible(n) {
      if (n.cond && !n.cond(DW.state)) return false;
      // Digimon errant caché (recrue) : invisible tant qu'on ne s'en approche pas (3 cases) ; une fois trouvé, il reste visible
      if (n.hide) {
        const F = DW.state.recruitFound = DW.state.recruitFound || {};
        if (F[n.sp]) return true;
        if (!this.p || Math.max(Math.abs(this.p.x - n.x), Math.abs(this.p.y - n.y)) > 3) return false;
        F[n.sp] = true; DW.Audio.sfx('swoosh');
      }
      return true;
    }
    // un PNJ « walk » (dalle, marque au sol) se traverse ; les autres bloquent le passage
    npcBlocks(x, y) { const n = this.npcAt(x, y); return !!n && !n.walk; }
    npcAt(x, y) { return (this.map.npcs || []).find(n => n.x === x && n.y === y && this.npcVisible(n)); }
    // case libre la plus proche (de proche en proche, d'abord les plus près en ligne droite) ; null si aucune à moins de R
    caseLibre(x, y, R = 6) {
      for (let r = 1; r <= R; r++) {
        const ring = [];
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
        ring.sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1]));
        for (const [dx, dy] of ring) if (!this.solid(x + dx, y + dy)) return [x + dx, y + dy];
      }
      return null;
    }
    solid(x, y) {
      if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) return true;
      const m = this.map, k = x + ',' + y;   // (collisions choisies dans l'éditeur de cartes : maps/retouches.js)
      if (m.forceBloque && m.forceBloque.has(k)) return true;
      if (m.forceLibre && m.forceLibre.has(k)) return this.npcBlocks(x, y) || DW.Care.poopAt(this.mapId, x, y) || !!DW.Wild.at(this, x, y);
      return DW.SOLID.has(this.tileAt(x, y)) || this.gfx.solid.has(x + ',' + y) || this.npcBlocks(x, y) || DW.Care.poopAt(this.mapId, x, y) || !!DW.Wild.at(this, x, y);
    }
    // relief retouché dans l'éditeur (maps/retouches.js) : on ne change de niveau que par un escalier
    falaise(ax, ay, bx, by) {
      const m = this.map; if (!m.altBord || !m.alt) return false;
      const a = m.alt[ay * m.w + ax], b = m.alt[by * m.w + bx], PASS = DW.Relief.PASS;
      return a !== undefined && b !== undefined && a !== PASS && b !== PASS && a !== b;
    }
    get partner() { return DW.state.party.find(m => m.hp > 0) || null; }

    // ---------------------------------------------------------- logique
    update(dt) {
      if (DW.Relief) DW.Relief.track(this);   // altitude logique du héros (maps/relief.js)
      if (DW.Lave) DW.Lave.update(this, dt);   // coulées de lave du Mont Miharashi (game/lave.js)
      const P = this.p;
      if (P.moving) {
        P.t += dt / P.dur;
        if (this.f.moving) this.f.t = Math.min(1, P.t);
        if (P.t < 1) return;
        const over = Math.min(P.t - 1, 0.5);
        this.finishStep();
        if (P.forced) { P.forced = false; const r = P.forcedR; P.forcedR = null; r && r(); return; }
        const ev = this.checkStep();
        if (ev) { this.runScript(ev); return; }
        const brule = DW.Lave && DW.Lave.pas(this);   // boule de lave, fissure fumante, coulée (game/lave.js)
        if (brule) { this.runScript(brule); return; }
        // enchaînement fluide si la direction reste tenue
        if (!this.locked) { const v = Input.vec(); if (v.x || v.y) this.walk(v, over); }
        return;
      }
      if (this.locked) return;
      if (this.onEnter) { const f = this.onEnter; this.onEnter = null; this.runScript(f); return; }
      const wc = DW.Wild.contact(this);
      if (wc) { this.runScript(wc); return; }
      if (Input.hit('menu') || (Input.hit('back') && Input.device !== 'key')) {   // (clavier : ENTRÉE ouvre le menu, SUPPR ne sert qu'à sortir)
        // (une action du menu qui se joue sur la carte — dormir, féliciter — revient en fonction : le héros reste immobile)
        Audio.sfx('select'); this.runScript(async () => { const suite = await Game.push(new DW.MenuScene()); if (suite) await suite(); }); return; }
      if (Input.hit('ok')) { this.interact(); return; }
      const v = Input.vec();
      if (!v.x && !v.y) { P.turnT = 0; return; }
      // nouvelle direction : le héros pivote d'abord sur place (on le voit se tourner), puis il marche
      const d = this.faceFor(v);
      // clavier : un appui bref fait pivoter sur place ; manette / tactile : on part tout de suite (plus fluide)
      const direct = Input.device !== 'key';
      if (!direct && (d !== P.dir || (P.face8 && !(v.x && v.y)))) { P.dir = d; P.face8 = null; P.turnT = 0.08; return; }
      if (!direct && P.turnT > 0) { P.turnT -= dt; return; }
      this.walk(v, 0);
    }
    // direction regardée pour un vecteur : en diagonale le héros se met de profil (sens de la marche),
    // sinon il glisserait de côté en restant de face ou de dos
    faceFor(v) {
      const h = v.x < 0 ? 'left' : v.x > 0 ? 'right' : null, w = v.y < 0 ? 'up' : v.y > 0 ? 'down' : null;
      return h || w;
    }
    // diagonale possible : case d'arrivée libre et pas de coin coupé (les deux cases voisines libres), pas de porte
    canDiag(dx, dy) {
      const P = this.p, nx = P.x + dx, ny = P.y + dy;
      if (nx < 0 || ny < 0 || nx >= this.map.w || ny >= this.map.h) return false;
      if (this.solid(nx, ny) || this.solid(P.x + dx, P.y) || this.solid(P.x, P.y + dy) || this.falaise(P.x, P.y, nx, ny) || this.falaise(P.x, P.y, P.x + dx, P.y) || this.falaise(P.x, P.y, P.x, P.y + dy)) return false;
      const door = (x, y) => (this.map.doors || []).some(o => y === o.y && x >= o.x && x < o.x + (o.w || 1));
      return !door(nx, ny) && !door(P.x + dx, P.y) && !door(P.x, P.y + dy);
    }
    // un pas dans la direction v (8 directions) ; contre un obstacle en diagonale, on glisse le long
    walk(v, over) {
      const P = this.p, run = Input.isDown('run') || Input.runLock || Input.analogRun();
      if (!(v.x && v.y)) return this.tryMove(this.faceFor(v), run, over);
      P.dir = this.faceFor(v);
      if (this.canDiag(v.x, v.y)) { P.face8 = (v.y > 0 ? 'down' : 'up') + (v.x > 0 ? 'right' : 'left'); this.startMove(P.x + v.x, P.y + v.y, run, over); return true; }   // vue de trois-quarts
      const h = v.x < 0 ? 'left' : 'right', w = v.y < 0 ? 'up' : 'down', order = P.dir === w ? [w, h] : [h, w];
      const face = P.dir;
      if (this.tryMove(order[0], run, over, true) || this.locked || this.tryMove(order[1], run, over)) return true;   // locked : une sortie ou une porte vient de se déclencher
      P.dir = face;
      return false;
    }
    tick(dt) {
      if (this.shake > 0) this.shake -= dt;
      if (this.banner.t < this.bannerT + 0.5) this.banner.t += dt;
      if (Game.top() === this) this.background();
      if (!this.locked && Game.top() === this) { DW.state.time += dt; DW.Time.advance(dt, this.map.climate); DW.Care.update(this, dt); DW.Companion.update(this, dt); }
      this.weather.update(dt);
      DW.Meteo.update(this, dt);   // orages, brouillard, canicule (gfx/meteo.js)
      const rain = !this.map.indoor && DW.Time.rainy();
      this.wet = DW.clamp((this.wet || 0) + (rain ? 0.25 : -0.02) * dt, 0, 1);
      if (DW.saveFlash > 0) DW.saveFlash -= dt;
      this.amb.update(dt);
      DW.Vivant.update(this, dt);
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
    // travail de fond (quelques ms par image) : fin de l'eau animée, puis les cartes voisines, LA PLUS PROCHE D'ABORD (selon la
    // position du héros : à l'ouest de la carte, on prépare la carte de l'ouest avant celle de l'est) ; en marchant,
    // seulement si l'on approche d'une sortie (moins de 12 cases), à petit budget (pas de saccade)
    background() {
      if (this.enChargement) return;
      const marche = this.p.moving || Input.dir(), c = this.voisinePrioritaire();
      // tout près d'une sortie (moins de 8 cases) : sa carte passe AVANT la fin de l'eau animée de la carte actuelle
      const urgent = c && c.d < 8;
      if (!urgent && !DW.World.prepareSome(this.map, marche ? 3 : 6)) return;
      if (!c || (marche && c.d > 12)) return;
      // (immobile : l'image n'utilise que 2 à 5 ms sur 16, on en donne 7 à 10 à la préparation ; en marchant, 2,5)
      DW.World.prepareSome(DW.preparerCarte(c.id), marche ? 2.5 : urgent ? 10 : 7);
    }
    // la carte voisine pas encore prête dont la sortie est la plus proche du héros (un peu « plus proche » si l'on marche
    // vers elle) ; null si toutes sont prêtes
    voisinePrioritaire() {
      const P = this.p, [dx, dy] = DIRS[P.dir] || [0, 0]; let best = null;
      const vers = (id, x, y, w, h) => {
        const M = DW.MAPS[id]; if (!M || id === this.mapId || (M.gfx && !M._prep)) return;
        const vx = DW.clamp(P.x, x, x + w - 1) - P.x, vy = DW.clamp(P.y, y, y + h - 1) - P.y;
        let d = Math.hypot(vx, vy); if (d > 0 && vx * dx + vy * dy > 0) d *= 0.7;
        if (!best || d < best.d) best = { id, d };
      };
      for (const w of this.map.warps || []) vers(w.to, w.x, w.y, w.w || 1, w.h || 1);
      for (const o of this.map.doors || []) vers(o.to, o.x, o.y, o.w || 1, 1);
      for (const o of this.map.portails || []) vers(o.to, o.x, o.y, o.w || 1, o.h || 1);
      return best;
    }
    tryMove(d, run, over, quiet) {
      const P = this.p;
      P.dir = d; P.face8 = null;
      const [dx, dy] = DIRS[d], nx = P.x + dx, ny = P.y + dy;
      if (nx < 0 || ny < 0 || nx >= this.map.w || ny >= this.map.h) {
        const w = (this.map.warps || []).find(w => w.dir === d && P.x >= w.x && P.x < w.x + (w.w || 1) && P.y >= w.y && P.y < w.y + (w.h || 1));
        const chLock = w && !w.ignoreChapitre && !DW.essaiLibre && DW.Chapter && DW.Chapter.lock(w.to);   // (essai « tout ouvert » depuis l'éditeur : main.js)   // (règle choisie dans l'éditeur : ignoreChapitre)   // zones fermées pendant le chapitre 1 (game/chapitre1.js)
        if (w && (chLock || (w.cond && !DW.essaiLibre && !w.cond(DW.state)))) {
          if (!this.bumpT || this.t - this.bumpT > 0.4) { Audio.sfx('bump'); this.bumpT = this.t; this.runScript(async () => { await DW.say(chLock || (typeof w.lock === 'function' ? w.lock() : w.lock)); }); }
          return false;
        }
        if (w) this.runScript(() => this.doWarp(w));
        return false;
      }
      const door = (this.map.doors || []).find(o => o.dir === d && nx >= o.x && nx < o.x + (o.w || 1) && ny === o.y && (!o.cond || o.cond(DW.state)));
      if (door) { this.runScript(() => this.enterDoor(door, nx)); return false; }
      // portail posé dans l'éditeur : on y entre de n'importe quel côté
      const portail = (this.map.portails || []).find(o => nx >= o.x && nx < o.x + (o.w || 1) && ny >= o.y && ny < o.y + (o.h || 1));
      if (portail && DW.MAPS[portail.to]) {
        if (portail.cond && !DW.essaiLibre && !portail.cond(DW.state)) { if (!quiet && (!this.bumpT || this.t - this.bumpT > 0.4)) { Audio.sfx('bump'); this.bumpT = this.t; this.runScript(async () => { await DW.say(portail.lock); }); } return false; }
        this.runScript(() => this.enterPortail(portail)); return false;
      }
      // le héros fonce sur un Digimon sauvage : combat volontaire
      const wild = this.partner && DW.Wild.at(this, nx, ny);
      if (wild && !quiet) { this.runScript(DW.Wild.bump(this, wild)); return false; }
      if (this.solid(nx, ny) || this.falaise(P.x, P.y, nx, ny)) {
        if (!quiet && DW.Lave && this.solid(nx, ny)) DW.Lave.touche(this, nx, ny);   // rocher magmatique, fumerolle : ça brûle (game/lave.js)
        if (!quiet && (!this.bumpT || this.t - this.bumpT > 0.4)) { Audio.sfx('bump'); this.bumpT = this.t; Input.rumble(0.15, 60); }
        return false;
      }
      this.startMove(nx, ny, run, over);
      return true;
    }
    startMove(nx, ny, run, over = 0) {
      const P = this.p, F = this.f;
      DW.Companion.wake(this);
      const diag = nx !== P.x && ny !== P.y;
      Object.assign(P, { moving: true, sx: P.x, sy: P.y, tx: nx, ty: ny, t: over, run, dur: (run ? RUN : WALK) * (diag ? Math.SQRT2 : 1) });
      P.step++;
      if (DW.World.isTall(this.tileAt(nx, ny))) this.rustle[nx + ',' + ny] = 0.5;
      if (!this.partner) Object.assign(F, { moving: false, x: P.x, y: P.y, sx: P.x, sy: P.y, tx: P.x, ty: P.y });   // sans partenaire : la place reste collée au héros
      else if (F.x !== P.sx || F.y !== P.sy) {
        // le partenaire suit pas à pas, sans jamais traverser le héros ni sauter deux cases d'un coup :
        // - demi-tour (le héros vient sur sa case) : il s'écarte sur le côté au lieu de passer au travers
        // - trop loin (après un pas de côté) : il avance d'une seule case vers le héros
        let tx = P.sx, ty = P.sy;
        if (F.x === nx && F.y === ny) {
          const dx = nx - P.sx, dy = ny - P.sy, side = [[dy, dx], [-dy, -dx], [-dx, -dy]].map(([a, b]) => [P.sx + a, P.sy + b]);
          const free = side.find(([x, y]) => (x !== nx || y !== ny) && !this.solid(x, y));
          if (free) [tx, ty] = free; else { tx = F.x; ty = F.y; }
        } else if (Math.max(Math.abs(F.x - P.sx), Math.abs(F.y - P.sy)) > 1) {
          tx = F.x + Math.sign(P.sx - F.x); ty = F.y + Math.sign(P.sy - F.y);
          if (tx === nx && ty === ny) { tx = F.x; ty = F.y; }
        }
        Object.assign(F, { moving: tx !== F.x || ty !== F.y, sx: F.x, sy: F.y, tx, ty, t: over });
        // regard : dans le sens de sa marche ; s'il monte, descend ou attend, il se tourne vers le héros
        if (tx > F.sx) F.face = 'right'; else if (tx < F.sx) F.face = 'left';
        else if (nx > F.sx) F.face = 'right'; else if (nx < F.sx) F.face = 'left';
        // il monte avec le héros : on le voit de DOS, comme le héros ; il redescend ou va de côté : de face / de profil
        if (ty < F.sy) F.back = true; else if (ty > F.sy || tx !== F.sx) F.back = false;
        F.front = ty > F.sy && tx === F.sx;   // il descend droit vers nous : de face (s'il a un dessin de face)
        if (DW.World.isTall(this.tileAt(P.x, P.y))) this.rustle[P.x + ',' + P.y] = 0.5;
      }
    }
    finishStep() {
      const P = this.p, F = this.f;
      Object.assign(P, { moving: false, x: P.tx, y: P.ty, sx: P.tx, sy: P.ty, t: 0 });
      // les PM reviennent doucement en marchant (pas besoin de dormir pour retrouver ses techniques)
      for (const m of DW.state.party) if (m.hp > 0 && m.mp < m.maxMp && this.p.step % 4 === 0) m.mp = Math.min(m.maxMp, m.mp + Math.ceil(m.maxMp * 0.01));
      // Chaussures santé (dans le sac) : marcher rend un peu de PV et de PM
      if (DW.state.bag.chaussures) for (const m of DW.state.party) if (m.hp > 0) { m.hp = Math.min(m.maxHp, m.hp + Math.ceil(m.maxHp * 0.004)); m.mp = Math.min(m.maxMp, m.mp + Math.ceil(m.maxMp * 0.004)); }
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
      await DW.fade(1, 0.38, null, 'digi');
      const nx = w.tx + (P.x - w.x), ny = w.ty + (P.y - w.y);
      await this.charger(w.to, nx, ny, P.dir);
      DW.autosave();
      await DW.fade(0, 0.38, null, 'digi');
    }
    async enterPortail(o) {
      await DW.fade(1, 0.3, null, 'digi');
      await this.charger(o.to, o.tx, o.ty, this.p.dir);
      DW.autosave();
      await DW.fade(0, 0.3, null, 'digi');
    }
    async enterDoor(o, nx) {
      Audio.sfx('door');
      await DW.fade(1, 0.25);
      // (intérieur qui grandit avec la ville : l'arrivée suit sa taille — maps/grandir.js)
      const M = DW.MAPS[o.to], a = M && M.arrive ? M.arrive() : null;
      await this.charger(o.to, (a ? a[0] : o.tx) + (nx - o.x), a ? a[1] : o.ty, o.dir);
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
        if (n.hero) n.face = OPP[P.dir];   // un enfant se tourne vers toi
        this.runScript(async ow => { await n.talk(ow, n); if (DW.Cuisine) await DW.Cuisine.afterTalk(n); });
        return true;
      }
      const sign = this.map.signs && this.map.signs[`${x},${y}`];
      // (au comptoir : le commerçant juste derrière donne aussi son ingrédient du jour, comme si on lui parlait — game/cuisine.js)
      const derriere = typeof sign === 'function' && this.npcAt(x + dx, y + dy);
      if (sign) { this.runScript(typeof sign === 'function' ? async ow => { await sign(ow); if (derriere && DW.Cuisine) await DW.Cuisine.afterTalk(derriere); } : async () => { await DW.say(sign); if (DW.Paysage) await DW.Paysage.afterSign(); }); return true; }
      if (DW.Care.poopAt(this.mapId, x, y)) { this.runScript(() => DW.Care.clean(this.mapId, x, y)); return true; }
      const info = DW.World.info(this.tileAt(x, y));
      const ts = this.trainSpot();
      if (ts) { this.runScript(() => DW.Training.atSpot(ts.k, ts)); return true; }
      // (toilettes posées comme objet, dans l'atelier des cartes : utilisables aussi)
      const wc = (this.map.objects || []).some(o => o.kind === 'toilet' && x >= o.x && x < o.x + (o.w || 1) && y >= o.y && y < o.y + (o.h || 1));
      if (info.toilet || wc) { this.runScript(() => DW.Care.toilet()); return true; }
      const act = this.map.tileActs && this.map.tileActs[this.tileAt(x, y)];
      if (act) { this.runScript(ow => act(ow, x, y)); return true; }
      const F = this.f, pt = this.partner;
      if (pt && F.x === x && F.y === y) { this.runScript(() => this.talkPartner(pt)); return true; }
      if (pt && DW.Life.pending && Math.max(Math.abs(F.x - P.x), Math.abs(F.y - P.y)) <= 1) { this.runScript(() => this.talkPartner(pt)); return true; }
      // décor : secouer un arbre, fouiller un rocher, s'asseoir, boire... (game/paysage.js)
      const scen = DW.Paysage && DW.Paysage.act(this, x, y);
      if (scen) { this.runScript(scen); return true; }
      return false;
    }
    // poste d'entraînement devant le héros : on peut viser le poste lui-même (pierre, mannequin...), un appareil-poste (sac
    // de frappe, traîneau... : DW.Training.POSTES) ou le panneau devant eux
    trainSpot() {
      const P = this.p;
      if (P.moving) return null;
      const [dx, dy] = DIRS[P.dir], x = P.x + dx, y = P.y + dy, objs = this.map.objects || [], POSTES = DW.Training.POSTES;
      const sur = (o, ax, ay) => ax >= o.x && ax < o.x + (o.w || 1) && ay >= o.y && ay < o.y + (o.h || 1);
      const poste = o => ({ x: o.x + ((o.w || 1) >> 1), y: o.y + (o.h || 1) - 1, k: POSTES[o.kind].k, eq: o.kind });
      // la case visée, ses deux voisines, puis la case juste derrière (les gros postes, comme la pierre, débordent sur 2 cases)
      for (const [ax, ay] of [[x, y], [x + dy, y + dx], [x - dy, y - dx], [x + dx, y + dy], [x + dx + dy, y + dy + dx], [x + dx - dy, y + dy - dx]]) {
        const I = DW.World.info(this.tileAt(ax, ay));
        if (I.train) return { x: ax, y: ay, k: I.train };
        const a = objs.find(o => POSTES[o.kind] && sur(o, ax, ay));
        if (a) return poste(a);
        // le panneau à pictogramme devant chaque poste lance aussi la séance (celui d'un appareil : son appareil le plus proche)
        const s = objs.find(o => o.kind === 'stationsign' && sur(o, ax, ay));
        if (s && s.eq) {
          const L = objs.filter(o => o.kind === s.eq && POSTES[o.kind]).sort((u, v) => Math.hypot(u.x - s.x, u.y - s.y) - Math.hypot(v.x - s.x, v.y - s.y));
          if (L.length) return poste(L[0]);
        } else if (s && SIGN_STAT[s.v || 0]) return { x: ax, y: ay, k: SIGN_STAT[s.v || 0] };
      }
      return null;
    }
    async talkPartner(m) {
      if (DW.Abri.can(this)) return DW.Abri.menu(this, m);   // à l'abri pendant l'orage : activités (game/abri.js)
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
    // fond du combat : celui de la carte ; au bord de l'eau (lac, île, rivière), la rive plutôt que la forêt (gfx/battlebg.js)
    battleKey() { const m = this.map; return m.bg === 'foret' && m.theme ? (this.eauProche() ? 'lac@' : 'foret@') + m.theme : m.bg; }
    eauProche() {
      const TH = DW.World.themeOf(this.map); if (TH && TH.water === DW.World.LAVA) return false;   // (volcan : c'est de la lave)
      if (this.map.region === 'lac') return true;   // (le Grand Lac : 21 à 95 % d'eau sur chaque carte)
      const P = this.p; let n = 0;
      for (let dy = -5; dy <= 5; dy++) for (let dx = -6; dx <= 6; dx++) { const I = DW.World.info(this.tileAt(P.x + dx, P.y + dy)); if (I && I.t === 'water' && I.eau !== 5) n++; }
      return n >= 12;
    }
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
      const res = await Game.push(new DW.BattleScene(   // (combat en arène retiré : toujours au tour par tour)
        { bg: this.battleKey(), ...o }));
      this.stepCd = 4;
      // Digivolution possible : on propose la table des Digivolutions
      for (const m of st.party) {
        if (!m.evoPending || m.hp <= 0) continue;
        m.evoPending = false;
        if (!DW.Evo.available(m).length) continue;
        Audio.play('evolve');
        const r = await DW.ask(`Le Digivice vibre ! ${m.name} peut digivoluer. Ouvrir la table des Digivolutions ?`);
        if (r === 0) await Game.push(new DW.EvoTableScene(st.party.indexOf(m)));
      }
      Audio.play(this.map.music);
      const lead = DW.state.party[0];
      if (lead && res === 'win') DW.Life.moment('good', 'une belle victoire');
      // conseil aux débutants : PV bas après le combat
      // (PV bas, blessure : seulement les bulles au-dessus du partenaire, plus de message)
      if (lead && lead.hp > 0 && lead.hp < lead.maxHp / 4 && !lead.hurt && Math.random() < 0.35) {
        lead.hurt = DW.state.clock;
      }
      // K.O. : au 3e, le Digimon meurt vraiment (game/life.js)
      if (res === 'lose' && !o.canLose) { for (const m of st.party.slice()) if (m.hp <= 0) await DW.Life.knockout(m); await this.blackout(); }
      else DW.autosave();
      return res;
    }
    // défaite contre un boss (combat « canLose ») : pas de K.O. compté ni de Bits perdus, mais on se réveille chez Jijimon,
    // soigné (sinon on restait coincé : dans le Grand Arbre, les racines ne se rouvrent qu'après la victoire)
    async bossDefeat(line) {
      const st = DW.state;
      await DW.fade(1, 0.6);
      for (const m of st.party) m.heal();
      await this.charger('maison', 12, 5, 'down');
      DW.Audio.play('village');
      await DW.wait(0.3);
      await DW.fade(0, 0.6);
      if (line) await DW.say(line, 'Jijimon');
      DW.autosave();
    }
    async blackout() {
      const st = DW.state;
      await DW.say('Tu perds connaissance...');
      await DW.fade(1, 0.6);
      const lost = Math.floor(st.bits / 10); st.bits -= lost;
      st.party.forEach(m => m.heal());
      // toujours chez Jijimon (combat ordinaire ou boss) : il te ramène et soigne ton équipe
      await this.charger('maison', 12, 5, 'down');
      await DW.wait(0.5);
      await DW.fade(0, 0.6);
      await DW.say("Hohoho... Te voilà réveillé ! On t'a retrouvé évanoui, ton Digimon à tes côtés. Je vous ai ramenés ici et soignés.", 'Jijimon');
      await DW.say(`Tes Digimon ont récupéré... mais ${lost ? `tu as perdu ${lost} Bits (10 %).` : "tu n'avais pas de Bits à perdre."}`);
      if (DW.Life.koWarn) {
        const m = DW.Life.koWarn; DW.Life.koWarn = null;
        await DW.say(`Hohoho... ${m.name} est à bout de forces. Encore un K.O., et il ne s'en remettra pas !`, 'Jijimon');
        await DW.say("Dors une nuit ici, chez moi : un bon sommeil efface un K.O. Et évite les combats trop durs en attendant !", 'Jijimon');
      }
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
      c.drawImage(DW.Meteo.ground(this), 0, 0);   // (herbe jaunie pendant la canicule / sécheresse)
      if (g.water && g.water.frames.length) { const w = g.water, fr = w.frames[Math.floor(this.t * g.fps) % w.frames.length]; c.drawImage(fr, w.x, w.y); }
      if (g.bridges) c.drawImage(g.bridges.cv, g.bridges.x, g.bridges.y);   // ponts de pierre, posés sur l'eau (gfx/ponts.js)
      const vx0 = cx - 48, vx1 = cx + W + 48, vy0 = cy - 16, vy1 = cy + H + 64;
      if (this.wet > 0.02 && g.puddles) this.drawPuddles(c, g.puddles, vx0, vx1, vy0, vy1);
      DW.Vivant.drawGround(this, c, vx0, vx1, vy0, vy1);
      if (DW.Lave) DW.Lave.draw(this, c);   // coulées de lave (sous les personnages)
      // herbes hautes (couche arrière)
      const tallFrame = (tx, ty) => this.rustle[tx + ',' + ty] ? Math.floor(this.t * 14) % 3 : [0, 1, 2, 1][Math.floor(this.t * 1.6 + tx * 0.4 + ty * 0.25) % 4];
      for (const tg of g.tall) {
        const X = tg.tx * TS, Y = tg.ty * TS;
        if (X < vx0 || X > vx1 || Y < vy0 || Y > vy1) continue;
        c.drawImage(DW.Meteo.tall(DW.World.tall(tg.kind, tg.v, tallFrame(tg.tx, tg.ty))), X, Y - 8);
      }
      // objets & personnages triés en profondeur
      // direction et intensité des ombres selon l'heure
      const hr = DW.Time.solar(), L = DW.Time.light();
      this.sun = { dx: DW.clamp((hr - 12.5) / 6, -1.2, 1.2), a: this.map.indoor ? 0 : 0.24 * (1 - Math.min(1, L.dark * 1.6)) * (DW.Time.weather() === 'clear' ? 1 : 0.45) };
      // liste réutilisée d'une image à l'autre ; les objets du décor y entrent tels quels (clé de tri o.s)
      const list = this._list || (this._list = []);
      list.length = 0;
      // ombres portées qui suivent la course du soleil (longues le matin et le soir) : un seul remplissage, au sol, sous tout le reste
      const sun = this.sun, shade = sun.a > 0.01;
      if (shade) { c.fillStyle = sun.dx < -0.4 ? `rgba(36,26,60,${sun.a})` : sun.dx > 0.4 ? `rgba(46,20,40,${sun.a})` : `rgba(10,26,42,${sun.a})`; c.beginPath(); }
      for (const o of g.objs) {
        if (o.x < vx0 - 30 || o.x > vx1 + 30 || o.y < vy0 || o.y > vy1 + 40) continue;
        if (o.s === undefined) o.s = o.sort;
        list.push(o);
        if (shade && !o.flat && o.spr.h < 34) {   // petits objets : ombre ronde (les grands ont leur ombre projetée)
          const rw = Math.min(16, o.spr.w / 3) * (1 + Math.abs(sun.dx) * 0.4), sx = o.x + sun.dx * 5;
          c.moveTo(sx + rw, o.y); c.ellipse(sx, o.y, rw, 3, 0, 0, 7);
        }
      }
      if (shade) c.fill();
      if (shade) DW.Rendu.cast(this, c, list, sun);   // ombres projetées des bâtiments et des arbres (forme réelle, gfx/rendu.js)
      DW.Rendu.contact(this, c, vx0, vx1, vy0, vy1);   // ombres de contact (gfx/rendu.js)
      for (const [x, y] of DW.state.poops[this.mapId] || []) list.push({ s: y - 0.02, ent: 'poop', x, y, tile: [x, y] });
      for (const n of this.map.npcs || []) {
        if (!this.npcVisible(n)) continue;
        const hy = n.hy != null ? n.hy : n.y;
        list.push({ s: n.walk ? hy - 0.6 : hy, ent: 'npc', n, tile: [n.x, n.y] });   // une dalle se dessine sous les pieds
      }
      DW.Wild.entries(this, list);
      const P = this.p, F = this.f, pt = this.partner;
      const pp = this.pos(P);
      if (pt && !this.hidePartner && !(F.x === P.x && F.y === P.y && !F.moving)) {   // (hidePartner : il s'entraîne au poste, game/trainfield.js)
        const fp = this.pos(F);
        list.push({ s: fp.y - 0.01, ent: 'follower', fp, tile: this.standTile(F) });
      }
      list.push({ s: pp.y, ent: 'player', tile: this.standTile(P) });
      list.sort((a, b) => a.s - b.s);
      let playerIdx = -1, playerRect = null;
      list.forEach((e, i) => {
        if (e.spr) {
          const o = e, s = o.spr;
          let img = DW.Meteo.objImg(o, o.sprs ? o.sprs[Math.floor(this.t * o.fps + o.x * 0.013) % o.sprs.length].img : s.img);   // (saisons : arbres, neige posée)
          if (o.flip) img = DW.Rendu.mirror(img);
          const X = Math.round(o.x - s.w / 2), Y = Math.round(o.y - s.h + 1);
          // le feuillage (haut du sprite) ondule doucement au vent ; sans décalage, un seul dessin suffit
          // (l'arbre entier s'incline doucement, le pied reste fixe : plus de coupure horizontale dans le feuillage)
          const sway = o.big && !o.flat && SWAY[o.kind] ? Math.sin(this.t * 1.3 + o.x * 0.07) * 0.8 + Math.sin(this.t * 0.37 + o.y * 0.05) * 0.5 : 0;
          if (Math.abs(sway) > 0.05) {
            c.save(); c.translate(o.x, o.y + 1); c.transform(1, 0, -sway / s.h, 1, 0, 0);
            c.drawImage(img, Math.round(-s.w / 2), Math.round(-s.h));
            c.restore();
          } else c.drawImage(img, X, Y);
          return;
        }
        if (e.ent === 'poop') DW.Care.drawPoop(c, e.x * TS + 8, e.y * TS + 12);
        else if (e.ent === 'npc') {
          const n = e.n, X = n.hx != null ? n.hx : n.x, Y = n.hy != null ? n.hy : n.y;
          if (n.shadow) {   // ombre qui nage sous l'eau (Gomamon, façon Coelamon)
            const bx = X * TS + 8 + Math.sin(this.t * 1.4) * 5, by = Y * TS + 9 + Math.cos(this.t * 1.1) * 2;
            c.fillStyle = 'rgba(10,30,60,0.55)'; c.beginPath(); c.ellipse(bx, by, 10, 4.5, Math.sin(this.t) * 0.3, 0, 7); c.fill();
            c.beginPath(); c.moveTo(bx - 9, by); c.lineTo(bx - 15, by - 3); c.lineTo(bx - 15, by + 3); c.fill();
            c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1; const r = (this.t * 8) % 12; c.beginPath(); c.ellipse(bx, by, 6 + r, 2 + r * 0.4, 0, 0, 7); c.stroke();
          } else if (n.item) {   // trouvaille au sol : l'objet posé, qui brille un peu
            const bx = Math.round(X * TS + 8), by = Math.round(Y * TS + 13), b = Math.sin(this.t * 3 + n.x) * 1.2;
            c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(bx, by + 2, 6, 2, 0, 0, 7); c.fill();
            c.drawImage(DW.Icons.item(n.item), bx - 7, by - 12 + b, 14, 14);
            if (Math.sin(this.t * 4 + n.y) > 0.8) { c.fillStyle = '#ffffff'; c.fillRect(bx + 4, by - 12 + b, 2, 2); }
          } else if (n.hero) DW.Sprites.draw(c, DW.Sprites.hero(n.face || 'down', n.mv ? Math.floor(this.t * 8) : 0, n.hero), X * TS + 8, Y * TS + 16);   // enfant DigiSélectionné
          else if (n.obj) {   // « PNJ objet » : barrière, vasque... (aspect selon l'état : n.ov(state))
            const v = typeof n.ov === 'function' ? n.ov(DW.state) : n.ov || 0, O = DW.World.OBJ[n.obj];
            const fr = O.frames ? DW.World.objFrames(n.obj, v) : null, s2 = fr ? fr[Math.floor(this.t * (O.fps || 4)) % fr.length] : DW.World.obj(n.obj, v);
            c.drawImage(s2.img || s2, Math.round(X * TS + 8 - s2.w / 2), Math.round(Y * TS + 16 - s2.h));
          } else this.drawMon(c, n.sp, X * TS + 8, Y * TS + 15, n.face === 'left', n.mv ? this.t * 12 : this.t * 1.6 + n.x * 0.37, !!n.mv, n.face === 'up' && DW.Sprites.hasBack(n.sp), n.face === 'down');   // (de face / de dos s'il a ces dessins)
          if (n.gear) DW.Story.drawGear(c, X * TS + 8, Y * TS + 15, this.t, n.sp);
          // « ! » au-dessus des habitants qui ont une demande (game/requests.js)
          if (n.story && DW.Requests && DW.Requests.has(n.sp)) { const h = DW.Sprites.ow(n.sp).h, bx = Math.round(X * TS + 8), by = Math.round(Y * TS + 15 - h - 8 + Math.sin(this.t * 4) * 1.5); c.fillStyle = '#1a0e22'; c.fillRect(bx - 4, by - 1, 8, 11); c.fillStyle = '#ffe060'; c.fillRect(bx - 3, by, 6, 9); c.fillStyle = '#1a0e22'; c.fillRect(bx - 1, by + 1, 2, 4); c.fillRect(bx - 1, by + 6, 2, 2); }
        }
        else if (e.ent === 'wild') DW.Wild.draw(this, c, e.w);
        else if (e.ent === 'follower') DW.Companion.draw(this, c, pt, e.fp.x * TS + 8, e.fp.y * TS + 15);
        else { playerIdx = i; playerRect = this.drawPlayer(c, pp); }
        const [tx, ty] = e.tile;
        const ch = this.tileAt(tx, ty);
        if (DW.World.isTall(ch)) {
          const spr = DW.Meteo.tall(DW.World.tall(DW.World.tallKind(this.map, DW.World.info(ch).tall), Math.floor(DW.Art.hash(tx, ty, 70) * 4), tallFrame(tx, ty)));
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
      DW.Vivant.drawAir(this, c);
      if (DW.RegionFx) DW.RegionFx.draw(this, c);   // ambiances propres à chaque région (gfx/regionfx.js)
      // étiquette au-dessus du poste d'entraînement qu'on peut utiliser
      const ts = !this.locked && Game.top() === this && this.trainSpot();
      if (ts) {
        const poste = ts.eq && DW.Training.POSTES[ts.eq];   // (un appareil : son nom, « Traîneau », plutôt que celui de la stat)
        const label = 'ESPACE : ' + (poste ? poste.nom : DW.Training.STATS[ts.k].name), w = UI.measure(c, label, 7) + 10;
        const X = Math.round(ts.x * TS + 8 - w / 2), Y = Math.round(ts.y * TS - 18 + Math.sin(this.t * 4) * 1.5);
        c.fillStyle = 'rgba(8,20,40,0.85)'; c.fillRect(X, Y, w, 12);
        c.fillStyle = '#ffe070'; c.fillRect(X, Y + 11, w, 1);
        UI.text(c, label, X + w / 2, Y + 9, { size: 7, align: 'center', color: '#ffffff' });
      }
      if (DW.Relief && DW.Relief.debug) DW.Relief.drawDebug(this, c, vx0, vx1, vy0, vy1);   // vue de développement (?debug=geo puis G)
      if (DW.Lave) DW.Lave.drawTop(this, c);   // PV perdus dans la lave
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
      // créatures qui VOLENT au-dessus de la carte pendant une scène (ex. Kuwagamon au début du jeu : game/debut.js)
      for (const f of this.flyers || []) {
        const spr = DW.Sprites.battle(f.sp);
        if (f.shadow) { c.fillStyle = `rgba(0,0,0,${f.shadow})`; c.beginPath(); c.ellipse(f.x, f.y + 70, 30 * f.s, 8 * f.s, 0, 0, 7); c.fill(); }
        DW.Sprites.draw(c, spr, f.x, f.y, { scale: f.s, flip: f.flip, silhouette: f.sil, frame: Math.floor(this.t * 10) });
      }
      c.restore();
      this.amb.drawScreen(c, cam);
      DW.Rendu.scene(this, c, cam);   // rais de lumière
      if (!this.map.indoor) this.weather.draw(c);
      // lumières en coordonnées écran ; celles qui ne touchent pas l'écran sont ignorées (même rendu, moins de calcul)
      const lights = [];
      for (const L of this.amb.lights()) {
        const x = L.x - cx, y = L.y - cy, r = L.r || 0;
        if (x + r < 0 || y + r < 0 || x - r > W || y - r > H) continue;
        lights.push({ ...L, x, y });
      }
      lights.push({ x: Math.round(pp.x * TS) + 8 - cx, y: Math.round(pp.y * TS) + 4 - cy, r: 52 });
      DW.Time.drawLight(c, lights, this.map.indoor ? 0.75 : 1, this.map.dark);
      DW.Meteo.draw(this, c);   // éclairs, flashs, brouillard épais, soleil de plomb
      DW.Rendu.grade(this, c);  // étalonnage des couleurs, halo du ciel, vignette
      if (!this.cine && (!this.locked || Game.top() === this)) { DW.Time.drawClock(c, W - 92, 6); DW.Care.drawHUD(c, DW.Care.lead(), W - 152, 6); DW.Care.drawMood(c, DW.Care.lead(), W - 88, H - 28); }
      DW.Care.drawToasts(c);
      if (DW.saveFlash > 0) {
        c.globalAlpha = Math.min(1, DW.saveFlash);
        c.drawImage(DW.Icons.menu('sauver'), W - 22, H - 22);
        UI.text(c, 'Sauvegardé', W - 26, H - 10, { size: 7, align: 'right' });
        c.globalAlpha = 1;
      }
      if (this.flashA) { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); }
      // bandeau du nom de la zone
      // (à l'arrivée : grand bandeau qui glisse ; ensuite le nom reste affiché en petit, en haut à gauche)
      const bt = this.banner.t;
      if (bt < this.bannerT) {
        const k = bt < 0.3 ? bt / 0.3 : 1;
        const w = UI.measure(c, this.map.name, 10) + 24;
        UI.box(c, -6 + (k - 1) * (w + 10), 8, w, 20);
        UI.text(c, this.map.name, 6 + (k - 1) * (w + 10), 22, { size: 10 });
      } else if (!this.cine) {
        const nf = UI.fit(c, this.map.name, 150, 8), w = Math.min(150, UI.measure(c, nf.s, nf.size)) + 12;
        c.globalAlpha = Math.min(1, (bt - this.bannerT) / 0.3);
        c.fillStyle = 'rgba(8,16,32,0.6)'; c.fillRect(2, 5, w, 14);
        c.fillStyle = '#5adcc8'; c.fillRect(2, 5, 2, 14);
        UI.text(c, nf.s, 8, 15, { size: nf.size, color: '#ffffff' });
        c.globalAlpha = 1;
      }
    }
    // flaques après la pluie : reflet du ciel (bleu le jour, orangé au crépuscule, sombre la nuit),
    // reflets des lanternes la nuit, ronds de pluie
    drawPuddles(c, list, x0, x1, y0, y1) {
      const hr = DW.Time.solar(), L = DW.Time.light(), dusk = (hr > 17 && hr < 20.5) || (hr > 5 && hr < 7.5);
      const sky = L.dark > 0.55 ? [40, 56, 110] : dusk ? [236, 150, 110] : [150, 196, 236];
      const a = this.wet, rain = DW.Time.rainy(), lamps = L.dark > 0.3 ? this.amb.lights() : [];
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
      const spr = DW.Sprites.hero(P.face8 || P.dir, frame);   // diagonale : vue de trois-quarts
      const bob = P.moving && frame % 2 === 1 ? -1 : 0;
      const X = Math.round(pp.x * TS + 8 - spr.w / 2), Y = Math.round(pp.y * TS + 17 - spr.h) + bob;
      if (!ghost) {
        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.beginPath(); c.ellipse(Math.round(pp.x * TS) + 8, Math.round(pp.y * TS) + 15, 7.5, 2.8, 0, 0, 7); c.fill();
      }
      c.drawImage(spr.img, X, Y);
      return { x: X + 3, y: Y + 2, w: spr.w - 6, h: spr.h - 2 };
    }
    drawMon(c, sp, x, y, flip, t, moving, back, front) {
      const spr = DW.Sprites.ow(sp, back ? 'back' : front ? 'front' : null);
      if (front && !back && DW.Sprites.hasView(sp, 'front')) flip = false;
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.beginPath(); c.ellipse(x, y, spr.w / 2.8, 2.5, 0, 0, 7); c.fill();
      const by = y + 2 - (moving ? Math.abs(Math.round(Math.sin(t) * 1.5)) : 0);
      // de dos sans dessin dédié : silhouette resserrée (vue de derrière plutôt que de profil)
      if (back && !DW.Sprites.hasBack(sp)) { c.save(); c.translate(x, 0); c.scale(0.72, 1); DW.Sprites.draw(c, spr, 0, by, { flip, frame: moving ? 0 : Math.floor(t) }); c.restore(); return; }
      DW.Sprites.draw(c, spr, x, by, { flip: back ? false : flip, frame: moving ? 0 : Math.floor(t) });
    }
  }
  const objRect = o => ({ x: o.x - o.spr.w / 2, y: o.y - o.spr.h, w: o.spr.w, h: o.spr.h * 0.8 });
  const overlap = (a, b) => a.x + 3 < b.x + b.w && a.x + a.w - 3 > b.x && a.y + 4 < b.y + b.h && a.y + a.h > b.y;
  DW.Overworld = Overworld;

  DW.learnEvoMoves = async m => {
    for (const [l, id] of m.d.learn) if ((l === 0 || l === m.level) && !m.knows(id)) await DW.learnMove(m, id);
    // la nouvelle forme sait d'instinct la technique de base de son élément (Agumon : Flamme de bébé...) ;
    // les autres s'apprennent toujours par l'Intelligence et le hasard (DW.tryLearn, salle de classe)
    const nat = m.d.learn.find(([l, id]) => l <= 1 && DW.MOVES[id] && m.d.types.includes(DW.MOVES[id].type));
    if (nat && !m.knows(nat[1])) await DW.learnMove(m, nat[1]);
  };
})();
