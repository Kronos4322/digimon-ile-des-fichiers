'use strict';
// =====================================================================
//  MONDE — légende des cartes et objets en volume (arbres, rochers, maisons...)
// =====================================================================
(function () {
  const Art = DW.Art;
  const World = DW.World = {};

  // ------------------------------------------------------------ légende
  // t: terrain  solid: bloquant  obj: objet en volume  tall: herbes hautes (rencontres)  deco: décor peint au sol
  const TER = { grass: 0, dirt: 1, sand: 2, water: 3, bridge: 4, lawn: 5, stone: 6, cliff: 7, canopy: 8, stairs: 9, pastel: 10, cobble: 11, wood: 12, wall: 13, void: 14, metal: 15, rock: 16 };
  const CH = {
    '.': { t: 'grass' }, ',': { t: 'grass', tall: 'grass' }, '=': { t: 'dirt' }, 's': { t: 'sand' }, ';': { t: 'sand', tall: 'dune' },
    '~': { t: 'water', solid: true }, '_': { t: 'bridge' }, 'v': { t: 'lawn' }, ':': { t: 'lawn', tall: 'pastel' }, 'o': { t: 'stone' },
    'f': { t: 'grass', deco: 'flowers' }, 'q': { t: 'lawn', deco: 'flowers2' }, 'm': { t: 'grass', deco: 'mushrooms' },
    'Ŵ': { t: 'rock', solid: true },
    // EAUX (peintes dans l'éditeur, case par case ; « ~ » garde l'eau de l'ambiance de la carte) : gfx/terrain.js, World.EAUX
    // SOLS DE MONTAGNE : rocaille (terre semée de cailloux) et cendres volcaniques (sombres, quelques braises) : gfx/terrain.js
    'ǥ': { t: 'dirt', sol: 1, deco: 'gravier', nom: 'Rocaille' }, 'ţ': { t: 'dirt', sol: 2, nom: 'Cendres volcaniques' },
    'ȴ': { t: 'water', solid: true, eau: 5, nom: 'Lave (lac de lave du cratère)' },
    '≈': { t: 'water', solid: true, eau: 1 }, '∼': { t: 'water', solid: true, eau: 2 }, '≋': { t: 'water', solid: true, eau: 3 }, '≃': { t: 'water', solid: true, eau: 4 },   // paroi rocheuse haute (montagnes en terrasses façon Digimon World 2003 : gfx/terrain.js)
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
    'K': { t: 'grass', obj: 'hedge', solid: true }, 'd': { t: 'grass', obj: 'flowerbed', solid: true }, 'e': { t: 'grass', obj: 'well', solid: true, v: 0, nom: 'Puits plein (on y boit)' }, 'ȩ': { t: 'grass', obj: 'well', solid: true, v: 1, nom: 'Puits vide (à sec)' },
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

  // DESSINS DE SECOURS des décors remplacés par les images du joueur (gfx/textures.js) : ils ne servent que si une image
  // ne se charge pas (réseau coupé...) ; volontairement simples. (w, h) = la boîte de l'objet
  World.secours = {
    arbre: (w, h) => d => { d.ell(w / 2, h - 2, w * 0.26, 2, '#3a2614', 0, { flat: true }); d.tube([[w / 2, h - 1], [w / 2, h * 0.5]], w * 0.16, w * 0.12, '#6e4a2a'); d.circ(w / 2, h * 0.36, Math.min(w * 0.42, h * 0.34), '#3e8a3c', { tex: 0.5, texSize: 1 }); },
    buisson: (w, h) => d => d.circ(w / 2, h * 0.58, Math.min(w, h) * 0.42, '#3e8a3c', { tex: 0.5, texSize: 1 }),
    plante: (w, h) => d => { for (let i = -2; i <= 2; i++) d.tube([[w / 2, h - 1], [w / 2 + i * w * 0.18, h * 0.25]], 2.4, 0.8, '#3e9a40'); },
    champignon: (w, h) => d => { d.tube([[w / 2, h - 1], [w / 2, h * 0.45]], w * 0.18, w * 0.15, '#eee8dc'); d.ell(w / 2, h * 0.4, w * 0.4, h * 0.2, '#c8402a'); },
    rocher: (w, h) => d => d.blob([[2, h - 2], [3, h * 0.45], [w * 0.4, h * 0.15], [w * 0.75, h * 0.25], [w - 2, h * 0.6], [w - 2, h - 2]], '#8e8a84', { tex: 0.3 }),
    bois: (w, h) => d => d.tube([[3, h * 0.6], [w - 3, h * 0.6]], h * 0.5, h * 0.5, '#7a5030', { tex: 0.3 }),
    pierre: (w, h) => d => d.blob([[w * 0.2, h - 1], [w * 0.15, h * 0.2], [w * 0.5, 2], [w * 0.85, h * 0.2], [w * 0.8, h - 1]], '#8a96a4', { tex: 0.3 }),
    boite: (w, h) => d => d.rect(2, 2, w - 4, h - 3, '#9a7a5a'),   // (meubles, mobilier de ville)
  };
  const SECOURS = World.secours;

  // ------------------------------------------------------------ objets en volume
  const OBJ = {
    tree: { w: 36, h: 46, n: 10, draw: SECOURS.arbre(36, 46) },
    // (saisons, gfx/meteo.js : v 1 automne, 2 nu, 3 nu et enneigé ; images : gfx/textures.js)
    oak: { w: 36, h: 46, n: 1, draw: SECOURS.arbre(36, 46) },
    birch: { w: 36, h: 46, n: 1, draw: SECOURS.arbre(36, 46) },
    bigtree: { w: 80, h: 98, n: 2, draw: SECOURS.arbre(80, 98) },
    fern: { w: 22, h: 16, n: 2, draw: SECOURS.plante(22, 16) },
    glowshroom: { w: 24, h: 28, n: 2, draw: SECOURS.champignon(24, 28) },
    mossrock: { w: 24, h: 20, n: 2, draw: SECOURS.rocher(24, 20) },
    hollowlog: { w: 36, h: 18, n: 1, draw: SECOURS.bois(36, 18) },
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
    lamp: { w: 12, h: 32, n: 1, draw: SECOURS.pierre(12, 32) },
    // distributeur (Digimon World 1) : 0 PV (vert), 1 PM (bleu), 2 nourriture (orange) ; grand, coloré, éclairé la nuit
    vending: { w: 26, h: 44, n: 3, lights: [[13, 16, 22]], draw: SECOURS.boite(26, 44) },
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
    datacrystal: { w: 30, h: 44, n: 1, lights: [[15, 16, 16]], draw: SECOURS.pierre(30, 44) },
    shrine: { w: 28, h: 26, n: 1, draw: SECOURS.pierre(28, 26) },
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
    toilet: { w: 36, h: 46, n: 1, lights: [[30, 18, 12]], draw: SECOURS.boite(36, 46) },
    bench: { w: 22, h: 14, n: 1, draw: SECOURS.bois(22, 14) },
    flag: { w: 16, h: 34, n: 2, draw(d, v) {
      d.tube([[4, 33], [4, 2]], 1.8, 1.6, '#c8c0b0', { shiny: true });
      d.poly([[5, 3], [15, 6], [5, 12]], v ? '#3a8ae8' : '#f8a830', { shiny: true });
      d.deco.circ(8, 7, 1.4, '#ffffff', { unlit: true });
    } },
    barrel: { w: 16, h: 18, n: 2, draw: SECOURS.bois(16, 18) },
    bush: { w: 22, h: 18, n: 2, draw: SECOURS.buisson(22, 18) },
    rock: { w: 20, h: 16, n: 2, draw: SECOURS.rocher(20, 16) },
    palm: { w: 44, h: 60, n: 2, draw: SECOURS.arbre(44, 60) },
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
    sign: { w: 28, h: 32, n: 1, draw: SECOURS.pierre(28, 32) },
    spring: { w: 30, h: 22, n: 1, draw: SECOURS.pierre(30, 22) },
    log: { w: 32, h: 16, n: 1, draw: SECOURS.bois(32, 16) },
    stump: { w: 18, h: 16, n: 1, draw: SECOURS.bois(18, 16) },
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
    candytree: { w: 30, h: 40, n: 3, draw: SECOURS.arbre(30, 40) },
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
    stall: { w: 36, h: 34, n: 1, draw: SECOURS.boite(36, 34) },
    rubble: { w: 22, h: 20, n: 1, draw: SECOURS.rocher(22, 20) },
  };
  const objCache = {};
  // oublie les rendus d'un objet (toutes variantes et images) : à refaire au prochain appel
  const oublier = kind => { for (const key in objCache) if (key.startsWith(kind) && /^\d/.test(key.slice(kind.length))) delete objCache[key]; };
  World.oublierObjet = oublier;
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
  // TAILLE DES BÂTIMENTS (règle du joueur) : hauteur VISIBLE en hauteurs de héros (34,5 px) — maisons, boutiques et
  // bâtiments 3 fois le héros, maisons des villages de bébés 2,5 fois, toilettes 2 fois. L'échelle de chaque dessin est
  // calculée une fois, d'après sa vraie hauteur (variante 0), et vaut pour toutes ses variantes (les formes agrandies
  // de la ville restent plus grandes que la première). Posé en bas, centré : la porte reste au même endroit.
  const HEROS_VISIBLE = 34.5;
  const TAILLE_HEROS = World.TAILLE_HEROS = {};
  for (const k of ['jhouse', 'bazar', 'dojo', 'restaurant', 'garden', 'homepalace', 'shack', 'cottage', 'townhouse', 'apartment', 'shopfront',
    'bakery', 'patisserie', 'bank', 'poste', 'ecole', 'gymnase', 'barn', 'greenhouse', 'windmill', 'chalet', 'wcabin', 'chapel', 'lighthouse',
    'manor', 'bogshack', 'stilthut']) TAILLE_HEROS[k] = 3;
  for (const k of ['house', 'eggcottage', 'yokohut']) TAILLE_HEROS[k] = 2.5;   // (Village des Bébés, Village des Yokomon)
  const hauteurVisible = r => {
    const c = r.img || r, k = c._k || 1, w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data;
    let y0 = h, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0, i = y * w * 4 + 3; x < w; x++, i += 4) if (d[i] > 60) { if (y < y0) y0 = y; y1 = y; break; }
    return y1 < 0 ? 0 : (y1 - y0 + 1) / k;
  };
  function echelleBatiment(kind) {
    const o = OBJ[kind], cible = TAILLE_HEROS[kind]; if (!cible || o._echelle != null) return;
    o._echelle = 0; o.scale = 1;
    const r = o.frames ? World.objFrame(kind, 0, 0) : World.obj(kind, 0), vh = hauteurVisible(r);
    oublier(kind);   // (rendus à l'échelle 1 jetés)
    o.scale = o._echelle = vh > 0 ? cible * HEROS_VISIBLE / vh : 1;
  }
  World.echelleBatiment = echelleBatiment;
  const objSize = (kind, v) => { const o = OBJ[kind], S = o.scale || OBJ_SCALE[kind] || 1;
    const w = typeof o.w === 'function' ? o.w(v) : o.w, h = typeof o.h === 'function' ? o.h(v) : o.h;   // taille fixe, ou selon la variante (clôture de v cases)
    return { w, h, W: Math.round(w * S), H: Math.round(h * S) }; };
  // dessin « au pinceau » (o.paint, ex. arbres peints : gfx/arbres.js) : canvas en haute définition, repère = boîte de l'objet
  const paintRender = (o, v, z, f = 0) => {
    const k = Art.HD || 1, c = Art.canvas(Math.round((z.W + 2) * k), Math.round((z.H + 2) * k)), x = c.getContext('2d');
    x.scale(k * z.W / z.w, k * z.H / z.h); x.translate(1, 1);
    o.paint(x, v, f);
    c._k = k;
    return { img: c, w: c.width / k, h: c.height / k, k };
  };
  // arbre dessiné avec une image du joueur (gfx/textures.js : ARBRES) : posé en bas, centré, dans le cadre de l'objet
  const arbreImg = (kind, v, z) => {
    const T = DW.Textures, A = T && T.fini && T.arbre && T.arbre(kind, v, z.w, z.h, z.W / z.w); if (!A) return null;
    const o = OBJ[kind];   // (o.surImage : un détail dessiné par-dessus l'image, ex. les affiches du panneau de la ville)
    return paintRender({ paint: x => { x.imageSmoothingEnabled = true; x.drawImage(A.net, A.x, A.y, A.w, A.h); if (o.surImage) o.surImage(x, v, z.w, z.h); } }, v, z);
  };
  World.obj = (kind, v = 0) => {
    const o = OBJ[kind], key = kind + v;
    if (TAILLE_HEROS[kind] && o._echelle == null) echelleBatiment(kind);
    if (!objCache[key]) {
      const z = objSize(kind, v), img = arbreImg(kind, v, z);
      if (img) return (objCache[key] = img);
      objCache[key] = o.paint && (!o.painted || o.painted(v)) ? paintRender(o, v, z)
        : Art.render(dd => o.draw(dd, v, 0), z.W, z.H, { box: [z.w, z.h], silhouettes: false, noOutline: !!o.noOutline });
    }
    return objCache[key];
  };
  // images d'un objet animé (moulin, cascade, linge...) : OBJ.frames images
  World.objFrame = (kind, v, f) => {
    const o = OBJ[kind], key = kind + v + '_' + f;
    if (TAILLE_HEROS[kind] && o._echelle == null) echelleBatiment(kind);
    if (objCache[key]) return objCache[key];
    const z = objSize(kind, v);
    return (objCache[key] = o.paint && (!o.painted || o.painted(v)) ? paintRender(o, v, z, f)
      : Art.render(dd => o.draw(dd, v, f), z.W, z.H, { box: [z.w, z.h], silhouettes: false, noOutline: !!o.noOutline }));
  };
  World.objFrames = (kind, v = 0) => Array.from({ length: OBJ[kind].frames }, (_, f) => World.objFrame(kind, v, f));
  World.objReady = (kind, v = 0, f = 0) => !!objCache[kind + v + (OBJ[kind].frames ? '_' + f : '')];
  World.OBJ = OBJ;

  World.TER = TER;
})();
