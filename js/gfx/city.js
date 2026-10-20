'use strict';
// =====================================================================
//  VILLE QUI GRANDIT — bâtiments des quartiers périphériques (maps/quartiers.js)
//  Maisons de ville, immeubles, boutiques, tour de l'horloge, tours de données
//  façon Digimon World 2003, statue, étals de marché, poteaux à câbles, arches de quartier.
//  Même technique que town.js : volumes ombrés (Art), décors peints (d.deco), lumières la nuit.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ, Art = DW.Art;
  const hx = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const shade = (col, k) => hx(Art.mix(Art.hex(col), k > 0 ? [255, 255, 255] : [30, 18, 40], Math.abs(k)));

  // fenêtre à croisillons (avec rebord et volets éventuels)
  function win(d, x, y, w, h, o = {}) {
    d.deco.rect(x - 1, y - 1, w + 2, h + 2, o.frame || '#f4ece0');
    d.deco.rect(x, y, w, h, o.glass || '#8ad0f0');
    d.deco.rect(x + 1, y + 1, Math.max(1, w * 0.35), Math.max(1, h * 0.3), '#d8f4ff', { unlit: true });
    d.deco.line(x + w / 2, y, x + w / 2, y + h, 0.7, o.frame || '#f4ece0'); d.deco.line(x, y + h / 2, x + w, y + h / 2, 0.7, o.frame || '#f4ece0');
    if (o.shutter) { d.deco.rect(x - 4, y - 1, 3, h + 2, o.shutter); d.deco.rect(x + w + 1, y - 1, 3, h + 2, o.shutter); }
    if (o.box) { d.deco.rect(x - 1, y + h + 1, w + 2, 3, '#8a5a32'); for (let k = 0; k < w; k += 3) d.deco.circ(x + 1 + k, y + h + 1, 1.3, ['#ff6a8a', '#ffe060', '#ffffff'][k % 3]); }
  }
  // porte avec marche
  function door(d, x, y, w, h, col) {
    d.deco.rect(x - 1, y - 1, w + 2, h + 1, '#5a3a22');
    d.deco.rect(x, y, w, h, col);
    d.deco.rect(x + 2, y + 3, w - 4, h * 0.35, shade(col, 0.25));
    d.deco.circ(x + w - 2.4, y + h * 0.55, 0.9, '#ffd860');
    d.rect(x - 3, y + h, w + 6, 3, '#b8b0a4', { round: 0.3 });
  }

  Object.assign(OBJ, {
    // ---------------------------------------------------------- chaumière rustique façon Digimon World 1 (4×3), 4 variantes
    // colombages sur enduit, soubassement de pierre, fenêtre ronde, porte cintrée ; toit de chaume, tuiles, ardoise ou mousse
    cottage: { w: 66, h: 80, n: 4, lights: [[18, 54, 12], [46, 50, 10]], smoke: [50, 6], draw(d, v) {
      const [plaster, beam, roofType, roof, doorc] = [['#f0e2c0', '#7a5030', 'thatch', '#d8b058', '#8a5a32'], ['#f4f0e6', '#5a3a26', 'tiles', '#c8503a', '#5a7a3a'],
        ['#ecd8b0', '#6a4a2a', 'slate', '#4a6488', '#a8502e'], ['#d8d0c0', '#5a4a3a', 'moss', '#5a8a3e', '#6a4a8a']][v];
      // soubassement de pierres
      d.rect(5, 66, 56, 11, '#a8a090', { round: 0.15, tex: 0.35 });
      for (let x = 7; x < 60; x += 7) d.deco.ell(x, 71 + ((x / 7) % 2) * 2, 3, 2, '#8a8270');
      // murs à colombages
      d.rect(7, 38, 52, 30, plaster, { round: 0.04, tex: 0.12 });
      for (const x of [7, 21, 45, 57]) d.deco.rect(x, 38, 2.4, 30, beam);
      d.deco.rect(7, 38, 52, 2.4, beam); d.deco.rect(7, 52, 14, 2, beam); d.deco.rect(45, 52, 14, 2, beam);
      d.deco.line(9, 66, 21, 54, 1.6, beam); d.deco.line(57, 66, 47, 54, 1.6, beam);
      // toit
      const R = [[0, 44], [12, 10], [54, 10], [66, 44]];
      if (roofType === 'thatch') {
        d.blob([[-1, 46], [6, 22], [16, 8], [33, 4], [50, 8], [60, 22], [67, 46], [33, 50]], roof, { tex: 0.35, texSize: 1 });
        for (let k = 0; k < 26; k++) { const x = 4 + k * 2.4; d.deco.line(x, 14 + Math.abs(x - 33) * 0.2, x - 1, 44, 0.6, shade(roof, -0.28)); }
        for (let x = 0; x < 67; x += 4) d.deco.ell(x + 1, 45 + Math.sin(x) * 0.8, 2.6, 2, shade(roof, -0.15));
      } else {
        d.poly(R, roof, { tex: 0.18 });
        for (let r = 0; r < 6; r++) {
          const y = 15 + r * 5.4, x0 = 11 - r * 2, x1 = 55 + r * 2;
          if (roofType === 'tiles') for (let x = x0; x < x1; x += 6) d.deco.ell(x + (r % 2) * 3, y, 2.8, 2.2, shade(roof, -0.25));
          else if (roofType === 'slate') { d.deco.line(x0, y, x1, y, 0.9, shade(roof, -0.35)); for (let x = x0 + (r % 2) * 3; x < x1; x += 6) d.deco.line(x, y, x, y + 5, 0.6, shade(roof, -0.3)); }
          else for (let x = x0; x < x1; x += 7) d.deco.ell(x + (r % 2) * 3.5, y + 1, 3.4, 2.2, shade(roof, (r + x) % 3 ? -0.18 : 0.12));
        }
        d.deco.line(0, 44, 66, 44, 1.6, shade(roof, -0.45));
        if (roofType === 'moss') for (const [x, y] of [[18, 20], [40, 26], [28, 34]]) d.deco.circ(x, y, 1.6, '#ff9ac0');
      }
      // cheminée de pierre
      d.rect(46, 4, 9, 16, '#9a9080', { round: 0.15, tex: 0.35 }); d.deco.rect(45, 4, 11, 2.4, '#7a7060');
      // fenêtre ronde (étage) et fenêtre à volets (rez-de-chaussée), bac à fleurs
      d.circ(33, 24, 5.4, beam); d.deco.circ(33, 24, 4, '#8ad0f0'); d.deco.line(33, 20, 33, 28, 0.8, beam); d.deco.line(29, 24, 37, 24, 0.8, beam);
      d.deco.circ(31.6, 22.4, 1.2, '#d8f4ff', { unlit: true });
      win(d, 12, 45, 9, 10, { frame: beam, shutter: shade(doorc, 0.1), box: true });
      win(d, 47, 45, 8, 8, { frame: beam });
      // porte cintrée en planches, lanterne
      d.deco.ell(33, 52, 7, 5, '#4a2e1a'); d.deco.rect(26, 52, 14, 15, '#4a2e1a');
      d.deco.ell(33, 53, 5.6, 4, doorc); d.deco.rect(27.4, 53, 11.2, 14, doorc);
      for (let x = 30; x < 38; x += 3) d.deco.line(x, 50, x, 67, 0.6, shade(doorc, -0.3));
      d.deco.circ(36.6, 60, 0.9, '#ffd860');
      d.tube([[42, 50], [44, 50]], 0.6, 0.6, '#3a3a42'); d.deco.rect(43, 50, 3, 4, '#ffe080', { unlit: true });
      d.rect(26, 67, 14, 3, '#b8b0a4', { round: 0.4 });
    } },
    // ---------------------------------------------------------- maison de ville (4×3), 4 variantes
    townhouse: { w: 64, h: 78, n: 4, lights: [[16, 52, 12], [48, 52, 12], [32, 30, 10]], smoke: [48, 4], draw(d, v) {
      const [wall, roof, trim, doorc] = [['#f4e4c8', '#c8503a', '#ffffff', '#4a7ac8'], ['#d8ecf0', '#3a6aa8', '#ffffff', '#c84a4a'],
        ['#f8d8d8', '#8a4a8a', '#fff4f4', '#4a9a5a'], ['#e8f0d0', '#4a8a4a', '#ffffff', '#c8903a']][v];
      d.rect(5, 36, 54, 40, wall, { round: 0.05, tex: 0.12 });
      d.deco.rect(5, 70, 54, 6, shade(wall, -0.18));
      for (const x of [5, 57]) d.deco.rect(x, 36, 2, 40, trim);
      // toit à deux pans + lucarne
      d.poly([[0, 40], [14, 12], [50, 12], [64, 40]], roof, { tex: 0.18 });
      for (let r = 0; r < 5; r++) d.deco.line(10 - r * 2.6, 17 + r * 5.4, 54 + r * 2.6, 17 + r * 5.4, 0.8, shade(roof, -0.3));
      d.deco.line(0, 40, 64, 40, 1.4, shade(roof, -0.45));
      d.rect(25, 16, 14, 14, wall, { round: 0.1 }); d.poly([[22, 18], [32, 9], [42, 18]], roof);
      win(d, 28, 19, 8, 8, { frame: trim });
      // cheminée
      d.rect(44, 2, 8, 14, '#a8705a', { round: 0.1, tex: 0.3 }); d.deco.rect(43, 2, 10, 2.4, '#7a4a3a');
      win(d, 10, 46, 12, 11, { frame: trim, shutter: shade(doorc, -0.1), box: true });
      win(d, 42, 46, 12, 11, { frame: trim, shutter: shade(doorc, -0.1), box: true });
      door(d, 27, 54, 10, 19, doorc);
      d.deco.rect(25, 51, 14, 3, shade(roof, 0.1));
      // petite boîte aux lettres et numéro
      d.deco.rect(44, 62, 6, 5, '#c84a3a'); d.deco.circ(32, 50, 2, '#ffd860'); d.deco.circ(32, 50, 1, trim);
    } },
    // ---------------------------------------------------------- immeuble (5×3) : 3 étages, fenêtres allumées la nuit
    apartment: { w: 82, h: 118, n: 2, lights: [[18, 40, 9], [41, 40, 9], [64, 40, 9], [18, 64, 9], [41, 64, 9], [64, 64, 9], [18, 88, 9], [64, 88, 9]], draw(d, v) {
      const [wall, band, roof] = [['#e0d0c0', '#a86a50', '#5a5a6a'], ['#c8d4e0', '#4a6a90', '#4a4a5a']][v];
      d.rect(4, 22, 74, 94, wall, { round: 0.03, tex: 0.12 });
      for (const y of [48, 72, 96]) d.deco.rect(4, y, 74, 3, band);
      d.rect(1, 14, 80, 10, roof, { round: 0.2 }); d.deco.rect(1, 22, 80, 2, shade(roof, -0.3));
      // toit : château d'eau, antenne
      d.rect(58, 2, 14, 13, '#8a6a4a', { round: 0.3, tex: 0.2 }); d.poly([[56, 4], [65, -2], [74, 4]], '#6a4a3a');
      d.tube([[14, 14], [14, 0]], 0.9, 0.9, '#7a7a82'); d.deco.line(10, 4, 18, 4, 0.8, '#7a7a82'); d.deco.line(11, 8, 17, 8, 0.8, '#7a7a82');
      for (const y of [30, 54, 78]) for (const x of [12, 35, 58]) {
        win(d, x, y, 12, 12, { frame: '#f4f0e8', glass: (x + y) % 3 ? '#8ad0f0' : '#f0e0a0' });
        d.deco.rect(x - 2, y + 13, 16, 2, '#c8c0b4');
      }
      // balcons du milieu
      for (const x of [33]) { d.deco.rect(x - 1, 66, 18, 6, '#6a6a72'); for (let k = 0; k < 18; k += 3) d.deco.line(x + k, 66, x + k, 72, 0.6, '#9a9aa2'); }
      door(d, 34, 100, 14, 16, '#5a4a3a'); d.deco.rect(31, 97, 20, 3, band);
      d.deco.rect(54, 104, 10, 6, '#f4f0e8'); d.deco.rect(55, 105, 8, 4, '#4a6ab0');
    } },
    // ---------------------------------------------------------- boutique à auvent (4×3) : enseigne à icône
    shopfront: { w: 64, h: 76, n: 4, lights: [[32, 52, 22]], draw(d, v) {
      const [wall, awn, icon] = [['#f4e8d0', '#e85a5a', 'meat'], ['#e0ecf8', '#4a8ad8', 'potion'], ['#f8f0d8', '#4ab060', 'flower'], ['#f0e0f0', '#a86ad8', 'star']][v];
      d.rect(4, 22, 56, 52, wall, { round: 0.04, tex: 0.12 });
      d.rect(2, 14, 60, 10, shade(wall, -0.25), { round: 0.2 });
      // enseigne
      d.rect(16, 4, 32, 12, '#5a3a22', { round: 0.3 }); d.deco.rect(18, 6, 28, 8, '#f8f0e0');
      const cx = 32, cy = 10;
      if (icon === 'meat') { d.deco.ell(cx + 1, cy, 5, 3, '#c84838'); d.deco.rect(cx - 7, cy - 0.7, 4, 1.4, '#f4ece0'); }
      else if (icon === 'potion') { d.deco.circ(cx, cy + 1, 3, '#5ac8f0'); d.deco.rect(cx - 1, cy - 4, 2, 3, '#9aa8b8'); }
      else if (icon === 'flower') { for (let k = 0; k < 5; k++) { const a = k * 1.256; d.deco.circ(cx + Math.cos(a) * 2.6, cy + Math.sin(a) * 2.6, 1.6, '#ff8ac0'); } d.deco.circ(cx, cy, 1.3, '#ffe060'); }
      else { const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.6 : 4; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } d.deco.poly(pts, '#ffc040'); }
      // auvent rayé
      d.poly([[0, 30], [64, 30], [60, 40], [4, 40]], awn);
      for (let x = 4; x < 60; x += 8) d.deco.poly([[x, 30], [x + 4, 30], [x + 4, 40], [x, 40]], '#ffffff');
      for (let x = 4; x < 62; x += 8) d.deco.ell(x + 2, 40, 2, 1.6, awn);
      // vitrine et porte
      d.deco.rect(8, 44, 26, 20, '#3a4a5a'); d.deco.rect(9, 45, 24, 18, '#9ad8f0');
      for (const [x, c] of [[13, '#ff7a5a'], [19, '#ffd04a'], [25, '#5ab8f0'], [30, '#4ac878']]) d.deco.rect(x - 2, 55, 4, 7, c);
      d.deco.rect(9, 62, 24, 1.6, '#8a5a32');
      door(d, 40, 46, 13, 26, shade(awn, -0.2));
      d.deco.rect(42, 50, 9, 8, '#9ad8f0');
      d.rect(5, 68, 8, 6, '#8a5a32', { round: 0.2 }); d.circ(9, 66, 4, '#3e9a40', { tex: 0.4 });
    } },
    // ---------------------------------------------------------- tour de l'horloge (3×2)
    clocktower: { w: 50, h: 128, n: 1, frames: 2, fps: 1, lights: [[25, 30, 18, 'rgba(255,240,180,0.6)']], draw(d, v, f = 0) {
      d.rect(4, 96, 42, 30, '#c8beb0', { round: 0.05, tex: 0.25 });
      d.rect(9, 18, 32, 80, '#e0d4c0', { round: 0.03, tex: 0.18 });
      for (let y = 26; y < 96; y += 8) d.deco.line(9, y, 41, y, 0.6, '#b8ab98');
      d.poly([[5, 20], [25, -2], [45, 20]], '#3a6a8a', { shiny: true }); d.deco.line(5, 20, 45, 20, 1.4, '#2a4a6a');
      d.circ(25, 32, 10, '#f8f4e8', { shiny: true }); d.deco.circ(25, 32, 8.6, '#fffaf0');
      for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; d.deco.circ(25 + Math.cos(a) * 7.2, 32 + Math.sin(a) * 7.2, 0.7, '#3a3a42'); }
      const a1 = f * 0.5 - 1.2, a2 = f * 0.08 - 0.4;
      d.deco.line(25, 32, 25 + Math.cos(a1) * 6.4, 32 + Math.sin(a1) * 6.4, 0.9, '#2a2a32'); d.deco.line(25, 32, 25 + Math.cos(a2) * 4.2, 32 + Math.sin(a2) * 4.2, 1.2, '#2a2a32');
      win(d, 20, 54, 10, 14, { frame: '#f4ece0' }); win(d, 20, 76, 10, 12, { frame: '#f4ece0' });
      d.deco.rect(19, 104, 12, 20, '#5a3a22'); d.deco.ell(25, 104, 6, 4, '#5a3a22');
      d.deco.rect(4, 96, 42, 3, '#a89a88');
    } },
    // ---------------------------------------------------------- tour de données (3×2) façon Digimon World 2003
    datatower: { w: 50, h: 132, n: 2, frames: 4, fps: 3, lights: [[25, 40, 20, 'rgba(90,255,200,0.55)'], [25, 90, 14, 'rgba(90,200,255,0.5)']], draw(d, v, f = 0) {
      const [metal, glow] = [['#7a8494', '#3af0b0'], ['#8a7a94', '#ff6ae0']][v];
      d.rect(6, 104, 38, 26, shade(metal, -0.15), { round: 0.08, tex: 0.2 });
      d.poly([[12, 106], [16, 20], [34, 20], [38, 106]], metal, { shiny: true });
      for (let y = 30; y < 104; y += 10) { d.deco.line(14.5 - (y - 20) * 0.047 + 2, y, 35.5 + (y - 20) * 0.047 - 2, y, 0.8, shade(metal, -0.35)); }
      for (let k = 0; k < 6; k++) { const y = 32 + k * 12, on = (k + f) % 4 !== 0; d.deco.rect(19, y, 12, 4, on ? glow : shade(glow, -0.6), { unlit: on }); }
      d.rect(13, 12, 24, 10, shade(metal, 0.15), { round: 0.3 });
      d.tube([[25, 12], [25, -2]], 1.2, 0.8, '#b8c0c8'); d.deco.circ(25, -1, 2, f % 2 ? glow : '#ff4040', { unlit: true });
      d.ell(10, 16, 6, 3, '#d8dce4', -0.5, { shiny: true }); d.tube([[13, 18], [16, 22]], 0.9, 0.9, '#9aa0a8');
      d.deco.rect(18, 112, 14, 18, '#2a2a32'); d.deco.rect(19, 113, 12, 16, shade(glow, -0.5), { unlit: true });
      d.deco.rect(8, 108, 6, 4, glow, { unlit: true }); d.deco.rect(36, 108, 6, 4, glow, { unlit: true });
    } },
    // ---------------------------------------------------------- statue de Digimon sur socle (2×1)
    digistatue: { w: 36, h: 56, n: 2, draw(d, v) {
      const stone = ['#d8d0c4', '#c8b070'][v];
      d.rect(4, 40, 28, 14, shade(stone, -0.1), { round: 0.06, tex: 0.25 }); d.rect(2, 38, 32, 4, stone, { round: 0.3 });
      d.deco.rect(10, 45, 16, 4, shade(stone, -0.3));
      // silhouette de petit dinosaure (façon Agumon)
      d.ell(18, 28, 8, 9, stone, 0, { shiny: true }); d.ell(20, 16, 7, 6, stone, 0.2, { shiny: true });
      d.tube([[11, 32], [5, 36]], 2.6, 1.2, stone); d.tube([[14, 36], [13, 39]], 2.4, 2.4, stone); d.tube([[22, 36], [23, 39]], 2.4, 2.4, stone);
      d.tube([[24, 24], [28, 20]], 1.8, 1.2, stone);
      d.deco.circ(23, 14, 1.2, shade(stone, -0.5));
    } },
    // ---------------------------------------------------------- étal de marché (3×2) : toile et marchandises
    marketstall: { w: 50, h: 48, n: 3, draw: DW.World.secours.boite(50, 48) },
    // ---------------------------------------------------------- poteau à câbles (1×1) : câbles vers la droite
    cablepole: { w: 40, h: 60, n: 1, draw(d) {
      d.tube([[8, 58], [8, 6]], 1.8, 1.4, '#6a5a4a'); d.rect(1, 8, 14, 3, '#5a4a3a', { round: 0.3 });
      for (const x of [2, 8, 14]) d.deco.circ(x, 8, 1, '#e8e0d0');
      for (const [y, s] of [[9, 6], [9, 9], [10, 12]]) d.deco.curve([[2 + s / 3, y], [20, y + s], [40, y + 2]], 0.5, '#2a2a32');
      d.deco.rect(5, 30, 6, 8, '#e8d870'); d.deco.rect(6, 31, 4, 3, '#2a2a32');
    } },
    // ---------------------------------------------------------- arche d'entrée de quartier (on passe dessous), 3 styles
    districtgate: { w: 96, h: 76, n: 3, draw(d, v) {
      const [post, beam, panel] = [['#c8a070', '#c84a32', '#f4ece0'], ['#d8d4cc', '#e8a040', '#fff8e8'], ['#7a8494', '#3af0b0', '#1a2a3a']][v];
      for (const x of [8, 88]) { d.rect(x - 6, 22, 12, 52, post, { round: 0.1, tex: 0.2 }); d.rect(x - 8, 68, 16, 6, shade(post, -0.2), { round: 0.2 }); d.deco.circ(x, 34, 2.4, beam); }
      d.rect(0, 12, 96, 12, beam, { round: 0.25, shiny: true });
      d.poly([[0, 14], [48, 0], [96, 14]], shade(beam, -0.15));
      d.rect(30, 14, 36, 14, panel, { round: 0.2 }); d.deco.rect(33, 17, 30, 8, shade(panel, v === 2 ? 0.1 : -0.06));
      if (v === 2) for (let k = 0; k < 5; k++) d.deco.rect(35 + k * 6, 19, 3, 4, beam, { unlit: true });
      else for (let k = 0; k < 4; k++) d.deco.circ(39 + k * 6, 21, 1.8, beam);
      d.deco.circ(14, 18, 2, '#ffe070', { unlit: true }); d.deco.circ(82, 18, 2, '#ffe070', { unlit: true });
    } },
  });
  // bâtiments des quartiers dessinés 30 % plus grands (proportions façon Digimon World : ils dominent le héros)
  for (const k of ['cottage', 'townhouse', 'apartment', 'shopfront', 'marketstall', 'clocktower', 'datatower', 'digistatue', 'cablepole']) OBJ[k].scale = 1.3;
})();
