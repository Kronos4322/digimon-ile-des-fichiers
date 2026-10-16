'use strict';
// =====================================================================
//  FAÇADES QUI GRANDISSENT AVEC LA VILLE (maps/grandir.js fait grandir les intérieurs)
//  Bazar, Dojo, Restaurant, Serre : 3 façades (v) selon le niveau de la ville —
//  0 : la boutique d'origine ; 1 : agrandie (plus grande, deux ailes) ; 2 : grand bâtiment (un étage de plus, fronton).
//  Les dessins d'origine sont réutilisés : leurs formes sont décalées et mises à l'échelle (scaleShapes).
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  // met à l'échelle (k) et décale (dx, dy) les formes ajoutées depuis l'indice i0
  function scaleShapes(d, i0, k, dx, dy) {
    const P = ([x, y]) => [x * k + dx, y * k + dy];
    for (let i = i0; i < d.shapes.length; i++) {
      const s = d.shapes[i], a = s.args;
      if (s.type === 'ell') { a[0] = a[0] * k + dx; a[1] = a[1] * k + dy; a[2] *= k; a[3] *= k; }
      else if (s.type === 'rect') { a[0] = a[0] * k + dx; a[1] = a[1] * k + dy; a[2] *= k; a[3] *= k; }
      else if (s.type === 'poly' || s.type === 'blob') a[0] = a[0].map(P);
      else if (s.type === 'curve') { a[0] = a[0].map(P); a[1] *= k; }
      else if (s.type === 'tube') { a[0] = a[0].map(P); a[1] *= k; a[2] *= k; }
    }
  }
  const W = 150, H = 128;   // nouvelle taille des dessins (les anciens faisaient environ 100 × 100)
  // couleurs de chaque bâtiment : murs, toit, enseigne
  const STYLE = {
    bazar: { wall: '#b8ae9e', line: '#8a8070', roof: '#b8583a', roofD: '#8a3a24', sign: 'CENTRE COMMERCIAL', sign1: 'GRAND BAZAR', glass: '#9ad0f0' },
    restaurant: { wall: '#e8dcc8', line: '#b8a888', roof: '#3a8a4a', roofD: '#2a6a3a', sign: 'RESTAURANT', sign1: 'RESTAURANT', glass: '#ffd890' },
    dojo: { wall: '#f0e6d0', line: '#c8b898', roof: '#3a4a7a', roofD: '#2a3458', sign: 'DOJO', sign1: 'DOJO', glass: '#f8f0d8' },
    garden: { wall: '#e8f4e0', line: '#a8c8a0', roof: '#7ac8e8', roofD: '#4a9ab8', sign: 'JARDINS', sign1: 'SERRE', glass: '#c8f0e0' },
  };
  // une aile : petit bâtiment accolé (murs, fenêtres éclairées, toit)
  function wing(d, x, w, top, S) {
    d.rect(x, top + 14, w, H - 4 - top - 14, S.wall, { round: 0.06, tex: 0.2 });
    for (let y = top + 22; y < H - 14; y += 16) { d.deco.rect(x + 4, y, w - 8, 9, S.glass); d.deco.rect(x + 4, y, w - 8, 1.4, '#ffffff'); d.deco.line(x + w / 2, y, x + w / 2, y + 9, 0.8, S.line); }
    d.poly([[x - 2, top + 16], [x + w / 2, top], [x + w + 2, top + 16]], S.roof, { tex: 0.15 });
    d.deco.line(x - 2, top + 16, x + w + 2, top + 16, 1.2, S.roofD);
  }
  for (const k of ['bazar', 'restaurant', 'dojo', 'garden']) {
    const D = OBJ[k]; if (!D) continue;
    const ow = D.w, oh = D.h, draw0 = D.draw, S = STYLE[k];
    Object.assign(D, {
      w: W, h: H, n: 3,
      // les lumières de nuit suivent le dessin agrandi
      lights: (D.lights || []).map(([x, y, r, c]) => [W / 2 + (x - ow / 2), H - (oh - y), r, c]),
      draw(d, v = 0, f) {
        if (v >= 2) {
          // un étage de plus, au-dessus du bâtiment : façade claire, rangée de fenêtres, fronton avec l'enseigne
          d.ell(W / 2, H - 2, 72, 4, '#3a2a18', 0, { flat: true });
          wing(d, 2, 30, 34, S); wing(d, W - 32, 30, 34, S);
          d.rect(22, 18, W - 44, 60, S.wall, { round: 0.04, tex: 0.2 });
          for (let x = 30; x < W - 34; x += 16) { d.deco.rect(x, 30, 10, 12, S.glass); d.deco.rect(x, 30, 10, 1.6, '#ffffff'); d.deco.line(x + 5, 30, x + 5, 42, 0.8, S.line); }
          d.poly([[16, 22], [W / 2, 2], [W - 16, 22]], S.roof, { tex: 0.15 }); d.deco.line(16, 22, W - 16, 22, 1.4, S.roofD);
          d.rect(W / 2 - 34, 46, 68, 10, '#2a2230', { round: 0.3 });
          const t = S.sign, cw = Math.min(5, 60 / t.length);
          for (let i = 0; i < t.length; i++) if (t[i] !== ' ') d.deco.rect(W / 2 - t.length * cw / 2 + i * cw + 0.6, 48.5, cw - 1.6, 5, '#ffe070', { unlit: true });
          const i0 = d.shapes.length; draw0.call(this, d, 0, f); scaleShapes(d, i0, 1.05, W / 2 - ow / 2 * 1.05, H - oh * 1.05);
          return;
        }
        if (v === 1) {
          d.ell(W / 2, H - 2, 66, 4, '#3a2a18', 0, { flat: true });
          wing(d, 10, 28, 50, S); wing(d, W - 38, 28, 50, S);
          const i0 = d.shapes.length; draw0.call(this, d, 0, f); scaleShapes(d, i0, 1.12, W / 2 - ow / 2 * 1.12, H - oh * 1.12);
          return;
        }
        const i0 = d.shapes.length; draw0.call(this, d, 0, f); scaleShapes(d, i0, 1, W / 2 - ow / 2, H - oh);
      },
    });
  }
  // ------------------------------------------------------------ ta maison devient un manoir, puis un palais (selon les enfants qui y vivent)
  // v 0 : manoir (la maison rénovée au centre, deux ailes) ; v 1 : palais (un étage, fronton, tourelles)
  const C = OBJ.cottage;
  if (C) {
    const cw = C.w, ch = C.h, S = { wall: '#f4ead8', line: '#c8b898', roof: '#c8583a', roofD: '#8a3a24', glass: '#ffe8a0' };
    OBJ.homepalace = { w: 150, h: 128, n: 2, lights: [[40, 90, 14], [110, 90, 14], [75, 60, 16]], draw(d, v = 0) {
      d.ell(75, 126, 72, 4, '#3a2a18', 0, { flat: true });
      if (v >= 1) {
        d.rect(24, 22, 102, 70, S.wall, { round: 0.04, tex: 0.2 });
        for (let x = 32; x < 118; x += 15) { d.deco.rect(x, 34, 9, 13, S.glass); d.deco.rect(x, 34, 9, 1.6, '#ffffff'); d.deco.line(x + 4.5, 34, x + 4.5, 47, 0.8, S.line); }
        d.poly([[18, 26], [75, 4], [132, 26]], S.roof, { tex: 0.15 }); d.deco.line(18, 26, 132, 26, 1.4, S.roofD);
        for (const x of [12, 138]) { d.rect(x - 7, 20, 14, 70, S.wall, { round: 0.2 }); d.poly([[x - 9, 22], [x, 4], [x + 9, 22]], S.roof); d.deco.rect(x - 3, 34, 6, 9, S.glass); }
        d.deco.circ(75, 16, 4, '#ffd040', { unlit: true });
      }
      wing(d, 4, 34, 54, S); wing(d, 112, 34, 54, S);
      const i0 = d.shapes.length; C.draw.call(C, d, 2); scaleShapes(d, i0, 1.15, 75 - cw / 2 * 1.15, 128 - ch * 1.15);
    } };
  }
  // forme d'un bâtiment selon le niveau de la ville (mêmes paliers que les intérieurs : maps/grandir.js)
  DW.World.buildingForm = () => { const lv = DW.Town ? DW.Town.level() : 0; return lv >= 8 ? 2 : lv >= 5 ? 1 : 0; };
})();
