'use strict';
// =====================================================================
//  RÉGIONS DE L'ÎLE DES FICHIERS — 16 régions de 10 sous-zones
//  (inspirées de Digimon World 1 et de la saison 1 de Digimon Adventure)
//
//  Chaque région suit un plan de 10 cases (avec des boucles), orienté selon son entrée :
//      0 — 1 — 2 — 3
//      |   |   |   |
//      7 — 6 — 5 — 4        (liaisons : chaîne 0→9 + raccourcis 1-6, 2-5, 6-9)
//      |   |
//      8 — 9
//  Chaque sous-zone a un gabarit (sentier, lac, rivière, pont, labyrinthe, place, îlots,
//  bosquet, grotte, lieu emblématique) et ses repères ; les cartes sont générées à la demande.
//  Les passages sont créés dans les deux sens, alignés sur les sorties de chaque carte.
// =====================================================================
(function () {
  const { forestGen, paint } = DW.MapKit;
  const MAPS = DW.MAPS, Hh = DW.Art.hash;
  const OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
  // échelle des régions (façon Digimon World) : zones ~2 fois plus grandes en surface, passages 2 fois plus larges
  const K = 1.45;
  const PLAN = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2]];
  const PLINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [1, 6], [2, 5], [6, 9]];

  function edit(rows, fn) {
    const g = rows.map(r => [...r]);
    const api = {
      get: (x, y) => g[y] && g[y][x], set: (x, y, ch) => { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = ch; },
      rect: (x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) api.set(i, j, ch); },
      w: g[0].length, h: g.length,
    };
    fn(api, g);
    return g.map(r => r.join(''));
  }

  // ------------------------------------------------------------ gabarits de sous-zone
  function kindOpts(kind, w, h, hub, s) {
    const r = k => Hh(s, k, 77);
    const spot = (k, m = 6) => [m + Math.floor(r(k) * (w - 2 * m)), m + Math.floor(r(k + 50) * (h - 2 * m))];
    const blobs = (n, k0, rx0, rx1) => Array.from({ length: n }, (_, i) => { const [x, y] = spot(k0 + i); return { x, y, rx: rx0 + r(k0 + i + 20) * (rx1 - rx0), ry: (rx0 + r(k0 + i + 30) * (rx1 - rx0)) * 0.72 }; });
    switch (kind) {
      case 'plaza': case 'set': return { hubR: Math.round(Math.min(w, h) * (kind === 'set' ? 0.2 : 0.28)), autoTall: 0.68, deco: 0.7, clearings: blobs(1, 1, 3, 4) };
      case 'lake': { const L = r(3) < 0.5 ? 0.27 : 0.73, T = r(4) < 0.5 ? 0.3 : 0.7; return { hubR: 4, lakes: [{ x: w * L, y: h * T, rx: w * 0.18, ry: h * 0.17 }], autoTall: 0.6, deco: 0.9, clearings: blobs(1, 5, 3, 4) }; }
      case 'bigLake': return { hubR: 3, lakes: [{ x: w * 0.5 + (r(3) - 0.5) * 6, y: h * 0.5 + (r(4) - 0.5) * 4, rx: w * 0.27, ry: h * 0.26 }], autoTall: 0.62, deco: 0.9 };
      case 'river': return { hubR: 4, rivers: [{ pts: [[-1, h * (0.15 + r(2) * 0.2)], [w * 0.38, h * 0.45], [w * 0.62, h * 0.55], [w + 1, h * (0.65 + r(3) * 0.2)]], r: 1.5 }], autoTall: 0.6, deco: 1, clearings: blobs(2, 7, 2.6, 3.6) };
      case 'bridge': return { hubR: 3, rivers: [{ pts: [[w * 0.5 + (r(2) - 0.5) * 6, -1], [w * 0.45, h * 0.5], [w * 0.55 + (r(3) - 0.5) * 6, h + 1]], r: 2.8 }], autoTall: 0.62, deco: 0.9 };
      case 'maze': return { hubR: 3, wiggle: 14, autoTall: 0.48, deco: 1.3, clearings: blobs(4, 9, 2.2, 3.4) };
      case 'islands': return { hubR: 3, lakes: blobs(6, 13, 2, 3.6), autoTall: 0.6, deco: 1 };
      case 'grove': return { hubR: 4, autoTall: 0.55, deco: 1.4, lmMul: 2, clearings: blobs(2, 21, 3, 4.2) };
      case 'cave': return { hubR: 5, wiggle: 12, deco: 0.9, autoTall: 0.75, clearings: blobs(3, 25, 3, 4.6), lmMul: 1.5 };
      default: return { hubR: 4, autoTall: 0.6, deco: 1, clearings: blobs(2, 31, 3, 4) }; // trail
    }
  }

  // ponts DROITS : un chemin qui traverse l'eau en biais laissait un pont en escalier ; chaque pont devient une bande
  // de 3 cases dans le sens de la traversée, prolongée jusqu'à la terre ferme de chaque côté
  function straightBridges(rows) {
    const g = rows.map(r => [...r]), h = g.length, w = g[0].length, seen = new Uint8Array(w * h);
    const wet = c => c === '~' || c === 'w' || c === '_';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (g[y][x] !== '_' || seen[y * w + x]) continue;
      const comp = [], st = [[x, y]]; seen[y * w + x] = 1;
      while (st.length) { const [cx, cy] = st.pop(); comp.push([cx, cy]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && !seen[ny * w + nx] && g[ny][nx] === '_') { seen[ny * w + nx] = 1; st.push([nx, ny]); } } }
      if (comp.length < 4) continue;
      let mx = 1e9, Mx = -1, my = 1e9, My = -1, sx = 0, sy = 0;
      for (const [cx, cy] of comp) { mx = Math.min(mx, cx); Mx = Math.max(Mx, cx); my = Math.min(my, cy); My = Math.max(My, cy); sx += cx; sy += cy; }
      const hz = Mx - mx >= My - my, c0 = Math.round(hz ? sy / comp.length : sx / comp.length);
      for (const [cx, cy] of comp) g[cy][cx] = '~';
      const set = (a, b) => { const [cx, cy] = hz ? [a, b] : [b, a]; if (cx >= 0 && cy >= 0 && cx < w && cy < h && wet(g[cy][cx])) g[cy][cx] = '_'; };
      const isWet = (a, b) => { const [cx, cy] = hz ? [a, b] : [b, a]; return cx >= 0 && cy >= 0 && cx < w && cy < h && wet(g[cy][cx]); };
      const a0 = hz ? mx : my, a1 = hz ? Mx : My;
      let s0 = a0, s1 = a1;
      while (s0 > 0 && s0 > a0 - 8 && isWet(s0 - 1, c0)) s0--;   // jusqu'à la rive
      while (s1 < (hz ? w : h) - 1 && s1 < a1 + 8 && isWet(s1 + 1, c0)) s1++;
      // (un chemin qui LONGE l'eau sur une grande distance n'est pas un pont : c'est une digue de terre et de sable)
      const dike = s1 - s0 > 11;
      for (let a = s0; a <= s1; a++) for (const d of [-1, 0, 1]) { set(a, c0 + d); if (dike) { const [cx, cy] = hz ? [a, c0 + d] : [c0 + d, a]; if (g[cy] && g[cy][cx] === '_') g[cy][cx] = d ? 's' : '='; } }
    }
    return g.map(r => r.join(''));
  }

  // ------------------------------------------------------------ génération des lignes d'une sous-zone
  function genRows(m) {
    const o = m.spec, { w, h } = m, ex = m.exits, hub = o.hub, seed = o.seed;
    const paths = [], free = [];
    const mid = (a, b, k) => [(a[0] + b[0]) / 2 + (Hh(a[0], b[1], seed) - 0.5) * k, (a[1] + b[1]) / 2 + (Hh(b[0], a[1], seed + 1) - 0.5) * k];
    for (const side in ex) {
      const [pos, len] = ex[side], c = pos + (len - 1) / 2;
      const out = { left: [-1, c], right: [w, c], up: [c, -1], down: [c, h] }[side];
      const inn = { left: [3, c], right: [w - 4, c], up: [c, 3], down: [c, h - 4] }[side];
      paths.push({ pts: [out, inn, mid(inn, hub, o.wiggle != null ? o.wiggle : 8), hub], r: len / 2 + 0.3 });
      free.push([inn[0], inn[1], 2]);
    }
    // espaces ouverts (voir addRooms) : un chemin depuis le carrefour jusqu'au bord de chacun
    for (const R of o.rooms || []) { paths.push({ pts: [hub, mid(hub, R.door, 6 * K), R.door], r: 2.6 }); free.push([R.x, R.y, Math.min(R.rx, R.ry) * 0.6]); }   // centre dégagé (pas de rochers)
    const lm = (o.lm || []).map(([ch, n]) => [ch, Math.round(n * (o.lmMul || 1))]);
    let rows = forestGen({ w, h, seed, paths, free, clearings: [{ x: hub[0], y: hub[1], rx: o.hubR, ry: o.hubR * 0.75 }, ...(o.clearings || [])],
      lakes: o.lakes, rivers: o.rivers, autoTall: o.autoTall, deco: o.deco, landmarks: lm, bigtrees: o.bigtrees, tall: o.tall });
    rows = straightBridges(rows);
    // bord de l'île : la mer, une plage ou une falaise sur les côtés sans passage (on garde la pièce maîtresse et ses abords)
    if (m.coast) {
      const P = m.piece, keep = P ? (x, y) => x >= P.x - 3 && x < P.x + P.w + 3 && y >= P.y - 1 && y < P.y + P.h + 4 : null;
      for (const s in m.coast) if (ex[s]) throw new Error(`${m.name} : côte ${s} sur un passage`);
      rows = DW.MapKit.coast(rows, m.coast, { seed, keep });
    }
    // (la profondeur de mer le long de chaque bord est celle de la côte de la voisine À LA FRONTIÈRE : même formule que
    //  MapKit.coast, même graine ; le long du bord partagé avec la voisine de rangée : A cases, avec celle de colonne : B cases)
    const coastDepth = (nb, cs, end) => {
      const Nb = MAPS[nb], ns = Nb.spec.seed, along = cs === 'up' || cs === 'down' ? Nb.w : Nb.h, F = (t, k) => DW.Art.fbm(t, k, ns * 7 + 3);
      const sea = Math.max(8, Math.round(Math.min(Nb.w, Nb.h) * 0.15)), t = end ? along - 1 : 0;
      return Math.max(0, sea + (F(t * 0.03, cs.length) - 0.5) * 26 + (F(t * 0.11, 9 + cs.length) - 0.5) * 8);
    };
    for (const c of m.coastCorners || []) rows = edit(rows, g => {
      const { hs, vs } = c;
      const A = c.row ? coastDepth(c.row, vs, hs === 'left') : 2;   // eau le long du bord gauche/droit (vers le large : hauteur)
      const B = c.col ? coastDepth(c.col, hs, vs === 'up') : 2;     // eau le long du bord haut/bas (vers le large : largeur)
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = hs === 'left' ? x : w - 1 - x, dy = vs === 'up' ? y : h - 1 - y;
        const e = (dx / (B + 0.01)) ** 2 + (dy / (A + 0.01)) ** 2 + (DW.Art.fbm(x * 0.2, y * 0.2, seed + 7) - 0.5) * 0.15;
        const onExit = Object.entries(ex).some(([sd, [p, l]]) => (sd === 'left' || sd === 'right' ? y >= p - 2 && y < p + l + 2 && (sd === 'left' ? x < 8 : x > w - 9) : x >= p - 2 && x < p + l + 2 && (sd === 'up' ? y < 8 : y > h - 9)));
        if (onExit) continue;
        if (e < 1) g.set(x, y, '~'); else if (e < 1.35 && g.get(x, y) !== '~') g.set(x, y, Hh(x, y, 783) < 0.1 ? 'R' : 's');
      }
    });
    // emprise des objets posés (bloquants)
    const occ = new Set();
    for (const ob of m.objects) if (!ob.walk && !ob.top) for (let y = ob.y; y < ob.y + ob.h; y++) for (let x = ob.x; x < ob.x + ob.w; x++) occ.add(x + ',' + y);
    rows = edit(rows, g => {
      const P = m.piece;
      if (P) {
        g.rect(P.x - 1, Math.max(1, P.y - 1), P.w + 2, P.h + 3, '.');
        g.rect(P.fx, P.y + P.h, P.dw || 1, 2, '=');
      }
      for (const ob of m.objects) if (ob !== m.objects[0] || !P) g.rect(ob.x, ob.y, ob.w, ob.h, '.');
      for (const side in ex) {
        const [pos, len] = ex[side];
        for (let k = 0; k < len; k++) for (let d = 0; d < 3; d++) {
          const [x, y] = { left: [d, pos + k], right: [w - 1 - d, pos + k], up: [pos + k, d], down: [pos + k, h - 1 - d] }[side];
          if (g.get(x, y) !== '_') g.set(x, y, '=');
        }
      }
      // langue de sable au lieu d'un pont : on élargit le passage sur l'eau
      if (m.sandWalk) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.get(x, y) === '_') {
        for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) { const c = g.get(x + dx, y + dy); if (c === '~' || c === 'w' || c === '_') g.set(x + dx, y + dy, Hh(x + dx, y + dy, 641) < 0.12 ? ';' : 's'); }
      }
      if (o.post) o.post(g, m);
      // activité de la sous-zone (tournoi, curling, trésor, pêche) : un panneau près du carrefour
      if (m.activity) { const ax = hub[0] + 2, ay = hub[1] - 1; g.set(ax, ay, 'S'); m.signs[ax + ',' + ay] = m.activity.run; }
      // toilettes (cabane 3 × 2) près du carrefour, dans quelques sous-zones de chaque région
      if (m.hamlet) placeHamlet(g, m, hub, occ);   // un petit village par région
      if (m.idx % 4 === 0 || m.hamlet) placeToilet(g, m, hub, occ);
      // liaison garantie : chaque sortie (et la porte) rejoint le carrefour, quitte à tracer un chemin / un pont
      const walk = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !DW.SOLID.has(g.get(x, y)) && !occ.has(x + ',' + y);
      const reach = () => {
        const seen = new Set([hub[0] + ',' + hub[1]]), q = [hub];
        while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (!seen.has(k) && walk(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); } } }
        return seen;
      };
      const carveCell = (x, y) => { if (occ.has(x + ',' + y)) return; const c = g.get(x, y); if (c === '~' || c === 'w') g.set(x, y, '_'); else if (DW.SOLID.has(c)) g.set(x, y, '='); };
      if (!walk(hub[0], hub[1])) g.set(hub[0], hub[1], '=');
      const targets = Object.keys(ex).map(side => { const [pos, len] = ex[side], c = pos + (len >> 1); return { left: [2, c], right: [w - 3, c], up: [c, 2], down: [c, h - 3] }[side]; });
      if (P) targets.push([P.fx, P.y + P.h]);
      for (const t of targets) {
        if (reach().has(t[0] + ',' + t[1])) continue;
        let [x, y] = t;
        // d'abord vers la ligne du carrefour, puis vers sa colonne (contourne les grands décors posés en haut)
        while (y !== hub[1]) { carveCell(x, y); y += Math.sign(hub[1] - y); }
        while (x !== hub[0]) { carveCell(x, y); x += Math.sign(hub[0] - x); }
      }
    });
    return rows;
  }

  // ------------------------------------------------------------ construction d'une région
  // R : { name, theme, entry, lm, music, climate, ambient, dark, out:[[i, côté]], subs:[[nom, gabarit, options]] }
  //     plan / links : plan propre (cases [x, y] déjà orientées, liaisons) au lieu du plan commun ;
  //     lake : { cx, cy, r } grand lac partagé par plusieurs cartes, en coordonnées du plan (1 = une carte)
  // options : { w, h, theme, lm, noRegionLm, piece:{kind, w, h, v, door:{to, tx, ty, dw}}, pieceSign, objects, post, dark, indoor, plazas, mosaic, hazard, music, opts }
  const ENTRY = {}, LINKS = [];
  function region(rid, R) {
    const flipX = R.entry === 'right', flipY = R.entry === 'down';
    const pos = R.plan || PLAN.map(([x, y]) => [flipX ? 3 - x : x, flipY ? 2 - y : y]);
    const ids = R.subs.map((_, i) => rid + i);
    const sides = ids.map(() => ({}));
    const sideOf = (a, b) => { const dx = pos[b][0] - pos[a][0], dy = pos[b][1] - pos[a][1]; return dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; };
    for (const [a, b] of R.links || PLINKS) { const s = sideOf(a, b); sides[a][s] = ids[b]; sides[b][OPP[s]] = ids[a]; LINKS.push([ids[a], s, ids[b]]); }
    const ext = [[0, R.entry], ...(R.out || [])];
    for (const [i, s] of ext) { if (sides[i][s]) throw new Error(`région ${rid} : sortie ${s} déjà prise sur ${ids[i]}`); sides[i][s] = 'ext'; }
    ENTRY[rid] = ids[0];
    const rs = rid.length * 13 + rid.charCodeAt(0);
    // COINS DE CÔTE : si une voisine (même rangée) a la mer au nord ou au sud et pas cette carte (qui s'ouvre de ce côté
    // vers une autre carte), la côte tourne dans le coin commun ; idem pour une voisine de colonne avec la mer à l'est/ouest
    const coastOf = i => (R.subs[i][2] || {}).coast || {};
    const corners = ids.map((_, i) => {
      const out = {};
      const add = (hs, vs) => (out[hs + vs] = out[hs + vs] || { hs, vs, row: null, col: null });
      for (const hs of ['left', 'right']) { const nb = sides[i][hs]; if (!nb || nb === 'ext') continue; const j = ids.indexOf(nb);
        for (const vs of ['up', 'down']) if (coastOf(j)[vs] && !coastOf(i)[vs]) add(hs, vs).row = nb; }
      for (const vs of ['up', 'down']) { const nb = sides[i][vs]; if (!nb || nb === 'ext') continue; const j = ids.indexOf(nb);
        for (const hs of ['left', 'right']) if (coastOf(j)[hs] && !coastOf(i)[hs]) add(hs, vs).col = nb; }
      // (un coin dont une seule voisine a la mer : on regarde aussi l'autre voisine du coin, pour la largeur d'eau sur l'autre bord)
      for (const c of Object.values(out)) {
        if (!c.col) { const nb = sides[i][c.vs]; if (nb && nb !== 'ext' && coastOf(ids.indexOf(nb))[c.hs]) c.col = nb; }
        if (!c.row) { const nb = sides[i][c.hs]; if (nb && nb !== 'ext' && coastOf(ids.indexOf(nb))[c.vs]) c.row = nb; }
      }
      return Object.values(out);
    });
    const dimW = i => (R.subs[i][2] || {}).w || 88 + Math.floor(Hh(pos[i][0], 1, rs + 700) * 3) * 6;
    const dimH = i => (R.subs[i][2] || {}).h || 64 + Math.floor(Hh(pos[i][1], 2, rs + 700) * 3) * 4;
    R.subs.forEach(([name, kind, x = {}], i) => {
      // portail d'un donjon secret des écussons (maps/donjons.js)
      const dj = DW.Donjons && DW.Donjons.pieceFor(rid, i);
      if (dj && !x.piece) x = { ...x, ...dj };
      const id = ids[i], s = Hh(i, rid.length * 13 + rid.charCodeAt(0), 501) * 1000 | 0;
      // cartes larges (comme Digimon World) : de la place pour explorer et contourner les Digimon sauvages
      // GRILLE DE LA RÉGION : toutes les cartes d'une même colonne ont la même largeur, celles d'une même rangée la
      // même hauteur, et le passage entre deux voisines est calculé UNE fois pour les deux : la région forme un
      // quadrillage exact (les boucles de cartes se referment, rien ne se chevauche ; voir dev/assemblage.js)
      const w = dimW(i), h = dimH(i);   // (x.w / x.h : grande carte)
      const exits = {};
      for (const side in sides[i]) {
        const span = side === 'left' || side === 'right' ? h : w;
        if (sides[i][side] === 'ext') { const off = Math.round((Hh(i, side.length, s) - 0.5) * (span > 32 ? 8 : 6)); exits[side] = [Math.floor(span / 2) - 3 + off, 6]; continue; }
        const j = ids.indexOf(sides[i][side]), hz = side === 'left' || side === 'right';
        const c0 = Math.min(pos[i][0], pos[j][0]), r0 = Math.min(pos[i][1], pos[j][1]), shared = hz ? Math.min(h, dimH(j)) : Math.min(w, dimW(j));
        const off = Math.round((Hh(c0 * 7 + r0, hz ? 1 : 2, rs + 701) - 0.5) * 8);
        exits[side] = [Math.floor(shared / 2) - 3 + off, 6];   // passages de 6 cases, alignés des deux côtés
      }
      const hub = [Math.floor(w / 2) + Math.round((Hh(i, 3, s) - 0.5) * 8), Math.floor(h / 2) + Math.round((Hh(i, 4, s) - 0.5) * 5)];
      const theme = x.theme || R.theme, k = kindOpts(kind, w, h, hub, s + i);
      // gabarits pensés pour des cartes plus petites : carrefour, clairières, îlots, rivières et méandres agrandis
      k.hubR = Math.round(k.hubR * K); if (k.wiggle != null) k.wiggle *= K;
      for (const c of k.clearings || []) { c.rx *= K; c.ry *= K; }
      if (kind === 'islands') for (const l of k.lakes || []) { l.rx *= K; l.ry *= K; }
      for (const rv of k.rivers || []) rv.r *= 1.6;
      const cave = kind === 'cave';
      const spec = Object.assign({ seed: s + 13, hub, lm: [...(x.lm || []), ...(x.noRegionLm ? [] : R.lm || [])] }, k, x.opts || {}, { post: x.post });
      const m = MAPS[id] = { idx: i,
        name, regionName: R.name, music: x.music || DW.REGION_MUSIC[rid] || R.music || 'field', bg: 'foret', ambient: R.ambient || 'forest', theme, climate: R.climate || 'forest', region: rid,
        w, h, rate: 0, encounters: [], npcs: [], warps: [], exits, objects: [...(x.objects || [])], signs: { ...(x.signs || {}) }, doors: [],
        sandWalk: !!x.sandWalk, coastCorners: corners[i], indoor: cave || !!x.indoor, dark: x.dark || (cave ? { d: 0.45, col: '#3a3050' } : R.dark), plazas: x.plazas, mosaic: x.mosaic, hazard: x.hazard, coast: x.coast,
        spec, build() { if (!this.rows) this.rows = genRows(this); },
      };
      // pièce maîtresse (grand décor) en haut à gauche, avec son parvis relié au carrefour
      if (x.piece) {
        const P = m.piece = { ...x.piece, x: 3, y: 2 };
        P.dw = P.door ? P.door.dw || 1 : 1;
        P.fx = P.x + Math.floor(P.w / 2) - (P.dw === 2 ? 1 : 0);
        m.objects.unshift({ kind: P.kind, v: P.v || 0, x: P.x, y: P.y, w: P.w, h: P.h });
        // grande clairière autour de la pièce maîtresse
        spec.clearings = [...(spec.clearings || []), { x: P.x + P.w / 2, y: P.y + P.h / 2 + 1, rx: P.w / 2 + 4, ry: P.h / 2 + 3.5 }];
        if (P.door) { m.doors.push({ x: P.fx, y: P.y + P.h - 1, w: P.dw, dir: 'up', to: P.door.to, tx: MAPS[P.door.to].entry ? MAPS[P.door.to].entry.x : P.door.tx, ty: MAPS[P.door.to].entry ? MAPS[P.door.to].entry.y : P.door.ty }); MAPS[P.door.to].warps.forEach(wp => { if (wp.to === '?') { wp.to = id; wp.tx = P.fx; wp.ty = P.y + P.h; } }); }
        if (x.pieceSign) m.signs[`${P.fx + P.dw},${P.y + P.h + 1}`] = x.pieceSign;
      }
      addRooms(m, kind, s + i * 7);
      // grand lac partagé : chaque carte en reçoit sa part (l'eau du côté du centre), sans espaces ouverts sous l'eau
      if (R.lake) {
        const Lk = { x: (R.lake.cx - pos[i][0]) * w, y: (R.lake.cy - pos[i][1]) * h, rx: R.lake.r * w, ry: R.lake.r * h, bleed: true };   // (bleed : pas recopié chez les voisins, ils ont déjà le leur)
        const inLake = (x, y, k = 1.12) => Math.hypot((x - Lk.x) / Lk.rx, (y - Lk.y) / Lk.ry) < k;
        if (Math.hypot(Math.max(0, Math.abs(Lk.x - w / 2) - w / 2) / Lk.rx, Math.max(0, Math.abs(Lk.y - h / 2) - h / 2) / Lk.ry) < 1) {
          // le carrefour s'écarte de l'eau (vers l'extérieur de l'anneau) tant qu'il est dans le lac
          if (!x.sandWalk) for (let t = 0; t < 40 && inLake(spec.hub[0], spec.hub[1], 1.25); t++) { const dx = spec.hub[0] - Lk.x, dy = spec.hub[1] - Lk.y, d = Math.hypot(dx, dy) || 1; spec.hub = [Math.round(DW.clamp(spec.hub[0] + dx / d * 1.5, 8, w - 9)), Math.round(DW.clamp(spec.hub[1] + dy / d * 1.5, 7, h - 8))]; }
          spec.lakes = [...(spec.lakes || []), Lk];
          spec.rooms = (spec.rooms || []).filter(Rm => !inLake(Rm.x, Rm.y, 1.3));
          spec.clearings = (spec.clearings || []).filter(c => !inLake(c.x, c.y));
        }
      }
    });
    linkWater(ids, sides);
    // le village de la région : première sous-zone dégagée (place, sentier, bosquet)
    const hi = R.subs.findIndex(([, kind], i) => i >= 1 && i !== 7 && ['plaza', 'trail', 'grove'].includes(kind));
    MAPS[ids[hi >= 0 ? hi : 2]].hamlet = true;
  }

  // ------------------------------------------------------------ petits villages (un par région, sous-zone 2)
  // 3 maisons du style local, un marchand (bases + spécialité de la région), une auberge (repos), un promeneur
  const HAMLET = {
    montagne: ['Hameau des Gotsumon', 'gotsumon', 'chalet', ['steak', 'super_viande']],
    lac: ['Village des Gomamon', 'gomamon', 'cottage', ['digianchois', 'digivivaneau', 'digitruite']],
    brumes: ['Hameau des Brumes', 'patamon', 'cottage', ['pomme_bleue', 'baie_rouge']],
    marais: ['Village sur pilotis', 'gekomon', 'bogshack', ['digichampi', 'viande_moisie', 'champi_joie']],
    savane: ['Campement de la Savane', 'elecmon', 'cottage', ['steak', 'super_carotte']],
    volcan: ['Forge du Volcan', 'agumon', 'chalet', ['steak', 'disque_atk']],
    usine: ['Cité ouvrière', 'tentomon', 'cottage', ['disque_pm', 'pm_m', 'disque_def']],
    decharge: ['Village des Numemon', 'numemon', 'bogshack', ['viande_moisie', 'gland_or']],
    tunnel: ['Halte des Mineurs', 'gotsumon', 'chalet', ['digichampi', 'pm_m']],
    jouets: ['Village des Jouets', 'patamon', 'cottage', ['cartes', 'pomme_bleue']],
    canyon: ['Campement du Canyon', 'monochromon', 'chalet', ['steak', 'disque_def']],
    scarabees: ['Village des Scarabées', 'tentomon', 'cottage', ['super_carotte', 'radis']],
    dino: ['Village des Agumon', 'agumon', 'chalet', ['surlonge', 'steak']],
    jungle: ['Village de la Jungle', 'palmon', 'bogshack', ['orange_bana', 'noix_douce', 'figue']],
    gel: ['Hameau des Neiges', 'penguinmon', 'chalet', ['champi_glace', 'digitruite']],
    overdell: ['Hameau des Ombres', 'bakemon', 'cottage', ['reveil', 'viande_moisie']],
    miharashi: ['Village des Yokomon', 'yokomon', 'yokohut', ['digichampi', 'super_viande']],
  };
  function placeHamlet(g, m, hub, occ) {
    const H = HAMLET[m.region]; if (!H) return;
    const [title, folk, kind, special] = H, GROUND = '.,f=vs', ok = (x, y) => GROUND.includes(g.get(x, y) || '#') && !occ.has(x + ',' + y);
    const spots = [];
    for (let r = 5; r < 20 && spots.length < 3; r++) for (let dy = -r; dy <= r && spots.length < 3; dy++) for (let dx = -r; dx <= r && spots.length < 3; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = hub[0] + dx, y = hub[1] + dy;
      if (spots.some(([a, b]) => Math.abs(a - x) < 7 && Math.abs(b - y) < 6)) continue;
      let fit = true;
      for (let yy = y - 1; yy <= y + 4 && fit; yy++) for (let xx = x - 1; xx <= x + 4 && fit; xx++) if (!ok(xx, yy)) fit = false;
      if (fit) spots.push([x, y]);
    }
    if (!spots.length) return;
    const name = DW.SPECIES[folk].name;
    const shop = ['viande', 'soin_p', 'disque_pm', 'remede', 'bandage', 'super_viande', ...special].filter(id => DW.ITEMS[id]);
    spots.forEach(([x, y], i) => {
      for (let yy = y; yy < y + 3; yy++) for (let xx = x; xx < x + 4; xx++) { g.set(xx, yy, '.'); occ.add(xx + ',' + yy); }
      for (let xx = x; xx < x + 4; xx++) if (g.get(xx, y + 3) !== '=') g.set(xx, y + 3, '=');   // parvis
      m.objects.push({ kind, v: i % 2, x, y, w: 4, h: 3 });
      const nx = x + 1 + (i % 2), ny = y + 4;
      if (i === 0) m.npcs.push({ sp: folk, x: nx, y: ny, face: 'down', hamlet: true, talk: async () => {
        await DW.say(`Bienvenue au ${title} ! Un petit quelque chose pour la route ?`, name);
        await DW.Game.push(new DW.ShopScene(shop));
      } });
      else if (i === 1) m.npcs.push({ sp: folk, x: nx, y: ny, face: 'down', hamlet: true, talk: async () => {
        const st = DW.state;
        const r = await DW.ask(`L'auberge du ${title} ! Une bonne nuit de repos pour toute l'équipe : 100 Bits.`, ['Se reposer', 'Non merci'], name);
        if (r !== 0) return;
        if (st.bits < 100) { await DW.say("Tu n'as pas assez de Bits...", name); return; }
        st.bits -= 100; st.heal = { map: DW.ow.mapId, x: nx, y: ny + 1 };
        // (on ne dort qu'à l'heure du coucher du partenaire ; sinon une heure de repos, sans sauter une journée)
        const lead = DW.Care.lead();
        if (!lead || DW.Life.sleepy(lead)) { await DW.Life.sleep(false); st.party.forEach(p => p.heal()); await DW.say('Bonjour ! Ton équipe est en pleine forme.', name); }
        else { await DW.fade(1, 0.4); DW.Care.rest(60, true); st.party.forEach(p => { p.heal(); p.tired = Math.max(0, (p.tired || 0) - 30); }); await DW.wait(0.4); await DW.fade(0, 0.4); await DW.say(`${lead.name} n'a pas sommeil : une heure de repos dans un bon lit. Toute l'équipe est soignée !`, name); }
      } });
      else m.npcs.push({ sp: folk, x: nx, y: ny, face: 'left', wander: 2, hamlet: true, talk: () => DW.say(DW.pick([
        `Bienvenue au ${title} ! Ici, on vit tranquille... sauf quand les Digimon sauvages s'énervent.`,
        "On raconte que les habitants de la Ville des Fichiers ont toujours besoin d'aide. Va les voir !",
        "Les toilettes sont juste à côté. Pense à ton partenaire !",
      ]), name) });
    });
    const [sx, sy] = spots[0];
    if (GROUND.includes(g.get(sx - 2, sy + 3) || '#')) { g.set(sx - 2, sy + 3, 'S'); m.signs[`${sx - 2},${sy + 3}`] = `${title} — Marchand, auberge et toilettes. Les voyageurs sont les bienvenus !`; }
    m.hamletName = title;
  }

  // ------------------------------------------------------------ toilettes : une jolie cabane près du carrefour
  // emprise 3 × 2 libre (avec une case de marge et la case devant la porte libre), la plus proche du carrefour
  function placeToilet(g, m, hub, occ) {
    const npcAt = (x, y) => (m.npcs || []).some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1);
    const GROUND = '.,f=vs', ok = (x, y) => GROUND.includes(g.get(x, y) || '#') && !occ.has(x + ',' + y) && !npcAt(x, y);
    let best = null;
    for (let r = 4; r < 16 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r && !best; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = hub[0] + dx, y = hub[1] + dy;
      let fit = true;
      for (let yy = y - 1; yy <= y + 3 && fit; yy++) for (let xx = x - 1; xx <= x + 3 && fit; xx++) if (!ok(xx, yy)) fit = false;
      if (fit && !(m.signs && Object.keys(m.signs).some(k => { const [sx, sy] = k.split(',').map(Number); return sx >= x - 1 && sx <= x + 3 && sy >= y - 1 && sy <= y + 3; }))) best = [x, y];
    }
    if (!best) return;
    const [x, y] = best;
    for (let yy = y; yy < y + 2; yy++) for (let xx = x; xx < x + 3; xx++) { g.set(xx, yy, '.'); occ.add(xx + ',' + yy); }
    m.objects.push({ kind: 'wcabin', v: m.idx % 8 === 0 ? 0 : 1, x, y, w: 3, h: 2 });
    for (let k = 0; k < 3; k++) m.signs[`${x + k},${y + 1}`] = () => DW.Care.toilet();
  }

  // ------------------------------------------------------------ continuité entre sous-zones voisines
  // un lac qui touche un bord se prolonge (coupé) dans la sous-zone d'à côté ; une rivière qui sort
  // par un bord y entre et va se jeter dans un petit étang. Les chemins qui la croisent deviennent des ponts.
  function linkWater(ids, sides) {
    const MARGIN = 6, add = (m, key, v) => { m.spec[key] = [...(m.spec[key] || []), v]; };
    ids.forEach((id, i) => {
      const A = MAPS[id];
      for (const side in sides[i]) {
        const nid = sides[i][side];
        if (!nid || nid === 'ext' || !MAPS[nid] || !MAPS[nid].spec) continue;
        const B = MAPS[nid];
        // même point, vu depuis B (position proportionnelle le long du bord commun)
        const to = (x, y) => side === 'right' ? [x - A.w, y * B.h / A.h] : side === 'left' ? [B.w + x, y * B.h / A.h]
          : side === 'down' ? [x * B.w / A.w, y - A.h] : [x * B.w / A.w, B.h + y];
        const inward = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }[side];
        for (const L of (A.spec.lakes || []).filter(l => !l.bleed)) {
          const gap = side === 'right' ? A.w - (L.x + L.rx) : side === 'left' ? L.x - L.rx : side === 'down' ? A.h - (L.y + L.ry) : L.y - L.ry;
          if (gap > MARGIN) continue;
          const [x, y] = to(L.x, L.y);
          add(B, 'lakes', { x, y, rx: L.rx, ry: L.ry, bleed: true });
        }
        for (const Rv of (A.spec.rivers || []).filter(r => !r.bleed)) {
          for (const p of [Rv.pts[0], Rv.pts[Rv.pts.length - 1]]) {
            const onEdge = side === 'right' ? p[0] >= A.w - 1 : side === 'left' ? p[0] <= 0 : side === 'down' ? p[1] >= A.h - 1 : p[1] <= 0;
            if (!onEdge) continue;
            const [x, y] = to(p[0], p[1]), j = (Hh(x | 0, y | 0, 917) - 0.5) * 10, perp = [inward[1], inward[0]];
            const e1 = [x + inward[0] * 10 + perp[0] * j * 0.5, y + inward[1] * 10 + perp[1] * j * 0.5];
            const e2 = [x + inward[0] * 18 + perp[0] * j, y + inward[1] * 18 + perp[1] * j];
            add(B, 'rivers', { pts: [[x - inward[0] * 2, y - inward[1] * 2], e1, e2], r: Rv.r, bleed: true });
            add(B, 'lakes', { x: e2[0], y: e2[1], rx: 4 + Rv.r, ry: 3 + Rv.r * 0.7, bleed: true });
          }
        }
      }
    });
  }

  // ------------------------------------------------------------ espaces ouverts (« zones exploitables »)
  // Comme dans Digimon World 1 / 2003 : en plus du carrefour, chaque sous-zone a 4 ou 5 grands espaces
  // reliés par un chemin, chacun avec son ambiance : étang (berges et nénuphars), prairie d'herbes hautes
  // (là où se cachent les Digimon sauvages) ou bosquet calme (fleurs, repères de la région).
  // Placés loin du carrefour, des sorties et de la pièce maîtresse, et espacés entre eux.
  function addRooms(m, kind, seed) {
    const o = m.spec, { w, h } = m, hub = o.hub, r = k => Hh(seed, k, 613);
    const avoid = [[hub[0], hub[1], 17]], lanes = [];
    for (const side in m.exits) {
      const [pos, len] = m.exits[side], c = pos + len / 2, inn = { left: [2, c], right: [w - 3, c], up: [c, 2], down: [c, h - 3] }[side];
      avoid.push([...inn, 10]); lanes.push([inn, hub]);
    }
    // distance d'une case au trajet sortie → carrefour (les espaces ne se posent pas dessus)
    const segD = (x, y, [a, b]) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
      let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
    };
    for (const L of o.lakes || []) avoid.push([L.x, L.y, Math.max(L.rx, L.ry) + 4]);
    const P = m.piece, inPiece = (x, y) => P && x < P.x + P.w + 7 && y < P.y + P.h + 6;
    const cand = [];
    for (let y = 10; y <= h - 11; y += 2) for (let x = 11; x <= w - 12; x += 2) {
      if (inPiece(x, y) || avoid.some(([ax, ay, d]) => Math.hypot(x - ax, y - ay) < d) || lanes.some(L => segD(x, y, L) < 11)) continue;
      cand.push([Hh(x, y, seed), x, y]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const n = 4 + (r(1) < 0.4 ? 1 : 0), rooms = [];
    for (const [, x, y] of cand) {
      if (rooms.length >= n) break;
      if (rooms.some(R => Math.hypot(R.x - x, R.y - y) < 22)) continue;
      rooms.push({ x, y });
    }
    const KINDS = kind === 'cave' ? ['pond', 'meadow', 'grove'] : ['meadow', 'pond', 'grove', 'meadow'];
    o.rooms = rooms.map((R, j) => {
      const rx = 11 + r(10 + j) * 5, ry = rx * 0.74, type = KINDS[(j + Math.floor(r(2) * 4)) % KINDS.length];
      const dx = hub[0] - R.x, dy = hub[1] - R.y, d = Math.hypot(dx, dy) || 1;
      // entrée de l'espace : sur son bord, du côté du carrefour
      const door = [Math.round(R.x + dx / d * rx * 0.55), Math.round(R.y + dy / d * ry * 0.55)];
      return { ...R, rx, ry, type, door };
    });
    o.clearings = [...(o.clearings || []), ...o.rooms.map(R => ({ x: R.x, y: R.y, rx: R.rx, ry: R.ry }))];
    for (const R of o.rooms) {
      const dx = R.x - hub[0], dy = R.y - hub[1], d = Math.hypot(dx, dy) || 1;
      // étang décalé vers le fond de l'espace (le chemin arrive par l'autre côté)
      if (R.type === 'pond') o.lakes = [...(o.lakes || []), { x: R.x + dx / d * R.rx * 0.25, y: R.y + dy / d * R.ry * 0.25, rx: R.rx * 0.48, ry: R.ry * 0.5 }];
      if (R.type === 'meadow') o.tall = [...(o.tall || []), { x: R.x, y: R.y, r: Math.min(R.rx, R.ry) * 0.8 }];
    }
    o.lmMul = (o.lmMul || 1) * 1.4;   // plus de place : un peu plus de repères
  }

  // ------------------------------------------------------------ intérieurs (reliés à leur sous-zone par region())
  // (les intérieurs de l'usine et du manoir sont désormais des bâtiments à plusieurs pièces : maps/palais.js)

  // ============================================================ LES 16 RÉGIONS
  region('montagne', { name: "Montagne de l'Infini", theme: 'mountain', entry: 'left', out: [[3, 'right'], [8, 'down']], lm: [['â', 2], ['à', 2], ['Ó', 3]], subs: [
    ["Pont de l'Infini", 'bridge'],
    ["Contreforts de l'Infini", 'trail'],
    ['Col des Vents', 'maze', { lm: [['Ā', 4]] }],
    ["Lac d'Altitude", 'lake', { lm: [['Ā', 2]] }],
    ["Grotte de l'Infini", 'cave', { theme: 'cave', lm: [['é', 6], ['ê', 5]], noRegionLm: true }],
    ['Galeries de Cristal', 'cave', { theme: 'cave', lm: [['é', 12]], noRegionLm: true }],
    ['Gorge du Torrent', 'river'],
    ['Alpages Suspendus', 'set', { piece: { kind: 'chalet', w: 4, h: 3 }, lm: [['Ā', 2]], pieceSign: "Un chalet de montagne. La cheminée fume encore... quelqu'un vit ici ?" }],
    ['Plateau des Engrenages Noirs', 'grove', { theme: 'summit', lm: [['ã', 4]] }],
    ["Sommet de l'Infini", 'plaza', { theme: 'summit', lm: [['ã', 2], ['å', 4]], noRegionLm: true, post: g => { const x = g.w >> 1, y = (g.h >> 1) - 4; g.set(x, y, '<'); g.set(x - 3, y + 2, '>'); g.set(x + 3, y + 2, '>'); } }],
  ] });
  region('volcan', { name: 'Mont Panorama', theme: 'volcano', entry: 'up', climate: 'volcano', lm: [['ë', 3], ['ì', 3]], subs: [
    ['Pied du Mont Panorama', 'trail'], ['Champs de Cendres', 'plaza'], ['Coulée de Lave', 'river'], ['Forêt Calcinée', 'grove'],
    ['Fumerolles', 'islands', { lm: [['ì', 5]] }], ['Orgues de Basalte', 'grove', { lm: [['ā', 6]] }], ['Lac de Magma', 'bigLake'],
    ['Belvédère du Panorama', 'set', { piece: { kind: 'telescope', w: 2, h: 2 }, lm: [['ā', 3]], pieceSign: "Une longue-vue. On aperçoit toute l'Île des Fichiers... et une fumée noire au loin." }],
    ['Grotte Ardente', 'cave', { theme: 'lavacave', lm: [['ë', 6], ['ê', 4]], noRegionLm: true, dark: { d: 0.5, col: '#5a2010' } }],
    ['Cratère de Meramon', 'set', { piece: { kind: 'smallvolcano', w: 3, h: 2 }, opts: { lakes: [{ x: 28, y: 18, rx: 7, ry: 5 }] } }],
  ] });
  region('savane', { name: 'Savane des Engrenages', theme: 'savanna', entry: 'left', climate: 'beach', out: [[1, 'up'], [4, 'right'], [5, 'down']], lm: [['ä', 2], ['Ñ', 2]], subs: [
    ['Porte de la Savane', 'trail'], ['Plaines Dorées', 'plaza'], ["Point d'Eau", 'lake'], ["Cimetière d'Engrenages", 'grove', { lm: [['Ñ', 4]] }],
    ['Termitières Géantes', 'grove', { lm: [['ä', 4]] }], ['Baobabs Millénaires', 'grove', { lm: [['ď', 4]] }], ['Gué des Rouages', 'river'],
    ['Collines Rousses', 'maze'], ["Champ d'Éoliennes", 'plaza', { lm: [['Ă', 5]] }],
    ['Rocher du Lion', 'set', { piece: { kind: 'lionrock', w: 5, h: 4 }, pieceSign: "Le Rocher du Lion. On raconte qu'un Digimon au cœur de lion y veille sur la savane." }],
  ] });
  region('usine', { name: 'Ville-Usine', theme: 'factory', entry: 'down', lm: [['í', 2], ['ð', 3], ['î', 1]], subs: [
    ['Faubourg Industriel', 'trail'], ['Quai des Wagons', 'plaza', { objects: [{ kind: 'conveyor', x: 8, y: 20, w: 3, h: 1 }, { kind: 'conveyor', x: 26, y: 20, w: 3, h: 1 }] }],
    ['Rue des Cheminées', 'grove', { lm: [['î', 4]] }], ['Parc des Citernes', 'grove', { lm: [['í', 4]] }], ['Dépôt de Batteries', 'grove', { lm: [['ï', 4]] }],
    ["Égouts de l'Usine", 'cave', { theme: 'sewer', lm: [['ð', 4]], noRegionLm: true, dark: { d: 0.5, col: '#2a3a30' }, opts: { rivers: [{ pts: [[-1, 12], [20, 14], [44, 12]], r: 1.4 }] } }],
    ['Atelier des Robots', 'plaza', { lm: [['ă', 5]] }], ['Grues du Port', 'set', { piece: { kind: 'crane', w: 3, h: 2 }, lm: [['ð', 3]] }],
    ['Salle des Machines', 'plaza', { lm: [['ï', 2], ['ă', 3]] }],
    ["Cœur de l'Usine", 'set', { piece: { kind: 'factory', w: 7, h: 5, door: { to: 'usine_hall', tx: 14, ty: 18, dw: 1 } }, pieceSign: "L'USINE — Elle fabrique et démonte des machines jour et nuit. Personne ne sait plus qui l'a mise en marche." }],
  ] });
  region('decharge', { name: "Montagne d'Ordures", theme: 'trash', entry: 'left', lm: [['Ò', 2], ['ð', 3]], subs: [
    ['Entrée de la Décharge', 'trail'], ['Vallée des Pneus', 'grove', { lm: [['Ą', 5]] }], ['Cimetière de Voitures', 'grove', { lm: [['ą', 5]] }],
    ['Collines de Ferraille', 'maze'], ['Mare Huileuse', 'lake', { theme: 'sewer' }], ['Tours de Télévisions', 'grove', { lm: [['Ć', 5]] }],
    ["Labyrinthe d'Ordures", 'maze', { lm: [['Ò', 3]] }], ['Cratère des Débris', 'bigLake', { theme: 'sewer' }], ['Royaume de la Poussière', 'plaza'],
    ['Sommet des Ordures', 'set', { piece: { kind: 'junkthrone', w: 4, h: 3 }, pieceSign: "Un trône fait de déchets... Le roi de la décharge doit être quelque part par ici." }],
  ] });
  region('canyon', { name: 'Grand Canyon', theme: 'canyon', entry: 'up', climate: 'beach', out: [[7, 'left'], [8, 'down']], lm: [['â', 3], ['ó', 3]], subs: [
    ['Bord du Canyon', 'trail'], ['Plateau Rouge', 'plaza'], ['Gorges Étroites', 'maze'],
    ['Ascenseurs du Canyon', 'set', { piece: { kind: 'elevator', w: 3, h: 2 }, pieceSign: "Les ascenseurs du canyon. Ils permettent de monter et descendre... quand ils marchent." }],
    ['Arche de Pierre', 'set', { piece: { kind: 'archrock', w: 5, h: 3 } }], ['Vallée des Cactus', 'grove', { lm: [['ó', 5]] }],
    ['Oasis Cachée', 'lake', { theme: 'savanna' }], ['Mesas Jumelles', 'grove', { lm: [['â', 5]] }], ['Ravin des Crânes', 'maze', { lm: [['ô', 3]] }],
    ["Forteresse d'Ogremon", 'set', { piece: { kind: 'ogregate', w: 4, h: 4 }, objects: [{ kind: 'watchtower', x: 10, y: 3, w: 2, h: 2 }], lm: [['ò', 6]], pieceSign: "« FORTERESSE D'OGREMON. DÉFENSE D'ENTRER ! » — C'est écrit avec beaucoup de fautes." }],
  ] });
  region('dino', { name: 'Région des Dinosaures', theme: 'dino', entry: 'right', lm: [['Ô', 2], ['õ', 2]], subs: [
    ['Lisière Préhistorique', 'trail'], ['Forêt de Cycas', 'grove', { lm: [['Ô', 4]] }], ['Marais Primitif', 'islands'],
    ['Nid Géant', 'set', { piece: { kind: 'giantnest', w: 4, h: 2 }, pieceSign: "Des œufs immenses... Mieux vaut ne pas croiser la maman." }],
    ['Vallée des Ossements', 'grove', { lm: [['õ', 5]] }], ['Volcan Fumant', 'set', { piece: { kind: 'smallvolcano', w: 3, h: 2 } }],
    ['Prairie des Fougères', 'plaza'], ['Rivière Ambrée', 'river', { lm: [['ö', 4]] }],
    ['Zone Glaciaire', 'grove', { theme: 'snow', lm: [['å', 4], ['õ', 2]], noRegionLm: true }],
    ['Zone du Temps Rapide', 'set', { piece: { kind: 'timeclock', w: 3, h: 2 }, lm: [['ć', 3]], pieceSign: "Une horloge étrange. Ses aiguilles tournent beaucoup trop vite..." }],
  ] });
  region('jungle', { name: 'Jungle Tropicale', theme: 'jungle', entry: 'up', out: [[5, 'down']], lm: [['ø', 1]], subs: [
    ['Orée de la Jungle', 'trail'], ['Sous-bois Moite', 'maze'], ['Rivière aux Lianes', 'river'],
    ['Temple Englouti', 'set', { piece: { kind: 'ruintemple', w: 6, h: 4, door: { to: 'temple_parvis', tx: 14, ty: 18, dw: 2 } }, pieceSign: "Un temple englouti par la végétation. Une lueur verte brille au sommet." }],
    ['Pont Invisible', 'bridge', { dark: { d: 0.25, col: '#2a4a3a' } }], ["Forêt d'Amida", 'maze', { opts: { wiggle: 18 } }],
    ['Cascade Tropicale', 'lake'], ['Mangrove', 'islands', { theme: 'mangrove' }],
    ['Village sur Pilotis', 'set', { theme: 'mangrove', piece: { kind: 'stilthut', w: 3, h: 2 }, objects: [{ kind: 'stilthut', v: 1, x: 30, y: 4, w: 3, h: 2 }], opts: { lakes: [{ x: 24, y: 20, rx: 9, ry: 5 }] } }],
    ['Plage Nue', 'trail', { theme: 'beach', music: 'beach' }],
  ] });
  region('overdell', { name: "Cimetière d'Overdell", theme: 'cemetery', entry: 'up', dark: { d: 0.4, col: '#5a4a8a' }, lm: [['ú', 4], ['û', 1]], subs: [
    ['Lande Grise', 'trail'], ['Allée des Tombes', 'grove', { lm: [['ú', 6]] }], ['Bois Mort', 'maze'], ['Mare Noire', 'lake'],
    ['Champ des Croix', 'grove', { lm: [['ú', 8]] }], ['Crypte Effondrée', 'cave', { theme: 'cave', lm: [['ú', 4], ['ê', 3]], noRegionLm: true, dark: { d: 0.6, col: '#3a2a5a' } }],
    ['Jardin des Citrouilles', 'plaza', { lm: [['û', 8]] }],
    ['Chapelle en Ruine', 'set', { piece: { kind: 'chapel', w: 5, h: 4 }, lm: [['Ď', 3]], pieceSign: "Une chapelle en ruine. Des gargouilles veillent sur l'entrée." }],
    ['Cour du Manoir', 'plaza', { lm: [['Ď', 4], ['ü', 6]] }],
    ['Manoir du Seigneur Gris', 'set', { piece: { kind: 'manor', w: 8, h: 6, door: { to: 'manoir_hall', tx: 14, ty: 18, dw: 2 } }, lm: [['Ď', 2]], pieceSign: "MANOIR DU SEIGNEUR GRIS — Les visiteurs sont priés de ne pas réveiller les morts." }],
  ] });
  region('brumes', { name: 'Bois Brumeux', theme: 'fog', entry: 'down', out: [[4, 'right'], [5, 'up']], lm: [['>', 2], ['|', 2]], subs: [
    ['Lisière Brumeuse', 'trail'], ['Sentier des Lanternes', 'trail', { lm: [['>', 6]] }], ['Étang Fantôme', 'lake'], ['Labyrinthe de Brume', 'maze', { opts: { wiggle: 18 } }],
    ['Clairière Silencieuse', 'plaza'], ['Arbres Pleureurs', 'grove', { lm: [['|', 5]] }], ['Puits Oublié', 'set', { piece: { kind: 'well', w: 2, h: 1 }, pieceSign: "Un vieux puits. On entend des murmures qui remontent du fond..." }],
    ['Pont de Brume', 'bridge'], ['Sanctuaire Voilé', 'set', { piece: { kind: 'mistgate', w: 4, h: 2 }, lm: [['>', 4]] }],
    ['Cœur du Brouillard', 'plaza', { post: g => g.set(g.w >> 1, (g.h >> 1) - 3, '<') }],
  ] });
  region('jouets', { name: 'Ville des Jouets', theme: 'toy', entry: 'left', music: 'village', lm: [['ñ', 1], ['Č', 1]], subs: [
    ['Entrée des Jouets', 'trail'], ['Avenue des Cubes', 'grove', { lm: [['B', 6]] }],
    ['Parc du Manège', 'set', { piece: { kind: 'carousel', w: 5, h: 3 } }],
    ['Gare du Petit Train', 'set', { piece: { kind: 'toytrain', w: 4, h: 1 } }],
    ['Jardin des Nounours', 'grove', { lm: [['Č', 5]] }],
    ['Quartier des Maisons', 'set', { objects: [{ kind: 'toyhouse', v: 0, x: 26, y: 4, w: 3, h: 2 }, { kind: 'toyhouse', v: 2, x: 31, y: 4, w: 3, h: 2 }], piece: { kind: 'toyhouse', v: 1, w: 3, h: 2 } }],
    ['Lac des Canards', 'lake'], ['Labyrinthe de Dominos', 'maze', { lm: [['B', 6]] }], ['Place des Boîtes à Surprise', 'plaza', { lm: [['ñ', 5]] }],
    ['Château de Monzaemon', 'set', { piece: { kind: 'toycastle', w: 7, h: 5, door: { to: 'chateau_hall', tx: 14, ty: 18, dw: 2 } }, pieceSign: "Le château des jouets. « Ici, tout le monde doit sourire ! » dit une pancarte." }],
  ] });
  region('gel', { name: 'Terre Gelée', theme: 'snow', entry: 'down', climate: 'snow', lm: [['å', 2], ['ç', 2]], subs: [
    ['Frontière Gelée', 'trail'], ['Forêt Enneigée', 'grove'], ['Lac Gelé', 'bigLake'], ['Plaine des Bonshommes', 'plaza', { lm: [['æ', 5]] }],
    ['Cascade de Glace', 'set', { piece: { kind: 'frozenfall', w: 4, h: 3 } }],
    ["Village d'Igloos", 'set', { piece: { kind: 'igloo', w: 2, h: 1 }, objects: [{ kind: 'igloo', x: 30, y: 6, w: 2, h: 1 }, { kind: 'igloo', x: 28, y: 20, w: 2, h: 1 }] }],
    ['Crevasses', 'maze'], ['Grotte de la Plage Secrète', 'cave', { theme: 'icecave', lm: [['ç', 8]], noRegionLm: true, dark: { d: 0.4, col: '#3a4a7a' } }],
    ['Champs de Cristaux', 'grove', { lm: [['ç', 6]] }],
    ['Temple de Glace', 'set', { piece: { kind: 'icetemple', w: 6, h: 5 }, lm: [['è', 4]], pieceSign: "TEMPLE DE GLACE — Seuls les Digimon à l'âme pure (Vaccin) peuvent en franchir les portes." }],
  ] });
  // LE GRAND LAC (chapitre 2) : un seul lac qui s'étend sur neuf cartes. On en fait le tour par les rives
  // (anneau de 8 cartes), et l'on n'atteint l'île du tramway, au centre, que par le ponton de la Cascade du Dragon, au nord.
  //     7 — 6 — 5            (6 ↑ 9 : le Phare, sur un cap au bord de l'île)
  //     |   |   |
  //     8   2   4            (2 = Lac du Tramway : l'eau, l'île, le tramway — game/chapitre2.js)
  //     |       |
  //     1 — 0 — 3            (0 ↓ Clairière de l'Arrivée ; 1 ↓ Pays des Scarabées, en attendant le futur village au sud de la Rosière)
  //  10 au nord et 11 à l'ouest du Lac de l'Œil du Dragon (7) : prairies au bord des falaises, la mer en contrebas
  region('lac', { name: 'Lac du Tramway', theme: 'spring', entry: 'down', music: 'beach', out: [[1, 'down']], lm: [['Ð', 3]],
    plan: [[1, 2], [0, 2], [1, 1], [2, 2], [2, 1], [2, 0], [1, 0], [0, 0], [0, 1], [1, -1], [0, -1], [-1, 0]],
    links: [[0, 1], [1, 8], [8, 7], [7, 6], [6, 5], [5, 4], [4, 3], [3, 0], [6, 2], [6, 9], [7, 10], [7, 11], [9, 10]],
    lake: { cx: 1.5, cy: 1.5, r: 1.02 }, subs: [
    // (bord nord-ouest de l'île : plages à l'ouest, côte rocheuse autour du Phare)
    ['Rive Sud', 'trail'], ['Rosière', 'plaza', { lm: [['Ð', 3], ['ŗ', 10]], coast: { left: 'beach' } }],
    ['Lac du Tramway', 'trail', { sandWalk: true }],
    ['Ponton des Pêcheurs', 'trail', { coast: { right: 'cliff' } }], ['Pointe Coela', 'trail', { lm: [['Ð', 3]], coast: { right: 'cliff' } }], ['Îlots aux Nénuphars', 'islands', { coast: { up: 'cliff', right: 'cliff' } }],   // (bord est de l'île : falaises)
    ['Cascade du Dragon', 'trail', { sandWalk: true }], ["Lac de l'Œil du Dragon", 'lake'], ['Pont Numérique', 'trail', { coast: { left: 'beach' } }],   // (terre ferme entre la plage et le lac : plus de rivière ni de pont)
    ['Phare du Lac', 'set', { piece: { kind: 'lighthouse', w: 3, h: 2 }, coast: { up: 'cliff', right: 'cliff' } }],   // (à l'ouest, la Prairie des Falaises)
    ['Prairie des Falaises', 'plaza', { theme: 'meadow', coast: { up: 'cliff', left: 'cliff' } }],
    ['Falaises du Couchant', 'plaza', { theme: 'meadow', coast: { left: 'cliff', up: 'cliff', down: 'cliff' } }],
  ] });
  // ------------------------------------------------------------ CHAPITRE 3 : le pays de Meramon (épisode 4 de la saison 1)
  // À la sortie ouest de la forêt, des déserts hérissés de poteaux télégraphiques et de panneaux routiers ;
  // au centre, le Village des Yokomon (huttes de chaume, fontaine, petit lac où dort une épave) ;
  // puis la route du Mont Miharashi, montagne verte en terrasses où vit Meramon. Bords : plage et falaises.
  //        4 Mont — 3 Route — 1 Village — 0 Désert des Poteaux | Clairière de l'Arrivée
  //                                       |
  //                                       2 Plaine des Panneaux | Sentier des Murmures
  //                                       (au sud : le Bosquet des Pousses)
  // (cartes dessinées à la main : maps/miharashi.js ; relief en terrasses façon Digimon World 2003)
  const MT = () => DW.Mih.MONT;
  // (géographie du pays et peinture de chaque carte : maps/miharashi.js — une seule terre en coordonnées du monde,
  //  les cartes en sont des fenêtres ; la côte, les routes et le relief se raccordent d'elles-mêmes)
  region('miharashi', { name: 'Pays de Meramon', theme: 'desert', entry: 'right', music: 'field', climate: 'beach', ambient: 'beach',
    out: [[0, 'up'], [2, 'right'], [2, 'down']],
    plan: [[3, 0], [2, 0], [3, 1], [1, 0], [0, 0]], links: [[0, 1], [0, 2], [1, 3], [3, 4]],
    subs: [
      ['Désert des Poteaux', 'trail', { w: 100, h: 60, noRegionLm: true, opts: { hub: [50, 30], autoTall: 0.2 }, post: (g, m) => DW.Mih.desert(g, m, 0) }],
      ['Village des Yokomon', 'plaza', { theme: 'yokovillage', w: 112, h: 80, noRegionLm: true, opts: { hub: [56, 40], autoTall: 0.2 },
        objects: [
          { kind: 'stonefountain', v: 0, x: 54, y: 31, w: 5, h: 3 },
          { kind: 'shipwreck', v: 0, x: 25, y: 53, w: 7, h: 4 },
          ...[[40, 18], [50, 17], [62, 17], [72, 19], [30, 26], [82, 26], [30, 44], [44, 50], [66, 50], [78, 44], [90, 50], [22, 20], [92, 19]].map(([x, y], i) => ({ kind: 'yokohut', v: i % 3 === 2 ? 1 : 0, x, y, w: 4, h: 3, hut: i })),
        ],
        signs: { '56,35': "La fontaine du village. Les Yokomon y puisent l'eau qui arrose leurs fleurs." },
        post: (g, m) => DW.Mih.village(g, m) }],
      ['Plaine des Panneaux', 'trail', { w: 90, h: 72, noRegionLm: true, opts: { hub: [52, 36], autoTall: 0.2 }, post: (g, m) => DW.Mih.desert(g, m, 2) }],
      ['Route du Mont Miharashi', 'trail', { theme: 'miharashi', w: 104, h: 72, noRegionLm: true, opts: { hub: [52, 40], autoTall: 0.3 }, post: (g, m) => DW.Mih.route(g, m) }],
      ['Mont Miharashi', 'plaza', { theme: 'miharashi', w: 104, h: 100, noRegionLm: true, opts: { hub: [92, 79], autoTall: 0.2 },
        objects: [{ kind: 'cratere', v: 0, x: DW.Mih.MONT.crater[0], y: DW.Mih.MONT.crater[1], w: 11, h: 6 }],
        post: (g, m) => DW.Mih.mont(g, m) }],
    ] });
  // LE PAYS DE MERAMON DANS LA GRILLE DU MONDE : le Désert des Poteaux a la hauteur de la Clairière (60 cases) et la
  // Plaine des Panneaux celle du Sentier (72) ; leurs passages sont alignés sur ceux de la forêt, de la Rosière et entre
  // eux : les boucles Clairière–Sentier–Plaine–Désert et Rive Sud–Rosière–Désert–Clairière se referment exactement.
  { const D = MAPS.miharashi0, P = MAPS.miharashi2, L0 = MAPS.lac0, L1 = MAPS.lac1;
    D.exits.right = [28, 6];                        // = passage ouest de la Clairière (plan agrandi : 14 × 2)
    P.exits.right = [22, 6];                        // = passage ouest du Sentier (11 × 2)
    D.exits.down = [46, 6]; P.exits.up = [46, 6];   // (même abscisse : la Plaine est 10 cases moins large, comme le Sentier est décalé de 10)
    P.exits.down = [48, 6];                         // = passage nord du Bosquet des Pousses (19 × 2, le Bosquet étant 10 cases plus à l'est)
    // la Rosière au-dessus du désert : sa place se déduit de la Rive Sud, elle-même au-dessus de la Clairière (passage à 16 × 2)
    const l1x = (32 - L0.exits.down[0]) - L1.w;
    D.exits.up = [DW.clamp(l1x + L1.exits.down[0] + D.w, 8, D.w - 14), 6]; }
  // (le Mont : on arrive de la route par l'est, au pied de la montagne, devant le premier escalier)
  MAPS.miharashi4.exits.right = [77, 6];
  MAPS.miharashi1.calm = true;   // pas de Digimon sauvages dans le village

  region('scarabees', { name: 'Pays des Scarabées', theme: 'beetle', entry: 'up', lm: [['ý', 2], ['þ', 1]], subs: [
    ['Bois Ancien', 'trail'], ['Souches Géantes', 'grove', { lm: [['ý', 5]] }], ['Ruches Sauvages', 'grove', { lm: [['þ', 5]] }],
    ['Sentier des Lucanes', 'maze'], ['Clairière Dorée', 'plaza'], ['Mare aux Libellules', 'lake'],
    ['Forêt de Champignons', 'grove', { lm: [['}', 6]] }], ['Statues des Scarabées', 'grove', { lm: [['ÿ', 4]] }],
    ['Arbre-Monde', 'set', { piece: { kind: 'worldtree', w: 8, h: 5 }, pieceSign: "L'Arbre-Monde. Ses racines plongeraient jusqu'au cœur des données de l'île." }],
    ['Colisée des Scarabées', 'set', { piece: { kind: 'colosseum', w: 8, h: 4 }, pieceSign: "Le Colisée des Scarabées. Un grand tournoi s'y tient chaque année." }],
  ] });
  region('marais', { name: 'Marais des Geko', theme: 'swamp', entry: 'right', lm: [['Ð', 3], ['ù', 1]], subs: [
    ['Bord du Marais', 'trail'], ['Tourbières', 'islands'], ['Forêt Engloutie', 'grove'], ['Roseaux Chantants', 'grove', { lm: [['Ð', 8]] }],
    ['Mare aux Grenouilles', 'lake', { lm: [['ù', 3]] }], ['Labyrinthe de Vase', 'maze'],
    ['Cabanes du Marais', 'set', { piece: { kind: 'bogshack', w: 4, h: 3 }, objects: [{ kind: 'bogshack', v: 1, x: 30, y: 5, w: 4, h: 2 }] }],
    ['Pont Moussu', 'bridge'], ['Jardin du Palais', 'plaza', { lm: [['>', 6]] }],
    ['Palais Geko', 'set', { piece: { kind: 'gekopalace', w: 8, h: 6 }, lm: [['>', 2]], pieceSign: "Le Palais Geko. Le souverain du marais y vit, entouré de ses musiciens." }],
  ] });
  region('tunnel', { name: 'Tunnel Foreur', theme: 'cave', entry: 'up', dark: { d: 0.45, col: '#40302a' }, lm: [['ê', 2], ['é', 1]], subs: [
    ['Entrée du Tunnel', 'cave'], ['Galerie des Foreuses', 'set', { piece: { kind: 'drill', w: 4, h: 2 } }],
    ['Rails Abandonnés', 'cave', { lm: [['č', 5]] }], ['Lac Souterrain', 'bigLake'],
    ['Grotte aux Champignons', 'cave', { lm: [['G', 8]] }], ['Veines de Cristal', 'cave', { lm: [['é', 8]] }],
    ['Grotte Ancestrale de Leomon', 'set', { piece: { kind: 'leomonstone', w: 4, h: 3 }, pieceSign: "Une tête de lion sculptée dans la roche. Les anciens Digimon venaient s'y recueillir." }],
    ['Bassin de Lave', 'bigLake', { theme: 'lavacave', dark: { d: 0.5, col: '#5a2010' } }],
    ['Rivière de Feu', 'river', { theme: 'lavacave', dark: { d: 0.5, col: '#5a2010' } }],
    ['Grotte de Lave', 'cave', { theme: 'lavacave', lm: [['ë', 8]], noRegionLm: true, dark: { d: 0.5, col: '#5a2010' } }],
  ] });
  // le tunnel est entièrement souterrain
  for (const id in MAPS) { const m = MAPS[id]; if (m.region === 'tunnel' && m.spec) { m.indoor = true; if (!m.dark) m.dark = { d: 0.6, col: '#40302a' }; } }

  // ============================================================ LIAISONS ENTRE RÉGIONS ET AVEC LES CARTES EXISTANTES
  const R = n => ENTRY[n];
  LINKS.push(
    ['village', 'right', R('montagne')], ['montagne3', 'right', R('savane')], ['montagne8', 'down', R('volcan')],
    ['savane1', 'up', R('usine')], ['savane4', 'right', R('decharge')], ['savane5', 'down', R('canyon')],
    ['canyon7', 'left', R('dino')], ['canyon8', 'down', R('jungle')], ['jungle5', 'down', R('overdell')],
    ['berceau', 'up', R('brumes')], ['brumes4', 'right', R('jouets')], ['brumes5', 'up', R('gel')],
    ['clairiere', 'up', R('lac')], ['clairiere', 'left', 'miharashi0'], ['lac1', 'down', 'miharashi0'], ['sentier', 'left', 'miharashi2'], ['bosquet', 'up', 'miharashi2'], ['champs', 'left', R('marais')], ['champs', 'down', R('tunnel')],
  );
  // portes des régions (comme dans Digimon World 1 : les recrues ouvrent le monde, la ville qui grandit aussi)
  const T = () => DW.Town, LV = n => T().LEVELS[n];
  const byLevel = (n, what) => ({ cond: () => T().level() >= n, lock: () => `Une barrière de données bloque ${what}. Elle se dissipera quand la Ville des Fichiers sera devenue « ${LV(n)} » (${T().STEPS[n]} % de développement ; actuellement ${T().progress()} %).` });
  const GATE = {
    montagne: { cond: () => T().has('gotsumon'), lock: "Un éboulis bloque le Pont de l'Infini... Un Digimon solide comme un roc pourrait le déblayer. (Recrute Gotsumon)" },
    lac: { cond: () => T().has('betamon') || (DW.state.flags.chapter || 1) >= 2, lock: "Le sentier du nord est inondé... Un Digimon amphibie saurait ouvrir un passage. (Recrute Betamon)" },
    brumes: { cond: () => T().has('elecmon'), lock: "Le Bois Brumeux est plongé dans le noir total... Il faudrait quelqu'un pour rallumer les lanternes. (Recrute Elecmon)" },
    marais: { cond: () => T().has('palmon'), lock: "Des ronces géantes bloquent le chemin de l'ouest... Un Digimon plante pourrait les écarter. (Recrute Palmon)" },
    tunnel: { cond: () => T().level() >= 5, lock: () => `Une grille rouillée ferme le tunnel. Jijimon en a la clé : il te la confiera quand la ville sera devenue « ${LV(5)} ».` },
    savane: byLevel(3, 'la route de la savane'), volcan: byLevel(4, 'le sentier du Mont Panorama'),
    usine: byLevel(5, "l'entrée de la Ville-Usine"), decharge: byLevel(5, "le chemin de la décharge"), jouets: byLevel(6, 'la Ville des Jouets'),
    canyon: byLevel(6, 'la descente vers le canyon'), scarabees: byLevel(6, 'le Pays des Scarabées'), dino: byLevel(7, 'la Région des Dinosaures'),
    jungle: byLevel(7, 'la jungle'), gel: byLevel(7, 'la Terre Gelée'), overdell: byLevel(8, "le Cimetière d'Overdell"),
  };

  // sorties ajoutées aux cartes existantes (cases ouvertes dans leurs fichiers)
  // (plan d'origine des cartes agrandies ×2 : voir MapKit.ZOOM)
  const EXTRA0 = { village: { right: [13, 3] }, berceau: { up: [23, 3] }, clairiere: { up: [16, 3], left: [14, 3] }, sentier: { left: [11, 3] }, bosquet: { up: [19, 3] }, champs: { left: [19, 3], down: [20, 3] } };
  const EXTRA = {}, DIM = {};
  for (const id in EXTRA0) { const [Z] = DW.MapKit.ZOOM[id]; EXTRA[id] = {}; for (const k in EXTRA0[id]) { const [p, l] = EXTRA0[id][k]; EXTRA[id][k] = [p * Z, l * Z]; } }
  for (const id of ['village', 'champs']) { const [Z, w, h] = DW.MapKit.ZOOM[id]; DIM[id] = [w * Z, h * Z]; }
  const dims = id => DIM[id] || (MAPS[id].spec ? [MAPS[id].w, MAPS[id].h] : [DW.getMap(id).w, DW.getMap(id).h]);
  const exitOf = (id, side) => (EXTRA[id] && EXTRA[id][side]) || MAPS[id].exits[side];
  for (const [a, sa, b] of LINKS) {
    const sb = OPP[sa], [wa, ha] = dims(a), [wb, hb] = dims(b);
    const [pa, la] = exitOf(a, sa), [pb, lb] = exitOf(b, sb), len = Math.min(la, lb);
    const mk = (side, p, w, h, to, tp, tw, th) => {
      if (side === 'left') return { x: 0, y: p, w: 1, h: len, dir: 'left', to, tx: tw - 1, ty: tp, _zt: true };
      if (side === 'right') return { x: w - 1, y: p, w: 1, h: len, dir: 'right', to, tx: 0, ty: tp, _zt: true };
      if (side === 'up') return { x: p, y: 0, w: len, h: 1, dir: 'up', to, tx: tp, ty: th - 1, _zt: true };
      return { x: p, y: h - 1, w: len, h: 1, dir: 'down', to, tx: tp, ty: 0, _zt: true };
    };
    const wa1 = mk(sa, pa, wa, ha, b, pb, wb, hb), rb = MAPS[b].region, ra = MAPS[a].region;
    // entrée d'une région depuis l'extérieur : porte éventuelle
    if (rb !== ra && GATE[rb] && ENTRY[rb] === b) Object.assign(wa1, GATE[rb]);
    MAPS[a].warps.push(wa1);
    MAPS[b].warps.push(mk(sb, pb, wb, hb, a, pa, wa, ha));
  }
  DW.REGION_ENTRY = ENTRY;
})();
