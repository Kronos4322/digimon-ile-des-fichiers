'use strict';
// =====================================================================
//  ÉCUSSONS ET DONJONS SECRETS — graphismes
//  - crest (n = 7) : l'écusson seul (icônes du journal, du menu, pièces d'or des piédestaux)
//  - crestgate : portail ancien envahi de lierre, gravé du symbole de l'écusson (entrée du donjon, dans une région)
//  - pedestal : piédestal où repose un écusson ; brazier : vasque à allumer (énigme d'ordre)
//  - floorplate : dalle à presser (énigme des dalles) ; datagate : barrière de données qui ferme un passage
//  Les symboles sont des créations simples (soleil, cœur, goutte...), pas des copies des écussons officiels.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const KEYS = ['tai', 'matt', 'sora', 'izzy', 'mimi', 'joe', 'tk'];
  const col = k => (DW.HEROES && DW.HEROES[k] ? DW.HEROES[k].crestCol : '#c8d0e0');
  // symbole d'un écusson, centré en (x, y), rayon r
  function glyph(d, k, x, y, r, c, o = { unlit: true }) {
    if (k === 'tai') {   // Courage : soleil à rayons
      d.deco.circ(x, y, r * 0.42, c, o);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; d.deco.poly([[x + Math.cos(a - 0.2) * r * 0.5, y + Math.sin(a - 0.2) * r * 0.5], [x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a + 0.2) * r * 0.5, y + Math.sin(a + 0.2) * r * 0.5]], c, o); }
    } else if (k === 'matt') {   // Amitié : étoile à quatre branches arrondies
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; d.deco.ell(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * (i % 2 ? 0.26 : 0.5), r * (i % 2 ? 0.5 : 0.26), c, 0, o); }
      d.deco.circ(x, y, r * 0.3, c, o);
    } else if (k === 'sora') {   // Amour : cœur
      d.deco.circ(x - r * 0.38, y - r * 0.2, r * 0.42, c, o); d.deco.circ(x + r * 0.38, y - r * 0.2, r * 0.42, c, o);
      d.deco.poly([[x - r * 0.8, y - r * 0.05], [x + r * 0.8, y - r * 0.05], [x, y + r * 0.85]], c, o);
    } else if (k === 'izzy') {   // Savoir : œil cerclé de points
      d.deco.ell(x, y, r * 0.8, r * 0.48, c, 0, o); d.deco.circ(x, y, r * 0.26, '#ffffff', o);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; d.deco.circ(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.12, c, o); }
    } else if (k === 'mimi') {   // Pureté : goutte
      d.deco.circ(x, y + r * 0.25, r * 0.55, c, o); d.deco.poly([[x - r * 0.5, y + r * 0.05], [x, y - r * 0.9], [x + r * 0.5, y + r * 0.05]], c, o);
      d.deco.circ(x - r * 0.18, y + r * 0.15, r * 0.14, '#ffffff', o);
    } else if (k === 'joe') {    // Sincérité : croix en losanges
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, ex = x + Math.cos(a) * r * 0.62, ey = y + Math.sin(a) * r * 0.62; d.deco.poly([[ex, ey - r * 0.32], [ex + r * 0.32, ey], [ex, ey + r * 0.32], [ex - r * 0.32, ey]], c, o); }
      d.deco.circ(x, y, r * 0.24, c, o);
    } else {                     // Espoir : étoile à huit branches fines
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, l = i % 2 ? r * 0.55 : r; d.deco.poly([[x + Math.cos(a + 1.57) * r * 0.12, y + Math.sin(a + 1.57) * r * 0.12], [x + Math.cos(a) * l, y + Math.sin(a) * l], [x - Math.cos(a + 1.57) * r * 0.12, y - Math.sin(a + 1.57) * r * 0.12]], c, o); }
    }
  }

  Object.assign(OBJ, {
    // ---------------------------------------------------------- écusson seul (icône), v = index dans KEYS
    crest: { w: 22, h: 26, n: 7, draw(d, v) {
      const k = KEYS[v], c = col(k);
      d.rect(2, 1, 18, 22, '#f0d878', { round: 0.35, shiny: true });   // plaque d'or
      d.deco.rect(4, 3, 14, 18, '#3a2a1a');
      glyph(d, k, 11, 12, 6, c);
      d.tube([[11, 1], [11, -3]], 0.7, 0.7, '#b0a070');
    } },
    // ---------------------------------------------------------- portail ancien gravé (pièce maîtresse d'une région, 5×4)
    crestgate: { w: 92, h: 92, n: 7, draw(d, v) {
      const k = KEYS[v], c = col(k), S = '#8a8478', Sd = '#5e5850', Sl = '#b4ac9e', Ivy = '#3e8a3a';
      d.ell(46, 88, 42, 4, '#2a2418', 0, { flat: true });
      d.rect(4, 70, 84, 16, Sd, { round: 0.1, tex: 0.4 });                            // marches
      d.deco.rect(4, 70, 84, 2, Sl);
      d.rect(8, 18, 18, 56, S, { round: 0.08, tex: 0.4 }); d.rect(66, 18, 18, 56, S, { round: 0.08, tex: 0.4 });   // piliers
      d.rect(2, 8, 88, 16, S, { round: 0.15, tex: 0.4 }); d.deco.rect(2, 8, 88, 3, Sl);   // linteau
      d.rect(26, 24, 40, 50, '#120e18');                                                // passage sombre
      d.deco.rect(28, 26, 36, 46, '#1e1828');
      d.circ(46, 16, 11, '#d8c890', { shiny: true }); d.deco.circ(46, 16, 8.5, '#2a2018');
      glyph(d, k, 46, 16, 7, c);                                                        // le symbole gravé, qui luit
      for (const [x, y, rr] of [[12, 30, 7], [20, 48, 6], [74, 26, 7], [80, 52, 6], [16, 10, 6], [78, 10, 5], [40, 8, 4]]) d.blob([[x - rr, y], [x - rr * 0.4, y - rr], [x + rr, y - rr * 0.5], [x + rr * 0.6, y + rr], [x - rr * 0.6, y + rr * 0.8]], Ivy, { tex: 0.5 });
      for (const [x, y] of [[14, 62], [72, 64], [86, 40]]) d.deco.line(x, y - 14, x + 2, y, 1.2, Ivy);
    } },
    // ---------------------------------------------------------- piédestal de l'écusson (dans le sanctuaire)
    pedestal: { w: 30, h: 46, n: 7, lights: [[15, 12, 18]], draw(d, v) {
      const k = KEYS[v], c = col(k);
      d.ell(15, 44, 13, 2.4, '#1a1418', 0, { flat: true });
      d.rect(5, 34, 20, 10, '#8a8478', { round: 0.15, tex: 0.3 });
      d.rect(9, 20, 12, 16, '#9a948a', { round: 0.1, tex: 0.3 });
      d.rect(4, 17, 22, 5, '#b4ac9e', { round: 0.3 });
      d.circ(15, 9, 8, '#f0d878', { shiny: true }); d.deco.circ(15, 9, 6, '#3a2a1a');
      glyph(d, k, 15, 9, 5, c);
      for (const [x, y] of [[4, 4], [26, 6], [6, 14], [25, 15]]) d.deco.circ(x, y, 0.9, c, { unlit: true });
    } },
    // ---------------------------------------------------------- vasque de pierre : v0 éteinte, v1 allumée
    brazier: { w: 22, h: 34, n: 2, lights: [[11, 8, 22]], draw(d, v) {
      d.ell(11, 32, 9, 2, '#1a1418', 0, { flat: true });
      d.tube([[11, 32], [11, 18]], 3, 2.4, '#7a746a');
      d.ell(11, 17, 9, 3.4, '#8a8478', 0, { shiny: true }); d.deco.ell(11, 16, 7, 2, '#2a2420');
      if (v) {
        d.poly([[5, 16], [8, 6], [11, 11], [13, 2], [17, 10], [17, 16]], '#ff7a2a', { unlit: true });
        d.poly([[8, 16], [10, 9], [12, 12], [14, 7], [15, 16]], '#ffd040', { unlit: true });
      }
    } },
    // ---------------------------------------------------------- dalle à presser (on marche dessus) : v0 sombre, v1 allumée
    floorplate: { w: 16, h: 12, n: 2, draw(d, v) {
      d.rect(1, 1, 14, 10, v ? '#3ad8e8' : '#4a5260', { round: 0.2, flat: true, unlit: !!v });
      d.deco.rect(3, 3, 10, 6, v ? '#aaf4ff' : '#363c48', { unlit: !!v });
      d.deco.circ(8, 6, 1.6, v ? '#ffffff' : '#5a6474', { unlit: !!v });
    } },
    // ---------------------------------------------------------- barrière de données (passage fermé tant que l'énigme n'est pas résolue)
    datagate: { w: 16, h: 34, n: 1, frames: 3, fps: 5, draw(d, v, f) {
      d.rect(1, 2, 3, 30, '#4a4e5a', { round: 0.3 }); d.rect(12, 2, 3, 30, '#4a4e5a', { round: 0.3 });
      d.rect(4, 3, 8, 28, '#1e6c8c', { unlit: true }); d.deco.rect(6, 3, 4, 28, '#3ab8d8', { unlit: true });   // champ de données (un volume, puis le motif)
      for (let i = 0; i < 6; i++) { const y = 4 + i * 5 + (f % 3) * 1.6; d.deco.line(4, y, 12, y, 0.9, '#5af0ff', { unlit: true }); }
      for (let i = 0; i < 4; i++) d.deco.rect(5 + ((i * 3 + f * 2) % 6), 6 + i * 6, 1, 2, '#c8fcff', { unlit: true });
    } },
  });
  for (const k of ['crestgate']) OBJ[k].scale = 1.2;
})();
