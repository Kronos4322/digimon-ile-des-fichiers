'use strict';
// =====================================================================
//  TEXTURES DESSINÉES (assets/<dossier>/*.png, fabriquées avec ChatGPT) : chaque image présente remplace le dessin
//  par code de l'élément correspondant ; une image absente = le dessin par code reste (voir assets/volcan/LISEZ-MOI.txt).
//  Le jeu charge d'abord la copie allégée (assets/<dossier>/jeu/, faite par dev/optimiser_textures.py), sinon l'original.
//  Quelle que soit la taille de l'image, elle est mise à l'échelle du jeu (TAILLE, en pixels du jeu : 1 case = 16) ;
//  les objets sont d'abord recadrés sur leur contenu (fond transparent enlevé).
//  Une carte choisit son dossier avec map.textures (ex. 'volcan' : maps/miharashi.js).
//  Utilisé par : gfx/terrain.js (sol, falaises, escaliers, lave, objets), gfx/premium.js (cratère), game/lave.js (coulées).
// =====================================================================
(function () {
  const LISTE = {
    volcan: ['sol_cendres', 'dessus_falaise', 'lave', 'herbe', 'herbe_seche', 'sable', 'chemin', 'falaise_basalte', 'paroi_cratere', 'escalier',
      'pic_1', 'pic_2', 'pic_3', 'rocher_magma', 'fumerolle', 'cone_lave', 'plante_feu_1', 'plante_feu_2', 'plante_feu_3'],
  };
  // taille dans le jeu : [largeur, hauteur] pour une texture, { h } ou { w } pour un objet (l'autre côté suit l'image)
  const TAILLE = {
    sol_cendres: [128, 128], dessus_falaise: [176, 176], lave: [128, 128], herbe: [128, 128], herbe_seche: [128, 128], sable: [128, 128], chemin: [128, 128],
    falaise_basalte: [80, 64], paroi_cratere: [80, 64], escalier: [48, 64],
    pic_1: { h: 34 }, pic_2: { h: 30 }, pic_3: { h: 32 }, rocher_magma: { w: 24 }, fumerolle: { w: 18 }, cone_lave: { w: 26 },
    plante_feu_1: { h: 16 }, plante_feu_2: { h: 14 }, plante_feu_3: { h: 16 },
  };
  // objets du jeu remplacés par une image (par dossier) : un nom, ou plusieurs (variante choisie selon la case)
  const REMPLACE = { volcan: { lavarock: ['rocher_magma'], steamvent: ['fumerolle'], aiguille: ['pic_1', 'pic_2', 'pic_3'] } };
  const T = DW.Textures = { img: {}, fini: false, LISTE, TAILLE };
  const nav = typeof Image !== 'undefined' && typeof document !== 'undefined';
  const racine = nav && document.currentScript ? document.currentScript.src.replace(/js\/gfx\/textures\.js(\?.*)?$/, '') : '';
  const pix = {}, motifs = {};
  const nomDe = cle => cle.split('/')[1];

  // chargement : la copie allégée, sinon l'original, sinon rien (null) ; main.js attend la fin avant de lancer le jeu
  const charger = url => new Promise(ok => { const im = new Image(); im.onload = () => ok(im.naturalWidth ? im : null); im.onerror = () => ok(null); setTimeout(() => ok(null), 10000); im.src = url; });
  T.charge = !nav ? Promise.resolve() : Promise.all(Object.entries(LISTE).flatMap(([d, noms]) => noms.map(async n => {
    T.img[d + '/' + n] = (await charger(racine + 'assets/' + d + '/jeu/' + n + '.png')) || (await charger(racine + 'assets/' + d + '/' + n + '.png'));
  }))).then(() => { T.fini = true; objets(); });

  T.a = cle => T.img[cle] || null;
  // réduction par moitiés successives (une grande image réduite d'un coup devient granuleuse)
  function reduire(im, sx, sy, sw, sh, w, h) {
    let src = im, ox = sx, oy = sy, cw = sw, ch = sh;
    while (cw / 2 >= w && ch / 2 >= h) {
      const n = DW.Art.canvas(Math.ceil(cw / 2), Math.ceil(ch / 2)), x = n.getContext('2d');
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, ox, oy, cw, ch, 0, 0, n.width, n.height);
      src = n; ox = 0; oy = 0; cw = n.width; ch = n.height;
    }
    const out = DW.Art.canvas(w, h), x = out.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, ox, oy, cw, ch, 0, 0, w, h);
    return out;
  }
  // pixels d'une texture à sa taille de jeu (ou w × h) ; null si l'image manque
  T.pixels = (cle, w, h) => {
    const im = T.a(cle); if (!im) return null;
    const t = TAILLE[nomDe(cle)]; w = w || (Array.isArray(t) ? t[0] : 64); h = h || (Array.isArray(t) ? t[1] : 64);
    const k = cle + '@' + w + 'x' + h; if (pix[k]) return pix[k];
    const cv = reduire(im, 0, 0, im.naturalWidth, im.naturalHeight, w, h);
    return (pix[k] = { w, h, d: cv.getContext('2d').getImageData(0, 0, w, h).data, cv });
  };
  // couleur d'une texture qui se répète (coordonnées quelconques) ; [r, g, b, opacité 0 à 255]
  T.lit = (P, x, y) => { const X = ((Math.floor(x) % P.w) + P.w) % P.w, Y = ((Math.floor(y) % P.h) + P.h) % P.h, o = (Y * P.w + X) * 4, d = P.d; return [d[o], d[o + 1], d[o + 2], d[o + 3]]; };
  // motif (canvas.createPattern) pour remplir une forme avec la texture
  T.motif = (c, cle) => { const P = T.pixels(cle); if (!P) return null; return motifs[cle] || (motifs[cle] = c.createPattern(P.cv, 'repeat')); };
  // l'objet qui remplace « kind » sur cette carte (ou null) ; la variante dépend de la case
  T.objet = (map, kind, tx, ty) => {
    const R = map && map.textures && REMPLACE[map.textures] && REMPLACE[map.textures][kind]; if (!R) return null;
    const dispo = R.filter(n => T.a(map.textures + '/' + n)); if (!dispo.length) return null;
    return 'tex_' + map.textures + '_' + dispo[Math.floor(DW.Art.hash(tx, ty, 777) * dispo.length) % dispo.length];
  };
  // contour utile d'une image (pixels assez opaques) : on enlève le fond transparent autour
  function cadre(im) {
    const s = Math.max(1, Math.floor(Math.max(im.naturalWidth, im.naturalHeight) / 400)), w = Math.ceil(im.naturalWidth / s), h = Math.ceil(im.naturalHeight / s);
    const cv = DW.Art.canvas(w, h), x = cv.getContext('2d'); x.drawImage(im, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 40) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return [0, 0, im.naturalWidth, im.naturalHeight];
    return [x0 * s, y0 * s, Math.min(im.naturalWidth, (x1 + 1) * s) - x0 * s, Math.min(im.naturalHeight, (y1 + 1) * s) - y0 * s];
  }
  // chaque image d'objet devient un objet du jeu « tex_<dossier>_<nom> », à sa taille de jeu (TAILLE)
  function objets() {
    const OBJ = DW.World && DW.World.OBJ; if (!OBJ) return;
    for (const [d, noms] of Object.entries(LISTE)) for (const n of noms) {
      const im = T.a(d + '/' + n), t = TAILLE[n]; if (!im || !t || Array.isArray(t)) continue;
      const [sx, sy, sw, sh] = cadre(im), w = Math.round(t.w || t.h * sw / sh), h = Math.round(t.h || t.w * sh / sw);
      let net = null;
      OBJ['tex_' + d + '_' + n] = { w, h, n: 1, noOutline: true, image: true,
        paint(x) { const k = DW.Art.HD || 1; net = net || reduire(im, sx, sy, sw, sh, w * k, h * k); x.drawImage(net, 0, 0, w, h); },
        draw: dd => dd.rect(0, 0, 1, 1, 'rgba(0,0,0,0)') };
    }
  }
})();
