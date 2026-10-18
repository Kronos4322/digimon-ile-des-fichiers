'use strict';
// =====================================================================
//  LE PUZZLE DU MONDE : chaque carte extérieure est une PIÈCE carrée de même taille (96 × 72 cases), posée sur une
//  case de la grille (colonne, rangée). Deux pièces côte à côte peuvent être reliées par un PASSAGE sur leur bord
//  commun ; c'est la seule façon de passer d'une carte à l'autre (les deux côtés du passage sont au même endroit).
//  Axes : colonne vers l'EST, rangée vers le SUD ; origine (0, 0) = la Clairière de l'Arrivée.
//  Ce fichier est la vérité du monde : l'éditeur de cartes (sur le PC du créateur, dossier editeur/) le réécrit
//  quand on déplace une pièce ou qu'on ouvre / ferme un passage.
//  Hors du puzzle (reliés par des portails, comme des portes) : le terrain d'entraînement, le Quartier des Champs,
//  le Village des Poyomon, les quartiers de la ville, et les régions des chapitres futurs (en attendant leur chapitre).
// =====================================================================
(function () {
  const P = DW.PUZZLE = {
    case: [96, 72],
    // pièce : [colonne, rangée]
    pieces: {
      lac10: [-1, -4], lac9: [0, -4],
      lac11: [-2, -3], lac7: [-1, -3], lac6: [0, -3], lac5: [1, -3],
      lac8: [-1, -2], lac2: [0, -2], lac4: [1, -2],
      lac1: [-1, -1], lac0: [0, -1], lac3: [1, -1],
      miharashi4: [-4, 0], miharashi3: [-3, 0], miharashi1: [-2, 0], miharashi0: [-1, 0], clairiere: [0, 0],
      miharashi2: [-1, 1], sentier: [0, 1], prairie: [1, 1], berceau: [2, 1],
      bosquet: [-1, 2], geants: [0, 2],
      dunes: [-1, 3], lisiere: [0, 3],
      crique: [-1, 4], plage: [0, 4], village: [1, 4],
    },
    // passage : [pièce A, côté de A, pièce B, début le long du bord (en cases), largeur] — null = position par défaut
    passages: [
      ['lac10', 'right', 'lac9', null, 6], ['lac10', 'down', 'lac7', null, 6], ['lac9', 'down', 'lac6', null, 6],
      ['lac11', 'right', 'lac7', null, 6], ['lac7', 'right', 'lac6', null, 6], ['lac6', 'right', 'lac5', null, 6],
      ['lac7', 'down', 'lac8', null, 6], ['lac6', 'down', 'lac2', null, 6], ['lac5', 'down', 'lac4', null, 6],
      ['lac8', 'down', 'lac1', null, 6], ['lac4', 'down', 'lac3', null, 6],
      ['lac1', 'right', 'lac0', null, 6], ['lac0', 'right', 'lac3', null, 6],
      ['lac0', 'down', 'clairiere', null, 6], ['lac1', 'down', 'miharashi0', null, 6],
      ['miharashi4', 'right', 'miharashi3', null, 6], ['miharashi3', 'right', 'miharashi1', null, 6], ['miharashi1', 'right', 'miharashi0', null, 6],
      ['miharashi0', 'right', 'clairiere', null, 6], ['miharashi0', 'down', 'miharashi2', null, 6],
      ['clairiere', 'down', 'sentier', null, 6], ['miharashi2', 'right', 'sentier', null, 6], ['sentier', 'right', 'prairie', null, 6], ['prairie', 'right', 'berceau', null, 6],
      ['miharashi2', 'down', 'bosquet', null, 6], ['sentier', 'down', 'geants', null, 6], ['bosquet', 'right', 'geants', null, 6],
      ['bosquet', 'down', 'dunes', null, 6], ['geants', 'down', 'lisiere', null, 6], ['dunes', 'right', 'lisiere', null, 6],
      ['dunes', 'down', 'crique', null, 6], ['lisiere', 'down', 'plage', null, 6], ['crique', 'right', 'plage', null, 6], ['plage', 'right', 'village', null, 6],
    ],
  };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const [CW, CHH] = P.case;
  P.isPiece = id => !!P.pieces[id];
  P.pos = id => { const c = P.pieces[id]; return c ? { x: c[0] * CW, y: c[1] * CHH, w: CW, h: CHH } : null; };

  // ------------------------------------------------------------ mise au gabarit (cartes faites main, à leur préparation)
  // la carte garde son dessin en haut à gauche (toutes ses coordonnées restent valables) ; elle est prolongée à droite
  // et en bas jusqu'à 96 × 72 en reprenant, en miroir, la bande de bord (forêt, mer, sable, chemin qui sort...)
  P.gabarit = function (m, id) {
    if (!P.isPiece(id) || !m.rows || m._gabFor === m.rows) return;
    const h0 = m.rows.length, w0 = Math.max(...m.rows.map(r => r.length));
    if (w0 === CW && h0 === CHH) { m._gabFor = m.rows; m.w = CW; m.h = CHH; return; }
    const src = m.rows.map(r => r.padEnd(w0, r[r.length - 1]));
    // (au-delà du bord : la bande de bord reprise en miroir, aller-retour, pour éviter les rayures)
    const mir = (k, n, band) => { const j = (k - n) % (2 * band); return j < band ? n - 1 - j : n - band + (j - band); };
    const rows = [];
    for (let y = 0; y < CHH; y++) {
      const sy = y < h0 ? y : mir(y, h0, Math.min(8, h0));
      let r = '';
      for (let x = 0; x < CW; x++) r += src[sy][x < w0 ? x : mir(x, w0, Math.min(8, w0))];
      rows.push(r);
    }
    m.rows = rows; m._gabFor = m.rows; m.w = CW; m.h = CHH;
    // les sorties du bord droit / bas suivent le nouveau bord (et les arrivées des autres cartes avec elles)
    for (const w of m.warps || []) { if (w.x + (w.w || 1) === w0) w.x = CW - (w.w || 1); if (w.y + (w.h || 1) === h0) w.y = CHH - (w.h || 1); }
    for (const k in DW.MAPS) for (const w of DW.MAPS[k].warps || []) if (w.to === id && !w.puzzle) { if (w.tx === w0 - 1) w.tx = CW - 1; if (w.ty === h0 - 1) w.ty = CHH - 1; }
  };

  // ------------------------------------------------------------ passages : posés dans les deux cartes, au même endroit
  const along = side => (side === 'left' || side === 'right' ? CHH : CW);
  function defaultPos(a, side, b, keep) {
    // une carte faite main garde son ancien passage (son chemin y mène déjà) ; sinon : le milieu du bord
    for (const [id, s, other] of [[a, side, b], [b, OPP[side], a]]) {
      const m = DW.MAPS[id]; if (m.spec) continue;
      const olds = Object.values(keep[id] || {});
      const w = (keep[id] || {})[other] || olds.find(v => v.dir === s);
      if (w) return Math.min(along(side) - 7, s === 'left' || s === 'right' ? w.y : w.x);
    }
    return Math.floor(along(side) / 2) - 3;
  }
  const warpOn = (side, p, len, to) => {
    const o = { left: { x: 0, y: p, w: 1, h: len, tx: CW - 1, ty: p }, right: { x: CW - 1, y: p, w: 1, h: len, tx: 0, ty: p },
      up: { x: p, y: 0, w: len, h: 1, tx: p, ty: CHH - 1 }, down: { x: p, y: CHH - 1, w: len, h: 1, tx: p, ty: 0 } }[side];
    return { ...o, dir: side, to, _zt: true, puzzle: true };
  };
  // appelé une fois tous les passages des anciennes cartes posés (fin de maps/regions.js)
  // le puzzle refait dans l'éditeur de cartes remplace celui-ci (maps/retouches_donnees.js)
  if (DW.RETOUCHES && DW.RETOUCHES.puzzle) { P.pieces = DW.RETOUCHES.puzzle.pieces; P.passages = DW.RETOUCHES.puzzle.passages; }
  P.apply = function () {
    const MAPS = DW.MAPS, keep = {};
    // les anciennes liaisons entre pièces sont retirées (on garde leurs conditions : portes de région, verrous)
    for (const id in P.pieces) {
      const m = MAPS[id]; if (!m) continue;
      keep[id] = {};
      m.warps = (m.warps || []).filter(w => { if (w.dir && P.isPiece(w.to)) { keep[id][w.to] = w; return false; } return true; });
      if (m.spec) for (const s of Object.keys(m.exits || {})) { const t = Object.values(keep[id]).find(w => w.dir === s); if (t) delete m.exits[s]; }
    }
    for (const pass of P.passages) {
      const [a, side, b, p0, len = 6] = pass, A = MAPS[a], B = MAPS[b]; if (!A || !B) continue;
      const [ca, ra] = P.pieces[a], [cb, rb] = P.pieces[b], dx = cb - ca, dy = rb - ra;
      if ({ left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[side].join() !== [dx, dy].join()) { console.warn(`[puzzle] ${a} et ${b} ne sont pas voisines par le côté ${side}`); continue; }
      const p = p0 != null ? p0 : defaultPos(a, side, b, keep);
      pass[3] = p;
      const wa = warpOn(side, p, len, b), wb = warpOn(OPP[side], p, len, a);
      for (const [w, from, to] of [[wa, a, b], [wb, b, a]]) { const old = keep[from][to]; if (old) for (const k of ['cond', 'lock', 'enclos']) if (old[k] !== undefined) w[k] = old[k]; }
      A.warps.push(wa); B.warps.push(wb);
      if (A.spec) A.exits[side] = [p, len]; if (B.spec) B.exits[OPP[side]] = [p, len];
    }
    P.applied = true;
    // les cartes générées prennent la taille d'une pièce
    for (const id in P.pieces) { const m = MAPS[id]; if (m && m.spec) { m.w = CW; m.h = CHH; } }
  };

  // une carte qui refait ses sorties elle-même (la ville qui grandit) reprend celles du puzzle
  P.reposer = function (m, id) {
    if (!P.isPiece(id) || !P.applied) return;
    const mine = P.passages.filter(q => (q[0] === id || q[2] === id) && q[3] != null);
    if (mine.every(q => (m.warps || []).some(w => w.puzzle && w.to === (q[0] === id ? q[2] : q[0])))) return;
    m.warps = (m.warps || []).filter(w => !(w.dir && P.isPiece(w.to)) || w.puzzle);
    for (const [a, side, b, p, len = 6] of mine) {
      const s2 = a === id ? side : OPP[side], to = a === id ? b : a;
      if (!m.warps.some(w => w.puzzle && w.to === to)) m.warps.push(warpOn(s2, p, len, to));
    }
    m._racFor = null;
  };
  // (début du passage commun entre deux pièces : pour aligner un décor sur le passage, ex. la côte de la ville)
  P.passage = (a, b) => { const q = P.passages.find(t => (t[0] === a && t[2] === b) || (t[0] === b && t[2] === a)); return q ? q[3] : null; };
  // ------------------------------------------------------------ raccord : chaque passage rejoint le réseau de chemins de la carte
  P.raccorder = function (m, id) {
    if (!P.isPiece(id) || m._racFor === m.rows || !m.rows) return;
    const W = m.w, H = m.h, g = m.rows.map(r => [...r]);
    const walk = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !DW.SOLID.has(g[y][x]);
    // grande zone praticable de la carte (la plus vaste)
    const comp = new Int32Array(W * H).fill(-1), sizes = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (comp[y * W + x] >= 0 || !walk(x, y)) continue;
      const id2 = sizes.length, q = [[x, y]]; comp[y * W + x] = id2; let n = 0;
      while (q.length) { const [cx, cy] = q.pop(); n++; for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + ddx, ny = cy + ddy; if (walk(nx, ny) && comp[ny * W + nx] < 0) { comp[ny * W + nx] = id2; q.push([nx, ny]); } } }
      sizes.push(n);
    }
    const main = sizes.indexOf(Math.max(...sizes));
    for (const w of m.warps || []) {
      if (!w.puzzle) continue;
      const cx = w.x + (w.w >> 1), cy = w.y + (w.h >> 1);
      const inward = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] }[w.dir];
      // couloir de 4 cases depuis le bord, puis plus court chemin vers la grande zone (à travers forêt et décor, ponts sur l'eau)
      let x = cx, y = cy;
      for (let k = 0; k < 4; k++) { for (let d = 0; d < Math.max(w.w, w.h); d++) { const px = w.dir === 'up' || w.dir === 'down' ? w.x + d : x, py = w.dir === 'up' || w.dir === 'down' ? y : w.y + d; if (g[py] && g[py][px] !== undefined && DW.SOLID.has(g[py][px])) g[py][px] = DW.World.info(g[py][px]).t === 'water' ? '_' : '='; } x += inward[0]; y += inward[1]; }
      if (comp[y * W + x] === main) continue;
      const prev = new Int32Array(W * H).fill(-2), q = [[x, y]]; prev[y * W + x] = -1; let end = -1;
      for (let h = 0; h < q.length && end < 0; h++) {
        const [qx, qy] = q[h];
        if (comp[qy * W + qx] === main) { end = qy * W + qx; break; }
        for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = qx + ddx, ny = qy + ddy; if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1 || prev[ny * W + nx] !== -2) continue; prev[ny * W + nx] = qy * W + qx; q.push([nx, ny]); }
      }
      for (let k = end; k >= 0; k = prev[k]) { const px = k % W, py = Math.floor(k / W), c = g[py][px]; if (DW.SOLID.has(c)) g[py][px] = DW.World.info(c).t === 'water' ? '_' : '='; }
    }
    m.rows = g.map(r => r.join('')); m._racFor = m.rows;
  };
})();
