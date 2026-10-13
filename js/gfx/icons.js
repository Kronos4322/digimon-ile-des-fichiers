'use strict';
// =====================================================================
//  ICÔNES : objets et menus (petits volumes 16x16)
// =====================================================================
(function () {
  const Art = DW.Art;
  const ITEM = {
    viande(d) {
      d.tube([[3, 13], [6, 10]], 2.4, 2.4, '#f4eee0'); d.circ(2.4, 13.6, 1.6, '#f4eee0'); d.circ(3.4, 14.4, 1.4, '#f4eee0');
      d.ell(9.5, 7, 5.5, 4.6, '#c0582e', -0.6);
      d.deco.ell(8.4, 5.8, 2.6, 1.6, '#e88a5a', -0.6);
      d.deco.ell(11, 8.4, 2.2, 1, '#8a3418', -0.6);
    },
    super_viande(d) {
      d.tube([[2.5, 14], [5.5, 11]], 2.6, 2.6, '#f4eee0'); d.circ(2, 14.4, 1.7, '#f4eee0');
      d.ell(9.5, 7, 6.2, 5.4, '#d8782a', -0.6, { shiny: true });
      d.deco.ell(8, 5.4, 3, 1.8, '#ffc060', -0.6);
      d.deco.circ(12, 4, 0.9, '#ffffff', { unlit: true }); d.deco.circ(13.4, 6, 0.6, '#ffffff', { unlit: true });
    },
    remede(d) {
      d.rect(6, 2, 4, 3, '#c8c8d0', { round: 0.5 });
      d.blob([[4, 6], [12, 6], [13, 14], [3, 14]], '#4ac878', { shiny: true });
      d.deco.rect(5, 9, 6, 3, '#ffffff'); d.deco.rect(7.4, 9.4, 1.2, 2.2, '#e04040', { unlit: true }); d.deco.rect(6.9, 9.9, 2.2, 1.2, '#e04040', { unlit: true });
    },
    cartes(d) {
      d.rect(2, 4, 9, 11, '#3a6ad8', { round: 0.2 }); d.rect(5, 2, 9, 11, '#f0c030', { round: 0.2, shiny: true });
      d.deco.rect(6.5, 3.5, 6, 8, '#3a6ad8'); d.deco.circ(9.5, 7.5, 1.6, '#ffffff');
    },
    pomme(d) { d.circ(8, 9.4, 5, '#e03a3a', { shiny: true }); d.deco.ell(6, 7.4, 1.6, 1.2, '#ff9a8a'); d.tube([[8, 5], [9, 2]], 0.8, 0.6, '#6a4a2a'); d.ell(11, 3.4, 2.4, 1.2, '#4ab048', -0.4); },
    riz(d) { d.poly([[2.6, 13], [8, 3], [13.4, 13]], '#f6f4ec', { round: 0.5, shiny: true }); d.deco.rect(5, 10, 6, 3.4, '#2a3a2a'); },
    poisson(d) { d.ell(7.6, 8, 5.4, 3.2, '#d8a050', 0, { shiny: true }); d.poly([[12, 8], [15, 5], [15, 11]], '#b88040'); d.deco.circ(4.6, 7.4, 0.9, '#2a1a10', { unlit: true }); d.deco.line(7, 6, 7, 10, 0.6, '#8a5a2a'); d.deco.line(9.6, 6, 9.6, 10, 0.6, '#8a5a2a'); },
    champi(d) { d.rect(6.4, 8, 3.2, 6, '#f0e6d0'); d.ell(8, 7.4, 6, 4, '#d84a3a', 0, { shiny: true }); d.deco.circ(5.4, 6.6, 1, '#ffffff'); d.deco.circ(9.6, 5.6, 1.1, '#ffffff'); d.deco.circ(11, 8, 0.8, '#ffffff'); },
    glace(d) { d.poly([[4.6, 8], [11.4, 8], [8, 15]], '#d8a058', { tex: 0.3 }); d.circ(8, 6.4, 3.8, '#c8e8ff', { shiny: true }); d.circ(8, 3.4, 2, '#ffffff'); },
    gateau(d) { d.rect(2.6, 7, 10.8, 6.4, '#f8e8d0', { shiny: true }); d.deco.rect(2.6, 9.6, 10.8, 1.4, '#e05a8a'); d.deco.rect(2.6, 7, 10.8, 1.4, '#ffffff'); d.circ(8, 5.4, 1.6, '#e03a3a', { shiny: true }); },
    bonbon(d) { d.ell(8, 8, 3.6, 3, '#e05ab0', 0, { shiny: true }); d.poly([[4.6, 8], [1.4, 5.4], [1.4, 10.6]], '#f08ad0'); d.poly([[11.4, 8], [14.6, 5.4], [14.6, 10.6]], '#f08ad0'); },
    puce_pv(d) { chip(d, '#e04848'); }, puce_pm(d) { chip(d, '#4ad0e8'); }, puce_atk(d) { chip(d, '#f08a30'); }, puce_def(d) { chip(d, '#3a8ae0'); }, puce_spd(d) { chip(d, '#3ac070'); }, puce_int(d) { chip(d, '#a05ae0'); },
    disque_pm(d) { d.circ(8, 8, 6, '#5ab0ff', { shiny: true }); d.deco.circ(8, 8, 2.4, '#1a3a6a'); d.deco.circ(8, 8, 1, '#c8e8ff', { unlit: true }); },
    manuel(d) { d.rect(3, 2.4, 10, 11.6, '#8a3a2a', { round: 0.15, shiny: true }); d.deco.rect(4.4, 3.4, 7.6, 9.6, '#f0e6c8'); d.deco.line(6, 6, 10.6, 6, 0.6, '#8a6a4a'); d.deco.line(6, 8, 10.6, 8, 0.6, '#8a6a4a'); d.deco.circ(8, 11, 1.2, '#e0b030', { unlit: true }); },
    repousse(d) { d.rect(5, 6, 6, 8, '#b8e0d0', { round: 0.4, shiny: true }); d.rect(6.4, 3, 3.2, 3, '#e0c060'); d.deco.rect(6, 9, 4, 3, '#4aa880'); },
    medoc(d) {
      d.rect(3, 4, 10, 9, '#f4f4f8', { round: 0.3, shiny: true });
      d.deco.rect(3, 4, 10, 3, '#d84a4a'); d.deco.rect(7, 8, 2, 4, '#d84a4a', { unlit: true }); d.deco.rect(6, 9, 4, 2, '#d84a4a', { unlit: true });
    },
    bandage(d) {
      d.ell(8, 9, 6, 4, '#f0e0c8', -0.5, { shiny: true });
      d.deco.ell(8, 9, 2.4, 1.6, '#e8c8a0', -0.5); for (let i = 0; i < 3; i++) d.deco.circ(5 + i * 3, 7 + i * 2, 0.5, '#c8a888');
    },
    reveil(d) {
      d.circ(8, 8, 6.5, '#c8d0e0', { shiny: true });
      d.deco.circ(8, 8, 4.5, '#a0e0ff'); d.deco.circ(6, 6, 2, '#ffe0f8'); d.deco.circ(8, 8, 1.4, '#3a4050', { unlit: true });
    },
    capsule(d) {
      d.ell(8, 8, 5, 6.2, '#3a8af0', 0, { shiny: true });
      d.deco.rect(2, 8, 12, 6.4, '#f0f2f8');
      d.deco.rect(2, 7.4, 12, 1.2, '#141428', { unlit: true });
      d.deco.circ(8, 8, 1.6, '#ffe060', { unlit: true });
    },
  };
  const MENU = {
    digimon(d) { d.ell(8, 9, 6, 5.5, '#f8a832'); d.eye(10, 8, 1.6, 2, '#2ea040'); d.deco.line(9, 12, 13, 11.6, 0.7, '#6a2600'); },
    sac(d) { d.blob([[3, 6], [13, 6], [14, 14], [2, 14]], '#c08a4a'); d.deco.rect(3, 8, 10, 1.4, '#8a5a2a'); d.tube([[5, 6], [8, 2], [11, 6]], 1.4, 1.4, '#8a5a2a'); },
    dex(d) { d.rect(3, 2, 10, 12, '#e04848', { round: 0.3 }); d.deco.rect(4, 3, 8, 4, '#a0e0ff'); d.deco.circ(6, 10, 1.4, '#ffd040', { unlit: true }); d.deco.circ(10, 10, 1, '#40ff80', { unlit: true }); },
    carte(d) { d.poly([[2, 4], [6, 2], [10, 4], [14, 2], [14, 12], [10, 14], [6, 12], [2, 14]], '#e8d8a8', { flat: true }); d.deco.curve([[4, 10], [7, 7], [10, 9], [12, 5]], 0.8, '#e04040', { unlit: true }); d.deco.circ(12, 5, 1.2, '#e04040', { unlit: true }); },
    sauver(d) { d.rect(2, 2, 12, 12, '#3a5ad0', { round: 0.25 }); d.deco.rect(5, 2, 6, 4, '#d0d8e8'); d.deco.rect(4, 9, 8, 5, '#f0f0f0'); },
    son(d) { d.rect(2, 6, 4, 4, '#c8d0e0'); d.poly([[6, 6], [10, 2], [10, 14], [6, 10]], '#c8d0e0'); d.deco.curve([[12, 5], [13.4, 8], [12, 11]], 0.9, '#ffffff', { unlit: true }); },
    evo(d) { d.curve([[4, 2], [12, 6], [4, 10], [12, 14]], 2, '#5ae0a0'); d.curve([[12, 2], [4, 6], [12, 10], [4, 14]], 2, '#5ab0ff'); d.deco.line(5, 6, 11, 6, 0.8, '#ffffff', { unlit: true }); d.deco.line(5, 10, 11, 10, 0.8, '#ffffff', { unlit: true }); },
    options(d) { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; d.circ(8 + Math.cos(a) * 5.4, 8 + Math.sin(a) * 5.4, 1.6, '#c8d0e0'); } d.circ(8, 8, 5, '#c8d0e0', { shiny: true }); d.deco.circ(8, 8, 2, '#30384a', { unlit: true }); },
    titre(d) { d.rect(2, 3, 12, 10, '#3a7ae8', { round: 0.3 }); d.deco.rect(4, 5, 8, 2, '#ffd040', { unlit: true }); d.deco.rect(4, 9, 8, 2, '#ffffff', { unlit: true }); },
    dormir(d) { d.ell(8, 9, 6, 6, '#f0d860', 0, { shiny: true }); d.deco.ell(10.4, 7.4, 4.6, 4.8, '#1a2440'); d.deco.rect(10, 2, 3, 1, '#ffffff', { unlit: true }); d.deco.rect(12, 4, 2, 1, '#ffffff', { unlit: true }); },
    cartes(d) { d.rect(2, 4, 8, 10, '#3a6ad8', { round: 0.2 }); d.rect(6, 2, 8, 10, '#f0c030', { round: 0.2, shiny: true }); d.deco.circ(10, 7, 1.6, '#e04848', { unlit: true }); },
    journal(d) { d.rect(3, 2, 10, 12, '#6a4a2a', { round: 0.15, shiny: true }); d.deco.rect(4.4, 3, 7.4, 10, '#f0e6c8'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; d.deco.rect(8 + Math.cos(a) * 2.6 - 0.6, 8 + Math.sin(a) * 2.6 - 0.6, 1.2, 1.2, '#2a2230'); } d.deco.circ(8, 8, 2, '#2a2230'); },
    retour(d) { d.circ(8, 8, 6, '#9aa4c0'); d.deco.line(5, 5, 11, 11, 1.4, '#30384a', { unlit: true }); d.deco.line(11, 5, 5, 11, 1.4, '#30384a', { unlit: true }); },
  };
  function chip(d, col) {
    d.rect(3, 3, 10, 10, '#2a3a2a', { round: 0.15 });
    for (let i = 0; i < 3; i++) { d.deco.rect(1.4, 4.4 + i * 3, 1.6, 1, '#d8c060'); d.deco.rect(13, 4.4 + i * 3, 1.6, 1, '#d8c060'); }
    d.deco.rect(5, 5, 6, 6, col); d.deco.rect(6, 6, 2, 2, '#ffffff', { unlit: true });
  }
  const cache = {};
  // familles d'objets (catalogue Digimon World 1) : un dessin par famille, à la couleur de l'objet
  const GENERIC = {
    potion: (d, c) => { d.rect(6, 2, 4, 3, '#c8c0b0'); d.blob([[4, 6], [12, 6], [13.4, 11], [11, 14.4], [5, 14.4], [2.6, 11]], c, { shiny: true }); d.deco.ell(6, 9, 1.4, 2.4, '#ffffff', 0, { unlit: true }); },
    disk: (d, c) => { d.rect(2.4, 2.4, 11.2, 11.2, c, { round: 0.12, shiny: true }); d.deco.rect(5, 2.4, 6, 4, '#d8dce8'); d.deco.rect(4.4, 9, 7.2, 4.6, '#f4f4f8'); },
    chip: (d, c) => chip(d, c),
    shield: (d, c) => { d.poly([[8, 1.6], [14, 4], [13, 10], [8, 14.6], [3, 10], [2, 4]], c, { shiny: true }); d.deco.poly([[8, 4], [11, 5.4], [10.4, 9.6], [8, 12], [5.6, 9.6], [5, 5.4]], '#ffffff'); },
    bandage: (d, c) => { d.rect(2, 5.4, 12, 5.2, c, { round: 0.4 }); d.deco.rect(6, 5.4, 4, 5.2, '#e8d8c8'); d.deco.circ(7, 7, 0.5, '#a89888', { unlit: true }); d.deco.circ(9, 9, 0.5, '#a89888', { unlit: true }); },
    pill: (d, c) => { d.tube([[4, 11], [12, 5]], 4, 4, '#f4f4f8', { shiny: true }); d.tube([[4, 11], [8, 8]], 4, 4, c, { shiny: true }); },
    tool: (d, c) => { d.ell(8, 9, 5.4, 5, c, 0, { shiny: true }); d.deco.circ(8, 9, 2, '#ffffff'); d.rect(7, 2, 2, 3, '#8a8a92'); },
    book: (d, c) => { d.rect(3, 2.4, 10, 11.6, c, { round: 0.15, shiny: true }); d.deco.rect(4.4, 3.4, 7.6, 9.6, '#f0e6c8'); d.deco.line(6, 6, 10.6, 6, 0.6, '#8a6a4a'); d.deco.line(6, 8, 10.6, 8, 0.6, '#8a6a4a'); },
    meat: (d, c) => { d.tube([[3, 13], [6, 10]], 1.6, 1.6, '#f4f0e0'); d.circ(3, 13.4, 1.4, '#f4f0e0'); d.ell(9.4, 7, 5, 4.4, c, -0.6, { shiny: true }); d.deco.ell(8, 5.6, 1.6, 1, '#ffd0b0', -0.6); },
    mush: (d, c) => { d.rect(6.4, 8, 3.2, 6, '#f0e6d0'); d.ell(8, 7.4, 6, 4, c, 0, { shiny: true }); d.deco.circ(5.4, 6.6, 1, '#ffffff'); d.deco.circ(9.6, 5.6, 1.1, '#ffffff'); },
    veg: (d, c) => { d.poly([[5, 4], [11, 4], [8, 15]], c, { shiny: true }); d.ell(6.4, 2.6, 1.4, 2.6, '#4ab048', -0.4); d.ell(9.6, 2.6, 1.4, 2.6, '#4ab048', 0.4); },
    fruit: (d, c) => { d.circ(8, 9.4, 5, c, { shiny: true }); d.deco.ell(6, 7.4, 1.6, 1.2, '#ffffff', 0, { unlit: true }); d.tube([[8, 5], [9, 2]], 0.8, 0.6, '#6a4a2a'); d.ell(11, 3.4, 2.4, 1.2, '#4ab048', -0.4); },
    fish: (d, c) => { d.ell(7.6, 8, 5.4, 3.2, c, 0, { shiny: true }); d.poly([[12, 8], [15, 5], [15, 11]], c); d.deco.circ(4.6, 7.4, 0.9, '#1a1a22', { unlit: true }); },
    bread: (d, c) => { d.ell(8, 9.4, 6.4, 3.8, c, -0.2, { shiny: true }); for (let k = 0; k < 3; k++) d.deco.line(4.6 + k * 3, 7.2 + k * 0.4, 6.4 + k * 3, 10.4 + k * 0.4, 0.7, '#8a5224'); },
    cake: (d, c) => { d.rect(3, 8, 10, 5.6, '#f4e0c8', { round: 0.2, shiny: true }); d.rect(3, 6, 10, 2.8, c, { round: 0.3 }); d.circ(8, 5, 1.4, '#e03a4a', { shiny: true }); },
    jar: (d, c) => { d.rect(4, 5, 8, 9, c, { round: 0.3, shiny: true }); d.rect(3.4, 3, 9.2, 2.6, '#c8a060', { round: 0.3 }); d.deco.rect(5, 8, 6, 3, '#ffffff'); },
    bowl: (d, c) => { d.ell(8, 8, 6.4, 2.6, c, 0, { shiny: true }); d.poly([[1.6, 8], [14.4, 8], [12, 13.4], [4, 13.4]], '#f4f0e8', { shiny: true }); d.deco.rect(4, 11, 8, 1, '#4a8ad0'); d.deco.ell(6, 7, 1.6, 0.8, '#ffffff', 0, { unlit: true }); },
    evo: (d, c) => { d.poly([[8, 1], [10.4, 6], [15, 8], [10.4, 10], [8, 15], [5.6, 10], [1, 8], [5.6, 6]], c, { shiny: true }); d.deco.circ(8, 8, 2.2, '#ffffff', { unlit: true }); },
  };
  const make = (set, id) => {
    const k = (set === ITEM ? 'i_' : 'm_') + id;
    if (!cache[k]) {
      const gen = set === ITEM && !set[id] && DW.ITEMS[id] && DW.ITEMS[id].icon;   // icône générique par famille (data/items.js)
      cache[k] = Art.render(gen ? d => GENERIC[gen[0]](d, gen[1]) : set[id] || ITEM.capsule, 16, 16, { silhouettes: false, dither: 0.04 }).img;
    }
    return cache[k];
  };
  DW.Icons = { item: id => make(ITEM, id), menu: id => make(MENU, id) };
})();
