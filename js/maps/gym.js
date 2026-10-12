'use strict';
// =====================================================================
//  TERRAIN D'ENTRAÎNEMENT — juste au sud de la Ville des Fichiers
//  Une arène en plein air, un espace par stat :
//    zone de force (ouest) : W rochers (PV), E mannequins (Attaque)
//    piste ovale (centre)  : N haies (Vitesse)
//    zone de garde (est)   : A mur de pierre (Défense)
//    jardin zen (sud-est)  : F cercle de pierres (Intelligence)
//    cristal (sud-ouest)   : Ψ cristal de données (PM)
//  + gradins, torches, toilettes (y), panneau
// =====================================================================
(function () {
  const { say, paint, zoomMap } = DW.MapKit;
  const TRACK = { x: 16, y: 12.5, rx: 6.2, ry: 3.9 };

  const rows = paint(32, 22, '#', g => {
    g.rect(2, 2, 28, 18, '.');
    for (let x = 2; x < 30; x++) { g.set(x, 2, 'T'); g.set(x, 19, 'T'); }
    for (let y = 2; y < 20; y++) { g.set(2, y, 'T'); g.set(29, y, 'T'); }
    g.set(3, 3, 'T'); g.set(28, 3, 'T'); g.set(3, 18, 'T'); g.set(28, 18, 'T');
    // allée d'entrée et parvis
    g.rect(15, 0, 2, 6, '='); g.rect(12, 5, 8, 2, '=');
    // piste ovale : peinte au pixel près (map.plazas), le sol reste praticable
    g.rect(15, 6, 2, 2, '=');
    // zone de force (ouest) : terre battue
    g.rect(3, 8, 5, 8, '=');
    // zone de garde (est)
    g.rect(25, 7, 4, 5, '=');
    // jardin zen (sud-est) : sable ratissé
    g.rect(23, 14, 6, 4, 's');
    // décor
    g.scatter('f', 3, 3, 26, 16, 26, 41, ['.']);
    for (const [x, y] of [[4, 4], [27, 4], [27, 13], [4, 17], [10, 18], [22, 18]]) g.set(x, y, 'b');
    for (const x of [6, 25]) g.set(x, 6, 'V');
    g.set(12, 4, 'i'); g.set(19, 4, 'i');
    // antennes de données et tuyau (décor numérique)
    g.set(4, 6, '!'); g.set(27, 6, '!'); g.set(27, 17, '$');
    // postes d'entraînement
    g.set(4, 10, 'W'); g.set(4, 13, 'E'); g.set(6, 13, 'E');
    g.set(10, 12, 'N'); g.set(22, 12, 'N');
    g.set(27, 9, 'A');
    g.set(26, 16, 'F');
    g.set(10, 17, 'Ψ');   // cristal de données (PM)
    // toilettes et panneau
    g.set(5, 18, 'y'); g.set(14, 6, 'S');
  });

  DW.MAPS.gym = {
    name: "Terrain d'entraînement", music: 'village', bg: 'foret', ambient: 'town', theme: 'town', climate: 'village', region: 'village',
    rows, npcs: [],
    plazas: [{ x: TRACK.x * 16, y: TRACK.y * 16, rx: TRACK.rx * 16, ry: TRACK.ry * 16, t: 'dirt', inner: 0.6 }],
    objects: [
      // marquages au sol (on marche dessus)
      { kind: 'tracklines', x: 9, y: 8, w: 14, h: 9, walk: true },
      { kind: 'mat', x: 3, y: 12, w: 5, h: 3, walk: true },
      { kind: 'zenrakes', x: 23, y: 14, w: 6, h: 4, walk: true },
      // gradins, torches, râtelier à boucliers, rochers, bancs
      { kind: 'bleachers', x: 7, y: 3, w: 4, h: 2 }, { kind: 'bleachers', x: 21, y: 3, w: 4, h: 2 },
      { kind: 'torch', x: 13, y: 7, w: 1, h: 1, small: true }, { kind: 'torch', x: 18, y: 7, w: 1, h: 1, small: true },
      { kind: 'shieldrack', x: 25, y: 9, w: 1, h: 1, small: true },
      { kind: 'kanjirock', x: 6, y: 9, w: 2, h: 1 },
      { kind: 'stake', x: 7, y: 12, w: 1, h: 1, small: true }, { kind: 'punchbag', x: 7, y: 14, w: 1, h: 1, small: true },
      // panneaux à pictogramme devant chaque poste
      { kind: 'stationsign', v: 0, x: 3, y: 9, w: 1, h: 1, small: true }, { kind: 'stationsign', v: 1, x: 5, y: 12, w: 1, h: 1, small: true },
      { kind: 'stationsign', v: 3, x: 9, y: 12, w: 1, h: 1, small: true }, { kind: 'stationsign', v: 2, x: 28, y: 8, w: 1, h: 1, small: true },
      { kind: 'stationsign', v: 4, x: 25, y: 15, w: 1, h: 1, small: true }, { kind: 'stationsign', v: 5, x: 9, y: 17, w: 1, h: 1, small: true },
      { kind: 'rock', v: 1, x: 24, y: 16, w: 1, h: 1, small: true }, { kind: 'rock', v: 0, x: 28, y: 15, w: 1, h: 1, small: true },
      { kind: 'bench', x: 12, y: 18, w: 1, h: 1, small: true }, { kind: 'bench', x: 19, y: 18, w: 1, h: 1, small: true },
      { kind: 'barrel', v: 0, x: 3, y: 16, w: 1, h: 1, small: true }, { kind: 'barrel', v: 1, x: 28, y: 12, w: 1, h: 1, small: true },
      { kind: 'bunting', v: 6, x: 13, y: 4, w: 6, h: 1, top: true, oy: -14 },
    ],
    warps: [{ x: 15, y: 0, w: 2, h: 1, dir: 'up', to: 'village', tx: 19, ty: 29 }],
    signs: {
      '14,6': async () => {
        await say("TERRAIN D'ENTRAÎNEMENT — Ouest : rochers (PV) et mannequins (Attaque).  Piste : haies (Vitesse).  Est : mur (Défense).  Jardin zen : méditation (Intelligence).  Cristal de données : énergie (PM).");
        await say("Les COMBATS font monter le niveau, et le niveau fixe le POTENTIEL de ton Digimon (6 + 2 × niveau points par stat).");
        await say("L'ENTRAÎNEMENT remplit ce potentiel. Ce sont les points d'entraînement qui permettent de digivoluer !");
        await say("Pendant une séance, appuie sur ESPACE quand le curseur passe dans la zone verte. Plus ton Digimon est entraîné, plus c'est dur !");
      },
      '7,4': 'Les gradins des spectateurs. Un jour, ils seront remplis pour tes séances !', '8,4': 'Les gradins des spectateurs. Un jour, ils seront remplis pour tes séances !',
      '25,9': 'Un râtelier plein de boucliers cabossés. Parfait pour apprendre à encaisser.',
    },
  };
  DW.MapKit.zoomMap(DW.MAPS.gym, 'gym');   // plan agrandi ×2 (maps/common.js)
})();
