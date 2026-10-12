'use strict';
// =====================================================================
//  VILLAGE DES BÉBÉS — DigiŒufs (DigiTama) et décor de la nurserie
//  DW.EGGS : apparence de l'œuf de chaque bébé ; DW.eggSprite(sp) : rendu en volume
// =====================================================================
(function () {
  const Art = DW.Art, OBJ = DW.World.OBJ;

  // un œuf par bébé : couleur de fond, motif, couleur du motif, indice donné au joueur
  DW.EGGS = {
    botamon: { base: '#f8e6a8', pat: 'stripes', col: '#3a6ad8', hint: 'Un œuf jaune pâle zébré de bleu. Il est tout chaud...' },
    punimon: { base: '#ffd2da', pat: 'spots', col: '#e0485a', hint: 'Un œuf rose tacheté de rouge. Il sautille tout seul !' },
    pichimon: { base: '#d6eaff', pat: 'waves', col: '#3a86e0', hint: "Un œuf bleu ciel orné de vagues. On dirait qu'il fait des bulles." },
    yuramon: { base: '#f6fbea', pat: 'fluff', col: '#9ac860', hint: 'Un œuf blanc couvert de duvet vert tendre. Il est léger comme une plume.' },
    nyokimon: { base: '#e6f6c8', pat: 'leaves', col: '#4aa848', hint: 'Un œuf vert clair décoré de petites feuilles. Il sent bon les fleurs.' },
  };
  DW.EGG_ORDER = Object.keys(DW.EGGS);

  // dessin de l'œuf dans un repère 32x40 (centre 16, base 38)
  function egg(d, sp, ox = 0, oy = 0) {
    const E = DW.EGGS[sp] || DW.EGGS.botamon, X = x => x + ox, Y = y => y + oy;
    d.ell(X(16), Y(24), 11, 14, E.base, 0, { shiny: true });
    if (E.pat === 'stripes') for (let i = 0; i < 3; i++) d.deco.tube([[X(6), Y(16 + i * 7)], [X(16), Y(13 + i * 7)], [X(26), Y(17 + i * 7)]], 2.6, 2.6, E.col);
    else if (E.pat === 'spots') for (const [x, y, r] of [[12, 16, 2.6], [20, 20, 3], [13, 28, 2.4], [21, 31, 1.8], [18, 12, 1.6], [9, 23, 1.6]]) d.deco.circ(X(x), Y(y), r, E.col);
    else if (E.pat === 'waves') for (let i = 0; i < 3; i++) d.deco.curve([[X(6), Y(17 + i * 7)], [X(11), Y(15 + i * 7)], [X(16), Y(17 + i * 7)], [X(21), Y(15 + i * 7)], [X(26), Y(17 + i * 7)]], 1.6, E.col);
    else if (E.pat === 'fluff') for (let i = 0; i < 9; i++) { const a = i * 0.7; d.deco.ell(X(16 + Math.cos(a) * 6), Y(22 + Math.sin(a * 1.3) * 9), 2.4, 1.4, E.col, a); }
    else for (const [x, y, a] of [[11, 16, -0.6], [21, 19, 0.6], [12, 27, 0.5], [20, 30, -0.5]]) { d.deco.ell(X(x), Y(y), 3.4, 1.6, E.col, a); d.deco.line(X(x - 2.6 * Math.cos(a)), Y(y - 2.6 * Math.sin(a)), X(x + 2.6 * Math.cos(a)), Y(y + 2.6 * Math.sin(a)), 0.5, '#2a7a2a'); }
    d.deco.ell(X(11.6), Y(15), 2.6, 4, '#ffffff', -0.4, { unlit: true });
  }
  const cache = {};
  DW.eggSprite = sp => cache[sp] || (cache[sp] = Art.render(d => egg(d, sp), 32, 40, { rim: true }));

  Object.assign(OBJ, {
    // DigiŒuf posé sur un coussin (une variante par bébé, dans l'ordre de DW.EGG_ORDER)
    digitama: { w: 24, h: 30, n: 5, draw(d, v) {
      d.ell(12, 26, 10, 3.6, '#f6b8d0', 0, { tex: 0.2 });
      d.deco.ell(12, 25.4, 7, 2, '#ffd8e6');
      d.deco.circ(3, 27, 1.2, '#ffe680'); d.deco.circ(21, 27, 1.2, '#ffe680');
      // l'œuf, réduit pour tenir sur le coussin
      const E = DW.EGGS[DW.EGG_ORDER[v]];
      d.ell(12, 15.6, 7.6, 9.6, E.base, 0, { shiny: true });
      if (E.pat === 'stripes') for (let i = 0; i < 3; i++) d.deco.tube([[5, 10 + i * 5], [12, 8 + i * 5], [19, 11 + i * 5]], 1.8, 1.8, E.col);
      else if (E.pat === 'spots') for (const [x, y, r] of [[9, 11, 1.8], [15, 14, 2], [10, 19, 1.6], [15, 21, 1.2]]) d.deco.circ(x, y, r, E.col);
      else if (E.pat === 'waves') for (let i = 0; i < 3; i++) d.deco.curve([[5, 11 + i * 5], [8.5, 9.6 + i * 5], [12, 11 + i * 5], [15.5, 9.6 + i * 5], [19, 11 + i * 5]], 1.1, E.col);
      else if (E.pat === 'fluff') for (let i = 0; i < 7; i++) { const a = i * 0.9; d.deco.ell(12 + Math.cos(a) * 4, 15 + Math.sin(a * 1.3) * 6, 1.7, 1, E.col, a); }
      else for (const [x, y, a] of [[9, 11, -0.6], [15, 13, 0.6], [9.6, 19, 0.5], [15, 20, -0.5]]) d.deco.ell(x, y, 2.4, 1.1, E.col, a);
      d.deco.ell(8.6, 10.4, 1.8, 2.8, '#ffffff', -0.4, { unlit: true });
    } },
    // gros ballon de plage à quartiers colorés
    toyball: { w: 18, h: 18, n: 3, draw(d, v) {
      const cols = [['#f25a5a', '#ffffff', '#4ea4f2'], ['#f2c63a', '#ffffff', '#5ac46a'], ['#c86af2', '#ffffff', '#f28ab4']][v];
      d.circ(9, 9.6, 7.4, cols[1], { shiny: true });
      d.deco.blob([[9, 2.4], [12.6, 6], [12, 14], [9, 17]], cols[0]);
      d.deco.blob([[9, 2.4], [5, 6], [6, 14], [9, 17]], cols[2]);
      d.deco.circ(9, 9.6, 1.4, '#ffe680');
    } },
    // biberon géant (repère du village)
    bigbottle: { w: 22, h: 40, n: 1, draw(d) {
      d.tube([[11, 4], [11, 9]], 4, 5, '#f6a0b8', { shiny: true });
      d.rect(5, 9, 12, 4, '#f6a0b8', { round: 0.4 });
      d.rect(4, 12.4, 14, 25, '#eaf6ff', { round: 0.4, shiny: true });
      d.deco.rect(5.4, 22, 11.2, 14, '#fffaf0');
      for (let y = 16; y < 34; y += 5) d.deco.line(13, y, 16, y, 0.7, '#9ab8d8');
      d.deco.rect(6.4, 15, 2, 18, '#ffffff', { unlit: true });
    } },
    // mobile d'étoiles au-dessus des berceaux
    starmobile: { w: 26, h: 34, n: 1, frames: 4, fps: 2, draw(d, v, f = 0) {
      d.tube([[13, 33], [13, 8]], 1.6, 1.4, '#d8c0b0');
      d.tube([[3, 8], [23, 8]], 1.2, 1.2, '#d8c0b0');
      const sw = Math.sin(f * Math.PI / 2) * 1.2;
      [[4, '#ffd040'], [13, '#7ab8ff'], [22, '#ff9ac0']].forEach(([x, col], i) => {
        d.deco.line(x, 8, x + sw * (i - 1), 15, 0.5, '#b0a090');
        const cx = x + sw * (i - 1), cy = 18, pts = [];
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.6 : 3.6; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
        d.poly(pts, col, { shiny: true });
      });
    } },
  });
})();
