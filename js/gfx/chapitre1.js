'use strict';
// =====================================================================
//  DÉCOR DU CHAPITRE 1
//  - grandarbre (4×3) : l'arbre immense de la Clairière de l'Arrivée, où se cache Kuwagamon.
//    v0 : écorce gravée ; v1, v2 : une, puis deux fissures (énigmes résolues) ; v3 : écorce éclatée, passage ouvert
//  - treeroots, kuwanest : décor du Cœur du Grand Arbre
//  - trophystand (1×1) : présentoir de trophée de la cave du joueur ; v0 vide, v1 Kuwagamon (et les suivants, v5 Meramon)
//  - arbrecreux (1×1) : le vieil arbre creux de la Prairie des Lucioles, entrée du village des Poyomon (maps/yokomon.js)
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  // (le grand chêne, avec l'image du joueur si elle est chargée : gfx/textures.js, bigtree)
  const chene = () => DW.World.obj('bigtree', 0);
  Object.assign(OBJ, {
    // LE VIEIL ARBRE CREUX : le grand chêne (3 fois le héros, comme tous les arbres) et, au pied de son tronc, une ouverture
    // sombre où l'on se faufile (remarque du joueur : la petite bûche couchée d'avant n'était « pas assez grosse »)
    arbrecreux: { w: () => chene().w - 2, h: () => chene().h - 2, n: 1, paint(x) {
      const B = chene(), iw = B.w - 2, ih = B.h - 2;
      x.drawImage(B.img, -1, -1, B.w, B.h);
      // le tronc de l'image (chêne de 112 × 111 posé en bas, sur toute la largeur) : centre à 57,5 / 112 ; dessin de secours
      // (image absente) : tronc au milieu
      const im = DW.Textures && DW.Textures.a('commun/arbre_chene'), s = iw / (im ? im.naturalWidth : 112);
      const cx = im ? 57.5 * s : iw / 2, bas = ih - 3 * s, hw = 6.5 * s, hh = 16 * s;
      const arche = (dx, dy, r, h) => { x.beginPath(); x.moveTo(dx - r, dy); x.lineTo(dx - r, dy - h + r); x.ellipse(dx, dy - h + r, r, r, 0, Math.PI, 0); x.lineTo(dx + r, dy); x.closePath(); x.fill(); };
      x.fillStyle = 'rgba(20,12,6,0.45)'; x.beginPath(); x.ellipse(cx, bas + 0.8, hw + 3, 2, 0, 0, 7); x.fill();   // ombre au pied
      x.fillStyle = '#6a4424'; arche(cx, bas + 0.6, hw + 1.6, hh + 1.6);   // bord d'écorce relevé
      const g = x.createLinearGradient(0, bas - hh, 0, bas); g.addColorStop(0, '#2a180c'); g.addColorStop(1, '#070302');
      x.fillStyle = g; arche(cx, bas, hw, hh);   // le creux, noir au fond
      x.strokeStyle = 'rgba(232,200,140,0.55)'; x.lineWidth = 0.8; x.beginPath(); x.ellipse(cx, bas - hh + hw, hw + 0.8, hw + 0.8, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();   // lumière sur l'arête
    } },
    grandarbre: { w: 132, h: 150, n: 4 },   // (peint : gfx/peints.js ; avec l'image du joueur : gfx/textures.js)
    // racines qui pendent du plafond, gouttes de sève lumineuse (décor mural du Cœur du Grand Arbre)
    treeroots: { w: 40, h: 44, n: 2, draw: DW.World.secours.bois(40, 44) },
    // le nid de Kuwagamon : bois mâché, carapaces, une lueur rouge
    kuwanest: { w: 64, h: 30, n: 1, draw(d) {
      d.ell(32, 22, 30, 7, '#4a3220', 0, { tex: 0.4 });
      for (let k = 0; k < 9; k++) d.tube([[6 + k * 6, 24], [10 + k * 6, 14 + (k % 3) * 2]], 2, 1.4, k % 2 ? '#7a5434' : '#9a7044');
      d.ell(32, 18, 18, 4, '#2a1a10');
      for (const [x, y] of [[22, 16], [42, 17]]) d.ell(x, y, 5, 3, '#c83a2a', 0.3, { shiny: true });
      d.deco.circ(32, 16, 3, '#ff5a3a', { unlit: true });
    } },
    trophystand: { w: 26, h: 40, n: 6, draw(d, v) {
      d.rect(3, 26, 20, 12, '#7a5a3a', { round: 0.12, tex: 0.3 }); d.deco.rect(3, 26, 20, 2, '#a07a4a');
      d.deco.rect(8, 31, 10, 3, '#d8c070');                       // plaque
      if (!v) { d.deco.circ(13, 24, 1.4, '#5a4a3a'); return; }
      d.rect(6, 22, 14, 5, '#e8c040', { round: 0.3, shiny: true });   // socle doré
      if (v === 1) {   // Kuwagamon : tête rouge et grandes pinces
        d.ell(13, 15, 6, 6, '#c83a2a', 0, { shiny: true });
        d.tube([[9, 11], [5, 4], [8, 1]], 1.6, 1, '#d8d0c0'); d.tube([[17, 11], [21, 4], [18, 1]], 1.6, 1, '#d8d0c0');
        for (const x of [6, 9, 17, 20]) d.deco.line(x, 6, x + (x < 13 ? -1 : 1), 8, 0.6, '#8a8070');
        d.deco.circ(11, 14, 1, '#ffe060', { unlit: true }); d.deco.circ(15, 14, 1, '#ffe060', { unlit: true });
      } else if (v === 2) {   // Shellmon : coquille rose en spirale et tentacule vert
        d.ell(13, 14, 7, 6.5, '#f0a0b8', 0, { shiny: true });
        d.deco.curve([[13, 14], [16, 12], [15, 9], [11, 10], [10, 14], [13, 18]], 0.8, '#c06a88');
        d.tube([[7, 18], [4, 12], [6, 7]], 1.6, 1, '#5ab04a');
      } else if (v === 3) {   // Monochromon : tête grise cuirassée, corne d'ivoire
        d.ell(13, 15, 7, 5.5, '#7a7a86', 0, { shiny: true, tex: 0.3 });
        d.poly([[13, 9], [11, 2], [15, 9]], '#ece4cc'); d.deco.line(8, 13, 18, 13, 0.7, '#4a4a56');
        d.deco.circ(10, 15, 1, '#e8482a', { unlit: true }); d.deco.circ(16, 15, 1, '#e8482a', { unlit: true });
      } else if (v === 4) {   // Seadramon : tête de serpent de mer bleue, crête orange
        d.ell(13, 15, 6.5, 5, '#3a8ae0', 0, { shiny: true });
        d.poly([[8, 11], [10, 4], [12, 10]], '#f0902a'); d.poly([[14, 10], [16, 4], [18, 11]], '#f0902a');
        d.deco.ell(10.5, 14, 1.3, 0.9, '#ffffff', 0, { unlit: true }); d.deco.ell(15.5, 14, 1.3, 0.9, '#ffffff', 0, { unlit: true });
        d.deco.line(9, 18, 17, 18, 0.7, '#1a4a8a');
      } else if (v === 5) {   // Meramon : tête de flammes orange et jaunes, yeux noirs
        d.poly([[6, 20], [5, 12], [8, 6], [9, 10], [11, 2], [13, 8], [16, 1], [17, 9], [20, 5], [21, 13], [20, 20]], '#f0601a', { unlit: true });
        d.poly([[9, 20], [8, 14], [11, 9], [13, 13], [16, 8], [18, 14], [17, 20]], '#ffc838', { unlit: true });
        d.deco.ell(10.5, 15, 1.4, 1.8, '#1a1010', 0, { unlit: true }); d.deco.ell(15.5, 15, 1.4, 1.8, '#1a1010', 0, { unlit: true });
        d.deco.line(10, 19, 16, 19, 0.7, '#8a1a10');
      } else {         // trophée générique : une coupe
        d.poly([[7, 8], [19, 8], [16, 18], [10, 18]], '#e8c040', { shiny: true });
        d.tube([[13, 18], [13, 22]], 1.4, 2, '#d8b030');
      }
    } },
  });
  OBJ.grandarbre.scale = 1.15;
  // (dessiné pendant le chargement avec le chêne de secours : redessiné dès que les images du joueur sont là)
  if (DW.Textures && DW.Textures.charge) DW.Textures.charge.then(() => DW.World.oublierObjet('arbrecreux'));
})();
