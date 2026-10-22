'use strict';
// =====================================================================
//  VILLAGE DES BÉBÉS — à l'est de la Prairie des Lucioles
//  (le Village Primaire de la saison 1). Penguinmon y veille sur les bébés.
//  Services de Penguinmon : un DigiŒuf par jour (on le fait éclore en le frottant),
//  RENAISSANCE d'un Digimon (il redevient le bébé de sa lignée en gardant ses
//  techniques, la moitié de son entraînement et des données innées renforcées), repos.
// =====================================================================
(function () {
  const { say, st, paint, healAll } = DW.MapKit;
  const Game = DW.Game;

  // ------------------------------------------------------------ plan (44 × 32)
  // Village Primaire de la saison 1 : clairière pastel entourée d'arbres-bonbons et d'une lisière de
  // nuages roses. Place ronde à mosaïque au centre, nurserie (berceaux) au nord-ouest, aire de jeux
  // (manège, nounours, chevaux à bascule) au nord-est, mare aux nénuphars au sud-est, maisonnettes
  // en coquille d'œuf, coussin-nid des DigiŒufs au sud, arche arc-en-ciel à la sortie nord.
  // Entrées inchangées : ouest (lignes 11-13, depuis la Prairie) et nord (colonnes 23-25, vers le Bois Brumeux).
  const W = 44, H = 32, Hh = DW.Art.hash;
  const EGG_X = i => 17 + i * 2, EGG_Y = 23;
  const rows = paint(W, H, '#', g => {
    // clairière aux bords arrondis (rectangle « bombé » + léger bruit)
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const dx = (x - 21.5) / 20.6, dy = (y - 15.5) / 14.6, n = (Hh(x, y, 401) - 0.5) * 0.12;
      if (dx ** 4 + dy ** 4 < 1 + n) g.set(x, y, 'v');
    }
    g.rect(0, 10, 3, 5, 'v'); g.rect(22, 0, 5, 3, 'v');
    // arbres-bonbons en bordure (avec des trouées sur la lisière de nuages)
    const edge = (x, y) => g.get(x, y) === 'v' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g.get(x + a, y + b) === '#');
    const ring = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (edge(x, y)) ring.push([x, y]);
    for (const [x, y] of ring) if (Hh(x, y, 402) < 0.62) g.set(x, y, 'h');
    // allées de sable clair (bords arrondis) : entrée ouest, sortie nord, vers le nid, la mare, l'aire de jeux et la nurserie
    g.rect(0, 11, 16, 3, 's'); g.rect(23, 0, 3, 11, 's');
    g.rect(21, 20, 3, 3, 's'); g.rect(27, 18, 5, 2, 's'); g.rect(28, 13, 5, 2, 's'); g.rect(32, 10, 2, 4, 's');
    g.rect(9, 9, 2, 2, 's'); g.rect(4, 7, 9, 1, 's');
    // bac à sable (sud-ouest)
    for (let y = 25; y < 30; y++) for (let x = 15; x < 22; x++) if (Math.hypot((x - 18) / 3.2, (y - 27.2) / 2.1) < 1) g.set(x, y, 's');
    // bosquets d'arbres-bonbons à l'intérieur du village
    for (const [x, y] of [[12, 15], [13, 16], [12, 17], [27, 27], [28, 28], [36, 18], [37, 17], [27, 3], [14, 20]]) if (g.get(x, y) === 'v') g.set(x, y, 'h');
    // pieds de l'arche arc-en-ciel (on passe dessous par l'allée)
    for (const [x, y] of [[22, 1], [22, 2], [26, 1], [26, 2]]) g.set(x, y, 'x');
    // nurserie : deux rangées de berceaux
    for (const x of [5, 7, 9, 11]) { g.set(x, 5, 'c'); g.set(x, 9, 'c'); }
    // mare des Pichimon (sud-est), avec nénuphars
    for (let y = 18; y < 29; y++) for (let x = 27; x < 42; x++) {
      const d = Math.hypot((x - 34) / 5.6, (y - 23.4) / 3.3);
      if (d < 1) g.set(x, y, Hh(x, y, 403) < 0.12 && d < 0.8 ? 'w' : '~');
    }
    // cubes-jouets éparpillés
    for (const [x, y] of [[14, 4], [27, 7], [12, 27], [38, 15], [16, 17], [29, 29]]) if (g.get(x, y) === 'v') g.set(x, y, 'B');
    // prairies d'herbes pastel et fleurs
    g.scatter(':', 2, 24, 12, 6, 34, 12, ['v']);
    g.scatter(':', 30, 16, 10, 2, 10, 13, ['v']);
    g.scatter(':', 13, 2, 8, 3, 10, 14, ['v']);
    g.scatter('q', 2, 2, 40, 28, 70, 11, ['v']);
    // panneau d'entrée
    g.set(3, 10, 'Q');
  });

  // ------------------------------------------------------------ services de Penguinmon
  async function eggService() {
    const s = st(), day = DW.Time.day();
    if (s.flags.eggDay === day) { await say("Tu as déjà pris un DigiŒuf aujourd'hui. Les autres ont besoin de couver encore un peu... Reviens demain !", 'Penguinmon'); return; }
    await say('Choisis un DigiŒuf. Chacun cache un bébé différent... Observe bien les motifs !', 'Penguinmon');
    const sp = await Game.push(new DW.EggScene());
    if (!sp) { await say("Prends ton temps. Les œufs ne s'envolent pas !", 'Penguinmon'); return; }
    s.flags.eggDay = day;
    await Game.push(new DW.HatchScene(sp));
    const m = new DW.Digimon(sp, 3); m.happy = 60;
    const where = DW.addDigimon(m);
    await say(where === 'box' ? `${m.name} a été envoyé à la DigiFerme : ton équipe est complète.` : `${m.name} rejoint ton équipe !`);
    await say('Prends bien soin de lui. Les bébés grandissent vite : deux victoires, et hop, ils digivoluent !', 'Penguinmon');
    DW.autosave();
  }
  async function rebirthService() {
    const s = st();
    await say("La renaissance... Ton Digimon redevient un œuf, puis un bébé. C'est le cycle de la vie des Digimon.", 'Penguinmon');
    await say("Il garde ses techniques, ses victoires et la moitié de son entraînement. Et ses données innées se renforcent à chaque renaissance !", 'Penguinmon');
    const idx = await Game.push(new DW.PartyScene({ mode: 'select', title: 'RENAISSANCE' }));
    if (idx == null || idx < 0) return;
    const m = s.party[idx], sp = DW.Life.babyOf(m);   // (le bébé qu'il a été : Greymon → Agumon → Koromon → Botamon)
    if (sp === m.sp) { await say(`${m.name} est déjà un bébé !`, 'Penguinmon'); return; }
    const r = await DW.ask(`${m.name} redeviendra un ${DW.SPECIES[sp].name}. D'accord ?`);
    if (r !== 0) { await say('Comme tu veux. Rien ne presse.', 'Penguinmon'); return; }
    await DW.fade(1, 0.5, '#ffffff');
    await DW.wait(0.3);
    const nm = DW.Life.reborn(m);
    DW.fade(0, 0.4);
    await Game.push(new DW.HatchScene(sp));
    s.party[idx] = nm; s.seen[sp] = s.owned[sp] = true;
    await say(`${m.name} est revenu au monde en ${DW.SPECIES[sp].name} ! Ses données innées se sont renforcées.`);
    DW.autosave();
  }
  async function penguinmonTalk() {
    const s = st();
    if (!s.flags.berceau) {
      s.flags.berceau = true;
      await say("Bienvenue au Village des Bébés ! Je suis Penguinmon, le gardien de cet endroit.", 'Penguinmon');
      await say("Ici, les Digimon naissent dans des DigiŒufs. Quand un Digimon disparaît, ses données reviennent aussi ici, sous forme d'œuf.", 'Penguinmon');
      await say("Tant que tu les traites bien, je te confierai un œuf par jour. Et si l'un de tes Digimon veut repartir de zéro, je peux l'aider à renaître.", 'Penguinmon');
      // (première visite : la carte de Botamon, le bébé des berceaux, pour l'album du chapitre 1 — si tu ne l'as pas déjà)
      if (DW.Cards && DW.Cards.give('botamon')) await say('Penguinmon te donne une carte de Botamon, le bébé qui dort dans les berceaux, pour ton album ! (Album)');
    }
    const r = await DW.choose(['Prendre un DigiŒuf', 'Faire renaître un Digimon', 'Se reposer', 'Au revoir']);
    if (r === 0) await eggService();
    else if (r === 1) await rebirthService();
    else if (r === 2) { await healAll("Les bébés chantent une berceuse... Ton équipe s'endort paisiblement."); await say('Ton équipe est en pleine forme !'); }
    else await say("Reviens quand tu veux. Les bébés t'aiment bien !", 'Penguinmon');
  }

  // Penguinmon veille dehors de 6 h à 20 h ; le soir et la nuit, il est dans sa maison (même service)
  const dehors = () => { const h = DW.Time.hour(); return h >= 6 && h < 20; };
  // petits habitants (ils se promènent et donnent des conseils)
  const baby = (sp, x, y, lines, w = 2) => ({ sp, x, y, face: 'right', wander: w, talk: async () => { for (const l of lines) await say(l, DW.SPECIES[sp].name); } });

  DW.MAPS.berceau = {
    name: 'Village des Bébés', music: 'village', bg: 'village', ambient: 'town', climate: 'forest', region: 'foret', theme: 'nursery',
    textures: 'bebe',   // (maisonnettes, manège, jouets, berceaux, lanternes : les images de la planche VILLAGE BEBE du joueur, gfx/textures.js)
    rows,
    // place ronde (pavés pastel) avec une rosace en mosaïque au centre
    plazas: [{ x: 22 * 16 + 8, y: 15 * 16 + 8, rx: 104, ry: 78, t: 'stone' }],
    mosaic: [{ x: 22 * 16 + 8, y: 15 * 16 + 8, r: 44 }],
    objects: [
      { kind: 'rainbowarch', x: 22, y: 0, w: 5, h: 3, top: true },
      { kind: 'house', x: 17, y: 4, w: 4, h: 3 },
      { kind: 'bigbottle', x: 22, y: 15, w: 1, h: 1, small: true },
      // nurserie
      { kind: 'starmobile', x: 8, y: 6, w: 1, h: 1, small: true },
      { kind: 'flowerbed', v: 0, x: 4, y: 3, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 1, x: 12, y: 3, w: 1, h: 1, small: true },
      // entrée ouest : piles de cubes ABC de part et d'autre de l'allée
      { kind: 'blockstack', v: 0, x: 4, y: 9, w: 2, h: 1 }, { kind: 'blockstack', v: 1, x: 4, y: 15, w: 2, h: 1 },
      // aire de jeux
      { kind: 'carousel', x: 33, y: 4, w: 5, h: 3 },
      { kind: 'rockinghorse', v: 0, x: 29, y: 9, w: 2, h: 1 }, { kind: 'rockinghorse', v: 1, x: 38, y: 9, w: 2, h: 1 },
      { kind: 'teddy', v: 0, x: 36, y: 11, w: 2, h: 1 }, { kind: 'jackbox', x: 30, y: 4, w: 1, h: 1, small: true },
      { kind: 'blockstack', v: 1, x: 39, y: 5, w: 2, h: 1 },
      { kind: 'toyball', v: 0, x: 27, y: 11, w: 1, h: 1, small: true }, { kind: 'toyball', v: 2, x: 35, y: 16, w: 1, h: 1, small: true },
      { kind: 'toytrain', x: 6, y: 18, w: 4, h: 1 },
      // maisonnettes en coquille d'œuf
      { kind: 'eggcottage', v: 0, x: 2, y: 19, w: 3, h: 2 }, { kind: 'eggcottage', v: 1, x: 11, y: 23, w: 3, h: 2 },
      { kind: 'eggcottage', v: 2, x: 38, y: 13, w: 3, h: 2 },
      // autour de la mare
      { kind: 'giantflower', v: 0, x: 27, y: 25, w: 1, h: 1, small: true }, { kind: 'giantflower', v: 2, x: 41, y: 20, w: 1, h: 1, small: true },
      { kind: 'giantshroom', v: 1, x: 40, y: 27, w: 1, h: 1, small: true },
      { kind: 'sandcastle', x: 18, y: 27, w: 1, h: 1, small: true },
      // les toilettes du village (près de l'entrée ouest, hors de l'ombre des arbres)
      { kind: 'toilet', v: 0, x: 5, y: 14, w: 2, h: 2 },
      // lanternes (allumées la nuit) et massifs de fleurs
      { kind: 'stonelantern', x: 22, y: 7, w: 1, h: 1, small: true }, { kind: 'stonelantern', x: 26, y: 7, w: 1, h: 1, small: true },
      { kind: 'stonelantern', x: 8, y: 10, w: 1, h: 1, small: true }, { kind: 'stonelantern', x: 16, y: 21, w: 1, h: 1, small: true },
      { kind: 'stonelantern', x: 31, y: 17, w: 1, h: 1, small: true },
      { kind: 'flowerbed', v: 2, x: 16, y: 6, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 0, x: 21, y: 6, w: 1, h: 1, small: true },
      { kind: 'flowerbed', v: 1, x: 5, y: 21, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 2, x: 14, y: 25, w: 1, h: 1, small: true },
      { kind: 'flowerbed', v: 0, x: 41, y: 15, w: 1, h: 1, small: true },
      { kind: 'toyball', v: 1, x: 15, y: 13, w: 1, h: 1, small: true },
      // le nid des DigiŒufs (on marche sur le coussin)
      { kind: 'eggnest', x: 16, y: 22, w: 11, h: 3, walk: true },
      ...DW.EGG_ORDER.map((sp, i) => ({ kind: 'digitama', v: i, x: EGG_X(i), y: EGG_Y, w: 1, h: 1, small: true })),
    ],
    warps: [{ x: 0, y: 11, w: 1, h: 3, dir: 'left', to: 'prairie', tx: 39, ty: 12 }],
    npcs: [
      { sp: 'penguinmon', x: 20, y: 8, face: 'right', cond: () => dehors(), talk: penguinmonTalk },   // (la nuit, il est chez lui)
      baby('botamon', 7, 11, ['Bo-bo... Je fais la sieste dans les berceaux tous les après-midi !', "Penguinmon dit que les œufs zébrés de bleu deviennent des Botamon. Comme moi !"]),
      baby('punimon', 30, 13, ['Puni ! Puni ! On joue à chat ? Le manège tourne toute la journée !', 'Les Punimon deviennent des Tsunomon, puis des Gabumon... ou des Elecmon ! Penguinmon dit que chacun choisit son chemin.']),
      baby('yuramon', 9, 21, ["Fuu... Le vent m'a encore emporté jusqu'ici...", "Un jour, je deviendrai Tanemon, puis Palmon. J'aurai une jolie fleur !"]),
      baby('nyokimon', 20, 27, ['Nyoki ! Ma fleur s\'ouvre quand je suis content !', 'Si tu frottes un œuf, il éclot plus vite. Les bébés adorent les câlins !']),
      baby('pichimon', 26, 21, ['Pichi ! Viens nager dans la mare !', "Un Digimon qui renaît garde ses techniques. Penguinmon l'a dit !"], 1),
    ],
    signs: {
      '3,10': 'VILLAGE DES BÉBÉS — Ici naissent les Digimon. Merci de marcher doucement !',
      ...Object.fromEntries(DW.EGG_ORDER.map((sp, i) => [`${EGG_X(i)},${EGG_Y}`, async () => {
        await say(DW.EGGS[sp].hint);
        await say("(Pour prendre un œuf, parle à Penguinmon.)");
      }])),
      '5,5': 'Un petit berceau tout doux. Un bébé Digimon y dort à poings fermés.', '7,5': 'Un berceau vide... On dirait qu\'il attend quelqu\'un.',
      '33,6': 'Le manège des bébés ! Il tourne en musique toute la journée.', '22,15': 'Un biberon géant, symbole du Village des Bébés. Il sent bon le lait chaud.',
    },
  };
  // cases sous les décors : pelouse (ni arbre ni canopée dessous)
  {
    const M = DW.MAPS.berceau, g = M.rows.map(r => [...r]);
    for (const o of M.objects) if (!o.walk && !o.top) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (g[y] && '#h:qB'.includes(g[y][x])) g[y][x] = 'v';
    M.rows = g.map(r => r.join(''));
  }
  DW.MapKit.zoomMap(DW.MAPS.berceau, 'berceau');   // plan agrandi ×2 (maps/common.js)

  // ------------------------------------------------------------ LA MAISON DU GARDIEN (Penguinmon) : on y entre par sa porte
  // (sa maison-champignon : l'image du joueur, gfx/textures.js) ; dedans, une nurserie douillette
  const B = n => 'tex_bebe_' + n;   // (images de la planche VILLAGE BEBE du joueur)
  {
    const M = DW.MAPS.berceau, mais = M.objects.find(o => o.kind === 'house'), px = mais.x + 1, py = mais.y + mais.h - 1;
    const P = DW.MapKit.doorRoom(16, 9), D = P.door;
    M.doors = [...(M.doors || []), { x: px, y: py, w: 2, dir: 'up', to: 'berceau_maison', tx: D, ty: P.rows.length - 2 }];
    M.signs[`${mais.x},${py}`] = M.signs[`${mais.x + 3},${py}`] = 'La maison de Penguinmon, le gardien du village. Une odeur de lait chaud et de gâteau s\'échappe de la porte.';
    DW.MAPS.berceau_maison = {
      name: 'Maison de Penguinmon', music: 'village', bg: 'village', ambient: 'home', climate: 'village', region: 'foret', indoor: true, textures: 'bebe',
      floor: { type: 'herring', cols: ['#dcb48a', '#b48a62', '#7a5a3a'] }, wall: { base: '#fbe4ec', alt: '#f2c6d6', pattern: 'dots', wood: '#a87a52' },
      rows: P.rows, npcs: [], signs: {}, doors: [],
      warps: [{ x: D, y: P.rows.length - 1, w: 2, h: 1, dir: 'down', to: 'berceau', tx: px, ty: py + 1, _zt: true }],   // (px, py : déjà sur la carte agrandie)
      entry: { x: D, y: P.rows.length - 2 },
      objects: [
        // le mur du fond : fenêtres, étagères à biberons, armoire à pharmacie, étagère à jouets, garde-manger, lampe-fleur
        { kind: 'window', v: 0, x: 4, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 10, y: 1, w: 2, h: 2, back: true, oy: -6 },
        { kind: B('etagere_biberons'), x: 1, y: 3, w: 2, h: 1 }, { kind: B('armoire_soins'), x: 3, y: 3, w: 1, h: 1 }, { kind: B('etagere_jouets'), x: 7, y: 3, w: 2, h: 1 },
        { kind: B('garde_manger'), x: 12, y: 3, w: 1, h: 1 }, { kind: B('lampe_fleur'), x: 14, y: 3, w: 1, h: 1 },
        // le coin des bébés : berceau, lit à barreaux et son mobile, couveuse des œufs fragiles, table à langer, chaise haute
        { kind: B('berceau'), x: 1, y: 6, w: 1, h: 1 }, { kind: B('lit_barreaux'), x: 1, y: 9, w: 2, h: 1 }, { kind: B('mobile'), x: 3, y: 6, w: 1, h: 1 },
        { kind: B('couveuse'), x: 4, y: 10, w: 1, h: 1 }, { kind: B('table_langer'), x: 5, y: 3, w: 1, h: 1 }, { kind: B('chaise_haute'), x: 3, y: 10, w: 1, h: 1 },
        // le salon : tapis, table ronde et tabourets-fleurs, coussins, panier de linge, jouets
        { kind: 'bigrug', x: 6, y: 6, w: 4, h: 3, walk: true }, { kind: B('table'), x: 7, y: 7, w: 2, h: 1 },
        { kind: B('tabouret'), x: 6, y: 7, w: 1, h: 1 }, { kind: B('tabouret'), x: 9, y: 7, w: 1, h: 1 },
        { kind: B('coussins'), x: 7, y: 9, w: 2, h: 1 }, { kind: B('panier_linge'), x: 10, y: 10, w: 1, h: 1 }, { kind: B('peluche'), x: 6, y: 10, w: 1, h: 1 },
        { kind: B('cubes'), x: 11, y: 8, w: 1, h: 1 }, { kind: B('xylophone'), x: 9, y: 10, w: 1, h: 1 },
        // le coin de Penguinmon : son lit-cocon, son coffre, ses gamelles, une plante
        { kind: B('lit_cocon'), x: 13, y: 6, w: 2, h: 1 }, { kind: B('coffre'), x: 14, y: 8, w: 1, h: 1 }, { kind: B('gamelles'), x: 13, y: 10, w: 1, h: 1 },
        { kind: 'plant', v: 0, x: 14, y: 10, w: 1, h: 1, small: true },
      ],
    };
    const IN = DW.MAPS.berceau_maison;
    IN.npcs.push({ sp: 'penguinmon', x: 11, y: 6, face: 'down', cond: () => !dehors(), talk: penguinmonTalk },
      baby('botamon', 2, 7, ['Bo... (Botamon dort à poings fermés dans le berceau.)', 'Bo-bo... (Il sourit en dormant.)'], 0),
      baby('pabumon', 12, 9, ['Pabu ! Penguinmon fait les meilleurs biberons du monde !', "La nuit, Penguinmon nous raconte des histoires d'Engrenages et de Digimon géants..."], 1));
    // (un meuble de deux cases : le même texte sur les deux)
    const texte = (cases, t) => cases.forEach(k => (IN.signs[k] = t));
    texte(['4,10'], "Une couveuse tiède. Les DigiŒufs les plus fragiles finissent d'y mûrir, bien au chaud.");
    texte(['3,3'], 'Pansements, biberons de lait chaud, sirop au miel... Penguinmon pense à tout.');
    texte(['1,3', '2,3'], 'Des biberons, des hochets et des petits pots, bien alignés.');
    texte(['7,3', '8,3'], 'Une étagère pleine de jouets : des cubes, un nounours, une balle... Tout est rangé avant la sieste.');
    texte(['12,3'], 'Des bocaux de compote de pomme bleue et de lait en poudre, bien rangés.');
    texte(['13,6', '14,6'], "Le lit de Penguinmon : une coque de noix tapissée de pétales. Il a l'air drôlement confortable.");
    texte(['14,8'], 'Le coffre à trésors de Penguinmon : des coquillages, une plume, un vieux dessin de bébé Digimon...');

    // ---------------------------------------------------------- LE VILLAGE MEUBLÉ (cases de la carte agrandie ; seulement là où
    // l'on voit, pas sous le feuillage des grands arbres) : aire de jeux près du manège, bancs autour de la place, kiosque à
    // livres, scène, pavillon fleuri, dôme à bulles, moulin et observatoire, coin nurserie, boîte aux lettres, tableau, jouets
    for (const [n, x, y, w, h] of [
      ['toboggan', 58, 13, 2, 1], ['balancoire', 62, 15, 2, 1], ['trampoline', 75, 14, 2, 1], ['tourniquet', 61, 18, 2, 1], ['dome_grimpe', 66, 19, 2, 1], ['tunnel', 71, 20, 2, 1],
      ['banc', 36, 24, 2, 1], ['banc', 53, 24, 2, 1], ['banc', 36, 38, 2, 1], ['banc', 53, 38, 2, 1],
      ['kiosque_livres', 20, 5, 3, 1], ['statue_oeuf', 31, 5, 2, 1], ['scene_musique', 66, 26, 3, 2], ['pavillon_fleur', 13, 33, 3, 2], ['dome_bulles', 68, 35, 3, 2],
      ['moulin', 28, 42, 3, 2], ['observatoire', 12, 46, 3, 2], ['fontaine_bulles', 54, 43, 1, 1],
      ['couveuse', 26, 9, 1, 1], ['table_langer', 30, 8, 1, 1], ['etagere_biberons', 33, 8, 2, 1], ['chaise_haute', 24, 14, 1, 1], ['coussins', 26, 12, 2, 1],
      ['boite_lettres', 41, 11, 1, 1], ['panneau_affichage', 30, 16, 2, 1], ['poteau_indicateur', 9, 21, 1, 1], ['poubelle', 58, 24, 1, 1],
      ['fanions', 40, 19, 2, 1], ['fanions', 55, 19, 2, 1], ['ballons', 33, 28, 1, 1], ['ballons', 57, 34, 1, 1], ['moulinets', 31, 20, 1, 1],
      ['cubes', 36, 13, 1, 1], ['anneaux', 40, 42, 1, 1], ['xylophone', 56, 40, 1, 1], ['tambour', 34, 44, 1, 1], ['hochet', 60, 24, 1, 1], ['toupie', 63, 22, 1, 1],
      ['buisson_fleurs', 20, 16, 1, 1], ['buisson_fleurs', 76, 24, 1, 1], ['buisson_fleurs', 18, 40, 1, 1], ['trefles', 44, 50, 1, 1], ['trefles', 22, 31, 1, 1],
      ['jardiniere', 43, 13, 2, 1], ['jardiniere', 61, 30, 2, 1], ['nid_oeufs', 35, 47, 1, 1], ['oeufs', 49, 47, 1, 1],
    ]) M.objects.push({ kind: B(n), v: 0, x, y, w, h });
    M.signs['30,16'] = M.signs['31,16'] = () => say(DW.state.flags.shellmon
      ? 'Le tableau du village : « Les bébés remercient l\'humain qui a ramené le calme sur la plage ! Concert ce soir sur la scène. »'
      : 'Le tableau du village : « Ne vous éloignez pas vers la plage : on y entend des cris. Les DigiŒufs se prennent auprès de Penguinmon. »');
    M.signs['9,21'] = '→ Place du biberon · Maison de Penguinmon · Nid des DigiŒufs. ↑ Arche arc-en-ciel. ← Prairie des Lucioles.';
    M.signs['20,5'] = M.signs['21,5'] = M.signs['22,5'] = 'Le kiosque à livres : « Mon premier Digivice », « Comment bien digivoluer », « Les Engrenages Noirs expliqués aux bébés »...';
  }
})();
