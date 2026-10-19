'use strict';
// =====================================================================
//  SERVICES DES RECRUES EN VILLE
//  Chaque Digimon libéré d'un Engrenage Noir s'installe en ville (game/story.js) et y rend un service :
//  clinique, boutiques, restaurant, cadeaux du jour, combats d'entraînement, rumeurs, vol...
//  - TOWN : où il habite et ce qu'il fait quand on lui parle
//  - DISTRICT_HOME : les recrues qui déménagent dans un quartier périphérique une fois celui-ci construit
//  - KIOSK / placeKiosks : son stand (auvent, pictogramme, enseigne), posé à la construction de la carte
// =====================================================================
(function () {
  const { say } = DW.MapKit;
  const st = () => DW.state;
  const hour = () => DW.Time.hour();
  const day = () => DW.Time.day();
  const open = () => hour() >= 6 && hour() < 22;          // horaires des commerces
  // service une fois par jour
  const daily = k => { const s = st(), d = s.daily = s.daily || {}; if (d[k] === day()) return false; d[k] = day(); return true; };
  const Story = DW.Story;

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
    const placeKiosks = (m, id) => {
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
        const hub = m.spec.hub; await ow.charger(id, hub[0], hub[1], 'down'); await DW.wait(0.3); await DW.fade(0, 0.6);
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
    const left = Object.keys(Story.REG).filter(r => !(st().gears || {})[r]);
    if (!left.length) return say(st().flags.devimon ? 'L\'île est en paix ! Pas de rumeur aujourd\'hui... si ce n\'est que tu es un héros !' : "Tous les Engrenages sont brisés ! Devimon t'attend au sommet de la Montagne de l'Infini !", n);
    const r = DW.pick(left), m = DW.MAPS[DW.REGION_ENTRY[r]];
    await say(`On dit que du côté de « ${m.regionName} », ${Story.REG[r].lore}...`, n);
    await say(`Engrenages Noirs détruits : ${Story.gears()} / ${Object.keys(Story.REG).length}.`, n);
  }
  async function talkRecruit(sp, ow) {
    const n = DW.SPECIES[sp].name, T = TOWN[sp];
    if (T && T.talk) return T.talk(n, ow);
    const R = DW.Town.info(sp);
    await say(`Merci de m'avoir accueilli en ville ! ${R.role.replace(new RegExp('^' + n + ' '), 'Je ')}`, n);
  }


  DW.Services = { TOWN, KIOSK, DISTRICT_HOME, DISTRICT_HOME_IDS, homeOf, talkRecruit, placeKiosks };
})();
