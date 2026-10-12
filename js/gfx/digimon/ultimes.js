'use strict';
// =====================================================================
//  DESSINS DES DIGIMON — stade Ultime
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
// =====================================================================
(function () {
  const W = '#fbf6ea';
  Object.assign(DW.DRAW, {
    jijimon(d) {
      const Sk = '#f2c49a', Wh = '#f4f2ee', Y = '#f8c838', K = '#2a2a2a';
      d.tube([[44, 60], [48, 34], [50, 12]], 3, 2.6, '#8a5a32', { tex: 0.3 });
      d.ell(26, 60, 6, 3, Sk, 0, { far: true }); d.ell(38, 60.4, 6.4, 3, Sk);
      d.tube([[27, 50], [26, 58]], 4, 4, Sk, { far: true }); d.tube([[36, 50], [37, 58]], 4, 4, Sk);
      d.poly([[14, 48], [10, 40], [12, 26], [18, 18], [26, 12], [36, 12], [46, 18], [52, 28], [52, 40], [48, 50], [40, 54], [24, 54]], Wh, { tex: 0.45, texSize: 1 });
      [[12, 44], [11, 32], [17, 20], [30, 12], [44, 17], [51, 32], [48, 46]].forEach(([x, y]) => d.poly([[x - 3, y], [x - 6 + (x < 30 ? -2 : 4), y - 4], [x + 2, y - 2]], Wh, { tex: 0.4 }));
      d.deco.curve([[22, 30], [27, 28]], 1.2, '#b8b4ac'); d.deco.curve([[36, 28], [41, 30]], 1.2, '#b8b4ac');
      d.ell(37, 36, 4.6, 3.6, Sk);
      d.deco.curve([[16, 40], [22, 46], [28, 44]], 0.8, '#c8c4bc'); d.deco.curve([[34, 46], [42, 44], [46, 40]], 0.8, '#c8c4bc');
      d.tube([[42, 42], [48, 36]], 4, 3.4, Sk);
      d.circ(51, 10, 8, Y, { shiny: true });
      d.deco.circ(51, 12.6, 3, K, { unlit: true });
      [[46, 6], [50.4, 3.6], [55, 4.6], [57.6, 8.6]].forEach(([x, y]) => d.deco.circ(x, y, 1.6, K, { unlit: true }));
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
