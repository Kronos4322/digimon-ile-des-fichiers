'use strict';
// =====================================================================
//  SPRITES : rendu et cache des Digimon (respiration, poses de combat)
//  Repère de dessin 64x64, Digimon tourné vers la DROITE, sol à y≈62.
//  d.xxx = volume ; d.deco.xxx = décalcomanie (motif peint sur le volume)
// =====================================================================
(function () {
  const Art = DW.Art;
  const W = '#fbf6ea';

  const D = DW.DRAW = {}; // rempli par js/gfx/digimon/*.js


  // ------------------------------------------------------------ cache & API
  const cache = {};
  // résolutions de rendu (plus grand = plus de détails : les dessins sont des formes, pas des pixels étirés)
  // chaque stade est nettement plus grand que le précédent (Bébé < Entraînement < Disciple < Champion < Ultime < Méga)
  const RES_BATTLE = { 'Bébé': 42, 'Entraînement': 56, 'Disciple': 74, 'Champion': 102, 'Ultime': 114, 'Méga': 124 };
  const RES_OW = { 'Bébé': 22, 'Entraînement': 27, 'Disciple': 33, 'Champion': 46, 'Ultime': 54, 'Méga': 60 };   // bien visibles, surtout sur téléphone
  const BREATH = [1, 1.028, 1, 0.975], BREATH_OW = [1, 1.07];
  const S = DW.Sprites = {
    mon(sp, res, nFrames = 1) {
      const key = sp + '_' + res + '_' + nFrames;
      if (!cache[key]) {
        const draw = D[sp] || D.koromon;
        const frames = [];
        for (let f = 0; f < nFrames; f++) {
          const sq = nFrames === 4 ? BREATH[f] : nFrames === 2 ? BREATH_OW[f] : 0;
          // même respiration qu'une image déjà rendue : on la réutilise
          const same = nFrames === 4 ? BREATH.indexOf(sq) : -1;
          if (same >= 0 && same < f) { frames.push(frames[same]); continue; }
          frames.push(Art.render(draw, res, res, { box: [64, 64], squash: sq, ground: 62, rim: res >= 40, selout: res >= 30 }));
        }
        cache[key] = Object.assign({ frames }, frames[0]);
      }
      return cache[key];
    },
    battle(sp) { return S.mon(sp, RES_BATTLE[DW.SPECIES[sp].stage] || 72, 4); },
    // poses de combat : 'attack' (penché en avant) et 'hurt' (recul)
    pose(sp, pose) {
      const res = RES_BATTLE[DW.SPECIES[sp].stage] || 72, key = sp + '_' + res + '_' + pose;
      if (!cache[key]) {
        const draw = D[sp] || D.koromon, P = (draw.poses && draw.poses[pose]) || {};   // réglage propre à l'espèce (ex. tête au bord du cadre)
        const fr = Art.render(draw, res, res, { box: [64, 64], ground: 62, rim: true, selout: true, param: { pose }, dx: P.dx || 0,
          shear: P.shear != null ? P.shear : pose === 'attack' ? 0.16 : -0.12, squash: pose === 'hurt' ? 0.95 : 1.02 });
        cache[key] = Object.assign({ frames: [fr] }, fr);
      }
      return cache[key];
    },
    ow(sp) { return S.mon(sp, RES_OW[DW.SPECIES[sp].stage] || 24, 2); },
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
