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
  const ROCK = 'Ŵ';
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
    miharashi4: m => [6, 6, m.w + 80, m.h - 6],        // le mont : il remplit la carte, une fine plage au nord, à l'ouest et au sud
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
    if (Math.hypot((xm - sx) / srx, (ym - sy) / sry) < 1) return 5;   // plateau du sommet (le cratère)
    // un grand cône en terrasses qui remplit l'île (5 niveaux), et le contrefort vers l'est sur la route
    const cone = 1 - Math.hypot((xm - 48) / 52, (ym - 36) / 38);
    const ridgeY = 50 + Math.sin(xm * 0.05) * 3, spur = (0.5 - Math.abs(ym - ridgeY) / 13) * DW.clamp((180 - xm) / 30, 0, 1) * DW.clamp((xm - 54) / 18, 0, 1);
    const f = Math.max(cone, spur) + (fbm(xm * 0.06, ym * 0.06, 991) - 0.5) * 0.16;
    return f > 0.74 ? 4 : f > 0.56 ? 3 : f > 0.38 ? 2 : f > 0.18 ? 1 : 0;
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
      if (d > 0) { g.set(x, y, Hh(X, Y, 1231) < (d < 3 ? 0.018 : 0.002) ? 'R' : '~'); prot.add(k); continue; }
      if (d > -3.5) { g.set(x, y, Hh(X, Y, 1232) < 0.02 ? 'R' : Hh(X, Y, 1233) < 0.08 ? ';' : 's'); prot.add(k); continue; }
      g.set(x, y, ground(x, y, X, Y));
    }
    return prot;
  }
  // contrat de raccordement : le long d'une carte existante, la bande frontière reprend sa nature (forêt, sable, eau)
  function contracts(g, m, id, chars) {
    const ex = exitCells(m), [ox, oy] = offsets()[id];
    for (const w of m.warps || []) {
      if (!w.dir || ZONE.includes(w.to) || !DW.MAPS[w.to]) continue;
      const B = DW.getMap(w.to), back = DW.MapKit.retour(B, w, id); if (!back) continue;
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
      // (la Plaine des Panneaux est une PLAINE : plus d'herbe et moins de sable que le Désert des Poteaux)
      return N(X, Y, 1253, 0.06) > (n === 2 ? 0.7 : 0.6) ? 's' : N(X, Y, 1254, 0.16) > 0.68 ? ';' : '.';
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
      else if (rd > 2.5 && N(X, Y, 920 + n, 0.09) > (n === 2 ? 0.7 : 0.62) && Hh(X, Y, 921) < 0.09) g.set(x, y, 'Ţ');   // (moins de « forêts » de poteaux dans la Plaine)
    }
    // panneaux routiers (la Plaine en est couverte), vestiges numériques, arbres morts, rochers, os
    const off = (x, y) => nearRoad(id, x, y, 2.5) || high(x, y);
    sow(g, 6, 6, W - 7, H - 7, 'Ŝ', n === 2 ? 0.018 : 0.004, 922 + n, c => c === '.' || c === 's', off);
    sow(g, 8, 8, W - 9, H - 9, '!', 0.0025, 923 + n, c => c === '.' || c === 's', off);
    sow(g, 8, 8, W - 9, H - 9, '?', 0.0018, 924 + n, c => c === '.' || c === 's', off);
    sow(g, 6, 6, W - 7, H - 7, '|', 0.004, 925 + n, c => c === '.', off);
    sow(g, 6, 6, W - 7, H - 7, 'Ó', 0.005, 926 + n, c => c === '.' || c === 's', off);
    sow(g, 6, 6, W - 7, H - 7, 'õ', 0.003, 928 + n, c => c === 's', off);
    // la Plaine : des bosquets d'arbres et de buissons çà et là dans l'herbe (comme ceux que tu y as plantés dans l'atelier ;
    // jamais à côté de tes arbres, ni sur les mesas, ni près des routes)
    if (n === 2) {
      const T0 = DW.Retouches && DW.Retouches.de(id), tiens = (T0 && T0.ajouts) || [], presDesTiens = (x, y) => tiens.some(o => Math.abs(o.x - x) <= 2 && Math.abs(o.y - y) <= 2);
      for (let y = 6; y < H - 6; y++) for (let x = 6; x < W - 6; x++) {
        if (g.get(x, y) !== '.' || off(x, y) || presDesTiens(x, y)) continue;
        const v = N(x + ox, y + oy, 1291, 0.08), h = Hh(x + ox, y + oy, 1292);
        if (v > 0.69) { if (h < 0.55) g.set(x, y, 'T'); else if (h < 0.8) g.set(x, y, 'b'); }
        else if (v > 0.64 && h < 0.18) g.set(x, y, 'b');
      }
    }
    // une oasis au Désert des Poteaux (palmiers, roseaux)
    if (n === 0) { const [px, py] = [40, 26]; if (!high(px, py) && !nearRoad(id, px, py, 6)) { pond(g, px, py, 4.2, 2.4, 'Ð', 929); for (const [dx, dy] of [[-6, -1], [5, -2], [-4, 3], [7, 2]]) put(g, px + dx, py + dy, 'p'); } }
    // panneaux d'orientation à la sortie de la forêt
    const fx = m.exits.right ? exitCenter(m, 'right') : null;
    if (fx) {
      for (const [dx, dy] of [[-7, -4], [-10, -3], [-13, -5], [-8, 4], [-11, 5], [-15, 4]]) put(g, fx[0] + dx, Math.round(fx[1] + dy), 'Ŝ');
      // (la place prévue peut tomber dans la lisière reprise de la carte d'en face — la forêt du Sentier, à la Plaine des
      //  Panneaux : le panneau se pose alors sur la case praticable la plus proche, hors de la route)
      const libre = (x, y) => WALK(g.get(x, y)) || g.get(x, y) === 'Ŝ';
      let sx = fx[0] - 4, sy = Math.round(fx[1]) - 3;
      if (!libre(sx, sy)) {
        let best = null;
        for (let r = 1; r <= 6 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r && !best; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && libre(sx + dx, sy + dy) && g.get(sx + dx, sy + dy) !== '=') best = [sx + dx, sy + dy];
        if (best) [sx, sy] = best;
      }
      if (libre(sx, sy)) { g.set(sx, sy, 'S'); m.signs[sx + ',' + sy] = n === 0
        ? "↑ Rosière · ↓ Plaine des Panneaux · ← Village des Yokomon · → Clairière de l'Arrivée. Les poteaux suivent l'ancienne ligne... jusqu'au village."
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
    // un passage de planches, au sud du petit lac, jusqu'au banc de sable de l'épave (quête de l'épave : game/quetes.js)
    for (let y = 52; y <= 56; y++) for (const x of [24, 25]) { const c = g.get(x, y); if (c === '~') g.set(x, y, '_'); else if (c === 'Ð') g.set(x, y, '.'); }
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

  // ------------------------------------------------------------ DÉCOR DE MONTAGNE PAR ÉTAGE (décors peints : gfx/premium.js)
  // L 1 : sous-bois de montagne (grandes feuilles, fougères, jeunes sapins, rochers moussus) ; L 2 : pins tordus, blocs,
  // genêts, éboulis ; L 3 : aiguilles rocheuses, éboulis, blocs ; L 4 (cendres du cratère) : éboulis, cristaux de feu.
  // Jamais sur un chemin, un escalier ni à côté : la montée reste lisible ; densité d (0..1) pour la route, plus clairsemée.
  const ETAGES = [null,
    [['feuillage', 1, 3], ['fougeres', 0, 3], ['pousse', 2, 2], ['rochersmousse', 1, 1.5], ['buissonfleuri', 2, 1], ['feuillesmortes', 2, 1]],
    [['pintordu', 0, 0.35], ['blocs', 1, 0.5], ['buissonfleuri', 2, 1.8], ['eboulis', 1, 0.6], ['pousse', 2, 1.8], ['rochersmousse', 1, 0.5], ['feuillage', 1, 1.2], ['fougeres', 2, 1], ['oyats', 1, 0.8]],
    [['aiguille', 0, 1.2], ['aiguille', 1, 1.2], ['eboulis', 0, 0.9], ['blocs', 1, 0.6], ['pintordu', 0, 0.3], ['pousse', 2, 1], ['buissonfleuri', 2, 0.8], ['cristaux', 2, 0.3]],
    [['aiguille', 2, 1.4], ['eboulis', 0, 1], ['blocs', 1, 0.6], ['aiguille', 0, 0.8], ['cristaux', 0, 0.3]],
    [['aiguille', 2, 2], ['eboulis', 0, 1.2], ['cristaux', 0, 0.6], ['blocs', 1, 0.4]]];
  // LA MONTAGNE DU JOUEUR (images de sa planche « Montagnes », gfx/textures.js) : au pied, buissons, herbes hautes et
  // fleurs ; plus haut, herbes sèches, edelweiss, arbustes secs et rochers ; puis herbes rousses, gros blocs, éboulis et
  // aiguilles ; près du cratère, aiguilles et éboulis. [décor, variante, poids, praticable]
  const ETAGES_MONT = [null,
    [['tex_commun_mont_buisson', 0, 2], ['tex_commun_mont_herbes_hautes', 0, 2.5, true], ['tex_commun_mont_fleurs_violettes', 0, 1.2, true], ['tex_commun_mont_buisson_baies', 0, 1],
     ['tex_commun_mont_rocher_mousse', 0, 1], ['fougeres', 0, 1.2], ['rochersmousse', 1, 0.6]],
    [['tex_commun_mont_herbes_seches', 0, 2, true], ['tex_commun_mont_edelweiss', 0, 1, true], ['tex_commun_mont_arbuste_sec', 0, 1.2], ['tex_commun_mont_rocher', 0, 1],
     ['tex_commun_mont_petit_rocher', 0, 1], ['tex_commun_mont_eboulis', 0, 0.7], ['pintordu', 0, 0.35], ['tex_commun_mont_cairn', 0, 0.2]],
    [['tex_commun_mont_herbe_rousse', 0, 1.6, true], ['tex_commun_mont_herbes_seches', 0, 1, true], ['tex_commun_mont_gros_rocher', 0, 0.8], ['tex_commun_mont_eboulis_gros', 0, 0.8],
     ['tex_commun_mont_aiguille', 0, 1], ['aiguille', 1, 0.8], ['tex_commun_mont_arbuste_sec', 0, 0.6], ['tex_commun_mont_petit_rocher', 0, 0.6]],
    [['tex_commun_mont_aiguille', 0, 1.2], ['aiguille', 2, 1.2], ['tex_commun_mont_eboulis', 0, 1], ['tex_commun_mont_herbe_rousse', 0, 0.8, true], ['tex_commun_mont_eboulis_gros', 0, 0.6]],
    [['aiguille', 2, 1.6], ['tex_commun_mont_eboulis', 0, 1], ['tex_commun_mont_aiguille', 0, 0.8]]];
  // sols selon l'altitude (gfx/terrain.js, map.solsNiveau) : herbe de montagne puis terre sèche ; rocaille en terre, gravier,
  // puis roche craquelée près du sommet (les cendres du cratère gardent leur image)
  // (chaque niveau mêle deux sols par grandes taches : [sol, taches] ; près du cratère, cendre et gravier)
  const SOLS_MONT = { herbe: [null, null, 'mont_herbe_alpine', ['mont_herbe_alpine', 'mont_terre_seche'], ['mont_terre_seche', 'mont_herbe_alpine'], 'mont_terre_seche'],
    rocaille: [null, 'mont_terre_seche', ['mont_terre_seche', 'mont_herbe_alpine'], ['mont_gravier', 'mont_terre_seche'], ['mont_gravier', 'volcan:sol_cendres'], ['volcan:sol_cendres', 'mont_gravier']],
    cendres: 'mont_gravier' };
  function decorEtages(g, m, d = 1, skip, TAB = ETAGES) {
    const W = g.w, H = g.h, A = m.alt; if (!A) return;
    const libre = (x, y) => { const c = g.get(x, y); return c === '.' || c === ',' || c === 'j' || c === 'n' || c === 'ǥ' || c === 'ţ'; };
    const CH = m.chemins || new Set();
    const pres = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = g.get(x + dx, y + dy); if (c === '^' || c === undefined || CH.has((y + dy) * W + x + dx) || (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (c === ROCK || (c === '=' && A[(y + dy) * W + x + dx] < 3)))) return true; } return false; };
    const occ = new Set(); for (const o of m.objects || []) for (let yy = o.y - 1; yy <= o.y + (o.h || 1); yy++) for (let xx = o.x - 1; xx <= o.x + (o.w || 1); xx++) occ.add(xx + ',' + yy);
    // (une case posée sépare-t-elle ses voisines ? petite recherche autour d'elle, au même niveau)
    // (place réelle d'un dessin : demi-largeur et hauteur en cases, d'après sa taille peinte)
    const taille = k => { const o = DW.World.OBJ[k] || {}, s = o.scale || (DW.World.OBJ_SCALE && DW.World.OBJ_SCALE[k]) || 1, w = typeof o.w === 'number' ? o.w : 16, h = typeof o.h === 'number' ? o.h : 16; return [Math.ceil(w * s / 32), Math.max(1, Math.ceil(h * s / 16))]; };
    const place = (x, y, k) => {
      const [hw, hr] = taille(k), L0 = A[y * W + x];
      for (let yy = y - hr + 1; yy <= y; yy++) for (let xx = x - hw; xx <= x + hw; xx++) {
        const c = g.get(xx, yy), I = c && DW.World.CH[c];
        if (c === undefined || c === ROCK || c === '^' || occ.has(xx + ',' + yy) || A[yy * W + xx] !== L0 || (I && I.obj)) return false;
      }
      for (let yy = y + 1; yy <= y + 3; yy++) for (let xx = x - hw - 1; xx <= x + hw + 1; xx++) { const I = DW.World.CH[g.get(xx, yy)]; if (I && (I.obj === 'tree' || I.obj === 'bigtree' || I.obj === 'palm')) return false; }   // (feuillage d'un arbre placé dessous)
      return true;
    };
    const reserver = (x, y, k) => { const [hw, hr] = taille(k); for (let yy = y - hr; yy <= y + 1; yy++) for (let xx = x - hw - 1; xx <= x + hw + 1; xx++) occ.add(xx + ',' + yy); };
    const bloc = new Set(), D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const coupe = (x, y) => {
      const L = A[y * W + x], ok = (a, b) => a >= 0 && b >= 0 && a < W && b < H && (a !== x || b !== y) && A[b * W + a] === L && !DW.SOLID.has(g.get(a, b)) && !bloc.has(a + ',' + b);
      const V = D4.map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => ok(a, b)); if (V.length < 2) return false;
      const vu = new Set([V[0].join()]), q = [V[0]];
      while (q.length) { const [a, b] = q.pop(); for (const [dx, dy] of D4) { const na = a + dx, nb = b + dy, k = na + ',' + nb; if (vu.has(k) || Math.abs(na - x) > 12 || Math.abs(nb - y) > 12 || !ok(na, nb)) continue; vu.add(k); q.push([na, nb]); } }
      return V.some(v => !vu.has(v.join()));
    };
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
      const L = A[y * W + x]; if (!(L >= 1 && L <= 5) || !TAB[L] || !libre(x, y) || pres(x, y) || occ.has(x + ',' + y) || (skip && skip(x, y))) continue;
      const nb = N(x, y, 990 + L, 0.12), dens = [0, 0.1, 0.085, 0.08, 0.075, 0.07][L] * d * (nb > 0.56 ? 2.4 : nb > 0.45 ? 1 : 0.35);   // (en bosquets, pas en semis régulier)
      if (Hh(x, y, 991 + L) > dens) continue;
      const T = TAB[L], tot = T.reduce((a, t) => a + t[2], 0); let r = Hh(x, y, 993) * tot, pick = T[0];
      for (const t of T) { if (r < t[2]) { pick = t; break; } r -= t[2]; }
      if (!DW.World.OBJ[pick[0]]) continue;   // (image du joueur absente : rien)
      const plat = (DW.World.PLATS && DW.World.PLATS.has(pick[0])) || pick[3] === true;
      if (!place(x, y, pick[0])) continue;
      if (!plat && coupe(x, y)) continue;
      if (!plat) bloc.add(x + ',' + y);
      m.objects.push({ kind: pick[0], v: pick[1], x, y, w: 1, h: 1, ...(plat ? { walk: true } : {}) });
      reserver(x, y, pick[0]);
    }
  }

  // ------------------------------------------------------------ DANGERS DU VOLCAN (game/lave.js)
  // boules de lave et fissures fumantes sur les étages hauts (jamais sur un sentier, un escalier, ni devant Meramon :
  // on peut toujours les éviter) ; coulées de lave qui partent du bord du cratère et descendent sur le sommet
  function dangers(g, m, cx, cy, crater) {
    const W = g.w, H = g.h, A = m.alt, CH = m.chemins || new Set();
    const loin = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = g.get(x + dx, y + dy); if (c === '^' || c === ROCK || CH.has((y + dy) * W + x + dx)) return false; } return true; };
    const occ = new Set(); for (const o of m.objects) for (let yy = o.y - 1; yy <= o.y + (o.h || 1); yy++) for (let xx = o.x - 1; xx <= o.x + (o.w || 1); xx++) occ.add(xx + ',' + yy);
    let n = 0;
    for (let y = 3; y < H - 3 && n < 26; y++) for (let x = 3; x < W - 3 && n < 26; x++) {
      const L = A[y * W + x], c = g.get(x, y);
      if (L < 4 || L === DW.Relief.PASS || (c !== 'ţ' && c !== 'ǥ') || occ.has(x + ',' + y) || !loin(x, y) || Math.hypot(x - cx, (y - cy) * 1.4) < 6) continue;
      if (Hh(x, y, 1301) > (L === 5 ? 0.12 : 0.06)) continue;
      const k = Hh(x, y, 1302) < 0.5 ? 'bouledelave' : 'fissure';
      m.objects.push({ kind: k, v: Hh(x, y, 1303) < 0.5 ? 0 : 1, x, y, w: 1, h: 1, walk: true });
      for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) occ.add(xx + ',' + yy);
      n++;
    }
    // COULÉES QUI DESCENDENT LE VOLCAN : elles partent du bord du lac de lave et suivent la pente, d'un niveau à l'autre :
    //  - jamais vers le haut, et elle ne change de niveau QUE par une falaise qu'on voit (paroi sud) : sur la terrasse,
    //    elle serpente vers le haut de falaise le plus proche (comme l'eau vers sa sortie), avec de l'élan et du hasard ;
    //    les bords nord, est et ouest (sans paroi visible), elle les longe sans les franchir ;
    //  - au-dessus de la falaise, elle DÉGOULINE tout droit le long de la roche jusqu'au pied, en cascade ;
    //  - et ainsi de suite, terrasse après terrasse, jusqu'au pied du volcan où elle s'étale et s'arrête.
    // Elle contourne les arbres et les rochers, ne passe jamais sur un escalier ni sur Meramon.
    m.coulees = [];
    if (!crater) return;
    const lcx = crater.x + crater.w / 2, lcy = crater.y + crater.h / 2, lave = (x, y) => g.get(x, y) === 'ȴ', alt = (x, y) => A[y * W + x];
    const libre = (x, y) => { const c = g.get(x, y); return c !== undefined && c !== '^' && alt(x, y) !== DW.Relief.PASS && !lave(x, y) && (c === ROCK || !DW.SOLID.has(c)); };
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    // distance (en cases, sur la même terrasse) jusqu'au plus proche haut de falaise
    const loinFalaise = new Int16Array(W * H).fill(9999), file = [];
    for (let y = 1; y < H - 2; y++) for (let x = 1; x < W - 1; x++) if (libre(x, y) && g.get(x, y) !== ROCK && g.get(x, y + 1) === ROCK && alt(x, y + 1) < alt(x, y)) { loinFalaise[y * W + x] = 0; file.push(x, y); }
    for (let q = 0; q < file.length; q += 2) {
      const x = file[q], y = file[q + 1], d = loinFalaise[y * W + x];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1 || loinFalaise[ny * W + nx] <= d + 1 || !libre(nx, ny) || g.get(nx, ny) === ROCK || alt(nx, ny) !== alt(x, y)) continue; loinFalaise[ny * W + nx] = d + 1; file.push(nx, ny); }
    }
    const couler = (sx, sy, seed, max, v0) => {
      const ch = [], vu = new Set(); let x = sx, y = sy, vx = v0 ? v0[0] : sx - lcx, vy = v0 ? v0[1] : sy - lcy, pied = 0;
      { const d = Math.hypot(vx, vy) || 1; vx /= d; vy /= d; }
      const fin = 5 + Math.floor(Hh(seed, 1, 1324) * 7);
      while (ch.length < max) {
        ch.push([x, y]); vu.add(x + ',' + y);
        if (g.get(x, y) === ROCK) {   // sur la paroi : la lave tombe tout droit jusqu'au pied de la falaise
          let yy = y + 1; while (g.get(x, yy) === ROCK && !vu.has(x + ',' + yy)) { ch.push([x, yy]); vu.add(x + ',' + yy); yy++; }
          if (!libre(x, yy) || vu.has(x + ',' + yy)) break;
          y = yy; continue;
        }
        const a = alt(x, y);
        if (a <= 1 && ++pied > fin) break;   // au pied du volcan : elle s'étale et s'arrête
        let best = null;
        for (const [dx, dy] of DIRS) {
          const nx = x + dx, ny = y + dy;
          if (nx < 2 || ny < 2 || nx >= W - 2 || ny >= H - 2 || vu.has(nx + ',' + ny) || !libre(nx, ny)) continue;
          if (Math.hypot(nx - cx, (ny - cy) * 1.4) < 4.5) continue;   // (jamais sur Meramon)
          const roc = g.get(nx, ny) === ROCK, na = alt(nx, ny);
          if (na > a) continue;   // jamais vers le haut
          if (roc && (dx || dy !== 1)) continue;   // (on n'entre dans une paroi que par le haut)
          if (!roc && na < a) continue;   // (pas de chute par un bord sans paroi : nord, est, ouest)
          if (dx && dy && (na !== a || alt(x + dx, y) !== a || alt(x, y + dy) !== a || g.get(x + dx, y) === ROCK || g.get(x, y + dy) === ROCK)) continue;   // (pas de diagonale par-dessus un rebord)
          const l = Math.hypot(dx, dy), lf = loinFalaise[ny * W + nx], d0 = loinFalaise[y * W + x];
          const sc = (dx * vx + dy * vy) / l * 0.6 + (roc ? 6 : 0) + (lf < 9999 && d0 < 9999 ? (d0 - lf) * 1.1 : 0) + (N(nx, ny, seed, 0.4) - 0.5) * 1.4 + dy * 0.1;
          if (!best || sc > best[2]) best = [nx, ny, sc, dx / l, dy / l];
        }
        if (!best) break;
        vx = vx * 0.72 + best[3] * 0.28; vy = vy * 0.72 + best[4] * 0.28; { const d = Math.hypot(vx, vy) || 1; vx /= d; vy /= d; }
        x = best[0]; y = best[1];
      }
      return ch;
    };
    const departs = [];
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (libre(x, y) && alt(x, y) === 5 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => lave(x + dx, y + dy)) && Math.hypot(x - cx, (y - cy) * 1.4) > 4.5) departs.push([x, y]);
    departs.sort((a, b) => Math.atan2(a[1] - lcy, a[0] - lcx) - Math.atan2(b[1] - lcy, b[0] - lcx));
    const nb = Math.min(10, departs.length);
    for (let i = 0; i < nb; i++) {
      const [sx, sy] = departs[Math.floor((i + Hh(i, 3, 1320) * 0.6) / nb * departs.length) % departs.length];
      const ch = couler(sx, sy, 1330 + i, 26 + Math.floor(Hh(i, 4, 1321) * 34));
      if (ch.length >= 4) m.coulees.push(ch);
      // bras secondaire : sur une terrasse, la coulée se divise et un bras part de côté
      if (ch.length >= 12 && Hh(i, 5, 1322) < 0.5) {
        const k = Math.floor(ch.length * (0.35 + Hh(i, 7, 1325) * 0.3)), [bx, by] = ch[k], [px, py] = ch[k - 1];
        if (g.get(bx, by) !== ROCK) { const s1 = Hh(i, 6, 1323) < 0.5 ? 1 : -1, dx = bx - px, dy = by - py, ox = -dy * s1, oy = dx * s1;
          if (libre(bx + ox, by + oy)) { const br = couler(bx + ox, by + oy, 1340 + i, 10 + Math.floor(Hh(i, 8, 1326) * 16), [dx + ox, dy + oy]); if (br.length >= 4) m.coulees.push(br); } }
      }
    }
  }

  // ------------------------------------------------------------ ROUTE DU MONT MIHARASHI (sous-zone 3)
  function route(g, m) {
    const id = 'miharashi3', W = g.w, H = g.h;
    const prot = base(g, m, id, (x, y, X, Y) => (N(X, Y, 944, 0.12) > 0.66 ? ',' : N(X, Y, 945, 0.2) > 0.8 ? 'n' : '.'));
    const R = DW.Relief.build(g, m, { id, keep: (x, y) => prot.has(x + ',' + y), corridor: (x, y) => nearRoad(id, x, y, 4.5), levelAt: (x, y) => levelOf(id, x, y),
      foot: m.exits && m.exits.right ? [W - 4, Math.round(m.exits.right[0] + 2)] : undefined,   // (on arrive du Village des Yokomon, à l'est)
      surface: (x, y, L) => (L === 0 ? g.get(x, y) : Hh(x, y, 946 + L) < 0.025 ? 'T' : N(x, y, 950 + L, 0.15) > 0.72 ? ',' : L >= 2 && N(x, y, 952 + L, 0.1) > 0.62 ? '=' : '.') });
    drawRoads(g, m, id);
    m.solsNiveau = { herbe: SOLS_MONT.herbe };
    decorEtages(g, m, 0.7, null, ETAGES_MONT);
    // BOSQUETS de la jungle du pied du mont, plus fournis vers l'ouest (avant : des arbres semés un par un, partout pareil,
    // comme un verger) : des massifs denses là où le bruit est fort, bordés de buissons et de cycas, quelques arbres isolés
    // ailleurs ; jamais sur les terrasses ni près des routes
    const high = (x, y) => m.alt && m.alt[y * W + x] > 0;
    for (let y = 3; y <= H - 4; y++) for (let x = 3; x <= W - 4; x++) {
      const c = g.get(x, y); if ((c !== '.' && c !== ',') || high(x, y) || nearRoad(id, x, y, 3)) continue;
      const v = N(x, y, 1281, 0.07) + (1 - x / W) * 0.12, h = Hh(x, y, 1282);
      if (v > 0.66) g.set(x, y, h < 0.84 ? 'T' : 'Ô');                                       // cœur du bosquet
      else if (v > 0.6) { if (h < 0.34) g.set(x, y, 'b'); else if (h < 0.44) g.set(x, y, 'Ô'); }   // lisière : buissons, cycas
      else if (h < 0.006) g.set(x, y, 'T');                                                  // arbre isolé
    }
    sow(g, 5, 5, Math.round(W * 0.3), H - 6, 'ì', 0.005, 950, c => c === '.', (x, y) => high(x, y) || nearRoad(id, x, y, 2.5));
    sow(g, 5, 5, W - 6, H - 6, 'Ó', 0.004, 949, c => c === '.' || c === ',', (x, y) => nearRoad(id, x, y, 2.5));
    // belvédère : une longue-vue sur le plus haut plateau de la crête
    if (R) {
      // (sur un plateau qu'on peut VRAIMENT atteindre à pied depuis la route : on suit les escaliers depuis le carrefour)
      const reach = new Set(), q = [m.spec.hub]; reach.add(m.spec.hub.join());
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy), c = g.get(x + dx, y + dy); if (reach.has(k) || c === undefined || DW.SOLID.has(c)) continue; reach.add(k); q.push([x + dx, y + dy]); } }
      let best = null; for (const C of R.comps) { if (!C.cells.some(([x, y]) => reach.has(x + ',' + y))) continue; if (!best || C.L > best.L || (C.L === best.L && C.cells.length > best.cells.length)) best = C; }
      const c = best && best.cells.filter(([x, y]) => WALK(g.get(x, y)) && g.get(x, y) !== '=' && reach.has(x + ',' + y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has((x + dx) + ',' + (y + dy)) && WALK(g.get(x + dx, y + dy)))).sort((a, b) => Math.abs(a[0] - W * 0.55) - Math.abs(b[0] - W * 0.55))[0];
      // (son texte suit l'histoire : Meramon calmé, il est redescendu de sa montagne — le volcan, lui, fume toujours)
      if (c) { g.set(c[0], c[1], 'Đ'); m.signs[c[0] + ',' + c[1]] = () => DW.say(DW.state.flags.meramon
        ? "Une longue-vue. À l'ouest, le Mont Miharashi fume toujours... mais plus aucune silhouette de flammes ne s'agite là-haut : Meramon est redescendu de sa montagne."
        : "Une longue-vue. À l'ouest, le Mont Miharashi fume... Une silhouette de flammes s'agite tout là-haut."); }
    }
    const e = exitCenter(m, 'right'), sx = e[0] - 4, sy = Math.round(e[1]) - 3;
    if (WALK(g.get(sx, sy))) { g.set(sx, sy, 'S'); m.signs[sx + ',' + sy] = '← Mont Miharashi · → Village des Yokomon'; }
  }

  // ------------------------------------------------------------ MONT MIHARASHI (sous-zone 4)
  // un massif en 4 étages : jungle au pied, trois terrasses aux hautes parois, le plateau du sommet et son grand cratère.
  // Un seul escalier par terrasse, toujours à l'autre bout de celle-ci : la montée est longue et se mérite.
  function mont(g, m) {
    const id = 'miharashi4', W = g.w;
    m.textures = 'volcan';   // (images dessinées d'assets/volcan quand elles existent : gfx/textures.js)
    m.objMap = { tree: 'pine' };   // (des pins sur le volcan, pas les arbres de saison : cerisiers en fleur...)
    m.solsNiveau = SOLS_MONT;
    const foot = (x, y) => Math.hypot((x - 48) / 50, (y - 40) / 36) < 1;
    const ex10 = exitCells(m, 10);
    const prot = base(g, m, id, (x, y, X, Y) => (foot(x, y) || ex10.has(x + ',' + y) ? (N(X, Y, 961, 0.12) > 0.68 ? ',' : '.') : Hh(X, Y, 964) < 0.75 ? '#' : 'T'));
    const [cx, cy] = MONT.meramon;
    // LE CRATÈRE : un lac de lave creusé dans le plateau du sommet, bordé de cendres (Meramon se tient juste devant)
    // (la bouche peinte, gfx/premium.js « bouche », couvre 21 × 9 cases ; la lave remplit les cases dont le centre est dans le trou)
    const BX = 38, BY = 21, BOUCHE = DW.World.OBJ.bouche, dansLac = (x, y) => BOUCHE.dedans((x - BX) * 16 + 8, (y - BY) * 16 + 9);
    let crater = null;
    const R = DW.Relief.build(g, m, { id, keep: (x, y) => prot.has(x + ',' + y), corridor: (x, y) => ex10.has(x + ',' + y), levelAt: (x, y) => levelOf(id, x, y),
      foot: [W - 4, Math.round(m.exits.right[0] + 2)],   // (on arrive de la route, à l'est)
      wall: 4,   // (une vraie montagne : des falaises de 4 cases par niveau)
      firstStair: a => -Math.abs(a[0] + 1 - cx),   // l'escalier du sommet est au bout du plateau, loin de Meramon
      surface: (x, y, L) => {
        if (L === 0) return g.get(x, y);
        const away = Math.hypot(x - cx, y - cy + 3) > 8;
        if (L === 5) return away && Hh(x, y, 965) < 0.07 ? 'ë' : away && Hh(x, y, 966) < 0.045 ? 'ì' : 'ţ';   // cendres du volcan, roches de lave, fumerolles
        if (L === 4) { const n4 = N(x, y, 977, 0.14); return n4 > 0.62 ? 'ţ' : Hh(x, y, 978) < 0.02 ? 'ë' : 'ǥ'; }   // rocaille et coulées de cendres
        // le sol change avec l'altitude : prairie (1), herbe et terre (2), terre et rocaille (3)
        const n = N(x, y, 973 + L, 0.13);
        if (L === 1) return Hh(x, y, 970 + L) < 0.02 ? 'T' : n > 0.72 ? ',' : n < 0.3 ? 'j' : '.';
        if (L === 2) return n > 0.62 ? 'ǥ' : n < 0.25 ? 'j' : '.';
        return n > 0.28 ? 'ǥ' : '.';   // (haut de la montagne : rocaille, quelques plaques d'herbe ; les sentiers en terre battue ressortent)
      } });
    // devant le cratère : un replat dégagé où se dresse Meramon
    { let x0 = 99, y0 = 99, x1 = 0, y1 = 0;
      for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < W - 2; x++) {
        if (x < BX || y < BY || x >= BX + 21 || y >= BY + 9 || !dansLac(x, y) || m.alt[y * W + x] !== 5 || g.get(x, y) === ROCK) continue;
        g.set(x, y, 'ȴ'); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      if (x1 >= x0) { crater = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, lac: true }; m.bouche = { x: BX, y: BY, w: 21, h: 9 }; }   // (peinte par game/lave.js : la lave y monte et redescend)
      // bord du cratère : cendres, et quelques roches de lave figée (jamais devant Meramon)
      for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < W - 2; x++) {
        if (g.get(x, y) === 'ȴ' || m.alt[y * W + x] !== 5) continue;
        let bord = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (g.get(x + dx, y + dy) === 'ȴ') bord = true;
        if (!bord) continue;
        g.set(x, y, Hh(x, y, 1292) < 0.07 && Math.hypot(x - cx, (y - cy) * 1.4) > 5 ? 'ë' : 'ţ');
      }
    }
    if (crater) for (let y = crater.y + crater.h; y <= cy + 2; y++) for (let x = cx - 4; x <= cx + 4; x++) if (m.alt[y * W + x] === 5 && g.get(x, y) !== ROCK && g.get(x, y) !== 'ȴ') g.set(x, y, 'ţ');
    for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < W - 2; x++) {
      const c = g.get(x, y); if (c !== 'ë' && c !== 'ì') continue;
      if ([[-1, 0], [-1, -1], [0, -1], [1, -1]].some(([dx, dy]) => g.get(x + dx, y + dy) === 'ë' || g.get(x + dx, y + dy) === 'ì')) g.set(x, y, m.alt[y * W + x] >= 4 ? 'ţ' : 'ǥ');
    }
    // cocotiers penchés au bord de la plage, au pied du mont (côté est, l'arrivée)
    for (let y = 4; y < g.h - 4; y++) for (let x = 4; x < W - 4; x++) {
      if (m.alt[y * W + x] !== 0 || g.get(x, y) !== '.' || Hh(x, y, 1281) > 0.06) continue;
      let sable = false; for (let dy = -3; dy <= 3 && !sable; dy++) for (let dx = -3; dx <= 3; dx++) if (g.get(x + dx, y + dy) === 's') { sable = true; break; }
      let arbre = false; for (let dy = -3; dy <= 4 && !arbre; dy++) for (let dx = -3; dx <= 3; dx++) { const I = DW.World.CH[g.get(x + dx, y + dy)]; if (I && (I.obj === 'tree' || I.t === 'canopy')) { arbre = true; break; } }
      if (sable && !arbre && !m.objects.some(o => Math.abs(o.x - x) < 4 && Math.abs(o.y - y) < 4)) m.objects.push({ kind: 'cocotier', v: Hh(x, y, 1282) < 0.5 ? 0 : 1, x, y, w: 1, h: 1, flip: Hh(x, y, 1283) < 0.5 });
    }
    grotte(g, m);
    decorEtages(g, m, 1, (x, y) => Math.hypot(x - cx, (y - cy) * 1.4) < 6, ETAGES_MONT);   // (jamais devant Meramon)
    dangers(g, m, cx, cy, crater);
    // ESPACEMENT : rochers magmatiques et fumerolles à 2 cases au moins les uns des autres, et jamais collés à un objet
    const pres = (x, y, r) => m.objects.some(o => x >= o.x - r && x < o.x + (o.w || 1) + r && y >= o.y - r && y < o.y + (o.h || 1) + r);
    const gardes = [];
    for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < W - 2; x++) {
      const c = g.get(x, y); if (c !== 'ë' && c !== 'ì') continue;
      if (gardes.some(([a, b]) => Math.abs(a - x) <= 2 && Math.abs(b - y) <= 2) || pres(x, y, 1)) g.set(x, y, m.alt[y * W + x] >= 4 ? 'ţ' : 'ǥ'); else gardes.push([x, y]);
    }
    // PLANTES DE FEU (images dessinées, gfx/textures.js) : sur les terrasses, loin des sentiers, des escaliers, des bords,
    // des rochers et des autres objets
    const OBJ = DW.World.OBJ, CH = m.chemins || new Set();
    if (OBJ.tex_volcan_plante_feu_1) for (let y = 3; y < g.h - 3; y++) for (let x = 3; x < W - 3; x++) {
      const L = m.alt[y * W + x], c = g.get(x, y);
      if (L < 2 || L === DW.Relief.PASS || (c !== 'ǥ' && c !== 'ţ') || CH.has(y * W + x) || Hh(x, y, 1401) > 0.05 || Math.hypot(x - cx, (y - cy) * 1.4) < 6) continue;
      let ok = true;
      for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) { const c2 = g.get(x + dx, y + dy), a2 = m.alt[(y + dy) * W + x + dx]; if (c2 === ROCK || c2 === '^' || c2 === 'ë' || c2 === 'ì' || c2 === 'ȴ' || (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && a2 !== L)) { ok = false; break; } }
      if (!ok || pres(x, y, 2)) continue;
      const n = 1 + Math.floor(Hh(x, y, 1402) * 3);
      if (OBJ['tex_volcan_plante_feu_' + n]) m.objects.push({ kind: 'tex_volcan_plante_feu_' + n, v: 0, x, y, w: 1, h: 1, walk: true });
    }
    return R;
  }

  // L'ENTRÉE DES SOUTERRAINS (image « mont_grotte ») : une grotte au pied d'une haute paroi du premier étage, la plus
  // proche de l'arrivée (à l'est), loin des escaliers et des sentiers ; on lit ce qu'on y trouve en lui parlant
  function grotte(g, m) {
    if (!DW.World.OBJ.tex_commun_mont_grotte) return;
    const W = g.w, H = g.h, A = m.alt, CH = m.chemins || new Set(), ax = W - 4, ay = Math.round(m.exits.right[0] + 2);
    let best = null, bd = 1e9;
    for (let y = 6; y < H - 6; y++) for (let x = 6; x < W - 7; x++) {
      if (A[y * W + x] !== 1 || A[y * W + x + 1] !== 1) continue;
      if (![g.get(x, y), g.get(x + 1, y), g.get(x, y + 1), g.get(x + 1, y + 1)].every(WALK) || CH.has(y * W + x) || CH.has(y * W + x + 1)) continue;
      let paroi = true;   // (une vraie paroi au-dessus : 3 cases de roche, un peu plus large que la grotte)
      for (let k = 1; k <= 3 && paroi; k++) for (const xx of [x - 1, x, x + 1, x + 2]) if (g.get(xx, y - k) !== ROCK) { paroi = false; break; }
      if (!paroi) continue;
      let pris = false;
      for (let dy = -5; dy <= 5 && !pris; dy++) for (let dx = -5; dx <= 6; dx++) if (g.get(x + dx, y + dy) === '^') { pris = true; break; }
      if (pris || m.objects.some(o => Math.abs(o.x - x) < 4 && Math.abs(o.y - y) < 4)) continue;
      const dd = Math.hypot(x - ax, y - ay); if (dd < bd) { bd = dd; best = [x, y]; }
    }
    if (!best) return;
    const [x, y] = best;
    // (les arbres devant l'entrée sont abattus : on doit la voir de loin)
    for (let yy = y - 1; yy <= y + 4; yy++) for (let xx = x - 3; xx <= x + 4; xx++) { const I = DW.World.CH[g.get(xx, yy)]; if (I && (I.obj === 'tree' || I.t === 'canopy') && A[yy * W + xx] === 1) g.set(xx, yy, '.'); }
    m.objects.push({ kind: 'tex_commun_mont_grotte', x, y, w: 2, h: 1 });
    m.signs = m.signs || {};
    const msg = "Une grotte s'ouvre au pied de la paroi... Un souffle chaud et humide monte des profondeurs : ce sont les souterrains de l'île. Il fait bien trop noir pour s'y aventurer, pour l'instant.";
    m.signs[x + ',' + y] = msg; m.signs[(x + 1) + ',' + y] = msg;
    m.grotte = [x, y];
  }

  DW.Mih = { desert, village, route, mont, MONT, offsets, shore, levelOf, roads, ZONE };
})();
