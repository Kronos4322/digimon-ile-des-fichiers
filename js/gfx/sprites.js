'use strict';
// =====================================================================
//  SPRITES : rendu et cache des Digimon (respiration, poses de combat)
//  Deux sources : les IMAGES dessinées par le joueur (ses planches, découpées par dev/optimiser_textures.py en
//  assets/commun/jeu/digi_<espèce>_<vue>.png, chargées par gfx/textures.js) et, pour les autres espèces, le dessin
//  par code (js/gfx/digimon/*.js) : repère 64x64, Digimon tourné vers la DROITE, sol à y≈62 ;
//  d.xxx = volume ; d.deco.xxx = décalcomanie (motif peint sur le volume).
// =====================================================================
(function () {
  const Art = DW.Art;

  const D = DW.DRAW = {}; // rempli par js/gfx/digimon/*.js
  // dessin de secours : espèce sans dessin, ou image du joueur pas encore chargée (écran titre)
  D._secours = d => { d.ell(32, 47, 15, 14, '#a8b0c4', 0, { shiny: true }); d.deco.ell(37, 43, 1.8, 2.4, '#2a2a3a'); d.deco.ell(43, 43, 1.6, 2.2, '#2a2a3a'); };

  // ------------------------------------------------------------ images du joueur
  // vues, tournées vers la droite : combat (de trois quarts : combats, menus), profil (de côté : marche à gauche ou à
  // droite), face (marche vers le bas), dos (marche vers le haut) ; taille : hauteur du Digimon dans le cadre de son
  // stade (la place qu'avait son dessin par code)
  const VUES = ['combat', 'profil', 'face', 'dos'];
  const IMAGES = {
    punimon: { taille: 0.77 }, nyokimon: { taille: 0.91 }, pabumon: { taille: 0.88 }, poyomon: { taille: 0.76 },   // (Pabumon : ses bulles comptent dans sa hauteur)
    koromon: { taille: 0.79 }, tsunomon: { taille: 0.95 }, bukamon: { taille: 0.95 },
  };
  const imageDe = (sp, vue) => (IMAGES[sp] && DW.Textures && DW.Textures.a('commun/digi_' + sp + '_' + vue)) || null;
  // une image dans le cadre res × res (sol à 62/64), à la haute définition du jeu ; respiration (squash), pose d'attaque
  // ou de recul (shear) : comme les dessins par code (Art.render)
  const nets = new Map();   // image réduite à sa taille d'affichage (réduction par moitiés : gfx/textures.js)
  function rendreImage(sp, im, res, o = {}) {
    const k = Art.HD || 1, N = Math.round(res * k), cv = Art.canvas(N + 2, N + 2), c = cv.getContext('2d');
    const s = Math.min(IMAGES[sp].taille * N / im.naturalHeight, 0.98 * N / im.naturalWidth);
    const w = Math.max(1, Math.round(im.naturalWidth * s)), h = Math.max(1, Math.round(im.naturalHeight * s));
    if (!nets.has(im)) nets.set(im, {});
    const R0 = nets.get(im), net = R0[w + 'x' + h] || (R0[w + 'x' + h] = DW.Textures.reduire(im, w, h));
    c.translate(1 + N / 2, 1 + N * 62 / 64);
    if (o.shear) c.transform(1, 0, -o.shear, 1, 0, 0);
    if (o.squash) c.scale(1 / Math.sqrt(o.squash), o.squash);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(net, -w / 2, -h, w, h);
    const R = { img: cv, w: cv.width / k, h: cv.height / k, k, data: c.getImageData(0, 0, cv.width, cv.height) };
    cv._k = k;   // (placée à sa taille logique, comme un dessin haute définition : engine/art.js)
    R.white = Art.tint(cv, '#ffffff'); R.black = Art.tint(cv, '#10142a');
    return R;
  }

  // ------------------------------------------------------------ cache & API
  const cache = {};
  // résolutions de rendu (plus grand = plus de détails : les dessins sont des formes, pas des pixels étirés)
  // chaque stade est nettement plus grand que le précédent (Bébé < Entraînement < Disciple < Champion < Ultime < Méga)
  const RES_BATTLE = { 'Bébé': 42, 'Entraînement': 56, 'Disciple': 74, 'Champion': 102, 'Ultime': 114, 'Méga': 124 };
  const RES_OW = { 'Bébé': 22, 'Entraînement': 27, 'Disciple': 33, 'Champion': 46, 'Ultime': 54, 'Méga': 60 };   // bien visibles, surtout sur téléphone
  const BREATH = [1, 1.028, 1, 0.975], BREATH_OW = [1, 1.07];
  const S = DW.Sprites = {
    IMAGES, VUES,
    // view : null (profil), 'combat' (de trois quarts : l'image du joueur, sinon le profil), 'back' (de dos) ou 'front'
    // (de face) ; sans dessin de face, on garde le profil
    mon(sp, res, nFrames = 1, view = null) {
      if (view === true) view = 'back';
      const vue = view === 'back' ? 'dos' : view === 'front' ? 'face' : view === 'combat' ? 'combat' : 'profil';
      const im = imageDe(sp, vue) || (vue === 'combat' ? imageDe(sp, 'profil') : null);
      if (im) {
        const key = sp + '_' + res + '_' + nFrames + '_' + vue;
        if (!cache[key]) {
          const frames = [];
          for (let f = 0; f < nFrames; f++) {
            const sq = nFrames === 4 ? BREATH[f] : nFrames === 2 ? BREATH_OW[f] : 0, same = nFrames === 4 ? BREATH.indexOf(sq) : -1;
            frames.push(same >= 0 && same < f ? frames[same] : rendreImage(sp, im, res, { squash: sq }));
          }
          cache[key] = Object.assign({ frames }, frames[0]);
        }
        return cache[key];
      }
      if (view === 'combat') view = null;   // (dessin par code : son profil)
      const draw = D[sp] || D._secours;
      if (view === 'front' && !(draw.views && draw.views.includes('front'))) view = null;
      const back = view === 'back';
      const key = sp + '_' + res + '_' + nFrames + (back ? '_dos' : view === 'front' ? '_face' : '');
      if (!cache[key]) {
        const frames = [];
        for (let f = 0; f < nFrames; f++) {
          const sq = nFrames === 4 ? BREATH[f] : nFrames === 2 ? BREATH_OW[f] : 0;
          // même respiration qu'une image déjà rendue : on la réutilise
          const same = nFrames === 4 ? BREATH.indexOf(sq) : -1;
          if (same >= 0 && same < f) { frames.push(frames[same]); continue; }
          // vu de dos : vrai dessin de dos si l'espèce en a un (draw.views), sinon profil sans les détails du visage
          const real = view && draw.views && draw.views.includes(view);
          frames.push(Art.render(draw, res, res, { box: [64, 64], squash: sq, ground: 62, rim: res >= 40, selout: res >= 30, back: back && !real, param: real ? { view } : undefined }));
        }
        cache[key] = Object.assign({ frames }, frames[0]);
      }
      return cache[key];
    },
    battle(sp) { return S.mon(sp, RES_BATTLE[DW.SPECIES[sp].stage] || 72, 4, 'combat'); },
    // poses de combat : 'attack' (penché en avant) et 'hurt' (recul)
    pose(sp, pose) {
      const res = RES_BATTLE[DW.SPECIES[sp].stage] || 72, im = imageDe(sp, 'combat') || imageDe(sp, 'profil');
      const key = sp + '_' + res + '_' + pose + (im ? '_image' : '');
      if (!cache[key]) {
        const draw = D[sp] || D._secours, P = (draw.poses && draw.poses[pose]) || {};   // réglage propre à l'espèce (ex. tête au bord du cadre)
        const o = { shear: P.shear != null ? P.shear : pose === 'attack' ? 0.16 : -0.12, squash: pose === 'hurt' ? 0.95 : 1.02 };
        const fr = im ? rendreImage(sp, im, res, o) : Art.render(draw, res, res, { box: [64, 64], ground: 62, rim: true, selout: true, param: { pose }, dx: P.dx || 0, ...o });
        cache[key] = Object.assign({ frames: [fr] }, fr);
      }
      return cache[key];
    },
    hasBack(sp) { return S.hasView(sp, 'back'); },
    hasView(sp, v) {
      if (imageDe(sp, v === 'back' ? 'dos' : 'face')) return true;
      const d = D[sp]; return !!(d && d.views && d.views.includes(v));
    },
    // view : true / 'back' = vu de dos (quand il monte), 'front' = de face (quand il descend) — gfx/digimon/vues.js
    ow(sp, view) { return S.mon(sp, RES_OW[DW.SPECIES[sp].stage] || 24, 2, view === true ? 'back' : view || null); },
    // les images du joueur viennent d'arriver : les Digimon déjà rendus avec leur dessin de secours sont refaits
    oublier() { for (const key in cache) if (IMAGES[key.slice(0, key.indexOf('_'))]) delete cache[key]; },
    // (x, y) = centre bas du sprite
    draw(c, spr, x, y, o = {}) {
      const fr = spr.frames ? spr.frames[(o.frame || 0) % spr.frames.length] : spr;
      const sc = o.scale || 1, w = spr.w * sc, h = spr.h * sc;
      const X = Math.round(x - w / 2), Y = Math.round(y - h);
      c.save();
      if (o.alpha != null) c.globalAlpha = o.alpha;
      if (o.flip) { c.translate(X + w, Y); c.scale(-1, 1); } else c.translate(X, Y);
      c.drawImage(o.silhouette ? fr.black : fr.img, 0, 0, w, h);
      if (o.white) { c.globalAlpha = (o.alpha != null ? o.alpha : 1) * o.white; c.drawImage(fr.white, 0, 0, w, h); }
      c.restore();
    },
  };
})();
