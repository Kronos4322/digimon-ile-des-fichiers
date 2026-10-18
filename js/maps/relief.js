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
  const ROCK = 'Ŵ', STAIR = '^', WALL = 3, PASS = 255;

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
    const W = g.w, H = g.h, alt = new Uint8Array(W * H);
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
      if ((n >= 0 && n < L) || (e >= 0 && e < L) || (w >= 0 && w < L)) isRock[y * W + x] = 1;
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
    // 4) chemins de montagne : sur chaque plateau, de l'escalier qui y monte (son haut) à ceux qui en partent (leur pied)
    const walk = (x, y) => { const c = g.get(x, y); return c !== undefined && c !== ROCK && !DW.SOLID.has(c); };
    const pathOn = (a, b, L) => {   // plus court chemin sur un même niveau (BFS), tracé en terre battue
      const key = (x, y) => y * W + x, prev = new Int32Array(W * H).fill(-2), q = [a]; prev[key(...a)] = -1;
      while (q.length) { const [x, y] = q.shift(); if (x === b[0] && y === b[1]) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev[key(nx, ny)] !== -2) continue; if (lvl(nx, ny) !== L || !walk(nx, ny)) continue; prev[key(nx, ny)] = key(x, y); q.push([nx, ny]); } }
      if (prev[key(...b)] === -2) return;
      for (let k = key(...b); k >= 0; k = prev[k]) { const x = k % W, y = Math.floor(k / W); if (g.get(x, y) !== STAIR) g.set(x, y, o.pathCh || '='); }
    };
    // (le haut d'un escalier est sur un plateau ; le pied d'un autre escalier sur ce même plateau : on les relie)
    for (const up of stairs) for (const dn of stairs) {
      if (dn === up) continue;
      const P = comp[up.top * W + up.x + 1];
      if (P >= 0 && comp[dn.foot * W + dn.x + 1] === P) pathOn([up.x + 1, up.top], [dn.x + 1, dn.foot], up.L);
    }
    if (o.foot) for (const s of stairs) if (lvl(s.x + 1, s.foot) === 0) pathOn(o.foot, [s.x + 1, s.foot], 0);
    m.alt = alt; m.reliefStairs = stairs; m.massif = M;
    return { alt, stairs, comps, lvl };
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
    MASSIFS, build, track, offset, PASS,
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
