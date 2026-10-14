'use strict';
// =====================================================================
//  ÉCHANGES AVEC LE PAYSAGE : ESPACE devant un élément du décor propose une action
//    arbre / palmier : le secouer avec le BÂTON SOLIDE (un fruit tombe... ou un Digimon caché saute !)
//    rocher, souche, rondin creux, tonneau, caisses : fouiller avec la PETITE PELLE (trouvaille, parfois un insecte)
//    (les outils se vendent au Bazar de Gotsumon)
//    champignon lumineux : cueillir      banc, rondin : s'asseoir (le partenaire se repose)
//    source, eau : boire / s'éclabousser      fleurs : les sentir      puits : faire un vœu
//    panneau : après la lecture, le partenaire réagit parfois
//  Chaque élément ne donne qu'une trouvaille par jour (st.scenery).
// =====================================================================
(function () {
  const say = (t, who) => DW.say(t, who);
  const st = () => DW.state;
  const day = () => Math.floor(st().clock / 1440);
  const once = (ow, x, y) => { const s = st().scenery = st().scenery || {}, k = `${ow.mapId}:${x},${y}`; if (s[k] === day()) return false; s[k] = day(); return true; };
  const give = async (id, n = 1) => { const extra = DW.giveItem(id, n); DW.Audio.sfx('buy'); await say(`Tu trouves : ${DW.ITEMS[id].name}${n > 1 ? ' ×' + n : ''} !${DW.extraMsg(extra)}`); };
  const pt = () => DW.Care.lead();
  const emote = (ow, k) => { if (DW.Companion) DW.Companion.emote(ow, k, 2); };
  // Digimon sauvage caché dans le décor (s'il y en a dans la zone)
  async function ambush(ow, line) {
    const enc = ow.map.encounters;
    if (!enc || !enc.length || !pt() || pt().hp <= 0) return false;
    const e = DW.weighted(enc.map(x => ({ ...x, w: x.w || 1 })));
    await say(line.replace('%s', DW.SPECIES[e.sp].name));
    await ow.battle({ enemy: new DW.Digimon(e.sp, DW.rand(e.min, e.max)) });
    return true;
  }
  const FRUIT = { tree: ['digipomme', 'baie_rouge', 'noix_douce', 'pomme_bleue'], bigtree: ['gland_or', 'noix_douce', 'grosse_baie'], palm: ['orange_bana', 'noix_douce'], candytree: ['sucre', 'macaron'] };

  const ACTS = {
    async shake(ow, x, y, kind) {
      if (!st().bag.baton) { await say("Un bel arbre. Avec un Bâton solide (Bazar de Gotsumon), tu pourrais le secouer..."); return; }
      if ((await DW.ask('Secouer l\'arbre ?', ['Oui', 'Non'])) !== 0) return;
      ow.shake = 0.25; DW.Audio.sfx('swoosh');
      if (!once(ow, x, y)) { await say('Quelques feuilles tombent... Il n\'y a plus rien à cueillir aujourd\'hui.'); return; }
      const r = Math.random();
      if (r < 0.4) { await say('Quelque chose tombe de l\'arbre !'); await give(DW.pick(FRUIT[kind] || FRUIT.tree)); emote(ow, 'heart'); }
      else if (r < 0.55 && await ambush(ow, 'Un %s caché dans les branches te tombe dessus !')) return;
      else await say('Des feuilles virevoltent... mais rien d\'autre.');
    },
    async search(ow, x, y, what) {
      if (!st().bag.pelle) { await say(`Il y a peut-être quelque chose ${what.startsWith('sous') || what.startsWith('autour') ? what : 'dans ' + what}... Il te faudrait une Petite pelle (Bazar de Gotsumon).`); return; }
      if (!once(ow, x, y)) { await say(`Tu as déjà fouillé ${what} aujourd'hui.`); return; }
      const r = Math.random();
      if (r < 0.3) await give(DW.pick(['digichampi', 'viande', 'soin_p', 'eau_source', 'sel', 'truffe']));
      else if (r < 0.4 && await ambush(ow, 'Un %s dérangé dans sa cachette t\'attaque !')) return;
      else { await say(`Tu fouilles ${what}... Rien, à part quelques cloportes.`); if (pt()) await say(`${pt().name} renifle partout, déçu.`); }
    },
    async pick(ow, x, y) {
      if (!once(ow, x, y)) { await say('Le champignon brille doucement. Il repoussera demain.'); return; }
      await say('Tu cueilles délicatement le champignon lumineux.'); await give(Math.random() < 0.2 ? 'champi_luxe' : 'digichampi');
    },
    async sit(ow) {
      const m = pt();
      if ((await DW.ask('S\'asseoir un moment ?', ['Oui (30 min)', 'Non'])) !== 0) return;
      await DW.fade(0.5, 0.3); st().clock += 30; await DW.wait(0.5); await DW.fade(0, 0.3);
      if (m) { m.tired = Math.max(0, m.tired - 15); m.addHappy(1); await say(`Vous vous reposez un peu. ${m.name} pose sa tête contre toi. (fatigue -15)`); }
      else await say('Tu te reposes un peu.');
    },
    async water(ow, x, y, spring) {
      const m = pt();
      if (!m) { await say(spring ? 'Une source d\'eau claire.' : 'L\'eau est fraîche.'); return; }
      const r = await DW.ask(spring ? 'Une source d\'eau claire.' : 'L\'eau clapote.', ['Boire un peu', 'Jouer dans l\'eau', 'Rien']);
      if (r === 0) { m.tired = Math.max(0, m.tired - 5); DW.Audio.sfx('water'); await say(`${m.name} boit à grandes gorgées. Ça fait du bien ! (fatigue -5)`); if (spring && once(ow, x, y)) await give('eau_source'); }
      else if (r === 1) { DW.Audio.sfx('water'); m.addHappy(3); emote(ow, 'note'); await say(`${m.name} s'éclabousse en riant ! (bonheur +3)`); }
    },
    async flowers(ow, x, y) {
      const m = pt();
      if (!m) { await say('De jolies fleurs sauvages.'); return; }
      if (once(ow, x, y)) { m.addHappy(2); emote(ow, 'heart'); await say(`${m.name} plonge le nez dans les fleurs... Atchoum ! Il a l'air ravi. (bonheur +2)`); }
      else await say(`${m.name} regarde les fleurs, rêveur.`);
    },
    async wish(ow, x, y) {
      if ((await DW.ask('Un vieux puits. Jeter 1 Bit et faire un vœu ?', ['Oui', 'Non'])) !== 0) return;
      if (st().bits < 1) { await say('Tu n\'as pas un seul Bit...'); return; }
      st().bits--; DW.Audio.sfx('water');
      await say('Plouf... Tu fais un vœu en silence.');
      if (once(ow, x, y) && Math.random() < 0.15) { await say('Une lueur monte du fond du puits !'); await give(DW.pick(['super_carotte', 'radis', 'champi_joie'])); }
      else if (pt()) { pt().addHappy(1); await say(`${pt().name} fait un vœu lui aussi.`); }
    },
  };
  // élément du décor → action
  const BY_OBJ = { tree: ['shake', 'tree'], bigtree: ['shake', 'bigtree'], palm: ['shake', 'palm'], candytree: ['shake', 'candytree'],
    rock: ['search', 'sous le rocher'], mossrock: ['search', 'sous le rocher moussu'], searock: ['search', 'autour du rocher'], tidepool: ['search', 'la cuvette'],
    stump: ['search', 'la souche'], hollowlog: ['search', 'le rondin creux'], barrel: ['search', 'le tonneau'], crates: ['search', 'les caisses'], haybale: ['search', 'la botte de foin'], driftwood: ['search', 'le bois flotté'],
    glowshroom: ['pick'], giantshroom: ['pick'], bench: ['sit'], log: ['sit'], spring: ['water', true], well: ['wish'] };

  const Paysage = DW.Paysage = {
    // action pour la case visée (ou null)
    act(ow, x, y) {
      const ch = ow.tileAt(x, y), I = DW.World.info(ch);
      const b = I.obj && BY_OBJ[I.obj];
      if (b) return () => ACTS[b[0]](ow, x, y, b[1]);
      if (ch === '~' || ch === 'w') return () => ACTS.water(ow, x, y, false);
      if (I.deco === 'flowers' || I.deco === 'flowers2') return () => ACTS.flowers(ow, x, y);
      return null;
    },
    // après la lecture d'un panneau, le partenaire réagit parfois
    async afterSign() {
      const m = pt();
      if (!m || Math.random() > 0.3) return;
      await say(DW.pick([`${m.name} : C'est écrit quoi ? Je ne sais pas encore lire...`, `${m.name} : On va par là ? Allez, on y va !`, `${m.name} fait semblant de lire le panneau avec un air très sérieux.`, `${m.name} : J'espère qu'il y a à manger là-bas !`]));
    },
  };
})();
