'use strict';
// =====================================================================
//  DESSINS — Digimon de l'île (species2.js)
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
// =====================================================================
(function () {
  const CL = '#f6f2e6', K = '#1a1a22';
  const legs = (d, x, y, col, far) => { d.tube([[x, y], [x, y + 8]], 4, 3.6, col, { far }); d.ell(x + 1.5, y + 9, 3.4, 1.8, col, 0, { far }); };
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

  // lissage d'une ligne brisée (Chaikin) : corps de serpent sans angles
  const smooth = (pts, n = 3) => { for (let k = 0; k < n; k++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(pts[pts.length - 1]); pts = o; } return pts; };

  Object.assign(DW.DRAW, {
    // ---------------------------------------------------------- Disciples
    tentomon(d) {
      const R = '#c8302a', Rd = '#8a1e1a', G = '#3ab858';
      legs(d, 24, 50, '#5a3a2a', true); legs(d, 36, 50, '#6a4a32');
      d.ell(30, 42, 20, 16, R, 0, { shiny: true });
      d.deco.line(16, 32, 30, 56, 1, Rd); d.deco.ell(22, 34, 6, 3, '#e86058', -0.4);
      d.tube([[46, 40], [54, 46], [58, 44]], 3, 2, '#7a5a3a'); for (let i = 0; i < 3; i++) d.tube([[57, 44], [60 + i * 1.4, 41 + i * 3]], 1.2, 0.5, CL);
      d.ell(45, 30, 10, 9, '#8a6a4a', 0, { shiny: true });
      d.eye(48, 27, 4.4, 5, G, { look: 0.3 }); d.deco.ell(52, 35, 4, 2, '#5a3a2a', 0, { unlit: true });
      d.tube([[42, 21], [40, 12], [44, 8]], 1.4, 1, '#3a2a1a'); d.tube([[47, 21], [49, 12], [53, 10]], 1.4, 1, '#3a2a1a');
    },
    patamon(d) {
      const O = '#f0a050', Ol = '#fbe0a8', B = '#3a7ad8';
      d.ell(22, 30, 13, 5, O, -0.6, { far: true }); d.deco.ell(22, 30, 9, 3, '#d8803a', -0.6);
      legs(d, 26, 50, O, true); legs(d, 38, 50, O);
      d.ell(32, 44, 16, 13, O, 0, { shiny: true }); d.deco.ell(36, 48, 9, 7, Ol);
      d.ell(40, 26, 14, 5.6, O, 0.5); d.deco.ell(40, 26, 10, 3.2, '#d8803a', 0.5);
      d.eye(40, 40, 3.6, 4.4, B, { look: 0.35 }); d.eye(50, 40.6, 3, 4, B, { look: 0.35 });
      d.deco.ell(46, 47, 2.6, 1.4, '#7a3a1a', 0, { unlit: true }); d.deco.ell(36, 46, 2, 1, '#ff9a8a'); d.deco.ell(54, 46, 1.6, 0.9, '#ff9a8a');
    },
    penguinmon(d) {
      const P = '#4a3a8a', Pd = '#2e2460', W = '#f4f4f8', Y = '#f0c030';
      d.ell(26, 60, 6, 2.4, '#e08a20', 0, { far: true }); d.ell(38, 60.4, 6.4, 2.4, '#f09a30');
      d.ell(30, 42, 15, 19, P, 0, { shiny: true }); d.deco.ell(35, 46, 9, 13, W);
      d.tube([[18, 38], [12, 48]], 5, 3, Pd, { far: true }); d.tube([[42, 38], [50, 46]], 5, 3, P);
      d.ell(34, 22, 12, 10, P, 0, { shiny: true }); d.deco.ell(38, 25, 7, 5, W);
      d.poly([[42, 25], [54, 27], [42, 29]], Y, { shiny: true });
      d.eye(38, 21, 2.6, 3.4, '#2a2a2a', { look: 0.3 }); d.deco.ell(36, 13, 3, 1.4, '#e04a3a');
    },
    // ---------------------------------------------------------- Champions
    kabuterimon(d) {
      // insecte bleu nuit cuirassé : grande corne recourbée, bouche rouge à crocs, 4 bras, deux paires d'ailes pâles
      const B = '#3c4c9e', Bd = '#242d68', Bl = '#7a8ad0', K = '#20202c', Wg = '#f2eec8', Wl = '#c8bc7a';
      d.ell(15, 15, 5.4, 16, Wg, -0.6, { far: true }); d.deco.line(10, 4, 18, 30, 0.6, Wl);
      d.ell(24, 11, 5, 15, Wg, -0.1, { far: true }); d.deco.line(23, -2, 25, 25, 0.6, Wl);
      d.ell(30, 14, 4.6, 13, Wg, 0.4, { far: true }); d.deco.line(32, 2, 29, 26, 0.6, Wl);
      // abdomen segmenté terminé par des griffes
      d.tube([[29, 42], [27, 51], [25, 58]], 7, 3, B, { shiny: true });
      for (const y of [45, 49, 53]) d.deco.line(23, y, 31.5, y - 0.6, 0.8, Bd);
      claw3(d, 25, 58, 1.7, 5, K);
      insectArm(d, [36, 29], [44, 22], [51, 27], Bd, K, true);
      insectArm(d, [35, 36], [42, 41], [48, 46], Bd, K, true);
      // thorax cuirassé
      d.ell(33, 33, 10, 8.5, B, -0.2, { shiny: true });
      d.deco.curve([[26, 30], [33, 27], [41, 31]], 1.1, Bd); d.deco.curve([[27, 36], [33, 34], [40, 37]], 0.9, Bd);
      insectArm(d, [31, 35], [38, 42], [44, 51], B, K, false);
      insectArm(d, [28, 39], [31, 48], [36, 56], B, K, false);
      // tête et grande corne recourbée vers l'avant
      d.ell(46, 27, 8.6, 7.4, B, 0.1, { shiny: true });
      d.deco.ell(44, 23, 4, 2, Bl);
      d.tube([[44, 21], [47, 12], [53, 5], [59, 4]], 4.6, 1, K, { shiny: true });
      d.tube([[49, 20], [54, 17]], 2, 0.6, K);
      d.eye(48.6, 25, 1.7, 1.5, '#ff5040');
      // bouche rouge et crocs blancs
      d.deco.ell(51.6, 31.2, 3.6, 2.4, '#d02840');
      d.poly([[49, 30], [50.6, 35], [52, 30]], '#f8f4ea', { shiny: true }); d.poly([[53, 30.4], [54.4, 34.4], [55.6, 30.4]], '#f8f4ea', { shiny: true });
    },
    angemon(d) {
      const W = '#f8f6f0', Wd = '#c8c4b8', S = '#b8c0d0', Bl = '#3a5ad8', Sk = '#f0c8a0';
      for (let i = 0; i < 3; i++) d.poly([[28, 22 + i * 4], [4 - i * 2, 4 + i * 10], [10, 14 + i * 10], [26, 28 + i * 4]], i % 2 ? Wd : W, { far: true, shiny: true });
      d.tube([[30, 44], [29, 52], [29, 59]], 6, 5, Bl, { far: true }); d.tube([[36, 44], [38, 52], [38, 59]], 6.4, 5.4, Bl);
      d.ell(30, 60.4, 5, 2.4, W, 0, { far: true }); d.ell(39, 60.6, 5.4, 2.4, W);
      d.blob([[24, 22], [40, 22], [42, 36], [38, 46], [26, 46], [22, 34]], W, { shiny: true });
      d.deco.rect(24, 40, 18, 3, Bl);
      d.tube([[40, 26], [48, 32], [52, 38]], 5, 4.4, Sk); d.ell(53, 39, 3, 3, W);
      d.tube([[54, 10], [52, 60]], 1.6, 1.6, '#e0c040', { shiny: true }); d.circ(54, 9, 2.4, '#e0c040', { shiny: true });
      d.ell(34, 14, 7, 7, Sk); d.poly([[27, 10], [34, 6], [42, 9], [42, 15], [27, 15]], S, { shiny: true });
      d.deco.line(28, 13, 41, 13, 1, '#5a6070'); d.poly([[30, 9], [24, 2], [34, 6]], '#f0e0a0'); d.deco.curve([[36, 19], [40, 19.4]], 0.7, '#a05a4a');
    },
    monochromon(d) {
      const G = '#7a7a84', Gd = '#55555e', Gl = '#a8a8b0', Sh = '#d8c0a0';
      d.tube([[14, 44], [6, 48], [1, 52]], 9, 2, G);
      for (const [x, far] of [[18, true], [24, false], [38, true], [44, false]]) { d.tube([[x, 46], [x, 58]], 6, 5.6, far ? Gd : G, { far }); d.ell(x + 1, 59.6, 4.4, 2.2, far ? Gd : G, 0, { far }); }
      d.ell(30, 42, 20, 12, G, 0, { tex: 0.3 }); d.deco.ell(28, 36, 10, 4, Gl, -0.1);
      d.ell(50, 34, 9, 7, G, 0, { shiny: true });
      d.poly([[40, 34], [44, 16], [50, 18], [52, 28]], Sh, { shiny: true, round: 0.4 });
      d.poly([[54, 30], [64, 24], [58, 34]], CL, { shiny: true });
      d.deco.ell(52, 32, 1.8, 1.4, '#e04a2a', 0, { unlit: true }); d.deco.curve([[50, 38], [57, 38.4], [61, 36]], 0.8, '#2a2a2a', { unlit: true });
    },
    frigimon(d) {
      const W = '#f4f8ff', Wd = '#c8d8ec', B = '#4a78c8';
      d.ell(24, 58, 7, 4, Wd, 0, { far: true }); d.ell(40, 58, 7.4, 4, W);
      d.ell(32, 42, 18, 16, W, 0, { tex: 0.25 }); d.deco.ell(26, 34, 7, 4, '#ffffff', -0.3);
      d.tube([[16, 38], [8, 46]], 7, 6, Wd, { far: true }); d.tube([[46, 36], [54, 42]], 7, 6, W); d.ell(56, 44, 5, 4.4, W);
      d.ell(34, 20, 12, 10, W, 0, { tex: 0.2 });
      d.poly([[24, 14], [34, 2], [44, 14]], B, { shiny: true }); d.deco.rect(24, 12, 20, 3, '#ffffff'); d.circ(34, 2, 2.4, '#ffffff');
      d.deco.line(34, 19, 38, 19, 1.2, '#2a2a3a', { unlit: true }); d.deco.line(41, 19, 45, 19, 1.2, '#2a2a3a', { unlit: true });
      d.deco.curve([[36, 26], [40, 28], [44, 26]], 1, '#3a3a5a', { unlit: true }); d.deco.ell(30, 24, 2, 1.2, '#a8c8ff');
    },
    leomon(d) {
      const Y = '#f0b040', Yd = '#c08020', M = '#8a4a1a', P = '#2a2a34';
      d.tube([[22, 42], [12, 46], [6, 42]], 3, 2, Y, { far: true }); d.circ(6, 42, 2.4, M, { far: true });
      d.tube([[30, 42], [30, 52], [30, 59]], 7, 6, P, { far: true }); d.tube([[36, 42], [38, 52], [38, 59]], 7.4, 6.4, P);
      d.ell(31, 60.4, 5, 2.4, Y, 0, { far: true }); d.ell(40, 60.6, 5.4, 2.4, Y);
      d.blob([[22, 20], [40, 20], [42, 34], [38, 44], [26, 44], [22, 32]], Y);
      d.deco.blob([[29, 24], [38, 24], [38, 38], [30, 40]], '#f8d890'); d.deco.rect(24, 40, 16, 3, '#6a3a1a');
      d.tube([[24, 22], [18, 30], [18, 38]], 6, 5, Yd, { far: true });
      d.tube([[40, 24], [48, 30], [54, 32]], 6, 5.4, Y); d.ell(55, 32, 3.6, 3.4, Y);
      d.blob([[24, 4], [38, 2], [46, 8], [46, 20], [40, 26], [26, 24], [22, 14]], M, { tex: 0.35 });
      d.ell(40, 14, 7, 6.4, Y); d.ell(46, 17, 5, 3.6, Y, 0, { noline: true });
      d.deco.ell(41, 12, 1.6, 1.2, '#2a8a3a', 0, { unlit: true }); d.deco.ell(49.6, 15.6, 1.2, 0.9, '#3a1a0a', 0, { unlit: true });
      d.deco.curve([[44, 19.6], [50, 19.4]], 0.8, '#3a1a0a', { unlit: true });
    },
    ogremon(d) {
      const G = '#5a9a4a', Gd = '#3a6a30', Wh = '#f0f0e8', P = '#a83a2a';
      d.tube([[30, 42], [29, 52], [28, 59]], 7, 6, P, { far: true }); d.tube([[36, 42], [38, 52], [38, 59]], 7.4, 6.4, P);
      d.ell(29, 60.4, 5, 2.4, Gd, 0, { far: true }); d.ell(40, 60.6, 5.4, 2.4, G);
      d.blob([[22, 20], [40, 20], [43, 34], [38, 44], [26, 44], [21, 32]], G);
      d.deco.rect(22, 38, 20, 5, '#5a3a20');
      d.tube([[24, 22], [16, 30], [16, 38]], 6, 5, Gd, { far: true });
      d.tube([[40, 24], [48, 26], [52, 18]], 6, 5.4, G); d.ell(52, 16, 3.6, 3.4, G);
      d.tube([[52, 20], [58, 2]], 4, 4, Wh, { shiny: true }); d.circ(58, 1, 3.4, Wh); d.circ(51, 21, 3, Wh);
      d.ell(36, 13, 8, 7, G); d.poly([[28, 6], [36, 0], [44, 6], [38, 8]], Wh, { tex: 0.3 });
      d.poly([[30, 6], [27, 0.6], [33, 4]], '#e8e0c8'); d.poly([[40, 6], [43, 0.6], [38, 4]], '#e8e0c8');
      d.deco.ell(39, 12, 1.4, 1.2, '#e03a2a', 0, { unlit: true }); d.deco.curve([[36, 17], [42, 17.6]], 1, '#2a1a1a', { unlit: true });
      d.deco.poly([[37, 16.6], [38, 19], [39, 16.8]], CL, { unlit: true });
    },
    seadramon(d) {
      // serpent de mer bleu-vert enroulé, nageoires rouges, grande tête cuirassée jaune, gueule ouverte
      const T = '#2aa6b8', Td = '#16707e', Tb = '#d8f0e8', Y = '#f2c628', Yd = '#b8860e', Rf = '#e2402e';
      const body = [[12, 2], [8, 10], [10, 20], [18, 28], [28, 30], [34, 24], [32, 16], [24, 14], [18, 20], [18, 30], [22, 40], [32, 48], [42, 50]];
      d.tube(smooth(body), 3, 9, T, { shiny: true });
      d.deco.tube([[20, 26], [26, 28.5], [31, 26]], 1.8, 1.4, Tb); d.deco.tube([[21, 34], [25, 42], [32, 46.5], [40, 48]], 2.2, 2.4, Tb);
      // nageoires rouges sur le dos et nageoire de queue
      for (const [x, y, a] of [[9, 14, -2.6], [13, 24, -2.2], [26, 31, 1.6], [36, 21, 0.2], [17, 34, 3.1], [24, 44, 2.4]])
        d.poly([[x, y], [x + Math.cos(a) * 5, y + Math.sin(a) * 5], [x + Math.cos(a + 0.7) * 3, y + Math.sin(a + 0.7) * 3]], Rf, { shiny: true });
      d.poly([[12, 2], [9, -1], [16, 0], [13, 5]], Rf, { shiny: true }); d.poly([[12, 3], [16, -1], [18, 4]], Rf);
      // tête cuirassée
      d.ell(48, 46, 10, 7.5, Y, -0.1, { shiny: true });
      d.poly([[40, 42], [44, 33], [47, 41]], Y, { shiny: true }); d.poly([[45, 40], [51, 32], [52, 40]], Yd, { shiny: true });
      d.poly([[52, 44], [63, 46], [56, 49]], Y, { shiny: true });
      d.deco.line(43, 45, 56, 43.5, 0.8, Yd);
      d.eye(50, 43, 2.2, 2, '#2a6ae0');
      // gueule ouverte : langue violette, dents blanches
      d.poly([[46, 50], [60, 49], [57, 57], [46, 54]], '#5a1830');
      d.deco.ell(52, 53, 4, 1.6, '#a050c0');
      for (const x of [48, 51, 54, 57]) d.deco.poly([[x, 49.6], [x + 0.9, 52], [x + 1.8, 49.6]], '#ffffff', { unlit: true });
    },
    gekomon(d) {
      const G = '#4aa84a', Gd = '#2e7a30', Y = '#f0d860', R = '#e04a4a';
      d.ell(24, 60, 6, 2.4, Gd, 0, { far: true }); d.ell(40, 60.4, 6.6, 2.4, G);
      d.ell(32, 46, 18, 14, G, 0, { shiny: true }); d.deco.ell(36, 50, 11, 8, Y);
      d.tube([[16, 42], [10, 50]], 5, 4, Gd, { far: true }); d.tube([[46, 42], [52, 48]], 5, 4, G);
      d.ell(34, 28, 13, 9, G, 0, { shiny: true });
      d.tube([[24, 22], [18, 10], [22, 4]], 3, 4.6, '#e0b040', { shiny: true }); d.tube([[40, 21], [44, 10], [50, 6]], 3, 4.6, '#e0b040', { shiny: true });
      d.eye(32, 26, 3.6, 4, '#2a2a2a', { look: 0.3 }); d.eye(42, 26, 3, 3.6, '#2a2a2a', { look: 0.3 });
      d.deco.curve([[34, 34], [41, 36], [47, 33]], 1.4, R, { unlit: true });
    },
    drimogemon(d) {
      const B = '#7a5a3a', Bd = '#5a3e26', Bl = '#a88058', S = '#c8ccd6';
      d.ell(24, 58, 7, 3.4, Bd, 0, { far: true }); d.ell(40, 58.4, 7.4, 3.4, B);
      d.ell(30, 42, 19, 15, B, 0, { tex: 0.4 }); d.deco.ell(36, 46, 10, 8, Bl);
      d.tube([[18, 40], [12, 50]], 6, 5, Bd, { far: true }); d.tube([[44, 40], [52, 48]], 6, 5, B);
      for (let i = 0; i < 3; i++) d.tube([[52, 48], [57 + i * 2, 50 + i * 2]], 1.6, 0.6, CL);
      d.ell(44, 26, 11, 9, B, 0, { tex: 0.3 });
      d.poly([[52, 22], [64, 26], [52, 30]], S, { shiny: true }); for (let i = 0; i < 3; i++) d.deco.line(54 + i * 3, 23 + i, 54 + i * 3, 29 - i, 0.6, '#7a808e');
      d.deco.ell(46, 22, 1.6, 1.2, K, 0, { unlit: true }); d.deco.curve([[44, 30], [50, 31]], 0.8, '#2a1a10', { unlit: true });
    },
    unimon(d) {
      const W = '#f4f2ec', Wd = '#c8c4b8', R = '#d83a3a', Wg = '#e0eaf8';
      d.poly([[26, 24], [8, 4], [6, 22], [20, 32]], Wg, { far: true, shiny: true });
      for (const [x, far] of [[20, true], [26, false], [40, true], [46, false]]) { d.tube([[x, 42], [x - 1, 58]], 4.4, 3.4, far ? Wd : W, { far }); d.ell(x, 59.6, 3, 1.8, '#8a8a90', 0, { far }); }
      d.ell(32, 38, 18, 9, W, 0, { shiny: true });
      d.tube([[14, 36], [6, 42], [4, 50]], 4, 2, '#d8d0f0');
      d.tube([[46, 34], [50, 22]], 7, 6, W);
      d.ell(54, 18, 8, 5.4, W, 0.3, { shiny: true });
      d.poly([[48, 14], [56, 12], [60, 18], [52, 20]], R, { shiny: true }); d.tube([[54, 12], [58, 2]], 2.4, 0.6, '#e0c040', { shiny: true });
      d.poly([[46, 16], [40, 8], [42, 20]], '#a8b8f0', { tex: 0.3 });
      d.deco.ell(55, 17, 1.4, 1.2, '#2a2a3a', 0, { unlit: true });
      d.poly([[38, 30], [22, 12], [20, 26], [32, 36]], Wg, { shiny: true }); d.deco.line(24, 16, 32, 32, 0.6, '#a8b8d0');
    },
    centarumon(d) {
      const H = '#a8a8b8', Hd = '#7a7a8c', T = '#e8c8a0', A = '#c8ccd6', R = '#d83a3a';
      for (const [x, far] of [[16, true], [22, false], [36, true], [42, false]]) { d.tube([[x, 44], [x, 58]], 5, 4, far ? Hd : H, { far }); d.ell(x + 1, 59.6, 3.4, 1.8, '#5a5a6a', 0, { far }); }
      d.ell(28, 42, 17, 9, H, 0, { shiny: true }); d.tube([[12, 40], [4, 46]], 3, 1.4, '#e8e0d0');
      d.blob([[36, 20], [48, 20], [50, 34], [44, 42], [36, 40]], T);
      d.deco.rect(38, 28, 10, 4, A);
      d.tube([[48, 24], [56, 28], [62, 28]], 6, 5, A, { shiny: true }); d.circ(62, 28, 2, '#5ad8ff', { unlit: true });
      d.ell(44, 13, 6.4, 6.4, A, 0, { shiny: true }); d.deco.ell(46, 13, 2.4, 2.4, R, 0, { unlit: true }); d.deco.ell(46.6, 12.6, 0.8, 0.8, '#ffd0c0', 0, { unlit: true });
      d.poly([[40, 8], [44, 2], [48, 8]], R);
    },
    bakemon(d) {
      const W = '#f0f0f6', Wd = '#c8c8d8';
      d.blob([[18, 60], [20, 44], [16, 30], [24, 14], [36, 10], [46, 18], [48, 34], [46, 50], [52, 60], [42, 56], [34, 62], [26, 56]], W, { shiny: true });
      d.deco.blob([[22, 56], [24, 44], [22, 32], [28, 20], [26, 34], [28, 50]], Wd);
      d.tube([[44, 32], [54, 36], [58, 34]], 4, 2.4, W); for (let i = 0; i < 3; i++) d.tube([[58, 34], [62, 31 + i * 3]], 1.2, 0.4, '#2a2a3a');
      d.deco.ell(34, 22, 3.4, 4, K, 0, { unlit: true }); d.deco.ell(43, 23, 3, 3.6, K, 0, { unlit: true });
      d.deco.ell(35, 22, 1.2, 1.4, '#ff5a5a', 0, { unlit: true }); d.deco.ell(43.6, 23, 1, 1.2, '#ff5a5a', 0, { unlit: true });
      d.poly([[30, 12], [36, 4], [42, 12]], '#d83a3a'); d.deco.curve([[34, 31], [40, 33], [45, 30]], 1, '#3a2a3a', { unlit: true });
    },
    devimon(d) {
      const K2 = '#26222e', Kl = '#4a4458', R = '#d83a3a', Wg = '#3a2a4a', S = '#e8e0d0';
      d.poly([[26, 20], [2, 2], [6, 14], [0, 18], [8, 24], [2, 32], [20, 30]], Wg, { far: true, shiny: true });
      d.poly([[38, 20], [62, 4], [58, 16], [64, 20], [56, 24], [62, 32], [44, 30]], Wg, { far: true, shiny: true });
      d.tube([[29, 42], [28, 52], [27, 59]], 6, 5, K2, { far: true }); d.tube([[35, 42], [37, 52], [37, 59]], 6.4, 5.4, K2);
      d.ell(28, 60.4, 5, 2.2, K2, 0, { far: true }); d.ell(39, 60.6, 5.4, 2.2, K2);
      d.blob([[23, 20], [39, 20], [41, 34], [37, 44], [27, 44], [22, 32]], K2, { shiny: true });
      d.deco.curve([[26, 26], [32, 30], [38, 26]], 1.4, R); d.deco.ell(28, 23, 4, 2, Kl, -0.3);
      d.tube([[23, 22], [16, 34], [14, 46]], 4, 3, K2, { far: true }); d.tube([[39, 22], [48, 34], [54, 46]], 4.4, 3.4, K2);
      for (let i = 0; i < 3; i++) d.tube([[54, 46], [55 + i * 2, 53]], 1.2, 0.4, R);
      d.ell(32, 13, 7, 7, K2, 0, { shiny: true }); d.poly([[26, 10], [32, 6], [38, 10], [36, 16], [28, 16]], S, { shiny: true });
      d.deco.ell(30, 11.6, 1.4, 1, R, 0, { unlit: true }); d.deco.ell(34.6, 11.6, 1.4, 1, R, 0, { unlit: true });
      d.poly([[27, 8], [22, 0.6], [30, 6]], '#c8c0b0'); d.poly([[37, 8], [42, 0.6], [34, 6]], '#c8c0b0');
    },
    // ---------------------------------------------------------- Ultimes
    andromon(d) {
      const S = '#c0c8d6', Sd = '#8a94a8', Sl = '#eef2f8', R = '#e03a3a', B = '#3a6ad8';
      d.tube([[29, 40], [28, 51], [27, 59]], 7, 6.4, Sd, { far: true }); d.tube([[36, 40], [38, 51], [38, 59]], 7.6, 6.8, S, { shiny: true });
      d.ell(28, 60.4, 5.4, 2.4, Sd, 0, { far: true }); d.ell(40, 60.6, 5.8, 2.4, S);
      d.blob([[22, 18], [40, 18], [43, 32], [38, 42], [26, 42], [21, 30]], S, { shiny: true });
      d.deco.rect(27, 22, 10, 9, B); d.deco.circ(32, 26.5, 2.4, '#8ae0ff', { unlit: true }); d.deco.line(24, 36, 40, 36, 1, Sd);
      d.tube([[23, 20], [16, 30], [16, 40]], 6, 5, Sd, { far: true });
      d.tube([[40, 22], [50, 28], [56, 30]], 6.4, 5.4, S, { shiny: true });
      for (let i = 0; i < 4; i++) d.tube([[56, 30], [62, 24 + i * 4]], 1.6, 0.4, Sl, { shiny: true });
      d.ell(33, 10, 7, 7, S, 0, { shiny: true }); d.deco.rect(29, 8, 10, 3, R, { unlit: true }); d.deco.line(30, 15, 37, 15, 0.8, Sd);
      d.poly([[27, 6], [24, 0.6], [30, 4]], Sl);
    },
    etemon(d) {
      const F = '#a8783a', Fl = '#e8c890', J = '#2a2a34', Gl = '#1a1a1a';
      d.tube([[29, 40], [28, 51], [27, 59]], 7, 6, J, { far: true }); d.tube([[35, 40], [37, 51], [37, 59]], 7.4, 6.4, J);
      d.ell(28, 60.4, 5.4, 2.4, '#5a3a20', 0, { far: true }); d.ell(39, 60.6, 5.8, 2.4, '#6a4a2a');
      d.blob([[22, 18], [40, 18], [43, 30], [38, 42], [26, 42], [21, 30]], J, { shiny: true });
      d.deco.line(32, 18, 32, 40, 0.8, '#e0c040'); d.deco.rect(24, 36, 16, 3, '#e0c040');
      d.tube([[23, 20], [16, 28], [14, 36]], 5, 4, F, { far: true });
      d.tube([[40, 22], [48, 26], [52, 20]], 5.4, 4.6, F); d.ell(52, 18, 3, 3, F);
      d.tube([[52, 18], [54, 10]], 1.6, 1.6, '#5a5a62'); d.circ(54, 8, 2.6, '#8a8a92', { shiny: true });
      d.ell(32, 11, 9, 8, F, 0, { tex: 0.3 }); d.ell(38, 14, 6, 5, Fl);
      d.ell(24, 10, 3.4, 3.4, F); d.deco.ell(24, 10, 1.8, 1.8, Fl);
      d.deco.rect(31, 8, 12, 4, Gl, { unlit: true }); d.deco.rect(32, 8.6, 3, 1, '#8ad0ff', { unlit: true });
      d.deco.curve([[36, 17], [40, 18], [44, 16]], 1, '#3a1a0a', { unlit: true });
    },
    skullgreymon(d) {
      const B = '#f0eadc', Bd = '#c8c0a8', K3 = '#2a2224', M = '#5a6070';
      d.tube([[18, 44], [8, 50], [1, 56]], 4, 2, B);
      for (let i = 0; i < 5; i++) d.tube([[14 - i * 2.6, 46 + i * 2], [14 - i * 2.6, 50 + i * 2]], 2, 1, Bd);
      d.tube([[26, 46], [25, 54], [27, 60]], 4, 3, Bd, { far: true }); d.tube([[38, 46], [39, 54], [41, 60]], 4.4, 3.4, B);
      d.ell(28, 60.6, 5, 2, Bd, 0, { far: true }); d.ell(42, 60.6, 5.4, 2, B);
      d.tube([[16, 40], [36, 32]], 4, 4, B);
      for (let i = 0; i < 5; i++) d.curve([[20 + i * 4, 37 - i * 1.4], [22 + i * 4, 46 - i], [26 + i * 3.4, 48 - i]], 1.6, B);
      d.tube([[24, 30], [20, 16]], 5, 4, M, { shiny: true }); d.poly([[18, 16], [22, 6], [24, 16]], '#d83a3a');
      d.tube([[36, 32], [44, 22]], 4, 3.4, B);
      d.ell(48, 18, 10, 7, B, 0.1, { shiny: true }); d.ell(54, 24, 7, 3.4, B, 0.2);
      d.deco.ell(48, 16, 3, 2.6, K3, 0, { unlit: true }); d.deco.ell(48.4, 16, 1, 1, '#ff3a3a', 0, { unlit: true });
      for (let i = 0; i < 4; i++) d.deco.poly([[48 + i * 3, 22], [49.4 + i * 3, 26], [50.8 + i * 3, 22]], '#ffffff');
      d.tube([[38, 34], [46, 40]], 2.6, 2, B); for (let i = 0; i < 3; i++) d.tube([[46, 40], [50, 37 + i * 3]], 1.2, 0.4, B);
    },
    megadramon(d) {
      // dragon rouge serpentin, tête de métal, deux bras-canons argentés, grandes ailes violettes déchiquetées
      const R = '#c8322a', Rd = '#8a1c18', Bel = '#f0a83a', M = '#6a6e7a', Md = '#3a3e48', Ml = '#c8ccd6', Wv = '#5a48b0', Wd = '#3a2c80';
      // ailes (derrière)
      d.blob([[24, 18], [34, 4], [52, 1], [63, 6], [54, 10], [60, 14], [50, 16], [56, 21], [44, 22], [48, 28], [34, 26]], Wv, { far: true, tex: 0.2 });
      for (const [x0, y0, x1, y1] of [[30, 18, 52, 4], [32, 21, 56, 12], [34, 24, 52, 20]]) d.deco.line(x0, y0, x1, y1, 0.7, Wd);
      // corps serpentin rouge enroulé (ventre jaune-orangé)
      d.tube(smooth([[26, 26], [22, 36], [24, 46], [32, 52], [39, 49], [38, 42], [31, 42], [28, 48], [30, 56], [22, 62]]), 9, 3, R, { shiny: true });
      d.deco.tube([[24.5, 30], [22.5, 38], [25.5, 46], [32, 50]], 2.6, 2.2, Bel);
      for (const [x, y] of [[23, 34], [23.5, 40], [26, 46], [30, 49.5]]) d.deco.line(x - 2, y, x + 2, y + 0.8, 0.6, '#c87a20');
      // tête de métal
      d.ell(26, 14, 8, 6.4, M, -0.2, { shiny: true });
      d.poly([[30, 13], [44, 10], [46, 16], [32, 19]], M, { shiny: true });
      d.poly([[31, 18], [44, 18], [41, 22], [31, 21]], Md, { shiny: true });
      for (const x of [34, 37, 40]) d.deco.poly([[x, 17.6], [x + 0.9, 19.6], [x + 1.8, 17.6]], '#ffffff', { unlit: true });
      d.poly([[20, 9], [14, 2], [24, 7]], Md); d.poly([[24, 8], [22, 0], [28, 7]], Md);
      d.eye(30, 12, 1.8, 1.4, '#ffd020');
      // épaulières et bras-canons
      d.ell(34, 30, 6, 5, Ml, 0, { shiny: true }); d.deco.line(31, 28, 37, 32, 0.6, Md);
      d.tube([[36, 30], [50, 33], [58, 36]], 6, 5, Ml, { shiny: true }); d.poly([[57, 32.5], [64, 37], [57, 40]], M, { shiny: true });
      d.deco.line(42, 29, 42, 35, 0.7, Md); d.deco.line(48, 30, 48, 36.6, 0.7, Md);
      d.tube([[34, 38], [46, 44], [54, 48]], 5.6, 4.6, Ml, { shiny: true }); d.poly([[53, 44.6], [60, 50], [52.6, 51.6]], M, { shiny: true });
      d.deco.line(42, 39.6, 40.4, 45, 0.7, Md); d.deco.line(48, 42.6, 46.6, 48, 0.7, Md);
      d.deco.circ(60, 36.5, 1, '#ff6030', { unlit: true }); d.deco.circ(56.6, 49.4, 1, '#ff6030', { unlit: true });
    },
    piximon(d) {
      const P = '#f0a0c0', Pd = '#d07aa0', W = '#fff4f8', Wg = '#e0f0ff';
      d.poly([[22, 30], [8, 18], [10, 32], [22, 36]], Wg, { far: true, shiny: true }); d.poly([[42, 30], [56, 18], [54, 32], [42, 36]], Wg, { shiny: true });
      d.tube([[44, 50], [60, 16]], 1.6, 1.4, '#c8a040'); d.poly([[58, 18], [62, 8], [62, 18]], '#d8dce8', { shiny: true });
      d.ell(32, 42, 14, 14, P, 0, { tex: 0.3 });
      d.ell(24, 56, 4, 3, Pd, 0, { far: true }); d.ell(38, 57, 4.4, 3, P);
      d.ell(34, 42, 8, 7, W);
      d.eye(32, 40, 2.6, 3.2, '#2a2a6a', { look: 0.3 }); d.eye(39, 40.4, 2.2, 3, '#2a2a6a', { look: 0.3 });
      d.deco.curve([[33, 46], [36, 47.4], [39, 46]], 0.8, '#a04a6a', { unlit: true });
      d.poly([[26, 30], [32, 22], [38, 30]], '#e8c040', { shiny: true }); d.tube([[44, 44], [46, 48]], 3, 3, P);
    },
  });
})();
