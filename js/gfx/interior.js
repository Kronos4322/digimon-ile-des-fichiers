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
    aquarium: { w: 42, h: 36, n: 1, lights: [[21, 14, 20, 'rgba(100,190,255,0.45)']], draw(d) {
      d.rect(3, 24, 36, 11, WOOD_D, { round: 0.1, tex: 0.3 });
      d.rect(2, 2, 38, 23, '#9ad8f0', { round: 0.05, shiny: true });
      d.deco.rect(4, 4, 34, 19, '#3a9ad0', { unlit: true }); d.deco.rect(4, 19, 34, 4, '#e8d8a0', { unlit: true });
      for (const [x, h] of [[9, 9], [12, 6], [31, 8]]) d.deco.line(x, 21, x + 1, 21 - h, 1.2, '#3ec850', { unlit: true });
      for (const [x, y, c] of [[16, 10, '#ff8a3a'], [25, 14, '#ffd040'], [22, 8, '#ff5a8a']]) { d.deco.ell(x, y, 2.6, 1.6, c, 0, { unlit: true }); d.deco.poly([[x + 2, y], [x + 4, y - 1.6], [x + 4, y + 1.6]], c, { unlit: true }); }
      for (const [x, y] of [[30, 6], [31, 3.6], [8, 13]]) d.deco.circ(x, y, 0.8, '#e8f8ff', { unlit: true });
      d.deco.rect(2, 2, 38, 2, '#5a5a62');
    } },
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
    fridge: { w: 22, h: 46, n: 1, draw(d) {
      d.rect(2, 2, 18, 43, '#e8eef4', { round: 0.15, shiny: true });
      d.deco.line(2, 17, 20, 17, 0.8, '#9aa8b8'); d.deco.rect(16, 6, 1.6, 8, '#9aa8b8'); d.deco.rect(16, 20, 1.6, 12, '#9aa8b8');
      d.deco.rect(5, 22, 5, 5, '#ffd060'); d.deco.circ(7.5, 30, 2, '#ff5a7a');
    } },
    wardrobe: { w: 34, h: 50, n: 2, draw(d, v) {
      const w = [WOOD, '#e8d8c0'][v];
      d.rect(2, 3, 30, 45, w, { round: 0.06, tex: 0.25 });
      d.rect(0, 0, 34, 5, v ? '#d0bca0' : WOOD_L, { round: 0.3 });
      d.deco.line(17, 6, 17, 46, 1, WOOD_D); d.deco.circ(14, 26, 1.2, '#d8b040'); d.deco.circ(20, 26, 1.2, '#d8b040');
      d.deco.rect(5, 9, 9, 14, w); d.deco.rect(20, 9, 9, 14, w);
    } },
    // bureau avec ordinateur (terminal de Digivice)
    desk: { w: 42, h: 38, n: 1, lights: [[26, 12, 16, 'rgba(120,255,180,0.45)']], draw(d) {
      d.rect(2, 18, 38, 5, WOOD_L, { round: 0.3 }); d.rect(26, 22, 13, 15, WOOD, { tex: 0.25 }); d.deco.rect(28, 25, 9, 4, WOOD_D); d.deco.rect(28, 31, 9, 4, WOOD_D);
      d.tube([[5, 37], [5, 22]], 1.6, 1.6, WOOD_D);
      d.rect(16, 2, 20, 15, '#c8ccd4', { round: 0.15, shiny: true }); d.deco.rect(18, 4, 16, 10, '#0a2a1a'); d.deco.rect(19, 5, 14, 8, '#2ad890', { unlit: true });
      for (let y = 6; y < 12; y += 2) d.deco.line(20, y, 20 + ((y * 7) % 11), y, 0.6, '#0a3a20', { unlit: true });
      d.rect(14, 16, 18, 3, '#9aa0a8', { round: 0.3 }); d.ell(8, 16, 4, 2.4, '#e8e0d0'); d.deco.ell(8, 15.4, 2.6, 1, '#7a4a2a');
    } },
    floorlamp: { w: 16, h: 46, n: 1, lights: [[8, 8, 30]], draw(d) {
      d.ell(8, 44, 6, 2, '#5a5a62', 0, { shiny: true }); d.tube([[8, 44], [8, 12]], 1, 1, '#7a7a82');
      d.poly([[2, 14], [5, 3], [11, 3], [14, 14]], '#f4e0a8', { shiny: true }); d.deco.rect(2, 12, 12, 2, '#e8c070');
    } },
    bigplant: { w: 26, h: 46, n: 1, draw(d) {
      d.poly([[6, 34], [20, 34], [18, 45], [8, 45]], '#e8e0d0', { shiny: true }); d.deco.rect(6, 34, 14, 2, '#c8c0b0');
      d.tube([[13, 35], [12, 20]], 1.4, 1, '#6a4a2a');
      d.circ(13, 15, 10, '#3e8a40', { tex: 0.5, texSize: 1 }); d.circ(7, 20, 6, '#4aa046', { tex: 0.5 }); d.circ(19, 21, 6, '#357a36', { tex: 0.5 }); d.circ(12, 6, 6, '#56b04e', { tex: 0.5 });
    } },
    // grand tapis rectangulaire (on marche dessus)
    bigrug: { w: 82, h: 50, n: 3, draw(d, v) {
      const [a, b, c] = [['#4a6ab0', '#e8d8a0', '#c84848'], ['#a84a6a', '#f0e0c8', '#4a8a6a'], ['#d8a040', '#fff0d0', '#6a4aa8']][v];
      d.rect(2, 2, 78, 46, a, { flat: true, round: 0.08 });
      d.deco.rect(6, 6, 70, 38, b); d.deco.rect(9, 9, 64, 32, a);
      d.deco.poly([[41, 13], [62, 25], [41, 37], [20, 25]], c); d.deco.poly([[41, 18], [53, 25], [41, 32], [29, 25]], b);
      for (let x = 4; x < 80; x += 4) { d.deco.line(x, 0, x, 2, 0.7, b); d.deco.line(x, 48, x, 50, 0.7, b); }
    } },
    sidetable: { w: 18, h: 26, n: 1, draw(d) {
      d.tube([[5, 25], [5, 14]], 1.2, 1.2, WOOD_D); d.tube([[13, 25], [13, 14]], 1.2, 1.2, WOOD_D);
      d.ell(9, 13, 8, 3.6, WOOD_L, 0, { tex: 0.2 });
      d.poly([[6, 12], [12, 12], [11, 5], [7, 5]], '#7ab8e8', { shiny: true });
      for (const [x, y, c] of [[7, 3, '#ff8ac0'], [10, 2, '#ffe070'], [12, 4, '#ffffff']]) d.circ(x, y, 1.8, c);
    } },
    // affiche de Digimon (murale)
    poster: { w: 24, h: 30, n: 3, draw(d, v) {
      const [bg, fg] = [['#ffe8b0', '#e86a2a'], ['#d8ecff', '#3a7ad8'], ['#e8ffd8', '#3aa848']][v];
      d.rect(1, 1, 22, 28, bg, { round: 0.05 }); d.deco.rect(1, 1, 22, 2, '#c8b8a0');
      d.deco.circ(12, 13, 6, fg); d.deco.ell(9.6, 11, 1.6, 2, '#ffffff'); d.deco.ell(14.4, 11, 1.6, 2, '#ffffff');
      d.deco.poly([[6, 9], [8, 3], [10, 8]], fg); d.deco.poly([[18, 9], [16, 3], [14, 8]], fg);
      d.deco.rect(4, 22, 16, 2, fg); d.deco.rect(6, 25, 12, 1.4, '#8a7a6a');
    } },
    // coussin de sol
    cushion: { w: 18, h: 14, n: 3, draw(d, v) {
      const c = ['#e85a7a', '#5ab0e8', '#f0c040'][v];
      d.ell(9, 8, 8, 5, c, 0, { shiny: true }); d.deco.circ(9, 8, 1.2, '#ffffff');
    } },
  });
})();
