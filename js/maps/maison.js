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
