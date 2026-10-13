'use strict';
// =====================================================================
//  VILLE DES FICHIERS — bâtiments, chantiers et petit mobilier urbain
//  (s'ajoutent à World.OBJ ; même moteur de volumes que objects.js)
//  lights : fenêtres éclairées la nuit [x, y, rayon] (repère du sprite)
//  smoke  : sortie de cheminée [x, y]
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const STRAW = '#d8b45a', STRAW_D = '#a8843a', WOOD = '#8a5a32', WOOD_D = '#5a3a1e', STONE = '#a8a296';

  // fenêtre à croisillons (+ jardinière en option)
  const win = (d, x, y, w, h, o = {}) => {
    d.deco.rect(x - 1.5, y - 1.5, w + 3, h + 3, o.frame || '#4a2e16');
    d.deco.rect(x, y, w, h, o.glass || '#9ad8f0');
    d.deco.rect(x + 1, y + 1, w * 0.35, h * 0.4, '#d8f4ff', { unlit: true });
    d.deco.line(x + w / 2, y, x + w / 2, y + h, 1, o.frame || '#4a2e16'); d.deco.line(x, y + h / 2, x + w, y + h / 2, 1, o.frame || '#4a2e16');
    if (o.box) {
      d.rect(x - 3, y + h + 1, w + 6, 4, '#9a5a2a', { round: 0.3 });
      for (let i = 0; i < w + 4; i += 3) d.deco.circ(x - 1.5 + i, y + h + 0.5, 1.4, ['#ff6a8a', '#ffd84a', '#ffffff', '#ff9a4a'][(i / 3) % 4], { unlit: true });
    }
  };
  // rangées de tuiles / chaume sur un toit
  const rows = (d, x0, x1, y0, y1, step, col, bend = 4) => {
    for (let y = y0; y <= y1; y += step) d.deco.curve([[x0, y], [(x0 + x1) / 2, y - bend], [x1, y]], 0.9, col);
  };

  Object.assign(OBJ, {
    // ---------------------------------------------------------- maison de Jijimon (6×4 cases)
    jhouse: { w: 116, h: 108, n: 1, lights: [[30, 74, 20], [92, 72, 16], [58, 66, 16]], smoke: [90, 22], draw(d) {
      d.ell(58, 104, 54, 4, '#3a2a18', 0, { flat: true });
      // terrasse en bois et marches
      d.rect(10, 92, 96, 12, '#b8844c', { round: 0.08, tex: 0.3 });
      for (let x = 16; x < 104; x += 8) d.deco.line(x, 93, x, 104, 0.7, '#7a5028');
      d.rect(42, 98, 32, 8, '#c8945a', { round: 0.1 }); d.deco.line(42, 102, 74, 102, 0.8, '#8a5a30');
      // murs ocre
      d.rect(14, 50, 88, 44, '#c8a070', { round: 0.05, tex: 0.15 });
      d.deco.rect(14, 86, 88, 8, '#a87c50');
      for (const x of [14, 101]) d.deco.rect(x, 50, 3, 44, '#8a6040');
      // grand porche en arche (comme une niche)
      d.ell(58, 72, 18, 16, '#a8a296', 0, { tex: 0.2 }); d.rect(40, 72, 36, 22, '#a8a296', { tex: 0.2 });
      d.deco.ell(58, 73, 14, 13, '#2a1a10'); d.deco.rect(44, 73, 28, 21, '#2a1a10');
      d.deco.ell(58, 76, 10, 9, '#4a2e1a'); d.deco.rect(48, 76, 20, 18, '#4a2e1a');
      d.deco.rect(53, 80, 10, 6, '#ffd88a', { unlit: true });
      // fenêtre et climatiseur, poste de télé
      d.deco.rect(21, 62, 18, 14, '#5a3a22'); d.deco.rect(23, 64, 14, 10, '#9ad8f0'); d.deco.line(30, 64, 30, 74, 0.8, '#5a3a22');
      d.rect(82, 64, 16, 12, '#8a8a92', { round: 0.15 }); d.deco.rect(84, 66, 12, 8, '#3a4a5a'); d.deco.rect(85, 67, 5, 3, '#7ab8e8', { unlit: true });
      d.rect(18, 82, 12, 10, '#9a6a3a', { round: 0.4, tex: 0.3 }); d.deco.line(18, 85, 30, 85, 0.8, '#5a5a62');
      // toit pyramidal de tuiles rouges en écailles
      d.poly([[2, 56], [24, 16], [92, 16], [114, 56]], '#c84a32', { tex: 0.2 });
      for (let r = 0; r < 7; r++) { const y = 21 + r * 5.4, x0 = 22 - r * 3, x1 = 94 + r * 3; for (let x = x0; x < x1; x += 7) d.deco.ell(x + (r % 2) * 3.5, y, 3.2, 2.4, '#a83a26'); }
      d.deco.line(2, 56, 114, 56, 1.6, '#7a2a1a');
      d.poly([[24, 16], [58, 4], [92, 16]], '#d8583e', { shiny: true });
      // antenne parabolique, panneau, cheminée-bidon
      d.tube([[30, 18], [30, 8]], 1.4, 1.4, '#7a7a82'); d.ell(30, 6, 7, 6, '#e8ecf0', -0.4, { shiny: true }); d.deco.ell(30, 6, 4, 3.4, '#c8d0d8', -0.4); d.deco.circ(30, 6, 1, '#5a5a62');
      d.rect(46, 26, 26, 12, '#3a5a8a', { round: 0.1, shiny: true }); for (let x = 50; x < 72; x += 5) d.deco.line(x, 26, x, 38, 0.7, '#2a3a5a');
      d.rect(84, 14, 10, 14, '#c8a040', { round: 0.3, shiny: true }); d.deco.rect(84, 18, 10, 2, '#8a6a20');
    } },
    // ---------------------------------------------------------- Bazar de Gotsumon (5×3)
    bazar: { w: 100, h: 92, n: 1, lights: [[50, 62, 26]], draw(d) {
      d.ell(50, 89, 46, 3.4, '#3a2a18', 0, { flat: true });
      // murs de pierre
      d.rect(8, 40, 84, 48, '#b8ae9e', { round: 0.1, tex: 0.25 });
      for (let y = 46; y < 88; y += 7) for (let x = 8 + ((y / 7) % 2) * 6; x < 92; x += 12) d.deco.rect(x, y, 0.8, 7, '#8a8070');
      for (let y = 46; y < 88; y += 7) d.deco.line(8, y, 92, y, 0.8, '#8a8070');
      // intérieur et étagères
      d.deco.rect(16, 54, 68, 22, '#3a2412');
      for (const y of [60, 67]) d.deco.line(16, y, 84, y, 1, '#7a5030');
      [[20, 58, '#ff7a5a'], [26, 58, '#5ab8f0'], [32, 58, '#4ac878'], [64, 58, '#ffd04a'], [70, 58, '#b48aff'], [76, 58, '#ff7a5a'], [22, 65, '#e8e0d0'], [30, 65, '#e8e0d0'], [68, 65, '#5ab8f0'], [76, 65, '#4ac878']]
        .forEach(([x, y, c]) => { d.deco.rect(x - 1.6, y - 3.6, 3.2, 3.8, c); d.deco.rect(x - 0.6, y - 4.6, 1.2, 1.2, '#e8e0d0'); });
      // comptoir et marchandises
      d.rect(12, 72, 76, 15, '#a86e3a', { round: 0.15, tex: 0.25 });
      for (let x = 20; x < 88; x += 10) d.deco.line(x, 74, x, 87, 0.8, '#6a4222');
      d.deco.rect(12, 72, 76, 2, '#c8905a');
      d.ell(24, 69, 5, 3, '#b04a2a'); d.deco.circ(20, 68, 1.2, '#fff4e0', { unlit: true }); d.deco.ell(25, 68, 2, 1, '#d86a4a');
      d.ell(36, 69.5, 5, 2.6, '#b04a2a'); d.deco.circ(32, 69, 1.2, '#fff4e0', { unlit: true });
      for (const [x, c] of [[52, '#e84040'], [59, '#e84040'], [66, '#3a8ae8']]) { d.circ(x, 69, 3.2, '#f4f0ea'); d.deco.ell(x, 67.6, 3, 1.6, c); d.deco.line(x - 3, 69, x + 3, 69, 0.6, '#2a2a3a'); }
      d.rect(74, 64, 5, 8, '#5ab8f0', { round: 0.4, shiny: true }); d.rect(80, 65, 5, 7, '#4ac878', { round: 0.4, shiny: true });
      // auvent rayé festonné
      d.poly([[6, 56], [10, 44], [90, 44], [94, 56]], '#e04848', { shiny: true });
      for (let x = 10; x < 90; x += 10) d.deco.poly([[x, 44], [x + 5, 44], [x + 5.8, 56], [x - 0.6, 56]], '#fff4ea');
      for (let x = 8; x < 94; x += 5) d.ell(x + 2.5, 56.5, 2.6, 2, ((x - 8) / 5) % 2 ? '#fff4ea' : '#e04848', 0, { noshadow: true });
      // toit de tuiles
      d.blob([[0, 46], [10, 26], [50, 12], [90, 26], [100, 46], [50, 42]], '#b8583a', { tex: 0.2 });
      rows(d, 6, 94, 24, 42, 5, '#8a3a24', 6);
      d.deco.curve([[2, 45], [50, 40], [98, 45]], 1.4, '#7a2a18');
      // enseigne (viande) et caisses
      d.rect(34, 24, 32, 14, '#c89858', { round: 0.3, tex: 0.25 });
      d.deco.rect(35, 25, 30, 1.4, '#e8c080');
      d.ell(50, 31, 7, 4, '#b04a2a'); d.deco.circ(44, 30, 1.6, '#fff4e0', { unlit: true }); d.deco.circ(44, 32.6, 1.4, '#fff4e0', { unlit: true }); d.deco.ell(51, 30, 3, 1.4, '#e07a5a');
      d.rect(0, 74, 12, 13, '#b8844c', { round: 0.15, tex: 0.3 }); d.deco.line(0, 74, 12, 87, 0.8, '#7a5028'); d.deco.line(12, 74, 0, 87, 0.8, '#7a5028');
      d.ell(94, 80, 6, 8, '#9a6a3c', 0, { tex: 0.25 }); d.deco.line(88.4, 76, 99.6, 76, 0.9, '#5a5a62'); d.deco.line(88.4, 84, 99.6, 84, 0.9, '#5a5a62');
    } },

    // ---------------------------------------------------------- Dojo d'Elecmon (5×3)
    dojo: { w: 108, h: 96, n: 1, lights: [[54, 70, 24], [20, 54, 10], [88, 54, 10]], draw(d) {
      d.ell(54, 93, 50, 3.4, '#3a2a18', 0, { flat: true });
      // plancher surélevé et marches
      d.rect(8, 78, 92, 12, '#9a6a3a', { round: 0.1, tex: 0.25 });
      for (let x = 14; x < 100; x += 8) d.deco.line(x, 80, x, 90, 0.7, '#6a4222');
      d.rect(42, 86, 24, 8, '#b8844c', { round: 0.1 }); d.deco.line(42, 90, 66, 90, 0.8, '#7a5028');
      // murs blancs à poteaux sombres
      d.rect(14, 46, 80, 34, '#f2ecdc', { round: 0.05 });
      for (const x of [14, 30, 78, 93]) d.deco.rect(x - 1.5, 46, 3.5, 34, '#4a2e1a');
      d.deco.rect(14, 46, 80, 3, '#4a2e1a'); d.deco.rect(14, 62, 16, 2, '#4a2e1a'); d.deco.rect(78, 62, 16, 2, '#4a2e1a');
      // portes coulissantes (shoji)
      d.deco.rect(34, 52, 40, 27, '#5a3a1e');
      d.deco.rect(35.5, 53.5, 18, 24, '#fbf4e0', { unlit: true }); d.deco.rect(54.5, 53.5, 18, 24, '#fbf4e0', { unlit: true });
      for (let k = 0; k < 2; k++) { const x0 = 35.5 + k * 19; for (let x = x0 + 4.5; x < x0 + 18; x += 4.5) d.deco.line(x, 53.5, x, 77.5, 0.6, '#8a6a4a'); for (let y = 59.5; y < 77; y += 6) d.deco.line(x0, y, x0 + 18, y, 0.6, '#8a6a4a'); }
      // emblème éclair
      d.circ(54, 66, 6, '#e04040');
      d.deco.poly([[55, 60.5], [50.5, 67], [54, 67], [52.5, 71.5], [57.5, 64.5], [54, 64.5]], '#ffe040', { unlit: true });
      // toit à deux pans recourbés
      d.blob([[-2, 52], [6, 44], [30, 36], [54, 32], [78, 36], [102, 44], [110, 52], [54, 48]], '#3e4a80', { shiny: true });
      rows(d, 6, 102, 38, 48, 4, '#262e5a', 4);
      d.deco.curve([[-1, 51], [54, 46], [109, 51]], 1.4, '#1e2448');
      d.blob([[16, 36], [24, 22], [54, 12], [84, 22], [92, 36], [54, 33]], '#4a5890', { shiny: true });
      rows(d, 22, 86, 20, 32, 4, '#2e386a', 4);
      d.rect(30, 10, 48, 4, '#2a3260', { round: 0.4 });
      d.deco.circ(29, 12, 2.6, '#e8c040', { unlit: true }); d.deco.circ(79, 12, 2.6, '#e8c040', { unlit: true });
      // lanternes rouges
      for (const x of [20, 88]) { d.deco.line(x, 47, x, 50, 0.6, '#2a1a10'); d.ell(x, 54, 4, 5, '#e04838', 0, { shiny: true }); d.deco.line(x - 3.6, 54, x + 3.6, 54, 0.6, '#8a2418'); d.deco.rect(x - 1.5, 48.6, 3, 1.4, '#2a1a10'); }
      // bannières
      for (const x of [4, 104]) { d.tube([[x, 92], [x, 40]], 2, 1.6, '#5a3a22'); d.rect(x - (x < 50 ? -1 : 9), 42, 8, 20, '#e04040', { round: 0.1 }); d.deco.poly([[x - (x < 50 ? -5 : 5) + 0.5, 46], [x - (x < 50 ? -5 : 5) - 2, 52], [x - (x < 50 ? -5 : 5) + 1, 52], [x - (x < 50 ? -5 : 5) - 1, 57], [x - (x < 50 ? -5 : 5) + 2.5, 50.5], [x - (x < 50 ? -5 : 5) - 0.5, 50.5]], '#ffe040', { unlit: true }); }
    } },

    // ---------------------------------------------------------- Restaurant de Mushroomon (5×3)
    restaurant: { w: 100, h: 104, n: 1, lights: [[34, 72, 18], [72, 72, 18], [52, 50, 14]], smoke: [80, 6], draw(d) {
      d.ell(50, 101, 46, 3.4, '#3a2a18', 0, { flat: true });
      // terrasse : petite table et tabourets
      d.ell(88, 92, 7, 3, '#c07830'); d.tube([[88, 100], [88, 93]], 2, 2, WOOD_D);
      d.ell(80, 99, 3, 2, '#e05a5a'); d.ell(96, 99, 3, 2, '#e05a5a');
      d.ell(86, 90, 2, 1.2, '#f8f0e0'); d.ell(90, 90.5, 1.6, 1, '#e8c060');
      // ardoise du menu
      d.rect(3, 80, 13, 16, '#2a3030', { round: 0.15 }); d.deco.rect(2, 79, 15, 2, WOOD); d.tube([[5, 100], [6, 95]], 1.6, 1.6, WOOD_D); d.tube([[14, 100], [13, 95]], 1.6, 1.6, WOOD_D);
      for (const y of [84, 88, 92]) d.deco.line(5.5, y, 13.5, y, 0.7, '#e8f0e8');
      // pied du champignon
      d.blob([[22, 100], [24, 70], [28, 50], [72, 50], [76, 70], [78, 100]], '#f4ead2', { tex: 0.12 });
      d.deco.ell(50, 100, 28, 3, '#d8c8a8');
      // porte et fenêtres rondes
      d.deco.ell(50, 82, 9, 9, '#6a3a1a'); d.deco.rect(41, 82, 18, 18, '#6a3a1a'); d.deco.line(50, 74, 50, 100, 0.8, '#4a2410');
      d.deco.circ(55, 90, 1.1, '#f0c040', { unlit: true });
      for (const x of [34, 66]) { d.deco.circ(x, 72, 6, '#8a5a2a'); d.deco.circ(x, 72, 4.6, '#ffd88a'); d.deco.circ(x - 1.4, 70.6, 1.6, '#fff4d0', { unlit: true }); d.deco.line(x - 4.6, 72, x + 4.6, 72, 0.7, '#8a5a2a'); }
      // chapeau
      d.ell(50, 58, 40, 6, '#c8a8d8');
      for (let x = 16; x <= 84; x += 5) d.deco.line(x, 55, 50 + (x - 50) * 0.6, 62, 0.6, '#9a7aaa');
      d.blob([[2, 54], [6, 34], [22, 14], [50, 6], [78, 14], [94, 34], [98, 54], [50, 60]], '#9a54c8', { shiny: true });
      for (const [x, y, r] of [[22, 30, 7], [50, 18, 8], [76, 32, 6.5], [36, 46, 5], [66, 48, 5.5], [10, 46, 3.5], [90, 48, 3.5], [58, 34, 3.5]]) d.ell(x, y, r, r * 0.85, '#f2e0ff', 0, { noshadow: true });
      // cheminée et enseigne
      d.rect(76, 4, 8, 16, '#7a6a72', { round: 0.4, far: true }); d.deco.rect(75, 4, 10, 2.6, '#4a3a42');
      d.rect(34, 60, 32, 10, '#c07830', { round: 0.3 });
      d.ell(44, 65, 3.4, 2, '#f8f0e0'); d.deco.line(52, 61.6, 52, 68.4, 0.9, '#f8f0e0'); d.deco.line(56, 61.6, 56, 68.4, 0.9, '#f8f0e0'); d.deco.line(51, 62, 51, 64, 0.6, '#f8f0e0'); d.deco.line(53, 62, 53, 64, 0.6, '#f8f0e0');
    } },

    // ---------------------------------------------------------- Jardin de Yokomon : serre fleurie (5×3)
    garden: { w: 100, h: 90, n: 1, lights: [[50, 58, 26]], draw(d) {
      d.ell(50, 87, 46, 3.4, '#3a2a18', 0, { flat: true });
      // muret
      d.rect(6, 72, 88, 15, '#c8b8a0', { round: 0.2, tex: 0.25 });
      for (let x = 10; x < 92; x += 10) d.deco.line(x, 74, x, 86, 0.7, '#9a8a74');
      // serre de verre
      d.blob([[8, 74], [10, 46], [22, 26], [50, 16], [78, 26], [90, 46], [92, 74]], '#a8e0e8', { shiny: true, tex: 0.08 });
      for (const k of [-1, -0.5, 0, 0.5, 1]) d.deco.curve([[50 + k * 42, 74], [50 + k * 38, 44], [50 + k * 22, 24], [50, 17]], 1, '#f4fbff');
      for (const y of [34, 50, 62]) d.deco.curve([[8 + (74 - y) * 0.05, y + 4], [50, y - 10], [92 - (74 - y) * 0.05, y + 4]], 0.9, '#f4fbff');
      // plantes à l'intérieur
      for (const [x, y, r, c] of [[24, 62, 7, '#4aa046'], [40, 58, 8, '#5ab452'], [60, 60, 7, '#3e9a40'], [76, 62, 7, '#5ab452'], [32, 48, 5, '#6ac860'], [66, 46, 5, '#6ac860']]) d.deco.circ(x, y, r, c);
      [[22, 58, '#ff8ac0'], [30, 62, '#fff070'], [42, 54, '#ffffff'], [48, 60, '#ff8ac0'], [58, 56, '#b48aff'], [66, 62, '#fff070'], [76, 58, '#ff8ac0'], [34, 46, '#ffffff'], [64, 44, '#ff8ac0']]
        .forEach(([x, y, c]) => d.deco.circ(x, y, 1.6, c, { unlit: true }));
      // porte en arche fleurie
      d.deco.ell(50, 68, 9, 8, '#7a5a3a'); d.deco.rect(41, 68, 18, 19, '#7a5a3a');
      d.deco.ell(50, 69, 7.4, 6.6, '#cfeef2'); d.deco.rect(42.6, 69, 14.8, 18, '#cfeef2'); d.deco.line(50, 62, 50, 87, 0.8, '#7a5a3a');
      d.tube([[38, 88], [38, 64], [44, 56], [50, 54], [56, 56], [62, 64], [62, 88]], 3.2, 3.2, '#3e9a40', { tex: 0.4 });
      [[38, 80], [38, 70], [41, 60], [47, 55], [53, 55], [59, 60], [62, 70], [62, 80]].forEach(([x, y], i) => d.deco.circ(x, y, 1.8, ['#ff8ac0', '#ffffff', '#fff070'][i % 3], { unlit: true }));
      // girouette fleur
      d.tube([[50, 17], [50, 6]], 1.4, 1.4, '#7a7a82');
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; d.circ(50 + Math.cos(a) * 3, 6 + Math.sin(a) * 3, 2, '#ff9ac8', { noshadow: true }); }
      d.circ(50, 6, 1.6, '#ffe060');
    } },

    // ---------------------------------------------------------- grande fontaine de la place (4×2) : v1 en eau, v2 à sec
    bigfountain: { w: 70, h: 56, n: 3, draw(d, v) {
      const dry = v !== 1, St = '#b4aea2', St2 = '#9a948a';
      d.ell(35, 42, 34, 12, St2, 0, { tex: 0.25 });
      d.ell(35, 40, 32, 10.5, St, 0, { tex: 0.2 });
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; d.deco.line(35 + Math.cos(a) * 28, 40 + Math.sin(a) * 9, 35 + Math.cos(a) * 32, 40 + Math.sin(a) * 10.5, 0.6, '#7a746a'); }
      d.deco.ell(35, 39.6, 27, 8, dry ? '#6a6052' : '#3a9ad8', 0, { unlit: !dry });
      if (dry) { d.deco.line(18, 38, 26, 42, 0.8, '#4a4236'); d.deco.line(44, 37, 52, 41, 0.8, '#4a4236'); d.deco.ell(22, 41, 3, 1.2, '#5aa040'); d.deco.ell(50, 39, 2.4, 1, '#5aa040'); d.deco.ell(38, 42, 4, 1.4, '#8a7a5a'); }
      else { d.deco.ell(35, 39.6, 22, 6, '#5ab8ec', 0, { unlit: true }); d.deco.ell(26, 38, 7, 1.6, '#c8f0ff', 0, { unlit: true }); d.deco.ell(46, 41, 5, 1.2, '#a8e4ff', 0, { unlit: true }); }
      // colonne et vasque
      d.rect(30, 16, 10, 22, St, { round: 0.5, tex: 0.2 });
      d.deco.line(30, 22, 40, 22, 0.8, St2); d.deco.line(30, 32, 40, 32, 0.8, St2);
      d.ell(35, 17, 14, 5, St, 0, { tex: 0.2 });
      d.deco.ell(35, 16.4, 11, 3.2, dry ? '#6a6052' : '#4ab0e8', 0, { unlit: !dry });
      d.rect(32.5, 4, 5, 12, St, { round: 0.5 });
      d.circ(35, 4, 4, St, { tex: 0.2 });
      if (!dry) {
        d.ell(35, 1.6, 2, 3, '#d8f8ff', 0, { unlit: true });
        for (const s of [-1, 1]) d.curve([[35 + s * 3, 4], [35 + s * 9, 6], [35 + s * 13, 16]], 1.4, '#a8e8ff', { unlit: true, noline: true, noshadow: true });
        for (const s of [-1, 1]) d.curve([[35 + s * 12, 18], [35 + s * 18, 22], [35 + s * 22, 36]], 1.4, '#a8e8ff', { unlit: true, noline: true, noshadow: true });
      } else d.poly([[38, 2], [42, 0], [41, 5]], St);
    } },
    // potager (3×2) : v0 envahi d'herbes, v1 cultivé
    vegpatch: { w: 52, h: 38, n: 2, draw(d, v) {
      if (!v) {
        // champ abandonné : terre craquelée envahie d'herbes folles
        d.blob([[1, 34], [2, 12], [12, 8], [30, 10], [50, 9], [51, 30], [40, 36], [14, 36]], '#7a5a38', { flat: true, tex: 0.3 });
        for (let r = 0; r < 4; r++) d.deco.line(5, 14 + r * 6.5, 47, 15 + r * 6.5, 1.6, '#5e4228');
        for (let i = 0; i < 14; i++) { const x = 4 + ((i * 37) % 44), y = 12 + ((i * 23) % 22); d.tube([[x, y + 3], [x - 1.5, y - 3]], 1.6, 0.6, i % 3 ? '#8a9a3a' : '#6a8a30'); d.tube([[x + 1, y + 3], [x + 2.5, y - 2]], 1.4, 0.6, '#9aaa48'); }
        d.tube([[44, 36], [43, 18]], 1.6, 1.4, '#6a4a2a'); d.tube([[43, 22], [48, 26]], 1.2, 1, '#6a4a2a');
        return;
      }
      d.rect(1, 8, 50, 29, '#7a5030', { round: 0.08, flat: true });
      for (let r = 0; r < 4; r++) {
        const y = 12 + r * 6.5;
        d.deco.rect(3, y + 2, 46, 2.4, '#5a3818');
        for (let x = 6; x < 44; x += 6) { const c = r % 2 ? '#5ab452' : '#7ac850'; d.circ(x, y, 2.8, c, { tex: 0.4, noshadow: true }); if (r % 2) d.deco.circ(x + 1, y + 1, 0.8, '#ff8a3a', { unlit: true }); }
      }
      // épouvantail
      d.tube([[46, 36], [46, 10]], 1.6, 1.6, '#8a5a32');
      d.tube([[39, 16], [53, 16]], 1.4, 1.4, '#8a5a32'); d.blob([[41, 17], [51, 17], [50, 28], [42, 28]], '#4a7ac8', { tex: 0.2 }); d.circ(46, 10, 4, '#e8c878'); d.poly([[40, 8], [46, 3], [52, 8]], '#c8943a');
    } },

    // ---------------------------------------------------------- mobilier urbain
    // clôture de v cases (posée via map.objects)
    fence: { w: v => v * 16, h: 22, n: 1, draw(d, v) {
      const W = v * 16;
      d.rect(0, 8, W, 3, '#c8945a', { round: 0.3, tex: 0.2 }); d.rect(0, 14, W, 3, '#b8844c', { round: 0.3, tex: 0.2 });
      for (let x = 3; x < W; x += 16) { d.rect(x - 2, 4, 4, 17, '#a87442', { round: 0.3, tex: 0.25 }); d.poly([[x - 2, 4.5], [x, 2], [x + 2, 4.5]], '#a87442'); }
      d.rect(W - 4, 4, 4, 17, '#a87442', { round: 0.3, tex: 0.25 });
    } },
    hedge: { w: 18, h: 20, n: 2, draw(d, v) {
      d.ell(9, 18, 8, 2, '#1e4a1e', 0, { flat: true });
      d.rect(1, 4, 16, 14, v ? '#3e9446' : '#3a8c40', { round: 0.55, tex: 0.6, texSize: 1 });
      d.deco.ell(6, 7, 3, 1.4, '#6ac060'); d.deco.ell(12, 6.4, 2.4, 1.2, '#6ac060');
      if (v) { d.deco.circ(5, 12, 1, '#ffffff', { unlit: true }); d.deco.circ(12, 10, 1, '#ffd0e0', { unlit: true }); }
    } },
    flowerbed: { w: 20, h: 16, n: 3, draw(d, v) {
      d.rect(1, 7, 18, 8, '#9a5a2a', { round: 0.25, tex: 0.3 });
      d.deco.rect(2, 8, 16, 2, '#4a2a14');
      const cols = [['#ff5a7a', '#ffd84a', '#ffffff'], ['#b48aff', '#ff9ac8', '#fff2a0'], ['#ff9a4a', '#ffe060', '#ff5a5a']][v];
      for (let i = 0; i < 6; i++) { const x = 3 + i * 2.8, y = 5 + (i % 2) * 2; d.tube([[x, 9], [x, y + 1]], 1, 1, '#3a8a30'); d.circ(x, y, 1.8, cols[i % 3], { noshadow: true }); }
    } },
    well: { w: 30, h: 40, n: 1, draw(d) {
      d.ell(15, 37, 13, 3, '#3a2a18', 0, { flat: true });
      d.ell(15, 30, 12, 7, '#a8a296', 0, { tex: 0.35 });
      d.deco.ell(15, 28.6, 9, 4, '#1a2a3a'); d.deco.ell(13, 28, 4, 1.4, '#3a6a9a');
      for (let i = 0; i < 9; i++) d.deco.line(4 + i * 2.8, 31, 4 + i * 2.8, 36, 0.6, '#7a746a');
      d.tube([[4, 31], [4, 10]], 2.4, 2.2, WOOD); d.tube([[26, 31], [26, 10]], 2.4, 2.2, WOOD);
      d.tube([[4, 16], [26, 16]], 1.6, 1.6, WOOD_D); d.deco.line(15, 16, 15, 22, 0.6, '#c8c0b0');
      d.rect(12.5, 21, 5, 5, '#8a6a44', { round: 0.3 });
      d.poly([[0, 12], [15, 2], [30, 12]], '#b8583a', { shiny: true }); d.deco.line(1, 11.5, 29, 11.5, 0.9, '#7a2a18');
    } },
    crates: { w: 18, h: 24, n: 2, draw(d, v) {
      const box = (x, y, s, c) => { d.rect(x, y, s, s, c, { round: 0.1, tex: 0.3 }); d.deco.line(x, y, x + s, y + s, 0.8, '#6a4424'); d.deco.line(x + s, y, x, y + s, 0.8, '#6a4424'); d.deco.rect(x, y, s, 1.2, '#d8a870'); };
      box(1, 11, 12, '#b8844c'); box(v ? 7 : 4, 1, 10, '#c8945a');
      if (v) d.ell(15, 19, 2.6, 4, '#9a6a3c', 0, { tex: 0.2 });
    } },
    planter: { w: 14, h: 20, n: 2, draw(d, v) {
      d.poly([[2, 12], [12, 12], [10.5, 19], [3.5, 19]], '#c06a3a');
      d.deco.rect(2, 12, 10, 1.6, '#e08a5a');
      if (v) { d.circ(7, 7, 5, '#3e9a40', { tex: 0.5, texSize: 1 }); d.deco.circ(5, 5, 1.2, '#ff7a9a', { unlit: true }); d.deco.circ(9, 7, 1.2, '#ffd84a', { unlit: true }); }
      else { for (const a of [-0.7, -0.25, 0.25, 0.7]) d.tube([[7, 12], [7 + Math.sin(a) * 7, 12 - Math.cos(a) * 9]], 2, 0.6, '#4aa046'); }
    } },
    mailbox: { w: 12, h: 24, n: 1, draw(d) {
      d.tube([[6, 23], [6, 10]], 2, 2, WOOD_D);
      d.rect(1, 3, 10, 8, '#d84838', { round: 0.45, shiny: true });
      d.deco.rect(2, 6, 4, 1, '#3a1a10'); d.rect(10, 1, 1.4, 5, '#ffd040');
    } },
    lantern: { w: 14, h: 36, n: 1, draw(d) {
      d.ell(7, 35, 5, 1.6, '#2a2a2a', 0, { flat: true });
      d.rect(3, 29, 8, 5, '#9a948a', { tex: 0.3 });
      d.tube([[7, 30], [7, 12]], 2.6, 2.2, '#3a3040');
      d.poly([[1, 6], [7, 1], [13, 6]], '#3a3040'); d.rect(2, 6, 10, 9, '#3a3040', { round: 0.2 });
      d.deco.rect(3.6, 7.4, 6.8, 6.2, '#ffe08a', { unlit: true }); d.deco.rect(4.6, 8.4, 2, 2.6, '#ffffff', { unlit: true });
      d.deco.line(7, 7.4, 7, 13.6, 0.6, '#3a3040');
    } },
    bunting: { w: v => v * 16, h: 18, n: 1, draw(d, v) {
      const W = v * 16, cols = ['#e04848', '#ffd040', '#3a8ae8', '#4ac878', '#ff8ac0'];
      d.curve([[0, 3], [W / 2, 9], [W, 3]], 0.9, '#5a4a3a', { noline: true });
      for (let x = 4, i = 0; x < W - 3; x += 7, i++) { const y = 3 + Math.sin((x / W) * Math.PI) * 6; d.poly([[x - 2.6, y], [x + 2.6, y], [x, y + 6]], cols[i % 5], { noline: true, noshadow: true }); }
    } },
    // ---------------------------------------------------------- grand panneau d'affichage de la ville (façon tableau d'école), 2×1
    // v = nombre de notes épinglées (une par habitant revenu, 0 à 8) : le panneau se remplit avec la ville
    noticeboard: { w: 58, h: 62, n: 9, draw(d, v) {
      const Wd = '#8a5a30', Wl = '#b0804a', Wk = '#5a3a1e';
      d.ell(29, 60, 26, 2.6, '#2a2418', 0, { flat: true });
      d.tube([[8, 61], [8, 22]], 2.4, 2.2, Wk); d.tube([[50, 61], [50, 22]], 2.4, 2.2, Wk);      // pieds
      d.poly([[1, 12], [29, 2], [57, 12], [53, 15], [29, 6], [5, 15]], '#b84a3a', { shiny: true });  // petit toit
      d.rect(3, 13, 52, 34, Wd, { round: 0.06, tex: 0.3 }); d.deco.rect(3, 13, 52, 2, Wl);              // cadre
      d.deco.rect(6, 16, 46, 28, '#2e5a3e');                                                             // tableau vert
      d.deco.rect(6, 16, 46, 2, '#3e6e4e');
      d.deco.rect(16, 18, 26, 4, '#e8e8dc', { unlit: true });                                            // titre à la craie
      for (let k = 0; k < 3; k++) d.deco.line(9, 26 + k * 5, 9 + 14 + (k * 7) % 10, 26 + k * 5, 0.7, '#d8e0d4', { unlit: true });
      const notes = ['#fff4a0', '#ffc0d0', '#c0e8ff', '#c8f0b0', '#ffd8a0', '#e0c8ff', '#fff4a0', '#c0e8ff'];
      for (let k = 0; k < v; k++) {
        const x = 28 + (k % 4) * 6, y = 24 + Math.floor(k / 4) * 10;
        d.deco.rect(x, y, 5, 7, notes[k], { unlit: true }); d.deco.circ(x + 2.5, y + 0.5, 0.8, '#e04848', { unlit: true });
      }
      d.rect(5, 46, 48, 3, Wl, { round: 0.3 });                                                          // rebord (craies)
      d.deco.rect(12, 46.4, 4, 1.2, '#ffffff', { unlit: true }); d.deco.rect(19, 46.4, 3, 1.2, '#ffd0d0', { unlit: true });
    } },
  });
})();
