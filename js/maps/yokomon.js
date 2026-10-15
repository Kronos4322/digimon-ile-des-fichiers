'use strict';
// =====================================================================
//  VILLAGE DES YOKOMON (épisode 4 de l'animé) — un hameau caché dans la forêt
//  On y entre en se faufilant dans un tronc creux, au bord de la Prairie des Lucioles.
//  Les Yokomon vivent dans des nids autour d'un vieux puits... à sec. Quête : rapporter 3 bouteilles
//  d'eau (Eau fraîche ou Eau de source). Récompense : cartes Digimon, Pomme bleue, et un puits qui
//  désaltère gratuitement ensuite. Les Yokomon parlent aussi de la menace de la forêt.
// =====================================================================
(function () {
  const { say, st, paint } = DW.MapKit;
  const MAPS = DW.MAPS;
  const Hh = (x, y, s) => DW.Art.hash(x, y, s);
  const W = 34, H = 26;
  const rows = paint(W, H, 'T', g => {
    // clairière ovale entourée d'arbres, chemin vers la sortie (en bas), mare, fleurs
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (Math.hypot((x - 17) / 14.5, (y - 12) / 10) + (Hh(x, y, 5) - 0.5) * 0.18 < 1) g.set(x, y, Hh(x, y, 6) < 0.18 ? 'f' : '.');
    for (let y = 18; y < H; y++) for (let x = 16; x < 19; x++) g.set(x, y, '=');
    for (let y = 9; y < 17; y++) for (let x = 15; x < 20; x++) if (g.get(x, y) === '.') g.set(x, y, '=');
    for (let y = 6; y < 9; y++) for (let x = 25; x < 30; x++) if (Math.hypot((x - 27.5) / 2.4, (y - 7.5) / 1.4) < 1) g.set(x, y, '~');
  });
  MAPS.village_yokomon = {
    name: 'Village des Yokomon', music: 'forest', bg: 'foret', ambient: 'forest', theme: 'meadow', climate: 'forest', region: 'foret',
    rows, encounters: [], wildN: 0, dress: false,
    objects: [
      { kind: 'well', x: 17, y: 11, w: 1, h: 1 },
      { kind: 'giantnest', x: 6, y: 7, w: 3, h: 1 }, { kind: 'giantnest', x: 9, y: 15, w: 3, h: 1 }, { kind: 'giantnest', x: 23, y: 14, w: 3, h: 1 },
      { kind: 'nest', x: 12, y: 5, w: 2, h: 1 }, { kind: 'nest', x: 21, y: 4, w: 2, h: 1 }, { kind: 'nest', x: 4, y: 12, w: 2, h: 1 },
      { kind: 'flowerbed', v: 0, x: 14, y: 8, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 1, x: 20, y: 8, w: 1, h: 1, small: true },
    ],
    npcs: [],
    signs: {},
    warps: [{ x: 16, y: H - 1, w: 3, h: 1, dir: 'down', to: 'prairie', tx: 0, ty: 0 }],
    entry: { x: 17, y: H - 2 },
    populate() {
      const done = !!st().flags.yokoWell;
      this.npcs = [
        { sp: 'yokomon', x: 16, y: 13, face: 'down', talk: () => elder() },
        ...[[7, 9], [11, 17], [24, 16], [13, 7], [22, 6], [27, 11]].map(([x, y], i) => ({ sp: 'yokomon', x, y, face: i % 2 ? 'left' : 'right', wander: 2,
          talk: () => say(done ? DW.pick(["Le puits chante de nouveau ! Merci, merci !", "On a bu, on a ri, on a dansé toute la nuit !", "Reviens nous voir quand tu veux !"])
            : DW.pick(["Le puits est à sec... On a si soif.", "Chut ! Le monstre rouge passe parfois au-dessus du village...", "Avant, il y avait de l'eau fraîche ici. Et des chansons."]), 'Yokomon') })),
      ];
    },
  };
  // le vieux puits : à sec, puis il désaltère gratuitement une fois la quête faite
  MAPS.village_yokomon.signs['17,11'] = async () => {
    const m = st().party[0];
    if (!st().flags.yokoWell) { await say("Un vieux puits de pierre... Tu te penches : il est complètement à sec."); return; }
    if (m) { DW.Care.drink(m, 90); DW.Audio.sfx('water'); await say(`${m.name} boit l'eau fraîche du puits. Délicieuse ! (soif étanchée)`); }
  };

  // ------------------------------------------------------------ la doyenne des Yokomon : la quête de l'eau
  const WATER = ['eau_fraiche', 'eau_source'];
  async function elder() {
    const s = st(), f = s.flags;
    if (f.yokoWell) { await say("Grâce à toi, le puits ne tarira plus. Les Yokomon chantent ton nom dans tout le village !", 'Yokomon'); return; }
    if (!f.yokoQuest) {
      f.yokoQuest = true;
      await say("Oh ! Un humain ! Bienvenue au village des Yokomon. Je suis la doyenne.", 'Yokomon');
      await say("Notre puits s'est tari le jour où le monstre rouge est arrivé dans la forêt. Plus une goutte...", 'Yokomon');
      await say("Si tu pouvais nous rapporter 3 bouteilles d'eau (de l'Eau fraîche, ou de l'Eau de source), le puits se remettrait peut-être à couler. On saura te remercier !", 'Yokomon');
      return;
    }
    const have = WATER.reduce((a, id) => a + (s.bag[id] || 0), 0);
    if (have < 3) { await say(`Il nous faudrait 3 bouteilles d'eau... (Tu en as ${have}.) Les distributeurs de nourriture en vendent, et les sources en donnent parfois.`, 'Yokomon'); return; }
    if ((await DW.ask("Donner 3 bouteilles d'eau aux Yokomon ?")) !== 0) return;
    let n = 3; for (const id of WATER) { const k = Math.min(n, s.bag[id] || 0); s.bag[id] -= k; n -= k; }
    DW.Audio.sfx('water');
    await say("Les Yokomon versent l'eau dans le puits en chantant... Glou... glou... Un grondement monte des profondeurs !", 'Yokomon');
    DW.Audio.sfx('fanfare'); f.yokoWell = true;
    await say("L'eau jaillit ! Le puits coule de nouveau ! Tout le village danse autour de toi !");
    const extra = DW.giveItem('cartes', 2) + DW.giveItem('pomme_bleue', 1); if (DW.Cards) DW.Cards.give('yokomon');
    s.party.forEach(m => m.addHappy(10));
    await say(`Les Yokomon t'offrent 2 Paquets de cartes et une Pomme bleue ! Ton équipe est toute joyeuse. (bonheur +10)${DW.extraMsg(extra)}`);
    DW.autosave();
  }

  // ------------------------------------------------------------ l'entrée : un tronc creux au bord de la Prairie des Lucioles
  // (placé à la première visite contre la lisière d'arbres, loin des sorties ; on s'y faufile en lui parlant)
  DW.YokoVillage = {
    place(m, id) {
      if (id !== 'prairie' || m._yokoFor === m.rows) return;
      m._yokoFor = m.rows;
      const H2 = m.rows.length, W2 = m.rows[0].length, solid = ch => DW.SOLID.has(ch);
      const occ = new Set(); for (const o of m.objects || []) if (!o.walk) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y);
      const near = (x, y) => [...(m.warps || [])].some(w => Math.abs(w.x - x) < 8 && Math.abs(w.y - y) < 8);
      let best = null, bs = 2;
      for (let y = 4; y < H2 - 4; y++) for (let x = 4; x < W2 - 4; x++) {
        if (!solid(m.rows[y - 1][x]) || solid(m.rows[y][x]) || occ.has(x + ',' + y) || near(x, y)) continue;
        if (solid(m.rows[y + 1][x]) || solid(m.rows[y + 2][x]) || occ.has(x + ',' + (y + 1))) continue;
        const sc = Hh(x, y, 4242); if (sc < bs) { bs = sc; best = [x, y]; }
      }
      if (!best) return;
      const [x, y] = best;
      m.objects.push({ kind: 'hollowlog', v: 0, x, y, w: 1, h: 1, small: true, yoko: true });
      m.signs = m.signs || {};
      m.signs[`${x},${y}`] = async ow => {
        if ((await DW.ask(st().flags.yokoQuest ? 'Le tronc creux qui mène au village des Yokomon. Se faufiler dedans ?' : "Un tronc creux couché contre les arbres... On entend des petites voix de l'autre côté. Se faufiler dedans ?")) !== 0) return;
        DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4);
        MAPS.village_yokomon.warps[0].tx = x; MAPS.village_yokomon.warps[0].ty = y + 1;
        ow.load('village_yokomon', 17, H - 2, 'up'); await DW.fade(0, 0.4);
      };
      if (m.gfx) DW.World.unprepare(m);
    },
  };
})();
