'use strict';
// =====================================================================
//  DÉCOR DU BORD DE MER — Plage des Cabines et Crique du Radeau (maps/plage.js)
//  Comme dans l'animé : le jet d'eau de Whamon ; l'épave et les crabes sont peints (gfx/peints.js).
//  (Radeau, barque, arche, étoiles de mer : images du joueur, gfx/textures.js ; ici leur secours)
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;

  Object.assign(OBJ, {
    // ---------------------------------------------------------- radeau en rondins (4×2 ; image du joueur)
    raft: { w: 64, h: 58, n: 1, draw: DW.World.secours.bois(64, 58) },
    // ---------------------------------------------------------- jet d'eau de Whamon au large (animé)
    spout: { w: 30, h: 46, n: 1, frames: 4, fps: 6, draw(d, v, f) {
      d.ell(15, 42, 12, 3, '#2a3c92', 0, { flat: true });
      d.ell(15, 41, 9, 2.2, '#1a2458', 0, { flat: true });
      const h = 26 + (f % 2) * 4;
      d.tube([[15, 40], [15, 40 - h]], 2.6, 1.6, '#c8f0ff', { unlit: true });
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45, r = 8 + ((f + i) % 3) * 2; d.circ(15 + Math.cos(a) * r, 40 - h + 2 + Math.sin(a) * r * 0.6, 2.2, '#e8faff', { unlit: true, noline: true }); }
    } },
    // ---------------------------------------------------------- barque amarrée au ponton
    rowboat: { w: 40, h: 22, n: 1, draw: DW.World.secours.bois(40, 22) },
    // ---------------------------------------------------------- arche de pierre dans la mer (4×2 ; image du joueur)
    rockarch: { w: 88, h: 74, n: 1, draw: DW.World.secours.rocher(88, 74) },
    // ---------------------------------------------------------- épave à moitié ensablée (4×2) : coque, membrures, mât brisé
    wreck: { w: 80, h: 50, n: 1 },   // (peinte : gfx/peints.js)
    // ---------------------------------------------------------- petit crabe rouge qui agite ses pinces (on marche à côté)
    crab: { w: 18, h: 12, n: 2, frames: 2, fps: 3 },   // (peint : gfx/peints.js)
    // ---------------------------------------------------------- étoile de mer posée sur le sable mouillé
    starfish: { w: 12, h: 10, n: 2, draw: DW.World.secours.pierre(12, 10) },
  });
})();
