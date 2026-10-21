'use strict';
// FICHIER FABRIQUÉ PAR dev/versions.py : des scripts du jeu (liste de js/scripts.js), dans l'ordre, réunis pour le
// site en ligne (une seule demande au lieu d'une par fichier). Ne pas modifier : modifier js/, puis relancer dev/versions.py.

// ===== js/maps/retouches.js
'use strict';
// =====================================================================
//  RETOUCHES : ce que le créateur a peint à la main dans l'éditeur de cartes (données : maps/retouches_donnees.js).
//  Appliquées par DW.getMap APRÈS toute la génération (forêts, relief, puzzle, décor dense) : les outils automatiques
//  ne peuvent donc jamais écraser une retouche. Ordre : thème → relief (niveaux) → cases → objets retirés → objets ajoutés
//  → entrées et sorties → collisions choisies à la main. Le décor posé ensuite par DW.preparerCarte (ensembles de décor,
//  distributeurs, panneaux au bord des chemins) respecte aussi les retouches : objets retirés, panneaux placés à la main,
//  décor automatique coupé (decorAuto: false).
//  RELIEF : une altitude par case ; une baisse vers le SUD devient une paroi rocheuse de 3 cases par niveau (vue de 3/4),
//  vers le nord, l'est ou l'ouest un rebord d'une case (même règle que maps/relief.js) ; « ^ » = escalier (passage).
// =====================================================================
(function () {
  const ROCK = 'Ŵ', STAIR = '^', WALL = 3;
  const R = DW.Retouches = {
    de: id => (DW.RETOUCHES && DW.RETOUCHES.cartes && DW.RETOUCHES.cartes[id]) || null,
    cle: o => o.kind + '@' + o.x + ',' + o.y,
    // la carte avant retouches (l'éditeur repart de là à chaque modification)
    base(m) { return { rows: m._baseRows || m.rows, objects: m._baseObjects || m.objects || [], alt: m._baseAlt !== undefined ? m._baseAlt || undefined : m.alt, theme: m._baseTheme !== undefined ? m._baseTheme : m.theme, warps: m._baseWarps || m.warps || [], doors: m._baseDoors || m.doors || [] }; },
    cleSortie: (w, porte) => (porte ? 'd:' : 'w:') + w.to + '@' + w.x + ',' + w.y,
    appliquer(m, id, force) {
      const T = R.de(id);
      if (!m.rows || (!T && !m._baseRows) || (!force && m._retFor === m.rows)) return;
      if (m._retFor !== m.rows) { m._baseSigns = { ...(m.signs || {}) }; m._baseRows = m.rows; m._baseObjects = (m.objects || []).filter(o => !o.ed && !o.decor); m._baseAlt = m.alt || null; m._baseAltBord = !!m.altBord; m._baseTheme = m.theme; m._baseWarps = (m.warps || []).filter(w => !w.ed); m._baseDoors = (m.doors || []).filter(d => !d.ed); }
      const B = R.base(m);
      m.theme = T && T.theme ? T.theme : B.theme;
      if (T && T.ambient) m.ambient = T.ambient;
      if (m._baseFalaise === undefined) m._baseFalaise = m.falaise || null;
      m.falaise = T && T.falaise ? T.falaise : m._baseFalaise || undefined;   // style des falaises (gfx/terrain.js : World.FALAISES)
      if (m._basePont === undefined) m._basePont = m.pont || null;
      m.pont = T && T.pont ? T.pont : m._basePont || undefined;   // style des ponts (gfx/ponts.js : pierre, bois, tronc, corde)
      // décor automatique du jeu (ensembles de décor et repère : maps/decor.js) : le créateur peut le couper sur une carte
      if (m._baseDress === undefined) m._baseDress = m.dress === undefined ? null : m.dress;
      m.dress = T && T.decorAuto === false ? false : m._baseDress === null ? undefined : m._baseDress;
      const W = B.rows[0].length, H = B.rows.length, g = B.rows.map(r => [...r]);
      // (null : la carte n'avait pas de relief généré ; sinon, après « Annuler », l'atelier gardait le relief retouché comme base)
      m.alt = B.alt; if (m._baseAltBord !== undefined) m.altBord = m._baseAltBord;
      if (T && T.niveaux && Object.keys(T.niveaux).length) relief(g, m, W, H, T.niveaux, B.alt);
      if (T) for (const k in T.cases || {}) { const [x, y] = k.split(',').map(Number); if (g[y] && x < W) g[y][x] = T.cases[k]; }
      if (m.alt && T && T.cases) for (const k in T.cases) if (T.cases[k] === STAIR) { const [x, y] = k.split(',').map(Number); m.alt[y * W + x] = DW.Relief.PASS; }
      const gone = new Set(T ? T.retraits || [] : []);
      m.objects = B.objects.filter(o => !gone.has(R.cle(o))).concat(T ? (T.ajouts || []).map(o => ({ ...o, ed: true })) : []);
      // ENTRÉES ET SORTIES : retirées, déplacées ou ajoutées dans l'éditeur (_zt : l'arrivée est déjà écrite à la taille
      // réelle de la carte d'arrivée ; sans lui, DW.getMap la doublait à chaque appel vers une carte agrandie ×2). bord = sortie au bord de la carte (on la passe
      // en marchant vers l'extérieur) ; porte = on y entre en marchant dans sa direction ; portail = on y entre de tous côtés.
      // (les sorties ajoutées ne changent pas la géographie du monde : enclos)
      const parti = new Set(T ? T.sortiesRetirees || [] : []), S = T ? T.sorties || [] : [];
      const ok = o => o.to && DW.MAPS[o.to], regle = (w, o) => (DW.PUZZLE ? DW.PUZZLE.regle(w, o.regle) : w);   // (règle de chapitre : maps/puzzle.js)
      // une sortie posée dans l'éditeur REMPLACE la sortie générée vers la même carte, du même côté, qu'elle chevauche
      // (sinon, si la génération a déplacé la sienne depuis, sa clé de retrait ne correspond plus et on avait un doublon)
      const span = w => (w.dir === 'left' || w.dir === 'right' ? [w.y, w.y + (w.h || 1)] : [w.x, w.x + (w.w || 1)]);
      const remplacee = w => S.some(o => o.type === 'bord' && o.to === w.to && o.dir === w.dir && span(o)[0] < span(w)[1] && span(w)[0] < span(o)[1]);
      // une sortie de l'atelier qui reprend une sortie du jeu (reprend : sa clé ; sinon la sortie de bord qu'elle chevauche, ou
      // la seule porte retirée vers la même carte) garde sa CONDITION D'HISTOIRE (le Bois Brumeux attend qu'Elecmon rallume
      // les lanternes, la porte du Grand Arbre l'énigme...) : une règle de chapitre posée dans l'atelier s'y AJOUTE
      const origine = (o, porte) => {
        const L = porte ? B.doors : B.warps;
        if (o.reprend) return L.find(w => R.cleSortie(w, porte) === o.reprend) || null;
        if (!porte) return L.find(w => w.to === o.to && w.dir === o.dir && span(o)[0] < span(w)[1] && span(w)[0] < span(o)[1]) || null;
        const c = L.filter(d => d.to === o.to && parti.has(R.cleSortie(d, true)));
        return c.length === 1 ? c[0] : null;
      };
      const garde = (w, o0) => {
        if (!o0 || !o0.cond || o0.regle) return w;   // (une règle de chapitre d'origine est remplacée par celle de l'atelier)
        const c0 = o0.cond, l0 = o0.lock, c1 = w.cond, l1 = w.lock, txt = l => (typeof l === 'function' ? l() : l);
        w.cond = s => c0(s) && (!c1 || c1(s));
        w.lock = () => txt(c1 && !c1(DW.state) ? l1 : l0);
        w.histoire = l0;   // (montrée dans l'atelier)
        return w;
      };
      m.warps = B.warps.filter(w => !parti.has(R.cleSortie(w)) && !remplacee(w)).concat(S.filter(o => o.type === 'bord' && ok(o)).map(o => garde(regle({ x: o.x, y: o.y, w: o.w || 1, h: o.h || 1, dir: o.dir, to: o.to, tx: o.tx, ty: o.ty, ed: true, enclos: true, _zt: true }, o), origine(o, false))));
      m.doors = B.doors.filter(d => !parti.has(R.cleSortie(d, true))).concat(S.filter(o => o.type === 'porte' && ok(o)).map(o => garde(regle({ x: o.x, y: o.y, w: o.w || 1, h: 1, dir: o.dir || 'up', to: o.to, tx: o.tx, ty: o.ty, ed: true, _zt: true }, o), origine(o, true))));
      m.portails = S.filter(o => o.type === 'portail' && ok(o)).map(o => regle({ x: o.x, y: o.y, w: o.w || 1, h: o.h || 1, to: o.to, tx: o.tx, ty: o.ty, ed: true, _zt: true }, o));
      // PANNEAUX : texte écrit dans l'éditeur (une case = un texte ; « null » retire le texte d'origine)
      m.signs = { ...(m._baseSigns || m.signs || {}) };
      if (T) for (const k in T.panneaux || {}) { if (T.panneaux[k] == null) delete m.signs[k]; else m.signs[k] = T.panneaux[k]; }
      // (un objet retiré emporte les panneaux posés sur lui, sauf ceux écrits dans l'éditeur : une cabine de toilettes
      //  retirée laissait 3 cases « toilettes » invisibles)
      for (const o of B.objects) if (gone.has(R.cle(o))) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) if (!(T && T.panneaux && (x + ',' + y) in T.panneaux)) delete m.signs[x + ',' + y];
      // un objet du jeu DÉPLACÉ ou modifié dans l'atelier (ajout « reprend » : la clé de l'original) emporte ses actions
      // (panneaux-fonctions : l'énigme du Grand Arbre, le feu de camp de Matt...) et ses textes, au même endroit de son dessin
      // (sauf un texte écrit dans l'atelier à cet endroit)
      if (T) for (const o of T.ajouts || []) {
        const o0 = o.reprend && B.objects.find(q => R.cle(q) === o.reprend); if (!o0) continue;
        for (let y = o0.y; y < o0.y + (o0.h || 1); y++) for (let x = o0.x; x < o0.x + (o0.w || 1); x++) {
          const v = (m._baseSigns || {})[x + ',' + y], k = (o.x + x - o0.x) + ',' + (o.y + y - o0.y);
          if (v != null && !(T.panneaux && typeof T.panneaux[k] === 'string')) m.signs[k] = v;
        }
      }
      // COLLISIONS CHOISIES À LA MAIN : cases forcées bloquantes (1) ou praticables (0), quel que soit le décor
      m.forceBloque = new Set(); m.forceLibre = new Set();
      if (T) for (const k in T.bloque || {}) (T.bloque[k] ? m.forceBloque : m.forceLibre).add(k);
      // (de l'eau peinte en travers d'un passage vers une carte voisine : le passage reste franchissable, par un pont
      //  sur ses 4 premières cases — l'eau peinte reste autour ; le diagnostic de l'éditeur le signale aussi)
      for (const w of m.warps || []) {
        if (!w.dir) continue;
        const along = w.dir === 'left' || w.dir === 'right' ? w.h || 1 : w.w || 1, p0 = w.dir === 'left' || w.dir === 'right' ? w.y : w.x;
        for (let k = 0; k < along; k++) for (let d = 0; d < 4; d++) {
          const [x, y] = { left: [d, p0 + k], right: [W - 1 - d, p0 + k], up: [p0 + k, d], down: [p0 + k, H - 1 - d] }[w.dir];
          const c = g[y] && g[y][x], I = c && DW.World.CH[c];
          if (I && I.t === 'water' && DW.SOLID.has(c)) g[y][x] = '_';
        }
      }
      if (DW.World.prolongerPonts) DW.World.prolongerPonts(g);   // (un pont peint à la main rejoint aussi la terre)
      m.rows = g.map(r => r.join(''));
      // la génération ne repasse pas sur une carte retouchée (décor dense, passages dégagés, raccords du puzzle, ponts)
      m._retFor = m._denseFor = m._passFor = m._racFor = m._pontsFor = m.rows;
    },
  };
  // altitude finale = niveaux peints, sinon le relief généré ; parois recalculées seulement près des cases peintes
  function relief(g, m, W, H, niv, alt0) {
    const PASS = DW.Relief.PASS, alt = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) { const a = alt0 ? alt0[i] : 0; alt[i] = a === PASS ? 0 : a; }
    // (sur un escalier généré, on prend le niveau du pied)
    const zone = new Uint8Array(W * H);
    for (const k in niv) {
      const [x, y] = k.split(',').map(Number); if (x < 0 || y < 0 || x >= W || y >= H) continue;
      alt[y * W + x] = niv[k];
      for (let dy = -4; dy <= 4 + WALL * 4; dy++) for (let dx = -4; dx <= 4; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) zone[Y * W + X] = 1; }
    }
    const lvl = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : alt[y * W + x]);
    // FORMES LISSÉES (dans la zone peinte) : pas de pointe ni d'encoche d'une case, pas de plateau minuscule ;
    // les falaises suivent alors de grandes lignes douces au lieu d'un escalier de briques
    for (let it = 0; it < 3; it++) {
      const nxt = alt.slice();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; if (!zone[i]) continue;
        const L = alt[i]; let hi = 0, lo = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const n = lvl(x + dx, y + dy); if (n < 0) continue; if (n >= L) hi++; if (n > L) lo++; }
        if (L > 0 && hi < 4) nxt[i] = L - 1;        // pointe : rabotée
        else if (lo >= 6) nxt[i] = L + 1;            // encoche : comblée
      }
      alt.set(nxt);
    }
    { // plateaux de moins de 16 cases : rabaissés
      const seen = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        if (seen[i] || !alt[i] || !zone[i]) continue;
        const L = alt[i], cells = [i], q = [i]; seen[i] = 1;
        while (q.length) { const j = q.pop(), x = j % W, y = (j / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, k = Y * W + X; if (X < 0 || Y < 0 || X >= W || Y >= H || seen[k] || alt[k] !== L) continue; seen[k] = 1; cells.push(k); q.push(k); } }
        if (cells.length < 16) for (const j of cells) alt[j] = L - 1;
      }
    }
    // BORDS SUD REDRESSÉS : à chaque niveau, le bas de chaque colonne suit la médiane de ses voisines (±3 colonnes) :
    // une falaise forme une longue ligne, avec de rares ressauts, au lieu de dents de scie
    let maxL = 0; for (let i = 0; i < W * H; i++) if (zone[i] && alt[i] > maxL) maxL = alt[i];
    for (let T = maxL; T >= 1; T--) {
      const edges = [];
      for (let x = 0; x < W; x++) for (let y = 0; y < H - 1; y++) if (zone[y * W + x] && alt[y * W + x] >= T && alt[(y + 1) * W + x] < T) edges.push([x, y]);
      const at = new Map(); for (const [x, y] of edges) { if (!at.has(x)) at.set(x, []); at.get(x).push(y); }
      const fix = [];
      for (const [x, y] of edges) {
        const ys = [];
        for (let dx = -3; dx <= 3; dx++) for (const yy of at.get(x + dx) || []) if (Math.abs(yy - y) <= 3) { ys.push(yy); break; }
        ys.sort((a, b) => a - b); fix.push([x, y, ys[ys.length >> 1]]);
      }
      for (const [x, y, m] of fix) {
        if (m > y) for (let yy = y + 1; yy <= m; yy++) { const i = yy * W + x; if (zone[i] && alt[i] < T) alt[i] = T; }
        else if (m < y) for (let yy = m + 1; yy <= y; yy++) { const i = yy * W + x; if (zone[i] && alt[i] >= T) alt[i] = T - 1; }
      }
    }
    const rock = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const L = lvl(x, y); if (L <= 0) continue;
      const s = lvl(x, y + 1);
      if (s >= 0 && s < L) { let k = 1; for (; k <= WALL * (L - s) && y + k < H; k++) { if (lvl(x, y + k) >= L) break; rock[(y + k) * W + x] = 1; } }
    }
    // trous d'une case dans une paroi (entre deux colonnes de roche) : bouchés
    for (let y = 0; y < H; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (zone[i] && !rock[i] && rock[i - 1] && rock[i + 1] && y > 0 && (rock[i - W] || alt[i - W] > alt[i])) rock[i] = 1; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!zone[i]) continue;
      if (g[y][x] === STAIR) continue;
      if (rock[i]) g[y][x] = ROCK;
      else if (g[y][x] === ROCK) g[y][x] = '.';   // (ancienne paroi devenue plat : de l'herbe)
    }
    const out = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) { const y = (i / W) | 0, x = i % W; out[i] = g[y][x] === STAIR ? PASS : g[y][x] === ROCK && rock[i] ? pied(x, y) : alt[i]; }
    m.alt = out;
    // (sur les côtés nord, est et ouest, pas de mur : un rebord dessiné ; c'est le dénivelé qui arrête le héros)
    m.altBord = true;
    DW.Relief.peindreRebords(m);   // (rebords dessinés : maps/relief.js)
    // (une case de paroi a l'altitude du pied de la paroi)
    function pied(x, y) { let k = y; while (k < H && rock[k * W + x]) k++; return k < H ? alt[k * W + x] : 0; }
  }
})();
;

// ===== js/maps/puzzle.js
'use strict';
// =====================================================================
//  LE PUZZLE DU MONDE : chaque carte extérieure est une PIÈCE carrée de même taille (96 × 72 cases), posée sur une
//  case de la grille (colonne, rangée). Deux pièces côte à côte peuvent être reliées par un PASSAGE sur leur bord
//  commun ; c'est la seule façon de passer d'une carte à l'autre (les deux côtés du passage sont au même endroit).
//  Axes : colonne vers l'EST, rangée vers le SUD ; origine (0, 0) = la Clairière de l'Arrivée.
//  Ce fichier est la vérité du monde : l'éditeur de cartes (sur le PC du créateur, dossier dev/editeur/) le réécrit
//  quand on déplace une pièce ou qu'on ouvre / ferme un passage.
//  Hors du puzzle (reliés par des portails, comme des portes) : le terrain d'entraînement, le Quartier des Champs,
//  le Village des Poyomon, les quartiers de la ville, et les régions des chapitres futurs (en attendant leur chapitre).
// =====================================================================
(function () {
  const P = DW.PUZZLE = {
    case: [96, 72],
    // pièce : [colonne, rangée]
    pieces: {
      lac10: [-1, -4], lac9: [0, -4],
      lac11: [-2, -3], lac7: [-1, -3], lac6: [0, -3], lac5: [1, -3],
      lac8: [-1, -2], lac2: [0, -2], lac4: [1, -2],
      lac1: [-1, -1], lac0: [0, -1], lac3: [1, -1],
      miharashi4: [-4, 0], miharashi3: [-3, 0], miharashi1: [-2, 0], miharashi0: [-1, 0], clairiere: [0, 0],
      miharashi2: [-1, 1], sentier: [0, 1], prairie: [1, 1], berceau: [2, 1],
      bosquet: [-1, 2], geants: [0, 2],
      dunes: [-1, 3], lisiere: [0, 3],
      crique: [-1, 4], plage: [0, 4], village: [1, 4],
    },
    // passage : [pièce A, côté de A, pièce B, début le long du bord (en cases), largeur] — null = position par défaut
    passages: [
      ['lac10', 'right', 'lac9', null, 6], ['lac10', 'down', 'lac7', null, 6], ['lac9', 'down', 'lac6', null, 6],
      ['lac11', 'right', 'lac7', null, 6], ['lac7', 'right', 'lac6', null, 6], ['lac6', 'right', 'lac5', null, 6],
      ['lac7', 'down', 'lac8', null, 6], ['lac6', 'down', 'lac2', null, 6], ['lac5', 'down', 'lac4', null, 6],
      ['lac8', 'down', 'lac1', null, 6], ['lac4', 'down', 'lac3', null, 6],
      ['lac1', 'right', 'lac0', null, 6], ['lac0', 'right', 'lac3', null, 6],
      ['lac0', 'down', 'clairiere', null, 6], ['lac1', 'down', 'miharashi0', null, 6],
      ['miharashi4', 'right', 'miharashi3', null, 6], ['miharashi3', 'right', 'miharashi1', null, 6], ['miharashi1', 'right', 'miharashi0', null, 6],
      ['miharashi0', 'right', 'clairiere', null, 6], ['miharashi0', 'down', 'miharashi2', null, 6],
      ['clairiere', 'down', 'sentier', null, 6], ['miharashi2', 'right', 'sentier', null, 6], ['sentier', 'right', 'prairie', null, 6], ['prairie', 'right', 'berceau', null, 6],
      ['miharashi2', 'down', 'bosquet', null, 6], ['sentier', 'down', 'geants', null, 6], ['bosquet', 'right', 'geants', null, 6],
      ['bosquet', 'down', 'dunes', null, 6], ['geants', 'down', 'lisiere', null, 6], ['dunes', 'right', 'lisiere', null, 6],
      ['dunes', 'down', 'crique', null, 6], ['lisiere', 'down', 'plage', null, 6], ['crique', 'right', 'plage', null, 6], ['plage', 'right', 'village', null, 6],
    ],
  };
  const OPP = DW.OPP;
  const [CW, CHH] = P.case;
  P.isPiece = id => !!P.pieces[id];
  P.pos = id => { const c = P.pieces[id]; return c ? { x: c[0] * CW, y: c[1] * CHH, w: CW, h: CHH } : null; };

  // ------------------------------------------------------------ mise au gabarit (cartes faites main, à leur préparation)
  // la carte garde son dessin en haut à gauche (toutes ses coordonnées restent valables) ; elle est prolongée à droite
  // et en bas jusqu'à 96 × 72 en reprenant, en miroir, la bande de bord (forêt, mer, sable, chemin qui sort...)
  P.gabarit = function (m, id) {
    if (!P.isPiece(id) || !m.rows || m._gabFor === m.rows) return;
    const h0 = m.rows.length, w0 = Math.max(...m.rows.map(r => r.length));
    if (w0 === CW && h0 === CHH) { m._gabFor = m.rows; m.w = CW; m.h = CHH; return; }
    const src = m.rows.map(r => r.padEnd(w0, r[r.length - 1]));
    // (au-delà du bord : la bande de bord reprise en miroir, aller-retour, pour éviter les rayures)
    const mir = (k, n, band) => { const j = (k - n) % (2 * band); return j < band ? n - 1 - j : n - band + (j - band); };
    const rows = [];
    for (let y = 0; y < CHH; y++) {
      const sy = y < h0 ? y : mir(y, h0, Math.min(8, h0));
      let r = '';
      for (let x = 0; x < CW; x++) r += src[sy][x < w0 ? x : mir(x, w0, Math.min(8, w0))];
      rows.push(r);
    }
    DW.MapKit.changerLignes(m, rows); m._gabFor = m.rows; m.w = CW; m.h = CHH;
    // les sorties du bord droit / bas suivent le nouveau bord (et les arrivées des autres cartes avec elles)
    for (const w of m.warps || []) { if (w.x + (w.w || 1) === w0) w.x = CW - (w.w || 1); if (w.y + (w.h || 1) === h0) w.y = CHH - (w.h || 1); }
    for (const k in DW.MAPS) for (const w of DW.MAPS[k].warps || []) if (w.to === id && !w.puzzle) { if (w.tx === w0 - 1) w.tx = CW - 1; if (w.ty === h0 - 1) w.ty = CHH - 1; }
  };

  // ------------------------------------------------------------ passages : posés dans les deux cartes, au même endroit
  const along = side => (side === 'left' || side === 'right' ? CHH : CW);
  function defaultPos(a, side, b, keep) {
    // une carte faite main garde son ancien passage (son chemin y mène déjà) ; sinon : le milieu du bord
    for (const [id, s, other] of [[a, side, b], [b, OPP[side], a]]) {
      const m = DW.MAPS[id]; if (m.spec) continue;
      const olds = Object.values(keep[id] || {});
      const w = (keep[id] || {})[other] || olds.find(v => v.dir === s);
      if (w) return Math.min(along(side) - 7, s === 'left' || s === 'right' ? w.y : w.x);
    }
    return Math.floor(along(side) / 2) - 3;
  }
  const warpOn = (side, p, len, to) => {
    const o = { left: { x: 0, y: p, w: 1, h: len, tx: CW - 1, ty: p }, right: { x: CW - 1, y: p, w: 1, h: len, tx: 0, ty: p },
      up: { x: p, y: 0, w: len, h: 1, tx: p, ty: CHH - 1 }, down: { x: p, y: CHH - 1, w: len, h: 1, tx: p, ty: 0 } }[side];
    return { ...o, dir: side, to, _zt: true, puzzle: true };
  };
  // appelé une fois tous les passages des anciennes cartes posés (fin de maps/regions.js)
  // le puzzle refait dans l'éditeur de cartes remplace celui-ci (maps/retouches_donnees.js)
  if (DW.RETOUCHES && DW.RETOUCHES.puzzle) { P.pieces = DW.RETOUCHES.puzzle.pieces; P.passages = DW.RETOUCHES.puzzle.passages; }
  P.apply = function () {
    const MAPS = DW.MAPS, keep = {};
    // les anciennes liaisons entre pièces sont retirées (on garde leurs conditions : portes de région, verrous)
    for (const id in P.pieces) {
      const m = MAPS[id]; if (!m) continue;
      keep[id] = {};
      m.warps = (m.warps || []).filter(w => { if (w.dir && P.isPiece(w.to)) { keep[id][w.to] = w; return false; } return true; });
      if (m.spec) for (const s of Object.keys(m.exits || {})) { const t = Object.values(keep[id]).find(w => w.dir === s); if (t) delete m.exits[s]; }
    }
    for (const pass of P.passages) {
      const [a, side, b, p0, len = 6] = pass, A = MAPS[a], B = MAPS[b]; if (!A || !B) continue;
      const [ca, ra] = P.pieces[a], [cb, rb] = P.pieces[b], dx = cb - ca, dy = rb - ra;
      if ({ left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[side].join() !== [dx, dy].join()) { console.warn(`[puzzle] ${a} et ${b} ne sont pas voisines par le côté ${side}`); continue; }
      const p = p0 != null ? p0 : defaultPos(a, side, b, keep);
      pass[3] = p;
      const wa = warpOn(side, p, len, b), wb = warpOn(OPP[side], p, len, a);
      for (const [w, from, to] of [[wa, a, b], [wb, b, a]]) { const old = keep[from][to]; if (old) for (const k of ['cond', 'lock', 'enclos']) if (old[k] !== undefined) w[k] = old[k]; P.regle(w, pass[5]); }
      A.warps.push(wa); B.warps.push(wb);
      if (A.spec) A.exits[side] = [p, len]; if (B.spec) B.exits[OPP[side]] = [p, len];
    }
    P.applied = true;
    // (une carte déjà préparée avant le puzzle garde ses nouvelles sorties comme base de ses retouches : maps/retouches.js)
    for (const id in P.pieces) { const m = MAPS[id]; if (m && m._baseWarps) m._baseWarps = (m.warps || []).filter(w => !w.ed); }
    // les cartes générées prennent la taille d'une pièce
    for (const id in P.pieces) { const m = MAPS[id]; if (m && m.spec) { m.w = CW; m.h = CHH; } }
  };

  // une carte qui refait ses sorties elle-même (la ville qui grandit) reprend celles du puzzle
  P.reposer = function (m, id) {
    if (!P.isPiece(id) || !P.applied) return;
    const mine = P.passages.filter(q => (q[0] === id || q[2] === id) && q[3] != null);
    const along = (w, s2) => (s2 === 'left' || s2 === 'right' ? w.y : w.x);
    // (carte retouchée dans l'atelier et pas regénérée depuis : on regarde ses sorties d'avant les retouches — un passage
    //  remplacé par une sortie de l'atelier n'est pas « perdu », sinon il était remis et le chemin recreusé à chaque visite)
    const W0 = m._retFor === m.rows && m._baseWarps ? m._baseWarps : m.warps || [];
    if (mine.every(q => W0.some(w => w.puzzle && w.to === (q[0] === id ? q[2] : q[0]) && along(w, w.dir) === q[3]))) return;
    m.warps = (m.warps || []).filter(w => !(w.dir && P.isPiece(w.to)) || w.puzzle);
    for (const [a, side, b, p, len = 6] of mine) {
      const s2 = a === id ? side : OPP[side], to = a === id ? b : a;
      if (!m.warps.some(w => w.puzzle && w.to === to && along(w, w.dir) === p)) m.warps.push(P.regle(warpOn(s2, p, len, to), (P.passages.find(q => q[0] === a && q[2] === b && q[3] === p) || [])[5]));
    }
    m._racFor = null;
  };
  // RÈGLE DE CHAPITRE (choisie dans l'éditeur) : { des : ouvert à partir de ce chapitre, jusqua : fermé après ce chapitre,
  // msg : ce qu'on lit quand c'est fermé }. Elle remplace la règle des régions (game/chapitre1.js : lock).
  P.regle = (w, o) => {
    if (!o || (o.des == null && o.jusqua == null)) return w;
    const ch = s => (s && s.flags && s.flags.chapter) || 1;
    w.cond = s => (o.des == null || ch(s) >= o.des) && (o.jusqua == null || ch(s) <= o.jusqua);
    w.lock = o.msg || 'Un voile de données bloque le passage... Il s\'ouvrira plus tard dans l\'aventure.';
    w.ignoreChapitre = true; w.regle = o;
    return w;
  };
  // (début du passage commun entre deux pièces : pour aligner un décor sur le passage, ex. la côte de la ville)
  // (plusieurs passages possibles entre deux pièces : celui-ci renvoie le premier)
  P.passage = (a, b) => { const q = P.passages.find(t => (t[0] === a && t[2] === b) || (t[0] === b && t[2] === a)); return q ? q[3] : null; };
  // ------------------------------------------------------------ raccord : chaque passage rejoint le réseau de chemins de la carte
  P.raccorder = function (m, id) {
    if (!P.applied || !P.isPiece(id) || m._racFor === m.rows || !m.rows) return;   // (pas avant que les passages soient posés)
    const W = m.w, H = m.h, g = m.rows.map(r => [...r]);
    const walk = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !DW.SOLID.has(g[y][x]);
    // grande zone praticable de la carte (la plus vaste)
    const comp = new Int32Array(W * H).fill(-1), sizes = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (comp[y * W + x] >= 0 || !walk(x, y)) continue;
      const id2 = sizes.length, q = [[x, y]]; comp[y * W + x] = id2; let n = 0;
      while (q.length) { const [cx, cy] = q.pop(); n++; for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + ddx, ny = cy + ddy; if (walk(nx, ny) && comp[ny * W + nx] < 0) { comp[ny * W + nx] = id2; q.push([nx, ny]); } } }
      sizes.push(n);
    }
    const main = sizes.indexOf(Math.max(...sizes));
    for (const w of m.warps || []) {
      if (!w.puzzle) continue;
      const cx = w.x + (w.w >> 1), cy = w.y + (w.h >> 1);
      const inward = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] }[w.dir];
      // couloir de 4 cases depuis le bord, puis plus court chemin vers la grande zone (à travers forêt et décor, ponts sur l'eau)
      let x = cx, y = cy;
      for (let k = 0; k < 4; k++) { for (let d = 0; d < Math.max(w.w, w.h); d++) { const px = w.dir === 'up' || w.dir === 'down' ? w.x + d : x, py = w.dir === 'up' || w.dir === 'down' ? y : w.y + d; if (g[py] && g[py][px] !== undefined && DW.SOLID.has(g[py][px])) g[py][px] = DW.World.info(g[py][px]).t === 'water' ? '_' : Math.max(w.w, w.h) > 12 ? '.' : '='; } x += inward[0]; y += inward[1]; }
      if (comp[y * W + x] === main) continue;
      const prev = new Int32Array(W * H).fill(-2), q = [[x, y]]; prev[y * W + x] = -1; let end = -1;
      for (let h = 0; h < q.length && end < 0; h++) {
        const [qx, qy] = q[h];
        if (comp[qy * W + qx] === main) { end = qy * W + qx; break; }
        for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = qx + ddx, ny = qy + ddy; if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1 || prev[ny * W + nx] !== -2) continue; prev[ny * W + nx] = qy * W + qx; q.push([nx, ny]); }
      }
      for (let k = end; k >= 0; k = prev[k]) { const px = k % W, py = Math.floor(k / W), c = g[py][px]; if (DW.SOLID.has(c)) g[py][px] = DW.World.info(c).t === 'water' ? '_' : '='; }
    }
    DW.MapKit.changerLignes(m, g.map(r => r.join(''))); m._racFor = m.rows;
  };
})();
;

// ===== js/maps/decor.js
'use strict';
// =====================================================================
//  DÉCORS EN KITS (densité façon Digimon World 2003) : sur chaque carte extérieure générée,
//  des petits ensembles d'éléments propres à la région sont posés dans les espaces libres
//  (rocher moussu + champignons, épave + crabe, tombes + lanterne, réservoir + batteries...),
//  avec une touche numérique discrète (panneaux de circuits, antennes, tuyaux de données).
//  Sécurité : après chaque ensemble, on vérifie que tous les passages, portes, panneaux et
//  personnages restent accessibles ; sinon l'ensemble est retiré.
//  Les cartes de la ville (thèmes town / farm / nursery) restent faites à la main.
// =====================================================================
(function () {
  // ensembles par thème : chaque liste = éléments posés côte à côte (le premier au centre)
  const FOREST = [['mossrock', 'glowshroom'], ['hollowlog', 'fern'], ['stump', 'fern', 'glowshroom'], ['boulder', 'bigfern'], ['oak'], ['birch', 'fern'], ['cairn', 'pebbles']];
  const KITS = {
    spring: FOREST, misty: FOREST.concat([['stonelantern', 'mossrock']]), meadow: [['boulder', 'flowerbed'], ['oak'], ['birch'], ['cairn', 'pebbles'], ['haybale'], ['stump', 'flowerbed']],
    deep: FOREST.concat([['giantstump'], ['glowshroom', 'glowshroom']]), autumn: FOREST.concat([['deadtree'], ['scarecrow']]),
    beach: [['wreck', 'crab'], ['driftwood', 'starfish', 'crab'], ['driftwood', 'starfish'], ['tidepool', 'crab'], ['tidepool', 'starfish'], ['rockarch'], ['palm', 'crab'], ['palm', 'starfish'], ['boulder', 'crab']],
    mountain: [['boulder', 'pebbles'], ['cairn'], ['pine', 'pine'], ['crystal', 'pebbles'], ['basalt'], ['stalagmite', 'boulder']],
    summit: [['boulder', 'pebbles'], ['cairn'], ['crystal'], ['basalt', 'pebbles']],
    volcano: [['lavarock', 'steamvent'], ['basalt', 'pebbles'], ['smallvolcano'], ['bones', 'lavarock'], ['steamvent', 'steamvent']],
    savanna: [['acacia', 'drybush'], ['termite'], ['baobab'], ['halfgear', 'drybush'], ['boulder', 'drybush'], ['skullrock']],
    factory: [['tank', 'battery'], ['conveyor', 'scrap'], ['battery', 'scrap'], ['crane'], ['robotarm'], ['chimney', 'scrap']],
    trash: [['tirestack', 'scrap'], ['brokencar', 'tirestack'], ['tvstack', 'junkpile'], ['scrap', 'battery'], ['junkpile']],
    sewer: [['scrap', 'battery'], ['tirestack'], ['pipe', 'scrap']],
    canyon: [['archrock'], ['cactus', 'drybush'], ['spire'], ['boulder', 'pebbles'], ['skullrock', 'cactus']],
    dino: [['cycad', 'bigfern'], ['bones', 'fern'], ['amber', 'boulder'], ['bigfern', 'cycad'], ['bones']],
    jungle: [['jungletree', 'junglebush'], ['totem', 'junglebush'], ['bigfern', 'junglebush'], ['reeds', 'bigfern']],
    mangrove: [['mangrove', 'reeds'], ['reeds', 'reeds'], ['junglebush', 'reeds']],
    cemetery: [['tombstone', 'tombstone', 'jacklantern'], ['gargoyle', 'tombstone'], ['ironfence', 'tombstone'], ['deadtree', 'jacklantern']],
    fog: [['stonelantern', 'mossrock'], ['mossrock', 'fern'], ['deadtree'], ['cairn', 'stonelantern']],
    toy: [['teddy', 'block'], ['jackbox', 'block'], ['toyhouse'], ['candytree', 'block'], ['block', 'block', 'teddy']],
    snow: [['snowbush', 'icerock'], ['icecrystal', 'icerock'], ['snowman'], ['pine', 'snowbush'], ['icepillar', 'icecrystal']],
    beetle: [['giantstump', 'glowshroom'], ['honeycomb', 'stump'], ['hollowlog', 'glowshroom'], ['beetlestatue', 'fern']],
    swamp: [['swamptree', 'reeds'], ['frogstatue', 'reeds'], ['reeds', 'reeds'], ['bogshack']],
  };
  // lieux marquants : un par sous-zone qui n'a pas déjà son lieu emblématique [élément, nom, description]
  const LANDMARKS = {
    mountain: [['leomonstone', 'La Pierre du Lion', "Une roche sculptée par le vent. On dit que Leomon y méditait autrefois."], ['watchtower', 'La Tour de guet', "Une vieille tour de bois d'où l'on voit toute l'île."], ['chalet', 'Le Chalet des alpages', 'Un refuge pour les voyageurs fatigués. La cheminée est encore tiède.'], ['monolith', 'Le Monolithe de données', 'Une pierre noire qui bourdonne doucement quand on s\'approche.'], ['telescope', "Le Télescope de l'ermite", "Quelqu'un observait les étoiles d'ici, chaque nuit."]],
    summit: [['telescope', 'Le Télescope des cimes', 'Par temps clair, on y verrait les autres serveurs du monde numérique.'], ['monolith', 'La Borne du sommet', 'Une borne de données gravée de chiffres anciens.'], ['flagpole', 'Le Drapeau du sommet', 'Les grimpeurs y accrochent un ruban pour fêter leur ascension.']],
    volcano: [['smallvolcano', 'Le Petit Cratère', 'Il gronde, crache un peu de fumée... et se rendort.'], ['cavemouth', 'La Bouche de lave', "Une grotte rougeoyante. Il y fait une chaleur d'enfer."], ['basalt', 'Les Orgues de basalte', 'Des colonnes de roche noire, refroidies il y a très longtemps.'], ['monolith', 'La Stèle de Meramon', 'Une stèle brûlante couverte de flammes gravées.']],
    savanna: [['baobab', 'Le Baobab millénaire', "Le plus vieil arbre de la savane. Son tronc abrite tout un peuple d'insectes."], ['gearmill', 'Le Moulin à engrenages', 'Il tourne tout seul, entraîné par un engrenage enfoui sous la terre.'], ['giantnest', 'Le Grand Nid', 'Un nid immense... Mais quel Digimon a pu le construire ?'], ['lionrock', 'Le Rocher des Griffes', "Des marques de griffes profondes zèbrent la pierre."]],
    factory: [['crane', 'La Grue géante', "Elle soulève des conteneurs jour et nuit, sans conducteur."], ['robotarm', "Le Bras d'assemblage", 'Il visse, soude et trie... même quand il n\'y a rien à fabriquer.'], ['drill', 'La Foreuse rouillée', 'Elle a creusé jusqu\'à toucher une veine de données.'], ['watchtower', 'La Tour de contrôle', 'Des écrans clignotent encore tout en haut.']],
    trash: [['junkthrone', "Le Trône d'ordures", "Quelqu'un s'est proclamé roi de la décharge..."], ['crane', 'La Grue à ferraille', 'Son grappin aimanté attrape tout ce qui brille.'], ['drill', 'La Foreuse abandonnée', 'Elle a été jetée ici après sa dernière panne.']],
    sewer: [['cavemouth', "La Grande Bouche d'égout", "Un courant d'air tiède en sort en sifflant."], ['minecart', 'Le Wagonnet perdu', 'Il est rempli de vieilles disquettes.']],
    canyon: [['archrock', "L'Arche des vents", 'Le vent qui passe dessous chante une drôle de mélodie.'], ['spire', "L'Aiguille rouge", 'Une colonne de roche si fine qu\'on se demande comment elle tient debout.'], ['ogregate', 'La Porte de pierre', 'Une porte taillée dans la falaise. Fermée à double tour.'], ['cavemouth', 'La Grotte du canyon', "On entend de l'eau couler, tout au fond."]],
    dino: [['giantnest', 'Le Nid géant', "Des coquilles d'œufs grandes comme des rochers traînent autour."], ['timeclock', "L'Horloge figée", 'Ses aiguilles sont arrêtées sur 3 h 12. Le temps semble suspendu ici.'], ['ruintemple', 'Le Temple des fossiles', 'Des os géants sont incrustés dans ses murs.'], ['cavemouth', 'La Grotte aux os', "Des ossements tapissent l'entrée..."]],
    jungle: [['ruintemple', 'Le Temple englouti', 'Les lianes ont presque avalé ce vieux temple.'], ['totem', 'Le Grand Totem', 'Ses visages sculptés semblent te suivre du regard.'], ['stilthut', 'La Cabane perchée', 'Une cabane sur pilotis, avec un hamac.'], ['watchtower', 'Le Mirador de la jungle', "D'en haut, on voit la canopée à perte de vue."]],
    mangrove: [['stilthut', 'La Maison sur pilotis', 'Les racines de la mangrove la soutiennent comme des mains.'], ['bogshack', 'La Cabane du pêcheur', 'Des filets sèchent au soleil.'], ['dock', 'Le Vieux Ponton', 'Les planches craquent sous les pas.']],
    beach: [['lighthouse', 'Le Phare de la côte', 'Sa lumière guide les Digimon perdus en mer.'], ['wreck', "L'Épave du cargo", 'Une coque échouée, pleine de coquillages.'], ['dock', "L'Embarcadère", 'Un petit quai où accostait jadis un bateau.']],
    cemetery: [['mausoleum', 'Le Mausolée', 'Un caveau de pierre. Quelque chose gratte à la porte...'], ['chapel', 'La Chapelle oubliée', 'Ses vitraux brillent faiblement, même la nuit.'], ['mistgate', 'La Porte des brumes', "Une grille d'où s'échappe un brouillard glacé."]],
    fog: [['mistgate', 'La Porte des brumes', "On dit qu'elle mène à une autre partie du monde numérique."], ['chapel', 'Le Sanctuaire du brouillard', 'Les lanternes y brûlent sans jamais s\'éteindre.'], ['monolith', 'La Pierre qui chuchote', "Colle l'oreille contre la pierre : elle murmure des chiffres."], ['watchtower', 'La Tour perdue', 'Personne ne se souvient de qui l\'a construite.']],
    toy: [['carousel', 'Le Carrousel', 'Il tourne tout seul en jouant une boîte à musique.'], ['toytrain', 'Le Petit Train', "Tchou tchou ! Il fait le tour de la ville sans s'arrêter."], ['watchtower', 'La Tour de cubes', 'Une tour faite de cubes empilés... très, très haut.']],
    snow: [['igloo', "L'Igloo", 'Il fait étonnamment chaud à l\'intérieur.'], ['frozenfall', 'La Cascade gelée', "L'eau s'est figée en pleine chute, comme le temps."], ['chalet', 'Le Refuge des neiges', 'Une tasse de chocolat chaud refroidit sur la table.'], ['icetemple', 'Le Petit Temple de glace', 'Des cristaux bleus y brillent de l\'intérieur.']],
    spring: [['lighthouse', 'Le Phare du lac', "Il éclaire le lac la nuit pour le tramway qui ne passe plus."], ['dock', "L'Embarcadère du lac", 'Des barques y étaient amarrées autrefois.'], ['telescope', "La Longue-vue", 'On y voit la Pointe Coela, de l\'autre côté du lac.'], ['giantflower', 'La Fleur géante', 'Elle se tourne vers le soleil toute la journée.']],
    beetle: [['giantstump', 'La Souche géante', "Ce qu'il reste d'un arbre gigantesque. Des scarabées y vivent par centaines."], ['beetlestatue', 'La Statue du Scarabée', 'Les Digimon insectes viennent la saluer chaque matin.'], ['giantshroom', 'Le Champignon géant', 'Son chapeau est assez grand pour s\'abriter de la pluie.']],
    swamp: [['frogstatue', 'La Statue de la Grenouille', 'Une grenouille de pierre couverte de mousse. Elle cligne de l\'œil ?'], ['bogshack', 'La Cabane du marais', 'Une soupe étrange mijote sur le feu.'], ['stilthut', 'La Hutte sur pilotis', "L'eau monte jusqu'aux marches à la saison des pluies."]],
  };
  const DIGITAL = [['datapanel'], ['antenna'], ['pipe']];   // la touche « monde numérique » de Digimon World 2003
  const NO_DRESS = new Set(['town', 'farm', 'nursery']);
  const GROUND = new Set(['.', 's', ',', ';', 'f', 'j', 'n', 'm', '3', 'v', 'q']);   // sol où l'on peut poser un élément

  // seules les petites plantes se traversent (fougères, roseaux, fleurs...) : pierres, os, crabes... bloquent le passage
  const SOFT = /fern|reeds|flower|grass|clover|starfish|shroom/;
  function dress(m, id) {
    if (m._dressFor === m.rows || m.indoor || m.dress === false || NO_DRESS.has(m.theme) || !KITS[m.theme] || !m.rows) return;
    const W = DW.World, A = DW.Art, kits = KITS[m.theme], seed = [...String(id || m.name)].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 11) & 1023;
    m.objects = m.objects || [];
    // décor retiré dans l'atelier des cartes (maps/retouches.js) : il n'est plus posé
    const T = DW.Retouches && DW.Retouches.de(id), retire = new Set((T && T.retraits) || []), retiré = (kind, x, y) => retire.has(kind + '@' + x + ',' + y);
    // (un lieu marquant retiré dans l'atelier ne revient pas ailleurs : une carte retouchée déplace sa place, et le quai de
    //  la Clairière ou le phare du lac réapparaissaient à côté)
    const sorteRetiree = kind => [...retire].some(r => r.startsWith(kind + '@'));
    // GRILLES (une case = un octet) : l'accès à tous les passages est revérifié après chaque ensemble posé, il faut que
    // ce soit rapide (avant, avec des ensembles de « x,y » : près d'une seconde sur la plage, à chaque entrée sur la carte)
    const MW = m.w, MH = m.h, dans = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
    // cases occupées par les objets déjà posés
    const OCC = new Uint8Array(MW * MH);
    const mark = o => { for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (dans(x, y)) OCC[y * MW + x] = 1; };
    const libere = (x, y) => { if (dans(x, y)) OCC[y * MW + x] = 0; };
    for (const o of m.objects) if (!o.walk && !o.top) mark(o);
    // cases couvertes À L'ÉCRAN par chaque dessin (largeur réelle × échelle, et sa hauteur au-dessus du pied) :
    // deux éléments de décor ne se chevauchent jamais (un champignon ne pousse plus sur un rocher)
    const vis = new Set();
    const sizeOf = kind => { const D = W.OBJ[kind]; if (!D) return [16, 16]; const S = D.scale || (W.OBJ_SCALE && W.OBJ_SCALE[kind]) || 1; return [(typeof D.w === 'number' ? D.w : 32) * S, (typeof D.h === 'number' ? D.h : 32) * S]; };
    const visCells = (kind, x, y, w) => { const [sw, sh] = sizeOf(kind), cw = Math.max(w, Math.ceil(sw / 16 - 0.25)), ch = Math.max(1, Math.ceil(sh / 16 - 0.35)), x0 = x + Math.floor((w - cw) / 2), out = []; for (let yy = y - ch + 1; yy <= y; yy++) for (let xx = x0; xx < x0 + cw; xx++) out.push(xx + ',' + yy); return out; };
    for (const o of m.objects) if (!o.top) for (const k of visCells(o.kind, o.x, o.y + (o.h || 1) - 1, o.w || 1)) vis.add(k);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const I = W.info(m.rows[y][x]); if (I && I.obj) for (const k of visCells(I.obj, x, y, 1)) vis.add(k); }
    // abords à laisser libres
    const KEEP = new Uint8Array(MW * MH), garde = (x, y) => { if (dans(x, y)) KEEP[y * MW + x] = 1; };
    const near = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) garde(x + dx, y + dy); };
    for (const w of [...(m.warps || []), ...(m.doors || [])]) for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) near(x, y, 3);
    for (const k in m.signs || {}) { const [x, y] = k.split(',').map(Number); near(x, y, 2); }
    for (const [x0, y0, x1, y1] of m.dressKeep || []) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) garde(x, y);   // zones à garder nues (ex. les cabines)
    // aux deux bouts des ponts : rien (les parapets bloquent les côtés, un décor au débouché fermerait le passage)
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.rows[y][x] === '_') near(x, y, 2);
    // devant les lieux clés (le Grand Arbre de Kuwagamon) : rien ne doit cacher l'entrée ni le héros
    for (const o of m.objects) if (o.kind === 'grandarbre') {
      const rows = m.rows.map(r => [...r]); let cut = false;
      for (let y = o.y + o.h - 1; y <= o.y + o.h + 6; y++) for (let x = o.x - 3; x <= o.x + o.w + 2; x++) {
        garde(x, y);
        if (rows[y] && 'TtYbBg'.includes(rows[y][x])) { rows[y][x] = '.'; cut = true; }
      }
      if (cut) DW.MapKit.changerLignes(m, rows.map(r => r.join('')));
    }
    for (const n of m.npcs || []) near(n.x, n.y, 2);
    for (const t of m.triggers || []) for (let y = t.y; y < t.y + (t.h || 1); y++) for (let x = t.x; x < t.x + (t.w || 1); x++) near(x, y, 1);
    const SOL = new Uint8Array(MW * MH), DUR = new Uint8Array(MW * MH);   // (sol où poser un élément ; case bloquante)
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const c = m.rows[y][x]; SOL[y * MW + x] = GROUND.has(c) ? 1 : 0; DUR[y * MW + x] = DW.SOLID.has(c) ? 1 : 0; }
    const free = (x, y) => x > 0 && y > 0 && x < MW - 1 && y < MH - 1 && SOL[y * MW + x] && !OCC[y * MW + x] && !KEEP[y * MW + x];
    // accessibilité : cases praticables reliées au premier passage
    const walk = (x, y) => dans(x, y) && !DUR[y * MW + x] && !OCC[y * MW + x];
    const targets = [];
    for (const w of [...(m.warps || []), ...(m.doors || [])]) targets.push([w.x, w.y]);
    for (const n of m.npcs || []) targets.push([n.x, n.y]);
    for (const k in m.signs || {}) targets.push(k.split(',').map(Number));
    // cases atteintes depuis le premier point d'intérêt praticable (grille partagée : à lire aussitôt)
    const SEEN = new Uint8Array(MW * MH), PILE = new Int32Array(MW * MH);
    const reach = () => {
      SEEN.fill(0);
      const start = targets.find(([x, y]) => walk(x, y));
      if (!start) return SEEN;
      let n = 0; SEEN[start[1] * MW + start[0]] = 1; PILE[n++] = start[1] * MW + start[0];
      while (n) {
        const i = PILE[--n], x = i % MW, y = (i - x) / MW;
        if (x + 1 < MW && !SEEN[i + 1] && !DUR[i + 1] && !OCC[i + 1]) { SEEN[i + 1] = 1; PILE[n++] = i + 1; }
        if (x > 0 && !SEEN[i - 1] && !DUR[i - 1] && !OCC[i - 1]) { SEEN[i - 1] = 1; PILE[n++] = i - 1; }
        if (y + 1 < MH && !SEEN[i + MW] && !DUR[i + MW] && !OCC[i + MW]) { SEEN[i + MW] = 1; PILE[n++] = i + MW; }
        if (y > 0 && !SEEN[i - MW] && !DUR[i - MW] && !OCC[i - MW]) { SEEN[i - MW] = 1; PILE[n++] = i - MW; }
      }
      return SEEN;
    };
    const vu = (S, x, y) => dans(x, y) && S[y * MW + x] === 1;
    const ok = (S, [x, y]) => vu(S, x, y) || vu(S, x + 1, y) || vu(S, x - 1, y) || vu(S, x, y + 1) || vu(S, x, y - 1);
    const base = reach().slice(), must = targets.filter(t => ok(base, t));
    // ---------- lieu marquant de la sous-zone (au plus près du centre ; pas si elle a déjà son lieu emblématique)
    const pool = !m.piece && !m.noLandmark && LANDMARKS[m.theme];   // (noLandmark : pas de grand repère, ex. les Dunes des Bébés)
    if (pool) {
      const num = parseInt(String(id).replace(/\D/g, ''), 10), L = pool[(isNaN(num) ? seed : num) % pool.length], D = W.OBJ[L[0]];
      const fw = Math.max(2, Math.round((typeof D.w === 'number' ? D.w : 64) / 16 * 0.8)), fh = (typeof D.h === 'number' ? D.h : 64) > 50 ? 2 : 1;
      const cx0 = Math.floor(m.w / 2), cy0 = Math.floor(m.h / 2);
      search: for (let r = 0; r < Math.max(m.w, m.h) / 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = cx0 + dx - Math.floor(fw / 2), y = cy0 + dy;
        let fits = true;
        for (let yy = y - 1; yy <= y + fh && fits; yy++) for (let xx = x - 1; xx <= x + fw && fits; xx++) if (!free(xx, yy)) fits = false;
        // devant le lieu (sous son rang du bas) : une case accessible, sinon on pourrait le poser dans une poche fermée
        if (![...Array(fw).keys()].some(i => vu(base, x + i, y + fh))) fits = false;
        if (!fits) continue;
        const o = { kind: L[0], x, y, w: fw, h: fh, decor: true, landmark: true };
        if (retiré(L[0], x, y) || sorteRetiree(L[0])) break search;
        if (visCells(L[0], x, y + fh - 1, fw).some(k => vis.has(k))) continue;
        m.objects.push(o); mark(o); for (const k of visCells(L[0], x, y + fh - 1, fw)) vis.add(k);
        const S = reach();
        if (must.some(t => !ok(S, t))) { m.objects.pop(); for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) libere(xx, yy); continue; }
        m.landmark = L[1];
        m.signs = m.signs || {};
        for (let xx = x; xx < x + fw; xx++) m.signs[xx + ',' + (y + fh - 1)] = `« ${L[1]} » — ${L[2]}`;   // on le lit par-devant
        near(x + Math.floor(fw / 2), y, Math.ceil(fw / 2) + 2);
        break search;
      }
    }
    // nombre d'ensembles selon la surface
    const n = Math.round(m.w * m.h / 110);
    for (let i = 0, tries = 0; i < n && tries < n * 8; tries++) {
      const cx = 2 + Math.floor(A.hash(tries, 1, seed) * (m.w - 4)), cy = 2 + Math.floor(A.hash(tries, 2, seed) * (m.h - 4));
      if (!free(cx, cy)) continue;
      // (choix tiré de la carte elle-même, jamais au hasard : le même décor à chaque partie, et dans l'atelier des cartes)
      const kit = A.hash(tries, 3, seed) < 0.1 && m.theme !== 'toy' ? DIGITAL[Math.floor(A.hash(tries, 5, seed) * DIGITAL.length)] : kits[Math.floor(A.hash(tries, 4, seed) * kits.length)];
      const added = []; let gomme = 0;
      kit.forEach((kind, j) => {
        const D = W.OBJ[kind], sw = typeof D.w === 'number' ? D.w : 32, sh = typeof D.h === 'number' ? D.h : 32;   // taille d'après la définition (sans dessiner)
        const spr = { w: sw, h: sh }, tiny = spr.w <= 20 && spr.h <= 16, fw = Math.max(1, Math.round(spr.w / 16 * 0.7));
        const ox = j === 0 ? 0 : Math.round((A.hash(tries, 10 + j, seed) - 0.5) * 6), oy = j === 0 ? 0 : Math.round((A.hash(tries, 20 + j, seed) - 0.5) * 3);
        const x = cx + ox - Math.floor(fw / 2), y = cy + oy;
        if (retiré(kind, x, y)) { gomme++; return; }
        for (let xx = x; xx < x + fw; xx++) if (!free(xx, y)) return;
        const cells = visCells(kind, x, y, fw);
        if (cells.some(k => vis.has(k))) return;
        const v = Math.floor(A.hash(tries, 30 + j, seed) * (W.OBJ[kind].n || 1));
        const o = { kind, v, x, y, w: fw, h: 1, decor: true, ...(tiny && SOFT.test(kind) ? { walk: true } : {}), ...(spr.h < 30 ? { small: true } : {}) };
        m.objects.push(o); added.push(o); o._vis = cells; for (const k of cells) vis.add(k);
        if (!o.walk) mark(o);
      });
      // (un ensemble gommé dans l'atelier compte comme posé : avant, le jeu en reposait un autre plus loin — sur lac11, chaque
      //  botte de foin retirée en faisait apparaître une nouvelle ; les autres ensembles ne bougent pas)
      if (!added.length) { if (gomme) i++; continue; }
      // un ensemble qui coupe un chemin est retiré
      const seen = reach();
      if (must.some(t => !ok(seen, t))) {
        for (const o of added) { m.objects.splice(m.objects.indexOf(o), 1); for (let xx = o.x; xx < o.x + o.w; xx++) libere(xx, o.y); for (const k of o._vis) vis.delete(k); }
        continue;
      }
      // l'espace autour devient réservé : les ensembles restent espacés
      near(cx, cy, 2);
      i++;
    }
    // (plus de bottes de foin : le joueur les trouve laides ; retirées après coup, le reste du décor garde sa place)
    m.objects = m.objects.filter(o => !(o.decor && o.kind === 'haybale'));
    m._dressFor = m.rows;
    // la carte avait déjà été préparée (carte voisine dessinée à l'avance) : on la redessine avec son décor
    if (m.objects.some(o => o.decor) && m.gfx) DW.World.unprepare(m);
  }
  DW.MapKit.dress = dress;
})();
;

// ===== js/maps/palais.js
'use strict';
// =====================================================================
//  INTÉRIEURS À PLUSIEURS ZONES (palais, manoir, usine, temple)
//  Chaque bâtiment = plusieurs pièces reliées : passages latéraux (bords gauche / droit),
//  escaliers dans le mur du fond (montée ou descente). L'entrée du hall (en bas) mène dehors :
//  regions.js relie la porte du grand décor au hall (warp « ? »).
//  Dans la salle la plus profonde : un gardien et un coffre (une seule fois, mémorisé dans state.chests).
// =====================================================================
(function () {
  const MAPS = DW.MAPS, say = (t, s) => DW.say(t, s);

  // ------------------------------------------------------------ une pièce
  // o : { name, w, h, floor, wall, dark, enc, objects, bottomExit }
  // pièces à la taille de l'écran : les coordonnées données sont ramenées à l'échelle (kx, ky)
  const MAXW = 20, MAXH = 15;   // une pièce tient entièrement à l'écran (320 × 240)
  const kx = id => MAPS[id].kx || 1, ky = id => MAPS[id].ky || 1;
  const X = (id, x) => Math.max(1, Math.round(x * kx(id)));
  function room(id, region, o) {
    const sx = Math.min(1, MAXW / o.w), sy = Math.min(1, MAXH / o.h), w = Math.round(o.w * sx), h = Math.round(o.h * sy), rows = [];
    rows.push('0'.repeat(w));
    rows.push('0' + '2'.repeat(w - 2) + '0', '0' + '2'.repeat(w - 2) + '0');
    for (let y = 3; y < h - 1; y++) rows.push('0' + '1'.repeat(w - 2) + '0');
    rows.push('0'.repeat(w));
    const m = MAPS[id] = {
      name: o.name, music: o.music || 'field', bg: 'foret', ambient: 'home', climate: 'village', region, indoor: true,
      rows, floor: o.floor, wall: o.wall, dark: o.dark, npcs: [], signs: {}, warps: [], doors: [], kx: sx, ky: sy, style: o.style,
      objects: (o.objects || []).map(ob => ({ ...ob, x: Math.max(1, Math.min(w - 1 - (ob.w || 1), Math.round(ob.x * sx))), y: ob.back ? ob.y : Math.max(3, Math.min(h - 2 - (ob.h || 1), Math.round(ob.y * sy))) })),
      encounters: o.enc || [], wildN: o.enc && o.enc.length ? 2 : 0,
    };
    m.mid = Math.floor(h / 2);
    return m;
  }
  const open = (m, x, y) => { m.rows[y] = m.rows[y].slice(0, x) + '1' + m.rows[y].slice(x + 1); };
  // passage latéral entre deux pièces (a à gauche de b)
  function side(aId, bId) {
    const A = MAPS[aId], B = MAPS[bId], ya = A.mid, yb = B.mid, wa = A.rows[0].length;
    for (const d of [0, 1]) { open(A, wa - 1, ya + d); open(B, 0, yb + d); }
    const clear = (M, x0, y0) => { M.objects = M.objects.filter(o => o.back || o.walk || !(o.x <= x0 + 2 && o.x + (o.w || 1) >= x0 - 1 && o.y <= y0 + 2 && o.y + (o.h || 1) >= y0 - 1)); };
    clear(A, wa - 3, ya); clear(B, 1, yb);
    A.warps.push({ x: wa - 1, y: ya, w: 1, h: 2, dir: 'right', to: bId, tx: 1, ty: yb });
    B.warps.push({ x: 0, y: yb, w: 1, h: 2, dir: 'left', to: aId, tx: wa - 2, ty: ya });
  }
  // escaliers (dans le mur du fond) entre deux pièces d'étages différents ; up : a monte vers b
  function stairs(aId, ax, bId, bx, up = true) {
    const A = MAPS[aId], B = MAPS[bId];
    ax = X(aId, ax); bx = X(bId, bx);
    for (const [M, x] of [[A, ax], [B, bx]]) M.objects = M.objects.filter(o => !(o.x < x + 2 && o.x + (o.w || 1) > x && (o.back || (!o.walk && o.y <= 4))));   // escaliers devant le décor mural, pied dégagé
    A.objects.push({ kind: up ? 'stairsup' : 'stairsdown', x: ax, y: 1, w: 2, h: 2, back: true });
    B.objects.push({ kind: up ? 'stairsdown' : 'stairsup', x: bx, y: 1, w: 2, h: 2, back: true });
    (A.doors = A.doors || []).push({ x: ax, y: 2, w: 2, dir: 'up', to: bId, tx: bx, ty: 3 });
    (B.doors = B.doors || []).push({ x: bx, y: 2, w: 2, dir: 'up', to: aId, tx: ax, ty: 3 });
  }
  // entrée du hall (en bas, au centre) : regions.js remplace « ? » par la sous-zone du grand décor
  function entrance(id) {
    const m = MAPS[id], w = m.rows[0].length, x = Math.floor(w / 2) - 1, y = m.rows.length - 1;
    open(m, x, y); open(m, x + 1, y);
    m.warps.push({ x, y, w: 2, h: 1, dir: 'down', to: '?', tx: 0, ty: 0 });
    m.entry = { x, y: y - 1 };
    return m.entry;
  }
  // gardien + coffre au trésor (salle la plus profonde)
  function treasure(id, key, guard, items, x, y) {
    const m = MAPS[id], C = () => (DW.state.chests = DW.state.chests || {});
    x = X(id, x); y = Math.max(4, Math.round(y * ky(id)));
    m.objects = m.objects.filter(o => o.back || o.walk || !(Math.abs(o.x - x) <= 1 && o.y >= y - 1 && o.y <= y + 3));   // dégagé autour du coffre
    m.objects.push({ kind: 'chest', x, y, w: 1, h: 1, small: true });
    m.signs[`${x},${y}`] = async () => {
      if (C()[key]) { await say('Le coffre est vide.'); return; }
      if (guard && !C()[key + '_g']) { await say(`Le coffre est fermé par une étrange énergie... ${DW.SPECIES[guard[0]].name} veille sur lui.`); return; }
      C()[key] = true; DW.Audio.sfx('fanfare');
      for (const [it, n] of items) DW.giveItem(it, n);
      await say(`Tu ouvres le coffre : ${items.map(([it, n]) => `${DW.ITEMS[it].name}${n > 1 ? ' ×' + n : ''}`).join(', ')} !`);
      DW.autosave();
    };
    if (guard) m.npcs.push({ sp: guard[0], x, y: y + 2, face: 'down', cond: s => !(s.chests || {})[key + '_g'], talk: async ow => {
      const name = DW.SPECIES[guard[0]].name;
      await say(guard[2] || 'Qui ose entrer ici ? Ce trésor est sous ma garde !', name);
      if ((await DW.ask(`Affronter ${name} ?`)) !== 0) return;
      const res = await ow.battle({ enemy: new DW.Digimon(guard[0], guard[1]), boss: true, intro: `${name} défend le trésor !` });
      if (res !== 'win') return;
      C()[key + '_g'] = true;
      await say('Bien joué... Le trésor est à toi.', name);
    } });
  }

  // ============================================================ MANOIR DU SEIGNEUR GRIS (Overdell)
  {
    const R = 'overdell', dark = { d: 0.45, col: '#3a2a5a' }, wall = { base: '#5a4a6a', alt: '#4a3a5a', pattern: 'diamond', wood: '#3a2430' };
    const enc = [{ sp: 'bakemon', min: 33, max: 35, w: 40 }, { sp: 'sukamon', min: 32, max: 34, w: 15 }, { sp: 'devimon', min: 34, max: 36, w: 8 }];
    room('manoir_hall', R, { name: 'Manoir — Grand hall', w: 30, h: 20, dark, enc, floor: { type: 'herring', cols: ['#6a4a3a', '#4a3226', '#2a1a14'] }, wall,
      objects: [{ kind: 'bigrug', v: 2, x: 11, y: 8, w: 6, h: 3, walk: true }, { kind: 'clock', x: 3, y: 2, w: 1, h: 2, back: true }, { kind: 'frame', x: 20, y: 1, w: 2, h: 1, back: true }, { kind: 'floorlamp', x: 2, y: 15, w: 1, h: 1 }, { kind: 'floorlamp', x: 27, y: 15, w: 1, h: 1 }, { kind: 'bigplant', x: 26, y: 3, w: 1, h: 1 }] });
    room('manoir_biblio', R, { name: 'Manoir — Bibliothèque', w: 26, h: 18, dark, enc, floor: { type: 'carpet', cols: ['#6a2a3a', '#4a1a28', '#2a0e18'] }, wall,
      objects: [0, 4, 8, 12, 16].map(x => ({ kind: 'bookshelf', v: x % 8 ? 1 : 0, x: x + 2, y: 1, w: 2, h: 2, back: true })).concat([{ kind: 'desk', x: 10, y: 8, w: 3, h: 2 }, { kind: 'armchair', v: 1, x: 6, y: 10, w: 1, h: 1 }, { kind: 'floorlamp', x: 20, y: 10, w: 1, h: 1 }]) });
    room('manoir_salle', R, { name: 'Manoir — Salle à manger', w: 26, h: 18, dark, enc, floor: { type: 'tile', cols: ['#4a4a5a', '#2a2a3a', '#1a1a24'] }, wall,
      objects: [{ kind: 'table', x: 9, y: 7, w: 3, h: 2 }, { kind: 'table', x: 13, y: 7, w: 3, h: 2 }, { kind: 'fireplace', x: 11, y: 1, w: 3, h: 2, back: true }, { kind: 'kitchen', v: 1, x: 2, y: 1, w: 4, h: 2, back: true }, { kind: 'pots', x: 21, y: 4, w: 2, h: 1 }] });
    room('manoir_etage', R, { name: 'Manoir — Galerie des portraits', w: 32, h: 16, dark, enc, floor: { type: 'carpet', cols: ['#3a3a6a', '#2a2a4a', '#14142a'] }, wall,
      objects: [6, 12, 18, 24].map(x => ({ kind: 'frame', x, y: 1, w: 2, h: 1, back: true })).concat([{ kind: 'sofa', v: 2, x: 4, y: 9, w: 3, h: 1 }, { kind: 'bigplant', x: 28, y: 9, w: 1, h: 1 }]) });
    room('manoir_chambre', R, { name: 'Manoir — Chambre du Seigneur', w: 24, h: 18, dark, enc, floor: { type: 'carpet', cols: ['#5a2a5a', '#3a1a3a', '#1a0a1a'] }, wall,
      objects: [{ kind: 'bed', x: 4, y: 3, w: 2, h: 2 }, { kind: 'wardrobe', v: 1, x: 18, y: 1, w: 2, h: 2, back: true }, { kind: 'bigrug', v: 1, x: 8, y: 8, w: 5, h: 3, walk: true }, { kind: 'window', v: 1, x: 10, y: 1, w: 2, h: 1, back: true }] });
    room('manoir_grenier', R, { name: 'Manoir — Grenier', w: 24, h: 16, dark: { d: 0.55, col: '#2a2030' }, enc, floor: { type: 'herring', cols: ['#5a4a3a', '#3a2e24', '#1e1814'] }, wall: { base: '#4a3a30', alt: '#3a2e26', pattern: 'plain', wood: '#2a1e18' },
      objects: [{ kind: 'crates', x: 3, y: 4, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 4, y: 4, w: 1, h: 1, small: true }, { kind: 'sacks', x: 18, y: 5, w: 2, h: 1 }, { kind: 'chest', x: 20, y: 10, w: 1, h: 1, small: true }, { kind: 'teddy', x: 8, y: 10, w: 1, h: 1 }] });
    room('manoir_cave', R, { name: 'Manoir — Cave', w: 26, h: 18, dark: { d: 0.6, col: '#1a1428' }, enc, floor: { type: 'stone', cols: ['#4a4a52', '#34343a', '#1a1a20'] }, wall: { base: '#3a3a44', alt: '#2e2e36', pattern: 'brick', wood: '#1e1e24' },
      objects: [{ kind: 'sacks', x: 3, y: 5, w: 2, h: 1 }, { kind: 'crates', x: 20, y: 5, w: 1, h: 1, small: true }, { kind: 'pots', x: 10, y: 4, w: 2, h: 1 }] });
    room('manoir_crypte', R, { name: 'Manoir — Crypte', w: 24, h: 18, dark: { d: 0.7, col: '#14102a' }, enc: [{ sp: 'bakemon', min: 35, max: 37, w: 30 }, { sp: 'devimon', min: 35, max: 37, w: 12 }], floor: { type: 'stone', cols: ['#3a3444', '#2a2434', '#14101c'] }, wall: { base: '#2a2434', alt: '#221c2c', pattern: 'brick', wood: '#14101c' },
      objects: [{ kind: 'gargoyle', x: 4, y: 3, w: 1, h: 1 }, { kind: 'gargoyle', x: 19, y: 3, w: 1, h: 1 }, { kind: 'monolith', x: 11, y: 3, w: 2, h: 1 }] });
    side('manoir_biblio', 'manoir_hall'); side('manoir_hall', 'manoir_salle'); side('manoir_etage', 'manoir_chambre'); side('manoir_crypte', 'manoir_cave');
    stairs('manoir_hall', 6, 'manoir_etage', 14); stairs('manoir_etage', 26, 'manoir_grenier', 11);
    stairs('manoir_hall', 23, 'manoir_cave', 12, false);
    entrance('manoir_hall');
    treasure('manoir_crypte', 'manoir', ['devimon', 36, "Le Seigneur Gris n'est plus là... mais son trésor, je le garde !"], [['aile_noire', 1], ['super_reveil', 1]], 11, 7);
    treasure('manoir_grenier', 'manoir_grenier', null, [['gland_or', 1], ['cartes', 2]], 12, 6);
  }

  // ============================================================ USINE (Ville-Usine)
  {
    const R = 'usine', floor = { type: 'tile', cols: ['#7a7e88', '#5e626c', '#3a3e46'] }, wall = { base: '#6a7078', alt: '#5a6068', pattern: 'stripes', wood: '#3a3e44' };
    const enc = [{ sp: 'tentomon', min: 21, max: 23, w: 30 }, { sp: 'kunemon', min: 20, max: 22, w: 20 }, { sp: 'kabuterimon', min: 23, max: 25, w: 10 }, { sp: 'numemon', min: 21, max: 23, w: 15 }];
    room('usine_hall', R, { name: 'Usine — Hall', w: 30, h: 20, enc, floor, wall, objects: [{ kind: 'conveyor', x: 4, y: 6, w: 3, h: 1 }, { kind: 'conveyor', x: 22, y: 6, w: 3, h: 1 }, { kind: 'battery', x: 13, y: 4, w: 2, h: 1 }, { kind: 'crates', x: 3, y: 14, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 26, y: 14, w: 1, h: 1, small: true }] });
    room('usine_chaine', R, { name: 'Usine — Chaîne de montage', w: 32, h: 18, enc, floor, wall, objects: [3, 7, 11, 15, 19, 23].map(x => ({ kind: 'conveyor', x, y: 7, w: 3, h: 1 })).concat([{ kind: 'robotarm', x: 9, y: 10, w: 1, h: 1, small: true }, { kind: 'robotarm', x: 21, y: 10, w: 1, h: 1, small: true }]) });
    room('usine_entrepot', R, { name: 'Usine — Entrepôt', w: 26, h: 18, enc, floor: { type: 'stone', cols: ['#6a6a60', '#54544a', '#34342c'] }, wall, objects: [3, 5, 7, 17, 19, 21].map((x, i) => ({ kind: 'crates', v: i % 2, x, y: 4 + (i % 3) * 3, w: 1, h: 1, small: true })).concat([{ kind: 'sacks', x: 11, y: 5, w: 2, h: 1 }, { kind: 'tank', v: 1, x: 12, y: 11, w: 2, h: 1 }]) });
    room('usine_machines', R, { name: 'Usine — Salle des machines', w: 28, h: 18, dark: { d: 0.4, col: '#2a3040' }, enc, floor: { type: 'tile', cols: ['#4a4e58', '#363a42', '#22252c'] }, wall, objects: [{ kind: 'tank', x: 4, y: 4, w: 2, h: 1 }, { kind: 'tank', v: 2, x: 21, y: 4, w: 2, h: 1 }, { kind: 'battery', x: 12, y: 8, w: 2, h: 1 }, { kind: 'datapanel', x: 3, y: 12, w: 1, h: 1, small: true }] });
    room('usine_generateur', R, { name: 'Usine — Générateur', w: 24, h: 18, dark: { d: 0.5, col: '#203048' }, enc, floor: { type: 'tile', cols: ['#3a3e4a', '#2a2e38', '#181a22'] }, wall, objects: [{ kind: 'battery', x: 6, y: 4, w: 2, h: 1 }, { kind: 'battery', x: 15, y: 4, w: 2, h: 1 }, { kind: 'datapanel', x: 11, y: 3, w: 1, h: 1, small: true }] });
    room('usine_bureau', R, { name: 'Usine — Bureau du directeur', w: 22, h: 16, floor: { type: 'carpet', cols: ['#3a4a6a', '#2a3650', '#141c2c'] }, wall: { base: '#c8c4b8', alt: '#b8b4a8', pattern: 'plain', wood: '#5a4a3a' }, objects: [{ kind: 'desk', x: 9, y: 5, w: 3, h: 2 }, { kind: 'bookshelf', x: 2, y: 1, w: 2, h: 2, back: true }, { kind: 'crttv', x: 16, y: 4, w: 2, h: 1 }, { kind: 'bigplant', x: 18, y: 10, w: 1, h: 1 }] });
    side('usine_chaine', 'usine_hall'); side('usine_hall', 'usine_entrepot'); side('usine_generateur', 'usine_machines');
    stairs('usine_hall', 14, 'usine_machines', 13, false); stairs('usine_entrepot', 22, 'usine_bureau', 4);
    entrance('usine_hall');
    treasure('usine_generateur', 'usine', ['kabuterimon', 25, 'BZZZ... ACCÈS INTERDIT... PROTECTION DU GÉNÉRATEUR !'], [['puce_dva', 1], ['pm_g', 1]], 11, 8);
    treasure('usine_bureau', 'usine_bureau', null, [['disque_omni', 1], ['gland_or', 1]], 4, 6);
  }

  // ============================================================ CHÂTEAU DE MONZAEMON (Ville des Jouets)
  {
    const R = 'jouets', wall = { base: '#f0c8e0', alt: '#e0a8c8', pattern: 'dots', wood: '#a85a8a' };
    const enc = [{ sp: 'patamon', min: 23, max: 25, w: 25 }, { sp: 'numemon', min: 23, max: 25, w: 20 }, { sp: 'penguinmon', min: 23, max: 25, w: 15 }];
    room('chateau_hall', R, { name: 'Château — Hall des sourires', w: 30, h: 20, enc, floor: { type: 'tile', cols: ['#f8e0f0', '#e8b8d8', '#c890b0'] }, wall, objects: [{ kind: 'bigrug', v: 0, x: 11, y: 8, w: 6, h: 3, walk: true }, { kind: 'teddy', x: 4, y: 4, w: 1, h: 1 }, { kind: 'teddy', x: 24, y: 4, w: 1, h: 1 }, { kind: 'bigplant', x: 2, y: 14, w: 1, h: 1 }] });
    room('chateau_jouets', R, { name: 'Château — Salle des jouets', w: 28, h: 18, enc, floor: { type: 'carpet', cols: ['#7ab8f0', '#5a98d0', '#3a6aa0'] }, wall, objects: [{ kind: 'carousel', x: 10, y: 6, w: 5, h: 3 }, { kind: 'teddy', x: 4, y: 11, w: 1, h: 1 }, { kind: 'teddy', x: 22, y: 11, w: 1, h: 1 }, { kind: 'cushion', v: 1, x: 18, y: 4, w: 1, h: 1, small: true }] });
    room('chateau_cuisine', R, { name: 'Château — Cuisines', w: 26, h: 18, enc, floor: { type: 'tile', cols: ['#ffffff', '#e8d8e0', '#c8b0c0'] }, wall: { base: '#f8f0d8', alt: '#e8e0c8', pattern: 'stripes', wood: '#c88a5a' }, objects: [{ kind: 'kitchen', x: 2, y: 1, w: 4, h: 2, back: true }, { kind: 'oven', x: 9, y: 1, w: 3, h: 2, back: true }, { kind: 'fridge', x: 14, y: 1, w: 1, h: 2, back: true }, { kind: 'table', x: 10, y: 9, w: 3, h: 2 }, { kind: 'pots', x: 19, y: 6, w: 2, h: 1 }] });
    room('chateau_bal', R, { name: 'Château — Salle de bal', w: 32, h: 18, enc, floor: { type: 'herring', cols: ['#e8c890', '#c8a070', '#8a6a40'] }, wall, objects: [{ kind: 'piano', x: 3, y: 3, w: 2, h: 2 }, { kind: 'bigrug', v: 2, x: 12, y: 7, w: 6, h: 3, walk: true }, { kind: 'floorlamp', x: 2, y: 13, w: 1, h: 1 }, { kind: 'floorlamp', x: 29, y: 13, w: 1, h: 1 }] });
    room('chateau_royale', R, { name: 'Château — Chambre royale', w: 24, h: 18, floor: { type: 'carpet', cols: ['#f07ab0', '#d05a90', '#a03a6a'] }, wall, objects: [{ kind: 'bed', x: 10, y: 3, w: 2, h: 2 }, { kind: 'wardrobe', x: 3, y: 1, w: 2, h: 2, back: true }, { kind: 'teddy', x: 18, y: 5, w: 1, h: 1 }] });
    room('chateau_oubliettes', R, { name: 'Château — Oubliettes', w: 24, h: 18, dark: { d: 0.55, col: '#2a1a2a' }, enc: [{ sp: 'numemon', min: 25, max: 27, w: 30 }, { sp: 'sukamon', min: 25, max: 27, w: 20 }], floor: { type: 'stone', cols: ['#5a4a5a', '#3a2e3a', '#1e181e'] }, wall: { base: '#4a3a4a', alt: '#3a2e3a', pattern: 'brick', wood: '#1e181e' }, objects: [{ kind: 'sacks', x: 3, y: 4, w: 2, h: 1 }, { kind: 'crates', x: 19, y: 4, w: 1, h: 1, small: true }] });
    side('chateau_jouets', 'chateau_hall'); side('chateau_hall', 'chateau_cuisine'); side('chateau_bal', 'chateau_royale');
    stairs('chateau_hall', 6, 'chateau_bal', 15); stairs('chateau_hall', 22, 'chateau_oubliettes', 11, false);
    entrance('chateau_hall');
    treasure('chateau_oubliettes', 'chateau', ['ogremon', 27, "Les sourires, ça m'énerve ! Ce trésor restera ici, dans le noir !"], [['x_bandage', 1], ['cartes', 3]], 11, 8);
    treasure('chateau_royale', 'chateau_royale', null, [['melon', 1], ['pomme_bleue', 2]], 18, 10);
  }

  // ============================================================ TEMPLE ENGLOUTI
  {
    const R = 'jungle', wall = { base: '#6a8a6a', alt: '#5a7a5a', pattern: 'brick', wood: '#3a4a3a' }, floor = { type: 'stone', cols: ['#8a9a7a', '#6a7a5e', '#3a4a34'] };
    const enc = [{ sp: 'togemon', min: 27, max: 29, w: 25 }, { sp: 'kuwagamon', min: 27, max: 29, w: 20 }, { sp: 'palmon', min: 26, max: 28, w: 20 }];
    room('temple_parvis', R, { name: 'Temple — Parvis intérieur', w: 30, h: 20, dark: { d: 0.35, col: '#1a3a2a' }, enc, floor, wall, objects: [{ kind: 'stonelantern', x: 6, y: 6, w: 1, h: 1 }, { kind: 'stonelantern', x: 23, y: 6, w: 1, h: 1 }, { kind: 'bigplant', x: 3, y: 14, w: 1, h: 1 }, { kind: 'bigplant', x: 26, y: 14, w: 1, h: 1 }] });
    room('temple_colonnes', R, { name: 'Temple — Salle des colonnes', w: 32, h: 18, dark: { d: 0.4, col: '#1a3a2a' }, enc, floor, wall, objects: [6, 12, 19, 25].flatMap(x => [{ kind: 'monolith', x, y: 4, w: 1, h: 1 }, { kind: 'monolith', x, y: 11, w: 1, h: 1 }]) });
    room('temple_galerie_o', R, { name: 'Temple — Galerie ouest', w: 24, h: 16, dark: { d: 0.45, col: '#1a3a2a' }, enc, floor, wall, objects: [{ kind: 'gargoyle', x: 4, y: 3, w: 1, h: 1 }, { kind: 'stonelantern', x: 18, y: 8, w: 1, h: 1 }] });
    room('temple_galerie_e', R, { name: 'Temple — Galerie est', w: 24, h: 16, dark: { d: 0.45, col: '#1a3a2a' }, enc, floor, wall, objects: [{ kind: 'gargoyle', x: 18, y: 3, w: 1, h: 1 }, { kind: 'stonelantern', x: 5, y: 8, w: 1, h: 1 }] });
    room('temple_sanctuaire', R, { name: 'Temple — Sanctuaire', w: 24, h: 18, dark: { d: 0.3, col: '#2a4a3a' }, floor: { type: 'tile', cols: ['#c8d8b8', '#a8b898', '#6a7a5a'] }, wall, objects: [{ kind: 'monolith', x: 11, y: 5, w: 2, h: 1 }, { kind: 'stonelantern', x: 5, y: 5, w: 1, h: 1 }, { kind: 'stonelantern', x: 18, y: 5, w: 1, h: 1 }] });
    room('temple_crypte', R, { name: 'Temple — Crypte engloutie', w: 24, h: 18, dark: { d: 0.65, col: '#0e2a1e' }, enc: [{ sp: 'togemon', min: 29, max: 31, w: 25 }, { sp: 'devimon', min: 30, max: 32, w: 8 }], floor: { type: 'stone', cols: ['#4a5a4a', '#344034', '#1a221a'] }, wall: { base: '#3a4a3a', alt: '#2e3a2e', pattern: 'brick', wood: '#1a221a' }, objects: [{ kind: 'gargoyle', x: 4, y: 3, w: 1, h: 1 }, { kind: 'gargoyle', x: 19, y: 3, w: 1, h: 1 }] });
    side('temple_galerie_o', 'temple_colonnes'); side('temple_colonnes', 'temple_galerie_e');
    stairs('temple_parvis', 14, 'temple_colonnes', 15); stairs('temple_colonnes', 26, 'temple_sanctuaire', 11); stairs('temple_parvis', 4, 'temple_crypte', 11, false);
    entrance('temple_parvis');
    treasure('temple_crypte', 'temple', ['devimon', 31, "La lumière ne passera pas ! Ce temple appartient aux ténèbres !"], [['aile_blanche', 1], ['omnipotent', 1]], 11, 8);
    treasure('temple_sanctuaire', 'temple_sanct', null, [['fruit_sage', 1], ['manuel', 1]], 11, 7);
  }

  const STYLE = {
    manoir: { wall: ['frame', 'window'], corner: 'bigplant' }, usine: { wall: ['window'], corner: 'crates' },
    chateau: { wall: ['window', 'frame'], corner: 'teddy' }, temple: { wall: ['scroll'], corner: 'stonelantern' },
  };
  for (const id in MAPS) {
    const m = MAPS[id], S = STYLE[id.split('_')[0]];
    if (!S || !m.kx) continue;
    const w = m.rows[0].length, h = m.rows.length, used = x => m.objects.some(o => o.back && o.x < x + 2 && o.x + (o.w || 1) > x) || m.doors.some(d => d.x < x + 2 && d.x + d.w > x);
    for (let x = 3, k = 0; x < w - 4; x += 5, k++) if (!used(x)) m.objects.push({ kind: S.wall[k % S.wall.length], v: k % 2, x, y: 1, w: 2, h: 1, back: true });
    for (const [x, y] of [[1, h - 3], [w - 2, h - 3]]) if (!m.warps.some(wp => Math.abs(wp.y - y) <= 2 && Math.abs(wp.x - x) <= 1) && !m.objects.some(o => !o.back && Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 1))
      m.objects.push({ kind: S.corner, v: (x + y) % 2, x, y, w: 1, h: 1, small: S.corner === 'crates' });
  }

  DW.Palais = { room, side, stairs, treasure, entrance };
})();
;

// ===== js/maps/foret.js
'use strict';
// =====================================================================
//  FORÊT DE L'ÎLE DES FICHIERS (4 zones)
//  Clairière de l'Arrivée → Sentier des Murmures → Bois des Géants → Lisière du Ravin
// =====================================================================
(function () {
  const { say, st, healAll, forestGen, recruitNPC, zoomGen, zoomMap, zpt } = DW.MapKit;
  const MAPS = DW.MAPS;

  // Kuwagamon, premier boss, se cache dans le Grand Arbre de la clairière : maps/kuwagamon.js

  // ------------------------------------------------------------ 1. CLAIRIÈRE DE L'ARRIVÉE (36x30)
  MAPS.clairiere = {
    name: "Clairière de l'Arrivée", music: 'forest', bg: 'foret', ambient: 'forest', theme: 'spring', climate: 'forest', rate: 0.13, region: 'foret', wildN: 9,
    build() { this.rows = forestGen(zoomGen({ landmarks: [['<', 3], ['?', 3]], avoid: [[17, 11], [30, 15]],
      w: 36, h: 30, seed: 1,
      clearings: [{ x: 18, y: 12, rx: 12, ry: 7.5 }, { x: 9, y: 9, rx: 4, ry: 3.5 }],
      paths: [{ pts: [[17, 14], [17, 20], [18, 25], [17, 30]], r: 1.8 }, { pts: [[17, -1], [17, 4], [17, 10]], r: 1.6 }, { pts: [[-1, 15], [5, 15], [9, 13]], r: 1.6 }],   // (à l'ouest : le désert, chapitre 3)
      tall: [{ x: 27, y: 8, r: 3 }, { x: 25, y: 16, r: 2.2 }],
      bigtrees: [],
      free: [[17, 12, 5], [9, 9, 3], [28, 10, 4.5]],   // dégagé autour du Grand Arbre
      set: [[9, 8, 'O'], [19, 21, 'S']],
    })); },
    encounters: [{ sp: 'botamon', min: 3, max: 4, w: 10 }, { sp: 'yuramon', min: 3, max: 4, w: 10 }, { sp: 'nyokimon', min: 3, max: 4, w: 8 }, { sp: 'yokomon', min: 6, max: 7, w: 35 }, { sp: 'kunemon', min: 6, max: 8, w: 35 }, { sp: 'tanemon', min: 6, max: 7, w: 15 }, { sp: 'mushroomon', min: 6, max: 8, w: 15, night: 40 }],
    warps: [{ x: 16, y: 29, w: 3, h: 1, dir: 'down', to: 'sentier', tx: 21, ty: 0 }],
    // le Grand Arbre où se cache Kuwagamon : une énigme dans l'écorce ouvre le tronc (maps/kuwagamon.js)
    objects: [{ kind: 'grandarbre', v: 0, x: 26, y: 8, w: 4, h: 3 }],
    doors: [{ x: 27, y: 10, w: 2, dir: 'up', to: 'arbre_kuwagamon', tx: 9, ty: 12, cond: () => DW.Enigmes.solved('kuwa_arbre') }],
    populate() { const o = this.objects.find(x => x.kind === 'grandarbre'), v = DW.Kuwa_level ? DW.Kuwa_level() : 0; if (o && o.v !== v) { o.v = v; DW.World.unprepare(this); } },
    npcs: [
      { sp: 'yokomon', x: 24, y: 13, face: 'right', cond: s => !s.flags.kuwagamon, talk: async () => {
        await say("Chut ! Tu entends ce bourdonnement ? Il vient du Grand Arbre...", 'Yokomon');
        await say("Depuis qu'un énorme insecte rouge s'y est caché, on n'ose plus jouer dans la clairière. Il y a des mots bizarres gravés sur le tronc...", 'Yokomon');
      } },
      recruitNPC({ sp: 'yokomon', x: 17, y: 11, face: 'left', noBattle: true, cond: s => s.flags.kuwagamon,
        lines: ["Merci d'avoir chassé Kuwagamon ! On avait si peur qu'on n'osait plus rentrer...", 'On se souvient maintenant : on vivait à la Ville des Fichiers !'],
        win: "On rentre en ville ! On a plein d'idées... Tu verras bien !" }),
    ],
    triggers: [],
    signs: {
      '9,8': async () => {
        const r = await DW.ask("Une source scintillante... Des chiffres lumineux s'en échappent. Se reposer ici ?");
        if (r === 0) { const [hx, hy] = zpt('clairiere', 9, 9); st().heal = { map: 'clairiere', x: hx, y: hy + 1 }; await healAll('Tes Digimon sont en pleine forme !'); DW.autosave(); }
      },
      '19,21': "Clairière de l'Arrivée, au cœur de la forêt. Sud : Sentier des Murmures.",
      ...Object.fromEntries([26, 27, 28, 29].map(x => [`${x},10`, ow => DW.Kuwa.tree(ow)])),   // l'énigme du Grand Arbre
    },
  };

  // ------------------------------------------------------------ 2. SENTIER DES MURMURES (44x36)
  MAPS.sentier = {
    name: 'Sentier des Murmures', music: 'forest', bg: 'foret', ambient: 'forest', theme: 'misty', climate: 'forest', rate: 0.11, region: 'foret', wildN: 9,
    build() { this.rows = forestGen(zoomGen({ landmarks: [['>', 4], ['$', 3]], avoid: [[4, 13], [6, 24], [37, 12], [4, 13]],
      w: 44, h: 36, seed: 2, autoTall: 0.54,
      paths: [
        { pts: [[22, -1], [22, 5], [15, 10], [14, 14], [14, 20], [17, 22], [27, 25], [30, 30], [30, 36]], r: 2 },
        { pts: [[16, 22], [10, 24], [6, 25]], r: 1.5, dirt: false },
        { pts: [[15, 10], [7, 9], [5, 14]], r: 1.3, dirt: false },
        { pts: [[-1, 12.5], [4, 12.5], [7, 9]], r: 2 },   // (à l'ouest : la Plaine des Panneaux, chapitre 3)
        { pts: [[27, 25], [36, 22], [38, 19], [38, 12], [44, 12]], r: 1.6, dirt: false },
      ],
      clearings: [{ x: 6, y: 25, rx: 4.5, ry: 4 }, { x: 38, y: 12, rx: 4, ry: 3.5 }, { x: 22, y: 4, rx: 4, ry: 3 }],
      rivers: [{ pts: [[3, 17], [8, 17], [16, 18], [26, 17], [34, 18], [45, 16]], r: 1.4 }], lakes: [{ x: 3, y: 17.5, rx: 2.6, ry: 2 }],   // (la rivière naît d'une source, au pied du désert)
      tall: [{ x: 10, y: 12, r: 3 }, { x: 24, y: 28, r: 3.5 }, { x: 33, y: 30, r: 2.5 }],
      bigtrees: [[30, 9]],
      free: [[6, 25, 3], [38, 12, 3]],
      set: [[23, 7, 'S'], [5, 14, '.'], [4, 13, '.'], [6, 22, 'G'], [9, 27, 'G'], [3, 26, 'G']],
    })); },
    encounters: [
      { sp: 'kunemon', min: 5, max: 7, w: 40 }, { sp: 'yokomon', min: 5, max: 6, w: 25 },
      { sp: 'mushroomon', min: 5, max: 7, w: 10, night: 45 }, { sp: 'tanemon', min: 5, max: 6, w: 12 }, { sp: 'elecmon', min: 6, max: 7, w: 6 }, { sp: 'tsunomon', min: 5, max: 6, w: 8 },
      { sp: 'punimon', min: 3, max: 4, w: 10 }, { sp: 'botamon', min: 3, max: 4, w: 6 },
    ],
    warps: [
      { x: 21, y: 0, w: 3, h: 1, dir: 'up', to: 'clairiere', tx: 16, ty: 29 },
      { x: 29, y: 35, w: 3, h: 1, dir: 'down', to: 'geants', tx: 29, ty: 0 },
      { x: 43, y: 11, w: 1, h: 3, dir: 'right', to: 'prairie', tx: 0, ty: 13 },
    ],
    npcs: [
      { sp: 'tanemon', x: 6, y: 24, face: 'right', talk: async () => {
        const s = st();
        await say('Psst... Fais attention. Un énorme Digimon rouge se cache dans le Grand Arbre de la Clairière, au nord de la forêt...', 'Tanemon');
        if (!s.flags.gift_tanemon) {
          s.flags.gift_tanemon = true;
          await say('Tiens, prends ça. Ça te portera chance !', 'Tanemon');
          DW.giveItem('remede', 2); DW.Audio.sfx('buy');
          await say('Tu reçois 2 Remèdes !');
        } else await say('Les champignons lumineux brillent encore plus fort la nuit. C\'est joli, hein ?', 'Tanemon');
      } },
      recruitNPC({ sp: 'elecmon', x: 37, y: 12, lvl: 10, face: 'left',
        lines: ["Halte ! Je suis Elecmon. Autrefois, je vivais à la Ville des Fichiers...", "Mais je ne suivrai qu'un dresseur plus fort que moi !"],
        win: "Quelle force ! D'accord, je rentre en ville. J'ai une petite idée de ce que je vais y faire..." }),
    ],
    triggers: [],
    signs: { '23,7': 'Les murmures que tu entends ? Ce sont les données de la forêt qui circulent...' },
  };

  // ------------------------------------------------------------ 2b. PRAIRIE DES LUCIOLES (40x30) — beaucoup de Digimon sauvages
  MAPS.prairie = {
    name: 'Prairie des Lucioles', music: 'forest', bg: 'foret', ambient: 'forest', theme: 'meadow', climate: 'forest', rate: 0.16, region: 'foret', wildN: 9,
    build() { this.rows = forestGen(zoomGen({ landmarks: [['{', 7], ['!', 2]], avoid: [[7, 15], [31, 9], [21, 17], [18, 4]],
      w: 40, h: 30, seed: 5, autoTall: 0.42, deco: 0.7,
      clearings: [{ x: 20, y: 15, rx: 17, ry: 11 }],
      paths: [{ pts: [[-1, 14], [8, 14], [16, 17], [26, 12], [33, 15], [41, 13]], r: 1.6 }, { pts: [[16, 17], [14, 21], [13, 25]], r: 1.2 }],   // (un petit pont franchit la rivière vers le sud de la prairie)
      lakes: [{ x: 28, y: 21, rx: 4, ry: 2.6 }],
      rivers: [{ pts: [[-1, 16], [8, 18], [16, 21.5], [25, 21]], r: 1.4 }],   // (la rivière du Sentier des Murmures continue jusqu'à la mare)
      tall: [{ x: 12, y: 9, r: 4 }, { x: 22, y: 24, r: 3.5 }, { x: 32, y: 8, r: 3.5 }],
      bigtrees: [[34, 22]],
      free: [[5, 12, 2.5], [33, 15, 2.5], [38, 13, 2.2]],
      set: [[33, 14, 'S']],
    })); },
    encounters: [
      { sp: 'yokomon', min: 4, max: 6, w: 25 }, { sp: 'tanemon', min: 4, max: 6, w: 18 }, { sp: 'kunemon', min: 4, max: 6, w: 20 },
      { sp: 'bukamon', min: 4, max: 5, w: 12 }, { sp: 'biyomon', min: 5, max: 6, w: 8 }, { sp: 'gabumon', min: 5, max: 6, w: 5 },
      { sp: 'mushroomon', min: 5, max: 6, w: 8, night: 35 },
      { sp: 'nyokimon', min: 3, max: 4, w: 12 }, { sp: 'yuramon', min: 3, max: 4, w: 8 }, { sp: 'punimon', min: 3, max: 4, w: 6 },
    ],
    warps: [{ x: 0, y: 13, w: 1, h: 3, dir: 'left', to: 'sentier', tx: 43, ty: 11 }, { x: 39, y: 12, w: 1, h: 3, dir: 'right', to: 'berceau', tx: 0, ty: 11 }],
    npcs: [
      { sp: 'yokomon', x: 7, y: 15, face: 'right', talk: async () => {
        await say('Bienvenue dans la prairie ! Plein de Digimon viennent jouer dans ces herbes hautes.', 'Yokomon');
        await say("Pour digivoluer, il faut s'entraîner au terrain au sud de la Ville des Fichiers. Les combats, eux, font grandir ton potentiel !", 'Yokomon');
        await say('Regarde la table des Digivolutions dans le menu pour savoir quoi travailler.', 'Yokomon');
      } },
      recruitNPC({ sp: "kunemon", x: 23, y: 7, lvl: 10, face: "left",   // (dans un coin dégagé au nord-est : plus caché sous les arbres)
        lines: ["Bzzz ! Je suis Kunemon. Je ramasse tout ce qui traîne et je le range dans mes cocons de soie...", "Tu veux mes trésors ? Bats-moi d'abord, bzzz !"],
        win: "Bzzz... Tu es fort ! D'accord, je viens en ville. J'ai une idée pour ranger tout ça !" }),
      recruitNPC({ sp: 'mushroomon', x: 21, y: 17, lvl: 10, face: 'left', cond: () => DW.Time.isNight(),
        lines: ["Hihihi ! La nuit, je cueille les meilleurs champignons de la prairie...", "Avant, je vivais en ville, je crois... Montre-moi ce que tu vaux !"],
        win: "D'accord, d'accord ! Je rentre à la Ville des Fichiers. Surprise, surprise, hihi !" }),
    ],
    triggers: [],
    signs: { '33,14': 'Prairie des Lucioles. La nuit, des milliers de lucioles dansent au-dessus des herbes.  → Est : Village des Bébés' },
  };

  // ------------------------------------------------------------ 3. BOIS DES GÉANTS (44x36)
  MAPS.geants = {
    name: 'Bois des Géants', music: 'forest', bg: 'foret', ambient: 'forest', theme: 'deep', climate: 'forest', rate: 0.12, region: 'foret', wildN: 9,
    build() { this.rows = forestGen(zoomGen({ landmarks: [['}', 5], ['$', 2], ['?', 2]], avoid: [[14, 11], [28, 14], [28, 16], [7, 15], [35, 29]],
      w: 44, h: 36, seed: 3, autoTall: 0.53,
      paths: [
        { pts: [[30, -1], [30, 6], [24, 12], [26, 19], [18, 24], [14, 30], [14, 36]], r: 2 },
        { pts: [[18, 24], [26, 27], [32, 29]], r: 1.5, dirt: false },
        { pts: [[24, 12], [12, 10], [8, 15]], r: 1.4, dirt: false },
        { pts: [[8, 15], [3, 15], [-1, 15]], r: 1.4 },   // vers le Bosquet des Pousses, à l'ouest
      ],
      clearings: [{ x: 22, y: 17, rx: 7, ry: 5 }, { x: 8, y: 16, rx: 4, ry: 3.5 }, { x: 32, y: 29, rx: 6, ry: 4 }],
      lakes: [{ x: 35, y: 16, rx: 5.5, ry: 4.2 }],
      tall: [{ x: 12, y: 21, r: 3 }, { x: 33, y: 30, r: 3 }],
      bigtrees: [[19, 8], [36, 7], [9, 26], [27, 30], [16, 17]],
      free: [[22, 17, 3]],
      set: [[27, 19, 'S'], [22, 12, 'y']],
    })); },
    encounters: [
      { sp: 'bukamon', min: 4, max: 5, w: 25 }, { sp: 'yokomon', min: 4, max: 5, w: 25 }, { sp: 'tanemon', min: 4, max: 5, w: 15 },
      { sp: 'kunemon', min: 5, max: 6, w: 15 }, { sp: 'betamon', min: 5, max: 6, w: 12 }, { sp: 'mushroomon', min: 5, max: 6, w: 8, night: 35 },
    ],
    warps: [
      { x: 29, y: 0, w: 3, h: 1, dir: 'up', to: 'sentier', tx: 29, ty: 35 },
      { x: 13, y: 35, w: 3, h: 1, dir: 'down', to: 'lisiere', tx: 17, ty: 0 },
      { x: 0, y: 14, w: 1, h: 3, dir: 'left', to: 'bosquet', tx: 39, ty: 14 },
    ],
    npcs: [
      { sp: 'bukamon', x: 28, y: 14, face: 'right', talk: async () => {
        await say('Blub blub ! Ce lac est le meilleur endroit de toute l\'île pour faire la sieste !', 'Bukamon');
        await say('Les arbres d\'ici sont plus vieux que l\'île elle-même. On dit qu\'ils gardent les données des anciens Digimon.', 'Bukamon');
      } },
      recruitNPC({ sp: 'betamon', x: 28, y: 17, lvl: 9, face: 'right',   // (au bord de l'eau, hors des herbes hautes qui le cachaient presque entièrement)
        lines: ["Bloub... Je surveille ce lac. Avant, j'habitais en ville, il me semble.", "Si tu es assez fort pour me battre, je te suivrai !"],
        win: 'Bloub bloub ! Je rentre en ville. Je sais exactement ce qui lui manque !' }),
      recruitNPC({ sp: "palmon", x: 8, y: 15, lvl: 9, face: "right",   // (dans la clairière reculée à l'ouest, bien visible)
        lines: ["Oh ! Un visiteur... Je suis Palmon. Je fais pousser des fleurs entre ces arbres géants.", "On m'a dit que la ville renaissait... Mais je ne partirai qu'avec quelqu'un de fort !"],
        win: "Tu as gagné ! D'accord, je viens en ville. Mes graines vont adorer ça !" }),
    ],
    triggers: [],
    signs: { '27,19': 'Bois des Géants. Ne réveillez pas les arbres qui dorment.' },
  };

  // ------------------------------------------------------------ 4. LISIÈRE DU RAVIN (38x32)
  const lis = () => forestGen(zoomGen({ landmarks: [['|', 5], ['!', 3], ['$', 1]], avoid: [[26, 29], [27, 8]],
    w: 38, h: 32, seed: 4, autoTall: 0.56,
    paths: [{ pts: [[18, -1], [18, 6], [12, 12], [15, 18], [22, 22], [18, 27], [18, 32]], r: 2 }, { pts: [[-1, 13.5], [6, 13.5], [12, 13]], r: 1.6 }, { pts: [[14, 10], [21, 9], [27, 9]], r: 1.4, dirt: false }],
    clearings: [{ x: 15, y: 17, rx: 8, ry: 4 }, { x: 27, y: 9, rx: 4, ry: 3 }, { x: 18, y: 29, rx: 14, ry: 2.6 }],
    tall: [{ x: 26, y: 10, r: 3 }, { x: 9, y: 22, r: 3 }],
    bigtrees: [[30, 20]],
    free: [[15, 17, 4]],
  }));
  // falaise du ravin avec un escalier vers la plage (plan agrandi : ligne 54, escalier colonnes 34-39)
  const lisRows = () => lis().map((r, y) => {
    if (y !== 54) return r;
    return [...r].map((ch, x) => (x >= 34 && x <= 39 ? '^' : (x > 4 && x < 70 ? 'C' : ch))).join('');
  });
  MAPS.lisiere = {
    name: 'Lisière du Ravin', music: 'forest', bg: 'foret', ambient: 'forest', theme: 'autumn', climate: 'forest', rate: 0.12, region: 'foret', wildN: 9,
    build() { this.rows = lisRows(); },
    encounters: [{ sp: 'yokomon', min: 3, max: 4, w: 25 }, { sp: 'tanemon', min: 3, max: 4, w: 25 }, { sp: 'nyokimon', min: 2, max: 3, w: 15 }, { sp: 'yuramon', min: 2, max: 3, w: 10 }, { sp: 'kunemon', min: 4, max: 5, w: 15 }, { sp: 'mushroomon', min: 4, max: 5, w: 8, night: 30 }],
    warps: [
      { x: 17, y: 0, w: 3, h: 1, dir: 'up', to: 'geants', tx: 13, ty: 35 },
      { x: 17, y: 31, w: 3, h: 1, dir: 'down', to: 'plage', tx: 17, ty: 0 },
      { x: 0, y: 13, w: 1, h: 2, dir: 'left', to: 'dunes', tx: 39, ty: 19 },   // à l'ouest, les Dunes des Bébés
    ],
    npcs: [
      recruitNPC({ sp: "biyomon", x: 26, y: 29, lvl: 8, face: "left",
        lines: ["Cui ! Je suis Biyomon. D'ici, je vois toute l'île quand je vole !", "Je m'ennuie un peu toute seule... Mais prouve-moi d'abord que tu es fort !"],
        win: "Bravo ! Je m'envole vers la ville. J'ai déjà une idée !" })],
    triggers: [
    ],
    signs: {},
  };
  // (cases fabriquées à la première visite : build, DW.getMap ; ici, leur plan agrandi)
  for (const id of ['clairiere', 'sentier', 'prairie', 'geants', 'lisiere']) zoomMap(MAPS[id], id, { rows: false });
})();
;

// ===== js/maps/plage.js
'use strict';
// =====================================================================
//  BORD DE MER (région « plage ») — deux cartes, comme dans l'animé
//  - PLAGE DES CABINES (épisode 2) : la rangée de cabines téléphoniques au bord de l'eau,
//    Shellmon qui jaillit du sable, dunes, lagon, promenade en planches, ponton et barque.
//  - CRIQUE DU RADEAU (épisode 14) : le radeau des enfants dans une baie abritée ;
//    une fois Shellmon chassé, on le pousse à l'eau... et Whamon, un Engrenage Noir dans le dos, surgit.
//  Plans d'origine 40×36 et 40×30, agrandis ×2 (MapKit.ZOOM).
// =====================================================================
(function () {
  const { say, st, paint, trail, recruitNPC, zoomMap } = DW.MapKit;
  const MAPS = DW.MAPS;
  const H = DW.Art.hash, N = DW.Art.noise;
  // les Digimon de la plage
  const ENCOUNTERS = [
    { sp: 'betamon', min: 2, max: 4, w: 35 },
    { sp: 'gotsumon', min: 3, max: 4, w: 30 },
    { sp: 'bukamon', min: 2, max: 3, w: 25 },
    { sp: 'pichimon', min: 2, max: 3, w: 15 },
    { sp: 'kunemon', min: 3, max: 4, w: 10 },
  ];

  // ------------------------------------------------------------ Shellmon (épisode 2) : BOSS FINAL DU CHAPITRE 1
  // Avant Kuwagamon, les cabines sonnent dans le vide. Ensuite, chacune murmure un mot : dans le bon ordre,
  // le sable s'ouvre sur l'antre de Shellmon (maps/antre.js).
  async function boothEvent(ow, x) {
    const s = st();
    if (s.flags.kuwagamon || s.flags.shellLair) { await DW.Antre.booth(ow, Math.max(0, BOOTHS.indexOf(Math.floor(x / 2)))); return; }
    DW.Audio.sfx('ring');
    await say('Driiing ! Driiing ! Toutes les cabines se mettent à sonner en même temps !');
    if ((await DW.ask('Décrocher le téléphone ?')) !== 0) { await say("Les sonneries s'arrêtent d'un coup... C'était bizarre."); return; }
    await say(s.hero !== 'tai' ? "« ...allô ?... Il y a quelqu'un ?... Je suis coincé... »" : 'Allô ?... Seul un étrange bruit de vagues te répond.');
    await say("La communication coupe. Le sable tremble un peu sous tes pieds... Quelque chose de très gros dort ici.");
    await say("(Quelqu'un appelle à l'aide... mais tu ne peux rien faire pour l'instant. Reviens quand la forêt sera calmée : le monstre rouge du Grand Arbre, dans la Clairière, terrorise toute l'île.)");
  }

  // ------------------------------------------------------------ Gomamon : une ombre dans l'eau (comme Coelamon dans Digimon World)
  // On ne le voit qu'entre 16 h et 19 h : une ombre qui nage près du rivage, au sud de la plage. On lui parle depuis le sable.
  const GOMA_HOURS = [16, 19];
  function gomamonShadow() {
    const n = recruitNPC({ sp: 'gomamon', x: 21, y: 32, lvl: 12, face: 'up',
      lines: ["Yo ! Moi c'est Gomamon ! Les vagues, la pêche... la belle vie !", "Je ne sors de l'eau que pour les dresseurs vraiment forts. Montre-moi ce que tu vaux !"],
      win: "Bien joué ! Allez, je viens en ville. J'ai repéré un endroit parfait pour pêcher..." });
    const cond = n.cond, talk = n.talk;
    n.shadow = true;   // dessiné comme une ombre sous l'eau (game/overworld.js)
    n.cond = s => cond(s) && (h => h >= GOMA_HOURS[0] && h < GOMA_HOURS[1])(DW.Time.hour());
    n.talk = async ow => {
      await say("Une grande ombre nage juste sous la surface... Elle s'approche du rivage !");
      DW.Audio.sfx('water');
      await say("PLOUF ! Un Digimon blanc à la crête orange jaillit de l'eau !");
      await talk(ow);
    };
    return n;
  }

  // ------------------------------------------------------------ Whamon (épisode 14) : le radeau de la crique
  async function raftTalk(ow) {
    const s = st();
    if (!s.flags.shellmon) {
      await say("Un radeau de rondins à moitié construit, avec une voile rapiécée. Qui a bien pu commencer ça ?");
      await say("Sur la plage, les cabines téléphoniques sonnent sans arrêt... Ce n'est pas le moment de prendre la mer.");
      return;
    }
    if (!s.flags.whamon) {
      await say("Le radeau est presque fini. Au large, un énorme jet d'eau jaillit de temps en temps...");
      if ((await DW.ask("Pousser le radeau à l'eau ?")) !== 0) return;
      if (!s.party.some(m => m.hp > 0)) { await say('Il te faudrait un Digimon en forme avant de prendre la mer...'); return; }
      DW.Audio.sfx('swoosh'); await DW.wait(0.6);
      DW.Audio.sfx('roar'); ow.shake = 1.4; await DW.wait(0.8);
      await say("La mer se soulève ! Une baleine gigantesque surgit et manque d'avaler le radeau tout entier !");
      const pn = (s.party.find(m => m.hp > 0) || s.party[0]).name;
      await say("C'est Whamon ! Regarde son dos... un Engrenage Noir ! Il ne sait plus ce qu'il fait !", pn);
      const res = await ow.battle({ enemy: new DW.Digimon('whamon', 24), boss: true, canLose: true, intro: 'Whamon fait déferler une vague géante !' });   // boss facultatif redoutable
      if (res !== 'win') { await say('Whamon replonge dans les profondeurs... Il reviendra. Entraîne-toi et retente ta chance.'); await ow.bossDefeat("Hohoho... Des Bukamon t'ont tiré de l'eau. Whamon ? Ce géant est bien trop fort pour l'instant !"); return; }
      s.flags.whamon = true;
      DW.Audio.sfx('super'); ow.shake = 0.6;
      await say("L'Engrenage Noir se brise et coule au fond de la mer !");
      await say("Pfffuuu... Merci, petit humain. J'avais l'impression de nager dans un cauchemar sans fin.", 'Whamon');
      await say('Je vis tout au fond du Net Ocean. Reviens au radeau chaque jour : je te rapporterai ce que je trouve dans les profondeurs.', 'Whamon');
      const extra = DW.giveItem('soin_g', 2) + DW.giveItem('pm_g', 1) + DW.giveItem('super_viande', 2); s.bits += 1500;
      DW.Audio.sfx('buy'); await say(`Whamon te laisse 2 RAM PV++, une RAM PM++, 2 Viandes géantes et 1500 Bits !${DW.extraMsg(extra)}`);
      DW.autosave();
      return;
    }
    const day = DW.Time.day();
    if (s.flags.whamonDay === day) { await say("Le jet d'eau de Whamon jaillit au loin. Il est parti fouiller les profondeurs : reviens demain !"); return; }
    s.flags.whamonDay = day;
    await say('PFFFOUUU ! Whamon fait surface près du radeau.', 'Whamon');
    const r = Math.random(), got = r < 0.35 ? 'digivivaneau' : r < 0.55 ? 'super_viande' : r < 0.75 ? 'disque_pm' : r < 0.9 ? 'medoc' : 'puce_pm';
    const n = got === 'digivivaneau' ? 2 : 1, extra = DW.giveItem(got, n); DW.Audio.sfx('buy');
    await say(`Un trésor des profondeurs : ${n > 1 ? n + ' ' : ''}${DW.ITEMS[got].name} !${DW.extraMsg(extra)}`, 'Whamon');
  }

  // ------------------------------------------------------------ outils de dessin des côtes
  // dunes : ellipses irrégulières d'herbes des dunes sur le sable sec
  const dunes = (g, list, seed) => {
    for (const [cx, cy, rx, ry] of list) for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++)
      if (g.get(x, y) === 's' && Math.hypot((x - cx) / rx, (y - cy) / ry) < 1 + (H(x, y, seed) - 0.5) * 0.5) g.set(x, y, ';');
  };
  const putAll = (g, list, ch, on = ['s']) => { for (const [x, y] of list) if (on.includes(g.get(x, y))) g.set(x, y, ch); };
  const shells = (g, seed, x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (g.get(x, y) === 's' && H(x, y, seed) < 0.06) g.set(x, y, '3'); };

  // ============================================================ PLAGE DES CABINES (40×36)
  const BOOTHS = [12, 14, 16, 20, 22, 24];
  const plageRows = paint(40, 36, '~', g => {
    // haut de la falaise : prairie salée, chemins vers la forêt (nord) et la ville (est)
    g.rect(0, 0, 40, 4, '.');
    for (let x = 0; x < 40; x++) if (x < 16 || x > 20) g.set(x, 0, 'T');
    for (const x of [0, 1, 2, 3, 36, 37]) g.set(x, 1, 'T');
    trail(g, 40, 36, [[18, -1], [18, 2.2], [26, 2.4], [33, 2], [40, 2]], 1.05, '=', 31);
    g.scatter('f', 4, 1, 32, 3, 14, 32, ['.']); g.set(7, 2, 'b'); g.set(12, 1, 'b'); g.set(30, 1, 'b'); g.set(35, 3, 'b');
    g.set(21, 3, 'S');
    // falaise et escalier
    for (let x = 0; x < 40; x++) g.set(x, 4, x >= 17 && x <= 19 ? '^' : 'C');
    // sable : rivage est en biais, rivage sud ondulé
    for (let y = 5; y < 36; y++) for (let x = 0; x < 40; x++) {
      const e = 37 - Math.max(0, y - 8) * 0.55 + (N(x * 0.3, y * 0.3, 41) - 0.5) * 2.2;
      const s = 30.6 + Math.sin(x * 0.33) * 1.1 + (N(x * 0.25, 3, 43) - 0.5) * 1.6;
      if (x < e && y < s) g.set(x, y, 's');
    }
    // lagon intérieur (eau turquoise, peu profonde) avec son îlot de palmiers
    for (let y = 10; y < 19; y++) for (let x = 3; x < 14; x++) if (Math.hypot((x - 8) / 4.2, (y - 14) / 2.8) < 1 + (N(x * 0.5, y * 0.5, 45) - 0.5) * 0.25) g.set(x, y, '~');
    g.set(8, 14, 's'); g.set(9, 14, 'p');
    // bord ouest : bosquet de palmiers (avec le passage vers la crique)
    for (let y = 5; y < 36; y++) if ((y < 23 || y > 27) && g.get(0, y) === 's') g.set(0, y, y % 3 === 1 ? 'R' : 'p');
    for (let y = 5; y < 22; y++) if (H(1, y, 46) < 0.45 && g.get(1, y) === 's') g.set(1, y, 'p');
    // promenade en planches : de l'escalier jusqu'aux cabines
    for (let y = 5; y < 24; y++) g.set(18, y, '_');
    // dunes d'herbes (les Digimon sauvages s'y cachent)
    dunes(g, [[11, 7, 4, 1.6], [26, 7, 5, 1.6], [30, 13, 2.6, 1.6], [14, 20, 3.2, 1.6], [5, 21, 2.4, 1.4], [25, 18, 2.6, 1.4]], 44);
    // palmiers en bouquets
    putAll(g, [[5, 6], [6, 7], [22, 5], [33, 6], [34, 7], [15, 11], [23, 11], [24, 12], [28, 15], [3, 26], [6, 28]], 'p');   // (plus de palmier devant les cabines)
    // rochers de Gotsumon (nord-est), rochers du rivage, îlots dans la mer
    putAll(g, [[31, 9], [32, 10], [30, 11]], 'r');
    putAll(g, [[33, 16], [32, 17], [27, 22], [30, 20]], 'R');
    for (const [x, y] of [[36, 20], [37, 21], [36, 21], [35, 27], [36, 27], [9, 32], [10, 32]]) if (g.get(x, y) === '~') g.set(x, y, 'R');
    // cuvettes et bois flotté au bord de l'eau, château de sable, coquillages
    putAll(g, [[29, 18], [26, 25], [8, 30], [14, 29], [31, 14]], '8');
    putAll(g, [[16, 15], [27, 9], [5, 30]], '6');
    putAll(g, [[21, 16]], '9');
    shells(g, 77, 1, 5, 37, 31);
    // la rangée de cabines au bord de l'eau (épisode 2)
    for (const x of BOOTHS) g.set(x, 26, 'P');
    // le rocher de Shellmon, dans l'eau face aux cabines
    for (const [x, y] of [[17, 32], [18, 32], [17, 33]]) if (g.get(x, y) === '~') g.set(x, y, 'R');
    // ponton
    for (let y = 22; y < 33; y++) if (g.get(29, y) !== 's') g.set(29, y, '_');
    // panneaux
    g.set(4, 22, 'Z'); g.set(19, 24, 'Z');
    // passages dégagés : arrivée de l'escalier, devant les cabines, sortie vers la crique
    g.rect(16, 5, 2, 2, 's'); g.rect(19, 5, 2, 2, 's'); g.rect(11, 25, 15, 1, 's'); g.rect(11, 27, 15, 1, 's');
    g.rect(0, 23, 4, 5, 's');
  });
  MAPS.plage = {
    name: 'Plage des Cabines', music: 'beach', bg: 'plage', ambient: 'beach', theme: 'beach', climate: 'beach', region: 'plage', rate: 0.12, wildN: 8,
    rows: plageRows,
    objects: [
      { kind: 'rowboat', x: 30, y: 30, w: 2, h: 1, oy: 2 },
      { kind: 'spout', x: 36, y: 33, w: 1, h: 1, small: true },
      { kind: 'crab', v: 0, x: 23, y: 29, w: 1, h: 1, small: true, walk: true }, { kind: 'crab', v: 1, x: 7, y: 25, w: 1, h: 1, small: true, walk: true },
      { kind: 'crab', v: 0, x: 31, y: 18, w: 1, h: 1, small: true, walk: true },
      { kind: 'starfish', v: 0, x: 13, y: 29, w: 1, h: 1, small: true, walk: true }, { kind: 'starfish', v: 1, x: 27, y: 24, w: 1, h: 1, small: true, walk: true },
      { kind: 'starfish', v: 1, x: 4, y: 16, w: 1, h: 1, small: true, walk: true },
    ],
    encounters: ENCOUNTERS,
    warps: [
      { x: 17, y: 0, w: 3, h: 1, dir: 'up', to: 'lisiere', tx: 17, ty: 31 },
      { x: 39, y: 1, w: 1, h: 3, dir: 'right', to: 'village', tx: 0, ty: 13 },
      { x: 0, y: 1, w: 1, h: 3, dir: 'left', to: 'crique', tx: 39, ty: 9 },   // (la route du haut de la falaise mène à la Crique, à l'ouest)
    ],
    npcs: [
      recruitNPC({ sp: 'gotsumon', x: 30, y: 9, lvl: 6, face: 'left',
        lines: ["Grrr ! Je suis Gotsumon. Je casse des cailloux pour me calmer...", "Avant, j'avais une place en ville. Mais je n'ai plus le cœur à rien. Sauf si tu me bats !"],
        win: "Bah... T'es costaud ! Allez, je rentre en ville. Tu vas voir ce que tu vas voir !" }),
      gomamonShadow(),
    ],
    triggers: [],
    signs: {
      '21,3': "Nord : Lisière du Ravin et la forêt.  Est : Ville des Fichiers.  En bas de l'escalier : la Plage des Cabines.",
      '4,22': "Ouest : Crique du Radeau. Quelqu'un y construit un radeau pour quitter l'île...",
      '19,24': () => say(st().flags.kuwagamon && !st().flags.shellLair ? "Quelqu'un a gravé sous le panneau : « Chaque cabine murmure un mot. Dans le bon ordre, c'est un appel au secours. »" : 'Les cabines téléphoniques sonnent parfois toutes seules... Personne ne sait qui appelle.'),
    },
    tileActs: { P: boothEvent },
  };
  zoomMap(MAPS.plage, 'plage');   // plan agrandi ×2 (maps/common.js)
  // la rangée de cabines reste bien dégagée (aucun décor ajouté devant ou derrière : c'est le lieu de l'énigme)
  { const P = []; MAPS.plage.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'P') P.push([x, y]); }));
    if (P.length) MAPS.plage.dressKeep = [[Math.min(...P.map(p => p[0])) - 3, P[0][1] - 7, Math.max(...P.map(p => p[0])) + 3, P[0][1] + 4]]; }

  // ============================================================ CRIQUE DU RADEAU (40×30)
  const criqueRows = paint(40, 30, '~', g => {
    // au nord : le pied des Dunes des Bébés (sable et herbes des dunes, sans arbres) ; la mer reste à l'ouest
    for (let y = 0; y < 6; y++) for (let x = 0; x < 40; x++) {
      const coastX = 5 + Math.round((N(y * 0.4, 1, 57) - 0.5) * 3);
      g.set(x, y, x < coastX ? '~' : N(x * 0.18, y * 0.3, 51) > 0.6 ? ';' : 's');
    }
    for (let y = 0; y < 8; y++) for (let x = 18; x < 22; x++) g.set(x, y, 's');   // passage vers les dunes
    // croissant de sable autour d'une baie abritée, ouverte au sud
    for (let y = 6; y < 30; y++) for (let x = 0; x < 40; x++) {
      const out = Math.hypot((x - 20) / 18.5, (y - 14) / 11.5) < 1 + (N(x * 0.3, y * 0.3, 53) - 0.5) * 0.18;
      const bay = Math.hypot((x - 19) / 10, (y - 21) / 7) < 1 + (N(x * 0.3, y * 0.3, 54) - 0.5) * 0.2;
      if (out && !bay) g.set(x, y, 's');
    }
    // passage vers la Plage des Cabines (est)
    for (let y = 6; y < 13; y++) for (let x = 31; x < 40; x++) if (y > 6 || x < 36) g.set(x, y, 's');
    // dunes, palmiers, rochers, cuvettes, coquillages
    dunes(g, [[8, 10, 3.6, 1.6], [29, 9, 3, 1.4], [5, 17, 2, 2.4]], 55);
    putAll(g, [[3, 8], [4, 9], [12, 7], [26, 7], [35, 9], [2, 14], [36, 15], [33, 18], [6, 22]], 'p');
    putAll(g, [[24, 8], [25, 8], [3, 19], [34, 21]], 'r');
    putAll(g, [[10, 15], [29, 16], [13, 26], [27, 25]], '8');
    putAll(g, [[17, 9], [22, 12]], '6');
    shells(g, 56, 1, 6, 39, 29);
    // îlots de rochers dans la baie et au large
    for (const [x, y] of [[12, 20], [26, 22], [5, 27], [34, 27], [35, 28]]) if (g.get(x, y) === '~') g.set(x, y, 'R');
    // panneau
    g.set(22, 9, 'Z');
    // devant le radeau : sable dégagé
    g.rect(15, 11, 8, 2, 's');
  });
  MAPS.crique = {
    name: 'Crique du Radeau', music: 'beach', bg: 'plage', ambient: 'beach', theme: 'beach', climate: 'beach', region: 'plage', rate: 0.1, wildN: 6,
    rows: criqueRows,
    objects: [
      { kind: 'raft', x: 16, y: 13, w: 4, h: 2 },
      { kind: 'rockarch', x: 20, y: 25, w: 4, h: 2 },
      { kind: 'wreck', x: 4, y: 12, w: 4, h: 2 },
      { kind: 'spout', x: 30, y: 27, w: 1, h: 1, small: true },
      { kind: 'crab', v: 1, x: 9, y: 19, w: 1, h: 1, small: true, walk: true }, { kind: 'crab', v: 0, x: 30, y: 19, w: 1, h: 1, small: true, walk: true },
      { kind: 'starfish', v: 0, x: 14, y: 23, w: 1, h: 1, small: true, walk: true }, { kind: 'starfish', v: 1, x: 25, y: 17, w: 1, h: 1, small: true, walk: true },
    ],
    encounters: ENCOUNTERS.filter(e => e.sp !== 'gotsumon').concat([{ sp: 'gomamon', min: 3, max: 4, w: 15 }]),
    warps: [{ x: 39, y: 9, w: 1, h: 3, dir: 'right', to: 'plage', tx: 0, ty: 1 },   // (vers la route du haut de la Plage des Cabines)
      { x: 19, y: 0, w: 3, h: 1, dir: 'up', to: 'dunes', tx: 19, ty: 29 }],   // au nord : les Dunes des Bébés
    npcs: [],
    triggers: [],
    signs: {
      '22,9': "Crique du Radeau. Une baie abritée où l'on raconte que des enfants venus d'un autre monde ont un jour pris la mer.",
      ...Object.fromEntries([16, 17, 18, 19].map(x => [`${x},13`, raftTalk])),   // on parle au radeau depuis le sable (nord)
      '4,12': "L'épave d'un vieux bateau, à moitié ensevelie. Le nom sur la coque est effacé par le sel.",
      '5,12': "L'épave d'un vieux bateau, à moitié ensevelie. Le nom sur la coque est effacé par le sel.",
    },
  };
  zoomMap(MAPS.crique, 'crique');   // plan agrandi ×2 (maps/common.js)
})();
;

// ===== js/maps/rivage.js
'use strict';
// =====================================================================
//  LES PREMIÈRES ZONES : un stade de Digimon par étape (comme dans Digimon World)
//  - DUNES DES BÉBÉS (nouvelle, à l'ouest du haut de la plage) : des bébés, niveaux 2-4
//  - BOSQUET DES POUSSES (nouvelle, au nord des dunes) : des Digimon au stade Entraînement, niveaux 4-7
//  - PLAGE DES CABINES : Entraînement et premiers Disciples, niveaux 5-8
//  - FORÊT : des Disciples uniquement, de plus en plus forts vers la Clairière (7 à 12)
//  - les Champions viendront plus tard (régions de l'île)
//  STAGES : le seul endroit où régler les Digimon sauvages de ces zones (remplace les listes des cartes).
// =====================================================================
(function () {
  const { forestGen, zoomGen, zoomMap } = DW.MapKit;
  const MAPS = DW.MAPS;
  const E = (sp, min, max, w, o) => Object.assign({ sp, min, max, w }, o || {});

  // ------------------------------------------------------------ Digimon sauvages par zone (difficulté par stade)
  const STAGES = {
    dunes: [E('botamon', 2, 3, 20), E('punimon', 2, 3, 18), E('pichimon', 2, 4, 18), E('yuramon', 2, 4, 15), E('nyokimon', 2, 4, 15), E('poyomon', 3, 4, 8), E('pabumon', 3, 4, 8)],
    bosquet: [E('koromon', 4, 6, 18), E('tsunomon', 4, 6, 16), E('tokomon', 4, 6, 14), E('motimon', 5, 7, 12), E('bukamon', 4, 6, 14), E('tanemon', 4, 6, 14), E('yokomon', 5, 7, 12)],
    // chapitre 1 (comme au début de l'animé) : sur l'île, les partenaires des enfants ne sont encore que des bébés.
    // Pas d'Agumon, de Gabumon, de Tentomon ou de Patamon sauvages : seulement les Digimon qui vivent ici
    // (formes Entraînement, Kunemon, Mushroomon, Elecmon, Betamon, Gotsumon...) — les recrues restent à leur place.
    plage: [E('bukamon', 5, 6, 25), E('tanemon', 5, 6, 15), E('yokomon', 5, 6, 15), E('betamon', 6, 8, 20), E('gotsumon', 6, 8, 15)],
    crique: [E('betamon', 7, 9, 30), E('bukamon', 6, 7, 20), E('gotsumon', 7, 9, 15)],
    lisiere: [E('kunemon', 7, 9, 30), E('yokomon', 7, 9, 20), E('mushroomon', 8, 9, 20, { night: 45 }), E('tanemon', 7, 9, 15)],
    geants: [E('kunemon', 8, 10, 25), E('betamon', 8, 10, 20), E('tokomon', 8, 10, 15), E('mushroomon', 8, 10, 15, { night: 40 }), E('gotsumon', 9, 10, 10)],
    sentier: [E('kunemon', 9, 11, 25), E('elecmon', 9, 11, 20), E('motimon', 9, 11, 15), E('tsunomon', 9, 11, 12), E('mushroomon', 9, 11, 15, { night: 45 })],
    prairie: [E('kunemon', 9, 11, 20), E('yokomon', 9, 11, 20), E('elecmon', 9, 11, 15), E('tanemon', 9, 11, 15), E('motimon', 10, 11, 10), E('mushroomon', 10, 11, 15, { night: 40 })],
    // la forêt de Kuwagamon : de jeunes Kuwagamon y rôdent (des CHAMPIONS : rares, agressifs, beaucoup d'expérience) ;
    // plus nombreux une fois le grand Kuwagamon du Grand Arbre vaincu (ils reviennent s'installer dans la clairière)
    clairiere: [E('kunemon', 10, 12, 25), E('elecmon', 10, 12, 15), E('koromon', 10, 12, 15), E('tokomon', 10, 12, 12), E('mushroomon', 10, 12, 15, { night: 40 }),
      E('kuwagamon', 10, 11, 5, { flag: 'kuwagamon', wFlag: 10 })],
    // (chaque zone garde SES Digimon et SES niveaux, quel que soit le chapitre : les Champions du chapitre 2
    //  — Monochromon, Kuwagamon plus forts — vivent dans la région du lac, game/wild.js)
  };

  // ------------------------------------------------------------ DUNES DES BÉBÉS (40×30, agrandie ×2)
  MAPS.dunes = {
    name: 'Dunes des Bébés', music: 'beach', bg: 'plage', ambient: 'beach', theme: 'beach', climate: 'beach', region: 'plage', rate: 0.14, wildN: 10, noLandmark: true,
    build() { this.rows = forestGen(zoomGen({ w: 40, h: 30, seed: 41, autoTall: 0.5, deco: 0.8, landmarks: [['{', 3]],
      clearings: [{ x: 20, y: 16, rx: 15, ry: 10 }, { x: 8, y: 8, rx: 5, ry: 4 }],
      paths: [{ pts: [[41, 19.5], [30, 18], [22, 17], [12, 15], [6, 9]], r: 1.6 }, { pts: [[20, 16], [24, 8], [24, -1]], r: 1.4 }, { pts: [[20, 17], [20, 24], [20, 31]], r: 1.6 }],
      lakes: [{ x: 30, y: 22, rx: 4.5, ry: 2.6 }],
      tall: [{ x: 14, y: 21, r: 4 }, { x: 28, y: 9, r: 3.5 }],
      free: [[36, 19, 3], [24, 3, 3], [20, 27, 3]],
      set: [[34, 12, 'S']],
    })).map((r, y) => [...r].map((ch, x) => {
      // des DUNES : le sable domine (herbe des dunes en touffes), plus de phares au milieu de l'herbe
      if (ch === '{') return '6';
      const n = DW.Art.fbm(x * 0.09, y * 0.09, 417);
      if (ch === '.' || ch === 'f') return n > 0.38 ? 's' : ch;
      if (ch === ',') return n > 0.38 ? ';' : ch;
      return ch;
    }).join('')); },
    finir() { ouest(this); },
    warps: [
      { x: 39, y: 19, w: 1, h: 2, dir: 'right', to: 'lisiere', tx: 0, ty: 13 },   // à l'est, la Lisière du Ravin
      { x: 23, y: 0, w: 3, h: 1, dir: 'up', to: 'bosquet', tx: 19, ty: 29 },
      { x: 19, y: 29, w: 3, h: 1, dir: 'down', to: 'crique', tx: 19, ty: 0 },   // les dunes descendent jusqu'à la Crique du Radeau
    ],
    npcs: [], triggers: [],
    signs: { '34,12': "Dunes des Bébés. Les tout petits Digimon viennent jouer dans les herbes. Idéal pour un partenaire qui vient de naître !  Nord : Bosquet des Pousses.  Est : Lisière du Ravin.  Sud : Crique du Radeau." },
  };
  // ------------------------------------------------------------ BOSQUET DES POUSSES (40×30, agrandi ×2)
  MAPS.bosquet = {
    name: 'Bosquet des Pousses', music: 'forest', bg: 'foret', ambient: 'forest', theme: 'meadow', climate: 'forest', region: 'plage', rate: 0.14, wildN: 10,
    build() { this.rows = forestGen(zoomGen({ w: 40, h: 30, seed: 42, autoTall: 0.48, deco: 1, landmarks: [['}', 3], ['>', 2]],
      clearings: [{ x: 20, y: 15, rx: 13, ry: 9 }, { x: 31, y: 8, rx: 5, ry: 4 }, { x: 9, y: 22, rx: 5, ry: 4 }],
      paths: [{ pts: [[20, 31], [20, 22], [16, 15], [22, 9], [31, 8], [36, 12], [41, 15]], r: 1.5 }, { pts: [[20.5, -1], [20.5, 4], [22, 9]], r: 1.8 }, { pts: [[16, 15], [9, 22]], r: 1.3, dirt: false }],
      tall: [{ x: 27, y: 18, r: 4 }, { x: 10, y: 11, r: 3.5 }],
      bigtrees: [[30, 22]],
      free: [[20, 27, 3]],
      set: [[21, 25, 'S']],
    })); },
    finir() { ouest(this); },
    warps: [{ x: 19, y: 29, w: 3, h: 1, dir: 'down', to: 'dunes', tx: 23, ty: 0 },
      { x: 39, y: 14, w: 1, h: 3, dir: 'right', to: 'geants', tx: 0, ty: 14 }],   // à l'est, un sentier vers le Bois des Géants
    npcs: [], triggers: [],
    signs: { '21,25': "Bosquet des Pousses. Les jeunes Digimon (stade Entraînement) s'y bagarrent toute la journée. Ici, on devient plus fort !" },
  };
  // agrandies ×2 comme les autres cartes faites à la main (plan d'origine 40×30)
  // (leur facteur d'agrandissement est déclaré dans MapKit.ZOOM, avant toute carte qui y mène)
  zoomMap(MAPS.dunes, 'dunes', { rows: false }); zoomMap(MAPS.bosquet, 'bosquet', { rows: false });
  // bord ouest de l'île, posé à la fabrication de la carte, après ses dégagements (finir : MapKit.zoomMap) : les dunes descendent vers la mer
  // à l'ouest (au sud, elles rejoignent la Crique), le bosquet domine l'océan du haut d'une falaise
  // (la mer garde libres les abords des sorties et des panneaux d'origine, relevés dès maintenant : le puzzle du monde
  //  change ensuite les sorties, maps/puzzle.js)
  const near = M => { const pts = [...(M.warps || []).flatMap(w => { const a = []; for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) a.push([x, y]); return a; }), ...Object.keys(M.signs || {}).map(k => k.split(',').map(Number))];
    return (x, y) => pts.some(([px, py]) => Math.abs(px - x) < 4 && Math.abs(py - y) < 4); };
  const garde = { dunes: near(MAPS.dunes), bosquet: near(MAPS.bosquet) };
  function ouest(M) {
    if (M === MAPS.bosquet) { M.rows = DW.MapKit.coast(M.rows, { left: 'cliff' }, { seed: 42, sea: 10, keep: garde.bosquet }); return; }
    M.rows = DW.MapKit.coast(M.rows, { left: 'beach' }, { seed: 41, sea: 11, keep: garde.dunes });
    // au sud, les dunes s'ouvrent en grande plage de sable jusqu'à la Crique du Radeau (plus de forêt ni de mer de ce côté)
    const H = M.rows.length;
    M.rows = M.rows.map((r, y) => {
      const k = (y - (H - 18)) / 12; if (k <= 0) return r;
      return [...r].map((ch, x) => {
        if (!'#TbknpR'.includes(ch)) return ch;
        const n = DW.Art.fbm(x * 0.12, y * 0.12, 431);
        if (n > 0.2 + k * 0.7) return ch === '#' ? 'T' : ch;           // lisière de forêt qui s'effiloche
        if (DW.Art.hash(x, y, 432) < 0.03) return 'T';                   // quelques arbres isolés dans le sable
        return n > 0.45 ? ';' : 's';                                     // sable et herbe des dunes
      }).join('');
    });
  }

  // (la Plage des Cabines ne touche plus les dunes : elle est au sud de la Lisière ; à l'ouest, la Crique du Radeau)
  // RACCORD AVEC LA CRIQUE : la Plage et la Crique bordent la même baie. En haut, la route de la falaise passe de l'une
  // à l'autre ; en dessous, la mer de la Crique continue le long du bord ouest de la Plage (plage, puis mer).
  { const g = MAPS.plage.rows.map(r => [...r]);
    for (let y = 10; y < g.length; y++) for (let x = 0; x < 7; x++) {
      const sea = 3 + Math.round(Math.sin(y * 0.35) * 1.2 + DW.Art.hash(y, 3, 781) * 1.2);
      if (x < sea) g[y][x] = '~'; else if (x < sea + 2 && g[y][x] !== '~') g[y][x] = DW.Art.hash(x, y, 782) < 0.12 ? 'R' : 's';
    }
    MAPS.plage.rows = g.map(r => r.join('')); }

  // ------------------------------------------------------------ difficulté par stade
  for (const id in STAGES) if (MAPS[id]) MAPS[id].encounters = STAGES[id];
  DW.FIRST_ZONES = STAGES;
})();
;

// ===== js/maps/village.js
'use strict';
// =====================================================================
//  VILLE DES FICHIERS — point de départ et cœur du jeu
//  La carte est reconstruite selon les Digimon recrutés (DW.Town) :
//  terrains vagues → bâtiments (rien ne révèle à l'avance ce qui sera construit), chemins de terre → allées pavées, décor qui s'enrichit.
//  Plan : maison de Jijimon au nord, place à la fontaine au centre,
//  deux allées (haut/bas) qui desservent les 4 commerces, étang et ruisseau à l'ouest.
// =====================================================================
(function () {
  const { say, st, paint, healAll, trail, zoomMap, zpt } = DW.MapKit;
  const Hh = DW.Art.hash;
  const MAPS = DW.MAPS;
  const T = () => DW.Town;

  // emplacements des bâtiments (x, y = coin haut-gauche de l'emprise ; npc = place de l'habitant)
  // in : intérieur (porte au centre du bâtiment), sign : enseigne qui se balance
  const LOTS = {
    gotsumon: { kind: 'bazar', x: 6, y: 7, w: 5, h: 3, in: ['bazar_in', 6, 8], sign: [0, 5, 9] },
    elecmon: { kind: 'dojo', x: 29, y: 7, w: 5, h: 3, in: ['dojo_in', 6, 9], sign: [1, 34, 9] },
    mushroomon: { kind: 'restaurant', x: 6, y: 19, w: 5, h: 3, in: ['resto_in', 6, 9], sign: [2, 5, 21] },
    yokomon: { kind: 'garden', x: 29, y: 19, w: 5, h: 3, in: ['serre_in', 7, 9], sign: [3, 34, 21] },
  };
  const FREE_LOT = { x: 24, y: 23, w: 5, h: 3 };
  const BANK = { x: 6, y: 3, w: 5, h: 3 };   // à l'ouest de la grande maison de Jijimon (route du nord : x 11-12)

  // ------------------------------------------------------------ construction de la carte
  // ------------------------------------------------------------ sol de la ville, peint au pixel (plus esthétique, plus réaliste)
  // - la place : bordure de pierre claire, anneau de pavés rouges, rosace en étoile autour de la fontaine
  //   (ternie et envahie d'herbe tant que la ville est en ruines) ;
  // - les chemins de terre : bords adoucis, cailloux et touffes d'herbe (plus de taches) ;
  // - les pelouses : nuances naturelles, trèfles, fleurs des champs ; - devant les portes : gravier clair
  function paintTown(c, m, lvl) {
    const U = 16, H0 = DW.Art.hash, rows = m.rows, Wd = rows[0].length, Hd = rows.length, at = (x, y) => (rows[y] || '')[x];
    const ruin = Math.max(0, 1 - lvl / 3);   // 1 = ruines, 0 = ville rebâtie
    // 1. pelouses : grandes nuances douces (pas un aplat uniforme)
    for (let i = 0; i < 70; i++) {
      const x = H0(i, 1, 801) * Wd * U, y = H0(i, 2, 801) * Hd * U, r = 30 + H0(i, 3, 801) * 70;
      c.fillStyle = H0(i, 4, 801) < 0.5 ? 'rgba(20,60,10,0.07)' : 'rgba(255,255,200,0.06)';
      c.beginPath(); c.ellipse(x, y, r, r * 0.7, H0(i, 5, 801) * 3, 0, 7); c.fill();
    }
    // trèfles et fleurs des champs sur l'herbe
    for (let i = 0; i < 900; i++) {
      const tx = Math.floor(H0(i, 6, 802) * Wd), ty = Math.floor(H0(i, 7, 802) * Hd);
      if (at(tx, ty) !== '.') continue;
      const x = tx * U + H0(i, 8, 802) * U, y = ty * U + H0(i, 9, 802) * U, k = H0(i, 10, 802);
      if (k < 0.55) { c.fillStyle = '#3e8a34'; c.fillRect(x, y, 1, 2); c.fillRect(x + 2, y + 1, 1, 2); c.fillStyle = '#5aa846'; c.fillRect(x + 1, y - 1, 1, 2); }   // touffe
      else if (k < 0.8) { c.fillStyle = '#4e9a3e'; for (const [dx, dy] of [[0, 0], [2, 0], [1, -1.5]]) { c.beginPath(); c.arc(x + dx, y + dy, 1.1, 0, 7); c.fill(); } }      // trèfle
      else if (ruin < 0.7) { c.fillStyle = ['#ffffff', '#ffe060', '#ff9ac0', '#b8a0ff'][i % 4]; c.fillRect(x, y, 1.5, 1.5); c.fillStyle = '#f0c040'; c.fillRect(x + 0.5, y + 0.5, 0.6, 0.6); }   // fleur
    }
    // 2. CHEMINS DE TERRE PEINTS : tracé arrondi et irrégulier (disques et capsules entre cases voisines, rayons
    //    variés), bordure sombre fondue, terre en dégradé (milieu tassé plus clair), grain, cailloux,
    //    touffes d'herbe en brins qui débordent sur le bord
    { const isP = (x, y) => at(x, y) === '=', CW = Wd * U, CH = Hd * U;
      const mask = (rad, wid) => {   // forme du chemin (blanc) dans un calque à part
        const m2 = document.createElement('canvas'); m2.width = CW; m2.height = CH; const g = m2.getContext('2d');
        g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round';
        for (let ty = 0; ty < Hd; ty++) for (let tx = 0; tx < Wd; tx++) if (isP(tx, ty)) {
          const x = tx * U + 8 + (H0(tx, ty, 811) - 0.5) * 4, y = ty * U + 8 + (H0(tx, ty, 812) - 0.5) * 4, r = rad + (H0(tx, ty, 813) - 0.5) * 5;
          g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
          for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) if (isP(tx + dx, ty + dy) && !(dx && dy && (isP(tx + dx, ty) || isP(tx, ty + dy)))) {
            g.lineWidth = wid + (H0(tx + dx, ty + dy, 814) - 0.5) * 4; g.beginPath(); g.moveTo(x, y); g.lineTo(tx * U + 8 + dx * U, ty * U + 8 + dy * U); g.stroke();
          }
        }
        return m2;
      };
      const tinted = (m2, col, blur) => {   // calque coloré à la forme du masque (bords adoucis)
        const t = document.createElement('canvas'); t.width = CW; t.height = CH; const g = t.getContext('2d');
        if (blur) g.filter = `blur(${blur}px)`;
        g.drawImage(m2, 0, 0); g.filter = 'none';
        g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, CW, CH);
        return t;
      };
      const outer = mask(13, 21), inner = mask(6, 9);
      c.save();
      c.globalAlpha = 0.55; c.drawImage(tinted(outer, '#6e5434', 4), 0, 1.5);   // bord sombre fondu (le chemin est un peu en creux)
      c.globalAlpha = 1; c.drawImage(tinted(outer, '#c2a072', 1.2), 0, 0);      // terre
      c.globalAlpha = 0.7; c.drawImage(tinted(inner, '#d8bc8c', 5), 0, 0);      // milieu tassé, plus clair
      c.restore();
      // grain, ornières et cailloux
      for (let ty = 0; ty < Hd; ty++) for (let tx = 0; tx < Wd; tx++) if (isP(tx, ty)) {
        for (let k = 0; k < 7; k++) {
          const u = H0(tx * 7 + k, ty, 807), v = H0(tx, ty * 7 + k, 807);
          c.fillStyle = k < 3 ? 'rgba(255,244,214,0.5)' : 'rgba(110,80,50,0.32)'; c.fillRect(tx * U + u * U, ty * U + v * U, k < 3 ? 1.5 : 1, 1);
        }
        if (H0(tx, ty, 815) < 0.35) { const x = tx * U + H0(tx, ty, 816) * 12 + 2, y = ty * U + H0(tx, ty, 817) * 12 + 2; c.fillStyle = '#7a6a58'; c.beginPath(); c.ellipse(x, y + 0.6, 2, 1.3, 0, 0, 7); c.fill(); c.fillStyle = '#c8bcaa'; c.beginPath(); c.ellipse(x - 0.3, y, 1.7, 1, 0, 0, 7); c.fill(); }
      }
      // touffes d'herbe (brins) sur le bord, là où le chemin touche la pelouse
      c.lineCap = 'round';
      for (let ty = 0; ty < Hd; ty++) for (let tx = 0; tx < Wd; tx++) {
        if (!isP(tx, ty)) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (at(tx + dx, ty + dy) !== '.' || H0(tx * 3 + dx, ty * 3 + dy, 818) < 0.35) continue;
          const bx = tx * U + 8 + dx * 10 + (dy ? (H0(tx, ty + dy, 819) - 0.5) * 12 : 0), by = ty * U + 10 + dy * 8 + (dx ? (H0(tx + dx, ty, 819) - 0.5) * 10 : 0);
          for (let b = 0; b < 5; b++) {
            const h = 3 + H0(tx * 5 + b, ty, 820) * 3, lean = (b - 2) * 0.7;
            c.strokeStyle = b % 2 ? '#3e8a34' : '#5aa846'; c.lineWidth = 1;
            c.beginPath(); c.moveTo(bx + b - 2, by); c.quadraticCurveTo(bx + b - 2 + lean * 0.4, by - h * 0.6, bx + b - 2 + lean, by - h); c.stroke();
          }
        }
      }
    }
    // 3. la place : bordure, anneau de pavés rouges, rosace en étoile
    const P = m.plazas && m.plazas[0];
    if (P) {
      const cx = 19.5 * 32 + 16, cy = 14 * 32 + 16, rx = 6.2 * 32, ry = 6.2 / 1.15 * 32;
      c.save();
      c.globalAlpha = 1 - ruin * 0.55;
      // bordure de pierre claire et son ombre
      c.strokeStyle = 'rgba(40,30,20,0.35)'; c.lineWidth = 7; c.beginPath(); c.ellipse(cx, cy + 2, rx + 1, ry + 1, 0, 0, 7); c.stroke();
      c.strokeStyle = '#d8d0bc'; c.lineWidth = 5; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.stroke();
      c.strokeStyle = '#efe8d6'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, cy - 1, rx - 1, ry - 1, 0, 0, 7); c.stroke();
      // anneau de pavés rouges (deux rangs de pavés décalés)
      for (const [rr, n, off] of [[0.83, 150, 0], [0.77, 140, 0.5]]) for (let i = 0; i < n; i++) {
        const a = (i + off) / n * Math.PI * 2, x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
        c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
        c.fillStyle = 'rgba(60,30,20,0.5)'; c.fillRect(-4.5, -3.5, 9, 7); c.fillStyle = (i + Math.round(off)) % 3 ? '#b06a4c' : '#c47e5e'; c.fillRect(-4, -3, 8, 6);
        c.fillStyle = 'rgba(255,230,210,0.25)'; c.fillRect(-4, -3, 8, 1); c.restore();
      }
      // rosace : étoile à 8 branches en pierre claire et ardoise, autour de la fontaine
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2, long = k % 2 === 0, R1 = 50, R2 = long ? 112 : 84, w = long ? 0.12 : 0.09;
        c.fillStyle = long ? '#e2dac6' : '#7a8494';
        c.beginPath(); c.moveTo(cx + Math.cos(a - w) * R1, cy + Math.sin(a - w) * R1 * 0.87); c.lineTo(cx + Math.cos(a) * R2, cy + Math.sin(a) * R2 * 0.87); c.lineTo(cx + Math.cos(a + w) * R1, cy + Math.sin(a + w) * R1 * 0.87); c.closePath(); c.fill();
      }
      c.strokeStyle = '#c8bca4'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy, 50, 44, 0, 0, 7); c.stroke();
      c.restore();
      // ville en ruines : herbe et mousse qui poussent entre les pavés, dalles fendues
      if (ruin > 0) for (let i = 0; i < 260 * ruin; i++) {
        const a = H0(i, 1, 805) * 6.28, d = Math.sqrt(H0(i, 2, 805)), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
        c.fillStyle = i % 3 ? 'rgba(70,130,50,0.7)' : 'rgba(40,40,40,0.35)'; c.fillRect(x, y, i % 3 ? 2 : 4, i % 3 ? 2 : 1);
      }
    }
    // 4. gravier clair devant les portes
    for (const d of (m.doors || []).filter(d => !d.cond || d.cond(DW.state))) {   // (seulement les bâtiments construits)
      const x = (d.x + (d.w || 1) / 2) * U, y = (d.y + 1) * U + 4;
      c.fillStyle = 'rgba(230,215,180,0.75)'; c.beginPath(); c.ellipse(x, y, 16, 7, 0, 0, 7); c.fill();
      for (let k = 0; k < 14; k++) { c.fillStyle = k % 2 ? 'rgba(150,130,100,0.6)' : 'rgba(255,250,235,0.8)'; c.fillRect(x - 13 + H0(k, d.x, 806) * 26, y - 5 + H0(d.y, k, 806) * 10, 1, 1); }
    }
  }

  function build() {
    const m = MAPS.village, lvl = T().level(), has = id => T().has(id);
    const nord = !!DW.Quartiers && DW.Quartiers.open('residentiel');   // (Quartier Résidentiel ouvert : maps/quartiers.js)
    const version = Object.keys(LOTS).concat(['betamon', 'biyomon', 'kunemon']).map(id => (has(id) ? 1 : 0)).join('') + lvl + (st().hero || '') + (Object.keys((st().home || {}).owned || {}).length >= 4 ? 'H' : 'h') + 'k' + Object.keys(st().kids || {}).filter(id => st().kids[id]).length;
    if (m.version === version && m.rows) return;
    m.version = version;
    m.decay = Math.max(0, 1 - lvl / 4);
    m.plazas = [{ x: 320, y: 232, rx: 98, ry: 86 }];
    m.rows = paint(40, 30, '#', g => {
      g.rect(2, 2, 36, 27, '.');
      // lisière : arbres variés, deuxième rangée irrégulière (comme une vraie forêt)
      for (let x = 1; x < 39; x++) { g.set(x, 2, 'T'); g.set(x, 28, 'T'); }
      for (let y = 2; y < 29; y++) { g.set(1, y, 'T'); g.set(37, y, 'T'); g.set(38, y, 'T'); }
      for (let x = 4; x < 36; x++) { if (Hh(x, 3, 71) < 0.3) g.set(x, 3, 'T'); if (Hh(x, 27, 72) < 0.3) g.set(x, 27, 'T'); }
      for (let y = 4; y < 27; y++) if (Hh(36, y, 73) < 0.3 && (y < 6 || y > 11)) g.set(36, y, 'T');   // pas autour des mannequins du Dojo
      for (const [x, y] of [[36, 3], [36, 4], [36, 27], [35, 27], [36, 26], [4, 27]]) g.set(x, y, 'T');
      // étang et ruisseau à l'ouest (pont sur la route)
      for (let y = 2; y < 7; y++) for (let x = 2; x < 7; x++) if (Math.hypot((x - 3.6) / 2.2, (y - 3.8) / 1.6) < 1) g.set(x, y, '~');
      g.set(4, 4, 'w'); g.set(3, 3, 'w');
      for (let y = 5; y < 30; y++) { g.set(2, y, '~'); g.set(3, y, '~'); }
      g.rect(2, 13, 2, 3, '_');
      // chemins de terre qui serpentent (comme la Ville des Fichiers de Digimon World 1)
      const tr = (pts, r, s) => trail(g, 40, 30, pts, r, '=', s);
      tr([[-1, 14], [5, 14], [9, 14.6], [14, 14]], 1.25, 1);                                  // ouest : vers la plage (pont)
      tr([[25, 14], [30, 14.6], [35, 13.8], [40, 14]], 1.25, 2);                              // est : vers la Montagne
      tr([[19.5, 9], [19.5, 5.5]], 1.05, 3);                                                  // maison de Jijimon
      tr([[19.5, 19], [19, 24], [19.5, 30]], 1.05, 4);                                        // sud : Terrain d'entraînement
      tr([[6, 22.5], [5, 26], [5.5, 30]], 0.95, 5);                                           // sud-ouest : Quartier des Champs
      tr([[8.5, 10.4], [13, 9.6], [19.5, 9], [26, 9.8], [31.5, 10.4]], 0.85, 6);              // allée nord des commerces
      tr([[8.5, 22.4], [14, 21.8], [19.5, 21], [25, 21.8], [31.5, 22.4], [34, 23]], 0.85, 7); // allée sud
      tr([[9, 10.5], [8.4, 14]], 0.8, 8); tr([[30.5, 10.5], [31, 14]], 0.8, 9);
      tr([[25.5, 6.6], [22, 8.6]], 0.75, 10);                                                 // devant la banque
      g.rect(0, 13, 2, 3, '='); g.rect(2, 13, 2, 3, '_'); g.rect(37, 13, 3, 3, '=');            // entrées franches
      g.rect(5, 28, 2, 2, '='); g.rect(19, 28, 2, 2, '=');
      // place pavée
      for (let y = 8; y <= 20; y++) for (let x = 13; x <= 26; x++) if (Math.hypot(x - 19.5, (y - 14) * 1.15) < 6.2) g.set(x, y, 'z');
      // route de l'est : vers le Pont de l'Infini et la Montagne

      // décor selon le niveau de la ville
      const lawn = ['.'];
      const deco = (ch, n, seed, x = 4, y = 3, w = 33, h = 24) => g.scatter(ch, x, y, w, h, n, seed, lawn);
      if (lvl === 0) { deco('j', 70, 3); deco('r', 6, 5); deco('L', 2, 6); deco('k', 3, 8); deco('b', 8, 4); }
      else if (lvl < 3) { deco('j', 26, 3); deco('f', 20, 7); deco('b', 10, 4); deco('k', 1, 8); }
      else { deco('f', 34, 7); deco('b', 10, 4); }
      // bosquets dans les coins (arbres, buissons)
      // (jamais à côté d'une enseigne suspendue : l'arbre la cachait)
      const nearSign = (x, y) => Object.values(LOTS).some(L => Math.abs(L.sign[1] - x) <= 1 && Math.abs(L.sign[2] - y) <= 1);
      for (const [x, y] of [[5, 7], [4, 9], [35, 6], [34, 4], [8, 25], [4, 21], [35, 20], [34, 24], [14, 3], [5, 17], [12, 17], [16, 26], [4, 11]]) if (!nearSign(x, y)) g.set(x, y, 'T');
      // près de la maison de Jijimon : puits, toilettes
      g.set(13, 5, 'e'); g.set(15, 24, 'y');
      // décor numérique discret (comme dans Digimon World) : antenne, tuyau, panneau de circuit
      g.set(36, 7, '!'); g.set(4, 24, '$'); g.set(36, 24, '?');
      // grand arbre à l'est de la place
      g.set(34, 16, 'Y'); g.set(33, 16, 'g'); g.set(35, 16, 'g');
      // aménagements gagnés au fil des niveaux
      if (lvl >= 1) { g.set(12, 7, 'd'); g.set(27, 7, 'd'); }
      if (lvl >= 2) {
        for (const [x, y] of [[13, 9], [26, 9], [13, 19], [26, 19]]) g.set(x, y, 'i');
        for (const [x, y] of [[18, 7], [21, 7]]) g.set(x, y, 'l');
      }
      if (lvl >= 3) {
        for (const [x, y] of [[16, 17], [23, 17], [16, 11], [23, 11]]) g.set(x, y, 'J');
        g.set(15, 14, 't');
        for (const [x, y] of [[12, 13], [12, 15], [27, 13], [27, 15]]) g.set(x, y, 'd');
      }
      if (lvl >= 4) {
        for (const [x, y] of [[6, 12], [6, 16], [33, 12], [33, 16], [21, 25], [18, 25]]) g.set(x, y, 'V');
        for (const x of [11, 12, 14, 15, 24, 25, 27, 28]) g.set(x, 9, 'K');
      }
      // mobilier urbain de plus en plus dense (comme les villes de Digimon World 2003) : jardinières autour de la place,
      // tonneaux et caisses près des échoppes, drapeaux, lampadaires supplémentaires
      if (lvl >= 3) for (let a = 0; a < 8; a++) { const x = Math.round(19.5 + Math.cos(a / 8 * Math.PI * 2 + 0.39) * 7.6), y = Math.round(14 + Math.sin(a / 8 * Math.PI * 2 + 0.39) * 6.6); if (g.get(x, y) === '.') g.set(x, y, 'l'); }
      if (lvl >= 5) { for (const [x, y] of [[9, 12], [30, 12], [9, 16], [30, 16]]) g.set(x, y, 'i'); for (const [x, y] of [[4, 14], [35, 14]]) g.set(x, y, 'V'); }
      if (lvl >= 7) { for (const [x, y] of [[3, 6], [36, 6], [3, 22], [36, 22]]) g.set(x, y, 'a'); for (const [x, y] of [[16, 25], [23, 25]]) g.set(x, y, 'D'); }
      // habitants : détails autour de leur bâtiment
      if (has('gotsumon')) { g.set(4, 10, 'D'); g.set(12, 8, 'a'); }
      if (has('elecmon')) { g.set(35, 8, 'E'); g.set(35, 10, 'E'); }
      if (has('mushroomon')) { g.set(4, 19, 'D'); g.set(12, 20, 'a'); }
      if (has('yokomon')) for (const x of [29, 31, 33]) g.set(x, 24, 'd');
      // emprises des bâtiments et des chantiers : herbe (l'objet bloque le passage)
      for (const id in LOTS) { const L = LOTS[id]; g.rect(L.x, L.y, L.w, L.h, '.'); }
      g.rect(FREE_LOT.x, FREE_LOT.y, FREE_LOT.w, FREE_LOT.h, '.'); g.rect(BANK.x, BANK.y, BANK.w, BANK.h, '.');
      // terrains vagues : rien ne laisse deviner ce qui sera construit
      const vacant = Object.keys(LOTS).filter(id => !has(id)).map(id => LOTS[id]).concat([FREE_LOT]);
      if (has('biyomon')) vacant.pop();
      if (!has('kunemon')) vacant.push(BANK);
      vacant.forEach((L, i) => { g.scatter('j', L.x, L.y, L.w, L.h, 9, 40 + i, ['.']); g.scatter('r', L.x, L.y, L.w, L.h, 1, 50 + i, ['.']); });
      g.rect(14, 2, 12, 4, '.');
      g.rect(29, 3, 5, 4, '.');   // maison du joueur (maps/joueur.js)
      g.rect(BANK.x, BANK.y + BANK.h, BANK.w + 1, 1, '.'); // devant la banque : passage dégagé
      // route du nord vers le Quartier Résidentiel : elle n'existe qu'une fois le quartier ouvert
      if (nord) {
        tr([[11.5, 10], [12, 5], [11.5, -1]], 0.95, 11); g.rect(11, 0, 2, 2, '=');
        for (const [x, y] of [[9, 2], [10, 2], [13, 2], [14, 2]]) g.set(x, y, 'K');
        if (has('gotsumon')) g.set(13, 8, 'a');
      }
      // panneaux
      g.set(4, 12, 'S'); g.set(18, 26, 'S'); g.set(7, 25, 'S');
    });
    // objets : maison de Jijimon, bâtiments ou chantiers, fontaine, clôtures
    m.objects = [{ kind: 'jhouse', v: lvl < 3 ? 0 : lvl < 7 ? 1 : 2, x: 14, y: 2, w: 12, h: 4 },   // taudis, rénovée, cossue   // grande maison à étage (centrée comme avant : porte au milieu)
       { kind: 'mailbox', x: 22, y: 6, w: 1, h: 1, small: true }, (() => { const k = Object.keys(st().kids || {}).filter(id => st().kids[id] && id !== st().hero).length;   // ta maison grandit avec les enfants qui y vivent : manoir (2), palais (4)
         return k >= 2 ? { kind: 'homepalace', v: k >= 4 ? 1 : 0, x: 29, y: 3, w: 5, h: 3, home: true } : { kind: DW.Home && Object.keys((st().home || {}).owned || {}).length >= 4 ? 'cottage' : 'shack', v: 2, x: 29, y: 3, w: 5, h: 3, home: true }; })()];   // ta maison : un taudis, rénové dès qu'elle est un peu meublée
    for (const id in LOTS) {
      const L = LOTS[id];
      // (la façade grandit avec la ville, comme l'intérieur : gfx/grandir.js, maps/grandir.js)
      if (has(id)) m.objects.push({ kind: L.kind, v: DW.World.buildingForm ? DW.World.buildingForm() : 0, x: L.x, y: L.y, w: L.w, h: L.h }, { kind: 'hangsign', v: L.sign[0], x: L.sign[1], y: L.sign[2], w: 1, h: 1, small: true });
    }
    m.objects.push({ kind: 'bigfountain', v: has('betamon') ? 1 : 2, x: 18, y: 13, w: 4, h: 2 });
    // ville en ruines (niveaux 0 à 2) : la place n'est pas vide, elle est abandonnée — caisses, sacs, pilier tombé,
    // coquillages et touffes d'herbe entre les pavés ; tout disparaît quand la ville renaît
    if (lvl < 3) for (const [k, x, y, v, walk] of [['crates', 15, 11, 0], ['crates', 16, 11, 1], ['sacks', 24, 12, 0], ['brokenpillar', 14, 16, 0], ['crates', 25, 16, 1],
      ['shellpile', 22, 17, 0, true], ['shellpile', 16, 18, 1, true], ['urn', 23, 10, 2]]) m.objects.push({ kind: k, v, x, y, w: 1, h: 1, small: true, ...(walk ? { walk: true } : {}) });
    if (has('biyomon')) m.objects.push({ kind: 'poste', ...FREE_LOT }, { kind: 'hangsign', v: 4, x: 29, y: 25, w: 1, h: 1, small: true });
    if (has('kunemon')) m.objects.push({ kind: 'bank', ...BANK });
    if (lvl >= 1) m.objects.push({ kind: 'laundry', x: 14, y: 7, w: 3, h: 1 });
    if (nord) m.objects.push({ kind: 'districtgate', v: 0, x: 9, y: 0, w: 6, h: 3, top: true });
    // clôtures : jardins des maisons (réparées à partir du niveau 2)
    if (lvl >= 2) {
      m.objects.push({ kind: 'fence', v: 4, x: 33, y: 25, w: 4, h: 1, oy: 0 });
    }
    if (lvl >= 5) {
      m.objects.push({ kind: 'bunting', v: 6, x: 14, y: 9, w: 6, h: 1, top: true, oy: -40 });
      m.objects.push({ kind: 'bunting', v: 6, x: 20, y: 9, w: 6, h: 1, top: true, oy: -40 });
    }
    // habitants
    // (les commerçants sont dans leur boutique : on y entre par la porte)
    m.npcs = [starterNpc(), GUIDE];
    if (has('betamon')) m.npcs.push({ sp: 'betamon', x: 22, y: 16, face: 'left', wander: 1, talk: SERVICES.betamon });
    // (Biyomon travaille à l'intérieur de la Poste : maps/interieurs.js)
    // (Kunemon tient la Banque à l'intérieur : maps/interieurs.js, banque_in)
    // passants : plus la ville se développe, plus elle s'anime (comme les villes de Digimon World 2003)
    const nPass = Math.min(PASSERS.length, Math.floor(T().progress() / 12));
    // (rythme de la ville : la nuit, la plupart rentrent dormir ; il ne reste que les couche-tard, un sur trois)
    const awake = i => () => { const h = DW.Time.hour(); return h >= 6 && h < 22 || i % 3 === 0; };
    for (let i = 0; i < nPass; i++) { const [sp, x, y] = PASSERS[i]; if (DW.SPECIES[sp] && (!DW.Citizens || DW.Citizens.known(sp))) m.npcs.push({ sp, x, y, face: i % 2 ? 'left' : 'right', wander: 3, cond: awake(i), talk: () => passerTalk(sp) }); }
    // collaborations : le second habitant travaille sur place (game/collab.js)
    if (DW.Collab) DW.Collab.place(m, { gotsumon: [LOTS.gotsumon.x + LOTS.gotsumon.w, LOTS.gotsumon.y + LOTS.gotsumon.h], elecmon: [LOTS.elecmon.x - 1, LOTS.elecmon.y + LOTS.elecmon.h], fontaine: [23, 15] });
    m.npcs.forEach(n => { delete n.hx; delete n.hy; delete n.home; });
    m.doors = [{ x: 19, y: 5, w: 2, dir: 'up', to: 'maison', tx: 7, ty: 10 },
      { x: FREE_LOT.x + 2, y: FREE_LOT.y + FREE_LOT.h - 1, w: 2, dir: 'up', to: 'poste_in', tx: 6, ty: 8, cond: st => !!(st.recruits && st.recruits.biyomon) },
      { x: BANK.x + 2, y: BANK.y + BANK.h - 1, w: 2, dir: 'up', to: 'banque_in', tx: 5, ty: 8, cond: st => !!(st.recruits && st.recruits.kunemon) }].concat(Object.keys(LOTS).map(id => {
      const L = LOTS[id];
      return { x: L.x + 2, y: L.y + L.h - 1, w: 2, dir: 'up', to: L.in[0], tx: L.in[1], ty: L.in[2], cond: st => !!(st.recruits && st.recruits[id]) };
    }));
    // panneaux : ville, direction du terrain
    m.signs = {
      '4,12': () => say(`Ville des Fichiers — ${T().label()}.  Nord-ouest : Plage des Cabines.  Sud : Terrain d'entraînement.  Sud-ouest : Quartier des Champs.`),
      '7,25': 'Sud-ouest : Quartier des Champs. Un moulin, un étang, et des champs à perte de vue.',
      '18,26': "Sud : Terrain d'entraînement. Le niveau se gagne en combat, les Digivolutions à l'entraînement !",
    };
    for (let x = 18; x < 22; x++) for (const y of [13, 14]) m.signs[`${x},${y}`] = fountainUse;
    if (has('kunemon')) for (let x = BANK.x; x < BANK.x + BANK.w; x++) if (x < BANK.x + 2 || x > BANK.x + 3) m.signs[`${x},${BANK.y + BANK.h - 1}`] = 'LA BANQUE DE KUNEMON — entre par la porte : Kunemon garde tes objets en trop.';
    zoomMap(m, 'village');   // plan agrandi ×2 (maps/common.js)
    // RACCORD AVEC LA PLAGE DES CABINES (à l'ouest) : la route d'entrée longe le haut d'une falaise et, en dessous,
    // c'est la mer, comme de l'autre côté de la frontière. La côte se prolonge donc ici : falaise sous la route,
    // puis plage et mer à l'ouest de la rivière (qui se jette dans la mer). La ville elle-même ne change pas.
    { const g = m.rows.map(r => [...r]), pp = DW.PUZZLE && DW.PUZZLE.passage('plage', 'village'), road = m.warps.find(w => w.to === 'plage'), y0 = pp != null ? pp + 6 : DW.PUZZLE ? 8 : road ? road.y + road.h : 32;   // (sous le passage du puzzle, comme la falaise de la plage)
      for (let y = y0; y < g.length; y++) {
        const k = y - y0, sea = Math.min(4, 3 + (DW.Art.hash(y, 1, 771) < 0.4 ? 1 : 0));
        for (let x = 0; x < 6; x++) {
          if (g[y][x] === '~' || g[y][x] === '_') continue;
          g[y][x] = k < 2 ? 'C' : x < sea ? '~' : (DW.Art.hash(x, y, 772) < 0.15 ? 'R' : 's');
        }
      }
      m.sel = (x, y) => x < 4 && y >= y0 + 2;   // (l'eau salée de la ville : la mer de la côte ouest, sous la falaise ; la rivière, à partir de x 4, reste douce : game/paysage.js)
      m.rows = g.map(r => r.join('')); }
    m.paintGround = c => paintTown(c, m, lvl);   // sol peint par-dessus les cases : place, bords des chemins, pelouses
    // grand panneau d'affichage de la ville, à droite de la maison de Jijimon : une note épinglée par habitant revenu
    { const J = m.objects.find(o => o.kind === 'jhouse'), bx = J.x + J.w + 1, by = J.y + J.h - 1;
      // (emprise de 4 cases : le grand panneau déborde de part et d'autre de ses pieds, on ne doit pas le traverser)
      m.objects.push({ kind: 'noticeboard', v: Math.min(8, lvl), x: bx - 1, y: by, w: 4, h: 1 });
      for (const x of [bx - 1, bx, bx + 1, bx + 2]) m.signs[`${x},${by}`] = () => DW.Chapter.townSign();
      // Motimon, le gardien du calendrier (saisons, météo : game/calendrier.js)
      m.npcs.push({ sp: 'motimon', x: bx + 3, y: by + 1, face: 'left', talk: () => DW.Calendar.talk() });
      // le Centre de météorologie de Motimon apparaît quand la ville atteint le niveau 6 (antenne et panneau)
      if (lvl >= 6) { m.objects.push({ kind: 'antenna', x: bx + 4, y: by, w: 1, h: 1, small: true }); m.signs[`${bx + 4},${by}`] = 'CENTRE DE MÉTÉOROLOGIE — Motimon. Température, saisons et prévisions du lendemain.'; } }
    // porte de la maison du joueur, placée sur la maison une fois le plan agrandi
    { const o = m.objects.find(o => o.home); DW.HOME_DOOR = { x: o.x + 2, y: o.y + o.h - 1 };
      m.doors.push({ x: o.x + 2, y: o.y + o.h - 1, w: 1, dir: 'up', to: 'maison_joueur', tx: 7, ty: 10, _zt: true });
      m.signs[`${o.x + 3},${o.y + o.h - 1}`] = 'Ta maison. (Meubles en vente au Bazar de Gotsumon.)'; }
    if (DW.Story.placeKiosks) DW.Story.placeKiosks(m, 'village');   // stands des recrues (story.js)
    DW.World.unprepare(m); delete m.w;
  }
  // ------------------------------------------------------------ le partenaire (sur la place) : le bébé de la lignée du héros
  const BABY_LINES = {
    botamon: "Bo-bo ! Moi c'est Botamon ! Je suis tout petit, mais un jour, je serai un grand Digimon de feu !",
    punimon: 'Puni puni ! Moi c\'est Punimon ! Je sautille plus haut que tout le monde !',
    pichimon: "Pichi pichi ! Moi c'est Pichimon ! Je fais les plus grosses bulles de toute l'île !",
    yuramon: "Fuu... Je suis Yuramon. Tu veux bien m'emmener avec toi ? J'ai peur du vent...",
    nyokimon: 'Nyoki ! Je suis Nyokimon ! La fleur sur ma tête s\'ouvre quand je suis content... et là, elle est grande ouverte !',
    pabumon: 'Pabu pabu... *bulles* ... Moi, Pabumon ! Toi... mon ami ?',
    poyomon: 'Poyo poyo ! Je suis Poyomon ! Je flotte, je flotte... et je te suis partout !',
  };
  function starterTalk() {
    return async () => {
      const s = st(), sp = DW.heroLine().baby, name = DW.SPECIES[sp].name;
      await say(BABY_LINES[sp] || `Je suis ${name} !`, name);
      await say(`On dirait que ${name} t'attendait, toi et personne d'autre. Ton Digivice s'illumine...`);
      const m = new DW.Digimon(sp, 4);
      m.happy = 70;
      DW.addDigimon(m);
      // le partenaire prend la place du petit Digimon de la place (pas d'apparition ailleurs)
      const ow = DW.ow, n = ow && (ow.map.npcs || []).find(q => q.sp === sp && q.talk && !q.story);
      if (n) Object.assign(ow.f, { x: n.x, y: n.y, sx: n.x, sy: n.y, tx: n.x, ty: n.y, t: 0, moving: false, face: n.x < ow.p.x ? 'right' : 'left' });
      DW.Audio.sfx('fanfare');
      await say(`${name} devient ton partenaire !`);
      await say("Génial ! On va former une super équipe, toi et moi !", name);
      s.flags.starter = sp;
      DW.giveItem('viande', 5); DW.giveItem('remede', 3);
      DW.Audio.sfx('buy');
      await say('Jijimon avait laissé un colis pour toi : 5 Viandes et 3 Remèdes !');
      await say("(Koromon, le petit Digimon rose qui se promène sur la place, connaît bien la ville : demande-lui conseil !)");
      DW.autosave();
    };
  }
  // le bébé de la place (sa lignée dépend du héros choisi ; il disparaît de la place une fois devenu partenaire)
  const starterNpc = () => ({ sp: DW.heroLine().baby, x: 18, y: 11, face: 'right', wander: 1, talk: starterTalk(), cond: s => !s.flags.starter });

  // ------------------------------------------------------------ Koromon : le guide de la ville (le seul Digimon qui se promène en ville au début)
  // conseils selon la situation : d'abord l'urgent (faim, toilettes), puis les objectifs, à tour de rôle
  async function guideTalk() {
    const s = st(), m = s.party[0], next = T().prochain();
    const urgent = [], tips = [];
    if (!s.flags.starter) urgent.push(`Ko-ko ! Bonjour ! Un bébé Digimon t'attend ici, sur la place : ${DW.SPECIES[DW.heroLine().baby].name}. Va lui parler !`);
    else {
      if (m && m.hunger >= 70) urgent.push(`${m.name} a faim ! Tanemon donne 3 Viandes par jour dans son DigiChamp, au Quartier des Champs (sortie sud-ouest).`);
      // (le Médicament n'est en rayon au Bazar qu'une fois la ville un peu développée : DW.shopStock)
      if (m && m.sick) urgent.push(T().has('gotsumon') && DW.shopStock('bazar').includes('medoc') ? `${m.name} est malade ! Un Médicament le guérira (Bazar de Gotsumon), ou une nuit chez Jijimon.`
        : `${m.name} est malade ! Une bonne nuit chez Jijimon le guérira.${T().has('gotsumon') ? ' (Le Bazar vendra des Médicaments quand la ville aura grandi.)' : ''}`);
      else if (m && (m.germs || 0) >= 50) { const c = DW.Life.causes(m).map(x => x[1]); urgent.push(`${m.name} n'a pas l'air bien...${c.length ? ' Fais attention : ' + c.join(', ') + '.' : ''} S'il accumule les négligences, il tombera malade. Le sommeil l'aide à se rétablir.`); }
      if (m && m.need >= 60) urgent.push("Vite ! Il y a des toilettes au sud de la ville, près de la route du Terrain d'entraînement.");
      if (m && DW.Evo.available(m).length) urgent.push(`${m.name} peut digivoluer ! Ouvre le menu (ENTRÉE) → DIGIMON → onglet DIGIVOLUTION.`);
      tips.push("Les Digimon ne se capturent pas : ils naissent ! Penguinmon confie un DigiŒuf par jour au Village des Bébés, à l'est de la Prairie. Ensuite, entraîne-les pour qu'ils digivoluent !");
      tips.push("Certains chemins sont fermés par un voile de données... Ils s'ouvriront au fil de l'aventure, quand le calme reviendra sur l'île. Jijimon sait toujours ce qu'il faut faire ensuite !");
      if (!s.flags.tanemon) tips.push("Tu connais Tanemon ? Il cultive de la Digiviande au Quartier des Champs, au sud-ouest. Passe le voir chaque jour !");
      if (!T().level()) tips.push("La ville est vide... Les Digimon de l'île ont tout oublié. Explore l'ouest, retrouve-les et ramène-les ici !");
      if (m && DW.Training.total(m) < 10) tips.push("Les combats font monter le niveau. Mais pour digivoluer, il faut s'entraîner au Terrain d'entraînement, au sud.");
      if (next) tips.push(`On m'a dit qu'un Digimon se cache du côté de « ${MAPS[next.zone].name} », ${next.hint}... Il cherche peut-être un endroit où vivre.`);
      if (DW.bagUsed() >= DW.bagSlots() || Object.values(s.bag).some(n => n >= DW.BAG_MAX)) tips.push(`Ton sac est limité : ${DW.BAG_MAX} exemplaires par objet et ${DW.bagSlots()} sortes d'objets. Plein, il ne ramasse plus rien : range tes affaires dans ton coffre, et la nourriture dans ton frigo !`);
      tips.push("Chez Jijimon, Poyomon te propose une sieste dans le lit : ça soigne toute l'équipe.", "Ton partenaire a besoin d'aller aux toilettes de temps en temps. Sinon... gare aux accidents !");
    }
    if (urgent.length) { await say(urgent[0], 'Koromon'); return; }
    const k = (s.flags.bota || 0) % tips.length;
    s.flags.bota = k + 1;
    await say(tips[k], 'Koromon');
  }
  // premier échange : la visite guidée (game/chapitre1.js) ; ensuite, des conseils
  // passants (espèce, position d'origine) et leurs bavardages
  const PASSERS = [['tokomon', 15, 12], ['tsunomon', 24, 16], ['agumon', 10, 14], ['gabumon', 29, 15], ['tentomon', 19, 21], ['patamon', 8, 18], ['bukamon', 31, 11], ['pagumon', 22, 23]];
  async function passerTalk(sp) {
    const name = DW.SPECIES[sp].name, lv = T().level();
    const lines = lv < 4 ? ["La ville renaît peu à peu... C'est grâce à toi !", "Avant, il n'y avait que des ruines ici. Regarde maintenant !", "J'ai entendu dire que d'autres Digimon allaient revenir s'installer."]
      : lv < 8 ? ['Il y a de plus en plus de monde en ville ! On se croirait au marché.', T().has('mushroomon') ? 'Tu as goûté la cuisine du Restaurant ? Un régal !' : "J'ai entendu parler d'un Digimon champignon qui cuisine à merveille... Il vit dans la Prairie, paraît-il.", "Motimon dit qu'il va pleuvoir demain. Il se trompe rarement maintenant !"]
      : ["La Ville des Fichiers est devenue une vraie cité ! Qui l'aurait cru ?", 'Des Digimon viennent de toute l\'île pour voir notre ville.', "Le soir, avec les lanternes, la place est magnifique."];
    // selon l'heure : le matin on s'étire, le soir on flâne, la nuit on bâille
    const h = DW.Time.hour(), f = st().flags;
    if (h >= 22 || h < 6) lines.push('Il est tard... Je ne devrais pas traîner dehors. *bâille*', 'Chut ! Tout le monde dort. Regarde les étoiles au-dessus de la place...');
    else if (h < 9) lines.push("Bonjour ! Le matin, je fais trois tours de la fontaine pour me réveiller. Tu viens ?", "Le matin, la place est encore toute calme... C'est mon moment préféré pour me promener.");
    else if (h >= 18) lines.push("Le soir, tout le monde se retrouve sur la place pour raconter sa journée.", "Tu as vu le coucher de soleil sur la plage ? Magnifique !");
    // les nouvelles de l'aventure font le tour de la ville
    if (f.seadramon) lines.push("Il paraît que tu as calmé Seadramon, au grand lac ! Les Gomamon en parlent encore.");
    if (f.meramon) lines.push('Meramon est en ville ! Ses grillades sont brûlantes... dans tous les sens du terme.', "Les Yokomon de l'ouest t'ont fait une statue en fleurs, il paraît !");
    if (DW.Tournament && (f.cups || null)) lines.push('Tu as gagné une coupe au tournoi du Dojo ? Bravo, champion !');
    await say(DW.pick(lines), name);
  }
  const GUIDE = { sp: 'koromon', x: 21, y: 11, face: 'left', wander: 3, talk: ow => (st().flags.tour ? guideTalk() : DW.Chapter.tour(ow)) };

  // ------------------------------------------------------------ Jijimon (dans sa maison)
  async function jijimonTalk() {
    const s = st();
    if (!s.flags.starter) { await say(`${DW.SPECIES[DW.heroLine().baby].name} t'attend dehors, sur la place. Va le voir !`, 'Jijimon'); return; }
    // album du chapitre 1 complet : une récompense, une fois
    if (DW.Cards && !s.flags.album1 && DW.Cards.ch1Count() >= DW.Cards.CH1.length) {
      s.flags.album1 = true; DW.Audio.sfx('fanfare');
      await say("Hohoho ! Tu as réuni toutes les cartes des Digimon de la forêt et de la plage ? Quel collectionneur !", 'Jijimon');
      const extra = DW.giveItem('manuel', 1) + DW.giveItem('soin_g', 2); s.bits += 1000;
      await say(`Tiens, prends ceci : un Manuel de technique, 2 RAM PV++ et 1000 Bits !${DW.extraMsg(extra)}`, 'Jijimon');
    }
    if (!s.flags.jiji_tanemon) { s.flags.jiji_tanemon = true; await say("Si ton partenaire a faim, va voir Tanemon au Quartier des Champs : il cultive de la Digiviande et en donne chaque jour.", 'Jijimon'); }
    // (le repos et la sieste, c'est Poyomon, près du lit : poyomonTalk)
    const r = 1 + await DW.ask("Que veux-tu, jeune DigiSélectionné ?", ['Des conseils', 'Questions', 'Au revoir'], 'Jijimon');
    if (r === 2) { await DW.Guide.questions('Que veux-tu savoir ?'); return; }
    if (r === 1) await jijimonAdvice();
  }
  // ------------------------------------------------------------ Poyomon (près du lit de Jijimon) : la sieste
  async function poyomonTalk() {
    const s = st();
    const r = await DW.ask("Poyo poyo ! Tu veux faire une sieste ? Le lit de Jijimon est tout moelleux !", ['Faire la sieste', 'Non merci'], 'Poyomon');
    if (r === 0) {
      // dormir seulement à l'heure du coucher de ton Digimon ; sinon une heure de repos
      const m = DW.Care.lead(), sleepy = m && DW.Life.sleepy(m);
      await say(sleepy ? "Poyo ! Ton Digimon tombe de sommeil... Dodo ! Je veille sur vous !" : "Poyo... Il n'a pas sommeil. Une petite sieste d'une heure, alors !", 'Poyomon');
      const res = await DW.Life.restOrSleep();
      if (!res) return;
      s.heal = { map: 'maison', x: 12, y: 5 };
      if (res === 'sleep') {
        await healAll('Toute ton équipe est en pleine forme !');
        // une nuit chez Jijimon efface un K.O. (la règle des 3 K.O. reste, sans être un piège)
        for (const m of s.party) if ((m.kos || 0) > 0) { m.kos--; await say(`${m.name} a bien récupéré : un K.O. s'efface (${m.kos}/3).`, 'Poyomon'); }
      }
      DW.autosave();
    }
  }
  async function jijimonAdvice() {
    {
      // d'abord ce qu'il faut faire maintenant (l'objectif du chapitre), puis un habitant qu'on peut aller chercher
      if (DW.Chapter && DW.Chapter.objective) await say(`Ce qui compte maintenant : ${DW.Chapter.objective()}`, 'Jijimon');
      const next = T().prochain();
      if (next) await say(`On raconte qu'un Digimon solitaire se cache du côté de « ${MAPS[next.zone].name} », ${next.hint}... Il cherche peut-être un endroit où vivre. Qui sait ce qu'il apporterait à la ville ?`, 'Jijimon');
      else if (T().RECRUITS.every(x => T().has(x.id))) await say("La ville n'a jamais été aussi belle ! Merci, mon enfant.", 'Jijimon');
      await say(`Pour l'instant, la ville est à ${T().label()}.`, 'Jijimon');
      await say("Ton partenaire ne digivoluera pas tout seul : entraîne-le au terrain du sud, gagne des combats, puis consulte la table des Digivolutions.", 'Jijimon');
    }
  }
  DW.Story.jijimonTalk = jijimonTalk;
  DW.Story.poyomonTalk = poyomonTalk;

  // ------------------------------------------------------------ services des habitants
  const SERVICES = {
    async gotsumon() {
      await say('Bienvenue au Bazar de Gotsumon ! Viande fraîche et remèdes !', 'Gotsumon');
      const r = await DW.ask('Que veux-tu voir ?', ['Boutique', 'Meubles pour ta maison', 'Le pari des cailloux', 'Au revoir'], 'Gotsumon');
      if (r === 1) { await DW.Home.furnitureShop(); return; }
      if (r === 2) { await gotsuBet(); return; }
      if (r !== 0) return;
      await DW.Game.push(new DW.ShopScene('bazar'));
      await say('Reviens vite !', 'Gotsumon');
    },
    async elecmon() {
      await say("Bienvenue au Dojo ! Grâce à mes conseils, chaque séance réussie rapporte un point d'entraînement de plus.", 'Elecmon');
      await say("Le Terrain d'entraînement est au sud de la ville, et mes mannequins juste là. Allez, au travail !", 'Elecmon');
    },
    async mushroomon() {
      const s = st();
      await say("Hihi ! Bienvenue au Restaurant aux Champignons !", 'Mushroomon');
      const r = await DW.ask('Que veux-tu faire ?', ['Champi-repas (80 Bits)', 'Apprendre une recette', 'Cuisiner', 'Au revoir'], 'Mushroomon');
      if (r === 1) {
        if (!s.flags.cookIntro) { s.flags.cookIntro = true; await say("Tu veux apprendre à cuisiner ? Hihi ! Rapporte-moi les ingrédients d'un plat : je le cuisine devant toi, et la recette est à toi.", 'Mushroomon'); await say('Les plats cuisinés rendent ton partenaire plus fort, pour toujours !', 'Mushroomon'); }
        await DW.Cuisine.mushroomQuest();
        return;
      }
      if (r === 2) {
        if (!DW.Cuisine.known().length) { await say("Tu ne connais encore aucune recette ! Choisis « Apprendre une recette » : je vais t'en montrer une.", 'Mushroomon'); return; }
        await DW.Cuisine.cook('Restaurant');
        return;
      }
      if (r !== 0) return;
      if (s.bits < 80) { await say("Tu n'as pas assez de Bits...", 'Mushroomon'); return; }
      s.bits -= 80;
      s.party.forEach(m => { m.addHappy(8); m.tired = 0; m.hunger = 0; });
      DW.Audio.sfx('heal');
      await say("Miam ! Toute l'équipe est ravie (bonheur +8) : plus de faim, et la fatigue s'est envolée !");
    },
    async yokomon() {
      await say("Le Jardin est l'endroit où se reposent les Digimon de ta DigiFerme.", 'Yokomon');
      await DW.Game.push(new DW.FarmScene());
    },
    async biyomon() {
      const played = st().flags.biyoGame === DW.Time.day();
      const r = await DW.ask('Cui cui ! Je peux te faire voler jusqu\'à un endroit que tu connais, ou te donner des nouvelles !', [`Vol rapide (${FLY_FEE} Bits)`, 'Des nouvelles ?', played ? 'Jeu du courrier (demain !)' : 'Le jeu du courrier (1 fois par jour)', 'Au revoir'], 'Biyomon');
      if (r === 0) { await flyMenu(); return; }
      if (r === 2) { await biyoGame(); return; }
      if (r !== 1) return;
      await say('Cui cui ! Du courrier pour toi ? Hmm... Non, mais j\'ai des nouvelles !', 'Biyomon');
      // un indice par visite, sur un Digimon différent à chaque fois (tous ceux qui manquent y passent, à tour de rôle),
      // d'abord ceux qu'on peut trouver maintenant (ceux du chapitre 1 ont tous un indice)
      // + les grands Digimon menaçants du chapitre 1, tant qu'ils ne sont pas vaincus (Kuwagamon, Shellmon, Whamon)
      const f = st().flags, all = T().RECRUITS.filter(x => !T().has(x.id) && x.hint), lock = DW.Chapter && DW.Chapter.lock;
      const BOSS = [
        !f.kuwagamon && { boss: true, say: "Un monstre rouge aux pinces énormes, Kuwagamon, se cache dans le Grand Arbre de la Clairière de l'Arrivée. Des mots luisent, gravés dans l'écorce : réponds juste, et le tronc s'ouvrira... Mais entraîne-toi d'abord, c'est un Champion !" },
        f.kuwagamon && !f.shellmon && { boss: true, say: f.shellLair ? "Sous les cabines de la plage, le sable s'est ouvert. Tout au fond, un énorme coquillage, Shellmon, retient un enfant prisonnier ! Prends des RAM PV, c'est un Champion redoutable." : "Les cabines téléphoniques de la plage murmurent chacune un mot... Mises dans le bon ordre, elles forment un appel au secours. Un gros Digimon, Shellmon, se cache dessous !" },
        f.shellmon && !f.whamon && { boss: true, say: "Les pêcheurs de la Crique du Radeau ne sortent plus en mer... Au large, un jet d'eau gigantesque jaillit, et les vagues se soulèvent toutes seules, comme si quelque chose d'énorme se débattait sous la surface. Le vieux radeau de la crique pourrait t'y mener... si tu es prêt. Ce qui se cache là-dessous est bien plus fort que Shellmon." },
        // après Kuwagamon : le passage secret vers le Village des Yokomon (maps/yokomon.js)
        f.kuwagamon && !(st().visited || {}).village_yokomon && { boss: true, say: "Au nord-est de la Prairie des Lucioles, contre les arbres, il y a un tronc creux couché, avec un petit panneau. On entend des petites voix de l'autre côté... Parle au tronc pour t'y faufiler !" },
        // chapitre 2 (game/chapitre2.js)
        (f.chapter || 1) >= 2 && !f.monoCh2 && { boss: true, say: "Sur la Rive Sud du grand lac, au nord de la Clairière, deux Monochromon se disputent le chemin à grands coups de cornes ! Leur carapace est dure comme le diamant... mais l'eau la traverse sans peine !" },
        (f.chapter || 1) >= 2 && f.monoCh2 && !f.seadramon && st().hero === 'perso' && { boss: true, say: "Au Lac du Tramway, une île porte un vieux tramway. La nuit (20 h - 5 h), on y entend un harmonica... Un garçon blond y campe avec un Digimon à fourrure. Mais méfie-toi de la grande feuille rouge, sur la rive de l'île !" },
        // chapitre 3 : le Pays de Meramon (game/chapitre3.js ; la soif des Yokomon et le trésor de l'épave : game/quetes.js)
        (f.chapter || 1) >= 3 && !f.yokoVillage && { boss: true, say: "À l'ouest de la Clairière de l'Arrivée, le voile de données s'est levé sur un désert hérissé de vieux poteaux télégraphiques. Leur ligne mène jusqu'au Village des Yokomon !" + (!f.meramon && !f.yokoSoif ? " Un Yokomon parti chercher de l'eau n'y serait jamais rentré : ouvre l'œil près de l'oasis du désert." : '') },
        (f.chapter || 1) >= 3 && !f.meramon && { boss: true, say: "Au Village des Yokomon, la fontaine est à sec et le petit lac a presque disparu ! Meramon, le gardien du Mont Miharashi, brûle tout depuis qu'une chose noire lui est tombée dessus." + (st().hero === 'perso' && !(st().kids || {}).sora && !f.soraMet ? " Une fille au chapeau bleu et une Biyomon, comme moi, aident les Yokomon : va les voir !" : '') + " Méfie-toi, c'est un Champion de feu !" },
        f.meramon && !(st().chests || {}).epave_coffre && { boss: true, say: "Au Village des Yokomon, l'eau revient peu à peu dans le petit lac... et quelque chose brille dans la vieille épave ! Les Yokomon ne savent pas nager : un passage de planches, au sud du lac, mène jusqu'au banc de sable." },
      ].filter(Boolean);
      const reach = BOSS.concat(all.filter(x => !lock || !lock(x.zone)));
      if (!reach.length && !all.length) { await say(T().RECRUITS.some(x => !T().has(x.id)) ? "Les Digimon d'ici sont tous rentrés ! Les autres sont plus loin, dans les régions de l'île..." : 'Tout le monde est rentré en ville ! Quelle joie !', 'Biyomon'); return; }
      const list = reach.length ? reach : all, k = (f.biyoHint || 0) % list.length, next = list[k];
      f.biyoHint = (f.biyoHint || 0) + 1;
      if (next.boss) await say(`Cui ! Attention... ${next.say}`, 'Biyomon');
      else await say(`On m'a parlé d'un Digimon qui aimerait vivre ici... On l'aurait aperçu ${next.hint}. Il attend dans un coin un peu à l'écart : explore bien les alentours !`, 'Biyomon');
      if (list.length > 1) await say(`(J'ai encore ${list.length - 1} autre${list.length > 2 ? 's' : ''} nouvelle${list.length > 2 ? 's' : ''} pour toi. Reviens me voir !)`, 'Biyomon');
    },
    async kunemon() {
      await say('Bzzz... Bienvenue à la Banque ! Je garde tout ce que ton sac ne peut pas porter.', 'Kunemon');
      await DW.Game.push(new DW.BankScene());
      await say('À bientôt, bzzz !', 'Kunemon');
    },
    async betamon() {
      await say(`Bloub ! La fontaine coule de nouveau. Bois son eau quand tu es ${DW.gn('fatigué', 'fatiguée')} !`, 'Betamon');
    },
  };
  DW.Story.services = SERVICES;
  DW.Story.flyMenu = qui => flyMenu(qui);   // (aussi au relais de Birdramon : game/services.js)
  // le pari de Gotsumon : trois cailloux, un seul cache une pépite (50 Bits la partie, 150 si tu trouves), 3 parties par jour
  async function gotsuBet() {
    const s = st(), f = s.flags, d = DW.Time.day();
    if (!f.gotsuBet || f.gotsuBet.d !== d) f.gotsuBet = { d, n: 0 };
    if (f.gotsuBet.n >= 3) { await say("Assez joué pour aujourd'hui ! Mes cailloux ont besoin de repos. Grrr.", 'Gotsumon'); return; }
    if (s.bits < 50) { await say("Il te faut 50 Bits pour jouer !", 'Gotsumon'); return; }
    if ((await DW.ask("Une pépite est cachée sous un de ces trois cailloux. 50 Bits la partie, je t'en donne 150 si tu la trouves !", ['Jouer', 'Non merci'], 'Gotsumon')) !== 0) return;
    s.bits -= 50; f.gotsuBet.n++;
    const win = Math.floor(Math.random() * 3), pick = await DW.ask('Quel caillou ?', ['Le gauche', 'Celui du milieu', 'Le droit'], 'Gotsumon', false);
    if (pick === win) { s.bits += 150; DW.Audio.sfx('buy'); await say('Grrr... Bien joué ! Voilà tes 150 Bits.', 'Gotsumon'); }
    else await say(`Raté ! La pépite était sous ${['le caillou de gauche', 'celui du milieu', 'le caillou de droite'][win]}. Hé hé !`, 'Gotsumon');
  }
  // le jeu du courrier de Biyomon : retenir l'ordre de 4 lettres (une fois par jour, récompense : un paquet de cartes)
  async function biyoGame() {
    const s = st(), f = s.flags, d = DW.Time.day();
    if (f.biyoGame === d) { await say("On a déjà joué aujourd'hui ! Reviens demain, j'aurai d'autres lettres.", 'Biyomon'); return; }
    const DEST = ['Jijimon', 'Gotsumon', 'Tanemon', 'Koromon', 'Motimon'];
    const seq = Array.from({ length: 4 }, () => DW.pick(DEST));
    await say(`Je dois livrer ces lettres dans l'ordre : ${seq.join(', puis ')}. Retiens bien !`, 'Biyomon');
    f.biyoGame = d;
    for (let i = 0; i < 4; i++) {
      const r = await DW.ask(`Lettre n°${i + 1} : pour qui ?`, DEST, 'Biyomon', false);
      if (DEST[r] !== seq[i]) { await say(`Oh non, celle-là était pour ${seq[i]} ! Pas grave, on rejouera demain. Cui !`, 'Biyomon'); return; }
    }
    DW.Audio.sfx('fanfare');
    const extra = DW.giveItem('cartes', 1);
    await say(`Parfait ! Toutes les lettres sont arrivées ! Tiens, un Paquet de cartes pour te remercier.${DW.extraMsg(extra)}`, 'Biyomon');
  }
  // vol rapide (comme Birdramon dans Digimon World) : lieux et régions déjà visités — payant
  // (qui : celui qui te porte et qui parle — Biyomon à la Poste, Birdramon à son relais : game/services.js)
  const FLY_FEE = 80;
  async function flyMenu(qui = 'Biyomon') {
    const s = st(), R = DW.REGION_ENTRY || {};
    if (s.bits < FLY_FEE) { await say(`Un vol coûte ${FLY_FEE} Bits... Il me faut des graines pour avoir la force de voler !${qui === 'Biyomon' ? ' Cui !' : ''}`, qui); return; }
    const dest = [['Ville des Fichiers', 'village', 20, 16], ['Village des Bébés', 'berceau', 18, 15], ['Plage des Cabines', 'plage', 20, 8], ["Clairière de l'Arrivée", 'clairiere', 17, 14]]
      .filter(([, id]) => s.visited[id]).map(([n, id, x, y]) => [n, id, ...zpt(id, x, y)]);
    for (const rid in R) {
      const subs = Object.keys(MAPS).filter(id => MAPS[id].region === rid && MAPS[id].spec);
      if (subs.some(id => s.visited[id])) { const m = MAPS[R[rid]]; dest.push([m.regionName, R[rid], m.spec.hub[0], m.spec.hub[1]]); }
    }
    let page = 0;
    for (;;) {
      const slice = dest.slice(page * 8, page * 8 + 8), more = dest.length > (page + 1) * 8;
      const opts = slice.map(d => d[0]).concat(more ? ['Plus loin...'] : [], ['Annuler']);
      const i = await DW.choose(opts, { y: 8 });
      if (i < 0 || opts[i] === 'Annuler') return;
      if (opts[i] === 'Plus loin...') { page++; continue; }
      const [name, id, x, y] = slice[i];
      if ((await DW.ask(`Voler jusqu'à « ${name} » pour ${FLY_FEE} Bits ?`, ['Oui', 'Non'], qui)) !== 0) return;
      s.bits -= FLY_FEE; DW.Audio.sfx('buy');
      await say(`Accroche-toi bien ! Direction : ${name} !`, qui);
      DW.Audio.sfx('swoosh');
      await DW.fade(1, 0.5, '#ffffff');
      // case praticable la plus proche du point d'arrivée
      const m = DW.getMap(id), free = (X, Y) => X > 0 && Y > 0 && X < m.w - 1 && Y < m.h - 1 && !DW.SOLID.has(m.rows[Y][X]);
      let best = [x, y];
      for (let r = 0; r < 20 && !free(best[0], best[1]); r++)
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
          if (free(x + dx, y + dy) && !free(best[0], best[1])) best = [x + dx, y + dy];
      await DW.ow.charger(id, best[0], best[1], 'down');
      await DW.wait(0.3);
      await DW.fade(0, 0.6);
      return;
    }
  }
  async function fountainUse() {
    const s = st();
    if (!T().has('betamon')) { await say("La fontaine est à sec. Quelqu'un qui aime l'eau saurait peut-être la réparer..."); return; }
    const r = await DW.ask("L'eau claire de la fontaine scintille. Y abreuver tes Digimon ?");
    if (r !== 0) return;
    const [hx, hy] = zpt('village', 20, 16); s.heal = { map: 'village', x: hx, y: hy };
    await healAll('Tes Digimon sont en pleine forme !');
    if (DW.Collab && DW.Collab.on('bains')) { s.party.forEach(m => (m.tired = 0)); await say("Les bains chauds de Gomamon effacent toute leur fatigue !"); }
  }

  // ------------------------------------------------------------ définition
  MAPS.village = {
    name: 'Ville des Fichiers', music: 'village', bg: 'foret', ambient: 'town', theme: 'town', climate: 'village', region: 'village',
    ...DW.MapKit.DW1_GROUND,
    respawn: { map: 'maison', x: 12, y: 5 },
    build,
    onEnter: () => DW.Town.reveal(),
    rows: null, objects: [], npcs: [],
    warps: [{ x: 0, y: 13, w: 1, h: 3, dir: 'left', to: 'plage', tx: 39, ty: 1 }, { x: 11, y: 0, w: 2, h: 1, dir: 'up', to: 'residentiel', tx: 41, ty: 60 }, { x: 19, y: 29, w: 2, h: 1, dir: 'down', to: 'gym', tx: 15, ty: 0, enclos: true },   // (portail du terrain d'entraînement : une transition d'enclos, pas une frontière de carte)
      { x: 5, y: 29, w: 2, h: 1, dir: 'down', to: 'champs', tx: 5, ty: 0 }],
    doors: [],
    // la route de l'est (Montagne de l'Infini) est gardée par la porte de région (regions.js : GATE.montagne)
    triggers: [],
    signs: {},
  };
  build();

  // ------------------------------------------------------------ début de l'aventure (réveil chez Jijimon)
  // la grande discussion d'arrivée (monde, mystère, enquête, règles) : game/guide.js
  DW.Story.opening = () => DW.Guide.opening();
})();
;

// ===== js/maps/joueur.js
'use strict';
// =====================================================================
//  MAISON DU JOUEUR — à l'est de la maison de Jijimon (Ville des Fichiers)
//  On l'aménage en achetant des meubles au Bazar de Gotsumon (rayon « Meubles »).
//  Chaque meuble sert vraiment : lit (repos, soins, sauvegarde), coffre (objets en trop),
//  frigo (en-cas du jour), cuisine (recettes), haltères (entraînement maison), télé (rumeurs),
//  ordinateur (DigiFerme), bibliothèque (discipline), aquarium et plantes (bonheur), toilettes.
//  Certains achats OUVRENT UNE PIÈCE : toilettes → Salle de bain, frigo ou cuisine → Cuisine,
//  coin musculation → Salle de sport (une porte apparaît dans le mur du salon).
//  Quand le salon est aménagé (télévision + canapé), la maison prend un ÉTAGE : la chambre y monte (lit),
//  avec le grenier au-dessus ; on peut alors offrir sa propre chambre à son Digimon. La cave aux trophées
//  s'ouvre avec le premier trophée.
// =====================================================================
(function () {
  const { say, st, healAll } = DW.MapKit;
  const MAPS = DW.MAPS;
  const W = 16, H = 12, DOOR_X = 7;
  const day = () => DW.Time.day();
  const lead = () => st().party[0];
  // une fois par jour et par meuble
  const once = key => { const s = st(), h = s.home; if (!h.used || h.used.day !== day()) h.used = { day: day(), k: [] }; if (h.used.k.includes(key)) return false; h.used.k.push(key); return true; };

  // ------------------------------------------------------------ catalogue des meubles (prix, objet posé, usage)
  const FURN = {
    lit:      { name: 'Lit douillet', price: 0, room: () => (upstairs() ? 'chambre' : null), objs: [{ kind: 'bed', x: 1, y: 3, w: 2, h: 2 }], desc: 'Dormir : soigne toute l\'équipe, sauvegarde, et fait passer la nuit.' },
    coffre:   { name: 'Coffre', price: 0, objs: [{ kind: 'chest', x: 1, y: 6, w: 1, h: 1, small: true }], desc: 'Range les objets que ton sac ne peut pas porter.' },
    toilettes:{ name: 'Toilettes privées', price: 600, room: 'sdb', objs: [{ kind: 'toiletroom', x: 6, y: 3, w: 2, h: 1 }], desc: 'Des toilettes rien qu\'à vous : plus besoin de courir dehors !' },
    plantes:  { name: 'Plantes vertes', price: 500, objs: [{ kind: 'bigplant', x: 14, y: 10, w: 1, h: 1, small: true }, { kind: 'flowerpots', v: 1, x: 3, y: 6, w: 2, h: 1 }], desc: 'Les arroser chaque jour rend ton partenaire heureux (bonheur +3).' },
    frigo:    { name: 'Réfrigérateur', price: 1200, room: 'cuisine', objs: [{ kind: 'fridge', x: 10, y: 3, w: 1, h: 1, small: true }], desc: 'Range ta nourriture (le coffre n\'en veut pas), 20 de chaque. Et chaque jour, un en-cas s\'y trouve !' },
    tele:     { name: 'Télévision', price: 1000, objs: [{ kind: 'crttv', x: 5, y: 3, w: 2, h: 1 }], desc: 'Les nouvelles de l\'île et des rumeurs. Regarder ensemble rend heureux.' },
    biblio:   { name: 'Bibliothèque', price: 1500, objs: [{ kind: 'bookshelf', v: 1, x: 3, y: 3, w: 2, h: 1 }], desc: 'Lire une histoire chaque jour à ton partenaire : discipline +5.' },
    cuisine:  { name: 'Cuisine équipée', price: 2500, room: 'cuisine', objs: [{ kind: 'kitchen', x: 4, y: 3, w: 4, h: 1 }], desc: 'Cuisine tes recettes à la maison, quand tu veux.' },
    // salle de sport : le matériel s'améliore (une séance de plus par jour et un point de plus par séance à chaque niveau)
    sport2:   { name: 'Banc de musculation pro', price: 5000, room: 'sport', needs: () => owned('halteres'), objs: [{ kind: 'weights', x: 8, y: 4, w: 1, h: 1, small: true }, { kind: 'punchbag', x: 11, y: 4, w: 1, h: 1, small: true }, { kind: 'cushion', v: 1, x: 9, y: 4, w: 1, h: 1, small: true }], desc: 'Matériel de pro : 2 séances par jour à la maison, +3 points chacune.' },
    sport3:   { name: 'Salle de sport complète', price: 12000, room: 'sport', needs: () => owned('sport2'), objs: [{ kind: 'dummy', x: 3, y: 8, w: 1, h: 1, small: true }, { kind: 'datacrystal', x: 7, y: 8, w: 1, h: 1, small: true }, { kind: 'hurdle', x: 11, y: 8, w: 1, h: 1, small: true }], desc: 'Tout le matériel du Terrain d\'entraînement : 3 séances par jour, +4 points chacune.' },
    halteres: { name: 'Coin musculation', price: 3000, room: 'sport', objs: [{ kind: 'weights', x: 3, y: 4, w: 1, h: 1, small: true }, { kind: 'cushion', x: 5, y: 4, w: 1, h: 1, small: true }], desc: 'Un entraînement maison par jour : +2 points dans la statistique de ton choix (fatigue).' },
    aquarium: { name: 'Aquarium', price: 2000, objs: [{ kind: 'aquarium', x: 11, y: 10, w: 3, h: 1 }], desc: 'Regarder les poissons détend : bonheur +5 une fois par jour.' },
    ordi:     { name: 'Ordinateur', price: 4000, objs: [{ kind: 'computer', x: 11, y: 7, w: 2, h: 1 }], desc: 'Gère ta DigiFerme depuis la maison.' },
    tapis:    { name: 'Grand tapis et canapé', price: 1800, objs: [{ kind: 'bigrug', v: 1, x: 2, y: 7, w: 4, h: 2, walk: true }, { kind: 'sofa', v: 0, x: 1, y: 10, w: 3, h: 1 }], desc: 'Un salon confortable : ton partenaire se repose mieux (le lit rend aussi +5 de bonheur).' },
    sac1:     { name: 'Grand sac de voyage', price: 1500, objs: [], desc: 'Ton sac peut contenir 4 sortes d\'objets de plus (24).' },
    sac2:     { name: 'Sac d\'explorateur', price: 5000, objs: [], desc: 'Encore 4 sortes d\'objets de plus dans ton sac (28).' },
    chambre_digi: { name: 'Chambre de ton Digimon', price: 2500, room: 'digi', needs: () => upstairs(), objs: [{ kind: 'bed', x: 6, y: 3, w: 2, h: 2 }, { kind: 'toybox', x: 2, y: 3, w: 2, h: 1 }, { kind: 'cushion', v: 1, x: 3, y: 6, w: 1, h: 1, small: true }], desc: 'Une chambre à l\'étage rien que pour ton partenaire : il y dort, ou s\'y repose une heure quand il n\'a pas sommeil.' },
    tableau:  { name: 'Tableaux', price: 800, objs: [{ kind: 'painting', v: 0, x: 9, y: 1, w: 2, h: 1, back: true, oy: 6 }, { kind: 'painting', v: 1, x: 12, y: 1, w: 2, h: 1, back: true, oy: 6 }], desc: 'De beaux tableaux aux murs. Pour le plaisir des yeux.' },
  };
  const ORDER = Object.keys(FURN);
  const owned = id => !!(st().home && st().home.owned[id]);
  // la télévision OU le canapé aménagent le salon, ou un enfant délivré vient habiter chez toi : la maison prend un étage (ta chambre et celles des enfants)
  const KIDS_HOME = ['tai', 'matt', 'sora'];
  const kidsHere = () => KIDS_HOME.filter(k => !!(st().kids || {})[k] && st().hero !== k);
  const upstairs = () => owned('tele') || owned('tapis') || KIDS_HOME.some(k => !!(st().kids || {})[k] && st().hero !== k);
  const roomOf = id => (typeof FURN[id].room === 'function' ? FURN[id].room() : FURN[id].room) || null;
  // pièces annexes : ouvertes par un achat ; porte dans le mur gauche ou droit du salon (side), à la hauteur y
  const ROOMS = {
    sdb:     { name: 'Salle de bain', from: 'salon', at: { wall: 'left', y: 8 }, w: 10, h: 8, by: ['toilettes'], floor: { type: 'tile', cols: ['#e8f4f8', '#c8dce8', '#9ab8cc'] }, wall: { base: '#e4f2f8', alt: '#cfe4ee', pattern: 'diamond', wood: '#5a8aa8' },
      decor: [{ kind: 'bigrug', v: 0, x: 2, y: 5, w: 3, h: 1, walk: true }, { kind: 'bigplant', x: 8, y: 6, w: 1, h: 1, small: true }, { kind: 'shelf', x: 2, y: 1, w: 2, h: 1, back: true, oy: 6 }] },
    cuisine: { name: 'Cuisine', from: 'salon', at: { wall: 'right', y: 8 }, w: 12, h: 8, by: ['frigo', 'cuisine'], floor: { type: 'tile', cols: ['#f4e4c4', '#dcc49c', '#b49a70'] }, wall: { base: '#fff4e0', alt: '#f4e4c4', pattern: 'stripes', wood: '#a8703a' },
      decor: [{ kind: 'table', x: 5, y: 5, w: 2, h: 1 }, { kind: 'stool', x: 4, y: 5, w: 1, h: 1, small: true }, { kind: 'stool', x: 7, y: 5, w: 1, h: 1, small: true }, { kind: 'shelf', x: 8, y: 1, w: 2, h: 1, back: true, oy: 6 }] },
    sport:   { name: 'Salle de sport', from: 'salon', at: { wall: 'right', y: 4 }, w: 16, h: 11, by: ['halteres'], floor: { type: 'herring', cols: ['#c8a070', '#a07a4a', '#6a4e2e'] }, wall: { base: '#e8ecf4', alt: '#d4dae6', pattern: 'stripes', wood: '#4a5a7a' },
      decor: [{ kind: 'bigrug', v: 2, x: 2, y: 5, w: 4, h: 2, walk: true }, { kind: 'bigplant', x: 1, y: 6, w: 1, h: 1, small: true }] },
    // la GRANDE SALLE À MANGER : elle s'ouvre dès qu'un enfant délivré vit chez toi ; tout le monde y mange
    salle:   { name: 'Grande salle à manger', from: 'salon', at: { wall: 'left', y: 4 }, w: 22, h: 13, by: [], open: () => kidsHere().length > 0,
      floor: { type: 'herring', cols: ['#b88a58', '#94683c', '#5e4026'] }, wall: { base: '#f4e4cc', alt: '#e8d2b0', pattern: 'stripes', wood: '#7a4a2a' },
      decor: [{ kind: 'fireplace', x: 9, y: 3, w: 3, h: 1 }, { kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 16, y: 1, w: 2, h: 2, back: true, oy: -6 },
        { kind: 'longtable', x: 7, y: 7, w: 8, h: 1 }, ...[7, 9, 11, 13].flatMap(x => [{ kind: 'stool', x, y: 6, w: 1, h: 1, small: true }, { kind: 'stool', x: x + 1, y: 8, w: 1, h: 1, small: true }]),
        { kind: 'bigplant', x: 1, y: 10, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 19, y: 10, w: 1, h: 1, small: true }, { kind: 'clock', x: 14, y: 3, w: 1, h: 1, small: true }] },
    // chambre de Tai : elle apparaît quand Tai est délivré (antre de Shellmon) ; décor de Tai (ballon, lunettes, posters orange)
    // chambres de l'étage : une porte chacune dans le couloir (ta chambre, celle de ton Digimon, puis celles des enfants délivrés)
    chambre: { name: 'Ma chambre', from: 'etage', w: 12, h: 9, by: [], open: () => upstairs(),
      floor: { type: 'carpet', cols: ['#c8a0d8', '#a880bc', '#7a5a90'] }, wall: { base: '#f8eef4', alt: '#ecdce8', pattern: 'dots', wood: '#8a5a7a' },
      decor: [{ kind: 'window', v: 0, x: 6, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'bigrug', v: 2, x: 5, y: 4, w: 4, h: 2, walk: true }, { kind: 'bigplant', x: 10, y: 6, w: 1, h: 1, small: true }] },
    tai:     { name: 'Chambre de Tai', from: 'etage', w: 10, h: 8, by: [], open: () => !!(st().kids || {}).tai && st().hero !== 'tai',
      floor: { type: 'herring', cols: ['#d8a868', '#b07e48', '#7a5430'] }, wall: { base: '#fff0d8', alt: '#ffe0b0', pattern: 'stripes', wood: '#e8822a' },
      decor: [{ kind: 'bed', x: 6, y: 3, w: 2, h: 2 }, { kind: 'poster', v: 0, x: 2, y: 1, w: 1, h: 1, back: true, oy: 15 }, { kind: 'poster', v: 1, x: 4, y: 1, w: 1, h: 1, back: true, oy: 15 },
        { kind: 'bigrug', v: 1, x: 3, y: 5, w: 3, h: 1, walk: true }, { kind: 'toybox', x: 2, y: 3, w: 2, h: 1 }],
      npcs: [{ hero: 'tai', x: 4, y: 4, face: 'down', wander: 1, talk: async () => {
        const s = st();
        if ((s.flags.chapter || 1) >= 2 && !s.flags.taiLead) {
          s.flags.taiLead = true;
          await DW.say("Écoute ! Un Gomamon de la plage m'a raconté qu'un garçon blond a été vu près du grand lac, au nord-ouest...", 'Tai');
          await DW.say("Il avait l'air de chercher quelqu'un. C'est sûrement Matt ! Mais un énorme serpent de mer garde le lac... Fais attention.", 'Tai');
          return;
        }
        return DW.say(DW.pick([
        "Je m'entraîne au Terrain un jour sur deux, en journée. Viens me voir : on bossera ensemble, ou on fera un match !",
        "Merci encore pour l'antre de Shellmon ! J'ai cru qu'on n'en sortirait jamais.", "Agumon dort comme une souche depuis qu'on est ici. Greymon, ça fatigue !",
        "Si on retrouve Matt, il va être vert de jalousie de ma nouvelle chambre !", "Mon écusson... Jijimon dit qu'il doit être caché quelque part sur l'île. Un jour, on le trouvera !",
        "Le foot me manque. Tu crois qu'on pourrait faire une partie avec les Digimon de la ville ?",
        "Tu as entendu ? Les cabines de la plage se sont remises à sonner... Shellmon est revenu dans son antre. Parfait pour s'entraîner !"]), 'Tai'); } },
        { sp: 'agumon', x: 7, y: 5, face: 'left', wander: 1, talk: () => DW.say('Tu as quelque chose à manger ? Moi, j\'ai toujours faim !', 'Agumon') }] },
    // chambre de Matt : elle apparaît quand Matt est délivré (Lac du Tramway, chapitre 2) ; décor bleu, son harmonica
    matt:    { name: 'Chambre de Matt', from: 'etage', w: 10, h: 8, by: [], open: () => !!(st().kids || {}).matt && st().hero !== 'matt',
      floor: { type: 'herring', cols: ['#b8b0a0', '#908878', '#5a5448'] }, wall: { base: '#dce8f8', alt: '#c4d6f0', pattern: 'stripes', wood: '#3a5a9a' },
      decor: [{ kind: 'bed', x: 2, y: 3, w: 2, h: 2 }, { kind: 'poster', v: 1, x: 5, y: 1, w: 1, h: 1, back: true, oy: 15 }, { kind: 'poster', v: 0, x: 7, y: 1, w: 1, h: 1, back: true, oy: 15 },
        { kind: 'bigrug', v: 0, x: 4, y: 5, w: 3, h: 1, walk: true }, { kind: 'shelf', x: 6, y: 1, w: 2, h: 1, back: true, oy: 6 }],
      npcs: [{ hero: 'matt', x: 5, y: 4, face: 'down', wander: 1, talk: async () => DW.say(DW.pick([
        "Merci pour l'autre nuit. Sans toi et Garurumon, Seadramon m'aurait broyé...",
        "TK est quelque part sur l'île. Il est petit, il doit avoir peur... Si tu entends parler d'un garçon avec un bob vert, préviens-moi.",
        "Tai ronfle. Même à travers le mur. Je te jure.", "Cet harmonica, c'est tout ce qu'il me reste de la maison... Je joue le soir, pour que TK l'entende, peut-être.",
        "Gabumon refuse de quitter sa fourrure. Même quand il fait chaud. Allez comprendre."]), 'Matt') },
        { sp: 'gabumon', x: 7, y: 5, face: 'left', wander: 1, talk: () => DW.say(DW.pick(['Ne dis pas à Matt que je trouve sa musique très belle... Il serait gêné.', "Garurumon, c'était moi ! J'ai encore du mal à y croire."]), 'Gabumon') }] },
    // chambre de Sora : elle apparaît quand Sora est délivrée (Mont Miharashi, chapitre 3) ; décor rose et bleu, son chapeau
    sora:    { name: 'Chambre de Sora', from: 'etage', w: 10, h: 8, by: [], open: () => !!(st().kids || {}).sora && st().hero !== 'sora',
      floor: { type: 'carpet', cols: ['#f0c0c8', '#d89aa8', '#a06878'] }, wall: { base: '#fff0f0', alt: '#f8dcdc', pattern: 'dots', wood: '#c84a5a' },
      decor: [{ kind: 'bed', x: 6, y: 3, w: 2, h: 2 }, { kind: 'poster', v: 1, x: 2, y: 1, w: 1, h: 1, back: true, oy: 15 }, { kind: 'shelf', x: 3, y: 1, w: 2, h: 1, back: true, oy: 6 },
        { kind: 'bigrug', v: 2, x: 3, y: 5, w: 3, h: 1, walk: true }, { kind: 'bigplant', x: 1, y: 5, w: 1, h: 1, small: true }],
      npcs: [{ hero: 'sora', x: 4, y: 4, face: 'down', wander: 1, talk: async () => DW.say(DW.pick([
        "Merci de m'avoir ramenée. Là-haut, sans toi et Birdramon, Meramon aurait tout brûlé...",
        "Les Yokomon ont retrouvé leur eau. J'espère qu'ils pensent à boire, avec cette chaleur !",
        "Tai et Matt se chamaillent encore ? Ces deux-là... il faut bien que quelqu'un veille sur eux.",
        "Biyomon me suit partout. Elle dit que c'est son rôle. Je ne sais pas si je le mérite...",
        "Si tu t'entraînes au Terrain, appelle-moi ! Je n'ai pas oublié mes entraînements de foot.",
        "Ton Digimon a bien mangé aujourd'hui ? Un partenaire, il faut en prendre soin, tu sais."]), 'Sora') },
        { sp: 'biyomon', x: 7, y: 5, face: 'left', wander: 1, talk: () => DW.say(DW.pick(["Sora fait semblant d'être forte, mais elle s'inquiète pour tout le monde. Cui !", "Chaque matin, je fais le tour de la maison en volant. Tout va bien ici !", "Birdramon, c'était moi ! Tu as vu mes ailes de feu ?"]), 'Biyomon') }] },
    digi:    { name: 'Chambre du Digimon', from: 'etage', w: 10, h: 8, by: ['chambre_digi'], floor: { type: 'carpet', cols: ['#bfe0f8', '#a0c8ec', '#f8f8ff'] }, wall: { base: '#fff0f6', alt: '#f8dce8', pattern: 'dots', wood: '#c86a9a' },
      decor: [{ kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'bigrug', v: 0, x: 4, y: 5, w: 3, h: 1, walk: true }] },
  };
  const fromOf = r => (ROOMS[r].from === 'etage' ? 'maison_joueur_etage' : 'maison_joueur');
  // case du salon devant la porte d'une pièce du rez-de-chaussée (en sortant de la pièce, on réapparaît là)
  const salonSpot = r => { const A = ROOMS[r].at; return A.wall === 'left' ? [1, A.y] : [W - 2, A.y]; };
  const FW = { maison_joueur: W };
  const roomOpen = r => (ROOMS[r].open ? ROOMS[r].open() : ROOMS[r].by.some(owned));
  const roomId = r => `maison_joueur_${r}`;
  // pose les meubles d'une pièce (salon ou annexe) et leurs zones d'usage
  function furnish(m, room) {
    for (const id of ORDER) if (owned(id) && roomOf(id) === room) for (const o of FURN[id].objs) {
      m.objects.push({ ...o });
      if (o.back || o.walk) continue;
      for (let x = o.x; x < o.x + (o.w || 1); x++) m.signs[`${x},${o.y + (o.h || 1) - 1}`] = () => USE[id]();
    }
  }

  // ------------------------------------------------------------ usages
  const USE = {
    // le lit : dormir si le partenaire a sommeil (soins complets, sauvegarde), sinon se reposer une heure
    async lit() {
      const s = st();
      const r = await DW.Life.restOrSleep();
      if (!r) return;
      s.heal = { map: 'maison_joueur', x: 3, y: 5 };
      if (r === 'sleep') {
        if (owned('tapis')) s.party.forEach(m => m.addHappy(5));
        await healAll('Bonne nuit... Toute l\'équipe se réveille en pleine forme !');
        // (« Partie sauvegardée » seulement si c'est vrai : game/sauvegarde.js)
        const ok = DW.autosave();
        if (ok) await say('(Partie sauvegardée.)'); else if (ok === false) await say(DW.SAVE_ECHEC);
      }
    },
    async chambre_digi() { const m = lead(); if (m) m.addHappy(1); await DW.Life.restOrSleep(); },
    async coffre() { await DW.Game.push(new DW.BankScene({ title: 'COFFRE' })); },   // tout sauf la nourriture
    async toilettes() { await DW.Care.toilet(); },
    async plantes() {
      if (!once('plantes')) { await say('Les plantes sont bien arrosées. Elles ont l\'air heureuses.'); return; }
      st().party.forEach(m => m.addHappy(3)); DW.Audio.sfx('water');
      await say('Tu arroses les plantes avec ton partenaire. Ça sent bon la terre mouillée ! (bonheur +3)');
    },
    async frigo() {
      const r = await DW.ask('Le réfrigérateur ronronne doucement.', ['Ranger / prendre', 'L\'en-cas du jour', 'Fermer']);
      if (r === 0) { await DW.Game.push(new DW.BankScene({ title: 'FRIGO', store: 'fridge' })); return; }
      if (r !== 1) return;
      if (!once('frigo')) { await say('Tu as déjà pris l\'en-cas du jour. Il y en aura un autre demain.'); return; }
      const id = DW.pick(['viande', 'viande', 'pain', 'brioche', 'pomme_bleue', 'baie_rouge', 'digichampi', 'croissant']);
      const extra = DW.giveItem(id); DW.Audio.sfx('buy');
      await say(`Dans le frigo : ${DW.ITEMS[id].name} !${DW.extraMsg(extra)}`);
    },
    async tele() {
      await say(DW.pick([
        'Météo de l\'île : « ' + DW.Time.weatherName() + ' » en ce moment. Saison : ' + DW.Time.date().seasonName + '.',
        'Flash spécial : des Engrenages Noirs auraient été vus dans les régions lointaines...',
        'Recette du jour : viande + piment de Meramon = Brochette pimentée ! Ça donne de la force.',
        'Le saviez-vous ? Un Digimon bien discipliné obéit mieux en combat.',
        'Interview de Jijimon : « La ville grandit grâce à vous tous, hohoho ! »',
        'Rubrique pêche : les gros poissons mordent surtout le matin.',
        'Pub : « Bazar de Gotsumon, tout pour la maison ! »',
      ]));
      if (once('tele') && lead()) { lead().addHappy(3); await say(`${lead().name} a adoré regarder la télé avec toi ! (bonheur +3)`); }
    },
    async biblio() {
      const m = lead(); if (!m) return;
      if (!once('biblio')) { await say(`${m.name} a déjà eu son histoire aujourd'hui.`); return; }
      DW.Life && DW.Life.addDisc ? DW.Life.addDisc(m, 5) : (m.disc = Math.min(100, (m.disc || 0) + 5));
      await say(`Tu lis « ${DW.pick(['Les Sept Écussons', 'Le Digivice perdu', 'La légende du Pont de l\'Infini', 'Agumon et le grand gâteau'])} » à ${m.name}. Il écoute très sagement. (discipline +5)`);
    },
    async cuisine() { if (!DW.Cuisine.known().length) { await say('Une belle cuisine... mais tu ne connais encore aucune recette. Mushroomon, au Restaurant, peut t\'en apprendre !'); return; } await DW.Cuisine.cook('Maison'); },
    async sport2() { await USE.halteres(); },
    async sport3() { await USE.halteres(); },
    async halteres() {
      const m = lead(); if (!m) return;
      const lv = owned('sport3') ? 3 : owned('sport2') ? 2 : 1, used = ['halteres', 'halteres2', 'halteres3'].slice(0, lv).find(k => once(k));
      if (!used) { await say(`${m.name} s'est déjà entraîné ${lv > 1 ? lv + ' fois' : ''} à la maison aujourd'hui.${lv < 3 ? ' (Un meilleur matériel, au Bazar, permet plus de séances.)' : ''}`); return; }
      const K = ['hp', 'mp', 'atk', 'def', 'spd', 'int'], NAMES = ['PV', 'PM', 'Attaque', 'Défense', 'Vitesse', 'Intelligence'];
      const i = await DW.ask('Quelle statistique travailler ?', ['PV', 'PM', 'Attaque', 'Défense', 'Vitesse', 'Intelligence', 'Annuler']);
      if (i < 0 || i > 5) { st().home.used.k = st().home.used.k.filter(k => k !== used); return; }
      // (comme au Terrain : pas de séance malade, blessé, épuisé ou affamé, et le potentiel plafonne les points ;
      //  avant : un Koromon malade et épuisé dépassait son potentiel)
      const why = DW.Training.blocked(m, K[i]);
      if (why) { st().home.used.k = st().home.used.k.filter(k => k !== used); await say(why); return; }
      const pts = lv + 1;
      const v0 = K[i] === 'hp' ? m.maxHp : K[i] === 'mp' ? m.maxMp : m.stat(K[i]);
      DW.Training.gain(m, K[i], pts); m.tired = Math.min(100, (m.tired || 0) + 15);
      const v1 = K[i] === 'hp' ? m.maxHp : K[i] === 'mp' ? m.maxMp : m.stat(K[i]);
      DW.Audio.sfx('super');
      await say(`Une, deux ! ${m.name} s'entraîne dur. ${NAMES[i]} +${Math.max(1, v1 - v0)} ! (fatigue +15)`);
    },
    async aquarium() {
      if (!once('aquarium')) { await say('Les poissons font des bulles. Blop, blop.'); return; }
      st().party.forEach(m => m.addHappy(5));
      await say('Vous regardez les poissons nager tranquillement... Quel calme ! (bonheur +5)');
    },
    async ordi() { await DW.Game.push(new DW.FarmScene()); },
    async tapis() { await say('Le canapé est moelleux. Ton partenaire adore s\'y rouler en boule.'); },
    async tableau() { await say('De beaux tableaux : un paysage de l\'île, et un coucher de soleil sur la plage.'); },
  };

  // ------------------------------------------------------------ la pièce, reconstruite selon les meubles possédés
  const rows = () => ['0'.repeat(W), '0' + '2'.repeat(W - 2) + '0', '0' + '2'.repeat(W - 2) + '0',
    ...Array.from({ length: H - 4 }, () => '0' + '1'.repeat(W - 2) + '0'), '0'.repeat(DOOR_X) + '11' + '0'.repeat(W - DOOR_X - 2)];
  MAPS.maison_joueur = {
    name: 'Ma maison', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    floor: { type: 'herring', cols: ['#d8a868', '#b07e48', '#7a5430'] }, wall: { base: '#f4ead4', alt: '#e8d8b8', pattern: 'stripes', wood: '#8a5a32' },
    rows: rows(), objects: [], npcs: [], signs: {},
    warps: [{ x: DOOR_X, y: H - 1, w: 2, h: 1, dir: 'down', to: 'village', tx: 62, ty: 12, _zt: true }],
    entry: { x: DOOR_X, y: H - 2 },
    build() {
      const s = st();
      if (!s.home) s.home = { owned: { lit: true, coffre: true } };
      if (DW.HOME_DOOR) Object.assign(this.warps[0], { tx: DW.HOME_DOOR.x, ty: DW.HOME_DOOR.y + 1 });
      const cave = DW.Trophies && DW.Trophies.count() > 0;   // le premier trophée ouvre la cave (game/trophees.js)
      const version = ORDER.filter(owned).join(',') + (cave ? '|cave' : '') + Object.keys(ROOMS).filter(roomOpen).join(',');
      if (this.version === version && this.objects.length) return;
      this.version = version;
      this.objects = [{ kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 6, y: 1, w: 2, h: 2, back: true, oy: -6 }];
      this.signs = {};
      furnish(this, null);
      // (plus de pièces ouvertes dans les murs du salon : elles sont le long des couloirs)
      this.rows = rows(); this.warps.length = 1;
      if (owned('tableau')) this.signs['9,2'] = this.signs['10,2'] = this.signs['12,2'] = this.signs['13,2'] = () => USE.tableau();
      // escalier de la cave aux trophées
      this.doors = [];
      // escalier vers l'étage (chambre)
      if (upstairs()) {
        this.objects = this.objects.filter(o => !(o.x < 11 && o.x + (o.w || 1) > 9 && (o.back || o.y <= 4)));
        for (const k of ['9,2', '10,2']) delete this.signs[k];
        this.objects.push({ kind: 'stairsup', x: 9, y: 1, w: 2, h: 2, back: true });
        this.doors.push({ x: 9, y: 2, w: 2, dir: 'up', to: 'maison_joueur_etage', tx: 1, ty: 3 });
      }
      if (cave) {
        this.objects = this.objects.filter(o => !(o.x < 14 && o.x + (o.w || 1) > 12 && (o.back || o.y <= 4)));
        for (const k of ['12,2', '13,2']) delete this.signs[k];   // (les tableaux décrochés pour l'escalier de la cave, comme pour l'étage)
        this.objects.push({ kind: 'stairsdown', x: 12, y: 1, w: 2, h: 2, back: true });
        this.doors.push({ x: 12, y: 2, w: 2, dir: 'up', to: 'cave_joueur', tx: 7, ty: 3 });
      }
      // les pièces du rez-de-chaussée : une ouverture de 2 cases dans le mur de côté du salon (comme dans les autres bâtiments)
      for (const r in ROOMS) if (ROOMS[r].from === 'salon' && roomOpen(r)) {
        const R = ROOMS[r], A = R.at, x = A.wall === 'left' ? 0 : W - 1;
        this.rows = this.rows.map((row, y) => (y === A.y || y === A.y + 1 ? row.slice(0, x) + '1' + row.slice(x + 1) : row));
        this.warps.push({ x, y: A.y, w: 1, h: 2, dir: A.wall, to: roomId(r), tx: A.wall === 'left' ? R.w - 2 : 1, ty: 4 });
      }
      DW.World.unprepare(this);
    },
    async onEnter() {
      const s = st();
      if (s.flags.homeIntro) return;
      s.flags.homeIntro = true;
      await DW.wait(0.4);
      await say('Voici ta maison... enfin, ta cabane ! Elle tombe un peu en ruine, mais elle est à toi : un lit et un coffre, pour commencer.');
      await say('Au Bazar de Gotsumon, le rayon « Meubles » vend de quoi l\'aménager. Chaque meuble a son utilité !');
    },
  };

  // ------------------------------------------------------------ l'étage (chambre) et le grenier
  // l'étage est un COULOIR : l'escalier à gauche, le grenier à droite, et une porte par chambre le long du mur
  // (places réservées pour les enfants qui viendront habiter chez toi)
  const SLOTS = ['chambre', 'digi', 'tai', 'matt', 'sora', 'izzy', 'mimi', 'joe', 'tk'], CW = 34;
  const slotX = r => 4 + SLOTS.indexOf(r) * 3;
  const DOOR_V = { chambre: 0, digi: 1, tai: 2, matt: 3, sora: 4, izzy: 5, mimi: 6, joe: 7, tk: 0, cuisine: 2, sdb: 1, sport: 6 };
  // porte de chambre dans le mur du couloir (une couleur par occupant, plaque au-dessus)
  DW.World.OBJ.walldoor = { w: 32, h: 34, n: 8, draw(d, v) {
    const [C, Lt, Dk] = [['#9a6a3a', '#b8885a', '#7a4e2a'], ['#5a9ad8', '#7ab4ea', '#3a78b8'], ['#e8822a', '#f4a454', '#c0621a'], ['#3a5ab8', '#5a7ad0', '#2a4290'],
      ['#e05a8a', '#ee82a8', '#b83a68'], ['#7a5ab8', '#9a7ad0', '#5a4090'], ['#58b058', '#7acc7a', '#3a8a3a'], ['#6a6a7a', '#8a8a9a', '#4a4a5a']][v];
    d.rect(2, 2, 28, 32, '#5a3a20', { round: 0.08 });
    d.rect(5, 5, 22, 29, C, { tex: 0.12 });
    d.deco.rect(8, 8, 16, 9, Lt); d.deco.rect(8, 20, 16, 11, Dk);
    d.deco.circ(23, 21, 1.4, '#e8d070', { unlit: true });
    d.deco.rect(11, 1, 10, 4, '#f0e8d0');
  } };
  // longue table de banquet : nappe, assiettes, chandeliers
  DW.World.OBJ.longtable = { w: 128, h: 34, n: 1, draw(d) {
    for (const x of [6, 60, 118]) d.tube([[x, 22], [x, 33]], 2.4, 2, '#5a3a20');
    d.rect(2, 8, 124, 16, '#8a5a32', { round: 0.1 });
    d.rect(4, 6, 120, 13, '#f4ecdc', { tex: 0.05 }); d.deco.rect(4, 17, 120, 3, '#d84a3a');
    for (let x = 14; x < 120; x += 18) { d.deco.ell(x, 11, 5, 2.6, '#ffffff'); d.deco.ell(x, 11, 2.6, 1.2, '#e8a050'); }
    for (const x of [36, 92]) { d.tube([[x, 11], [x, 1]], 1, 0.8, '#c8a040'); d.deco.ell(x, 0.6, 1.2, 1.6, '#ffd060', 0, { unlit: true }); }
  } };
  MAPS.maison_joueur_etage = {
    name: 'Ma maison — Couloir de l’étage', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    floor: { type: 'herring', cols: ['#c8a070', '#a07a4a', '#6a4e2e'] }, wall: { base: '#f8eef4', alt: '#ecdce8', pattern: 'stripes', wood: '#8a5a7a' },
    rows: DW.MapKit.roomRows(CW, 7), objects: [], npcs: [], signs: {}, warps: [], doors: [],
    build() {
      const version = ORDER.filter(owned).join(',') + '|' + Object.keys(ROOMS).filter(roomOpen).join(',');
      if (this.version === version && this.objects.length) return;
      this.version = version;
      this.objects = [{ kind: 'stairsdown', x: 1, y: 1, w: 2, h: 2, back: true }, { kind: 'stairsup', x: CW - 3, y: 1, w: 2, h: 2, back: true },
        { kind: 'bigplant', x: 3, y: 5, w: 1, h: 1, small: true }, { kind: 'bigplant', x: CW - 4, y: 5, w: 1, h: 1, small: true }];
      this.signs = {};
      furnish(this, 'etage');
      this.doors = [{ x: 1, y: 2, w: 2, dir: 'up', to: 'maison_joueur', tx: 9, ty: 3 }, { x: CW - 3, y: 2, w: 2, dir: 'up', to: 'maison_joueur_grenier', tx: 5, ty: 3 }];
      this.rows = DW.MapKit.roomRows(CW, 7); this.warps = [];
      for (const r in ROOMS) if (roomOpen(r) && ROOMS[r].from === 'etage') {
        const R = ROOMS[r], x = slotX(r);
        this.objects.push({ kind: 'walldoor', v: DOOR_V[r] || 0, x, y: 1, w: 2, h: 2, back: true });
        this.doors.push({ x, y: 2, w: 2, dir: 'up', to: roomId(r), tx: Math.floor(R.w / 2) - 1, ty: R.h - 2 });
      }
      DW.World.unprepare(this);
    },
  };
  MAPS.maison_joueur_grenier = {
    name: 'Ma maison — Grenier', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    floor: { type: 'herring', cols: ['#a8845a', '#7a5a3a', '#4a3424'] }, wall: { base: '#c8a880', alt: '#b89870', pattern: 'plain', wood: '#6a4a2a' }, dark: { d: 0.3, col: '#3a2a20' },
    rows: DW.MapKit.roomRows(12, 8), npcs: [], signs: {}, warps: [],
    objects: [{ kind: 'stairsdown', x: 5, y: 1, w: 2, h: 2, back: true }, { kind: 'crates', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 2, y: 3, w: 1, h: 1, small: true },
      { kind: 'sacks', x: 9, y: 3, w: 2, h: 1 }, { kind: 'teddy', x: 1, y: 6, w: 1, h: 1 }],
    doors: [{ x: 5, y: 2, w: 2, dir: 'up', to: 'maison_joueur_etage', tx: CW - 3, ty: 3 }],
  };
  // un vieux coffre oublié par l'ancien propriétaire
  if (DW.Palais && DW.Palais.treasure) DW.Palais.treasure('maison_joueur_grenier', 'grenier_joueur', null, [['cartes', 2], ['soin_m', 2]], 9, 6);

  // ------------------------------------------------------------ les pièces annexes
  for (const r in ROOMS) {
    const R = ROOMS[r], side = R.from === 'salon' && R.at.wall !== 'back' ? (R.at.wall === 'left' ? 'right' : 'left') : null;
    const up = !side && (R.from === 'etage' || R.from === 'salon'), dx = R.side === 'right' ? 0 : R.w - 1;   // porte du côté du salon ; à l'étage, porte en bas (vers le couloir)
    const mx = Math.floor(R.w / 2) - 1;
    const sx = side === 'right' ? R.w - 1 : 0;
    const floorRow = y => { const row = '0' + '1'.repeat(R.w - 2) + '0'; return side && (y === 4 || y === 5) ? row.slice(0, sx) + '1' + row.slice(sx + 1) : row; };
    const bottom = up ? '0'.repeat(mx) + '11' + '0'.repeat(R.w - mx - 2) : '0'.repeat(R.w);
    const rr = ['0'.repeat(R.w), '0' + '2'.repeat(R.w - 2) + '0', '0' + '2'.repeat(R.w - 2) + '0', ...Array.from({ length: R.h - 4 }, (_, i) => floorRow(i + 3)), bottom];
    MAPS[roomId(r)] = {
      name: `Ma maison — ${R.name}`, music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      floor: R.floor, wall: R.wall, rows: rr, objects: [], npcs: (R.npcs || []).map(n => ({ ...n })), signs: {},
      warps: side ? [{ x: sx, y: 4, w: 1, h: 2, dir: side, to: 'maison_joueur', tx: salonSpot(r)[0], ty: salonSpot(r)[1] }] : [up ? { x: mx, y: R.h - 1, w: 2, h: 1, dir: 'down', to: fromOf(r), tx: R.from === 'salon' ? salonSpot(r)[0] : slotX(r), ty: R.from === 'salon' ? salonSpot(r)[1] : 3 }
        : { x: dx, y: 4, w: 1, h: 2, dir: R.side === 'right' ? 'left' : 'right', to: fromOf(r), tx: R.side === 'right' ? FW[fromOf(r)] - 2 : 1, ty: R.y }],
      build() {
        const version = ORDER.filter(owned).join(',');
        if (this.version === version && this.objects.length) return;
        this.version = version;
        this.objects = R.decor.map(o => ({ ...o })); this.signs = {};
        furnish(this, r);
        DW.World.unprepare(this);
      },
    };
  }

  // ------------------------------------------------------------ la grande salle à manger : les enfants et leurs Digimon à table
  {
    const S = MAPS.maison_joueur_salle, PARTNER = { tai: 'agumon', matt: 'gabumon', sora: 'biyomon' };
    const mealTime = () => { const h = DW.Time.hour(); return (h >= 12 && h < 14) || (h >= 19 && h < 21); };
    S.populate = function () {
      const kids = kidsHere(), meal = mealTime();
      this.npcs = [];
      kids.forEach((k, i) => {
        const [x, y] = meal ? [7 + 2 * i, 6] : [3 + i * 3, 10], [px, py] = meal ? [8 + 2 * i, 8] : [4 + i * 3, 10];
        this.npcs.push({ hero: k, x, y, face: meal ? (y < 7 ? 'down' : 'up') : 'down', wander: meal ? 0 : 1,
          talk: () => say(meal ? DW.pick(["Bon appétit ! On mange tous ensemble, comme au camp d'été.", 'Hmm, ça sent bon ! Assieds-toi avec nous !', 'Ici, on se sent un peu comme à la maison...'])
            : DW.pick(['Le repas, c\'est à midi et à 19 h ! On s\'y retrouve tous.', 'Cette salle est immense ! Il faudra la remplir de monde.']), DW.HEROES[k] ? DW.HEROES[k].name : k) });
        if (PARTNER[k]) this.npcs.push({ sp: PARTNER[k], x: px, y: py, face: meal ? (py < 7 ? 'down' : 'up') : 'left', wander: meal ? 0 : 1, talk: () => say('Miam ! J\'ai encore faim !', DW.SPECIES[PARTNER[k]].name) });
      });
    };
    // le repas en commun : à midi et le soir, toute ton équipe mange (1 repas chacun), une fois par repas
    const dinner = async () => {
      const s = st(), key = `repas_${DW.Time.day()}_${DW.Time.hour() < 16 ? 'midi' : 'soir'}`;
      if (!mealTime()) { await say('La grande table est mise. Les repas sont servis à midi (12 h - 14 h) et le soir (19 h - 21 h) : tout le monde mange ensemble !'); return; }
      if (s.home.meal === key) { await say('Ton équipe a déjà mangé à ce repas. Hmm, il ne reste que des miettes !'); return; }
      if ((await DW.ask('Le repas est servi ! Passer à table avec tout le monde ?')) !== 0) return;
      s.home.meal = key;
      for (const m of s.party) if (m.hp > 0) { DW.Care.feed(m, 60); m.addHappy(4); }
      DW.Audio.sfx('heal');
      await say(`Tout le monde mange de bon appétit en riant. ${kidsHere().map(k => DW.HEROES[k].name).join(' et ')} racontent leurs aventures... (un repas pour chaque Digimon de l'équipe, bonheur +4)`);
    };
    for (let x = 7; x < 15; x++) for (const y of [7]) S.signs[`${x},${y}`] = dinner;
    const build0 = S.build;
    S.build = function () { build0.apply(this, arguments); for (let x = 7; x < 15; x++) this.signs[`${x},7`] = dinner; };
  }

  // ------------------------------------------------------------ rayon « Meubles » (Bazar de Gotsumon)
  // les meubles arrivent au Bazar au fil du développement de la ville (niveau de la ville requis)
  const TIER = { sport2: 5, sport3: 8, plantes: 0, tele: 1, tableau: 1, tapis: 2, toilettes: 2, frigo: 3, biblio: 3, sac1: 3, aquarium: 4, cuisine: 4, chambre_digi: 4, halteres: 5, ordi: 6, sac2: 6 };
  const tierOf = id => TIER[id] || 0;
  // prix d'un meuble : le Comptoir du Bazar (Gotsumon et Kunemon ensemble : « tous les prix baissent de 15 % », game/collab.js)
  // vaut aussi pour le rayon des meubles, comme pour la boutique d'objets (ui/boutique.js)
  const prixDe = id => Math.ceil(FURN[id].price * (DW.Collab ? DW.Collab.priceMult() : 1));
  // écran du rayon « Meubles » : même présentation que la boutique d'objets (icônes, prix, Bits, description)
  // ENTRÉE (ou ESPACE) : choisir puis confirmer ; SUPPR : annuler / sortir
  class FurnitureScene extends DW.Scene {
    constructor() { super(); this.i = 0; this.top = 0; this.confirm = false; this.msgT = 0; }
    get list() { return ORDER.filter(id => !owned(id) && FURN[id].price > 0 && (!FURN[id].needs || FURN[id].needs())).sort((a, b) => tierOf(a) - tierOf(b) || FURN[a].price - FURN[b].price); }
    ok(id) { return DW.Town.level() >= tierOf(id); }
    update() {
      const { Input, Audio } = DW, s = st(), L = this.list, n = L.length + 1;
      if (this.confirm) {
        if (Input.hit('back')) { this.confirm = false; Audio.sfx('back'); return; }
        if (Input.hit('ok')) {
          const id = L[this.i], F = FURN[id], prix = prixDe(id);
          this.confirm = false;
          if (s.bits < prix) { Audio.sfx('bump'); this.msg = "Tu n'as pas assez de Bits !"; this.msgT = 2; return; }
          s.bits -= prix; s.home.owned[id] = true; Audio.sfx('buy');
          (this.bought = this.bought || []).push(id);
          this.msg = `Livré chez toi : ${F.name} !`; this.msgT = 2.2;
          this.i = Math.min(this.i, this.list.length);
        }
        return;
      }
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(this.bought || []); return; }
      if (Input.hit('ok')) {
        if (this.i >= L.length) { Audio.sfx('back'); this.close(this.bought || []); return; }
        const id = L[this.i];
        if (!this.ok(id)) { Audio.sfx('bump'); this.msg = `Pas encore en rayon : la ville doit être « ${DW.Town.LEVELS[tierOf(id)]} ».`; this.msgT = 2.4; return; }
        if (s.bits < prixDe(id)) { Audio.sfx('bump'); this.msg = "Tu n'as pas assez de Bits !"; this.msgT = 2; return; }
        Audio.sfx('select'); this.confirm = true;
      }
      if (this.i < this.top) this.top = this.i; if (this.i > this.top + 7) this.top = this.i - 7;
    }
    tick(dt) { if (this.msgT > 0) this.msgT -= dt; }
    // vignette du meuble : son premier décor, réduit (les sacs : l'icône du sac)
    thumb(c, id, x, y, size, dim) {
      const o = FURN[id].objs[0];
      if (!o) { c.drawImage(DW.Icons.menu('sac'), x, y, size, size); return; }
      const sp = DW.World.obj(o.kind, o.v || 0), k = Math.min(size / sp.w, size / sp.h);
      c.globalAlpha = dim ? 0.4 : 1;
      c.drawImage(sp.img, Math.round(x + (size - sp.w * k) / 2), Math.round(y + (size - sp.h * k)), sp.w * k, sp.h * k);
      c.globalAlpha = 1;
    }
    draw(c) {
      const { UI } = DW, s = st(), L = this.list;
      UI.menuBg(c, this.t, 'MEUBLES');
      UI.box(c, 8, 26, 210, 150);
      const rows = L.concat(['__quit']).slice(this.top, this.top + 8);
      rows.forEach((id, k) => {
        const y = 44 + k * 16;
        if (id === '__quit') { UI.text(c, 'QUITTER', 26, y, { size: 10, color: '#9ab0e8' }); return; }
        const F = FURN[id], ok = this.ok(id);
        this.thumb(c, id, 11, y - 12, 13, !ok);
        UI.text(c, UI.fit(c, F.name, 128, 9).s, 26, y, { size: 9, color: ok ? '#ffffff' : '#7a88a8' });
        UI.text(c, ok ? `${prixDe(id)} B` : `niv. ${tierOf(id)}`, 210, y, { size: 9, align: 'right', color: ok ? (s.bits >= prixDe(id) ? '#ffd860' : '#c87a5a') : '#7a88a8' });
      });
      if (this.top > 0) UI.text(c, '▲', 113, 34, { size: 7, align: 'center', color: '#ffe070' });
      if (this.top + 8 < L.length + 1) UI.text(c, '▼', 113, 174, { size: 7, align: 'center', color: '#ffe070' });
      UI.cursor(c, 15, 40.5 + (this.i - this.top) * 16, this.t);
      UI.box(c, 224, 26, 88, 56);
      UI.text(c, 'Bits', 232, 42, { size: 9, color: '#9ab0e8' });
      UI.text(c, String(s.bits), 304, 56, { size: 11, align: 'right', bold: true, color: '#ffd860' });
      UI.text(c, `Ville : niv. ${DW.Town.level()}`, 304, 76, { size: 7, align: 'right', color: '#9ab0e8' });
      const id = L[this.i];
      // grand aperçu du meuble choisi
      if (id) { UI.box(c, 224, 88, 88, 88); this.thumb(c, id, 236, 96, 64, !this.ok(id)); }
      UI.box(c, 8, 180, 304, 54);
      if (id) UI.wrap(c, FURN[id].desc, 290, 8).slice(0, 3).forEach((l, k) => UI.text(c, l, 16, 196 + k * 11, { size: 8, color: '#c8f0ff' }));
      else UI.text(c, L.length ? 'À bientôt !' : 'Ta maison est entièrement meublée ! Bravo !', 16, 200, { size: 8, color: '#c8f0ff' });
      if (this.confirm && id) {
        UI.box(c, 40, 92, 240, 46);
        UI.text(c, `Acheter « ${FURN[id].name} » (${prixDe(id)} B) ?`, 160, 110, { size: 9, align: 'center', color: '#ffffff' });
        const N = DW.Input.names();
        UI.text(c, `${N.ok} : oui    ${N.back} : non`, 160, 128, { size: 8, align: 'center', color: '#ffe070' });
      }
      if (this.msgT > 0) UI.text(c, this.msg, 160, 172, { size: 8, align: 'center', color: '#7aff8a' });
    }
  }
  async function furnitureShop() {
    const s = st();
    if (!s.home) s.home = { owned: { lit: true, coffre: true } };
    const before = Object.keys(ROOMS).filter(roomOpen), up0 = upstairs();
    const got = await DW.Game.push(new FurnitureScene());
    if (!got || !got.length) return;
    await say(`Merci ! Je fais livrer tout ça chez toi : ${got.map(id => FURN[id].name).join(', ')} !`, 'Gotsumon');
    for (const r in ROOMS) if (roomOpen(r) && !before.includes(r)) await say(`Il lui faut une pièce rien qu'à lui : une nouvelle porte s'ouvre ${ROOMS[r].from === 'etage' ? 'à l’étage' : 'dans ton salon'}. Ta maison a maintenant une ${ROOMS[r].name} !`, 'Gotsumon');
    if (!up0 && upstairs()) await say('Ton salon est si bien aménagé que ta maison s’agrandit : un ÉTAGE avec ta chambre (ton lit y est monté) et un grenier tout en haut !', 'Gotsumon');
  }
  DW.Home = { FURN, ROOMS, furnitureShop, owned, tierOf };
})();
;

// ===== js/maps/maison.js
'use strict';
// =====================================================================
//  MAISON DE JIJIMON — intérieur (on s'y réveille au début du jeu)
//  0 hors de la pièce   1 parquet   2 mur (vu de face)
// =====================================================================
(function () {
  const { say, rle } = DW.MapKit;


  // ------------------------------------------------------------ la BIBLIOTHÈQUE de Jijimon : des livres qui expliquent les règles
  const BOOKS = [
    ['Comment éduquer son Digimon', [
      "Un Digimon apprend de toi. Quand il réussit un exploit, FÉLICITE-le aussitôt (menu → Féliciter) : il devient plus heureux.",
      "Quand il fait une bêtise (un accident, une maladie par négligence...), GRONDE-le (menu → Gronder) : sa discipline monte.",
      "Gronder sans raison le rend triste. Féliciter trop souvent ne compte plus. Un Digimon bien discipliné obéit en combat ; mal élevé, il n'en fait qu'à sa tête."]],
    ['La faim, la soif et le poids', [
      "Ton Digimon a FAIM et SOIF : regarde les bulles au-dessus de sa tête. La viande calme la faim ; l'eau des rivières, des sources (pas la mer !) ou une Eau fraîche étanche la soif.",
      "Un bébé mange peu, un Champion beaucoup, et les gros Digimon encore plus. La nourriture ne soigne pas : pour les PV et les PM, il faut des RAM.",
      "Chaque repas le fait grossir un peu, l'entraînement le fait maigrir un peu. Certaines Digivolutions demandent un Digimon costaud, d'autres un Digimon léger : surveille sa corpulence dans sa fiche."]],
    ['Les toilettes et la propreté', [
      "Après un repas, et avec le temps, ton Digimon a besoin d'aller aux TOILETTES (une petite crotte dans sa bulle). Emmène-le vite à des toilettes : en ville, ou chez toi plus tard.",
      "S'il ne peut pas se retenir, il fait sur place : il est malheureux, et c'est une erreur de soin. Ramasse toujours ses crottes : la saleté le rend malade."]],
    ['Le sommeil, le repos et la santé', [
      "Chaque Digimon a son rythme : la plupart dorment la nuit, certains (les Digimon des ténèbres...) dorment le jour. Il ne dort que quand il a sommeil ; sinon, il peut se reposer une heure.",
      "Pendant le sommeil, la faim et la soif montent moins vite. Une nuit chez moi soigne toute l'équipe... et efface un K.O. !",
      "La MALADIE n'arrive pas par hasard : ce sont les négligences qui s'accumulent (faim, saleté, nuits blanches, blessures). Un Médicament la guérit."]],
    ["L'entraînement", [
      "Au Terrain d'entraînement, au sud de la ville, chaque poste travaille une statistique : PV, PM, Attaque, Défense, Vitesse, Intelligence. Appuie au bon moment pour réussir la séance.",
      "Les COMBATS font monter le NIVEAU, qui fixe jusqu'où ton Digimon peut progresser. L'ENTRAÎNEMENT remplit ce potentiel : ce sont ses points qui ouvrent les Digivolutions.",
      "L'Intelligence compte aussi au combat : un Digimon intelligent comprend parfois une nouvelle technique tout seul, après une victoire. C'est rare au début !"]],
    ['Les Digivolutions', [
      "Pour digivoluer, ton Digimon doit remplir des conditions : niveau, points d'entraînement, victoires, poids, peu d'erreurs de soin... Regarde sa fiche, onglet Digivolution.",
      "Quand tout est prêt, le Digivice vibre : c'est toi qui décides quand digivoluer. Un CHAMPION est bien plus fort qu'un Disciple : contre un Champion sauvage, un Disciple n'a presque aucune chance.",
      "Plus tard, d'anciens écussons permettront d'aller encore plus loin... mais c'est une autre histoire."]],
    ['Les K.O. et le cycle de la vie', [
      "Un Digimon a trois vies (les trois cœurs de sa fiche). Chaque K.O. en combat en coûte une ; une nuit chez moi en rend une.",
      "Au troisième K.O., ou à la fin de sa vie, ses données redeviennent un DigiŒuf : il renaît bébé, garde une partie de ce qu'il a appris, et ses données innées se renforcent."]],
  ];
  async function library() {
    for (;;) {
      const i = await DW.choose(BOOKS.map(b => '« ' + b[0] + ' »').concat(['Ranger les livres']), { y: 8 });
      if (i < 0 || i >= BOOKS.length) return;
      DW.Audio.sfx('select');
      for (const page of BOOKS[i][1]) await say(page);
    }
  }

  DW.MAPS.maison = {
    name: 'Maison de Jijimon', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    wall: { base: '#f2dcbc', alt: '#e6cba4', pattern: 'stripes', wood: '#8a5a32' },
    rows: [
      '0'.repeat(16),
      rle('0 2 2 2 2 2 2 2 2 2 2 2 2 2 2 0'),
      rle('0 2 2 2 2 2 2 2 2 2 2 2 2 2 2 0'),
      ...Array.from({ length: 8 }, () => rle('0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0')),
      rle('0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0'),
    ],
    objects: [
      // mur du fond
      { kind: 'bookshelf', v: 0, x: 1, y: 3, w: 2, h: 1 }, { kind: 'bookshelf', v: 1, x: 3, y: 3, w: 2, h: 1 },
      { kind: 'fireplace', x: 6, y: 3, w: 3, h: 1 },
      { kind: 'window', v: 0, x: 10, y: 1, w: 2, h: 2, back: true, oy: -6 },
      { kind: 'frame', x: 12, y: 1, w: 2, h: 1, back: true, oy: 8 },
      { kind: 'clock', x: 9, y: 3, w: 1, h: 1, small: true },
      { kind: 'bed', x: 12, y: 3, w: 2, h: 2 },
      { kind: 'plant', v: 1, x: 14, y: 3, w: 1, h: 1, small: true },
      // coin cuisine
      { kind: 'stove', x: 1, y: 6, w: 2, h: 1 },
      // salon
      { kind: 'rug', x: 5, y: 6, w: 4, h: 3, walk: true },
      { kind: 'table', x: 6, y: 7, w: 2, h: 1 },
      { kind: 'stool', x: 5, y: 7, w: 1, h: 1, small: true }, { kind: 'stool', x: 8, y: 7, w: 1, h: 1, small: true },
      { kind: 'chest', x: 14, y: 7, w: 1, h: 1, small: true },
      { kind: 'plant', v: 0, x: 1, y: 10, w: 1, h: 1, small: true }, { kind: 'plant', v: 1, x: 14, y: 10, w: 1, h: 1, small: true },
      { kind: 'staff', x: 11, y: 8, w: 1, h: 1, small: true },
      { kind: 'armchair', v: 0, x: 9, y: 5, w: 1, h: 1, small: true }, { kind: 'floorlamp', x: 13, y: 9, w: 1, h: 1, small: true },
      { kind: 'cushion', v: 2, x: 4, y: 9, w: 1, h: 1, small: true }, { kind: 'poster', v: 0, x: 5, y: 1, w: 1, h: 1, back: true, oy: 15 },
    ],
    // la maison suit le développement de la ville : un TAUDIS au début (ville en ruines), puis rénovée
    // (niveau 3), enfin cossue (niveau 7 : tapis, tableaux, plantes)
    build() {
      const lv = DW.Town ? DW.Town.level() : 0, stage = lv < 3 ? 0 : lv < 7 ? 1 : 2;
      if (this.stage === stage && this.objects.length) return;
      if (!this.FULL) { this.FULL = this.objects.map(o => ({ ...o })); this.SIGNS = { ...this.signs }; this.WALL = this.wall; }
      this.stage = stage; this.signs = { ...this.SIGNS };
      if (stage === 0) {
        const keep = new Set(['fireplace', 'window', 'bed', 'stove', 'table', 'stool', 'chest', 'staff', 'cushion', 'clock']);
        this.objects = this.FULL.filter(o => keep.has(o.kind) || (o.kind === 'bookshelf' && o.x === 1)).map(o => ({ ...o }))   // (la vieille bibliothèque reste)
          .concat([{ kind: 'sacks', x: 3, y: 3, w: 2, h: 1 },
            { kind: 'crates', x: 14, y: 10, w: 1, h: 1, small: true }]);
        this.wall = { base: '#b8a088', alt: '#a68e72', pattern: 'plain', wood: '#5a4030' };
        this.floor = { type: 'herring', cols: ['#8a7058', '#6a5440', '#4a3a2a'] };
        this.dark = { d: 0.18, col: '#2a2018' };
        for (const k of ['3,3', '4,3']) this.signs[k] = 'Des sacs de grain à moitié vides.';
        for (const k of ['6,3', '7,3', '8,3']) this.signs[k] = 'Un petit feu dans la cheminée fissurée. Le vent siffle entre les planches...';
        for (const k of ['12,3', '12,4', '13,4']) this.signs[k] = 'Un lit de paille. Pas très confortable, mais Jijimon te l\'a laissé avec le sourire.';
        this.signs['14,10'] = 'Encore des caisses. La maison a bien besoin d\'être rénovée... Plus la ville grandira, plus elle sera belle !';
      } else {
        this.objects = this.FULL.map(o => ({ ...o }));
        this.wall = this.WALL; delete this.floor; delete this.dark;
        if (stage === 2) {
          this.objects.push({ kind: 'bigrug', v: 1, x: 10, y: 9, w: 3, h: 1, walk: true }, { kind: 'painting', v: 0, x: 2, y: 1, w: 2, h: 1, back: true, oy: 6 },
            { kind: 'bigplant', x: 1, y: 8, w: 1, h: 1, small: true });
          this.signs['1,8'] = 'Une belle plante offerte par les habitants. La ville a bien changé !';
        }
      }
      DW.World.unprepare(this);
    },
    npcs: [{ sp: 'jijimon', x: 9, y: 7, face: 'right', talk: () => DW.Story.jijimonTalk() },
      { sp: 'poyomon', x: 11, y: 4, face: 'right', talk: () => DW.Story.poyomonTalk() }],   // fixe, près du lit : il propose la sieste
    warps: [{ x: 7, y: 11, w: 2, h: 1, dir: 'down', to: 'village', tx: 19, ty: 6 }],
    signs: {
      '1,3': () => library(),
      '2,3': () => library(),
      '3,3': "« Histoire de l'Île des Fichiers », tome 1. La Ville des Fichiers comptait autrefois des dizaines d'habitants...",
      '4,3': "« Histoire de l'Île des Fichiers », tome 1. La Ville des Fichiers comptait autrefois des dizaines d'habitants...",
      '6,3': 'Un bon feu crépite dans la cheminée. Il fait bon ici.', '7,3': 'Un bon feu crépite dans la cheminée. Il fait bon ici.', '8,3': 'Un bon feu crépite dans la cheminée. Il fait bon ici.',
      '9,3': () => say(`La vieille horloge indique ${DW.Time.str()}. Tic... tac...`),
      '12,3': 'Le lit où tu t\'es réveillé. Il sent bon le foin.',
      '12,4': 'Le lit où tu t\'es réveillé. Il sent bon le foin.', '13,4': 'Le lit où tu t\'es réveillé. Il sent bon le foin.',
      '1,6': 'Une marmite de soupe aux champignons mijote doucement.', '2,6': 'Une marmite de soupe aux champignons mijote doucement.',
      '14,7': "Le coffre de Jijimon. Il vaut mieux ne pas fouiller...",
      '6,7': 'Une tasse de thé encore chaude.', '7,7': 'Une tasse de thé encore chaude.',
      '11,8': 'Le bâton de Jijimon. Sa pierre bleue brille doucement.',
    },
  };
})();
;

// ===== js/maps/interieurs.js
'use strict';
// =====================================================================
//  INTÉRIEURS DES COMMERCES DE LA VILLE (Bazar, Dojo, Restaurant, Serre)
//  On parle au commerçant à travers le comptoir (cases du comptoir = panneau).
// =====================================================================
(function () {
  const { say } = DW.MapKit;
  const MAPS = DW.MAPS;

  // pièce : w × (2 rangées de mur + h rangées de parquet), porte en bas au centre
  // ajoute un commerce : o.lot = emplacement extérieur (pour la sortie), o.service = script du commerçant
  function shop(id, o) {
    const R = DW.MapKit.doorRoom(o.w, o.h), m = {
      name: o.name, music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      rows: R.rows, objects: o.objects, npcs: o.npcs || [], signs: o.signs || {}, floor: o.floor, wall: o.wall,
      warps: [{ x: R.door, y: R.rows.length - 1, w: 2, h: 1, dir: 'down', to: 'village', tx: o.lot.x + 2, ty: o.lot.y + o.lot.h }],
      populate: o.populate,
    };
    m.entry = { x: R.door, y: R.rows.length - 2 };
    MAPS[id] = m;
    return m;
  }
  const svc = id => () => DW.Story.services[id]();
  const talkAt = (m, xs, y, fn) => xs.forEach(x => (m.signs[`${x},${y}`] = fn));

  // ------------------------------------------------------------ Bazar de Gotsumon
  const bazar = shop('bazar_in', {
    name: 'Bazar de Gotsumon', w: 14, h: 6, lot: { x: 6, y: 7, w: 5, h: 3 },
    floor: { type: 'stone', cols: ['#d8c4a8', '#b8a488', '#8a7458'] }, wall: { base: '#d8b8a0', alt: '#c09c84', pattern: 'brick', wood: '#7a5030' },
    objects: [
      { kind: 'bookshelf', v: 1, x: 1, y: 3, w: 2, h: 1 },
      { kind: 'counter', v: 0, x: 5, y: 4, w: 4, h: 1 },
      { kind: 'crates', v: 1, x: 10, y: 3, w: 1, h: 1, small: true }, { kind: 'crates', v: 0, x: 11, y: 3, w: 1, h: 1, small: true },
      { kind: 'sacks', x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'barrel', v: 0, x: 1, y: 7, w: 1, h: 1, small: true }, { kind: 'barrel', v: 1, x: 12, y: 7, w: 1, h: 1, small: true },
      { kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 9, y: 1, w: 2, h: 2, back: true, oy: -6 },
      { kind: 'plant', v: 0, x: 1, y: 6, w: 1, h: 1, small: true },
      { kind: 'shelf', x: 6, y: 1, w: 2, h: 1, back: true, oy: 6 }, { kind: 'poster', v: 1, x: 12, y: 1, w: 1, h: 1, back: true, oy: 15 },
      { kind: 'floorlamp', x: 12, y: 5, w: 1, h: 1, small: true },
    ],
    npcs: [{ sp: 'gotsumon', x: 7, y: 3, face: 'right', talk: svc('gotsumon') }],
  });
  talkAt(bazar, [5, 6, 7, 8], 4, svc('gotsumon'));
  bazar.signs['1,3'] = bazar.signs['2,3'] = 'Des catalogues de remèdes et de vieux plans de la ville.';

  // ------------------------------------------------------------ Dojo d'Elecmon
  // l'arbitre des tournois de la ville (Coupes Junior, Disciple, Champion, Ultime : game/activities.js)
  const arena = (x, y) => ({ sp: 'agumon', x, y, face: 'down', talk: async () => { await DW.say("Moi, j'organise les tournois de la ville ! Chaque coupe se dispute une fois par jour, en trois combats d'affilée.", 'Agumon'); await DW.Tournament('au tournoi du Dojo'); } });
  DW.arenaNPC = arena;
  const dojo = shop('dojo_in', {
    name: "Dojo d'Elecmon", w: 14, h: 7, lot: { x: 29, y: 7, w: 5, h: 3 },
    floor: { type: 'tatami', cols: ['#dccf8e', '#c8ba78', '#6a8a4a'] }, wall: { base: '#f4eedc', alt: '#e4dcc4', pattern: 'plain', wood: '#4a3020' },
    objects: [
      { kind: 'scroll', v: 1, x: 6, y: 1, w: 1, h: 2, back: true, oy: -4 }, { kind: 'scroll', v: 0, x: 3, y: 1, w: 1, h: 2, back: true, oy: -4 }, { kind: 'scroll', v: 0, x: 10, y: 1, w: 1, h: 2, back: true, oy: -4 },
      { kind: 'dummy', x: 1, y: 4, w: 1, h: 1, small: true }, { kind: 'dummy', x: 12, y: 4, w: 1, h: 1, small: true },
      { kind: 'weights', x: 1, y: 7, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 12, y: 8, w: 1, h: 1, small: true },
    ],
    npcs: [{ sp: 'elecmon', x: 7, y: 4, face: 'left', talk: svc('elecmon') }, arena(10, 5)],
  });
  dojo.signs['6,2'] = '« Le corps se forge au combat. L\'esprit, à l\'entraînement. »';

  // ------------------------------------------------------------ Restaurant de Mushroomon
  const resto = shop('resto_in', {
    name: 'Restaurant aux Champignons', w: 14, h: 7, lot: { x: 6, y: 19, w: 5, h: 3 },
    floor: { type: 'tile', cols: ['#f6eee4', '#d0504a', '#9a3a34'] }, wall: { base: '#e4f2e4', alt: '#cce4cc', pattern: 'stripes', wood: '#8a5a3a' },
    objects: [
      { kind: 'oven', x: 1, y: 3, w: 2, h: 1 },
      { kind: 'counter', v: 1, x: 4, y: 4, w: 4, h: 1 },
      { kind: 'shelf', x: 4, y: 1, w: 2, h: 1, back: true, oy: 6 },
      { kind: 'dtable', v: 0, x: 10, y: 4, w: 2, h: 1 }, { kind: 'dtable', v: 1, x: 10, y: 7, w: 2, h: 1 }, { kind: 'dtable', v: 1, x: 3, y: 7, w: 2, h: 1 },
      { kind: 'window', v: 0, x: 9, y: 1, w: 2, h: 2, back: true, oy: -6 },
      { kind: 'plant', v: 1, x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'fridge', x: 11, y: 3, w: 1, h: 1, small: true }, { kind: 'poster', v: 0, x: 12, y: 1, w: 1, h: 1, back: true, oy: 15 },
      { kind: 'floorlamp', x: 1, y: 8, w: 1, h: 1, small: true },
    ],
    npcs: [{ sp: 'mushroomon', x: 6, y: 3, face: 'right', talk: svc('mushroomon') }],
  });
  talkAt(resto, [4, 5, 6, 7], 4, svc('mushroomon'));
  resto.signs['1,3'] = resto.signs['2,3'] = 'Le four à bois ronronne. Ça sent le champignon grillé...';

  // ------------------------------------------------------------ Serre de Yokomon (la DigiFerme)
  const serre = shop('serre_in', {
    name: 'Serre de Yokomon — DigiFerme', w: 16, h: 7, lot: { x: 29, y: 19, w: 5, h: 3 },
    floor: { type: 'stone', cols: ['#c8ccc0', '#a8ae9e', '#7a806e'] }, wall: { base: '#e4f4dc', alt: '#d0e8c4', pattern: 'diamond', wood: '#5a7a4a' },
    objects: [
      { kind: 'counter', v: 2, x: 6, y: 4, w: 4, h: 1 },
      { kind: 'pots', x: 1, y: 3, w: 2, h: 1 }, { kind: 'pots', x: 12, y: 3, w: 2, h: 1 },
      { kind: 'plant', v: 1, x: 1, y: 8, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 14, y: 8, w: 1, h: 1, small: true },
      { kind: 'plant', v: 1, x: 14, y: 5, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 1, y: 5, w: 1, h: 1, small: true },
      { kind: 'window', v: 0, x: 4, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 10, y: 1, w: 2, h: 2, back: true, oy: -6 },
      { kind: 'bigplant', x: 3, y: 3, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 11, y: 3, w: 1, h: 1, small: true },
    ],
    npcs: [],
    // les Digimon de la DigiFerme se promènent dans la serre
    populate() {
      const m = MAPS.serre_in, box = DW.state.box.slice(0, 6), spots = [[3, 6], [5, 7], [8, 7], [11, 6], [12, 8], [4, 8]];
      m.npcs = [{ sp: 'yokomon', x: 8, y: 3, face: 'left', talk: svc('yokomon') }]
        .concat(box.map((d, i) => ({ sp: d.sp, x: spots[i][0], y: spots[i][1], face: i % 2 ? 'left' : 'right', wander: 1, talk: () => say(`${d.name} se repose tranquillement à la DigiFerme. Il a l'air heureux.`) })));
    },
  });
  talkAt(serre, [6, 7, 8, 9], 4, svc('yokomon'));

  // ------------------------------------------------------------ Poste de Biyomon (on entre et on la trouve au guichet)
  const poste = shop('poste_in', {
    name: 'Poste de Biyomon', w: 14, h: 6, lot: { x: 24, y: 23, w: 5, h: 3 },
    floor: { type: 'herring', cols: ['#d8b088', '#b88a60', '#8a6040'] }, wall: { base: '#f0e8f8', alt: '#e0d4ec', pattern: 'stripes', wood: '#c86a9a' },
    objects: [
      { kind: 'counter', v: 2, x: 5, y: 4, w: 4, h: 1 },
      { kind: 'shelf', x: 2, y: 1, w: 2, h: 1, back: true, oy: 6 }, { kind: 'shelf', x: 10, y: 1, w: 2, h: 1, back: true, oy: 6 },
      { kind: 'sacks', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'sacks', x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'crates', v: 1, x: 1, y: 7, w: 1, h: 1, small: true }, { kind: 'nest', v: 0, x: 11, y: 7, w: 2, h: 1 },
      { kind: 'window', v: 0, x: 6, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'plant', v: 1, x: 12, y: 5, w: 1, h: 1, small: true },
    ],
    npcs: [{ sp: 'biyomon', x: 7, y: 3, face: 'down', talk: svc('biyomon') }],
  });
  talkAt(poste, [5, 6, 7, 8], 4, svc('biyomon'));
  poste.signs['2,2'] = poste.signs['3,2'] = poste.signs['10,2'] = poste.signs['11,2'] = 'Des casiers pleins de lettres. Certaines sont adressées à des Digimon qui ne sont pas encore revenus...';
  poste.signs['11,7'] = poste.signs['12,7'] = 'Un nid douillet : Biyomon y fait la sieste entre deux tournées.';

  // ------------------------------------------------------------ Banque de Kunemon (on entre et on la trouve au guichet)
  const banque = shop('banque_in', {
    name: 'Banque de Kunemon', w: 12, h: 6, lot: { x: 6, y: 3, w: 5, h: 3 },
    floor: { type: 'stone', cols: ['#c8ccd4', '#a8acb8', '#7a7e8a'] }, wall: { base: '#e8e0c8', alt: '#d8ccb0', pattern: 'brick', wood: '#5a5a6a' },
    objects: [
      { kind: 'counter', v: 1, x: 4, y: 4, w: 4, h: 1 },
      { kind: 'chest', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'chest', x: 2, y: 3, w: 1, h: 1, small: true }, { kind: 'chest', x: 10, y: 3, w: 1, h: 1, small: true },
      { kind: 'crates', v: 0, x: 1, y: 7, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 10, y: 7, w: 1, h: 1, small: true },
      { kind: 'window', v: 0, x: 5, y: 1, w: 2, h: 2, back: true, oy: -6 },
    ],
    npcs: [{ sp: 'kunemon', x: 6, y: 3, face: 'down', talk: svc('kunemon') }],
  });
  talkAt(banque, [4, 5, 6, 7], 4, svc('kunemon'));
  banque.signs['1,3'] = banque.signs['2,3'] = banque.signs['10,3'] = 'Des coffres scellés de soie : ce sont les cocons où Kunemon range les objets de toute la ville. Bzzz !';
})();
;

// ===== js/maps/grandir.js
'use strict';
// =====================================================================
//  LES BÂTIMENTS GRANDISSENT AVEC LA VILLE
//  Un intérieur peut avoir plusieurs « formes » selon le niveau de la ville (DW.Town.level()) :
//  le Bazar devient un Grand Bazar, puis un Centre commercial avec ses rayons et ses caissiers Digimon.
//  DW.Grow.set(id, [{ min, name, w, h, objects, npcs, signs, decor(m) }, ...]) : la forme est choisie à chaque entrée.
//  La porte de sortie reste en bas au centre ; l'arrivée depuis la ville suit la taille (Overworld.enterDoor : map.arrive).
// =====================================================================
(function () {
  const { say } = DW.MapKit;
  const MAPS = DW.MAPS;
  const st = () => DW.state;

  const Grow = DW.Grow = {
    set(id, forms) {
      const m = MAPS[id], exit = { ...m.warps[0] }, pop0 = m.populate;
      const base = { name: m.name, rows: m.rows, objects: m.objects, npcs: m.npcs, signs: m.signs };
      m.forms = forms;
      m.formOf = () => { const lv = DW.Town ? DW.Town.level() : 0; let f = null; for (const F of forms) if (lv >= F.min) f = F; return f; };
      m.populate = function () {
        const F = this.formOf(), key = F ? F.min : -1;
        if (this.formKey !== key) {
          this.formKey = key;
          if (!F) Object.assign(this, { name: base.name, rows: base.rows, objects: base.objects.map(o => ({ ...o })), npcs: base.npcs, signs: { ...base.signs } });
          else {
            const R = DW.MapKit.doorRoom(F.w, F.h);
            Object.assign(this, { name: F.name, rows: R.rows, objects: F.objects.map(o => ({ ...o })), npcs: [], signs: {} });
            this.warps = [{ ...exit, x: R.door, y: R.rows.length - 1 }];
            this.entry = { x: R.door, y: R.rows.length - 2 };
            if (F.decor) F.decor(this);
          }
          if (!F) { this.warps = [{ ...exit }]; }
          DW.World.unprepare(this); delete this.w;   // (nouvelle taille : recalculée par DW.getMap)
        }
        if (F) this.npcs = F.npcs ? F.npcs() : [];
        else if (pop0) pop0.call(this);   // (forme d'origine : son propre peuplement)
      };
      // arrivée depuis la ville : devant la porte, quelle que soit la taille
      m.arrive = () => { m.populate(); const w = m.warps[0]; return [w.x, w.y - 1]; };
    },
  };

  // ------------------------------------------------------------ une gondole de supermarché (v 0 : nourriture, 1 : soins, 2 : outils)
  DW.World.OBJ.gondola = { w: 48, h: 34, n: 3, draw(d, v) {
    const P = [['#e05a3a', '#f0c040', '#7ac04a', '#d8a060', '#ffffff'], ['#5ad870', '#3ab8e0', '#a05ae0', '#f0f0f0', '#e84a5a'], ['#a8743a', '#9aa8b8', '#e0c040', '#5a5a6a', '#c86a3a']][v];
    d.rect(1, 6, 46, 26, '#d8dce4', { round: 0.08 });
    for (const y of [10, 19, 28]) d.deco.rect(2, y, 44, 1.6, '#8a8e9a');
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) d.deco.rect(3 + i * 4.8, 4.4 + r * 9, 3.6, 5, P[(i + r * 2) % P.length]);
    d.rect(0, 2, 48, 4, ['#d84a3a', '#3a9ad8', '#5a8a4a'][v], { round: 0.2 });
  } };
  DW.World.OBJ.checkout = { w: 40, h: 28, n: 1, draw(d) {
    d.rect(1, 8, 38, 18, '#c8ccd4', { round: 0.08 }); d.deco.rect(2, 9, 36, 3, '#3a3a44');
    d.rect(26, 2, 10, 8, '#4a4a54', { round: 0.1 }); d.deco.rect(27.5, 3.5, 7, 4, '#7ae0a0');
    d.deco.rect(4, 13, 18, 2, '#8a8e9a');
  } };

  // ------------------------------------------------------------ le Bazar → Grand Bazar → Centre commercial
  const bazar = MAPS.bazar_in;
  if (bazar) {
    const svc = () => DW.Story.services.gotsumon();
    const care = id => ['heal', 'mp', 'cure', 'revive', 'sick', 'hurt'].includes(DW.ITEMS[id].use) && !DW.isFood(id);
    const RAYONS = {
      food: { name: 'Alimentation', test: id => DW.isFood(id) },
      care: { name: 'Soins', test: care },
      tools: { name: 'Outils et objets', test: id => !DW.isFood(id) && !care(id) },
    };
    const rayon = k => async () => {
      const R = RAYONS[k], stock = DW.shopStock('bazar').filter(R.test);
      if (!stock.length) { await say(`Le rayon ${R.name} est encore vide... Il se remplira quand la ville aura grandi !`); return; }
      await DW.Game.push(new DW.ShopScene(stock));
    };
    const cashier = (sp, k) => async () => {
      const n = DW.SPECIES[sp] ? DW.SPECIES[sp].name : sp;
      await say(`Bienvenue au rayon ${RAYONS[k].name} ! Je m'occupe de la caisse.`, n);
      await rayon(k)();
    };
    const sp = s => (DW.SPECIES[s] ? s : 'gotsumon');
    Grow.set('bazar_in', [
      // Grand Bazar (ville « Bourg ») : plus grand, deux comptoirs
      { min: 5, name: 'Grand Bazar de Gotsumon', w: 20, h: 8,
        objects: [
          { kind: 'counter', v: 0, x: 3, y: 4, w: 4, h: 1 }, { kind: 'counter', v: 1, x: 13, y: 4, w: 4, h: 1 },
          { kind: 'gondola', v: 0, x: 2, y: 7, w: 3, h: 1 }, { kind: 'gondola', v: 1, x: 7, y: 7, w: 3, h: 1 }, { kind: 'gondola', v: 2, x: 12, y: 7, w: 3, h: 1 },
          { kind: 'window', v: 0, x: 8, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'plant', v: 0, x: 18, y: 9, w: 1, h: 1, small: true },
          { kind: 'crates', v: 1, x: 18, y: 3, w: 1, h: 1, small: true }, { kind: 'barrel', v: 0, x: 1, y: 9, w: 1, h: 1, small: true },
        ],
        decor: m => { for (const x of [3, 4, 5, 6]) m.signs[`${x},4`] = svc; for (const x of [13, 14, 15, 16]) m.signs[`${x},4`] = cashier(sp('tokomon'), 'food'); for (const [x, k] of [[2, 'food'], [7, 'care'], [12, 'tools']]) for (let i = 0; i < 3; i++) m.signs[`${x + i},7`] = rayon(k); },
        npcs: () => [{ sp: 'gotsumon', x: 4, y: 3, face: 'down', talk: svc }, { sp: sp('tokomon'), x: 14, y: 3, face: 'down', talk: cashier(sp('tokomon'), 'food') }] },
      // Centre commercial (ville « Grande ville ») : des allées de rayons, des caissiers, des clients
      { min: 8, name: 'Centre commercial de Gotsumon', w: 30, h: 12,
        objects: [
          { kind: 'counter', v: 0, x: 3, y: 4, w: 4, h: 1 },
          ...[0, 1, 2].flatMap(r => [4, 10, 16, 22].map((x, i) => ({ kind: 'gondola', v: (i + r) % 3, x, y: 6 + r * 2, w: 3, h: 1 }))),
          ...[[11, 'food'], [16, 'care'], [21, 'tools']].map(([x]) => ({ kind: 'checkout', x, y: 12, w: 2, h: 1 })),
          { kind: 'window', v: 0, x: 10, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 18, y: 1, w: 2, h: 2, back: true, oy: -6 },
          { kind: 'plant', v: 0, x: 1, y: 13, w: 1, h: 1, small: true }, { kind: 'plant', v: 1, x: 28, y: 13, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 28, y: 3, w: 1, h: 1, small: true },
        ],
        decor: m => {
          for (const x of [3, 4, 5, 6]) m.signs[`${x},4`] = svc;
          [0, 1, 2].forEach(r => [4, 10, 16, 22].forEach((x, i) => { const k = ['food', 'care', 'tools'][(i + r) % 3]; for (let j = 0; j < 3; j++) m.signs[`${x + j},${6 + r * 2}`] = rayon(k); }));
          [[11, 'food', 'tokomon'], [16, 'care', 'motimon'], [21, 'tools', 'numemon']].forEach(([x, k, s]) => { for (const dx of [0, 1]) m.signs[`${x + dx},12`] = cashier(sp(s), k); });
        },
        npcs: () => {
          const out = [{ sp: 'gotsumon', x: 4, y: 3, face: 'down', talk: svc }];
          [[11, 'food', 'tokomon'], [16, 'care', 'motimon'], [21, 'tools', 'numemon']].forEach(([x, k, s]) => out.push({ sp: sp(s), x: x + 1, y: 11, face: 'down', talk: cashier(sp(s), k) }));
          // des clients qui font leurs courses dans les allées
          ['kunemon', 'betamon', 'biyomon', 'palmon'].filter(c => DW.Town.has(c)).slice(0, 3).forEach((c, i) => out.push({ sp: c, x: 8 + i * 6, y: 7 + (i % 2) * 2, face: i % 2 ? 'left' : 'right', wander: 2,
            talk: () => say(DW.pick(['Il y a tout ce qu\'il faut, ici !', 'Je cherche le rayon des Viandes...', 'Avant, c\'était un petit bazar. Regarde ça maintenant !']), DW.SPECIES[c].name) }));
          return out;
        } },
    ]);
  }

  // ------------------------------------------------------------ le Restaurant → Grand Restaurant → Restaurant gastronomique
  const resto = MAPS.resto_in;
  if (resto) {
    const svc = () => DW.Story.services.mushroomon();
    const sp = s => (DW.SPECIES[s] ? s : 'mushroomon');
    // des habitants de la ville attablés (ceux qui sont revenus)
    const diners = spots => DW.Town.RECRUITS.filter(r => DW.Town.has(r.id) && r.id !== 'mushroomon' && DW.SPECIES[r.id]).slice(0, spots.length).map((r, i) => ({ sp: r.id, x: spots[i][0], y: spots[i][1], face: i % 2 ? 'left' : 'right',
      talk: () => say(DW.pick(['Mmmh ! Les champignons grillés de Mushroomon sont les meilleurs de l\'île !', 'On mange bien, ici. Tu devrais goûter le menu du jour !', 'Le service est rapide, avec tous ces serveurs !']), DW.SPECIES[r.id].name) }));
    const waiter = (s, x, y) => ({ sp: sp(s), x, y, face: 'down', wander: 2, talk: () => say(DW.pick(['Bonjour ! Une table pour deux ? Mushroomon est en cuisine, au comptoir du fond.', 'Je vous apporte la carte tout de suite !', 'Attention, chaud devant !']), DW.SPECIES[sp(s)].name) });
    const tables = list => list.map(([x, y], i) => ({ kind: 'dtable', v: i % 2, x, y, w: 2, h: 1 }));
    Grow.set('resto_in', [
      { min: 5, name: 'Grand Restaurant aux Champignons', w: 20, h: 9,
        objects: [{ kind: 'oven', x: 1, y: 3, w: 2, h: 1 }, { kind: 'oven', x: 16, y: 3, w: 2, h: 1 }, { kind: 'counter', v: 1, x: 6, y: 4, w: 4, h: 1 }, { kind: 'counter', v: 1, x: 10, y: 4, w: 4, h: 1 },
          ...tables([[2, 7], [7, 7], [12, 7], [16, 7], [4, 10], [14, 10]]), { kind: 'window', v: 0, x: 4, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 14, y: 1, w: 2, h: 2, back: true, oy: -6 },
          { kind: 'plant', v: 1, x: 18, y: 10, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 1, y: 10, w: 1, h: 1, small: true }],
        decor: m => { for (let x = 6; x < 14; x++) m.signs[`${x},4`] = svc; },
        npcs: () => [{ sp: 'mushroomon', x: 9, y: 3, face: 'down', talk: svc }, waiter('tanemon', 9, 9), ...diners([[4, 7], [9, 7], [14, 7], [6, 10]])] },
      { min: 8, name: 'Restaurant gastronomique de Mushroomon', w: 28, h: 12,
        objects: [{ kind: 'oven', x: 1, y: 3, w: 2, h: 1 }, { kind: 'oven', x: 4, y: 3, w: 2, h: 1 }, { kind: 'oven', x: 22, y: 3, w: 2, h: 1 }, { kind: 'fridge', x: 25, y: 3, w: 1, h: 1, small: true },
          ...[8, 12, 16].map(x => ({ kind: 'counter', v: 1, x, y: 4, w: 4, h: 1 })),
          ...tables([[2, 7], [7, 7], [12, 7], [17, 7], [22, 7], [4, 10], [9, 10], [17, 10], [22, 10], [2, 13], [22, 13]]),
          ...[6, 13, 20].map(x => ({ kind: 'window', v: 0, x, y: 1, w: 2, h: 2, back: true, oy: -6 })),
          { kind: 'bigplant', x: 26, y: 13, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 1, y: 10, w: 1, h: 1, small: true }],
        decor: m => { for (let x = 8; x < 20; x++) m.signs[`${x},4`] = svc; },
        npcs: () => [{ sp: 'mushroomon', x: 13, y: 3, face: 'down', talk: svc }, waiter('tanemon', 11, 9), waiter('tokomon', 16, 12),
          ...diners([[4, 7], [9, 7], [14, 7], [19, 7], [6, 10], [11, 10], [19, 10], [24, 10]])] },
    ]);
  }

  // ------------------------------------------------------------ la maison de Jijimon prend des étages
  // ville « Village » (niveau 4) : un escalier remplace la seconde bibliothèque → le Dortoir des habitants ;
  // ville « Grande ville » (niveau 8) : un second étage → la Grande bibliothèque de Jijimon
  const J = MAPS.maison;
  if (J) {
    const lv = () => (DW.Town ? DW.Town.level() : 0);
    const residents = (spots, skip) => DW.Town.RECRUITS.filter(r => DW.Town.has(r.id) && DW.SPECIES[r.id] && !skip.includes(r.id)).slice(0, spots.length).map((r, i) => ({ sp: r.id, x: spots[i][0], y: spots[i][1], face: i % 2 ? 'left' : 'right', wander: 1,
      // (ce sont les habitants revenus en ville : leur bâtiment existe déjà, ils viennent seulement dormir ici)
      talk: () => say(DW.pick(['Le jour, je travaille en ville ; le soir, Jijimon nous prête un lit au dortoir. Il est si gentil !', 'Hohoho, c\'est ce que dit toujours Jijimon. Je commence à le dire aussi !', 'Le soir, on se raconte notre journée avant de dormir. La ville grandit à vue d\'œil !']), DW.SPECIES[r.id].name) }));
    MAPS.maison_haut = {
      name: 'Maison de Jijimon — Dortoir des habitants', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      floor: { type: 'herring', cols: ['#c8a070', '#a07a4a', '#6a4e2e'] }, wall: { base: '#f0e0c8', alt: '#e0ccac', pattern: 'stripes', wood: '#6a4a2a' },
      rows: DW.MapKit.roomRows(18, 12), npcs: [], signs: {}, warps: [], doors: [], secretEntry: true,   // (l'escalier n'apparaît chez Jijimon qu'à partir du niveau 4)
      objects: [{ kind: 'stairsdown', x: 3, y: 1, w: 2, h: 2, back: true },
        ...[7, 10, 13].map(x => ({ kind: 'bed', x, y: 3, w: 2, h: 2 })), ...[7, 10, 13].map(x => ({ kind: 'bed', x, y: 7, w: 2, h: 2 })),
        { kind: 'rug', x: 1, y: 7, w: 4, h: 3, walk: true }, { kind: 'plant', v: 0, x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'window', v: 0, x: 8, y: 1, w: 2, h: 2, back: true, oy: -6 }],
      populate() {
        this.doors = [{ x: 3, y: 2, w: 2, dir: 'up', to: 'maison', tx: 3, ty: 3 }];
        this.npcs = residents([[5, 5], [9, 6], [12, 6], [15, 5], [3, 9]], ['jijimon']);
        if (lv() >= 8) {
          if (!this.objects.some(o => o.kind === 'stairsup')) { this.objects.push({ kind: 'stairsup', x: 15, y: 1, w: 2, h: 2, back: true }); DW.World.unprepare(this); }
          this.doors.push({ x: 15, y: 2, w: 2, dir: 'up', to: 'maison_haut2', tx: 3, ty: 3 });
        }
      },
    };
    // un lit libre : se reposer ou dormir, comme chez Jijimon
    for (const k of ['13,3', '14,3', '13,4', '14,4']) MAPS.maison_haut.signs[k] = async () => { await say('Un lit libre, tout propre. Jijimon le garde pour les voyageurs.'); await DW.Life.restOrSleep(); };
    MAPS.maison_haut2 = {
      name: 'Maison de Jijimon — Grande bibliothèque', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      floor: { type: 'carpet', cols: ['#8a3a3a', '#6a2a2a', '#4a1a1a'] }, wall: { base: '#e8dcc0', alt: '#d8c8a4', pattern: 'plain', wood: '#4a3020' },
      rows: DW.MapKit.roomRows(18, 12), npcs: [], signs: {}, warps: [], secretEntry: true, doors: [{ x: 3, y: 2, w: 2, dir: 'up', to: 'maison_haut', tx: 15, ty: 3 }],
      objects: [{ kind: 'stairsdown', x: 3, y: 1, w: 2, h: 2, back: true },
        ...[6, 8, 10, 12, 14].map((x, i) => ({ kind: 'bookshelf', v: i % 2, x, y: 3, w: 2, h: 1 })), ...[2, 4, 12, 14].map((x, i) => ({ kind: 'bookshelf', v: i % 2, x, y: 6, w: 2, h: 1 })),
        { kind: 'desk', x: 7, y: 8, w: 2, h: 1 }, { kind: 'telescope', x: 16, y: 8, w: 1, h: 1, small: true }, { kind: 'armchair', v: 1, x: 10, y: 8, w: 1, h: 1, small: true }, { kind: 'plant', v: 1, x: 1, y: 9, w: 1, h: 1, small: true }],
      populate() {
        this.npcs = [{ sp: DW.SPECIES.motimon ? 'motimon' : 'jijimon', x: 9, y: 7, face: 'down', talk: () => DW.Guide && DW.Guide.questions ? DW.Guide.questions('Bienvenue à la Grande bibliothèque ! Que veux-tu savoir ?') : say('Chut... On lit, ici !') }];
      },
    };
    for (const [x, y] of [[6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [2, 6], [3, 6], [4, 6], [5, 6], [12, 6], [13, 6], [14, 6], [15, 6]])
      MAPS.maison_haut2.signs[`${x},${y}`] = () => say(DW.pick(["« Histoire de l'Île des Fichiers » : autrefois, la ville comptait des centaines d'habitants...",
        '« Les Digivolutions » : un Digimon bien entraîné, bien nourri et heureux choisit lui-même sa voie.', "« Les écussons » : sept écussons brillent quelque part sur l'île. Chacun réveille une force cachée.",
        '« Les Engrenages Noirs » : on dit qu\'une ombre les plante dans le cœur des Digimon...', '« Cuisine de l\'île », par Mushroomon : un bon plat rend fort pour toujours !']));
    for (const k of ['13,3', '14,3', '13,4', '14,4']) if (!MAPS.maison_haut.signs[k]) MAPS.maison_haut.signs[k] = MAPS.maison_haut.signs['13,3'];
    MAPS.maison_haut2.signs['16,8'] = () => say(`La longue-vue de Jijimon, tournée vers le ciel. ${DW.Time.isNight() ? 'Les étoiles brillent comme des données lumineuses...' : 'Il faudra revenir la nuit pour voir les étoiles.'}`);
    // l'escalier, dans la maison de Jijimon (à la place de la seconde bibliothèque)
    const b0 = J.build;
    J.build = function () {
      b0.apply(this, arguments);
      const want = lv() >= 4, has = this.objects.some(o => o.kind === 'stairsup');
      if (want && !has) {
        this.objects = this.objects.filter(o => !(o.kind === 'bookshelf' && o.x === 3) && !(o.kind === 'sacks' && o.x === 3));
        this.objects.push({ kind: 'stairsup', x: 3, y: 1, w: 2, h: 2, back: true });
        delete this.signs['3,3']; delete this.signs['4,3'];
        if (this.gfx) DW.World.unprepare(this);
      }
      this.doors = (this.doors || []).filter(d => d.to !== 'maison_haut');
      if (want) this.doors.push({ x: 3, y: 2, w: 2, dir: 'up', to: 'maison_haut', tx: 3, ty: 3 });
    };
  }

  // ------------------------------------------------------------ le Dojo → Grand Dojo (+ salle de méditation) → Dojo complet (+ salle des combats)
  const dojo = MAPS.dojo_in;
  if (dojo) {
    const svc = () => DW.Story.services.elecmon();
    const once = key => { const f = st().flags; f.dojoDay = f.dojoDay || {}; if (f.dojoDay[key] === DW.Time.day()) return false; f.dojoDay[key] = DW.Time.day(); return true; };
    const open = (m, x, y) => { m.rows[y] = m.rows[y].slice(0, x) + '1' + m.rows[y].slice(x + 1); };
    const TATAMI = { type: 'tatami', cols: ['#dccf8e', '#c8ba78', '#6a8a4a'] }, WALL = { base: '#f4eedc', alt: '#e4dcc4', pattern: 'plain', wood: '#4a3020' };
    // salle de méditation (à gauche du dojo)
    MAPS.dojo_zen = { name: "Dojo d'Elecmon — Salle de méditation", music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true, secretEntry: true,   // (ouverte seulement quand le dojo a grandi)
      floor: TATAMI, wall: WALL, rows: DW.MapKit.roomRows(14, 10), npcs: [], signs: {}, doors: [],
      objects: [...[3, 6, 9].map(x => ({ kind: 'scroll', v: x % 2, x, y: 1, w: 1, h: 2, back: true, oy: -4 })), ...[[3, 5], [6, 5], [9, 5], [4, 7], [8, 7]].map(([x, y], i) => ({ kind: 'cushion', v: i % 3, x, y, w: 1, h: 1, small: true })),
        { kind: 'plant', v: 0, x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'plant', v: 1, x: 11, y: 8, w: 1, h: 1, small: true }],
      warps: [{ x: 13, y: 5, w: 1, h: 2, dir: 'right', to: 'dojo_in', tx: 1, ty: 5 }] };
    for (const y of [5, 6]) open(MAPS.dojo_zen, 13, y);
    MAPS.dojo_zen.npcs.push({ sp: DW.SPECIES.patamon ? 'patamon' : 'elecmon', x: 6, y: 4, face: 'down', talk: async () => {
      const m = st().party[0], n = DW.SPECIES.patamon ? 'Patamon' : 'Elecmon';
      if (!m) return;
      if (!once('zen')) { await say(`${m.name} a déjà médité aujourd'hui. L'esprit a besoin de repos, lui aussi !`, n); return; }
      if ((await DW.ask('Méditer en silence sur les coussins ? (une fois par jour)')) !== 0) return;
      await DW.fade(0.6, 0.4); st().clock += 30; m.tired = 0; DW.Life.addDisc(m, 5); m.addHappy(3); await DW.wait(0.6); await DW.fade(0, 0.4);
      await say(`Inspire... expire... ${m.name} se sent calme et reposé. (fatigue effacée, discipline +5, bonheur +3)`, n);
    } });
    // salle des combats (à droite du dojo complet) : un adversaire d'entraînement par jour, à ton niveau, sans K.O.
    MAPS.dojo_combat = { name: "Dojo d'Elecmon — Salle des combats", music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true, secretEntry: true,
      floor: { type: 'tatami', cols: ['#e8d8a0', '#d4c288', '#8a4a3a'] }, wall: WALL, rows: DW.MapKit.roomRows(16, 11), npcs: [], signs: {}, doors: [],
      objects: [{ kind: 'bigrug', v: 2, x: 5, y: 5, w: 5, h: 3, walk: true }, ...[2, 13].map(x => ({ kind: 'dummy', x, y: 3, w: 1, h: 1, small: true })), { kind: 'scroll', v: 1, x: 7, y: 1, w: 1, h: 2, back: true, oy: -4 }],
      warps: [{ x: 0, y: 5, w: 1, h: 2, dir: 'left', to: 'dojo_in', tx: 24, ty: 5 }] };
    for (const y of [5, 6]) open(MAPS.dojo_combat, 0, y);
    const POOL = ['agumon', 'gabumon', 'tentomon', 'palmon', 'gomamon', 'patamon', 'greymon', 'garurumon', 'kabuterimon', 'togemon', 'ikkakumon', 'angemon'];
    MAPS.dojo_combat.npcs.push({ sp: DW.SPECIES.tsunomon ? 'tsunomon' : 'elecmon', x: 7, y: 4, face: 'down', talk: async ow => {
      const s = st(), top = Math.max(1, ...s.party.map(m => m.level || 1)), n = DW.SPECIES.tsunomon ? 'Tsunomon' : 'Elecmon';
      if (!s.party.some(m => m.hp > 0)) { await say('Ton équipe est épuisée. Soigne-la avant un combat d\'entraînement !', n); return; }
      if (!once('combat')) { await say("C'est assez pour aujourd'hui ! Reviens demain pour un nouveau combat d'entraînement.", n); return; }
      const champ = top >= 15, list = POOL.filter(p => DW.SPECIES[p] && (DW.SPECIES[p].stage === 'Champion') === champ);
      const sp = DW.pick(list.length ? list : ['agumon']);
      await say(`Un combat d'entraînement contre ${DW.SPECIES[sp].name} ! Ici, personne ne risque rien : on s'arrête avant le K.O.`, n);
      if ((await DW.ask('Combattre ?')) !== 0) { s.flags.dojoDay.combat = null; return; }
      const res = await ow.battle({ enemy: new DW.Digimon(sp, top), canLose: true, intro: `${DW.SPECIES[sp].name} salue, puis se met en garde !` });
      s.party.forEach(m => { if (m.hp <= 0) m.hp = 1; });
      await say(res === 'win' ? 'Bravo ! Un beau combat. Elecmon serait fier de toi !' : 'Pas mal du tout ! Tu feras mieux demain.', n);
    } });
    const tables = list => list.map(([x, y]) => ({ kind: 'dummy', x, y, w: 1, h: 1, small: true }));
    Grow.set('dojo_in', [
      { min: 5, name: "Grand Dojo d'Elecmon", w: 20, h: 9,
        objects: [...[4, 9, 14].map(x => ({ kind: 'scroll', v: x % 2, x, y: 1, w: 1, h: 2, back: true, oy: -4 })), ...tables([[4, 4], [15, 4], [4, 9], [15, 9]]),
          { kind: 'weights', x: 17, y: 6, w: 1, h: 1, small: true }, { kind: 'plant', v: 0, x: 18, y: 10, w: 1, h: 1, small: true }],
        decor: m => { for (const y of [5, 6]) open(m, 0, y); m.warps.push({ x: 0, y: 5, w: 1, h: 2, dir: 'left', to: 'dojo_zen', tx: 12, ty: 5 }); m.signs['9,2'] = '« Le corps se forge au combat. L\'esprit, à l\'entraînement. » — À gauche : la salle de méditation.'; },
        npcs: () => [{ sp: 'elecmon', x: 9, y: 4, face: 'down', talk: svc }, DW.arenaNPC(13, 6)] },
      { min: 8, name: "Dojo d'Elecmon — Grand hall", w: 26, h: 11,
        objects: [...[5, 12, 19].map(x => ({ kind: 'scroll', v: x % 2, x, y: 1, w: 1, h: 2, back: true, oy: -4 })), ...tables([[4, 4], [21, 4], [4, 11], [21, 11], [9, 8], [16, 8]]),
          { kind: 'weights', x: 12, y: 11, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 24, y: 3, w: 1, h: 1, small: true }],
        decor: m => {
          for (const y of [5, 6]) { open(m, 0, y); open(m, 25, y); }
          m.warps.push({ x: 0, y: 5, w: 1, h: 2, dir: 'left', to: 'dojo_zen', tx: 12, ty: 5 }, { x: 25, y: 5, w: 1, h: 2, dir: 'right', to: 'dojo_combat', tx: 1, ty: 5 });
          m.signs['12,2'] = '« Le corps se forge au combat. L\'esprit, à l\'entraînement. » — À gauche : méditation. À droite : combats.';
        },
        npcs: () => [{ sp: 'elecmon', x: 12, y: 4, face: 'down', talk: svc }, DW.arenaNPC(16, 6), { sp: DW.SPECIES.gotsumon ? 'gotsumon' : 'elecmon', x: 8, y: 7, face: 'right', wander: 1, talk: () => say('Hop ! Hop ! Je m\'entraîne pour devenir aussi fort que Golemon !', 'Gotsumon') }] },
    ]);
  }

  // ------------------------------------------------------------ la Serre → Grande serre → Jardins maraîchers
  const serre = MAPS.serre_in;
  if (serre) {
    const svc = () => DW.Story.services.yokomon();
    const sp = s => (DW.SPECIES[s] ? s : 'yokomon');
    const VEG = ['super_carotte', 'radis', 'digichampi', 'pomme_bleue'];
    // un maraîcher : une récolte offerte par jour
    const grower = (s, x, y) => {
      const name = DW.SPECIES[sp(s)].name;
      return { sp: sp(s), x, y, face: 'down', wander: 1, talk: async () => {
        const f = st().flags, d = DW.Time.day(), key = 'maraicher_' + s;
        f.maraich = f.maraich || {};
        if (f.maraich[key] === d) { await say(DW.pick(['Les légumes poussent... Reviens demain pour la prochaine récolte !', 'Il faut arroser, désherber, arroser encore... Un vrai travail de Digimon !']), name); return; }
        f.maraich[key] = d;
        const id = DW.pick(VEG), extra = DW.giveItem(id, 1); DW.Audio.sfx('buy');
        await say(`Tiens, c'est la récolte du jour : ${DW.ITEMS[id].name} ! Tout frais du potager.${DW.extraMsg(extra)}`, name);
      } };
    };
    const beds = list => list.map(([x, y], i) => ({ kind: 'vegpatch', v: i % 2, x, y, w: 3, h: 2, walk: true }));
    // les Digimon de la DigiFerme se promènent entre les plates-bandes
    const farm = spots => (st().box || []).slice(0, spots.length).map((d, i) => ({ sp: d.sp, x: spots[i][0], y: spots[i][1], face: i % 2 ? 'left' : 'right', wander: 1, talk: () => say(`${d.name} se repose tranquillement à la DigiFerme. Il a l'air heureux.`) }));
    Grow.set('serre_in', [
      { min: 5, name: 'Grande serre de Yokomon', w: 22, h: 9,
        objects: [{ kind: 'counter', v: 2, x: 9, y: 4, w: 4, h: 1 }, ...beds([[2, 7], [7, 7], [14, 7], [18, 7]]),
          { kind: 'pots', x: 1, y: 3, w: 2, h: 1 }, { kind: 'pots', x: 19, y: 3, w: 2, h: 1 }, { kind: 'bigplant', x: 4, y: 3, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 17, y: 3, w: 1, h: 1, small: true },
          ...[6, 14].map(x => ({ kind: 'window', v: 0, x, y: 1, w: 2, h: 2, back: true, oy: -6 }))],
        decor: m => { for (let x = 9; x < 13; x++) m.signs[`${x},4`] = svc; },
        npcs: () => [{ sp: 'yokomon', x: 10, y: 3, face: 'left', talk: svc }, grower('palmon', 4, 10), grower('tanemon', 16, 10), ...farm([[6, 6], [12, 9], [17, 6], [9, 11]])] },
      { min: 8, name: 'Jardins maraîchers de Yokomon', w: 30, h: 12,
        objects: [{ kind: 'counter', v: 2, x: 13, y: 4, w: 4, h: 1 }, ...beds([[2, 7], [7, 7], [19, 7], [24, 7], [2, 11], [7, 11], [19, 11], [24, 11]]),
          ...[1, 4, 25, 27].map(x => ({ kind: 'pots', x, y: 3, w: 2, h: 1 })), ...[9, 20].map(x => ({ kind: 'bigplant', x, y: 3, w: 1, h: 1, small: true })),
          ...[6, 14, 22].map(x => ({ kind: 'window', v: 0, x, y: 1, w: 2, h: 2, back: true, oy: -6 })), { kind: 'plant', v: 0, x: 28, y: 13, w: 1, h: 1, small: true }],
        decor: m => { for (let x = 13; x < 17; x++) m.signs[`${x},4`] = svc; },
        // (des Digimon plantes qui existent dans le jeu, DW.SPECIES : avant, Lalamon et Floramon, absents, devenaient des Yokomon)
        npcs: () => [{ sp: 'yokomon', x: 14, y: 3, face: 'left', talk: svc }, grower('palmon', 5, 9), grower('tanemon', 22, 9), grower('togemon', 5, 13), grower('yuramon', 22, 13), ...farm([[11, 7], [17, 7], [11, 11], [17, 11], [14, 13], [6, 6]])] },
    ]);
  }
})();
;

// ===== js/maps/champs.js
'use strict';
// =====================================================================
//  QUARTIER DES CHAMPS — au sud-ouest de la Ville des Fichiers
//  Champs cultivés, moulin, verger, étang avec cascade et rondins vers l'îlot.
//  Dès le début : le DigiChamp de Tanemon (2 parcelles de Digiviande, 3 Viandes par jour).
//  Habitants (cachés tant qu'ils ne sont pas venus) : Palmon (grange, tout le quartier cultivé), Gomamon (ponton).
// =====================================================================
(function () {
  const { say, st, paint, zoomMap } = DW.MapKit;
  const MAPS = DW.MAPS;
  const T = () => DW.Town;
  const BARN = { x: 8, y: 6, w: 5, h: 3 };
  const FIELDS = [[4, 12], [8, 12], [12, 12], [16, 12], [4, 16], [8, 16], [12, 16], [16, 16]];
  const MEAT = 2; // les 2 premières parcelles : la Digiviande de Tanemon
  const today = () => Math.floor(st().clock / 1440);
  // cultures de Palmon (parcelles 3 à 8) et vergers : une cueillette par plant et par jour, 4 au plus par jour
  const CROPS = [[0, 'Carottes', 'super_carotte'], [1, 'Choux', 'super_legume'], [2, 'Citrouilles', 'melon'], [4, 'Maïs', 'radis'], [5, 'Tournesols', 'noix_douce'], [6, 'Tomates', 'baie_rouge']];
  const ORCHARD = [[4, 22, 0], [7, 23, 1], [10, 22, 2], [13, 23, 0], [16, 22, 1]];
  const FRUIT = [['Pommier', 'baie_rouge'], ['Oranger', 'orange_bana'], ['Pommier bleu', 'pomme_bleue']];
  const PICKS = 4;

  function build() {
    const m = MAPS.champs, has = id => T().has(id);
    const ripe = st().flags.meat !== today();
    const version = ['palmon', 'gomamon', 'yokomon'].map(id => (has(id) ? 1 : 0)).join('') + (ripe ? 'm' : '-') + T().level();
    if (m.version === version && m.rows) return;
    m.version = version;
    const farm = has('palmon');
    m.rows = paint(40, 28, '#', g => {
      g.rect(2, 2, 36, 23, '.');
      for (let x = 1; x < 39; x++) { g.set(x, 1, 'T'); g.set(x, 25, 'T'); }
      for (let y = 1; y < 26; y++) { g.set(1, y, 'T'); g.set(38, y, 'T'); }
      // falaise et cascade au nord-est, étang
      g.rect(25, 4, 13, 2, 'C');
      for (let x = 25; x < 38; x++) if (x % 3 !== 1) g.set(x, 2 + (x % 2), 'T');
      for (let y = 6; y < 23; y++) for (let x = 22; x < 38; x++) if (Math.hypot((x - 30.5) / 6.6, (y - 13.5) / 7) < 1) g.set(x, y, '~');
      for (const [x, y] of [[26, 9], [34, 18], [27, 19]]) if (g.get(x, y) === '~') g.set(x, y, 'w');
      g.rect(30, 6, 2, 2, '~');
      // îlot et rondins depuis la rive ouest
      for (let y = 12; y <= 15; y++) for (let x = 29; x <= 32; x++) if (Math.hypot(x - 30.5, (y - 13.5) * 1.2) < 2) g.set(x, y, '.');
      for (let x = 22; x < 30; x++) if (g.get(x, 13) === '~' || g.get(x, 13) === 'w') g.set(x, 13, '5');
      g.set(31, 13, 'i'); g.set(30, 14, 'f');
      // ponton de Gomamon (côté sud)
      if (has('gomamon')) for (let y = 16; y < 23; y++) for (const x of [29, 30]) if (g.get(x, y) === '~' || g.get(x, y) === 'w') g.set(x, y, '_');
      // chemin depuis la ville et allées des champs
      g.rect(5, 0, 2, 5, '='); g.rect(5, 4, 17, 2, '='); g.rect(20, 5, 2, 17, '='); g.rect(3, 10, 18, 1, '='); g.rect(3, 20, 18, 1, '=');
      g.rect(20, 21, 9, 1, '=');
      // champs (terre labourée sous les potagers)
      for (const [x, y] of FIELDS) g.rect(x, y, 3, 2, '=');
      // verger et décor
      for (const [x, y] of [[24, 23], [36, 23], [2, 7], [36, 7]]) g.set(x, y, 'T');
      g.scatter(farm ? 'f' : 'j', 2, 2, 20, 23, farm ? 20 : 40, 61, ['.']);
      if (farm) g.set(3, 8, 'a');   // (plus de bottes de foin : le joueur les trouve laides)
      else { g.scatter('r', 3, 6, 16, 3, 2, 62, ['.']); }
      // grange de Palmon : terrain vague tant qu'il n'est pas venu
      g.rect(BARN.x, BARN.y, BARN.w, BARN.h, '.');
      if (!farm) g.scatter('j', BARN.x, BARN.y, BARN.w, BARN.h, 8, 63, ['.']);
      g.rect(16, 6, 3, 2, '.');
      g.set(7, 2, 'S'); g.set(24, 13, '.'); g.set(2, 11, 'S');
      // décor numérique : tuyau d'irrigation, antenne près du moulin, panneau de circuit dans le verger
      g.set(23, 10, '$'); g.set(19, 7, '!'); g.set(18, 23, '?');
      g.rect(3, 7, 2, 2, '.');
      // décor de ferme : épouvantail, foin, brouette, ruches, étal, serre (cases dégagées)
      for (const [x, y] of [...ORCHARD, [15, 14], [19, 14], [19, 15], [11, 18], [8, 24], [11, 24], [3, 3], [4, 3], [31, 23], [32, 23], [33, 23], [34, 23]]) g.set(x, y, '.');
      // sorties : ouest vers le Marais des Geko, sud vers le Tunnel Foreur
      g.rect(0, 19, 4, 3, '='); g.rect(20, 22, 3, 6, '=');
    });
    m.objects = [
      { kind: 'windmill', v: farm ? 1 : 0, x: 16, y: 6, w: 3, h: 2 },
      { kind: 'waterfall', x: 30, y: 4, w: 2, h: 2, oy: 8 },
      ...FIELDS.map(([x, y], i) => (i < MEAT ? { kind: 'meatpatch', v: ripe ? 1 : 0, x, y, w: 3, h: 2 } : farm ? { kind: 'cropbed', v: CROPS[i - MEAT][0], x, y, w: 3, h: 2 } : { kind: 'vegpatch', v: 0, x, y, w: 3, h: 2 })),
      ...ORCHARD.map(([x, y, v]) => ({ kind: 'fruittree', v, x, y, w: 2, h: 1 })),
      { kind: 'scarecrow', x: 15, y: 14, w: 1, h: 1, small: true },
      { kind: 'wheelbarrow', x: 11, y: 18, w: 1, h: 1, small: true },
      { kind: 'beehive', x: 8, y: 24, w: 1, h: 1, small: true }, { kind: 'beehive', x: 11, y: 24, w: 1, h: 1, small: true },
      { kind: 'producestand', x: 3, y: 3, w: 2, h: 1 },
      { kind: 'fence', v: 4, x: 22, y: 7, w: 4, h: 1 },
      // DigiChamp de Tanemon : cabane à outils et clôture
      { kind: 'shed', x: 3, y: 7, w: 2, h: 2 },
      { kind: 'fence', v: 9, x: 3, y: 11, w: 9, h: 1, oy: 4 },
    ];
    m.doors = farm ? [{ x: BARN.x + 2, y: BARN.y + BARN.h - 1, w: 1, dir: 'up', to: 'grange_in', tx: 9, ty: 13 }] : [];
    if (farm) m.objects.push({ kind: 'greenhouse', x: 31, y: 23, w: 4, h: 1 });
    if (farm) m.objects.push({ kind: 'barn', ...BARN }, { kind: 'laundry', x: 22, y: 9, w: 3, h: 1 }, { kind: 'hangsign', v: 3, x: 13, y: 8, w: 1, h: 1, small: true });
    if (has('gomamon')) m.objects.push({ kind: 'fishing', x: 29, y: 16, w: 1, h: 1, small: true });
    m.npcs = [{ sp: 'tanemon', x: 7, y: 14, face: 'left', wander: 1, talk: tanemonTalk }];
    if (farm) m.npcs.push({ sp: 'palmon', x: 11, y: 9, face: 'left', wander: 2, talk: palmonTalk });
    if (has('gomamon')) m.npcs.push({ sp: 'gomamon', x: 30, y: 16, face: 'right', talk: gomamonTalk });
    if (DW.Collab) DW.Collab.place(m, { champs: [30, 23] });   // (Serre des Champs : Yokomon aide Palmon, devant la serre)
    m.signs = {
      '7,2': () => say(`Quartier des Champs — Ville des Fichiers (${T().label()}).  Nord : la place.`),
      '31,13': "Une petite lanterne de pierre sur l'îlot. Il règne ici un calme étonnant.",
      '2,11': 'DigiChamp de Tanemon — Digiviande fraîche tous les jours ! (Demande à Tanemon.)',
      '3,8': "La cabane à outils de Tanemon : arrosoir, fourche et graines de Digiviande.", '4,8': "La cabane à outils de Tanemon : arrosoir, fourche et graines de Digiviande.",
    };
    FIELDS.forEach(([x, y], k) => { for (let i = 0; i < 3; i++) m.signs[`${x + i},${y + 1}`] = () => (k >= MEAT && farm ? pick('c' + k, CROPS[k - MEAT][1], CROPS[k - MEAT][2]) : fieldLook(k < MEAT)); });
    ORCHARD.forEach(([x, y, v], k) => { for (let i = 0; i < 2; i++) m.signs[`${x + i},${y}`] = () => pick('t' + k, FRUIT[v][0], FRUIT[v][1], true); });
    Object.assign(m.signs, {
      '15,14': "Un épouvantail coiffé d'un chapeau de paille. Les Digimon oiseaux le regardent de travers...",
      '19,14': 'Des bottes de foin bien sèches. Ça sent bon l\'été.', '19,15': 'Des bottes de foin bien sèches. Ça sent bon l\'été.',
      '11,18': 'Une brouette pleine de légumes frais, prête pour le marché.',
      '8,24': () => hive(), '11,24': () => hive(),
      '3,3': () => stand(), '4,3': () => stand(),
    });
    if (farm) for (let i = 0; i < 4; i++) m.signs[`${31 + i},23`] = 'La serre de Palmon : tomates, poivrons et fleurs de toutes les couleurs poussent même en hiver.';
    zoomMap(m, 'champs');   // plan agrandi ×2 (maps/common.js)
    if (DW.Story.placeKiosks) DW.Story.placeKiosks(m, 'champs');   // stands des recrues (story.js)
    DW.World.unprepare(m); delete m.w;
  }
  // cueillette : une par plant et par jour, PICKS au plus par jour
  async function pick(key, name, item, tree) {
    const s = st(), d = today();
    if (!s.harvest || s.harvest.day !== d) s.harvest = { day: d, got: [] };
    if (s.harvest.got.includes(key)) { await say(tree ? `${name} : tu as déjà cueilli ses fruits aujourd'hui.` : `${name} : déjà récoltés aujourd'hui. Ça repousse pour demain !`); return; }
    if (s.harvest.got.length >= PICKS) { await say('Tu as les bras chargés ! Reviens demain pour cueillir encore.'); return; }
    if ((await DW.ask(tree ? `${name} chargé de fruits. Cueillir ?` : `${name} bien mûrs. Récolter ?`, ['Oui', 'Non'])) !== 0) return;
    s.harvest.got.push(key);
    const extra = DW.giveItem(item); DW.Audio.sfx('buy');
    await say(`Tu récoltes : ${DW.ITEMS[item].name} !${DW.extraMsg(extra)}`);
  }
  async function hive() {
    if (!T().has('palmon')) { await say('Des ruches bourdonnantes. Mieux vaut ne pas les déranger...'); return; }
    await pick('ruche', 'Les ruches', 'noix_douce');
  }
  async function stand() {
    if (!T().has('palmon')) { await say("Un étal vide. Les produits de la ferme y seront vendus quand le quartier sera cultivé."); return; }
    await say('L\'étal de la ferme : fruits et légumes du Quartier des Champs !', 'Palmon');
    await DW.Game.push(new DW.ShopScene('ferme'));
  }
  async function fieldLook(meat) {
    if (meat) { await say(st().flags.meat === today() ? 'Les plants de Digiviande repoussent... La prochaine récolte sera prête demain.' : 'De belles Digiviandes bien mûres pendent aux plants ! Tanemon les récolte pour toi.'); return; }
    if (T().has('palmon')) await say('Les légumes poussent bien ! Palmon s\'en occupe avec soin.');
    else await say('Un champ abandonné, envahi par les mauvaises herbes... Il faudrait quelqu\'un pour le cultiver.');
  }
  // DigiChamp de Tanemon : 3 Viandes une fois par jour (les plants repoussent pour le lendemain)
  async function tanemonTalk(ow) {
    const s = st();
    if (!s.flags.tanemon) {
      s.flags.tanemon = true;
      await say("B-bonjour... Je suis Tanemon. Je m'occupe du DigiChamp : ici, la Digiviande pousse sur les plantes !", 'Tanemon');
      await say("Quand les habitants sont partis, moi, je suis resté pour m'occuper des plants. Je peux nourrir ton partenaire !", 'Tanemon');
    }
    if (s.flags.meat === today()) { await say('Les plants repoussent... Reviens demain pour la prochaine récolte !', 'Tanemon'); return; }
    await say('Les Digiviandes sont mûres ! Attends, je les cueille pour toi...', 'Tanemon');
    s.flags.meat = today();
    await DW.fade(1, 0.3);
    ow.load('champs', ow.p.x, ow.p.y, ow.p.dir);   // les plants récoltés repoussent à l'écran
    await DW.fade(0, 0.3);
    const extra = DW.giveItem('viande', 3);
    DW.Audio.sfx('buy');
    await say(`Tu reçois 3 Viandes !${DW.extraMsg(extra)}`);
    await say('Donne-en à ton partenaire quand il a faim (menu ENTRÉE → SAC).', 'Tanemon');
    // (la première récolte : sa carte pour l'album du chapitre 1, si tu ne l'as pas déjà)
    if (DW.Cards && DW.Cards.give('tanemon')) await say('Tanemon te donne aussi une carte à son image pour ton album ! (Album)');
    DW.autosave();
  }
  // récolte de Palmon : une fois par jour de jeu
  async function palmonTalk() {
    const s = st(), day = Math.floor(s.clock / 1440);
    await say('Bonjour ! Les champs n\'ont jamais été aussi beaux !', 'Palmon');
    if (s.flags.harvest === day) { await say('Reviens demain pour la prochaine récolte !', 'Palmon'); return; }
    s.flags.harvest = day;
    const dry = DW.Time.drought(), serre = DW.Collab && DW.Collab.on('serre');
    const n = (dry ? 1 : 2 + (Math.random() < 0.4 ? 1 : 0)) * (serre ? 2 : 1), sup = !dry && Math.random() < 0.25;
    if (serre) await say('Avec Yokomon, la serre déborde : récolte doublée !', 'Palmon');
    if (dry) await say('La sécheresse a tout desséché... La récolte est maigre cette fois.', 'Palmon');
    const extra = DW.giveItem('viande', n) + (sup ? DW.giveItem('super_viande', 1) : 0);
    DW.Audio.sfx('buy');
    await say(`Voici la récolte du jour : ${n} Viandes${sup ? ` et une ${DW.ITEMS.super_viande.name}` : ''} !${DW.extraMsg(extra)}`, 'Palmon');
  }
  // pêche : une fois par heure de jeu
  async function gomamonTalk() {
    const s = st(), hr = Math.floor(s.clock / 60);
    // la première fois, Gomamon offre sa canne à pêche (game/peche.js : pêcher partout où il y a de l'eau)
    if (!(s.bag || {}).canne && !s.flags.canne) {
      await say("Hé ! Avant tout... tiens, prends ça ! C'est ma vieille canne à pêche. Moi, je pêche avec les nageoires !", 'Gomamon');
      s.flags.canne = true; DW.giveItem('canne', 1); DW.Audio.sfx('fanfare');
      await say("Tu reçois la Canne à pêche ! Face à l'eau (rivière, lac, mer), choisis « Pêcher ».");
      await say("Chaque eau a ses poissons : la mer, les rivières, les lacs... Et les plus gros sortent la nuit ou au petit matin !", 'Gomamon');
    }
    await say('Hé ! Tu veux pêcher avec moi ?', 'Gomamon');
    if (s.flags.fish === hr) { await say('Les poissons se méfient... Attends un peu !', 'Gomamon'); return; }
    if ((await DW.ask('Lancer la ligne ?')) !== 0) return;
    s.flags.fish = hr;
    await DW.fade(0.4, 0.2); DW.Audio.sfx('water'); await DW.wait(0.8); await DW.fade(0, 0.2);
    const r = Math.random();
    const got = r < 0.45 ? 'viande' : r < 0.6 ? 'super_viande' : r < 0.8 ? 'remede' : null;
    if (!got) { await say('Rien cette fois... Les poissons sont malins !', 'Gomamon'); return; }
    const extra = DW.giveItem(got); DW.Audio.sfx('buy');
    await say(`Ça mord ! Tu obtiens : ${DW.ITEMS[got].name} !${DW.extraMsg(extra)}`);
  }

  MAPS.champs = {
    name: 'Quartier des Champs', music: 'village', bg: 'foret', ambient: 'town', theme: 'farm', climate: 'village', region: 'village',
    build,
    rows: null, objects: [], npcs: [],
    warps: [{ x: 5, y: 0, w: 2, h: 1, dir: 'up', to: 'village', tx: 5, ty: 29 }],
    signs: {},
  };
  build();
  // intérieur de la grange (Palmon) : bottes de foin, outils, et le fenil à l'étage
  {
    const P = DW.Palais, wood = { base: '#a8483a', alt: '#8a3a2e', pattern: 'plain', wood: '#5a2a20' };
    P.room('grange_in', 'village', { name: 'Grange de Palmon', w: 20, h: 15, floor: { type: 'herring', cols: ['#c8a060', '#a8804a', '#6a4e2a'] }, wall: wood,
      objects: [{ kind: 'sacks', x: 2, y: 4, w: 2, h: 1 }, { kind: 'sacks', x: 2, y: 6, w: 2, h: 1 }, { kind: 'crates', x: 16, y: 4, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 17, y: 4, w: 1, h: 1, small: true },
        { kind: 'vegpatch', v: 1, x: 6, y: 8, w: 3, h: 2, walk: true }, { kind: 'shelf', x: 6, y: 1, w: 2, h: 1, back: true }, { kind: 'pots', x: 12, y: 9, w: 2, h: 1 }] });
    P.room('grange_fenil', 'village', { name: 'Grange de Palmon — Fenil', w: 18, h: 13, dark: { d: 0.3, col: '#3a2a18' }, floor: { type: 'herring', cols: ['#d8b870', '#b8984e', '#7a6030'] }, wall: wood,
      objects: [{ kind: 'sacks', x: 2, y: 4, w: 2, h: 1 }, { kind: 'sacks', x: 13, y: 5, w: 2, h: 1 }, { kind: 'sacks', x: 5, y: 8, w: 2, h: 1 }, { kind: 'teddy', x: 12, y: 8, w: 1, h: 1 }] });
    P.stairs('grange_in', 15, 'grange_fenil', 8);
    const g = MAPS.grange_in, x = 9, y = g.rows.length - 1;
    g.rows[y] = g.rows[y].slice(0, x) + '11' + g.rows[y].slice(x + 2);
    g.warps.push({ x, y, w: 2, h: 1, dir: 'down', to: 'champs', tx: BARN.x + 2, ty: BARN.y + BARN.h });
    g.npcs.push({ sp: 'tanemon', x: 12, y: 5, face: 'left', wander: 1, talk: () => say("Ici, on range les récoltes de Palmon. Là-haut, au fenil, il fait tout chaud dans le foin !", 'Tanemon') });
    P.treasure('grange_fenil', 'fenil', null, [['super_carotte', 2], ['radis', 1]], 15, 8);
  }
})();
;

// ===== js/maps/gym.js
'use strict';
// =====================================================================
//  TERRAIN D'ENTRAÎNEMENT — juste au sud de la Ville des Fichiers
//  Un centre sportif délimité, une aire de couleur par stat (sol peint : paintGround) :
//    aire rouge de force (ouest) : W rocher (PV), E mannequin (Attaque), traîneau (PV), sac de frappe (Attaque)
//    piste d'athlétisme (centre) : N haies (Vitesse), pneus au nord de la piste (Vitesse), pelouse au milieu
//    tatami bleu de garde (est)  : A mur de pierre (Défense), râtelier à boucliers, mannequin de bois
//    dalle violette (sud-ouest)  : Ψ cristal de données (PM)
//    jardin zen (sud-est) ; l'Intelligence s'apprend à l'école (maps/classe.js), les résistances au Gymnase (maps/gymnase.js)
//  Chaque poste a son panneau à pictogramme juste à sa gauche. Appareils : images du joueur (dossier SPORT : gfx/textures.js).
//  + allées pavées, torches, toilettes (y), panneau
// =====================================================================
(function () {
  const { say, paint, st } = DW.MapKit;
  const TRACK = { x: 16, y: 12.5, rx: 6.2, ry: 3.9 };

  const rows = paint(32, 22, '#', g => {
    g.rect(2, 2, 28, 18, '.');
    for (let x = 2; x < 30; x++) { g.set(x, 2, 'T'); g.set(x, 19, 'T'); }
    for (let y = 2; y < 20; y++) { g.set(2, y, 'T'); g.set(29, y, 'T'); }
    g.set(3, 3, 'T'); g.set(28, 3, 'T'); g.set(3, 18, 'T'); g.set(28, 18, 'T');
    // allée d'entrée (le reste du sol est peint : paintGround plus bas)
    g.rect(15, 0, 2, 3, '=');
    // jardin zen (sud-est) : sable ratissé
    g.rect(23, 14, 6, 4, 's');
    // massifs de fleurs le long des bords seulement (rien sur la piste ni sur les aires)
    g.scatter('f', 4, 3, 8, 1, 4, 41, ['.']); g.scatter('f', 20, 3, 8, 1, 4, 42, ['.']);
    for (const [x, y] of [[4, 4], [27, 4], [4, 17], [13, 18], [19, 18]]) g.set(x, y, 'b');
    for (const x of [6, 25]) g.set(x, 6, 'V');
    g.set(12, 4, 'i'); g.set(19, 4, 'i');
    // antennes de données et tuyau (décor numérique)
    g.set(4, 6, '!'); g.set(27, 6, '!'); g.set(27, 17, '$');
    // postes d'entraînement
    g.set(7, 9, 'W'); g.set(7, 11, 'E');
    g.set(10, 12, 'N'); g.set(22, 12, 'N');
    g.set(27, 9, 'A');
    // (l'Intelligence s'entraîne désormais dans la salle de classe : maps/classe.js)
    g.set(10, 16, 'Ψ');   // cristal de données (PM)
    // toilettes (hors de l'ombre des grands arbres du bas, qui les cachaient) et panneau
    g.set(4, 14, 'y'); g.set(14, 6, 'S');
  });

  // ------------------------------------------------------------ sol du centre sportif, peint au pixel
  // (coordonnées en cases du plan d'origine ; la carte est agrandie ×2 : 1 case = 32 px)
  function paintGround(c) {
    const u = 32, X = v => v * u, H = DW.Art.hash;
    const grain = (x0, y0, w, h, col, n, seed) => { c.fillStyle = col; for (let i = 0; i < n; i++) c.fillRect(Math.floor(x0 + H(i, 1, seed) * w), Math.floor(y0 + H(i, 2, seed) * h), 1, 1); };
    const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    // 1. allées pavées : entrée → promenade nord → chaque aire, et promenade sud
    const walk = pts => {
      for (const [w, col] of [[30, '#8a8070'], [24, '#cfc4aa']]) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), X(y)) : c.moveTo(X(x), X(y)))); c.stroke(); }
    };
    walk([[16, 0], [16, 9]]); walk([[5.5, 6.5], [26.5, 6.5]]); walk([[5.5, 6.5], [5.5, 8.5]]); walk([[26.5, 6.5], [26.5, 7.5]]);
    walk([[23, 5], [23, 6.5]]); walk([[9, 5], [9, 6.5]]);
    walk([[16, 16.5], [16, 17.2]]); walk([[11.5, 17.2], [23, 17.2]]);
    // joints des pavés
    c.fillStyle = 'rgba(120,108,88,0.55)';
    for (let y = 0; y < X(22); y += 8) for (let x = (y / 8 % 2) * 5; x < X(32); x += 10) c.fillRect(x, y, 1, 1);
    // 2. aire de FORCE (ouest) : sol en caoutchouc rouge brique, liseré blanc
    const pad = (x, y, w, h, a, b, seed) => {
      rr(X(x) - 3, X(y) - 3, X(w) + 6, X(h) + 6, 10); c.fillStyle = '#f4eee0'; c.fill();
      rr(X(x), X(y), X(w), X(h), 8); c.fillStyle = a; c.fill();
      grain(X(x), X(y), X(w), X(h), b, X(w) * X(h) / 14, seed);
    };
    pad(3.3, 8, 5, 8.3, '#b85a36', '#a04c2c', 501);
    // 3. aire de GARDE (est) : tatami bleu
    pad(24.4, 7.4, 4.3, 5, '#3a64b8', '#2e529a', 502);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1;
    for (let y = X(7.4) + 16; y < X(12.4); y += 16) { c.beginPath(); c.moveTo(X(24.4) + 2, y); c.lineTo(X(28.7) - 2, y); c.stroke(); }
    // 4. plateforme du CRISTAL (sud-ouest) : dalle violette et cercle d'énergie
    const cx0 = X(10.5), cy0 = X(15.9);
    c.fillStyle = '#f4eee0'; c.beginPath(); c.ellipse(cx0, cy0, 46, 30, 0, 0, 7); c.fill();
    c.fillStyle = '#6a46b0'; c.beginPath(); c.ellipse(cx0, cy0, 42, 27, 0, 0, 7); c.fill();
    c.strokeStyle = '#b89aff'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx0, cy0, 32, 20, 0, 0, 7); c.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.moveTo(cx0 + Math.cos(a) * 32, cy0 + Math.sin(a) * 20); c.lineTo(cx0 + Math.cos(a) * 40, cy0 + Math.sin(a) * 25); c.stroke(); }
    // 5. jardin zen : margelle de pierre autour du sable
    c.strokeStyle = '#8a8478'; c.lineWidth = 4; c.strokeRect(X(23) - 2, X(14) - 2, X(6) + 4, X(4) + 4);
    // 6. PISTE D'ATHLÉTISME : anneau en tartan, couloirs blancs, pelouse rayée au centre
    const tx = X(TRACK.x), ty = X(TRACK.y), RX = X(TRACK.rx), RY = X(TRACK.ry), IN = 0.62;
    const ell = (k, fill) => { c.beginPath(); c.ellipse(tx, ty, RX * k, RY * k, 0, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } };
    ell(1.04, '#f4eee0'); ell(1, '#c4502e');
    c.save(); ell(1); c.clip(); grain(tx - RX, ty - RY, RX * 2, RY * 2, '#a8402a', RX * RY / 3, 503); grain(tx - RX, ty - RY, RX * 2, RY * 2, '#d8683e', RX * RY / 5, 504); c.restore();
    // pelouse : bandes tondues
    c.save(); ell(IN); c.clip();
    for (let x = tx - RX; x < tx + RX; x += 16) { c.fillStyle = Math.floor((x - tx + RX) / 16) % 2 ? '#5aa444' : '#4c963a'; c.fillRect(x, ty - RY, 16, RY * 2); }
    c.strokeStyle = '#f4f4ec'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(tx, ty - RY * IN); c.lineTo(tx, ty + RY * IN); c.stroke();
    c.beginPath(); c.ellipse(tx, ty, 26, 18, 0, 0, 7); c.stroke();
    c.fillStyle = '#f4f4ec'; c.fillRect(tx - 2, ty - 2, 4, 4);
    c.restore();
    // lignes des couloirs
    c.strokeStyle = '#f4f4ec';
    for (const k of [IN, 0.715, 0.81, 0.905, 1]) { c.lineWidth = k === IN || k === 1 ? 2 : 1.4; ell(k); c.stroke(); }
    // ligne d'arrivée en damier (bas de l'anneau)
    for (let y = ty + RY * IN; y < ty + RY - 1; y += 4) for (let i = 0; i < 3; i++) { c.fillStyle = (Math.floor((y - ty) / 4) + i) % 2 ? '#1a1a1a' : '#ffffff'; c.fillRect(tx + 18 + i * 4, y, 4, 4); }
    // numéros de couloir peints (petits traits)
    c.fillStyle = '#ffffff';
    [0.667, 0.76, 0.857, 0.952].forEach((k, n) => { for (let j = 0; j <= n; j++) c.fillRect(tx - 14 + j * 4, ty + RY * k - 2, 2, 4); });
  }


  // ------------------------------------------------------------ Tai au Terrain d'entraînement
  const today = () => DW.Time.day();
  DW.TaiBuddy = {
    here: s => s.hero !== 'tai' && !!(s.kids || {}).tai && today() % 2 === 0 && DW.Time.hour() >= 9 && DW.Time.hour() < 18,
    async talk() {
      const s = st(), m = s.party.find(d => d.hp > 0), f = s.flags;
      const r = await DW.ask("Salut ! On s'entraîne ensemble, ou tu veux un petit match amical contre Greymon ?", ["S'entraîner à deux", 'Match amical', 'Plus tard'], 'Tai');
      if (r === 0) {
        if (f.taiTrain === today()) { await say("On a déjà bossé aujourd'hui ! Repose-toi un peu, on remet ça demain.", 'Tai'); return; }
        if (!m) { await say("Ton partenaire n'est pas en état... Soigne-le d'abord !", 'Tai'); return; }
        f.taiTrain = today(); m.boost = (m.boost || 0) + 1; m.addHappy(3); DW.Audio.sfx('super');
        await say(`Agumon et ${m.name} s'entraînent côte à côte. Rien de tel qu'un partenaire pour se motiver ! (prochaine séance +1 point, bonheur +3)`, 'Tai');
        return;
      }
      if (r !== 1) { await say("D'accord ! Je suis là un jour sur deux, en journée.", 'Tai'); return; }
      if (f.taiMatch === today()) { await say("Greymon est fatigué pour aujourd'hui. Demain, revanche !", 'Tai'); return; }
      if (!m) { await say("Ton partenaire n'est pas en état... Soigne-le d'abord !", 'Tai'); return; }
      f.taiMatch = today();
      // match amical : Greymon à ton niveau, sans K.O. qui compte, tout le monde est soigné après
      const res = await DW.ow.battle({ enemy: new DW.Digimon('greymon', Math.max(15, m.level)), boss: true, canLose: true, intro: 'Match amical contre le Greymon de Tai !' });
      s.party.forEach(d => d.heal());
      await say(res === 'win' ? "Waouh ! Tu nous as battus à la régulière ! Greymon va vouloir sa revanche..." : "Pas mal du tout ! Continue à t'entraîner, et tu nous battras.", 'Tai');
    },
  };

  DW.MAPS.gym = {
    name: "Terrain d'entraînement", music: 'village', bg: 'foret', ambient: 'town', theme: 'town', climate: 'village', region: 'village',
    rows,
    // Tai (une fois délivré) vient s'entraîner ici un jour sur deux, en journée : entraînement à deux, ou match amical
    npcs: [
      { hero: 'tai', x: 16, y: 10, face: 'down', cond: s => DW.TaiBuddy && DW.TaiBuddy.here(s), talk: () => DW.TaiBuddy.talk() },
      { sp: 'agumon', x: 17, y: 11, face: 'left', wander: 1, cond: s => DW.TaiBuddy && DW.TaiBuddy.here(s), talk: () => say("On s'entraîne ensemble ? Je suis en pleine forme !", 'Agumon') },
    ],
    paintGround,
    objects: [
      // marquages au sol (on marche dessus)
      { kind: 'zenrakes', x: 23, y: 14, w: 6, h: 4, walk: true },
      // gradins, torches, râtelier à boucliers, rochers, bancs
      { kind: 'gymnase', x: 7, y: 3, w: 4, h: 2 }, { kind: 'ecole', x: 21, y: 3, w: 4, h: 2 },   // gymnase (résistances, après le chapitre 1) ; école : la salle de classe (Intelligence)
      { kind: 'torch', x: 13, y: 7, w: 1, h: 1, small: true }, { kind: 'torch', x: 18, y: 7, w: 1, h: 1, small: true },
      // appareils-postes (DW.Training.POSTES) et décor du tatami
      { kind: 'traineau', x: 7, y: 13, w: 1, h: 1, small: true }, { kind: 'punchbag', x: 7, y: 15, w: 1, h: 1, small: true },
      { kind: 'pneus', x: 20, y: 8, w: 1, h: 1, small: true },
      { kind: 'shieldrack', x: 25, y: 11, w: 1, h: 1, small: true }, { kind: 'mannequinbois', x: 27, y: 11, w: 1, h: 1, small: true },
      // panneaux à pictogramme, chacun juste à gauche de son poste (w: 2 : solide sur toute sa largeur ; eq : son appareil)
      { kind: 'stationsign', v: 0, x: 4, y: 9, w: 2, h: 1, small: true }, { kind: 'stationsign', v: 1, x: 4, y: 11, w: 2, h: 1, small: true },
      { kind: 'stationsign', v: 0, eq: 'traineau', x: 4, y: 13, w: 2, h: 1, small: true }, { kind: 'stationsign', v: 6, eq: 'punchbag', x: 4, y: 15, w: 2, h: 1, small: true },
      { kind: 'stationsign', v: 3, x: 8, y: 12, w: 2, h: 1, small: true }, { kind: 'stationsign', v: 3, x: 23, y: 12, w: 2, h: 1, small: true },
      { kind: 'stationsign', v: 3, eq: 'pneus', x: 18, y: 8, w: 2, h: 1, small: true },
      { kind: 'stationsign', v: 2, x: 25, y: 9, w: 2, h: 1, small: true }, { kind: 'stationsign', v: 5, x: 8, y: 16, w: 2, h: 1, small: true },
      // jardin zen : lanterne, rochers, le gros rocher peint de signes rouges
      { kind: 'stonelantern', x: 26, y: 16, w: 1, h: 1, small: true }, { kind: 'kanjirock', x: 23, y: 16, w: 2, h: 1 },
      { kind: 'rock', v: 1, x: 25, y: 17, w: 1, h: 1, small: true }, { kind: 'rock', v: 0, x: 28, y: 15, w: 1, h: 1, small: true },
      { kind: 'bench', x: 12, y: 18, w: 1, h: 1, small: true }, { kind: 'bench', x: 19, y: 18, w: 1, h: 1, small: true },
      { kind: 'barrel', v: 0, x: 3, y: 16, w: 1, h: 1, small: true }, { kind: 'barrel', v: 1, x: 28, y: 12, w: 1, h: 1, small: true },
      { kind: 'bunting', v: 6, x: 13, y: 4, w: 6, h: 1, top: true, oy: -14 },
    ],
    warps: [{ x: 15, y: 0, w: 2, h: 1, dir: 'up', to: 'village', tx: 19, ty: 29 }],
    doors: [{ x: 22, y: 4, w: 2, dir: 'up', to: 'classe', tx: 7, ty: 10 },
      { x: 8, y: 4, w: 2, dir: 'up', to: 'gymnase', tx: 8, ty: 10, cond: () => !!(DW.Gymnase && DW.Gymnase.open()) }],
    signs: {
      '14,6': async () => {
        await say("TERRAIN D'ENTRAÎNEMENT — Ouest : rocher et traîneau (PV), mannequin et sac de frappe (Attaque).  Piste : haies et pneus (Vitesse).  Est : mur (Défense).  Cristal de données : énergie (PM).  École (nord-est) : Intelligence.  Gymnase (nord-ouest) : résistances aux éléments.");
        await say("Les COMBATS font monter le niveau, et le niveau fixe le POTENTIEL de ton Digimon (10 + 3 × niveau points par stat). Dé-digivoluer ton Digimon augmente son ABI : son potentiel grimpe encore !");
        await say("L'ENTRAÎNEMENT remplit ce potentiel. Ce sont les points d'entraînement qui permettent de digivoluer !");
        await say("Chaque poste a son exercice : marteler le mannequin, enchaîner les coups au sac de frappe, soulever le rocher et tirer le traîneau au bon moment, sauter la haie ou passer les pneus sur la marque, encaisser les pierres du mur, charger l'énergie du cristal. Le traîneau et les pneus font aussi travailler une autre stat (objectif « Statistique »). Parle au poste ou à son panneau (le pictogramme indique la stat) pour commencer. Plus ton Digimon est entraîné, plus c'est dur !");
      },
      // le gymnase : fermé pendant le chapitre 1 (on y entre par la porte quand il est ouvert)
      ...Object.fromEntries(['7,4', '8,4', '9,4', '10,4'].map(k => [k, () => say(DW.Gymnase && DW.Gymnase.open()
        ? "GYMNASE — Entraînement des résistances aux éléments, avec Leomon. Entre par la grande porte !"
        : "GYMNASE — « Fermé. Le coach a disparu dans les montagnes... Celui qui le ramènera pourra endurcir ses Digimon contre le feu, l'eau, la glace, le vent et la foudre ! »")])),
      '25,11': 'Un râtelier plein de boucliers cabossés. Parfait pour apprendre à encaisser.',
      '27,11': "Un mannequin de bois aux bras tendus : Leomon s'en sert pour apprendre à parer les coups.",
    },
  };
  DW.MapKit.zoomMap(DW.MAPS.gym, 'gym');   // plan agrandi ×2 (maps/common.js)
})();
;

// ===== js/maps/berceau.js
'use strict';
// =====================================================================
//  VILLAGE DES BÉBÉS — à l'est de la Prairie des Lucioles
//  (le Village Primaire de la saison 1). Penguinmon y veille sur les bébés.
//  Services de Penguinmon : un DigiŒuf par jour (on le fait éclore en le frottant),
//  RENAISSANCE d'un Digimon (il redevient le bébé de sa lignée en gardant ses
//  techniques, la moitié de son entraînement et des données innées renforcées), repos.
// =====================================================================
(function () {
  const { say, st, paint, healAll } = DW.MapKit;
  const Game = DW.Game;

  // ------------------------------------------------------------ plan (44 × 32)
  // Village Primaire de la saison 1 : clairière pastel entourée d'arbres-bonbons et d'une lisière de
  // nuages roses. Place ronde à mosaïque au centre, nurserie (berceaux) au nord-ouest, aire de jeux
  // (manège, nounours, chevaux à bascule) au nord-est, mare aux nénuphars au sud-est, maisonnettes
  // en coquille d'œuf, coussin-nid des DigiŒufs au sud, arche arc-en-ciel à la sortie nord.
  // Entrées inchangées : ouest (lignes 11-13, depuis la Prairie) et nord (colonnes 23-25, vers le Bois Brumeux).
  const W = 44, H = 32, Hh = DW.Art.hash;
  const EGG_X = i => 17 + i * 2, EGG_Y = 23;
  const rows = paint(W, H, '#', g => {
    // clairière aux bords arrondis (rectangle « bombé » + léger bruit)
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const dx = (x - 21.5) / 20.6, dy = (y - 15.5) / 14.6, n = (Hh(x, y, 401) - 0.5) * 0.12;
      if (dx ** 4 + dy ** 4 < 1 + n) g.set(x, y, 'v');
    }
    g.rect(0, 10, 3, 5, 'v'); g.rect(22, 0, 5, 3, 'v');
    // arbres-bonbons en bordure (avec des trouées sur la lisière de nuages)
    const edge = (x, y) => g.get(x, y) === 'v' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g.get(x + a, y + b) === '#');
    const ring = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (edge(x, y)) ring.push([x, y]);
    for (const [x, y] of ring) if (Hh(x, y, 402) < 0.62) g.set(x, y, 'h');
    // allées de sable clair (bords arrondis) : entrée ouest, sortie nord, vers le nid, la mare, l'aire de jeux et la nurserie
    g.rect(0, 11, 16, 3, 's'); g.rect(23, 0, 3, 11, 's');
    g.rect(21, 20, 3, 3, 's'); g.rect(27, 18, 5, 2, 's'); g.rect(28, 13, 5, 2, 's'); g.rect(32, 10, 2, 4, 's');
    g.rect(9, 9, 2, 2, 's'); g.rect(4, 7, 9, 1, 's');
    // bac à sable (sud-ouest)
    for (let y = 25; y < 30; y++) for (let x = 15; x < 22; x++) if (Math.hypot((x - 18) / 3.2, (y - 27.2) / 2.1) < 1) g.set(x, y, 's');
    // bosquets d'arbres-bonbons à l'intérieur du village
    for (const [x, y] of [[12, 15], [13, 16], [12, 17], [27, 27], [28, 28], [36, 18], [37, 17], [27, 3], [14, 20]]) if (g.get(x, y) === 'v') g.set(x, y, 'h');
    // pieds de l'arche arc-en-ciel (on passe dessous par l'allée)
    for (const [x, y] of [[22, 1], [22, 2], [26, 1], [26, 2]]) g.set(x, y, 'x');
    // nurserie : deux rangées de berceaux
    for (const x of [5, 7, 9, 11]) { g.set(x, 5, 'c'); g.set(x, 9, 'c'); }
    // mare des Pichimon (sud-est), avec nénuphars
    for (let y = 18; y < 29; y++) for (let x = 27; x < 42; x++) {
      const d = Math.hypot((x - 34) / 5.6, (y - 23.4) / 3.3);
      if (d < 1) g.set(x, y, Hh(x, y, 403) < 0.12 && d < 0.8 ? 'w' : '~');
    }
    // cubes-jouets éparpillés
    for (const [x, y] of [[14, 4], [27, 7], [12, 27], [38, 15], [16, 17], [29, 29]]) if (g.get(x, y) === 'v') g.set(x, y, 'B');
    // prairies d'herbes pastel et fleurs
    g.scatter(':', 2, 24, 12, 6, 34, 12, ['v']);
    g.scatter(':', 30, 16, 10, 2, 10, 13, ['v']);
    g.scatter(':', 13, 2, 8, 3, 10, 14, ['v']);
    g.scatter('q', 2, 2, 40, 28, 70, 11, ['v']);
    // panneau d'entrée
    g.set(3, 10, 'Q');
  });

  // ------------------------------------------------------------ services de Penguinmon
  async function eggService() {
    const s = st(), day = DW.Time.day();
    if (s.flags.eggDay === day) { await say("Tu as déjà pris un DigiŒuf aujourd'hui. Les autres ont besoin de couver encore un peu... Reviens demain !", 'Penguinmon'); return; }
    await say('Choisis un DigiŒuf. Chacun cache un bébé différent... Observe bien les motifs !', 'Penguinmon');
    const sp = await Game.push(new DW.EggScene());
    if (!sp) { await say("Prends ton temps. Les œufs ne s'envolent pas !", 'Penguinmon'); return; }
    s.flags.eggDay = day;
    await Game.push(new DW.HatchScene(sp));
    const m = new DW.Digimon(sp, 3); m.happy = 60;
    const where = DW.addDigimon(m);
    await say(where === 'box' ? `${m.name} a été envoyé à la DigiFerme : ton équipe est complète.` : `${m.name} rejoint ton équipe !`);
    await say('Prends bien soin de lui. Les bébés grandissent vite : deux victoires, et hop, ils digivoluent !', 'Penguinmon');
    DW.autosave();
  }
  async function rebirthService() {
    const s = st();
    await say("La renaissance... Ton Digimon redevient un œuf, puis un bébé. C'est le cycle de la vie des Digimon.", 'Penguinmon');
    await say("Il garde ses techniques, ses victoires et la moitié de son entraînement. Et ses données innées se renforcent à chaque renaissance !", 'Penguinmon');
    const idx = await Game.push(new DW.PartyScene({ mode: 'select', title: 'RENAISSANCE' }));
    if (idx == null || idx < 0) return;
    const m = s.party[idx], sp = DW.Life.babyOf(m);   // (le bébé qu'il a été : Greymon → Agumon → Koromon → Botamon)
    if (sp === m.sp) { await say(`${m.name} est déjà un bébé !`, 'Penguinmon'); return; }
    const r = await DW.ask(`${m.name} redeviendra un ${DW.SPECIES[sp].name}. D'accord ?`);
    if (r !== 0) { await say('Comme tu veux. Rien ne presse.', 'Penguinmon'); return; }
    await DW.fade(1, 0.5, '#ffffff');
    await DW.wait(0.3);
    const nm = DW.Life.reborn(m);
    DW.fade(0, 0.4);
    await Game.push(new DW.HatchScene(sp));
    s.party[idx] = nm; s.seen[sp] = s.owned[sp] = true;
    await say(`${m.name} est revenu au monde en ${DW.SPECIES[sp].name} ! Ses données innées se sont renforcées.`);
    DW.autosave();
  }
  async function penguinmonTalk() {
    const s = st();
    if (!s.flags.berceau) {
      s.flags.berceau = true;
      await say("Bienvenue au Village des Bébés ! Je suis Penguinmon, le gardien de cet endroit.", 'Penguinmon');
      await say("Ici, les Digimon naissent dans des DigiŒufs. Quand un Digimon disparaît, ses données reviennent aussi ici, sous forme d'œuf.", 'Penguinmon');
      await say("Tant que tu les traites bien, je te confierai un œuf par jour. Et si l'un de tes Digimon veut repartir de zéro, je peux l'aider à renaître.", 'Penguinmon');
      // (première visite : la carte de Botamon, le bébé des berceaux, pour l'album du chapitre 1 — si tu ne l'as pas déjà)
      if (DW.Cards && DW.Cards.give('botamon')) await say('Penguinmon te donne une carte de Botamon, le bébé qui dort dans les berceaux, pour ton album ! (Album)');
    }
    const r = await DW.choose(['Prendre un DigiŒuf', 'Faire renaître un Digimon', 'Se reposer', 'Au revoir']);
    if (r === 0) await eggService();
    else if (r === 1) await rebirthService();
    else if (r === 2) { await healAll("Les bébés chantent une berceuse... Ton équipe s'endort paisiblement."); await say('Ton équipe est en pleine forme !'); }
    else await say("Reviens quand tu veux. Les bébés t'aiment bien !", 'Penguinmon');
  }

  // Penguinmon veille dehors de 6 h à 20 h ; le soir et la nuit, il est dans sa maison (même service)
  const dehors = () => { const h = DW.Time.hour(); return h >= 6 && h < 20; };
  // petits habitants (ils se promènent et donnent des conseils)
  const baby = (sp, x, y, lines, w = 2) => ({ sp, x, y, face: 'right', wander: w, talk: async () => { for (const l of lines) await say(l, DW.SPECIES[sp].name); } });

  DW.MAPS.berceau = {
    name: 'Village des Bébés', music: 'village', bg: 'village', ambient: 'town', climate: 'forest', region: 'foret', theme: 'nursery',
    textures: 'bebe',   // (maisonnettes, manège, jouets, berceaux, lanternes : les images de la planche VILLAGE BEBE du joueur, gfx/textures.js)
    rows,
    // place ronde (pavés pastel) avec une rosace en mosaïque au centre
    plazas: [{ x: 22 * 16 + 8, y: 15 * 16 + 8, rx: 104, ry: 78, t: 'stone' }],
    mosaic: [{ x: 22 * 16 + 8, y: 15 * 16 + 8, r: 44 }],
    objects: [
      { kind: 'rainbowarch', x: 22, y: 0, w: 5, h: 3, top: true },
      { kind: 'house', x: 17, y: 4, w: 4, h: 3 },
      { kind: 'bigbottle', x: 22, y: 15, w: 1, h: 1, small: true },
      // nurserie
      { kind: 'starmobile', x: 8, y: 6, w: 1, h: 1, small: true },
      { kind: 'flowerbed', v: 0, x: 4, y: 3, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 1, x: 12, y: 3, w: 1, h: 1, small: true },
      // entrée ouest : piles de cubes ABC de part et d'autre de l'allée
      { kind: 'blockstack', v: 0, x: 4, y: 9, w: 2, h: 1 }, { kind: 'blockstack', v: 1, x: 4, y: 15, w: 2, h: 1 },
      // aire de jeux
      { kind: 'carousel', x: 33, y: 4, w: 5, h: 3 },
      { kind: 'rockinghorse', v: 0, x: 29, y: 9, w: 2, h: 1 }, { kind: 'rockinghorse', v: 1, x: 38, y: 9, w: 2, h: 1 },
      { kind: 'teddy', v: 0, x: 36, y: 11, w: 2, h: 1 }, { kind: 'jackbox', x: 30, y: 4, w: 1, h: 1, small: true },
      { kind: 'blockstack', v: 1, x: 39, y: 5, w: 2, h: 1 },
      { kind: 'toyball', v: 0, x: 27, y: 11, w: 1, h: 1, small: true }, { kind: 'toyball', v: 2, x: 35, y: 16, w: 1, h: 1, small: true },
      { kind: 'toytrain', x: 6, y: 18, w: 4, h: 1 },
      // maisonnettes en coquille d'œuf
      { kind: 'eggcottage', v: 0, x: 2, y: 19, w: 3, h: 2 }, { kind: 'eggcottage', v: 1, x: 11, y: 23, w: 3, h: 2 },
      { kind: 'eggcottage', v: 2, x: 38, y: 13, w: 3, h: 2 },
      // autour de la mare
      { kind: 'giantflower', v: 0, x: 27, y: 25, w: 1, h: 1, small: true }, { kind: 'giantflower', v: 2, x: 41, y: 20, w: 1, h: 1, small: true },
      { kind: 'giantshroom', v: 1, x: 40, y: 27, w: 1, h: 1, small: true },
      { kind: 'sandcastle', x: 18, y: 27, w: 1, h: 1, small: true },
      // les toilettes du village (près de l'entrée ouest, hors de l'ombre des arbres)
      { kind: 'toilet', v: 0, x: 5, y: 14, w: 2, h: 2 },
      // lanternes (allumées la nuit) et massifs de fleurs
      { kind: 'stonelantern', x: 22, y: 7, w: 1, h: 1, small: true }, { kind: 'stonelantern', x: 26, y: 7, w: 1, h: 1, small: true },
      { kind: 'stonelantern', x: 8, y: 10, w: 1, h: 1, small: true }, { kind: 'stonelantern', x: 16, y: 21, w: 1, h: 1, small: true },
      { kind: 'stonelantern', x: 31, y: 17, w: 1, h: 1, small: true },
      { kind: 'flowerbed', v: 2, x: 16, y: 6, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 0, x: 21, y: 6, w: 1, h: 1, small: true },
      { kind: 'flowerbed', v: 1, x: 5, y: 21, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 2, x: 14, y: 25, w: 1, h: 1, small: true },
      { kind: 'flowerbed', v: 0, x: 41, y: 15, w: 1, h: 1, small: true },
      { kind: 'toyball', v: 1, x: 15, y: 13, w: 1, h: 1, small: true },
      // le nid des DigiŒufs (on marche sur le coussin)
      { kind: 'eggnest', x: 16, y: 22, w: 11, h: 3, walk: true },
      ...DW.EGG_ORDER.map((sp, i) => ({ kind: 'digitama', v: i, x: EGG_X(i), y: EGG_Y, w: 1, h: 1, small: true })),
    ],
    warps: [{ x: 0, y: 11, w: 1, h: 3, dir: 'left', to: 'prairie', tx: 39, ty: 12 }],
    npcs: [
      { sp: 'penguinmon', x: 20, y: 8, face: 'right', cond: () => dehors(), talk: penguinmonTalk },   // (la nuit, il est chez lui)
      baby('botamon', 7, 11, ['Bo-bo... Je fais la sieste dans les berceaux tous les après-midi !', "Penguinmon dit que les œufs zébrés de bleu deviennent des Botamon. Comme moi !"]),
      baby('punimon', 30, 13, ['Puni ! Puni ! On joue à chat ? Le manège tourne toute la journée !', 'Les Punimon deviennent des Tsunomon, puis des Gabumon... ou des Elecmon ! Penguinmon dit que chacun choisit son chemin.']),
      baby('yuramon', 9, 21, ["Fuu... Le vent m'a encore emporté jusqu'ici...", "Un jour, je deviendrai Tanemon, puis Palmon. J'aurai une jolie fleur !"]),
      baby('nyokimon', 20, 27, ['Nyoki ! Ma fleur s\'ouvre quand je suis content !', 'Si tu frottes un œuf, il éclot plus vite. Les bébés adorent les câlins !']),
      baby('pichimon', 26, 21, ['Pichi ! Viens nager dans la mare !', "Un Digimon qui renaît garde ses techniques. Penguinmon l'a dit !"], 1),
    ],
    signs: {
      '3,10': 'VILLAGE DES BÉBÉS — Ici naissent les Digimon. Merci de marcher doucement !',
      ...Object.fromEntries(DW.EGG_ORDER.map((sp, i) => [`${EGG_X(i)},${EGG_Y}`, async () => {
        await say(DW.EGGS[sp].hint);
        await say("(Pour prendre un œuf, parle à Penguinmon.)");
      }])),
      '5,5': 'Un petit berceau tout doux. Un bébé Digimon y dort à poings fermés.', '7,5': 'Un berceau vide... On dirait qu\'il attend quelqu\'un.',
      '33,6': 'Le manège des bébés ! Il tourne en musique toute la journée.', '22,15': 'Un biberon géant, symbole du Village des Bébés. Il sent bon le lait chaud.',
    },
  };
  // cases sous les décors : pelouse (ni arbre ni canopée dessous)
  {
    const M = DW.MAPS.berceau, g = M.rows.map(r => [...r]);
    for (const o of M.objects) if (!o.walk && !o.top) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (g[y] && '#h:qB'.includes(g[y][x])) g[y][x] = 'v';
    M.rows = g.map(r => r.join(''));
  }
  DW.MapKit.zoomMap(DW.MAPS.berceau, 'berceau');   // plan agrandi ×2 (maps/common.js)

  // ------------------------------------------------------------ LA MAISON DU GARDIEN (Penguinmon) : on y entre par sa porte
  // (sa maison-champignon : l'image du joueur, gfx/textures.js) ; dedans, une nurserie douillette
  const B = n => 'tex_bebe_' + n;   // (images de la planche VILLAGE BEBE du joueur)
  {
    const M = DW.MAPS.berceau, mais = M.objects.find(o => o.kind === 'house'), px = mais.x + 1, py = mais.y + mais.h - 1;
    const P = DW.MapKit.doorRoom(16, 9), D = P.door;
    M.doors = [...(M.doors || []), { x: px, y: py, w: 2, dir: 'up', to: 'berceau_maison', tx: D, ty: P.rows.length - 2 }];
    M.signs[`${mais.x},${py}`] = M.signs[`${mais.x + 3},${py}`] = 'La maison de Penguinmon, le gardien du village. Une odeur de lait chaud et de gâteau s\'échappe de la porte.';
    DW.MAPS.berceau_maison = {
      name: 'Maison de Penguinmon', music: 'village', bg: 'village', ambient: 'home', climate: 'village', region: 'foret', indoor: true, textures: 'bebe',
      floor: { type: 'herring', cols: ['#dcb48a', '#b48a62', '#7a5a3a'] }, wall: { base: '#fbe4ec', alt: '#f2c6d6', pattern: 'dots', wood: '#a87a52' },
      rows: P.rows, npcs: [], signs: {}, doors: [],
      warps: [{ x: D, y: P.rows.length - 1, w: 2, h: 1, dir: 'down', to: 'berceau', tx: px, ty: py + 1 }],
      entry: { x: D, y: P.rows.length - 2 },
      objects: [
        // le mur du fond : fenêtres, étagères à biberons, armoire à pharmacie, étagère à jouets, garde-manger, lampe-fleur
        { kind: 'window', v: 0, x: 4, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 10, y: 1, w: 2, h: 2, back: true, oy: -6 },
        { kind: B('etagere_biberons'), x: 1, y: 3, w: 2, h: 1 }, { kind: B('armoire_soins'), x: 3, y: 3, w: 1, h: 1 }, { kind: B('etagere_jouets'), x: 7, y: 3, w: 2, h: 1 },
        { kind: B('garde_manger'), x: 12, y: 3, w: 1, h: 1 }, { kind: B('lampe_fleur'), x: 14, y: 3, w: 1, h: 1 },
        // le coin des bébés : berceau, lit à barreaux et son mobile, couveuse des œufs fragiles, table à langer, chaise haute
        { kind: B('berceau'), x: 1, y: 6, w: 1, h: 1 }, { kind: B('lit_barreaux'), x: 1, y: 9, w: 2, h: 1 }, { kind: B('mobile'), x: 3, y: 6, w: 1, h: 1 },
        { kind: B('couveuse'), x: 4, y: 10, w: 1, h: 1 }, { kind: B('table_langer'), x: 5, y: 3, w: 1, h: 1 }, { kind: B('chaise_haute'), x: 3, y: 10, w: 1, h: 1 },
        // le salon : tapis, table ronde et tabourets-fleurs, coussins, panier de linge, jouets
        { kind: 'bigrug', x: 6, y: 6, w: 4, h: 3, walk: true }, { kind: B('table'), x: 7, y: 7, w: 2, h: 1 },
        { kind: B('tabouret'), x: 6, y: 7, w: 1, h: 1 }, { kind: B('tabouret'), x: 9, y: 7, w: 1, h: 1 },
        { kind: B('coussins'), x: 7, y: 9, w: 2, h: 1 }, { kind: B('panier_linge'), x: 10, y: 10, w: 1, h: 1 }, { kind: B('peluche'), x: 6, y: 10, w: 1, h: 1 },
        { kind: B('cubes'), x: 11, y: 8, w: 1, h: 1 }, { kind: B('xylophone'), x: 9, y: 10, w: 1, h: 1 },
        // le coin de Penguinmon : son lit-cocon, son coffre, ses gamelles, une plante
        { kind: B('lit_cocon'), x: 13, y: 6, w: 2, h: 1 }, { kind: B('coffre'), x: 14, y: 8, w: 1, h: 1 }, { kind: B('gamelles'), x: 13, y: 10, w: 1, h: 1 },
        { kind: 'plant', v: 0, x: 14, y: 10, w: 1, h: 1, small: true },
      ],
    };
    const IN = DW.MAPS.berceau_maison;
    IN.npcs.push({ sp: 'penguinmon', x: 11, y: 6, face: 'down', cond: () => !dehors(), talk: penguinmonTalk },
      baby('botamon', 2, 7, ['Bo... (Botamon dort à poings fermés dans le berceau.)', 'Bo-bo... (Il sourit en dormant.)'], 0),
      baby('pabumon', 12, 9, ['Pabu ! Penguinmon fait les meilleurs biberons du monde !', "La nuit, Penguinmon nous raconte des histoires d'Engrenages et de Digimon géants..."], 1));
    // (un meuble de deux cases : le même texte sur les deux)
    const texte = (cases, t) => cases.forEach(k => (IN.signs[k] = t));
    texte(['4,10'], "Une couveuse tiède. Les DigiŒufs les plus fragiles finissent d'y mûrir, bien au chaud.");
    texte(['3,3'], 'Pansements, biberons de lait chaud, sirop au miel... Penguinmon pense à tout.');
    texte(['1,3', '2,3'], 'Des biberons, des hochets et des petits pots, bien alignés.');
    texte(['7,3', '8,3'], 'Une étagère pleine de jouets : des cubes, un nounours, une balle... Tout est rangé avant la sieste.');
    texte(['12,3'], 'Des bocaux de compote de pomme bleue et de lait en poudre, bien rangés.');
    texte(['13,6', '14,6'], "Le lit de Penguinmon : une coque de noix tapissée de pétales. Il a l'air drôlement confortable.");
    texte(['14,8'], 'Le coffre à trésors de Penguinmon : des coquillages, une plume, un vieux dessin de bébé Digimon...');

    // ---------------------------------------------------------- LE VILLAGE MEUBLÉ (cases de la carte agrandie ; seulement là où
    // l'on voit, pas sous le feuillage des grands arbres) : aire de jeux près du manège, bancs autour de la place, kiosque à
    // livres, scène, pavillon fleuri, dôme à bulles, moulin et observatoire, coin nurserie, boîte aux lettres, tableau, jouets
    for (const [n, x, y, w, h] of [
      ['toboggan', 58, 13, 2, 1], ['balancoire', 62, 15, 2, 1], ['trampoline', 75, 14, 2, 1], ['tourniquet', 61, 18, 2, 1], ['dome_grimpe', 66, 19, 2, 1], ['tunnel', 71, 20, 2, 1],
      ['banc', 36, 24, 2, 1], ['banc', 53, 24, 2, 1], ['banc', 36, 38, 2, 1], ['banc', 53, 38, 2, 1],
      ['kiosque_livres', 20, 5, 3, 1], ['statue_oeuf', 31, 5, 2, 1], ['scene_musique', 66, 26, 3, 2], ['pavillon_fleur', 13, 33, 3, 2], ['dome_bulles', 68, 35, 3, 2],
      ['moulin', 28, 42, 3, 2], ['observatoire', 12, 46, 3, 2], ['fontaine_bulles', 54, 43, 1, 1],
      ['couveuse', 26, 9, 1, 1], ['table_langer', 30, 8, 1, 1], ['etagere_biberons', 33, 8, 2, 1], ['chaise_haute', 24, 14, 1, 1], ['coussins', 26, 12, 2, 1],
      ['boite_lettres', 41, 11, 1, 1], ['panneau_affichage', 30, 16, 2, 1], ['poteau_indicateur', 9, 21, 1, 1], ['poubelle', 58, 24, 1, 1],
      ['fanions', 40, 19, 2, 1], ['fanions', 55, 19, 2, 1], ['ballons', 33, 28, 1, 1], ['ballons', 57, 34, 1, 1], ['moulinets', 31, 20, 1, 1],
      ['cubes', 36, 13, 1, 1], ['anneaux', 40, 42, 1, 1], ['xylophone', 56, 40, 1, 1], ['tambour', 34, 44, 1, 1], ['hochet', 60, 24, 1, 1], ['toupie', 63, 22, 1, 1],
      ['buisson_fleurs', 20, 16, 1, 1], ['buisson_fleurs', 76, 24, 1, 1], ['buisson_fleurs', 18, 40, 1, 1], ['trefles', 44, 50, 1, 1], ['trefles', 22, 31, 1, 1],
      ['jardiniere', 43, 13, 2, 1], ['jardiniere', 61, 30, 2, 1], ['nid_oeufs', 35, 47, 1, 1], ['oeufs', 49, 47, 1, 1],
    ]) M.objects.push({ kind: B(n), v: 0, x, y, w, h });
    M.signs['30,16'] = M.signs['31,16'] = () => say(DW.state.flags.shellmon
      ? 'Le tableau du village : « Les bébés remercient l\'humain qui a ramené le calme sur la plage ! Concert ce soir sur la scène. »'
      : 'Le tableau du village : « Ne vous éloignez pas vers la plage : on y entend des cris. Les DigiŒufs se prennent auprès de Penguinmon. »');
    M.signs['9,21'] = '→ Place du biberon · Maison de Penguinmon · Nid des DigiŒufs. ↑ Arche arc-en-ciel. ← Prairie des Lucioles.';
    M.signs['20,5'] = M.signs['21,5'] = M.signs['22,5'] = 'Le kiosque à livres : « Mon premier Digivice », « Comment bien digivoluer », « Les Engrenages Noirs expliqués aux bébés »...';
  }
})();
;

// ===== js/maps/quartiers.js
'use strict';
// =====================================================================
//  QUARTIERS PÉRIPHÉRIQUES — la Ville des Fichiers devient une mégapole
//  Chaque quartier s'ouvre quand la ville atteint un certain niveau, puis se remplit au fil des niveaux suivants :
//  chaque emplacement a son niveau minimal (sur une échelle de 16 paliers : level()).
//  Rien n'est montré à l'avance : avant son ouverture, le chemin vers le quartier n'existe pas,
//  et un emplacement pas encore construit reste une simple pelouse.
//    Quartier Résidentiel (nord de la ville)    — maisons de ville, immeubles, parc     (ville au niveau 3)
//    Quartier du Marché  (est du Résidentiel)   — boutiques, étals, tour de l'horloge   (ville au niveau 6)
//    Quartier Numérique  (ouest du Résidentiel) — tours de données, câbles, façon DW2003 (ville au niveau 10)
//  Toutes les maisons et tous les immeubles se visitent (intérieurs générés : salon, cuisine,
//  chambre ou salon de musique, avec un habitant).
// =====================================================================
(function () {
  const { say, paint } = DW.MapKit;
  const MAPS = DW.MAPS, Hh = DW.Art.hash;
  // les quartiers ont été conçus sur une échelle de 16 paliers ; la ville en compte 11 (développement en %, game/town.js)
  const level = () => Math.round(DW.Town.level() * 16 / 11);
  // agrandissement des quartiers (bâtiments plus grands, plus d'espace) : plan d'origine 48×34 × Z
  const Z = 1.8, W = Math.round(48 * Z), H = Math.round(34 * Z);
  // herbe non praticable (invisible) : derrière les grands bâtiments, là où le toit déborde de l'emprise
  DW.World.CH['ŧ'] = { t: 'grass', solid: true }; DW.SOLID.add('ŧ');

  // ------------------------------------------------------------ habitants (Digimon qui emménagent)
  const CITIZENS = ['agumon', 'gabumon', 'biyomon', 'tentomon', 'palmon', 'gomamon', 'patamon', 'elecmon', 'gotsumon', 'betamon', 'penguinmon',
    'kunemon', 'mushroomon', 'monochromon', 'leomon', 'frigimon', 'gekomon', 'unimon', 'koromon', 'tsunomon', 'tanemon', 'yokomon', 'bukamon', 'numemon'];
  const LINES = [
    "La ville grandit à vue d'œil ! Quand je suis arrivé, il n'y avait que des ruines...",
    "J'ai emménagé la semaine dernière. Les voisins sont adorables !",
    "Le soir, j'aime regarder les lumières de la ville depuis ma fenêtre.",
    "On raconte qu'un jour, la Ville des Fichiers sera la plus grande cité de tout le Monde Digital !",
    "Tu as visité le Marché ? On y trouve de tout, même des cartes rares !",
    "Prends ton temps, mets-toi à l'aise. Une tasse de thé ?",
    "Les tours du Quartier Numérique ronronnent toute la nuit... C'est très reposant.",
    "Mon rêve ? Digivoluer un jour, et protéger la ville comme toi !",
    "Jijimon dit que chaque nouvel habitant rend la ville plus forte.",
    "Quand il pleut, j'écoute les gouttes sur le toit. Ploc, ploc...",
  ];
  // seuls les Digimon déjà COMBATTUS au moins une fois (ou déjà élevés) viennent habiter en ville
  // (anciennes sauvegardes sans st.fought : on se fie aux Digimon déjà vus)
  const known = sp => { const s = DW.state; if (!s) return false; const F = s.fought || s.seen || {}; return !!(F[sp] || (s.owned || {})[sp] || (DW.Town && DW.Town.has(sp))); };
  DW.Citizens = { known };
  // promeneur des rues : un des Digimon déjà rencontrés
  const citizenOf = seed => { const P = CITIZENS.filter(known); return P.length ? P[Math.floor(Hh(seed, 7, 801) * P.length)] : null; };
  // chaque logement a son PROPRIÉTAIRE (décor de la maison, nom, boîte aux lettres à son élément) ; il y habite une fois
  // rencontré, le logement reste vide avant
  const ownerOf = seed => CITIZENS[Math.floor(Hh(seed, 7, 801) * CITIZENS.length)];
  const homeNpc = (sp, seed, x, y, line, flavor) => (!known(sp) ? [] :
    [{ sp, x, y, face: 'left', wander: 1, talk: async () => { const a = dite(line, seed), b = flavor && dite(flavor, seed + 17); await say(a, nameOf(sp)); if (b && b !== a && Hh(seed, 5, 807) < 0.5) await say(b, nameOf(sp)); } }]);
  const lineOf = seed => LINES[Math.floor(Hh(seed, 9, 802) * LINES.length)];
  // (comme le panneau du Résidentiel : on ne parle pas d'un quartier pas encore construit — la réplique en laisse dire une autre)
  const CITES = [[/Marché/, 'marche'], [/Quartier Numérique/, 'numerique']];
  const dite = (line, seed) => {
    const absente = t => CITES.some(([re, q]) => re.test(t) && !(DW.Quartiers && DW.Quartiers.open(q)));
    if (!absente(line)) return line;
    const ok = LINES.filter(t => !absente(t));
    return ok[Math.floor(Hh(seed, 9, 808) * ok.length)];
  };
  const nameOf = sp => (DW.SPECIES[sp] ? DW.SPECIES[sp].name : sp);

  // ------------------------------------------------------------ intérieurs des maisons (générés)
  // pièce 14 × (2 rangées de mur + 7 de sol), porte en bas au centre (colonnes 6-7)
  const ROOM_W = 14, ROOM_H = 7, DOOR_X = 6;
  const roomRows = () => DW.MapKit.doorRoom(ROOM_W, ROOM_H).rows;   // (porte en colonnes 6-7 = DOOR_X)
  const FLOORS = [null, { type: 'tile', cols: ['#f4ece0', '#c8b8a8', '#a89888'] }, { type: 'herring', cols: ['#c8925a', '#9a6a3a', '#6a4422'] },
    { type: 'carpet', cols: ['#8aa8d8', '#7898c8', '#e8d8a0'] }, { type: 'tatami', cols: ['#d8cc8a', '#c4b878', '#4a6a3a'] },
    { type: 'carpet', cols: ['#d89aa8', '#c88898', '#fff0d8'] }, { type: 'tile', cols: ['#e8f0f4', '#9ab8c8', '#7a98a8'] }, { type: 'stone', cols: ['#d8d0c4', '#b8b0a4', '#8a8478'] }];
  const WALLS = [null, { base: '#f4e0d8', alt: '#e8c8c0', pattern: 'stripes', wood: '#a8704a' }, { base: '#e0ecf4', alt: '#c8d8e8', pattern: 'dots', wood: '#6a7a9a' },
    { base: '#f0f0dc', alt: '#d8d8b8', pattern: 'diamond', wood: '#8a6a3a' }, { base: '#e8dcf0', alt: '#d4c4e4', pattern: 'stripes', wood: '#7a5a8a' },
    { base: '#f8ecd0', alt: '#e8d4a8', pattern: 'plain', wood: '#9a6a3a' }, { base: '#d8c8b8', alt: '#c0ae9c', pattern: 'brick', wood: '#6a4a2a' }];
  // aménagements (coordonnées dans la pièce ; les colonnes 6-7 restent libres jusqu'à la porte)
  const LAYOUTS = {
    salon: v => ({ objs: [
      { kind: 'bookshelf', v: v % 2, x: 1, y: 3, w: 2, h: 1 }, { kind: 'crttv', x: 4, y: 3, w: 2, h: 1 },
      { kind: 'window', v: 0, x: 7, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'poster', v: v % 3, x: 10, y: 1, w: 1, h: 1, back: true, oy: 15 },
      { kind: 'aquarium', x: 9, y: 3, w: 3, h: 1 }, { kind: 'bigplant', x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'bigrug', v: v % 3, x: 1, y: 5, w: 5, h: 3, walk: true }, { kind: 'sofa', v: v % 3, x: 2, y: 7, w: 3, h: 1 },
      { kind: 'sidetable', x: 1, y: 6, w: 1, h: 1, small: true }, { kind: 'armchair', v: v % 2, x: 10, y: 6, w: 1, h: 1, small: true },
      { kind: 'floorlamp', x: 12, y: 8, w: 1, h: 1, small: true }, { kind: 'cushion', v: v % 3, x: 9, y: 8, w: 1, h: 1, small: true },
    ], npc: [10, 8], signs: { '4,3': "La télé diffuse un reportage : « Les mystères de la Digivolution ».", '5,3': "La télé diffuse un reportage : « Les mystères de la Digivolution ».",
      '9,3': 'De petits poissons de données nagent entre les algues.', '10,3': 'De petits poissons de données nagent entre les algues.', '11,3': 'De petits poissons de données nagent entre les algues.' } }),
    cuisine: v => ({ objs: [
      { kind: 'kitchen', v: v % 2, x: 1, y: 3, w: 4, h: 1 }, { kind: 'fridge', x: 5, y: 3, w: 1, h: 1, small: true },
      { kind: 'window', v: 0, x: 8, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'shelf', x: 10, y: 2, w: 2, h: 1, back: true, oy: 6 },
      { kind: 'pots', x: 10, y: 3, w: 2, h: 1 }, { kind: 'plant', v: 1, x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'bigrug', v: (v + 1) % 3, x: 8, y: 5, w: 5, h: 3, walk: true }, { kind: 'table', x: 9, y: 6, w: 2, h: 1 },
      { kind: 'stool', x: 8, y: 6, w: 1, h: 1, small: true }, { kind: 'stool', x: 11, y: 6, w: 1, h: 1, small: true },
      { kind: 'floorlamp', x: 1, y: 8, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 12, y: 8, w: 1, h: 1, small: true },
    ], npc: [3, 7], signs: { '1,3': 'Ça sent bon le gâteau à la viande...', '2,3': 'Ça sent bon le gâteau à la viande...', '5,3': 'Le frigo est rempli de Digiviandes et de lait.' } }),
    chambre: v => ({ objs: [
      { kind: 'bed', x: 1, y: 3, w: 2, h: 2 }, { kind: 'sidetable', x: 3, y: 3, w: 1, h: 1, small: true },
      { kind: 'window', v: 0, x: 4, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'poster', v: (v + 1) % 3, x: 7, y: 1, w: 1, h: 1, back: true, oy: 15 },
      { kind: 'wardrobe', v: v % 2, x: 8, y: 3, w: 2, h: 1 }, { kind: 'desk', x: 10, y: 3, w: 3, h: 1 },
      { kind: 'bigrug', v: (v + 2) % 3, x: 1, y: 6, w: 5, h: 3, walk: true }, { kind: 'cushion', v: v % 3, x: 3, y: 7, w: 1, h: 1, small: true },
      { kind: 'armchair', v: (v + 1) % 2, x: 11, y: 6, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 12, y: 8, w: 1, h: 1, small: true },
      { kind: 'chest', x: 1, y: 8, w: 1, h: 1, small: true },
    ], npc: [9, 7], signs: { '10,3': "L'ordinateur affiche une carte de l'Île des Fichiers. Des points clignotent un peu partout.", '11,3': "L'ordinateur affiche une carte de l'Île des Fichiers. Des points clignotent un peu partout.", '12,3': "L'ordinateur affiche une carte de l'Île des Fichiers. Des points clignotent un peu partout." } }),
    musique: v => ({ objs: [
      { kind: 'piano', x: 1, y: 3, w: 3, h: 1 }, { kind: 'bookshelf', v: (v + 1) % 2, x: 4, y: 3, w: 2, h: 1 },
      { kind: 'window', v: 0, x: 7, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'frame', x: 4, y: 1, w: 2, h: 1, back: true, oy: 6 },
      { kind: 'aquarium', x: 9, y: 3, w: 3, h: 1 }, { kind: 'bigplant', x: 12, y: 3, w: 1, h: 1, small: true },
      { kind: 'bigrug', v: v % 3, x: 8, y: 5, w: 5, h: 3, walk: true }, { kind: 'sofa', v: (v + 2) % 3, x: 9, y: 7, w: 3, h: 1 },
      { kind: 'armchair', v: v % 2, x: 2, y: 8, w: 1, h: 1, small: true }, { kind: 'floorlamp', x: 12, y: 8, w: 1, h: 1, small: true },
      { kind: 'cushion', v: (v + 1) % 3, x: 4, y: 7, w: 1, h: 1, small: true },
    ], npc: [8, 6], signs: { '1,3': () => { DW.Audio.sfx('levelup'); return say('Tu pianotes quelques notes... Do, mi, sol ! Ton partenaire danse.'); },
      '2,3': () => { DW.Audio.sfx('levelup'); return say('Tu pianotes quelques notes... Do, mi, sol ! Ton partenaire danse.'); }, '3,3': 'Un vieux piano bien accordé.' } }),
  };
  const LAYOUT_ORDER = ['salon', 'cuisine', 'chambre', 'musique'];
  // crée l'intérieur d'une maison (id), dont la porte extérieure est en (ox, oy) sur la carte du quartier
  // ------------------------------------------------------------ décoration selon l'habitant (élément de l'espèce)
  // sol, papier peint et meubles à thème (gfx/interior2.js), posés là où il y a de la place
  const THEMES = {
    'Feu': { floor: { type: 'herring', cols: ['#c8784a', '#9a5230', '#6a341c'] }, wall: { base: '#e8b090', alt: '#d89878', pattern: 'brick', wood: '#8a3a20' }, add: [['woodstove', 0], ['painting', 1, true]] },
    'Eau': { floor: { type: 'tile', cols: ['#bfe2f2', '#8ac0dc', '#5a92b0'] }, wall: { base: '#d8eef8', alt: '#b8dcef', pattern: 'stripes', wood: '#3a6a8a' }, add: [['shellshelf', 0, true], ['pottedtree', 1]] },
    'Plante': { floor: { type: 'herring', cols: ['#b89060', '#8a6a40', '#5a4426'] }, wall: { base: '#d8ecc8', alt: '#bcdcaa', pattern: 'dots', wood: '#5a7a3a' }, add: [['flowerpots', 0], ['pottedtree', 0], ['flowerpots', 1]] },
    'Électrique': { floor: { type: 'tile', cols: ['#c8ccd4', '#9aa0aa', '#6a707a'] }, wall: { base: '#e0e4ea', alt: '#c8ced8', pattern: 'stripes', wood: '#4a5060' }, add: [['computer', 0], ['crttv', 0]] },
    'Glace': { floor: { type: 'tile', cols: ['#f4f8ff', '#d4e4f4', '#a8c4e0'] }, wall: { base: '#f0f6ff', alt: '#dce8f8', pattern: 'diamond', wood: '#7a98c0' }, add: [['furrug', 0, false, true], ['curtains', 0, true]] },
    'Air': { floor: { type: 'carpet', cols: ['#bfe0f8', '#a0c8ec', '#f8f8ff'] }, wall: { base: '#eaf4ff', alt: '#d4e8fa', pattern: 'dots', wood: '#6a8ab0' }, add: [['nest', 0], ['curtains', 0, true]] },
    'Terre': { floor: { type: 'stone', cols: ['#c8b8a0', '#a89880', '#786a56'] }, wall: { base: '#d8c4a8', alt: '#c4ae90', pattern: 'brick', wood: '#6a4a2a' }, add: [['barrels', 0], ['pottedtree', 1]] },
    'Lumière': { floor: { type: 'carpet', cols: ['#f8ecc8', '#ecdaa8', '#fffaf0'] }, wall: { base: '#fff8e8', alt: '#f4ead0', pattern: 'plain', wood: '#c8a040' }, add: [['painting', 0, true], ['candles', 0], ['curtains', 1, true]] },
    'Ténèbres': { floor: { type: 'carpet', cols: ['#5a3a6a', '#3a2448', '#1e1228'] }, wall: { base: '#4a3a5a', alt: '#3a2c48', pattern: 'diamond', wood: '#241830' }, add: [['candles', 0], ['painting', 2, true], ['candles', 0]] },
    'Insecte': { floor: { type: 'herring', cols: ['#a8905a', '#7e6a3e', '#4e4226'] }, wall: { base: '#dce8c0', alt: '#c4d8a4', pattern: 'stripes', wood: '#6a6a2a' }, add: [['flowerpots', 1], ['pottedtree', 0]] },
    'Neutre': { add: [['toybox', 0]] },
  };
  // cases libres d'une pièce de maison (14 × 11) : pas d'objet, pas devant la porte (colonnes 6-7 en bas), pas sur l'habitant
  function themeHome(m, sp) {
    const T = THEMES[(DW.SPECIES[sp].types || ['Neutre'])[0]] || THEMES.Neutre;
    if (T.floor) m.floor = T.floor;
    if (T.wall) m.wall = T.wall;
    const npc = m.npcs[0], busy = (x, y, w, h) => m.objects.some(o => !o.walk && !o.back && o.x < x + w && o.x + (o.w || 1) > x && o.y < y + h && o.y + (o.h || 1) > y)
      || (x < 8 && x + w > 6 && y + h > 7) || (npc && npc.x >= x - 1 && npc.x <= x + w && npc.y >= y - 1 && npc.y <= y + h);
    const backBusy = x => m.objects.some(o => o.back && o.x < x + 2 && o.x + (o.w || 1) > x);
    for (const [kind, v, back, rug] of T.add) {
      if (back) { for (const x of [1, 4, 9, 11]) if (!backBusy(x)) { m.objects.push({ kind, v, x, y: 1, w: 2, h: 1, back: true, oy: 6 }); break; } continue; }
      const w = rug ? 4 : kind === 'flowerpots' || kind === 'computer' || kind === 'barrels' ? 2 : 1, h = rug ? 2 : 1;
      for (const [x, y] of [[1, 8], [12, 8], [10, 8], [1, 5], [12, 5], [3, 8], [9, 5], [2, 3], [11, 3]]) {
        if (x + w > 13 || y + h > 10 || busy(x, y, w, h)) continue;
        m.objects.push({ kind, v, x, y, w, h, small: w === 1, walk: !!rug });
        break;
      }
    }
  }
  function makeHome(id, seed, name, quarter, back) {
    const kind = LAYOUT_ORDER[Math.floor(Hh(seed, 1, 803) * 4)], v = Math.floor(Hh(seed, 2, 804) * 6);
    const L = LAYOUTS[kind](v), sp = ownerOf(seed), line = lineOf(seed), flavor = lineOf(seed + 17);
    MAPS[id] = {
      name, music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
      floor: FLOORS[Math.floor(Hh(seed, 3, 805) * FLOORS.length)], wall: WALLS[Math.floor(Hh(seed, 4, 806) * WALLS.length)],
      rows: roomRows(), objects: L.objs, signs: { ...L.signs },
      npcs: [{ sp, x: L.npc[0], y: L.npc[1] }], owner: sp,   // (sa place : le décor la laisse libre, themeHome)
      populate() { this.npcs = homeNpc(sp, seed, L.npc[0], L.npc[1], line, flavor); if (name === 'Maison') this.name = this.npcs.length ? `Maison de ${nameOf(sp)}` : 'Maison inoccupée'; },
      warps: [{ x: DOOR_X, y: ROOM_H + 3, w: 2, h: 1, dir: 'down', to: quarter, tx: back[0], ty: back[1] }],
      entry: { x: DOOR_X, y: ROOM_H + 2 },
    };
    if (name === 'Maison') MAPS[id].name = `Maison de ${nameOf(sp)}`;
    themeHome(MAPS[id], sp);
    return id;
  }

  // ------------------------------------------------------------ outils communs des quartiers
  // Comme la Ville des Fichiers de Digimon World 1 : chemins de terre qui serpentent, bâtiments posés
  // librement dans l'herbe avec leur jardinet, bosquets, ruisseau et étang naturels.
  // Les plans sont écrits dans un repère 48×34 puis agrandis de Z (bâtiments plus grands, quartiers plus vastes).
  // emplacement : { kind, v, x, y, min } ; chaumières, maisons et immeubles se visitent (porte en bas)
  const z = v => Math.round(v * Z);
  // emprise (en cases) des bâtiments agrandis, et position de la porte sur leur façade
  const FOOT = { cottage: [5, 4], townhouse: [5, 4], apartment: [6, 4], shopfront: [5, 4], marketstall: [4, 2], datatower: [4, 2], bakery: [6, 4], patisserie: [6, 4] };
  const DOOR = { cottage: [2, 1], townhouse: [2, 1], apartment: [2, 2], bakery: [2, 2], patisserie: [2, 2] };
  // boutiques de bouche (porte comme une maison) : un commerçant et son étal
  const FOOD_SHOPS = {
    bakery: { name: 'Boulangerie', sp: 'agumon', shop: 'boulangerie', line: 'Bonjour ! Le pain sort du four, tout chaud !', floor: { type: 'tile', cols: ['#f0e0c0', '#d8c098', '#b89a70'] }, wall: { base: '#f8e8c8', alt: '#e8d4a8', pattern: 'stripes', wood: '#a8703a' },
      objs: [{ kind: 'oven', x: 1, y: 1, w: 3, h: 2, back: true }, { kind: 'counter', v: 0, x: 4, y: 4, w: 4, h: 1 }, { kind: 'sacks', x: 10, y: 4, w: 2, h: 1 }, { kind: 'shelf', x: 9, y: 1, w: 2, h: 1, back: true }, { kind: 'table', x: 9, y: 7, w: 2, h: 1 }, { kind: 'bigplant', x: 12, y: 8, w: 1, h: 1, small: true }] },
    patisserie: { name: 'Pâtisserie', sp: 'palmon', shop: 'patisserie', line: 'Bienvenue ! Nos gâteaux rendent tous les Digimon heureux !', floor: { type: 'carpet', cols: ['#f8d0e0', '#e8b0c8', '#c88aa8'] }, wall: { base: '#fff0f6', alt: '#f8dce8', pattern: 'dots', wood: '#c86a9a' },
      objs: [{ kind: 'counter', v: 2, x: 4, y: 4, w: 4, h: 1 }, { kind: 'fridge', x: 1, y: 3, w: 1, h: 1, small: true }, { kind: 'table', x: 9, y: 6, w: 2, h: 1 }, { kind: 'stool', x: 8, y: 6, w: 1, h: 1, small: true }, { kind: 'stool', x: 11, y: 6, w: 1, h: 1, small: true }, { kind: 'cushion', v: 1, x: 2, y: 8, w: 1, h: 1, small: true }, { kind: 'bigplant', x: 12, y: 8, w: 1, h: 1, small: true }] },
  };
  function makeFoodShop(id, kind, quarter, back) {
    const F = FOOD_SHOPS[kind], name = nameOf(F.sp);
    MAPS[id] = {
      name: F.name, music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true, floor: F.floor, wall: F.wall,
      rows: roomRows(), objects: F.objs.map(o => ({ ...o })), signs: {},
      npcs: [{ sp: F.sp, x: 6, y: 3, face: 'down', talk: async () => { await say(F.line, name); await DW.Game.push(new DW.ShopScene(F.shop)); } }],
      warps: [{ x: DOOR_X, y: ROOM_H + 3, w: 2, h: 1, dir: 'down', to: quarter, tx: back[0], ty: back[1] }],
      entry: { x: DOOR_X, y: ROOM_H + 2 },
    };
    for (let x = 4; x < 8; x++) MAPS[id].signs[`${x},4`] = MAPS[id].npcs[0].talk;   // on commande par-dessus le comptoir
    return id;
  }
  // ------------------------------------------------------------ niveaux des maisons : grenier, cave, étages
  // les escaliers sont dans le mur du fond, à droite (colonnes 11-12) ; la case d'arrivée est dégagée
  const ATTIC = [{ kind: 'crates', x: 2, y: 4, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 3, y: 4, w: 1, h: 1, small: true }, { kind: 'sacks', x: 2, y: 7, w: 2, h: 1 },
    { kind: 'teddy', x: 8, y: 7, w: 1, h: 1 }, { kind: 'wardrobe', v: 1, x: 5, y: 1, w: 2, h: 2, back: true }];
  const CELLAR = [{ kind: 'crates', x: 2, y: 4, w: 1, h: 1, small: true }, { kind: 'crates', v: 1, x: 2, y: 5, w: 1, h: 1, small: true }, { kind: 'pots', x: 5, y: 4, w: 2, h: 1 },
    { kind: 'sacks', x: 8, y: 7, w: 2, h: 1 }, { kind: 'shelf', x: 4, y: 1, w: 2, h: 1, back: true }];
  // (les meubles retirés pour l'escalier emportent leurs panneaux : sinon on lisait « l'aquarium » ou « la télé » devant
  //  l'escalier, sur une case vide)
  const clearStairs = (id, x) => {
    const m = MAPS[id], gone = m.objects.filter(o => !o.back && !o.walk && o.x < x + 2 && o.x + (o.w || 1) > x && o.y <= 4);
    m.objects = m.objects.filter(o => !gone.includes(o));
    for (const o of gone) for (let yy = o.y; yy < o.y + (o.h || 1); yy++) for (let xx = o.x; xx < o.x + (o.w || 1); xx++) delete m.signs[`${xx},${yy}`];
  };
  function addLevel(home, sub, name, objs, up, opts = {}, hx = 11, ax = 2) {
    const P = DW.Palais, id = `${home}_${sub}`, racine = MAPS[home].racine || home;
    P.room(id, 'village', { name: `${MAPS[racine].name} — ${name}`, w: 14, h: 11, floor: opts.floor, wall: opts.wall, dark: opts.dark, objects: objs.map(o => ({ ...o })) });
    Object.assign(MAPS[id], { racine, populate() { this.name = `${MAPS[racine].name} — ${name}`; } });
    Object.assign(MAPS[id].signs, opts.signs || {});   // (panneaux des meubles : posés avant l'escalier, qui retire les siens)
    clearStairs(home, hx); clearStairs(id, ax);
    P.stairs(home, hx, id, ax, up);
    return id;
  }
  function addFloors(home, kind, seed) {
    const r = Hh(seed, 11, 821);
    const attic = { floor: { type: 'herring', cols: ['#a8845a', '#7a5a3a', '#4a3424'] }, wall: { base: '#c8a880', alt: '#b89870', pattern: 'plain', wood: '#6a4a2a' }, dark: { d: 0.3, col: '#3a2a20' } };
    const cellar = { floor: { type: 'stone', cols: ['#8a8478', '#6a6458', '#4a4438'] }, wall: { base: '#7a7468', alt: '#6a6458', pattern: 'brick', wood: '#3a3428' }, dark: { d: 0.45, col: '#201c18' } };
    if (kind === 'apartment') {
      // immeuble : deux étages d'appartements, chacun avec son habitant
      let below = home;
      for (const n of [1, 2]) {
        const s2 = seed + n * 101, L = LAYOUTS[LAYOUT_ORDER[Math.floor(Hh(s2, 1, 803) * 4)]](Math.floor(Hh(s2, 2, 804) * 6));
        const id = addLevel(below, `e${n}`, `${n}${n === 1 ? 'er' : 'e'} étage`, L.objs, true, { floor: FLOORS[(n + 2) % FLOORS.length], wall: WALLS[(n + 3) % WALLS.length], signs: L.signs });
        const line = lineOf(s2);
        MAPS[id].populate = function () { this.npcs = homeNpc(ownerOf(s2), s2, L.npc[0], L.npc[1], line); };
        below = id;
      }
      return;
    }
    if (kind === 'townhouse' || kind === 'cottage') {
      const top = kind === 'townhouse' ? addLevel(home, 'e1', 'Étage', LAYOUTS.chambre(Math.floor(r * 6)).objs, true) : home;
      const a = addLevel(top, 'grenier', 'Grenier', ATTIC, true, attic);
      DW.Palais.treasure(a, `grenier_${home}`, null, [[r < 0.15 ? 'gland_or' : r < 0.5 ? 'cartes' : 'soin_m', 1]], 10, 7);
      if (r > 0.45) addLevel(home, 'cave', 'Cave', CELLAR, false, cellar, 8, 11);
    }
  }
  function lots(list, quarter, prefix) {
    return list.map((L, i) => {
      const o = { ...L, x: z(L.x), y: z(L.y) };
      [o.w, o.h] = FOOT[o.kind] || [L.w, L.h];
      if (DOOR[o.kind]) {
        const [dx, dw] = DOOR[o.kind];
        o.door = { x: o.x + dx, y: o.y + o.h - 1, w: dw };
        const hid = `${prefix}${i}`, seed = prefix.length * 97 + i * 13 + 5;
        if (FOOD_SHOPS[o.kind]) o.home = makeFoodShop(hid, o.kind, quarter, [o.x + dx, o.y + o.h]);
        else { o.home = makeHome(hid, seed, o.kind === 'apartment' ? 'Immeuble' : 'Maison', quarter, [o.x + dx, o.y + o.h]); addFloors(hid, o.kind, seed); }
      }
      return o;
    });
  }
  // --- tracé naturel (coordonnées du plan d'origine, agrandies ici)
  const segD = (x, y, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
  };
  const polyD = (x, y, pts) => { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, segD(x, y, pts[i], pts[i + 1])); return m; };
  const zp = pts => pts.map(([x, y]) => [x * Z, y * Z]);
  // chemin sinueux (bords irréguliers) ; sur l'eau, il devient un pont
  function trail(g, pts, r, ch = '=', seed = 1) {
    pts = zp(pts); r *= Z * 0.92;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (polyD(x, y, pts) > r + (Hh(x, y, 820 + seed) - 0.5) * 0.7) continue;
      const c = g.get(x, y);
      if (c === '~' || c === 'w' || c === '_') g.set(x, y, '_'); else g.set(x, y, ch);
    }
  }
  function water(g, pts, r) { pts = zp(pts); r *= Z; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (polyD(x, y, pts) <= r + (Hh(x, y, 830) - 0.5) * 0.6) g.set(x, y, '~'); }
  function pond(g, cx, cy, rx, ry) {
    cx *= Z; cy *= Z; rx *= Z; ry *= Z;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (Hh(x, y, 831) - 0.5) * 0.18;
      if (d < 1) g.set(x, y, Hh(x, y, 832) < 0.1 && d < 0.75 ? 'w' : '~');
    }
  }
  const put = (g, x, y, ch) => g.set(z(x), z(y), ch);
  // entrée franche sur un bord (3 cases de large, à la hauteur y du plan)
  const gateRows = (g, side, y) => g.rect(side === 'left' ? 0 : W - 3, z(y), 3, 3, '=');
  // lisière irrégulière : 2 rangées d'arbres, plus quelques arbres en avancée
  function edge(g, seed) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (d <= 1 || (d === 2 && Hh(x, y, 840 + seed) < 0.45)) g.set(x, y, 'T');
    }
  }
  // zones protégées (emprise + jardinet devant + marge) : pas d'arbre ni de rocher ; extra en coordonnées du plan
  const protectedSet = (list, extra = []) => {
    const P = new Set();
    for (const L of list) for (let y = L.y - 1; y < L.y + L.h + 3; y++) for (let x = L.x - 1; x < L.x + L.w + 1; x++) P.add(x + ',' + y);
    for (const [x0, y0, r] of extra) { const x = z(x0), y = z(y0); for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) P.add((x + i) + ',' + (y + j)); }
    return P;
  };
  // bosquets, buissons, fleurs, rochers, souches sur l'herbe libre
  function nature(g, P, seed, dens = 1) {
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (g.get(x, y) !== '.' || P.has(x + ',' + y)) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => '=¢z_'.includes(g.get(x + a, y + b)));
      const r = Hh(x, y, 850 + seed), clump = DW.Art.noise(x * 0.18, y * 0.18, 851 + seed);
      if (!near && clump > 0.7 && r < 0.42 * dens) g.set(x, y, 'T');
      else if (!near && r < 0.03 * dens) g.set(x, y, 'b');
      else if (r < 0.1) g.set(x, y, 'f');
      else if (!near && r < 0.11 * dens) g.set(x, y, Hh(x, y, 852) < 0.5 ? 'r' : 'k');
      else if (!near && clump < 0.25 && r < 0.45) g.set(x, y, ',');
    }
  }
  // massif de fleurs au coin de certains jardins
  function gardens(g, list, seed) {
    for (const L of list) {
      if (L.kind !== 'cottage' || Hh(L.x, L.y, 860 + seed) < 0.4) continue;
      g.set(L.x - 1, L.y + L.h, 'd');
    }
  }
  function district(id, def) {
    MAPS[id] = {
      name: def.name, music: 'village', bg: 'foret', ambient: 'town', theme: def.theme || 'town', climate: 'village', region: 'village',
      ...DW.MapKit.DW1_GROUND,
      build() {
        const lv = level(), built = def.lots.filter(L => lv >= L.min).length;
        const version = `${built}|${(def.exits || []).map(e => (lv >= e.min ? 1 : 0)).join('')}|${DW.Town.level()}`;
        if (this.version === version && this.rows) return;
        this.version = version;
        this.rows = paint(W, H, '.', g => {
          def.paint(g, lv);
          // emprise et devant de chaque emplacement : dégagés (ni arbre, ni buisson, ni rocher)
          for (const L of def.lots) for (let y = L.y; y < L.y + L.h + 1; y++) for (let x = L.x; x < L.x + L.w; x++) if ('Tbrk,'.includes(g.get(x, y))) g.set(x, y, '.');
          // pas d'arbre ni de rocher sous les décors fixes (statue, lampadaires, bancs...) : aucune superposition
          for (const o of def.fixed ? def.fixed(lv) : []) if (!o.top) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) if ('Tbrk,'.includes(g.get(x, y))) g.set(x, y, '.');
        });
        // sorties vers les autres quartiers : chemin ouvert seulement quand le quartier voisin existe
        for (const e of def.exits || []) if (lv < e.min) this.rows = this.rows.map((r, y) => y >= e.y0 && y <= e.y1 ? r.slice(0, e.x0) + 'T'.repeat(e.x1 - e.x0 + 1) + r.slice(e.x1 + 1) : r);
        // pas de promeneur « derrière » un toit : l'herbe couverte par le haut des bâtiments devient infranchissable
        const g = this.rows.map(r => [...r]), fronts = new Set();
        for (const L of def.lots) for (let x = L.x; x < L.x + L.w; x++) fronts.add(x + ',' + (L.y + L.h));
        for (const L of def.lots) if (lv >= L.min) {
          const above = Math.ceil((DW.World.obj(L.kind, L.v || 0).h - L.h * 16) / 16);
          for (let y = L.y - above; y < L.y; y++) for (let x = L.x; x < L.x + L.w; x++) if (g[y] && '.f,'.includes(g[y][x]) && !fronts.has(x + ',' + y)) g[y][x] = 'ŧ';
        }
        this.rows = g.map(r => r.join(''));
        // promeneurs : sur les chemins, espacés
        this.walkSpots = [];
        for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++)
          if ('=¢'.includes(this.rows[y][x]) && Hh(x, y, def.seed) < 0.08 && !this.walkSpots.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 7)) this.walkSpots.push([x, y]);
        this.objects = [...(def.fixed ? def.fixed(lv) : [])];
        this.doors = [];
        for (const L of def.lots) {
          if (lv < L.min) continue;
          this.objects.push({ kind: L.kind, v: L.v || 0, x: L.x, y: L.y, w: L.w, h: L.h });
          if (L.door) this.doors.push({ ...L.door, dir: 'up', to: L.home, tx: DOOR_X, ty: ROOM_H + 2 });
          // façade : jardinière à gauche, boîte aux lettres (couleur de l'habitant, lanterne le soir) à droite
          if (L.door && L.home && !FOOD_SHOPS[L.kind]) {
            const fy = L.y + L.h, dx0 = L.door.x, dx1 = L.door.x + L.door.w - 1, res = (MAPS[L.home] || {}).owner;
            const t0 = res ? (DW.SPECIES[res].types || ['Neutre'])[0] : 'Neutre';
            const v = { 'Feu': 0, 'Eau': 1, 'Plante': 2, 'Insecte': 2, 'Électrique': 3, 'Glace': 4, 'Air': 4, 'Ténèbres': 5 }[t0] ?? 6;
            const free = x => x < dx0 - 1 || x > dx1 + 1;
            if (free(L.x + L.w - 1) && '.f,'.includes(this.rows[fy][L.x + L.w - 1])) this.objects.push({ kind: 'housebox', v, x: L.x + L.w - 1, y: fy, w: 1, h: 1, small: true });
            if (free(L.x) && L.w >= 3 && '.f,'.includes(this.rows[fy][L.x])) this.objects.push({ kind: 'planter', v: (L.x + L.y) % 3, x: L.x, y: fy, w: 1, h: 1, small: true });
          }
        }
        this.signs = { ...(def.signs ? def.signs(lv) : {}) };
        if (DW.Story.placeKiosks) DW.Story.placeKiosks(this, id);   // stands des recrues (story.js)
        DW.World.unprepare(this); delete this.w;
      },
      populate() {
        // habitants qui se promènent : plus la ville grandit, plus il y a de monde
        const lv = level(), S = this.walkSpots || [], n = Math.max(0, Math.min(S.length, 12, Math.floor((lv - def.open) / 2) + 1));
        this.npcs = S.slice(0, n).map(([x, y], i) => {
          const sp = citizenOf(def.seed + i * 31), line = lineOf(def.seed + i * 29);
          return sp && { sp, x, y, face: i % 2 ? 'left' : 'right', wander: 2, citizen: true, talk: () => say(dite(line, def.seed + i * 29), nameOf(sp)) };
        }).filter(Boolean);
      },
      rows: null, objects: [], npcs: [], doors: [], signs: {}, warps: def.warps,
    };
    def.lots = lots(def.lots, id, def.prefix);
  }
  // les maisons se construisent une à une entre l'ouverture du quartier et le palier maximum (16) : toutes existent à 100 %
  const progressive = (list, open, step) => list.map((L, i) => ({ ...L, min: Math.min(16, open + Math.floor(i * Math.min(step, (16 - open) / Math.max(1, list.length - 1)))) }));
  const C = (x, y, v) => ({ kind: 'cottage', v, x, y });
  const EXIT_Y = z(14);   // rangées des passages est / ouest entre quartiers

  // ============================================================ QUARTIER RÉSIDENTIEL (nord de la ville) : hameau de chaumières
  // ouverture (paliers sur 16) : le Résidentiel avec la route du nord de la ville (niveau 3 de la ville : maps/village.js),
  // le Marché au niveau 6, le Numérique au niveau 10
  const OPEN = { residentiel: 4, marche: 8, numerique: 14 };
  {
    const list = [C(26, 5, 0), C(15, 4, 1), C(10, 11, 2), C(16, 11, 3), C(27, 10, 1), C(4, 4, 3), C(9, 18, 0), C(3, 19, 1), C(16, 20, 2),
      C(26, 19, 3), C(5, 25, 2), C(12, 26, 0), C(18, 27, 1), C(28, 27, 0), C(35, 28, 2), C(41, 9, 0), C(39, 2, 3)];
    district('residentiel', {
      name: 'Quartier Résidentiel', prefix: 'maison_r', open: OPEN.residentiel, seed: 11,
      lots: progressive(list, OPEN.residentiel, 1.9),
      exits: [{ min: OPEN.numerique, x0: 0, x1: 2, y0: EXIT_Y, y1: EXIT_Y + 2 }, { min: OPEN.marche, x0: W - 3, x1: W - 1, y0: EXIT_Y, y1: EXIT_Y + 2 }],
      paint(g, lv) {
        edge(g, 1);
        // ruisseau qui descend du nord vers l'étang, puis repart vers le sud-est
        water(g, [[38, -1], [36, 5], [33, 11], [34, 17]], 0.9);
        pond(g, 36, 21, 4.6, 2.9);
        water(g, [[39, 23], [42, 27], [45, 31], [48, 33]], 0.8);
        // chemins de terre (ponts automatiques sur le ruisseau)
        trail(g, [[23.5, 34], [23.5, 29], [22, 23], [23, 16], [24, 10], [22, 4]], 1.3, '=', 1);
        trail(g, [[22.5, 16], [14, 15.5], [6, 16.5], [-1, 15]], 1.05, '=', 2);
        gateRows(g, 'left', 14); gateRows(g, 'right', 14);
        trail(g, [[23, 16], [32, 14.5], [40, 15.5], [48, 15]], 1.05, '=', 3);
        trail(g, [[24, 10], [15, 8], [9, 9.5], [7, 15]], 0.85, '=', 4);
        trail(g, [[22.5, 23], [30, 25.5], [38, 26], [42, 21], [42, 13]], 0.85, '=', 5);
        trail(g, [[23.5, 30], [23.5, 34]], 1.1, '=', 6);
        // nature, jardins, petits aménagements
        nature(g, protectedSet(this.lots, [[23, 16, 2], [33, 16, 1]]), 1);
        gardens(g, this.lots.filter(L => lv >= L.min), 1);   // seulement devant les maisons déjà construites
        // place d'entrée : clairière dégagée derrière le portail, chemin élargi
        for (let y = H - 10; y < H - 1; y++) for (let x = z(23.5) - 8; x <= z(23.5) + 7; x++) if ('Tbrk,'.includes(g.get(x, y))) g.set(x, y, Hh(x, y, 77) < 0.25 ? 'f' : '.');
        g.rect(z(23.5) - 2, H - 10, 4, 10, '=');
        put(g, 21, 31, 'S'); put(g, 25, 18, 'e');
        for (const [x, y] of [[21, 9], [26, 22], [20, 17]]) if (g.get(z(x), z(y)) === '.' || g.get(z(x), z(y)) === 'f') put(g, x, y, 'i');
      },
      fixed: () => [
        { kind: 'districtgate', v: 0, x: z(23.5) - 3, y: H - 3, w: 6, h: 3, top: true },
        // accueil : lampadaires de part et d'autre du chemin, massifs fleuris, banc
        { kind: 'lamp', v: 0, x: z(23.5) - 4, y: H - 4, w: 1, h: 1, small: true }, { kind: 'lamp', v: 0, x: z(23.5) + 3, y: H - 4, w: 1, h: 1, small: true },
        { kind: 'flowerbed', v: 0, x: z(23.5) - 6, y: H - 5, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 1, x: z(23.5) + 5, y: H - 5, w: 1, h: 1, small: true },
        { kind: 'flowerbed', v: 2, x: z(23.5) - 5, y: H - 8, w: 1, h: 1, small: true }, { kind: 'bench', v: 0, x: z(23.5) + 4, y: H - 8, w: 2, h: 1 },
        { kind: 'digistatue', v: 0, x: z(20), y: z(13), w: 3, h: 1 },
      ],
      // (le panneau n'annonce un quartier voisin qu'une fois construit : avant, son chemin n'existe pas — exits)
      signs: lv => ({ [`${z(21)},${z(31)}`]: `Quartier Résidentiel — ${DW.Town.RECRUITS.filter(r => DW.Town.has(r.id)).length} habitants en ville.${lv >= OPEN.marche ? ' Est : Quartier du Marché.' : ''}${lv >= OPEN.numerique ? ' Ouest : Quartier Numérique.' : ''}` }),
      warps: [{ x: z(23.5) - 1, y: H - 1, w: 2, h: 1, dir: 'down', to: 'village', tx: 11, ty: 0 },
        { x: 0, y: EXIT_Y, w: 1, h: 3, dir: 'left', to: 'numerique', tx: W - 1, ty: EXIT_Y },
        { x: W - 1, y: EXIT_Y, w: 1, h: 3, dir: 'right', to: 'marche', tx: 0, ty: EXIT_Y }],
    });
  }

  // ============================================================ QUARTIER DU MARCHÉ (est du Résidentiel) : place de terre battue
  {
    const S = (kind, v, x, y) => ({ kind, v, x, y });
    const list = [
      S('marketstall', 0, 14, 11), S('marketstall', 1, 31, 10), S('bakery', 0, 6, 3), S('patisserie', 0, 29, 3),
      S('marketstall', 2, 13, 19), S('marketstall', 0, 32, 20), C(2, 25, 1), S('shopfront', 1, 13, 4), C(36, 26, 3),
      S('marketstall', 1, 20, 22), S('shopfront', 3, 36, 4), C(11, 25, 0), S('marketstall', 2, 26, 8), C(29, 27, 2), C(42, 12, 1), C(17, 26, 3),
    ];
    const tower = { x: z(22), y: z(14), w: 4, h: 2 };
    const clock = () => say(`L'horloge de la tour indique ${DW.Time.str()}. Dong... dong...`);
    district('marche', {
      name: 'Quartier du Marché', prefix: 'maison_m', open: OPEN.marche, seed: 23,
      lots: progressive(list, OPEN.marche, 1.9),
      paint(g) {
        edge(g, 2);
        // grande place de terre battue, bords irréguliers
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot((x / Z - 23.5) / 12.5, (y / Z - 16) / 7.2) + (Hh(x, y, 870) - 0.5) * 0.15 < 1) g.set(x, y, '=');
        trail(g, [[-1, 15], [6, 15.5], [12, 15]], 1.1, '=', 7);
        gateRows(g, 'left', 14);
        trail(g, [[23.5, 9], [22, 6], [17, 7.5], [10, 7], [6, 8]], 0.9, '=', 8);
        trail(g, [[23.5, 9], [27, 6.5], [33, 7.5], [39, 8]], 0.9, '=', 9);
        trail(g, [[23.5, 23], [22, 27], [24, 31]], 0.95, '=', 10);
        trail(g, [[12, 22], [8, 24.5], [8, 29], [16, 30.5], [32, 31], [40, 30]], 0.85, '=', 11);
        pond(g, 41, 20, 2.6, 1.8);
        nature(g, protectedSet(this.lots, [[23, 15, 3]]), 2, 0.9);
        put(g, 4, 13, 'S');
      },
      fixed: () => [{ kind: 'clocktower', ...tower }, { kind: 'digistatue', v: 1, x: z(17), y: z(17), w: 3, h: 1 }, { kind: 'well', x: z(29), y: z(17), w: 1, h: 1, small: true }],
      signs: () => {
        const s = { [`${z(4)},${z(13)}`]: 'Quartier du Marché — Étals, boutiques et la grande tour de l\'horloge.  Ouest : Quartier Résidentiel.' };
        for (let x = tower.x; x < tower.x + tower.w; x++) s[`${x},${tower.y + tower.h - 1}`] = clock;
        return s;
      },
      warps: [{ x: 0, y: EXIT_Y, w: 1, h: 3, dir: 'left', to: 'residentiel', tx: W - 1, ty: EXIT_Y }],
    });
  }

  // ============================================================ QUARTIER NUMÉRIQUE (ouest du Résidentiel) : tours de données dans la nature
  {
    const T = (v, x, y) => ({ kind: 'datatower', v, x, y }), A = (x, y) => ({ kind: 'apartment', v: 1, x, y });
    const list = [T(0, 9, 5), C(14, 3, 2), T(1, 31, 6), C(4, 10, 0), A(36, 9), T(0, 7, 21), C(29, 19, 1), T(1, 34, 20), C(13, 25, 3), A(3, 26),
      T(0, 18, 19), C(30, 26, 2), C(38, 27, 0), T(1, 22, 3)];
    district('numerique', {
      name: 'Quartier Numérique', prefix: 'maison_n', open: OPEN.numerique, seed: 37,
      lots: progressive(list, OPEN.numerique, 1.9),
      paint(g) {
        edge(g, 3);
        // chemins de terre qui serpentent entre les tours et les arbres
        trail(g, [[48, 15], [38, 15.5], [26, 16.5], [14, 15.5], [4, 17]], 1.15, '=', 12);
        gateRows(g, 'right', 14);
        trail(g, [[25, 16], [24, 10], [19, 6.5], [12, 8.5]], 0.9, '=', 13);
        trail(g, [[25, 16], [27, 23], [22, 29], [12, 30]], 0.9, '=', 14);
        trail(g, [[38, 15.5], [40, 23], [34, 30]], 0.85, '=', 15);
        // bassin de refroidissement
        pond(g, 30, 11, 3, 1.9);
        nature(g, protectedSet(this.lots, [[25, 16, 2]]), 3, 0.8);
        // décor numérique : antennes, panneaux de circuit, tuyaux, monolithes
        for (const [x, y, ch] of [[20, 13, '!'], [33, 13, '?'], [15, 19, '$'], [35, 18, '$'], [23, 20, '<'], [29, 14, '<'], [6, 14, '!'], [43, 19, '?']])
          if ('.f,'.includes(g.get(z(x), z(y)))) put(g, x, y, ch);
        g.set(W - 5, EXIT_Y - 1, 'S');
      },
      fixed: () => [[11, 14], [40, 13]].map(([x, y]) => ({ kind: 'cablepole', x: z(x), y: z(y), w: 1, h: 1, small: true })),
      signs: () => ({ [`${W - 5},${EXIT_Y - 1}`]: 'Quartier Numérique — Les tours de données relient la ville au réseau de l\'île.  Est : Quartier Résidentiel.' }),
      warps: [{ x: W - 1, y: EXIT_Y, w: 1, h: 3, dir: 'right', to: 'residentiel', tx: 0, ty: EXIT_Y }],
    });
  }

  // ------------------------------------------------------------ API
  DW.Quartiers = {
    OPEN,
    open: id => level() >= (OPEN[id] || 0),
  };
})();
;

// ===== js/maps/enigmes.js
'use strict';
// =====================================================================
//  ÉNIGMES DES DONJONS — briques réutilisables (maps/donjons.js s'en sert)
//  Chaque énigme a un identifiant ; son état est gardé dans state.enigmes[id] = { solved, ... }.
//  - barrier(m, id, cells, msg)   : barrière de données sur des cases, levée quand l'énigme id est résolue
//  - braziers(m, id, spots, order, hint) : vasques à allumer dans l'ordre (une erreur les éteint toutes)
//  - plates(m, id, spots)         : dalles à presser en marchant dessus (toutes)
//  - riddle(m, id, x, y, o)       : stèle qui pose une question (o : { q, choices, answer, ok, ko })
//  - stele(m, x, y, text)         : stèle d'indice (texte simple)
//  Toutes acceptent des coordonnées de la pièce (pièces de DW.Palais, sans mise à l'échelle).
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const all = () => (DW.state.enigmes = DW.state.enigmes || {});
  const E = DW.Enigmes = {
    state: id => (all()[id] = all()[id] || {}),
    solved: id => !!(all()[id] && all()[id].solved),
    async solve(id, ow, msg = 'Un grondement sourd... La barrière de données se dissipe !') {
      E.state(id).solved = true;
      DW.Audio.sfx('super'); if (ow) ow.shake = 0.5;
      await say(msg);
      DW.autosave();
    },
    barrier(m, id, cells, msg = "Une barrière de données ferme le passage. Il doit y avoir un mécanisme quelque part...") {
      for (const [x, y] of cells) m.npcs.push({ obj: 'datagate', x, y, gate: true, cond: () => !E.solved(id), talk: () => say(msg) });
    },
    braziers(m, id, spots, order, hint) {
      const lit = () => E.state(id).seq || [];
      spots.forEach(([x, y], i) => m.npcs.push({ obj: 'brazier', x, y, ov: () => (E.solved(id) || lit().includes(i) ? 1 : 0), talk: async ow => {
        if (E.solved(id) || lit().includes(i)) { await say('La flamme brûle doucement.'); return; }
        if ((await DW.ask('Allumer cette vasque ?')) !== 0) return;
        const S = E.state(id), seq = S.seq = [...lit(), i];
        if (seq[seq.length - 1] !== order[seq.length - 1]) {
          S.seq = []; DW.Audio.sfx('bump'); if (ow) ow.shake = 0.3;
          await say("Toutes les flammes s'éteignent d'un coup... Ce n'était pas le bon ordre.");
          if (hint) await say(`(Indice : ${hint})`);
          return;
        }
        DW.Audio.sfx('fire');
        if (seq.length === order.length) await E.solve(id, ow, 'Les flammes se mettent à danser ensemble... La barrière de données se dissipe !');
        else await say(`La vasque s'embrase ! (${seq.length} / ${order.length})`);
      } }));
    },
    plates(m, id, spots) {
      const pressed = () => (E.state(id).p = E.state(id).p || {});
      spots.forEach(([x, y], i) => {
        m.npcs.push({ obj: 'floorplate', x, y, walk: true, ov: () => (E.solved(id) || pressed()[i] ? 1 : 0), talk: () => say('Une dalle gravée de circuits. Elle semble réagir au poids.') });
        (m.triggers = m.triggers || []).push({ x, y, cond: () => !E.solved(id) && !pressed()[i], run: async ow => {
          pressed()[i] = true; DW.Audio.sfx('select');
          const n = Object.keys(pressed()).length;
          if (n >= spots.length) await E.solve(id, ow, 'Toutes les dalles brillent ! La barrière de données se dissipe !');
          else await say(`La dalle s'illumine sous tes pieds. (${n} / ${spots.length})`);
        } });
      });
    },
    riddle(m, id, x, y, o) {
      m.objects.push({ kind: 'monolith', x, y, w: 1, h: 1 });
      m.signs[`${x},${y}`] = async ow => {
        if (E.solved(id)) { await say(o.done || 'Les inscriptions de la stèle se sont éteintes.'); return; }
        await say(o.q);
        const r = await DW.ask(o.ask || 'Ta réponse ?', o.choices, null, false);
        if (r === o.answer) await E.solve(id, ow, o.ok || 'La stèle brille... La barrière de données se dissipe !');
        else { DW.Audio.sfx('bump'); await say(o.ko || 'La stèle reste muette. Ce n\'est pas la bonne réponse.'); }
      };
    },
    stele(m, x, y, text) {
      m.objects.push({ kind: 'monolith', x, y, w: 1, h: 1 });
      m.signs[`${x},${y}`] = text;
    },
  };
})();
;

// ===== js/maps/donjons.js
'use strict';
// =====================================================================
//  DONJONS SECRETS DES ÉCUSSONS — la quête des enfants perdus (voir data/ecussons.js)
//  Un donjon par DigiSélectionné, caché dans une région : un portail ancien gravé de son symbole
//  (pièce maîtresse d'une sous-zone, ajoutée par regions.js) mène à trois salles reliées :
//    hall (indice + énigme 1) → galerie (énigme 2) → sanctuaire (gardien à Engrenage Noir, puis l'enfant et son écusson).
//  Le donjon de ton propre héros ne contient que ton écusson.
//  Ajouter un donjon = ajouter une entrée à LIST (énigmes : voir maps/enigmes.js).
// =====================================================================
(function () {
  const { room, side } = DW.Palais;
  const E = DW.Enigmes, C = DW.Crests, MAPS = DW.MAPS;
  const say = (t, s) => DW.say(t, s);
  const W = 20, H = 15, MID = 7;   // pièces à la taille de l'écran (DW.Palais.room) ; passages latéraux en y = 7 et 8

  // ------------------------------------------------------------ les sept donjons
  // sub : sous-zone qui porte le portail ; guard : [espèce, bonus de niveau] ; a / b : énigmes du hall et de la galerie
  const LIST = [
    { kid: 'joe', region: 'montagne', sub: 6, name: 'Refuge du Glacier', guard: ['ogremon', 4],
      floor: ['#9aa4b0', '#7a8490', '#4a525c'], wall: ['#6a7480', '#5a6470', 'brick'], dark: 0.25,
      hint: 'Ici, la vérité ouvre les portes. Réponds sans mentir, puis marche sur les dalles qui se souviennent.',
      a: { type: 'riddle', q: 'Plus on en prend, plus on en laisse derrière soi. Que suis-je ?', choices: ['Des pas', 'Des Bits', 'Des souvenirs'], answer: 0 },
      b: { type: 'plates', spots: [[5, 5], [14, 5], [9, 11]] },
      words: ["Ah ! Enfin quelqu'un ! Je suis Joe... J'ai cru que j'allais rester enfermé ici pour toujours.", "Une ombre m'a poussé dans ce refuge, et ces barrières se sont fermées derrière moi. Merci, vraiment !"] },
    { kid: 'tk', region: 'brumes', sub: 9, name: 'Chapelle des Brumes', guard: ['bakemon', 4],
      floor: ['#7a6a9a', '#5a4a7a', '#2a2040'], wall: ['#4a3a6a', '#3a2e5a', 'diamond'], dark: 0.4,
      hint: 'Le soleil se lève à l\'est, monte tout en haut du ciel, puis se couche à l\'ouest.',
      a: { type: 'braziers', spots: [[5, 6], [9, 4], [14, 6]], order: [2, 1, 0] },
      b: { type: 'riddle', q: 'Je brille même dans la nuit la plus noire, et je grandis quand on me partage. Que suis-je ?', choices: ['La lune', "L'espoir", 'Une lanterne'], answer: 1 },
      words: ["C'est toi ! Je savais que quelqu'un viendrait ! Moi c'est T.K.", "Il faisait tout noir et les fantômes chantaient... mais je n'ai pas pleuré. Enfin... presque pas."] },
    { kid: 'sora', region: 'volcan', sub: 5, name: 'Nid de Braises', guard: ['meramon', 5],
      floor: ['#8a4a3a', '#6a3226', '#2a120c'], wall: ['#6a3a2e', '#5a2e24', 'brick'], dark: 0.3,
      hint: "Les vasques entourent le cœur du nid. L'amour part du cœur — la flamme du bas — puis fait le tour dans le sens des aiguilles d'une montre.",
      a: { type: 'plates', spots: [[4, 5], [15, 5], [4, 11], [15, 11]] },
      b: { type: 'braziers', spots: [[9, 4], [14, 8], [9, 12], [4, 8]], order: [2, 3, 0, 1] },
      words: ["Merci... Je m'appelle Sora. Il faisait si chaud ici que je n'arrivais plus à réfléchir.", "Tu es venu jusqu'ici tout seul ? Tu es quelqu'un de bien, tu sais."] },
    { kid: 'izzy', region: 'usine', sub: 6, name: 'Archives de Données', guard: ['kabuterimon', 4],
      floor: ['#5a6a7a', '#3e4c5a', '#1a222c'], wall: ['#4a5a6a', '#3a4856', 'stripes'], dark: 0.2,
      hint: "Journal de maintenance : « Séquence d'allumage : la deuxième, puis la quatrième, puis la première, et enfin la troisième (en comptant depuis la gauche). »",
      a: { type: 'riddle', q: 'Code de la porte : 1, 2, 4, 8... Quel est le nombre suivant ?', choices: ['12', '16', '10'], answer: 1 },
      b: { type: 'braziers', spots: [[4, 5], [8, 5], [12, 5], [16, 5]], order: [1, 3, 0, 2] },
      words: ["Fascinant ! Ces barrières de données tournaient en boucle... Je n'arrivais pas à casser le code de l'intérieur.", 'Je suis Izzy. Ton Digivice a forcé le système, on dirait. Il faudra que je l\'étudie !'] },
    { kid: 'mimi', region: 'jouets', sub: 8, name: 'Jardin Secret des Jouets', guard: ['togemon', 4],
      floor: ['#f0c8e0', '#d8a8c8', '#a87898'], wall: ['#f0b8d8', '#e0a0c8', 'dots'], dark: 0,
      hint: "Une fleur s'ouvre du cœur vers les pétales : d'abord le centre, puis la gauche, puis la droite.",
      a: { type: 'braziers', spots: [[5, 6], [9, 6], [14, 6]], order: [1, 0, 2] },
      b: { type: 'plates', spots: [[3, 4], [16, 4], [9, 7], [3, 11], [16, 11]] },
      words: ["Oh là là, enfin ! Je suis Mimi ! Les jouets ne voulaient plus me laisser partir, ils voulaient que je joue avec eux pour toujours...", 'Mes chaussures sont toutes sales ! Mais bon, merci quand même. Beaucoup !'] },
    { kid: 'matt', region: 'gel', sub: 8, name: 'Palais de Givre', guard: ['garurumon', 4],
      floor: ['#c8e0f0', '#a0c4dc', '#6890b0'], wall: ['#a8c8e0', '#90b4d0', 'diamond'], dark: 0.15,
      hint: "Sur la glace, chaque dalle garde l'empreinte d'un ami. Marche sur toutes, puis réponds à la stèle de la galerie.",
      a: { type: 'plates', spots: [[3, 5], [16, 5], [6, 9], [13, 9], [9, 12]] },
      b: { type: 'riddle', q: "On ne me voit pas, mais je relie deux cœurs, même très loin l'un de l'autre. Que suis-je ?", choices: ['Un câble', "L'amitié", 'Le vent'], answer: 1 },
      words: ['...Merci. Je suis Matt.', "Tu n'aurais pas vu mon petit frère, T.K. ? S'il lui arrive quelque chose..."] },
    { kid: 'tai', region: 'dino', sub: 8, name: 'Temple du Courage', guard: ['greymon', 6],
      floor: ['#a88a5a', '#86683e', '#3e2e18'], wall: ['#8a6a44', '#765836', 'brick'], dark: 0.3,
      hint: "Cinq flammes, comptées depuis la gauche. Les impaires d'abord, de droite à gauche ; puis les paires, de gauche à droite.",
      a: { type: 'braziers', spots: [[3, 6], [6, 6], [9, 6], [12, 6], [15, 6]], order: [4, 2, 0, 1, 3] },
      b: { type: 'riddle', q: "Ce n'est pas l'absence de peur, c'est avancer malgré elle. Qu'est-ce que c'est ?", choices: ['La colère', 'Le courage', 'La chance'], answer: 1 },
      words: ["Ouf ! Merci ! Moi c'est Tai !", "J'ai foncé tête baissée dans ce temple... et les portes se sont refermées. Bon, ça m'apprendra à réfléchir un peu avant !"] },
  ];
  const IDX = k => C.ORDER.indexOf(k);
  const lvOf = rid => ((DW.Wild && DW.Wild.TABLES[rid]) || [10])[0];
  const encOf = rid => {
    const T = DW.Wild && DW.Wild.TABLES[rid];
    if (!T) return [];
    return T[1].split(/\s+/).filter(t => !t.includes('@')).slice(0, 3).map(t => { const [sp, w] = t.split(':'); return { sp, min: T[0], max: T[0] + 2, w: parseInt(w, 10) }; }).filter(e => DW.SPECIES[e.sp]);
  };

  // ------------------------------------------------------------ construction d'un donjon
  function build(D) {
    const id = 'donjon_' + D.kid, R = D.region, k = D.kid, crest = C.name(k);
    const floor = { type: 'stone', cols: D.floor }, wall = { base: D.wall[0], alt: D.wall[1], pattern: D.wall[2], wood: D.floor[2] };
    const dark = D.dark ? { d: D.dark, col: D.wall[1] } : null, enc = encOf(R);
    const hall = room(id + '_hall', R, { music: 'dungeon', name: `${D.name} — Entrée`, w: W, h: H, floor, wall, dark, enc,
      objects: [{ kind: 'torch', x: 2, y: 3, w: 1, h: 1, small: true }, { kind: 'torch', x: 17, y: 3, w: 1, h: 1, small: true }, { kind: 'gargoyle', x: 2, y: 11, w: 1, h: 1 }] });
    const gal = room(id + '_galerie', R, { music: 'dungeon', name: `${D.name} — Galerie`, w: W, h: H, floor, wall, dark, enc,
      objects: [{ kind: 'torch', x: 2, y: 3, w: 1, h: 1, small: true }, { kind: 'torch', x: 17, y: 3, w: 1, h: 1, small: true }] });
    const sanc = room(id + '_sanctuaire', R, { music: 'dungeon', name: `${D.name} — Sanctuaire`, w: W, h: H, floor, wall, dark: dark ? { d: dark.d * 0.6, col: dark.col } : null,
      objects: [{ kind: 'pedestal', v: IDX(k), x: 9, y: 4, w: 1, h: 1 }, { kind: 'gargoyle', x: 4, y: 4, w: 1, h: 1 }, { kind: 'gargoyle', x: 15, y: 4, w: 1, h: 1 }] });
    sanc.calm = true;   // aucun Digimon sauvage dans le sanctuaire
    side(id + '_hall', id + '_galerie'); side(id + '_galerie', id + '_sanctuaire');
    DW.Palais.entrance(id + '_hall');
    hall.onEnter = () => { DW.state.flags.crestSeen = true; };   // la page ÉCUSSONS du Journal apparaît
    // énigmes et barrières (devant chaque passage vers la salle suivante)
    const puzzle = (m, P, pid) => {
      if (P.type === 'riddle') E.riddle(m, pid, 9, 9, P);
      else if (P.type === 'braziers') E.braziers(m, pid, P.spots, P.order, D.hint);
      else if (P.type === 'plates') E.plates(m, pid, P.spots);
      E.barrier(m, pid, [[W - 2, MID], [W - 2, MID + 1]]);
    };
    E.stele(hall, 4, 4, `Une stèle ancienne, gravée du symbole de l'écusson ${crest} : « ${D.hint} »`);
    puzzle(hall, D.a, id + '_a'); puzzle(gal, D.b, id + '_b');
    // sanctuaire : gardien possédé, puis l'enfant (ou ton écusson seul)
    const gk = id + '_gardien', guardLv = lvOf(R) + D.guard[1], gName = DW.SPECIES[D.guard[0]].name;
    sanc.npcs.push({ sp: D.guard[0], x: 9, y: 9, face: 'down', gear: true, cond: () => !E.solved(gk), talk: async ow => {
      await say(`Un Engrenage Noir tourne dans le dos de ${gName}... Il garde le sanctuaire.`);
      await say('PERSONNE... NE PASSE...', gName);
      if (!DW.state.party.some(m => m.hp > 0)) { await say('Il te faut un Digimon en forme pour l\'affronter !'); return; }
      if ((await DW.ask(`Affronter ${gName} ?`)) !== 0) return;
      const res = await ow.battle({ enemy: new DW.Digimon(D.guard[0], guardLv), boss: true, canLose: true, intro: `${gName}, possédé, défend le sanctuaire !` });
      if (res !== 'win') { await say(`${gName} est trop fort pour l'instant... Entraîne-toi et reviens.`); return; }
      await E.solve(gk, ow, `L'Engrenage Noir se brise ! ${gName} reprend ses esprits et s'éloigne en titubant.`);
    } });
    const own = () => DW.state.hero === k;
    const takeCrest = async ow => {
      if (C.has(k)) { await say(`Le piédestal est vide. L'écusson ${crest} est avec toi.`); return; }
      if (!E.solved(gk)) { await say(`${gName} se dresse entre toi et le piédestal...`); return; }
      C.give(k); DW.Audio.sfx('fanfare'); if (ow) ow.shake = 0.4;
      const ults = C.ULTIMES[k].map(sp => DW.SPECIES[sp].name).join(', ');
      await say(`Tu obtiens l'écusson ${crest} !`);
      await say(`Le Digivice s'illumine : les Digimon de cette famille peuvent désormais digivoluer au stade Ultime (${ults}).`);
      if (C.count() === C.ORDER.length) await say('Les sept écussons brillent ensemble... La Digivolution Méga est désormais possible !');
      DW.autosave();
    };
    sanc.signs['9,4'] = async ow => {
      if (!own() && !C.kidFound(k)) { await say("Un écusson repose sur le piédestal... mais quelqu'un est enfermé ici. Parle-lui d'abord !"); return; }
      if (own() && !C.has(k)) await say(`Ton Digivice vibre... Cet écusson t'attendait depuis le début : c'est le tien.`);
      await takeCrest(ow);
    };
    sanc.npcs.push({ hero: k, x: 11, y: 6, face: 'down', cond: s => s.hero !== k && !(s.kids || {})[k], talk: async ow => {
      const name = DW.HEROES[k].name;
      if (!E.solved(gk)) { await say(`À l'aide ! ${gName} ne me laisse pas sortir !`, name); return; }
      for (const l of D.words) await say(l, name);
      await say(`Tiens, cet écusson brillait à côté de moi depuis que je suis ici. C'est l'écusson ${crest}... Il sera plus utile avec toi et ton partenaire.`, name);
      C.freeKid(k);
      await takeCrest(ow);
      await say(`Je rentre à la Ville des Fichiers, chez Jijimon. On se retrouve là-bas ! Les autres enfants sont peut-être encore quelque part sur l'île...`, name);
      DW.autosave();
    } });
  }
  LIST.forEach(build);

  // ------------------------------------------------------------ les enfants délivrés attendent chez Jijimon
  const HOME_SPOTS = [[2, 8], [3, 10], [5, 10], [10, 10], [12, 10], [13, 6], [11, 6]];
  const HOME_WORDS = {
    tai: "Dès que ton Digimon sera prêt, on ira botter les fesses de Devimon !", matt: "Si tu croises T.K., dis-lui que je l'attends ici.",
    sora: "Prends soin de ton partenaire. Il compte sur toi, tu sais.", izzy: "J'analyse les données de nos écussons. Chaque famille de Digimon y réagit différemment !",
    mimi: "Jijimon fait des gâteaux à la viande... Bof. Mais il est gentil !", joe: "Tu es sûr qu'il n'y a pas de danger dehors ? Fais attention à toi, d'accord ?",
    tk: "Quand je serai grand, je serai aussi courageux que toi !",
  };
  if (MAPS.maison) C.ORDER.forEach((k, i) => MAPS.maison.npcs.push({ hero: k, x: HOME_SPOTS[i][0], y: HOME_SPOTS[i][1], face: 'down',
    cond: s => s.hero !== k && !!(s.kids || {})[k] && !(['tai', 'matt', 'sora'].includes(k) && s.hero === 'perso'), talk: () => say(HOME_WORDS[k], DW.HEROES[k].name) }));   // (Tai et Matt vivent dans ta maison)

  // ------------------------------------------------------------ portails dans les régions (lus par regions.js)
  DW.Donjons = {
    LIST,
    // pièce maîtresse de la sous-zone (rid, i) si un donjon s'y trouve
    pieceFor(rid, i) {
      const D = LIST.find(d => d.region === rid && d.sub === i);
      if (!D) return null;
      return { piece: { kind: 'crestgate', v: IDX(D.kid), w: 5, h: 4, door: { to: 'donjon_' + D.kid + '_hall', dw: 2 } },
        pieceSign: async () => { DW.state.flags.crestSeen = true; await say(`Un portail ancien, à moitié caché par le lierre. Au-dessus, un symbole luit faiblement : l'écusson ${C.name(D.kid)}. « ${D.name} »`); } };
    },
  };
})();
;

// ===== js/maps/kuwagamon.js
'use strict';
// =====================================================================
//  KUWAGAMON, PREMIER BOSS DU CHAPITRE 1 (le chapitre se termine plus tard, après Shellmon : maps/antre.js)
//  Il se cache dans le Grand Arbre de la Clairière de l'Arrivée (objet « grandarbre », maps/foret.js).
//  1) trois énigmes sont gravées dans l'écorce, l'une après l'autre : à chaque bonne réponse l'écorce se fissure,
//     à la troisième elle éclate et ouvre le tronc ;
//  2) dans l'arbre, Kuwagamon ; les racines se referment : impossible de ressortir sans le battre ;
//  3) victoire : il se désagrège en données (KuwaDefeatScene), fondu au noir, réveil chez Jijimon :
//     la clairière est calme, il te donne le Trophée de Kuwagamon (il ouvre la cave de ta maison) ;
//  4) le chapitre 1 continue : les cabines de la plage, l'antre de Shellmon et Tai (maps/antre.js), puis la fin du
//     chapitre (game/chapitre1.js, end1).
// =====================================================================
(function () {
  const { UI, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const E = DW.Enigmes, RIDDLE = 'kuwa_arbre', J = 'Jijimon';

  // ------------------------------------------------------------ 1) les trois énigmes gravées sur le Grand Arbre
  const RIDDLES = [
    { q: "« Je n'ai pas de jambes et pourtant je cours. Pas de bouche, mais je murmure. Je traverse la forêt sans jamais m'y arrêter. Qui suis-je ? »",
      choices: ['Le vent', 'La rivière', 'Un Digimon'], answer: 1, hint: 'écoute ce qui coule au Sentier des Murmures, au sud...' },
    { q: "« Plus j'ai de gardiens, moins je suis gardé. Qui suis-je ? »",
      choices: ['Un trésor', 'Une porte', 'Un secret'], answer: 2, hint: 'ce que l\'on confie à un ami, en lui demandant de ne le répéter à personne...' },
    { q: "« Je pousse sans graine à l'ombre des grands arbres, et la nuit je luis sans jamais brûler. Qui suis-je ? »",
      choices: ['Une luciole', 'Un champignon lumineux', 'Une étoile'], answer: 1, hint: 'regarde au pied des arbres du Sentier, la nuit...' },
  ];
  const level = () => (E.solved(RIDDLE) ? 3 : E.state(RIDDLE).n || 0);
  DW.Kuwa_level = level;
  async function tree(ow) {
    const s = st();
    if (s.flags.kuwagamon) { await say("Le Grand Arbre est silencieux. Les petits Digimon de la clairière jouent de nouveau à son pied."); return; }
    if (E.solved(RIDDLE)) { await say("Le tronc éclaté s'ouvre sur un passage sombre. De l'intérieur monte un bourdonnement sourd... BZZZZ..."); return; }
    const n = level(), R = RIDDLES[n];
    await say(n ? `L'écorce est fissurée (${n} / 3). D'autres mots se sont allumés plus bas...` : "Un arbre immense, plus vieux que la forêt. De l'intérieur monte un bourdonnement sourd... Des mots luisent, gravés dans l'écorce. (Attention : une mauvaise réponse réveille un gardien de l'arbre !)");
    await say(R.q);
    const r = await DW.ask('Ta réponse ?', R.choices, null, false);
    if (r !== R.answer) {
      // mauvaise réponse : l'arbre se défend, un Digimon caché dans ses branches attaque (on ne devine plus au hasard)
      Audio.sfx('bump'); ow.shake = 0.6;
      await say("Les mots virent au rouge ! Le bourdonnement enfle... et quelque chose tombe des branches !");
      const list = (DW.getMap('clairiere').encounters || []).filter(e => !e.night && e.sp !== 'kuwagamon'), e = list.length ? DW.weighted(list.map(x => ({ ...x, w: x.w || 1 }))) : { sp: 'kunemon', min: 10, max: 12 };
      if (s.party.some(m => m.hp > 0)) await ow.battle({ enemy: new DW.Digimon(e.sp, DW.rand(e.min, e.max)), intro: "Un Digimon gardien de l'arbre t'attaque !" });
      await say(`(Indice : ${R.hint})`);
      return;
    }
    E.state(RIDDLE).n = n + 1;
    if (n + 1 < 3) {
      Audio.sfx('hit'); ow.shake = 0.5;
      await say(n ? "CRAAAC ! Une deuxième fissure lumineuse zèbre l'écorce. Le bourdonnement devient furieux..." : "CRAC ! Une fissure lumineuse court sur l'écorce. À l'intérieur, quelque chose s'agite...");
      ow.map.populate(); ow.gfx = DW.World.prepare(ow.map);
      DW.autosave(); return;
    }
    // troisième énigme : l'écorce éclate
    E.state(RIDDLE).solved = true;
    Audio.sfx('roar'); ow.shake = 1.6;
    await say("Les fissures s'illuminent toutes ensemble...");
    Audio.sfx('super');
    await DW.fade(1, 0.15, '#ffffff');
    ow.map.populate(); ow.gfx = DW.World.prepare(ow.map);
    await DW.wait(0.2);
    await DW.fade(0, 0.6);
    ow.shake = 1;
    await say("BOUM ! L'écorce explose en mille éclats ! Le tronc s'ouvre sur un passage sombre...");
    DW.autosave();
  }

  // ------------------------------------------------------------ 2) dans l'arbre
  const room = DW.Palais.room('arbre_kuwagamon', 'foret', { music: 'cave', name: 'Cœur du Grand Arbre', w: 20, h: 15,
    floor: { type: 'herring', cols: ['#6a4a2a', '#4a321c', '#2a1a0e'] }, wall: { base: '#5a3a22', alt: '#4a2e1a', pattern: 'stripes', wood: '#2a1a0e' },
    dark: { d: 0.4, col: '#2a1a10' },
    objects: [
      { kind: 'treeroots', v: 0, x: 2, y: 2, w: 2, h: 2, back: true }, { kind: 'treeroots', v: 1, x: 6, y: 2, w: 2, h: 2, back: true },
      { kind: 'treeroots', v: 0, x: 12, y: 2, w: 2, h: 2, back: true }, { kind: 'treeroots', v: 1, x: 16, y: 2, w: 2, h: 2, back: true },
      { kind: 'kuwanest', x: 8, y: 4, w: 4, h: 1 },
      { kind: 'glowshroom', x: 2, y: 4, w: 1, h: 1 }, { kind: 'glowshroom', x: 17, y: 4, w: 1, h: 1 }, { kind: 'glowshroom', x: 3, y: 11, w: 1, h: 1 }, { kind: 'glowshroom', x: 16, y: 12, w: 1, h: 1 },
      { kind: 'hollowlog', x: 14, y: 10, w: 2, h: 1 }, { kind: 'stump', x: 2, y: 8, w: 1, h: 1 }, { kind: 'mossrock', x: 17, y: 8, w: 1, h: 1 },
      { kind: 'fern', x: 5, y: 12, w: 1, h: 1 }, { kind: 'fern', x: 13, y: 5, w: 1, h: 1 }, { kind: 'log', x: 4, y: 6, w: 1, h: 1 }] });
  room.calm = true;
  DW.Palais.entrance('arbre_kuwagamon');
  // la sortie mène devant l'arbre ; elle reste fermée tant que Kuwagamon n'est pas vaincu
  for (const w of room.warps) if (w.to === '?') Object.assign(w, { to: 'clairiere', tx: 27, ty: 11, cond: s => !!s.flags.kuwagamon,
    lock: "Les racines se sont refermées derrière toi ! Kuwagamon ne te laissera pas repartir..." });
  room.onEnter = async ow => {
    if (st().flags.kuwagamon || st().flags.kuwaSeen) return;
    st().flags.kuwaSeen = true;
    DW.Audio.sfx('roar'); ow.shake = 1;
    await say("CRAC ! Les racines se referment derrière toi. Plus moyen de sortir...");
    const pn = (st().party.find(m => m.hp > 0) || st().party[0]).name;
    await say("BZZZZZ... Là, au fond ! Un énorme insecte rouge aux pinces gigantesques !");
    await say("C'est lui qui terrorise la clairière... Il faut l'affronter ! Je suis prêt !", pn);
  };
  room.npcs.push({ sp: 'kuwagamon', x: 9, y: 7, face: 'down', cond: s => !s.flags.kuwagamon, talk: fight });

  async function fight(ow) {
    const s = st();
    await say('BZZZZZZZZZ !!!', 'Kuwagamon');
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Donne-lui de quoi se soigner (menu → OBJETS)."); return; }
    if ((await DW.ask('Affronter Kuwagamon ?')) !== 0) return;
    const res = await ow.battle({ enemy: new DW.Digimon('kuwagamon', 11), boss: true, canLose: true, intro: 'Kuwagamon fond sur vous, pinces grandes ouvertes !' });
    if (res !== 'win') {
      // le fossé entre les stades : un Disciple n'a presque aucune chance contre un Champion
      const m = s.party[0];
      if (m && m.d.stage !== 'Champion') await say(`Kuwagamon est un CHAMPION... ${m.name} n'a presque aucune chance tant qu'il n'a pas digivolué ! Entraîne-le et regarde sa fiche (onglet Digivolution).`);
      // les racines se rouvrent : Kuwagamon vous chasse de l'arbre (on se réveille chez Jijimon)
      await say("Kuwagamon vous projette contre l'écorce... Les racines s'écartent et vous roulez dehors.");
      st().flags.kuwaSeen = false;   // (en revenant, l'arbre se referme de nouveau derrière toi)
      await ow.bossDefeat("Hohoho... Les petits Digimon de la clairière vous ont ramenés ici. Reprenez des forces : Kuwagamon vous attendra dans son arbre.");
      return;
    }
    s.flags.kuwagamon = true;
    await victory(ow);
  }

  // ------------------------------------------------------------ 3) la défaite de Kuwagamon (petite scène), puis chez Jijimon
  // ~10 s : il rugit et se débat, des fissures de lumière le traversent, un éclat d'Engrenage Noir s'arrache de son dos,
  // il se désagrège en données qui montent, anneaux de lumière, puis blanc. Elle s'ouvre et se ferme sur un fondu (pas de flash).
  class KuwaDefeatScene extends DW.Scene {
    constructor() {
      super();
      this.bg = DW.World.battleBg('foret@deep');
      this.pts = Array.from({ length: 160 }, () => ({ x: 110 + Math.random() * 100, y: 50 + Math.random() * 120, v: 18 + Math.random() * 60, s: 1 + Math.random() * 2, c: Math.random() < 0.5 ? '#ff6a4a' : '#7af0d0', d: Math.random() * 1.5 }));
      this.cracks = Array.from({ length: 9 }, (_, i) => ({ a: i / 9 * Math.PI * 2 + Math.random() * 0.4, l: 18 + Math.random() * 26, t: 2 + i * 0.25 }));
    }
    async enter() {
      await DW.fade(0, 0.6);
      await DW.wait(9.2);
      await DW.fade(1, 0.9, '#ffffff');
      this.close();
    }
    draw(c) {
      const t = this.t, spr = DW.Sprites.battle('kuwagamon'), cx = W / 2, cy = 120;
      c.drawImage(this.bg, 0, 0);
      c.fillStyle = `rgba(0,0,0,${Math.min(0.6, t * 0.15)})`; c.fillRect(0, 0, W, H);
      // le partenaire, de dos, au premier plan
      const pt = (st().party.find(m => m.hp > 0) || st().party[0]);
      if (pt) { const ps = DW.Sprites.battle(pt.sp); DW.Sprites.draw(c, ps, 70, 214, { frame: Math.floor(t * 4), scale: Math.min(1.2, 60 / ps.h) }); }
      const k = Math.max(0, Math.min(1, (t - 4.6) / 2.6));   // désagrégation
      const shake = t < 4.6 ? Math.sin(t * 38) * (2 + t) : 0;
      if (k < 1) {
        c.save(); c.globalAlpha = 1 - k;
        const flash = t > 1 && t < 4.6 && Math.floor(t * 8) % 3 === 0;
        DW.Sprites.draw(c, spr, cx + shake, 176 - k * 40, { frame: Math.floor(t * 6), white: flash ? 0.7 : 0, scale: 1 + k * 0.2, flip: true });   // (face au partenaire, à gauche)
        c.restore();
        // fissures de lumière sur son corps
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#c8fff0'; c.lineWidth = 1.6;
        for (const cr of this.cracks) if (t > cr.t) { const l = Math.min(cr.l, (t - cr.t) * 40); c.globalAlpha = 1 - k; c.beginPath(); c.moveTo(cx + shake, cy); c.lineTo(cx + shake + Math.cos(cr.a) * l, cy + Math.sin(cr.a) * l * 0.8); c.stroke(); }
        c.restore();
      }
      // l'éclat d'Engrenage Noir qui s'arrache (un indice pour la suite de l'histoire)
      if (t > 3.6) {
        const g = Math.min(1, (t - 3.6) / 2), gx = cx + 40 * g, gy = cy - 30 * Math.sin(g * Math.PI) + g * 70, a = t * 6;
        c.save(); c.translate(gx, gy); c.rotate(a); c.fillStyle = '#16121c'; c.strokeStyle = '#6a4a8a'; c.lineWidth = 1;
        c.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 7 : 10, an = i / 16 * Math.PI * 2; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); c.stroke(); c.restore();
      }
      // données qui s'envolent
      if (t > 4.6) for (const p of this.pts) {
        const tt = t - 4.6 - p.d; if (tt < 0) continue;
        const y = p.y - tt * p.v, a = Math.max(0, 1 - tt / 3.4);
        c.globalAlpha = a; c.fillStyle = p.c; c.fillRect(Math.round(p.x + Math.sin(tt * 3 + p.y) * 8), Math.round(y), p.s, p.s);
      }
      c.globalAlpha = 1;
      // anneaux de lumière
      if (t > 6.6) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const r = ((t - 6.6) * 70 + i * 30) % 200; c.strokeStyle = `rgba(160,255,230,${Math.max(0, 1 - r / 200)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy + 40, r, r * 0.4, 0, 0, 7); c.stroke(); } c.restore(); }
      const cap = t < 1.8 ? 'BZZZZZZZZ !!! Kuwagamon se débat de toutes ses forces...' : t < 3.6 ? 'Des fissures de lumière le traversent !' : t < 5.4 ? "Quelque chose de noir s'arrache de son dos..." : t < 7.6 ? 'Kuwagamon se désagrège en données...' : '';
      if (cap) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, H - 30, W, 20); UI.text(c, cap, W / 2, H - 16, { size: 9, align: 'center' }); }
    }
  }
  async function victory(ow) {
    const s = st(), pn = (s.party.find(m => m.hp > 0) || s.party[0]).name;
    await DW.fade(1, 0.3);   // pas de retour furtif dans l'arbre
    Audio.sfx('super');
    await Game.push(new KuwaDefeatScene());
    await DW.fade(1, 1.2, '#000000');
    s.party.forEach(m => m.heal());
    await ow.charger('maison', 10, 8, 'up');
    await DW.wait(0.6);
    await DW.fade(0, 0.8);
    Audio.play('village');
    await say("Hohoho ! Te voilà ! Les petits Digimon de la clairière sont venus me prévenir en courant...", J);
    await say("Kuwagamon s'est désagrégé en données, et la Clairière de l'Arrivée est enfin calme ! Tu as été formidable, avec ton partenaire.", J);
    await say("On a eu chaud, hein ?", pn);
    await say("Tiens, prends ceci. Les Poyomon l'ont taillé pour toi dans une pince que Kuwagamon a perdue pendant le combat : un trophée !", J);
    DW.Trophies.give('kuwagamon'); Audio.sfx('fanfare'); if (DW.Cards) DW.Cards.give('kuwagamon');
    await say('Tu reçois le Trophée de Kuwagamon !');
    await say("Mets-le dans ta maison. Sous le plancher, il y a une vieille cave que je n'ai jamais ouverte : de quoi exposer tes trophées !", J);
    await say("Un éclat noir s'est arraché de son dos, dis-tu ? Kuwagamon n'était pas méchant autrefois... Il n'était pas lui-même. Je me demande ce qui lui est arrivé...", J);
    // (comme le dit Penguinmon, maps/berceau.js : les données d'un Digimon qui disparaît reviennent au Village des Bébés)
    await say("Ses données ne sont pas perdues : elles retournent au Village des Bébés. Un jour, Kuwagamon renaîtra d'un DigiŒuf... libéré de cet éclat noir.", J);
    // le chapitre continue : un enfant humain serait retenu près des cabines de la plage (Shellmon, fin du chapitre 1)
    if (s.hero !== 'tai') {
      await say("Autre chose... Les Bukamon de la plage disent qu'un autre enfant humain, comme toi, est prisonnier près des cabines téléphoniques.", J);
      await say("Les cabines se seraient mises à murmurer des mots... Écoute-les toutes, et remets-les dans l'ordre. Et prépare-toi bien : un énorme coquillage le garde, un Champion !", J);
    } else await say("Et sur la plage, les cabines téléphoniques sonnent sans arrêt... Un gros Digimon s'y cache, paraît-il. Sois prudent !", J);
    DW.autosave();
  }

  DW.Kuwa = { tree, fight, RIDDLE };
})();
;

// ===== js/maps/classe.js
'use strict';
// =====================================================================
//  SALLE DE CLASSE (Terrain d'entraînement) — poste d'Intelligence, et techniques apprises en étudiant
//  On y entre par la petite école du Terrain d'entraînement. Le poste « Étude » (panneau à l'œil, devant le tableau)
//  entraîne l'Intelligence ; après chaque séance, le partenaire peut retenir une des 50 techniques
//  de data/techniques_classe.js : de son élément (ou Neutre), dans la limite de son Intelligence entraînée.
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const room = DW.Palais.room('classe', 'village', { name: "Salle de classe", w: 16, h: 12, music: 'village',
    floor: { type: 'herring', cols: ['#d8b070', '#b88e52', '#7a5a34'] }, wall: { base: '#f0e6c8', alt: '#e0d4b0', pattern: 'stripes', wood: '#8a5a32' },
    objects: [
      { kind: 'tableau', x: 6, y: 1, w: 3, h: 2, back: true },
      { kind: 'stationsign', v: 4, x: 7, y: 4, w: 2, h: 1, small: true },   // (w: 2 : solide sur toute sa largeur)
      { kind: 'bookshelf', v: 0, x: 1, y: 3, w: 2, h: 1 }, { kind: 'bookshelf', v: 1, x: 13, y: 3, w: 2, h: 1 },
      ...[[3, 6], [6, 6], [9, 6], [12, 6], [3, 8], [6, 8], [9, 8], [12, 8]].map(([x, y], i) => ({ kind: 'pupitre', v: i % 2, x, y, w: 1, h: 1, small: true })),
      { kind: 'bigplant', x: 14, y: 9, w: 1, h: 1, small: true }, { kind: 'clock', x: 11, y: 1, w: 1, h: 1, back: true },
      // matériel d'étude (images du joueur, dossier SPORT) : tableau de mémoire, longue-vue, blocs de formes
      { kind: 'tableaumemoire', x: 3, y: 2, w: 1, h: 1, small: true }, { kind: 'telescope', x: 14, y: 6, w: 1, h: 1, small: true }, { kind: 'formes', x: 1, y: 7, w: 1, h: 1, small: true },
    ] });
  room.calm = true;
  // le poste d'Intelligence de la salle s'appelle « Étude » (et non « Méditation », le nom de la stat : game/training.js, poste)
  room.postes = { int: { nom: 'Étude', desc: 'Étudier la leçon du tableau : bien se concentrer, et tout retenir.' } };
  DW.Palais.entrance('classe');
  for (const w of room.warps) if (w.to === '?') Object.assign(w, { to: 'gym', tx: 22, ty: 5 });
  // (textes posés sur la vraie place des objets : une pièce ne pose rien au-dessus de sa 3e rangée, maps/palais.js — le
  //  tableau de mémoire, prévu en y 2, est en y 3, et son texte en 3,2 tombait dans le mur, illisible)
  const sur = kind => { const o = room.objects.find(q => q.kind === kind); return o ? o.x + ',' + o.y : null; };
  room.signs[sur('tableaumemoire')] = "Un tableau de mémoire : des symboles à retenir, puis à retrouver. Ça muscle l'esprit !";
  room.signs[sur('telescope')] = 'Une longue-vue tournée vers la fenêtre. Observer le ciel et compter les étoiles, voilà une bonne leçon.';
  room.signs[sur('formes')] = 'Des blocs de formes à ranger dans leurs trous : rond, triangle, carré. Les Bébés adorent.';
  room.signs['6,2'] = room.signs['7,2'] = room.signs['8,2'] = "Au tableau : « Leçon du jour — Plus un Digimon étudie, plus il retient de techniques. Chaque élément a les siennes ! »";

  // ------------------------------------------------------------ apprendre une technique en étudiant
  const Classe = DW.Classe = {
    // techniques que ce Digimon peut encore apprendre en classe (son élément ou Neutre, assez d'Intelligence)
    pool(m) {
      const int = (m.tr && m.tr.int) || 0;
      return DW.CLASS_MOVES.filter(id => { const mv = DW.MOVES[id]; return !m.knows(id) && mv.classe <= int && (mv.type === 'Neutre' || m.d.types.includes(mv.type)); });
    },
    // après une séance d'Intelligence (score 0 à 6) : une chance d'apprendre une technique au hasard
    async after(m, score) {
      const pool = Classe.pool(m);
      if (!pool.length || !score) return;
      if (Math.random() >= 0.2 + score * 0.09) return;   // de 29 % (séance ratée de peu) à 74 % (parfaite)
      const id = DW.pick(pool);
      DW.Audio.sfx('buff');
      await say(`${m.name} a bien écouté la leçon... Une nouvelle technique lui vient à l'esprit : ${DW.MOVES[id].name} !`);
      await DW.learnMove(m, id);
    },
  };
})();
;

// ===== js/maps/gymnase.js
'use strict';
// =====================================================================
//  GYMNASE (comme dans Digimon World 3) — au Terrain d'entraînement, il ouvre quand LEOMON revient en ville
//  (boss de la Montagne : une fois libéré, il s'installe et devient le coach)
//  Leomon, le coach, y fait travailler les RÉSISTANCES aux éléments : chaque appareil endurcit le Digimon
//  contre un élément (les dégâts de cet élément baissent : jusqu'à -40 % à 100 points, game/battle.js),
//  avec un effet secondaire comme dans DW3 : le Mur de flammes donne des PM, le Bombardement des PV,
//  les autres font un peu baisser une statistique. Deux appareils n'ouvrent que plus tard dans l'aventure.
//  Une séance : 3 essais à la jauge (comme au Terrain), 120 Bits, 1 h 30, fatigue +25.
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const FEE = 120, MINUTES = 90, TIRE = 25, CAP = 100;
  const NAME = { hp: 'PV max', mp: 'PM max', atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intelligence' };
  // appareils : élément travaillé, effet secondaire (stat, sens), chapitre d'ouverture ; l'appareil dans la salle (obj, x, y :
  // images du joueur, dossier SPORT) : lui parler commence sa séance
  const GYM = [
    { id: 'feu', name: 'Mur de flammes', type: 'Feu', side: ['mp', 1], ch: 2, fx: ['#ff6a1a', '#ffd040'], obj: 'anneaufeu', x: 2 },
    { id: 'eau', name: 'Cascade glacée', type: 'Eau', side: ['int', -1], ch: 2, fx: ['#4aa8ff', '#e0f4ff'], obj: 'cascade', x: 4 },
    { id: 'glace', name: 'Chambre froide', type: 'Glace', side: ['spd', -1], ch: 2, fx: ['#98ecff', '#ffffff'], obj: 'bainglace', x: 6 },
    { id: 'air', name: 'Soufflerie', type: 'Air', side: ['atk', -1], ch: 2, fx: ['#b8c8ff', '#ffffff'], obj: 'portailvent', x: 11 },
    { id: 'elec', name: 'Paratonnerre', type: 'Électrique', side: ['def', -1], ch: 2, fx: ['#ffe030', '#ffffff'], obj: 'bobinefoudre', x: 13 },
    { id: 'terre', name: 'Bombardement de rochers', type: 'Terre', side: ['hp', 1], ch: 3, fx: ['#9a6a38', '#d8a860'], obj: 'rochersuspendu', x: 15 },
    { id: 'tenebres', name: 'Chambre noire', type: 'Ténèbres', side: ['int', -1], ch: 4, fx: ['#6a3a8a', '#c890f0'], obj: 'portailombre', x: 15, y: 7 },
  ];
  const Gym = DW.Gymnase = {
    GYM, CAP,
    open: () => !!(DW.Town && DW.Town.has('leomon')),
    unlocked: g => (st().flags.chapter || 1) >= g.ch,
    // part des dégâts d'un élément qui est encaissée (0 à 0,4)
    resist: (m, type) => Math.min(0.4, ((m && m.res && m.res[type]) || 0) / 250),
    // modifie une statistique affichée de n points (stockée dans m.raw, comme l'entraînement « Statistique »)
    addStat(m, k, n) {
      const S = DW.SCALE, unit = 0.8 * (k === 'hp' ? S.hp : k === 'mp' ? S.mp : S.stat);
      m.raw = m.raw || {};
      const before = m.stat(k);
      m.raw[k] = Math.max(-15, (m.raw[k] || 0) + n / unit);
      return m.stat(k) - before;
    },
  };

  // ------------------------------------------------------------ icônes des appareils (liste) : flamme, goutte, flocon, tourbillon, éclair, rocher, œil
  function icon(c, id, x, y, on) {
    c.save(); c.translate(x, y);
    if (!on) { c.fillStyle = '#3a4a5a'; c.fillRect(-5, -5, 10, 10); c.fillStyle = '#5a6a7a'; c.font = DW.UI.font(8, true); c.textAlign = 'center'; c.fillText('?', 0, 3); c.restore(); return; }
    const P = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); c.fill(); };
    if (id === 'feu') { P([[0, -6], [4, -1], [3, 4], [-3, 4], [-4, -1]], '#ff6a1a'); P([[0, -2], [2, 1], [1, 4], [-1, 4], [-2, 1]], '#ffe040'); }
    else if (id === 'eau') { P([[0, -6], [4, 1], [2.5, 4.5], [-2.5, 4.5], [-4, 1]], '#3a8ae8'); c.fillStyle = '#c8ecff'; c.fillRect(-2, 0, 1.5, 2.5); }
    else if (id === 'glace') { c.strokeStyle = '#a8f0ff'; c.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; c.beginPath(); c.moveTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5); c.lineTo(-Math.cos(a) * 5.5, -Math.sin(a) * 5.5); c.stroke(); } c.fillStyle = '#ffffff'; c.fillRect(-1, -1, 2, 2); }
    else if (id === 'air') { c.strokeStyle = '#c8d8ff'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, 4.5, 0.3, 5.2); c.stroke(); c.beginPath(); c.arc(0.5, 0, 2, 0.8, 5.6); c.stroke(); }
    else if (id === 'elec') P([[1, -6], [-3, 1], [0, 1], [-1, 6], [3, -1], [0, -1]], '#ffe030');
    else if (id === 'terre') { P([[-5, 3], [-4, -2], [-1, -4], [3, -3], [5, 1], [3, 4], [-2, 5]], '#9a6a38'); c.fillStyle = '#c8945a'; c.fillRect(-2, -2, 3, 2); }
    else { c.fillStyle = '#c890f0'; c.beginPath(); c.ellipse(0, 0, 5.5, 3.2, 0, 0, 7); c.fill(); c.fillStyle = '#1a0a24'; c.beginPath(); c.arc(0, 0, 2, 0, 7); c.fill(); }
    c.restore();
  }
  // la salle d'entraînement : sol de dalles métalliques, l'appareil de l'élément en action sur le Digimon
  function drawRoom(c, g, t, x0, y0, w, h, hitT, res) {
    const cx = x0 + w / 2, fy = y0 + h - 8;
    // murs et sol (façon DW3 : salle grise, panneaux bleus)
    c.fillStyle = '#2a3442'; c.fillRect(x0, y0, w, h);
    for (let x = x0; x < x0 + w; x += 16) { c.fillStyle = '#34405a'; c.fillRect(x + 2, y0 + 3, 12, 18); c.fillStyle = '#4a6a9a'; c.fillRect(x + 4, y0 + 6, 8, 2); }
    c.fillStyle = '#3e4652'; c.fillRect(x0, y0 + 24, w, h - 24);
    for (let x = x0 - ((t * 0) % 12); x < x0 + w; x += 12) for (let y = y0 + 26; y < y0 + h; y += 7) { c.fillStyle = ((x + y) / 6 | 0) % 2 ? '#48505e' : '#424a58'; c.fillRect(x, y, 11, 6); }
    const k = hitT > 0 ? 1 : 0.55, [A, B] = g.fx, R = n => DW.Art.hash(Math.floor(t * 20), n, 7);
    c.save();
    if (g.id === 'feu') {   // deux lance-flammes tirent sur le Digimon
      for (const sx of [x0 + 10, x0 + w - 10]) { c.fillStyle = '#5a5e6a'; c.fillRect(sx - 5, fy - 22, 10, 22); c.fillStyle = '#8a3a2a'; c.fillRect(sx - 3, fy - 26, 6, 5);
        for (let i = 0; i < 10 * k; i++) { const u = (t * 2.4 + i / 10) % 1, dx = (cx - sx) * u * 0.8; c.fillStyle = i % 2 ? A : B; c.globalAlpha = 1 - u * 0.6; c.beginPath(); c.arc(sx + dx, fy - 24 + Math.sin(u * 9 + i) * 3, 2.5 + u * 3, 0, 7); c.fill(); } c.globalAlpha = 1; }
    } else if (g.id === 'eau') {   // une cascade tombe du plafond
      c.fillStyle = 'rgba(74,168,255,0.35)'; c.fillRect(cx - 18, y0, 36, fy - y0);
      for (let i = 0; i < 18 * k; i++) { const u = (t * 1.6 + i / 18) % 1; c.fillStyle = i % 3 ? A : B; c.fillRect(cx - 16 + R(i) * 32, y0 + u * (fy - y0), 2, 6); }
      c.fillStyle = 'rgba(224,244,255,0.6)'; c.beginPath(); c.ellipse(cx, fy, 26, 4, 0, 0, 7); c.fill();
    } else if (g.id === 'glace') {   // chambre froide : givre aux murs, flocons, souffle glacé
      c.fillStyle = 'rgba(200,240,255,0.18)'; c.fillRect(x0, y0, w, h);
      for (let i = 0; i < 26 * k; i++) { const u = (t * 0.5 + i / 26) % 1; c.fillStyle = '#ffffff'; c.fillRect(x0 + R(i + 40) * w, y0 + u * h, 1.5, 1.5); }
      for (const sx of [x0 + 4, x0 + w - 12]) { c.fillStyle = '#a8e8ff'; c.beginPath(); c.moveTo(sx, y0 + 24); c.lineTo(sx + 8, y0 + 24); c.lineTo(sx + 4, y0 + 34); c.fill(); }
    } else if (g.id === 'air') {   // une grande soufflerie
      const fx = x0 + 14, fy2 = fy - 20; c.fillStyle = '#5a5e6a'; c.beginPath(); c.arc(fx, fy2, 13, 0, 7); c.fill(); c.fillStyle = '#2a2e38'; c.beginPath(); c.arc(fx, fy2, 10, 0, 7); c.fill();
      c.save(); c.translate(fx, fy2); c.rotate(t * 18); c.fillStyle = '#c8ccd8'; for (let b = 0; b < 3; b++) { c.rotate(Math.PI * 2 / 3); c.fillRect(-1.5, -9, 3, 9); } c.restore();
      c.strokeStyle = '#e0e8ff'; c.lineWidth = 1; for (let i = 0; i < 9 * k; i++) { const u = (t * 2 + i / 9) % 1, yy = fy2 - 10 + R(i + 9) * 20; c.globalAlpha = 1 - u; c.beginPath(); c.moveTo(fx + 14 + u * (w - 30), yy); c.lineTo(fx + 26 + u * (w - 30), yy); c.stroke(); } c.globalAlpha = 1;
    } else if (g.id === 'elec') {   // le paratonnerre : éclairs qui tombent sur le Digimon
      c.fillStyle = '#7a7e8a'; c.fillRect(cx - 1, y0, 2, 14); c.fillStyle = '#ffe030'; c.beginPath(); c.arc(cx, y0 + 15, 3, 0, 7); c.fill();
      if (hitT > 0 || (t * 3) % 1 < 0.25) { c.strokeStyle = (t * 10 | 0) % 2 ? A : B; c.lineWidth = 1.6; c.beginPath(); let yy = y0 + 18, xx = cx; c.moveTo(xx, yy); while (yy < fy - 26) { yy += 6; xx = cx + (R(yy) - 0.5) * 10; c.lineTo(xx, yy); } c.stroke(); }
    } else if (g.id === 'terre') {   // bombardement de rochers
      for (let i = 0; i < 5 * k; i++) { const u = (t * 1.2 + i / 5) % 1; c.fillStyle = i % 2 ? A : B; c.beginPath(); c.arc(cx - 20 + R(i + 77) * 40, y0 + u * (fy - y0 - 20), 3.5, 0, 7); c.fill(); }
    } else {   // chambre noire : l'obscurité, des yeux qui brillent
      c.fillStyle = 'rgba(10,0,20,0.6)'; c.fillRect(x0, y0, w, h);
      for (let i = 0; i < 4; i++) { const ex = x0 + 12 + i * (w - 24) / 3, ey = y0 + 16 + (i % 2) * 8, o = (Math.sin(t * 2 + i * 2) + 1) / 2; c.fillStyle = `rgba(200,140,255,${o})`; c.fillRect(ex - 3, ey, 2, 1.5); c.fillRect(ex + 1, ey, 2, 1.5); }
    }
    c.restore();
    // l'éclat du coup encaissé
    if (hitT > 0) { c.fillStyle = `rgba(255,255,255,${hitT * 0.5})`; c.fillRect(x0, y0, w, h); }
    // badge de la résistance actuelle
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x0 + w - 44, y0 + h - 12, 42, 10);
    DW.UI.text(c, `${g.type.slice(0, 4).toUpperCase()} ${res}`, x0 + w - 4, y0 + h - 4, { size: 7, align: 'right', color: '#ffffff' });
  }

  // ------------------------------------------------------------ l'écran du gymnase (façon DW3)
  class GymScene extends DW.Scene {
    constructor(m, i = 0) { super(); this.m = m; this.i = i; this.state = 'menu'; this.msg = ''; this.pt = []; this.hits = []; }
    get G() { return GYM[this.i]; }
    update(dt) {
      for (let k = this.pt.length - 1; k >= 0; k--) { const p = this.pt[k]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.life <= 0) this.pt.splice(k, 1); }
      if (this.state === 'menu') {
        if (Input.hit('up')) { this.i = (this.i + GYM.length - 1) % GYM.length; Audio.sfx('move'); this.msg = ''; }
        if (Input.hit('down')) { this.i = (this.i + 1) % GYM.length; Audio.sfx('move'); this.msg = ''; }
        if (Input.hit('back')) { Audio.sfx('back'); this.close(); }
        if (Input.hit('ok')) this.start();
        return;
      }
      if (this.state === 'play') {
        if (this.pause > 0) { this.pause -= dt; return; }
        this.t2 += dt; this.p = (Math.sin(this.t2 * this.speed * Math.PI - Math.PI / 2) + 1) / 2;
        if (Math.random() < 0.6) this.puff(1);
        if (Input.hit('ok')) {
          const d = Math.abs(this.p - this.c), r = d < this.w / 6 ? 2 : d < this.w / 2 ? 1 : 0;
          this.hits.push(r); Audio.sfx(r === 2 ? 'super' : r ? 'hit' : 'weak'); this.puff(r ? 14 : 4); this.shake = r ? 0.2 : 0.35; this.hitT = 0.4;
          if (this.hits.length >= 3) { this.pause = 0.8; this.finishT = 0.8; this.state = 'end'; }
          else { this.pause = 0.5; this.newRep(); }
        }
        return;
      }
      if (this.state === 'end') { if ((this.finishT -= dt) <= 0) this.finish(); return; }
      if (this.state === 'result' && (Input.hit('ok') || Input.hit('back'))) { Audio.sfx('select'); this.state = 'menu'; }
    }
    newRep() { this.t2 = 0; this.c = 0.3 + Math.random() * 0.4; this.w = 0.26 - Math.min(0.12, ((this.m.res || {})[this.G.type] || 0) / 800); this.speed = 1.4 + ((this.m.res || {})[this.G.type] || 0) / 70; }
    puff(n) {
      const [a, b] = this.G.fx;
      for (let k = 0; k < n; k++) this.pt.push({ x: 214 + (Math.random() - 0.5) * 60, y: 150 - Math.random() * 40, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 50, life: 0.6 + Math.random() * 0.4, col: Math.random() < 0.5 ? a : b });
    }
    start() {
      const m = this.m, g = this.G, s = st();
      const no = !Gym.unlocked(g) ? "Cet appareil est encore en réparation... Il ouvrira plus tard dans l'aventure."
        : m.hp <= 0 ? `${m.name} est K.O. Soigne-le d'abord !` : m.sick ? `${m.name} est malade...` : m.tired >= 80 ? `${m.name} est trop fatigué. Fais-le se reposer !`
        : ((m.res || {})[g.type] || 0) >= CAP ? `${m.name} résiste déjà au maximum à l'élément ${g.type} !` : s.bits < FEE ? `Il faut ${FEE} Bits pour une séance.` : null;
      if (no) { Audio.sfx('bump'); this.msg = no; return; }
      s.bits -= FEE; Audio.sfx('buff');
      this.state = 'play'; this.hits = []; this.pause = 0.8; this.newRep();
    }
    finish() {
      const m = this.m, g = this.G, score = this.hits.reduce((a, b) => a + b, 0);
      m.res = m.res || {};
      const before = m.res[g.type] || 0, gain = [3, 6, 9, 13, 16, 20, 24][score];
      m.res[g.type] = Math.min(CAP, before + gain);
      const [k, sgn] = g.side, delta = Gym.addStat(m, k, sgn * (k === 'hp' || k === 'mp' ? 6 + score * 4 : 1 + Math.ceil(score / 2)));
      m.tired = Math.min(100, (m.tired || 0) + TIRE); st().clock += MINUTES;
      DW.Life.addFat && DW.Life.addFat(m, -0.15);
      const R = m.res[g.type] - before;
      this.msg = `La résistance ${g.type === 'Air' ? "à l'Air" : g.type === 'Eau' ? "à l'Eau" : `au ${g.type}`.replace('au Glace', 'à la Glace').replace('au Terre', 'à la Terre').replace('au Électrique', "à l'Électricité").replace('au Ténèbres', 'aux Ténèbres')} monte de ${R} !  (${NAME[k]} ${delta >= 0 ? '+' : '-'}${Math.abs(delta)})`;
      this.state = 'result'; Audio.sfx('levelup');
      DW.autosave();
    }
    draw(c) {
      const m = this.m, g = this.G, t = this.t;
      UI.menuBg(c, t);
      // bandeau
      UI.box(c, 6, 4, W - 12, 20); UI.label(c, 'GYMNASE', 12, 8);
      UI.text(c, `${m.name}  N.${m.level}`, 92, 17, { size: 9, color: '#ffe070' }); UI.text(c, `${st().bits} Bits`, W - 14, 17, { size: 8, align: 'right', color: '#c8f0ff' });
      // colonne de gauche : statistiques et résistances
      UI.box(c, 6, 28, 112, 160);
      const S = [['hp', 'PV'], ['mp', 'PM'], ['atk', 'Atq'], ['def', 'Déf'], ['spd', 'Vit'], ['int', 'Int']];
      S.forEach(([k, l], j) => { const y = 40 + (j % 3) * 11, x = j < 3 ? 12 : 64; UI.text(c, l, x, y, { size: 7, color: '#8ae0f0' }); UI.text(c, String(m.stat(k)), x + 46, y, { size: 7, align: 'right' }); });
      UI.text(c, 'RÉSISTANCES', 12, 80, { size: 7, color: '#ffe070' });
      GYM.forEach((G, j) => {
        const y = 92 + j * 13, v = (m.res || {})[G.type] || 0, on = Gym.unlocked(G);
        UI.typeTag(c, G.type, 12, y - 6, 6);
        UI.bar(c, 64, y - 3, 38, 3, v / CAP, on ? DW.TYPES[G.type].c : '#3a4a5a');
        UI.text(c, on ? String(v) : '—', 112, y, { size: 7, align: 'right', color: on ? '#ffffff' : '#5a6a7a' });
      });
      // à droite : les appareils
      UI.box(c, 122, 28, W - 128, 84);
      GYM.forEach((G, j) => {
        const y = 40 + j * 11, on = Gym.unlocked(G), sel = j === this.i;
        if (sel) { c.fillStyle = 'rgba(255,224,112,0.14)'; c.fillRect(125, y - 8, W - 134, 10); }
        icon(c, G.id, 132, y - 3, on);
        UI.text(c, on ? G.name : '???', 141, y, { size: 8, color: !on ? '#5a6a7a' : sel ? '#ffe070' : '#c8f0ff' });
        if (on) UI.text(c, `${FEE} B`, W - 12, y, { size: 7, align: 'right', color: '#8ae0f0' });
      });
      // la salle : l'appareil de l'élément en action, le Digimon encaisse ; essais réussis / ratés (○ ×) comme dans DW3
      UI.box(c, 122, 114, W - 128, 74);
      c.save(); c.beginPath(); c.rect(125, 117, W - 134, 68); c.clip();
      if (this.shake > 0) { this.shake -= 1 / 60; c.translate((Math.random() - 0.5) * 4, 0); }
      if (this.hitT > 0) this.hitT -= 1 / 60;
      drawRoom(c, g, t, 125, 117, W - 134, 68, Math.max(0, this.hitT || 0), (m.res || {})[g.type] || 0);
      const spr = DW.Sprites.battle(m.sp), k = Math.min(1, 46 / spr.h), hurt = (this.hitT || 0) > 0;
      DW.Sprites.draw(c, hurt ? DW.Sprites.pose(m.sp, 'hurt') : spr, 214, 180, { frame: Math.floor(t * 4), scale: k });
      for (const p of this.pt) { c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = p.col; c.fillRect(p.x, p.y, 2, 2); }
      c.globalAlpha = 1; c.restore();
      if (this.hits.length) this.hits.forEach((h, j) => { const x = 132 + j * 12, y = 124; if (h) { c.strokeStyle = h === 2 ? '#ffe070' : '#5ab0ff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 4, 0, 7); c.stroke(); } else { c.strokeStyle = '#ff4a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 4, y - 4); c.lineTo(x + 4, y + 4); c.moveTo(x + 4, y - 4); c.lineTo(x - 4, y + 4); c.stroke(); } });
      // bas : jauge, message
      UI.box(c, 6, 192, W - 12, 42);
      if (this.state === 'play' || this.state === 'end') {
        const x0 = 16, w = 220, y = 202;
        c.fillStyle = '#0a1426'; c.fillRect(x0 - 1, y - 1, w + 2, 10); c.fillStyle = '#2a3a5a'; c.fillRect(x0, y, w, 8);
        c.fillStyle = g.fx[0]; c.fillRect(x0 + (this.c - this.w / 2) * w, y, this.w * w, 8);
        c.fillStyle = '#ffffff'; c.fillRect(x0 + (this.c - this.w / 6) * w, y, this.w / 3 * w, 8);
        if (this.pause <= 0) { c.fillStyle = '#ff4040'; c.fillRect(Math.round(x0 + this.p * w) - 1, y - 3, 3, 14); }
        UI.text(c, `${g.name} : A pour encaisser au bon moment !`, 16, 224, { size: 7, color: '#c8f0ff' });
        for (let j = 0; j < 3; j++) { const h = this.hits[j]; UI.text(c, h == null ? '·' : h === 2 ? '★' : h ? '●' : '✘', W - 50 + j * 14, 210, { size: 10, align: 'center', color: h == null ? '#5a8aa0' : h ? '#ffe060' : '#ff7a7a' }); }
      } else {
        const txt = this.msg || (Gym.unlocked(g) ? `${g.name} : endurcit contre l'élément ${g.type}. ${NAME[g.side[0]]} ${g.side[1] > 0 ? '+' : '-'}. (1 h 30, fatigue +${TIRE} %)` : "Appareil en réparation : il ouvrira plus tard dans l'aventure.");
        UI.wrap(c, txt, W - 36, 8).slice(0, 2).forEach((l, j) => UI.text(c, l, 16, 205 + j * 11, { size: 8, color: this.state === 'result' ? '#7aff8a' : '#ffffff' }));
        UI.hints(c, this.state === 'result' ? [['ok', 'continuer']] : [['ok', 'séance'], ['back', 'sortir']], W - 14, 230);
      }
    }
  }
  DW.GymScene = GymScene;

  // le bâtiment, au Terrain d'entraînement : portes condamnées (v1) tant que Leomon n'est pas revenu en ville
  DW.MAPS.gym.populate = function () {
    const o = (this.objects || []).find(x => x.kind === 'gymnase'), v = Gym.open() ? 0 : 1;
    if (o && (o.v || 0) !== v) { o.v = v; if (this.gfx) DW.World.unprepare(this); }
  };

  // ------------------------------------------------------------ la salle du gymnase (intérieur)
  const room = DW.Palais.room('gymnase', 'village', { name: 'Gymnase', w: 18, h: 12, music: 'village',
    floor: { type: 'tatami', cols: ['#d8c890', '#b8a870', '#6a5a3a'] }, wall: { base: '#9ab0c8', alt: '#8aa0b8', pattern: 'stripes', wood: '#4a5a6a' },
    objects: [
      ...GYM.map(g => ({ kind: g.obj, x: g.x, y: g.y || 3, w: 1, h: 1, small: true })),
      { kind: 'mat', x: 6, y: 6, w: 6, h: 3, walk: true }, { kind: 'barrel', v: 0, x: 1, y: 9, w: 1, h: 1, small: true }, { kind: 'bench', x: 15, y: 9, w: 1, h: 1, small: true },
    ] });
  room.calm = true;
  DW.Palais.entrance('gymnase');
  for (const w of room.warps) if (w.to === '?') Object.assign(w, { to: 'gym', tx: 9, ty: 5 });
  // une séance (devant Leomon, ou à un appareil : i)
  async function seance(i = 0) {
    const s = st();
    if (!s.party.length) { await say("Reviens avec un partenaire, petit !", 'Leomon'); return; }
    if (!s.flags.gymIntro) {
      s.flags.gymIntro = true;
      await say("Bienvenue au Gymnase ! Je suis Leomon. Ici, on ne muscle pas : on ENDURCIT.", 'Leomon');
      await say("Chaque appareil habitue ton Digimon à un élément : le feu, l'eau, la glace, le vent, la foudre... Les attaques de cet élément le blesseront de moins en moins.", 'Leomon');
      await say("Mais rien n'est gratuit : la Cascade fait un peu baisser l'Intelligence, la Soufflerie l'Attaque... Le Mur de flammes, lui, donne des PM. À toi de choisir !", 'Leomon');
    }
    let m = s.party[0];
    if (s.party.length > 1) { const i = await Game.push(new DW.PartyScene({ mode: 'select', title: 'GYMNASE' })); if (i == null || i < 0) return; m = s.party[i]; }
    await Game.push(new GymScene(m, i));
  }
  room.npcs.push({ sp: 'leomon', x: 9, y: 4, face: 'down', talk: () => seance() });
  GYM.forEach((g, i) => { room.signs[g.x + ',' + (g.y || 3)] = () => seance(i); });
})();
;

// ===== js/maps/relief.js
'use strict';
// =====================================================================
//  RELIEF EN NIVEAUX (montagnes façon Digimon World 2003)
//  Trois couches séparées :
//   1) ALTITUDE (map.alt, un niveau entier par case) : la vérité géographique. Elle vient d'une fonction du MONDE
//      (coordonnées mondiales, déterministe) partagée par les cartes voisines d'un même massif : le relief se
//      poursuit d'une carte à l'autre, aux mêmes niveaux, quel que soit l'ordre de chargement.
//   2) COLLISION (les cases de la carte) : dérivée de l'altitude. Une baisse de niveau vers le SUD devient une paroi
//      rocheuse de 3 cases par niveau (vue de 3/4, comme dans les RPG japonais) ; vers le nord, l'est ou l'ouest, un
//      rebord de roche d'une case. On ne passe d'un niveau à l'autre que par un ESCALIER taillé dans la paroi.
//   3) RENDU : paroi « Ŵ » peinte par gfx/terrain.js (strates, fissures, rebord herbeux, pied dans l'ombre, ombre
//      portée), escaliers « ^ », chemins qui serpentent d'un escalier à l'autre.
//  Le héros a une altitude logique (ow.p.alt), mise à jour à chaque pas ; les escaliers sont des cases de passage.
//  Vue de développement (désactivée pour le joueur) : ?debug=geo dans l'adresse, puis la touche G.
// =====================================================================
(function () {
  const Hh = DW.Art.hash, fbm = DW.Art.fbm;
  const ROCK = 'Ŵ', STAIR = '^', WALL0 = 3, PASS = 255;

  // ------------------------------------------------------------ massifs : fonctions d'altitude en coordonnées du monde
  // (chaque carte d'un massif a un décalage mondial [ox, oy], calculé en alignant les passages entre voisines)
  const MASSIFS = {
    // Mont Miharashi : un cône en terrasses (sommet au cratère de Meramon) et un contrefort qui file vers l'est,
    // sur la Route du Mont, en crête rocheuse au nord de la route. Le couloir de la route reste au pied (niveau 0).
    miharashi: {
      maps: { miharashi4: [0, 0], miharashi3: null },
      level(X, Y) {
        const cone = 1 - Math.hypot((X - 56) / 42, (Y - 50) / 34);
        const ridgeY = 64 + Math.sin(X * 0.05) * 4, spur = (0.5 - Math.abs(Y - ridgeY) / 15) * DW.clamp((196 - X) / 34, 0, 1) * DW.clamp((X - 60) / 20, 0, 1);
        let f = Math.max(cone, spur) + (fbm(X * 0.07, Y * 0.07, 991) - 0.5) * 0.2;
        if (Math.hypot((X - 56) / 7, (Y - 48) / 5) < 1) f = 1;   // plateau du sommet (le cratère)
        return f > 0.8 ? 4 : f > 0.6 ? 3 : f > 0.4 ? 2 : f > 0.18 ? 1 : 0;
      },
    },
  };
  const exitMid = (m, side) => { const [p, l] = m.exits[side]; return p + (l - 1) / 2; };
  // décalage mondial d'une carte de massif (la Route est à l'est du Mont, passages alignés)
  function offset(id) {
    for (const k in MASSIFS) {
      const M = MASSIFS[k]; if (!(id in M.maps)) continue;
      if (M.maps[id]) return [M, M.maps[id]];
      if (id === 'miharashi3') { const mt = DW.MAPS.miharashi4, rt = DW.MAPS.miharashi3; return [M, [mt.w, Math.round(exitMid(mt, 'right') - exitMid(rt, 'left'))]]; }
    }
    return [null, null];
  }

  // ------------------------------------------------------------ construction : altitude → parois, rebords, escaliers, chemins
  // o : { id : la carte ; keep(x, y, ch) : case à ne pas toucher (côte, sortie) ; corridor(x, y) : case forcée au niveau 0 ;
  //       surface(x, y, L) : caractère du dessus d'un niveau ; pathCh : caractère des chemins de montagne }
  function build(g, m, o = {}) {
    // altitude : fonction donnée par la carte (o.levelAt, coordonnées locales) ou massif enregistré (coordonnées du monde)
    let M = null, off = [0, 0];
    if (!o.levelAt) { [M, off] = offset(o.id); if (!M) return null; }
    const levelAt = o.levelAt || ((x, y) => M.level(x + off[0], y + off[1]));
    const W = g.w, H = g.h, alt = new Uint8Array(W * H), WALL = o.wall || WALL0;   // (o.wall : parois plus hautes sur une vraie montagne)
    const lvl = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : alt[y * W + x]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = g.get(x, y);
      alt[y * W + x] = (o.keep && o.keep(x, y, ch)) || (o.corridor && o.corridor(x, y)) ? 0 : levelAt(x, y);
    }
    // les bords de carte touchant un passage restent au pied, et les niveaux trop petits (moins de 12 cases) disparaissent
    smallPatches(alt, W, H);
    // 1) surfaces
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = g.get(x, y); if (o.keep && o.keep(x, y, ch)) continue;
      g.set(x, y, o.surface ? o.surface(x, y, lvl(x, y)) : '.');
    }
    // 2) parois au sud (3 cases par niveau de dénivelé) et rebords d'une case ailleurs
    const isRock = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const L = lvl(x, y); if (L <= 0) continue;
      const s = lvl(x, y + 1);
      // (au nord, à l'est et à l'ouest : pas de muret de roche, un rebord dessiné — le dénivelé arrête le héros, voir altBord)
      if (s >= 0 && s < L) {
        let k = 1;
        for (; k <= WALL * (L - s) && y + k < H; k++) { if (lvl(x, y + k) >= L || (o.corridor && o.corridor(x, y + k)) || (o.keep && o.keep(x, y + k, g.get(x, y + k)))) break; isRock[(y + k) * W + x] = 1; }
        if (k === 1) isRock[y * W + x] = 1;   // (pas la place pour la paroi, contre une route : le bord du plateau devient roche — jamais de marche sans paroi)
      }
    }
    // 3) escaliers : un par plateau (composante d'un même niveau), au milieu de la plus longue paroi sud
    const comp = new Int32Array(W * H).fill(-1), comps = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const L = lvl(x, y); if (L <= 0 || comp[y * W + x] >= 0) continue;
      const id = comps.length, cells = [], q = [[x, y]]; comp[y * W + x] = id;
      while (q.length) { const [cx, cy] = q.pop(); cells.push([cx, cy]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (lvl(nx, ny) === L && comp[ny * W + nx] < 0) { comp[ny * W + nx] = id; q.push([nx, ny]); } } }
      comps.push({ L, cells });
    }
    // UNE MONTÉE DIFFICILE : on place les escaliers du sommet vers le pied. Sur chaque plateau, l'escalier qui en
    // descend est mis le plus LOIN possible de l'endroit où l'on arrive d'en haut (en lacets, d'un bout à l'autre
    // du gradin) : pour grimper, il faut faire tout le tour de chaque terrasse.
    const stairs = [], arrivals = comps.map(() => []);
    const distFrom = (C, src) => {   // distances (en pas) sur le plateau depuis ses points d'arrivée
      const d = new Map(), q = []; for (const [x, y] of src) { d.set(x + ',' + y, 0); q.push([x, y]); }
      for (let h = 0; h < q.length; h++) { const [x, y] = q[h], k0 = d.get(x + ',' + y); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (d.has(k) || lvl(nx, ny) !== C.L || comp[ny * W + nx] !== C.id || isRock[ny * W + nx]) continue; d.set(k, k0 + 1); q.push([nx, ny]); } }
      return d;
    };
    comps.forEach((C, i) => { C.id = i; });
    const order = comps.slice().sort((a, b) => b.L - a.L || b.cells.length - a.cells.length);
    for (const C of order) {
      // bords sud : case du plateau (pas un rebord) dont la case du dessous est plus basse ; 3 colonnes côte à côte
      const edge = C.cells.filter(([x, y]) => !isRock[y * W + x] && lvl(x, y + 1) >= 0 && lvl(x, y + 1) < C.L);
      const at = new Set(edge.map(([x, y]) => x + ',' + y));
      const cand = edge.filter(([x, y]) => at.has((x + 1) + ',' + y) && at.has((x + 2) + ',' + y) && [0, 1, 2].every(d => lvl(x + d, y + 1) === lvl(x, y + 1)) && !(o.noStair && o.noStair(x, y)));
      if (!cand.length) continue;
      let pick;
      if (arrivals[C.id].length) { const d = distFrom(C, arrivals[C.id]); cand.sort((a, b) => (d.get((b[0] + 1) + ',' + b[1]) || 0) - (d.get((a[0] + 1) + ',' + a[1]) || 0)); pick = cand[Math.floor(Hh(C.L, C.cells.length, 994) * Math.min(3, cand.length))]; }
      else if (o.firstStair) { cand.sort((a, b) => o.firstStair(a, C) - o.firstStair(b, C)); pick = cand[0]; }
      else { cand.sort((a, b) => a[0] - b[0]); pick = cand[Math.floor(cand.length * (0.35 + Hh(C.L, C.cells.length, 993) * 0.3))]; }
      const [sx, sy] = pick, drop = C.L - lvl(sx, sy + 1), len = WALL * drop;
      for (let d = 0; d < 3; d++) for (let k = 1; k <= len; k++) if (sy + k < H) { isRock[(sy + k) * W + sx + d] = 0; g.set(sx + d, sy + k, STAIR); alt[(sy + k) * W + sx + d] = PASS; }
      // les rebords qui toucheraient l'escalier sur le plateau sont ouverts
      for (let d = 0; d < 3; d++) if (isRock[sy * W + sx + d] && lvl(sx + d, sy) === C.L) isRock[sy * W + sx + d] = 0;   // (seulement au-dessus des marches : les rebords voisins restent)
      for (let d = 0; d < 3; d++) { g.set(sx + d, sy, o.pathCh || '='); for (const fy of [sy + len + 1, sy + len + 2]) if (fy < H && lvl(sx + d, fy) === lvl(sx, sy + len + 1)) g.set(sx + d, fy, o.pathCh || '='); }   // (abords dégagés)
      const footComp = comp[(sy + len + 1) * W + sx + 1];
      if (footComp >= 0) arrivals[footComp].push([sx + 1, sy + len + 1]);
      stairs.push({ x: sx, top: sy, foot: sy + len + 1, L: C.L, comp: C.id });
    }
    // murets de chaque côté des escaliers : on ne quitte une volée de marches que par le haut ou par le bas
    for (const st of stairs) for (let y = st.top + 1; y < st.foot; y++) for (const x of [st.x - 1, st.x + 3]) if (x >= 0 && x < W && g.get(x, y) !== STAIR) isRock[y * W + x] = 1;
    for (let i = 0; i < W * H; i++) if (isRock[i]) g.set(i % W, Math.floor(i / W), ROCK);
    // 3 bis) ACCÈS GARANTI : chaque plateau doit pouvoir se gravir depuis l'arrivée (o.foot) ou les bords de la carte.
    // Un plateau qu'aucun escalier ne relie (pas de place sur sa paroi sud) reçoit une volée de marches sur le bord
    // (nord, est ou ouest) le plus proche d'une zone déjà atteinte, un niveau plus bas.
    {
      const pas = (x, y) => { const c = g.get(x, y); return c !== undefined && c !== ROCK && !DW.SOLID.has(c); };   // (comme dans le jeu : arbres et rochers bloquent)
      const ok = (ax, ay, bx, by) => { const a = alt[ay * W + ax], b = alt[by * W + bx]; return a === PASS || b === PASS || a === b; };
      const vu = new Uint8Array(W * H), file = [];
      const pousse = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H || vu[y * W + x] || !pas(x, y)) return; vu[y * W + x] = 1; file.push([x, y]); };
      const etendre = () => { while (file.length) { const [x, y] = file.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || vu[ny * W + nx] || !pas(nx, ny) || !ok(x, y, nx, ny)) continue; vu[ny * W + nx] = 1; file.push([nx, ny]); } } };
      if (o.foot) pousse(o.foot[0], o.foot[1]);
      else for (let x = 0; x < W; x++) for (const y of [0, H - 1]) if (lvl(x, y) === 0) pousse(x, y);
      if (!o.foot) for (let y = 0; y < H; y++) for (const x of [0, W - 1]) if (lvl(x, y) === 0) pousse(x, y);
      etendre();
      m._acces = { rampes: 0 };
      // morceaux RÉELS de chaque niveau, une fois les parois posées (une haute paroi peut couper une terrasse étroite en deux)
      const morceaux = () => {
        const id = new Int32Array(W * H).fill(-1), out = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const L = lvl(x, y); if (L <= 0 || L === PASS || id[y * W + x] >= 0 || !pas(x, y)) continue;
          const C = { L, cells: [] }, q = [[x, y]]; id[y * W + x] = out.length;
          while (q.length) { const [cx, cy] = q.pop(); C.cells.push([cx, cy]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || id[ny * W + nx] >= 0 || lvl(nx, ny) !== L || !pas(nx, ny)) continue; id[ny * W + nx] = out.length; q.push([nx, ny]); } }
          out.push(C);
        }
        return out;
      };
      var rampes = [];
      for (let tour = 0; tour < 40; tour++) {
        let best = null;
        for (const C of morceaux()) {
          if (C.cells.length < 6 || C.cells.some(([x, y]) => vu[y * W + x])) continue;   // (déjà atteint, ou recoin minuscule)
          for (const [x, y] of C.cells) {
            if (!pas(x, y) || lvl(x, y) !== C.L) continue;
            for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0]]) {   // bord nord, est, ouest (au sud : la paroi)
              const ex = x + dx, ey = y + dy; if (ex < 1 || ey < 1 || ex >= W - 1 || ey >= H - 1 || !vu[ey * W + ex] || lvl(ex, ey) !== C.L - 1) continue;
              // trois cases de front le long du bord, toutes du plateau et toutes au-dessus d'une zone atteinte
              const [ax, ay] = dy ? [1, 0] : [0, 1], trio = [-1, 0, 1].map(k => [x + ax * k, y + ay * k]);
              if (!trio.every(([tx, ty]) => lvl(tx, ty) === C.L && pas(tx, ty) && vu[(ty + dy) * W + tx + dx] && lvl(tx + dx, ty + dy) === C.L - 1)) continue;
              const score = Hh(x, y, 997) * 0.3 - (o.foot ? Math.hypot(x - o.foot[0], y - o.foot[1]) / 40 : 0);   // (UNE MONTÉE DIFFICILE : la marche la plus loin de l'arrivée)
              if (!best || score < best.score) best = { trio, score };
            }
          }
        }
        // sinon : un escalier taillé À TRAVERS la paroi sud, jusqu'à une zone atteinte en contrebas
        if (!best) for (const C of morceaux()) {
          if (C.cells.length < 6 || C.cells.some(([x, y]) => vu[y * W + x])) continue;
          const at = new Set(C.cells.map(([x, y]) => x + ',' + y));
          for (const [x, y] of C.cells) {
            const descente = xx => { let k = 1; while (y + k < H && g.get(xx, y + k) === ROCK) k++; return k > 1 && y + k < H && vu[(y + k) * W + xx] && pas(xx, y + k) ? k : 0; };
            const k = descente(x); if (!k || !at.has((x - 1) + ',' + y) || !at.has((x + 1) + ',' + y) || descente(x - 1) !== k || descente(x + 1) !== k) continue;
            const score = k * 0.2 + Hh(x, y, 998) * 0.3 - (o.foot ? Math.hypot(x - o.foot[0], y - o.foot[1]) / 40 : 0);   // (loin de l'arrivée, paroi plutôt basse)
            if (!best || score < best.score) best = { score, trio: [-1, 0, 1].flatMap(d => { const out = []; for (let j = 1; j < k; j++) out.push([x + d, y + j]); return out; }) };
          }
        }
        if (!best) break;
        m._acces.rampes++;
        for (const [tx, ty] of best.trio) { g.set(tx, ty, STAIR); alt[ty * W + tx] = PASS; vu[ty * W + tx] = 1; file.push([tx, ty]); }
        rampes.push(best.trio);
        etendre();
      }
    }
    const chemins = new Set();   // (cases des sentiers de montagne : le décor les évite)
    // 4) chemins de montagne : sur chaque plateau, de l'escalier qui y monte (son haut) à ceux qui en partent (leur pied)
    const walk = (x, y) => { const c = g.get(x, y); return c !== undefined && c !== ROCK && !DW.SOLID.has(c); };
    const pathOn = (a, b, L) => {   // plus court chemin sur un même niveau (BFS), tracé en terre battue
      const key = (x, y) => y * W + x, prev = new Int32Array(W * H).fill(-2), q = [a]; prev[key(...a)] = -1;
      while (q.length) { const [x, y] = q.shift(); if (x === b[0] && y === b[1]) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev[key(nx, ny)] !== -2) continue; if (lvl(nx, ny) !== L || !walk(nx, ny)) continue; prev[key(nx, ny)] = key(x, y); q.push([nx, ny]); } }
      if (prev[key(...b)] === -2) return;
      for (let k = key(...b); k >= 0; k = prev[k]) { const x = k % W, y = Math.floor(k / W); chemins.add(k); if (g.get(x, y) !== STAIR) g.set(x, y, o.pathCh || '='); }
    };
    // (le haut d'un escalier est sur un plateau ; le pied d'un autre escalier sur ce même plateau : on les relie)
    for (const up of stairs) for (const dn of stairs) {
      if (dn === up) continue;
      const P = comp[up.top * W + up.x + 1];
      if (P >= 0 && comp[dn.foot * W + dn.x + 1] === P) pathOn([up.x + 1, up.top], [dn.x + 1, dn.foot], up.L);
    }
    if (o.foot) for (const s of stairs) if (lvl(s.x + 1, s.foot) === 0) pathOn(o.foot, [s.x + 1, s.foot], 0);
    // chaque volée de marches ajoutée pour l'accès : un sentier la relie, des deux côtés, au sentier ou à l'escalier
    // le plus proche du même niveau (sinon on ne la verrait pas)
    for (const R of rampes || []) for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const [cx, cy] = R[1], sx = cx + dx, sy = cy + dy, L = lvl(sx, sy); if (L < 0 || L === PASS || !walk(sx, sy)) continue;
      const prev = new Map([[sy * W + sx, -1]]), q = [[sx, sy]]; let fin = -1;
      for (let h = 0; h < q.length && fin < 0 && h < 4000; h++) {
        const [x, y] = q[h];
        if (h > 0 && (chemins.has(y * W + x) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) => g.get(x + ex, y + ey) === STAIR && !R.some(([rx, ry]) => rx === x + ex && ry === y + ey)))) { fin = y * W + x; break; }
        for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ex, ny = y + ey, k = ny * W + nx; if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(k) || lvl(nx, ny) !== L || !walk(nx, ny)) continue; prev.set(k, y * W + x); q.push([nx, ny]); }
      }
      if (fin >= 0) for (let k = fin; k >= 0; k = prev.get(k)) { const x = k % W, y = Math.floor(k / W); chemins.add(k); if (g.get(x, y) !== STAIR) g.set(x, y, o.pathCh || '='); }
    }
    // altitude des cases de paroi = celle du pied de la paroi ; collision par dénivelé ; rebords peints sur le sol
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.get(x, y) === ROCK && alt[y * W + x] !== PASS) { let k = y; while (k < H && g.get(x, k) === ROCK) k++; alt[y * W + x] = k < H && alt[k * W + x] !== PASS ? alt[k * W + x] : 0; }
    m.alt = alt; m.reliefStairs = stairs; m.massif = M; m.altBord = true; m.chemins = chemins;
    R.peindreRebords(m);
    return { alt, stairs, comps, lvl };
  }
  // ALTITUDE AU PIXEL (contours arrondis) : l'altitude des cases est lissée (B-spline sur 4 × 4 cases, légère ondulation)
  // puis arrondie au niveau le plus proche : le bord d'un plateau suit une courbe au lieu des marches des cases ; un bord
  // droit reste à sa place. Seulement près des bords de plateau (ailleurs : l'altitude de la case). Sert au sol (images
  // par niveau, gfx/terrain.js) et aux rebords ; les déplacements, eux, suivent toujours les cases.
  function altPixels(m) {
    const W = m.w, H = m.h, A = m.alt, TS = 16, GW = W * TS, GH = H * TS, Hh2 = DW.Art.hash;
    const E = new Float32Array(W * H);   // (un escalier prend l'altitude de son voisin du haut, sinon du bas)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let a = A[y * W + x];
      if (a === PASS) { const n = y > 0 ? A[(y - 1) * W + x] : PASS, s2 = y < H - 1 ? A[(y + 1) * W + x] : PASS; a = n !== PASS ? n : s2 !== PASS ? s2 : 0; }
      E[y * W + x] = a;
    }
    const e = (x, y) => E[(y < 0 ? 0 : y >= H ? H - 1 : y) * W + (x < 0 ? 0 : x >= W ? W - 1 : x)];
    const BORD = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const a = e(x, y); let diff = false;
      for (let dy = -2; dy <= 2 && !diff; dy++) for (let dx = -2; dx <= 2; dx++) if (e(x + dx, y + dy) !== a) { diff = true; break; }
      BORD[y * W + x] = diff ? 1 : 0;
    }
    const VL = new Uint8Array(GW * GH);
    for (let py = 0; py < GH; py++) { const ty = py >> 4; for (let px = 0; px < GW; px++) {
      const tx = px >> 4, i = py * GW + px;
      if (!BORD[ty * W + tx]) { VL[i] = E[ty * W + tx]; continue; }
      const u = (px + 0.5 + (Hh2(px >> 2, py >> 2, 931) - 0.5) * 2.5) / TS - 0.5, v = (py + 0.5 + (Hh2(px >> 2, py >> 2, 932) - 0.5) * 2.5) / TS - 0.5;
      const i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0, u2 = fu * fu, u3 = u2 * fu, v2 = fv * fv, v3 = v2 * fv;
      const a0 = (1 - fu) * (1 - fu) * (1 - fu) / 6, a1 = (3 * u3 - 6 * u2 + 4) / 6, a2 = (-3 * u3 + 3 * u2 + 3 * fu + 1) / 6, a3 = u3 / 6;
      const b0 = (1 - fv) * (1 - fv) * (1 - fv) / 6, b1 = (3 * v3 - 6 * v2 + 4) / 6, b2 = (-3 * v3 + 3 * v2 + 3 * fv + 1) / 6, b3 = v3 / 6;
      const row = y => a0 * e(i0 - 1, y) + a1 * e(i0, y) + a2 * e(i0 + 1, y) + a3 * e(i0 + 2, y);
      const h = b0 * row(j0 - 1) + b1 * row(j0) + b2 * row(j0 + 1) + b3 * row(j0 + 2);
      VL[i] = h < 0 ? 0 : Math.round(h);
    } }
    return VL;
  }
  // REBORDS DES PLATEAUX (vue de 3/4), peints sur les pixels du sol D (RGBA) d'après l'altitude au pixel VL : au nord,
  // une lèvre sombre et des brins qui débordent, une ombre portée sur le niveau bas ; à l'est et à l'ouest, un flanc
  // étroit (clair vers sombre) et son ombre ; un plateau plus haut est un peu plus lumineux. Rien sur la roche des parois
  // (rock(i) : pixel de paroi), dessinée à part.
  function rebordsPixels(m, D, VL, rock, ZE) {
    const W = m.w, H = m.h, TS = 16, GW = W * TS, GH = H * TS, Hh2 = DW.Art.hash;
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const STY = [
      { ombre: [10, 6, 4, 0.45], levre: [34, 26, 22, 0.95], brin: [hex('#7a6a5c'), hex('#5e5046')], clair: hex('#9a8676'), sombre: hex('#2a201c'), trait: hex('#8a7868'), flanc: [10, 6, 4, 0.4] },
      { ombre: [70, 46, 16, 0.3], levre: [150, 118, 72, 0.9], brin: [hex('#e6d4a4'), hex('#d4bc88')], clair: hex('#d8bc88'), sombre: hex('#8a6a40'), trait: hex('#eedcb0'), flanc: [16, 40, 20, 0.35] },
      { ombre: [16, 40, 20, 0.42], levre: [70, 52, 34, 0.95], brin: [hex('#b8e07a'), hex('#8cc860')], clair: hex('#9a7448'), sombre: hex('#4a3220'), trait: hex('#a8d870'), flanc: [16, 40, 20, 0.35] },
    ];
    // (style selon le sol du plateau : roche ou cendres, sable et terre, herbe)
    const style = (tx, ty, L) => {
      const I = DW.World.CH[(m.rows[ty] || '')[tx]], roc = !!((I && I.sol) || (m.textures && L >= 3));
      return roc ? STY[0] : I && (I.t === 'sand' || I.t === 'dirt') ? STY[1] : STY[2];
    };
    const mel = (i, r, g, b, k) => { const j = i * 4; D[j] += (r - D[j]) * k; D[j + 1] += (g - D[j + 1]) * k; D[j + 2] += (b - D[j + 2]) * k; };
    const vl = (px, py) => (px < 0 || py < 0 || px >= GW || py >= GH ? 255 : VL[py * GW + px]);
    const roche = (px, py) => px < 0 || py < 0 || px >= GW || py >= GH || rock(py * GW + px);
    for (let py = 0; py < GH; py++) { const ty = py >> 4; for (let px = 0; px < GW; px++) {
      const i = py * GW + px, L = VL[i], ze = ZE ? ZE[ty * W + (px >> 4)] : 0;
      if (rock(i) || ze === 2) continue;   // (paroi, escalier : dessinés à part)
      if (L > 0) mel(i, 255, 250, 210, 0.035 * L);   // (un plateau plus haut est un peu plus lumineux)
      if (ze) continue;   // (juste autour d'un escalier : pas de rebord)
      // (un bord : un niveau différent à moins de 4 pixels ; sinon rien d'autre à peindre)
      const n4 = vl(px, py - 4), s3 = vl(px, py + 3), e4 = vl(px + 4, py), w4 = vl(px - 4, py);
      if (n4 === L && s3 === L && e4 === L && w4 === L && vl(px, py - 1) === L && vl(px + 1, py) === L && vl(px - 1, py) === L && vl(px, py + 1) === L) continue;
      const tx = px >> 4;
      // BORD NORD : le plateau touche un niveau plus bas juste au-dessus
      let dn = 0; for (let k = 1; k <= 4; k++) { const n = vl(px, py - k); if (n < L && !roche(px, py - k)) { dn = k; break; } if (n !== L) break; }
      if (dn) {
        const S = style(tx, ty, L);
        if (dn <= 2) mel(i, S.levre[0], S.levre[1], S.levre[2], S.levre[3]);   // lèvre sombre
        else { const h = 1 + Math.floor(Hh2(px >> 1, py - dn, 501) * 3); if (dn - 2 <= h) { const B = S.brin[Hh2(px >> 1, py - dn, 502) < 0.5 ? 0 : 1]; mel(i, B[0], B[1], B[2], 1); } }   // brins qui débordent
      }
      // OMBRE PORTÉE sur le niveau bas, au nord du bord
      for (let k = 1; k <= 3; k++) { const n = vl(px, py + k); if (n > L && n !== 255 && !roche(px, py + k)) { const S = style(tx, Math.min(H - 1, (py + k) >> 4), n); mel(i, S.ombre[0], S.ombre[1], S.ombre[2], S.ombre[3]); break; } if (n !== L) break; }
      // FLANCS EST ET OUEST (et l'ombre du flanc sur le niveau bas d'à côté)
      for (let d = -1; d <= 1; d += 2) {
        let k0 = 0; for (let k = 1; k <= 4; k++) { const n = vl(px + d * k, py); if (n < L && !roche(px + d * k, py)) { k0 = k; break; } if (n !== L) break; }
        if (k0) {
          const S = style(tx, ty, L), t = (k0 - 1) / 3;
          if (k0 === 4) mel(i, S.trait[0], S.trait[1], S.trait[2], 1);
          else mel(i, S.sombre[0] + (S.clair[0] - S.sombre[0]) * t, S.sombre[1] + (S.clair[1] - S.sombre[1]) * t, S.sombre[2] + (S.clair[2] - S.sombre[2]) * t, 1);
        }
        for (let k = 1; k <= 3; k++) { const n = vl(px - d * k, py); if (n > L && n !== 255 && !roche(px - d * k, py)) { const S = style(tx, ty, n); mel(i, S.flanc[0], S.flanc[1], S.flanc[2], S.flanc[3]); break; } if (n !== L) break; }
      }
    } }
  }
  // (sur un canevas déjà peint : pour une carte dont le sol n'a pas été préparé par gfx/terrain.js, ex. l'éditeur)
  function rebords(c, m) {
    if (!m.alt || m._rebordsPix === m.alt) return;
    const GW = m.w * 16, GH = m.h * 16, img = c.getImageData(0, 0, GW, GH), VL = altPixels(m);
    rebordsPixels(m, img.data, VL, i => m.rows[((i / GW) | 0) >> 4][(i % GW) >> 4] === ROCK);
    c.putImageData(img, 0, 0);
  }
  // (une seule fois par carte, en plus du sol peint qu'elle aurait déjà)
  function peindreRebords(m) {
    if (m.paintGround && m.paintGround._rebords) return;
    const base = m.paintGround || null;
    m.paintGround = (c, GW, GH) => { if (base) base(c, GW, GH); rebords(c, m); };
    m.paintGround._rebords = true;
  }
  // un niveau en îlot minuscule (bruit) est rabaissé : pas de pics d'une case
  function smallPatches(alt, W, H) {
    const seen = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (seen[i] || !alt[i]) continue;
      const L = alt[i], cells = [i], q = [i]; seen[i] = 1;
      while (q.length) { const j = q.pop(), x = j % W, y = Math.floor(j / W); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[k] || alt[k] !== L) continue; seen[k] = 1; cells.push(k); q.push(k); } }
      if (cells.length < 12) for (const j of cells) alt[j] = Math.max(0, L - 1);
    }
  }

  // ------------------------------------------------------------ altitude du héros (mise à jour à chaque pas)
  function track(ow) {
    const m = ow.map, p = ow.p; if (!m || !m.alt || !p) { if (p) p.alt = 0; return; }
    const a = m.alt[p.y * m.w + p.x];
    if (a !== PASS && a !== undefined) p.alt = a;   // sur un escalier : on garde le niveau d'où l'on vient
  }

  // ------------------------------------------------------------ vue de développement (frontières, passages, collisions, niveaux)
  const COL = ['rgba(60,140,255,0.0)', 'rgba(80,220,120,0.28)', 'rgba(240,220,60,0.32)', 'rgba(255,140,40,0.36)', 'rgba(255,60,60,0.4)'];
  const R = DW.Relief = {
    MASSIFS, build, track, offset, PASS, rebords, peindreRebords, altPixels, rebordsPixels,
    debug: false,
    allowDebug: typeof location !== 'undefined' && /[?&]debug=geo\b/.test(location.search),
    drawDebug(ow, c, x0, x1, y0, y1) {
      if (!R.debug) return;
      const m = ow.map, TS = 16;
      for (let ty = Math.max(0, y0 >> 4); ty <= Math.min(m.h - 1, y1 >> 4); ty++) for (let tx = Math.max(0, x0 >> 4); tx <= Math.min(m.w - 1, x1 >> 4); tx++) {
        const ch = m.rows[ty][tx], a = m.alt ? m.alt[ty * m.w + tx] : 0;
        if (a === PASS) { c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(tx * TS, ty * TS, TS, TS); }
        else if (a > 0) { c.fillStyle = COL[Math.min(4, a)]; c.fillRect(tx * TS, ty * TS, TS, TS); }
        if (DW.SOLID.has(ch) || ow.solid && ow.solid(tx, ty)) { c.strokeStyle = 'rgba(255,40,40,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx * TS + 3, ty * TS + 3); c.lineTo(tx * TS + 13, ty * TS + 13); c.moveTo(tx * TS + 13, ty * TS + 3); c.lineTo(tx * TS + 3, ty * TS + 13); c.stroke(); }
      }
      // passages vers les cartes voisines
      for (const w of m.warps || []) { c.strokeStyle = w.dir ? '#ff40ff' : '#40ffff'; c.lineWidth = 2; c.strokeRect(w.x * TS + 1, w.y * TS + 1, (w.w || 1) * TS - 2, (w.h || 1) * TS - 2); }
      c.font = '8px monospace'; c.fillStyle = '#ffffff';
      c.fillText(`alt ${ow.p.alt || 0}`, ow.p.x * TS - 2, ow.p.y * TS - 18);
    },
  };
  if (R.allowDebug && typeof window !== 'undefined') window.addEventListener('keydown', e => { if (e.code === 'KeyG') R.debug = !R.debug; });
})();
;

// ===== js/maps/monde.js
'use strict';
// =====================================================================
//  LA GRILLE DU MONDE : une seule référence de positions pour toutes les cartes extérieures
//  Axes : x vers l'EST, y vers le SUD (en cases), z = altitude (niveau de relief de la case, maps/relief.js).
//  Origine : le coin nord-ouest de la Clairière de l'Arrivée (là où tout commence). Chaque carte a une position
//  exacte { x, y, w, h } : une voisine est posée contre le bord commun, son passage aligné sur celui d'en face.
//  Le calcul est déterministe (parcours trié), il ne dépend ni de l'ordre de chargement ni de la génération.
//  Côtés : nord (up), est (right), sud (down), ouest (left). Pour chaque côté d'une carte, on connaît les voisines
//  qui le touchent et sur quelle portion (une carte peut avoir plusieurs voisines d'un même côté) : c'est ce qui
//  sert aux passages, aux fondus de couleur entre biomes (gfx/terrain.js) et aux outils (dev/assemblage.js,
//  dev/geographie.js). Les incohérences (boucle qui ne se referme pas, cartes qui se chevauchent) sont listées.
// =====================================================================
(function () {
  const MAPS = DW.MAPS;
  const SIDES = ['up', 'right', 'down', 'left'];
  const outdoor = id => !!MAPS[id] && !MAPS[id].indoor;
  // dimensions sans construire la carte (régions : connues d'avance ; cartes faites main : lignes ou plan agrandi)
  function dims(id) {
    if (DW.PUZZLE && DW.PUZZLE.isPiece(id)) return DW.PUZZLE.case;   // (une pièce du puzzle a toujours la taille commune)
    const m = MAPS[id];
    if (m.w && m.h) return [m.w, m.h];
    if (m.rows) return [Math.max(...m.rows.map(r => r.length)), m.rows.length];
    const Z = DW.MapKit && DW.MapKit.ZOOM[id]; if (Z) return [Z[1] * Z[0], Z[2] * Z[0]];
    const g = DW.getMap(id); return [g.w, g.h];
  }
  // LE CŒUR DU MONDE : les cartes des chapitres déjà construits (1 à 3) sont posées EN PREMIER et font foi ; une carte
  // d'un chapitre futur qui les contredit (boucle, chevauchement) est marquée « hors grille » en attendant d'être refaite
  const CORE = new Set(['foret', 'plage', 'lac', 'village', 'miharashi']), DISTRICTS = new Set(['residentiel', 'numerique', 'marche']);
  const core = id => (DW.PUZZLE ? DW.PUZZLE.isPiece(id) : CORE.has(MAPS[id].region) && !DISTRICTS.has(id));
  let POS = null, CONF = [], BAD = new Set();
  function build(root = 'clairiere') {
    POS = {}; CONF = []; BAD = new Set();
    const queue = [];
    // les pièces du puzzle (maps/puzzle.js) sont posées d'office ; les autres cartes s'y accrochent par leurs passages
    if (DW.PUZZLE) for (const id in DW.PUZZLE.pieces) if (MAPS[id]) { POS[id] = DW.PUZZLE.pos(id); queue.push(id); }
    if (!queue.length) { const [w0, h0] = dims(root); POS[root] = { x: 0, y: 0, w: w0, h: h0 }; queue.push(root); }
    while (queue.length) {
      queue.sort((a, b) => (core(b) - core(a)) || (a < b ? -1 : 1));   // (parcours déterministe ; le cœur d'abord)
      const id = queue.shift(), A = MAPS[id], P = POS[id];
      for (const w of A.warps || []) {
        if (!w.dir || w.enclos || !outdoor(w.to)) continue;
        const back = DW.MapKit.retour(MAPS[w.to], w, id); if (!back) continue;
        const [bw, bh] = dims(w.to);
        const p = w.dir === 'left' ? [P.x - bw, P.y + w.y - back.y] : w.dir === 'right' ? [P.x + P.w, P.y + w.y - back.y]
          : w.dir === 'up' ? [P.x + w.x - back.x, P.y - bh] : [P.x + w.x - back.x, P.y + P.h];
        const Q = POS[w.to];
        if (Q) { if (Q.x !== p[0] || Q.y !== p[1]) { CONF.push(`${id} → ${w.to} : (${p}) au lieu de (${Q.x},${Q.y})`); for (const k of [id, w.to]) if (!core(k)) BAD.add(k); if (core(id) && core(w.to)) { BAD.add(id); BAD.add(w.to); } } continue; }
        if (!core(w.to) && core(id) === false && BAD.has(id)) continue;   // (on ne prolonge pas une partie déjà hors grille)
        POS[w.to] = { x: p[0], y: p[1], w: bw, h: bh }; queue.push(w.to);
      }
    }
    // chevauchements
    const ids = Object.keys(POS);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = POS[ids[i]], b = POS[ids[j]];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
        CONF.push(`${ids[i]} chevauche ${ids[j]}`);
        const ci = core(ids[i]), cj = core(ids[j]);
        if (ci && cj) { BAD.add(ids[i]); BAD.add(ids[j]); } else if (!ci) BAD.add(ids[i]); else BAD.add(ids[j]);
      }
    }
    return POS;
  }
  // (la grille n'est calculée qu'une fois tous les passages posés : DW.Monde.pret, à la fin de maps/regions.js)
  const all = () => POS || (W.pret ? build() : {});

  const W = DW.Monde = {
    SIDES, build, dims, pret: false,
    pos: id => all()[id] || null,
    conflits: () => (all(), CONF),
    horsGrille: () => (all(), [...BAD]),   // cartes à replacer (chapitres futurs qui contredisent la géographie)
    coeur: id => !!MAPS[id] && core(id),
    // conversion : case du monde → carte et case locale
    toLocal(X, Y) { for (const id in all()) { const p = POS[id]; if (X >= p.x && X < p.x + p.w && Y >= p.y && Y < p.y + p.h) return { id, x: X - p.x, y: Y - p.y }; } return null; },
    // altitude d'une case du monde (0 hors relief, ou si la carte n'est pas encore construite)
    z(X, Y) { const L = W.toLocal(X, Y); if (!L) return 0; const m = MAPS[L.id]; const a = m.alt ? m.alt[L.y * m.w + L.x] : 0; return a === (DW.Relief && DW.Relief.PASS) ? 0 : a || 0; },
    // voisines de chaque côté : [{ side, id, from, to }] (from..to : portion du bord, en cases locales)
    voisines(id) {
      const p = all()[id], out = []; if (!p || BAD.has(id)) return out;
      for (const nid in POS) {
        if (nid === id || BAD.has(nid)) continue;
        const q = POS[nid];
        const vert = (a0, a1, b0, b1) => [Math.max(a0, b0), Math.min(a1, b1)];
        let side = null, r = null;
        if (q.x === p.x + p.w) { side = 'right'; r = vert(p.y, p.y + p.h, q.y, q.y + q.h); }
        else if (q.x + q.w === p.x) { side = 'left'; r = vert(p.y, p.y + p.h, q.y, q.y + q.h); }
        else if (q.y === p.y + p.h) { side = 'down'; r = vert(p.x, p.x + p.w, q.x, q.x + q.w); }
        else if (q.y + q.h === p.y) { side = 'up'; r = vert(p.x, p.x + p.w, q.x, q.x + q.w); }
        if (!side || r[1] - r[0] <= 0) continue;
        const o = side === 'left' || side === 'right' ? p.y : p.x;
        out.push({ side, id: nid, from: r[0] - o, to: r[1] - o });
      }
      return out;
    },
    // annotation d'une carte au moment où on la prépare : sa place et ses voisines (pour les fondus de couleur)
    annoter(id) {
      const m = MAPS[id]; if (!m || m.indoor || !W.pret) return;
      const p = W.pos(id); m.monde = p ? { x: p.x, y: p.y } : null;
      m.voisines = p ? W.voisines(id) : [];
    },
  };
})();
;

// ===== js/maps/miharashi.js
'use strict';
// =====================================================================
//  CHAPITRE 3 — LA GÉOGRAPHIE DU PAYS DE MERAMON, PUIS SES CARTES
//  On définit d'abord le TERRITOIRE en coordonnées du monde : une seule terre (trait de côte, plages), les routes,
//  le massif du Mont Miharashi et les mesas du désert (relief : maps/relief.js). Chaque carte n'est qu'une FENÊTRE
//  sur ce territoire, placée en alignant ses passages avec ceux de ses voisines : de part et d'autre d'une frontière,
//  les deux cartes voient exactement le même terrain (côte, route, relief). Rien ne dépend de l'ordre de chargement.
//  Le long des cartes déjà existantes (Clairière, Sentier, Rosière, Bosquet), la bande frontière reprend la nature
//  du terrain d'en face (forêt, sable, eau) : le CONTRAT DE RACCORDEMENT, vérifié par dev/geographie.js.
//
//   Mont (4) — Route (3) — Village des Yokomon (1) — Désert des Poteaux (0) | Clairière
//                                                     |  Plaine des Panneaux (2) | Sentier
//   (mer au nord et au sud du village, de la route et du mont ; à l'ouest de la plaine et du mont)
// =====================================================================
(function () {
  const Hh = DW.Art.hash, fbm = DW.Art.fbm;
  const N = (x, y, s, f = 0.08) => fbm(x * f, y * f, s);
  const ROCK = 'Ŵ';
  const ZONE = ['miharashi0', 'miharashi1', 'miharashi2', 'miharashi3', 'miharashi4'];
  const WALK = c => c === '.' || c === ',' || c === ';' || c === 's' || c === 'f' || c === '=' || c === 'v';

  // ------------------------------------------------------------ 1) PLACEMENT DES CARTES DANS LE MONDE
  // origine : le Désert des Poteaux ; chaque voisine est posée contre le bord commun, passages alignés
  // (lus dans la grille du monde, maps/monde.js : une seule vérité pour tout le jeu ; ici, origine = le Désert des Poteaux)
  let OFF = null;
  function offsets() {
    if (OFF) return OFF;
    const o = DW.Monde.pos('miharashi0'); OFF = {};
    for (const id of [...ZONE, 'clairiere', 'sentier', 'lac1', 'bosquet']) { const p = DW.Monde.pos(id); if (p) OFF[id] = [p.x - o.x, p.y - o.y]; }
    return OFF;
  }

  // ------------------------------------------------------------ 2) LA TERRE ET LA MER (une seule côte pour tout le pays)
  // terres de chaque carte (coordonnées locales [x0, y0, x1, y1]) ; leur union lissée + un bruit de côte = le littoral
  const LAND = {
    miharashi0: m => [5, -80, m.w + 80, m.h + 80],     // le désert : terre, sauf la côte qui arrive en coin à l'ouest
    miharashi2: m => [13, -80, m.w + 80, m.h + 80],    // la plaine : mer à l'ouest
    miharashi1: m => [-80, 15, m.w + 80, m.h - 13],    // le village : plage au nord, mer au sud
    miharashi3: m => [-80, 15, m.w + 80, m.h - 13],    // la route : idem
    miharashi4: m => [6, 6, m.w + 80, m.h - 6],        // le mont : il remplit la carte, une fine plage au nord, à l'ouest et au sud
  };
  let BOXES = null;
  const boxes = () => BOXES || (BOXES = ZONE.map(id => { const [ox, oy] = offsets()[id], [a, b, c, d] = LAND[id](DW.MAPS[id]); return [a + ox, b + oy, c + ox, d + oy]; }));
  const sdBox = (X, Y, [x0, y0, x1, y1]) => { const dx = Math.max(x0 - X, 0, X - x1), dy = Math.max(y0 - Y, 0, Y - y1); return dx || dy ? Math.hypot(dx, dy) : -Math.min(X - x0, x1 - X, Y - y0, y1 - Y); };
  const smin = (a, b, k = 7) => { const h = DW.clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); };
  // distance signée au rivage : > 0 dans la mer, < 0 sur la terre
  function shore(X, Y) {
    let d = 1e9; for (const b of boxes()) d = smin(d, sdBox(X, Y, b));
    return d + (fbm(X * 0.07, Y * 0.07, 1201) - 0.5) * 8 + (fbm(X * 0.2, Y * 0.2, 1202) - 0.5) * 2.5;
  }

  // ------------------------------------------------------------ 3) LES ROUTES (polylignes du monde)
  const exitCenter = (m, side) => { const [p, l] = m.exits[side]; const c = p + (l - 1) / 2; return { left: [0, c], right: [m.w - 1, c], up: [c, 0], down: [c, m.h - 1] }[side]; };
  const HUB = { miharashi0: [48, 36], miharashi2: [50, 36], miharashi3: [48, 42] };
  let ROADS = null;
  function roads() {
    if (ROADS) return ROADS;
    ROADS = [];
    for (const id in HUB) {
      const m = DW.MAPS[id], [ox, oy] = offsets()[id], [hx, hy] = HUB[id];
      for (const s in m.exits) {
        const [ex, ey] = exitCenter(m, s), mid = [(ex + hx) / 2 + (Hh(ex, ey, 1211) - 0.5) * 12, (ey + hy) / 2 + (Hh(ey, ex, 1212) - 0.5) * 8];
        // le chemin entre bien droit sur ses premières cases (il continue celui d'en face)
        const inn = { left: [ex + 6, ey], right: [ex - 6, ey], up: [ex, ey + 6], down: [ex, ey - 6] }[s];
        ROADS.push([[ex, ey], inn, mid, [hx, hy]].map(([x, y]) => [x + ox, y + oy]));
      }
    }
    return ROADS;
  }
  const segDist = (px, py, [ax, ay], [bx, by]) => { const vx = bx - ax, vy = by - ay, t = DW.clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1); return Math.hypot(px - ax - vx * t, py - ay - vy * t); };
  function roadDist(X, Y) { let d = 99; for (const R of roads()) for (let i = 0; i + 1 < R.length; i++) d = Math.min(d, segDist(X, Y, R[i], R[i + 1])); return d; }

  // ------------------------------------------------------------ 4) LE RELIEF
  // le massif du Mont Miharashi (cône en terrasses + contrefort vers l'est sur la route), en repère du mont
  const MONT = { crater: [43, 23], meramon: [48, 30], summit: [48, 27, 12, 6.5] };
  function massif(xm, ym) {
    const [sx, sy, srx, sry] = MONT.summit;
    if (Math.hypot((xm - sx) / srx, (ym - sy) / sry) < 1) return 5;   // plateau du sommet (le cratère)
    // un grand cône en terrasses qui remplit l'île (5 niveaux), et le contrefort vers l'est sur la route
    const cone = 1 - Math.hypot((xm - 48) / 52, (ym - 36) / 38);
    const ridgeY = 50 + Math.sin(xm * 0.05) * 3, spur = (0.5 - Math.abs(ym - ridgeY) / 13) * DW.clamp((180 - xm) / 30, 0, 1) * DW.clamp((xm - 54) / 18, 0, 1);
    const f = Math.max(cone, spur) + (fbm(xm * 0.06, ym * 0.06, 991) - 0.5) * 0.16;
    return f > 0.74 ? 4 : f > 0.56 ? 3 : f > 0.38 ? 2 : f > 0.18 ? 1 : 0;
  }
  // mesas du désert (repère de chaque carte) : [cx, cy, rx, ry, niveau max]
  const MESAS = {
    miharashi0: [[22, 16, 11, 5.5, 2], [76, 16, 10, 5, 1], [24, 54, 10, 5, 1], [74, 52, 12, 5.5, 2]],
    miharashi2: [[40, 18, 18, 4.5, 1], [50, 52, 16, 4.5, 1], [80, 17, 7, 4, 1], [80, 58, 6, 3.5, 1]],
  };
  function levelOf(id, x, y) {
    const [ox, oy] = offsets()[id], X = x + ox, Y = y + oy;
    if (id === 'miharashi3' || id === 'miharashi4') { const [mx, my] = offsets().miharashi4; return massif(X - mx, Y - my); }
    let L = 0;
    for (const [cx, cy, rx, ry, lv] of MESAS[id] || []) {
      const f = 1 - Math.hypot((x - cx) / rx, (y - cy) / ry) + (fbm(X * 0.15, Y * 0.15, 1221) - 0.5) * 0.35;
      if (f > 0) L = Math.max(L, f > 0.5 && lv > 1 ? 2 : 1);
    }
    return L;
  }

  // ------------------------------------------------------------ 5) PEINTURE D'UNE CARTE : fenêtre sur le territoire
  // classe d'une case (pour le contrat de raccordement avec une carte existante)
  function kind(m, x, y) {
    const ch = (m.rows[y] || '')[x]; if (ch === undefined) return null;
    const I = DW.World.info(ch) || {};
    if (I.t === 'water') return 'E';
    if (I.t === 'canopy' || I.obj === 'tree' || I.obj === 'bigtree' || I.obj === 'oak' || I.obj === 'birch' || I.obj === 'pine') return 'F';
    if (I.t === 'sand') return 'S';
    return 'G';
  }
  function exitCells(m, depth = 6) {
    const set = new Set();
    for (const side in m.exits) { const [p, l] = m.exits[side]; for (let k = 0; k < l; k++) for (let d = 0; d < depth; d++) {
      const [x, y] = { left: [d, p + k], right: [m.w - 1 - d, p + k], up: [p + k, d], down: [p + k, m.h - 1 - d] }[side]; set.add(x + ',' + y); } }
    return set;
  }
  // base commune : mer, plage, sol du biome ; renvoie les cases à protéger (mer, plage, passages)
  function base(g, m, id, ground) {
    const [ox, oy] = offsets()[id], ex = exitCells(m), prot = new Set();
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const X = x + ox, Y = y + oy, d = shore(X, Y), k = x + ',' + y;
      if (ex.has(k)) { g.set(x, y, d > -2 ? 's' : '='); prot.add(k); continue; }
      if (d > 0) { g.set(x, y, Hh(X, Y, 1231) < (d < 3 ? 0.018 : 0.002) ? 'R' : '~'); prot.add(k); continue; }
      if (d > -3.5) { g.set(x, y, Hh(X, Y, 1232) < 0.02 ? 'R' : Hh(X, Y, 1233) < 0.08 ? ';' : 's'); prot.add(k); continue; }
      g.set(x, y, ground(x, y, X, Y));
    }
    return prot;
  }
  // contrat de raccordement : le long d'une carte existante, la bande frontière reprend sa nature (forêt, sable, eau)
  function contracts(g, m, id, chars) {
    const ex = exitCells(m), [ox, oy] = offsets()[id];
    for (const w of m.warps || []) {
      if (!w.dir || ZONE.includes(w.to) || !DW.MAPS[w.to]) continue;
      const B = DW.getMap(w.to), back = DW.MapKit.retour(B, w, id); if (!back) continue;
      const vert = w.dir === 'left' || w.dir === 'right', len = vert ? m.h : m.w, shift = vert ? back.y - w.y : back.x - w.x;
      for (let p = 0; p < len; p++) {
        const q = p + shift;
        for (let d = 0; d < 6; d++) {
          const [x, y] = { left: [d, p], right: [m.w - 1 - d, p], up: [p, d], down: [p, m.h - 1 - d] }[w.dir];
          if (ex.has(x + ',' + y) || g.get(x, y) === '~' || (g.get(x, y) === 's' && d > 0)) continue;
          const [bx, by] = { left: [B.w - 1 - d, q], right: [d, q], up: [q, B.h - 1 - d], down: [q, d] }[w.dir];
          const k = bx >= 0 && by >= 0 && bx < B.w && by < B.h ? kind(B, bx, by) : null;
          if (!k || Hh(x + ox, y + oy, 1241) > [1, 1, 1, 0.8, 0.5, 0.25][d]) continue;   // la nature d'en face s'estompe en 6 cases
          if (k === 'F') g.set(x, y, d < 2 || Hh(x, y, 1242) < 0.6 ? chars.forest : chars.tree);
          else if (k === 'E') g.set(x, y, '~');
          else if (k === 'S') g.set(x, y, 's');
        }
      }
    }
  }
  const nearRoad = (id, x, y, r) => { const [ox, oy] = offsets()[id]; return roadDist(x + ox, y + oy) < r; };
  function drawRoads(g, m, id) {
    const [ox, oy] = offsets()[id];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const c = g.get(x, y); if (c === '~' || c === ROCK || c === '^' || (m.alt && m.alt[y * g.w + x] > 0 && m.alt[y * g.w + x] !== DW.Relief.PASS)) continue;
      if (roadDist(x + ox, y + oy) < 1.7) g.set(x, y, c === 's' ? 's' : '=');
    }
  }
  function sow(g, x0, y0, x1, y1, ch, p, seed, ok, keep) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = g.get(x, y); if (c === undefined || !ok(c) || c === '=' || (keep && keep(x, y))) continue;
      if (Hh(x, y, seed) < p) g.set(x, y, ch);
    }
  }
  const put = (g, x, y, ch) => { if (g.get(x, y) !== undefined && WALK(g.get(x, y)) && g.get(x, y) !== '=') g.set(x, y, ch); };
  function pond(g, cx, cy, rx, ry, ring, seed) {
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d < 1) g.set(x, y, '~'); else if (d < 1.35 && ring && Hh(x, y, seed) < 0.45 && g.get(x, y) !== undefined) g.set(x, y, ring);
    }
  }

  // ------------------------------------------------------------ DÉSERTS DES POTEAUX (sous-zones 0 et 2)
  function desert(g, m, n) {
    const id = 'miharashi' + n, W = g.w, H = g.h;
    // sol : terre sèche pâle, sable, herbes des dunes ; vers le village (à l'ouest du Désert des Poteaux) l'herbe revient
    const prot = base(g, m, id, (x, y, X, Y) => {
      // vers le village (à l'ouest), le désert passe au sable : de part et d'autre de la frontière, du sable (raccord sans couture)
      if (n === 0 && Hh(X, Y, 1251) < DW.clamp((20 - x) / 20, 0, 0.92)) return Hh(X, Y, 1252) < 0.12 ? ';' : 's';
      // (la Plaine des Panneaux est une PLAINE : plus d'herbe et moins de sable que le Désert des Poteaux)
      return N(X, Y, 1253, 0.06) > (n === 2 ? 0.7 : 0.6) ? 's' : N(X, Y, 1254, 0.16) > 0.68 ? ';' : '.';
    });
    // relief : les mesas, avec leurs parois ocre et un escalier pour monter dessus
    DW.Relief.build(g, m, { id, keep: (x, y) => prot.has(x + ',' + y), corridor: (x, y) => nearRoad(id, x, y, 4.5), levelAt: (x, y) => levelOf(id, x, y),
      surface: (x, y, L) => (L === 0 ? g.get(x, y) : Hh(x, y, 1255) < 0.05 ? 'ó' : Hh(x, y, 1256) < 0.04 ? 'õ' : 's') });
    drawRoads(g, m, id);
    contracts(g, m, id, { forest: '#', tree: 'T' });
    const free = c => c === '.' || c === 's' || c === ',';
    const high = (x, y) => m.alt && m.alt[y * W + x] > 0;
    // poteaux télégraphiques : en file le long des routes (une case sur 13, à 3 cases du bord), et quelques bosquets de poteaux
    const [ox, oy] = offsets()[id];
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
      const c = g.get(x, y); if (!free(c) || high(x, y)) continue;
      const X = x + ox, Y = y + oy, rd = roadDist(X, Y);
      if (rd > 2.6 && rd < 3.6 && (X + Y * 3) % 13 === 0) g.set(x, y, 'Ţ');   // (une ligne clairsemée : le joueur trouvait qu'il y en avait trop)
      else if (rd > 2.5 && N(X, Y, 920 + n, 0.09) > (n === 2 ? 0.7 : 0.62) && Hh(X, Y, 921) < 0.015) g.set(x, y, 'Ţ');   // (moins de « forêts » de poteaux dans la Plaine ; tes poteaux, plus massifs que les anciens, clairsemés)
    }
    // panneaux routiers (la Plaine en est couverte), vestiges numériques, arbres morts, rochers, os
    const off = (x, y) => nearRoad(id, x, y, 2.5) || high(x, y);
    sow(g, 6, 6, W - 7, H - 7, 'Ŝ', n === 2 ? 0.018 : 0.004, 922 + n, c => c === '.' || c === 's', off);
    sow(g, 8, 8, W - 9, H - 9, '!', 0.0025, 923 + n, c => c === '.' || c === 's', off);
    sow(g, 8, 8, W - 9, H - 9, '?', 0.0018, 924 + n, c => c === '.' || c === 's', off);
    sow(g, 6, 6, W - 7, H - 7, '|', 0.004, 925 + n, c => c === '.', off);
    sow(g, 6, 6, W - 7, H - 7, 'Ó', 0.005, 926 + n, c => c === '.' || c === 's', off);
    sow(g, 6, 6, W - 7, H - 7, 'õ', 0.003, 928 + n, c => c === 's', off);
    // la Plaine : des bosquets d'arbres et de buissons çà et là dans l'herbe (comme ceux que tu y as plantés dans l'atelier ;
    // jamais à côté de tes arbres, ni sur les mesas, ni près des routes)
    if (n === 2) {
      const T0 = DW.Retouches && DW.Retouches.de(id), tiens = (T0 && T0.ajouts) || [], presDesTiens = (x, y) => tiens.some(o => Math.abs(o.x - x) <= 2 && Math.abs(o.y - y) <= 2);
      for (let y = 6; y < H - 6; y++) for (let x = 6; x < W - 6; x++) {
        if (g.get(x, y) !== '.' || off(x, y) || presDesTiens(x, y)) continue;
        const v = N(x + ox, y + oy, 1291, 0.08), h = Hh(x + ox, y + oy, 1292);
        if (v > 0.69) { if (h < 0.55) g.set(x, y, 'T'); else if (h < 0.8) g.set(x, y, 'b'); }
        else if (v > 0.64 && h < 0.18) g.set(x, y, 'b');
      }
    }
    // une oasis au Désert des Poteaux (palmiers, roseaux)
    if (n === 0) { const [px, py] = [40, 26]; if (!high(px, py) && !nearRoad(id, px, py, 6)) { pond(g, px, py, 4.2, 2.4, 'Ð', 929); for (const [dx, dy] of [[-6, -1], [5, -2], [-4, 3], [7, 2]]) put(g, px + dx, py + dy, 'p'); } }
    // panneaux d'orientation à la sortie de la forêt
    const fx = m.exits.right ? exitCenter(m, 'right') : null;
    if (fx) {
      for (const [dx, dy] of [[-7, -4], [-10, -3], [-13, -5], [-8, 4], [-11, 5], [-15, 4]]) put(g, fx[0] + dx, Math.round(fx[1] + dy), 'Ŝ');
      // (la place prévue peut tomber dans la lisière reprise de la carte d'en face — la forêt du Sentier, à la Plaine des
      //  Panneaux : le panneau se pose alors sur la case praticable la plus proche, hors de la route)
      const libre = (x, y) => WALK(g.get(x, y)) || g.get(x, y) === 'Ŝ';
      let sx = fx[0] - 4, sy = Math.round(fx[1]) - 3;
      if (!libre(sx, sy)) {
        let best = null;
        for (let r = 1; r <= 6 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r && !best; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && libre(sx + dx, sy + dy) && g.get(sx + dx, sy + dy) !== '=') best = [sx + dx, sy + dy];
        if (best) [sx, sy] = best;
      }
      if (libre(sx, sy)) { g.set(sx, sy, 'S'); m.signs[sx + ',' + sy] = n === 0
        ? "↑ Rosière · ↓ Plaine des Panneaux · ← Village des Yokomon · → Clairière de l'Arrivée. Les poteaux suivent l'ancienne ligne... jusqu'au village."
        : "↑ Désert des Poteaux · ↓ Bosquet des Pousses · → Sentier des Murmures. Qui a planté tous ces panneaux ? Mystère..."; }
    }
  }

  // ------------------------------------------------------------ VILLAGE DES YOKOMON (sous-zone 1)
  function village(g, m) {
    const id = 'miharashi1', W = g.w, H = g.h, ex = exitCells(m);
    const occ = new Set(); for (const o of m.objects) for (let y = o.y - 1; y < o.y + o.h + 1; y++) for (let x = o.x - 1; x < o.x + o.w + 1; x++) occ.add(x + ',' + y);
    // sol : herbe rase ; vers le désert (à l'est), le sable gagne
    base(g, m, id, (x, y, X, Y) => (Hh(X, Y, 1261) < DW.clamp((x - (W - 22)) / 20, 0, 0.92) ? (Hh(X, Y, 1262) < 0.12 ? ';' : 's') : N(X, Y, 934, 0.1) > 0.7 ? ',' : '.'));
    const free = (x, y) => !occ.has(x + ',' + y) && !ex.has(x + ',' + y) && WALK(g.get(x, y));
    // le petit lac et l'épave (banc de sable)
    pond(g, 24, 49, 11, 5.5, null);
    for (let y = 45; y <= 53; y++) for (let x = 17; x <= 31; x++) { const d = Math.hypot((x - 24) / 7, (y - 49.5) / 3.4); if (d < 1) g.set(x, y, d < 0.75 ? 's' : ';'); }
    for (let y = 40; y < 60; y++) for (let x = 8; x < 40; x++) if (free(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g.get(x + dx, y + dy) === '~') && Hh(x, y, 937) < 0.4) g.set(x, y, 'Ð');
    // un passage de planches, au sud du petit lac, jusqu'au banc de sable de l'épave (quête de l'épave : game/quetes.js)
    for (let y = 52; y <= 56; y++) for (const x of [24, 25]) { const c = g.get(x, y); if (c === '~') g.set(x, y, '_'); else if (c === 'Ð') g.set(x, y, '.'); }
    // la place autour de la fontaine, les allées vers chaque hutte et vers les sorties
    for (let y = 22; y <= 36; y++) for (let x = 34; x <= 62; x++) if (Math.hypot((x - 48) / 13, (y - 29.5) / 6.5) < 1 && free(x, y)) g.set(x, y, '=');
    const road = (pts, r, keep) => { for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if (dx * dx + dy * dy > r * r) continue; const X = Math.round(x + dx), Y = Math.round(y + dy); if (keep(X, Y) || g.get(X, Y) === undefined || g.get(X, Y) === '~') continue; g.set(X, Y, '='); } } } };
    for (const o of m.objects.filter(o => o.kind === 'yokohut')) road([[o.x + 2, o.y + o.h], [48, 30]], 0.8, (x, y) => occ.has(x + ',' + y) && y !== o.y + o.h);
    for (const s in m.exits) { const e = exitCenter(m, s); road([e, [{ left: e[0] + 6, right: e[0] - 6 }[s] || e[0], e[1]], [(e[0] + 48) / 2, (e[1] + 31) / 2 + 3], [48, 33]], 1.6, (x, y) => occ.has(x + ',' + y)); }
    // champs de fleurs des Yokomon (fleurs bleues) bordés de haies, et un potager
    const field = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!free(x, y) || g.get(x, y) === '=') continue; const edge = x === x0 || x === x1 || y === y0 || y === y1; g.set(x, y, edge ? (y === y1 && Math.abs(x - (x0 + x1) / 2) < 1.5 ? '.' : 'K') : (x + y) % 2 ? 'd' : 'f'); } };
    field(72, 30, 84, 37); field(10, 30, 21, 37);
    for (let y = 50; y <= 56; y++) for (let x = 55; x <= 69; x++) if (free(x, y) && g.get(x, y) !== '=') g.set(x, y, (y % 3 === 0) ? '=' : 'f');
    // vie du village : puits, bancs, lanternes, caisses, tonneaux, drapeaux
    for (const [x, y, ch] of [[41, 25, 'e'], [55, 26, 'J'], [40, 34, 'J'], [37, 29, 'i'], [59, 29, 'i'], [48, 21, 'i'], [32, 20, 'D'], [65, 20, 'a'], [66, 20, 'D'], [31, 41, 'a'], [60, 48, 'D'], [53, 39, 'i'], [43, 39, 'i'],
      [23, 27, 'V'], [74, 27, 'V'], [78, 41, 'J'], [17, 41, 'J']]) put(g, x, y, ch);
    // grands arbres d'ombre, palmiers le long de la plage du nord
    for (const [x, y] of [[29, 18], [68, 19], [15, 23], [86, 23], [9, 45], [88, 48], [34, 58], [76, 56]]) put(g, x, y, Hh(x, y, 935) < 0.5 ? 'Y' : 'T');
    for (let y = 0; y < H / 2; y++) for (let x = 0; x < W; x++) if (free(x, y) && g.get(x, y) !== '=' && [1, 2, 3].some(k => g.get(x, y - k) === 's') && Hh(x, y, 936) < 0.06) g.set(x, y, 'p');
    g.set(48, 31, 'S');
    // MOBILIER DES YOKOMON (images de la planche VILLAGE BEBE du joueur, dossier « bebe » : gfx/textures.js ; les huttes sont
    // ses tipis, les bancs, lampadaires et caisses du village prennent aussi ses images) : aire de jeux au sud, kiosque à musique et pavillon
    // fleuri à l'ouest, moulin qui devrait pomper l'eau à l'est, tableau d'affichage, poteaux indicateurs, fleurs et jouets.
    // Un décor ne se pose que sur des cases libres (ni route, ni hutte, ni sortie) : sinon il est simplement omis.
    const libreSous = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (!free(xx, yy) || g.get(xx, yy) === '=' || m.signs[xx + ',' + yy]) return false; return true; };
    for (const [n, x, y, w, h] of [
      ['toboggan', 63, 47, 2, 1], ['balancoire', 66, 47, 2, 1], ['tape_cul', 69, 48, 2, 1], ['bac_sable', 64, 49, 2, 1], ['jeu_ressort', 68, 46, 1, 1], ['tourniquet', 71, 46, 2, 1],
      ['cubes', 62, 49, 1, 1], ['panier_balles', 72, 48, 1, 1],
      ['scene_musique', 6, 20, 3, 2], ['pavillon_fleur', 5, 25, 3, 2], ['buisson_fleurs', 2, 27, 1, 1], ['trefles', 10, 27, 1, 1], ['moulinets', 9, 22, 1, 1],
      ['moulin', 77, 25, 3, 2], ['jardiniere', 74, 23, 2, 1], ['carillon', 81, 24, 1, 1],
      ['panneau_affichage', 56, 22, 2, 1], ['boite_lettres', 31, 26, 1, 1], ['poubelle', 57, 37, 1, 1],
      ['poteau_indicateur', 87, 32, 1, 1], ['poteau_indicateur', 7, 32, 1, 1],
      ['champignon_geant', 34, 44, 1, 1], ['nid_oeufs', 12, 41, 1, 1], ['oeufs', 21, 39, 1, 1], ['fanions', 26, 33, 2, 1], ['fanions', 66, 33, 2, 1], ['ballons', 62, 27, 1, 1],
      // le camp des tipis : feux de camp et lanternes entre les tentes
      ['feu_camp', 16, 40, 2, 1], ['feu_camp', 35, 20, 2, 1], ['lanterne_camp', 28, 38, 1, 1], ['lanterne_camp', 68, 21, 1, 1], ['banc_camp', 18, 42, 2, 1],
    ]) {
      if (!libreSous(x, y, w, h)) continue;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) g.set(xx, yy, g.get(xx, yy) === 's' ? 's' : '.');
      m.objects.push({ kind: 'tex_bebe_' + n, v: 0, x, y, w, h });
      for (let yy = y - 1; yy < y + h + 1; yy++) for (let xx = x - 1; xx < x + w + 1; xx++) occ.add(xx + ',' + yy);
      if (n === 'panneau_affichage') for (let k = 0; k < w; k++) m.signs[(x + k) + ',' + y] = () => DW.say(DW.state.flags.meramon
        ? "Le tableau du village : « LA FONTAINE COULE ! Merci à l'humain, à Sora et à Biyomon. Arrosage des fleurs : tous les matins ! »"
        : "Le tableau du village : « Fontaine à sec. Économisez l'eau ! Ne vous approchez pas du Mont Miharashi : Meramon brûle tout. »");
      if (n === 'poteau_indicateur') m.signs[x + ',' + y] = x > 48 ? '→ Désert des Poteaux · Clairière de l\'Arrivée. ← Place de la fontaine.' : '← Route du Mont Miharashi (Meramon !) · → Place de la fontaine.';
    }
  }

  // ------------------------------------------------------------ DÉCOR DE MONTAGNE PAR ÉTAGE (décors peints : gfx/premium.js)
  // L 1 : sous-bois de montagne (grandes feuilles, fougères, jeunes sapins, rochers moussus) ; L 2 : pins tordus, blocs,
  // genêts, éboulis ; L 3 : aiguilles rocheuses, éboulis, blocs ; L 4 (cendres du cratère) : éboulis, cristaux de feu.
  // Jamais sur un chemin, un escalier ni à côté : la montée reste lisible ; densité d (0..1) pour la route, plus clairsemée.
  const ETAGES = [null,
    [['feuillage', 1, 3], ['fougeres', 0, 3], ['pousse', 2, 2], ['rochersmousse', 1, 1.5], ['buissonfleuri', 2, 1], ['feuillesmortes', 2, 1]],
    [['pintordu', 0, 0.35], ['blocs', 1, 0.5], ['buissonfleuri', 2, 1.8], ['eboulis', 1, 0.6], ['pousse', 2, 1.8], ['rochersmousse', 1, 0.5], ['feuillage', 1, 1.2], ['fougeres', 2, 1], ['oyats', 1, 0.8]],
    [['aiguille', 0, 1.2], ['aiguille', 1, 1.2], ['eboulis', 0, 0.9], ['blocs', 1, 0.6], ['pintordu', 0, 0.3], ['pousse', 2, 1], ['buissonfleuri', 2, 0.8], ['cristaux', 2, 0.3]],
    [['aiguille', 2, 1.4], ['eboulis', 0, 1], ['blocs', 1, 0.6], ['aiguille', 0, 0.8], ['cristaux', 0, 0.3]],
    [['aiguille', 2, 2], ['eboulis', 0, 1.2], ['cristaux', 0, 0.6], ['blocs', 1, 0.4]]];
  // LA MONTAGNE DU JOUEUR (images de sa planche « Montagnes », gfx/textures.js) : au pied, buissons, herbes hautes et
  // fleurs ; plus haut, herbes sèches, edelweiss, arbustes secs et rochers ; puis herbes rousses, gros blocs, éboulis et
  // aiguilles ; près du cratère, aiguilles et éboulis. [décor, variante, poids, praticable]
  const ETAGES_MONT = [null,
    [['tex_commun_mont_buisson', 0, 2], ['tex_commun_mont_herbes_hautes', 0, 2.5, true], ['tex_commun_mont_fleurs_violettes', 0, 1.2, true], ['tex_commun_mont_buisson_baies', 0, 1],
     ['tex_commun_mont_rocher_mousse', 0, 1], ['fougeres', 0, 1.2], ['rochersmousse', 1, 0.6]],
    [['tex_commun_mont_herbes_seches', 0, 2, true], ['tex_commun_mont_edelweiss', 0, 1, true], ['tex_commun_mont_arbuste_sec', 0, 1.2], ['tex_commun_mont_rocher', 0, 1],
     ['tex_commun_mont_petit_rocher', 0, 1], ['tex_commun_mont_eboulis', 0, 0.7], ['pintordu', 0, 0.35], ['tex_commun_mont_cairn', 0, 0.2]],
    [['tex_commun_mont_herbe_rousse', 0, 1.6, true], ['tex_commun_mont_herbes_seches', 0, 1, true], ['tex_commun_mont_gros_rocher', 0, 0.8], ['tex_commun_mont_eboulis_gros', 0, 0.8],
     ['tex_commun_mont_aiguille', 0, 1], ['aiguille', 1, 0.8], ['tex_commun_mont_arbuste_sec', 0, 0.6], ['tex_commun_mont_petit_rocher', 0, 0.6]],
    [['tex_commun_mont_aiguille', 0, 1.2], ['aiguille', 2, 1.2], ['tex_commun_mont_eboulis', 0, 1], ['tex_commun_mont_herbe_rousse', 0, 0.8, true], ['tex_commun_mont_eboulis_gros', 0, 0.6]],
    [['aiguille', 2, 1.6], ['tex_commun_mont_eboulis', 0, 1], ['tex_commun_mont_aiguille', 0, 0.8]]];
  // sols selon l'altitude (gfx/terrain.js, map.solsNiveau) : herbe de montagne puis terre sèche ; rocaille en terre, gravier,
  // puis roche craquelée près du sommet (les cendres du cratère gardent leur image)
  // (chaque niveau mêle deux sols par grandes taches : [sol, taches] ; près du cratère, cendre et gravier)
  const SOLS_MONT = { herbe: [null, null, 'mont_herbe_alpine', ['mont_herbe_alpine', 'mont_terre_seche'], ['mont_terre_seche', 'mont_herbe_alpine'], 'mont_terre_seche'],
    rocaille: [null, 'mont_terre_seche', ['mont_terre_seche', 'mont_herbe_alpine'], ['mont_gravier', 'mont_terre_seche'], ['mont_gravier', 'volcan:sol_cendres'], ['volcan:sol_cendres', 'mont_gravier']],
    cendres: 'mont_gravier' };
  function decorEtages(g, m, d = 1, skip, TAB = ETAGES) {
    const W = g.w, H = g.h, A = m.alt; if (!A) return;
    const libre = (x, y) => { const c = g.get(x, y); return c === '.' || c === ',' || c === 'j' || c === 'n' || c === 'ǥ' || c === 'ţ'; };
    const CH = m.chemins || new Set();
    const pres = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = g.get(x + dx, y + dy); if (c === '^' || c === undefined || CH.has((y + dy) * W + x + dx) || (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (c === ROCK || (c === '=' && A[(y + dy) * W + x + dx] < 3)))) return true; } return false; };
    const occ = new Set(); for (const o of m.objects || []) for (let yy = o.y - 1; yy <= o.y + (o.h || 1); yy++) for (let xx = o.x - 1; xx <= o.x + (o.w || 1); xx++) occ.add(xx + ',' + yy);
    // (une case posée sépare-t-elle ses voisines ? petite recherche autour d'elle, au même niveau)
    // (place réelle d'un dessin : demi-largeur et hauteur en cases, d'après sa taille peinte)
    const taille = k => { const o = DW.World.OBJ[k] || {}, s = o.scale || (DW.World.OBJ_SCALE && DW.World.OBJ_SCALE[k]) || 1, w = typeof o.w === 'number' ? o.w : 16, h = typeof o.h === 'number' ? o.h : 16; return [Math.ceil(w * s / 32), Math.max(1, Math.ceil(h * s / 16))]; };
    const place = (x, y, k) => {
      const [hw, hr] = taille(k), L0 = A[y * W + x];
      for (let yy = y - hr + 1; yy <= y; yy++) for (let xx = x - hw; xx <= x + hw; xx++) {
        const c = g.get(xx, yy), I = c && DW.World.CH[c];
        if (c === undefined || c === ROCK || c === '^' || occ.has(xx + ',' + yy) || A[yy * W + xx] !== L0 || (I && I.obj)) return false;
      }
      for (let yy = y + 1; yy <= y + 3; yy++) for (let xx = x - hw - 1; xx <= x + hw + 1; xx++) { const I = DW.World.CH[g.get(xx, yy)]; if (I && (I.obj === 'tree' || I.obj === 'bigtree' || I.obj === 'palm')) return false; }   // (feuillage d'un arbre placé dessous)
      return true;
    };
    const reserver = (x, y, k) => { const [hw, hr] = taille(k); for (let yy = y - hr; yy <= y + 1; yy++) for (let xx = x - hw - 1; xx <= x + hw + 1; xx++) occ.add(xx + ',' + yy); };
    const bloc = new Set(), D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const coupe = (x, y) => {
      const L = A[y * W + x], ok = (a, b) => a >= 0 && b >= 0 && a < W && b < H && (a !== x || b !== y) && A[b * W + a] === L && !DW.SOLID.has(g.get(a, b)) && !bloc.has(a + ',' + b);
      const V = D4.map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => ok(a, b)); if (V.length < 2) return false;
      const vu = new Set([V[0].join()]), q = [V[0]];
      while (q.length) { const [a, b] = q.pop(); for (const [dx, dy] of D4) { const na = a + dx, nb = b + dy, k = na + ',' + nb; if (vu.has(k) || Math.abs(na - x) > 12 || Math.abs(nb - y) > 12 || !ok(na, nb)) continue; vu.add(k); q.push([na, nb]); } }
      return V.some(v => !vu.has(v.join()));
    };
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
      const L = A[y * W + x]; if (!(L >= 1 && L <= 5) || !TAB[L] || !libre(x, y) || pres(x, y) || occ.has(x + ',' + y) || (skip && skip(x, y))) continue;
      const nb = N(x, y, 990 + L, 0.12), dens = [0, 0.1, 0.085, 0.08, 0.075, 0.07][L] * d * (nb > 0.56 ? 2.4 : nb > 0.45 ? 1 : 0.35);   // (en bosquets, pas en semis régulier)
      if (Hh(x, y, 991 + L) > dens) continue;
      const T = TAB[L], tot = T.reduce((a, t) => a + t[2], 0); let r = Hh(x, y, 993) * tot, pick = T[0];
      for (const t of T) { if (r < t[2]) { pick = t; break; } r -= t[2]; }
      if (!DW.World.OBJ[pick[0]]) continue;   // (image du joueur absente : rien)
      const plat = (DW.World.PLATS && DW.World.PLATS.has(pick[0])) || pick[3] === true;
      if (!place(x, y, pick[0])) continue;
      if (!plat && coupe(x, y)) continue;
      if (!plat) bloc.add(x + ',' + y);
      m.objects.push({ kind: pick[0], v: pick[1], x, y, w: 1, h: 1, ...(plat ? { walk: true } : {}) });
      reserver(x, y, pick[0]);
    }
  }

  // ------------------------------------------------------------ DANGERS DU VOLCAN (game/lave.js)
  // boules de lave et fissures fumantes sur les étages hauts (jamais sur un sentier, un escalier, ni devant Meramon :
  // on peut toujours les éviter) ; coulées de lave qui partent du bord du cratère et descendent sur le sommet
  function dangers(g, m, cx, cy, crater) {
    const W = g.w, H = g.h, A = m.alt, CH = m.chemins || new Set();
    const loin = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = g.get(x + dx, y + dy); if (c === '^' || c === ROCK || CH.has((y + dy) * W + x + dx)) return false; } return true; };
    const occ = new Set(); for (const o of m.objects) for (let yy = o.y - 1; yy <= o.y + (o.h || 1); yy++) for (let xx = o.x - 1; xx <= o.x + (o.w || 1); xx++) occ.add(xx + ',' + yy);
    let n = 0;
    for (let y = 3; y < H - 3 && n < 26; y++) for (let x = 3; x < W - 3 && n < 26; x++) {
      const L = A[y * W + x], c = g.get(x, y);
      if (L < 4 || L === DW.Relief.PASS || (c !== 'ţ' && c !== 'ǥ') || occ.has(x + ',' + y) || !loin(x, y) || Math.hypot(x - cx, (y - cy) * 1.4) < 6) continue;
      if (Hh(x, y, 1301) > (L === 5 ? 0.12 : 0.06)) continue;
      const k = Hh(x, y, 1302) < 0.5 ? 'bouledelave' : 'fissure';
      m.objects.push({ kind: k, v: Hh(x, y, 1303) < 0.5 ? 0 : 1, x, y, w: 1, h: 1, walk: true });
      for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) occ.add(xx + ',' + yy);
      n++;
    }
    // COULÉES QUI DESCENDENT LE VOLCAN : elles partent du bord du lac de lave et suivent la pente, d'un niveau à l'autre :
    //  - jamais vers le haut, et elle ne change de niveau QUE par une falaise qu'on voit (paroi sud) : sur la terrasse,
    //    elle serpente vers le haut de falaise le plus proche (comme l'eau vers sa sortie), avec de l'élan et du hasard ;
    //    les bords nord, est et ouest (sans paroi visible), elle les longe sans les franchir ;
    //  - au-dessus de la falaise, elle DÉGOULINE tout droit le long de la roche jusqu'au pied, en cascade ;
    //  - et ainsi de suite, terrasse après terrasse, jusqu'au pied du volcan où elle s'étale et s'arrête.
    // Elle contourne les arbres et les rochers, ne passe jamais sur un escalier ni sur Meramon.
    m.coulees = [];
    if (!crater) return;
    const lcx = crater.x + crater.w / 2, lcy = crater.y + crater.h / 2, lave = (x, y) => g.get(x, y) === 'ȴ', alt = (x, y) => A[y * W + x];
    const libre = (x, y) => { const c = g.get(x, y); return c !== undefined && c !== '^' && alt(x, y) !== DW.Relief.PASS && !lave(x, y) && (c === ROCK || !DW.SOLID.has(c)); };
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    // distance (en cases, sur la même terrasse) jusqu'au plus proche haut de falaise
    const loinFalaise = new Int16Array(W * H).fill(9999), file = [];
    for (let y = 1; y < H - 2; y++) for (let x = 1; x < W - 1; x++) if (libre(x, y) && g.get(x, y) !== ROCK && g.get(x, y + 1) === ROCK && alt(x, y + 1) < alt(x, y)) { loinFalaise[y * W + x] = 0; file.push(x, y); }
    for (let q = 0; q < file.length; q += 2) {
      const x = file[q], y = file[q + 1], d = loinFalaise[y * W + x];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1 || loinFalaise[ny * W + nx] <= d + 1 || !libre(nx, ny) || g.get(nx, ny) === ROCK || alt(nx, ny) !== alt(x, y)) continue; loinFalaise[ny * W + nx] = d + 1; file.push(nx, ny); }
    }
    const couler = (sx, sy, seed, max, v0) => {
      const ch = [], vu = new Set(); let x = sx, y = sy, vx = v0 ? v0[0] : sx - lcx, vy = v0 ? v0[1] : sy - lcy, pied = 0;
      { const d = Math.hypot(vx, vy) || 1; vx /= d; vy /= d; }
      const fin = 5 + Math.floor(Hh(seed, 1, 1324) * 7);
      while (ch.length < max) {
        ch.push([x, y]); vu.add(x + ',' + y);
        if (g.get(x, y) === ROCK) {   // sur la paroi : la lave tombe tout droit jusqu'au pied de la falaise
          let yy = y + 1; while (g.get(x, yy) === ROCK && !vu.has(x + ',' + yy)) { ch.push([x, yy]); vu.add(x + ',' + yy); yy++; }
          if (!libre(x, yy) || vu.has(x + ',' + yy)) break;
          y = yy; continue;
        }
        const a = alt(x, y);
        if (a <= 1 && ++pied > fin) break;   // au pied du volcan : elle s'étale et s'arrête
        let best = null;
        for (const [dx, dy] of DIRS) {
          const nx = x + dx, ny = y + dy;
          if (nx < 2 || ny < 2 || nx >= W - 2 || ny >= H - 2 || vu.has(nx + ',' + ny) || !libre(nx, ny)) continue;
          if (Math.hypot(nx - cx, (ny - cy) * 1.4) < 4.5) continue;   // (jamais sur Meramon)
          const roc = g.get(nx, ny) === ROCK, na = alt(nx, ny);
          if (na > a) continue;   // jamais vers le haut
          if (roc && (dx || dy !== 1)) continue;   // (on n'entre dans une paroi que par le haut)
          if (!roc && na < a) continue;   // (pas de chute par un bord sans paroi : nord, est, ouest)
          if (dx && dy && (na !== a || alt(x + dx, y) !== a || alt(x, y + dy) !== a || g.get(x + dx, y) === ROCK || g.get(x, y + dy) === ROCK)) continue;   // (pas de diagonale par-dessus un rebord)
          const l = Math.hypot(dx, dy), lf = loinFalaise[ny * W + nx], d0 = loinFalaise[y * W + x];
          const sc = (dx * vx + dy * vy) / l * 0.6 + (roc ? 6 : 0) + (lf < 9999 && d0 < 9999 ? (d0 - lf) * 1.1 : 0) + (N(nx, ny, seed, 0.4) - 0.5) * 1.4 + dy * 0.1;
          if (!best || sc > best[2]) best = [nx, ny, sc, dx / l, dy / l];
        }
        if (!best) break;
        vx = vx * 0.72 + best[3] * 0.28; vy = vy * 0.72 + best[4] * 0.28; { const d = Math.hypot(vx, vy) || 1; vx /= d; vy /= d; }
        x = best[0]; y = best[1];
      }
      return ch;
    };
    const departs = [];
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (libre(x, y) && alt(x, y) === 5 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => lave(x + dx, y + dy)) && Math.hypot(x - cx, (y - cy) * 1.4) > 4.5) departs.push([x, y]);
    departs.sort((a, b) => Math.atan2(a[1] - lcy, a[0] - lcx) - Math.atan2(b[1] - lcy, b[0] - lcx));
    const nb = Math.min(10, departs.length);
    for (let i = 0; i < nb; i++) {
      const [sx, sy] = departs[Math.floor((i + Hh(i, 3, 1320) * 0.6) / nb * departs.length) % departs.length];
      const ch = couler(sx, sy, 1330 + i, 26 + Math.floor(Hh(i, 4, 1321) * 34));
      if (ch.length >= 4) m.coulees.push(ch);
      // bras secondaire : sur une terrasse, la coulée se divise et un bras part de côté
      if (ch.length >= 12 && Hh(i, 5, 1322) < 0.5) {
        const k = Math.floor(ch.length * (0.35 + Hh(i, 7, 1325) * 0.3)), [bx, by] = ch[k], [px, py] = ch[k - 1];
        if (g.get(bx, by) !== ROCK) { const s1 = Hh(i, 6, 1323) < 0.5 ? 1 : -1, dx = bx - px, dy = by - py, ox = -dy * s1, oy = dx * s1;
          if (libre(bx + ox, by + oy)) { const br = couler(bx + ox, by + oy, 1340 + i, 10 + Math.floor(Hh(i, 8, 1326) * 16), [dx + ox, dy + oy]); if (br.length >= 4) m.coulees.push(br); } }
      }
    }
  }

  // ------------------------------------------------------------ ROUTE DU MONT MIHARASHI (sous-zone 3)
  function route(g, m) {
    const id = 'miharashi3', W = g.w, H = g.h;
    const prot = base(g, m, id, (x, y, X, Y) => (N(X, Y, 944, 0.12) > 0.66 ? ',' : N(X, Y, 945, 0.2) > 0.8 ? 'n' : '.'));
    const R = DW.Relief.build(g, m, { id, keep: (x, y) => prot.has(x + ',' + y), corridor: (x, y) => nearRoad(id, x, y, 4.5), levelAt: (x, y) => levelOf(id, x, y),
      foot: m.exits && m.exits.right ? [W - 4, Math.round(m.exits.right[0] + 2)] : undefined,   // (on arrive du Village des Yokomon, à l'est)
      surface: (x, y, L) => (L === 0 ? g.get(x, y) : Hh(x, y, 946 + L) < 0.025 ? 'T' : N(x, y, 950 + L, 0.15) > 0.72 ? ',' : L >= 2 && N(x, y, 952 + L, 0.1) > 0.62 ? '=' : '.') });
    drawRoads(g, m, id);
    m.solsNiveau = { herbe: SOLS_MONT.herbe };
    decorEtages(g, m, 0.7, null, ETAGES_MONT);
    // BOSQUETS de la jungle du pied du mont, plus fournis vers l'ouest (avant : des arbres semés un par un, partout pareil,
    // comme un verger) : des massifs denses là où le bruit est fort, bordés de buissons et de cycas, quelques arbres isolés
    // ailleurs ; jamais sur les terrasses ni près des routes
    const high = (x, y) => m.alt && m.alt[y * W + x] > 0;
    for (let y = 3; y <= H - 4; y++) for (let x = 3; x <= W - 4; x++) {
      const c = g.get(x, y); if ((c !== '.' && c !== ',') || high(x, y) || nearRoad(id, x, y, 3)) continue;
      const v = N(x, y, 1281, 0.07) + (1 - x / W) * 0.12, h = Hh(x, y, 1282);
      if (v > 0.66) g.set(x, y, h < 0.84 ? 'T' : 'Ô');                                       // cœur du bosquet
      else if (v > 0.6) { if (h < 0.34) g.set(x, y, 'b'); else if (h < 0.44) g.set(x, y, 'Ô'); }   // lisière : buissons, cycas
      else if (h < 0.006) g.set(x, y, 'T');                                                  // arbre isolé
    }
    sow(g, 5, 5, Math.round(W * 0.3), H - 6, 'ì', 0.005, 950, c => c === '.', (x, y) => high(x, y) || nearRoad(id, x, y, 2.5));
    sow(g, 5, 5, W - 6, H - 6, 'Ó', 0.004, 949, c => c === '.' || c === ',', (x, y) => nearRoad(id, x, y, 2.5));
    // belvédère : une longue-vue sur le plus haut plateau de la crête
    if (R) {
      // (sur un plateau qu'on peut VRAIMENT atteindre à pied depuis la route : on suit les escaliers depuis le carrefour)
      const reach = new Set(), q = [m.spec.hub]; reach.add(m.spec.hub.join());
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy), c = g.get(x + dx, y + dy); if (reach.has(k) || c === undefined || DW.SOLID.has(c)) continue; reach.add(k); q.push([x + dx, y + dy]); } }
      let best = null; for (const C of R.comps) { if (!C.cells.some(([x, y]) => reach.has(x + ',' + y))) continue; if (!best || C.L > best.L || (C.L === best.L && C.cells.length > best.cells.length)) best = C; }
      const c = best && best.cells.filter(([x, y]) => WALK(g.get(x, y)) && g.get(x, y) !== '=' && reach.has(x + ',' + y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has((x + dx) + ',' + (y + dy)) && WALK(g.get(x + dx, y + dy)))).sort((a, b) => Math.abs(a[0] - W * 0.55) - Math.abs(b[0] - W * 0.55))[0];
      // (son texte suit l'histoire : Meramon calmé, il est redescendu de sa montagne — le volcan, lui, fume toujours)
      if (c) { g.set(c[0], c[1], 'Đ'); m.signs[c[0] + ',' + c[1]] = () => DW.say(DW.state.flags.meramon
        ? "Une longue-vue. À l'ouest, le Mont Miharashi fume toujours... mais plus aucune silhouette de flammes ne s'agite là-haut : Meramon est redescendu de sa montagne."
        : "Une longue-vue. À l'ouest, le Mont Miharashi fume... Une silhouette de flammes s'agite tout là-haut."); }
    }
    const e = exitCenter(m, 'right'), sx = e[0] - 4, sy = Math.round(e[1]) - 3;
    if (WALK(g.get(sx, sy))) { g.set(sx, sy, 'S'); m.signs[sx + ',' + sy] = '← Mont Miharashi · → Village des Yokomon'; }
  }

  // ------------------------------------------------------------ MONT MIHARASHI (sous-zone 4)
  // un massif en 4 étages : jungle au pied, trois terrasses aux hautes parois, le plateau du sommet et son grand cratère.
  // Un seul escalier par terrasse, toujours à l'autre bout de celle-ci : la montée est longue et se mérite.
  function mont(g, m) {
    const id = 'miharashi4', W = g.w;
    m.textures = 'volcan';   // (images dessinées d'assets/volcan quand elles existent : gfx/textures.js)
    m.objMap = { tree: 'pine' };   // (des pins sur le volcan, pas les arbres de saison : cerisiers en fleur...)
    m.solsNiveau = SOLS_MONT;
    const foot = (x, y) => Math.hypot((x - 48) / 50, (y - 40) / 36) < 1;
    const ex10 = exitCells(m, 10);
    const prot = base(g, m, id, (x, y, X, Y) => (foot(x, y) || ex10.has(x + ',' + y) ? (N(X, Y, 961, 0.12) > 0.68 ? ',' : '.') : Hh(X, Y, 964) < 0.75 ? '#' : 'T'));
    const [cx, cy] = MONT.meramon;
    // LE CRATÈRE : un lac de lave creusé dans le plateau du sommet, bordé de cendres (Meramon se tient juste devant)
    // (la bouche peinte, gfx/premium.js « bouche », couvre 21 × 9 cases ; la lave remplit les cases dont le centre est dans le trou)
    const BX = 38, BY = 21, BOUCHE = DW.World.OBJ.bouche, dansLac = (x, y) => BOUCHE.dedans((x - BX) * 16 + 8, (y - BY) * 16 + 9);
    let crater = null;
    const R = DW.Relief.build(g, m, { id, keep: (x, y) => prot.has(x + ',' + y), corridor: (x, y) => ex10.has(x + ',' + y), levelAt: (x, y) => levelOf(id, x, y),
      foot: [W - 4, Math.round(m.exits.right[0] + 2)],   // (on arrive de la route, à l'est)
      wall: 4,   // (une vraie montagne : des falaises de 4 cases par niveau)
      firstStair: a => -Math.abs(a[0] + 1 - cx),   // l'escalier du sommet est au bout du plateau, loin de Meramon
      surface: (x, y, L) => {
        if (L === 0) return g.get(x, y);
        const away = Math.hypot(x - cx, y - cy + 3) > 8;
        if (L === 5) return away && Hh(x, y, 965) < 0.07 ? 'ë' : away && Hh(x, y, 966) < 0.045 ? 'ì' : 'ţ';   // cendres du volcan, roches de lave, fumerolles
        if (L === 4) { const n4 = N(x, y, 977, 0.14); return n4 > 0.62 ? 'ţ' : Hh(x, y, 978) < 0.02 ? 'ë' : 'ǥ'; }   // rocaille et coulées de cendres
        // le sol change avec l'altitude : prairie (1), herbe et terre (2), terre et rocaille (3)
        const n = N(x, y, 973 + L, 0.13);
        if (L === 1) return Hh(x, y, 970 + L) < 0.02 ? 'T' : n > 0.72 ? ',' : n < 0.3 ? 'j' : '.';
        if (L === 2) return n > 0.62 ? 'ǥ' : n < 0.25 ? 'j' : '.';
        return n > 0.28 ? 'ǥ' : '.';   // (haut de la montagne : rocaille, quelques plaques d'herbe ; les sentiers en terre battue ressortent)
      } });
    // devant le cratère : un replat dégagé où se dresse Meramon
    { let x0 = 99, y0 = 99, x1 = 0, y1 = 0;
      for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < W - 2; x++) {
        if (x < BX || y < BY || x >= BX + 21 || y >= BY + 9 || !dansLac(x, y) || m.alt[y * W + x] !== 5 || g.get(x, y) === ROCK) continue;
        g.set(x, y, 'ȴ'); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      if (x1 >= x0) { crater = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, lac: true }; m.bouche = { x: BX, y: BY, w: 21, h: 9 }; }   // (peinte par game/lave.js : la lave y monte et redescend)
      // bord du cratère : cendres, et quelques roches de lave figée (jamais devant Meramon)
      for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < W - 2; x++) {
        if (g.get(x, y) === 'ȴ' || m.alt[y * W + x] !== 5) continue;
        let bord = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (g.get(x + dx, y + dy) === 'ȴ') bord = true;
        if (!bord) continue;
        g.set(x, y, Hh(x, y, 1292) < 0.07 && Math.hypot(x - cx, (y - cy) * 1.4) > 5 ? 'ë' : 'ţ');
      }
    }
    if (crater) for (let y = crater.y + crater.h; y <= cy + 2; y++) for (let x = cx - 4; x <= cx + 4; x++) if (m.alt[y * W + x] === 5 && g.get(x, y) !== ROCK && g.get(x, y) !== 'ȴ') g.set(x, y, 'ţ');
    for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < W - 2; x++) {
      const c = g.get(x, y); if (c !== 'ë' && c !== 'ì') continue;
      if ([[-1, 0], [-1, -1], [0, -1], [1, -1]].some(([dx, dy]) => g.get(x + dx, y + dy) === 'ë' || g.get(x + dx, y + dy) === 'ì')) g.set(x, y, m.alt[y * W + x] >= 4 ? 'ţ' : 'ǥ');
    }
    // cocotiers penchés au bord de la plage, au pied du mont (côté est, l'arrivée)
    for (let y = 4; y < g.h - 4; y++) for (let x = 4; x < W - 4; x++) {
      if (m.alt[y * W + x] !== 0 || g.get(x, y) !== '.' || Hh(x, y, 1281) > 0.06) continue;
      let sable = false; for (let dy = -3; dy <= 3 && !sable; dy++) for (let dx = -3; dx <= 3; dx++) if (g.get(x + dx, y + dy) === 's') { sable = true; break; }
      let arbre = false; for (let dy = -3; dy <= 4 && !arbre; dy++) for (let dx = -3; dx <= 3; dx++) { const I = DW.World.CH[g.get(x + dx, y + dy)]; if (I && (I.obj === 'tree' || I.t === 'canopy')) { arbre = true; break; } }
      if (sable && !arbre && !m.objects.some(o => Math.abs(o.x - x) < 4 && Math.abs(o.y - y) < 4)) m.objects.push({ kind: 'cocotier', v: Hh(x, y, 1282) < 0.5 ? 0 : 1, x, y, w: 1, h: 1, flip: Hh(x, y, 1283) < 0.5 });
    }
    grotte(g, m);
    decorEtages(g, m, 1, (x, y) => Math.hypot(x - cx, (y - cy) * 1.4) < 6, ETAGES_MONT);   // (jamais devant Meramon)
    dangers(g, m, cx, cy, crater);
    // ESPACEMENT : rochers magmatiques et fumerolles à 2 cases au moins les uns des autres, et jamais collés à un objet
    const pres = (x, y, r) => m.objects.some(o => x >= o.x - r && x < o.x + (o.w || 1) + r && y >= o.y - r && y < o.y + (o.h || 1) + r);
    const gardes = [];
    for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < W - 2; x++) {
      const c = g.get(x, y); if (c !== 'ë' && c !== 'ì') continue;
      if (gardes.some(([a, b]) => Math.abs(a - x) <= 2 && Math.abs(b - y) <= 2) || pres(x, y, 1)) g.set(x, y, m.alt[y * W + x] >= 4 ? 'ţ' : 'ǥ'); else gardes.push([x, y]);
    }
    // PLANTES DE FEU (images dessinées, gfx/textures.js) : sur les terrasses, loin des sentiers, des escaliers, des bords,
    // des rochers et des autres objets
    const OBJ = DW.World.OBJ, CH = m.chemins || new Set();
    if (OBJ.tex_volcan_plante_feu_1) for (let y = 3; y < g.h - 3; y++) for (let x = 3; x < W - 3; x++) {
      const L = m.alt[y * W + x], c = g.get(x, y);
      if (L < 2 || L === DW.Relief.PASS || (c !== 'ǥ' && c !== 'ţ') || CH.has(y * W + x) || Hh(x, y, 1401) > 0.05 || Math.hypot(x - cx, (y - cy) * 1.4) < 6) continue;
      let ok = true;
      for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) { const c2 = g.get(x + dx, y + dy), a2 = m.alt[(y + dy) * W + x + dx]; if (c2 === ROCK || c2 === '^' || c2 === 'ë' || c2 === 'ì' || c2 === 'ȴ' || (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && a2 !== L)) { ok = false; break; } }
      if (!ok || pres(x, y, 2)) continue;
      const n = 1 + Math.floor(Hh(x, y, 1402) * 3);
      if (OBJ['tex_volcan_plante_feu_' + n]) m.objects.push({ kind: 'tex_volcan_plante_feu_' + n, v: 0, x, y, w: 1, h: 1, walk: true });
    }
    return R;
  }

  // L'ENTRÉE DES SOUTERRAINS (image « mont_grotte ») : une grotte au pied d'une haute paroi du premier étage, la plus
  // proche de l'arrivée (à l'est), loin des escaliers et des sentiers ; on lit ce qu'on y trouve en lui parlant
  function grotte(g, m) {
    if (!DW.World.OBJ.tex_commun_mont_grotte) return;
    const W = g.w, H = g.h, A = m.alt, CH = m.chemins || new Set(), ax = W - 4, ay = Math.round(m.exits.right[0] + 2);
    let best = null, bd = 1e9;
    for (let y = 6; y < H - 6; y++) for (let x = 6; x < W - 7; x++) {
      if (A[y * W + x] !== 1 || A[y * W + x + 1] !== 1) continue;
      if (![g.get(x, y), g.get(x + 1, y), g.get(x, y + 1), g.get(x + 1, y + 1)].every(WALK) || CH.has(y * W + x) || CH.has(y * W + x + 1)) continue;
      let paroi = true;   // (une vraie paroi au-dessus : 3 cases de roche, un peu plus large que la grotte)
      for (let k = 1; k <= 3 && paroi; k++) for (const xx of [x - 1, x, x + 1, x + 2]) if (g.get(xx, y - k) !== ROCK) { paroi = false; break; }
      if (!paroi) continue;
      let pris = false;
      for (let dy = -5; dy <= 5 && !pris; dy++) for (let dx = -5; dx <= 6; dx++) if (g.get(x + dx, y + dy) === '^') { pris = true; break; }
      if (pris || m.objects.some(o => Math.abs(o.x - x) < 4 && Math.abs(o.y - y) < 4)) continue;
      const dd = Math.hypot(x - ax, y - ay); if (dd < bd) { bd = dd; best = [x, y]; }
    }
    if (!best) return;
    const [x, y] = best;
    // (les arbres devant l'entrée sont abattus : on doit la voir de loin)
    for (let yy = y - 1; yy <= y + 4; yy++) for (let xx = x - 3; xx <= x + 4; xx++) { const I = DW.World.CH[g.get(xx, yy)]; if (I && (I.obj === 'tree' || I.t === 'canopy') && A[yy * W + xx] === 1) g.set(xx, yy, '.'); }
    m.objects.push({ kind: 'tex_commun_mont_grotte', x, y, w: 2, h: 1 });
    m.signs = m.signs || {};
    const msg = "Une grotte s'ouvre au pied de la paroi... Un souffle chaud et humide monte des profondeurs : ce sont les souterrains de l'île. Il fait bien trop noir pour s'y aventurer, pour l'instant.";
    m.signs[x + ',' + y] = msg; m.signs[(x + 1) + ',' + y] = msg;
    m.grotte = [x, y];
  }

  DW.Mih = { desert, village, route, mont, MONT, offsets, shore, levelOf, roads, ZONE };
})();
;

// ===== js/maps/regions.js
'use strict';
// =====================================================================
//  RÉGIONS DE L'ÎLE DES FICHIERS — 16 régions de 10 sous-zones
//  (inspirées de Digimon World 1 et de la saison 1 de Digimon Adventure)
//
//  Chaque région suit un plan de 10 cases (avec des boucles), orienté selon son entrée :
//      0 — 1 — 2 — 3
//      |   |   |   |
//      7 — 6 — 5 — 4        (liaisons : chaîne 0→9 + raccourcis 1-6, 2-5, 6-9)
//      |   |
//      8 — 9
//  Chaque sous-zone a un gabarit (sentier, lac, rivière, pont, labyrinthe, place, îlots,
//  bosquet, grotte, lieu emblématique) et ses repères ; les cartes sont générées à la demande.
//  Les passages sont créés dans les deux sens, alignés sur les sorties de chaque carte.
// =====================================================================
(function () {
  const { forestGen } = DW.MapKit;
  const MAPS = DW.MAPS, Hh = DW.Art.hash;
  const OPP = DW.OPP;
  // échelle des régions (façon Digimon World) : zones ~2 fois plus grandes en surface, passages 2 fois plus larges
  const K = 1.45;
  const PLAN = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2]];
  const PLINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [1, 6], [2, 5], [6, 9]];

  function edit(rows, fn) {
    const g = rows.map(r => [...r]);
    const api = {
      get: (x, y) => g[y] && g[y][x], set: (x, y, ch) => { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = ch; },
      rect: (x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) api.set(i, j, ch); },
      w: g[0].length, h: g.length,
    };
    fn(api, g);
    return g.map(r => r.join(''));
  }

  // ------------------------------------------------------------ gabarits de sous-zone
  function kindOpts(kind, w, h, hub, s) {
    const r = k => Hh(s, k, 77);
    const spot = (k, m = 6) => [m + Math.floor(r(k) * (w - 2 * m)), m + Math.floor(r(k + 50) * (h - 2 * m))];
    const blobs = (n, k0, rx0, rx1) => Array.from({ length: n }, (_, i) => { const [x, y] = spot(k0 + i); return { x, y, rx: rx0 + r(k0 + i + 20) * (rx1 - rx0), ry: (rx0 + r(k0 + i + 30) * (rx1 - rx0)) * 0.72 }; });
    switch (kind) {
      case 'plaza': case 'set': return { hubR: Math.round(Math.min(w, h) * (kind === 'set' ? 0.2 : 0.28)), autoTall: 0.68, deco: 0.7, clearings: blobs(1, 1, 3, 4) };
      case 'lake': { const L = r(3) < 0.5 ? 0.27 : 0.73, T = r(4) < 0.5 ? 0.3 : 0.7; return { hubR: 4, lakes: [{ x: w * L, y: h * T, rx: w * 0.18, ry: h * 0.17 }], autoTall: 0.6, deco: 0.9, clearings: blobs(1, 5, 3, 4) }; }
      case 'bigLake': return { hubR: 3, lakes: [{ x: w * 0.5 + (r(3) - 0.5) * 6, y: h * 0.5 + (r(4) - 0.5) * 4, rx: w * 0.27, ry: h * 0.26 }], autoTall: 0.62, deco: 0.9 };
      case 'river': return { hubR: 4, rivers: [{ pts: [[-1, h * (0.15 + r(2) * 0.2)], [w * 0.38, h * 0.45], [w * 0.62, h * 0.55], [w + 1, h * (0.65 + r(3) * 0.2)]], r: 1.5 }], autoTall: 0.6, deco: 1, clearings: blobs(2, 7, 2.6, 3.6) };
      case 'bridge': return { hubR: 3, rivers: [{ pts: [[w * 0.5 + (r(2) - 0.5) * 6, -1], [w * 0.45, h * 0.5], [w * 0.55 + (r(3) - 0.5) * 6, h + 1]], r: 2.8 }], autoTall: 0.62, deco: 0.9 };
      case 'maze': return { hubR: 3, wiggle: 14, autoTall: 0.48, deco: 1.3, clearings: blobs(4, 9, 2.2, 3.4) };
      case 'islands': return { hubR: 3, lakes: blobs(6, 13, 2, 3.6), autoTall: 0.6, deco: 1 };
      case 'grove': return { hubR: 4, autoTall: 0.55, deco: 1.4, lmMul: 2, clearings: blobs(2, 21, 3, 4.2) };
      case 'cave': return { hubR: 5, wiggle: 12, deco: 0.9, autoTall: 0.75, clearings: blobs(3, 25, 3, 4.6), lmMul: 1.5 };
      default: return { hubR: 4, autoTall: 0.6, deco: 1, clearings: blobs(2, 31, 3, 4) }; // trail
    }
  }

  // ponts DROITS : un chemin qui traverse l'eau en biais laissait un pont en escalier ; chaque pont devient une bande
  // de 3 cases dans le sens de la traversée, prolongée jusqu'à la terre ferme de chaque côté
  function straightBridges(rows) {
    const g = rows.map(r => [...r]), h = g.length, w = g[0].length, seen = new Uint8Array(w * h);
    const wet = c => c === '~' || c === 'w' || c === '_';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (g[y][x] !== '_' || seen[y * w + x]) continue;
      const comp = [], st = [[x, y]]; seen[y * w + x] = 1;
      while (st.length) { const [cx, cy] = st.pop(); comp.push([cx, cy]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && !seen[ny * w + nx] && g[ny][nx] === '_') { seen[ny * w + nx] = 1; st.push([nx, ny]); } } }
      if (comp.length < 4) continue;
      let mx = 1e9, Mx = -1, my = 1e9, My = -1, sx = 0, sy = 0;
      for (const [cx, cy] of comp) { mx = Math.min(mx, cx); Mx = Math.max(Mx, cx); my = Math.min(my, cy); My = Math.max(My, cy); sx += cx; sy += cy; }
      const hz = Mx - mx >= My - my, c0 = Math.round(hz ? sy / comp.length : sx / comp.length);
      for (const [cx, cy] of comp) g[cy][cx] = '~';
      const set = (a, b) => { const [cx, cy] = hz ? [a, b] : [b, a]; if (cx >= 0 && cy >= 0 && cx < w && cy < h && wet(g[cy][cx])) g[cy][cx] = '_'; };
      const isWet = (a, b) => { const [cx, cy] = hz ? [a, b] : [b, a]; return cx >= 0 && cy >= 0 && cx < w && cy < h && wet(g[cy][cx]); };
      const a0 = hz ? mx : my, a1 = hz ? Mx : My;
      let s0 = a0, s1 = a1;
      while (s0 > 0 && s0 > a0 - 8 && isWet(s0 - 1, c0)) s0--;   // jusqu'à la rive
      while (s1 < (hz ? w : h) - 1 && s1 < a1 + 8 && isWet(s1 + 1, c0)) s1++;
      // (un chemin qui LONGE l'eau sur une grande distance n'est pas un pont : c'est une digue de terre et de sable)
      const dike = s1 - s0 > 11;
      for (let a = s0; a <= s1; a++) for (const d of [-1, 0, 1]) { set(a, c0 + d); if (dike) { const [cx, cy] = hz ? [a, c0 + d] : [c0 + d, a]; if (g[cy] && g[cy][cx] === '_') g[cy][cx] = d ? 's' : '='; } }
    }
    return g.map(r => r.join(''));
  }

  // ------------------------------------------------------------ génération des lignes d'une sous-zone
  function genRows(m) {
    const o = m.spec, { w, h } = m, ex = m.exits, hub = o.hub, seed = o.seed;
    const paths = [], free = [];
    const mid = (a, b, k) => [(a[0] + b[0]) / 2 + (Hh(a[0], b[1], seed) - 0.5) * k, (a[1] + b[1]) / 2 + (Hh(b[0], a[1], seed + 1) - 0.5) * k];
    for (const side in ex) {
      const [pos, len] = ex[side], c = pos + (len - 1) / 2;
      const out = { left: [-1, c], right: [w, c], up: [c, -1], down: [c, h] }[side];
      const inn = { left: [3, c], right: [w - 4, c], up: [c, 3], down: [c, h - 4] }[side];
      paths.push({ pts: [out, inn, mid(inn, hub, o.wiggle != null ? o.wiggle : 8), hub], r: len / 2 + 0.3 });
      free.push([inn[0], inn[1], 2]);
    }
    // espaces ouverts (voir addRooms) : un chemin depuis le carrefour jusqu'au bord de chacun
    for (const R of o.rooms || []) { paths.push({ pts: [hub, mid(hub, R.door, 6 * K), R.door], r: 2.6 }); free.push([R.x, R.y, Math.min(R.rx, R.ry) * 0.6]); }   // centre dégagé (pas de rochers)
    const lm = (o.lm || []).map(([ch, n]) => [ch, Math.round(n * (o.lmMul || 1))]);
    let rows = forestGen({ w, h, seed, paths, free, clearings: [{ x: hub[0], y: hub[1], rx: o.hubR, ry: o.hubR * 0.75 }, ...(o.clearings || [])],
      lakes: o.lakes, rivers: o.rivers, autoTall: o.autoTall, deco: o.deco, landmarks: lm, bigtrees: o.bigtrees, tall: o.tall });
    rows = straightBridges(rows);
    // bord de l'île : la mer, une plage ou une falaise sur les côtés sans passage (on garde la pièce maîtresse et ses abords)
    if (m.coast) {
      const P = m.piece, keep = P ? (x, y) => x >= P.x - 3 && x < P.x + P.w + 3 && y >= P.y - 1 && y < P.y + P.h + 4 : null;
      for (const s in m.coast) if (ex[s]) throw new Error(`${m.name} : côte ${s} sur un passage`);
      rows = DW.MapKit.coast(rows, m.coast, { seed, keep });
    }
    // (la profondeur de mer le long de chaque bord est celle de la côte de la voisine À LA FRONTIÈRE : même formule que
    //  MapKit.coast, même graine ; le long du bord partagé avec la voisine de rangée : A cases, avec celle de colonne : B cases)
    const coastDepth = (nb, cs, end) => {
      const Nb = MAPS[nb], ns = Nb.spec.seed, along = cs === 'up' || cs === 'down' ? Nb.w : Nb.h, F = (t, k) => DW.Art.fbm(t, k, ns * 7 + 3);
      const sea = Math.max(8, Math.round(Math.min(Nb.w, Nb.h) * 0.15)), t = end ? along - 1 : 0;
      return Math.max(0, sea + (F(t * 0.03, cs.length) - 0.5) * 26 + (F(t * 0.11, 9 + cs.length) - 0.5) * 8);
    };
    for (const c of m.coastCorners || []) rows = edit(rows, g => {
      const { hs, vs } = c;
      const A = c.row ? coastDepth(c.row, vs, hs === 'left') : 2;   // eau le long du bord gauche/droit (vers le large : hauteur)
      const B = c.col ? coastDepth(c.col, hs, vs === 'up') : 2;     // eau le long du bord haut/bas (vers le large : largeur)
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = hs === 'left' ? x : w - 1 - x, dy = vs === 'up' ? y : h - 1 - y;
        const e = (dx / (B + 0.01)) ** 2 + (dy / (A + 0.01)) ** 2 + (DW.Art.fbm(x * 0.2, y * 0.2, seed + 7) - 0.5) * 0.15;
        const onExit = Object.entries(ex).some(([sd, [p, l]]) => (sd === 'left' || sd === 'right' ? y >= p - 2 && y < p + l + 2 && (sd === 'left' ? x < 8 : x > w - 9) : x >= p - 2 && x < p + l + 2 && (sd === 'up' ? y < 8 : y > h - 9)));
        if (onExit) continue;
        if (e < 1) g.set(x, y, '~'); else if (e < 1.35 && g.get(x, y) !== '~') g.set(x, y, Hh(x, y, 783) < 0.1 ? 'R' : 's');
      }
    });
    // emprise des objets posés (bloquants)
    const occ = new Set();
    for (const ob of m.objects) if (!ob.walk && !ob.top) for (let y = ob.y; y < ob.y + ob.h; y++) for (let x = ob.x; x < ob.x + ob.w; x++) occ.add(x + ',' + y);
    rows = edit(rows, g => {
      const P = m.piece;
      if (P) {
        g.rect(P.x - 1, Math.max(1, P.y - 1), P.w + 2, P.h + 3, '.');
        g.rect(P.fx, P.y + P.h, P.dw || 1, 2, '=');
      }
      for (const ob of m.objects) if (ob !== m.objects[0] || !P) g.rect(ob.x, ob.y, ob.w, ob.h, '.');
      for (const side in ex) {
        const [pos, len] = ex[side];
        for (let k = 0; k < len; k++) for (let d = 0; d < 3; d++) {
          const [x, y] = { left: [d, pos + k], right: [w - 1 - d, pos + k], up: [pos + k, d], down: [pos + k, h - 1 - d] }[side];
          if (g.get(x, y) !== '_') g.set(x, y, '=');
        }
      }
      // langue de sable au lieu d'un pont : on élargit le passage sur l'eau
      if (m.sandWalk) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.get(x, y) === '_') {
        for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) { const c = g.get(x + dx, y + dy); if (c === '~' || c === 'w' || c === '_') g.set(x + dx, y + dy, Hh(x + dx, y + dy, 641) < 0.12 ? ';' : 's'); }
      }
      if (o.post) o.post(g, m);
      // activité de la sous-zone (tournoi, curling, trésor, pêche) : un panneau près du carrefour
      if (m.activity) { const ax = hub[0] + 2, ay = hub[1] - 1; g.set(ax, ay, 'S'); m.signs[ax + ',' + ay] = m.activity.run; }
      // toilettes (cabane 3 × 2) près du carrefour, dans quelques sous-zones de chaque région
      if (m.hamlet) placeHamlet(g, m, hub, occ);   // un petit village par région
      if (m.idx % 4 === 0 || m.hamlet) placeToilet(g, m, hub, occ);
      // (après les toilettes : leur place ne bouge pas, les retouches de l'atelier les retrouvent)
      // mobilier propre à un village (images du joueur : option mobilier = [[nom, x, y, w, h]], posé seulement sur une case libre)
      for (const [n, x0, y0, ow, oh] of o.mobilier || []) {
        let libre = true;
        for (let yy = y0; yy < y0 + oh; yy++) for (let xx = x0; xx < x0 + ow; xx++) if (occ.has(xx + ',' + yy) || DW.SOLID.has(g.get(xx, yy) || '#') || g.get(xx, yy) === '=') libre = false;
        if (!libre) continue;
        m.objects.push({ kind: n, v: 0, x: x0, y: y0, w: ow, h: oh });
        for (let yy = y0; yy < y0 + oh; yy++) for (let xx = x0; xx < x0 + ow; xx++) occ.add(xx + ',' + yy);
      }
      // liaison garantie : chaque sortie (et la porte) rejoint le carrefour, quitte à tracer un chemin / un pont
      const walk = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !DW.SOLID.has(g.get(x, y)) && !occ.has(x + ',' + y);
      const reach = () => {
        const seen = new Set([hub[0] + ',' + hub[1]]), q = [hub];
        while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (!seen.has(k) && walk(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); } } }
        return seen;
      };
      const carveCell = (x, y) => { if (occ.has(x + ',' + y)) return; const c = g.get(x, y); if (c === '~' || c === 'w') g.set(x, y, '_'); else if (DW.SOLID.has(c)) g.set(x, y, '='); };
      if (!walk(hub[0], hub[1])) g.set(hub[0], hub[1], '=');
      const targets = Object.keys(ex).map(side => { const [pos, len] = ex[side], c = pos + (len >> 1); return { left: [2, c], right: [w - 3, c], up: [c, 2], down: [c, h - 3] }[side]; });
      if (P) targets.push([P.fx, P.y + P.h]);
      for (const t of targets) {
        if (reach().has(t[0] + ',' + t[1])) continue;
        let [x, y] = t;
        // d'abord vers la ligne du carrefour, puis vers sa colonne (contourne les grands décors posés en haut)
        while (y !== hub[1]) { carveCell(x, y); y += Math.sign(hub[1] - y); }
        while (x !== hub[0]) { carveCell(x, y); x += Math.sign(hub[0] - x); }
      }
    });
    return rows;
  }

  // ------------------------------------------------------------ construction d'une région
  // R : { name, theme, entry, lm, music, climate, ambient, dark, out:[[i, côté]], subs:[[nom, gabarit, options]] }
  //     plan / links : plan propre (cases [x, y] déjà orientées, liaisons) au lieu du plan commun ;
  //     lake : { cx, cy, r } grand lac partagé par plusieurs cartes, en coordonnées du plan (1 = une carte)
  // options : { w, h, theme, lm, noRegionLm, piece:{kind, w, h, v, door:{to, tx, ty, dw}}, pieceSign, objects, post, dark, indoor, plazas, mosaic, hazard, music, opts }
  const ENTRY = {}, LINKS = [];
  function region(rid, R) {
    const flipX = R.entry === 'right', flipY = R.entry === 'down';
    const pos = R.plan || PLAN.map(([x, y]) => [flipX ? 3 - x : x, flipY ? 2 - y : y]);
    const ids = R.subs.map((_, i) => rid + i);
    const sides = ids.map(() => ({}));
    const sideOf = (a, b) => { const dx = pos[b][0] - pos[a][0], dy = pos[b][1] - pos[a][1]; return dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; };
    for (const [a, b] of R.links || PLINKS) { const s = sideOf(a, b); sides[a][s] = ids[b]; sides[b][OPP[s]] = ids[a]; LINKS.push([ids[a], s, ids[b]]); }
    const ext = [[0, R.entry], ...(R.out || [])];
    for (const [i, s] of ext) { if (sides[i][s]) throw new Error(`région ${rid} : sortie ${s} déjà prise sur ${ids[i]}`); sides[i][s] = 'ext'; }
    ENTRY[rid] = ids[0];
    const rs = rid.length * 13 + rid.charCodeAt(0);
    // COINS DE CÔTE : si une voisine (même rangée) a la mer au nord ou au sud et pas cette carte (qui s'ouvre de ce côté
    // vers une autre carte), la côte tourne dans le coin commun ; idem pour une voisine de colonne avec la mer à l'est/ouest
    const coastOf = i => (R.subs[i][2] || {}).coast || {};
    const corners = ids.map((_, i) => {
      const out = {};
      const add = (hs, vs) => (out[hs + vs] = out[hs + vs] || { hs, vs, row: null, col: null });
      for (const hs of ['left', 'right']) { const nb = sides[i][hs]; if (!nb || nb === 'ext') continue; const j = ids.indexOf(nb);
        for (const vs of ['up', 'down']) if (coastOf(j)[vs] && !coastOf(i)[vs]) add(hs, vs).row = nb; }
      for (const vs of ['up', 'down']) { const nb = sides[i][vs]; if (!nb || nb === 'ext') continue; const j = ids.indexOf(nb);
        for (const hs of ['left', 'right']) if (coastOf(j)[hs] && !coastOf(i)[hs]) add(hs, vs).col = nb; }
      // (un coin dont une seule voisine a la mer : on regarde aussi l'autre voisine du coin, pour la largeur d'eau sur l'autre bord)
      for (const c of Object.values(out)) {
        if (!c.col) { const nb = sides[i][c.vs]; if (nb && nb !== 'ext' && coastOf(ids.indexOf(nb))[c.hs]) c.col = nb; }
        if (!c.row) { const nb = sides[i][c.hs]; if (nb && nb !== 'ext' && coastOf(ids.indexOf(nb))[c.vs]) c.row = nb; }
      }
      return Object.values(out);
    });
    // (régions du puzzle du monde : toutes les cartes ont la taille d'une pièce, maps/puzzle.js)
    const dimW = i => (R.taille ? R.taille[0] : (R.subs[i][2] || {}).w || 88 + Math.floor(Hh(pos[i][0], 1, rs + 700) * 3) * 6);
    const dimH = i => (R.taille ? R.taille[1] : (R.subs[i][2] || {}).h || 64 + Math.floor(Hh(pos[i][1], 2, rs + 700) * 3) * 4);
    R.subs.forEach(([name, kind, x = {}], i) => {
      // portail d'un donjon secret des écussons (maps/donjons.js)
      const dj = DW.Donjons && DW.Donjons.pieceFor(rid, i);
      if (dj && !x.piece) x = { ...x, ...dj };
      const id = ids[i], s = Hh(i, rid.length * 13 + rid.charCodeAt(0), 501) * 1000 | 0;
      // cartes larges (comme Digimon World) : de la place pour explorer et contourner les Digimon sauvages
      // GRILLE DE LA RÉGION : toutes les cartes d'une même colonne ont la même largeur, celles d'une même rangée la
      // même hauteur, et le passage entre deux voisines est calculé UNE fois pour les deux : la région forme un
      // quadrillage exact (les boucles de cartes se referment, rien ne se chevauche ; voir dev/assemblage.js)
      const w = dimW(i), h = dimH(i);   // (x.w / x.h : grande carte)
      const exits = {};
      for (const side in sides[i]) {
        const span = side === 'left' || side === 'right' ? h : w;
        if (sides[i][side] === 'ext') { const off = Math.round((Hh(i, side.length, s) - 0.5) * (span > 32 ? 8 : 6)); exits[side] = [Math.floor(span / 2) - 3 + off, 6]; continue; }
        const j = ids.indexOf(sides[i][side]), hz = side === 'left' || side === 'right';
        const c0 = Math.min(pos[i][0], pos[j][0]), r0 = Math.min(pos[i][1], pos[j][1]), shared = hz ? Math.min(h, dimH(j)) : Math.min(w, dimW(j));
        const off = Math.round((Hh(c0 * 7 + r0, hz ? 1 : 2, rs + 701) - 0.5) * 8);
        exits[side] = [Math.floor(shared / 2) - 3 + off, 6];   // passages de 6 cases, alignés des deux côtés
      }
      const hub = [Math.floor(w / 2) + Math.round((Hh(i, 3, s) - 0.5) * 8), Math.floor(h / 2) + Math.round((Hh(i, 4, s) - 0.5) * 5)];
      const theme = x.theme || R.theme, k = kindOpts(kind, w, h, hub, s + i);
      // gabarits pensés pour des cartes plus petites : carrefour, clairières, îlots, rivières et méandres agrandis
      k.hubR = Math.round(k.hubR * K); if (k.wiggle != null) k.wiggle *= K;
      for (const c of k.clearings || []) { c.rx *= K; c.ry *= K; }
      if (kind === 'islands') for (const l of k.lakes || []) { l.rx *= K; l.ry *= K; }
      for (const rv of k.rivers || []) rv.r *= 1.6;
      const cave = kind === 'cave';
      const spec = Object.assign({ seed: s + 13, hub, lm: [...(x.lm || []), ...(x.noRegionLm ? [] : R.lm || [])] }, k, x.opts || {}, { post: x.post, mobilier: x.mobilier });
      const m = MAPS[id] = { idx: i,
        name, regionName: R.name, music: x.music || DW.REGION_MUSIC[rid] || R.music || 'field', bg: 'foret', ambient: R.ambient || 'forest', theme, climate: R.climate || 'forest', region: rid, mer: !!R.mer,   // (mer : l'eau qui touche le bord de la carte est salée, game/paysage.js)
       
        w, h, rate: 0, encounters: [], npcs: [], warps: [], exits, objects: [...(x.objects || [])], signs: { ...(x.signs || {}) }, doors: [],
        ...(x.textures ? { textures: x.textures } : {}),   // (dossier d'images de la carte : gfx/textures.js)
        sandWalk: !!x.sandWalk, coastCorners: corners[i], indoor: cave || !!x.indoor, dark: x.dark || (cave ? { d: 0.45, col: '#3a3050' } : R.dark), plazas: x.plazas, mosaic: x.mosaic, hazard: x.hazard, coast: x.coast,
        spec, build() { if (!this.rows) this.rows = genRows(this); },
      };
      // pièce maîtresse (grand décor) en haut à gauche, avec son parvis relié au carrefour
      if (x.piece) {
        const P = m.piece = { ...x.piece, x: 3, y: 2 };
        P.dw = P.door ? P.door.dw || 1 : 1;
        P.fx = P.x + Math.floor(P.w / 2) - (P.dw === 2 ? 1 : 0);
        m.objects.unshift({ kind: P.kind, v: P.v || 0, x: P.x, y: P.y, w: P.w, h: P.h });
        // grande clairière autour de la pièce maîtresse
        spec.clearings = [...(spec.clearings || []), { x: P.x + P.w / 2, y: P.y + P.h / 2 + 1, rx: P.w / 2 + 4, ry: P.h / 2 + 3.5 }];
        if (P.door) { m.doors.push({ x: P.fx, y: P.y + P.h - 1, w: P.dw, dir: 'up', to: P.door.to, tx: MAPS[P.door.to].entry ? MAPS[P.door.to].entry.x : P.door.tx, ty: MAPS[P.door.to].entry ? MAPS[P.door.to].entry.y : P.door.ty }); MAPS[P.door.to].warps.forEach(wp => { if (wp.to === '?') { wp.to = id; wp.tx = P.fx; wp.ty = P.y + P.h; } }); }
        if (x.pieceSign) m.signs[`${P.fx + P.dw},${P.y + P.h + 1}`] = x.pieceSign;
      }
      addRooms(m, kind, s + i * 7);
      // grand lac partagé : chaque carte en reçoit sa part (l'eau du côté du centre), sans espaces ouverts sous l'eau
      if (R.lake) {
        const Lk = { x: (R.lake.cx - pos[i][0]) * w, y: (R.lake.cy - pos[i][1]) * h, rx: R.lake.r * w, ry: R.lake.r * h, bleed: true };   // (bleed : pas recopié chez les voisins, ils ont déjà le leur)
        const inLake = (x, y, k = 1.12) => Math.hypot((x - Lk.x) / Lk.rx, (y - Lk.y) / Lk.ry) < k;
        if (Math.hypot(Math.max(0, Math.abs(Lk.x - w / 2) - w / 2) / Lk.rx, Math.max(0, Math.abs(Lk.y - h / 2) - h / 2) / Lk.ry) < 1) {
          // le carrefour s'écarte de l'eau (vers l'extérieur de l'anneau) tant qu'il est dans le lac
          if (!x.sandWalk) for (let t = 0; t < 40 && inLake(spec.hub[0], spec.hub[1], 1.25); t++) { const dx = spec.hub[0] - Lk.x, dy = spec.hub[1] - Lk.y, d = Math.hypot(dx, dy) || 1; spec.hub = [Math.round(DW.clamp(spec.hub[0] + dx / d * 1.5, 8, w - 9)), Math.round(DW.clamp(spec.hub[1] + dy / d * 1.5, 7, h - 8))]; }
          spec.lakes = [...(spec.lakes || []), Lk];
          spec.rooms = (spec.rooms || []).filter(Rm => !inLake(Rm.x, Rm.y, 1.3));
          spec.clearings = (spec.clearings || []).filter(c => !inLake(c.x, c.y));
        }
      }
    });
    linkWater(ids, sides);
    // le village de la région : première sous-zone dégagée (place, sentier, bosquet)
    const hi = R.subs.findIndex(([, kind], i) => i >= 1 && i !== 7 && ['plaza', 'trail', 'grove'].includes(kind));
    MAPS[ids[hi >= 0 ? hi : 2]].hamlet = true;
  }

  // ------------------------------------------------------------ petits villages (un par région, sous-zone 2)
  // 3 maisons du style local, un marchand (bases + spécialité de la région), une auberge (repos), un promeneur
  const HAMLET = {
    montagne: ['Hameau des Gotsumon', 'gotsumon', 'chalet', ['steak', 'super_viande']],
    lac: ['Village des Gomamon', 'gomamon', 'cottage', ['digianchois', 'digivivaneau', 'digitruite']],
    brumes: ['Hameau des Brumes', 'patamon', 'cottage', ['pomme_bleue', 'baie_rouge']],
    marais: ['Village sur pilotis', 'gekomon', 'bogshack', ['digichampi', 'viande_moisie', 'champi_joie']],
    savane: ['Campement de la Savane', 'elecmon', 'cottage', ['steak', 'super_carotte']],
    volcan: ['Forge du Volcan', 'agumon', 'chalet', ['steak', 'disque_atk']],
    usine: ['Cité ouvrière', 'tentomon', 'cottage', ['disque_pm', 'pm_m', 'disque_def']],
    decharge: ['Village des Numemon', 'numemon', 'bogshack', ['viande_moisie', 'gland_or']],
    tunnel: ['Halte des Mineurs', 'gotsumon', 'chalet', ['digichampi', 'pm_m']],
    jouets: ['Village des Jouets', 'patamon', 'cottage', ['cartes', 'pomme_bleue']],
    canyon: ['Campement du Canyon', 'monochromon', 'chalet', ['steak', 'disque_def']],
    scarabees: ['Village des Scarabées', 'tentomon', 'cottage', ['super_carotte', 'radis']],
    dino: ['Village des Agumon', 'agumon', 'chalet', ['surlonge', 'steak']],
    jungle: ['Village de la Jungle', 'palmon', 'bogshack', ['orange_bana', 'noix_douce', 'figue']],
    gel: ['Hameau des Neiges', 'penguinmon', 'chalet', ['champi_glace', 'digitruite']],
    overdell: ['Hameau des Ombres', 'bakemon', 'cottage', ['reveil', 'viande_moisie']],
    miharashi: ['Village des Yokomon', 'yokomon', 'yokohut', ['digichampi', 'super_viande']],
  };
  function placeHamlet(g, m, hub, occ) {
    const H = HAMLET[m.region]; if (!H) return;
    const [title, folk, kind, special] = H, GROUND = '.,f=vs', ok = (x, y) => GROUND.includes(g.get(x, y) || '#') && !occ.has(x + ',' + y);
    const spots = [];
    for (let r = 5; r < 20 && spots.length < 3; r++) for (let dy = -r; dy <= r && spots.length < 3; dy++) for (let dx = -r; dx <= r && spots.length < 3; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = hub[0] + dx, y = hub[1] + dy;
      if (spots.some(([a, b]) => Math.abs(a - x) < 7 && Math.abs(b - y) < 6)) continue;
      let fit = true;
      for (let yy = y - 1; yy <= y + 4 && fit; yy++) for (let xx = x - 1; xx <= x + 4 && fit; xx++) if (!ok(xx, yy)) fit = false;
      if (fit) spots.push([x, y]);
    }
    if (!spots.length) return;
    const name = DW.SPECIES[folk].name;
    const shop = ['viande', 'soin_p', 'disque_pm', 'remede', 'bandage', 'super_viande', ...special].filter(id => DW.ITEMS[id]);
    spots.forEach(([x, y], i) => {
      for (let yy = y; yy < y + 3; yy++) for (let xx = x; xx < x + 4; xx++) { g.set(xx, yy, '.'); occ.add(xx + ',' + yy); }
      for (let xx = x; xx < x + 4; xx++) if (g.get(xx, y + 3) !== '=') g.set(xx, y + 3, '=');   // parvis
      m.objects.push({ kind, v: i % 2, x, y, w: 4, h: 3 });
      const nx = x + 1 + (i % 2), ny = y + 4;
      if (i === 0) m.npcs.push({ sp: folk, x: nx, y: ny, face: 'down', hamlet: true, talk: async () => {
        await DW.say(`Bienvenue au ${title} ! Un petit quelque chose pour la route ?`, name);
        await DW.Game.push(new DW.ShopScene(shop));
      } });
      else if (i === 1) m.npcs.push({ sp: folk, x: nx, y: ny, face: 'down', hamlet: true, talk: async () => {
        const st = DW.state;
        const r = await DW.ask(`L'auberge du ${title} ! Une bonne nuit de repos pour toute l'équipe : 100 Bits.`, ['Se reposer', 'Non merci'], name);
        if (r !== 0) return;
        if (st.bits < 100) { await DW.say("Tu n'as pas assez de Bits...", name); return; }
        st.bits -= 100; st.heal = { map: DW.ow.mapId, x: nx, y: ny + 1 };
        // (on ne dort qu'à l'heure du coucher du partenaire ; sinon une heure de repos, sans sauter une journée)
        const lead = DW.Care.lead();
        if (!lead || DW.Life.sleepy(lead)) { await DW.Life.sleep(false); st.party.forEach(p => p.heal()); await DW.say('Bonjour ! Ton équipe est en pleine forme.', name); }
        else { await DW.fade(1, 0.4); DW.Care.rest(60, true); st.party.forEach(p => { p.heal(); p.tired = Math.max(0, (p.tired || 0) - 30); }); await DW.wait(0.4); await DW.fade(0, 0.4); await DW.say(`${lead.name} n'a pas sommeil : une heure de repos dans un bon lit. Toute l'équipe est soignée !`, name); }
      } });
      else m.npcs.push({ sp: folk, x: nx, y: ny, face: 'left', wander: 2, hamlet: true, talk: () => DW.say(DW.pick([
        `Bienvenue au ${title} ! Ici, on vit tranquille... sauf quand les Digimon sauvages s'énervent.`,
        "On raconte que les habitants de la Ville des Fichiers ont toujours besoin d'aide. Va les voir !",
        "Les toilettes sont juste à côté. Pense à ton partenaire !",
      ]), name) });
    });
    const [sx, sy] = spots[0];
    if (GROUND.includes(g.get(sx - 2, sy + 3) || '#')) { g.set(sx - 2, sy + 3, 'S'); m.signs[`${sx - 2},${sy + 3}`] = `${title} — Marchand, auberge et toilettes. Les voyageurs sont les bienvenus !`; }
    m.hamletName = title;
  }

  // ------------------------------------------------------------ toilettes : une jolie cabane près du carrefour
  // emprise 3 × 2 libre (avec une case de marge et la case devant la porte libre), la plus proche du carrefour
  function placeToilet(g, m, hub, occ) {
    const npcAt = (x, y) => (m.npcs || []).some(n => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1);
    const GROUND = '.,f=vs', ok = (x, y) => GROUND.includes(g.get(x, y) || '#') && !occ.has(x + ',' + y) && !npcAt(x, y);
    let best = null;
    for (let r = 4; r < 16 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r && !best; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = hub[0] + dx, y = hub[1] + dy;
      let fit = true;
      for (let yy = y - 1; yy <= y + 3 && fit; yy++) for (let xx = x - 1; xx <= x + 3 && fit; xx++) if (!ok(xx, yy)) fit = false;
      if (fit && !(m.signs && Object.keys(m.signs).some(k => { const [sx, sy] = k.split(',').map(Number); return sx >= x - 1 && sx <= x + 3 && sy >= y - 1 && sy <= y + 3; }))) best = [x, y];
    }
    if (!best) return;
    const [x, y] = best;
    for (let yy = y; yy < y + 2; yy++) for (let xx = x; xx < x + 3; xx++) { g.set(xx, yy, '.'); occ.add(xx + ',' + yy); }
    m.objects.push({ kind: 'toilet', v: 0, x, y, w: 3, h: 2 });   // (ta cabane de toilettes : gfx/textures.js ; on s'en sert en lui parlant)
  }

  // ------------------------------------------------------------ continuité entre sous-zones voisines
  // un lac qui touche un bord se prolonge (coupé) dans la sous-zone d'à côté ; une rivière qui sort
  // par un bord y entre et va se jeter dans un petit étang. Les chemins qui la croisent deviennent des ponts.
  function linkWater(ids, sides) {
    const MARGIN = 6, add = (m, key, v) => { m.spec[key] = [...(m.spec[key] || []), v]; };
    ids.forEach((id, i) => {
      const A = MAPS[id];
      for (const side in sides[i]) {
        const nid = sides[i][side];
        if (!nid || nid === 'ext' || !MAPS[nid] || !MAPS[nid].spec) continue;
        const B = MAPS[nid];
        // même point, vu depuis B (position proportionnelle le long du bord commun)
        const to = (x, y) => side === 'right' ? [x - A.w, y * B.h / A.h] : side === 'left' ? [B.w + x, y * B.h / A.h]
          : side === 'down' ? [x * B.w / A.w, y - A.h] : [x * B.w / A.w, B.h + y];
        const inward = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }[side];
        for (const L of (A.spec.lakes || []).filter(l => !l.bleed)) {
          const gap = side === 'right' ? A.w - (L.x + L.rx) : side === 'left' ? L.x - L.rx : side === 'down' ? A.h - (L.y + L.ry) : L.y - L.ry;
          if (gap > MARGIN) continue;
          const [x, y] = to(L.x, L.y);
          add(B, 'lakes', { x, y, rx: L.rx, ry: L.ry, bleed: true });
        }
        for (const Rv of (A.spec.rivers || []).filter(r => !r.bleed)) {
          for (const p of [Rv.pts[0], Rv.pts[Rv.pts.length - 1]]) {
            const onEdge = side === 'right' ? p[0] >= A.w - 1 : side === 'left' ? p[0] <= 0 : side === 'down' ? p[1] >= A.h - 1 : p[1] <= 0;
            if (!onEdge) continue;
            const [x, y] = to(p[0], p[1]), j = (Hh(x | 0, y | 0, 917) - 0.5) * 10, perp = [inward[1], inward[0]];
            const e1 = [x + inward[0] * 10 + perp[0] * j * 0.5, y + inward[1] * 10 + perp[1] * j * 0.5];
            const e2 = [x + inward[0] * 18 + perp[0] * j, y + inward[1] * 18 + perp[1] * j];
            add(B, 'rivers', { pts: [[x - inward[0] * 2, y - inward[1] * 2], e1, e2], r: Rv.r, bleed: true });
            add(B, 'lakes', { x: e2[0], y: e2[1], rx: 4 + Rv.r, ry: 3 + Rv.r * 0.7, bleed: true });
          }
        }
      }
    });
  }

  // ------------------------------------------------------------ espaces ouverts (« zones exploitables »)
  // Comme dans Digimon World 1 / 2003 : en plus du carrefour, chaque sous-zone a 4 ou 5 grands espaces
  // reliés par un chemin, chacun avec son ambiance : étang (berges et nénuphars), prairie d'herbes hautes
  // (là où se cachent les Digimon sauvages) ou bosquet calme (fleurs, repères de la région).
  // Placés loin du carrefour, des sorties et de la pièce maîtresse, et espacés entre eux.
  function addRooms(m, kind, seed) {
    const o = m.spec, { w, h } = m, hub = o.hub, r = k => Hh(seed, k, 613);
    const avoid = [[hub[0], hub[1], 17]], lanes = [];
    for (const side in m.exits) {
      const [pos, len] = m.exits[side], c = pos + len / 2, inn = { left: [2, c], right: [w - 3, c], up: [c, 2], down: [c, h - 3] }[side];
      avoid.push([...inn, 10]); lanes.push([inn, hub]);
    }
    // distance d'une case au trajet sortie → carrefour (les espaces ne se posent pas dessus)
    const segD = (x, y, [a, b]) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
      let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
    };
    for (const L of o.lakes || []) avoid.push([L.x, L.y, Math.max(L.rx, L.ry) + 4]);
    const P = m.piece, inPiece = (x, y) => P && x < P.x + P.w + 7 && y < P.y + P.h + 6;
    const cand = [];
    for (let y = 10; y <= h - 11; y += 2) for (let x = 11; x <= w - 12; x += 2) {
      if (inPiece(x, y) || avoid.some(([ax, ay, d]) => Math.hypot(x - ax, y - ay) < d) || lanes.some(L => segD(x, y, L) < 11)) continue;
      cand.push([Hh(x, y, seed), x, y]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const n = 4 + (r(1) < 0.4 ? 1 : 0), rooms = [];
    for (const [, x, y] of cand) {
      if (rooms.length >= n) break;
      if (rooms.some(R => Math.hypot(R.x - x, R.y - y) < 22)) continue;
      rooms.push({ x, y });
    }
    const KINDS = kind === 'cave' ? ['pond', 'meadow', 'grove'] : ['meadow', 'pond', 'grove', 'meadow'];
    o.rooms = rooms.map((R, j) => {
      const rx = 11 + r(10 + j) * 5, ry = rx * 0.74, type = KINDS[(j + Math.floor(r(2) * 4)) % KINDS.length];
      const dx = hub[0] - R.x, dy = hub[1] - R.y, d = Math.hypot(dx, dy) || 1;
      // entrée de l'espace : sur son bord, du côté du carrefour
      const door = [Math.round(R.x + dx / d * rx * 0.55), Math.round(R.y + dy / d * ry * 0.55)];
      return { ...R, rx, ry, type, door };
    });
    o.clearings = [...(o.clearings || []), ...o.rooms.map(R => ({ x: R.x, y: R.y, rx: R.rx, ry: R.ry }))];
    for (const R of o.rooms) {
      const dx = R.x - hub[0], dy = R.y - hub[1], d = Math.hypot(dx, dy) || 1;
      // étang décalé vers le fond de l'espace (le chemin arrive par l'autre côté)
      if (R.type === 'pond') o.lakes = [...(o.lakes || []), { x: R.x + dx / d * R.rx * 0.25, y: R.y + dy / d * R.ry * 0.25, rx: R.rx * 0.48, ry: R.ry * 0.5 }];
      if (R.type === 'meadow') o.tall = [...(o.tall || []), { x: R.x, y: R.y, r: Math.min(R.rx, R.ry) * 0.8 }];
    }
    o.lmMul = (o.lmMul || 1) * 1.4;   // plus de place : un peu plus de repères
  }

  // ------------------------------------------------------------ intérieurs (reliés à leur sous-zone par region())
  // (les intérieurs de l'usine et du manoir sont désormais des bâtiments à plusieurs pièces : maps/palais.js)

  // ============================================================ LES 16 RÉGIONS
  region('montagne', { name: "Montagne de l'Infini", theme: 'mountain', entry: 'left', out: [[3, 'right'], [8, 'down']], lm: [['â', 2], ['à', 2], ['Ó', 3]], subs: [
    ["Pont de l'Infini", 'bridge'],
    ["Contreforts de l'Infini", 'trail'],
    ['Col des Vents', 'maze', { lm: [['Ā', 4]] }],
    ["Lac d'Altitude", 'lake', { lm: [['Ā', 2]] }],
    ["Grotte de l'Infini", 'cave', { theme: 'cave', lm: [['é', 6], ['ê', 5]], noRegionLm: true }],
    ['Galeries de Cristal', 'cave', { theme: 'cave', lm: [['é', 12]], noRegionLm: true }],
    ['Gorge du Torrent', 'river'],
    ['Alpages Suspendus', 'set', { piece: { kind: 'chalet', w: 4, h: 3 }, lm: [['Ā', 2]], pieceSign: "Un chalet de montagne. La cheminée fume encore... quelqu'un vit ici ?" }],
    ['Plateau des Engrenages Noirs', 'grove', { theme: 'summit', lm: [['ã', 4]] }],
    ["Sommet de l'Infini", 'plaza', { theme: 'summit', lm: [['ã', 2], ['å', 4]], noRegionLm: true, post: g => { const x = g.w >> 1, y = (g.h >> 1) - 4; g.set(x, y, '<'); g.set(x - 3, y + 2, '>'); g.set(x + 3, y + 2, '>'); } }],
  ] });
  region('volcan', { name: 'Mont Panorama', theme: 'volcano', entry: 'up', climate: 'volcano', lm: [['ë', 3], ['ì', 3]], subs: [
    ['Pied du Mont Panorama', 'trail'], ['Champs de Cendres', 'plaza'], ['Coulée de Lave', 'river'], ['Forêt Calcinée', 'grove'],
    ['Fumerolles', 'islands', { lm: [['ì', 5]] }], ['Orgues de Basalte', 'grove', { lm: [['ā', 6]] }], ['Lac de Magma', 'bigLake'],
    ['Belvédère du Panorama', 'set', { piece: { kind: 'telescope', w: 2, h: 2 }, lm: [['ā', 3]], pieceSign: "Une longue-vue. On aperçoit toute l'Île des Fichiers... et une fumée noire au loin." }],
    ['Grotte Ardente', 'cave', { theme: 'lavacave', lm: [['ë', 6], ['ê', 4]], noRegionLm: true, dark: { d: 0.5, col: '#5a2010' } }],
    ['Cratère de Meramon', 'set', { piece: { kind: 'smallvolcano', w: 3, h: 2 }, opts: { lakes: [{ x: 28, y: 18, rx: 7, ry: 5 }] } }],
  ] });
  region('savane', { name: 'Savane des Engrenages', theme: 'savanna', entry: 'left', climate: 'beach', out: [[1, 'up'], [4, 'right'], [5, 'down']], lm: [['ä', 2], ['Ñ', 2]], subs: [
    ['Porte de la Savane', 'trail'], ['Plaines Dorées', 'plaza'], ["Point d'Eau", 'lake'], ["Cimetière d'Engrenages", 'grove', { lm: [['Ñ', 4]] }],
    ['Termitières Géantes', 'grove', { lm: [['ä', 4]] }], ['Baobabs Millénaires', 'grove', { lm: [['ď', 4]] }], ['Gué des Rouages', 'river'],
    ['Collines Rousses', 'maze'], ["Champ d'Éoliennes", 'plaza', { lm: [['Ă', 5]] }],
    ['Rocher du Lion', 'set', { piece: { kind: 'lionrock', w: 5, h: 4 }, pieceSign: "Le Rocher du Lion. On raconte qu'un Digimon au cœur de lion y veille sur la savane." }],
  ] });
  region('usine', { name: 'Ville-Usine', theme: 'factory', entry: 'down', lm: [['í', 2], ['ð', 3], ['î', 1]], subs: [
    ['Faubourg Industriel', 'trail'], ['Quai des Wagons', 'plaza', { objects: [{ kind: 'conveyor', x: 8, y: 20, w: 3, h: 1 }, { kind: 'conveyor', x: 26, y: 20, w: 3, h: 1 }] }],
    ['Rue des Cheminées', 'grove', { lm: [['î', 4]] }], ['Parc des Citernes', 'grove', { lm: [['í', 4]] }], ['Dépôt de Batteries', 'grove', { lm: [['ï', 4]] }],
    ["Égouts de l'Usine", 'cave', { theme: 'sewer', lm: [['ð', 4]], noRegionLm: true, dark: { d: 0.5, col: '#2a3a30' }, opts: { rivers: [{ pts: [[-1, 12], [20, 14], [44, 12]], r: 1.4 }] } }],
    ['Atelier des Robots', 'plaza', { lm: [['ă', 5]] }], ['Grues du Port', 'set', { piece: { kind: 'crane', w: 3, h: 2 }, lm: [['ð', 3]] }],
    ['Salle des Machines', 'plaza', { lm: [['ï', 2], ['ă', 3]] }],
    ["Cœur de l'Usine", 'set', { piece: { kind: 'factory', w: 7, h: 5, door: { to: 'usine_hall', tx: 14, ty: 18, dw: 1 } }, pieceSign: "L'USINE — Elle fabrique et démonte des machines jour et nuit. Personne ne sait plus qui l'a mise en marche." }],
  ] });
  region('decharge', { name: "Montagne d'Ordures", theme: 'trash', entry: 'left', lm: [['Ò', 2], ['ð', 3]], subs: [
    ['Entrée de la Décharge', 'trail'], ['Vallée des Pneus', 'grove', { lm: [['Ą', 5]] }], ['Cimetière de Voitures', 'grove', { lm: [['ą', 5]] }],
    ['Collines de Ferraille', 'maze'], ['Mare Huileuse', 'lake', { theme: 'sewer' }], ['Tours de Télévisions', 'grove', { lm: [['Ć', 5]] }],
    ["Labyrinthe d'Ordures", 'maze', { lm: [['Ò', 3]] }], ['Cratère des Débris', 'bigLake', { theme: 'sewer' }], ['Royaume de la Poussière', 'plaza'],
    ['Sommet des Ordures', 'set', { piece: { kind: 'junkthrone', w: 4, h: 3 }, pieceSign: "Un trône fait de déchets... Le roi de la décharge doit être quelque part par ici." }],
  ] });
  region('canyon', { name: 'Grand Canyon', theme: 'canyon', entry: 'up', climate: 'beach', out: [[7, 'left'], [8, 'down']], lm: [['â', 3], ['ó', 3]], subs: [
    ['Bord du Canyon', 'trail'], ['Plateau Rouge', 'plaza'], ['Gorges Étroites', 'maze'],
    ['Ascenseurs du Canyon', 'set', { piece: { kind: 'elevator', w: 3, h: 2 }, pieceSign: "Les ascenseurs du canyon. Ils permettent de monter et descendre... quand ils marchent." }],
    ['Arche de Pierre', 'set', { piece: { kind: 'archrock', w: 5, h: 3 } }], ['Vallée des Cactus', 'grove', { lm: [['ó', 5]] }],
    ['Oasis Cachée', 'lake', { theme: 'savanna' }], ['Mesas Jumelles', 'grove', { lm: [['â', 5]] }], ['Ravin des Crânes', 'maze', { lm: [['ô', 3]] }],
    ["Forteresse d'Ogremon", 'set', { piece: { kind: 'ogregate', w: 4, h: 4 }, objects: [{ kind: 'watchtower', x: 10, y: 3, w: 2, h: 2 }], lm: [['ò', 6]], pieceSign: "« FORTERESSE D'OGREMON. DÉFENSE D'ENTRER ! » — C'est écrit avec beaucoup de fautes." }],
  ] });
  region('dino', { name: 'Région des Dinosaures', theme: 'dino', entry: 'right', lm: [['Ô', 2], ['õ', 2]], subs: [
    ['Lisière Préhistorique', 'trail'], ['Forêt de Cycas', 'grove', { lm: [['Ô', 4]] }], ['Marais Primitif', 'islands'],
    ['Nid Géant', 'set', { piece: { kind: 'giantnest', w: 4, h: 2 }, pieceSign: "Des œufs immenses... Mieux vaut ne pas croiser la maman." }],
    ['Vallée des Ossements', 'grove', { lm: [['õ', 5]] }], ['Volcan Fumant', 'set', { piece: { kind: 'smallvolcano', w: 3, h: 2 } }],
    ['Prairie des Fougères', 'plaza'], ['Rivière Ambrée', 'river', { lm: [['ö', 4]] }],
    ['Zone Glaciaire', 'grove', { theme: 'snow', lm: [['å', 4], ['õ', 2]], noRegionLm: true }],
    ['Zone du Temps Rapide', 'set', { piece: { kind: 'timeclock', w: 3, h: 2 }, lm: [['ć', 3]], pieceSign: "Une horloge étrange. Ses aiguilles tournent beaucoup trop vite..." }],
  ] });
  region('jungle', { name: 'Jungle Tropicale', theme: 'jungle', entry: 'up', out: [[5, 'down']], lm: [['ø', 1]], subs: [
    ['Orée de la Jungle', 'trail'], ['Sous-bois Moite', 'maze'], ['Rivière aux Lianes', 'river'],
    ['Temple Englouti', 'set', { piece: { kind: 'ruintemple', w: 6, h: 4, door: { to: 'temple_parvis', tx: 14, ty: 18, dw: 2 } }, pieceSign: "Un temple englouti par la végétation. Une lueur verte brille au sommet." }],
    ['Pont Invisible', 'bridge', { dark: { d: 0.25, col: '#2a4a3a' } }], ["Forêt d'Amida", 'maze', { opts: { wiggle: 18 } }],
    ['Cascade Tropicale', 'lake'], ['Mangrove', 'islands', { theme: 'mangrove' }],
    ['Village sur Pilotis', 'set', { theme: 'mangrove', piece: { kind: 'stilthut', w: 3, h: 2 }, objects: [{ kind: 'stilthut', v: 1, x: 30, y: 4, w: 3, h: 2 }], opts: { lakes: [{ x: 24, y: 20, rx: 9, ry: 5 }] } }],
    ['Plage Nue', 'trail', { theme: 'beach', music: 'beach' }],
  ] });
  region('overdell', { name: "Cimetière d'Overdell", theme: 'cemetery', entry: 'up', dark: { d: 0.4, col: '#5a4a8a' }, lm: [['ú', 4], ['û', 1]], subs: [
    ['Lande Grise', 'trail'], ['Allée des Tombes', 'grove', { lm: [['ú', 6]] }], ['Bois Mort', 'maze'], ['Mare Noire', 'lake'],
    ['Champ des Croix', 'grove', { lm: [['ú', 8]] }], ['Crypte Effondrée', 'cave', { theme: 'cave', lm: [['ú', 4], ['ê', 3]], noRegionLm: true, dark: { d: 0.6, col: '#3a2a5a' } }],
    ['Jardin des Citrouilles', 'plaza', { lm: [['û', 8]] }],
    ['Chapelle en Ruine', 'set', { piece: { kind: 'chapel', w: 5, h: 4 }, lm: [['Ď', 3]], pieceSign: "Une chapelle en ruine. Des gargouilles veillent sur l'entrée." }],
    ['Cour du Manoir', 'plaza', { lm: [['Ď', 4], ['ü', 6]] }],
    ['Manoir du Seigneur Gris', 'set', { piece: { kind: 'manor', w: 8, h: 6, door: { to: 'manoir_hall', tx: 14, ty: 18, dw: 2 } }, lm: [['Ď', 2]], pieceSign: "MANOIR DU SEIGNEUR GRIS — Les visiteurs sont priés de ne pas réveiller les morts." }],
  ] });
  region('brumes', { name: 'Bois Brumeux', theme: 'fog', entry: 'down', out: [[4, 'right'], [5, 'up']], lm: [['>', 2], ['|', 2]], subs: [
    ['Lisière Brumeuse', 'trail'], ['Sentier des Lanternes', 'trail', { lm: [['>', 6]] }], ['Étang Fantôme', 'lake'], ['Labyrinthe de Brume', 'maze', { opts: { wiggle: 18 } }],
    ['Clairière Silencieuse', 'plaza'], ['Arbres Pleureurs', 'grove', { lm: [['|', 5]] }], ['Puits Oublié', 'set', { piece: { kind: 'well', w: 2, h: 1 }, pieceSign: "Un vieux puits. On entend des murmures qui remontent du fond..." }],
    ['Pont de Brume', 'bridge'], ['Sanctuaire Voilé', 'set', { piece: { kind: 'mistgate', w: 4, h: 2 }, lm: [['>', 4]] }],
    ['Cœur du Brouillard', 'plaza', { post: g => g.set(g.w >> 1, (g.h >> 1) - 3, '<') }],
  ] });
  region('jouets', { name: 'Ville des Jouets', theme: 'toy', entry: 'left', music: 'village', lm: [['ñ', 1], ['Č', 1]], subs: [
    ['Entrée des Jouets', 'trail'], ['Avenue des Cubes', 'grove', { lm: [['B', 6]] }],
    ['Parc du Manège', 'set', { piece: { kind: 'carousel', w: 5, h: 3 } }],
    ['Gare du Petit Train', 'set', { piece: { kind: 'toytrain', w: 4, h: 1 } }],
    ['Jardin des Nounours', 'grove', { lm: [['Č', 5]] }],
    ['Quartier des Maisons', 'set', { objects: [{ kind: 'toyhouse', v: 0, x: 26, y: 4, w: 3, h: 2 }, { kind: 'toyhouse', v: 2, x: 31, y: 4, w: 3, h: 2 }], piece: { kind: 'toyhouse', v: 1, w: 3, h: 2 } }],
    ['Lac des Canards', 'lake'], ['Labyrinthe de Dominos', 'maze', { lm: [['B', 6]] }], ['Place des Boîtes à Surprise', 'plaza', { lm: [['ñ', 5]] }],
    ['Château de Monzaemon', 'set', { piece: { kind: 'toycastle', w: 7, h: 5, door: { to: 'chateau_hall', tx: 14, ty: 18, dw: 2 } }, pieceSign: "Le château des jouets. « Ici, tout le monde doit sourire ! » dit une pancarte." }],
  ] });
  region('gel', { name: 'Terre Gelée', theme: 'snow', entry: 'down', climate: 'snow', lm: [['å', 2], ['ç', 2]], subs: [
    ['Frontière Gelée', 'trail'], ['Forêt Enneigée', 'grove'], ['Lac Gelé', 'bigLake'], ['Plaine des Bonshommes', 'plaza', { lm: [['æ', 5]] }],
    ['Cascade de Glace', 'set', { piece: { kind: 'frozenfall', w: 4, h: 3 } }],
    ["Village d'Igloos", 'set', { piece: { kind: 'igloo', w: 2, h: 1 }, objects: [{ kind: 'igloo', x: 30, y: 6, w: 2, h: 1 }, { kind: 'igloo', x: 28, y: 20, w: 2, h: 1 }] }],
    ['Crevasses', 'maze'], ['Grotte de la Plage Secrète', 'cave', { theme: 'icecave', lm: [['ç', 8]], noRegionLm: true, dark: { d: 0.4, col: '#3a4a7a' } }],
    ['Champs de Cristaux', 'grove', { lm: [['ç', 6]] }],
    ['Temple de Glace', 'set', { piece: { kind: 'icetemple', w: 6, h: 5 }, lm: [['è', 4]], pieceSign: "TEMPLE DE GLACE — Seuls les Digimon à l'âme pure (Vaccin) peuvent en franchir les portes." }],
  ] });
  // LE GRAND LAC (chapitre 2) : un seul lac qui s'étend sur neuf cartes. On en fait le tour par les rives
  // (anneau de 8 cartes), et l'on n'atteint l'île du tramway, au centre, que par le ponton de la Cascade du Dragon, au nord.
  //     7 — 6 — 5            (6 ↑ 9 : le Phare, sur un cap au bord de l'île)
  //     |   |   |
  //     8   2   4            (2 = Lac du Tramway : l'eau, l'île, le tramway — game/chapitre2.js)
  //     |       |
  //     1 — 0 — 3            (0 ↓ Clairière de l'Arrivée ; 1 ↓ Pays des Scarabées, en attendant le futur village au sud de la Rosière)
  //  10 au nord et 11 à l'ouest du Lac de l'Œil du Dragon (7) : prairies au bord des falaises, la mer en contrebas
  // (la RÉGION s'appelle « Grand Lac » ; « Lac du Tramway » est le nom de la carte de l'île, au centre : lac2)
  region('lac', { taille: DW.PUZZLE.case, name: 'Grand Lac', theme: 'spring', entry: 'down', music: 'beach', out: [[1, 'down']], lm: [['Ð', 3]],
    plan: [[1, 2], [0, 2], [1, 1], [2, 2], [2, 1], [2, 0], [1, 0], [0, 0], [0, 1], [1, -1], [0, -1], [-1, 0]],
    links: [[0, 1], [1, 8], [8, 7], [7, 6], [6, 5], [5, 4], [4, 3], [3, 0], [6, 2], [6, 9], [7, 10], [7, 11], [9, 10]],
    lake: { cx: 1.5, cy: 1.5, r: 1.02 }, subs: [
    // (bord nord-ouest de l'île : plages à l'ouest, côte rocheuse autour du Phare)
    ['Rive Sud', 'trail'], ['Rosière', 'plaza', { textures: 'bebe', lm: [['Ð', 3], ['ŗ', 10]], coast: { left: 'beach' },
      // le Village des Gomamon (ses maisons : gfx/textures.js) : jardinières, lanternes en cœur et boîtes aux lettres devant
      // chaque maison, bancs, tableau, buissons fleuris (les toilettes posées dans l'atelier restent dégagées)
      mobilier: [['jardiniere', 40, 34], ['lanterne_coeur', 46, 34], ['boite_lettres', 41, 35], ['jardiniere', 40, 42], ['lanterne_coeur', 46, 42], ['boite_lettres', 41, 43],
        ['jardiniere', 53, 38], ['lanterne_coeur', 59, 38], ['boite_lettres', 54, 39], ['banc', 48, 38, 2], ['banc', 36, 36, 2], ['panneau_affichage', 50, 42, 2],
        ['buisson_fleurs', 38, 39], ['buisson_fleurs', 61, 35], ['trefles', 52, 45], ['fanions', 57, 43, 2]].map(([n, x, y, w = 1]) => ['tex_bebe_' + n, x, y, w, 1]) }],
    ['Lac du Tramway', 'trail', { sandWalk: true }],
    ['Ponton des Pêcheurs', 'trail', { coast: { right: 'cliff' } }], ['Pointe Coela', 'trail', { lm: [['Ð', 3]], coast: { right: 'cliff' } }], ['Îlots aux Nénuphars', 'islands', { coast: { up: 'cliff', right: 'cliff' } }],   // (bord est de l'île : falaises)
    ['Cascade du Dragon', 'trail', { sandWalk: true }], ["Lac de l'Œil du Dragon", 'lake'], ['Pont Numérique', 'trail', { coast: { left: 'beach' } }],   // (terre ferme entre la plage et le lac : plus de rivière ni de pont)
    ['Phare du Lac', 'set', { piece: { kind: 'lighthouse', w: 3, h: 2 }, coast: { up: 'cliff', right: 'cliff' } }],   // (à l'ouest, la Prairie des Falaises)
    ['Prairie des Falaises', 'plaza', { theme: 'meadow', coast: { up: 'cliff', left: 'cliff' } }],
    ['Falaises du Couchant', 'plaza', { theme: 'meadow', coast: { left: 'cliff', up: 'cliff', down: 'cliff' } }],
  ] });
  // le Phare du Lac (lac9) : on le lit par-devant, sur le rang du bas du phare lui-même (seulement un texte : la carte et
  // son décor restent les mêmes ; le repère automatique « Le Phare du lac » des autres rives, maps/decor.js, a le sien)
  { const M = MAPS.lac9, P = M && M.piece, phare = () => DW.say(DW.Time.isNight()
      ? "Le Phare du Lac. Tout là-haut, sa lanterne brille dans la nuit et veille sur le grand lac."
      : "Le Phare du Lac, blanc et rouge, dressé au bord de la falaise. Sa petite porte de bois est fermée... Le soir venu, sa lanterne s'allume et veille sur le grand lac.");
    if (P) for (let x = P.x; x < P.x + P.w; x++) M.signs[x + ',' + (P.y + P.h - 1)] = phare; }
  // ------------------------------------------------------------ CHAPITRE 3 : le pays de Meramon (épisode 4 de la saison 1)
  // À la sortie ouest de la forêt, des déserts hérissés de poteaux télégraphiques et de panneaux routiers ;
  // au centre, le Village des Yokomon (huttes de chaume, fontaine, petit lac où dort une épave) ;
  // puis la route du Mont Miharashi, montagne verte en terrasses où vit Meramon. Bords : plage et falaises.
  //        4 Mont — 3 Route — 1 Village — 0 Désert des Poteaux | Clairière de l'Arrivée
  //                                       |
  //                                       2 Plaine des Panneaux | Sentier des Murmures
  //                                       (au sud : le Bosquet des Pousses)
  // (cartes dessinées à la main : maps/miharashi.js ; relief en terrasses façon Digimon World 2003)
  // (géographie du pays et peinture de chaque carte : maps/miharashi.js — une seule terre en coordonnées du monde,
  //  les cartes en sont des fenêtres ; la côte, les routes et le relief se raccordent d'elles-mêmes)
  region('miharashi', { taille: DW.PUZZLE.case, mer: true, name: 'Pays de Meramon', theme: 'desert', entry: 'right', music: 'field', climate: 'beach', ambient: 'beach',
    out: [[0, 'up'], [2, 'right'], [2, 'down']],
    plan: [[3, 0], [2, 0], [3, 1], [1, 0], [0, 0]], links: [[0, 1], [0, 2], [1, 3], [3, 4]],
    subs: [
      ['Désert des Poteaux', 'trail', { textures: 'desert', noRegionLm: true, opts: { hub: [48, 36], autoTall: 0.2 }, post: (g, m) => DW.Mih.desert(g, m, 0) }],
      ['Village des Yokomon', 'plaza', { theme: 'yokovillage', textures: 'bebe', noRegionLm: true, opts: { hub: [48, 36], autoTall: 0.2 },
        objects: [
          { kind: 'stonefountain', v: 0, x: 46, y: 27, w: 5, h: 3 },
          { kind: 'shipwreck', v: 0, x: 21, y: 46, w: 7, h: 4 },
          ...[[34, 15], [43, 14], [53, 14], [62, 16], [26, 22], [70, 22], [26, 39], [38, 44], [57, 44], [67, 39], [77, 44], [18, 17], [79, 16]].map(([x, y], i) => ({ kind: 'yokohut', v: i % 3 === 2 ? 1 : 0, x, y, w: 4, h: 3, hut: i, flip: i % 2 === 1 })),   // (tes tipis : gfx/textures.js, un sur deux retourné)
        ],
        // (la fontaine est à sec tant que Meramon n'est pas calmé : game/chapitre3.js)
        signs: { '48,31': () => DW.say(DW.state.flags.meramon ? "La fontaine du village. L'eau coule de nouveau : les Yokomon y puisent de quoi arroser leurs fleurs."
          : "La fontaine du village... à sec. Depuis que Meramon a perdu la tête, plus une goutte pour arroser les fleurs des Yokomon.") },
        post: (g, m) => DW.Mih.village(g, m) }],
      ['Plaine des Panneaux', 'trail', { textures: 'desert', noRegionLm: true, opts: { hub: [50, 36], autoTall: 0.2 }, post: (g, m) => DW.Mih.desert(g, m, 2) }],
      ['Route du Mont Miharashi', 'trail', { theme: 'miharashi', noRegionLm: true, opts: { hub: [48, 42], autoTall: 0.3 }, post: (g, m) => DW.Mih.route(g, m) }],
      ['Mont Miharashi', 'plaza', { theme: 'miharashi', noRegionLm: true, opts: { hub: [88, 36], autoTall: 0.2 },
        objects: [],   // (le cratère est un lac de lave creusé dans le sommet : maps/miharashi.js, mont)
        post: (g, m) => DW.Mih.mont(g, m) }],
    ] });
  // (les passages du pays de Meramon, comme tous ceux du monde, viennent du puzzle : maps/puzzle.js)
  MAPS.miharashi1.calm = true;   // pas de Digimon sauvages dans le village

  region('scarabees', { name: 'Pays des Scarabées', theme: 'beetle', entry: 'up', lm: [['ý', 2], ['þ', 1]], subs: [
    ['Bois Ancien', 'trail'], ['Souches Géantes', 'grove', { lm: [['ý', 5]] }], ['Ruches Sauvages', 'grove', { lm: [['þ', 5]] }],
    ['Sentier des Lucanes', 'maze'], ['Clairière Dorée', 'plaza'], ['Mare aux Libellules', 'lake'],
    ['Forêt de Champignons', 'grove', { lm: [['}', 6]] }], ['Statues des Scarabées', 'grove', { lm: [['ÿ', 4]] }],
    ['Arbre-Monde', 'set', { piece: { kind: 'worldtree', w: 8, h: 5 }, pieceSign: "L'Arbre-Monde. Ses racines plongeraient jusqu'au cœur des données de l'île." }],
    ['Colisée des Scarabées', 'set', { piece: { kind: 'colosseum', w: 8, h: 4 }, pieceSign: "Le Colisée des Scarabées. Un grand tournoi s'y tient chaque année." }],
  ] });
  region('marais', { name: 'Marais des Geko', theme: 'swamp', entry: 'right', lm: [['Ð', 3], ['ù', 1]], subs: [
    ['Bord du Marais', 'trail'], ['Tourbières', 'islands'], ['Forêt Engloutie', 'grove'], ['Roseaux Chantants', 'grove', { lm: [['Ð', 8]] }],
    ['Mare aux Grenouilles', 'lake', { lm: [['ù', 3]] }], ['Labyrinthe de Vase', 'maze'],
    ['Cabanes du Marais', 'set', { piece: { kind: 'bogshack', w: 4, h: 3 }, objects: [{ kind: 'bogshack', v: 1, x: 30, y: 5, w: 4, h: 2 }] }],
    ['Pont Moussu', 'bridge'], ['Jardin du Palais', 'plaza', { lm: [['>', 6]] }],
    ['Palais Geko', 'set', { piece: { kind: 'gekopalace', w: 8, h: 6 }, lm: [['>', 2]], pieceSign: "Le Palais Geko. Le souverain du marais y vit, entouré de ses musiciens." }],
  ] });
  region('tunnel', { name: 'Tunnel Foreur', theme: 'cave', entry: 'up', dark: { d: 0.45, col: '#40302a' }, lm: [['ê', 2], ['é', 1]], subs: [
    ['Entrée du Tunnel', 'cave'], ['Galerie des Foreuses', 'set', { piece: { kind: 'drill', w: 4, h: 2 } }],
    ['Rails Abandonnés', 'cave', { lm: [['č', 5]] }], ['Lac Souterrain', 'bigLake'],
    ['Grotte aux Champignons', 'cave', { lm: [['G', 8]] }], ['Veines de Cristal', 'cave', { lm: [['é', 8]] }],
    ['Grotte Ancestrale de Leomon', 'set', { piece: { kind: 'leomonstone', w: 4, h: 3 }, pieceSign: "Une tête de lion sculptée dans la roche. Les anciens Digimon venaient s'y recueillir." }],
    ['Bassin de Lave', 'bigLake', { theme: 'lavacave', dark: { d: 0.5, col: '#5a2010' } }],
    ['Rivière de Feu', 'river', { theme: 'lavacave', dark: { d: 0.5, col: '#5a2010' } }],
    ['Grotte de Lave', 'cave', { theme: 'lavacave', lm: [['ë', 8]], noRegionLm: true, dark: { d: 0.5, col: '#5a2010' } }],
  ] });
  // le tunnel est entièrement souterrain
  for (const id in MAPS) { const m = MAPS[id]; if (m.region === 'tunnel' && m.spec) { m.indoor = true; if (!m.dark) m.dark = { d: 0.6, col: '#40302a' }; } }

  // ============================================================ LIAISONS ENTRE RÉGIONS ET AVEC LES CARTES EXISTANTES
  const R = n => ENTRY[n];
  LINKS.push(
    ['village', 'right', R('montagne')], ['montagne3', 'right', R('savane')], ['montagne8', 'down', R('volcan')],
    ['savane1', 'up', R('usine')], ['savane4', 'right', R('decharge')], ['savane5', 'down', R('canyon')],
    ['canyon7', 'left', R('dino')], ['canyon8', 'down', R('jungle')], ['jungle5', 'down', R('overdell')],
    ['berceau', 'up', R('brumes')], ['brumes4', 'right', R('jouets')], ['brumes5', 'up', R('gel')],
    ['champs', 'left', R('marais')], ['champs', 'down', R('tunnel')],
  );
  // (entre deux pièces du puzzle — Clairière, Lac, Sentier, Bosquet, Mont Miharashi — les passages et leurs règles de
  //  chapitre viennent de l'atelier des cartes : maps/puzzle.js)
  // portes des régions (comme dans Digimon World 1 : les recrues ouvrent le monde, la ville qui grandit aussi)
  const T = () => DW.Town, LV = n => T().LEVELS[n];
  const byLevel = (n, what) => ({ cond: () => T().level() >= n, lock: () => `Une barrière de données bloque ${what}. Elle se dissipera quand la Ville des Fichiers sera devenue « ${LV(n)} » (${T().STEPS[n]} % de développement ; actuellement ${T().progress()} %).` });
  const GATE = {
    montagne: { cond: () => T().has('gotsumon'), lock: "Un éboulis bloque le Pont de l'Infini... Un Digimon solide comme un roc pourrait le déblayer. (Recrute Gotsumon)" },
    brumes: { cond: () => T().has('elecmon'), lock: "Le Bois Brumeux est plongé dans le noir total... Il faudrait quelqu'un pour rallumer les lanternes. (Recrute Elecmon)" },
    marais: { cond: () => T().has('palmon'), lock: "Des ronces géantes bloquent le chemin de l'ouest... Un Digimon plante pourrait les écarter. (Recrute Palmon)" },
    tunnel: { cond: () => T().level() >= 5, lock: () => `Une grille rouillée ferme le tunnel. Jijimon en a la clé : il te la confiera quand la ville sera devenue « ${LV(5)} ».` },
    savane: byLevel(3, 'la route de la savane'), volcan: byLevel(4, 'le sentier du Mont Panorama'),
    usine: byLevel(5, "l'entrée de la Ville-Usine"), decharge: byLevel(5, "le chemin de la décharge"), jouets: byLevel(6, 'la Ville des Jouets'),
    canyon: byLevel(6, 'la descente vers le canyon'), scarabees: byLevel(6, 'le Pays des Scarabées'), dino: byLevel(7, 'la Région des Dinosaures'),
    jungle: byLevel(7, 'la jungle'), gel: byLevel(7, 'la Terre Gelée'), overdell: byLevel(8, "le Cimetière d'Overdell"),
  };

  // sorties ajoutées aux cartes existantes (cases ouvertes dans leurs fichiers)
  // (plan d'origine des cartes agrandies ×2 : voir MapKit.ZOOM)
  const EXTRA0 = { village: { right: [13, 3] }, berceau: { up: [23, 3] }, champs: { left: [19, 3], down: [20, 3] } };
  const EXTRA = {}, DIM = {};
  for (const id in EXTRA0) { const [Z] = DW.MapKit.ZOOM[id]; EXTRA[id] = {}; for (const k in EXTRA0[id]) { const [p, l] = EXTRA0[id][k]; EXTRA[id][k] = [p * Z, l * Z]; } }
  for (const id of ['village', 'champs']) { const [Z, w, h] = DW.MapKit.ZOOM[id]; DIM[id] = [w * Z, h * Z]; }
  const dims = id => DIM[id] || (MAPS[id].spec ? [MAPS[id].w, MAPS[id].h] : [DW.getMap(id).w, DW.getMap(id).h]);
  const exitOf = (id, side) => (EXTRA[id] && EXTRA[id][side]) || MAPS[id].exits[side];
  for (const [a, sa, b] of LINKS) {
    const sb = OPP[sa], [wa, ha] = dims(a), [wb, hb] = dims(b);
    const [pa, la] = exitOf(a, sa), [pb, lb] = exitOf(b, sb), len = Math.min(la, lb);
    const mk = (side, p, w, h, to, tp, tw, th) => {
      if (side === 'left') return { x: 0, y: p, w: 1, h: len, dir: 'left', to, tx: tw - 1, ty: tp, _zt: true };
      if (side === 'right') return { x: w - 1, y: p, w: 1, h: len, dir: 'right', to, tx: 0, ty: tp, _zt: true };
      if (side === 'up') return { x: p, y: 0, w: len, h: 1, dir: 'up', to, tx: tp, ty: th - 1, _zt: true };
      return { x: p, y: h - 1, w: len, h: 1, dir: 'down', to, tx: tp, ty: 0, _zt: true };
    };
    const wa1 = mk(sa, pa, wa, ha, b, pb, wb, hb), rb = MAPS[b].region, ra = MAPS[a].region;
    // entrée d'une région depuis l'extérieur : porte éventuelle
    if (rb !== ra && GATE[rb] && ENTRY[rb] === b) Object.assign(wa1, GATE[rb]);
    MAPS[a].warps.push(wa1);
    MAPS[b].warps.push(mk(sb, pb, wb, hb, a, pa, wa, ha));
  }
  DW.REGION_ENTRY = ENTRY;
  if (DW.PUZZLE) DW.PUZZLE.apply();   // LE PUZZLE DU MONDE : pièces de même taille, passages posés au même endroit des deux côtés
  if (DW.Monde) DW.Monde.pret = true;   // tous les passages sont posés : la grille du monde peut être calculée (maps/monde.js)
})();
;

// ===== js/maps/antre.js
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
    if (!first) { s.bits += 30 * lvl; await say(`Shellmon s'enfonce dans le sable en grommelant. (+${30 * lvl} Bits)`); return; }
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
;

// ===== js/maps/yokomon.js
'use strict';
// =====================================================================
//  VILLAGE DES POYOMON — un hameau caché dans la forêt (le Village des Yokomon de l'animé est au Mont Miharashi,
//  chapitre 3 : maps/miharashi.js)
//  On y entre en se faufilant dans un tronc creux, au bord de la Prairie des Lucioles.
//  Les Poyomon vivent dans des nids et de petites maisons autour d'un vieux puits... à sec. Quête : rapporter 3 bouteilles
//  d'eau (Eau fraîche ou Eau de source). Récompense : cartes Digimon, Pomme bleue, et un puits qui
//  désaltère gratuitement ensuite. Les Poyomon parlent aussi de la menace de la forêt.
//  Mobilier : les images de la planche VILLAGE BEBE du joueur (dossier « bebe », gfx/textures.js) — maisons, portail,
//  bancs et lanternes autour du puits, aire de jeux, tableau d'affichage, toilettes, jouets, guirlandes.
// =====================================================================
(function () {
  const { say, st, paint } = DW.MapKit;
  const MAPS = DW.MAPS;
  const Hh = (x, y, s) => DW.Art.hash(x, y, s);
  const W = 40, H = 32;   // (agrandi pour le mobilier : la clairière s'étend au sud et à l'est ; le puits ne bouge pas)
  const B = n => 'tex_bebe_' + n;   // (images de la planche VILLAGE BEBE : gfx/textures.js)
  const rows = paint(W, H, 'T', g => {
    // clairière ovale entourée d'arbres, chemin vers la sortie (en bas), mare, fleurs
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (Math.hypot((x - 19) / 17, (y - 13) / 11.5) + (Hh(x, y, 5) - 0.5) * 0.16 < 1) g.set(x, y, Hh(x, y, 6) < 0.18 ? 'f' : '.');
    for (let y = 18; y < H; y++) for (let x = 16; x < 19; x++) g.set(x, y, '=');
    g.set(16, H - 1, 'T'); g.set(18, H - 1, 'T');   // une seule case de sortie
    for (let y = 9; y < 17; y++) for (let x = 15; x < 20; x++) if (g.get(x, y) === '.') g.set(x, y, '=');
    for (let y = 6; y < 9; y++) for (let x = 25; x < 30; x++) if (Math.hypot((x - 27.5) / 2.4, (y - 7.5) / 1.4) < 1) g.set(x, y, '~');
  });
  MAPS.village_yokomon = {
    name: 'Village des Poyomon', music: 'forest', bg: 'foret', ambient: 'forest', theme: 'meadow', climate: 'forest', region: 'foret', textures: 'bebe',
    rows, encounters: [], wildN: 0, dress: false, secretEntry: true,   // (on y entre par le tronc creux de la Prairie : pas de passage normal)
    objects: [
      { kind: 'well', x: 17, y: 11, w: 1, h: 1 },
      { kind: 'giantnest', x: 6, y: 7, w: 3, h: 1 }, { kind: 'giantnest', x: 9, y: 15, w: 3, h: 1 }, { kind: 'giantnest', x: 23, y: 14, w: 3, h: 1 },
      { kind: 'flowerbed', v: 0, x: 14, y: 8, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 1, x: 20, y: 8, w: 1, h: 1, small: true },
      // les maisons des Poyomon, au bord de la clairière (nid de feuilles, œuf, butte moussue, champignon) ; une boîte aux lettres
      ...[['maison_nid', 11, 4], ['maison_oeuf', 19, 3], ['maison_mousse', 3, 11], ['maison_champignon', 27, 12]].map(([n, x, y]) => ({ kind: B(n), x, y, w: 3, h: 2 })),
      { kind: B('boite_lettres'), x: 14, y: 5, w: 1, h: 1 },
      // le portail du village sur le chemin (on passe en son milieu) et le poteau indicateur
      { kind: B('portail'), x: 17, y: 18, w: 1, h: 1, walk: true, block: [[-2, 0], [2, 0]] }, { kind: B('poteau_indicateur'), x: 20, y: 17, w: 1, h: 1 },
      // autour du puits : bancs, lanternes en cœur et lampes étoiles
      { kind: B('banc'), x: 13, y: 11, w: 2, h: 1 }, { kind: B('banc'), x: 21, y: 11, w: 2, h: 1 },
      { kind: B('lanterne_coeur'), x: 14, y: 9, w: 1, h: 1 }, { kind: B('lanterne_coeur'), x: 20, y: 9, w: 1, h: 1, flip: true },
      { kind: B('lampe_etoile'), x: 14, y: 14, w: 1, h: 1 }, { kind: B('lampe_etoile'), x: 20, y: 14, w: 1, h: 1 },
      // l'aire de jeux, au sud-est (hors de l'ombre des grands arbres du bas) : balançoire, toboggan, tape-cul, bac à sable,
      // et des jouets qui traînent
      { kind: B('balancoire'), x: 22, y: 17, w: 2, h: 1 }, { kind: B('toboggan'), x: 25, y: 18, w: 2, h: 1 }, { kind: B('tape_cul'), x: 27, y: 16, w: 2, h: 1 },
      { kind: B('bac_sable'), x: 24, y: 15, w: 2, h: 1 }, { kind: B('cubes'), x: 26, y: 15, w: 1, h: 1 }, { kind: B('panier_balles'), x: 24, y: 18, w: 1, h: 1 },
      // à l'ouest : le coin pique-nique, les fanions, le tableau d'affichage ; à l'est, au bord de la mare, les toilettes
      { kind: B('table'), x: 5, y: 10, w: 2, h: 1 }, { kind: B('tabouret'), x: 4, y: 10, w: 1, h: 1 }, { kind: B('tabouret'), x: 7, y: 10, w: 1, h: 1 },
      { kind: B('fanions'), x: 8, y: 9, w: 2, h: 1 }, { kind: B('panneau_affichage'), x: 8, y: 13, w: 2, h: 1 },
      { kind: 'toilet', v: 0, x: 31, y: 10, w: 2, h: 2 },
      // et partout : ballons, moulinets, carillon près de la mare, œufs, champignon géant, buisson fleuri, trèfles
      { kind: B('ballons'), x: 12, y: 13, w: 1, h: 1 }, { kind: B('moulinets'), x: 11, y: 7, w: 1, h: 1 }, { kind: B('carillon'), x: 25, y: 6, w: 1, h: 1 },
      { kind: B('oeufs'), x: 25, y: 10, w: 1, h: 1 }, { kind: B('champignon_geant'), x: 29, y: 15, w: 1, h: 1 }, { kind: B('buisson_fleurs'), x: 7, y: 6, w: 1, h: 1 },
      { kind: B('trefles'), x: 10, y: 16, w: 1, h: 1 }, { kind: B('guirlande'), x: 24, y: 9, w: 2, h: 1 },
    ],
    npcs: [],
    signs: {
      '20,17': '« VILLAGE DES POYOMON » — ↓ Prairie des Lucioles (par le tronc creux). Une petite main a dessiné des gouttes d\'eau tout autour.',
      '8,13': () => say(st().flags.yokoWell ? 'Le tableau du village : « LE PUITS CHANTE DE NOUVEAU ! Merci à l\'humain et à son Digimon ! Grande fête ce soir autour du puits. »'
        : 'Le tableau du village : « Puits à sec... Qui pourra nous rapporter de l\'eau ? Demandez à la doyenne, près du puits. »'),
      '9,13': () => MAPS.village_yokomon.signs['8,13'](),
    },
    // (l'arrivée est réglée sur le tronc creux à la première visite ; en attendant, près de l'entrée de la Prairie)
    warps: [(() => {
      // arrivée par défaut : là où l'on arrive dans la Prairie depuis une autre carte (une case sûre)
      // (recopiée d'une sortie peut-être déjà convertie à la taille de la Prairie agrandie : son marqueur _zt suit)
      let a = null; for (const id in MAPS) for (const w of MAPS[id].warps || []) if (!a && w.to === 'prairie' && w.tx != null) a = w;
      return { x: 17, y: H - 1, w: 1, h: 1, dir: 'down', to: 'prairie', tx: a ? a.tx : 5, ty: a ? a.ty : 5, _zt: !!(a && a._zt) };
    })()],
    entry: { x: 17, y: H - 2 },
    populate() {
      // la sortie ramène toujours devant le tronc creux de la Prairie (même après un chargement de partie ici)
      const pm = DW.getMap('prairie'); DW.YokoVillage.place(pm, 'prairie');
      const log = (pm.objects || []).find(o => o.yoko); if (log) Object.assign(this.warps[0], { tx: log.x, ty: log.y + 1, _zt: true });   // (déjà en coordonnées de la carte agrandie)
      const done = !!st().flags.yokoWell;
      this.npcs = [
        { sp: 'poyomon', x: 16, y: 13, face: 'down', talk: () => elder() },
        ...[[7, 9], [11, 17], [24, 16], [13, 7], [22, 6], [27, 11]].map(([x, y], i) => ({ sp: 'poyomon', x, y, face: i % 2 ? 'left' : 'right', wander: 2,
          // (le monstre rouge, c'est Kuwagamon : une fois vaincu, il ne survole plus le village)
          talk: () => say(done ? DW.pick(["Le puits chante de nouveau ! Merci, merci !", "On a bu, on a ri, on a dansé toute la nuit !", "Reviens nous voir quand tu veux !"])
            : DW.pick(["Le puits est à sec... On a si soif.", st().flags.kuwagamon ? "Le monstre rouge ne survole plus le village ! Mais le puits, lui, est toujours à sec..." : "Chut ! Le monstre rouge passe parfois au-dessus du village...", "Avant, il y avait de l'eau fraîche ici. Et des chansons."]), 'Poyomon') })),
      ];
    },
  };
  // le vieux puits : à sec, puis il désaltère gratuitement une fois la quête faite
  MAPS.village_yokomon.signs['17,11'] = async () => {
    const m = st().party[0];
    if (!st().flags.yokoWell) { await say("Un vieux puits de pierre... Tu te penches : il est complètement à sec."); return; }
    const f = st().flags;
    if (m) { DW.Care.drink(m, 90); DW.Audio.sfx('water'); await say(`${m.name} boit l'eau fraîche du puits. Délicieuse ! (soif étanchée)`); }
    // la première fois : l'eau revenue a fait remonter un trésor oublié au fond du puits
    if (!f.yokoWellGift) {
      f.yokoWellGift = true;
      DW.Audio.sfx('fanfare');
      await say("En remontant le seau, quelque chose brille au fond de l'eau... Un vieux coffret de pierre, remonté avec la source !");
      const extra = DW.giveItem('puce_pv', 1) + DW.giveItem('eau_source', 2);
      await say(`Dedans : une Puce PV (elle augmente pour toujours les PV d'un Digimon) et 2 Eaux de source !${DW.extraMsg(extra)}`);
      DW.autosave();
      return;
    }
    // ensuite, une bouteille d'Eau de source à remplir chaque jour
    if (f.yokoWellDay !== DW.Time.day()) {
      f.yokoWellDay = DW.Time.day();
      const extra = DW.giveItem('eau_source', 1);
      await say(`Tu remplis une bouteille au puits : 1 Eau de source ! (Reviens demain pour la suivante.)${DW.extraMsg(extra)}`);
    }
  };

  // ------------------------------------------------------------ la doyenne des Poyomon : la quête de l'eau
  const WATER = ['eau_fraiche', 'eau_source'];
  async function elder() {
    const s = st(), f = s.flags;
    if (f.yokoWell) { await say(f.yokoWellGift ? "Grâce à toi, le puits ne tarira plus. Puise une bouteille d'Eau de source chaque jour, elle est à toi !" : "Grâce à toi, le puits ne tarira plus... Et quelque chose brillait au fond : va puiser un seau !", 'Poyomon'); return; }
    if (!f.yokoQuest) {
      f.yokoQuest = true;
      await say("Oh ! Un humain ! Bienvenue au village des Poyomon. Je suis la doyenne.", 'Poyomon');
      await say("Notre puits s'est tari le jour où le monstre rouge est arrivé dans la forêt. Plus une goutte...", 'Poyomon');
      await say("Si tu pouvais nous rapporter 3 bouteilles d'eau (de l'Eau fraîche, ou de l'Eau de source), le puits se remettrait peut-être à couler. On saura te remercier !", 'Poyomon');
      return;
    }
    const have = WATER.reduce((a, id) => a + (s.bag[id] || 0), 0);
    if (have < 3) { await say(`Il nous faudrait 3 bouteilles d'eau... (Tu en as ${have}.) Les distributeurs de nourriture en vendent, et les sources en donnent parfois.`, 'Poyomon'); return; }
    if ((await DW.ask("Donner 3 bouteilles d'eau aux Poyomon ?")) !== 0) return;
    let n = 3; for (const id of WATER) { const k = Math.min(n, s.bag[id] || 0); s.bag[id] -= k; n -= k; }
    DW.Audio.sfx('water');
    await say("Les Poyomon versent l'eau dans le puits en chantant... Glou... glou... Un grondement monte des profondeurs !", 'Poyomon');
    DW.Audio.sfx('fanfare'); f.yokoWell = true;
    await say("L'eau jaillit ! Le puits coule de nouveau ! Tout le village danse autour de toi !");
    const extra = DW.giveItem('cartes', 2) + DW.giveItem('pomme_bleue', 1); if (DW.Cards) DW.Cards.give('poyomon');
    s.party.forEach(m => m.addHappy(10));
    await say(`Les Poyomon t'offrent 2 Paquets de cartes et une Pomme bleue ! Ton équipe est toute joyeuse. (bonheur +10)${DW.extraMsg(extra)}`);
    await say("Au fait... Quand l'eau est remontée, on a vu quelque chose briller tout au fond du puits. Va donc puiser un seau, humain !", 'Poyomon');
    DW.autosave();
  }

  // ------------------------------------------------------------ l'entrée : un tronc creux au bord de la Prairie des Lucioles
  // (placé à la première visite contre la lisière d'arbres, loin des sorties ; on s'y faufile en lui parlant)
  DW.YokoVillage = {
    place(m, id) {
      if (id !== 'prairie' || m._yokoFor === m.rows) return;
      m._yokoFor = m.rows;
      const H2 = m.rows.length, W2 = m.rows[0].length, solid = ch => DW.SOLID.has(ch);
      const occ = new Set(); for (const o of m.objects || []) if (!o.walk) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y);
      const near = (x, y) => [...(m.warps || [])].some(w => Math.abs(w.x - x) < 8 && Math.abs(w.y - y) < 8);
      // (seulement là où l'on peut aller : les cases reliées aux sorties de la carte ; sinon le tronc pouvait tomber
      //  dans une clairière fermée par les arbres, impossible à atteindre)
      const libre = (x, y) => m.rows[y] && m.rows[y][x] !== undefined && !solid(m.rows[y][x]) && !occ.has(x + ',' + y);
      const vu = new Set(), file = [];
      for (const w of m.warps || []) for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) if (libre(x, y) && !vu.has(x + ',' + y)) { vu.add(x + ',' + y); file.push([x, y]); }
      while (file.length) {
        const [x, y] = file.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!vu.has(k) && libre(nx, ny)) { vu.add(k); file.push([nx, ny]); } }
      }
      let best = null, bs = 2;
      for (let y = 4; y < H2 - 4; y++) for (let x = 4; x < W2 - 4; x++) {
        if (!solid(m.rows[y - 1][x]) || solid(m.rows[y][x]) || occ.has(x + ',' + y) || near(x, y)) continue;
        if (solid(m.rows[y + 1][x]) || solid(m.rows[y + 2][x]) || occ.has(x + ',' + (y + 1)) || !vu.has(x + ',' + (y + 1))) continue;
        const sc = Hh(x, y, 4242); if (sc < bs) { bs = sc; best = [x, y]; }
      }
      if (!best) return;
      const [x, y] = best;
      m.objects.push({ kind: 'hollowlog', v: 0, x, y, w: 1, h: 1, small: true, yoko: true });
      m.signs = m.signs || {};
      m.signs[`${x},${y}`] = async ow => {
        if ((await DW.ask(st().flags.yokoQuest ? 'Le tronc creux qui mène au village des Poyomon. Se faufiler dedans ?' : "Un tronc creux couché contre les arbres... On entend des petites voix de l'autre côté. Se faufiler dedans ?")) !== 0) return;
        DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4);
        MAPS.village_yokomon.warps[0].tx = x; MAPS.village_yokomon.warps[0].ty = y + 1;
        await ow.charger('village_yokomon', 17, H - 2, 'up'); await DW.fade(0, 0.4);
      };
      // un petit panneau à côté du tronc (sinon on passait devant sans le voir)
      for (const sx of [x + 1, x - 1, x + 2, x - 2]) {
        const ch = m.rows[y][sx];
        if (!ch || solid(ch) || occ.has(sx + ',' + y) || solid(m.rows[y + 1][sx])) continue;
        DW.MapKit.changerLignes(m, m.rows.map((r, yy) => (yy === y ? r.slice(0, sx) + 'S' + r.slice(sx + 1) : r)));
        m.signs[`${sx},${y}`] = '« VILLAGE DES POYOMON » — une flèche gravée montre le tronc creux juste à côté. Parle au tronc pour t\'y faufiler.';
        break;
      }
      m._yokoFor = m.rows;
      if (m.gfx) DW.World.unprepare(m);
    },
  };
})();
;

// ===== js/maps/souterrain.js
'use strict';
// =====================================================================
//  LE SOUTERRAIN DE JIJIMON — un passage secret entre la maison de Jijimon et le Village des Poyomon
//  Une fois le puits des Poyomon remis en eau, l'eau découvre une échelle de fer au fond du puits :
//  elle descend dans un vieux tunnel éclairé (aucun Digimon sauvage), qui remonte par une trappe
//  dans la maison de Jijimon. Un raccourci sûr pour aller au nord de la forêt.
//  Au village, la mare devient une source chaude : un bain par jour (soins, fatigue, bonheur).
// =====================================================================
(function () {
  const { say, st } = DW.MapKit;
  const MAPS = DW.MAPS;
  const Hh = (x, y, s) => DW.Art.hash(x, y, s);
  const TRAP = [14, 8];   // la trappe, dans la maison de Jijimon (case libre à toutes les étapes de rénovation : ni caisse, ni lampe)
  const WELL = [17, 11];  // le puits, au Village des Poyomon

  // ------------------------------------------------------------ objets : trappe en bois, vapeur de la source chaude
  Object.assign(DW.World.OBJ, {
    trapdoor: { w: 16, h: 16, n: 1, draw(d) {
      d.rect(1, 2, 14, 13, '#6a4424', { round: 0.1 });
      for (const x of [2, 6, 10]) d.deco.rect(x + 0.5, 3, 3.4, 11, '#8a5a30');
      d.deco.rect(1, 5, 14, 1.4, '#3a2a1a'); d.deco.rect(1, 11, 14, 1.4, '#3a2a1a');
      d.deco.circ(12, 8.5, 1.3, '#c8b070', { unlit: true });
    } },
  });

  // ------------------------------------------------------------ le tunnel
  const W = 46, H = 10;
  const rows = [];
  for (let y = 0; y < H; y++) {
    let r = '';
    for (let x = 0; x < W; x++) {
      // couloir de 3 à 4 cases de haut, qui ondule un peu
      const top = 3, bot = 6 + (Math.sin(x * 0.35) > 0.4 ? 1 : 0) - (Hh(x, 1, 31) < 0.12 && x > 6 && x < W - 6 ? 1 : 0);
      r += x > 0 && x < W - 1 && y >= top && y <= bot ? '.' : '#';
    }
    rows.push(r);
  }
  const objects = [
    { kind: 'stairsup', x: 2, y: 1, w: 2, h: 2, back: true },
    { kind: 'stairsup', x: W - 4, y: 1, w: 2, h: 2, back: true },
  ];
  for (let x = 8; x < W - 6; x += 9) objects.push({ kind: 'torch', x, y: 3, w: 1, h: 1, small: true });
  for (const [x, y] of [[12, 6], [21, 6], [30, 6], [38, 6]]) objects.push({ kind: 'glowshroom', x, y, w: 1, h: 1, small: true });
  MAPS.souterrain_jiji = {
    name: 'Souterrain de Jijimon', music: 'temple', bg: 'foret', ambient: 'forest', theme: 'cave', climate: 'forest', region: 'foret', indoor: true,
    dark: { d: 0.5, col: '#141018' }, rows, objects, npcs: [], encounters: [], wildN: 0, rate: 0, calm: true, dress: false, secretEntry: true,   // (on y entre par la trappe ou le puits : pas de passage normal)
    signs: {
      '6,3': "Des initiales gravées dans la roche : « J. — l'an 1 ». Jijimon a creusé ce tunnel il y a bien longtemps...",
    },
    warps: [],
    doors: [
      { x: 2, y: 2, w: 2, dir: 'up', to: 'maison', tx: TRAP[0], ty: TRAP[1] + 1 },
      { x: W - 4, y: 2, w: 2, dir: 'up', to: 'village_yokomon', tx: WELL[0] + 1, ty: WELL[1] + 1 },
    ],
    onEnter: async () => {
      const f = st().flags;
      if (f.jijiTunnel) return;
      f.jijiTunnel = true;
      await say("Un long tunnel creusé dans la roche, éclairé par de vieilles torches. Aucun Digimon sauvage ne rôde ici : c'est un passage sûr.");
      await say('Une échelle remonte à chaque bout : vers le puits des Poyomon... et de l\'autre côté, vers la Ville des Fichiers ?');
    },
  };
  // en arrivant chez Jijimon par la trappe, la première fois : il est tout surpris
  const maisonEnter = MAPS.maison.onEnter;
  MAPS.maison.onEnter = async ow => {
    if (maisonEnter) await maisonEnter(ow);
    const f = st().flags;
    if (!f.jijiTunnel || f.jijiTrap) return;
    if (!(ow.p.x === TRAP[0] && ow.p.y === TRAP[1] + 1)) return;
    f.jijiTrap = true;
    DW.Audio.sfx('swoosh');
    await say('Hohoho ?! Ma vieille trappe s\'est ouverte toute seule... Ah, c\'est toi !', 'Jijimon');
    await say("J'avais complètement oublié ce souterrain ! Je l'ai creusé quand j'étais jeune, pour rendre visite aux Poyomon sans traverser la forêt.", 'Jijimon');
    await say("Garde-le pour toi : c'est le chemin le plus court et le plus sûr vers le nord de la forêt. La trappe restera ouverte, maintenant !", 'Jijimon');
    await DW.fade(1, 0.3);
    ow.load('maison', ow.p.x, ow.p.y, 'up');   // (la trappe apparaît dans la pièce)
    await DW.fade(0, 0.3);
    ow.banner.t = 99;
    DW.autosave();
  };
  // la trappe dans la maison de Jijimon (après le premier passage)
  const build0 = MAPS.maison.build;
  MAPS.maison.build = function () {
    build0.apply(this, arguments);
    // (la lampe sur pied près de la trappe gênait le passage : on l'enlève)
    if (this.objects.some(o => o.kind === 'floorlamp')) { this.objects = this.objects.filter(o => o.kind !== 'floorlamp'); if (this.gfx) DW.World.unprepare(this); }
    const show = !!st().flags.jijiTrap, has = this.objects.some(o => o.kind === 'trapdoor');
    if (show && !has) {
      this.objects.push({ kind: 'trapdoor', x: TRAP[0], y: TRAP[1], w: 1, h: 1, walk: true });
      this.signs[`${TRAP[0]},${TRAP[1]}`] = async ow => {
        if ((await DW.ask("La trappe du souterrain. Descendre vers le Village des Poyomon ?")) !== 0) return;
        DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4); await ow.charger('souterrain_jiji', 2, 3, 'down'); await DW.fade(0, 0.4);
      };
      if (this.gfx) DW.World.unprepare(this);
    }
  };

  // ------------------------------------------------------------ le puits : l'échelle vers le souterrain
  const V = MAPS.village_yokomon, well0 = V.signs[`${WELL[0]},${WELL[1]}`];
  V.signs[`${WELL[0]},${WELL[1]}`] = async ow => {
    const f = st().flags;
    if (!f.yokoWell) { await well0(ow); return; }
    // le premier seau : l'eau, en remontant, découvre une échelle de fer
    if (!f.yokoTunnel) {
      await well0(ow);
      f.yokoTunnel = true;
      DW.Audio.sfx('evolve');
      await say("En te penchant, tu remarques des barreaux de fer scellés dans la pierre, juste au-dessus de l'eau. Une échelle ! Elle descend vers un passage creusé sur le côté...");
      await say("Ce puits cache un souterrain !", 'Poyomon');
      return;
    }
    const r = await DW.ask('Le puits des Poyomon.', ["Puiser de l'eau", "Descendre par l'échelle", 'Rien']);
    if (r === 0) await well0(ow);
    else if (r === 1) { DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4); await ow.charger('souterrain_jiji', W - 4, 3, 'down'); await DW.fade(0, 0.4); }
  };

  // ------------------------------------------------------------ la source chaude du village (l'ancienne mare)
  const bath = async ow => {
    const s = st(), f = s.flags;
    if (!f.yokoWell) { await say("Une petite mare tiède... L'eau est trop basse depuis que le puits est à sec."); return; }
    if (f.yokoBath === DW.Time.day()) { await say("Ton équipe a déjà pris son bain aujourd'hui. La source a besoin de se réchauffer : reviens demain !"); return; }
    if ((await DW.ask("Depuis que l'eau est revenue, la mare fume doucement : c'est une source chaude ! Prendre un bain avec ton équipe ?")) !== 0) return;
    f.yokoBath = DW.Time.day();
    DW.Audio.sfx('water'); await DW.fade(0.6, 0.4);
    s.clock += 30;
    for (const m of s.party) { m.heal(); m.tired = 0; m.germs = Math.max(0, (m.germs || 0) - 25); m.addHappy(8); }
    await DW.wait(0.8); await DW.fade(0, 0.4);
    if (DW.Companion) DW.Companion.emote(ow, 'note', 1.6);
    await say("Aaah... L'eau chaude détend tout le monde. Les Poyomon viennent barboter avec vous en chantant ! (soins complets, fatigue effacée, bonheur +8)");
  };
  for (let y = 6; y < 9; y++) for (let x = 25; x < 30; x++) if (Math.hypot((x - 27.5) / 2.4, (y - 7.5) / 1.4) < 1) V.signs[`${x},${y}`] = bath;
})();
;

// ===== js/maps/distrib.js
'use strict';
// =====================================================================
//  DISTRIBUTEURS (comme dans Digimon World 1) : des machines posées un peu partout sur l'île
//  vendent l'essentiel loin de la ville, en attendant que les boutiques ouvrent :
//   - distributeur de RAM PV, de RAM PM, de nourriture (viande, eau).
//  En ville, un distributeur complet dépanne au début : il disparaît quand Gotsumon ouvre le Bazar.
//  Une machine par carte de la liste ; sa place est choisie à la première visite, dans un endroit
//  dégagé (toutes les cases autour praticables : elle ne bloque jamais un passage), loin des sorties.
// =====================================================================
(function () {
  const MACHINES = [
    { name: 'Distributeur de RAM PV', stock: ['soin_p', 'bandage', 'remede'] },
    { name: 'Distributeur de RAM PM', stock: ['disque_pm', 'remede'] },
    { name: 'Distributeur de nourriture', stock: ['viande', 'eau_fraiche'] },
    { name: 'Distributeur de la ville', stock: ['soin_p', 'disque_pm', 'viande', 'eau_fraiche', 'bandage'] },
  ];
  // cartes équipées (peu nombreuses : un distributeur doit rester une bonne surprise) : 3 dans la forêt et sur la plage,
  // puis une région sur deux
  const BASE = ['sentier', 'plage', 'geants'];
  const list = () => BASE.concat(Object.values(DW.REGION_ENTRY || {}).filter((_, i) => i % 2 === 0));
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  function place(m, id) {
    if (m.indoor || !m.rows) return;
    if (id === 'village') {   // distributeur provisoire de la ville : jusqu'à l'ouverture du Bazar
      const has = (m.objects || []).some(o => o.kind === 'vending');
      if (DW.Town.has('gotsumon')) { if (has) { m.objects = m.objects.filter(o => o.kind !== 'vending'); for (const k in m.signs) if (m.signs[k] && m.signs[k].vending) delete m.signs[k]; if (m.gfx) DW.World.unprepare(m); } return; }
    } else if (m._distribFor === m.rows) return;
    const i = id === 'village' ? 3 : list().indexOf(id);
    // un distributeur déjà là (posé ou déplacé dans l'atelier des cartes) : il garde sa boutique, même sur une carte hors
    // de la liste (avant : celui posé au Terrain d'entraînement ne répondait pas) — là, celui de la ville
    const deja = (m.objects || []).find(o => o.kind === 'vending');
    if (deja) { m._distribFor = m.rows; brancher(m, deja.x, deja.y, MACHINES[id === 'village' || i < 0 ? 3 : i % 3]); return; }
    if (i < 0) return;
    m._distribFor = m.rows;
    const H = m.rows.length, W = m.rows[0].length, occ = new Set();
    for (const o of m.objects || []) if (!o.walk) for (let y = o.y - (o.top ? 0 : 0); y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y);
    const walk = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && !DW.SOLID.has(m.rows[y][x]) && !occ.has(x + ',' + y) && m.rows[y][x] !== '~';
    const far = new Set();
    for (const w of [...(m.warps || []), ...(m.doors || [])]) for (let y = w.y - 4; y < w.y + (w.h || 1) + 4; y++) for (let x = w.x - 4; x < w.x + (w.w || 1) + 4; x++) far.add(x + ',' + y);
    for (const n of m.npcs || []) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) far.add((n.x + dx) + ',' + (n.y + dy));
    for (const k in m.signs || {}) far.add(k);
    let best = null, bs = 2;
    for (let y = 3; y < H - 5; y++) for (let x = 3; x < W - 3; x++) {
      if (far.has(x + ',' + y) || !'.f,='.includes(m.rows[y][x]) || m.rows[y][x] === '=') continue;
      let ok = true;
      for (let dy = -1; dy <= 3 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (!walk(x + dx, y + dy)) { ok = false; break; }   // dégagé autour, et 3 rangées devant (pas de feuillage qui la cache)
      if (!ok) continue;
      // de préférence au bord d'un chemin
      let path = false;
      for (let dy = -2; dy <= 2 && !path; dy++) for (let dx = -2; dx <= 2; dx++) if ((m.rows[y + dy] || '')[x + dx] === '=') { path = true; break; }
      const s = hash(x, y, i + 7) + (path ? 0 : 1);
      if (s < bs) { bs = s; best = [x, y]; }
    }
    if (!best) return;
    const [x, y] = best, v = i % 3, T = DW.Retouches && DW.Retouches.de(id);
    if (T && (T.retraits || []).includes(`vending@${x},${y}`)) return;   // (retiré dans l'atelier des cartes)
    m.objects.push({ kind: 'vending', v, x, y, w: 1, h: 1 });
    brancher(m, x, y, MACHINES[id === 'village' ? 3 : v]);
    if (m.gfx) DW.World.unprepare(m);
  }
  // la machine répond quand on lui parle (sa boutique)
  function brancher(m, x, y, M) {
    m.signs = m.signs || {};
    if (m.signs[`${x},${y}`]) return;
    m.signs[`${x},${y}`] = Object.assign(async () => {
      DW.Audio.sfx('select');
      await DW.say(`${M.name}. Insère tes Bits !`);
      await DW.Game.push(new DW.ShopScene(M.stock));
    }, { vending: true });
  }
  // PANNEAUX bien placés : un panneau perdu dans l'herbe est déplacé au bord du chemin le plus proche
  // (case d'herbe touchant le chemin, devant dégagé), son texte le suit. Une seule fois par carte.
  const SIGN = new Set(['S', 'Z', 'Q']);
  function signs(m, id) {
    if (m.indoor || !m.rows || m._signsFor === m.rows || !m.signs) return;
    const H = m.rows.length, W = m.rows[0].length, g = m.rows.map(r => [...r]);
    // un panneau posé ou écrit dans l'atelier des cartes reste où le créateur l'a mis
    const T = DW.Retouches && DW.Retouches.de(id), fixe = new Set(T ? [...Object.keys(T.panneaux || {}), ...Object.keys(T.cases || {}).filter(k => SIGN.has(T.cases[k]))] : []);
    const at = (x, y) => (g[y] || [])[x];
    const isPath = (x, y) => at(x, y) === '=';
    const nearWarp = (x, y) => [...(m.warps || []), ...(m.doors || [])].some(w => x >= w.x - 2 && x < w.x + (w.w || 1) + 2 && y >= w.y - 2 && y < w.y + (w.h || 1) + 2);
    const occ = new Set(); for (const o of m.objects || []) if (!o.walk) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y);
    // caché : le feuillage des arbres juste devant (en dessous) le recouvre
    const TREE = new Set(['T', '#', 'Y', 't', 'p']);
    const hidden = (x, y) => { for (let dy = 1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) if (TREE.has(at(x + dx, y + dy))) return true; return false; };
    let moved = false;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (!SIGN.has(at(x, y)) || !m.signs[`${x},${y}`] || fixe.has(x + ',' + y)) continue;
      let ok = false;
      for (let dy = -2; dy <= 2 && !ok; dy++) for (let dx = -2; dx <= 2; dx++) if (isPath(x + dx, y + dy)) { ok = true; break; }
      if (ok && !hidden(x, y)) continue;   // au bord d'un chemin et bien visible : il reste là
      let best = null, bd = 1e9;
      for (let yy = Math.max(2, y - 10); yy < Math.min(H - 2, y + 11); yy++) for (let xx = Math.max(2, x - 10); xx < Math.min(W - 2, x + 11); xx++) {
        if (!'.f,'.includes(at(xx, yy)) || occ.has(xx + ',' + yy) || nearWarp(xx, yy) || m.signs[`${xx},${yy}`]) continue;
        if (!(isPath(xx + 1, yy) || isPath(xx - 1, yy) || isPath(xx, yy + 1))) continue;
        if (DW.SOLID.has(at(xx, yy + 1)) || occ.has(xx + ',' + (yy + 1)) || hidden(xx, yy)) continue;
        const d = Math.abs(xx - x) + Math.abs(yy - y);
        if (d < bd) { bd = d; best = [xx, yy]; }
      }
      if (!best) continue;
      const [nx, ny] = best, ch = at(x, y), CH = DW.World.CH, base = Object.keys(CH).find(k => CH[k].t === CH[ch].t && !CH[k].obj && !CH[k].solid && !CH[k].tall) || '.';
      g[ny][nx] = ch; g[y][x] = base;
      m.signs[`${nx},${ny}`] = m.signs[`${x},${y}`]; delete m.signs[`${x},${y}`];
      moved = true;
    }
    if (moved) { DW.MapKit.changerLignes(m, g.map(r => r.join(''))); if (m.gfx) DW.World.unprepare(m); }
    m._signsFor = m.rows;
  }
  DW.Distrib = { place, signs, MACHINES };
  // la nuit, les fenêtres des maisons s'allument (comme l'école du Terrain d'entraînement) : points de lumière
  // des bâtiments qui n'en avaient pas (tous les fichiers de dessins sont chargés à ce stade)
  { const O = DW.World.OBJ, L = { house: [[18, 40, 11], [38, 40, 11]], shack: [[26, 44, 12], [54, 44, 12]], greenhouse: [[30, 44, 14], [58, 44, 14]], kiosk: [[30, 40, 14]] };
    for (const k in L) if (O[k] && !O[k].lights) O[k].lights = L[k]; }
})();
;

// ===== js/game/activities.js
'use strict';
// =====================================================================
//  ACTIVITÉS (comme dans Digimon World 1)
//  - TOURNOIS au Colisée des Scarabées : 4 coupes (Junior, Disciple, Champion, Ultime), 3 manches,
//    une fois par jour et par coupe, chacune réservée à ses stades ; trophées, Bits et cartes à gagner.
//  - CURLING dans la Plaine des Bonshommes (Terre Gelée) : 3 lancers, viser le centre.
//  - CHASSE AU TRÉSOR dans les Rails Abandonnés (Tunnel Foreur) : 6 coups de pioche, indices chaud / froid.
//  - PÊCHE au Ponton des Pêcheurs (Lac du Tramway) : ferrer au bon moment, 3 fois par jour.
//  - CARTES DIGIMON : paquets de 3 cartes (Bazar, prix des activités), album à compléter (Menu → ALBUM).
//  Chaque activité est un panneau posé près du carrefour de sa sous-zone (map.activity).
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const say = (t, s) => DW.say(t, s);
  const day = () => Math.floor(DW.state.clock / 1440);
  const once = (key, n = 1) => { const f = DW.state.flags, k = 'act_' + key; if (!f[k] || f[k].d !== day()) f[k] = { d: day(), n: 0 }; return f[k].n < n ? f[k] : null; };
  const reward = (id, n = 1) => { const extra = DW.giveItem(id, n); Audio.sfx('buy'); return `${DW.ITEMS[id].name}${n > 1 ? ' ×' + n : ''}${DW.extraMsg(extra)}`; };

  // ------------------------------------------------------------ cartes Digimon
  const RAR = { 'Bébé': 30, 'Entraînement': 26, 'Disciple': 20, 'Champion': 12, 'Ultime': 5, 'Méga': 1.5 };
  const Cards = DW.Cards = {
    all: () => DW.DEX_ORDER.filter(sp => DW.SPECIES[sp]),
    draw() { return DW.weighted(Cards.all().map(sp => ({ sp, w: RAR[DW.SPECIES[sp].stage] || 10 }))).sp; },
    async openPack() {
      const st = DW.state; st.cards = st.cards || {};
      const got = [Cards.draw(), Cards.draw(), Cards.draw()];
      got.forEach(sp => (st.cards[sp] = (st.cards[sp] || 0) + 1));
      await Game.push(new PackScene(got));
    },
    count: () => Object.keys(DW.state.cards || {}).length,
    // ALBUM DU CHAPITRE 1 : les Digimon de la forêt et de la plage. On les obtient en paquets, mais aussi
    // par les grands moments (recrues, boss, quêtes, coffres de l'antre). Complet : Jijimon offre une récompense.
    CH1: ['botamon', 'koromon', 'agumon', 'greymon', 'yokomon', 'tanemon', 'bukamon', 'betamon', 'gotsumon', 'kunemon', 'kuwagamon', 'shellmon'],
    give(sp) { const st = DW.state; st.cards = st.cards || {}; const fresh = !st.cards[sp]; st.cards[sp] = (st.cards[sp] || 0) + 1; return fresh; },
    ch1Count: () => Cards.CH1.filter(sp => (DW.state.cards || {})[sp]).length,
  };
  function card(c, sp, x, y, w, h, owned, t, glow) {
    const d = DW.SPECIES[sp], stage = d.stage, col = { 'Bébé': '#c8d8e8', 'Entraînement': '#b8e0b0', 'Disciple': '#e8d890', 'Champion': '#f0b070', 'Ultime': '#e88ac8', 'Méga': '#ffd040' }[stage] || '#ccc';
    c.fillStyle = '#0a0e18'; c.fillRect(x + 1, y + 1, w, h);
    c.fillStyle = owned ? col : '#2a3040'; c.fillRect(x, y, w, h);
    c.fillStyle = owned ? '#10203a' : '#1a1e28'; c.fillRect(x + 2, y + 2, w - 4, h - 12);
    if (glow) { c.fillStyle = `rgba(255,255,255,${0.15 + 0.1 * Math.sin(t * 6)})`; c.fillRect(x + 2, y + 2, w - 4, h - 12); }
    const spr = DW.Sprites.battle(sp), k = Math.min((w - 6) / spr.w, (h - 16) / spr.h, 1);
    DW.Sprites.draw(c, spr, x + w / 2, y + h - 12, { scale: k, silhouette: !owned, frame: 0 });
    UI.text(c, owned ? d.name : '???', x + w / 2, y + h - 3, { size: 6, align: 'center', color: '#1a1a2a', shadow: false });
  }
  class PackScene extends DW.Scene {
    constructor(list) { super(); this.list = list; this.flip = { v: 0 }; }
    enter() { Audio.sfx('evolve'); DW.tween(this.flip, { v: 3 }, 1.6, DW.linear); }
    update() { if (this.flip.v >= 3 && Input.hit('ok')) this.close(); }
    draw(c) {
      UI.menuBg(c, this.t, 'PAQUET DE CARTES');
      this.list.forEach((sp, i) => {
        const x = 34 + i * 88, y = 50, shown = this.flip.v > i + 0.5;
        if (shown) card(c, sp, x, y, 76, 104, true, this.t, true);
        else { c.fillStyle = '#3a6ad8'; c.fillRect(x, y, 76, 104); c.fillStyle = '#f0c030'; c.fillRect(x + 8, y + 8, 60, 88); c.fillStyle = '#3a6ad8'; UI.text(c, 'DIGIMON', x + 38, y + 56, { size: 10, align: 'center', color: '#3a6ad8', shadow: false }); }
      });
      UI.box(c, 14, 174, 292, 50);
      UI.text(c, this.flip.v >= 3 ? `Tu obtiens 3 cartes ! Album : ${Cards.count()} / ${Cards.all().length}` : 'On ouvre le paquet...', 24, 194, { size: 10 });
      if (this.flip.v >= 3) UI.text(c, 'ESPACE', 296, 216, { size: 7, align: 'right', color: '#9ab0e8' });
    }
  }
  class AlbumScene extends DW.Scene {
    constructor() { super(); this.i = 0; this.page = 0; }
    get list() { return Cards.all(); }
    update() {
      const n = this.list.length;
      if (Input.hit('left')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('right')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('up')) { this.i = Math.max(0, this.i - 6); Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = Math.min(n - 1, this.i + 6); Audio.sfx('move'); }
      if (Input.hit('back') || Input.hit('ok')) { Audio.sfx('back'); this.close(); }
    }
    draw(c) {
      const st = DW.state, cards = st.cards || {}, L = this.list, page = Math.floor(this.i / 12);
      UI.menuBg(c, this.t, 'ALBUM DE CARTES');
      UI.text(c, `${Cards.count()} / ${L.length}`, W - 12, 17, { size: 9, align: 'right', color: '#ffe070' });
      L.slice(page * 12, page * 12 + 12).forEach((sp, j) => {
        const x = 12 + (j % 6) * 50, y = 28 + Math.floor(j / 6) * 72, idx = page * 12 + j;
        card(c, sp, x, y, 46, 66, !!cards[sp], this.t, idx === this.i);
        if (idx === this.i) { c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.strokeRect(x - 1, y - 1, 48, 68); }
        if (cards[sp] > 1) UI.text(c, `×${cards[sp]}`, x + 44, y + 9, { size: 6, align: 'right', color: '#ffe070' });
      });
      const sp = L[this.i], d = DW.SPECIES[sp], own = !!cards[sp];
      UI.box(c, 6, 176, W - 12, 58);
      UI.text(c, own ? `${d.name} — ${d.stage}` : '??? (carte manquante)', 14, 192, { size: 9, color: '#ffe070' });
      UI.wrap(c, own ? d.desc : 'Gagne des paquets de cartes (Bazar de Gotsumon, tournois, curling, chasse au trésor) pour la trouver.', 290, 8).slice(0, 3).forEach((l, j) => UI.text(c, l, 14, 205 + j * 10, { size: 8, color: '#c8f0ff' }));
      UI.text(c, `Page ${page + 1} / ${Math.ceil(L.length / 12)}`, W - 12, 231, { size: 6, align: 'right', color: '#7a8ab8', shadow: false });
    }
  }
  DW.AlbumScene = AlbumScene;

  // ------------------------------------------------------------ tournois
  const CUPS = [
    { name: 'Coupe Junior', stages: ['Bébé', 'Entraînement'], lv: [4, 6, 8], prize: 150 },
    { name: 'Coupe Disciple', stages: ['Disciple'], lv: [10, 13, 16], prize: 400 },
    { name: 'Coupe Champion', stages: ['Champion'], lv: [20, 24, 28], prize: 1000 },
    { name: 'Coupe Ultime', stages: ['Ultime'], lv: [34, 38, 42], prize: 2500 },
  ];
  const ORDER = ['Bébé', 'Entraînement', 'Disciple', 'Champion', 'Ultime', 'Méga'];
  // (chaque coupe est réservée à ses stades : un Champion ne gagne plus la Coupe Junior tous les jours)
  const PLURIEL = { 'Bébé': 'Bébés', 'Entraînement': 'Digimon du stade Entraînement', 'Disciple': 'Disciples', 'Champion': 'Champions', 'Ultime': 'Ultimes' };
  const reservee = cup => cup.stages.map((s, i) => (i ? 'aux ' : '') + PLURIEL[s]).join(' et ');
  // 1re victoire dans une coupe : un équipement en prime (data/equipements.js)
  const CUP_GEAR = { 'Coupe Junior': 'bandeau', 'Coupe Disciple': 'crocs_acier', 'Coupe Champion': 'armure_digitale', 'Coupe Ultime': 'pendentif' };
  async function tournament(place = 'au Colisée des Scarabées') {
    const st = DW.state, m = st.party[0];
    await say(`Bienvenue ${typeof place === 'string' ? place : 'au Colisée des Scarabées'} ! Ici se tiennent les grands tournois de l'île. Trois combats d'affilée, sans fuite possible !`);
    if (!m) { await say("Il te faut un partenaire Digimon pour t'inscrire !"); return; }
    const maxStage = Math.max(...st.party.map(p => ORDER.indexOf(p.d.stage)));
    const names = CUPS.map(cu => `${cu.name}${(st.flags.cups || {})[cu.name] ? ' ★' : ''}`).concat(['Annuler']);
    const r = await DW.choose(names, { y: 30 });
    if (r < 0 || r >= CUPS.length) return;
    const cup = CUPS[r];
    if (ORDER.indexOf(cup.stages[0]) > maxStage) { await say(`Ton équipe n'est pas encore assez évoluée pour la ${cup.name}.`); return; }
    // (toute l'équipe peut entrer dans l'arène, en cours de combat : aucun de ses Digimon ne doit dépasser les stades de la coupe)
    const top = ORDER.indexOf(cup.stages[cup.stages.length - 1]), trop = st.party.filter(p => ORDER.indexOf(p.d.stage) > top);
    if (trop.length) {
      const qui = trop.map(p => `${p.name} (${p.d.stage})`), liste = qui.length > 1 ? qui.slice(0, -1).join(', ') + ' et ' + qui[qui.length - 1] : qui[0];
      const conseil = !DW.Town.has('yokomon') ? '' : trop.length < st.party.length ? ` Laisse-${trop.length > 1 ? 'les' : 'le'} se reposer à la DigiFerme (Jardin de Yokomon) pour t'inscrire avec les autres.` : ' Reviens avec un Digimon moins évolué : il en attend peut-être un à la DigiFerme (Jardin de Yokomon).';
      await say(`La ${cup.name} est réservée aux ${reservee(cup)} : ${liste} ${trop.length > 1 ? 'sont trop évolués' : 'est trop évolué'} pour y combattre.${conseil}`);
      return;
    }
    if (!once('cup_' + r)) { await say(`La ${cup.name} a déjà eu lieu aujourd'hui. Reviens demain !`); return; }
    once('cup_' + r).n++;
    const pool = Object.keys(DW.SPECIES).filter(sp => cup.stages.includes(DW.SPECIES[sp].stage) && !DW.SPECIES[sp].npc);
    for (let i = 0; i < 3; i++) {
      const enemy = new DW.Digimon(DW.pick(pool), cup.lv[i]);
      const res = await DW.ow.battle({ enemy, boss: true, canLose: true, music: 'battle', intro: `${cup.name} — manche ${i + 1} / 3 : ${enemy.name} entre dans l'arène !` });
      if (res !== 'win') { await say(`Éliminé à la manche ${i + 1}... Entraîne-toi et reviens tenter ta chance !`); st.party.forEach(p => { if (p.hp <= 0) p.hp = 1; }); return; }
      if (i < 2) await say(`Victoire ! Manche ${i + 2} : tiens-toi prêt !`);
    }
    Audio.sfx('fanfare');
    st.flags.cups = st.flags.cups || {}; const first = !st.flags.cups[cup.name]; st.flags.cups[cup.name] = true;
    st.bits += cup.prize;
    await say(`Tu remportes la ${cup.name} ! ${first ? 'Un trophée rejoint ta collection ! ' : ''}Prix : ${cup.prize} Bits et ${reward('cartes', first ? 3 : 1)} !`);
    if (first && CUP_GEAR[cup.name] && DW.ITEMS[CUP_GEAR[cup.name]]) await say(`Pour ta première victoire, l'organisateur t'offre aussi : ${reward(CUP_GEAR[cup.name])} ! (un équipement : donne-le à un Digimon depuis le sac)`);
    st.party.forEach(p => p.addHappy(5));
  }

  // ------------------------------------------------------------ curling
  class CurlingScene extends DW.Scene {
    constructor() { super(); this.throws = []; this.phase = 'aim'; this.pw = 0; this.dir = 1; this.stone = null; this.score = 0; }
    update(dt) {
      if (this.phase === 'aim') {
        this.pw += this.dir * dt * 1.4; if (this.pw > 1) { this.pw = 1; this.dir = -1; } if (this.pw < 0) { this.pw = 0; this.dir = 1; }
        if (Input.hit('ok')) { this.stone = { x: 160, y: 214, v: 140 + this.pw * 230, drift: (Math.random() - 0.5) * 18 }; this.phase = 'slide'; Audio.sfx('swoosh'); }
      } else if (this.phase === 'slide') {
        const s = this.stone; s.y -= s.v * dt; s.x += s.drift * dt; s.v = Math.max(0, s.v - 243 * dt); // freinage réglé : la zone verte de la jauge mène au centre
        if (s.v <= 0 || s.y < 6) {
          const d = Math.hypot(s.x - 160, s.y - 46), pts = s.y < 6 ? 0 : d < 8 ? 10 : d < 18 ? 6 : d < 30 ? 3 : d < 42 ? 1 : 0;
          this.throws.push({ x: s.x, y: s.y, pts }); this.score += pts; Audio.sfx(pts >= 6 ? 'levelup' : pts ? 'select' : 'bump');
          this.stone = null; this.phase = this.throws.length >= 3 ? 'done' : 'aim';
        }
      } else if (Input.hit('ok')) this.close(this.score);
    }
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d8eefc'); g.addColorStop(1, '#f4fbff');
      c.fillStyle = '#5a7a9a'; c.fillRect(0, 0, W, H);
      c.fillStyle = g; c.fillRect(110, 0, 100, H);
      for (const [r, col] of [[42, '#3a6ad8'], [30, '#ffffff'], [18, '#d83a3a'], [8, '#ffffff']]) { c.fillStyle = col; c.beginPath(); c.ellipse(160, 46, r, r * 0.9, 0, 0, 7); c.fill(); }
      c.strokeStyle = 'rgba(120,160,200,0.4)'; for (let y = 0; y < H; y += 12) { c.beginPath(); c.moveTo(112, y); c.lineTo(208, y + 4); c.stroke(); }
      const stone = (x, y, col) => { c.fillStyle = '#2a2a34'; c.beginPath(); c.ellipse(x, y + 1, 6, 4.4, 0, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x, y - 1, 5.4, 4, 0, 0, 7); c.fill(); c.fillStyle = '#f0f0f0'; c.fillRect(x - 1, y - 4, 2, 3); };
      this.throws.forEach(t => stone(t.x, t.y, '#e0c040'));
      if (this.stone) stone(this.stone.x, this.stone.y, '#e0c040'); else if (this.phase === 'aim') stone(160, 214, '#e0c040');
      UI.box(c, 4, 4, 100, 40); UI.text(c, 'CURLING', 54, 18, { size: 9, align: 'center', color: '#ffe070' }); UI.text(c, `Score : ${this.score}`, 54, 34, { size: 9, align: 'center' });
      UI.box(c, 216, 4, 100, 40); UI.text(c, `Lancer ${Math.min(3, this.throws.length + 1)} / 3`, 266, 18, { size: 8, align: 'center' }); UI.text(c, 'Centre = 10 pts', 266, 32, { size: 7, align: 'center', color: '#8ae0f0' });
      if (this.phase === 'aim') {
        UI.box(c, 216, 170, 100, 60); UI.text(c, 'PUISSANCE', 266, 184, { size: 7, align: 'center', color: '#8ae0f0' });
        c.fillStyle = '#10141e'; c.fillRect(226, 192, 80, 10); c.fillStyle = this.pw > 0.55 && this.pw < 0.72 ? '#5aff8a' : '#ffd040'; c.fillRect(226, 192, 80 * this.pw, 10);
        c.strokeStyle = '#5aff8a'; c.strokeRect(226 + 80 * 0.55, 191, 80 * 0.17, 12);
        UI.text(c, 'ESPACE : lancer', 266, 222, { size: 7, align: 'center' });
      }
      if (this.phase === 'done') { UI.box(c, 60, 96, 200, 48); UI.text(c, `Total : ${this.score} points !`, 160, 116, { size: 11, align: 'center', color: '#ffe070' }); UI.text(c, 'ESPACE', 160, 134, { size: 7, align: 'center' }); }
    }
  }
  async function curling() {
    await say("Bienvenue au curling de la Terre Gelée ! Fais glisser la pierre jusqu'au centre de la cible. Trois lancers !");
    if (!once('curling')) { await say("La piste doit regeler... Reviens demain !"); return; }
    once('curling').n++;
    const s = await Game.push(new CurlingScene());
    const prize = s >= 24 ? reward('cartes', 2) : s >= 14 ? reward('super_viande') : s >= 6 ? reward('viande', 2) : null;
    await say(prize ? `${s} points ! Bravo, tu gagnes : ${prize} !` : `${s} points... La glace est traîtresse. Retente ta chance demain !`);
  }

  // ------------------------------------------------------------ chasse au trésor
  class DigScene extends DW.Scene {
    constructor() {
      super(); this.cols = 6; this.rows = 4; this.cur = 0; this.left = 6; this.found = []; this.dug = {};
      const cells = [...Array(24).keys()].sort(() => Math.random() - 0.5);
      this.tre = cells.slice(0, 3).map((k, i) => ({ k, id: [DW.pick(['gland_or', 'cartes', 'puce_pv']), DW.pick(['reveil', 'soin_m', 'pm_m']), DW.pick(['super_viande', 'digipomme', 'pomme_bleue'])][i] }));
      this.msg = 'Choisis où creuser ! (6 coups de pioche)';
    }
    update() {
      if (this.left <= 0 || this.found.length === 3) { if (Input.hit('ok')) this.close(this.found); return; }
      const c = this.cols;
      if (Input.hit('left')) this.cur = (this.cur + 23) % 24; if (Input.hit('right')) this.cur = (this.cur + 1) % 24;
      if (Input.hit('up')) this.cur = (this.cur + 24 - c) % 24; if (Input.hit('down')) this.cur = (this.cur + c) % 24;
      if (Input.hit('ok') && !this.dug[this.cur]) {
        this.dug[this.cur] = true; this.left--; Audio.sfx('hit');
        const t = this.tre.find(t => t.k === this.cur && !t.got);
        if (t) { t.got = true; this.found.push(t.id); this.msg = `Trésor ! ${DW.ITEMS[t.id].name} !`; Audio.sfx('buy'); }
        else {
          const x = this.cur % c, y = Math.floor(this.cur / c);
          const d = Math.min(...this.tre.filter(t => !t.got).map(t => Math.abs(t.k % c - x) + Math.abs(Math.floor(t.k / c) - y)));
          this.msg = d <= 1 ? 'Brûlant ! Un trésor est tout près !' : d <= 2 ? 'Chaud...' : d <= 3 ? 'Tiède.' : 'Froid. Rien par ici.';
        }
        if (this.left <= 0 || this.found.length === 3) this.msg += '  (ESPACE)';
      }
    }
    draw(c) {
      c.fillStyle = '#1e1814'; c.fillRect(0, 0, W, H);
      UI.box(c, 4, 4, W - 8, 22); UI.text(c, `CHASSE AU TRÉSOR — Coups restants : ${this.left}   Trouvés : ${this.found.length} / 3`, 12, 18, { size: 8 });
      for (let k = 0; k < 24; k++) {
        const x = 40 + (k % this.cols) * 40, y = 34 + Math.floor(k / this.cols) * 36, dug = this.dug[k];
        c.fillStyle = dug ? '#3a2a20' : ['#6a5a4a', '#7a6a58', '#5e5040'][k % 3]; c.fillRect(x, y, 36, 32);
        c.fillStyle = 'rgba(255,255,255,0.12)'; if (!dug) c.fillRect(x + 3, y + 3, 14, 4);
        const t = this.tre.find(t => t.k === k && t.got);
        if (t) c.drawImage(DW.Icons.item(t.id), x + 10, y + 8, 16, 16);
        else if (dug) { c.fillStyle = '#120c08'; c.beginPath(); c.ellipse(x + 18, y + 18, 9, 6, 0, 0, 7); c.fill(); }
        if (k === this.cur) { c.strokeStyle = '#ffe070'; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, 38, 34); }
      }
      UI.box(c, 6, 186, W - 12, 46); UI.text(c, this.msg, 16, 210, { size: 10, color: '#ffe070' });
    }
  }
  async function treasure() {
    await say("Un vieux panneau : « Galerie de la chasse au trésor. Creusez, et vous trouverez ! » Des outils de mineur traînent ici.");
    if (!once('dig')) { await say("Tu as déjà fouillé la galerie aujourd'hui. La roche doit se reposer !"); return; }
    once('dig').n++;
    const got = await Game.push(new DigScene());
    for (const id of got) DW.giveItem(id, 1);
    await say(got.length ? `Tu ramènes : ${got.map(id => DW.ITEMS[id].name).join(', ')} !` : "Rien du tout... Les trésors sont bien cachés !");
  }

  // ------------------------------------------------------------ pêche
  class FishScene extends DW.Scene {
    constructor() { super(); this.wait = 1.2 + Math.random() * 2.8; this.bite = 0; this.res = null; }
    update(dt) {
      if (this.res) { if (Input.hit('ok')) this.close(this.res); return; }
      if (this.bite > 0) { this.bite -= dt; if (Input.hit('ok')) { this.res = 'catch'; Audio.sfx('buy'); } else if (this.bite <= 0) { this.res = 'miss'; Audio.sfx('back'); } return; }
      if (Input.hit('ok')) { this.res = 'early'; Audio.sfx('bump'); return; }
      this.wait -= dt; if (this.wait <= 0) { this.bite = 0.55; Audio.sfx('select'); }
    }
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5ab0e0'); g.addColorStop(1, '#1a4a8a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect((i * 37 + this.t * 10) % W, 40 + (i * 23) % 150, 10, 1); }
      const bob = this.bite > 0 ? Math.sin(this.t * 40) * 4 : Math.sin(this.t * 2) * 1.5;
      c.strokeStyle = '#2a2a2a'; c.beginPath(); c.moveTo(40, 0); c.quadraticCurveTo(120, 40, 160, 120 + bob); c.stroke();
      c.fillStyle = '#e04a3a'; c.beginPath(); c.arc(160, 120 + bob, 4, Math.PI, 0); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(160, 120 + bob, 4, 0, Math.PI); c.fill();
      if (this.bite > 0) UI.text(c, '!', 172, 108, { size: 18, color: '#ffe040', bold: true });
      UI.box(c, 6, 190, W - 12, 42);
      const t = this.res === 'catch' ? 'Ferré ! Quelque chose a mordu !' : this.res === 'miss' ? 'Trop tard... Le poisson s\'est enfui.' : this.res === 'early' ? 'Trop tôt ! Tu as fait fuir les poissons.' : 'Attends que ça morde... puis ESPACE !';
      UI.text(c, t, 16, 214, { size: 10, color: this.res === 'catch' ? '#ffe070' : '#ffffff' });
    }
  }
  async function fishing() {
    await say('Un ponton de pêche. Une vieille canne est posée là, prête à servir.');
    if (!once('fish', 3)) { await say('Les poissons ne mordent plus pour aujourd\'hui. Reviens demain !'); return; }
    once('fish', 3).n++;
    const r = await Game.push(new FishScene());
    if (r !== 'catch') return;
    const x = Math.random();
    const prize = x < 0.02 ? reward('digibar') : x < 0.06 ? reward('truite_noire') : x < 0.12 ? reward('digisilure') : x < 0.3 ? reward('digitruite') : x < 0.6 ? reward('digivivaneau') : reward('digianchois', 2);
    await say(`Tu remontes : ${prize} !`);
  }

  // ------------------------------------------------------------ installation dans les sous-zones
  DW.Tournament = tournament;   // (aussi au Dojo de la ville : maps/interieurs.js)
  const ACT = { scarabees9: { run: tournament, name: 'tournoi' }, gel3: { run: curling, name: 'curling' }, tunnel2: { run: treasure, name: 'trésor' }, lac3: { run: fishing, name: 'pêche' } };
  for (const id in ACT) if (DW.MAPS[id]) DW.MAPS[id].activity = ACT[id];
  DW.Activities = { tournament, curling, treasure, fishing, scenes: { PackScene, CurlingScene, DigScene, FishScene } };
})();
;

// ===== js/game/peche.js
'use strict';
// =====================================================================
//  PÊCHE À LA CANNE (cadeau de Gomamon, maps/champs.js)
//  Face à l'eau (game/paysage.js), « Pêcher » : un lancer toutes les 30 minutes de jeu.
//  Chaque eau a ses poissons (mer, rivière, lac) ; les gros sortent la nuit et au petit matin.
//  Parfois, c'est un Digimon aquatique qui mord... et il n'est pas content !
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const COOL = 30;   // minutes de jeu entre deux lancers
  // poids des prises : [objet, poids, poids la nuit / au petit matin]
  const CATCH = {
    mer: [['digianchois', 40, 30], ['digivivaneau', 30, 30], ['digisilure', 4, 10], ['digibar', 1, 3]],
    riviere: [['digianchois', 30, 20], ['digitruite', 25, 25], ['digivivaneau', 18, 15], ['truite_noire', 4, 10], ['digisilure', 3, 6]],
    lac: [['digitruite', 30, 25], ['digivivaneau', 25, 20], ['digisilure', 8, 14], ['truite_noire', 6, 12], ['digibar', 1, 4]],
  };
  const BITERS = { mer: ['bukamon', 'gomamon', 'shellmon'], riviere: ['betamon', 'gomamon'], lac: ['betamon', 'gomamon', 'gekomon'] };
  const LAKES = new Set(['lac', 'marais', 'gel']);
  // le boss du chapitre 1 (Shellmon) et Gomamon (partenaire de Joe, encore un bébé au début de l'île) ne mordent qu'à partir
  // du chapitre 2 ; niveau d'un Digimon qui mord : celui des Digimon sauvages du coin (écart par stade comme game/wild.js)
  const DES_CH = { shellmon: 2, gomamon: 2 };
  const ECART = { 'Bébé': -4, 'Entraînement': -2, Disciple: 0, Champion: 2 };
  function niveau(map, sp) {
    const E = map.encounters || [], e = E.find(x => x.sp === sp), ec = x => ECART[DW.SPECIES[x].stage] || 0;
    if (e) return DW.rand(e.min, e.max);
    const ref = E.length ? E.reduce((a, x) => a + (x.min + x.max) / 2 - ec(x.sp), 0) / E.length
      : DW.Wild.TABLES[map.region] ? DW.Wild.TABLES[map.region][0] : ((DW.Care && DW.Care.lead()) || { level: 7 }).level - 1;
    return Math.max(3, Math.round(ref) + ec(sp) + DW.rand(-1, 1));
  }

  DW.Peche = {
    has: () => (st().bag || {}).canne > 0,
    kindAt(ow) {
      const m = ow.map, P = ow.p, [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[P.dir] || [0, 0];
      const sel = DW.Paysage && DW.Paysage.salee(m, P.x + dx, P.y + dy);   // (la mer : là où l'eau est salée)
      return sel === true ? 'mer' : LAKES.has(m.region) || sel === 'trouble' ? 'lac' : 'riviere';
    },
    async cast(ow, kind) {
      const s = st(), last = s.flags.rod;
      if (last != null && s.clock - last < COOL && s.clock >= last) { await say(`Les poissons se méfient... Attends encore ${Math.ceil(COOL - (s.clock - last))} minutes avant de relancer.`); return; }
      s.flags.rod = s.clock;
      DW.Audio.sfx('water');
      const r = await DW.Game.push(new DW.Activities.scenes.FishScene());
      s.clock += 10;
      if (r === 'early') { await say('Trop tôt ! Le bouchon a fait fuir les poissons.'); return; }
      if (r !== 'catch') { await say('Le poisson a filé avec l\'appât...'); return; }
      // un Digimon aquatique au bout de la ligne
      const ch = s.flags.chapter || 1, bit = (BITERS[kind] || []).filter(sp => DW.SPECIES[sp] && ch >= (DES_CH[sp] || 1));
      if (bit.length && Math.random() < 0.1) {
        const sp = DW.pick(bit);
        ow.shake = 0.5; DW.Audio.sfx('roar');
        await say(`Ça tire très fort... SPLASH ! Un ${DW.SPECIES[sp].name} jaillit de l'eau, furieux d'avoir été hameçonné !`);
        await ow.battle({ enemy: new DW.Digimon(sp, niveau(ow.map, sp)) });
        return;
      }
      const h = DW.Time.hour(), big = h >= 20 || h < 7;
      const T = CATCH[kind] || CATCH.riviere, tot = T.reduce((a, x) => a + x[big ? 2 : 1], 0);
      let k = Math.random() * tot, id = T[0][0];
      for (const x of T) { k -= x[big ? 2 : 1]; if (k <= 0) { id = x[0]; break; } }
      const extra = DW.giveItem(id, 1); DW.Audio.sfx('buy');
      await say(`Tu remontes : ${DW.ITEMS[id].name} !${DW.extraMsg(extra)}`);
      const pt = ow.partner;
      if (pt && Math.random() < 0.3) { pt.addHappy(1); await say(`${pt.name} applaudit ta prise ! (bonheur +1)`); }
    },
  };
})();
;

// ===== js/game/services.js
'use strict';
// =====================================================================
//  SERVICES DES RECRUES EN VILLE
//  Chaque Digimon libéré d'un Engrenage Noir s'installe en ville (game/story.js) et y rend un service :
//  clinique, boutiques, restaurant, cadeaux du jour, combats d'entraînement, rumeurs, vol...
//  - TOWN : où il habite et ce qu'il fait quand on lui parle
//  - DISTRICT_HOME : les recrues qui déménagent dans un quartier périphérique une fois celui-ci construit
//  - KIOSK / placeKiosks : son stand (auvent, pictogramme, enseigne), posé à la construction de la carte
// =====================================================================
(function () {
  const { say } = DW.MapKit;
  const st = () => DW.state;
  const hour = () => DW.Time.hour();
  const day = () => DW.Time.day();
  const open = () => hour() >= 6 && hour() < 22;          // horaires des commerces
  // service une fois par jour
  const daily = k => { const s = st(), d = s.daily = s.daily || {}; if (d[k] === day()) return false; d[k] = day(); return true; };
  const Story = DW.Story;

  // ------------------------------------------------------------ stands des recrues (comme les boutiques de la Ville des Fichiers de DW1)
  // Chaque recrue qui rend un service tient un stand avec une enseigne : on voit tout de suite qui fait quoi.
  // Placés à la construction de la carte (ville, Champs, quartiers), sur un terrain libre près des chemins.
  // [pictogramme du stand, texte de l'enseigne]
  const KIOSK = {
    centarumon: [0, 'Clinique de Centarumon — Soins complets : PV, PM, maladies et blessures. Ouvert de 6 h à 22 h.'],
    andromon: [1, "Atelier d'Andromon — Puces de données : des statistiques augmentées pour toujours. Ouvert de 6 h à 22 h."],
    meramon: [2, 'Grill de Meramon — Viandes grillées au feu de Meramon, champignons, fruits et légumes. Ouvert de 6 h à 22 h.'],   // (son stock : DW.SHOPS.resto)
    frigimon: [3, 'Glacier de Frigimon — Glaces et bonbons, toute la journée.'],
    etemon: [4, "Stand d'Etemon — Paquets de cartes Digimon pour compléter ton album."],
    tentomon: [5, 'Réparations de Tentomon — Disques de combat : Attaque, Défense, Vitesse. Ouvert de 6 h à 22 h.'],   // (DW.SHOPS.disques)
    togemon: [6, "Librairie de Togemon — Manuels pour apprendre de nouvelles techniques. Ouvert de 6 h à 22 h."],
    bakemon: [7, 'Boutique de nuit de Bakemon — Ouverte de 20 h à 5 h... Hihihi.'],
    numemon: [8, "Panneau des rumeurs de Numemon — Toutes les nouvelles de l'île."],
    birdramon: [9, 'Relais de Birdramon — Vols vers les lieux que tu as déjà visités.'],
    monzaemon: [10, 'Maison des câlins de Monzaemon — Un câlin géant par jour : toute ton équipe est plus heureuse.'],
    gekomon: [11, 'Scène de Gekomon — Une berceuse par jour qui chasse la fatigue de ton équipe.'],
    piximon: [12, 'Dojo de Piximon — Un entraînement spécial par jour, sur toutes les statistiques.'],
    sukamon: [13, 'Brocante de Sukamon — Une trouvaille par jour (on ne demande pas d\'où elle vient).'],
    drimogemon: [13, 'Fouilles de Drimogemon — Une trouvaille par jour, déterrée pour toi.'],
    lillymon: [13, 'Verger de Lillymon — Des fruits frais chaque jour.'],
    shellmon: [13, 'Poissonnerie de Shellmon — Un poisson par jour.'],
    agumon: [14, "Ring d'Agumon — Un combat d'entraînement par jour, sans rien perdre."],
    ogremon: [14, "Ring d'Ogremon — Un combat d'entraînement par jour, sans rien perdre."],
    gabumon: [15, 'Bureau de Gabumon — Des conseils sur les Digivolutions de ton partenaire.'],
  };
    const placeKiosks = (m, id) => {
    m.kiosks = {};
    const who = DW.Town.RECRUITS.filter(r => r.region && KIOSK[r.id] && DW.Town.has(r.id) && homeOf(r.id) === id);
    if (!who.length) return;
    const rows = m.rows, H = rows.length, W = rows[0].length, GROUND = '.f=zvoj';
    const busy = new Set();
    const mark = (x0, y0, w, h, pad) => { for (let y = y0 - pad; y < y0 + h + pad; y++) for (let x = x0 - pad; x < x0 + w + pad; x++) busy.add(x + ',' + y); };
    for (const o of m.objects || []) mark(o.x, o.y, o.w || 1, o.h || 1, 1);
    for (const d of [...(m.doors || []), ...(m.warps || [])]) mark(d.x, d.y, d.w || 1, d.h || 1, 4);
    for (const n of m.npcs || []) mark(n.x, n.y, 1, 1, 2);
    for (const [x, y] of m.walkSpots || []) mark(x, y, 1, 1, 2);   // promeneurs des quartiers
    for (const k in m.signs || {}) { const [x, y] = k.split(',').map(Number); mark(x, y, 1, 1, 1); }
    const fits = (kx, ky) => {
      for (let y = ky - 2; y <= ky + 3; y++) for (let x = kx - 1; x <= kx + 3; x++) {
        if (y < 2 || x < 2 || y >= H - 2 || x >= W - 2 || !GROUND.includes(rows[y][x]) || busy.has(x + ',' + y)) return false;
        if (y <= ky && '=zo'.includes(rows[y][x])) return false;   // le stand borde le chemin sans le barrer
      }
      return true;
    };
    // près des chemins et des places, mais pas dessus en plein milieu
    const cand = [];
    for (let y = 3; y < H - 4; y++) for (let x = 3; x < W - 5; x++) {
      if (!fits(x, y)) continue;
      let paths = 0;
      for (let dy = -3; dy <= 4; dy++) for (let dx = -3; dx <= 5; dx++) { const ch = (rows[y + dy] || '')[x + dx]; if (ch === '=' || ch === 'z' || ch === 'o') paths++; }
      if (paths < 4) continue;
      cand.push([-paths + DW.Art.hash(x, y, 515) * 12, x, y]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const placed = [];
    for (const r of who) {
      const c = cand.find(([, x, y]) => !placed.some(([px, py]) => Math.abs(px - x) < 8 && Math.abs(py - y) < 6));
      if (!c) continue;
      const [, x, y] = c, [v, text] = KIOSK[r.id];
      placed.push([x, y]);
      m.objects.push({ kind: 'kiosk', v, x, y, w: 3, h: 1 });
      for (let i = 0; i < 3; i++) m.signs[`${x + i},${y}`] = text;
      m.kiosks[r.id] = [x + 1, y + 1];
    }
  };
  // ------------------------------------------------------------ recrues en ville : place et services
  // quand un quartier périphérique existe (maps/quartiers.js), certaines recrues y déménagent
  const DISTRICT_HOME = {
    frigimon: 'marche', etemon: 'marche', togemon: 'marche', bakemon: 'marche', meramon: 'marche',
    andromon: 'numerique', tentomon: 'numerique',
    centarumon: 'residentiel', monzaemon: 'residentiel', numemon: 'residentiel', gekomon: 'residentiel', piximon: 'residentiel',
  };
  const DISTRICT_HOME_IDS = ['residentiel', 'marche', 'numerique'];
  function homeOf(sp) {
    const d = DISTRICT_HOME[sp];
    if (d && DW.Quartiers && DW.Quartiers.open(d)) return d;
    return TOWN[sp] ? TOWN[sp].home : 'champs';
  }
  const shop = list => DW.Game.push(new DW.ShopScene(list));   // liste ou nom de boutique (DW.SHOPS)
  const closed = async name => { await say(`C'est fermé ! Reviens entre 6 h et 22 h.`, name); };
  const TOWN = {
    centarumon: { home: 'village', async talk(n) {
      if (!open()) return closed(n);
      await say('Bienvenue à la Clinique. Laisse-moi examiner ton équipe...', n);
      for (const m of st().party) { m.heal(); m.sick = 0; m.hurt = 0; }
      DW.Audio.sfx('heal'); await say('Voilà : PV, PM, maladies et blessures, tout est soigné !', n);
    } },
    andromon: { home: 'village', async talk(n) { if (!open()) return closed(n); await say('Puces de données. Installation instantanée. Effet permanent.', n); await shop('puces'); } },
    meramon: { home: 'village', async talk(n) { if (!open()) return closed(n); await say('Le Restaurant est ouvert ! Tout est cuit au feu de Meramon !', n); await shop('resto'); } },
    frigimon: { home: 'village', async talk(n) { await say('Une glace ? Elles sont fraîches de ce matin !', n); await shop('glacier'); } },
    etemon: { home: 'village', async talk(n) { await say('Yeah baby ! Des cartes, des cartes, encore des cartes !', n); await shop('cartes'); } },
    tentomon: { home: 'village', async talk(n) { if (!open()) return closed(n); await say('Je répare les vieux Disques. Il en faut ?', n); await shop('disques'); } },
    togemon: { home: 'village', async talk(n) { if (!open()) return closed(n); await say('Un Digimon doit apprendre en lisant, pas seulement en se battant !', n); await shop('savoir'); } },
    bakemon: { home: 'village', cond: () => hour() >= 20 || hour() < 5, async talk(n) { await say('Hihihi... La boutique de nuit est ouverte...', n); await shop('nuit'); } },
    numemon: { home: 'village', async talk(n) { await say("Le panneau des rumeurs ! Voyons voir...", n); await rumor(n); } },
    // (son relais : les vols de Biyomon, mais c'est Birdramon qui parle et qui vole : maps/village.js, flyMenu)
    birdramon: { home: 'village', async talk(n) { await say('Je peux te porter dans les airs !', n); if (DW.Story.flyMenu) await DW.Story.flyMenu(n); } },
    monzaemon: { home: 'village', async talk(n) {
      if (!daily('monzaemon')) return say('Reviens demain pour un autre câlin !', n);
      st().party.forEach(m => m.addHappy(10)); DW.Audio.sfx('buff'); await say('Câlin géant ! Toute ton équipe est heureuse (bonheur +10) !', n);
    } },
    gekomon: { home: 'village', async talk(n) {
      if (!daily('gekomon')) return say('Ma voix doit se reposer... Reviens demain !', n);
      st().party.forEach(m => { m.tired = 0; }); DW.Audio.sfx('heal'); await say('♪ Dors, petit Digimon... ♪  La fatigue de ton équipe s\'est envolée.', n);
    } },
    piximon: { home: 'village', async talk(n) {
      const m = st().party[0]; if (!m) return;
      const r = await DW.ask('Pix ! Entraînement spécial, ou objets de Digivolution ?', ['Entraînement', 'Objets', 'Au revoir'], n);
      if (r === 1) { await shop('evolution'); return; }
      if (r !== 0) return;
      if (!daily('piximon')) return say('Pix ! Un entraînement spécial par jour, pas plus !', n);
      let g = 0; for (const k of ['hp', 'mp', 'atk', 'def', 'spd', 'int']) g += DW.Training.gain(m, k, 1);
      m.tired = Math.min(100, m.tired + 40);
      await say(g ? `Pix pix ! Entraînement spécial terminé : ${m.name} gagne ${g} points d'entraînement !` : `${m.name} a atteint son potentiel... Gagne des niveaux en combat !`, n);
    } },
    sukamon: { home: 'champs', async talk(n) { if (!daily('sukamon')) return say('Les poubelles sont vides pour aujourd\'hui...', n); await gift(n, ['viande_moisie', 'digichampi', 'champi_joie', 'disque_pm', 'medoc', 'cartes', 'gland_or'], 'J\'ai trouvé ça dans les ordures !'); } },
    drimogemon: { home: 'champs', async talk(n) { if (!daily('drimogemon')) return say('Mes griffes sont usées pour aujourd\'hui.', n); await gift(n, ['super_viande', 'reveil', 'pm_m', 'soin_m', 'gland_or', 'fruit_force', 'glace_force', 'feuille_vite', 'fruit_sage', 'manuel'], 'Je creuse, je creuse... Trouvé !'); } },
    lillymon: { home: 'champs', async talk(n) { if (!daily('lillymon')) return say('Les fruits repoussent... Reviens demain !', n); await gift(n, ['pomme_bleue', 'baie_rouge', 'figue', 'noix_douce', 'orange_bana'], 'Une récolte fraîche, rien que pour toi !'); } },
    shellmon: { home: 'champs', async talk(n) { if (!daily('shellmon')) return say('Plus de poisson aujourd\'hui.', n); await gift(n, ['digianchois', 'digivivaneau', 'digitruite'], 'Belle pêche aujourd\'hui !'); } },
    seadramon: { home: 'champs', still: true,
      spot: (ow) => { for (let y = 2; y < ow.map.h - 2; y++) for (let x = 2; x < ow.map.w - 2; x++) if (!ow.solid(x, y) && ow.tileAt(x + 1, y) === '~' && !ow.npcAt(x, y)) return [x, y]; return null; },
      cond: () => { const h = hour(); return (h >= 7.5 && h < 9) || (h >= 16.5 && h < 18); },
      async talk(n, ow) {
        // (il dépose à l'entrée de la région du lac : la Rive Sud du Grand Lac, lac0)
        if ((await DW.ask('Je pars pour le Grand Lac. Tu montes sur mon dos ?', ['Oui', 'Non'], n)) !== 0) return;
        const id = DW.REGION_ENTRY.lac, m = DW.getMap(id);
        DW.Audio.sfx('swoosh'); await DW.fade(1, 0.6, '#5ab0ff');
        const hub = m.spec.hub; await ow.charger(id, hub[0], hub[1], 'down'); await DW.wait(0.3); await DW.fade(0, 0.6);
        await say('Nous voici sur la Rive Sud du Grand Lac. Je repasse aux Champs à 8 h et à 17 h !', n);
      } },
    gabumon: { home: 'champs', async talk(n) {
      const m = st().party[0]; if (!m) return say('Un Digimon, ça se choisit avec le cœur !', n);
      const opts = (DW.EVO[m.sp] || []).map(o => DW.SPECIES[o.to].name);
      await say(opts.length ? `${m.name} pourrait devenir : ${opts.join(', ')}. Regarde la table des Digivolutions pour les conditions !` : `${m.name} est déjà au sommet de son évolution !`, n);
    } },
    agumon: { home: 'champs', async talk(n, ow) { await spar('agumon', n, ow); } },
    ogremon: { home: 'champs', async talk(n, ow) { await spar('ogremon', n, ow); } },
  };
  async function gift(n, list, line) {
    const id = DW.pick(list), extra = DW.giveItem(id, 1);
    DW.Audio.sfx('buy'); await say(`${line} (${DW.ITEMS[id].name})${DW.extraMsg(extra)}`, n);
  }
  async function spar(sp, n, ow) {
    const m = st().party[0]; if (!m || m.hp <= 0) return say('Reviens avec un Digimon en forme !', n);
    if ((st().daily || {})['spar_' + sp] === day()) return say("On s'est assez battus pour aujourd'hui !", n);
    if ((await DW.ask('Un petit combat d\'entraînement ? (aucune perte en cas de défaite)', ['Oui', 'Non'], n)) !== 0) return;
    daily('spar_' + sp);
    await ow.battle({ enemy: new DW.Digimon(sp, Math.max(3, m.level)), boss: true, canLose: true, intro: `${n} veut s'entraîner avec toi !` });
    st().party.forEach(p => p.heal());
  }
  async function rumor(n) {
    const left = Object.keys(Story.REG).filter(r => !(st().gears || {})[r]);
    if (!left.length) return say(st().flags.devimon ? 'L\'île est en paix ! Pas de rumeur aujourd\'hui... si ce n\'est que tu es un héros !' : "Tous les Engrenages sont brisés ! Devimon t'attend au sommet de la Montagne de l'Infini !", n);
    const r = DW.pick(left), m = DW.MAPS[DW.REGION_ENTRY[r]];
    await say(`On dit que du côté de « ${m.regionName} », ${Story.REG[r].lore}...`, n);
    await say(`Engrenages Noirs détruits : ${Story.gears()} / ${Object.keys(Story.REG).length}.`, n);
  }
  async function talkRecruit(sp, ow) {
    const n = DW.SPECIES[sp].name, T = TOWN[sp];
    if (T && T.talk) return T.talk(n, ow);
    // (son rôle est écrit à la 3e personne, « Monochromon sert de bouclier... » : il le dit à la 1re, « Je sers de bouclier... » ;
    //  les verbes dont la 1re personne diffère sont dans JE)
    const R = DW.Town.info(sp), JE = { sert: 'sers', court: 'cours', fait: 'fais' };
    const role = R.role.replace(new RegExp('^' + n + ' (\\S+)'), (_, v) => { const w = JE[v] || v; return (/^[aeiouhéèêâ]/i.test(w) ? "J'" : 'Je ') + w; });
    await say(`Merci de m'avoir accueilli en ville ! ${role}`, n);
  }


  DW.Services = { TOWN, KIOSK, DISTRICT_HOME, DISTRICT_HOME_IDS, homeOf, talkRecruit, placeKiosks };
})();
;

// ===== js/game/story.js
'use strict';
// =====================================================================
//  HISTOIRE : LES ENGRENAGES NOIRS
//  Devimon a planté un Engrenage Noir dans le cœur d'un Digimon de chaque
//  région. Le battre détruit l'engrenage : il retrouve la mémoire et vient
//  vivre en ville, suivi par un habitant de la région (2 recrues par région).
//  Quand 12 engrenages sont détruits, Devimon attend au sommet de la
//  Montagne de l'Infini (montagne9).
//  Les recrues s'installent en ville et y offrent leurs services : game/services.js.
// =====================================================================
(function () {
  const { say } = DW.MapKit;
  const FINAL = 12;
  const st = () => DW.state;
  // service une fois par jour

  // ------------------------------------------------------------ régions : boss possédé + habitant
  // boss : sous-zone 7 ; habitant : sous-zone 4 (il rejoint la ville une fois sa région libérée)
  // (bossAt / mateAt : ailleurs, quand il le faut — le combat du boss est alors celui de son chapitre)
  const REG = {
    montagne: { boss: 'leomon', mate: 'gabumon', lore: "un rugissement furieux résonne entre les rochers" },
    lac: { boss: 'seadramon', mate: 'shellmon', lore: 'les eaux du lac bouillonnent de colère' },
    brumes: { boss: 'unimon', mate: 'patamon', lore: 'une ombre ailée tourne dans le brouillard' },
    marais: { boss: 'gekomon', mate: 'tsunomon', lore: 'un chant lugubre monte des marécages' },
    savane: { boss: 'centarumon', mate: 'agumon', lore: 'un archer fou tire sur tout ce qui bouge' },
    // le Pays de Meramon (chapitre 3) : Meramon est possédé au sommet du Mont Miharashi (combat : game/chapitre3.js) ;
    // Birdramon, son compagnon, l'attend au Mont Panorama (Fumerolles). Le Mont Panorama n'a pas d'autre Engrenage.
    miharashi: { boss: 'meramon', mate: 'birdramon', bossAt: 'miharashi4', mateAt: 'volcan4', lore: 'un brasier vivant dévale les pentes du Mont Miharashi' },
    usine: { boss: 'andromon', mate: 'tentomon', lore: "les machines de l'usine tournent à plein régime" },
    decharge: { boss: 'etemon', mate: 'sukamon', lore: "un concert assourdissant fait trembler les ordures" },
    tunnel: { boss: 'drimogemon', mate: 'numemon', lore: 'les galeries s\'effondrent les unes après les autres' },
    jouets: { boss: 'monzaemon', mate: 'piximon', lore: 'les jouets ne sourient plus' },
    canyon: { boss: 'ogremon', mate: 'monochromon', lore: 'un gourdin s\'abat sur les voyageurs du canyon' },
    scarabees: { boss: 'okuwamon', mate: 'kabuterimon', lore: 'des pinces géantes tranchent les arbres' },
    dino: { boss: 'skullgreymon', mate: 'greymon', lore: 'un squelette de dinosaure erre dans la vallée' },
    jungle: { boss: 'lillymon', mate: 'togemon', lore: 'les fleurs de la jungle se sont fanées d\'un coup' },
    gel: { boss: 'garurumon', mate: 'frigimon', lore: 'une meute de loups bleus hurle dans la neige' },
    overdell: { boss: 'megadramon', mate: 'bakemon', lore: 'un dragon mécanique survole le cimetière' },
  };
  const RID = Object.keys(REG);
  // certains boss ne se montrent qu'à certaines heures (comme Coelamon dans Digimon World 1)
  const BOSS_TIME = { lac: [20, 5, 'la nuit'], brumes: [20, 5, 'la nuit'], marais: [18, 24, 'le soir'], decharge: [19, 24, 'le soir, pendant son concert'],
    gel: [21, 5, 'la nuit'], overdell: [0, 5, 'au cœur de la nuit'] };
  const inHours = (a, b) => { const h = DW.Time.hour(); return a <= b ? h >= a && h < b : h >= a || h < b; };
  const bossHere = rid => !BOSS_TIME[rid] || inHours(BOSS_TIME[rid][0], BOSS_TIME[rid][1]);
  DW.Story.BOSS_TIME = BOSS_TIME;

  // services des recrues (dans la ville) : rôle affiché à leur arrivée + effet
  const ROLES = {
    leomon: ["Leomon rouvre le GYMNASE du Terrain d'entraînement (résistances aux éléments) et entraîne tes Digimon : +1 point par séance de Frappe.", 'atk'],
    okuwamon: ["Okuwamon soulève les rochers du Terrain : +1 point par séance de Frappe.", 'atk'],
    kabuterimon: ["Kabuterimon renforce le mur de garde : +1 point par séance de Garde.", 'def'],
    monochromon: ["Monochromon sert de bouclier d'entraînement : +1 point par séance de Garde.", 'def'],
    garurumon: ["Garurumon court avec ton Digimon : +1 point par séance de Sprint.", 'spd'],
    megadramon: ["Megadramon fait la course dans le ciel : +1 point par séance de Sprint.", 'spd'],
    greymon: ["Greymon soulève les poids avec ton Digimon : +1 point par séance d'Endurance.", 'hp'],
    unimon: ["Unimon aide ton Digimon à se concentrer : +1 point par séance d'Étude (salle de classe).", 'int'],   // (le poste d'Intelligence est celui de la classe : maps/classe.js)
    piximon: ["Piximon propose un entraînement spécial, une fois par jour.", 'int'],
    centarumon: ['Centarumon ouvre une Clinique : soins complets, maladies et blessures (6 h - 22 h).'],
    andromon: ["Andromon vend des puces de données qui augmentent les statistiques pour toujours."],
    meramon: ['Meramon ouvre les fourneaux du Restaurant : nouveau menu à la carte !'],
    frigimon: ['Frigimon vend ses délicieuses glaces sur la place.'],
    etemon: ['Etemon tient un stand de cartes et organise des concerts.'],
    numemon: ["Numemon tient le panneau d'affichage : les rumeurs de l'île."],
    sukamon: ['Sukamon fouille les poubelles... et trouve parfois des trésors (1 fois par jour).'],
    drimogemon: ['Drimogemon creuse pour toi, une fois par jour.'],
    monzaemon: ['Monzaemon distribue des câlins : bonheur pour toute l\'équipe, une fois par jour.'],
    gekomon: ['Gekomon chante des berceuses : fatigue envolée, une fois par jour.'],
    seadramon: ['Seadramon fait le passeur jusqu\'à la Rive Sud du Grand Lac, à 8 h et à 17 h, depuis l\'étang des Champs.'],
    bakemon: ['Bakemon tient une boutique de nuit, à partir de 20 h.'],
    birdramon: ['Birdramon peut te faire voler vers les lieux déjà visités.'],
    tentomon: ['Tentomon répare les vieux Disques : il vend des Disques de combat.'],
    lillymon: ['Lillymon fait pousser des fruits : une récolte par jour.'],
    togemon: ['Togemon enseigne des techniques : il vend des Manuels.'],
    shellmon: ['Shellmon pêche pour la ville : un poisson par jour.'],
    gabumon: ['Gabumon donne des conseils sur les Digivolutions.'],
    patamon: ['Patamon veille sur les bébés du Village des Bébés.'],
    tsunomon: ['Tsunomon raconte les histoires des marais.'],   // (dite aussi à la 1re personne : « Je raconte... », game/services.js)
    agumon: ['Agumon est toujours partant pour un petit combat d\'entraînement.'],
    skullgreymon: ['SkullGreymon garde l\'entrée de la ville. Plus personne n\'ose s\'en approcher !'],
    ogremon: ["Ogremon s'est mis à l'entraînement : il propose des combats d'entraînement."],
  };

  // ajout des recrues à la ville (zone = sous-zone où on les trouve)
  for (const rid of RID) {
    const R = REG[rid];
    for (const [sp, k] of [[R.boss, 7], [R.mate, 4]]) {
      const role = ROLES[sp] || [`${sp} s'installe en ville.`];
      DW.Town.RECRUITS.push({ id: sp, zone: (k === 7 ? R.bossAt : R.mateAt) || rid + k, role: role[0], train: role[1], region: rid, boss: k === 7 });
    }
  }
  // bonus d'entraînement des recrues (le Terrain n'est pas modifié : ce sont des coachs)
  DW.Town.trainBonus = k => DW.Town.RECRUITS.filter(r => r.train === k && DW.Town.has(r.id)).length;

  const Story = DW.Story;
  Story.REG = REG;
  Story.gears = () => RID.filter(r => (st().gears || {})[r]).length;

  // ------------------------------------------------------------ PNJ ajoutés aux cartes (après préparation des graphismes)
  // case libre : praticable avec ses 8 voisines, loin des portes, passages, panneaux et autres PNJ
  function freeSpots(ow, avoid, spacing, sx, sy) {
    const m = ow.map, out = [], doors = [...(m.doors || []), ...(m.warps || [])];
    const bad = (x, y) => ow.solid(x, y) || (m.signs && m.signs[x + ',' + y]) || DW.World.isTall(ow.tileAt(x, y)) || '~w_'.includes(ow.tileAt(x, y));
    const cand = [];
    for (let y = 2; y < m.h - 2; y++) for (let x = 2; x < m.w - 2; x++) {
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (bad(x + dx, y + dy)) { ok = false; break; }
      if (!ok || doors.some(d => x >= d.x - 2 && x <= d.x + (d.w || 1) + 1 && y >= d.y - 2 && y <= d.y + (d.h || 1) + 1)) continue;
      cand.push([sx != null ? Math.hypot(x - sx, y - sy) : DW.Art.hash(x, y, 909), x, y]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    for (const [, x, y] of cand) {
      if ([...avoid, ...out].some(([ax, ay]) => Math.abs(ax - x) + Math.abs(ay - y) < spacing)) continue;
      out.push([x, y]);
    }
    return out;
  }
  Story.freeSpots = freeSpots;   // (aussi pour les quêtes annexes : game/quetes.js)
  // services des recrues et stands : game/services.js
  const { homeOf, TOWN, talkRecruit, DISTRICT_HOME_IDS } = DW.Services;
  Story.KIOSK = DW.Services.KIOSK; Story.placeKiosks = DW.Services.placeKiosks;   // (appelé par les cartes de la ville)
  // appelé par Overworld.load une fois la carte prête
  Story.decorate = ow => {
    const m = ow.map, id = ow.mapId;
    m.npcs = (m.npcs || []).filter(n => !n.story);
    const avoid = m.npcs.map(n => [n.x, n.y]).concat([[ow.p.x, ow.p.y]], Object.values(m.kiosks || {}));
    if (id === 'village' || id === 'champs' || DISTRICT_HOME_IDS.includes(id)) {
      const here = DW.Town.RECRUITS.filter(r => r.region && DW.Town.has(r.id) && homeOf(r.id) === id);
      if (!here.length) return;
      const spots = freeSpots(ow, avoid, 3);
      here.forEach((r, i) => {
        const T = TOWN[r.id] || {}, kp = (m.kiosks || {})[r.id], p = kp || (T.spot ? T.spot(ow, spots) : spots[i]);
        if (!p) return;
        m.npcs.push({ sp: r.id, x: p[0], y: p[1], face: kp ? 'down' : i % 2 ? 'left' : 'right', wander: kp || T.still ? 0 : 1, story: true, cond: T.cond, talk: async ow2 => { if (DW.Requests && (await DW.Requests.talk(r.id))) return; await talkRecruit(r.id, ow2); } });
      });
      return;
    }
    const rid = m.region, R = REG[rid], k = +(id.match(/(\d+)$/) || [0, -1])[1];
    if (!m.spec) return;
    const near = () => freeSpots(ow, avoid, 3, m.spec.hub[0] - 3, m.spec.hub[1] + 1)[0];
    if (R && k === 7 && !R.bossAt) {
      const p = near(); if (!p) return;
      // (chapitre 2 : pour le héros original, Seadramon n'est pas ici mais au Lac du Tramway, la nuit, avec Matt — game/chapitre2.js)
      m.npcs.push({ sp: R.boss, x: p[0], y: p[1], face: 'left', gear: true, story: true, cond: s => !(s.gears || {})[rid] && bossHere(rid) && !(rid === 'lac' && s.hero === 'perso'), talk: ow2 => bossFight(rid, ow2) });
    }
    // l'habitant d'une région : dans sa sous-zone 4, ou là où il attend (mateAt : Birdramon au Mont Panorama)
    const mr = RID.find(r => (REG[r].mateAt || r + 4) === id);
    if (mr) {
      const M = REG[mr], p = near(); if (!p) return;
      m.npcs.push({ sp: M.mate, x: p[0], y: p[1], face: 'right', story: true, cond: s => !DW.Town.has(M.mate), talk: () => mateTalk(mr) });
    }
    if (id === 'montagne9') {
      const p = near(); if (!p) return;
      m.npcs.push({ sp: 'devimon', x: p[0], y: p[1], face: 'left', gear: true, story: true, cond: s => Story.gears() >= FINAL && !s.flags.devimon, talk: ow2 => finalFight(ow2) });
    }
  };

  // ------------------------------------------------------------ combats de l'histoire
  const lvOf = rid => (DW.Wild.TABLES[rid] || [10])[0];
  // niveau des boss possédés, réglé au simulateur : ~65 % de victoire (médiane sur 7 lignées de partenaires)
  // pour un partenaire entraîné arrivé au bout de la région (niveau de la région + 4)
  const BOSS_LV = { montagne: 10, lac: 26, brumes: 12, marais: 12, savane: 14, usine: 23, decharge: 22, tunnel: 24,
    jouets: 23, canyon: 28, scarabees: 26, dino: 28, jungle: 29, gel: 32, overdell: 35 };
  async function bossFight(rid, ow) {
    const R = REG[rid], name = DW.SPECIES[R.boss].name, s = st();
    await say(`Un Engrenage Noir tourne dans le dos de ${name}... Ses yeux sont vides.`);
    await say('GRRR... DÉTRUIRE... TOUT DÉTRUIRE...', name);
    if (!s.party.some(m => m.hp > 0)) { await say('Il te faut un Digimon en forme pour l\'affronter !'); return; }
    if ((await DW.ask(`Affronter ${name} et briser l'Engrenage Noir ?`)) !== 0) return;
    const res = await ow.battle({ enemy: new DW.Digimon(R.boss, BOSS_LV[rid] || lvOf(rid) + 4), boss: true, canLose: false, intro: `${name}, possédé par l'Engrenage Noir, attaque !` });
    if (res !== 'win') { await say(`(${name} était trop fort... Entraîne-toi, équipe-toi, et retourne le libérer !)`); return; }   // défaite : déjà ramené chez Jijimon
    s.gears = s.gears || {}; s.gears[rid] = true;
    DW.Audio.sfx('super');
    ow.shake = 0.6;
    await say(`L'Engrenage Noir se brise en mille morceaux !  (${Story.gears()} / ${RID.length})`);
    await say(`Hein... ? Où suis-je ? Je me souviens... une ombre m'a planté cette chose dans le dos. Merci, tu m'as libéré !`, name);
    await say(`Laisse-moi t'aider : je pars m'installer à la Ville des Fichiers !`, name);
    await DW.Town.recruit(R.boss);
    s.party.forEach(m => m.heal());
    // (ancienne partie dont le héros est un enfant de l'aventure : Seadramon, libéré ici, clôt le chapitre 2 — pour le
    //  héros original, c'est la veillée de Matt au Lac du Tramway, game/chapitre2.js ; avant : chapitre 2 sans fin)
    if (rid === 'lac' && s.hero !== 'perso' && (s.flags.chapter || 1) === 2 && DW.Chapter.end2) await DW.Chapter.end2();
    if (Story.gears() === FINAL) await say("Le ciel s'assombrit au-dessus de la Montagne de l'Infini... Quelqu'un t'attend là-haut.");
  }
  async function mateTalk(rid) {
    const R = REG[rid], name = DW.SPECIES[R.mate].name, s = st();
    // (un habitant qui attend loin de son boss — mateAt — parle de la région de celui-ci)
    const loin = R.mateAt && DW.MAPS[DW.REGION_ENTRY[rid]].regionName;
    if (!(s.gears || {})[rid]) {
      await say(loin ? `Au loin, du côté de « ${loin} », ${R.lore}...` : `Chut... Ne fais pas de bruit. Plus loin dans la région, ${R.lore}.`, name);
      await say(`C'est ${DW.SPECIES[R.boss].name}... Il n'est plus lui-même depuis qu'un Engrenage Noir est tombé du ciel. Si tu le libères, je te suivrai !`, name);
      if (BOSS_TIME[rid]) await say(`On ne le voit que ${BOSS_TIME[rid][2]}, entre ${BOSS_TIME[rid][0]} h et ${BOSS_TIME[rid][1] % 24} h. Le reste du temps, il disparaît...`, name);
      return;
    }
    await say(`Tu as libéré ${DW.SPECIES[R.boss].name} ! ${loin ? 'Là-bas, tout' : 'La région'} respire de nouveau.`, name);
    await say('Je viens avec toi : la Ville des Fichiers a besoin de bras !', name);
    await DW.Town.recruit(R.mate);
  }
  async function finalFight(ow) {
    const s = st();
    await say('Ainsi, c\'est toi qui brises mes Engrenages Noirs...', 'Devimon');
    await say("Cette île m'appartient. Les Digimon sans mémoire sont de si dociles serviteurs... Je vais t'effacer, toi et ton partenaire !", 'Devimon');
    if ((await DW.ask('Affronter Devimon ?')) !== 0) { await say('Fuis donc... Je t\'attendrai.', 'Devimon'); return; }
    const res = await ow.battle({ enemy: new DW.Digimon('devimon', 40), boss: true, canLose: false, music: 'boss', intro: 'Devimon déploie ses ailes noires !' });
    if (res !== 'win') { await say('(Devimon était trop fort... Prépare-toi mieux avant de retourner au sommet.)'); return; }
    await say('Impossible... Battu par... un enfant...', 'Devimon');
    s.flags.devimon = true;
    await ending(ow);
  }
  async function ending(ow) {
    const s = st();
    DW.Audio.play('victory');
    await DW.fade(1, 1.2, '#ffffff');
    await DW.Game.push(new EndingScene());
    s.flags.ending = true;
    await ow.charger('village', ...DW.MapKit.zpt('village', 20, 16), 'down');
    await DW.fade(0, 1);
    await say('Bravo, mon enfant ! L\'île est libérée et la ville n\'a jamais été aussi vivante.', 'Jijimon');
    await say("L'aventure continue : il reste des Digimon à élever, des tournois à gagner et des cartes à collectionner !", 'Jijimon');
    DW.autosave();
  }
  class EndingScene extends DW.Scene {
    constructor() {
      super();
      const s = st(), m = s.party[0];
      this.lines = ['L\'Île des Fichiers est libérée.', '', `${s.name} et ${m ? m.name : 'son partenaire'}`, 'ont brisé les Engrenages Noirs', 'et vaincu Devimon.', '',
        `Habitants de la ville : ${DW.Town.RECRUITS.filter(r => DW.Town.has(r.id)).length}`, `Digimon rencontrés : ${Object.keys(s.seen).length}`, `Jours passés sur l'île : ${DW.Time.day()}`, '', 'Merci d\'avoir joué !', '', '— FIN —'];
    }
    update() { if (this.t > 4 && (DW.Input.hit('ok') || DW.Input.hit('back'))) this.close(); }
    draw(c) {
      c.fillStyle = '#0a0a1a'; c.fillRect(0, 0, DW.W, DW.H);
      for (let i = 0; i < 40; i++) { const x = (i * 97 + this.t * (6 + i % 5)) % DW.W, y = (i * 53) % DW.H; c.fillStyle = `rgba(160,220,255,${0.3 + 0.3 * Math.sin(this.t * 2 + i)})`; c.fillRect(Math.round(x), y, 1, 1); }
      const y0 = DW.H + 10 - this.t * 22;
      this.lines.forEach((l, i) => { const y = Math.max(y0 + i * 16, 40 + i * 14 - (this.lines.length * 14 - 160)); DW.UI.text(c, l, DW.W / 2, y, { size: i === this.lines.length - 1 ? 12 : 9, align: 'center', color: i === 0 ? '#ffe070' : '#ffffff' }); });
      const m = st().party[0];
      if (m) DW.Sprites.draw(c, DW.Sprites.battle(m.sp), DW.W / 2, DW.H - 10, { frame: Math.floor(this.t * 6) });
      if (this.t > 4) DW.UI.text(c, 'ESPACE', DW.W - 8, DW.H - 6, { size: 6, align: 'right', color: '#7a8ab8', shadow: false });
    }
  }

  // ------------------------------------------------------------ dessin de l'Engrenage Noir (au-dessus du boss)
  Story.drawGear = (c, x, y, t, sp) => {
    const spr = DW.Sprites.ow(sp), cy = Math.round(y - spr.h - 4 + Math.sin(t * 2) * 1.5), cx = Math.round(x), a = t * 2;
    c.fillStyle = 'rgba(40,0,60,0.28)'; c.beginPath(); c.ellipse(cx, y - spr.h / 2, spr.w / 2 + 3 + Math.sin(t * 5), spr.h / 2 + 2, 0, 0, 7); c.fill();
    c.fillStyle = '#16121c';
    for (let i = 0; i < 8; i++) { const b = a + i * Math.PI / 4; c.fillRect(Math.round(cx + Math.cos(b) * 5) - 1, Math.round(cy + Math.sin(b) * 5) - 1, 3, 3); }
    c.beginPath(); c.arc(cx, cy, 4.2, 0, 7); c.fill();
    c.fillStyle = '#8a3ac8'; c.beginPath(); c.arc(cx, cy, 1.6, 0, 7); c.fill();
  };

  // ------------------------------------------------------------ journal de quête (Menu → JOURNAL)
  class JournalScene extends DW.Scene {
    // trois pages : 0 Engrenages Noirs, 1 Requêtes des habitants, 2 Écussons et enfants perdus
    constructor() { super(); this.i = 0; this.ci = 0; this.tab = 0; }
    update() {
      const In = DW.Input, d = In.hit('left') ? -1 : In.hit('right') ? 1 : 0;
      const n = DW.state.flags.crestSeen || DW.Crests.count() ? 3 : 2;   // la page ÉCUSSONS apparaît après le premier portail découvert
      if (d) { this.tab = (this.tab + d + n) % n; DW.Audio.sfx('move'); }
      if (In.hit('back') || In.hit('ok') || In.hit('menu')) { DW.Audio.sfx('back'); this.close(); return; }
      if (this.tab === 2) {
        const n = DW.Crests.ORDER.length;
        if (In.hit('up')) { this.ci = (this.ci + n - 1) % n; DW.Audio.sfx('move'); }
        if (In.hit('down')) { this.ci = (this.ci + 1) % n; DW.Audio.sfx('move'); }
        return;
      }
      if (this.tab === 1) return;
      if (DW.Input.hit('up')) { this.i = (this.i + RID.length - 1) % RID.length; DW.Audio.sfx('move'); }
      if (DW.Input.hit('down')) { this.i = (this.i + 1) % RID.length; DW.Audio.sfx('move'); }
      if (DW.Input.hit('back') || DW.Input.hit('ok') || DW.Input.hit('menu')) { DW.Audio.sfx('back'); this.close(); }
    }
    draw(c) {
      const UI = DW.UI, s = st(), g = s.gears || {}, W = DW.W;
      if (this.tab === 1) return this.drawRequests(c);
      if (this.tab === 2) return this.drawCrests(c);
      UI.menuBg(c, this.t, 'JOURNAL');
      UI.text(c, `Engrenages Noirs : ${Story.gears()} / ${RID.length}`, W - 12, 17, { size: 8, align: 'right', color: '#ffe070' });
      UI.text(c, s.flags.crestSeen || DW.Crests.count() ? '◀ ÉCUSSONS · REQUÊTES ▶' : 'REQUÊTES ▶', W - 12, 27, { size: 6, align: 'right', color: '#9ab0e8' });
      const top = Math.max(0, Math.min(this.i - 4, RID.length - 9));
      RID.slice(top, top + 9).forEach((r, j) => {
        const idx = top + j, y = 34 + j * 15, M = DW.MAPS[DW.REGION_ENTRY[r]], seen = Object.keys(DW.MAPS).some(id => DW.MAPS[id].region === r && s.visited[id]);
        if (idx === this.i) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(8, y - 10, W - 16, 14); }
        UI.text(c, seen ? M.regionName : '???', 16, y, { size: 8, color: seen ? '#ffffff' : '#7a8ab8' });
        UI.text(c, g[r] ? 'Libérée' : seen ? 'Engrenage actif' : '', W - 16, y, { size: 7, align: 'right', color: g[r] ? '#7aff9a' : '#ff8a8a' });
      });
      const r = RID[this.i], R = REG[r], seen = Object.keys(DW.MAPS).some(id => DW.MAPS[id].region === r && s.visited[id]);
      UI.box(c, 6, 176, W - 12, 58);
      // (région inexplorée — presque toutes, aux chapitres 1 à 3 : l'objectif du moment)
      const obj = DW.Chapter && DW.Chapter.objective ? DW.Chapter.objective() : '';
      const txt = !seen ? (obj ? `OBJECTIF : ${obj}` : 'Région encore inexplorée. Consulte la carte (Menu → CARTE).')
        : g[r] ? `${DW.SPECIES[R.boss].name} a été libéré${DW.Town.has(R.mate) ? ` et ${DW.SPECIES[R.mate].name} s'est installé en ville` : `. ${DW.SPECIES[R.mate].name} t'attend ${R.mateAt ? `du côté de « ${DW.MAPS[R.mateAt].regionName} »` : 'quelque part dans la région'}`}.`
        : `On raconte ${/^[aeiouyéh]/i.test(R.lore) ? "qu'" : 'que '}${R.lore}. Un Digimon possédé se cache au fond de la région${BOSS_TIME[r] ? ` (seulement ${BOSS_TIME[r][2]}, ${BOSS_TIME[r][0]} h – ${BOSS_TIME[r][1] % 24} h)` : ''}.`;
      const fin = Story.gears() >= FINAL ? (s.flags.devimon ? 'Devimon est vaincu !' : "Devimon t'attend au sommet de la Montagne de l'Infini !") : Story.gears() ? `Brise les ${FINAL} Engrenages Noirs : quelqu'un les lance sur l'île...` : '';
      UI.wrap(c, txt, 290, 8).slice(0, fin ? 3 : 4).forEach((l, j) => UI.text(c, l, 14, 192 + j * 11, { size: 8, color: !seen && obj ? '#ffe9a8' : '#c8f0ff' }));
      UI.text(c, fin, 14, 228, { size: 7, color: '#ffe070' });
    }
  }
  // onglet Requêtes : les demandes acceptées des habitants
  JournalScene.prototype.drawRequests = function (c) {
    const UI = DW.UI, W = DW.W, L = DW.Requests ? DW.Requests.list() : [];
    UI.menuBg(c, this.t, 'JOURNAL — REQUÊTES');
    UI.text(c, DW.state.flags.crestSeen || DW.Crests.count() ? '◀ ENGRENAGES · ÉCUSSONS ▶' : '◀ ENGRENAGES', W - 12, 17, { size: 7, align: 'right', color: '#9ab0e8' });
    if (!L.length) UI.wrap(c, "Aucune requête en cours. Les habitants qui ont besoin d'aide ont un « ! » au-dessus de la tête : va leur parler en ville !", 280, 9).forEach((l, j) => UI.text(c, l, 18, 50 + j * 14, { size: 9, color: '#c8f0ff' }));
    L.slice(0, 9).forEach(([sp, q], j) => {
      const y = 40 + j * 20, ok = DW.Requests.ready(sp, q);
      UI.text(c, DW.SPECIES[sp].name, 16, y, { size: 8, color: '#ffe070' });
      const what = q.k === 'item' ? `${q.n} × ${DW.ITEMS[q.a].name} (${Math.min(q.n, DW.state.bag[q.a] || 0)}/${q.n})` : q.k === 'defeat' ? `Vaincre ${q.n} sauvage(s)${q.a ? ' ' + q.a : ''} (${q.prog}/${q.n})` : `Partenaire : ${q.n} en ${{ hp: 'PV', atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intelligence' }[q.a]}`;
      UI.text(c, what, 96, y, { size: 7, color: ok ? '#7aff8a' : '#c8f0ff' });
      if (ok) UI.text(c, 'Prêt !', W - 14, y, { size: 7, align: 'right', color: '#7aff8a' });
    });
  };
  // onglet Écussons : les sept écussons, les enfants perdus, et où chercher (data/ecussons.js, maps/donjons.js)
  JournalScene.prototype.drawCrests = function (c) {
    const UI = DW.UI, W = DW.W, C = DW.Crests, s = st();
    UI.menuBg(c, this.t, 'JOURNAL — ÉCUSSONS');
    UI.text(c, '◀ REQUÊTES · ENGRENAGES ▶', W - 12, 17, { size: 7, align: 'right', color: '#9ab0e8' });
    UI.text(c, `Écussons : ${C.count()} / ${C.ORDER.length}`, W - 12, 28, { size: 8, align: 'right', color: '#ffe070' });
    C.ORDER.forEach((k, j) => {
      const y = 46 + j * 17, on = j === this.ci, has = C.has(k), own = s.hero === k, H = DW.HEROES[k];
      if (on) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(8, y - 12, W - 16, 16); }
      const ic = DW.World.obj('crest', j);
      c.globalAlpha = has ? 1 : 0.35; c.drawImage(ic.img, 14, y - 11, 11, 13); c.globalAlpha = 1;
      UI.text(c, `Écusson ${C.name(k)}`, 32, y, { size: 8, color: has ? C.color(k) : '#7a8ab8' });
      UI.text(c, own ? 'ton écusson' : H.name, 150, y, { size: 7, color: '#c8f0ff' });
      UI.text(c, has ? 'Trouvé' : own ? 'Caché' : C.kidFound(k) ? 'Délivré' : 'Disparu', W - 16, y, { size: 7, align: 'right', color: has ? '#7aff9a' : '#ff8a8a' });
    });
    const k = C.ORDER[this.ci], D = DW.Donjons && DW.Donjons.LIST.find(x => x.kid === k), own = s.hero === k;
    const where = D ? DW.MAPS[DW.REGION_ENTRY[D.region]].regionName : '?';
    const txt = C.has(k) ? `Débloque les Ultimes : ${C.ULTIMES[k].map(sp => DW.SPECIES[sp].name).join(', ')}. (Les sept écussons réunis : la Méga.)`
      : own ? `Ton propre écusson repose dans un lieu secret de « ${where} ». Cherche un portail ancien gravé de son symbole.`
      : `${DW.HEROES[k].name} a disparu. On raconte qu'un portail ancien, gravé du symbole ${C.name(k)}, se cache dans « ${where} »...`;
    UI.box(c, 6, 176, W - 12, 58);
    UI.wrap(c, txt, 290, 8).slice(0, 4).forEach((l, j) => UI.text(c, l, 14, 192 + j * 11, { size: 8, color: '#c8f0ff' }));
  };
  Story.JournalScene = JournalScene;
})();
;

// ===== js/game/requests.js
'use strict';
// =====================================================================
//  REQUÊTES DES HABITANTS
//  Chaque Digimon recruté en ville a des demandes à son image (Meramon veut de la viande,
//  Leomon veut que tu battes des Digimon, Garurumon que ton partenaire soit rapide...).
//  Une demande à la fois par habitant, renouvelée chaque jour. Récompense : Bits + un objet de son domaine.
//  Au bout de 3 demandes, il te confie SON objet de Digivolution (Leomon → Crinière de feu, etc.) :
//  chaque recrue ouvre une voie d'évolution.
//  Types : item (apporter un objet), defeat (vaincre des sauvages d'un élément), stat (stat du partenaire).
// =====================================================================
(function () {
  const st = () => DW.state;
  const say = (t, s) => DW.say(t, s);
  const STAT = { hp: 'PV', atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intelligence' };

  // demandes possibles et récompenses, par habitant (les autres utilisent PROFILE.default)
  // item : [id, quantité] ; defeat : [élément, nombre] ; stat : [stat, valeur minimale]
  const PROFILE = {
    leomon:      { asks: [['defeat', 'Terre', 3], ['defeat', 'Ténèbres', 2], ['stat', 'atk', 120]], gifts: ['disque_atk', 'steak'], evo: 'criniere' },
    garurumon:   { asks: [['stat', 'spd', 120], ['defeat', 'Glace', 2], ['item', 'viande', 3]], gifts: ['disque_vit', 'feuille_vite'], evo: 'cristal_bleu' },
    greymon:     { asks: [['defeat', 'Feu', 3], ['item', 'super_viande', 1], ['stat', 'hp', 900]], gifts: ['steak', 'soin_m'], evo: 'griffes_grey' },
    kabuterimon: { asks: [['defeat', 'Insecte', 3], ['stat', 'def', 110], ['item', 'disque_pm', 2]], gifts: ['disque_def', 'pm_m'], evo: 'casque_corne' },
    monochromon: { asks: [['stat', 'def', 120], ['defeat', 'Terre', 3], ['item', 'digichampi', 2]], gifts: ['disque_def', 'glace_force'], evo: 'pierre_mono' },
    meramon:     { asks: [['item', 'viande', 3], ['item', 'super_viande', 1], ['defeat', 'Feu', 2]], gifts: ['surlonge', 'steak'], evo: 'boule_feu' },
    frigimon:    { asks: [['defeat', 'Glace', 2], ['item', 'pomme_bleue', 1], ['item', 'digichampi', 2]], gifts: ['champi_glace', 'baie_rouge'], evo: 'cristal_glace' },
    birdramon:   { asks: [['defeat', 'Air', 3], ['stat', 'spd', 110], ['item', 'viande', 2]], gifts: ['disque_vit', 'pilote_auto'], evo: 'aile_flamme' },
    centarumon:  { asks: [['item', 'bandage', 2], ['item', 'medoc', 1], ['defeat', 'Terre', 2]], gifts: ['soin_m', 'omnipotent'], evo: 'sabot_fer' },
    andromon:    { asks: [['item', 'disque_pm', 2], ['defeat', 'Électrique', 3], ['stat', 'int', 110]], gifts: ['pm_m', 'puce_pm'], evo: 'piece_cyber' },
    drimogemon:  { asks: [['defeat', 'Terre', 3], ['item', 'digichampi', 3], ['stat', 'atk', 110]], gifts: ['gland_or', 'super_carotte'], evo: 'foreuse' },
    seadramon:   { asks: [['item', 'digianchois', 2], ['defeat', 'Eau', 3], ['item', 'digitruite', 1]], gifts: ['digitruite', 'pm_m'], evo: 'gourde' },
    shellmon:    { asks: [['item', 'digianchois', 2], ['item', 'digivivaneau', 1], ['defeat', 'Eau', 2]], gifts: ['digisilure', 'soin_m'], evo: 'coquille' },
    unimon:      { asks: [['stat', 'int', 110], ['defeat', 'Air', 2], ['item', 'pomme_bleue', 1]], gifts: ['baie_calme', 'pm_m'], evo: 'unicorne' },
    ogremon:     { asks: [['defeat', 'Ténèbres', 3], ['stat', 'atk', 120], ['item', 'viande', 3]], gifts: ['disque_atk', 'fruit_force'], evo: 'massue' },
    bakemon:     { asks: [['defeat', 'Ténèbres', 2], ['item', 'viande_moisie', 2], ['item', 'champi_joie', 1]], gifts: ['super_reveil', 'champi_joie'], evo: 'haillon' },
    okuwamon:    { asks: [['defeat', 'Insecte', 3], ['stat', 'atk', 130], ['item', 'steak', 1]], gifts: ['s_disque_atk', 'fruit_force'], evo: 'machoire' },
    megadramon:  { asks: [['defeat', 'Air', 3], ['stat', 'spd', 140], ['item', 'pm_g', 1]], gifts: ['s_disque_vit', 'puce_spd'], evo: 'mega_main' },
    piximon:     { asks: [['stat', 'int', 130], ['item', 'digipomme', 1], ['defeat', 'Lumière', 2]], gifts: ['manuel', 'digipomme'], evo: 'petite_lance' },
    monzaemon:   { asks: [['item', 'pomme_bleue', 2], ['item', 'cartes', 1], ['defeat', 'Ténèbres', 2]], gifts: ['melon', 'cartes'], evo: 'x_bandage' },
    etemon:      { asks: [['item', 'cartes', 2], ['item', 'gland_or', 1], ['defeat', 'Ténèbres', 3]], gifts: ['cartes', 'gland_or'], evo: 'banane_or' },
    skullgreymon:{ asks: [['defeat', 'Ténèbres', 4], ['stat', 'atk', 150], ['item', 'steak', 2]], gifts: ['s_disque_atk', 'surlonge'], evo: 'os_fatal' },
    gekomon:     { asks: [['item', 'digianchois', 3], ['defeat', 'Eau', 2], ['item', 'pomme_bleue', 1]], gifts: ['baie_rouge', 'oreiller'] },
    lillymon:    { asks: [['item', 'digichampi', 2], ['defeat', 'Plante', 3], ['item', 'pomme_bleue', 1]], gifts: ['orange_bana', 'noix_douce'] },
    togemon:     { asks: [['defeat', 'Plante', 3], ['item', 'figue', 1], ['stat', 'def', 110]], gifts: ['manuel', 'super_carotte'] },
    tentomon:    { asks: [['item', 'disque_pm', 2], ['defeat', 'Électrique', 2], ['stat', 'int', 100]], gifts: ['double_disk', 'pm_m'] },
    default:     { asks: [['item', 'viande', 2], ['defeat', null, 3], ['item', 'digichampi', 2]], gifts: ['soin_m', 'super_viande'] },
  };
  const prof = sp => PROFILE[sp] || PROFILE.default;
  const R = () => { const s = st(); return (s.requests = s.requests || {}); };   // { sp: { k, n, done, accepted, day, count } }
  const today = () => DW.Time.day();

  function describe(q) {
    if (q.k === 'item') return `m'apporter ${q.n} × ${DW.ITEMS[q.a].name}`;
    if (q.k === 'defeat') return `vaincre ${q.n} Digimon sauvage${q.n > 1 ? 's' : ''}${q.a ? ` de type ${q.a}` : ''}`;
    return `que ton partenaire atteigne ${q.n} en ${STAT[q.a]}`;
  }
  // nouvelle demande du jour (choisie dans le profil, adaptée à la progression)
  function roll(sp) {
    const P = prof(sp), r = R(), cur = r[sp] || { count: 0 };
    const [k, a, n] = P.asks[(cur.count + today()) % P.asks.length];
    const lv = st().party[0] ? st().party[0].level : 5, scale = k === 'stat' ? Math.max(0.5, Math.min(2.5, lv / 20)) : 1;
    r[sp] = { k, a, n: k === 'stat' ? Math.round(n * scale) : n, prog: 0, accepted: false, done: false, day: today(), count: cur.count, evoDue: cur.evoDue || undefined };
    return r[sp];
  }
  function current(sp) { const q = R()[sp]; return q && q.day === today() ? q : null; }

  const Requests = DW.Requests = {
    PROFILE,
    // l'habitant a-t-il une demande à faire ou à rendre ? (pour le « ! » au-dessus de sa tête)
    has(sp) { if (!DW.Town.has(sp)) return false; const q = current(sp); return !q || (!q.done && (!q.accepted || Requests.ready(sp, q))); },
    ready(sp, q) {
      q = q || current(sp); if (!q || !q.accepted || q.done) return false;
      if (q.k === 'item') return (st().bag[q.a] || 0) >= q.n;
      if (q.k === 'defeat') return q.prog >= q.n;
      const m = st().party[0]; return !!m && m.stat(q.a) >= q.n;
    },
    // à appeler après chaque victoire contre un sauvage
    onWin(sp) {
      const T = DW.SPECIES[sp] && DW.SPECIES[sp].types || [];
      for (const who in R()) { const q = R()[who]; if (q.day === today() && q.accepted && !q.done && q.k === 'defeat' && (!q.a || T.includes(q.a))) q.prog++; }
    },
    list() { return Object.entries(R()).filter(([sp, q]) => q.day === today() && q.accepted && !q.done && DW.Town.has(sp)); },
    // dialogue avec l'habitant ; renvoie true si la conversation a porté sur une demande
    async talk(sp) {
      const name = DW.SPECIES[sp].name, P = prof(sp);
      let q = current(sp);
      if (!q) q = roll(sp);
      if (q.done) return false;
      if (q.accepted) {
        if (!Requests.ready(sp, q)) { await say(`Tu n'as pas oublié ? J'aimerais ${describe(q)}.${q.k === 'defeat' ? ` (${q.prog}/${q.n})` : ''}`, name); return false; }
        if (q.k === 'item') st().bag[q.a] -= q.n;
        q.done = true; q.count++;
        const gift = DW.pick(P.gifts), bits = 150 + q.count * 100 + (st().party[0] ? st().party[0].level * 10 : 0);
        st().bits += bits; const extra = DW.giveItem(gift, 1); DW.Audio.sfx('levelup');
        await say(`Merci, tu es formidable ! Voilà pour toi : ${bits} Bits et ${DW.ITEMS[gift].name} !${DW.extraMsg(extra)}`, name);
        if (st().party[0]) st().party[0].addHappy(3);
        // (l'objet de Digivolution, à la 3e demande ; sac plein : il attend la prochaine demande réussie)
        if (P.evo && (q.count === 3 || q.evoDue) && DW.ITEMS[P.evo]) {
          const reste = DW.giveItem(P.evo, 1); q.evoDue = reste > 0; DW.Audio.sfx('fanfare');
          await say(`Tu m'as tellement aidé... ${reste ? 'Je voulais te donner' : 'Prends ceci :'} ${DW.ITEMS[P.evo].name}. C'est le secret de ma propre Digivolution. Il fera de ton partenaire un ${DW.SPECIES[DW.ITEMS[P.evo].to].name} !${reste ? ' Mais ton sac est plein... Reviens me voir avec de la place !' : ''}`, name);
        }
        DW.autosave();
        return true;
      }
      if (q.later === today()) return false;   // (« Plus tard » : pas avant demain ; son service reste ouvert)
      const r = await DW.ask(`J'ai un service à te demander : ${describe(q)}. Tu veux bien ?`, ['Oui', 'Plus tard'], name);
      if (r !== 0) { q.later = today(); return false; }
      q.accepted = true;
      await say(P.evo && q.count < 3 ? `Super ! Aide-moi encore ${3 - q.count} fois et je te confierai quelque chose de très précieux...` : 'Super ! Je compte sur toi.', name);
      return true;
    },
  };
})();
;

// ===== js/game/cuisine.js
'use strict';
// =====================================================================
//  CUISINE — chaque Digimon installé en ville offre un ingrédient par jour (en lui parlant),
//  et les recettes se cuisinent au Restaurant de Mushroomon (puis dans la maison du joueur).
//  Les plats rendent heureux, rassasient et augmentent les statistiques pour toujours (chip).
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const I = DW.ITEMS;
  const st = () => DW.state;
  const today = () => DW.Time.day();

  // ------------------------------------------------------------ ingrédients (se mangent aussi tels quels)
  const INGR = {
    miel:        { name: 'Miel doré', price: 300, use: 'heal', amt: 200, food: 10, happy: 4, icon: ['jar', '#f0b020'], desc: 'Un pot de miel des fleurs de l\'île. Ingrédient de cuisine (un peu de bonheur si on le mange).' },
    piment:      { name: 'Piment de feu', price: 300, use: 'heal', amt: 100, food: 5, icon: ['veg', '#e8301a'], desc: 'Il brûle la langue ! Ingrédient de cuisine.' },
    eau_source:  { name: 'Eau de source', price: 150, use: 'heal', food: 0, drink: 80, icon: ['potion', '#6ac8f0'], desc: 'Une eau pure et fraîche : étanche la soif. Ingrédient de cuisine.' },
    sel:         { name: 'Sel de roche', price: 150, use: 'none', icon: ['jar', '#e8e4dc'], desc: 'Du sel taillé dans la roche par Gotsumon. Ingrédient de cuisine.' },
    lait:        { name: 'Lait de cactus', price: 300, use: 'heal', amt: 300, food: 15, icon: ['potion', '#f4f4ec'], desc: 'Doux et crémeux (mieux vaut ne pas demander). Ingrédient de cuisine.' },
    truffe:      { name: 'Truffe des bois', price: 1200, use: 'heal', amt: 200, food: 10, icon: ['mush', '#5a4030'], desc: 'Un champignon rare au parfum puissant. Ingrédient de cuisine.' },
    sucre:       { name: 'Sucre d\'ourson', price: 300, use: 'heal', food: 5, happy: 3, icon: ['jar', '#f8b8d0'], desc: 'Des cristaux roses et sucrés. Ingrédient de cuisine.' },
    algue:       { name: 'Algue marine', price: 200, use: 'heal', amt: 200, food: 10, icon: ['veg', '#2a8a5a'], desc: 'Elle sent bon l\'océan. Ingrédient de cuisine.' },
    glace_pilee: { name: 'Glace pilée', price: 200, use: 'heal', food: 5, tired: 30, icon: ['potion', '#c8f0ff'], desc: 'Rafraîchissante : un peu moins de fatigue. Ingrédient de cuisine.' },
    farine:      { name: 'Farine', price: 100, tier: 0, use: 'none', icon: ['jar', '#f8f4e8'], desc: 'De la farine de la boulangerie. Ingrédient de cuisine.' },
    riz:         { name: 'Riz', price: 120, tier: 0, use: 'heal', amt: 200, food: 20, icon: ['jar', '#f4f0e4'], desc: 'Un sac de riz. Ingrédient de cuisine.' },
  };
  // ------------------------------------------------------------ plats cuisinés
  const DISH = {
    brochette:   { name: 'Brochette pimentée', price: 1200, use: 'heal', amt: 800, food: 60, happy: 5, chip: { atk: 2 }, icon: ['bowl', '#c84a2a'], desc: 'Viande grillée au piment. Attaque +8 pour toujours !' },
    grillade:    { name: 'Grillade au sel', price: 900, use: 'heal', amt: 1200, food: 80, chip: { hp: 4 }, icon: ['bowl', '#a8643a'], desc: 'Simple et parfaite. PV max +80 pour toujours.' },
    soupe:       { name: 'Soupe aux champignons', price: 900, use: 'heal', amt: 600, mp: 600, food: 50, chip: { mp: 4 }, icon: ['bowl', '#c89a6a'], desc: 'Chaude et parfumée. PM max +80 pour toujours.' },
    ragout:      { name: 'Ragoût du potager', price: 2000, use: 'heal', full: true, food: 90, happy: 5, chip: { hp: 5, def: 1 }, icon: ['bowl', '#d88a3a'], desc: 'Tous les PV. PV max +100 et Défense +4 pour toujours.' },
    poisson_miel:{ name: 'Poisson laqué au miel', price: 1500, use: 'heal', amt: 900, food: 60, happy: 5, chip: { int: 2 }, icon: ['bowl', '#e0a040'], desc: 'Sucré-salé. Intelligence +8 pour toujours !' },
    sushi:       { name: 'Sushis de l\'île', price: 1500, use: 'heal', amt: 700, food: 50, chip: { spd: 2, int: 1 }, icon: ['bowl', '#f4f0e4'], desc: 'Vitesse +8 et Intelligence +4 pour toujours.' },
    curry:       { name: 'Curry de Meramon', price: 2000, use: 'heal', amt: 1500, food: 90, chip: { atk: 1, def: 2 }, icon: ['bowl', '#e0a020'], desc: 'Ça pique ! Attaque +4 et Défense +8 pour toujours.' },
    salade:      { name: 'Salade croquante', price: 1200, use: 'heal', amt: 400, food: 40, fat: -2, chip: { def: 2 }, icon: ['bowl', '#6ac850'], desc: 'Légère : fait perdre du poids. Défense +8 pour toujours.' },
    tarte_maison:{ name: 'Tarte maison', price: 1500, use: 'heal', amt: 1000, food: 60, happy: 25, chip: { spd: 2 }, icon: ['cake', '#e03a4a'], desc: 'Comme à la maison ! Très heureux. Vitesse +8 pour toujours.' },
    pain_miel:   { name: 'Pain au miel', price: 700, use: 'heal', amt: 600, food: 50, happy: 8, tired: 100, icon: ['bread', '#e8a83a'], desc: 'Réconfortant : la fatigue disparaît et le moral remonte.' },
    sorbet:      { name: 'Sorbet de Frigimon', price: 900, use: 'heal', food: 20, happy: 15, disc: 10, tired: 100, icon: ['cake', '#f0a020'], desc: 'Frais ! Bonheur +15, discipline +10, plus de fatigue.' },
    smoothie:    { name: 'Smoothie bleu', price: 1200, use: 'heal', mpFull: true, food: 30, happy: 10, chip: { mp: 3 }, icon: ['potion', '#5a8ae0'], desc: 'Tous les PM. PM max +60 pour toujours.' },
    gratin:      { name: 'Gratin à la truffe', price: 4000, use: 'heal', full: true, food: 90, happy: 10, chip: { hp: 2, mp: 2, atk: 1, def: 1, spd: 1, int: 1 }, icon: ['bowl', '#f0d070'], desc: 'Un délice rare. Toutes les statistiques augmentent un peu, pour toujours.' },
    festin:      { name: 'Festin de l\'Île', price: 9000, use: 'heal', full: true, mpFull: true, food: 100, happy: 30, life: 1, chip: { hp: 4, mp: 4, atk: 2, def: 2, spd: 2, int: 2 }, icon: ['bowl', '#ffd040'], desc: 'Le plat légendaire : rassasie, la vie s\'allonge d\'un jour et toutes les statistiques montent !' },
  };
  for (const [id, it] of Object.entries({ ...INGR, ...DISH })) { DW.foodRule(it); I[id] = it; if (!DW.ITEM_ORDER.includes(id)) DW.ITEM_ORDER.push(id); }   // (la nourriture ne soigne pas : items.js)
  DW.SHOPS.boulangerie.push('farine');
  DW.SHOPS.resto.splice(2, 0, 'riz');

  // ------------------------------------------------------------ recettes : [plat, {ingrédient: quantité}]
  const RECIPES = [
    ['grillade', { viande: 1, sel: 1 }],
    ['brochette', { viande: 1, piment: 1 }],
    ['soupe', { digichampi: 2, eau_source: 1 }],
    ['pain_miel', { farine: 1, miel: 1 }],
    ['salade', { radis: 1, super_carotte: 1, sel: 1 }],
    ['sorbet', { glace_pilee: 1, orange_bana: 1 }],
    ['smoothie', { lait: 1, pomme_bleue: 1 }],
    ['poisson_miel', { digianchois: 1, miel: 1 }],
    ['sushi', { riz: 1, algue: 1, digianchois: 1 }],
    ['tarte_maison', { farine: 1, baie_rouge: 1, sucre: 1 }],
    ['curry', { riz: 1, piment: 1, viande: 1 }],
    ['ragout', { super_carotte: 1, super_legume: 1, eau_source: 1 }],
    ['gratin', { truffe: 1, lait: 1, super_legume: 1 }],
    ['festin', { super_viande: 1, truffe: 1, miel: 1, noix_douce: 1 }],
  ];

  // ------------------------------------------------------------ le cadeau du jour de chaque habitant
  const PRODUCE = {
    yokomon: ['miel', 1, 'Les fleurs du Jardin ont donné du miel'],
    mushroomon: ['digichampi', 2, 'J\'ai cueilli des champignons ce matin'],
    betamon: ['eau_source', 2, 'L\'eau de la fontaine est si pure'],
    gotsumon: ['sel', 2, 'J\'ai taillé un peu de sel dans la roche'],
    kunemon: ['grosse_baie', 1, 'J\'ai trouvé une baie énorme'],
    biyomon: ['baie_rouge', 1, 'En volant, j\'ai cueilli des baies'],
    meramon: ['piment', 2, 'Mes piments ont bien poussé au chaud'],
    frigimon: ['glace_pilee', 2, 'Un peu de glace pilée, toute fraîche'],
    togemon: ['lait', 1, 'Voilà du lait de cactus'],
    centarumon: ['truffe', 1, 'J\'ai déterré une truffe en forêt'],
    monzaemon: ['sucre', 2, 'Du sucre, pour la douceur'],
    gekomon: ['algue', 2, 'Des algues du marais, bien fraîches'],
    tentomon: ['miel', 1, 'Les abeilles m\'ont laissé un peu de miel'],
    etemon: ['orange_bana', 1, 'Un fruit de la jungle, baby'],
    numemon: ['viande_moisie', 1, 'Euh... Je l\'ai trouvée par terre'],
    agumon: ['viande', 1, 'J\'ai gardé un morceau de viande pour toi'],
    ogremon: ['viande', 1, 'Hmpf. Prends ça'],
  };
  async function afterTalk(n) {
    const sp = n && n.sp, P = PRODUCE[sp];
    if (!P || n.recruit || n.gear || !DW.Town.has(sp) || !DW.ow || !DW.ow.map || DW.ow.map.region !== 'village') return;
    const s = st();
    if (!s.produce || s.produce.day !== today()) s.produce = { day: today(), got: [] };
    if (s.produce.got.includes(sp)) return;
    s.produce.got.push(sp);
    const [id, k, line] = P, name = DW.SPECIES[sp].name;
    const extra = DW.giveItem(id, k);
    Audio.sfx('buy');
    await DW.say(`${line}... Tiens, c'est pour toi !`, name);
    await DW.say(`Tu reçois : ${I[id].name}${k > 1 ? ' ×' + k : ''} !${DW.extraMsg(extra)}`);
    if (!s.flags.cuisineTip) {
      s.flags.cuisineTip = true;
      await DW.say(DW.Town.has('mushroomon') ? '(Chaque habitant de la ville t\'offre un ingrédient par jour. Au Restaurant, Mushroomon t\'apprendra à les cuisiner en bons petits plats !)' : '(Chaque habitant de la ville t\'offre un ingrédient par jour. Garde-les précieusement : ils serviront un jour à cuisiner.)');
    }
  }

  // ------------------------------------------------------------ recettes APPRISES (règle du joueur)
  // une recette n'apparaît qu'une fois apprise : Mushroomon en enseigne une à chaque quête réussie
  // (lui rapporter les ingrédients du plat : il le cuisine devant toi, t'apprend la recette, et te laisse le plat)
  const learned = () => { const s = st(); s.recipes = s.recipes || {}; for (const id in s.cooked || {}) s.recipes[id] = true; return s.recipes; };
  const known = () => RECIPES.filter(r => learned()[r[0]]);
  // la recette suivante dont on peut trouver tous les ingrédients MAINTENANT : vendus dans une boutique, pêchés, puisés
  // (eau de source) ou offerts par un habitant déjà en ville (avant : la Brochette demandait le Piment de Meramon, qui
  // n'arrive qu'à la fin du chapitre 3, et toute la suite restait bloquée)
  const AUTRES = new Set(['eau_source', 'digianchois', 'digivivaneau', 'digitruite']);   // (le puits des Poyomon, la pêche)
  const trouvable = id => AUTRES.has(id) || Object.values(DW.SHOPS).some(L => L.includes(id)) || Object.entries(PRODUCE).some(([sp, [g]]) => g === id && DW.Town.has(sp));
  const restantes = () => RECIPES.filter(r => !learned()[r[0]]);
  const nextQuest = () => restantes().find(r => Object.keys(r[1]).every(trouvable)) || null;
  const QUEST_WORDS = {
    grillade: "Pour commencer, la base : une grillade ! Rapporte-moi 1 Viande et 1 Sel (Gotsumon taille du sel dans la roche).",
    brochette: "Tu aimes quand ça pique ? Rapporte-moi 1 Viande et 1 Piment de feu.",
    soupe: "Ma spécialité : la soupe aux champignons ! 2 Digichampignons et 1 Eau de source (la fontaine de Betamon, ou le puits des Poyomon).",
  };
  const ingrText = r => Object.entries(r[1]).map(([id, n]) => `${n} ${I[id].name}`).join(', ');
  async function mushroomQuest() {
    const s = st(), r = nextQuest();
    if (!r) { await DW.say(restantes().length ? "Mes autres recettes demandent des ingrédients que personne n'apporte encore en ville... Reviens quand de nouveaux habitants seront arrivés !" : "Tu connais toutes mes recettes ! Tu es un vrai chef maintenant. Hihi !", 'Mushroomon'); return; }
    const dish = I[r[0]].name;
    if (s.flags.recipeQuest !== r[0]) {
      s.flags.recipeQuest = r[0];
      await DW.say(QUEST_WORDS[r[0]] || `Une nouvelle recette ? ${dish} ! Rapporte-moi ${ingrText(r)}, et je te montre comment on fait.`, 'Mushroomon');
      return;
    }
    if (!can(r)) { await DW.say(`Pour ${dish}, il me faut : ${ingrText(r)}. Les habitants de la ville t'offrent un ingrédient par jour !`, 'Mushroomon'); return; }
    if ((await DW.ask(`Donner ${ingrText(r)} à Mushroomon pour apprendre la recette « ${dish} » ?`)) !== 0) return;
    for (const [id, k] of Object.entries(r[1])) s.bag[id] -= k;
    learned()[r[0]] = true; s.flags.recipeQuest = null;
    Audio.sfx('fanfare');
    const extra = DW.giveItem(r[0], 1);
    await DW.say(`Regarde bien... on mélange, on fait mijoter... Et voilà : ${dish} ! Tu connais la recette maintenant, et ce plat est pour toi.${DW.extraMsg(extra)}`, 'Mushroomon');
    const n = nextQuest();
    if (n) await DW.say("Reviens me voir quand tu veux : j'ai encore plein de recettes à t'apprendre !", 'Mushroomon');
  }

  // ------------------------------------------------------------ écran de cuisine
  const have = id => st().bag[id] || 0;
  const can = r => Object.entries(r[1]).every(([id, n]) => have(id) >= n);
  class CookScene extends DW.Scene {
    constructor(where) { super(); this.where = where || 'Restaurant'; this.i = 0; this.top = 0; this.cook = 0; this.bub = []; this.R = known(); }
    update() {
      if (this.cook > 0) return;
      const RECIPES = this.R, n = RECIPES.length + 1;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('ok')) {
        if (this.i >= RECIPES.length) { Audio.sfx('back'); this.close(); return; }
        const r = RECIPES[this.i];
        if (!can(r)) { Audio.sfx('bump'); this.msg = 'Il manque des ingrédients !'; this.msgT = 2; return; }
        if (!DW.bagRoom(r[0])) { Audio.sfx('bump'); this.msg = `Sac plein (${DW.BAG_MAX} max) !`; this.msgT = 2; return; }
        for (const [id, k] of Object.entries(r[1])) st().bag[id] -= k;
        Audio.sfx('select'); this.cook = 1.4; this.dish = r[0];
      }
      if (this.i < this.top) this.top = this.i; if (this.i > this.top + 7) this.top = this.i - 7;
    }
    tick(dt) {
      if (this.msgT > 0) this.msgT -= dt;
      if (this.cook > 0) {
        if (Math.random() < 0.5) this.bub.push({ x: 268 + (Math.random() - 0.5) * 30, y: 120, v: 10 + Math.random() * 20, t: 0 });
        this.cook -= dt;
        if (this.cook <= 0) {
          this.cook = 0; DW.giveItem(this.dish); Audio.sfx('heal');
          const s = st(); s.cooked = s.cooked || {}; s.cooked[this.dish] = (s.cooked[this.dish] || 0) + 1;
          this.msg = `${I[this.dish].name} : c'est prêt !`; this.msgT = 2.5;
        }
      }
      this.bub.forEach(b => { b.t += dt; b.y -= b.v * dt; }); this.bub = this.bub.filter(b => b.t < 1.2);
    }
    draw(c) {
      const s = st(), RECIPES = this.R;
      UI.menuBg(c, this.t, 'CUISINE — ' + this.where.toUpperCase());
      UI.box(c, 8, 26, 168, 150);
      const rows = RECIPES.concat([null]).slice(this.top, this.top + 8);
      rows.forEach((r, k) => {
        const y = 44 + k * 16;
        if (!r) { UI.text(c, 'QUITTER', 26, y, { size: 10, color: '#9ab0e8' }); return; }
        c.drawImage(DW.Icons.item(r[0]), 12, y - 11, 12, 12);
        const known = s.cooked && s.cooked[r[0]];
        UI.text(c, I[r[0]].name, 26, y, { size: 8, color: can(r) ? '#7aff8a' : '#c8d0e8' });
        if (known) UI.text(c, '★', 170, y, { size: 7, align: 'right', color: '#ffd860' });
      });
      if (this.top > 0) UI.text(c, '▲', 92, 34, { size: 7, align: 'center', color: '#ffe070' });
      if (this.top + 8 < RECIPES.length + 1) UI.text(c, '▼', 92, 174, { size: 7, align: 'center', color: '#ffe070' });
      UI.cursor(c, 15, 40.5 + (this.i - this.top) * 16, this.t);
      // ingrédients de la recette choisie
      UI.box(c, 182, 26, 130, 150);
      const r = RECIPES[this.i];
      if (r && this.cook <= 0) {
        UI.text(c, 'INGRÉDIENTS', 247, 40, { size: 8, align: 'center', bold: true, color: '#ffe070' });
        Object.entries(r[1]).forEach(([id, n], k) => {
          const y = 58 + k * 16, ok = have(id) >= n;
          c.drawImage(DW.Icons.item(id), 188, y - 11, 12, 12);
          UI.text(c, I[id].name, 202, y, { size: 7, color: ok ? '#ffffff' : '#ff9a8a' });
          UI.text(c, `${Math.min(have(id), 99)}/${n}`, 306, y, { size: 7, align: 'right', color: ok ? '#7aff8a' : '#ff9a8a' });
        });
        const big = DW.Icons.item(r[0]);
        c.drawImage(big, 231, 128, 32, 32);
        UI.text(c, `Dans le sac : ${have(r[0])}`, 247, 170, { size: 7, align: 'center', color: '#9ab0e8' });
      }
      if (this.cook > 0) {
        // marmite qui bout
        const x = 247, y = 112;
        c.fillStyle = '#3a3a44'; c.beginPath(); c.ellipse(x, y + 10, 30, 16, 0, 0, Math.PI); c.fill();
        c.fillRect(x - 30, y - 4, 60, 14);
        c.fillStyle = '#e8a040'; c.beginPath(); c.ellipse(x, y - 4, 28, 6, 0, 0, 7); c.fill();
        c.fillStyle = '#ff7a2a'; for (let k = 0; k < 5; k++) { const fx = x - 20 + k * 10, fh = 6 + Math.sin(this.t * 20 + k) * 3; c.beginPath(); c.moveTo(fx - 4, y + 30); c.lineTo(fx, y + 30 - fh - 6); c.lineTo(fx + 4, y + 30); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.8)'; this.bub.forEach(b => { c.beginPath(); c.arc(b.x - 21, b.y, 2 + b.t * 3, 0, 7); c.fill(); });
        UI.text(c, 'Ça mijote...', x, 60, { size: 9, align: 'center', color: '#ffe070' });
      }
      UI.box(c, 8, 180, 304, 54);
      if (r) UI.wrap(c, I[r[0]].desc, 290, 8).slice(0, 3).forEach((l, k) => UI.text(c, l, 16, 196 + k * 11, { size: 8, color: '#c8f0ff' }));
      else UI.text(c, RECIPES.length ? 'Les ingrédients se récoltent auprès des habitants de la ville (un cadeau par jour).' : 'Tu ne connais aucune recette : Mushroomon, au Restaurant, te les apprend (quêtes).', 16, 200, { size: 7, color: '#c8f0ff' });
      if (this.msgT > 0) UI.text(c, this.msg, 160, 20, { size: 8, align: 'center', color: '#7aff8a' });
    }
  }

  DW.Cuisine = { INGR, DISH, RECIPES, PRODUCE, afterTalk, CookScene, known, mushroomQuest, cook: where => DW.Game.push(new CookScene(where)) };
})();
;

// ===== js/game/guide.js
'use strict';
// =====================================================================
//  JIJIMON : le réveil chez lui, puis ses explications (menu « Questions » de Jijimon)
//  Au début, il ne sait presque rien : les habitants sont partis et ont tout oublié, c'est au joueur d'enquêter.
//  Ce qu'il raconte grandit avec ce que le joueur découvre (Kuwagamon, Engrenages Noirs, écussons...).
//  Un sujet peut avoir une condition (3e élément) : il n'apparaît qu'une fois la découverte faite.
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const J = 'Jijimon';
  const st = () => DW.state;
  const hero = () => st().name || 'mon enfant';

  // ------------------------------------------------------------ sujets (questions libres)
  const TOPICS = [
    ['Le monde digital', async () => {
      await say("Le monde digital est né des réseaux de ton monde à toi : chaque donnée qui circule là-bas finit par prendre forme ici.", J);
      await say("Les Digimon sont des « monstres digitaux ». Ils naissent d'un DigiŒuf, grandissent, mangent, dorment... et digivoluent quand ils deviennent assez forts.", J);
      await say("L'Île des Fichiers est un petit bout de ce monde : forêts, plage, montagne, volcan, marais, terre gelée... seize régions en tout.", J);
      await say("Au centre, il y a notre Ville des Fichiers. Autrefois, des dizaines de Digimon y tenaient boutique. Aujourd'hui, il n'en reste que des ruines.", J);
    }],
    ["Ce qui se passe sur l'île", async () => {
      const g = DW.Story.gears ? DW.Story.gears() : 0, f = st().flags;
      await say("Je ne sais pas grand-chose, tu sais... Les habitants de la ville sont partis du jour au lendemain. Ceux que je croise ne se souviennent plus de rien.", J);
      if (!f.kuwagamon) { await say("Les petits Digimon de la forêt disent qu'un énorme insecte rouge terrorise la Clairière de l'Arrivée. Avant, il était doux comme un agneau...", J); return; }
      if (!g) { await say("Kuwagamon n'était pas lui-même, dis-tu ? Comme s'il était... possédé. Et si c'était la même chose pour tous les autres ?", J); await say("Les Digimon que tu retrouves se souviennent parfois de la ville en te voyant. Ramène-les ici !", J); return; }
      await say(`Des Engrenages Noirs plantés dans leur dos... Voilà donc ce qui leur a volé la mémoire ! Tu en as déjà brisé ${g}.`, J);
      await say("Quelqu'un les a lancés sur l'île, c'est certain. Mais qui ? Continue ton enquête : le Journal (menu) garde la trace de tout ce que tu découvres.", J);
    }],
    ['Les écussons et les enfants perdus', async () => {
      await say("Ce portail gravé que tu as vu... Je me souviens d'un vieux récit : des écussons, un pour chaque enfant venu d'un autre monde.", J);
      await say("Sans écusson, un Digimon ne dépasserait pas le stade Champion. Chaque écusson réveillerait le stade Ultime d'une famille de Digimon. Et les sept réunis...", J);
      await say("S'il y a d'autres enfants comme toi sur l'île, ils sont peut-être retenus derrière ces portails. Délivre-les ! (Menu → JOURNAL → ÉCUSSONS)", J);
    }, () => st().flags.crestSeen || (DW.Crests && DW.Crests.count() > 0)],
    ['Prendre soin de son partenaire', async () => {
      await say("Un Digimon est vivant. Il a FAIM (donne-lui de la viande) et SOIF (une rivière, une source, ou une Eau fraîche), il doit aller aux TOILETTES, et il a SOMMEIL le soir (menu → DORMIR).", J);
      await say("Un bébé mange peu ; un Champion, et surtout un gros Digimon, mange beaucoup ! Bien nourri, il prend du POIDS : certaines Digivolutions demandent un Digimon costaud, d'autres un Digimon léger.", J);
      await say("La nourriture ne soigne pas les blessures : pour les PV et les PM, il faut des RAM (au Bazar, ou dans les distributeurs de l'île). Et s'il n'a pas sommeil, il peut juste se reposer une heure ici.", J);
      await say("S'il ne trouve pas de toilettes à temps... il fait sur place. Ramasse toujours ses crottes : la saleté le rend malade.", J);
      await say("La MALADIE n'arrive jamais par hasard : ce sont les négligences qui s'accumulent. Crottes, faim, épuisement, blessures, nuits blanches... Regarde sa SANTÉ dans sa fiche.", J);
      await say("Un Médicament le guérit, ou une bonne nuit ici. Mais chaque oubli est une ERREUR DE SOIN : trop d'erreurs, et il digivoluera mal... ou vivra moins longtemps.", J);
      await say("Quand il fait une bêtise ou un exploit, félicite-le ou gronde-le aussitôt (menu → FÉLICITER / GRONDER). Un Digimon mal élevé désobéit en combat.", J);
      await say("Un Digimon ne vit pas éternellement. Au bout de sa vie, il redevient un DigiŒuf et renaît, plus fort, en gardant une partie de ce qu'il a appris.", J);
    }],
    ['Devenir plus fort', async () => {
      await say("Retiens bien ceci, c'est important : les COMBATS et l'ENTRAÎNEMENT sont deux choses différentes.", J);
      await say("Les combats font monter le NIVEAU. Le niveau fixe le POTENTIEL : jusqu'où ton Digimon peut progresser dans chaque statistique.", J);
      await say("L'entraînement, au Terrain du sud, remplit ce potentiel : PV, PM, Attaque, Défense, Vitesse, Intelligence. Chaque poste a son exercice : ton Digimon court, soulève, frappe... et toi, tu l'aides au bon moment.", J);
      await say("Ce sont les points d'entraînement qui ouvrent les Digivolutions. Regarde sa fiche (menu → DIGIMON, onglet DIGIVOLUTION) pour savoir quoi travailler.", J);
      await say("Et retiens ceci : un CHAMPION est bien plus fort qu'un Disciple. Contre un Champion sauvage, un Disciple n'a presque aucune chance... sauf s'il est très bien entraîné !", J);
      await say("Comme dans les vieux récits, les forces se comptent en milliers : un Champion bien entraîné dépasse vite les 2000 PV !", J);
      await say("Et ici, on ne capture pas les Digimon : ils naissent. Penguinmon, au Village des Bébés, confie un DigiŒuf par jour.", J);
    }],
    ['Les combats', async () => {
      await say("Les Digimon sauvages se promènent sur les chemins. Certains t'ignorent, d'autres te foncent dessus. Si tu les évites, pas de combat !", J);
      await say("Le combat se joue au tour par tour. À chaque tour, tu choisis : Combat (une technique de ton Digimon), Objet, Digimon (en changer) ou Fuite. Puis chacun agit à son tour.", J);
      await say("Chaque technique coûte des PM. Les attaques au corps à corps utilisent l'Attaque, celles à distance l'Intelligence.", J);
      await say("La jauge d'ÉNERGIE se remplit au fil des coups : pleine, elle permet le coup spécial de ton Digimon.", J);
      await say("Poison, brûlure, paralysie et sommeil ne durent que quelques tours (le nombre s'affiche à côté du nom). Feu, Eau, Plante, Glace, Lumière, Ténèbres... chaque élément a ses forces et ses faiblesses. Et les attributs aussi : Vaccin bat Virus, Virus bat Données, Données bat Vaccin.", J);
      await say("Si ton équipe est K.O., tu te réveilles ici, chez moi. Hohoho, je veille sur toi !", J);
    }],
  ];

  // ------------------------------------------------------------ les règles (les mêmes pour tout le monde)
  async function explainRules() {
    await say("En combat, ton partenaire se bat tout seul. Toi, tu choisis sa technique, tu lances des objets et tu peux le guider pour esquiver.", J);
    await say("Pour digivoluer, ton Digimon doit remplir des conditions : niveau, points d'entraînement, combats gagnés, poids, soins... Sa fiche (onglet DIGIVOLUTION) te les montre.", J);
    await say("Quand toutes les conditions sont remplies, le Digivice vibre. C'est alors à toi de décider quand digivoluer, depuis la table.", J);
  }
  // questions libres : renvoie quand le joueur a fini
  async function questions(intro) {
    let q = intro || 'Que veux-tu savoir ?';
    for (;;) {
      const list = TOPICS.filter(t => !t[2] || t[2]());
      const r = await DW.ask(q, list.map(t => t[0]).concat(["C'est bon, merci !"]), J);
      if (r == null || r < 0 || r >= list.length) return;
      await list[r][1]();
      q = 'Autre chose ?';
    }
  }

  // ------------------------------------------------------------ la grande discussion d'arrivée
  async function opening() {
    await DW.wait(0.6);
    const baby = DW.state.party[0] ? DW.state.party[0].name : 'Ton Digimon';
    await say('Mmh... Où est-ce que je suis ?');
    await say(`${baby} est blotti contre toi. Il ouvre les yeux en même temps que toi.`);
    await say(`Tu es ${DW.gn('réveillé', 'réveillée')} ! Moi c'est ${baby} ! Je ne t'ai pas quitté une seconde !`, baby);
    await say("Hohoho ! Doucement... Je suis Jijimon. Je vous ai trouvés tous les deux à l'entrée de la ville, épuisés, comme si vous aviez fui un monstre.", J);
    await say(`Un insecte rouge géant, dis-tu ? Kuwagamon... Il terrorise la forêt depuis quelque temps. Vous avez eu de la chance !`, J);
    await say(`Un humain... Je n'en avais jamais vu. Tu t'appelles ${hero()} ? Et d'où viens-tu ?... Tu ne sais pas non plus. Hohoho, nous voilà bien.`, J);
    await say("Ici, c'est la Ville des Fichiers. Enfin... ce qu'il en reste. Ses habitants sont partis du jour au lendemain, et ceux que je croise ne se souviennent plus de rien.", J);
    await say("Je ne sais pas ce qui leur est arrivé. Moi, je suis bien trop vieux pour courir l'île... Mais toi, avec ce petit, tu pourrais peut-être le découvrir ?", J);
    if (DW.state.hero !== 'perso') { DW.Audio.sfx('fanfare'); await say(`${baby} devient ton partenaire !`); }   // (le héros original l'a déjà rencontré dans la forêt)
    await say("Koromon, un petit qui est resté en ville, la connaît par cœur. Va le voir sur la place : il te fera visiter. Et reviens me voir si tu as des questions.", J);
    // un petit coup de pouce pour débuter : de quoi soigner son partenaire
    DW.giveItem('soin_p', 3); DW.giveItem('viande', 2); DW.Audio.sfx('buy');
    await say("Tiens, prends ceci : 3 RAM PV pour soigner ton partenaire, et 2 Viandes. Hohoho, il faut bien commencer quelque part !", J);
    await say("(Déplacements : flèches ou ZQSD.  Courir : Maj.  Parler : ESPACE.  Menu : ENTRÉE.)");   // (noms des touches adaptés au téléphone : Input.keys)
  }

  DW.Guide = { TOPICS, opening, questions, explainRules };
})();
;

// ===== js/game/chapitre1.js
'use strict';
// =====================================================================
//  CHAPITRE 1 — « L'Île des Fichiers » : de l'arrivée jusqu'à la victoire contre Shellmon (Kuwagamon, puis Shellmon et Tai)
//  - cartons de chapitre (ChapterScene) : au début de la partie et à la fin du chapitre
//  - visite guidée de Koromon : ta maison, le panneau de la ville, la route des Champs (nourriture)
//  - panneau devant la maison de Jijimon : ce qu'on trouve en ville et au jardin, mis à jour à chaque arrivée
//  (la bande-annonce est dans ui/intro.js, le réveil chez Jijimon dans game/guide.js, Kuwagamon dans maps/kuwagamon.js,
//   Shellmon et la fin du chapitre dans maps/antre.js)
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const K = 'Koromon';

  // ------------------------------------------------------------ carton de chapitre (écran noir, titre, sous-titre)
  class ChapterScene extends DW.Scene {
    constructor(top, title, sub) { super(); this.top = top; this.title = title; this.sub = sub || ''; }
    update() { if (this.t > 4.2 || (this.t > 1 && (Input.hit('ok') || Input.hit('back')))) this.close(); }
    draw(c) {
      const t = this.t, a = Math.max(0, Math.min(1, t / 0.6, (4.2 - t) / 0.6));
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      // lignes de données qui montent, à peine visibles
      c.font = UI.font(8);
      for (let i = 0; i < 26; i++) { const x = (i * 37) % W, y = H - ((t * 40 + i * 53) % (H + 40)); c.fillStyle = `rgba(90,220,200,${0.12 * a})`; c.fillText(i % 2 ? '1' : '0', x, y); }
      c.globalAlpha = a;
      const k = Math.min(1, t / 0.9), w = 220 * DW.ease(k);
      c.fillStyle = '#5adcc8'; c.fillRect(W / 2 - w / 2, 106, w, 1); c.fillRect(W / 2 - w / 2, 150, w, 1);
      UI.text(c, this.top, W / 2, 98, { size: 9, align: 'center', color: '#5adcc8' });
      UI.text(c, this.title, W / 2, 134, { size: 18, align: 'center', color: '#ffffff' });
      if (this.sub) UI.text(c, this.sub, W / 2, 168, { size: 8, align: 'center', color: '#a8c8d8' });
      c.globalAlpha = 1;
    }
  }
  DW.ChapterScene = ChapterScene;

  // ------------------------------------------------------------ panneau de la ville (devant la maison de Jijimon)
  // le texte se met à jour à chaque nouvel habitant : ce qu'on trouve en ville et au jardin
  const BUILT = {
    gotsumon: 'le Bazar de Gotsumon (RAM, viandes, remèdes, sacs, meubles)', elecmon: 'le Dojo d\'Elecmon (entraînement plus efficace)',
    mushroomon: 'le Restaurant de Mushroomon (repas, recettes)', yokomon: 'le Jardin de Yokomon (la DigiFerme, où se reposent tes autres Digimon)',
    betamon: 'la fontaine de Betamon (elle soigne ton équipe)', biyomon: 'la Poste de Biyomon (vols rapides, nouvelles)',
    kunemon: 'la Banque de Kunemon (objets en trop)', palmon: 'la Grange de Palmon, aux Champs (récolte chaque jour)',
    gomamon: 'le ponton de Gomamon, aux Champs (pêche ; il offre une canne)',
  };
  async function townSign() {
    const T = DW.Town, here = T.RECRUITS.filter(r => T.has(r.id));
    await say(`VILLE DES FICHIERS — ${T.label()}.  Ici : la maison de Jijimon (repos, conseils) et ta maison, juste à l'est.`);
    const shops = here.map(r => BUILT[r.id]).filter(Boolean);
    await say(shops.length ? `En ville : ${shops.join(' ; ')}.` : "Les boutiques sont vides : leurs habitants sont partis. Retrouve-les sur l'île et ramène-les ici !");
    const others = here.filter(r => !BUILT[r.id]).length;
    if (others) await say(`${others} autre${others > 1 ? 's' : ''} habitant${others > 1 ? 's' : ''} ${others > 1 ? 'tiennent' : 'tient'} un stand en ville ou aux Champs : leur enseigne dit ce qu'ils proposent.`);
    await say("Au sud-ouest : le Quartier des Champs (la Digiviande de Tanemon, chaque jour).  Au sud : le Terrain d'entraînement.  À l'ouest : la plage, puis la forêt.");
  }

  // ------------------------------------------------------------ visite guidée de Koromon (premier échange)
  const villageSpot = (find, dy = 1) => {
    const m = DW.getMap('village'), d = find(m);
    return d ? [d.x, d.y + dy] : null;
  };
  async function goTo(ow, p, face = 'up') {
    if (!p) return;
    await DW.fade(1, 0.3);
    await ow.charger('village', p[0], p[1], face);
    ow.banner.t = 99;
    // Koromon suit, juste à côté du héros (pas sur la case de son partenaire)
    const k = (ow.map.npcs || []).find(n => n.sp === 'koromon' && !n.story);
    if (k) for (const [dx, dy] of [[1, 0], [-1, 0], [1, 1], [-1, 1]]) if (!ow.solid(p[0] + dx, p[1] + dy) && !(ow.f.x === p[0] + dx && ow.f.y === p[1] + dy)) { Object.assign(k, { x: p[0] + dx, y: p[1] + dy, hx: null, hy: null, home: [p[0] + dx, p[1] + dy], face: dx > 0 ? 'left' : 'right' }); break; }
    await DW.wait(0.2);
    await DW.fade(0, 0.3);
  }
  async function tour(ow) {
    const s = st();
    await say("Ko-ko ! C'est toi, l'humain que Jijimon a trouvé à l'entrée de la ville ? Moi c'est Koromon ! Je suis resté en ville quand tous les autres sont partis.", K);
    if ((await DW.ask('Je te fais visiter ?', ['Oui !', 'Plus tard'], K)) !== 0) { await say('D\'accord ! Reviens me voir quand tu veux, je ne bouge pas de la place.', K); return; }
    // 1) ta maison
    await goTo(ow, DW.HOME_DOOR ? [DW.HOME_DOOR.x, DW.HOME_DOOR.y + 2] : null);
    await say("Voilà ta maison ! Bon... c'est une cabane qui tombe en ruine. Mais elle est à toi : un lit pour dormir quand ton partenaire a sommeil, et un coffre. Plus tu la meubles, plus elle sera belle !", K);
    await say("Ton sac est petit : quand il est plein, tu ne ramasses plus rien ! Range tes affaires dans le coffre. Plus tard, le Bazar vendra des meubles : un frigo pour la nourriture, et bien d'autres choses.", K);
    // 2) le panneau de la ville, devant chez Jijimon
    await goTo(ow, villageSpot(m => (m.doors || []).find(d => d.to === 'maison'), 2));
    await say("Ici, c'est chez Jijimon. Le grand panneau à droite de sa maison explique tout ce qu'on trouve en ville. Chaque fois que quelqu'un revient habiter ici, une nouvelle note y est épinglée !", K);
    // 3) la route des Champs : la nourriture
    await goTo(ow, DW.MapKit.zpt('village', 5, 23), 'down');   // en haut du chemin des Champs
    await say("Par là, au sud-ouest : le Quartier des Champs. Tanemon y fait pousser de la Digiviande ! Quand ton partenaire a faim, va le voir : il t'en donne 3 par jour.", K);
    await say("Et pour la soif, il y a de l'eau partout : la rivière, l'étang... Mais pas l'eau de mer, hein ! Pour te soigner, le distributeur, à l'est de la place, vend des RAM, en attendant que le Bazar rouvre.", K);
    await say("Au sud, il y a le Terrain d'entraînement : c'est là que ton partenaire devient plus fort. À l'ouest, la plage... et au-delà, la forêt.", K);
    await say("Ton partenaire est encore un bébé : commence par les DUNES, au nord-ouest de la plage (par la Lisière du Ravin). Les Digimon y sont tout petits. Ensuite le Bosquet des Pousses, puis la forêt !", K);
    await say("Les habitants sont partis vers la forêt, je crois. Si tu en croises un, parle-lui : il se souviendra peut-être de la ville !", K);
    // retour devant la maison de Jijimon, avec ton partenaire
    await goTo(ow, villageSpot(m => (m.doors || []).find(d => d.to === 'maison'), 2), 'down');
    await say("Voilà, tu sais tout ! Moi, je reste sur la place. Reviens me voir si tu te perds. Bonne chance !", K);
    s.flags.tour = true;
    // (sa carte pour l'album du chapitre 1, si tu ne l'as pas déjà)
    if (DW.Cards && DW.Cards.give('koromon')) await say('Koromon te donne une carte à son image pour ton album ! (Album)');
    DW.autosave();
  }

  // ------------------------------------------------------------ bilan de fin de chapitre (écran de récapitulatif)
  class RecapScene extends DW.Scene {
    // kid : l'enfant délivré pendant ce chapitre et son partenaire (Tai et Agumon, Matt et Gabumon, Sora et Biyomon)
    constructor(lines, title, kid = { hero: 'tai', sp: 'agumon' }) { super(); this.lines = lines; this.title = title; this.kid = kid; }
    update() { if (this.t > 1.2 && (Input.hit('ok') || Input.hit('back'))) this.close(); }
    draw(c) {
      const t = this.t;
      c.fillStyle = '#04101e'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(90,220,200,0.12)';
      for (let x = (t * 10) % 16; x < W; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      UI.text(c, this.title, W / 2, 30, { size: 14, align: 'center', color: '#5adcc8' });
      c.fillStyle = '#5adcc8'; c.fillRect(40, 38, W - 80, 1);
      const m = st().party[0];
      if (m) DW.Sprites.draw(c, DW.Sprites.battle(m.sp), 54, 150, { frame: Math.floor(t * 4), scale: Math.min(1, 70 / DW.Sprites.battle(m.sp).h) });
      // l'enfant délivré pendant ce chapitre, et son partenaire
      const K = this.kid;
      if ((st().kids || {})[K.hero]) {
        // (côte à côte, au-dessus de « ESPACE : continuer »)
        const hs = DW.Sprites.hero('down', Math.floor(t * 3) % 2 ? 0 : 2, K.hero); c.drawImage(hs.img, 26, 162, hs.w * 1.4, hs.h * 1.4);
        DW.Sprites.draw(c, DW.Sprites.battle(K.sp), 84, 206, { frame: Math.floor(t * 4) + 1, scale: Math.min(0.55, 40 / DW.Sprites.battle(K.sp).h) });
      }
      this.lines.forEach(([k, v], i) => {
        const a = DW.clamp((t - 0.3 - i * 0.25) / 0.3, 0, 1);
        c.globalAlpha = a;
        UI.text(c, k, 124, 58 + i * 16, { size: 8, color: '#a8c8d8' });
        UI.text(c, v, W - 20, 58 + i * 16, { size: 9, align: 'right', color: '#ffffff' });
        c.globalAlpha = 1;
      });
      if (t > 1.2) UI.text(c, 'ESPACE : continuer', W / 2, H - 14, { size: 8, align: 'center', color: '#ffe070' });
    }
  }
  DW.RecapScene = RecapScene;

  // ------------------------------------------------------------ fin du chapitre 1 (après Shellmon : maps/antre.js)
  async function end1() {
    const s = st();
    if (s.flags.chapter >= 2) return;
    s.flags.chapter = 2;
    Audio.play('victory');
    await DW.wait(0.8);
    await Game.push(new ChapterScene('FIN DU CHAPITRE 1', "L'Île des Fichiers", s.kids && s.kids.tai ? 'Tai et Greymon sont libres. Mais où sont les autres enfants ?' : 'Shellmon est vaincu. Mais pourquoi les Digimon ont-ils tout oublié ?'));
    // le bilan : temps, partenaire, ville, combats, boss facultatifs
    const m = s.party[0], T = DW.Town, rec = T.RECRUITS.filter(r => T.has(r.id)).length;
    const days = Math.floor(s.clock / 1440) + 1, wins = s.party.reduce((a, d) => a + (d.wins || 0), 0);
    const tm = Math.floor((s.time || 0) / 60), hm = `${Math.floor(tm / 60)} h ${String(tm % 60).padStart(2, '0')}`;
    await Game.push(new RecapScene([
      ['Jours passés sur l\'île', String(days)],
      ['Temps de jeu', hm],
      ['Partenaire', m ? `${m.name} · N.${m.level}` : '-'],
      ['Habitants revenus en ville', `${rec} / ${T.RECRUITS.length}`],
      ['Développement de la ville', `${T.progress()} %`],
      ['Combats gagnés', String(wins)],
      ['Kuwagamon', s.flags.kuwagamon ? 'vaincu !' : '-'],
      ['Shellmon', 'vaincu !'],   // (le bilan ne s'affiche qu'après sa défaite : maps/antre.js)
      ['Album de l\'île', `${DW.Cards ? DW.Cards.ch1Count() : 0} / ${DW.Cards ? DW.Cards.CH1.length : 12} cartes`],
      ['Bits', String(s.bits)],
    ], 'BILAN DU CHAPITRE 1'));
    await say("Le voile de données s'est levé au nord de la Clairière de l'Arrivée : le chemin du grand lac est ouvert. Le reste de l'île est encore voilé... chaque chose en son temps.", 'Jijimon');
    await say("Retrouve-les, ramène les habitants en ville, et découvre qui leur a fait ça. Moi, je garde la maison. Hohoho !", 'Jijimon');
    await Game.push(new ChapterScene('CHAPITRE 2', 'Le Lac et le Loup', 'Un serpent de mer garde le lac... et un garçon blond a été vu sur ses rives.'));
    DW.autosave();
  }

  // ------------------------------------------------------------ zones ouvertes pendant le chapitre 1
  // La ville, la plage et la forêt (dont le Sentier et le Village des Bébés, où veille Penguinmon : maps/berceau.js) ;
  // le reste ouvre région par région à partir du chapitre 2 (après Shellmon : OPENS). Renvoie le message de blocage,
  // ou null si la carte est accessible.
  const CH1 = new Set(['village', 'foret', 'plage']), CH1_CLOSED = new Set();   // (la Crique du Radeau est ouverte dès le début : Whamon n'y apparaît qu'après Shellmon)
  // les régions de l'île s'ouvrent chapitre après chapitre, dans l'ordre de l'anime :
  // chapitre 2 (Garurumon) : le lac ; chapitre 3 (Birdramon) : le pays de Meramon (déserts, Village des Yokomon, Mont Miharashi) ; les autres attendent leur chapitre
  const OPENS = { lac: 2, miharashi: 3, volcan: 3 };
  function lock(to) {
    const ch = st().flags.chapter || 1, m = DW.MAPS[to];
    if (!m) return null;
    if (ch >= 2) {
      const rid = m.region;
      if (!rid || CH1.has(rid) || !(DW.REGION_ENTRY && rid in DW.REGION_ENTRY)) return null;
      if (OPENS[rid] && ch >= OPENS[rid]) return null;
      // (le conseil dépend d'où l'on bute : au chapitre 2, le Pays de Meramon touche la Rosière, au bord du grand lac —
      //  on y est déjà, on ne renvoie donc plus « vers le grand lac » ; de même au chapitre 3, depuis le Pays de Meramon)
      const ici = DW.ow && DW.ow.map && DW.ow.map.region;
      const avant = ch === 2 && rid === 'miharashi' ? " Au-delà, l'air est sec et brûlant, comme au bord d'un désert." : '';
      const conseil = ch === 2 ? (ici === 'lac' ? " Pour l'instant, c'est autour du grand lac que l'aventure se joue." : " Pour l'instant, c'est vers le grand lac, au nord de la Clairière de l'Arrivée, qu'il faut aller.")
        : ch === 3 ? (ici === 'miharashi' ? " Pour l'instant, c'est au Pays de Meramon, vers le Village des Yokomon et le Mont Miharashi, que l'aventure se joue." : " Pour l'instant, c'est à l'ouest de la forêt, vers le désert et le Mont Miharashi, qu'il faut aller.") : '';
      return `Un voile de données bloque le chemin...${avant} Cette partie de l'île s'ouvrira plus tard dans l'aventure.${conseil}`;
    }
    if (CH1.has(m.region) && !CH1_CLOSED.has(to)) return null;
    return "Un étrange voile de données bloque le passage... Il est apparu en même temps que les monstres de la forêt et de la plage. Il faut d'abord rétablir le calme sur cette partie de l'île.";
  }

  // ------------------------------------------------------------ « Précédemment... » (au chargement d'une partie)
  function objective() {
    const s = st(), f = s.flags;
    if (!f.starter) return 'Ton bébé Digimon t\'attend sur la place de la ville.';
    if (!f.kuwagamon) return 'Kuwagamon, le monstre rouge, se cache dans le Grand Arbre de la Clairière de l\'Arrivée. Entraîne ton Digimon avant de l\'affronter : des mots gravés dans l\'écorce gardent l\'entrée.';
    if (!f.shellLair) return 'Kuwagamon est vaincu. Sur la plage, les cabines téléphoniques murmurent chacune un mot... Dans le bon ordre, c\'est un appel au secours.';
    if (!(s.kids || {}).tai && s.hero !== 'tai') return 'Le sable s\'est ouvert sous les cabines. Tout au fond de l\'antre, Shellmon retient un enfant prisonnier.';
    return 'Tai est libre et vit chez toi. On raconte qu\'un garçon blond a été vu près du grand lac...';
  }
  async function previously() {
    const s = st(), m = s.party[0];
    await say(`PRÉCÉDEMMENT... Jour ${Math.floor(s.clock / 1440) + 1}.${m ? ` ${m.name} (${m.d.stage}, niveau ${m.level}) est à tes côtés.` : ''}`);
    await say(DW.Chapter.objective());   // (le chapitre 2 complète les objectifs : game/chapitre2.js)
  }

  DW.Chapter = { ChapterScene, townSign, tour, end1, lock, objective, previously };
})();
;

// ===== js/game/cine_shellmon.js
'use strict';
// =====================================================================
//  CINÉMATIQUE : LA DÉFAITE DE SHELLMON (fin du chapitre 1), mise en scène comme l'introduction
//  (bandes cinéma, légendes, plans successifs) :
//   1) la grande coquille : Shellmon vacille et s'effondre dans un nuage de sable ;
//   2) l'Engrenage Noir, seul sur fond noir, se désagrège en données ;
//   3) coucher de soleil sur la plage des cabines : le héros, son partenaire, Tai et Agumon, côte à côte.
// =====================================================================
(function () {
  const { UI, Audio } = DW;
  const W = DW.W, H = DW.H;

  class ShellmonCinema extends DW.Scene {
    constructor() {
      super();
      this.mode = 'cave'; this.cap = { a: 0 }; this.line = ''; this.bars = { v: 0 };
      this.v = { shake: 0, fire: 0, boom: 0, gear: 0, data: 0, cage: 0, run: 0, glow: 0, walk: 0, sun: 0 };
      this.flash = 0; this.xf = null;
      this.data = Array.from({ length: 140 }, () => ({ x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 70, s: 1 + Math.random() * 2, c: Math.random() < 0.5 ? '#9af0ff' : '#ffffff' }));
      this.dust = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 4 + Math.random() * 10 }));
      this.buf = DW.Art.canvas(W, H);
    }
    enter() { this.run().catch(e => DW.reportError(e, 'cinématique')).then(() => this.close()); }   // (une erreur referme la scène au lieu de figer le jeu)
    update() { if (DW.Input.hit('ok')) this.skip = true; }
    tick(dt) { if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.6); }
    async show(txt, hold = 2.8) {
      this.line = txt; this.skip = false;
      await DW.tween(this.cap, { a: 1 }, 0.4);
      let t = 0; while (t < hold && !this.skip) { await DW.wait(0.05); t += 0.05; }
      await DW.tween(this.cap, { a: 0 }, 0.3);
    }
    // fondu enchaîné vers un autre plan
    cut(mode, dur = 0.8) {
      const x = this.buf.getContext('2d'); x.clearRect(0, 0, W, H);
      const cap = this.cap.a; this.cap.a = 0; this.draw(x); this.cap.a = cap;
      this.mode = mode; this.xf = { v: 1 };
      return DW.tween(this.xf, { v: 0 }, dur);
    }
    async run() {
      const s = DW.state, pt = s.party.find(m => m.hp > 0) || s.party[0];
      this.pt = pt ? pt.sp : 'agumon';
      DW.tween(this.bars, { v: 1 }, 0.8);
      await DW.fade(0, 0.6);
      // 1) Shellmon vaincu : il vacille, blanchit et s'effondre dans le sable
      DW.tween(this.v, { shake: 1 }, 0.8);
      await this.show("Shellmon vacille... puis s'effondre dans un grand nuage de sable.", 2.4);
      Audio.sfx('roar'); this.flash = 0.9;
      await DW.tween(this.v, { boom: 1 }, 1.4);
      // 2) l'Engrenage Noir, seul, qui se désagrège (fin du tremblement : les plans suivants sont stables)
      this.v.shake = 0;
      await this.cut('gear', 0.9);
      Audio.stop(); Audio.sfx('evolve');
      await DW.tween(this.v, { gear: 1 }, 1.4);
      await this.show("Un Engrenage Noir s'est arraché de sa coquille...", 2.2);
      Audio.sfx('hit');
      await DW.tween(this.v, { data: 1 }, 2.4, DW.linear);
      await this.show('... et se désagrège en mille éclats de données.', 2.2);
      // 3) coucher de soleil sur la plage
      await this.cut('beach', 1.2);
      Audio.play('beach');
      DW.tween(this.v, { sun: 1 }, 6);
      await DW.tween(this.v, { walk: 1 }, 2.4);
      await this.show(`Le soir tombe sur la Plage des Cabines. ${s.name} et Tai regardent la mer, leurs Digimon à leurs pieds.`, 3);
      await this.show("Tai est libre. Mais quelque part sur l'île, six autres enfants attendent encore qu'on les retrouve...", 3.2);
      await DW.fade(1, 0.9);
      this.bars.v = 0;
    }

    // ---------------------------------------------------------- dessin
    draw(c) {
      const t = this.t;
      c.save();
      if (this.mode === 'cave') this.drawCave(c, t);
      else if (this.mode === 'gear') this.drawGear(c, t);
      else this.drawBeach(c, t);
      c.restore();
      if (this.xf && this.xf.v > 0) { c.globalAlpha = this.xf.v; c.drawImage(this.buf, 0, 0); c.globalAlpha = 1; }
      if (this.flash > 0) { c.fillStyle = `rgba(255,250,230,${Math.min(1, this.flash)})`; c.fillRect(0, 0, W, H); }
      const bh = Math.round(24 * this.bars.v);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, bh); c.fillRect(0, H - bh, W, bh);
      if (this.cap.a > 0) {
        c.globalAlpha = this.cap.a;
        const ls = UI.wrap(c, this.line, 296, 9).slice(0, 2), y0 = H - 26 - (ls.length - 1) * 12;
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, y0 - 12, W, ls.length * 12 + 7);
        ls.forEach((l, i) => UI.text(c, l, W / 2, y0 + i * 12, { size: 9, align: 'center' }));
        c.globalAlpha = 1;
      }
    }
    caveBg(c, t) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0e06'); g.addColorStop(0.55, '#4a3018'); g.addColorStop(1, '#8a6a3a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // lagune turquoise au fond, reflets
      c.fillStyle = '#1a5a6a'; c.beginPath(); c.ellipse(W / 2, 112, 150, 22, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(120,230,240,0.35)'; for (let i = 0; i < 9; i++) c.fillRect(40 + i * 28 + Math.sin(t * 2 + i) * 6, 108 + (i % 3) * 5, 14, 1);
      // piliers de grès en silhouette, braseros
      for (const x of [22, 70, 250, 298]) { c.fillStyle = '#2a1a0c'; c.fillRect(x - 8, 40, 16, 120); c.fillStyle = '#3a2614'; c.fillRect(x - 11, 36, 22, 6); }
      for (const x of [46, 274]) { const f = 0.8 + 0.2 * Math.sin(t * 13 + x); const rg = c.createRadialGradient(x, 130, 2, x, 130, 50 * f); rg.addColorStop(0, 'rgba(255,170,70,0.55)'); rg.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = rg; c.fillRect(x - 60, 70, 120, 120); c.fillStyle = '#ffb040'; c.beginPath(); c.ellipse(x, 128, 4 * f, 7 * f, 0, 0, 7); c.fill(); }
      for (const d of this.dust) { d.y -= d.v * 0.016; if (d.y < 0) d.y = H; c.fillStyle = 'rgba(255,220,160,0.35)'; c.fillRect(d.x, d.y, 1, 1); }
    }
    drawCave(c, t) {
      const v = this.v;
      this.caveBg(c, t);
      const sh = DW.Sprites.battle('shellmon');
      c.save(); c.globalAlpha = 1 - v.boom * 0.9;
      DW.Sprites.draw(c, sh, W / 2 + Math.sin(t * 34) * 4 * v.shake * (1 - v.boom), 176 + v.boom * 26, { frame: Math.floor(t * 6), scale: 1.4 - v.boom * 0.2, white: v.boom > 0.05 ? Math.min(1, v.boom * 2) : 0 });
      c.restore();
      // nuage de sable
      if (v.boom > 0) for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 20 + v.boom * 70; c.fillStyle = `rgba(214,184,130,${0.6 * (1 - v.boom)})`; c.beginPath(); c.arc(W / 2 + Math.cos(a) * r, 176 + Math.sin(a) * r * 0.3, 8 + v.boom * 8, 0, 7); c.fill(); }
    }
    drawGear(c, t) {
      const v = this.v;
      // gros plan sombre sur la coquille fendue
      c.fillStyle = '#0a0604'; c.fillRect(0, 0, W, H);
      const rg = c.createRadialGradient(W / 2, 140, 10, W / 2, 140, 160); rg.addColorStop(0, '#5a2a3a'); rg.addColorStop(1, '#0a0604'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
      // l'Engrenage Noir qui s'arrache en tournoyant
      if (v.data < 1) {
        const gy = DW.lerp(150, 110, DW.ease(v.gear)), a = t * 2.4, sc = 1.6 + v.gear * 1.2;
        c.save(); c.translate(W / 2, gy); c.rotate(a); c.scale(sc, sc);
        c.globalAlpha = 1 - v.data;
        c.fillStyle = '#16121c'; c.strokeStyle = '#8a5ab8'; c.lineWidth = 1.2;
        c.beginPath(); for (let i = 0; i < 20; i++) { const r = i % 2 ? 12 : 17, an = i / 20 * Math.PI * 2; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#3a2a4a'; c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill();
        c.restore(); c.globalAlpha = 1;
      }
      // données qui s'envolent
      if (v.data > 0) { c.save(); c.globalCompositeOperation = 'lighter'; for (const p of this.data) { const k = v.data * 2.2; c.fillStyle = p.c; c.globalAlpha = Math.max(0, 1 - v.data); c.fillRect(W / 2 + p.x + p.vx * k, 110 + p.y + p.vy * k, p.s, p.s); } c.restore(); c.globalAlpha = 1; }
    }
    drawBeach(c, t) {
      const v = this.v;
      // ciel de coucher de soleil, soleil qui descend, mer dorée
      const g = c.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, DW.Art ? '#3a2a6a' : '#3a2a6a'); g.addColorStop(0.5, '#e86a4a'); g.addColorStop(1, '#ffc070');
      c.fillStyle = g; c.fillRect(0, 0, W, 150);
      const sy = 96 + v.sun * 40; const rg = c.createRadialGradient(W / 2, sy, 4, W / 2, sy, 60); rg.addColorStop(0, '#fff4c0'); rg.addColorStop(0.3, '#ffc060'); rg.addColorStop(1, 'rgba(255,140,60,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, 150);
      c.fillStyle = '#ffe8a0'; c.beginPath(); c.arc(W / 2, sy, 16, 0, 7); c.fill();
      c.fillStyle = '#c85a3a'; c.fillRect(0, 130, W, 40);
      for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(255,220,150,${0.3 + 0.3 * Math.sin(t * 2 + i)})`; c.fillRect(W / 2 - 40 + Math.sin(i * 7) * 50, 134 + i * 2, 20 - i, 1); }
      // sable et cabines en silhouette
      c.fillStyle = '#3a2018'; c.fillRect(0, 168, W, H - 168);
      for (const x of [20, 44, 68]) { c.fillStyle = '#2a1410'; c.fillRect(x, 120, 16, 50); c.fillRect(x - 2, 116, 20, 6); }
      // le héros, son partenaire, Tai et Agumon en silhouette, qui avancent puis s'arrêtent
      const k = DW.ease(v.walk);
      const sil = (img, x, y, w, h) => { const cv = DW.Art.canvas(w, h), x2 = cv.getContext('2d'); x2.drawImage(img, 0, 0, w, h); x2.globalCompositeOperation = 'source-in'; x2.fillStyle = '#1a0c08'; x2.fillRect(0, 0, w, h); c.drawImage(cv, Math.round(x - w / 2), Math.round(y - h)); };
      const me = DW.Sprites.hero('up', Math.floor(t * 6) % 4), tai = DW.Sprites.hero('up', (Math.floor(t * 6) + 2) % 4, 'tai');
      sil(me.img, 150 + k * 30, 192, me.w * 1.6, me.h * 1.6);
      sil(tai.img, 186 + k * 30, 192, tai.w * 1.6, tai.h * 1.6);
      const ps = DW.Sprites.battle(this.pt), ag = DW.Sprites.battle('agumon');
      sil(ps.img, 124 + k * 30, 194, ps.w * 0.7, ps.h * 0.7);
      sil(ag.img, 222 + k * 30, 194, ag.w * 0.7, ag.h * 0.7);
    }
  }
  DW.ShellmonCinema = ShellmonCinema;
})();
;

// ===== js/game/debut.js
'use strict';
// =====================================================================
//  DÉBUT DE PARTIE, DANS LE JEU (épisode 1) — sur la carte de la Clairière de l'Arrivée
//  1) le héros atterrit dans l'herbe, seul ; il marche tout seul, cherche les autres, appelle... personne ;
//  2) un buisson remue : son bébé Digimon en sort, ils se parlent, il devient son partenaire (il le suit) ;
//  3) ils avancent ensemble ; une ombre passe : Kuwagamon survole la clairière, fait demi-tour et fond sur eux ;
//  4) le bébé crache ses bulles, ils s'enfuient vers la ville ; noir... réveil chez Jijimon.
//  Tout se joue avec le moteur du jeu (déplacements pas à pas, le partenaire qui suit, Kuwagamon qui vole
//  au-dessus de la carte : ow.flyers), le joueur ne contrôle rien pendant la scène.
// =====================================================================
(function () {
  const TS = 16;
  const say = (t, s) => DW.say(t, s);
  const wait = s => DW.wait(s);

  // le héros fait n pas dans une direction (s'arrête devant un obstacle)
  async function walk(ow, dir, n) {
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    for (let i = 0; i < n; i++) {
      if (ow.solid(ow.p.x + D[0], ow.p.y + D[1])) { ow.p.dir = dir; break; }
      await ow.forceStep(dir);
    }
  }
  // un PNJ fait un pas (animation de marche du moteur)
  async function npcStep(ow, n, dir) {
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    if (D[0]) n.face = D[0] > 0 ? 'right' : 'left';
    n.mv = { sx: n.x, sy: n.y, t: 0 }; n.x += D[0]; n.y += D[1];
    await wait(0.32);
  }
  // Kuwagamon qui vole au-dessus de la carte (coordonnées monde, en pixels) : déplacement en douceur
  const fly = (f, to, dur, ease) => DW.tween(f, to, dur, ease);

  async function run(ow) {
    const s = DW.state, baby = DW.heroLine().baby, bname = DW.SPECIES[baby].name;
    ow.wilds = []; ow.cine = true;   // (scène jouée : pas de jauges ni d'horloge à l'écran)
    await DW.fade(0, 1.2);
    DW.Audio.play('forest');
    ow.shake = 0.5; DW.Audio.sfx('hit');
    await wait(0.6);
    await say(`Aïe aïe aïe... Tu es ${DW.gn('tombé', 'tombée')} dans l'herbe, au milieu d'une clairière. Autour de toi, une forêt immense et inconnue.`);
    // 1) il cherche les autres
    await walk(ow, 'left', 3);
    await say(`« Ohé ! Il y a quelqu'un ?! Tai ? Sora ?... »`, s.name);
    await walk(ow, 'right', 6);
    ow.p.dir = 'up'; await wait(0.4);
    await say(`« Matt ? Izzy ?... Quelqu'un ?! »`, s.name);
    await walk(ow, 'down', 2);
    await say("Personne ne répond. Juste le vent dans les arbres... et des bruits étranges, tout autour.");
    await say(`Tu as peur. Tu es ${DW.gn('tout seul', 'toute seule')}.`);
    // 2) le bébé sort d'un buisson
    DW.Audio.sfx('swoosh');
    const bx = ow.p.x + 4, by = ow.p.y;
    const n = { sp: baby, x: bx, y: by, face: 'left', debut: true };
    ow.map.npcs.push(n);
    ow.rustle[bx + ',' + by] = 1;
    await wait(0.8);
    ow.p.dir = 'right';
    await npcStep(ow, n, 'left'); await npcStep(ow, n, 'left');
    DW.Audio.sfx('select');
    await say(`Coucou ! N'aie pas peur ! Je suis ${bname}... Je t'attendais !`, bname);
    await say(`Tu... tu m'attendais ? Moi, c'est ${s.name}.`, s.name);
    await say(`${s.name} ! Je savais qu'un humain viendrait. Je suis ton partenaire ! Viens, ne restons pas ici, la forêt n'est pas sûre...`, bname);
    // il devient le partenaire : il suit le héros
    ow.map.npcs.splice(ow.map.npcs.indexOf(n), 1);
    const m = new DW.Digimon(baby, 4); m.happy = 70; DW.addDigimon(m); s.flags.starter = baby;
    Object.assign(ow.f, { x: n.x, y: n.y, sx: n.x, sy: n.y, tx: n.x, ty: n.y, moving: false, face: 'left' });
    DW.Audio.sfx('fanfare');
    await say(`${bname} devient ton partenaire !`);
    // 3) ils avancent ensemble... Kuwagamon
    await walk(ow, 'down', 3);
    await walk(ow, 'left', 2);
    const hx = ow.p.x * TS + 8, hy = ow.p.y * TS;
    const K = { sp: 'kuwagamon', x: hx - 260, y: hy - 75, s: 0.55, sil: true, flip: false, shadow: 0.3 };   // (il file vers la droite)
    ow.flyers = [K];
    DW.Audio.sfx('roar');
    await say('BZZZZZZ... Un bourdonnement énorme fait trembler les feuilles.');
    await fly(K, { x: hx + 260, y: hy - 55 }, 2.2, DW.linear);   // (assez bas pour passer dans le champ de la caméra)
    await say("Une grande ombre rouge passe au-dessus de la clairière... puis fait demi-tour !");
    DW.Audio.play('boss');
    Object.assign(K, { flip: true, sil: false, s: 0.8 });   // (demi-tour : il fonce vers la gauche, sur vous)
    DW.Audio.sfx('swoosh');
    await fly(K, { x: hx + 70, y: hy + 6, s: 1 }, 1.2, t => t * t);
    ow.shake = 0.8; DW.Audio.sfx('hit');
    await say(`Un insecte géant aux pinces énormes ! C'est Kuwagamon ! Cours, ${s.name} !`, bname);
    DW.Audio.sfx('water');
    if (DW.Companion) DW.Companion.emote(ow, '!', 1.4);
    await say(`${bname} crache ses petites bulles de toutes ses forces... Kuwagamon, surpris, recule !`);
    // 4) la fuite, vers la ville
    fly(K, { x: hx + 140, y: hy - 60 }, 1.4);
    await walk(ow, 'left', 4);
    await walk(ow, 'down', 3);
    await say("Vous courez à perdre haleine, loin de la clairière... vers des toits, au loin.");
    await DW.fade(1, 1.0);
    ow.flyers = null; ow.cine = false;
    s.flags.kuwaChase = true;
    // réveil chez Jijimon (comme avant)
    await ow.charger('maison', 12, 5, 'down');
    DW.Audio.play('village');
    DW.fade(0, 0.8);   // (comme une partie normale : le réveil se fait sur l'image, sinon tout restait noir)
    await DW.Game.push(new DW.WakeScene());
    await DW.Story.opening();
    DW.autosave();
  }

  DW.Debut = { run, walk, npcStep };
})();
;

// ===== js/game/trophees.js
'use strict';
// =====================================================================
//  TROPHÉES DES BOSS ET CAVE DU JOUEUR
//  Chaque grand boss vaincu laisse un trophée (Jijimon le remet au joueur). Le premier ouvre la cave
//  de ta maison (escalier dans maps/joueur.js), où les trophées sont exposés sur des présentoirs.
//  state.trophies = { kuwagamon: true, ... } ; ajouter un trophée = une entrée dans LIST (v = dessin du présentoir).
// =====================================================================
(function () {
  const st = () => DW.state;
  const LIST = {
    kuwagamon: { name: 'Trophée de Kuwagamon', v: 1, desc: "Kuwagamon, l'insecte rouge du Grand Arbre de la Clairière. Ta toute première grande victoire !" },
    shellmon: { name: 'Trophée de Shellmon', v: 2, desc: "Shellmon, le gardien de l'antre sous les cabines de la plage. La victoire qui a délivré Tai et réveillé Greymon !" },
    monochromon: { name: 'Trophée de Monochromon', v: 3, desc: "Le Monochromon de la Rive Sud, qui bloquait la route du lac. Une carapace dure comme le diamant !" },
    seadramon: { name: 'Trophée de Seadramon', v: 4, desc: "Seadramon, le serpent de mer du Lac du Tramway. La nuit où Garurumon est apparu et où Matt a été délivré !" },
    meramon: { name: 'Trophée de Meramon', v: 5, desc: "Meramon, le gardien de feu du Mont Miharashi, rendu fou par un Engrenage Noir. Le jour où Birdramon a pris son envol !" },
  };
  const SLOTS = 8;   // emplacements de la cave (les suivants attendent les prochains boss)
  const Trophies = DW.Trophies = {
    LIST, SLOTS,
    has: id => !!(st().trophies || {})[id],
    count: () => Object.keys(LIST).filter(id => Trophies.has(id)).length,
    give(id) { const s = st(); s.trophies = s.trophies || {}; s.trophies[id] = true; DW.World.unprepare(DW.MAPS.cave_joueur); },
  };

  // ------------------------------------------------------------ la cave : salle des trophées
  const W = 16, H = 12;
  const rows = ['0'.repeat(W), '0' + '2'.repeat(W - 2) + '0', '0' + '2'.repeat(W - 2) + '0', ...Array.from({ length: H - 4 }, () => '0' + '1'.repeat(W - 2) + '0'), '0'.repeat(W)];
  const SPOTS = [[3, 4], [6, 4], [9, 4], [12, 4], [3, 8], [6, 8], [9, 8], [12, 8]];
  DW.MAPS.cave_joueur = {
    name: 'Ma cave — Salle des trophées', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true, calm: true,
    dark: { d: 0.25, col: '#2a2030' },
    floor: { type: 'stone', cols: ['#8a8478', '#6a645a', '#3a3630'] }, wall: { base: '#6a5a4a', alt: '#5a4a3a', pattern: 'brick', wood: '#3a2a1a' },
    rows, objects: [], npcs: [], signs: {}, warps: [],
    doors: [{ x: 7, y: 2, w: 2, dir: 'up', to: 'maison_joueur', tx: 12, ty: 3 }],
    build() {
      const got = Object.keys(LIST).filter(id => Trophies.has(id)), version = got.join(',');
      if (this.version === version && this.objects.length) return;
      this.version = version;
      this.objects = [{ kind: 'stairsup', x: 7, y: 1, w: 2, h: 2, back: true }];
      this.signs = {};
      SPOTS.forEach(([x, y], i) => {
        const id = got[i], T = id && LIST[id];
        this.objects.push({ kind: 'trophystand', v: T ? T.v : 0, x, y, w: 1, h: 1 });
        this.signs[`${x},${y}`] = T ? `${T.name} — ${T.desc}` : 'Un présentoir vide. Il attend le trophée de ta prochaine grande victoire...';
      });
      DW.World.unprepare(this);
    },
  };
})();
;

// ===== js/game/chapitre2.js
'use strict';
// =====================================================================
//  CHAPITRE 2 — « Le Lac et le Loup » (saison 1, épisode 3 : Garurumon)
//  1) Rive Sud (lac0) : deux Monochromon se battent pour le chemin ; le vainqueur le garde (boss intermédiaire).
//  2) Lac du Tramway (lac2), redessiné : un grand lac, une île avec le vieux tramway, une langue de sable pour y aller.
//     La nuit (20 h - 5 h), Matt joue de l'harmonica près de son feu de camp, sur l'île, avec Gabumon.
//  3) La veillée : une braise tombe sur la « feuille rouge »... c'est la queue de Seadramon ! Combat ;
//     Gabumon digivolue en Garurumon à 40 % des PV de Seadramon et vient t'aider.
//  4) Cinématique (Renard de feu, les Gomamon ramènent l'île, l'aube à l'harmonica), Matt s'installe chez toi.
//     Matt cherche TK : la piste pour plus tard. Bilan, puis le carton du chapitre 3.
//  (héros original seulement ; avec un autre enfant, Seadramon reste le boss du Lac de l'Œil du Dragon : game/story.js)
// =====================================================================
(function () {
  const { Audio, Game, UI } = DW;
  const W = DW.W, H = DW.H, TS = 16;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const MAPS = DW.MAPS;
  const perso = () => st().hero === 'perso';
  const ch2 = () => (st().flags.chapter || 1) >= 2;
  const night = () => { const h = DW.Time.hour(); return h >= 20 || h < 5; };
  const kidMatt = () => !!(st().kids || {}).matt;

  // ------------------------------------------------------------ objets : feu de camp, « feuille rouge » (bout de la queue de Seadramon)
  Object.assign(DW.World.OBJ, {
    campfire: { w: 24, h: 20, n: 1, fire: [12, 9], lights: [[12, 9, 64]], draw(d) {
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; d.ell(12 + Math.cos(a) * 9, 15 + Math.sin(a) * 3, 2.4, 1.8, ['#8a847a', '#7a746a', '#9a948a'][i % 3], 0, { tex: 0.3 }); }
      d.tube([[5, 15], [19, 11]], 1.6, 1.4, '#6a4424'); d.tube([[5, 11], [19, 15]], 1.6, 1.4, '#7a4e2a');
      d.ell(12, 12, 5, 2, '#ff7a20', 0, { unlit: true, noline: true }); d.ell(12, 10, 3, 3, '#ffd060', 0, { unlit: true, noline: true });
    } },
    seatail: { w: 30, h: 16, n: 1, draw(d) {
      d.poly([[1, 12], [8, 3], [18, 1], [29, 6], [22, 12], [10, 15]], '#d8402a', { shiny: true });
      d.deco.line(3, 12, 26, 6, 0.7, '#8a1a10');
      for (const [x, y] of [[9, 10], [14, 8], [19, 7]]) d.deco.line(x, y, x + 3, y - 4, 0.5, '#8a1a10');
    } },
  });

  // ------------------------------------------------------------ 2) Lac du Tramway redessiné
  const LX = 47, LY = 46, IX = 47, IY = 47;   // centre du lac, centre de l'île
  const L = MAPS.lac2;
  if (L && L.spec) {
    delete L.piece;
    L.objects = L.objects.filter(o => o.kind !== 'tram');
    for (const k in L.signs) if (/tramway/i.test(String(L.signs[k]))) delete L.signs[k];
    // (espaces ouverts du gabarit : seulement ceux du nord, hors du lac — sinon des ponts menaient dans le vide)
    // (au centre du grand lac : de l'eau jusqu'aux bords, comme sur les cartes voisines ; on arrive par le nord)
    L.spec.rooms = [];
    Object.assign(L.spec, { hub: [IX, IY], lakes: [{ x: LX, y: LY, rx: 80, ry: 60 }], tall: [], clearings: [], lm: [] });
    L.objects.push(
      { kind: 'tram', x: 44, y: 45, w: 4, h: 1 },
      { kind: 'campfire', x: 47, y: 48, w: 1, h: 1, small: true },
      { kind: 'seatail', x: 52, y: 47, w: 1, h: 1, small: true, tail: true },
    );
    L.spec.post = g => {
      // l'île (herbe, bord de sable) et la langue de sable qui la relie à la rive nord
      for (let y = IY - 5; y <= IY + 5; y++) for (let x = IX - 9; x <= IX + 9; x++) {
        const d = Math.hypot((x - IX) / 8, (y - IY) / 3.6);
        if (d < 0.8) g.set(x, y, '.'); else if (d < 1.1) g.set(x, y, 's');
      }
      // langue de sable depuis le ponton du nord (alignée sur le passage)
      { const ux = L.exits.up[0] + (L.exits.up[1] >> 1);
        for (let y = 0; y < IY - 2; y++) { const x0 = Math.round(ux + (IX - ux) * Math.max(0, (y - 6) / (IY - 8))); for (const x of [x0 - 1, x0, x0 + 1]) { const c = g.get(x, y); if (c === '~' || c === 'w' || c === '_' || DW.SOLID.has(c)) g.set(x, y, y < 3 ? '=' : 's'); } } }
      // roseaux sur les berges
      for (let y = 30; y < 62; y++) for (let x = 20; x < 75; x++) {
        if (!'.,'.includes(g.get(x, y)) || DW.Art.hash(x, y, 77) > 0.3) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g.get(x + dx, y + dy) === '~') && Math.abs(x - IX) > 10) g.set(x, y, 'Ð');
      }
    };
    L.signs['47,48'] = async () => { await say(night() && !kidMatt() && perso() && ch2() ? 'Le feu crépite. Matt fixe les flammes, son harmonica à la main.' : 'Un feu de camp. Les braises sont encore tièdes...'); };
    L.signs['46,45'] = async () => {
      await say("Un vieux tramway échoué sur l'île. Personne ne sait comment il est arrivé là... Une couverture et un sac traînent sur la banquette.");
      // (Matt ne vient qu'à la nuit tombée : on peut l'attendre ici, sur la banquette)
      const s = st(), h = DW.Time.hour();
      if (!perso() || !ch2() || !s.flags.monoCh2 || kidMatt() || h < 5 || h >= 20) return;
      if ((await DW.ask("S'allonger sur la banquette et attendre le soir ?", ['Oui', 'Non'], null, 1)) !== 0) return;
      await DW.fade(1, 0.6); s.clock = Math.floor(s.clock / 1440) * 1440 + 20 * 60 + 5; await DW.wait(0.4); await DW.fade(0, 0.6);
      await say("Le soleil s'est couché sur le lac... Au loin, quelqu'un joue de l'harmonica.");
    };
    // la « feuille rouge » disparaît une fois Seadramon vaincu
    L.populate = function () {
      const gone = !!st().flags.seadramon, has = this.objects.some(o => o.tail);
      if (gone && has) { this.objects = this.objects.filter(o => !o.tail); if (this.gfx) DW.World.unprepare(this); }
      if (gone) delete this.signs['52,47'];
    };
    L.signs['52,47'] = async () => { await say("Une grande feuille rouge, posée au bord de l'île. Elle est... tiède ? Et elle bouge un peu, on dirait qu'elle respire."); };
    const visible = s => perso() && ch2() && !!s.flags.monoCh2 && !(s.kids || {}).matt && night();
    L.npcs.push(
      { hero: 'matt', x: 45, y: 48, face: 'right', cond: visible, talk: ow => mattScene(ow) },
      { sp: 'gabumon', x: 49, y: 48, face: 'left', cond: visible, talk: async () => { await say(st().flags.mattMet ? "Matt ne dort plus depuis qu'on est arrivés... Il pense à TK tout le temps." : "Bonsoir ! Tu es un ami de Matt ? Va lui parler, il est près du feu.", 'Gabumon'); } },
    );
    // l'harmonica, la nuit, tant que Matt campe ici
    L.onEnter = async ow => {
      if (!visible(st())) return;
      Audio.play('harmonica');
      if (!st().flags.harmo) { st().flags.harmo = true; await say("Une mélodie d'harmonica flotte sur le lac... Elle vient de l'île, au milieu de l'eau, où brille un petit feu."); }
    };
  }

  // ------------------------------------------------------------ 1) Rive Sud : les deux Monochromon
  const R0 = MAPS.lac0;
  if (R0 && R0.spec) {
    const spot = () => { const [p] = R0.exits.right; return DW.MapKit.freeNear(R0, R0.w - 9, p + 2); };   // (la case libre la plus proche du chemin)
    R0.populate = function () {
      if (this.monoSet) return;
      this.monoSet = true;
      const [x, y] = spot();
      this.npcs.push(
        { sp: 'monochromon', x, y, face: 'left', mono: true, cond: s => ch2() && !s.flags.monoCh2, talk: ow => monoFight(ow) },
        { sp: 'monochromon', x: x + 1, y: y + 2, face: 'left', cond: s => ch2() && !s.flags.monoSeen, talk: () => say('GRRROOOH !', 'Monochromon') },
      );
    };
    // le chemin du lac est gardé tant que Monochromon n'est pas vaincu. Il se tient près de la sortie est (Ponton des
    // Pêcheurs) ; à l'ouest (Rosière), c'est un voile de données levé par le combat qui barre le sentier (comme au chapitre 1 :
    // il se dissipe quand le calme revient). La règle de chapitre déjà posée sur le passage (atelier des cartes, maps/puzzle.js :
    // Rosière ↔ Rive Sud fermé après le chapitre 3) s'AJOUTE à la garde au lieu d'être écrasée (avant : sens unique au chapitre 4)
    for (const w of R0.warps.filter(w0 => w0.to === 'lac1' || w0.to === 'lac3')) {
      const cond0 = w.cond, lock0 = w.lock;
      const garde = w.to === 'lac1' ? "Un voile de données barre le sentier de l'ouest, vers la Rosière... Il s'est levé avec le combat des deux Monochromon : tant que le vainqueur fait la loi sur la rive, plus loin à l'est, il ne se dissipera pas !"
        : "Monochromon te barre la route en grattant le sol de ses pattes. Impossible de passer tant qu'il garde les rives du lac !";
      w.cond = s => (!cond0 || cond0(s)) && (!ch2() || !!s.flags.monoCh2);
      w.lock = () => (cond0 && !cond0(st()) ? (typeof lock0 === 'function' ? lock0() : lock0) : garde);
    }
    R0.onEnter = async ow => {
      const s = st();
      if (!ch2() || s.flags.monoSeen) return;
      s.flags.monoSeen = true;
      ow.cine = true; ow.wilds = [];
      ow.shake = 0.8; Audio.sfx('hit');
      await say("BAM ! BAM ! Un fracas terrible résonne le long de la rive...");
      await say(`Plus loin à l'est, deux Monochromon se battent à grands coups de cornes ! Ils se disputent le chemin du lac.`);
      for (let i = 0; i < 3; i++) { ow.shake = 0.5; Audio.sfx('hit'); await DW.wait(0.35); }
      await say("Le plus petit finit par céder et s'enfuit dans les roseaux. Le vainqueur, encore furieux, se plante au milieu du chemin...");
      const rival = ow.map.npcs.find(n => n.sp === 'monochromon' && !n.mono);
      if (rival) ow.map.npcs.splice(ow.map.npcs.indexOf(rival), 1);
      const pt = ow.partner;
      if (pt) await say(`${pt.name} : Il est énorme... Sa carapace a l'air dure comme le diamant ! Il faudra le battre pour passer.`);
      ow.cine = false;
    };
  }
  async function monoFight(ow) {
    const s = st();
    await say('GRRROOOH ! (Monochromon gratte le sol, tête baissée. Il ne laissera passer personne !)', 'Monochromon');
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Soigne-le d'abord."); return; }
    if ((await DW.ask('Affronter Monochromon ? (un Champion à la carapace très dure)')) !== 0) return;
    const res = await ow.battle({ enemy: new DW.Digimon('monochromon', 21), boss: true, canLose: true, music: 'boss', intro: 'Monochromon charge, la corne en avant !' });
    if (res !== 'win') {
      await say('Monochromon est trop solide... Entraîne-toi et reviens !');
      await ow.bossDefeat("Hohoho... Tu as foncé tête baissée contre un Monochromon ? Sa carapace est dure, mais l'eau lui fait très mal. Prépare-toi, et emporte des RAM !");
      return;
    }
    s.flags.monoCh2 = true;
    ow.shake = 0.5; Audio.sfx('fanfare');
    await say("Monochromon secoue la tête... puis s'écarte du chemin en grognant. Il retourne brouter dans les roseaux. À l'ouest, le voile de données qui barrait le sentier se dissipe.");
    DW.Trophies.give('monochromon'); if (DW.Cards) DW.Cards.give('monochromon');
    s.bits += 400;
    const extra = DW.giveItem('soin_m', 2);
    await say(`Tu reçois le Trophée de Monochromon ! (Il rejoint la cave de ta maison.)  Par terre, tu trouves 2 RAM PV+ et 400 Bits.${DW.extraMsg(extra)}`);
    if (perso()) await say("Le chemin du lac est libre. On raconte qu'au Lac du Tramway, la nuit, quelqu'un joue de l'harmonica...");
    DW.autosave();
  }

  // ------------------------------------------------------------ 3) Matt, la veillée et Seadramon
  async function mattScene(ow) {
    const s = st(), f = s.flags;
    if (!f.mattMet) {
      await say("...Qui va là ? Ah. Un humain. Toi aussi, tu étais au camp d'été ?", 'Matt');
      await say(`${s.name}, c'est ça ? Moi, c'est Matt. Et lui, c'est Gabumon.`, 'Matt');
      await say('Bonsoir ! Ça fait du bien de voir quelqu\'un de gentil.', 'Gabumon');
      await say("Je cherche mon petit frère, TK. On a été séparés en tombant sur cette île... Il n'a que huit ans.", 'Matt');
      await say("Le soir, je joue de l'harmonica. Il connaît cet air par cœur. S'il l'entend... il saura que je suis là.", 'Matt');
      if ((s.kids || {}).tai) await say("Tai est chez toi ? Hmph. Toujours à foncer tête baissée, celui-là... Mais tant mieux s'il va bien.", 'Matt');
      f.mattMet = true;
    } else await say("Toujours là ? Assieds-toi, si tu veux. Le feu est assez grand pour deux.", 'Matt');
    if (!s.party.some(m => m.hp > 0)) { await say("(Ton partenaire est épuisé... Mieux vaut le soigner avant de passer la nuit ici.)"); return; }
    if ((await DW.ask('Veiller près du feu avec Matt ?', ['Oui', 'Pas maintenant'])) !== 0) { await say("Comme tu veux. Je serai là demain soir... et les suivants.", 'Matt'); return; }
    // la veillée
    ow.cine = true; ow.wilds = [];
    await DW.fade(0.55, 0.8);
    Audio.play('harmonica');
    await say("Vous restez près du feu. Matt joue de l'harmonica ; le lac est noir et calme. Les Digimon s'endorment l'un contre l'autre...");
    await DW.fade(0, 0.8);
    Audio.sfx('select');
    await say("CRAC ! Une bûche s'effondre. Une braise s'envole... et retombe sur une grande feuille rouge qui flottait au bord de l'île, dans le noir.");
    ow.shake = 1.2; Audio.sfx('roar');
    await say("La « feuille » se tord de douleur ! L'île tout entière tremble...");
    // Seadramon jaillit du lac, à l'est de l'île
    const S = { sp: 'seadramon', x: 56 * TS, y: 53 * TS, s: 0.5, sil: true, flip: true, shadow: 0 };   // (tourné vers l'île, à l'ouest)
    ow.flyers = [S];
    Audio.sfx('swoosh');
    await DW.tween(S, { y: 46 * TS, s: 1, sil: false }, 1.2, t => t * (2 - t));
    S.sil = false;
    ow.shake = 1; Audio.play('seadramon');
    await say("Ce n'était pas une feuille : c'était le bout de la queue de SEADRAMON, endormi sous l'île ! Et l'île... dérive vers le milieu du lac !");
    await say('QUI OSE ME BRÛLER LA QUEUE ?! JE VAIS VOUS ENGLOUTIR !', 'Seadramon');
    await say('Gabumon, attention !', 'Matt');
    Audio.sfx('hit'); ow.shake = 0.6;
    await say("Gabumon se jette sur Seadramon... et se fait balayer d'un coup de queue !");
    await say(`${s.name} ! Gabumon est trop faible pour lui... Aide-nous !`, 'Matt');
    ow.flyers = null; ow.cine = false;
    const res = await ow.battle({
      enemy: new DW.Digimon('seadramon', 26), boss: true, canLose: true, music: 'seadramon', intro: 'Seadramon dresse sa tête au-dessus des vagues !',
      ally: { at: 0.4, from: 'gabumon', sp: 'garurumon', lvl: 19, hero: 'matt', name: 'Matt', move: 'flamme_bleue',
        join: "« GABUMOOON ! » Le Digivice de Matt s'illumine... GABUMON DIGIVOLUE EN... GARURUMON !" },
    });
    if (res !== 'win') {
      await say("Seadramon est bien trop fort... Une vague énorme balaie l'île !");
      await ow.bossDefeat("Hohoho... Des Gomamon t'ont repêché et ramené sur la rive. Matt et Gabumon s'en sont sortis, eux aussi : ils retournent camper sur l'île chaque nuit. Prépare-toi bien avant d'y retourner !");
      return;
    }
    await victory(ow);
  }

  // ------------------------------------------------------------ 4) victoire : cinématique, Matt délivré, fin du chapitre
  async function victory(ow) {
    const s = st();
    s.flags.seadramon = true;
    s.gears = s.gears || {}; s.gears.lac = true;   // (l'Engrenage Noir du lac est brisé : Shellmon, à la Pointe Coela, peut venir en ville)
    DW.Crests.freeKid('matt');
    await Game.push(new SeadramonCinema());
    // l'aube, sur l'île revenue contre la rive
    const h = DW.Time.hour(), day = Math.floor(s.clock / 1440);
    s.clock = (h >= 20 ? day + 1 : day) * 1440 + 6 * 60;
    // (la veillée compte comme une nuit : avant, le partenaire s'effondrait de fatigue chez Jijimon, « nuit blanche »)
    for (const d of s.party) { d.slept = s.clock; d.tired = 0; }
    s.careClock = s.clock;
    await ow.charger('lac2', 47, 49, 'up');
    const kids = [];
    const free = [[45, 49], [49, 49], [44, 50], [50, 50]].filter(([x, y]) => !ow.solid(x, y));
    if (free[0]) kids.push({ hero: 'matt', x: free[0][0], y: free[0][1], face: 'right', talk: () => {} });
    if (free[1]) kids.push({ sp: 'gabumon', x: free[1][0], y: free[1][1], face: 'left', talk: () => {} });
    ow.map.npcs.push(...kids);
    Audio.play('harmonica');
    await DW.fade(0, 0.8);
    await say("...Merci. Sans toi, Gabumon et moi, on serait au fond du lac.", 'Matt');
    await say("Matt ! J'ai digivolué ! Tu as vu ? Garurumon ! C'était moi !", 'Gabumon');
    await say("Ouais. J'ai vu. ...Tu as été génial.", 'Matt');
    await say(`Tout seul, je ne retrouverai jamais TK. ${s.name}... La Ville des Fichiers, c'est ça ? D'accord, je viens chez toi. Mais au moindre signe de TK, je repars le chercher.`, 'Matt');
    if ((s.kids || {}).tai) await say("Et si Tai me cherche des histoires, je dors dehors. Hmph.", 'Matt');
    DW.Audio.sfx('fanfare');
    await say("Matt et Gabumon s'installent dans une chambre de ta maison !");
    for (const k of kids) ow.map.npcs.splice(ow.map.npcs.indexOf(k), 1);
    // Seadramon, libéré de son Engrenage Noir, devient le passeur de la ville
    await say("Au bord de l'eau, Seadramon sort la tête du lac, l'air penaud. Une marque noire a disparu de son cou.");
    await say("Grmbl... Pardon pour la queue. Enfin, pour vous avoir attaqués. Cet engrenage me brûlait la tête... Je vous dois une fière chandelle.", 'Seadramon');
    await DW.Town.recruit('seadramon');
    DW.Trophies.give('seadramon'); Audio.sfx('fanfare');
    if (DW.Cards) { DW.Cards.give('seadramon'); DW.Cards.give('garurumon'); DW.Cards.give('gabumon'); }
    s.party.forEach(m => m.heal());
    const extra = DW.giveItem('soin_m', 3) + DW.giveItem('pm_m', 2); s.bits += 1000;
    await say(`Tu reçois le Trophée de Seadramon !  Dans le sac de Matt, il y avait 3 RAM PV+, 2 RAM PM+ et 1000 Bits : « Prends-les, j'en ai plus besoin. »${DW.extraMsg(extra)}`);
    await DW.fade(1, 0.8);
    await ow.charger('maison', 12, 5, 'down');
    await DW.wait(0.3);
    await DW.fade(0, 0.8);
    DW.autosave();
    await end2();
  }

  // ------------------------------------------------------------ cinématique : Renard de feu, l'île qui revient, l'aube
  class SeadramonCinema extends DW.ShellmonCinema {
    async run() {
      const s = st(), pt = s.party.find(m => m.hp > 0) || s.party[0];
      this.pt = pt ? pt.sp : 'agumon';
      this.v.beam = 0; this.v.drift = 0;
      DW.tween(this.bars, { v: 1 }, 0.8);
      await DW.fade(0, 0.6);
      // 1) la nuit sur le lac : Garurumon contre Seadramon
      DW.tween(this.v, { shake: 1 }, 0.8);
      await this.show("Garurumon bondit de l'île, sa fourrure brillant sous la lune...", 2.4);
      Audio.sfx('swoosh');
      await DW.tween(this.v, { beam: 1 }, 0.6);
      await this.show('« RENARD DE FEU ! »', 1.6);
      Audio.sfx('roar'); this.flash = 1;
      await DW.tween(this.v, { boom: 1 }, 1.4);
      // 2) l'Engrenage Noir
      this.v.shake = 0;
      await this.cut('gear', 0.9);
      Audio.stop(); Audio.sfx('evolve');
      await DW.tween(this.v, { gear: 1 }, 1.4);
      await this.show("Un Engrenage Noir s'arrache du cou de Seadramon...", 2.2);
      Audio.sfx('hit');
      await DW.tween(this.v, { data: 1 }, 2.4, DW.linear);
      await this.show('... et se désagrège en éclats de données.', 2);
      // 3) les Gomamon ramènent l'île contre la rive
      await this.cut('drift', 1);
      Audio.play('beach');
      DW.tween(this.v, { drift: 1 }, 5, DW.linear);
      await this.show("Les Gomamon du lac ont tout vu. Ils appellent les poissons... et poussent l'île, tout doucement, jusqu'à la rive.", 3.4);
      // 4) l'aube et l'harmonica
      await this.cut('dawn', 1.2);
      Audio.play('harmonica');
      DW.tween(this.v, { sun: 1 }, 7);
      await DW.wait(1.2);
      await this.show(`Le soleil se lève sur le lac. Matt joue de l'harmonica ; ${s.name}, Gabumon et ${pt ? pt.name : 'ton partenaire'} écoutent en silence.`, 3.2);
      await this.show("« TK... Où que tu sois, tiens bon. Je vais te retrouver. »", 3);
      await DW.fade(1, 0.9);
      this.bars.v = 0;
    }
    // la nuit sur le lac (plan 1)
    drawCave(c, t) {
      const v = this.v;
      this.lakeNight(c, t);
      // Seadramon dressé au-dessus des vagues
      const sd = DW.Sprites.battle('seadramon');
      c.save(); c.globalAlpha = 1 - v.boom * 0.85;
      DW.Sprites.draw(c, sd, 228 + Math.sin(t * 30) * 3 * v.shake * (1 - v.boom), 150 + v.boom * 50, { frame: Math.floor(t * 6), scale: 1.2, flip: true, white: v.boom > 0.05 ? Math.min(1, v.boom * 2) : 0 });   // (face à Garurumon)
      c.restore();
      // Garurumon sur l'île
      DW.Sprites.draw(c, DW.Sprites.battle('garurumon'), 96, 172, { frame: Math.floor(t * 6), scale: 0.6 });
      // le Renard de feu : un torrent de flammes bleues
      if (v.beam > 0 && v.boom < 1) {
        const x0 = 122, y0 = 138, x1 = DW.lerp(x0, 222, v.beam), y1 = DW.lerp(y0, 110, v.beam);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) { c.strokeStyle = `rgba(${90 + i * 20},${180 + i * 10},255,${0.5 - i * 0.07})`; c.lineWidth = 16 - i * 2.4 + Math.sin(t * 40 + i) * 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
        c.restore();
      }
      if (v.boom > 0) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = 16 + v.boom * 60; c.fillStyle = `rgba(200,230,255,${0.5 * (1 - v.boom)})`; c.beginPath(); c.arc(228 + Math.cos(a) * r, 160 + Math.sin(a) * r * 0.35, 6 + v.boom * 6, 0, 7); c.fill(); }
    }
    lakeNight(c, t, island = 1) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#060a1e'); g.addColorStop(0.5, '#141e46'); g.addColorStop(1, '#0a1430');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t * 2 + i)})`; c.fillRect((i * 53) % W, (i * 29) % 90, 1, 1); }
      c.fillStyle = '#f0f0d8'; c.beginPath(); c.arc(262, 40, 12, 0, 7); c.fill();
      c.fillStyle = '#0c1838'; c.fillRect(0, 120, W, H - 120);
      for (let i = 0; i < 16; i++) { c.fillStyle = 'rgba(200,220,255,0.18)'; c.fillRect((i * 41 + t * 8) % W, 128 + (i * 13) % 80, 14, 1); }
      c.fillStyle = 'rgba(240,240,200,0.25)'; for (let i = 0; i < 8; i++) c.fillRect(256 - i * 2 + Math.sin(t * 3 + i) * 3, 126 + i * 6, 12 + i * 2, 1);
      // l'île, le tramway et le feu
      const ix = 70 * island;
      c.fillStyle = '#1a2a18'; c.beginPath(); c.ellipse(ix + 20, 176, 76, 16, 0, 0, 7); c.fill();
      c.fillStyle = '#2a2420'; c.fillRect(ix - 40, 144, 64, 26); c.fillStyle = '#3a6a4a'; c.fillRect(ix - 42, 140, 68, 6);
      for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(255,220,140,0.55)'; c.fillRect(ix - 36 + i * 12, 150, 8, 8); }
      const f = 0.8 + 0.2 * Math.sin(t * 13);
      const rg = c.createRadialGradient(ix + 44, 168, 2, ix + 44, 168, 40 * f); rg.addColorStop(0, 'rgba(255,170,70,0.6)'); rg.addColorStop(1, 'rgba(255,120,40,0)');
      c.fillStyle = rg; c.fillRect(ix, 120, 90, 90);
      c.fillStyle = '#ffb040'; c.beginPath(); c.ellipse(ix + 44, 166, 3 * f, 6 * f, 0, 0, 7); c.fill();
    }
    // plans 3 (l'île poussée vers la rive) et 4 (l'aube)
    drawBeach(c, t) {
      const v = this.v;
      if (this.mode === 'drift') {
        this.lakeNight(c, t, 1 + (1 - v.drift) * 1.4);
        const ix = 70 * (1 + (1 - v.drift) * 1.4);
        // la rive, à gauche, que l'île rejoint
        c.fillStyle = '#16261a'; c.fillRect(0, 150, 26, H - 150);
        for (let i = 0; i < 4; i++) DW.Sprites.draw(c, DW.Sprites.battle('gomamon'), ix + 70 + (i % 2) * 22, 196 + Math.sin(t * 4 + i) * 2 + (i >> 1) * 10, { frame: Math.floor(t * 6) + i, scale: 0.35, flip: true });
        return;
      }
      // l'aube
      const g = c.createLinearGradient(0, 0, 0, 140); g.addColorStop(0, '#3a4a8a'); g.addColorStop(0.55, '#e88a6a'); g.addColorStop(1, '#ffd890');
      c.fillStyle = g; c.fillRect(0, 0, W, 140);
      const sy = 136 - v.sun * 46;
      const rg = c.createRadialGradient(W / 2 + 40, sy, 4, W / 2 + 40, sy, 70); rg.addColorStop(0, '#fff8d0'); rg.addColorStop(0.3, '#ffd070'); rg.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = rg; c.fillRect(0, 0, W, 140);
      c.fillStyle = '#fff0b0'; c.beginPath(); c.arc(W / 2 + 40, sy, 14, 0, 7); c.fill();
      c.fillStyle = '#5a6aa0'; c.fillRect(0, 128, W, 44);
      for (let i = 0; i < 16; i++) { c.fillStyle = `rgba(255,230,170,${0.3 + 0.3 * Math.sin(t * 2 + i)})`; c.fillRect(W / 2 + 20 + Math.sin(i * 7) * 40, 132 + i * 2, 22 - i, 1); }
      c.fillStyle = '#1c1a20'; c.fillRect(0, 170, W, H - 170);
      c.fillStyle = '#141218'; c.fillRect(30, 140, 60, 30); c.fillRect(28, 136, 64, 5);
      const sil = (img, x, y, w, h) => { const cv = DW.Art.canvas(w, h), x2 = cv.getContext('2d'); x2.drawImage(img, 0, 0, w, h); x2.globalCompositeOperation = 'source-in'; x2.fillStyle = '#16121a'; x2.fillRect(0, 0, w, h); c.drawImage(cv, Math.round(x - w / 2), Math.round(y - h)); };
      const me = DW.Sprites.hero('up', 0), mt = DW.Sprites.hero('up', 0, 'matt');
      sil(me.img, 150, 194, me.w * 1.6, me.h * 1.6);
      sil(mt.img, 188, 194, mt.w * 1.6, mt.h * 1.6);
      const ps = DW.Sprites.battle(this.pt), gb = DW.Sprites.battle('gabumon');
      const k1 = Math.min(0.7, 40 / ps.h), k2 = Math.min(0.7, 34 / gb.h);   // (un Champion ne cache pas les enfants)
      sil(ps.img, 116, 196, ps.w * k1, ps.h * k1);
      sil(gb.img, 222, 196, gb.w * k2, gb.h * k2);
      // notes d'harmonica qui s'envolent
      c.font = UI.font(9);
      for (let i = 0; i < 4; i++) { const k = (t * 0.4 + i / 4) % 1; c.fillStyle = `rgba(255,240,200,${1 - k})`; c.fillText('♪', 196 + Math.sin(k * 6 + i) * 8 + k * 20, 150 - k * 60); }
    }
  }
  DW.SeadramonCinema = SeadramonCinema;

  // ------------------------------------------------------------ fin du chapitre 2
  async function end2() {
    const s = st();
    if ((s.flags.chapter || 1) >= 3) return;
    s.flags.chapter = 3;
    Audio.play('victory');
    await DW.wait(0.8);
    await Game.push(new DW.ChapterScene('FIN DU CHAPITRE 2', 'Le Lac et le Loup', s.hero === 'perso' ? 'Matt et Garurumon sont libres. Mais où est TK ?' : 'Seadramon est libéré : le lac respire de nouveau.'));
    const m = s.party[0], T = DW.Town, rec = T.RECRUITS.filter(r => T.has(r.id)).length;
    const days = Math.floor(s.clock / 1440) + 1, wins = s.party.reduce((a, d) => a + (d.wins || 0), 0);
    const tm = Math.floor((s.time || 0) / 60), hm = `${Math.floor(tm / 60)} h ${String(tm % 60).padStart(2, '0')}`;
    const kids = Object.keys(s.kids || {}).filter(k => s.kids[k]).length;
    await Game.push(new DW.RecapScene([
      ['Jours passés sur l\'île', String(days)],
      ['Temps de jeu', hm],
      ['Partenaire', m ? `${m.name} · N.${m.level}` : '-'],
      ['Habitants revenus en ville', `${rec} / ${T.RECRUITS.length}`],
      ['Développement de la ville', `${T.progress()} %`],
      ['Combats gagnés', String(wins)],
      ['Monochromon', s.flags.monoCh2 ? 'vaincu !' : '-'],
      ['Seadramon', 'libéré !'],
      ['Enfants retrouvés', `${kids} / ${DW.Crests.ORDER.filter(k => k !== s.hero).length}`],
      ['Bits', String(s.bits)],
    ], 'BILAN DU CHAPITRE 2', { hero: 'matt', sp: 'gabumon' }));
    await say("Hohoho ! Matt est un garçon bien taciturne... mais il a bon cœur. Il est monté direct dans sa chambre.", 'Jijimon');
    await say("Son petit frère, TK... Je n'en ai pas entendu parler. Mais l'île est grande. Garde l'œil ouvert, et demande à Biyomon : elle a des nouvelles de partout.", 'Jijimon');
    await say("Hm ? Un grand panache de fumée s'élève à l'ouest, par-delà la forêt... Du côté du Mont Miharashi. Ça ne me dit rien qui vaille.", 'Jijimon');
    await say("Le voile de données s'est levé à l'ouest de la Clairière de l'Arrivée et du Sentier des Murmures. Un désert, puis un village... Va voir !", 'Jijimon');
    await Game.push(new DW.ChapterScene('CHAPITRE 3', 'La Montagne de Feu', 'Un brasier vivant dévale les pentes du Mont Miharashi... et une fille au chapeau bleu a été vue tout près.'));
    DW.autosave();
  }

  // ------------------------------------------------------------ objectifs (« Précédemment... »)
  const obj1 = DW.Chapter.objective;
  DW.Chapter.objective = () => {
    const s = st(), f = s.flags;
    if (!ch2() || !perso()) return obj1();
    if (!f.monoCh2) return "Le chemin du grand lac est ouvert, au nord de la Clairière de l'Arrivée. Mais un Monochromon furieux garde la Rive Sud : il faudra le vaincre pour passer.";
    if (!kidMatt()) return "Au Lac du Tramway, une île porte un vieux tramway. La nuit (20 h - 5 h), on y entend un harmonica... Va voir qui campe là-bas.";
    if ((f.chapter || 1) < 3) return "Matt et Gabumon vivent chez toi.";
    return "Matt et Gabumon vivent chez toi. Matt cherche son petit frère, TK... Et une fumée inquiétante s'élève à l'ouest de la forêt, du côté du Mont Miharashi.";
  };
  Object.assign(DW.Chapter, { end2, monoFight, mattScene });
})();
;

// ===== js/game/chapitre3.js
'use strict';
// =====================================================================
//  CHAPITRE 3 — « La Montagne de Feu » (saison 1, épisode 4 : Birdramon)
//  1) À l'ouest de la forêt, les déserts aux poteaux télégraphiques mènent au Village des Yokomon.
//  2) La fontaine du village est à sec, le petit lac presque vide autour de la vieille épave :
//     Meramon, le gardien du Mont Miharashi, est devenu fou et brûle tout. Sora et Biyomon aident les Yokomon.
//  3) Au sommet du Mont Miharashi, combat contre Meramon ; Biyomon digivolue en Birdramon (à 40 % des PV)
//     et vient t'aider. L'Engrenage Noir se brise, Meramon s'excuse et part ouvrir le Restaurant en ville.
//  4) L'eau revient au village, Sora s'installe chez toi. Bilan, puis le carton du chapitre 4.
//  (cartes : région « miharashi » de maps/regions.js ; décors : gfx/desert.js)
// =====================================================================
(function () {
  const { Audio, Game } = DW;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const MAPS = DW.MAPS;
  const perso = () => st().hero === 'perso';
  const ch3 = () => (st().flags.chapter || 1) >= 3;
  const freed = () => !!st().flags.meramon;
  const soraHere = s => perso() && ch3() && !(s.kids || {}).sora && !s.flags.meramon;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ------------------------------------------------------------ 1-2) le Village des Yokomon
  const V = MAPS.miharashi1;
  if (V) {
    V.populate = function () {
      // la fontaine coule de nouveau une fois Meramon calmé
      const f = this.objects.find(o => o.kind === 'stonefountain'), v = freed() ? 1 : 0;
      if (f && f.v !== v) { f.v = v; if (this.gfx) DW.World.unprepare(this); }
      if (this.ch3Set) return;
      this.ch3Set = true;
      const at = (x, y) => DW.MapKit.freeNear(this, x, y);   // (la place prévue peut être prise par une hutte de l'auberge)
      const folk = (X, Y, lines) => { const [x, y] = at(X, Y); return { sp: 'yokomon', x, y, face: 'down', wander: 2, talk: async () => { await say(pick(lines()), 'Yokomon'); } }; };
      this.npcs.push(
        { sp: 'yokomon', x: at(51, 32)[0], y: at(51, 32)[1], face: 'left', talk: () => chief() },
        folk(43, 36, () => freed() ? ["L'eau ! L'eau est revenue ! Mes fleurs vont refleurir !", "Meramon est venu s'excuser. Il avait l'air tout gêné, hihi."] : ["Il fait si chaud... Mes pétales se dessèchent.", "La nuit, on voit des flammes au sommet du Mont Miharashi."]),
        folk(54, 37, () => freed() ? ['On va faire une grande fête autour de la fontaine !'] : ["Le lac a presque séché. On voit même la vieille épave, au milieu !", "On dit que ce bateau est là depuis toujours. Personne ne sait d'où il vient."]),
        folk(45, 40, () => freed() ? ['Merci, merci, merci !'] : ["Meramon était gentil, avant... Il veillait sur la montagne.", "Une drôle de chose noire est tombée du ciel sur le Mont Miharashi. Depuis, Meramon a changé."]),
        folk(52, 41, () => ["Les poteaux du désert ? Ils étaient là avant nous. Leur vieille ligne arrive jusqu'au village... mais personne ne sait d'où elle part.", "Bienvenue au Village des Yokomon !"]),
        // la jardinière : une fois l'eau revenue, le mini-jeu d'arrosage (game/minijeux.js)
        { sp: 'yokomon', x: at(40, 37)[0], y: at(40, 37)[1], face: 'right', cond: () => freed(), talk: () => DW.MiniJeux.arrosage('Yokomon jardinière') },
        { hero: 'sora', x: at(43, 32)[0], y: at(43, 32)[1], face: 'right', cond: soraHere, talk: ow => soraTalk(ow) },
        { sp: 'biyomon', x: at(44, 33)[0], y: at(44, 33)[1], face: 'left', cond: soraHere, talk: async () => { await say(st().flags.soraMet ? "Je protégerai Sora ! Même contre Meramon !" : "Cui ! Tu viens de la forêt ? Va parler à Sora, elle cherche de l'aide !", 'Biyomon'); } },
      );
    };
    V.onEnter = async ow => {
      const s = st();
      if (!ch3() || s.flags.yokoVillage) return;
      s.flags.yokoVillage = true;
      ow.cine = true;
      await say("Des huttes de chaume rondes autour d'une fontaine de pierre... Des dizaines de Yokomon lèvent la tête vers toi.");
      await say("Un visiteur ! Bienvenue au Village des Yokomon ! ...Pardon pour l'accueil, on n'a plus une goutte d'eau à t'offrir.", 'Yokomon');
      if (soraHere(s)) await say("Près de la fontaine, une fille au chapeau bleu aide les Yokomon à arroser leurs fleurs avec un seau presque vide...");
      ow.cine = false;
    };
  }
  async function chief() {
    const s = st();
    if (!ch3()) { await say("Bienvenue au Village des Yokomon ! On vit tranquilles, ici, entre le désert et la montagne.", 'Yokomon'); return; }
    // (seule la fontaine change à l'écran : le petit lac, lui, se remplira avec le temps — comme le disent l'épave et la
    //  quête du trésor, game/quetes.js)
    if (freed()) { await say("La fontaine coule de nouveau ! Et notre source recommence à remplir le petit lac, goutte après goutte : il lui faudra du temps. Tout ça grâce à toi. Le Village des Yokomon ne t'oubliera jamais !", 'Yokomon'); return; }
    await say("Je suis l'ancien du village. Écoute bien : Meramon, le gardien du Mont Miharashi, a perdu la tête.", 'Yokomon');
    await say("Ses flammes ont tari notre source. La fontaine est à sec, et le petit lac a presque disparu autour de la vieille épave.", 'Yokomon');
    await say("Le Mont Miharashi est à l'ouest, au bout de la route. Si tu y montes... sois prudent. Meramon grandit à chaque coup qu'il reçoit !", 'Yokomon');
    if (!s.flags.soraMet && soraHere(s)) await say("Parle donc à la jeune fille près de la fontaine. Elle et son oiseau rose nous aident depuis des jours.", 'Yokomon');
  }
  async function soraTalk() {
    const s = st(), f = s.flags;
    if (!f.soraMet) {
      await say("Oh ! Un humain ! Toi aussi, tu es tombé sur cette île ? Je m'appelle Sora. Et voici Biyomon.", 'Sora');
      await say('Cui ! Enchantée !', 'Biyomon');
      await say(`${s.name}... C'est joli. Moi, j'étais au camp d'été avec les autres. On a tous été séparés.`, 'Sora');
      if ((s.kids || {}).tai) await say("Tai est chez toi ? Ça ne m'étonne pas qu'il ait foncé droit dans les ennuis... Je suis contente qu'il aille bien.", 'Sora');
      if ((s.kids || {}).matt) await say("Et Matt aussi ? Il doit être soulagé... même s'il ne le montrera jamais.", 'Sora');
      await say("Les Yokomon n'ont plus d'eau à cause de Meramon. Je ne peux pas les laisser tomber.", 'Sora');
      await say("Biyomon n'arrive pas encore à digivoluer... Mais si on monte ensemble au Mont Miharashi, on peut y arriver. Je viens avec toi !", 'Sora');
      f.soraMet = true;
      DW.autosave();
    } else await say("On y va quand tu veux. Le Mont Miharashi est à l'ouest, après la route. Biyomon et moi, on te suit !", 'Sora');
  }

  // ------------------------------------------------------------ 3) le Mont Miharashi et Meramon
  const M = MAPS.miharashi4;
  if (M) {
    M.signs = M.signs || {};
    const MT = DW.Mih.MONT;   // (positions de la carte dessinée : maps/miharashi.js)
    M.signs[(MT.crater[0] + 5) + ',' + (MT.crater[1] + 5)] = "Le cratère du Mont Miharashi. Une chaleur terrible en monte.";
    M.populate = function () {
      if (this.ch3Set) return;
      this.ch3Set = true;
      this.npcs.push({ sp: 'meramon', x: MT.meramon[0], y: MT.meramon[1], face: 'down', gear: true, cond: s => ch3() && !s.flags.meramon, talk: ow => meramonFight(ow) });
    };
    M.onEnter = async ow => {
      const s = st();
      if (!ch3() || s.flags.meramon || s.flags.mihaFire) return;
      s.flags.mihaFire = true;
      ow.shake = 0.6; Audio.sfx('roar');
      await say("La montagne gronde... Tout là-haut, au bord du cratère, un brasier vivant hurle de rage.");
      if (s.flags.soraMet && soraHere(s)) await say("C'est lui, Meramon ! Il faut monter tout en haut, gradin après gradin. Courage !", 'Sora');
    };
  }
  async function meramonFight(ow) {
    const s = st(), withSora = !!s.flags.soraMet && soraHere(s);
    ow.shake = 0.8; Audio.sfx('roar');
    await say('JE BRÛLE ! TOUT BRÛLE ! VOUS ALLEZ BRÛLER AVEC MOI !', 'Meramon');
    await say("Dans son dos, un Engrenage Noir tourne en crissant... C'est lui qui le rend fou !");
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Soigne-le d'abord."); return; }
    if ((await DW.ask('Affronter Meramon ? (un Champion de feu qui grandit à chaque coup)')) !== 0) return;
    const res = await ow.battle({
      enemy: new DW.Digimon('meramon', 30), boss: true, canLose: true, music: 'boss', intro: 'Meramon déchaîne ses flammes !',
      grows: 'Meramon absorbe le choc... et ses flammes grandissent encore !',
      ally: withSora ? { at: 0.4, from: 'biyomon', sp: 'birdramon', lvl: 24, hero: 'sora', name: 'Sora', move: 'meteore',
        join: "« BIYOMOOON ! » Le Digivice de Sora s'illumine... BIYOMON DIGIVOLUE EN... BIRDRAMON !" } : null,
    });
    if (res !== 'win') {
      await say('Les flammes de Meramon sont trop fortes...');
      await ow.bossDefeat("Hohoho... Tu t'es brûlé les ailes, on dirait. Meramon est un Digimon de feu : l'eau et la terre lui font mal. Entraîne-toi bien avant d'y retourner !");
      return;
    }
    await victory(ow, withSora);
  }

  // ------------------------------------------------------------ 4) victoire : l'eau revient, Sora délivrée, fin du chapitre
  async function victory(ow, withSora) {
    const s = st();
    s.flags.meramon = true;
    s.gears = s.gears || {}; s.gears.miharashi = true;   // (l'Engrenage Noir de Meramon est brisé : il compte pour le Pays de Meramon, game/story.js)
    ow.shake = 1; Audio.sfx('super');
    await say("L'Engrenage Noir jaillit du dos de Meramon... et se brise en éclats de données !");
    await say("Ouh... ma tête... Qu'est-ce que j'ai fait ? Ces flammes... ce n'étaient pas les miennes. Une chose noire m'est tombée dessus, du ciel.", 'Meramon');
    await say("Les Yokomon... leur source... Je dois réparer ça. Pardon. Pardon à tous.", 'Meramon');
    if (withSora) {
      await say("Birdramon se pose doucement au bord du cratère... et redevient Biyomon, épuisée mais fière.");
      await say("Sora ! Tu as vu ? J'ai digivolué ! Je t'ai protégée !", 'Biyomon');
      await say("Oui, je t'ai vue. ...Merci, Biyomon. Tu as été formidable.", 'Sora');
      DW.Crests.freeKid('sora');
    }
    DW.Trophies.give('meramon');
    if (DW.Cards) { DW.Cards.give('meramon'); DW.Cards.give('birdramon'); DW.Cards.give('biyomon'); }
    s.party.forEach(m => m.heal());
    // retour au village : l'eau jaillit de nouveau
    await DW.fade(1, 0.8);
    await ow.charger('miharashi1', 48, 34, 'up');
    await DW.wait(0.2);
    await DW.fade(0, 0.8);
    Audio.play('victory');
    await say("Au village, la fontaine se met à gargouiller... puis l'eau jaillit en deux grands arcs ! Les Yokomon dansent autour, en criant de joie.");
    await say("Meramon est descendu de la montagne pour s'excuser. Le feu qui asséchait la source s'est éteint pour de bon... et pour se faire pardonner, il veut cuisiner pour tout le monde, à la Ville des Fichiers !");
    if (perso() && !withSora && !(s.kids || {}).sora) {   // (vaincu sans elle : Sora et Biyomon accourent quand même)
      await say("Une fille au chapeau bleu accourt avec un oiseau rose : « Tu as calmé Meramon tout seul ?! Je m'appelle Sora, et voici Biyomon. On aidait les Yokomon... »", 'Sora');
      DW.Crests.freeKid('sora');
      withSora = true;
    }
    if (withSora) {
      await say(`${s.name}... Merci. Sans toi, je n'aurais jamais osé monter là-haut.`, 'Sora');
      await say("Tu habites à la Ville des Fichiers ? D'accord, on vient ! Il y a sûrement des gens qui ont besoin d'un coup de main, là-bas aussi.", 'Sora');
      Audio.sfx('fanfare');
      await say('Sora et Biyomon s\'installent dans une chambre de ta maison !');
    }
    if (!DW.Town.has('meramon')) await DW.Town.recruit('meramon');
    const extra = DW.giveItem('soin_m', 3) + DW.giveItem('pm_m', 2) + DW.giveItem('gants_flamme'); s.bits += 1500;
    await say(`Tu reçois le Trophée de Meramon !  Les Yokomon t'offrent 3 RAM PV+, 2 RAM PM+ et 1500 Bits : « Pour notre héros ! »  Meramon te confie ses Gants de flamme (une arme : donne-la à un Digimon depuis le sac).${DW.extraMsg(extra)}`);
    await DW.fade(1, 0.8);
    await ow.charger('maison', 12, 5, 'down');
    await DW.wait(0.3);
    await DW.fade(0, 0.8);
    DW.autosave();
    await end3();
  }

  // ------------------------------------------------------------ fin du chapitre 3
  async function end3() {
    const s = st();
    if ((s.flags.chapter || 1) >= 4) return;
    s.flags.chapter = 4;
    Audio.play('victory');
    await DW.wait(0.8);
    await Game.push(new DW.ChapterScene('FIN DU CHAPITRE 3', 'La Montagne de Feu', "Birdramon a calmé Meramon. L'eau coule de nouveau au Village des Yokomon."));
    const m = s.party[0], T = DW.Town, rec = T.RECRUITS.filter(r => T.has(r.id)).length;
    const days = Math.floor(s.clock / 1440) + 1, wins = s.party.reduce((a, d) => a + (d.wins || 0), 0);
    const tm = Math.floor((s.time || 0) / 60), hm = `${Math.floor(tm / 60)} h ${String(tm % 60).padStart(2, '0')}`;
    const kids = Object.keys(s.kids || {}).filter(k => s.kids[k]).length;
    await Game.push(new DW.RecapScene([
      ['Jours passés sur l\'île', String(days)],
      ['Temps de jeu', hm],
      ['Partenaire', m ? `${m.name} · N.${m.level}` : '-'],
      ['Habitants revenus en ville', `${rec} / ${T.RECRUITS.length}`],
      ['Développement de la ville', `${T.progress()} %`],
      ['Combats gagnés', String(wins)],
      ['Meramon', 'calmé !'],
      ['Enfants retrouvés', `${kids} / ${DW.Crests.ORDER.filter(k => k !== s.hero).length}`],
      ['Bits', String(s.bits)],
    ], 'BILAN DU CHAPITRE 3', { hero: 'sora', sp: 'biyomon' }));
    await say("Hohoho ! Meramon ouvre un restaurant en ville ? Tout ce qu'il cuit sera bien grillé, ça c'est sûr !", 'Jijimon');
    if ((s.kids || {}).sora) await say("Et Sora... Une jeune fille qui a du cœur. Elle a déjà réorganisé la cuisine de ta maison, hohoho.", 'Jijimon');
    await say("Ces Engrenages Noirs qui tombent du ciel... Quelqu'un les lance sur l'île. Il faudra découvrir qui.", 'Jijimon');
    // (le chapitre 4 n'est pas encore écrit : on l'annonce sans faire croire qu'il commence)
    await Game.push(new DW.ChapterScene('À SUIVRE...', "Chapitre 4 : L'Insecte Électrique", "Des éclairs dans la forêt... La suite de l'aventure arrive bientôt."));
    DW.autosave();
  }

  // ------------------------------------------------------------ objectifs (« Précédemment... »)
  const obj2 = DW.Chapter.objective;
  DW.Chapter.objective = () => {
    const s = st(), f = s.flags;
    if (!ch3() || !perso()) return obj2();
    if (f.meramon) return "Meramon est calmé, l'eau coule de nouveau au Village des Yokomon." + ((s.kids || {}).sora ? ' Sora et Biyomon vivent chez toi.' : '');
    if (!f.yokoVillage) return "À l'ouest de la Clairière de l'Arrivée et du Sentier des Murmures, la forêt s'ouvre sur un désert hérissé de poteaux... Un village se cache au-delà.";
    if (!f.soraMet) return "Au Village des Yokomon, la fontaine est à sec. Une fille au chapeau bleu aide les habitants : va lui parler.";
    return "Meramon, fou de rage, brûle tout depuis le sommet du Mont Miharashi, à l'ouest du Village des Yokomon. Monte le calmer avec Sora et Biyomon !";
  };
  Object.assign(DW.Chapter, { end3, meramonFight });
})();
;

// ===== js/game/quetes.js
'use strict';
// =====================================================================
//  QUÊTES ANNEXES DES CHAPITRES 2 ET 3 (histoires du jeu, pas de l'animé)
//  - chapitre 2, « Les Bukamon égarés » : sur la Rive Sud, après Monochromon, un Gomamon a perdu ses trois petits
//    Bukamon le long des rives du lac (lac1, lac4, la Cascade du Dragon lac6). Les retrouver : du poisson, un Disque PM,
//    des Bits... et le secret de la langue de sable qui mène, la nuit, à l'île du vieux tramway (et à Matt) ;
//  - chapitre 3, « La soif des Yokomon » : à l'oasis du Désert des Poteaux, un Yokomon parti chercher de l'eau pour son
//    village s'est effondré. Une Eau fraîche le remet sur pied : il montre le chemin du village (une Pomme bleue, des Bits) ;
//  - chapitre 3, « Le trésor de l'épave » : une fois Meramon calmé, l'eau revient au petit lac du Village des Yokomon ;
//    quelque chose brille dans la vieille épave. Un passage de planches mène au banc de sable (maps/miharashi.js).
//  Les personnages des quêtes sont posés à chaque arrivée sur leur carte (Overworld.load), près du carrefour.
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const f = () => st().flags;
  const ch = () => f().chapter || 1;
  const perso = () => st().hero === 'perso';
  const Audio = DW.Audio;

  // ------------------------------------------------------------ chapitre 2 : les Bukamon égarés
  const BUKA = { lac1: 1, lac4: 2, lac6: 4 };   // (un bit par Bukamon retrouvé : flags.bukaTrouves)
  const trouves = () => Object.values(BUKA).filter(b => (f().bukaTrouves || 0) & b).length;
  async function gomamon() {
    const F = f();
    if (!F.bukaQuete) {
      await say("Hé, toi ! C'est toi qui as fait fuir Monochromon ? Alors tu es courageux... Mes trois petits Bukamon ont suivi un banc de poissons le long des rives, vers l'ouest.", 'Gomamon');
      await say("Avec Seadramon qui rôde dans le lac, j'ai peur pour eux... Je ne peux pas quitter la rive : les autres petits comptent sur moi.", 'Gomamon');
      if ((await DW.ask('Retrouver les trois Bukamon ?', ['Oui', 'Non'], null, 0)) !== 0) { await say("Si tu changes d'avis, je suis là, sur la rive.", 'Gomamon'); return; }
      F.bukaQuete = 1;
      await say("Merci ! Ils ne s'éloignent jamais de l'eau. Cherche-les sur les rives, en allant vers l'ouest... jusqu'à la Cascade du Dragon, s'il le faut !", 'Gomamon');
      return;
    }
    const n = trouves();
    if (n < 3) { await say(`Tu en as retrouvé ${n} sur 3. Les autres doivent être plus loin le long des rives, vers la Cascade du Dragon.`, 'Gomamon'); return; }
    if (F.bukaQuete === 1) {
      F.bukaQuete = 2; Audio.sfx('fanfare');
      await say("Mes petits ! Ils sont tous revenus ! Merci, merci !", 'Gomamon');
      const extra = DW.giveItem('digianchois', 3) + DW.giveItem('disque_pm', 1); st().bits += 300;
      await say(`Tu reçois 3 Digianchois, 1 Disque PM et 300 Bits !${DW.extraMsg(extra)}`);
      if (DW.Cards && DW.Cards.give('bukamon')) await say("Les Bukamon t'offrent aussi une carte : Bukamon ! (Album)");
      await say((st().kids || {}).matt ? "Et puis... ce garçon blond à l'harmonica, tu l'as trouvé ? Tant mieux. Il avait l'air si seul, sur son île." : "Un secret, pour te remercier : la nuit, l'eau baisse à la Cascade du Dragon, et une langue de sable mène à l'île du vieux tramway. Les Bukamon disent qu'on y entend un harmonica...", 'Gomamon');
      return;
    }
    await say("Les petits jouent de nouveau près de la rive. Tout va bien, grâce à toi !", 'Gomamon');
  }
  async function bukamon(id) {
    const F = f();
    F.bukaTrouves = (F.bukaTrouves || 0) | BUKA[id]; Audio.sfx('select');
    await say("Bu-bu ! Je me suis perdu en suivant les poissons... Gomamon me cherche ? J'y retourne tout de suite !", 'Bukamon');
    await say(`(Bukamon retrouvé : ${trouves()} / 3)`);
  }

  // ------------------------------------------------------------ chapitre 3 : la soif des Yokomon
  async function yokomonAssoiffe() {
    await say("...De l'eau... s'il te plaît... (Un Yokomon tout desséché s'est effondré au bord de l'oasis. Avec la chaleur de la montagne, son eau est tiède et boueuse.)", 'Yokomon');
    if (!(st().bag.eau_fraiche > 0)) { await say("(Il lui faudrait de l'Eau fraîche : le Bazar et les distributeurs en vendent.)"); return; }
    if ((await DW.ask('Donner une Eau fraîche au Yokomon ?', ['Oui', 'Non'], null, 0)) !== 0) return;
    const sac = st().bag; sac.eau_fraiche -= 1; if (sac.eau_fraiche <= 0) delete sac.eau_fraiche;
    f().yokoSoif = true; Audio.sfx('heal');
    await say("Glou glou... Ah ! Je revis ! Merci ! J'étais parti chercher de l'eau pour mon village : la fontaine est à sec depuis que Meramon brûle tout, là-haut, sur le Mont Miharashi.", 'Yokomon');
    await say("Le Village des Yokomon est par là : suis les poteaux du désert ! Prends ça, c'est tout ce que j'ai.", 'Yokomon');
    const extra = DW.giveItem('pomme_bleue', 1); st().bits += 150;
    await say(`Tu reçois 1 Pomme bleue et 150 Bits !${DW.extraMsg(extra)}`);
  }

  // ------------------------------------------------------------ chapitre 3 : le trésor de l'épave (quand l'eau est revenue)
  async function yokomonEpave() {
    if ((st().chests || {}).epave_coffre) { await say("Un Disque de défense, dans la vieille épave ? Garde-le, tu l'as bien mérité !", 'Yokomon'); return; }
    await say("Depuis que l'eau revient dans le lac, quelque chose brille dans la vieille épave, au milieu... Mais nous, on ne sait pas nager !", 'Yokomon');
    await say("Il y a un passage de planches, au sud du lac, jusqu'au banc de sable. Tu veux bien aller voir ?", 'Yokomon');
  }
  // l'épave : son panneau, et le coffre que le courant a déposé à côté (une fois l'eau revenue)
  const EPAVE = { x: 25, y: 51 };
  function epave(m) {
    m.signs = m.signs || {};
    // (le petit lac garde son banc de sable à l'écran : l'eau « revient peu à peu », elle n'a pas encore tout recouvert)
    for (let x = 21; x <= 27; x++) m.signs[`${x},49`] = () => say(f().meramon ? "La vieille épave, couverte de coquillages. L'eau revient peu à peu autour d'elle ; le courant de la source a déposé un coffre sur le sable." : "La vieille épave, posée sur le fond presque sec du lac. Sur la coque, un nom à moitié effacé... Personne ne sait d'où elle vient.");
    if (!f().meramon || m.objects.some(o => o.epave)) return;
    DW.Palais.treasure('miharashi1', 'epave_coffre', null, [['disque_def', 1], ['cartes', 2]], EPAVE.x, EPAVE.y);
    const o = m.objects.find(c => c.kind === 'chest' && c.x === EPAVE.x && c.y === EPAVE.y); if (o) o.epave = true;
    if (m.gfx) DW.World.unprepare(m);
  }

  // ------------------------------------------------------------ les personnages des quêtes, posés à l'arrivée sur la carte
  // [carte, condition, espèce, réplique, point de départ (sinon le carrefour de la sous-zone)]
  const PNJ = [
    ['lac0', s => perso() && ch() >= 2 && !!s.flags.monoCh2 && (s.flags.bukaQuete || 0) < 2, 'gomamon', () => gomamon()],
    ...Object.keys(BUKA).map(id => [id, s => s.flags.bukaQuete === 1 && !((s.flags.bukaTrouves || 0) & BUKA[id]), 'bukamon', () => bukamon(id)]),
    ['miharashi0', s => ch() >= 3 && !s.flags.meramon && !s.flags.yokoSoif, 'yokomon', () => yokomonAssoiffe(), [40, 30]],
    ['miharashi1', s => !!s.flags.meramon && !(s.chests || {}).epave_coffre, 'yokomon', () => yokomonEpave(), [30, 42]],
  ];
  { const V = DW.MAPS.miharashi1, pop0 = V && V.populate; if (V) V.populate = function () { epave(this); if (pop0) return pop0.call(this); }; }
  DW.Quetes = {
    decorate(ow) {
      const m = ow.map, id = ow.mapId, s = st();
      const ici = PNJ.filter(P => P[0] === id && P[1](s)); if (!ici.length) return;
      const avoid = (m.npcs || []).map(n => [n.x, n.y]).concat([[ow.p.x, ow.p.y]]);
      for (const [, cond, sp, talk, pres] of ici) {
        const [sx, sy] = pres || (m.spec && m.spec.hub ? [m.spec.hub[0] + 3, m.spec.hub[1] + 2] : [ow.p.x, ow.p.y]);
        const p = DW.Story.freeSpots(ow, avoid, 3, sx, sy)[0]; if (!p) continue;
        avoid.push(p);
        m.npcs.push({ sp, x: p[0], y: p[1], face: 'down', wander: sp === 'bukamon' ? 1 : 0, story: true, cond, talk });
      }
    },
  };
})();
;

// ===== js/game/minijeux.js
'use strict';
// =====================================================================
//  MINI-JEUX DE L'ÎLE
//  - ARROSAGE (Village des Yokomon, après le chapitre 3) : 8 fleurs se dessèchent sous le soleil du désert ;
//    en 30 secondes, déplace l'arrosoir (flèches) et arrose (ESPACE) avant qu'elles ne fanent. Une partie par jour.
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W, H = DW.H;
  const day = () => Math.floor(DW.state.clock / 1440);

  class WateringScene extends DW.Scene {
    constructor() {
      super();
      this.T = 30; this.sel = 0; this.cd = 0; this.drops = []; this.done = false;
      this.fl = Array.from({ length: 8 }, (_, i) => ({ w: 0.7 + Math.random() * 0.3, rate: 0.045 + Math.random() * 0.05, dead: false, x: 52 + (i % 4) * 72, y: i < 4 ? 112 : 186 }));
    }
    get alive() { return this.fl.filter(f => !f.dead).length; }
    update(dt) {
      if (this.done) { if (Input.hit('ok') || Input.hit('back')) this.close(this.alive); return; }
      this.T -= dt; this.cd -= dt;
      if (Input.hit('left')) { this.sel = (this.sel + 7) % 8; Audio.sfx('move'); }
      if (Input.hit('right')) { this.sel = (this.sel + 1) % 8; Audio.sfx('move'); }
      if (Input.hit('up') || Input.hit('down')) { this.sel = (this.sel + 4) % 8; Audio.sfx('move'); }
      if (Input.hit('ok') && this.cd <= 0) {
        const f = this.fl[this.sel]; this.cd = 0.22;
        if (!f.dead) { f.w = Math.min(1, f.w + 0.42); Audio.sfx('select'); for (let k = 0; k < 8; k++) this.drops.push({ x: f.x - 6 + Math.random() * 12, y: f.y - 46, v: 40 + Math.random() * 40, t: 0 }); }
      }
      // le soleil tape de plus en plus fort
      const heat = 1 + (30 - this.T) / 22;
      for (const f of this.fl) if (!f.dead) { f.w -= f.rate * heat * dt; if (f.w <= 0) { f.w = 0; f.dead = true; Audio.sfx('debuff'); } }
      for (const d of this.drops) { d.t += dt; d.y += d.v * dt; }
      this.drops = this.drops.filter(d => d.t < 0.6);
      if (this.T <= 0 || !this.alive) { this.T = Math.max(0, this.T); this.done = true; Audio.sfx(this.alive >= 6 ? 'fanfare' : 'select'); }
    }
    flower(c, f, t, sel) {
      const k = f.dead ? 0 : f.w, droop = f.dead ? 1 : Math.max(0, 0.5 - k) * 2;
      // pot de terre
      c.fillStyle = '#8a5a34'; c.beginPath(); c.moveTo(f.x - 13, f.y - 6); c.lineTo(f.x + 13, f.y - 6); c.lineTo(f.x + 10, f.y + 8); c.lineTo(f.x - 10, f.y + 8); c.closePath(); c.fill();
      c.fillStyle = '#a8744a'; c.fillRect(f.x - 14, f.y - 9, 28, 4);
      c.fillStyle = k > 0.25 ? '#4a3420' : '#9a8460'; c.fillRect(f.x - 12, f.y - 8, 24, 2);
      // tige qui ploie quand la fleur a soif
      const tx = f.x + droop * 10, ty = f.y - 34 + droop * 14;
      c.strokeStyle = f.dead ? '#8a7a4a' : '#3a8a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(f.x, f.y - 8); c.quadraticCurveTo(f.x, f.y - 26, tx, ty); c.stroke();
      c.fillStyle = f.dead ? '#9a8a5a' : '#4aa04a'; c.beginPath(); c.ellipse(f.x - 5, f.y - 18, 5, 2, -0.5, 0, 7); c.fill(); c.beginPath(); c.ellipse(f.x + 5, f.y - 22, 5, 2, 0.5, 0, 7); c.fill();
      // fleur bleue des Yokomon (pétales), qui pâlit puis brunit
      const col = f.dead ? '#8a6a4a' : k > 0.5 ? '#4a6ae8' : k > 0.25 ? '#7a8ad0' : '#a8a0b8';
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + droop; c.fillStyle = col; c.beginPath(); c.ellipse(tx + Math.cos(a) * 6, ty + Math.sin(a) * 5, 5, 3, a, 0, 7); c.fill(); }
      c.fillStyle = f.dead ? '#6a5a3a' : '#ffe060'; c.beginPath(); c.arc(tx, ty, 3, 0, 7); c.fill();
      // jauge d'eau
      UI.bar(c, f.x - 16, f.y + 13, 32, 3, k, k > 0.5 ? '#5ab0ff' : k > 0.25 ? '#f0c040' : '#ff5a5a');
      if (sel) {   // l'arrosoir au-dessus de la fleur choisie
        const bx = f.x + 10, by = f.y - 60 + Math.sin(t * 6) * 1.5;
        c.fillStyle = '#5a8ad0'; c.fillRect(bx - 8, by - 6, 14, 10); c.fillStyle = '#3a6ab0'; c.fillRect(bx - 8, by + 2, 14, 2);
        c.strokeStyle = '#3a6ab0'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 8, by); c.lineTo(bx - 16, by - 6); c.stroke();
        c.beginPath(); c.arc(bx, by - 8, 4, Math.PI, 0); c.stroke();
        UI.text(c, '▼', f.x, f.y - 70, { size: 8, align: 'center', color: '#ffffff', shadow: false });
      }
    }
    draw(c) {
      const t = this.t;
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8ad0ff'); g.addColorStop(0.35, '#fff2c0'); g.addColorStop(0.36, '#d8c890'); g.addColorStop(1, '#a89860');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // soleil du désert
      const sx = W - 40, sy = 30, rg = c.createRadialGradient(sx, sy, 4, sx, sy, 40); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.3, '#fff0a0'); rg.addColorStop(1, 'rgba(255,240,160,0)');
      c.fillStyle = rg; c.fillRect(sx - 40, sy - 40, 80, 80);
      this.fl.forEach((f, i) => this.flower(c, f, t, i === this.sel && !this.done));
      for (const d of this.drops) { c.fillStyle = `rgba(120,190,255,${1 - d.t / 0.6})`; c.fillRect(d.x, d.y, 2, 3); }
      UI.text(c, 'ARROSAGE DES FLEURS', 10, 16, { size: 10, bold: true, color: '#3a2a10', shadow: false });
      UI.text(c, `${Math.ceil(this.T)} s`, W - 10, 16, { size: 10, align: 'right', bold: true, color: this.T < 8 ? '#c02020' : '#3a2a10', shadow: false });
      UI.text(c, `Fleurs : ${this.alive} / 8`, 10, 30, { size: 8, color: '#3a2a10', shadow: false });
      if (!this.done) UI.text(c, 'FLÈCHES : choisir   ESPACE : arroser', W / 2, H - 6, { size: 7, align: 'center', color: '#3a2a10', shadow: false });
      else { UI.box(c, 60, 92, 200, 56); UI.text(c, this.alive >= 6 ? 'Magnifique !' : this.alive >= 3 ? 'Pas mal !' : 'Oh non...', W / 2, 114, { size: 11, align: 'center', bold: true, color: '#ffe070' }); UI.text(c, `${this.alive} fleur${this.alive > 1 ? 's' : ''} sauvée${this.alive > 1 ? 's' : ''} — ESPACE`, W / 2, 134, { size: 8, align: 'center' }); }
    }
  }

  DW.MiniJeux = {
    WateringScene,
    async arrosage(name = 'Yokomon') {
      const s = DW.state;
      if (s.flags.arrosage === day()) { await DW.say("Les fleurs ont assez bu pour aujourd'hui ! Reviens demain, il fera encore chaud.", name); return; }
      if ((await DW.ask("Le soleil du désert dessèche nos fleurs... Tu nous aides à les arroser ? (30 secondes, une fois par jour)", ['Oui !', 'Plus tard'], name)) !== 0) return;
      s.flags.arrosage = day();
      const n = await DW.Game.push(new WateringScene());
      const bits = n >= 8 ? 400 : n >= 6 ? 250 : n >= 3 ? 120 : 30;
      s.bits += bits;
      let gift = '';
      if (n >= 6) { const extra = DW.giveItem('digichampi', 2); gift = ` et 2 ${DW.ITEMS.digichampi.name}s${DW.extraMsg(extra)}`; }
      await DW.say(n >= 8 ? `Toutes les fleurs sont sauvées ! Tu es un vrai jardinier ! Voici ${bits} Bits${gift} !` : `Merci ! ${n} fleur${n > 1 ? 's' : ''} sur 8. Voici ${bits} Bits${gift}.`, name);
      DW.state.party.forEach(m => m.addHappy(n >= 6 ? 4 : 1));
    },
  };
})();
;

// ===== js/main.js
'use strict';
// =====================================================================
//  DÉMARRAGE : lancement de partie et chargement des polices
// =====================================================================
(function () {
  const { UI, Game } = DW;
  const W = DW.W, H = DW.H;

  // les images des décors (gfx/textures.js) se chargent pendant l'écran titre ; si on lance la partie (ou l'introduction)
  // avant la fin, un écran de chargement avec sa barre attend qu'elles soient prêtes. On l'appelle sur un écran noir :
  // il apparaît en fondu, puis le noir revient avant la suite.
  class ChargementScene extends DW.Scene {
    update() { if (!DW.Textures || DW.Textures.fini) this.close(); }
    draw(c) {
      c.fillStyle = '#070a14'; c.fillRect(0, 0, W, H);
      const T = DW.Textures, tot = T ? Object.values(T.LISTE).flat().length : 1, n = T ? Object.keys(T.img).length : tot, k = Math.min(1, n / tot);
      UI.text(c, 'Chargement des décors...', W / 2, H / 2 - 14, { size: 10, align: 'center', bold: true, color: '#ffe680' });
      c.fillStyle = '#1a2440'; c.fillRect(W / 2 - 80, H / 2, 160, 8);
      c.fillStyle = '#5ad08a'; c.fillRect(W / 2 - 80, H / 2, Math.round(160 * k), 8);
      UI.text(c, Math.round(k * 100) + ' %', W / 2, H / 2 + 22, { size: 8, align: 'center', color: '#9ab0e8' });
    }
  }
  DW.attendreDecors = async () => {
    if (!DW.Textures || DW.Textures.fini) return;
    DW.fade(0, 0.25);
    await Game.push(new ChargementScene());
    await DW.fade(1, 0.2);
  };
  DW.startGame = async isNew => {
    await DW.attendreDecors();
    // personnage créé avec le kit : le petit sprite reprend ses vraies couleurs (aussi pour les parties déjà commencées)
    const st = DW.state;
    if (st.hero === 'perso' && st.perso && DW.Perso) {
      await DW.Perso.charger();
      const cols = DW.Perso.couleurs(st.perso);
      if (cols && st.look) st.look = { ...st.look, cols };
    }
    // (partie reprise dans une carte dont les images sont chargées à part : la grotte de Shellmon)
    const M = DW.MAPS[st.map], dossier = !isNew && M && M.textures;
    if (dossier && DW.Textures && DW.Textures.dossier) await DW.Textures.dossier(dossier);
    lancer(isNew);
  };
  const lancer = isNew => {
    const st = DW.state;
    // nouvelle partie : le début se JOUE dans la forêt (game/debut.js) — le bébé rejoint le héros là-bas
    if (isNew) {
      DW.giveItem('viande', 5); DW.giveItem('remede', 3);
      const [x, y] = DW.MapKit.zpt('clairiere', 18, 13);
      const ow = new DW.Overworld('clairiere', x, y, 'down');
      Game.replaceAll(ow);
      ow.runScript(() => DW.Debut.run(ow));
      return;
    }
    Game.replaceAll(new DW.Overworld(st.map, st.x, st.y, st.dir));
    DW.fade(0, 0.8);
  };

  // ------------------------------------------------------------ démarrage
  // ESSAI DEPUIS L'ÉDITEUR DE CARTES (seulement en local) : ?essai=carte,x,y ouvre directement la carte, avec un
  // Digimon prêté ; rien n'est sauvegardé (les vraies sauvegardes ne sont jamais touchées)
  const essai = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get('essai');
  if (essai) {
    const [id, x, y] = essai.split(','), st = DW.state, chap = +(new URLSearchParams(location.search).get('chap') || 0);
    DW.save = () => true; DW.autosave = () => {};
    // chapitre de l'essai : 0 = tout ouvert (aucun passage fermé), sinon les règles de ce chapitre
    if (chap > 0) st.flags.chapter = chap; else DW.essaiLibre = true;
    if (!st.party.length) { st.flags.starter = 'agumon'; DW.addDigimon(new DW.Digimon('agumon', 12)); }
    // (si l'essai échoue, on l'écrit à l'écran au lieu d'un écran noir)
    const oups = e => {
      const p = document.createElement('pre');
      p.style.cssText = 'position:fixed;left:12px;top:12px;right:12px;z-index:99;padding:10px;background:#120a14;color:#ff9a9a;font:13px monospace;white-space:pre-wrap';
      p.textContent = `Essai impossible sur « ${id} » : ${e && e.message}\n(enregistre dans l'atelier, puis relance l'essai)\n\n${String(e && e.stack || '').split('\n').slice(0, 6).join('\n')}`;
      document.body.appendChild(p); console.error(e);
    };
    const go = () => { try { const M = DW.getMap(id), [x0, y0] = x != null ? [+x, +y] : [M.w >> 1, M.h >> 1]; Game.replaceAll(new DW.Overworld(id, x0, y0, 'down')); DW.start(); } catch (e) { oups(e); } };
    if (!DW.MAPS[id]) { oups(new Error('carte inconnue')); return; }
    const tex = DW.Textures ? DW.Textures.charge.then(() => DW.MAPS[id] && DW.MAPS[id].textures && DW.Textures.dossier ? DW.Textures.dossier(DW.MAPS[id].textures) : null) : Promise.resolve();   // (images dessinées : gfx/textures.js)
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('10px "DotGothic16"'), tex]).then(go, go); else tex.then(go, go);
    return;
  }
  // (les planches du personnage du joueur se chargent dès l'écran titre : la création du personnage les a tout de suite)
  const boot = () => { if (DW.Perso) DW.Perso.charger(); Game.push(new DW.TitleScene()); DW.start(); };
  if (document.fonts && document.fonts.load) {
    // (l'écran titre n'attend que les polices, au plus 1,5 s ; les images des décors arrivent pendant ce temps)
    Promise.race([Promise.all([document.fonts.load('10px "DotGothic16"'), document.fonts.load('28px "Press Start 2P"')]), new Promise(r => setTimeout(r, 1500))]).then(boot, boot);
  } else boot();
})();
;
