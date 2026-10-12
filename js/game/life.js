'use strict';
// =====================================================================
//  VIE DU DIGIMON (comme Digimon World 1)
//  - DURÉE DE VIE : ~16 jours de jeu (+2 par renaissance, -½ par erreur de soin, +2 si très heureux).
//    Au bout, le Digimon redevient un DigiŒuf et renaît en bébé de sa lignée (il garde ses techniques,
//    ses victoires, la moitié de son entraînement, et ses données innées se renforcent).
//  - ERREURS DE SOIN : faim ignorée, accident, nuit blanche, maladie ou blessure non soignée.
//    Trop d'erreurs ferment les « bonnes » Digivolutions et ouvrent Numemon / Sukamon.
//  - CORPULENCE (-10 maigre … +10 gros) : manger fait grossir, l'entraînement et les combats affinent.
//  - DISCIPLINE (0-100) : après une bêtise ou un exploit, parle à ton partenaire pour le féliciter
//    ou le gronder. Mal discipliné, il désobéit parfois en combat.
//  - SOMMEIL : il a sommeil à partir de 21 h (Menu → DORMIR). Sans dodo à 2 h, il s'écroule (erreur).
//  - MALADIE / BLESSURE : soignées par Médicament / Bandage (ou une nuit chez Jijimon).
// =====================================================================
(function () {
  const { Audio } = DW;
  const LIFESPAN = 16, BED = 21, LATE = 2, WAKE = 7;

  const Life = DW.Life = {
    pending: null, // moment éducatif en attente : { type: 'bad' | 'good', why, until }
    // valeurs par défaut des nouveaux champs (anciennes sauvegardes)
    init(m) {
      if (m.mistakes == null) m.mistakes = 0;
      if (m.disc == null) m.disc = 40;
      if (m.fat == null) m.fat = 0;
      if (m.lives == null) m.lives = 0;
      if (m.lifespan == null) m.lifespan = LIFESPAN;
      if (m.slept == null) m.slept = DW.state ? DW.state.clock : 0;
      return m;
    },
    daysLeft: m => Math.max(0, Math.ceil(m.lifespan - m.age)),
    fatLabel: m => (m.fat <= -6 ? 'Maigre' : m.fat <= -3 ? 'Mince' : m.fat < 3 ? 'Normal' : m.fat < 6 ? 'Enrobé' : 'Gros'),
    mistake(m, why) {
      Life.init(m);
      m.mistakes++; m.lifespan = Math.max(6, m.lifespan - 0.5);
      DW.Care.toast(`Erreur de soin : ${why} (${m.mistakes})`, '#ffb070');
    },
    addFat(m, n) { Life.init(m); m.fat = DW.clamp(m.fat + n, -10, 10); },
    addDisc(m, n) { Life.init(m); m.disc = DW.clamp(m.disc + n, 0, 100); },
    // un moment où le joueur peut féliciter ou gronder (en parlant à son partenaire)
    moment(type, why) { Life.pending = { type, why, until: DW.state.clock + 90 }; DW.Companion && DW.ow && DW.Companion.emote(DW.ow, type === 'bad' ? '...' : 'note', 2); },
    hour: () => (DW.state.clock % 1440) / 60,
    sleepy(m) { const h = Life.hour(); return (h >= BED || h < WAKE) && DW.state.clock - m.slept > 10 * 60; },

    // appelé par Care.update (minutes de jeu écoulées)
    update(ow, min) {
      const st = DW.state, m = DW.Care.lead();
      if (!m) return;
      Life.init(m);
      if (Life.pending && st.clock > Life.pending.until) Life.pending = null;
      const h = Life.hour();
      // sommeil : rappel à 21 h, effondrement à 2 h
      if (h >= BED && h < BED + min / 60 + 0.01 && Life.sleepy(m)) DW.Care.toast(`${m.name} bâille... Il a sommeil. (ENTRÉE → DORMIR)`);
      if (h >= LATE && h < WAKE && st.clock - m.slept > 15 * 60 && !ow.locked && !Life.collapsing) {
        Life.collapsing = true;
        ow.runScript(async () => { await Life.collapse(m); Life.collapsing = false; });
        return;
      }
      // faim prolongée : erreur au bout de 2 h à 100
      if (m.hunger >= 100) { m.starveT = (m.starveT || 0) + min; if (m.starveT >= 120 && !m.starveMistake) { m.starveMistake = true; Life.mistake(m, `${m.name} a trop longtemps eu faim`); } }
      else { m.starveT = 0; m.starveMistake = false; }
      // maladie / blessure non soignée pendant une journée
      for (const k of ['sick', 'hurt']) if (m[k] && st.clock - m[k] > 1440) {
        m[k] = st.clock; Life.mistake(m, `${m.name} n'a pas été soigné`);
        if (k === 'sick') m.lifespan = Math.max(m.age + 1, m.lifespan - 1);   // une maladie non soignée raccourcit la vie
      }
      if (m.sick && Math.random() < min / 120) m.addHappy(-1);
      // tomber malade : faim extrême, saleté (crottes non ramassées)
      const dirt = Object.values(st.poops).reduce((a, L) => a + L.length, 0);
      if (!m.sick && Math.random() < min * (0.0004 + (m.hunger >= 100 ? 0.002 : 0) + dirt * 0.0006)) { m.sick = st.clock; DW.Care.toast(`${m.name} a l'air malade... (Médicament)`, '#ff8a8a'); }
      // fin de vie (pour tous les Digimon de l'équipe)
      for (const d of st.party) {
        Life.init(d);
        if (d.age >= d.lifespan && !ow.locked && !Life.reborning) {
          Life.reborning = true;
          ow.runScript(async () => { await Life.endOfLife(d); Life.reborning = false; });
          return;
        }
      }
      // règles Digimon World 1 : Digivolution selon l'âge
      if (DW.AutoEvo) DW.AutoEvo.check(ow);
    },
    // dormir (menu) : jusqu'à 7 h, l'équipe récupère
    async sleep(forced) {
      const st = DW.state, m = DW.Care.lead();
      await DW.fade(1, 0.6);
      const day = Math.floor(st.clock / 1440) + (Life.hour() >= WAKE ? 1 : 0);
      st.clock = day * 1440 + (forced ? WAKE + 1 : WAKE) * 60;
      st.careClock = st.clock;
      for (const d of st.party) {
        Life.init(d);
        d.slept = st.clock; d.tired = 0; d.mp = d.maxMp;
        if (d.hp > 0) d.hp = Math.min(d.maxHp, d.hp + Math.ceil(d.maxHp * 0.5));
        d.hunger = Math.min(100, d.hunger + 30);
        d.need = Math.min(95, d.need + 25);
      }
      if (m && m.hurt && !forced) { m.hurt = 0; }
      await DW.wait(0.6);
      await DW.fade(0, 0.6);
    },
    async collapse(m) {
      await DW.say(`${m.name} n'en peut plus... Il s'endort d'épuisement au beau milieu du chemin !`);
      Life.mistake(m, 'nuit blanche'); m.addHappy(-5);
      await Life.sleep(true);
      await DW.say(`${m.name} se réveille tard, encore tout grognon.`);
    },
    // renaissance : bébé de la lignée, avec un héritage
    babyOf(sp) { for (let k = 0; k < 8; k++) { const p = DW.Evo.prev(sp); if (!p.length) break; sp = p[0]; } return sp; },
    reborn(m) {
      Life.init(m);
      const sp = Life.babyOf(m.sp);
      const iv = {}; for (const k in m.iv) iv[k] = Math.min(15, m.iv[k] + 2);
      const tr = {}; for (const k in m.tr) tr[k] = Math.floor(m.tr[k] / 2);
      const nm = new DW.Digimon(sp, 4, { iv, tr, happy: Math.max(50, m.happy), wins: m.wins, moves: m.moves.slice(0, DW.MAX_MOVES), nick: m.nick, uid: m.uid });
      nm.lives = m.lives + 1; nm.lifespan = LIFESPAN + 2 * nm.lives; nm.disc = Math.round(m.disc / 2); nm.mistakes = 0; nm.fat = 0;
      return nm;
    },
    async endOfLife(m) {
      const st = DW.state, idx = st.party.indexOf(m);
      if (idx < 0) return;
      await DW.say(`${m.name} est arrivé au bout de sa vie de Digimon... Il te regarde une dernière fois avec tendresse.`);
      await DW.say('Ses données se rassemblent... et forment un DigiŒuf !');
      const nm = Life.reborn(m);
      await DW.fade(1, 0.5, '#ffffff'); await DW.wait(0.3); DW.fade(0, 0.4);
      await DW.Game.push(new DW.HatchScene(nm.sp));
      st.party[idx] = nm; st.seen[nm.sp] = st.owned[nm.sp] = true;
      await DW.say(`${m.name} renaît en ${DW.SPECIES[nm.sp].name} ! (vie n°${nm.lives + 1}) Il garde ses techniques et une partie de sa force.`);
      DW.autosave();
    },
    // féliciter / gronder en parlant au partenaire ; renvoie true si un moment a été traité
    async talk(m) {
      const P = Life.pending;
      if (!P || m !== DW.Care.lead()) return false;
      Life.pending = null;
      await DW.say(P.type === 'bad' ? `${m.name} a fait une bêtise (${P.why})... Il évite ton regard.` : `${m.name} est tout fier de lui (${P.why}) !`);
      const r = await DW.choose(['Féliciter', 'Gronder', 'Ne rien dire']);
      if (r === 0) {
        if (P.type === 'good') { m.addHappy(6); Life.addDisc(m, 2); Audio.sfx('buff'); await DW.say(`${m.name} est ravi ! (bonheur +6)`); }
        else { m.addHappy(2); Life.addDisc(m, -6); await DW.say(`${m.name} est content... mais il n'a pas compris qu'il avait mal agi. (discipline -6)`); }
      } else if (r === 1) {
        if (P.type === 'bad') { Life.addDisc(m, 10); m.addHappy(-3); Audio.sfx('debuff'); await DW.say(`${m.name} baisse la tête. Il ne recommencera pas ! (discipline +10)`); }
        else { m.addHappy(-8); Life.addDisc(m, -3); await DW.say(`${m.name} ne comprend pas pourquoi tu le grondes... (bonheur -8)`); }
      }
      return true;
    },
    // désobéissance en combat (discipline basse)
    disobeys(m) { Life.init(m); return Math.random() < Math.max(0, (45 - m.disc) / 100); },
    // affichage : petite bulle d'état (maladie, blessure, sommeil)
    bubbleIcon(m) { Life.init(m); return m.sick ? 'sick' : m.hurt ? 'hurt' : Life.sleepy(m) ? 'sleep' : null; },
  };
})();
