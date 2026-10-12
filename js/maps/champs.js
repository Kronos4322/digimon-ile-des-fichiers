'use strict';
// =====================================================================
//  QUARTIER DES CHAMPS — au sud-ouest de la Ville des Fichiers
//  Champs cultivés, moulin, verger, étang avec cascade et rondins vers l'îlot.
//  Dès le début : le DigiChamp de Tanemon (2 parcelles de Digiviande, 3 Viandes par jour).
//  Habitants (cachés tant qu'ils ne sont pas venus) : Palmon (grange, tout le quartier cultivé), Gomamon (ponton).
// =====================================================================
(function () {
  const { say, st, paint } = DW.MapKit;
  const MAPS = DW.MAPS;
  const T = () => DW.Town;
  const BARN = { x: 8, y: 6, w: 5, h: 3 };
  const FIELDS = [[4, 12], [8, 12], [12, 12], [16, 12], [4, 16], [8, 16], [12, 16], [16, 16]];
  const MEAT = 2; // les 2 premières parcelles : la Digiviande de Tanemon
  const today = () => Math.floor(st().clock / 1440);

  function build() {
    const m = MAPS.champs, has = id => T().has(id);
    const ripe = st().flags.meat !== today();
    const version = ['palmon', 'gomamon'].map(id => (has(id) ? 1 : 0)).join('') + (ripe ? 'm' : '-');
    if (m.version === version && m.rows) return;
    m.version = version;
    const farm = has('palmon');
    m.rows = paint(40, 28, '#', g => {
      g.rect(2, 2, 36, 23, '.');
      for (let x = 1; x < 39; x++) { g.set(x, 1, 'T'); g.set(x, 25, 'T'); }
      for (let y = 1; y < 26; y++) { g.set(1, y, 'T'); g.set(38, y, 'T'); }
      // falaise et cascade au nord-est, étang
      g.rect(25, 4, 13, 2, 'C');
      for (let x = 25; x < 38; x++) if (x % 3 !== 1) g.set(x, 2 + (x % 2), 'T');
      for (let y = 6; y < 23; y++) for (let x = 22; x < 38; x++) if (Math.hypot((x - 30.5) / 6.6, (y - 13.5) / 7) < 1) g.set(x, y, '~');
      for (const [x, y] of [[26, 9], [34, 18], [27, 19]]) if (g.get(x, y) === '~') g.set(x, y, 'w');
      g.rect(30, 6, 2, 2, '~');
      // îlot et rondins depuis la rive ouest
      for (let y = 12; y <= 15; y++) for (let x = 29; x <= 32; x++) if (Math.hypot(x - 30.5, (y - 13.5) * 1.2) < 2) g.set(x, y, '.');
      for (let x = 22; x < 30; x++) if (g.get(x, 13) === '~' || g.get(x, 13) === 'w') g.set(x, 13, '5');
      g.set(31, 13, 'i'); g.set(30, 14, 'f');
      // ponton de Gomamon (côté sud)
      if (has('gomamon')) for (let y = 16; y < 23; y++) for (const x of [29, 30]) if (g.get(x, y) === '~' || g.get(x, y) === 'w') g.set(x, y, '_');
      // chemin depuis la ville et allées des champs
      g.rect(5, 0, 2, 5, '='); g.rect(5, 4, 17, 2, '='); g.rect(20, 5, 2, 17, '='); g.rect(3, 10, 18, 1, '='); g.rect(3, 20, 18, 1, '=');
      g.rect(20, 21, 9, 1, '=');
      // champs (terre labourée sous les potagers)
      for (const [x, y] of FIELDS) g.rect(x, y, 3, 2, '=');
      // verger et décor
      for (const [x, y] of [[4, 22], [7, 23], [10, 22], [13, 23], [16, 22], [24, 23], [36, 23], [2, 7], [36, 7]]) g.set(x, y, 'T');
      g.scatter(farm ? 'f' : 'j', 2, 2, 20, 23, farm ? 20 : 40, 61, ['.']);
      if (farm) { g.set(14, 8, '7'); g.set(15, 9, '7'); g.set(3, 8, 'a'); }
      else { g.scatter('r', 3, 6, 16, 3, 2, 62, ['.']); }
      // grange de Palmon : terrain vague tant qu'il n'est pas venu
      g.rect(BARN.x, BARN.y, BARN.w, BARN.h, '.');
      if (!farm) g.scatter('j', BARN.x, BARN.y, BARN.w, BARN.h, 8, 63, ['.']);
      g.rect(16, 6, 3, 2, '.');
      g.set(7, 2, 'S'); g.set(24, 13, '.'); g.set(2, 11, 'S');
      // décor numérique : tuyau d'irrigation, antenne près du moulin, panneau de circuit dans le verger
      g.set(23, 10, '$'); g.set(19, 7, '!'); g.set(18, 23, '?');
      g.rect(3, 7, 2, 2, '.');
      // sorties : ouest vers le Marais des Geko, sud vers le Tunnel Foreur
      g.rect(0, 19, 4, 3, '='); g.rect(20, 22, 3, 6, '=');
    });
    m.objects = [
      { kind: 'windmill', v: farm ? 1 : 0, x: 16, y: 6, w: 3, h: 2 },
      { kind: 'waterfall', x: 30, y: 4, w: 2, h: 2, oy: 8 },
      ...FIELDS.map(([x, y], i) => (i < MEAT ? { kind: 'meatpatch', v: ripe ? 1 : 0, x, y, w: 3, h: 2 } : { kind: 'vegpatch', v: farm ? 1 : 0, x, y, w: 3, h: 2 })),
      { kind: 'fence', v: 4, x: 22, y: 7, w: 4, h: 1 },
      // DigiChamp de Tanemon : cabane à outils et clôture
      { kind: 'shed', x: 3, y: 7, w: 2, h: 2 },
      { kind: 'fence', v: 9, x: 3, y: 11, w: 9, h: 1, oy: 4 },
    ];
    if (farm) m.objects.push({ kind: 'barn', ...BARN }, { kind: 'laundry', x: 22, y: 9, w: 3, h: 1 }, { kind: 'hangsign', v: 3, x: 13, y: 8, w: 1, h: 1, small: true });
    if (has('gomamon')) m.objects.push({ kind: 'fishing', x: 29, y: 16, w: 1, h: 1, small: true });
    m.npcs = [{ sp: 'tanemon', x: 7, y: 14, face: 'left', wander: 1, talk: tanemonTalk }];
    if (farm) m.npcs.push({ sp: 'palmon', x: 11, y: 9, face: 'left', wander: 2, talk: palmonTalk });
    if (has('gomamon')) m.npcs.push({ sp: 'gomamon', x: 30, y: 16, face: 'right', talk: gomamonTalk });
    m.signs = {
      '7,2': () => say(`Quartier des Champs — Ville des Fichiers (niveau ${T().level()} : « ${T().levelName()} »).  Nord : la place.`),
      '31,13': "Une petite lanterne de pierre sur l'îlot. Il règne ici un calme étonnant.",
      '2,11': 'DigiChamp de Tanemon — Digiviande fraîche tous les jours ! (Demande à Tanemon.)',
      '3,8': "La cabane à outils de Tanemon : arrosoir, fourche et graines de Digiviande.", '4,8': "La cabane à outils de Tanemon : arrosoir, fourche et graines de Digiviande.",
    };
    FIELDS.forEach(([x, y], k) => { for (let i = 0; i < 3; i++) m.signs[`${x + i},${y + 1}`] = () => fieldLook(k < MEAT); });
    DW.World.unprepare(m); delete m.w;
  }
  async function fieldLook(meat) {
    if (meat) { await say(st().flags.meat === today() ? 'Les plants de Digiviande repoussent... La prochaine récolte sera prête demain.' : 'De belles Digiviandes bien mûres pendent aux plants ! Tanemon les récolte pour toi.'); return; }
    if (T().has('palmon')) await say('Les légumes poussent bien ! Palmon s\'en occupe avec soin.');
    else await say('Un champ abandonné, envahi par les mauvaises herbes... Il faudrait quelqu\'un pour le cultiver.');
  }
  // DigiChamp de Tanemon : 3 Viandes une fois par jour (les plants repoussent pour le lendemain)
  async function tanemonTalk(ow) {
    const s = st();
    if (!s.flags.tanemon) {
      s.flags.tanemon = true;
      await say("B-bonjour... Je suis Tanemon. Je m'occupe du DigiChamp : ici, la Digiviande pousse sur les plantes !", 'Tanemon');
      await say("Il n'y a plus que moi en ville pour l'instant... Mais je peux nourrir ton partenaire.", 'Tanemon');
    }
    if (s.flags.meat === today()) { await say('Les plants repoussent... Reviens demain pour la prochaine récolte !', 'Tanemon'); return; }
    await say('Les Digiviandes sont mûres ! Attends, je les cueille pour toi...', 'Tanemon');
    s.flags.meat = today();
    await DW.fade(1, 0.3);
    ow.load('champs', ow.p.x, ow.p.y, ow.p.dir);   // les plants récoltés repoussent à l'écran
    await DW.fade(0, 0.3);
    const extra = DW.giveItem('viande', 3);
    DW.Audio.sfx('buy');
    await say(`Tu reçois 3 Viandes !${DW.extraMsg(extra)}`);
    await say('Donne-en à ton partenaire quand il a faim (menu ENTRÉE → SAC).', 'Tanemon');
    DW.autosave();
  }
  // récolte de Palmon : une fois par jour de jeu
  async function palmonTalk() {
    const s = st(), day = Math.floor(s.clock / 1440);
    await say('Bonjour ! Les champs n\'ont jamais été aussi beaux !', 'Palmon');
    if (s.flags.harvest === day) { await say('Reviens demain pour la prochaine récolte !', 'Palmon'); return; }
    s.flags.harvest = day;
    const n = 2 + (Math.random() < 0.4 ? 1 : 0), sup = Math.random() < 0.25;
    const extra = DW.giveItem('viande', n) + (sup ? DW.giveItem('super_viande', 1) : 0);
    DW.Audio.sfx('buy');
    await say(`Voici la récolte du jour : ${n} Viandes${sup ? ' et une Super Viande' : ''} !${DW.extraMsg(extra)}`, 'Palmon');
  }
  // pêche : une fois par heure de jeu
  async function gomamonTalk() {
    const s = st(), hr = Math.floor(s.clock / 60);
    await say('Hé ! Tu veux pêcher avec moi ?', 'Gomamon');
    if (s.flags.fish === hr) { await say('Les poissons se méfient... Attends un peu !', 'Gomamon'); return; }
    if ((await DW.ask('Lancer la ligne ?')) !== 0) return;
    s.flags.fish = hr;
    await DW.fade(0.4, 0.2); DW.Audio.sfx('water'); await DW.wait(0.8); await DW.fade(0, 0.2);
    const r = Math.random();
    const got = r < 0.45 ? 'viande' : r < 0.6 ? 'super_viande' : r < 0.8 ? 'remede' : null;
    if (!got) { await say('Rien cette fois... Les poissons sont malins !', 'Gomamon'); return; }
    const extra = DW.giveItem(got); DW.Audio.sfx('buy');
    await say(`Ça mord ! Tu obtiens : ${DW.ITEMS[got].name} !${DW.extraMsg(extra)}`);
  }

  MAPS.champs = {
    name: 'Quartier des Champs', music: 'village', bg: 'foret', ambient: 'town', theme: 'farm', climate: 'village', region: 'village',
    build,
    rows: null, objects: [], npcs: [],
    warps: [{ x: 5, y: 0, w: 2, h: 1, dir: 'up', to: 'village', tx: 5, ty: 29 }],
    signs: {},
  };
  build();
})();
