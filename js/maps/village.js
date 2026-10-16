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
  const NORTH_LEVEL = 3;   // ouverture du Quartier Résidentiel (maps/quartiers.js)
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
    // 2. chemins de terre : un vrai chemin continu aux bords lisses (la couleur de la terre est relevée sur le sol),
    //    bordure plus sombre, puis touffes d'herbe et cailloux
    { const isP = (x, y) => at(x, y) === '=';
      // traits épais et arrondis entre cases voisines du chemin : un tracé continu, aux bords lisses
      const pass = (col, w) => {
        c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath();
        for (let ty = 0; ty < Hd; ty++) for (let tx = 0; tx < Wd; tx++) if (isP(tx, ty)) {
          const x = tx * U + 8, y = ty * U + 8;
          c.moveTo(x, y); c.lineTo(x + 0.1, y);
          for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) if (isP(tx + dx, ty + dy)) { c.moveTo(x, y); c.lineTo(x + dx * U, y + dy * U); }
        }
        c.stroke();
      };
      pass('#a8865a', 24); pass('#c4a274', 20); pass('#cfae80', 12);   // bordure, terre, milieu plus clair (sol tassé)
      // grain de la terre
      for (let ty = 0; ty < Hd; ty++) for (let tx = 0; tx < Wd; tx++) if (isP(tx, ty)) for (let k = 0; k < 5; k++) {
        const u = H0(tx * 5 + k, ty, 807), v = H0(tx, ty * 5 + k, 807); c.fillStyle = k < 2 ? 'rgba(255,240,210,0.45)' : 'rgba(110,80,50,0.3)'; c.fillRect(tx * U + u * U, ty * U + v * U, k < 2 ? 2 : 1, 1);
      } }
    for (let ty = 0; ty < Hd; ty++) for (let tx = 0; tx < Wd; tx++) {
      if (at(tx, ty) !== '=') continue;
      const x0 = tx * U, y0 = ty * U;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (at(tx + dx, ty + dy) !== '.') continue;
        // touffes d'herbe qui débordent sur la terre, le long du bord
        for (let k = 0; k < 4; k++) {
          const u = H0(tx * 7 + k, ty * 5 + dx * 3 + dy, 803) * U, x = dx ? x0 + (dx > 0 ? U - 2 : 0) : x0 + u, y = dy ? y0 + (dy > 0 ? U - 2 : 0) : y0 + u;
          c.fillStyle = k % 2 ? '#4a943a' : '#5aa846'; c.fillRect(x, y, 2, 2);
        }
      }
      // cailloux et grains
      for (let k = 0; k < 3; k++) { const u = H0(tx, ty * 3 + k, 804), v = H0(tx * 3 + k, ty, 804); c.fillStyle = k ? 'rgba(120,90,60,0.45)' : 'rgba(240,225,190,0.6)'; c.fillRect(x0 + u * U, y0 + v * U, k ? 1 : 2, k ? 1 : 1.5); }
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
    const version = Object.keys(LOTS).concat(['betamon', 'biyomon', 'kunemon']).map(id => (has(id) ? 1 : 0)).join('') + lvl + (st().hero || '') + (Object.keys((st().home || {}).owned || {}).length >= 4 ? 'H' : 'h');
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
      for (const [x, y] of [[5, 7], [4, 9], [35, 6], [34, 4], [8, 25], [4, 21], [35, 20], [34, 24], [14, 3], [5, 17], [12, 17], [16, 26], [4, 11]]) g.set(x, y, 'T');
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
      // route du nord vers le Quartier Résidentiel : elle n'existe qu'une fois le quartier construit (niveau 3)
      if (lvl >= NORTH_LEVEL) {
        tr([[11.5, 10], [12, 5], [11.5, -1]], 0.95, 11); g.rect(11, 0, 2, 2, '=');
        for (const [x, y] of [[9, 2], [10, 2], [13, 2], [14, 2]]) g.set(x, y, 'K');
        if (has('gotsumon')) g.set(13, 8, 'a');
      }
      // panneaux
      g.set(4, 12, 'S'); g.set(18, 26, 'S'); g.set(7, 25, 'S');
    });
    // objets : maison de Jijimon, bâtiments ou chantiers, fontaine, clôtures
    m.objects = [{ kind: 'jhouse', v: lvl < 3 ? 0 : lvl < 7 ? 1 : 2, x: 14, y: 2, w: 12, h: 4 },   // taudis, rénovée, cossue   // grande maison à étage (centrée comme avant : porte au milieu)
       { kind: 'mailbox', x: 22, y: 6, w: 1, h: 1, small: true }, { kind: DW.Home && Object.keys((st().home || {}).owned || {}).length >= 4 ? 'cottage' : 'shack', v: 2, x: 29, y: 3, w: 5, h: 3, home: true }];   // ta maison : un taudis, rénové dès qu'elle est un peu meublée
    for (const id in LOTS) {
      const L = LOTS[id];
      if (has(id)) m.objects.push({ kind: L.kind, x: L.x, y: L.y, w: L.w, h: L.h }, { kind: 'hangsign', v: L.sign[0], x: L.sign[1], y: L.sign[2], w: 1, h: 1, small: true });
    }
    m.objects.push({ kind: 'bigfountain', v: has('betamon') ? 1 : 2, x: 18, y: 13, w: 4, h: 2 });
    // ville en ruines (niveaux 0 à 2) : la place n'est pas vide, elle est abandonnée — caisses, sacs, pilier tombé,
    // coquillages et touffes d'herbe entre les pavés ; tout disparaît quand la ville renaît
    if (lvl < 3) for (const [k, x, y, v, walk] of [['crates', 15, 11, 0], ['crates', 16, 11, 1], ['sacks', 24, 12, 0], ['brokenpillar', 14, 16, 0], ['crates', 25, 16, 1],
      ['shellpile', 22, 17, 0, true], ['shellpile', 16, 18, 1, true], ['urn', 23, 10, 2]]) m.objects.push({ kind: k, v, x, y, w: 1, h: 1, small: true, ...(walk ? { walk: true } : {}) });
    if (has('biyomon')) m.objects.push({ kind: 'poste', ...FREE_LOT }, { kind: 'hangsign', v: 4, x: 29, y: 25, w: 1, h: 1, small: true });
    if (has('kunemon')) m.objects.push({ kind: 'bank', ...BANK });
    if (lvl >= 1) m.objects.push({ kind: 'laundry', x: 14, y: 7, w: 3, h: 1 });
    if (lvl >= NORTH_LEVEL) m.objects.push({ kind: 'districtgate', v: 0, x: 9, y: 0, w: 6, h: 3, top: true });
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
    if (has('kunemon')) m.npcs.push({ sp: 'kunemon', x: BANK.x + 3, y: BANK.y + BANK.h, face: 'left', wander: 1, talk: SERVICES.kunemon });
    // passants : plus la ville se développe, plus elle s'anime (comme les villes de Digimon World 2003)
    const nPass = Math.min(PASSERS.length, Math.floor(T().progress() / 12));
    for (let i = 0; i < nPass; i++) { const [sp, x, y] = PASSERS[i]; if (DW.SPECIES[sp] && (!DW.Citizens || DW.Citizens.known(sp))) m.npcs.push({ sp, x, y, face: i % 2 ? 'left' : 'right', wander: 3, talk: () => passerTalk(sp) }); }
    // collaborations : le second habitant travaille sur place (game/collab.js)
    if (DW.Collab) DW.Collab.place(m, { gotsumon: [LOTS.gotsumon.x + LOTS.gotsumon.w, LOTS.gotsumon.y + LOTS.gotsumon.h], elecmon: [LOTS.elecmon.x - 1, LOTS.elecmon.y + LOTS.elecmon.h], fontaine: [23, 15] });
    m.npcs.forEach(n => { delete n.hx; delete n.hy; delete n.home; });
    m.doors = [{ x: 19, y: 5, w: 2, dir: 'up', to: 'maison', tx: 7, ty: 10 },
      { x: FREE_LOT.x + 2, y: FREE_LOT.y + FREE_LOT.h - 1, w: 2, dir: 'up', to: 'poste_in', tx: 6, ty: 8, cond: st => !!(st.recruits && st.recruits.biyomon) }].concat(Object.keys(LOTS).map(id => {
      const L = LOTS[id];
      return { x: L.x + 2, y: L.y + L.h - 1, w: 2, dir: 'up', to: L.in[0], tx: L.in[1], ty: L.in[2], cond: st => !!(st.recruits && st.recruits[id]) };
    }));
    // panneaux : ville, direction du terrain
    m.signs = {
      '4,12': () => say(`Ville des Fichiers — ${T().label()}.  Ouest : Plage des Cabines.  Sud : Terrain d'entraînement.  Sud-ouest : Quartier des Champs.`),
      '7,25': 'Sud-ouest : Quartier des Champs. Un moulin, un étang, et des champs à perte de vue.',
      '18,26': "Sud : Terrain d'entraînement. Le niveau se gagne en combat, les Digivolutions à l'entraînement !",
    };
    for (let x = 18; x < 22; x++) for (const y of [13, 14]) m.signs[`${x},${y}`] = fountainUse;
    if (has('kunemon')) for (let x = BANK.x; x < BANK.x + BANK.w; x++) m.signs[`${x},${BANK.y + BANK.h - 1}`] = SERVICES.kunemon;
    zoomMap(m, 'village');   // plan agrandi ×2 (maps/common.js)
    m.paintGround = c => paintTown(c, m, lvl);   // sol peint par-dessus les cases : place, bords des chemins, pelouses
    // grand panneau d'affichage de la ville, à droite de la maison de Jijimon : une note épinglée par habitant revenu
    { const J = m.objects.find(o => o.kind === 'jhouse'), bx = J.x + J.w + 1, by = J.y + J.h - 1;
      m.objects.push({ kind: 'noticeboard', v: Math.min(8, lvl), x: bx, y: by, w: 2, h: 1 });
      for (const x of [bx, bx + 1]) m.signs[`${x},${by}`] = () => DW.Chapter.townSign();
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
    const s = st(), m = s.party[0], next = T().RECRUITS.find(x => !T().has(x.id));
    const urgent = [], tips = [];
    if (!s.flags.starter) urgent.push(`Ko-ko ! Bonjour ! Un bébé Digimon t'attend ici, sur la place : ${DW.SPECIES[DW.heroLine().baby].name}. Va lui parler !`);
    else {
      if (m && m.hunger >= 70) urgent.push(`${m.name} a faim ! Tanemon donne 3 Viandes par jour dans son DigiChamp, au Quartier des Champs (sortie sud-ouest).`);
      if (m && m.sick) urgent.push(`${m.name} est malade ! Un Médicament le guérira (Bazar de Gotsumon), ou une nuit chez Jijimon.`);
      else if (m && (m.germs || 0) >= 50) { const c = DW.Life.causes(m).map(x => x[1]); urgent.push(`${m.name} n'a pas l'air bien...${c.length ? ' Fais attention : ' + c.join(', ') + '.' : ''} S'il accumule les négligences, il tombera malade. Le sommeil l'aide à se rétablir.`); }
      if (m && m.need >= 60) urgent.push("Vite ! Il y a des toilettes au sud de la ville, près de la route du Terrain d'entraînement.");
      if (m && DW.Evo.available(m).length) urgent.push(`${m.name} peut digivoluer ! Ouvre le menu (ENTRÉE) → DIGIMON → onglet DIGIVOLUTION.`);
      tips.push("Les Digimon ne se capturent pas : ils naissent ! Penguinmon confie un DigiŒuf par jour au Village des Bébés, à l'est de la Prairie. Ensuite, entraîne-les pour qu'ils digivoluent !");
      tips.push("Certains chemins sont bloqués : un éboulis à l'est, des ronces aux Champs, l'inondation au nord de la Clairière... Les Digimon qui rentrent en ville t'aideront à passer !");
      if (!s.flags.tanemon) tips.push("Tu connais Tanemon ? Il cultive de la Digiviande au Quartier des Champs, au sud-ouest. Passe le voir chaque jour !");
      if (!T().level()) tips.push("La ville est vide... Les Digimon de l'île ont tout oublié. Explore l'ouest, retrouve-les et ramène-les ici !");
      if (m && DW.Training.total(m) < 10) tips.push("Les combats font monter le niveau. Mais pour digivoluer, il faut s'entraîner au Terrain d'entraînement, au sud.");
      if (next) tips.push(`On m'a dit qu'un Digimon rôde du côté de « ${MAPS[next.zone].name} »... Il cherche peut-être un endroit où vivre.`);
      if (DW.bagUsed() >= DW.bagSlots() || Object.values(s.bag).some(n => n >= DW.BAG_MAX)) tips.push(`Ton sac est limité : ${DW.BAG_MAX} exemplaires par objet et ${DW.bagSlots()} sortes d'objets. Plein, il ne ramasse plus rien : range tes affaires dans ton coffre, et la nourriture dans ton frigo !`);
      tips.push("Jijimon te laisse dormir chez lui : ça soigne toute l'équipe.", "Ton partenaire a besoin d'aller aux toilettes de temps en temps. Sinon... gare aux accidents !");
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
    const r = await DW.ask("Que veux-tu, jeune DigiSélectionné ?", ['Se reposer', 'Des conseils', 'Questions', 'Au revoir'], 'Jijimon');
    if (r === 2) { await DW.Guide.questions('Que veux-tu savoir ?'); return; }
    if (r === 0) {
      // dormir seulement à l'heure du coucher de ton Digimon ; sinon une heure de repos
      const m = DW.Care.lead(), sleepy = m && DW.Life.sleepy(m);
      await say(sleepy ? "Ton Digimon tombe de sommeil ! Dormez donc ici. Hohoho !" : "Il n'a pas sommeil... Reposez-vous un peu, ça fera du bien.", 'Jijimon');
      const res = await DW.Life.restOrSleep();
      if (!res) return;
      s.heal = { map: 'maison', x: 12, y: 5 };
      if (res === 'sleep') {
        await healAll('Toute ton équipe est en pleine forme !');
        // une nuit chez Jijimon efface un K.O. (la règle des 3 K.O. reste, sans être un piège)
        for (const m of s.party) if ((m.kos || 0) > 0) { m.kos--; await say(`${m.name} a bien récupéré : un K.O. s'efface (${m.kos}/3).`, 'Jijimon'); }
      }
      DW.autosave();
    } else if (r === 1) {
      const next = T().RECRUITS.find(x => !T().has(x.id));
      if (next) await say(`On raconte qu'un Digimon solitaire erre du côté de « ${MAPS[next.zone].name} »... Il cherche peut-être un endroit où vivre. Qui sait ce qu'il apporterait à la ville ?`, 'Jijimon');
      else await say("La ville n'a jamais été aussi belle ! Merci, mon enfant.", 'Jijimon');
      await say(`Pour l'instant, la ville est à ${T().label()}.`, 'Jijimon');
      await say("Ton partenaire ne digivoluera pas tout seul : entraîne-le au terrain du sud, gagne des combats, puis consulte la table des Digivolutions.", 'Jijimon');
    }
  }
  DW.Story.jijimonTalk = jijimonTalk;

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
      const r = await DW.ask('Que veux-tu faire ?', ['Champi-repas (80 Bits)', 'Cuisiner', 'Au revoir'], 'Mushroomon');
      if (r === 1) {
        if (!s.flags.cookIntro) { s.flags.cookIntro = true; await say("Mes fourneaux sont à toi ! Apporte les ingrédients que t'offrent les habitants : je t'apprends les recettes.", 'Mushroomon'); await say('Les plats cuisinés rendent ton partenaire plus fort, pour toujours !', 'Mushroomon'); }
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
        f.shellmon && !f.whamon && { boss: true, say: "Au large de la Crique du Radeau, on voit jaillir un jet d'eau gigantesque... C'est Whamon ! Un Engrenage Noir le rend fou. Monte sur le radeau, si tu l'oses : il est bien plus fort que Shellmon." },
        // chapitre 2 (game/chapitre2.js)
        (f.chapter || 1) >= 2 && !f.monoCh2 && { boss: true, say: "Sur la Rive Sud du grand lac, au nord de la Clairière, deux Monochromon se disputent le chemin à grands coups de cornes ! Leur carapace est dure comme le diamant : les coups de feu et d'électricité passent mieux." },
        (f.chapter || 1) >= 2 && f.monoCh2 && !f.seadramon && st().hero === 'perso' && { boss: true, say: "Au Lac du Tramway, une île porte un vieux tramway. La nuit (20 h - 5 h), on y entend un harmonica... Un garçon blond y campe avec un Digimon à fourrure. Mais méfie-toi de la grande feuille rouge, sur la rive de l'île !" },
      ].filter(Boolean);
      const reach = BOSS.concat(all.filter(x => !lock || !lock(x.zone)));
      if (!reach.length && !all.length) { await say(T().RECRUITS.some(x => !T().has(x.id)) ? "Les Digimon d'ici sont tous rentrés ! Les autres sont plus loin, dans les régions de l'île..." : 'Tout le monde est rentré en ville ! Quelle joie !', 'Biyomon'); return; }
      const list = reach.length ? reach : all, k = (f.biyoHint || 0) % list.length, next = list[k];
      f.biyoHint = (f.biyoHint || 0) + 1;
      if (next.boss) await say(`Cui ! Attention... ${next.say}`, 'Biyomon');
      else await say(`On m'a parlé d'un Digimon qui aimerait vivre ici... On l'aurait aperçu ${next.hint}. Il se cache bien : fouille les recoins !`, 'Biyomon');
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
  // le pari de Gotsumon : trois cailloux, un seul cache une pépite (50 Bits la partie, 150 si tu trouves), 3 parties par jour
  async function gotsuBet() {
    const s = st(), f = s.flags, d = DW.Time.day();
    if (!f.gotsuBet || f.gotsuBet.d !== d) f.gotsuBet = { d, n: 0 };
    if (f.gotsuBet.n >= 3) { await say("Assez joué pour aujourd'hui ! Mes cailloux ont besoin de repos. Grrr.", 'Gotsumon'); return; }
    if (s.bits < 50) { await say("Il te faut 50 Bits pour jouer !", 'Gotsumon'); return; }
    if ((await DW.ask("Une pépite est cachée sous un de ces trois cailloux. 50 Bits la partie, je t'en donne 150 si tu la trouves !", ['Jouer', 'Non merci'], 'Gotsumon')) !== 0) return;
    s.bits -= 50; f.gotsuBet.n++;
    const win = Math.floor(Math.random() * 3), pick = await DW.ask('Quel caillou ?', ['Le gauche', 'Celui du milieu', 'Le droit'], 'Gotsumon');
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
      const r = await DW.ask(`Lettre n°${i + 1} : pour qui ?`, DEST, 'Biyomon');
      if (DEST[r] !== seq[i]) { await say(`Oh non, celle-là était pour ${seq[i]} ! Pas grave, on rejouera demain. Cui !`, 'Biyomon'); return; }
    }
    DW.Audio.sfx('fanfare');
    const extra = DW.giveItem('cartes', 1);
    await say(`Parfait ! Toutes les lettres sont arrivées ! Tiens, un Paquet de cartes pour te remercier.${DW.extraMsg(extra)}`, 'Biyomon');
  }
  // vol rapide (comme Birdramon dans Digimon World) : lieux et régions déjà visités — payant
  const FLY_FEE = 80;
  async function flyMenu() {
    const s = st(), R = DW.REGION_ENTRY || {};
    if (s.bits < FLY_FEE) { await say(`Un vol coûte ${FLY_FEE} Bits... Il me faut des graines pour avoir la force de voler ! Cui !`, 'Biyomon'); return; }
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
      if ((await DW.ask(`Voler jusqu'à ${name} pour ${FLY_FEE} Bits ?`, ['Oui', 'Non'], 'Biyomon')) !== 0) return;
      s.bits -= FLY_FEE; DW.Audio.sfx('buy');
      await say(`Accroche-toi bien ! Direction : ${name} !`, 'Biyomon');
      DW.Audio.sfx('swoosh');
      await DW.fade(1, 0.5, '#ffffff');
      // case praticable la plus proche du point d'arrivée
      const m = DW.getMap(id), free = (X, Y) => X > 0 && Y > 0 && X < m.w - 1 && Y < m.h - 1 && !DW.SOLID.has(m.rows[Y][X]);
      let best = [x, y];
      for (let r = 0; r < 20 && !free(best[0], best[1]); r++)
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
          if (free(x + dx, y + dy) && !free(best[0], best[1])) best = [x + dx, y + dy];
      DW.ow.load(id, best[0], best[1], 'down');
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
    warps: [{ x: 0, y: 13, w: 1, h: 3, dir: 'left', to: 'plage', tx: 39, ty: 1 }, { x: 11, y: 0, w: 2, h: 1, dir: 'up', to: 'residentiel', tx: 41, ty: 60 }, { x: 19, y: 29, w: 2, h: 1, dir: 'down', to: 'gym', tx: 15, ty: 0 },
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
