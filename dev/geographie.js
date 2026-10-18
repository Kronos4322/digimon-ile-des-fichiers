'use strict';
// =====================================================================
//  VALIDATEUR GÉOGRAPHIQUE DU MONDE (outil de développement, jamais chargé par le jeu)
//  Dans la page du jeu : GEO.graphe()  → toutes les cartes extérieures et leurs liaisons PHYSIQUES
//                        GEO.verifier() → les ruptures géographiques, carte par carte, liaison par liaison
//  Liaison physique = sortie de bord (warp avec dir) entre deux cartes extérieures. Les portes, grottes,
//  intérieurs et passages scénarisés (tronc creux...) sont des TRANSITIONS SPÉCIALES : listées à part.
//  Pour chaque liaison A —côté→ B, on compare la bande de 6 cases de chaque côté de la frontière, recalée
//  sur le passage (la case du passage de A correspond à celle du passage de B) :
//    - passage : largeur, alignement du retour, cases praticables des deux côtés, arrivée sur un sol praticable ;
//    - chemin qui débouche dans l'eau (erreur) ; côte d'un seul côté (mer d'un côté, terre de l'autre) ;
//    - rivière qui disparaît à la frontière ; forêt coupée net ; niveaux d'altitude différents (map.alt).
// =====================================================================
(function () {
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const DEPTH = 6;
  const outdoor = id => { const m = DW.MAPS[id]; return m && !m.indoor && (m.rows || m.build || m.spec); };
  // nature d'une case : E eau, F forêt, R roche/falaise, P chemin, S sable, G sol praticable, X autre obstacle
  function kind(m, x, y) {
    const ch = (m.rows[y] || '')[x]; if (ch === undefined) return null;
    const I = DW.World.info(ch) || {};
    if (I.t === 'water') return 'E';
    if (I.t === 'canopy' || I.obj === 'tree' || I.obj === 'bigtree' || I.obj === 'jungletree') return 'F';
    if (I.t === 'cliff' || I.t === 'rock') return 'R';
    if (I.t === 'bridge' || I.t === 'stairs') return 'P';
    if (DW.SOLID.has(ch)) return 'X';
    if (I.t === 'dirt') return 'P';
    if (I.t === 'sand') return 'S';
    return 'G';
  }
  const walk = k => k === 'P' || k === 'S' || k === 'G';
  // cases de la bande frontière : pour chaque position le long du bord, les DEPTH cases vers l'intérieur
  function band(m, side) {
    const len = side === 'left' || side === 'right' ? m.h : m.w, out = [];
    for (let p = 0; p < len; p++) {
      const col = [];
      for (let d = 0; d < DEPTH; d++) { const [x, y] = { left: [d, p], right: [m.w - 1 - d, p], up: [p, d], down: [p, m.h - 1 - d] }[side]; col.push(kind(m, x, y)); }
      out.push(col);
    }
    return out;
  }
  const altAt = (m, x, y) => (m.alt ? m.alt[y * m.w + x] : 0);
  const sideOf = (m, w) => w.dir || (w.y === 0 ? 'up' : w.x === 0 ? 'left' : w.y + (w.h || 1) >= m.h ? 'down' : 'right');
  const span = (w, side) => (side === 'left' || side === 'right' ? [w.y, w.h || 1] : [w.x, w.w || 1]);

  const GEO = window.GEO = {
    // graphe : liaisons physiques et transitions spéciales
    graphe(ids) {
      ids = ids || Object.keys(DW.MAPS).filter(outdoor);
      const phys = [], special = [];
      for (const id of ids) {
        const m = DW.getMap(id);
        for (const w of m.warps || []) {
          const t = DW.MAPS[w.to]; if (!t) continue;
          if (outdoor(w.to) && w.dir && !w.enclos) phys.push({ a: id, side: sideOf(m, w), b: w.to, w });
          else special.push({ a: id, b: w.to, kind: 'sortie spéciale' });
        }
        for (const d of m.doors || []) special.push({ a: id, b: d.to, kind: 'porte' });
      }
      return { phys, special };
    },
    // vérification d'une liaison A —side→ B
    liaison(a, side, b, w) {
      const A = DW.getMap(a), B = DW.getMap(b), out = [], sB = OPP[side];
      const back = (B.warps || []).find(v => v.to === a && sideOf(B, v) === sB && (side === 'left' || side === 'right' ? v.y === w.y : v.x === w.x)) || (B.warps || []).find(v => v.to === a && sideOf(B, v) === sB);   // (plusieurs passages possibles)
      if (!back) { out.push(['ERREUR', `pas de passage retour sur le bord ${sB} de ${b}`]); return out; }
      const [pa, la] = span(w, side), [pb, lb] = span(back, sB);
      if (la !== lb) out.push(['attention', `largeur du passage différente (${la} / ${lb})`]);
      const bA = band(A, side), bB = band(B, sB);
      // passage : praticable des deux côtés, sur toute la profondeur (sinon : chemin qui finit dans l'eau, dans la roche...)
      for (let k = 0; k < Math.min(la, lb); k++) {
        const ca = bA[pa + k] || [], cb = bB[pb + k] || [];
        for (const [col, mm] of [[ca, a], [cb, b]]) {
          const bad = col.findIndex(c => !walk(c));
          if (bad >= 0 && bad < 3) { out.push([col[bad] === 'E' ? 'ERREUR' : 'attention', `passage de ${mm} bloqué (${({ E: 'eau', F: 'forêt', R: 'roche', X: 'obstacle' })[col[bad]] || col[bad]}) à ${bad} case(s) du bord`]); break; }
        }
        // altitude identique de part et d'autre
        const [xa, ya] = { left: [0, pa + k], right: [A.w - 1, pa + k], up: [pa + k, 0], down: [pa + k, A.h - 1] }[side];
        const [xb, yb] = { left: [0, pb + k], right: [B.w - 1, pb + k], up: [pb + k, 0], down: [pb + k, B.h - 1] }[sB];
        if (altAt(A, xa, ya) !== altAt(B, xb, yb)) { out.push(['ERREUR', `altitude du passage différente (${altAt(A, xa, ya)} / ${altAt(B, xb, yb)})`]); break; }
      }
      // le reste de la frontière, recalé sur le passage : eau d'un côté et terre de l'autre, rivières, forêt
      let coastA = 0, coastB = 0, n = 0, rivers = [];
      for (let p = 0; p < bA.length; p++) {
        const q = p - pa + pb; if (q < 0 || q >= bB.length) continue;
        n++;
        const wa = bA[p].slice(0, 3).filter(c => c === 'E').length >= 2, wb = bB[q].slice(0, 3).filter(c => c === 'E').length >= 2;
        if (wa && !wb) coastA++; if (wb && !wa) coastB++;
      }
      if (n && coastA / n > 0.25) out.push(['ERREUR', `côte d'un seul côté : ${Math.round(coastA / n * 100)} % de la frontière est de l'eau chez ${a} et de la terre chez ${b}`]);
      if (n && coastB / n > 0.25) out.push(['ERREUR', `côte d'un seul côté : ${Math.round(coastB / n * 100)} % de la frontière est de l'eau chez ${b} et de la terre chez ${a}`]);
      // rivières (bandes d'eau étroites qui touchent le bord) : doivent se poursuivre en face
      // (une rivière : une bande d'eau étroite qui entre profondément dans la carte, loin des coins ; pas un bout de côte ni de lac)
      const runs = (bb, off) => { const r = []; let s0 = -1; for (let p = 0; p <= bb.length; p++) { const e = p < bb.length && bb[p][0] === 'E'; if (e && s0 < 0) s0 = p; if (!e && s0 >= 0) { const mid = bb[(s0 + p - 1) >> 1]; if (p - s0 <= 8 && s0 > 6 && p < bb.length - 6 && mid.every(c => c === 'E' || c === 'P')) r.push([s0 + off, p - 1 + off]); s0 = -1; } } return r; };
      const wetB = (q0, q1) => { for (let q = q0 - 4; q <= q1 + 4; q++) if (bB[q] && bB[q].slice(0, 4).some(c => c === 'E')) return true; return false; };
      for (const [r0, r1] of runs(bA, -pa + pb)) {
        if (r1 < 0 || r0 >= bB.length) continue;   // (en face, la carte voisine est plus courte : hors frontière)
        if (wetB(r0, r1)) continue;
        rivers.push(`${r0}-${r1}`);
      }
      if (rivers.length) out.push(['ERREUR', `rivière de ${a} qui disparaît à la frontière (en face chez ${b} : positions ${rivers.join(', ')})`]);
      // arrivée sur un sol praticable
      const tm = B, tx = w.tx, ty = w.ty, Z = DW.MapKit.ZOOM[b] && !w._zt ? DW.MapKit.zpt(b, tx, ty) : [tx, ty];
      if (!walk(kind(tm, Z[0], Z[1]))) out.push(['ERREUR', `point d'arrivée (${Z[0]},${Z[1]}) sur un obstacle ou dans l'eau`]);
      return out;
    },
    // ruptures internes de relief : deux cases praticables voisines d'altitudes différentes sans escalier
    relief(id) {
      const m = DW.getMap(id); if (!m.alt) return [];
      const out = [];
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const k = kind(m, x, y); if (!walk(k)) continue;
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const k2 = kind(m, x + dx, y + dy); if (!k2 || !walk(k2)) continue;
          const st = (m.rows[y][x] === '^') || (m.rows[y + dy][x + dx] === '^');
          if (!st && altAt(m, x, y) !== altAt(m, x + dx, y + dy)) out.push(`(${x},${y})→(${x + dx},${y + dy}) : niveau ${altAt(m, x, y)} → ${altAt(m, x + dx, y + dy)} sans escalier`);
        }
      }
      return out;
    },
    verifier(ids) {
      const G = GEO.graphe(ids), rep = [], seen = new Set();
      for (const e of G.phys) {
        const key = [e.a, e.b].sort().join('|') + e.side;
        if (seen.has(key)) continue; seen.add(key);
        const r = GEO.liaison(e.a, e.side, e.b, e.w);
        if (r.length) rep.push({ liaison: `${e.a} —${e.side}→ ${e.b}`, problemes: r });
      }
      for (const id of new Set(G.phys.map(e => e.a))) { const r = GEO.relief(id); if (r.length) rep.push({ liaison: `${id} (relief)`, problemes: r.slice(0, 5).map(t => ['ERREUR', t]) }); }
      return { liaisons: G.phys.length, speciales: G.special.length, ruptures: rep };
    },
    texte(res) { return `${res.liaisons} liaisons physiques, ${res.speciales} transitions spéciales\n` + res.ruptures.map(r => `• ${r.liaison}\n` + r.problemes.map(([s, t]) => `    [${s}] ${t}`).join('\n')).join('\n'); },
  };
})();
