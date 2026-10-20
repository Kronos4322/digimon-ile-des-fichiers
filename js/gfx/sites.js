'use strict';
// =====================================================================
//  LIEUX EMBLÉMATIQUES DES SOUS-ZONES (Digimon World 1 / saison 1)
//  Grands décors posés en « pièce maîtresse » (chalet, phare, manège, Arbre-Monde...)
//  et petits repères (drapeaux de prière, orgues de basalte, télévisions empilées...)
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const shade = DW.World.Paint.shade;

  Object.assign(OBJ, {
    // ---------------------------------------------------------- montagne
    flagpole: { w: 30, h: 40, n: 1, frames: 4, fps: 4, draw(d, v, f = 0) {
      d.tube([[4, 39], [4, 4]], 1.6, 1.2, '#6a4a2a'); d.tube([[26, 39], [26, 8]], 1.6, 1.2, '#6a4a2a');
      const cols = ['#e04a3a', '#f0c030', '#4a9ae0', '#5ac06a', '#ffffff'];
      for (let i = 0; i < 5; i++) {
        const x = 6 + i * 4, y = 6 + i * 0.9 + Math.sin(i * 0.8) * 1.6, sw = Math.sin(f * 1.6 + i) * 1;
        d.deco.poly([[x, y], [x + 3.4, y + 0.4], [x + 2.8 + sw, y + 5], [x + sw * 0.5, y + 4.6]], cols[i]);
      }
      d.deco.curve([[4, 5], [15, 10], [26, 9]], 0.5, '#3a2a1a');
    } },
    chalet: { w: 64, h: 56, n: 1, smoke: [46, 4], lights: [[20, 36, 16], [44, 36, 16]], draw(d) {
      d.rect(4, 26, 56, 28, '#8a5a32', { tex: 0.4 });
      for (let y = 30; y < 54; y += 4) d.deco.line(4, y, 60, y, 0.6, '#5a3a1e');
      d.poly([[0, 28], [32, 6], [64, 28]], '#4a3a3a', { shiny: true });
      d.deco.poly([[2, 27], [32, 7.4], [62, 27], [32, 10]], '#f4f8ff');
      d.rect(42, 2, 6, 14, '#6a6a70');
      for (const x of [14, 38]) { d.deco.rect(x, 32, 12, 10, '#f0d080'); d.deco.line(x + 6, 32, x + 6, 42, 0.8, '#5a3a1e'); d.deco.rect(x - 1, 42, 14, 2, '#c84a3a'); }
      d.rect(28, 40, 8, 14, '#4a2a14');
    } },
    // ---------------------------------------------------------- volcan
    basalt: { w: 24, h: 40, n: 2, draw(d, v) {
      const hs = v ? [24, 34, 28, 18] : [30, 22, 36, 26];
      hs.forEach((h, i) => { const x = 3 + i * 5; d.rect(x, 39 - h, 5, h, i % 2 ? '#3a3440' : '#2e2a34', { shiny: true }); d.deco.poly([[x, 39 - h], [x + 2.5, 37 - h], [x + 5, 39 - h], [x + 2.5, 41 - h]], '#5a5466'); });
    } },
    telescope: { w: 24, h: 34, n: 1, draw(d) {
      d.tube([[12, 33], [6, 20]], 1.4, 1.2, '#5a5a62'); d.tube([[12, 33], [18, 20]], 1.4, 1.2, '#5a5a62'); d.tube([[12, 33], [12, 20]], 1.4, 1.2, '#5a5a62');
      d.tube([[4, 22], [22, 10]], 5, 3.6, '#c8a040', { shiny: true }); d.deco.ell(22, 10, 2, 2, '#8ad0f0');
      d.rect(9, 30, 6, 3, '#8a8a90');
    } },
    // ---------------------------------------------------------- savane
    baobab: { w: 56, h: 60, n: 1, big: true, draw: DW.World.secours.arbre(56, 60) },
    gearmill: { w: 36, h: 64, n: 1, frames: 6, fps: 6, draw(d, v, f = 0) {
      d.poly([[14, 63], [16, 22], [20, 22], [22, 63]], '#8a8a90', { shiny: true });
      for (let y = 30; y < 62; y += 8) d.deco.line(15.4, y, 20.6, y + 6, 0.6, '#5a5a62');
      const a0 = f * Math.PI / 9, pts = [];
      for (let i = 0; i < 20; i++) { const a = a0 + (i / 20) * Math.PI * 2, r = i % 2 ? 13 : 16; pts.push([18 + Math.cos(a) * r, 18 + Math.sin(a) * r]); }
      d.poly(pts, '#b07a4a', { shiny: true }); d.deco.ell(18, 18, 9, 9, '#c89a6a'); d.deco.ell(18, 18, 3, 3, '#5a3a24');
      for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2; d.deco.line(18 + Math.cos(a) * 3, 18 + Math.sin(a) * 3, 18 + Math.cos(a) * 8.6, 18 + Math.sin(a) * 8.6, 1.4, '#5a3a24'); }
    } },
    lionrock: { w: 80, h: 64, n: 1, draw(d) {
      d.blob([[2, 63], [6, 34], [18, 14], [38, 6], [56, 10], [70, 26], [78, 63]], '#b08a5a', { tex: 0.4 });
      d.blob([[34, 24], [40, 12], [52, 10], [62, 18], [64, 32], [54, 40], [40, 38]], '#c89a64', { tex: 0.35 });
      d.deco.ell(46, 22, 2.4, 1.6, '#3a2410', 0, { unlit: true }); d.deco.ell(56, 22, 2.4, 1.6, '#3a2410', 0, { unlit: true });
      d.deco.poly([[48, 28], [54, 28], [51, 32]], '#5a3a20', { unlit: true });
      for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.95 + i * 0.25; d.deco.curve([[51 + Math.cos(a) * 12, 24 + Math.sin(a) * 12], [51 + Math.cos(a) * 18, 24 + Math.sin(a) * 17]], 2, '#8a5a2a'); }
      d.deco.line(6, 50, 74, 52, 1, '#8a6a40');
    } },
    // ---------------------------------------------------------- usine
    robotarm: { w: 40, h: 48, n: 1, frames: 4, fps: 3, draw(d, v, f = 0) {
      const a = [0, 0.25, 0.4, 0.2][f];
      d.rect(8, 40, 22, 7, '#5a5e68', { round: 0.3 }); d.deco.rect(8, 40, 22, 2, '#f0c020');
      const sx = 19, sy = 40, ex = sx + Math.cos(-1.9 + a) * 18, ey = sy + Math.sin(-1.9 + a) * 18, hx = ex + Math.cos(-0.5 + a) * 14, hy = ey + Math.sin(-0.5 + a) * 14;
      d.tube([[sx, sy], [ex, ey]], 5, 4.4, '#f0a020', { shiny: true }); d.tube([[ex, ey], [hx, hy]], 4, 3.4, '#f0a020', { shiny: true });
      d.circ(sx, sy, 3.6, '#3a3e48'); d.circ(ex, ey, 3, '#3a3e48');
      d.tube([[hx, hy], [hx + 4, hy - 3]], 1.4, 1, '#9aa2b0'); d.tube([[hx, hy], [hx + 4, hy + 3]], 1.4, 1, '#9aa2b0');
    } },
    crane: { w: 64, h: 80, n: 1, draw(d) {
      d.rect(6, 72, 18, 7, '#5a5e68');
      for (let y = 10; y < 74; y += 8) { d.deco.line(10, y, 20, y + 8, 0.8, '#b08a20'); d.deco.line(20, y, 10, y + 8, 0.8, '#b08a20'); }
      d.rect(9, 8, 2, 66, '#f0c020'); d.rect(19, 8, 2, 66, '#f0c020');
      d.rect(4, 6, 58, 4, '#f0c020', { shiny: true }); d.rect(2, 2, 12, 6, '#3a3e48');
      d.tube([[52, 10], [52, 40]], 0.5, 0.5, '#2a2a2e'); d.rect(46, 40, 12, 8, '#8a5a3a', { round: 0.2 });
    } },
    // ---------------------------------------------------------- décharge
    tirestack: { w: 22, h: 30, n: 1, draw(d) {
      for (let i = 0; i < 5; i++) { const y = 26 - i * 5, x = 11 + (i % 2 ? 1 : -1); d.ell(x, y, 9, 3.6, '#2a2a2e', 0, { tex: 0.25 }); d.deco.ell(x, y - 0.6, 4, 1.4, '#0e0e10'); }
    } },
    brokencar: { w: 52, h: 30, n: 2, draw(d, v) {
      const C = v ? '#3a6ac8' : '#c83a2a';
      d.rect(4, 12, 44, 12, C, { shiny: true, round: 0.3 }); d.poly([[12, 12], [18, 3], [34, 3], [40, 12]], shade(C, -0.15), { shiny: true });
      d.deco.poly([[15, 11], [19, 5], [25, 5], [25, 11]], '#2a3a4a'); d.deco.poly([[27, 11], [27, 5], [33, 5], [37, 11]], '#2a3a4a');
      d.deco.line(19, 6, 23, 10, 0.6, '#9ad0e0');
      for (const x of [13, 39]) d.ell(x, 25, 5, 4, '#1e1e22'); d.deco.ell(39, 25, 2, 1.6, '#5a5a5a');
      d.deco.ell(24, 18, 6, 2, '#8a5a2a'); d.deco.ell(8, 20, 3, 2, '#7a4a2a');
    } },
    tvstack: { w: 30, h: 40, n: 1, lights: [[15, 20, 14, 'rgba(140,220,255,0.5)']], draw(d) {
      [[4, 26, 22, 13, '#6a6a72'], [6, 14, 18, 12, '#8a7a6a'], [8, 3, 14, 11, '#5a5a62']].forEach(([x, y, w, h, c], i) => {
        d.rect(x, y, w, h, c, { shiny: true, round: 0.2 }); d.deco.rect(x + 2, y + 2, w - 6, h - 4, i === 1 ? '#7ad0f0' : '#2a3a4a');
        if (i === 1) for (let k = 0; k < 4; k++) d.deco.line(x + 2, y + 3 + k * 2, x + w - 4, y + 3 + k * 2, 0.4, '#ffffff');
      });
      d.tube([[15, 3], [10, -2]], 0.5, 0.4, '#3a3a3a'); d.tube([[15, 3], [20, -2]], 0.5, 0.4, '#3a3a3a');
    } },
    junkthrone: { w: 72, h: 64, n: 1, draw(d) {
      d.blob([[0, 63], [6, 36], [20, 26], [52, 26], [66, 36], [72, 63]], '#5a4a3a', { tex: 0.5 });
      d.rect(24, 6, 24, 36, '#9a8a6a', { shiny: true }); d.deco.rect(26, 8, 20, 30, '#c84a3a');
      d.rect(18, 34, 36, 10, '#7a6a52'); d.rect(16, 24, 8, 20, '#6a5a44'); d.rect(48, 24, 8, 20, '#6a5a44');
      d.poly([[24, 6], [30, 0], [36, 6], [42, 0], [48, 6]], '#e0c040', { shiny: true });
      d.deco.rect(8, 46, 9, 7, '#7a8090'); d.deco.ell(60, 48, 5, 5, '#2a2a2e'); d.deco.rect(30, 50, 12, 6, '#3a6ac8');
    } },
    // ---------------------------------------------------------- canyon
    elevator: { w: 48, h: 80, n: 1, frames: 4, fps: 2, draw(d, v, f = 0) {
      d.rect(2, 4, 4, 74, '#6a4428'); d.rect(42, 4, 4, 74, '#6a4428'); d.rect(0, 2, 48, 5, '#5a3a20', { tex: 0.3 });
      d.tube([[24, 6], [24, 22 + f * 8]], 0.6, 0.6, '#2a2a2e');
      const y = 22 + f * 8;
      d.rect(10, y, 28, 22, '#8a96a6', { shiny: true }); d.deco.rect(13, y + 3, 22, 12, '#3a4a5a');
      for (let k = 0; k < 4; k++) d.deco.line(15 + k * 5, y + 3, 15 + k * 5, y + 15, 0.6, '#8a96a6');
      d.circ(24, 6, 3, '#3a3a40');
    } },
    archrock: { w: 80, h: 56, n: 1, draw(d) {
      d.blob([[0, 55], [2, 26], [12, 8], [40, 2], [68, 8], [78, 26], [80, 55], [62, 55], [60, 30], [50, 20], [30, 20], [20, 30], [18, 55]], '#b06a40', { tex: 0.4 });
      for (let i = 0; i < 4; i++) d.deco.curve([[4, 50 - i * 9], [40, 44 - i * 10 - 10], [76, 50 - i * 9]], 0.6, '#7c4026');
      d.deco.blob([[10, 14], [30, 6], [44, 8], [26, 14]], '#d08a5a');
    } },
    // ---------------------------------------------------------- dinosaures
    giantnest: { w: 64, h: 36, n: 1, draw(d) {
      d.ell(32, 28, 30, 8, '#8a6a3a', 0, { tex: 0.6 });
      for (let i = 0; i < 14; i++) { const a = i * 0.45; d.deco.line(32 + Math.cos(a) * 18, 26 + Math.sin(a) * 4, 32 + Math.cos(a + 0.5) * 28, 28 + Math.sin(a + 0.5) * 7, 0.8, '#5a4020'); }
      [[22, 18, '#f4ead0'], [34, 15, '#e8f0d0'], [44, 19, '#f0e0d8']].forEach(([x, y, c]) => { d.ell(x, y, 7, 9, c, 0, { shiny: true }); d.deco.circ(x - 2, y - 2, 1.4, '#a8b080'); d.deco.circ(x + 2, y + 3, 1, '#a8b080'); });
      d.ell(32, 26, 26, 4, '#6a5030', 0, { tex: 0.5 });
    } },
    timeclock: { w: 40, h: 56, n: 1, frames: 4, fps: 4, draw(d, v, f = 0) {
      d.rect(16, 30, 8, 25, '#7a7a84', { tex: 0.3 }); d.rect(10, 50, 20, 5, '#5a5a64');
      d.ell(20, 18, 16, 16, '#c8a040', { shiny: true }); d.deco.ell(20, 18, 13, 13, '#fff8e0');
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; d.deco.circ(20 + Math.cos(a) * 11, 18 + Math.sin(a) * 11, 0.8, '#3a2a1a'); }
      const a1 = f * Math.PI / 2, a2 = -f * Math.PI / 6 - 1;
      d.deco.line(20, 18, 20 + Math.cos(a1) * 9, 18 + Math.sin(a1) * 9, 1, '#2a1a10'); d.deco.line(20, 18, 20 + Math.cos(a2) * 6, 18 + Math.sin(a2) * 6, 1.4, '#2a1a10');
      d.deco.circ(20, 18, 1.4, '#d83a3a');
    } },
    // ---------------------------------------------------------- jungle
    ruintemple: { w: 96, h: 72, n: 1, lights: [[48, 50, 20, 'rgba(120,255,160,0.5)']], draw(d) {
      for (let k = 0; k < 4; k++) d.rect(6 + k * 8, 46 - k * 12, 84 - k * 16, 14, k % 2 ? '#7a8a6a' : '#6a7a5a', { tex: 0.4 });
      for (let k = 0; k < 4; k++) for (let x = 6 + k * 8; x < 90 - k * 8; x += 8) d.deco.line(x, 46 - k * 12, x, 60 - k * 12, 0.5, '#4a5a3a');
      d.rect(40, 50, 16, 20, '#1a2014'); d.deco.ell(48, 50, 8, 5, '#1a2014');
      d.deco.ell(48, 6, 5, 4, '#5ae07a', 0, { unlit: true });
      for (let i = 0; i < 8; i++) d.deco.curve([[8 + i * 11, 44], [10 + i * 11, 54], [8 + i * 11, 66]], 1.2, i % 2 ? '#3a8a3a' : '#4a9a3a');
      d.rect(2, 60, 92, 10, '#6a7a5a', { tex: 0.4 });
    } },
    // ---------------------------------------------------------- Overdell
    chapel: { w: 72, h: 80, n: 1, lights: [[36, 44, 18, 'rgba(200,140,255,0.5)']], draw(d) {
      d.rect(10, 38, 52, 40, '#5a5464', { tex: 0.35 });
      d.poly([[4, 40], [36, 20], [68, 40]], '#2a2234', { shiny: true });
      d.rect(28, 6, 16, 24, '#5a5464', { tex: 0.3 }); d.poly([[24, 8], [36, -4], [48, 8]], '#2a2234', { shiny: true });
      d.deco.rect(35, -10, 2, 8, '#8a8494'); d.deco.rect(32, -8, 8, 2, '#8a8494');
      d.deco.ell(36, 16, 4, 4, '#c88aff', 0, { unlit: true });
      d.rect(28, 54, 16, 24, '#1a1420'); d.deco.ell(36, 55, 8, 5, '#1a1420');
      d.deco.poly([[14, 42], [24, 42], [24, 70], [14, 70]], '#2a2234'); d.deco.line(40, 22, 60, 60, 1.2, '#3a344a');
      d.blob([[50, 30], [62, 34], [66, 50], [56, 46]], '#2a2a34');
    } },
    gargoyle: { w: 22, h: 34, n: 1, draw(d) {
      d.rect(3, 24, 16, 9, '#6a6a74', { tex: 0.3 });
      d.ell(11, 17, 6, 7, '#5a5a64', 0, { tex: 0.3 }); d.ell(11, 9, 4.6, 4, '#5a5a64');
      d.poly([[4, 16], [-1, 6], [6, 12]], '#4a4a54'); d.poly([[18, 16], [23, 6], [16, 12]], '#4a4a54');
      d.poly([[8, 6], [8, 1], [10, 5]], '#4a4a54'); d.poly([[14, 6], [14, 1], [12, 5]], '#4a4a54');
      d.deco.circ(9.4, 9, 0.8, '#ff4a4a', { unlit: true }); d.deco.circ(12.6, 9, 0.8, '#ff4a4a', { unlit: true });
    } },
    // ---------------------------------------------------------- Bois Brumeux
    mistgate: { w: 64, h: 56, n: 1, draw(d) {
      d.rect(10, 12, 5, 43, '#c83a2a', { shiny: true }); d.rect(49, 12, 5, 43, '#c83a2a', { shiny: true });
      d.rect(2, 6, 60, 6, '#2a1a1a', { round: 0.4 }); d.poly([[0, 6], [4, 2], [60, 2], [64, 6]], '#2a1a1a');
      d.rect(6, 16, 52, 4, '#c83a2a');
      d.rect(28, 12, 8, 8, '#e8d8b0'); d.deco.line(30, 14, 34, 14, 0.6, '#2a1a1a'); d.deco.line(32, 14, 32, 18, 0.6, '#2a1a1a');
      d.rect(8, 52, 9, 3, '#3a3a3a'); d.rect(47, 52, 9, 3, '#3a3a3a');
    } },
    // ---------------------------------------------------------- Ville des Jouets
    carousel: { w: 80, h: 64, n: 1, frames: 6, fps: 6, lights: [[40, 30, 26]], draw(d, v, f = 0) {
      d.ell(40, 56, 36, 7, '#e8d8c0', 0, { shiny: true }); d.ell(40, 54, 34, 6, '#f25a5a');
      d.tube([[40, 54], [40, 14]], 2.4, 2.4, '#f2c63a', { shiny: true });
      for (let i = 0; i < 6; i++) {
        const a = f * Math.PI / 9 + i * Math.PI / 3, x = 40 + Math.cos(a) * 26, y = 48 + Math.sin(a) * 4;
        if (Math.sin(a) < -0.2) continue;
        d.tube([[x, 18], [x, y - 8]], 0.8, 0.8, '#f2c63a');
        d.ell(x, y - 8 + Math.sin(f + i) * 2, 5, 3.4, ['#ffffff', '#4ea4f2', '#f28ab4'][i % 3], 0, { shiny: true });
      }
      d.poly([[2, 20], [40, 2], [78, 20]], '#f25a5a', { shiny: true });
      for (let i = 0; i < 8; i++) d.deco.poly([[2 + i * 9.5, 20], [6.75 + i * 9.5, 26], [11.5 + i * 9.5, 20]], i % 2 ? '#ffffff' : '#f2c63a');
      d.deco.circ(40, 4, 2, '#f2c63a');
    } },
    teddy: { w: 30, h: 36, n: 2, draw(d, v) {
      const B = v ? '#c88a5a' : '#e8b0c8', Bl = shade(B, 0.3);
      d.ell(15, 27, 9, 8, B, 0, { tex: 0.3 }); d.ell(15, 13, 8, 7, B, 0, { tex: 0.3 });
      d.ell(8, 7, 3.4, 3.4, B); d.ell(22, 7, 3.4, 3.4, B); d.deco.ell(8, 7, 1.6, 1.6, Bl); d.deco.ell(22, 7, 1.6, 1.6, Bl);
      d.ell(6, 26, 3.4, 5, B); d.ell(24, 26, 3.4, 5, B); d.ell(10, 34, 4, 2.4, B); d.ell(20, 34, 4, 2.4, B);
      d.deco.ell(15, 16, 3.6, 2.6, Bl); d.deco.circ(15, 15, 1, '#2a1a1a', { unlit: true });
      d.deco.circ(12, 11.4, 1, '#2a1a1a', { unlit: true }); d.deco.circ(18, 11.4, 1, '#2a1a1a', { unlit: true });
      d.deco.poly([[11, 20], [15, 22], [19, 20], [15, 24]], '#d83a5a');
    } },
    toycastle: { w: 112, h: 96, n: 1, lights: [[56, 64, 30]], draw(d) {
      d.rect(16, 40, 80, 54, '#f2c6da', { tex: 0.15 });
      for (const [x, c] of [[4, '#4ea4f2'], [86, '#5ac46a']]) { d.rect(x, 24, 22, 70, '#f8d8e8'); d.poly([[x - 2, 26], [x + 11, 4], [x + 24, 26]], c, { shiny: true }); for (let k = 0; k < 3; k++) d.deco.rect(x + 3 + k * 6.6, 20, 4, 4, '#f8d8e8'); }
      d.rect(42, 18, 28, 30, '#f8d8e8'); d.poly([[38, 20], [56, 0], [74, 20]], '#f25a5a', { shiny: true });
      for (let k = 0; k < 9; k++) d.deco.rect(16 + k * 9, 36, 5, 5, '#f8d8e8');
      d.deco.ell(56, 30, 5, 5, '#f2c63a'); d.deco.circ(56, 30, 2.6, '#ffffff');
      d.rect(46, 66, 20, 28, '#a85a8a'); d.deco.ell(56, 66, 10, 7, '#a85a8a');
      for (const x of [24, 78]) { d.deco.rect(x, 52, 10, 12, '#fff4c0'); d.deco.line(x + 5, 52, x + 5, 64, 0.6, '#c87aa8'); }
      for (let k = 0; k < 6; k++) d.deco.circ(20 + k * 14, 90, 2, ['#f25a5a', '#4ea4f2', '#f2c63a'][k % 3]);
    } },
    // ---------------------------------------------------------- Terre Gelée
    frozenfall: { w: 64, h: 72, n: 1, lights: [[32, 40, 26, 'rgba(160,230,255,0.5)']], draw(d) {
      d.blob([[0, 71], [2, 20], [12, 4], [52, 4], [62, 20], [64, 71]], '#5a6a86', { tex: 0.4 });
      d.blob([[18, 71], [20, 10], [44, 10], [46, 71]], '#bfe6f8', { shiny: true });
      for (let i = 0; i < 6; i++) d.deco.line(22 + i * 4, 12, 21 + i * 4.2, 68, 1, i % 2 ? '#ffffff' : '#8ccaec');
      for (let i = 0; i < 7; i++) d.deco.poly([[19 + i * 4, 10], [21 + i * 4, 20 + (i % 3) * 4], [23 + i * 4, 10]], '#e8f6ff');
      d.ell(32, 69, 20, 4, '#d8f0fc', 0, { shiny: true });
      d.deco.blob([[0, 20], [10, 6], [30, 2], [20, 10]], '#f4f8ff');
    } },
    // ---------------------------------------------------------- lac
    lighthouse: { w: 40, h: 96, n: 1, lights: [[20, 14, 60, 'rgba(255,240,160,0.7)']], draw(d) {
      d.ell(20, 92, 18, 4, '#7a7a80', 0, { tex: 0.4 });
      d.poly([[8, 90], [12, 24], [28, 24], [32, 90]], '#f4f0e8', { shiny: true });
      for (const y of [36, 56, 76]) d.deco.poly([[8.6 + (90 - y - 8) * 0.06, y], [31.4 - (90 - y - 8) * 0.06, y], [31 - (90 - y) * 0.06, y + 8], [9 + (90 - y) * 0.06, y + 8]], '#d83a3a');
      d.rect(10, 20, 20, 5, '#3a3a44'); d.rect(13, 8, 14, 12, '#fff4a0', { shiny: true });
      for (let x = 14; x < 27; x += 4) d.deco.line(x, 8, x, 20, 0.6, '#3a3a44');
      d.poly([[10, 9], [20, 0], [30, 9]], '#d83a3a', { shiny: true });
      d.rect(17, 76, 6, 13, '#4a3a2a');
    } },
    // ---------------------------------------------------------- Pays des Scarabées
    worldtree: { w: 128, h: 120, n: 1, big: true, lights: [[64, 96, 22, 'rgba(255,230,140,0.5)']], draw(d) {
      for (const [x, y] of [[20, 118], [44, 118], [84, 118], [108, 118]]) d.tube([[64, 90], [(64 + x) / 2, 108], [x, y]], 10, 4, '#6a4a2a', { tex: 0.4 });
      d.tube([[64, 112], [62, 70], [66, 40]], 30, 20, '#7a5632', { tex: 0.45 });
      for (let i = 0; i < 6; i++) d.deco.curve([[52 + i * 4, 110], [50 + i * 4.4, 80], [56 + i * 3, 50]], 0.8, '#4a3018');
      d.rect(58, 92, 12, 18, '#2a1a0c'); d.deco.ell(64, 92, 6, 4, '#2a1a0c'); d.deco.rect(60, 96, 8, 6, '#f0d080');
      [[64, 24, 46, 22], [32, 36, 28, 16], [96, 36, 28, 16], [44, 16, 22, 12], [84, 16, 22, 12], [64, 6, 20, 8]].forEach(([x, y, rx, ry], i) => d.ell(x, y, rx, ry, i % 2 ? '#3a7a2a' : '#4a8a34', 0, { tex: 0.35 }));
      for (let i = 0; i < 12; i++) d.deco.circ(20 + i * 8, 30 + (i % 3) * 6, 1.4, '#ffe060');
    } },
    // ---------------------------------------------------------- marais
    bogshack: { w: 56, h: 52, n: 2, lights: [[28, 30, 16]], smoke: [42, 4], draw(d, v) {
      for (const x of [8, 22, 34, 48]) d.tube([[x, 51], [x, 36]], 2.6, 2.4, '#4a3a22', { tex: 0.3 });
      d.rect(4, 34, 48, 4, '#6a5a32', { tex: 0.3 });
      d.rect(8, 18, 40, 17, v ? '#7a6a42' : '#6a5a36', { tex: 0.4 });
      d.poly([[2, 20], [28, 4], [54, 20]], v ? '#5a6a3a' : '#4a5a2e', { tex: 0.6 });
      d.rect(40, 2, 5, 10, '#5a5a5a');
      d.rect(24, 24, 8, 11, '#2a1e10'); d.deco.rect(12, 23, 7, 6, '#f0d080'); d.deco.rect(37, 23, 7, 6, '#f0d080');
      d.deco.curve([[4, 22], [6, 30]], 1, '#4a6a2a');
    } },
    // ---------------------------------------------------------- tunnel
    drill: { w: 64, h: 48, n: 1, draw(d) {
      d.rect(4, 22, 34, 20, '#c8a020', { shiny: true }); d.deco.rect(4, 22, 34, 3, '#2a2a2e');
      d.rect(8, 10, 18, 13, '#8a96a6', { shiny: true }); d.deco.rect(11, 13, 12, 7, '#7ad0f0');
      d.poly([[38, 22], [63, 32], [38, 42]], '#9aa2b0', { shiny: true });
      for (let i = 0; i < 4; i++) d.deco.line(42 + i * 5, 24 + i * 2, 42 + i * 5, 40 - i * 2, 0.8, '#5a5e68');
      for (const x of [10, 22, 34]) { d.ell(x, 43, 5, 4, '#2a2a2e'); d.deco.ell(x, 43, 2, 1.6, '#5a5a62'); }
    } },
    minecart: { w: 26, h: 22, n: 2, draw(d, v) {
      d.poly([[2, 6], [24, 6], [21, 17], [5, 17]], '#6a6e78', { shiny: true }); d.deco.rect(2, 6, 22, 2, '#3a3e48');
      if (v) for (const [x, y, c] of [[8, 5, '#9a7ae8'], [13, 4, '#5ac8e8'], [18, 5, '#9a7ae8']]) d.poly([[x - 2.4, y + 1], [x, y - 4], [x + 2.4, y + 1]], c, { shiny: true });
      else d.ell(13, 5, 9, 3, '#3a3030', 0, { tex: 0.5 });
      for (const x of [8, 18]) d.ell(x, 18, 3, 3, '#2a2a2e');
      d.deco.line(0, 21, 26, 21, 1, '#5a4a3a');
    } },
    leomonstone: { w: 64, h: 64, n: 1, lights: [[32, 26, 24, 'rgba(255,200,120,0.5)']], draw(d) {
      d.blob([[0, 63], [4, 20], [16, 4], [48, 4], [60, 20], [64, 63]], '#6a5a48', { tex: 0.4 });
      d.ell(32, 30, 18, 18, '#8a7458', { tex: 0.3 });
      for (let i = 0; i < 14; i++) { const a = i * Math.PI / 7; d.deco.curve([[32 + Math.cos(a) * 14, 30 + Math.sin(a) * 14], [32 + Math.cos(a) * 21, 30 + Math.sin(a) * 21]], 2.4, '#5a4a38'); }
      d.deco.ell(26, 26, 2.4, 1.6, '#ffd070', 0, { unlit: true }); d.deco.ell(38, 26, 2.4, 1.6, '#ffd070', 0, { unlit: true });
      d.deco.poly([[29, 32], [35, 32], [32, 36]], '#3a2a1a', { unlit: true }); d.deco.curve([[26, 40], [32, 42], [38, 40]], 0.8, '#3a2a1a');
      d.rect(14, 54, 36, 8, '#5a4a38');
    } },
  });

  // ------------------------------------------------------------ thèmes souterrains supplémentaires
  Object.assign(DW.World.THEMES, {
    // égouts de l'usine : béton, eau verdâtre, tuyaux
    sewer: { grass: ['#2e3436', '#363e40', '#40484a', '#4a5456', '#566062', '#646e70'], canopy: ['#0e1214', '#161c1e', '#20282a', '#2a3436', '#364244', '#445254'], canopyStyle: 'rock',
      dirt: ['#262a2c', '#2e3436', '#383e40', '#42484a', '#4c5254', '#585e60'], water: ['#a8d890', '#86c070', '#66a656', '#4e8c44', '#3c7236', '#2e5a2a', '#22441e'], foam: ['#d8f0b0', '#b0d888'],
      tall: ['#2a3a2a', '#4a5a3a', '#7a8a5a'], trees: [[0, 1]], objMap: { tree: 'tank', bush: 'scrap', mossrock: 'crates', fern: 'pebbles', glowshroom: 'glowshroom', hollowlog: 'scrap', stump: 'scrap' }, trees2: [[0, 1], [2, 1]],
      litter: ['#5a6a3a', '#3a3a3a'], particle: 'drip', leaves: ['#a0d0a0'], noFlowers: true, noFlies: true, sky: ['#1a2220', '#3a4a40'], marks: ['tank', 'scrap'] },
    // grotte de glace (Plage Secrète)
    icecave: { grass: ['#5a6a86', '#68789a', '#7888aa', '#8a9aba', '#9eaecc', '#b4c4dc'], canopy: ['#141c30', '#1e2a44', '#2a3a5a', '#3a4e74', '#506890', '#6c88b0'], canopyStyle: 'rock',
      dirt: ['#4a5670', '#566482', '#647294', '#7482a6', '#8492b4', '#96a4c4'], water: ['#f2fbff', '#d4f0fc', '#b4e2f6', '#94d0f0', '#74bae6', '#5aa0d8', '#4484c4'], foam: ['#ffffff', '#e4f6ff'],
      tall: ['#6a7a9a', '#9aaacc', '#e0eaff'], trees: [[0, 1]], objMap: { tree: 'icepillar', bush: 'icerock', mossrock: 'icecrystal', fern: 'icecrystal', glowshroom: 'icecrystal', hollowlog: 'icerock', stump: 'icerock' }, trees2: [[0, 1], [1, 1]],
      litter: ['#ffffff'], particle: 'snow', leaves: ['#ffffff'], sparkle: ['#ffffff', '#d0f0ff'], noFlowers: true, noFlies: true, sky: ['#1a2a4a', '#4a6a9a'], marks: ['icecrystal', 'icerock'] },
  });

  // ------------------------------------------------------------ légende (petits repères)
  const CH = DW.World.CH, add = (ch, o) => (CH[ch] = Object.assign({ t: 'grass', solid: true }, o));
  add('Ā', { obj: 'flagpole' }); add('ā', { obj: 'basalt' }); add('Ă', { obj: 'gearmill' }); add('ă', { obj: 'robotarm' });
  add('Ą', { obj: 'tirestack' }); add('ą', { obj: 'brokencar' }); add('Ć', { obj: 'tvstack' }); add('ć', { obj: 'timeclock' });
  add('Č', { obj: 'teddy' }); add('č', { obj: 'minecart' }); add('Ď', { obj: 'gargoyle' }); add('ď', { obj: 'baobab' }); add('Đ', { obj: 'telescope' });
  for (const k in CH) if (CH[k].solid) DW.SOLID.add(k);
})();
