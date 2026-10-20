'use strict';
// =====================================================================
//  DESSINS DES DIGIMON — stade Champion
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
// =====================================================================
(function () {
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
    whamon(d) {
      // baleine des profondeurs (wikimon) : corps bleu nuit aux nageoires déchiquetées, grosse tête osseuse gris-brun
      // sans yeux visibles, zone striée derrière la tête, gueule hérissée de crocs (intérieur rose)
      const Nv = '#2c3c92', Nd = '#1a2458', Nl = '#5a72d8', Hd = '#8c7c68', Hl = '#bcae96', Hdd = '#54463a';
      // queue : nageoire caudale déchiquetée, dressée vers le haut à gauche
      d.poly([[2, 10], [6, 2], [9, 8], [12, 1], [15, 9], [19, 3], [21, 12], [16, 18], [8, 17]], Nv, { far: true });
      for (const [x, y] of [[5, 6], [11, 5], [17, 7]]) d.deco.line(x, y, x + 3, y + 8, 0.7, Nd);
      // corps qui descend vers la tête
      d.tube([[12, 14], [20, 26], [32, 36]], 6, 15, Nv, { shiny: true, tex: 0.15 });
      // arête dorsale en dents de scie
      for (let k = 0; k < 5; k++) { const x = 18 + k * 4.4, y = 18 + k * 3.6; d.poly([[x - 2, y + 1], [x + 1.5, y - 5], [x + 3, y + 2]], Nl); }
      // nageoire pectorale déchiquetée (côté lointain puis proche)
      d.poly([[30, 44], [20, 46], [16, 52], [21, 51], [19, 56], [26, 52], [28, 57], [34, 48]], Nd, { far: true });
      // zone striée derrière la tête
      d.ell(36, 38, 9, 11, Nd, -0.5, { tex: 0.2 });
      for (let k = 0; k < 6; k++) d.deco.curve([[30 + k * 2, 30 + k], [33 + k * 2, 38 + k * 0.6], [32 + k * 2, 46]], 0.7, '#4a3a2a');
      for (let k = 0; k < 4; k++) d.deco.line(30, 32 + k * 4, 42, 30 + k * 4, 0.5, '#4a3a2a');
      // tête osseuse
      d.ell(47, 42, 15, 12.5, Hd, 0.15, { shiny: true, tex: 0.2 });
      d.deco.ell(44, 36, 8, 4, Hl, 0.2);
      d.deco.curve([[36, 46], [44, 50], [56, 48]], 0.8, Hdd);
      // gueule ouverte en bas, crocs et intérieur rose
      d.poly([[40, 50], [61, 47], [58, 58], [44, 58]], '#4a0e22');
      d.deco.ell(51, 54, 7, 2.6, '#e0507a');
      for (const [x, y] of [[47, 54], [52, 55.5], [56, 53.5]]) d.deco.circ(x, y, 0.8, '#ffe060', { unlit: true });
      for (let k = 0; k < 6; k++) {
        d.deco.poly([[41 + k * 3.4, 50 - k * 0.5], [42.6 + k * 3.4, 54 - k * 0.5], [44 + k * 3.4, 49.6 - k * 0.5]], '#fff8e8', { unlit: true });
        d.deco.poly([[44 + k * 2.6, 58], [45.3 + k * 2.6, 55], [46.6 + k * 2.6, 58]], '#fff8e8', { unlit: true });
      }
      // nageoire proche
      d.poly([[38, 52], [28, 58], [33, 58], [31, 62], [38, 59], [40, 62], [44, 55]], Nv);
      d.deco.line(32, 58, 40, 55, 0.6, Nd);
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
      const Wt = '#e8f0ff', Bl = '#3a64c8', Sh = '#b8c8e8';
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
      // homme de feu (anime) : silhouette de flammes rouges, cœur jaune-blanc, coutures noires sur le corps,
      // tête en boule de feu hérissée, orbites noires en colère, grande bouche noire cousue
      const R = '#e23c16', Rd = '#a8220c', O = '#ff8a1e', Y = '#ffd640', Wh = '#fff6c8', K = '#2a0a06';
      // bras lointain et jambes (flammes qui s'effilent)
      d.tube([[22, 30], [14, 38], [11, 46]], 7, 5.5, R, { far: true }); d.circ(11, 47, 4.6, Rd, { far: true });
      d.poly([[8, 46], [6, 40], [10, 43]], O, { far: true });
      d.tube([[26, 46], [22, 55], [19, 61]], 8.5, 5, R, { far: true }); d.ell(18.5, 61.5, 4.6, 2, Rd, 0, { far: true });
      d.tube([[37, 46], [40, 55], [43, 61]], 8.5, 5, O); d.ell(44, 61.5, 5, 2.2, R);
      // corps : silhouette de flammes, puis cœur orange, jaune et presque blanc
      d.poly([[17, 49], [15, 37], [12, 28], [19, 31], [20, 24], [26, 22], [38, 22], [44, 25], [45, 30], [52, 27], [48, 37], [46, 49], [39, 53], [25, 53]], R, { tex: 0.2 });
      d.ell(31, 38, 12, 13, O, 0, { tex: 0.15 });
      d.deco.ell(31, 40, 7.5, 9.5, Y, 0, { unlit: true });
      d.deco.ell(31, 42, 3.8, 5.4, Wh, 0, { unlit: true });
      // coutures noires (comme des brûlures recousues)
      d.deco.line(23.5, 29, 26.5, 48, 0.8, K); d.deco.line(38.5, 29, 35.5, 48, 0.8, K);
      for (let k = 0; k < 5; k++) { d.deco.line(22.6 + k * 0.6, 31 + k * 4, 26.4 + k * 0.6, 30.4 + k * 4, 0.55, K); d.deco.line(35.6 - k * 0.6, 30.4 + k * 4, 39.4 - k * 0.6, 31 + k * 4, 0.55, K); }
      // tête : boule de feu aux flammes dressées
      d.poly([[18, 25], [15, 11], [21, 15], [21, 3], [27, 10], [31, 0], [35, 9], [41, 2], [42, 14], [48, 9], [45, 25]], R);
      d.ell(31, 18, 11.5, 10.5, O, 0, { shiny: true });
      d.poly([[21, 14], [22, 6], [26, 11], [30, 3], [33, 10], [37, 4], [38, 12], [42, 8], [41, 15]], O);
      d.deco.poly([[24, 12], [26, 7], [29, 10.5], [31, 5], [33, 10.5], [36, 7], [38, 12]], Y, { unlit: true });
      d.deco.ell(31, 20.5, 8.6, 6.4, Y, 0, { unlit: true });
      // orbites noires en colère (inclinées vers le centre), pupilles blanches
      d.deco.poly([[23.5, 14.6], [29.4, 17.2], [28.8, 20.4], [24.2, 19.4]], K, { unlit: true });
      d.deco.poly([[38.5, 14.6], [32.6, 17.2], [33.2, 20.4], [37.8, 19.4]], K, { unlit: true });
      d.deco.circ(27, 18.2, 1, '#ffffff', { unlit: true }); d.deco.circ(35, 18.2, 1, '#ffffff', { unlit: true });
      // bouche noire, cousue de points jaunes
      d.deco.poly([[23.6, 22.4], [38.4, 22.4], [36.4, 27], [25.6, 27]], K, { unlit: true });
      for (let x = 26; x <= 36; x += 2.5) d.deco.line(x, 22.8, x, 26.6, 0.55, Y);
      d.deco.line(24.6, 24.7, 37.4, 24.7, 0.5, Y);
      // bras proche, poing serré enflammé
      d.tube([[42, 30], [50, 34], [55, 40]], 7, 5.5, O); d.circ(56, 41, 4.8, R, { shiny: true });
      d.deco.line(46, 31, 47.6, 35.4, 0.6, K); d.deco.line(50.4, 33.6, 52.2, 37.8, 0.6, K);
      d.poly([[53, 37], [57, 29], [59.5, 38]], Y); d.poly([[56, 38], [62, 33], [60, 41]], O);
    },
    birdramon(d) {
      // oiseau de feu (anime) : grandes ailes de plumes-flammes, corps orange, ventre jaune, huppe de flammes,
      // bec jaune crochu, œil vert, pattes sombres griffues, queue en trois flammes
      const O = '#f47a22', R = '#d8401a', Rd = '#9a2410', Y = '#ffd040', Yl = '#fff0a0', G = '#4a3a3a';
      const feathers = (x, y, a0, a1, n, len0, len1, w, col, line, far) => {
        for (let k = 0; k < n; k++) {
          const t = n > 1 ? k / (n - 1) : 0, a = a0 + (a1 - a0) * t, L = len0 + (len1 - len0) * t;
          const mx = x + Math.cos(a) * L * 0.55 + Math.cos(a + 1.57) * 1.5, my = y + Math.sin(a) * L * 0.55 + Math.sin(a + 1.57) * 1.5;
          d.tube([[x, y], [mx, my], [x + Math.cos(a) * L, y + Math.sin(a) * L]], w, 0.6, col, { far, shiny: !far });
          if (!far) d.deco.line(x + Math.cos(a) * 3, y + Math.sin(a) * 3, x + Math.cos(a) * L * 0.85, y + Math.sin(a) * L * 0.85, 0.5, line);
        }
      };
      // aile lointaine, dressée vers l'arrière
      feathers(27, 31, -3.0, -2.05, 7, 30, 17, 6.2, R, Rd, true);
      // queue : trois flammes
      feathers(21, 41, 2.5, 2.9, 3, 18, 13, 4.6, R, Rd, false);
      feathers(21, 41, 2.55, 2.85, 2, 11, 9, 2.6, Y, '#e09020', false);
      // pattes sombres, griffes
      d.tube([[29, 46], [27, 55], [26, 60]], 3.2, 2.2, G, { far: true });
      for (const a of [2.6, 1.9, 1.3]) d.tube([[26, 60], [26 + Math.cos(a) * 3.6, 60 + Math.sin(a) * 1.8]], 1.2, 0.4, '#2a2020', { far: true });
      d.tube([[37, 47], [39, 55], [40, 60]], 3.4, 2.4, G);
      for (const a of [2.8, 0.6, 0.1]) d.tube([[40, 60], [40 + Math.cos(a) * 4, 60.6 + Math.sin(a) * 1.6]], 1.3, 0.4, '#2a2020');
      // corps, ventre jaune
      d.ell(32, 39, 13, 10, O, -0.25, { shiny: true });
      d.deco.ell(35.5, 42.5, 8, 5, Y, -0.25);
      d.deco.ell(36, 43, 4, 2.4, Yl, -0.25, { unlit: true });
      // cou et tête
      d.tube([[39, 33], [44, 26], [47, 21]], 8, 6.5, O);
      d.ell(49.5, 18.5, 7.6, 6.6, O, 0, { shiny: true });
      // huppe de flammes vers l'arrière
      d.poly([[44, 14], [34, 6], [42, 10], [38, 1], [46, 8], [48, 0], [50, 11]], R);
      d.poly([[45, 14], [39, 8], [44, 10], [43, 4], [48, 10]], Y);
      // bec crochu
      d.poly([[54.5, 16.5], [63.5, 19], [61.5, 22.6], [55, 22]], Y, { shiny: true });
      d.poly([[61, 19], [63.5, 19], [62.4, 23.4]], '#c8901a');
      d.deco.line(55, 19.6, 61.5, 20.6, 0.5, '#a07010');
      d.eye(51, 16.6, 2.4, 2.2, '#2a9a3a', { look: 0.4 });
      // aile proche, déployée vers le haut et l'avant : plumes jaunes au bout orange
      feathers(33, 32, -2.3, -1.25, 8, 36, 20, 6.6, O, R, false);
      feathers(33, 32, -2.15, -1.4, 6, 19, 12, 4.2, Y, '#e09020', false);
    },
  });
})();
