'use strict';
// =====================================================================
//  DESSINS — lignées d'Izzy (Motimon) et de T.K. (Tokomon) ; Pabumon et Poyomon : images du joueur (gfx/sprites.js)
//  d'après les modèles officiels (wikimon.net). Repère 64x64, tourné vers la DROITE, sol à y≈62.
// =====================================================================
(function () {
  Object.assign(DW.DRAW, {
    // mochi rose pâle, petits bras griffus, bas ondulé, bouche ouverte
    motimon(d) {
      const P = '#f6d6dc', Pd = '#dca8b4', Pl = '#fff2f4', K = '#1a1a22';
      d.tube([[20, 40], [13, 36], [10, 30]], 3.4, 2.6, Pd, { far: true });
      for (let i = 0; i < 3; i++) d.tube([[10, 30], [7 + i * 2, 27 - (i % 2)]], 0.9, 0.4, '#3a3a44', { far: true });
      d.blob([[18, 60], [17, 46], [19, 30], [26, 20], [36, 18], [45, 23], [49, 34], [48, 48], [50, 60], [45, 57], [40, 61], [34, 57], [28, 61], [23, 57]], P, { shiny: true });
      d.deco.ell(27, 27, 6, 4, Pl, -0.4); d.deco.ell(25.6, 25.6, 1.8, 1.1, '#ffffff', -0.4, { unlit: true });
      d.tube([[46, 40], [53, 36], [56, 30]], 3.4, 2.6, P);
      for (let i = 0; i < 3; i++) d.tube([[56, 30], [54 + i * 2.4, 26 - (i % 2)]], 0.9, 0.4, '#3a3a44');
      d.eye(35, 30, 3.4, 4, K, { look: 0.3, white: '#2a2a32' }); d.eye(45, 30.6, 2.8, 3.6, K, { look: 0.3, white: '#2a2a32' });
      d.deco.circ(34, 28.4, 1.1, '#ffffff', { unlit: true }); d.deco.circ(44.2, 29, 0.9, '#ffffff', { unlit: true });
      d.deco.blob([[37, 37], [45, 37], [43, 44], [39, 44]], '#c83a4a', { unlit: true });
      d.deco.ell(41, 42.4, 2, 1.2, '#f07080', 0, { unlit: true });
      d.deco.ell(30, 36, 2.2, 1.2, '#f4a0b0'); d.deco.ell(49, 36, 1.6, 1, '#f4a0b0');
    },
    // boule blanche, longues oreilles à pointe rose, quatre petites pattes
    tokomon(d) {
      const W = '#fbf8f6', Wd = '#ddd4d0', Pk = '#f4b0c4', Pd = '#e08aa4', K = '#1a1a22';
      d.tube([[24, 30], [16, 20], [10, 22], [8, 30]], 5.4, 4, W, { far: true }); d.ell(8, 32, 3.6, 4.4, Pk, 0.3, { far: true });
      d.ell(22, 58, 4, 3, Wd, 0, { far: true }); d.ell(40, 58.4, 4, 3, Wd, 0, { far: true });
      d.ell(32, 46, 19, 14, W, 0, { shiny: true });
      d.deco.ell(36, 52, 10, 5, '#fde8ee');
      d.ell(26, 59, 4.2, 3, W); d.ell(44, 59.4, 4.4, 3, W);
      d.deco.ell(26, 60.4, 2.6, 1, Pk); d.deco.ell(44, 60.8, 2.6, 1, Pk);
      d.tube([[34, 33], [38, 20], [46, 14], [52, 18]], 6, 4.4, W); d.ell(53.6, 20, 4, 4.6, Pk, 0.4);
      d.deco.curve([[38, 24], [44, 17]], 0.8, Pk);
      d.deco.ell(23, 38, 6, 3.4, '#ffffff', -0.4, { unlit: true });
      d.eye(40, 42, 2.2, 2.8, K, { look: 0.35, white: '#22222a' }); d.eye(48, 42.4, 1.9, 2.5, K, { look: 0.35, white: '#22222a' });
      d.deco.curve([[42, 48], [44.6, 49.6], [47, 48]], 0.9, '#6a3a4a', { unlit: true });
      d.deco.ell(36.6, 47, 2, 1.1, Pd); d.deco.ell(50.6, 46.6, 1.5, 0.9, Pd);
    },
  });
})();
