'use strict';
// =====================================================================
//  À L'ABRI PENDANT L'ORAGE
//  - Dehors sous l'orage : le partenaire a peur (bonheur -1 toutes les 20 min, il sue et tremble),
//    il se fatigue (game/calendrier.js) et la foudre peut le frapper (gfx/meteo.js).
//  - À l'abri (n'importe quel intérieur) : il est rassuré dès qu'on entre, se repose (fatigue -1 et
//    bonheur +1 toutes les 15 min) ; on voit les éclairs par les fenêtres et on entend le tonnerre au loin.
//  - Activités d'orage, une fois chacune par orage (parler au partenaire à l'intérieur) :
//    raconter une histoire, devinettes au coin du feu, cabane de couvertures, regarder la pluie.
//  - Quand l'orage passe, s'il est resté à l'abri : arc-en-ciel et bonne humeur.
// =====================================================================
(function () {
  const T = DW.Time, st = () => DW.state;
  const storm = () => T.weather() === 'storm';
  // un orage = une période météo (st.weather.until sert d'identifiant)
  const sid = () => storm() ? st().weather.until : 0;

  DW.Abri = {
    // appelé par game/care.js à chaque minute de jeu qui passe
    tick(ow, min) {
      const s = st(), m = DW.Care.lead();
      if (!m || ow.locked || ow.cine) return;
      const A = s.abri || (s.abri = { id: 0, inside: 0, outside: 0, done: {} });
      if (storm()) {
        if (A.id !== sid()) { A.id = sid(); A.inside = 0; A.outside = 0; A.done = {}; A.said = false; }
        if (ow.map.indoor) {
          if (!A.said) { A.said = true; DW.Care.toast(`À l'abri ! ${m.name} se blottit contre toi, rassuré. Parle-lui : il y a plein de choses à faire pendant l'orage.`, '#a8e0ff'); DW.Companion.emote(ow, 'heart', 2.4); }
          A.inside += min;
          A.rest = (A.rest || 0) + min;
          if (A.rest >= 15) { A.rest -= 15; m.tired = Math.max(0, m.tired - 1); m.addHappy(1); }
        } else {
          A.said = false;
          A.outside += min;
          A.fear = (A.fear || 0) + min;
          if (A.fear >= 20) { A.fear -= 20; m.addHappy(-1); DW.Companion.emote(ow, '!', 2); }   // (la peur : un « ! » ; la goutte, c'est la fatigue)
        }
      } else if (A.id && !A.over) {
        // l'orage vient de passer
        A.over = A.id; A.id = 0;
        if (A.inside > A.outside && !ow.map.indoor) { m.addHappy(3); DW.Care.toast(`L'orage est passé... Un arc-en-ciel ! ${m.name} est tout content d'être resté au sec. (bonheur +3)`, '#ffe070'); }
        else if (A.inside > A.outside) DW.Care.toast(`On n'entend plus le tonnerre : l'orage est passé !`, '#ffe070');
      }
      if (storm()) A.over = 0;
    },
    // le partenaire propose une activité quand on lui parle à l'intérieur pendant l'orage
    can(ow) { return storm() && ow.map.indoor && !!DW.Care.lead(); },
    async menu(ow, m) {
      const A = st().abri || (st().abri = { id: sid(), inside: 0, outside: 0, done: {} });
      if (A.id !== sid()) { A.id = sid(); A.done = {}; }
      const ACT = [
        ['histoire', 'Raconter une histoire', () => this.story(m)],
        ['devinettes', 'Devinettes au coin du feu', () => this.riddles(m)],
        ['cabane', 'Cabane de couvertures', () => this.fort(ow, m)],
        ['pluie', 'Regarder la pluie', () => this.watch(m)],
      ].filter(a => !A.done[a[0]]);
      DW.Companion.wake(ow);
      if (!ACT.length) { await DW.say(`${m.name} : On a tout fait ! On attend que l'orage passe, bien au chaud...`); return; }
      const r = await DW.ask(`${m.name} : BOUM ! Tu as entendu ce tonnerre ? Qu'est-ce qu'on fait en attendant ?`, [...ACT.map(a => a[1]), 'Rien pour l\'instant']);
      if (r < 0 || r >= ACT.length) return;
      A.done[ACT[r][0]] = true;
      await ACT[r][2]();
    },
    // --- histoire : le partenaire écoute, blotti (discipline et bonheur)
    async story(m) {
      const TALES = [
        "Il était une fois un petit Botamon qui avait peur du tonnerre... jusqu'au jour où il comprit que le tonnerre, c'était juste le ciel qui chantait faux.",
        "Il était une fois sept enfants tombés du ciel sur une île pleine de Digimon. Chacun avait un Digivice, et un cœur plus grand encore...",
        "Il était une fois un Gabumon timide qui portait la fourrure d'un loup pour se donner du courage. Un soir d'orage, il protégea tout un village.",
        "Il était une fois un Agumon si gourmand qu'il mangea toute la viande de Jijimon. Pour se faire pardonner, il répara le toit pendant la tempête !",
      ];
      await DW.say(DW.pick(TALES));
      await DW.say(`${m.name} t'écoute sans bouger, les yeux grands ouverts. Il n'a plus peur du tout. (bonheur +3, discipline +3)`);
      m.addHappy(3); DW.Life.addDisc(m, 3); DW.Audio.sfx('buff');
    },
    // --- devinettes : « qui suis-je ? » (descriptions du Digidex) et types
    async riddles(m) {
      const S = DW.SPECIES, pool = Object.keys(S).filter(k => S[k].desc && S[k].name);
      const known = pool.filter(k => (st().owned || {})[k]);
      let good = 0;
      for (let q = 0; q < 3; q++) {
        if (q < 2) {
          const id = DW.pick(known.length >= 2 && Math.random() < 0.6 ? known : pool), sp = S[id];
          const others = pool.filter(k => k !== id && S[k].name !== sp.name).sort(() => Math.random() - 0.5).slice(0, 2);
          const opts = [id, ...others].sort(() => Math.random() - 0.5);
          const clue = sp.desc.split(sp.name).join('...');
          const r = await DW.ask(`${m.name} : Devine ! « ${clue} » Qui est-ce ?`, opts.map(k => S[k].name), null, false);
          if (opts[r] === id) { good++; DW.Audio.sfx('buff'); await DW.say(`Bravo ! C'est ${sp.name} !`); }
          else await DW.say(`Raté ! C'était ${sp.name}.`);
        } else {
          const EFF = DW.EFF, atk = DW.pick(Object.keys(EFF).filter(a => Object.values(EFF[a]).some(v => v === 2)));
          const strong = Object.keys(EFF[atk]).filter(d => EFF[atk][d] === 2), ans = DW.pick(strong);
          const wrong = Object.keys(DW.TYPES).filter(t => !strong.includes(t)).sort(() => Math.random() - 0.5).slice(0, 2);
          const opts = [ans, ...wrong].sort(() => Math.random() - 0.5);
          const r = await DW.ask(`${m.name} : Dernière ! Les techniques ${atk} sont très efficaces contre...`, opts, null, false);
          if (opts[r] === ans) { good++; DW.Audio.sfx('buff'); await DW.say('Exact ! Tu es un vrai DigiSélectionné !'); }
          else await DW.say(`Non ! Contre ${strong.join(', ')}.`);
        }
      }
      const h = 1 + good * 2;
      m.addHappy(h);
      await DW.say(`${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur 3 ! ${m.name} a adoré jouer. (bonheur +${h})`);
    },
    // --- cabane de couvertures : on s'y repose une heure, l'orage passe plus vite
    async fort(ow, m) {
      await DW.say(`Tu tends une couverture entre deux chaises... ${m.name} s'y glisse aussitôt et tu le rejoins.`);
      await DW.fade(0.6, 0.4);
      DW.Care.rest(60, false);
      m.tired = Math.max(0, m.tired - 25); m.addHappy(4);
      await DW.wait(0.6);
      await DW.fade(0, 0.4);
      await DW.say(`Une heure passe, bien à l'abri sous la cabane. ${m.name} est tout reposé. (fatigue -25, bonheur +4)`);
    },
    // --- regarder la pluie à la fenêtre
    async watch(m) {
      DW.Meteo.flash = Math.max(DW.Meteo.flash, 0.35); DW.wait(0.5).then(() => DW.Audio.sfx('thunder'));
      await DW.wait(0.4);
      await DW.say(DW.pick([
        `Le nez collé à la vitre, ${m.name} compte les éclairs : « Un... deux... trois... BOUM ! »`,
        `${m.name} suit du doigt les gouttes qui glissent sur la vitre et fait la course avec elles.`,
        `${m.name} regarde les flaques grossir dehors : « Demain, on sautera dedans, hein ? »`,
      ]));
      m.addHappy(2);
      await DW.say(`${m.name} est calme et content. (bonheur +2)`);
    },
  };
})();
