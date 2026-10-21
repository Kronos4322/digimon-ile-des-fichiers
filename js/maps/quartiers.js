'use strict';
// =====================================================================
//  QUARTIERS PÉRIPHÉRIQUES — la Ville des Fichiers devient une mégapole
//  Chaque quartier s'ouvre quand la ville atteint un certain niveau, puis se remplit au fil des niveaux suivants :
//  chaque emplacement a son niveau minimal (sur une échelle de 16 paliers : level()).
//  Rien n'est montré à l'avance : avant son ouverture, le chemin vers le quartier n'existe pas,
//  et un emplacement pas encore construit reste une simple pelouse.
//    Quartier Résidentiel (nord de la ville)    — maisons de ville, immeubles, parc     (ville au niveau 3)
//    Quartier du Marché  (est du Résidentiel)   — boutiques, étals, tour de l'horloge   (ville au niveau 6)
//    Quartier Numérique  (ouest du Résidentiel) — tours de données, câbles, façon DW2003 (ville au niveau 10)
//  Toutes les maisons et tous les immeubles se visitent (intérieurs générés : salon, cuisine,
//  chambre ou salon de musique, avec un habitant).
// =====================================================================
(function () {
  const { say, paint } = DW.MapKit;
  const MAPS = DW.MAPS, Hh = DW.Art.hash;
  // les quartiers ont été conçus sur une échelle de 16 paliers ; la ville en compte 11 (développement en %, game/town.js)
  const level = () => Math.round(DW.Town.level() * 16 / 11);
  // agrandissement des quartiers (bâtiments plus grands, plus d'espace) : plan d'origine 48×34 × Z
  const Z = 1.8, W = Math.round(48 * Z), H = Math.round(34 * Z);
  // herbe non praticable (invisible) : derrière les grands bâtiments, là où le toit déborde de l'emprise
  DW.World.CH['ŧ'] = { t: 'grass', solid: true }; DW.SOLID.add('ŧ');

  // ------------------------------------------------------------ habitants (Digimon qui emménagent)
  const CITIZENS = ['agumon', 'gabumon', 'biyomon', 'tentomon', 'palmon', 'gomamon', 'patamon', 'elecmon', 'gotsumon', 'betamon', 'penguinmon',
    'kunemon', 'mushroomon', 'monochromon', 'leomon', 'frigimon', 'gekomon', 'unimon', 'koromon', 'tsunomon', 'tanemon', 'yokomon', 'bukamon', 'numemon'];
  const LINES = [
    "La ville grandit à vue d'œil ! Quand je suis arrivé, il n'y avait que des ruines...",
    "J'ai emménagé la semaine dernière. Les voisins sont adorables !",
    "Le soir, j'aime regarder les lumières de la ville depuis ma fenêtre.",
    "On raconte qu'un jour, la Ville des Fichiers sera la plus grande cité de tout le Monde Digital !",
    "Tu as visité le Marché ? On y trouve de tout, même des cartes rares !",
    "Prends ton temps, mets-toi à l'aise. Une tasse de thé ?",
    "Les tours du Quartier Numérique ronronnent toute la nuit... C'est très reposant.",
    "Mon rêve ? Digivoluer un jour, et protéger la ville comme toi !",
    "Jijimon dit que chaque nouvel habitant rend la ville plus forte.",
    "Quand il pleut, j'écoute les gouttes sur le toit. Ploc, ploc...",
  ];
  // seuls les Digimon déjà COMBATTUS au moins une fois (ou déjà élevés) viennent habiter en ville
  // (anciennes sauvegardes sans st.fought : on se fie aux Digimon déjà vus)
  const known = sp => { const s = DW.state; if (!s) return false; const F = s.fought || s.seen || {}; return !!(F[sp] || (s.owned || {})[sp] || (DW.Town && DW.Town.has(sp))); };
  DW.Citizens = { known };
  // promeneur des rues : un des Digimon déjà rencontrés
  const citizenOf = seed => { const P = CITIZENS.filter(known); return P.length ? P[Math.floor(Hh(seed, 7, 801) * P.length)] : null; };
  // chaque logement a son PROPRIÉTAIRE (décor de la maison, nom, boîte aux lettres à son élément) ; il y habite une fois
  // rencontré, le logement reste vide avant
  const ownerOf = seed => CITIZENS[Math.floor(Hh(seed, 7, 801) * CITIZENS.length)];
  const homeNpc = (sp, seed, x, y, line, flavor) => (!known(sp) ? [] :
    [{ sp, x, y, face: 'left', wander: 1, talk: async () => { await say(line, nameOf(sp)); if (flavor && Hh(seed, 5, 807) < 0.5) await say(flavor, nameOf(sp)); } }]);
  const lineOf = seed => LINES[Math.floor(Hh(seed, 9, 802) * LINES.length)];
  const nameOf = sp => (DW.SPECIES[sp] ? DW.SPECIES[sp].name : sp);

  // ------------------------------------------------------------ intérieurs des maisons (générés)
  // pièce 14 × (2 rangées de mur + 7 de sol), porte en bas au centre (colonnes 6-7)
  const ROOM_W = 14, ROOM_H = 7, DOOR_X = 6;
  const roomRows = () => DW.MapKit.doorRoom(ROOM_W, ROOM_H).rows;   // (porte en colonnes 6-7 = DOOR_X)
  const FLOORS = [null, { type: 'tile', cols: ['#f4ece0', '#c8b8a8', '#a89888'] }, { type: 'herring', cols: ['#c8925a', '#9a6a3a', '#6a4422'] },
    { type: 'carpet', cols: ['#8aa8d8', '#7898c8', '#e8d8a0'] }, { type: 'tatami', cols: ['#d8cc8a', '#c4b878', '#4a6a3a'] },
    { type: 'carpet', cols: ['#d89aa8', '#c88898', '#fff0d8'] }, { type: 'tile', cols: ['#e8f0f4', '#9ab8c8', '#7a98a8'] }, { type: 'stone', cols: ['#d8d0c4', '#b8b0a4', '#8a8478'] }];
  const WALLS = [null, { base: '#f4e0d8', alt: '#e8c8c0', pattern: 'stripes', wood: '#a8704a' }, { base: '#e0ecf4', alt: '#c8d8e8', pattern: 'dots', wood: '#6a7a9a' },
    { base: '#f0f0dc', alt: '#d8d8b8', pattern: 'diamond', wood: '#8a6a3a' }, { base: '#e8dcf0', alt: '#d4c4e4', pattern: 'stripes', wood: '#7a5a8a' },
    { base: '#f8ecd0', alt: '#e8d4a8', pattern: 'plain', wood: '#9a6a3a' }, { base: '#d8c8b8', alt: '#c0ae9c', pattern: 'brick', wood: '#6a4a2a' }];
  // aménagements (coordonnées dans la pièce ; les colonnes 6-7 restent libres jusqu'à la porte)
  const LAYOUTS = {
    salon: v => ({ objs: [
      { kind: 'bookshelf', v: v % 2, x: 1, y: 3, w: 2, h: 1 }, { kind: 'crttv', x: 4, y: 3, w: 2, h: 1 },
      { kind: 'window', v: 0, x: 7, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'poster', v: v % 3, x: 10, y: 1, w: 1, h: 1, back: true, oy: 15 },
      { kind: 'aquarium', x: 9, y: 3, w: 3, h: 1 }, { kind: 'bigplant', x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'bigrug', v: v % 3, x: 1, y: 5, w: 5, h: 3, walk: true }, { kind: 'sofa', v: v % 3, x: 2, y: 7, w: 3, h: 1 },
      { kind: 'sidetable', x: 1, y: 6, w: 1, h: 1, small: true }, { kind: 'armchair', v: v % 2, x: 10, y: 6, w: 1, h: 1, small: true },
      { kind: 'floorlamp', x: 12, y: 8, w: 1, h: 1, small: true }, { kind: 'cushion', v: v % 3, x: 9, y: 8, w: 1, h: 1, small: true },
    ], npc: [10, 8], signs: { '4,3': "La télé diffuse un reportage : « Les mystères de la Digivolution ».", '5,3': "La télé diffuse un reportage : « Les mystères de la Digivolution ».",
      '9,3': 'De petits poissons de données nagent entre les algues.', '10,3': 'De petits poissons de données nagent entre les algues.', '11,3': 'De petits poissons de données nagent entre les algues.' } }),
    cuisine: v => ({ objs: [
      { kind: 'kitchen', v: v % 2, x: 1, y: 3, w: 4, h: 1 }, { kind: 'fridge', x: 5, y: 3, w: 1, h: 1, small: true },
      { kind: 'window', v: 0, x: 8, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'shelf', x: 10, y: 2, w: 2, h: 1, back: true, oy: 6 },
      { kind: 'pots', x: 10, y: 3, w: 2, h: 1 }, { kind: 'plant', v: 1, x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'bigrug', v: (v + 1) % 3, x: 8, y: 5, w: 5, h: 3, walk: true }, { kind: 'table', x: 9, y: 6, w: 2, h: 1 },
      { kind: 'stool', x: 8, y: 6, w: 1, h: 1, small: true }, { kind: 'stool', x: 11, y: 6, w: 1, h: 1, small: true },
      { kind: 'floorlamp', x: 1, y: 8, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 12, y: 8, w: 1, h: 1, small: true },
    ], npc: [3, 7], signs: { '1,3': 'Ça sent bon le gâteau à la viande...', '2,3': 'Ça sent bon le gâteau à la viande...', '5,3': 'Le frigo est rempli de Digiviandes et de lait.' } }),
    chambre: v => ({ objs: [
      { kind: 'bed', x: 1, y: 3, w: 2, h: 2 }, { kind: 'sidetable', x: 3, y: 3, w: 1, h: 1, small: true },
      { kind: 'window', v: 0, x: 4, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'poster', v: (v + 1) % 3, x: 7, y: 1, w: 1, h: 1, back: true, oy: 15 },
      { kind: 'wardrobe', v: v % 2, x: 8, y: 3, w: 2, h: 1 }, { kind: 'desk', x: 10, y: 3, w: 3, h: 1 },
      { kind: 'bigrug', v: (v + 2) % 3, x: 1, y: 6, w: 5, h: 3, walk: true }, { kind: 'cushion', v: v % 3, x: 3, y: 7, w: 1, h: 1, small: true },
      { kind: 'armchair', v: (v + 1) % 2, x: 11, y: 6, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 12, y: 8, w: 1, h: 1, small: true },
      { kind: 'chest', x: 1, y: 8, w: 1, h: 1, small: true },
    ], npc: [9, 7], signs: { '10,3': "L'ordinateur affiche une carte de l'Île des Fichiers. Des points clignotent un peu partout.", '11,3': "L'ordinateur affiche une carte de l'Île des Fichiers. Des points clignotent un peu partout.", '12,3': "L'ordinateur affiche une carte de l'Île des Fichiers. Des points clignotent un peu partout." } }),
    musique: v => ({ objs: [
      { kind: 'piano', x: 1, y: 3, w: 3, h: 1 }, { kind: 'bookshelf', v: (v + 1) % 2, x: 4, y: 3, w: 2, h: 1 },
      { kind: 'window', v: 0, x: 7, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'frame', x: 4, y: 1, w: 2, h: 1, back: true, oy: 6 },
      { kind: 'aquarium', x: 9, y: 3, w: 3, h: 1 }, { kind: 'bigplant', x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'bigrug', v: v % 3, x: 8, y: 5, w: 5, h: 3, walk: true }, { kind: 'sofa', v: (v + 2) % 3, x: 9, y: 7, w: 3, h: 1 },
      { kind: 'armchair', v: v % 2, x: 2, y: 8, w: 1, h: 1, small: true }, { kind: 'floorlamp', x: 12, y: 8, w: 1, h: 1, small: true },
      { kind: 'cushion', v: (v + 1) % 3, x: 4, y: 7, w: 1, h: 1, small: true },
    ], npc: [8, 6], signs: { '1,3': () => { DW.Audio.sfx('levelup'); return say('Tu pianotes quelques notes... Do, mi, sol ! Ton partenaire danse.'); },
      '2,3': () => { DW.Audio.sfx('levelup'); return say('Tu pianotes quelques notes... Do, mi, sol ! Ton partenaire danse.'); }, '3,3': 'Un vieux piano bien accordé.' } }),
  };
  const LAYOUT_ORDER = ['salon', 'cuisine', 'chambre', 'musique'];
  // crée l'intérieur d'une maison (id), dont la porte extérieure est en (ox, oy) sur la carte du quartier
  // ------------------------------------------------------------ décoration selon l'habitant (élément de l'espèce)
  // sol, papier peint et meubles à thème (gfx/interior2.js), posés là où il y a de la place
  const THEMES = {
    'Feu': { floor: { type: 'herring', cols: ['#c8784a', '#9a5230', '#6a341c'] }, wall: { base: '#e8b090', alt: '#d89878', pattern: 'brick', wood: '#8a3a20' }, add: [['woodstove', 0], ['painting', 1, true]] },
    'Eau': { floor: { type: 'tile', cols: ['#bfe2f2', '#8ac0dc', '#5a92b0'] }, wall: { base: '#d8eef8', alt: '#b8dcef', pattern: 'stripes', wood: '#3a6a8a' }, add: [['shellshelf', 0, true], ['pottedtree', 1]] },
    'Plante': { floor: { type: 'herring', cols: ['#b89060', '#8a6a40', '#5a4426'] }, wall: { base: '#d8ecc8', alt: '#bcdcaa', pattern: 'dots', wood: '#5a7a3a' }, add: [['flowerpots', 0], ['pottedtree', 0], ['flowerpots', 1]] },
    'Électrique': { floor: { type: 'tile', cols: ['#c8ccd4', '#9aa0aa', '#6a707a'] }, wall: { base: '#e0e4ea', alt: '#c8ced8', pattern: 'stripes', wood: '#4a5060' }, add: [['computer', 0], ['crttv', 0]] },
    'Glace': { floor: { type: 'tile', cols: ['#f4f8ff', '#d4e4f4', '#a8c4e0'] }, wall: { base: '#f0f6ff', alt: '#dce8f8', pattern: 'diamond', wood: '#7a98c0' }, add: [['furrug', 0, false, true], ['curtains', 0, true]] },
    'Air': { floor: { type: 'carpet', cols: ['#bfe0f8', '#a0c8ec', '#f8f8ff'] }, wall: { base: '#eaf4ff', alt: '#d4e8fa', pattern: 'dots', wood: '#6a8ab0' }, add: [['nest', 0], ['curtains', 0, true]] },
    'Terre': { floor: { type: 'stone', cols: ['#c8b8a0', '#a89880', '#786a56'] }, wall: { base: '#d8c4a8', alt: '#c4ae90', pattern: 'brick', wood: '#6a4a2a' }, add: [['barrels', 0], ['pottedtree', 1]] },
    'Lumière': { floor: { type: 'carpet', cols: ['#f8ecc8', '#ecdaa8', '#fffaf0'] }, wall: { base: '#fff8e8', alt: '#f4ead0', pattern: 'plain', wood: '#c8a040' }, add: [['painting', 0, true], ['candles', 0], ['curtains', 1, true]] },
    'Ténèbres': { floor: { type: 'carpet', cols: ['#5a3a6a', '#3a2448', '#1e1228'] }, wall: { base: '#4a3a5a', alt: '#3a2c48', pattern: 'diamond', wood: '#241830' }, add: [['candles', 0], ['painting', 2, true], ['candles', 0]] },
    'Insecte': { floor: { type: 'herring', cols: ['#a8905a', '#7e6a3e', '#4e4226'] }, wall: { base: '#dce8c0', alt: '#c4d8a4', pattern: 'stripes', wood: '#6a6a2a' }, add: [['flowerpots', 1], ['pottedtree', 0]] },
    'Neutre': { add: [['toybox', 0]] },
  };
  // cases libres d'une pièce de maison (14 × 11) : pas d'objet, pas devant la porte (colonnes 6-7 en bas), pas sur l'habitant
  function themeHome(m, sp) {
    const T = THEMES[(DW.SPECIES[sp].types || ['Neutre'])[0]] || THEMES.Neutre;
    if (T.floor) m.floor = T.floor;
    if (T.wall) m.wall = T.wall;
    const npc = m.npcs[0], busy = (x, y, w, h) => m.objects.some(o => !o.walk && !o.back && o.x < x + w && o.x + (o.w || 1) > x && o.y < y + h && o.y + (o.h || 1) > y)
      || (x < 8 && x + w > 6 && y + h > 7) || (npc && npc.x >= x - 1 && npc.x <= x + w && npc.y >= y - 1 && npc.y <= y + h);
    const backBusy = x => m.objects.some(o => o.back && o.x < x + 2 && o.x + (o.w || 1) > x);
    for (const [kind, v, back, rug] of T.add) {
      if (back) { for (const x of [1, 4, 9, 11]) if (!backBusy(x)) { m.objects.push({ kind, v, x, y: 1, w: 2, h: 1, back: true, oy: 6 }); break; } continue; }
      const w = rug ? 4 : kind === 'flowerpots' || kind === 'computer' || kind === 'barrels' ? 2 : 1, h = rug ? 2 : 1;
      for (const [x, y] of [[1, 8], [12, 8], [10, 8], [1, 5], [12, 5], [3, 8], [9, 5], [2, 3], [11, 3]]) {
        if (x + w > 13 || y + h > 10 || busy(x, y, w, h)) continue;
        m.objects.push({ kind, v, x, y, w, h, small: w === 1, walk: !!rug });
        break;
      }
    }
  }
  function makeHome(id, seed, name, quarter, back) {
    const kind = LAYOUT_ORDER[Math.floor(Hh(seed, 1, 803) * 4)], v = Math.floor(Hh(seed, 2, 804) * 6);
    const L = LAYOUTS[kind](v), sp = ownerOf(seed), line = lineOf(seed), flavor = lineOf(seed + 17);
    MAPS[id] = {
      name, music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      floor: FLOORS[Math.floor(Hh(seed, 3, 805) * FLOORS.length)], wall: WALLS[Math.floor(Hh(seed, 4, 806) * WALLS.length)],
      rows: roomRows(), objects: L.objs, signs: { ...L.signs },
      npcs: [{ sp, x: L.npc[0], y: L.npc[1] }], owner: sp,   // (sa place : le décor la laisse libre, themeHome)
      populate() { this.npcs = homeNpc(sp, seed, L.npc[0], L.npc[1], line, flavor); if (name === 'Maison') this.name = this.npcs.length ? `Maison de ${nameOf(sp)}` : 'Maison inoccupée'; },
      warps: [{ x: DOOR_X, y: ROOM_H + 3, w: 2, h: 1, dir: 'down', to: quarter, tx: back[0], ty: back[1] }],
      entry: { x: DOOR_X, y: ROOM_H + 2 },
    };
    if (name === 'Maison') MAPS[id].name = `Maison de ${nameOf(sp)}`;
    themeHome(MAPS[id], sp);
    return id;
  }

  // ------------------------------------------------------------ outils communs des quartiers
  // Comme la Ville des Fichiers de Digimon World 1 : chemins de terre qui serpentent, bâtiments posés
  // librement dans l'herbe avec leur jardinet, bosquets, ruisseau et étang naturels.
  // Les plans sont écrits dans un repère 48×34 puis agrandis de Z (bâtiments plus grands, quartiers plus vastes).
  // emplacement : { kind, v, x, y, min } ; chaumières, maisons et immeubles se visitent (porte en bas)
  const z = v => Math.round(v * Z);
  // emprise (en cases) des bâtiments agrandis, et position de la porte sur leur façade
  const FOOT = { cottage: [5, 4], townhouse: [5, 4], apartment: [6, 4], shopfront: [5, 4], marketstall: [4, 2], datatower: [4, 2], bakery: [6, 4], patisserie: [6, 4] };
  const DOOR = { cottage: [2, 1], townhouse: [2, 1], apartment: [2, 2], bakery: [2, 2], patisserie: [2, 2] };
  // boutiques de bouche (porte comme une maison) : un commerçant et son étal
  const FOOD_SHOPS = {
    bakery: { name: 'Boulangerie', sp: 'agumon', shop: 'boulangerie', line: 'Bonjour ! Le pain sort du four, tout chaud !', floor: { type: 'tile', cols: ['#f0e0c0', '#d8c098', '#b89a70'] }, wall: { base: '#f8e8c8', alt: '#e8d4a8', pattern: 'stripes', wood: '#a8703a' },
      objs: [{ kind: 'oven', x: 1, y: 1, w: 3, h: 2, back: true }, { kind: 'counter', v: 0, x: 4, y: 4, w: 4, h: 1 }, { kind: 'sacks', x: 10, y: 4, w: 2, h: 1 }, { kind: 'shelf', x: 9, y: 1, w: 2, h: 1, back: true }, { kind: 'table', x: 9, y: 7, w: 2, h: 1 }, { kind: 'bigplant', x: 12, y: 8, w: 1, h: 1, small: true }] },
    patisserie: { name: 'Pâtisserie', sp: 'palmon', shop: 'patisserie', line: 'Bienvenue ! Nos gâteaux rendent tous les Digimon heureux !', floor: { type: 'carpet', cols: ['#f8d0e0', '#e8b0c8', '#c88aa8'] }, wall: { base: '#fff0f6', alt: '#f8dce8', pattern: 'dots', wood: '#c86a9a' },
      objs: [{ kind: 'counter', v: 2, x: 4, y: 4, w: 4, h: 1 }, { kind: 'fridge', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'table', x: 9, y: 6, w: 2, h: 1 }, { kind: 'stool', x: 8, y: 6, w: 1, h: 1, small: true }, { kind: 'stool', x: 11, y: 6, w: 1, h: 1, small: true }, { kind: 'cushion', v: 1, x: 2, y: 8, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 12, y: 8, w: 1, h: 1, small: true }] },
  };
  function makeFoodShop(id, kind, quarter, back) {
    const F = FOOD_SHOPS[kind], name = nameOf(F.sp);
    MAPS[id] = {
      name: F.name, music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true, floor: F.floor, wall: F.wall,
      rows: roomRows(), objects: F.objs.map(o => ({ ...o })), signs: {},
      npcs: [{ sp: F.sp, x: 6, y: 3, face: 'down', talk: async () => { await say(F.line, name); await DW.Game.push(new DW.ShopScene(F.shop)); } }],
      warps: [{ x: DOOR_X, y: ROOM_H + 3, w: 2, h: 1, dir: 'down', to: quarter, tx: back[0], ty: back[1] }],
      entry: { x: DOOR_X, y: ROOM_H + 2 },
    };
    for (let x = 4; x < 8; x++) MAPS[id].signs[`${x},4`] = MAPS[id].npcs[0].talk;   // on commande par-dessus le comptoir
    return id;
  }
  // ------------------------------------------------------------ niveaux des maisons : grenier, cave, étages
  // les escaliers sont dans le mur du fond, à droite (colonnes 11-12) ; la case d'arrivée est dégagée
  const ATTIC = [{ kind: 'crates', x: 2, y: 4, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 3, y: 4, w: 1, h: 1, small: true }, { kind: 'sacks', x: 2, y: 7, w: 2, h: 1 },
    { kind: 'teddy', x: 8, y: 7, w: 1, h: 1 }, { kind: 'wardrobe', v: 1, x: 5, y: 1, w: 2, h: 2, back: true }];
  const CELLAR = [{ kind: 'crates', x: 2, y: 4, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 2, y: 5, w: 1, h: 1, small: true }, { kind: 'pots', x: 5, y: 4, w: 2, h: 1 },
    { kind: 'sacks', x: 8, y: 7, w: 2, h: 1 }, { kind: 'shelf', x: 4, y: 1, w: 2, h: 1, back: true }];
  // (les meubles retirés pour l'escalier emportent leurs panneaux : sinon on lisait « l'aquarium » ou « la télé » devant
  //  l'escalier, sur une case vide)
  const clearStairs = (id, x) => {
    const m = MAPS[id], gone = m.objects.filter(o => !o.back && !o.walk && o.x < x + 2 && o.x + (o.w || 1) > x && o.y <= 4);
    m.objects = m.objects.filter(o => !gone.includes(o));
    for (const o of gone) for (let yy = o.y; yy < o.y + (o.h || 1); yy++) for (let xx = o.x; xx < o.x + (o.w || 1); xx++) delete m.signs[`${xx},${yy}`];
  };
  function addLevel(home, sub, name, objs, up, opts = {}, hx = 11, ax = 2) {
    const P = DW.Palais, id = `${home}_${sub}`, racine = MAPS[home].racine || home;
    P.room(id, 'village', { name: `${MAPS[racine].name} — ${name}`, w: 14, h: 11, floor: opts.floor, wall: opts.wall, dark: opts.dark, objects: objs.map(o => ({ ...o })) });
    Object.assign(MAPS[id], { racine, populate() { this.name = `${MAPS[racine].name} — ${name}`; } });
    Object.assign(MAPS[id].signs, opts.signs || {});   // (panneaux des meubles : posés avant l'escalier, qui retire les siens)
    clearStairs(home, hx); clearStairs(id, ax);
    P.stairs(home, hx, id, ax, up);
    return id;
  }
  function addFloors(home, kind, seed) {
    const r = Hh(seed, 11, 821);
    const attic = { floor: { type: 'herring', cols: ['#a8845a', '#7a5a3a', '#4a3424'] }, wall: { base: '#c8a880', alt: '#b89870', pattern: 'plain', wood: '#6a4a2a' }, dark: { d: 0.3, col: '#3a2a20' } };
    const cellar = { floor: { type: 'stone', cols: ['#8a8478', '#6a6458', '#4a4438'] }, wall: { base: '#7a7468', alt: '#6a6458', pattern: 'brick', wood: '#3a3428' }, dark: { d: 0.45, col: '#201c18' } };
    if (kind === 'apartment') {
      // immeuble : deux étages d'appartements, chacun avec son habitant
      let below = home;
      for (const n of [1, 2]) {
        const s2 = seed + n * 101, L = LAYOUTS[LAYOUT_ORDER[Math.floor(Hh(s2, 1, 803) * 4)]](Math.floor(Hh(s2, 2, 804) * 6));
        const id = addLevel(below, `e${n}`, `${n}${n === 1 ? 'er' : 'e'} étage`, L.objs, true, { floor: FLOORS[(n + 2) % FLOORS.length], wall: WALLS[(n + 3) % WALLS.length], signs: L.signs });
        const line = lineOf(s2);
        MAPS[id].populate = function () { this.npcs = homeNpc(ownerOf(s2), s2, L.npc[0], L.npc[1], line); };
        below = id;
      }
      return;
    }
    if (kind === 'townhouse' || kind === 'cottage') {
      const top = kind === 'townhouse' ? addLevel(home, 'e1', 'Étage', LAYOUTS.chambre(Math.floor(r * 6)).objs, true) : home;
      const a = addLevel(top, 'grenier', 'Grenier', ATTIC, true, attic);
      DW.Palais.treasure(a, `grenier_${home}`, null, [[r < 0.15 ? 'gland_or' : r < 0.5 ? 'cartes' : 'soin_m', 1]], 10, 7);
      if (r > 0.45) addLevel(home, 'cave', 'Cave', CELLAR, false, cellar, 8, 11);
    }
  }
  function lots(list, quarter, prefix) {
    return list.map((L, i) => {
      const o = { ...L, x: z(L.x), y: z(L.y) };
      [o.w, o.h] = FOOT[o.kind] || [L.w, L.h];
      if (DOOR[o.kind]) {
        const [dx, dw] = DOOR[o.kind];
        o.door = { x: o.x + dx, y: o.y + o.h - 1, w: dw };
        const hid = `${prefix}${i}`, seed = prefix.length * 97 + i * 13 + 5;
        if (FOOD_SHOPS[o.kind]) o.home = makeFoodShop(hid, o.kind, quarter, [o.x + dx, o.y + o.h]);
        else { o.home = makeHome(hid, seed, o.kind === 'apartment' ? 'Immeuble' : 'Maison', quarter, [o.x + dx, o.y + o.h]); addFloors(hid, o.kind, seed); }
      }
      return o;
    });
  }
  // --- tracé naturel (coordonnées du plan d'origine, agrandies ici)
  const segD = (x, y, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
  };
  const polyD = (x, y, pts) => { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, segD(x, y, pts[i], pts[i + 1])); return m; };
  const zp = pts => pts.map(([x, y]) => [x * Z, y * Z]);
  // chemin sinueux (bords irréguliers) ; sur l'eau, il devient un pont
  function trail(g, pts, r, ch = '=', seed = 1) {
    pts = zp(pts); r *= Z * 0.92;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (polyD(x, y, pts) > r + (Hh(x, y, 820 + seed) - 0.5) * 0.7) continue;
      const c = g.get(x, y);
      if (c === '~' || c === 'w' || c === '_') g.set(x, y, '_'); else g.set(x, y, ch);
    }
  }
  function water(g, pts, r) { pts = zp(pts); r *= Z; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (polyD(x, y, pts) <= r + (Hh(x, y, 830) - 0.5) * 0.6) g.set(x, y, '~'); }
  function pond(g, cx, cy, rx, ry) {
    cx *= Z; cy *= Z; rx *= Z; ry *= Z;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (Hh(x, y, 831) - 0.5) * 0.18;
      if (d < 1) g.set(x, y, Hh(x, y, 832) < 0.1 && d < 0.75 ? 'w' : '~');
    }
  }
  const put = (g, x, y, ch) => g.set(z(x), z(y), ch);
  // entrée franche sur un bord (3 cases de large, à la hauteur y du plan)
  const gateRows = (g, side, y) => g.rect(side === 'left' ? 0 : W - 3, z(y), 3, 3, '=');
  // lisière irrégulière : 2 rangées d'arbres, plus quelques arbres en avancée
  function edge(g, seed) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (d <= 1 || (d === 2 && Hh(x, y, 840 + seed) < 0.45)) g.set(x, y, 'T');
    }
  }
  // zones protégées (emprise + jardinet devant + marge) : pas d'arbre ni de rocher ; extra en coordonnées du plan
  const protectedSet = (list, extra = []) => {
    const P = new Set();
    for (const L of list) for (let y = L.y - 1; y < L.y + L.h + 3; y++) for (let x = L.x - 1; x < L.x + L.w + 1; x++) P.add(x + ',' + y);
    for (const [x0, y0, r] of extra) { const x = z(x0), y = z(y0); for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) P.add((x + i) + ',' + (y + j)); }
    return P;
  };
  // bosquets, buissons, fleurs, rochers, souches sur l'herbe libre
  function nature(g, P, seed, dens = 1) {
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (g.get(x, y) !== '.' || P.has(x + ',' + y)) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => '=¢z_'.includes(g.get(x + a, y + b)));
      const r = Hh(x, y, 850 + seed), clump = DW.Art.noise(x * 0.18, y * 0.18, 851 + seed);
      if (!near && clump > 0.7 && r < 0.42 * dens) g.set(x, y, 'T');
      else if (!near && r < 0.03 * dens) g.set(x, y, 'b');
      else if (r < 0.1) g.set(x, y, 'f');
      else if (!near && r < 0.11 * dens) g.set(x, y, Hh(x, y, 852) < 0.5 ? 'r' : 'k');
      else if (!near && clump < 0.25 && r < 0.45) g.set(x, y, ',');
    }
  }
  // massif de fleurs au coin de certains jardins
  function gardens(g, list, seed) {
    for (const L of list) {
      if (L.kind !== 'cottage' || Hh(L.x, L.y, 860 + seed) < 0.4) continue;
      g.set(L.x - 1, L.y + L.h, 'd');
    }
  }
  function district(id, def) {
    MAPS[id] = {
      name: def.name, music: 'village', bg: 'foret', ambient: 'town', theme: def.theme || 'town', climate: 'village', region: 'village',
      ...DW.MapKit.DW1_GROUND,
      build() {
        const lv = level(), built = def.lots.filter(L => lv >= L.min).length;
        const version = `${built}|${(def.exits || []).map(e => (lv >= e.min ? 1 : 0)).join('')}|${DW.Town.level()}`;
        if (this.version === version && this.rows) return;
        this.version = version;
        this.rows = paint(W, H, '.', g => {
          def.paint(g, lv);
          // emprise et devant de chaque emplacement : dégagés (ni arbre, ni buisson, ni rocher)
          for (const L of def.lots) for (let y = L.y; y < L.y + L.h + 1; y++) for (let x = L.x; x < L.x + L.w; x++) if ('Tbrk,'.includes(g.get(x, y))) g.set(x, y, '.');
          // pas d'arbre ni de rocher sous les décors fixes (statue, lampadaires, bancs...) : aucune superposition
          for (const o of def.fixed ? def.fixed(lv) : []) if (!o.top) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) if ('Tbrk,'.includes(g.get(x, y))) g.set(x, y, '.');
        });
        // sorties vers les autres quartiers : chemin ouvert seulement quand le quartier voisin existe
        for (const e of def.exits || []) if (lv < e.min) this.rows = this.rows.map((r, y) => y >= e.y0 && y <= e.y1 ? r.slice(0, e.x0) + 'T'.repeat(e.x1 - e.x0 + 1) + r.slice(e.x1 + 1) : r);
        // pas de promeneur « derrière » un toit : l'herbe couverte par le haut des bâtiments devient infranchissable
        const g = this.rows.map(r => [...r]), fronts = new Set();
        for (const L of def.lots) for (let x = L.x; x < L.x + L.w; x++) fronts.add(x + ',' + (L.y + L.h));
        for (const L of def.lots) if (lv >= L.min) {
          const above = Math.ceil((DW.World.obj(L.kind, L.v || 0).h - L.h * 16) / 16);
          for (let y = L.y - above; y < L.y; y++) for (let x = L.x; x < L.x + L.w; x++) if (g[y] && '.f,'.includes(g[y][x]) && !fronts.has(x + ',' + y)) g[y][x] = 'ŧ';
        }
        this.rows = g.map(r => r.join(''));
        // promeneurs : sur les chemins, espacés
        this.walkSpots = [];
        for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++)
          if ('=¢'.includes(this.rows[y][x]) && Hh(x, y, def.seed) < 0.08 && !this.walkSpots.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 7)) this.walkSpots.push([x, y]);
        this.objects = [...(def.fixed ? def.fixed(lv) : [])];
        this.doors = [];
        for (const L of def.lots) {
          if (lv < L.min) continue;
          this.objects.push({ kind: L.kind, v: L.v || 0, x: L.x, y: L.y, w: L.w, h: L.h });
          if (L.door) this.doors.push({ ...L.door, dir: 'up', to: L.home, tx: DOOR_X, ty: ROOM_H + 2 });
          // façade : jardinière à gauche, boîte aux lettres (couleur de l'habitant, lanterne le soir) à droite
          if (L.door && L.home && !FOOD_SHOPS[L.kind]) {
            const fy = L.y + L.h, dx0 = L.door.x, dx1 = L.door.x + L.door.w - 1, res = (MAPS[L.home] || {}).owner;
            const t0 = res ? (DW.SPECIES[res].types || ['Neutre'])[0] : 'Neutre';
            const v = { 'Feu': 0, 'Eau': 1, 'Plante': 2, 'Insecte': 2, 'Électrique': 3, 'Glace': 4, 'Air': 4, 'Ténèbres': 5 }[t0] ?? 6;
            const free = x => x < dx0 - 1 || x > dx1 + 1;
            if (free(L.x + L.w - 1) && '.f,'.includes(this.rows[fy][L.x + L.w - 1])) this.objects.push({ kind: 'housebox', v, x: L.x + L.w - 1, y: fy, w: 1, h: 1, small: true });
            if (free(L.x) && L.w >= 3 && '.f,'.includes(this.rows[fy][L.x])) this.objects.push({ kind: 'planter', v: (L.x + L.y) % 3, x: L.x, y: fy, w: 1, h: 1, small: true });
          }
        }
        this.signs = { ...(def.signs ? def.signs(lv) : {}) };
        if (DW.Story.placeKiosks) DW.Story.placeKiosks(this, id);   // stands des recrues (story.js)
        DW.World.unprepare(this); delete this.w;
      },
      populate() {
        // habitants qui se promènent : plus la ville grandit, plus il y a de monde
        const lv = level(), S = this.walkSpots || [], n = Math.max(0, Math.min(S.length, 12, Math.floor((lv - def.open) / 2) + 1));
        this.npcs = S.slice(0, n).map(([x, y], i) => {
          const sp = citizenOf(def.seed + i * 31), line = lineOf(def.seed + i * 29);
          return sp && { sp, x, y, face: i % 2 ? 'left' : 'right', wander: 2, citizen: true, talk: () => say(line, nameOf(sp)) };
        }).filter(Boolean);
      },
      rows: null, objects: [], npcs: [], doors: [], signs: {}, warps: def.warps,
    };
    def.lots = lots(def.lots, id, def.prefix);
  }
  // les maisons se construisent une à une entre l'ouverture du quartier et le palier maximum (16) : toutes existent à 100 %
  const progressive = (list, open, step) => list.map((L, i) => ({ ...L, min: Math.min(16, open + Math.floor(i * Math.min(step, (16 - open) / Math.max(1, list.length - 1)))) }));
  const C = (x, y, v) => ({ kind: 'cottage', v, x, y });
  const EXIT_Y = z(14);   // rangées des passages est / ouest entre quartiers

  // ============================================================ QUARTIER RÉSIDENTIEL (nord de la ville) : hameau de chaumières
  // ouverture (paliers sur 16) : le Résidentiel avec la route du nord de la ville (niveau 3 de la ville : maps/village.js),
  // le Marché au niveau 6, le Numérique au niveau 10
  const OPEN = { residentiel: 4, marche: 8, numerique: 14 };
  {
    const list = [C(26, 5, 0), C(15, 4, 1), C(10, 11, 2), C(16, 11, 3), C(27, 10, 1), C(4, 4, 3), C(9, 18, 0), C(3, 19, 1), C(16, 20, 2),
      C(26, 19, 3), C(5, 25, 2), C(12, 26, 0), C(18, 27, 1), C(28, 27, 0), C(35, 28, 2), C(41, 9, 0), C(39, 2, 3)];
    district('residentiel', {
      name: 'Quartier Résidentiel', prefix: 'maison_r', open: OPEN.residentiel, seed: 11,
      lots: progressive(list, OPEN.residentiel, 1.9),
      exits: [{ min: OPEN.numerique, x0: 0, x1: 2, y0: EXIT_Y, y1: EXIT_Y + 2 }, { min: OPEN.marche, x0: W - 3, x1: W - 1, y0: EXIT_Y, y1: EXIT_Y + 2 }],
      paint(g, lv) {
        edge(g, 1);
        // ruisseau qui descend du nord vers l'étang, puis repart vers le sud-est
        water(g, [[38, -1], [36, 5], [33, 11], [34, 17]], 0.9);
        pond(g, 36, 21, 4.6, 2.9);
        water(g, [[39, 23], [42, 27], [45, 31], [48, 33]], 0.8);
        // chemins de terre (ponts automatiques sur le ruisseau)
        trail(g, [[23.5, 34], [23.5, 29], [22, 23], [23, 16], [24, 10], [22, 4]], 1.3, '=', 1);
        trail(g, [[22.5, 16], [14, 15.5], [6, 16.5], [-1, 15]], 1.05, '=', 2);
        gateRows(g, 'left', 14); gateRows(g, 'right', 14);
        trail(g, [[23, 16], [32, 14.5], [40, 15.5], [48, 15]], 1.05, '=', 3);
        trail(g, [[24, 10], [15, 8], [9, 9.5], [7, 15]], 0.85, '=', 4);
        trail(g, [[22.5, 23], [30, 25.5], [38, 26], [42, 21], [42, 13]], 0.85, '=', 5);
        trail(g, [[23.5, 30], [23.5, 34]], 1.1, '=', 6);
        // nature, jardins, petits aménagements
        nature(g, protectedSet(this.lots, [[23, 16, 2], [33, 16, 1]]), 1);
        gardens(g, this.lots.filter(L => lv >= L.min), 1);   // seulement devant les maisons déjà construites
        // place d'entrée : clairière dégagée derrière le portail, chemin élargi
        for (let y = H - 10; y < H - 1; y++) for (let x = z(23.5) - 8; x <= z(23.5) + 7; x++) if ('Tbrk,'.includes(g.get(x, y))) g.set(x, y, Hh(x, y, 77) < 0.25 ? 'f' : '.');
        g.rect(z(23.5) - 2, H - 10, 4, 10, '=');
        put(g, 21, 31, 'S'); put(g, 25, 18, 'e');
        for (const [x, y] of [[21, 9], [26, 22], [20, 17]]) if (g.get(z(x), z(y)) === '.' || g.get(z(x), z(y)) === 'f') put(g, x, y, 'i');
      },
      fixed: () => [
        { kind: 'districtgate', v: 0, x: z(23.5) - 3, y: H - 3, w: 6, h: 3, top: true },
        // accueil : lampadaires de part et d'autre du chemin, massifs fleuris, banc
        { kind: 'lamp', v: 0, x: z(23.5) - 4, y: H - 4, w: 1, h: 1, small: true }, { kind: 'lamp', v: 0, x: z(23.5) + 3, y: H - 4, w: 1, h: 1, small: true },
        { kind: 'flowerbed', v: 0, x: z(23.5) - 6, y: H - 5, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 1, x: z(23.5) + 5, y: H - 5, w: 1, h: 1, small: true },
        { kind: 'flowerbed', v: 2, x: z(23.5) - 5, y: H - 8, w: 1, h: 1, small: true }, { kind: 'bench', v: 0, x: z(23.5) + 4, y: H - 8, w: 2, h: 1 },
        { kind: 'digistatue', v: 0, x: z(20), y: z(13), w: 3, h: 1 },
      ],
      signs: () => ({ [`${z(21)},${z(31)}`]: `Quartier Résidentiel — ${DW.Town.RECRUITS.filter(r => DW.Town.has(r.id)).length} habitants en ville. Est : Quartier du Marché. Ouest : Quartier Numérique.` }),
      warps: [{ x: z(23.5) - 1, y: H - 1, w: 2, h: 1, dir: 'down', to: 'village', tx: 11, ty: 0 },
        { x: 0, y: EXIT_Y, w: 1, h: 3, dir: 'left', to: 'numerique', tx: W - 1, ty: EXIT_Y },
        { x: W - 1, y: EXIT_Y, w: 1, h: 3, dir: 'right', to: 'marche', tx: 0, ty: EXIT_Y }],
    });
  }

  // ============================================================ QUARTIER DU MARCHÉ (est du Résidentiel) : place de terre battue
  {
    const S = (kind, v, x, y) => ({ kind, v, x, y });
    const list = [
      S('marketstall', 0, 14, 11), S('marketstall', 1, 31, 10), S('bakery', 0, 6, 3), S('patisserie', 0, 29, 3),
      S('marketstall', 2, 13, 19), S('marketstall', 0, 32, 20), C(2, 25, 1), S('shopfront', 1, 13, 4), C(36, 26, 3),
      S('marketstall', 1, 20, 22), S('shopfront', 3, 36, 4), C(11, 25, 0), S('marketstall', 2, 26, 8), C(29, 27, 2), C(42, 12, 1), C(17, 26, 3),
    ];
    const tower = { x: z(22), y: z(14), w: 4, h: 2 };
    const clock = () => say(`L'horloge de la tour indique ${DW.Time.str()}. Dong... dong...`);
    district('marche', {
      name: 'Quartier du Marché', prefix: 'maison_m', open: OPEN.marche, seed: 23,
      lots: progressive(list, OPEN.marche, 1.9),
      paint(g) {
        edge(g, 2);
        // grande place de terre battue, bords irréguliers
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot((x / Z - 23.5) / 12.5, (y / Z - 16) / 7.2) + (Hh(x, y, 870) - 0.5) * 0.15 < 1) g.set(x, y, '=');
        trail(g, [[-1, 15], [6, 15.5], [12, 15]], 1.1, '=', 7);
        gateRows(g, 'left', 14);
        trail(g, [[23.5, 9], [22, 6], [17, 7.5], [10, 7], [6, 8]], 0.9, '=', 8);
        trail(g, [[23.5, 9], [27, 6.5], [33, 7.5], [39, 8]], 0.9, '=', 9);
        trail(g, [[23.5, 23], [22, 27], [24, 31]], 0.95, '=', 10);
        trail(g, [[12, 22], [8, 24.5], [8, 29], [16, 30.5], [32, 31], [40, 30]], 0.85, '=', 11);
        pond(g, 41, 20, 2.6, 1.8);
        nature(g, protectedSet(this.lots, [[23, 15, 3]]), 2, 0.9);
        put(g, 4, 13, 'S');
      },
      fixed: () => [{ kind: 'clocktower', ...tower }, { kind: 'digistatue', v: 1, x: z(17), y: z(17), w: 3, h: 1 }, { kind: 'well', x: z(29), y: z(17), w: 1, h: 1, small: true }],
      signs: () => {
        const s = { [`${z(4)},${z(13)}`]: 'Quartier du Marché — Étals, boutiques et la grande tour de l\'horloge.  Ouest : Quartier Résidentiel.' };
        for (let x = tower.x; x < tower.x + tower.w; x++) s[`${x},${tower.y + tower.h - 1}`] = clock;
        return s;
      },
      warps: [{ x: 0, y: EXIT_Y, w: 1, h: 3, dir: 'left', to: 'residentiel', tx: W - 1, ty: EXIT_Y }],
    });
  }

  // ============================================================ QUARTIER NUMÉRIQUE (ouest du Résidentiel) : tours de données dans la nature
  {
    const T = (v, x, y) => ({ kind: 'datatower', v, x, y }), A = (x, y) => ({ kind: 'apartment', v: 1, x, y });
    const list = [T(0, 9, 5), C(14, 3, 2), T(1, 31, 6), C(4, 10, 0), A(36, 9), T(0, 7, 21), C(29, 19, 1), T(1, 34, 20), C(13, 25, 3), A(3, 26),
      T(0, 18, 19), C(30, 26, 2), C(38, 27, 0), T(1, 22, 3)];
    district('numerique', {
      name: 'Quartier Numérique', prefix: 'maison_n', open: OPEN.numerique, seed: 37,
      lots: progressive(list, OPEN.numerique, 1.9),
      paint(g) {
        edge(g, 3);
        // chemins de terre qui serpentent entre les tours et les arbres
        trail(g, [[48, 15], [38, 15.5], [26, 16.5], [14, 15.5], [4, 17]], 1.15, '=', 12);
        gateRows(g, 'right', 14);
        trail(g, [[25, 16], [24, 10], [19, 6.5], [12, 8.5]], 0.9, '=', 13);
        trail(g, [[25, 16], [27, 23], [22, 29], [12, 30]], 0.9, '=', 14);
        trail(g, [[38, 15.5], [40, 23], [34, 30]], 0.85, '=', 15);
        // bassin de refroidissement
        pond(g, 30, 11, 3, 1.9);
        nature(g, protectedSet(this.lots, [[25, 16, 2]]), 3, 0.8);
        // décor numérique : antennes, panneaux de circuit, tuyaux, monolithes
        for (const [x, y, ch] of [[20, 13, '!'], [33, 13, '?'], [15, 19, '$'], [35, 18, '$'], [23, 20, '<'], [29, 14, '<'], [6, 14, '!'], [43, 19, '?']])
          if ('.f,'.includes(g.get(z(x), z(y)))) put(g, x, y, ch);
        g.set(W - 5, EXIT_Y - 1, 'S');
      },
      fixed: () => [[11, 14], [40, 13]].map(([x, y]) => ({ kind: 'cablepole', x: z(x), y: z(y), w: 1, h: 1, small: true })),
      signs: () => ({ [`${W - 5},${EXIT_Y - 1}`]: 'Quartier Numérique — Les tours de données relient la ville au réseau de l\'île.  Est : Quartier Résidentiel.' }),
      warps: [{ x: W - 1, y: EXIT_Y, w: 1, h: 3, dir: 'right', to: 'residentiel', tx: 0, ty: EXIT_Y }],
    });
  }

  // ------------------------------------------------------------ API
  DW.Quartiers = {
    OPEN,
    open: id => level() >= (OPEN[id] || 0),
  };
})();
