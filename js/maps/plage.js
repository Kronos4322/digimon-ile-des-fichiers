'use strict';
// =====================================================================
//  BORD DE MER (région « plage ») — deux cartes, comme dans l'animé
//  - PLAGE DES CABINES (épisode 2) : la rangée de cabines téléphoniques au bord de l'eau,
//    Shellmon qui jaillit du sable, dunes, lagon, promenade en planches, ponton et barque.
//  - CRIQUE DU RADEAU (épisode 14) : le radeau des enfants dans une baie abritée ;
//    une fois Shellmon chassé, on le pousse à l'eau... et Whamon, un Engrenage Noir dans le dos, surgit.
//  Plans d'origine 40×36 et 40×30, agrandis ×2 (MapKit.ZOOM).
// =====================================================================
(function () {
  const { say, st, paint, trail, recruitNPC, zoomMap } = DW.MapKit;
  const MAPS = DW.MAPS;
  const H = DW.Art.hash, N = DW.Art.noise;
  // les Digimon de la plage
  const ENCOUNTERS = [
    { sp: 'betamon', min: 2, max: 4, w: 35 },
    { sp: 'gotsumon', min: 3, max: 4, w: 30 },
    { sp: 'bukamon', min: 2, max: 3, w: 25 },
    { sp: 'pichimon', min: 2, max: 3, w: 15 },
    { sp: 'kunemon', min: 3, max: 4, w: 10 },
  ];

  // ------------------------------------------------------------ Shellmon (épisode 2) : BOSS FINAL DU CHAPITRE 1
  // Avant Kuwagamon, les cabines sonnent dans le vide. Ensuite, chacune murmure un mot : dans le bon ordre,
  // le sable s'ouvre sur l'antre de Shellmon (maps/antre.js).
  async function boothEvent(ow, x) {
    const s = st();
    if (s.flags.kuwagamon || s.flags.shellLair) { await DW.Antre.booth(ow, Math.max(0, BOOTHS.indexOf(Math.floor(x / 2)))); return; }
    DW.Audio.sfx('ring');
    await say('Driiing ! Driiing ! Toutes les cabines se mettent à sonner en même temps !');
    if ((await DW.ask('Décrocher le téléphone ?')) !== 0) { await say("Les sonneries s'arrêtent d'un coup... C'était bizarre."); return; }
    await say(s.hero !== 'tai' ? "« ...allô ?... Il y a quelqu'un ?... Je suis coincé... »" : 'Allô ?... Seul un étrange bruit de vagues te répond.');
    await say("La communication coupe. Le sable tremble un peu sous tes pieds... Quelque chose de très gros dort ici.");
    await say("(Quelqu'un appelle à l'aide... mais tu ne peux rien faire pour l'instant. Reviens quand la forêt sera calmée : le monstre rouge du Grand Arbre, dans la Clairière, terrorise toute l'île.)");
  }

  // ------------------------------------------------------------ Gomamon : une ombre dans l'eau (comme Coelamon dans Digimon World)
  // On ne le voit qu'entre 16 h et 19 h : une ombre qui nage près du rivage, au sud de la plage. On lui parle depuis le sable.
  const GOMA_HOURS = [16, 19];
  function gomamonShadow() {
    const n = recruitNPC({ sp: 'gomamon', x: 21, y: 32, lvl: 12, face: 'up',
      lines: ["Yo ! Moi c'est Gomamon ! Les vagues, la pêche... la belle vie !", "Je ne sors de l'eau que pour les dresseurs vraiment forts. Montre-moi ce que tu vaux !"],
      win: "Bien joué ! Allez, je viens en ville. J'ai repéré un endroit parfait pour pêcher..." });
    const cond = n.cond, talk = n.talk;
    n.shadow = true;   // dessiné comme une ombre sous l'eau (game/overworld.js)
    n.hide = false;    // (déjà difficile à trouver : une ombre, de 16 h à 19 h seulement)
    n.cond = s => cond(s) && (h => h >= GOMA_HOURS[0] && h < GOMA_HOURS[1])(DW.Time.hour());
    n.talk = async ow => {
      await say("Une grande ombre nage juste sous la surface... Elle s'approche du rivage !");
      DW.Audio.sfx('water');
      await say("PLOUF ! Un Digimon blanc à la crête orange jaillit de l'eau !");
      await talk(ow);
    };
    return n;
  }

  // ------------------------------------------------------------ Whamon (épisode 14) : le radeau de la crique
  async function raftTalk(ow) {
    const s = st();
    if (!s.flags.shellmon) {
      await say("Un radeau de rondins à moitié construit, avec une voile rapiécée. Qui a bien pu commencer ça ?");
      await say("Sur la plage, les cabines téléphoniques sonnent sans arrêt... Ce n'est pas le moment de prendre la mer.");
      return;
    }
    if (!s.flags.whamon) {
      await say("Le radeau est presque fini. Au large, un énorme jet d'eau jaillit de temps en temps...");
      if ((await DW.ask("Pousser le radeau à l'eau ?")) !== 0) return;
      if (!s.party.some(m => m.hp > 0)) { await say('Il te faudrait un Digimon en forme avant de prendre la mer...'); return; }
      DW.Audio.sfx('swoosh'); await DW.wait(0.6);
      DW.Audio.sfx('roar'); ow.shake = 1.4; await DW.wait(0.8);
      await say("La mer se soulève ! Une baleine gigantesque surgit et manque d'avaler le radeau tout entier !");
      const pn = (s.party.find(m => m.hp > 0) || s.party[0]).name;
      await say("C'est Whamon ! Regarde son dos... un Engrenage Noir ! Il ne sait plus ce qu'il fait !", pn);
      const res = await ow.battle({ enemy: new DW.Digimon('whamon', 24), boss: true, canLose: true, intro: 'Whamon fait déferler une vague géante !' });   // boss facultatif redoutable
      if (res !== 'win') { await say('Whamon replonge dans les profondeurs... Il reviendra. Entraîne-toi et retente ta chance.'); await ow.bossDefeat("Hohoho... Des Bukamon t'ont tiré de l'eau. Whamon ? Ce géant est bien trop fort pour l'instant !"); return; }
      s.flags.whamon = true;
      DW.Audio.sfx('super'); ow.shake = 0.6;
      await say("L'Engrenage Noir se brise et coule au fond de la mer !");
      await say("Pfffuuu... Merci, petit humain. J'avais l'impression de nager dans un cauchemar sans fin.", 'Whamon');
      await say('Je vis tout au fond du Net Ocean. Reviens au radeau chaque jour : je te rapporterai ce que je trouve dans les profondeurs.', 'Whamon');
      const extra = DW.giveItem('soin_g', 2) + DW.giveItem('pm_g', 1) + DW.giveItem('super_viande', 2); s.bits += 1500;
      DW.Audio.sfx('buy'); await say(`Whamon te laisse 2 RAM PV++, une RAM PM++, 2 Viandes géantes et 1500 Bits !${DW.extraMsg(extra)}`);
      DW.autosave();
      return;
    }
    const day = DW.Time.day();
    if (s.flags.whamonDay === day) { await say("Le jet d'eau de Whamon jaillit au loin. Il est parti fouiller les profondeurs : reviens demain !"); return; }
    s.flags.whamonDay = day;
    await say('PFFFOUUU ! Whamon fait surface près du radeau.', 'Whamon');
    const r = Math.random(), got = r < 0.35 ? 'poisson' : r < 0.55 ? 'super_viande' : r < 0.75 ? 'disque_pm' : r < 0.9 ? 'medoc' : 'puce_pm';
    const n = got === 'poisson' ? 2 : 1, extra = DW.giveItem(got, n); DW.Audio.sfx('buy');
    await say(`Un trésor des profondeurs : ${n > 1 ? n + ' ' : ''}${DW.ITEMS[got].name} !${DW.extraMsg(extra)}`, 'Whamon');
  }

  // ------------------------------------------------------------ outils de dessin des côtes
  // dunes : ellipses irrégulières d'herbes des dunes sur le sable sec
  const dunes = (g, list, seed) => {
    for (const [cx, cy, rx, ry] of list) for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++)
      if (g.get(x, y) === 's' && Math.hypot((x - cx) / rx, (y - cy) / ry) < 1 + (H(x, y, seed) - 0.5) * 0.5) g.set(x, y, ';');
  };
  const putAll = (g, list, ch, on = ['s']) => { for (const [x, y] of list) if (on.includes(g.get(x, y))) g.set(x, y, ch); };
  const shells = (g, seed, x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (g.get(x, y) === 's' && H(x, y, seed) < 0.06) g.set(x, y, '3'); };

  // ============================================================ PLAGE DES CABINES (40×36)
  const BOOTHS = [12, 14, 16, 20, 22, 24];
  const plageRows = paint(40, 36, '~', g => {
    // haut de la falaise : prairie salée, chemins vers la forêt (nord) et la ville (est)
    g.rect(0, 0, 40, 4, '.');
    for (let x = 0; x < 40; x++) if (x < 16 || x > 20) g.set(x, 0, 'T');
    for (const x of [0, 1, 2, 3, 36, 37]) g.set(x, 1, 'T');
    trail(g, 40, 36, [[18, -1], [18, 2.2], [26, 2.4], [33, 2], [40, 2]], 1.05, '=', 31);
    g.scatter('f', 4, 1, 32, 3, 14, 32, ['.']); g.set(7, 2, 'b'); g.set(12, 1, 'b'); g.set(30, 1, 'b'); g.set(35, 3, 'b');
    g.set(21, 3, 'S');
    // falaise et escalier
    for (let x = 0; x < 40; x++) g.set(x, 4, x >= 17 && x <= 19 ? '^' : 'C');
    // sable : rivage est en biais, rivage sud ondulé
    for (let y = 5; y < 36; y++) for (let x = 0; x < 40; x++) {
      const e = 37 - Math.max(0, y - 8) * 0.55 + (N(x * 0.3, y * 0.3, 41) - 0.5) * 2.2;
      const s = 30.6 + Math.sin(x * 0.33) * 1.1 + (N(x * 0.25, 3, 43) - 0.5) * 1.6;
      if (x < e && y < s) g.set(x, y, 's');
    }
    // lagon intérieur (eau turquoise, peu profonde) avec son îlot de palmiers
    for (let y = 10; y < 19; y++) for (let x = 3; x < 14; x++) if (Math.hypot((x - 8) / 4.2, (y - 14) / 2.8) < 1 + (N(x * 0.5, y * 0.5, 45) - 0.5) * 0.25) g.set(x, y, '~');
    g.set(8, 14, 's'); g.set(9, 14, 'p');
    // bord ouest : bosquet de palmiers (avec le passage vers la crique)
    for (let y = 5; y < 36; y++) if ((y < 23 || y > 27) && g.get(0, y) === 's') g.set(0, y, y % 3 === 1 ? 'R' : 'p');
    for (let y = 5; y < 22; y++) if (H(1, y, 46) < 0.45 && g.get(1, y) === 's') g.set(1, y, 'p');
    // promenade en planches : de l'escalier jusqu'aux cabines
    for (let y = 5; y < 24; y++) g.set(18, y, '_');
    // dunes d'herbes (les Digimon sauvages s'y cachent)
    dunes(g, [[11, 7, 4, 1.6], [26, 7, 5, 1.6], [30, 13, 2.6, 1.6], [14, 20, 3.2, 1.6], [5, 21, 2.4, 1.4], [25, 18, 2.6, 1.4]], 44);
    // palmiers en bouquets
    putAll(g, [[5, 6], [6, 7], [22, 5], [33, 6], [34, 7], [15, 11], [23, 11], [24, 12], [28, 15], [3, 26], [6, 28]], 'p');   // (plus de palmier devant les cabines)
    // rochers de Gotsumon (nord-est), rochers du rivage, îlots dans la mer
    putAll(g, [[31, 9], [32, 10], [30, 11]], 'r');
    putAll(g, [[33, 16], [32, 17], [27, 22], [30, 20]], 'R');
    for (const [x, y] of [[36, 20], [37, 21], [36, 21], [35, 27], [36, 27], [9, 32], [10, 32]]) if (g.get(x, y) === '~') g.set(x, y, 'R');
    // cuvettes et bois flotté au bord de l'eau, château de sable, coquillages
    putAll(g, [[29, 18], [26, 25], [8, 30], [14, 29], [31, 14]], '8');
    putAll(g, [[16, 15], [27, 9], [5, 30]], '6');
    putAll(g, [[21, 16]], '9');
    shells(g, 77, 1, 5, 37, 31);
    // la rangée de cabines au bord de l'eau (épisode 2)
    for (const x of BOOTHS) g.set(x, 26, 'P');
    // le rocher de Shellmon, dans l'eau face aux cabines
    for (const [x, y] of [[17, 32], [18, 32], [17, 33]]) if (g.get(x, y) === '~') g.set(x, y, 'R');
    // ponton
    for (let y = 22; y < 33; y++) if (g.get(29, y) !== 's') g.set(29, y, '_');
    // panneaux
    g.set(4, 22, 'Z'); g.set(19, 24, 'Z');
    // passages dégagés : arrivée de l'escalier, devant les cabines, sortie vers la crique
    g.rect(16, 5, 2, 2, 's'); g.rect(19, 5, 2, 2, 's'); g.rect(11, 25, 15, 1, 's'); g.rect(11, 27, 15, 1, 's');
    g.rect(0, 23, 4, 5, 's');
  });
  MAPS.plage = {
    name: 'Plage des Cabines', music: 'beach', bg: 'plage', ambient: 'beach', theme: 'beach', climate: 'beach', region: 'plage', rate: 0.12, wildN: 8,
    rows: plageRows,
    objects: [
      { kind: 'rowboat', x: 30, y: 30, w: 2, h: 1, oy: 2 },
      { kind: 'spout', x: 36, y: 33, w: 1, h: 1, small: true },
      { kind: 'crab', v: 0, x: 23, y: 29, w: 1, h: 1, small: true, walk: true }, { kind: 'crab', v: 1, x: 7, y: 25, w: 1, h: 1, small: true, walk: true },
      { kind: 'crab', v: 0, x: 31, y: 18, w: 1, h: 1, small: true, walk: true },
      { kind: 'starfish', v: 0, x: 13, y: 29, w: 1, h: 1, small: true, walk: true }, { kind: 'starfish', v: 1, x: 27, y: 24, w: 1, h: 1, small: true, walk: true },
      { kind: 'starfish', v: 1, x: 4, y: 16, w: 1, h: 1, small: true, walk: true },
    ],
    encounters: ENCOUNTERS,
    warps: [
      { x: 17, y: 0, w: 3, h: 1, dir: 'up', to: 'lisiere', tx: 17, ty: 31 },
      { x: 39, y: 1, w: 1, h: 3, dir: 'right', to: 'village', tx: 0, ty: 13 },
      { x: 0, y: 23, w: 1, h: 5, dir: 'left', to: 'crique', tx: 39, ty: 8 },
    ],
    npcs: [
      recruitNPC({ sp: 'gotsumon', x: 30, y: 9, lvl: 6, face: 'left',
        lines: ["Grrr ! Je suis Gotsumon. Je casse des cailloux pour me calmer...", "Avant, j'avais une place en ville. Mais je n'ai plus le cœur à rien. Sauf si tu me bats !"],
        win: "Bah... T'es costaud ! Allez, je rentre en ville. Tu vas voir ce que tu vas voir !" }),
      gomamonShadow(),
    ],
    triggers: [],
    signs: {
      '21,3': "Nord : Forêt de l'Arrivée.  Est : Ville des Fichiers.  En bas de l'escalier : la Plage des Cabines.",
      '4,22': "Ouest : Crique du Radeau. Quelqu'un y construit un radeau pour quitter l'île...",
      '19,24': () => say(st().flags.kuwagamon && !st().flags.shellLair ? "Quelqu'un a gravé sous le panneau : « Chaque cabine murmure un mot. Dans le bon ordre, c'est un appel au secours. »" : 'Les cabines téléphoniques sonnent parfois toutes seules... Personne ne sait qui appelle.'),
    },
    tileActs: { P: boothEvent },
  };
  zoomMap(MAPS.plage, 'plage');   // plan agrandi ×2 (maps/common.js)
  // la rangée de cabines reste bien dégagée (aucun décor ajouté devant ou derrière : c'est le lieu de l'énigme)
  { const P = []; MAPS.plage.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'P') P.push([x, y]); }));
    if (P.length) MAPS.plage.dressKeep = [[Math.min(...P.map(p => p[0])) - 3, P[0][1] - 7, Math.max(...P.map(p => p[0])) + 3, P[0][1] + 4]]; }

  // ============================================================ CRIQUE DU RADEAU (40×30)
  const criqueRows = paint(40, 30, '~', g => {
    // haut des falaises : jungle de palmiers
    g.rect(0, 0, 40, 5, '#');
    for (let y = 1; y < 5; y++) for (let x = 2; x < 38; x++) if (N(x * 0.3, y * 0.4, 51) > 0.45) g.set(x, y, '.');
    for (let y = 1; y < 5; y++) for (let x = 2; x < 38; x++) if (g.get(x, y) === '.' && H(x, y, 52) < 0.25) g.set(x, y, 'p');
    for (let x = 0; x < 40; x++) g.set(x, 5, 'C');
    // croissant de sable autour d'une baie abritée, ouverte au sud
    for (let y = 6; y < 30; y++) for (let x = 0; x < 40; x++) {
      const out = Math.hypot((x - 20) / 18.5, (y - 14) / 11.5) < 1 + (N(x * 0.3, y * 0.3, 53) - 0.5) * 0.18;
      const bay = Math.hypot((x - 19) / 10, (y - 21) / 7) < 1 + (N(x * 0.3, y * 0.3, 54) - 0.5) * 0.2;
      if (out && !bay) g.set(x, y, 's');
    }
    // passage vers la Plage des Cabines (est)
    for (let y = 6; y < 13; y++) for (let x = 31; x < 40; x++) if (y > 6 || x < 36) g.set(x, y, 's');
    // dunes, palmiers, rochers, cuvettes, coquillages
    dunes(g, [[8, 10, 3.6, 1.6], [29, 9, 3, 1.4], [5, 17, 2, 2.4]], 55);
    putAll(g, [[3, 8], [4, 9], [12, 7], [26, 7], [35, 9], [2, 14], [36, 15], [33, 18], [6, 22]], 'p');
    putAll(g, [[24, 8], [25, 8], [3, 19], [34, 21]], 'r');
    putAll(g, [[10, 15], [29, 16], [13, 26], [27, 25]], '8');
    putAll(g, [[17, 9], [22, 12]], '6');
    shells(g, 56, 1, 6, 39, 29);
    // îlots de rochers dans la baie et au large
    for (const [x, y] of [[12, 20], [26, 22], [5, 27], [34, 27], [35, 28]]) if (g.get(x, y) === '~') g.set(x, y, 'R');
    // panneau
    g.set(22, 9, 'Z');
    // devant le radeau : sable dégagé
    g.rect(15, 11, 8, 2, 's');
  });
  MAPS.crique = {
    name: 'Crique du Radeau', music: 'beach', bg: 'plage', ambient: 'beach', theme: 'beach', climate: 'beach', region: 'plage', rate: 0.1, wildN: 6,
    rows: criqueRows,
    objects: [
      { kind: 'raft', x: 16, y: 13, w: 4, h: 2 },
      { kind: 'rockarch', x: 20, y: 25, w: 4, h: 2 },
      { kind: 'wreck', x: 4, y: 12, w: 4, h: 2 },
      { kind: 'spout', x: 30, y: 27, w: 1, h: 1, small: true },
      { kind: 'crab', v: 1, x: 9, y: 19, w: 1, h: 1, small: true, walk: true }, { kind: 'crab', v: 0, x: 30, y: 19, w: 1, h: 1, small: true, walk: true },
      { kind: 'starfish', v: 0, x: 14, y: 23, w: 1, h: 1, small: true, walk: true }, { kind: 'starfish', v: 1, x: 25, y: 17, w: 1, h: 1, small: true, walk: true },
    ],
    encounters: ENCOUNTERS.filter(e => e.sp !== 'gotsumon').concat([{ sp: 'gomamon', min: 3, max: 4, w: 15 }]),
    warps: [{ x: 39, y: 7, w: 1, h: 5, dir: 'right', to: 'plage', tx: 0, ty: 23 }],
    npcs: [],
    triggers: [],
    signs: {
      '22,9': "Crique du Radeau. Une baie abritée où l'on raconte que des enfants venus d'un autre monde ont un jour pris la mer.",
      ...Object.fromEntries([16, 17, 18, 19].map(x => [`${x},13`, raftTalk])),   // on parle au radeau depuis le sable (nord)
      '4,12': "L'épave d'un vieux bateau, à moitié ensevelie. Le nom sur la coque est effacé par le sel.",
      '5,12': "L'épave d'un vieux bateau, à moitié ensevelie. Le nom sur la coque est effacé par le sel.",
    },
  };
  zoomMap(MAPS.crique, 'crique');   // plan agrandi ×2 (maps/common.js)
})();
