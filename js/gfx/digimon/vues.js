'use strict';
// =====================================================================
//  VUES DE FACE ET DE DOS des partenaires (lignées des sept DigiSélectionnés : Bébé, Entraînement, Disciple, Champion)
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
    // ================================================================ ENTRAÎNEMENT
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
