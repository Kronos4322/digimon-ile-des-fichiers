'use strict';
// =====================================================================
//  DESSINS DES DIGIMON — stade Bébé (Botamon est dans agumon.js ; Punimon, Nyokimon, Pabumon et Poyomon : images du
//  joueur, gfx/sprites.js)
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
// =====================================================================
(function () {
  Object.assign(DW.DRAW, {
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
  });
})();
