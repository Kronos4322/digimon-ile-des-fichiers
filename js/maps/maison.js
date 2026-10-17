'use strict';
// =====================================================================
//  MAISON DE JIJIMON — intérieur (on s'y réveille au début du jeu)
//  0 hors de la pièce   1 parquet   2 mur (vu de face)
// =====================================================================
(function () {
  const { say, rle } = DW.MapKit;


  // ------------------------------------------------------------ la BIBLIOTHÈQUE de Jijimon : des livres qui expliquent les règles
  const BOOKS = [
    ['Comment éduquer son Digimon', [
      "Un Digimon apprend de toi. Quand il réussit un exploit, FÉLICITE-le aussitôt (menu → Féliciter) : il devient plus heureux.",
      "Quand il fait une bêtise (un accident, une maladie par négligence...), GRONDE-le (menu → Gronder) : sa discipline monte.",
      "Gronder sans raison le rend triste. Féliciter trop souvent ne compte plus. Un Digimon bien discipliné obéit en combat ; mal élevé, il n'en fait qu'à sa tête."]],
    ['La faim, la soif et le poids', [
      "Ton Digimon a FAIM et SOIF : regarde les bulles au-dessus de sa tête. La viande calme la faim ; l'eau des rivières, des sources (pas la mer !) ou une Eau fraîche étanche la soif.",
      "Un bébé mange peu, un Champion beaucoup, et les gros Digimon encore plus. La nourriture ne soigne pas : pour les PV et les PM, il faut des RAM.",
      "Chaque repas le fait grossir un peu, l'entraînement le fait maigrir un peu. Certaines Digivolutions demandent un Digimon costaud, d'autres un Digimon léger : surveille sa corpulence dans sa fiche."]],
    ['Les toilettes et la propreté', [
      "Après un repas, et avec le temps, ton Digimon a besoin d'aller aux TOILETTES (une petite crotte dans sa bulle). Emmène-le vite à des toilettes : en ville, ou chez toi plus tard.",
      "S'il ne peut pas se retenir, il fait sur place : il est malheureux, et c'est une erreur de soin. Ramasse toujours ses crottes : la saleté le rend malade."]],
    ['Le sommeil, le repos et la santé', [
      "Chaque Digimon a son rythme : la plupart dorment la nuit, certains (les Digimon des ténèbres...) dorment le jour. Il ne dort que quand il a sommeil ; sinon, il peut se reposer une heure.",
      "Pendant le sommeil, la faim et la soif montent moins vite. Une nuit chez moi soigne toute l'équipe... et efface un K.O. !",
      "La MALADIE n'arrive pas par hasard : ce sont les négligences qui s'accumulent (faim, saleté, nuits blanches, blessures). Un Médicament la guérit."]],
    ["L'entraînement", [
      "Au Terrain d'entraînement, au sud de la ville, chaque poste travaille une statistique : PV, PM, Attaque, Défense, Vitesse, Intelligence. Appuie au bon moment pour réussir la séance.",
      "Les COMBATS font monter le NIVEAU, qui fixe jusqu'où ton Digimon peut progresser. L'ENTRAÎNEMENT remplit ce potentiel : ce sont ses points qui ouvrent les Digivolutions.",
      "L'Intelligence compte aussi au combat : un Digimon intelligent comprend parfois une nouvelle technique tout seul, après une victoire. C'est rare au début !"]],
    ['Les Digivolutions', [
      "Pour digivoluer, ton Digimon doit remplir des conditions : niveau, points d'entraînement, victoires, poids, peu d'erreurs de soin... Regarde sa fiche, onglet Digivolution.",
      "Quand tout est prêt, le Digivice vibre : c'est toi qui décides quand digivoluer. Un CHAMPION est bien plus fort qu'un Disciple : contre un Champion sauvage, un Disciple n'a presque aucune chance.",
      "Plus tard, d'anciens écussons permettront d'aller encore plus loin... mais c'est une autre histoire."]],
    ['Les K.O. et le cycle de la vie', [
      "Un Digimon a trois vies (les trois cœurs de sa fiche). Chaque K.O. en combat en coûte une ; une nuit chez moi en rend une.",
      "Au troisième K.O., ou à la fin de sa vie, ses données redeviennent un DigiŒuf : il renaît bébé, garde une partie de ce qu'il a appris, et ses données innées se renforcent."]],
  ];
  async function library() {
    for (;;) {
      const i = await DW.choose(BOOKS.map(b => '« ' + b[0] + ' »').concat(['Ranger les livres']), { y: 8 });
      if (i < 0 || i >= BOOKS.length) return;
      DW.Audio.sfx('select');
      for (const page of BOOKS[i][1]) await say(page);
    }
  }

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
        this.objects = this.FULL.filter(o => keep.has(o.kind) || (o.kind === 'bookshelf' && o.x === 1)).map(o => ({ ...o }))   // (la vieille bibliothèque reste)
          .concat([{ kind: 'sacks', x: 3, y: 3, w: 2, h: 1 },
            { kind: 'crates', x: 14, y: 10, w: 1, h: 1, small: true }]);
        this.wall = { base: '#b8a088', alt: '#a68e72', pattern: 'plain', wood: '#5a4030' };
        this.floor = { type: 'herring', cols: ['#8a7058', '#6a5440', '#4a3a2a'] };
        this.dark = { d: 0.18, col: '#2a2018' };
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
    npcs: [{ sp: 'jijimon', x: 9, y: 7, face: 'right', talk: () => DW.Story.jijimonTalk() },
      { sp: 'poyomon', x: 11, y: 4, face: 'right', talk: () => DW.Story.poyomonTalk() }],   // fixe, près du lit : il propose la sieste
    warps: [{ x: 7, y: 11, w: 2, h: 1, dir: 'down', to: 'village', tx: 19, ty: 6 }],
    signs: {
      '1,3': () => library(),
      '2,3': () => library(),
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
