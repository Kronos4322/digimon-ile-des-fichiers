'use strict';
// =====================================================================
//  DESSINS DES DIGIMON — stade Entraînement
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
// =====================================================================
(function () {
  const W = '#fbf6ea';
  Object.assign(DW.DRAW, {
    bukamon(d) {
      const T = '#a89e94', Tl = '#f0e4cc', O = '#f2722a', Y = '#ffc848';
      d.tube([[26, 52], [16, 58.5], [8, 56], [6, 50]], 9, 3, T);
      d.ell(4.6, 46.6, 3.4, 6, T, 0.3); d.ell(9, 45.4, 2.8, 5, T, -0.5);
      d.deco.line(4, 43, 5, 50, 0.6, '#7a7068');
      d.ell(28, 42, 4.2, 2.4, T, 0.7, { far: true });
      d.ell(32, 46, 12.5, 12, T);
      d.deco.ell(36.5, 48, 7, 9, Tl);
      d.tube([[34, 41], [38, 30]], 13, 11, T, { noline: true });
      d.deco.ell(41, 36, 4, 6, Tl);
      d.ell(41, 21, 13, 11, T);
      d.ell(51, 25.5, 8.4, 7, T, 0.1, { noline: true });
      d.deco.ell(51.5, 29.5, 7, 3.6, '#6a1a2a', 0.1, { unlit: true });
      d.deco.ell(51.5, 31, 4, 1.6, '#e86a8a');
      d.deco.poly([[46, 27.6], [47, 29.8], [48, 27.6]], '#ffffff', { unlit: true }); d.deco.poly([[54, 27.6], [55, 29.8], [56, 27.4]], '#ffffff', { unlit: true });
      d.deco.ell(57.6, 22.6, 0.8, 0.6, '#5a5048', 0, { unlit: true });
      d.poly([[35, 13], [31.6, 5], [36, 8], [37, 0.5], [41, 7], [44.6, 2.6], [43.4, 12]], O, { shiny: true });
      d.deco.poly([[36.6, 11.6], [37.4, 5], [40.4, 9.6], [42.6, 6.4], [41.8, 11.6]], Y, { unlit: true });
      d.eye(45.6, 18.4, 4.4, 5.2, '#3a72e0', { look: 0.35 });
      d.deco.ell(36, 24, 2.4, 1.2, '#cfc4b8');
      d.ell(42.6, 42.4, 5.2, 2.6, T, 0.7);
    },
    tanemon(d) {
      const B = '#f4f6e2', G = '#5aa040', Gd = '#2e7a2a', E = '#8a2a1a';
      d.curve([[30, 26], [26, 14], [18, 9], [12, 13]], 3.6, Gd);
      d.curve([[34, 26], [38, 13], [46, 8], [52, 12]], 3.6, Gd);
      d.curve([[32, 26], [32, 12], [30, 6]], 3, G);
      d.deco.line(20, 10, 15, 12, 0.6, '#6aba50'); d.deco.line(44, 9, 49, 11, 0.6, '#6aba50');
      d.ell(24, 58.5, 4.6, 3, '#d8dcc0'); d.ell(40, 59, 4.6, 3, '#d8dcc0');
      d.ell(32, 42, 20, 17.5, B);
      d.deco.blob([[13, 40], [16, 30], [24, 25], [32, 24], [40, 25], [48, 30], [51, 40], [44, 34], [38, 37], [32, 33], [26, 37], [20, 34]], G);
      d.deco.line(24, 28, 22, 33, 0.7, Gd); d.deco.line(40, 28, 42, 33, 0.7, Gd);
      d.eye(35, 44, 4.6, 5.2, E, { look: 0.3 });
      d.eye(46.6, 44.6, 3.9, 4.8, E, { look: 0.3 });
      d.deco.curve([[38.6, 51.6], [40.4, 53], [42.2, 51.6]], 0.8, '#7a3020', { unlit: true });
      d.deco.ell(28.6, 50, 2.8, 1.5, '#ffb0b0'); d.deco.ell(51, 50.4, 2.2, 1.3, '#ffb0b0');
    },
    // boule de poils orange, corne bleu-violet, grands yeux rouges (partenaire de Matt)
    tsunomon(d) {
      const O = '#f0a040', Od = '#c87428', L = '#ffd27a', H = '#8a90e8';
      d.ell(32, 45, 19.5, 16.5, O, 0, { tex: 0.25 });
      // touffe de poils sur le crâne (mèches pointues)
      d.blob([[13, 40], [12, 31], [17, 33], [18, 24], [23, 29], [27, 21], [31, 28], [36, 22], [39, 29], [45, 25], [46, 32], [52, 30], [51, 39], [32, 36]], O, { tex: 0.3 });
      d.deco.line(20, 30, 22, 36, 0.7, Od); d.deco.line(30, 26, 31, 33, 0.7, Od); d.deco.line(43, 28, 42, 34, 0.7, Od);
      d.deco.ell(25, 52, 8, 5, L);
      // corne
      d.tube([[38, 28], [40, 16], [43, 5]], 7, 1.2, H, { shiny: true });
      d.deco.line(36.2, 23, 41, 22, 0.8, '#5a5ab0'); d.deco.line(37.6, 16, 42, 15.4, 0.8, '#5a5ab0');
      // visage
      d.eye(37, 42, 5, 6, '#d02828', { look: 0.35 });
      d.eye(49, 43, 4.2, 5.6, '#d02828', { look: 0.35 });
      d.deco.ell(45, 53.6, 7, 3.4, '#5a1018', 0, { unlit: true });
      d.deco.ell(45, 55.2, 4, 1.4, '#e8607a');
      d.deco.poly([[40.4, 51.6], [41.8, 54], [43, 51.6]], '#ffffff', { unlit: true });
      d.ell(17, 59, 4, 2.2, Od, 0, { far: true }); d.ell(44, 60, 4, 2.2, Od);
    },
    // petite boule noire duveteuse aux yeux jaunes (stade Bébé)
    yokomon(d) {
      const P = '#fad8e0', Bl = '#3a66e0', Bd = '#2440a8', Y = '#ffd84a', G = '#3e9a3e';
      d.tube([[26, 56], [22, 61]], 2.4, 1.6, '#e8b0c0', { far: true }); d.tube([[38, 56], [42, 61]], 2.4, 1.6, '#e8b0c0', { far: true });
      d.ell(32, 46, 15, 13.5, P);
      d.poly([[25, 36], [32, 29], [39, 36]], P, { noline: true });
      d.deco.line(26, 42, 28, 54, 0.6, '#f0b8c8'); d.deco.line(38, 42, 36, 54, 0.6, '#f0b8c8');
      d.tube([[32, 31], [32, 22]], 2.6, 2.2, G);
      d.ell(26, 12, 7, 4, Bl, -0.9, { far: true }); d.ell(38, 12, 7, 4, Bl, 0.9, { far: true });
      d.ell(19, 19, 10, 4.4, Bl, -0.25); d.ell(45, 19, 10, 4.4, Bl, 0.25);
      d.ell(32, 21, 9, 4.6, Bl);
      d.deco.ell(19, 19, 6, 2, Bd, -0.25); d.deco.ell(45, 19, 6, 2, Bd, 0.25);
      d.curve([[30, 18], [28, 9]], 0.9, Y); d.curve([[32, 18], [32, 7]], 0.9, Y); d.curve([[34, 18], [36, 9]], 0.9, Y);
      d.circ(28, 8.6, 1.3, Y); d.circ(36, 8.6, 1.3, Y);
      d.curve([[32, 7], [33.6, 3], [31, 1.4], [29.8, 3.6]], 1.6, '#f07a2a');
      d.eye(36.6, 46, 3.8, 4.6, '#2a9a4a', { look: 0.3 });
      d.eye(45, 47, 3.2, 4.2, '#2a9a4a', { look: 0.3 });
      d.deco.curve([[39, 53.6], [41, 55], [43, 53.6]], 0.8, '#a04060', { unlit: true });
    },
  });
})();
