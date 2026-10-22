'use strict';
// =====================================================================
//  CHAPITRE 3 — « La Montagne de Feu » (saison 1, épisode 4 : Birdramon)
//  1) À l'ouest de la forêt, les déserts aux poteaux télégraphiques mènent au Village des Yokomon.
//  2) La fontaine du village est à sec, le petit lac presque vide autour de la vieille épave :
//     Meramon, le gardien du Mont Miharashi, est devenu fou et brûle tout. Sora est descendue sous la montagne chercher
//     la source de la fontaine ; Biyomon est remontée seule et supplie le héros d'aller la chercher. Sora est retrouvée
//     au fond des souterrains, cinq cercles plus bas (maps/sous_volcan.js) ; ensemble, ils montent affronter Meramon.
//  3) Au sommet du Mont Miharashi, combat contre Meramon. Tant que Sora n'est pas délivrée, il est bien trop puissant :
//     un seul coup et ton Digimon tombe à 1 PV, tu prends la fuite et les Yokomon te soignent au village. Avec Sora,
//     Biyomon digivolue en Birdramon (à 40 % des PV) et vient t'aider, comme Greymon et Garurumon aux chapitres 1 et 2.
//     L'Engrenage Noir se brise, Meramon s'excuse et part ouvrir le Restaurant en ville.
//  4) L'eau revient au village, Sora s'installe chez toi. Bilan, puis le carton du chapitre 4.
//  (cartes : région « miharashi » de maps/regions.js ; décors : gfx/desert.js)
// =====================================================================
(function () {
  const { Audio, Game } = DW;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const MAPS = DW.MAPS;
  const perso = () => st().hero === 'perso';
  const ch3 = () => (st().flags.chapter || 1) >= 3;
  const freed = () => !!st().flags.meramon;
  const soraHere = s => perso() && ch3() && !(s.kids || {}).sora && !s.flags.meramon;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ------------------------------------------------------------ 1-2) le Village des Yokomon
  const V = MAPS.miharashi1;
  if (V) {
    V.populate = function () {
      // la fontaine coule de nouveau une fois Meramon calmé
      const f = this.objects.find(o => o.kind === 'stonefountain'), v = freed() ? 1 : 0;
      if (f && f.v !== v) { f.v = v; if (this.gfx) DW.World.unprepare(this); }
      if (this.ch3Set) return;
      this.ch3Set = true;
      const at = (x, y) => DW.MapKit.freeNear(this, x, y);   // (la place prévue peut être prise par une hutte de l'auberge)
      const folk = (X, Y, lines) => { const [x, y] = at(X, Y); return { sp: 'yokomon', x, y, face: 'down', wander: 2, talk: async () => { await say(pick(lines()), 'Yokomon'); } }; };
      this.npcs.push(
        { sp: 'yokomon', x: at(51, 32)[0], y: at(51, 32)[1], face: 'left', talk: () => chief() },
        folk(43, 36, () => freed() ? ["L'eau ! L'eau est revenue ! Mes fleurs vont refleurir !", "Meramon est venu s'excuser. Il avait l'air tout gêné, hihi."] : ["Il fait si chaud... Mes pétales se dessèchent.", "La nuit, on voit des flammes au sommet du Mont Miharashi."]),
        folk(54, 37, () => freed() ? ['On va faire une grande fête autour de la fontaine !'] : ["Le lac a presque séché. On voit même la vieille épave, au milieu !", "On dit que ce bateau est là depuis toujours. Personne ne sait d'où il vient."]),
        folk(45, 40, () => freed() ? ['Merci, merci, merci !'] : ["Meramon était gentil, avant... Il veillait sur la montagne.", "Une drôle de chose noire est tombée du ciel sur le Mont Miharashi. Depuis, Meramon a changé."]),
        folk(52, 41, () => ["Les poteaux du désert ? Ils étaient là avant nous. Leur vieille ligne arrive jusqu'au village... mais personne ne sait d'où elle part.", "Bienvenue au Village des Yokomon !"]),
        // la jardinière : une fois l'eau revenue, le mini-jeu d'arrosage (game/minijeux.js)
        { sp: 'yokomon', x: at(40, 37)[0], y: at(40, 37)[1], face: 'right', cond: () => freed(), talk: () => DW.MiniJeux.arrosage('Yokomon jardinière') },
        // (Sora n'est à la fontaine qu'une fois retrouvée au fond des souterrains ; Biyomon, elle, y attend depuis le début)
        { hero: 'sora', x: at(43, 32)[0], y: at(43, 32)[1], face: 'right', cond: s => soraHere(s) && !!s.flags.soraMet, talk: ow => soraTalk(ow) },
        { sp: 'biyomon', x: at(44, 33)[0], y: at(44, 33)[1], face: 'left', cond: soraHere, talk: () => biyoTalk() },
      );
    };
    V.onEnter = async ow => {
      const s = st();
      if (!ch3() || s.flags.yokoVillage) return;
      s.flags.yokoVillage = true;
      ow.cine = true;
      await say("Des huttes de chaume rondes autour d'une fontaine de pierre... Des dizaines de Yokomon lèvent la tête vers toi.");
      await say("Un visiteur ! Bienvenue au Village des Yokomon ! ...Pardon pour l'accueil, on n'a plus une goutte d'eau à t'offrir.", 'Yokomon');
      if (soraHere(s) && !s.flags.soraMet) await say("Près de la fontaine à sec, un petit oiseau rose est recroquevillé, couvert de suie. Il lève vers toi des yeux pleins de larmes...");
      ow.cine = false;
    };
  }
  async function chief() {
    const s = st();
    if (!ch3()) { await say("Bienvenue au Village des Yokomon ! On vit tranquilles, ici, entre le désert et la montagne.", 'Yokomon'); return; }
    // (seule la fontaine change à l'écran : le petit lac, lui, se remplira avec le temps — comme le disent l'épave et la
    //  quête du trésor, game/quetes.js)
    if (freed()) { await say("La fontaine coule de nouveau ! Et notre source recommence à remplir le petit lac, goutte après goutte : il lui faudra du temps. Tout ça grâce à toi. Le Village des Yokomon ne t'oubliera jamais !", 'Yokomon'); return; }
    await say("Je suis l'ancien du village. Écoute bien : Meramon, le gardien du Mont Miharashi, a perdu la tête.", 'Yokomon');
    await say("Ses flammes ont tari notre source. La fontaine est à sec, et le petit lac a presque disparu autour de la vieille épave.", 'Yokomon');
    await say("Le Mont Miharashi est à l'ouest, au bout de la route. Si tu y montes... sois prudent. Meramon grandit à chaque coup qu'il reçoit !", 'Yokomon');
    if (!s.flags.soraMet && soraHere(s)) await say("Une jeune humaine au chapeau bleu nous aidait... Elle est descendue sous la montagne chercher notre source, et elle n'est jamais remontée. Son oiseau rose est revenu seul : il est près de la fontaine. Va lui parler.", 'Yokomon');
  }
  // Biyomon, remontée seule des souterrains : elle supplie le héros d'aller chercher Sora (game/perils.js, maps/sous_volcan.js)
  async function biyoTalk() {
    const f = st().flags;
    if (f.soraMet) { await say("Je protégerai Sora ! Même contre Meramon !", 'Biyomon'); return; }
    if (!f.biyoAide) {
      await say("Cui... Tu viens de la forêt ? Aide-moi, je t'en supplie ! Mon amie Sora est descendue sous le Mont Miharashi chercher la source de la fontaine...", 'Biyomon');
      await say("Là-dessous, tout s'écroule, des chauves-souris attaquent, il y a de la lave partout... Un gros Drimogemon a bloqué le chemin. Je n'ai pas pu la ramener !", 'Biyomon');
      await say("La grotte s'ouvre au pied du Mont Miharashi, tout près de l'arrivée de la route. Je t'en prie... ramène Sora !", 'Biyomon');
      f.biyoAide = true; DW.autosave();
      return;
    }
    await say("Sora est tout au fond, sous la montagne, au bord d'un lac qui bout... Fais attention : regarde le sol, écoute les cris, et prends des RAM !", 'Biyomon');
  }
  // (Sora retrouvée au fond des souterrains : leur rencontre se joue là-bas, maps/sous_volcan.js)
  async function soraTalk() {
    if (st().flags.svGardien) await say("Merci encore d'être venu me chercher sous la montagne. Biyomon n'en revenait pas !", 'Sora');
    await say("On y va quand tu veux. Le Mont Miharashi est à l'ouest, après la route. Biyomon et moi, on te suit !", 'Sora');
  }

  // ------------------------------------------------------------ 3) le Mont Miharashi et Meramon
  const M = MAPS.miharashi4;
  if (M) {
    M.signs = M.signs || {};
    const MT = DW.Mih.MONT;   // (positions de la carte dessinée : maps/miharashi.js)
    M.signs[(MT.crater[0] + 5) + ',' + (MT.crater[1] + 5)] = "Le cratère du Mont Miharashi. Une chaleur terrible en monte.";
    M.populate = function () {
      if (this.ch3Set) return;
      this.ch3Set = true;
      this.npcs.push({ sp: 'meramon', x: MT.meramon[0], y: MT.meramon[1], face: 'down', gear: true, cond: s => ch3() && !s.flags.meramon, talk: ow => meramonFight(ow) });
    };
    M.onEnter = async ow => {
      const s = st();
      if (!ch3() || s.flags.meramon || s.flags.mihaFire) return;
      s.flags.mihaFire = true;
      ow.shake = 0.6; Audio.sfx('roar');
      await say("La montagne gronde... Tout là-haut, au bord du cratère, un brasier vivant hurle de rage.");
      if (s.flags.soraMet && soraHere(s)) await say("C'est lui, Meramon ! Il faut monter tout en haut, gradin après gradin. Courage !", 'Sora');
    };
  }
  async function meramonFight(ow) {
    const s = st(), withSora = !!s.flags.soraMet && soraHere(s);
    ow.shake = 0.8; Audio.sfx('roar');
    await say('JE BRÛLE ! TOUT BRÛLE ! VOUS ALLEZ BRÛLER AVEC MOI !', 'Meramon');
    await say("Dans son dos, un Engrenage Noir tourne en crissant... C'est lui qui le rend fou !");
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Soigne-le d'abord."); return; }
    if ((await DW.ask('Affronter Meramon ? (un Champion de feu qui grandit à chaque coup)')) !== 0) return;
    // SANS SORA, Meramon est bien trop puissant : un seul coup, la fuite, et les Yokomon te ramènent au village
    if (perso() && !s.flags.soraMet && !(s.kids || {}).sora) {
      await ow.battle({ enemy: new DW.Digimon('meramon', 30), boss: true, canLose: true, music: 'boss', intro: 'Meramon déchaîne ses flammes !',
        ecrasant: { textes: ["Un seul coup... et c'est déjà trop ! Ces flammes-là, aucun Digimon ne peut les encaisser seul.", 'Il faut fuir, vite !'] } });
      await DW.fade(1, 0.6);
      for (const m of s.party) m.heal();
      await ow.charger('miharashi1', 48, 34, 'down');
      await DW.fade(0, 0.6);
      await say("Les Yokomon t'ont trouvé au pied de la montagne et ramené au village. Ils ont soigné ton partenaire avec l'eau de leurs dernières fleurs.", 'Yokomon');
      await say("Meramon est bien trop fort... Seule, je ne peux pas digivoluer. Il faut d'abord retrouver Sora, sous la montagne ! Je t'en supplie !", 'Biyomon');
      DW.autosave();
      return;
    }
    const res = await ow.battle({
      enemy: new DW.Digimon('meramon', 30), boss: true, canLose: true, music: 'boss', intro: 'Meramon déchaîne ses flammes !',
      grows: 'Meramon absorbe le choc... et ses flammes grandissent encore !',
      ally: withSora ? { at: 0.4, from: 'biyomon', sp: 'birdramon', lvl: 24, hero: 'sora', name: 'Sora', move: 'meteore',
        join: "« BIYOMOOON ! » Le Digivice de Sora s'illumine... BIYOMON DIGIVOLUE EN... BIRDRAMON !" } : null,
    });
    if (res !== 'win') {
      await say('Les flammes de Meramon sont trop fortes...');
      await ow.bossDefeat("Hohoho... Tu t'es brûlé les ailes, on dirait. Meramon est un Digimon de feu : l'eau et la terre lui font mal. Entraîne-toi bien avant d'y retourner !");
      return;
    }
    await victory(ow, withSora);
  }

  // ------------------------------------------------------------ 4) victoire : l'eau revient, Sora délivrée, fin du chapitre
  async function victory(ow, withSora) {
    const s = st();
    s.flags.meramon = true;
    s.gears = s.gears || {}; s.gears.miharashi = true;   // (l'Engrenage Noir de Meramon est brisé : il compte pour le Pays de Meramon, game/story.js)
    ow.shake = 1; Audio.sfx('super');
    await say("L'Engrenage Noir jaillit du dos de Meramon... et se brise en éclats de données !");
    await say("Ouh... ma tête... Qu'est-ce que j'ai fait ? Ces flammes... ce n'étaient pas les miennes. Une chose noire m'est tombée dessus, du ciel.", 'Meramon');
    await say("Les Yokomon... leur source... Je dois réparer ça. Pardon. Pardon à tous.", 'Meramon');
    if (withSora) {
      await say("Birdramon se pose doucement au bord du cratère... et redevient Biyomon, épuisée mais fière.");
      await say("Sora ! Tu as vu ? J'ai digivolué ! Je t'ai protégée !", 'Biyomon');
      await say("Oui, je t'ai vue. ...Merci, Biyomon. Tu as été formidable.", 'Sora');
      DW.Crests.freeKid('sora');
    }
    DW.Trophies.give('meramon');
    if (DW.Cards) { DW.Cards.give('meramon'); DW.Cards.give('birdramon'); DW.Cards.give('biyomon'); }
    s.party.forEach(m => m.heal());
    // retour au village : l'eau jaillit de nouveau
    await DW.fade(1, 0.8);
    await ow.charger('miharashi1', 48, 34, 'up');
    await DW.wait(0.2);
    await DW.fade(0, 0.8);
    Audio.play('victory');
    await say("Au village, la fontaine se met à gargouiller... puis l'eau jaillit en deux grands arcs ! Les Yokomon dansent autour, en criant de joie.");
    await say("Meramon est descendu de la montagne pour s'excuser. Le feu qui asséchait la source s'est éteint pour de bon... et pour se faire pardonner, il veut cuisiner pour tout le monde, à la Ville des Fichiers !");
    if (perso() && !withSora && !(s.kids || {}).sora) {   // (vaincu sans elle : Sora et Biyomon accourent quand même)
      await say(s.flags.soraMet ? "Sora accourt avec Biyomon : « Tu as calmé Meramon tout seul ?! On aidait les Yokomon... »"
        : "Une fille au chapeau bleu accourt avec Biyomon, couverte de suie : « Le feu s'est éteint, le lac sous la montagne a refroidi... j'ai pu remonter ! Tu as calmé Meramon tout seul ?! Je m'appelle Sora. »", 'Sora');
      DW.Crests.freeKid('sora');
      withSora = true;
    }
    if (withSora) {
      await say(`${s.name}... Merci. Sans toi, je n'aurais jamais osé monter là-haut.`, 'Sora');
      await say("Tu habites à la Ville des Fichiers ? D'accord, on vient ! Il y a sûrement des gens qui ont besoin d'un coup de main, là-bas aussi.", 'Sora');
      Audio.sfx('fanfare');
      await say('Sora et Biyomon s\'installent dans une chambre de ta maison !');
    }
    if (!DW.Town.has('meramon')) await DW.Town.recruit('meramon');
    const extra = DW.giveItem('soin_m', 3) + DW.giveItem('pm_m', 2) + DW.giveItem('gants_flamme'); s.bits += 1500;
    await say(`Tu reçois le Trophée de Meramon !  Les Yokomon t'offrent 3 RAM PV+, 2 RAM PM+ et 1500 Bits : « Pour notre héros ! »  Meramon te confie ses Gants de flamme (une arme : donne-la à un Digimon depuis le sac).${DW.extraMsg(extra)}`);
    await DW.fade(1, 0.8);
    await ow.charger('maison', 12, 5, 'down');
    await DW.wait(0.3);
    await DW.fade(0, 0.8);
    DW.autosave();
    await end3();
  }

  // ------------------------------------------------------------ fin du chapitre 3
  async function end3() {
    const s = st();
    if ((s.flags.chapter || 1) >= 4) return;
    s.flags.chapter = 4;
    DW.autosave();   // (tout de suite, avant le bilan : voir end1, game/chapitre1.js)
    Audio.play('victory');
    await DW.wait(0.8);
    await Game.push(new DW.ChapterScene('FIN DU CHAPITRE 3', 'La Montagne de Feu', "Birdramon a calmé Meramon. L'eau coule de nouveau au Village des Yokomon."));
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
      ['Meramon', 'calmé !'],
      ['Enfants retrouvés', `${kids} / ${DW.Crests.ORDER.filter(k => k !== s.hero).length}`],
      ['Bits', String(s.bits)],
    ], 'BILAN DU CHAPITRE 3', { hero: 'sora', sp: 'biyomon' }));
    await say("Hohoho ! Meramon ouvre un restaurant en ville ? Tout ce qu'il cuit sera bien grillé, ça c'est sûr !", 'Jijimon');
    if ((s.kids || {}).sora) await say("Et Sora... Une jeune fille qui a du cœur. Elle a déjà réorganisé la cuisine de ta maison, hohoho.", 'Jijimon');
    await say("Ces Engrenages Noirs qui tombent du ciel... Quelqu'un les lance sur l'île. Il faudra découvrir qui.", 'Jijimon');
    // (le chapitre 4 n'est pas encore écrit : on l'annonce sans faire croire qu'il commence)
    await Game.push(new DW.ChapterScene('À SUIVRE...', "Chapitre 4 : L'Insecte Électrique", "Des éclairs dans la forêt... La suite de l'aventure arrive bientôt."));
    DW.autosave();
  }

  // ------------------------------------------------------------ objectifs (« Précédemment... »)
  const obj2 = DW.Chapter.objective;
  DW.Chapter.objective = () => {
    const s = st(), f = s.flags;
    if (!ch3() || !perso()) return obj2();
    if (f.meramon) return "Meramon est calmé, l'eau coule de nouveau au Village des Yokomon." + ((s.kids || {}).sora ? ' Sora et Biyomon vivent chez toi.' : '');
    if (!f.yokoVillage) return "À l'ouest de la Clairière de l'Arrivée et du Sentier des Murmures, la forêt s'ouvre sur un désert hérissé de poteaux... Un village se cache au-delà.";
    if (!f.soraMet && !f.biyoAide) return "Au Village des Yokomon, la fontaine est à sec. Un petit oiseau rose attend près d'elle, épuisé : va lui parler.";
    if (!f.soraMet) return "Sora est descendue sous le Mont Miharashi chercher la source du village, et n'est jamais remontée. La grotte s'ouvre au pied du mont : descends la chercher, tout au fond !";
    return "Meramon, fou de rage, brûle tout depuis le sommet du Mont Miharashi, à l'ouest du Village des Yokomon. Monte le calmer avec Sora et Biyomon !";
  };
  Object.assign(DW.Chapter, { end3, meramonFight });
})();
