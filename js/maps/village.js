'use strict';
// =====================================================================
//  VILLE DES FICHIERS — point de départ et cœur du jeu
//  La carte est reconstruite selon les Digimon recrutés (DW.Town) :
//  terrains vagues → bâtiments (rien ne révèle à l'avance ce qui sera construit), chemins de terre → allées pavées, décor qui s'enrichit.
//  Plan : maison de Jijimon au nord, place à la fontaine au centre,
//  deux allées (haut/bas) qui desservent les 4 commerces, étang et ruisseau à l'ouest.
// =====================================================================
(function () {
  const { say, st, paint, healAll, trail } = DW.MapKit;
  const Hh = DW.Art.hash;
  const MAPS = DW.MAPS;
  const T = () => DW.Town;

  // emplacements des bâtiments (x, y = coin haut-gauche de l'emprise ; npc = place de l'habitant)
  // in : intérieur (porte au centre du bâtiment), sign : enseigne qui se balance
  const LOTS = {
    gotsumon: { kind: 'bazar', x: 6, y: 7, w: 5, h: 3, in: ['bazar_in', 6, 8], sign: [0, 5, 9] },
    elecmon: { kind: 'dojo', x: 29, y: 7, w: 5, h: 3, in: ['dojo_in', 6, 9], sign: [1, 34, 9] },
    mushroomon: { kind: 'restaurant', x: 6, y: 19, w: 5, h: 3, in: ['resto_in', 6, 9], sign: [2, 5, 21] },
    yokomon: { kind: 'garden', x: 29, y: 19, w: 5, h: 3, in: ['serre_in', 7, 9], sign: [3, 34, 21] },
  };
  const FREE_LOT = { x: 24, y: 23, w: 5, h: 3 };
  const NORTH_LEVEL = 3;   // ouverture du Quartier Résidentiel (maps/quartiers.js)
  const BANK = { x: 23, y: 3, w: 5, h: 3 };

  // ------------------------------------------------------------ construction de la carte
  function build() {
    const m = MAPS.village, lvl = T().level(), has = id => T().has(id);
    const version = Object.keys(LOTS).concat(['betamon', 'biyomon', 'kunemon']).map(id => (has(id) ? 1 : 0)).join('') + lvl;
    if (m.version === version && m.rows) return;
    m.version = version;
    m.decay = Math.max(0, 1 - lvl / 4);
    m.plazas = [{ x: 320, y: 232, rx: 98, ry: 86 }];
    m.rows = paint(40, 30, '#', g => {
      g.rect(2, 2, 36, 27, '.');
      // lisière : arbres variés, deuxième rangée irrégulière (comme une vraie forêt)
      for (let x = 1; x < 39; x++) { g.set(x, 2, 'T'); g.set(x, 28, 'T'); }
      for (let y = 2; y < 29; y++) { g.set(1, y, 'T'); g.set(37, y, 'T'); g.set(38, y, 'T'); }
      for (let x = 4; x < 36; x++) { if (Hh(x, 3, 71) < 0.3) g.set(x, 3, 'T'); if (Hh(x, 27, 72) < 0.3) g.set(x, 27, 'T'); }
      for (let y = 4; y < 27; y++) if (Hh(36, y, 73) < 0.3 && (y < 6 || y > 11)) g.set(36, y, 'T');   // pas autour des mannequins du Dojo
      for (const [x, y] of [[36, 3], [36, 4], [36, 27], [35, 27], [36, 26], [4, 27]]) g.set(x, y, 'T');
      // étang et ruisseau à l'ouest (pont sur la route)
      for (let y = 2; y < 7; y++) for (let x = 2; x < 7; x++) if (Math.hypot((x - 3.6) / 2.2, (y - 3.8) / 1.6) < 1) g.set(x, y, '~');
      g.set(4, 4, 'w'); g.set(3, 3, 'w');
      for (let y = 5; y < 30; y++) { g.set(2, y, '~'); g.set(3, y, '~'); }
      g.rect(2, 13, 2, 3, '_');
      // chemins de terre qui serpentent (comme la Ville des Fichiers de Digimon World 1)
      const tr = (pts, r, s) => trail(g, 40, 30, pts, r, '=', s);
      tr([[-1, 14], [5, 14], [9, 14.6], [14, 14]], 1.25, 1);                                  // ouest : vers la plage (pont)
      tr([[25, 14], [30, 14.6], [35, 13.8], [40, 14]], 1.25, 2);                              // est : vers la Montagne
      tr([[19.5, 9], [19.5, 5.5]], 1.05, 3);                                                  // maison de Jijimon
      tr([[19.5, 19], [19, 24], [19.5, 30]], 1.05, 4);                                        // sud : Terrain d'entraînement
      tr([[6, 22.5], [5, 26], [5.5, 30]], 0.95, 5);                                           // sud-ouest : Quartier des Champs
      tr([[8.5, 10.4], [13, 9.6], [19.5, 9], [26, 9.8], [31.5, 10.4]], 0.85, 6);              // allée nord des commerces
      tr([[8.5, 22.4], [14, 21.8], [19.5, 21], [25, 21.8], [31.5, 22.4], [34, 23]], 0.85, 7); // allée sud
      tr([[9, 10.5], [8.4, 14]], 0.8, 8); tr([[30.5, 10.5], [31, 14]], 0.8, 9);
      tr([[25.5, 6.6], [22, 8.6]], 0.75, 10);                                                 // devant la banque
      g.rect(0, 13, 2, 3, '='); g.rect(2, 13, 2, 3, '_'); g.rect(37, 13, 3, 3, '=');            // entrées franches
      g.rect(5, 28, 2, 2, '='); g.rect(19, 28, 2, 2, '=');
      // place pavée
      for (let y = 8; y <= 20; y++) for (let x = 13; x <= 26; x++) if (Math.hypot(x - 19.5, (y - 14) * 1.15) < 6.2) g.set(x, y, 'z');
      // route de l'est : vers le Pont de l'Infini et la Montagne

      // décor selon le niveau de la ville
      const lawn = ['.'];
      const deco = (ch, n, seed, x = 4, y = 3, w = 33, h = 24) => g.scatter(ch, x, y, w, h, n, seed, lawn);
      if (lvl === 0) { deco('j', 70, 3); deco('r', 6, 5); deco('L', 2, 6); deco('k', 3, 8); deco('b', 8, 4); }
      else if (lvl < 3) { deco('j', 26, 3); deco('f', 20, 7); deco('b', 10, 4); deco('k', 1, 8); }
      else { deco('f', 34, 7); deco('b', 10, 4); }
      // bosquets dans les coins (arbres, buissons)
      for (const [x, y] of [[5, 7], [4, 9], [35, 6], [34, 4], [8, 25], [4, 21], [35, 20], [34, 24], [14, 3], [5, 17], [12, 17], [16, 26], [4, 11]]) g.set(x, y, 'T');
      // près de la maison de Jijimon : puits, toilettes
      g.set(13, 5, 'e'); g.set(15, 24, 'y');
      // décor numérique discret (comme dans Digimon World) : antenne, tuyau, panneau de circuit
      g.set(36, 7, '!'); g.set(4, 24, '$'); g.set(36, 24, '?');
      // grand arbre à l'est de la place
      g.set(34, 16, 'Y'); g.set(33, 16, 'g'); g.set(35, 16, 'g');
      // aménagements gagnés au fil des niveaux
      if (lvl >= 1) { g.set(12, 7, 'd'); g.set(27, 7, 'd'); }
      if (lvl >= 2) {
        for (const [x, y] of [[13, 9], [26, 9], [13, 19], [26, 19]]) g.set(x, y, 'i');
        for (const [x, y] of [[18, 7], [21, 7]]) g.set(x, y, 'l');
      }
      if (lvl >= 3) {
        for (const [x, y] of [[16, 17], [23, 17], [16, 11], [23, 11]]) g.set(x, y, 'J');
        g.set(15, 14, 't');
        for (const [x, y] of [[12, 13], [12, 15], [27, 13], [27, 15]]) g.set(x, y, 'd');
      }
      if (lvl >= 4) {
        for (const [x, y] of [[6, 12], [6, 16], [33, 12], [33, 16], [21, 25], [18, 25]]) g.set(x, y, 'V');
        for (const x of [11, 12, 14, 15, 24, 25, 27, 28]) g.set(x, 9, 'K');
      }
      // habitants : détails autour de leur bâtiment
      if (has('gotsumon')) { g.set(4, 10, 'D'); g.set(12, 8, 'a'); }
      if (has('elecmon')) { g.set(35, 8, 'E'); g.set(35, 10, 'E'); }
      if (has('mushroomon')) { g.set(4, 19, 'D'); g.set(12, 20, 'a'); }
      if (has('yokomon')) for (const x of [29, 31, 33]) g.set(x, 24, 'd');
      // emprises des bâtiments et des chantiers : herbe (l'objet bloque le passage)
      for (const id in LOTS) { const L = LOTS[id]; g.rect(L.x, L.y, L.w, L.h, '.'); }
      g.rect(FREE_LOT.x, FREE_LOT.y, FREE_LOT.w, FREE_LOT.h, '.'); g.rect(BANK.x, BANK.y, BANK.w, BANK.h, '.');
      // terrains vagues : rien ne laisse deviner ce qui sera construit
      const vacant = Object.keys(LOTS).filter(id => !has(id)).map(id => LOTS[id]).concat([FREE_LOT]);
      if (has('biyomon')) vacant.pop();
      if (!has('kunemon')) vacant.push(BANK);
      vacant.forEach((L, i) => { g.scatter('j', L.x, L.y, L.w, L.h, 9, 40 + i, ['.']); g.scatter('r', L.x, L.y, L.w, L.h, 1, 50 + i, ['.']); });
      g.rect(17, 3, 6, 3, '.');
      g.rect(BANK.x, BANK.y + BANK.h, BANK.w + 1, 1, '.'); // devant la banque : passage dégagé
      // route du nord vers le Quartier Résidentiel : elle n'existe qu'une fois le quartier construit (niveau 3)
      if (lvl >= NORTH_LEVEL) {
        tr([[11.5, 10], [12, 5], [11.5, -1]], 0.95, 11); g.rect(11, 0, 2, 2, '=');
        for (const [x, y] of [[9, 2], [10, 2], [13, 2], [14, 2]]) g.set(x, y, 'K');
        if (has('gotsumon')) g.set(13, 8, 'a');
      }
      // panneaux
      g.set(4, 12, 'S'); g.set(18, 26, 'S'); g.set(7, 25, 'S');
    });
    // objets : maison de Jijimon, bâtiments ou chantiers, fontaine, clôtures
    m.objects = [{ kind: 'jhouse', x: 17, y: 3, w: 6, h: 3 }, { kind: 'mailbox', x: 22, y: 6, w: 1, h: 1, small: true }];
    for (const id in LOTS) {
      const L = LOTS[id];
      if (has(id)) m.objects.push({ kind: L.kind, x: L.x, y: L.y, w: L.w, h: L.h }, { kind: 'hangsign', v: L.sign[0], x: L.sign[1], y: L.sign[2], w: 1, h: 1, small: true });
    }
    m.objects.push({ kind: 'bigfountain', v: has('betamon') ? 1 : 2, x: 18, y: 13, w: 4, h: 2 });
    if (has('biyomon')) m.objects.push({ kind: 'poste', ...FREE_LOT }, { kind: 'hangsign', v: 4, x: 29, y: 25, w: 1, h: 1, small: true });
    if (has('kunemon')) m.objects.push({ kind: 'bank', ...BANK });
    if (lvl >= 1) m.objects.push({ kind: 'laundry', x: 14, y: 7, w: 3, h: 1 });
    if (lvl >= NORTH_LEVEL) m.objects.push({ kind: 'districtgate', v: 0, x: 9, y: 0, w: 6, h: 3, top: true });
    // clôtures : jardins des maisons (réparées à partir du niveau 2)
    if (lvl >= 2) {
      m.objects.push({ kind: 'fence', v: 4, x: 33, y: 25, w: 4, h: 1, oy: 0 });
    }
    if (lvl >= 5) {
      m.objects.push({ kind: 'bunting', v: 6, x: 14, y: 9, w: 6, h: 1, top: true, oy: -40 });
      m.objects.push({ kind: 'bunting', v: 6, x: 20, y: 9, w: 6, h: 1, top: true, oy: -40 });
    }
    // habitants
    // (les commerçants sont dans leur boutique : on y entre par la porte)
    m.npcs = [...STARTERS, BOTAMON];
    if (has('betamon')) m.npcs.push({ sp: 'betamon', x: 22, y: 16, face: 'left', wander: 1, talk: SERVICES.betamon });
    if (has('biyomon')) m.npcs.push({ sp: 'biyomon', x: 27, y: 26, face: 'left', wander: 1, talk: SERVICES.biyomon });
    if (has('kunemon')) m.npcs.push({ sp: 'kunemon', x: 28, y: 6, face: 'left', wander: 1, talk: SERVICES.kunemon });
    m.npcs.forEach(n => { delete n.hx; delete n.hy; delete n.home; });
    m.doors = [{ x: 19, y: 5, w: 2, dir: 'up', to: 'maison', tx: 7, ty: 10 }].concat(Object.keys(LOTS).map(id => {
      const L = LOTS[id];
      return { x: L.x + 2, y: L.y + L.h - 1, w: 2, dir: 'up', to: L.in[0], tx: L.in[1], ty: L.in[2], cond: st => !!(st.recruits && st.recruits[id]) };
    }));
    // panneaux : ville, direction du terrain
    m.signs = {
      '4,12': () => say(`Ville des Fichiers — niveau ${T().level()} : « ${T().levelName()} ».  Ouest : Plage des Cabines.  Sud : Terrain d'entraînement.  Sud-ouest : Quartier des Champs.`),
      '7,25': 'Sud-ouest : Quartier des Champs. Un moulin, un étang, et des champs à perte de vue.',
      '18,26': "Sud : Terrain d'entraînement. Le niveau se gagne en combat, les Digivolutions à l'entraînement !",
    };
    for (let x = 18; x < 22; x++) for (const y of [13, 14]) m.signs[`${x},${y}`] = fountainUse;
    if (has('kunemon')) for (let x = BANK.x; x < BANK.x + BANK.w; x++) m.signs[`${x},${BANK.y + BANK.h - 1}`] = SERVICES.kunemon;
    DW.World.unprepare(m); delete m.w;
  }
  // ------------------------------------------------------------ choix du partenaire (sur la place)
  function starterTalk(sp, line) {
    return async () => {
      const s = st(), name = DW.SPECIES[sp].name;
      await say(line, name);
      const card = new DW.InfoCard(sp);
      DW.Game.push(card);
      const r = await DW.ask(`Choisir ${name} comme partenaire ?`);
      card.close();
      if (r !== 0) { await say('Prends ton temps pour choisir !', name); return; }
      const m = new DW.Digimon(sp, 4);
      m.happy = 70;
      DW.addDigimon(m);
      DW.Audio.sfx('fanfare');
      await say(`${name} devient ton partenaire !`);
      await say("Génial ! On va former une super équipe, toi et moi !", name);
      // les deux autres partent explorer l'île
      const others = STARTERS.filter(n => n.sp !== sp).map(n => DW.SPECIES[n.sp].name);
      await say(`Bon... Nous, on part explorer l'île ! Prends bien soin de ${name} !`, others.join(' et '));
      await DW.fade(1, 0.4);
      s.flags.starter = sp;
      await DW.wait(0.4);
      await DW.fade(0, 0.4);
      await say(`${others.join(' et ')} sont partis... La ville est bien vide, maintenant.`);
      DW.giveItem('viande', 5); DW.giveItem('remede', 3);
      DW.Audio.sfx('buy');
      await say('Jijimon avait laissé un colis pour toi : 5 Viandes et 3 Remèdes !');
      await say("(Botamon, le petit Digimon noir qui se promène sur la place, connaît bien la ville : demande-lui conseil !)");
      DW.autosave();
    };
  }
  // les trois bébés de la place (Tanemon, lui, s'occupe du DigiChamp aux Champs ; Botamon le guide est le grand frère)
  const STARTERS = [
    { sp: 'botamon', x: 16, y: 10, face: 'right', wander: 1, talk: starterTalk('botamon', "Bo-bo ! Moi aussi je m'appelle Botamon, comme mon grand frère ! Un jour, je serai un grand Digimon de feu !") },
    { sp: 'pichimon', x: 18, y: 11, face: 'right', wander: 1, talk: starterTalk('pichimon', "Pichi pichi ! Moi c'est Pichimon ! Je fais les plus grosses bulles de toute l'île !") },
    { sp: 'yuramon', x: 23, y: 10, face: 'left', wander: 1, talk: starterTalk('yuramon', "Fuu... Je suis Yuramon. Tu veux bien m'emmener avec toi ? J'ai peur du vent...") },
  ];
  // une fois le partenaire choisi, les autres quittent la ville
  STARTERS.forEach(n => (n.cond = s => !s.flags.starter));

  // ------------------------------------------------------------ Botamon : le guide de la ville
  // conseils selon la situation : d'abord l'urgent (faim, toilettes), puis les objectifs, à tour de rôle
  async function botamonTalk() {
    const s = st(), m = s.party[0], next = T().RECRUITS.find(x => !T().has(x.id));
    const urgent = [], tips = [];
    if (!s.flags.starter) urgent.push("Bo... bonjour ! Trois bébés Digimon t'attendent ici, sur la place (dont mon petit frère !). Parle-leur pour choisir ton partenaire !");
    else {
      if (m && m.hunger >= 70) urgent.push(`${m.name} a faim ! Tanemon donne 3 Viandes par jour dans son DigiChamp, au Quartier des Champs (sortie sud-ouest).`);
      if (m && m.need >= 60) urgent.push("Vite ! Il y a des toilettes au sud de la ville, près de la route du Terrain d'entraînement.");
      if (m && DW.Evo.available(m).length) urgent.push(`${m.name} peut digivoluer ! Ouvre le menu (ENTRÉE), puis DIGIVOLUTION.`);
      tips.push("Les Digimon ne se capturent pas : ils naissent ! Elecmon confie un DigiŒuf par jour au Village des Bébés, à l'est de la Prairie. Ensuite, entraîne-les pour qu'ils digivoluent !");
      tips.push("Certains chemins sont bloqués : un éboulis à l'est, des ronces aux Champs, l'inondation au nord de la Clairière... Les Digimon qui rentrent en ville t'aideront à passer !");
      if (!s.flags.tanemon) tips.push("Tu connais Tanemon ? Il cultive de la Digiviande au Quartier des Champs, au sud-ouest. Passe le voir chaque jour !");
      if (!T().level()) tips.push("La ville est vide... Les Digimon de l'île ont tout oublié. Explore l'ouest, retrouve-les et ramène-les ici !");
      if (m && DW.Training.total(m) < 10) tips.push("Les combats font monter le niveau. Mais pour digivoluer, il faut s'entraîner au Terrain d'entraînement, au sud.");
      if (next) tips.push(`On m'a dit qu'un Digimon rôde du côté de « ${MAPS[next.zone].name} »... Il cherche peut-être un endroit où vivre.`);
      if (Object.values(s.bag).some(n => n >= DW.BAG_MAX)) tips.push(`Ton sac ne peut pas contenir plus de ${DW.BAG_MAX} exemplaires d'un même objet. Le surplus est mis de côté...`);
      tips.push("Jijimon te laisse dormir chez lui : ça soigne toute l'équipe.", "Ton partenaire a besoin d'aller aux toilettes de temps en temps. Sinon... gare aux accidents !");
    }
    if (urgent.length) { await say(urgent[0], 'Botamon'); return; }
    const k = (s.flags.bota || 0) % tips.length;
    s.flags.bota = k + 1;
    await say(tips[k], 'Botamon');
  }
  const BOTAMON = { sp: 'botamon', x: 21, y: 11, face: 'left', wander: 3, talk: botamonTalk };

  // ------------------------------------------------------------ Jijimon (dans sa maison)
  async function jijimonTalk() {
    const s = st();
    if (!s.flags.starter) { await say("Les trois bébés t'attendent dehors, sur la place. Va choisir ton partenaire !", 'Jijimon'); return; }
    if (!s.flags.jiji_tanemon) { s.flags.jiji_tanemon = true; await say("Si ton partenaire a faim, va voir Tanemon au Quartier des Champs : il cultive de la Digiviande et en donne chaque jour.", 'Jijimon'); }
    const r = await DW.ask("Que veux-tu, jeune DigiSélectionné ?", ['Se reposer', 'Des conseils', 'Au revoir'], 'Jijimon');
    if (r === 0) {
      const night = DW.Time.isNight();
      await say(night ? "Dors donc ici cette nuit. Hohoho !" : "Une petite sieste te fera du bien.", 'Jijimon');
      if (night) { const h = DW.Time.hour(); s.clock += ((h < 7 ? 7 - h : 31 - h) * 60); } else s.clock += 120;
      s.heal = { map: 'maison', x: 12, y: 5 };
      await healAll('Toute ton équipe est en pleine forme !');
      DW.autosave();
    } else if (r === 1) {
      const next = T().RECRUITS.find(x => !T().has(x.id));
      if (next) await say(`On raconte qu'un Digimon solitaire erre du côté de « ${MAPS[next.zone].name} »... Il cherche peut-être un endroit où vivre. Qui sait ce qu'il apporterait à la ville ?`, 'Jijimon');
      else await say("La ville n'a jamais été aussi belle ! Merci, mon enfant.", 'Jijimon');
      await say(`Pour l'instant, la ville est au niveau ${T().level()} : « ${T().levelName()} ».`, 'Jijimon');
      await say("Ton partenaire ne digivoluera pas tout seul : entraîne-le au terrain du sud, gagne des combats, puis consulte la table des Digivolutions.", 'Jijimon');
    }
  }
  DW.Story.jijimonTalk = jijimonTalk;

  // ------------------------------------------------------------ services des habitants
  const SERVICES = {
    async gotsumon() {
      await say('Bienvenue au Bazar de Gotsumon ! Viande fraîche et remèdes !', 'Gotsumon');
      await DW.Game.push(new DW.ShopScene(['viande', 'super_viande', 'remede', 'medoc', 'bandage', 'reveil', 'cartes']));
      await say('Reviens vite !', 'Gotsumon');
    },
    async elecmon() {
      await say("Bienvenue au Dojo ! Grâce à mes conseils, chaque séance réussie rapporte un point d'entraînement de plus.", 'Elecmon');
      await say("Le Terrain d'entraînement est au sud de la ville, et mes mannequins juste là. Allez, au travail !", 'Elecmon');
    },
    async mushroomon() {
      const s = st();
      await say("Hihi ! Bienvenue au Restaurant aux Champignons !", 'Mushroomon');
      const r = await DW.ask('Commander un Champi-repas pour toute l\'équipe ? (80 Bits)');
      if (r !== 0) return;
      if (s.bits < 80) { await say("Tu n'as pas assez de Bits...", 'Mushroomon'); return; }
      s.bits -= 80;
      s.party.forEach(m => { m.addHappy(8); m.tired = 0; m.hunger = 0; });
      DW.Audio.sfx('heal');
      await say("Miam ! Toute l'équipe est ravie (bonheur +8) : plus de faim, et la fatigue s'est envolée !");
    },
    async yokomon() {
      await say("Le Jardin est l'endroit où se reposent les Digimon de ta DigiFerme.", 'Yokomon');
      await DW.Game.push(new DW.FarmScene());
    },
    async biyomon() {
      const r = await DW.ask('Cui cui ! Je peux te faire voler jusqu\'à un endroit que tu connais, ou te donner des nouvelles !', ['Vol rapide', 'Des nouvelles ?', 'Au revoir'], 'Biyomon');
      if (r === 0) { await flyMenu(); return; }
      if (r !== 1) return;
      await say('Cui cui ! Du courrier pour toi ? Hmm... Non, mais j\'ai des nouvelles !', 'Biyomon');
      const next = T().RECRUITS.find(x => !T().has(x.id));
      if (!next) { await say('Tout le monde est rentré en ville ! Quelle joie !', 'Biyomon'); return; }
      await say(`Un Digimon qui aimerait vivre ici a été vu du côté de « ${MAPS[next.zone].name} ». Va donc voir !`, 'Biyomon');
    },
    async kunemon() {
      await say('Bzzz... Bienvenue à la Banque ! Je garde tout ce que ton sac ne peut pas porter.', 'Kunemon');
      await DW.Game.push(new DW.BankScene());
      await say('À bientôt, bzzz !', 'Kunemon');
    },
    async betamon() {
      await say("Bloub ! La fontaine coule de nouveau. Bois son eau quand tu es fatigué !", 'Betamon');
    },
  };
  DW.Story.services = SERVICES;
  // vol rapide (comme Birdramon dans Digimon World) : lieux et régions déjà visités
  async function flyMenu() {
    const s = st(), R = DW.REGION_ENTRY || {};
    const dest = [['Ville des Fichiers', 'village', 20, 16], ['Village des Bébés', 'berceau', 18, 15], ['Plage des Cabines', 'plage', 20, 8], ["Clairière de l'Arrivée", 'clairiere', 17, 14]]
      .filter(([, id]) => s.visited[id]);
    for (const rid in R) {
      const subs = Object.keys(MAPS).filter(id => MAPS[id].region === rid && MAPS[id].spec);
      if (subs.some(id => s.visited[id])) { const m = MAPS[R[rid]]; dest.push([m.regionName, R[rid], m.spec.hub[0], m.spec.hub[1]]); }
    }
    let page = 0;
    for (;;) {
      const slice = dest.slice(page * 8, page * 8 + 8), more = dest.length > (page + 1) * 8;
      const opts = slice.map(d => d[0]).concat(more ? ['Plus loin...'] : [], ['Annuler']);
      const i = await DW.choose(opts, { y: 8 });
      if (i < 0 || opts[i] === 'Annuler') return;
      if (opts[i] === 'Plus loin...') { page++; continue; }
      const [name, id, x, y] = slice[i];
      await say(`Accroche-toi bien ! Direction : ${name} !`, 'Biyomon');
      DW.Audio.sfx('swoosh');
      await DW.fade(1, 0.5, '#ffffff');
      // case praticable la plus proche du point d'arrivée
      const m = DW.getMap(id), free = (X, Y) => X > 0 && Y > 0 && X < m.w - 1 && Y < m.h - 1 && !DW.SOLID.has(m.rows[Y][X]);
      let best = [x, y];
      for (let r = 0; r < 12 && !free(best[0], best[1]); r++)
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
          if (free(x + dx, y + dy) && !free(best[0], best[1])) best = [x + dx, y + dy];
      DW.ow.load(id, best[0], best[1], 'down');
      await DW.wait(0.3);
      await DW.fade(0, 0.6);
      return;
    }
  }
  async function fountainUse() {
    const s = st();
    if (!T().has('betamon')) { await say("La fontaine est à sec. Quelqu'un qui aime l'eau saurait peut-être la réparer..."); return; }
    const r = await DW.ask("L'eau claire de la fontaine scintille. Y abreuver tes Digimon ?");
    if (r !== 0) return;
    s.heal = { map: 'village', x: 20, y: 16 };
    await healAll('Tes Digimon sont en pleine forme !');
  }

  // ------------------------------------------------------------ définition
  MAPS.village = {
    name: 'Ville des Fichiers', music: 'village', bg: 'foret', ambient: 'town', theme: 'town', climate: 'village', region: 'village',
    ...DW.MapKit.DW1_GROUND,
    respawn: { map: 'maison', x: 12, y: 5 },
    build,
    onEnter: () => DW.Town.reveal(),
    rows: null, objects: [], npcs: [],
    warps: [{ x: 0, y: 13, w: 1, h: 3, dir: 'left', to: 'plage', tx: 39, ty: 1 }, { x: 11, y: 0, w: 2, h: 1, dir: 'up', to: 'residentiel', tx: 30, ty: 43 }, { x: 19, y: 29, w: 2, h: 1, dir: 'down', to: 'gym', tx: 15, ty: 0 },
      { x: 5, y: 29, w: 2, h: 1, dir: 'down', to: 'champs', tx: 5, ty: 0 }],
    doors: [],
    // la route de l'est (Montagne de l'Infini) est gardée par la porte de région (regions.js : GATE.montagne)
    triggers: [],
    signs: {},
  };
  build();

  // ------------------------------------------------------------ début de l'aventure (réveil chez Jijimon)
  DW.Story.opening = async () => {
    await DW.wait(0.6);
    await say('Mmh... Où est-ce que je suis ?');
    await say("Hohoho ! Tu es réveillé ? Bienvenue à la Ville des Fichiers, sur l'Île des Fichiers.", 'Jijimon');
    await say("Je suis Jijimon, le doyen de la ville. Je t'ai trouvé endormi près de la plage et je t'ai ramené chez moi.", 'Jijimon');
    await say("Une force mystérieuse a fait perdre la mémoire aux Digimon de l'île. Ils sont tous partis vivre à l'état sauvage... La ville tombe en ruines.", 'Jijimon');
    await say("Trois bébés Digimon t'attendent dehors, sur la place : Botamon, Pichimon et Yuramon. Va leur parler et choisis ton partenaire !", 'Jijimon');
    await say("(Déplacements : flèches ou ZQSD.  Courir : Maj.  Parler : ESPACE.  Menu : ENTRÉE.)");
    await DW.chooseRules();
  };
})();
