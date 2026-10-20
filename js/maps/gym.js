'use strict';
// =====================================================================
//  TERRAIN D'ENTRAÎNEMENT — juste au sud de la Ville des Fichiers
//  Un centre sportif délimité, une aire de couleur par stat (sol peint : paintGround) :
//    aire rouge de force (ouest) : W rocher (PV), E mannequin (Attaque), traîneau (PV), sac de frappe (Attaque)
//    piste d'athlétisme (centre) : N haies (Vitesse), pneus au nord de la piste (Vitesse), pelouse au milieu
//    tatami bleu de garde (est)  : A mur de pierre (Défense), râtelier à boucliers, mannequin de bois
//    dalle violette (sud-ouest)  : Ψ cristal de données (PM)
//    jardin zen (sud-est) ; l'Intelligence s'apprend à l'école (maps/classe.js), les résistances au Gymnase (maps/gymnase.js)
//  Chaque poste a son panneau à pictogramme juste à sa gauche. Appareils : images du joueur (dossier SPORT : gfx/textures.js).
//  + allées pavées, torches, toilettes (y), panneau
// =====================================================================
(function () {
  const { say, paint, st } = DW.MapKit;
  const TRACK = { x: 16, y: 12.5, rx: 6.2, ry: 3.9 };

  const rows = paint(32, 22, '#', g => {
    g.rect(2, 2, 28, 18, '.');
    for (let x = 2; x < 30; x++) { g.set(x, 2, 'T'); g.set(x, 19, 'T'); }
    for (let y = 2; y < 20; y++) { g.set(2, y, 'T'); g.set(29, y, 'T'); }
    g.set(3, 3, 'T'); g.set(28, 3, 'T'); g.set(3, 18, 'T'); g.set(28, 18, 'T');
    // allée d'entrée (le reste du sol est peint : paintGround plus bas)
    g.rect(15, 0, 2, 3, '=');
    // jardin zen (sud-est) : sable ratissé
    g.rect(23, 14, 6, 4, 's');
    // massifs de fleurs le long des bords seulement (rien sur la piste ni sur les aires)
    g.scatter('f', 4, 3, 8, 1, 4, 41, ['.']); g.scatter('f', 20, 3, 8, 1, 4, 42, ['.']);
    for (const [x, y] of [[4, 4], [27, 4], [4, 17], [13, 18], [19, 18]]) g.set(x, y, 'b');
    for (const x of [6, 25]) g.set(x, 6, 'V');
    g.set(12, 4, 'i'); g.set(19, 4, 'i');
    // antennes de données et tuyau (décor numérique)
    g.set(4, 6, '!'); g.set(27, 6, '!'); g.set(27, 17, '$');
    // postes d'entraînement
    g.set(7, 9, 'W'); g.set(7, 11, 'E');
    g.set(10, 12, 'N'); g.set(22, 12, 'N');
    g.set(27, 9, 'A');
    // (l'Intelligence s'entraîne désormais dans la salle de classe : maps/classe.js)
    g.set(10, 16, 'Ψ');   // cristal de données (PM)
    // toilettes et panneau
    g.set(5, 18, 'y'); g.set(14, 6, 'S');
  });

  // ------------------------------------------------------------ sol du centre sportif, peint au pixel
  // (coordonnées en cases du plan d'origine ; la carte est agrandie ×2 : 1 case = 32 px)
  function paintGround(c) {
    const u = 32, X = v => v * u, H = DW.Art.hash;
    const grain = (x0, y0, w, h, col, n, seed) => { c.fillStyle = col; for (let i = 0; i < n; i++) c.fillRect(Math.floor(x0 + H(i, 1, seed) * w), Math.floor(y0 + H(i, 2, seed) * h), 1, 1); };
    const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    // 1. allées pavées : entrée → promenade nord → chaque aire, et promenade sud
    const walk = pts => {
      for (const [w, col] of [[30, '#8a8070'], [24, '#cfc4aa']]) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), X(y)) : c.moveTo(X(x), X(y)))); c.stroke(); }
    };
    walk([[16, 0], [16, 9]]); walk([[5.5, 6.5], [26.5, 6.5]]); walk([[5.5, 6.5], [5.5, 8.5]]); walk([[26.5, 6.5], [26.5, 7.5]]);
    walk([[23, 5], [23, 6.5]]); walk([[9, 5], [9, 6.5]]);
    walk([[16, 16.5], [16, 17.2]]); walk([[11.5, 17.2], [23, 17.2]]);
    // joints des pavés
    c.fillStyle = 'rgba(120,108,88,0.55)';
    for (let y = 0; y < X(22); y += 8) for (let x = (y / 8 % 2) * 5; x < X(32); x += 10) c.fillRect(x, y, 1, 1);
    // 2. aire de FORCE (ouest) : sol en caoutchouc rouge brique, liseré blanc
    const pad = (x, y, w, h, a, b, seed) => {
      rr(X(x) - 3, X(y) - 3, X(w) + 6, X(h) + 6, 10); c.fillStyle = '#f4eee0'; c.fill();
      rr(X(x), X(y), X(w), X(h), 8); c.fillStyle = a; c.fill();
      grain(X(x), X(y), X(w), X(h), b, X(w) * X(h) / 14, seed);
    };
    pad(3.3, 8, 5, 8.3, '#b85a36', '#a04c2c', 501);
    // 3. aire de GARDE (est) : tatami bleu
    pad(24.4, 7.4, 4.3, 5, '#3a64b8', '#2e529a', 502);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1;
    for (let y = X(7.4) + 16; y < X(12.4); y += 16) { c.beginPath(); c.moveTo(X(24.4) + 2, y); c.lineTo(X(28.7) - 2, y); c.stroke(); }
    // 4. plateforme du CRISTAL (sud-ouest) : dalle violette et cercle d'énergie
    const cx0 = X(10.5), cy0 = X(15.9);
    c.fillStyle = '#f4eee0'; c.beginPath(); c.ellipse(cx0, cy0, 46, 30, 0, 0, 7); c.fill();
    c.fillStyle = '#6a46b0'; c.beginPath(); c.ellipse(cx0, cy0, 42, 27, 0, 0, 7); c.fill();
    c.strokeStyle = '#b89aff'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx0, cy0, 32, 20, 0, 0, 7); c.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.moveTo(cx0 + Math.cos(a) * 32, cy0 + Math.sin(a) * 20); c.lineTo(cx0 + Math.cos(a) * 40, cy0 + Math.sin(a) * 25); c.stroke(); }
    // 5. jardin zen : margelle de pierre autour du sable
    c.strokeStyle = '#8a8478'; c.lineWidth = 4; c.strokeRect(X(23) - 2, X(14) - 2, X(6) + 4, X(4) + 4);
    // 6. PISTE D'ATHLÉTISME : anneau en tartan, couloirs blancs, pelouse rayée au centre
    const tx = X(TRACK.x), ty = X(TRACK.y), RX = X(TRACK.rx), RY = X(TRACK.ry), IN = 0.62;
    const ell = (k, fill) => { c.beginPath(); c.ellipse(tx, ty, RX * k, RY * k, 0, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } };
    ell(1.04, '#f4eee0'); ell(1, '#c4502e');
    c.save(); ell(1); c.clip(); grain(tx - RX, ty - RY, RX * 2, RY * 2, '#a8402a', RX * RY / 3, 503); grain(tx - RX, ty - RY, RX * 2, RY * 2, '#d8683e', RX * RY / 5, 504); c.restore();
    // pelouse : bandes tondues
    c.save(); ell(IN); c.clip();
    for (let x = tx - RX; x < tx + RX; x += 16) { c.fillStyle = Math.floor((x - tx + RX) / 16) % 2 ? '#5aa444' : '#4c963a'; c.fillRect(x, ty - RY, 16, RY * 2); }
    c.strokeStyle = '#f4f4ec'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(tx, ty - RY * IN); c.lineTo(tx, ty + RY * IN); c.stroke();
    c.beginPath(); c.ellipse(tx, ty, 26, 18, 0, 0, 7); c.stroke();
    c.fillStyle = '#f4f4ec'; c.fillRect(tx - 2, ty - 2, 4, 4);
    c.restore();
    // lignes des couloirs
    c.strokeStyle = '#f4f4ec';
    for (const k of [IN, 0.715, 0.81, 0.905, 1]) { c.lineWidth = k === IN || k === 1 ? 2 : 1.4; ell(k); c.stroke(); }
    // ligne d'arrivée en damier (bas de l'anneau)
    for (let y = ty + RY * IN; y < ty + RY - 1; y += 4) for (let i = 0; i < 3; i++) { c.fillStyle = (Math.floor((y - ty) / 4) + i) % 2 ? '#1a1a1a' : '#ffffff'; c.fillRect(tx + 18 + i * 4, y, 4, 4); }
    // numéros de couloir peints (petits traits)
    c.fillStyle = '#ffffff';
    [0.667, 0.76, 0.857, 0.952].forEach((k, n) => { for (let j = 0; j <= n; j++) c.fillRect(tx - 14 + j * 4, ty + RY * k - 2, 2, 4); });
  }


  // ------------------------------------------------------------ Tai au Terrain d'entraînement
  const today = () => DW.Time.day();
  DW.TaiBuddy = {
    here: s => s.hero !== 'tai' && !!(s.kids || {}).tai && today() % 2 === 0 && DW.Time.hour() >= 9 && DW.Time.hour() < 18,
    async talk() {
      const s = st(), m = s.party.find(d => d.hp > 0), f = s.flags;
      const r = await DW.ask("Salut ! On s'entraîne ensemble, ou tu veux un petit match amical contre Greymon ?", ["S'entraîner à deux", 'Match amical', 'Plus tard'], 'Tai');
      if (r === 0) {
        if (f.taiTrain === today()) { await say("On a déjà bossé aujourd'hui ! Repose-toi un peu, on remet ça demain.", 'Tai'); return; }
        if (!m) { await say("Ton partenaire n'est pas en état... Soigne-le d'abord !", 'Tai'); return; }
        f.taiTrain = today(); m.boost = (m.boost || 0) + 1; m.addHappy(3); DW.Audio.sfx('super');
        await say(`Agumon et ${m.name} s'entraînent côte à côte. Rien de tel qu'un partenaire pour se motiver ! (prochaine séance +1 point, bonheur +3)`, 'Tai');
        return;
      }
      if (r !== 1) { await say("D'accord ! Je suis là un jour sur deux, en journée.", 'Tai'); return; }
      if (f.taiMatch === today()) { await say("Greymon est fatigué pour aujourd'hui. Demain, revanche !", 'Tai'); return; }
      if (!m) { await say("Ton partenaire n'est pas en état... Soigne-le d'abord !", 'Tai'); return; }
      f.taiMatch = today();
      // match amical : Greymon à ton niveau, sans K.O. qui compte, tout le monde est soigné après
      const res = await DW.ow.battle({ enemy: new DW.Digimon('greymon', Math.max(15, m.level)), boss: true, canLose: true, intro: 'Match amical contre le Greymon de Tai !' });
      s.party.forEach(d => d.heal());
      await say(res === 'win' ? "Waouh ! Tu nous as battus à la régulière ! Greymon va vouloir sa revanche..." : "Pas mal du tout ! Continue à t'entraîner, et tu nous battras.", 'Tai');
    },
  };

  DW.MAPS.gym = {
    name: "Terrain d'entraînement", music: 'village', bg: 'foret', ambient: 'town', theme: 'town', climate: 'village', region: 'village',
    rows,
    // Tai (une fois délivré) vient s'entraîner ici un jour sur deux, en journée : entraînement à deux, ou match amical
    npcs: [
      { hero: 'tai', x: 16, y: 10, face: 'down', cond: s => DW.TaiBuddy && DW.TaiBuddy.here(s), talk: () => DW.TaiBuddy.talk() },
      { sp: 'agumon', x: 17, y: 11, face: 'left', wander: 1, cond: s => DW.TaiBuddy && DW.TaiBuddy.here(s), talk: () => say("On s'entraîne ensemble ? Je suis en pleine forme !", 'Agumon') },
    ],
    paintGround,
    objects: [
      // marquages au sol (on marche dessus)
      { kind: 'zenrakes', x: 23, y: 14, w: 6, h: 4, walk: true },
      // gradins, torches, râtelier à boucliers, rochers, bancs
      { kind: 'gymnase', x: 7, y: 3, w: 4, h: 2 }, { kind: 'ecole', x: 21, y: 3, w: 4, h: 2 },   // gymnase (résistances, après le chapitre 1) ; école : la salle de classe (Intelligence)
      { kind: 'torch', x: 13, y: 7, w: 1, h: 1, small: true }, { kind: 'torch', x: 18, y: 7, w: 1, h: 1, small: true },
      // appareils-postes (DW.Training.POSTES) et décor du tatami
      { kind: 'traineau', x: 7, y: 13, w: 1, h: 1, small: true }, { kind: 'punchbag', x: 7, y: 15, w: 1, h: 1, small: true },
      { kind: 'pneus', x: 20, y: 8, w: 1, h: 1, small: true },
      { kind: 'shieldrack', x: 25, y: 11, w: 1, h: 1, small: true }, { kind: 'mannequinbois', x: 27, y: 11, w: 1, h: 1, small: true },
      // panneaux à pictogramme, chacun juste à gauche de son poste (w: 2 : solide sur toute sa largeur ; eq : son appareil)
      { kind: 'stationsign', v: 0, x: 4, y: 9, w: 2, h: 1, small: true }, { kind: 'stationsign', v: 1, x: 4, y: 11, w: 2, h: 1, small: true },
      { kind: 'stationsign', v: 0, eq: 'traineau', x: 4, y: 13, w: 2, h: 1, small: true }, { kind: 'stationsign', v: 6, eq: 'punchbag', x: 4, y: 15, w: 2, h: 1, small: true },
      { kind: 'stationsign', v: 3, x: 8, y: 12, w: 2, h: 1, small: true }, { kind: 'stationsign', v: 3, x: 23, y: 12, w: 2, h: 1, small: true },
      { kind: 'stationsign', v: 3, eq: 'pneus', x: 18, y: 8, w: 2, h: 1, small: true },
      { kind: 'stationsign', v: 2, x: 25, y: 9, w: 2, h: 1, small: true }, { kind: 'stationsign', v: 5, x: 8, y: 16, w: 2, h: 1, small: true },
      // jardin zen : lanterne, rochers, le gros rocher peint de signes rouges
      { kind: 'stonelantern', x: 26, y: 16, w: 1, h: 1, small: true }, { kind: 'kanjirock', x: 23, y: 16, w: 2, h: 1 },
      { kind: 'rock', v: 1, x: 25, y: 17, w: 1, h: 1, small: true }, { kind: 'rock', v: 0, x: 28, y: 15, w: 1, h: 1, small: true },
      { kind: 'bench', x: 12, y: 18, w: 1, h: 1, small: true }, { kind: 'bench', x: 19, y: 18, w: 1, h: 1, small: true },
      { kind: 'barrel', v: 0, x: 3, y: 16, w: 1, h: 1, small: true }, { kind: 'barrel', v: 1, x: 28, y: 12, w: 1, h: 1, small: true },
      { kind: 'bunting', v: 6, x: 13, y: 4, w: 6, h: 1, top: true, oy: -14 },
    ],
    warps: [{ x: 15, y: 0, w: 2, h: 1, dir: 'up', to: 'village', tx: 19, ty: 29 }],
    doors: [{ x: 22, y: 4, w: 2, dir: 'up', to: 'classe', tx: 7, ty: 10 },
      { x: 8, y: 4, w: 2, dir: 'up', to: 'gymnase', tx: 8, ty: 10, cond: () => !!(DW.Gymnase && DW.Gymnase.open()) }],
    signs: {
      '14,6': async () => {
        await say("TERRAIN D'ENTRAÎNEMENT — Ouest : rocher et traîneau (PV), mannequin et sac de frappe (Attaque).  Piste : haies et pneus (Vitesse).  Est : mur (Défense).  Cristal de données : énergie (PM).  École (nord-est) : Intelligence.  Gymnase (nord-ouest) : résistances aux éléments.");
        await say("Les COMBATS font monter le niveau, et le niveau fixe le POTENTIEL de ton Digimon (10 + 3 × niveau points par stat). Dé-digivoluer ton Digimon augmente son ABI : son potentiel grimpe encore !");
        await say("L'ENTRAÎNEMENT remplit ce potentiel. Ce sont les points d'entraînement qui permettent de digivoluer !");
        await say("Chaque poste a son exercice : marteler le mannequin, enchaîner les coups au sac de frappe, soulever le rocher et tirer le traîneau au bon moment, sauter la haie ou passer les pneus sur la marque, encaisser les pierres du mur, charger l'énergie du cristal. Le traîneau et les pneus font aussi travailler une autre stat (objectif « Statistique »). Parle au poste ou à son panneau (le pictogramme indique la stat) pour commencer. Plus ton Digimon est entraîné, plus c'est dur !");
      },
      // le gymnase : fermé pendant le chapitre 1 (on y entre par la porte quand il est ouvert)
      ...Object.fromEntries(['7,4', '8,4', '9,4', '10,4'].map(k => [k, () => say(DW.Gymnase && DW.Gymnase.open()
        ? "GYMNASE — Entraînement des résistances aux éléments, avec Leomon. Entre par la grande porte !"
        : "GYMNASE — « Fermé. Le coach a disparu dans les montagnes... Celui qui le ramènera pourra endurcir ses Digimon contre le feu, l'eau, la glace, le vent et la foudre ! »")])),
      '25,11': 'Un râtelier plein de boucliers cabossés. Parfait pour apprendre à encaisser.',
      '27,11': "Un mannequin de bois aux bras tendus : Leomon s'en sert pour apprendre à parer les coups.",
    },
  };
  DW.MapKit.zoomMap(DW.MAPS.gym, 'gym');   // plan agrandi ×2 (maps/common.js)
})();
