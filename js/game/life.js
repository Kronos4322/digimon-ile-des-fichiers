'use strict';
// =====================================================================
//  VIE DU DIGIMON (comme Digimon World 1)
//  - DURÉE DE VIE : ~30 jours de jeu (+2 par renaissance, -½ par erreur de soin, +2 si très heureux).
//    Au bout, le Digimon redevient un DigiŒuf et renaît en bébé de sa lignée (il garde ses techniques,
//    ses victoires, la moitié de son entraînement, et ses données innées se renforcent).
//  - ERREURS DE SOIN : faim ignorée, accident, nuit blanche, maladie ou blessure non soignée.
//    Trop d'erreurs ferment les « bonnes » Digivolutions et ouvrent Numemon / Sukamon.
//  - CORPULENCE (-10 maigre … +10 gros) : manger fait grossir, l'entraînement et les combats affinent.
//  - DISCIPLINE (0-100) : après une bêtise ou un exploit, parle à ton partenaire pour le féliciter
//    ou le gronder. Mal discipliné, il désobéit parfois en combat.
//  - SOMMEIL : chaque espèce a son rythme. DIURNE : sommeil à 21 h, effondrement à 2 h, réveil à 7 h.
//    NOCTURNE (Ténèbres, fantômes, champignons...) : sommeil à 8 h, effondrement à 13 h, réveil à 16 h.
//  - K.O. : comme dans Digimon World 1, au 3e K.O. en combat le Digimon meurt vraiment : il redevient
//    un DigiŒuf (bébé de sa lignée) et oublie une ou deux techniques.
//  - MALADIE : jamais au hasard. Elle vient d'une ACCUMULATION de négligences (m.germs, 0-100, affiché
//    « Santé » dans la fiche) : crottes laissées par terre, faim, épuisement, blessure non soignée,
//    nuit blanche, accidents, corpulence extrême... Bien soigné, il se rétablit peu à peu (sommeil, toilettes).
//    À 50 : il n'a pas l'air bien. À 80 : il tousse. Au-delà, il peut tomber malade ; à 100, c'est sûr.
//  - MALADIE / BLESSURE : soignées par Médicament / Bandage (ou une nuit chez Jijimon).
// =====================================================================
(function () {
  const { Audio } = DW;
  const LIFESPAN = 30, KO_MAX = 3;
  // rythmes de sommeil (heures) : coucher, effondrement si pas couché, réveil
  const DAY = { bed: 21, late: 2, wake: 7, name: 'diurne' }, NIGHT = { bed: 8, late: 13, wake: 16, name: 'nocturne' };
  const NOCTURNAL = new Set(['mushroomon', 'bakemon', 'gazimon', 'tsukaimon', 'demidevimon', 'pagumon', 'candlemon', 'devimon', 'vampiremon', 'myotismon', 'phantomon', 'soulmon', 'wizardmon', 'pumpkinmon', 'impmon', 'keramon', 'kuramon', 'yuramon', 'tanemon']);
  // h dans [a, b[ sur un cadran de 24 h (gère minuit)
  const between = (h, a, b) => (a <= b ? h >= a && h < b : h >= a || h < b);

  const Life = DW.Life = {
    pending: null, // moment éducatif en attente : { type: 'bad' | 'good', why, until }
    // valeurs par défaut des nouveaux champs (anciennes sauvegardes)
    init(m) {
      if (m.mistakes == null) m.mistakes = 0;
      if (m.disc == null) m.disc = 40;
      if (m.fat == null) m.fat = 0;
      if (m.lives == null) m.lives = 0;
      if (m.lifespan == null) m.lifespan = LIFESPAN;
      if (!m.life2) { m.life2 = true; if (m.lifespan < LIFESPAN) m.lifespan += 14; }   // (durée de vie passée de 16 à 30 jours : les Digimon déjà nés en profitent)
      if (m.germs == null) m.germs = 0;
      if (m.slept == null) m.slept = DW.state ? DW.state.clock : 0;
      return m;
    },
    daysLeft: m => Math.max(0, Math.ceil(m.lifespan - m.age)),
    fatLabel: m => (m.fat <= -6 ? 'Maigre' : m.fat <= -3 ? 'Mince' : m.fat < 3 ? 'Normal' : m.fat < 6 ? 'Enrobé' : 'Gros'),
    mistake(m, why) {
      Life.init(m);
      m.mistakes++; m.lifespan = Math.max(6, m.lifespan - 0.5);
      Life.addGerms(m, 5);
      DW.Care.toast(`Erreur de soin : ${why} (${m.mistakes})`, '#ffb070');
    },
    addFat(m, n) { Life.init(m); m.fat = DW.clamp(m.fat + n, -10, 10); },
    addDisc(m, n) { Life.init(m); m.disc = DW.clamp(m.disc + n, 0, 100); },
    // un moment où le joueur peut féliciter ou gronder (en parlant à son partenaire)
    // un moment éducatif reste ouvert 4 h de jeu ; une bulle reste au-dessus du partenaire, et OK près de lui suffit
    // (silencieux : le joueur félicite ou gronde quand il veut, depuis le menu ; plus de message après chaque victoire)
    moment(type, why) {
      Life.pending = { type, why, until: DW.state.clock + 240 };
    },
    hour: () => (DW.state.clock % 1440) / 60,
    sched: m => (m && (NOCTURNAL.has(m.sp) || (m.d && m.d.types.includes('Ténèbres') && m.d.stage !== 'Bébé')) ? NIGHT : DAY),
    sleepy(m) { const h = Life.hour(), S = Life.sched(m); return between(h, S.bed, S.wake) && DW.state.clock - m.slept > 10 * 60; },
    // ---------- K.O. en combat : au 3e, il meurt vraiment (renaît en œuf, oublie des techniques)
    async knockout(m) {
      Life.init(m);
      m.kos = (m.kos || 0) + 1;
      if (m.kos < KO_MAX) {
        DW.Care.toast(`${m.name} est K.O. (${m.kos}/${KO_MAX}). Au ${KO_MAX}e K.O., il mourra !`, '#ff8a8a');
        // avertissement clair au dernier K.O. avant la mort (et le moyen de s'en remettre)
        if (m.kos === KO_MAX - 1) Life.koWarn = m;
        return false;
      }
      await Life.death(m);
      return true;
    },
    async death(m) {
      const st = DW.state, idx = st.party.indexOf(m);
      if (idx < 0) return;
      await DW.say(`${m.name} a été mis K.O. trop souvent... Ses données s'effacent doucement.`);
      await DW.say(`${m.name} : Merci... pour tout... On se reverra...`);
      await DW.say('Ses données se rassemblent... et forment un DigiŒuf.');
      const nm = Life.reborn(m);
      // il oublie une ou deux techniques (il en garde toujours au moins une)
      const lost = [];
      for (let n = 1 + (Math.random() < 0.5 ? 1 : 0); n > 0 && nm.moves.length > 1; n--) { const i = Math.floor(Math.random() * nm.moves.length); lost.push(DW.MOVES[nm.moves[i].id].name); nm.moves.splice(i, 1); }
      await DW.fade(1, 0.5, '#ffffff'); await DW.wait(0.3); DW.fade(0, 0.4);
      await DW.Game.push(new DW.HatchScene(nm.sp));
      st.party[idx] = nm; st.seen[nm.sp] = st.owned[nm.sp] = true;
      await DW.say(`${m.name} renaît en ${DW.SPECIES[nm.sp].name}...${lost.length ? ` Il a oublié ${lost.join(' et ')}.` : ''}`);
      DW.autosave();
    },

    // appelé par Care.update (minutes de jeu écoulées)
    update(ow, min) {
      const st = DW.state, m = DW.Care.lead();
      if (!m) return;
      Life.init(m);
      if (Life.pending && st.clock > Life.pending.until) Life.pending = null;
      const h = Life.hour(), S = Life.sched(m);
      // sommeil : rappel à l'heure du coucher, effondrement s'il n'est toujours pas couché (selon son rythme)
      // (bulle au-dessus du partenaire à la place du message)
      if (between(h, S.late, S.wake) && st.clock - m.slept > 15 * 60 && !ow.locked && !Life.collapsing) {
        Life.collapsing = true;
        ow.runScript(async () => { try { await Life.collapse(m); } finally { Life.collapsing = false; } });
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
      // santé : les négligences s'accumulent (jamais de maladie « au hasard »)
      Life.health(m, min);
      // fin de vie (pour tous les Digimon de l'équipe)
      for (const d of st.party) {
        Life.init(d);
        if (d.age >= d.lifespan && !ow.locked && !Life.reborning) {
          Life.reborning = true;
          ow.runScript(async () => { try { await Life.endOfLife(d); } finally { Life.reborning = false; } });
          return;
        }
      }
    },
    // dormir (menu) : jusqu'à 7 h, l'équipe récupère
    async sleep(forced) {
      const st = DW.state, m = DW.Care.lead();
      await DW.fade(1, 0.6);
      const WAKE = Life.sched(m).wake;   // il dort jusqu'à son heure de réveil (7 h, ou 16 h pour un nocturne)
      const day = Math.floor(st.clock / 1440) + (Life.hour() >= WAKE ? 1 : 0);
      st.clock = day * 1440 + (forced ? WAKE + 1 : WAKE) * 60;
      st.careClock = st.clock;
      for (const d of st.party) {
        Life.init(d);
        d.slept = st.clock; d.tired = 0; d.mp = d.maxMp;
        if (!forced) d.germs = Math.max(0, (d.germs || 0) - 35);
        if (d.hp > 0) d.hp = st.bag.oreiller ? d.maxHp : Math.min(d.maxHp, d.hp + Math.ceil(d.maxHp * 0.5));
        // une nuit de sommeil : faim, soif et toilettes montent peu (besoins ralentis)
        d.hunger = Math.min(95, d.hunger + 10);
        d.need = Math.min(90, d.need + 8);
        d.thirst = Math.min(95, (d.thirst || 0) + 12);
      }
      if (m && m.hurt && !forced) { m.hurt = 0; }
      await DW.wait(0.6);
      await DW.fade(0, 0.6);
    },
    // dans un lit (chez Jijimon, dans ta chambre, dans celle de ton Digimon) : il DORT seulement s'il a sommeil
    // (à ses heures) ; sinon il se repose une heure. Renvoie 'sleep', 'rest' ou null (annulé).
    async restOrSleep() {
      const st = DW.state, m = DW.Care.lead();
      if (m && Life.sleepy(m)) {
        if ((await DW.ask(`${m.name} bâille... Dormir jusqu'à son réveil ?`)) !== 0) return null;
        await Life.sleep(false);
        await DW.say(`Bonjour ! ${m.name} a bien dormi et se sent en forme.`);
        return 'sleep';
      }
      if ((await DW.ask(m ? `${m.name} n'a pas sommeil. Se reposer une heure ?` : 'Se reposer une heure ?')) !== 0) return null;
      await DW.fade(1, 0.4);
      DW.Care.rest(60, true);
      for (const d of st.party) {
        if (d.hp > 0) d.hp = Math.min(d.maxHp, d.hp + Math.ceil(d.maxHp * 0.3));
        d.mp = Math.min(d.maxMp, d.mp + Math.ceil(d.maxMp * 0.3));
        d.tired = Math.max(0, (d.tired || 0) - 30);
      }
      await DW.wait(0.4);
      await DW.fade(0, 0.4);
      await DW.say('Une heure de repos... L\'équipe a récupéré un peu de forces (PV et PM +30 %, fatigue -30).');
      return 'rest';
    },
    async collapse(m) {
      await DW.say(`${m.name} n'en peut plus... Il s'endort d'épuisement au beau milieu du chemin !`);
      Life.mistake(m, 'nuit blanche'); m.addHappy(-5); Life.addGerms(m, 20);
      await Life.sleep(true);
      await DW.say(`${m.name} se réveille tard, encore tout grognon.`);
    },
    // renaissance : bébé de la lignée, avec un héritage
    babyOf(sp) { for (let k = 0; k < 8; k++) { const p = DW.Evo.prev(sp); if (!p.length) break; sp = p[0]; } return sp; },
    reborn(m, sp) {
      Life.init(m);
      const same = !sp || sp === Life.babyOf(m.sp);
      sp = sp || Life.babyOf(m.sp);
      const iv = {}; for (const k in m.iv) iv[k] = Math.min(15, m.iv[k] + 2);
      const tr = {}; for (const k in m.tr) tr[k] = Math.floor(m.tr[k] / 2);
      // même lignée : il garde ses techniques et son surnom ; nouvelle lignée : un nouveau Digimon qui hérite d'une partie de la force
      const nm = new DW.Digimon(sp, 4, same ? { iv, tr, happy: Math.max(50, m.happy), wins: m.wins, moves: m.moves.slice(0, DW.MAX_MOVES), nick: m.nick, uid: m.uid } : { iv, tr, happy: 60 });
      nm.lives = m.lives + 1; nm.lifespan = LIFESPAN + 2 * nm.lives; nm.disc = Math.round(m.disc / 2); nm.mistakes = 0; nm.fat = 0;
      return nm;
    },
    async endOfLife(m) {
      const st = DW.state, idx = st.party.indexOf(m);
      if (idx < 0) return;
      await DW.say(`${m.name} est arrivé au bout de sa vie de Digimon... Il te regarde une dernière fois avec tendresse.`);
      await DW.say('Ses données se rassemblent... et forment un DigiŒuf ! Quel Digimon va en naître ?');
      const same = Life.babyOf(m.sp), eggs = [same, ...DW.EGG_ORDER.filter(e => e !== same)];
      let i = -1;
      while (i < 0) i = await DW.choose(eggs.map((e, k) => DW.SPECIES[e].name + (k ? '' : ' (même lignée)')), { y: 20 });
      const nm = Life.reborn(m, eggs[i]);
      await DW.fade(1, 0.5, '#ffffff'); await DW.wait(0.3); DW.fade(0, 0.4);
      await DW.Game.push(new DW.HatchScene(nm.sp));
      st.party[idx] = nm; st.seen[nm.sp] = st.owned[nm.sp] = true;
      await DW.say(i === 0 ? `${m.name} renaît en ${DW.SPECIES[nm.sp].name} ! (vie n°${nm.lives + 1}) Il garde ses techniques et une partie de sa force.`
        : `Un ${DW.SPECIES[nm.sp].name} est né ! Il hérite d'une partie de la force de ${m.name}.`);
      DW.autosave();
    },
    // féliciter / gronder depuis le menu, à tout moment. Juste après un exploit ou une bêtise (4 h), l'effet est fort ;
    // sinon : un compliment fait un peu plaisir (une fois par heure), gronder sans raison le rend triste.
    async educate(praise) {
      const m = DW.Care.lead(), st = DW.state;
      if (!m) return;
      const P = Life.pending && Life.pending.until > st.clock ? Life.pending : null;
      Life.pending = null;
      if (!P) {
        if (praise) {
          if ((m.praisedAt || -1e9) > st.clock - 60) { await DW.say(`${m.name} sourit... mais trop de compliments, ça ne compte plus !`); return; }
          m.praisedAt = st.clock; m.addHappy(2); Audio.sfx('buff'); await DW.say(`Tu félicites ${m.name}. Il est content ! (bonheur +2)`);
        } else { m.addHappy(-6); await DW.say(`Tu grondes ${m.name}... Il n'a rien fait de mal et ne comprend pas. (bonheur -6)`); }
        return;
      }
      await DW.say(P.type === 'bad' ? `${m.name} a fait une bêtise (${P.why})... Il évite ton regard.` : `${m.name} est tout fier de lui (${P.why}) !`);
      const r = praise ? 0 : 1;
      if (r === 0) {
        if (P.type === 'good') { m.addHappy(6); Life.addDisc(m, 2); Audio.sfx('buff'); await DW.say(`${m.name} est ravi ! (bonheur +6)`); }
        else { m.addHappy(2); Life.addDisc(m, -6); await DW.say(`${m.name} est content... mais il n'a pas compris qu'il avait mal agi. (discipline -6)`); }
      } else if (r === 1) {
        if (P.type === 'bad') { Life.addDisc(m, 10); m.addHappy(-3); Audio.sfx('debuff'); await DW.say(`${m.name} baisse la tête. Il ne recommencera pas ! (discipline +10)`); }
        else { m.addHappy(-8); Life.addDisc(m, -3); await DW.say(`${m.name} ne comprend pas pourquoi tu le grondes... (bonheur -8)`); }
      }
      return true;
    },
    // ---------------------------------------------------------- santé (accumulation de négligences)
    // causes en cours (points par heure de jeu), pour l'affichage et pour Koromon (le guide)
    causes(m) {
      const st = DW.state, h = Life.hour(), out = [];
      const dirt = Math.min(6, Object.values(st.poops).reduce((a, L) => a + L.length, 0));
      if (dirt) out.push([dirt * 1.5, dirt > 1 ? `${dirt} crottes traînent par terre` : 'une crotte traîne par terre']);
      if (m.hunger >= 100) out.push([6, 'il meurt de faim']); else if (m.hunger >= 90) out.push([2, 'il a très faim']);
      if ((m.thirst || 0) >= 100) out.push([5, 'il meurt de soif']); else if ((m.thirst || 0) >= 90) out.push([2, 'il a très soif']);
      if (m.need >= 90) out.push([2, 'il se retient depuis trop longtemps']);
      if (m.tired >= 80) out.push([4, 'il est épuisé']);
      if (m.hurt) out.push([4, "sa blessure n'est pas soignée"]);
      { const S = Life.sched(m); if (Life.sleepy(m) && between(h, (S.bed + 2) % 24, (S.late + 3) % 24)) out.push([3, 'il veille beaucoup trop tard']); }
      if (Math.abs(m.fat) >= 6) out.push([2, m.fat > 0 ? 'il est trop gros' : 'il est trop maigre']);
      return out;
    },
    addGerms(m, n) {
      Life.init(m);
      const g0 = m.germs;
      m.germs = DW.clamp(m.germs + n, 0, 100);
      if (m !== DW.Care.lead() || m.sick) return;
      // (bulle au-dessus du partenaire à la place du message)
    },
    health(m, min) {
      if (m.sick) return;
      const c = Life.causes(m), rate = c.reduce((a, [n]) => a + n, 0);
      Life.addGerms(m, rate ? rate * min / 60 : -3 * min / 60);   // bien soigné : il se rétablit peu à peu
      // au-delà de 70, il peut tomber malade ; à 100, c'est certain
      if (m.germs >= 100 || (m.germs > 70 && Math.random() < min * (m.germs - 70) / 30 / 600)) Life.fallSick(m, c);
    },
    fallSick(m, c = Life.causes(m)) {
      m.sick = DW.state.clock; m.germs = 60;
      void c;   // (plus de message : la bulle « malade » au-dessus du partenaire suffit ; les causes sont dans sa fiche)
      Life.moment('bad', 'il est tombé malade');
    },
    healthLabel: m => (Life.init(m), m.sick ? 'Malade' : m.germs >= 80 ? 'Fiévreux' : m.germs >= 50 ? 'Fragile' : m.germs >= 25 ? 'Correcte' : 'Excellente'),

    // désobéissance en combat (discipline basse)
    disobeys(m) { Life.init(m); return Math.random() < Math.max(0, (45 - m.disc) / 100); },
    // affichage : petite bulle d'état (maladie, blessure, sommeil)
    bubbleIcon(m) { Life.init(m); return m.sick ? 'sick' : m.hurt ? 'hurt' : Life.sleepy(m) ? 'sleep' : null; },
    // tous les besoins en cours, pour la grande bulle (ils défilent l'un après l'autre)
    needs(m) {
      Life.init(m);
      const out = [];
      if (m.hp > 0 && m.hp < m.maxHp * 0.35) out.push('lowhp');   // PV bas : il faut le soigner (RAM PV, repos)
      if (m.hunger >= 70) out.push('food');
      if ((m.thirst || 0) >= 70) out.push('drink');
      if (m.need >= 75) out.push('need');
      if (m.sick) out.push('sick');
      if (m.hurt) out.push('hurt');
      if (Life.sleepy(m)) out.push('sleep');
      if (m.happy < 25) out.push('sad');
      return out;
    },
  };
})();
