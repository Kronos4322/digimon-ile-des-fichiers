'use strict';
// =====================================================================
//  VILLAGE DES BÉBÉS — à l'est de la Prairie des Lucioles
//  (le Village Primaire de la saison 1). Elecmon y veille sur les bébés.
//  Services d'Elecmon : un DigiŒuf par jour (on le fait éclore en le frottant),
//  RENAISSANCE d'un Digimon (il redevient le bébé de sa lignée en gardant ses
//  techniques, la moitié de son entraînement et des données innées renforcées), repos.
// =====================================================================
(function () {
  const { say, st, paint, healAll } = DW.MapKit;
  const Game = DW.Game;

  const rows = paint(36, 26, '#', g => {
    g.rect(1, 1, 34, 24, 'v');
    // lisière d'arbres-bonbons
    for (let x = 1; x < 35; x += 2) { g.set(x, 1, 'h'); g.set(x + 1, 24, 'h'); }
    for (let y = 2; y < 24; y += 2) { g.set(1, y + 1, 'h'); g.set(34, y, 'h'); }
    // entrée depuis la prairie (ouest), allée et place centrale pavées
    g.rect(0, 11, 4, 3, 'o'); g.rect(4, 12, 12, 2, 'o');
    g.rect(18, 6, 2, 3, 'o');
    // sentier vers le Bois Brumeux (nord)
    g.rect(23, 0, 3, 10, 'o');
    // berceaux de la nurserie (nord-ouest)
    for (const x of [5, 7, 9, 11]) { g.set(x, 5, 'c'); g.set(x, 8, 'c'); }
    // jouets
    for (const [x, y, ch] of [[26, 6, 'B'], [27, 6, 'B'], [26, 7, 'B'], [30, 17, 'B'], [6, 19, 'B'], [8, 21, 'B'], [31, 9, 'B']]) g.set(x, y, ch);
    // mare des Pichimon (sud-est)
    for (let y = 17; y < 24; y++) for (let x = 24; x < 34; x++) if (Math.hypot((x - 28.6) / 4.2, (y - 20.6) / 2.4) < 1) g.set(x, y, '~');
    // fleurs et herbes pastel
    g.scatter('q', 3, 3, 30, 20, 40, 11, ['v']);
    g.scatter(':', 3, 15, 10, 8, 14, 12, ['v']);
    g.scatter(':', 22, 3, 10, 6, 10, 13, ['v']);
    // panneau
    g.set(3, 10, 'S');
  });

  // ------------------------------------------------------------ services d'Elecmon
  async function eggService() {
    const s = st(), day = DW.Time.day();
    if (s.flags.eggDay === day) { await say("Tu as déjà pris un DigiŒuf aujourd'hui. Les autres ont besoin de couver encore un peu... Reviens demain !", 'Elecmon'); return; }
    await say('Choisis un DigiŒuf. Chacun cache un bébé différent... Observe bien les motifs !', 'Elecmon');
    const sp = await Game.push(new DW.EggScene());
    if (!sp) { await say("Prends ton temps. Les œufs ne s'envolent pas !", 'Elecmon'); return; }
    s.flags.eggDay = day;
    await Game.push(new DW.HatchScene(sp));
    const m = new DW.Digimon(sp, 3); m.happy = 60;
    const where = DW.addDigimon(m);
    await say(where === 'box' ? `${m.name} a été envoyé à la DigiFerme : ton équipe est complète.` : `${m.name} rejoint ton équipe !`);
    await say('Prends bien soin de lui. Les bébés grandissent vite : deux victoires, et hop, ils digivoluent !', 'Elecmon');
    DW.autosave();
  }
  // bébé à l'origine de la lignée (Greymon → Agumon → Koromon → Botamon)
  function babyOf(sp) {
    for (let k = 0; k < 8; k++) { const p = DW.Evo.prev(sp); if (!p.length) break; sp = p[0]; }
    return sp;
  }
  async function rebirthService() {
    const s = st();
    await say("La renaissance... Ton Digimon redevient un œuf, puis un bébé. C'est le cycle de la vie des Digimon.", 'Elecmon');
    await say("Il garde ses techniques, ses victoires et la moitié de son entraînement. Et ses données innées se renforcent à chaque renaissance !", 'Elecmon');
    const idx = await Game.push(new DW.PartyScene({ mode: 'select', title: 'RENAISSANCE' }));
    if (idx == null || idx < 0) return;
    const m = s.party[idx], sp = babyOf(m.sp);
    if (sp === m.sp) { await say(`${m.name} est déjà un bébé !`, 'Elecmon'); return; }
    const r = await DW.ask(`${m.name} redeviendra un ${DW.SPECIES[sp].name}. D'accord ?`);
    if (r !== 0) { await say('Comme tu veux. Rien ne presse.', 'Elecmon'); return; }
    await DW.fade(1, 0.5, '#ffffff');
    await DW.wait(0.3);
    const nm = DW.Life.reborn(m);
    DW.fade(0, 0.4);
    await Game.push(new DW.HatchScene(sp));
    s.party[idx] = nm; s.seen[sp] = s.caught[sp] = true;
    await say(`${m.name} est revenu au monde en ${DW.SPECIES[sp].name} ! Ses données innées se sont renforcées.`);
    DW.autosave();
  }
  async function elecmonTalk() {
    const s = st();
    if (!s.flags.berceau) {
      s.flags.berceau = true;
      await say("Bienvenue au Village des Bébés ! Je suis Elecmon, le gardien de cet endroit.", 'Elecmon');
      await say("Ici, les Digimon naissent dans des DigiŒufs. Quand un Digimon disparaît, ses données reviennent aussi ici, sous forme d'œuf.", 'Elecmon');
      await say("Tant que tu les traites bien, je te confierai un œuf par jour. Et si l'un de tes Digimon veut repartir de zéro, je peux l'aider à renaître.", 'Elecmon');
    }
    const r = await DW.choose(['Prendre un DigiŒuf', 'Faire renaître un Digimon', 'Se reposer', 'Au revoir']);
    if (r === 0) await eggService();
    else if (r === 1) await rebirthService();
    else if (r === 2) { await healAll("Les bébés chantent une berceuse... Ton équipe s'endort paisiblement."); await say('Ton équipe est en pleine forme !'); }
    else await say("Reviens quand tu veux. Les bébés t'aiment bien !", 'Elecmon');
  }

  // petits habitants (ils se promènent et donnent des conseils)
  const baby = (sp, x, y, lines, w = 2) => ({ sp, x, y, face: 'right', wander: w, talk: async () => { for (const l of lines) await say(l, DW.SPECIES[sp].name); } });

  DW.MAPS.berceau = {
    name: 'Village des Bébés', music: 'village', bg: 'village', ambient: 'town', climate: 'forest', region: 'foret',
    rows,
    // place ronde pavée (dessinée au pixel près)
    plazas: [{ x: 19 * 16, y: 13.5 * 16, rx: 92, ry: 70, t: 'stone' }],
    objects: [
      { kind: 'house', x: 16, y: 3, w: 4, h: 3 },
      { kind: 'starmobile', x: 13, y: 6, w: 1, h: 1, small: true },
      { kind: 'bigbottle', x: 30, y: 4, w: 1, h: 1, small: true },
      { kind: 'toyball', v: 0, x: 24, y: 10, w: 1, h: 1, small: true }, { kind: 'toyball', v: 1, x: 10, y: 16, w: 1, h: 1, small: true },
      { kind: 'toyball', v: 2, x: 29, y: 13, w: 1, h: 1, small: true },
      // le nid des DigiŒufs
      ...DW.EGG_ORDER.map((sp, i) => ({ kind: 'digitama', v: i, x: 14 + i * 2, y: 19, w: 1, h: 1, small: true })),
    ],
    warps: [{ x: 0, y: 11, w: 1, h: 3, dir: 'left', to: 'prairie', tx: 39, ty: 12 }],
    npcs: [
      { sp: 'elecmon', x: 18, y: 9, face: 'left', talk: elecmonTalk },
      baby('botamon', 7, 11, ['Bo-bo... Je fais la sieste dans les berceaux tous les après-midi !', "Elecmon dit que les œufs zébrés de bleu deviennent des Botamon. Comme moi !"]),
      baby('punimon', 25, 13, ['Puni ! Puni ! On joue à chat ?', 'Les Punimon deviennent des Tsunomon, puis des Gabumon... ou des Elecmon, comme notre gardien !']),
      baby('yuramon', 11, 19, ["Fuu... Le vent m'a encore emporté jusqu'ici...", "Un jour, je deviendrai Tanemon, puis Palmon. J'aurai une jolie fleur !"]),
      baby('nyokimon', 21, 22, ['Nyoki ! Ma fleur s\'ouvre quand je suis content !', 'Si tu frottes un œuf, il éclot plus vite. Les bébés adorent les câlins !']),
      baby('pichimon', 24, 19, ['Pichi ! Viens nager dans la mare !', "Un Digimon qui renaît garde ses techniques. Elecmon l'a dit !"], 1),
    ],
    signs: {
      '3,10': 'VILLAGE DES BÉBÉS — Ici naissent les Digimon. Merci de marcher doucement !',
      ...Object.fromEntries(DW.EGG_ORDER.map((sp, i) => [`${14 + i * 2},19`, async () => {
        await say(DW.EGGS[sp].hint);
        await say("(Pour prendre un œuf, parle à Elecmon.)");
      }])),
      '5,5': 'Un petit berceau tout doux. Un bébé Digimon y dort à poings fermés.', '7,5': 'Un berceau vide... On dirait qu\'il attend quelqu\'un.',
    },
  };
})();
