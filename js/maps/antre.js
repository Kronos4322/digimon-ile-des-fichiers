'use strict';
// =====================================================================
//  L'ANTRE DE SHELLMON — boss final du chapitre 1 (épisode 2 de l'animé : les cabines de la plage)
//  1) après Kuwagamon, chaque cabine de la plage murmure un mot ; écoutées dans le bon ordre (« Aide-moi,
//     je suis sous le sable »), elles font s'ouvrir le sable : on descend dans l'antre ;
//  2) la grotte côtière (Galeries ensablées), la Lagune des Cristaux (traversée à gué), le temple englouti, puis la
//     Crypte des Gardiens (trois ankhs à rallumer pour ouvrir la porte scellée), dessinés avec les images du joueur
//     (dossier GROTTE DE SHELLMON) : des salles reliées par de larges couloirs, un sentier lisible, des coffres dans les
//     recoins, des Digimon de plus en plus forts ;
//  3) au fond, Shellmon garde Tai et Agumon prisonniers. À 35 % de ses PV, Tai est libéré :
//     Agumon digivolue en Greymon et combat à tes côtés (allié automatique, game/battle.js) ;
//  4) victoire : trophée de Shellmon (cave de ta maison), Tai s'installe dans sa chambre chez toi,
//     fin du chapitre 1. Ensuite Shellmon reste là : on peut le réaffronter pour l'expérience.
// =====================================================================
(function () {
  const MAPS = DW.MAPS;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  if (DW.World.sandTheme) DW.World.sandTheme();   // thème « temple ensablé » (gfx/temple.js)
  const perso = () => st().hero !== 'tai';   // (anciennes parties où l'on incarne Tai : pas de prisonnier)

  // ------------------------------------------------------------ 1) l'énigme des cabines
  // les 6 cabines (de gauche à droite) murmurent chacune un mot ; l'ordre de la phrase ouvre le passage
  const WORDS = ['sable', 'Aide-moi', 'sous', 'je', 'le', 'suis'];
  const ORDER = [1, 3, 5, 2, 4, 0];   // « Aide-moi, je suis sous le sable »
  async function booth(ow, i) {
    const s = st(), f = s.flags;
    if (f.shellLair) {
      if ((await DW.ask("Entre les cabines, le sable s'est effondré : des marches descendent dans le noir. Descendre ?")) !== 0) return;
      DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4);
      await ow.charger('antre1', MAPS.antre1.entry.x, MAPS.antre1.entry.y, 'up'); await DW.fade(0, 0.4);
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
    if (ow.map) { hole(ow.map, ow.mapId); ow.gfx = DW.World.prepare(ow.map); }   // le trou apparaît entre les cabines
    await say(perso() ? "« Aide-moi, je suis sous le sable ! » Toutes les cabines sonnent ensemble, puis se taisent..." : 'Toutes les cabines sonnent ensemble, puis se taisent...');
    DW.Audio.sfx('roar'); ow.shake = 1.4;
    await say("Le sable tremble... et s'effondre entre les cabines ! Un trou s'ouvre, des marches descendent vers les profondeurs.");
    DW.autosave();
  }

  // le trou dans le sable, entre les cabines (visible une fois l'énigme résolue) : on y descend en lui parlant
  const HOLE = { kind: 'sandhole', x: 35, y: 52, w: 3, h: 2, back: true, antre: true };
  function hole(m, id) {
    if (id !== 'plage' || !st().flags.shellLair || !m.objects || m.objects.some(o => o.antre)) return;
    m.objects.push({ ...HOLE }); m.signs = m.signs || {};
    for (let y = HOLE.y; y < HOLE.y + HOLE.h; y++) for (let x = HOLE.x; x < HOLE.x + HOLE.w; x++) m.signs[`${x},${y}`] = ow => booth(ow, 0);
    if (m.gfx) DW.World.unprepare(m);
  }

  // ------------------------------------------------------------ 2) l'antre, avec les images du joueur
  // (dossier « GROTTE DE SHELLMON » : assets/grotte, chargé à part — gfx/textures.js). Sous la plage, une GROTTE CÔTIÈRE
  // (sable, grès, bassins d'eau de mer, cristaux), puis un TEMPLE ENGLOUTI (dalles, colonnades, sarcophages, fontaine),
  // puis la grande caverne de Shellmon. Des salles bien dessinées reliées par de larges couloirs ; un sentier de sable
  // damé suit le chemin principal (on ne s'y perd plus), des recoins cachent les coffres ; les décors se posent contre
  // les parois et hors des passages (ils ne bloquent jamais le chemin).
  const Hh = (x, y, s) => DW.Art.hash(x, y, s);
  const G = n => 'tex_grotte_' + n;
  const CARTE = { music: 'temple', bg: 'plage', ambient: 'forest', theme: 'sandtemple', climate: 'beach', region: 'plage', indoor: true, textures: 'grotte', solCommun: true };
  // plan d'une carte : roche partout, puis on creuse cavernes, salles et couloirs ; les couloirs (et une marge) restent
  // libres de tout décor
  function Plan(W, H) {
    const g = Array.from({ length: H }, () => Array(W).fill('#')), objs = [], pris = new Set(), libreDeDecor = new Set();
    const dans = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2;
    const P = {
      W, H, g, objs,
      at: (x, y) => (g[y] && g[y][x]) || '#',
      sol: (x, y) => dans(x, y) && g[y][x] !== '#' && !DW.SOLID.has(g[y][x]),
      set(x, y, c) { if (dans(x, y)) g[y][x] = c; },
      // caverne : ellipse au bord irrégulier
      caverne(cx, cy, rx, ry, seed, c = '.') {
        for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) if (Math.hypot((x - cx) / rx, (y - cy) / ry) < 1 + (Hh(x, y, seed) - 0.5) * 0.24) P.set(x, y, c);
      },
      salle(x0, y0, x1, y1, c = 'z') { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) P.set(x, y, c); },
      // couloir le long d'une suite de points (r : demi-largeur) : creuse la roche et l'eau ; sa bande reste sans décor
      couloir(pts, r, c = '.') {
        for (let k = 0; k + 1 < pts.length; k++) {
          const [a, b] = [pts[k], pts[k + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
          for (let i = 0; i <= n; i++) {
            const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
            for (let yy = Math.floor(y - r - 1); yy <= Math.ceil(y + r + 1); yy++) for (let xx = Math.floor(x - r - 1); xx <= Math.ceil(x + r + 1); xx++) {
              const d = Math.hypot(xx - x, yy - y);
              if (d <= r && (P.at(xx, yy) === '#' || P.at(xx, yy) === '~')) P.set(xx, yy, c);
              if (d <= r + 1) libreDeDecor.add(xx + ',' + yy);
            }
          }
        }
      },
      // sentier : une piste de sable damé le long du chemin principal
      sentier(pts) {
        for (let k = 0; k + 1 < pts.length; k++) {
          const [a, b] = [pts[k], pts[k + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
          for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(a[0] + (b[0] - a[0]) * t), y = Math.round(a[1] + (b[1] - a[1]) * t); for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) if ('.,s'.includes(P.at(x + dx, y + dy))) P.set(x + dx, y + dy, '='); }
        }
      },
      reserve(x, y) { libreDeDecor.add(x + ',' + y); },
      libre: (x, y) => P.sol(x, y) && !pris.has(x + ',' + y) && !libreDeDecor.has(x + ',' + y),
      // pose un décor dont le pied est la case (x, y) ; il bloque sa case (sauf walk)
      pose(n, x, y, o = {}) { if (!P.libre(x, y)) return false; objs.push({ kind: n.startsWith('tex_') ? n : G(n), v: 0, x, y, w: 1, h: 1, ...o }); pris.add(x + ',' + y); return true; },
      // contre la paroi du fond (la roche juste au-dessus) : les décors adossés (panneaux, torches, niches, statues)
      contreMur: (x, y) => P.sol(x, y) && P.at(x, y - 1) === '#',
      // cases contre la paroi du fond, dans un rectangle, de gauche à droite
      fond(x0, y0, x1, y1) { const L = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (P.contreMur(x, y)) { L.push([x, y]); break; } return L; },
      // un bassin (eau de mer qui suinte dans la grotte) bordé de sable mouillé
      bassin(cx, cy, rx, ry, seed) {
        for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
          if (!P.sol(x, y)) continue;
          const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (Hh(x, y, seed) - 0.5) * 0.2;
          if (d < 1) P.set(x, y, '~'); else if (d < 1.45) P.set(x, y, 's');
        }
      },
      // herbes des dunes (sable mouvant où guettent les Digimon sauvages)
      dunes(cx, cy, r, seed) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (P.at(x, y) === '.' && Math.hypot(x - cx, y - cy) < r && DW.Art.fbm(x * 0.3, y * 0.3, seed) > 0.42) P.set(x, y, ','); },
    };
    return P;
  }
  // une porte du temple, contre la paroi du fond : on passe en son milieu, ses deux côtés bloquent
  const porte = (P, n, x, y) => { P.objs.push({ kind: G(n), v: 0, x, y, w: 1, h: 1, walk: true, block: [[-1, 0], [1, 0]] }); P.reserve(x, y); for (const dx of [-1, 1]) P.reserve(x + dx, y); };
  const versCarte = (id, x, y, dir) => async ow => { await DW.fade(1, 0.3); await ow.charger(id, x, y, dir); await DW.fade(0, 0.3); };
  const LOOT = [[['soin_m', 2], ['pm_m', 1]], [['cartes', 2], ['super_viande', 1]]];
  // coffres (mêmes clés qu'avant : un coffre déjà ouvert le reste) ; une carte de l'album au fond de chacun
  function coffres(id, places, cartes = ['bukamon', 'betamon'], loot = LOOT) {
    places.forEach(([x, y], i) => {
      DW.Palais.treasure(id, `${id}_coffre${i}`, null, loot[i % loot.length], x, y);
      const sign = MAPS[id].signs[`${x},${y}`], sp = cartes[i % cartes.length];
      MAPS[id].signs[`${x},${y}`] = async ow => { const had = (DW.state.chests || {})[`${id}_coffre${i}`]; await sign(ow); if (!had && DW.Cards && DW.Cards.give(sp)) await say(`Au fond du coffre, une carte de ${DW.SPECIES[sp].name} ! (Album)`); };
    });
  }
  // décors adossés à la paroi du fond d'une caverne (centre cx, cy ; rayons rx, ry) : environ un sur « pas », pris dans la palette
  const habiller = (P, cx, cy, rx, ry, pal, pas, seed) => {
    for (const [x, y] of P.fond(Math.floor(cx - rx), Math.floor(cy - ry - 2), Math.ceil(cx + rx), cy)) if (Hh(x, y, seed) < 1 / pas) P.pose(pal[Math.floor(Hh(y, x, seed + 1) * pal.length)], x, y, { small: true });
  };
  const [px, py] = DW.MapKit.zpt('plage', 18, 27);

  // ------------------------------------------------------------ 2a) GALERIES ENSABLÉES : la grotte côtière
  // A entrée (en bas, l'escalier vers la plage) → C galerie centrale (premières ruines) → D caverne de la cascade →
  // F salle du passage vers la lagune (en haut). Recoins : B grotte aux bassins (coffre), E caverne aux ossements (coffre).
  {
    const W = 64, H = 48, P = Plan(W, H);
    const A = [32, 37], B = [13, 32], C = [33, 25], D = [50, 30], E = [15, 15], F = [40, 11];
    P.caverne(A[0], A[1], 9, 5, 11); P.caverne(B[0], B[1], 7, 5.5, 12); P.caverne(C[0], C[1], 8.5, 5.5, 13);
    P.caverne(D[0], D[1], 7.5, 6.5, 14); P.caverne(E[0], E[1], 8, 5, 15); P.caverne(F[0], F[1], 10, 5, 16);
    // l'eau de mer suinte dans la grotte : bassins dans l'entrée, la grotte aux bassins et la caverne de la cascade
    P.bassin(25, 39, 3.2, 2.2, 21); P.bassin(10, 34, 3.6, 2.6, 22); P.bassin(54, 33, 3, 2.4, 23);
    // couloirs : chemin principal A → C → D → F, et les recoins
    const principal = [[32, 45], [32, 41], A, [34, 30], C, [42, 28], D, [49, 20], [45, 14], F, [40, 7]];
    P.couloir(principal, 1.8); P.couloir([A, [22, 35], B], 1.6); P.couloir([C, [24, 19], E], 1.6); P.couloir([E, [27, 11], F], 1.4);
    for (let y = 43; y < 46; y++) for (let x = 31; x <= 33; x++) P.set(x, y, y >= 44 ? '^' : '.');   // l'escalier qui remonte à la plage
    P.dunes(C[0] + 2, C[1] + 1, 6, 31); P.dunes(D[0] - 2, D[1] - 2, 5, 32); P.dunes(E[0], E[1] + 1, 4, 33);
    P.sentier(principal.slice(1, -1));
    // au fond de la salle F, une arche taillée dans la roche : le passage vers la lagune (l'entrée du temple est au-delà)
    const [gx, gy] = P.fond(F[0], F[1] - 6, F[0], F[1])[0] || [F[0], F[1] - 4];
    porte(P, 'porte_grotte', gx, gy);
    for (const dx of [-3, 3]) P.pose('torche_anubis', gx + dx, gy, { small: true });
    // décors adossés aux parois : grès, rochers, cristaux, stalagmites (la grotte), puis les premières ruines du temple
    const roche = ['gres_rochers', 'rochers', 'stalagmites', 'gres_aiguilles', 'eboulis', 'rocher_mousse', 'gres_eboulis'];
    const lueur = ['cristaux', 'champignons', 'cristaux_violets', 'fleurs_lanternes'];
    habiller(P, A[0], A[1], 9, 5, roche, 2.2, 41); habiller(P, B[0], B[1], 7, 5, [...roche, ...lueur], 2, 42); habiller(P, C[0], C[1], 8, 5, ['pilier_brise', 'colonne_moussue', 'gres_ankh', 'gres_mur', 'stele'], 2.4, 43);
    habiller(P, D[0], D[1], 7, 6, [...roche, 'gres_arche'], 2.2, 44); habiller(P, E[0], E[1], 8, 5, [...lueur, 'stalagmite', 'ossements'], 1.8, 45); habiller(P, F[0], F[1], 10, 5, ['pilier_brise', 'statue_scarabee', 'gres_mur', 'colonne_moussue'], 2.6, 46);
    // au sol, près des parois : cristaux qui luisent, ossements, jarres renversées, torches plantées sur le chemin
    for (const [x, y, n] of [[8, 29, 'cristaux'], [18, 36, 'cristaux_violets'], [11, 13, 'colonne_cristaux'], [21, 17, 'champignons'], [12, 18, 'ossements'],
      [57, 27, 'cascade_roche'], [45, 34, 'gue'], [27, 28, 'jarre'], [39, 22, 'tresor_sable'], [33, 9, 'brasero'], [47, 9, 'brasero'],
      [36, 41, 'torche_plantee'], [28, 34, 'torche_plantee'], [38, 26, 'torche_trepied'], [44, 20, 'torche_trepied'], [24, 14, 'fleurs_lanternes']]) P.pose(n, x, y, { small: true });
    const M = MAPS.antre1 = { ...CARTE, name: 'Antre de Shellmon — Galeries ensablées', paroi: 'chemin',
      dark: { d: 0.55, col: '#140a04' }, rate: 0.1, wildN: 11, aggro: 0.9, sight: 7,
      encounters: [{ sp: 'bukamon', min: 11, max: 13, w: 30 }, { sp: 'betamon', min: 12, max: 14, w: 40 }, { sp: 'gotsumon', min: 12, max: 14, w: 20 }],
      rows: P.g.map(r => r.join('')), objects: P.objs, npcs: [], signs: {}, warps: [], doors: [],
      triggers: [{ x: 31, y: 45, w: 3, h: 1, run: versCarte('plage', px, py, 'down') }, { x: gx, y: gy, w: 1, h: 1, run: async ow => { const N = MAPS.antre_lagune; await versCarte('antre_lagune', N.entry.x, N.entry.y, 'up')(ow); } }],
      entry: { x: 32, y: 42 }, exitAt: { x: gx, y: gy + 1 } };
    // l'inscription de l'entrée, gravée sur une stèle
    if (P.pose('stele', 35, 40)) M.signs['35,40'] = "Des marches taillées dans le grès s'enfoncent sous la plage. Sur la stèle, une gravure : un coquillage géant enroulé autour d'une pyramide.";
    coffres('antre1', [P.fond(B[0] - 6, B[1] - 6, B[0] - 2, B[1])[0] || [B[0] - 4, B[1] - 3], P.fond(E[0] - 7, E[1] - 6, E[0] - 3, E[1])[0] || [E[0] - 5, E[1] - 3]]);
  }

  // ------------------------------------------------------------ 2b) LAGUNE DES CRISTAUX : la grotte inondée
  // A entrée (en bas, l'escalier des galeries) → L la grande lagune, traversée à GUÉ (un banc de sable bordé de pierres
  // plates) → F salle de l'entrée du temple (en haut). À l'est, D la caverne de la cascade fait le tour de l'eau ;
  // recoins : B grotte aux cristaux (coffre), E grotte aux champignons (coffre).
  {
    const W = 64, H = 48, P = Plan(W, H);
    const A = [32, 39], L = [24, 25], B = [9, 39], D = [51, 27], E = [10, 11], F = [37, 11];
    P.caverne(A[0], A[1], 9, 4.5, 111); P.caverne(L[0], L[1], 14, 7.5, 112); P.caverne(B[0], B[1], 6, 4.5, 113);
    P.caverne(D[0], D[1], 8, 6.5, 114); P.caverne(E[0], E[1], 7, 4.5, 115); P.caverne(F[0], F[1], 10, 4.5, 116);
    // l'eau de mer suinte aussi ailleurs : la vasque au pied de la cascade (D), une flaque dans la grotte aux cristaux
    P.bassin(D[0] + 5, D[1] - 1, 2.6, 2, 122); P.bassin(B[0] - 1, B[1] + 1, 2.2, 1.6, 123);
    // couloirs : chemin principal A → gué de la lagune → F ; la boucle de l'est A → D → F ; les recoins
    const principal = [[32, 45], [32, 42], A, [27, 34], [26, 30], [26, 20], [30, 15], F, [37, 7]];
    P.couloir(principal, 1.7); P.couloir([A, [43, 36], D, [48, 17], F], 1.5); P.couloir([A, [20, 40], B], 1.5); P.couloir([[13, 22], [11, 17], E], 1.4);
    for (let y = 43; y < 46; y++) for (let x = 31; x <= 33; x++) P.set(x, y, y >= 44 ? '^' : '.');   // l'escalier qui remonte aux galeries
    P.dunes(A[0] - 4, A[1], 4.5, 131); P.dunes(D[0], D[1] + 3, 4, 132); P.dunes(E[0] + 1, E[1] + 1, 3.5, 133);
    P.sentier(principal.slice(1, -1));
    // la LAGUNE, remplie après les couloirs (l'eau recouvre le chemin) ; le GUÉ, un étroit banc de sable dans le
    // prolongement du chemin, bordé de pierres plates
    P.bassin(L[0], L[1], 10, 4.6, 121);
    const gue = [];
    for (let y = L[1] - 6; y <= L[1] + 6; y++) for (let x = 25; x <= 27; x++) if (P.at(x, y) === '~') { P.set(x, y, 's'); gue.push([x, y]); }
    for (const [x, y] of gue) for (const dx of [-1, 1]) if (P.at(x + dx, y) === '~' && Hh(x + dx, y, 124) < 0.7) P.objs.push({ kind: G('gue'), v: 0, x: x + dx, y, w: 1, h: 1, walk: true });
    // l'entrée du temple, au fond de la salle F
    const [gx, gy] = P.fond(F[0], F[1] - 6, F[0], F[1])[0] || [F[0], F[1] - 4];
    porte(P, 'entree_temple', gx, gy);
    for (const dx of [-3, 3]) P.pose('torche_anubis', gx + dx, gy, { small: true });
    // décors adossés aux parois : rochers (entrée), cristaux (leur grotte), sources (la cascade), champignons, ruines (F)
    const roche = ['gres_rochers', 'rochers', 'stalagmites', 'eboulis', 'rocher_mousse', 'stalagmite'];
    habiller(P, A[0], A[1], 9, 4.5, roche, 2.2, 141); habiller(P, B[0], B[1], 6, 4.5, ['cristaux', 'cristaux_violets', 'colonne_cristaux', 'obelisque_cristal'], 1.5, 142);
    habiller(P, D[0], D[1], 8, 6.5, [...roche, 'source_grotte'], 2.4, 144); habiller(P, E[0], E[1], 7, 4.5, ['champignons', 'fleurs_lanternes', 'rocher_mousse', 'champignons'], 1.6, 145);
    habiller(P, F[0], F[1], 10, 4.5, ['colonne_moussue', 'pilier_brise', 'gres_ankh', 'obelisque_bleu'], 2.4, 146);
    // deux cascades tombent de la paroi du fond dans la lagune, une autre dans la vasque de la caverne D
    for (const x of [L[0] - 6, L[0] + 9, D[0] + 5]) { const [cx, cy] = P.fond(x, 14, x, 30)[0] || []; if (cx) P.pose('cascade_roche', cx, cy); }
    // au sol, près des parois : cristaux qui luisent sur les rives, stalagmites, ossements, torches le long du chemin
    for (const [x, y, n] of [[12, 29, 'colonne_cristaux'], [36, 21, 'obelisque_cristal'], [11, 24, 'cristaux_violets'], [37, 29, 'cristaux'], [19, 32, 'stalagmite'], [33, 32, 'stalagmites'],
      [40, 25, 'rocher_mousse'], [39, 31, 'stalagmite'], [41, 21, 'cristaux_violets'], [16, 20, 'rochers'],
      [4, 37, 'cristaux'], [14, 42, 'cristaux_violets'], [58, 31, 'rocher_mousse'], [45, 24, 'champignons'], [5, 13, 'ossements'], [16, 9, 'fleurs_lanternes'],
      [36, 41, 'torche_plantee'], [29, 36, 'torche_plantee'], [29, 17, 'torche_trepied'], [44, 33, 'torche_trepied'], [31, 9, 'brasero'], [43, 9, 'brasero']]) P.pose(n, x, y, { small: true });
    const M = MAPS.antre_lagune = { ...CARTE, name: 'Antre de Shellmon — Lagune des Cristaux', paroi: 'sol_roche',
      dark: { d: 0.55, col: '#06101a' }, rate: 0.1, wildN: 11, aggro: 0.9, sight: 7,
      encounters: [{ sp: 'bukamon', min: 12, max: 14, w: 25 }, { sp: 'betamon', min: 13, max: 15, w: 40 }, { sp: 'gotsumon', min: 13, max: 16, w: 25 }],
      rows: P.g.map(r => r.join('')), objects: P.objs, npcs: [], signs: {}, warps: [], doors: [],
      triggers: [{ x: 31, y: 45, w: 3, h: 1, run: async ow => { const A1 = MAPS.antre1; await versCarte('antre1', A1.exitAt.x, A1.exitAt.y, 'down')(ow); } },
        { x: gx, y: gy, w: 1, h: 1, run: async ow => { const N = MAPS.antre2; await versCarte('antre2', N.entry.x, N.entry.y, 'up')(ow); } }],
      entry: { x: 32, y: 42 }, exitAt: { x: gx, y: gy + 1 } };
    if (P.pose('panneau', 35, 40)) M.signs['35,40'] = "Un vieux panneau de bois, rongé par le sel : « LAGUNE — passez au gué ». Quelqu'un est déjà venu jusqu'ici...";
    coffres('antre_lagune', [P.fond(B[0] - 5, B[1] - 5, B[0], B[1])[0] || [B[0] - 3, B[1] - 3], P.fond(E[0] - 6, E[1] - 5, E[0] - 2, E[1])[0] || [E[0] - 4, E[1] - 3]], ['gotsumon', 'kunemon']);
  }

  // ------------------------------------------------------------ 2c) TEMPLE ENGLOUTI : salles dallées
  // R1 vestibule (en bas, l'escalier de la lagune) → R2 salle des colonnes → R5 antichambre et la porte gardée qui
  // descend à la crypte (en haut). À l'ouest, R3 la crypte (sarcophages, un coffre) et R6 la salle du trésor ; à l'est,
  // R4 la cour de la fontaine.
  {
    const W = 64, H = 48, P = Plan(W, H);
    const R1 = [27, 38, 37, 44], R2 = [20, 25, 44, 33], R3 = [5, 23, 16, 33], R4 = [48, 21, 60, 34], R5 = [23, 5, 41, 15], R6 = [5, 5, 15, 13];
    for (const R of [R1, R2, R3, R4, R5, R6]) P.salle(...R);
    // couloirs dallés (3 cases de large) ; le chemin principal monte tout droit R1 → R2 → R5
    P.couloir([[32, 46], [32, 38]], 1.2, 'z'); P.couloir([[32, 38], [32, 33]], 1.2, 'z'); P.couloir([[32, 25], [32, 15]], 1.2, 'z');
    P.couloir([[20, 29], [16, 29]], 1.2, 'z'); P.couloir([[44, 28], [48, 28]], 1.2, 'z'); P.couloir([[10, 23], [10, 13]], 1.2, 'z');
    P.couloir([[54, 21], [54, 10], [41, 10]], 1.2, 'z');
    for (let y = 44; y < 46; y++) for (let x = 31; x <= 33; x++) P.set(x, y, '^');   // l'escalier qui remonte vers la lagune
    // sable entré par les fissures (les Digimon sauvages s'y cachent) et la fontaine de la cour, au milieu d'un bassin
    P.dunes(23, 31, 3.5, 51); P.dunes(42, 27, 3, 52); P.dunes(57, 31, 3, 53); P.dunes(12, 31, 3, 54);
    for (let y = 26; y <= 30; y++) for (let x = 52; x <= 57; x++) P.set(x, y, (y === 26 || y === 30 || x === 52 || x === 57) ? 's' : '~');
    for (let y = 25; y <= 31; y++) for (let x = 51; x <= 58; x++) P.reserve(x, y);   // (le bassin et son rebord : pas de décor)
    // allée centrale de la salle des colonnes : deux rangées de piliers peints de part et d'autre
    for (let x = 22; x <= 42; x += 4) { P.reserve(x, 29); P.pose(x % 8 ? 'pilier_lotus' : 'pilier_peint', x, 26); P.pose(x % 8 ? 'pilier_peint' : 'pilier_lotus', x, 32); }
    for (let y = 26; y <= 32; y++) for (let x = 30; x <= 34; x++) P.reserve(x, y);
    // PAROIS DU FOND de chaque salle : panneaux gravés, fresques, niches et bannières, avec des torches entre eux
    const murs = ['mur_hieroglyphes', 'fresque', 'mur_scarabee', 'mur_peint', 'niche', 'mur_soleil', 'mur_grave', 'banniere'];
    const facade = (R, seed, pas = 3) => { let k = Math.floor(Hh(R[0], R[1], seed) * murs.length); for (const [x, y] of P.fond(R[0], R[1], R[2], R[3])) { if ((x - R[0]) % pas) continue; const t = (x - R[0]) / pas; P.pose(t % 2 ? 'torche_murale' : murs[k++ % murs.length], x, y, { small: true }); } };
    facade(R1, 61); facade(R2, 62); facade(R3, 63); facade(R4, 64); facade(R6, 66);
    // R1 vestibule : deux gardiens scarabées, des braseros
    for (const [x, y, n] of [[28, 41, 'statue_scarabee'], [36, 41, 'statue_scarabee'], [28, 43, 'brasero'], [36, 43, 'brasero']]) P.pose(n, x, y);
    // R3 crypte : sarcophages, alcôves, vases canopes
    for (const [x, y, n] of [[6, 26, 'sarcophage'], [6, 30, 'sarcophage'], [15, 26, 'canopes'], [15, 31, 'jarre'], [8, 33, 'vase'], [13, 33, 'tombeau']]) P.pose(n, x, y);
    // R4 cour de la fontaine : la fontaine au fond, des vasques, des offrandes
    for (const [x, y, n] of [[50, 33, 'vasque'], [59, 33, 'vasque'], [49, 23, 'offrandes'], [59, 24, 'brasero_anubis'], [49, 31, 'jarre']]) P.pose(n, x, y);
    { const [fx, fy] = P.fond(53, 21, 56, 25)[0] || [54, 21]; P.reserve(fx, fy); P.objs.push({ kind: G('fontaine_lotus'), v: 0, x: fx + 1, y: fy, w: 1, h: 1 }); }
    // R6 salle du trésor : offrandes, trésor ensablé, scarabée d'or (le coffre : coffres())
    for (const [x, y, n] of [[6, 7, 'offrandes'], [14, 7, 'scarabee_or'], [6, 12, 'tresor_sable'], [14, 12, 'ankh']]) P.pose(n, x, y);
    // R5 antichambre : la porte gardée (vers la crypte), Anubis de part et d'autre, rideaux, obélisques, coupes de feu
    const [gx, gy] = P.fond(32, 5, 32, 10)[0] || [32, 5];
    porte(P, 'porte_gardiens', gx, gy);
    for (const [x, y, n] of [[gx - 5, gy + 1, 'anubis'], [gx + 5, gy + 1, 'anubis'], [24, 7, 'obelisque'], [40, 7, 'obelisque'], [26, 13, 'coupe_feu'], [38, 13, 'coupe_feu'],
      [24, 12, 'canopes'], [40, 12, 'jarre']]) P.pose(n, x, y);
    for (const [x, y] of P.fond(23, 5, 41, 8)) if (Math.abs(x - gx) > 6 && (x - 23) % 4 === 1) P.pose(x % 8 === 1 ? 'rideau' : 'banniere', x, y, { small: true });
    const M = MAPS.antre2 = { ...CARTE, name: 'Antre de Shellmon — Temple englouti', paroi: 'paves',
      dark: { d: 0.55, col: '#140a04' }, rate: 0.1, wildN: 11, aggro: 0.9, sight: 7,
      encounters: [{ sp: 'betamon', min: 14, max: 16, w: 40 }, { sp: 'gotsumon', min: 15, max: 17, w: 30 }, { sp: 'kunemon', min: 15, max: 17, w: 20 }, { sp: 'mushroomon', min: 16, max: 18, w: 15 }],
      rows: P.g.map(r => r.join('')), objects: P.objs, npcs: [], signs: {}, warps: [], doors: [],
      triggers: [{ x: 31, y: 45, w: 3, h: 1, run: async ow => { const L = MAPS.antre_lagune; await versCarte('antre_lagune', L.exitAt.x, L.exitAt.y, 'down')(ow); } },
        { x: gx, y: gy, w: 1, h: 1, run: async ow => { const C = MAPS.antre_crypte; await versCarte('antre_crypte', C.entry.x, C.entry.y, 'up')(ow); } }],
      entry: { x: 32, y: 43 }, exitAt: { x: gx, y: gy + 1 } };
    M.signs['24,7'] = M.signs['40,7'] = "Un obélisque couvert de hiéroglyphes. On y devine un coquillage géant... et un enfant enfermé.";
    coffres('antre2', [[10, 8], P.fond(R3[0] + 4, R3[1], R3[2] - 3, R3[3])[0] || [10, 24]]);
  }

  // ------------------------------------------------------------ 2d) CRYPTE DES GARDIENS : la porte scellée
  // R1 vestibule (en bas, l'escalier du temple) → R2 salle des gardiens (deux rangées d'Anubis) → R5 antichambre et la
  // PORTE SCELLÉE (en haut). Trois ankhs éteints la tiennent fermée, un dans chaque salle latérale : R3 la crypte des
  // sarcophages (ouest), R4 la salle des lampes (est), R6 le sanctuaire de l'orbe (à l'ouest de l'antichambre). Allumés
  // tous les trois, dans n'importe quel ordre, ils ouvrent la porte. R7 (à l'est de l'antichambre) : la salle du trésor.
  const allumes = s => [0, 1, 2].filter(i => (s.flags.ankhs || [])[i]).length;
  const ouverte = s => !!s.flags.shellmon || allumes(s) === 3;   // (Shellmon déjà vaincu par l'ancien chemin : ouverte)
  // toucher l'ankh i : il s'allume ; le troisième ouvre la porte scellée (son, secousse)
  async function allumer(ow, i) {
    const s = st(), f = s.flags, M = MAPS.antre_crypte;
    if ((f.ankhs || [])[i]) { await say("L'ankh brille d'une douce lumière dorée."); return; }
    await say("Un ankh d'or sur son socle, éteint et couvert de sable. Tu poses la main dessus... il s'illumine !");
    (f.ankhs = f.ankhs || [])[i] = true; DW.Audio.sfx('buff');
    M.populate(); if (ow.map === M) ow.gfx = DW.World.prepare(M);
    const n = allumes(s);
    if (n < 3) { await say(`Un déclic sourd résonne du côté de l'antichambre... (${n} ankh${n > 1 ? 's' : ''} allumé${n > 1 ? 's' : ''} sur 3)`); DW.autosave(); return; }
    DW.Audio.sfx('roar'); ow.shake = 1.4;
    await say("Les trois ankhs brillent ensemble ! Un grondement traverse la crypte : au fond de l'antichambre, la porte scellée s'est ouverte.");
    DW.autosave();
  }
  {
    const W = 64, H = 48, P = Plan(W, H);
    const R1 = [27, 38, 37, 44], R2 = [17, 21, 47, 32], R3 = [3, 20, 12, 33], R4 = [52, 20, 61, 33], R5 = [23, 5, 41, 13], R6 = [3, 4, 14, 12], R7 = [50, 4, 61, 12];
    for (const R of [R1, R2, R3, R4, R5, R6, R7]) P.salle(...R);
    // couloirs dallés ; le chemin principal monte tout droit R1 → R2 → R5
    P.couloir([[32, 46], [32, 38]], 1.2, 'z'); P.couloir([[32, 38], [32, 32]], 1.2, 'z'); P.couloir([[32, 21], [32, 13]], 1.2, 'z');
    P.couloir([[17, 27], [12, 27]], 1.2, 'z'); P.couloir([[47, 27], [52, 27]], 1.2, 'z'); P.couloir([[23, 9], [14, 9]], 1.2, 'z'); P.couloir([[41, 9], [50, 9]], 1.2, 'z');
    for (let y = 44; y < 46; y++) for (let x = 31; x <= 33; x++) P.set(x, y, '^');   // l'escalier qui remonte vers le temple
    // du sable entré par les fissures, dans les coins des salles
    const ensabler = (cx, cy, r, seed) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (P.at(x, y) === 'z' && Math.hypot(x - cx, y - cy) < r && DW.Art.fbm(x * 0.35, y * 0.35, seed) > 0.4) P.set(x, y, 's'); };
    ensabler(19, 31, 4, 151); ensabler(46, 22, 3, 152); ensabler(4, 32, 3, 153); ensabler(60, 21, 3, 154); ensabler(25, 12, 3, 155); ensabler(59, 11, 3, 156);
    // LES TROIS ANKHS, contre la paroi du fond de leur salle (on leur parle d'en dessous) ; LA PORTE SCELLÉE, au fond de R5
    const ankh = (R, i) => { const x = (R[0] + R[2]) >> 1, [ax, ay] = P.fond(x, R[1], x, R[3])[0] || [x, R[1]]; P.objs.push({ kind: G('ankh'), v: 0, x: ax, y: ay, w: 1, h: 1, ankh: i }); P.reserve(ax, ay); P.reserve(ax, ay + 1); return [ax, ay]; };
    const ankhs = [ankh(R3, 0), ankh(R4, 1), ankh(R6, 2)];
    const [gx, gy] = P.fond(32, 5, 32, 9)[0] || [32, 5];   // (une case plus bas que les autres salles : la porte, haute, tient dans la carte)
    P.objs.push({ kind: G('porte_scellee'), v: 0, x: gx, y: gy, w: 1, h: 1, walk: true, block: [[-1, 0], [0, 0], [1, 0]], scellee: true });
    for (const dx of [-1, 0, 1]) P.reserve(gx + dx, gy); P.reserve(gx, gy + 1);
    // R2 SALLE DES GARDIENS : deux rangées d'Anubis le long de l'allée, une dalle du soleil au milieu
    for (let y = 22; y <= 31; y++) for (let x = 30; x <= 34; x++) P.reserve(x, y);
    for (const x of [20, 25, 39, 44]) { P.pose('anubis', x, 25); P.pose('anubis', x, 29); }
    P.objs.push({ kind: G('dalle_soleil'), v: 0, x: 32, y: 27, w: 1, h: 1, walk: true });
    // PAROIS DU FOND de chaque salle : alcôves à sarcophages, fresques, niches (lanternes dans la salle des lampes)
    const murs = ['alcove_sarcophage', 'fresque', 'mur_niche', 'mur_hieroglyphes', 'alcove_sarcophage', 'mur_grave', 'niche', 'frise_murale'];
    const facade = (R, seed, pal = murs, pas = 3) => { let k = Math.floor(Hh(R[0], R[1], seed) * pal.length); for (const [x, y] of P.fond(R[0], R[1], R[2], R[3])) { if ((x - R[0]) % pas) continue; const t = (x - R[0]) / pas; P.pose(t % 2 ? 'torche_murale' : pal[k++ % pal.length], x, y, { small: true }); } };
    facade(R1, 71); facade(R2, 72); facade(R3, 73); facade(R4, 74, ['lanterne', 'mur_peint', 'lanterne', 'mur_soleil']); facade(R6, 76, ['niche_statue', 'mur_scarabee', 'stele_magique']); facade(R7, 77);
    // R1 vestibule : scarabées gardiens, braseros ; la stèle qui dit comment ouvrir la porte
    for (const [x, y, n] of [[28, 41, 'statue_scarabee'], [36, 41, 'statue_scarabee'], [28, 43, 'brasero_anubis'], [36, 43, 'brasero_anubis']]) P.pose(n, x, y);
    // R3 crypte des sarcophages ; R4 salle des lampes ; R6 sanctuaire de l'orbe ; R7 salle du trésor (le coffre : coffres())
    for (const [x, y, n] of [[4, 24, 'sarcophage'], [4, 29, 'sarcophage'], [11, 23, 'sarcophage_roche'], [11, 31, 'tombeau'], [5, 33, 'canopes'], [10, 33, 'vase'],
      [53, 23, 'brasero_colonne'], [60, 24, 'brasero_colonne'], [53, 32, 'vasque'], [60, 32, 'vasque'], [60, 28, 'offrandes'], [57, 31, 'lampe'],
      [ankhs[2][0] - 3, ankhs[2][1] + 1, 'piedestal_orbe'], [ankhs[2][0] + 3, ankhs[2][1] + 1, 'piedestal_orbe'], [4, 11, 'obelisque_bleu'], [13, 11, 'sanctuaire_orbe'],
      [51, 7, 'coffre_anubis'], [60, 7, 'scarabee_or'], [51, 11, 'tresor_sable'], [60, 11, 'jarre'], [58, 5, 'offrandes']]) P.pose(n, x, y);
    // R5 antichambre : deux Anubis contre la porte scellée, obélisques bleus, coupes de feu, rideaux et bannières
    for (const [x, y, n] of [[gx - 4, gy + 1, 'anubis'], [gx + 4, gy + 1, 'anubis'], [25, 6, 'obelisque_bleu'], [39, 6, 'obelisque_bleu'], [26, 12, 'coupe_feu'], [38, 12, 'coupe_feu']]) P.pose(n, x, y);
    for (const [x, y] of P.fond(23, 5, 41, 8)) if (Math.abs(x - gx) > 6 && (x - 23) % 4 === 1) P.pose(x % 8 === 1 ? 'rideau' : 'banniere', x, y, { small: true });
    const M = MAPS.antre_crypte = { ...CARTE, name: 'Antre de Shellmon — Crypte des Gardiens', paroi: 'dalles_fissurees',
      dark: { d: 0.6, col: '#120806' }, rate: 0.1, wildN: 11, aggro: 0.9, sight: 7,
      encounters: [{ sp: 'gotsumon', min: 15, max: 17, w: 30 }, { sp: 'kunemon', min: 15, max: 17, w: 20 }, { sp: 'mushroomon', min: 16, max: 18, w: 25 }, { sp: 'betamon', min: 15, max: 17, w: 15 }],
      rows: P.g.map(r => r.join('')), objects: P.objs, npcs: [], signs: {}, warps: [], doors: [],
      triggers: [{ x: 31, y: 45, w: 3, h: 1, run: async ow => { const A2 = MAPS.antre2; await versCarte('antre2', A2.exitAt.x, A2.exitAt.y, 'down')(ow); } },
        { x: gx, y: gy, w: 1, h: 1, cond: ouverte, run: versCarte('antre_shellmon', 22, 29, 'up') }],
      entry: { x: 32, y: 43 }, exitAt: { x: gx, y: gy + 1 } };
    ankhs.forEach(([x, y], i) => { M.signs[`${x},${y}`] = ow => allumer(ow, i); });
    M.signs[`${gx},${gy}`] = async () => { const s = st(); if (ouverte(s)) return; const n = allumes(s); await say(`Une lourde porte de pierre, scellée par un disque d'or. Au-dessus, trois ankhs gravés : ${n ? `${n} sur 3 brille${n > 1 ? 'nt' : ''}.` : 'aucun ne brille.'}`); };
    if (P.pose('stele_lumineuse', 35, 40)) M.signs['35,40'] = "Une stèle couverte de hiéroglyphes, qui luit doucement. On y lit : « Trois ankhs veillent sur la porte du maître de l'antre. Rallume-les, et elle s'ouvrira. »";
    coffres('antre_crypte', [[55, 7]], ['tanemon'], [[['disque_atk', 1], ['soin_m', 2]]]);
    // (les ankhs et la porte suivent les drapeaux, à chaque entrée dans la crypte)
    M.populate = function () {
      const s = st(), a = s.flags.ankhs || [], ouv = ouverte(s); let ch = false;
      for (const o of this.objects) {
        const k = o.ankh != null ? G(a[o.ankh] ? 'ankh_lumineux' : 'ankh') : o.scellee ? G(ouv ? 'porte_temple' : 'porte_scellee') : null;
        if (!k || o.kind === k) continue;
        o.kind = k; if (o.scellee) o.block = ouv ? [[-1, 0], [1, 0]] : [[-1, 0], [0, 0], [1, 0]]; ch = true;
      }
      if (ch && this.gfx) DW.World.unprepare(this);
    };
  }

  // ------------------------------------------------------------ 2e) LA GRANDE COQUILLE : la caverne de Shellmon
  // une immense salle ovale : lagune au fond (la coquille de Shellmon), allée dallée depuis l'escalier, colonnade en arc,
  // coupes de feu, deux Anubis géants au bord de la lagune ; sur le côté, Tai et Agumon prisonniers d'une cage de corail
  {
    const W = 46, H = 34, cx = 23, cy = 17, g = [];
    for (let y = 0; y < H; y++) { const r = []; for (let x = 0; x < W; x++) { const d = Math.hypot((x + 0.5 - cx) / 20, (y + 0.5 - cy) / 14) + (Hh(x, y, 77) - 0.5) * 0.12; r.push(d < 1 ? (Math.hypot((x + 0.5 - cx) / 10, (y + 0.5 - 8) / 3.6) < 1 ? '~' : '.') : '#'); } g.push(r); }
    for (let y = 28; y < H; y++) for (let x = 21; x < 25; x++) g[y][x] = y >= 31 ? '^' : '.';
    // l'allée dallée, de l'escalier jusqu'au bord de la lagune, et la terrasse devant Shellmon
    for (let y = 12; y <= 30; y++) for (let x = 20; x <= 25; x++) if (g[y][x] === '.') g[y][x] = 'z';
    for (let y = 12; y <= 15; y++) for (let x = 15; x <= 31; x++) if (g[y][x] === '.' && Math.hypot((x - 23) / 9, (y - 12) / 3.5) < 1) g[y][x] = 'z';
    const objects = [], O = (n, x, y, o = {}) => { if (g[y] && g[y][x] !== '#' && g[y][x] !== '~') objects.push({ kind: n.startsWith('tex_') ? n : G(n), v: 0, x, y, w: 1, h: 1, ...o }); };
    // colonnade en arc autour de la salle
    for (let k = 0; k < 10; k++) { const a = Math.PI * (0.15 + k * 0.077) + Math.PI, x = Math.round(cx + Math.cos(a) * 15), y = Math.round(cy + 3 + Math.sin(a) * -9); if (Math.abs(x - 22.5) > 4) O(k % 2 ? 'pilier_lotus' : 'pilier_peint', x, y); }
    for (const [x, y] of [[8, 12], [37, 12], [7, 22], [38, 22], [19, 29], [26, 29]]) O('coupe_feu', x, y);
    // au bord de la lagune : deux Anubis géants ; au fond, derrière l'eau, l'autel du soleil
    O('anubis_geant', 12, 10); O('anubis_geant', 34, 10); O('autel_soleil', 23, 3);
    // PRISON de Tai et Agumon : cage de corail (fond + grille au premier plan, côtés en roche), gardée par deux scarabées
    for (const [x, y] of [[32, 18], [32, 19], [32, 20], [37, 18], [37, 19], [37, 20], [33, 18], [34, 18], [35, 18], [36, 18]]) g[y][x] = '#';
    objects.push({ kind: 'cageback', v: 0, x: 34, y: 18, w: 2, h: 1, walk: true, cage: true }, { kind: 'cagefront', v: 0, x: 33, y: 21, w: 4, h: 1, cage: true });
    O('statue_scarabee', 31, 21); O('statue_scarabee', 38, 21);
    // autres décors : sarcophages et niches contre la paroi, jarres, coquillages sur le sable (ils se traversent)
    for (const [x, y, n] of [[10, 9, 'niche_statue'], [36, 8, 'sarcophage_roche'], [6, 17, 'jarre'], [40, 16, 'canopes'], [14, 24, 'pilier_brise'], [30, 26, 'vasque'], [16, 7, 'banniere'], [30, 7, 'banniere']]) O(n, x, y);
    for (const [x, y] of [[18, 20], [27, 22], [11, 14], [30, 12], [16, 11]]) if (g[y][x] !== '#' && g[y][x] !== '~') objects.push({ kind: 'shellpile', v: (x + y) % 2, x, y, w: 1, h: 1, small: true, walk: true });
    MAPS.antre_shellmon = { ...CARTE, name: 'Antre de Shellmon — La grande coquille', paroi: 'chemin',
      dark: { d: 0.5, col: '#100a06' }, rows: g.map(r => r.join('')), objects, npcs: [], signs: {}, warps: [], doors: [],
      triggers: [{ x: 21, y: 31, w: 4, h: 1, run: async ow => { const C = MAPS.antre_crypte; await versCarte('antre_crypte', C.exitAt.x, C.exitAt.y, 'down')(ow); } }],
      entry: { x: 22, y: 29 },
    };
    MAPS.antre_shellmon.signs['23,3'] = "Un autel du soleil, à moitié englouti. Des coquillages sont incrustés dans la pierre, tout autour du disque d'or...";
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
    const s = st(), first = !s.flags.shellmon || (perso() && !(s.kids || {}).tai);   // (tant que Tai n'est pas délivré, c'est le vrai combat)
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Soigne-le d'abord."); return; }
    await say(first ? 'GRRRAAAH ! Personne ne touche à mes prisonniers !' : 'Encore toi ?! Cette fois, je vais t\'écraser !', 'Shellmon');
    if ((await DW.ask(first ? 'Affronter Shellmon ? (un Champion très puissant)' : 'Affronter Shellmon de nouveau ?')) !== 0) return;
    // premier combat : niveau 17, Tai et Greymon n'arrivent qu'à 35 % de ses PV (il faut tenir seul longtemps) ;
    // ensuite il suit ton niveau (de l'expérience à volonté)
    const top = Math.max(...s.party.map(m => m.level || 1));
    const lvl = first ? 17 : Math.min(60, Math.max(16, top + 1));
    const ally = first && perso() ? { at: 0.35, from: 'agumon', sp: 'greymon', lvl: 16, hero: 'tai', name: 'Tai', move: 'mega_flamme',
      join: "CRAC ! Le coquillage qui retenait Tai se fend ! « Agumon, on s'y met aussi ! »" } : null;
    const res = await ow.battle({ enemy: new DW.Digimon('shellmon', lvl), boss: true, canLose: true, ally, music: 'shellmon', intro: 'Shellmon déploie ses tentacules !' });
    if (res !== 'win') {
      await say(first ? 'Shellmon est bien trop fort... Entraîne-toi, digivolue, et reviens délivrer Tai !' : 'Shellmon retourne se tapir dans sa coquille...');
      // (partenaire à terre au fond de l'antre : on se réveille chez Jijimon ; le passage sous les cabines reste ouvert)
      await ow.bossDefeat(first ? "Hohoho... Des Bukamon t'ont trouvé sur la plage, à côté des cabines. Ce Shellmon est redoutable : prépare-toi bien, et emporte des RAM !" : null);
      return;
    }
    // (la prime de revanche : une fois par jour — avant, ~2 000 Bits à chaque combat, sans fin ; l'expérience reste à volonté)
    if (!first) {
      const d = s.daily = s.daily || {}, jour = DW.Time.day(), prime = d.shellRevanche !== jour;
      if (prime) { d.shellRevanche = jour; s.bits += 30 * lvl; }
      await say(`Shellmon s'enfonce dans le sable en grommelant.${prime ? ` (+${30 * lvl} Bits)` : ''}`); return;
    }
    s.flags.shellmon = true;
    if (perso()) {
      // la cinématique (comme l'introduction), puis retour dans la grande coquille, la cage ouverte
      DW.Crests.freeKid('tai');
      await DW.Game.push(new DW.ShellmonCinema());
      await ow.charger('antre_shellmon', 30, 23, 'right');
      // Tai et Agumon, sortis de la cage, viennent te parler (le temps de la scène : ensuite ils vivent chez toi)
      const free = [[32, 23], [33, 23], [32, 24], [33, 22]].filter(([x, y]) => !ow.solid(x, y)), kids = [];
      if (free[0]) kids.push({ hero: 'tai', x: free[0][0], y: free[0][1], face: 'left', talk: () => {} });
      if (free[1]) kids.push({ sp: 'agumon', x: free[1][0], y: free[1][1], face: 'left', talk: () => {} });
      ow.map.npcs.push(...kids);
      DW.Audio.play('village');
      await DW.fade(0, 0.8);
      await say("On a réussi ! Merci ! Sans toi, on y serait encore. Moi c'est Tai !", 'Tai');
      await say(`${s.name} ? Tu étais au camp, toi aussi ! Alors on est tous tombés sur l'île... Les autres doivent être quelque part.`, 'Tai');
      await say("Je peux venir chez toi ? Agumon et moi, on n'a nulle part où aller. Et dès que tu entends parler de Matt ou des autres, préviens-moi !", 'Tai');
      DW.Audio.sfx('fanfare');
      await say('Tai et Agumon sont délivrés ! Ils s\'installent dans une chambre de ta maison.');
      // (la carte d'Agumon pour l'album du chapitre 1, si tu ne l'as pas déjà ; Shellmon et Greymon : plus bas)
      if (DW.Cards && DW.Cards.give('agumon')) await say("Tai te donne une carte d'Agumon pour ton album ! (Album)");
      for (const k of kids) ow.map.npcs.splice(ow.map.npcs.indexOf(k), 1);
    }
    DW.Trophies.give('shellmon'); DW.Audio.sfx('fanfare'); if (DW.Cards) { DW.Cards.give('shellmon'); DW.Cards.give('greymon'); }
    await say('Tu reçois le Trophée de Shellmon ! (Il rejoint la cave de ta maison.)');
    const extra = DW.giveItem('soin_m', 3) + DW.giveItem('pm_m', 2); s.bits += 800;
    await say(`Dans la coquille vide, tu trouves 3 RAM PV+, 2 RAM PM+ et 800 Bits !${DW.extraMsg(extra)}`);
    await say('(Shellmon reviendra hanter son antre : tu pourras l\'y affronter de nouveau pour t\'entraîner.)');
    // retour en ville : la fin du chapitre se raconte chez Jijimon
    await DW.fade(1, 0.8);
    await ow.charger('maison', 12, 5, 'down');
    await DW.wait(0.3);
    await DW.fade(0, 0.8);
    DW.autosave();
    await DW.Chapter.end1();
  }

  DW.Antre = { booth, fight, hole, allumer, ouverte, WORDS, ORDER };
})();
