'use strict';
// =====================================================================
//  INTÉRIEURS (2) — meubles à thème (chaque maison est décorée selon l'élément de son habitant)
//  et mobilier de la maison du joueur. Posés via map.objects ; back = accroché au mur, walk = tapis.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const WOOD = '#9a6a3a', WOOD_D = '#5a3a1e', WOOD_L = '#c08a52';
  Object.assign(OBJ, {
    // ---------------------------------------------------------- Plante : pots fleuris, arbre en pot
    flowerpots: { w: 46, h: 28, n: 2, draw(d, v) {
      d.rect(1, 16, 44, 10, WOOD, { round: 0.2, tex: 0.25 }); d.deco.rect(1, 16, 44, 2, WOOD_L);
      const F = v ? ['#f06a8a', '#f0d040', '#a87af0'] : ['#f0a040', '#e04a4a', '#ffffff'];
      for (let k = 0; k < 3; k++) {
        const x = 8 + k * 15;
        d.rect(x - 5, 10, 10, 8, '#c8643a', { round: 0.25, shiny: true });
        for (let i = 0; i < 5; i++) d.circ(x - 4 + i * 2, 6 + (i % 2) * 2, 2, i % 2 ? '#4ab048' : F[(k + i) % 3]);
      }
    } },
    pottedtree: { w: 30, h: 50, n: 2, draw(d, v) {
      d.rect(8, 38, 14, 11, v ? '#3a6ab0' : '#b8643a', { round: 0.25, shiny: true });
      d.tube([[15, 39], [15, 22]], 2.4, 2, '#6a4a2a');
      for (const [x, y, r] of [[15, 14, 10], [8, 20, 7], [22, 20, 7], [15, 6, 6]]) d.circ(x, y, r, v ? '#3a9a5a' : '#5ab048', { tex: 0.3 });
      if (!v) for (const [x, y] of [[10, 12], [20, 16], [14, 22]]) d.deco.circ(x, y, 1.6, '#f0603a');
    } },
    // ---------------------------------------------------------- Électrique : ordinateur
    computer: { w: 44, h: 38, n: 1, lights: [[22, 12, 20, 'rgba(120,255,200,0.4)']], draw(d) {
      d.rect(2, 22, 40, 6, WOOD, { round: 0.2 }); d.tube([[6, 37], [6, 28]], 2, 2, WOOD_D); d.tube([[38, 37], [38, 28]], 2, 2, WOOD_D);
      d.rect(10, 2, 24, 18, '#d8d4c8', { round: 0.15, shiny: true }); d.deco.rect(12.5, 4.5, 19, 12, '#0e2a24');
      for (let k = 0; k < 4; k++) d.deco.rect(14, 6 + k * 2.6, 6 + (k * 5) % 11, 1, '#5aff9a', { unlit: true });
      d.rect(12, 20, 20, 3, '#c8c4b8', { round: 0.3 }); d.ell(36, 21, 2.4, 1.4, '#e8e4d8');
    } },
    // ---------------------------------------------------------- Eau : étagère à coquillages
    shellshelf: { w: 34, h: 30, n: 1, draw(d) {
      d.rect(1, 2, 32, 26, '#7ab8d8', { round: 0.1, tex: 0.2 }); d.deco.rect(3, 4, 28, 22, '#2a5a7a');
      for (const y of [13, 24]) d.deco.rect(3, y, 28, 1.6, '#a8d8f0');
      for (const [x, y, c] of [[8, 11, '#f8d8c8'], [17, 10, '#f0a8b8'], [26, 11, '#fff0d0'], [10, 22, '#e8c890'], [22, 21, '#f8f0f0']]) { d.ell(x, y, 3, 2.4, c, 0, { shiny: true }); d.deco.line(x - 2, y, x + 2, y, 0.4, 'rgba(0,0,0,0.25)'); }
    } },
    // ---------------------------------------------------------- Glace : tapis de fourrure
    furrug: { w: 70, h: 40, n: 1, draw(d) {
      d.blob([[6, 20], [14, 6], [35, 3], [56, 6], [64, 20], [56, 34], [35, 37], [14, 34]], '#f4f6fa', { tex: 0.5, flat: true });
      d.deco.blob([[14, 20], [20, 11], [35, 9], [50, 11], [56, 20], [50, 29], [35, 31], [20, 29]], '#dce6f0');
    } },
    // ---------------------------------------------------------- Ténèbres : chandelier
    candles: { w: 22, h: 40, n: 1, lights: [[11, 8, 20, 'rgba(255,200,120,0.6)']], draw(d) {
      d.ell(11, 38, 7, 2, '#3a2a3a'); d.tube([[11, 37], [11, 16]], 2, 1.4, '#c8a040', { shiny: true });
      d.tube([[4, 18], [11, 20], [18, 18]], 1.4, 1.4, '#c8a040');
      for (const x of [4, 11, 18]) { d.rect(x - 1.6, 10 - (x === 11 ? 2 : 0), 3.2, 7, '#f4f0e0', { round: 0.3 }); d.deco.ell(x, 8 - (x === 11 ? 2 : 0), 1.2, 2, '#ffb040', 0, { unlit: true }); }
    } },
    // ---------------------------------------------------------- Feu : poêle à bois
    woodstove: { w: 34, h: 46, n: 1, fire: [17, 32], lights: [[17, 32, 26]], smoke: [17, 0], draw(d) {
      d.tube([[17, 18], [17, 1]], 3, 3, '#3a3a40');
      d.rect(5, 18, 24, 26, '#3a3a40', { round: 0.2, shiny: true }); d.deco.rect(9, 26, 16, 12, '#1a1010');
      d.deco.ell(17, 33, 5, 4, '#ff8a20', 0, { unlit: true }); d.deco.ell(17, 34, 3, 2.4, '#ffe060', 0, { unlit: true });
      d.rect(3, 42, 28, 3, '#2a2a30', { round: 0.3 });
      for (let k = 0; k < 3; k++) d.tube([[26 + k * 2, 44], [31, 39 - k * 2]], 1.6, 1.6, '#8a5a2a');
    } },
    // ---------------------------------------------------------- Terre : tonneaux
    barrels: { w: 40, h: 30, n: 1, draw(d) {
      for (const [x, y] of [[11, 28], [29, 28], [20, 16]]) {
        d.rect(x - 8, y - 14, 16, 14, '#8a5a30', { round: 0.35, tex: 0.3 });
        for (const yy of [y - 11, y - 4]) d.deco.rect(x - 8, yy, 16, 1.4, '#4a4a50');
      }
    } },
    // ---------------------------------------------------------- Lumière : grand tableau (mur)
    painting: { w: 40, h: 28, n: 3, draw(d, v) {
      d.rect(1, 1, 38, 26, '#c8a040', { round: 0.1, shiny: true }); d.deco.rect(4, 4, 32, 20, ['#8ac8f0', '#f8d890', '#2a3a6a'][v]);
      if (v === 0) { d.deco.poly([[4, 24], [16, 12], [24, 18], [36, 8], [36, 24]], '#4a9a5a'); d.deco.circ(10, 9, 2.4, '#fff4c0', { unlit: true }); }
      else if (v === 1) { d.deco.circ(20, 13, 6, '#f0a030', { unlit: true }); d.deco.rect(4, 18, 32, 6, '#e0b060'); }
      else { for (let k = 0; k < 8; k++) d.deco.circ(7 + k * 4, 7 + (k * 7) % 12, 0.8, '#ffffff', { unlit: true }); d.deco.circ(28, 9, 3, '#f0f0c0', { unlit: true }); }
    } },
    // ---------------------------------------------------------- Air : nid douillet
    nest: { w: 40, h: 24, n: 1, draw(d) {
      d.ell(20, 16, 18, 7, '#a8844a', 0, { tex: 0.6 }); d.deco.ell(20, 14, 13, 4, '#6a4a2a');
      for (const [x, c] of [[15, '#f8f4ec'], [22, '#f0e8d8'], [27, '#fff8f0']]) d.ell(x, 12, 3, 3.6, c, 0, { shiny: true });
      for (let k = 0; k < 3; k++) d.ell(6 + k * 14, 21, 4, 1.2, '#f06a8a', 0.4 * k);
    } },
    // ---------------------------------------------------------- pour tous : coffre à jouets, fenêtre à rideaux
    toybox: { w: 30, h: 26, n: 1, draw(d) {
      d.rect(2, 10, 26, 15, '#e05a5a', { round: 0.2, shiny: true }); d.deco.rect(2, 10, 26, 3, '#f0d040');
      d.circ(9, 8, 4, '#4a8ae0', { shiny: true }); d.rect(16, 3, 7, 7, '#5ac070', { round: 0.2 }); d.deco.circ(24, 7, 2, '#f0d040');
    } },
    curtains: { w: 40, h: 34, n: 2, lights: [[20, 14, 22]], draw(d, v) {
      d.rect(8, 4, 24, 24, '#6a4a30', { round: 0.08 }); d.deco.rect(10, 6, 20, 20, '#bfe2f2'); d.deco.line(20, 6, 20, 26, 1, '#6a4a30'); d.deco.line(10, 16, 30, 16, 1, '#6a4a30');
      const c = v ? '#d84a6a' : '#4a7ad8';
      d.blob([[2, 2], [10, 2], [11, 32], [4, 32]], c, { tex: 0.2 }); d.blob([[30, 2], [38, 2], [36, 32], [29, 32]], c, { tex: 0.2 });
      d.rect(0, 0, 40, 3, '#c8a040', { round: 0.4 });
    } },
  });
})();
