'use strict';
// =====================================================================
//  DÉCOR DU CHAPITRE 1
//  - grandarbre (4×3) : l'arbre immense de la Clairière de l'Arrivée, où se cache Kuwagamon.
//    v0 : tronc fermé, une énigme gravée dans l'écorce ; v1 : le tronc s'est ouvert (passage sombre)
//  - trophystand (1×1) : présentoir de trophée de la cave du joueur ; v0 vide, v1 Kuwagamon (et les suivants)
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  Object.assign(OBJ, {
    grandarbre: { w: 132, h: 150, n: 2, draw(d, v) {
      const Tr = '#6a4626', Td = '#4a2e18', Tl = '#8a6038', L1 = '#2f7a34', L2 = '#45a03e', L3 = '#6cc458';
      d.ell(66, 146, 60, 5, '#20301a', 0, { flat: true });
      // racines
      for (const [x0, x1] of [[22, 6], [40, 30], [92, 104], [110, 128]]) d.tube([[x0 + 22, 136], [(x0 + x1) / 2 + 22, 142], [x1 + 4, 146]], 6, 2.5, Td, { tex: 0.3 });
      // tronc massif
      d.tube([[66, 146], [64, 100], [66, 60]], 36, 24, Tr, { tex: 0.4 });
      for (const x of [44, 56, 76, 88]) d.deco.line(x, 140, x + 2, 70, 1.2, Td);
      d.deco.ell(54, 96, 4, 7, Td); d.deco.ell(84, 118, 3, 5, Td);
      // l'entrée : fermée (écorce gravée de l'énigme) ou ouverte (passage sombre)
      if (v) { d.ell(66, 128, 15, 19, '#120a06'); d.deco.ell(66, 124, 11, 14, '#1e120a'); d.deco.circ(62, 118, 1.2, '#ff3a2a', { unlit: true }); d.deco.circ(70, 118, 1.2, '#ff3a2a', { unlit: true }); }
      else {
        d.ell(66, 126, 13, 17, Tl, 0, { tex: 0.3 });
        for (let k = 0; k < 5; k++) d.deco.line(58, 116 + k * 4, 74, 116 + k * 4, 0.8, '#3a2412');
        d.deco.circ(66, 110, 3, '#5af0c0', { unlit: true });   // un symbole qui luit faiblement
      }
      // feuillage immense en plusieurs couches
      for (const [x, y, r, c] of [[24, 54, 28, L1], [108, 52, 28, L1], [66, 30, 36, L1], [36, 34, 24, L2], [96, 30, 26, L2], [66, 58, 30, L2], [50, 16, 18, L3], [84, 14, 18, L3], [24, 70, 18, L2], [110, 72, 18, L2]])
        d.circ(x, y, r, c, { tex: 0.5, texSize: 1 });
      for (const [x, y] of [[40, 24], [90, 40], [60, 12], [20, 50], [112, 58]]) d.deco.circ(x, y, 3, '#9ae070');
      // lianes qui pendent
      for (const x of [30, 52, 82, 104]) d.deco.curve([[x, 60], [x + 3, 80], [x - 1, 96]], 1, '#3a7a2a');
    } },
    trophystand: { w: 26, h: 40, n: 4, draw(d, v) {
      d.ell(13, 38, 11, 2.2, '#1a1418', 0, { flat: true });
      d.rect(3, 26, 20, 12, '#7a5a3a', { round: 0.12, tex: 0.3 }); d.deco.rect(3, 26, 20, 2, '#a07a4a');
      d.deco.rect(8, 31, 10, 3, '#d8c070');                       // plaque
      if (!v) { d.deco.circ(13, 24, 1.4, '#5a4a3a'); return; }
      d.rect(6, 22, 14, 5, '#e8c040', { round: 0.3, shiny: true });   // socle doré
      if (v === 1) {   // Kuwagamon : tête rouge et grandes pinces
        d.ell(13, 15, 6, 6, '#c83a2a', 0, { shiny: true });
        d.tube([[9, 11], [5, 4], [8, 1]], 1.6, 1, '#d8d0c0'); d.tube([[17, 11], [21, 4], [18, 1]], 1.6, 1, '#d8d0c0');
        for (const x of [6, 9, 17, 20]) d.deco.line(x, 6, x + (x < 13 ? -1 : 1), 8, 0.6, '#8a8070');
        d.deco.circ(11, 14, 1, '#ffe060', { unlit: true }); d.deco.circ(15, 14, 1, '#ffe060', { unlit: true });
      } else {         // trophée générique : une coupe
        d.poly([[7, 8], [19, 8], [16, 18], [10, 18]], '#e8c040', { shiny: true });
        d.tube([[13, 18], [13, 22]], 1.4, 2, '#d8b030');
      }
    } },
  });
  OBJ.grandarbre.scale = 1.15;
})();
