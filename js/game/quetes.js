'use strict';
// =====================================================================
//  QUÊTES ANNEXES DES CHAPITRES 2 ET 3 (histoires du jeu, pas de l'animé)
//  - chapitre 2, « Les Bukamon égarés » : sur la Rive Sud, après Monochromon, un Gomamon a perdu ses trois petits
//    Bukamon le long des rives du lac (lac1, lac4, la Cascade du Dragon lac6). Les retrouver : du poisson, un Disque PM,
//    des Bits... et le secret de la langue de sable qui mène, la nuit, à l'île du vieux tramway (et à Matt) ;
//  - chapitre 3, « La soif des Yokomon » : à l'oasis du Désert des Poteaux, un Yokomon parti chercher de l'eau pour son
//    village s'est effondré. Une Eau fraîche le remet sur pied : il montre le chemin du village (une Pomme bleue, des Bits) ;
//  - chapitre 3, « Le trésor de l'épave » : une fois Meramon calmé, l'eau revient au petit lac du Village des Yokomon ;
//    quelque chose brille dans la vieille épave. Un passage de planches mène au banc de sable (maps/miharashi.js).
//  Les personnages des quêtes sont posés à chaque arrivée sur leur carte (Overworld.load), près du carrefour.
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const f = () => st().flags;
  const ch = () => f().chapter || 1;
  const perso = () => st().hero === 'perso';
  const Audio = DW.Audio;

  // ------------------------------------------------------------ chapitre 2 : les Bukamon égarés
  const BUKA = { lac1: 1, lac4: 2, lac6: 4 };   // (un bit par Bukamon retrouvé : flags.bukaTrouves)
  const trouves = () => Object.values(BUKA).filter(b => (f().bukaTrouves || 0) & b).length;
  async function gomamon() {
    const F = f();
    if (!F.bukaQuete) {
      await say("Hé, toi ! C'est toi qui as fait fuir Monochromon ? Alors tu es courageux... Mes trois petits Bukamon ont suivi un banc de poissons le long des rives, vers l'ouest.", 'Gomamon');
      await say(F.seadramon ? "Le lac est grand, et ils sont si petits... Je ne peux pas quitter la rive : les autres petits comptent sur moi." : "Avec Seadramon qui rôde dans le lac, j'ai peur pour eux... Je ne peux pas quitter la rive : les autres petits comptent sur moi.", 'Gomamon');
      if ((await DW.ask('Retrouver les trois Bukamon ?', ['Oui', 'Non'], null, 0)) !== 0) { await say("Si tu changes d'avis, je suis là, sur la rive.", 'Gomamon'); return; }
      F.bukaQuete = 1;
      await say("Merci ! Ils ne s'éloignent jamais de l'eau. Cherche-les sur les rives, en allant vers l'ouest... jusqu'à la Cascade du Dragon, s'il le faut !", 'Gomamon');
      return;
    }
    const n = trouves();
    if (n < 3) { await say(`Tu en as retrouvé ${n} sur 3. Les autres doivent être plus loin le long des rives, vers la Cascade du Dragon.`, 'Gomamon'); return; }
    if (F.bukaQuete === 1) {
      F.bukaQuete = 2; Audio.sfx('fanfare');
      await say("Mes petits ! Ils sont tous revenus ! Merci, merci !", 'Gomamon');
      const extra = DW.giveItem('digianchois', 3) + DW.giveItem('disque_pm', 1); st().bits += 300;
      await say(`Tu reçois 3 ${DW.ITEMS.digianchois.name}, 1 ${DW.ITEMS.disque_pm.name} et 300 Bits !${DW.extraMsg(extra)}`);
      if (DW.Cards && DW.Cards.give('bukamon')) await say("Les Bukamon t'offrent aussi une carte : Bukamon ! (Album)");
      await say((st().kids || {}).matt ? "Et puis... ce garçon blond à l'harmonica, tu l'as trouvé ? Tant mieux. Il avait l'air si seul, sur son île." : "Un secret, pour te remercier : la nuit, l'eau baisse à la Cascade du Dragon, et une langue de sable mène à l'île du vieux tramway. Les Bukamon disent qu'on y entend un harmonica...", 'Gomamon');
      return;
    }
    await say("Les petits jouent de nouveau près de la rive. Tout va bien, grâce à toi !", 'Gomamon');
  }
  async function bukamon(id) {
    const F = f();
    F.bukaTrouves = (F.bukaTrouves || 0) | BUKA[id]; Audio.sfx('select');
    await say("Bu-bu ! Je me suis perdu en suivant les poissons... Gomamon me cherche ? J'y retourne tout de suite !", 'Bukamon');
    await say(`(Bukamon retrouvé : ${trouves()} / 3)`);
  }

  // ------------------------------------------------------------ chapitre 3 : la soif des Yokomon
  async function yokomonAssoiffe() {
    const calme = !!f().meramon;   // (Meramon calmé avant : l'eau est revenue au village, mais il n'a plus la force d'y aller)
    await say(calme ? "...De l'eau... s'il te plaît... (Un Yokomon tout desséché s'est effondré au bord de l'oasis. Il n'a plus la force de rentrer à son village.)" : "...De l'eau... s'il te plaît... (Un Yokomon tout desséché s'est effondré au bord de l'oasis. Avec la chaleur de la montagne, son eau est tiède et boueuse.)", 'Yokomon');
    if (!(st().bag.eau_fraiche > 0)) { await say("(Il lui faudrait de l'Eau fraîche : le Bazar et les distributeurs en vendent.)"); return; }
    if ((await DW.ask('Donner une Eau fraîche au Yokomon ?', ['Oui', 'Non'], null, 0)) !== 0) return;
    const sac = st().bag; sac.eau_fraiche -= 1; if (sac.eau_fraiche <= 0) delete sac.eau_fraiche;
    f().yokoSoif = true; Audio.sfx('heal');
    if (calme) await say("Glou glou... Ah ! Je revis ! Merci ! J'étais parti chercher de l'eau pour mon village... Elle y coule de nouveau, il paraît ? Grâce à toi ? Prends ça, c'est tout ce que j'ai.", 'Yokomon');
    else {
      await say("Glou glou... Ah ! Je revis ! Merci ! J'étais parti chercher de l'eau pour mon village : la fontaine est à sec depuis que Meramon brûle tout, là-haut, sur le Mont Miharashi.", 'Yokomon');
      await say("Le Village des Yokomon est par là : suis les poteaux du désert ! Prends ça, c'est tout ce que j'ai.", 'Yokomon');
    }
    const extra = DW.giveItem('pomme_bleue', 1); st().bits += 150;
    await say(`Tu reçois 1 Pomme bleue et 150 Bits !${DW.extraMsg(extra)}`);
  }

  // ------------------------------------------------------------ chapitre 3 : le trésor de l'épave (quand l'eau est revenue)
  async function yokomonEpave() {
    if ((st().chests || {}).epave_coffre) { await say("Un Disque de défense, dans la vieille épave ? Garde-le, tu l'as bien mérité !", 'Yokomon'); return; }
    await say("Depuis que l'eau revient dans le lac, quelque chose brille dans la vieille épave, au milieu... Mais nous, on ne sait pas nager !", 'Yokomon');
    await say("Il y a un passage de planches, au sud du lac, jusqu'au banc de sable. Tu veux bien aller voir ?", 'Yokomon');
  }
  // l'épave : son panneau, et le coffre que le courant a déposé à côté (une fois l'eau revenue)
  const EPAVE = { x: 25, y: 51 };
  function epave(m) {
    m.signs = m.signs || {};
    // (le petit lac garde son banc de sable à l'écran : l'eau « revient peu à peu », elle n'a pas encore tout recouvert)
    for (let x = 21; x <= 27; x++) m.signs[`${x},49`] = () => say(f().meramon ? "La vieille épave, couverte de coquillages. L'eau revient peu à peu autour d'elle ; le courant de la source a déposé un coffre sur le sable." : "La vieille épave, posée sur le fond presque sec du lac. Sur la coque, un nom à moitié effacé... Personne ne sait d'où elle vient.");
    if (!f().meramon || m.objects.some(o => o.epave)) return;
    DW.Palais.treasure('miharashi1', 'epave_coffre', null, [['disque_def', 1], ['cartes', 2]], EPAVE.x, EPAVE.y);
    const o = m.objects.find(c => c.kind === 'chest' && c.x === EPAVE.x && c.y === EPAVE.y); if (o) o.epave = true;
    if (m.gfx) DW.World.unprepare(m);
  }

  // ------------------------------------------------------------ les personnages des quêtes, posés à l'arrivée sur la carte
  // [carte, condition, espèce, réplique, point de départ (sinon le carrefour de la sous-zone)]
  const PNJ = [
    ['lac0', s => perso() && ch() >= 2 && !!s.flags.monoCh2 && (s.flags.bukaQuete || 0) < 2, 'gomamon', () => gomamon()],
    ...Object.keys(BUKA).map(id => [id, s => s.flags.bukaQuete === 1 && !((s.flags.bukaTrouves || 0) & BUKA[id]), 'bukamon', () => bukamon(id)]),
    ['miharashi0', s => ch() >= 3 && !s.flags.yokoSoif, 'yokomon', () => yokomonAssoiffe(), [40, 30]],
    ['miharashi1', s => !!s.flags.meramon && !(s.chests || {}).epave_coffre, 'yokomon', () => yokomonEpave(), [30, 42]],
  ];
  { const V = DW.MAPS.miharashi1, pop0 = V && V.populate; if (V) V.populate = function () { epave(this); if (pop0) return pop0.call(this); }; }
  DW.Quetes = {
    decorate(ow) {
      const m = ow.map, id = ow.mapId, s = st();
      const ici = PNJ.filter(P => P[0] === id && P[1](s)); if (!ici.length) return;
      const avoid = (m.npcs || []).map(n => [n.x, n.y]).concat([[ow.p.x, ow.p.y]]);
      for (const [, cond, sp, talk, pres] of ici) {
        const [sx, sy] = pres || (m.spec && m.spec.hub ? [m.spec.hub[0] + 3, m.spec.hub[1] + 2] : [ow.p.x, ow.p.y]);
        const p = DW.Story.freeSpots(ow, avoid, 3, sx, sy)[0]; if (!p) continue;
        avoid.push(p);
        m.npcs.push({ sp, x: p[0], y: p[1], face: 'down', wander: sp === 'bukamon' ? 1 : 0, story: true, cond, talk });
      }
    },
  };
})();
