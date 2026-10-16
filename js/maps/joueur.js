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
    lit:      { name: 'Lit douillet', price: 0, room: () => (upstairs() ? 'etage' : null), objs: [{ kind: 'bed', x: 1, y: 3, w: 2, h: 2 }], desc: 'Dormir : soigne toute l\'équipe, sauvegarde, et fait passer la nuit.' },
    coffre:   { name: 'Coffre', price: 0, objs: [{ kind: 'chest', x: 1, y: 6, w: 1, h: 1, small: true }], desc: 'Range les objets que ton sac ne peut pas porter.' },
    toilettes:{ name: 'Toilettes privées', price: 600, room: 'sdb', objs: [{ kind: 'toiletroom', x: 6, y: 3, w: 2, h: 1 }], desc: 'Des toilettes rien qu\'à vous : plus besoin de courir dehors !' },
    plantes:  { name: 'Plantes vertes', price: 500, objs: [{ kind: 'bigplant', x: 14, y: 10, w: 1, h: 1, small: true }, { kind: 'flowerpots', v: 1, x: 3, y: 6, w: 2, h: 1 }], desc: 'Les arroser chaque jour rend ton partenaire heureux (bonheur +3).' },
    frigo:    { name: 'Réfrigérateur', price: 1200, room: 'cuisine', objs: [{ kind: 'fridge', x: 10, y: 3, w: 1, h: 1, small: true }], desc: 'Range ta nourriture (le coffre n\'en veut pas), 20 de chaque. Et chaque jour, un en-cas s\'y trouve !' },
    tele:     { name: 'Télévision', price: 1000, objs: [{ kind: 'crttv', x: 5, y: 3, w: 2, h: 1 }], desc: 'Les nouvelles de l\'île et des rumeurs. Regarder ensemble rend heureux.' },
    biblio:   { name: 'Bibliothèque', price: 1500, objs: [{ kind: 'bookshelf', v: 1, x: 3, y: 3, w: 2, h: 1 }], desc: 'Lire une histoire chaque jour à ton partenaire : discipline +5.' },
    cuisine:  { name: 'Cuisine équipée', price: 2500, room: 'cuisine', objs: [{ kind: 'kitchen', x: 4, y: 3, w: 4, h: 1 }], desc: 'Cuisine tes recettes à la maison, quand tu veux.' },
    halteres: { name: 'Coin musculation', price: 3000, room: 'sport', objs: [{ kind: 'weights', x: 3, y: 4, w: 1, h: 1, small: true }, { kind: 'cushion', x: 5, y: 4, w: 1, h: 1, small: true }], desc: 'Un entraînement maison par jour : +2 points dans la statistique de ton choix (fatigue).' },
    aquarium: { name: 'Aquarium', price: 2000, objs: [{ kind: 'aquarium', x: 11, y: 10, w: 3, h: 1 }], desc: 'Regarder les poissons détend : bonheur +5 une fois par jour.' },
    ordi:     { name: 'Ordinateur', price: 4000, objs: [{ kind: 'computer', x: 11, y: 7, w: 2, h: 1 }], desc: 'Gère ta DigiFerme depuis la maison.' },
    tapis:    { name: 'Grand tapis et canapé', price: 1800, objs: [{ kind: 'bigrug', v: 1, x: 2, y: 7, w: 4, h: 2, walk: true }, { kind: 'sofa', v: 0, x: 1, y: 10, w: 3, h: 1 }], desc: 'Un salon confortable : ton partenaire se repose mieux (le lit rend aussi +5 de bonheur).' },
    sac1:     { name: 'Grand sac de voyage', price: 1500, objs: [], desc: 'Ton sac peut contenir 4 sortes d\'objets de plus (14).' },
    sac2:     { name: 'Sac d\'explorateur', price: 5000, objs: [], desc: 'Encore 4 sortes d\'objets de plus dans ton sac (18).' },
    chambre_digi: { name: 'Chambre de ton Digimon', price: 2500, room: 'digi', needs: () => upstairs(), objs: [{ kind: 'bed', x: 6, y: 3, w: 2, h: 2 }, { kind: 'toybox', x: 2, y: 3, w: 2, h: 1 }, { kind: 'cushion', v: 1, x: 3, y: 6, w: 1, h: 1, small: true }], desc: 'Une chambre à l\'étage rien que pour ton partenaire : il y dort, ou s\'y repose une heure quand il n\'a pas sommeil.' },
    tableau:  { name: 'Tableaux', price: 800, objs: [{ kind: 'painting', v: 0, x: 9, y: 1, w: 2, h: 1, back: true, oy: 6 }, { kind: 'painting', v: 1, x: 12, y: 1, w: 2, h: 1, back: true, oy: 6 }], desc: 'De beaux tableaux aux murs. Pour le plaisir des yeux.' },
  };
  const ORDER = Object.keys(FURN);
  const owned = id => !!(st().home && st().home.owned[id]);
  // salon aménagé, ou un enfant délivré qui vient habiter chez toi : la maison prend un étage (les chambres y sont)
  const KIDS_HOME = ['tai', 'matt'];
  const upstairs = () => (owned('tele') && owned('tapis')) || KIDS_HOME.some(k => !!(st().kids || {})[k] && st().hero !== k);
  const roomOf = id => (typeof FURN[id].room === 'function' ? FURN[id].room() : FURN[id].room) || null;
  // pièces annexes : ouvertes par un achat ; porte dans le mur gauche ou droit du salon (side), à la hauteur y
  const ROOMS = {
    sdb:     { name: 'Salle de bain', w: 10, h: 8, side: 'right', y: 4, by: ['toilettes'], floor: { type: 'tile', cols: ['#e8f4f8', '#c8dce8', '#9ab8cc'] }, wall: { base: '#e4f2f8', alt: '#cfe4ee', pattern: 'diamond', wood: '#5a8aa8' },
      decor: [{ kind: 'bigrug', v: 0, x: 2, y: 5, w: 3, h: 1, walk: true }, { kind: 'bigplant', x: 8, y: 6, w: 1, h: 1, small: true }, { kind: 'shelf', x: 2, y: 1, w: 2, h: 1, back: true, oy: 6 }] },
    cuisine: { name: 'Cuisine', w: 12, h: 8, side: 'right', y: 8, by: ['frigo', 'cuisine'], floor: { type: 'tile', cols: ['#f4e4c4', '#dcc49c', '#b49a70'] }, wall: { base: '#fff4e0', alt: '#f4e4c4', pattern: 'stripes', wood: '#a8703a' },
      decor: [{ kind: 'table', x: 5, y: 5, w: 2, h: 1 }, { kind: 'stool', x: 4, y: 5, w: 1, h: 1, small: true }, { kind: 'stool', x: 7, y: 5, w: 1, h: 1, small: true }, { kind: 'shelf', x: 8, y: 1, w: 2, h: 1, back: true, oy: 6 }] },
    sport:   { name: 'Salle de sport', w: 10, h: 8, side: 'left', y: 7, by: ['halteres'], floor: { type: 'herring', cols: ['#c8a070', '#a07a4a', '#6a4e2e'] }, wall: { base: '#e8ecf4', alt: '#d4dae6', pattern: 'stripes', wood: '#4a5a7a' },
      decor: [{ kind: 'bigrug', v: 2, x: 2, y: 5, w: 4, h: 2, walk: true }, { kind: 'bigplant', x: 1, y: 6, w: 1, h: 1, small: true }] },
    // chambre de Tai : elle apparaît quand Tai est délivré (antre de Shellmon) ; décor de Tai (ballon, lunettes, posters orange)
    tai:     { name: 'Chambre de Tai', from: 'etage', w: 10, h: 8, side: 'right', y: 3, by: [], open: () => !!(st().kids || {}).tai && st().hero !== 'tai',
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
    matt:    { name: 'Chambre de Matt', from: 'etage', w: 10, h: 8, side: 'left', y: 6, by: [], open: () => !!(st().kids || {}).matt && st().hero !== 'matt',
      floor: { type: 'herring', cols: ['#b8b0a0', '#908878', '#5a5448'] }, wall: { base: '#dce8f8', alt: '#c4d6f0', pattern: 'stripes', wood: '#3a5a9a' },
      decor: [{ kind: 'bed', x: 2, y: 3, w: 2, h: 2 }, { kind: 'poster', v: 1, x: 5, y: 1, w: 1, h: 1, back: true, oy: 15 }, { kind: 'poster', v: 0, x: 7, y: 1, w: 1, h: 1, back: true, oy: 15 },
        { kind: 'bigrug', v: 0, x: 4, y: 5, w: 3, h: 1, walk: true }, { kind: 'shelf', x: 6, y: 1, w: 2, h: 1, back: true, oy: 6 }],
      npcs: [{ hero: 'matt', x: 5, y: 4, face: 'down', wander: 1, talk: async () => DW.say(DW.pick([
        "Merci pour l'autre nuit. Sans toi et Garurumon, Seadramon m'aurait broyé...",
        "TK est quelque part sur l'île. Il est petit, il doit avoir peur... Si tu entends parler d'un garçon avec un bob vert, préviens-moi.",
        "Tai ronfle. Même à travers le mur. Je te jure.", "Cet harmonica, c'est tout ce qu'il me reste de la maison... Je joue le soir, pour que TK l'entende, peut-être.",
        "Gabumon refuse de quitter sa fourrure. Même quand il fait chaud. Allez comprendre."]), 'Matt') },
        { sp: 'gabumon', x: 7, y: 5, face: 'left', wander: 1, talk: () => DW.say(DW.pick(['Ne dis pas à Matt que je trouve sa musique très belle... Il serait gêné.', "Garurumon, c'était moi ! J'ai encore du mal à y croire."]), 'Gabumon') }] },
    digi:    { name: 'Chambre du Digimon', from: 'etage', w: 10, h: 8, side: 'right', y: 5, by: ['chambre_digi'], floor: { type: 'carpet', cols: ['#bfe0f8', '#a0c8ec', '#f8f8ff'] }, wall: { base: '#fff0f6', alt: '#f8dce8', pattern: 'dots', wood: '#c86a9a' },
      decor: [{ kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'bigrug', v: 0, x: 4, y: 5, w: 3, h: 1, walk: true }] },
  };
  const fromOf = r => (ROOMS[r].from === 'etage' ? 'maison_joueur_etage' : 'maison_joueur');
  const FW = { maison_joueur: W, maison_joueur_etage: 14 };
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
      const s = st();
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
      void s;
    },
    async biblio() {
      const m = lead(); if (!m) return;
      if (!once('biblio')) { await say(`${m.name} a déjà eu son histoire aujourd'hui.`); return; }
      DW.Life && DW.Life.addDisc ? DW.Life.addDisc(m, 5) : (m.disc = Math.min(100, (m.disc || 0) + 5));
      await say(`Tu lis « ${DW.pick(['Les Sept Écussons', 'Le Digivice perdu', 'La légende du Pont de l\'Infini', 'Agumon et le grand gâteau'])} » à ${m.name}. Il écoute très sagement. (discipline +5)`);
    },
    async cuisine() { await DW.Cuisine.cook('Maison'); },
    async halteres() {
      const m = lead(); if (!m) return;
      if (!once('halteres')) { await say(`${m.name} s'est déjà entraîné à la maison aujourd'hui.`); return; }
      const K = ['hp', 'mp', 'atk', 'def', 'spd', 'int'], NAMES = ['PV', 'PM', 'Attaque', 'Défense', 'Vitesse', 'Intelligence'];
      const i = await DW.ask('Quelle statistique travailler ?', ['PV', 'PM', 'Attaque', 'Défense', 'Vitesse', 'Intelligence', 'Annuler']);
      if (i < 0 || i > 5) { st().home.used.k = st().home.used.k.filter(k => k !== 'halteres'); return; }
      m.tr = m.tr || {}; const v0 = K[i] === 'hp' ? m.maxHp : K[i] === 'mp' ? m.maxMp : m.stat(K[i]);
      m.tr[K[i]] = (m.tr[K[i]] || 0) + 2; m.tired = Math.min(100, (m.tired || 0) + 15);
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
      // portes vers les pièces ouvertes (mur gauche ou droit du salon)
      this.rows = rows(); this.warps.length = 1;
      for (const r in ROOMS) if (roomOpen(r) && !ROOMS[r].from) {
        const R = ROOMS[r], x = R.side === 'right' ? W - 1 : 0;
        this.rows = this.rows.map((row, y) => y === R.y || y === R.y + 1 ? row.slice(0, x) + '1' + row.slice(x + 1) : row);
        this.warps.push({ x, y: R.y, w: 1, h: 2, dir: R.side, to: roomId(r), tx: R.side === 'right' ? 1 : R.w - 2, ty: 4 });
      }
      if (owned('tableau')) this.signs['9,2'] = this.signs['10,2'] = this.signs['12,2'] = this.signs['13,2'] = () => USE.tableau();
      // escalier de la cave aux trophées
      this.doors = [];
      // escalier vers l'étage (chambre)
      if (upstairs()) {
        this.objects = this.objects.filter(o => !(o.x < 11 && o.x + (o.w || 1) > 9 && (o.back || o.y <= 4)));
        for (const k of ['9,2', '10,2']) delete this.signs[k];
        this.objects.push({ kind: 'stairsup', x: 9, y: 1, w: 2, h: 2, back: true });
        this.doors.push({ x: 9, y: 2, w: 2, dir: 'up', to: 'maison_joueur_etage', tx: 6, ty: 3 });
      }
      if (cave) {
        this.objects = this.objects.filter(o => !(o.x < 14 && o.x + (o.w || 1) > 12 && (o.back || o.y <= 4)));
        this.objects.push({ kind: 'stairsdown', x: 12, y: 1, w: 2, h: 2, back: true });
        this.doors.push({ x: 12, y: 2, w: 2, dir: 'up', to: 'cave_joueur', tx: 7, ty: 3 });
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
  const roomRows = (w, h) => ['0'.repeat(w), '0' + '2'.repeat(w - 2) + '0', '0' + '2'.repeat(w - 2) + '0', ...Array.from({ length: h - 4 }, () => '0' + '1'.repeat(w - 2) + '0'), '0'.repeat(w)];
  MAPS.maison_joueur_etage = {
    name: 'Ma maison — Étage', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    floor: { type: 'carpet', cols: ['#c8a0d8', '#a880bc', '#7a5a90'] }, wall: { base: '#f8eef4', alt: '#ecdce8', pattern: 'dots', wood: '#8a5a7a' },
    rows: roomRows(14, 10), objects: [], npcs: [], signs: {}, warps: [], doors: [],
    build() {
      const version = ORDER.filter(owned).join(',') + '|' + Object.keys(ROOMS).filter(roomOpen).join(',');
      if (this.version === version && this.objects.length) return;
      this.version = version;
      this.objects = [{ kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 },
        { kind: 'stairsdown', x: 6, y: 1, w: 2, h: 2, back: true }, { kind: 'stairsup', x: 11, y: 1, w: 2, h: 2, back: true },
        { kind: 'bigrug', v: 2, x: 5, y: 5, w: 4, h: 2, walk: true }, { kind: 'bigplant', x: 12, y: 8, w: 1, h: 1, small: true }];
      this.signs = {};
      furnish(this, 'etage');
      this.doors = [{ x: 6, y: 2, w: 2, dir: 'up', to: 'maison_joueur', tx: 9, ty: 3 }, { x: 11, y: 2, w: 2, dir: 'up', to: 'maison_joueur_grenier', tx: 5, ty: 3 }];
      this.rows = roomRows(14, 10); this.warps = [];
      for (const r in ROOMS) if (roomOpen(r) && ROOMS[r].from === 'etage') {
        const R = ROOMS[r], x = R.side === 'right' ? 13 : 0;
        this.rows = this.rows.map((row, y) => y === R.y || y === R.y + 1 ? row.slice(0, x) + '1' + row.slice(x + 1) : row);
        this.warps.push({ x, y: R.y, w: 1, h: 2, dir: R.side, to: roomId(r), tx: R.side === 'right' ? 1 : R.w - 2, ty: 4 });
      }
      DW.World.unprepare(this);
    },
  };
  MAPS.maison_joueur_grenier = {
    name: 'Ma maison — Grenier', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    floor: { type: 'herring', cols: ['#a8845a', '#7a5a3a', '#4a3424'] }, wall: { base: '#c8a880', alt: '#b89870', pattern: 'plain', wood: '#6a4a2a' }, dark: { d: 0.3, col: '#3a2a20' },
    rows: roomRows(12, 8), npcs: [], signs: {}, warps: [],
    objects: [{ kind: 'stairsdown', x: 5, y: 1, w: 2, h: 2, back: true }, { kind: 'crates', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 2, y: 3, w: 1, h: 1, small: true },
      { kind: 'sacks', x: 9, y: 3, w: 2, h: 1 }, { kind: 'teddy', x: 1, y: 6, w: 1, h: 1 }],
    doors: [{ x: 5, y: 2, w: 2, dir: 'up', to: 'maison_joueur_etage', tx: 11, ty: 3 }],
  };
  // un vieux coffre oublié par l'ancien propriétaire
  if (DW.Palais && DW.Palais.treasure) DW.Palais.treasure('maison_joueur_grenier', 'grenier_joueur', null, [['cartes', 2], ['soin_m', 2]], 9, 6);

  // ------------------------------------------------------------ les pièces annexes
  for (const r in ROOMS) {
    const R = ROOMS[r], dx = R.side === 'right' ? 0 : R.w - 1;   // porte du côté du salon (ou de l'étage)
    const floorRow = y => { const row = '0' + '1'.repeat(R.w - 2) + '0'; return y === 4 || y === 5 ? row.slice(0, dx) + '1' + row.slice(dx + 1) : row; };
    const rr = ['0'.repeat(R.w), '0' + '2'.repeat(R.w - 2) + '0', '0' + '2'.repeat(R.w - 2) + '0', ...Array.from({ length: R.h - 4 }, (_, i) => floorRow(i + 3)), '0'.repeat(R.w)];
    MAPS[roomId(r)] = {
      name: `Ma maison — ${R.name}`, music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      floor: R.floor, wall: R.wall, rows: rr, objects: [], npcs: (R.npcs || []).map(n => ({ ...n })), signs: {},
      warps: [{ x: dx, y: 4, w: 1, h: 2, dir: R.side === 'right' ? 'left' : 'right', to: fromOf(r), tx: R.side === 'right' ? FW[fromOf(r)] - 2 : 1, ty: R.y }],
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

  // ------------------------------------------------------------ rayon « Meubles » (Bazar de Gotsumon)
  async function furnitureShop() {
    const s = st();
    if (!s.home) s.home = { owned: { lit: true, coffre: true } };
    for (;;) {
      const list = ORDER.filter(id => !owned(id) && (!FURN[id].needs || FURN[id].needs()));
      if (!list.length) { await say('Ta maison est entièrement meublée ! Bravo !', 'Gotsumon'); return; }
      const i = await DW.choose(list.map(id => `${FURN[id].name} — ${FURN[id].price} B`).concat(['Quitter']), { y: 8 });
      if (i < 0 || i >= list.length) return;
      const F = FURN[list[i]];
      if ((await DW.ask(`${F.name} (${F.price} Bits) : ${F.desc} L'acheter ?`)) !== 0) continue;
      if (s.bits < F.price) { await say('Tu n\'as pas assez de Bits...', 'Gotsumon'); continue; }
      const before = Object.keys(ROOMS).filter(roomOpen), up0 = upstairs();
      s.bits -= F.price; s.home.owned[list[i]] = true; DW.Audio.sfx('buy');
      await say(`Merci ! Je fais livrer « ${F.name} » chez toi tout de suite !`, 'Gotsumon');
      for (const r in ROOMS) if (roomOpen(r) && !before.includes(r)) await say(`Il lui faut une pièce rien qu'à lui : une nouvelle porte s'ouvre ${ROOMS[r].from ? 'à l\'étage' : 'dans ton salon'}. Ta maison a maintenant une ${ROOMS[r].name} !`, 'Gotsumon');
      if (!up0 && upstairs()) await say('Ton salon est si bien aménagé que ta maison s\'agrandit : un ÉTAGE avec ta chambre (ton lit y est monté) et un grenier tout en haut !', 'Gotsumon');
    }
  }
  DW.Home = { FURN, ROOMS, furnitureShop, owned };
})();
