'use strict';
// =====================================================================
//  DESSINS DES DIGIMON — stade Entraînement (Koromon, Tsunomon et Bukamon : images du joueur, gfx/sprites.js)
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
// =====================================================================
(function () {
  Object.assign(DW.DRAW, {
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
    // bulbe rose, fleur bleue sur la tête
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
