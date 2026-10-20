'use strict';
// =====================================================================
//  CHAPITRE 3 — « La Montagne de Feu » (saison 1, épisode 4 : Birdramon)
//  1) À l'ouest de la forêt, les déserts aux poteaux télégraphiques mènent au Village des Yokomon.
//  2) La fontaine du village est à sec, le petit lac presque vide autour de la vieille épave :
//     Meramon, le gardien du Mont Miharashi, est devenu fou et brûle tout. Sora et Biyomon aident les Yokomon.
//  3) Au sommet du Mont Miharashi, combat contre Meramon ; Biyomon digivolue en Birdramon (à 40 % des PV)
//     et vient t'aider. L'Engrenage Noir se brise, Meramon s'excuse et part ouvrir le Restaurant en ville.
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
        folk(52, 41, () => ["Les poteaux du désert ? Ils étaient là avant nous. Ils ne mènent nulle part...", "Bienvenue au Village des Yokomon !"]),
        // la jardinière : une fois l'eau revenue, le mini-jeu d'arrosage (game/minijeux.js)
        { sp: 'yokomon', x: at(40, 37)[0], y: at(40, 37)[1], face: 'right', cond: () => freed(), talk: () => DW.MiniJeux.arrosage('Yokomon jardinière') },
        { hero: 'sora', x: at(43, 32)[0], y: at(43, 32)[1], face: 'right', cond: soraHere, talk: ow => soraTalk(ow) },
        { sp: 'biyomon', x: at(44, 33)[0], y: at(44, 33)[1], face: 'left', cond: soraHere, talk: async () => { await say(st().flags.soraMet ? "Je protégerai Sora ! Même contre Meramon !" : "Cui ! Tu viens de la forêt ? Va parler à Sora, elle cherche de l'aide !", 'Biyomon'); } },
      );
    };
    V.onEnter = async ow => {
      const s = st();
      if (!ch3() || s.flags.yokoVillage) return;
      s.flags.yokoVillage = true;
      ow.cine = true;
      await say("Des huttes de chaume rondes autour d'une fontaine de pierre... Des dizaines de Yokomon lèvent la tête vers toi.");
      await say("Un visiteur ! Bienvenue au Village des Yokomon ! ...Pardon pour l'accueil, on n'a plus une goutte d'eau à t'offrir.", 'Yokomon');
      if (soraHere(s)) await say("Près de la fontaine, une fille au chapeau bleu aide les Yokomon à arroser leurs fleurs avec un seau presque vide...");
      ow.cine = false;
    };
  }
  async function chief() {
    const s = st();
    if (!ch3()) { await say("Bienvenue au Village des Yokomon ! On vit tranquilles, ici, entre le désert et la montagne.", 'Yokomon'); return; }
    if (freed()) { await say("La fontaine coule, le lac se remplit ! Tout ça grâce à toi. Le Village des Yokomon ne t'oubliera jamais !", 'Yokomon'); return; }
    await say("Je suis l'ancien du village. Écoute bien : Meramon, le gardien du Mont Miharashi, a perdu la tête.", 'Yokomon');
    await say("Ses flammes ont tari notre source. La fontaine est à sec, et le petit lac a presque disparu autour de la vieille épave.", 'Yokomon');
    await say("Le Mont Miharashi est à l'ouest, au bout de la route. Si tu y montes... sois prudent. Meramon grandit à chaque coup qu'il reçoit !", 'Yokomon');
    if (!s.flags.soraMet && soraHere(s)) await say("Parle donc à la jeune fille près de la fontaine. Elle et son oiseau rose nous aident depuis des jours.", 'Yokomon');
  }
  async function soraTalk() {
    const s = st(), f = s.flags;
    if (!f.soraMet) {
      await say("Oh ! Un humain ! Toi aussi, tu es tombé sur cette île ? Je m'appelle Sora. Et voici Biyomon.", 'Sora');
      await say('Cui ! Enchantée !', 'Biyomon');
      await say(`${s.name}... C'est joli. Moi, j'étais au camp d'été avec les autres. On a tous été séparés.`, 'Sora');
      if ((s.kids || {}).tai) await say("Tai est chez toi ? Ça ne m'étonne pas qu'il ait foncé droit dans les ennuis... Je suis contente qu'il aille bien.", 'Sora');
      if ((s.kids || {}).matt) await say("Et Matt aussi ? Il doit être soulagé... même s'il ne le montrera jamais.", 'Sora');
      await say("Les Yokomon n'ont plus d'eau à cause de Meramon. Je ne peux pas les laisser tomber.", 'Sora');
      await say("Biyomon n'arrive pas encore à digivoluer... Mais si on monte ensemble au Mont Miharashi, on peut y arriver. Je viens avec toi !", 'Sora');
      f.soraMet = true;
      DW.autosave();
    } else await say("On y va quand tu veux. Le Mont Miharashi est à l'ouest, après la route. Biyomon et moi, on te suit !", 'Sora');
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
    const res = await ow.battle({
      enemy: new DW.Digimon('meramon', 30), boss: true, canLose: true, music: 'boss', intro: 'Meramon déchaîne ses flammes !',
      grows: 'Meramon absorbe le choc... et ses flammes grandissent encore !',
      ally: withSora ? { at: 0.4, from: 'biyomon', sp: 'birdramon', lvl: 24, hero: 'sora', name: 'Sora', move: 'meteore',
        join: "« BIYOMOOON ! » Le Digivice de Sora s'illumine... BIYOMON DIGIVOLUE EN... BIRDRAMON !" } : null,
    });
    if (res !== 'win') {
      await say('Les flammes de Meramon sont trop fortes...');
      await ow.bossDefeat("Hohoho... Tu t'es brûlé les ailes, on dirait. Meramon est un Digimon de feu : l'eau et la glace lui font mal. Entraîne-toi bien avant d'y retourner !");
      return;
    }
    await victory(ow, withSora);
  }

  // ------------------------------------------------------------ 4) victoire : l'eau revient, Sora délivrée, fin du chapitre
  async function victory(ow, withSora) {
    const s = st();
    s.flags.meramon = true;
    s.gears = s.gears || {}; s.gears.volcan = true;   // (l'Engrenage Noir de Meramon est brisé)
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
    await say("Meramon est descendu de la montagne pour s'excuser. Il a promis de veiller de nouveau sur la source.");
    if (perso() && !withSora && !(s.kids || {}).sora) {   // (vaincu sans elle : Sora et Biyomon accourent quand même)
      await say("Une fille au chapeau bleu accourt avec un oiseau rose : « Tu as calmé Meramon tout seul ?! Je m'appelle Sora, et voici Biyomon. On aidait les Yokomon... »", 'Sora');
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
    ], 'BILAN DU CHAPITRE 3'));
    await say("Hohoho ! Meramon ouvre un restaurant en ville ? Tout ce qu'il cuit sera bien grillé, ça c'est sûr !", 'Jijimon');
    if ((s.kids || {}).sora) await say("Et Sora... Une jeune fille qui a du cœur. Elle a déjà réorganisé la cuisine de ta maison, hohoho.", 'Jijimon');
    await say("Ces Engrenages Noirs qui tombent du ciel... Quelqu'un les lance sur l'île. Il faudra découvrir qui.", 'Jijimon');
    await Game.push(new DW.ChapterScene('CHAPITRE 4', "L'Insecte Électrique", "Des éclairs dans la forêt... et un garçon qui ne lâche jamais son ordinateur."));
    DW.autosave();
  }

  // ------------------------------------------------------------ objectifs (« Précédemment... »)
  const obj2 = DW.Chapter.objective;
  DW.Chapter.objective = () => {
    const s = st(), f = s.flags;
    if (!ch3() || !perso()) return obj2();
    if (f.meramon) return "Meramon est calmé, l'eau coule de nouveau au Village des Yokomon." + ((s.kids || {}).sora ? ' Sora et Biyomon vivent chez toi.' : '');
    if (!f.yokoVillage) return "À l'ouest de la Clairière de l'Arrivée et du Sentier des Murmures, la forêt s'ouvre sur un désert hérissé de poteaux... Un village se cache au-delà.";
    if (!f.soraMet) return "Au Village des Yokomon, la fontaine est à sec. Une fille au chapeau bleu aide les habitants : va lui parler.";
    return "Meramon, fou de rage, brûle tout depuis le sommet du Mont Miharashi, à l'ouest du Village des Yokomon. Monte le calmer avec Sora et Biyomon !";
  };
  Object.assign(DW.Chapter, { end3, meramonFight });
})();
