'use strict';
// =====================================================================
//  VUES DE FACE ET DE DOS des partenaires (lignées des sept DigiSélectionnés : Bébé, Entraînement, Disciple)
//  Sur la carte, le partenaire est vu de DOS quand il monte avec le héros, de FACE quand il descend
//  (gfx/sprites.js : param.view = 'front' | 'back'). Mêmes couleurs que les profils ; dessins symétriques
//  autour de x = 32, sol à y ≈ 62. De face : les deux yeux regardent vers nous ; de dos : pas de visage.
// =====================================================================
(function () {
  const D = DW.DRAW;
  const mir = pts => pts.map(([x, y]) => [64 - x, y]);
  // contour symétrique : demi-contour gauche (du haut au bas, sur l'axe), complété par son miroir
  const sym = L => [...L, ...mir(L).reverse().filter(([x]) => Math.abs(x - 32) > 0.01)];
  const eyes = (d, y, dx, rx, ry, iris, o = {}) => { d.eye(32 - dx, y, rx, ry, iris, { ...o, look: 0.06 }); d.eye(32 + dx, y, rx, ry, iris, { ...o, look: -0.06 }); };
  const pair = (d, y, dx, rx, ry, col, rot = 0) => { d.deco.ell(32 - dx, y, rx, ry, col, rot); d.deco.ell(32 + dx, y, rx, ry, col, -rot); };
  const smile = (d, y, w, col, h = 1.4, lw = 0.9) => d.deco.curve([[32 - w, y], [32, y + h], [32 + w, y]], lw, col, { unlit: true });
  const CLAW = '#f6f2e6';
  // trois griffes blanches au bout d'un pied (vues de face)
  const toes = (d, x, y, s = 1) => { for (let i = -1; i <= 1; i++) d.poly([[x + i * 2.8 * s - 1, y - 1.6], [x + i * 2.8 * s, y + 1.2], [x + i * 2.8 * s + 1, y - 1.6]], CLAW, { shiny: true }); };

  const V = {
    // ================================================================ BÉBÉS
    botamon: {
      front(d) {
        const K = '#1e1c26', K2 = '#3a3848', Ks = '#8a8aa0';
        d.poly([[18, 41], [19, 25], [29, 34]], K); d.poly(mir([[18, 41], [19, 25], [29, 34]]), K);
        d.deco.poly([[20.6, 34.6], [21, 29], [25.6, 33.6]], K2); d.deco.poly(mir([[20.6, 34.6], [21, 29], [25.6, 33.6]]), K2);
        d.ell(32, 47.6, 18.6, 14.6, K, 0, { shiny: true }); d.ell(32, 59.4, 16, 3, K, 0, { noline: true });
        d.deco.ell(24, 39, 6.4, 3.2, K2, -0.35); d.deco.ell(23, 38, 2.6, 1.2, Ks, -0.35);
        for (let i = 0; i < 3; i++) { d.deco.line(14, 47 + i * 2.4, 19, 46.6 + i * 2, 0.5, K2); d.deco.line(50, 47 + i * 2.4, 45, 46.6 + i * 2, 0.5, K2); }
        pair(d, 47.6, 6.4, 3.7, 4.4, '#f8c020', 0.15);
        pair(d, 46.2, 7.2, 1.1, 1.1, '#fff4b0');
      },
      back(d) {
        const K = '#1e1c26', K2 = '#3a3848', Ks = '#8a8aa0';
        d.poly([[18, 41], [19, 25], [29, 34]], K); d.poly(mir([[18, 41], [19, 25], [29, 34]]), K);
        d.ell(32, 47.6, 18.6, 14.6, K, 0, { shiny: true }); d.ell(32, 59.4, 16, 3, K, 0, { noline: true });
        d.deco.ell(25, 40, 9, 4.4, K2, -0.3); d.deco.ell(23.6, 38.6, 3.4, 1.4, Ks, -0.3);
        for (let i = 0; i < 3; i++) d.deco.line(29 + i * 3, 37, 29.4 + i * 3, 41, 0.5, K2);
      },
    },
    punimon: {
      front(d) {
        const R = '#ee5a6a', Rd = '#c83a50', Rl = '#ffb0b8', Y = '#f8d040';
        d.poly([[21, 34], [17, 21], [28, 30]], Y, { shiny: true }); d.poly(mir([[21, 34], [17, 21], [28, 30]]), Y, { shiny: true });
        d.poly([[28.6, 30], [32, 14], [35.4, 30]], Y, { shiny: true });
        d.ell(32, 47, 19, 15.4, R, 0, { shiny: true }); d.ell(32, 60, 17, 3, R, 0, { noline: true });
        d.deco.ell(24, 38.6, 5.6, 3, Rl, -0.4); d.deco.ell(22.6, 37.2, 2, 1, '#ffffff', -0.4, { unlit: true });
        d.deco.curve([[15, 50], [17, 56], [22, 59.4]], 0.9, Rd); d.deco.curve([[49, 50], [47, 56], [42, 59.4]], 0.9, Rd);
        eyes(d, 46.4, 6.2, 4, 5.2, '#2a2a3a', { white: '#fff6c0' });
        smile(d, 54.4, 3.2, '#7a1020', 1.8, 1);
        pair(d, 52.8, 12.6, 2.2, 1.2, '#ff8a9a');
      },
      back(d) {
        const R = '#ee5a6a', Rd = '#c83a50', Rl = '#ffb0b8', Y = '#f8d040';
        d.poly([[21, 34], [17, 21], [28, 30]], Y, { shiny: true }); d.poly(mir([[21, 34], [17, 21], [28, 30]]), Y, { shiny: true });
        d.poly([[28.6, 30], [32, 14], [35.4, 30]], Y, { shiny: true });
        d.ell(32, 47, 19, 15.4, R, 0, { shiny: true }); d.ell(32, 60, 17, 3, R, 0, { noline: true });
        d.deco.ell(25, 40, 8, 4, Rl, -0.35); d.deco.ell(23, 38.4, 2.4, 1.1, '#ffffff', -0.35, { unlit: true });
        d.deco.curve([[22, 52], [32, 56], [42, 52]], 0.8, Rd);
      },
    },
    pichimon: {
      front(d) {
        const B = '#d6e6f4', Bd = '#9ab6d4', F = '#a8c8ec';
        d.poly([[28, 36], [32, 24], [36, 36]], F, { shiny: true });
        d.ell(32, 48, 19, 14, B, 0, { shiny: true });
        d.ell(12.6, 51, 5, 2.8, F, 0.6); d.ell(51.4, 51, 5, 2.8, F, -0.6);
        d.deco.ell(32, 55.4, 10, 3.6, '#eef4fa'); d.deco.ell(24.6, 41, 6, 3.2, '#ffffff', -0.3);
        eyes(d, 46, 6.6, 4.2, 5.4, '#1a2a4a');
        d.deco.ell(32, 53.4, 2, 1.4, '#4a2a3a', 0, { unlit: true });
        pair(d, 51.4, 12.6, 2, 1.1, '#ffb8c8');
        d.deco.circ(51, 37, 1.6, '#ffffff', { unlit: true }); d.deco.circ(54, 32, 1.1, '#ffffff', { unlit: true });
      },
      back(d) {
        const B = '#d6e6f4', Bd = '#9ab6d4', F = '#a8c8ec';
        d.poly([[28, 36], [32, 24], [36, 36]], F, { shiny: true });
        d.ell(32, 48, 19, 14, B, 0, { shiny: true });
        d.ell(12.6, 51, 5, 2.8, F, 0.6); d.ell(51.4, 51, 5, 2.8, F, -0.6);
        d.deco.ell(25, 41, 7, 3.6, '#ffffff', -0.3);
        // nageoire de queue, tournée vers nous
        d.poly([[32, 47], [21, 39], [24.6, 49], [20.6, 58.6], [32, 53], [43.4, 58.6], [39.4, 49], [43, 39]], F, { shiny: true });
        d.deco.line(24, 43, 31, 49, 0.6, Bd); d.deco.line(40, 43, 33, 49, 0.6, Bd); d.deco.line(24, 56, 31, 51.6, 0.6, Bd); d.deco.line(40, 56, 33, 51.6, 0.6, Bd);
      },
    },
    yuramon: {
      front(d) { V.yuramon.body(d); eyes(d, 48.4, 5.6, 3.3, 4.4, '#2a2a2a'); smile(d, 55.4, 1.8, '#a05a4a', 1.2, 0.8); pair(d, 54, 12, 2, 1.1, '#ffc8c0'); },
      back(d) { V.yuramon.body(d); for (let i = 0; i < 6; i++) { const a = Math.PI * 0.3 + i * 0.4; d.deco.line(32 + Math.cos(a) * 4, 50 + Math.sin(a) * 3, 32 + Math.cos(a) * 15, 50 + Math.sin(a) * 9, 0.6, '#d8d4c8'); } },
      body(d) {
        const Wt = '#fbf8f0', Wd = '#d8d4c8', St = '#7aa040', Sl = '#c8e070';
        const fl = [];
        for (let i = 0; i <= 40; i++) { const a = Math.PI * 0.9 + (i / 40) * Math.PI * 1.2, r = i % 2 ? 20 : 16.4; fl.push([32 + Math.cos(a) * r * 1.05, 47 + Math.sin(a) * r]); }
        fl.push([53, 61], [11, 61]);
        d.poly(fl, Wt, { tex: 0.25 });
        d.ell(32, 50, 17.6, 12, Wt, 0, { tex: 0.2 });
        for (let i = 0; i < 7; i++) { const a = Math.PI * 1.1 + i * 0.2; d.deco.line(32 + Math.cos(a) * 9, 46 + Math.sin(a) * 8, 32 + Math.cos(a) * 17, 46 + Math.sin(a) * 15, 0.6, Wd); }
        d.tube([[32, 29], [32, 23], [33, 19]], 1.8, 1.2, St); d.ell(32, 18, 3.6, 1.8, Sl, 0);
      },
    },
    nyokimon: {
      front(d) { V.nyokimon.body(d); eyes(d, 44.6, 5, 3.3, 4.4, '#2a2a2a'); smile(d, 51.4, 2, '#5a2a1a', 1.2, 0.8); pair(d, 49.6, 10.4, 1.8, 1, '#ff9ab8'); },
      back(d) { V.nyokimon.body(d); d.deco.curve([[22, 46], [32, 50], [42, 46]], 0.7, '#6aa040'); },
      body(d) {
        const G = '#a8d86a', Gd = '#6aa040', Gl = '#e0f8b0', P = '#f490b8', Pd = '#d0608a';
        d.ell(26, 22, 5, 10, P, -0.45, { far: true }); d.ell(38, 22, 5, 10, P, 0.45, { far: true });
        d.ell(32, 18, 5.4, 12, P, 0, { shiny: true }); d.deco.curve([[32, 8], [32, 26]], 0.7, Pd);
        d.ell(32, 30, 8, 3.6, Gd);
        d.blob(sym([[32, 29], [22, 32], [18, 44], [21, 56], [32, 60]]), G);
        d.deco.ell(25.6, 38, 4.8, 2.8, Gl, -0.4);
        d.ell(25, 60.2, 4.2, 2.5, Gd); d.ell(39, 60.2, 4.2, 2.5, Gd);
      },
    },
    pabumon: {
      front(d) {
        const Y = '#f0cc40';
        V.pabumon.body(d);
        eyes(d, 42, 4.6, 2.4, 3.1, '#1a1a22');
        d.circ(32, 50, 3.6, Y, { shiny: true }); d.deco.circ(32, 50, 1.6, '#c89820'); d.ell(32, 54, 2.6, 1.3, Y);
      },
      back(d) { V.pabumon.body(d); d.deco.curve([[24, 44], [32, 47], [40, 44]], 0.7, '#a8cc84'); },
      body(d) {
        const G = '#d4ecb0', Gd = '#a8cc84', Gl = '#f2fbe4';
        d.blob(sym([[32, 27], [22, 30], [16, 40], [15, 52], [10, 61], [20, 59], [26, 62], [32, 60]]), G, { shiny: true });
        d.deco.ell(25, 36, 5.6, 3.2, Gl, -0.4); d.deco.ell(23.6, 34.8, 1.8, 1, '#ffffff', -0.4, { unlit: true });
        d.deco.curve([[15, 54], [19, 58]], 0.8, Gd); d.deco.curve([[49, 54], [45, 58]], 0.8, Gd);
        for (const [x, y, r] of [[52, 34], [56, 28], [49, 25], [12, 32], [9, 38]].map(([x, y], i) => [x, y, [2.6, 1.8, 1.4, 2, 1.4][i]])) { d.circ(x, y, r, '#e8f6dc', { shiny: true }); d.deco.circ(x - r * 0.35, y - r * 0.35, r * 0.3, '#ffffff', { unlit: true }); }
      },
    },
    poyomon: {
      front(d) {
        V.poyomon.body(d);
        eyes(d, 34, 4.8, 2.2, 3, '#1a1a22', { white: '#22222a' });
        d.deco.blob([[28.6, 40], [35.4, 40], [34, 43.4], [30, 43.4]], '#e86a4a', { unlit: true });
        pair(d, 39, 10.4, 1.6, 0.9, '#ffd0d8');
      },
      back(d) { V.poyomon.body(d); },
      body(d) {
        const W = '#f6f8ff', B = '#c4d6f4', Bd = '#90aee0';
        d.blob(sym([[32, 18], [22, 22], [15, 34], [14, 50], [18, 56], [22, 52], [26, 57], [30, 52], [32, 54]]), W, { shiny: true });
        d.deco.blob(sym([[32, 50], [24, 48], [17, 46], [16, 50], [18, 54], [22, 51], [26, 55], [30, 51], [32, 52]]), B);
        d.deco.curve([[20, 53], [24, 49]], 0.6, Bd); d.deco.curve([[44, 53], [40, 49]], 0.6, Bd);
        d.deco.ell(24, 28, 5.6, 3.4, '#ffffff', -0.5, { unlit: true });
      },
    },
    // ================================================================ ENTRAÎNEMENT
    koromon: {
      front(d) {
        const R = '#d81a36';
        V.koromon.body(d, true);
        eyes(d, 38.6, 7.6, 5, 6.2, R);
        d.deco.curve([[19, 48.6], [25, 52.6], [32, 53.6], [39, 52.6], [45, 48.6]], 1.4, '#6a0a28', { unlit: true });
        d.deco.poly([[24.6, 51.4], [26, 55], [27.4, 51.8]], '#ffffff', { unlit: true }); d.deco.poly([[36.6, 51.8], [38, 55], [39.4, 51.4]], '#ffffff', { unlit: true });
        pair(d, 48, 15.2, 2.6, 1.4, '#ff8ab4');
      },
      back(d) { V.koromon.body(d, false); d.deco.curve([[20, 52], [32, 57], [44, 52]], 0.9, '#d8809e'); },
      body(d, front) {
        const P = '#f6a8c8', Pd = '#d8809e', Pi = '#ffd8e8';
        const earL = [[27, 31], [21, 25], [14, 24], [8, 27], [3, 24]];
        d.blob(sym([[32, 26], [22, 28], [14, 37], [12, 50], [16, 58], [24, 61], [32, 62]]), P);
        d.deco.ell(24.4, 35, 7.4, 4.2, Pi, -0.35); d.deco.ell(23, 33, 2.8, 1.4, '#ffffff', -0.35, { unlit: true });
        // oreilles-rubans : elles flottent de chaque côté
        for (const pts of [earL, mir(earL)]) { d.tube(pts, 8, 2.6, P); d.deco.tube(pts.slice(0, 4).map(([x, y]) => [x, y + 1.2]), 3, 1.2, front ? Pi : Pd); }
      },
    },
    tsunomon: {
      front(d) {
        V.tsunomon.body(d);
        eyes(d, 42.6, 7.4, 4.6, 5.8, '#d02828');
        d.deco.ell(32, 53, 6, 3, '#5a1018', 0, { unlit: true }); d.deco.ell(32, 54.4, 3.6, 1.2, '#e8607a');
        d.deco.poly([[28.4, 51.6], [29.6, 54], [30.8, 51.6]], '#ffffff', { unlit: true }); d.deco.poly([[33.2, 51.6], [34.4, 54], [35.6, 51.6]], '#ffffff', { unlit: true });
      },
      back(d) { V.tsunomon.body(d); for (const x of [24, 32, 40]) d.deco.line(x, 40, x + (x - 32) * 0.15, 52, 0.7, '#c87428'); },
      body(d) {
        const O = '#f0a040', Od = '#c87428', L = '#ffd27a', H = '#8a90e8';
        d.ell(22, 59.6, 4, 2.2, Od); d.ell(42, 59.6, 4, 2.2, Od);
        d.ell(32, 45, 19.5, 16.5, O, 0, { tex: 0.25 });
        d.blob(sym([[32, 36], [13, 40], [12, 31], [17, 33], [18, 24], [23, 29], [27, 21], [31, 27], [32, 23]]), O, { tex: 0.3 });
        d.deco.line(20, 30, 22, 36, 0.7, Od); d.deco.line(44, 30, 42, 36, 0.7, Od); d.deco.line(27, 25, 28, 32, 0.7, Od); d.deco.line(37, 25, 36, 32, 0.7, Od);
        d.deco.ell(32, 53, 9, 4.6, L);
        d.tube([[32, 28], [32, 16], [32, 5]], 7, 1.2, H, { shiny: true });
        d.deco.line(29.4, 23, 34.6, 23, 0.8, '#5a5ab0'); d.deco.line(30, 16, 34, 16, 0.8, '#5a5ab0');
      },
    },
    yokomon: {
      front(d) { V.yokomon.body(d); eyes(d, 46, 6.2, 3.6, 4.4, '#2a9a4a'); smile(d, 53.4, 2, '#a04060', 1.4, 0.8); },
      back(d) { V.yokomon.body(d); d.deco.curve([[22, 50], [32, 54], [42, 50]], 0.6, '#f0b8c8'); },
      body(d) {
        const P = '#fad8e0', Bl = '#3a66e0', Bd = '#2440a8', Y = '#ffd84a', G = '#3e9a3e';
        d.tube([[26, 56], [24, 61]], 2.4, 1.6, '#e8b0c0'); d.tube([[38, 56], [40, 61]], 2.4, 1.6, '#e8b0c0');
        d.ell(32, 46, 15, 13.5, P);
        d.poly([[25, 36], [32, 29], [39, 36]], P, { noline: true });
        d.deco.line(26, 42, 28, 54, 0.6, '#f0b8c8'); d.deco.line(38, 42, 36, 54, 0.6, '#f0b8c8');
        d.tube([[32, 31], [32, 22]], 2.6, 2.2, G);
        d.ell(26, 12, 7, 4, Bl, -0.9, { far: true }); d.ell(38, 12, 7, 4, Bl, 0.9, { far: true });
        d.ell(19, 19, 10, 4.4, Bl, -0.25); d.ell(45, 19, 10, 4.4, Bl, 0.25); d.ell(32, 21, 9, 4.6, Bl);
        d.deco.ell(19, 19, 6, 2, Bd, -0.25); d.deco.ell(45, 19, 6, 2, Bd, 0.25);
        d.curve([[30, 18], [28, 9]], 0.9, Y); d.curve([[32, 18], [32, 7]], 0.9, Y); d.curve([[34, 18], [36, 9]], 0.9, Y);
        d.circ(28, 8.6, 1.3, Y); d.circ(36, 8.6, 1.3, Y);
        d.curve([[32, 7], [33.6, 3], [31, 1.4], [29.8, 3.6]], 1.6, '#f07a2a');
      },
    },
    tanemon: {
      front(d) { V.tanemon.body(d, false); eyes(d, 44.4, 6, 4.3, 5, '#8a2a1a'); smile(d, 51.6, 1.8, '#7a3020', 1.4, 0.8); pair(d, 50.2, 12.4, 2.4, 1.4, '#ffb0b0'); },
      back(d) { V.tanemon.body(d, true); },
      body(d, back) {
        const B = '#f4f6e2', G = '#5aa040', Gd = '#2e7a2a';
        d.curve([[30, 26], [26, 14], [18, 9], [12, 13]], 3.6, Gd); d.curve([[34, 26], [38, 14], [46, 9], [52, 13]], 3.6, Gd); d.curve([[32, 26], [32, 12], [32, 6]], 3, G);
        d.deco.line(20, 10, 15, 12, 0.6, '#6aba50'); d.deco.line(44, 10, 49, 12, 0.6, '#6aba50');
        d.ell(24, 58.5, 4.6, 3, '#d8dcc0'); d.ell(40, 58.5, 4.6, 3, '#d8dcc0');
        d.ell(32, 42, 20, 17.5, B);
        // la feuille verte du crâne (de dos : elle descend jusque dans le dos)
        d.deco.blob(back ? sym([[32, 24], [24, 25], [16, 30], [13, 40], [14, 48], [20, 52], [26, 54], [32, 54]]) : sym([[32, 24], [24, 25], [16, 30], [13, 40], [20, 34], [26, 37], [32, 33]]), G);
        d.deco.line(24, 28, 22, 33, 0.7, Gd); d.deco.line(40, 28, 42, 33, 0.7, Gd);
        if (back) d.deco.line(32, 27, 32, 50, 0.7, Gd);
      },
    },
    motimon: {
      front(d) {
        const K = '#1a1a22';
        V.motimon.body(d);
        eyes(d, 30, 5, 3.2, 3.8, K, { white: '#2a2a32' });
        d.deco.blob([[28, 37], [36, 37], [34.4, 44], [29.6, 44]], '#c83a4a', { unlit: true }); d.deco.ell(32, 42.4, 2, 1.2, '#f07080', 0, { unlit: true });
        pair(d, 36, 11.4, 2, 1.1, '#f4a0b0');
      },
      back(d) { V.motimon.body(d); d.deco.curve([[23, 46], [32, 50], [41, 46]], 0.7, '#dca8b4'); },
      body(d) {
        const P = '#f6d6dc', Pd = '#dca8b4', Pl = '#fff2f4';
        d.blob(sym([[32, 18], [25, 20], [18, 30], [16, 46], [17, 60], [22, 57], [27, 61], [32, 57]]), P, { shiny: true });
        d.deco.ell(25.6, 27, 5.6, 3.6, Pl, -0.4); d.deco.ell(24.4, 25.6, 1.8, 1.1, '#ffffff', -0.4, { unlit: true });
        const arm = [[19, 40], [12, 36], [9, 30]];
        for (const a of [arm, mir(arm)]) { d.tube(a, 3.4, 2.6, Pd); const [hx, hy] = a[2]; for (let i = -1; i <= 1; i++) d.tube([[hx, hy], [hx + i * 2, hy - 3]], 0.9, 0.4, '#3a3a44'); }
      },
    },
    bukamon: {
      front(d) {
        const T = '#a89e94', Tl = '#f0e4cc';
        V.bukamon.body(d);
        d.ell(32, 27.4, 8.4, 6.4, T, 0, { noline: true });
        d.deco.ell(32, 29.6, 6.4, 3.4, '#6a1a2a', 0, { unlit: true }); d.deco.ell(32, 31, 3.6, 1.4, '#e86a8a');
        d.deco.poly([[27.6, 27.6], [28.6, 29.8], [29.6, 27.6]], '#ffffff', { unlit: true }); d.deco.poly([[34.4, 27.6], [35.4, 29.8], [36.4, 27.6]], '#ffffff', { unlit: true });
        eyes(d, 18.6, 6.4, 4, 5, '#3a72e0');
        d.deco.ell(32, 45, 6.6, 8.6, Tl);
      },
      back(d) {
        const T = '#a89e94';
        // queue de phoque recourbée vers nous, nageoire en deux lobes
        d.tube([[32, 50], [32, 58], [30, 61]], 9, 4, T);
        d.ell(26.6, 60, 5, 2.6, T, 0.3); d.ell(35, 60.6, 4.4, 2.4, T, -0.3);
        V.bukamon.body(d);
        d.deco.curve([[22, 36], [32, 39], [42, 36]], 0.7, '#7a7068');
      },
      body(d) {
        const T = '#a89e94', O = '#f2722a', Y = '#ffc848';
        d.ell(32, 46, 12.5, 12, T);
        d.tube([[32, 41], [32, 30]], 13, 11, T, { noline: true });
        d.ell(32, 21, 13, 11, T);
        d.poly([[25.6, 13], [24.6, 5], [29, 8], [32, 0.5], [35, 8], [39.4, 5], [38.4, 13]], O, { shiny: true });
        d.deco.poly([[27.6, 11.6], [28, 6.4], [30.6, 9.4], [32, 5.6], [33.4, 9.4], [36, 6.4], [36.4, 11.6]], Y, { unlit: true });
        d.ell(19.6, 44, 5.2, 2.6, T, -0.7); d.ell(44.4, 44, 5.2, 2.6, T, 0.7);
      },
    },
    tokomon: {
      front(d) {
        const K = '#1a1a22', Pd = '#e08aa4';
        V.tokomon.body(d);
        d.deco.ell(32, 52, 10, 5, '#fde8ee');
        eyes(d, 42, 4.6, 2.1, 2.7, K, { white: '#22222a' });
        smile(d, 47.6, 2.4, '#6a3a4a', 1.6, 0.9);
        pair(d, 46.6, 11, 1.8, 1, Pd);
      },
      back(d) { V.tokomon.body(d); d.ell(32, 55, 2.6, 2.2, '#fbf8f6'); },
      body(d) {
        const W = '#fbf8f6', Wd = '#ddd4d0', Pk = '#f4b0c4';
        d.ell(22, 58, 4, 3, Wd, 0, { far: true }); d.ell(42, 58, 4, 3, Wd, 0, { far: true });
        d.ell(32, 46, 19, 14, W, 0, { shiny: true });
        d.ell(25, 59.4, 4.2, 3, W); d.ell(39, 59.4, 4.2, 3, W);
        d.deco.ell(25, 60.6, 2.6, 1, Pk); d.deco.ell(39, 60.6, 2.6, 1, Pk);
        const ear = [[25, 34], [19, 22], [13, 16], [9, 19]];
        for (const e of [ear, mir(ear)]) { d.tube(e, 6, 4.4, W); const [x, y] = e[3]; d.ell(x, y + 1, 3.8, 4.4, Pk, x < 32 ? -0.4 : 0.4); }
        d.deco.ell(23, 38, 5.6, 3.2, '#ffffff', -0.4, { unlit: true });
      },
    },
    // ================================================================ DISCIPLES
    agumon: {
      front(d, p = {}) {
        const Yd = '#d88a1c', L = '#fcd468', B = '#7a3a12';
        V.agumon.body(d, true);
        d.deco.blob(sym([[32, 35], [27, 37], [26, 48], [32, 53]]), L);
        d.deco.curve([[27, 42], [37, 42]], 0.6, Yd); d.deco.curve([[27, 46], [37, 46]], 0.6, Yd);
        // museau vu de face, narines, œil vert de chaque côté du crâne
        d.deco.ell(32, 23.6, 9.4, 5.6, L);
        d.deco.ell(29.6, 20.4, 1, 0.7, B, 0, { unlit: true }); d.deco.ell(34.4, 20.4, 1, 0.7, B, 0, { unlit: true });
        eyes(d, 14.2, 7.4, 3.8, 4.6, '#2aa040');
        d.deco.curve([[20.6, 9.2], [26.4, 9.8]], 1.1, '#b8641a', { unlit: true }); d.deco.curve([[43.4, 9.2], [37.6, 9.8]], 1.1, '#b8641a', { unlit: true });
        if (p.pose === 'attack') d.deco.ell(32, 27.6, 7.4, 3.4, '#7a1010', 0, { unlit: true });
        d.deco.curve([[21, 25.4], [32, 29.4], [43, 25.4]], 1.5, '#5a2000', { unlit: true });
        for (const x of [25.4, 29.4, 34.6, 38.6]) d.deco.poly([[x - 1.2, 26.8 + Math.abs(x - 32) * -0.12 + 0.6], [x, 29.4], [x + 1.2, 26.8 + Math.abs(x - 32) * -0.12 + 0.6]], CLAW, { unlit: true });
      },
      back(d) {
        const Y = '#f8b228', Yd = '#d88a1c';
        V.agumon.body(d, false);
        d.deco.curve([[32, 10], [32, 26]], 1, Yd);
        // la queue épaisse descend vers nous
        d.tube([[32, 44], [32, 52], [33, 58], [34, 62]], 12, 3.4, Y);
        d.deco.curve([[30, 50], [31, 58]], 0.8, Yd);
      },
      body(d, front) {
        const Y = '#f8b228', Yd = '#d88a1c';
        for (const s of [-1, 1]) {
          d.ell(32 + s * 9, 52, 7.4, 9, Y);
          d.ell(32 + s * 10.4, 60, 8, 3.4, Y);
          if (front) toes(d, 32 + s * 10.4, 61.6);
        }
        d.blob(sym([[32, 29], [22, 32], [18, 42], [22, 52], [32, 56]]), Y);
        const arm = [[21, 34], [15, 40], [16, 45]];
        for (const a of [arm, mir(arm)]) { d.tube(a, 4.8, 3.8, Y); const [hx, hy] = a[2]; for (let i = -1; i <= 1; i++) d.poly([[hx + i * 1.6 - 0.7, hy + 0.6], [hx + i * 1.8, hy + 3.4], [hx + i * 1.6 + 0.7, hy + 0.6]], CLAW, { shiny: true }); }
        d.blob(sym([[32, 5], [22, 8], [17, 16], [18, 24], [24, 29], [32, 31]]), Y);
        d.deco.curve([[22, 9], [26, 7]], 1.2, '#ffe080');
      },
    },
    biyomon: {
      front(d) {
        const Y = '#f8c830';
        V.biyomon.body(d);
        d.deco.ell(32, 46, 7, 6, '#fbc8dc');
        eyes(d, 22, 5.6, 2.8, 3.4, '#3a8ae0');
        d.poly([[27, 26], [37, 26], [32, 34]], Y, { shiny: true }); d.deco.line(28.6, 27.6, 35.4, 27.6, 0.8, '#a07010');
      },
      back(d) {
        const Pd = '#d8608f';
        d.poly([[25, 47], [32, 59], [39, 47]], Pd);   // plumes de la queue
        V.biyomon.body(d);
        d.deco.curve([[26, 20], [32, 23], [38, 20]], 0.7, '#d8608f');
      },
      body(d) {
        const P = '#f590b8', Pd = '#d8608f', Y = '#f8c830', Bl = '#5aa0ec', W = '#fbf6ea';
        for (const s of [-1, 1]) { d.tube([[32 + s * 5, 50], [32 + s * 6, 60]], 2.8, 2.4, Y); d.poly([[32 + s * 6 - 4, 60], [32 + s * 6 + 4, 60], [32 + s * 6, 62.5]], Y); }
        d.ell(26.6, 55, 2.8, 1.2, '#f0d040', 0, { shiny: true });
        d.ell(32, 42, 12, 11, P);
        for (const s of [-1, 1]) { d.ell(32 + s * 13, 42, 9.6, 5, Pd, s * -0.7); d.poly([[32 + s * 19, 47], [32 + s * 21, 51.4], [32 + s * 16.6, 48.6]], W); }
        for (const [a, b, c] of [[[29, 16], [26, 8], [23, 3]], [[32, 15], [32, 6], [32, 1]], [[35, 16], [38, 8], [41, 3]]]) { d.tube([a, b, c], 5, 2, P); d.ell(c[0], c[1] + 1, 2.4, 2.8, Bl); }
        d.ell(32, 24, 11, 10, P);
      },
    },
    palmon: {
      front(d) {
        V.palmon.body(d);
        eyes(d, 25, 4.4, 2.8, 3.8, '#202020');
        smile(d, 31, 4, '#2a5a20', 1.4, 1);
        pair(d, 29, 9, 1.3, 0.8, '#ff9ab0');
        d.deco.ell(32, 46, 5, 7, '#a0dc86'); d.deco.curve([[32, 38], [32, 52]], 0.7, '#5aa84a');
      },
      back(d) { V.palmon.body(d); d.deco.curve([[32, 34], [32, 52]], 0.8, '#3e8e3a'); d.deco.curve([[25, 22], [32, 27], [39, 22]], 0.7, '#3e8e3a'); },
      body(d) {
        const G = '#78c862', Gd = '#3e8e3a', Pk = '#f0588c', Pl = '#ff9ec4', Lf = '#2e7a2a';
        for (let i = 0; i < 7; i++) {
          const a = Math.PI * 0.92 + (i / 6) * Math.PI * 1.16, x = 32 + Math.cos(a) * 13.5, y = 22 + Math.sin(a) * 12.5;
          d.ell(x, y, 8, 5.2, Pk, a); d.deco.ell(x - Math.cos(a) * 1.5, y - Math.sin(a) * 1.5, 4.4, 2.2, Pl, a);
        }
        for (const s of [-1, 1]) { d.ell(32 + s * 4.6, 55, 4.4, 8, Gd); d.ell(32 + s * 5.4, 61, 5.6, 2.4, Gd); }
        d.ell(32, 43, 9, 11, G);
        const arm = [[25, 39], [18, 44], [13, 46]];
        for (const a of [arm, mir(arm)]) { d.tube(a, 4.4, 3, G); const [hx, hy] = a[2], s = hx < 32 ? -1 : 1; d.ell(hx + s * 2.4, hy + 0.4, 3.6, 2.4, Lf, s * 0.5); d.ell(hx + s * 2.6, hy - 2.2, 3, 1.6, Lf, s * -0.4); d.ell(hx + s * 2.4, hy + 3, 3, 1.6, Lf, s * 0.8); }
        d.ell(32, 25, 11.5, 10, G);
        d.deco.ell(32, 30, 7, 3, '#8ad874');
        d.circ(32, 13, 3.2, '#f8e070', { shiny: true });
      },
    },
    tentomon: {
      front(d) {
        const G = '#3ab858';
        V.tentomon.body(d, true);
        eyes(d, 27.6, 6.2, 4.2, 5, G);
        d.deco.ell(32, 35.4, 3.6, 1.8, '#5a3a2a', 0, { unlit: true });
      },
      back(d) { V.tentomon.body(d, false); },
      body(d, front) {
        const R = '#c8302a', Rd = '#8a1e1a', Br = '#8a6a4a', Bd = '#5a3a2a', CL = '#f6f2e6';
        for (const s of [-1, 1]) { d.tube([[32 + s * 7, 50], [32 + s * 8, 58]], 4, 3.6, Bd); d.ell(32 + s * 9.4, 59, 3.4, 1.8, Bd); }
        if (front) {
          d.ell(32, 40, 20, 16, R, 0, { shiny: true, far: true });
          d.ell(32, 45, 11, 11, Br, 0, { shiny: true });
          for (const y of [42, 47]) d.deco.curve([[24, y], [32, y + 1.4], [40, y]], 0.6, Bd);
        } else {
          d.ell(32, 42, 20, 17, R, 0, { shiny: true });
          d.deco.line(32, 26, 32, 58, 1.1, Rd);
          d.deco.ell(23, 34, 5, 3, '#e86058', -0.4); d.deco.ell(41, 34, 4, 2.4, '#e86058', 0.4);
        }
        const arm = [[21, 42], [13, 47], [9, 45]];
        for (const a of [arm, mir(arm)]) { d.tube(a, 3, 2, '#7a5a3a'); const [hx, hy] = a[2]; for (let i = -1; i <= 1; i++) d.tube([[hx, hy], [hx + (hx < 32 ? -1 : 1) * 2.4, hy - 2 + i * 2.4]], 1.2, 0.5, CL); }
        d.ell(32, front ? 30 : 25, front ? 11 : 8, front ? 9 : 5, Br, 0, { shiny: true });
        d.tube([[28, front ? 22 : 21], [26, 13], [22, 9]], 1.4, 1, '#3a2a1a'); d.tube([[36, front ? 22 : 21], [38, 13], [42, 9]], 1.4, 1, '#3a2a1a');
      },
    },
    gomamon: {
      front(d) {
        const Pu = '#9a62c8', K = '#2a2836';
        V.gomamon.body(d, true);
        d.deco.ell(32, 51, 10, 4, '#e2e6f4');
        pair(d, 37.4, 6.6, 2.4, 1.6, Pu); d.deco.ell(32, 26.4, 4, 1.8, Pu);
        eyes(d, 31, 5.2, 3.3, 4.2, '#2a8a3a');
        d.ell(32, 37, 2.8, 2.2, K, 0, { shiny: true });
        smile(d, 40.6, 4.6, '#a02a30', 1.6, 1);
        for (const s of [-1, 1]) { d.deco.line(32 + s * 5, 38.6, 32 + s * 11, 37.6, 0.4, '#9aa0b8'); d.deco.line(32 + s * 5, 39.6, 32 + s * 11, 40.4, 0.4, '#9aa0b8'); }
      },
      back(d) {
        const Wt = '#f2f4fb', Pu = '#9a62c8';
        V.gomamon.body(d, false);
        d.deco.ell(26, 42, 6, 2.4, Pu, -0.2); d.deco.ell(39, 41, 4, 1.8, Pu, 0.2); d.deco.ell(32, 49, 3, 1.6, Pu);
        // queue vers nous, nageoire en deux lobes
        d.tube([[32, 52], [32, 58], [32, 61]], 8, 3, Wt);
        d.ell(28, 61, 3.4, 2.2, Wt, 0.4); d.ell(36, 61, 3.4, 2.2, Wt, -0.4);
      },
      body(d, front) {
        const Wt = '#f2f4fb', O = '#f8602a', K = '#2a2836';
        d.ell(32, 46, 18, 12, Wt);
        for (const s of [-1, 1]) { d.ell(32 + s * 11, 57, 6, 4, Wt); for (let i = -1; i <= 1; i++) d.ell(32 + s * 11 + i * 2.6, 60.6, 1, 1.6, K); }
        d.ell(32, 33, 12, 11, Wt);
        d.poly(front ? sym([[22, 29], [22, 16], [26, 22], [27.6, 9], [32, 18]]) : sym([[23, 32], [22, 16], [26, 22], [27.6, 9], [32, 17]]), O, { shiny: true });
        if (!front) d.tube([[32, 26], [32, 38]], 5, 3, O);   // la crête descend sur la nuque
        d.deco.line(26, 20, 28, 26, 0.7, '#c03a12'); d.deco.line(38, 20, 36, 26, 0.7, '#c03a12');
      },
    },
    patamon: {
      front(d) {
        V.patamon.body(d);
        d.deco.ell(32, 48, 9, 7, '#fbe0a8');
        eyes(d, 40, 5.6, 3.4, 4.2, '#3a7ad8');
        d.deco.ell(32, 47, 2.6, 1.4, '#7a3a1a', 0, { unlit: true });
        pair(d, 46, 11.6, 1.8, 1, '#ff9a8a');
      },
      back(d) { V.patamon.body(d); d.ell(32, 55.6, 2.8, 2.4, '#f0a050'); },
      body(d) {
        const O = '#f0a050';
        for (const s of [-1, 1]) { d.tube([[32 + s * 7, 52], [32 + s * 7, 58]], 4, 3.6, O); d.ell(32 + s * 7.6, 59.6, 3.4, 1.8, O); }
        d.ell(32, 44, 16, 13, O, 0, { shiny: true });
        for (const s of [-1, 1]) { d.ell(32 + s * 17, 31, 12.6, 5.2, O, s * 0.5); d.deco.ell(32 + s * 17, 31, 8.6, 3, '#d8803a', s * 0.5); }
      },
    },
    gabumon: {
      front(d) {
        const Y = '#f6c832', Yl = '#ffe486', Hn = '#f0d050', Hd = '#9a7020', Fb = '#dfe4fa', CW = '#f2f2f6', STR = '#3a2aa0';
        const stripe = (pts, w = 2) => d.deco.tube(pts, w * 1.35, w * 0.6, STR, { unlit: true });
        // la fourrure retombe derrière, on en voit les bords
        d.blob(sym([[32, 10], [18, 16], [12, 30], [10, 46], [13, 54], [32, 52]]), Fb, { far: true, tex: 0.1 });
        for (const y of [30, 40, 48]) { stripe([[12, y], [17, y - 1]]); stripe([[52, y], [47, y - 1]]); }
        for (const s of [-1, 1]) {
          d.ell(32 + s * 8, 55, 6.4, 7.2, Y);
          for (let i = -1; i <= 1; i++) d.poly([[32 + s * 8 + i * 3 - 1.2, 62.4], [32 + s * 8 + i * 3, 58.4], [32 + s * 8 + i * 3 + 1.2, 62.4]], CW, { shiny: true });
        }
        d.blob(sym([[32, 22], [22, 26], [19, 36], [18, 48], [24, 57], [32, 57]]), Y);
        d.deco.blob(sym([[32, 40], [26, 42], [26, 52], [32, 55]]), Yl);
        d.deco.ell(32, 47.6, 4, 4.4, '#4aa8e8'); d.deco.ell(32, 47, 2.2, 2.2, '#e05a8a'); d.deco.circ(31.2, 46.6, 0.5, '#1a1a2a'); d.deco.circ(32.8, 46.6, 0.5, '#1a1a2a');
        const arm = [[21, 34], [15, 40], [14, 45]];
        for (const a of [arm, mir(arm)]) { d.tube(a, 5.6, 5, Y); const [hx, hy] = a[2]; d.ell(hx, hy + 1, 3.6, 3.4, Y); for (let i = -1; i <= 1; i++) d.poly([[hx + i * 2 - 0.8, hy + 3], [hx + i * 2.2, hy + 6], [hx + i * 2 + 0.8, hy + 3]], CW, { shiny: true }); }
        // la tête : capuche de loup rayée (oreilles rabattues, corne dorée), mâchoire jaune dessous
        d.blob(sym([[32, 20], [20, 22], [21, 28], [27, 31.4], [32, 32]]), Y);
        d.deco.poly(sym([[32, 21.6], [23, 22.6], [26, 27], [32, 27.4]]), '#a8202a', { unlit: true });
        for (const x of [24.6, 28.4, 35.6, 39.4]) d.poly([[x - 1.2, 21.6], [x, 25.2], [x + 1.2, 21.6]], CW);
        for (const s of [-1, 1]) d.poly([[32 + s * 9, 12], [32 + s * 18, 9], [32 + s * 14, 18]], Fb);
        d.blob(sym([[32, 5], [23, 8], [18, 15], [19, 22], [32, 23]]), Fb, { tex: 0.08 });
        stripe([[24, 9], [26.6, 13]], 1.6); stripe([[40, 9], [37.4, 13]], 1.6); stripe([[20, 16], [24, 18]], 1.4); stripe([[44, 16], [40, 18]], 1.4);
        d.deco.ell(32, 20.4, 1.6, 1.1, '#2a2a3a', 0, { unlit: true });   // truffe
        for (const s of [-1, 1]) {
          const x = 32 + s * 6;
          d.deco.ell(x, 15.6, 2.8, 3.2, '#2a1010', 0, { unlit: true }); d.deco.ell(x, 16, 2.1, 2.5, '#e05a1a', 0, { unlit: true });
          d.deco.circ(x, 16.4, 0.9, '#2a0808', { unlit: true }); d.deco.circ(x - 0.8, 14.8, 0.7, '#ffffff', { unlit: true });
        }
        d.tube([[32, 7], [32, 1], [32, -2]], 4.4, 0.5, Hn, { shiny: true });
        for (const y of [4.6, 1.8]) d.deco.line(30.6, y, 33.4, y, 0.7, Hd);
      },
    },
  };

  // branchement : le dessin d'origine reste celui du profil ; param.view choisit la vue
  for (const sp in V) {
    const base = D[sp], v = V[sp];
    if (!base) continue;
    const f = function (d, p = {}) {
      if (p.view === 'front' && v.front) return v.front(d, p);
      if (p.view === 'back' && v.back) return v.back(d, p);
      return base(d, p);
    };
    Object.assign(f, base);
    f.views = [...new Set([...(base.views || []), ...(v.front ? ['front'] : []), ...(v.back ? ['back'] : [])])];
    D[sp] = f;
  }
})();
