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
  const roomRows = (w, h) => {
    const door = Math.floor(w / 2) - 1, line = a => '0' + a.repeat(w - 2) + '0';
    return { door, rows: ['0'.repeat(w), line('2'), line('2'), ...Array.from({ length: h }, () => line('1')), '0'.repeat(door) + '11' + '0'.repeat(w - door - 2)] };
  };

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
            const R = roomRows(F.w, F.h);
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
