'use strict';
// =====================================================================
//  INTÉRIEURS — meubles (maison de Jijimon et futures maisons)
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
    bookshelf: { w: 34, h: 46, n: 2, draw(d, v) {
      d.rect(1, 2, 32, 43, WOOD, { round: 0.08, tex: 0.25 });
      d.deco.rect(3.5, 5, 27, 38, '#3a2412');
      const cols = ['#c84838', '#3a6ac8', '#4a9a48', '#d8a830', '#8a4ab0', '#e8e0d0'];
      for (let s = 0; s < 4; s++) {
        const y = 5 + s * 9.6;
        d.deco.rect(3, y + 8, 28, 1.6, WOOD_L);
        let x = 4;
        while (x < 29) { const w = 2 + Math.floor(DW.Art.hash(x, s, 300 + v) * 2.5), h = 5 + DW.Art.hash(x, s, 301 + v) * 3; d.deco.rect(x, y + 8 - h, w, h, cols[Math.floor(DW.Art.hash(x, s, 302 + v) * 6)]); x += w + (DW.Art.hash(x, s, 303) < 0.15 ? 2 : 0.4); }
      }
      d.rect(0, 0, 34, 4, WOOD_D, { round: 0.3 });
    } },
    bed: { w: 30, h: 44, n: 1, draw(d) {
      d.rect(2, 2, 26, 12, WOOD, { round: 0.3, tex: 0.25 }); d.deco.rect(4, 4, 22, 2, WOOD_L);
      d.rect(3, 10, 24, 32, WOOD_D, { round: 0.15 });
      d.rect(4, 10, 22, 30, '#f4f0e8', { round: 0.2 });
      d.ell(15, 15, 8, 4, '#ffffff');
      d.rect(4, 21, 22, 19, '#5a8ae0', { round: 0.25 });
      for (let x = 7; x < 26; x += 5) d.deco.line(x, 22, x, 39, 0.8, '#7aa8f0');
      d.deco.rect(4, 21, 22, 2.4, '#e8e0d0');
      d.rect(2, 38, 26, 5, WOOD, { round: 0.3 });
    } },
    table: { w: 40, h: 28, n: 1, draw(d) {
      d.tube([[8, 26], [8, 14]], 2.4, 2.4, WOOD_D, { far: true }); d.tube([[32, 26], [32, 14]], 2.4, 2.4, WOOD_D, { far: true });
      d.ell(20, 12, 19, 9, WOOD, 0, { tex: 0.2 });
      d.deco.ell(20, 11, 15, 6, '#f4ece0'); d.deco.ell(20, 11, 13, 5, '#fff8ee');
      d.ell(13, 9, 3.6, 1.8, '#e8e0d0'); d.deco.ell(13, 8.6, 2.4, 1, '#c84838');
      d.rect(22, 3, 5, 6, '#e8d8b0', { round: 0.3 }); d.deco.rect(23, 3.6, 3, 1.4, '#9ac850');
      d.ell(28, 10, 3, 2, '#d8c8a0'); d.deco.ell(28, 9.4, 2, 1, '#8a5a2a');
    } },
    stool: { w: 14, h: 16, n: 1, draw(d) {
      d.tube([[3, 15], [4, 8]], 1.6, 1.6, WOOD_D); d.tube([[11, 15], [10, 8]], 1.6, 1.6, WOOD_D);
      d.ell(7, 7, 6, 3.4, WOOD_L, 0, { tex: 0.2 });
    } },
    rug: { w: 66, h: 42, n: 1, draw(d) {
      d.ell(33, 21, 32, 19, '#a83838', 0, { flat: true });
      d.deco.ell(33, 21, 28, 16, '#e8c060'); d.deco.ell(33, 21, 25, 14, '#c84848');
      d.deco.ell(33, 21, 16, 9, '#e8c060'); d.deco.ell(33, 21, 13, 7, '#3a6aa8');
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; d.deco.circ(33 + Math.cos(a) * 20, 21 + Math.sin(a) * 11.4, 1.4, '#ffe8a0'); }
      d.deco.circ(33, 21, 3, '#ffe8a0');
    } },
    plant: { w: 20, h: 32, n: 2, draw(d, v) {
      d.poly([[4, 22], [16, 22], [14, 31], [6, 31]], v ? '#3a6aa8' : '#c06a3a'); d.deco.rect(4, 22, 12, 1.6, v ? '#5a8ac8' : '#e08a5a');
      if (v) { d.circ(10, 13, 8, '#3e9a40', { tex: 0.5, texSize: 1 }); d.circ(6, 9, 4, '#4aa846', { tex: 0.5 }); [[6, 8], [12, 10], [9, 15], [14, 15]].forEach(([x, y]) => d.deco.circ(x, y, 1.3, '#ff8ac0', { unlit: true })); }
      else for (const a of [-1, -0.55, -0.15, 0.2, 0.6, 1]) d.tube([[10, 22], [10 + Math.sin(a) * 6, 14], [10 + Math.sin(a) * 10, 22 - Math.cos(a) * 18]], 3.4, 0.8, a > 0 ? '#3e9a40' : '#4aa846');
    } },
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
    shelf: { w: 32, h: 18, n: 1, draw(d) {
      d.rect(1, 12, 30, 3, WOOD, { round: 0.3 }); d.deco.rect(1, 12, 30, 1, WOOD_L);
      d.tube([[5, 15], [5, 18]], 1.6, 1.6, WOOD_D); d.tube([[27, 15], [27, 18]], 1.6, 1.6, WOOD_D);
      [[5, '#5ab8f0', 6], [11, '#e8d8b0', 8], [17, '#c84838', 5], [23, '#4ac878', 7], [28, '#d8a830', 5]].forEach(([x, c, h]) => d.rect(x - 2, 12 - h, 4, h, c, { round: 0.4, shiny: true }));
    } },
    frame: { w: 24, h: 20, n: 1, draw(d) {
      d.rect(1, 1, 22, 18, '#c8a040', { round: 0.1, shiny: true });
      d.deco.rect(3.6, 3.6, 16.8, 12.8, '#8ad0f0');
      d.deco.rect(3.6, 11, 16.8, 5.4, '#5ab05a'); d.deco.poly([[5, 11], [10, 5.5], [14, 11]], '#8a8a9a'); d.deco.poly([[11, 11], [15, 7], [19, 11]], '#9a9aaa');
      d.deco.circ(17, 6, 1.6, '#fff070', { unlit: true });
    } },
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
    sacks: { w: 26, h: 22, n: 1, draw(d) {
      d.blob([[2, 21], [1, 10], [5, 5], [11, 6], [12, 21]], '#d8c090', { tex: 0.3 }); d.deco.line(4, 7, 9, 7, 0.8, '#8a6a3a');
      d.blob([[12, 21], [12, 8], [17, 3], [24, 6], [25, 21]], '#c8ac78', { tex: 0.3 }); d.deco.line(15, 5.6, 22, 5.6, 0.8, '#8a6a3a');
      d.deco.circ(18, 14, 2.4, '#b04a2a');
    } },
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
    oven: { w: 44, h: 48, n: 1, fire: [22, 36], lights: [[22, 36, 30]], smoke: [33, 2], draw(d) {
      d.rect(2, 16, 40, 31, '#b05a3a', { round: 0.1, tex: 0.3 });
      for (let y = 20; y < 47; y += 5) for (let x = 2 + ((y / 5) % 2) * 4; x < 42; x += 8) d.deco.rect(x, y, 0.7, 5, '#7a3a24');
      for (let y = 20; y < 47; y += 5) d.deco.line(2, y, 42, y, 0.7, '#7a3a24');
      d.ell(22, 18, 19, 9, '#b05a3a', 0, { tex: 0.3 });
      d.deco.ell(22, 34, 10, 9, '#2a1208'); d.deco.rect(12, 34, 20, 10, '#2a1208');
      d.deco.ell(22, 39, 7, 5, '#ff7a20', 0, { unlit: true }); d.deco.ell(22, 40, 4, 3, '#ffd060', 0, { unlit: true });
      d.rect(29, 0, 8, 12, '#8a8a92', { round: 0.3 });
    } },
    pots: { w: 40, h: 28, n: 1, draw(d) {
      d.rect(1, 14, 38, 4, WOOD_L, { round: 0.3 }); d.tube([[4, 27], [4, 17]], 2, 2, WOOD_D); d.tube([[36, 27], [36, 17]], 2, 2, WOOD_D);
      for (const [x, c] of [[8, '#ff8ac0'], [20, '#fff070'], [32, '#b48aff']]) { d.poly([[x - 4, 9], [x + 4, 9], [x + 3, 14], [x - 3, 14]], '#c06a3a'); d.circ(x, 5, 4.4, '#3e9a40', { tex: 0.4 }); d.deco.circ(x - 1.4, 3.6, 1.2, c, { unlit: true }); d.deco.circ(x + 1.6, 5.6, 1.1, c, { unlit: true }); }
    } },
  });
})();
