'use strict';
// =====================================================================
//  RECONSTRUCTION DE LA VILLE (comme la Ville des Fichiers de Digimon World)
//  Des Digimon recrutés dans les zones viennent s'installer en ville :
//  chacun construit un bâtiment utile et la ville gagne un niveau.
// =====================================================================
(function () {
  const RECRUITS = [
    { id: 'gotsumon', building: 'Bazar', zone: 'plage', role: 'Ouvre une boutique : Viandes, Remèdes, Disques Réveil.' },
    { id: 'betamon', building: 'Fontaine', zone: 'geants', role: 'Remet la fontaine en eau : elle soigne tes Digimon.' },
    { id: 'elecmon', building: 'Dojo', zone: 'sentier', role: 'Entraînements plus efficaces (+1 point par séance).' },
    { id: 'mushroomon', building: 'Restaurant', zone: 'prairie', role: 'Repas qui rendent heureux et effacent la fatigue.' },
    { id: 'yokomon', building: 'Jardin', zone: 'clairiere', role: 'Le Jardin abrite la DigiFerme (Digimon en réserve).' },
    { id: 'palmon', building: 'Grange', zone: 'geants', district: 'champs', role: 'Palmon cultive les champs : passe chaque jour récolter de la nourriture.' },
    { id: 'biyomon', building: 'Poste', zone: 'lisiere', role: 'Biyomon distribue le courrier et sait où se cachent les Digimon errants.' },
    { id: 'kunemon', building: 'Banque', zone: 'prairie', role: 'Kunemon garde tes objets en trop dans la Banque : dépose-les et reprends-les quand tu veux.' },
    { id: 'gomamon', building: 'Ponton de pêche', zone: 'plage', district: 'champs', role: "Gomamon t'apprend à pêcher dans l'étang des Champs." },
  ];
  // un niveau par habitant ; les derniers paliers viendront avec les futurs quartiers
  const LEVELS = ['Ruines', 'Campement', 'Hameau', 'Petit village', 'Village', 'Bourg', 'Petite ville', 'Ville', 'Grande ville', 'Cité', 'Métropole', 'Mégapole'];

  const Town = DW.Town = {
    RECRUITS,
    get st() { return DW.state; },
    has(id) { return !!(this.st.recruits && this.st.recruits[id]); },
    level() { return RECRUITS.filter(r => this.has(r.id)).length; },
    LEVELS,
    levelName() { return LEVELS[Math.min(LEVELS.length - 1, this.level())]; },
    nextName() { return LEVELS[Math.min(LEVELS.length - 1, this.level() + 1)]; },
    info(id) { return RECRUITS.find(r => r.id === id); },
    // à l'arrivée en ville : découverte des nouveaux bâtiments
    async reveal() {
      const st = this.st, news = st.townNews || [];
      if (!news.length) return;
      st.townNews = [];
      await DW.wait(0.4);
      DW.Audio.play('victory');
      for (const id of news) {
        const r = this.info(id);
        if (!r.building) { await DW.say(`${DW.SPECIES[id].name} s'est installé en ville !`); await DW.say(r.role); continue; }
        const where = r.district ? ` (${DW.MAPS[r.district].name})` : '';
        await DW.say(`${DW.SPECIES[id].name} s'est installé en ville : voici ${/^[AEIOUÉ]/.test(r.building) ? "l'" : ['Grange', 'Poste', 'Fontaine', 'Banque'].includes(r.building) ? 'la ' : 'le '}${r.building}${where} !`);
        await DW.say(r.role);
      }
      await DW.say(`La ville passe au niveau ${this.level()} : « ${this.levelName()} ».`);
      DW.Audio.play('village');
      DW.autosave();
    },
    async recruit(id) {
      const st = this.st, r = this.info(id), name = DW.SPECIES[id].name;
      st.recruits = st.recruits || {};
      st.recruits[id] = true;
      st.seen[id] = true;
      DW.Audio.play('victory');
      await DW.say(`${name} part s'installer à la Ville des Fichiers !`);
      await DW.say("Il s'y passe sûrement quelque chose... Va voir ce qui a changé en ville !");
      st.townNews = (st.townNews || []).concat([id]);
      DW.autosave();
    },
  };
})();

