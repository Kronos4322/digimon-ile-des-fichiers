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
    const A = MAPS[aId], B = MAPS[bId], ya = A.mid, yb = B.mid, wa = A.rows[0].length, wb = B.rows[0].length;
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
  const deco = (m, list) => { for (const o of list) m.objects.push({ w: 1, h: 1, ...o }); };

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
