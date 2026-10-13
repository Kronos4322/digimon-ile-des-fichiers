'use strict';
// =====================================================================
//  HISTOIRE : LES ENGRENAGES NOIRS
//  Devimon a planté un Engrenage Noir dans le cœur d'un Digimon de chaque
//  région. Le battre détruit l'engrenage : il retrouve la mémoire et vient
//  vivre en ville, suivi par un habitant de la région (2 recrues par région).
//  Quand 12 engrenages sont détruits, Devimon attend au sommet de la
//  Montagne de l'Infini (montagne9).
//  Les recrues s'installent dans la Ville des Fichiers et le Quartier des
//  Champs et y offrent leurs services (clinique, puces, restaurant...).
// =====================================================================
(function () {
  const { say } = DW.MapKit;
  const TS = 16, FINAL = 12;
  const st = () => DW.state;
  const hour = () => DW.Time.hour();
  const open = () => hour() >= 6 && hour() < 22;          // horaires des commerces
  const day = () => DW.Time.day();
  // service une fois par jour
  const daily = k => { const s = st(), d = s.daily = s.daily || {}; if (d[k] === day()) return false; d[k] = day(); return true; };

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
  // ------------------------------------------------------------ stands des recrues (comme les boutiques de la Ville des Fichiers de DW1)
  // Chaque recrue qui rend un service tient un stand avec une enseigne : on voit tout de suite qui fait quoi.
  // Placés à la construction de la carte (ville, Champs, quartiers), sur un terrain libre près des chemins.
  // [pictogramme du stand, texte de l'enseigne]
  const KIOSK = {
    centarumon: [0, 'Clinique de Centarumon — Soins complets : PV, PM, maladies et blessures. Ouvert de 6 h à 22 h.'],
    andromon: [1, "Atelier d'Andromon — Puces de données : des statistiques augmentées pour toujours. Ouvert de 6 h à 22 h."],
    meramon: [2, 'Grill de Meramon — Riz, poisson, Super Viande et gâteaux, cuits au feu de Meramon. Ouvert de 6 h à 22 h.'],
    frigimon: [3, 'Glacier de Frigimon — Glaces et bonbons, toute la journée.'],
    etemon: [4, "Stand d'Etemon — Paquets de cartes Digimon pour compléter ton album."],
    tentomon: [5, 'Réparations de Tentomon — Disques PM et Repousse. Ouvert de 6 h à 22 h.'],
    togemon: [6, "Librairie de Togemon — Manuels pour apprendre de nouvelles techniques. Ouvert de 6 h à 22 h."],
    bakemon: [7, 'Boutique de nuit de Bakemon — Ouverte de 20 h à 5 h... Hihihi.'],
    numemon: [8, "Panneau des rumeurs de Numemon — Toutes les nouvelles de l'île."],
    birdramon: [9, 'Relais de Birdramon — Vols vers les lieux que tu as déjà visités.'],
    monzaemon: [10, 'Maison des câlins de Monzaemon — Un câlin géant par jour : toute ton équipe est plus heureuse.'],
    gekomon: [11, 'Scène de Gekomon — Une berceuse par jour qui chasse la fatigue de ton équipe.'],
    piximon: [12, 'Dojo de Piximon — Un entraînement spécial par jour, sur toutes les statistiques.'],
    sukamon: [13, 'Brocante de Sukamon — Une trouvaille par jour (on ne demande pas d\'où elle vient).'],
    drimogemon: [13, 'Fouilles de Drimogemon — Une trouvaille par jour, déterrée pour toi.'],
    lillymon: [13, 'Verger de Lillymon — Des fruits frais chaque jour.'],
    shellmon: [13, 'Poissonnerie de Shellmon — Un poisson par jour.'],
    agumon: [14, "Ring d'Agumon — Un combat d'entraînement par jour, sans rien perdre."],
    ogremon: [14, "Ring d'Ogremon — Un combat d'entraînement par jour, sans rien perdre."],
    gabumon: [15, 'Bureau de Gabumon — Des conseils sur les Digivolutions de ton partenaire.'],
  };
  Story.KIOSK = KIOSK;
  Story.placeKiosks = (m, id) => {
    m.kiosks = {};
    const who = DW.Town.RECRUITS.filter(r => r.region && KIOSK[r.id] && DW.Town.has(r.id) && homeOf(r.id) === id);
    if (!who.length) return;
    const rows = m.rows, H = rows.length, W = rows[0].length, GROUND = '.f=zvoj';
    const busy = new Set();
    const mark = (x0, y0, w, h, pad) => { for (let y = y0 - pad; y < y0 + h + pad; y++) for (let x = x0 - pad; x < x0 + w + pad; x++) busy.add(x + ',' + y); };
    for (const o of m.objects || []) mark(o.x, o.y, o.w || 1, o.h || 1, 1);
    for (const d of [...(m.doors || []), ...(m.warps || [])]) mark(d.x, d.y, d.w || 1, d.h || 1, 4);
    for (const n of m.npcs || []) mark(n.x, n.y, 1, 1, 2);
    for (const [x, y] of m.walkSpots || []) mark(x, y, 1, 1, 2);   // promeneurs des quartiers
    for (const k in m.signs || {}) { const [x, y] = k.split(',').map(Number); mark(x, y, 1, 1, 1); }
    const fits = (kx, ky) => {
      for (let y = ky - 2; y <= ky + 3; y++) for (let x = kx - 1; x <= kx + 3; x++) {
        if (y < 2 || x < 2 || y >= H - 2 || x >= W - 2 || !GROUND.includes(rows[y][x]) || busy.has(x + ',' + y)) return false;
        if (y <= ky && '=zo'.includes(rows[y][x])) return false;   // le stand borde le chemin sans le barrer
      }
      return true;
    };
    // près des chemins et des places, mais pas dessus en plein milieu
    const cand = [];
    for (let y = 3; y < H - 4; y++) for (let x = 3; x < W - 5; x++) {
      if (!fits(x, y)) continue;
      let paths = 0;
      for (let dy = -3; dy <= 4; dy++) for (let dx = -3; dx <= 5; dx++) { const ch = (rows[y + dy] || '')[x + dx]; if (ch === '=' || ch === 'z' || ch === 'o') paths++; }
      if (paths < 4) continue;
      cand.push([-paths + DW.Art.hash(x, y, 515) * 12, x, y]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const placed = [];
    for (const r of who) {
      const c = cand.find(([, x, y]) => !placed.some(([px, py]) => Math.abs(px - x) < 8 && Math.abs(py - y) < 6));
      if (!c) continue;
      const [, x, y] = c, [v, text] = KIOSK[r.id];
      placed.push([x, y]);
      m.objects.push({ kind: 'kiosk', v, x, y, w: 3, h: 1 });
      for (let i = 0; i < 3; i++) m.signs[`${x + i},${y}`] = text;
      m.kiosks[r.id] = [x + 1, y + 1];
    }
  };
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

  // ------------------------------------------------------------ recrues en ville : place et services
  // quand un quartier périphérique existe (maps/quartiers.js), certaines recrues y déménagent
  const DISTRICT_HOME = {
    frigimon: 'marche', etemon: 'marche', togemon: 'marche', bakemon: 'marche', meramon: 'marche',
    andromon: 'numerique', tentomon: 'numerique',
    centarumon: 'residentiel', monzaemon: 'residentiel', numemon: 'residentiel', gekomon: 'residentiel', piximon: 'residentiel',
  };
  const DISTRICT_HOME_IDS = ['residentiel', 'marche', 'numerique'];
  function homeOf(sp) {
    const d = DISTRICT_HOME[sp];
    if (d && DW.Quartiers && DW.Quartiers.open(d)) return d;
    return TOWN[sp] ? TOWN[sp].home : 'champs';
  }
  const shop = list => DW.Game.push(new DW.ShopScene(list));   // liste ou nom de boutique (DW.SHOPS)
  const closed = async name => { await say(`C'est fermé ! Reviens entre 6 h et 22 h.`, name); };
  const TOWN = {
    centarumon: { home: 'village', async talk(n) {
      if (!open()) return closed(n);
      await say('Bienvenue à la Clinique. Laisse-moi examiner ton équipe...', n);
      for (const m of st().party) { m.heal(); m.sick = 0; m.hurt = 0; }
      DW.Audio.sfx('heal'); await say('Voilà : PV, PM, maladies et blessures, tout est soigné !', n);
    } },
    andromon: { home: 'village', async talk(n) { if (!open()) return closed(n); await say('Puces de données. Installation instantanée. Effet permanent.', n); await shop('puces'); } },
    meramon: { home: 'village', async talk(n) { if (!open()) return closed(n); await say('Le Restaurant est ouvert ! Tout est cuit au feu de Meramon !', n); await shop('resto'); } },
    frigimon: { home: 'village', async talk(n) { await say('Une glace ? Elles sont fraîches de ce matin !', n); await shop('fruits'); } },
    etemon: { home: 'village', async talk(n) { await say('Yeah baby ! Des cartes, des cartes, encore des cartes !', n); await shop('cartes'); } },
    tentomon: { home: 'village', async talk(n) { if (!open()) return closed(n); await say('Je répare les vieux Disques. Il en faut ?', n); await shop('disques'); } },
    togemon: { home: 'village', async talk(n) { if (!open()) return closed(n); await say('Un Digimon doit apprendre en lisant, pas seulement en se battant !', n); await shop('savoir'); } },
    bakemon: { home: 'village', cond: () => hour() >= 20 || hour() < 5, async talk(n) { await say('Hihihi... La boutique de nuit est ouverte...', n); await shop('nuit'); } },
    numemon: { home: 'village', async talk(n) { await say("Le panneau des rumeurs ! Voyons voir...", n); await rumor(n); } },
    birdramon: { home: 'village', async talk(n) { await say('Je peux te porter dans les airs !', n); if (DW.Story.services && DW.Story.services.biyomon) await DW.Story.services.biyomon(); } },
    monzaemon: { home: 'village', async talk(n) {
      if (!daily('monzaemon')) return say('Reviens demain pour un autre câlin !', n);
      st().party.forEach(m => m.addHappy(10)); DW.Audio.sfx('buff'); await say('Câlin géant ! Toute ton équipe est heureuse (bonheur +10) !', n);
    } },
    gekomon: { home: 'village', async talk(n) {
      if (!daily('gekomon')) return say('Ma voix doit se reposer... Reviens demain !', n);
      st().party.forEach(m => { m.tired = 0; }); DW.Audio.sfx('heal'); await say('♪ Dors, petit Digimon... ♪  La fatigue de ton équipe s\'est envolée.', n);
    } },
    piximon: { home: 'village', async talk(n) {
      const m = st().party[0]; if (!m) return;
      const r = await DW.ask('Pix ! Entraînement spécial, ou objets de Digivolution ?', ['Entraînement', 'Objets', 'Au revoir'], n);
      if (r === 1) { await shop('evolution'); return; }
      if (r !== 0) return;
      if (!daily('piximon')) return say('Pix ! Un entraînement spécial par jour, pas plus !', n);
      let g = 0; for (const k of ['hp', 'mp', 'atk', 'def', 'spd', 'int']) g += DW.Training.gain(m, k, 1);
      m.tired = Math.min(100, m.tired + 40);
      await say(g ? `Pix pix ! Entraînement spécial terminé : ${m.name} gagne ${g} points d'entraînement !` : `${m.name} a atteint son potentiel... Gagne des niveaux en combat !`, n);
    } },
    sukamon: { home: 'champs', async talk(n) { if (!daily('sukamon')) return say('Les poubelles sont vides pour aujourd\'hui...', n); await gift(n, ['viande_moisie', 'digichampi', 'champi_joie', 'disque_pm', 'medoc', 'cartes', 'gland_or'], 'J\'ai trouvé ça dans les ordures !'); } },
    drimogemon: { home: 'champs', async talk(n) { if (!daily('drimogemon')) return say('Mes griffes sont usées pour aujourd\'hui.', n); await gift(n, ['super_viande', 'reveil', 'pm_m', 'soin_m', 'gland_or', 'fruit_force', 'glace_force', 'feuille_vite', 'fruit_sage', 'manuel'], 'Je creuse, je creuse... Trouvé !'); } },
    lillymon: { home: 'champs', async talk(n) { if (!daily('lillymon')) return say('Les fruits repoussent... Reviens demain !', n); await gift(n, ['pomme_bleue', 'baie_rouge', 'figue', 'noix_douce', 'orange_bana'], 'Une récolte fraîche, rien que pour toi !'); } },
    shellmon: { home: 'champs', async talk(n) { if (!daily('shellmon')) return say('Plus de poisson aujourd\'hui.', n); await gift(n, ['digianchois', 'digivivaneau', 'digitruite'], 'Belle pêche aujourd\'hui !'); } },
    seadramon: { home: 'champs', still: true,
      spot: (ow) => { for (let y = 2; y < ow.map.h - 2; y++) for (let x = 2; x < ow.map.w - 2; x++) if (!ow.solid(x, y) && ow.tileAt(x + 1, y) === '~' && !ow.npcAt(x, y)) return [x, y]; return null; },
      cond: () => { const h = hour(); return (h >= 7.5 && h < 9) || (h >= 16.5 && h < 18); },
      async talk(n, ow) {
        if ((await DW.ask('Je pars pour le Lac Dragon. Tu montes sur mon dos ?', ['Oui', 'Non'], n)) !== 0) return;
        const id = DW.REGION_ENTRY.lac, m = DW.getMap(id);
        DW.Audio.sfx('swoosh'); await DW.fade(1, 0.6, '#5ab0ff');
        const hub = m.spec.hub; ow.load(id, hub[0], hub[1], 'down'); await DW.wait(0.3); await DW.fade(0, 0.6);
        await say('Nous voici au Lac Dragon. Je repasse aux Champs à 8 h et à 17 h !', n);
      } },
    gabumon: { home: 'champs', async talk(n) {
      const m = st().party[0]; if (!m) return say('Un Digimon, ça se choisit avec le cœur !', n);
      const opts = (DW.EVO[m.sp] || []).map(o => DW.SPECIES[o.to].name);
      await say(opts.length ? `${m.name} pourrait devenir : ${opts.join(', ')}. Regarde la table des Digivolutions pour les conditions !` : `${m.name} est déjà au sommet de son évolution !`, n);
    } },
    agumon: { home: 'champs', async talk(n, ow) { await spar('agumon', n, ow); } },
    ogremon: { home: 'champs', async talk(n, ow) { await spar('ogremon', n, ow); } },
  };
  async function gift(n, list, line) {
    const id = DW.pick(list), extra = DW.giveItem(id, 1);
    DW.Audio.sfx('buy'); await say(`${line} (${DW.ITEMS[id].name})${DW.extraMsg(extra)}`, n);
  }
  async function spar(sp, n, ow) {
    const m = st().party[0]; if (!m || m.hp <= 0) return say('Reviens avec un Digimon en forme !', n);
    if ((st().daily || {})['spar_' + sp] === day()) return say("On s'est assez battus pour aujourd'hui !", n);
    if ((await DW.ask('Un petit combat d\'entraînement ? (aucune perte en cas de défaite)', ['Oui', 'Non'], n)) !== 0) return;
    daily('spar_' + sp);
    await ow.battle({ enemy: new DW.Digimon(sp, Math.max(3, m.level)), boss: true, canLose: true, intro: `${n} veut s'entraîner avec toi !` });
    st().party.forEach(p => p.heal());
  }
  async function rumor(n) {
    const left = RID.filter(r => !(st().gears || {})[r]);
    if (!left.length) return say(st().flags.devimon ? 'L\'île est en paix ! Pas de rumeur aujourd\'hui... si ce n\'est que tu es un héros !' : "Tous les Engrenages sont brisés ! Devimon t'attend au sommet de la Montagne de l'Infini !", n);
    const r = DW.pick(left), m = DW.MAPS[DW.REGION_ENTRY[r]];
    await say(`On dit que du côté de « ${m.regionName} », ${REG[r].lore}...`, n);
    await say(`Engrenages Noirs détruits : ${Story.gears()} / ${RID.length}.`, n);
  }
  async function talkRecruit(sp, ow) {
    const n = DW.SPECIES[sp].name, T = TOWN[sp];
    if (T && T.talk) return T.talk(n, ow);
    const R = DW.Town.info(sp);
    await say(`Merci de m'avoir accueilli en ville ! ${R.role.replace(new RegExp('^' + n + ' '), 'Je ')}`, n);
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
    constructor() { super(); this.i = 0; this.tab = 0; }
    update() {
      if (DW.Input.hit('left') || DW.Input.hit('right')) { this.tab ^= 1; DW.Audio.sfx('move'); }
      if (this.tab === 1) { if (DW.Input.hit('back') || DW.Input.hit('ok') || DW.Input.hit('menu')) { DW.Audio.sfx('back'); this.close(); } return; }
      if (DW.Input.hit('up')) { this.i = (this.i + RID.length - 1) % RID.length; DW.Audio.sfx('move'); }
      if (DW.Input.hit('down')) { this.i = (this.i + 1) % RID.length; DW.Audio.sfx('move'); }
      if (DW.Input.hit('back') || DW.Input.hit('ok') || DW.Input.hit('menu')) { DW.Audio.sfx('back'); this.close(); }
    }
    draw(c) {
      const UI = DW.UI, s = st(), g = s.gears || {}, W = DW.W;
      if (this.tab === 1) return this.drawRequests(c);
      UI.menuBg(c, this.t, 'JOURNAL');
      UI.text(c, `Engrenages Noirs : ${Story.gears()} / ${RID.length}`, W - 12, 17, { size: 8, align: 'right', color: '#ffe070' });
      UI.text(c, 'REQUÊTES ▶', W - 12, 27, { size: 6, align: 'right', color: '#9ab0e8' });
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
    UI.text(c, '◀ ENGRENAGES', W - 12, 17, { size: 7, align: 'right', color: '#9ab0e8' });
    if (!L.length) UI.wrap(c, "Aucune requête en cours. Les habitants qui ont besoin d'aide ont un « ! » au-dessus de la tête : va leur parler en ville !", 280, 9).forEach((l, j) => UI.text(c, l, 18, 50 + j * 14, { size: 9, color: '#c8f0ff' }));
    L.slice(0, 9).forEach(([sp, q], j) => {
      const y = 40 + j * 20, ok = DW.Requests.ready(sp, q);
      UI.text(c, DW.SPECIES[sp].name, 16, y, { size: 8, color: '#ffe070' });
      const what = q.k === 'item' ? `${q.n} × ${DW.ITEMS[q.a].name} (${Math.min(q.n, DW.state.bag[q.a] || 0)}/${q.n})` : q.k === 'defeat' ? `Vaincre ${q.n} sauvage(s)${q.a ? ' ' + q.a : ''} (${q.prog}/${q.n})` : `Partenaire : ${q.n} en ${{ hp: 'PV', atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intelligence' }[q.a]}`;
      UI.text(c, what, 96, y, { size: 7, color: ok ? '#7aff8a' : '#c8f0ff' });
      if (ok) UI.text(c, 'Prêt !', W - 14, y, { size: 7, align: 'right', color: '#7aff8a' });
    });
  };
  Story.JournalScene = JournalScene;
})();
