'use strict';
// =====================================================================
//  DONJONS SECRETS DES ÉCUSSONS — la quête des enfants perdus (voir data/ecussons.js)
//  Un donjon par DigiSélectionné, caché dans une région : un portail ancien gravé de son symbole
//  (pièce maîtresse d'une sous-zone, ajoutée par regions.js) mène à trois salles reliées :
//    hall (indice + énigme 1) → galerie (énigme 2) → sanctuaire (gardien à Engrenage Noir, puis l'enfant et son écusson).
//  Le donjon de ton propre héros ne contient que ton écusson.
//  Ajouter un donjon = ajouter une entrée à LIST (énigmes : voir maps/enigmes.js).
// =====================================================================
(function () {
  const { room, side } = DW.Palais;
  const E = DW.Enigmes, C = DW.Crests, MAPS = DW.MAPS;
  const say = (t, s) => DW.say(t, s);
  const W = 20, H = 15, MID = 7;   // pièces à la taille de l'écran (DW.Palais.room) ; passages latéraux en y = 7 et 8

  // ------------------------------------------------------------ les sept donjons
  // sub : sous-zone qui porte le portail ; guard : [espèce, bonus de niveau] ; a / b : énigmes du hall et de la galerie
  const LIST = [
    { kid: 'joe', region: 'montagne', sub: 6, name: 'Refuge du Glacier', guard: ['ogremon', 4],
      floor: ['#9aa4b0', '#7a8490', '#4a525c'], wall: ['#6a7480', '#5a6470', 'brick'], dark: 0.25,
      hint: 'Ici, la vérité ouvre les portes. Réponds sans mentir, puis marche sur les dalles qui se souviennent.',
      a: { type: 'riddle', q: 'Plus on en prend, plus on en laisse derrière soi. Que suis-je ?', choices: ['Des pas', 'Des Bits', 'Des souvenirs'], answer: 0 },
      b: { type: 'plates', spots: [[5, 5], [14, 5], [9, 11]] },
      words: ["Ah ! Enfin quelqu'un ! Je suis Joe... J'ai cru que j'allais rester enfermé ici pour toujours.", "Une ombre m'a poussé dans ce refuge, et ces barrières se sont fermées derrière moi. Merci, vraiment !"] },
    { kid: 'tk', region: 'brumes', sub: 9, name: 'Chapelle des Brumes', guard: ['bakemon', 4],
      floor: ['#7a6a9a', '#5a4a7a', '#2a2040'], wall: ['#4a3a6a', '#3a2e5a', 'diamond'], dark: 0.4,
      hint: 'Le soleil se lève à l\'est, monte tout en haut du ciel, puis se couche à l\'ouest.',
      a: { type: 'braziers', spots: [[5, 6], [9, 4], [14, 6]], order: [2, 1, 0] },
      b: { type: 'riddle', q: 'Je brille même dans la nuit la plus noire, et je grandis quand on me partage. Que suis-je ?', choices: ['La lune', "L'espoir", 'Une lanterne'], answer: 1 },
      words: ["C'est toi ! Je savais que quelqu'un viendrait ! Moi c'est T.K.", "Il faisait tout noir et les fantômes chantaient... mais je n'ai pas pleuré. Enfin... presque pas."] },
    { kid: 'sora', region: 'volcan', sub: 5, name: 'Nid de Braises', guard: ['meramon', 5],
      floor: ['#8a4a3a', '#6a3226', '#2a120c'], wall: ['#6a3a2e', '#5a2e24', 'brick'], dark: 0.3,
      hint: "Les vasques entourent le cœur du nid. L'amour part du cœur — la flamme du bas — puis fait le tour dans le sens des aiguilles d'une montre.",
      a: { type: 'plates', spots: [[4, 5], [15, 5], [4, 11], [15, 11]] },
      b: { type: 'braziers', spots: [[9, 4], [14, 8], [9, 12], [4, 8]], order: [2, 3, 0, 1] },
      words: ["Merci... Je m'appelle Sora. Il faisait si chaud ici que je n'arrivais plus à réfléchir.", "Tu es venu jusqu'ici tout seul ? Tu es quelqu'un de bien, tu sais."] },
    { kid: 'izzy', region: 'usine', sub: 6, name: 'Archives de Données', guard: ['kabuterimon', 4],
      floor: ['#5a6a7a', '#3e4c5a', '#1a222c'], wall: ['#4a5a6a', '#3a4856', 'stripes'], dark: 0.2,
      hint: "Journal de maintenance : « Séquence d'allumage : la deuxième, puis la quatrième, puis la première, et enfin la troisième (en comptant depuis la gauche). »",
      a: { type: 'riddle', q: 'Code de la porte : 1, 2, 4, 8... Quel est le nombre suivant ?', choices: ['12', '16', '10'], answer: 1 },
      b: { type: 'braziers', spots: [[4, 5], [8, 5], [12, 5], [16, 5]], order: [1, 3, 0, 2] },
      words: ["Fascinant ! Ces barrières de données tournaient en boucle... Je n'arrivais pas à casser le code de l'intérieur.", 'Je suis Izzy. Ton Digivice a forcé le système, on dirait. Il faudra que je l\'étudie !'] },
    { kid: 'mimi', region: 'jouets', sub: 8, name: 'Jardin Secret des Jouets', guard: ['togemon', 4],
      floor: ['#f0c8e0', '#d8a8c8', '#a87898'], wall: ['#f0b8d8', '#e0a0c8', 'dots'], dark: 0,
      hint: "Une fleur s'ouvre du cœur vers les pétales : d'abord le centre, puis la gauche, puis la droite.",
      a: { type: 'braziers', spots: [[5, 6], [9, 6], [14, 6]], order: [1, 0, 2] },
      b: { type: 'plates', spots: [[3, 4], [16, 4], [9, 7], [3, 11], [16, 11]] },
      words: ["Oh là là, enfin ! Je suis Mimi ! Les jouets ne voulaient plus me laisser partir, ils voulaient que je joue avec eux pour toujours...", 'Mes chaussures sont toutes sales ! Mais bon, merci quand même. Beaucoup !'] },
    { kid: 'matt', region: 'gel', sub: 8, name: 'Palais de Givre', guard: ['garurumon', 4],
      floor: ['#c8e0f0', '#a0c4dc', '#6890b0'], wall: ['#a8c8e0', '#90b4d0', 'diamond'], dark: 0.15,
      hint: "Sur la glace, chaque dalle garde l'empreinte d'un ami. Marche sur toutes, puis réponds à la stèle de la galerie.",
      a: { type: 'plates', spots: [[3, 5], [16, 5], [6, 9], [13, 9], [9, 12]] },
      b: { type: 'riddle', q: "On ne me voit pas, mais je relie deux cœurs, même très loin l'un de l'autre. Que suis-je ?", choices: ['Un câble', "L'amitié", 'Le vent'], answer: 1 },
      words: ['...Merci. Je suis Matt.', "Tu n'aurais pas vu mon petit frère, T.K. ? S'il lui arrive quelque chose..."] },
    { kid: 'tai', region: 'dino', sub: 8, name: 'Temple du Courage', guard: ['greymon', 6],
      floor: ['#a88a5a', '#86683e', '#3e2e18'], wall: ['#8a6a44', '#765836', 'brick'], dark: 0.3,
      hint: "Cinq flammes, comptées depuis la gauche. Les impaires d'abord, de droite à gauche ; puis les paires, de gauche à droite.",
      a: { type: 'braziers', spots: [[3, 6], [6, 6], [9, 6], [12, 6], [15, 6]], order: [4, 2, 0, 1, 3] },
      b: { type: 'riddle', q: "Ce n'est pas l'absence de peur, c'est avancer malgré elle. Qu'est-ce que c'est ?", choices: ['La colère', 'Le courage', 'La chance'], answer: 1 },
      words: ["Ouf ! Merci ! Moi c'est Tai !", "J'ai foncé tête baissée dans ce temple... et les portes se sont refermées. Bon, ça m'apprendra à réfléchir un peu avant !"] },
  ];
  const IDX = k => C.ORDER.indexOf(k);
  const lvOf = rid => ((DW.Wild && DW.Wild.TABLES[rid]) || [10])[0];
  const encOf = rid => {
    const T = DW.Wild && DW.Wild.TABLES[rid];
    if (!T) return [];
    return T[1].split(/\s+/).filter(t => !t.includes('@')).slice(0, 3).map(t => { const [sp, w] = t.split(':'); return { sp, min: T[0], max: T[0] + 2, w: parseInt(w, 10) }; }).filter(e => DW.SPECIES[e.sp]);
  };

  // ------------------------------------------------------------ construction d'un donjon
  function build(D) {
    const id = 'donjon_' + D.kid, R = D.region, k = D.kid, crest = C.name(k);
    const floor = { type: 'stone', cols: D.floor }, wall = { base: D.wall[0], alt: D.wall[1], pattern: D.wall[2], wood: D.floor[2] };
    const dark = D.dark ? { d: D.dark, col: D.wall[1] } : null, enc = encOf(R);
    const hall = room(id + '_hall', R, { name: `${D.name} — Entrée`, w: W, h: H, floor, wall, dark, enc,
      objects: [{ kind: 'torch', x: 2, y: 3, w: 1, h: 1, small: true }, { kind: 'torch', x: 17, y: 3, w: 1, h: 1, small: true }, { kind: 'gargoyle', x: 2, y: 11, w: 1, h: 1 }] });
    const gal = room(id + '_galerie', R, { name: `${D.name} — Galerie`, w: W, h: H, floor, wall, dark, enc,
      objects: [{ kind: 'torch', x: 2, y: 3, w: 1, h: 1, small: true }, { kind: 'torch', x: 17, y: 3, w: 1, h: 1, small: true }] });
    const sanc = room(id + '_sanctuaire', R, { name: `${D.name} — Sanctuaire`, w: W, h: H, floor, wall, dark: dark ? { d: dark.d * 0.6, col: dark.col } : null,
      objects: [{ kind: 'pedestal', v: IDX(k), x: 9, y: 4, w: 1, h: 1 }, { kind: 'gargoyle', x: 4, y: 4, w: 1, h: 1 }, { kind: 'gargoyle', x: 15, y: 4, w: 1, h: 1 }] });
    sanc.calm = true;   // aucun Digimon sauvage dans le sanctuaire
    side(id + '_hall', id + '_galerie'); side(id + '_galerie', id + '_sanctuaire');
    DW.Palais.entrance(id + '_hall');
    // énigmes et barrières (devant chaque passage vers la salle suivante)
    const puzzle = (m, P, pid) => {
      if (P.type === 'riddle') E.riddle(m, pid, 9, 9, P);
      else if (P.type === 'braziers') E.braziers(m, pid, P.spots, P.order, D.hint);
      else if (P.type === 'plates') E.plates(m, pid, P.spots);
      E.barrier(m, pid, [[W - 2, MID], [W - 2, MID + 1]]);
    };
    E.stele(hall, 4, 4, `Une stèle ancienne, gravée du symbole de l'écusson ${crest} : « ${D.hint} »`);
    puzzle(hall, D.a, id + '_a'); puzzle(gal, D.b, id + '_b');
    // sanctuaire : gardien possédé, puis l'enfant (ou ton écusson seul)
    const gk = id + '_gardien', guardLv = lvOf(R) + D.guard[1], gName = DW.SPECIES[D.guard[0]].name;
    sanc.npcs.push({ sp: D.guard[0], x: 9, y: 9, face: 'down', gear: true, cond: () => !E.solved(gk), talk: async ow => {
      await say(`Un Engrenage Noir tourne dans le dos de ${gName}... Il garde le sanctuaire.`);
      await say('PERSONNE... NE PASSE...', gName);
      if (!DW.state.party.some(m => m.hp > 0)) { await say('Il te faut un Digimon en forme pour l\'affronter !'); return; }
      if ((await DW.ask(`Affronter ${gName} ?`)) !== 0) return;
      const res = await ow.battle({ enemy: new DW.Digimon(D.guard[0], guardLv), boss: true, canLose: true, intro: `${gName}, possédé, défend le sanctuaire !` });
      if (res !== 'win') { await say(`${gName} est trop fort pour l'instant... Entraîne-toi et reviens.`); return; }
      await E.solve(gk, ow, `L'Engrenage Noir se brise ! ${gName} reprend ses esprits et s'éloigne en titubant.`);
    } });
    const own = () => DW.state.hero === k;
    const takeCrest = async ow => {
      if (C.has(k)) { await say(`Le piédestal est vide. L'écusson ${crest} est avec toi.`); return; }
      if (!E.solved(gk)) { await say(`${gName} se dresse entre toi et le piédestal...`); return; }
      C.give(k); DW.Audio.sfx('fanfare'); if (ow) ow.shake = 0.4;
      const ults = C.ULTIMES[k].map(sp => DW.SPECIES[sp].name).join(', ');
      await say(`Tu obtiens l'écusson ${crest} !`);
      await say(`Le Digivice s'illumine : les Digimon de cette famille peuvent désormais digivoluer au stade Ultime (${ults}).`);
      if (C.count() === C.ORDER.length) await say('Les sept écussons brillent ensemble... La Digivolution Méga est désormais possible !');
      DW.autosave();
    };
    sanc.signs['9,4'] = async ow => {
      if (!own() && !C.kidFound(k)) { await say("Un écusson repose sur le piédestal... mais quelqu'un est enfermé ici. Parle-lui d'abord !"); return; }
      if (own() && !C.has(k)) await say(`Ton Digivice vibre... Cet écusson t'attendait depuis le début : c'est le tien.`);
      await takeCrest(ow);
    };
    sanc.npcs.push({ hero: k, x: 11, y: 6, face: 'down', cond: s => s.hero !== k && !(s.kids || {})[k], talk: async ow => {
      const name = DW.HEROES[k].name;
      if (!E.solved(gk)) { await say(`À l'aide ! ${gName} ne me laisse pas sortir !`, name); return; }
      for (const l of D.words) await say(l, name);
      await say(`Tiens, cet écusson brillait à côté de moi depuis que je suis ici. C'est l'écusson ${crest}... Il sera plus utile avec toi et ton partenaire.`, name);
      C.freeKid(k);
      await takeCrest(ow);
      await say(`Je rentre à la Ville des Fichiers, chez Jijimon. On se retrouve là-bas ! Les autres enfants sont peut-être encore quelque part sur l'île...`, name);
      DW.autosave();
    } });
  }
  LIST.forEach(build);

  // ------------------------------------------------------------ les enfants délivrés attendent chez Jijimon
  const HOME_SPOTS = [[2, 8], [3, 10], [5, 10], [10, 10], [12, 10], [13, 6], [11, 6]];
  const HOME_WORDS = {
    tai: "Dès que ton Digimon sera prêt, on ira botter les fesses de Devimon !", matt: "Si tu croises T.K., dis-lui que je l'attends ici.",
    sora: "Prends soin de ton partenaire. Il compte sur toi, tu sais.", izzy: "J'analyse les données de nos écussons. Chaque famille de Digimon y réagit différemment !",
    mimi: "Jijimon fait des gâteaux à la viande... Bof. Mais il est gentil !", joe: "Tu es sûr qu'il n'y a pas de danger dehors ? Fais attention à toi, d'accord ?",
    tk: "Quand je serai grand, je serai aussi courageux que toi !",
  };
  if (MAPS.maison) C.ORDER.forEach((k, i) => MAPS.maison.npcs.push({ hero: k, x: HOME_SPOTS[i][0], y: HOME_SPOTS[i][1], face: 'down',
    cond: s => s.hero !== k && !!(s.kids || {})[k], talk: () => say(HOME_WORDS[k], DW.HEROES[k].name) }));

  // ------------------------------------------------------------ portails dans les régions (lus par regions.js)
  DW.Donjons = {
    LIST,
    // pièce maîtresse de la sous-zone (rid, i) si un donjon s'y trouve
    pieceFor(rid, i) {
      const D = LIST.find(d => d.region === rid && d.sub === i);
      if (!D) return null;
      return { piece: { kind: 'crestgate', v: IDX(D.kid), w: 5, h: 4, door: { to: 'donjon_' + D.kid + '_hall', dw: 2 } },
        pieceSign: `Un portail ancien, à moitié caché par le lierre. Au-dessus, un symbole luit faiblement : l'écusson ${C.name(D.kid)}. « ${D.name} »` };
    },
  };
})();
