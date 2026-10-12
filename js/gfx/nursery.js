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
    // arche arc-en-ciel posée sur deux nuages (entrée nord du village ; on passe dessous)
    rainbowarch: { w: 80, h: 56, n: 1, draw(d) {
      const cols = ['#ff7a8a', '#ffb060', '#ffe070', '#8ee08a', '#7ab8ff', '#b894ff'];
      cols.forEach((col, i) => {
        const r = 33 - i * 2.4, pts = [];
        for (let k = 0; k <= 16; k++) { const a = Math.PI + k * Math.PI / 16; pts.push([40 + Math.cos(a) * r, 50 + Math.sin(a) * r * 0.92]); }
        d.curve(pts, 2.6, col, i === 0 ? { shiny: true } : {});
      });
      for (const s of [-1, 1]) {
        const x = 40 + s * 31;
        d.circ(x - 5 * s, 51, 6, '#ffffff', { shiny: true }); d.circ(x + 2 * s, 47, 7, '#ffffff', { shiny: true }); d.circ(x + 7 * s, 52, 5.4, '#f4f8ff');
        d.deco.circ(x + 1 * s, 44, 2, '#ffffff', { unlit: true });
      }
    } },
    // pile de cubes ABC (trois cubes : deux en bas, un dessus)
    blockstack: { w: 36, h: 44, n: 2, draw(d, v) {
      const sets = [['#f25a5a', '#4ea4f2', '#f2c63a'], ['#5ac46a', '#c86af2', '#ff9a4a']][v];
      const mixc = (col, t, to) => { const c = Art.mix(Art.hex(col), to, t); return '#' + c.map(x => Math.round(x).toString(16).padStart(2, '0')).join(''); };
      const cube = (ox, oy, col, letter) => {
        d.poly([[ox, oy + 4], [ox + 8, oy], [ox + 16, oy + 4], [ox + 8, oy + 8]], mixc(col, 0.35, [255, 255, 255]), { flat: true });
        d.poly([[ox, oy + 4], [ox + 8, oy + 8], [ox + 8, oy + 18], [ox, oy + 14]], col, { flat: true });
        d.poly([[ox + 8, oy + 8], [ox + 16, oy + 4], [ox + 16, oy + 14], [ox + 8, oy + 18]], mixc(col, 0.35, [40, 20, 60]), { flat: true });
        const W = '#ffffff', o = { unlit: true }, lx = ox + 2.4, ly = oy + 8;
        if (letter === 'A') { d.deco.line(lx, ly + 7, lx + 1.8, ly, 0.9, W, o); d.deco.line(lx + 1.8, ly, lx + 3.6, ly + 8, 0.9, W, o); d.deco.line(lx + 0.9, ly + 4.4, lx + 2.8, ly + 4.8, 0.8, W, o); }
        else if (letter === 'B') { d.deco.line(lx + 0.6, ly, lx + 0.6, ly + 8, 0.9, W, o); d.deco.circ(lx + 2.2, ly + 2, 1.4, W, o); d.deco.circ(lx + 2.4, ly + 5.8, 1.6, W, o); }
        else { d.deco.circ(lx + 2, ly + 4, 2.4, W, o); d.deco.circ(lx + 2.8, ly + 4, 1.2, col, o); }
        d.deco.circ(ox + 12, oy + 10.5, 1.5, '#ffffff', { unlit: true });
      };
      cube(1, 24, sets[0], 'A'); cube(18, 25, sets[1], 'B'); cube(9, 9, sets[2], 'C');
    } },
    // maisonnette en coquille d'œuf (les bébés y dorment) : coquille brisée en zigzag, chapeau de coquille
    eggcottage: { w: 48, h: 54, n: 3, lights: [[34, 34, 10]], draw(d, v) {
      const [base, pat] = [['#fff6e4', '#ff9ac0'], ['#eef8ff', '#7ab8ff'], ['#f4ffe8', '#8ad070']][v];
      d.ell(24, 36, 19, 16.5, base, 0, { shiny: true });
      // bord brisé de la coquille
      const zig = [];
      for (let k = 0; k <= 10; k++) zig.push([5.5 + k * 3.7, 24 + (k % 2 ? -3 : 1)]);
      for (let k = 0; k < 10; k++) d.deco.line(zig[k][0], zig[k][1], zig[k + 1][0], zig[k + 1][1], 1, '#c8b8a8');
      // motifs (taches ou vagues) comme les vrais DigiŒufs
      for (const [x, y, r] of [[12, 34, 2.4], [30, 44, 2], [36, 30, 1.6], [18, 46, 1.4]]) d.deco.circ(x, y, r, pat);
      // chapeau : le haut de la coquille, posé de travers
      d.ell(23, 16, 15, 9.5, base, -0.18, { shiny: true });
      for (let k = 0; k < 7; k++) d.deco.line(10 + k * 4, 22 - (k % 2 ? 2.6 : 0) - k * 0.5, 14 + k * 4, 22 - (k % 2 ? 0 : 2.6) - k * 0.5, 0.9, '#c8b8a8');
      d.deco.circ(18, 12, 2, pat); d.deco.circ(27, 15, 1.4, pat);
      // porte ronde, fenêtre, petit paillasson
      d.rect(17, 38, 11, 14, '#c88a5a', { round: 0.5 });
      d.deco.circ(25.4, 45, 0.9, '#ffe070');
      d.circ(34, 33, 3.6, '#bfe8ff', { shiny: true });
      d.deco.line(34, 29.6, 34, 36.4, 0.6, '#fff6e4'); d.deco.line(30.6, 33, 37.4, 33, 0.6, '#fff6e4');
      d.deco.ell(22.5, 52.4, 6, 1.4, pat);
    } },
    // cheval à bascule
    rockinghorse: { w: 32, h: 30, n: 2, draw(d, v) {
      const [body, mane] = [['#ffd2a0', '#ff6a8a'], ['#d8e8ff', '#7a8aff']][v];
      d.curve([[3, 24], [10, 28], [22, 28], [29, 24]], 2.2, '#c88a5a', { shiny: true });
      d.tube([[10, 26], [11, 19]], 1.4, 1.4, '#d8a070'); d.tube([[22, 26], [21, 19]], 1.4, 1.4, '#d8a070');
      d.ell(16, 16, 9, 5, body, 0, { shiny: true });
      d.tube([[22, 14], [25, 7]], 3.4, 3, body);
      d.ell(26.5, 6.5, 4.6, 3.4, body, -0.3, { shiny: true });
      d.deco.circ(27.4, 5.4, 0.9, '#2a1a20');
      d.tube([[23, 4], [21, 10], [20, 13]], 1.8, 1.4, mane);
      d.tube([[7, 14], [3, 18]], 1.6, 1.2, mane);
      d.rect(13, 10, 6, 2.4, '#ff5a5a', { round: 0.5 });
    } },
    // grand coussin rond (le nid des DigiŒufs) — on marche dessus
    eggnest: { w: 176, h: 40, n: 1, draw(d) {
      d.ell(88, 22, 84, 16, '#f2b8d2', 0, { tex: 0.15 });
      d.deco.ell(88, 20.6, 76, 12, '#ffd8e8');
      d.deco.ell(88, 19.6, 66, 8.4, '#ffe8f2');
      for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; d.deco.circ(88 + Math.cos(a) * 80, 22 + Math.sin(a) * 14.6, 1.8, k % 2 ? '#ffffff' : '#ffe070'); }
    } },
  });
})();
