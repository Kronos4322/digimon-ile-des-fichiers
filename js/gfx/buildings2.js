'use strict';
// =====================================================================
//  BÂTIMENTS (2) : escaliers d'intérieur, boulangerie, pâtisserie (les toilettes : une image, gfx/textures.js)
//  Repère : sprite posé sur le bas de son emprise (voir World.prepare).
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const sign = (...a) => DW.World.signText && DW.World.signText(...a);
  Object.assign(OBJ, {
    // ------------------------------------------------------------ escaliers d'intérieur (porte dans le mur du fond)
    stairsup: { w: 34, h: 40, n: 1, draw(d) {
      d.rect(2, 2, 30, 38, '#4a3a2e', { round: 0.05 });
      for (let k = 0; k < 6; k++) { d.rect(4, 6 + k * 5.6, 26, 5.6, k % 2 ? '#a07a50' : '#b88c5c', { tex: 0.2 }); d.deco.line(4, 6 + k * 5.6, 30, 6 + k * 5.6, 0.6, '#6a4a30'); }
      d.tube([[3, 38], [3, 4]], 1.6, 1.6, '#6a4a30'); d.tube([[31, 38], [31, 4]], 1.6, 1.6, '#6a4a30');
      d.poly([[17, 0], [22, 5], [12, 5]], '#ffe070', { unlit: true });
    } },
    stairsdown: { w: 34, h: 40, n: 1, draw(d) {
      d.rect(2, 2, 30, 38, '#2a2420', { round: 0.05 });
      for (let k = 0; k < 6; k++) d.rect(4 + k, 6 + k * 5.6, 26 - k * 2, 5.6, k % 2 ? '#5a4a3a' : '#6a5a48', { tex: 0.25 });
      d.deco.rect(4, 34, 26, 6, '#0e0a08');
      d.poly([[12, 1], [22, 1], [17, 6]], '#7ad0ff', { unlit: true });
    } },
    // ------------------------------------------------------------ boulangerie (4 × 3 cases) et pâtisserie
    bakery: { w: 92, h: 100, n: 1, smoke: [70, 6], lights: [[30, 74, 26], [62, 74, 26]], draw(d) { shopHouse(d, '#e8d8b8', '#b86a3a', '#7a4424', 'PAIN', '#c88a3a'); bread(d); } },
    patisserie: { w: 92, h: 100, n: 1, lights: [[30, 74, 26], [62, 74, 26]], draw(d) { shopHouse(d, '#f8e8f0', '#e07aa8', '#a84a78', 'GÂTEAUX', '#e05a8a'); cakes(d); } },
  });
  // façade de boutique : murs, toit, auvent rayé, vitrines, porte, enseigne
  function shopHouse(d, wall, roof, roofD, label, awning) {
    d.rect(6, 40, 80, 58, wall, { round: 0.03, tex: 0.15 });
    for (let y = 46; y < 96; y += 6) d.deco.line(6, y, 86, y, 0.4, 'rgba(0,0,0,0.08)');
    d.poly([[0, 44], [46, 8], [92, 44]], roof, { shiny: true });
    for (let k = 0; k < 5; k++) d.deco.line(6 + k, 42 - k * 6.4, 86 - k, 42 - k * 6.4, 0.8, roofD);
    d.rect(64, 10, 10, 18, '#9a8a7a', { round: 0.1, tex: 0.2 }); d.deco.rect(62, 8, 14, 3, '#7a6a5a');   // cheminée
    // enseigne
    d.rect(18, 45, 56, 11, '#5a3a24', { round: 0.2 }); sign(d, label, Math.round(46 - label.length * 2), 48, '#ffe8a0', 1);
    // auvent rayé
    for (let k = 0; k < 8; k++) d.poly([[8 + k * 9.5, 60], [17.5 + k * 9.5, 60], [17.5 + k * 9.5, 66], [8 + k * 9.5, 66]], k % 2 ? '#ffffff' : awning);
    d.deco.line(8, 66, 84, 66, 0.8, 'rgba(0,0,0,0.25)');
    // vitrines et porte
    for (const x of [12, 58]) { d.rect(x, 68, 22, 18, '#6a4a30', { round: 0.08 }); d.rect(x + 1.6, 69.6, 18.8, 14.8, '#bfe2f2', { shiny: true }); }
    d.rect(38, 68, 16, 30, '#7a4a2a', { round: 0.08 }); d.rect(40, 70, 12, 12, '#d8eef8', { shiny: true }); d.deco.circ(50, 86, 1, '#e8c860', { unlit: true });
  }
  function bread(d) {
    for (const [x, y] of [[16, 80], [24, 80], [62, 80], [70, 80]]) { d.ell(x, y, 3.4, 2, '#d8964a', 0.3, { shiny: true }); d.deco.line(x - 1.6, y - 0.6, x + 1.2, y + 0.4, 0.4, '#a8642a'); }
    d.ell(20, 76, 6, 1.8, '#e0a860', -0.1, { shiny: true }); d.ell(66, 76, 6, 1.8, '#e0a860', 0.1, { shiny: true });
  }
  function cakes(d) {
    for (const [x, c] of [[17, '#ffffff'], [27, '#f08ab0'], [63, '#8a5a3a'], [73, '#f8e080']]) {
      d.rect(x - 3.4, 77, 6.8, 5, '#f4e0c8', { round: 0.2 }); d.rect(x - 3.4, 75, 6.8, 2.6, c, { round: 0.3 }); d.circ(x, 74.4, 1, '#e03a4a');
    }
  }
  // ------------------------------------------------------------ façades : boîte aux lettres + lanterne, jardinière fleurie
  // v = couleur de l'élément de l'habitant (0 Feu, 1 Eau, 2 Plante, 3 Électrique, 4 Glace/Air, 5 Ténèbres, 6 Lumière/neutre)
  const MAILCOL = ['#d84a3a', '#3a7ad8', '#4aa046', '#e8c030', '#8ad0f0', '#7a4aa8', '#f0e8d0'];
  Object.assign(OBJ, {
    housebox: { w: 18, h: 40, n: 7, lights: [[9, 6, 24, 'rgba(255,210,120,0.6)']], draw(d, v) {
      d.tube([[9, 39], [9, 18]], 1.6, 1.6, '#5a4030');
      d.rect(3, 14, 12, 9, MAILCOL[v], { round: 0.35, shiny: true }); d.deco.rect(5, 17, 8, 1.2, '#2a2020');
      d.rect(13, 10, 1.4, 6, '#d83a2a'); d.rect(13, 10, 3.4, 2.4, '#d83a2a');
      // petite lanterne au sommet
      d.rect(6, 2, 6, 8, '#3a3440', { round: 0.2 }); d.deco.rect(7, 3.4, 4, 5, '#ffe090', { unlit: true }); d.rect(5, 1, 8, 1.6, '#2a2430');
    } },
    planter: { w: 34, h: 22, n: 3, draw: DW.World.secours.buisson(34, 22) },
  });
})();
