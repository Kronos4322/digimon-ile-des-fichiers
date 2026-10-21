'use strict';
// =====================================================================
//  SOUS LE MONT MIHARASHI — la grotte de Sora (chapitre 3) : cinq cercles qui descendent, chacun plus terrible
//  (Digimon World 1 : le Tunnel Foreur des Drimogemon, son gros rocher, le lac souterrain et la Grotte de Lave où le feu
//  de Meramon chauffe tout ; Dante : des cercles qui s'enfoncent, corniches autour d'un abîme, tombeaux en flammes,
//  fleuve de feu, désert sous une pluie de braises). Trois styles mêlés : la montagne, le désert égyptien, le volcan.
//  1) GALERIE DES FOREURS : les tunnels des Drimogemon, éboulis, premières chauves-souris ; un gros rocher qu'il faut
//     un Champion pour pousser ;
//  2) CORNICHES DE L'ABÎME : deux corniches en cercle autour d'un gouffre de lave, d'où surgissent les chauves-souris ;
//  3) NÉCROPOLE ENSEVELIE : une nécropole égyptienne sous le sable, ses tombeaux crachent le feu sur l'allée ;
//  4) FLEUVE DE FEU : un fleuve de lave, une chaussée de cendres et ses bulles de lave, un désert sous une pluie de braises ;
//  5) CŒUR DU VOLCAN : le lac souterrain, source de la fontaine des Yokomon, qui bout. Sora est prisonnière sur un îlot :
//     un Drimogemon possédé par un Engrenage Noir garde le pont. Vaincu, il ouvre l'échelle des foreurs (retour rapide).
//  L'entrée : la grotte au pied du Mont Miharashi (maps/miharashi.js, m.grotte). Les dangers : game/perils.js (éboulis,
//  chauves-souris, braises, tombeaux) et game/lave.js (bulles de lave, coulées, fumerolles, rochers magmatiques).
//  L'histoire (Biyomon à la fontaine, Sora au fond) : game/chapitre3.js.
// =====================================================================
(function () {
  const MAPS = DW.MAPS;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const Hh = (x, y, s) => DW.Art.hash(x, y, s);
  const V = n => 'tex_volcan_' + n, D = n => 'tex_desert_' + n, G = n => 'tex_grotte_' + n, C = n => 'tex_commun_' + n;
  const SV = i => 'sous_volcan' + i;
  const ch3 = () => (st().flags.chapter || 1) >= 3;
  const perso = () => st().hero === 'perso';
  // Sora attend encore au fond (pas de vieille sauvegarde où elle est déjà venue, ni Meramon déjà calmé)
  const soraAuFond = s => perso() && !s.flags.soraMet && !s.flags.meramon && !(s.kids || {}).sora;
  // (base commune des cinq cercles : sombres, très dangereux ; leurs images de grotte et de désert attendues au chargement)
  const CARTE = { bg: 'foret', ambient: 'forest', climate: 'volcano', region: 'miharashi', indoor: true, solCommun: true, dress: false, perils: true,
    dossiers: ['grotte', 'desert'], rate: 0.1, wildN: 12, aggro: 0.95, sight: 8 };
  const vide = () => ({ npcs: [], signs: {}, warps: [], doors: [] });   // (chaque carte a les siens)

  // plan d'une carte : roche partout, puis on creuse cavernes et couloirs ; on y verse la lave ; les passages (et une marge)
  // restent libres de tout décor
  function Plan(W, H) {
    const g = Array.from({ length: H }, () => Array(W).fill('#')), objs = [], pris = new Set(), garde = new Set();
    const dans = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2;
    const le = (pts, r, f) => {   // (chaque case à moins de r d'une suite de points : f(x, y, distance))
      for (let k = 0; k + 1 < pts.length; k++) {
        const [a, b] = [pts[k], pts[k + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
        for (let i = 0; i <= n; i++) {
          const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
          for (let yy = Math.floor(y - r - 2); yy <= Math.ceil(y + r + 2); yy++) for (let xx = Math.floor(x - r - 2); xx <= Math.ceil(x + r + 2); xx++) f(xx, yy, Math.hypot(xx - x, yy - y));
        }
      }
    };
    const P = {
      W, H, g, objs,
      at: (x, y) => (g[y] && g[y][x]) || '#',
      sol: (x, y) => dans(x, y) && !DW.SOLID.has(g[y][x]),
      set(x, y, c) { if (dans(x, y)) g[y][x] = c; },
      // caverne : ellipse au bord irrégulier
      caverne(cx, cy, rx, ry, seed, c = '.') {
        for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) if (Math.hypot((x - cx) / rx, (y - cy) / ry) < 1 + (Hh(x, y, seed) - 0.5) * 0.24) P.set(x, y, c);
      },
      // couloir (r : demi-largeur) : creuse la roche ; sa bande reste sans décor
      couloir(pts, r, c = '.') { le(pts, r, (x, y, d) => { if (d <= r && P.at(x, y) === '#') P.set(x, y, c); if (d <= r + 1) garde.add(x + ',' + y); }); },
      // chaussée : un passage gagné sur la lave et la roche (cendres refroidies)
      chaussee(pts, r, c = 'ţ') { le(pts, r, (x, y, d) => { if (d <= r && (P.at(x, y) === '#' || P.at(x, y) === 'ȴ')) P.set(x, y, c); if (d <= r + 0.6) garde.add(x + ',' + y); }); },
      // lac ou fosse de lave (roche : creuse aussi la roche), bordé de cendres ; jamais sur un passage
      lave(cx, cy, rx, ry, seed, roche = false) {
        for (let y = Math.floor(cy - ry * 1.4 - 1); y <= cy + ry * 1.4 + 1; y++) for (let x = Math.floor(cx - rx * 1.4 - 1); x <= cx + rx * 1.4 + 1; x++) {
          const e = Math.hypot((x - cx) / rx, (y - cy) / ry) + (Hh(x, y, seed) - 0.5) * 0.2, k = x + ',' + y;
          if (garde.has(k)) continue;
          if (e < 1 && (roche || P.at(x, y) !== '#')) P.set(x, y, 'ȴ'); else if (e < 1.3 && P.sol(x, y) && P.at(x, y) !== 'ȴ') P.set(x, y, 'ţ');
        }
      },
      // rivière de lave le long d'une suite de points (r : demi-largeur, qui ondule) ; ses rives en cendres
      riviere(pts, r, seed) {
        le(pts, r, (x, y, d) => { const rr = r * (0.85 + 0.3 * Hh(x, y, seed)), k = x + ',' + y; if (garde.has(k)) return; if (d <= rr) P.set(x, y, 'ȴ'); else if (d <= rr + 1.2 && P.sol(x, y) && P.at(x, y) !== 'ȴ') P.set(x, y, 'ţ'); });
      },
      // taches d'un autre sol (rocaille, cendres, sable, herbes où guettent les sauvages) dans un rayon
      tache(cx, cy, r, c, seed, sur = '.') { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (P.at(x, y) === sur && Math.hypot(x - cx, y - cy) < r && DW.Art.fbm(x * 0.3, y * 0.3, seed) > 0.45) P.set(x, y, c); },
      reserve(x, y) { garde.add(x + ',' + y); },
      libre: (x, y) => P.sol(x, y) && !pris.has(x + ',' + y) && !garde.has(x + ',' + y),
      // pose un décor dont le pied est la case (x, y) ; il bloque sa case (sauf walk)
      pose(n, x, y, o = {}) { if (!P.libre(x, y)) return false; objs.push({ kind: n, v: 0, x, y, w: 1, h: 1, ...o }); pris.add(x + ',' + y); return true; },
      // contre la paroi du fond (la roche juste au-dessus) : les décors adossés
      contreMur: (x, y) => P.sol(x, y) && P.at(x, y - 1) === '#',
      fond(x0, y0, x1, y1) { const L = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (P.contreMur(x, y)) { L.push([x, y]); break; } return L; },
      // décors adossés à la paroi du fond d'une caverne (centre cx, cy ; rayons rx, ry) : environ un sur « pas »
      habiller(cx, cy, rx, ry, pal, pas, seed, o = { small: true }) {
        for (const [x, y] of P.fond(Math.floor(cx - rx), Math.floor(cy - ry - 2), Math.ceil(cx + rx), cy)) if (Hh(x, y, seed) < 1 / pas) P.pose(pal[Math.floor(Hh(y, x, seed + 1) * pal.length)], x, y, o);
      },
      // décors semés au sol d'un rectangle, jamais collés les uns aux autres ni sur un passage
      semer(x0, y0, x1, y1, pal, dens, seed, o = { small: true }) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          if (Hh(x, y, seed) > dens || !P.libre(x, y)) continue;
          let pres = false; for (let dy = -1; dy <= 1 && !pres; dy++) for (let dx = -1; dx <= 1; dx++) if (pris.has((x + dx) + ',' + (y + dy))) { pres = true; break; }
          if (!pres) P.pose(pal[Math.floor(Hh(y, x, seed + 1) * pal.length)], x, y, o);
        }
      },
      // l'escalier du bas (on remonte au cercle d'avant) ; on arrive juste au-dessus
      escalier(x) { for (let y = H - 5; y < H - 2; y++) for (let xx = x - 1; xx <= x + 1; xx++) P.set(xx, y, y >= H - 4 ? '^' : '.'); for (let y = H - 8; y < H - 2; y++) for (let xx = x - 2; xx <= x + 2; xx++) garde.add(xx + ',' + y); },
    };
    return P;
  }
  // le passage vers le cercle suivant, contre la paroi du fond : on passe en son milieu, ses deux côtés bloquent
  const passage = (P, n, x, y) => { P.objs.push({ kind: n, v: 0, x, y, w: 1, h: 1, walk: true, block: [[-1, 0], [1, 0]] }); for (const dx of [-1, 0, 1]) P.reserve(x + dx, y); P.reserve(x, y + 1); };
  const versCarte = (id, x, y, dir) => async ow => { DW.Audio.sfx('swoosh'); await DW.fade(1, 0.3); await ow.charger(id, x, y, dir); await DW.fade(0, 0.3); };
  const descendre = id => async ow => { const N = MAPS[id]; await versCarte(id, N.entry.x, N.entry.y, 'up')(ow); };
  const remonter = id => async ow => { const N = MAPS[id]; await versCarte(id, N.exitAt.x, N.exitAt.y, 'down')(ow); };
  // coffres (une carte de l'album au fond de chacun) ; un coffre de grotte ou de désert à la place du coffre du jeu
  function coffres(id, places, cartes, loots, image = G('coffre')) {
    places.forEach(([x, y], i) => {
      const k = `${id}_coffre${i}`;
      DW.Palais.treasure(id, k, null, loots[i % loots.length], x, y);
      const o = MAPS[id].objects.find(o => o.kind === 'chest' && o.x === x && o.y === y); if (o) o.kind = image;
      const sign = MAPS[id].signs[`${x},${y}`], sp = cartes[i % cartes.length];
      MAPS[id].signs[`${x},${y}`] = async ow => { const had = (st().chests || {})[k]; await sign(ow); if (!had && DW.Cards && DW.Cards.give(sp)) await say(`Au fond du coffre, une carte de ${DW.SPECIES[sp].name} ! (Album)`); };
    });
  }
  // objets qui suivent l'histoire : le gros rocher (poussé une fois pour toutes), l'échelle des foreurs (après le gardien)
  const suivre = M => function () {
    const f = st().flags, base = this._base || (this._base = this.objects.slice());
    const L = base.filter(o => !(o.rocher && f.svRocher) && !(o.echelle && !f.svGardien));
    if (L.length !== this.objects.length) { this.objects = L; if (this.gfx) DW.World.unprepare(this); }
    if (M) M.call(this);
  };

  // ------------------------------------------------------------ L'ENTRÉE : la grotte au pied du Mont Miharashi
  // (posée par maps/miharashi.js au pied d'une haute paroi, près de l'arrivée ; jusqu'au chapitre 3, trop noire)
  async function entrer(ow) {
    const f = st().flags;
    if (!ch3() && !DW.essaiLibre) { await say("Une grotte s'ouvre au pied de la paroi... Un souffle chaud et humide monte des profondeurs : ce sont les souterrains de l'île. Il fait bien trop noir pour s'y aventurer, pour l'instant."); return; }
    await say(soraAuFond(st()) ? "Une grotte s'ouvre au pied de la paroi. Un souffle brûlant monte des profondeurs... Dans la poussière, des traces de petites chaussures s'enfoncent dans le noir : Sora est passée par là !"
      : f.svGardien ? "La grotte des souterrains. Les Drimogemon y ont repris leur travail ; on entend leurs foreuses tout au fond."
        : "Une grotte s'ouvre au pied de la paroi. Un souffle brûlant monte des profondeurs : les souterrains du Mont Miharashi.");
    if ((await DW.ask('Descendre dans les souterrains ? (très dangereux)')) !== 0) return;
    await descendre(SV(1))(ow);
  }
  const grotte = m => { if (m.grotte) { const [x, y] = m.grotte; m.signs[x + ',' + y] = m.signs[(x + 1) + ',' + y] = ow => entrer(ow); } };
  const mont0 = DW.Mih.mont;
  DW.Mih.mont = (g, m) => { const R = mont0(g, m); grotte(m); return R; };
  if (MAPS.miharashi4 && MAPS.miharashi4.rows) grotte(MAPS.miharashi4);   // (déjà construite : on la rebranche)
  // (la case devant la grotte, sur le Mont Miharashi : c'est là qu'on ressort)
  const dehors = async ow => { const M4 = DW.getMap('miharashi4'), [x, y] = M4.grotte || [M4.w - 12, (M4.h >> 1)]; await versCarte('miharashi4', x, y + 1, 'down')(ow); };

  // ------------------------------------------------------------ 1) GALERIE DES FOREURS : la montagne
  // A le campement des Drimogemon (en bas, l'escalier qui remonte au pied du mont) → B la grande galerie (éboulis) →
  // E la galerie haute → F la salle du passage vers les corniches (en haut). À l'est, D le chantier des foreurs (une
  // boucle qui rejoint F) ; à l'ouest, G la salle du gros rocher, qui ferme la galerie du trésor (T).
  {
    const W = 64, H = 48, P = Plan(W, H);
    const A = [32, 38], B = [27, 26], D0 = [50, 27], E0 = [36, 14], F = [50, 9], G0 = [13, 31], T = [11, 13];
    P.caverne(A[0], A[1], 9, 4.5, 201); P.caverne(B[0], B[1], 11, 5, 202); P.caverne(D0[0], D0[1], 8, 6, 203); P.caverne(E0[0], E0[1], 10, 4.5, 204);
    P.caverne(F[0], F[1], 7, 4, 205); P.caverne(G0[0], G0[1], 6, 4.5, 206); P.caverne(T[0], T[1], 6, 4, 207);
    // les tunnels creusés par les Drimogemon (terre battue) : le chemin principal, la boucle du chantier, la galerie du rocher
    const principal = [[32, 44], [32, 41], A, [30, 32], B, [33, 20], E0, [44, 11], F];
    P.couloir(principal, 1.8, 'ǥ'); P.couloir([B, [40, 27], D0], 1.6, 'ǥ'); P.couloir([D0, [55, 18], F], 1.4, 'ǥ');
    P.couloir([A, [20, 35], G0], 1.5, 'ǥ'); P.couloir([G0, [13, 24], [12, 19], T], 1.1, 'ǥ');
    P.escalier(32);
    P.tache(B[0] - 4, B[1] + 1, 6, ',', 211); P.tache(D0[0] + 1, D0[1] + 2, 5, ',', 212); P.tache(E0[0] - 2, E0[1], 5, ',', 213);   // (graviers où guettent les sauvages)
    P.tache(G0[0], G0[1], 4, 'ǥ', 214); P.tache(T[0], T[1], 4, 'ǥ', 215);
    // une faille de lave dans le chantier : la chaleur monte déjà
    P.lave(D0[0] + 4, D0[1] + 3, 2.2, 1.3, 216);
    // le passage vers les corniches, au fond de F
    const [px, py] = P.fond(F[0], F[1] - 6, F[0], F[1])[0] || [F[0], F[1] - 4];
    passage(P, G('entree'), px, py);
    for (const dx of [-3, 3]) P.pose(G('torche_plantee'), px + dx, py + 1, { small: true });
    // LE GROS ROCHER (Digimon World 1 : seul un Champion peut le pousser) en travers de la galerie du trésor
    const ry = 23, rx0 = [10, 11, 12, 13, 14, 15].filter(x => P.sol(x, ry));
    if (rx0.length) P.objs.push({ kind: C('mont_gros_rocher'), v: 0, x: rx0[0], y: ry, w: rx0.length, h: 1, rocher: true });
    for (const x of rx0) P.reserve(x, ry);
    // le campement : tente, feu, provisions ; des torches le long du chemin
    for (const [x, y, n] of [[A[0] - 6, A[1] - 3, D('tente')], [A[0] - 2, A[1] + 1, D('foyer')], [A[0] + 5, A[1] - 3, D('caisses')], [A[0] + 7, A[1] - 2, D('tonneaux')], [A[0] + 7, A[1] + 1, D('sacs')],
      [A[0] - 7, A[1] + 1, D('jarres')], [36, 32, D('panneau_danger')], [29, 41, G('torche_plantee')], [35, 41, G('torche_plantee')], [26, 30, G('torche_trepied')], [38, 19, G('torche_trepied')]]) P.pose(n, x, y);
    // décors adossés aux parois : la montagne (rochers, aiguilles, éboulis), le matériel des foreurs, des cristaux qui luisent
    const roche = [C('mont_rocher'), C('mont_aiguille'), C('mont_eboulis'), C('mont_gros_rocher'), C('mont_eboulis_gros'), G('stalagmites'), C('mont_rocher_mousse')];
    P.habiller(B[0], B[1], 11, 5, [...roche, D('echelle'), G('cristaux')], 2.2, 221); P.habiller(D0[0], D0[1], 8, 6, [D('epave_machine'), D('caisses_numeriques'), D('echelle'), D('balise'), ...roche], 1.8, 222);
    P.habiller(E0[0], E0[1], 10, 4.5, [...roche, G('cristaux_violets')], 2.2, 223); P.habiller(F[0], F[1], 7, 4, [C('mont_aiguille'), G('stalagmites'), D('balise')], 2.4, 224);
    P.habiller(G0[0], G0[1], 6, 4.5, roche, 2, 225); P.habiller(T[0], T[1], 6, 4, [G('cristaux'), G('colonne_cristaux'), C('mont_cairn')], 1.6, 226);
    P.semer(4, 4, 60, 44, [...roche, D('squelette'), D('cailloux'), G('rochers')], 0.025, 227);
    P.semer(42, 21, 58, 33, [D('barrage'), D('blocs'), D('eboulis')], 0.06, 228);
    const M = MAPS[SV(1)] = { ...CARTE, name: 'Sous le Mont Miharashi — Galerie des Foreurs', music: 'cave', theme: 'cave', textures: 'volcan', paroi: 'falaise_basalte',
      solsNiveau: { herbe: [['mont_gravier', 'grotte:sol_roche']], rocaille: [['mont_terre_seche', 'mont_gravier']] }, dark: { d: 0.58, col: '#14100c' },
      encounters: [{ sp: 'gotsumon', min: 26, max: 28, w: 40 }, { sp: 'candlemon', min: 26, max: 28, w: 30 }, { sp: 'numemon', min: 25, max: 27, w: 15 }, { sp: 'drimogemon', min: 25, max: 27, w: 15 }],
      eboulis: { zones: [[22, 15, 42, 24], [42, 20, 58, 34]], tous: [2.2, 4], pierre: C('mont_eboulis_gros'), gravats: C('mont_eboulis') },
      chauvesSouris: { nids: [[6, 8], [60, 20], [40, 4], [18, 44], [60, 40]], tous: [15, 24] },
      rows: P.g.map(r => r.join('')), objects: P.objs, ...vide(),
      triggers: [{ x: 31, y: 45, w: 3, h: 1, run: dehors }, { x: px, y: py, w: 1, h: 1, run: descendre(SV(2)) }],
      entry: { x: 32, y: 42 }, exitAt: { x: px, y: py + 1 } };
    if (P.pose(D('panneau_pierre'), 35, 42)) M.signs['35,42'] = "Gravé dans la pierre, de la main d'un Drimogemon : « GALERIE DES FOREURS. Attention : la voûte s'écroule, les chauves-souris mordent, et plus bas... tout brûle. »";
    for (const x of rx0) M.signs[`${x},${ry}`] = ow => rocher(ow);
    coffres(SV(1), [P.fond(T[0] - 5, T[1] - 5, T[0] + 1, T[1])[0] || [T[0] - 3, T[1] - 2]], ['gotsumon'], [[['puce_atk', 1], ['soin_m', 2]]]);
    // l'échelle des foreurs (après le gardien) : elle descend droit au cœur du volcan
    const [lx, ly] = P.fond(A[0] + 2, A[1] - 6, A[0] + 6, A[1])[0] || [A[0] + 4, A[1] - 3];
    M.objects.push({ kind: D('echelle'), v: 0, x: lx, y: ly, w: 1, h: 1, echelle: true });
    M.signs[`${lx},${ly}`] = ow => echelle(ow, SV(5));
    M.echelleAt = [lx, ly];
    // un Drimogemon foreur, près de la tente : il raconte
    M.npcs.push({ sp: 'drimogemon', x: A[0] - 3, y: A[1] - 1, face: 'right', talk: () => foreur() });
    M.onEnter = async ow => {
      const f = st().flags; if (f.svDescente) return;
      f.svDescente = true; ow.cine = true;
      await say("Les souterrains du Mont Miharashi... Des tunnels creusés à coups de foreuse s'enfoncent sous la montagne. Il y fait une chaleur d'étuve.");
      await say('Au loin, la voûte gronde, des pierres roulent... et des cris aigus résonnent dans le noir. Des chauves-souris !');
      ow.cine = false;
    };
    M.populate = suivre();
  }

  // ------------------------------------------------------------ 2) CORNICHES DE L'ABÎME : deux cercles autour d'un gouffre
  // Au centre, un gouffre de lave ; autour, deux corniches en anneau, séparées par une muraille. On arrive en bas sur la
  // corniche extérieure : à gauche, elle s'est effondrée ; on en fait le tour par l'est jusqu'en haut, où des marches
  // descendent sur la corniche intérieure ; on en refait le tour par l'ouest (à l'est, elle est coupée) jusqu'en bas,
  // où un étroit pont de pierre mène au pilier du milieu : sa bouche noire descend au cercle suivant.
  {
    const W = 64, H = 56, P = Plan(W, H), cx = 32, cy = 27, ax = 11, ay = 7.4;
    const ang = (x, y) => Math.atan2((y - cy) / ay, (x - cx) / ax);
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      const e = Math.hypot((x - cx) / ax, (y - cy) / ay) + (Hh(x, y, 301) - 0.5) * 0.08;
      if (e < 1) P.set(x, y, 'ȴ');                                                  // le gouffre
      else if (e < 1.34) P.set(x, y, e < 1.1 ? 'ţ' : '.');                          // la corniche intérieure (cendres au bord)
      else if (e >= 1.58 && e < 2.1) P.set(x, y, e < 1.68 || e > 2.0 ? 'ţ' : '.');    // la corniche extérieure
    }
    // le pilier du milieu, dans la lave, et son pont de pierre (au sud)
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 5; x <= cx + 5; x++) if (Math.hypot((x - cx) / 3.2, (y - cy) / 2.4) < 1) P.set(x, y, '.');
    for (let y = cy + 2; y <= cy + 9; y++) if (P.at(cx, y) === 'ȴ') P.set(cx, y, '_');
    // l'arrivée : un couloir qui monte du bas jusqu'à la corniche extérieure
    P.couloir([[cx, H - 4], [cx, 39]], 1.5);
    P.escalier(cx);
    // (le couloir d'arrivée ne débouche que sur la corniche extérieure : au sud, entre les deux corniches, la roche ; on
    //  doit faire le tour par les marches du nord)
    for (let y = cy + 1; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const e = Math.hypot((x - cx) / ax, (y - cy) / ay); if (e >= 1.36 && e < 1.56) P.set(x, y, '#'); }
    // l'effondrement de la corniche extérieure (à gauche de l'arrivée) et celui de la corniche intérieure (à l'est)
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      const a = ang(x, y), e = Math.hypot((x - cx) / ax, (y - cy) / ay);
      if (e > 1.5 && e < 2.2 && Math.abs(a - 1.86) < 0.09) P.set(x, y, '#');
      if (e > 0.98 && e < 1.4 && Math.abs(a + 0.5) < 0.1) P.set(x, y, 'ȴ');
      // les marches entre les deux corniches, en haut
      if (e >= 1.3 && e < 1.62 && Math.abs(a + Math.PI / 2) < 0.1) P.set(x, y, '^');
    }
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (P.at(x, y) === '^') for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) P.reserve(x + dx, y + dy);
    for (let y = cy - 4; y <= cy + 10; y++) for (let x = cx - 1; x <= cx + 1; x++) P.reserve(x, y);
    // la bouche du pilier : on y entre par le sud, depuis le pont
    passage(P, G('entree'), cx, cy - 1);
    // bulles de lave et fumerolles sur les corniches, rochers magmatiques contre les parois
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      const e = Math.hypot((x - cx) / ax, (y - cy) / ay), c = P.at(x, y);
      if (c !== '.' && c !== 'ţ') continue;
      if (e > 2.0 && Hh(x, y, 311) < 0.05) P.set(x, y, 'ë');
      else if (e > 1.95 && Hh(x, y, 312) < 0.035) P.set(x, y, 'ì');
    }
    // décors de la paroi extérieure : pics de basalte, rochers de magma, plantes de feu, la vieille ligne tombée jusqu'ici
    const pal = [V('pic_1'), V('pic_2'), V('pic_3'), V('rocher_magma'), V('cone_lave'), C('mont_aiguille'), D('poteau_tombe'), D('poteau_casse'), D('squelette'), D('poteau_eclate')];
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
      const e = Math.hypot((x - cx) / ax, (y - cy) / ay), a = Math.abs(Math.cos(ang(x, y)));
      if (e > 1.98 && e < 2.12 && a > 0.45 && Hh(x, y, 321) < 0.3) P.pose(pal[Math.floor(Hh(y, x, 322) * pal.length)], x, y, { small: true });
      else if (e > 1.1 && Hh(x, y, 323) < 0.03) P.pose(V('plante_feu_' + (1 + Math.floor(Hh(x, y, 324) * 3))), x, y, { walk: true });   // (plantes de feu : on marche dessus)
    }
    for (const [x, y] of [[cx - 3, cy + 1], [cx + 3, cy + 1]]) P.pose(G('coupe_feu'), x, y);
    // des torches plantées le long de la corniche extérieure (on y voit où l'on met les pieds)
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2 + 0.2, x = Math.round(cx + Math.cos(a) * ax * 2.0), y = Math.round(cy + Math.sin(a) * ay * 2.0);
      if (!P.pose(G('torche_plantee'), x, y, { small: true })) P.pose(G('torche_plantee'), x + Math.sign(cx - x), y + Math.sign(cy - y), { small: true });
    }
    const M = MAPS[SV(2)] = { ...CARTE, name: "Sous le Mont Miharashi — Corniches de l'Abîme", music: 'cave', theme: 'lavacave', textures: 'volcan', paroi: 'falaise_basalte',
      solsNiveau: { herbe: [['grotte:sol_roche', 'volcan:sol_cendres']], rocaille: [['desert:terre_noire', 'mont_gravier']] }, dark: { d: 0.52, col: '#1a0806' },
      encounters: [{ sp: 'candlemon', min: 27, max: 29, w: 30 }, { sp: 'flarizamon', min: 26, max: 28, w: 20 }, { sp: 'gotsumon', min: 27, max: 29, w: 25 }, { sp: 'guilmon', min: 27, max: 29, w: 25 }],
      eboulis: { zones: [[40, 10, 58, 44], [16, 8, 48, 18], [8, 16, 24, 40]], tous: [2, 3.6], pierre: C('mont_eboulis_gros'), gravats: C('mont_eboulis') },
      chauvesSouris: { nids: [[cx - 7, cy], [cx + 7, cy], [cx, cy - 5], [cx - 4, cy + 4], [cx + 4, cy + 4]], tous: [6, 11] },
      rows: P.g.map(r => r.join('')), objects: P.objs, ...vide(),
      triggers: [{ x: cx - 1, y: H - 3, w: 3, h: 1, run: remonter(SV(1)) }, { x: cx, y: cy - 1, w: 1, h: 1, run: descendre(SV(3)) }],
      entry: { x: cx, y: H - 6 }, exitAt: { x: cx, y: cy } };
    // L'ÉRUPTION (game/perils.js) : à la première arrivée, Biyomon prévient ; quinze secondes pour quitter les corniches
    // (en courant, le grand tour se fait juste à temps ; rebrousser chemin, c'est plus sûr), sinon la lave déborde du
    // gouffre sur la corniche intérieure et dégringole de la paroi sur la corniche extérieure. Jamais sur les marches,
    // le pont ni le couloir d'arrivée.
    {
      const coulees = [], sol = (x, y) => { const c = M.rows[y] && M.rows[y][x]; return c === '.' || c === 'ţ'; };
      const rayon = (a, e0, e1) => {
        const L = [], pas = (e1 - e0) / 14;
        for (let i = 0; i <= 14; i++) { const e = e0 + pas * i, x = Math.round(cx + Math.cos(a) * ax * e), y = Math.round(cy + Math.sin(a) * ay * e); if (sol(x, y) && !L.some(([u, v]) => u === x && v === y)) L.push([x, y]); }
        return L;
      };
      const loin = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
      for (let k = 0; k < 14; k++) {
        const a = k / 14 * Math.PI * 2 + 0.11, b = a + Math.PI / 14;
        if (loin(a, -Math.PI / 2) > 0.2 && loin(a, Math.PI / 2) > 0.16) coulees.push(rayon(a, 1.0, 1.34));   // (du gouffre vers la paroi intérieure)
        if (loin(b, -Math.PI / 2) > 0.2 && loin(b, Math.PI / 2) > 0.2) coulees.push(rayon(b, 2.1, 1.58));    // (de la paroi vers le vide)
      }
      M.eruption = { secondes: 15, coulees: coulees.filter(L => L.length >= 3),
        message: "Bip ! Bip ! Ton Digivice capte un message de Biyomon : « La montagne tremble de plus en plus fort... Le volcan va entrer en éruption ! Tu as quinze secondes pour quitter les corniches. Cours ! »" };
    }
    // la corniche intérieure coupée à l'est : un coffre attend au bout, pour qui fait le mauvais tour
    let bout = null;
    for (let y = 2; y < H - 2 && !bout; y++) for (let x = W - 3; x > cx; x--) { const a = ang(x, y), e = Math.hypot((x - cx) / ax, (y - cy) / ay); if (e > 1.12 && e < 1.3 && a > -0.85 && a < -0.66 && P.sol(x, y)) { bout = [x, y]; break; } }
    if (bout) coffres(SV(2), [bout], ['candlemon'], [[['soin_g', 1], ['pm_m', 2]]]);
    // au bord de l'effondrement (à gauche de l'arrivée) : un tas de gravats et ce qu'on en comprend
    let ex = cx; const ey = Math.round(cy + ay * 1.8); while (ex > 3 && P.sol(ex - 1, ey) && P.at(ex - 1, ey) !== '^') ex--;
    M.objects.push({ kind: C('mont_eboulis_gros'), v: 0, x: ex, y: ey, w: 1, h: 1 });
    M.signs[`${ex},${ey}`] = "La corniche s'est effondrée dans le gouffre. Impossible de passer : il faut faire le tour par l'autre côté.";
    M.signs[`${cx},${cy + 2}`] = "Le pont de pierre file au-dessus de la lave jusqu'au pilier du milieu, percé d'une bouche noire. Un air brûlant en monte... chargé de sable ?";
  }

  // ------------------------------------------------------------ 3) NÉCROPOLE ENSEVELIE : le désert égyptien
  // Une grande allée dallée monte de l'escalier (en bas) jusqu'à la salle du seuil (en haut) et sa porte. Le long de
  // l'allée, des tombeaux crachent tour à tour une langue de feu en travers. À l'ouest, la salle des Anubis (dunes,
  // ruines, un coffre) ; à l'est, le champ des fosses, où les blocs de la voûte s'écroulent (le tombeau du pharaon).
  {
    const W = 64, H = 48, P = Plan(W, H), X0 = 29, X1 = 35;
    const R1 = [26, 39, 38, 42], R3 = [5, 13, 21, 35], R4 = [43, 13, 59, 35], R5 = [22, 5, 42, 10];
    for (const [x0, y0, x1, y1] of [R1, R3, R4, R5]) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) P.set(x, y, '.');
    for (let y = 10; y <= 39; y++) for (let x = X0; x <= X1; x++) P.set(x, y, 'z');                 // l'allée
    for (let y = 10; y <= 39; y++) for (const x of [X0 - 1, X1 + 1]) P.set(x, y, '.');                // (ses bas-côtés, où se dressent les tombeaux)
    P.couloir([[22, 24], [27, 24]], 1.2, 'z'); P.couloir([[37, 20], [42, 20]], 1.2, 'z');             // les portes des salles latérales
    P.escalier(32);
    // le sable entré par les fissures : dunes et sables où guettent les sauvages
    P.tache(13, 20, 6, 's', 331); P.tache(10, 30, 5, ',', 332); P.tache(18, 30, 4, 's', 333); P.tache(50, 17, 5, ',', 334); P.tache(54, 28, 6, 's', 335); P.tache(47, 31, 4, ',', 336);
    for (const [x0, y0, x1, y1] of [R1, R5]) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (P.at(x, y) === '.' && Hh(x, y, 337) < 0.25) P.set(x, y, 's');
    for (let y = 10; y <= 39; y++) for (let x = X0; x <= X1; x++) P.reserve(x, y);
    // LES TOMBEAUX DE FEU : un sur deux à l'ouest, un sur deux à l'est ; chacun crache sur toute la largeur de l'allée
    const flammes = [];
    [12, 17, 22, 27, 32, 37].forEach((y, i) => {
      const ouest = i % 2 === 0, x = ouest ? X0 - 1 : X1 + 1;
      P.objs.push({ kind: G(i % 3 === 1 ? 'sarcophage_roche' : 'sarcophage'), v: 0, x, y, w: 1, h: 1, flip: !ouest });
      flammes.push({ x, y, dx: ouest ? 1 : -1, dy: 0, n: X1 - X0 + 1, tous: [2.6, 5.2] });
    });
    // entre eux : statues d'Anubis, braseros, colonnes et obélisques du désert, sur les bas-côtés
    [10, 14, 19, 24, 29, 34].forEach((y, i) => { for (const x of [X0 - 1, X1 + 1]) if (!P.objs.some(o => o.x === x && o.y === y)) P.pose([G('anubis'), G('brasero_anubis'), D('colonne'), D('obelisque'), G('pilier_lotus'), D('colonne_brisee')][(i + (x > 32 ? 3 : 0)) % 6], x, y); });
    // SALLE DU SEUIL : la porte du cercle suivant, deux Anubis géants, des obélisques bleus
    const [px, py] = P.fond(32, R5[1], 32, R5[3])[0] || [32, R5[1]];
    passage(P, G('porte_grotte'), px, py);
    for (const [x, y, n] of [[px - 5, py + 2, G('anubis_geant')], [px + 5, py + 2, G('anubis_geant')], [24, 4, G('obelisque_bleu')], [40, 4, G('obelisque_bleu')], [26, 8, G('brasero')], [38, 8, G('brasero')]]) P.pose(n, x, y);
    // SALLE DES ANUBIS (ouest) : ruines du désert dans les dunes, jarres, vases canopes, statues
    for (const [x, y, n] of [[7, 15, D('colonne')], [12, 14, D('mur_oeil')], [17, 15, D('niche_statue')], [6, 22, D('stele_gravee')], [8, 27, D('colonne_tombee')], [16, 25, G('statue_scarabee')],
      [7, 33, G('canopes')], [11, 34, G('jarre')], [15, 33, G('vase')], [19, 18, D('obelisque')], [20, 31, D('pilier_vasque')], [13, 29, D('jarres')]]) P.pose(n, x, y);
    // LE CHAMP DES FOSSES (est) : des fosses dans le sable, des ruines, le tombeau du pharaon au fond
    for (const [x, y, n] of [[46, 16, D('fosse')], [52, 21, D('fosse')], [47, 27, D('fosse')], [56, 31, D('fosse')], [44, 33, D('arche_ruine')], [58, 15, D('dolmen')], [50, 33, D('colonne_brisee')],
      [57, 24, D('pilier_vasque')], [45, 22, D('stele_orbe')], [53, 14, G('tombeau')], [49, 14, D('porte_ankh')]]) P.pose(n, x, y);
    // parois du fond : fresques, niches, torches (salles latérales et vestibule)
    const murs = [G('fresque'), G('mur_hieroglyphes'), G('niche'), G('mur_scarabee'), G('mur_peint'), G('alcove_sarcophage')];
    const facade = (R, seed) => { let k = Math.floor(Hh(R[0], R[1], seed) * murs.length); for (const [x, y] of P.fond(R[0], R[1], R[2], R[3])) { if ((x - R[0]) % 3) continue; P.pose((x - R[0]) / 3 % 2 ? G('torche_murale') : murs[k++ % murs.length], x, y, { small: true }); } };
    facade(R3, 341); facade(R4, 342); facade(R1, 343);
    const M = MAPS[SV(3)] = { ...CARTE, name: 'Sous le Mont Miharashi — Nécropole Ensevelie', music: 'cave', bg: 'desert', theme: 'sandtemple', textures: 'grotte', paroi: 'dalles_fissurees',
      dark: { d: 0.6, col: '#140a04' },
      encounters: [{ sp: 'bakemon', min: 27, max: 29, w: 35 }, { sp: 'numemon', min: 27, max: 29, w: 20 }, { sp: 'gotsumon', min: 28, max: 30, w: 20 }, { sp: 'candlemon', min: 28, max: 30, w: 25 }],
      flammes, eboulis: { zones: [[R4[0], R4[1], R4[2], R4[3]], [R3[0], R3[1] + 4, R3[2], R3[3]]], tous: [2.4, 4.2], pierre: D('blocs'), gravats: D('eboulis') },
      chauvesSouris: { nids: [[8, 10], [56, 10], [12, 38], [54, 38]], tous: [16, 26] },
      rows: P.g.map(r => r.join('')), objects: P.objs, ...vide(),
      triggers: [{ x: 31, y: 45, w: 3, h: 1, run: remonter(SV(2)) }, { x: px, y: py, w: 1, h: 1, run: descendre(SV(4)) }],
      entry: { x: 32, y: 42 }, exitAt: { x: px, y: py + 1 } };
    if (P.pose(G('stele_lumineuse'), 36, 41)) M.signs['36,41'] = "Une stèle couverte de hiéroglyphes, qui luit faiblement : « Ici reposent ceux qui ont voulu voler le feu de la montagne. Que leurs tombeaux brûlent pour l'éternité. »";
    coffres(SV(3), [[9, 18], [55, 18]], ['bakemon', 'numemon'], [[['x_bandage', 1], ['cartes', 2]], [['disque_def', 1], ['reveil', 1]]], D('coffre'));
  }

  // ------------------------------------------------------------ 4) FLEUVE DE FEU : le volcan
  // Un fleuve de lave coupe la carte d'ouest en est. Au sud (l'arrivée), la rive des coulées : la lave des parois
  // descend de temps en temps jusqu'au fleuve, en travers du chemin. Au milieu, une étroite chaussée de cendres traverse
  // le fleuve entre des bulles de lave ; à l'ouest, un vieux pont de corde dont le milieu est tombé. Au nord, le désert
  // de braises (une pluie de feu) jusqu'à la bouche du cercle suivant, en haut à droite.
  {
    const W = 64, H = 48, P = Plan(W, H);
    P.caverne(32, 36, 27, 7, 401); P.caverne(30, 11, 27, 8, 402); P.caverne(32, 23, 28, 6, 403);
    P.escalier(32);
    // le fleuve, puis la chaussée (après lui : elle le traverse) et l'îlot du trésor, à l'est
    P.riviere([[1, 21], [12, 24], [24, 21], [36, 24], [48, 21], [62, 23]], 2.7, 411);
    const route = [[32, 31], [31, 27], [33, 24], [31, 21], [32, 17]];
    P.chaussee(route, 1.4);
    P.chaussee([[52, 29], [51, 25]], 0.7); for (let y = 21; y <= 24; y++) for (let x = 49; x <= 53; x++) if (Math.hypot((x - 51) / 2.4, (y - 22.5) / 1.6) < 1) P.set(x, y, 'ţ');
    // le pont de corde, côté ouest : il part de la rive sud... et s'arrête au milieu de la lave
    for (let y = 24; y <= 27; y++) if (P.at(12, y) === 'ȴ' && y >= 25) P.set(12, y, '_');
    // le désert de braises (sable brûlant) au nord ; des cendres sur la rive sud
    for (let y = 2; y < 17; y++) for (let x = 2; x < W - 2; x++) if (P.at(x, y) === '.' && DW.Art.fbm(x * 0.12, y * 0.12, 412) > 0.38) P.set(x, y, 'ǥ');
    P.tache(18, 36, 6, 'ţ', 413); P.tache(46, 37, 6, 'ţ', 414); P.tache(10, 9, 5, ',', 415); P.tache(44, 12, 5, ',', 416); P.tache(24, 34, 4, ',', 417);
    // les bouches de lave des parois (au sud), d'où partent les coulées
    P.lave(7, 36, 2.6, 1.8, 418, true); P.lave(57, 37, 2.6, 1.8, 419, true);
    // la bouche du cercle suivant, contre la paroi du fond, en haut à droite
    const [px, py] = P.fond(50, 2, 50, 10)[0] || [50, 4];
    passage(P, G('entree'), px, py);
    for (const dx of [-3, 3]) P.pose(G('torche_plantee'), px + dx, py + 1, { small: true });
    for (let y = 30; y <= 33; y++) for (let x = 31; x <= 33; x++) P.reserve(x, y);
    // BULLES DE LAVE au bord de la chaussée (elles gonflent, rougeoient, puis éclatent : ça brûle tout autour — game/lave.js) ;
    // il reste toujours de quoi passer à côté, au bon moment
    for (const [x, y] of [[33, 27], [30, 23], [33, 20]]) if (P.at(x, y) === 'ţ') P.objs.push({ kind: 'bouledelave', v: 0, x, y, w: 1, h: 1, walk: true });
    // fumerolles et rochers magmatiques sur la rive sud, loin du chemin
    for (let y = 29; y < 44; y++) for (let x = 3; x < W - 3; x++) {
      const c = P.at(x, y); if (c !== '.' && c !== 'ţ') continue;
      if (Math.abs(x - 32) < 4 || !P.libre(x, y)) continue;
      if (Hh(x, y, 421) < 0.03) P.set(x, y, 'ë'); else if (Hh(x, y, 422) < 0.025) P.set(x, y, 'ì');
    }
    // décors : la rive des coulées (cônes, pics, rochers de magma), le désert de braises (os, arbres morts, poteaux brisés)
    P.semer(4, 28, 60, 43, [V('cone_lave'), V('pic_1'), V('pic_2'), V('rocher_magma'), V('fumerolle'), D('squelette'), C('mont_aiguille')], 0.035, 431);
    P.semer(4, 3, 60, 16, [D('squelette'), D('arbre_mort'), D('poteau_brise'), D('poteau_tombe'), D('virevoltant'), D('herbes_seches'), D('rocher_pointu'), V('rocher_magma')], 0.03, 432);
    P.semer(4, 28, 60, 43, [V('plante_feu_1'), V('plante_feu_2'), V('plante_feu_3')], 0.025, 433, { walk: true });
    for (const [x, y, n] of [[12, 28, D('pont_casse')], [30, 32, D('panneau_danger')], [35, 15, D('panneau_fleches')], [51, 22, D('squelette')]]) P.pose(n, x, y);
    // les coulées : de la bouche de lave de la paroi jusqu'au fleuve, en travers de la rive sud
    const coulee = pts => { const L = []; for (let k = 0; k + 1 < pts.length; k++) { const [a, b] = [pts[k], pts[k + 1]], n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); for (let i = 0; i < n; i++) L.push([Math.round(a[0] + (b[0] - a[0]) * i / n), Math.round(a[1] + (b[1] - a[1]) * i / n)]); } return L.filter(([x, y]) => P.sol(x, y) && P.at(x, y) !== '_'); };
    const M = MAPS[SV(4)] = { ...CARTE, name: 'Sous le Mont Miharashi — Fleuve de Feu', music: 'volcano', theme: 'lavacave', textures: 'volcan', paroi: 'paroi_cratere',
      solsNiveau: { herbe: [['desert:terre_noire', 'volcan:sol_cendres']], rocaille: [['desert:terre_orange', 'desert:sable_ondule']] }, dark: { d: 0.5, col: '#2a0a04' },
      encounters: [{ sp: 'flarizamon', min: 28, max: 30, w: 30 }, { sp: 'candlemon', min: 29, max: 31, w: 25 }, { sp: 'guilmon', min: 29, max: 31, w: 25 }, { sp: 'meramon', min: 28, max: 30, w: 10, ch: 4 }],
      braises: { zones: [[3, 3, 60, 17]], tous: [0.7, 1.4] }, eboulis: { zones: [[3, 30, 22, 43]], tous: [3, 5], pierre: V('rocher_magma'), gravats: C('mont_eboulis') },
      chauvesSouris: { nids: [[6, 22], [24, 21], [44, 22], [58, 22]], tous: [8, 14] },
      coulees: [coulee([[9, 35], [14, 33], [17, 29], [18, 26]]), coulee([[55, 36], [50, 33], [47, 29], [45, 26]]), coulee([[55, 38], [47, 40], [40, 37], [35, 33], [33, 28]])].filter(L => L.length > 4),
      rows: P.g.map(r => r.join('')), objects: P.objs, ...vide(),
      triggers: [{ x: 31, y: 45, w: 3, h: 1, run: remonter(SV(3)) }, { x: px, y: py, w: 1, h: 1, run: descendre(SV(5)) }],
      entry: { x: 32, y: 42 }, exitAt: { x: px, y: py + 1 } };
    M.signs['12,28'] = "Un vieux pont de corde... Son milieu est tombé dans la lave depuis longtemps. Il faudra trouver un autre passage.";
    M.signs['30,32'] = "Un panneau de danger, à moitié fondu : « CHAUSSÉE — attendre que les bulles éclatent avant de passer ! »";
    M.signs['35,15'] = "Une flèche gravée : « Plus bas : la source. » Quelqu'un a dessiné un petit oiseau à côté.";
    coffres(SV(4), [[52, 22]], ['flarizamon'], [[['soin_g', 1], ['super_viande', 1]]]);
  }

  // ------------------------------------------------------------ 5) CŒUR DU VOLCAN : la source qui bout
  // Une immense caverne autour du lac souterrain (la source de la fontaine des Yokomon) qui bout sous la chaleur de
  // Meramon ; deux rivières de lave s'y jettent dans des gerbes de vapeur. Au milieu du lac, l'îlot où Sora est
  // prisonnière ; un étroit pont de pierre y mène, gardé par un Drimogemon possédé.
  {
    const W = 64, H = 48, P = Plan(W, H), cx = 32;
    P.caverne(cx, 23, 27, 16, 501);
    P.escalier(cx);
    P.couloir([[cx, 44], [cx, 37]], 1.4);
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      const e = Math.hypot((x - cx) / 16, (y - 20) / 9) + (Hh(x, y, 502) - 0.5) * 0.1;
      if (e < 1 && P.at(x, y) === '.') P.set(x, y, '~'); else if (e < 1.16 && P.at(x, y) === '.') P.set(x, y, 'ţ');
    }
    for (let y = 11; y <= 18; y++) for (let x = cx - 5; x <= cx + 5; x++) if (Math.hypot((x - cx) / 4.2, (y - 14.5) / 2.6) < 1) P.set(x, y, '.');   // l'îlot
    // le pont de pierre, de l'îlot à la rive sud : de l'eau de part et d'autre (on n'y monte que par sa tête, où veille le gardien)
    for (let y = 18; y <= 29; y++) { P.set(cx, y, '_'); for (const dx of [-1, 1]) P.set(cx + dx, y, '~'); }
    for (const dx of [-1, 0, 1]) P.set(cx + dx, 30, 'ţ');
    P.riviere([[61, 12], [54, 14], [48, 18]], 1.6, 511); P.riviere([[2, 27], [10, 25], [17, 23]], 1.6, 512);
    for (let y = 29; y <= 37; y++) for (let x = cx - 2; x <= cx + 2; x++) P.reserve(x, y);
    for (let y = 11; y <= 18; y++) for (let x = cx - 5; x <= cx + 5; x++) P.reserve(x, y);
    // fumerolles sur la rive, rochers magmatiques contre les parois
    for (let y = 26; y < 41; y++) for (let x = 4; x < W - 4; x++) { if (!P.libre(x, y) || P.at(x, y) !== 'ţ') continue; if (Hh(x, y, 521) < 0.06) P.set(x, y, 'ì'); }
    const roche = [V('pic_1'), V('pic_2'), V('pic_3'), V('rocher_magma'), C('mont_aiguille'), G('stalagmites'), G('cristaux'), V('cone_lave')];
    P.habiller(cx, 23, 27, 16, roche, 2.6, 531);
    P.semer(5, 26, 59, 40, [...roche, D('squelette'), G('rochers')], 0.03, 532);
    // sur l'îlot : le petit campement de Sora (un feu éteint, son sac) et le coffre des foreurs ; des braseros à la tête du
    // pont et sur l'îlot (on voit le gardien, et Sora, de loin)
    for (const [x, y, n] of [[cx - 3, 15, D('foyer')], [cx + 3, 13, D('sacs')], [cx - 2, 31, G('brasero')], [cx + 2, 31, G('brasero')], [cx - 2, 13, G('torche_plantee')]]) P.objs.push({ kind: n, v: 0, x, y, w: 1, h: 1 });
    const M = MAPS[SV(5)] = { ...CARTE, name: 'Sous le Mont Miharashi — Cœur du Volcan', music: 'volcano', theme: 'cave', textures: 'volcan', paroi: 'paroi_cratere',
      solsNiveau: { herbe: [['grotte:sol_roche', 'desert:terre_noire']], rocaille: [['desert:terre_noire', 'volcan:sol_cendres']] }, dark: { d: 0.55, col: '#1a0a08' }, vapeur: true,
      encounters: [{ sp: 'monochromon', min: 29, max: 31, w: 25 }, { sp: 'flarizamon', min: 29, max: 31, w: 30 }, { sp: 'gotsumon', min: 30, max: 32, w: 25 }, { sp: 'birdramon', min: 29, max: 31, w: 10, ch: 4 }],
      eboulis: { zones: [[6, 30, 24, 40], [40, 30, 58, 40]], tous: [2.6, 4.4], pierre: C('mont_eboulis_gros'), gravats: C('mont_eboulis') },
      chauvesSouris: { nids: [[10, 9], [54, 9], [cx, 6], [6, 34], [58, 34]], tous: [9, 15] },
      rows: P.g.map(r => r.join('')), objects: P.objs, ...vide(),
      triggers: [{ x: cx - 1, y: 45, w: 3, h: 1, run: remonter(SV(4)) }],
      entry: { x: cx, y: 42 }, exitAt: { x: cx, y: 31 } };
    coffres(SV(5), [[cx + 3, 15]], ['biyomon'], [[['aile_flamme', 1], ['soin_g', 1]]]);
    // l'échelle des foreurs (après le gardien), sur la rive, à l'ouest de l'arrivée : elle remonte droit à la Galerie
    const lx = cx - 5, ly = [36, 35, 37, 34].find(y => P.sol(lx, y) && !M.objects.some(o => o.x === lx && o.y === y)) || 36;
    M.objects.push({ kind: D('echelle'), v: 0, x: lx, y: ly, w: 1, h: 1, echelle: true });
    M.signs[`${lx},${ly}`] = ow => echelle(ow, SV(1));
    M.echelleAt = [lx, ly];
    M.npcs.push(
      // le gardien possédé, à la tête du pont
      { sp: 'drimogemon', x: cx, y: 30, face: 'down', gear: true, cond: s => !s.flags.svGardien, talk: ow => gardien(ow) },
      { sp: 'drimogemon', x: cx - 4, y: 31, face: 'right', cond: s => !!s.flags.svGardien, talk: () => say(st().flags.meramon ? "La source a refroidi ! L'eau remonte de nouveau jusqu'au village des Yokomon. Merci, humain !" : "Le lac bout toujours... C'est le feu de Meramon, là-haut. Tant qu'il brûle, la source ne refroidira pas.", 'Drimogemon') },
      // Sora, prisonnière de l'îlot
      { hero: 'sora', x: cx, y: 14, face: 'down', cond: soraAuFond, talk: () => say("Ce Drimogemon garde le pont et ne laisse passer personne... Fais attention, il est très fort !", 'Sora') },
    );
    M.populate = suivre(function () { this.vapeur = !st().flags.meramon; });   // (Meramon calmé : la source ne bout plus)
    M.onEnter = async ow => {
      const s = st(); if (!soraAuFond(s) || s.flags.svGardien || ow.map._vuSora) return;
      ow.map._vuSora = true; ow.cine = true;
      await say("Une immense caverne... Au milieu, un lac fume et bouillonne. Sur un îlot, une fille au chapeau bleu te fait de grands signes !");
      await say('Hé ! Par ici ! Attention au Drimogemon, sur le pont !', 'Sora');
      ow.cine = false;
    };
  }

  // ------------------------------------------------------------ les foreurs, le rocher, l'échelle, le gardien
  async function foreur() {
    const f = st().flags;
    if (f.svGardien) { await say("Mon frère va mieux ! Il garde de nouveau la source, mais en gentil, cette fois. Et notre échelle est à vous !", 'Drimogemon'); return; }
    await say("Ho, un humain ! Ici, c'est la Galerie des Foreurs. Nous, les Drimogemon, on creuse la montagne depuis toujours.", 'Drimogemon');
    await say("Mais depuis que le Mont Miharashi est en colère, tout s'écroule, les chauves-souris sont devenues folles et, plus bas... tout brûle.", 'Drimogemon');
    await say("Mon frère gardait la source, tout au fond. Une chose noire lui est tombée dessus : il ne reconnaît plus personne et ne laisse plus passer qui que ce soit !", 'Drimogemon');
    if (soraAuFond(st())) await say("Une fille au chapeau bleu est descendue il y a deux jours, avec un oiseau rose. L'oiseau est remonté tout seul... La fille, elle, n'est jamais revenue.", 'Drimogemon');
    await say("Si tu descends : regarde les ombres au sol, écoute les cris, et méfie-toi des tombeaux qui rougeoient. Et emporte des RAM !", 'Drimogemon');
  }
  async function rocher(ow) {
    const f = st().flags, m = ow.partner, M = MAPS[SV(1)];
    if (f.svRocher) return;
    await say("Un énorme rocher bouche la galerie. Derrière, on devine un reflet doré...");
    const stade = m && DW.SPECIES[m.sp].stage;
    if (!['Champion', 'Ultime', 'Méga'].includes(stade)) { await say(`${m ? m.name : 'Ton partenaire'} pousse de toutes ses forces... Le rocher ne bouge pas d'un pouce. Il faudrait un Digimon Champion pour le déplacer.`); return; }
    if ((await DW.ask(`Demander à ${m.name} de pousser le rocher ?`)) !== 0) return;
    DW.Audio.sfx('roar'); ow.shake = 1;
    await say(`${m.name} prend son élan... et pousse ! Le rocher roule dans un grondement et libère la galerie !`);
    f.svRocher = true; M.populate(); if (ow.map === M) ow.gfx = DW.World.prepare(M);
    DW.autosave();
  }
  async function echelle(ow, vers) {
    if (!st().flags.svGardien) return;
    const [x, y] = MAPS[vers].echelleAt;
    if ((await DW.ask(vers === SV(5) ? "L'échelle des foreurs descend tout droit jusqu'au cœur du volcan. Descendre ?" : "L'échelle des foreurs remonte tout droit jusqu'à la Galerie des Foreurs. Grimper ?")) !== 0) return;
    await versCarte(vers, x, y + 1, 'down')(ow);
  }
  async function gardien(ow) {
    const s = st();
    ow.shake = 0.6; DW.Audio.sfx('roar');
    await say('GRRR... LA SOURCE EST À MOI ! PERSONNE NE PASSE !', 'Drimogemon');
    await say("Dans son dos, un Engrenage Noir tourne en crissant... Il a perdu la tête, comme Meramon !");
    if (soraAuFond(s)) await say('De l\'autre côté du pont, la fille au chapeau bleu crie : « Attention ! Il fore tout ce qui bouge ! »');
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Soigne-le d'abord."); return; }
    if ((await DW.ask('Affronter Drimogemon ? (un Champion de la terre, possédé par un Engrenage Noir)')) !== 0) return;
    const res = await ow.battle({ enemy: new DW.Digimon('drimogemon', 29), boss: true, canLose: true, music: 'boss', intro: 'Drimogemon fait tourner sa corne-foreuse !' });
    if (res !== 'win') {
      await say('La foreuse de Drimogemon est trop forte...');
      await ow.bossDefeat("Hohoho... Des Drimogemon t'ont remonté à la surface, tout couvert de suie. Leur frère possédé est coriace : entraîne-toi, et emporte des RAM avant d'y retourner !");
      return;
    }
    await delivrance(ow);
  }
  // le gardien vaincu : l'Engrenage se brise ; Sora traverse le pont et te rejoint ; l'échelle des foreurs s'ouvre
  async function delivrance(ow) {
    const s = st(), f = s.flags, sora = soraAuFond(s);
    f.svGardien = true;
    ow.shake = 1; DW.Audio.sfx('super');
    await say("L'Engrenage Noir jaillit du dos de Drimogemon... et se brise en éclats de données !");
    await say("Ouille, ma corne... Où suis-je ? La source ! Je la gardais... et je ne laissais plus passer personne. Pardon !", 'Drimogemon');
    if (DW.Cards) DW.Cards.give('drimogemon');
    if (sora) {
      // Sora traverse le pont et vient te parler (le temps de la scène : ensuite, elle remonte retrouver Biyomon)
      const P = ow.p, libres = [[1, 0], [-1, 0], [0, -1], [1, -1], [-1, -1]].map(([dx, dy]) => [P.x + dx, P.y + dy]).filter(([x, y]) => !ow.solid(x, y));
      const tmp = libres[0] ? { hero: 'sora', x: libres[0][0], y: libres[0][1], face: 'left', talk: () => {} } : null;
      if (tmp) ow.map.npcs.push(tmp);
      DW.Audio.play('village');
      await say("Tu as réussi ! J'ai bien cru que je ne sortirais jamais d'ici...", 'Sora');
      await say("Je m'appelle Sora. Toi aussi, tu es tombé sur cette île ? J'étais au camp d'été avec les autres... On a tous été séparés.", 'Sora');
      await say(`${s.name}... C'est joli.`, 'Sora');
      if ((s.kids || {}).tai) await say("Tai est chez toi ? Ça ne m'étonne pas qu'il ait foncé droit dans les ennuis... Je suis contente qu'il aille bien.", 'Sora');
      if ((s.kids || {}).matt) await say("Et Matt aussi ? Il doit être soulagé... même s'il ne le montrera jamais.", 'Sora');
      await say("Je suis descendue chercher la source qui remplissait la fontaine des Yokomon. La voilà : ce lac, sous la montagne... Mais il bout ! Le feu de Meramon chauffe toute la montagne.", 'Sora');
      await say("Biyomon a pu remonter chercher de l'aide ? Oh, ma Biyomon... Elle n'arrive pas encore à digivoluer. Mais avec toi, on peut calmer Meramon. Je viens avec toi !", 'Sora');
      f.soraMet = true;
      if (tmp) ow.map.npcs.splice(ow.map.npcs.indexOf(tmp), 1);
    }
    await say("Pour me faire pardonner : notre vieille échelle de foreurs remonte tout droit jusqu'à la Galerie. Prenez-la, c'est bien plus court !", 'Drimogemon');
    const extra = DW.giveItem('puce_def', 1); s.bits += 1000;
    await say(`Drimogemon te donne une Puce Défense trouvée en creusant, et 1000 Bits !${DW.extraMsg(extra)}`);
    MAPS[SV(5)].populate(); MAPS[SV(1)].populate();
    if (ow.map === MAPS[SV(5)]) ow.gfx = DW.World.prepare(MAPS[SV(5)]);
    if (sora) { DW.Audio.play(ow.map.music); await say("Sora file retrouver Biyomon au village. Elle t'attendra près de la fontaine, prête à monter au Mont Miharashi."); }
    DW.autosave();
  }

  DW.SousVolcan = { entrer, rocher, gardien, delivrance, echelle, soraAuFond, ID: SV };
})();
