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
    arbre: (w, h) => d => { d.tube([[w / 2, h - 1], [w / 2, h * 0.5]], w * 0.16, w * 0.12, '#6e4a2a'); d.circ(w / 2, h * 0.36, Math.min(w * 0.42, h * 0.34), '#3e8a3c', { tex: 0.5, texSize: 1 }); },
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
    // appareils d'entraînement (images du joueur, dossier SPORT : gfx/textures.js ; ici leur dessin de secours)
    dummy: { w: 22, h: 30, n: 1, draw: SECOURS.bois(22, 30) },
    lamp: { w: 12, h: 32, n: 1, draw: SECOURS.pierre(12, 32) },
    // distributeur (Digimon World 1) : 0 PV, 1 PM, 2 nourriture (images rouge, bleue, blanche : gfx/textures.js) ; éclairé la nuit
    vending: { w: 26, h: 44, n: 3, lights: [[13, 16, 22]], draw: SECOURS.boite(26, 44) },
    weights: { w: 27, h: 30, n: 1, draw: SECOURS.rocher(27, 30) },
    guardwall: { w: 18, h: 30, n: 1, draw: SECOURS.pierre(18, 30) },
    hurdle: { w: 27, h: 30, n: 1, draw: SECOURS.boite(27, 30) },
    // cristal de données (poste PM) : le cristal brille en haut de son pilier
    datacrystal: { w: 24, h: 44, n: 1, lights: [[12, 7, 16]], draw: SECOURS.pierre(24, 44) },
    shrine: { w: 28, h: 26, n: 1, draw: SECOURS.pierre(28, 26) },
    toiletroom: { w: 34, h: 40, n: 1, lights: [[17, 12, 14]], draw(d) {
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
    // toilettes publiques (image : gfx/textures.js)
    toilet: { w: 36, h: 46, n: 1, lights: [[18, 22, 10]], draw: SECOURS.boite(36, 46) },   // (lueur : l'enseigne WC de la porte)
    bench: { w: 22, h: 14, n: 1, draw: SECOURS.bois(22, 14) },
    flag: { w: 16, h: 34, n: 2 },   // (peint : gfx/peints.js)
    barrel: { w: 16, h: 18, n: 2, draw: SECOURS.bois(16, 18) },
    bush: { w: 22, h: 18, n: 2, draw: SECOURS.buisson(22, 18) },
    rock: { w: 20, h: 16, n: 2, draw: SECOURS.rocher(20, 16) },
    palm: { w: 44, h: 60, n: 2, draw: SECOURS.arbre(44, 60) },
    // cabine téléphonique de la plage (épisode 2 de l'animé) : grande cabine vitrée, toit bleu « TEL », combiné vert
    booth: { w: 30, h: 58, n: 1 },   // (peinte : gfx/peints.js)
    // panneau (image : gfx/textures.js)
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
  // bâtiments 3 fois le héros, maisons des villages de bébés 2,5 fois (les toilettes, une image : HAUTEUR de gfx/textures.js).
  // L'échelle de chaque dessin est calculée une fois, d'après sa vraie hauteur (variante 0), et vaut pour toutes ses
  // variantes (les formes agrandies de la ville restent plus grandes que la première). Posé en bas, centré : la porte
  // reste au même endroit.
  const HEROS_VISIBLE = World.HEROS_VISIBLE = 34.5;
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
  // (échelle de rendu : par variante quand ses images n'ont pas les mêmes proportions — o.echelles, gfx/textures.js —,
  //  sinon celle de l'objet)
  const echelleObjet = World.echelleObjet = (kind, v = 0) => { const o = OBJ[kind]; return (o.echelles && o.echelles[v % o.echelles.length]) || o.scale || OBJ_SCALE[kind] || 1; };
  const objSize = (kind, v) => { const o = OBJ[kind], S = echelleObjet(kind, v);
    const w = typeof o.w === 'function' ? o.w(v) : o.w, h = typeof o.h === 'function' ? o.h(v) : o.h;   // taille fixe, ou selon la variante (clôture de v cases)
    return { w, h, W: Math.round(w * S), H: Math.round(h * S) }; };
  // dessin « au pinceau » (o.paint, ex. décors peints : gfx/peints.js) : canvas en haute définition, repère = boîte de l'objet
  const paintRender = (o, v, z, f = 0) => {
    const k = Art.HD || 1, c = Art.canvas(Math.round((z.W + 2) * k), Math.round((z.H + 2) * k)), x = c.getContext('2d');
    x.scale(k, k); x.translate(1, 1); x.scale(z.W / z.w, z.H / z.h);
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
