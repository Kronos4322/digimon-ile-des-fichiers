'use strict';
// =====================================================================
//  DESSINS — compléments de lignées (saison 1), d'après les modèles officiels (proportions et couleurs) :
//  Pyocomon (Entraînement, lignée de Biyomon), MegaKabuterimon rouge (AtlurKabuterimon, Ultime de Kabuterimon),
//  MagnaAngemon (HolyAngemon, Ultime d'Angemon), Omegamon (Omnimon, Méga : fusion de WarGreymon et MetalGarurumon).
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
// =====================================================================
(function () {
  // bras d'insecte cuirassé : épaule → coude (articulation sombre) → main sombre à trois longues griffes recourbées
  const insectArm = (d, s, e, h, col, claw, far, joint) => {
    d.tube([s, e], 6, 5, col, { far, shiny: !far });
    d.tube([e, h], 5.2, 4.2, col, { far, shiny: !far });
    d.circ(e[0], e[1], 2.2, joint || claw, { far });
    const a0 = Math.atan2(h[1] - e[1], h[0] - e[0]);
    d.ell(h[0], h[1], 2.6, 2.3, claw, a0, { far, shiny: true });
    for (let i = -1; i <= 1; i++) {
      const a = a0 + i * 0.5, x1 = h[0] + Math.cos(a) * 3.4, y1 = h[1] + Math.sin(a) * 3.4;
      d.tube([[h[0], h[1]], [x1, y1], [x1 + Math.cos(a + 0.6) * 2.6, y1 + Math.sin(a + 0.6) * 2.6]], 1.8, 0.3, claw, { shiny: true, far });
    }
  };
  // plume (aile en lame de plume) : racine (x, y), direction a, longueur L, largeur w ; o.bend = courbure, o.vein = nervure
  const plume = (d, x, y, a, L, w, col, o = {}) => {
    const c = Math.cos(a), s = Math.sin(a), px = -s, py = c, b = o.bend != null ? o.bend : 1.6;
    const at = (t, side, k) => { const bb = b * Math.sin(t * Math.PI); return [x + c * L * t + px * (side * w * k + bb), y + s * L * t + py * (side * w * k + bb)]; };
    d.poly([at(0, 1, 0.3), at(0.35, 1, 0.5), at(0.75, 1, 0.34), at(1, 0, 0), at(0.75, -1, 0.34), at(0.35, -1, 0.5), at(0, -1, 0.3)], col, { far: o.far, shiny: !o.far });
    if (o.vein) d.deco.curve([at(0.08, 0, 0), at(0.5, 0, 0), at(0.88, 0, 0)], 0.6, o.vein);
  };

  Object.assign(DW.DRAW, {

    // ---------------------------------------------------------- Entraînement : Pyocomon, petite boule rose-pêche,
    // fleur bleu-violet sur la tête, yeux noirs brillants, petits pieds jaune orangé (deviendra Biyomon)
    // (vues de face et de dos pour la carte : param.view, gfx/sprites.js ; symétriques autour de x = 32)
    pyocomon(d, p = {}) {
      const P = '#f7aa92', Pl = '#ffd6c6', Ft = '#f2ac3c', Ftd = '#c87c1e', B = '#8070ee', Bd = '#4c3cc0', Bl = '#c4baff', Y = '#ffd84e', G = '#4aa84a', K = '#24161e';
      // fleur à cinq pétales autour de C (pétales du fond d'abord) ; de dos : revers des pétales et sépales verts
      const fleur = (C, angles, dos) => {
        const L = 9.4;
        for (const a of angles) {
          const vx = Math.cos(a), vy = Math.sin(a) * 0.7, n = Math.hypot(vx, vy);
          d.ell(C[0] + vx * L * 0.5, C[1] + vy * L * 0.5, n * L * 0.5 + 0.8, 3, dos ? '#6a5ad8' : B, Math.atan2(vy, vx), { shiny: true });
          d.deco.line(C[0] + vx * L * 0.2, C[1] + vy * L * 0.2, C[0] + vx * L * 0.8, C[1] + vy * L * 0.8, 0.6, Bd);
        }
        if (dos) { for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * 1.2566; d.deco.poly([[C[0], C[1]], [C[0] + Math.cos(a - 0.3) * 3, C[1] + Math.sin(a - 0.3) * 2.2], [C[0] + Math.cos(a) * 5, C[1] + Math.sin(a) * 3.6], [C[0] + Math.cos(a + 0.3) * 3, C[1] + Math.sin(a + 0.3) * 2.2]], G); } return; }
        d.deco.ell(C[0], C[1], 4.4, 3.2, Bl);
        d.circ(C[0], C[1] + 0.2, 2.4, Y, { shiny: true });
        d.deco.circ(C[0] + 0.6, C[1] + 0.6, 0.8, '#f08a2a', { unlit: true });
      };
      // yeux noirs brillants (un grand reflet, un petit)
      const oeil = (x, y, rx, ry) => {
        d.deco.ell(x, y, rx, ry, K, 0, { unlit: true });
        d.deco.ell(x + rx * 0.3, y - ry * 0.38, rx * 0.42, ry * 0.34, '#ffffff', 0, { unlit: true });
        d.deco.circ(x - rx * 0.32, y + ry * 0.45, Math.max(0.5, rx * 0.2), '#ffffff', { unlit: true });
      };
      if (p.view === 'front' || p.view === 'back') {
        const face = p.view === 'front';
        d.tube([[32, 33], [32, 27]], 2.6, 2.2, G);
        d.ell(27.4, 30.2, 3.8, 1.7, G, -0.45); d.ell(36.6, 30.2, 3.8, 1.7, G, 0.45);
        d.ell(32, 45.6, 15.6, 14.6, P);
        if (face) d.deco.ell(32, 51.4, 9.6, 6.4, Pl);
        d.deco.ell(face ? 24.6 : 39.4, 38, 3.6, 2.2, '#fff2ea', face ? -0.7 : 0.7, { unlit: true });
        for (const s of [-1, 1]) {
          d.ell(32 + s * 6.6, 60.2, 4.6, 2.4, Ft, 0, { shiny: true });
          d.deco.line(32 + s * 6.6 - 1.6, 59.4, 32 + s * 6.6 - 2, 62, 0.5, Ftd); d.deco.line(32 + s * 6.6 + 1.6, 59.4, 32 + s * 6.6 + 2, 62, 0.5, Ftd);
        }
        // pétales du haut, puis du bas (de dos, la fleur est vue par-derrière)
        fleur([32, 23.6], [-1.5708, -2.8274, -0.3142, 2.1991, 0.9425], !face);
        if (face) {
          oeil(26.6, 44.6, 2.6, 3.6); oeil(37.4, 44.6, 2.6, 3.6);
          d.deco.ell(32, 51.6, 2.2, 1.6, '#a8243a', 0, { unlit: true }); d.deco.ell(32, 52.4, 1.3, 0.7, '#f27a8c', 0, { unlit: true });
          d.deco.ell(22.6, 49.6, 2.4, 1.4, '#f58080'); d.deco.ell(41.4, 49.6, 2.4, 1.4, '#f58080');
        }
        return;
      }
      // pied éloigné
      d.ell(38.6, 59.8, 4.4, 2.4, Ftd, 0, { far: true });
      // petite tige et deux feuilles (sépales) au sommet de la tête
      d.tube([[31, 33], [31, 27]], 2.6, 2.2, G);
      d.ell(35.4, 29.8, 3.6, 1.6, '#3a8a3a', 0.45, { far: true }); d.ell(26.6, 30.2, 3.8, 1.7, G, -0.45);
      // corps : boule rose-pêche, ventre plus clair, reflet
      d.ell(31, 45.6, 15.6, 14.6, P);
      d.deco.ell(35.5, 51, 9, 6.4, Pl, -0.1);
      d.deco.ell(23.4, 38, 3.8, 2.2, '#fff2ea', -0.7, { unlit: true });
      // pied proche (trois petits orteils)
      d.ell(26, 60.2, 5, 2.5, Ft, 0, { shiny: true });
      d.deco.line(24.2, 59.4, 23.8, 62, 0.5, Ftd); d.deco.line(27.6, 59.4, 28, 62, 0.5, Ftd);
      // fleur bleu-violet à cinq pétales (vue un peu de dessus), cœur jaune ; d'abord les pétales du fond, puis ceux de devant
      fleur([31.2, 23.6], [-1.42, -2.68, -0.16, 2.35, 1.09], false);
      // yeux noirs brillants
      oeil(36.4, 44.6, 2.7, 3.7); oeil(43.4, 45, 2.2, 3.3);
      // petite bouche ouverte, joues roses
      d.deco.ell(40.4, 52, 2.2, 1.6, '#a8243a', 0, { unlit: true }); d.deco.ell(40.6, 52.8, 1.3, 0.7, '#f27a8c', 0, { unlit: true });
      d.deco.ell(31, 50, 2.8, 1.5, '#f58080'); d.deco.ell(47.6, 50, 1.6, 1.2, '#f58080');
    },

    // ---------------------------------------------------------- Ultime : MegaKabuterimon (AtlurKabuterimon rouge),
    // énorme scarabée rouge : carapace en dôme, grande corne fourchue, quatre bras, ailes membraneuses pâles
    megakabuterimon(d) {
      const R = '#d62a2e', Rd = '#961820', Rl = '#f47062', Rs = '#a81c26', Rh = '#c41e24', K = '#2c2632', Wg = '#e8f2ee', Wv = '#9aaaa4', E = '#48dcff';
      // ailes membraneuses pâles (deux paires), déployées derrière la carapace
      d.ell(14, 16, 5.6, 14, Wg, -1, { far: true });
      d.deco.curve([[4, 9.4], [13, 15.4], [23, 22.6]], 0.6, Wv); d.deco.curve([[8, 15.6], [14, 18], [20, 23]], 0.5, Wv);
      d.ell(22.4, 13.8, 5.2, 11.8, Wg, -0.36, { far: true });
      d.deco.curve([[18.6, 3.4], [22, 13], [26.4, 23]], 0.6, Wv); d.deco.curve([[20.6, 9], [24.6, 15], [27, 21]], 0.5, Wv);
      // bras et jambe éloignés
      insectArm(d, [41, 29], [48, 32.6], [56, 29.6], Rd, K, true, '#6a1016');
      insectArm(d, [39, 40], [45.4, 45], [53, 46.4], Rd, K, true, '#6a1016');
      d.tube([[35, 49], [37.6, 55], [39.6, 58.4]], 7, 5.6, Rd, { far: true });
      d.ell(42, 60.2, 4.6, 2.2, K, 0, { far: true });
      for (let i = 0; i < 3; i++) d.tube([[42 + i * 2, 60], [44.6 + i * 2.2, 61.2], [46 + i * 2.2, 62.4]], 1.5, 0.4, K, { far: true });
      // carapace (élytres) : grand dôme rouge laqué sur le dos, bord sombre
      d.blob([[34, 13], [22, 11], [11, 17], [5, 29], [5, 42], [10, 51], [19, 57], [28, 56], [33, 46], [36, 30]], R, { shiny: true });
      d.deco.curve([[31, 14.4], [20, 14.8], [11.6, 22], [8, 33]], 2.2, Rl);
      d.deco.ell(14, 26, 2.6, 4.6, '#ffc8bc', 0.5, { unlit: true });
      d.deco.curve([[7.4, 43], [12, 51], [20, 55.4], [28, 54.6]], 1.4, Rd);
      d.deco.curve([[33, 15], [27, 25], [25, 40], [28, 52]], 0.9, Rd);   // jointure des élytres
      // corps : dessous annelé rouge sombre
      d.blob([[32, 24], [43, 25], [47, 34], [45, 44], [40, 51], [33, 53], [29, 46], [30, 32]], Rs, { shiny: true });
      for (let k = 0; k < 5; k++) d.deco.curve([[31.4, 31 + k * 4.4], [38, 32 + k * 4], [45.4, 31 + k * 3.6]], 0.8, Rd);
      // jambe proche : cuisse rouge, pied sombre à trois griffes
      d.tube([[29.6, 48], [28.6, 54.6], [29.4, 58]], 8.4, 6.6, R, { shiny: true });
      d.ell(32, 60, 5.4, 2.6, K, 0, { shiny: true });
      for (let i = 0; i < 3; i++) d.tube([[32 + i * 2.2, 59.8], [35 + i * 2.4, 61], [36.6 + i * 2.4, 62.4]], 1.7, 0.4, K, { shiny: true });
      // thorax (pronotum) : plaque bombée entre la carapace et la tête
      d.blob([[32, 14], [41, 12.4], [47.4, 16.6], [47, 23], [40, 25.6], [33, 22]], R, { shiny: true });
      d.deco.curve([[35, 15.4], [41, 14.4], [45.6, 17.4]], 1, Rl);
      // tête : plaque frontale, œil bleu lumineux, mandibules en pinces
      d.ell(50, 24.6, 7.4, 6.2, R, 0.15, { shiny: true });
      d.deco.blob([[49.4, 27.2], [56.6, 23.6], [57.4, 29], [51.4, 30.6]], K);
      d.deco.ell(52.2, 22.4, 2.6, 2, '#14202a', -0.3, { unlit: true }); d.deco.ell(52.4, 22.4, 1.9, 1.4, E, -0.3, { unlit: true });
      d.deco.circ(53, 21.9, 0.6, '#ffffff', { unlit: true });
      d.tube([[55.2, 28.8], [58.8, 29.2], [60.2, 32.2]], 2.4, 0.4, K, { shiny: true });
      d.tube([[53.2, 30.2], [55.8, 32.2], [56.2, 34.6]], 2.2, 0.4, K, { shiny: true, far: true });
      // grande corne recourbée vers le haut, fourchue au bout
      d.poly([[45.4, 21], [46.6, 13], [49.6, 7.6], [53, 4.2], [55.4, 1.6], [57, 4.6], [60.6, 3.2], [57.6, 7.8], [54.8, 12.8], [53.4, 21]], Rh, { shiny: true, round: 0.6 });
      d.deco.curve([[47.6, 15], [50.4, 9], [54, 5.2]], 0.9, Rl);
      // bras proches
      insectArm(d, [37.6, 31], [43.4, 38.6], [52.4, 40.2], R, K, false, Rd);
      insectArm(d, [35.4, 42], [39.4, 49.6], [47.2, 53.6], R, K, false, Rd);
    },

    // ---------------------------------------------------------- Ultime : MagnaAngemon (HolyAngemon), ange en armure
    // violette et blanche, casque fermé à visière, huit ailes dorées, Excalibur (lame de lumière) au poignet droit
    magnaangemon(d) {
      const Pu = '#6e46b8', Pud = '#47297e', W = '#f6f4fb', Wd = '#cfc9de', Si = '#e4e6f0', Go = '#f4c43a', God = '#c08818', Sk = '#f2cba6', Bl = '#eaf6ff', Blc = '#8ad4ff';
      // huit ailes dorées : quatre de l'autre côté (plus sombres), quatre de ce côté
      for (const [a, L] of [[-2.15, 20], [-2.5, 26], [-2.85, 27], [3.08, 25]]) plume(d, 29, 18.5, a, L, 6, God, { far: true });
      for (const [a, L] of [[-2.3, 24], [-2.65, 26], [-3.0, 25], [2.9, 23]]) plume(d, 27, 20, a, L, 6.6, Go, { vein: God });
      // bras éloigné, le long du corps
      d.tube([[28, 20], [25, 28], [26, 34]], 4.6, 4, Wd, { far: true });
      d.tube([[26, 31], [26.5, 37]], 5, 4.6, Pud, { far: true });
      d.ell(27, 38.6, 2.4, 2.4, Sk, 0, { far: true });
      // jambe éloignée : jambière et soleret violets
      d.tube([[34, 46], [35, 52], [36, 58]], 6, 5, Pud, { far: true });
      d.ell(38.2, 60.4, 4.6, 2.2, Pud, 0, { far: true });
      // corps : tunique blanche, plastron violet bordé d'or, ceinture
      d.blob([[25, 16], [38, 15], [41, 24], [39, 34], [37, 41], [27, 41], [24, 32], [23, 22]], W, { shiny: true });
      d.blob([[25, 17], [38, 16], [41, 22], [39.6, 29], [27, 30], [24, 24]], Pu, { shiny: true });
      d.deco.curve([[25, 29], [33, 30], [39.6, 28.6]], 1, Go);
      d.deco.poly([[34.6, 20], [36.6, 23.4], [34.6, 26.8], [32.6, 23.4]], Go);
      d.deco.circ(34.6, 23.4, 0.8, Pud);
      d.rect(25, 36, 14, 3.4, Pud, { round: 0.4 }); d.deco.rect(30.6, 36.2, 3.4, 3, Go);
      // pagne blanc et pan violet
      d.poly([[25, 39], [39, 39], [41, 50], [37, 49], [33, 52], [29, 49], [24, 50]], W);
      d.deco.line(27, 41, 26.4, 49, 0.6, Wd); d.deco.line(38, 41, 39, 49, 0.6, Wd);
      d.poly([[30, 39], [36, 39], [35.6, 52], [33, 54], [30.4, 52]], Pu, { shiny: true });
      d.deco.line(33, 41, 33, 52, 0.7, Go);
      // jambe proche : jambière violette, genouillère dorée, soleret
      d.tube([[29, 48], [28.4, 53], [28.4, 58]], 6.4, 5.6, Pu, { shiny: true });
      d.ell(28.8, 51.4, 2.6, 2, Go, 0, { shiny: true });
      d.ell(30.6, 60.6, 5.4, 2.2, Pu, 0, { shiny: true });
      d.deco.ell(34.6, 60.6, 1.4, 1.2, Go);
      // épaulière violette bordée d'or
      d.ell(36, 18.6, 6.6, 4.8, Pu, -0.25, { shiny: true });
      d.deco.curve([[30, 21], [36, 22.6], [42, 19.6]], 1, Go);
      // tête : gorgerin violet, menton, casque fermé argenté à crête violette, visière sombre
      d.tube([[35, 17], [37, 12.6]], 4.6, 4.2, Pud);
      d.ell(43.4, 12.2, 3.4, 2.6, Sk);
      d.deco.curve([[44, 13.2], [46, 13]], 0.6, '#a0604a', { unlit: true });
      d.blob([[33.4, 10], [34, 4], [38.6, 1.8], [44, 2.4], [47, 6], [47.6, 10.6], [44, 11], [41, 12], [38, 14.6], [34.4, 13.4]], Si, { shiny: true });
      d.deco.curve([[45, 3.6], [40, 2.8], [35.4, 5.6], [34.6, 10]], 1.8, Pu);
      d.deco.curve([[40.6, 8], [47.4, 8.4]], 1.4, '#2a2440', { unlit: true });
      d.deco.poly([[37, 7], [40, 9.6], [36.4, 11.4]], Pu);   // garde de joue
      // bras proche levé, Excalibur au poignet
      d.tube([[36, 19], [42, 26]], 4.6, 4, W, { shiny: true });
      d.tube([[42, 26], [48.6, 23]], 4.4, 4, W, { shiny: true });
      d.tube([[50.4, 22.2], [56.4, 15.4], [61.4, 9.8]], 3, 1, Bl, { shiny: true });
      d.deco.line(51.6, 20.8, 60.6, 10.6, 0.7, Blc, { unlit: true });
      d.tube([[45, 24.6], [50.4, 22.2]], 5.6, 5.2, Pu, { shiny: true });
      d.deco.line(45.6, 23, 47, 26.6, 0.8, Go);
      d.ell(51.2, 22.8, 2.4, 2.4, Sk, 0, { shiny: true });
    },

    // ---------------------------------------------------------- Méga : Omegamon (Omnimon), chevalier blanc à cape rouge ;
    // bras gauche : tête de WarGreymon (orange, casque argenté) ; bras droit : tête de MetalGarurumon (bleue)
    omegamon(d) {
      const W = '#f4f4f8', Wd = '#c4c6d6', Go = '#f2c230', R = '#d42a2a', Rd = '#9a1a1e', Bk = '#3c3c56', Bu = '#3a5ab8';
      const O = '#f2902e', Si = '#c8d0dc', Sil = '#eef2f8', M = '#4a5aa8', Gm = '#e8c040';
      // cape rouge (doublure) qui flotte derrière, bord blanc
      d.blob([[24, 14], [15, 18], [8, 28], [4, 42], [3, 54], [5, 61], [11, 58], [16, 61], [22, 58], [27, 60], [29, 44], [30, 20]], R, { shiny: true });
      d.deco.curve([[19, 20], [12, 34], [9, 52]], 1, Rd); d.deco.curve([[24, 22], [20, 38], [17, 56]], 1, Rd);
      d.deco.tube([[25, 15], [16, 19], [10, 28], [6.6, 38]], 3, 1.6, W);
      // bras gauche (de l'autre côté) levé : tête de WarGreymon (museau orange, casque argenté à trois cornes, œil vert)
      d.tube([[29, 20], [38, 21], [45.4, 18.6]], 5, 4.6, Wd, { far: true });
      d.ell(52.6, 18.4, 6.6, 3.4, O, 0.06);
      d.ell(51.8, 21.2, 5, 1.7, O, 0.12, { noline: true });
      d.deco.curve([[46.6, 20.2], [52.6, 20.6], [58.8, 19.2]], 0.8, '#5a2200', { unlit: true });
      for (let i = 0; i < 3; i++) d.deco.poly([[52 + i * 2.4, 20.4 - i * 0.2], [52.8 + i * 2.4, 21.8 - i * 0.2], [53.6 + i * 2.4, 20.3 - i * 0.2]], '#ffffff', { unlit: true });
      d.poly([[44.4, 17], [46.4, 11.6], [52.4, 10.6], [58, 13.4], [59.4, 16.6], [53, 16.4], [47.6, 18]], Si, { shiny: true, round: 0.4 });
      d.deco.ell(52, 14.4, 1.5, 1.1, '#121a10', 0, { unlit: true }); d.deco.ell(52.4, 14.4, 0.8, 0.7, '#4ae070', 0, { unlit: true });
      d.poly([[48.4, 11.8], [50.4, 6.4], [52.6, 11.2]], Sil, { shiny: true });
      d.tube([[57, 13.6], [60, 10.8], [61.8, 10]], 2.2, 0.5, Sil, { shiny: true });
      d.tube([[46.2, 12.8], [43.4, 9.4], [41.8, 7.6]], 2.2, 0.5, Sil, { shiny: true });
      // jambe éloignée
      d.tube([[34, 44], [35.6, 51], [36.6, 57.6]], 7, 6, Wd, { far: true });
      d.ell(39, 60, 5.8, 2.6, Wd, 0, { far: true });
      // corps : taille sombre annelée, plastron blanc bordé d'or, hanches blindées
      d.blob([[28, 30], [37, 30], [36.4, 38], [28.6, 38]], Bk);
      for (const y of [33, 35.6]) d.deco.line(28.4, y, 36.6, y, 0.6, '#64648a');
      d.blob([[23, 16], [36, 14.6], [41, 22], [39, 31], [27, 32], [23, 26]], W, { shiny: true });
      d.deco.curve([[26, 17], [32, 24], [39.6, 17.6]], 1.2, Go);
      d.deco.circ(32.6, 26.4, 1.8, Bu, { unlit: true }); d.deco.circ(32.2, 26, 0.6, '#a8c8ff', { unlit: true });
      d.blob([[24.6, 37], [38.6, 37], [41.4, 45], [33, 47], [24.4, 45.6]], W, { shiny: true });
      d.deco.line(25, 38.4, 39.4, 38.4, 1.2, Go);
      // jambe proche : genouillère dorée, botte blanche à pointe dorée
      d.tube([[28, 44], [27.4, 51]], 7.4, 6.6, W, { shiny: true });
      d.tube([[27.4, 51], [27.6, 58]], 6.8, 6.2, W, { shiny: true });
      d.ell(27.6, 51, 3.4, 2.6, Go, 0, { shiny: true });
      d.ell(30.6, 60, 7, 2.8, W, 0, { shiny: true });
      d.deco.ell(35.4, 60.2, 2.2, 1.6, Go);
      // épaulière éloignée (en partie cachée)
      d.ell(27.4, 17.4, 4.8, 3.6, Wd, 0.2, { far: true });
      // tête : cou sombre, casque blanc, cornes vers l'arrière, crête dorée en V, visage sombre à l'œil vert
      d.tube([[34, 13], [33.4, 17]], 4.4, 4.4, Bk);
      d.tube([[34, 8.4], [29, 4.6], [24.6, 3.6]], 3.2, 0.6, W, { shiny: true });
      d.ell(35.6, 9.6, 5.4, 6, W, 0, { shiny: true });
      d.deco.poly([[37.6, 8], [41, 8.6], [40.4, 13.6], [36.6, 13.4]], Bk);
      d.deco.ell(39, 10, 1.3, 0.8, '#4ae070', 0, { unlit: true });
      d.poly([[36.6, 6], [39.2, 1.6], [39.6, 6.6]], Go, { shiny: true });
      d.poly([[35, 5.6], [34.6, 1.8], [37.4, 5]], Go, { shiny: true, far: true });
      // épaulière proche, pointe dorée
      d.ell(35.6, 19.6, 7.2, 5.2, W, -0.25, { shiny: true });
      d.deco.curve([[29, 21.6], [35.6, 23.6], [42, 19.4]], 1.1, Go);
      d.poly([[33, 15.4], [36.4, 10.6], [38.6, 15.2]], Go, { shiny: true });
      // bras droit (de ce côté) : tête de MetalGarurumon (bleu métal, corne dorée, œil rouge, crocs)
      d.tube([[35, 23], [39, 30], [45, 34]], 5.4, 5, W, { shiny: true });
      d.poly([[47.6, 32.6], [46.4, 26.4], [51.6, 31]], M, { shiny: true });
      d.blob([[44, 36], [48, 31.4], [55, 30.4], [61, 33], [63, 37], [60, 40.6], [52, 41.4], [46, 40]], M, { shiny: true });
      d.deco.poly([[48.6, 33], [58, 32.2], [59.6, 35.4], [49.4, 36]], '#1a1a3a');
      d.deco.ell(55, 34, 2, 1, '#e83a2a', 0, { unlit: true }); d.deco.circ(55.4, 33.8, 0.5, '#ffffff', { unlit: true });
      d.tube([[51, 31.4], [54, 27], [58, 24.6]], 2, 0.4, Gm, { shiny: true });
      d.deco.curve([[50, 39], [56, 39.4], [62.4, 37.8]], 0.9, '#1a1a3a', { unlit: true });
      for (let i = 0; i < 3; i++) d.poly([[52 + i * 3.4, 39.4], [53.2 + i * 3.4, 41.6], [54.4 + i * 3.4, 39.2]], '#ffffff');
    },
  });

  // Pyocomon a de vraies vues de face et de dos (carte : gfx/sprites.js)
  DW.DRAW.pyocomon.views = ['front', 'back'];
  // Poses de combat : ces grands dessins touchent les bords du cadre. En attaque on penche moins et on recule (corne,
  // lame d'Excalibur, têtes des bras d'Omegamon) ; en recul on penche moins et on avance (ailes) : rien n'est coupé.
  DW.DRAW.megakabuterimon.poses = { attack: { shear: 0.08, dx: -3 }, hurt: { shear: -0.06, dx: 2.5 } };
  DW.DRAW.magnaangemon.poses = { attack: { shear: 0.08, dx: -3.5 }, hurt: { shear: -0.06, dx: 3 } };
  DW.DRAW.omegamon.poses = { attack: { shear: 0.06, dx: -2.5 } };
})();
