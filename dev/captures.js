'use strict';
// =====================================================================
//  GALERIE DE CAPTURES — toutes les images du jeu dans captures/index.html
//  Lancer : python dev/serve.py 8766, ouvrir index.html, puis dans la console :
//    const s = document.createElement('script'); s.src = 'dev/shots.js'; document.head.appendChild(s);
//    (puis) const t = document.createElement('script'); t.src = 'dev/captures.js'; document.head.appendChild(t);
//    await CAPTURES.run();
//  Les images sont enregistrées par le serveur de dev (POST /dev/save).
// =====================================================================
(function () {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const sections = [];
  let cur = null;
  const section = (title, note) => { cur = { title, note, items: [] }; sections.push(cur); };
  const errors = [];

  async function save(name, cv, caption, big) {
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    const res = await fetch('/dev/save?name=' + name + '.png', { method: 'POST', body: blob });
    if (!res.ok) throw new Error('enregistrement refusé : ' + name);
    cur.items.push({ file: name + '.png', caption, w: cv.width, h: cv.height, big });
  }
  const copyScreen = () => { const c = document.createElement('canvas'); c.width = DW.canvas.width; c.height = DW.canvas.height; c.getContext('2d').drawImage(DW.canvas, 0, 0); return c; };
  const safe = async (label, fn) => { try { await fn(); } catch (e) { errors.push(label + ' : ' + e.message); console.error(label, e); } };
  const key = code => { window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code })), 60); };

  // planche : liste [{img|canvas, w, h, label}] à l'échelle sc, sur fond uni
  function plate(list, sc, bg = '#4a8a4a', width = 960) {
    const pad = 10, lab = 14;
    let x = pad, y = pad, rowH = 0;
    const pos = list.map(it => {
      const w = it.w * sc, h = it.h * sc;
      if (x + w > width - pad) { x = pad; y += rowH + lab + pad; rowH = 0; }
      const p = { x, y, w, h }; x += Math.max(w, 70) + pad; rowH = Math.max(rowH, h); return p;
    });
    const H = y + rowH + lab + pad;
    const cv = document.createElement('canvas'); cv.width = width; cv.height = H;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = bg; g.fillRect(0, 0, width, H);
    g.font = '11px monospace'; g.fillStyle = '#ffffff';
    list.forEach((it, i) => { const p = pos[i]; g.drawImage(it.img, p.x, p.y, p.w, p.h); g.fillText(it.label, p.x, p.y + p.h + 11); });
    return cv;
  }

  function prepareState() {
    const st = DW.state = DW.newState();
    st.name = 'Tai'; st.clock = 11 * 60; st.bits = 1280; st.flags.starter = 'koromon'; st.flags.tanemon = true;
    DW.Town.RECRUITS.forEach(r => (st.recruits[r.id] = true));
    DW.DEX_ORDER.forEach((sp, i) => { st.seen[sp] = true; if (i % 3 !== 2) st.owned[sp] = true; });
    const a = new DW.Digimon('agumon', 22); a.tr = { hp: 12, atk: 28, def: 10, spd: 8, int: 6 }; a.wins = 14; a.hunger = 35; a.need = 20;
    st.party = [a, new DW.Digimon('palmon', 18), new DW.Digimon('gabumon', 17), new DW.Digimon('gomamon', 15)];
    st.box = [new DW.Digimon('kunemon', 9), new DW.Digimon('biyomon', 12), new DW.Digimon('betamon', 10)];
    st.bag = { viande: 7, super_viande: 2, remede: 3, reveil: 1, medoc: 2, bandage: 1, disque_pm: 2, cartes: 1 };
    st.bank = { viande: 12, pomme: 4 };
    st.cards = {}; DW.DEX_ORDER.forEach((sp, i) => { if (i % 4 !== 3) st.cards[sp] = 1 + (i % 3 === 0 ? 1 : 0); });
    st.gears = { dino: true, jungle: true, gel: true };   // les boss des autres régions restent visibles
  }
  // vue en jeu (écran 320×240 agrandi ×3) à une position donnée, sans le bandeau de zone
  async function inGame(id, x, y, hour = 11) {
    DW.state.clock = Math.floor(DW.state.clock / 1440) * 1440 + hour * 60;
    DW.state.weather = { type: 'clear', until: DW.state.clock + 600 };
    await DEV.ensure(id, x, y);
    DW.ow.banner.t = 99; DW.ow.wildGrace = 99;
    await wait(700);
    return copyScreen();
  }
  // planche de plusieurs cartes réduites (2 colonnes)
  async function mapsPlate(ids, labels) {
    const cvs = [];
    for (const id of ids) { await DEV.map(id, null, null, 11); cvs.push(DEV.last); }
    DEV.hide();
    const cw = 476, ch = 330, big = document.createElement('canvas');
    big.width = 960; big.height = Math.ceil(ids.length / 2) * (ch + 22) + 6;
    const g = big.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#0c121c'; g.fillRect(0, 0, big.width, big.height);
    cvs.forEach((cv, i) => {
      const k = Math.min(cw / cv.width, ch / cv.height), x = 4 + (i % 2) * 480, y = 4 + Math.floor(i / 2) * (ch + 22);
      g.drawImage(cv, x + (cw - cv.width * k) / 2, y, cv.width * k, cv.height * k);
      g.fillStyle = '#ffe070'; g.font = '13px sans-serif'; g.fillText(labels[i], x + 4, y + ch + 16);
    });
    return big;
  }

  async function run() {
    const t0 = performance.now();
    window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
    prepareState();

    // ------------------------------------------------------------ écran titre
    section("Carte de l'île", 'Toutes les cartes du jeu assemblées selon leurs passages, intérieurs reliés à leur porte, zones à venir dans le brouillard.');
    await safe('carte île', async () => {
      if (!window.ISLAND) await new Promise(r => { const sc = document.createElement('script'); sc.src = 'dev/islandmap.js'; sc.onload = r; document.head.appendChild(sc); });
      await ISLAND.build({ save: false });
      await save('carte_ile', ISLAND.last, "L'Île des Fichiers : état d'avancement", true);
      prepareState();
    });

    section('Écran titre et introduction');
    await safe('titre', async () => {
      const ts = new DW.TitleScene(); DW.Game.replaceAll(ts); await wait(900);
      await save('titre_demarrage', copyScreen(), "Démarrage : le Digivice s'initialise");
      ts.toTitle(); await wait(1800); await save('titre_panorama', copyScreen(), "Panorama : l'Île des Fichiers au crépuscule");
      ts.phase = 'menu'; DW.tween(ts.menuIn, { v: 1 }, 0.3); await wait(700); await save('titre_menu', copyScreen(), "Menu de l'écran titre");
    });
    await safe('intro', async () => {
      const cs = new DW.CharScene(); DW.Game.replaceAll(cs); cs.i = 3; await wait(900);
      await save('intro_choix', copyScreen(), 'Choix du DigiSélectionné (7 héros)');
      const hs = DW.HERO_ORDER.map(id => ({ img: DW.Sprites.hero('down', 0, id).img, w: 24, h: 30, label: DW.HEROES[id].name }))
        .concat(DW.HERO_ORDER.map(id => ({ img: DW.Sprites.hero('right', 1, id).img, w: 24, h: 30, label: '' })))
        .concat(DW.HERO_ORDER.map(id => ({ img: DW.Sprites.hero('up', 0, id).img, w: 24, h: 30, label: '' })));
      await save('heros_choix', plate(hs, 4, '#3a6a4a'), 'Les 7 héros : face, profil, dos');
      const it = new DW.IntroScene(); it.run = () => {}; DW.Game.replaceAll(it); it.bars.v = 1;
      it.snowOn = true; it.aurora.v = 1; it.dv.on = true; it.dv.landed = true; it.dv.y = 194; it.dv.glow = 1; await wait(900);
      await save('intro_camp', copyScreen(), "Le camp d'été : neige, aurore et Digivice");
      it.beam.v = 1; it.lift.v = 0.8; await wait(300); await save('intro_rayon', copyScreen(), 'Le rayon de lumière soulève le héros');
      it.mode = 'tunnel'; await wait(900); await save('intro_tunnel', copyScreen(), 'Le tunnel numérique');
      it.mode = 'sky'; it.zoom.v = 0.3; await wait(500); await save('intro_chute1', copyScreen(), "Chute vers l'Île des Fichiers");
      it.zoom.v = 0.95; await wait(400); await save('intro_chute2', copyScreen(), "... jusqu'à la plage");
    });
    prepareState();

    // ------------------------------------------------------------ cartes (vue d'ensemble)
    section('Cartes du jeu', 'Vue d\'ensemble de chaque carte, de jour (taille réelle des pixels, agrandir pour voir les détails).');
    const maps = [['village', 'Ville des Fichiers (ville complète)'], ['champs', 'Quartier des Champs'], ['gym', "Terrain d'entraînement"], ['plage', 'Plage des Cabines'],
      ['clairiere', "Clairière de l'Arrivée"], ['sentier', 'Sentier des Murmures'], ['prairie', 'Prairie des Lucioles'], ['geants', 'Bois des Géants'], ['lisiere', 'Lisière du Ravin'],
      ['maison', 'Maison de Jijimon'], ['bazar_in', 'Bazar de Gotsumon'], ['dojo_in', "Dojo d'Elecmon"], ['resto_in', 'Restaurant'], ['serre_in', 'Serre / DigiFerme'],
      ['berceau', 'Village des Bébés (Elecmon, un DigiŒuf par jour)'], ['usine_in', "Intérieur de l'Usine"], ['manoir', 'Manoir']].filter(([id]) => DW.MAPS[id]);
    for (const [id, cap] of maps) await safe('carte ' + id, async () => { await DEV.map(id, null, null, 11); await save('carte_' + id, DEV.last, cap, true); });

    section('La ville selon son niveau', 'La ville se reconstruit avec les habitants ; les futurs bâtiments restent cachés.');
    for (const lv of [0, 3]) await safe('ville ' + lv, async () => {
      DW.state.recruits = {}; DW.Town.RECRUITS.slice(0, lv).forEach(r => (DW.state.recruits[r.id] = true));
      await DEV.map('village', 20, 7, 11); await save('ville_niveau' + lv, DEV.last, `Ville au niveau ${lv} : « ${DW.Town.levelName()} »`, true);
    });
    await safe('champs 0', async () => { DW.state.recruits = {}; await DEV.map('champs', 5, 3, 11); await save('champs_debut', DEV.last, 'Quartier des Champs au début (DigiChamp de Tanemon)', true); });
    DW.Town.RECRUITS.forEach(r => (DW.state.recruits[r.id] = true));

    section('Ambiances', 'Nuit, crépuscule sous la pluie, intérieur.');
    await safe('nuit', async () => { await DEV.ensure('village', 14, 13); DW.state.clock = 22 * 60; DW.ow.banner.t = 99; await wait(800); await save('ambiance_nuit_ville', copyScreen(), 'La ville la nuit : fenêtres et lanternes allumées'); });
    await safe('pluie', async () => { DW.state.clock = 19 * 60; DW.state.weather = { type: 'rain', until: DW.state.clock + 300 }; await DEV.ensure('village', 17, 15); DW.ow.wet = 1; DW.ow.banner.t = 99; await wait(900); await save('ambiance_pluie', copyScreen(), 'Crépuscule sous la pluie : flaques et reflets'); });
    DW.state.weather = { type: 'clear', until: 99999 }; DW.state.clock = 11 * 60;
    for (const [id, x, y, cap] of [['lisiere', 18, 20, 'Lisière du Ravin (automne)'], ['sentier', 20, 20, 'Sentier des Murmures (brume)'], ['plage', 8, 12, 'Plage'], ['maison', 12, 5, 'Maison de Jijimon']])
      await safe('ambiance ' + id, async () => { await DEV.ensure(id, x, y); DW.ow.banner.t = 99; await wait(800); await save('ambiance_' + id, copyScreen(), cap); });

    // ------------------------------------------------------------ régions (16 × 10 sous-zones)
    const RIDS = Object.keys(DW.REGION_ENTRY || {});
    section('Régions : vues en jeu', "Chaque région vue comme en jouant : l'entrée (sous-zone 1) et le repaire du boss possédé par un Engrenage Noir (sous-zone 8).");
    for (const rid of RIDS) await safe('région ' + rid, async () => {
      for (const k of [0, 7]) {
        const id = rid + k, M = DW.getMap(id); if (!M) continue;
        const [hx, hy] = (M.spec && M.spec.hub) || [Math.floor(M.w / 2), Math.floor(M.h / 2)];
        await save('jeu_' + id, await inGame(id, hx, hy), `${M.regionName} — ${M.name}${k === 7 ? ' (boss)' : ''}`);
      }
    });
    section('Régions : les 10 sous-zones', 'Vue d\'ensemble de toutes les sous-zones de chaque région, réduites sur une planche.');
    for (const rid of RIDS) await safe('planche ' + rid, async () => {
      const ids = [...Array(10).keys()].map(k => rid + k).filter(id => DW.MAPS[id]);
      await save('region_' + rid, await mapsPlate(ids, ids.map(id => `${+id.slice(rid.length) + 1}. ${DW.getMap(id).name}`)), DW.getMap(ids[0]).regionName, true);
    });
    section('Ambiances des régions', 'Les mêmes lieux de nuit.');
    for (const rid of ['montagne', 'marais', 'volcan', 'gel', 'overdell', 'jouets'].filter(r => RIDS.includes(r))) await safe('nuit ' + rid, async () => {
      const id = rid + 3, M = DW.getMap(id), [hx, hy] = (M.spec && M.spec.hub) || [Math.floor(M.w / 2), Math.floor(M.h / 2)];
      await save('nuit_' + id, await inGame(id, hx, hy, 23), `${M.regionName} la nuit`);
    });
    DW.state.clock = Math.floor(DW.state.clock / 1440) * 1440 + 11 * 60;

    // ------------------------------------------------------------ combats
    section('Combats');
    await safe('fonds régions', async () => {
      const keys = [...new Set(RIDS.map(r => { const M = DW.getMap(r + '0'); return M.bg === 'foret' && M.theme ? 'foret@' + M.theme : M.bg; }))];
      await save('combat_fonds_regions', plate(keys.map(k => { const c = document.createElement('canvas'); c.width = 320; c.height = 240; const g = c.getContext('2d'); g.drawImage(DW.World.battleBg(k), 0, 0); DW.World.platform(g, k, 236, 114, 56, 12); DW.World.platform(g, k, 84, 173, 64, 14); return { img: c, w: 320, h: 240, label: k.replace('foret@', '') }; }), 1, '#101820'), 'Fonds de combat des régions');
    });
    await safe('combat boss', async () => {
      await DEV.ensure('volcan7', 10, 10);
      const b = new DW.BattleScene({ bg: DW.ow.battleKey(), boss: true, enemy: new DW.Digimon('meramon', 25) }); DW.Game.push(b);
      for (let i = 0; i < 20 && b.mode !== 'cmd'; i++) { key('Space'); await wait(300); }
      await save('combat_boss', copyScreen(), 'Combat de boss (Volcan)');
      DW.Game.replaceAll(DW.ow);
    });
    await safe('fonds', async () => {
      const keys = [['foret@spring', 'Clairière'], ['foret@misty', 'Sentier'], ['foret@meadow', 'Prairie'], ['foret@deep', 'Bois des Géants'], ['foret@autumn', 'Lisière'], ['plage', 'Plage'], ['foret@town', 'Entraînement']];
      await save('combat_fonds', plate(keys.map(([k, l]) => { const c = document.createElement('canvas'); c.width = 320; c.height = 240; const g = c.getContext('2d'); g.drawImage(DW.World.battleBg(k), 0, 0); DW.World.platform(g, k, 236, 114, 56, 12); DW.World.platform(g, k, 84, 173, 64, 14); return { img: c, w: 320, h: 240, label: l }; }), 1, '#101820'), 'Fonds de combat de chaque zone');
    });
    await safe('combat', async () => {
      await DEV.ensure('prairie', 20, 14);
      const b = new DW.BattleScene({ bg: 'foret@meadow', enemy: new DW.Digimon('biyomon', 19) }); DW.Game.push(b);
      for (let i = 0; i < 20 && b.mode !== 'cmd'; i++) { key('Space'); await wait(300); }
      await save('combat_commandes', copyScreen(), 'Combat : choix de l\'action');
      b.energy.p = 100; b.energy.e = 60; key('Space'); await wait(500);
      await save('combat_techniques', copyScreen(), 'Combat : 6 techniques et coup spécial disponible');
      b.mode = 'none'; b.banner = { text: 'Méga Flamme', who: 'Agumon', side: 'p', t: 1 }; b.flash = 0; await wait(200);
      await save('combat_special', copyScreen(), 'Coup spécial');
      DW.Game.replaceAll(DW.ow);
    });

    // ------------------------------------------------------------ écrans d'interface
    section('Écrans du jeu');
    await DEV.ensure('village', 20, 12);
    const scenes = [
      ['menu', 'Menu principal', () => new DW.MenuScene()],
      ['equipe', 'Équipe', () => new DW.PartyScene({ mode: 'view' })],
      ['fiche_statut', 'Fiche Digimon : statut', () => new DW.SummaryScene(0)],
      ['fiche_techniques', 'Fiche Digimon : techniques', () => { const s = new DW.SummaryScene(0); s.tab = 1; return s; }],
      ['digivolution', 'Table des Digivolutions', () => new DW.EvoTableScene(0)],
      ['sac', 'Sac', () => new DW.BagScene({})],
      ['banque', 'Banque', () => new DW.BankScene()],
      ['boutique', 'Boutique du Bazar', () => new DW.ShopScene(['viande', 'super_viande', 'remede', 'medoc', 'reveil'])],
      ['digidex', 'DigiDex', () => new DW.DexScene()],
      ['carte_ile', "Carte de l'île", () => new DW.WorldMapScene()],
      ['digiferme', 'DigiFerme', () => new DW.FarmScene()],
      ['options', 'Options', () => new DW.OptionsScene()],
      ['fiche_digimon', 'Fiche de présentation (choix du partenaire)', () => new DW.InfoCard('tanemon')],
      ['oublier', 'Oublier une technique : avantages et inconvénients', () => { const m = DW.state.party[0]; m.moves = m.moves.slice(0, 6); while (m.moves.length < 6) m.moves.push({ id: ['charge', 'griffe', 'morsure', 'coup_queue', 'souffle_ardent', 'flamme_bebe'][m.moves.length] }); const s = new DW.ForgetScene(m, 'mega_flamme'); s.i = 1; return s; }],
      ['entrainement', "Séance d'entraînement (mini-jeu)", () => new DW.TrainingScene(DW.state.party[0], 'atk')],
      ['journal', 'Journal : les Engrenages Noirs', () => new DW.Story.JournalScene()],
      ['album', 'Album des cartes Digimon', () => new DW.AlbumScene()],
      ['paquet', "Ouverture d'un paquet de cartes", () => { const s = new DW.Activities.scenes.PackScene(['greymon', 'patamon', 'devimon']); s.flip.v = 3; return s; }],
      ['oeufs', 'Village des Bébés : choix du DigiŒuf', () => new DW.EggScene()],
      ['curling', 'Curling de la Terre Gelée', () => { const s = new DW.Activities.scenes.CurlingScene(); s.throws = [{ x: 156, y: 50, pts: 10 }, { x: 175, y: 60, pts: 3 }]; s.score = 13; s.pw = 0.6; return s; }],
      ['tresor', 'Chasse au trésor (Tunnel Foreur)', () => { const s = new DW.Activities.scenes.DigScene(); s.dug = { 3: true, 9: true }; s.left = 4; s.msg = 'Chaud...'; return s; }],
      ['peche', 'Pêche au ponton', () => { const s = new DW.Activities.scenes.FishScene(); s.bite = 0.5; s.wait = 0; return s; }],
    ];
    for (const [name, cap, make] of scenes) await safe('écran ' + name, async () => {
      const s = make(); DW.Game.push(s); await wait(700);
      await save('ecran_' + name, copyScreen(), cap);
      DW.Game.replaceAll(DW.ow);
    });
    await safe('dialogue', async () => { DW.ow.locked = false; DW.say('Bo... bonjour ! Trois petits Digimon t\'attendent ici, sur la place. Parle-leur pour choisir ton partenaire !', 'Botamon'); await wait(2500); await save('ecran_dialogue', copyScreen(), 'Dialogue'); DW.Game.replaceAll(DW.ow); });

    // ------------------------------------------------------------ Digimon
    section('Digimon', 'Sprites de combat (respiration image 1), puis sprites d\'exploration.');
    await safe('digimon', async () => {
      const all = DW.DEX_ORDER.concat(['jijimon', 'botamon']);
      await save('digimon_combat', plate(all.map(sp => { const s = DW.Sprites.battle(sp); return { img: s.img, w: s.w, h: s.h, label: DW.SPECIES[sp].name }; }), 1.5, '#5a9a5a'), 'Les Digimon en combat');
      await save('digimon_poses', plate(all.slice(0, 26).flatMap(sp => ['attack', 'hurt'].map(p => { const s = DW.Sprites.pose(sp, p); return { img: s.img, w: s.w, h: s.h, label: DW.SPECIES[sp].name + (p === 'attack' ? ' (attaque)' : ' (touché)') }; })), 1, '#4a6a8a'), 'Poses de combat : attaque et coup reçu');
      await save('digimon_exploration', plate(all.map(sp => { const s = DW.Sprites.ow(sp); return { img: s.img, w: s.w, h: s.h, label: DW.SPECIES[sp].name }; }), 3, '#5a9a5a'), 'Les Digimon en exploration');
    });
    await safe('héros', async () => {
      const L = [];
      for (const dir of ['down', 'up', 'left', 'right']) for (let f = 0; f < 4; f++) { const s = DW.Sprites.hero(dir, f); L.push({ img: s.img, w: s.w, h: s.h, label: dir + ' ' + f }); }
      await save('heros', plate(L, 4, '#5a9a5a'), 'Le héros (4 directions × 4 images de marche)');
    });

    // ------------------------------------------------------------ objets du décor
    section('Objets du décor', 'Tous les objets dessinés par le jeu (toutes variantes), à l\'échelle ×2.');
    await safe('objets', async () => {
      const OBJ = DW.World.OBJ, L = [];
      for (const k of Object.keys(OBJ)) {
        const o = OBJ[k], n = typeof o.w === 'function' ? 1 : (o.n || 1);
        for (let v = 0; v < n; v++) {
          const vv = typeof o.w === 'function' ? 3 : v;
          const s = o.frames ? DW.World.objFrame(k, vv, 0) : DW.World.obj(k, vv);
          L.push({ img: s.img, w: s.w, h: s.h, label: k + (n > 1 ? ' ' + v : '') });
        }
      }
      // pages de ~40 objets
      for (let p = 0; p * 40 < L.length; p++) await save('objets_' + (p + 1), plate(L.slice(p * 40, p * 40 + 40), 2, '#3e6e46'), `Objets (page ${p + 1})`);
    });
    await safe('herbes', async () => {
      const L = [];
      for (const k of ['grass', 'dune', 'pastel', 'grass@spring', 'grass@misty', 'grass@meadow', 'grass@deep', 'grass@autumn', 'grass@town', 'grass@farm']) for (let v = 0; v < 2; v++) { const c = DW.World.tall(k, v, 1); L.push({ img: c, w: c.width, h: c.height, label: k.replace('grass@', '') + ' ' + v }); }
      await save('herbes_hautes', plate(L, 4, '#3e6e46'), 'Herbes hautes de chaque zone');
    });
    await safe('icônes', async () => {
      const L = DW.ITEM_ORDER.map(id => { const c = DW.Icons.item(id); return { img: c, w: c.width, h: c.height, label: DW.ITEMS[id].name }; });
      for (const n of ['digimon', 'evo', 'sac', 'dex', 'carte', 'sauver', 'options', 'titre', 'retour', 'son']) { try { const c = DW.Icons.menu(n); if (c) L.push({ img: c, w: c.width, h: c.height, label: n }); } catch (e) { /* icône absente */ } }
      await save('icones', plate(L, 5, '#1e2a4a'), 'Icônes des objets et du menu');
    });

    // ------------------------------------------------------------ page de la galerie
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Galerie du jeu</title><style>
body{margin:0;background:#0e1420;color:#e8f0ff;font-family:system-ui,sans-serif}
header{padding:24px 16px;background:#16233a;border-bottom:2px solid #2e4a7a}h1{margin:0;font-size:24px}header p{margin:6px 0 0;color:#9ab0d0}
nav{padding:10px 16px;display:flex;flex-wrap:wrap;gap:8px;position:sticky;top:0;background:#0e1420ee;border-bottom:1px solid #22324e;z-index:2}
nav a{color:#ffd870;text-decoration:none;font-size:14px;padding:4px 8px;border:1px solid #33486e;border-radius:6px}
section{padding:16px}h2{font-size:20px;color:#ffd870;margin:16px 0 4px}section>p{color:#9ab0d0;margin:0 0 12px}
.grid{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0;background:#16233a;border:1px solid #26385a;border-radius:8px;padding:8px;max-width:100%}
figure img{display:block;image-rendering:pixelated;max-width:100%;height:auto}figure.big img{width:960px}
figcaption{font-size:13px;color:#c8d8f0;margin-top:6px}a.full{color:#7ac0ff;font-size:12px}
</style></head><body>
<header><h1>Digimon — L'Île des Fichiers : galerie des images</h1><p>Captures générées automatiquement par le jeu (${new Date().toLocaleString('fr-FR')}). Cliquer sur une image pour l'ouvrir en grand.</p></header>
<nav>${sections.map((s, i) => `<a href="#s${i}">${esc(s.title)}</a>`).join('')}</nav>
${sections.map((s, i) => `<section id="s${i}"><h2>${esc(s.title)}</h2>${s.note ? `<p>${esc(s.note)}</p>` : ''}<div class="grid">${s.items.map(it => `<figure${it.big ? ' class="big"' : ''}><a href="${it.file}" target="_blank"><img src="${it.file}" alt="${esc(it.caption)}" width="${it.big ? Math.min(960, it.w * 1.5) : it.w}"></a><figcaption>${esc(it.caption)}</figcaption></figure>`).join('')}</div></section>`).join('\n')}
${errors.length ? `<section><h2>Captures en erreur</h2><p>${errors.map(esc).join('<br>')}</p></section>` : ''}
</body></html>`;
    await fetch('/dev/save?name=index.html', { method: 'POST', body: new Blob([html], { type: 'text/html' }) });
    const n = sections.reduce((a, s) => a + s.items.length, 0);
    return { images: n, erreurs: errors, secondes: Math.round((performance.now() - t0) / 1000) };
  }
  window.CAPTURES = { run };
})();
