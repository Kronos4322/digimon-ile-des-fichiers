'use strict';
// =====================================================================
//  FAÇADES QUI GRANDISSENT AVEC LA VILLE (maps/grandir.js fait grandir les intérieurs)
//  Bazar, Dojo, Restaurant, Serre : 3 façades (v) selon le niveau de la ville, chacune dessinée EN ENTIER
//  (le bâtiment se transforme : on ne garde pas l'ancien dans le nouveau) —
//  0 : la boutique d'origine ; 1 : agrandie ; 2 : grand bâtiment. Ta maison : manoir, puis palais.
//  Dessins de 150 × 128 (porte en bas au centre, comme l'emplacement du bâtiment).
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const W = 150, H = 128, CX = 75;
  const text = (d, s, cx, y, col, k = 1) => { const T = DW.World.signText; if (T) T(d, s, cx - (s.length * 4 * k) / 2 + k / 2, y, col, k); };
  // décale les formes ajoutées depuis i0 (pour garder la forme d'origine, centrée en bas)
  function shift(d, i0, dx, dy) {
    const P = ([x, y]) => [x + dx, y + dy];
    for (let i = i0; i < d.shapes.length; i++) {
      const s = d.shapes[i], a = s.args;
      if (s.type === 'ell' || s.type === 'rect') { a[0] += dx; a[1] += dy; }
      else if (s.type === 'poly' || s.type === 'blob') a[0] = a[0].map(P);
      else if (s.type === 'curve' || s.type === 'tube') a[0] = a[0].map(P);
    }
  }
  // ------------------------------------------------------------ petits éléments communs
  const ground = (d, rx = 72) => d.ell(CX, H - 2, rx, 4, '#3a2a18', 0, { flat: true });
  function windowRow(d, x0, x1, y, w, h, step, glass, frame) {
    for (let x = x0; x + w <= x1; x += step) {
      d.deco.rect(x - 1, y - 1, w + 2, h + 2, frame);
      d.deco.rect(x, y, w, h, glass); d.deco.rect(x, y, w, 1.4, '#ffffff'); d.deco.line(x + w / 2, y, x + w / 2, y + h, 0.7, frame);
    }
  }
  function tileRoof(d, pts, col, dark, y0, y1) {
    d.poly(pts, col, { tex: 0.18 });
    for (let y = y0 + 4; y < y1; y += 4) d.deco.line(pts[0][0] + 2, y, pts[pts.length - 1][0] - 2, y, 0.6, dark);
  }
  function door(d, w, h, col, frame) {
    d.rect(CX - w / 2 - 2, H - 4 - h - 2, w + 4, h + 2, frame, { round: 0.1 });
    d.rect(CX - w / 2, H - 4 - h, w, h, col, { tex: 0.12 });
    d.deco.line(CX, H - 4 - h, CX, H - 4, 0.8, frame);
    d.deco.circ(CX - 2.5, H - 4 - h / 2, 0.9, '#f0d070', { unlit: true }); d.deco.circ(CX + 2.5, H - 4 - h / 2, 0.9, '#f0d070', { unlit: true });
  }
  function signBoard(d, s, y, k, bg, fg, pad = 4) {
    const w = s.length * 4 * k + pad * 2;
    d.rect(CX - w / 2, y - 2, w, 5 * k + 4, bg, { round: 0.2 });
    text(d, s, CX, y, fg, k);
  }
  function awning(d, x0, x1, y, h, a, b) {
    d.poly([[x0 - 3, y + h], [x0, y], [x1, y], [x1 + 3, y + h]], a, { shiny: true });
    for (let x = x0 + 4; x < x1; x += 8) d.deco.poly([[x, y], [x + 4, y], [x + 4.6, y + h], [x - 0.4, y + h]], b);
    for (let x = x0 - 2; x < x1 + 2; x += 4) d.ell(x + 2, y + h + 0.6, 2.1, 1.6, ((x - x0) / 4) % 2 ? b : a, 0, { noshadow: true });
  }
  const planter = (d, x, y, leaf) => { d.rect(x - 6, y - 5, 12, 6, '#8a6a4a', { round: 0.2 }); d.blob([[x - 6, y - 5], [x - 4, y - 12], [x, y - 15], [x + 4, y - 12], [x + 6, y - 5]], leaf, { tex: 0.3 }); };
  const lantern = (d, x, y, col) => { d.deco.line(x, y - 6, x, y - 2, 0.6, '#3a2a1a'); d.ell(x, y + 2, 2.6, 3.6, col, 0, { unlit: true }); d.deco.rect(x - 1.6, y - 2, 3.2, 1, '#3a2a1a'); };

  // ------------------------------------------------------------ BAZAR
  const BAZAR = {
    // Grand Bazar : deux niveaux, grandes vitrines sous un auvent rayé, balcon de bois, toit de tuiles, enseigne
    1(d) {
      ground(d, 66);
      d.rect(14, 44, 122, 80, '#c8bca8', { round: 0.04, tex: 0.25 });
      for (let y = 50; y < 122; y += 7) d.deco.line(14, y, 136, y, 0.6, '#9a8e7c');
      windowRow(d, 22, 132, 52, 14, 14, 22, '#f4e0b0', '#6a4a2a');
      d.rect(16, 70, 118, 3, '#7a5030'); for (let x = 18; x < 134; x += 6) d.deco.line(x, 70, x, 64, 0.8, '#7a5030'); d.deco.line(16, 64, 134, 64, 1.2, '#7a5030');
      for (const x0 of [20, 92]) {
        d.deco.rect(x0, 86, 38, 30, '#3a2412'); d.deco.rect(x0 + 1, 87, 36, 28, '#9ad0f0');
        for (const [dx, dy, c] of [[6, 20, '#ff7a5a'], [13, 20, '#5ab8f0'], [20, 20, '#4ac878'], [27, 20, '#ffd04a'], [9, 12, '#b48aff'], [24, 12, '#e8e0d0']]) d.deco.rect(x0 + dx, 87 + dy - 4, 5, 6, c);
        d.deco.rect(x0 + 1, 87, 36, 2, '#ffffff');
      }
      awning(d, 16, 134, 76, 8, '#e04848', '#fff4ea');
      door(d, 16, 26, '#8a5a32', '#4a2e18');
      tileRoof(d, [[6, 46], [26, 20], [124, 20], [144, 46]], '#b8583a', '#8a3a24', 20, 46);
      d.deco.curve([[6, 46], [75, 42], [144, 46]], 1.4, '#7a2a18');
      signBoard(d, 'GRAND BAZAR', 28, 1, '#5a3a1e', '#ffe070');
      d.rect(124, 8, 8, 16, '#8a7a6a'); d.deco.rect(123, 7, 10, 2, '#5a4a3a');
      planter(d, 10, 124, '#4ab048'); planter(d, 140, 124, '#4ab048');
    },
    // Centre commercial : grande façade vitrée, toit-terrasse, grande enseigne lumineuse, portes coulissantes, drapeaux
    2(d) {
      ground(d, 74);
      d.rect(4, 30, 142, 94, '#e8e8f0', { round: 0.03 });
      d.rect(4, 26, 142, 8, '#b8bcc8'); d.deco.line(4, 34, 146, 34, 1, '#8a8e9a');
      for (let r = 0; r < 2; r++) for (let x = 10; x < 142; x += 22) {
        const y = 42 + r * 24;
        d.deco.rect(x, y, 20, 18, '#6aa8d8'); d.deco.rect(x + 1, y + 1, 18, 16, '#9ad0f0');
        d.deco.line(x + 1, y + 1, x + 8, y + 16, 0.8, '#ffffff');
        for (let i = 0; i < 4; i++) d.deco.rect(x + 3 + i * 4, y + 12, 3, 3, ['#ff7a5a', '#4ac878', '#ffd04a', '#b48aff'][(i + r) % 4]);
      }
      d.deco.rect(30, 92, 90, 32, '#5a8ab8'); d.deco.rect(32, 94, 86, 28, '#9ad0f0');
      for (let x = 40; x < 118; x += 14) d.deco.line(x, 94, x, 122, 0.8, '#5a8ab8');
      d.rect(CX - 12, 98, 24, 26, '#c8e8f8'); d.deco.line(CX, 98, CX, 124, 1, '#5a8ab8');
      d.rect(16, 8, 118, 20, '#2a2a3a', { round: 0.1 });
      text(d, 'CENTRE', CX, 10, '#ffe070', 2); text(d, 'COMMERCIAL', CX, 21, '#7ae0ff', 1);
      for (const x of [10, 140]) { d.tube([[x, 124], [x, 4]], 1, 1, '#8a8e9a'); d.poly([[x, 4], [x + (x < CX ? 12 : -12), 7], [x, 10]], x < CX ? '#e04848' : '#3a9ad8'); }
      planter(d, 22, 124, '#4ab048'); planter(d, 128, 124, '#4ab048');
    },
  };

  // ------------------------------------------------------------ RESTAURANT (le restaurant aux champignons)
  const RESTO = {
    // Grand Restaurant : une maison-champignon à étage, chapeau géant à pois, terrasses avec parasols
    1(d) {
      ground(d, 68);
      for (const x of [20, 130]) { d.ell(x, 108, 14, 4, '#b04a3a', 0); d.deco.ell(x, 107, 9, 2.4, '#ffffff'); d.tube([[x, 108], [x, 122]], 1, 1, '#5a3a20'); d.rect(x - 9, 116, 18, 3, '#e8dcc8', { round: 0.4 }); d.rect(x - 7, 119, 2, 5, '#6a4a2a'); d.rect(x + 5, 119, 2, 5, '#6a4a2a'); }
      d.rect(36, 60, 78, 64, '#f4ead8', { round: 0.2, tex: 0.15 });
      windowRow(d, 44, 112, 70, 12, 14, 20, '#ffd890', '#8a5a3a');
      windowRow(d, 44, 64, 96, 12, 14, 20, '#ffd890', '#8a5a3a'); windowRow(d, 94, 112, 96, 12, 14, 20, '#ffd890', '#8a5a3a');
      door(d, 16, 24, '#a86a3a', '#5a3a20');
      d.blob([[16, 66], [24, 34], [50, 14], [100, 14], [126, 34], [134, 66], [75, 58]], '#9a4ad0', { tex: 0.15, shiny: true });
      for (const [x, y, r] of [[40, 34, 6], [66, 24, 7], [94, 22, 6], [116, 40, 5], [56, 46, 4], [86, 44, 5]]) d.deco.circ(x, y, r, '#f4ecfc');
      d.deco.curve([[16, 66], [75, 60], [134, 66]], 1.4, '#6a2a9a');
      signBoard(d, 'RESTAURANT', 50, 1, '#5a3a20', '#ffe070');
    },
    // Restaurant gastronomique : bâtiment élégant à arcades, auvents verts, terrasse, dôme-champignon au sommet
    2(d) {
      ground(d, 74);
      d.rect(6, 46, 138, 78, '#f4ecdc', { round: 0.03, tex: 0.15 });
      d.rect(4, 42, 142, 6, '#c8b898');
      for (let x = 14; x < 140; x += 22) { d.deco.rect(x, 56, 14, 18, '#ffd890'); d.deco.ell(x + 7, 56, 7, 5, '#ffd890'); d.deco.line(x + 7, 52, x + 7, 74, 0.7, '#8a6a4a'); }
      for (let x = 14; x < 140; x += 22) if (Math.abs(x + 7 - CX) > 14) { d.deco.rect(x, 92, 14, 22, '#ffd890'); d.deco.ell(x + 7, 92, 7, 5, '#ffd890'); }
      awning(d, 8, 58, 84, 7, '#3a8a4a', '#e8f4e0'); awning(d, 92, 142, 84, 7, '#3a8a4a', '#e8f4e0');
      door(d, 20, 30, '#7a4a2a', '#4a2a14');
      d.blob([[34, 46], [46, 20], [75, 4], [104, 20], [116, 46]], '#9a4ad0', { tex: 0.15, shiny: true });
      for (const [x, y, r] of [[56, 24, 5], [80, 14, 6], [100, 30, 4], [66, 36, 3]]) d.deco.circ(x, y, r, '#f4ecfc');
      d.rect(30, 44, 90, 12, '#3a2a1a', { round: 0.2 }); text(d, 'RESTAURANT', CX, 48, '#ffe070', 1);
      for (const x of [16, 134]) { d.rect(x - 7, 116, 14, 3, '#ffffff', { round: 0.4 }); d.ell(x, 104, 10, 3, '#3a8a4a'); d.tube([[x, 104], [x, 118]], 0.8, 0.8, '#5a3a20'); }
    },
  };

  // ------------------------------------------------------------ DOJO
  const DOJO = {
    // Grand Dojo : grand hall de bois, toits incurvés sur deux niveaux, véranda, lanternes
    1(d) {
      ground(d, 70);
      d.rect(14, 64, 122, 60, '#f0e6d0', { round: 0.03 });
      for (let x = 14; x <= 136; x += 20) d.rect(x - 1.5, 64, 3, 60, '#5a3a20');
      for (let x = 18; x < 132; x += 20) if (Math.abs(x + 8 - CX) > 12) { d.deco.rect(x, 72, 16, 40, '#fbf6e8'); for (let y = 80; y < 112; y += 8) d.deco.line(x, y, x + 16, y, 0.5, '#c8b898'); d.deco.line(x + 8, 72, x + 8, 112, 0.5, '#c8b898'); }
      d.rect(8, 116, 134, 8, '#8a5a32', { tex: 0.2 });
      door(d, 18, 34, '#fbf6e8', '#5a3a20');
      d.poly([[2, 66], [20, 44], [130, 44], [148, 66], [140, 62], [10, 62]], '#3a4a7a', { tex: 0.15 });
      d.poly([[24, 44], [40, 20], [110, 20], [126, 44]], '#3a4a7a', { tex: 0.15 }); d.rect(40, 34, 70, 12, '#f0e6d0');
      d.deco.line(2, 66, 148, 66, 1.6, '#2a3458'); d.deco.line(24, 44, 126, 44, 1.4, '#2a3458');
      d.rect(CX - 20, 23, 40, 14, '#5a3a20', { round: 0.2 }); text(d, 'DOJO', CX, 25, '#ffe070', 2);
      for (const x of [20, 130]) lantern(d, x, 76, '#e84a3a');
    },
    // Dojo complet : pagode centrale à trois toits, deux pavillons, lanternes
    2(d) {
      ground(d, 74);
      for (const x0 of [4, 106]) {
        d.rect(x0, 78, 40, 46, '#f0e6d0'); d.deco.rect(x0 + 6, 88, 28, 24, '#fbf6e8'); d.deco.line(x0 + 20, 88, x0 + 20, 112, 0.6, '#c8b898');
        d.poly([[x0 - 4, 80], [x0 + 6, 66], [x0 + 34, 66], [x0 + 44, 80]], '#3a4a7a', { tex: 0.15 }); d.deco.line(x0 - 4, 80, x0 + 44, 80, 1.2, '#2a3458');
      }
      d.rect(40, 62, 70, 62, '#f0e6d0');
      for (let x = 40; x <= 110; x += 14) d.rect(x - 1.5, 62, 3, 62, '#5a3a20');
      door(d, 20, 36, '#fbf6e8', '#5a3a20');
      for (const [y, w] of [[62, 46], [42, 36], [24, 26]]) {
        d.poly([[CX - w - 6, y + 4], [CX - w + 4, y - 10], [CX + w - 4, y - 10], [CX + w + 6, y + 4]], '#3a4a7a', { tex: 0.15 });
        d.deco.line(CX - w - 6, y + 4, CX + w + 6, y + 4, 1.4, '#2a3458');
        if (y > 24) d.rect(CX - w + 10, y - 10, (w - 10) * 2, 10, '#f0e6d0');
      }
      d.tube([[CX, 14], [CX, 2]], 1.4, 0.8, '#c8a040'); d.deco.circ(CX, 2, 2, '#ffd040', { unlit: true });
      d.rect(CX - 20, 44, 40, 14, '#5a3a20', { round: 0.2 }); text(d, 'DOJO', CX, 46, '#ffe070', 2);
      for (const x of [8, 46, 104, 142]) lantern(d, x, 92, '#e84a3a');
    },
  };

  // ------------------------------------------------------------ SERRE / JARDINS
  const GARDEN = {
    // Grande serre : longue serre de verre à toit arrondi, plates-bandes devant
    1(d) {
      ground(d, 70);
      d.rect(10, 60, 130, 62, '#c8f0e0', { round: 0.04 });
      d.blob([[10, 62], [20, 38], [75, 24], [130, 38], [140, 62]], '#d8f8ec', { shiny: true });
      for (let x = 22; x < 132; x += 16) { d.deco.line(x, 60, x, 122, 1, '#7ab8a0'); d.deco.curve([[x, 60], [x + (CX - x) * 0.1, 36]], 1, '#7ab8a0'); }
      d.deco.line(10, 60, 140, 60, 1.2, '#7ab8a0'); d.deco.line(10, 90, 140, 90, 1, '#7ab8a0');
      for (const [x, y, c] of [[26, 82, '#4ab048'], [46, 76, '#7ac04a'], [100, 78, '#4ab048'], [120, 84, '#6ab858'], [36, 110, '#e05a8a'], [114, 112, '#f0c040']]) d.deco.blob([[x - 6, y + 6], [x - 4, y - 4], [x, y - 8], [x + 4, y - 4], [x + 6, y + 6]], c);
      door(d, 16, 26, '#b8e8d8', '#5a8a7a');
      signBoard(d, 'SERRE', 42, 2, '#4a7a5a', '#ffffff');
      for (const x0 of [8, 104]) { d.rect(x0, 118, 38, 6, '#7a5a3a', { round: 0.3 }); for (let x = x0 + 4; x < x0 + 36; x += 6) d.deco.ell(x, 117, 2.4, 2.6, '#4ab048'); }
    },
    // Jardins maraîchers : grand dôme de verre central, deux ailes vitrées, potagers devant
    2(d) {
      ground(d, 74);
      for (const x0 of [2, 98]) {
        d.rect(x0, 70, 50, 52, '#c8f0e0'); d.blob([[x0, 72], [x0 + 8, 58], [x0 + 42, 58], [x0 + 50, 72]], '#d8f8ec', { shiny: true });
        for (let x = x0 + 8; x < x0 + 50; x += 10) d.deco.line(x, 60, x, 122, 0.9, '#7ab8a0');
        d.deco.blob([[x0 + 10, 110], [x0 + 14, 92], [x0 + 22, 86], [x0 + 30, 96], [x0 + 38, 110]], '#4ab048');
      }
      d.rect(40, 54, 70, 70, '#c8f0e0');
      d.blob([[34, 58], [42, 28], [75, 8], [108, 28], [116, 58]], '#d8f8ec', { shiny: true });
      for (const k of [-0.6, -0.3, 0, 0.3, 0.6]) d.deco.curve([[CX + k * 70, 58], [CX + k * 46, 26], [CX, 9]], 1, '#7ab8a0');
      d.deco.line(34, 58, 116, 58, 1.2, '#7ab8a0');
      d.deco.blob([[52, 50], [60, 30], [75, 22], [90, 30], [98, 50]], '#3a9a48');
      d.deco.circ(CX, 8, 3, '#e05a8a');
      door(d, 18, 28, '#b8e8d8', '#5a8a7a');
      d.rect(38, 60, 74, 10, '#4a7a5a', { round: 0.2 }); text(d, 'JARDINS', CX, 63, '#ffffff', 1);
      for (const x0 of [4, 112]) { d.rect(x0, 120, 34, 4, '#7a5a3a'); for (let x = x0 + 3; x < x0 + 32; x += 5) d.deco.ell(x, 119, 2, 2.4, ['#e8822a', '#e04848', '#7ac04a'][(x / 5 | 0) % 3]); }
    },
  };

  const SETS = { bazar: BAZAR, restaurant: RESTO, dojo: DOJO, garden: GARDEN };
  for (const k in SETS) {
    const D = OBJ[k]; if (!D) continue;
    const ow = D.w, oh = D.h, draw0 = D.draw, F = SETS[k];
    Object.assign(D, {
      w: W, h: H, n: 3,
      lights: (D.lights || []).map(([x, y, r, c]) => [CX + (x - ow / 2), H - (oh - y), r, c]),
      draw(d, v = 0, f) {
        if (F[v]) { F[v](d); return; }
        const i0 = d.shapes.length; draw0.call(this, d, 0, f); shift(d, i0, CX - ow / 2, H - oh);
      },
    });
  }

  // ------------------------------------------------------------ ta maison : manoir (v 0), puis palais (v 1)
  OBJ.homepalace = { w: W, h: H, n: 2, lights: [[40, 96, 14], [110, 96, 14], [75, 70, 16]], draw(d, v = 0) {
    ground(d, 72);
    const wall = '#f4ead8', roof = '#3a5a9a', roofD = '#2a3a6a', glass = '#ffe8a0', frame = '#7a5a3a';
    if (!v) {
      // manoir : corps central à étage et deux ailes, toits d'ardoise, cheminées, porche à colonnes
      for (const x0 of [6, 104]) { d.rect(x0, 70, 40, 54, wall, { tex: 0.12 }); windowRow(d, x0 + 6, x0 + 36, 82, 10, 14, 15, glass, frame); windowRow(d, x0 + 6, x0 + 36, 104, 10, 12, 15, glass, frame); tileRoof(d, [[x0 - 4, 72], [x0 + 8, 56], [x0 + 32, 56], [x0 + 44, 72]], roof, roofD, 56, 72); }
      d.rect(40, 46, 70, 78, wall, { tex: 0.12 });
      windowRow(d, 48, 104, 58, 12, 16, 20, glass, frame); windowRow(d, 48, 60, 90, 12, 16, 20, glass, frame); windowRow(d, 90, 104, 90, 12, 16, 20, glass, frame);
      tileRoof(d, [[32, 48], [50, 22], [100, 22], [118, 48]], roof, roofD, 22, 48);
      for (const x of [56, 94]) { d.rect(x, 12, 7, 14, '#a8584a'); d.deco.rect(x - 1, 11, 9, 2, '#6a3a2a'); }
      door(d, 16, 28, '#8a4a2a', '#4a2a14');
      d.rect(CX - 14, 90, 28, 4, '#6a4a2a'); for (const x of [CX - 12, CX + 12]) d.tube([[x, 94], [x, 124]], 1.4, 1.4, '#f0e8d8');
      planter(d, 30, 124, '#4ab048'); planter(d, 120, 124, '#4ab048');
      return;
    }
    // palais : grande façade à deux étages, tourelles, fronton et dôme doré, perron à colonnes
    d.rect(16, 40, 118, 84, wall, { tex: 0.12 });
    for (const y of [50, 74]) windowRow(d, 24, 128, y, 10, 16, 15, glass, frame);
    windowRow(d, 24, 58, 98, 10, 16, 15, glass, frame); windowRow(d, 96, 128, 98, 10, 16, 15, glass, frame);
    d.poly([[10, 42], [CX, 16], [140, 42]], roof, { tex: 0.15 }); d.deco.line(10, 42, 140, 42, 1.4, roofD);
    d.blob([[58, 22], [62, 8], [CX, 2], [88, 8], [92, 22]], '#e8c040', { shiny: true }); d.deco.circ(CX, 1.5, 2, '#fff0a0', { unlit: true });
    for (const x of [8, 142]) {
      d.rect(x - 9, 30, 18, 94, wall, { round: 0.2, tex: 0.12 });
      windowRow(d, x - 4, x + 6, 48, 8, 12, 12, glass, frame); windowRow(d, x - 4, x + 6, 80, 8, 12, 12, glass, frame);
      d.poly([[x - 12, 32], [x, 6], [x + 12, 32]], roof, { tex: 0.15 }); d.tube([[x, 6], [x, 0]], 0.8, 0.6, '#c8a040'); d.poly([[x, 0], [x + 8, 2], [x, 4]], '#e04848');
    }
    d.rect(CX - 26, 116, 52, 8, '#c8c0b0'); d.rect(CX - 20, 112, 40, 5, '#d8d0c0');
    door(d, 20, 32, '#8a4a2a', '#4a2a14');
    for (const x of [CX - 16, CX + 16]) d.tube([[x, 84], [x, 112]], 2, 2, '#f0e8d8');
    d.rect(CX - 20, 80, 40, 5, '#d8d0c0');
  } };

  // forme d'un bâtiment selon le niveau de la ville (mêmes paliers que les intérieurs : maps/grandir.js)
  DW.World.buildingForm = () => { const lv = DW.Town ? DW.Town.level() : 0; return lv >= 8 ? 2 : lv >= 5 ? 1 : 0; };
})();
