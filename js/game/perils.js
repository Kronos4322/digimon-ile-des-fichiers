'use strict';
// =====================================================================
//  PÉRILS DES SOUTERRAINS DU MONT MIHARASHI (maps/sous_volcan.js) : ce qui tombe, ce qui vole, ce qui crache le feu
//  Chaque danger PRÉVIENT avant de frapper (ombre au sol, cri, lueur, tombeau qui rougeoie) : en regardant bien, on l'évite.
//  - ÉBOULIS (map.eboulis = { zones: [[x0, y0, x1, y1]...], tous: [min, max] s, pierre, gravats }) : de la poussière
//    tombe du plafond, une ombre grandit au sol, puis un rocher s'écrase ; touché, le partenaire perd des PV et le héros
//    reste étourdi ; les gravats bloquent la case quelques secondes, puis s'effritent ;
//  - CHAUVES-SOURIS (map.chauvesSouris = { nids: [[x, y]...], tous: [min, max] s }) : une nuée jaillit d'un nid en
//    criant et file droit sur le héros, au-dessus des murs et de la lave ; touchée, elle griffe et repousse le héros ;
//  - PLUIE DE BRAISES (map.braises = { zones, tous }) : une lueur au sol, puis une braise tombe du plafond : ça brûle ;
//  - JETS DE FLAMMES (map.flammes = [{ x, y, dx, dy, n, tous: [min, max] }]) : un tombeau rougeoie, puis crache une
//    langue de feu sur n cases devant lui ;
//  - LUEURS : la lave éclaire les cartes sombres ; la vapeur monte des eaux qui bouillent (map.vapeur).
//  Une carte s'y inscrit avec map.perils = true.
//  Comme la lave (game/lave.js), un coup laisse au moins 1 PV ; mais un partenaire DÉJÀ à bout de forces s'évanouit :
//  le héros le porte jusqu'au début du cercle (l'arrivée de la carte, map.entry).
// =====================================================================
(function () {
  const TS = 16, R = Math.random, H2 = (a, b, c) => DW.Art.hash(a, b, c);
  const entre = ([a, b]) => a + R() * (b - a);
  const PEINE = { rocher: 0.16, nuee: 0.1, braise: 0.08, flamme: 0.12 };
  const MOTS = {
    rocher: n => `CRAC ! Un rocher se détache du plafond et s'écrase sur ${n} !`,
    nuee: n => `Une nuée de chauves-souris fond sur vous en hurlant ! ${n} est griffé de partout !`,
    braise: n => `Une braise tombe du plafond sur ${n} !`,
    flamme: n => `Le tombeau crache une langue de feu ! ${n} est brûlé !`,
  };
  const CONSEIL = {
    rocher: 'Regarde le sol : une ombre qui grandit annonce une chute de pierres.',
    nuee: 'Quand tu les entends crier, écarte-toi de leur chemin !',
    braise: 'Une lueur orange au sol : une braise va tomber juste là.',
    flamme: 'Les tombeaux rougeoient juste avant de cracher : passe entre deux jets.',
  };
  const DUREE = { rocher: 1.15, braise: 0.85 };   // (secondes d'avertissement avant la chute)
  const etat = new WeakMap();
  const actif = map => !!(map && map.perils);   // (seulement les cartes qui le demandent : maps/sous_volcan.js)

  // état d'une carte : chutes en cours, gravats, nuées, jets, particules, dangers déjà expliqués
  function E(map) {
    let s = etat.get(map); if (s) return s;
    s = { chutes: [], gravats: new Map(), nuees: [], parts: [], vapeurs: [], vus: new Set(), grace: 0,
      tChute: map.eboulis ? entre(map.eboulis.tous) : 0, tBraise: map.braises ? entre(map.braises.tous) : 0,
      tNuee: map.chauvesSouris ? 4 + entre(map.chauvesSouris.tous) : 0,
      jets: (map.flammes || []).map(f => ({ ...f, phase: 'calme', t: 1 + R() * entre(f.tous || [3, 6]) })), lueurs: null };
    etat.set(map, s); return s;
  }
  const dansZones = (zs, x, y, m = 0) => (zs || []).some(([x0, y0, x1, y1]) => x >= x0 - m && x <= x1 + m && y >= y0 - m && y <= y1 + m);
  // case de sol libre où quelque chose peut tomber (pas un mur, un décor, des gravats, ni un passage)
  function solLibre(ow, x, y) {
    const m = ow.map, c = m.rows[y] && m.rows[y][x];
    if (c === undefined || DW.SOLID.has(c) || ow.gfx.solid.has(x + ',' + y)) return false;
    if ((m.triggers || []).some(t => x >= t.x - 1 && x < t.x + (t.w || 1) + 1 && y >= t.y - 1 && y < t.y + (t.h || 1) + 1)) return false;
    const A = m.entry; if (A && Math.abs(A.x - x) <= 2 && Math.abs(A.y - y) <= 2) return false;
    const S = E(m); return !S.gravats.has(x + ',' + y) && !S.chutes.some(c2 => c2.x === x && c2.y === y);
  }
  // la case où se trouve (ou arrive) le héros
  const caseHeros = ow => { const P = ow.p; return P.moving && P.t > 0.45 ? [P.tx, P.ty] : [P.x, P.y]; };
  // une case visée dans les zones, près du héros : une fois sur deux, sa propre case
  function viser(ow, zones, r) {
    const [px, py] = caseHeros(ow);
    if (!dansZones(zones, px, py, 1)) return null;
    for (let k = 0; k < 14; k++) {
      const vise = k === 0 && R() < 0.5, x = vise ? px : px + Math.round((R() - 0.5) * 2 * r), y = vise ? py : py + Math.round((R() - 0.5) * 2 * r);
      if (dansZones(zones, x, y) && solLibre(ow, x, y)) return [x, y];
    }
    return null;
  }
  const occupe = (ow, x, y) => { const P = ow.p, F = ow.f; return (P.x === x && P.y === y) || (P.tx === x && P.ty === y) || (F.x === x && F.y === y) || (F.tx === x && F.ty === y) || !!ow.npcAt(x, y) || !!DW.Wild.at(ow, x, y); };

  // ---------------------------------------------------------------- un coup reçu : PV perdus, étourdi, repoussé
  function frapper(ow, k, recul) {
    const S = E(ow.map), m = ow.partner; if (!m || ow.locked || ow.cine || S.grace > 0) return;
    S.grace = 1.1;   // (jamais deux coups d'affilée)
    if (m.hp <= 1) { ow.runScript(() => evanoui(ow, m, k)); return; }
    const perte = Math.min(m.hp - 1, Math.max(1, Math.round(m.maxHp * PEINE[k])));
    m.hp -= perte;
    ow.shake = Math.max(ow.shake || 0, 0.3); DW.Audio.sfx('hit'); if (DW.Input && DW.Input.rumble) DW.Input.rumble(0.45, 160);
    if (DW.Lave) DW.Lave.bulles.push({ x: ow.p.x * TS + 8, y: ow.p.y * TS - 6, t: 0, txt: `-${perte}` });   // (chiffre rouge : game/lave.js)
    const premier = !S.vus.has(k); S.vus.add(k);
    ow.runScript(async () => {
      if (recul) await reculer(ow, recul);
      if (premier) await DW.say(`${MOTS[k](m.name)} (-${perte} PV) ${CONSEIL[k]}${m.hp <= 1 ? ` ${m.name} est à bout de forces : soigne-le vite, ou il s'évanouira au prochain coup !` : ''}`);
      else await DW.wait(k === 'rocher' ? 0.7 : 0.35);   // (étourdi un instant)
    });
  }
  // repoussé d'une case (si elle est libre) dans le sens du coup
  async function reculer(ow, [dx, dy]) {
    const P = ow.p, d = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const [ax, ay] = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }[d];
    if (P.moving || ow.solid(P.x + ax, P.y + ay) || ow.falaise(P.x, P.y, P.x + ax, P.y + ay)) return;
    const face = P.dir; await ow.forceStep(d); P.dir = face;
  }
  // à bout de forces, le partenaire s'évanouit : retour au début du cercle (la carte reste telle quelle)
  async function evanoui(ow, m, k) {
    DW.Audio.sfx('faint'); ow.shake = 0.5;
    await DW.say(`${MOTS[k](m.name)} ${m.name} était déjà à bout de forces... il s'évanouit !`);
    await DW.say('Tu le prends dans tes bras et rebrousses chemin, tant bien que mal, jusqu\'au début du cercle.');
    await DW.fade(1, 0.6);
    const A = ow.map.entry || { x: ow.p.x, y: ow.p.y };
    await ow.charger(ow.mapId, A.x, A.y, ow.map.entryDir || 'up');
    E(ow.map).grace = 6;
    await DW.fade(0, 0.6);
    await DW.say(`${m.name} rouvre les yeux, encore tout faible. (Soigne-le avant de repartir : une RAM PV, un bon repas...)`);
  }

  // ---------------------------------------------------------------- nuées de chauves-souris
  function nuee(ow, S) {
    const C = ow.map.chauvesSouris, P = ow.p, hx = P.x * TS + 8, hy = P.y * TS + 6;
    // un nid assez loin pour qu'on les entende venir, assez près pour qu'elles arrivent
    const nids = C.nids.map(([x, y]) => [x * TS + 8, y * TS + 8]).filter(([x, y]) => { const d = Math.hypot(x - hx, y - hy); return d > 80 && d < 280; });
    if (!nids.length) return;
    const [x0, y0] = nids[Math.floor(R() * nids.length)];
    const tx = hx + (R() - 0.5) * 26, ty = hy + (R() - 0.5) * 26, d = Math.hypot(tx - x0, ty - y0), v = 96 + R() * 34;
    S.nuees.push({ x: x0, y: y0, vx: (tx - x0) / d * v, vy: (ty - y0) / d * v, t: 0, vie: (d + 180) / v, touche: false,
      chauves: Array.from({ length: 5 + Math.floor(R() * 4) }, () => ({ ox: (R() - 0.5) * 24, oy: (R() - 0.5) * 18, ph: R() * 6, a: 3 + R() * 5, f: 26 + R() * 10 })) });
    DW.Audio.sfx('chauvesouris');
  }
  const posChauve = (N, b) => { const n = Math.hypot(N.vx, N.vy) || 1, w = Math.sin(N.t * 6 + b.ph) * b.a; return [N.x + b.ox - N.vy / n * w, N.y + b.oy + N.vx / n * w]; };

  // ---------------------------------------------------------------- lumières de la lave (une par bloc de 3 × 3 cases)
  function lueurs(map) {
    const L = [], vu = new Set();
    for (let y = 0; y < map.rows.length; y++) for (let x = 0; x < map.rows[y].length; x++) {
      if (map.rows[y][x] !== 'ȴ') continue;
      const k = Math.floor(x / 3) + ',' + Math.floor(y / 3); if (vu.has(k)) continue; vu.add(k);
      L.push({ x: x * TS + 8, y: y * TS + 8, r: 46, col: 'rgba(255,110,40,0.5)', ph: H2(x, y, 51) * 6 });
    }
    return L;
  }

  const P = DW.Perils = {
    etat: E,   // (pour les essais)
    // arrivée sur une carte : rien ne tombe ni ne vole dans les premières secondes
    entree(ow) { if (!actif(ow.map)) return; const S = E(ow.map); S.chutes.length = 0; S.nuees.length = 0; S.gravats.clear(); S.grace = 2.5; S.tNuee = Math.max(S.tNuee, 5); },
    // gravats encore là : la case est bloquée (game/overworld.js : solid)
    bloque(ow, x, y) { const s = etat.get(ow.map); return !!(s && s.gravats.size && s.gravats.has(x + ',' + y)); },
    update(ow, dt) {
      const map = ow.map; if (!actif(map)) return;
      const S = E(map), libre = !ow.locked && !ow.cine;
      if (S.grace > 0) S.grace -= dt;
      // gravats qui s'effritent
      for (const [k, g] of S.gravats) { g.t -= dt; if (g.t <= 0) { S.gravats.delete(k); const [x, y] = k.split(',').map(Number); for (let i = 0; i < 6; i++) S.parts.push({ x: x * TS + 8 + (R() - 0.5) * 12, y: y * TS + 12, vx: (R() - 0.5) * 16, vy: -8 - R() * 10, t: 0, vie: 0.9, k: 'poussiere' }); } }
      // nouvelles chutes de pierres et de braises (seulement quand on joue : pas pendant un dialogue)
      if (libre && S.grace <= 0) {
        if (map.eboulis && (S.tChute -= dt) <= 0) { S.tChute = entre(map.eboulis.tous); const c = viser(ow, map.eboulis.zones, 3); if (c) { S.chutes.push({ x: c[0], y: c[1], t: 0, k: 'rocher' }); if (Math.hypot(ow.p.x - c[0], ow.p.y - c[1]) < 8) DW.Audio.sfx('shake'); } }
        if (map.braises && (S.tBraise -= dt) <= 0) { S.tBraise = entre(map.braises.tous); const c = viser(ow, map.braises.zones, 4); if (c) S.chutes.push({ x: c[0], y: c[1], t: 0, k: 'braise' }); }
        if (map.chauvesSouris && (S.tNuee -= dt) <= 0) { S.tNuee = entre(map.chauvesSouris.tous); nuee(ow, S); }
      }
      for (const c of S.chutes) {
        c.t += dt;
        // de la poussière (ou des étincelles) tombe du plafond pendant l'avertissement
        if (c.t < DUREE[c.k] && R() < dt * (c.k === 'rocher' ? 22 : 10)) S.parts.push({ x: c.x * TS + 8 + (R() - 0.5) * 12, y: c.y * TS - 70 - R() * 30, vx: (R() - 0.5) * 4, vy: 90 + R() * 40, t: 0, vie: 0.8, k: c.k === 'rocher' ? 'gravillon' : 'etincelle', sol: c.y * TS + 12 });
        if (c.t < DUREE[c.k] || c.fini) continue;
        c.fini = true;
        const X = c.x * TS + 8, Y = c.y * TS + 12, pres = Math.hypot(ow.p.x - c.x, ow.p.y - c.y);
        if (c.k === 'rocher') {
          for (let i = 0; i < 14; i++) { const a = -Math.PI * R(), v = 30 + R() * 50; S.parts.push({ x: X, y: Y - 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, vie: 0.5 + R() * 0.4, k: 'eclat', r: R() * 6 }); }
          for (let i = 0; i < 7; i++) S.parts.push({ x: X + (R() - 0.5) * 16, y: Y - 2, vx: (R() - 0.5) * 22, vy: -10 - R() * 14, t: 0, vie: 1.2 + R() * 0.6, k: 'poussiere' });
          if (pres < 7) { ow.shake = Math.max(ow.shake || 0, 0.35); DW.Audio.sfx('explode'); }
        } else {
          for (let i = 0; i < 12; i++) { const a = -Math.PI * R(), v = 25 + R() * 45; S.parts.push({ x: X, y: Y - 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, vie: 0.4 + R() * 0.4, k: 'etincelle' }); }
          if (pres < 6) DW.Audio.sfx('fire');
        }
        const [hx, hy] = caseHeros(ow);
        if (hx === c.x && hy === c.y) frapper(ow, c.k);
        else if (c.k === 'rocher' && !occupe(ow, c.x, c.y)) S.gravats.set(c.x + ',' + c.y, { t: 8 + R() * 3, v: Math.floor(R() * 2) });
      }
      S.chutes = S.chutes.filter(c => !c.fini || c.t < DUREE[c.k] + 0.2);
      // nuées : elles filent, ondulent ; au contact, elles griffent et repoussent le héros
      const hx = ow.pos(ow.p).x * TS + 8, hy = ow.pos(ow.p).y * TS + 4;
      for (const N of S.nuees) {
        N.t += dt; N.x += N.vx * dt; N.y += N.vy * dt;
        if (!N.touche && libre && N.chauves.some(b => { const [x, y] = posChauve(N, b); return Math.abs(x - hx) < 10 && Math.abs(y - hy) < 11; })) { N.touche = true; frapper(ow, 'nuee', [N.vx, N.vy]); }
      }
      S.nuees = S.nuees.filter(N => N.t < N.vie);
      // jets de flammes des tombeaux : calme → il rougeoie → il crache
      for (const J of S.jets) {
        J.t -= dt;
        if (J.phase === 'calme' && J.t <= 0) { J.phase = 'charge'; J.t = 0.9; }
        else if (J.phase === 'charge' && J.t <= 0) { J.phase = 'jet'; J.t = 1.1; J.touche = false; if (Math.hypot(ow.p.x - J.x, ow.p.y - J.y) < 9) DW.Audio.sfx('fire'); }
        else if (J.phase === 'jet') {
          const [x, y] = caseHeros(ow);
          if (!J.touche && libre) for (let i = 1; i <= J.n; i++) if (x === J.x + J.dx * i && y === J.y + J.dy * i) { J.touche = true; frapper(ow, 'flamme'); break; }
          if (R() < dt * 30) { const i = 1 + Math.floor(R() * J.n); S.parts.push({ x: (J.x + J.dx * i) * TS + 8 + (R() - 0.5) * 10, y: (J.y + J.dy * i) * TS + 6, vx: (R() - 0.5) * 10, vy: -30 - R() * 30, t: 0, vie: 0.5, k: 'etincelle' }); }
          if (J.t <= 0) { J.phase = 'calme'; J.t = entre(J.tous || [3, 6]); }
        }
      }
      // vapeur au-dessus des eaux qui bouillent (dans la partie visible)
      if (map.vapeur && R() < dt * 9) {
        const { cx, cy } = ow.camera(), x = Math.floor((cx + R() * DW.W) / TS), y = Math.floor((cy + R() * DW.H) / TS);
        if (map.rows[y] && map.rows[y][x] === '~') S.parts.push({ x: x * TS + R() * 16, y: y * TS + 8, vx: (R() - 0.5) * 6, vy: -10 - R() * 10, t: 0, vie: 2 + R(), k: 'vapeur' });
      }
      for (const p of S.parts) {
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.k === 'eclat' || p.k === 'etincelle') p.vy += 140 * dt;
        if ((p.k === 'gravillon' || (p.k === 'etincelle' && p.sol)) && p.y >= p.sol) p.t = p.vie;
      }
      S.parts = S.parts.filter(p => p.t < p.vie);
    },
    // ---------------------------------------------------------------- au sol : ombres, lueurs, gravats, tombeaux qui rougeoient
    draw(ow, c) {
      const map = ow.map; if (!actif(map)) return;
      const S = E(map), t = ow.t || 0;
      for (const ch of S.chutes) {
        if (ch.fini) continue;
        const u = Math.min(1, ch.t / DUREE[ch.k]), X = ch.x * TS + 8, Y = ch.y * TS + 13;
        if (ch.k === 'rocher') {   // (dans le noir, une ombre seule ne se verrait pas : un cercle de poussière claire l'entoure)
          c.strokeStyle = `rgba(226,206,170,${0.25 + 0.45 * u})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(X, Y, 5 + 7 * u, 2.6 + 3.4 * u, 0, 0, 7); c.stroke();
          c.fillStyle = `rgba(12,6,4,${0.18 + 0.5 * u})`; c.beginPath(); c.ellipse(X, Y, 4 + 7 * u, 2 + 3.4 * u, 0, 0, 7); c.fill();
        }
        else { const r = 6 + 6 * u, g = c.createRadialGradient(X, Y, 1, X, Y, r); g.addColorStop(0, `rgba(255,220,120,${0.3 + 0.5 * u * (0.8 + 0.2 * Math.sin(t * 30))})`); g.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(X, Y, r, r * 0.55, 0, 0, 7); c.fill(); }
      }
      const G = map.eboulis && map.eboulis.gravats && DW.World.OBJ[map.eboulis.gravats] ? map.eboulis.gravats : null;
      for (const [k, g] of S.gravats) {
        const [x, y] = k.split(',').map(Number), a = Math.min(1, g.t / 1.2);
        c.globalAlpha = a;
        if (G) { const s = DW.World.obj(G, 0); c.drawImage(s.img, Math.round(x * TS + 8 - s.w / 2), Math.round(y * TS + 15 - s.h)); }
        else { c.fillStyle = '#4a3a30'; c.beginPath(); c.ellipse(x * TS + 8, y * TS + 11, 7, 4, 0, 0, 7); c.fill(); c.fillStyle = '#6a584a'; c.beginPath(); c.ellipse(x * TS + 6, y * TS + 9, 4, 2.5, 0, 0, 7); c.fill(); }
        c.globalAlpha = 1;
      }
      for (const J of S.jets) {
        if (J.phase === 'calme') continue;
        // (le sol devant le tombeau rougeoit avant le jet, puis brûle)
        const a = J.phase === 'charge' ? (1 - J.t / 0.9) * 0.45 : 0.55;
        for (let i = 1; i <= J.n; i++) { const X = (J.x + J.dx * i) * TS + 8, Y = (J.y + J.dy * i) * TS + 10, g = c.createRadialGradient(X, Y, 1, X, Y, 12); g.addColorStop(0, `rgba(255,140,40,${a})`); g.addColorStop(1, 'rgba(255,60,10,0)'); c.fillStyle = g; c.fillRect(X - 12, Y - 12, 24, 24); }
      }
      // ombres des chauves-souris au sol
      for (const N of S.nuees) for (const b of N.chauves) { const [x, y] = posChauve(N, b); c.fillStyle = 'rgba(8,4,8,0.22)'; c.beginPath(); c.ellipse(x, y + 22, 4, 1.5, 0, 0, 7); c.fill(); }
    },
    // ---------------------------------------------------------------- au-dessus de tout : rochers qui tombent, braises, flammes, chauves-souris
    drawTop(ow, c) {
      const map = ow.map; if (!actif(map)) return;
      const S = E(map), t = ow.t || 0;
      const PIERRE = map.eboulis && map.eboulis.pierre && DW.World.OBJ[map.eboulis.pierre] ? map.eboulis.pierre : null;
      for (const ch of S.chutes) {
        const reste = DUREE[ch.k] - ch.t; if (ch.fini || reste > 0.32) continue;
        const h = Math.max(0, reste / 0.32) * 120, X = ch.x * TS + 8, Y = ch.y * TS + 13 - h;
        if (ch.k === 'rocher') {
          if (PIERRE) { const s = DW.World.obj(PIERRE, 0); c.drawImage(s.img, Math.round(X - s.w / 2), Math.round(Y - s.h + 3)); }
          else { c.fillStyle = '#3a2c24'; c.beginPath(); c.ellipse(X, Y - 6, 8, 7, 0, 0, 7); c.fill(); c.fillStyle = '#6a5444'; c.beginPath(); c.ellipse(X - 2, Y - 8, 4, 3, 0, 0, 7); c.fill(); }
          c.fillStyle = 'rgba(200,190,170,0.35)'; c.fillRect(X - 1, Y - 30, 2, 18);   // (traînée)
        } else { c.strokeStyle = 'rgba(255,200,90,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X, Y - 12); c.lineTo(X, Y); c.stroke(); c.fillStyle = '#fff2b0'; c.beginPath(); c.arc(X, Y, 2.2, 0, 7); c.fill(); }
      }
      // langues de feu des tombeaux : une nappe continue, puis des flammes qui dansent dessus
      for (const J of S.jets) {
        if (J.phase !== 'jet') continue;
        const u = 1 - Math.max(0, J.t) / 1.1, k = u < 0.12 ? u / 0.12 : u > 0.85 ? (1 - u) / 0.15 : 1;
        const x0 = (J.x + J.dx) * TS + 8, y0 = (J.y + J.dy) * TS + 10, x1 = (J.x + J.dx * J.n) * TS + 8, y1 = (J.y + J.dy * J.n) * TS + 10;
        c.lineCap = 'round';
        for (const [w, col] of [[15, `rgba(200,40,10,${0.5 * k})`], [10, `rgba(255,120,30,${0.75 * k})`], [5, `rgba(255,236,150,${0.85 * k})`]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
        for (let i = 1; i <= J.n; i++) {
          const X = (J.x + J.dx * i) * TS + 8, Y = (J.y + J.dy * i) * TS + 10, f = 0.7 + 0.3 * Math.sin(t * 24 + i * 1.7);
          for (const [r, col, dy] of [[8, `rgba(220,60,14,${0.6 * k})`, -9], [6, `rgba(255,140,40,${0.8 * k})`, -11], [3, `rgba(255,236,150,${0.9 * k})`, -12]]) { c.fillStyle = col; c.beginPath(); c.ellipse(X + Math.sin(t * 17 + i) * 2, Y + dy * f, r, r * 1.5 * f, 0, 0, 7); c.fill(); }
        }
        c.lineCap = 'butt';
      }
      // particules : gravillons, éclats, poussière, étincelles, vapeur
      for (const p of S.parts) {
        const u = p.t / p.vie;
        if (p.k === 'gravillon') { c.fillStyle = `rgba(150,136,120,${1 - u * 0.5})`; c.fillRect(p.x, p.y, 1.6, 1.6); }
        else if (p.k === 'eclat') { c.save(); c.translate(p.x, p.y); c.rotate(p.r + u * 6); c.fillStyle = `rgba(70,56,46,${1 - u * 0.6})`; c.fillRect(-1.5, -1.2, 3, 2.4); c.restore(); }
        else if (p.k === 'etincelle') { c.fillStyle = `rgba(255,${Math.round(220 - u * 140)},${Math.round(90 - u * 60)},${1 - u})`; c.fillRect(p.x - 1, p.y - 1, 2, 2); }
        else { const r = (p.k === 'vapeur' ? 4 : 3) + u * (p.k === 'vapeur' ? 10 : 8), g = p.k === 'vapeur' ? 236 : 150; c.fillStyle = `rgba(${g},${g - 8},${g - 16},${(p.k === 'vapeur' ? 0.4 : 0.45) * (1 - u)})`; c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fill(); }
      }
      // les chauves-souris : corps violet sombre, ailes qui battent vite (bord plus clair : on les voit dans le noir), yeux rouges
      for (const N of S.nuees) {
        const fin = Math.max(0, Math.min(1, (N.vie - N.t) / 0.4)), deb = Math.min(1, N.t / 0.3);
        c.globalAlpha = Math.min(fin, deb);
        for (const b of N.chauves) {
          const [x, y] = posChauve(N, b), a = Math.sin(t * b.f + b.ph), s = N.vx < 0 ? -1 : 1;
          const aile = d => { c.beginPath(); c.moveTo(x + d * 2, y); c.lineTo(x + d * 11, y - 6 * a); c.lineTo(x + d * 8, y + 1.5); c.lineTo(x + d * 5, y - 1); c.closePath(); c.fill(); c.stroke(); };
          c.fillStyle = '#3a2448'; c.strokeStyle = '#8a6aa0'; c.lineWidth = 0.7;
          aile(-1); aile(1);
          c.beginPath(); c.ellipse(x, y, 3, 2.6, 0, 0, 7); c.fill(); c.stroke();
          c.fillStyle = '#ff4a30'; c.fillRect(Math.round(x + s * 0.6 - 2), Math.round(y - 1.5), 1.6, 1.6); c.fillRect(Math.round(x + s * 0.6 + 0.6), Math.round(y - 1.5), 1.6, 1.6);
        }
        c.globalAlpha = 1;
      }
    },
    // lumières (coordonnées du monde) : la lave, les braises qui tombent, les tombeaux qui crachent
    lights(ow) {
      const map = ow.map; if (!actif(map)) return null;
      const S = E(map), t = ow.t || 0, L = [];
      if (!S.lueurs || S.lueursPour !== map.rows) { S.lueurs = lueurs(map); S.lueursPour = map.rows; }
      for (const l of S.lueurs) L.push({ x: l.x, y: l.y, r: l.r * (0.92 + 0.08 * Math.sin(t * 2.3 + l.ph)), col: l.col });
      for (const ch of S.chutes) if (!ch.fini) {
        const u = Math.min(1, ch.t / DUREE[ch.k]);
        if (ch.k === 'braise') L.push({ x: ch.x * TS + 8, y: ch.y * TS + 10, r: 14 + 16 * u, col: 'rgba(255,150,60,0.6)' });
        else L.push({ x: ch.x * TS + 8, y: ch.y * TS + 10, r: 10 + 14 * u, col: 'rgba(230,214,180,0.3)' });   // (la poussière qui tombe accroche la lumière)
      }
      for (const J of S.jets) if (J.phase !== 'calme') for (let i = 1; i <= J.n; i += 2) L.push({ x: (J.x + J.dx * i) * TS + 8, y: (J.y + J.dy * i) * TS + 6, r: J.phase === 'jet' ? 44 : 16, col: 'rgba(255,140,50,0.65)' });
      for (const N of S.nuees) L.push({ x: N.x, y: N.y, r: 26, col: 'rgba(255,70,50,0.3)' });   // (les yeux rouges de la nuée)
      return L;
    },
  };
  P.actif = actif;
})();
