'use strict';
// =====================================================================
//  VILLAGE DES POYOMON — un hameau caché dans la forêt (le Village des Yokomon de l'animé est au Mont Miharashi,
//  chapitre 3 : maps/miharashi.js)
//  On y entre en se faufilant dans un tronc creux, au bord de la Prairie des Lucioles.
//  Les Poyomon vivent dans des nids autour d'un vieux puits... à sec. Quête : rapporter 3 bouteilles
//  d'eau (Eau fraîche ou Eau de source). Récompense : cartes Digimon, Pomme bleue, et un puits qui
//  désaltère gratuitement ensuite. Les Poyomon parlent aussi de la menace de la forêt.
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
    g.set(16, H - 1, 'T'); g.set(18, H - 1, 'T');   // une seule case de sortie
    for (let y = 9; y < 17; y++) for (let x = 15; x < 20; x++) if (g.get(x, y) === '.') g.set(x, y, '=');
    for (let y = 6; y < 9; y++) for (let x = 25; x < 30; x++) if (Math.hypot((x - 27.5) / 2.4, (y - 7.5) / 1.4) < 1) g.set(x, y, '~');
  });
  MAPS.village_yokomon = {
    name: 'Village des Poyomon', music: 'forest', bg: 'foret', ambient: 'forest', theme: 'meadow', climate: 'forest', region: 'foret',
    rows, encounters: [], wildN: 0, dress: false, secretEntry: true,   // (on y entre par le tronc creux de la Prairie : pas de passage normal)
    objects: [
      { kind: 'well', x: 17, y: 11, w: 1, h: 1 },
      { kind: 'giantnest', x: 6, y: 7, w: 3, h: 1 }, { kind: 'giantnest', x: 9, y: 15, w: 3, h: 1 }, { kind: 'giantnest', x: 23, y: 14, w: 3, h: 1 },
      { kind: 'nest', x: 12, y: 5, w: 2, h: 1 }, { kind: 'nest', x: 21, y: 4, w: 2, h: 1 }, { kind: 'nest', x: 4, y: 12, w: 2, h: 1 },
      { kind: 'flowerbed', v: 0, x: 14, y: 8, w: 1, h: 1, small: true }, { kind: 'flowerbed', v: 1, x: 20, y: 8, w: 1, h: 1, small: true },
    ],
    npcs: [],
    signs: {},
    // (l'arrivée est réglée sur le tronc creux à la première visite ; en attendant, près de l'entrée de la Prairie)
    warps: [(() => {
      // arrivée par défaut : là où l'on arrive dans la Prairie depuis une autre carte (une case sûre)
      // (recopiée d'une sortie peut-être déjà convertie à la taille de la Prairie agrandie : son marqueur _zt suit)
      let a = null; for (const id in MAPS) for (const w of MAPS[id].warps || []) if (!a && w.to === 'prairie' && w.tx != null) a = w;
      return { x: 17, y: H - 1, w: 1, h: 1, dir: 'down', to: 'prairie', tx: a ? a.tx : 5, ty: a ? a.ty : 5, _zt: !!(a && a._zt) };
    })()],
    entry: { x: 17, y: H - 2 },
    populate() {
      // la sortie ramène toujours devant le tronc creux de la Prairie (même après un chargement de partie ici)
      const pm = DW.getMap('prairie'); DW.YokoVillage.place(pm, 'prairie');
      const log = (pm.objects || []).find(o => o.yoko); if (log) Object.assign(this.warps[0], { tx: log.x, ty: log.y + 1, _zt: true });   // (déjà en coordonnées de la carte agrandie)
      const done = !!st().flags.yokoWell;
      this.npcs = [
        { sp: 'poyomon', x: 16, y: 13, face: 'down', talk: () => elder() },
        ...[[7, 9], [11, 17], [24, 16], [13, 7], [22, 6], [27, 11]].map(([x, y], i) => ({ sp: 'poyomon', x, y, face: i % 2 ? 'left' : 'right', wander: 2,
          talk: () => say(done ? DW.pick(["Le puits chante de nouveau ! Merci, merci !", "On a bu, on a ri, on a dansé toute la nuit !", "Reviens nous voir quand tu veux !"])
            : DW.pick(["Le puits est à sec... On a si soif.", "Chut ! Le monstre rouge passe parfois au-dessus du village...", "Avant, il y avait de l'eau fraîche ici. Et des chansons."]), 'Poyomon') })),
      ];
    },
  };
  // le vieux puits : à sec, puis il désaltère gratuitement une fois la quête faite
  MAPS.village_yokomon.signs['17,11'] = async () => {
    const m = st().party[0];
    if (!st().flags.yokoWell) { await say("Un vieux puits de pierre... Tu te penches : il est complètement à sec."); return; }
    const f = st().flags;
    if (m) { DW.Care.drink(m, 90); DW.Audio.sfx('water'); await say(`${m.name} boit l'eau fraîche du puits. Délicieuse ! (soif étanchée)`); }
    // la première fois : l'eau revenue a fait remonter un trésor oublié au fond du puits
    if (!f.yokoWellGift) {
      f.yokoWellGift = true;
      DW.Audio.sfx('fanfare');
      await say("En remontant le seau, quelque chose brille au fond de l'eau... Un vieux coffret de pierre, remonté avec la source !");
      const extra = DW.giveItem('puce_pv', 1) + DW.giveItem('eau_source', 2);
      await say(`Dedans : une Puce PV (elle augmente pour toujours les PV d'un Digimon) et 2 Eaux de source !${DW.extraMsg(extra)}`);
      DW.autosave();
      return;
    }
    // ensuite, une bouteille d'Eau de source à remplir chaque jour
    if (f.yokoWellDay !== DW.Time.day()) {
      f.yokoWellDay = DW.Time.day();
      const extra = DW.giveItem('eau_source', 1);
      await say(`Tu remplis une bouteille au puits : 1 Eau de source ! (Reviens demain pour la suivante.)${DW.extraMsg(extra)}`);
    }
  };

  // ------------------------------------------------------------ la doyenne des Poyomon : la quête de l'eau
  const WATER = ['eau_fraiche', 'eau_source'];
  async function elder() {
    const s = st(), f = s.flags;
    if (f.yokoWell) { await say(f.yokoWellGift ? "Grâce à toi, le puits ne tarira plus. Puise une bouteille d'Eau de source chaque jour, elle est à toi !" : "Grâce à toi, le puits ne tarira plus... Et quelque chose brillait au fond : va puiser un seau !", 'Poyomon'); return; }
    if (!f.yokoQuest) {
      f.yokoQuest = true;
      await say("Oh ! Un humain ! Bienvenue au village des Poyomon. Je suis la doyenne.", 'Poyomon');
      await say("Notre puits s'est tari le jour où le monstre rouge est arrivé dans la forêt. Plus une goutte...", 'Poyomon');
      await say("Si tu pouvais nous rapporter 3 bouteilles d'eau (de l'Eau fraîche, ou de l'Eau de source), le puits se remettrait peut-être à couler. On saura te remercier !", 'Poyomon');
      return;
    }
    const have = WATER.reduce((a, id) => a + (s.bag[id] || 0), 0);
    if (have < 3) { await say(`Il nous faudrait 3 bouteilles d'eau... (Tu en as ${have}.) Les distributeurs de nourriture en vendent, et les sources en donnent parfois.`, 'Poyomon'); return; }
    if ((await DW.ask("Donner 3 bouteilles d'eau aux Poyomon ?")) !== 0) return;
    let n = 3; for (const id of WATER) { const k = Math.min(n, s.bag[id] || 0); s.bag[id] -= k; n -= k; }
    DW.Audio.sfx('water');
    await say("Les Poyomon versent l'eau dans le puits en chantant... Glou... glou... Un grondement monte des profondeurs !", 'Poyomon');
    DW.Audio.sfx('fanfare'); f.yokoWell = true;
    await say("L'eau jaillit ! Le puits coule de nouveau ! Tout le village danse autour de toi !");
    const extra = DW.giveItem('cartes', 2) + DW.giveItem('pomme_bleue', 1); if (DW.Cards) DW.Cards.give('poyomon');
    s.party.forEach(m => m.addHappy(10));
    await say(`Les Poyomon t'offrent 2 Paquets de cartes et une Pomme bleue ! Ton équipe est toute joyeuse. (bonheur +10)${DW.extraMsg(extra)}`);
    await say("Au fait... Quand l'eau est remontée, on a vu quelque chose briller tout au fond du puits. Va donc puiser un seau, humain !", 'Poyomon');
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
      // (seulement là où l'on peut aller : les cases reliées aux sorties de la carte ; sinon le tronc pouvait tomber
      //  dans une clairière fermée par les arbres, impossible à atteindre)
      const libre = (x, y) => m.rows[y] && m.rows[y][x] !== undefined && !solid(m.rows[y][x]) && !occ.has(x + ',' + y);
      const vu = new Set(), file = [];
      for (const w of m.warps || []) for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) if (libre(x, y) && !vu.has(x + ',' + y)) { vu.add(x + ',' + y); file.push([x, y]); }
      while (file.length) {
        const [x, y] = file.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!vu.has(k) && libre(nx, ny)) { vu.add(k); file.push([nx, ny]); } }
      }
      let best = null, bs = 2;
      for (let y = 4; y < H2 - 4; y++) for (let x = 4; x < W2 - 4; x++) {
        if (!solid(m.rows[y - 1][x]) || solid(m.rows[y][x]) || occ.has(x + ',' + y) || near(x, y)) continue;
        if (solid(m.rows[y + 1][x]) || solid(m.rows[y + 2][x]) || occ.has(x + ',' + (y + 1)) || !vu.has(x + ',' + (y + 1))) continue;
        const sc = Hh(x, y, 4242); if (sc < bs) { bs = sc; best = [x, y]; }
      }
      if (!best) return;
      const [x, y] = best;
      m.objects.push({ kind: 'hollowlog', v: 0, x, y, w: 1, h: 1, small: true, yoko: true });
      m.signs = m.signs || {};
      m.signs[`${x},${y}`] = async ow => {
        if ((await DW.ask(st().flags.yokoQuest ? 'Le tronc creux qui mène au village des Poyomon. Se faufiler dedans ?' : "Un tronc creux couché contre les arbres... On entend des petites voix de l'autre côté. Se faufiler dedans ?")) !== 0) return;
        DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4);
        MAPS.village_yokomon.warps[0].tx = x; MAPS.village_yokomon.warps[0].ty = y + 1;
        await ow.charger('village_yokomon', 17, H - 2, 'up'); await DW.fade(0, 0.4);
      };
      // un petit panneau à côté du tronc (sinon on passait devant sans le voir)
      for (const sx of [x + 1, x - 1, x + 2, x - 2]) {
        const ch = m.rows[y][sx];
        if (!ch || solid(ch) || occ.has(sx + ',' + y) || solid(m.rows[y + 1][sx])) continue;
        DW.MapKit.changerLignes(m, m.rows.map((r, yy) => (yy === y ? r.slice(0, sx) + 'S' + r.slice(sx + 1) : r)));
        m.signs[`${sx},${y}`] = '« VILLAGE DES POYOMON » — une flèche gravée montre le tronc creux juste à côté. Parle au tronc pour t\'y faufiler.';
        break;
      }
      m._yokoFor = m.rows;
      if (m.gfx) DW.World.unprepare(m);
    },
  };
})();
