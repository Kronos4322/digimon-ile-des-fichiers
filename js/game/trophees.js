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
