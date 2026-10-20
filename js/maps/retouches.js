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
    base(m) { return { rows: m._baseRows || m.rows, objects: m._baseObjects || m.objects || [], alt: m._baseAlt !== undefined ? m._baseAlt : m.alt, theme: m._baseTheme !== undefined ? m._baseTheme : m.theme, warps: m._baseWarps || m.warps || [], doors: m._baseDoors || m.doors || [] }; },
    cleSortie: (w, porte) => (porte ? 'd:' : 'w:') + w.to + '@' + w.x + ',' + w.y,
    appliquer(m, id, force) {
      const T = R.de(id);
      if (!m.rows || (!T && !m._baseRows) || (!force && m._retFor === m.rows)) return;
      if (m._retFor !== m.rows) { m._baseSigns = { ...(m.signs || {}) }; m._baseRows = m.rows; m._baseObjects = (m.objects || []).filter(o => !o.ed && !o.decor); m._baseAlt = m.alt; m._baseTheme = m.theme; m._baseWarps = (m.warps || []).filter(w => !w.ed); m._baseDoors = (m.doors || []).filter(d => !d.ed); }
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
      m.alt = B.alt;
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
      m.warps = B.warps.filter(w => !parti.has(R.cleSortie(w)) && !remplacee(w)).concat(S.filter(o => o.type === 'bord' && ok(o)).map(o => regle({ x: o.x, y: o.y, w: o.w || 1, h: o.h || 1, dir: o.dir, to: o.to, tx: o.tx, ty: o.ty, ed: true, enclos: true, _zt: true }, o)));
      m.doors = B.doors.filter(d => !parti.has(R.cleSortie(d, true))).concat(S.filter(o => o.type === 'porte' && ok(o)).map(o => regle({ x: o.x, y: o.y, w: o.w || 1, h: 1, dir: o.dir || 'up', to: o.to, tx: o.tx, ty: o.ty, ed: true, _zt: true }, o)));
      m.portails = S.filter(o => o.type === 'portail' && ok(o)).map(o => regle({ x: o.x, y: o.y, w: o.w || 1, h: o.h || 1, to: o.to, tx: o.tx, ty: o.ty, ed: true, _zt: true }, o));
      // PANNEAUX : texte écrit dans l'éditeur (une case = un texte ; « null » retire le texte d'origine)
      m.signs = { ...(m._baseSigns || m.signs || {}) };
      if (T) for (const k in T.panneaux || {}) { if (T.panneaux[k] == null) delete m.signs[k]; else m.signs[k] = T.panneaux[k]; }
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
