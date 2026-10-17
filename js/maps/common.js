'use strict';
// =====================================================================
//  CARTES : outils communs (légende, constructeurs de grilles, soins, intro)
//  Légende complète : voir World.CH dans world.js
//  . herbe  , herbes hautes  = chemin  s sable  ; herbes des dunes  ~ eau
//  _ pont  C falaise  ^ escalier  # canopée  T arbre  b buisson  r/R rocher
//  p palmier  P cabine  S/Z/Q panneau  O source  L tronc  k souche
//  f fleurs  m champignons  v pelouse  : herbes pastel  o pavés  q fleurs pastel
//  c berceau  B cube-jouet  h arbre-bonbon  X éboulis
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const MAPS = DW.MAPS = {};

  // "T17 . = . T20" -> ligne (caractère + nombre de répétitions)
  const rle = s => s.trim().split(/\s+/).map(tok => tok[0].repeat(tok.length > 1 ? +tok.slice(1) : 1)).join('');
  // grille peinte par opérations (pratique pour placer beaucoup d'objets)
  const paint = (w, h, fill, fn) => {
    const g = Array.from({ length: h }, () => Array(w).fill(fill));
    const api = {
      get: (x, y) => g[y] && g[y][x],
      set: (x, y, ch) => { if (g[y] && x >= 0 && x < w) g[y][x] = ch; },
      rect: (x, y, ww, hh, ch) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) api.set(i, j, ch); },
      scatter: (ch, x, y, ww, hh, n, seed, on) => {
        for (let k = 0; k < n; k++) {
          const i = x + Math.floor(DW.Art.hash(k, 1, seed) * ww), j = y + Math.floor(DW.Art.hash(k, 2, seed) * hh);
          if (!on || on.includes(api.get(i, j))) api.set(i, j, ch);
        }
      },
    };
    fn(api);
    return g.map(r => r.join(''));
  };

  DW.getMap = id => {
    const m = MAPS[id];
    if (!m.rows && m.build) m.build(); // cartes générées à la demande (régions)
    // arrivées vers les cartes agrandies (écrites dans leur plan d'origine)
    for (const w of m.warps || []) DW.MapKit.zTarget(w);
    for (const d of m.doors || []) DW.MapKit.zTarget(d);
    if (!m.w) {
      m.w = Math.max(...m.rows.map(r => r.length));
      m.rows.forEach((r, i) => { if (r.length !== m.w) console.warn(`[carte ${id}] ligne ${i} : ${r.length} au lieu de ${m.w}`); });
      m.rows = m.rows.map(r => r.padEnd(m.w, '#'));
      m.h = m.rows.length;
    }
    densify(m);
    return m;
  };
  // décor dense façon Digimon World 2003 : des bouquets de fougères, herbes folles, fleurs, champignons
  // (sur l'herbe) et de coquillages (sur le sable). Tous praticables : rien ne change pour les déplacements.
  // On laisse libres les abords des passages, portes, panneaux et personnages. (m.dense = false : désactivé)
  function densify(m) {
    if (m._denseFor === m.rows || m.indoor || m.dense === false || !m.rows) return;   // (les cartes reconstruites, ex. la ville, sont refaites)
    const A = DW.Art, keep = new Set(), near = (x, y, r = 1) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) keep.add((x + dx) + ',' + (y + dy)); };
    for (const w of [...(m.warps || []), ...(m.doors || [])]) for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) near(x, y, 2);
    for (const k in m.signs || {}) { const [x, y] = k.split(',').map(Number); near(x, y); }
    for (const n of m.npcs || []) near(n.x, n.y);
    for (const t of m.triggers || []) for (let y = t.y; y < t.y + (t.h || 1); y++) for (let x = t.x; x < t.x + (t.w || 1); x++) near(x, y, 0);
    const forest = m.ambient === 'forest', town = m.ambient === 'town';
    const GRASS = forest ? 'nnjmf' : town ? 'ffjn' : 'fjnfj', seed = [...String(m.name || '')].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 3) & 255;
    const g = m.rows.map(r => [...r]);
    for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
      const ch = g[y][x];
      if ((ch !== '.' && ch !== 's') || keep.has(x + ',' + y)) continue;
      // pas sur un chemin : seulement entourée de la même matière
      if (g[y - 1][x] !== ch && g[y + 1][x] !== ch) continue;
      const cl = A.fbm(x * 0.18, y * 0.18, seed + 5), h = A.hash(x, y, seed + 6);
      if (cl < (town ? 0.6 : 0.52) || h > (town ? 0.35 : 0.55)) continue;
      g[y][x] = ch === 's' ? (h < 0.3 ? '3' : ch) : GRASS[Math.floor(A.hash(x, y, seed + 7) * GRASS.length)];
    }
    m.rows = m._denseFor = g.map(r => r.join(''));
  }

  // ------------------------------------------------------------ scripts partagés
  async function healAll(msg) {
    await DW.fade(0.7, 0.3, '#ffffff');
    DW.Audio.sfx('heal');
    // (soigner n'est pas dormir : l'heure du dernier sommeil ne change pas, sinon il n'avait plus jamais sommeil le soir)
    st().party.forEach(m => { m.heal(); m.sick = 0; m.hurt = 0; m.germs = Math.floor((m.germs || 0) / 2); });
    await DW.wait(1.0);
    await DW.fade(0, 0.3);
    if (msg) await say(msg);
  }

  // ------------------------------------------------------------ introduction
  // scénario d'ouverture : défini dans maps/village.js (réveil chez Jijimon)
  DW.Story = {};

  // ------------------------------------------------------------ générateur de forêt
  // o : { w, h, seed, paths:[{pts, r, dirt}], clearings:[{x,y,rx,ry}], rivers:[{pts, r}], lakes:[{x,y,rx,ry}],
  //       tall:[{x,y,r}], autoTall, deco (densité), bigtrees:[[x,y]], free:[[x,y,r]] (zones sans obstacle), set:[[x,y,ch]],
  //       landmarks:[[ch, nombre]] (repères propres à la zone, posés sur de l'herbe dégagée loin des chemins),
  //       avoid:[[x,y]] (cases à laisser libres : PNJ, objets à ramasser) }
  function forestGen(o) {
    const { w, h, seed } = o;
    const Hs = (x, y, k) => DW.Art.hash(x, y, seed * 31 + k);
    const Ns = (x, y, k) => DW.Art.noise(x, y, seed * 31 + k);
    const g = Array.from({ length: h }, () => Array(w).fill('#'));
    const segD = (px, py, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
      let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t);
    };
    const polyD = (px, py, pts) => { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, segD(px, py, pts[i], pts[i + 1])); return m; };
    const paths = o.paths || [];
    // distances aux chemins calculées une seule fois par case (mêmes valeurs qu'avant, beaucoup plus rapide)
    const PD = paths.map(p => { const a = new Float64Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a[y * w + x] = polyD(x, y, p.pts); return a; });
    const DMIN = new Float64Array(w * h).fill(1e9);
    for (const a of PD) for (let i = 0; i < a.length; i++) if (a[i] < DMIN[i]) DMIN[i] = a[i];
    const pathD = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? DMIN[y * w + x] : Math.min(1e9, ...paths.map(p => polyD(x, y, p.pts))));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = Ns(x * 0.3, y * 0.3, 1) - 0.5;
      if (paths.some((p, k) => PD[k][y * w + x] <= p.r + n * 1.3)) g[y][x] = '.';
      for (const c of o.clearings || []) if (Math.hypot((x - c.x) / c.rx, (y - c.y) / c.ry) < 1 + n * 0.35) g[y][x] = '.';
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = Ns(x * 0.25, y * 0.25, 2) - 0.5;
      for (const r of o.rivers || []) if (polyD(x, y, r.pts) <= r.r + n * 0.8) g[y][x] = '~';
      for (const l of o.lakes || []) if (Math.hypot((x - l.x) / l.rx, (y - l.y) / l.ry) < 1 + n * 0.3) g[y][x] = '~';
    }
    // chemins de terre et ponts
    paths.forEach((p, k) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (PD[k][y * w + x] < (o.dirtW || 0.62)) { if (g[y][x] === '~') g[y][x] = '_'; else if (p.dirt !== false) g[y][x] = '='; }
    } });
    // herbes hautes
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (g[y][x] !== '.') continue;
      const n = Ns(x * 0.3, y * 0.3, 3);
      const inBlob = (o.tall || []).some(t => Math.hypot(x - t.x, y - t.y) < t.r * (0.8 + n * 0.5));
      const auto = o.autoTall != null && Ns(x * 0.17, y * 0.17, 7) > o.autoTall && pathD(x, y) > 1.3;
      if (inBlob || auto) g[y][x] = ',';
    }
    const walk = ch => ch !== '#' && ch !== 'T';
    const near = (x, y, f) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
        if ((dx || dy) && g[y + dy] && g[y + dy][x + dx] !== undefined && f(g[y + dy][x + dx])) return true;
      return false;
    };
    // nénuphars
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '~' && Hs(x, y, 4) < 0.1 && !near(x, y, c => c === '_')) g[y][x] = 'w';
    // lisière d'arbres
    const fr = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '#' && near(x, y, walk)) fr.push([x, y]);
    fr.forEach(([x, y]) => { if (Hs(x, y, 5) < 0.9) g[y][x] = 'T'; });
    const fr2 = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '#' && near(x, y, c => c === 'T') && Hs(x, y, 6) < 0.3) fr2.push([x, y]);
    fr2.forEach(([x, y]) => (g[y][x] = 'T'));
    // décor
    const free = o.free || [];
    const isFree = (x, y) => free.some(([fx, fy, r]) => Math.hypot(x - fx, y - fy) <= r);
    const dens = o.deco != null ? o.deco : 1;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const ch = g[y][x];
      if (ch !== '.' && ch !== ',') continue;
      const r = Hs(x, y, 9) / dens, pd = pathD(x, y);
      if (ch === ',') { if (r < 0.05) g[y][x] = 'n'; continue; }
      if (r < 0.04) g[y][x] = 'f';
      else if (r < 0.065) g[y][x] = 'm';
      else if (r < 0.1 && near(x, y, c => c === 'T' || c === '#')) g[y][x] = 'n';
      else if (pd > 1.6 && !isFree(x, y) && !near(x, y, c => 'bMrkGLHY'.includes(c))) {
        if (r < 0.115) g[y][x] = 'b';
        else if (r < 0.125) g[y][x] = 'M';
        else if (r < 0.132) g[y][x] = 'k';
        else if (r < 0.14) g[y][x] = 'G';
        else if (r < 0.145) g[y][x] = 'H';
      }
    }
    // repères : case d'herbe entourée de cases praticables, loin des chemins et des autres repères
    const marks = [];
    for (const [ch, n] of o.landmarks || []) {
      const cand = [];
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
        if (!'.f,'.includes(g[y][x])) continue;
        let ok = pathD(x, y) > 1.4 && !isFree(x, y) && !(o.avoid || []).some(([ax, ay]) => Math.abs(ax - x) <= 1 && Math.abs(ay - y) <= 1);
        for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (!'.,fmn='.includes(g[y + dy][x + dx])) { ok = false; break; }
        if (ok) cand.push([Hs(x, y, 300 + ch.charCodeAt(0)), x, y]);
      }
      cand.sort((a, b) => a[0] - b[0]);
      let k = 0;
      for (const [, x, y] of cand) {
        if (k >= n) break;
        if (marks.some(([mx, my]) => Math.abs(mx - x) + Math.abs(my - y) < 4)) continue;
        g[y][x] = ch; marks.push([x, y]); k++;
      }
    }
    for (const [x, y] of o.bigtrees || []) { g[y][x] = 'Y'; if (g[y][x - 1] && g[y][x - 1] !== '~') g[y][x - 1] = 'g'; if (g[y][x + 1] !== undefined && g[y][x + 1] !== '~') g[y][x + 1] = 'g'; }
    for (const [x, y, ch] of o.set || []) g[y][x] = ch;
    return g.map(r => r.join(''));
  }

  // ------------------------------------------------------------ Digimon à recruter pour la ville
  // o : { sp, x, y, lvl, face, lines:[...], win, lose, cond(s), noBattle }
  function recruitNPC(o) {
    const name = DW.SPECIES[o.sp].name;
    return {
      sp: o.sp, x: o.x, y: o.y, face: o.face || 'left', recruit: true,
      hide: false,   // (règle du joueur : jamais de Digimon invisible ; ils attendent dans des coins reculés, mais on les voit)
      cond: s => !(s.recruits && s.recruits[o.sp]) && (!o.cond || o.cond(s)),
      talk: async ow => {
        for (const l of o.lines) await say(l, name);
        if (!o.noBattle) {
          if (!st().party.some(m => m.hp > 0)) { await say('Reviens avec un Digimon en forme !', name); return; }
          const r = await DW.ask(`Relever le défi de ${name} ?`);
          if (r !== 0) { await say('Reviens quand tu seras prêt !', name); return; }
          // de plus en plus fort : +2 niveaux par Digimon déjà installé en ville, jamais en dessous de ton meilleur Digimon
          const nRec = DW.Town.RECRUITS.filter(r => DW.Town.has(r.id)).length, top = Math.max(1, ...st().party.map(m => m.level || 1));
          const lvl = Math.min(st().flags.kuwagamon ? o.lvl + 14 : 12, Math.max(o.lvl + 2 * nRec, top));   // chapitre 1 : jamais au-dessus de 12
          const res = await ow.battle({ enemy: new DW.Digimon(o.sp, lvl), boss: true, recruit: true, canLose: false, intro: `${name} veut tester ta force !` });
          if (res !== 'win') { await say(`(${name} était trop fort... Entraîne-toi et retourne le défier !)`); return; }
          st().party.forEach(m => m.heal());
        }
        await say(o.win, name);
        await DW.Town.recruit(o.sp);
      },
    };
  }

  // ------------------------------------------------------------ chemin de terre sinueux (cartes peintes avec paint)
  // pts : ligne brisée (en cases), r : demi-largeur ; bords irréguliers ; sur l'eau, le chemin devient un pont
  function trail(g, w, h, pts, r, ch = '=', seed = 1) {
    const segD = (x, y, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
      let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segD(x, y, pts[i], pts[i + 1]));
      if (d > r + (DW.Art.hash(x, y, 820 + seed) - 0.5) * 0.7) continue;
      const c = g.get(x, y);
      g.set(x, y, c === '~' || c === 'w' || c === '_' ? '_' : ch);
    }
  }

  // sol façon Digimon World 1 (voir gfx/terrain.js : map.lush) : verts naturels, terre beige-ocre
  const DW1_GROUND = { lush: true,
    grass: ['#2c5418', '#3b6a20', '#4c7f28', '#5f9432', '#76a83e', '#8fbb4e'],
    dirt: ['#6a5034', '#80643f', '#977a4c', '#ad905c', '#c2a670', '#d6bc86'] };

  // ------------------------------------------------------------ cartes agrandies (×2, échelle Digimon World)
  // Les cartes faites à la main sont écrites dans leur plan d'origine (dimensions ci-dessous) puis agrandies :
  // le sol, les chemins, l'eau et les lisières doublent ; les objets gardent leur taille (ils sont recentrés
  // dans leur nouvel emplacement) ; PNJ, panneaux, sorties et arrivées suivent. Une coordonnée d'arrivée
  // (tx, ty) vers une de ces cartes s'écrit elle aussi dans le plan d'origine : elle est convertie ici.
  const ZOOM = {
    clairiere: [2, 36, 30], sentier: [2, 44, 36], prairie: [2, 40, 30], geants: [2, 44, 36], lisiere: [2, 38, 32],
    plage: [2, 40, 36], crique: [2, 40, 30], village: [2, 40, 30], champs: [2, 40, 28], gym: [2, 32, 22], berceau: [2, 44, 32],
  };
  // une case du plan d'origine → case du plan agrandi (les bords restent collés aux bords)
  const zc = (Z, c, n) => (c <= 0 ? 0 : c >= n - 1 ? n * Z - 1 : Math.floor(c * Z));
  const zpt = (id, x, y) => { const [Z, w, h] = ZOOM[id]; return [zc(Z, x, w), zc(Z, y, h)]; };
  // rectangle (sortie, déclencheur) : il double, sauf l'épaisseur d'une sortie collée au bord
  const zspan = (Z, a, len, n) => {
    if (len === 1 && (a <= 0 || a >= n - 1)) return [a <= 0 ? 0 : n * Z - 1, 1];
    const lo = Math.floor(a * Z), hi = a + len >= n ? n * Z : (a + len) * Z;
    return [lo, hi - lo];
  };
  const zrect = (Z, r, w, h) => { const [x, ww] = zspan(Z, r.x, r.w || 1, w), [y, hh] = zspan(Z, r.y, r.h || 1, h); return { x, y, w: ww, h: hh }; };
  // objet de plusieurs cases : même taille, recentré dans son emplacement agrandi (collé au bord s'il l'était)
  const zobj = (Z, o, w, h) => ({
    x: o.x <= 0 ? 0 : o.x + o.w >= w ? w * Z - o.w : Z * o.x + Math.floor((Z - 1) * o.w / 2),
    y: o.y <= 0 ? 0 : o.y + o.h >= h ? h * Z - o.h : Z * o.y + Math.floor((Z - 1) * o.h / 2),
  });
  // sol sous un objet isolé (le reste de son bloc agrandi)
  const GROUND = { grass: '.', sand: 's', lawn: 'v', cobble: 'z', dirt: '=', water: '~', stone: 'o', wood: '1', pastel: 'v' };
  // objets qui forment des lisières, des haies ou des massifs : ils remplissent tout leur bloc
  const BLOCKY = 'TbrRpKhM|#5';
  // le sol est agrandi en « Scale2x » : les bords en escalier (étangs, lisières, chemins en biais) restent
  // arrondis au lieu de devenir de gros carrés ; les objets isolés sont reposés dans le coin de leur bloc
  function zoomRows(rows, Z) {
    const CH = DW.World.CH, h = rows.length, w = rows[0].length, H = h * Z, W = w * Z;
    const isSingle = ch => { const I = CH[ch] || CH['.']; return !!I.obj && !BLOCKY.includes(ch); };
    const base = rows.map(r => [...r].map(ch => (isSingle(ch) ? GROUND[(CH[ch] || CH['.']).t] || '.' : ch)));
    const at = (x, y, d) => (x < 0 || y < 0 || x >= w || y >= h ? d : base[y][x]);
    const g = Array.from({ length: H }, () => Array(W));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const P = base[y][x], A = at(x, y - 1, P), B = at(x + 1, y, P), C = at(x - 1, y, P), D = at(x, y + 1, P);
      const q = Z === 2 ? [
        C === A && C !== D && A !== B ? A : P, A === B && A !== C && B !== D ? B : P,
        D === C && D !== B && C !== A ? C : P, B === D && B !== A && D !== C ? D : P] : null;
      for (let dy = 0; dy < Z; dy++) for (let dx = 0; dx < Z; dx++) g[y * Z + dy][x * Z + dx] = q ? q[dy * 2 + dx] : P;
      if (isSingle(rows[y][x])) g[y * Z][x * Z] = rows[y][x];
    }
    return g.map(r => r.join(''));
  }
  // arrivée vers une carte agrandie : convertie une seule fois
  function zTarget(w) {
    if (!w || w._zt) return;
    w._zt = true;
    if (ZOOM[w.to] && w.tx != null) [w.tx, w.ty] = zpt(w.to, w.tx, w.ty);
  }
  // agrandit la carte id : rows (si opts.rows), objets, PNJ, panneaux, portes, places (à chaque construction),
  // sorties et déclencheurs (une seule fois)
  function zoomMap(m, id, opts = {}) {
    const [Z, w, h] = ZOOM[id];
    if (opts.rows !== false) m.rows = zoomRows(m.rows, Z);
    // objets : chacun recentré ; un objet posé sur un plus grand (œufs sur le nid) suit celui-ci
    const src = m.objects || [], moved = src.map(o => zobj(Z, { ...o, w: o.w || 1, h: o.h || 1 }, w, h));
    const inside = (o, x, y) => x >= o.x && x < o.x + (o.w || 1) && y >= o.y && y < o.y + (o.h || 1);
    const host = (x, y, skip) => { let best = -1; src.forEach((o, i) => { if (i !== skip && inside(o, x, y) && (best < 0 || o.w * o.h > src[best].w * src[best].h)) best = i; }); return best; };
    const shift = i => [moved[i].x - src[i].x, moved[i].y - src[i].y];
    m.objects = src.map((o, i) => {
      const k = host(o.x, o.y, i);
      if (k >= 0 && src[k].w * src[k].h > (o.w || 1) * (o.h || 1)) { const [dx, dy] = shift(k); return { ...o, x: o.x + dx, y: o.y + dy }; }
      return { ...o, ...moved[i] };
    });
    // un point (panneau, porte) posé sur un objet suit l'objet ; sinon il est agrandi
    const pt = (x, y) => { const k = host(x, y, -1); if (k >= 0) { const [dx, dy] = shift(k); return [x + dx, y + dy]; } return [zc(Z, x, w), zc(Z, y, h)]; };
    if (m.npcs) m.npcs = m.npcs.map(n => { const [x, y] = pt(n.x, n.y); return Object.assign(Object.create(Object.getPrototypeOf(n)), n, { x, y }); });
    if (m.signs) m.signs = Object.fromEntries(Object.entries(m.signs).map(([k, v]) => { const [x, y] = k.split(',').map(Number); return [pt(x, y).join(','), v]; }));
    if (m.doors) m.doors = m.doors.map(d => { const [x, y] = pt(d.x, d.y), o = { ...d, x, y }; delete o._zt; zTarget(o); return o; });
    for (const k of ['plazas', 'mosaic']) if (m[k]) m[k] = m[k].map(p => ({ ...p, x: p.x * Z, y: p.y * Z, ...(p.rx != null ? { rx: p.rx * Z, ry: p.ry * Z } : {}), ...(p.r != null ? { r: p.r * Z } : {}) }));
    if (!m._zs) {
      m._zs = true;
      m.warps = (m.warps || []).map(wp => { const o = { ...wp, ...zrect(Z, wp, w, h) }; zTarget(o); return o; });
      m.triggers = (m.triggers || []).map(t => ({ ...t, ...zrect(Z, t, w, h) }));
    }
    // dégagements : une lisière ou un buisson ne doit pas tomber sur un PNJ, ni sur une sortie et l'entrée de la carte
    const g = m.rows.map(r => [...r]), SOFT = '#TbrMkGLHng|f,mj';
    const clear = (x, y) => { if (g[y] && g[y][x] !== undefined && SOFT.includes(g[y][x])) g[y][x] = '.'; };
    for (const n of m.npcs || []) { clear(n.x, n.y); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) clear(n.x + dx, n.y + dy); }
    for (const wp of m.warps || []) {
      const [ix, iy] = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] }[wp.dir] || [0, 0];
      for (let y = wp.y; y < wp.y + (wp.h || 1); y++) for (let x = wp.x; x < wp.x + (wp.w || 1); x++) for (let k = 0; k < 3; k++) clear(x + ix * k, y + iy * k);
    }
    m.rows = g.map(r => r.join(''));
    return m;
  }
  // options du générateur de forêt exprimées dans le plan d'origine → plan agrandi
  function zoomGen(o, Z = 2) {
    const P = ([x, y]) => [x * Z, y * Z];
    return { ...o, w: o.w * Z, h: o.h * Z, dirtW: 0.62 * Z,
      paths: (o.paths || []).map(p => ({ ...p, pts: p.pts.map(P), r: p.r * Z })),
      rivers: (o.rivers || []).map(p => ({ ...p, pts: p.pts.map(P), r: p.r * Z })),
      clearings: (o.clearings || []).map(c => ({ x: c.x * Z, y: c.y * Z, rx: c.rx * Z, ry: c.ry * Z })),
      lakes: (o.lakes || []).map(c => ({ x: c.x * Z, y: c.y * Z, rx: c.rx * Z, ry: c.ry * Z })),
      tall: (o.tall || []).map(t => ({ x: t.x * Z, y: t.y * Z, r: t.r * Z })),
      bigtrees: (o.bigtrees || []).map(P), avoid: (o.avoid || []).map(P),
      free: (o.free || []).map(([x, y, r]) => [x * Z, y * Z, r * Z]),
      set: (o.set || []).map(([x, y, ch]) => [x * Z, y * Z, ch]),
      landmarks: (o.landmarks || []).map(([ch, n]) => [ch, n * 2]),
    };
  }

  // ------------------------------------------------------------ pièces d'intérieur
  // '0' mur, '2' face du mur (2 rangées), '1' sol.
  // roomRows(w, h) : pièce fermée de h rangées au total (les sorties se percent ensuite : portes, escaliers, ouvertures)
  const roomRows = (w, h) => ['0'.repeat(w), '0' + '2'.repeat(w - 2) + '0', '0' + '2'.repeat(w - 2) + '0', ...Array.from({ length: h - 4 }, () => '0' + '1'.repeat(w - 2) + '0'), '0'.repeat(w)];
  // doorRoom(w, floorH) : 2 rangées de mur, floorH rangées de sol, porte de 2 cases au milieu du bas → { door, rows }
  const doorRoom = (w, floorH) => {
    const door = Math.floor(w / 2) - 1, line = a => '0' + a.repeat(w - 2) + '0';
    return { door, rows: ['0'.repeat(w), line('2'), line('2'), ...Array.from({ length: floorH }, () => line('1')), '0'.repeat(door) + '11' + '0'.repeat(w - door - 2)] };
  };

  // ------------------------------------------------------------ CÔTES : bords de l'île (mer + plage, ou falaise au-dessus de l'eau)
  // sides : { left|right|up|down: 'beach' | 'cliff' } (côtés sans passage) ; o : { seed, sea (largeur de mer), keep(x, y) : cases à garder }
  // Le trait de côte ondule (grande vague + petites anses) ; plage : sable, quelques palmiers et rochers dans l'eau ;
  // 'cliff' : côte rocheuse (dalles de roche, gros rochers, écueils), une bande d'herbe derrière pour longer la mer.
  function coast(rows, sides, o = {}) {
    const h = rows.length, w = rows[0].length, seed = o.seed || 1, g = rows.map(r => [...r]);
    const H = (x, y, k) => DW.Art.hash(x, y, seed * 17 + k), F = (t, k) => DW.Art.fbm(t, k, seed * 7 + 3);
    for (const side in sides) {
      const kind = sides[side], span = side === 'left' || side === 'right' ? h : w, sea = o.sea || Math.max(8, Math.round(Math.min(w, h) * 0.15));
      const shore = Array.from({ length: span }, (_, t) => sea + (F(t * 0.03, side.length) - 0.5) * 26 + (F(t * 0.11, 9 + side.length) - 0.5) * 8);   // caps et anses
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const [t, d] = { left: [y, x], right: [y, w - 1 - x], up: [x, y], down: [x, h - 1 - y] }[side];
        if (o.keep && o.keep(x, y)) continue;
        const D = shore[t], c = g[y][x];
        if (d < D) { g[y][x] = d > D - 2.5 && H(x, y, 1) < (kind === 'beach' ? 0.025 : 0.08) ? 'R' : '~'; continue; }   // la mer (rochers près du bord)
        if (c === '~' && d < D + 3) continue;
        if (kind === 'beach') {
          const sand = 4.5 + (F(t * 0.13, 21) - 0.3) * 3;
          if (d < D + sand) g[y][x] = H(x, y, 2) < 0.03 && d > D + 1.5 ? 'p' : 's';
          else if (d < D + sand + 3 && DW.SOLID.has(g[y][x]) && g[y][x] !== 'p') g[y][x] = H(x, y, 3) < 0.55 ? ';' : H(x, y, 4) < 0.2 ? 'p' : 's';   // la forêt s'arrête sur les dunes
        } else {
          const rk = 2.5 + (F(t * 0.17, 31) - 0.3) * 2.5;   // côte rocheuse : dalles de roche et gros rochers au ras de l'eau
          if (d < D + rk) g[y][x] = H(x, y, 6) < (d < D + 1.2 ? 0.34 : 0.14) ? 'r' : 's';
          else if (d < D + rk + 3 && DW.SOLID.has(c)) g[y][x] = H(x, y, 5) < 0.35 ? ',' : '.';   // rebord d'herbe en haut de la falaise
        }
      }
    }
    return g.map(r => r.join(''));
  }

  DW.MapKit = { say, st, rle, paint, coast, healAll, forestGen, recruitNPC, trail, DW1_GROUND, ZOOM, zpt, zTarget, zoomMap, zoomGen, zoomRows, densify, roomRows, doorRoom };
})();
