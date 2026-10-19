'use strict';
// =====================================================================
//  DÉCOR DU CHAPITRE 1
//  - grandarbre (4×3) : l'arbre immense de la Clairière de l'Arrivée, où se cache Kuwagamon.
//    v0 : écorce gravée ; v1, v2 : une, puis deux fissures (énigmes résolues) ; v3 : écorce éclatée, passage ouvert
//  - treeroots, kuwanest : décor du Cœur du Grand Arbre
//  - trophystand (1×1) : présentoir de trophée de la cave du joueur ; v0 vide, v1 Kuwagamon (et les suivants)
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  Object.assign(OBJ, {
    grandarbre: { w: 132, h: 150, n: 4, draw(d, v) {
      const Tr = '#6a4626', Td = '#4a2e18', Tl = '#8a6038', L1 = '#2f7a34', L2 = '#45a03e', L3 = '#6cc458';
      d.ell(66, 146, 60, 5, '#20301a', 0, { flat: true });
      // racines
      for (const [x0, x1] of [[22, 6], [40, 30], [92, 104], [110, 128]]) d.tube([[x0 + 22, 136], [(x0 + x1) / 2 + 22, 142], [x1 + 4, 146]], 6, 2.5, Td, { tex: 0.3 });
      // tronc massif
      d.tube([[66, 146], [64, 100], [66, 60]], 36, 24, Tr, { tex: 0.4 });
      for (const x of [44, 56, 76, 88]) d.deco.line(x, 140, x + 2, 70, 1.2, Td);
      d.deco.ell(54, 96, 4, 7, Td); d.deco.ell(84, 118, 3, 5, Td);
      // l'entrée : écorce gravée (v0), fissurée (v1, v2), puis éclatée sur un passage sombre (v3)
      // éclats d'écorce au sol
      if (v >= 3) for (const [x, y, a] of [[40, 140, -0.4], [92, 142, 0.5], [50, 146, 0.2], [84, 132, -0.6], [30, 132, 0.8]]) d.poly([[x, y], [x + 8 * Math.cos(a), y - 3], [x + 6, y + 2]], '#a07848');
      if (v >= 3) { d.ell(66, 128, 15, 19, '#120a06'); d.deco.ell(66, 124, 11, 14, '#1e120a'); d.deco.circ(62, 118, 1.2, '#ff3a2a', { unlit: true }); d.deco.circ(70, 118, 1.2, '#ff3a2a', { unlit: true }); }
      else {
        d.ell(66, 126, 13, 17, Tl, 0, { tex: 0.3 });
        for (let k = 0; k < 5; k++) d.deco.line(58, 116 + k * 4, 74, 116 + k * 4, 0.8, '#3a2412');
        d.deco.circ(66, 110, 3, '#5af0c0', { unlit: true });   // un symbole qui luit faiblement
        // fissures lumineuses, une par énigme résolue
        if (v >= 1) { d.deco.line(66, 108, 60, 120, 1.2, '#5af0c0', { unlit: true }); d.deco.line(60, 120, 63, 132, 1, '#5af0c0', { unlit: true }); d.deco.line(60, 120, 54, 124, 0.8, '#5af0c0', { unlit: true }); }
        if (v >= 2) { d.deco.line(66, 108, 74, 118, 1.2, '#5af0c0', { unlit: true }); d.deco.line(74, 118, 70, 136, 1, '#5af0c0', { unlit: true }); d.deco.line(74, 118, 80, 112, 0.8, '#5af0c0', { unlit: true }); d.deco.line(70, 136, 62, 142, 0.8, '#5af0c0', { unlit: true }); }
      }
      // feuillage immense en plusieurs couches
      for (const [x, y, r, c] of [[24, 54, 28, L1], [108, 52, 28, L1], [66, 30, 36, L1], [36, 34, 24, L2], [96, 30, 26, L2], [66, 58, 30, L2], [50, 16, 18, L3], [84, 14, 18, L3], [24, 70, 18, L2], [110, 72, 18, L2]])
        d.circ(x, y, r, c, { tex: 0.5, texSize: 1 });
      for (const [x, y] of [[40, 24], [90, 40], [60, 12], [20, 50], [112, 58]]) d.deco.circ(x, y, 3, '#9ae070');
      // lianes qui pendent
      for (const x of [30, 52, 82, 104]) d.deco.curve([[x, 60], [x + 3, 80], [x - 1, 96]], 1, '#3a7a2a');
    } },
    // racines qui pendent du plafond, gouttes de sève lumineuse (décor mural du Cœur du Grand Arbre)
    treeroots: { w: 40, h: 44, n: 2, draw: DW.World.secours.bois(40, 44) },
    // le nid de Kuwagamon : bois mâché, carapaces, une lueur rouge
    kuwanest: { w: 64, h: 30, n: 1, draw(d) {
      d.ell(32, 22, 30, 7, '#4a3220', 0, { tex: 0.4 });
      for (let k = 0; k < 9; k++) d.tube([[6 + k * 6, 24], [10 + k * 6, 14 + (k % 3) * 2]], 2, 1.4, k % 2 ? '#7a5434' : '#9a7044');
      d.ell(32, 18, 18, 4, '#2a1a10');
      for (const [x, y] of [[22, 16], [42, 17]]) d.ell(x, y, 5, 3, '#c83a2a', 0.3, { shiny: true });
      d.deco.circ(32, 16, 3, '#ff5a3a', { unlit: true });
    } },
    trophystand: { w: 26, h: 40, n: 5, draw(d, v) {
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
      } else if (v === 2) {   // Shellmon : coquille rose en spirale et tentacule vert
        d.ell(13, 14, 7, 6.5, '#f0a0b8', 0, { shiny: true });
        d.deco.curve([[13, 14], [16, 12], [15, 9], [11, 10], [10, 14], [13, 18]], 0.8, '#c06a88');
        d.tube([[7, 18], [4, 12], [6, 7]], 1.6, 1, '#5ab04a');
      } else if (v === 3) {   // Monochromon : tête grise cuirassée, corne d'ivoire
        d.ell(13, 15, 7, 5.5, '#7a7a86', 0, { shiny: true, tex: 0.3 });
        d.poly([[13, 9], [11, 2], [15, 9]], '#ece4cc'); d.deco.line(8, 13, 18, 13, 0.7, '#4a4a56');
        d.deco.circ(10, 15, 1, '#e8482a', { unlit: true }); d.deco.circ(16, 15, 1, '#e8482a', { unlit: true });
      } else if (v === 4) {   // Seadramon : tête de serpent de mer bleue, crête orange
        d.ell(13, 15, 6.5, 5, '#3a8ae0', 0, { shiny: true });
        d.poly([[8, 11], [10, 4], [12, 10]], '#f0902a'); d.poly([[14, 10], [16, 4], [18, 11]], '#f0902a');
        d.deco.ell(10.5, 14, 1.3, 0.9, '#ffffff', 0, { unlit: true }); d.deco.ell(15.5, 14, 1.3, 0.9, '#ffffff', 0, { unlit: true });
        d.deco.line(9, 18, 17, 18, 0.7, '#1a4a8a');
      } else {         // trophée générique : une coupe
        d.poly([[7, 8], [19, 8], [16, 18], [10, 18]], '#e8c040', { shiny: true });
        d.tube([[13, 18], [13, 22]], 1.4, 2, '#d8b030');
      }
    } },
  });
  OBJ.grandarbre.scale = 1.15;
})();
