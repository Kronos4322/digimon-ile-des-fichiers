'use strict';
// =====================================================================
//  FORÊT DE L'ÎLE DES FICHIERS (4 zones)
//  Clairière de l'Arrivée → Sentier des Murmures → Bois des Géants → Lisière du Ravin
// =====================================================================
(function () {
  const { say, st, healAll, forestGen, recruitNPC, zoomGen, zoomMap, zpt } = DW.MapKit;
  const MAPS = DW.MAPS;

  // ------------------------------------------------------------ scripts
  async function kuwagamonEvent(ow) {
    const s = st(), partner = s.party.find(m => m.hp > 0) || s.party[0];
    DW.Audio.stop();
    DW.Audio.sfx('roar'); ow.shake = 1.2;
    await DW.wait(1.0);
    await say('BZZZZZZZZZZ !!!');
    ow.big = { sp: 'kuwagamon', x: 0, y: -40 };
    DW.Audio.sfx('swoosh');
    await DW.tween(ow.big, { y: 120 }, 0.7);
    await say("Un gigantesque insecte rouge surgit des arbres ! C'est lui qui terrorise les Yokomon de la clairière !");
    await say("C'est Kuwagamon ! Il est super dangereux... mais on ne peut pas reculer !", partner.name);
    ow.big = null;
    const kuwa = new DW.Digimon('kuwagamon', 9);
    const res = await ow.battle({ enemy: kuwa, boss: true, intro: "Kuwagamon passe à l'attaque !" });
    if (res !== 'win') return;
    s.flags.kuwagamon = true;
    await say("Kuwagamon s'écrase dans les buissons... puis s'envole en titubant vers la montagne !");
    await say('On a réussi ! La clairière est enfin tranquille.', partner.name);
    await say('Des petits Digimon sortent timidement des herbes pour vous remercier...');
    DW.autosave();
    await DW.Chapter.end1();   // fin du chapitre 1 (game/chapitre1.js)
  }

  // objet ramassable (sphère brillante posée au sol)
  const pickup = (x, y, id, n, flag) => ({ pickup: true, x, y, cond: s => !s.flags[flag], talk: async () => {
    const s = st();
    s.flags[flag] = true;
    const extra = DW.giveItem(id, n);
    DW.Audio.sfx('buy');
    await say(`Tu trouves ${n > 1 ? n + ' ' : ''}${DW.ITEMS[id].name}${n > 1 ? 's' : ''} !${DW.extraMsg(extra)}`);
  } });

  // ------------------------------------------------------------ 1. CLAIRIÈRE DE L'ARRIVÉE (36x30)
  MAPS.clairiere = {
    name: "Clairière de l'Arrivée", music: 'field', bg: 'foret', ambient: 'forest', theme: 'spring', climate: 'forest', rate: 0.13, region: 'foret', wildN: 9,
    rows: forestGen(zoomGen({ landmarks: [['<', 3], ['?', 3]], avoid: [[17, 11], [30, 15]],
      w: 36, h: 30, seed: 1,
      clearings: [{ x: 18, y: 12, rx: 12, ry: 7.5 }, { x: 9, y: 9, rx: 4, ry: 3.5 }],
      paths: [{ pts: [[17, 14], [17, 20], [18, 25], [17, 30]], r: 1.8 }, { pts: [[17, -1], [17, 4], [17, 10]], r: 1.6 }],
      tall: [{ x: 27, y: 8, r: 3 }, { x: 25, y: 16, r: 2.2 }],
      bigtrees: [[28, 12]],
      free: [[17, 12, 5], [9, 9, 3]],
      set: [[9, 8, 'O'], [19, 21, 'S']],
    })),
    encounters: [{ sp: 'botamon', min: 3, max: 4, w: 10 }, { sp: 'yuramon', min: 3, max: 4, w: 10 }, { sp: 'nyokimon', min: 3, max: 4, w: 8 }, { sp: 'yokomon', min: 6, max: 7, w: 35 }, { sp: 'kunemon', min: 6, max: 8, w: 35 }, { sp: 'tanemon', min: 6, max: 7, w: 15 }, { sp: 'mushroomon', min: 6, max: 8, w: 15, night: 40 }],
    warps: [{ x: 16, y: 29, w: 3, h: 1, dir: 'down', to: 'sentier', tx: 21, ty: 0 }],
    npcs: [
      recruitNPC({ sp: 'yokomon', x: 17, y: 11, face: 'left', noBattle: true, cond: s => s.flags.kuwagamon,
        lines: ["Merci d'avoir chassé Kuwagamon ! On avait si peur qu'on n'osait plus rentrer...", 'On se souvient maintenant : on vivait à la Ville des Fichiers !'],
        win: "On rentre en ville ! On a plein d'idées... Tu verras bien !" }),
      pickup(30, 15, 'viande', 2, 'pk_clairiere'),
    ],
    triggers: [
      { x: 0, y: 23, w: 36, h: 1, cond: s => !s.flags.kuwagamon, run: kuwagamonEvent },
    ],
    signs: {
      '9,8': async () => {
        const r = await DW.ask("Une source scintillante... Des chiffres lumineux s'en échappent. Se reposer ici ?");
        if (r === 0) { const [hx, hy] = zpt('clairiere', 9, 9); st().heal = { map: 'clairiere', x: hx, y: hy + 1 }; await healAll('Tes Digimon sont en pleine forme !'); DW.autosave(); }
      },
      '19,21': "Clairière de l'Arrivée, au cœur de la forêt. Sud : Sentier des Murmures.",
    },
  };

  // ------------------------------------------------------------ 2. SENTIER DES MURMURES (44x36)
  MAPS.sentier = {
    name: 'Sentier des Murmures', music: 'field', bg: 'foret', ambient: 'forest', theme: 'misty', climate: 'forest', rate: 0.11, region: 'foret', wildN: 9,
    rows: forestGen(zoomGen({ landmarks: [['>', 4], ['$', 3]], avoid: [[4, 13], [6, 24], [37, 12], [4, 13]],
      w: 44, h: 36, seed: 2, autoTall: 0.54,
      paths: [
        { pts: [[22, -1], [22, 5], [15, 10], [14, 14], [14, 20], [17, 22], [27, 25], [30, 30], [30, 36]], r: 2 },
        { pts: [[16, 22], [10, 24], [6, 25]], r: 1.5, dirt: false },
        { pts: [[15, 10], [7, 9], [5, 14]], r: 1.3, dirt: false },
        { pts: [[27, 25], [36, 22], [38, 19], [38, 12], [44, 12]], r: 1.6, dirt: false },
      ],
      clearings: [{ x: 6, y: 25, rx: 4.5, ry: 4 }, { x: 38, y: 12, rx: 4, ry: 3.5 }, { x: 22, y: 4, rx: 4, ry: 3 }],
      rivers: [{ pts: [[-1, 15], [8, 17], [16, 18], [26, 17], [34, 18], [45, 16]], r: 1.4 }],
      tall: [{ x: 10, y: 12, r: 3 }, { x: 24, y: 28, r: 3.5 }, { x: 33, y: 30, r: 2.5 }],
      bigtrees: [[30, 9]],
      free: [[6, 25, 3], [38, 12, 3]],
      set: [[23, 7, 'S'], [5, 14, '.'], [4, 13, '.'], [6, 22, 'G'], [9, 27, 'G'], [3, 26, 'G']],
    })),
    encounters: [
      { sp: 'kunemon', min: 5, max: 7, w: 40 }, { sp: 'yokomon', min: 5, max: 6, w: 25 },
      { sp: 'mushroomon', min: 5, max: 7, w: 10, night: 45 }, { sp: 'tanemon', min: 5, max: 6, w: 12 }, { sp: 'elecmon', min: 6, max: 7, w: 6 }, { sp: 'tsunomon', min: 5, max: 6, w: 8 },
      { sp: 'punimon', min: 3, max: 4, w: 10 }, { sp: 'botamon', min: 3, max: 4, w: 6 },
    ],
    warps: [
      { x: 21, y: 0, w: 3, h: 1, dir: 'up', to: 'clairiere', tx: 16, ty: 29 },
      { x: 29, y: 35, w: 3, h: 1, dir: 'down', to: 'geants', tx: 29, ty: 0 },
      { x: 43, y: 11, w: 1, h: 3, dir: 'right', to: 'prairie', tx: 0, ty: 13 },
    ],
    npcs: [
      { sp: 'tanemon', x: 6, y: 24, face: 'right', talk: async () => {
        const s = st();
        await say('Psst... Fais attention. Un énorme Digimon rouge rôde près du ravin, au bout de la forêt...', 'Tanemon');
        if (!s.flags.gift_tanemon) {
          s.flags.gift_tanemon = true;
          await say('Tiens, prends ça. Ça te portera chance !', 'Tanemon');
          DW.giveItem('remede', 2); DW.Audio.sfx('buy');
          await say('Tu reçois 2 Remèdes !');
        } else await say('Les champignons lumineux brillent encore plus fort la nuit. C\'est joli, hein ?', 'Tanemon');
      } },
      recruitNPC({ sp: 'elecmon', x: 37, y: 12, lvl: 8, face: 'left',
        lines: ["Halte ! Je suis Elecmon. Autrefois, je vivais à la Ville des Fichiers...", "Mais je ne suivrai qu'un dresseur plus fort que moi !"],
        win: "Quelle force ! D'accord, je rentre en ville. J'ai une petite idée de ce que je vais y faire..." }),
      pickup(39, 11, 'remede', 1, 'pk_sentier1'),
      pickup(4, 13, 'super_viande', 1, 'pk_sentier2'),
    ],
    triggers: [],
    signs: { '23,7': 'Les murmures que tu entends ? Ce sont les données de la forêt qui circulent...' },
  };

  // ------------------------------------------------------------ 2b. PRAIRIE DES LUCIOLES (40x30) — beaucoup de Digimon sauvages
  MAPS.prairie = {
    name: 'Prairie des Lucioles', music: 'field', bg: 'foret', ambient: 'forest', theme: 'meadow', climate: 'forest', rate: 0.16, region: 'foret', wildN: 9,
    rows: forestGen(zoomGen({ landmarks: [['{', 7], ['!', 2]], avoid: [[7, 15], [31, 9], [21, 17], [18, 4]],
      w: 40, h: 30, seed: 5, autoTall: 0.42, deco: 0.7,
      clearings: [{ x: 20, y: 15, rx: 17, ry: 11 }],
      paths: [{ pts: [[-1, 14], [8, 14], [16, 17], [26, 12], [33, 15], [41, 13]], r: 1.6 }],
      lakes: [{ x: 28, y: 21, rx: 4, ry: 2.6 }],
      tall: [{ x: 12, y: 9, r: 4 }, { x: 22, y: 22, r: 4 }, { x: 32, y: 8, r: 3.5 }],
      bigtrees: [[34, 22]],
      free: [[5, 12, 2.5], [33, 15, 2.5], [38, 13, 2.2]],
      set: [[33, 14, 'S']],
    })),
    encounters: [
      { sp: 'yokomon', min: 4, max: 6, w: 25 }, { sp: 'tanemon', min: 4, max: 6, w: 18 }, { sp: 'kunemon', min: 4, max: 6, w: 20 },
      { sp: 'bukamon', min: 4, max: 5, w: 12 }, { sp: 'biyomon', min: 5, max: 6, w: 8 }, { sp: 'gabumon', min: 5, max: 6, w: 5 },
      { sp: 'mushroomon', min: 5, max: 6, w: 8, night: 35 },
      { sp: 'nyokimon', min: 3, max: 4, w: 12 }, { sp: 'yuramon', min: 3, max: 4, w: 8 }, { sp: 'punimon', min: 3, max: 4, w: 6 },
    ],
    warps: [{ x: 0, y: 13, w: 1, h: 3, dir: 'left', to: 'sentier', tx: 43, ty: 11 }, { x: 39, y: 12, w: 1, h: 3, dir: 'right', to: 'berceau', tx: 0, ty: 11 }],
    npcs: [
      { sp: 'yokomon', x: 7, y: 15, face: 'right', talk: async () => {
        await say('Bienvenue dans la prairie ! Plein de Digimon viennent jouer dans ces herbes hautes.', 'Yokomon');
        await say("Pour digivoluer, il faut s'entraîner au terrain au sud de la Ville des Fichiers. Les combats, eux, font grandir ton potentiel !", 'Yokomon');
        await say('Regarde la table des Digivolutions dans le menu pour savoir quoi travailler.', 'Yokomon');
      } },
      pickup(31, 9, 'remede', 2, 'pk_prairie1'),
      recruitNPC({ sp: "kunemon", x: 18, y: 4, lvl: 7, face: "left",
        lines: ["Bzzz ! Je suis Kunemon. Je ramasse tout ce qui traîne et je le range dans mes cocons de soie...", "Tu veux mes trésors ? Bats-moi d'abord, bzzz !"],
        win: "Bzzz... Tu es fort ! D'accord, je viens en ville. J'ai une idée pour ranger tout ça !" }),
      recruitNPC({ sp: 'mushroomon', x: 21, y: 17, lvl: 7, face: 'left', cond: () => DW.Time.isNight(),
        lines: ["Hihihi ! La nuit, je cueille les meilleurs champignons de la prairie...", "Avant, je vivais en ville, je crois... Montre-moi ce que tu vaux !"],
        win: "D'accord, d'accord ! Je rentre à la Ville des Fichiers. Surprise, surprise, hihi !" }),
    ],
    triggers: [],
    signs: { '33,14': 'Prairie des Lucioles. La nuit, des milliers de lucioles dansent au-dessus des herbes.  → Est : Village des Bébés' },
  };

  // ------------------------------------------------------------ 3. BOIS DES GÉANTS (44x36)
  MAPS.geants = {
    name: 'Bois des Géants', music: 'field', bg: 'foret', ambient: 'forest', theme: 'deep', climate: 'forest', rate: 0.12, region: 'foret', wildN: 9,
    rows: forestGen(zoomGen({ landmarks: [['}', 5], ['$', 2], ['?', 2]], avoid: [[14, 11], [28, 14], [28, 16], [7, 15], [35, 29]],
      w: 44, h: 36, seed: 3, autoTall: 0.53,
      paths: [
        { pts: [[30, -1], [30, 6], [24, 12], [26, 19], [18, 24], [14, 30], [14, 36]], r: 2 },
        { pts: [[18, 24], [26, 27], [32, 29]], r: 1.5, dirt: false },
        { pts: [[24, 12], [12, 10], [8, 15]], r: 1.4, dirt: false },
      ],
      clearings: [{ x: 22, y: 17, rx: 7, ry: 5 }, { x: 8, y: 16, rx: 4, ry: 3.5 }, { x: 32, y: 29, rx: 6, ry: 4 }],
      lakes: [{ x: 35, y: 16, rx: 5.5, ry: 4.2 }],
      tall: [{ x: 12, y: 21, r: 3 }, { x: 33, y: 30, r: 3 }],
      bigtrees: [[19, 8], [36, 7], [9, 26], [27, 30], [16, 17]],
      free: [[22, 17, 3]],
      set: [[27, 19, 'S'], [22, 12, 'y']],
    })),
    encounters: [
      { sp: 'bukamon', min: 4, max: 5, w: 25 }, { sp: 'yokomon', min: 4, max: 5, w: 25 }, { sp: 'tanemon', min: 4, max: 5, w: 15 },
      { sp: 'kunemon', min: 5, max: 6, w: 15 }, { sp: 'betamon', min: 5, max: 6, w: 12 }, { sp: 'mushroomon', min: 5, max: 6, w: 8, night: 35 },
    ],
    warps: [
      { x: 29, y: 0, w: 3, h: 1, dir: 'up', to: 'sentier', tx: 29, ty: 35 },
      { x: 13, y: 35, w: 3, h: 1, dir: 'down', to: 'lisiere', tx: 17, ty: 0 },
    ],
    npcs: [
      { sp: 'bukamon', x: 28, y: 14, face: 'right', talk: async () => {
        await say('Blub blub ! Ce lac est le meilleur endroit de toute l\'île pour faire la sieste !', 'Bukamon');
        await say('Les arbres d\'ici sont plus vieux que l\'île elle-même. On dit qu\'ils gardent les données des anciens Digimon.', 'Bukamon');
      } },
      recruitNPC({ sp: 'betamon', x: 28, y: 16, lvl: 7, face: 'right',
        lines: ["Bloub... Je surveille ce lac. Avant, j'habitais en ville, il me semble.", "Si tu es assez fort pour me battre, je te suivrai !"],
        win: 'Bloub bloub ! Je rentre en ville. Je sais exactement ce qui lui manque !' }),
      recruitNPC({ sp: "palmon", x: 14, y: 11, lvl: 8, face: "right",
        lines: ["Oh ! Un visiteur... Je suis Palmon. Je fais pousser des fleurs entre ces arbres géants.", "On m'a dit que la ville renaissait... Mais je ne partirai qu'avec quelqu'un de fort !"],
        win: "Tu as gagné ! D'accord, je viens en ville. Mes graines vont adorer ça !" }),
      pickup(7, 15, 'viande', 3, 'pk_geants1'),
      pickup(35, 29, 'reveil', 1, 'pk_geants2'),
    ],
    triggers: [],
    signs: { '27,19': 'Bois des Géants. Ne réveillez pas les arbres qui dorment.' },
  };

  // ------------------------------------------------------------ 4. LISIÈRE DU RAVIN (38x32)
  const lis = forestGen(zoomGen({ landmarks: [['|', 5], ['!', 3], ['$', 1]], avoid: [[26, 29], [27, 8]],
    w: 38, h: 32, seed: 4, autoTall: 0.56,
    paths: [{ pts: [[18, -1], [18, 6], [12, 12], [15, 18], [22, 22], [18, 27], [18, 32]], r: 2 }, { pts: [[14, 10], [21, 9], [27, 9]], r: 1.4, dirt: false }],
    clearings: [{ x: 15, y: 17, rx: 8, ry: 4 }, { x: 27, y: 9, rx: 4, ry: 3 }, { x: 18, y: 29, rx: 14, ry: 2.6 }],
    tall: [{ x: 26, y: 10, r: 3 }, { x: 9, y: 22, r: 3 }],
    bigtrees: [[30, 20]],
    free: [[15, 17, 4]],
  }));
  // falaise du ravin avec un escalier vers la plage (plan agrandi : ligne 54, escalier colonnes 34-39)
  const lisRows = lis.map((r, y) => {
    if (y !== 54) return r;
    return [...r].map((ch, x) => (x >= 34 && x <= 39 ? '^' : (x > 4 && x < 70 ? 'C' : ch))).join('');
  });
  MAPS.lisiere = {
    name: 'Lisière du Ravin', music: 'field', bg: 'foret', ambient: 'forest', theme: 'autumn', climate: 'forest', rate: 0.12, region: 'foret', wildN: 9,
    rows: lisRows,
    encounters: [{ sp: 'yokomon', min: 3, max: 4, w: 25 }, { sp: 'tanemon', min: 3, max: 4, w: 25 }, { sp: 'nyokimon', min: 2, max: 3, w: 15 }, { sp: 'yuramon', min: 2, max: 3, w: 10 }, { sp: 'kunemon', min: 4, max: 5, w: 15 }, { sp: 'mushroomon', min: 4, max: 5, w: 8, night: 30 }],
    warps: [
      { x: 17, y: 0, w: 3, h: 1, dir: 'up', to: 'geants', tx: 13, ty: 35 },
      { x: 17, y: 31, w: 3, h: 1, dir: 'down', to: 'plage', tx: 17, ty: 0 },
    ],
    npcs: [pickup(27, 8, 'super_viande', 1, 'pk_lisiere'),
      recruitNPC({ sp: "biyomon", x: 26, y: 29, lvl: 7, face: "left",
        lines: ["Cui ! Je suis Biyomon. D'ici, je vois toute l'île quand je vole !", "Je m'ennuie un peu toute seule... Mais prouve-moi d'abord que tu es fort !"],
        win: "Bravo ! Je m'envole vers la ville. J'ai déjà une idée !" })],
    triggers: [
    ],
    signs: {},
  };
  for (const id of ['clairiere', 'sentier', 'prairie', 'geants', 'lisiere']) zoomMap(MAPS[id], id, { rows: false });
})();
