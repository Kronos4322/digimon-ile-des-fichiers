'use strict';
// =====================================================================
//  BIOMES DE L'ÎLE DES FICHIERS — thèmes visuels et objets propres à chaque région
//  (inspirés de Digimon World 1 et de la saison 1 de Digimon Adventure)
//  Un thème peut remplacer : couleurs de l'herbe / terre / sable / eau / falaises / canopée,
//  style de canopée (rock = masse rocheuse), objets (objMap : arbre → sapin, buisson → rocher...),
//  particules (snow, ember, ash, dust, drip), teinte et vignette, ciel et repères des combats.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ, TH = DW.World.THEMES;
  const LAVA = ['#fff6b0', '#ffd848', '#ffa424', '#f47a18', '#d85414', '#a83612', '#76220c'];
  const ICE = ['#f2fbff', '#d4f0fc', '#b4e2f6', '#94d0f0', '#74bae6', '#5aa0d8', '#4484c4'];

  Object.assign(TH, {
    // Montagne de l'Infini : alpages, roche grise, sapins
    mountain: { grass: ['#4e6244', '#5a6e4a', '#687c52', '#7a8c5e', '#8e9e6c', '#a8b484'], canopy: ['#24262c', '#32343c', '#42444e', '#565862', '#6c6e78', '#8a8c94'], canopyStyle: 'rock',
      dirt: ['#4a443e', '#5c554c', '#6e665a', '#827868', '#968c7a', '#aca290'], cliff: ['#3a3a40', '#4a4a52', '#5e5e66', '#74747c', '#8c8c92', '#a8a8ae'],
      tall: ['#3e5234', '#6a7e4a', '#a8b478'], trees: [[0, 1]], objMap: { tree: 'pine', bush: 'boulder', mossrock: 'boulder', glowshroom: 'cairn', hollowlog: 'boulder' }, trees2: [[0, 5], [2, 1]],
      litter: ['#8a8a84', '#6a6a64', '#a8a49a'], particle: 'mist', leaves: ['#e0e8f0', '#ffffff'], sky: ['#6a9ad0', '#dce8f2'], marks: ['cairn', 'spire'], noFlies: true },
    // Sommet de l'Infini : neige, roche glacée
    summit: { grass: ['#9aaac4', '#b0bed6', '#c6d2e6', '#dae4f2', '#ecf2fa', '#ffffff'], canopy: ['#2e3448', '#3e4660', '#525c7a', '#6c7896', '#8c98b4', '#b4c0d8'], canopyStyle: 'rock',
      dirt: ['#5e6880', '#707a92', '#8490a6', '#9aa4b8', '#b0b8ca', '#c8cfdc'], cliff: ['#3e4458', '#4e566c', '#626a82', '#7a849a', '#949eb2', '#b4bcce'], water: ICE, foam: ['#ffffff', '#e4f6ff'],
      tall: ['#8090b0', '#b8c6dc', '#ffffff'], trees: [[0, 1]], objMap: { tree: 'pine', bush: 'snowbush', mossrock: 'icerock', fern: 'icecrystal', glowshroom: 'icecrystal', hollowlog: 'icerock', stump: 'icerock' }, trees2: [[1, 4], [2, 1]],
      litter: ['#ffffff', '#d8e4f4'], particle: 'snow', leaves: ['#ffffff'], sparkle: ['#ffffff', '#e0f4ff', '#c8e8ff'], noFlowers: true, noFlies: true, sky: ['#8aa8d8', '#f0f6ff'], marks: ['blackgear', 'icerock'], vignette: 'rgba(20,30,60,0.35)' },
    // grottes : sol sombre, parois rocheuses, gouttes
    cave: { grass: ['#2a2420', '#332b25', '#3d342c', '#483d33', '#54473b', '#625446'], canopy: ['#0a080e', '#141118', '#1e1a24', '#2a2432', '#383040', '#483e52'], canopyStyle: 'rock',
      dirt: ['#1e1814', '#28201a', '#322820', '#3e3228', '#4a3c30', '#58483a'], cliff: ['#16121a', '#221c28', '#2e2636', '#3c3246', '#4c4058', '#5e506c'], water: ['#6ab0d8', '#4a90c0', '#3474a8', '#265c90', '#1c4878', '#143660', '#0e264a'],
      tall: ['#2a3a2a', '#3e5a40', '#6a8a64'], trees: [[0, 1]], objMap: { tree: 'stalagmite', bush: 'boulder', mossrock: 'crystal', fern: 'pebbles', glowshroom: 'crystal', hollowlog: 'boulder', stump: 'stalagmite' }, trees2: [[0, 2], [1, 2], [2, 1]],
      litter: ['#5a4a3a', '#3a2e24'], particle: 'drip', leaves: ['#a0c8ff'], noFlowers: true, noFlies: true, noRays: true, vignette: 'rgba(0,0,0,0.75)', sky: ['#1a1620', '#3a3040'], marks: ['crystal', 'stalagmite'] },
    // grotte de lave
    lavacave: { grass: ['#2c1e1a', '#36241e', '#422a22', '#4e3226', '#5c3a2a', '#6a442e'], canopy: ['#0e0606', '#1a0c0a', '#28120e', '#381a12', '#4a2418', '#5e3020'], canopyStyle: 'rock',
      dirt: ['#24140e', '#301a12', '#3c2016', '#48281a', '#56301e', '#663a24'], cliff: ['#1a0e0c', '#2a1612', '#3a1e16', '#4c281c', '#603424', '#76422e'], water: LAVA, foam: ['#fffbe0', '#ffe070'],
      tall: ['#3a2a1a', '#5a3a22', '#8a5a2a'], trees: [[0, 1]], objMap: { tree: 'stalagmite', bush: 'lavarock', mossrock: 'lavarock', fern: 'pebbles', glowshroom: 'crystal', hollowlog: 'lavarock', stump: 'stalagmite' }, trees2: [[0, 1], [2, 1]],
      litter: ['#8a3a1a', '#3a1a10'], particle: 'ember', leaves: ['#ffb040', '#ff7020', '#ffe080'], noFlowers: true, noFlies: true, noRays: true, tint: 'rgba(255,90,20,0.07)', vignette: 'rgba(20,0,0,0.75)', sky: ['#3a0a04', '#a03010'], marks: ['lavarock', 'stalagmite'] },
    // Mont Panorama : volcan, cendres, coulées de lave
    volcano: { grass: ['#3a302c', '#463a34', '#54463e', '#64544a', '#766456', '#8a7864'], canopy: ['#1a1210', '#261a16', '#34241e', '#463028', '#5a3e32', '#72503e'], canopyStyle: 'rock',
      dirt: ['#3a2218', '#4c2c1e', '#5e3826', '#72462e', '#885638', '#9e6a46'], cliff: ['#2a1c18', '#3a2620', '#4c322a', '#604036', '#765044', '#8e6454'], water: LAVA, foam: ['#fffbe0', '#ffe070'],
      tall: ['#4a3a2a', '#7a6040', '#b89a60'], trees: [[0, 1]], objMap: { tree: 'pine', bush: 'lavarock', mossrock: 'lavarock', fern: 'steamvent', glowshroom: 'steamvent', hollowlog: 'lavarock', stump: 'lavarock' }, trees2: [[2, 1]],
      litter: ['#2a2420', '#6a5a4a'], particle: 'ember', leaves: ['#ffb040', '#ff7020', '#ffe080'], noFlowers: true, noFlies: true, tint: 'rgba(255,100,40,0.05)', vignette: 'rgba(40,10,0,0.45)', sky: ['#a8502e', '#f4b878'], marks: ['steamvent', 'lavarock'] },
    // Savane des Engrenages
    savanna: { grass: ['#8a7830', '#9e8a38', '#b49e44', '#c8b252', '#d8c464', '#e8d67e'], canopy: ['#3a3618', '#4a461e', '#5c5824', '#6e6a2c', '#828036', '#9a9644'],
      dirt: ['#7a4020', '#965228', '#ae6634', '#c27c42', '#d69656', '#e6b070'], tall: ['#8a7020', '#c8a440', '#f2de84'], trees: [[0, 1]],
      objMap: { tree: 'acacia', bush: 'drybush', mossrock: 'termite', glowshroom: 'drybush', hollowlog: 'boulder', stump: 'drybush' }, trees2: [[0, 2], [1, 1]],
      litter: ['#c8a050', '#8a6a30', '#e0c880'], particle: 'dust', leaves: ['#d8c088', '#b89a60'], noFlies: false, sky: ['#5aa0e6', '#fae8b4'], marks: ['halfgear', 'termite'], vignette: 'rgba(60,30,0,0.35)' },
    // Ville-Usine : bitume, cuves, fumées
    factory: { grass: ['#3a3e36', '#454a40', '#51564a', '#5d6254', '#6a6e5e', '#787c6a'], canopy: ['#1a1c22', '#262830', '#33363e', '#42464e', '#545860', '#6a6e76'], canopyStyle: 'rock',
      dirt: ['#2a2a2e', '#343438', '#3e3e44', '#4a4a50', '#56565c', '#64646a'], tall: ['#3a4030', '#5a6040', '#8a9060'], trees: [[0, 1]],
      objMap: { tree: 'tank', bush: 'crates', mossrock: 'scrap', glowshroom: 'scrap', fern: 'pebbles', hollowlog: 'scrap', stump: 'scrap' }, trees2: [[0, 2], [1, 1], [2, 1]],
      litter: ['#5a5040', '#2a2a2a', '#8a7a50'], particle: 'ash', leaves: ['#4a4a4a', '#6a6a6a'], noFlowers: true, noFlies: true, tint: 'rgba(130,120,80,0.06)', vignette: 'rgba(20,20,10,0.45)', sky: ['#7a8898', '#d8d2b8'], marks: ['tank', 'scrap'] },
    // Montagne d'Ordures
    trash: { grass: ['#4a3e2c', '#564832', '#62523a', '#705e42', '#7e6a4c', '#8e7a58'], canopy: ['#241a12', '#34261a', '#463422', '#5a442c', '#705638', '#886a46'], canopyStyle: 'rock',
      dirt: ['#3a3024', '#463a2c', '#544634', '#62523e', '#725e48', '#826c54'], tall: ['#4a4a2a', '#6a6a3a', '#9a9a5a'], trees: [[0, 1]],
      objMap: { tree: 'junkpile', bush: 'scrap', mossrock: 'scrap', glowshroom: 'scrap', fern: 'pebbles', hollowlog: 'scrap', stump: 'scrap' }, trees2: [[0, 1], [1, 1]],
      litter: ['#8a8a8a', '#c8402a', '#3a6ac8', '#e0c040'], particle: 'ash', leaves: ['#6a5a4a', '#8a7a5a'], noFlowers: true, noFlies: true, sky: ['#9aa07a', '#e4dcae'], marks: ['junkpile', 'scrap'], vignette: 'rgba(30,20,0,0.4)' },
    // Bois Brumeux : brouillard épais permanent
    fog: { grass: ['#2a4038', '#324a40', '#3c564a', '#486454', '#567260', '#68826e'], canopy: ['#0c1a18', '#132420', '#1a2e2a', '#223a34', '#2c4840', '#3a5850'],
      tall: ['#2a4a40', '#4a7062', '#8ab0a0'], trees: [[2, 2], [5, 1], [1, 1]], objMap: { glowshroom: 'glowshroom' }, litter: ['#6a7a6a', '#4a5a4a'], particle: 'mist', leaves: ['#e0f0ee', '#c8e0dc'], mist: true,
      noFlies: true, tint: 'rgba(210,230,230,0.16)', vignette: 'rgba(20,40,40,0.45)', sky: ['#9ab4b4', '#e0ecea'], marks: ['deadtree', 'stonelantern'] },
    // Ville des Jouets
    toy: { grass: ['#4cae5e', '#5ebe6c', '#74cc7c', '#8cd88e', '#a8e4a6', '#c8f0c2'], canopy: ['#a8508a', '#c066a0', '#d482b6', '#e4a0ca', '#f0bede', '#fadcee'],
      tall: ['#4a9a6a', '#7ac896', '#c4f4d8'], trees: [[0, 1]], objMap: { tree: 'candytree', bush: 'block', mossrock: 'toyball', glowshroom: 'toyball', hollowlog: 'block', stump: 'block' }, trees2: [[0, 1], [1, 1], [2, 1]],
      litter: ['#ff5a7a', '#5ab0ff', '#ffd040'], particle: 'petals', leaves: ['#ff7aa8', '#7ac8ff', '#ffe060', '#a8f070'], sky: ['#80c8ff', '#fff0fa'], marks: ['jackbox', 'toyball'], vignette: 'rgba(120,40,100,0.25)' },
    // Terre Gelée : forêt enneigée
    snow: { grass: ['#a4b4cc', '#b8c6dc', '#ccd8ea', '#dee8f4', '#eef4fb', '#ffffff'], canopy: ['#1e3a48', '#2a4c5c', '#3c6272', '#58808e', '#88aab4', '#c8dce4'],
      dirt: ['#6a7690', '#7c88a0', '#909cb2', '#a6b0c4', '#bcc4d4', '#d2d8e4'], cliff: ['#46506a', '#58627c', '#6c7690', '#848ea6', '#9ea8bc', '#bcc4d4'], water: ICE, foam: ['#ffffff', '#e4f6ff'],
      tall: ['#8a9ab4', '#c4d0e4', '#ffffff'], trees: [[0, 1]], objMap: { tree: 'pine', bush: 'snowbush', mossrock: 'icerock', fern: 'icecrystal', glowshroom: 'snowman', hollowlog: 'icerock', stump: 'icerock' }, trees2: [[1, 6], [0, 1]],
      litter: ['#ffffff'], particle: 'snow', leaves: ['#ffffff'], sparkle: ['#ffffff', '#e0f4ff', '#c8e8ff'], noFlowers: true, noFlies: true, sky: ['#9ab8e0', '#f4f8ff'], marks: ['snowman', 'icerock'], vignette: 'rgba(30,50,90,0.3)' },
    // Grand Canyon : roche rouge, cactus, aiguilles
    canyon: { grass: ['#a05a30', '#b06838', '#c07a44', '#ce8c52', '#dca064', '#e8b67e'], canopy: ['#3a180e', '#552614', '#70361e', '#8a4828', '#a65c36', '#c27848'], canopyStyle: 'rock',
      dirt: ['#7a4024', '#8e4e2c', '#a25e36', '#b67042', '#c8844e', '#da9a62'], cliff: ['#4a2014', '#62301c', '#7c4026', '#965232', '#b06640', '#c87e52'], sand: ['#c08050', '#d09460', '#dea870', '#eabc84', '#f2ce9a', '#f8e0b4'],
      tall: ['#8a6a30', '#b89040', '#e0c070'], trees: [[0, 1]], objMap: { tree: 'spire', bush: 'cactus', mossrock: 'skullrock', fern: 'drybush', glowshroom: 'cactus', hollowlog: 'boulder', stump: 'drybush' }, trees2: [[0, 2], [1, 2], [2, 1]],
      litter: ['#e0b070', '#8a4a2a'], particle: 'dust', leaves: ['#e8c090', '#c89a6a'], noFlowers: true, noFlies: true, sky: ['#e0904a', '#fae0ae'], marks: ['spire', 'skullrock'], vignette: 'rgba(60,20,0,0.4)' },
    // Région des Dinosaures : fougères géantes, cycas, ossements
    dino: { grass: ['#2c5622', '#366628', '#427830', '#4e8a38', '#5e9c42', '#74b052'], canopy: ['#0e2410', '#163416', '#1e461c', '#285a24', '#346e2c', '#448236'],
      dirt: ['#5a4024', '#6e4e2c', '#826036', '#967242', '#aa864e', '#c09c62'], tall: ['#2a5a1a', '#4a8a2a', '#8ac050'], trees: [[0, 1]],
      objMap: { tree: 'cycad', bush: 'bigfern', mossrock: 'amber', glowshroom: 'bones', hollowlog: 'bones', stump: 'bigfern' }, trees2: [[0, 2], [1, 1]],
      litter: ['#a08040', '#d0c090'], particle: 'spores', leaves: ['#d8f0a0', '#fff0c0'], sky: ['#d89a5a', '#f8e2a8'], marks: ['bones', 'smallvolcano'], vignette: 'rgba(40,30,0,0.4)' },
    // Jungle Tropicale
    jungle: { grass: ['#1c5626', '#246a32', '#2e803e', '#3a964a', '#4aaa56', '#62be66'], canopy: ['#06200e', '#0c3016', '#14421e', '#1c5628', '#266a32', '#34803e'],
      tall: ['#1a5a2a', '#3a9a4a', '#8ad870'], trees: [[0, 1]], objMap: { tree: 'jungletree', bush: 'junglebush', mossrock: 'mossrock', glowshroom: 'junglebush', hollowlog: 'hollowlog' }, trees2: [[0, 2], [1, 2], [2, 1]],
      litter: ['#c86a2a', '#e0b040', '#5a8a2a'], particle: 'spores', leaves: ['#c0ff90', '#fff6a0'], sky: ['#4aa8d0', '#e0f8d8'], marks: ['totem', 'junglebush'], vignette: 'rgba(0,30,10,0.55)' },
    // Mangrove : eau verte, racines, cabanes sur pilotis
    mangrove: { grass: ['#3a5a2a', '#466a30', '#527a38', '#608a40', '#709a4a', '#84ac58'], canopy: ['#0e2a1a', '#163a22', '#1e4c2c', '#285e36', '#327242', '#40864e'],
      water: ['#9ad8c0', '#72c2a8', '#52aa92', '#3e927e', '#307a6a', '#246256', '#1a4a42'], sand: ['#8a7a50', '#9e8c5c', '#b29e6a', '#c4b07a', '#d4c28c', '#e2d4a2'],
      tall: ['#3a6a3a', '#6a9a5a', '#a8d080'], trees: [[0, 1]], objMap: { tree: 'mangrove', bush: 'reeds', mossrock: 'mossrock', glowshroom: 'reeds', stump: 'reeds' }, trees2: [[0, 1], [1, 1]],
      litter: ['#6a5a3a'], particle: 'pollen', leaves: ['#e0ffb0', '#ffffff'], sky: ['#6ab8d8', '#e8f8e8'], marks: ['stilthut', 'reeds'] },
    // Marais des Geko
    swamp: { grass: ['#28381c', '#324422', '#3c5028', '#485e30', '#566c38', '#667c42'], canopy: ['#0e180a', '#16220e', '#1e2e14', '#283c1a', '#344a22', '#425a2c'],
      water: ['#9aaa6a', '#7e9452', '#667e40', '#526a32', '#425828', '#34461e', '#283616'], foam: ['#c8d890', '#a8bc74'],
      tall: ['#3a4a22', '#6a7a3a', '#a8b060'], trees: [[0, 1]], objMap: { tree: 'swamptree', bush: 'reeds', mossrock: 'mossrock', glowshroom: 'glowshroom', stump: 'reeds' }, trees2: [[0, 1], [1, 1]],
      litter: ['#5a5a2a', '#3a3a1a'], particle: 'mist', leaves: ['#c8e0a0', '#e0f0c0'], mist: true, noFlies: true, tint: 'rgba(120,150,60,0.07)', vignette: 'rgba(10,20,0,0.55)', sky: ['#8a9a70', '#d8dcb8'], marks: ['frogstatue', 'reeds'] },
    // Cimetière d'Overdell : éternel crépuscule violet
    cemetery: { grass: ['#262a28', '#2e3430', '#383e38', '#424a42', '#4e564c', '#5a6458'], canopy: ['#0a0810', '#120e18', '#1a1422', '#221a2c', '#2c2238', '#382c46'],
      dirt: ['#2a2420', '#342c26', '#3e352e', '#4a4036', '#564a3e', '#625446'], tall: ['#2a3028', '#4a5444', '#7a8a70'], trees: [[0, 1]],
      objMap: { tree: 'deadtree', bush: 'tombstone', mossrock: 'tombstone', glowshroom: 'jacklantern', hollowlog: 'tombstone', stump: 'tombstone', fern: 'pebbles' }, trees2: [[0, 1], [1, 1]],
      litter: ['#4a3a2a', '#2a2420'], particle: 'mist', leaves: ['#b8a8d8', '#d8d0ff'], mist: true, noFlowers: true, noFlies: true, noRays: true, tint: 'rgba(90,60,140,0.12)', vignette: 'rgba(20,0,30,0.65)', sky: ['#2a1e4a', '#7a5a8a'], marks: ['tombstone', 'jacklantern'] },
    // Pays des Scarabées : forêt ancienne de souches géantes
    beetle: { grass: ['#3a6424', '#46722a', '#528232', '#60923a', '#70a444', '#86b654'], canopy: ['#102a0c', '#183a12', '#204c18', '#2a5e20', '#366e28', '#448234'],
      tall: ['#2a5a1a', '#5a9a3a', '#a8d870'], trees: [[3, 3], [4, 2], [1, 1]], objMap: { mossrock: 'giantstump', glowshroom: 'honeycomb', hollowlog: 'hollowlog' },
      litter: ['#c8902a', '#8a5a2a', '#e0c050'], particle: 'pollen', leaves: ['#fff4a0', '#ffe060'], sky: ['#6ab0e0', '#f0f4d0'], marks: ['beetlestatue', 'giantstump'] },
  });

  // ------------------------------------------------------------ outils
  const shade = (c, k) => { const a = DW.Art.hex(c), b = k < 0 ? [0, 0, 0] : [255, 255, 255]; return '#' + DW.Art.mix(a, b, Math.abs(k)).map(x => Math.round(x).toString(16).padStart(2, '0')).join(''); };
  const ground = (d, x, y, rx, col = '#000000') => d.ell(x, y, rx, rx * 0.26, col, 0, { flat: true, noshadow: true });

  Object.assign(OBJ, {
    // ---------------------------------------------------------- végétation des biomes
    // sapin : 0 vert  1 enneigé  2 mort
    pine: { w: 26, h: 46, n: 3, big: true, draw(d, v) {
      d.tube([[13, 45], [13, 30]], 3.6, 2.6, v === 2 ? '#6a5a4a' : '#5a3a22');
      const G = v === 2 ? null : v === 1 ? ['#2a4e48', '#3a6660'] : ['#1e4a2a', '#2c6236'];
      if (!G) { for (let i = 0; i < 4; i++) { const y = 18 + i * 6; d.tube([[13, y], [5 + i, y + 4]], 1.6, 0.6, '#6a5a4a'); d.tube([[13, y + 2], [21 - i, y + 6]], 1.6, 0.6, '#6a5a4a'); } d.tube([[13, 32], [13, 6]], 2.6, 1, '#7a6a58'); return; }
      for (let i = 0; i < 4; i++) {
        const y = 36 - i * 8, w = 12 - i * 2.4;
        d.poly([[13 - w, y], [13, y - 13], [13 + w, y]], i % 2 ? G[1] : G[0], { tex: 0.2 });
        if (v === 1) d.deco.poly([[13 - w * 0.7, y - 3], [13, y - 12], [13 + w * 0.5, y - 5]], '#f4f8ff');
        else d.deco.line(13 - w * 0.6, y - 2, 13 - 1, y - 9, 0.8, '#4a8a4a');
      }
      if (v === 1) d.deco.ell(13, 38, 9, 1.6, '#ffffff');
    } },
    // rocher arrondi (montagne, grottes)
    boulder: { w: 22, h: 18, n: 3, draw(d, v) {
      const C = [['#6a6a70', '#8e8e94'], ['#5a544c', '#7e766a'], ['#4a4658', '#6a6478']][v];
      d.blob([[2, 16], [3, 8], [9, 3], [16, 4], [20, 10], [20, 16]], C[0], { tex: 0.35 });
      d.deco.blob([[6, 8], [10, 5], [14, 6], [11, 9]], C[1]);
      d.deco.line(11, 10, 14, 15, 0.6, shade(C[0], -0.35));
    } },
    // cairn de pierres empilées
    cairn: { w: 16, h: 26, n: 1, draw(d) {
      [[8, 23, 6.6, 3], [8, 18.6, 5.4, 2.6], [8.6, 14.6, 4.4, 2.4], [8, 11, 3.4, 2], [8.4, 8, 2.4, 1.6]].forEach(([x, y, rx, ry], i) => d.ell(x, y, rx, ry, ['#8a8a90', '#7a7468', '#9a948a', '#86868c', '#a8a49a'][i], 0, { tex: 0.3 }));
    } },
    // aiguille rocheuse (canyon, montagne)
    spire: { w: 24, h: 48, n: 3, draw(d, v) {
      const C = [['#a65c36', '#c27848', '#7c4026'], ['#b06a40', '#d08a5a', '#86482a'], ['#6a6a72', '#8a8a92', '#4a4a52']][v];
      d.poly([[3, 47], [6, 20], [9, 6 + v * 3], [14, 2 + v * 4], [17, 14], [21, 30], [22, 47]], C[0], { tex: 0.3 });
      for (let i = 0; i < 4; i++) d.deco.line(4 + i * 0.6, 40 - i * 9, 21 - i * 0.8, 41 - i * 9, 0.7, C[2]);
      d.deco.poly([[8, 12], [13, 4 + v * 4], [12, 20]], C[1]);
    } },
    // cactus du canyon
    cactus: { w: 20, h: 30, n: 3, draw(d, v) {
      const G = '#4a8a3a', Gl = '#6aa84a';
      d.tube([[10, 29], [10, 6 + v * 3]], 6, 5.4, G, { tex: 0.2 });
      if (v !== 2) { d.tube([[10, 18], [4, 17], [4, 10]], 3.4, 3, G); }
      if (v !== 1) { d.tube([[10, 22], [16, 21], [16, 14]], 3.4, 3, G); }
      d.deco.line(9, 8 + v * 3, 9, 28, 0.6, Gl); d.deco.line(11.6, 9 + v * 3, 11.6, 28, 0.6, '#2e6a2a');
      if (v === 0) d.deco.circ(10, 6, 1.6, '#ff6a8a');
      ground(d, 10, 29, 6);
    } },
    // crâne de pierre géant (canyon)
    skullrock: { w: 30, h: 24, n: 1, draw(d) {
      d.blob([[2, 22], [3, 10], [10, 3], [20, 3], [27, 10], [28, 22]], '#d8c8a8', { tex: 0.3 });
      d.deco.ell(10, 12, 3.4, 4, '#2a1a10', 0, { unlit: true }); d.deco.ell(20, 12, 3.4, 4, '#2a1a10', 0, { unlit: true });
      d.deco.poly([[15, 15], [13, 19], [17, 19]], '#3a2a1a', { unlit: true });
      for (let i = 0; i < 4; i++) d.deco.rect(9 + i * 3.4, 20, 2, 2.6, '#f0e4c8');
    } },
    // buisson sec / herbes sèches (savane, canyon)
    drybush: { w: 20, h: 16, n: 3, draw(d, v) {
      const C = ['#8a7a3a', '#a08a44', '#6a6a30'][v];
      for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.9 + i * 0.3; d.tube([[10, 15], [10 + Math.cos(a) * 9, 15 + Math.sin(a) * 11]], 1.4, 0.4, i % 2 ? C : shade(C, 0.2)); }
      d.ell(10, 13, 6, 3, shade(C, -0.15), 0, { tex: 0.4 });
    } },
    // acacia à couronne plate (savane)
    acacia: { w: 46, h: 44, n: 2, big: true, draw(d, v) {
      d.tube([[22, 43], [21, 30], [16, 20]], 4.4, 2.6, '#5a3a20', { tex: 0.3 });
      d.tube([[21, 30], [28, 21]], 2.6, 1.6, '#5a3a20');
      const L = v ? ['#6a7a2a', '#86963a'] : ['#5a6a24', '#748632'];
      d.ell(22, 16, 21, 6, L[0], 0, { tex: 0.35 }); d.ell(14, 13, 10, 4.4, L[1], 0, { tex: 0.35 }); d.ell(30, 12.6, 10, 4.4, L[1], 0, { tex: 0.35 });
      d.deco.ell(20, 11, 8, 1.6, shade(L[1], 0.25));
    } },
    // termitière (savane)
    termite: { w: 20, h: 32, n: 1, draw(d) {
      d.poly([[2, 31], [5, 18], [8, 6], [11, 2], [13, 8], [16, 20], [18, 31]], '#b06a38', { tex: 0.45 });
      d.poly([[13, 31], [15, 22], [17, 31]], '#9a5a30', { tex: 0.4 });
      d.deco.ell(9, 22, 1.2, 1.6, '#3a2010', 0, { unlit: true });
    } },
    // engrenage géant à moitié enterré (savane, sommet)
    halfgear: { w: 44, h: 30, n: 2, draw(d, v) {
      const C = v ? ['#7a7468', '#a49c8a', '#5a544a'] : ['#8a5a3a', '#b07a4a', '#5a3a24'];
      const pts = [];
      for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI, r = i % 2 ? 19 : 22; pts.push([22 + Math.cos(a) * r, 29 + Math.sin(a) * r]); }
      d.poly(pts, C[0], { shiny: true, tex: 0.25 });
      d.deco.ell(22, 29, 13, 13, C[1]); d.deco.ell(22, 29, 5, 5, C[2]);
      for (let i = 0; i < 4; i++) { const a = Math.PI * (1.15 + i * 0.23); d.deco.line(22 + Math.cos(a) * 5, 29 + Math.sin(a) * 5, 22 + Math.cos(a) * 12, 29 + Math.sin(a) * 12, 1.4, C[2]); }
      ground(d, 22, 29, 20, '#3a2a10');
    } },
    // engrenage noir de Devimon planté dans la roche (saison 1)
    blackgear: { w: 34, h: 40, n: 1, draw(d) {
      const pts = [];
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 13 : 16; pts.push([17 + Math.cos(a) * r, 20 + Math.sin(a) * r]); }
      d.poly(pts, '#1a1620', { shiny: true });
      d.deco.ell(17, 20, 9, 9, '#2a2434'); d.deco.ell(17, 20, 3.6, 3.6, '#0a080e');
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; d.deco.line(17 + Math.cos(a) * 4, 20 + Math.sin(a) * 4, 17 + Math.cos(a) * 8.6, 20 + Math.sin(a) * 8.6, 1.2, '#0a080e'); }
      d.deco.ell(12, 13, 3, 1.6, '#5a4a7a', -0.6);
      d.ell(17, 37, 12, 3, '#3a3a40', 0, { tex: 0.4 });
    } },
    // ---------------------------------------------------------- neige et glace
    snowbush: { w: 22, h: 16, n: 2, draw(d, v) {
      d.blob([[2, 15], [3, 8], [9, 4], [15, 5], [20, 9], [20, 15]], v ? '#3a6050' : '#4a6a5a', { tex: 0.35 });
      d.blob([[3, 9], [8, 3.6], [15, 4], [19, 8], [12, 8.6]], '#f4f8ff');
      d.deco.ell(9, 6, 3, 1, '#ffffff');
    } },
    icerock: { w: 22, h: 22, n: 2, lights: [], draw(d, v) {
      d.poly([[2, 21], [4, 10], [9, 4], [15, 6], [20, 13], [20, 21]], v ? '#9ad0ec' : '#b4dcf0', { shiny: true });
      d.deco.poly([[6, 12], [9, 5], [12, 7], [9, 14]], '#ffffff');
      d.deco.line(13, 9, 16, 19, 0.6, '#6aa8d0');
      d.blob([[3, 11], [8, 5], [13, 5], [10, 9]], '#ffffff', { flat: true });
    } },
    icecrystal: { w: 14, h: 18, n: 2, lights: [[7, 8, 16, 'rgba(140,220,255,0.5)']], draw(d, v) {
      const c = v ? '#c8e8ff' : '#a8d8f8';
      d.poly([[5, 17], [4, 8], [6, 2], [8, 9], [8, 17]], c, { shiny: true });
      d.poly([[8, 17], [9, 10], [11, 6], [12, 12], [11, 17]], shade(c, -0.1), { shiny: true });
      d.deco.line(5.6, 4, 5.6, 14, 0.5, '#ffffff');
    } },
    snowman: { w: 18, h: 28, n: 1, draw(d) {
      d.ell(9, 22, 7.6, 6, '#f6f8ff'); d.ell(9, 13, 5.6, 4.6, '#ffffff'); d.ell(9, 6, 4, 3.6, '#ffffff');
      d.deco.circ(7.6, 5.4, 0.6, '#1a1a2a', { unlit: true }); d.deco.circ(10.4, 5.4, 0.6, '#1a1a2a', { unlit: true });
      d.deco.poly([[9, 6.4], [13, 7.2], [9, 7.6]], '#f08a2a', { unlit: true });
      d.deco.rect(4, 9.4, 10, 1.6, '#d83a3a'); d.deco.rect(11, 9.4, 2, 5, '#d83a3a');
      d.rect(6, 1, 6, 2.4, '#2a2a3a'); d.rect(5, 2.8, 8, 1, '#2a2a3a');
      d.tube([[3, 13], [-1, 9]], 0.8, 0.5, '#6a4a2a'); d.tube([[15, 13], [18, 9]], 0.8, 0.5, '#6a4a2a');
    } },
    igloo: { w: 40, h: 26, n: 1, draw(d) {
      d.ell(20, 24, 18, 18, '#eef4fc', 0, { shiny: true });
      for (let i = 0; i < 4; i++) d.deco.curve([[4 + i * 1.6, 22 - i * 4.6], [20, 21 - i * 5.4 - 1], [36 - i * 1.6, 22 - i * 4.6]], 0.6, '#b8c8e0');
      d.ell(30, 22, 6, 6, '#e4ecf8'); d.deco.ell(31.6, 22.6, 3.4, 4.4, '#2a3448', 0, { unlit: true });
    } },
    icepillar: { w: 18, h: 50, n: 2, lights: [[9, 16, 22, 'rgba(140,220,255,0.45)']], draw(d, v) {
      d.rect(3, 6, 12, 42, v ? '#bfe4f8' : '#a8d8f4', { shiny: true, round: 0.3 });
      d.rect(1, 44, 16, 5, '#d8eefc', { round: 0.3 }); d.rect(1, 2, 16, 5, '#d8eefc', { round: 0.3 });
      d.deco.rect(5, 8, 2, 34, '#ffffff'); d.deco.line(11, 10, 12, 40, 0.6, '#7ab8e0');
    } },
    // temple de glace (façade)
    icetemple: { w: 96, h: 88, n: 1, lights: [[48, 58, 40, 'rgba(140,220,255,0.6)']], draw(d) {
      d.rect(4, 44, 88, 42, '#c8e6f8', { shiny: true });
      d.poly([[0, 46], [48, 10], [96, 46]], '#a8d4f0', { shiny: true });
      d.poly([[30, 24], [48, 2], [66, 24]], '#e8f6ff', { shiny: true });
      d.deco.ell(48, 30, 6, 6, '#6ab8e8', 0, { unlit: true }); d.deco.ell(48, 30, 3, 3, '#ffffff', 0, { unlit: true });
      for (const x of [10, 26, 64, 80]) { d.rect(x, 46, 6, 40, '#e8f6ff', { shiny: true }); d.deco.line(x + 1.4, 48, x + 1.4, 84, 0.6, '#ffffff'); }
      d.rect(38, 56, 20, 30, '#1e3a5a', { round: 0.5 }); d.deco.ell(48, 58, 10, 7, '#1e3a5a');
      d.deco.ell(48, 66, 6, 8, '#3a7ab0'); d.deco.rect(46.6, 60, 2.8, 26, '#5aa0d8');
      for (let i = 0; i < 9; i++) d.deco.poly([[4 + i * 10, 46], [7 + i * 10, 52], [10 + i * 10, 46]], '#ffffff');
      d.rect(30, 84, 36, 3, '#e8f6ff');
    } },
    // ---------------------------------------------------------- grottes et volcans
    stalagmite: { w: 18, h: 34, n: 3, draw(d, v) {
      const C = [['#4a3e36', '#6a5a4c'], ['#3e3a4a', '#5e586e'], ['#5a4030', '#7e5a40']][v];
      d.poly([[2, 33], [6, 18], [8, 4 + v * 4], [10, 14], [13, 8 + v * 2], [16, 33]], C[0], { tex: 0.35 });
      d.deco.line(7, 10 + v * 4, 6, 30, 0.8, C[1]);
      d.ell(9, 33, 8, 2, shade(C[0], -0.3), 0, { flat: true });
    } },
    crystal: { w: 20, h: 26, n: 3, lights: [[10, 12, 26, 'rgba(170,140,255,0.6)']], draw(d, v) {
      const C = ['#9a7ae8', '#5ac8e8', '#e87ac8'][v];
      d.poly([[6, 25], [4, 12], [7, 3], [10, 12], [9, 25]], C, { shiny: true });
      d.poly([[9, 25], [11, 9], [14, 5], [16, 14], [14, 25]], shade(C, -0.15), { shiny: true });
      d.poly([[2, 25], [1, 18], [4, 15], [6, 25]], shade(C, 0.15), { shiny: true });
      d.deco.line(6.4, 6, 6.4, 20, 0.6, '#ffffff'); d.deco.line(13, 8, 13.4, 20, 0.5, shade(C, 0.5));
      d.ell(9, 25, 8, 2, '#2a2236', 0, { flat: true });
    } },
    pebbles: { w: 14, h: 8, n: 2, draw(d, v) {
      d.ell(4, 6, 2.6, 1.6, v ? '#6a6058' : '#5a5650'); d.ell(9, 5.6, 2, 1.4, v ? '#7a7066' : '#6a6660'); d.ell(11.6, 7, 1.4, 0.9, '#4a4640');
    } },
    lavarock: { w: 22, h: 18, n: 2, lights: [[11, 12, 18, 'rgba(255,120,40,0.5)']], draw(d, v) {
      d.blob([[2, 17], [3, 9], [9, 4], [16, 5], [20, 11], [20, 17]], v ? '#2a1e1c' : '#1e1616', { tex: 0.4 });
      d.deco.curve([[5, 14], [9, 10], [13, 12], [17, 8]], 1, '#ff7a20', { unlit: true });
      d.deco.curve([[9, 10], [10, 15]], 0.7, '#ffb040', { unlit: true });
    } },
    steamvent: { w: 18, h: 12, n: 1, smoke: [9, 4], draw(d) {
      d.ell(9, 9, 8, 3, '#3a2a24', 0, { tex: 0.4 }); d.deco.ell(9, 8.6, 4, 1.4, '#120a08', 0, { unlit: true });
      d.deco.ell(9, 8.6, 2, 0.7, '#ff7a20', 0, { unlit: true });
    } },
    smallvolcano: { w: 52, h: 40, n: 1, smoke: [26, 6], lights: [[26, 10, 30, 'rgba(255,120,40,0.6)']], draw(d) {
      d.poly([[0, 39], [18, 9], [34, 9], [52, 39]], '#5a3a2a', { tex: 0.4 });
      d.deco.ell(26, 9.6, 8, 2.4, '#ff6a1a', 0, { unlit: true });
      d.deco.curve([[24, 10], [22, 20], [24, 28], [20, 38]], 2, '#ff8a2a', { unlit: true });
      d.deco.curve([[24, 10], [22, 20], [24, 28], [20, 38]], 0.8, '#ffe070', { unlit: true });
    } },
    // ---------------------------------------------------------- usine et décharge
    tank: { w: 30, h: 42, n: 3, draw(d, v) {
      const C = [['#8a96a6', '#b4bec8'], ['#a0704a', '#c89a6a'], ['#5a8a6a', '#7ab08a']][v];
      d.rect(3, 10, 24, 30, C[0], { round: 0.5, shiny: true });
      d.ell(15, 10, 12, 4, C[1], 0, { shiny: true });
      for (let y = 16; y < 38; y += 7) d.deco.line(3, y, 27, y, 0.7, shade(C[0], -0.3));
      d.deco.rect(6, 12, 2, 26, shade(C[0], 0.3));
      d.tube([[27, 30], [30, 30]], 2, 2, '#5a5a62');
      if (v === 0) d.deco.rect(12, 22, 8, 5, '#f0c020');
      ground(d, 15, 40, 13);
    } },
    chimney: { w: 22, h: 58, n: 1, smoke: [11, 2], draw(d) {
      d.rect(6, 4, 10, 52, '#8a4a3a', { tex: 0.35 });
      for (let y = 8; y < 56; y += 3) d.deco.line(6, y, 16, y, 0.5, '#6a3a2a');
      d.rect(4, 2, 14, 4, '#5a3a2a'); d.deco.rect(6, 14, 10, 3, '#e8e0d0'); d.deco.rect(6, 30, 10, 3, '#e8e0d0');
      d.rect(2, 52, 18, 5, '#5a5a62');
    } },
    conveyor: { w: 48, h: 18, n: 1, frames: 4, fps: 8, draw(d, v, f = 0) {
      d.rect(1, 6, 46, 8, '#3a3e48', { round: 0.4 });
      for (let i = 0; i < 12; i++) d.deco.rect(2 + ((i * 4 + f) % 44), 7, 1.4, 6, '#5a6070');
      d.deco.rect(1, 6, 46, 1.4, '#9aa2b0');
      for (const x of [4, 24, 44]) d.rect(x - 1.4, 13, 2.8, 4, '#2a2e36');
      d.rect(10, 1, 10, 6, '#b08a5a', { round: 0.2 }); d.deco.line(10, 3.6, 20, 3.6, 0.6, '#7a5a3a');
      d.rect(30, 2, 7, 5, '#8a96a6', { round: 0.3 });
    } },
    battery: { w: 28, h: 40, n: 1, lights: [[14, 18, 20, 'rgba(140,255,160,0.5)']], draw(d) {
      d.rect(3, 6, 22, 33, '#2a2e3a', { round: 0.4, shiny: true });
      d.rect(9, 1, 10, 6, '#c8ccd6', { round: 0.3 });
      d.deco.rect(5, 26, 18, 11, '#e8c020'); d.deco.rect(5, 9, 18, 15, '#3a4a5a');
      d.deco.poly([[15, 12], [10, 19], [14, 19], [12, 24], [18, 16], [14, 16]], '#8aff9a', { unlit: true });
      d.deco.rect(6, 28, 3, 7, '#2a2e3a');
    } },
    scrap: { w: 22, h: 18, n: 3, draw(d, v) {
      if (v === 0) { d.ell(11, 13, 8, 4, '#2a2a2e', 0, { tex: 0.3 }); d.ell(11, 9.6, 8, 4, '#343438', 0, { tex: 0.3 }); d.deco.ell(11, 9.6, 3.6, 1.6, '#0e0e10'); }
      else if (v === 1) { d.rect(4, 4, 15, 12, '#6a6a72', { round: 0.2 }); d.deco.rect(6, 6, 11, 8, '#2a3a4a'); d.deco.line(7, 7, 12, 12, 0.6, '#9ad0e0'); d.deco.circ(17, 8, 0.8, '#d83a3a', { unlit: true }); d.tube([[8, 4], [5, 0]], 0.6, 0.4, '#3a3a3a'); }
      else { d.rect(3, 6, 16, 10, '#a0704a', { round: 0.2 }); d.deco.line(3, 10, 19, 10, 0.6, '#6a4a2a'); d.rect(12, 2, 8, 6, '#c8b090', { round: 0.2 }); }
    } },
    junkpile: { w: 44, h: 36, n: 2, draw(d, v) {
      d.blob([[1, 35], [5, 20], [14, 10], [24, 6], [34, 12], [42, 24], [43, 35]], v ? '#5a4a3a' : '#4a4038', { tex: 0.5 });
      d.deco.rect(10, 18, 9, 7, '#7a8090'); d.deco.rect(11.4, 19.4, 6, 4, '#2a3a4a');
      d.deco.ell(30, 22, 5, 5, '#2a2a2e'); d.deco.ell(30, 22, 2, 2, '#5a5a5a');
      d.deco.rect(20, 10, 6, 10, '#c8c4b8'); d.deco.line(20, 14, 26, 14, 0.5, '#8a8a80');
      d.deco.line(5, 30, 18, 26, 1, '#a04a2a'); d.deco.line(26, 30, 40, 31, 1.2, '#3a6ac8');
      d.deco.rect(34, 26, 5, 4, '#e0c040');
    } },
    // façade d'usine (avec porte)
    factory: { w: 112, h: 84, n: 1, smoke: [94, 2], lights: [[24, 46, 18], [56, 46, 18], [88, 46, 18]], draw(d) {
      d.rect(2, 30, 108, 52, '#7a7e88', { tex: 0.2 });
      for (let i = 0; i < 6; i++) d.poly([[2 + i * 18, 30], [11 + i * 18, 16], [20 + i * 18, 30]], i % 2 ? '#6a6e78' : '#5e626c', { shiny: true });
      for (const x of [16, 48, 80]) { d.deco.rect(x, 40, 16, 12, '#2a3442'); d.deco.rect(x + 1, 41, 14, 10, '#f0d080'); d.deco.line(x + 8, 41, x + 8, 51, 0.8, '#2a3442'); }
      d.rect(44, 58, 24, 24, '#3a3e48'); d.deco.rect(46, 60, 20, 22, '#5a5e68');
      for (let y = 62; y < 82; y += 3) d.deco.line(46, y, 66, y, 0.6, '#3a3e48');
      d.deco.rect(2, 54, 108, 2, '#f0c020'); for (let x = 2; x < 110; x += 6) d.deco.rect(x, 54, 3, 2, '#2a2a30');
      d.rect(88, 0, 12, 32, '#8a4a3a'); d.deco.rect(88, 8, 12, 3, '#e8e0d0');
      d.tube([[4, 70], [30, 70]], 4, 4, '#9aa2b0', { shiny: true }); d.tube([[82, 64], [108, 64]], 4, 4, '#a0704a', { shiny: true });
    } },
    // ---------------------------------------------------------- Ville des Jouets
    toyhouse: { w: 48, h: 50, n: 3, lights: [[24, 34, 16]], draw(d, v) {
      const C = [['#f25a5a', '#4ea4f2', '#f2c63a'], ['#5ac46a', '#f28ab4', '#4ea4f2'], ['#c86af2', '#f2c63a', '#5ac46a']][v];
      d.rect(6, 22, 36, 26, C[0], { shiny: true, round: 0.2 });
      d.poly([[2, 24], [24, 4], [46, 24]], C[1], { shiny: true });
      d.deco.circ(24, 16, 3.4, '#ffffff'); d.deco.circ(24, 16, 2, C[2]);
      d.rect(19, 32, 10, 16, C[2], { round: 0.5 }); d.deco.circ(26.6, 40, 0.9, '#ffffff', { unlit: true });
      d.deco.rect(9, 28, 7, 6, '#fff4c0'); d.deco.rect(32, 28, 7, 6, '#fff4c0');
      d.deco.line(12.5, 28, 12.5, 34, 0.6, C[0]); d.deco.line(35.5, 28, 35.5, 34, 0.6, C[0]);
      for (let i = 0; i < 4; i++) d.deco.circ(10 + i * 9.4, 46, 1.2, '#ffffff');
    } },
    jackbox: { w: 22, h: 40, n: 1, frames: 4, fps: 3, draw(d, v, f = 0) {
      const up = [0, 4, 6, 4][f];
      d.rect(3, 24, 16, 15, '#f25a5a', { shiny: true }); d.deco.rect(3, 24, 16, 2, '#f2c63a'); d.deco.ell(11, 31, 3, 3, '#4ea4f2');
      d.tube([[11, 24], [11, 16 - up]], 2, 2, '#c8c8d0'); for (let i = 0; i < 4; i++) d.deco.line(9, 22 - i * (2 + up / 4), 13, 21 - i * (2 + up / 4), 0.6, '#8a8a92');
      d.ell(11, 12 - up, 5.6, 5.6, '#ffe0c8'); d.deco.circ(9, 11 - up, 0.8, '#1a1a2a', { unlit: true }); d.deco.circ(13, 11 - up, 0.8, '#1a1a2a', { unlit: true });
      d.deco.ell(11, 14.6 - up, 2, 1, '#d83a3a'); d.poly([[6, 9 - up], [11, 0 - up], [16, 9 - up]], '#5ac46a', { shiny: true });
      d.tube([[19, 30], [22, 28]], 0.8, 0.8, '#c8c8d0');
    } },
    toytrain: { w: 64, h: 28, n: 1, draw(d) {
      d.rect(2, 10, 26, 14, '#f25a5a', { shiny: true }); d.rect(4, 2, 12, 9, '#f25a5a'); d.rect(20, 4, 5, 7, '#2a2a3a');
      d.deco.rect(6, 4, 8, 5, '#fff4c0');
      d.rect(32, 12, 28, 12, '#4ea4f2', { shiny: true }); d.deco.rect(36, 14, 6, 5, '#fff4c0'); d.deco.rect(46, 14, 6, 5, '#fff4c0');
      for (const x of [8, 22, 38, 54]) { d.ell(x, 25, 3.6, 3.6, '#2a2a3a'); d.deco.ell(x, 25, 1.4, 1.4, '#f2c63a'); }
      d.deco.rect(28, 18, 4, 2, '#8a8a92');
    } },
    // ---------------------------------------------------------- forteresse d'Ogremon
    palisade: { w: 16, h: 34, n: 2, draw(d, v) {
      for (let i = 0; i < 3; i++) { const x = 2.6 + i * 5.2; d.rect(x - 2.2, 8 - (i % 2) * 2, 4.4, 26, v ? '#7a5030' : '#6a4428', { tex: 0.4 }); d.poly([[x - 2.2, 8 - (i % 2) * 2], [x, 2 - (i % 2) * 2], [x + 2.2, 8 - (i % 2) * 2]], '#9a7048'); }
      d.deco.rect(0, 16, 16, 2, '#4a3018'); d.deco.rect(0, 26, 16, 2, '#4a3018');
    } },
    watchtower: { w: 40, h: 72, n: 1, fire: [20, 14], lights: [[20, 12, 40]], draw(d) {
      for (const x of [8, 32]) d.tube([[x, 71], [x + (x < 20 ? 4 : -4), 24]], 3, 2.4, '#6a4428', { tex: 0.3 });
      d.deco.line(10, 60, 30, 40, 1, '#4a3018'); d.deco.line(30, 60, 10, 40, 1, '#4a3018');
      d.rect(6, 18, 28, 8, '#7a5030', { tex: 0.3 }); d.rect(4, 24, 32, 3, '#5a3a20');
      d.poly([[4, 18], [20, 4], [36, 18]], '#8a3a2a', { tex: 0.3 });
      d.tube([[20, 4], [20, -4]], 1, 1, '#5a3a20'); d.poly([[20, -4], [28, -2], [20, 1]], '#c83a2a');
    } },
    ogregate: { w: 64, h: 64, n: 1, fire: [10, 18], draw(d) {
      d.rect(0, 14, 14, 48, '#6a4428', { tex: 0.4 }); d.rect(50, 14, 14, 48, '#6a4428', { tex: 0.4 });
      d.poly([[0, 14], [7, 4], [14, 14]], '#9a7048'); d.poly([[50, 14], [57, 4], [64, 14]], '#9a7048');
      d.rect(12, 16, 40, 8, '#5a3a20', { tex: 0.4 });
      d.deco.ell(32, 20, 6, 3.4, '#e0d0b0'); d.deco.ell(30, 19.6, 1, 1, '#1a1010', 0, { unlit: true }); d.deco.ell(34, 19.6, 1, 1, '#1a1010', 0, { unlit: true });
      d.rect(16, 24, 32, 38, '#2a1a10'); for (let x = 18; x < 48; x += 5) d.deco.rect(x, 24, 2, 38, '#4a3018');
      d.tube([[3, 14], [3, 6]], 0.8, 0.8, '#3a2a1a');
    } },
    // ---------------------------------------------------------- région des dinosaures
    cycad: { w: 40, h: 46, n: 2, big: true, draw(d, v) {
      d.tube([[20, 45], [20, 24]], 7, 6, '#7a5a34', { tex: 0.5 });
      for (let i = 0; i < 5; i++) d.deco.line(17, 42 - i * 4, 23, 40 - i * 4, 0.8, '#5a3a20');
      const L = v ? '#3a7a2a' : '#4a8a30';
      for (let i = 0; i < 9; i++) { const a = -Math.PI + (i / 8) * Math.PI, l = 17 + (i % 2) * 3; d.tube([[20, 22], [20 + Math.cos(a) * l * 0.6, 22 + Math.sin(a) * l * 0.5 - 4], [20 + Math.cos(a) * l, 22 + Math.sin(a) * l * 0.4 + 2]], 4, 1, i % 2 ? L : shade(L, 0.2)); }
    } },
    bigfern: { w: 26, h: 20, n: 2, draw(d, v) {
      const L = v ? '#3a8a34' : '#4a9a3a';
      for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.95 + i * 0.32; d.tube([[13, 19], [13 + Math.cos(a) * 8, 19 + Math.sin(a) * 9 - 3], [13 + Math.cos(a) * 12, 19 + Math.sin(a) * 9 + 2]], 3, 0.6, i % 2 ? L : shade(L, 0.2)); }
    } },
    bones: { w: 40, h: 26, n: 2, draw(d, v) {
      const B = '#e8dcc0';
      if (v === 0) {
        d.tube([[4, 22], [36, 20]], 3, 2.4, B);
        for (let i = 0; i < 6; i++) d.tube([[8 + i * 5, 21], [6 + i * 5, 10 - (i % 3)], [10 + i * 5, 4 + (i % 2) * 2]], 2, 1.4, B);
      } else {
        d.blob([[4, 24], [6, 12], [16, 8], [26, 10], [30, 18], [28, 24]], B, { tex: 0.2 });
        d.deco.ell(14, 15, 3.4, 3, '#3a2a1a', 0, { unlit: true });
        for (let i = 0; i < 5; i++) d.deco.poly([[18 + i * 2.4, 22], [19 + i * 2.4, 26], [20 + i * 2.4, 22]], '#f8f0e0');
        d.tube([[30, 18], [38, 22]], 2, 1.4, B);
      }
    } },
    amber: { w: 18, h: 20, n: 1, lights: [[9, 10, 16, 'rgba(255,180,60,0.5)']], draw(d) {
      d.blob([[2, 19], [3, 8], [9, 2], [15, 6], [16, 19]], '#e89a2a', { shiny: true });
      d.deco.ell(8, 11, 2.4, 1.6, '#5a3a10'); d.deco.line(6, 10, 4, 8, 0.4, '#5a3a10'); d.deco.line(10, 10, 12, 8, 0.4, '#5a3a10');
      d.deco.ell(6, 6, 1.4, 2.6, '#fff0b0', -0.4);
    } },
    // ---------------------------------------------------------- jungle et mangrove
    jungletree: { w: 46, h: 56, n: 3, big: true, draw(d, v) {
      d.tube([[23, 55], [22, 36], [24, 20]], 5, 3.4, '#6a4a2a', { tex: 0.4 });
      d.tube([[22, 50], [17, 55]], 2, 1, '#5a3a20'); d.tube([[24, 50], [29, 55]], 2, 1, '#5a3a20');
      const L = ['#2a8a3a', '#3a9a3a', '#2a7a4a'][v];
      for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.95 + i * 0.32, l = 18 + (i % 3) * 2; d.tube([[24, 20], [24 + Math.cos(a) * l * 0.55, 20 + Math.sin(a) * 12 - 2], [24 + Math.cos(a) * l, 20 + Math.sin(a) * 9 + 6]], 7, 1.6, i % 2 ? L : shade(L, 0.18), { tex: 0.2 }); }
      d.deco.curve([[16, 26], [14, 38], [16, 46]], 0.8, '#3a7a2a'); d.deco.curve([[32, 24], [33, 36]], 0.8, '#3a7a2a');
    } },
    junglebush: { w: 26, h: 22, n: 2, draw(d, v) {
      const L = v ? '#2a8a3a' : '#3aa048';
      for (let i = 0; i < 6; i++) { const a = -Math.PI * 0.9 + i * 0.38; d.ell(13 + Math.cos(a) * 6, 16 + Math.sin(a) * 7, 6, 2.6, i % 2 ? L : shade(L, 0.2), a, { tex: 0.2 }); }
      if (v) { d.deco.circ(10, 9, 1.6, '#ff4a6a'); d.deco.circ(16, 11, 1.4, '#ffd040'); }
    } },
    totem: { w: 18, h: 44, n: 1, draw(d) {
      d.rect(3, 4, 12, 39, '#8a5a30', { tex: 0.3 });
      for (let i = 0; i < 3; i++) {
        const y = 8 + i * 12, c = ['#d83a2a', '#3a8ad8', '#e0b030'][i];
        d.deco.rect(3, y - 3, 12, 2, c); d.deco.ell(6.6, y + 2, 1.6, 1.6, '#ffffff', 0, { unlit: true }); d.deco.ell(11.4, y + 2, 1.6, 1.6, '#ffffff', 0, { unlit: true });
        d.deco.ell(6.6, y + 2, 0.7, 0.7, '#1a1010', 0, { unlit: true }); d.deco.ell(11.4, y + 2, 0.7, 0.7, '#1a1010', 0, { unlit: true }); d.deco.rect(6, y + 5, 6, 1.4, '#2a1a10');
      }
      d.poly([[0, 6], [3, 4], [3, 10]], '#d83a2a'); d.poly([[18, 6], [15, 4], [15, 10]], '#d83a2a');
    } },
    mangrove: { w: 46, h: 52, n: 2, big: true, draw(d, v) {
      for (let i = 0; i < 6; i++) { const x = 8 + i * 6; d.tube([[23, 30], [x, 42], [x + (i % 2 ? 2 : -2), 51]], 2.4, 1.6, '#6a5236'); }
      d.tube([[23, 40], [23, 22]], 4.4, 3.4, '#6a5236', { tex: 0.3 });
      const L = v ? ['#2a6a3a', '#3a7e44'] : ['#2e7036', '#428a42'];
      d.ell(23, 16, 20, 11, L[0], 0, { tex: 0.35 }); d.ell(16, 12, 10, 7, L[1], 0, { tex: 0.35 }); d.ell(31, 13, 10, 7, L[1], 0, { tex: 0.35 });
    } },
    reeds: { w: 18, h: 22, n: 2, draw(d, v) {
      for (let i = 0; i < 7; i++) { const x = 3 + i * 2, h = 12 + ((i * 5) % 7); d.tube([[x, 21], [x + (i % 2 ? 1 : -1), 21 - h]], 1, 0.4, i % 2 ? '#5a7a2a' : '#6a8a34'); if (v && i % 3 === 0) d.ell(x + (i % 2 ? 1 : -1), 21 - h + 2, 0.9, 2.4, '#6a4a2a'); }
    } },
    // cabane sur pilotis (villages sur l'eau de Digimon World 2003)
    stilthut: { w: 48, h: 56, n: 2, lights: [[24, 30, 18]], draw(d, v) {
      for (const x of [8, 18, 30, 40]) d.tube([[x, 55], [x, 34]], 2.4, 2.4, '#5a3a20', { tex: 0.3 });
      d.rect(4, 32, 40, 4, '#8a6a3a', { tex: 0.3 });
      d.rect(8, 18, 32, 15, v ? '#c8a070' : '#b89060', { tex: 0.3 });
      d.poly([[2, 20], [24, 2], [46, 20]], v ? '#a08a4a' : '#9a7a3a', { tex: 0.5 });
      for (let i = 0; i < 5; i++) d.deco.line(6 + i * 8, 19, 24, 4, 0.5, '#7a5a2a');
      d.rect(20, 24, 8, 9, '#3a2410'); d.deco.rect(11, 23, 6, 5, '#f0d080'); d.deco.rect(31, 23, 6, 5, '#f0d080');
    } },
    // ---------------------------------------------------------- marais et palais Geko
    swamptree: { w: 44, h: 52, n: 2, big: true, draw(d, v) {
      d.tube([[22, 51], [21, 34], [23, 22]], 6, 4, '#4a4030', { tex: 0.4 });
      d.tube([[21, 46], [13, 51]], 2.4, 1, '#3a3022'); d.tube([[23, 46], [31, 51]], 2.4, 1, '#3a3022');
      const L = v ? '#3a5a2a' : '#46622e';
      d.ell(22, 16, 19, 12, L, 0, { tex: 0.4 });
      for (let i = 0; i < 9; i++) d.tube([[6 + i * 4, 20 + (i % 2) * 2], [6 + i * 4 + 1, 32 + (i % 3) * 4]], 1.4, 0.6, i % 2 ? '#5a7a3a' : '#7a8a4a');
    } },
    frogstatue: { w: 26, h: 30, n: 1, draw(d) {
      d.rect(3, 24, 20, 5, '#7a7a70', { tex: 0.3 });
      d.ell(13, 18, 9, 7, '#5a7a5a', 0, { tex: 0.3 }); d.ell(13, 10, 7, 5, '#5a7a5a', 0, { tex: 0.3 });
      d.ell(9, 6, 2.6, 2.6, '#6a8a6a'); d.ell(17, 6, 2.6, 2.6, '#6a8a6a');
      d.deco.circ(9, 6, 1.2, '#e0c040', { unlit: true }); d.deco.circ(17, 6, 1.2, '#e0c040', { unlit: true });
      d.deco.curve([[8, 12], [13, 14], [18, 12]], 0.8, '#2a3a2a', { unlit: true });
      d.deco.ell(13, 19, 5, 4, '#8aa07a');
    } },
    gekopalace: { w: 120, h: 96, n: 1, lights: [[60, 64, 34], [24, 66, 16], [96, 66, 16]], draw(d) {
      d.rect(6, 76, 108, 18, '#7a7a70', { tex: 0.35 });
      for (let x = 6; x < 114; x += 12) d.deco.line(x, 76, x, 94, 0.6, '#5a5a52');
      d.rect(14, 50, 92, 27, '#e8e0d0');
      for (const x of [14, 36, 58, 80, 102]) d.rect(x, 50, 4, 27, '#6a2a1a');
      d.poly([[2, 54], [20, 38], [100, 38], [118, 54]], '#3a5a4a', { shiny: true });
      d.rect(30, 24, 60, 16, '#e8e0d0'); d.poly([[20, 28], [36, 14], [84, 14], [100, 28]], '#3a5a4a', { shiny: true });
      d.poly([[44, 14], [60, 2], [76, 14]], '#2e4a3c', { shiny: true });
      d.deco.circ(60, 9, 3, '#e0c040', { unlit: true });
      d.rect(50, 58, 20, 19, '#4a2414'); d.deco.line(60, 58, 60, 77, 0.8, '#2a1408');
      for (const x of [22, 92]) { d.deco.rect(x, 58, 8, 10, '#f0d080'); d.deco.line(x + 4, 58, x + 4, 68, 0.6, '#6a2a1a'); }
      d.deco.poly([[0, 54], [2, 49], [6, 54]], '#e0c040'); d.deco.poly([[120, 54], [118, 49], [114, 54]], '#e0c040');
    } },
    // ---------------------------------------------------------- cimetière d'Overdell
    tombstone: { w: 18, h: 24, n: 3, draw(d, v) {
      const S = ['#7a7a84', '#6a6a74', '#8a8478'][v];
      if (v === 2) { d.rect(7, 4, 4, 18, S, { tex: 0.3 }); d.rect(2, 8, 14, 4, S, { tex: 0.3 }); }
      else { d.rect(3, 8, 12, 15, S, { tex: 0.35 }); d.ell(9, 8, 6, 5, S, 0, { tex: 0.35 }); d.deco.line(6, 12, 12, 12, 0.6, '#3a3a44'); d.deco.line(7, 15, 11, 15, 0.6, '#3a3a44'); }
      if (v === 1) d.deco.ell(6, 19, 3, 2, '#4a6a3a');
      d.ell(9, 23, 7, 1.6, '#3a3a2a', 0, { flat: true });
    } },
    jacklantern: { w: 16, h: 14, n: 1, lights: [[8, 8, 22, 'rgba(255,150,40,0.6)']], draw(d) {
      d.ell(8, 8.6, 7, 5.4, '#e0761a', 0, { shiny: true });
      d.deco.line(5, 4, 5, 13, 0.5, '#b0560e'); d.deco.line(11, 4, 11, 13, 0.5, '#b0560e');
      d.deco.poly([[4, 7], [6, 5.6], [6.6, 8]], '#ffe070', { unlit: true }); d.deco.poly([[12, 7], [10, 5.6], [9.4, 8]], '#ffe070', { unlit: true });
      d.deco.poly([[4.6, 10], [11.4, 10], [10, 12], [6, 12]], '#ffe070', { unlit: true });
      d.tube([[8, 3.6], [9, 1]], 1.2, 0.8, '#4a6a2a');
    } },
    ironfence: { w: 16, h: 22, n: 1, draw(d) {
      d.deco.rect(0, 8, 16, 1.4, '#2a2632'); d.deco.rect(0, 17, 16, 1.4, '#2a2632');
      for (let i = 0; i < 4; i++) { const x = 2 + i * 4; d.rect(x - 0.7, 5, 1.4, 16, '#2a2632', { shiny: true }); d.poly([[x - 1.4, 5], [x, 1.6], [x + 1.4, 5]], '#3a3444'); }
    } },
    mausoleum: { w: 50, h: 56, n: 1, draw(d) {
      d.rect(4, 22, 42, 32, '#6a6a74', { tex: 0.35 });
      d.poly([[0, 24], [25, 6], [50, 24]], '#4a4a54', { tex: 0.3 });
      for (const x of [8, 38]) d.rect(x, 26, 4, 28, '#8a8a94');
      d.rect(17, 30, 16, 24, '#1a1620'); d.deco.ell(25, 31, 8, 4, '#1a1620');
      d.deco.rect(24, 10, 2, 9, '#c8c0a8'); d.deco.rect(21.4, 12.4, 7, 2, '#c8c0a8');
      d.deco.ell(10, 50, 5, 3, '#3a5a3a');
    } },
    // manoir du Seigneur Gris (façade)
    manor: { w: 128, h: 104, n: 1, lights: [[30, 54, 16, 'rgba(200,120,255,0.5)'], [98, 54, 16, 'rgba(200,120,255,0.5)'], [64, 40, 18, 'rgba(255,160,80,0.5)']], draw(d) {
      d.rect(8, 38, 112, 64, '#4a4458', { tex: 0.25 });
      for (let y = 44; y < 100; y += 6) d.deco.line(8, y, 120, y, 0.5, '#3a3448');
      d.poly([[2, 40], [24, 14], [104, 14], [126, 40]], '#2a2234', { shiny: true });
      d.rect(48, 16, 32, 26, '#4a4458'); d.poly([[44, 18], [64, 0], [84, 18]], '#2a2234', { shiny: true });
      for (const x of [8, 112]) { d.rect(x - 4, 22, 16, 80, '#3e384c', { tex: 0.2 }); d.poly([[x - 6, 24], [x + 4, 4], [x + 14, 24]], '#2a2234', { shiny: true }); }
      for (const x of [22, 90]) { d.deco.rect(x, 48, 16, 14, '#1a1428'); d.deco.rect(x + 2, 50, 12, 10, '#c88aff'); d.deco.line(x + 8, 50, x + 8, 60, 0.8, '#1a1428'); d.deco.line(x + 2, 55, x + 14, 55, 0.8, '#1a1428'); }
      d.deco.ell(64, 30, 6, 6, '#ffb060', 0, { unlit: true }); d.deco.line(58, 30, 70, 30, 0.6, '#2a1a10'); d.deco.line(64, 24, 64, 36, 0.6, '#2a1a10');
      d.rect(52, 70, 24, 32, '#1a1020'); d.deco.ell(64, 71, 12, 7, '#1a1020');
      d.deco.line(64, 66, 64, 102, 0.8, '#3a2a40'); d.deco.circ(60, 86, 1, '#e0c040', { unlit: true }); d.deco.circ(68, 86, 1, '#e0c040', { unlit: true });
    } },
    // ---------------------------------------------------------- Pays des Scarabées et lac
    giantstump: { w: 46, h: 38, n: 2, draw(d, v) {
      d.rect(5, 12, 36, 24, '#6a4a2a', { tex: 0.45, round: 0.2 });
      d.ell(23, 12, 18, 6, '#c8a070', 0, { tex: 0.2 });
      for (let r = 3; r < 16; r += 4) d.deco.ell(23, 12, r, r * 0.32, '#9a7448');
      for (const x of [3, 14, 33, 44]) d.tube([[x < 23 ? x + 3 : x - 3, 30], [x, 37]], 4, 2, '#5a3a20');
      if (v) { d.deco.ell(14, 26, 3, 4, '#2a1a10'); d.ell(34, 22, 4, 2.4, '#e8c050', 0, { shiny: true }); }
    } },
    honeycomb: { w: 22, h: 26, n: 1, draw(d) {
      d.tube([[11, 2], [11, 6]], 1.4, 1.4, '#5a3a20');
      d.ell(11, 15, 9, 10, '#e8a828', { shiny: true });
      for (let i = 0; i < 4; i++) d.deco.curve([[3 + i * 0.6, 9 + i * 4], [11, 8 + i * 4 + 2], [19 - i * 0.6, 9 + i * 4]], 0.6, '#b07818');
      d.deco.ell(11, 21, 2.4, 1.6, '#3a2010', 0, { unlit: true });
    } },
    beetlestatue: { w: 36, h: 40, n: 1, draw(d) {
      d.rect(4, 32, 28, 7, '#8a8a80', { tex: 0.3 });
      d.ell(18, 24, 12, 8, '#3a5a8a', 0, { shiny: true }); d.deco.line(18, 16, 18, 32, 0.8, '#1a2a4a');
      d.ell(18, 15, 6, 4, '#2a3a5a', 0, { shiny: true });
      d.tube([[18, 12], [18, 2], [24, 0]], 2, 1, '#2a3a5a', { shiny: true });
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) d.tube([[18 + s * 9, 22 + i * 3], [18 + s * 15, 26 + i * 3]], 1.2, 0.8, '#1a2a4a');
    } },
    colosseum: { w: 120, h: 72, n: 1, draw(d) {
      d.ell(60, 52, 58, 18, '#c8b490', 0, { tex: 0.3 });
      d.rect(2, 22, 116, 30, '#d8c4a0', { tex: 0.3 });
      for (let i = 0; i < 9; i++) { const x = 8 + i * 13; d.deco.ell(x + 4, 32, 4, 6, '#3a2a1a'); d.deco.rect(x, 32, 8, 8, '#3a2a1a'); }
      d.deco.rect(2, 22, 116, 3, '#a89470'); d.deco.rect(2, 44, 116, 2, '#a89470');
      d.rect(48, 36, 24, 16, '#2a1a10'); d.deco.ell(60, 36, 12, 6, '#2a1a10');
      d.poly([[52, 22], [60, 6], [68, 22]], '#3a5a8a'); d.tube([[60, 6], [60, 0]], 1, 1, '#5a3a20'); d.poly([[60, 0], [68, 2], [60, 4]], '#e0c040');
    } },
    // tramway abandonné au bord du lac (saison 1, épisode de Seadramon)
    tram: { w: 72, h: 44, n: 1, draw(d) {
      d.rect(4, 12, 64, 26, '#e8dcc0', { shiny: true, round: 0.2 });
      d.rect(2, 8, 68, 6, '#3a6a4a', { round: 0.3 }); d.deco.rect(4, 30, 64, 4, '#3a6a4a');
      for (let i = 0; i < 6; i++) { d.deco.rect(8 + i * 10, 16, 7, 9, '#7ab8d0'); d.deco.line(8.6 + i * 10, 17, 11 + i * 10, 23, 0.5, '#ffffff'); }
      d.deco.rect(60, 16, 6, 18, '#5a4a3a');
      for (const x of [14, 58]) { d.ell(x, 40, 4, 3, '#2a2a2e'); d.deco.ell(x, 40, 1.4, 1, '#6a6a70'); }
      d.tube([[36, 8], [36, 2], [44, -2]], 0.8, 0.6, '#3a3a40');
      d.deco.ell(20, 34, 6, 1.6, '#6a8a4a');
    } },
    dock: { w: 32, h: 20, n: 1, draw(d) {
      d.rect(1, 4, 30, 10, '#9a6a3a', { tex: 0.3 }); for (let x = 4; x < 31; x += 5) d.deco.line(x, 4, x, 14, 0.6, '#5a3a1a');
      for (const x of [3, 15, 28]) d.tube([[x, 13], [x, 19]], 2, 2, '#5a3a1a');
    } },
    // entrée de grotte creusée dans la roche (posée en fond, on passe dessous)
    cavemouth: { w: 64, h: 44, n: 2, draw(d, v) {
      const R = v ? ['#3a2a22', '#5a4436'] : ['#3a3a42', '#5e5e68'];
      d.blob([[0, 43], [2, 20], [12, 6], [32, 1], [52, 6], [62, 20], [64, 43]], R[0], { tex: 0.45 });
      d.deco.blob([[4, 30], [10, 12], [24, 5], [20, 18]], R[1]);
      d.deco.blob([[18, 43], [19, 26], [26, 16], [38, 16], [45, 26], [46, 43]], '#08060a');
      d.deco.blob([[22, 43], [23, 30], [28, 22], [36, 22], [41, 30], [42, 43]], '#000000');
      for (const x of [24, 31, 38]) d.deco.poly([[x - 1.6, 16], [x, 22], [x + 1.6, 16]], R[1]);
    } },
  });

  // ------------------------------------------------------------ légende des cartes (objets des biomes)
  const CH = DW.World.CH, add = (ch, o) => (CH[ch] = Object.assign({ t: 'grass', solid: true }, o));
  add('à', { obj: 'cairn' }); add('â', { obj: 'spire' }); add('ä', { obj: 'termite' }); add('ã', { obj: 'blackgear' });
  add('å', { obj: 'icerock' }); add('æ', { obj: 'snowman' }); add('ç', { obj: 'icecrystal' }); add('è', { obj: 'icepillar' });
  add('é', { obj: 'crystal' }); add('ê', { obj: 'stalagmite' }); add('ë', { obj: 'lavarock' }); add('ì', { obj: 'steamvent' });
  add('í', { obj: 'tank' }); add('î', { obj: 'chimney' }); add('ï', { obj: 'battery' }); add('ð', { obj: 'scrap' });
  add('ñ', { obj: 'jackbox' }); add('ò', { obj: 'palisade' }); add('ó', { obj: 'cactus' }); add('ô', { obj: 'skullrock' });
  add('õ', { obj: 'bones' }); add('ö', { obj: 'amber' }); add('ø', { obj: 'totem' }); add('ù', { obj: 'frogstatue' });
  add('ú', { obj: 'tombstone' }); add('û', { obj: 'jacklantern' }); add('ü', { obj: 'ironfence' }); add('ý', { obj: 'giantstump' });
  add('þ', { obj: 'honeycomb' }); add('ÿ', { obj: 'beetlestatue' }); add('Ñ', { obj: 'halfgear' }); add('Ò', { obj: 'junkpile' });
  add('Ó', { obj: 'boulder' }); add('Ô', { obj: 'cycad' }); add('Õ', { obj: 'igloo' });
  add('Ð', { obj: 'reeds', solid: false });
  // sol métallique (usine)
  add('¢', { t: 'metal', solid: false });
  for (const k in CH) if (CH[k].solid) DW.SOLID.add(k);
})();
