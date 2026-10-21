'use strict';
// =====================================================================
//  DESSINS — LIGNÉE DE KARI (saison 1) : Nyaromon → Salamon (Plotmon) → Gatomon (Tailmon) → Angewomon
//  → Ophanimon / Magnadramon (Holydramon), d'après les modèles officiels (proportions et couleurs, rien n'est copié).
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
//  Nyaromon, Salamon et Gatomon ont aussi une vue de face et de dos (sur la carte, comme gfx/digimon/vues.js) ;
//  les six ont un réglage de poses de combat (rien ne sort du cadre quand ils penchent).
// =====================================================================
(function () {
  // lissage d'une ligne brisée (Chaikin) : queues et corps sans angles
  const smooth = (pts, n = 3) => { for (let k = 0; k < n; k++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(pts[pts.length - 1]); pts = o; } return pts; };
  // point et direction à la fraction t (0..1) de la longueur d'une ligne brisée
  const at = (pts, t) => {
    const seg = []; let L = 0;
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(l); L += l; }
    let s = Math.max(0, Math.min(1, t)) * L;
    for (let i = 0; i < seg.length; i++) {
      if (s <= seg[i] || i === seg.length - 1) {
        const l = seg[i] || 1, u = Math.min(1, s / l), a = pts[i], b = pts[i + 1];
        return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, dx: (b[0] - a[0]) / l, dy: (b[1] - a[1]) / l };
      }
      s -= seg[i];
    }
  };
  // morceau d'une ligne brisée, entre les fractions t0 et t1
  const part = (pts, t0, t1, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const p = at(pts, t0 + (t1 - t0) * i / n); return [p.x, p.y]; });
  // rayure en travers d'une queue (à la fraction t de son tracé)
  const band = (d, pts, t, w, len, col, o) => { const p = at(pts, t); d.deco.line(p.x - p.dy * len / 2, p.y + p.dx * len / 2, p.x + p.dy * len / 2, p.y - p.dx * len / 2, w, col, o); };
  // touffe en mèches (bout des oreilles et de la queue de Gatomon, de la queue de Magnadramon) : n mèches fines qui
  // partent d'une base étalée (largeur o.base) vers l'angle a, la mèche du milieu la plus longue, celles du bord
  // recourbées vers l'extérieur
  const tuft = (d, x, y, a, len, n, spread, col, o = {}) => {
    const bw = o.base != null ? o.base : 2.4, px = -Math.sin(a), py = Math.cos(a);
    if (o.knot) d.ell(x, y, bw * 0.75, bw * 0.6, col, a, { far: o.far, shiny: true });   // nœud qui réunit les mèches
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) - 0.5 : 0, b = a + t * spread, l = len * (1 - Math.abs(t) * 0.45);
      const bx = x + px * t * bw, by = y + py * t * bw, c = b - t * 0.5;
      d.tube([[bx, by], [bx + Math.cos(c) * l * 0.5, by + Math.sin(c) * l * 0.5], [bx + Math.cos(b) * l, by + Math.sin(b) * l]], o.w || 1.9, 0.3, col, { far: o.far, shiny: true });
    }
  };
  // éventail de plumes-lames (ailes dorées d'Ophanimon) : n plumes partant de (x, y), centrées sur l'angle a
  const fan = (d, x, y, a, sp, n, L0, L1, w, col, o = {}) => {
    for (let k = 0; k < n; k++) {
      const t = n > 1 ? k / (n - 1) : 0.5, b = a - sp / 2 + sp * t, L = L0 + (L1 - L0) * t, bend = o.bend != null ? o.bend : 0.1;
      const m = [x + Math.cos(b - bend) * L * 0.55, y + Math.sin(b - bend) * L * 0.55], e = [x + Math.cos(b) * L, y + Math.sin(b) * L];
      d.tube([[x, y], m, e], w, o.w1 != null ? o.w1 : 0.8, col, { far: o.far, shiny: !o.far });
      if (o.vein) d.deco.line(x + Math.cos(b - bend * 0.5) * L * 0.3, y + Math.sin(b - bend * 0.5) * L * 0.3, x + Math.cos(b) * L * 0.86, y + Math.sin(b) * L * 0.86, 0.45, o.vein);
    }
  };
  // aile d'ange déployée, d'un seul tenant : bord d'attaque arqué de la racine (x, y) vers l'angle a (longueur L),
  // bord de fuite en n plumes arrondies du côté s (±1), largeur W ; nervures (o.line) et bouts teintés (o.tip)
  const wing = (d, x, y, a, L, W, col, o = {}) => {
    const s = o.side || 1, n = o.n || 5, ux = Math.cos(a), uy = Math.sin(a), vx = -uy * s, vy = ux * s;
    const P = (u, v) => [x + ux * u + vx * v, y + uy * u + vy * v];
    const prof = t => W * (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)), 0.7));
    const pts = [];
    for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(P(t * L * 0.96, -W * 0.18 * Math.sin(Math.PI * t) - (i === 0 ? W * 0.25 : 0))); }
    pts.push(P(L * 1.04, W * 0.02));
    for (let k = 0; k < n; k++) {
      const t0 = 1 - k / n, t1 = 1 - (k + 1) / n, tm = (t0 + t1) / 2;
      pts.push(P(tm * L + L * 0.1, prof(tm) * 1.08), P(t1 * L + L * 0.05, prof(t1) * 0.72));
    }
    pts.push(P(0, W * 0.3));
    d.blob(pts, col, { far: o.far, shiny: !o.far, round: 0.5 });
    if (o.line) for (let k = 1; k < n; k++) { const t = 1 - k / n, a0 = P(t * L * 0.9 + L * 0.04, W * 0.12), a1 = P(t * L + L * 0.05, prof(t) * 0.66); d.deco.line(a0[0], a0[1], a1[0], a1[1], 0.5, o.line); }
    if (o.tip) for (let k = 0; k < n; k++) { const tm = 1 - (k + 0.5) / n, p = P(tm * L + L * 0.08, prof(tm) * 0.9); d.deco.ell(p[0], p[1], W * 0.16, W * 0.12, o.tip, a); }
  };
  // anneau sacré (bande dorée gravée) posé en travers d'un tracé, à la fraction t
  const holyRing = (d, pts, t, len, wid, o = {}) => {
    const p = at(pts, t), ux = p.dx * len / 2, uy = p.dy * len / 2, vx = -p.dy * wid / 2, vy = p.dx * wid / 2;
    d.poly([[p.x - ux - vx, p.y - uy - vy], [p.x + ux - vx, p.y + uy - vy], [p.x + ux + vx, p.y + uy + vy], [p.x - ux + vx, p.y - uy + vy]], '#f0c232', { shiny: true, round: 0.5, far: o.far });
    d.deco.line(p.x - vx * 0.7, p.y - vy * 0.7, p.x + vx * 0.7, p.y + vy * 0.7, 0.5, '#9a7414');
  };
  // vues symétriques (de face, de dos) : miroir autour de x = 32, contour complété par son miroir, paires d'yeux et de
  // taches (comme gfx/digimon/vues.js)
  const mir = pts => pts.map(([x, y]) => [64 - x, y]);
  const sym = L => [...L, ...mir(L).reverse().filter(([x]) => Math.abs(x - 32) > 0.01)];
  const eyes = (d, y, dx, rx, ry, iris, o = {}) => { d.eye(32 - dx, y, rx, ry, iris, { ...o, look: 0.06 }); d.eye(32 + dx, y, rx, ry, iris, { ...o, look: -0.06 }); };
  const pair = (d, y, dx, rx, ry, col, rot = 0) => { d.deco.ell(32 - dx, y, rx, ry, col, rot); d.deco.ell(32 + dx, y, rx, ry, col, -rot); };

  Object.assign(DW.DRAW, {

    // ---------------------------------------------------------- Entraînement : Nyaromon, petite tête de chat jaune
    // (un « mochi » aux deux oreilles pointues), grands yeux brun-rouge, bouche en zigzag, longue queue rayée de violet
    // au bout violet
    nyaromon(d) {
      const Y = '#f6dc4e', Yd = '#d6ae2e', Yi = '#ebbd3c', Yl = '#fff6c4', P = '#8c6ad0', K = '#3a1a10';
      // queue (derrière) : sort du bas du dos et remonte en crosse ; rayures puis bout violets
      const tail = smooth([[20, 56], [10, 57.8], [4.6, 52.6], [3.4, 45], [5, 39], [9, 35.4]], 3);
      d.tube(tail, 3.4, 2.6, Y);
      for (const t of [0.4, 0.51, 0.62]) band(d, tail, t, 1.2, 4.4, P);
      d.tube(part(tail, 0.73, 1), 2.8, 3.6, P, { shiny: true });
      // oreilles pointues (le haut du crâne les recouvre à la base)
      d.poly([[38, 31], [42.6, 25], [47, 19.6], [50.4, 16], [51.6, 24], [52, 33], [51, 39]], Yd, { far: true, round: 0.55 });
      d.poly([[14.4, 41], [14, 31], [16.6, 21], [19.6, 15.6], [23.4, 21], [28, 27], [32.6, 31]], Y, { round: 0.55 });
      d.deco.poly([[17.4, 33], [18.4, 23.6], [20, 19.6], [24.4, 26], [28, 31]], Yi);
      // tête-corps en mochi, plus large en bas
      d.blob([[13.4, 62.6], [10.4, 53], [12, 42.6], [18, 34.4], [28, 29.4], [38, 29], [47.4, 33.4], [53, 42], [54.4, 52], [52, 61], [44, 63], [21, 63]], Y, { shiny: true });
      d.deco.ell(22, 39, 5.6, 2.8, Yl, -0.5, { unlit: true });
      // grands yeux brun-rouge
      d.eye(34.4, 45.4, 4.8, 5.6, '#a42a1a', { look: 0.3 });
      d.eye(46.6, 46, 3.8, 5, '#a42a1a', { look: 0.3 });
      // bouche en zigzag
      d.deco.curve([[36.8, 53.4], [38.8, 55.6], [40.8, 53.6], [42.8, 55.6], [44.8, 53.4]], 0.9, K, { unlit: true });
    },

    // ---------------------------------------------------------- Disciple : Salamon (Plotmon), petit chien-chat crème
    // à quatre pattes, grosse tête, longues oreilles tombantes beiges, yeux bleus, joues roses, collier doré (l'anneau sacré)
    salamon(d) {
      const W = '#fbf5ea', Wd = '#ddd0c0', E = '#f0dcbc', Ed = '#d4b089', G = '#ecc23c', Gd = '#9a7414', Bl = '#3a7ad8', Pk = '#f4a6b6';
      // oreille éloignée (pend derrière la tête, côté droit)
      d.blob([[48.6, 11], [53.6, 11.6], [57.6, 17], [59.6, 26], [59.4, 34], [56.4, 37.4], [53.6, 33]], E, { far: true, round: 0.5 });
      // pattes éloignées
      d.tube([[23.6, 50], [23.6, 57]], 6, 5.6, Wd, { far: true }); d.ell(24.8, 59.6, 4.4, 2.8, Wd, 0, { far: true });
      d.tube([[37, 50], [37.6, 57]], 6, 5.6, Wd, { far: true }); d.ell(38.8, 59.6, 4.4, 2.8, Wd, 0, { far: true });
      // corps
      d.ell(28, 47, 12.4, 8.6, W, 0, { shiny: true });
      // pattes proches, pieds ronds
      d.tube([[18.4, 51], [18.6, 57.6]], 7, 6.6, W); d.ell(19.8, 59.6, 5, 3, W);
      d.tube([[32.6, 51], [33.4, 57.6]], 7, 6.6, W); d.ell(35, 59.6, 5, 3, W);
      for (const x of [21.6, 23.6, 36.8, 38.8]) d.deco.line(x, 58.4, x + 0.4, 61.6, 0.5, Wd);
      // collier doré : l'anneau sacré, gravé
      d.tube(smooth([[30, 37.6], [35, 41.4], [41, 42.2], [45.4, 40.6], [47.6, 37.4]], 2), 3.8, 3, G, { shiny: true });
      for (let i = 0; i < 3; i++) d.deco.line(35.6 + i * 3.4, 40.6, 36.2 + i * 3.4, 42.8, 0.5, Gd);
      // tête
      d.blob([[27.6, 19], [32, 11.4], [41, 8.4], [50.6, 10.6], [56, 17], [57.4, 27], [53.6, 34.6], [42, 37.4], [31.6, 34.6], [27, 27]], W, { shiny: true });
      // yeux bleus, joues roses, petite truffe, bouche
      d.eye(43.4, 24.6, 3.8, 4.6, Bl, { look: 0.3 });
      d.eye(52, 25, 3, 4.2, Bl, { look: 0.3 });
      d.deco.ell(39, 31, 2.4, 1.5, Pk); d.deco.ell(55, 31.2, 1.6, 1.4, Pk);
      d.deco.poly([[48.4, 29.6], [50.6, 29.6], [49.5, 31]], '#9a5a5a', { unlit: true });
      d.deco.curve([[47.6, 32.4], [49.5, 33.4], [51.4, 32.4]], 0.7, '#8a4a4a', { unlit: true });
      // oreille proche : un grand rabat beige qui pend le long de la joue, plus large au bout
      d.blob([[30, 11.6], [36.4, 10.6], [37, 15], [33.6, 21], [31.4, 30], [31.4, 38], [30, 44], [25, 45.6], [21.6, 41], [22.6, 32], [24.4, 22], [26.6, 15]], E, { shiny: true, round: 0.5 });
      d.deco.curve([[30.6, 16], [28, 26], [27, 36], [26.4, 42]], 0.8, Ed);
    },

    // ---------------------------------------------------------- Champion : Gatomon (Tailmon), chat blanc debout,
    // grandes oreilles à touffe violette, yeux bleus, gants jaunes rayés de rouge aux longues griffes, queue rayée de
    // violet portant l'anneau sacré doré
    gatomon(d, p = {}) {
      const W = '#f8f8fc', Wd = '#d2d2e2', Pk = '#f6a8bc', Pu = '#7c52c4', Y = '#eedc3c', R = '#e2501e', K = '#2c2832', Bl = '#3c9ae8';
      const atk = p.pose === 'attack';
      // queue (derrière) : rayée de violet, anneau sacré, touffe violette au bout
      const tail = smooth([[25, 51], [15, 53.4], [8.4, 48], [7, 38], [10, 29], [11, 21], [8.6, 14.6]], 3);
      d.tube(tail, 3, 2.4, W);
      for (const t of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) band(d, tail, t, 1.2, 4, Pu);
      holyRing(d, tail, 0.9, 2.6, 4.6);
      const e = at(tail, 0.96); tuft(d, e.x, e.y, Math.atan2(e.dy, e.dx), 7, 3, 1.1, Pu, { base: 2.4, w: 2.6, knot: true });
      // oreilles (derrière la tête) : intérieur rose, touffe violette en pinceau au bout
      d.poly([[38, 18], [45, 12], [51.6, 7.4], [50, 17], [47, 24]], W, { far: true });
      d.deco.poly([[41, 18], [48.6, 10.6], [47.6, 18.6]], Pk);
      tuft(d, 50.6, 8.8, -0.93, 7, 3, 1.1, Pu, { far: true, base: 2.4, w: 2.6, knot: true });
      d.poly([[24, 25], [21.6, 14], [19.8, 7], [27, 11], [34, 18]], W);
      d.deco.poly([[24.6, 21], [22, 11], [30.6, 17]], Pk);
      tuft(d, 20.8, 8.8, -2.15, 7.6, 3, 1.1, Pu, { base: 2.4, w: 2.6, knot: true });
      // bras et gant éloignés (derrière le gant proche)
      d.tube([[35, 41], [40.6, 49]], 3.6, 3.4, Wd, { far: true });
      d.ell(43, 51.4, 3.8, 3.6, Y, 0, { far: true });
      d.deco.line(41.4, 48.6, 40.8, 52.6, 1, R);
      for (let i = -1; i <= 1; i++) d.tube([[46, 51.6 + i * 1.6], [48.6, 53 + i * 2], [50.6, 55.6 + i * 2.2]], 1.6, 0.3, K, { far: true, shiny: true });
      // corps et jambes courtes
      d.tube([[36, 51], [37.6, 57]], 5.6, 5, Wd, { far: true }); d.ell(39.6, 59.8, 5, 2.6, Wd, 0, { far: true });
      d.blob([[26, 38], [37, 37], [41, 44], [40, 52], [33, 55.6], [25, 53.6], [22.6, 45]], W, { shiny: true });
      d.tube([[28.6, 51], [28.6, 57]], 6.4, 5.6, W); d.ell(31, 59.8, 5.6, 2.8, W);
      d.deco.line(33.4, 58.8, 33.8, 61.6, 0.5, Wd); d.deco.line(35.4, 59, 35.8, 61.6, 0.5, Wd);
      // tête : yeux bleus, petit nez rose, bouche en « ω », moustaches
      d.blob([[24, 30], [25.6, 21], [32, 17], [40, 16.6], [47, 20], [50.4, 27], [49, 35], [42, 39.6], [31, 39.6], [25.4, 36]], W, { shiny: true });
      d.eye(39, 27.6, 3.8, 4.6, Bl, { look: 0.32 });
      d.eye(46.6, 28, 3, 4.2, Bl, { look: 0.32 });
      d.deco.poly([[44.4, 32.4], [46.6, 32.4], [45.5, 33.8]], '#e07890', { unlit: true });
      d.deco.curve([[43, 34.6], [44.2, 35.8], [45.5, 34.8], [46.8, 35.8], [48, 34.6]], 0.6, '#3a2a3a', { unlit: true });
      for (const [y0, y1] of [[33.4, 32], [34.8, 34.6], [36.2, 37.4]]) d.deco.line(37, y0, 30.6, y1, 0.4, '#6a6a7a');
      d.deco.line(48.4, 33, 50.4, 32.4, 0.4, '#6a6a7a'); d.deco.line(48.4, 34.4, 50, 34.6, 0.4, '#6a6a7a');
      // bras proche : gant jaune rayé de rouge, trois longues griffes noires (levées en attaque)
      const gy = atk ? 38 : 45.6, ga = atk ? -0.5 : 0.25;
      d.tube([[37, 40], [42, atk ? 40 : 44]], 4, 3.6, W);
      d.tube([[41.6, atk ? 39.6 : 43.4], [46.6, gy - 0.4]], 6, 6.4, Y);
      d.ell(49, gy, 4.6, 4.4, Y, 0, { shiny: true });
      for (const [x0, x1] of [[43.4, 42.6], [46.4, 45.8], [49.6, 49.6]]) d.deco.line(x0, gy - 3.6, x1, gy + 0.6, 1.1, R);
      for (let i = -1; i <= 1; i++) {
        const a = ga + i * 0.36, x = 52.6, y = gy + i * 2;
        d.tube([[x, y], [x + Math.cos(a - 0.2) * 3.6, y + Math.sin(a - 0.2) * 3.6], [x + Math.cos(a) * 7, y + Math.sin(a) * 7]], 2, 0.3, K, { shiny: true });
      }
    },

    // ---------------------------------------------------------- Ultime : Angewomon, ange aux huit ailes blanches,
    // casque argenté qui couvre les yeux, longs cheveux blonds, tenue blanche et plastron doré, ruban rose en boucle
    angewomon(d) {
      const Wh = '#f8f6f4', Wd = '#dcd8e4', Wp = '#efc6e0', Wl = '#ddd2e6', Hy = '#f4e08c', Hyd = '#cfae58', Sk = '#f8d6bc';
      const Hm = '#c4c8d4', Hmd = '#5a6070', Rb = '#dc92c6', G = '#eac040', Bt = '#5a3a2e';
      // ailes : quatre derrière l'épaule droite (en partie cachées), quatre déployées vers la gauche
      for (const [a, L] of [[-0.05, 15], [-0.45, 18], [-0.85, 19], [-1.25, 17]]) wing(d, 37, 20, a, L, 6.6, Wd, { side: 1, far: true, n: 4 });
      for (const [a, L] of [[2.85, 20], [-2.85, 23], [-2.4, 24], [-1.9, 19.5]]) wing(d, 27, 21, a, L, 8, Wh, { side: -1, line: Wl, tip: Wp });
      // ruban rose : boucle au-dessus de la tête et pan qui pend à gauche en ondulant, bout effiloché
      d.tube(smooth([[10.8, 59.8], [13.6, 55.4], [13, 50], [16, 44], [18.6, 37], [21.6, 29], [21, 18], [23.6, 8], [30, 2.2], [37.6, 2.8], [42.6, 8], [44, 15.6], [44.4, 22]], 2), 2.3, 2.3, Rb, { round: 0.4 });
      for (const [x, y] of [[8.4, 61.6], [10.2, 62], [12, 61.6]]) d.line(10.8, 59.8, x, y, 0.9, Rb);
      // longs cheveux blonds (dans le dos), ondulés
      d.blob([[28, 4.6], [34, 4], [33, 10], [30, 17], [28.6, 26], [28, 34], [26.6, 41], [25.6, 48], [23.6, 43], [21.6, 48.4], [20.4, 42], [17.6, 45], [18.4, 36], [19.4, 26], [20.6, 17], [23, 10]], Hy, { tex: 0.12 });
      for (const pts of [[[23, 14], [20.8, 26], [20.4, 36], [19.6, 42]], [[25.6, 16], [23.6, 28], [23, 38], [22.6, 45]], [[28, 18], [26.6, 30], [25.8, 40]]]) d.deco.curve(pts, 0.7, Hyd);
      // bras éloigné : long gant blanc, le long du corps
      d.tube([[26.8, 20.6], [25, 28], [25.4, 35.6]], 3.4, 2.8, Wh, { far: true });
      // jambe éloignée : bas blanc, talon
      d.tube([[29.6, 36], [28.8, 47], [28.4, 57]], 5, 3.6, Wh, { far: true });
      d.poly([[26.4, 57], [31, 57], [34.4, 61.2], [33, 62.2], [28.8, 61], [27.6, 62.4], [26.4, 62.4]], Wh, { far: true });
      // jambe proche : nue, jarretière brune, botte blanche à bande dorée et petite aile, talon
      d.tube([[35, 36], [35.8, 47], [36.2, 56]], 5.6, 3.8, Sk);
      d.deco.tube([[32.4, 40.4], [37.8, 40.8]], 1.4, 1.4, Bt);
      d.tube([[36, 50], [36.2, 57.6]], 4.6, 4.2, Wh, { shiny: true });
      d.rect(33.4, 49.2, 5.4, 1.8, G, { shiny: true, round: 0.5 });
      d.poly([[34, 57], [38.6, 57], [42.6, 61.2], [41, 62.4], [37, 61.2], [35.6, 62.6], [34, 62.6]], Wh, { shiny: true });
      wing(d, 34.6, 54.6, -2.7, 6, 3, Wh, { side: -1, n: 3 });
      // torse : épaules nues, tenue blanche, plastron doré, ceinture brune
      d.blob([[27, 19], [33, 17], [39, 19], [39.6, 24], [27, 24]], Sk);
      d.blob([[27.4, 22], [38.6, 22], [38, 28], [36.6, 31], [38.4, 36.4], [34, 38.6], [31, 38], [27.6, 38.4], [25.6, 36], [27.6, 31], [26.6, 27]], Wh, { shiny: true });
      d.blob([[27.6, 21.4], [38.4, 21.2], [38, 24.6], [33.2, 26.6], [28.2, 24.6]], G, { shiny: true });
      d.deco.line(33.2, 21.8, 33.2, 25.6, 0.5, '#a8801a');
      d.rect(26.4, 29.4, 11.8, 2.6, Bt, { round: 0.4 });
      d.deco.rect(31, 29.6, 2.8, 2.2, '#c8ccd8');
      // cou et visage (le casque couvre les yeux), mèche blonde
      d.tube([[32.4, 14], [32.8, 19]], 3.4, 3.6, Sk);
      d.blob([[29, 8], [34, 5.6], [38.4, 8], [39, 12.6], [36.6, 16.4], [33, 16.8], [29.6, 14]], Sk);
      d.deco.ell(36.4, 14.2, 1.2, 0.6, '#e0607a', 0, { unlit: true });
      d.tube([[29.2, 10], [28.2, 16], [27.6, 22]], 2.4, 1.4, Hy);
      // casque argenté arrondi : visière à fentes, petites ailes sur les côtés
      d.blob([[27.6, 11.6], [27, 7], [29.6, 3.6], [34.6, 2.4], [39.4, 4.2], [41.2, 8.4], [40.6, 11.6], [35.6, 11.8], [31, 12.6]], Hm, { shiny: true, round: 0.6 });
      d.deco.poly([[33.4, 7.4], [40.6, 7], [40.8, 10.8], [33.8, 11.2]], '#9298a8');
      for (const y of [8.4, 9.8]) d.deco.line(34.2, y, 40.6, y - 0.2, 0.5, Hmd, { unlit: true });
      wing(d, 29.6, 6.4, -2.45, 7.4, 3.2, Wh, { side: -1, n: 3 });
      // bras proche (nu) tendu en avant, main ouverte ; le ruban s'y enroule et pend à droite
      d.tube([[37.6, 20], [44, 23], [50.4, 21.6]], 3.4, 2.8, Sk);
      d.ell(51.8, 21.2, 2, 1.7, Sk);
      d.tube(smooth([[44.4, 22], [45, 27], [48.6, 33], [48.4, 40], [51, 47], [51, 54], [54.6, 59.8]], 2), 2.3, 2.3, Rb, { round: 0.4 });
      for (const [x, y] of [[53.2, 61.8], [55, 62.1], [56.6, 61.6]]) d.line(54.6, 59.8, x, y, 0.9, Rb);
      d.deco.curve([[42, 23.4], [44.4, 25.6]], 1.2, Rb);
    },

    // ---------------------------------------------------------- Méga : Ophanimon, ange en armure verte et dorée aux
    // dix ailes dorées, casque à visière, cheveux roux, longue jupe blanche, lance d'Éden et bouclier
    ophanimon(d) {
      const Gn = '#2ea880', Gnd = '#1c7458', Go = '#f2c844', God = '#b88a1c', Wh = '#f6f4ee', Whd = '#cfcfd6', Sk = '#f6d4bc', Hr = '#c4502e';
      // dix ailes dorées en étoile (cinq de chaque côté ; celles de droite, derrière, en partie cachées)
      for (const [a, L] of [[-1.4, 18], [-0.98, 21], [-0.55, 19], [-0.12, 16], [0.32, 13]]) fan(d, 37, 20, a, 0.12, 2, L, L * 0.72, 4.4, Go, { far: true, bend: 0.06 });
      for (const [a, L] of [[-1.72, 19.5], [-2.12, 23], [-2.55, 24], [-2.98, 22], [2.7, 18]]) fan(d, 27, 21, a, 0.12, 2, L, L * 0.72, 5, Go, { bend: -0.06, vein: God });
      // plumes dorées qui pendent des hanches (derrière)
      fan(d, 26, 34, 1.95, 0.5, 4, 20, 15, 3.6, '#f6e2a0', { far: true });
      // cheveux roux (sous le casque, dans le dos)
      d.blob([[28, 8], [33, 6], [31, 14], [28, 22], [23, 25], [22.6, 18], [25, 11]], Hr, { tex: 0.15 });
      // bras éloigné et bouclier (vert bordé d'or, emblème doré)
      d.tube([[26.6, 20.6], [22.6, 27], [19, 31]], 4.4, 4, Gnd, { far: true });
      d.blob([[10, 27], [17, 24.6], [24, 27], [24.4, 36], [17.4, 47], [10.4, 37]], Go, { shiny: true });
      d.blob([[11.6, 28.4], [17, 26.6], [22.6, 28.4], [22.8, 35.6], [17.4, 44], [12, 36.4]], Gn, { shiny: true });
      d.deco.line(17.2, 28.4, 17.2, 42, 1.2, Go); d.deco.line(12.6, 33.4, 22, 33.4, 1.2, Go);
      d.deco.circ(17.2, 33.4, 2, Go);
      // jupe blanche plissée jusqu'aux chevilles, chaussures vertes
      d.blob([[26, 40], [39, 40], [41.4, 50], [42.6, 58.6], [33, 59.6], [22.6, 58.6], [24, 50]], Wh, { shiny: true });
      for (const x of [27, 30.6, 34.4, 38]) d.deco.line(x, 45, x - (x < 33 ? 1.2 : -1.2), 58.4, 0.6, Whd);
      d.poly([[27.6, 58.6], [32.4, 58.6], [35.6, 61.6], [34, 62.4], [29.6, 61.6], [28.6, 62.6], [27.6, 62.6]], Gn, { far: true });
      d.poly([[34.6, 58.6], [39.6, 58.6], [43, 61.6], [41.4, 62.6], [37, 61.6], [36, 62.8], [34.6, 62.8]], Gn, { shiny: true });
      // armure des hanches (écailles) jusqu'aux genoux
      d.blob([[27, 30], [37.6, 30], [39.6, 38], [40.6, 45], [33, 47], [24.6, 45], [25.6, 38]], Gn, { shiny: true });
      for (const y of [36, 40.4]) d.deco.curve([[26, y], [33, y + 1.6], [40, y]], 0.6, Gnd);
      // plastron vert, croix dorée sur le ventre
      d.blob([[26.6, 19], [38.4, 19], [39.4, 26], [37.6, 32], [27.4, 32], [25.6, 26]], Gn, { shiny: true });
      d.deco.curve([[27.4, 23.4], [32.6, 25.6], [38.6, 23.4]], 0.8, Go);
      d.deco.line(32.6, 26.6, 32.6, 36.4, 1.3, Go, { unlit: true }); d.deco.line(29.4, 30.6, 35.8, 30.6, 1.3, Go, { unlit: true }); d.deco.circ(32.6, 30.6, 1.6, '#fff0a0', { unlit: true });
      // épaulière éloignée
      d.circ(26.6, 20.4, 4.4, Gn, { far: true });
      // tête : visage, casque vert à visière, étoile dorée
      d.tube([[32.4, 14], [32.6, 19]], 3.4, 3.6, Sk);
      d.blob([[30, 10], [40.4, 10.4], [39.6, 14.2], [36.6, 16.4], [33, 15.6]], Sk);
      d.deco.ell(37, 14, 1.1, 0.55, '#d0586a', 0, { unlit: true });
      d.blob([[27.4, 12.6], [27.6, 6.6], [31, 3.6], [36.4, 3.4], [40.4, 6.6], [41, 11.4], [37.4, 12.4], [31, 13]], Gn, { shiny: true });
      d.deco.poly([[33.6, 8.4], [41, 8], [41, 10.8], [34, 11.2]], '#123a2e', { unlit: true });
      d.deco.poly([[36.6, 3.6], [37.4, 5.2], [39, 6], [37.4, 6.8], [36.6, 8.4], [35.8, 6.8], [34.2, 6], [35.8, 5.2]], Go, { unlit: true });
      d.tube([[28.4, 8], [24, 7.4]], 1.6, 0.4, Go, { shiny: true });
      // lance d'Éden (dorée, longue pointe, anneau), bras proche qui la tient
      d.tube([[53, 61.6], [55.2, 9.4]], 1.8, 1.6, Go, { shiny: true });
      d.poly([[53.8, 10.4], [56.6, 10.4], [56.2, 2.4], [55.4, 1.6], [54.6, 2.4]], '#fff2b0', { shiny: true });
      d.curve([[55, 14.4], [57.4, 13.2], [57.8, 11], [56.4, 9.4], [54, 9.6], [52.6, 11.6], [53, 13.8], [55, 14.4]], 0.9, Go, { shiny: true });
      d.circ(38.6, 20.4, 4.8, Gn, { shiny: true });
      d.deco.curve([[35, 19], [38.6, 16.4], [42.4, 19]], 0.7, Go);
      d.tube([[40, 22], [46, 26.6], [52.4, 29]], 4.2, 3.6, Gn, { shiny: true });
      d.deco.rect(45, 24.6, 2.4, 3.6, Go);
      d.ell(54, 29.4, 2.4, 2.2, Gn, 0, { shiny: true });
    },

    // ---------------------------------------------------------- Méga : Magnadramon (Holydramon), grand dragon sacré
    // serpentin rose et blanc, crinière blanche, cornes noires rayées de magenta, œil vert, quatre ailes de plumes,
    // anneaux sacrés dorés aux poignets et à la queue
    magnadramon(d) {
      const P = '#f6dce8', Pd = '#d8a8c4', Pb = '#e8a6c6', Mw = '#fdf8fc', Wg = '#fbf0f6', Wl = '#e6c4d8', Wt = '#f0b8d4', Hk = '#2a2030', Hm = '#d82c7c', Cl = '#8a7a88';
      // ailes de plumes (quatre, derrière le dos)
      for (const [a, L, far] of [[-1.72, 23, true], [-2.18, 26, false], [-2.64, 25, false], [-3.06, 21, false]]) wing(d, 30, 29, a, L, 8.6, Wg, { side: -1, line: Wl, tip: Wt, far });
      // corps serpentin : la queue (derrière) balaie le sol vers la gauche, touffe au bout
      const spine = smooth([[45, 19], [38.6, 25.6], [33.6, 34], [33.6, 42], [38, 49], [36, 56], [26, 59.4], [16, 59.6], [9.6, 56.6], [7.6, 50.6]], 3);
      d.tube(part(spine, 0.5, 1, 14), 10, 2.4, P, { shiny: true });
      holyRing(d, spine, 0.88, 2, 4.4);
      const e = at(spine, 1); tuft(d, e.x, e.y, Math.atan2(e.dy, e.dx), 5, 4, 1.4, Mw);
      // patte arrière éloignée
      d.tube([[29, 53], [26.6, 58.6]], 4, 3.4, Pd, { far: true }); d.ell(26.6, 60.6, 3.4, 1.8, Pd, 0, { far: true });
      // tronc et cou, ventre rose plus soutenu
      d.tube(part(spine, 0.18, 0.56, 12), 12.4, 11, P, { shiny: true, noline: true });
      d.deco.tube(part(spine, 0.2, 0.52, 10).map(([x, y]) => [x + 3.6, y + 0.4]), 4.6, 4, Pb);
      // crinière blanche duveteuse le long de la nuque (le cou la recouvre à la base)
      wing(d, 41, 9.4, 2.06, 24.4, 7.6, Mw, { side: 1, n: 6, line: '#e6d6e2' });
      d.tube(part(spine, 0, 0.24, 8), 8.4, 11.4, P, { shiny: true, noline: true });
      d.deco.tube(part(spine, 0.02, 0.22, 6).map(([x, y]) => [x + 2.4, y + 2]), 3.4, 4, Pb);
      // patte arrière proche
      d.tube([[36, 51], [40.6, 56.6], [41.4, 59.6]], 5.4, 4, P);
      d.ell(43, 60.8, 3.8, 1.8, P);
      for (let i = 0; i < 3; i++) d.tube([[43.4 + i * 1.6, 61], [45.4 + i * 1.8, 62.4]], 1.2, 0.4, Cl);
      // bras éloigné
      d.tube([[34, 37], [38.4, 42.6], [44, 43]], 4.4, 3.6, Pd, { far: true });
      for (let i = -1; i <= 1; i++) d.tube([[45, 43 + i * 1.4], [48.6, 44.4 + i * 1.8]], 1.4, 0.3, Cl, { far: true });
      // tête : cornes noires rayées de magenta, crâne, long museau, gueule ouverte
      d.tube(smooth([[45, 10], [40.4, 5.4], [34.6, 3.6], [29, 4.6]], 2), 3.4, 0.6, Hk, { far: true, shiny: true });
      d.tube(smooth([[47.4, 9.6], [44.4, 5], [39.4, 3], [34, 3.2]], 2), 3.6, 0.6, Hk, { shiny: true });
      for (const [x, y] of [[43.4, 4.4], [39.8, 3], [36.4, 3]]) d.deco.line(x, y - 1.6, x + 0.6, y + 1.6, 0.9, Hm, { unlit: true });
      d.ell(46, 14.6, 7, 6.2, P, 0, { shiny: true });
      d.blob([[46.6, 10.4], [54, 11.6], [59.8, 13.6], [60.6, 17], [56, 18.6], [49, 19]], P, { shiny: true });
      d.blob([[47, 19], [54.4, 20.4], [59, 23.2], [57.6, 25.2], [50.6, 24.6], [45.6, 22]], P);
      d.deco.poly([[49, 18.6], [59.8, 17.4], [58.2, 22.8], [51, 22.4]], '#8a1028', { unlit: true });
      for (let i = 0; i < 4; i++) d.deco.poly([[50.2 + i * 2.4, 18.4 - i * 0.15], [51.1 + i * 2.4, 20.1 - i * 0.15], [52 + i * 2.4, 18.2 - i * 0.15]], '#ffffff', { unlit: true });
      d.deco.ell(59.6, 14.4, 0.7, 0.5, '#5a2a40', 0, { unlit: true });
      d.deco.ell(49.6, 12.6, 2.4, 1.7, '#1a1a22', -0.2, { unlit: true });
      d.deco.ell(50, 12.6, 1.6, 1.1, '#3ac860', -0.2, { unlit: true }); d.deco.circ(49.4, 12.1, 0.45, '#ffffff', { unlit: true });
      d.deco.curve([[46.6, 10.6], [50, 10], [53, 11]], 0.9, '#a86a8a', { unlit: true });
      // touffes blanches derrière la tête et barbiche sous la mâchoire
      for (const [x, y, a, l] of [[41.6, 11, -2.6, 6], [41, 16, -2.95, 6.4], [46.6, 22.6, 2.1, 4.6]]) tuft(d, x, y, a, l, 3, 0.8, Mw, { w: 2.2, base: 2.6 });
      // bras proche, griffes grises, anneau sacré au poignet
      d.tube([[39, 35], [45, 40], [50.6, 38.4]], 5, 4, P, { shiny: true });
      d.rect(46.6, 37, 2.6, 4.6, '#f0c232', { shiny: true, round: 0.5 });
      d.ell(52, 38, 2.6, 2.4, P);
      for (let i = -1; i <= 1; i++) d.tube([[53.4, 38 + i * 1.6], [56, 37 + i * 2.4], [57.6, 38.6 + i * 2.6]], 1.6, 0.3, Cl, { shiny: true });
    },
  });

  // ------------------------------------------------------------ vues de face et de dos (Entraînement, Disciple, Champion)
  // Sur la carte, le partenaire suit le héros : vu de DOS quand il monte, de FACE quand il descend (gfx/sprites.js :
  // param.view). Dessins symétriques autour de x = 32, mêmes couleurs que les profils ; de dos, pas de visage.
  const NY = { Y: '#f6dc4e', Yi: '#ebbd3c', Yl: '#fff6c4', P: '#8c6ad0', K: '#3a1a10' };
  const SA = { W: '#fbf5ea', Wd: '#ddd0c0', E: '#f0dcbc', Ed: '#d4b089', G: '#ecc23c', Gd: '#9a7414' };
  const GA = { W: '#f8f8fc', Pk: '#f6a8bc', Pu: '#7c52c4', Y: '#eedc3c', R: '#e2501e', K: '#2c2832' };
  const V = {
    nyaromon: {
      ears(d, front) {
        const ear = [[12.4, 42], [12, 31], [14.4, 21.6], [17.4, 15.6], [21.6, 21], [26.6, 27], [31, 30.6]];
        for (const e of [ear, mir(ear)]) d.poly(e, NY.Y, { round: 0.55 });
        if (front) { const inner = [[15.4, 33.4], [16.2, 24], [17.8, 19.8], [22.2, 26], [26.6, 31.4]]; for (const e of [inner, mir(inner)]) d.deco.poly(e, NY.Yi); }
      },
      head(d) {
        d.blob(sym([[32, 29.4], [22, 30.6], [14.6, 35.6], [10.8, 45], [11, 56], [15.6, 62.6], [32, 63]]), NY.Y, { shiny: true });
        d.deco.ell(21.4, 39, 5.4, 2.6, NY.Yl, -0.5, { unlit: true });
      },
      // la queue dépasse derrière, à gauche ; grands yeux, bouche en zigzag
      front(d) {
        const tail = smooth([[22, 60], [11, 60.4], [6, 55], [5.4, 47], [8, 40.4]], 3);
        d.tube(tail, 3.2, 2.6, NY.Y);
        for (const t of [0.52, 0.63]) band(d, tail, t, 1.2, 4.2, NY.P);
        d.tube(part(tail, 0.74, 1), 2.8, 3.4, NY.P, { shiny: true });
        V.nyaromon.ears(d, true); V.nyaromon.head(d);
        eyes(d, 45.6, 6.6, 4.6, 5.4, '#a42a1a');
        d.deco.curve([[28, 53.4], [30, 55.6], [32, 53.6], [34, 55.6], [36, 53.4]], 0.9, NY.K, { unlit: true });
      },
      // la queue part du bas du dos et remonte vers nous en crosse
      back(d) {
        V.nyaromon.ears(d, false); V.nyaromon.head(d);
        const tail = smooth([[32, 60.6], [36.6, 58], [41.6, 53], [44.4, 46], [43, 40]], 3);
        d.tube(tail, 3.4, 2.8, NY.Y);
        for (const t of [0.42, 0.56]) band(d, tail, t, 1.2, 3, NY.P);
        d.tube(part(tail, 0.7, 1), 2.8, 3.6, NY.P, { shiny: true });
      },
    },
    salamon: {
      body(d) {
        // pattes arrière (derrière, plus écartées), corps, pattes avant, collier doré (l'anneau sacré)
        for (const s of [-1, 1]) { d.tube([[32 + s * 10, 50], [32 + s * 10.6, 57.4]], 5.6, 5.2, SA.Wd, { far: true }); d.ell(32 + s * 11, 59.8, 4.2, 2.6, SA.Wd, 0, { far: true }); }
        d.ell(32, 47.6, 12, 8.6, SA.W, 0, { shiny: true });
        for (const s of [-1, 1]) { d.tube([[32 + s * 5.4, 51], [32 + s * 5.8, 57.6]], 6.6, 6.2, SA.W); d.ell(32 + s * 6.2, 59.8, 4.8, 2.8, SA.W); }
        d.tube(smooth([[21.4, 36.4], [26, 40.4], [32, 41.6], [38, 40.4], [42.6, 36.4]], 2), 3.8, 3.8, SA.G, { shiny: true });
        for (const x of [27.4, 32, 36.6]) d.deco.line(x, 40, x, 43, 0.5, SA.Gd);
        d.blob(sym([[32, 8.6], [24, 9.8], [18.6, 15], [17, 23], [18.6, 31.6], [24.4, 36.6], [32, 37.8]]), SA.W, { shiny: true });
      },
      // les deux grandes oreilles pendent de chaque côté de la tête
      ears(d) {
        const ear = [[21.6, 11], [27, 10.4], [24.6, 16.6], [21.6, 24], [20.6, 33], [20.6, 41], [17.6, 45.4], [13.6, 43], [13, 34], [14.4, 24], [17, 15.6]];
        for (const e of [ear, mir(ear)]) d.blob(e, SA.E, { shiny: true, round: 0.5 });
        for (const s of [-1, 1]) d.deco.curve([[32 + s * 10.6, 17], [32 + s * 13.4, 28], [32 + s * 14.4, 40]], 0.8, SA.Ed);
      },
      front(d) {
        V.salamon.body(d); V.salamon.ears(d);
        eyes(d, 23.6, 6, 3.4, 4.2, '#3a7ad8');
        pair(d, 30.6, 9.4, 2.2, 1.4, '#f4a6b6');
        d.deco.poly([[30.8, 28.6], [33.2, 28.6], [32, 30.2]], '#9a5a5a', { unlit: true });
        d.deco.curve([[30, 31.8], [32, 32.8], [34, 31.8]], 0.7, '#8a4a4a', { unlit: true });
      },
      back(d) { V.salamon.body(d); V.salamon.ears(d); },
    },
    gatomon: {
      // queue rayée de violet, anneau sacré, touffe violette au bout
      tail(d, pts) {
        d.tube(pts, 3, 2.4, GA.W);
        for (const t of [0.3, 0.42, 0.54, 0.66, 0.78]) band(d, pts, t, 1.2, 2.8, GA.Pu);
        holyRing(d, pts, 0.88, 2.6, 4.4);
        const e = at(pts, 0.96); tuft(d, e.x, e.y, Math.atan2(e.dy, e.dx), 6.6, 3, 1.1, GA.Pu, { base: 2.4, w: 2.6, knot: true });
      },
      ears(d, front) {
        const ear = [[23.6, 24], [19.4, 15], [15.6, 7.6], [23.4, 11], [30.4, 17.6]];
        for (const e of [ear, mir(ear)]) d.poly(e, GA.W);
        if (front) { const inner = [[23.4, 20.4], [18.6, 11.6], [27.4, 15.6]]; for (const e of [inner, mir(inner)]) d.deco.poly(e, GA.Pk); }
        tuft(d, 16.6, 9.2, -2.2, 7, 3, 1.1, GA.Pu, { base: 2.4, w: 2.6, knot: true });
        tuft(d, 47.4, 9.2, -0.94, 7, 3, 1.1, GA.Pu, { base: 2.4, w: 2.6, knot: true });
      },
      body(d) {
        for (const s of [-1, 1]) { d.tube([[32 + s * 4.6, 51], [32 + s * 5.4, 57.4]], 6, 5.4, GA.W); d.ell(32 + s * 6.2, 59.8, 5, 2.8, GA.W); }
        d.blob(sym([[32, 37], [26, 38.4], [23, 45], [25, 53], [32, 55.6]]), GA.W, { shiny: true });
        // bras et gants jaunes rayés de rouge, griffes noires vers le bas
        for (const s of [-1, 1]) {
          d.tube([[32 + s * 6.6, 40.6], [32 + s * 11, 45]], 3.8, 3.4, GA.W);
          d.ell(32 + s * 13, 48.4, 4.2, 4.6, GA.Y, 0, { shiny: true });
          d.deco.line(32 + s * 10.6, 45.6, 32 + s * 15, 46.6, 1, GA.R); d.deco.line(32 + s * 10.6, 48.6, 32 + s * 15.4, 49.4, 1, GA.R);
          for (let i = -1; i <= 1; i++) d.tube([[32 + s * (13 + i * 1.6), 52], [32 + s * (13.4 + i * 2), 55], [32 + s * (14.6 + i * 2.4), 57.4]], 1.8, 0.3, GA.K, { shiny: true });
        }
        d.blob(sym([[32, 15.4], [24.4, 16.8], [19.6, 22], [18.6, 29.4], [21.4, 36], [27, 39.6], [32, 40.2]]), GA.W, { shiny: true });
      },
      front(d) {
        V.gatomon.tail(d, smooth([[26, 52], [17, 51], [11.6, 45], [10.4, 37], [11.6, 30], [10.4, 24]], 3));   // derrière, à gauche
        V.gatomon.ears(d, true); V.gatomon.body(d);
        eyes(d, 28.4, 5.6, 3.6, 4.4, '#3c9ae8');
        d.deco.poly([[30.8, 33], [33.2, 33], [32, 34.4]], '#e07890', { unlit: true });
        d.deco.curve([[29.4, 35.4], [30.7, 36.6], [32, 35.6], [33.3, 36.6], [34.6, 35.4]], 0.6, '#3a2a3a', { unlit: true });
        for (const s of [-1, 1]) for (const [y0, y1] of [[33.6, 32.4], [35, 35], [36.4, 37.6]]) d.deco.line(32 + s * 6.4, y0, 32 + s * 13, y1, 0.4, '#6a6a7a');
      },
      // la queue part du bas du dos et se dresse
      back(d) {
        V.gatomon.ears(d, false); V.gatomon.body(d);
        V.gatomon.tail(d, smooth([[32, 52], [36.6, 48], [40, 41], [41, 32], [39, 24], [41.6, 16]], 3));
      },
    },
  };
  // branchement : le dessin d'origine reste le profil ; param.view choisit la vue
  for (const sp in V) {
    const base = DW.DRAW[sp], v = V[sp];
    const f = function (d, p = {}) {
      if (p.view === 'front') return v.front(d, p);
      if (p.view === 'back') return v.back(d, p);
      return base(d, p);
    };
    f.views = ['front', 'back'];
    DW.DRAW[sp] = f;
  }

  // poses de combat (gfx/sprites.js) : penché en avant pour attaquer, en arrière quand il est touché ; décalage (et
  // inclinaison) mesurés pour que rien ne sorte du cadre (queue, oreilles, ailes, lance, museau)
  DW.DRAW.nyaromon.poses = { hurt: { dx: 2.6 } };
  DW.DRAW.salamon.poses = { attack: { dx: -2.6 } };
  DW.DRAW.gatomon.poses = { attack: { dx: -2.6 }, hurt: { dx: 4.6 } };
  DW.DRAW.angewomon.poses = { hurt: { dx: 4.6 } };
  DW.DRAW.ophanimon.poses = { attack: { dx: -4.1 }, hurt: { dx: 3.1 } };
  DW.DRAW.magnadramon.poses = { attack: { shear: 0.13, dx: -3.6 }, hurt: { dx: 1.1 } };
})();
