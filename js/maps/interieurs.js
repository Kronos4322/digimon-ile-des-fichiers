'use strict';
// =====================================================================
//  INTÉRIEURS DES COMMERCES DE LA VILLE (Bazar, Dojo, Restaurant, Serre)
//  On parle au commerçant à travers le comptoir (cases du comptoir = panneau).
// =====================================================================
(function () {
  const { say, rle } = DW.MapKit;
  const MAPS = DW.MAPS;

  // pièce : w × (2 rangées de mur + h rangées de parquet), porte en bas au centre
  function room(w, h) {
    const door = Math.floor(w / 2) - 1, line = (a, b) => '0' + a.repeat(w - 2) + '0';
    return {
      door,
      rows: ['0'.repeat(w), line('2'), line('2'), ...Array.from({ length: h }, () => line('1')), '0'.repeat(door) + '11' + '0'.repeat(w - door - 2)],
    };
  }
  // ajoute un commerce : o.lot = emplacement extérieur (pour la sortie), o.service = script du commerçant
  function shop(id, o) {
    const R = room(o.w, o.h), m = {
      name: o.name, music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      rows: R.rows, objects: o.objects, npcs: o.npcs || [], signs: o.signs || {}, floor: o.floor, wall: o.wall,
      warps: [{ x: R.door, y: R.rows.length - 1, w: 2, h: 1, dir: 'down', to: 'village', tx: o.lot.x + 2, ty: o.lot.y + o.lot.h }],
      populate: o.populate,
    };
    m.entry = { x: R.door, y: R.rows.length - 2 };
    MAPS[id] = m;
    return m;
  }
  const svc = id => () => DW.Story.services[id]();
  const talkAt = (m, xs, y, fn) => xs.forEach(x => (m.signs[`${x},${y}`] = fn));

  // ------------------------------------------------------------ Bazar de Gotsumon
  const bazar = shop('bazar_in', {
    name: 'Bazar de Gotsumon', w: 14, h: 6, lot: { x: 6, y: 7, w: 5, h: 3 },
    floor: { type: 'stone', cols: ['#d8c4a8', '#b8a488', '#8a7458'] }, wall: { base: '#d8b8a0', alt: '#c09c84', pattern: 'brick', wood: '#7a5030' },
    objects: [
      { kind: 'bookshelf', v: 1, x: 1, y: 3, w: 2, h: 1 },
      { kind: 'counter', v: 0, x: 5, y: 4, w: 4, h: 1 },
      { kind: 'crates', v: 1, x: 10, y: 3, w: 1, h: 1, small: true }, { kind: 'crates', v: 0, x: 11, y: 3, w: 1, h: 1, small: true },
      { kind: 'sacks', x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'barrel', v: 0, x: 1, y: 7, w: 1, h: 1, small: true }, { kind: 'barrel', v: 1, x: 12, y: 7, w: 1, h: 1, small: true },
      { kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 9, y: 1, w: 2, h: 2, back: true, oy: -6 },
      { kind: 'plant', v: 0, x: 1, y: 6, w: 1, h: 1, small: true },
      { kind: 'shelf', x: 6, y: 1, w: 2, h: 1, back: true, oy: 6 }, { kind: 'poster', v: 1, x: 12, y: 1, w: 1, h: 1, back: true, oy: 15 },
      { kind: 'floorlamp', x: 12, y: 5, w: 1, h: 1, small: true },
    ],
    npcs: [{ sp: 'gotsumon', x: 7, y: 3, face: 'right', talk: svc('gotsumon') }],
  });
  talkAt(bazar, [5, 6, 7, 8], 4, svc('gotsumon'));
  bazar.signs['1,3'] = bazar.signs['2,3'] = 'Des catalogues de remèdes et de vieux plans de la ville.';

  // ------------------------------------------------------------ Dojo d'Elecmon
  const dojo = shop('dojo_in', {
    name: "Dojo d'Elecmon", w: 14, h: 7, lot: { x: 29, y: 7, w: 5, h: 3 },
    floor: { type: 'tatami', cols: ['#dccf8e', '#c8ba78', '#6a8a4a'] }, wall: { base: '#f4eedc', alt: '#e4dcc4', pattern: 'plain', wood: '#4a3020' },
    objects: [
      { kind: 'scroll', v: 1, x: 6, y: 1, w: 1, h: 2, back: true, oy: -4 }, { kind: 'scroll', v: 0, x: 3, y: 1, w: 1, h: 2, back: true, oy: -4 }, { kind: 'scroll', v: 0, x: 10, y: 1, w: 1, h: 2, back: true, oy: -4 },
      { kind: 'dummy', x: 1, y: 4, w: 1, h: 1, small: true }, { kind: 'dummy', x: 12, y: 4, w: 1, h: 1, small: true },
      { kind: 'weights', x: 1, y: 7, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 12, y: 8, w: 1, h: 1, small: true },
    ],
    npcs: [{ sp: 'elecmon', x: 7, y: 4, face: 'left', talk: svc('elecmon') }],
  });
  dojo.signs['6,2'] = '« Le corps se forge au combat. L\'esprit, à l\'entraînement. »';

  // ------------------------------------------------------------ Restaurant de Mushroomon
  const resto = shop('resto_in', {
    name: 'Restaurant aux Champignons', w: 14, h: 7, lot: { x: 6, y: 19, w: 5, h: 3 },
    floor: { type: 'tile', cols: ['#f6eee4', '#d0504a', '#9a3a34'] }, wall: { base: '#e4f2e4', alt: '#cce4cc', pattern: 'stripes', wood: '#8a5a3a' },
    objects: [
      { kind: 'oven', x: 1, y: 3, w: 2, h: 1 },
      { kind: 'counter', v: 1, x: 4, y: 4, w: 4, h: 1 },
      { kind: 'shelf', x: 4, y: 1, w: 2, h: 1, back: true, oy: 6 },
      { kind: 'dtable', v: 0, x: 10, y: 4, w: 2, h: 1 }, { kind: 'dtable', v: 1, x: 10, y: 7, w: 2, h: 1 }, { kind: 'dtable', v: 1, x: 3, y: 7, w: 2, h: 1 },
      { kind: 'window', v: 0, x: 9, y: 1, w: 2, h: 2, back: true, oy: -6 },
      { kind: 'plant', v: 1, x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'fridge', x: 11, y: 3, w: 1, h: 1, small: true }, { kind: 'poster', v: 0, x: 12, y: 1, w: 1, h: 1, back: true, oy: 15 },
      { kind: 'floorlamp', x: 1, y: 8, w: 1, h: 1, small: true },
    ],
    npcs: [{ sp: 'mushroomon', x: 6, y: 3, face: 'right', talk: svc('mushroomon') }],
  });
  talkAt(resto, [4, 5, 6, 7], 4, svc('mushroomon'));
  resto.signs['1,3'] = resto.signs['2,3'] = 'Le four à bois ronronne. Ça sent le champignon grillé...';

  // ------------------------------------------------------------ Serre de Yokomon (la DigiFerme)
  const serre = shop('serre_in', {
    name: 'Serre de Yokomon — DigiFerme', w: 16, h: 7, lot: { x: 29, y: 19, w: 5, h: 3 },
    floor: { type: 'stone', cols: ['#c8ccc0', '#a8ae9e', '#7a806e'] }, wall: { base: '#e4f4dc', alt: '#d0e8c4', pattern: 'diamond', wood: '#5a7a4a' },
    objects: [
      { kind: 'counter', v: 2, x: 6, y: 4, w: 4, h: 1 },
      { kind: 'pots', x: 1, y: 3, w: 2, h: 1 }, { kind: 'pots', x: 12, y: 3, w: 2, h: 1 },
      { kind: 'plant', v: 1, x: 1, y: 8, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 14, y: 8, w: 1, h: 1, small: true },
      { kind: 'plant', v: 1, x: 14, y: 5, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 1, y: 5, w: 1, h: 1, small: true },
      { kind: 'window', v: 0, x: 4, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 10, y: 1, w: 2, h: 2, back: true, oy: -6 },
      { kind: 'bigplant', x: 3, y: 3, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 11, y: 3, w: 1, h: 1, small: true },
    ],
    npcs: [],
    // les Digimon de la DigiFerme se promènent dans la serre
    populate() {
      const m = MAPS.serre_in, box = DW.state.box.slice(0, 6), spots = [[3, 6], [5, 7], [8, 7], [11, 6], [12, 8], [4, 8]];
      m.npcs = [{ sp: 'yokomon', x: 8, y: 3, face: 'left', talk: svc('yokomon') }]
        .concat(box.map((d, i) => ({ sp: d.sp, x: spots[i][0], y: spots[i][1], face: i % 2 ? 'left' : 'right', wander: 1, talk: () => say(`${d.name} se repose tranquillement à la DigiFerme. Il a l'air heureux.`) })));
    },
  });
  talkAt(serre, [6, 7, 8, 9], 4, svc('yokomon'));

  // ------------------------------------------------------------ Poste de Biyomon (on entre et on la trouve au guichet)
  const poste = shop('poste_in', {
    name: 'Poste de Biyomon', w: 14, h: 6, lot: { x: 24, y: 23, w: 5, h: 3 },
    floor: { type: 'herring', cols: ['#d8b088', '#b88a60', '#8a6040'] }, wall: { base: '#f0e8f8', alt: '#e0d4ec', pattern: 'stripes', wood: '#c86a9a' },
    objects: [
      { kind: 'counter', v: 2, x: 5, y: 4, w: 4, h: 1 },
      { kind: 'shelf', x: 2, y: 1, w: 2, h: 1, back: true, oy: 6 }, { kind: 'shelf', x: 10, y: 1, w: 2, h: 1, back: true, oy: 6 },
      { kind: 'sacks', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'sacks', x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'crates', v: 1, x: 1, y: 7, w: 1, h: 1, small: true }, { kind: 'nest', v: 0, x: 11, y: 7, w: 2, h: 1 },
      { kind: 'window', v: 0, x: 6, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'plant', v: 1, x: 12, y: 5, w: 1, h: 1, small: true },
    ],
    npcs: [{ sp: 'biyomon', x: 7, y: 3, face: 'down', talk: svc('biyomon') }],
  });
  talkAt(poste, [5, 6, 7, 8], 4, svc('biyomon'));
  poste.signs['2,2'] = poste.signs['3,2'] = poste.signs['10,2'] = poste.signs['11,2'] = 'Des casiers pleins de lettres. Certaines sont adressées à des Digimon qui ne sont pas encore revenus...';
  poste.signs['11,7'] = poste.signs['12,7'] = 'Un nid douillet : Biyomon y fait la sieste entre deux tournées.';
})();
