'use strict';
// =====================================================================
//  DESSINS DES DIGIMON — stade Bébé (Botamon est dans agumon.js)
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
// =====================================================================
(function () {
  Object.assign(DW.DRAW, {
    // boule rouge gélatineuse à trois pointes jaunes
    punimon(d) {
      const R = '#ee5a6a', Rd = '#c83a50', Rl = '#ffb0b8', Y = '#f8d040';
      d.poly([[22, 33], [20, 20], [28, 30]], Y, { shiny: true, far: true });
      d.poly([[30, 30], [32, 15], [37, 30]], Y, { shiny: true });
      d.poly([[39, 32], [46, 20], [45, 35]], Y, { shiny: true });
      d.ell(32, 47, 19, 15.4, R, 0, { shiny: true });
      d.ell(32, 60, 17, 3, R, 0, { noline: true });
      d.deco.ell(24, 38, 6, 3.4, Rl, -0.4);
      d.deco.ell(22.6, 36.6, 2, 1, '#ffffff', -0.4, { unlit: true });
      d.deco.curve([[15, 50], [17, 56], [22, 59.4]], 0.9, Rd);
      d.eye(38, 46, 4.2, 5.4, '#2a2a3a', { look: 0.35, white: '#fff6c0' });
      d.eye(48.6, 46.6, 3.6, 5, '#2a2a3a', { look: 0.35, white: '#fff6c0' });
      d.deco.curve([[41, 54.6], [44, 56.4], [47, 54.6]], 1, '#7a1020', { unlit: true });
      d.deco.ell(34.4, 52.6, 2.4, 1.3, '#ff8a9a'); d.deco.ell(51.6, 52.4, 1.8, 1.1, '#ff8a9a');
    },
    // petit poisson-bulle aux nageoires duveteuses
    pichimon(d) {
      const B = '#d6e6f4', Bd = '#9ab6d4', Bl = '#ffffff', F = '#a8c8ec';
      d.poly([[14, 44], [3, 36], [6, 46], [2, 56], [15, 51]], F, { shiny: true });
      d.deco.line(5, 39, 13, 46, 0.6, Bd); d.deco.line(5, 53, 13, 50, 0.6, Bd);
      d.ell(32, 48, 19, 14, B, 0, { shiny: true });
      d.poly([[26, 36], [30, 25], [38, 35]], F, { shiny: true });
      d.deco.line(30, 27, 31, 35, 0.6, Bd);
      d.deco.ell(26, 41, 7, 3.6, Bl, -0.3);
      d.deco.ell(36, 55.6, 10, 3.6, '#eef4fa');
      d.ell(28, 58, 4, 2.4, F, 0.5, { far: true }); d.ell(38, 59, 4.4, 2.4, F, -0.4);
      d.eye(40, 45, 4.4, 5.6, '#1a2a4a', { look: 0.4 });
      d.eye(50, 46, 3.6, 5, '#1a2a4a', { look: 0.4 });
      d.deco.ell(47, 53.6, 2, 1.4, '#4a2a3a', 0, { unlit: true });
      // bulles
      d.deco.circ(56, 40, 1.6, Bl, { unlit: true }); d.deco.circ(59, 35, 1.1, Bl, { unlit: true });
      d.deco.ell(36.6, 51, 2, 1.1, '#ffb8c8'); d.deco.ell(53, 51, 1.6, 1, '#ffb8c8');
    },
    // graine de pissenlit toute duveteuse
    yuramon(d) {
      const Wt = '#fbf8f0', Wd = '#d8d4c8', St = '#7aa040', Sl = '#c8e070';
      // aigrettes duveteuses autour du corps
      const fl = [];
      for (let i = 0; i <= 40; i++) {
        const a = Math.PI * 0.9 + (i / 40) * Math.PI * 1.2, r = i % 2 ? 20 : 16.4;
        fl.push([32 + Math.cos(a) * r * 1.05, 47 + Math.sin(a) * r]);
      }
      fl.push([53, 61], [11, 61]);
      d.poly(fl, Wt, { tex: 0.25 });
      d.ell(32, 50, 17.6, 12, Wt, 0, { tex: 0.2 });
      for (let i = 0; i < 7; i++) { const a = Math.PI * 1.1 + i * 0.2; d.deco.line(32 + Math.cos(a) * 9, 46 + Math.sin(a) * 8, 32 + Math.cos(a) * 17, 46 + Math.sin(a) * 15, 0.6, Wd); }
      // petite tige-pousse sur le dessus
      d.tube([[32, 29], [31, 23], [34, 19]], 1.8, 1.2, St);
      d.ell(36.4, 18.6, 3.4, 1.8, Sl, -0.4);
      d.eye(37, 48, 3.6, 4.6, '#2a2a2a', { look: 0.3 });
      d.eye(47, 48.4, 3, 4.2, '#2a2a2a', { look: 0.3 });
      d.deco.curve([[40.6, 55.4], [42.4, 56.6], [44, 55.4]], 0.8, '#a05a4a', { unlit: true });
      d.deco.ell(33.4, 54, 2.2, 1.2, '#ffc8c0'); d.deco.ell(50, 54, 1.8, 1, '#ffc8c0');
    },
    // bourgeon sur pattes, bouton de fleur rose sur la tête
    nyokimon(d) {
      const G = '#a8d86a', Gd = '#6aa040', Gl = '#e0f8b0', P = '#f490b8', Pd = '#d0608a';
      // bouton de fleur
      d.ell(26, 22, 5, 10, P, -0.5, { far: true });
      d.ell(36, 20, 5.6, 11, P, 0.35, { shiny: true });
      d.ell(31, 18, 5, 12, P, -0.05, { shiny: true });
      d.deco.curve([[31, 8], [31, 26]], 0.7, Pd);
      d.ell(32, 30, 8, 3.6, Gd);
      // corps-bulbe
      d.blob([[18, 44], [22, 32], [32, 29], [43, 32], [47, 44], [43, 56], [32, 60], [21, 56]], G);
      d.deco.ell(26, 38, 5, 3, Gl, -0.4);
      d.deco.curve([[20, 48], [23, 55]], 0.8, Gd);
      // petites pattes
      d.ell(26, 60, 4, 2.4, Gd, 0, { far: true }); d.ell(38, 60.4, 4.4, 2.6, Gd);
      d.eye(36, 44, 3.6, 4.6, '#2a2a2a', { look: 0.35 });
      d.eye(44.6, 44.6, 3, 4.2, '#2a2a2a', { look: 0.35 });
      d.deco.curve([[38.6, 51.4], [40.6, 52.8], [42.6, 51.4]], 0.8, '#5a2a1a', { unlit: true });
      d.deco.ell(33, 50, 2, 1.1, '#ffb0c0'); d.deco.ell(46, 49.6, 1.6, 1, '#ffb0c0');
    },
  });
})();
