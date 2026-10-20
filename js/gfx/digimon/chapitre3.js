'use strict';
// =====================================================================
//  DESSINS — DIGIMON DU CHAPITRE 3 (Pays de Meramon, Mont Miharashi) : Guilmon, Candlemon, Flarizamon
//  Repère 64x64, tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = motif peint sur le volume (voir engine/art.js)
// =====================================================================
(function () {
  const CLAW = '#f6f2e6';
  // trois griffes en éventail
  const claws = (d, x, y, l, o = {}) => {
    const sp = o.spread || 2.2, ang = o.ang || 0;
    for (let i = -1; i <= 1; i++) { const a = ang + i * 0.38, by = y + i * sp; d.tube([[x, by], [x + Math.cos(a) * l * 0.6, by + Math.sin(a) * l * 0.6 - 0.6], [x + Math.cos(a + 0.3) * l, by + Math.sin(a + 0.3) * l]], o.w || 1.8, 0.4, o.col || CLAW, { shiny: true, far: o.far }); }
  };
  const toes = (d, x, y, n = 3, o = {}) => { const s = o.size || 1; for (let i = 0; i < n; i++) d.poly([[x + i * 3.2 * s, y], [x + (1.6 + i * 3.2) * s, y - 3.8 * s], [x + (2.8 + i * 3.2) * s, y]], o.col || CLAW, { shiny: true, far: o.far }); };

  Object.assign(DW.DRAW, {
    // ---------------------------------------------------------- Disciple : Guilmon, dinosaure rouge aux marques noires,
    // oreilles en ailes, yeux jaunes fendus, symbole du Danger Numérique sur le ventre blanc
    guilmon(d, p = {}) {
      const R = '#d82230', Rd = '#a2141e', Rl = '#ee5a5e', Wh = '#f4ece2', K = '#1c1418', Y = '#f6c81e';
      const atk = p.pose === 'attack';
      // queue épaisse à marques noires
      d.tube([[21, 47], [12, 52], [5, 55], [0, 55]], 11, 1.8, R);
      d.deco.tube([[14, 49], [15.4, 53.6]], 1.8, 1, K); d.deco.tube([[8, 52], [9, 55.4]], 1.5, 0.8, K);
      // bras et jambe éloignés
      d.tube([[26, 34], [22, 40], [25, 44]], 4.8, 3.8, Rd, { far: true });
      claws(d, 26, 44.4, 3.4, { far: true, w: 1.5, ang: 0.4 });
      d.ell(39, 53, 6.4, 8.6, Rd, 0, { far: true }); d.ell(42, 60, 7.8, 3, Rd, 0, { far: true });
      toes(d, 45.4, 61.8, 3, { far: true });
      // corps penché en avant, ventre blanc
      d.blob([[21, 33], [33, 28], [41, 37], [40, 50], [31, 56], [20, 52], [16, 42]], R, { tex: 0.12 });
      d.deco.blob([[30, 35], [38, 36], [38.6, 48], [33, 53.4], [28.6, 48]], Wh);
      // symbole du Danger Numérique : cercle rouge, triangle et trois points noirs
      d.deco.circ(33.8, 43.6, 3.6, '#c81820', { unlit: true }); d.deco.circ(33.8, 43.6, 2.7, Wh, { unlit: true });
      d.deco.poly([[33.8, 41.4], [36, 45.2], [31.6, 45.2]], K, { unlit: true });
      for (const [x, y] of [[33.8, 39], [37.8, 46.4], [29.8, 46.4]]) d.deco.circ(x, y, 0.8, K, { unlit: true });
      // marques noires du dos et des flancs
      d.deco.poly([[20, 37], [24, 35.4], [22.6, 39.6]], K); d.deco.poly([[18.4, 44], [22.4, 42.6], [21.2, 46.6]], K);
      d.deco.curve([[19, 37], [21, 33.6]], 1, Rl);
      // jambe proche : cuisse marquée, gros pied griffu
      d.ell(25, 52, 7.6, 9.2, R);
      d.deco.poly([[21.4, 49], [26, 47.6], [24.4, 52.4]], K);
      d.ell(28, 60, 9, 3.4, R); toes(d, 30.6, 62.2, 3, { size: 1.1 });
      // oreilles en ailes (repliées vers l'arrière)
      d.poly([[27, 13], [17, 5], [15, 14], [22, 18]], Rd, { far: true });
      d.poly([[31, 10], [24, 1], [20, 9.6], [27.6, 15]], R);
      d.deco.poly([[29, 10.6], [24.4, 4.4], [22.6, 9.6]], Rl);
      // tête : crâne large, museau carré, mâchoire blanche
      d.blob([[22, 21], [25, 12], [33, 7.4], [44, 8.6], [52, 13], [61, 18], [62, 26], [56, 31], [42, 32.4], [28, 30]], R, { shiny: true });
      d.deco.blob([[38, 27.6], [58, 25.6], [57, 31], [44, 32.2]], Wh);
      d.deco.poly([[33, 9.6], [38, 9], [36, 13]], K); d.deco.poly([[26, 15], [29.6, 12.6], [29.4, 17]], K);   // marques du crâne
      d.deco.ell(58.6, 19.6, 1.1, 0.8, K, 0, { unlit: true });
      if (atk) {
        // gueule ouverte : la Pyro-Sphère se prépare
        d.deco.poly([[37, 25.6], [62, 21.6], [61, 33], [44, 32.6]], '#6a0c10', { unlit: true });
        d.deco.ell(55, 27.6, 4.6, 3, '#ff8a2a', 0, { unlit: true }); d.deco.ell(56, 27.4, 2.4, 1.6, '#fff0a0', 0, { unlit: true });
        for (let i = 0; i < 4; i++) d.deco.poly([[42 + i * 4.6, 24.6 - i * 0.6], [43.4 + i * 4.6, 27 - i * 0.6], [44.6 + i * 4.6, 24.4 - i * 0.6]], '#ffffff', { unlit: true });
      } else {
        d.deco.curve([[36, 26.6], [47, 28.4], [61, 25]], 1.4, '#4a0a0e', { unlit: true });
        for (let i = 0; i < 3; i++) d.deco.poly([[46 + i * 4.6, 27.6 - i * 0.5], [47.3 + i * 4.6, 30 - i * 0.5], [48.6 + i * 4.6, 27.4 - i * 0.5]], CLAW, { unlit: true });
      }
      // œil jaune à pupille fendue, sourcil sévère
      d.deco.ell(44, 16.6, 3.8, 4.2, Y, -0.15, { unlit: true }); d.deco.ell(44.6, 16.8, 0.9, 3, K, 0, { unlit: true });
      d.deco.ell(43, 15, 0.9, 0.9, '#ffffff', 0, { unlit: true });
      d.deco.curve([[39.4, 11.4], [47.6, 13.2]], 1.4, K, { unlit: true });
      // bras proche, griffes blanches
      d.tube([[36, 33], [40, 39], [45, 42]], 5.6, 4.6, R);
      d.deco.poly([[37.4, 35], [40.4, 36.6], [38, 38.4]], K);
      claws(d, 45.6, 42.4, 5.6, { w: 2, ang: -0.1, spread: 2.4 });
    },

    // ---------------------------------------------------------- Disciple : Candlemon, bougie vivante : corps de cire
    // blanche qui coule, grande flamme en guise de tête, yeux rouges dans la cire, bras de cire, bougeoir doré
    candlemon(d, p = {}) {
      const Wx = '#f6efe0', Wd = '#d6cab2', Wl = '#fffaf0', Or = '#ff8a1e', Ye = '#ffd640', Wf = '#fff6c8', Bl = '#4a7aff', G = '#d8a838', Gd = '#9a7020', Rr = '#d0182a';
      const atk = p.pose === 'attack';
      // bougeoir doré (coupelle et pied)
      d.ell(32, 60, 15, 3.2, Gd, 0, { far: true });
      d.ell(32, 57.6, 14, 3.4, G, 0, { shiny: true });
      d.deco.curve([[20, 57], [32, 59.6], [44, 57]], 0.8, '#fff0b0');
      // bras de cire éloigné
      d.tube([[24, 38], [18, 44], [17, 49]], 4.4, 3.2, Wd, { far: true });
      // corps : cylindre de cire, coulures sur le bord
      d.blob([[21, 26], [43, 26], [44, 40], [44.6, 56], [19.4, 56], [20, 40]], Wx, { tex: 0.08 });
      d.deco.ell(26, 40, 2.4, 12, Wl, 0);   // reflet
      for (const [x, l] of [[23, 9], [29, 5], [35, 12], [41, 7]]) { d.tube([[x, 25.6], [x, 25.6 + l]], 3, 2.2, Wx); d.circ(x, 26 + l, 1.7, Wx, { shiny: true }); }
      d.ell(32, 26, 11.6, 3, Wl, 0, { noline: true });
      // mèche et grande flamme (bleu à la base, orange, jaune, cœur blanc), qui penche vers l'avant
      d.deco.line(32, 25.6, 32.4, 21.6, 1, '#3a2a20');
      const fx = atk ? 4 : 0;
      d.poly([[23, 23], [21, 14], [24, 6], [30, 0], [31, 6], [36, 2], [37, 9], [42 + fx, 6], [43 + fx, 15], [41, 23]], Or, { unlit: true });
      d.poly([[26, 22.6], [25, 15], [29, 8], [32, 12], [35, 7], [39, 15], [38, 22.6]], Ye, { unlit: true });
      d.ell(32, 18.6, 3.6, 4.6, Wf, 0, { unlit: true });
      d.ell(32, 23, 4.4, 1.6, Bl, 0, { unlit: true });
      // yeux rouges dans la cire, sourcils de cire
      d.eye(28.4, 35, 3.4, 4.2, Rr, { look: 0.35 }); d.eye(37.6, 35.4, 3, 3.8, Rr, { look: 0.35 });
      d.deco.curve([[25, 30], [31, 31.4]], 1, Wd); d.deco.curve([[34.6, 31.4], [40, 30.4]], 1, Wd);
      d.deco.curve(atk ? [[28, 44], [33, 47], [38, 44]] : [[29, 44], [33, 45.4], [37, 44]], 1, '#8a6a4a', { unlit: true });
      // bras de cire proche, main levée (une goutte de feu au bout du doigt en attaque)
      d.tube([[41, 38], [48, 36], [52, atk ? 28 : 33]], 4.6, 3.2, Wx);
      d.circ(52.6, atk ? 27 : 32.6, 2.6, Wx, { shiny: true });
      if (atk) { d.ell(54.6, 22, 2.6, 3.6, Or, 0, { unlit: true }); d.ell(54.6, 22.6, 1.4, 2, Ye, 0, { unlit: true }); }
    },

    // ---------------------------------------------------------- Champion : Flarizamon, lézard guerrier de flammes : écailles
    // rouge orangé, ventre jaune, crête et dos en flammes, brassards de fer, longue queue terminée par une flamme
    flarizamon(d, p = {}) {
      const R = '#e0461c', Rd = '#a82a10', Yb = '#f8d060', Or = '#ff9a26', Ye = '#ffe060', Wf = '#fff6c8', Fe = '#6a6a78', Fl = '#b4b4c4', K = '#2a0a06';
      const atk = p.pose === 'attack';
      // queue longue terminée par une flamme
      d.tube([[22, 46], [12, 50], [5, 47], [2, 41]], 10, 3, R);
      d.poly([[0, 42], [1, 33], [4, 37], [5, 30], [8, 38], [6, 43]], Or, { unlit: true }); d.poly([[2, 41], [3, 36], [5, 38.6], [6, 34], [6.6, 41]], Ye, { unlit: true });
      // bras et jambe éloignés
      d.tube([[24, 30], [18, 37], [20, 43]], 5.4, 4.4, Rd, { far: true }); claws(d, 21, 43.4, 3.6, { far: true, w: 1.6, ang: 0.5 });
      d.tube([[30, 46], [33, 54], [37, 60]], 7.6, 5.6, Rd, { far: true }); d.ell(39, 61, 6.4, 2.4, Rd, 0, { far: true }); toes(d, 41, 62, 3, { far: true });
      // dos en flammes
      d.poly([[17, 40], [12, 32], [16, 31], [13, 23], [19, 25], [18, 16], [24, 21], [26, 13], [30, 22], [26, 36]], Or, { unlit: true });
      d.poly([[19, 37], [16, 31], [20, 30], [19, 23], [23, 26], [25, 19], [27, 27], [24, 34]], Ye, { unlit: true });
      // torse puissant, ventre jaune annelé
      d.blob([[20, 26], [34, 20], [44, 28], [43, 44], [36, 52], [24, 50], [18, 40]], R, { tex: 0.15 });
      d.deco.blob([[33, 27], [41, 30], [41, 44], [36, 50], [31, 44]], Yb);
      for (let k = 0; k < 4; k++) d.deco.curve([[32.4, 32 + k * 4.4], [40.6, 33 + k * 4]], 0.6, '#c89a38');
      // jambe proche : cuisse musclée, griffes
      d.ell(27, 50, 8, 9.6, R); d.deco.curve([[22, 46], [24, 54]], 0.8, Rd);
      d.tube([[28, 56], [30, 61]], 6, 5, R); d.ell(32, 61, 7.6, 2.6, R); toes(d, 33, 62.4, 3, { size: 1.1 });
      // tête de lézard : museau long, crête de flammes, œil furieux
      d.poly([[30, 14], [27, 4], [32, 8], [34, 0], [38, 7], [42, 2], [43, 10], [48, 7], [46, 15]], Or, { unlit: true });
      d.poly([[32, 13], [31, 7], [34, 9.6], [36, 4], [39, 9.6], [42, 6], [43, 13]], Ye, { unlit: true });
      d.blob([[30, 21], [32, 12], [40, 9.6], [48, 12], [58, 15], [62, 20], [59, 25], [48, 26], [36, 26]], R, { shiny: true });
      d.deco.blob([[44, 22.6], [60, 21], [58, 25], [47, 25.6]], Yb);
      d.deco.ell(60, 17.4, 0.9, 0.7, K, 0, { unlit: true });
      if (atk) { d.deco.poly([[44, 21.6], [62, 19], [60, 27], [48, 26.6]], '#6a1008', { unlit: true }); d.deco.ell(57, 23, 4, 2.4, Or, 0, { unlit: true }); d.deco.ell(58, 23, 2, 1.2, Wf, 0, { unlit: true }); }
      else d.deco.curve([[42, 22.4], [51, 23.6], [61, 21]], 1.2, K, { unlit: true });
      d.deco.ell(44.6, 15.4, 2.8, 2.4, Ye, -0.2, { unlit: true }); d.deco.ell(45.4, 15.6, 0.9, 1.8, K, 0, { unlit: true });
      d.deco.curve([[40.6, 12.4], [48, 13.4]], 1.3, K, { unlit: true });
      // bras proche : brassard de fer, poing de flammes
      d.tube([[38, 28], [45, 34], [51, atk ? 30 : 38]], 6.4, 5.4, R);
      d.tube([[43.4, 32.4], [47.4, 35.6]], 6.6, 6.4, Fe, { shiny: true }); d.deco.line(44, 31.4, 46.6, 36.6, 0.7, Fl);
      d.circ(52.4, atk ? 29.4 : 38.6, 4.2, R, { shiny: true });
      claws(d, 54.6, atk ? 29.4 : 38.6, 3.6, { w: 1.6, ang: atk ? -0.5 : 0.1, spread: 1.8 });
      if (atk) { d.poly([[52, 24], [55, 15], [58, 22], [61, 17], [61, 27]], Or, { unlit: true }); d.poly([[54, 24.6], [56, 19], [58.4, 23.6]], Ye, { unlit: true }); }
    },
  });
})();
