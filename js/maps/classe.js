'use strict';
// =====================================================================
//  SALLE DE CLASSE (Terrain d'entraînement) — poste d'Intelligence, et techniques apprises en étudiant
//  On y entre par la petite école du Terrain d'entraînement. Le poste « Étude » (panneau à l'œil, devant le tableau)
//  entraîne l'Intelligence ; après chaque séance, le partenaire peut retenir une des 50 techniques
//  de data/techniques_classe.js : de son élément (ou Neutre), dans la limite de son Intelligence entraînée.
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  // SALLE RANGÉE (règle du joueur : aucun meuble ne dépasse du mur ni de la pièce, aucun ne chevauche un autre) : 18 × 13
  // cases, sol de x 1 à 16 et de y 3 à 11 (une pièce ne pose rien plus bas que y 10 : maps/palais.js), mur du fond en
  // y 1-2. Chaque meuble a l'emprise de son dessin (w), donc il bloque sur toute sa largeur. Mesures des dessins (pixels
  // du jeu, 16 par case) : tableau de mémoire et longue-vue 56 de haut (posés sur le sol devant le mur, en y 4 et plus : en
  // y 3, contre le mur, ils dépassaient au-dessus), bibliothèques 47 de haut contre le mur (y 3), horloge 40.
  const room = DW.Palais.room('classe', 'village', { name: "Salle de classe", w: 18, h: 13, music: 'village',
    floor: { type: 'herring', cols: ['#d8b070', '#b88e52', '#7a5a34'] }, wall: { base: '#f0e6c8', alt: '#e0d4b0', pattern: 'stripes', wood: '#8a5a32' },
    objects: [
      // au mur du fond : le tableau au milieu (dans l'axe de la porte), les bibliothèques aux deux coins, l'horloge debout
      { kind: 'tableau', x: 7, y: 1, w: 4, h: 2, back: true },
      { kind: 'bookshelf', v: 0, x: 1, y: 3, w: 2, h: 1 }, { kind: 'bookshelf', v: 1, x: 15, y: 3, w: 2, h: 1 },
      { kind: 'clock', x: 12, y: 3, w: 1, h: 1 },
      // le poste « Étude » (panneau à l'œil) devant le tableau, une rangée plus bas que lui (sinon son cadre mordait sur le
      // rebord du tableau)
      { kind: 'stationsign', v: 4, x: 8, y: 5, w: 2, h: 1, small: true },
      // deux rangées de quatre pupitres, une allée au milieu (de la porte au tableau)
      ...[[4, 7], [6, 7], [11, 7], [13, 7], [4, 9], [6, 9], [11, 9], [13, 9]].map(([x, y], i) => ({ kind: 'pupitre', v: i % 2, x, y, w: 1, h: 1, small: true })),
      // matériel d'étude (images du joueur, dossier SPORT) : le tableau de mémoire entre la bibliothèque et le tableau, les
      // blocs de formes et la longue-vue le long des côtés (entre les pupitres et le bord), la grande plante dans un coin
      { kind: 'tableaumemoire', x: 3, y: 4, w: 3, h: 1, small: true },
      { kind: 'formes', x: 1, y: 8, w: 3, h: 1, small: true }, { kind: 'telescope', x: 14, y: 8, w: 3, h: 1, small: true },
      { kind: 'bigplant', x: 15, y: 10, w: 2, h: 1, small: true },
    ] });
  room.calm = true;
  // le poste d'Intelligence de la salle s'appelle « Étude » (et non « Méditation », le nom de la stat : game/training.js, poste)
  room.postes = { int: { nom: 'Étude', desc: 'Étudier la leçon du tableau : bien se concentrer, et tout retenir.' } };
  DW.Palais.entrance('classe');   // (la porte : x 8-9, en bas ; le Terrain d'entraînement y arrive en 8, 11 : maps/gym.js)
  for (const w of room.warps) if (w.to === '?') Object.assign(w, { to: 'gym', tx: 22, ty: 5 });
  // textes posés sur chaque case de l'objet (on peut lui parler de n'importe quel côté)
  const texte = (kind, t) => { const o = room.objects.find(q => q.kind === kind); if (o) for (let x = o.x; x < o.x + o.w; x++) room.signs[x + ',' + o.y] = t; };
  texte('tableaumemoire', "Un tableau de mémoire : des symboles à retenir, puis à retrouver. Ça muscle l'esprit !");
  texte('telescope', 'Une longue-vue tournée vers la fenêtre. Observer le ciel et compter les étoiles, voilà une bonne leçon.');
  texte('formes', 'Des blocs de formes à ranger dans leurs trous : rond, triangle, carré. Les Bébés adorent.');
  for (let x = 7; x <= 10; x++) room.signs[x + ',2'] = "Au tableau : « Leçon du jour — Plus un Digimon étudie, plus il retient de techniques. Chaque élément a les siennes ! »";

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
