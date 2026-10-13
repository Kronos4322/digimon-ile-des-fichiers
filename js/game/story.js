'use strict';
// =====================================================================
//  HISTOIRE : LES ENGRENAGES NOIRS
//  Devimon a planté un Engrenage Noir dans le cœur d'un Digimon de chaque
//  région. Le battre détruit l'engrenage : il retrouve la mémoire et vient
//  vivre en ville, suivi par un habitant de la région (2 recrues par région).
//  Quand 12 engrenages sont détruits, Devimon attend au sommet de la
//  Montagne de l'Infini (montagne9).
//  Les recrues s'installent en ville et y offrent leurs services : game/services.js.
// =====================================================================
(function () {
  const { say } = DW.MapKit;
  const TS = 16, FINAL = 12;
  const st = () => DW.state;
  const hour = () => DW.Time.hour();
  const day = () => DW.Time.day();
  // service une fois par jour

  // ------------------------------------------------------------ régions : boss possédé + habitant
  // boss : sous-zone 7 ; habitant : sous-zone 4 (il rejoint la ville une fois sa région libérée)
  const REG = {
    montagne: { boss: 'leomon', mate: 'gabumon', lore: "un rugissement furieux résonne entre les rochers" },
    lac: { boss: 'seadramon', mate: 'shellmon', lore: 'les eaux du lac bouillonnent de colère' },
    brumes: { boss: 'unimon', mate: 'patamon', lore: 'une ombre ailée tourne dans le brouillard' },
    marais: { boss: 'gekomon', mate: 'tsunomon', lore: 'un chant lugubre monte des marécages' },
    savane: { boss: 'centarumon', mate: 'agumon', lore: 'un archer fou tire sur tout ce qui bouge' },
    volcan: { boss: 'meramon', mate: 'birdramon', lore: 'un brasier vivant dévale les pentes' },
    usine: { boss: 'andromon', mate: 'tentomon', lore: "les machines de l'usine tournent à plein régime" },
    decharge: { boss: 'etemon', mate: 'sukamon', lore: "un concert assourdissant fait trembler les ordures" },
    tunnel: { boss: 'drimogemon', mate: 'numemon', lore: 'les galeries s\'effondrent les unes après les autres' },
    jouets: { boss: 'monzaemon', mate: 'piximon', lore: 'les jouets ne sourient plus' },
    canyon: { boss: 'ogremon', mate: 'monochromon', lore: 'un gourdin s\'abat sur les voyageurs du canyon' },
    scarabees: { boss: 'okuwamon', mate: 'kabuterimon', lore: 'des pinces géantes tranchent les arbres' },
    dino: { boss: 'skullgreymon', mate: 'greymon', lore: 'un squelette de dinosaure erre dans la vallée' },
    jungle: { boss: 'lillymon', mate: 'togemon', lore: 'les fleurs de la jungle se sont fanées d\'un coup' },
    gel: { boss: 'garurumon', mate: 'frigimon', lore: 'une meute de loups bleus hurle dans la neige' },
    overdell: { boss: 'megadramon', mate: 'bakemon', lore: 'un dragon mécanique survole le cimetière' },
  };
  const RID = Object.keys(REG);
  // certains boss ne se montrent qu'à certaines heures (comme Coelamon dans Digimon World 1)
  const BOSS_TIME = { lac: [5, 10, "à l'aube"], brumes: [20, 5, 'la nuit'], marais: [18, 24, 'le soir'], decharge: [19, 24, 'le soir, pendant son concert'],
    gel: [21, 5, 'la nuit'], overdell: [0, 5, 'au cœur de la nuit'] };
  const inHours = (a, b) => { const h = DW.Time.hour(); return a <= b ? h >= a && h < b : h >= a || h < b; };
  const bossHere = rid => !BOSS_TIME[rid] || inHours(BOSS_TIME[rid][0], BOSS_TIME[rid][1]);
  DW.Story.BOSS_TIME = BOSS_TIME;

  // services des recrues (dans la ville) : rôle affiché à leur arrivée + effet
  const ROLES = {
    leomon: ["Leomon entraîne les Digimon au Terrain : +1 point par séance de Frappe.", 'atk'],
    okuwamon: ["Okuwamon soulève les rochers du Terrain : +1 point par séance de Frappe.", 'atk'],
    kabuterimon: ["Kabuterimon renforce le mur de garde : +1 point par séance de Garde.", 'def'],
    monochromon: ["Monochromon sert de bouclier d'entraînement : +1 point par séance de Garde.", 'def'],
    garurumon: ["Garurumon court avec ton Digimon : +1 point par séance de Sprint.", 'spd'],
    megadramon: ["Megadramon fait la course dans le ciel : +1 point par séance de Sprint.", 'spd'],
    greymon: ["Greymon soulève les poids avec ton Digimon : +1 point par séance d'Endurance.", 'hp'],
    unimon: ["Unimon guide la méditation : +1 point par séance de Méditation.", 'int'],
    piximon: ["Piximon propose un entraînement spécial, une fois par jour.", 'int'],
    centarumon: ['Centarumon ouvre une Clinique : soins complets, maladies et blessures (6 h - 22 h).'],
    andromon: ["Andromon vend des puces de données qui augmentent les statistiques pour toujours."],
    meramon: ['Meramon ouvre les fourneaux du Restaurant : nouveau menu à la carte !'],
    frigimon: ['Frigimon vend ses délicieuses glaces sur la place.'],
    etemon: ['Etemon tient un stand de cartes et organise des concerts.'],
    numemon: ["Numemon tient le panneau d'affichage : les rumeurs de l'île."],
    sukamon: ['Sukamon fouille les poubelles... et trouve parfois des trésors (1 fois par jour).'],
    drimogemon: ['Drimogemon creuse pour toi, une fois par jour.'],
    monzaemon: ['Monzaemon distribue des câlins : bonheur pour toute l\'équipe, une fois par jour.'],
    gekomon: ['Gekomon chante des berceuses : fatigue envolée, une fois par jour.'],
    seadramon: ['Seadramon fait le passeur jusqu\'au Lac Dragon, à 8 h et à 17 h, depuis l\'étang des Champs.'],
    bakemon: ['Bakemon tient une boutique de nuit, à partir de 20 h.'],
    birdramon: ['Birdramon peut te faire voler vers les lieux déjà visités.'],
    tentomon: ['Tentomon répare les Disques : il vend des Disques PM.'],
    lillymon: ['Lillymon fait pousser des fruits : une récolte par jour.'],
    togemon: ['Togemon enseigne des techniques : il vend des Manuels.'],
    shellmon: ['Shellmon pêche pour la ville : un poisson par jour.'],
    gabumon: ['Gabumon donne des conseils sur les Digivolutions.'],
    patamon: ['Patamon veille sur les bébés du Village des Bébés.'],
    tsunomon: ['Tsunomon raconte ce qu\'il a vu dans les marais.'],
    agumon: ['Agumon est toujours partant pour un petit combat d\'entraînement.'],
    skullgreymon: ['SkullGreymon garde l\'entrée de la ville. Plus personne n\'ose s\'en approcher !'],
    ogremon: ["Ogremon s'est mis à l'entraînement : il propose des combats d'entraînement."],
  };

  // ajout des recrues à la ville (zone = sous-zone où on les trouve)
  for (const rid of RID) {
    const R = REG[rid];
    for (const [sp, k] of [[R.boss, 7], [R.mate, 4]]) {
      const role = ROLES[sp] || [`${sp} s'installe en ville.`];
      DW.Town.RECRUITS.push({ id: sp, zone: rid + k, role: role[0], train: role[1], region: rid, boss: k === 7 });
    }
  }
  DW.Town.LEVELS.push('Capitale', 'Grande Capitale', 'Cité Digitale', 'Cité Lumière', 'Ville Légendaire');
  // bonus d'entraînement des recrues (le Terrain n'est pas modifié : ce sont des coachs)
  DW.Town.trainBonus = k => DW.Town.RECRUITS.filter(r => r.train === k && DW.Town.has(r.id)).length;

  const Story = DW.Story;
  Story.REG = REG;
  Story.gears = () => RID.filter(r => (st().gears || {})[r]).length;

  // ------------------------------------------------------------ PNJ ajoutés aux cartes (après préparation des graphismes)
  // case libre : praticable avec ses 8 voisines, loin des portes, passages, panneaux et autres PNJ
  function freeSpots(ow, avoid, spacing, sx, sy) {
    const m = ow.map, out = [], doors = [...(m.doors || []), ...(m.warps || [])];
    const bad = (x, y) => ow.solid(x, y) || (m.signs && m.signs[x + ',' + y]) || DW.World.isTall(ow.tileAt(x, y)) || '~w_'.includes(ow.tileAt(x, y));
    const cand = [];
    for (let y = 2; y < m.h - 2; y++) for (let x = 2; x < m.w - 2; x++) {
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (bad(x + dx, y + dy)) { ok = false; break; }
      if (!ok || doors.some(d => x >= d.x - 2 && x <= d.x + (d.w || 1) + 1 && y >= d.y - 2 && y <= d.y + (d.h || 1) + 1)) continue;
      cand.push([sx != null ? Math.hypot(x - sx, y - sy) : DW.Art.hash(x, y, 909), x, y]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    for (const [, x, y] of cand) {
      if ([...avoid, ...out].some(([ax, ay]) => Math.abs(ax - x) + Math.abs(ay - y) < spacing)) continue;
      out.push([x, y]);
    }
    return out;
  }
  // services des recrues et stands : game/services.js
  const { homeOf, TOWN, talkRecruit, DISTRICT_HOME_IDS } = DW.Services;
  Story.KIOSK = DW.Services.KIOSK; Story.placeKiosks = DW.Services.placeKiosks;   // (appelé par les cartes de la ville)
  // appelé par Overworld.load une fois la carte prête
  Story.decorate = ow => {
    const m = ow.map, id = ow.mapId, s = st();
    m.npcs = (m.npcs || []).filter(n => !n.story);
    const avoid = m.npcs.map(n => [n.x, n.y]).concat([[ow.p.x, ow.p.y]], Object.values(m.kiosks || {}));
    if (id === 'village' || id === 'champs' || DISTRICT_HOME_IDS.includes(id)) {
      const here = DW.Town.RECRUITS.filter(r => r.region && DW.Town.has(r.id) && homeOf(r.id) === id);
      if (!here.length) return;
      const spots = freeSpots(ow, avoid, 3);
      here.forEach((r, i) => {
        const T = TOWN[r.id] || {}, kp = (m.kiosks || {})[r.id], p = kp || (T.spot ? T.spot(ow, spots) : spots[i]);
        if (!p) return;
        m.npcs.push({ sp: r.id, x: p[0], y: p[1], face: kp ? 'down' : i % 2 ? 'left' : 'right', wander: kp || T.still ? 0 : 1, story: true, cond: T.cond, talk: async ow2 => { if (DW.Requests && (await DW.Requests.talk(r.id))) return; await talkRecruit(r.id, ow2); } });
      });
      return;
    }
    const rid = m.region, R = REG[rid], k = +(id.match(/(\d+)$/) || [0, -1])[1];
    if (!R || !m.spec) return;
    const near = () => freeSpots(ow, avoid, 3, m.spec.hub[0] - 3, m.spec.hub[1] + 1)[0];
    if (k === 7) {
      const p = near(); if (!p) return;
      m.npcs.push({ sp: R.boss, x: p[0], y: p[1], face: 'left', gear: true, story: true, cond: s => !(s.gears || {})[rid] && bossHere(rid), talk: ow2 => bossFight(rid, ow2) });
    }
    if (k === 4) {
      const p = near(); if (!p) return;
      m.npcs.push({ sp: R.mate, x: p[0], y: p[1], face: 'right', story: true, cond: s => !DW.Town.has(R.mate), talk: () => mateTalk(rid) });
    }
    if (id === 'montagne9') {
      const p = near(); if (!p) return;
      m.npcs.push({ sp: 'devimon', x: p[0], y: p[1], face: 'left', gear: true, story: true, cond: s => Story.gears() >= FINAL && !s.flags.devimon, talk: ow2 => finalFight(ow2) });
    }
  };

  // ------------------------------------------------------------ combats de l'histoire
  const lvOf = rid => (DW.Wild.TABLES[rid] || [10])[0];
  // niveau des boss possédés, réglé au simulateur : ~65 % de victoire (médiane sur 7 lignées de partenaires)
  // pour un partenaire entraîné arrivé au bout de la région (niveau de la région + 4)
  const BOSS_LV = { montagne: 10, lac: 12, brumes: 12, marais: 12, savane: 14, volcan: 21, usine: 23, decharge: 22, tunnel: 24,
    jouets: 23, canyon: 28, scarabees: 26, dino: 28, jungle: 29, gel: 32, overdell: 35 };
  async function bossFight(rid, ow) {
    const R = REG[rid], name = DW.SPECIES[R.boss].name, s = st();
    await say(`Un Engrenage Noir tourne dans le dos de ${name}... Ses yeux sont vides.`);
    await say('GRRR... DÉTRUIRE... TOUT DÉTRUIRE...', name);
    if (!s.party.some(m => m.hp > 0)) { await say('Il te faut un Digimon en forme pour l\'affronter !'); return; }
    if ((await DW.ask(`Affronter ${name} et briser l'Engrenage Noir ?`)) !== 0) return;
    const res = await ow.battle({ enemy: new DW.Digimon(R.boss, BOSS_LV[rid] || lvOf(rid) + 4), boss: true, canLose: false, intro: `${name}, possédé par l'Engrenage Noir, attaque !` });
    if (res !== 'win') { await say(`(${name} était trop fort... Entraîne-toi, équipe-toi, et retourne le libérer !)`); return; }   // défaite : déjà ramené chez Jijimon
    s.gears = s.gears || {}; s.gears[rid] = true;
    DW.Audio.sfx('super');
    ow.shake = 0.6;
    await say(`L'Engrenage Noir se brise en mille morceaux !  (${Story.gears()} / ${RID.length})`);
    await say(`Hein... ? Où suis-je ? Je me souviens... une ombre m'a planté cette chose dans le dos. Merci, tu m'as libéré !`, name);
    await say(`Laisse-moi t'aider : je pars m'installer à la Ville des Fichiers !`, name);
    await DW.Town.recruit(R.boss);
    s.party.forEach(m => m.heal());
    if (Story.gears() === FINAL) await say("Le ciel s'assombrit au-dessus de la Montagne de l'Infini... Quelqu'un t'attend là-haut.");
  }
  async function mateTalk(rid) {
    const R = REG[rid], name = DW.SPECIES[R.mate].name, s = st();
    if (!(s.gears || {})[rid]) {
      await say(`Chut... Ne fais pas de bruit. Plus loin dans la région, ${R.lore}.`, name);
      await say(`C'est ${DW.SPECIES[R.boss].name}... Il n'est plus lui-même depuis qu'un Engrenage Noir est tombé du ciel. Si tu le libères, je te suivrai !`, name);
      if (BOSS_TIME[rid]) await say(`On ne le voit que ${BOSS_TIME[rid][2]}, entre ${BOSS_TIME[rid][0]} h et ${BOSS_TIME[rid][1] % 24} h. Le reste du temps, il disparaît...`, name);
      return;
    }
    await say(`Tu as libéré ${DW.SPECIES[R.boss].name} ! La région respire de nouveau.`, name);
    await say('Je viens avec toi : la Ville des Fichiers a besoin de bras !', name);
    await DW.Town.recruit(R.mate);
  }
  async function finalFight(ow) {
    const s = st();
    await say('Ainsi, c\'est toi qui brises mes Engrenages Noirs...', 'Devimon');
    await say("Cette île m'appartient. Les Digimon sans mémoire sont de si dociles serviteurs... Je vais t'effacer, toi et ton partenaire !", 'Devimon');
    if ((await DW.ask('Affronter Devimon ?')) !== 0) { await say('Fuis donc... Je t\'attendrai.', 'Devimon'); return; }
    const res = await ow.battle({ enemy: new DW.Digimon('devimon', 40), boss: true, canLose: false, music: 'boss', intro: 'Devimon déploie ses ailes noires !' });
    if (res !== 'win') { await say('(Devimon était trop fort... Prépare-toi mieux avant de retourner au sommet.)'); return; }
    await say('Impossible... Battu par... un enfant...', 'Devimon');
    s.flags.devimon = true;
    await ending(ow);
  }
  async function ending(ow) {
    const s = st();
    DW.Audio.play('victory');
    await DW.fade(1, 1.2, '#ffffff');
    await DW.Game.push(new EndingScene());
    s.flags.ending = true;
    ow.load('village', ...DW.MapKit.zpt('village', 20, 16), 'down');
    await DW.fade(0, 1);
    await say('Bravo, mon enfant ! L\'île est libérée et la ville n\'a jamais été aussi vivante.', 'Jijimon');
    await say("L'aventure continue : il reste des Digimon à élever, des tournois à gagner et des cartes à collectionner !", 'Jijimon');
    DW.autosave();
  }
  class EndingScene extends DW.Scene {
    constructor() {
      super();
      const s = st(), m = s.party[0];
      this.lines = ['L\'Île des Fichiers est libérée.', '', `${s.name} et ${m ? m.name : 'son partenaire'}`, 'ont brisé les Engrenages Noirs', 'et vaincu Devimon.', '',
        `Habitants de la ville : ${DW.Town.level()}`, `Digimon rencontrés : ${Object.keys(s.seen).length}`, `Jours passés sur l'île : ${DW.Time.day()}`, '', 'Merci d\'avoir joué !', '', '— FIN —'];
    }
    update() { if (this.t > 4 && (DW.Input.hit('ok') || DW.Input.hit('back'))) this.close(); }
    draw(c) {
      c.fillStyle = '#0a0a1a'; c.fillRect(0, 0, DW.W, DW.H);
      for (let i = 0; i < 40; i++) { const x = (i * 97 + this.t * (6 + i % 5)) % DW.W, y = (i * 53) % DW.H; c.fillStyle = `rgba(160,220,255,${0.3 + 0.3 * Math.sin(this.t * 2 + i)})`; c.fillRect(Math.round(x), y, 1, 1); }
      const y0 = DW.H + 10 - this.t * 22;
      this.lines.forEach((l, i) => { const y = Math.max(y0 + i * 16, 40 + i * 14 - (this.lines.length * 14 - 160)); DW.UI.text(c, l, DW.W / 2, y, { size: i === this.lines.length - 1 ? 12 : 9, align: 'center', color: i === 0 ? '#ffe070' : '#ffffff' }); });
      const m = st().party[0];
      if (m) DW.Sprites.draw(c, DW.Sprites.battle(m.sp), DW.W / 2, DW.H - 10, { frame: Math.floor(this.t * 6) });
      if (this.t > 4) DW.UI.text(c, 'ESPACE', DW.W - 8, DW.H - 6, { size: 6, align: 'right', color: '#7a8ab8', shadow: false });
    }
  }

  // ------------------------------------------------------------ dessin de l'Engrenage Noir (au-dessus du boss)
  Story.drawGear = (c, x, y, t, sp) => {
    const spr = DW.Sprites.ow(sp), cy = Math.round(y - spr.h - 4 + Math.sin(t * 2) * 1.5), cx = Math.round(x), a = t * 2;
    c.fillStyle = 'rgba(40,0,60,0.28)'; c.beginPath(); c.ellipse(cx, y - spr.h / 2, spr.w / 2 + 3 + Math.sin(t * 5), spr.h / 2 + 2, 0, 0, 7); c.fill();
    c.fillStyle = '#16121c';
    for (let i = 0; i < 8; i++) { const b = a + i * Math.PI / 4; c.fillRect(Math.round(cx + Math.cos(b) * 5) - 1, Math.round(cy + Math.sin(b) * 5) - 1, 3, 3); }
    c.beginPath(); c.arc(cx, cy, 4.2, 0, 7); c.fill();
    c.fillStyle = '#8a3ac8'; c.beginPath(); c.arc(cx, cy, 1.6, 0, 7); c.fill();
  };

  // ------------------------------------------------------------ journal de quête (Menu → JOURNAL)
  class JournalScene extends DW.Scene {
    // trois pages : 0 Engrenages Noirs, 1 Requêtes des habitants, 2 Écussons et enfants perdus
    constructor() { super(); this.i = 0; this.ci = 0; this.tab = 0; }
    update() {
      const In = DW.Input, d = In.hit('left') ? -1 : In.hit('right') ? 1 : 0;
      if (d) { this.tab = (this.tab + d + 3) % 3; DW.Audio.sfx('move'); }
      if (In.hit('back') || In.hit('ok') || In.hit('menu')) { DW.Audio.sfx('back'); this.close(); return; }
      if (this.tab === 2) {
        const n = DW.Crests.ORDER.length;
        if (In.hit('up')) { this.ci = (this.ci + n - 1) % n; DW.Audio.sfx('move'); }
        if (In.hit('down')) { this.ci = (this.ci + 1) % n; DW.Audio.sfx('move'); }
        return;
      }
      if (this.tab === 1) return;
      if (DW.Input.hit('up')) { this.i = (this.i + RID.length - 1) % RID.length; DW.Audio.sfx('move'); }
      if (DW.Input.hit('down')) { this.i = (this.i + 1) % RID.length; DW.Audio.sfx('move'); }
      if (DW.Input.hit('back') || DW.Input.hit('ok') || DW.Input.hit('menu')) { DW.Audio.sfx('back'); this.close(); }
    }
    draw(c) {
      const UI = DW.UI, s = st(), g = s.gears || {}, W = DW.W;
      if (this.tab === 1) return this.drawRequests(c);
      if (this.tab === 2) return this.drawCrests(c);
      UI.menuBg(c, this.t, 'JOURNAL');
      UI.text(c, `Engrenages Noirs : ${Story.gears()} / ${RID.length}`, W - 12, 17, { size: 8, align: 'right', color: '#ffe070' });
      UI.text(c, '◀ ÉCUSSONS · REQUÊTES ▶', W - 12, 27, { size: 6, align: 'right', color: '#9ab0e8' });
      const top = Math.max(0, Math.min(this.i - 4, RID.length - 9));
      RID.slice(top, top + 9).forEach((r, j) => {
        const idx = top + j, y = 34 + j * 15, M = DW.MAPS[DW.REGION_ENTRY[r]], seen = Object.keys(DW.MAPS).some(id => DW.MAPS[id].region === r && s.visited[id]);
        if (idx === this.i) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(8, y - 10, W - 16, 14); }
        UI.text(c, seen ? M.regionName : '???', 16, y, { size: 8, color: seen ? '#ffffff' : '#7a8ab8' });
        UI.text(c, g[r] ? 'Libérée' : seen ? 'Engrenage actif' : '', W - 16, y, { size: 7, align: 'right', color: g[r] ? '#7aff9a' : '#ff8a8a' });
      });
      const r = RID[this.i], R = REG[r], seen = Object.keys(DW.MAPS).some(id => DW.MAPS[id].region === r && s.visited[id]);
      UI.box(c, 6, 176, W - 12, 58);
      const txt = !seen ? 'Région encore inexplorée. Consulte la carte (Menu → CARTE).'
        : g[r] ? `${DW.SPECIES[R.boss].name} a été libéré${DW.Town.has(R.mate) ? ` et ${DW.SPECIES[R.mate].name} s'est installé en ville` : `. ${DW.SPECIES[R.mate].name} t'attend quelque part dans la région`}.`
        : `On raconte ${/^[aeiouyéh]/i.test(R.lore) ? "qu'" : 'que '}${R.lore}. Un Digimon possédé se cache au fond de la région${BOSS_TIME[r] ? ` (seulement ${BOSS_TIME[r][2]}, ${BOSS_TIME[r][0]} h – ${BOSS_TIME[r][1] % 24} h)` : ''}.`;
      UI.wrap(c, txt, 290, 8).slice(0, 3).forEach((l, j) => UI.text(c, l, 14, 192 + j * 11, { size: 8, color: '#c8f0ff' }));
      const fin = Story.gears() >= FINAL ? (s.flags.devimon ? 'Devimon est vaincu !' : "Devimon t'attend au sommet de la Montagne de l'Infini !") : `Brise ${FINAL} engrenages pour affronter leur maître.`;
      UI.text(c, fin, 14, 228, { size: 7, color: '#ffe070' });
    }
  }
  // onglet Requêtes : les demandes acceptées des habitants
  JournalScene.prototype.drawRequests = function (c) {
    const UI = DW.UI, W = DW.W, L = DW.Requests ? DW.Requests.list() : [];
    UI.menuBg(c, this.t, 'JOURNAL — REQUÊTES');
    UI.text(c, '◀ ENGRENAGES · ÉCUSSONS ▶', W - 12, 17, { size: 7, align: 'right', color: '#9ab0e8' });
    if (!L.length) UI.wrap(c, "Aucune requête en cours. Les habitants qui ont besoin d'aide ont un « ! » au-dessus de la tête : va leur parler en ville !", 280, 9).forEach((l, j) => UI.text(c, l, 18, 50 + j * 14, { size: 9, color: '#c8f0ff' }));
    L.slice(0, 9).forEach(([sp, q], j) => {
      const y = 40 + j * 20, ok = DW.Requests.ready(sp, q);
      UI.text(c, DW.SPECIES[sp].name, 16, y, { size: 8, color: '#ffe070' });
      const what = q.k === 'item' ? `${q.n} × ${DW.ITEMS[q.a].name} (${Math.min(q.n, DW.state.bag[q.a] || 0)}/${q.n})` : q.k === 'defeat' ? `Vaincre ${q.n} sauvage(s)${q.a ? ' ' + q.a : ''} (${q.prog}/${q.n})` : `Partenaire : ${q.n} en ${{ hp: 'PV', atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intelligence' }[q.a]}`;
      UI.text(c, what, 96, y, { size: 7, color: ok ? '#7aff8a' : '#c8f0ff' });
      if (ok) UI.text(c, 'Prêt !', W - 14, y, { size: 7, align: 'right', color: '#7aff8a' });
    });
  };
  // onglet Écussons : les sept écussons, les enfants perdus, et où chercher (data/ecussons.js, maps/donjons.js)
  JournalScene.prototype.drawCrests = function (c) {
    const UI = DW.UI, W = DW.W, C = DW.Crests, s = st();
    UI.menuBg(c, this.t, 'JOURNAL — ÉCUSSONS');
    UI.text(c, '◀ REQUÊTES · ENGRENAGES ▶', W - 12, 17, { size: 7, align: 'right', color: '#9ab0e8' });
    UI.text(c, `Écussons : ${C.count()} / ${C.ORDER.length}`, W - 12, 28, { size: 8, align: 'right', color: '#ffe070' });
    C.ORDER.forEach((k, j) => {
      const y = 46 + j * 17, on = j === this.ci, has = C.has(k), own = s.hero === k, H = DW.HEROES[k];
      if (on) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(8, y - 12, W - 16, 16); }
      const ic = DW.World.obj('crest', j);
      c.globalAlpha = has ? 1 : 0.35; c.drawImage(ic.img, 14, y - 11, 11, 13); c.globalAlpha = 1;
      UI.text(c, `Écusson ${C.name(k)}`, 32, y, { size: 8, color: has ? C.color(k) : '#7a8ab8' });
      UI.text(c, own ? 'ton écusson' : H.name, 150, y, { size: 7, color: '#c8f0ff' });
      UI.text(c, has ? 'Trouvé' : own ? 'Caché' : C.kidFound(k) ? 'Délivré' : 'Disparu', W - 16, y, { size: 7, align: 'right', color: has ? '#7aff9a' : '#ff8a8a' });
    });
    const k = C.ORDER[this.ci], D = DW.Donjons && DW.Donjons.LIST.find(x => x.kid === k), own = s.hero === k;
    const where = D ? DW.MAPS[DW.REGION_ENTRY[D.region]].regionName : '?';
    const txt = C.has(k) ? `Débloque les Ultimes : ${C.ULTIMES[k].map(sp => DW.SPECIES[sp].name).join(', ')}. (Les sept écussons réunis : la Méga.)`
      : own ? `Ton propre écusson repose dans un lieu secret de « ${where} ». Cherche un portail ancien gravé de son symbole.`
      : `${DW.HEROES[k].name} a disparu. On raconte qu'un portail ancien, gravé du symbole ${C.name(k)}, se cache dans « ${where} »...`;
    UI.box(c, 6, 176, W - 12, 58);
    UI.wrap(c, txt, 290, 8).slice(0, 4).forEach((l, j) => UI.text(c, l, 14, 192 + j * 11, { size: 8, color: '#c8f0ff' }));
  };
  Story.JournalScene = JournalScene;
})();
