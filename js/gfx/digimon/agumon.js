'use strict';
// =====================================================================
//  DESSINS — LIGNÉE D'AGUMON (Botamon → Agumon → Greymon → MetalGreymon → WarGreymon ; Koromon : images du joueur,
//  gfx/sprites.js), version détaillée fidèle aux modèles officiels
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
// =====================================================================
(function () {
  const CLAW = '#f6f2e6', CLAWd = '#c8c0aa';
  // trois griffes en éventail (x, y = base ; ang = direction ; l = longueur)
  const claws = (d, x, y, l, o = {}) => {
    const col = o.col || CLAW, sp = o.spread || 2.2, ang = o.ang || 0;
    for (let i = -1; i <= 1; i++) {
      const a = ang + i * 0.38, by = y + i * sp;
      d.tube([[x, by], [x + Math.cos(a) * l * 0.6, by + Math.sin(a) * l * 0.6 - 0.6], [x + Math.cos(a + 0.3) * l, by + Math.sin(a + 0.3) * l]], o.w || 1.8, 0.4, col, { shiny: true, far: o.far });
    }
  };
  // orteils griffus au sol
  const toes = (d, x, y, n = 3, o = {}) => {
    const s = o.size || 1;
    for (let i = 0; i < n; i++) d.poly([[x + i * 3.2 * s, y], [x + (1.6 + i * 3.2) * s, y - 3.8 * s], [x + (2.8 + i * 3.2) * s, y]], o.col || CLAW, { shiny: true, far: o.far });
  };
  // rayure bleue (Greymon, MetalGreymon)
  const stripe = (d, pts, w = 2.4) => d.deco.tube(pts, w, w * 0.55, '#3a5ec8');

  Object.assign(DW.DRAW, {
    // ---------------------------------------------------------- Bébé : boule noire lisse aux oreilles de chat
    botamon(d) {
      const K = '#1e1c26', K2 = '#3a3848', Ks = '#8a8aa0';
      // oreilles de chat
      d.poly([[19, 40], [20.6, 26.4], [29, 34.6]], K, { far: true });
      d.poly([[35, 33.6], [44.6, 26], [45.6, 39]], K);
      d.deco.poly([[38.6, 33.4], [43.4, 29.6], [43.6, 35.4]], K2);
      // corps rond et lisse
      d.ell(32, 47.6, 18.6, 14.6, K, 0, { shiny: true });
      d.ell(32, 59.4, 16, 3, K, 0, { noline: true });
      // reflet satiné
      d.deco.ell(25, 39, 7, 3.6, K2, -0.35);
      d.deco.ell(24, 38, 3, 1.4, Ks, -0.35);
      // fines rayures du pelage (comme des moustaches)
      for (let i = 0; i < 3; i++) { d.deco.line(17, 46 + i * 2.6, 22, 45.4 + i * 2.2, 0.5, K2); d.deco.line(47, 51 + i * 2.2, 51.6, 51.6 + i * 2.6, 0.5, K2); }
      d.deco.line(30, 36, 33, 35.4, 0.5, K2); d.deco.line(31, 38, 34, 37.6, 0.5, K2);
      // yeux jaunes en amande
      d.deco.ell(35.6, 47.4, 3.8, 4.4, '#f8c020', 0.1, { unlit: true });
      d.deco.ell(46.4, 47.8, 3.3, 4, '#f8c020', -0.1, { unlit: true });
      d.deco.ell(34.6, 46, 1.2, 1.2, '#fff4b0', 0, { unlit: true }); d.deco.ell(45.6, 46.4, 1.1, 1.1, '#fff4b0', 0, { unlit: true });
    },

    // ---------------------------------------------------------- Disciple : Agumon
    agumon(d, p = {}) {
      const Y = '#f8b228', Yd = '#d88a1c', L = '#fcd468', B = '#7a3a12';
      const atk = p.pose === 'attack';
      // queue épaisse qui s'affine
      d.tube([[22, 47], [13, 52], [5, 56], [1, 57]], 11, 1.6, Y);
      d.deco.curve([[16, 49.6], [8, 54.6]], 0.8, Yd);
      // bras éloigné
      d.tube([[26, 34], [22, 40], [24, 44]], 4.8, 3.8, Yd, { far: true });
      claws(d, 25, 44.4, 3.2, { far: true, w: 1.5, ang: 0.4 });
      // jambe éloignée
      d.ell(39, 53, 6.4, 8.4, Yd, 0, { far: true });
      d.ell(42, 60, 7.6, 3, Yd, 0, { far: true });
      toes(d, 45.4, 61.8, 3, { far: true });
      // corps en poire, ventre à peine plus clair
      d.blob([[22, 32], [34, 28], [40, 38], [39, 50], [30, 56], [20, 52], [17, 42]], Y);
      d.deco.blob([[30, 36], [37, 37], [37.6, 48], [32, 53], [28, 48]], L);
      d.deco.curve([[30, 41.4], [36, 42]], 0.6, Yd); d.deco.curve([[30, 45.4], [36.4, 46]], 0.6, Yd);
      d.deco.curve([[18, 38], [21, 34]], 1, '#ffe080');
      // jambe proche (cuisse + gros pied à trois griffes)
      d.ell(25, 52, 7.6, 9.2, Y);
      d.deco.curve([[20, 48], [22, 55]], 0.8, Yd);
      d.ell(28, 60, 9, 3.4, Y);
      toes(d, 30.6, 62.2, 3, { size: 1.1 });
      // tête : crâne rond, long museau
      d.blob([[23, 22], [25, 12], [33, 7.6], [43, 8.6], [50, 13], [60, 18], [62, 25], [56, 31], [42, 32.6], [29, 30]], Y);
      d.deco.blob([[40, 28.6], [58, 26.6], [57, 31], [44, 32.2]], L);
      d.deco.curve([[37, 11.6], [43, 10], [49, 12.6]], 1.4, Yd);
      d.deco.ell(58.4, 20.6, 1.1, 0.8, B, 0, { unlit: true }); d.deco.ell(55.6, 19.4, 0.8, 0.6, B, 0, { unlit: true });
      if (atk) {
        // gueule grande ouverte : la Boule de Feu se prépare
        d.deco.poly([[37, 26.6], [62, 22.6], [61, 33.6], [44, 33]], '#7a1010', { unlit: true });
        d.deco.ell(50, 31, 6, 1.6, '#e85a6a', 0, { unlit: true });
        d.deco.ell(55, 28.2, 4.6, 3, '#ff8a2a', 0, { unlit: true }); d.deco.ell(56, 28, 2.4, 1.6, '#fff0a0', 0, { unlit: true });
        for (let i = 0; i < 4; i++) d.deco.poly([[42 + i * 4.6, 25.6 - i * 0.6], [43.4 + i * 4.6, 28 - i * 0.6], [44.6 + i * 4.6, 25.4 - i * 0.6]], '#ffffff', { unlit: true });
      } else {
        // grand sourire et rangée de dents
        d.deco.curve([[36, 27.4], [47, 29.8], [61, 26]], 1.5, '#5a2000', { unlit: true });
        for (let i = 0; i < 4; i++) d.deco.poly([[44 + i * 4.2, 28.6 - i * 0.4], [45.3 + i * 4.2, 31.4 - i * 0.4], [46.6 + i * 4.2, 28.4 - i * 0.4]], CLAW, { unlit: true });
      }
      // œil vert à iris cerclé
      d.eye(43.4, 16.4, 4.4, 5.2, '#2aa040', { look: 0.36 });
      d.deco.curve([[39.4, 10.6], [46.6, 11.2]], 1.2, '#b8641a', { unlit: true });
      // bras proche replié, trois grandes griffes blanches
      d.tube([[36, 33], [40, 39], [45, 42]], 5.6, 4.6, Y);
      d.deco.curve([[38, 36], [41, 40]], 0.7, Yd);
      claws(d, 45.6, 42.4, 5.6, { w: 2, ang: -0.1, spread: 2.4 });
    },

    // ---------------------------------------------------------- Champion : Greymon, casque brun et cornes
    greymon(d, p = {}) {
      const O = '#f2861e', Od = '#c8661a', Ol = '#f8c070';
      const Hm = '#5a3a26', HmL = '#7a5638', Hd = '#2a1a10', Hn = '#ece4d2';
      // queue puissante zébrée
      d.tube([[18, 43], [9, 49], [3, 54], [0, 58]], 14, 2.6, O);
      stripe(d, [[11, 45.6], [13.6, 51.4]], 2.6); stripe(d, [[7, 49], [9, 54]], 2.2); stripe(d, [[3.4, 53], [5, 56.6]], 1.8); stripe(d, [[1, 55.6], [2, 57.8]], 1.4);
      // jambe et bras éloignés
      d.ell(40, 51, 7, 9.4, Od, 0, { far: true }); d.ell(43, 60, 9.4, 3.2, Od, 0, { far: true });
      toes(d, 46, 61.8, 3, { far: true });
      d.tube([[36, 33], [40, 38], [44, 40]], 5, 4, Od, { far: true });
      claws(d, 44.4, 40.2, 4.4, { far: true, w: 1.6 });
      // torse massif penché vers l'avant
      d.blob([[16, 30], [30, 25], [40, 30], [42, 42], [36, 50], [22, 52], [13, 44]], O);
      d.deco.blob([[30, 32], [39, 34], [40, 44], [34, 50], [28, 44]], Ol);
      for (let i = 0; i < 3; i++) d.deco.curve([[31, 37 + i * 4], [39, 37.6 + i * 4]], 0.7, '#e09a50');
      // nombreuses rayures bleues
      stripe(d, [[16, 28.6], [22, 33.4]], 3); stripe(d, [[13, 34.4], [19.6, 38.4]], 3); stripe(d, [[12.4, 41], [19, 43.4]], 3);
      stripe(d, [[24, 27], [27, 31]], 2.4); stripe(d, [[20, 47.6], [24.6, 49.6]], 2);
      // jambe proche : cuisse musclée zébrée, pied griffu
      d.ell(23, 49, 9.6, 11, O);
      stripe(d, [[16, 44], [23, 47]], 2.6); stripe(d, [[15.4, 50], [21, 52.4]], 2.4); stripe(d, [[18, 55.4], [23, 56.6]], 2);
      d.ell(25, 59.6, 10.4, 3.6, O);
      toes(d, 28.4, 62.2, 3, { size: 1.15 });
      // cou puissant
      d.ell(37, 27, 8.6, 7.4, O, -0.45);
      stripe(d, [[34, 22.6], [37.6, 28]], 2.4);
      // tête : grand crâne + long museau carré (mâchoire de tyrannosaure)
      d.blob([[36, 21], [40, 12], [50, 9.4], [58, 13], [63.4, 19], [63.6, 25.4], [60, 28], [46, 28.6], [39, 27]], O);
      // mâchoire inférieure massive
      d.blob([[40, 27.4], [50, 28], [61, 27.6], [62, 31], [56, 34.4], [45, 34], [40, 31]], O);
      d.deco.blob([[44, 31.6], [58, 30.8], [56, 33.6], [46, 33.6]], Ol);
      stripe(d, [[42, 29], [45, 33]], 1.8); stripe(d, [[39.6, 24.4], [42, 27.6]], 1.6);
      // casque fossile brun : couvre le crâne et le dessus du museau, bords crénelés, trous
      d.poly([[35.4, 20.6], [38.6, 11.6], [46, 6.8], [55, 7.6], [61.6, 13.6], [64, 19.4], [60.4, 20.4], [54, 18.6], [47, 20.4], [41.6, 23.4]], Hm, { shiny: true, round: 0.35 });
      d.deco.curve([[39, 18], [43, 11], [52, 9.2], [60, 14.6]], 1, HmL);
      for (const [x, y] of [[43.4, 13.4], [48.6, 11.4], [54, 11.6]]) d.deco.ell(x, y, 1.3, 0.9, Hd);
      for (let k = 0; k < 5; k++) d.deco.poly([[46 + k * 3.4, 20 - k * 0.3], [47.6 + k * 3.4, 22.4 - k * 0.3], [49.2 + k * 3.4, 19.8 - k * 0.3]], Hm);   // bord crénelé sur la joue
      // corne du nez, pointée vers le haut
      d.tube([[59.6, 13.6], [61, 9], [60.6, 5.6]], 3, 0.5, Hn, { shiny: true });
      // deux grandes cornes à l'arrière du casque, recourbées vers le haut et l'arrière
      d.tube([[44, 8.6], [42.6, 3.6], [39, 0.6], [34.6, 0.2]], 4.4, 0.6, Hn, { shiny: true });
      d.tube([[39.6, 12], [36, 8], [31.6, 6.4], [28, 7.6]], 4, 0.6, Hn, { shiny: true, far: true });
      d.deco.line(42.4, 3.6, 39, 1.4, 0.5, CLAWd);
      // œil vert vif, sourcil du casque au-dessus
      d.deco.ell(50.6, 17.2, 3.6, 2.6, '#1a2010', 0, { unlit: true });
      d.deco.ell(51.2, 17.4, 2.2, 1.8, '#3ac850', 0, { unlit: true });
      d.deco.ell(51.6, 17.6, 0.9, 1.2, '#0a1a08', 0, { unlit: true });
      d.deco.ell(50.6, 16.6, 0.6, 0.5, '#e8fff0', 0, { unlit: true });
      d.deco.curve([[47, 15.4], [51, 14], [55, 15.4]], 1.3, Hd, { unlit: true });
      // narines, gueule et rangée de crocs
      d.deco.ell(62.4, 21.2, 1, 0.7, '#5a2200', 0, { unlit: true });
      if (p.pose === 'attack') {
        d.deco.poly([[42, 27.6], [63.6, 25.6], [62, 33], [46, 33.4]], '#6a0a0a', { unlit: true });
        d.deco.ell(57, 29.4, 4.4, 2.6, '#ff9a30', 0, { unlit: true }); d.deco.ell(58, 29.2, 2.2, 1.4, '#fff0a0', 0, { unlit: true });
      } else d.deco.curve([[41, 27.8], [52, 28.4], [63.4, 26.4]], 1.3, '#5a2200', { unlit: true });
      for (let i = 0; i < 6; i++) d.deco.poly([[43 + i * 3.4, 27.8 - i * 0.25], [44.2 + i * 3.4, 30.6 - i * 0.25], [45.4 + i * 3.4, 27.6 - i * 0.25]], CLAW, { unlit: true });
      for (let i = 0; i < 4; i++) d.deco.poly([[46 + i * 3.6, 28.6], [47.2 + i * 3.6, 26.2], [48.4 + i * 3.6, 28.6]], CLAW, { unlit: true });
      // bras proche zébré, trois grandes griffes
      d.tube([[40, 34], [45, 39], [49, 41]], 6.6, 5, O);
      stripe(d, [[42, 35.6], [44.6, 38.6]], 2); stripe(d, [[45.4, 38.4], [47.4, 40.6]], 1.8);
      claws(d, 49.6, 41.6, 6.4, { w: 2.2, ang: 0, spread: 2.6 });
    },

    // ---------------------------------------------------------- Ultime : MetalGreymon, ailes-lames et Bras Trident
    metalgreymon(d, p = {}) {
      const O = '#f2861e', Od = '#c8661a';
      const M = '#b8c0d0', Md = '#7c8498', Ml = '#e8eef8', Hair = '#d8302a', W2 = '#f6f2e4';
      const WG = ['#6a4ac8', '#7a5ad8', '#5a5ad8', '#8a6ae0', '#6a5ab8'];
      // ailes : cinq lames violettes en éventail (derrière)
      const feathers = [[[25, 27], [2, 6], [6, 2], [24, 23]], [[25, 27], [8, 0.4], [13, 0.4], [26, 22]], [[26, 27], [16, 0.2], [21, 1], [28, 22]],
        [[24, 29], [0, 15], [2, 11], [23, 26]], [[24, 31], [1, 23], [2, 19.6], [23, 29]]];
      feathers.forEach((f, i) => { d.poly(f, WG[i], { shiny: true, far: true }); d.deco.line(f[0][0], f[0][1], (f[1][0] + f[2][0]) / 2, (f[1][1] + f[2][1]) / 2, 0.6, '#3a2a80'); });
      // queue zébrée
      d.tube([[18, 45], [9, 51], [3, 56], [0, 59]], 13, 2.4, O);
      stripe(d, [[11, 48], [13, 52.6]], 2.4); stripe(d, [[5.4, 52.6], [7, 56.4]], 2); stripe(d, [[2, 56], [3, 58]], 1.4);
      // jambe et bras éloignés
      d.ell(40, 52, 7, 9.4, Od, 0, { far: true }); d.ell(43, 60, 9.4, 3.2, Od, 0, { far: true });
      toes(d, 46, 61.8, 3, { far: true });
      d.tube([[36, 34], [40, 39], [44, 41]], 5, 4, Od, { far: true });
      claws(d, 44.4, 41.4, 4, { far: true, w: 1.5 });
      // torse zébré
      d.blob([[16, 31], [30, 26], [40, 31], [42, 43], [36, 51], [22, 53], [13, 45]], O);
      stripe(d, [[13, 31.4], [19, 35]], 2.8); stripe(d, [[11.4, 38.6], [17, 41.6]], 2.8); stripe(d, [[12.6, 45], [18, 47]], 2.4);
      // plastron métallique : trappe des missiles Giga Destruction
      d.blob([[27, 28], [41, 26], [45, 38], [41, 48], [31, 48.6], [26, 39]], M, { shiny: true });
      d.deco.rect(30, 32, 11, 9, Md); d.deco.line(35.5, 32, 35.5, 41, 0.9, '#4a5068');
      d.deco.circ(32.6, 36.6, 1.6, '#e03030', { unlit: true }); d.deco.circ(38.4, 36.6, 1.6, '#e03030', { unlit: true });
      for (const [x, y] of [[29, 30], [42, 29], [29, 45], [40, 46]]) d.deco.circ(x, y, 0.7, Ml);
      d.deco.curve([[28, 43], [40, 44]], 0.8, Md);
      // jambe proche, genouillère métallique
      d.ell(22, 51, 9.4, 10.6, O);
      stripe(d, [[15, 47], [19, 49]], 2.2); stripe(d, [[16, 55], [21, 56.6]], 2);
      d.ell(23, 49.6, 5.4, 4.4, M, 0, { shiny: true });
      d.deco.circ(23, 49.6, 1.2, Md);
      d.ell(24, 60, 10.2, 3.4, O);
      toes(d, 27.6, 62.2, 3, { col: W2, size: 1.15 });
      // tête : crinière rouge, casque de métal à grande corne
      d.poly([[32, 22], [26, 10], [31, 14], [29, 4], [35, 12], [36, 3], [39, 12], [36, 24]], Hair, { far: true });
      d.ell(38, 26, 8, 7, O, -0.4);
      d.ell(46, 22, 11.6, 9.4, O);
      d.ell(54.4, 26.4, 9.6, 6, O, 0.05, { noline: true });
      d.ell(52, 31, 8.4, 3, O, 0.12, { noline: true });
      stripe(d, [[44, 27], [48, 28]], 1.8);
      d.poly([[33, 18], [41, 8.6], [53, 8.6], [62, 17], [62.4, 22.6], [48, 21], [38, 26]], M, { shiny: true, round: 0.5 });
      d.deco.curve([[37, 19], [43, 11.4], [56, 12]], 0.9, Ml);
      d.deco.rect(40, 14, 4, 2, Md); d.deco.line(57, 14, 59, 21, 0.6, Md);
      d.deco.ell(51.4, 17, 3.8, 2.8, '#14141e', 0, { unlit: true });
      d.deco.ell(52, 17.4, 1.9, 1.7, '#ff3030', 0, { unlit: true });
      d.deco.ell(52.4, 17, 0.7, 0.7, '#ffd0c0', 0, { unlit: true });
      // grande corne frontale + cornes latérales
      d.tube([[54, 10], [55, 4], [58, 0.4]], 4.4, 0.5, W2, { shiny: true });
      d.tube([[42, 9.6], [40, 3.4], [42, 0.6]], 3.4, 0.5, W2, { shiny: true, far: true });
      d.deco.curve([[46, 30.6], [54, 31], [62, 27.6]], 1.2, '#5a2200', { unlit: true });
      for (let i = 0; i < 3; i++) d.deco.poly([[51 + i * 3.8, 30.8 - i * 0.6], [52.3 + i * 3.8, 33.6 - i * 0.6], [53.6 + i * 3.8, 30.4 - i * 0.6]], W2, { unlit: true });
      // Bras Trident : bras de métal articulé et trois lames
      d.tube([[38, 33], [45, 38], [50, 41]], 8.4, 7, M, { shiny: true });
      d.deco.line(42, 34.6, 45, 40, 0.8, Md); d.deco.circ(45, 38, 1.4, Md);
      d.ell(51, 42, 4.6, 4.4, Md, 0, { shiny: true });
      d.tube([[52, 40], [58, 35], [63, 34]], 3, 0.6, Ml, { shiny: true });
      d.tube([[53, 42.4], [60, 42], [64, 44]], 3, 0.6, Ml, { shiny: true });
      d.tube([[51.6, 44.6], [56, 49], [59, 53]], 3, 0.6, Ml, { shiny: true });
      d.deco.curve([[30, 26.6], [33, 22], [37, 21.6]], 1, '#3a3a4a');
    },

    // ---------------------------------------------------------- Méga : WarGreymon, guerrier dragon en Chrome Digizoïde
    wargreymon(d, p = {}) {
      const G = '#f6c430', Gd = '#c8941c', Gl = '#fff090', S = '#f2902e', Sd = '#c86a1a';
      const Si = '#c8d0dc', Sid = '#8a94a8', Sil = '#eef2f8', R = '#d8322a', Bu = '#4a5ab8', Hair = '#d8402a';
      // Bouclier du Courage dans le dos (doré, intérieur bleu)
      d.poly([[22, 6], [11, 14], [8, 30], [12, 46], [20, 52], [24, 30]], G, { shiny: true, far: true });
      d.deco.poly([[20, 12], [14, 18], [12, 30], [15, 42], [20, 46], [21, 30]], Bu);
      d.deco.line(17, 12, 14, 44, 0.8, Gd);
      // chevelure rouge
      d.poly([[34, 10], [26, 10], [20, 16], [22, 18], [18, 24], [24, 22], [24, 28], [30, 20], [34, 16]], Hair, { far: true });
      // bras éloigné et sa griffe Dramon
      d.tube([[27, 24], [23, 31], [24, 37]], 5.4, 4.6, Sd, { far: true });
      d.ell(24.6, 38.6, 4.4, 5, Gd, 0, { far: true });
      d.tube([[24, 42], [22, 50]], 2, 0.5, Si, { far: true }); d.tube([[26.6, 42], [27.6, 50]], 2, 0.5, Si, { far: true });
      // jambe éloignée : jambière argentée, gros pied doré
      d.tube([[33, 40], [35, 50], [36, 56]], 7.4, 6, Sid, { far: true });
      d.ell(39, 59.6, 7.6, 3.6, Gd, 0, { far: true });
      toes(d, 42, 61.8, 3, { far: true, col: Si });
      // abdomen (peau orange) et plastron argenté aux croix rouges
      d.blob([[24, 31], [36, 30], [38, 40], [33, 45], [26, 44], [23, 38]], S);
      for (let i = 0; i < 2; i++) d.deco.curve([[26, 37 + i * 3], [35, 37.6 + i * 3]], 0.7, Sd);
      d.blob([[21, 18], [36, 16], [40, 24], [37, 33], [24, 34], [20, 26]], Si, { shiny: true });
      d.deco.curve([[22, 21], [30, 19], [38, 21]], 0.9, Sil);
      for (const [x, y] of [[29, 21.6], [29.6, 27.6]]) { d.deco.line(x - 2.4, y - 2.2, x + 2.4, y + 2.2, 1.2, R); d.deco.line(x - 2.4, y + 2.2, x + 2.4, y - 2.2, 1.2, R); }
      // ceinture
      d.rect(23, 42, 15, 3.6, '#3a3a50', { round: 0.4 });
      d.deco.rect(29, 42.4, 3.4, 2.8, R);
      // jambe proche : cuisse orange, jambière argentée à bande rouge, pied doré griffu
      d.tube([[27, 44], [26, 50]], 8, 7.4, S);
      d.tube([[26, 49], [25, 57]], 8, 7.4, Si, { shiny: true });
      d.deco.rect(21.6, 51, 7.6, 2, R);
      d.poly([[23, 49], [19.6, 44.6], [25.6, 46.6]], Sil, { shiny: true });
      d.ell(29, 59.6, 9, 3.8, G, 0, { shiny: true });
      toes(d, 31.6, 62.4, 3, { col: Si, size: 1.2 });
      // épaulière dorée à pointe
      d.ell(35.6, 19.6, 7, 5.4, G, -0.3, { shiny: true });
      d.poly([[32.6, 15.6], [36.4, 8.6], [39, 15.4]], Gd, { shiny: true });
      d.deco.curve([[31, 21], [40, 17.6]], 0.8, Gl);
      // tête : casque argenté à trois cornes, museau orange, œil vert
      d.ell(37, 14, 5, 4, S, -0.3);
      d.ell(43, 9.6, 7.4, 6.4, Si, 0, { shiny: true });
      d.ell(51, 12.4, 6.8, 3.6, S, 0.08, { noline: true });
      d.ell(49.6, 15.6, 5.4, 2, S, 0.14, { noline: true });
      d.deco.curve([[45, 15.4], [51, 15.6], [57, 13.6]], 0.9, '#5a2200', { unlit: true });
      d.deco.poly([[51, 15], [52, 17], [53, 14.8]], '#ffffff', { unlit: true }); d.deco.poly([[54, 14.4], [55, 16.2], [56, 14.2]], '#ffffff', { unlit: true });
      d.poly([[38, 8], [44, 3], [52, 6.6], [56, 10.6], [47, 10.6], [40, 13]], Si, { shiny: true, round: 0.4 });
      d.deco.ell(47.6, 9.6, 2, 1.5, '#121a10', 0, { unlit: true });
      d.deco.ell(48, 9.6, 1.1, 1, '#4ae070', 0, { unlit: true });
      d.poly([[42, 4.4], [44, 0.2], [47, 4.4]], Sil, { shiny: true });
      d.tube([[39, 7], [35, 3], [33, 0.6]], 2.6, 0.5, Sil, { shiny: true });
      d.tube([[52, 6.4], [56, 2.6], [58.6, 1.6]], 2.6, 0.5, Sil, { shiny: true });
      // bras proche tendu, Destructeur Dramon : gros gantelet doré et trois longues griffes argentées
      d.tube([[36, 22], [42, 28], [46, 32]], 6, 5.4, S);
      d.tube([[44, 30], [51, 36]], 8.6, 8.6, G, { shiny: true });
      d.deco.curve([[45, 29], [50, 32.6]], 0.8, Gl);
      d.deco.rect(46, 33, 3, 1.6, R);
      d.ell(53, 37.6, 4.4, 4.6, Sid, 0, { shiny: true });
      d.tube([[55, 35], [60, 30], [64, 28.4]], 2.8, 0.5, Si, { shiny: true });
      d.tube([[56, 37.6], [61.4, 37], [64, 38]], 2.8, 0.5, Si, { shiny: true });
      d.tube([[55, 40], [59, 44], [61, 48]], 2.8, 0.5, Si, { shiny: true });
    },
  });
})();
