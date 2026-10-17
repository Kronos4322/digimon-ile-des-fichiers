'use strict';
// =====================================================================
//  MAISON DU JOUEUR — à l'est de la maison de Jijimon (Ville des Fichiers)
//  On l'aménage en achetant des meubles au Bazar de Gotsumon (rayon « Meubles »).
//  Chaque meuble sert vraiment : lit (repos, soins, sauvegarde), coffre (objets en trop),
//  frigo (en-cas du jour), cuisine (recettes), haltères (entraînement maison), télé (rumeurs),
//  ordinateur (DigiFerme), bibliothèque (discipline), aquarium et plantes (bonheur), toilettes.
//  Certains achats OUVRENT UNE PIÈCE : toilettes → Salle de bain, frigo ou cuisine → Cuisine,
//  coin musculation → Salle de sport (une porte apparaît dans le mur du salon).
//  Quand le salon est aménagé (télévision + canapé), la maison prend un ÉTAGE : la chambre y monte (lit),
//  avec le grenier au-dessus ; on peut alors offrir sa propre chambre à son Digimon. La cave aux trophées
//  s'ouvre avec le premier trophée.
// =====================================================================
(function () {
  const { say, st, healAll } = DW.MapKit;
  const MAPS = DW.MAPS;
  const W = 16, H = 12, DOOR_X = 7;
  const day = () => DW.Time.day();
  const lead = () => st().party[0];
  // une fois par jour et par meuble
  const once = key => { const s = st(), h = s.home; if (!h.used || h.used.day !== day()) h.used = { day: day(), k: [] }; if (h.used.k.includes(key)) return false; h.used.k.push(key); return true; };

  // ------------------------------------------------------------ catalogue des meubles (prix, objet posé, usage)
  const FURN = {
    lit:      { name: 'Lit douillet', price: 0, room: () => (upstairs() ? 'chambre' : null), objs: [{ kind: 'bed', x: 1, y: 3, w: 2, h: 2 }], desc: 'Dormir : soigne toute l\'équipe, sauvegarde, et fait passer la nuit.' },
    coffre:   { name: 'Coffre', price: 0, objs: [{ kind: 'chest', x: 1, y: 6, w: 1, h: 1, small: true }], desc: 'Range les objets que ton sac ne peut pas porter.' },
    toilettes:{ name: 'Toilettes privées', price: 600, room: 'sdb', objs: [{ kind: 'toiletroom', x: 6, y: 3, w: 2, h: 1 }], desc: 'Des toilettes rien qu\'à vous : plus besoin de courir dehors !' },
    plantes:  { name: 'Plantes vertes', price: 500, objs: [{ kind: 'bigplant', x: 14, y: 10, w: 1, h: 1, small: true }, { kind: 'flowerpots', v: 1, x: 3, y: 6, w: 2, h: 1 }], desc: 'Les arroser chaque jour rend ton partenaire heureux (bonheur +3).' },
    frigo:    { name: 'Réfrigérateur', price: 1200, room: 'cuisine', objs: [{ kind: 'fridge', x: 10, y: 3, w: 1, h: 1, small: true }], desc: 'Range ta nourriture (le coffre n\'en veut pas), 20 de chaque. Et chaque jour, un en-cas s\'y trouve !' },
    tele:     { name: 'Télévision', price: 1000, objs: [{ kind: 'crttv', x: 5, y: 3, w: 2, h: 1 }], desc: 'Les nouvelles de l\'île et des rumeurs. Regarder ensemble rend heureux.' },
    biblio:   { name: 'Bibliothèque', price: 1500, objs: [{ kind: 'bookshelf', v: 1, x: 3, y: 3, w: 2, h: 1 }], desc: 'Lire une histoire chaque jour à ton partenaire : discipline +5.' },
    cuisine:  { name: 'Cuisine équipée', price: 2500, room: 'cuisine', objs: [{ kind: 'kitchen', x: 4, y: 3, w: 4, h: 1 }], desc: 'Cuisine tes recettes à la maison, quand tu veux.' },
    // salle de sport : le matériel s'améliore (une séance de plus par jour et un point de plus par séance à chaque niveau)
    sport2:   { name: 'Banc de musculation pro', price: 5000, room: 'sport', needs: () => owned('halteres'), objs: [{ kind: 'weights', x: 8, y: 4, w: 1, h: 1, small: true }, { kind: 'punchbag', x: 11, y: 4, w: 1, h: 1, small: true }, { kind: 'cushion', v: 1, x: 9, y: 4, w: 1, h: 1, small: true }], desc: 'Matériel de pro : 2 séances par jour à la maison, +3 points chacune.' },
    sport3:   { name: 'Salle de sport complète', price: 12000, room: 'sport', needs: () => owned('sport2'), objs: [{ kind: 'dummy', x: 3, y: 8, w: 1, h: 1, small: true }, { kind: 'datacrystal', x: 7, y: 8, w: 1, h: 1, small: true }, { kind: 'hurdle', x: 11, y: 8, w: 1, h: 1, small: true }], desc: 'Tout le matériel du Terrain d\'entraînement : 3 séances par jour, +4 points chacune.' },
    halteres: { name: 'Coin musculation', price: 3000, room: 'sport', objs: [{ kind: 'weights', x: 3, y: 4, w: 1, h: 1, small: true }, { kind: 'cushion', x: 5, y: 4, w: 1, h: 1, small: true }], desc: 'Un entraînement maison par jour : +2 points dans la statistique de ton choix (fatigue).' },
    aquarium: { name: 'Aquarium', price: 2000, objs: [{ kind: 'aquarium', x: 11, y: 10, w: 3, h: 1 }], desc: 'Regarder les poissons détend : bonheur +5 une fois par jour.' },
    ordi:     { name: 'Ordinateur', price: 4000, objs: [{ kind: 'computer', x: 11, y: 7, w: 2, h: 1 }], desc: 'Gère ta DigiFerme depuis la maison.' },
    tapis:    { name: 'Grand tapis et canapé', price: 1800, objs: [{ kind: 'bigrug', v: 1, x: 2, y: 7, w: 4, h: 2, walk: true }, { kind: 'sofa', v: 0, x: 1, y: 10, w: 3, h: 1 }], desc: 'Un salon confortable : ton partenaire se repose mieux (le lit rend aussi +5 de bonheur).' },
    sac1:     { name: 'Grand sac de voyage', price: 1500, objs: [], desc: 'Ton sac peut contenir 4 sortes d\'objets de plus (24).' },
    sac2:     { name: 'Sac d\'explorateur', price: 5000, objs: [], desc: 'Encore 4 sortes d\'objets de plus dans ton sac (28).' },
    chambre_digi: { name: 'Chambre de ton Digimon', price: 2500, room: 'digi', needs: () => upstairs(), objs: [{ kind: 'bed', x: 6, y: 3, w: 2, h: 2 }, { kind: 'toybox', x: 2, y: 3, w: 2, h: 1 }, { kind: 'cushion', v: 1, x: 3, y: 6, w: 1, h: 1, small: true }], desc: 'Une chambre à l\'étage rien que pour ton partenaire : il y dort, ou s\'y repose une heure quand il n\'a pas sommeil.' },
    tableau:  { name: 'Tableaux', price: 800, objs: [{ kind: 'painting', v: 0, x: 9, y: 1, w: 2, h: 1, back: true, oy: 6 }, { kind: 'painting', v: 1, x: 12, y: 1, w: 2, h: 1, back: true, oy: 6 }], desc: 'De beaux tableaux aux murs. Pour le plaisir des yeux.' },
  };
  const ORDER = Object.keys(FURN);
  const owned = id => !!(st().home && st().home.owned[id]);
  // la télévision OU le canapé aménagent le salon, ou un enfant délivré vient habiter chez toi : la maison prend un étage (ta chambre et celles des enfants)
  const KIDS_HOME = ['tai', 'matt'];
  const kidsHere = () => KIDS_HOME.filter(k => !!(st().kids || {})[k] && st().hero !== k);
  const upstairs = () => owned('tele') || owned('tapis') || KIDS_HOME.some(k => !!(st().kids || {})[k] && st().hero !== k);
  const roomOf = id => (typeof FURN[id].room === 'function' ? FURN[id].room() : FURN[id].room) || null;
  // pièces annexes : ouvertes par un achat ; porte dans le mur gauche ou droit du salon (side), à la hauteur y
  const ROOMS = {
    sdb:     { name: 'Salle de bain', from: 'salon', at: { wall: 'left', y: 8 }, w: 10, h: 8, by: ['toilettes'], floor: { type: 'tile', cols: ['#e8f4f8', '#c8dce8', '#9ab8cc'] }, wall: { base: '#e4f2f8', alt: '#cfe4ee', pattern: 'diamond', wood: '#5a8aa8' },
      decor: [{ kind: 'bigrug', v: 0, x: 2, y: 5, w: 3, h: 1, walk: true }, { kind: 'bigplant', x: 8, y: 6, w: 1, h: 1, small: true }, { kind: 'shelf', x: 2, y: 1, w: 2, h: 1, back: true, oy: 6 }] },
    cuisine: { name: 'Cuisine', from: 'salon', at: { wall: 'right', y: 8 }, w: 12, h: 8, by: ['frigo', 'cuisine'], floor: { type: 'tile', cols: ['#f4e4c4', '#dcc49c', '#b49a70'] }, wall: { base: '#fff4e0', alt: '#f4e4c4', pattern: 'stripes', wood: '#a8703a' },
      decor: [{ kind: 'table', x: 5, y: 5, w: 2, h: 1 }, { kind: 'stool', x: 4, y: 5, w: 1, h: 1, small: true }, { kind: 'stool', x: 7, y: 5, w: 1, h: 1, small: true }, { kind: 'shelf', x: 8, y: 1, w: 2, h: 1, back: true, oy: 6 }] },
    sport:   { name: 'Salle de sport', from: 'salon', at: { wall: 'right', y: 4 }, w: 16, h: 11, by: ['halteres'], floor: { type: 'herring', cols: ['#c8a070', '#a07a4a', '#6a4e2e'] }, wall: { base: '#e8ecf4', alt: '#d4dae6', pattern: 'stripes', wood: '#4a5a7a' },
      decor: [{ kind: 'bigrug', v: 2, x: 2, y: 5, w: 4, h: 2, walk: true }, { kind: 'bigplant', x: 1, y: 6, w: 1, h: 1, small: true }] },
    // la GRANDE SALLE À MANGER : elle s'ouvre dès qu'un enfant délivré vit chez toi ; tout le monde y mange
    salle:   { name: 'Grande salle à manger', from: 'salon', at: { wall: 'left', y: 4 }, w: 22, h: 13, by: [], open: () => kidsHere().length > 0,
      floor: { type: 'herring', cols: ['#b88a58', '#94683c', '#5e4026'] }, wall: { base: '#f4e4cc', alt: '#e8d2b0', pattern: 'stripes', wood: '#7a4a2a' },
      decor: [{ kind: 'fireplace', x: 9, y: 3, w: 3, h: 1 }, { kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 16, y: 1, w: 2, h: 2, back: true, oy: -6 },
        { kind: 'longtable', x: 7, y: 7, w: 8, h: 1 }, ...[7, 9, 11, 13].flatMap(x => [{ kind: 'stool', x, y: 6, w: 1, h: 1, small: true }, { kind: 'stool', x: x + 1, y: 8, w: 1, h: 1, small: true }]),
        { kind: 'bigplant', x: 1, y: 10, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 19, y: 10, w: 1, h: 1, small: true }, { kind: 'clock', x: 14, y: 3, w: 1, h: 1, small: true }] },
    // chambre de Tai : elle apparaît quand Tai est délivré (antre de Shellmon) ; décor de Tai (ballon, lunettes, posters orange)
    // chambres de l'étage : une porte chacune dans le couloir (ta chambre, celle de ton Digimon, puis celles des enfants délivrés)
    chambre: { name: 'Ma chambre', from: 'etage', w: 12, h: 9, by: [], open: () => upstairs(),
      floor: { type: 'carpet', cols: ['#c8a0d8', '#a880bc', '#7a5a90'] }, wall: { base: '#f8eef4', alt: '#ecdce8', pattern: 'dots', wood: '#8a5a7a' },
      decor: [{ kind: 'window', v: 0, x: 6, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'bigrug', v: 2, x: 5, y: 4, w: 4, h: 2, walk: true }, { kind: 'bigplant', x: 10, y: 6, w: 1, h: 1, small: true }] },
    tai:     { name: 'Chambre de Tai', from: 'etage', w: 10, h: 8, by: [], open: () => !!(st().kids || {}).tai && st().hero !== 'tai',
      floor: { type: 'herring', cols: ['#d8a868', '#b07e48', '#7a5430'] }, wall: { base: '#fff0d8', alt: '#ffe0b0', pattern: 'stripes', wood: '#e8822a' },
      decor: [{ kind: 'bed', x: 6, y: 3, w: 2, h: 2 }, { kind: 'poster', v: 0, x: 2, y: 1, w: 1, h: 1, back: true, oy: 15 }, { kind: 'poster', v: 1, x: 4, y: 1, w: 1, h: 1, back: true, oy: 15 },
        { kind: 'bigrug', v: 1, x: 3, y: 5, w: 3, h: 1, walk: true }, { kind: 'toybox', x: 2, y: 3, w: 2, h: 1 }],
      npcs: [{ hero: 'tai', x: 4, y: 4, face: 'down', wander: 1, talk: async () => {
        const s = st();
        if ((s.flags.chapter || 1) >= 2 && !s.flags.taiLead) {
          s.flags.taiLead = true;
          await DW.say("Écoute ! Un Gomamon de la plage m'a raconté qu'un garçon blond a été vu près du grand lac, au nord-ouest...", 'Tai');
          await DW.say("Il avait l'air de chercher quelqu'un. C'est sûrement Matt ! Mais un énorme serpent de mer garde le lac... Fais attention.", 'Tai');
          return;
        }
        return DW.say(DW.pick([
        "Je m'entraîne au Terrain un jour sur deux, en journée. Viens me voir : on bossera ensemble, ou on fera un match !",
        "Merci encore pour l'antre de Shellmon ! J'ai cru qu'on n'en sortirait jamais.", "Agumon dort comme une souche depuis qu'on est ici. Greymon, ça fatigue !",
        "Si on retrouve Matt, il va être vert de jalousie de ma nouvelle chambre !", "Mon écusson... Jijimon dit qu'il doit être caché quelque part sur l'île. Un jour, on le trouvera !",
        "Le foot me manque. Tu crois qu'on pourrait faire une partie avec les Digimon de la ville ?",
        "Tu as entendu ? Les cabines de la plage se sont remises à sonner... Shellmon est revenu dans son antre. Parfait pour s'entraîner !"]), 'Tai'); } },
        { sp: 'agumon', x: 7, y: 5, face: 'left', wander: 1, talk: () => DW.say('Tu as quelque chose à manger ? Moi, j\'ai toujours faim !', 'Agumon') }] },
    // chambre de Matt : elle apparaît quand Matt est délivré (Lac du Tramway, chapitre 2) ; décor bleu, son harmonica
    matt:    { name: 'Chambre de Matt', from: 'etage', w: 10, h: 8, by: [], open: () => !!(st().kids || {}).matt && st().hero !== 'matt',
      floor: { type: 'herring', cols: ['#b8b0a0', '#908878', '#5a5448'] }, wall: { base: '#dce8f8', alt: '#c4d6f0', pattern: 'stripes', wood: '#3a5a9a' },
      decor: [{ kind: 'bed', x: 2, y: 3, w: 2, h: 2 }, { kind: 'poster', v: 1, x: 5, y: 1, w: 1, h: 1, back: true, oy: 15 }, { kind: 'poster', v: 0, x: 7, y: 1, w: 1, h: 1, back: true, oy: 15 },
        { kind: 'bigrug', v: 0, x: 4, y: 5, w: 3, h: 1, walk: true }, { kind: 'shelf', x: 6, y: 1, w: 2, h: 1, back: true, oy: 6 }],
      npcs: [{ hero: 'matt', x: 5, y: 4, face: 'down', wander: 1, talk: async () => DW.say(DW.pick([
        "Merci pour l'autre nuit. Sans toi et Garurumon, Seadramon m'aurait broyé...",
        "TK est quelque part sur l'île. Il est petit, il doit avoir peur... Si tu entends parler d'un garçon avec un bob vert, préviens-moi.",
        "Tai ronfle. Même à travers le mur. Je te jure.", "Cet harmonica, c'est tout ce qu'il me reste de la maison... Je joue le soir, pour que TK l'entende, peut-être.",
        "Gabumon refuse de quitter sa fourrure. Même quand il fait chaud. Allez comprendre."]), 'Matt') },
        { sp: 'gabumon', x: 7, y: 5, face: 'left', wander: 1, talk: () => DW.say(DW.pick(['Ne dis pas à Matt que je trouve sa musique très belle... Il serait gêné.', "Garurumon, c'était moi ! J'ai encore du mal à y croire."]), 'Gabumon') }] },
    digi:    { name: 'Chambre du Digimon', from: 'etage', w: 10, h: 8, by: ['chambre_digi'], floor: { type: 'carpet', cols: ['#bfe0f8', '#a0c8ec', '#f8f8ff'] }, wall: { base: '#fff0f6', alt: '#f8dce8', pattern: 'dots', wood: '#c86a9a' },
      decor: [{ kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'bigrug', v: 0, x: 4, y: 5, w: 3, h: 1, walk: true }] },
  };
  const fromOf = r => (ROOMS[r].from === 'etage' ? 'maison_joueur_etage' : 'maison_joueur');
  // case du salon devant la porte d'une pièce du rez-de-chaussée (en sortant de la pièce, on réapparaît là)
  const salonSpot = r => { const A = ROOMS[r].at; return A.wall === 'left' ? [1, A.y] : [W - 2, A.y]; };
  const FW = { maison_joueur: W };
  const roomOpen = r => (ROOMS[r].open ? ROOMS[r].open() : ROOMS[r].by.some(owned));
  const roomId = r => `maison_joueur_${r}`;
  // pose les meubles d'une pièce (salon ou annexe) et leurs zones d'usage
  function furnish(m, room) {
    for (const id of ORDER) if (owned(id) && roomOf(id) === room) for (const o of FURN[id].objs) {
      m.objects.push({ ...o });
      if (o.back || o.walk) continue;
      for (let x = o.x; x < o.x + (o.w || 1); x++) m.signs[`${x},${o.y + (o.h || 1) - 1}`] = () => USE[id]();
    }
  }

  // ------------------------------------------------------------ usages
  const USE = {
    // le lit : dormir si le partenaire a sommeil (soins complets, sauvegarde), sinon se reposer une heure
    async lit() {
      const s = st();
      const r = await DW.Life.restOrSleep();
      if (!r) return;
      s.heal = { map: 'maison_joueur', x: 3, y: 5 };
      if (r === 'sleep') {
        if (owned('tapis')) s.party.forEach(m => m.addHappy(5));
        await healAll('Bonne nuit... Toute l\'équipe se réveille en pleine forme !');
        DW.autosave();
        await say('(Partie sauvegardée.)');
      }
    },
    async chambre_digi() { const m = lead(); if (m) m.addHappy(1); await DW.Life.restOrSleep(); },
    async coffre() { await DW.Game.push(new DW.BankScene({ title: 'COFFRE' })); },   // tout sauf la nourriture
    async toilettes() { await DW.Care.toilet(); },
    async plantes() {
      if (!once('plantes')) { await say('Les plantes sont bien arrosées. Elles ont l\'air heureuses.'); return; }
      st().party.forEach(m => m.addHappy(3)); DW.Audio.sfx('water');
      await say('Tu arroses les plantes avec ton partenaire. Ça sent bon la terre mouillée ! (bonheur +3)');
    },
    async frigo() {
      const r = await DW.ask('Le réfrigérateur ronronne doucement.', ['Ranger / prendre', 'L\'en-cas du jour', 'Fermer']);
      if (r === 0) { await DW.Game.push(new DW.BankScene({ title: 'FRIGO', store: 'fridge' })); return; }
      if (r !== 1) return;
      if (!once('frigo')) { await say('Tu as déjà pris l\'en-cas du jour. Il y en aura un autre demain.'); return; }
      const id = DW.pick(['viande', 'viande', 'pain', 'brioche', 'pomme_bleue', 'baie_rouge', 'digichampi', 'croissant']);
      const extra = DW.giveItem(id); DW.Audio.sfx('buy');
      await say(`Dans le frigo : ${DW.ITEMS[id].name} !${DW.extraMsg(extra)}`);
    },
    async tele() {
      await say(DW.pick([
        'Météo de l\'île : « ' + DW.Time.weatherName() + ' » en ce moment. Saison : ' + DW.Time.date().seasonName + '.',
        'Flash spécial : des Engrenages Noirs auraient été vus dans les régions lointaines...',
        'Recette du jour : viande + piment de Meramon = Brochette pimentée ! Ça donne de la force.',
        'Le saviez-vous ? Un Digimon bien discipliné obéit mieux en combat.',
        'Interview de Jijimon : « La ville grandit grâce à vous tous, hohoho ! »',
        'Rubrique pêche : les gros poissons mordent surtout le matin.',
        'Pub : « Bazar de Gotsumon, tout pour la maison ! »',
      ]));
      if (once('tele') && lead()) { lead().addHappy(3); await say(`${lead().name} a adoré regarder la télé avec toi ! (bonheur +3)`); }
    },
    async biblio() {
      const m = lead(); if (!m) return;
      if (!once('biblio')) { await say(`${m.name} a déjà eu son histoire aujourd'hui.`); return; }
      DW.Life && DW.Life.addDisc ? DW.Life.addDisc(m, 5) : (m.disc = Math.min(100, (m.disc || 0) + 5));
      await say(`Tu lis « ${DW.pick(['Les Sept Écussons', 'Le Digivice perdu', 'La légende du Pont de l\'Infini', 'Agumon et le grand gâteau'])} » à ${m.name}. Il écoute très sagement. (discipline +5)`);
    },
    async cuisine() { if (!DW.Cuisine.known().length) { await say('Une belle cuisine... mais tu ne connais encore aucune recette. Mushroomon, au Restaurant, peut t\'en apprendre !'); return; } await DW.Cuisine.cook('Maison'); },
    async sport2() { await USE.halteres(); },
    async sport3() { await USE.halteres(); },
    async halteres() {
      const m = lead(); if (!m) return;
      const lv = owned('sport3') ? 3 : owned('sport2') ? 2 : 1, used = ['halteres', 'halteres2', 'halteres3'].slice(0, lv).find(k => once(k));
      if (!used) { await say(`${m.name} s'est déjà entraîné ${lv > 1 ? lv + ' fois' : ''} à la maison aujourd'hui.${lv < 3 ? ' (Un meilleur matériel, au Bazar, permet plus de séances.)' : ''}`); return; }
      const K = ['hp', 'mp', 'atk', 'def', 'spd', 'int'], NAMES = ['PV', 'PM', 'Attaque', 'Défense', 'Vitesse', 'Intelligence'];
      const i = await DW.ask('Quelle statistique travailler ?', ['PV', 'PM', 'Attaque', 'Défense', 'Vitesse', 'Intelligence', 'Annuler']);
      if (i < 0 || i > 5) { st().home.used.k = st().home.used.k.filter(k => k !== used); return; }
      const pts = lv + 1;
      m.tr = m.tr || {}; const v0 = K[i] === 'hp' ? m.maxHp : K[i] === 'mp' ? m.maxMp : m.stat(K[i]);
      m.tr[K[i]] = (m.tr[K[i]] || 0) + pts; m.tired = Math.min(100, (m.tired || 0) + 15);
      const v1 = K[i] === 'hp' ? m.maxHp : K[i] === 'mp' ? m.maxMp : m.stat(K[i]);
      DW.Audio.sfx('super');
      await say(`Une, deux ! ${m.name} s'entraîne dur. ${NAMES[i]} +${Math.max(1, v1 - v0)} ! (fatigue +15)`);
    },
    async aquarium() {
      if (!once('aquarium')) { await say('Les poissons font des bulles. Blop, blop.'); return; }
      st().party.forEach(m => m.addHappy(5));
      await say('Vous regardez les poissons nager tranquillement... Quel calme ! (bonheur +5)');
    },
    async ordi() { await DW.Game.push(new DW.FarmScene()); },
    async tapis() { await say('Le canapé est moelleux. Ton partenaire adore s\'y rouler en boule.'); },
    async tableau() { await say('De beaux tableaux : un paysage de l\'île, et un coucher de soleil sur la plage.'); },
  };

  // ------------------------------------------------------------ la pièce, reconstruite selon les meubles possédés
  const rows = () => ['0'.repeat(W), '0' + '2'.repeat(W - 2) + '0', '0' + '2'.repeat(W - 2) + '0',
    ...Array.from({ length: H - 4 }, () => '0' + '1'.repeat(W - 2) + '0'), '0'.repeat(DOOR_X) + '11' + '0'.repeat(W - DOOR_X - 2)];
  MAPS.maison_joueur = {
    name: 'Ma maison', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    floor: { type: 'herring', cols: ['#d8a868', '#b07e48', '#7a5430'] }, wall: { base: '#f4ead4', alt: '#e8d8b8', pattern: 'stripes', wood: '#8a5a32' },
    rows: rows(), objects: [], npcs: [], signs: {},
    warps: [{ x: DOOR_X, y: H - 1, w: 2, h: 1, dir: 'down', to: 'village', tx: 62, ty: 12, _zt: true }],
    entry: { x: DOOR_X, y: H - 2 },
    build() {
      const s = st();
      if (!s.home) s.home = { owned: { lit: true, coffre: true } };
      if (DW.HOME_DOOR) Object.assign(this.warps[0], { tx: DW.HOME_DOOR.x, ty: DW.HOME_DOOR.y + 1 });
      const cave = DW.Trophies && DW.Trophies.count() > 0;   // le premier trophée ouvre la cave (game/trophees.js)
      const version = ORDER.filter(owned).join(',') + (cave ? '|cave' : '') + Object.keys(ROOMS).filter(roomOpen).join(',');
      if (this.version === version && this.objects.length) return;
      this.version = version;
      this.objects = [{ kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 6, y: 1, w: 2, h: 2, back: true, oy: -6 }];
      this.signs = {};
      furnish(this, null);
      // (plus de pièces ouvertes dans les murs du salon : elles sont le long des couloirs)
      this.rows = rows(); this.warps.length = 1;
      if (owned('tableau')) this.signs['9,2'] = this.signs['10,2'] = this.signs['12,2'] = this.signs['13,2'] = () => USE.tableau();
      // escalier de la cave aux trophées
      this.doors = [];
      // escalier vers l'étage (chambre)
      if (upstairs()) {
        this.objects = this.objects.filter(o => !(o.x < 11 && o.x + (o.w || 1) > 9 && (o.back || o.y <= 4)));
        for (const k of ['9,2', '10,2']) delete this.signs[k];
        this.objects.push({ kind: 'stairsup', x: 9, y: 1, w: 2, h: 2, back: true });
        this.doors.push({ x: 9, y: 2, w: 2, dir: 'up', to: 'maison_joueur_etage', tx: 1, ty: 3 });
      }
      if (cave) {
        this.objects = this.objects.filter(o => !(o.x < 14 && o.x + (o.w || 1) > 12 && (o.back || o.y <= 4)));
        this.objects.push({ kind: 'stairsdown', x: 12, y: 1, w: 2, h: 2, back: true });
        this.doors.push({ x: 12, y: 2, w: 2, dir: 'up', to: 'cave_joueur', tx: 7, ty: 3 });
      }
      // les pièces du rez-de-chaussée : une ouverture de 2 cases dans le mur de côté du salon (comme dans les autres bâtiments)
      for (const r in ROOMS) if (ROOMS[r].from === 'salon' && roomOpen(r)) {
        const R = ROOMS[r], A = R.at, x = A.wall === 'left' ? 0 : W - 1;
        this.rows = this.rows.map((row, y) => (y === A.y || y === A.y + 1 ? row.slice(0, x) + '1' + row.slice(x + 1) : row));
        this.warps.push({ x, y: A.y, w: 1, h: 2, dir: A.wall, to: roomId(r), tx: A.wall === 'left' ? R.w - 2 : 1, ty: 4 });
      }
      DW.World.unprepare(this);
    },
    async onEnter() {
      const s = st();
      if (s.flags.homeIntro) return;
      s.flags.homeIntro = true;
      await DW.wait(0.4);
      await say('Voici ta maison... enfin, ta cabane ! Elle tombe un peu en ruine, mais elle est à toi : un lit et un coffre, pour commencer.');
      await say('Au Bazar de Gotsumon, le rayon « Meubles » vend de quoi l\'aménager. Chaque meuble a son utilité !');
    },
  };

  // ------------------------------------------------------------ l'étage (chambre) et le grenier
  // l'étage est un COULOIR : l'escalier à gauche, le grenier à droite, et une porte par chambre le long du mur
  // (places réservées pour les enfants qui viendront habiter chez toi)
  const SLOTS = ['chambre', 'digi', 'tai', 'matt', 'sora', 'izzy', 'mimi', 'joe', 'tk'], CW = 34;
  const slotX = r => 4 + SLOTS.indexOf(r) * 3;
  const DOOR_V = { chambre: 0, digi: 1, tai: 2, matt: 3, sora: 4, izzy: 5, mimi: 6, joe: 7, tk: 0, cuisine: 2, sdb: 1, sport: 6 };
  // porte de chambre dans le mur du couloir (une couleur par occupant, plaque au-dessus)
  DW.World.OBJ.walldoor = { w: 32, h: 34, n: 8, draw(d, v) {
    const [C, Lt, Dk] = [['#9a6a3a', '#b8885a', '#7a4e2a'], ['#5a9ad8', '#7ab4ea', '#3a78b8'], ['#e8822a', '#f4a454', '#c0621a'], ['#3a5ab8', '#5a7ad0', '#2a4290'],
      ['#e05a8a', '#ee82a8', '#b83a68'], ['#7a5ab8', '#9a7ad0', '#5a4090'], ['#58b058', '#7acc7a', '#3a8a3a'], ['#6a6a7a', '#8a8a9a', '#4a4a5a']][v];
    d.rect(2, 2, 28, 32, '#5a3a20', { round: 0.08 });
    d.rect(5, 5, 22, 29, C, { tex: 0.12 });
    d.deco.rect(8, 8, 16, 9, Lt); d.deco.rect(8, 20, 16, 11, Dk);
    d.deco.circ(23, 21, 1.4, '#e8d070', { unlit: true });
    d.deco.rect(11, 1, 10, 4, '#f0e8d0');
  } };
  // longue table de banquet : nappe, assiettes, chandeliers
  DW.World.OBJ.longtable = { w: 128, h: 34, n: 1, draw(d) {
    for (const x of [6, 60, 118]) d.tube([[x, 22], [x, 33]], 2.4, 2, '#5a3a20');
    d.rect(2, 8, 124, 16, '#8a5a32', { round: 0.1 });
    d.rect(4, 6, 120, 13, '#f4ecdc', { tex: 0.05 }); d.deco.rect(4, 17, 120, 3, '#d84a3a');
    for (let x = 14; x < 120; x += 18) { d.deco.ell(x, 11, 5, 2.6, '#ffffff'); d.deco.ell(x, 11, 2.6, 1.2, '#e8a050'); }
    for (const x of [36, 92]) { d.tube([[x, 11], [x, 1]], 1, 0.8, '#c8a040'); d.deco.ell(x, 0.6, 1.2, 1.6, '#ffd060', 0, { unlit: true }); }
  } };
  MAPS.maison_joueur_etage = {
    name: 'Ma maison — Couloir de l’étage', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    floor: { type: 'herring', cols: ['#c8a070', '#a07a4a', '#6a4e2e'] }, wall: { base: '#f8eef4', alt: '#ecdce8', pattern: 'stripes', wood: '#8a5a7a' },
    rows: DW.MapKit.roomRows(CW, 7), objects: [], npcs: [], signs: {}, warps: [], doors: [],
    build() {
      const version = ORDER.filter(owned).join(',') + '|' + Object.keys(ROOMS).filter(roomOpen).join(',');
      if (this.version === version && this.objects.length) return;
      this.version = version;
      this.objects = [{ kind: 'stairsdown', x: 1, y: 1, w: 2, h: 2, back: true }, { kind: 'stairsup', x: CW - 3, y: 1, w: 2, h: 2, back: true },
        { kind: 'bigplant', x: 3, y: 5, w: 1, h: 1, small: true }, { kind: 'bigplant', x: CW - 4, y: 5, w: 1, h: 1, small: true }];
      this.signs = {};
      furnish(this, 'etage');
      this.doors = [{ x: 1, y: 2, w: 2, dir: 'up', to: 'maison_joueur', tx: 9, ty: 3 }, { x: CW - 3, y: 2, w: 2, dir: 'up', to: 'maison_joueur_grenier', tx: 5, ty: 3 }];
      this.rows = DW.MapKit.roomRows(CW, 7); this.warps = [];
      for (const r in ROOMS) if (roomOpen(r) && ROOMS[r].from === 'etage') {
        const R = ROOMS[r], x = slotX(r);
        this.objects.push({ kind: 'walldoor', v: DOOR_V[r] || 0, x, y: 1, w: 2, h: 2, back: true });
        this.doors.push({ x, y: 2, w: 2, dir: 'up', to: roomId(r), tx: Math.floor(R.w / 2) - 1, ty: R.h - 2 });
      }
      DW.World.unprepare(this);
    },
  };
  MAPS.maison_joueur_grenier = {
    name: 'Ma maison — Grenier', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    floor: { type: 'herring', cols: ['#a8845a', '#7a5a3a', '#4a3424'] }, wall: { base: '#c8a880', alt: '#b89870', pattern: 'plain', wood: '#6a4a2a' }, dark: { d: 0.3, col: '#3a2a20' },
    rows: DW.MapKit.roomRows(12, 8), npcs: [], signs: {}, warps: [],
    objects: [{ kind: 'stairsdown', x: 5, y: 1, w: 2, h: 2, back: true }, { kind: 'crates', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 2, y: 3, w: 1, h: 1, small: true },
      { kind: 'sacks', x: 9, y: 3, w: 2, h: 1 }, { kind: 'teddy', x: 1, y: 6, w: 1, h: 1 }],
    doors: [{ x: 5, y: 2, w: 2, dir: 'up', to: 'maison_joueur_etage', tx: CW - 3, ty: 3 }],
  };
  // un vieux coffre oublié par l'ancien propriétaire
  if (DW.Palais && DW.Palais.treasure) DW.Palais.treasure('maison_joueur_grenier', 'grenier_joueur', null, [['cartes', 2], ['soin_m', 2]], 9, 6);

  // ------------------------------------------------------------ les pièces annexes
  for (const r in ROOMS) {
    const R = ROOMS[r], side = R.from === 'salon' && R.at.wall !== 'back' ? (R.at.wall === 'left' ? 'right' : 'left') : null;
    const up = !side && (R.from === 'etage' || R.from === 'salon'), dx = R.side === 'right' ? 0 : R.w - 1;   // porte du côté du salon ; à l'étage, porte en bas (vers le couloir)
    const mx = Math.floor(R.w / 2) - 1;
    const sx = side === 'right' ? R.w - 1 : 0;
    const floorRow = y => { const row = '0' + '1'.repeat(R.w - 2) + '0'; return side && (y === 4 || y === 5) ? row.slice(0, sx) + '1' + row.slice(sx + 1) : row; };
    const bottom = up ? '0'.repeat(mx) + '11' + '0'.repeat(R.w - mx - 2) : '0'.repeat(R.w);
    const rr = ['0'.repeat(R.w), '0' + '2'.repeat(R.w - 2) + '0', '0' + '2'.repeat(R.w - 2) + '0', ...Array.from({ length: R.h - 4 }, (_, i) => floorRow(i + 3)), bottom];
    MAPS[roomId(r)] = {
      name: `Ma maison — ${R.name}`, music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      floor: R.floor, wall: R.wall, rows: rr, objects: [], npcs: (R.npcs || []).map(n => ({ ...n })), signs: {},
      warps: side ? [{ x: sx, y: 4, w: 1, h: 2, dir: side, to: 'maison_joueur', tx: salonSpot(r)[0], ty: salonSpot(r)[1] }] : [up ? { x: mx, y: R.h - 1, w: 2, h: 1, dir: 'down', to: fromOf(r), tx: R.from === 'salon' ? salonSpot(r)[0] : slotX(r), ty: R.from === 'salon' ? salonSpot(r)[1] : 3 }
        : { x: dx, y: 4, w: 1, h: 2, dir: R.side === 'right' ? 'left' : 'right', to: fromOf(r), tx: R.side === 'right' ? FW[fromOf(r)] - 2 : 1, ty: R.y }],
      build() {
        const version = ORDER.filter(owned).join(',');
        if (this.version === version && this.objects.length) return;
        this.version = version;
        this.objects = R.decor.map(o => ({ ...o })); this.signs = {};
        furnish(this, r);
        DW.World.unprepare(this);
      },
    };
  }

  // ------------------------------------------------------------ la grande salle à manger : les enfants et leurs Digimon à table
  {
    const S = MAPS.maison_joueur_salle, PARTNER = { tai: 'agumon', matt: 'gabumon' };
    const mealTime = () => { const h = DW.Time.hour(); return (h >= 12 && h < 14) || (h >= 19 && h < 21); };
    S.populate = function () {
      const kids = kidsHere(), meal = mealTime();
      this.npcs = [];
      kids.forEach((k, i) => {
        const [x, y] = meal ? [7 + 2 * i, 6] : [3 + i * 3, 10], [px, py] = meal ? [8 + 2 * i, 8] : [4 + i * 3, 10];
        this.npcs.push({ hero: k, x, y, face: meal ? (y < 7 ? 'down' : 'up') : 'down', wander: meal ? 0 : 1,
          talk: () => say(meal ? DW.pick(["Bon appétit ! On mange tous ensemble, comme au camp d'été.", 'Hmm, ça sent bon ! Assieds-toi avec nous !', 'Ici, on se sent un peu comme à la maison...'])
            : DW.pick(['Le repas, c\'est à midi et à 19 h ! On s\'y retrouve tous.', 'Cette salle est immense ! Il faudra la remplir de monde.']), DW.HEROES[k] ? DW.HEROES[k].name : k) });
        if (PARTNER[k]) this.npcs.push({ sp: PARTNER[k], x: px, y: py, face: meal ? (py < 7 ? 'down' : 'up') : 'left', wander: meal ? 0 : 1, talk: () => say('Miam ! J\'ai encore faim !', DW.SPECIES[PARTNER[k]].name) });
      });
    };
    // le repas en commun : à midi et le soir, toute ton équipe mange (1 repas chacun), une fois par repas
    const dinner = async () => {
      const s = st(), key = `repas_${DW.Time.day()}_${DW.Time.hour() < 16 ? 'midi' : 'soir'}`;
      if (!mealTime()) { await say('La grande table est mise. Les repas sont servis à midi (12 h - 14 h) et le soir (19 h - 21 h) : tout le monde mange ensemble !'); return; }
      if (s.home.meal === key) { await say('Ton équipe a déjà mangé à ce repas. Hmm, il ne reste que des miettes !'); return; }
      if ((await DW.ask('Le repas est servi ! Passer à table avec tout le monde ?')) !== 0) return;
      s.home.meal = key;
      for (const m of s.party) if (m.hp > 0) { DW.Care.feed(m, 60); m.addHappy(4); }
      DW.Audio.sfx('heal');
      await say(`Tout le monde mange de bon appétit en riant. ${kidsHere().map(k => DW.HEROES[k].name).join(' et ')} racontent leurs aventures... (un repas pour chaque Digimon de l'équipe, bonheur +4)`);
    };
    for (let x = 7; x < 15; x++) for (const y of [7]) S.signs[`${x},${y}`] = dinner;
    const build0 = S.build;
    S.build = function () { build0.apply(this, arguments); for (let x = 7; x < 15; x++) this.signs[`${x},7`] = dinner; };
  }

  // ------------------------------------------------------------ rayon « Meubles » (Bazar de Gotsumon)
  // les meubles arrivent au Bazar au fil du développement de la ville (niveau de la ville requis)
  const TIER = { sport2: 5, sport3: 8, plantes: 0, tele: 1, tableau: 1, tapis: 2, toilettes: 2, frigo: 3, biblio: 3, sac1: 3, aquarium: 4, cuisine: 4, chambre_digi: 4, halteres: 5, ordi: 6, sac2: 6 };
  const tierOf = id => TIER[id] || 0;
  // écran du rayon « Meubles » : même présentation que la boutique d'objets (icônes, prix, Bits, description)
  // ENTRÉE (ou ESPACE) : choisir puis confirmer ; SUPPR : annuler / sortir
  class FurnitureScene extends DW.Scene {
    constructor() { super(); this.i = 0; this.top = 0; this.confirm = false; this.msgT = 0; }
    get list() { return ORDER.filter(id => !owned(id) && FURN[id].price > 0 && (!FURN[id].needs || FURN[id].needs())).sort((a, b) => tierOf(a) - tierOf(b) || FURN[a].price - FURN[b].price); }
    ok(id) { return DW.Town.level() >= tierOf(id); }
    update() {
      const { Input, Audio } = DW, s = st(), L = this.list, n = L.length + 1;
      if (this.confirm) {
        if (Input.hit('back')) { this.confirm = false; Audio.sfx('back'); return; }
        if (Input.hit('ok')) {
          const id = L[this.i], F = FURN[id];
          this.confirm = false;
          if (s.bits < F.price) { Audio.sfx('bump'); this.msg = "Tu n'as pas assez de Bits !"; this.msgT = 2; return; }
          s.bits -= F.price; s.home.owned[id] = true; Audio.sfx('buy');
          (this.bought = this.bought || []).push(id);
          this.msg = `Livré chez toi : ${F.name} !`; this.msgT = 2.2;
          this.i = Math.min(this.i, this.list.length);
        }
        return;
      }
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(this.bought || []); return; }
      if (Input.hit('ok')) {
        if (this.i >= L.length) { Audio.sfx('back'); this.close(this.bought || []); return; }
        const id = L[this.i];
        if (!this.ok(id)) { Audio.sfx('bump'); this.msg = `Pas encore en rayon : la ville doit être « ${DW.Town.LEVELS[tierOf(id)]} ».`; this.msgT = 2.4; return; }
        if (s.bits < FURN[id].price) { Audio.sfx('bump'); this.msg = "Tu n'as pas assez de Bits !"; this.msgT = 2; return; }
        Audio.sfx('select'); this.confirm = true;
      }
      if (this.i < this.top) this.top = this.i; if (this.i > this.top + 7) this.top = this.i - 7;
    }
    tick(dt) { if (this.msgT > 0) this.msgT -= dt; }
    // vignette du meuble : son premier décor, réduit (les sacs : l'icône du sac)
    thumb(c, id, x, y, size, dim) {
      const o = FURN[id].objs[0];
      if (!o) { c.drawImage(DW.Icons.menu('sac'), x, y, size, size); return; }
      const sp = DW.World.obj(o.kind, o.v || 0), k = Math.min(size / sp.w, size / sp.h);
      c.globalAlpha = dim ? 0.4 : 1;
      c.drawImage(sp.img, Math.round(x + (size - sp.w * k) / 2), Math.round(y + (size - sp.h * k)), sp.w * k, sp.h * k);
      c.globalAlpha = 1;
    }
    draw(c) {
      const { UI } = DW, s = st(), L = this.list;
      UI.menuBg(c, this.t, 'MEUBLES');
      UI.box(c, 8, 26, 210, 150);
      const rows = L.concat(['__quit']).slice(this.top, this.top + 8);
      rows.forEach((id, k) => {
        const y = 44 + k * 16;
        if (id === '__quit') { UI.text(c, 'QUITTER', 26, y, { size: 10, color: '#9ab0e8' }); return; }
        const F = FURN[id], ok = this.ok(id);
        this.thumb(c, id, 11, y - 12, 13, !ok);
        UI.text(c, UI.fit(c, F.name, 128, 9).s, 26, y, { size: 9, color: ok ? '#ffffff' : '#7a88a8' });
        UI.text(c, ok ? `${F.price} B` : `niv. ${tierOf(id)}`, 210, y, { size: 9, align: 'right', color: ok ? (s.bits >= F.price ? '#ffd860' : '#c87a5a') : '#7a88a8' });
      });
      if (this.top > 0) UI.text(c, '▲', 113, 34, { size: 7, align: 'center', color: '#ffe070' });
      if (this.top + 8 < L.length + 1) UI.text(c, '▼', 113, 174, { size: 7, align: 'center', color: '#ffe070' });
      UI.cursor(c, 15, 40.5 + (this.i - this.top) * 16, this.t);
      UI.box(c, 224, 26, 88, 56);
      UI.text(c, 'Bits', 232, 42, { size: 9, color: '#9ab0e8' });
      UI.text(c, String(s.bits), 304, 56, { size: 11, align: 'right', bold: true, color: '#ffd860' });
      UI.text(c, `Ville : niv. ${DW.Town.level()}`, 304, 76, { size: 7, align: 'right', color: '#9ab0e8' });
      const id = L[this.i];
      // grand aperçu du meuble choisi
      if (id) { UI.box(c, 224, 88, 88, 88); this.thumb(c, id, 236, 96, 64, !this.ok(id)); }
      UI.box(c, 8, 180, 304, 54);
      if (id) UI.wrap(c, FURN[id].desc, 290, 8).slice(0, 3).forEach((l, k) => UI.text(c, l, 16, 196 + k * 11, { size: 8, color: '#c8f0ff' }));
      else UI.text(c, L.length ? 'À bientôt !' : 'Ta maison est entièrement meublée ! Bravo !', 16, 200, { size: 8, color: '#c8f0ff' });
      if (this.confirm && id) {
        UI.box(c, 40, 92, 240, 46);
        UI.text(c, `Acheter « ${FURN[id].name} » (${FURN[id].price} B) ?`, 160, 110, { size: 9, align: 'center', color: '#ffffff' });
        const N = DW.Input.names();
        UI.text(c, `${N.ok} : oui    ${N.back} : non`, 160, 128, { size: 8, align: 'center', color: '#ffe070' });
      }
      if (this.msgT > 0) UI.text(c, this.msg, 160, 172, { size: 8, align: 'center', color: '#7aff8a' });
    }
  }
  async function furnitureShop() {
    const s = st();
    if (!s.home) s.home = { owned: { lit: true, coffre: true } };
    const before = Object.keys(ROOMS).filter(roomOpen), up0 = upstairs();
    const got = await DW.Game.push(new FurnitureScene());
    if (!got || !got.length) return;
    await say(`Merci ! Je fais livrer tout ça chez toi : ${got.map(id => FURN[id].name).join(', ')} !`, 'Gotsumon');
    for (const r in ROOMS) if (roomOpen(r) && !before.includes(r)) await say(`Il lui faut une pièce rien qu'à lui : une nouvelle porte s'ouvre ${ROOMS[r].from ? 'à l’étage' : 'dans ton salon'}. Ta maison a maintenant une ${ROOMS[r].name} !`, 'Gotsumon');
    if (!up0 && upstairs()) await say('Ton salon est si bien aménagé que ta maison s’agrandit : un ÉTAGE avec ta chambre (ton lit y est monté) et un grenier tout en haut !', 'Gotsumon');
  }
  DW.Home = { FURN, ROOMS, furnitureShop, owned, tierOf };
})();
