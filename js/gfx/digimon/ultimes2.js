'use strict';
// =====================================================================
//  DESSINS — Ultimes qui complètent l'arbre des Digivolutions
//  WereGarurumon (Garurumon), SkullMeramon (Meramon), Garudamon (Birdramon), Okuwamon (Kuwagamon)
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
// =====================================================================
(function () {
  const CLAW = '#f6f2e6';
  Object.assign(DW.DRAW, {
    // limace verte aux yeux pédonculés, grande langue rouge
    numemon(d) {
      const G = '#7ac04a', Gd = '#4e8a2e', Gl = '#b4e080';
      d.blob([[6, 61], [8, 50], [16, 40], [26, 34], [36, 34], [44, 40], [50, 50], [54, 61]], G, { shiny: true });
      d.deco.blob([[12, 56], [18, 46], [28, 40], [24, 50]], Gl);
      d.tube([[34, 36], [32, 22], [30, 12]], 3.4, 2.4, G); d.tube([[40, 37], [42, 24], [46, 14]], 3.4, 2.4, Gd, { far: true });
      d.eye(30, 10, 4, 4.6, '#2a2a2a', { look: 0.2 }); d.eye(46.4, 12, 3.6, 4.2, '#2a2a2a', { look: 0.2 });
      d.deco.ell(45, 46, 6, 4, '#3a0a10', 0, { unlit: true });
      d.tube([[46, 47], [54, 50], [58, 56]], 4, 2.6, '#e84a5a');
      d.ell(52, 60, 6, 2, Gd, 0, { far: true });
    },
    // tas jaunâtre, visage farceur, mouches autour
    sukamon(d) {
      const Y = '#c8b84a', Yd = '#9a8a30', Yl = '#e8dc80';
      d.ell(32, 54, 18, 8, Y, 0, { tex: 0.3 }); d.ell(32, 42, 13, 9, Y, 0, { tex: 0.3 }); d.ell(32, 30, 8, 6.4, Y, 0, { tex: 0.3 }); d.poly([[28, 26], [32, 14], [36, 26]], Y);
      d.deco.ell(26, 40, 5, 3, Yl, -0.3);
      d.tube([[18, 44], [10, 40]], 3.4, 2.4, Yd, { far: true }); d.tube([[46, 44], [54, 38]], 3.4, 2.4, Y);
      d.eye(28, 38, 3.4, 3.8, '#2a2a2a', { look: 0.3 }); d.eye(38, 38.4, 3, 3.6, '#2a2a2a', { look: 0.3 });
      d.deco.curve([[27, 46], [33, 48.6], [39, 46]], 1.2, '#5a2a1a', { unlit: true });
      d.poly([[26, 22], [30, 18], [32, 21], [34, 18], [38, 22], [37, 25], [27, 25]], '#e0c040', { shiny: true });
      for (const [x, y] of [[12, 22], [52, 18], [48, 28]]) { d.deco.circ(x, y, 1, '#1a1a1a', { unlit: true }); d.deco.ell(x - 1, y - 1.4, 1.2, 0.7, '#e0f0ff', 0.4); }
    },
    // ours en peluche géant
    monzaemon(d) {
      const B = '#e0b050', Bd = '#b08030', Bl = '#f4d890', R = '#e04a5a';
      d.ell(16, 18, 5, 5, B, 0, { far: true }); d.ell(44, 16, 5, 5, B);
      d.deco.ell(44, 16, 2.4, 2.4, Bl);
      d.ell(22, 58, 8, 4.6, Bd, 0, { far: true }); d.ell(40, 59, 8.6, 4.6, B);
      d.ell(30, 42, 18, 17, B, 0, { tex: 0.25 });
      d.deco.ell(32, 45, 10, 11, Bl);
      d.deco.poly([[32, 40], [36, 44], [32, 50], [28, 44]], R, { unlit: true });
      d.ell(32, 20, 13, 11, B, 0, { tex: 0.25 });
      d.deco.ell(35, 25, 6, 4, Bl);
      d.deco.line(26, 18, 30, 18.6, 1.4, '#3a2a1a', { unlit: true }); d.deco.line(36, 18, 40, 17.4, 1.4, '#3a2a1a', { unlit: true });
      d.deco.ell(37, 23.4, 2, 1.4, '#3a2a1a', 0, { unlit: true }); d.deco.curve([[33, 27], [37, 28.4], [41, 26.6]], 0.9, '#3a2a1a', { unlit: true });
      d.tube([[14, 36], [6, 46]], 7, 6, Bd, { far: true }); d.tube([[46, 34], [54, 42]], 7, 6, B);
      d.ell(55, 44, 4.4, 4, B); d.deco.poly([[53, 42], [56, 44], [55, 47], [52, 45]], R, { unlit: true });
      d.deco.line(13, 30, 13, 52, 0.8, '#8a6020');
    },
    // loup-garou bipède : fourrure bleue et blanche, jean déchiré, protège-poignets
    weregarurumon(d, p = {}) {
      const B = '#4a7ad8', Bd = '#2e56a8', Wt = '#eef2fa', J = '#3a4a7a', Jd = '#2a3458', R = '#d83a3a';
      // crinière blanche dans le dos
      d.poly([[30, 12], [20, 10], [14, 18], [18, 20], [12, 26], [20, 26], [18, 34], [26, 28], [30, 22]], Wt, { far: true, tex: 0.3 });
      // queue
      d.tube([[22, 40], [12, 44], [6, 40]], 5, 2, B, { far: true });
      // jambe éloignée (jean) et pied griffu
      d.tube([[30, 40], [33, 50], [34, 57]], 7, 6, Jd, { far: true });
      d.ell(37, 59.6, 6.4, 3, B, 0, { far: true });
      // bras éloigné
      d.tube([[27, 22], [22, 30], [22, 37]], 5.6, 4.6, Bd, { far: true });
      d.ell(22, 38.6, 3.6, 3.6, B, 0, { far: true });
      // torse musclé, ventre blanc, ceinture-bandoulière
      d.blob([[22, 18], [37, 16], [41, 26], [38, 40], [26, 41], [21, 30]], B);
      d.deco.blob([[29, 22], [37, 22], [37, 36], [30, 38], [27, 30]], Wt);
      d.deco.line(24, 20, 39, 37, 1.6, '#5a3a20');
      for (let i = 0; i < 3; i++) d.deco.rect(27 + i * 4, 23 + i * 4.4, 2, 2, '#c8b080');
      // jean
      d.blob([[24, 38], [38, 37], [39, 44], [24, 45]], J);
      d.tube([[29, 44], [27, 51], [26, 57]], 7.6, 6.4, J);
      d.deco.line(24, 50, 29, 51, 0.8, '#7a8ab8'); d.deco.line(25, 54, 28, 53, 0.6, Wt);
      d.ell(30, 59.6, 7, 3.2, B);
      for (let i = 0; i < 3; i++) d.poly([[33 + i * 2.4, 61.6], [34.2 + i * 2.4, 58.6], [35.4 + i * 2.4, 61.6]], CLAW);
      // tête de loup
      d.ell(37, 15, 4.6, 3.8, B, -0.3);
      d.ell(43, 11, 7, 6, B);
      d.ell(51, 13.4, 6, 3.2, B, 0.1, { noline: true });
      d.deco.ell(51, 15.4, 4.6, 1.4, Wt, 0.1);
      d.poly([[38, 7], [36, 0.6], [42, 5]], B); d.deco.poly([[38.6, 6], [37.4, 2.6], [40.6, 5]], '#f0a0b0');
      d.deco.ell(46, 9.4, 1.8, 1.3, '#f0d020', 0, { unlit: true }); d.deco.ell(46.4, 9.4, 0.7, 1, '#1a1a1a', 0, { unlit: true });
      d.deco.curve([[44.6, 7.6], [48, 8.2]], 0.8, Bd, { unlit: true });
      d.deco.ell(56.4, 12, 1.2, 1, '#1a1a2a', 0, { unlit: true });
      d.deco.curve([[45, 15.6], [51, 16], [56, 14.6]], 0.8, '#3a1a1a', { unlit: true });
      d.deco.poly([[50, 15.4], [51, 17.4], [52, 15.2]], CLAW, { unlit: true });
      // bras proche, poing en avant, protège-poignet rouge
      d.tube([[35, 20], [42, 26], [47, 30]], 6.4, 5.6, B);
      d.rect(44.6, 27.6, 5.6, 5.6, R, { round: 0.4 });
      d.ell(51.6, 32, 4.4, 4, B);
      for (let i = 0; i < 3; i++) d.tube([[54, 30 + i * 2], [57, 29.6 + i * 2.4]], 1.4, 0.4, CLAW);
    },
    // flamme bleue enchaînée, masque de métal
    skullmeramon(d) {
      const F = '#4a6af0', Fd = '#2a3ab0', Fl = '#a8c8ff', M = '#9aa2b4', Ch = '#7a808e';
      // corps de flammes bleues (silhouette en langues de feu)
      d.poly([[18, 60], [14, 46], [16, 34], [12, 26], [18, 22], [16, 12], [24, 16], [26, 6], [32, 12], [36, 4], [40, 12], [46, 8], [46, 18], [52, 22], [48, 30], [50, 44], [46, 60]], F, { tex: 0.2 });
      d.deco.poly([[24, 58], [21, 44], [24, 30], [30, 22], [38, 24], [42, 36], [40, 58]], Fl);
      d.deco.poly([[28, 56], [27, 42], [31, 32], [35, 34], [36, 48], [34, 56]], '#ffffff');
      // jambes
      d.tube([[26, 50], [24, 61]], 6, 5, Fd, { far: true }); d.tube([[36, 50], [38, 61]], 6.4, 5.4, F);
      // chaînes enroulées
      for (let i = 0; i < 3; i++) { const y = 30 + i * 8; d.curve([[16, y + 2], [32, y - 2], [50, y + 3]], 2, Ch, { shiny: true }); for (let k = 0; k < 6; k++) d.deco.circ(18 + k * 6, y + (k % 2 ? -1 : 1), 1, '#c8ccd6'); }
      d.tube([[46, 34], [58, 40], [62, 48]], 2, 2, Ch, { shiny: true }); d.ell(62, 50, 3, 3, M, 0, { shiny: true });
      // tête : masque de métal en forme de crâne
      d.ell(36, 15, 8, 7.4, M, 0, { shiny: true });
      d.deco.ell(33.4, 14, 2.2, 2.6, '#1a1a2a', 0, { unlit: true }); d.deco.ell(40, 14, 2.2, 2.6, '#1a1a2a', 0, { unlit: true });
      d.deco.ell(33.6, 14.4, 0.9, 0.9, '#ff3a3a', 0, { unlit: true }); d.deco.ell(40.2, 14.4, 0.9, 0.9, '#ff3a3a', 0, { unlit: true });
      for (let i = 0; i < 5; i++) d.deco.rect(31 + i * 2.2, 19, 1.4, 2.2, '#f0f0f0');
      d.deco.line(36.6, 8, 36.6, 12, 0.6, '#5a6070');
    },
    // oiseau-guerrier rouge aux grandes ailes
    garudamon(d) {
      const R = '#e04a2a', Rd = '#a8301a', O = '#f8a030', Wt = '#fbf4e4', G = '#e0c040';
      // grandes ailes déployées (derrière)
      d.poly([[26, 22], [6, 4], [2, 14], [8, 18], [0, 26], [10, 28], [4, 38], [18, 34], [24, 32]], R, { far: true, tex: 0.25 });
      for (let i = 0; i < 4; i++) d.deco.line(24, 26, 4 + i * 2, 8 + i * 8, 0.8, Rd);
      d.poly([[40, 20], [58, 2], [62, 12], [56, 16], [64, 22], [54, 26], [60, 34], [46, 30]], Rd, { far: true, tex: 0.25 });
      // jambes d'oiseau, serres
      d.tube([[30, 44], [29, 52], [31, 58]], 5, 3, O, { far: true }); d.tube([[36, 44], [38, 52], [37, 58]], 5, 3, O);
      for (const x of [29, 36]) for (let i = 0; i < 3; i++) d.tube([[x + 1, 59], [x - 2 + i * 3, 62]], 1.4, 0.6, '#2a1a10');
      // corps musclé, plumes du ventre, ceinture
      d.blob([[24, 20], [40, 18], [44, 30], [40, 44], [28, 45], [22, 32]], R);
      d.deco.blob([[29, 24], [39, 24], [40, 38], [31, 40], [28, 32]], O);
      d.rect(26, 40, 16, 4, G, { round: 0.4 }); d.deco.rect(32, 40.4, 4, 3.2, '#3a8ad8');
      // bras, bracelets dorés
      d.tube([[40, 22], [46, 30], [50, 36]], 5.4, 4.6, R); d.rect(46.6, 31, 4.6, 4, G, { round: 0.3 });
      d.ell(51.6, 38, 3.4, 3.4, Wt);
      d.tube([[24, 24], [20, 32], [21, 38]], 5, 4.4, Rd, { far: true });
      // tête : crinière blanche, bec jaune, masque
      d.poly([[30, 16], [24, 8], [28, 10], [26, 2], [32, 8], [34, 0], [36, 9], [32, 18]], Wt, { tex: 0.3 });
      d.ell(38, 12, 7, 6, R);
      d.poly([[43, 10], [54, 13], [43, 16]], G, { shiny: true });
      d.deco.line(44, 13, 52, 13.2, 0.5, '#a88a20');
      d.deco.ell(40, 10, 1.8, 1.4, '#ffffff', 0, { unlit: true }); d.deco.ell(40.6, 10, 0.8, 0.9, '#1a1a1a', 0, { unlit: true });
      d.deco.curve([[36, 8.4], [42, 8]], 1, '#2a1a10', { unlit: true });
    },
    // scarabée géant noir aux quatre mandibules
    okuwamon(d) {
      const K = '#2a2430', Kd = '#18141c', Kl = '#4a4258', R = '#e03a2a', S = '#c8ccd6';
      // pattes (côté éloigné)
      for (let i = 0; i < 3; i++) d.tube([[22 + i * 9, 46], [18 + i * 10, 54], [16 + i * 10, 61]], 2.6, 1.6, Kd, { far: true });
      // carapace (élytres) + reflets
      d.ell(26, 40, 21, 13, K, -0.1, { shiny: true });
      d.deco.line(10, 36, 44, 44, 1, Kd);
      d.deco.ell(20, 33, 9, 3.4, Kl, -0.2);
      // pattes proches
      for (let i = 0; i < 3; i++) d.tube([[24 + i * 9, 48], [22 + i * 10, 56], [24 + i * 10, 62]], 3, 2, K);
      // tête et thorax
      d.ell(46, 36, 9, 8, K, 0, { shiny: true });
      d.deco.ell(50, 33, 2.6, 2, R, 0, { unlit: true }); d.deco.ell(50.6, 32.6, 1, 0.8, '#ffd0c0', 0, { unlit: true });
      // deux paires de mandibules argentées
      const jaw = (y0, a, l) => d.tube([[52, y0], [52 + Math.cos(a) * l * 0.6, y0 + Math.sin(a) * l * 0.6 - 3], [52 + Math.cos(a + 0.5) * l, y0 + Math.sin(a + 0.5) * l]], 3.6, 0.6, S, { shiny: true });
      jaw(30, -0.9, 16); jaw(34, -0.3, 15); jaw(40, 0.3, 14); jaw(43, 0.8, 13);
      for (const [x, y] of [[58, 18], [63, 26], [62, 44], [58, 52]]) d.deco.circ(x, y, 0.9, '#8a909e');
    },
  });
})();
