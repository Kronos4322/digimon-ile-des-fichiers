'use strict';
// =====================================================================
//  RELIEF EN NIVEAUX (montagnes façon Digimon World 2003)
//  Trois couches séparées :
//   1) ALTITUDE (map.alt, un niveau entier par case) : la vérité géographique. Elle vient d'une fonction du MONDE
//      (coordonnées mondiales, déterministe) partagée par les cartes voisines d'un même massif : le relief se
//      poursuit d'une carte à l'autre, aux mêmes niveaux, quel que soit l'ordre de chargement.
//   2) COLLISION (les cases de la carte) : dérivée de l'altitude. Une baisse de niveau vers le SUD devient une paroi
//      rocheuse de 3 cases par niveau (vue de 3/4, comme dans les RPG japonais) ; vers le nord, l'est ou l'ouest, un
//      rebord de roche d'une case. On ne passe d'un niveau à l'autre que par un ESCALIER taillé dans la paroi.
//   3) RENDU : paroi « Ŵ » peinte par gfx/terrain.js (strates, fissures, rebord herbeux, pied dans l'ombre, ombre
//      portée), escaliers « ^ », chemins qui serpentent d'un escalier à l'autre.
//  Le héros a une altitude logique (ow.p.alt), mise à jour à chaque pas ; les escaliers sont des cases de passage.
//  Vue de développement (désactivée pour le joueur) : ?debug=geo dans l'adresse, puis la touche G.
// =====================================================================
(function () {
  const Hh = DW.Art.hash, fbm = DW.Art.fbm;
  const ROCK = 'Ŵ', STAIR = '^', WALL0 = 3, PASS = 255;

  // ------------------------------------------------------------ massifs : fonctions d'altitude en coordonnées du monde
  // (chaque carte d'un massif a un décalage mondial [ox, oy], calculé en alignant les passages entre voisines)
  const MASSIFS = {
    // Mont Miharashi : un cône en terrasses (sommet au cratère de Meramon) et un contrefort qui file vers l'est,
    // sur la Route du Mont, en crête rocheuse au nord de la route. Le couloir de la route reste au pied (niveau 0).
    miharashi: {
      maps: { miharashi4: [0, 0], miharashi3: null },
      level(X, Y) {
        const cone = 1 - Math.hypot((X - 56) / 42, (Y - 50) / 34);
        const ridgeY = 64 + Math.sin(X * 0.05) * 4, spur = (0.5 - Math.abs(Y - ridgeY) / 15) * DW.clamp((196 - X) / 34, 0, 1) * DW.clamp((X - 60) / 20, 0, 1);
        let f = Math.max(cone, spur) + (fbm(X * 0.07, Y * 0.07, 991) - 0.5) * 0.2;
        if (Math.hypot((X - 56) / 7, (Y - 48) / 5) < 1) f = 1;   // plateau du sommet (le cratère)
        return f > 0.8 ? 4 : f > 0.6 ? 3 : f > 0.4 ? 2 : f > 0.18 ? 1 : 0;
      },
    },
  };
  const exitMid = (m, side) => { const [p, l] = m.exits[side]; return p + (l - 1) / 2; };
  // décalage mondial d'une carte de massif (la Route est à l'est du Mont, passages alignés)
  function offset(id) {
    for (const k in MASSIFS) {
      const M = MASSIFS[k]; if (!(id in M.maps)) continue;
      if (M.maps[id]) return [M, M.maps[id]];
      if (id === 'miharashi3') { const mt = DW.MAPS.miharashi4, rt = DW.MAPS.miharashi3; return [M, [mt.w, Math.round(exitMid(mt, 'right') - exitMid(rt, 'left'))]]; }
    }
    return [null, null];
  }

  // ------------------------------------------------------------ construction : altitude → parois, rebords, escaliers, chemins
  // o : { id : la carte ; keep(x, y, ch) : case à ne pas toucher (côte, sortie) ; corridor(x, y) : case forcée au niveau 0 ;
  //       surface(x, y, L) : caractère du dessus d'un niveau ; pathCh : caractère des chemins de montagne }
  function build(g, m, o = {}) {
    // altitude : fonction donnée par la carte (o.levelAt, coordonnées locales) ou massif enregistré (coordonnées du monde)
    let M = null, off = [0, 0];
    if (!o.levelAt) { [M, off] = offset(o.id); if (!M) return null; }
    const levelAt = o.levelAt || ((x, y) => M.level(x + off[0], y + off[1]));
    const W = g.w, H = g.h, alt = new Uint8Array(W * H), WALL = o.wall || WALL0;   // (o.wall : parois plus hautes sur une vraie montagne)
    const lvl = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : alt[y * W + x]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = g.get(x, y);
      alt[y * W + x] = (o.keep && o.keep(x, y, ch)) || (o.corridor && o.corridor(x, y)) ? 0 : levelAt(x, y);
    }
    // les bords de carte touchant un passage restent au pied, et les niveaux trop petits (moins de 12 cases) disparaissent
    smallPatches(alt, W, H);
    // 1) surfaces
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = g.get(x, y); if (o.keep && o.keep(x, y, ch)) continue;
      g.set(x, y, o.surface ? o.surface(x, y, lvl(x, y)) : '.');
    }
    // 2) parois au sud (3 cases par niveau de dénivelé) et rebords d'une case ailleurs
    const isRock = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const L = lvl(x, y); if (L <= 0) continue;
      const n = lvl(x, y - 1), e = lvl(x + 1, y), w = lvl(x - 1, y), s = lvl(x, y + 1);
      // (au nord, à l'est et à l'ouest : pas de muret de roche, un rebord dessiné — le dénivelé arrête le héros, voir altBord)
      if (s >= 0 && s < L) {
        let k = 1;
        for (; k <= WALL * (L - s) && y + k < H; k++) { if (lvl(x, y + k) >= L || (o.corridor && o.corridor(x, y + k)) || (o.keep && o.keep(x, y + k, g.get(x, y + k)))) break; isRock[(y + k) * W + x] = 1; }
        if (k === 1) isRock[y * W + x] = 1;   // (pas la place pour la paroi, contre une route : le bord du plateau devient roche — jamais de marche sans paroi)
      }
    }
    // 3) escaliers : un par plateau (composante d'un même niveau), au milieu de la plus longue paroi sud
    const comp = new Int32Array(W * H).fill(-1), comps = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const L = lvl(x, y); if (L <= 0 || comp[y * W + x] >= 0) continue;
      const id = comps.length, cells = [], q = [[x, y]]; comp[y * W + x] = id;
      while (q.length) { const [cx, cy] = q.pop(); cells.push([cx, cy]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (lvl(nx, ny) === L && comp[ny * W + nx] < 0) { comp[ny * W + nx] = id; q.push([nx, ny]); } } }
      comps.push({ L, cells });
    }
    // UNE MONTÉE DIFFICILE : on place les escaliers du sommet vers le pied. Sur chaque plateau, l'escalier qui en
    // descend est mis le plus LOIN possible de l'endroit où l'on arrive d'en haut (en lacets, d'un bout à l'autre
    // du gradin) : pour grimper, il faut faire tout le tour de chaque terrasse.
    const stairs = [], arrivals = comps.map(() => []);
    const distFrom = (C, src) => {   // distances (en pas) sur le plateau depuis ses points d'arrivée
      const d = new Map(), q = []; for (const [x, y] of src) { d.set(x + ',' + y, 0); q.push([x, y]); }
      for (let h = 0; h < q.length; h++) { const [x, y] = q[h], k0 = d.get(x + ',' + y); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (d.has(k) || lvl(nx, ny) !== C.L || comp[ny * W + nx] !== C.id || isRock[ny * W + nx]) continue; d.set(k, k0 + 1); q.push([nx, ny]); } }
      return d;
    };
    comps.forEach((C, i) => { C.id = i; });
    const order = comps.slice().sort((a, b) => b.L - a.L || b.cells.length - a.cells.length);
    for (const C of order) {
      // bords sud : case du plateau (pas un rebord) dont la case du dessous est plus basse ; 3 colonnes côte à côte
      const edge = C.cells.filter(([x, y]) => !isRock[y * W + x] && lvl(x, y + 1) >= 0 && lvl(x, y + 1) < C.L);
      const at = new Set(edge.map(([x, y]) => x + ',' + y));
      const cand = edge.filter(([x, y]) => at.has((x + 1) + ',' + y) && at.has((x + 2) + ',' + y) && [0, 1, 2].every(d => lvl(x + d, y + 1) === lvl(x, y + 1)) && !(o.noStair && o.noStair(x, y)));
      if (!cand.length) continue;
      let pick;
      if (arrivals[C.id].length) { const d = distFrom(C, arrivals[C.id]); cand.sort((a, b) => (d.get((b[0] + 1) + ',' + b[1]) || 0) - (d.get((a[0] + 1) + ',' + a[1]) || 0)); pick = cand[Math.floor(Hh(C.L, C.cells.length, 994) * Math.min(3, cand.length))]; }
      else if (o.firstStair) { cand.sort((a, b) => o.firstStair(a, C) - o.firstStair(b, C)); pick = cand[0]; }
      else { cand.sort((a, b) => a[0] - b[0]); pick = cand[Math.floor(cand.length * (0.35 + Hh(C.L, C.cells.length, 993) * 0.3))]; }
      const [sx, sy] = pick, drop = C.L - lvl(sx, sy + 1), len = WALL * drop;
      for (let d = 0; d < 3; d++) for (let k = 1; k <= len; k++) if (sy + k < H) { isRock[(sy + k) * W + sx + d] = 0; g.set(sx + d, sy + k, STAIR); alt[(sy + k) * W + sx + d] = PASS; }
      // les rebords qui toucheraient l'escalier sur le plateau sont ouverts
      for (let d = 0; d < 3; d++) if (isRock[sy * W + sx + d] && lvl(sx + d, sy) === C.L) isRock[sy * W + sx + d] = 0;   // (seulement au-dessus des marches : les rebords voisins restent)
      for (let d = 0; d < 3; d++) { g.set(sx + d, sy, o.pathCh || '='); for (const fy of [sy + len + 1, sy + len + 2]) if (fy < H && lvl(sx + d, fy) === lvl(sx, sy + len + 1)) g.set(sx + d, fy, o.pathCh || '='); }   // (abords dégagés)
      const footComp = comp[(sy + len + 1) * W + sx + 1];
      if (footComp >= 0) arrivals[footComp].push([sx + 1, sy + len + 1]);
      stairs.push({ x: sx, top: sy, foot: sy + len + 1, L: C.L, comp: C.id });
    }
    // murets de chaque côté des escaliers : on ne quitte une volée de marches que par le haut ou par le bas
    for (const st of stairs) for (let y = st.top + 1; y < st.foot; y++) for (const x of [st.x - 1, st.x + 3]) if (x >= 0 && x < W && g.get(x, y) !== STAIR) isRock[y * W + x] = 1;
    for (let i = 0; i < W * H; i++) if (isRock[i]) g.set(i % W, Math.floor(i / W), ROCK);
    // 3 bis) ACCÈS GARANTI : chaque plateau doit pouvoir se gravir depuis l'arrivée (o.foot) ou les bords de la carte.
    // Un plateau qu'aucun escalier ne relie (pas de place sur sa paroi sud) reçoit une volée de marches sur le bord
    // (nord, est ou ouest) le plus proche d'une zone déjà atteinte, un niveau plus bas.
    {
      const pas = (x, y) => { const c = g.get(x, y); return c !== undefined && c !== ROCK && !DW.SOLID.has(c); };   // (comme dans le jeu : arbres et rochers bloquent)
      const ok = (ax, ay, bx, by) => { const a = alt[ay * W + ax], b = alt[by * W + bx]; return a === PASS || b === PASS || a === b; };
      const vu = new Uint8Array(W * H), file = [];
      const pousse = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H || vu[y * W + x] || !pas(x, y)) return; vu[y * W + x] = 1; file.push([x, y]); };
      const etendre = () => { while (file.length) { const [x, y] = file.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || vu[ny * W + nx] || !pas(nx, ny) || !ok(x, y, nx, ny)) continue; vu[ny * W + nx] = 1; file.push([nx, ny]); } } };
      if (o.foot) pousse(o.foot[0], o.foot[1]);
      else for (let x = 0; x < W; x++) for (const y of [0, H - 1]) if (lvl(x, y) === 0) pousse(x, y);
      if (!o.foot) for (let y = 0; y < H; y++) for (const x of [0, W - 1]) if (lvl(x, y) === 0) pousse(x, y);
      etendre();
      m._acces = { rampes: 0 };
      // morceaux RÉELS de chaque niveau, une fois les parois posées (une haute paroi peut couper une terrasse étroite en deux)
      const morceaux = () => {
        const id = new Int32Array(W * H).fill(-1), out = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const L = lvl(x, y); if (L <= 0 || L === PASS || id[y * W + x] >= 0 || !pas(x, y)) continue;
          const C = { L, cells: [] }, q = [[x, y]]; id[y * W + x] = out.length;
          while (q.length) { const [cx, cy] = q.pop(); C.cells.push([cx, cy]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || id[ny * W + nx] >= 0 || lvl(nx, ny) !== L || !pas(nx, ny)) continue; id[ny * W + nx] = out.length; q.push([nx, ny]); } }
          out.push(C);
        }
        return out;
      };
      var rampes = [];
      for (let tour = 0; tour < 40; tour++) {
        let best = null;
        for (const C of morceaux()) {
          if (C.cells.length < 6 || C.cells.some(([x, y]) => vu[y * W + x])) continue;   // (déjà atteint, ou recoin minuscule)
          for (const [x, y] of C.cells) {
            if (!pas(x, y) || lvl(x, y) !== C.L) continue;
            for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0]]) {   // bord nord, est, ouest (au sud : la paroi)
              const ex = x + dx, ey = y + dy; if (ex < 1 || ey < 1 || ex >= W - 1 || ey >= H - 1 || !vu[ey * W + ex] || lvl(ex, ey) !== C.L - 1) continue;
              // trois cases de front le long du bord, toutes du plateau et toutes au-dessus d'une zone atteinte
              const [ax, ay] = dy ? [1, 0] : [0, 1], trio = [-1, 0, 1].map(k => [x + ax * k, y + ay * k]);
              if (!trio.every(([tx, ty]) => lvl(tx, ty) === C.L && pas(tx, ty) && vu[(ty + dy) * W + tx + dx] && lvl(tx + dx, ty + dy) === C.L - 1)) continue;
              const score = Hh(x, y, 997) * 0.3 - (o.foot ? Math.hypot(x - o.foot[0], y - o.foot[1]) / 40 : 0);   // (UNE MONTÉE DIFFICILE : la marche la plus loin de l'arrivée)
              if (!best || score < best.score) best = { trio, score };
            }
          }
        }
        // sinon : un escalier taillé À TRAVERS la paroi sud, jusqu'à une zone atteinte en contrebas
        if (!best) for (const C of morceaux()) {
          if (C.cells.length < 6 || C.cells.some(([x, y]) => vu[y * W + x])) continue;
          const at = new Set(C.cells.map(([x, y]) => x + ',' + y));
          for (const [x, y] of C.cells) {
            const descente = xx => { let k = 1; while (y + k < H && g.get(xx, y + k) === ROCK) k++; return k > 1 && y + k < H && vu[(y + k) * W + xx] && pas(xx, y + k) ? k : 0; };
            const k = descente(x); if (!k || !at.has((x - 1) + ',' + y) || !at.has((x + 1) + ',' + y) || descente(x - 1) !== k || descente(x + 1) !== k) continue;
            const score = k * 0.2 + Hh(x, y, 998) * 0.3 - (o.foot ? Math.hypot(x - o.foot[0], y - o.foot[1]) / 40 : 0);   // (loin de l'arrivée, paroi plutôt basse)
            if (!best || score < best.score) best = { score, trio: [-1, 0, 1].flatMap(d => { const out = []; for (let j = 1; j < k; j++) out.push([x + d, y + j]); return out; }) };
          }
        }
        if (!best) break;
        m._acces.rampes++;
        for (const [tx, ty] of best.trio) { g.set(tx, ty, STAIR); alt[ty * W + tx] = PASS; vu[ty * W + tx] = 1; file.push([tx, ty]); }
        rampes.push(best.trio);
        etendre();
      }
    }
    const chemins = new Set();   // (cases des sentiers de montagne : le décor les évite)
    // 4) chemins de montagne : sur chaque plateau, de l'escalier qui y monte (son haut) à ceux qui en partent (leur pied)
    const walk = (x, y) => { const c = g.get(x, y); return c !== undefined && c !== ROCK && !DW.SOLID.has(c); };
    const pathOn = (a, b, L) => {   // plus court chemin sur un même niveau (BFS), tracé en terre battue
      const key = (x, y) => y * W + x, prev = new Int32Array(W * H).fill(-2), q = [a]; prev[key(...a)] = -1;
      while (q.length) { const [x, y] = q.shift(); if (x === b[0] && y === b[1]) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev[key(nx, ny)] !== -2) continue; if (lvl(nx, ny) !== L || !walk(nx, ny)) continue; prev[key(nx, ny)] = key(x, y); q.push([nx, ny]); } }
      if (prev[key(...b)] === -2) return;
      for (let k = key(...b); k >= 0; k = prev[k]) { const x = k % W, y = Math.floor(k / W); chemins.add(k); if (g.get(x, y) !== STAIR) g.set(x, y, o.pathCh || '='); }
    };
    // (le haut d'un escalier est sur un plateau ; le pied d'un autre escalier sur ce même plateau : on les relie)
    for (const up of stairs) for (const dn of stairs) {
      if (dn === up) continue;
      const P = comp[up.top * W + up.x + 1];
      if (P >= 0 && comp[dn.foot * W + dn.x + 1] === P) pathOn([up.x + 1, up.top], [dn.x + 1, dn.foot], up.L);
    }
    if (o.foot) for (const s of stairs) if (lvl(s.x + 1, s.foot) === 0) pathOn(o.foot, [s.x + 1, s.foot], 0);
    // chaque volée de marches ajoutée pour l'accès : un sentier la relie, des deux côtés, au sentier ou à l'escalier
    // le plus proche du même niveau (sinon on ne la verrait pas)
    for (const R of rampes || []) for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const [cx, cy] = R[1], sx = cx + dx, sy = cy + dy, L = lvl(sx, sy); if (L < 0 || L === PASS || !walk(sx, sy)) continue;
      const prev = new Map([[sy * W + sx, -1]]), q = [[sx, sy]]; let fin = -1;
      for (let h = 0; h < q.length && fin < 0 && h < 4000; h++) {
        const [x, y] = q[h];
        if (h > 0 && (chemins.has(y * W + x) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) => g.get(x + ex, y + ey) === STAIR && !R.some(([rx, ry]) => rx === x + ex && ry === y + ey)))) { fin = y * W + x; break; }
        for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ex, ny = y + ey, k = ny * W + nx; if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(k) || lvl(nx, ny) !== L || !walk(nx, ny)) continue; prev.set(k, y * W + x); q.push([nx, ny]); }
      }
      if (fin >= 0) for (let k = fin; k >= 0; k = prev.get(k)) { const x = k % W, y = Math.floor(k / W); chemins.add(k); if (g.get(x, y) !== STAIR) g.set(x, y, o.pathCh || '='); }
    }
    // altitude des cases de paroi = celle du pied de la paroi ; collision par dénivelé ; rebords peints sur le sol
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.get(x, y) === ROCK && alt[y * W + x] !== PASS) { let k = y; while (k < H && g.get(x, k) === ROCK) k++; alt[y * W + x] = k < H && alt[k * W + x] !== PASS ? alt[k * W + x] : 0; }
    m.alt = alt; m.reliefStairs = stairs; m.massif = M; m.altBord = true; m.chemins = chemins;
    R.peindreRebords(m);
    return { alt, stairs, comps, lvl };
  }
  // ALTITUDE AU PIXEL (contours arrondis) : l'altitude des cases est lissée (B-spline sur 4 × 4 cases, légère ondulation)
  // puis arrondie au niveau le plus proche : le bord d'un plateau suit une courbe au lieu des marches des cases ; un bord
  // droit reste à sa place. Seulement près des bords de plateau (ailleurs : l'altitude de la case). Sert au sol (images
  // par niveau, gfx/terrain.js) et aux rebords ; les déplacements, eux, suivent toujours les cases.
  function altPixels(m) {
    const W = m.w, H = m.h, A = m.alt, TS = 16, GW = W * TS, GH = H * TS, Hh2 = DW.Art.hash;
    const E = new Float32Array(W * H);   // (un escalier prend l'altitude de son voisin du haut, sinon du bas)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let a = A[y * W + x];
      if (a === PASS) { const n = y > 0 ? A[(y - 1) * W + x] : PASS, s2 = y < H - 1 ? A[(y + 1) * W + x] : PASS; a = n !== PASS ? n : s2 !== PASS ? s2 : 0; }
      E[y * W + x] = a;
    }
    const e = (x, y) => E[(y < 0 ? 0 : y >= H ? H - 1 : y) * W + (x < 0 ? 0 : x >= W ? W - 1 : x)];
    const BORD = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const a = e(x, y); let diff = false;
      for (let dy = -2; dy <= 2 && !diff; dy++) for (let dx = -2; dx <= 2; dx++) if (e(x + dx, y + dy) !== a) { diff = true; break; }
      BORD[y * W + x] = diff ? 1 : 0;
    }
    const VL = new Uint8Array(GW * GH);
    for (let py = 0; py < GH; py++) { const ty = py >> 4; for (let px = 0; px < GW; px++) {
      const tx = px >> 4, i = py * GW + px;
      if (!BORD[ty * W + tx]) { VL[i] = E[ty * W + tx]; continue; }
      const u = (px + 0.5 + (Hh2(px >> 2, py >> 2, 931) - 0.5) * 2.5) / TS - 0.5, v = (py + 0.5 + (Hh2(px >> 2, py >> 2, 932) - 0.5) * 2.5) / TS - 0.5;
      const i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0, u2 = fu * fu, u3 = u2 * fu, v2 = fv * fv, v3 = v2 * fv;
      const a0 = (1 - fu) * (1 - fu) * (1 - fu) / 6, a1 = (3 * u3 - 6 * u2 + 4) / 6, a2 = (-3 * u3 + 3 * u2 + 3 * fu + 1) / 6, a3 = u3 / 6;
      const b0 = (1 - fv) * (1 - fv) * (1 - fv) / 6, b1 = (3 * v3 - 6 * v2 + 4) / 6, b2 = (-3 * v3 + 3 * v2 + 3 * fv + 1) / 6, b3 = v3 / 6;
      const row = y => a0 * e(i0 - 1, y) + a1 * e(i0, y) + a2 * e(i0 + 1, y) + a3 * e(i0 + 2, y);
      const h = b0 * row(j0 - 1) + b1 * row(j0) + b2 * row(j0 + 1) + b3 * row(j0 + 2);
      VL[i] = h < 0 ? 0 : Math.round(h);
    } }
    return VL;
  }
  // REBORDS DES PLATEAUX (vue de 3/4), peints sur les pixels du sol D (RGBA) d'après l'altitude au pixel VL : au nord,
  // une lèvre sombre et des brins qui débordent, une ombre portée sur le niveau bas ; à l'est et à l'ouest, un flanc
  // étroit (clair vers sombre) et son ombre ; un plateau plus haut est un peu plus lumineux. Rien sur la roche des parois
  // (rock(i) : pixel de paroi), dessinée à part.
  function rebordsPixels(m, D, VL, rock) {
    const W = m.w, H = m.h, TS = 16, GW = W * TS, GH = H * TS, Hh2 = DW.Art.hash;
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const STY = [
      { ombre: [10, 6, 4, 0.45], levre: [34, 26, 22, 0.95], brin: [hex('#7a6a5c'), hex('#5e5046')], clair: hex('#9a8676'), sombre: hex('#2a201c'), trait: hex('#8a7868'), flanc: [10, 6, 4, 0.4] },
      { ombre: [70, 46, 16, 0.3], levre: [150, 118, 72, 0.9], brin: [hex('#e6d4a4'), hex('#d4bc88')], clair: hex('#d8bc88'), sombre: hex('#8a6a40'), trait: hex('#eedcb0'), flanc: [16, 40, 20, 0.35] },
      { ombre: [16, 40, 20, 0.42], levre: [70, 52, 34, 0.95], brin: [hex('#b8e07a'), hex('#8cc860')], clair: hex('#9a7448'), sombre: hex('#4a3220'), trait: hex('#a8d870'), flanc: [16, 40, 20, 0.35] },
    ];
    // (style selon le sol du plateau : roche ou cendres, sable et terre, herbe)
    const style = (tx, ty, L) => {
      const I = DW.World.CH[(m.rows[ty] || '')[tx]], roc = !!((I && I.sol) || (m.textures && L >= 3));
      return roc ? STY[0] : I && (I.t === 'sand' || I.t === 'dirt') ? STY[1] : STY[2];
    };
    const mel = (i, r, g, b, k) => { const j = i * 4; D[j] += (r - D[j]) * k; D[j + 1] += (g - D[j + 1]) * k; D[j + 2] += (b - D[j + 2]) * k; };
    const vl = (px, py) => (px < 0 || py < 0 || px >= GW || py >= GH ? 255 : VL[py * GW + px]);
    const roche = (px, py) => px < 0 || py < 0 || px >= GW || py >= GH || rock(py * GW + px);
    for (let py = 0; py < GH; py++) { const ty = py >> 4; for (let px = 0; px < GW; px++) {
      const i = py * GW + px, L = VL[i];
      if (rock(i)) continue;
      if (L > 0) mel(i, 255, 250, 210, 0.035 * L);   // (un plateau plus haut est un peu plus lumineux)
      // (un bord : un niveau différent à moins de 4 pixels ; sinon rien d'autre à peindre)
      const n4 = vl(px, py - 4), s3 = vl(px, py + 3), e4 = vl(px + 4, py), w4 = vl(px - 4, py);
      if (n4 === L && s3 === L && e4 === L && w4 === L && vl(px, py - 1) === L && vl(px + 1, py) === L && vl(px - 1, py) === L && vl(px, py + 1) === L) continue;
      const tx = px >> 4;
      // BORD NORD : le plateau touche un niveau plus bas juste au-dessus
      let dn = 0; for (let k = 1; k <= 4; k++) { const n = vl(px, py - k); if (n < L && !roche(px, py - k)) { dn = k; break; } if (n !== L) break; }
      if (dn) {
        const S = style(tx, ty, L);
        if (dn <= 2) mel(i, S.levre[0], S.levre[1], S.levre[2], S.levre[3]);   // lèvre sombre
        else { const h = 1 + Math.floor(Hh2(px >> 1, py - dn, 501) * 3); if (dn - 2 <= h) { const B = S.brin[Hh2(px >> 1, py - dn, 502) < 0.5 ? 0 : 1]; mel(i, B[0], B[1], B[2], 1); } }   // brins qui débordent
      }
      // OMBRE PORTÉE sur le niveau bas, au nord du bord
      for (let k = 1; k <= 3; k++) { const n = vl(px, py + k); if (n > L && n !== 255 && !roche(px, py + k)) { const S = style(tx, Math.min(H - 1, (py + k) >> 4), n); mel(i, S.ombre[0], S.ombre[1], S.ombre[2], S.ombre[3]); break; } if (n !== L) break; }
      // FLANCS EST ET OUEST (et l'ombre du flanc sur le niveau bas d'à côté)
      for (let d = -1; d <= 1; d += 2) {
        let k0 = 0; for (let k = 1; k <= 4; k++) { const n = vl(px + d * k, py); if (n < L && !roche(px + d * k, py)) { k0 = k; break; } if (n !== L) break; }
        if (k0) {
          const S = style(tx, ty, L), t = (k0 - 1) / 3;
          if (k0 === 4) mel(i, S.trait[0], S.trait[1], S.trait[2], 1);
          else mel(i, S.sombre[0] + (S.clair[0] - S.sombre[0]) * t, S.sombre[1] + (S.clair[1] - S.sombre[1]) * t, S.sombre[2] + (S.clair[2] - S.sombre[2]) * t, 1);
        }
        for (let k = 1; k <= 3; k++) { const n = vl(px - d * k, py); if (n > L && n !== 255 && !roche(px - d * k, py)) { const S = style(tx, ty, n); mel(i, S.flanc[0], S.flanc[1], S.flanc[2], S.flanc[3]); break; } if (n !== L) break; }
      }
    } }
  }
  // (sur un canevas déjà peint : pour une carte dont le sol n'a pas été préparé par gfx/terrain.js, ex. l'éditeur)
  function rebords(c, m) {
    if (!m.alt || m._rebordsPix === m.alt) return;
    const GW = m.w * 16, GH = m.h * 16, img = c.getImageData(0, 0, GW, GH), VL = altPixels(m);
    rebordsPixels(m, img.data, VL, i => m.rows[((i / GW) | 0) >> 4][(i % GW) >> 4] === ROCK);
    c.putImageData(img, 0, 0);
  }
  // (une seule fois par carte, en plus du sol peint qu'elle aurait déjà)
  function peindreRebords(m) {
    if (m.paintGround && m.paintGround._rebords) return;
    const base = m.paintGround || null;
    m.paintGround = (c, GW, GH) => { if (base) base(c, GW, GH); rebords(c, m); };
    m.paintGround._rebords = true;
  }
  // un niveau en îlot minuscule (bruit) est rabaissé : pas de pics d'une case
  function smallPatches(alt, W, H) {
    const seen = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (seen[i] || !alt[i]) continue;
      const L = alt[i], cells = [i], q = [i]; seen[i] = 1;
      while (q.length) { const j = q.pop(), x = j % W, y = Math.floor(j / W); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[k] || alt[k] !== L) continue; seen[k] = 1; cells.push(k); q.push(k); } }
      if (cells.length < 12) for (const j of cells) alt[j] = Math.max(0, L - 1);
    }
  }

  // ------------------------------------------------------------ altitude du héros (mise à jour à chaque pas)
  function track(ow) {
    const m = ow.map, p = ow.p; if (!m || !m.alt || !p) { if (p) p.alt = 0; return; }
    const a = m.alt[p.y * m.w + p.x];
    if (a !== PASS && a !== undefined) p.alt = a;   // sur un escalier : on garde le niveau d'où l'on vient
  }

  // ------------------------------------------------------------ vue de développement (frontières, passages, collisions, niveaux)
  const COL = ['rgba(60,140,255,0.0)', 'rgba(80,220,120,0.28)', 'rgba(240,220,60,0.32)', 'rgba(255,140,40,0.36)', 'rgba(255,60,60,0.4)'];
  const R = DW.Relief = {
    MASSIFS, build, track, offset, PASS, rebords, peindreRebords, altPixels, rebordsPixels,
    debug: false,
    allowDebug: typeof location !== 'undefined' && /[?&]debug=geo\b/.test(location.search),
    drawDebug(ow, c, x0, x1, y0, y1) {
      if (!R.debug) return;
      const m = ow.map, TS = 16;
      for (let ty = Math.max(0, y0 >> 4); ty <= Math.min(m.h - 1, y1 >> 4); ty++) for (let tx = Math.max(0, x0 >> 4); tx <= Math.min(m.w - 1, x1 >> 4); tx++) {
        const ch = m.rows[ty][tx], a = m.alt ? m.alt[ty * m.w + tx] : 0;
        if (a === PASS) { c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(tx * TS, ty * TS, TS, TS); }
        else if (a > 0) { c.fillStyle = COL[Math.min(4, a)]; c.fillRect(tx * TS, ty * TS, TS, TS); }
        if (DW.SOLID.has(ch) || ow.solid && ow.solid(tx, ty)) { c.strokeStyle = 'rgba(255,40,40,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx * TS + 3, ty * TS + 3); c.lineTo(tx * TS + 13, ty * TS + 13); c.moveTo(tx * TS + 13, ty * TS + 3); c.lineTo(tx * TS + 3, ty * TS + 13); c.stroke(); }
      }
      // passages vers les cartes voisines
      for (const w of m.warps || []) { c.strokeStyle = w.dir ? '#ff40ff' : '#40ffff'; c.lineWidth = 2; c.strokeRect(w.x * TS + 1, w.y * TS + 1, (w.w || 1) * TS - 2, (w.h || 1) * TS - 2); }
      c.font = '8px monospace'; c.fillStyle = '#ffffff';
      c.fillText(`alt ${ow.p.alt || 0}`, ow.p.x * TS - 2, ow.p.y * TS - 18);
    },
  };
  if (R.allowDebug && typeof window !== 'undefined') window.addEventListener('keydown', e => { if (e.code === 'KeyG') R.debug = !R.debug; });
})();
