'use strict';
// =====================================================================
//  RÈGLES DIGIMON WORLD 1 (au choix en début de partie, ou dans les Options)
//  - Digivolution selon l'âge : quand l'âge du stade est atteint, le Digimon
//    digivolue tout seul vers la meilleure forme dont il remplit les
//    conditions. Un bébé finit toujours par grandir ; un Disciple négligé
//    trop longtemps devient Numemon.
//  - Un seul partenaire : l'équipe est limitée à 1 Digimon, les autres
//    vont à la DigiFerme.
// =====================================================================
(function () {
  // heures de jeu passées dans un stade avant de digivoluer
  const WINDOW = { 'Bébé': 6, 'Entraînement': 24, Disciple: 72, Champion: 144, Ultime: 240 };
  const BAD = ['numemon', 'sukamon'];
  const score = o => (o.lvl || 0) + Object.entries(o.req || {}).reduce((a, [k, v]) => a + (['mistakes', 'mistakesMax', 'fatMax', 'fatMin'].includes(k) ? 0 : v), 0);

  const AutoEvo = DW.AutoEvo = {
    WINDOW,
    on: () => !!(DW.state.flags && DW.state.flags.autoEvo),
    // heures restantes avant la prochaine Digivolution (null : stade final)
    hoursLeft(m) {
      const w = WINDOW[m.d.stage];
      if (w == null || !DW.Evo.options(m.sp).length) return null;
      return w - (DW.state.clock - (m.evoAt != null ? m.evoAt : m.born)) / 60;
    },
    // forme choisie quand l'heure est venue (null : rien pour l'instant)
    pick(m) {
      const left = AutoEvo.hoursLeft(m);
      if (left == null || left > 0) return null;
      const opts = DW.Evo.available(m);
      if (opts.length) return opts.slice().sort((a, b) => score(b) - score(a))[0].to;
      const st = m.d.stage, all = DW.Evo.options(m.sp);
      if ((st === 'Bébé' || st === 'Entraînement') && left <= -12) { const o = all.find(o => !BAD.includes(o.to)); return o ? o.to : null; }
      if (st === 'Disciple' && left <= -48) { const o = all.find(o => o.to === 'numemon'); return o ? o.to : null; }
      return null;
    },
    // appelé par Life.update
    check(ow) {
      if (!AutoEvo.on() || ow.locked || DW.Game.top() !== ow) return;
      const m = DW.state.party.find(p => p.hp > 0 && AutoEvo.pick(p));
      if (!m) return;
      const to = AutoEvo.pick(m);
      ow.runScript(async () => {
        const st = DW.state;
        await DW.say(`${m.name} se met à briller... Il a assez grandi : il digivolue !`);
        await DW.Game.push(new DW.EvolutionScene(m, to, { manual: true }));
        m.evolve(to);
        st.seen[to] = st.caught[to] = true;
        await DW.learnEvoMoves(m);
        DW.autosave();
      });
    },
  };

  // ------------------------------------------------------------ taille de l'équipe
  DW.partyMax = () => (DW.state.flags && DW.state.flags.solo ? 1 : 6);
  // applique la limite (les Digimon en trop vont à la DigiFerme)
  DW.applyPartyMax = () => {
    const st = DW.state, max = DW.partyMax();
    if (st.party.length <= max) return 0;
    const extra = st.party.splice(max);
    st.box.push(...extra);
    return extra.length;
  };
  // choix en début de partie (après le réveil chez Jijimon)
  DW.chooseRules = async () => {
    const st = DW.state;
    await DW.say("Dis-moi, mon enfant... Comment veux-tu vivre ton aventure ?", 'Jijimon');
    const r = await DW.choose(['Règles classiques', 'Règles Digimon World 1', 'Expliquer'], { y: 30 });
    if (r === 2) {
      await DW.say("Classiques : tu choisis toi-même quand digivoluer (table des Digivolutions) et tu peux garder 6 Digimon avec toi.");
      await DW.say("Digimon World 1 : ton Digimon digivolue tout seul en grandissant, selon son âge et son entraînement, et tu n'as qu'un seul partenaire à la fois.");
      await DW.say('Tu pourras changer ces règles plus tard dans les Options.');
      return DW.chooseRules();
    }
    st.flags.autoEvo = r === 1; st.flags.solo = r === 1;
    await DW.say(r === 1 ? 'Les règles de Digimon World 1 ! Prends bien soin de ton partenaire : il grandira à son rythme.' : 'Très bien ! Tu décideras toi-même des Digivolutions de tes Digimon.', 'Jijimon');
  };
})();
