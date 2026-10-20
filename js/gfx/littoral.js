'use strict';
// =====================================================================
//  DÉCOR DU BORD DE MER — Plage des Cabines et Crique du Radeau (maps/plage.js)
//  Comme dans l'animé : le jet d'eau de Whamon, une épave, des crabes.
//  (Radeau, barque, arche, étoiles de mer, palmiers, rochers : images du joueur, gfx/textures.js ; ici leur secours)
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const SAND = '#e8d29a', FOAM = '#f0fcff';

  Object.assign(OBJ, {
    // ---------------------------------------------------------- radeau en rondins (4×2) : mât, voile rapiécée, lianes
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
    // ---------------------------------------------------------- arche de pierre dans la mer (4×2), mousse et écume au pied
    rockarch: { w: 88, h: 74, n: 1, draw: DW.World.secours.rocher(88, 74) },
    // ---------------------------------------------------------- épave à moitié ensablée (4×2) : coque, membrures, mât brisé
    wreck: { w: 80, h: 50, n: 1, draw(d) {
      const Wd = '#7a4a2a', Wl = '#a06a3a', Wk = '#4a2a16';
      d.ell(40, 46, 36, 4, '#b89a62', 0, { flat: true });
      for (let k = 0; k < 5; k++) d.tube([[50 + k * 4, 44], [48 + k * 4, 22 - k], [54 + k * 4, 16 - k]], 1.6, 1.2, Wk, { far: true });   // membrures nues
      d.blob([[4, 32], [12, 44], [52, 46], [62, 40], [58, 30], [12, 28]], Wd, { tex: 0.35 });                   // coque
      for (let k = 0; k < 4; k++) d.deco.curve([[8, 32 + k * 3], [30, 34 + k * 3], [56, 32 + k * 3]], 0.6, Wk);
      d.deco.rect(30, 30, 6, 4, '#2a1a10');                                                                     // trou dans la coque
      d.tube([[30, 32], [38, 6]], 2.2, 1.4, Wl); d.tube([[38, 6], [44, 2]], 1.4, 1, Wl);                          // mât brisé
      d.poly([[37, 10], [52, 16], [46, 26], [36, 22]], '#d8ccb0', { tex: 0.3 });                                // voile déchirée
      d.deco.poly([[44, 18], [50, 22], [46, 25]], '#b8a888');
      d.blob([[0, 42], [6, 36], [18, 40], [26, 46], [0, 48]], SAND, { tex: 0.3 });                              // sable qui l'ensevelit
      d.blob([[54, 48], [62, 40], [74, 42], [80, 48]], SAND, { tex: 0.3 });
    } },
    // ---------------------------------------------------------- petit crabe rouge qui agite ses pinces (on marche à côté)
    crab: { w: 18, h: 12, n: 2, frames: 2, fps: 3, draw(d, v, f) {
      const C = v ? '#e8783a' : '#d84a3a', Cd = v ? '#b0502a' : '#9a2a22';
      d.ell(9, 11, 7, 1.4, '#7a6a4a', 0, { flat: true });
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) d.deco.line(9 + s * 3, 8, 9 + s * (6 + k), 10 - k + (f && k === 1 ? -1 : 0), 0.6, Cd);
      d.ell(9, 7.6, 4.6, 3, C, 0, { shiny: true });
      const up = f ? -1.4 : 0;
      d.circ(3, 5 + up, 1.8, C); d.circ(15, 5 - up, 1.8, C);
      d.deco.line(5, 7, 4, 6 + up, 0.6, Cd); d.deco.line(13, 7, 14, 6 - up, 0.6, Cd);
      d.deco.circ(7.6, 4.6, 0.8, '#1a1a1a'); d.deco.circ(10.4, 4.6, 0.8, '#1a1a1a');
    } },
    // ---------------------------------------------------------- étoile de mer posée sur le sable mouillé
    starfish: { w: 12, h: 10, n: 2, draw: DW.World.secours.pierre(12, 10) },
  });
})();
