'use strict';
// =====================================================================
//  COLLABORATIONS : des habitants qui travaillent ENSEMBLE au même endroit débloquent une amélioration.
//  Quand les deux sont installés en ville, le second rejoint le lieu du premier (on le voit sur place)
//  et l'amélioration est annoncée à l'arrivée en ville.
//    Comptoir du Bazar   (Gotsumon + Kunemon)  : prix du Bazar -15 %
//    Salle de musculation (Elecmon + Gotsumon) : +1 point par séance d'entraînement
//    Serre des Champs     (Palmon + Yokomon)   : récolte quotidienne doublée
//    Bains de la fontaine (Betamon + Gomamon)  : la fontaine efface aussi la fatigue
// =====================================================================
(function () {
  const LIST = [
    { id: 'comptoir', a: 'gotsumon', b: 'kunemon', name: 'Comptoir du Bazar', at: 'gotsumon', txt: 'Gotsumon et Kunemon tiennent le Bazar ensemble : tous les prix baissent de 15 % !' },
    { id: 'muscu', a: 'elecmon', b: 'gotsumon', name: 'Salle de musculation', at: 'elecmon', txt: "Gotsumon a taillé des haltères de pierre pour le Dojo d'Elecmon : chaque séance d'entraînement rapporte +1 point !" },
    { id: 'serre', a: 'palmon', b: 'yokomon', name: 'Serre des Champs', at: 'champs', txt: 'Yokomon aide Palmon à cultiver : la récolte quotidienne est doublée !' },
    { id: 'bains', a: 'betamon', b: 'gomamon', name: 'Bains de la fontaine', at: 'fontaine', txt: "Gomamon réchauffe l'eau de la fontaine : elle efface aussi la fatigue de tes Digimon !" },
  ];
  DW.Collab = {
    LIST,
    on(id) { const c = LIST.find(x => x.id === id); return !!c && DW.Town.has(c.a) && DW.Town.has(c.b); },
    priceMult() { return this.on('comptoir') ? 0.85 : 1; },
    // nouvelles collaborations (annoncées une seule fois, à l'arrivée en ville)
    async announce() {
      const st = DW.state, seen = st.collabs = st.collabs || {};
      for (const c of LIST) {
        if (!this.on(c.id) || seen[c.id]) continue;
        seen[c.id] = true;
        DW.Audio.sfx('levelup');
        await DW.say(`TRAVAIL D'ÉQUIPE : ${DW.SPECIES[c.a].name} et ${DW.SPECIES[c.b].name} s'associent — « ${c.name} » !`);
        await DW.say(c.txt);
      }
    },
    // le second habitant de chaque collaboration se tient sur place (ville : près du bâtiment, en coordonnées d'origine)
    place(m, spots) {
      for (const c of LIST) {
        const p = spots[c.at];
        if (!this.on(c.id) || !p) continue;
        m.npcs.push({ sp: c.b, x: p[0], y: p[1], face: 'left', wander: 1, talk: async () => { await DW.say(c.txt, DW.SPECIES[c.b].name); } });
      }
    },
  };
})();
