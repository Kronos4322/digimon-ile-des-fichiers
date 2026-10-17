'use strict';
// =====================================================================
//  MONDE — légende des cartes et objets en volume (arbres, rochers, maisons...)
// =====================================================================
(function () {
  const Art = DW.Art;
  const World = DW.World = {};

  // ------------------------------------------------------------ légende
  // t: terrain  solid: bloquant  obj: objet en volume  tall: herbes hautes (rencontres)  deco: décor peint au sol
  const TER = { grass: 0, dirt: 1, sand: 2, water: 3, bridge: 4, lawn: 5, stone: 6, cliff: 7, canopy: 8, stairs: 9, pastel: 10, cobble: 11, wood: 12, wall: 13, void: 14, metal: 15 };
  const CH = {
    '.': { t: 'grass' }, ',': { t: 'grass', tall: 'grass' }, '=': { t: 'dirt' }, 's': { t: 'sand' }, ';': { t: 'sand', tall: 'dune' },
    '~': { t: 'water', solid: true }, '_': { t: 'bridge' }, 'v': { t: 'lawn' }, ':': { t: 'lawn', tall: 'pastel' }, 'o': { t: 'stone' },
    'f': { t: 'grass', deco: 'flowers' }, 'q': { t: 'lawn', deco: 'flowers2' }, 'm': { t: 'grass', deco: 'mushrooms' },
    'C': { t: 'cliff', solid: true }, '%': { t: 'pastel', solid: true }, '^': { t: 'stairs' }, '#': { t: 'canopy', solid: true },
    'T': { t: 'grass', obj: 'tree', solid: true }, 'b': { t: 'grass', obj: 'bush', solid: true },
    'r': { t: 'grass', obj: 'rock', solid: true }, 'R': { t: 'sand', obj: 'searock', solid: true },
    'p': { t: 'sand', obj: 'palm', solid: true }, 'P': { t: 'sand', obj: 'booth', solid: true },
    'S': { t: 'grass', obj: 'sign', solid: true }, 'Z': { t: 'sand', obj: 'sign', solid: true }, 'Q': { t: 'lawn', obj: 'sign', solid: true },
    'O': { t: 'grass', obj: 'spring', solid: true }, 'L': { t: 'grass', obj: 'log', solid: true }, 'k': { t: 'grass', obj: 'stump', solid: true },
    'c': { t: 'lawn', obj: 'crib', solid: true }, 'B': { t: 'lawn', obj: 'block', solid: true }, 'h': { t: 'lawn', obj: 'candytree', solid: true },
    'Y': { t: 'grass', obj: 'bigtree', solid: true }, 'n': { t: 'grass', obj: 'fern' }, 'G': { t: 'grass', obj: 'glowshroom', solid: true },
    'M': { t: 'grass', obj: 'mossrock', solid: true }, 'w': { t: 'water', solid: true, lily: true }, 'H': { t: 'grass', obj: 'hollowlog', solid: true },
    'E': { t: 'grass', obj: 'dummy', solid: true, train: 'atk' }, 'U': { t: 'lawn', obj: 'dummy', solid: true, train: 'atk' },
    'W': { t: 'dirt', obj: 'weights', solid: true, train: 'hp' }, 'A': { t: 'dirt', obj: 'guardwall', solid: true, train: 'def' },
    'N': { t: 'dirt', obj: 'hurdle', solid: true, train: 'spd' }, 'F': { t: 'grass', obj: 'shrine', solid: true, train: 'int' },
    'y': { t: 'grass', obj: 'toilet', solid: true, toilet: true },
    'Ψ': { t: 'grass', obj: 'datacrystal', solid: true, train: 'mp' },
    'z': { t: 'cobble' }, 'j': { t: 'grass', deco: 'weeds' }, 'i': { t: 'grass', obj: 'lamp', solid: true }, 'I': { t: 'cobble', obj: 'lamp', solid: true },
    'J': { t: 'cobble', obj: 'bench', solid: true }, 'V': { t: 'grass', obj: 'flag', solid: true }, 'a': { t: 'grass', obj: 'barrel', solid: true },
    'x': { t: 'lawn', solid: true },
    // intérieurs : 0 vide (hors de la pièce)  1 parquet  2 mur
    '0': { t: 'void', solid: true }, '1': { t: 'wood' }, '2': { t: 'wall', solid: true },
    // ville : K haie  d jardinière  e puits  D caisses  l pot de fleurs  t étal
    'K': { t: 'grass', obj: 'hedge', solid: true }, 'd': { t: 'grass', obj: 'flowerbed', solid: true }, 'e': { t: 'grass', obj: 'well', solid: true },
    // quartiers : 5 rondins / pierres de gué sur l'eau (on marche dessus)  7 botte de foin
    // repères de zones : < monolithe de données  > lanterne de pierre  { fleur géante  } champignon géant  | arbre mort
    '<': { t: 'grass', obj: 'monolith', solid: true }, '>': { t: 'grass', obj: 'stonelantern', solid: true }, '{': { t: 'grass', obj: 'giantflower', solid: true },
    '}': { t: 'grass', obj: 'giantshroom', solid: true }, '|': { t: 'grass', obj: 'deadtree', solid: true },
    // décor numérique : $ tuyau qui sort du sol  ! antenne de données  ? panneau de circuit
    '$': { t: 'grass', obj: 'pipe', solid: true }, '!': { t: 'grass', obj: 'antenna', solid: true }, '?': { t: 'grass', obj: 'datapanel', solid: true },
    '5': { t: 'water', obj: 'steplog', under: true },
    // plage : 3 coquillages et étoiles de mer  6 bois flotté  8 rocher à cuvette  9 château de sable
    '3': { t: 'sand', deco: 'shells' }, '6': { t: 'sand', obj: 'driftwood', solid: true }, '8': { t: 'sand', obj: 'tidepool', solid: true },
    '9': { t: 'sand', obj: 'sandcastle', solid: true }, '7': { t: 'grass', obj: 'haybale', solid: true },
    'D': { t: 'grass', obj: 'crates', solid: true }, 'l': { t: 'cobble', obj: 'planter', solid: true }, 't': { t: 'cobble', obj: 'stall', solid: true }, 'g': { t: 'grass', solid: true }, 'u': { t: 'sand', solid: true }, 'X': { t: 'stone', obj: 'rubble', solid: true },
  };
  World.CH = CH;
  World.info = ch => CH[ch] || CH['.'];
  World.isTall = ch => !!(CH[ch] && CH[ch].tall);
  DW.SOLID = new Set(Object.keys(CH).filter(k => CH[k].solid));

  // arbre en hiver : branches nues (couleur du tronc), avec la neige posée dessus si snow
  const bare = (d, tr, snow) => {
    const L = [[[18, 27], [11, 17], [6, 10]], [[18, 27], [25, 16], [31, 9]], [[18, 26], [18.5, 13], [17, 4]], [[17, 31], [9, 25], [3, 22]], [[19, 31], [27, 25], [33, 22]]];
    for (const p of L) d.tube(p, 2.8, 1, tr, { tex: 0.3 });
    const TW = [[11, 17, 7, 9], [11, 17, 13, 10], [25, 16, 22, 9], [25, 16, 31, 15], [18, 13, 14, 6], [18, 13, 22, 5], [9, 25, 5, 19], [27, 25, 31, 19], [6, 10, 4, 6], [31, 9, 33, 5], [17, 4, 15, 1], [17, 4, 20, 1]];
    for (const [a, b, c, e] of TW) d.deco.line(a, b, c, e, 0.7, tr);
    if (snow) {
      for (const p of L) for (let i = 0; i < p.length - 1; i++) d.deco.line(p[i][0], p[i][1] - 1, p[i + 1][0], p[i + 1][1] - 1, 0.9, '#f4f8ff');
      for (const [a, b, c, e] of TW.slice(0, 8)) d.deco.line(a, b - 0.6, c, e - 0.6, 0.5, '#ffffff');
    }
  };

  // ------------------------------------------------------------ objets en volume
  const OBJ = {
    tree: { w: 36, h: 46, n: 10, draw(d, v) {
      if (v === 3) return OBJ.oak.draw(d);
      if (v === 4) return OBJ.birch.draw(d);
      // SAISONS (gfx/meteo.js) : 12 cerisier en fleurs (rose), 13 fleurs blanches, 14 nu (hiver), 15 nu et enneigé
      // [feuillage, ombre, lumière] : 0-2 verts, 5 orange, 6 rouge, 7 doré, 8 vert profond, 9 moussu
      const P = { 0: ['#45a03e', '#2f7a34', '#6cc458'], 1: ['#3c9444', '#2c7040', '#62bc62'], 2: ['#52a83a', '#3a8030', '#7ac850'],
        5: ['#e07a2a', '#b0521c', '#f4a84a'], 6: ['#cc4a30', '#962a1e', '#ee7a52'], 7: ['#e2b232', '#b4861c', '#f6d868'],
        8: ['#2a6e3a', '#1a4c2a', '#3e8c4a'], 9: ['#3a9474', '#26705a', '#64ba96'], 10: ['#2e6a48', '#1e4c36', '#4a8a62'], 11: ['#9ab8c0', '#6e8e9a', '#cfe2e8'],
        12: ['#f0a0c4', '#c87094', '#ffd4e6'], 13: ['#f2ecf0', '#c4b8c8', '#ffffff'] }[v] || ['#45a03e', '#2f7a34', '#6cc458'];
      const tr = v === 8 ? '#5a3a22' : v === 9 ? '#6a5a3a' : '#7a5230', lf = P[0], ld = P[1], lt = P[2];
      d.ell(18, 44, 9, 2.4, '#5a3a20', 0, { flat: true });
      d.tube([[11, 45], [15, 41]], 3, 2, tr, { far: true }); d.tube([[25, 45], [21, 41]], 3, 2, tr);
      d.tube([[18, 45], [18.5, 30], [18, 24]], 8.5, 6, tr, { tex: 0.35 });
      d.deco.line(16, 42, 16.5, 32, 0.8, '#5a3a1e'); d.deco.line(20.5, 44, 20, 35, 0.8, '#5a3a1e');
      d.deco.ell(17, 38, 1.6, 2.2, '#3a2412');
      if (v === 14 || v === 15) return bare(d, tr, v === 15);
      d.circ(8, 21, 8, ld, { tex: 0.55, texSize: 1, far: true }); d.circ(28, 20, 8.5, ld, { tex: 0.55, texSize: 1, far: true });
      d.circ(18, 12, 10.5, lf, { tex: 0.55, texSize: 1 });
      d.circ(8, 26, 7.5, lf, { tex: 0.55, texSize: 1 }); d.circ(28, 26, 7.5, lf, { tex: 0.55, texSize: 1 });
      d.circ(18, 27, 9, lf, { tex: 0.55, texSize: 1 });
      d.circ(13, 9, 5.5, lt, { tex: 0.45, texSize: 1 });
      if (v === 9) { d.deco.ell(17, 36, 2.6, 5, '#5aa040'); d.deco.ell(20, 41, 2, 3, '#4a9036'); d.deco.circ(10, 22, 1, '#d8f0a0', { unlit: true }); }
      // 10-11 (hiver) : neige posée sur les cimes
      if (v >= 10) for (const [x, y, rx] of [[18, 4, 8], [8, 15, 5.5], [28, 14, 5.5], [8, 21, 4.5], [28, 21, 4.5], [18, 19, 6]]) { d.ell(x, y, rx, rx * 0.42, '#f4f8ff', 0, { shiny: true }); d.deco.ell(x - rx * 0.3, y - 0.4, rx * 0.4, rx * 0.14, '#ffffff', 0, { unlit: true }); }
      if (v >= 5 && v <= 7) { d.deco.circ(9, 30, 1.2, lt, { unlit: true }); d.deco.circ(27, 14, 1, lt, { unlit: true }); }
      // fleurs : quelques jeunes feuilles vertes et des pétales plus clairs
      if (v === 12 || v === 13) { for (const [x, y] of [[10, 28], [26, 24], [20, 17], [12, 18], [24, 30], [16, 6]]) d.deco.circ(x, y, 1.1, '#7ac850', { unlit: true }); for (const [x, y] of [[6, 22], [30, 20], [18, 25], [22, 9], [9, 13]]) d.deco.circ(x, y, 0.9, v === 12 ? '#fff0f6' : '#fff8d0', { unlit: true }); }
    } },
    // (saisons, gfx/meteo.js : v 1 automne, 2 nu, 3 nu et enneigé — n reste 1 : jamais tirées au hasard)
    oak: { w: 36, h: 46, n: 1, draw(d, v) {
      const tr = '#5e3e24', [lf, ld, lt] = v === 1 ? ['#c8682a', '#94461c', '#e8984a'] : ['#2f8040', '#205e30', '#4a9c4a'];
      d.ell(18, 44, 10, 2.4, '#3a2614', 0, { flat: true });
      d.tube([[9, 45], [14, 40]], 3.4, 2, tr, { far: true }); d.tube([[27, 45], [22, 40]], 3.4, 2, tr);
      d.tube([[18, 45], [18, 32], [17, 26]], 10, 7, tr, { tex: 0.4 });
      d.deco.ell(19, 36, 2, 3, '#2a1a0c');
      if (v >= 2) return bare(d, tr, v === 3);
      d.circ(7, 24, 8, ld, { tex: 0.6, texSize: 1, far: true }); d.circ(29, 23, 8, ld, { tex: 0.6, texSize: 1, far: true });
      d.circ(18, 14, 12, lf, { tex: 0.6, texSize: 1 }); d.circ(9, 26, 7.5, lf, { tex: 0.6, texSize: 1 }); d.circ(27, 27, 7.5, lf, { tex: 0.6, texSize: 1 });
      d.circ(18, 28, 8, lf, { tex: 0.6, texSize: 1 });
      d.circ(14, 9, 5, lt, { tex: 0.5, texSize: 1 });
    } },
    birch: { w: 36, h: 46, n: 1, draw(d, v) {
      const tr = '#ecebe2', [lf, ld, lt] = v === 1 ? ['#e8c83a', '#b89a22', '#f8e070'] : ['#8cc850', '#5ea43c', '#b8e070'];
      d.ell(18, 44, 7, 2, '#5a4a30', 0, { flat: true });
      d.tube([[18, 45], [17.5, 28], [18, 20]], 6, 4.4, tr);
      for (const y of [41, 36, 31, 27]) d.deco.line(16 + (y % 3), y, 18.5 + (y % 2), y - 0.4, 0.9, '#3a3a3a');
      if (v >= 2) return bare(d, '#d8d4c8', v === 3);
      d.circ(10, 20, 7, ld, { tex: 0.5, texSize: 1, far: true }); d.circ(26, 18, 7, ld, { tex: 0.5, texSize: 1, far: true });
      d.circ(18, 12, 9.5, lf, { tex: 0.5, texSize: 1 }); d.circ(11, 25, 6, lf, { tex: 0.5, texSize: 1 }); d.circ(25, 24, 6.5, lf, { tex: 0.5, texSize: 1 });
      d.circ(14, 8, 4.5, lt, { tex: 0.4, texSize: 1 });
    } },
    bigtree: { w: 80, h: 98, n: 2, draw(d, v) {
      const tr = v ? '#6a4a2c' : '#7a5634', lf = v ? '#2c8a46' : '#3e9a3c', ld = v ? '#1e6636' : '#2a7430', lt = v ? '#56b062' : '#6cc458';
      d.ell(40, 95, 26, 4, '#3a2412', 0, { flat: true });
      d.tube([[14, 96], [24, 86], [30, 78]], 6, 3, tr, { tex: 0.35, far: true });
      d.tube([[66, 96], [56, 86], [50, 78]], 6, 3, tr, { tex: 0.35 });
      d.tube([[34, 97], [36, 88]], 5, 3, tr, { tex: 0.35 });
      d.tube([[40, 96], [40, 70], [38, 52], [40, 42]], 24, 16, tr, { tex: 0.45 });
      d.deco.ell(41, 76, 5, 7, '#2a160a'); d.deco.ell(41, 76, 3, 5, '#160a04');
      d.deco.curve([[33, 92], [32, 70], [34, 50]], 1, '#4a2e18'); d.deco.curve([[47, 92], [48, 72], [46, 52]], 1, '#4a2e18');
      d.deco.ell(31, 62, 4, 6, '#5aa040'); d.deco.ell(48, 84, 3, 4, '#5aa040');
      d.tube([[38, 50], [22, 40]], 7, 4, tr, { far: true }); d.tube([[42, 48], [60, 38]], 7, 4, tr, { far: true });
      d.circ(14, 40, 14, ld, { tex: 0.6, texSize: 1, far: true }); d.circ(66, 38, 14, ld, { tex: 0.6, texSize: 1, far: true });
      d.circ(40, 22, 20, lf, { tex: 0.6, texSize: 1 });
      d.circ(18, 32, 14, lf, { tex: 0.6, texSize: 1 }); d.circ(62, 30, 14, lf, { tex: 0.6, texSize: 1 });
      d.circ(28, 46, 12, lf, { tex: 0.6, texSize: 1 }); d.circ(54, 46, 12, lf, { tex: 0.6, texSize: 1 });
      d.circ(32, 14, 10, lt, { tex: 0.5, texSize: 1 }); d.circ(16, 26, 6, lt, { tex: 0.5, texSize: 1 });
    } },
    fern: { w: 22, h: 16, n: 2, draw(d, v) {
      const g = v ? '#3e9a40' : '#4aa83c', gd = v ? '#2a7a34' : '#36882e';
      [[-9, -3], [-6, -8], [0, -10], [6, -8], [9, -3]].forEach(([fx, fy], i) => {
        d.tube([[11, 15], [11 + fx * 0.5, 15 + fy * 0.7], [11 + fx, 15 + fy]], 3.2, 1, i % 2 ? gd : g, { far: i % 2 === 1 });
      });
      d.tube([[11, 15], [5, 12], [1, 13]], 3, 1, g); d.tube([[11, 15], [17, 12], [21, 13]], 3, 1, g);
    } },
    glowshroom: { w: 24, h: 28, n: 2, draw(d, v) {
      const cap = v ? '#5ae0f0' : '#b07aff', capd = v ? '#2ab0d0' : '#8048d8';
      d.tube([[15, 27], [16, 18]], 3, 2.4, '#e8f0f0', { far: true }); d.ell(17, 17, 5, 2.6, capd, 0, { far: true }); d.ell(17, 15.5, 5, 3, cap, 0, { far: true });
      d.tube([[9, 27], [10, 14]], 5, 4, '#f0f4ec');
      d.deco.line(9, 25, 10, 17, 0.7, '#c8d4c8');
      d.ell(10, 13, 9, 3.2, capd);
      d.ell(10, 10.5, 9, 6, cap, 0, { unlit: false });
      d.deco.circ(7, 9, 1.4, '#ffffff', { unlit: true }); d.deco.circ(13, 8, 1.1, '#ffffff', { unlit: true }); d.deco.circ(11, 12, 0.9, '#ffffff', { unlit: true });
      d.ell(20, 26, 2.4, 1.6, cap); d.ell(4, 26.4, 2, 1.4, cap);
    } },
    mossrock: { w: 24, h: 20, n: 2, draw(d, v) {
      d.blob([[2, 18], [3, 9], [9, 4], [16, 4], [22, 9], [22, 18]], v ? '#8e8e98' : '#9a968c', { tex: 0.35, texSize: 1 });
      d.ell(16, 13, 4, 3, v ? '#7e7e88' : '#8a867c', 0, { tex: 0.3 });
      d.deco.ell(10, 6, 6, 2.6, '#5aa040'); d.deco.ell(17, 7, 4, 2, '#4a9036'); d.deco.ell(5, 12, 2, 3, '#5aa040');
      d.deco.circ(9, 5, 0.8, '#9ad870', { unlit: true });
    } },
    hollowlog: { w: 36, h: 18, n: 1, draw(d) {
      d.tube([[4, 11], [31, 11]], 12, 12, '#7a5030', { tex: 0.3 });
      d.deco.line(9, 7, 26, 7, 0.7, '#5a3a1e'); d.deco.line(10, 14, 27, 14, 0.7, '#5a3a1e');
      d.ell(31.5, 11, 3.4, 6, '#c8986a'); d.deco.ell(31.5, 11, 2.2, 4.2, '#2a1a0c');
      d.deco.ell(14, 6.5, 6, 2, '#5aa040'); d.deco.ell(23, 6, 4, 1.6, '#4a9036');
      d.ell(8, 4, 2, 1.4, '#e04848'); d.deco.circ(8, 3.4, 0.5, '#ffffff', { unlit: true });
    } },
    dummy: { w: 20, h: 30, n: 1, draw(d) {
      d.ell(10, 28, 8, 2, '#4a3018', 0, { flat: true });
      d.tube([[10, 29], [10, 8]], 3, 2.6, '#8a5a32', { tex: 0.3 });
      d.tube([[3, 12], [17, 12]], 2, 2, '#8a5a32');
      d.blob([[5, 13], [15, 13], [16, 24], [10, 27], [4, 24]], '#e2c46a', { tex: 0.35, texSize: 1 });
      d.deco.line(4.6, 17, 15.6, 17, 1, '#a07a3a'); d.deco.line(4.6, 22, 15.6, 22, 1, '#a07a3a');
      d.deco.circ(10, 19.5, 2.6, '#ffffff'); d.deco.circ(10, 19.5, 1.6, '#e04040'); d.deco.circ(10, 19.5, 0.6, '#ffffff', { unlit: true });
      d.circ(10, 6, 4, '#e2c46a', { tex: 0.35, texSize: 1 });
    } },
    // ---------------- Ville des Fichiers
    jhouse: { w: 80, h: 78, n: 1, draw(d) {
      const Lg = '#a0703c', Ld = '#7a5028', St = '#d8b45a';
      d.rect(8, 40, 64, 36, Lg, { round: 0.15, tex: 0.2 });
      for (let y = 44; y < 76; y += 5) d.deco.line(8, y, 72, y, 0.8, Ld);
      d.deco.ell(40, 66, 8, 10, '#3a2412'); d.deco.rect(32, 66, 16, 10, '#3a2412');
      d.deco.circ(45, 68, 0.9, '#f0c040', { unlit: true });
      d.deco.rect(15, 50, 10, 8, '#3a2412'); d.deco.rect(16, 51, 8, 6, '#8ad0f0'); d.deco.line(20, 51, 20, 57, 0.6, '#3a2412');
      d.deco.rect(55, 50, 10, 8, '#3a2412'); d.deco.rect(56, 51, 8, 6, '#ffd88a'); d.deco.line(60, 51, 60, 57, 0.6, '#3a2412');
      d.rect(58, 6, 9, 22, '#8a8a90', { round: 0.3, tex: 0.3 });
      d.blob([[0, 46], [6, 30], [20, 14], [40, 6], [60, 14], [74, 30], [80, 46], [40, 44]], St, { tex: 0.45, texSize: 1 });
      d.deco.curve([[6, 40], [40, 36], [74, 40]], 1, '#a88a3a'); d.deco.curve([[14, 28], [40, 22], [66, 28]], 1, '#a88a3a');
      d.deco.circ(40, 26, 4, '#f8f0d0'); d.deco.circ(40, 26, 2.4, '#e05a3a');
      d.rect(34, 34, 12, 4, '#7a5028', { round: 0.4 });
    } },
    bazar: { w: 58, h: 62, n: 1, draw(d) {
      d.rect(5, 26, 48, 34, '#c09060', { round: 0.15, tex: 0.25 });
      for (let x = 9; x < 53; x += 6) d.deco.line(x, 26, x, 60, 0.7, '#8a6038');
      d.deco.rect(12, 42, 34, 18, '#3a2412');
      d.rect(8, 44, 42, 8, '#9a6a3c', { round: 0.3 });
      d.ell(16, 42, 4, 2.4, '#b04a2a'); d.ell(26, 42, 4, 2.4, '#b04a2a'); d.ell(36, 42.4, 3, 3, '#5ab8f0', 0, { shiny: true }); d.ell(44, 42, 3, 2.6, '#4ac878', 0, { shiny: true });
      d.poly([[0, 32], [4, 22], [54, 22], [58, 32]], '#e04848', { shiny: true });
      for (let x = 6; x < 54; x += 9) d.deco.poly([[x, 22], [x + 4.5, 22], [x + 5.5, 32], [x - 0.5, 32]], '#ffffff');
      d.blob([[2, 24], [10, 6], [29, 1], [48, 6], [56, 24]], '#8a5a3a', { tex: 0.3 });
      d.deco.rect(20, 10, 18, 7, '#f0d890'); d.deco.circ(25, 13.5, 2, '#b04a2a'); d.deco.circ(33, 13.5, 2, '#3a8ae8');
    } },
    dojo: { w: 62, h: 62, n: 1, draw(d) {
      d.rect(6, 28, 50, 32, '#d8c8a0', { round: 0.1 });
      for (let x = 6; x <= 56; x += 10) d.deco.rect(x, 28, 2.4, 32, '#5a3a22');
      d.deco.rect(24, 40, 14, 20, '#3a2412');
      d.blob([[0, 32], [6, 22], [31, 12], [56, 22], [62, 32], [31, 28]], '#4a4a78', { shiny: true });
      d.blob([[8, 20], [14, 10], [31, 3], [48, 10], [54, 20], [31, 16]], '#5a5a8a', { shiny: true });
      d.deco.line(10, 26, 52, 26, 0.8, '#2a2a4a');
      d.rect(26, 30, 10, 8, '#e04040', { round: 0.3 });
      d.deco.circ(31, 34, 2.2, '#ffffff', { unlit: true });
    } },
    restaurant: { w: 58, h: 64, n: 1, draw(d) {
      d.rect(10, 32, 38, 30, '#f2e6c8', { round: 0.3 });
      d.deco.ell(29, 54, 6, 8, '#6a3a1a'); d.deco.rect(23, 54, 12, 8, '#6a3a1a');
      d.deco.ell(17, 44, 4, 4, '#ffd88a'); d.deco.ell(41, 44, 4, 4, '#ffd88a');
      d.ell(29, 24, 29, 18, '#8e4cba', 0, { shiny: true });
      d.ell(29, 34, 24, 4, '#6a3092');
      d.deco.circ(16, 18, 4, '#e8d0fa'); d.deco.circ(30, 12, 4.6, '#e8d0fa'); d.deco.circ(44, 20, 3.6, '#e8d0fa'); d.deco.circ(22, 28, 2.4, '#e8d0fa');
      d.deco.rect(20, 36, 18, 5, '#c07830'); d.deco.ell(29, 38.5, 3, 1.6, '#f8f0e0');
    } },
    garden: { w: 58, h: 58, n: 1, draw(d) {
      d.rect(8, 28, 42, 28, '#f6ead8', { round: 0.2 });
      d.deco.ell(29, 48, 6, 8, '#9a5a3a'); d.deco.rect(23, 48, 12, 8, '#9a5a3a');
      d.deco.circ(16, 40, 4, '#a8dcff'); d.deco.circ(42, 40, 4, '#a8dcff');
      d.blob([[2, 32], [8, 16], [29, 4], [50, 16], [56, 32], [29, 30]], '#5ab05a', { tex: 0.4, texSize: 1 });
      [[12, 22], [22, 14], [34, 12], [44, 22], [28, 24], [18, 28], [40, 28]].forEach(([x, y], i) => d.deco.circ(x, y, 2, ['#ff8ac0', '#fff070', '#ffffff', '#b48aff'][i % 4], { unlit: true }));
    } },
    lamp: { w: 12, h: 32, n: 1, draw(d) {
      d.ell(6, 31, 4, 1.4, '#2a2a2a', 0, { flat: true });
      d.tube([[6, 31], [6, 9]], 2.4, 2, '#3a3040');
      d.rect(2, 2, 8, 9, '#3a3040', { round: 0.3 });
      d.deco.rect(3.4, 3.6, 5.2, 6, '#ffe08a', { unlit: true });
      d.deco.rect(4.4, 4.6, 1.4, 2.4, '#ffffff', { unlit: true });
    } },
    // distributeur (Digimon World 1) : 0 PV (vert), 1 PM (bleu), 2 nourriture (orange) ; grand, coloré, éclairé la nuit
    vending: { w: 26, h: 44, n: 3, lights: [[13, 16, 22]], draw(d, v) {
      const body = ['#2ec060', '#2a74e8', '#f07a1a'][v], dark = ['#147a38', '#163e96', '#9a4410'][v], item = ['#ff4a5a', '#7ad0ff', '#c8643c'][v];
      d.ell(13, 43, 12, 2, '#1a1a1a', 0, { flat: true });
      d.rect(1, 6, 24, 37, body, { round: 0.12, tex: 0.12 });
      // enseigne lumineuse
      d.rect(0, 0, 26, 8, dark, { round: 0.25 });
      d.deco.rect(2, 1.6, 22, 4.8, '#fff6c0', { unlit: true });
      d.deco.rect(4, 2.6, 18, 2.8, item, { unlit: true });
      // vitrine éclairée avec ses produits
      d.deco.rect(3, 9, 14, 20, '#dff6ff', { unlit: true });
      for (let r = 0; r < 4; r++) { d.deco.rect(3, 13.6 + r * 5, 14, 0.8, '#9ab8c8'); for (let k = 0; k < 3; k++) d.deco.rect(4 + k * 4.4, 10.4 + r * 5, 3.2, 3, item, { unlit: true }); }
      // monnayeur et boutons
      d.deco.rect(19, 10, 4, 3, '#ffe070', { unlit: true }); d.deco.rect(19.6, 14, 2.8, 1.4, '#1a1a1a');
      for (let r = 0; r < 3; r++) d.deco.circ(21, 18 + r * 3.4, 1.1, ['#ff5050', '#50d050', '#ffffff'][r], { unlit: true });
      // trappe de sortie
      d.deco.rect(4, 32, 18, 6, '#141414'); d.deco.rect(4, 32, 18, 1.4, '#3a3a3a');
      d.deco.rect(1, 6, 2, 37, 'rgba(255,255,255,0.25)');
    } },
    weights: { w: 26, h: 22, n: 1, draw(d) {
      d.ell(13, 20, 11, 2.4, '#4a3a2a', 0, { flat: true });
      d.tube([[5, 13], [21, 13]], 2.4, 2.4, '#8a5a32');
      d.blob([[0, 19], [1, 8], [6, 5], [10, 9], [10, 19]], '#9a948a', { tex: 0.35, texSize: 1 });
      d.blob([[16, 19], [16, 9], [20, 5], [25, 8], [26, 19]], '#8a847a', { tex: 0.35, texSize: 1 });
    } },
    guardwall: { w: 22, h: 26, n: 1, draw(d) {
      d.rect(2, 4, 18, 21, '#8a8478', { round: 0.2, tex: 0.3 });
      for (let y = 9; y < 25; y += 5) d.deco.line(2, y, 20, y, 0.8, '#5e5a52');
      d.deco.circ(11, 13, 4.2, '#e04040'); d.deco.circ(11, 13, 2.6, '#ffffff'); d.deco.circ(11, 13, 1.2, '#e04040');
      d.deco.line(5, 19, 8, 22, 0.8, '#4a463e');
    } },
    hurdle: { w: 22, h: 16, n: 1, draw(d) {
      d.tube([[4, 15], [4, 5]], 2, 2, '#f0f0f0'); d.tube([[18, 15], [18, 5]], 2, 2, '#f0f0f0');
      d.rect(2, 4, 18, 4, '#e04848', { round: 0.4 });
      d.deco.rect(6, 4.6, 3, 2.8, '#ffffff'); d.deco.rect(13, 4.6, 3, 2.8, '#ffffff');
    } },
    // cristal de données (poste PM) : un grand cristal bleu qui flotte au-dessus d'un socle de pierre
    datacrystal: { w: 30, h: 44, n: 1, lights: [[15, 16, 16]], draw(d) {
      d.ell(15, 42, 12, 2.2, '#2a2a2a', 0, { flat: true });
      d.rect(5, 34, 20, 8, '#9a968e', { round: 0.3, tex: 0.3 }); d.deco.rect(5, 34, 20, 2, '#bab6ae');
      for (let i = 0; i < 3; i++) d.deco.circ(9 + i * 6, 38, 1.2, '#4ad0e8', { unlit: true });
      d.poly([[15, 2], [24, 14], [15, 30], [6, 14]], '#3a9ae0', { shiny: true });
      d.poly([[15, 2], [24, 14], [15, 16]], '#6ac8f8'); d.poly([[15, 2], [15, 16], [6, 14]], '#4ab0f0');
      d.deco.line(15, 4, 15, 28, 0.6, '#c8f4ff', { unlit: true });
      d.deco.circ(12, 10, 1.4, '#ffffff', { unlit: true });
      for (const [x, y] of [[4, 6], [26, 9], [24, 26], [5, 24]]) d.deco.circ(x, y, 0.9, '#8ae8ff', { unlit: true });
    } },
    shrine: { w: 28, h: 26, n: 1, draw(d) {
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; d.circ(14 + Math.cos(a) * 10, 18 + Math.sin(a) * 5, 2.6, '#a8a49c', { tex: 0.3 }); }
      d.rect(11, 6, 6, 14, '#b8b4ac', { round: 0.5, tex: 0.25 });
      d.deco.circ(14, 10, 2, '#5ad8f0', { unlit: true });
      d.poly([[9, 6], [14, 1], [19, 6]], '#8a847a');
    } },
    toiletroom: { w: 34, h: 40, n: 1, lights: [[17, 12, 14]], draw(d) {
      d.ell(17, 38, 15, 2.4, '#3a2a1a', 0, { flat: true });
      // dalle et mur du fond
      d.rect(2, 30, 30, 8, '#a8a296', { round: 0.15, tex: 0.3 });
      d.rect(4, 12, 26, 20, '#d8d0c0', { round: 0.05, tex: 0.12 });
      for (let x = 6; x < 30; x += 5) d.deco.line(x, 13, x, 31, 0.5, '#bab2a2');
      // cuvette blanche et réservoir
      d.rect(12, 16, 10, 6, '#f4f6f8', { round: 0.3, shiny: true });
      d.ell(17, 29, 6, 4, '#f4f6f8', 0, { shiny: true }); d.deco.ell(17, 28.4, 3.6, 2, '#c8d8e0');
      d.rect(13, 22, 8, 6, '#eef0f2', { round: 0.3 });
      // lavabo, rouleau
      d.rect(25, 20, 5, 3, '#e8f0f4', { round: 0.4, shiny: true }); d.tube([[27.5, 30], [27.5, 23]], 1, 1, '#9aa0a8');
      d.circ(7, 22, 2, '#f4f0e8');
      // piliers rouges et toit de tôle
      d.rect(2, 10, 3, 28, '#c84a3a', { round: 0.3 }); d.rect(29, 10, 3, 28, '#c84a3a', { round: 0.3 });
      d.rect(0, 5, 34, 7, '#7a5a4a', { round: 0.1, tex: 0.2 });
      for (let x = 3; x < 33; x += 4) d.deco.line(x, 5, x, 12, 0.7, '#5a3e30');
      d.deco.rect(0, 10, 34, 2, '#c84a3a');
      d.deco.rect(13, 6, 8, 4, '#3a68a8'); DW.World.signText && DW.World.signText(d, 'WC', 14, 7, '#ffffff', 0.6);
    } },
    // toilettes publiques : jolie cabane de bois (toit de tuiles, porte au cœur, jardinière, enseigne WC, lanterne)
    toilet: { w: 36, h: 46, n: 1, lights: [[30, 18, 12]], draw(d) {
      d.ell(18, 45, 16, 2.4, '#2a2a1a', 0, { flat: true });
      // marche de pierre
      d.rect(9, 40, 18, 5, '#b0a898', { round: 0.3, tex: 0.3 });
      // cabane : planches verticales crème et bleu ciel
      d.rect(4, 16, 28, 26, '#f0e4c8', { round: 0.06, tex: 0.12 });
      for (let x = 7; x < 32; x += 4) d.deco.line(x, 17, x, 41, 0.6, '#d4c4a0');
      d.deco.rect(4, 38, 28, 4, '#8ac0d8');
      // porte bleue avec un cœur découpé
      d.rect(12, 21, 12, 20, '#4a8ac8', { round: 0.12 });
      d.deco.rect(13.5, 22.5, 9, 17, '#5a9ad8');
      d.deco.circ(16.4, 26, 1.8, '#1a2a40'); d.deco.circ(19.6, 26, 1.8, '#1a2a40'); d.deco.poly([[14.6, 26.6], [18, 30.4], [21.4, 26.6]], '#1a2a40');
      d.deco.circ(22, 32, 0.9, '#ffe070', { unlit: true });
      // jardinière fleurie sous la fenêtre
      d.rect(5, 30, 6, 3, '#9a5a32', { round: 0.2 });
      for (const [x, c] of [[6, '#ff6a8a'], [8, '#ffe070'], [10, '#ff9ad0']]) d.deco.circ(x, 29, 1.2, c, { unlit: true });
      d.rect(5.5, 22, 5, 5, '#a8e0ff', { round: 0.2, shiny: true }); d.deco.line(8, 22, 8, 27, 0.6, '#ffffff');
      // toit de tuiles rouges
      d.poly([[0, 18], [18, 4], [36, 18], [33, 19], [3, 19]], '#c84a3a', { tex: 0.25 });
      for (let k = 0; k < 4; k++) d.deco.line(3 + k * 2, 17 - k * 3, 33 - k * 2, 17 - k * 3, 0.6, '#9a3428');
      d.deco.circ(18, 5, 1.6, '#ffe070');
      // enseigne WC
      d.rect(13, 10, 10, 6, '#ffffff', { round: 0.3 }); d.deco.rect(14, 11, 8, 4, '#3a68a8');
      DW.World.signText && DW.World.signText(d, 'WC', 14.6, 11.6, '#ffffff', 0.55);
      // lanterne
      d.tube([[30, 20], [30, 16]], 0.6, 0.6, '#3a3040'); d.rect(28.4, 17, 3.2, 4, '#ffe08a', { round: 0.3 });
    } },
    bench: { w: 22, h: 14, n: 1, draw(d) {
      d.rect(2, 3, 18, 4, '#a0703c', { round: 0.3 });
      d.rect(2, 8, 18, 3, '#b8844c', { round: 0.3 });
      d.rect(3, 10, 2, 4, '#5a3a22'); d.rect(17, 10, 2, 4, '#5a3a22');
    } },
    flag: { w: 16, h: 34, n: 2, draw(d, v) {
      d.tube([[4, 33], [4, 2]], 1.8, 1.6, '#c8c0b0', { shiny: true });
      d.poly([[5, 3], [15, 6], [5, 12]], v ? '#3a8ae8' : '#f8a830', { shiny: true });
      d.deco.circ(8, 7, 1.4, '#ffffff', { unlit: true });
    } },
    barrel: { w: 16, h: 18, n: 2, draw(d, v) {
      if (v) { d.rect(2, 4, 12, 13, '#b8844c', { round: 0.2, tex: 0.3 }); d.deco.line(2, 8, 14, 12, 0.8, '#7a5028'); d.deco.line(2, 12, 14, 8, 0.8, '#7a5028'); return; }
      d.ell(8, 10, 6, 7.4, '#9a6a3c', 0, { tex: 0.25 });
      d.deco.line(2.4, 6, 13.6, 6, 0.9, '#5a5a62'); d.deco.line(2.4, 14, 13.6, 14, 0.9, '#5a5a62');
      d.ell(8, 4, 5, 1.8, '#c08a52');
    } },
    bush: { w: 22, h: 18, n: 2, draw(d, v) {
      const g = v ? '#4aa246' : '#3f9a48';
      d.circ(6, 11, 5.5, g, { tex: 0.5, texSize: 1, far: true }); d.circ(16, 11, 5.5, g, { tex: 0.5, texSize: 1, far: true });
      d.circ(11, 8, 6.5, g, { tex: 0.5, texSize: 1 }); d.circ(7, 13, 4.5, g, { tex: 0.5, texSize: 1 }); d.circ(15, 13, 4.5, g, { tex: 0.5, texSize: 1 });
      if (v) { d.deco.circ(8, 7, 1, '#ff5a6a', { unlit: true }); d.deco.circ(14, 10, 1, '#ff5a6a', { unlit: true }); d.deco.circ(11, 13, 1, '#ff5a6a', { unlit: true }); }
    } },
    rock: { w: 20, h: 16, n: 2, draw(d, v) {
      d.blob([[2, 14], [3, 7], [8, 3], [14, 3], [18, 8], [18, 14]], v ? '#9a98a4' : '#a8a4a0', { tex: 0.3, texSize: 1 });
      d.ell(13, 11, 3.5, 2.6, v ? '#8a8894' : '#989490', 0, { tex: 0.3 });
      d.deco.line(7, 6, 10, 10, 0.7, '#6a6874');
    } },
    palm: { w: 44, h: 60, n: 2, draw(d, v) {
      const tr = '#a8784a', g = '#3fa640', gd = '#2e8a3a';
      const top = v ? [26, 15] : [17, 15];
      const base = [22, 59];
      const pts = [base, [base[0] + (top[0] - base[0]) * 0.3 + (v ? -3 : 3), 44], [base[0] + (top[0] - base[0]) * 0.7, 28], top];
      d.tube(pts, 7, 5, tr, { tex: 0.2 });
      for (let i = 1; i < 9; i++) {
        const k = i / 9, x = base[0] + (top[0] - base[0]) * k + Math.sin(k * 3) * (v ? -2 : 2), y = base[1] + (top[1] - base[1]) * k;
        d.deco.line(x - 3, y, x + 3, y - 1, 0.8, '#7a5230');
      }
      const [tx, ty] = top;
      const fr = [[-20, 6], [-15, -4], [-6, -12], [6, -12], [15, -4], [20, 6], [-10, 10], [10, 10]];
      fr.forEach(([fx, fy], i) => {
        d.tube([[tx, ty], [tx + fx * 0.55, ty + fy * 0.55 - 3], [tx + fx, ty + fy]], 5.5, 1.2, i < 2 || i > 5 ? gd : g, { far: i >= 6 });
      });
      d.circ(tx - 2, ty + 3, 2.4, '#7a4a28', { shiny: true }); d.circ(tx + 2, ty + 4, 2.4, '#7a4a28', { shiny: true });
    } },
    // cabine téléphonique de la plage (épisode 2 de l'animé) : grande cabine vitrée, toit bleu « TEL », combiné vert
    booth: { w: 30, h: 58, n: 1, draw(d) {
      d.ell(15, 56, 13, 2.4, '#7a6a4a', 0, { flat: true });
      d.rect(3, 50, 24, 6, '#9aa0aa', { round: 0.2 });                               // socle de béton
      d.rect(4, 14, 22, 38, '#e8ecf2', { round: 0.08, shiny: true });              // cadre
      d.deco.rect(6.5, 17, 17, 31, '#7ccaf0');                                       // vitres
      d.deco.rect(6.5, 17, 5, 31, '#b8e8ff'); d.deco.line(15, 17, 15, 48, 0.8, '#d8e0ea');
      d.deco.line(6.5, 32, 23.5, 32, 0.8, '#d8e0ea');
      d.deco.rect(16.5, 22, 5.4, 9, '#3aa060');                                      // téléphone vert
      d.deco.rect(17.2, 23, 4, 2.4, '#c8f0d0', { unlit: true });
      d.deco.rect(15.6, 24, 1.4, 6, '#1a5a30'); d.deco.curve([[16.3, 30], [15, 34], [18, 36]], 0.5, '#1a1a1a');
      d.deco.rect(16, 18.4, 7, 1.4, '#ff7a3a', { unlit: true });                    // voyant
      d.rect(2, 7, 26, 8, '#3f72cc', { round: 0.35, shiny: true });                  // toit
      d.deco.rect(7, 8.4, 16, 6, '#ffffff', { unlit: true });
      const W = DW.World.signText; if (W) W(d, 'TEL', 9, 9, '#2a5ab8', 1);   // lettres de 3×5 pixels
      d.rect(13, 2, 4, 6, '#3f72cc', { round: 0.4 }); d.deco.circ(15, 3.4, 1.2, '#ffe060', { unlit: true });
    } },
    // panneau : grand, bien visible (planche claire bordée, petit toit, deux poteaux)
    sign: { w: 28, h: 32, n: 1, draw(d) {
      d.ell(14, 31, 11, 1.8, '#2a2a2a', 0, { flat: true });
      d.tube([[7, 31], [7, 12]], 3, 2.8, '#6a4424'); d.tube([[21, 31], [21, 12]], 3, 2.8, '#6a4424', { far: true });
      d.poly([[0, 6], [14, 0], [28, 6], [26, 8], [2, 8]], '#8a3a2a', { tex: 0.2 });
      d.rect(1.5, 7, 25, 15, '#7a5230', { round: 0.2 });
      d.rect(3, 8.5, 22, 12, '#e8c890', { round: 0.2, tex: 0.2 });
      d.deco.line(6, 12, 22, 12, 1, '#6a4a28'); d.deco.line(6, 15, 20, 15, 1, '#6a4a28'); d.deco.line(6, 18, 17, 18, 1, '#6a4a28');
    } },
    spring: { w: 30, h: 22, n: 1, draw(d) {
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        d.circ(15 + Math.cos(a) * 11.5, 13 + Math.sin(a) * 6.5, 3.2, i % 2 ? '#9aa0b0' : '#b0b4c0', { tex: 0.25 });
      }
      d.ell(15, 13, 10, 5.2, '#4ed8f0', 0, { unlit: true, flat: true });
      d.deco.ell(15, 13, 7, 3.4, '#8af0ff', 0, { unlit: true });
      d.deco.ell(13, 12, 3, 1.2, '#e8ffff', 0, { unlit: true });
      d.poly([[22, 10], [24, 2], [26, 10]], '#7ae8ff', { shiny: true });
      d.poly([[5, 11], [6.5, 5], [8, 11]], '#7ae8ff', { shiny: true });
    } },
    log: { w: 32, h: 16, n: 1, draw(d) {
      d.tube([[4, 9], [27, 9]], 10, 10, '#8a5a32', { tex: 0.3 });
      d.deco.line(8, 6, 22, 6, 0.7, '#6a4022'); d.deco.line(10, 11, 24, 11, 0.7, '#6a4022');
      d.ell(27.5, 9, 3, 5, '#d0a068');
      d.deco.ell(27.5, 9, 1.6, 3, '#a87848');
      d.circ(14, 4, 2.2, '#4aa246', { tex: 0.4 });
    } },
    stump: { w: 18, h: 16, n: 1, draw(d) {
      d.ell(9, 13, 8, 2.6, '#6a4424', 0, { flat: true });
      d.rect(3, 6, 12, 8, '#8a5a32', { round: 0.4, tex: 0.3 });
      d.ell(9, 6, 6, 2.6, '#d4a46a');
      d.deco.ell(9, 6, 3.6, 1.4, '#b0804a'); d.deco.ell(9, 6, 1.4, 0.6, '#8a5a32');
    } },
    crib: { w: 22, h: 22, n: 2, draw(d, v) {
      const side = v ? '#a8d4ff' : '#ffb6d0';
      d.rect(3, 15, 2, 6, '#d8c0b0'); d.rect(17, 15, 2, 6, '#d8c0b0');
      d.rect(2, 9, 18, 9, '#fff4ec', { round: 0.3 });
      for (let x = 4; x < 19; x += 2.5) d.deco.rect(x, 10, 1, 7, side);
      d.deco.rect(2, 16, 18, 2, side);
      d.ell(11, 7, 4.2, 5.2, '#fffaf0');
      d.deco.circ(10, 5, 1.2, v ? '#ff9ac0' : '#7ab8ff'); d.deco.circ(12.6, 8, 1, '#ffd060'); d.deco.circ(9.4, 9, 0.9, v ? '#ff9ac0' : '#7ab8ff');
    } },
    block: { w: 18, h: 20, n: 4, draw(d, v) {
      const col = ['#f25a5a', '#4ea4f2', '#f2c63a', '#5ac46a'][v];
      const c = Art.hex(col), lt = Art.mix(c, [255, 255, 255], 0.35), dk = Art.mix(c, [40, 20, 60], 0.35);
      const h = a => '#' + a.map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
      d.poly([[2, 6], [9, 2], [16, 6], [9, 10]], h(lt), { flat: true });
      d.poly([[2, 6], [9, 10], [9, 19], [2, 15]], col, { flat: true });
      d.poly([[9, 10], [16, 6], [16, 15], [9, 19]], h(dk), { flat: true });
      d.deco.rect(4, 9.5, 3, 1, '#ffffff', { unlit: true }); d.deco.rect(5, 10.5, 1, 4, '#ffffff', { unlit: true });
      d.deco.circ(12.5, 12, 1.6, '#ffffff', { unlit: true });
    } },
    candytree: { w: 30, h: 40, n: 3, draw(d, v) {
      const lf = ['#ffb4d4', '#a8f0c8', '#cbb8ff'][v];
      d.tube([[15, 39], [15, 20]], 5, 4, '#fff0f4');
      for (let y = 22; y < 38; y += 4) d.deco.line(12, y + 2, 18, y, 1.4, '#ff86a8');
      d.circ(8, 18, 6.5, lf, { far: true, tex: 0.25, texSize: 1 }); d.circ(22, 18, 6.5, lf, { far: true, tex: 0.25, texSize: 1 });
      d.circ(15, 12, 9.5, lf, { tex: 0.25, texSize: 1 }); d.circ(15, 21, 7, lf, { tex: 0.25, texSize: 1 });
      d.deco.circ(11, 9, 1.4, '#ffffff', { unlit: true }); d.deco.circ(19, 15, 1.2, '#ffffff', { unlit: true });
    } },
    house: { w: 56, h: 62, n: 1, draw(d) {
      d.rect(6, 28, 44, 32, '#fff0d8', { round: 0.2 });
      d.deco.rect(6, 54, 44, 6, '#f0d0b0');
      d.deco.ell(14, 40, 5, 5, '#5a9ae8'); d.deco.ell(14, 40, 3.6, 3.6, '#a8dcff'); d.deco.line(14, 35.5, 14, 44.5, 0.8, '#ffffff');
      d.deco.ell(42, 40, 5, 5, '#5a9ae8'); d.deco.ell(42, 40, 3.6, 3.6, '#a8dcff'); d.deco.line(42, 35.5, 42, 44.5, 0.8, '#ffffff');
      d.deco.rect(22, 42, 12, 18, '#9a5a3a'); d.deco.ell(28, 42, 6, 5, '#9a5a3a'); d.deco.circ(31.5, 51, 1, '#ffd040', { unlit: true });
      d.rect(36, 6, 7, 14, '#e87a6a', { round: 0.4 });
      d.blob([[0, 32], [4, 18], [16, 6], [28, 2], [40, 6], [52, 18], [56, 32], [28, 34]], '#f2708a', { shiny: true });
      d.deco.ell(20, 14, 5, 2, '#ff9ab0'); d.deco.ell(36, 22, 4, 1.6, '#ff9ab0');
      d.ell(10, 58, 4, 2.6, '#ff9ac0'); d.ell(46, 58, 4, 2.6, '#a8c8ff');
    } },
    stall: { w: 36, h: 34, n: 1, draw(d) {
      d.tube([[4, 33], [4, 8]], 2.4, 2.4, '#8a5a32'); d.tube([[32, 33], [32, 8]], 2.4, 2.4, '#8a5a32');
      d.rect(1, 18, 34, 15, '#c08a52', { round: 0.25, tex: 0.25 });
      d.deco.rect(1, 18, 34, 3, '#e0b070');
      d.ell(9, 16, 4, 2.4, '#b04a2a'); d.deco.circ(6, 16, 1, '#ffffff', { unlit: true });
      d.ell(18, 16, 4, 2.4, '#b04a2a'); d.deco.circ(15, 16, 1, '#ffffff', { unlit: true });
      d.ell(27, 16.5, 3, 3, '#5ab8f0', 0, { shiny: true });
      d.poly([[0, 10], [3, 2], [33, 2], [36, 10]], '#f05a5a', { shiny: true });
      for (let x = 6; x < 33; x += 8) d.deco.poly([[x, 2], [x + 4, 2], [x + 5, 10], [x - 1, 10]], '#ffffff');
    } },
    rubble: { w: 22, h: 20, n: 1, draw(d) {
      d.blob([[1, 18], [3, 9], [9, 6], [12, 10], [12, 18]], '#9a8a7a', { tex: 0.3 });
      d.blob([[9, 18], [11, 7], [16, 3], [21, 9], [21, 18]], '#8a7a6c', { tex: 0.3 });
      d.blob([[5, 19], [7, 13], [13, 12], [16, 19]], '#a89a88', { tex: 0.3 });
    } },
  };
  const objCache = {};
  // ------------------------------------------------------------ échelle du décor (proportions façon Digimon World)
  // Les arbres dominent largement le héros, comme dans Digimon World : le dessin est rendu plus grand
  // (vraie résolution, pas de pixels étirés), posé sur la même case (ancrage en bas au centre).
  const OBJ_SCALE = {};
  for (const k of ['tree', 'oak', 'birch', 'pine', 'palm', 'candytree', 'cycad', 'jungletree', 'mangrove', 'swamptree', 'acacia', 'baobab', 'deadtree']) OBJ_SCALE[k] = 1.55;
  for (const k of ['bigtree', 'cactus', 'giantstump', 'spire']) OBJ_SCALE[k] = 1.45;
  for (const k of ['bush', 'fern', 'bigfern', 'junglebush', 'snowbush', 'drybush', 'reeds', 'hedge']) OBJ_SCALE[k] = 1.3;
  // fleurs et champignons (même « géants ») restent plus petits que les arbres et les maisons
  for (const k of ['giantflower', 'giantshroom', 'glowshroom']) OBJ_SCALE[k] = 0.9;
  for (const k of ['rock', 'boulder', 'mossrock', 'icerock', 'lavarock', 'searock', 'basalt', 'crystal', 'stalagmite', 'icecrystal', 'termite', 'log', 'hollowlog', 'stump']) OBJ_SCALE[k] = 1.3;
  World.OBJ_SCALE = OBJ_SCALE;
  const objSize = (kind, v) => { const o = OBJ[kind], S = o.scale || OBJ_SCALE[kind] || 1;
    const w = typeof o.w === 'function' ? o.w(v) : o.w, h = typeof o.h === 'function' ? o.h(v) : o.h;   // taille fixe, ou selon la variante (clôture de v cases)
    return { w, h, W: Math.round(w * S), H: Math.round(h * S) }; };
  World.obj = (kind, v = 0) => {
    const o = OBJ[kind], key = kind + v;
    if (!objCache[key]) { const z = objSize(kind, v); objCache[key] = Art.render(dd => o.draw(dd, v, 0), z.W, z.H, { box: [z.w, z.h], silhouettes: false, noOutline: !!o.noOutline }); }
    return objCache[key];
  };
  // images d'un objet animé (moulin, cascade, linge...) : OBJ.frames images
  World.objFrame = (kind, v, f) => {
    const o = OBJ[kind], key = kind + v + '_' + f;
    if (objCache[key]) return objCache[key];
    const z = objSize(kind, v);
    return (objCache[key] = Art.render(dd => o.draw(dd, v, f), z.W, z.H, { box: [z.w, z.h], silhouettes: false, noOutline: !!o.noOutline }));
  };
  World.objFrames = (kind, v = 0) => Array.from({ length: OBJ[kind].frames }, (_, f) => World.objFrame(kind, v, f));
  World.objReady = (kind, v = 0, f = 0) => !!objCache[kind + v + (OBJ[kind].frames ? '_' + f : '')];
  World.OBJ = OBJ;

  World.TER = TER;
})();
