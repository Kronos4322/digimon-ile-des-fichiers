'use strict';
// =====================================================================
//  RECONSTRUCTION DE LA VILLE (comme la Ville des Fichiers de Digimon World)
//  Des Digimon recrutés dans les zones viennent s'installer en ville :
//  chacun construit un bâtiment utile. La ville progresse en POURCENTAGE de développement
//  (habitants +7 % chacun, trophées de boss +2 % chacun jusqu'à 20 %, Digimon collectionnés jusqu'à 17 %) ;
//  les niveaux habituels (Ruines → Mégapole) arrivent à des paliers de ce pourcentage.
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
  const LEVELS = ['Ruines', 'Campement', 'Hameau', 'Petit village', 'Village', 'Bourg', 'Petite ville', 'Ville', 'Grande ville', 'Cité', 'Métropole', 'Mégapole'];

  const Town = DW.Town = {
    RECRUITS,
    get st() { return DW.state; },
    has(id) { return !!(this.st.recruits && this.st.recruits[id]); },
    // développement de la ville (0 à 100 %)
    progress() {
      const st = this.st, rec = RECRUITS.filter(r => this.has(r.id)).length * 7;
      const troph = Math.min(20, (DW.Trophies && DW.Trophies.count ? DW.Trophies.count() : 0) * 2);
      const all = DW.DEX_ORDER ? DW.DEX_ORDER.length : 1, owned = st && st.owned ? Object.keys(st.owned).filter(k => st.owned[k]).length : 0;
      return Math.min(100, Math.floor(rec + troph + Math.min(17, owned / all * 17)));
    },
    STEPS: [0, 5, 12, 20, 30, 40, 50, 60, 70, 80, 90, 100],   // pourcentage requis pour chaque niveau
    level() { const p = this.progress(); let l = 0; while (l + 1 < this.STEPS.length && p >= this.STEPS[l + 1]) l++; return l; },
    // texte court : « 23 % · niveau 3 (Petit village) »
    label() { return `${this.progress()} % · niveau ${this.level()} « ${this.levelName()} »`; },
    LEVELS,
    levelName() { return LEVELS[Math.min(LEVELS.length - 1, this.level())]; },
    nextName() { return LEVELS[Math.min(LEVELS.length - 1, this.level() + 1)]; },
    info(id) { return RECRUITS.find(r => r.id === id); },
    // à l'arrivée en ville : découverte des nouveaux bâtiments
    async reveal() {
      const st = this.st, news = st.townNews || [], lv0 = st.townLevelSeen != null ? st.townLevelSeen : this.level();
      if (!news.length) return;
      st.townNews = [];
      await DW.wait(0.4);
      DW.Audio.play('victory');
      for (const id of news) {
        const r = this.info(id);
        if (!r.building) { await DW.say(`${DW.SPECIES[id].name} s'est installé en ville !`); await DW.say(r.role); continue; }
        const where = r.district ? ` (${DW.MAPS[r.district].name})` : '';
        const art = /^[AEIOUÉ]/.test(r.building) ? "l'" : ['Grange', 'Poste', 'Fontaine', 'Banque'].includes(r.building) ? 'la ' : 'le ';
        await DW.say(`${DW.SPECIES[id].name} s'est installé en ville : voici ${art}${r.building}${where} !`);
        await DW.say(r.role);
      }
      const lv = this.level();
      await DW.say(`Développement de la ville : ${this.progress()} %.${lv > lv0 ? ` Elle passe au niveau ${lv} : « ${this.levelName()} » !` : ` Prochain niveau (« ${this.nextName()} ») à ${this.STEPS[Math.min(this.STEPS.length - 1, lv + 1)]} %.`}`);
      st.townLevelSeen = lv;
      if (DW.Collab) await DW.Collab.announce();   // habitants qui s'associent (game/collab.js)
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

