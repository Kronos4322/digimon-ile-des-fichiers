'use strict';
// =====================================================================
//  SPRITES : rendu et cache des Digimon (respiration, poses de combat)
//  Deux sources : les IMAGES dessinées par le joueur (ses planches, découpées par dev/optimiser_textures.py en
//  assets/commun/jeu/digi_<espèce>_<vue>.webp, chargées par gfx/textures.js) et, pour les autres espèces, le dessin
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
    // (echelle : l'espèce entière plus grande que son stade — Bukamon, « toujours trop petit » pour le joueur)
    koromon: { taille: 0.79 }, tsunomon: { taille: 0.95 }, bukamon: { taille: 0.95, echelle: 1.3 },
    // (21/10 : Botamon, Pichimon et YukimiBotamon en pixel art ; Yuramon, Disciples et Champions peints)
    botamon: { taille: 0.58 }, pichimon: { taille: 0.58 }, yukimibotamon: { taille: 0.58 }, yuramon: { taille: 0.72 },
    betamon: { taille: 0.79 }, elecmon: { taille: 0.87 }, mushroomon: { taille: 0.92 }, palmon: { taille: 0.97 },
    kuwagamon: { taille: 0.98 }, shellmon: { taille: 0.96 }, whamon: { taille: 0.95 },
    // (21/10 au soir : Agumon et les Champions de la série, peints ; Koromon a sa nouvelle planche)
    agumon: { taille: 0.95 }, greymon: { taille: 0.96 }, garurumon: { taille: 0.86 }, birdramon: { taille: 0.96 }, kabuterimon: { taille: 0.95 },
    togemon: { taille: 0.95 }, ikkakumon: { taille: 0.86 }, angemon: { taille: 0.96 }, monochromon: { taille: 0.86 }, drimogemon: { taille: 0.82 },
    meramon: { taille: 0.96 },
  };
  const imageDe = (sp, vue) => (IMAGES[sp] && DW.Textures && DW.Textures.a('commun/digi_' + sp + '_' + vue)) || null;
  // une image dans le cadre res × res (sol à 62/64), à la haute définition du jeu ; respiration (squash), pose d'attaque
  // ou de recul (shear) : comme les dessins par code (Art.render)
  const nets = new Map();   // image réduite à sa taille d'affichage (réduction par moitiés : gfx/textures.js)
  function rendreImage(sp, im, res, o = {}) {
    // (une image très large — profil d'un quadrupède, ailes ouvertes — garde la hauteur de son espèce : son cadre s'élargit,
    //  jusqu'à 1,6 fois, au lieu de rétrécir le Digimon : il ne paraît plus plus petit de profil que de face)
    const k = Art.HD || 1, N = Math.round(res * k);
    const s = Math.min(IMAGES[sp].taille * N / im.naturalHeight, 1.6 * 0.98 * N / im.naturalWidth);
    const w = Math.max(1, Math.round(im.naturalWidth * s)), h = Math.max(1, Math.round(im.naturalHeight * s));
    const L = Math.max(N, Math.ceil(w / 0.98)), cv = Art.canvas(L + 2, N + 2), c = cv.getContext('2d');
    if (!nets.has(im)) nets.set(im, {});
    const R0 = nets.get(im), net = R0[w + 'x' + h] || (R0[w + 'x' + h] = DW.Textures.reduire(im, w, h));
    c.translate(1 + L / 2, 1 + N * 62 / 64);
    if (o.shear) c.transform(1, 0, -o.shear, 1, 0, 0);
    if (o.squash) c.scale(1 / Math.sqrt(o.squash), o.squash);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(net, -w / 2, -h, w, h);
    const R = { img: cv, w: cv.width / k, h: cv.height / k, k, data: c.getImageData(0, 0, cv.width, cv.height) };
    cv._k = k;   // (placée à sa taille logique, comme un dessin haute définition : engine/art.js)
    R.white = Art.tint(cv, '#ffffff'); R.black = Art.tint(cv, '#10142a');
    return R;
  }

  // ------------------------------------------------------------ recadrage des dessins par code
  // Des dessins dépassaient un peu du cadre 64×64 et étaient coupés (queue de Greymon, cornes de Kabuterimon, aile de
  // Birdramon...) : chacun est réduit juste ce qu'il faut, les pieds toujours sur le sol, et recentré si besoin.
  // [échelle, décalage horizontal] mesurés par DW.Sprites.mesurerCadres() (console du navigateur) : à relancer si un
  // dessin change.
  const CADRE = { yokomon: [0.991, 0], gomamon: [0.968, 0.5], biyomon: [0.976, 0], gabumon: [0.953, 0],
    metalgreymon: [0.939, 0], zudomon: [1, -2], weregarurumon: [0.953, 0], skullmeramon: [0.976, 0],
    garudamon: [0.961, -0.2], okuwamon: [0.984, -4.4], wargreymon: [0.991, -1.7], metalgarurumon: [0.961, -0.2], jijimon: [0.991, 0], tentomon: [1, -1],
    frigimon: [0.976, 0], ogremon: [0.945, 0], seadramon: [0.991, -0.7],
    centarumon: [1, -2.5], devimon: [0.968, -0.5], skullgreymon: [1, 1], megadramon: [0.991, -1.2], guilmon: [0.976, 1.2],
    candlemon: [0.983, 0], flarizamon: [0.991, 0.7] };
  // options de rendu (engine/art.js) d'un dessin recadré : repère agrandi de 1/échelle, sol gardé à y = 62
  const cadre = (sp, o) => { const C = CADRE[sp]; if (!C) return o; const [s, sh] = C; return { ...o, box: [64 / s, 64 / s], dx: 32 / s - 32 + sh / s + (o.dx || 0), dy: 62 / s - 62, ground: 62 }; };

  // ------------------------------------------------------------ cache & API
  const cache = {};
  // résolutions de rendu (plus grand = plus de détails : les dessins sont des formes, pas des pixels étirés)
  // chaque stade est nettement plus grand que le précédent (Bébé < Entraînement < Disciple < Champion < Ultime < Méga)
  // (21/10, le joueur : « les Digimon sont trop petits » — sur la carte +30 % ; en combat, les petits stades grandissent, les
  //  grands restent sous le haut de l'écran)
  const RES_BATTLE = { 'Bébé': 50, 'Entraînement': 66, 'Disciple': 86, 'Champion': 108, 'Ultime': 118, 'Méga': 126 };
  const RES_OW = { 'Bébé': 28, 'Entraînement': 35, 'Disciple': 43, 'Champion': 58, 'Ultime': 68, 'Méga': 76 };   // bien visibles, surtout sur téléphone
  const BREATH = [1, 1.028, 1, 0.975], BREATH_OW = [1, 1.07];
  // taille du cadre d'une espèce : celle de son stade, fois son échelle propre (IMAGES)
  const resDe = (sp, RES, def) => Math.round((RES[DW.SPECIES[sp].stage] || def) * ((IMAGES[sp] && IMAGES[sp].echelle) || 1));
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
          frames.push(Art.render(draw, res, res, cadre(D[sp] ? sp : null, { box: [64, 64], squash: sq, ground: 62, rim: res >= 40, selout: res >= 30, back: back && !real, param: real ? { view } : undefined })));
        }
        cache[key] = Object.assign({ frames }, frames[0]);
      }
      return cache[key];
    },
    battle(sp) { return S.mon(sp, resDe(sp, RES_BATTLE, 72), 4, 'combat'); },
    // poses de combat : 'attack' (penché en avant) et 'hurt' (recul)
    pose(sp, pose) {
      const res = resDe(sp, RES_BATTLE, 72), im = imageDe(sp, 'combat') || imageDe(sp, 'profil');
      const key = sp + '_' + res + '_' + pose + (im ? '_image' : '');
      if (!cache[key]) {
        const draw = D[sp] || D._secours, P = (draw.poses && draw.poses[pose]) || {};   // réglage propre à l'espèce (ex. tête au bord du cadre)
        const o = { shear: P.shear != null ? P.shear : pose === 'attack' ? 0.16 : -0.12, squash: pose === 'hurt' ? 0.95 : 1.02 };
        const fr = im ? rendreImage(sp, im, res, o) : Art.render(draw, res, res, cadre(D[sp] ? sp : null, { box: [64, 64], ground: 62, rim: true, selout: true, param: { pose }, dx: P.dx || 0, ...o }));
        cache[key] = Object.assign({ frames: [fr] }, fr);
      }
      return cache[key];
    },
    // (outil) mesure ce qui dépasse du cadre 64×64 et renvoie la table CADRE à recopier ci-dessus (marge d'une unité)
    mesurerCadres(M = 1) {
      const B = 160, OFF = 48, N = 320, out = {};
      for (const sp of Object.keys(DW.SPECIES)) {
        if (IMAGES[sp] || !D[sp]) continue;
        const R = Art.render(D[sp], N, N, { box: [B, B], dx: OFF, dy: OFF, ground: 62, hd: 1, rim: true, selout: true }), d = R.img.getContext('2d').getImageData(0, 0, N, N).data;
        let x0 = 1e9, y0 = 1e9, x1 = -1e9;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (d[(y * N + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; }
        const k = N / B; x0 = x0 / k - OFF; x1 = (x1 + 1) / k - OFF; y0 = y0 / k - OFF;
        if (x0 >= M && x1 <= 64 - M && y0 >= M) continue;
        let s = 1; if (y0 < M) s = Math.min(s, (62 - M) / (62 - y0)); if (x1 - x0 > 64 - 2 * M) s = Math.min(s, (64 - 2 * M) / (x1 - x0));
        s = Math.floor(s * 1000) / 1000;
        const X0 = 32 + (x0 - 32) * s, X1 = 32 + (x1 - 32) * s; let sh = 0; if (X0 < M) sh = M - X0; if (X1 + sh > 64 - M) sh = 64 - M - X1;
        out[sp] = [s, Math.round(sh * 10) / 10];
      }
      return out;
    },
    hasBack(sp) { return S.hasView(sp, 'back'); },
    hasView(sp, v) {
      if (imageDe(sp, v === 'back' ? 'dos' : 'face')) return true;
      const d = D[sp]; return !!(d && d.views && d.views.includes(v));
    },
    // view : true / 'back' = vu de dos (quand il monte), 'front' = de face (quand il descend) — gfx/digimon/vues.js
    ow(sp, view) { return S.mon(sp, resDe(sp, RES_OW, 24), 2, view === true ? 'back' : view || null); },
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
