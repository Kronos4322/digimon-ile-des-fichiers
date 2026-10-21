'use strict';
// =====================================================================
//  GALERIE DES SPRITES (dev/gallery.html, jamais chargée par le jeu) : chaque Digimon en combat et sur la carte,
//  le héros dans ses 4 directions, les icônes des objets.
//    gallery.html?sp=agumon,greymon   (vide : tous les Digimon, dans l'ordre du DigiDex)
//    gallery.html?hero                 (le héros : 4 directions × 4 pas)
//    gallery.html?icons                (les icônes de tous les objets)
//  Le titre de l'onglet donne ensuite le temps de rendu.
// =====================================================================
(function () {
  const q = new URLSearchParams(location.search);
  const pick = (q.get('sp') || '').split(',').filter(Boolean);
  const SC = 3, g = document.getElementById('g'), c = g.getContext('2d');
  g.style.width = '100%';
  const t0 = performance.now();
  // (on attend les images du joueur : certains Digimon sont ses images, gfx/sprites.js)
  DW.Textures.charge.then(() => {
    if (q.has('hero')) {
      g.width = 300 * SC; g.height = 290 * SC; c.imageSmoothingEnabled = false; c.scale(SC, SC);
      c.fillStyle = '#5cb452'; c.fillRect(0, 0, 300, 290);
      ['down', 'up', 'right', 'left'].forEach((d, j) => [0, 1, 2, 3].forEach(f => {
        const s = DW.Sprites.hero(d, f);
        c.drawImage(s.img, 10 + f * 60, 4 + j * 70, s.w * 2, s.h * 2);
      }));
    } else if (q.has('icons')) {
      // (10 par ligne, à 32 × 32 : deux fois leur taille dans le jeu)
      const ids = Object.keys(DW.ITEMS), COL = 10, W = COL * 40 + 20, H = Math.ceil(ids.length / COL) * 40 + 20;
      g.width = W * SC; g.height = H * SC; c.imageSmoothingEnabled = false; c.scale(SC, SC);
      c.fillStyle = '#123'; c.fillRect(0, 0, W, H);
      ids.forEach((id, i) => c.drawImage(DW.Icons.item(id), 10 + (i % COL) * 40, 10 + Math.floor(i / COL) * 40, 32, 32));
    } else {
      const list = pick.length ? pick : DW.DEX_ORDER;
      g.width = 6 * 110 * SC; g.height = Math.ceil(list.length / 6) * 120 * SC;
      c.imageSmoothingEnabled = false; c.scale(SC, SC);
      c.fillStyle = '#7aa0e0'; c.fillRect(0, 0, g.width, g.height);
      list.forEach((sp, i) => {
        const x = (i % 6) * 110 + 50, y = Math.floor(i / 6) * 120 + 110;
        c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(x, y - 2, 40, 7, 0, 0, 7); c.fill();
        DW.Sprites.draw(c, DW.Sprites.battle(sp), x, y);
        DW.Sprites.draw(c, DW.Sprites.ow(sp), x + 46, y);
      });
    }
    document.title = 'Galerie ' + Math.round(performance.now() - t0) + 'ms';
  });
})();
