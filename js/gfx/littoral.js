'use strict';
// =====================================================================
//  DÉCOR DU BORD DE MER — Plage des Cabines et Crique du Radeau (maps/plage.js)
//  Comme dans l'animé : le radeau des enfants (épisode 14), le jet d'eau de Whamon,
//  une arche de pierre dans la mer, une épave, des crabes et des étoiles de mer.
//  (Les cabines téléphoniques, palmiers et rochers de plage sont dans la légende : gfx/objects.js)
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const SAND = '#e8d29a', FOAM = '#f0fcff';

  Object.assign(OBJ, {
    // ---------------------------------------------------------- radeau en rondins (4×2) : mât, voile rapiécée, lianes
    raft: { w: 64, h: 58, n: 1, draw(d) {
      d.ell(32, 54, 30, 3.6, '#3a5a6a', 0, { flat: true });
      for (let k = 0; k < 7; k++) d.tube([[6, 40 + k * 2], [58, 38 + k * 2]], 2.6, 2.6, k % 2 ? '#a8743c' : '#946232', { tex: 0.35 });
      for (const x of [14, 32, 50]) d.deco.line(x, 38, x + 1, 54, 1.2, '#5a8a3a');
      d.tube([[30, 44], [31, 6]], 1.8, 1.4, '#7a5030');
      d.poly([[32, 8], [52, 14], [50, 34], [32, 36]], '#f0e6d0', { tex: 0.2 });
      d.deco.rect(38, 18, 7, 6, '#d8c8a8'); d.deco.line(32, 20, 50, 22, 0.6, '#c8b898');
      d.tube([[31, 6], [34, 4]], 1, 0.8, '#7a5030');
      d.deco.poly([[34, 4], [40, 5], [34, 7]], '#e84a4a');
    } },
    // ---------------------------------------------------------- jet d'eau de Whamon au large (animé)
    spout: { w: 30, h: 46, n: 1, frames: 4, fps: 6, draw(d, v, f) {
      d.ell(15, 42, 12, 3, '#2a3c92', 0, { flat: true });
      d.ell(15, 41, 9, 2.2, '#1a2458', 0, { flat: true });
      const h = 26 + (f % 2) * 4;
      d.tube([[15, 40], [15, 40 - h]], 2.6, 1.6, '#c8f0ff', { unlit: true });
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45, r = 8 + ((f + i) % 3) * 2; d.circ(15 + Math.cos(a) * r, 40 - h + 2 + Math.sin(a) * r * 0.6, 2.2, '#e8faff', { unlit: true, noline: true }); }
    } },
    // ---------------------------------------------------------- barque amarrée au ponton
    rowboat: { w: 40, h: 22, n: 1, draw(d) {
      d.ell(20, 18, 18, 3, '#1a4a7a', 0, { flat: true });
      d.blob([[1, 9], [6, 18], [34, 18], [39, 9]], '#b05a3a', { tex: 0.2 });
      d.deco.line(4, 12, 36, 12, 0.8, '#7a3a24');
      d.ell(20, 9, 18, 3, '#8a4a2a'); d.deco.ell(20, 9, 16, 2, '#5a3018');
      d.rect(14, 7, 12, 2, '#c8945a', { round: 0.3 });
      d.tube([[8, 9], [2, 4]], 1.2, 1.2, '#c8945a'); d.ell(2, 3.6, 2.4, 1, '#c8945a', -0.6);
    } },
    // ---------------------------------------------------------- arche de pierre dans la mer (4×2), mousse et écume au pied
    rockarch: { w: 88, h: 74, n: 1, draw(d) {
      const R = '#8c847a', Rd = '#5e574e', Rl = '#bab1a4', M = '#5a9a4a';
      d.ell(16, 70, 15, 4, FOAM, 0, { flat: true, unlit: true }); d.ell(72, 70, 15, 4, FOAM, 0, { flat: true, unlit: true });
      d.blob([[4, 70], [2, 44], [8, 26], [20, 16], [28, 30], [27, 70]], R, { tex: 0.35 });                // pilier gauche
      d.blob([[60, 70], [58, 36], [64, 20], [76, 16], [86, 38], [84, 70]], R, { tex: 0.35, far: true });  // pilier droit
      d.tube([[14, 26], [28, 10], [50, 6], [70, 20]], 10, 10, R, { tex: 0.35 });                          // voûte
      d.deco.curve([[16, 24], [29, 12], [50, 9], [67, 20]], 1.4, Rl);
      for (const [x, y] of [[8, 50], [12, 60], [20, 42], [64, 52], [74, 44], [80, 60]]) d.deco.line(x - 5, y, x + 4, y - 1, 0.8, Rd);
      d.blob([[20, 8], [32, 2], [48, 0], [60, 6], [50, 8], [32, 7]], M, { tex: 0.4 });                     // mousse sur le dessus
      for (const [x, y] of [[26, 4], [44, 2], [56, 6]]) d.deco.circ(x, y, 1.2, '#f0e070', { unlit: true });
      for (let k = 0; k < 5; k++) d.deco.circ(6 + k * 4, 67 - (k % 2), 1.4, FOAM, { unlit: true });
    } },
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
    starfish: { w: 12, h: 10, n: 2, draw(d, v) {
      const C = v ? '#f0a040' : '#e86a8a', pts = [];
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.8 : 4.6; pts.push([6 + Math.cos(a) * r, 5.4 + Math.sin(a) * r * 0.8]); }
      d.poly(pts, C, { flat: true });
      d.deco.circ(6, 5.4, 0.8, '#fff0d0');
    } },
  });
})();
