'use strict';
// =====================================================================
//  DESSINS DES DIGIMON — stade Ultime
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
// =====================================================================
(function () {
  const W = '#fbf6ea';
  Object.assign(DW.DRAW, {
    // Jijimon (d'après wikimon) : vieux sage tout en fourrure blanche hirsute, pagne beige noué d'une corde,
    // pieds et mains roses, bâton chéri surmonté d'une grosse patte jaune à coussinets sombres
    jijimon(d) {
      const Sk = '#f4b8a0', Skd = '#d88a74', Wh = '#f6f4ee', Wg = '#d8d4cc', Y = '#f8c838', Yd = '#d89a20', K = '#2e2a2a', Cl = '#e8d4a8', Rp = '#8a5a32';
      // bâton (derrière la main) et sa patte
      d.tube([[46, 60], [48, 36], [50, 14]], 3, 2.6, '#8a5a32', { tex: 0.35 });
      // patte : paume ronde, trois doigts en bosse, coussinets gris-brun (un gros en haricot, trois petits)
      d.ell(50.5, 11, 7, 6.6, Y, 0, { shiny: true });
      [[45, 5.4], [50.5, 3.4], [56, 5.4]].forEach(([x, y]) => d.circ(x, y, 3, Y, { shiny: true }));
      d.deco.curve([[44, 15.6], [50.5, 17.6], [57, 15.6]], 0.9, Yd);
      d.deco.ell(50.5, 12.2, 3.2, 2.4, '#5a4646', 0, { unlit: true });
      [[45.4, 5.8], [50.5, 3.8], [55.6, 5.8]].forEach(([x, y]) => d.deco.ell(x, y, 1.4, 1.2, '#5a4646', 0, { unlit: true }));
      // pieds roses et orteils
      d.ell(25, 60, 6.4, 3, Sk, 0, { far: true }); d.ell(38, 60.4, 6.8, 3.1, Sk);
      [[33, 60], [36, 61], [39.4, 61], [42.6, 60.4]].forEach(([x, y]) => d.deco.circ(x, y, 1, Skd));
      d.tube([[27, 50], [26, 58]], 4, 4, Sk, { far: true }); d.tube([[36, 50], [37, 58]], 4.2, 4, Sk);
      // pagne beige et corde
      d.poly([[18, 46], [46, 46], [44, 54], [38, 52], [32, 55], [26, 52], [20, 54]], Cl, { tex: 0.3 });
      d.tube([[18, 46.5], [46, 46.5]], 1.8, 1.8, Rp);
      d.deco.curve([[30, 47], [29, 52]], 1, Rp); d.deco.curve([[31, 47], [33, 51.5]], 1, Rp);
      // grande fourrure hirsute (corps et tête)
      d.poly([[14, 47], [9, 38], [11, 25], [17, 16], [26, 10], [37, 10], [47, 16], [53, 27], [53, 39], [49, 48], [40, 49], [24, 49]], Wh, { tex: 0.5, texSize: 1 });
      // touffes arrondies tout autour (silhouette en nuage) et mèches qui pendent en bas
      [[13, 41, 5.6], [11.5, 32, 6], [14, 23, 5.6], [20, 16.5, 6], [28.5, 13, 6.4], [37.5, 13, 6.2], [45, 17.5, 5.8], [49.5, 26, 5.6], [51, 35, 5.6], [48, 43, 5.6]].forEach(([x, y, r]) =>
        d.ell(x, y, r, r * 0.85, Wh, 0, { tex: 0.5, texSize: 1 }));
      [[17, 47.5], [23.5, 49], [30, 49.6], [36.5, 49.4], [43, 47.6]].forEach(([x, y]) => d.ell(x, y, 4.2, 3, Wh, 0, { tex: 0.4 }));
      [[17, 50], [23.5, 51.6], [30, 52], [36.5, 52], [43, 50]].forEach(([x, y]) => d.deco.curve([[x - 2, y - 1], [x, y]], 0.8, Wg));
      // ombres des mèches (traits gris)
      [[[16, 26], [19, 34], [17, 42]], [[23, 16], [26, 24]], [[41, 16], [44, 23]], [[47, 28], [48, 37], [45, 44]], [[22, 38], [25, 45]], [[38, 40], [40, 47]]].forEach(pts => d.deco.curve(pts, 0.8, Wg));
      // sourcils broussailleux qui cachent les yeux
      d.blob([[21, 28], [26, 25], [31, 27], [28, 30], [23, 31]], '#fbfaf6');
      d.blob([[33, 27], [38, 25], [44, 28], [40, 31], [35, 30]], '#fbfaf6');
      d.deco.curve([[22, 30.5], [26, 29], [30, 30]], 0.9, '#a8a49c'); d.deco.curve([[34, 30], [38, 29], [43, 30.5]], 0.9, '#a8a49c');
      // gros nez rose
      d.ell(32.5, 35, 4.4, 3.6, Sk, 0, { shiny: true });
      d.deco.ell(31.5, 34, 1.2, 0.9, '#ffe4d8', 0, { unlit: true });
      // moustache qui retombe sur la barbe
      d.deco.curve([[24, 39], [28, 37.6], [32, 39]], 1.1, Wg); d.deco.curve([[33, 39], [37, 37.6], [41, 39]], 1.1, Wg);
      // main rose qui tient le bâton
      d.tube([[41, 41], [46, 37]], 4, 3.6, Wh, { tex: 0.3 });
      d.ell(47.6, 36, 3.6, 3.2, Sk);
      d.deco.curve([[46, 34.6], [49.4, 35.2]], 0.7, Skd); d.deco.curve([[46, 36.8], [49.4, 37.4]], 0.7, Skd);
    },
    zudomon(d) {
      const Wt = '#eef2fa', Sh = '#c8823a', Hm = '#7a5a3a', R = '#e05a3a', Mt = '#a8b0c0';
      d.tube([[50, 40], [54, 22], [56, 10]], 3, 2.6, '#8a5a32', { far: true });
      d.rect(46, 1, 18, 11, Mt, { shiny: true, round: 0.3 });
      d.deco.rect(46, 5, 18, 2, '#e8c040');
      d.ell(16, 58, 6, 3.4, Wt, 0, { far: true });
      d.ell(28, 38, 21, 18, Sh, -0.2, { shiny: true, tex: 0.2 });
      [[12, 26], [20, 20], [30, 18], [16, 36], [26, 30]].forEach(([x, y]) => d.poly([[x - 2.6, y + 2], [x, y - 4], [x + 2.6, y + 2]], '#f0e8d0', { shiny: true }));
      d.deco.curve([[12, 44], [22, 40], [36, 42]], 1, '#8a4e18');
      d.ell(32, 47, 18, 12, Wt, 0, { tex: 0.18 });
      d.ell(24, 58.5, 7, 4, Wt); d.ell(42, 59, 7, 4, Wt);
      d.ell(46, 32, 11, 10, Wt, 0, { tex: 0.18 });
      d.ell(44, 23, 11, 6.5, Hm, 0, { shiny: true });
      d.poly([[42, 20], [47, 3], [51, 20]], '#f0d070', { shiny: true });
      d.blob([[34, 26], [36, 18], [40, 24]], R);
      d.eye(51, 29.5, 2.6, 3, '#202020');
      d.ell(56.5, 35, 3.6, 2.8, '#c4cce0');
      d.tube([[51, 39], [52, 46], [53, 52]], 3, 1, '#fffbe8', { shiny: true });
      d.tube([[44, 42], [50, 40]], 6, 5, Wt);
    },
    lillymon(d) {
      const Sk = '#f8dcc8', G = '#5ac05a', Gl = '#9ae07a', Pk = '#f86aa8', Pl = '#ffb0d0';
      d.ell(18, 26, 6, 14, Gl, -0.5, { far: true }); d.ell(22, 34, 5, 12, Gl, -1.1, { far: true });
      d.deco.line(14, 16, 22, 36, 0.7, '#5aa84a');
      d.tube([[36, 46], [38, 58]], 3.2, 2.6, Sk, { far: true }); d.ell(39, 60, 3.4, 2, G, 0, { far: true });
      d.tube([[30, 46], [28, 58]], 3.2, 2.6, Sk); d.ell(28, 60, 3.4, 2, G);
      d.blob([[24, 36], [42, 36], [46, 48], [33, 44], [20, 48]], G);
      d.deco.line(28, 38, 25, 46, 0.7, '#2e8a3a'); d.deco.line(38, 38, 41, 46, 0.7, '#2e8a3a');
      d.tube([[33, 36], [33, 26]], 7, 6, Sk);
      d.ell(33, 30, 4.6, 3, G);
      d.tube([[35, 28], [42, 32], [50, 30]], 2.6, 2.2, Sk);
      d.tube([[31, 28], [40, 33], [50, 31.5]], 2.6, 2.2, Sk, { far: true });
      d.ell(51, 30.5, 2.6, 2.2, G);
      d.ell(34, 18, 6.6, 6.4, Sk);
      d.deco.ell(31, 19, 2, 2.6, '#c88a5a');
      d.eye(37, 18, 1.8, 2.4, '#3a6ae0');
      d.deco.curve([[37, 22.4], [39, 22.6]], 0.7, '#c04060', { unlit: true });
      for (let i = 0; i < 6; i++) { const a = Math.PI + i / 5 * Math.PI; d.ell(34 + Math.cos(a) * 7, 13 + Math.sin(a) * 5, 4.4, 3, Pk, a); }
      d.deco.ell(30, 9, 2, 1.2, Pl); d.deco.ell(38, 9, 2, 1.2, Pl);
      d.circ(34, 7, 2.2, '#f8e060', { shiny: true });
    },
  });
})();
