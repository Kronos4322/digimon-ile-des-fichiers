'use strict';
// =====================================================================
//  LE SOUTERRAIN DE JIJIMON — un passage secret entre la maison de Jijimon et le Village des Poyomon
//  Une fois le puits des Poyomon remis en eau, l'eau découvre une échelle de fer au fond du puits :
//  elle descend dans un vieux tunnel éclairé (aucun Digimon sauvage), qui remonte par une trappe
//  dans la maison de Jijimon. Un raccourci sûr pour aller au nord de la forêt.
//  Au village, la mare devient une source chaude : un bain par jour (soins, fatigue, bonheur).
// =====================================================================
(function () {
  const { say, st } = DW.MapKit;
  const MAPS = DW.MAPS;
  const Hh = (x, y, s) => DW.Art.hash(x, y, s);
  const TRAP = [14, 8];   // la trappe, dans la maison de Jijimon (case libre à toutes les étapes de rénovation : ni caisse, ni lampe)
  const WELL = [17, 11];  // le puits, au Village des Poyomon

  // ------------------------------------------------------------ objets : trappe en bois, vapeur de la source chaude
  Object.assign(DW.World.OBJ, {
    trapdoor: { w: 16, h: 16, n: 1, draw(d) {
      d.rect(1, 2, 14, 13, '#6a4424', { round: 0.1 });
      for (const x of [2, 6, 10]) d.deco.rect(x + 0.5, 3, 3.4, 11, '#8a5a30');
      d.deco.rect(1, 5, 14, 1.4, '#3a2a1a'); d.deco.rect(1, 11, 14, 1.4, '#3a2a1a');
      d.deco.circ(12, 8.5, 1.3, '#c8b070', { unlit: true });
    } },
  });

  // ------------------------------------------------------------ le tunnel
  const W = 46, H = 10;
  const rows = [];
  for (let y = 0; y < H; y++) {
    let r = '';
    for (let x = 0; x < W; x++) {
      // couloir de 3 à 4 cases de haut, qui ondule un peu
      const top = 3, bot = 6 + (Math.sin(x * 0.35) > 0.4 ? 1 : 0) - (Hh(x, 1, 31) < 0.12 && x > 6 && x < W - 6 ? 1 : 0);
      r += x > 0 && x < W - 1 && y >= top && y <= bot ? '.' : '#';
    }
    rows.push(r);
  }
  const objects = [
    { kind: 'stairsup', x: 2, y: 1, w: 2, h: 2, back: true },
    { kind: 'stairsup', x: W - 4, y: 1, w: 2, h: 2, back: true },
  ];
  for (let x = 8; x < W - 6; x += 9) objects.push({ kind: 'torch', x, y: 3, w: 1, h: 1, small: true });
  for (const [x, y] of [[12, 6], [21, 6], [30, 6], [38, 6]]) objects.push({ kind: 'glowshroom', x, y, w: 1, h: 1, small: true });
  MAPS.souterrain_jiji = {
    name: 'Souterrain de Jijimon', music: 'temple', bg: 'foret', ambient: 'forest', theme: 'cave', climate: 'forest', region: 'foret', indoor: true,
    dark: { d: 0.5, col: '#141018' }, rows, objects, npcs: [], encounters: [], wildN: 0, rate: 0, calm: true, dress: false, secretEntry: true,   // (on y entre par la trappe ou le puits : pas de passage normal)
    signs: {
      '6,3': "Des initiales gravées dans la roche : « J. — l'an 1 ». Jijimon a creusé ce tunnel il y a bien longtemps...",
    },
    warps: [],
    doors: [
      { x: 2, y: 2, w: 2, dir: 'up', to: 'maison', tx: TRAP[0], ty: TRAP[1] + 1 },
      { x: W - 4, y: 2, w: 2, dir: 'up', to: 'village_yokomon', tx: WELL[0] + 1, ty: WELL[1] + 1 },
    ],
    onEnter: async () => {
      const f = st().flags;
      if (f.jijiTunnel) return;
      f.jijiTunnel = true;
      await say("Un long tunnel creusé dans la roche, éclairé par de vieilles torches. Aucun Digimon sauvage ne rôde ici : c'est un passage sûr.");
      await say('Une échelle remonte à chaque bout : vers le puits des Poyomon... et de l\'autre côté, vers la Ville des Fichiers ?');
    },
  };
  // en arrivant chez Jijimon par la trappe, la première fois : il est tout surpris
  const maisonEnter = MAPS.maison.onEnter;
  MAPS.maison.onEnter = async ow => {
    if (maisonEnter) await maisonEnter(ow);
    const f = st().flags;
    if (!f.jijiTunnel || f.jijiTrap) return;
    if (!(ow.p.x === TRAP[0] && ow.p.y === TRAP[1] + 1)) return;
    f.jijiTrap = true;
    DW.Audio.sfx('swoosh');
    await say('Hohoho ?! Ma vieille trappe s\'est ouverte toute seule... Ah, c\'est toi !', 'Jijimon');
    await say("J'avais complètement oublié ce souterrain ! Je l'ai creusé quand j'étais jeune, pour rendre visite aux Poyomon sans traverser la forêt.", 'Jijimon');
    await say("Garde-le pour toi : c'est le chemin le plus court et le plus sûr vers le nord de la forêt. La trappe restera ouverte, maintenant !", 'Jijimon');
    ow.load('maison', ow.p.x, ow.p.y, 'up');   // (la trappe apparaît dans la pièce)
    ow.banner.t = 99;
    DW.autosave();
  };
  // la trappe dans la maison de Jijimon (après le premier passage)
  const build0 = MAPS.maison.build;
  MAPS.maison.build = function () {
    build0.apply(this, arguments);
    // (la lampe sur pied près de la trappe gênait le passage : on l'enlève)
    if (this.objects.some(o => o.kind === 'floorlamp')) { this.objects = this.objects.filter(o => o.kind !== 'floorlamp'); if (this.gfx) DW.World.unprepare(this); }
    const show = !!st().flags.jijiTrap, has = this.objects.some(o => o.kind === 'trapdoor');
    if (show && !has) {
      this.objects.push({ kind: 'trapdoor', x: TRAP[0], y: TRAP[1], w: 1, h: 1, walk: true });
      this.signs[`${TRAP[0]},${TRAP[1]}`] = async ow => {
        if ((await DW.ask("La trappe du souterrain. Descendre vers le Village des Poyomon ?")) !== 0) return;
        DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4); await ow.charger('souterrain_jiji', 2, 3, 'down'); await DW.fade(0, 0.4);
      };
      if (this.gfx) DW.World.unprepare(this);
    }
  };

  // ------------------------------------------------------------ le puits : l'échelle vers le souterrain
  const V = MAPS.village_yokomon, well0 = V.signs[`${WELL[0]},${WELL[1]}`];
  V.signs[`${WELL[0]},${WELL[1]}`] = async ow => {
    const f = st().flags;
    if (!f.yokoWell) { await well0(ow); return; }
    // le premier seau : l'eau, en remontant, découvre une échelle de fer
    if (!f.yokoTunnel) {
      await well0(ow);
      f.yokoTunnel = true;
      DW.Audio.sfx('evolve');
      await say("En te penchant, tu remarques des barreaux de fer scellés dans la pierre, juste au-dessus de l'eau. Une échelle ! Elle descend vers un passage creusé sur le côté...");
      await say("Ce puits cache un souterrain !", 'Poyomon');
      return;
    }
    const r = await DW.ask('Le puits des Poyomon.', ["Puiser de l'eau", "Descendre par l'échelle", 'Rien']);
    if (r === 0) await well0(ow);
    else if (r === 1) { DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4); await ow.charger('souterrain_jiji', W - 4, 3, 'down'); await DW.fade(0, 0.4); }
  };

  // ------------------------------------------------------------ la source chaude du village (l'ancienne mare)
  const bath = async ow => {
    const s = st(), f = s.flags;
    if (!f.yokoWell) { await say("Une petite mare tiède... L'eau est trop basse depuis que le puits est à sec."); return; }
    if (f.yokoBath === DW.Time.day()) { await say("Ton équipe a déjà pris son bain aujourd'hui. La source a besoin de se réchauffer : reviens demain !"); return; }
    if ((await DW.ask("Depuis que l'eau est revenue, la mare fume doucement : c'est une source chaude ! Prendre un bain avec ton équipe ?")) !== 0) return;
    f.yokoBath = DW.Time.day();
    DW.Audio.sfx('water'); await DW.fade(0.6, 0.4);
    s.clock += 30;
    for (const m of s.party) { m.heal(); m.tired = 0; m.germs = Math.max(0, (m.germs || 0) - 25); m.addHappy(8); }
    await DW.wait(0.8); await DW.fade(0, 0.4);
    if (DW.Companion) DW.Companion.emote(ow, 'note', 1.6);
    await say("Aaah... L'eau chaude détend tout le monde. Les Poyomon viennent barboter avec vous en chantant ! (soins complets, fatigue effacée, bonheur +8)");
  };
  for (let y = 6; y < 9; y++) for (let x = 25; x < 30; x++) if (Math.hypot((x - 27.5) / 2.4, (y - 7.5) / 1.4) < 1) V.signs[`${x},${y}`] = bath;
})();
