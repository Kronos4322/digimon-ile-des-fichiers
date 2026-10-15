'use strict';
// =====================================================================
//  L'ANTRE DE SHELLMON — boss final du chapitre 1 (épisode 2 de l'animé : les cabines de la plage)
//  1) après Kuwagamon, chaque cabine de la plage murmure un mot ; écoutées dans le bon ordre (« Aide-moi,
//     je suis sous le sable »), elles font s'ouvrir le sable : on descend dans l'antre ;
//  2) deux grands labyrinthes ensablés (temple de Pharaomon, Digimon World 2003), Digimon de plus en plus forts ;
//  3) au fond, Shellmon garde Tai et Agumon prisonniers. À la moitié de ses PV, Tai est libéré :
//     Agumon digivolue en Greymon et combat à tes côtés (allié automatique, game/arena.js et battle.js) ;
//  4) victoire : trophée de Shellmon (cave de ta maison), Tai s'installe dans sa chambre chez toi,
//     fin du chapitre 1. Ensuite Shellmon reste là : on peut le réaffronter pour l'expérience.
// =====================================================================
(function () {
  const MAPS = DW.MAPS, P = DW.Palais;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const perso = () => st().hero !== 'tai';   // (anciennes parties où l'on incarne Tai : pas de prisonnier)

  // ------------------------------------------------------------ 1) l'énigme des cabines
  // les 6 cabines (de gauche à droite) murmurent chacune un mot ; l'ordre de la phrase ouvre le passage
  const WORDS = ['sable', 'Aide-moi', 'sous', 'je', 'le', 'suis'];
  const ORDER = [1, 3, 5, 2, 4, 0];   // « Aide-moi, je suis sous le sable »
  async function booth(ow, i) {
    const s = st(), f = s.flags;
    if (f.shellLair) {
      if ((await DW.ask("Le sable s'est effondré sous les cabines : un passage descend dans le noir. Descendre ?")) !== 0) return;
      DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4);
      ow.load('antre1', MAPS.antre1.entry.x, MAPS.antre1.entry.y, 'up'); await DW.fade(0, 0.4);
      return;
    }
    DW.Audio.sfx('ring');
    await say('Driiing ! La cabine sonne...');
    if ((await DW.ask('Décrocher ?')) !== 0) return;
    await say(`Une petite voix lointaine murmure un seul mot : « ... ${WORDS[i]} ... »`);
    const pos = f.boothPos || 0;
    if (ORDER[pos] === i) f.boothPos = pos + 1; else f.boothPos = ORDER[0] === i ? 1 : 0;
    if (f.boothPos < ORDER.length) return;
    // la phrase est complète : le sable s'ouvre
    f.shellLair = true; f.boothPos = 0;
    await say(perso() ? "« Aide-moi, je suis sous le sable ! » Toutes les cabines sonnent ensemble, puis se taisent..." : 'Toutes les cabines sonnent ensemble, puis se taisent...');
    DW.Audio.sfx('roar'); ow.shake = 1.4;
    await say("Le sable tremble... et s'effondre sous les cabines ! Un passage s'ouvre vers les profondeurs.");
    DW.autosave();
  }

  // ------------------------------------------------------------ 2) l'antre : un grand labyrinthe ensablé
  // Inspiré du temple de Pharaomon (Digimon World 2003) : des galeries de grès qui serpentent, de grandes
  // cavernes, des culs-de-sac, des bassins, des piliers gravés et des braseros. On s'y perd !
  // Deux labyrinthes (Digimon de plus en plus forts), puis la grande caverne de Shellmon.
  const T = DW.World.THEMES;
  if (T && T.canyon && !T.sandtemple) T.sandtemple = { ...T.canyon, vignette: 'rgba(16,8,0,0.72)', particle: 'dust', sky: ['#2a1a0c', '#5a3a1c'], noRays: true,
    grass: ['#8e6c40', '#9c7a4a', '#ab8956', '#ba9862', '#c8a872', '#d6b884'], dirt: ['#7a5a34', '#88683e', '#967648', '#a48452', '#b2925e', '#c0a06a'],
    canopy: ['#2a1a0e', '#3e2814', '#54381c', '#6a4a26', '#826032', '#9a7840'], tall: ['#a88a50', '#c8a868', '#e8cc8c'],
    objMap: { ...T.canyon.objMap, tree: 'spire', bush: 'boulder', fern: 'pebbles' } };
  // pilier de temple : colonne de grès, bandes de hiéroglyphes, chapiteau en lotus
  DW.World.OBJ.templepillar = { w: 22, h: 52, n: 2, draw(d, v) {
    d.ell(11, 51, 9, 2, '#1a1008', 0, { flat: true });
    d.rect(2, 44, 18, 7, '#b8945a', { round: 0.15, tex: 0.3 });
    d.tube([[11, 46], [11, 12]], 7, 6.4, v ? '#c8a66e' : '#d2b27a', { tex: 0.25 });
    for (const y of [16, 26, 36]) { d.deco.rect(5, y, 12, 5, '#a8844e'); for (let k = 0; k < 4; k++) d.deco.rect(6.5 + k * 2.8, y + 1.4, 1.4, 2.2, ['#3a6ab0', '#c84a2a', '#2a8a6a', '#1a1a1a'][(k + y) % 4]); }
    d.poly([[1, 12], [21, 12], [17, 5], [5, 5]], '#e0c084', { tex: 0.2 });
    d.rect(0, 2, 22, 4, '#c8a66e', { round: 0.2 });
    if (v) d.deco.line(7, 20, 12, 40, 0.8, '#6a4a26');   // une fissure
  } };
  const Hh = (x, y, s) => DW.Art.hash(x, y, s);
  function genMaze(seed, W, H, cols, rows) {
    const g = Array.from({ length: H }, () => Array(W).fill('#'));
    const floor = (x, y) => { if (x > 1 && y > 1 && x < W - 2 && y < H - 2 && g[y][x] === '#') g[y][x] = '.'; };
    const blob = (cx, cy, rx, ry) => { for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) if (Math.hypot((x - cx) / rx, (y - cy) / ry) < 1 + (Hh(x, y, seed + 3) - 0.5) * 0.35) floor(x, y); };
    const tube = (a, b, r) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2); for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, rr = r + (Hh(Math.round(x), Math.round(y), seed + 5) - 0.5) * 0.9; blob(x, y, rr, rr * 0.85); } };
    const cw = (W - 6) / cols, ch = (H - 6) / rows;
    const C = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) C.push({ i, j, x: 3 + cw * (i + 0.5) + (Hh(i, j, seed) - 0.5) * cw * 0.45, y: 3 + ch * (j + 0.5) + (Hh(j, i, seed + 1) - 0.5) * ch * 0.4, n: [], d: -1 });
    const at = (i, j) => C[j * cols + i];
    // labyrinthe : parcours en profondeur depuis l'entrée (en bas, au milieu)
    const start = at(Math.floor(cols / 2), rows - 1), stack = [start], edges = [];
    start.d = 0;
    while (stack.length) {
      const c = stack[stack.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => c.i + a >= 0 && c.i + a < cols && c.j + b >= 0 && c.j + b < rows ? at(c.i + a, c.j + b) : null).filter(o => o && o.d < 0);
      if (!nb.length) { stack.pop(); continue; }
      const o = nb[Math.floor(Hh(c.i * 7 + stack.length, c.j * 5, seed + 9) * nb.length)];
      o.d = c.d + 1; edges.push([c, o]); stack.push(o);
    }
    // quelques boucles en plus (on peut tourner en rond)
    for (let k = 0; k < Math.round(cols * rows * 0.15); k++) { const a = C[Math.floor(Hh(k, 1, seed + 11) * C.length)], b = at(Math.min(cols - 1, a.i + 1), a.j); if (a !== b && !edges.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) edges.push([a, b]); }
    for (const [a, b] of edges) { const m = [(a.x + b.x) / 2 + (Hh(a.i, b.j, seed + 13) - 0.5) * 6, (a.y + b.y) / 2 + (Hh(b.i, a.j, seed + 14) - 0.5) * 5]; const r = 1.2 + Hh(a.i + b.i, a.j + b.j, seed + 15) * 1.1; tube([a.x, a.y], m, r); tube(m, [b.x, b.y], r); }
    // grandes cavernes (et quelques salles plus modestes)
    const halls = [];
    for (const c of C) { const h = Hh(c.i, c.j, seed + 17); if (h < 0.45 || c === start) { const rx = c === start ? 4 : 3 + h * 7, ry = rx * (0.6 + Hh(c.j, c.i, seed + 18) * 0.25); blob(c.x, c.y, rx, ry); halls.push({ c, rx, ry }); } }
    const end = C.filter(c => c.j === 0).reduce((a, b) => (b.d > a.d ? b : a));   // la sortie : tout en haut, au bout du plus long chemin
    if (!halls.some(h => h.c === end)) { blob(end.x, end.y, 4.5, 3.2); halls.push({ c: end, rx: 4.5, ry: 3.2 }); }
    // bassins et dunes (herbes hautes = « sable mouvant » où rôdent les Digimon)
    for (const h of halls) if (h.rx > 6 && Hh(h.c.i, h.c.j, seed + 19) < 0.45) for (let y = Math.floor(h.c.y - 2); y <= h.c.y + 2; y++) for (let x = Math.floor(h.c.x - 3); x <= h.c.x + 3; x++) if (Math.hypot((x - h.c.x) / 3, (y - h.c.y) / 1.8) < 1 && g[y][x] === '.') g[y][x] = '~';
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (g[y][x] === '.' && DW.Art.fbm(x * 0.15, y * 0.15, seed + 21) > 0.62) g[y][x] = ',';
    return { g, start, end, halls, C };
  }
  // objets : braseros contre les parois, paires de piliers dans les grandes cavernes, torches dans les couloirs
  function dress(maze, seed) {
    const { g, halls } = maze, H = g.length, W = g[0].length, objs = [], used = new Set();
    const isF = (x, y) => g[y] && (g[y][x] === '.' || g[y][x] === ',');
    const open = (x, y, r = 1) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!isF(x + dx, y + dy) || used.has((x + dx) + ',' + (y + dy))) return false; return true; };
    const put = (kind, x, y, extra = {}) => { objs.push({ kind, v: 0, x, y, w: 1, h: 1, ...extra }); used.add(x + ',' + y); };
    for (const h of halls) {
      const cx = Math.round(h.c.x), cy = Math.round(h.c.y);
      if (h.rx > 5.5) for (const [dx, dy] of [[-3, -1], [3, -1], [-3, 2], [3, 2]]) { const x = cx + Math.round(dx * h.rx / 6), y = cy + dy; if (open(x, y)) put('templepillar', x, y, { v: Math.floor(Hh(x, y, seed) * 2) }); }
      // braseros : sur le bord de la caverne (contre la roche)
      for (let k = 0; k < 3; k++) {
        const a = Hh(cx, k, seed + 23) * Math.PI * 2;
        for (let s = 1; s > 0.5; s -= 0.08) { const x = Math.round(cx + Math.cos(a) * h.rx * s), y = Math.round(cy + Math.sin(a) * h.ry * s); if (isF(x, y) && !used.has(x + ',' + y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a2, b2]) => !isF(x + a2, y + b2)) && open(x, y, 0)) { put('brazier', x, y, { small: true }); break; } }
      }
      if (Hh(cx, cy, seed + 25) < 0.4 && open(cx + 1, cy - 2)) put(Hh(cy, cx, seed + 26) < 0.5 ? 'sacks' : 'crates', cx + 1, cy - 2, { small: true });
      // paroi du fond : dalles gravées et statues de gardiens
      for (let x = Math.round(cx - h.rx); x <= cx + h.rx; x += 3) {
        let y = cy; while (y > 2 && isF(x, y - 1)) y--;
        if (!isF(x, y) || used.has(x + ',' + y) || isF(x, y - 1) || !isF(x, y + 1)) continue;
        const r = Hh(x, y, seed + 27);
        if (r < 0.3) put('hieroslab', x, y, { v: Math.floor(r * 6) % 2 });
        else if (r < 0.42 && h.rx > 5) put('shellstatue', x, y, { v: Math.floor(r * 10) % 2 });
        else if (r < 0.62) put('urn', x, y, { v: Math.floor(r * 30) % 3, small: true });
      }
      // au sol : pilier brisé, tas de coquillages (ils se traversent)
      if (h.rx > 4.5 && Hh(cx, cy, seed + 29) < 0.5 && open(cx - 2, cy + 2)) put('brokenpillar', cx - 2, cy + 2, { small: true });
      for (let k = 0; k < 3; k++) { const x = Math.round(cx + (Hh(k, cx, seed + 31) - 0.5) * h.rx * 1.4), y = Math.round(cy + (Hh(cy, k, seed + 32) - 0.5) * h.ry * 1.4); if (isF(x, y) && !used.has(x + ',' + y)) objs.push({ kind: 'shellpile', v: k % 2, x, y, w: 1, h: 1, small: true, walk: true }); }
    }
    return objs;
  }
  // une carte de labyrinthe complète : entrée (escalier vers le haut), sortie (vers le bas) au bout du chemin le plus long
  // PORTE DE TEMPLE : un grand portail de grès encastré dans la paroi (on voit tout de suite que c'est un passage).
  // v0 : vers les profondeurs (marches qui descendent dans le noir, lueur rouge) ; v1 : vers la surface (lumière du jour)
  DW.World.OBJ.templegate = { w: 56, h: 66, n: 2, lights: [[28, 44, 30]], draw(d, v) {
    const S = '#c8a66e', Sd = '#9a7a46', Sl = '#e2c48a';
    d.ell(28, 64, 24, 2.6, '#140a04', 0, { flat: true });
    // massif de pierre autour de la porte
    d.rect(2, 10, 52, 54, Sd, { round: 0.06, tex: 0.35 });
    // piliers
    for (const x of [4, 42]) { d.rect(x, 14, 10, 50, S, { round: 0.1, tex: 0.25 }); d.deco.rect(x + 2, 22, 6, 4, '#3a6ab0'); d.deco.rect(x + 2, 34, 6, 4, '#c84a2a'); d.deco.rect(x + 2, 46, 6, 4, '#2a8a6a'); }
    // linteau gravé : disque solaire ailé
    d.rect(0, 4, 56, 12, Sl, { round: 0.1, tex: 0.2 });
    d.deco.circ(28, 10, 4, '#e8a020', { unlit: true }); d.deco.poly([[14, 9], [24, 8], [24, 12], [16, 12]], '#3a6ab0'); d.deco.poly([[42, 9], [32, 8], [32, 12], [40, 12]], '#3a6ab0');
    // ouverture
    d.rect(15, 18, 26, 46, v ? '#f6e6b8' : '#0c0604', { round: 0.08 });
    if (v) { for (let k = 0; k < 6; k++) d.deco.rect(16, 56 - k * 6, 24, 3, k % 2 ? '#e8d4a0' : '#d8c08a', { unlit: true }); d.deco.rect(17, 20, 22, 12, '#fffbe8', { unlit: true }); }
    else { for (let k = 0; k < 5; k++) d.deco.rect(17 + k, 60 - k * 5, 22 - 2 * k, 3, ['#6a4a2a', '#4a3220', '#30200f', '#20140a', '#140c06'][k]); d.deco.ell(28, 32, 8, 6, 'rgba(255,90,40,0.35)', 0, { unlit: true }); }
    // marche de seuil
    d.rect(12, 60, 32, 5, Sl, { round: 0.3 });
  } };

  // ------------------------------------------------------------ décors du temple ensablé
  Object.assign(DW.World.OBJ, {
    // jarre canope (couvercle en tête de Digimon)
    urn: { w: 16, h: 24, n: 3, draw(d, v) {
      const c = ['#c8783a', '#3a7a8a', '#b8a070'][v];
      d.ell(8, 23, 6, 1.6, '#1a1008', 0, { flat: true });
      d.ell(8, 15, 6, 7.5, c, 0, { shiny: true, tex: 0.2 }); d.deco.rect(3, 12, 10, 2, '#e8c860');
      d.ell(8, 6, 4, 3.4, ['#e8a020', '#5ab0c8', '#d8c090'][v], 0, { shiny: true }); d.deco.circ(6.6, 5.6, 0.7, '#1a1a1a'); d.deco.circ(9.4, 5.6, 0.7, '#1a1a1a');
    } },
    // pilier brisé, tronçon couché à côté
    brokenpillar: { w: 30, h: 30, n: 1, draw(d) {
      d.ell(15, 28, 13, 2.2, '#1a1008', 0, { flat: true });
      d.tube([[9, 28], [9, 12]], 7, 6.4, '#c8a66e', { tex: 0.3 }); d.poly([[2, 13], [16, 9], [14, 15], [4, 16]], '#d8b880');
      d.tube([[16, 26], [28, 23]], 5, 5, '#b8945a', { tex: 0.3 }); d.deco.rect(5, 18, 8, 3, '#a8844e');
    } },
    // statue assise de gardien à tête de coquillage
    shellstatue: { w: 32, h: 50, n: 2, draw(d, v) {
      d.ell(16, 49, 14, 2.4, '#1a1008', 0, { flat: true });
      d.rect(3, 38, 26, 11, '#b8945a', { round: 0.1, tex: 0.3 });
      d.rect(8, 22, 16, 17, '#c8a66e', { round: 0.25, tex: 0.25 });
      d.tube([[10, 36], [10, 30]], 3, 3, '#d2b27a'); d.tube([[22, 36], [22, 30]], 3, 3, '#d2b27a');
      d.ell(16, 13, 10, 9, '#d8b07a', 0, { tex: 0.2 });
      for (let k = -2; k <= 2; k++) d.deco.line(16, 21, 16 + k * 4, 6, 0.9, '#9a7446');
      d.deco.circ(13, 15, 1.2, v ? '#40e0d0' : '#2a1a0a', { unlit: !!v }); d.deco.circ(19, 15, 1.2, v ? '#40e0d0' : '#2a1a0a', { unlit: !!v });
    } },
    // tas de coquillages et d'os (se traverse)
    shellpile: { w: 18, h: 10, n: 2, draw(d, v) {
      for (let k = 0; k < 6; k++) d.ell(3 + k * 2.6, 7 - (k % 2) * 2, 2.4, 1.7, ['#f0c8d8', '#e8d8b8', '#f8f0e0'][(k + v) % 3], 0, { shiny: true });
      d.deco.line(4, 6, 14, 5, 0.6, '#c09a7a');
    } },
    // dalle gravée contre la paroi (hiéroglyphes)
    hieroslab: { w: 26, h: 40, n: 2, draw(d, v) {
      d.rect(1, 2, 24, 37, '#c8a66e', { round: 0.08, tex: 0.3 });
      d.deco.rect(3, 4, 20, 33, '#b8945a');
      const G = ['#3a6ab0', '#c84a2a', '#2a8a6a', '#1a1a1a', '#e8a020'];
      for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) {
        const x = 6 + k * 6, y = 7 + r * 5, c = G[(r * 3 + k + v) % 5];
        if ((r + k + v) % 3 === 0) d.deco.circ(x + 1.5, y + 1.5, 1.4, c); else if ((r + k) % 3 === 1) d.deco.rect(x, y, 3, 3, c); else d.deco.poly([[x, y + 3], [x + 1.5, y], [x + 3, y + 3]], c);
      }
    } },
    // PRISON de Tai : fond (paroi de corail, chaînes, toit en coquille) et grille de corail au premier plan
    cageback: { w: 76, h: 62, n: 2, lights: [[38, 30, 26]], draw(d, v) {
      d.ell(38, 60, 34, 3, '#0a0604', 0, { flat: true });
      d.rect(4, 18, 68, 42, '#5a3a2a', { round: 0.1, tex: 0.4 });
      for (let k = 0; k < 7; k++) d.deco.ell(10 + k * 9.5, 26 + (k % 2) * 8, 3.2, 2.2, ['#e86a7a', '#f0a0b0', '#d84a5a'][k % 3]);
      // toit : grande coquille rose
      d.poly([[0, 22], [38, 0], [76, 22], [70, 26], [6, 26]], '#f0a8c0', { shiny: true, tex: 0.15 });
      for (let k = 1; k < 8; k++) d.deco.line(38, 2, k * 9.5, 24, 0.8, '#c87a98');
      // chaînes et anneaux
      for (const x of [18, 58]) { for (let y = 28; y < 48; y += 4) d.deco.ell(x, y, 1.6, 2.2, '#8a8a90'); d.deco.rect(x - 3, 47, 6, 3, '#6a6a70'); }
      // sceau lumineux (disparaît quand Tai est libre)
      if (!v) { d.deco.circ(38, 16, 6, '#40e0d0', { unlit: true }); d.deco.circ(38, 16, 3.4, '#e0fffa', { unlit: true }); }
    } },
    cagefront: { w: 76, h: 46, n: 2, draw(d, v) {
      d.rect(2, 38, 72, 7, '#7a4a3a', { round: 0.3, tex: 0.3 });
      // barreaux de corail (brisés et tordus une fois Tai libéré)
      for (let k = 0; k < 9; k++) {
        const x = 6 + k * 8, broken = v && k >= 3 && k <= 5;
        if (broken) { d.tube([[x, 40], [x + (k - 4) * 4, 28]], 2.4, 1.6, '#e86a7a'); continue; }
        d.tube([[x, 41], [x + Math.sin(k) * 1.5, 22], [x, 4]], 2.6, 2, ['#e86a7a', '#f08a9a', '#d8546a'][k % 3], { tex: 0.25 });
        d.deco.circ(x, 4, 1.8, '#f8c8d4');
      }
      d.rect(2, 2, 72, 5, '#c86a7a', { round: 0.4 });
    } },
  });

  // la porte : sur un mur de fond (une case de sol dont la case du dessus est de la roche), au plus près du point visé
  function gateSpot(g, cx, cy) {
    for (let y = cy; y > 3; y--) if ('.,'.includes(g[y][cx]) && g[y - 1][cx] === '#') return [cx, y];
    return [cx, cy];
  }
  // une carte de labyrinthe complète : porte vers la surface (ou la salle précédente), porte vers la suite au bout du chemin le plus long
  function lairMap(id, name, seed, enc, back, next) {
    const W = 72, H = 52, maze = genMaze(seed, W, H, 6, 4), g = maze.g;
    const [sx, sy] = gateSpot(g, Math.round(maze.start.x), Math.round(maze.start.y)), [ex, ey] = gateSpot(g, Math.round(maze.end.x), Math.round(maze.end.y));
    for (const [x, y] of [[sx, sy + 1], [sx, sy + 2], [ex, ey + 1], [ex, ey + 2]]) if (g[y][x] === '#' || g[y][x] === '~') g[y][x] = '.';
    const near = (o, x, y) => Math.abs(o.x - x) < 3 && Math.abs(o.y - y) < 3;
    const objects = dress(maze, seed).filter(o => !near(o, sx, sy) && !near(o, ex, ey));
    objects.push({ kind: 'templegate', v: 1, x: sx, y: sy, w: 1, h: 1, walk: true }, { kind: 'templegate', v: 0, x: ex, y: ey, w: 1, h: 1, walk: true });
    for (const [x, y] of [[sx - 2, sy], [sx + 2, sy], [ex - 2, ey], [ex + 2, ey]]) if ('.,'.includes(g[y][x])) objects.push({ kind: 'brazier', v: 1, x, y, w: 1, h: 1, small: true });
    for (const o of objects) if (g[o.y] && g[o.y][o.x] === '#') o.skip = true;
    MAPS[id] = {
      name, music: 'cave', bg: 'plage', ambient: 'forest', theme: 'sandtemple', climate: 'beach', region: 'plage', indoor: true,
      dark: { d: 0.55, col: '#140a04' }, rate: 0.1, wildN: 11, aggro: 0.9, sight: 7, encounters: enc,
      rows: g.map(r => r.join('')), objects: objects.filter(o => !o.skip), npcs: [], signs: {}, warps: [], doors: [],
      triggers: [
        { x: sx, y: sy, w: 1, h: 1, run: async ow => { await DW.fade(1, 0.3); ow.load(back[0], back[1], back[2], 'down'); await DW.fade(0, 0.3); } },
        { x: ex, y: ey, w: 1, h: 1, run: async ow => { await DW.fade(1, 0.3); const N = MAPS[next]; ow.load(next, N.entry.x, N.entry.y, 'up'); await DW.fade(0, 0.3); } },
      ],
      entry: { x: sx, y: sy + 1 }, exitAt: { x: ex, y: ey + 1 },
    };
    return MAPS[id];
  }
  const [px, py] = DW.MapKit.zpt('plage', 18, 27);
  const L1 = lairMap('antre1', 'Antre de Shellmon — Galeries ensablées', 311,
    [{ sp: 'bukamon', min: 10, max: 11, w: 30 }, { sp: 'betamon', min: 10, max: 12, w: 40 }, { sp: 'gotsumon', min: 11, max: 12, w: 20 }], ['plage', px, py], 'antre2');
  const L2 = lairMap('antre2', 'Antre de Shellmon — Temple englouti', 523,
    [{ sp: 'betamon', min: 12, max: 14, w: 40 }, { sp: 'gotsumon', min: 13, max: 14, w: 30 }, { sp: 'kunemon', min: 13, max: 15, w: 20 }, { sp: 'mushroomon', min: 14, max: 15, w: 15 }], ['antre1', L1.exitAt.x, L1.exitAt.y], 'antre_shellmon');
  L1.signs[`${L1.entry.x + 1},${L1.entry.y - 1}`] = "Des marches taillées dans le grès s'enfoncent sous la plage. Sur la paroi, une gravure : un coquillage géant enroulé autour d'une pyramide.";
  // ------------------------------------------------------------ la grande caverne de Shellmon
  // une immense salle ovale : lagune au fond (la coquille de Shellmon), colonnade de piliers, braseros,
  // et sur le côté, Tai et Agumon prisonniers dans un enclos de pieux
  {
    const W = 46, H = 34, cx = 23, cy = 17, g = [];
    for (let y = 0; y < H; y++) { const r = []; for (let x = 0; x < W; x++) { const d = Math.hypot((x + 0.5 - cx) / 20, (y + 0.5 - cy) / 14) + (Hh(x, y, 77) - 0.5) * 0.12; r.push(d < 1 ? (Math.hypot((x + 0.5 - cx) / 10, (y + 0.5 - 8) / 3.6) < 1 ? '~' : '.') : '#'); } g.push(r); }
    for (let y = 28; y < H; y++) for (let x = 21; x < 25; x++) g[y][x] = y >= 31 ? '^' : '.';
    const objects = [];
    for (let k = 0; k < 10; k++) { const a = Math.PI * (0.15 + k * 0.077) + Math.PI, x = Math.round(cx + Math.cos(a) * 15), y = Math.round(cy + 3 + Math.sin(a) * -9); if (g[y] && g[y][x] === '.') objects.push({ kind: 'templepillar', v: k % 2, x, y, w: 1, h: 1 }); }
    for (const [x, y] of [[8, 12], [37, 12], [7, 22], [38, 22], [19, 29], [26, 29]]) if (g[y][x] === '.') objects.push({ kind: 'brazier', v: 1, x, y, w: 1, h: 1, small: true });
    objects.push({ kind: 'totem', v: 0, x: 22, y: 3, w: 2, h: 1 });
    // PRISON de Tai et Agumon : cage de corail sous une coquille géante (fond + grille au premier plan, côtés en roche)
    for (const [x, y] of [[32, 18], [32, 19], [32, 20], [37, 18], [37, 19], [37, 20], [33, 18], [34, 18], [35, 18], [36, 18]]) g[y][x] = '#';
    objects.push({ kind: 'cageback', v: 0, x: 34, y: 18, w: 2, h: 1, walk: true, cage: true }, { kind: 'cagefront', v: 0, x: 33, y: 21, w: 4, h: 1, cage: true });
    objects.push({ kind: 'shellstatue', v: 1, x: 31, y: 21, w: 1, h: 1 }, { kind: 'shellstatue', v: 1, x: 38, y: 21, w: 1, h: 1 });
    // autres décors de la caverne : dalles gravées, jarres, coquillages
    for (const [x, y, k, v] of [[12, 7, 'hieroslab', 0], [33, 7, 'hieroslab', 1], [10, 9, 'urn', 0], [35, 9, 'urn', 1], [6, 17, 'urn', 2], [40, 16, 'urn', 0], [14, 24, 'brokenpillar', 0]]) if (g[y][x] === '.') objects.push({ kind: k, v, x, y, w: 1, h: 1, small: k === 'urn' || k === 'brokenpillar' });
    for (const [x, y] of [[18, 20], [27, 22], [11, 14], [30, 12], [16, 11]]) if (g[y][x] === '.') objects.push({ kind: 'shellpile', v: (x + y) % 2, x, y, w: 1, h: 1, small: true, walk: true });
    MAPS.antre_shellmon = {
      name: 'Antre de Shellmon — La grande coquille', music: 'cave', bg: 'plage', ambient: 'forest', theme: 'sandtemple', climate: 'beach', region: 'plage', indoor: true,
      dark: { d: 0.5, col: '#100a06' }, rows: g.map(r => r.join('')), objects, npcs: [], signs: {}, warps: [], doors: [],
      triggers: [{ x: 21, y: 31, w: 4, h: 1, run: async ow => { await DW.fade(1, 0.3); ow.load('antre2', L2.exitAt.x, L2.exitAt.y, 'down'); await DW.fade(0, 0.3); } }],
      entry: { x: 22, y: 29 },
    };
    MAPS.antre_shellmon.signs['22,3'] = MAPS.antre_shellmon.signs['23,3'] = "Un totem de grès couvert de coquillages. Les yeux sculptés semblent te suivre...";
  }
  const lair = MAPS.antre_shellmon;
  const cageTalk = () => (st().kids || {}).tai ? say('La cage de corail est brisée. Tai et Agumon sont libres !') : say("À l'aide ! Ce gros coquillage nous retient depuis qu'on est tombés sur l'île... Agumon n'a plus de forces !", 'Tai');
  for (let x = 33; x < 37; x++) lair.signs[`${x},21`] = cageTalk;
  lair.populate = function () { const v = (st().kids || {}).tai ? 1 : 0; let ch = false; for (const o of this.objects) if (o.cage && o.v !== v) { o.v = v; ch = true; } if (ch && this.gfx) DW.World.unprepare(this); };

  // ------------------------------------------------------------ 3) Shellmon, Tai et Agumon
  lair.npcs.push(
    { sp: 'shellmon', x: 22, y: 13, face: 'down', talk: ow => fight(ow) },
    { hero: 'tai', x: 34, y: 19, face: 'down', cond: s => perso() && !(s.kids || {}).tai, talk: () => say("À l'aide ! Ce gros coquillage nous retient depuis qu'on est tombés sur l'île... Agumon n'a plus de forces !", 'Tai') },
    { hero: 'tai', x: 31, y: 23, face: 'left', cond: s => perso() && !!(s.kids || {}).tai && (s.flags.chapter || 1) < 2, talk: () => say('On rentre ? Agumon meurt de faim !', 'Tai') },
    { sp: 'agumon', x: 36, y: 20, face: 'left', cond: s => perso() && !(s.kids || {}).tai, talk: () => say('Tai... j\'ai faim... Je ne peux plus rien faire...', 'Agumon') },
  );
  async function fight(ow) {
    const s = st(), first = !s.flags.shellmon;
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Soigne-le d'abord."); return; }
    await say(first ? 'GRRRAAAH ! Personne ne touche à mes prisonniers !' : 'Encore toi ?! Cette fois, je vais t\'écraser !', 'Shellmon');
    if ((await DW.ask(first ? 'Affronter Shellmon ? (un Champion très puissant)' : 'Affronter Shellmon de nouveau ?')) !== 0) return;
    // premier combat : niveau 16, Tai et Greymon arrivent à mi-vie ; ensuite il suit ton niveau (de l'expérience à volonté)
    const top = Math.max(...s.party.map(m => m.level || 1));
    const lvl = first ? 16 : Math.min(60, Math.max(16, top + 1));
    const ally = first && perso() ? { at: 0.5, from: 'agumon', sp: 'greymon', lvl: 16, hero: 'tai', name: 'Tai', move: 'mega_flamme',
      join: "CRAC ! Le coquillage qui retenait Tai se fend ! « Agumon, on s'y met aussi ! »" } : null;
    const res = await ow.battle({ enemy: new DW.Digimon('shellmon', lvl), boss: true, canLose: true, ally, intro: 'Shellmon déploie ses tentacules !' });
    if (res !== 'win') { await say(first ? 'Shellmon est bien trop fort... Entraîne-toi, digivolue, et reviens délivrer Tai !' : 'Shellmon retourne se tapir dans sa coquille...'); return; }
    if (!first) { s.bits += 30 * lvl; await say(`Shellmon s'enfonce dans le sable en grommelant. (+${30 * lvl} Bits)`); return; }
    s.flags.shellmon = true;
    if (perso()) {
      // la cinématique (comme l'introduction), puis retour dans la grande coquille, la cage ouverte
      DW.Crests.freeKid('tai');
      await DW.Game.push(new DW.ShellmonCinema());
      ow.load('antre_shellmon', 30, 23, 'right');
      DW.Audio.play('village');
      await DW.fade(0, 0.8);
      await say("On a réussi ! Merci ! Sans toi, on y serait encore. Moi c'est Tai !", 'Tai');
      await say(`${s.name} ? Tu étais au camp, toi aussi ! Alors on est tous tombés sur l'île... Les autres doivent être quelque part.`, 'Tai');
      await say("Je peux venir chez toi ? Agumon et moi, on n'a nulle part où aller. Et dès que tu entends parler de Matt ou des autres, préviens-moi !", 'Tai');
      DW.Audio.sfx('fanfare');
      await say('Tai et Agumon sont délivrés ! Ils s\'installent dans une chambre de ta maison.');
    }
    DW.Trophies.give('shellmon'); DW.Audio.sfx('fanfare');
    await say('Tu reçois le Trophée de Shellmon ! (Il rejoint la cave de ta maison.)');
    const extra = DW.giveItem('soin_m', 3) + DW.giveItem('pm_m', 2); s.bits += 800;
    await say(`Dans la coquille vide, tu trouves 3 RAM PV+, 2 RAM PM+ et 800 Bits !${DW.extraMsg(extra)}`);
    await say('(Shellmon reviendra hanter son antre : tu pourras l\'y affronter de nouveau pour t\'entraîner.)');
    DW.autosave();
    await DW.Chapter.end1();
  }

  // ------------------------------------------------------------ arène du combat : la grande coquille
  DW.ArenaScene.FIELDS.antre = () => {
    const W = 36, H = 24, CX = W / 2, CY = H / 2 + 0.5, RX = 15.5, RY = 9.6, rows = [];
    for (let y = 0; y < H; y++) { let r = ''; for (let x = 0; x < W; x++) { const d = Math.hypot((x + 0.5 - CX) / RX, (y + 0.5 - CY) / RY); r += d >= 1 ? 'C' : DW.Art.hash(x, y, 91) < 0.06 ? '3' : 's'; } rows.push(r); }
    const objects = [{ kind: 'tidepool', x: 6, y: 7, w: 2, h: 1, small: true }, { kind: 'tidepool', x: 28, y: 15, w: 2, h: 1, small: true }, { kind: 'driftwood', x: 26, y: 6, w: 2, h: 1, small: true }, { kind: 'driftwood', x: 8, y: 16, w: 2, h: 1, small: true }];
    return { name: 'La grande coquille', rows, w: W, h: H, theme: 'beach', climate: 'beach', ambient: 'beach', bg: 'plage', indoor: true, lush: false, dense: false,
      dark: { d: 0.35, col: '#0a1420' }, npcs: [], warps: [], triggers: [], objects };
  };
  // les combats de la grande coquille se déroulent dans cette arène
  const battle0 = DW.Overworld.prototype.battle;
  DW.Overworld.prototype.battle = function (o) { if (this.mapId === 'antre_shellmon' && o && o.enemy && o.enemy.sp === 'shellmon' && !o.field) o = { ...o, field: 'antre' }; return battle0.call(this, o); };

  DW.Antre = { booth, fight, WORDS, ORDER };
})();
