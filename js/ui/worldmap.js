'use strict';
// =====================================================================
//  CARTE DE L'ÎLE DES FICHIERS
//  Vue de l'île : île peinte selon les biomes, une illustration par région ; un brouillard cache
//  tout ce qui n'est pas découvert (lieux, chemins, sous-zones). Zoom ×1/×2/×3 (touche Courir).
//  ESPACE sur une région : ses sous-zones (seules les explorées sont dessinées, position actuelle,
//  lieux emblématiques, sorties vers les régions voisines).
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const Art = DW.Art;
  const W = DW.W, H = DW.H, MH = 176; // hauteur de la zone carte (le panneau d'infos est en dessous)
  const RES = 2;                       // résolution de la peinture de l'île (pour le zoom)
  const ZOOMS = [1, 2, 3];             // niveaux de zoom (touche Courir / Maj / bouton X)

  // lieux de la carte (coordonnées dans la zone carte 320×176)
  const NODES = {
    clairiere: { x: 64, y: 40, b: 'forest', desc: 'La clairière où tu as atterri. Une source de données y soigne les Digimon.' },
    sentier: { x: 84, y: 64, b: 'forest', desc: 'Un sentier sinueux traversé par une rivière. On y entend des murmures...' },
    prairie: { x: 114, y: 58, b: 'meadow', desc: "Une prairie d'herbes hautes où de nombreux Digimon viennent jouer. Idéal pour s'aguerrir au combat !" },
    geants: { x: 72, y: 90, b: 'forest', desc: 'Des arbres immenses entourent un lac paisible.' },
    lisiere: { x: 94, y: 112, b: 'autumn', desc: "La forêt s'arrête au bord d'un ravin. Kuwagamon y rôde." },
    plage: { x: 112, y: 140, b: 'beach', desc: "Une plage de sable avec d'étranges cabines téléphoniques." },
    village: { x: 190, y: 128, b: 'town', desc: 'La ville de Jijimon. Fais-y revenir les Digimon pour la reconstruire !' },
    gym: { x: 206, y: 150, b: 'town', desc: "Le terrain d'entraînement de la ville. C'est ici que les Digimon se préparent à digivoluer." },
    champs: { x: 176, y: 150, b: 'farm', desc: 'Le quartier agricole de la ville : un moulin, des champs et un étang où tombe une cascade.' },
    berceau: { x: 142, y: 44, b: 'nursery', desc: 'Le Village des Bébés, où naissent les Digimon. Elecmon y confie un DigiŒuf par jour.' },
    montagne: { x: 180, y: 76, b: 'mountain', name: "Montagne de l'Infini", desc: "La montagne au cœur de l'île : pont, grottes de cristal, alpages, et le sommet aux engrenages noirs." },
    volcan: { x: 214, y: 104, b: 'volcano', name: 'Mont Panorama', desc: 'Un volcan fumant : champs de cendres, coulées de lave et le cratère de Meramon.' },
    savane: { x: 246, y: 78, b: 'savanna', name: 'Savane des Engrenages', desc: 'Une plaine dorée où des engrenages géants sortent de terre. Le Rocher du Lion veille sur elle.' },
    usine: { x: 238, y: 46, b: 'factory', name: 'Ville-Usine', desc: "Une ville de cheminées, de citernes et de robots, autour d'une usine qui ne s'arrête jamais." },
    decharge: { x: 280, y: 64, b: 'trash', name: "Montagne d'Ordures", desc: "Pneus, voitures, télévisions... Tout ce que l'île jette finit ici." },
    canyon: { x: 262, y: 104, b: 'canyon', name: 'Grand Canyon', desc: "Roche rouge, cactus et ascenseurs. Au fond, la forteresse d'Ogremon." },
    dino: { x: 290, y: 96, b: 'dino', name: 'Région des Dinosaures', desc: 'Fougères géantes, ossements, nid géant... et des zones où le temps se fige.' },
    jungle: { x: 262, y: 130, b: 'jungle', name: 'Jungle Tropicale', desc: 'Lianes, temple englouti, Pont Invisible, mangrove et village sur pilotis.' },
    overdell: { x: 238, y: 150, b: 'cemetery', name: "Cimetière d'Overdell", desc: 'Un éternel crépuscule violet. Le Manoir du Seigneur Gris domine les tombes.' },
    brumes: { x: 150, y: 22, b: 'fog', name: 'Bois Brumeux', desc: "Un brouillard épais où l'on se perd. Les lanternes de pierre montrent le chemin." },
    jouets: { x: 190, y: 18, b: 'toy', name: 'Ville des Jouets', desc: 'Manège, petit train, nounours et boîtes à surprise, autour du château de Monzaemon.' },
    gel: { x: 106, y: 20, b: 'snow', name: 'Terre Gelée', desc: 'Neige éternelle, lacs gelés, igloos et le Temple de Glace.' },
    lac: { x: 46, y: 50, b: 'lake', name: 'Lac du Tramway', desc: "Un grand lac où s'est échoué un vieux tramway. Pointe Coela, Pont Numérique et phare." },
    scarabees: { x: 30, y: 82, b: 'beetle', name: 'Pays des Scarabées', desc: "Une forêt ancienne de souches géantes, l'Arbre-Monde et le Colisée des Scarabées." },
    marais: { x: 146, y: 160, b: 'swamp', name: 'Marais des Geko', desc: 'Tourbières, roseaux chantants, cabanes sur pilotis et le Palais Geko.' },
    tunnel: { x: 196, y: 166, b: 'cave', name: 'Tunnel Foreur', desc: "Galeries de foreuses, rails abandonnés, cristaux... jusqu'à la Grotte de Lave." },
  };
  const EDGES = [['clairiere', 'sentier'], ['sentier', 'prairie'], ['prairie', 'berceau'], ['sentier', 'geants'], ['geants', 'lisiere'], ['lisiere', 'plage'], ['plage', 'village'], ['village', 'gym'], ['village', 'champs'],
    ['village', 'montagne'], ['montagne', 'volcan'], ['montagne', 'savane'], ['savane', 'usine'], ['savane', 'decharge'], ['savane', 'canyon'], ['canyon', 'dino'], ['canyon', 'jungle'], ['jungle', 'overdell'],
    ['berceau', 'brumes'], ['brumes', 'jouets'], ['brumes', 'gel'], ['clairiere', 'lac'], ['lac', 'scarabees'], ['champs', 'marais'], ['champs', 'tunnel']];
  // couleurs des biomes sur la carte [ombre, base, lumière]
  const BIOME = {
    forest: ['#1e5a2a', '#2e7234', '#46903e'], meadow: ['#4a8a34', '#64a83e', '#88c454'], autumn: ['#7a4a1e', '#a8642a', '#d08a3a'], beach: ['#c8a868', '#e2c88a', '#f4e2b0'],
    town: ['#4a8a4a', '#66aa5a', '#8ccc72'], farm: ['#6a8a34', '#8aa840', '#b0c860'], nursery: ['#d07aa8', '#e8a0c4', '#f8c8e0'],
    mountain: ['#5a5a62', '#7a7a82', '#a8a8b0'], volcano: ['#4a2a22', '#6a3a2a', '#c8502a'], savanna: ['#a88a36', '#c8a848', '#e4c868'], factory: ['#4a4e56', '#626670', '#848892'],
    trash: ['#5a4a36', '#76624a', '#96806a'], canyon: ['#9a4a28', '#c06a38', '#de9058'], dino: ['#2e5a22', '#447a30', '#6a9a3e'], jungle: ['#145a24', '#1e7a32', '#34a048'],
    cemetery: ['#2e2a3e', '#463e5a', '#625a7a'], fog: ['#4a6a64', '#6a8a84', '#9ab8b0'], toy: ['#c86aa0', '#e890c0', '#ffb8dc'], snow: ['#9aaac4', '#c4d2e6', '#f0f6ff'],
    lake: ['#3a8a4a', '#4aa058', '#6ac070'], beetle: ['#3a6a24', '#4e822e', '#6a9e3e'], swamp: ['#3a4a24', '#4e5e2e', '#6a7a3e'], cave: ['#3a3236', '#524850', '#706670'],
  };
  // lieu de la carte d'une carte du jeu : sa région, sinon celle de la carte voisine la plus proche
  // (intérieurs, caves, salles de donjon...) en suivant les passages
  const nodeCache = {};
  function nodeOf(id) {
    if (nodeCache[id]) return nodeCache[id];
    const seen = new Set([id]), q = [id];
    let found = 'village';
    while (q.length) {
      const m = q.shift(), M = DW.MAPS[m];
      if (NODES[m]) { found = m; break; }
      if (!M) continue;
      if (NODES[M.region]) { found = M.region; break; }
      for (const w of M.warps || []) if (!seen.has(w.to)) { seen.add(w.to); q.push(w.to); }
    }
    return (nodeCache[id] = found);
  }
  // sous-zones d'un lieu : zones générées de la région + zones sauvages en plein air (dunes, bosquet...)
  const subsOf = k => Object.keys(DW.MAPS).filter(id => { const m = DW.MAPS[id]; return nodeOf(id) === k && (m.spec || (!m.indoor && m.encounters && m.encounters.length)); });

  // ------------------------------------------------------------ île (ancienne vue, utilisée par la cinématique d'introduction)
    let islandCache = null;
  function island() {
    if (islandCache) return islandCache;
    const cv = Art.canvas(W, H), c = cv.getContext('2d');
    const id = c.createImageData(W, H), d = id.data;
    const cx = 160, cy = 122;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - cx) / 138, dy = (y - cy) / 98;
      const r = Math.hypot(dx, dy) + (Art.fbm(x * 0.02, y * 0.02, 7) - 0.5) * 0.5;
      const i = (y * W + x) * 4;
      let col;
      const b = Art.bayer(x, y) * 0.04;
      if (r > 1.02 + b) {
        const deep = Math.min(1, (r - 1) * 2);
        col = Art.mix([60, 150, 210], [16, 50, 120], deep);
        if (Math.sin(x * 0.15 + y * 0.6 + Art.noise(x * 0.05, y * 0.05, 2) * 6) > 0.95) col = Art.mix(col, [255, 255, 255], 0.3);
      } else if (r > 0.94 + b) col = [236, 214, 150];
      else {
        // relief : forêt au nord-ouest, montagne au centre, plaines à l'est
        const mtn = Math.max(0, 1 - Math.hypot(x - 168, (y - 92) * 1.2) / 46);
        const nn = (Art.noise(x * 0.04, y * 0.04, 8) - 0.5) * 50;
        const forest = x + nn < 132 && y - nn < 168;
        if (mtn > 0.45) col = Art.mix([150, 130, 110], [250, 250, 255], Math.max(0, (mtn - 0.75) * 4));
        else if (mtn > 0.2) col = [120, 140, 90];
        else if (forest) col = Art.hash(x >> 2, y >> 2, 3) < 0.5 ? [40, 110, 60] : [52, 128, 66];
        else if (x - nn > 222 && y + nn > 112) col = [214, 186, 120];
        else col = [110, 180, 90];
        if (Math.hypot(x - 197, y - 172) + nn * 0.3 < 18) col = [196, 232, 186];
        col = Art.mix(col, [0, 0, 0], Math.max(0, (Art.noise(x * 0.08, y * 0.08, 4) - 0.6)) * 0.6);
      }
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    c.putImageData(id, 0, 0);
    // petits arbres stylisés sur la forêt
    for (let k = 0; k < 70; k++) {
      const x = 40 + Art.hash(k, 1, 9) * 90, y = 40 + Art.hash(k, 2, 9) * 120;
      if (Math.hypot((x - 160) / 138, (y - 122) / 98) > 0.85) continue;
      c.fillStyle = '#1e5a30'; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill();
      c.fillStyle = '#3e8a44'; c.beginPath(); c.arc(x - 0.8, y - 0.8, 2, 0, 7); c.fill();
    }
    return (islandCache = cv);
  }

  // ------------------------------------------------------------ île peinte selon les biomes (vue de la carte)
  let artCache = null;
  function art() {
    if (artCache) return artCache;
    // peinte en double résolution : la carte reste nette quand on zoome
    const cv = Art.canvas(W * RES, MH * RES), c = cv.getContext('2d');
    const id = c.createImageData(W * RES, MH * RES), d = id.data;
    const cols = {}; for (const k in BIOME) cols[k] = BIOME[k].map(Art.hex);
    const S = Object.values(NODES).map(n => ({ x: n.x, y: n.y, c: cols[n.b] }));
    for (let Y = 0; Y < MH * RES; Y++) for (let X = 0; X < W * RES; X++) {
      const x = X / RES, y = Y / RES, i = (Y * W * RES + X) * 4, nx = Art.fbm(x * 0.03, y * 0.03, 41) - 0.5, ny = Art.fbm(x * 0.03, y * 0.03, 42) - 0.5;
      const r = Math.hypot((x - 160) / 152, (y - 90) / 82) + nx * 0.28;
      let col;
      if (r > 1.0) {
        const deep = Math.min(1, (r - 1) * 2.4);
        col = Art.mix([64, 150, 214], [18, 52, 120], deep);
        if (Math.sin(x * 0.16 + y * 0.7 + Art.noise(x * 0.05, y * 0.05, 2) * 6) > 0.94) col = Art.mix(col, [255, 255, 255], 0.35);
        if (r < 1.06) col = Art.mix(col, [140, 220, 240], 0.5);
      } else if (r > 0.93) col = Art.hex(r > 0.97 ? '#f2dcaa' : '#e2c88a');
      else {
        // biome du lieu le plus proche (frontières déformées par le bruit)
        let best = null, bd = 1e9, second = 1e9;
        const qx = x + nx * 26, qy = y + ny * 22;
        for (const s of S) { const dd = (qx - s.x) * (qx - s.x) + (qy - s.y) * (qy - s.y) * 1.3; if (dd < bd) { second = bd; bd = dd; best = s; } else if (dd < second) second = dd; }
        const v = Art.fbm(x * 0.09, y * 0.09, 43) + Art.bayer(X, Y) * 0.15;
        col = best.c[v < 0.42 ? 0 : v < 0.62 ? 1 : 2];
        if (Math.sqrt(second) - Math.sqrt(bd) < 1.2) col = Art.mix(col, [0, 0, 0], 0.18);
      }
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    c.putImageData(id, 0, 0);
    c.scale(RES, RES);
    // illustrations des régions
    const tri = (x, y, w, h, a, b) => { c.fillStyle = a; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y - h); c.lineTo(x + w, y); c.fill(); if (b) { c.fillStyle = b; c.beginPath(); c.moveTo(x - w * 0.35, y - h * 0.65); c.lineTo(x, y - h); c.lineTo(x + w * 0.35, y - h * 0.65); c.fill(); } };
    const tree = (x, y, col, s = 1) => { c.fillStyle = '#4a3020'; c.fillRect(x, y, 1, 2); c.fillStyle = col; c.beginPath(); c.arc(x + 0.5, y - 1.5 * s, 2.2 * s, 0, 7); c.fill(); };
    const pine = (x, y, col, snow) => { tri(x, y, 3, 7, col, snow); };
    const draw = {
      forest: n => { for (let i = 0; i < 6; i++) tree(n.x - 12 + (i % 3) * 8 + (i > 2 ? 4 : 0), n.y - 6 + (i > 2 ? 8 : 0), i % 2 ? '#2a6a30' : '#3a8a3a'); },
      meadow: n => { c.fillStyle = '#ffe070'; for (let i = 0; i < 6; i++) c.fillRect(n.x - 10 + i * 4, n.y + 6 + (i % 2) * 2, 1, 1); },
      autumn: n => { for (let i = 0; i < 4; i++) tree(n.x - 10 + i * 6, n.y - 4 + (i % 2) * 3, i % 2 ? '#c86a2a' : '#e0a040'); },
      beach: n => { c.fillStyle = '#d83a3a'; c.fillRect(n.x + 8, n.y - 8, 3, 5); c.fillStyle = '#5ac0e0'; c.fillRect(n.x + 9, n.y - 7, 1, 2); },
      town: n => { for (const [dx, dy, col] of [[-12, -6, '#c84a3a'], [8, -8, '#4a6ad8'], [10, 4, '#e0a030']]) { c.fillStyle = '#f0e0c0'; c.fillRect(n.x + dx, n.y + dy, 5, 4); c.fillStyle = col; c.beginPath(); c.moveTo(n.x + dx - 1, n.y + dy); c.lineTo(n.x + dx + 2.5, n.y + dy - 3); c.lineTo(n.x + dx + 6, n.y + dy); c.fill(); } },
      farm: n => { c.fillStyle = '#8a5a2a'; for (let i = 0; i < 3; i++) c.fillRect(n.x - 12 + i * 5, n.y + 4, 4, 3); },
      nursery: n => { for (const [dx, col] of [[-10, '#f8e0a0'], [8, '#c8e8ff']]) { c.fillStyle = col; c.beginPath(); c.ellipse(n.x + dx, n.y - 4, 2, 2.6, 0, 0, 7); c.fill(); } },
      mountain: n => { tri(n.x - 8, n.y + 2, 10, 16, '#6a6a72', '#f4f8ff'); tri(n.x + 6, n.y + 4, 9, 13, '#5a5a62', '#e8f0ff'); tri(n.x, n.y - 2, 9, 20, '#7a7a82', '#ffffff'); },
      volcano: n => { tri(n.x, n.y + 2, 11, 13, '#4a2a22'); c.fillStyle = '#ff7a20'; c.fillRect(n.x - 2, n.y - 11, 4, 2); c.fillRect(n.x - 1, n.y - 9, 1, 6); c.fillStyle = 'rgba(80,70,70,0.7)'; c.beginPath(); c.arc(n.x + 3, n.y - 15, 3, 0, 7); c.arc(n.x + 6, n.y - 18, 2.5, 0, 7); c.fill(); },
      savanna: n => { for (const dx of [-12, 10]) { c.fillStyle = '#5a3a20'; c.fillRect(n.x + dx, n.y - 2, 1, 4); c.fillStyle = '#6a7a2a'; c.fillRect(n.x + dx - 3, n.y - 4, 7, 2); } c.fillStyle = '#8a6a3a'; c.beginPath(); c.arc(n.x + 2, n.y + 8, 3, Math.PI, 0); c.fill(); },
      factory: n => { c.fillStyle = '#5a5e68'; c.fillRect(n.x - 9, n.y - 6, 14, 7); c.fillStyle = '#8a4a3a'; c.fillRect(n.x + 6, n.y - 13, 3, 14); c.fillStyle = 'rgba(200,200,200,0.7)'; c.beginPath(); c.arc(n.x + 9, n.y - 16, 2.5, 0, 7); c.fill(); },
      trash: n => { c.fillStyle = '#5a4a36'; c.beginPath(); c.moveTo(n.x - 10, n.y + 2); c.lineTo(n.x - 2, n.y - 9); c.lineTo(n.x + 9, n.y + 2); c.fill(); c.fillStyle = '#3a6ac8'; c.fillRect(n.x - 3, n.y - 4, 3, 2); c.fillStyle = '#c8402a'; c.fillRect(n.x + 2, n.y - 2, 2, 2); },
      canyon: n => { for (const [dx, h] of [[-9, 10], [8, 8]]) { c.fillStyle = '#a65c36'; c.fillRect(n.x + dx - 3, n.y - h, 6, h); c.fillStyle = '#d08a5a'; c.fillRect(n.x + dx - 3, n.y - h, 6, 1); } },
      dino: n => { c.fillStyle = '#e8dcc0'; c.fillRect(n.x - 8, n.y + 4, 12, 1); for (let i = 0; i < 4; i++) c.fillRect(n.x - 7 + i * 3, n.y + 1, 1, 3); tree(n.x + 9, n.y - 4, '#4a8a30', 1.2); },
      jungle: n => { for (let i = 0; i < 4; i++) { c.fillStyle = '#5a3a20'; c.fillRect(n.x - 10 + i * 7, n.y - 4, 1, 5); c.fillStyle = i % 2 ? '#2a9a3a' : '#3aaa48'; c.beginPath(); c.ellipse(n.x - 9.5 + i * 7, n.y - 5, 4, 1.6, 0, 0, 7); c.fill(); } },
      cemetery: n => { c.fillStyle = '#9a96aa'; for (let i = 0; i < 3; i++) { c.fillRect(n.x - 9 + i * 7, n.y - 5, 1, 5); c.fillRect(n.x - 10 + i * 7, n.y - 4, 3, 1); } c.fillStyle = '#e0761a'; c.fillRect(n.x + 9, n.y + 3, 2, 2); },
      fog: n => { c.fillStyle = 'rgba(230,245,245,0.5)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(n.x - 8 + i * 8, n.y + 6 - i * 3, 7, 2.4, 0, 0, 7); c.fill(); } },
      toy: n => { for (const [dx, col] of [[-10, '#f25a5a'], [-4, '#4ea4f2'], [8, '#f2c63a']]) { c.fillStyle = col; c.fillRect(n.x + dx, n.y - 6, 4, 4); } c.fillStyle = '#ffffff'; c.fillRect(n.x + 2, n.y - 12, 3, 6); c.fillStyle = '#f25a5a'; c.beginPath(); c.moveTo(n.x + 1, n.y - 12); c.lineTo(n.x + 3.5, n.y - 15); c.lineTo(n.x + 6, n.y - 12); c.fill(); },
      snow: n => { for (let i = 0; i < 4; i++) pine(n.x - 10 + i * 7, n.y + (i % 2) * 3, '#3a6070', '#ffffff'); },
      lake: n => { c.fillStyle = '#3aa0d8'; c.beginPath(); c.ellipse(n.x + 4, n.y + 2, 11, 7, 0, 0, 7); c.fill(); c.fillStyle = '#e8dcc0'; c.fillRect(n.x + 2, n.y, 5, 2); },
      beetle: n => { for (let i = 0; i < 3; i++) { c.fillStyle = '#6a4a2a'; c.fillRect(n.x - 9 + i * 7, n.y + 1, 4, 3); c.fillStyle = '#c8a070'; c.fillRect(n.x - 9 + i * 7, n.y + 1, 4, 1); } tree(n.x + 2, n.y - 6, '#3a7a2a', 1.6); },
      swamp: n => { c.fillStyle = '#5a7040'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(n.x - 8 + i * 8, n.y + 4 - (i % 2) * 6, 4, 2, 0, 0, 7); c.fill(); } },
      cave: n => { c.fillStyle = '#2a2026'; c.beginPath(); c.arc(n.x, n.y + 2, 6, Math.PI, 0); c.fill(); c.fillStyle = '#9a7ae8'; c.fillRect(n.x + 7, n.y - 2, 2, 3); },
    };
    for (const k in NODES) { const n = NODES[k]; if (draw[n.b]) draw[n.b](n); }
    return (artCache = cv);
  }

  // nuages qui cachent une zone inconnue
  function cloud(c, x, y, t, k) {
    c.fillStyle = 'rgba(236,242,250,0.94)';
    for (const [dx, dy, r] of [[-8, 2, 7], [0, -2, 9], [9, 2, 7], [4, 5, 6], [-4, 6, 5]]) { c.beginPath(); c.arc(x + dx + Math.sin(t * 0.6 + k) * 1.2, y + dy, r, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(160,176,200,0.6)'; c.beginPath(); c.ellipse(x, y + 8, 12, 2.4, 0, 0, 7); c.fill();
  }

  class WorldMapScene extends DW.Scene {
    constructor() {
      super();
      this.st = DW.state;
      this.here = DW.ow ? nodeOf(DW.ow.mapId) : 'village';
      // un lieu est découvert dès qu'une de ses cartes a été visitée (intérieurs compris)
      this.found = {};
      for (const id in this.st.visited) if (this.st.visited[id] && (DW.MAPS[id] || NODES[id])) this.found[nodeOf(id)] = true;
      this.found[this.here] = true;
      this.sel = this.here; this.zoom = null; this.zsel = 0;
      this.zi = 1; const N = NODES[this.here]; this.cam = this.camFor(N.x, N.y);
      // la carte s'ouvre directement sur les sous-zones de l'endroit où l'on est
      if (DW.ow && subsOf(this.here).includes(DW.ow.mapId)) this.openZoom(this.here);
    }
    visited(k) { return !!this.found[k]; }
    // un lieu non découvert est entièrement caché (ni point, ni nom, ni chemin)
    state(k) { return this.visited(k) ? 'visited' : 'hidden'; }
    // caméra : centrée sur le lieu choisi, sans sortir de la carte
    camFor(x, y) {
      const z = ZOOMS[this.zi], hw = W / 2 / z, hh = MH / 2 / z;
      return { x: DW.clamp(x, hw, W - hw), y: DW.clamp(y, hh, MH - hh) };
    }
    P(x, y) { const z = ZOOMS[this.zi]; return [(x - this.cam.x) * z + W / 2, (y - this.cam.y) * z + MH / 2]; }
    // brouillard : tout est caché sauf autour des lieux découverts et des chemins entre eux
    fog() {
      if (this.fogCv) return this.fogCv;
      const cv = Art.canvas(W * RES, MH * RES), c = cv.getContext('2d');
      c.scale(RES, RES);
      c.fillStyle = '#c9d4e4'; c.fillRect(0, 0, W, MH);
      for (let i = 0; i < 160; i++) {
        const x = Art.hash(i, 1, 77) * W, y = Art.hash(i, 2, 77) * MH, r = 6 + Art.hash(i, 3, 77) * 14;
        c.fillStyle = Art.hash(i, 4, 77) < 0.5 ? 'rgba(236,242,250,0.8)' : 'rgba(170,184,206,0.45)';
        c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      }
      c.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r) => { const g = c.createRadialGradient(x, y, r * 0.55, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
      for (const k in NODES) if (this.visited(k)) hole(NODES[k].x, NODES[k].y, subsOf(k).length > 1 ? 26 : 18);
      for (const [a, b] of EDGES) if (this.visited(a) && this.visited(b)) {
        const A = NODES[a], B = NODES[b], n = Math.ceil(Math.hypot(B.x - A.x, B.y - A.y) / 5);
        for (let i = 0; i <= n; i++) hole(A.x + (B.x - A.x) * i / n, A.y + (B.y - A.y) * i / n, 11);
      }
      return (this.fogCv = cv);
    }
    // déplacement vers le lieu le plus proche dans la direction choisie
    pick(points, from, dir) {
      const [dx, dy] = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
      let best = null, bs = 1e9;
      for (const p of points) {
        if (p.k === from.k) continue;
        const vx = p.x - from.x, vy = p.y - from.y, along = vx * dx + vy * dy, perp = Math.abs(vx * dy - vy * dx);
        if (along <= 0 || perp > along * 1.6) continue;
        const s = along + perp * 2;
        if (s < bs) { bs = s; best = p; }
      }
      return best;
    }
    openZoom(k) {
      const subs = subsOf(k);
      if (subs.length < 2 || !subs.some(id => this.st.visited[id])) return false;
      // disposition des sous-zones d'après leurs passages (toutes placées, seules les visitées sont dessinées)
      const step = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }, grid = {}, used = new Set();
      const place = (id, p) => { grid[id] = p; used.add(p.join(',')); };
      for (const start of subs) {
        if (grid[start]) continue;
        // morceau non relié : posé à droite de ce qui existe déjà
        const xs = Object.values(grid).map(p => p[0]);
        place(start, [xs.length ? Math.max(...xs) + 1 : 0, 0]);
        const q = [start];
        while (q.length) {
          const id = q.shift();
          for (const w of DW.MAPS[id].warps) if (subs.includes(w.to) && !grid[w.to] && step[w.dir]) {
            let p = [grid[id][0] + step[w.dir][0], grid[id][1] + step[w.dir][1]];
            while (used.has(p.join(','))) p = [p[0] + step[w.dir][0], p[1] + step[w.dir][1]];
            place(w.to, p); q.push(w.to);
          }
        }
      }
      const xs = Object.values(grid).map(p => p[0]), ys = Object.values(grid).map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
      const cols = Math.max(...xs) - x0 + 1, rows = Math.max(...ys) - y0 + 1;
      const gx = 8, gy = 12, cw = Math.min(66, Math.floor((W - 12 - (cols - 1) * gx) / cols)), ch = Math.min(34, Math.floor((MH - 32 - (rows - 1) * gy) / rows));
      const ox = Math.round((W - (cols * cw + (cols - 1) * gx)) / 2), oy = Math.round(24 + (MH - 24 - (rows * ch + (rows - 1) * gy)) / 2);
      const cells = subs.map(id => ({ k: id, x: ox + (grid[id][0] - x0) * (cw + gx), y: oy + (grid[id][1] - y0) * (ch + gy), w: cw, h: ch }));
      cells.forEach(cl => { cl.cx = cl.x + cl.w / 2; cl.cy = cl.y + cl.h / 2; });
      this.zoom = { k, cells };
      const cur = DW.ow && cells.find(cl => cl.k === DW.ow.mapId);
      this.zsel = cur ? cells.indexOf(cur) : cells.findIndex(cl => this.st.visited[cl.k]);
      return true;
    }
    update() {
      const dir = ['left', 'right', 'up', 'down'].find(d => Input.hit(d));
      if (this.zoom) {
        const cells = this.zoom.cells, cur = cells[this.zsel];
        if (dir) {
          const pts = cells.filter(cl => this.st.visited[cl.k]).map(cl => ({ k: cl.k, x: cl.cx, y: cl.cy }));
          const p = this.pick(pts, { k: cur.k, x: cur.cx, y: cur.cy }, dir);
          if (p) { this.zsel = cells.findIndex(cl => cl.k === p.k); Audio.sfx('move'); }
        }
        if (Input.hit('back') || Input.hit('ok')) { Audio.sfx('back'); this.zoom = null; }
        return;
      }
      if (dir) {
        const pts = Object.keys(NODES).filter(k => this.visited(k)).map(k => ({ k, x: NODES[k].x, y: NODES[k].y }));
        const p = this.pick(pts, { k: this.sel, x: NODES[this.sel].x, y: NODES[this.sel].y }, dir);
        if (p) { this.sel = p.k; Audio.sfx('move'); }
      }
      // zoom : ×1 (toute l'île) → ×2 → ×3
      if (Input.hit('run') || Input.hit('menu')) { this.zi = (this.zi + 1) % ZOOMS.length; Audio.sfx('select'); }
      const N = NODES[this.sel], to = this.camFor(N.x, N.y);
      this.cam.x += (to.x - this.cam.x) * 0.25; this.cam.y += (to.y - this.cam.y) * 0.25;
      if (Input.hit('ok')) {
        if (this.openZoom(this.sel)) Audio.sfx('select'); else Audio.sfx('bump');
      }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); }
    }

    // ---------------------------------------------------------- dessin
    draw(c) {
      c.fillStyle = '#0e2a5a'; c.fillRect(0, 0, W, H);
      if (this.zoom) this.drawZoom(c); else this.drawIsland(c);
      this.drawPanel(c);
    }
    drawIsland(c) {
      const t = this.t, z = ZOOMS[this.zi], sx = (this.cam.x - W / 2 / z) * RES, sy = (this.cam.y - MH / 2 / z) * RES, sw = W / z * RES, sh = MH / z * RES;
      c.save(); c.beginPath(); c.rect(0, 0, W, MH); c.clip();
      c.drawImage(art(), sx, sy, sw, sh, 0, 0, W, MH);
      c.drawImage(this.fog(), sx, sy, sw, sh, 0, 0, W, MH);
      // liaisons entre lieux découverts
      for (const [a, b] of EDGES) {
        if (!this.visited(a) || !this.visited(b)) continue;
        const [ax, ay] = this.P(NODES[a].x, NODES[a].y), [bx, by] = this.P(NODES[b].x, NODES[b].y);
        c.strokeStyle = 'rgba(20,14,8,0.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
        c.strokeStyle = '#ffe9a0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
      }
      // lieux découverts (losange = lieu avec des sous-zones)
      const k0 = 1 + (z - 1) * 0.35;
      for (const k in NODES) {
        if (!this.visited(k)) continue;
        const [x, y] = this.P(NODES[k].x, NODES[k].y), reg = subsOf(k).length > 1;
        const r = (reg ? 5 : 3.6) * k0, col = k === this.here ? '#ff5a5a' : '#ffd040';
        c.fillStyle = '#10141e'; c.beginPath();
        if (reg) { c.moveTo(x, y - r - 1.5); c.lineTo(x + r + 1.5, y); c.lineTo(x, y + r + 1.5); c.lineTo(x - r - 1.5, y); } else c.arc(x, y, r + 1.4, 0, 7);
        c.fill();
        c.fillStyle = col; c.beginPath();
        if (reg) { c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); } else c.arc(x, y, r, 0, 7);
        c.fill();
        // au zoom ×3, le nom de chaque lieu découvert
        if (z > 2 && k !== this.sel) UI.text(c, this.nameOf(k), x, y + r + 9, { size: 6, align: 'center', color: '#ffffff' });
      }
      // curseur + étiquette du lieu choisi
      const [nx, ny] = this.P(NODES[this.sel].x, NODES[this.sel].y);
      c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.beginPath(); c.arc(nx, ny, 9 * k0 + Math.sin(t * 6), 0, 7); c.stroke();
      const name = this.nameOf(this.sel);
      const lw = UI.measure(c, name, 8) + 10, lx = DW.clamp(nx - lw / 2, 2, W - lw - 2), ly = ny > 34 ? ny - 18 - 9 * k0 : ny + 8 + 9 * k0;
      UI.box(c, lx, ly, lw, 14, 'dark'); UI.text(c, name, lx + lw / 2, ly + 10.5, { size: 8, align: 'center', color: '#ffe070' });
      // le partenaire marque la position actuelle
      const [hx, hy] = this.P(NODES[this.here].x, NODES[this.here].y), pt = this.st.party[0];
      if (pt) DW.Sprites.draw(c, DW.Sprites.ow(pt.sp), hx - 11, hy + 4 + 8 * k0 + Math.round(Math.sin(t * 4) * 1.5), { frame: Math.floor(t * 2) });
      c.restore();
      UI.box(c, W - 40, 3, 36, 14); UI.text(c, '×' + z, W - 22, 13.5, { size: 8, align: 'center', color: '#ffe070' });
    }
    drawZoom(c) {
      const t = this.t, Z = this.zoom, k = Z.k, N = NODES[k], B = BIOME[N.b];
      // fond : couleur du biome, quadrillage discret
      const g = c.createLinearGradient(0, 0, 0, MH); g.addColorStop(0, B[0]); g.addColorStop(1, '#0a0c14');
      c.fillStyle = g; c.fillRect(0, 0, W, MH);
      c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 1;
      for (let x = 0; x < W; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, MH); c.stroke(); }
      for (let y = 0; y < MH; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      const byId = {}; Z.cells.forEach(cl => (byId[cl.k] = cl));
      const vis = id => !!this.st.visited[id];
      // passages entre sous-zones visitées, et sorties déjà empruntées (flèches)
      const drawn = new Set();
      for (const cl of Z.cells) if (vis(cl.k)) for (const w of DW.MAPS[cl.k].warps) {
        const o = byId[w.to];
        if (o) {
          const key = [cl.k, w.to].sort().join('|'); if (drawn.has(key) || !vis(w.to)) continue; drawn.add(key);
          c.strokeStyle = '#ffe9a0'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(cl.cx, cl.cy); c.lineTo(o.cx, o.cy); c.stroke();
        } else if (vis(w.to) && w.dir) {
          const [dx, dy] = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[w.dir] || [0, 0];
          const ax = cl.cx + dx * (cl.w / 2 + 6), ay = cl.cy + dy * (cl.h / 2 + 6);
          c.fillStyle = '#ffd040'; c.beginPath();
          c.moveTo(ax + dx * 5, ay + dy * 5); c.lineTo(ax - dy * 4, ay + dx * 4); c.lineTo(ax + dy * 4, ay - dx * 4); c.fill();
        }
      }
      // cartes des sous-zones visitées (les autres restent invisibles)
      Z.cells.forEach((cl, i) => {
        if (!vis(cl.k)) return;
        const m = DW.MAPS[cl.k], sel = i === this.zsel, here = DW.ow && DW.ow.mapId === cl.k;
        const th = DW.World.THEMES[m.theme] || {}, fill = th.grass ? th.grass[2] : B[1];
        c.fillStyle = '#0a0c14'; c.fillRect(cl.x + 2, cl.y + 2, cl.w, cl.h);
        c.fillStyle = fill; c.fillRect(cl.x, cl.y, cl.w, cl.h);
        if (th.canopy) { c.fillStyle = th.canopy[2]; c.fillRect(cl.x, cl.y + cl.h - 7, cl.w, 7); }
        c.strokeStyle = sel ? '#ffffff' : here ? '#ff6a6a' : '#0a0c14'; c.lineWidth = sel ? 2 : 1.2; c.strokeRect(cl.x + 0.5, cl.y + 0.5, cl.w - 1, cl.h - 1);
        const light = th.grass && parseInt(th.grass[2].slice(1, 3), 16) > 170;
        const lines = UI.wrap(c, m.name, cl.w - 6, 7).slice(0, 3);
        lines.forEach((l, j) => UI.text(c, l, cl.cx, cl.y + 10 + j * 8 + (lines.length === 1 ? 4 : 0), { size: 7, align: 'center', color: light ? '#1a2030' : '#ffffff', shadow: !light }));
        if (m.piece) UI.text(c, '★', cl.x + cl.w - 6, cl.y + cl.h - 1, { size: 7, align: 'center', color: '#ffe070', shadow: false });
        if (m.indoor) UI.text(c, '▼', cl.x + 5, cl.y + cl.h - 1, { size: 6, align: 'center', color: '#c8b8ff', shadow: false });
      });
      // position actuelle
      const cur = DW.ow && byId[DW.ow.mapId], pt = this.st.party[0];
      if (cur && pt) DW.Sprites.draw(c, DW.Sprites.ow(pt.sp), cur.x + 2, cur.y + cur.h + 6 + Math.round(Math.sin(t * 4) * 1.5), { frame: Math.floor(t * 2) });
      // en-tête
      const subs = subsOf(k), seen = subs.filter(id => vis(id)).length;
      UI.box(c, 4, 3, 190, 16); UI.text(c, this.nameOf(k).toUpperCase(), 10, 14.5, { size: 8, color: '#ffe070' });
      UI.box(c, W - 92, 3, 88, 16); UI.text(c, `Zones : ${seen} / ${subs.length}`, W - 48, 14.5, { size: 7, align: 'center' });
    }
    nameOf(k) { return (NODES[k] && NODES[k].name) || (DW.MAPS[k] && DW.MAPS[k].name) || k; }
    // panneau d'information (sous la carte, ne recouvre jamais un lieu)
    drawPanel(c) {
      const y0 = MH + 2;
      UI.box(c, 4, y0, W - 8, H - y0 - 3);
      let title, desc, mapId, s;
      if (this.zoom) {
        const cl = this.zoom.cells[this.zsel], m = DW.MAPS[cl.k], v = !!this.st.visited[cl.k];
        title = v ? m.name : '???'; mapId = cl.k; s = v ? 'visited' : 'known';
        const arrow = { left: '←', right: '→', up: '↑', down: '↓' };
        // seuls les passages déjà empruntés sont nommés : le reste est à découvrir
        const ways = m.warps.filter(w => this.st.visited[w.to] && DW.MAPS[w.to]).map(w => { const d = DW.MAPS[w.to]; return (arrow[w.dir] || '•') + ' ' + (d.region === m.region ? d.name : (d.regionName || d.name)); });
        desc = `${m.piece ? '★ Lieu emblématique. ' : ''}${m.indoor ? 'Souterrain. ' : ''}${ways.length ? 'Passages connus : ' + [...new Set(ways)].join('   ') : 'Aucun passage encore emprunté.'}`;
      } else {
        const k = this.sel; s = this.state(k);
        title = s === 'visited' ? this.nameOf(k) : '???'; mapId = DW.MAPS[k] ? k : null;
        const subs = subsOf(k), seen = subs.filter(id => this.st.visited[id]).length;
        desc = s !== 'visited' ? 'Lieu inexploré. Trouve le chemin pour y aller !'
          : k === 'village' ? `Niveau ${DW.Town.level()} : « ${DW.Town.levelName()} ». ${NODES[k].desc}`
          : subs.length ? `${seen} / ${subs.length} sous-zones explorées. ${NODES[k].desc}` : NODES[k].desc;
      }
      UI.text(c, title, 12, y0 + 14, { size: 10, color: s === 'visited' ? '#ffe070' : '#a0a8b8' });
      const isHere = this.zoom ? DW.ow && DW.ow.mapId === mapId : this.sel === this.here;
      if (isHere) UI.text(c, 'Tu es ici', W - 12, y0 + 14, { size: 8, align: 'right', color: '#ff8a8a' });
      // Digimon sauvages de la carte (à droite, dans le panneau)
      const enc = s === 'visited' && mapId && DW.MAPS[mapId] && DW.MAPS[mapId].encounters;
      const list = enc && enc.length ? [...new Set(enc.map(e => e.sp))].slice(0, 6) : [];
      const tw = list.length ? W - 26 - list.length * 20 : W - 24;
      UI.wrap(c, desc, tw - 12, 8).slice(0, 3).forEach((l, j) => UI.text(c, l, 12, y0 + 27 + j * 10, { size: 8, color: '#c8f0ff' }));
      if (list.length) {
        const zs = this.st.zoneSeen[mapId] || {};
        list.forEach((sp, j) => {
          const x = W - 18 - (list.length - 1 - j) * 20, seen = zs[sp] || this.st.owned[sp];
          DW.Sprites.draw(c, DW.Sprites.ow(sp), x, y0 + 50, { silhouette: !seen, frame: Math.floor(this.t * 2 + j) });
          if (this.st.owned[sp]) { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(x + 7, y0 + 30, 2, 0, 7); c.fill(); }
        });
      }
      const all = Object.keys(NODES), explored = all.filter(k => this.visited(k)).length;
      if (!this.zoom) UI.text(c, `Lieux explorés : ${explored} / ${all.length}`, 12, H - 7, { size: 6, color: '#9ab0e8', shadow: false });
      c.fillStyle = 'rgba(6,10,24,0.6)'; c.fillRect(0, MH - 13, W, 13);
      UI.hints(c, this.zoom ? [['back', 'retour']] : [['ok', 'zones'], ['run', 'zoom'], ['back', 'fermer']], W - 6, MH - 3);
    }
  }
  DW.WorldMapScene = WorldMapScene;
  WorldMapScene.nodeOf = nodeOf; WorldMapScene.subsOf = subsOf;   // (pour les tests)
  DW.islandImage = island;
})();
