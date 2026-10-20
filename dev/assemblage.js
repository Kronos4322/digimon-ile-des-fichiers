'use strict';
// =====================================================================
//  ASSEMBLAGE DES CARTES (outil de développement) : les cartes COLLÉES les unes aux autres, à leur vraie place
//  dans le monde, sans espace entre elles, pour voir chaque jonction d'un coup d'œil. La place de chaque carte se
//  déduit des passages : une voisine est posée contre le bord commun, son passage aligné sur celui d'en face.
//  Nécessite dev/shots.js.   ASSEMBLAGE.places(ids)  ·  await ASSEMBLAGE.rendre(ids, 'nom', 0.25)
// =====================================================================
(function () {
  const A = window.ASSEMBLAGE = {
    // décalages du monde (en cases) de chaque carte, depuis la première ; conflits = cartes qui se chevauchent
    // positions : la grille du monde du jeu (maps/monde.js) ; conflits = boucles qui ne se referment pas, chevauchements
    places(ids) {
      const off = {};
      for (const id of ids) { const p = DW.Monde.pos(id); if (p) off[id] = [p.x, p.y]; }
      const conflits = DW.Monde.conflits().filter(c => ids.some(id => c.includes(id)));
      A.last = { off, conflits };
      return A.last;
    },
    async rendre(ids, nom, k = 0.25, heure = 12) {
      const { off } = A.places(ids), imgs = {};
      for (const id of ids) if (off[id]) { await DEV.map(id, null, null, heure); imgs[id] = DEV.last; }
      DEV.hide();
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const id in imgs) { const [ox, oy] = off[id], im = imgs[id]; x0 = Math.min(x0, ox * 16); y0 = Math.min(y0, oy * 16); x1 = Math.max(x1, ox * 16 + im.width); y1 = Math.max(y1, oy * 16 + im.height); }
      const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * k); cv.height = Math.ceil((y1 - y0) * k);
      const g = cv.getContext('2d'); g.fillStyle = '#0c1018'; g.fillRect(0, 0, cv.width, cv.height);
      for (const id in imgs) { const [ox, oy] = off[id], im = imgs[id]; g.drawImage(im, (ox * 16 - x0) * k, (oy * 16 - y0) * k, im.width * k, im.height * k); }
      g.setLineDash([4, 4]); g.strokeStyle = 'rgba(255,224,112,0.6)'; g.lineWidth = 1; g.font = '12px sans-serif';
      for (const id in imgs) { const [ox, oy] = off[id], im = imgs[id], X = (ox * 16 - x0) * k, Y = (oy * 16 - y0) * k; g.strokeRect(X, Y, im.width * k, im.height * k); const t = DW.MAPS[id].name; g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(X + 4, Y + 4, g.measureText(t).width + 8, 16); g.fillStyle = '#ffe070'; g.fillText(t, X + 8, Y + 16); }
      await fetch('/dev/save?name=' + nom + '.png', { method: 'POST', body: await new Promise(r => cv.toBlob(r)) });
      return [cv.width, cv.height, A.last.conflits];
    },
  };
})();
