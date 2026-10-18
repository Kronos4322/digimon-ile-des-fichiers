'use strict';
// =====================================================================
//  CARTE DE L'ÎLE DES FICHIERS
//  Un seul grand plan : l'île peinte selon les biomes, et une icône par zone (sous-zones comprises),
//  regroupées autour du lieu de leur région, reliées par les chemins déjà empruntés.
//  Un brouillard cache tout ce qui n'est pas découvert : la carte se révèle petit à petit.
//  Flèches : d'une zone à l'autre ; ESPACE / Courir : zoom ×1 / ×2 / ×3.
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const Art = DW.Art;
  const W = DW.W, H = DW.H, MH = 176; // hauteur de la zone carte (le panneau d'infos est en dessous)
  const RES = 2;                       // résolution de la peinture de l'île (pour le zoom)
  const ZOOMS = [1, 2, 3];             // niveaux de zoom (touche Courir / Maj / bouton X)

  // lieux de la carte (coordonnées dans la zone carte 320×176)
  const NODES = {
    // (chapitres 1-2, d'après les passages : le lac AU NORD de la Clairière, au bord nord-ouest de l'île ;
    //  la Plage des Cabines, les Dunes et la Crique sur la côte sud-ouest)
    clairiere: { x: 70, y: 57, b: 'forest', desc: 'La clairière où tu as atterri. Une source de données y soigne les Digimon.' },
    sentier: { x: 84, y: 64, b: 'forest', desc: 'Un sentier sinueux traversé par une rivière. On y entend des murmures...' },
    prairie: { x: 114, y: 58, b: 'meadow', desc: "Une prairie d'herbes hautes où de nombreux Digimon viennent jouer. Idéal pour s'aguerrir au combat !" },
    geants: { x: 72, y: 90, b: 'forest', desc: 'Des arbres immenses entourent un lac paisible.' },
    lisiere: { x: 94, y: 112, b: 'autumn', desc: "La forêt s'arrête au bord d'un ravin. Kuwagamon y rôde." },
    plage: { x: 104, y: 156, b: 'beach', desc: "Une plage de sable avec d'étranges cabines téléphoniques." },
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
    lac: { x: 70, y: 41, b: 'lake', name: 'Lac du Tramway', desc: "Un grand lac où s'est échoué un vieux tramway. Pointe Coela, Pont Numérique et phare." },
    miharashi: { x: 44, y: 60, b: 'desert', name: 'Pays de Meramon', desc: "Des déserts hérissés de poteaux télégraphiques, le Village des Yokomon et sa vieille épave, et le Mont Miharashi où veille Meramon." },
    scarabees: { x: 30, y: 90, b: 'beetle', name: 'Pays des Scarabées', desc: "Une forêt ancienne de souches géantes, l'Arbre-Monde et le Colisée des Scarabées." },
    marais: { x: 146, y: 160, b: 'swamp', name: 'Marais des Geko', desc: 'Tourbières, roseaux chantants, cabanes sur pilotis et le Palais Geko.' },
    tunnel: { x: 196, y: 166, b: 'cave', name: 'Tunnel Foreur', desc: "Galeries de foreuses, rails abandonnés, cristaux... jusqu'à la Grotte de Lave." },
  };
  const EDGES = [['clairiere', 'sentier'], ['sentier', 'prairie'], ['prairie', 'berceau'], ['sentier', 'geants'], ['geants', 'lisiere'], ['lisiere', 'plage'], ['plage', 'village'], ['village', 'gym'], ['village', 'champs'],
    ['village', 'montagne'], ['montagne', 'volcan'], ['montagne', 'savane'], ['savane', 'usine'], ['savane', 'decharge'], ['savane', 'canyon'], ['canyon', 'dino'], ['canyon', 'jungle'], ['jungle', 'overdell'],
    ['berceau', 'brumes'], ['brumes', 'jouets'], ['brumes', 'gel'], ['clairiere', 'lac'], ['clairiere', 'miharashi'], ['sentier', 'miharashi'], ['lac', 'miharashi'], ['miharashi', 'scarabees'], ['champs', 'marais'], ['champs', 'tunnel']];
  // couleurs des biomes sur la carte [ombre, base, lumière]
  const BIOME = {
    forest: ['#1e5a2a', '#2e7234', '#46903e'], meadow: ['#4a8a34', '#64a83e', '#88c454'], autumn: ['#7a4a1e', '#a8642a', '#d08a3a'], beach: ['#c8a868', '#e2c88a', '#f4e2b0'],
    town: ['#4a8a4a', '#66aa5a', '#8ccc72'], farm: ['#6a8a34', '#8aa840', '#b0c860'], nursery: ['#d07aa8', '#e8a0c4', '#f8c8e0'],
    mountain: ['#5a5a62', '#7a7a82', '#a8a8b0'], volcano: ['#4a2a22', '#6a3a2a', '#c8502a'], savanna: ['#a88a36', '#c8a848', '#e4c868'], factory: ['#4a4e56', '#626670', '#848892'],
    trash: ['#5a4a36', '#76624a', '#96806a'], canyon: ['#9a4a28', '#c06a38', '#de9058'], dino: ['#2e5a22', '#447a30', '#6a9a3e'], jungle: ['#145a24', '#1e7a32', '#34a048'],
    cemetery: ['#2e2a3e', '#463e5a', '#625a7a'], fog: ['#4a6a64', '#6a8a84', '#9ab8b0'], toy: ['#c86aa0', '#e890c0', '#ffb8dc'], snow: ['#9aaac4', '#c4d2e6', '#f0f6ff'],
    lake: ['#3a8a4a', '#4aa058', '#6ac070'], desert: ['#9a8a5a', '#c0ae7a', '#e0d2a0'], beetle: ['#3a6a24', '#4e822e', '#6a9e3e'], swamp: ['#3a4a24', '#4e5e2e', '#6a7a3e'], cave: ['#3a3236', '#524850', '#706670'],
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
    const S = Object.values(NODES).map(n => ({ x: n.x, y: n.y, c: cols[n.b], b: n.b }));
    const HIGH = { mountain: 1, volcano: 0.9, snow: 0.6, canyon: 0.5, trash: 0.4, beetle: 0.2, forest: 0.15, jungle: 0.15, dino: 0.2 };
    // forme de l'île (r < 1 : terre) et relief (pour l'ombrage)
    const shape = (x, y) => Math.hypot((x - 160) / 152, (y - 90) / 82) + (Art.fbm(x * 0.03, y * 0.03, 41) - 0.5) * 0.28;
    const relief = (x, y) => {
      let h = Art.fbm(x * 0.06, y * 0.06, 44) * 0.5;
      for (const s of S) { const k = HIGH[s.b]; if (k) { const d = Math.hypot(x - s.x, (y - s.y) * 1.2); if (d < 26) h += k * (1 - d / 26) * 1.2; } }
      return h * Math.max(0, Math.min(1, (1 - shape(x, y)) * 8));
    };
    for (let Y = 0; Y < MH * RES; Y++) for (let X = 0; X < W * RES; X++) {
      const x = X / RES, y = Y / RES, i = (Y * W * RES + X) * 4, nx = Art.fbm(x * 0.03, y * 0.03, 41) - 0.5, ny = Art.fbm(x * 0.03, y * 0.03, 42) - 0.5;
      const r = shape(x, y), bay = Art.bayer(X, Y);
      let col;
      if (r > 1.0) {
        // mer : lagon turquoise près des côtes, bleu profond au large, vaguelettes et écume
        const deep = Math.min(1, (r - 1) * 3.2 + (bay - 0.5) * 0.08);
        col = deep < 0.25 ? Art.mix([110, 214, 226], [70, 170, 220], deep * 4) : Art.mix([70, 170, 220], [16, 48, 118], (deep - 0.25) / 0.75);
        const wv = Math.sin(x * 0.22 + y * 0.9 + Art.noise(x * 0.04, y * 0.04, 2) * 7);
        if (wv > 0.93 && deep > 0.2) col = Art.mix(col, [255, 255, 255], 0.3);
        if (r < 1.018 && Art.noise(x * 0.5, y * 0.5, 3) > 0.35) col = Art.mix(col, [255, 255, 255], 0.75);   // écume
      } else if (r > 0.93) {
        // plage : sable sec, sable mouillé au bord de l'eau
        col = Art.hex(r > 0.985 ? '#d8bc84' : bay < 0.5 ? '#f2dcaa' : '#ecd29c');
      } else {
        // biome du lieu le plus proche ; frontières fondues (tramage) au lieu d'un trait noir
        let best = null, sec = null, bd = 1e9, second = 1e9;
        const qx = x + nx * 26, qy = y + ny * 22;
        for (const s of S) { const dd = (qx - s.x) * (qx - s.x) + (qy - s.y) * (qy - s.y) * 1.3; if (dd < bd) { second = bd; sec = best; bd = dd; best = s; } else if (dd < second) { second = dd; sec = s; } }
        const gap = Math.sqrt(second) - Math.sqrt(bd), pal = sec && gap < 4 && bay * 4 > gap ? sec.c : best.c;
        const v = Art.fbm(x * 0.09, y * 0.09, 43) + bay * 0.12;
        col = pal[v < 0.42 ? 0 : v < 0.62 ? 1 : 2];
        // ombrage du relief (lumière venant du nord-ouest)
        const sh = (relief(x - 0.6, y - 0.6) - relief(x + 0.6, y + 0.6)) * 9;
        col = sh > 0 ? Art.mix(col, [255, 250, 220], Math.min(0.35, sh)) : Art.mix(col, [10, 20, 30], Math.min(0.4, -sh));
        // lisière vers la plage
        if (r > 0.9) col = Art.mix(col, [236, 214, 160], (r - 0.9) / 0.03 * 0.5);
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


  // ------------------------------------------------------------ plan unique : une icône par zone (sous-zones comprises)
  // chaque zone est placée autour du lieu de sa région, disposée d'après ses passages
  const STEP = 6.5;   // écart entre deux icônes d'une même région (unités de la carte 320×176)
  let layout = null;
  function shown(id) { const m = DW.MAPS[id]; return !!m && !m.noMap && (!m.indoor || (m.encounters && m.encounters.length) || m.spec); }
  function buildLayout() {
    if (layout) return layout;
    const pts = {}, groups = {};
    for (const id of Object.keys(DW.MAPS)) if (shown(id)) (groups[nodeOf(id)] = groups[nodeOf(id)] || []).push(id);
    const step = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    for (const k in groups) {
      const ids = groups[k], N = NODES[k];
      const grid = {}, used = new Set();
      const place = (id, p) => { grid[id] = p; used.add(p.join(',')); };
      const first = ids.includes(k) ? k : ids[0];
      for (const start of [first, ...ids]) {
        if (grid[start]) continue;
        const xs = Object.values(grid).map(p => p[0]);
        let p0 = [xs.length ? Math.max(...xs) + 1 : 0, 0];
        while (used.has(p0.join(','))) p0 = [p0[0], p0[1] + 1];
        place(start, p0);
        const q = [start];
        while (q.length) {
          const id = q.shift();
          for (const w of DW.MAPS[id].warps || []) if (ids.includes(w.to) && !grid[w.to] && step[w.dir]) {
            let p = [grid[id][0] + step[w.dir][0], grid[id][1] + step[w.dir][1]];
            while (used.has(p.join(','))) p = [p[0] + step[w.dir][0], p[1] + step[w.dir][1]];
            place(w.to, p); q.push(w.to);
          }
          // zones où l'on entre autrement que par un passage (tronc creux, trappe...) : placées d'après leur sortie
          // vers celle-ci (on sort du village des Poyomon par le bas vers la Prairie : il est au nord de la Prairie)
          const back = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };
          for (const other of ids) if (!grid[other]) for (const w of DW.MAPS[other].warps || []) if (w.to === id && back[w.dir]) {
            let p = [grid[id][0] + back[w.dir][0], grid[id][1] + back[w.dir][1]];
            while (used.has(p.join(','))) p = [p[0] + back[w.dir][0], p[1] + back[w.dir][1]];
            place(other, p); q.push(other); break;
          }
        }
      }
      // la zone principale (ou le centre du groupe) tombe sur le lieu de la région
      const c0 = grid[first], xs = ids.map(id => grid[id][0]), ys = ids.map(id => grid[id][1]);
      const cx = ids.includes(k) ? c0[0] : (Math.min(...xs) + Math.max(...xs)) / 2, cy = ids.includes(k) ? c0[1] : (Math.min(...ys) + Math.max(...ys)) / 2;
      for (const id of ids) pts[id] = { id, k, x: N.x + (grid[id][0] - cx) * STEP, y: N.y + (grid[id][1] - cy) * STEP * 0.8 };
    }
    return (layout = pts);
  }
  // pictogramme d'une zone
  function glyphOf(id) {
    const m = DW.MAPS[id], k = nodeOf(id), b = NODES[k].b;
    if (m.piece || m.landmark) return 'star';
    if (m.indoor) return 'cave';
    if (k === 'village' && !(m.encounters && m.encounters.length)) return 'house';
    if (m.respawn) return 'house';
    if (m.theme === 'beach' || m.bg === 'plage') return 'wave';
    if (m.bg === 'foret' || m.theme === 'meadow' || m.theme === 'forest') return 'tree';
    if (b === 'beach' || b === 'lake') return 'wave';
    if (b === 'mountain' || b === 'canyon' || b === 'trash') return 'peak';
    if (b === 'volcano') return 'flame';
    if (b === 'snow') return 'snow';
    return 'tree';
  }
  function icon(c, x, y, s, g, col, sel, here) {
    const r = s / 2;
    c.fillStyle = '#0a0c14'; c.fillRect(Math.round(x - r - 1), Math.round(y - r - 1), s + 2, s + 2);
    c.fillStyle = here ? '#ff6a5a' : col; c.fillRect(Math.round(x - r), Math.round(y - r), s, s);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(Math.round(x - r), Math.round(y - r), s, 1);
    const k = s / 12;
    c.save(); c.translate(x, y); c.scale(k, k);
    const W2 = '#ffffff', D = '#1a2030';
    if (g === 'tree') { c.fillStyle = '#5a3a20'; c.fillRect(-1, 1, 2, 4); c.fillStyle = '#1e6a2a'; c.beginPath(); c.arc(0, -1, 3.6, 0, 7); c.fill(); c.fillStyle = '#4aa848'; c.beginPath(); c.arc(-1, -2, 2, 0, 7); c.fill(); }
    else if (g === 'wave') { c.strokeStyle = W2; c.lineWidth = 1.4; for (const dy of [-2, 2]) { c.beginPath(); c.moveTo(-4, dy); c.quadraticCurveTo(-2, dy - 2, 0, dy); c.quadraticCurveTo(2, dy + 2, 4, dy); c.stroke(); } }
    else if (g === 'house') { c.fillStyle = '#f0e0c0'; c.fillRect(-3, -1, 6, 5); c.fillStyle = '#c84a3a'; c.beginPath(); c.moveTo(-4.5, -1); c.lineTo(0, -5); c.lineTo(4.5, -1); c.fill(); c.fillStyle = D; c.fillRect(-1, 1, 2, 3); }
    else if (g === 'cave') { c.fillStyle = D; c.beginPath(); c.arc(0, 2, 4, Math.PI, 0); c.fill(); c.fillRect(-4, 2, 8, 2); }
    else if (g === 'peak') { c.fillStyle = '#5a5a62'; c.beginPath(); c.moveTo(-5, 4); c.lineTo(0, -5); c.lineTo(5, 4); c.fill(); c.fillStyle = W2; c.beginPath(); c.moveTo(-1.6, -2); c.lineTo(0, -5); c.lineTo(1.6, -2); c.fill(); }
    else if (g === 'flame') { c.fillStyle = '#ff7a20'; c.beginPath(); c.moveTo(0, -5); c.quadraticCurveTo(5, 1, 0, 4); c.quadraticCurveTo(-5, 1, 0, -5); c.fill(); c.fillStyle = '#ffe040'; c.beginPath(); c.arc(0, 1.5, 1.8, 0, 7); c.fill(); }
    else if (g === 'snow') { c.strokeStyle = W2; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; c.beginPath(); c.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); c.lineTo(-Math.cos(a) * 4, -Math.sin(a) * 4); c.stroke(); } }
    else if (g === 'star') { c.fillStyle = '#ffe040'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 2 : 4.6; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.fill(); }
    c.restore();
    if (sel) { c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.strokeRect(Math.round(x - r - 2.5) + 0.5, Math.round(y - r - 2.5) + 0.5, s + 4, s + 4); }
  }

  class WorldMapScene extends DW.Scene {
    constructor() {
      super();
      this.st = DW.state;
      this.pts = buildLayout();
      const vis = id => !!this.st.visited[id];
      this.list = Object.values(this.pts).filter(p => vis(p.id));
      const cur = DW.ow && DW.ow.mapId;
      this.hereId = cur && this.pts[cur] ? cur : null;
      if (!this.hereId && cur) {   // dans une maison, une salle... : la zone voisine la plus proche
        const k = nodeOf(cur), near = this.list.filter(p => p.k === k);
        this.hereId = (near[0] || this.list[0] || {}).id || null;
      }
      this.here = this.hereId ? this.pts[this.hereId].k : 'village';
      this.sel = this.hereId || (this.list[0] && this.list[0].id);
      this.selK = this.here;
      this.zi = 0;   // la carte s'ouvre sur les grands ensembles
      const P = this.sel ? this.pts[this.sel] : NODES.village;
      this.cam = this.camFor(P.x, P.y);
    }
    // un lieu (région) est découvert dès qu'une de ses zones a été visitée
    visited(k) { return this.list.some(p => p.k === k); }
    camFor(x, y) {
      const z = ZOOMS[this.zi], hw = W / 2 / z, hh = MH / 2 / z;
      return { x: DW.clamp(x, hw, W - hw), y: DW.clamp(y, hh, MH - hh) };
    }
    P(x, y) { const z = ZOOMS[this.zi]; return [(x - this.cam.x) * z + W / 2, (y - this.cam.y) * z + MH / 2]; }
    // brouillard : tout est caché sauf autour des zones visitées et des chemins entre elles
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
      const hole = (x, y, r) => { const g = c.createRadialGradient(x, y, r * 0.5, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
      for (const p of this.list) hole(p.x, p.y, 17);
      for (const k in NODES) if (this.visited(k)) hole(NODES[k].x, NODES[k].y, 26);   // le cœur d'une région découverte
      for (const [a, b] of this.paths()) { const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4); for (let i = 0; i <= n; i++) hole(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, 10); }
      return (this.fogCv = cv);
    }
    // chemins : passages entre deux zones visitées
    paths() {
      if (this._paths) return this._paths;
      const out = [], seen = new Set();
      for (const p of this.list) for (const w of DW.MAPS[p.id].warps || []) {
        const q = this.pts[w.to];
        if (!q || !this.st.visited[w.to] || q === p) continue;
        const key = [p.id, q.id].sort().join('|');
        if (!seen.has(key)) { seen.add(key); out.push([p, q]); }
      }
      return (this._paths = out);
    }
    pick(points, from, dir) {
      const [dx, dy] = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
      let best = null, bs = 1e9;
      for (const p of points) {
        if (p.id === from.id) continue;
        const vx = p.x - from.x, vy = p.y - from.y, along = vx * dx + vy * dy, perp = Math.abs(vx * dy - vy * dx);
        if (along <= 0 || perp > along * 1.6) continue;
        const s = along + perp * 2;
        if (s < bs) { bs = s; best = p; }
      }
      return best;
    }
    update() {
      const dir = ['left', 'right', 'up', 'down'].find(d => Input.hit(d)), overview = this.zi === 0;
      if (dir && overview) {
        // vue d'ensemble : d'une région découverte à l'autre
        const pts = Object.keys(NODES).filter(k => this.visited(k)).map(k => ({ id: k, x: NODES[k].x, y: NODES[k].y }));
        const p = this.pick(pts, { id: this.selK, x: NODES[this.selK].x, y: NODES[this.selK].y }, dir);
        if (p) { this.selK = p.id; Audio.sfx('move'); }
      } else if (dir && this.sel) {
        const p = this.pick(this.list, this.pts[this.sel], dir);
        if (p) { this.sel = p.id; this.selK = this.pts[p.id].k; Audio.sfx('move'); }
      }
      // zoom : ×1 (grands ensembles) → ×2 → ×3 (les zones)
      if (Input.hit('run') || Input.hit('menu') || Input.hit('ok')) {
        this.zi = (this.zi + 1) % ZOOMS.length; Audio.sfx('select');
        if (this.zi === 1 && (!this.sel || this.pts[this.sel].k !== this.selK)) { const q = this.list.find(p => p.id === this.hereId && p.k === this.selK) || this.list.find(p => p.k === this.selK); if (q) this.sel = q.id; }
      }
      const S = this.zi === 0 ? NODES[this.selK] : this.sel ? this.pts[this.sel] : NODES.village, to = this.camFor(S.x, S.y);
      this.cam.x += (to.x - this.cam.x) * 0.25; this.cam.y += (to.y - this.cam.y) * 0.25;
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); }
    }

    // vue d'ensemble : les régions découvertes (illustration, nom), reliées entre elles
    drawRegions(c) {
      const t = this.t;
      for (const [a, b] of EDGES) {
        if (!this.visited(a) || !this.visited(b)) continue;
        const A = NODES[a], B = NODES[b];
        c.strokeStyle = 'rgba(20,14,8,0.55)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
        c.strokeStyle = '#ffe9a0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
      }
      for (const k in NODES) {
        if (!this.visited(k)) continue;
        const N = NODES[k], here = k === this.here, sel = k === this.selK, r = 4.5;
        c.fillStyle = '#10141e'; c.beginPath(); c.moveTo(N.x, N.y - r - 1.5); c.lineTo(N.x + r + 1.5, N.y); c.lineTo(N.x, N.y + r + 1.5); c.lineTo(N.x - r - 1.5, N.y); c.fill();
        c.fillStyle = here ? '#ff5a5a' : '#ffd040'; c.beginPath(); c.moveTo(N.x, N.y - r); c.lineTo(N.x + r, N.y); c.lineTo(N.x, N.y + r); c.lineTo(N.x - r, N.y); c.fill();
        if (sel) { c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.beginPath(); c.arc(N.x, N.y, 9 + Math.sin(t * 6), 0, 7); c.stroke(); }
      }
      if (this.selK) {
        const N = NODES[this.selK], name = this.nameOf(this.selK), lw = UI.measure(c, name, 8) + 10, lx = DW.clamp(N.x - lw / 2, 2, W - lw - 2), ly = N.y > 30 ? N.y - 26 : N.y + 12;
        UI.box(c, lx, ly, lw, 14, 'dark'); UI.text(c, name, lx + lw / 2, ly + 10.5, { size: 8, align: 'center', color: '#ffe070' });
      }
    }
    // ---------------------------------------------------------- dessin
    draw(c) {
      c.fillStyle = '#0e2a5a'; c.fillRect(0, 0, W, H);
      this.drawIsland(c);
      this.drawPanel(c);
    }
    drawIsland(c) {
      const t = this.t, z = ZOOMS[this.zi], sx = (this.cam.x - W / 2 / z) * RES, sy = (this.cam.y - MH / 2 / z) * RES, sw = W / z * RES, sh = MH / z * RES;
      c.save(); c.beginPath(); c.rect(0, 0, W, MH); c.clip();
      c.drawImage(art(), sx, sy, sw, sh, 0, 0, W, MH);
      c.drawImage(this.fog(), sx, sy, sw, sh, 0, 0, W, MH);
      if (z === 1) { this.drawRegions(c); c.restore(); UI.box(c, W - 40, 3, 36, 14); UI.text(c, '×1', W - 22, 13.5, { size: 8, align: 'center', color: '#ffe070' }); return; }
      // chemins
      for (const [a, b] of this.paths()) {
        const [ax, ay] = this.P(a.x, a.y), [bx, by] = this.P(b.x, b.y);
        c.strokeStyle = 'rgba(20,14,8,0.5)'; c.lineWidth = 1 + z; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
        c.strokeStyle = 'rgba(200,214,240,0.95)'; c.lineWidth = z * 0.8; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
      }
      // zones visitées
      const s = z === 2 ? 9 : 13;
      for (const p of this.list) {
        const [x, y] = this.P(p.x, p.y), B = BIOME[NODES[p.k].b];
        icon(c, x, y, s, glyphOf(p.id), B[1], false, p.id === this.hereId);
      }
      // grands ensembles : nom de chaque région découverte (au zoom ×2 et ×3)
      if (z > 1) for (const k in NODES) {
        const ps = this.list.filter(p => p.k === k);
        if (ps.length < 3) continue;   // (les lieux d'une seule zone : leur nom s'affiche quand on les choisit)
        const my = Math.min(...ps.map(p => p.y)), mx = ps.reduce((a, p) => a + p.x, 0) / ps.length;
        const [x, y] = this.P(mx, my);
        UI.text(c, this.nameOf(k).toUpperCase(), x, y - s / 2 - 4, { size: 6, align: 'center', color: '#fff4c0' });
      }
      // curseur + nom de la zone choisie
      if (this.sel) {
        const p = this.pts[this.sel], [nx, ny] = this.P(p.x, p.y);
        c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.strokeRect(Math.round(nx - s / 2 - 3) + 0.5, Math.round(ny - s / 2 - 3) + 0.5, s + 5, s + 5);
        const name = DW.MAPS[p.id].name, lw = UI.measure(c, name, 8) + 10, lx = DW.clamp(nx - lw / 2, 2, W - lw - 2), ly = ny > 40 ? ny - s / 2 - 22 : ny + s / 2 + 6;
        UI.box(c, lx, ly, lw, 14, 'dark'); UI.text(c, name, lx + lw / 2, ly + 10.5, { size: 8, align: 'center', color: '#ffe070' });
      }
      // position actuelle : l'icône rouge pulse
      if (this.hereId) { const p = this.pts[this.hereId], [hx, hy] = this.P(p.x, p.y), r = s / 2 + 3 + (Math.sin(t * 5) + 1) * 2; c.strokeStyle = 'rgba(255,90,90,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(hx, hy, r, 0, 7); c.stroke(); }
      c.restore();
      UI.box(c, W - 40, 3, 36, 14); UI.text(c, '×' + z, W - 22, 13.5, { size: 8, align: 'center', color: '#ffe070' });
    }
    nameOf(k) { return (NODES[k] && NODES[k].name) || (DW.MAPS[k] && DW.MAPS[k].name) || k; }
    // panneau d'information (sous la carte) : la zone choisie, sa région, ses passages connus, ses Digimon
    drawPanel(c) {
      const y0 = MH + 2;
      UI.box(c, 4, y0, W - 8, H - y0 - 3);
      if (this.zi === 0 && this.selK) {
        const k = this.selK, zs = Object.values(this.pts).filter(p => p.k === k), seen = zs.filter(p => this.st.visited[p.id]).length;
        UI.text(c, this.nameOf(k), 12, y0 + 14, { size: 10, color: '#ffe070' });
        if (k === this.here) UI.text(c, 'Tu es ici', W - 12, y0 + 14, { size: 8, align: 'right', color: '#ff8a8a' });
        const desc = (k === 'village' ? `${DW.Town.label()}. ` : '') + NODES[k].desc + (zs.length > 1 ? `  (${seen} / ${zs.length} zones)` : '');
        UI.wrap(c, desc, W - 36, 8).slice(0, 2).forEach((l, j) => UI.text(c, l, 12, y0 + 27 + j * 10, { size: 8, color: '#c8f0ff' }));
        const regs = Object.keys(NODES), found = regs.filter(r => this.visited(r)).length;
        UI.text(c, `Régions découvertes : ${found} / ${regs.length}`, 12, H - 7, { size: 6, color: '#9ab0e8', shadow: false });
        c.fillStyle = 'rgba(6,10,24,0.6)'; c.fillRect(0, MH - 13, W, 13);
        UI.hints(c, [['ok', 'zoom'], ['back', 'fermer']], W - 6, MH - 3);
        UI.text(c, 'flèches : choisir une région', 8, MH - 3, { size: 6, color: '#9ab0e8', shadow: false });
        return;
      }
      const id = this.sel, m = id && DW.MAPS[id];
      if (!m) { UI.text(c, 'Aucun lieu exploré.', 12, y0 + 14, { size: 9 }); return; }
      const k = this.pts[id].k;
      UI.text(c, m.name, 12, y0 + 14, { size: 10, color: '#ffe070' });
      if (id === this.hereId) UI.text(c, 'Tu es ici', W - 12, y0 + 14, { size: 8, align: 'right', color: '#ff8a8a' });
      else UI.text(c, this.nameOf(k), W - 12, y0 + 14, { size: 7, align: 'right', color: '#9ab0e8' });
      const arrow = { left: '←', right: '→', up: '↑', down: '↓' };
      // seuls les passages déjà empruntés sont nommés : le reste est à découvrir
      const ways = (m.warps || []).filter(w => this.st.visited[w.to] && DW.MAPS[w.to]).map(w => (arrow[w.dir] || '•') + ' ' + DW.MAPS[w.to].name);
      const base = k === 'village' && id === 'village' ? `${DW.Town.label()}. ` : m.piece ? '★ Lieu emblématique. ' : m.landmark ? `★ ${m.landmark}. ` : '';
      const desc = base + (ways.length ? 'Passages connus : ' + [...new Set(ways)].join('  ') : NODES[k].desc);
      // Digimon sauvages de la zone (à droite, dans le panneau)
      const enc = m.encounters, list = enc && enc.length ? [...new Set(enc.map(e => e.sp))].slice(0, 6) : [];
      const tw = list.length ? W - 26 - list.length * 20 : W - 24;
      UI.wrap(c, desc, tw - 12, 8).slice(0, 2).forEach((l, j) => UI.text(c, l, 12, y0 + 27 + j * 10, { size: 8, color: '#c8f0ff' }));
      if (list.length) {
        const zs = this.st.zoneSeen[id] || {};
        list.forEach((sp, j) => {
          const x = W - 18 - (list.length - 1 - j) * 20, seen = zs[sp] || this.st.owned[sp];
          DW.Sprites.draw(c, DW.Sprites.ow(sp), x, y0 + 50, { silhouette: !seen, frame: Math.floor(this.t * 2 + j) });
          if (this.st.owned[sp]) { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(x + 7, y0 + 30, 2, 0, 7); c.fill(); }
        });
      }
      UI.text(c, `Zones explorées : ${this.list.length} / ${Object.keys(this.pts).length}`, 12, H - 7, { size: 6, color: '#9ab0e8', shadow: false });
      c.fillStyle = 'rgba(6,10,24,0.6)'; c.fillRect(0, MH - 13, W, 13);
      UI.hints(c, [['ok', 'zoom'], ['back', 'fermer']], W - 6, MH - 3);
      UI.text(c, 'flèches : choisir une zone', 8, MH - 3, { size: 6, color: '#9ab0e8', shadow: false });
    }
  }
  DW.WorldMapScene = WorldMapScene;
  WorldMapScene.nodeOf = nodeOf; WorldMapScene.subsOf = subsOf; WorldMapScene.layout = buildLayout;   // (pour les tests)
  DW.islandImage = island;
})();
