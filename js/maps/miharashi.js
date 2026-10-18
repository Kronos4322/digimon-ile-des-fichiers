'use strict';
// =====================================================================
//  CHAPITRE 3 — LA GÉOGRAPHIE DU PAYS DE MERAMON, PUIS SES CARTES
//  On définit d'abord le TERRITOIRE en coordonnées du monde : une seule terre (trait de côte, plages), les routes,
//  le massif du Mont Miharashi et les mesas du désert (relief : maps/relief.js). Chaque carte n'est qu'une FENÊTRE
//  sur ce territoire, placée en alignant ses passages avec ceux de ses voisines : de part et d'autre d'une frontière,
//  les deux cartes voient exactement le même terrain (côte, route, relief). Rien ne dépend de l'ordre de chargement.
//  Le long des cartes déjà existantes (Clairière, Sentier, Rosière, Bosquet), la bande frontière reprend la nature
//  du terrain d'en face (forêt, sable, eau) : le CONTRAT DE RACCORDEMENT, vérifié par dev/geographie.js.
//
//   Mont (4) — Route (3) — Village des Yokomon (1) — Désert des Poteaux (0) | Clairière
//                                                     |  Plaine des Panneaux (2) | Sentier
//   (mer au nord et au sud du village, de la route et du mont ; à l'ouest de la plaine et du mont)
// =====================================================================
(function () {
  const Hh = DW.Art.hash, fbm = DW.Art.fbm;
  const N = (x, y, s, f = 0.08) => fbm(x * f, y * f, s);
  const ROCK = 'Ŵ', OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const ZONE = ['miharashi0', 'miharashi1', 'miharashi2', 'miharashi3', 'miharashi4'];
  const WALK = c => c === '.' || c === ',' || c === ';' || c === 's' || c === 'f' || c === '=' || c === 'v';

  // ------------------------------------------------------------ 1) PLACEMENT DES CARTES DANS LE MONDE
  // origine : le Désert des Poteaux ; chaque voisine est posée contre le bord commun, passages alignés
  // (lus dans la grille du monde, maps/monde.js : une seule vérité pour tout le jeu ; ici, origine = le Désert des Poteaux)
  let OFF = null;
  function offsets() {
    if (OFF) return OFF;
    const o = DW.Monde.pos('miharashi0'); OFF = {};
    for (const id of [...ZONE, 'clairiere', 'sentier', 'lac1', 'bosquet']) { const p = DW.Monde.pos(id); if (p) OFF[id] = [p.x - o.x, p.y - o.y]; }
    return OFF;
  }

  // ------------------------------------------------------------ 2) LA TERRE ET LA MER (une seule côte pour tout le pays)
  // terres de chaque carte (coordonnées locales [x0, y0, x1, y1]) ; leur union lissée + un bruit de côte = le littoral
  const LAND = {
    miharashi0: m => [5, -80, m.w + 80, m.h + 80],     // le désert : terre, sauf la côte qui arrive en coin à l'ouest
    miharashi2: m => [13, -80, m.w + 80, m.h + 80],    // la plaine : mer à l'ouest
    miharashi1: m => [-80, 15, m.w + 80, m.h - 13],    // le village : plage au nord, mer au sud
    miharashi3: m => [-80, 15, m.w + 80, m.h - 13],    // la route : idem
    miharashi4: m => [14, 15, m.w + 80, m.h - 15],     // le mont : mer au nord, à l'ouest et au sud
  };
  let BOXES = null;
  const boxes = () => BOXES || (BOXES = ZONE.map(id => { const [ox, oy] = offsets()[id], [a, b, c, d] = LAND[id](DW.MAPS[id]); return [a + ox, b + oy, c + ox, d + oy]; }));
  const sdBox = (X, Y, [x0, y0, x1, y1]) => { const dx = Math.max(x0 - X, 0, X - x1), dy = Math.max(y0 - Y, 0, Y - y1); return dx || dy ? Math.hypot(dx, dy) : -Math.min(X - x0, x1 - X, Y - y0, y1 - Y); };
  const smin = (a, b, k = 7) => { const h = DW.clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); };
  // distance signée au rivage : > 0 dans la mer, < 0 sur la terre
  function shore(X, Y) {
    let d = 1e9; for (const b of boxes()) d = smin(d, sdBox(X, Y, b));
    return d + (fbm(X * 0.07, Y * 0.07, 1201) - 0.5) * 8 + (fbm(X * 0.2, Y * 0.2, 1202) - 0.5) * 2.5;
  }

  // ------------------------------------------------------------ 3) LES ROUTES (polylignes du monde)
  const exitCenter = (m, side) => { const [p, l] = m.exits[side]; const c = p + (l - 1) / 2; return { left: [0, c], right: [m.w - 1, c], up: [c, 0], down: [c, m.h - 1] }[side]; };
  const HUB = { miharashi0: [48, 36], miharashi2: [50, 36], miharashi3: [48, 42] };
  let ROADS = null;
  function roads() {
    if (ROADS) return ROADS;
    ROADS = [];
    for (const id in HUB) {
      const m = DW.MAPS[id], [ox, oy] = offsets()[id], [hx, hy] = HUB[id];
      for (const s in m.exits) {
        const [ex, ey] = exitCenter(m, s), mid = [(ex + hx) / 2 + (Hh(ex, ey, 1211) - 0.5) * 12, (ey + hy) / 2 + (Hh(ey, ex, 1212) - 0.5) * 8];
        // le chemin entre bien droit sur ses premières cases (il continue celui d'en face)
        const inn = { left: [ex + 6, ey], right: [ex - 6, ey], up: [ex, ey + 6], down: [ex, ey - 6] }[s];
        ROADS.push([[ex, ey], inn, mid, [hx, hy]].map(([x, y]) => [x + ox, y + oy]));
      }
    }
    return ROADS;
  }
  const segDist = (px, py, [ax, ay], [bx, by]) => { const vx = bx - ax, vy = by - ay, t = DW.clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1); return Math.hypot(px - ax - vx * t, py - ay - vy * t); };
  function roadDist(X, Y) { let d = 99; for (const R of roads()) for (let i = 0; i + 1 < R.length; i++) d = Math.min(d, segDist(X, Y, R[i], R[i + 1])); return d; }

  // ------------------------------------------------------------ 4) LE RELIEF
  // le massif du Mont Miharashi (cône en terrasses + contrefort vers l'est sur la route), en repère du mont
  const MONT = { crater: [43, 23], meramon: [48, 30], summit: [48, 27, 12, 6.5] };
  function massif(xm, ym) {
    const [sx, sy, srx, sry] = MONT.summit;
    if (Math.hypot((xm - sx) / srx, (ym - sy) / sry) < 1) return 4;   // plateau du sommet (le cratère)
    const cone = 1 - Math.hypot((xm - 48) / 40, (ym - 38) / 30);
    const ridgeY = 50 + Math.sin(xm * 0.05) * 3, spur = (0.5 - Math.abs(ym - ridgeY) / 13) * DW.clamp((180 - xm) / 30, 0, 1) * DW.clamp((xm - 54) / 18, 0, 1);
    const f = Math.max(cone, spur) + (fbm(xm * 0.06, ym * 0.06, 991) - 0.5) * 0.16;
    return f > 0.62 ? 3 : f > 0.42 ? 2 : f > 0.2 ? 1 : 0;
  }
  // mesas du désert (repère de chaque carte) : [cx, cy, rx, ry, niveau max]
  const MESAS = {
    miharashi0: [[22, 16, 11, 5.5, 2], [76, 16, 10, 5, 1], [24, 54, 10, 5, 1], [74, 52, 12, 5.5, 2]],
    miharashi2: [[40, 18, 18, 4.5, 1], [50, 52, 16, 4.5, 1], [80, 17, 7, 4, 1], [80, 58, 6, 3.5, 1]],
  };
  function levelOf(id, x, y) {
    const [ox, oy] = offsets()[id], X = x + ox, Y = y + oy;
    if (id === 'miharashi3' || id === 'miharashi4') { const [mx, my] = offsets().miharashi4; return massif(X - mx, Y - my); }
    let L = 0;
    for (const [cx, cy, rx, ry, lv] of MESAS[id] || []) {
      const f = 1 - Math.hypot((x - cx) / rx, (y - cy) / ry) + (fbm(X * 0.15, Y * 0.15, 1221) - 0.5) * 0.35;
      if (f > 0) L = Math.max(L, f > 0.5 && lv > 1 ? 2 : 1);
    }
    return L;
  }

  // ------------------------------------------------------------ 5) PEINTURE D'UNE CARTE : fenêtre sur le territoire
  // classe d'une case (pour le contrat de raccordement avec une carte existante)
  function kind(m, x, y) {
    const ch = (m.rows[y] || '')[x]; if (ch === undefined) return null;
    const I = DW.World.info(ch) || {};
    if (I.t === 'water') return 'E';
    if (I.t === 'canopy' || I.obj === 'tree' || I.obj === 'bigtree' || I.obj === 'oak' || I.obj === 'birch' || I.obj === 'pine') return 'F';
    if (I.t === 'sand') return 'S';
    return 'G';
  }
  function exitCells(m, depth = 6) {
    const set = new Set();
    for (const side in m.exits) { const [p, l] = m.exits[side]; for (let k = 0; k < l; k++) for (let d = 0; d < depth; d++) {
      const [x, y] = { left: [d, p + k], right: [m.w - 1 - d, p + k], up: [p + k, d], down: [p + k, m.h - 1 - d] }[side]; set.add(x + ',' + y); } }
    return set;
  }
  // base commune : mer, plage, sol du biome ; renvoie les cases à protéger (mer, plage, passages)
  function base(g, m, id, ground) {
    const [ox, oy] = offsets()[id], ex = exitCells(m), prot = new Set();
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const X = x + ox, Y = y + oy, d = shore(X, Y), k = x + ',' + y;
      if (ex.has(k)) { g.set(x, y, d > -2 ? 's' : '='); prot.add(k); continue; }
      if (d > 0) { g.set(x, y, Hh(X, Y, 1231) < (d < 3 ? 0.04 : 0.006) ? 'R' : '~'); prot.add(k); continue; }
      if (d > -3.5) { g.set(x, y, Hh(X, Y, 1232) < 0.05 ? 'R' : Hh(X, Y, 1233) < 0.08 ? ';' : 's'); prot.add(k); continue; }
      g.set(x, y, ground(x, y, X, Y));
    }
    return prot;
  }
  // contrat de raccordement : le long d'une carte existante, la bande frontière reprend sa nature (forêt, sable, eau)
  function contracts(g, m, id, chars) {
    const ex = exitCells(m), [ox, oy] = offsets()[id];
    for (const w of m.warps || []) {
      if (!w.dir || ZONE.includes(w.to) || !DW.MAPS[w.to]) continue;
      const B = DW.getMap(w.to), back = (B.warps || []).find(b => b.to === id && b.dir === OPP[w.dir]); if (!back) continue;
      const vert = w.dir === 'left' || w.dir === 'right', len = vert ? m.h : m.w, shift = vert ? back.y - w.y : back.x - w.x;
      for (let p = 0; p < len; p++) {
        const q = p + shift;
        for (let d = 0; d < 6; d++) {
          const [x, y] = { left: [d, p], right: [m.w - 1 - d, p], up: [p, d], down: [p, m.h - 1 - d] }[w.dir];
          if (ex.has(x + ',' + y) || g.get(x, y) === '~' || (g.get(x, y) === 's' && d > 0)) continue;
          const [bx, by] = { left: [B.w - 1 - d, q], right: [d, q], up: [q, B.h - 1 - d], down: [q, d] }[w.dir];
          const k = bx >= 0 && by >= 0 && bx < B.w && by < B.h ? kind(B, bx, by) : null;
          if (!k || Hh(x + ox, y + oy, 1241) > [1, 1, 1, 0.8, 0.5, 0.25][d]) continue;   // la nature d'en face s'estompe en 6 cases
          if (k === 'F') g.set(x, y, d < 2 || Hh(x, y, 1242) < 0.6 ? chars.forest : chars.tree);
          else if (k === 'E') g.set(x, y, '~');
          else if (k === 'S') g.set(x, y, 's');
        }
      }
    }
  }
  const nearRoad = (id, x, y, r) => { const [ox, oy] = offsets()[id]; return roadDist(x + ox, y + oy) < r; };
  function drawRoads(g, m, id) {
    const [ox, oy] = offsets()[id];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const c = g.get(x, y); if (c === '~' || c === ROCK || c === '^' || (m.alt && m.alt[y * g.w + x] > 0 && m.alt[y * g.w + x] !== DW.Relief.PASS)) continue;
      if (roadDist(x + ox, y + oy) < 1.7) g.set(x, y, c === 's' ? 's' : '=');
    }
  }
  function sow(g, x0, y0, x1, y1, ch, p, seed, ok, keep) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = g.get(x, y); if (c === undefined || !ok(c) || c === '=' || (keep && keep(x, y))) continue;
      if (Hh(x, y, seed) < p) g.set(x, y, ch);
    }
  }
  const put = (g, x, y, ch) => { if (g.get(x, y) !== undefined && WALK(g.get(x, y)) && g.get(x, y) !== '=') g.set(x, y, ch); };
  function pond(g, cx, cy, rx, ry, ring, seed) {
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d < 1) g.set(x, y, '~'); else if (d < 1.35 && ring && Hh(x, y, seed) < 0.45 && g.get(x, y) !== undefined) g.set(x, y, ring);
    }
  }

  // ------------------------------------------------------------ DÉSERTS DES POTEAUX (sous-zones 0 et 2)
  function desert(g, m, n) {
    const id = 'miharashi' + n, W = g.w, H = g.h;
    // sol : terre sèche pâle, sable, herbes des dunes ; vers le village (à l'ouest du Désert des Poteaux) l'herbe revient
    const prot = base(g, m, id, (x, y, X, Y) => {
      // vers le village (à l'ouest), le désert passe au sable : de part et d'autre de la frontière, du sable (raccord sans couture)
      if (n === 0 && Hh(X, Y, 1251) < DW.clamp((20 - x) / 20, 0, 0.92)) return Hh(X, Y, 1252) < 0.12 ? ';' : 's';
      return N(X, Y, 1253, 0.06) > 0.6 ? 's' : N(X, Y, 1254, 0.16) > 0.68 ? ';' : '.';
    });
    // relief : les mesas, avec leurs parois ocre et un escalier pour monter dessus
    DW.Relief.build(g, m, { id, keep: (x, y) => prot.has(x + ',' + y), corridor: (x, y) => nearRoad(id, x, y, 4.5), levelAt: (x, y) => levelOf(id, x, y),
      surface: (x, y, L) => (L === 0 ? g.get(x, y) : Hh(x, y, 1255) < 0.05 ? 'ó' : Hh(x, y, 1256) < 0.04 ? 'õ' : 's') });
    drawRoads(g, m, id);
    contracts(g, m, id, { forest: '#', tree: 'T' });
    const free = c => c === '.' || c === 's' || c === ',';
    const high = (x, y) => m.alt && m.alt[y * W + x] > 0;
    // poteaux télégraphiques : en file le long des routes (une case sur 7, à 3 cases du bord), et en « forêts » de poteaux
    const [ox, oy] = offsets()[id];
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
      const c = g.get(x, y); if (!free(c) || high(x, y)) continue;
      const X = x + ox, Y = y + oy, rd = roadDist(X, Y);
      if (rd > 2.6 && rd < 3.6 && (X + Y * 3) % 7 === 0) g.set(x, y, 'Ţ');
      else if (rd > 2.5 && N(X, Y, 920 + n, 0.09) > 0.62 && Hh(X, Y, 921) < 0.09) g.set(x, y, 'Ţ');
    }
    // panneaux routiers (la Plaine en est couverte), vestiges numériques, arbres morts, rochers, os
    const off = (x, y) => nearRoad(id, x, y, 2.5) || high(x, y);
    sow(g, 6, 6, W - 7, H - 7, 'Ŝ', n === 2 ? 0.018 : 0.004, 922 + n, c => c === '.' || c === 's', off);
    sow(g, 8, 8, W - 9, H - 9, '!', 0.0025, 923 + n, c => c === '.' || c === 's', off);
    sow(g, 8, 8, W - 9, H - 9, '?', 0.0018, 924 + n, c => c === '.' || c === 's', off);
    sow(g, 6, 6, W - 7, H - 7, '|', 0.004, 925 + n, c => c === '.', off);
    sow(g, 6, 6, W - 7, H - 7, 'Ó', 0.005, 926 + n, c => c === '.' || c === 's', off);
    sow(g, 6, 6, W - 7, H - 7, 'õ', 0.003, 928 + n, c => c === 's', off);
    // une oasis au Désert des Poteaux (palmiers, roseaux)
    if (n === 0) { const [px, py] = [40, 26]; if (!high(px, py) && !nearRoad(id, px, py, 6)) { pond(g, px, py, 4.2, 2.4, 'Ð', 929); for (const [dx, dy] of [[-6, -1], [5, -2], [-4, 3], [7, 2]]) put(g, px + dx, py + dy, 'p'); } }
    // panneaux d'orientation à la sortie de la forêt
    const fx = m.exits.right ? exitCenter(m, 'right') : null;
    if (fx) {
      for (const [dx, dy] of [[-7, -4], [-10, -3], [-13, -5], [-8, 4], [-11, 5], [-15, 4]]) put(g, fx[0] + dx, Math.round(fx[1] + dy), 'Ŝ');
      const sx = fx[0] - 4, sy = Math.round(fx[1]) - 3;
      if (WALK(g.get(sx, sy)) || g.get(sx, sy) === 'Ŝ') { g.set(sx, sy, 'S'); m.signs[sx + ',' + sy] = n === 0
        ? "↑ Rosière · ← Village des Yokomon · → Clairière de l'Arrivée. Les poteaux suivent l'ancienne ligne... jusqu'au village."
        : "↑ Désert des Poteaux · ↓ Bosquet des Pousses · → Sentier des Murmures. Qui a planté tous ces panneaux ? Mystère..."; }
    }
  }

  // ------------------------------------------------------------ VILLAGE DES YOKOMON (sous-zone 1)
  function village(g, m) {
    const id = 'miharashi1', W = g.w, H = g.h, ex = exitCells(m);
    const occ = new Set(); for (const o of m.objects) for (let y = o.y - 1; y < o.y + o.h + 1; y++) for (let x = o.x - 1; x < o.x + o.w + 1; x++) occ.add(x + ',' + y);
    // sol : herbe rase ; vers le désert (à l'est), le sable gagne
    base(g, m, id, (x, y, X, Y) => (Hh(X, Y, 1261) < DW.clamp((x - (W - 22)) / 20, 0, 0.92) ? (Hh(X, Y, 1262) < 0.12 ? ';' : 's') : N(X, Y, 934, 0.1) > 0.7 ? ',' : '.'));
    const free = (x, y) => !occ.has(x + ',' + y) && !ex.has(x + ',' + y) && WALK(g.get(x, y));
    // le petit lac et l'épave (banc de sable)
    pond(g, 24, 49, 11, 5.5, null);
    for (let y = 45; y <= 53; y++) for (let x = 17; x <= 31; x++) { const d = Math.hypot((x - 24) / 7, (y - 49.5) / 3.4); if (d < 1) g.set(x, y, d < 0.75 ? 's' : ';'); }
    for (let y = 40; y < 60; y++) for (let x = 8; x < 40; x++) if (free(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g.get(x + dx, y + dy) === '~') && Hh(x, y, 937) < 0.4) g.set(x, y, 'Ð');
    // la place autour de la fontaine, les allées vers chaque hutte et vers les sorties
    for (let y = 22; y <= 36; y++) for (let x = 34; x <= 62; x++) if (Math.hypot((x - 48) / 13, (y - 29.5) / 6.5) < 1 && free(x, y)) g.set(x, y, '=');
    const road = (pts, r, keep) => { for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if (dx * dx + dy * dy > r * r) continue; const X = Math.round(x + dx), Y = Math.round(y + dy); if (keep(X, Y) || g.get(X, Y) === undefined || g.get(X, Y) === '~') continue; g.set(X, Y, '='); } } } };
    for (const o of m.objects.filter(o => o.kind === 'yokohut')) road([[o.x + 2, o.y + o.h], [48, 30]], 0.8, (x, y) => occ.has(x + ',' + y) && y !== o.y + o.h);
    for (const s in m.exits) { const e = exitCenter(m, s); road([e, [{ left: e[0] + 6, right: e[0] - 6 }[s] || e[0], e[1]], [(e[0] + 48) / 2, (e[1] + 31) / 2 + 3], [48, 33]], 1.6, (x, y) => occ.has(x + ',' + y)); }
    // champs de fleurs des Yokomon (fleurs bleues) bordés de haies, et un potager
    const field = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!free(x, y) || g.get(x, y) === '=') continue; const edge = x === x0 || x === x1 || y === y0 || y === y1; g.set(x, y, edge ? (y === y1 && Math.abs(x - (x0 + x1) / 2) < 1.5 ? '.' : 'K') : (x + y) % 2 ? 'd' : 'f'); } };
    field(72, 30, 84, 37); field(10, 30, 21, 37);
    for (let y = 50; y <= 56; y++) for (let x = 55; x <= 69; x++) if (free(x, y) && g.get(x, y) !== '=') g.set(x, y, (y % 3 === 0) ? '=' : 'f');
    // vie du village : puits, bancs, lanternes, caisses, tonneaux, drapeaux
    for (const [x, y, ch] of [[41, 25, 'e'], [55, 26, 'J'], [40, 34, 'J'], [37, 29, 'i'], [59, 29, 'i'], [48, 21, 'i'], [32, 20, 'D'], [65, 20, 'a'], [66, 20, 'D'], [31, 41, 'a'], [60, 48, 'D'], [53, 39, 'i'], [43, 39, 'i'],
      [23, 27, 'V'], [74, 27, 'V'], [78, 41, 'J'], [17, 41, 'J']]) put(g, x, y, ch);
    // grands arbres d'ombre, palmiers le long de la plage du nord
    for (const [x, y] of [[29, 18], [68, 19], [15, 23], [86, 23], [9, 45], [88, 48], [34, 58], [76, 56]]) put(g, x, y, Hh(x, y, 935) < 0.5 ? 'Y' : 'T');
    for (let y = 0; y < H / 2; y++) for (let x = 0; x < W; x++) if (free(x, y) && g.get(x, y) !== '=' && [1, 2, 3].some(k => g.get(x, y - k) === 's') && Hh(x, y, 936) < 0.06) g.set(x, y, 'p');
    g.set(48, 31, 'S');
  }

  // ------------------------------------------------------------ ROUTE DU MONT MIHARASHI (sous-zone 3)
  function route(g, m) {
    const id = 'miharashi3', W = g.w, H = g.h;
    const prot = base(g, m, id, (x, y, X, Y) => (N(X, Y, 944, 0.12) > 0.66 ? ',' : N(X, Y, 945, 0.2) > 0.8 ? 'n' : '.'));
    const R = DW.Relief.build(g, m, { id, keep: (x, y) => prot.has(x + ',' + y), corridor: (x, y) => nearRoad(id, x, y, 4.5), levelAt: (x, y) => levelOf(id, x, y),
      surface: (x, y, L) => (L === 0 ? g.get(x, y) : Hh(x, y, 946 + L) < 0.05 ? 'T' : Hh(x, y, 948 + L) < 0.03 ? 'Ó' : N(x, y, 950 + L, 0.15) > 0.7 ? ',' : '.') });
    drawRoads(g, m, id);
    // bosquets de la jungle du pied du mont, plus denses vers l'ouest
    const high = (x, y) => m.alt && m.alt[y * W + x] > 0;
    sow(g, 3, 3, W - 4, H - 4, 'T', 0.03, 1271, c => c === '.' || c === ',', (x, y) => high(x, y) || nearRoad(id, x, y, 3) || Hh(x, y, 1272) > 1 - (1 - x / W) * 0.7);
    sow(g, 3, 3, W - 4, H - 4, 'Ô', 0.01, 1273, c => c === '.' || c === ',', (x, y) => high(x, y) || nearRoad(id, x, y, 3));
    sow(g, 5, 5, Math.round(W * 0.3), H - 6, 'ì', 0.005, 950, c => c === '.', (x, y) => high(x, y) || nearRoad(id, x, y, 2.5));
    sow(g, 5, 5, W - 6, H - 6, 'Ó', 0.004, 949, c => c === '.' || c === ',', (x, y) => nearRoad(id, x, y, 2.5));
    // belvédère : une longue-vue sur le plus haut plateau de la crête
    if (R) {
      // (sur un plateau qu'on peut VRAIMENT atteindre à pied depuis la route : on suit les escaliers depuis le carrefour)
      const reach = new Set(), q = [m.spec.hub]; reach.add(m.spec.hub.join());
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy), c = g.get(x + dx, y + dy); if (reach.has(k) || c === undefined || DW.SOLID.has(c)) continue; reach.add(k); q.push([x + dx, y + dy]); } }
      let best = null; for (const C of R.comps) { if (!C.cells.some(([x, y]) => reach.has(x + ',' + y))) continue; if (!best || C.L > best.L || (C.L === best.L && C.cells.length > best.cells.length)) best = C; }
      const c = best && best.cells.filter(([x, y]) => WALK(g.get(x, y)) && g.get(x, y) !== '=' && reach.has(x + ',' + y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has((x + dx) + ',' + (y + dy)) && WALK(g.get(x + dx, y + dy)))).sort((a, b) => Math.abs(a[0] - W * 0.55) - Math.abs(b[0] - W * 0.55))[0];
      if (c) { g.set(c[0], c[1], 'Đ'); m.signs[c[0] + ',' + c[1]] = "Une longue-vue. À l'ouest, le Mont Miharashi fume... Une silhouette de flammes s'agite tout là-haut."; }
    }
    const e = exitCenter(m, 'right'), sx = e[0] - 4, sy = Math.round(e[1]) - 3;
    if (WALK(g.get(sx, sy))) { g.set(sx, sy, 'S'); m.signs[sx + ',' + sy] = '← Mont Miharashi · → Village des Yokomon'; }
  }

  // ------------------------------------------------------------ MONT MIHARASHI (sous-zone 4)
  // un massif en 4 étages : jungle au pied, trois terrasses aux hautes parois, le plateau du sommet et son grand cratère.
  // Un seul escalier par terrasse, toujours à l'autre bout de celle-ci : la montée est longue et se mérite.
  function mont(g, m) {
    const id = 'miharashi4', W = g.w;
    const foot = (x, y) => Math.hypot((x - 48) / 50, (y - 40) / 36) < 1;
    const ex10 = exitCells(m, 10);
    const prot = base(g, m, id, (x, y, X, Y) => (foot(x, y) || ex10.has(x + ',' + y) ? (N(X, Y, 961, 0.12) > 0.68 ? ',' : Hh(X, Y, 962) < 0.025 ? 'Ô' : '.') : Hh(X, Y, 964) < 0.75 ? '#' : 'T'));
    const [cx, cy] = MONT.meramon, crater = m.objects.find(o => o.kind === 'cratere');
    const R = DW.Relief.build(g, m, { id, keep: (x, y) => prot.has(x + ',' + y), corridor: (x, y) => ex10.has(x + ',' + y), levelAt: (x, y) => levelOf(id, x, y),
      foot: [W - 4, Math.round(m.exits.right[0] + 2)],   // (on arrive de la route, à l'est)
      firstStair: a => -Math.abs(a[0] + 1 - cx),   // l'escalier du sommet est au bout du plateau, loin de Meramon
      surface: (x, y, L) => {
        if (L === 0) return g.get(x, y);
        const away = Math.hypot(x - cx, y - cy + 3) > 8;
        if (L === 4) return away && Hh(x, y, 965) < 0.06 ? 'ë' : away && Hh(x, y, 966) < 0.03 ? 'ì' : '=';
        // terrasses : herbe rase, rochers et arbustes qui obligent à zigzaguer
        return Hh(x, y, 967 + L) < 0.045 ? 'Ó' : Hh(x, y, 970 + L) < 0.03 ? 'T' : Hh(x, y, 975 + L) < 0.02 ? 'ë' : N(x, y, 973 + L, 0.15) > 0.7 ? ',' : '.';
      } });
    // devant le cratère : un replat dégagé où se dresse Meramon
    if (crater) for (let y = crater.y + crater.h; y <= cy + 2; y++) for (let x = cx - 4; x <= cx + 4; x++) if (m.alt[y * W + x] === 4 && g.get(x, y) !== ROCK) g.set(x, y, '=');
    return R;
  }

  DW.Mih = { desert, village, route, mont, MONT, offsets, shore, levelOf, roads, ZONE };
})();
