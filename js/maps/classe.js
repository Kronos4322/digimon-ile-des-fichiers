'use strict';
// =====================================================================
//  SALLE DE CLASSE (Terrain d'entraînement) — poste d'Intelligence, et techniques apprises en étudiant
//  On y entre par la petite école du Terrain d'entraînement. Le poste « Étude » (panneau à l'œil, devant le tableau)
//  entraîne l'Intelligence ; après chaque séance, le partenaire peut retenir une des 50 techniques
//  de data/techniques_classe.js : de son élément (ou Neutre), dans la limite de son Intelligence entraînée.
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const room = DW.Palais.room('classe', 'village', { name: "Salle de classe", w: 16, h: 12, music: 'village',
    floor: { type: 'herring', cols: ['#d8b070', '#b88e52', '#7a5a34'] }, wall: { base: '#f0e6c8', alt: '#e0d4b0', pattern: 'stripes', wood: '#8a5a32' },
    objects: [
      { kind: 'tableau', x: 6, y: 1, w: 3, h: 2, back: true },
      { kind: 'stationsign', v: 4, x: 7, y: 4, w: 1, h: 1, small: true },
      { kind: 'bookshelf', v: 0, x: 1, y: 3, w: 2, h: 1 }, { kind: 'bookshelf', v: 1, x: 13, y: 3, w: 2, h: 1 },
      ...[[3, 6], [6, 6], [9, 6], [12, 6], [3, 8], [6, 8], [9, 8], [12, 8]].map(([x, y], i) => ({ kind: 'pupitre', v: i % 2, x, y, w: 1, h: 1, small: true })),
      { kind: 'bigplant', x: 14, y: 9, w: 1, h: 1, small: true }, { kind: 'clock', x: 11, y: 1, w: 1, h: 1, back: true },
    ] });
  room.calm = true;
  DW.Palais.entrance('classe');
  for (const w of room.warps) if (w.to === '?') Object.assign(w, { to: 'gym', tx: 22, ty: 5 });
  room.signs['6,2'] = room.signs['7,2'] = room.signs['8,2'] = "Au tableau : « Leçon du jour — Plus un Digimon étudie, plus il retient de techniques. Chaque élément a les siennes ! »";

  // ------------------------------------------------------------ apprendre une technique en étudiant
  const Classe = DW.Classe = {
    // techniques que ce Digimon peut encore apprendre en classe (son élément ou Neutre, assez d'Intelligence)
    pool(m) {
      const int = (m.tr && m.tr.int) || 0;
      return DW.CLASS_MOVES.filter(id => { const mv = DW.MOVES[id]; return !m.knows(id) && mv.classe <= int && (mv.type === 'Neutre' || m.d.types.includes(mv.type)); });
    },
    // après une séance d'Intelligence (score 0 à 6) : une chance d'apprendre une technique au hasard
    async after(m, score) {
      const pool = Classe.pool(m);
      if (!pool.length || !score) return;
      if (Math.random() >= 0.2 + score * 0.09) return;   // de 29 % (séance ratée de peu) à 74 % (parfaite)
      const id = DW.pick(pool);
      DW.Audio.sfx('buff');
      await say(`${m.name} a bien écouté la leçon... Une nouvelle technique lui vient à l'esprit : ${DW.MOVES[id].name} !`);
      await DW.learnMove(m, id);
    },
  };
})();
