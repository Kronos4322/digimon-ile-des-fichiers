'use strict';
// =====================================================================
//  LES BÂTIMENTS GRANDISSENT AVEC LA VILLE
//  Un intérieur peut avoir plusieurs « formes » selon le niveau de la ville (DW.Town.level()) :
//  le Bazar devient un Grand Bazar, puis un Centre commercial avec ses rayons et ses caissiers Digimon.
//  DW.Grow.set(id, [{ min, name, w, h, objects, npcs, signs, decor(m) }, ...]) : la forme est choisie à chaque entrée.
//  La porte de sortie reste en bas au centre ; l'arrivée depuis la ville suit la taille (Overworld.enterDoor : map.arrive).
// =====================================================================
(function () {
  const { say } = DW.MapKit;
  const MAPS = DW.MAPS;
  const st = () => DW.state;

  const Grow = DW.Grow = {
    set(id, forms) {
      const m = MAPS[id], exit = { ...m.warps[0] }, pop0 = m.populate;
      const base = { name: m.name, rows: m.rows, objects: m.objects, npcs: m.npcs, signs: m.signs };
      m.forms = forms;
      m.formOf = () => { const lv = DW.Town ? DW.Town.level() : 0; let f = null; for (const F of forms) if (lv >= F.min) f = F; return f; };
      m.populate = function () {
        const F = this.formOf(), key = F ? F.min : -1;
        if (this.formKey !== key) {
          this.formKey = key;
          if (!F) Object.assign(this, { name: base.name, rows: base.rows, objects: base.objects.map(o => ({ ...o })), npcs: base.npcs, signs: { ...base.signs } });
          else {
            const R = DW.MapKit.doorRoom(F.w, F.h);
            Object.assign(this, { name: F.name, rows: R.rows, objects: F.objects.map(o => ({ ...o })), npcs: [], signs: {} });
            this.warps = [{ ...exit, x: R.door, y: R.rows.length - 1 }];
            this.entry = { x: R.door, y: R.rows.length - 2 };
            if (F.decor) F.decor(this);
          }
          if (!F) { this.warps = [{ ...exit }]; }
          DW.World.unprepare(this);
        }
        if (F) this.npcs = F.npcs ? F.npcs() : [];
        else if (pop0) pop0.call(this);   // (forme d'origine : son propre peuplement)
      };
      // arrivée depuis la ville : devant la porte, quelle que soit la taille
      m.arrive = () => { m.populate(); const w = m.warps[0]; return [w.x, w.y - 1]; };
    },
  };

  // ------------------------------------------------------------ une gondole de supermarché (v 0 : nourriture, 1 : soins, 2 : outils)
  DW.World.OBJ.gondola = { w: 48, h: 34, n: 3, draw(d, v) {
    const P = [['#e05a3a', '#f0c040', '#7ac04a', '#d8a060', '#ffffff'], ['#5ad870', '#3ab8e0', '#a05ae0', '#f0f0f0', '#e84a5a'], ['#a8743a', '#9aa8b8', '#e0c040', '#5a5a6a', '#c86a3a']][v];
    d.rect(1, 6, 46, 26, '#d8dce4', { round: 0.08 });
    for (const y of [10, 19, 28]) d.deco.rect(2, y, 44, 1.6, '#8a8e9a');
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) d.deco.rect(3 + i * 4.8, 4.4 + r * 9, 3.6, 5, P[(i + r * 2) % P.length]);
    d.rect(0, 2, 48, 4, ['#d84a3a', '#3a9ad8', '#5a8a4a'][v], { round: 0.2 });
  } };
  DW.World.OBJ.checkout = { w: 40, h: 28, n: 1, draw(d) {
    d.rect(1, 8, 38, 18, '#c8ccd4', { round: 0.08 }); d.deco.rect(2, 9, 36, 3, '#3a3a44');
    d.rect(26, 2, 10, 8, '#4a4a54', { round: 0.1 }); d.deco.rect(27.5, 3.5, 7, 4, '#7ae0a0');
    d.deco.rect(4, 13, 18, 2, '#8a8e9a');
  } };

  // ------------------------------------------------------------ le Bazar → Grand Bazar → Centre commercial
  const bazar = MAPS.bazar_in;
  if (bazar) {
    const svc = () => DW.Story.services.gotsumon();
    const care = id => ['heal', 'mp', 'cure', 'revive', 'sick', 'hurt'].includes(DW.ITEMS[id].use) && !DW.isFood(id);
    const RAYONS = {
      food: { name: 'Alimentation', test: id => DW.isFood(id) },
      care: { name: 'Soins', test: care },
      tools: { name: 'Outils et objets', test: id => !DW.isFood(id) && !care(id) },
    };
    const rayon = k => async () => {
      const R = RAYONS[k], stock = DW.shopStock('bazar').filter(R.test);
      if (!stock.length) { await say(`Le rayon ${R.name} est encore vide... Il se remplira quand la ville aura grandi !`); return; }
      await DW.Game.push(new DW.ShopScene(stock));
    };
    const cashier = (sp, k) => async () => {
      const n = DW.SPECIES[sp] ? DW.SPECIES[sp].name : sp;
      await say(`Bienvenue au rayon ${RAYONS[k].name} ! Je m'occupe de la caisse.`, n);
      await rayon(k)();
    };
    const sp = s => (DW.SPECIES[s] ? s : 'gotsumon');
    Grow.set('bazar_in', [
      // Grand Bazar (ville « Bourg ») : plus grand, deux comptoirs
      { min: 5, name: 'Grand Bazar de Gotsumon', w: 20, h: 8,
        objects: [
          { kind: 'counter', v: 0, x: 3, y: 4, w: 4, h: 1 }, { kind: 'counter', v: 1, x: 13, y: 4, w: 4, h: 1 },
          { kind: 'gondola', v: 0, x: 2, y: 7, w: 3, h: 1 }, { kind: 'gondola', v: 1, x: 7, y: 7, w: 3, h: 1 }, { kind: 'gondola', v: 2, x: 12, y: 7, w: 3, h: 1 },
          { kind: 'window', v: 0, x: 8, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'plant', v: 0, x: 18, y: 9, w: 1, h: 1, small: true },
          { kind: 'crates', v: 1, x: 18, y: 3, w: 1, h: 1, small: true }, { kind: 'barrel', v: 0, x: 1, y: 9, w: 1, h: 1, small: true },
        ],
        decor: m => { for (const x of [3, 4, 5, 6]) m.signs[`${x},4`] = svc; for (const x of [13, 14, 15, 16]) m.signs[`${x},4`] = cashier(sp('tokomon'), 'food'); for (const [x, k] of [[2, 'food'], [7, 'care'], [12, 'tools']]) for (let i = 0; i < 3; i++) m.signs[`${x + i},7`] = rayon(k); },
        npcs: () => [{ sp: 'gotsumon', x: 4, y: 3, face: 'down', talk: svc }, { sp: sp('tokomon'), x: 14, y: 3, face: 'down', talk: cashier(sp('tokomon'), 'food') }] },
      // Centre commercial (ville « Grande ville ») : des allées de rayons, des caissiers, des clients
      { min: 8, name: 'Centre commercial de Gotsumon', w: 30, h: 12,
        objects: [
          { kind: 'counter', v: 0, x: 3, y: 4, w: 4, h: 1 },
          ...[0, 1, 2].flatMap(r => [4, 10, 16, 22].map((x, i) => ({ kind: 'gondola', v: (i + r) % 3, x, y: 6 + r * 2, w: 3, h: 1 }))),
          ...[[11, 'food'], [16, 'care'], [21, 'tools']].map(([x]) => ({ kind: 'checkout', x, y: 12, w: 2, h: 1 })),
          { kind: 'window', v: 0, x: 10, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 18, y: 1, w: 2, h: 2, back: true, oy: -6 },
          { kind: 'plant', v: 0, x: 1, y: 13, w: 1, h: 1, small: true }, { kind: 'plant', v: 1, x: 28, y: 13, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 28, y: 3, w: 1, h: 1, small: true },
        ],
        decor: m => {
          for (const x of [3, 4, 5, 6]) m.signs[`${x},4`] = svc;
          [0, 1, 2].forEach(r => [4, 10, 16, 22].forEach((x, i) => { const k = ['food', 'care', 'tools'][(i + r) % 3]; for (let j = 0; j < 3; j++) m.signs[`${x + j},${6 + r * 2}`] = rayon(k); }));
          [[11, 'food', 'tokomon'], [16, 'care', 'motimon'], [21, 'tools', 'numemon']].forEach(([x, k, s]) => { for (const dx of [0, 1]) m.signs[`${x + dx},12`] = cashier(sp(s), k); });
        },
        npcs: () => {
          const out = [{ sp: 'gotsumon', x: 4, y: 3, face: 'down', talk: svc }];
          [[11, 'food', 'tokomon'], [16, 'care', 'motimon'], [21, 'tools', 'numemon']].forEach(([x, k, s]) => out.push({ sp: sp(s), x: x + 1, y: 11, face: 'down', talk: cashier(sp(s), k) }));
          // des clients qui font leurs courses dans les allées
          ['kunemon', 'betamon', 'biyomon', 'palmon'].filter(c => DW.Town.has(c)).slice(0, 3).forEach((c, i) => out.push({ sp: c, x: 8 + i * 6, y: 7 + (i % 2) * 2, face: i % 2 ? 'left' : 'right', wander: 2,
            talk: () => say(DW.pick(['Il y a tout ce qu\'il faut, ici !', 'Je cherche le rayon des Viandes...', 'Avant, c\'était un petit bazar. Regarde ça maintenant !']), DW.SPECIES[c].name) }));
          return out;
        } },
    ]);
  }

  // ------------------------------------------------------------ le Restaurant → Grand Restaurant → Restaurant gastronomique
  const resto = MAPS.resto_in;
  if (resto) {
    const svc = () => DW.Story.services.mushroomon();
    const sp = s => (DW.SPECIES[s] ? s : 'mushroomon');
    // des habitants de la ville attablés (ceux qui sont revenus)
    const diners = spots => DW.Town.RECRUITS.filter(r => DW.Town.has(r.id) && r.id !== 'mushroomon' && DW.SPECIES[r.id]).slice(0, spots.length).map((r, i) => ({ sp: r.id, x: spots[i][0], y: spots[i][1], face: i % 2 ? 'left' : 'right',
      talk: () => say(DW.pick(['Mmmh ! Les champignons grillés de Mushroomon sont les meilleurs de l\'île !', 'On mange bien, ici. Tu devrais goûter le menu du jour !', 'Le service est rapide, avec tous ces serveurs !']), DW.SPECIES[r.id].name) }));
    const waiter = (s, x, y) => ({ sp: sp(s), x, y, face: 'down', wander: 2, talk: () => say(DW.pick(['Bonjour ! Une table pour deux ? Mushroomon est en cuisine, au comptoir du fond.', 'Je vous apporte la carte tout de suite !', 'Attention, chaud devant !']), DW.SPECIES[sp(s)].name) });
    const tables = list => list.map(([x, y], i) => ({ kind: 'dtable', v: i % 2, x, y, w: 2, h: 1 }));
    Grow.set('resto_in', [
      { min: 5, name: 'Grand Restaurant aux Champignons', w: 20, h: 9,
        objects: [{ kind: 'oven', x: 1, y: 3, w: 2, h: 1 }, { kind: 'oven', x: 16, y: 3, w: 2, h: 1 }, { kind: 'counter', v: 1, x: 6, y: 4, w: 4, h: 1 }, { kind: 'counter', v: 1, x: 10, y: 4, w: 4, h: 1 },
          ...tables([[2, 7], [7, 7], [12, 7], [16, 7], [4, 10], [14, 10]]), { kind: 'window', v: 0, x: 4, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 14, y: 1, w: 2, h: 2, back: true, oy: -6 },
          { kind: 'plant', v: 1, x: 18, y: 10, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 1, y: 10, w: 1, h: 1, small: true }],
        decor: m => { for (let x = 6; x < 14; x++) m.signs[`${x},4`] = svc; },
        npcs: () => [{ sp: 'mushroomon', x: 9, y: 3, face: 'down', talk: svc }, waiter('tanemon', 9, 9), ...diners([[4, 7], [9, 7], [14, 7], [6, 10]])] },
      { min: 8, name: 'Restaurant gastronomique de Mushroomon', w: 28, h: 12,
        objects: [{ kind: 'oven', x: 1, y: 3, w: 2, h: 1 }, { kind: 'oven', x: 4, y: 3, w: 2, h: 1 }, { kind: 'oven', x: 22, y: 3, w: 2, h: 1 }, { kind: 'fridge', x: 25, y: 3, w: 1, h: 1, small: true },
          ...[8, 12, 16].map(x => ({ kind: 'counter', v: 1, x, y: 4, w: 4, h: 1 })),
          ...tables([[2, 7], [7, 7], [12, 7], [17, 7], [22, 7], [4, 10], [9, 10], [17, 10], [22, 10], [2, 13], [22, 13]]),
          ...[6, 13, 20].map(x => ({ kind: 'window', v: 0, x, y: 1, w: 2, h: 2, back: true, oy: -6 })),
          { kind: 'bigplant', x: 26, y: 13, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 1, y: 10, w: 1, h: 1, small: true }],
        decor: m => { for (let x = 8; x < 20; x++) m.signs[`${x},4`] = svc; },
        npcs: () => [{ sp: 'mushroomon', x: 13, y: 3, face: 'down', talk: svc }, waiter('tanemon', 11, 9), waiter('tokomon', 16, 12),
          ...diners([[4, 7], [9, 7], [14, 7], [19, 7], [6, 10], [11, 10], [19, 10], [24, 10]])] },
    ]);
  }

  // ------------------------------------------------------------ la maison de Jijimon prend des étages
  // ville « Village » (niveau 4) : un escalier remplace la seconde bibliothèque → le Dortoir des habitants ;
  // ville « Grande ville » (niveau 8) : un second étage → la Grande bibliothèque de Jijimon
  const J = MAPS.maison;
  if (J) {
    const lv = () => (DW.Town ? DW.Town.level() : 0);
    const residents = (spots, skip) => DW.Town.RECRUITS.filter(r => DW.Town.has(r.id) && DW.SPECIES[r.id] && !skip.includes(r.id)).slice(0, spots.length).map((r, i) => ({ sp: r.id, x: spots[i][0], y: spots[i][1], face: i % 2 ? 'left' : 'right', wander: 1,
      talk: () => say(DW.pick(['Jijimon nous loge le temps que nos maisons soient reconstruites. Il est si gentil !', 'Hohoho, c\'est ce que dit toujours Jijimon. Je commence à le dire aussi !', 'La ville grandit à vue d\'œil. Bientôt, chacun aura sa maison !']), DW.SPECIES[r.id].name) }));
    MAPS.maison_haut = {
      name: 'Maison de Jijimon — Dortoir des habitants', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      floor: { type: 'herring', cols: ['#c8a070', '#a07a4a', '#6a4e2e'] }, wall: { base: '#f0e0c8', alt: '#e0ccac', pattern: 'stripes', wood: '#6a4a2a' },
      rows: DW.MapKit.roomRows(18, 12), npcs: [], signs: {}, warps: [], doors: [], secretEntry: true,   // (l'escalier n'apparaît chez Jijimon qu'à partir du niveau 4)
      objects: [{ kind: 'stairsdown', x: 3, y: 1, w: 2, h: 2, back: true },
        ...[7, 10, 13].map(x => ({ kind: 'bed', x, y: 3, w: 2, h: 2 })), ...[7, 10, 13].map(x => ({ kind: 'bed', x, y: 7, w: 2, h: 2 })),
        { kind: 'rug', x: 1, y: 7, w: 4, h: 3, walk: true }, { kind: 'plant', v: 0, x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'window', v: 0, x: 8, y: 1, w: 2, h: 2, back: true, oy: -6 }],
      populate() {
        this.doors = [{ x: 3, y: 2, w: 2, dir: 'up', to: 'maison', tx: 3, ty: 3 }];
        this.npcs = residents([[5, 5], [9, 6], [12, 6], [15, 5], [3, 9]], ['jijimon']);
        if (lv() >= 8) {
          if (!this.objects.some(o => o.kind === 'stairsup')) { this.objects.push({ kind: 'stairsup', x: 15, y: 1, w: 2, h: 2, back: true }); DW.World.unprepare(this); }
          this.doors.push({ x: 15, y: 2, w: 2, dir: 'up', to: 'maison_haut2', tx: 3, ty: 3 });
        }
      },
    };
    // un lit libre : se reposer ou dormir, comme chez Jijimon
    for (const k of ['13,3', '14,3', '13,4', '14,4']) MAPS.maison_haut.signs[k] = async () => { await say('Un lit libre, tout propre. Jijimon le garde pour les voyageurs.'); await DW.Life.restOrSleep(); };
    MAPS.maison_haut2 = {
      name: 'Maison de Jijimon — Grande bibliothèque', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      floor: { type: 'carpet', cols: ['#8a3a3a', '#6a2a2a', '#4a1a1a'] }, wall: { base: '#e8dcc0', alt: '#d8c8a4', pattern: 'plain', wood: '#4a3020' },
      rows: DW.MapKit.roomRows(18, 12), npcs: [], signs: {}, warps: [], secretEntry: true, doors: [{ x: 3, y: 2, w: 2, dir: 'up', to: 'maison_haut', tx: 15, ty: 3 }],
      objects: [{ kind: 'stairsdown', x: 3, y: 1, w: 2, h: 2, back: true },
        ...[6, 8, 10, 12, 14].map((x, i) => ({ kind: 'bookshelf', v: i % 2, x, y: 3, w: 2, h: 1 })), ...[2, 4, 12, 14].map((x, i) => ({ kind: 'bookshelf', v: i % 2, x, y: 6, w: 2, h: 1 })),
        { kind: 'desk', x: 7, y: 8, w: 2, h: 1 }, { kind: 'telescope', x: 16, y: 8, w: 1, h: 1, small: true }, { kind: 'armchair', v: 1, x: 10, y: 8, w: 1, h: 1, small: true }, { kind: 'plant', v: 1, x: 1, y: 9, w: 1, h: 1, small: true }],
      populate() {
        this.npcs = [{ sp: DW.SPECIES.motimon ? 'motimon' : 'jijimon', x: 9, y: 7, face: 'down', talk: () => DW.Guide && DW.Guide.questions ? DW.Guide.questions('Bienvenue à la Grande bibliothèque ! Que veux-tu savoir ?') : say('Chut... On lit, ici !') }];
      },
    };
    for (const [x, y] of [[6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [2, 6], [3, 6], [4, 6], [5, 6], [12, 6], [13, 6], [14, 6], [15, 6]])
      MAPS.maison_haut2.signs[`${x},${y}`] = () => say(DW.pick(["« Histoire de l'Île des Fichiers » : autrefois, la ville comptait des centaines d'habitants...",
        '« Les Digivolutions » : un Digimon bien entraîné, bien nourri et heureux choisit lui-même sa voie.', "« Les écussons » : sept écussons brillent quelque part sur l'île. Chacun réveille une force cachée.",
        '« Les Engrenages Noirs » : on dit qu\'une ombre les plante dans le cœur des Digimon...', '« Cuisine de l\'île », par Mushroomon : un bon plat rend fort pour toujours !']));
    for (const k of ['13,3', '14,3', '13,4', '14,4']) if (!MAPS.maison_haut.signs[k]) MAPS.maison_haut.signs[k] = MAPS.maison_haut.signs['13,3'];
    MAPS.maison_haut2.signs['16,8'] = () => say(`La longue-vue de Jijimon, tournée vers le ciel. ${DW.Time.isNight() ? 'Les étoiles brillent comme des données lumineuses...' : 'Il faudra revenir la nuit pour voir les étoiles.'}`);
    // l'escalier, dans la maison de Jijimon (à la place de la seconde bibliothèque)
    const b0 = J.build;
    J.build = function () {
      b0.apply(this, arguments);
      const want = lv() >= 4, has = this.objects.some(o => o.kind === 'stairsup');
      if (want && !has) {
        this.objects = this.objects.filter(o => !(o.kind === 'bookshelf' && o.x === 3) && !(o.kind === 'sacks' && o.x === 3));
        this.objects.push({ kind: 'stairsup', x: 3, y: 1, w: 2, h: 2, back: true });
        delete this.signs['3,3']; delete this.signs['4,3'];
        if (this.gfx) DW.World.unprepare(this);
      }
      this.doors = (this.doors || []).filter(d => d.to !== 'maison_haut');
      if (want) this.doors.push({ x: 3, y: 2, w: 2, dir: 'up', to: 'maison_haut', tx: 3, ty: 3 });
    };
  }

  // ------------------------------------------------------------ le Dojo → Grand Dojo (+ salle de méditation) → Dojo complet (+ salle des combats)
  const dojo = MAPS.dojo_in;
  if (dojo) {
    const svc = () => DW.Story.services.elecmon();
    const once = key => { const f = st().flags; f.dojoDay = f.dojoDay || {}; if (f.dojoDay[key] === DW.Time.day()) return false; f.dojoDay[key] = DW.Time.day(); return true; };
    const open = (m, x, y) => { m.rows[y] = m.rows[y].slice(0, x) + '1' + m.rows[y].slice(x + 1); };
    const TATAMI = { type: 'tatami', cols: ['#dccf8e', '#c8ba78', '#6a8a4a'] }, WALL = { base: '#f4eedc', alt: '#e4dcc4', pattern: 'plain', wood: '#4a3020' };
    // salle de méditation (à gauche du dojo)
    MAPS.dojo_zen = { name: "Dojo d'Elecmon — Salle de méditation", music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true, secretEntry: true,   // (ouverte seulement quand le dojo a grandi)
      floor: TATAMI, wall: WALL, rows: DW.MapKit.roomRows(14, 10), npcs: [], signs: {}, doors: [],
      objects: [...[3, 6, 9].map(x => ({ kind: 'scroll', v: x % 2, x, y: 1, w: 1, h: 2, back: true, oy: -4 })), ...[[3, 5], [6, 5], [9, 5], [4, 7], [8, 7]].map(([x, y], i) => ({ kind: 'cushion', v: i % 3, x, y, w: 1, h: 1, small: true })),
        { kind: 'plant', v: 0, x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'plant', v: 1, x: 11, y: 8, w: 1, h: 1, small: true }],
      warps: [{ x: 13, y: 5, w: 1, h: 2, dir: 'right', to: 'dojo_in', tx: 1, ty: 5 }] };
    for (const y of [5, 6]) open(MAPS.dojo_zen, 13, y);
    MAPS.dojo_zen.npcs.push({ sp: DW.SPECIES.patamon ? 'patamon' : 'elecmon', x: 6, y: 4, face: 'down', talk: async () => {
      const m = st().party[0], n = DW.SPECIES.patamon ? 'Patamon' : 'Elecmon';
      if (!m) return;
      if (!once('zen')) { await say(`${m.name} a déjà médité aujourd'hui. L'esprit a besoin de repos, lui aussi !`, n); return; }
      if ((await DW.ask('Méditer en silence sur les coussins ? (une fois par jour)')) !== 0) return;
      await DW.fade(0.6, 0.4); st().clock += 30; m.tired = 0; DW.Life.addDisc(m, 5); m.addHappy(3); await DW.wait(0.6); await DW.fade(0, 0.4);
      await say(`Inspire... expire... ${m.name} se sent calme et reposé. (fatigue effacée, discipline +5, bonheur +3)`, n);
    } });
    // salle des combats (à droite du dojo complet) : un adversaire d'entraînement par jour, à ton niveau, sans K.O.
    MAPS.dojo_combat = { name: "Dojo d'Elecmon — Salle des combats", music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true, secretEntry: true,
      floor: { type: 'tatami', cols: ['#e8d8a0', '#d4c288', '#8a4a3a'] }, wall: WALL, rows: DW.MapKit.roomRows(16, 11), npcs: [], signs: {}, doors: [],
      objects: [{ kind: 'bigrug', v: 2, x: 5, y: 5, w: 5, h: 3, walk: true }, ...[2, 13].map(x => ({ kind: 'dummy', x, y: 3, w: 1, h: 1, small: true })), { kind: 'scroll', v: 1, x: 7, y: 1, w: 1, h: 2, back: true, oy: -4 }],
      warps: [{ x: 0, y: 5, w: 1, h: 2, dir: 'left', to: 'dojo_in', tx: 24, ty: 5 }] };
    for (const y of [5, 6]) open(MAPS.dojo_combat, 0, y);
    const POOL = ['agumon', 'gabumon', 'tentomon', 'palmon', 'gomamon', 'patamon', 'greymon', 'garurumon', 'kabuterimon', 'togemon', 'ikkakumon', 'angemon'];
    MAPS.dojo_combat.npcs.push({ sp: DW.SPECIES.tsunomon ? 'tsunomon' : 'elecmon', x: 7, y: 4, face: 'down', talk: async ow => {
      const s = st(), top = Math.max(1, ...s.party.map(m => m.level || 1)), n = DW.SPECIES.tsunomon ? 'Tsunomon' : 'Elecmon';
      if (!s.party.some(m => m.hp > 0)) { await say('Ton équipe est épuisée. Soigne-la avant un combat d\'entraînement !', n); return; }
      if (!once('combat')) { await say("C'est assez pour aujourd'hui ! Reviens demain pour un nouveau combat d'entraînement.", n); return; }
      const champ = top >= 15, list = POOL.filter(p => DW.SPECIES[p] && (DW.SPECIES[p].stage === 'Champion') === champ);
      const sp = DW.pick(list.length ? list : ['agumon']);
      await say(`Un combat d'entraînement contre ${DW.SPECIES[sp].name} ! Ici, personne ne risque rien : on s'arrête avant le K.O.`, n);
      if ((await DW.ask('Combattre ?')) !== 0) { s.flags.dojoDay.combat = null; return; }
      const res = await ow.battle({ enemy: new DW.Digimon(sp, top), canLose: true, intro: `${DW.SPECIES[sp].name} salue, puis se met en garde !` });
      s.party.forEach(m => { if (m.hp <= 0) m.hp = 1; });
      await say(res === 'win' ? 'Bravo ! Un beau combat. Elecmon serait fier de toi !' : 'Pas mal du tout ! Tu feras mieux demain.', n);
    } });
    const tables = list => list.map(([x, y]) => ({ kind: 'dummy', x, y, w: 1, h: 1, small: true }));
    Grow.set('dojo_in', [
      { min: 5, name: "Grand Dojo d'Elecmon", w: 20, h: 9,
        objects: [...[4, 9, 14].map(x => ({ kind: 'scroll', v: x % 2, x, y: 1, w: 1, h: 2, back: true, oy: -4 })), ...tables([[4, 4], [15, 4], [4, 9], [15, 9]]),
          { kind: 'weights', x: 17, y: 6, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 18, y: 10, w: 1, h: 1, small: true }],
        decor: m => { for (const y of [5, 6]) open(m, 0, y); m.warps.push({ x: 0, y: 5, w: 1, h: 2, dir: 'left', to: 'dojo_zen', tx: 12, ty: 5 }); m.signs['9,2'] = '« Le corps se forge au combat. L\'esprit, à l\'entraînement. » — À gauche : la salle de méditation.'; },
        npcs: () => [{ sp: 'elecmon', x: 9, y: 4, face: 'down', talk: svc }, DW.arenaNPC(13, 6)] },
      { min: 8, name: "Dojo d'Elecmon — Grand hall", w: 26, h: 11,
        objects: [...[5, 12, 19].map(x => ({ kind: 'scroll', v: x % 2, x, y: 1, w: 1, h: 2, back: true, oy: -4 })), ...tables([[4, 4], [21, 4], [4, 11], [21, 11], [9, 8], [16, 8]]),
          { kind: 'weights', x: 12, y: 11, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 24, y: 3, w: 1, h: 1, small: true }],
        decor: m => {
          for (const y of [5, 6]) { open(m, 0, y); open(m, 25, y); }
          m.warps.push({ x: 0, y: 5, w: 1, h: 2, dir: 'left', to: 'dojo_zen', tx: 12, ty: 5 }, { x: 25, y: 5, w: 1, h: 2, dir: 'right', to: 'dojo_combat', tx: 1, ty: 5 });
          m.signs['12,2'] = '« Le corps se forge au combat. L\'esprit, à l\'entraînement. » — À gauche : méditation. À droite : combats.';
        },
        npcs: () => [{ sp: 'elecmon', x: 12, y: 4, face: 'down', talk: svc }, DW.arenaNPC(16, 6), { sp: DW.SPECIES.gotsumon ? 'gotsumon' : 'elecmon', x: 8, y: 7, face: 'right', wander: 1, talk: () => say('Hop ! Hop ! Je m\'entraîne pour devenir aussi fort que Golemon !', 'Gotsumon') }] },
    ]);
  }

  // ------------------------------------------------------------ la Serre → Grande serre → Jardins maraîchers
  const serre = MAPS.serre_in;
  if (serre) {
    const svc = () => DW.Story.services.yokomon();
    const sp = s => (DW.SPECIES[s] ? s : 'yokomon');
    const VEG = ['super_carotte', 'radis', 'digichampi', 'pomme_bleue'];
    // un maraîcher : une récolte offerte par jour
    const grower = (s, x, y) => {
      const name = DW.SPECIES[sp(s)].name;
      return { sp: sp(s), x, y, face: 'down', wander: 1, talk: async () => {
        const f = st().flags, d = DW.Time.day(), key = 'maraicher_' + s;
        f.maraich = f.maraich || {};
        if (f.maraich[key] === d) { await say(DW.pick(['Les légumes poussent... Reviens demain pour la prochaine récolte !', 'Il faut arroser, désherber, arroser encore... Un vrai travail de Digimon !']), name); return; }
        f.maraich[key] = d;
        const id = DW.pick(VEG), extra = DW.giveItem(id, 1); DW.Audio.sfx('buy');
        await say(`Tiens, c'est la récolte du jour : ${DW.ITEMS[id].name} ! Tout frais du potager.${DW.extraMsg(extra)}`, name);
      } };
    };
    const beds = list => list.map(([x, y], i) => ({ kind: 'vegpatch', v: i % 2, x, y, w: 3, h: 2, walk: true }));
    // les Digimon de la DigiFerme se promènent entre les plates-bandes
    const farm = spots => (st().box || []).slice(0, spots.length).map((d, i) => ({ sp: d.sp, x: spots[i][0], y: spots[i][1], face: i % 2 ? 'left' : 'right', wander: 1, talk: () => say(`${d.name} se repose tranquillement à la DigiFerme. Il a l'air heureux.`) }));
    Grow.set('serre_in', [
      { min: 5, name: 'Grande serre de Yokomon', w: 22, h: 9,
        objects: [{ kind: 'counter', v: 2, x: 9, y: 4, w: 4, h: 1 }, ...beds([[2, 7], [7, 7], [14, 7], [18, 7]]),
          { kind: 'pots', x: 1, y: 3, w: 2, h: 1 }, { kind: 'pots', x: 19, y: 3, w: 2, h: 1 }, { kind: 'bigplant', x: 4, y: 3, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 17, y: 3, w: 1, h: 1, small: true },
          ...[6, 14].map(x => ({ kind: 'window', v: 0, x, y: 1, w: 2, h: 2, back: true, oy: -6 }))],
        decor: m => { for (let x = 9; x < 13; x++) m.signs[`${x},4`] = svc; },
        npcs: () => [{ sp: 'yokomon', x: 10, y: 3, face: 'left', talk: svc }, grower('palmon', 4, 10), grower('tanemon', 16, 10), ...farm([[6, 6], [12, 9], [17, 6], [9, 11]])] },
      { min: 8, name: 'Jardins maraîchers de Yokomon', w: 30, h: 12,
        objects: [{ kind: 'counter', v: 2, x: 13, y: 4, w: 4, h: 1 }, ...beds([[2, 7], [7, 7], [19, 7], [24, 7], [2, 11], [7, 11], [19, 11], [24, 11]]),
          ...[1, 4, 25, 27].map(x => ({ kind: 'pots', x, y: 3, w: 2, h: 1 })), ...[9, 20].map(x => ({ kind: 'bigplant', x, y: 3, w: 1, h: 1, small: true })),
          ...[6, 14, 22].map(x => ({ kind: 'window', v: 0, x, y: 1, w: 2, h: 2, back: true, oy: -6 })), { kind: 'plant', v: 0, x: 28, y: 13, w: 1, h: 1, small: true }],
        decor: m => { for (let x = 13; x < 17; x++) m.signs[`${x},4`] = svc; },
        npcs: () => [{ sp: 'yokomon', x: 14, y: 3, face: 'left', talk: svc }, grower('palmon', 5, 9), grower('tanemon', 22, 9), grower('lalamon', 5, 13), grower('floramon', 22, 13), ...farm([[11, 7], [17, 7], [11, 11], [17, 11], [14, 13], [6, 6]])] },
    ]);
  }
})();
