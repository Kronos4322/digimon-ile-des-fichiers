'use strict';
// =====================================================================
//  TEMPLE ENSABLÉ (antre de Shellmon, chapitre 1) — thème « sandtemple » et objets dessinés :
//  pilier gravé, porte de temple, jarres canopes, pilier brisé, statue de gardien, tas de coquillages,
//  dalle de hiéroglyphes, prison de corail de Tai (fond + grille). Utilisés par maps/antre.js (et la ville en ruines).
// =====================================================================
(function () {
  const T = DW.World.THEMES;
  if (T && T.canyon && !T.sandtemple) T.sandtemple = { ...T.canyon, vignette: 'rgba(16,8,0,0.72)', particle: 'dust', sky: ['#2a1a0c', '#5a3a1c'], noRays: true,
    grass: ['#8e6c40', '#9c7a4a', '#ab8956', '#ba9862', '#c8a872', '#d6b884'], dirt: ['#7a5a34', '#88683e', '#967648', '#a48452', '#b2925e', '#c0a06a'],
    canopy: ['#2a1a0e', '#3e2814', '#54381c', '#6a4a26', '#826032', '#9a7840'], tall: ['#a88a50', '#c8a868', '#e8cc8c'],
    objMap: { ...T.canyon.objMap, tree: 'spire', bush: 'boulder', fern: 'pebbles' } };
  // pilier de temple : colonne de grès, bandes de hiéroglyphes, chapiteau en lotus
  DW.World.OBJ.templepillar = { w: 22, h: 52, n: 2, draw(d, v) {
    d.ell(11, 51, 9, 2, '#1a1008', 0, { flat: true });
    d.rect(2, 44, 18, 7, '#b8945a', { round: 0.15, tex: 0.3 });
    d.tube([[11, 46], [11, 12]], 7, 6.4, v ? '#c8a66e' : '#d2b27a', { tex: 0.25 });
    for (const y of [16, 26, 36]) { d.deco.rect(5, y, 12, 5, '#a8844e'); for (let k = 0; k < 4; k++) d.deco.rect(6.5 + k * 2.8, y + 1.4, 1.4, 2.2, ['#3a6ab0', '#c84a2a', '#2a8a6a', '#1a1a1a'][(k + y) % 4]); }
    d.poly([[1, 12], [21, 12], [17, 5], [5, 5]], '#e0c084', { tex: 0.2 });
    d.rect(0, 2, 22, 4, '#c8a66e', { round: 0.2 });
    if (v) d.deco.line(7, 20, 12, 40, 0.8, '#6a4a26');   // une fissure
  } };
  // v0 : vers les profondeurs (marches qui descendent dans le noir, lueur rouge) ; v1 : vers la surface (lumière du jour)
  DW.World.OBJ.templegate = { w: 56, h: 66, n: 2, lights: [[28, 44, 30]], draw(d, v) {
    const S = '#c8a66e', Sd = '#9a7a46', Sl = '#e2c48a';
    d.ell(28, 64, 24, 2.6, '#140a04', 0, { flat: true });
    // massif de pierre autour de la porte
    d.rect(2, 10, 52, 54, Sd, { round: 0.06, tex: 0.35 });
    // piliers
    for (const x of [4, 42]) { d.rect(x, 14, 10, 50, S, { round: 0.1, tex: 0.25 }); d.deco.rect(x + 2, 22, 6, 4, '#3a6ab0'); d.deco.rect(x + 2, 34, 6, 4, '#c84a2a'); d.deco.rect(x + 2, 46, 6, 4, '#2a8a6a'); }
    // linteau gravé : disque solaire ailé
    d.rect(0, 4, 56, 12, Sl, { round: 0.1, tex: 0.2 });
    d.deco.circ(28, 10, 4, '#e8a020', { unlit: true }); d.deco.poly([[14, 9], [24, 8], [24, 12], [16, 12]], '#3a6ab0'); d.deco.poly([[42, 9], [32, 8], [32, 12], [40, 12]], '#3a6ab0');
    // ouverture
    d.rect(15, 18, 26, 46, v ? '#f6e6b8' : '#0c0604', { round: 0.08 });
    if (v) { for (let k = 0; k < 6; k++) d.deco.rect(16, 56 - k * 6, 24, 3, k % 2 ? '#e8d4a0' : '#d8c08a', { unlit: true }); d.deco.rect(17, 20, 22, 12, '#fffbe8', { unlit: true }); }
    else { for (let k = 0; k < 5; k++) d.deco.rect(17 + k, 60 - k * 5, 22 - 2 * k, 3, ['#6a4a2a', '#4a3220', '#30200f', '#20140a', '#140c06'][k]); d.deco.ell(28, 32, 8, 6, 'rgba(255,90,40,0.35)', 0, { unlit: true }); }
    // marche de seuil
    d.rect(12, 60, 32, 5, Sl, { round: 0.3 });
  } };
  // ------------------------------------------------------------ décors du temple ensablé
  Object.assign(DW.World.OBJ, {
    // jarre canope (couvercle en tête de Digimon)
    urn: { w: 16, h: 24, n: 3, draw(d, v) {
      const c = ['#c8783a', '#3a7a8a', '#b8a070'][v];
      d.ell(8, 23, 6, 1.6, '#1a1008', 0, { flat: true });
      d.ell(8, 15, 6, 7.5, c, 0, { shiny: true, tex: 0.2 }); d.deco.rect(3, 12, 10, 2, '#e8c860');
      d.ell(8, 6, 4, 3.4, ['#e8a020', '#5ab0c8', '#d8c090'][v], 0, { shiny: true }); d.deco.circ(6.6, 5.6, 0.7, '#1a1a1a'); d.deco.circ(9.4, 5.6, 0.7, '#1a1a1a');
    } },
    // pilier brisé, tronçon couché à côté
    brokenpillar: { w: 30, h: 30, n: 1, draw(d) {
      d.ell(15, 28, 13, 2.2, '#1a1008', 0, { flat: true });
      d.tube([[9, 28], [9, 12]], 7, 6.4, '#c8a66e', { tex: 0.3 }); d.poly([[2, 13], [16, 9], [14, 15], [4, 16]], '#d8b880');
      d.tube([[16, 26], [28, 23]], 5, 5, '#b8945a', { tex: 0.3 }); d.deco.rect(5, 18, 8, 3, '#a8844e');
    } },
    // statue assise de gardien à tête de coquillage
    shellstatue: { w: 32, h: 50, n: 2, draw(d, v) {
      d.ell(16, 49, 14, 2.4, '#1a1008', 0, { flat: true });
      d.rect(3, 38, 26, 11, '#b8945a', { round: 0.1, tex: 0.3 });
      d.rect(8, 22, 16, 17, '#c8a66e', { round: 0.25, tex: 0.25 });
      d.tube([[10, 36], [10, 30]], 3, 3, '#d2b27a'); d.tube([[22, 36], [22, 30]], 3, 3, '#d2b27a');
      d.ell(16, 13, 10, 9, '#d8b07a', 0, { tex: 0.2 });
      for (let k = -2; k <= 2; k++) d.deco.line(16, 21, 16 + k * 4, 6, 0.9, '#9a7446');
      d.deco.circ(13, 15, 1.2, v ? '#40e0d0' : '#2a1a0a', { unlit: !!v }); d.deco.circ(19, 15, 1.2, v ? '#40e0d0' : '#2a1a0a', { unlit: !!v });
    } },
    // tas de coquillages et d'os (se traverse)
    shellpile: { w: 18, h: 10, n: 2, draw(d, v) {
      for (let k = 0; k < 6; k++) d.ell(3 + k * 2.6, 7 - (k % 2) * 2, 2.4, 1.7, ['#f0c8d8', '#e8d8b8', '#f8f0e0'][(k + v) % 3], 0, { shiny: true });
      d.deco.line(4, 6, 14, 5, 0.6, '#c09a7a');
    } },
    // dalle gravée contre la paroi (hiéroglyphes)
    hieroslab: { w: 26, h: 40, n: 2, draw(d, v) {
      d.rect(1, 2, 24, 37, '#c8a66e', { round: 0.08, tex: 0.3 });
      d.deco.rect(3, 4, 20, 33, '#b8945a');
      const G = ['#3a6ab0', '#c84a2a', '#2a8a6a', '#1a1a1a', '#e8a020'];
      for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) {
        const x = 6 + k * 6, y = 7 + r * 5, c = G[(r * 3 + k + v) % 5];
        if ((r + k + v) % 3 === 0) d.deco.circ(x + 1.5, y + 1.5, 1.4, c); else if ((r + k) % 3 === 1) d.deco.rect(x, y, 3, 3, c); else d.deco.poly([[x, y + 3], [x + 1.5, y], [x + 3, y + 3]], c);
      }
    } },
    // PRISON de Tai : fond (paroi de corail, chaînes, toit en coquille) et grille de corail au premier plan
    cageback: { w: 76, h: 62, n: 2, lights: [[38, 30, 26]], draw(d, v) {
      d.ell(38, 60, 34, 3, '#0a0604', 0, { flat: true });
      d.rect(4, 18, 68, 42, '#5a3a2a', { round: 0.1, tex: 0.4 });
      for (let k = 0; k < 7; k++) d.deco.ell(10 + k * 9.5, 26 + (k % 2) * 8, 3.2, 2.2, ['#e86a7a', '#f0a0b0', '#d84a5a'][k % 3]);
      // toit : grande coquille rose
      d.poly([[0, 22], [38, 0], [76, 22], [70, 26], [6, 26]], '#f0a8c0', { shiny: true, tex: 0.15 });
      for (let k = 1; k < 8; k++) d.deco.line(38, 2, k * 9.5, 24, 0.8, '#c87a98');
      // chaînes et anneaux
      for (const x of [18, 58]) { for (let y = 28; y < 48; y += 4) d.deco.ell(x, y, 1.6, 2.2, '#8a8a90'); d.deco.rect(x - 3, 47, 6, 3, '#6a6a70'); }
      // sceau lumineux (disparaît quand Tai est libre)
      if (!v) { d.deco.circ(38, 16, 6, '#40e0d0', { unlit: true }); d.deco.circ(38, 16, 3.4, '#e0fffa', { unlit: true }); }
    } },
    cagefront: { w: 76, h: 46, n: 2, draw(d, v) {
      d.rect(2, 38, 72, 7, '#7a4a3a', { round: 0.3, tex: 0.3 });
      // barreaux de corail (brisés et tordus une fois Tai libéré)
      for (let k = 0; k < 9; k++) {
        const x = 6 + k * 8, broken = v && k >= 3 && k <= 5;
        if (broken) { d.tube([[x, 40], [x + (k - 4) * 4, 28]], 2.4, 1.6, '#e86a7a'); continue; }
        d.tube([[x, 41], [x + Math.sin(k) * 1.5, 22], [x, 4]], 2.6, 2, ['#e86a7a', '#f08a9a', '#d8546a'][k % 3], { tex: 0.25 });
        d.deco.circ(x, 4, 1.8, '#f8c8d4');
      }
      d.rect(2, 2, 72, 5, '#c86a7a', { round: 0.4 });
    } },
  });
})();
