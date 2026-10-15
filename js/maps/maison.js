'use strict';
// =====================================================================
//  MAISON DE JIJIMON — intérieur (on s'y réveille au début du jeu)
//  0 hors de la pièce   1 parquet   2 mur (vu de face)
// =====================================================================
(function () {
  const { say, rle } = DW.MapKit;

  DW.MAPS.maison = {
    name: 'Maison de Jijimon', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    wall: { base: '#f2dcbc', alt: '#e6cba4', pattern: 'stripes', wood: '#8a5a32' },
    rows: [
      '0'.repeat(16),
      rle('0 2 2 2 2 2 2 2 2 2 2 2 2 2 2 0'),
      rle('0 2 2 2 2 2 2 2 2 2 2 2 2 2 2 0'),
      ...Array.from({ length: 8 }, () => rle('0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0')),
      rle('0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0'),
    ],
    objects: [
      // mur du fond
      { kind: 'bookshelf', v: 0, x: 1, y: 3, w: 2, h: 1 }, { kind: 'bookshelf', v: 1, x: 3, y: 3, w: 2, h: 1 },
      { kind: 'fireplace', x: 6, y: 3, w: 3, h: 1 },
      { kind: 'window', v: 0, x: 10, y: 1, w: 2, h: 2, back: true, oy: -6 },
      { kind: 'frame', x: 12, y: 1, w: 2, h: 1, back: true, oy: 8 },
      { kind: 'clock', x: 9, y: 3, w: 1, h: 1, small: true },
      { kind: 'bed', x: 12, y: 3, w: 2, h: 2 },
      { kind: 'plant', v: 1, x: 14, y: 3, w: 1, h: 1, small: true },
      // coin cuisine
      { kind: 'stove', x: 1, y: 6, w: 2, h: 1 },
      // salon
      { kind: 'rug', x: 5, y: 6, w: 4, h: 3, walk: true },
      { kind: 'table', x: 6, y: 7, w: 2, h: 1 },
      { kind: 'stool', x: 5, y: 7, w: 1, h: 1, small: true }, { kind: 'stool', x: 8, y: 7, w: 1, h: 1, small: true },
      { kind: 'chest', x: 14, y: 7, w: 1, h: 1, small: true },
      { kind: 'plant', v: 0, x: 1, y: 10, w: 1, h: 1, small: true }, { kind: 'plant', v: 1, x: 14, y: 10, w: 1, h: 1, small: true },
      { kind: 'staff', x: 11, y: 8, w: 1, h: 1, small: true },
      { kind: 'armchair', v: 0, x: 9, y: 5, w: 1, h: 1, small: true }, { kind: 'floorlamp', x: 13, y: 9, w: 1, h: 1, small: true },
      { kind: 'cushion', v: 2, x: 4, y: 9, w: 1, h: 1, small: true }, { kind: 'poster', v: 0, x: 5, y: 1, w: 1, h: 1, back: true, oy: 15 },
    ],
    // la maison suit le développement de la ville : un TAUDIS au début (ville en ruines), puis rénovée
    // (niveau 3), enfin cossue (niveau 7 : tapis, tableaux, plantes)
    build() {
      const lv = DW.Town ? DW.Town.level() : 0, stage = lv < 3 ? 0 : lv < 7 ? 1 : 2;
      if (this.stage === stage && this.objects.length) return;
      if (!this.FULL) { this.FULL = this.objects.map(o => ({ ...o })); this.SIGNS = { ...this.signs }; this.WALL = this.wall; }
      this.stage = stage; this.signs = { ...this.SIGNS };
      if (stage === 0) {
        const keep = new Set(['fireplace', 'window', 'bed', 'stove', 'table', 'stool', 'chest', 'staff', 'cushion', 'clock']);
        this.objects = this.FULL.filter(o => keep.has(o.kind)).map(o => ({ ...o }))
          .concat([{ kind: 'crates', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 2, y: 3, w: 1, h: 1, small: true }, { kind: 'sacks', x: 3, y: 3, w: 2, h: 1 },
            { kind: 'crates', x: 14, y: 10, w: 1, h: 1, small: true }]);
        this.wall = { base: '#b8a088', alt: '#a68e72', pattern: 'plain', wood: '#5a4030' };
        this.floor = { type: 'herring', cols: ['#8a7058', '#6a5440', '#4a3a2a'] };
        this.dark = { d: 0.18, col: '#2a2018' };
        for (const k of ['1,3', '2,3']) this.signs[k] = 'De vieilles caisses vermoulues. Tout ce qui reste de la ville d\'autrefois...';
        for (const k of ['3,3', '4,3']) this.signs[k] = 'Des sacs de grain à moitié vides.';
        for (const k of ['6,3', '7,3', '8,3']) this.signs[k] = 'Un petit feu dans la cheminée fissurée. Le vent siffle entre les planches...';
        for (const k of ['12,3', '12,4', '13,4']) this.signs[k] = 'Un lit de paille. Pas très confortable, mais Jijimon te l\'a laissé avec le sourire.';
        this.signs['14,10'] = 'Encore des caisses. La maison a bien besoin d\'être rénovée... Plus la ville grandira, plus elle sera belle !';
      } else {
        this.objects = this.FULL.map(o => ({ ...o }));
        this.wall = this.WALL; delete this.floor; delete this.dark;
        if (stage === 2) {
          this.objects.push({ kind: 'bigrug', v: 1, x: 10, y: 9, w: 3, h: 1, walk: true }, { kind: 'painting', v: 0, x: 2, y: 1, w: 2, h: 1, back: true, oy: 6 },
            { kind: 'bigplant', x: 1, y: 8, w: 1, h: 1, small: true });
          this.signs['1,8'] = 'Une belle plante offerte par les habitants. La ville a bien changé !';
        }
      }
      DW.World.unprepare(this);
    },
    npcs: [{ sp: 'jijimon', x: 9, y: 7, face: 'right', talk: () => DW.Story.jijimonTalk() }],
    warps: [{ x: 7, y: 11, w: 2, h: 1, dir: 'down', to: 'village', tx: 19, ty: 6 }],
    signs: {
      '1,3': 'Des livres sur les Digimon... « Digivolutions : le pouvoir de l\'entraînement ».',
      '2,3': 'Des livres sur les Digimon... « Digivolutions : le pouvoir de l\'entraînement ».',
      '3,3': "« Histoire de l'Île des Fichiers », tome 1. La Ville des Fichiers comptait autrefois des dizaines d'habitants...",
      '4,3': "« Histoire de l'Île des Fichiers », tome 1. La Ville des Fichiers comptait autrefois des dizaines d'habitants...",
      '6,3': 'Un bon feu crépite dans la cheminée. Il fait bon ici.', '7,3': 'Un bon feu crépite dans la cheminée. Il fait bon ici.', '8,3': 'Un bon feu crépite dans la cheminée. Il fait bon ici.',
      '9,3': () => say(`La vieille horloge indique ${DW.Time.str()}. Tic... tac...`),
      '12,3': 'Le lit où tu t\'es réveillé. Il sent bon le foin.',
      '12,4': 'Le lit où tu t\'es réveillé. Il sent bon le foin.', '13,4': 'Le lit où tu t\'es réveillé. Il sent bon le foin.',
      '1,6': 'Une marmite de soupe aux champignons mijote doucement.', '2,6': 'Une marmite de soupe aux champignons mijote doucement.',
      '14,7': "Le coffre de Jijimon. Il vaut mieux ne pas fouiller...",
      '6,7': 'Une tasse de thé encore chaude.', '7,7': 'Une tasse de thé encore chaude.',
      '11,8': 'Le bâton de Jijimon. Sa pierre bleue brille doucement.',
    },
  };
})();
