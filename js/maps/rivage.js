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
  const { forestGen, zoomGen, zoomMap, say } = DW.MapKit;
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
    rows: forestGen(zoomGen({ w: 40, h: 30, seed: 41, autoTall: 0.5, deco: 0.8, landmarks: [['{', 3]],
      clearings: [{ x: 20, y: 16, rx: 15, ry: 10 }, { x: 8, y: 8, rx: 5, ry: 4 }],
      paths: [{ pts: [[41, 13.5], [30, 14], [22, 17], [12, 15], [6, 9]], r: 1.6 }, { pts: [[20, 16], [20, 6], [20, -1]], r: 1.4 }],
      lakes: [{ x: 30, y: 22, rx: 4.5, ry: 2.6 }],
      tall: [{ x: 14, y: 21, r: 4 }, { x: 28, y: 9, r: 3.5 }],
      free: [[36, 13, 3], [20, 3, 3]],
      set: [[34, 12, 'S']],
    })).map((r, y) => [...r].map((ch, x) => {
      // des DUNES : le sable domine (herbe des dunes en touffes), plus de phares au milieu de l'herbe
      if (ch === '{') return '6';
      const n = DW.Art.fbm(x * 0.09, y * 0.09, 417);
      if (ch === '.' || ch === 'f') return n > 0.38 ? 's' : ch;
      if (ch === ',') return n > 0.38 ? ';' : ch;
      return ch;
    }).join('')),
    warps: [
      { x: 39, y: 13, w: 1, h: 2, dir: 'right', to: 'plage', tx: 0, ty: 2 },
      { x: 19, y: 0, w: 3, h: 1, dir: 'up', to: 'bosquet', tx: 19, ty: 29 },
    ],
    npcs: [], triggers: [],
    signs: { '34,12': "Dunes des Bébés. Les tout petits Digimon viennent jouer dans les herbes. Idéal pour un partenaire qui vient de naître !  Nord : Bosquet des Pousses." },
  };
  // ------------------------------------------------------------ BOSQUET DES POUSSES (40×30, agrandi ×2)
  MAPS.bosquet = {
    name: 'Bosquet des Pousses', music: 'forest', bg: 'foret', ambient: 'forest', theme: 'meadow', climate: 'forest', region: 'plage', rate: 0.14, wildN: 10,
    rows: forestGen(zoomGen({ w: 40, h: 30, seed: 42, autoTall: 0.48, deco: 1, landmarks: [['}', 3], ['>', 2]],
      clearings: [{ x: 20, y: 15, rx: 13, ry: 9 }, { x: 31, y: 8, rx: 5, ry: 4 }, { x: 9, y: 22, rx: 5, ry: 4 }],
      paths: [{ pts: [[20, 31], [20, 22], [16, 15], [22, 9], [31, 8]], r: 1.5 }, { pts: [[16, 15], [9, 22]], r: 1.3, dirt: false }],
      tall: [{ x: 27, y: 18, r: 4 }, { x: 10, y: 11, r: 3.5 }],
      bigtrees: [[30, 22]],
      free: [[20, 27, 3]],
      set: [[21, 25, 'S']],
    })),
    warps: [{ x: 19, y: 29, w: 3, h: 1, dir: 'down', to: 'dunes', tx: 19, ty: 0 }],
    npcs: [], triggers: [],
    signs: { '21,25': "Bosquet des Pousses. Les jeunes Digimon (stade Entraînement) s'y bagarrent toute la journée. Ici, on devient plus fort !" },
  };
  // agrandies ×2 comme les autres cartes faites à la main (plan d'origine 40×30)
  DW.MapKit.ZOOM.dunes = [2, 40, 30]; DW.MapKit.ZOOM.bosquet = [2, 40, 30];
  zoomMap(MAPS.dunes, 'dunes', { rows: false }); zoomMap(MAPS.bosquet, 'bosquet', { rows: false });
  // bord ouest de l'île : les dunes descendent vers la mer (ouest et sud), le bosquet domine l'océan du haut d'une falaise
  { const near = M => { const pts = [...(M.warps || []).flatMap(w => { const a = []; for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) a.push([x, y]); return a; }), ...Object.keys(M.signs || {}).map(k => k.split(',').map(Number))];
      return (x, y) => pts.some(([px, py]) => Math.abs(px - x) < 4 && Math.abs(py - y) < 4); };
    MAPS.dunes.rows = DW.MapKit.coast(MAPS.dunes.rows, { left: 'beach', down: 'beach' }, { seed: 41, sea: 11, keep: near(MAPS.dunes) });
    MAPS.bosquet.rows = DW.MapKit.coast(MAPS.bosquet.rows, { left: 'cliff' }, { seed: 42, sea: 10, keep: near(MAPS.bosquet) }); }

  // la plage s'ouvre vers les dunes (haut de la falaise, à l'ouest)
  MAPS.plage.warps.push({ x: 0, y: 4, w: 1, h: 4, dir: 'left', to: 'dunes', tx: 39, ty: 13 });   // (plage déjà agrandie : coordonnées ×2 ; l'arrivée est convertie)
  { const P = MAPS.plage, g = P.rows.map(r => [...r]);
    for (let y = 4; y < 8; y++) for (let x = 0; x < 18; x++) if ('T#bk'.includes(g[y][x])) g[y][x] = x % 7 === 3 && y === 4 ? g[y][x] : '.';
    for (let y = 4; y < 8; y++) for (let x = 0; x < 34; x++) if (Math.abs(y - 5.5) < 1.2 && g[y][x] === '.') g[y][x] = '=';
    P.rows = g.map(r => r.join('')); }

  // ------------------------------------------------------------ difficulté par stade
  for (const id in STAGES) if (MAPS[id]) MAPS[id].encounters = STAGES[id];
  DW.FIRST_ZONES = STAGES;
})();
