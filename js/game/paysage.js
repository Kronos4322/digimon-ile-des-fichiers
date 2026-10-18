'use strict';
// =====================================================================
//  ÉCHANGES AVEC LE PAYSAGE : ESPACE devant un élément du décor propose une action
//    arbre / palmier : le secouer avec le BÂTON SOLIDE (un fruit tombe... ou un Digimon caché saute !)
//    rocher, souche, rondin creux, tonneau, caisses : fouiller avec la PETITE PELLE (trouvaille, parfois un insecte)
//    (les outils se vendent au Bazar de Gotsumon)
//    champignon lumineux : cueillir      banc, rondin : s'asseoir (le partenaire se repose)
//    source, eau : boire / s'éclabousser      fleurs : les sentir      puits : faire un vœu
//    panneau : après la lecture, le partenaire réagit parfois
//  Chaque élément ne donne qu'une trouvaille par jour (st.scenery), et le plus souvent... rien du tout.
//  Les outils s'usent : le Bâton solide tient 12 coups, la Petite pelle 10 fouilles, puis ils se brisent (st.toolWear).
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
  // usure des outils : un coup de plus ; prévient quand l'outil faiblit, le casse au bout de sa vie
  const TOOL_LIFE = { baton: 12, pelle: 10 };
  async function wear(id) {
    const s = st(), W = s.toolWear = s.toolWear || {}, life = TOOL_LIFE[id];
    W[id] = (W[id] || 0) + 1;
    const left = life - W[id], name = DW.ITEMS[id].name;
    if (left <= 0) { s.bag[id] = Math.max(0, (s.bag[id] || 0) - 1); W[id] = 0; DW.Audio.sfx('bump'); await say(`CRAC ! Ton ${name} se brise en morceaux...${s.bag[id] ? ' (Tu en as un autre dans ton sac.)' : ' Il faudra en racheter un au Bazar.'}`); }
    else if (left === Math.floor(life / 2)) await say(`(Ton ${name} commence à se fendre...)`);
    else if (left === 2) await say(`(Ton ${name} ne tiendra plus très longtemps !)`);
  }
  const FRUIT = { tree: ['digipomme', 'baie_rouge', 'noix_douce', 'pomme_bleue'], bigtree: ['gland_or', 'noix_douce', 'grosse_baie'], palm: ['orange_bana', 'noix_douce'], candytree: ['sucre', 'macaron'] };

  const ACTS = {
    async shake(ow, x, y, kind) {
      if (!st().bag.baton) { await say(DW.Town.has('gotsumon') ? "Un bel arbre. Avec un Bâton solide (Bazar de Gotsumon), tu pourrais le secouer..." : 'Un bel arbre. Ses branches bruissent doucement au vent.'); return; }
      if ((await DW.ask('Secouer l\'arbre ?', ['Oui', 'Non'])) !== 0) return;
      ow.shake = 0.25; DW.Audio.sfx('swoosh');
      if (!once(ow, x, y)) { await say('Quelques feuilles tombent... Il n\'y a plus rien à cueillir aujourd\'hui.'); await wear('baton'); return; }
      const r = Math.random();
      await wear('baton');
      if (r < 0.18) { await say('Quelque chose tombe de l\'arbre !'); await give(DW.pick(FRUIT[kind] || FRUIT.tree)); emote(ow, 'heart'); }
      else if (r < 0.28 && await ambush(ow, 'Un %s caché dans les branches te tombe dessus !')) return;
      else await say('Des feuilles virevoltent... mais rien d\'autre.');
    },
    async search(ow, x, y, what) {
      if (!st().bag.pelle) { await say(DW.Town.has('gotsumon') ? `Il y a peut-être quelque chose ${what.startsWith('sous') || what.startsWith('autour') ? what : 'dans ' + what}... Il te faudrait une Petite pelle (Bazar de Gotsumon).` : `Rien de particulier... à première vue.`); return; }
      if (!once(ow, x, y)) { await say(`Tu as déjà fouillé ${what} aujourd'hui.`); return; }
      const r = Math.random();
      await wear('pelle');
      if (r < 0.16) await give(DW.pick(['digichampi', 'viande', 'soin_p', 'eau_source', 'sel', 'truffe']));
      else if (r < 0.24 && await ambush(ow, 'Un %s dérangé dans sa cachette t\'attaque !')) return;
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
      const m = pt(), sel = !spring && Paysage.salee(ow.map, x, y);
      if (sel === 'lave') { await say(m ? `La lave bouillonne et crache des gerbes de feu... ${m.name} recule d'un bond !` : 'La lave bouillonne et crache des gerbes de feu...'); return; }
      // eau trouble (marais) : on ne la boit pas
      if (sel === 'trouble') {
        const rod = DW.Peche && DW.Peche.has();
        const r = await DW.ask('Une eau trouble, verdâtre, qui sent la vase.', [...(rod ? ['Pêcher'] : []), 'Rien']);
        if (rod && r === 0) { await DW.Peche.cast(ow, 'lac'); return; }
        if (m) await say(`${m.name} renifle l'eau et recule : « Pouah ! » Mieux vaut ne pas boire ça.`);
        return;
      }
      // la mer (plage, crique, dunes, côte de la ville, mer du Pays de Meramon, eau « mer » peinte) : salée, elle ne désaltère pas
      if (sel) {
        const rod = DW.Peche && DW.Peche.has();
        const r = await DW.ask('Les vagues viennent mourir sur le sable.', ['Goûter l\'eau', 'Jouer dans les vagues', ...(rod ? ['Pêcher'] : []), 'Rien']);
        if (rod && r === 2) { await DW.Peche.cast(ow, 'mer'); return; }
        if (r === 0 && m) { DW.Audio.sfx('bump'); m.addHappy(-1); await say(`${m.name} recrache aussitôt : « Beurk, c'est salé ! » (L'eau de mer ne désaltère pas.)`); }
        else if (r === 1 && m) { DW.Audio.sfx('water'); m.addHappy(3); emote(ow, 'note'); await say(`${m.name} saute dans les vagues en riant ! (bonheur +3)`); }
        return;
      }
      // canne à pêche de Gomamon (game/peche.js) : partout sauf dans une source
      const rod = !spring && DW.Peche && DW.Peche.has();
      if (!m && !rod) { await say(spring ? 'Une source d\'eau claire.' : 'L\'eau est fraîche.'); return; }
      const ch = [...(m ? ['Boire un peu', 'Jouer dans l\'eau'] : []), ...(rod ? ['Pêcher'] : []), 'Rien'];
      const pick = ch[await DW.ask(spring ? 'Une source d\'eau claire.' : 'L\'eau clapote.', ch)];
      if (pick === 'Pêcher') { await DW.Peche.cast(ow, DW.Peche.kindAt(ow)); return; }
      const r = pick === 'Boire un peu' ? 0 : pick === 'Jouer dans l\'eau' ? 1 : 2;
      if (r === 0) { const thirsty = DW.Care.drink(m, spring ? 80 : 50); m.tired = Math.max(0, m.tired - 5); DW.Audio.sfx('water'); await say(thirsty ? `${m.name} boit à grandes gorgées. Ça fait du bien ! (soif étanchée)` : `${m.name} trempe les lèvres... Il n'avait pas vraiment soif.`); if (spring && once(ow, x, y)) await give('eau_source'); }
      else if (r === 1) { DW.Audio.sfx('water'); m.addHappy(3); emote(ow, 'note'); await say(`${m.name} s'éclabousse en riant ! (bonheur +3)`); }
    },
    async flowers(ow, x, y) {
      const m = pt();
      if (!m) { await say('De jolies fleurs sauvages.'); return; }
      if (once(ow, x, y)) { m.addHappy(2); emote(ow, 'heart'); await say(`${m.name} plonge le nez dans les fleurs... Atchoum ! Il a l'air ravi. (bonheur +2)`); }
      else await say(`${m.name} regarde les fleurs, rêveur.`);
    },
    // PUITS : plein (v 0) on y boit, ou l'on fait un vœu ; vide (v 1) à sec, seulement le vœu
    async well(ow, x, y, v) {
      const m = pt();
      if (v === 1) { await say('Le puits est à sec... On voit la terre craquelée tout au fond.'); return ACTS.wish(ow, x, y, true); }
      const ch = [...(m ? ['Boire'] : []), 'Faire un vœu (1 Bit)', 'Rien'];
      const pick = ch[await DW.ask('Un puits plein d\'eau fraîche.', ch)];
      if (pick === 'Boire') {
        DW.Audio.sfx('water');
        const thirsty = DW.Care.drink(m, 70); m.tired = Math.max(0, m.tired - 3);
        await say(thirsty ? `Tu remontes le seau. ${m.name} boit l'eau glacée du puits... Ça fait du bien ! (soif étanchée)` : `Tu remontes le seau. ${m.name} trempe les lèvres... Il n'avait pas vraiment soif.`);
      } else if (pick === 'Faire un vœu (1 Bit)') await ACTS.wish(ow, x, y, true);
    },
    async wish(ow, x, y, deja) {
      if (!deja && (await DW.ask('Un vieux puits. Jeter 1 Bit et faire un vœu ?', ['Oui', 'Non'])) !== 0) return;
      if (deja && (await DW.ask('Jeter 1 Bit et faire un vœu ?', ['Oui', 'Non'])) !== 0) return;
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
    glowshroom: ['pick'], giantshroom: ['pick'], bench: ['sit'], log: ['sit'], spring: ['water', true], well: ['well'],
    troncouche: ['sit'], champignons: ['pick'], rochersmousse: ['search', 'sous les rochers moussus'], blocs: ['search', 'entre les blocs'], rochercotier: ['search', 'autour du rocher'] };

  // EAU SALÉE ? On ne boit qu'aux puits, aux sources et à l'eau douce de l'intérieur (rivières, étangs, lacs).
  //  « ≈ » mer peinte : salée ; « ≋ » eau douce peinte : douce ; « ≃ » eau trouble : imbuvable ('trouble') ;
  //  la région de la plage (plage, crique, dunes) : salée ; une carte peut dire elle-même où est sa mer (map.sel, ex. la côte
  //  de la ville) ; les cartes bordées par la mer (map.mer, ex. le Pays de Meramon) : l'eau qui touche le bord de la carte.
  function salee(map, x, y) {
    const c = map.rows[y] && map.rows[y][x];
    if (c === '≈') return true;
    if (c === '≋' || c === '5') return false;
    if (c === '≃') return 'trouble';
    if (c === 'ȴ') return 'lave';
    if (map.region === 'plage') return true;
    if (typeof map.sel === 'function') return !!map.sel(x, y);
    if (map.mer) return mer(map).has(y * map.w + x);
    return false;
  }
  // (cases d'eau reliées au bord de la carte : la mer qui entoure l'île ; calculé une fois par état de la carte)
  function mer(map) {
    if (map._merFor === map.rows) return map._mer;
    const W = map.w, H = map.h, out = new Set(), q = [];
    const eau = (x, y) => { const I = DW.World.CH[map.rows[y][x]]; return I && I.t === 'water' && map.rows[y][x] !== '≋'; };
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) if (eau(x, y)) { out.add(y * W + x); q.push([x, y]); }
    for (let y = 0; y < H; y++) for (const x of [0, W - 1]) if (eau(x, y) && !out.has(y * W + x)) { out.add(y * W + x); q.push([x, y]); }
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || out.has(ny * W + nx) || !eau(nx, ny)) continue; out.add(ny * W + nx); q.push([nx, ny]); } }
    map._mer = out; map._merFor = map.rows;
    return out;
  }

  const Paysage = DW.Paysage = {
    salee,
    // action pour la case visée (ou null)
    act(ow, x, y) {
      const ch = ow.tileAt(x, y), I = DW.World.info(ch);
      const b = I.obj && BY_OBJ[I.obj];
      if (b) return () => ACTS[b[0]](ow, x, y, b[0] === 'well' ? I.v || 0 : b[1]);
      // objet posé (cartes faites main, éditeur de cartes) : on agit sur toute son emprise
      const o = (ow.map.objects || []).find(q => BY_OBJ[q.kind] && x >= q.x && x < q.x + (q.w || 1) && y >= q.y && y < q.y + (q.h || 1));
      if (o) { const b2 = BY_OBJ[o.kind]; return () => ACTS[b2[0]](ow, x, y, b2[0] === 'well' ? o.v || 0 : b2[1]); }
      if (I.t === 'water' && DW.SOLID.has(ch)) return () => ACTS.water(ow, x, y, false);   // (toutes les eaux ; pas les pierres de gué)
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
