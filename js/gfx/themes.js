'use strict';
// =====================================================================
//  THÈMES DE ZONES — chaque zone a son identité (comme dans Digimon World)
//  map.theme = clé ci-dessous. Lu à la préparation de la carte et par l'ambiance.
//  grass / canopy : 6 tons du plus sombre au plus clair
//  trees  : variantes d'arbres [variante, poids] (voir OBJ.tree : 0-2 feuillus, 3 chêne, 4 bouleau,
//           5 orange, 6 rouge, 7 doré, 8 vert profond, 9 moussu)
//  tall   : herbes hautes (pied, milieu, pointe)
//  litter : feuilles mortes sur les chemins   particle : particules de l'ambiance   leaves : leurs couleurs
// =====================================================================
(function () {
  DW.World.THEMES = {
    // Clairière de l'Arrivée : printemps lumineux, bouleaux, pollen doré
    spring: {
      tall: ['#1e6224', '#3a9a3c', '#7ad860'],
      grass: ['#2e7c32', '#40963c', '#56ae48', '#70c45a', '#8cd86c', '#ace882'],
      canopy: ['#0f2c16', '#173e1e', '#1f5226', '#2a682e', '#367e38', '#4a9644'],
      trees: [[0, 3], [1, 2], [4, 4], [2, 1]], litter: ['#e0c050', '#a8d060', '#f0e0a0'],
      particle: 'pollen', leaves: ['#fff4a0', '#ffffff', '#d8f080'],
    },
    // Sentier des Murmures : sous-bois bleu-vert, arbres moussus, brume
    misty: {
      tall: ['#144a3c', '#2a7e5e', '#6ac8a0'],
      grass: ['#17503a', '#1f6444', '#2a7a50', '#3a905e', '#4ea670', '#6abc86'],
      canopy: ['#0a2420', '#10322a', '#164234', '#1e5440', '#28684e', '#36805e'],
      trees: [[9, 4], [3, 3], [8, 2], [4, 1]], litter: ['#5a9a70', '#3a7a5a', '#8ab890'],
      particle: 'mist', leaves: ['#8ad8b0', '#b8f0d0'], mist: true,
    },
    // Prairie des Lucioles : prairie dorée, fleurs partout, pétales au vent
    meadow: {
      tall: ['#4a6a1e', '#8ca838', '#e4e070'],
      grass: ['#4a7a26', '#5e922e', '#78aa38', '#94c046', '#b0d458', '#cae672'],
      canopy: ['#162e12', '#22421a', '#2e5822', '#3c6e2a', '#4e8634', '#649e40'],
      trees: [[0, 3], [2, 3], [7, 1], [4, 2]], litter: ['#f0d060', '#ff9ac8', '#ffffff'],
      particle: 'petals', leaves: ['#ff9ac8', '#fff2a0', '#ffffff', '#c8b4ff'],
    },
    // Bois des Géants : vert profond, arbres immenses, spores lumineuses
    deep: {
      tall: ['#0e3a20', '#226638', '#4aa060'],
      grass: ['#14442a', '#1a5632', '#246a3a', '#307e44', '#409452', '#56aa62'],
      canopy: ['#06180e', '#0a2414', '#10321a', '#164222', '#1e542a', '#286834'],
      trees: [[8, 5], [3, 3], [1, 1], [9, 1]], litter: ['#6a5a2a', '#4a7a3a', '#8a6a3a'],
      particle: 'spores', leaves: ['#9affd8', '#c8a8ff', '#e8ffa0'],
    },
    // Lisière du Ravin : automne, feuilles rousses qui tombent
    autumn: {
      tall: ['#6a561c', '#a88c2c', '#e4c45c'],
      grass: ['#4e5c22', '#64722a', '#7e8a34', '#9aa042', '#b6b458', '#d0c672'],
      canopy: ['#2a1608', '#3e200c', '#562c10', '#703c16', '#8c4e1e', '#a8642a'],
      trees: [[5, 4], [6, 3], [7, 3], [3, 1]], litter: ['#e0702a', '#c84a22', '#f0b030', '#a8602a'],
      particle: 'autumn', leaves: ['#e8702a', '#d84a2a', '#f0b030', '#c8902a'],
    },
    // Ville des Fichiers et Terrain d'entraînement : vert franc et doux, essences variées
    town: {
      tall: ['#1e6224', '#3a9a3c', '#7ad860'],
      grass: ['#2e7a34', '#40923e', '#56aa48', '#6ec05a', '#8ad46c', '#a8e480'],
      canopy: ['#0e2a16', '#163c1e', '#1e5026', '#28662e', '#347c38', '#469444'],
      trees: [[0, 3], [1, 2], [3, 2], [4, 2], [2, 1]], litter: ['#e0c050', '#c8a060', '#f0e0a0'],
      particle: 'pollen', leaves: ['#fff4a0', '#ffffff', '#ffd0e8'],
    },
    // Quartier des Champs : verts chauds de campagne, vergers dorés
    farm: {
      tall: ['#3a6a1e', '#78a832', '#d8d868'],
      grass: ['#3a7228', '#4e8a30', '#66a23a', '#80b846', '#9ccc58', '#bade70'],
      canopy: ['#142c10', '#1e4016', '#28561e', '#346c26', '#428430', '#569c3c'],
      trees: [[2, 3], [0, 2], [3, 2], [7, 2]], litter: ['#e8c050', '#c89040', '#f0e0a0'],
      particle: 'pollen', leaves: ['#fff2a0', '#ffffff'],
    },
    // Plage des Cabines : l'herbe du haut de la falaise, plus jaune et salée
    beach: {
      tall: ['#4a7a28', '#88a840', '#d8e070'],
      grass: ['#3e7e30', '#52943a', '#6aaa46', '#84c056', '#a0d46a', '#bee484'],
      canopy: ['#102c18', '#183e20', '#205228', '#2a6830', '#367e3a', '#489646'],
      trees: [[2, 3], [0, 2], [4, 1]], litter: ['#e8d8a0', '#c8b080'],
      particle: 'pollen', leaves: ['#ffffff', '#f0f8ff'],
    },
  };

  // ---------------------------------------------------------------- SAISONS
  // Les zones tempérées changent avec la saison : « town~2 » = thème town en automne (généré à la demande).
  // Printemps = thème d'origine. Les cartes déjà préparées sont refaites quand la saison change.
  const Art = DW.Art, TH = DW.World.THEMES;
  const SEASONAL = new Set(['spring', 'misty', 'meadow', 'deep', 'autumn', 'town', 'farm', 'beach']);
  const mixAll = (arr, col, k) => arr.map(c => { const m = Art.mix(Art.hex(c), Art.hex(col), k); return '#' + m.map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); });
  function variant(base, se) {
    const b = TH[base], o = { ...b };
    if (se === 1) {   // été : herbe plus jaune et chaude
      o.grass = mixAll(b.grass, '#c8c040', 0.26); o.tall = mixAll(b.tall, '#d8c850', 0.3); o.canopy = mixAll(b.canopy, '#3a5a10', 0.12);
      o.particle = b.particle === 'mist' ? 'mist' : 'pollen'; o.leaves = ['#fff2a0', '#ffffff', '#ffe070'];
    } else if (se === 2) {   // automne : herbe dorée, feuillages roux, feuilles qui tombent
      o.grass = mixAll(b.grass, '#c8902e', 0.4); o.tall = mixAll(b.tall, '#d89a3a', 0.45); o.canopy = mixAll(b.canopy, '#8a4416', 0.5);
      o.trees = [[5, 4], [6, 3], [7, 3], [3, 1]]; o.litter = ['#e0702a', '#c84a22', '#f0b030', '#a8602a'];
      o.particle = 'autumn'; o.leaves = ['#e8702a', '#d84a2a', '#f0b030', '#c8902a'];
    } else if (se === 3) {   // hiver : sol givré, cimes enneigées, flocons
      o.grass = mixAll(b.grass, '#e8f0f8', 0.66); o.tall = mixAll(b.tall, '#e0eaf4', 0.55); o.canopy = mixAll(b.canopy, '#d0deea', 0.4);
      o.trees = [[10, 5], [11, 3], [4, 1]]; o.litter = ['#ffffff', '#e0e8f0', '#c8d8e8']; o.particle = 'snow'; o.leaves = ['#ffffff'];
    }
    return o;
  }
  DW.World.themeKey = map => {
    const base = map.theme && TH[map.theme] ? map.theme.split('~')[0] : null;
    const temperate = base ? SEASONAL.has(base) : !map.indoor && ['forest', 'village', 'beach'].includes(map.climate);
    if (!temperate || map.indoor || !DW.Time || !DW.state || !DW.state.clock && DW.state.clock !== 0) return base;
    const se = DW.Time.season();
    if (!se) return base;
    const b = base || 'town', key = b + '~' + se;
    if (!TH[key]) TH[key] = variant(b, se);
    return key;
  };
  // herbe propre à une carte (sol façon DW1) : même teinte de saison que le thème
  DW.World.seasonGrass = (map, cols) => {
    const k = DW.World.themeKey(map), se = k && k.includes('~') ? +k.split('~')[1] : 0;
    return se === 1 ? mixAll(cols, '#c8c040', 0.26) : se === 2 ? mixAll(cols, '#c8902e', 0.4) : se === 3 ? mixAll(cols, '#e8f0f8', 0.66) : cols;
  };
  DW.World.themeOf = map => TH[DW.World.themeKey(map)];
})();
