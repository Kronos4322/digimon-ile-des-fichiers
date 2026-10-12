'use strict';
// =====================================================================
//  DESSINS DES DIGIMON — stade Champion
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
// =====================================================================
(function () {
  const W = '#fbf6ea';
// ---- insectes (Kuwagamon, Kabuterimon) : trois griffes en éventail
  const claw3 = (d, x, y, ang, l, col, far) => {
    for (let i = -1; i <= 1; i++) { const a = ang + i * 0.45; d.tube([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 1.4, 0.3, col, { shiny: true, far }); }
  };
  // bras segmenté : épaule → coude → main + griffes
  const insectArm = (d, s, e, h, col, claw, far) => {
    d.tube([s, e, h], 3.6, 2.6, col, { far, shiny: true });
    d.circ(e[0], e[1], 2, col, { far });
    claw3(d, h[0], h[1], Math.atan2(h[1] - e[1], h[0] - e[0]), 4.8, claw, far);
  };

  Object.assign(DW.DRAW, {
    ikkakumon(d) {
      const Wt = '#eef2fa', Gy = '#aab6ce', Or = '#eaa848', Hm = '#56688c';
      d.ell(44, 58, 6, 3.6, Wt, 0, { far: true }); d.ell(16, 58, 5.6, 3.4, Wt, 0, { far: true });
      d.ell(9, 49, 9, 6.5, Wt, 0.3, { tex: 0.18 });
      d.ell(30, 44, 23, 16, Wt, 0, { tex: 0.18 });
      d.deco.tube([[14, 37], [21, 43]], 2.2, 1.4, Gy); d.deco.tube([[22, 32], [28, 39]], 2.2, 1.4, Gy); d.deco.tube([[31, 30], [35, 37]], 2.2, 1.4, Gy);
      d.ell(24, 58.5, 7, 4, Wt); d.ell(42, 59, 7, 4, Wt);
      d.ell(20, 61.5, 1, 1.5, '#2a2836'); d.ell(23.4, 62, 1, 1.5, '#2a2836'); d.ell(44, 62, 1, 1.5, '#2a2836'); d.ell(47.4, 61.8, 1, 1.5, '#2a2836');
      d.tube([[58, 39], [59, 46], [60, 52]], 3, 1, '#fffbe8', { far: true });
      d.ell(48, 32, 13, 12, Wt, 0, { tex: 0.18 });
      d.ell(45, 23, 12.5, 7.5, Hm, 0, { shiny: true });
      d.deco.tube([[35, 24], [56, 24]], 1.4, 1.4, '#3a4a6a');
      d.poly([[43, 20], [49, 0.5], [54, 20]], Or, { shiny: true });
      d.deco.line(45.5, 15, 51.6, 15, 0.9, '#b07820'); d.deco.line(46.6, 9.5, 50.6, 9.5, 0.9, '#b07820');
      d.eye(53, 30, 2.6, 3, '#202020');
      d.ell(59.5, 36, 4, 3, '#c4cce0');
      d.deco.ell(60.5, 34.6, 1.2, 0.8, '#3a3a50', 0, { unlit: true });
      d.tube([[53, 40], [54, 48], [55, 55]], 3.2, 1, '#fffbe8', { shiny: true });
    },
    togemon(d) {
      const G = '#5aac4a', R = '#e43434', Pk = '#f070a0';
      d.tube([[18, 36], [12, 40]], 5, 4, G, { far: true });
      d.circ(10, 42, 6.4, R, { shiny: true, far: true });
      d.ell(38, 58, 5.4, 4.2, G, 0, { far: true });
      d.ell(32, 34, 16, 24, G);
      d.deco.tube([[29, 13], [28, 55]], 2.2, 2.2, '#7acc66'); d.deco.tube([[38, 13], [39, 55]], 2.2, 2.2, '#7acc66'); d.deco.tube([[21, 22], [20, 48]], 2, 2, '#7acc66');
      for (let i = 0; i < 18; i++) {
        const a = i * 2.39, r = 4 + (i * 7) % 13;
        d.deco.rect(32 + Math.cos(a) * r * 0.95 - 0.7, 34 + Math.sin(a) * r * 1.6 - 0.7, 1.5, 1.5, '#fafad8', { unlit: true });
      }
      d.ell(26, 58, 5.4, 4.2, G);
      d.eye(36, 24, 2.6, 4, '#202020'); d.eye(43, 24, 2.4, 4, '#202020');
      d.deco.ell(39.5, 32.5, 4, 1.7, '#2a5020', 0, { unlit: true });
      d.ell(25, 8, 6, 3.6, Pk, -0.4); d.ell(39, 8, 6, 3.6, Pk, 0.4); d.ell(32, 4.5, 3.6, 5, Pk);
      d.circ(32, 8.5, 2.8, '#f8e060');
      d.tube([[44, 34], [50, 37]], 5, 4.5, G);
      d.ell(48.5, 37, 2.2, 4.2, '#f8f8f8');
      d.circ(54.5, 38, 7.2, R, { shiny: true });
      d.deco.curve([[52, 33], [56, 34], [58, 38]], 0.9, '#a01818');
    },
    kuwagamon(d) {
      // insecte rouge en vol : élytres dressées, ailes translucides, 4 bras griffus, mandibules noires dentelées
      const R = '#d83a2a', Rd = '#9a2018', K = '#1e1a22', Wg = '#d4e4f6', Wl = '#8aa8d0', M = '#8a4aa8', G = '#a8a4b4';
      d.ell(14, 17, 5.5, 15, Wg, -0.55, { far: true }); d.deco.line(10, 6, 17, 30, 0.6, Wl); d.deco.line(13, 8, 13, 28, 0.5, Wl);
      d.ell(27, 12, 5, 14, Wg, 0.3, { far: true }); d.deco.line(25, 0, 29, 25, 0.6, Wl);
      d.ell(19, 18, 6.6, 14, R, -0.4, { shiny: true });
      d.ell(31, 16, 6, 13, R, 0.28, { shiny: true });
      for (const [x, y, r] of [[16, 11, 1.3], [20, 19, 1.1], [18, 25, 0.9], [30, 9, 1.2], [32, 18, 1], [31, 24, 0.8]]) d.deco.circ(x, y, r, Rd);
      // abdomen gris segmenté puis queue rouge pointue vers le bas
      d.ell(29, 40, 6, 5, G, 0.2, { shiny: true });
      for (let k = 0; k < 3; k++) d.deco.line(24 + k, 37 + k * 2, 34 - k, 38 + k * 2, 0.6, '#6a6878');
      d.tube([[29, 44], [27.5, 52], [26, 58]], 5.6, 2.4, R);
      for (const y of [47, 51, 55]) d.deco.line(23.5, y, 30, y - 0.5, 0.7, Rd);
      d.poly([[23.5, 56.5], [28.5, 56.5], [26, 63.5]], R, { shiny: true });
      // bras lointains
      insectArm(d, [35, 30], [43, 22], [50, 28], Rd, K, true);
      insectArm(d, [34, 37], [41, 42], [47, 48], Rd, K, true);
      // thorax
      d.ell(33, 32, 9, 7.5, R, -0.2, { shiny: true });
      d.deco.curve([[27, 29], [33, 27], [39, 30]], 1, Rd);
      // bras proches
      insectArm(d, [31, 34], [38, 41], [43, 51], R, K, false);
      insectArm(d, [29, 38], [32, 47], [37, 56], R, K, false);
      // tête rayée de noir, bouche violette
      d.ell(46, 27, 8.4, 7, R, 0.12, { shiny: true });
      d.deco.curve([[40, 22], [43.5, 24.5], [46, 21.5]], 1.3, K); d.deco.curve([[42, 30], [45, 28.5], [48, 30.5]], 1.1, K);
      d.deco.line(39.5, 26, 43, 26.5, 1, K);
      d.eye(49, 24.4, 1.9, 1.6, '#f6e040');
      d.deco.ell(51.5, 31, 3, 2, M);
      for (const x of [50, 52, 54]) d.deco.poly([[x, 29.6], [x + 0.8, 31.6], [x + 1.6, 29.6]], '#ffffff', { unlit: true });
      // mandibules noires dentelées, vers l'avant
      d.poly([[50, 26], [57, 22.5], [63.5, 27], [59, 26.5], [56.5, 29], [53, 29]], K, { shiny: true });
      d.poly([[51, 33], [58, 35.5], [62.5, 41.5], [57.5, 39], [54, 38.5]], K, { shiny: true });
      for (const [x, y] of [[57.5, 26], [60, 27], [56.5, 37], [59, 38.5]]) d.deco.poly([[x, y], [x + 1, y + 1.6], [x + 2, y]], '#5a5466');
    },
    shellmon(d) {
      // crabe-ermite magenta à quatre pattes, mèches jaune-vert, grosse conque bleu-gris hérissée sur le dos
      const Pk = '#e2408c', Pd = '#a8226a', Pl = '#f47ab0', Sh = '#8a98c0', Shd = '#5a6688', Sp = '#c8d0e4', Hair = '#b8d83a', Hd = '#7a9a1e';
      // conque (derrière)
      d.blob([[6, 40], [8, 22], [18, 10], [30, 9], [37, 20], [36, 38], [26, 46], [12, 46]], Sh, { tex: 0.25 });
      for (const [a, b, c] of [[[8, 22], [3, 14], [12, 18]], [[18, 10], [16, 1], [24, 9]], [[30, 9], [34, 1], [34, 12]], [[37, 20], [44, 16], [38, 26]], [[6, 34], [0, 34], [7, 40]], [[14, 44], [10, 51], [19, 46]]])
        d.poly([a, b, c], Sp, { shiny: true });
      d.deco.curve([[12, 40], [12, 26], [22, 18], [30, 22], [28, 32], [20, 34]], 1.4, Shd);
      for (const [x, y] of [[16, 22], [27, 15], [23, 38]]) { d.deco.circ(x, y, 1.8, '#f0a030'); d.deco.circ(x, y, 0.8, '#7a3a10'); }
      // pattes lointaines
      d.tube([[30, 50], [26, 58]], 4.6, 4, Pd, { far: true }); d.ell(25, 59.5, 4, 2.4, Pd, 0, { far: true });
      d.tube([[46, 50], [50, 58]], 4.6, 4, Pd, { far: true }); d.ell(51.5, 59.5, 4, 2.4, Pd, 0, { far: true });
      // corps
      d.ell(38, 46, 13, 9, Pk, 0, { shiny: true });
      for (const [x, y, r] of [[30, 44, 1.4], [36, 50, 1.2], [42, 43, 1], [45, 51, 1.3]]) d.deco.ell(x, y, r * 1.4, r, '#7ab8f0');
      // pattes proches (doigts ronds)
      d.tube([[33, 52], [31, 59]], 5, 4.4, Pk); d.ell(31, 60.5, 4.6, 2.6, Pk);
      d.tube([[48, 51], [53, 58]], 5, 4.4, Pk); d.ell(54.5, 60, 4.6, 2.6, Pk);
      for (const x of [28.5, 31, 33.5, 52, 54.5, 57]) d.deco.circ(x, 61.6, 1, Pl);
      // tête : grande gueule ouverte aux dents irrégulières
      d.ell(49, 34, 11, 9, Pk, 0.1, { shiny: true });
      d.poly([[44, 35], [61, 31], [62, 40], [46, 41]], '#5a1028');
      for (let k = 0; k < 5; k++) { d.deco.poly([[46 + k * 3.2, 35 - k * 0.8], [47.4 + k * 3.2, 38 - k * 0.6], [48.6 + k * 3.2, 34.6 - k * 0.8]], '#fff8e8', { unlit: true }); d.deco.poly([[47 + k * 3, 41], [48.2 + k * 3, 38.4], [49.4 + k * 3, 41]], '#fff8e8', { unlit: true }); }
      d.deco.ell(51, 39.6, 3.4, 1.2, '#e05a7a');
      d.eye(52, 27, 2.6, 2.4, '#3a8ae0');
      // mèches jaune-vert
      for (const [x, y, ex, ey] of [[42, 27, 34, 17], [44, 25, 38, 14], [47, 24, 44, 13], [50, 24, 51, 14], [53, 25, 58, 17], [45, 27, 36, 24]])
        d.tube([[x, y], [(x + ex) / 2 + 1.5, (y + ey) / 2 - 1.5], [ex, ey]], 2.6, 1.2, Hair, { shiny: true });
      d.deco.line(40, 20, 44, 26, 0.6, Hd);
    },
    garurumon(d) {
      const Wt = '#e8f0ff', Bl = '#3a64c8', Bd = '#24408e', Sh = '#b8c8e8';
      d.tube([[14, 32], [8, 22], [6, 12]], 10, 4, Wt);
      d.deco.tube([[8, 24], [11, 22]], 2.4, 1.6, Bl); d.deco.tube([[6, 17], [9, 16]], 2.4, 1.6, Bl);
      d.tube([[22, 44], [20, 60]], 5.6, 4.6, Wt, { far: true }); d.tube([[44, 44], [46, 60]], 5.6, 4.6, Wt, { far: true });
      d.ell(32, 38, 21, 12, Wt);
      d.deco.ell(34, 45, 15, 5, Sh);
      [[18, 30], [26, 28], [34, 28], [42, 30]].forEach(([x, y]) => d.deco.tube([[x, y], [x + 3, y + 8]], 2.6, 1.8, Bl));
      d.tube([[18, 44], [16, 60]], 6, 5, Wt); d.tube([[42, 44], [41, 60]], 6, 5, Wt);
      d.deco.tube([[17, 50], [20, 52]], 2.2, 1.6, Bl); d.deco.tube([[41, 50], [44, 52]], 2.2, 1.6, Bl);
      d.ell(15, 60.6, 4.4, 2.2, Wt); d.ell(40, 60.6, 4.4, 2.2, Wt);
      d.ell(46, 30, 9, 10, Wt, 0.3, { tex: 0.15 });
      d.poly([[46, 18], [48, 8], [53, 17]], Wt); d.deco.poly([[48, 16], [49, 11], [51.6, 16]], '#9ab0e0');
      d.ell(52, 24, 9.5, 8, Wt);
      d.ell(59, 27.5, 6, 4, Wt, 0.1, { noline: true });
      d.deco.tube([[47, 20], [53, 18]], 2.2, 1.6, Bl); d.deco.tube([[50, 28], [55, 26]], 2, 1.4, Bl);
      d.eye(54.6, 21.6, 2.6, 2.4, '#e8c020', { look: 0.4 });
      d.ell(63, 26.6, 1.6, 1.4, '#2a2a3a', 0, { shiny: true });
      d.deco.curve([[54, 30.4], [59, 31.4], [63, 29.6]], 1, '#3a2a40', { unlit: true });
      d.deco.poly([[58, 31], [59, 33.4], [60, 31]], '#ffffff', { unlit: true });
    },
    meramon(d) {
      const O = '#f2701e', R = '#d83a14', Y = '#ffd84a', K = '#2a0a06';
      const fl = (pts, col, o = {}) => d.blob(pts, col, Object.assign({ unlit: false }, o));
      d.poly([[14, 24], [10, 6], [18, 14], [19, 0.5], [25, 11], [31, 0.2], [36, 11], [43, 1], [44, 14], [52, 6], [48, 24]], R, { far: true });
      d.tube([[24, 44], [20, 62]], 7, 6, O, { far: true }); d.tube([[38, 44], [42, 62]], 7, 6, O);
      d.tube([[18, 30], [8, 40], [6, 48]], 6, 5, O, { far: true }); d.circ(6, 49, 4, R, { far: true });
      d.ell(31, 38, 13, 15, O);
      d.deco.ell(31, 40, 8, 10, Y, 0, { unlit: true });
      d.deco.ell(31, 42, 4, 6, '#fff4c0', 0, { unlit: true });
      d.ell(31, 18, 12, 11, O);
      d.poly([[19, 16], [17, 6], [23, 11], [25, 2], [29, 9], [32, 1], [35, 9], [39, 3], [40, 11], [45, 6], [43, 16]], O);
      d.deco.poly([[22, 15], [24, 8], [27, 12], [31, 5], [34, 12], [38, 7], [40, 15]], Y, { unlit: true });
      d.poly([[18, 30], [12, 22], [20, 26]], Y); d.poly([[44, 30], [50, 22], [42, 26]], Y);
      d.deco.ell(31, 21, 8, 6, '#ffb040');
      d.deco.ell(27, 18, 2.6, 3.6, K, 0.2, { unlit: true }); d.deco.ell(36, 18, 2.6, 3.6, K, -0.2, { unlit: true });
      d.deco.ell(27.6, 17.4, 0.8, 1, '#ffffff', 0, { unlit: true }); d.deco.ell(36.6, 17.4, 0.8, 1, '#ffffff', 0, { unlit: true });
      d.deco.poly([[25, 24], [37, 24], [35, 27.6], [33, 25.6], [31, 27.6], [29, 25.6], [27, 27.6]], K, { unlit: true });
      d.deco.line(20, 30, 24, 46, 0.7, R); d.deco.line(42, 30, 38, 46, 0.7, R);
      d.tube([[44, 30], [52, 36], [55, 42]], 6, 5, O); d.circ(56, 43, 4.4, R, { shiny: true });
    },
    birdramon(d) {
      const O = '#f2702a', R = '#d03a1c', Y = '#ffd040', Wg = '#f8a03a';
      d.poly([[30, 26], [6, 2], [2, 14], [12, 18], [0, 28], [14, 30], [4, 40], [24, 36]], R, { far: true });
      d.deco.line(10, 8, 26, 28, 0.8, '#a02010'); d.deco.line(6, 24, 24, 32, 0.8, '#a02010');
      d.tube([[22, 42], [10, 50], [2, 46]], 7, 2, O);
      d.ell(4, 44, 4, 6, Y, 0.5);
      d.tube([[30, 48], [28, 60]], 2.6, 2.2, '#5a3a2a', { far: true });
      d.ell(32, 38, 13, 11, O, -0.2);
      d.deco.ell(36, 42, 8, 6, '#ffc070');
      d.tube([[38, 48], [40, 60]], 2.8, 2.4, '#5a3a2a');
      d.poly([[36, 60], [44, 60], [40, 63]], '#3a2a1a');
      d.tube([[40, 32], [46, 22]], 7, 6, O);
      d.ell(48, 18, 8, 7, O);
      d.blob([[42, 13], [36, 4], [44, 9], [44, 1], [50, 10]], Y);
      d.poly([[54, 16], [64, 20], [54, 23]], Y, { shiny: true });
      d.eye(50, 16, 2.6, 2.4, '#2a8a3a', { look: 0.4 });
      d.poly([[34, 30], [56, 6], [62, 18], [52, 22], [60, 30], [46, 32], [52, 40], [36, 38]], Wg);
      d.deco.line(40, 32, 56, 12, 0.8, '#d06a1a'); d.deco.line(42, 34, 54, 28, 0.8, '#d06a1a');
    },
  });
})();
