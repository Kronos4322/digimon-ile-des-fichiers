'use strict';
// =====================================================================
//  INTÉRIEURS — meubles (maison de Jijimon et futures maisons) ; lit, armoire, bibliothèque, frigo... : images du
//  joueur (gfx/textures.js), ici seulement leur boîte et leur secours
//  Posés via map.objects ; back = accroché au mur, walk = tapis.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const WOOD = '#9a6a3a', WOOD_D = '#5a3a1e', WOOD_L = '#c08a52';

  Object.assign(OBJ, {
    // cheminée en pierre (3 cases, adossée au mur)
    fireplace: { w: 50, h: 52, n: 1, fire: [25, 40], lights: [[25, 40, 40]], draw(d) {
      d.rect(2, 8, 46, 44, '#a8a296', { round: 0.15, tex: 0.35 });
      for (let y = 12; y < 50; y += 6) for (let x = 2 + ((y / 6) % 2) * 5; x < 48; x += 10) d.deco.rect(x, y, 0.8, 6, '#7a746a');
      for (let y = 12; y < 50; y += 6) d.deco.line(2, y, 48, y, 0.8, '#7a746a');
      d.rect(0, 4, 50, 6, '#7a5230', { round: 0.3, tex: 0.25 });
      d.deco.rect(0, 4, 50, 1.6, '#a87a4a');
      // foyer
      d.deco.ell(25, 34, 13, 10, '#2a1a12'); d.deco.rect(12, 34, 26, 16, '#2a1a12');
      d.deco.ell(25, 47, 10, 3, '#4a2e1a');
      d.tube([[16, 47], [33, 44]], 3, 3, '#7a4a28'); d.tube([[18, 44], [34, 48]], 3, 3, '#6a3e20');
      d.deco.ell(25, 42, 7, 6, '#ff7a20', 0, { unlit: true }); d.deco.ell(25, 43, 4.6, 4, '#ffc040', 0, { unlit: true }); d.deco.ell(25, 44, 2.4, 2, '#fff0a0', 0, { unlit: true });
      // objets sur le manteau
      d.rect(6, 0, 5, 5, '#5ab8f0', { round: 0.4, shiny: true }); d.rect(38, -1, 7, 6, '#e8d8b0', { round: 0.2 }); d.deco.circ(41.5, 2, 1.6, '#4a2e16');
    } },
    bookshelf: { w: 34, h: 46, n: 2, draw: DW.World.secours.boite(34, 46) },
    bed: { w: 30, h: 44, n: 1, draw: DW.World.secours.boite(30, 44) },
    table: { w: 40, h: 28, n: 1, draw(d) {
      d.tube([[8, 26], [8, 14]], 2.4, 2.4, WOOD_D, { far: true }); d.tube([[32, 26], [32, 14]], 2.4, 2.4, WOOD_D, { far: true });
      d.ell(20, 12, 19, 9, WOOD, 0, { tex: 0.2 });
      d.deco.ell(20, 11, 15, 6, '#f4ece0'); d.deco.ell(20, 11, 13, 5, '#fff8ee');
      d.ell(13, 9, 3.6, 1.8, '#e8e0d0'); d.deco.ell(13, 8.6, 2.4, 1, '#c84838');
      d.rect(22, 3, 5, 6, '#e8d8b0', { round: 0.3 }); d.deco.rect(23, 3.6, 3, 1.4, '#9ac850');
      d.ell(28, 10, 3, 2, '#d8c8a0'); d.deco.ell(28, 9.4, 2, 1, '#8a5a2a');
    } },
    stool: { w: 14, h: 16, n: 1, draw: DW.World.secours.boite(14, 16) },
    rug: { w: 66, h: 42, n: 1, draw: DW.World.secours.boite(66, 42) },
    plant: { w: 20, h: 32, n: 2, draw: DW.World.secours.buisson(20, 32) },
    chest: { w: 24, h: 20, n: 1, draw(d) {
      d.rect(2, 8, 20, 11, WOOD, { round: 0.1, tex: 0.3 });
      d.blob([[2, 9], [3, 3], [12, 1], [21, 3], [22, 9]], '#a87442', { tex: 0.2 });
      d.deco.rect(2, 8, 20, 1.6, '#c8a040'); d.deco.rect(7, 2, 1.6, 17, '#c8a040'); d.deco.rect(16, 2, 1.6, 17, '#c8a040');
      d.deco.rect(10.6, 8, 3, 4, '#e8c050', { unlit: true });
    } },
    stove: { w: 36, h: 36, n: 1, smoke: [26, 2], draw(d) {
      d.rect(2, 14, 32, 21, '#8a5a32', { round: 0.08, tex: 0.25 });
      d.deco.rect(5, 20, 12, 12, '#6a4222'); d.deco.rect(19, 20, 12, 12, '#6a4222'); d.deco.circ(15, 26, 0.9, '#e8c050'); d.deco.circ(21, 26, 0.9, '#e8c050');
      d.rect(1, 11, 34, 4, '#c8b8a0', { round: 0.3 });
      d.ell(10, 9, 6, 3.6, '#4a4a52', 0, { shiny: true }); d.deco.ell(10, 7.6, 4.4, 1.6, '#e8e0d0');
      d.ell(26, 8, 5, 5, '#7a7a82', 0, { shiny: true }); d.tube([[30, 7], [34, 4]], 1.6, 1, '#7a7a82');
      d.rect(22, 1, 8, 3, '#5a5a62', { round: 0.4 });
    } },
    // éléments muraux (back)
    window: { w: 30, h: 24, n: 2, lights: [[15, 12, 22]], draw(d, v) {
      d.rect(1, 1, 28, 22, WOOD_D, { round: 0.1 });
      d.deco.rect(3, 3, 24, 18, v ? '#1a2a5a' : '#8ad0f0');
      if (!v) { d.deco.rect(3, 15, 24, 6, '#5ab05a'); d.deco.circ(9, 15, 4, '#4aa046'); d.deco.circ(20, 14, 5, '#3e9a40'); d.deco.rect(5, 5, 6, 3, '#d8f4ff', { unlit: true }); }
      d.deco.line(15, 3, 15, 21, 1.2, WOOD_D); d.deco.line(3, 12, 27, 12, 1.2, WOOD_D);
      d.deco.rect(0, 20, 30, 3, WOOD_L);
      d.deco.poly([[3, 3], [9, 3], [5, 21], [3, 21]], '#e85a5a'); d.deco.poly([[27, 3], [21, 3], [25, 21], [27, 21]], '#e85a5a');
    } },
    shelf: { w: 32, h: 18, n: 1, draw: DW.World.secours.boite(32, 18) },
    frame: { w: 24, h: 20, n: 1, draw: DW.World.secours.boite(24, 20) },
    clock: { w: 16, h: 40, n: 1, draw(d) {
      d.rect(2, 8, 12, 31, WOOD, { round: 0.15, tex: 0.25 });
      d.circ(8, 8, 7, '#7a4a28');
      d.deco.circ(8, 8, 5, '#f4ecd8'); d.deco.line(8, 8, 8, 4.6, 0.8, '#2a1a10'); d.deco.line(8, 8, 10.6, 9, 0.8, '#2a1a10');
      d.deco.rect(5, 18, 6, 16, '#3a2412'); d.deco.line(8, 18, 8, 29, 0.6, '#c8a040'); d.deco.circ(8, 30, 2, '#e8c050', { unlit: true });
    } },
    staff: { w: 14, h: 40, n: 1, draw(d) {
      d.tube([[7, 39], [7, 10]], 2.2, 2, '#8a5a32', { tex: 0.25 });
      d.circ(7, 7, 5, '#5ae0f0', { shiny: true }); d.deco.circ(5.6, 5.6, 1.4, '#e8ffff', { unlit: true });
      d.tube([[3, 12], [7, 10], [11, 12]], 1.4, 1.4, '#c8a040');
    } },
    // ---------------------------------------------------------- commerces
    // comptoir (4 cases) : v0 bazar (marchandises), v1 restaurant (assiettes), v2 serre (pots)
    counter: { w: 66, h: 26, n: 3, draw(d, v) {
      d.rect(1, 11, 64, 14, WOOD, { round: 0.08, tex: 0.25 });
      for (let x = 9; x < 64; x += 8) d.deco.line(x, 14, x, 25, 0.7, WOOD_D);
      d.rect(0, 8, 66, 5, WOOD_L, { round: 0.3 }); d.deco.rect(0, 8, 66, 1.4, '#e0b078');
      if (v === 0) {
        d.ell(10, 7, 5, 3, '#b04a2a'); d.deco.circ(6, 6, 1.2, '#fff4e0', { unlit: true });
        for (const [x, c] of [[24, '#e84040'], [31, '#3a8ae8']]) { d.circ(x, 6.6, 3, '#f4f0ea'); d.deco.ell(x, 5.4, 2.8, 1.4, c); }
        d.rect(40, 0, 5, 8, '#5ab8f0', { round: 0.4, shiny: true }); d.rect(47, 1, 5, 7, '#4ac878', { round: 0.4, shiny: true });
        d.rect(56, 2, 7, 6, '#c8a040', { round: 0.2 }); d.deco.circ(59.5, 5, 1.4, '#fff070', { unlit: true });
      } else if (v === 1) {
        for (const x of [12, 30, 48]) { d.ell(x, 7, 6, 2.6, '#f4f0e8'); d.deco.ell(x, 6.6, 3.4, 1.4, ['#e8a040', '#b04a2a', '#7ac860'][x % 3]); }
        d.rect(58, 0, 5, 9, '#8a4ab0', { round: 0.4, shiny: true });
      } else {
        for (const x of [8, 22, 36, 50]) { d.poly([[x - 4, 7], [x + 4, 7], [x + 3, 11], [x - 3, 11]], '#c06a3a'); d.circ(x, 3.6, 3.6, '#4aa046', { tex: 0.4 }); d.deco.circ(x - 1, 2.6, 1, ['#ff8ac0', '#fff070', '#ffffff'][x % 3], { unlit: true }); }
      }
    } },
    sacks: { w: 26, h: 22, n: 1, draw: DW.World.secours.boite(26, 22) },
    tatami: { w: 66, h: 50, n: 1, draw(d) {
      d.rect(1, 1, 64, 48, '#b8c878', { flat: true });
      for (const [x, y, w, h] of [[1, 1, 32, 16], [33, 1, 32, 16], [1, 17, 16, 32], [17, 17, 32, 16], [49, 17, 16, 32], [17, 33, 32, 16]]) { d.deco.rect(x, y, w, h, '#3a5a2a'); d.deco.rect(x + 1, y + 1, w - 2, h - 2, '#c8d888'); for (let k = 3; k < (w > h ? h : w) - 2; k += 3) w > h ? d.deco.line(x + 2, y + k, x + w - 2, y + k, 0.4, '#a8b868') : d.deco.line(x + k, y + 2, x + k, y + h - 2, 0.4, '#a8b868'); }
    } },
    scroll: { w: 18, h: 34, n: 2, draw(d, v) {
      d.rect(1, 1, 16, 3, WOOD_D, { round: 0.4 }); d.rect(1, 30, 16, 3, WOOD_D, { round: 0.4 });
      d.rect(3, 3, 12, 27, '#f4ecd8');
      if (v) { d.deco.circ(9, 16, 4.6, '#e04040'); d.deco.poly([[10, 11.6], [7, 16.6], [9, 16.6], [8, 20.4], [11.6, 15], [9.4, 15]], '#ffe040', { unlit: true }); }
      else for (const y of [8, 14, 20, 25]) d.deco.line(7 + (y % 3), y, 11, y + 2, 1.2, '#2a1a10');
    } },
    dtable: { w: 36, h: 32, n: 2, draw(d, v) {
      d.ell(5, 24, 4, 3, '#e05a5a'); d.ell(31, 24, 4, 3, '#e05a5a');
      d.tube([[18, 30], [18, 16]], 3, 3, WOOD_D);
      d.ell(18, 14, 13, 6, v ? '#f4ecf8' : WOOD_L, 0, { tex: 0.15 });
      d.ell(13, 12, 4, 1.8, '#f4f0e8'); d.deco.ell(13, 11.6, 2.4, 1, '#e8a040');
      d.rect(21, 7, 3, 6, '#8a4ab0', { round: 0.4, shiny: true }); d.deco.circ(22.5, 6.4, 1.4, '#ff8ac0', { unlit: true });
    } },
    oven: { w: 44, h: 48, n: 1, fire: [22, 36], lights: [[22, 36, 30]], smoke: [33, 2], draw: DW.World.secours.boite(44, 48) },
    pots: { w: 40, h: 28, n: 1, draw(d) {
      d.rect(1, 14, 38, 4, WOOD_L, { round: 0.3 }); d.tube([[4, 27], [4, 17]], 2, 2, WOOD_D); d.tube([[36, 27], [36, 17]], 2, 2, WOOD_D);
      for (const [x, c] of [[8, '#ff8ac0'], [20, '#fff070'], [32, '#b48aff']]) { d.poly([[x - 4, 9], [x + 4, 9], [x + 3, 14], [x - 3, 14]], '#c06a3a'); d.circ(x, 5, 4.4, '#3e9a40', { tex: 0.4 }); d.deco.circ(x - 1.4, 3.6, 1.2, c, { unlit: true }); d.deco.circ(x + 1.6, 5.6, 1.1, c, { unlit: true }); }
    } },

    // ---------------------------------------------------------- mobilier des maisons de la ville (v = variante de couleur)
    // canapé moelleux (3 cases)
    sofa: { w: 50, h: 32, n: 3, draw(d, v) {
      const col = ['#c85a5a', '#4a7ac8', '#5aa868'][v], lt = ['#e88080', '#7aa8e8', '#88cc90'][v];
      d.rect(3, 4, 44, 14, col, { round: 0.35, tex: 0.15 });
      d.rect(1, 12, 48, 16, col, { round: 0.3, tex: 0.15 });
      d.rect(6, 13, 18, 8, lt, { round: 0.4 }); d.rect(26, 13, 18, 8, lt, { round: 0.4 });
      d.rect(0, 10, 7, 18, col, { round: 0.45 }); d.rect(43, 10, 7, 18, col, { round: 0.45 });
      d.deco.circ(12, 8, 2.6, '#fff4d8'); d.deco.circ(38, 8, 2.6, '#ffe070');
      d.tube([[5, 31], [5, 28]], 1.4, 1.4, WOOD_D); d.tube([[45, 31], [45, 28]], 1.4, 1.4, WOOD_D);
    } },
    armchair: { w: 24, h: 28, n: 2, draw(d, v) {
      const col = ['#c8904a', '#8a5ab8'][v];
      d.rect(3, 2, 18, 14, col, { round: 0.4, tex: 0.15 });
      d.rect(2, 11, 20, 13, col, { round: 0.3 }); d.rect(5, 12, 14, 6, col, { round: 0.4 });
      d.rect(0, 9, 5, 15, col, { round: 0.45 }); d.rect(19, 9, 5, 15, col, { round: 0.45 });
      d.tube([[4, 27], [4, 24]], 1.3, 1.3, WOOD_D); d.tube([[20, 27], [20, 24]], 1.3, 1.3, WOOD_D);
    } },
    // vieux poste de télévision (comme dans Digimon World), écran allumé
    crttv: { w: 32, h: 36, n: 1, lights: [[16, 12, 18, 'rgba(140,200,255,0.5)']], draw(d) {
      d.rect(2, 22, 28, 13, WOOD, { round: 0.1, tex: 0.3 }); d.deco.rect(5, 25, 10, 8, WOOD_D); d.deco.rect(17, 25, 10, 8, WOOD_D);
      d.rect(4, 3, 24, 20, '#8a8a92', { round: 0.2, shiny: true });
      d.deco.rect(6, 5, 16, 14, '#1a2a3a'); d.deco.rect(7, 6, 14, 12, '#5ab8e8', { unlit: true });
      d.deco.circ(14, 12, 3, '#ffd060', { unlit: true }); d.deco.rect(8, 15, 12, 2, '#4ac878', { unlit: true });
      d.deco.circ(25, 8, 1.2, '#3a3a42'); d.deco.circ(25, 12, 1.2, '#3a3a42');
      d.deco.line(10, 3, 6, -3, 0.7, '#5a5a62'); d.deco.line(20, 3, 25, -3, 0.7, '#5a5a62');
    } },
    // aquarium éclairé
    aquarium: { w: 42, h: 36, n: 1, lights: [[21, 14, 20, 'rgba(100,190,255,0.45)']], draw: DW.World.secours.boite(42, 36) },
    piano: { w: 46, h: 42, n: 1, draw(d) {
      d.rect(3, 2, 40, 26, '#2a2028', { round: 0.08, shiny: true });
      d.rect(1, 24, 44, 8, '#2a2028', { round: 0.2 });
      d.deco.rect(4, 25, 38, 4, '#f4f0e8'); for (let x = 6; x < 42; x += 3.4) d.deco.rect(x, 25, 1.6, 2.4, '#1a1418');
      d.tube([[5, 41], [5, 32]], 1.6, 1.6, '#2a2028'); d.tube([[41, 41], [41, 32]], 1.6, 1.6, '#2a2028');
      d.deco.rect(16, 8, 14, 9, '#f4ece0'); for (let y = 10; y < 16; y += 2) d.deco.line(17, y, 29, y, 0.5, '#5a5a62');
      d.deco.circ(10, 10, 2, '#d8b040', { unlit: true });
    } },
    // cuisine : plan de travail, évier, placards (4 cases, contre le mur)
    kitchen: { w: 66, h: 44, n: 2, draw(d, v) {
      const doors = ['#f0e8d8', '#9ac8e0'][v];
      d.rect(1, 2, 64, 12, doors, { round: 0.05 }); for (const x of [2, 18, 34, 50]) { d.deco.rect(x + 1, 3, 13, 9, doors); d.deco.circ(x + 12, 8, 0.8, '#8a8a92'); }
      d.rect(1, 22, 64, 21, doors, { round: 0.05, tex: 0.08 });
      for (const x of [2, 18, 34, 50]) { d.deco.rect(x + 1, 26, 13, 15, '#ffffff'); d.deco.circ(x + 12, 33, 0.9, '#8a8a92'); }
      d.rect(0, 19, 66, 5, '#c8b8a0', { round: 0.3 });
      d.deco.ell(22, 20.5, 8, 2, '#9aa8b8'); d.tube([[22, 19], [22, 15], [25, 15]], 1, 0.9, '#b8c0c8');
      d.ell(46, 18, 5, 2.6, '#4a4a52', 0, { shiny: true }); d.ell(56, 17, 4, 3, '#c84838', 0, { shiny: true });
      d.deco.rect(5, 15, 4, 4, '#ffd060'); d.deco.rect(10, 16, 3, 3, '#5ab0f0');
    } },
    fridge: { w: 22, h: 46, n: 1, draw: DW.World.secours.boite(22, 46) },
    wardrobe: { w: 34, h: 50, n: 2, draw: DW.World.secours.boite(34, 50) },
    // bureau avec ordinateur (terminal de Digivice)
    desk: { w: 42, h: 38, n: 1, lights: [[26, 12, 16, 'rgba(120,255,180,0.45)']], draw: DW.World.secours.boite(42, 38) },
    floorlamp: { w: 16, h: 46, n: 1, lights: [[8, 8, 30]], draw: DW.World.secours.boite(16, 46) },
    bigplant: { w: 26, h: 46, n: 1, draw: DW.World.secours.buisson(26, 46) },
    // grand tapis rectangulaire (on marche dessus)
    bigrug: { w: 82, h: 50, n: 3, draw: DW.World.secours.boite(82, 50) },
    sidetable: { w: 18, h: 26, n: 1, draw: DW.World.secours.boite(18, 26) },
    // affiche de Digimon (murale)
    poster: { w: 24, h: 30, n: 3, draw(d, v) {
      const [bg, fg] = [['#ffe8b0', '#e86a2a'], ['#d8ecff', '#3a7ad8'], ['#e8ffd8', '#3aa848']][v];
      d.rect(1, 1, 22, 28, bg, { round: 0.05 }); d.deco.rect(1, 1, 22, 2, '#c8b8a0');
      d.deco.circ(12, 13, 6, fg); d.deco.ell(9.6, 11, 1.6, 2, '#ffffff'); d.deco.ell(14.4, 11, 1.6, 2, '#ffffff');
      d.deco.poly([[6, 9], [8, 3], [10, 8]], fg); d.deco.poly([[18, 9], [16, 3], [14, 8]], fg);
      d.deco.rect(4, 22, 16, 2, fg); d.deco.rect(6, 25, 12, 1.4, '#8a7a6a');
    } },
    // coussin de sol
    cushion: { w: 18, h: 14, n: 3, draw: DW.World.secours.boite(18, 14) },
  });
})();
