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
      { kind: 'stationsign', v: 4, x: 7, y: 4, w: 2, h: 1, small: true },   // (w: 2 : solide sur toute sa largeur)
      { kind: 'bookshelf', v: 0, x: 1, y: 3, w: 2, h: 1 }, { kind: 'bookshelf', v: 1, x: 13, y: 3, w: 2, h: 1 },
      ...[[3, 6], [6, 6], [9, 6], [12, 6], [3, 8], [6, 8], [9, 8], [12, 8]].map(([x, y], i) => ({ kind: 'pupitre', v: i % 2, x, y, w: 1, h: 1, small: true })),
      { kind: 'bigplant', x: 14, y: 9, w: 1, h: 1, small: true }, { kind: 'clock', x: 11, y: 1, w: 1, h: 1, back: true },
      // matériel d'étude (images du joueur, dossier SPORT) : tableau de mémoire, longue-vue, blocs de formes
      { kind: 'tableaumemoire', x: 3, y: 2, w: 1, h: 1, small: true }, { kind: 'telescope', x: 14, y: 6, w: 1, h: 1, small: true }, { kind: 'formes', x: 1, y: 7, w: 1, h: 1, small: true },
    ] });
  room.calm = true;
  // le poste d'Intelligence de la salle s'appelle « Étude » (et non « Méditation », le nom de la stat : game/training.js, poste)
  room.postes = { int: { nom: 'Étude', desc: 'Étudier la leçon du tableau : bien se concentrer, et tout retenir.' } };
  DW.Palais.entrance('classe');
  for (const w of room.warps) if (w.to === '?') Object.assign(w, { to: 'gym', tx: 22, ty: 5 });
  // (textes posés sur la vraie place des objets : une pièce ne pose rien au-dessus de sa 3e rangée, maps/palais.js — le
  //  tableau de mémoire, prévu en y 2, est en y 3, et son texte en 3,2 tombait dans le mur, illisible)
  const sur = kind => { const o = room.objects.find(q => q.kind === kind); return o ? o.x + ',' + o.y : null; };
  room.signs[sur('tableaumemoire')] = "Un tableau de mémoire : des symboles à retenir, puis à retrouver. Ça muscle l'esprit !";
  room.signs[sur('telescope')] = 'Une longue-vue tournée vers la fenêtre. Observer le ciel et compter les étoiles, voilà une bonne leçon.';
  room.signs[sur('formes')] = 'Des blocs de formes à ranger dans leurs trous : rond, triangle, carré. Les Bébés adorent.';
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
