'use strict';
// Cohérence des liens entre cartes extérieures (à lancer dans la page du jeu : LIENS.check(['clairiere', ...])).
//  - chaque sortie est sur le bon bord (dir) et la carte d'arrivée a une sortie de retour sur le bord opposé ;
//  - l'arrivée de l'aller tombe à côté de la sortie de retour (on ressort là où l'on est entré) ;
//  - pour chaque bord : ce qu'on y trouve (mer, plage, falaise/forêt, sorties).
(function () {
  const OPP = DW.OPP;
  const sideOf = (m, w) => w.dir || (w.y === 0 ? 'up' : w.x === 0 ? 'left' : w.y + (w.h || 1) >= m.h ? 'down' : 'right');
  function edge(m, side) {
    const cells = [];
    if (side === 'up' || side === 'down') { const y = side === 'up' ? 0 : m.h - 1; for (let x = 0; x < m.w; x++) cells.push(m.rows[y][x]); }
    else { const x = side === 'left' ? 0 : m.w - 1; for (let y = 0; y < m.h; y++) cells.push(m.rows[y][x]); }
    const n = { mer: 0, sable: 0, solide: 0, libre: 0 };
    for (const ch of cells) { const I = DW.World.info(ch) || {}; if (I.t === 'water') n.mer++; else if (DW.SOLID.has(ch)) n.solide++; else if (I.t === 'sand') n.sable++; else n.libre++; }
    return n;
  }
  window.LIENS = {
    check(ids) {
      const out = [];
      for (const id of ids) {
        const m = DW.getMap(id);
        for (const w of m.warps || []) {
          const t = DW.MAPS[w.to]; if (!t) { out.push(`${id} : sortie vers ${w.to} INEXISTANTE`); continue; }
          if (t.indoor) continue;
          const tm = DW.getMap(w.to), d = sideOf(m, w);
          const back = (tm.warps || []).filter(b => b.to === id);
          if (!back.length) { out.push(`${id} → ${w.to} : PAS DE RETOUR`); continue; }
          const vert = d === 'left' || d === 'right', b = back.find(b => sideOf(tm, b) === OPP[d] && (vert ? b.y === w.y : b.x === w.x)) || back.find(b => sideOf(tm, b) === OPP[d]);
          if (!b) out.push(`${id} → ${w.to} (${d}) : retour sur le bord ${back.map(b => sideOf(tm, b)).join('/')} au lieu de ${OPP[d]}`);
          else {
            const Z = DW.MapKit.ZOOM[w.to] && !w._zt ? DW.MapKit.zpt(w.to, w.tx, w.ty) : [w.tx, w.ty], ax = Z[0], ay = Z[1], near = ax >= b.x - 2 && ax <= b.x + (b.w || 1) + 1 && ay >= b.y - 2 && ay <= b.y + (b.h || 1) + 1;
            if (!near) out.push(`${id} → ${w.to} : arrivée (${ax},${ay}) loin de la sortie de retour (${b.x},${b.y})`);
          }
        }
        const bords = ['up', 'right', 'down', 'left'].map(s => {
          const e = edge(m, s), ws = (m.warps || []).filter(w => sideOf(m, w) === s).map(w => w.to);
          return `${s}:${ws.length ? '→' + ws.join(',') : ''} mer${e.mer} sable${e.sable} solide${e.solide} libre${e.libre}`;
        });
        out.push(`  ${id} [${m.name}] ${bords.join(' | ')}`);
      }
      return out.join('\n');
    },
  };
})();
