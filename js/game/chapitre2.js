'use strict';
// =====================================================================
//  CHAPITRE 2 — « Le Lac et le Loup » (saison 1, épisode 3 : Garurumon)
//  1) Rive Sud (lac0) : deux Monochromon se battent pour le chemin ; le vainqueur le garde (boss intermédiaire).
//  2) Lac du Tramway (lac2), redessiné : un grand lac, une île avec le vieux tramway, une langue de sable pour y aller.
//     La nuit (20 h - 5 h), Matt joue de l'harmonica près de son feu de camp, sur l'île, avec Gabumon.
//  3) La veillée : une braise tombe sur la « feuille rouge »... c'est la queue de Seadramon ! Combat ;
//     Gabumon digivolue en Garurumon à 40 % des PV de Seadramon et vient t'aider.
//  4) Cinématique (Renard de feu, les Gomamon ramènent l'île, l'aube à l'harmonica), Matt s'installe chez toi.
//     Matt cherche TK : la piste pour plus tard. Bilan, puis le carton du chapitre 3.
//  (héros original seulement ; avec un autre enfant, Seadramon reste le boss du Lac de l'Œil du Dragon : game/story.js)
// =====================================================================
(function () {
  const { Audio, Game, UI } = DW;
  const W = DW.W, H = DW.H, TS = 16;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const MAPS = DW.MAPS;
  const perso = () => st().hero === 'perso';
  const ch2 = () => (st().flags.chapter || 1) >= 2;
  const night = () => { const h = DW.Time.hour(); return h >= 20 || h < 5; };
  const kidMatt = () => !!(st().kids || {}).matt;

  // ------------------------------------------------------------ objets : feu de camp, « feuille rouge » (bout de la queue de Seadramon)
  Object.assign(DW.World.OBJ, {
    campfire: { w: 24, h: 20, n: 1, fire: [12, 9], lights: [[12, 9, 64]], draw(d) {
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; d.ell(12 + Math.cos(a) * 9, 15 + Math.sin(a) * 3, 2.4, 1.8, ['#8a847a', '#7a746a', '#9a948a'][i % 3], 0, { tex: 0.3 }); }
      d.tube([[5, 15], [19, 11]], 1.6, 1.4, '#6a4424'); d.tube([[5, 11], [19, 15]], 1.6, 1.4, '#7a4e2a');
      d.ell(12, 12, 5, 2, '#ff7a20', 0, { unlit: true, noline: true }); d.ell(12, 10, 3, 3, '#ffd060', 0, { unlit: true, noline: true });
    } },
    seatail: { w: 30, h: 16, n: 1, draw(d) {
      d.poly([[1, 12], [8, 3], [18, 1], [29, 6], [22, 12], [10, 15]], '#d8402a', { shiny: true });
      d.deco.line(3, 12, 26, 6, 0.7, '#8a1a10');
      for (const [x, y] of [[9, 10], [14, 8], [19, 7]]) d.deco.line(x, y, x + 3, y - 4, 0.5, '#8a1a10');
    } },
  });

  // ------------------------------------------------------------ 2) Lac du Tramway redessiné
  const LX = 47, LY = 46, IX = 47, IY = 47;   // centre du lac, centre de l'île
  const L = MAPS.lac2;
  if (L && L.spec) {
    delete L.piece;
    L.objects = L.objects.filter(o => o.kind !== 'tram');
    for (const k in L.signs) if (/tramway/i.test(String(L.signs[k]))) delete L.signs[k];
    // (espaces ouverts du gabarit : seulement ceux du nord, hors du lac — sinon des ponts menaient dans le vide)
    // (au centre du grand lac : de l'eau jusqu'aux bords, comme sur les cartes voisines ; on arrive par le nord)
    L.spec.rooms = [];
    Object.assign(L.spec, { hub: [IX, IY], lakes: [{ x: LX, y: LY, rx: 80, ry: 60 }], tall: [], clearings: [], lm: [] });
    L.objects.push(
      { kind: 'tram', x: 44, y: 45, w: 4, h: 1 },
      { kind: 'campfire', x: 47, y: 48, w: 1, h: 1, small: true },
      { kind: 'seatail', x: 52, y: 47, w: 1, h: 1, small: true, tail: true },
    );
    L.spec.post = g => {
      // l'île (herbe, bord de sable) et la langue de sable qui la relie à la rive nord
      for (let y = IY - 5; y <= IY + 5; y++) for (let x = IX - 9; x <= IX + 9; x++) {
        const d = Math.hypot((x - IX) / 8, (y - IY) / 3.6);
        if (d < 0.8) g.set(x, y, '.'); else if (d < 1.1) g.set(x, y, 's');
      }
      // langue de sable depuis le ponton du nord (alignée sur le passage)
      { const ux = L.exits.up[0] + (L.exits.up[1] >> 1);
        for (let y = 0; y < IY - 2; y++) { const x0 = Math.round(ux + (IX - ux) * Math.max(0, (y - 6) / (IY - 8))); for (const x of [x0 - 1, x0, x0 + 1]) { const c = g.get(x, y); if (c === '~' || c === 'w' || c === '_' || DW.SOLID.has(c)) g.set(x, y, y < 3 ? '=' : 's'); } } }
      // roseaux sur les berges
      for (let y = 30; y < 62; y++) for (let x = 20; x < 75; x++) {
        if (!'.,'.includes(g.get(x, y)) || DW.Art.hash(x, y, 77) > 0.3) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g.get(x + dx, y + dy) === '~') && Math.abs(x - IX) > 10) g.set(x, y, 'Ð');
      }
    };
    L.signs['47,48'] = async () => { await say(night() && !kidMatt() && perso() && ch2() ? 'Le feu crépite. Matt fixe les flammes, son harmonica à la main.' : 'Un feu de camp. Les braises sont encore tièdes...'); };
    L.signs['46,45'] = async () => {
      await say("Un vieux tramway échoué sur l'île. Personne ne sait comment il est arrivé là... Une couverture et un sac traînent sur la banquette.");
      // (Matt ne vient qu'à la nuit tombée : on peut l'attendre ici, sur la banquette)
      const s = st(), h = DW.Time.hour();
      if (!perso() || !ch2() || !s.flags.monoCh2 || kidMatt() || h < 5 || h >= 20) return;
      if ((await DW.ask("S'allonger sur la banquette et attendre le soir ?", ['Oui', 'Non'], null, 1)) !== 0) return;
      await DW.fade(1, 0.6); s.clock = Math.floor(s.clock / 1440) * 1440 + 20 * 60 + 5; await DW.wait(0.4); await DW.fade(0, 0.6);
      await say("Le soleil s'est couché sur le lac... Au loin, quelqu'un joue de l'harmonica.");
    };
    // la « feuille rouge » disparaît une fois Seadramon vaincu
    L.populate = function () {
      const gone = !!st().flags.seadramon, has = this.objects.some(o => o.tail);
      if (gone && has) { this.objects = this.objects.filter(o => !o.tail); if (this.gfx) DW.World.unprepare(this); }
      if (gone) delete this.signs['52,47'];
    };
    L.signs['52,47'] = async () => { await say("Une grande feuille rouge, posée au bord de l'île. Elle est... tiède ? Et elle bouge un peu, on dirait qu'elle respire."); };
    const visible = s => perso() && ch2() && !!s.flags.monoCh2 && !(s.kids || {}).matt && night();
    L.npcs.push(
      { hero: 'matt', x: 45, y: 48, face: 'right', cond: visible, talk: ow => mattScene(ow) },
      { sp: 'gabumon', x: 49, y: 48, face: 'left', cond: visible, talk: async () => { await say(st().flags.mattMet ? "Matt ne dort plus depuis qu'on est arrivés... Il pense à TK tout le temps." : "Bonsoir ! Tu es un ami de Matt ? Va lui parler, il est près du feu.", 'Gabumon'); } },
    );
    // l'harmonica, la nuit, tant que Matt campe ici (aussi après un combat : game/overworld.js, musique)
    L.musicNow = () => (visible(st()) ? 'harmonica' : null);
    L.onEnter = async ow => {
      if (!visible(st())) return;
      Audio.play('harmonica');
      if (!st().flags.harmo) { st().flags.harmo = true; await say("Une mélodie d'harmonica flotte sur le lac... Elle vient de l'île, au milieu de l'eau, où brille un petit feu."); }
    };
  }

  // ------------------------------------------------------------ 1) Rive Sud : les deux Monochromon
  const R0 = MAPS.lac0;
  if (R0 && R0.spec) {
    const spot = () => { const [p] = R0.exits.right; return DW.MapKit.freeNear(R0, R0.w - 9, p + 2); };   // (la case libre la plus proche du chemin)
    R0.populate = function () {
      if (this.monoSet) return;
      this.monoSet = true;
      const [x, y] = spot();
      this.npcs.push(
        { sp: 'monochromon', x, y, face: 'left', mono: true, cond: s => ch2() && !s.flags.monoCh2, talk: ow => monoFight(ow) },
        { sp: 'monochromon', x: x + 1, y: y + 2, face: 'left', cond: s => ch2() && !s.flags.monoSeen, talk: () => say('GRRROOOH !', 'Monochromon') },
      );
    };
    // le chemin du lac est gardé tant que Monochromon n'est pas vaincu. Il se tient près de la sortie est (Ponton des
    // Pêcheurs) ; à l'ouest (Rosière), c'est un voile de données levé par le combat qui barre le sentier (comme au chapitre 1 :
    // il se dissipe quand le calme revient). La règle de chapitre déjà posée sur le passage (atelier des cartes, maps/puzzle.js :
    // Rosière ↔ Rive Sud fermé après le chapitre 3) s'AJOUTE à la garde au lieu d'être écrasée (avant : sens unique au chapitre 4)
    for (const w of R0.warps.filter(w0 => w0.to === 'lac1' || w0.to === 'lac3')) {
      const cond0 = w.cond, lock0 = w.lock;
      const garde = w.to === 'lac1' ? "Un voile de données barre le sentier de l'ouest, vers la Rosière... Il s'est levé avec le combat des deux Monochromon : tant que le vainqueur fait la loi sur la rive, plus loin à l'est, il ne se dissipera pas !"
        : "Monochromon te barre la route en grattant le sol de ses pattes. Impossible de passer tant qu'il garde les rives du lac !";
      w.cond = s => (!cond0 || cond0(s)) && (!ch2() || !!s.flags.monoCh2);
      w.lock = () => (cond0 && !cond0(st()) ? (typeof lock0 === 'function' ? lock0() : lock0) : garde);
    }
    R0.onEnter = async ow => {
      const s = st();
      if (!ch2() || s.flags.monoSeen) return;
      s.flags.monoSeen = true;
      ow.cine = true; ow.wilds = [];
      ow.shake = 0.8; Audio.sfx('hit');
      await say("BAM ! BAM ! Un fracas terrible résonne le long de la rive...");
      await say(`Plus loin à l'est, deux Monochromon se battent à grands coups de cornes ! Ils se disputent le chemin du lac.`);
      for (let i = 0; i < 3; i++) { ow.shake = 0.5; Audio.sfx('hit'); await DW.wait(0.35); }
      await say("Le plus petit finit par céder et s'enfuit dans les roseaux. Le vainqueur, encore furieux, se plante au milieu du chemin...");
      const rival = ow.map.npcs.find(n => n.sp === 'monochromon' && !n.mono);
      if (rival) ow.map.npcs.splice(ow.map.npcs.indexOf(rival), 1);
      const pt = ow.partner;
      if (pt) await say(`${pt.name} : Il est énorme... Sa carapace a l'air dure comme le diamant ! Il faudra le battre pour passer.`);
      ow.cine = false;
    };
  }
  async function monoFight(ow) {
    const s = st();
    await say('GRRROOOH ! (Monochromon gratte le sol, tête baissée. Il ne laissera passer personne !)', 'Monochromon');
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Soigne-le d'abord."); return; }
    if ((await DW.ask('Affronter Monochromon ? (un Champion à la carapace très dure)')) !== 0) return;
    const res = await ow.battle({ enemy: new DW.Digimon('monochromon', 21), boss: true, canLose: true, music: 'boss', intro: 'Monochromon charge, la corne en avant !' });
    if (res !== 'win') {
      await say('Monochromon est trop solide... Entraîne-toi et reviens !');
      await ow.bossDefeat("Hohoho... Tu as foncé tête baissée contre un Monochromon ? Sa carapace est dure, mais l'eau lui fait très mal. Prépare-toi, et emporte des RAM !");
      return;
    }
    s.flags.monoCh2 = true;
    ow.shake = 0.5; Audio.sfx('fanfare');
    await say("Monochromon secoue la tête... puis s'écarte du chemin en grognant. Il retourne brouter dans les roseaux. À l'ouest, le voile de données qui barrait le sentier se dissipe.");
    DW.Trophies.give('monochromon'); if (DW.Cards) DW.Cards.give('monochromon');
    s.bits += 400;
    const extra = DW.giveItem('soin_m', 2);
    await say(`Tu reçois le Trophée de Monochromon ! (Il rejoint la cave de ta maison.)  Par terre, tu trouves 2 RAM PV+ et 400 Bits.${DW.extraMsg(extra)}`);
    if (perso()) await say("Le chemin du lac est libre. On raconte qu'au Lac du Tramway, la nuit, quelqu'un joue de l'harmonica...");
    DW.autosave();
  }

  // ------------------------------------------------------------ 3) Matt, la veillée et Seadramon
  async function mattScene(ow) {
    const s = st(), f = s.flags;
    if (!f.mattMet) {
      await say("...Qui va là ? Ah. Un humain. Toi aussi, tu étais au camp d'été ?", 'Matt');
      await say(`${s.name}, c'est ça ? Moi, c'est Matt. Et lui, c'est Gabumon.`, 'Matt');
      await say('Bonsoir ! Ça fait du bien de voir quelqu\'un de gentil.', 'Gabumon');
      await say("Je cherche mon petit frère, TK. On a été séparés en tombant sur cette île... Il n'a que huit ans.", 'Matt');
      await say("Le soir, je joue de l'harmonica. Il connaît cet air par cœur. S'il l'entend... il saura que je suis là.", 'Matt');
      if ((s.kids || {}).tai) await say("Tai est chez toi ? Hmph. Toujours à foncer tête baissée, celui-là... Mais tant mieux s'il va bien.", 'Matt');
      f.mattMet = true;
    } else await say("Toujours là ? Assieds-toi, si tu veux. Le feu est assez grand pour deux.", 'Matt');
    if (!s.party.some(m => m.hp > 0)) { await say("(Ton partenaire est épuisé... Mieux vaut le soigner avant de passer la nuit ici.)"); return; }
    if ((await DW.ask('Veiller près du feu avec Matt ?', ['Oui', 'Pas maintenant'])) !== 0) { await say("Comme tu veux. Je serai là demain soir... et les suivants.", 'Matt'); return; }
    // la veillée
    ow.cine = true; ow.wilds = [];
    await DW.fade(0.55, 0.8);
    Audio.play('harmonica');
    await say("Vous restez près du feu. Matt joue de l'harmonica ; le lac est noir et calme. Les Digimon s'endorment l'un contre l'autre...");
    await DW.fade(0, 0.8);
    Audio.sfx('select');
    await say("CRAC ! Une bûche s'effondre. Une braise s'envole... et retombe sur une grande feuille rouge qui flottait au bord de l'île, dans le noir.");
    ow.shake = 1.2; Audio.sfx('roar');
    await say("La « feuille » se tord de douleur ! L'île tout entière tremble...");
    // Seadramon jaillit du lac, à l'est de l'île
    const S = { sp: 'seadramon', x: 56 * TS, y: 53 * TS, s: 0.5, sil: true, flip: true, shadow: 0 };   // (tourné vers l'île, à l'ouest)
    ow.flyers = [S];
    Audio.sfx('swoosh');
    await DW.tween(S, { y: 46 * TS, s: 1, sil: false }, 1.2, t => t * (2 - t));
    S.sil = false;
    ow.shake = 1; Audio.play('seadramon');
    await say("Ce n'était pas une feuille : c'était le bout de la queue de SEADRAMON, endormi sous l'île ! Et l'île... dérive vers le milieu du lac !");
    await say('QUI OSE ME BRÛLER LA QUEUE ?! JE VAIS VOUS ENGLOUTIR !', 'Seadramon');
    await say('Gabumon, attention !', 'Matt');
    Audio.sfx('hit'); ow.shake = 0.6;
    await say("Gabumon se jette sur Seadramon... et se fait balayer d'un coup de queue !");
    await say(`${s.name} ! Gabumon est trop faible pour lui... Aide-nous !`, 'Matt');
    ow.flyers = null; ow.cine = false;
    const res = await ow.battle({
      enemy: new DW.Digimon('seadramon', 26), boss: true, canLose: true, music: 'seadramon', intro: 'Seadramon dresse sa tête au-dessus des vagues !',
      ally: { at: 0.4, from: 'gabumon', sp: 'garurumon', lvl: 19, hero: 'matt', name: 'Matt', move: 'flamme_bleue',
        join: "« GABUMOOON ! » Le Digivice de Matt s'illumine... GABUMON DIGIVOLUE EN... GARURUMON !" },
    });
    if (res !== 'win') {
      await say("Seadramon est bien trop fort... Une vague énorme balaie l'île !");
      await ow.bossDefeat("Hohoho... Des Gomamon t'ont repêché et ramené sur la rive. Matt et Gabumon s'en sont sortis, eux aussi : ils retournent camper sur l'île chaque nuit. Prépare-toi bien avant d'y retourner !");
      return;
    }
    await victory(ow);
  }

  // ------------------------------------------------------------ 4) victoire : cinématique, Matt délivré, fin du chapitre
  async function victory(ow) {
    const s = st();
    s.flags.seadramon = true;
    s.gears = s.gears || {}; s.gears.lac = true;   // (l'Engrenage Noir du lac est brisé : Shellmon, à la Pointe Coela, peut venir en ville)
    DW.Crests.freeKid('matt');
    await Game.push(new SeadramonCinema());
    // l'aube, sur l'île revenue contre la rive
    const h = DW.Time.hour(), day = Math.floor(s.clock / 1440);
    s.clock = (h >= 20 ? day + 1 : day) * 1440 + 6 * 60;
    // (la veillée compte comme une nuit : avant, le partenaire s'effondrait de fatigue chez Jijimon, « nuit blanche »)
    for (const d of s.party) { d.slept = s.clock; d.tired = 0; }
    s.careClock = s.clock;
    await ow.charger('lac2', 47, 49, 'up');
    const kids = [];
    const free = [[45, 49], [49, 49], [44, 50], [50, 50]].filter(([x, y]) => !ow.solid(x, y));
    if (free[0]) kids.push({ hero: 'matt', x: free[0][0], y: free[0][1], face: 'right', talk: () => {} });
    if (free[1]) kids.push({ sp: 'gabumon', x: free[1][0], y: free[1][1], face: 'left', talk: () => {} });
    ow.map.npcs.push(...kids);
    Audio.play('harmonica');
    await DW.fade(0, 0.8);
    await say("...Merci. Sans toi, Gabumon et moi, on serait au fond du lac.", 'Matt');
    await say("Matt ! J'ai digivolué ! Tu as vu ? Garurumon ! C'était moi !", 'Gabumon');
    await say("Ouais. J'ai vu. ...Tu as été génial.", 'Matt');
    await say(`Tout seul, je ne retrouverai jamais TK. ${s.name}... La Ville des Fichiers, c'est ça ? D'accord, je viens chez toi. Mais au moindre signe de TK, je repars le chercher.`, 'Matt');
    if ((s.kids || {}).tai) await say("Et si Tai me cherche des histoires, je dors dehors. Hmph.", 'Matt');
    DW.Audio.sfx('fanfare');
    await say("Matt et Gabumon s'installent dans une chambre de ta maison !");
    for (const k of kids) ow.map.npcs.splice(ow.map.npcs.indexOf(k), 1);
    // Seadramon, libéré de son Engrenage Noir, devient le passeur de la ville
    await say("Au bord de l'eau, Seadramon sort la tête du lac, l'air penaud. Une marque noire a disparu de son cou.");
    await say("Grmbl... Pardon pour la queue. Enfin, pour vous avoir attaqués. Cet engrenage me brûlait la tête... Je vous dois une fière chandelle.", 'Seadramon');
    await DW.Town.recruit('seadramon');
    DW.Trophies.give('seadramon'); Audio.sfx('fanfare');
    if (DW.Cards) { DW.Cards.give('seadramon'); DW.Cards.give('garurumon'); DW.Cards.give('gabumon'); }
    s.party.forEach(m => m.heal());
    const extra = DW.giveItem('soin_m', 3) + DW.giveItem('pm_m', 2); s.bits += 1000;
    await say(`Tu reçois le Trophée de Seadramon !  Dans le sac de Matt, il y avait 3 RAM PV+, 2 RAM PM+ et 1000 Bits : « Prends-les, j'en ai plus besoin. »${DW.extraMsg(extra)}`);
    await DW.fade(1, 0.8);
    await ow.charger('maison', 12, 5, 'down');
    await DW.wait(0.3);
    await DW.fade(0, 0.8);
    DW.autosave();
    await end2();
  }

  // ------------------------------------------------------------ cinématique : Renard de feu, l'île qui revient, l'aube
  class SeadramonCinema extends DW.ShellmonCinema {
    async run() {
      const s = st(), pt = s.party.find(m => m.hp > 0) || s.party[0];
      this.pt = pt ? pt.sp : 'agumon';
      this.v.beam = 0; this.v.drift = 0;
      DW.tween(this.bars, { v: 1 }, 0.8);
      await DW.fade(0, 0.6);
      // 1) la nuit sur le lac : Garurumon contre Seadramon
      DW.tween(this.v, { shake: 1 }, 0.8);
      await this.show("Garurumon bondit de l'île, sa fourrure brillant sous la lune...", 2.4);
      Audio.sfx('swoosh');
      await DW.tween(this.v, { beam: 1 }, 0.6);
      await this.show('« RENARD DE FEU ! »', 1.6);
      Audio.sfx('roar'); this.flash = 1;
      await DW.tween(this.v, { boom: 1 }, 1.4);
      // 2) l'Engrenage Noir
      this.v.shake = 0;
      await this.cut('gear', 0.9);
      Audio.stop(); Audio.sfx('evolve');
      await DW.tween(this.v, { gear: 1 }, 1.4);
      await this.show("Un Engrenage Noir s'arrache du cou de Seadramon...", 2.2);
      Audio.sfx('hit');
      await DW.tween(this.v, { data: 1 }, 2.4, DW.linear);
      await this.show('... et se désagrège en éclats de données.', 2);
      // 3) les Gomamon ramènent l'île contre la rive
      await this.cut('drift', 1);
      Audio.play('beach');
      DW.tween(this.v, { drift: 1 }, 5, DW.linear);
      await this.show("Les Gomamon du lac ont tout vu. Ils appellent les poissons... et poussent l'île, tout doucement, jusqu'à la rive.", 3.4);
      // 4) l'aube et l'harmonica
      await this.cut('dawn', 1.2);
      Audio.play('harmonica');
      DW.tween(this.v, { sun: 1 }, 7);
      await DW.wait(1.2);
      await this.show(`Le soleil se lève sur le lac. Matt joue de l'harmonica ; ${s.name}, Gabumon et ${pt ? pt.name : 'ton partenaire'} écoutent en silence.`, 3.2);
      await this.show("« TK... Où que tu sois, tiens bon. Je vais te retrouver. »", 3);
      await DW.fade(1, 0.9);
      this.bars.v = 0;
    }
    // la nuit sur le lac (plan 1)
    drawCave(c, t) {
      const v = this.v;
      this.lakeNight(c, t);
      // Seadramon dressé au-dessus des vagues
      const sd = DW.Sprites.battle('seadramon');
      c.save(); c.globalAlpha = 1 - v.boom * 0.85;
      DW.Sprites.draw(c, sd, 228 + Math.sin(t * 30) * 3 * v.shake * (1 - v.boom), 150 + v.boom * 50, { frame: Math.floor(t * 6), scale: 1.2, flip: true, white: v.boom > 0.05 ? Math.min(1, v.boom * 2) : 0 });   // (face à Garurumon)
      c.restore();
      // Garurumon sur l'île
      DW.Sprites.draw(c, DW.Sprites.battle('garurumon'), 96, 172, { frame: Math.floor(t * 6), scale: 0.6 });
      // le Renard de feu : un torrent de flammes bleues
      if (v.beam > 0 && v.boom < 1) {
        const x0 = 122, y0 = 138, x1 = DW.lerp(x0, 222, v.beam), y1 = DW.lerp(y0, 110, v.beam);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) { c.strokeStyle = `rgba(${90 + i * 20},${180 + i * 10},255,${0.5 - i * 0.07})`; c.lineWidth = 16 - i * 2.4 + Math.sin(t * 40 + i) * 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
        c.restore();
      }
      if (v.boom > 0) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = 16 + v.boom * 60; c.fillStyle = `rgba(200,230,255,${0.5 * (1 - v.boom)})`; c.beginPath(); c.arc(228 + Math.cos(a) * r, 160 + Math.sin(a) * r * 0.35, 6 + v.boom * 6, 0, 7); c.fill(); }
    }
    lakeNight(c, t, island = 1) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#060a1e'); g.addColorStop(0.5, '#141e46'); g.addColorStop(1, '#0a1430');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t * 2 + i)})`; c.fillRect((i * 53) % W, (i * 29) % 90, 1, 1); }
      c.fillStyle = '#f0f0d8'; c.beginPath(); c.arc(262, 40, 12, 0, 7); c.fill();
      c.fillStyle = '#0c1838'; c.fillRect(0, 120, W, H - 120);
      for (let i = 0; i < 16; i++) { c.fillStyle = 'rgba(200,220,255,0.18)'; c.fillRect((i * 41 + t * 8) % W, 128 + (i * 13) % 80, 14, 1); }
      c.fillStyle = 'rgba(240,240,200,0.25)'; for (let i = 0; i < 8; i++) c.fillRect(256 - i * 2 + Math.sin(t * 3 + i) * 3, 126 + i * 6, 12 + i * 2, 1);
      // l'île, le tramway et le feu
      const ix = 70 * island;
      c.fillStyle = '#1a2a18'; c.beginPath(); c.ellipse(ix + 20, 176, 76, 16, 0, 0, 7); c.fill();
      c.fillStyle = '#2a2420'; c.fillRect(ix - 40, 144, 64, 26); c.fillStyle = '#3a6a4a'; c.fillRect(ix - 42, 140, 68, 6);
      for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(255,220,140,0.55)'; c.fillRect(ix - 36 + i * 12, 150, 8, 8); }
      const f = 0.8 + 0.2 * Math.sin(t * 13);
      const rg = c.createRadialGradient(ix + 44, 168, 2, ix + 44, 168, 40 * f); rg.addColorStop(0, 'rgba(255,170,70,0.6)'); rg.addColorStop(1, 'rgba(255,120,40,0)');
      c.fillStyle = rg; c.fillRect(ix, 120, 90, 90);
      c.fillStyle = '#ffb040'; c.beginPath(); c.ellipse(ix + 44, 166, 3 * f, 6 * f, 0, 0, 7); c.fill();
    }
    // plans 3 (l'île poussée vers la rive) et 4 (l'aube)
    drawBeach(c, t) {
      const v = this.v;
      if (this.mode === 'drift') {
        this.lakeNight(c, t, 1 + (1 - v.drift) * 1.4);
        const ix = 70 * (1 + (1 - v.drift) * 1.4);
        // la rive, à gauche, que l'île rejoint
        c.fillStyle = '#16261a'; c.fillRect(0, 150, 26, H - 150);
        for (let i = 0; i < 4; i++) DW.Sprites.draw(c, DW.Sprites.battle('gomamon'), ix + 70 + (i % 2) * 22, 196 + Math.sin(t * 4 + i) * 2 + (i >> 1) * 10, { frame: Math.floor(t * 6) + i, scale: 0.35, flip: true });
        return;
      }
      // l'aube
      const g = c.createLinearGradient(0, 0, 0, 140); g.addColorStop(0, '#3a4a8a'); g.addColorStop(0.55, '#e88a6a'); g.addColorStop(1, '#ffd890');
      c.fillStyle = g; c.fillRect(0, 0, W, 140);
      const sy = 136 - v.sun * 46;
      const rg = c.createRadialGradient(W / 2 + 40, sy, 4, W / 2 + 40, sy, 70); rg.addColorStop(0, '#fff8d0'); rg.addColorStop(0.3, '#ffd070'); rg.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = rg; c.fillRect(0, 0, W, 140);
      c.fillStyle = '#fff0b0'; c.beginPath(); c.arc(W / 2 + 40, sy, 14, 0, 7); c.fill();
      c.fillStyle = '#5a6aa0'; c.fillRect(0, 128, W, 44);
      for (let i = 0; i < 16; i++) { c.fillStyle = `rgba(255,230,170,${0.3 + 0.3 * Math.sin(t * 2 + i)})`; c.fillRect(W / 2 + 20 + Math.sin(i * 7) * 40, 132 + i * 2, 22 - i, 1); }
      c.fillStyle = '#1c1a20'; c.fillRect(0, 170, W, H - 170);
      c.fillStyle = '#141218'; c.fillRect(30, 140, 60, 30); c.fillRect(28, 136, 64, 5);
      const sil = (img, x, y, w, h) => { const cv = DW.Art.canvas(w, h), x2 = cv.getContext('2d'); x2.drawImage(img, 0, 0, w, h); x2.globalCompositeOperation = 'source-in'; x2.fillStyle = '#16121a'; x2.fillRect(0, 0, w, h); c.drawImage(cv, Math.round(x - w / 2), Math.round(y - h)); };
      const me = DW.Sprites.hero('up', 0), mt = DW.Sprites.hero('up', 0, 'matt');
      sil(me.img, 150, 194, me.w * 1.6, me.h * 1.6);
      sil(mt.img, 188, 194, mt.w * 1.6, mt.h * 1.6);
      const ps = DW.Sprites.battle(this.pt), gb = DW.Sprites.battle('gabumon');
      const k1 = Math.min(0.7, 40 / ps.h), k2 = Math.min(0.7, 34 / gb.h);   // (un Champion ne cache pas les enfants)
      sil(ps.img, 116, 196, ps.w * k1, ps.h * k1);
      sil(gb.img, 222, 196, gb.w * k2, gb.h * k2);
      // notes d'harmonica qui s'envolent
      c.font = UI.font(9);
      for (let i = 0; i < 4; i++) { const k = (t * 0.4 + i / 4) % 1; c.fillStyle = `rgba(255,240,200,${1 - k})`; c.fillText('♪', 196 + Math.sin(k * 6 + i) * 8 + k * 20, 150 - k * 60); }
    }
  }
  DW.SeadramonCinema = SeadramonCinema;

  // ------------------------------------------------------------ fin du chapitre 2
  async function end2() {
    const s = st();
    if ((s.flags.chapter || 1) >= 3) return;
    s.flags.chapter = 3;
    DW.autosave();   // (tout de suite, avant le bilan : voir end1, game/chapitre1.js)
    Audio.play('victory');
    await DW.wait(0.8);
    await Game.push(new DW.ChapterScene('FIN DU CHAPITRE 2', 'Le Lac et le Loup', s.hero === 'perso' ? 'Matt et Garurumon sont libres. Mais où est TK ?' : 'Seadramon est libéré : le lac respire de nouveau.'));
    const m = s.party[0], T = DW.Town, rec = T.RECRUITS.filter(r => T.has(r.id)).length;
    const days = Math.floor(s.clock / 1440) + 1, wins = s.party.reduce((a, d) => a + (d.wins || 0), 0);
    const tm = Math.floor((s.time || 0) / 60), hm = `${Math.floor(tm / 60)} h ${String(tm % 60).padStart(2, '0')}`;
    const kids = Object.keys(s.kids || {}).filter(k => s.kids[k]).length;
    await Game.push(new DW.RecapScene([
      ['Jours passés sur l\'île', String(days)],
      ['Temps de jeu', hm],
      ['Partenaire', m ? `${m.name} · N.${m.level}` : '-'],
      ['Habitants revenus en ville', `${rec} / ${T.RECRUITS.length}`],
      ['Développement de la ville', `${T.progress()} %`],
      ['Combats gagnés', String(wins)],
      ['Monochromon', s.flags.monoCh2 ? 'vaincu !' : '-'],
      ['Seadramon', 'libéré !'],
      ['Enfants retrouvés', `${kids} / ${DW.Crests.ORDER.filter(k => k !== s.hero).length}`],
      ['Bits', String(s.bits)],
    ], 'BILAN DU CHAPITRE 2', { hero: 'matt', sp: 'gabumon' }));
    await say("Hohoho ! Matt est un garçon bien taciturne... mais il a bon cœur. Il est monté direct dans sa chambre.", 'Jijimon');
    await say("Son petit frère, TK... Je n'en ai pas entendu parler. Mais l'île est grande. Garde l'œil ouvert, et demande à Biyomon : elle a des nouvelles de partout.", 'Jijimon');
    await say("Hm ? Un grand panache de fumée s'élève à l'ouest, par-delà la forêt... Du côté du Mont Miharashi. Ça ne me dit rien qui vaille.", 'Jijimon');
    await say("Le voile de données s'est levé à l'ouest de la Clairière de l'Arrivée et du Sentier des Murmures. Un désert, puis un village... Va voir !", 'Jijimon');
    await Game.push(new DW.ChapterScene('CHAPITRE 3', 'La Montagne de Feu', 'Un brasier vivant dévale les pentes du Mont Miharashi... et une fille au chapeau bleu a été vue tout près.'));
    DW.autosave();
  }

  // ------------------------------------------------------------ objectifs (« Précédemment... »)
  const obj1 = DW.Chapter.objective;
  DW.Chapter.objective = () => {
    const s = st(), f = s.flags;
    if (!ch2() || !perso()) return obj1();
    if (!f.monoCh2) return "Le chemin du grand lac est ouvert, au nord de la Clairière de l'Arrivée. Mais un Monochromon furieux garde la Rive Sud : il faudra le vaincre pour passer.";
    if (!kidMatt()) return "Au Lac du Tramway, une île porte un vieux tramway. La nuit (20 h - 5 h), on y entend un harmonica... Va voir qui campe là-bas.";
    if ((f.chapter || 1) < 3) return "Matt et Gabumon vivent chez toi.";
    return "Matt et Gabumon vivent chez toi. Matt cherche son petit frère, TK... Et une fumée inquiétante s'élève à l'ouest de la forêt, du côté du Mont Miharashi.";
  };
  Object.assign(DW.Chapter, { end2, monoFight, mattScene });
})();
