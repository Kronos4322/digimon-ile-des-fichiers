'use strict';
// =====================================================================
//  LA GRILLE DU MONDE : une seule référence de positions pour toutes les cartes extérieures
//  Axes : x vers l'EST, y vers le SUD (en cases), z = altitude (niveau de relief de la case, maps/relief.js).
//  Origine : le coin nord-ouest de la Clairière de l'Arrivée (là où tout commence). Chaque carte a une position
//  exacte { x, y, w, h } : une voisine est posée contre le bord commun, son passage aligné sur celui d'en face.
//  Le calcul est déterministe (parcours trié), il ne dépend ni de l'ordre de chargement ni de la génération.
//  Côtés : nord (up), est (right), sud (down), ouest (left). Pour chaque côté d'une carte, on connaît les voisines
//  qui le touchent et sur quelle portion (une carte peut avoir plusieurs voisines d'un même côté) : c'est ce qui
//  sert aux passages, aux fondus de couleur entre biomes (gfx/terrain.js) et aux outils (dev/assemblage.js,
//  dev/geographie.js). Les incohérences (boucle qui ne se referme pas, cartes qui se chevauchent) sont listées.
// =====================================================================
(function () {
  const MAPS = DW.MAPS, OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const SIDES = ['up', 'right', 'down', 'left'];
  const outdoor = id => !!MAPS[id] && !MAPS[id].indoor;
  // dimensions sans construire la carte (régions : connues d'avance ; cartes faites main : lignes ou plan agrandi)
  function dims(id) {
    if (DW.PUZZLE && DW.PUZZLE.isPiece(id)) return DW.PUZZLE.case;   // (une pièce du puzzle a toujours la taille commune)
    const m = MAPS[id];
    if (m.w && m.h) return [m.w, m.h];
    if (m.rows) return [Math.max(...m.rows.map(r => r.length)), m.rows.length];
    const Z = DW.MapKit && DW.MapKit.ZOOM[id]; if (Z) return [Z[1] * Z[0], Z[2] * Z[0]];
    const g = DW.getMap(id); return [g.w, g.h];
  }
  // LE CŒUR DU MONDE : les cartes des chapitres déjà construits (1 à 3) sont posées EN PREMIER et font foi ; une carte
  // d'un chapitre futur qui les contredit (boucle, chevauchement) est marquée « hors grille » en attendant d'être refaite
  const CORE = new Set(['foret', 'plage', 'lac', 'village', 'miharashi']), DISTRICTS = new Set(['residentiel', 'numerique', 'marche']);
  const core = id => (DW.PUZZLE ? DW.PUZZLE.isPiece(id) : CORE.has(MAPS[id].region) && !DISTRICTS.has(id));
  let POS = null, CONF = [], BAD = new Set();
  function build(root = 'clairiere') {
    POS = {}; CONF = []; BAD = new Set();
    const queue = [];
    // les pièces du puzzle (maps/puzzle.js) sont posées d'office ; les autres cartes s'y accrochent par leurs passages
    if (DW.PUZZLE) for (const id in DW.PUZZLE.pieces) if (MAPS[id]) { POS[id] = DW.PUZZLE.pos(id); queue.push(id); }
    if (!queue.length) { const [w0, h0] = dims(root); POS[root] = { x: 0, y: 0, w: w0, h: h0 }; queue.push(root); }
    while (queue.length) {
      queue.sort((a, b) => (core(b) - core(a)) || (a < b ? -1 : 1));   // (parcours déterministe ; le cœur d'abord)
      const id = queue.shift(), A = MAPS[id], P = POS[id];
      for (const w of A.warps || []) {
        if (!w.dir || w.enclos || !outdoor(w.to)) continue;
        const B = MAPS[w.to], same = v => v.to === id && v.dir === OPP[w.dir];
        // (plusieurs passages vers une même carte : le retour est celui qui est au même endroit le long du bord)
        const vert = w.dir === 'left' || w.dir === 'right', back = (B.warps || []).find(v => same(v) && (vert ? v.y === w.y : v.x === w.x)) || (B.warps || []).find(same); if (!back) continue;
        const [bw, bh] = dims(w.to);
        const p = w.dir === 'left' ? [P.x - bw, P.y + w.y - back.y] : w.dir === 'right' ? [P.x + P.w, P.y + w.y - back.y]
          : w.dir === 'up' ? [P.x + w.x - back.x, P.y - bh] : [P.x + w.x - back.x, P.y + P.h];
        const Q = POS[w.to];
        if (Q) { if (Q.x !== p[0] || Q.y !== p[1]) { CONF.push(`${id} → ${w.to} : (${p}) au lieu de (${Q.x},${Q.y})`); for (const k of [id, w.to]) if (!core(k)) BAD.add(k); if (core(id) && core(w.to)) { BAD.add(id); BAD.add(w.to); } } continue; }
        if (!core(w.to) && core(id) === false && BAD.has(id)) continue;   // (on ne prolonge pas une partie déjà hors grille)
        POS[w.to] = { x: p[0], y: p[1], w: bw, h: bh }; queue.push(w.to);
      }
    }
    // chevauchements
    const ids = Object.keys(POS);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = POS[ids[i]], b = POS[ids[j]];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
        CONF.push(`${ids[i]} chevauche ${ids[j]}`);
        const ci = core(ids[i]), cj = core(ids[j]);
        if (ci && cj) { BAD.add(ids[i]); BAD.add(ids[j]); } else if (!ci) BAD.add(ids[i]); else BAD.add(ids[j]);
      }
    }
    return POS;
  }
  // (la grille n'est calculée qu'une fois tous les passages posés : DW.Monde.pret, à la fin de maps/regions.js)
  const all = () => POS || (W.pret ? build() : {});

  const W = DW.Monde = {
    SIDES, OPP, build, dims, pret: false,
    pos: id => all()[id] || null,
    conflits: () => (all(), CONF),
    horsGrille: () => (all(), [...BAD]),   // cartes à replacer (chapitres futurs qui contredisent la géographie)
    coeur: id => !!MAPS[id] && core(id),
    // conversion : case du monde → carte et case locale
    toLocal(X, Y) { for (const id in all()) { const p = POS[id]; if (X >= p.x && X < p.x + p.w && Y >= p.y && Y < p.y + p.h) return { id, x: X - p.x, y: Y - p.y }; } return null; },
    // altitude d'une case du monde (0 hors relief, ou si la carte n'est pas encore construite)
    z(X, Y) { const L = W.toLocal(X, Y); if (!L) return 0; const m = MAPS[L.id]; const a = m.alt ? m.alt[L.y * m.w + L.x] : 0; return a === (DW.Relief && DW.Relief.PASS) ? 0 : a || 0; },
    // voisines de chaque côté : [{ side, id, from, to }] (from..to : portion du bord, en cases locales)
    voisines(id) {
      const p = all()[id], out = []; if (!p || BAD.has(id)) return out;
      for (const nid in POS) {
        if (nid === id || BAD.has(nid)) continue;
        const q = POS[nid];
        const vert = (a0, a1, b0, b1) => [Math.max(a0, b0), Math.min(a1, b1)];
        let side = null, r = null;
        if (q.x === p.x + p.w) { side = 'right'; r = vert(p.y, p.y + p.h, q.y, q.y + q.h); }
        else if (q.x + q.w === p.x) { side = 'left'; r = vert(p.y, p.y + p.h, q.y, q.y + q.h); }
        else if (q.y === p.y + p.h) { side = 'down'; r = vert(p.x, p.x + p.w, q.x, q.x + q.w); }
        else if (q.y + q.h === p.y) { side = 'up'; r = vert(p.x, p.x + p.w, q.x, q.x + q.w); }
        if (!side || r[1] - r[0] <= 0) continue;
        const o = side === 'left' || side === 'right' ? p.y : p.x;
        out.push({ side, id: nid, from: r[0] - o, to: r[1] - o });
      }
      return out;
    },
    // annotation d'une carte au moment où on la prépare : sa place et ses voisines (pour les fondus de couleur)
    annoter(id) {
      const m = MAPS[id]; if (!m || m.indoor || !W.pret) return;
      const p = W.pos(id); m.monde = p ? { x: p.x, y: p.y } : null;
      m.voisines = p ? W.voisines(id) : [];
    },
  };
})();
