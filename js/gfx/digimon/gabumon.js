'use strict';
// =====================================================================
//  DESSINS — LIGNÉE DE GABUMON (Punimon → Tsunomon → Gabumon → Garurumon →
//  WereGarurumon → MetalGarurumon), d'après les modèles officiels (proportions et couleurs, rien n'est copié) :
//  fourrure blanc lavande rayée de bleu-violet, griffes rose foncé, yeux rouges.
//  Repère 64x64, tourné vers la DROITE, sol à y≈62. Pose « attack » : gueule ouverte, flamme bleue / souffle glacé.
// =====================================================================
(function () {
  const FUR = '#eeedfa', FURd = '#c4c0e2', STR = '#3a2aa0';
  const CL = '#a8346a';
  // griffes rose foncé (un éventail de 3)
  const claws = (d, x, y, l, o = {}) => {
    for (let i = -1; i <= 1; i++) {
      const a = (o.ang || 0) + i * 0.4, by = y + i * (o.spread || 2.2);
      d.tube([[x, by], [x + Math.cos(a) * l * 0.6, by + Math.sin(a) * l * 0.6 - 0.5], [x + Math.cos(a + 0.35) * l, by + Math.sin(a + 0.35) * l]], o.w || 1.8, 0.3, o.col || CL, { shiny: true, far: o.far });
    }
  };
  // orteils : bourrelets blancs + griffes rose foncé
  const foot = (d, x, y, s = 1, far = false) => {
    for (let i = 0; i < 3; i++) {
      d.ell(x + i * 3.6 * s, y - 1.4 * s, 2 * s, 1.8 * s, FUR, 0, { far });
      d.poly([[x + i * 3.6 * s - 1 * s, y - 0.6 * s], [x + i * 3.6 * s + 2.6 * s, y + 1.2 * s], [x + i * 3.6 * s + 1.4 * s, y - 2 * s]], CL, { shiny: true, far });
    }
  };
  // rayures de la fourrure (bleu-violet, effilées)
  const stripe = (d, pts, w = 2.2, col = STR) => d.deco.tube(pts, w * 1.35, w * 0.6, col, { unlit: true });
  const blueFire = (d, x, y, s = 1) => {
    d.deco.ell(x, y, 5.6 * s, 3.4 * s, '#3a6aff', 0, { unlit: true }); d.deco.ell(x + 1.2 * s, y, 3.8 * s, 2.3 * s, '#8ac8ff', 0, { unlit: true }); d.deco.ell(x + 2 * s, y, 1.8 * s, 1.2 * s, '#ffffff', 0, { unlit: true });
  };

  Object.assign(DW.DRAW, {
    // ---------------------------------------------------------- Bébé : Punimon, gelée rouge à deux grandes « oreilles »
    punimon(d, p = {}) {
      const R = '#e8303c', Rd = '#a8182a', Rl = '#ff8a8a';
      d.blob([[16, 40], [15, 24], [20, 18], [25, 24], [26, 36]], R, { far: true, shiny: true });
      d.blob([[36, 34], [38, 18], [44, 13], [49, 20], [48, 38]], R, { shiny: true });
      d.deco.blob([[40, 30], [41, 20], [44, 17], [46, 22], [45, 31]], Rl);
      d.blob([[12, 52], [13, 40], [22, 32], [42, 31], [52, 38], [54, 50], [46, 59], [20, 59]], R, { shiny: true });
      d.ell(33, 59.6, 18, 2.8, Rd, 0, { noline: true });
      d.deco.ell(22, 40, 6, 3, Rl, -0.4); d.deco.ell(21, 39.4, 2.6, 1, '#ffffff', -0.4);
      for (const [x, r] of [[27, 3.4], [40, 3.8]]) { d.deco.circ(x, 47, r + 0.8, '#1a0a10', { unlit: true }); d.deco.circ(x, 47, r, '#ffffff', { unlit: true }); d.deco.circ(x + 0.8, 47.4, r * 0.45, '#1a0a10', { unlit: true }); }
      if (p.pose === 'attack') { d.deco.ell(34, 54.4, 2.6, 2, '#5a0a14', 0, { unlit: true }); d.deco.circ(48, 49, 1.8, '#ffe0e0', { unlit: true }); d.deco.circ(52, 46, 1.2, '#ffe0e0', { unlit: true }); }
      else d.deco.curve([[31.4, 54], [33.4, 55.2], [35.4, 54]], 0.9, '#5a0a14', { unlit: true });
    },

    // ---------------------------------------------------------- Entraînement : Tsunomon, boule de poils orange, corne grise
    tsunomon(d, p = {}) {
      const O = '#e8962e', Od = '#b8661a', Cr = '#fbecd2', Hn = '#7a8494', Hl = '#b0b8c4';
      d.poly([[24, 30], [26, 14], [32, 2], [36, 12], [38, 28]], Hn, { shiny: true, round: 0.3 });
      d.deco.poly([[29, 26], [31, 10], [33.6, 6], [33, 26]], Hl);
      d.blob([[11, 46], [13, 34], [22, 27], [42, 27], [52, 35], [54, 47], [48, 57], [32, 60], [17, 57]], O, { tex: 0.2 });
      for (const [x, y, a] of [[11, 44, 3.1], [12, 51, 2.7], [53, 42, 0], [52, 50, 0.4], [16, 33, 2.4], [48, 32, 0.8]]) d.poly([[x - 2.6, y - 2.6], [x + Math.cos(a) * 5, y + Math.sin(a) * 5], [x + 2.6, y + 2.6]], O);
      d.deco.blob([[16, 48], [20, 41], [32, 39], [45, 41], [49, 48], [44, 56], [32, 58], [21, 56]], Cr);
      d.ell(32, 60.2, 15, 2.4, Od, 0, { noline: true });
      for (const x of [26, 39]) {
        d.deco.ell(x, 41.4, 3.6, 3.2, '#2a1008', 0, { unlit: true }); d.deco.ell(x + 0.4, 41.8, 2.6, 2.4, '#d42a2a', 0, { unlit: true });
        d.deco.circ(x + 0.6, 42, 1.1, '#2a0808', { unlit: true }); d.deco.circ(x - 0.8, 40.6, 0.8, '#ffffff', { unlit: true });
      }
      if (p.pose === 'attack') { d.deco.ell(32.6, 50.4, 3.4, 2.4, '#5a1008', 0, { unlit: true }); d.deco.circ(47, 50, 2.2, '#e0f0ff', { unlit: true }); }
      else d.deco.curve([[29.6, 49.4], [32.6, 51], [35.6, 49.4]], 1, '#6a3008', { unlit: true });
    },

    // ---------------------------------------------------------- Disciple : Gabumon, reptile jaune sous la fourrure de Garurumon
    gabumon(d, p = {}) {
      const Y = '#f6cc3a', Yd = '#c8981e', Yl = '#ffe68a', Hn = '#f0d050', Hd = '#9a7020';
      const atk = p.pose === 'attack';
      // queue jaune qui sort de sous la fourrure
      d.tube([[20, 52], [12, 54], [6, 50], [3, 45]], 7, 3, Y);
      // jambe éloignée
      d.ell(37, 55, 5.4, 6.8, Yd, 0, { far: true }); foot(d, 35, 61.6, 0.8, true);
      // corps jaune, ventre clair avec l'emblème
      d.blob([[20, 40], [30, 34], [40, 38], [41, 50], [34, 57], [24, 56], [18, 48]], Y);
      d.deco.blob([[29, 41], [38, 42], [38, 51], [32, 55], [28, 48]], Yl);
      d.deco.ell(33, 47, 3.2, 3.6, '#e05a8a'); d.deco.ell(33, 46.4, 1.8, 2, '#4ab8e8'); d.deco.circ(32.2, 45.8, 0.5, '#1a1a2a'); d.deco.circ(33.8, 45.8, 0.5, '#1a1a2a');
      // jambe proche
      d.ell(26, 54, 6.4, 7.4, Y); foot(d, 23, 62, 0.9);
      // FOURRURE D'UN SEUL TENANT : du bas du dos jusqu'au museau du loup, qui forme la capuche
      d.blob([[14, 50], [12, 40], [15, 30], [21, 20], [29, 12], [39, 8], [50, 9], [58, 13], [62, 19], [59, 23], [50, 22], [42, 24], [36, 30], [30, 38], [24, 46], [20, 52]], FUR, { tex: 0.1 });
      // rayures qui suivent la fourrure
      for (const [a, b, w] of [[[14, 44], [20, 42], 2.4], [[15, 36], [22, 34], 2.4], [[19, 27], [26, 26], 2.2], [[25, 19], [31, 20], 2.2], [[33, 11], [35, 16], 2], [[42, 9], [43, 14], 1.8], [[49, 10], [49, 15], 1.6], [[55, 13], [54, 17], 1.4], [[28, 34], [33, 31], 1.8]]) stripe(d, [a, b], w);
      // oreilles de la capuche
      d.poly([[30, 12], [24, 3], [35, 9]], FUR); stripe(d, [[27, 7], [30, 10]], 1.2);
      // corne jaune striée sur le front
      d.tube([[42, 9], [41, 2], [39, -1.6]], 4.4, 0.6, Hn, { shiny: true });
      for (const y of [6, 3, 0.4]) d.deco.line(40.4, y, 42.4, y - 0.6, 0.7, Hd);
      d.deco.ell(61.4, 17.6, 1.2, 1, '#2a2a3a', 0, { unlit: true });
      // crocs de la capuche (mâchoire du haut), juste au-dessus du visage
      for (let i = 0; i < 4; i++) d.poly([[44 + i * 4, 21.6], [45.4 + i * 4, 25.6], [46.8 + i * 4, 21.6]], '#ffffff');
      // le visage jaune, DANS la gueule de la capuche ; œil rouge sous le rebord
      d.blob([[38, 26], [44, 22], [54, 22.6], [60, 26], [59, 32], [50, 34.6], [42, 33.6]], Y);
      d.deco.ell(52, 32, 5, 1.6, Yl);
      d.eye(45.4, 26.4, 2.8, 3.2, '#d42020', { look: 0.4 });
      d.deco.ell(58.6, 27.4, 0.8, 0.6, '#5a2a10', 0, { unlit: true });
      if (atk) { d.deco.poly([[45, 30.6], [59, 29], [58, 34.6], [48, 34]], '#7a1010', { unlit: true }); blueFire(d, 59, 32, 0.9); }
      else d.deco.curve([[44, 31.6], [51, 32.4], [58.6, 30.6]], 1.1, '#7a3a10', { unlit: true });
      // pan de fourrure qui retombe sur l'épaule (relie la capuche au bras)
      d.blob([[34, 30], [40, 30], [43, 36], [38, 40], [33, 37]], FUR); stripe(d, [[36, 32], [40, 35]], 1.6);
      // bras : manche de fourrure, main jaune aux griffes rose foncé
      d.tube([[38, 35], [42, 40], [46, 42]], 5.2, 4.6, FUR); stripe(d, [[40, 37.6], [42.6, 40.6]], 1.6);
      d.ell(48, 42.4, 3.2, 3, Y);
      claws(d, 50, 42.2, atk ? 4.6 : 3.4, { w: 1.4, spread: 1.6, ang: atk ? -0.3 : 0.2 });
    },

    // ---------------------------------------------------------- Champion : Garurumon, loup blanc lavande rayé, accroupi
    garurumon(d, p = {}) {
      const atk = p.pose === 'attack';
      d.tube([[14, 32], [7, 28], [3, 21], [5, 15], [10, 13]], 6.4, 2.4, FUR);
      stripe(d, [[6, 27], [9, 24]], 2); stripe(d, [[3.4, 20], [6.6, 18]], 1.8); stripe(d, [[6, 14.6], [9, 13.4]], 1.4);
      d.tube([[20, 42], [16, 50], [18, 58]], 8, 6.4, FURd, { far: true }); foot(d, 15, 61.6, 0.95, true);
      d.tube([[42, 42], [46, 50], [46, 57]], 8, 6.4, FURd, { far: true }); foot(d, 44, 61.6, 0.95, true);
      d.blob([[9, 34], [18, 25], [36, 25], [47, 32], [50, 43], [38, 49], [18, 49], [8, 42]], FUR, { tex: 0.12 });
      for (let x = 12; x < 46; x += 5) d.poly([[x - 2, 47], [x + 1, 51], [x + 3, 47]], FUR);   // fourrure ébouriffée sous le ventre
      for (const [a, b] of [[[16, 30], [19, 39]], [[22, 28.4], [24, 38]], [[29, 28.4], [30, 37]], [[36, 30], [36, 38]], [[12, 36], [15, 42]], [[42, 34], [42, 40]]]) stripe(d, [a, b], 2.6);
      // touffes en pointes sur le dos et les épaules
      for (const [x, y, h, a] of [[18, 29, 9, -1.9], [24, 28, 11, -1.7], [30, 28, 10, -1.5], [36, 29, 9, -1.3], [42, 32, 8, -1.1]]) {
        d.poly([[x - 3, y + 1], [x + Math.cos(a) * h, y + Math.sin(a) * h], [x + 3, y + 1]], FUR);
        stripe(d, [[x, y - 1], [x + Math.cos(a) * h * 0.7, y + Math.sin(a) * h * 0.7]], 1.2);
      }
      d.tube([[16, 42], [13, 50], [14, 58]], 9.6, 7.4, FUR); stripe(d, [[12, 48], [16.6, 49]], 1.8); foot(d, 10, 62, 1);
      d.tube([[40, 42], [44, 49], [43, 57]], 9.8, 7.4, FUR); stripe(d, [[41, 46], [45.6, 47]], 1.8); foot(d, 40, 62, 1);
      // tête basse en avant
      d.poly([[44, 30], [44, 20], [50, 27]], FUR); d.poly([[48, 28], [50, 19], [53, 27]], FUR, { far: true });
      d.blob([[41, 35], [45, 27], [54, 25.6], [61, 30], [64, 36], [61, 42], [52, 43], [44, 41]], FUR);
      for (const [x, y] of [[43, 30], [42, 36], [44, 41]]) d.poly([[x + 2, y - 3], [x - 4, y], [x + 2, y + 3]], FUR);   // joues ébouriffées
      stripe(d, [[47, 29], [49, 33]], 1.8); stripe(d, [[52, 28], [53, 32]], 1.6); stripe(d, [[45, 37], [49, 39]], 1.6);
      d.deco.ell(63.2, 34.6, 1.2, 1, '#2a2a3a', 0, { unlit: true });
      d.deco.ell(53.4, 32.6, 2.6, 1.6, '#1a0a10', -0.2, { unlit: true }); d.deco.ell(53.8, 32.6, 1.7, 1.1, '#e02a2a', -0.2, { unlit: true }); d.deco.circ(53.2, 32, 0.5, '#ffffff', { unlit: true });
      d.deco.curve([[50, 30.6], [56, 30]], 1.1, STR, { unlit: true });
      if (atk) {
        d.deco.poly([[47, 38], [63, 36], [62, 43], [50, 42]], '#6a0a14', { unlit: true });
        for (let i = 0; i < 4; i++) d.deco.poly([[50 + i * 3.4, 37.6], [51.2 + i * 3.4, 40], [52.4 + i * 3.4, 37.4]], '#ffffff', { unlit: true });
        blueFire(d, 59, 40, 1.2);
      } else {
        d.deco.curve([[47, 39], [55, 39.4], [63, 37.6]], 1.1, '#3a2a3a', { unlit: true });
        for (let i = 0; i < 3; i++) d.deco.poly([[52 + i * 3.2, 39.2], [53.2 + i * 3.2, 41.4], [54.4 + i * 3.2, 39]], '#ffffff', { unlit: true });
      }
    },

    // ---------------------------------------------------------- Ultime : WereGarurumon, loup-garou en jean et cuir
    weregarurumon(d, p = {}) {
      const J = '#3a64b0', Jd = '#24447a', Jl = '#7a9ad0', L = '#8a5a30', Ld = '#5a3a1e', K = '#2a2a32', M = '#d8d8e0';
      const atk = p.pose === 'attack';
      d.tube([[32, 38], [35, 47], [34, 52]], 8, 7, Jd, { far: true });
      d.ell(35, 55, 5, 3.6, FURd, 0, { far: true }); foot(d, 33, 61.6, 1, true);
      d.tube([[22, 20], [16, 28], [15, 35]], 6.4, 5.6, K, { far: true });
      for (const y of [25, 29, 33]) d.deco.circ(16.6, y, 0.8, M, { unlit: true, far: true });
      d.ell(15, 37, 4, 3.4, FURd, 0, { far: true }); claws(d, 15, 40, 3.2, { far: true, ang: 1.5 });
      d.blob([[21, 15], [36, 13], [42, 21], [40, 34], [32, 38], [22, 36], [18, 25]], FUR, { tex: 0.12 });
      stripe(d, [[22, 18], [26, 21]], 2.2); stripe(d, [[20, 26], [25, 28]], 2.2); stripe(d, [[37, 18], [39, 24]], 2); stripe(d, [[22, 32], [27, 33]], 1.8);
      d.deco.tube([[23, 16], [38, 33]], 2.4, 2.4, L); d.deco.tube([[37, 16], [24, 34]], 2.4, 2.4, L);
      d.deco.circ(30.6, 25, 1.4, '#c8a040', { unlit: true });
      d.ell(37, 17, 6, 4, L, -0.3); d.deco.ell(37, 16.6, 3.6, 1.4, '#a8784a', -0.3);
      d.rect(20, 34, 22, 4, Ld, { round: 0.3 }); d.deco.rect(29, 34.4, 4, 3, '#c8a040');
      d.tube([[25, 38], [23, 47], [24, 52]], 9, 8, J);
      d.deco.circ(24.6, 43, 2.2, '#ffffff'); d.deco.circ(23.8, 42.6, 0.5, K); d.deco.circ(25.4, 42.6, 0.5, K); d.deco.line(22, 46, 27, 45.4, 0.7, '#ffffff');
      d.deco.line(21, 49, 26, 50, 0.7, Jl); d.deco.poly([[21, 51], [24, 49.6], [27, 51.6], [24, 53]], Jl);
      d.ell(25, 55, 5.6, 4, FUR); foot(d, 21, 62.2, 1.1);
      for (let i = 0; i < 6; i++) d.poly([[18 + i * 3, 16], [13 + i * 3.6, 4 - (i % 2) * 3], [23 + i * 3, 11]], FUR);
      for (let i = 0; i < 6; i++) stripe(d, [[17 + i * 3, 12], [15 + i * 3.4, 7]], 1.2);
      d.blob([[30, 11], [34, 4], [42, 1.6], [50, 4], [57, 8], [58, 13], [51, 16], [38, 17]], FUR);
      stripe(d, [[36, 5], [38, 9]], 1.8); stripe(d, [[42, 3], [43, 7]], 1.6);
      d.poly([[34, 6], [32, -2], [39, 3]], FUR);
      d.deco.ell(57.6, 9.6, 1.2, 1, '#1a1a22', 0, { unlit: true });
      d.deco.ell(46, 7.6, 2.4, 1.5, '#1a0a10', -0.2, { unlit: true }); d.deco.ell(46.4, 7.6, 1.5, 1, '#e02a2a', 0, { unlit: true });
      d.deco.curve([[42.6, 5.6], [49, 5.2]], 1.2, STR, { unlit: true });
      if (atk) { d.deco.poly([[44, 12], [58, 11.4], [56, 17], [47, 16.4]], '#6a0a14', { unlit: true }); for (let i = 0; i < 3; i++) d.deco.poly([[46 + i * 3.4, 12], [47.2 + i * 3.4, 14.4], [48.4 + i * 3.4, 11.8]], '#ffffff', { unlit: true }); }
      else { d.deco.curve([[44, 13.4], [51, 14], [57, 12.6]], 1, '#3a2a3a', { unlit: true }); d.deco.poly([[50, 13.8], [51, 16], [52, 13.6]], '#ffffff', { unlit: true }); }
      const hx = atk ? 56 : 48, hy = atk ? 24 : 32;
      d.tube([[36, 20], [42, 26], [hx - 4, hy]], 7, 5.8, FUR); stripe(d, [[39, 22], [42, 26]], 1.8);
      d.rect(hx - 8, hy - 3.2, 5, 6.4, Ld, { round: 0.3 });
      for (const yy of [hy - 2, hy + 1.6]) d.poly([[hx - 4, yy - 1], [hx - 1.6, yy], [hx - 4, yy + 1]], M, { unlit: true });
      d.ell(hx, hy, 4, 3.6, FUR);
      claws(d, hx + 2, hy, atk ? 6 : 3.6, { w: 1.8, spread: 1.8, ang: atk ? -0.3 : 0.2 });
    },

    // ---------------------------------------------------------- Méga : MetalGarurumon, loup cuirassé bleu et or, ailes d'énergie
    metalgarurumon(d, p = {}) {
      const M = '#4a5aa8', Md = '#2e3a78', Ml = '#7a8ad0', G = '#e8c040', Gd = '#a88420', E = '#f8f070', V = '#e83a2a';
      const atk = p.pose === 'attack';
      d.poly([[22, 28], [4, 2], [12, 4], [28, 26]], E, { far: true }); d.poly([[30, 26], [24, 0], [32, 4], [36, 24]], E);
      d.deco.line(24, 26, 8, 4, 0.8, '#ffffff'); d.deco.line(32, 24, 27, 3, 0.8, '#ffffff');
      d.tube([[14, 34], [7, 31], [2, 26]], 6, 2.4, M); d.poly([[2, 26], [0, 20], [5, 24]], G);
      d.tube([[20, 42], [17, 50], [18, 58]], 6.4, 5.4, Md, { far: true }); d.deco.ell(17.6, 50, 3, 1.4, Gd, 0, { far: true });
      d.tube([[42, 42], [45, 50], [45, 57]], 6.4, 5.4, Md, { far: true });
      for (const x of [14, 42]) for (let i = 0; i < 3; i++) d.poly([[x + i * 3.4, 60], [x + i * 3.4 + 3, 62.6], [x + i * 3.4 + 1.6, 57.6]], CL, { far: true });
      d.blob([[11, 34], [20, 27], [36, 27], [46, 32], [48, 42], [38, 46], [20, 46], [10, 41]], M, { shiny: true });
      for (const x of [19, 26, 33, 40]) d.deco.line(x, 29, x - 1, 45, 1, Md);
      d.deco.blob([[20, 40], [38, 40], [42, 44.6], [22, 46]], Ml);
      d.rect(26, 22, 14, 7, G, { round: 0.3, shiny: true }); for (let i = 0; i < 3; i++) d.deco.circ(29 + i * 4, 25.4, 1.2, '#2a1a0a', { unlit: true });
      d.deco.ell(44, 34, 2.4, 2.4, V, 0, { unlit: true });
      for (const x of [16, 40]) {
        d.tube([[x, 42], [x + 1, 51], [x, 58]], 7.6, 6.2, M, { shiny: true });
        d.deco.ell(x + 0.6, 50, 3.6, 1.8, G);
        for (let i = 0; i < 3; i++) d.poly([[x - 4 + i * 3.6, 59.6], [x - 0.6 + i * 3.6, 63], [x - 2 + i * 3.6, 57]], CL, { shiny: true });
      }
      d.poly([[44, 26], [42, 14], [50, 22]], M, { shiny: true });
      d.blob([[42, 30], [46, 23], [54, 21], [61, 25], [64, 31], [61, 36], [52, 37], [45, 35]], M, { shiny: true });
      d.deco.poly([[47, 25], [58, 24], [60, 28], [48, 29]], '#1a1a3a');
      d.deco.ell(54.6, 26.6, 2.4, 1.2, V, 0, { unlit: true }); d.deco.circ(55, 26.4, 0.6, '#ffffff', { unlit: true });
      d.tube([[50, 22], [53, 15], [58, 11]], 2.2, 0.4, G, { shiny: true });
      for (let i = 0; i < 3; i++) d.poly([[50 + i * 3.6, 33.6], [51.2 + i * 3.6, 36], [52.4 + i * 3.6, 33.4]], '#ffffff');
      if (atk) {
        d.deco.poly([[48, 31], [63, 30], [62, 36.4], [51, 35.6]], '#1a1a3a', { unlit: true });
        d.deco.ell(59, 33.6, 5, 3, '#bfe8ff', 0, { unlit: true }); d.deco.ell(60.4, 33.6, 3, 1.8, '#ffffff', 0, { unlit: true });
        for (const [x, y] of [[57, 27], [60, 39], [55, 40]]) d.deco.poly([[x, y - 2], [x + 1.2, y], [x, y + 2], [x - 1.2, y]], '#e8f8ff', { unlit: true });
      } else d.deco.curve([[48, 32.6], [55, 33], [63, 31.4]], 1, '#1a1a3a', { unlit: true });
    },
  });
})();
