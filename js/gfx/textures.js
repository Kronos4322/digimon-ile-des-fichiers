'use strict';
// =====================================================================
//  TEXTURES DESSINÉES (assets/<dossier>/*.png, fabriquées avec ChatGPT) : chaque image présente remplace le dessin
//  par code de l'élément correspondant ; une image absente = le dessin par code reste (voir assets/volcan/LISEZ-MOI.txt).
//  Échelle des images : 1 case = 64 px. Le sol du jeu est peint à 16 px par case : une texture de sol de 256 px est
//  réduite à 64 × 64 (4 × 4 cases). Les objets gardent leur finesse (dessinés en haute définition).
//  Une carte choisit son dossier avec map.textures (ex. 'volcan' : maps/miharashi.js).
//  Utilisé par : gfx/terrain.js (sol, falaises, escaliers, lave, objets), game/lave.js (coulées, cratère).
// =====================================================================
(function () {
  const LISTE = {
    volcan: ['sol_cendres', 'dessus_falaise', 'lave', 'lave_2', 'lave_3', 'lave_4', 'falaise_basalte', 'paroi_cratere', 'escalier',
      'pic_1', 'pic_2', 'pic_3', 'rocher_magma', 'fumerolle', 'cone_lave', 'plante_feu_1', 'plante_feu_2', 'plante_feu_3'],
  };
  // objets du jeu remplacés par une image (par dossier) : un nom, ou plusieurs (variante choisie selon la case)
  const REMPLACE = { volcan: { lavarock: ['rocher_magma'], steamvent: ['fumerolle'], aiguille: ['pic_1', 'pic_2', 'pic_3'] } };
  const T = DW.Textures = { img: {}, fini: false, LISTE };
  const nav = typeof Image !== 'undefined' && typeof document !== 'undefined';
  const racine = nav && document.currentScript ? document.currentScript.src.replace(/js\/gfx\/textures\.js(\?.*)?$/, '') : '';
  const pix = {}, motifs = {};

  // chargement de toutes les images (les absentes valent null) ; main.js attend la fin avant de lancer le jeu
  // (chaque image a 10 s au plus : une image absente répond tout de suite, le petit serveur local les sert une par une)
  T.charge = !nav ? Promise.resolve() : Promise.all(Object.entries(LISTE).flatMap(([d, noms]) => noms.map(n => new Promise(ok => {
    const im = new Image(), fin = v => { if (!(d + '/' + n in T.img)) T.img[d + '/' + n] = v; ok(); };
    im.onload = () => fin(im.naturalWidth ? im : null); im.onerror = () => fin(null); setTimeout(() => fin(null), 10000);
    im.src = racine + 'assets/' + d + '/' + n + '.png';
  })))).then(() => { T.fini = true; objets(); });

  T.a = cle => T.img[cle] || null;
  // pixels d'une image réduite à w × h (pour peindre le sol au pixel) ; null si l'image manque
  T.pixels = (cle, w, h) => {
    const im = T.a(cle); if (!im) return null;
    const k = cle + '@' + w + 'x' + h; if (pix[k]) return pix[k];
    const cv = DW.Art.canvas(w, h), x = cv.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, w, h);
    return (pix[k] = { w, h, d: x.getImageData(0, 0, w, h).data, cv });
  };
  // couleur d'une texture qui se répète (coordonnées quelconques) ; a = opacité (0 à 255)
  T.lit = (P, x, y) => { const X = ((Math.floor(x) % P.w) + P.w) % P.w, Y = ((Math.floor(y) % P.h) + P.h) % P.h, o = (Y * P.w + X) * 4, d = P.d; return [d[o], d[o + 1], d[o + 2], d[o + 3]]; };
  // motif (canvas.createPattern) pour remplir une forme avec la texture
  T.motif = (c, cle, w = 64, h = 64) => { const P = T.pixels(cle, w, h); if (!P) return null; const k = cle + w + 'x' + h; return motifs[k] || (motifs[k] = c.createPattern(P.cv, 'repeat')); };
  // l'objet qui remplace « kind » sur cette carte (ou null) ; la variante dépend de la case
  T.objet = (map, kind, tx, ty) => {
    const R = map && map.textures && REMPLACE[map.textures] && REMPLACE[map.textures][kind]; if (!R) return null;
    const dispo = R.filter(n => T.a(map.textures + '/' + n)); if (!dispo.length) return null;
    return 'tex_' + map.textures + '_' + dispo[Math.floor(DW.Art.hash(tx, ty, 777) * dispo.length) % dispo.length];
  };
  // chaque image d'objet devient un objet du jeu « tex_<dossier>_<nom> » (taille : 1 case = 64 px)
  function objets() {
    const OBJ = DW.World && DW.World.OBJ; if (!OBJ) return;
    for (const [d, noms] of Object.entries(LISTE)) for (const n of noms) {
      const im = T.a(d + '/' + n); if (!im) continue;
      const w = Math.max(4, Math.round(im.naturalWidth / 4)), h = Math.max(4, Math.round(im.naturalHeight / 4));
      OBJ['tex_' + d + '_' + n] = { w, h, n: 1, noOutline: true, image: true,
        paint(x) { x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, w, h); },
        draw: dd => dd.rect(0, 0, 1, 1, 'rgba(0,0,0,0)') };
    }
  }
})();
