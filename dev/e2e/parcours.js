'use strict';
// =====================================================================
//  PARCOURS DE JOUEUR AUTOMATISÉ — Playwright, avec le Chrome installé sur le PC ; de VRAIES TOUCHES du clavier, du
//  lancement à la reprise d'une partie :
//    écran titre → NOUVELLE PARTIE → emplacement → création du personnage → prénom → introduction → début dans la forêt →
//    réveil chez Jijimon → déplacement → dialogue avec un habitant → changement de carte → combat (scénario contrôlé : un
//    Botamon sauvage) → sauvegarde par le menu du Digivice → rechargement de la page → CONTINUER → partie retrouvée.
//  Chaque étape est vérifiée dans l'état du jeu (DW) ; les erreurs de la console et les fichiers introuvables sont relevés.
//  Lancer : node dev/e2e/parcours.js   (une seule fois avant : cd dev/e2e && npm install)
//    CHROME=…\chrome.exe : un autre navigateur ; AFFICHER=1 : fenêtre visible ; URL=https://… : tester le site en ligne
//  Le script sert lui-même le dossier du jeu (petit serveur local) ; captures dans dev/captures/e2e/ (non publié).
// =====================================================================
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');

const RACINE = path.resolve(__dirname, '..', '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CAPT = path.join(RACINE, 'dev', 'captures', 'e2e');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };

// ------------------------------------------------------------ petit serveur du dossier du jeu (aucune mise en cache)
function serveur() {
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]), f = path.join(RACINE, u === '/' ? 'index.html' : u);
      if (!f.startsWith(RACINE)) { res.writeHead(403); res.end(); return; }
      fs.readFile(f, (err, data) => {
        if (err) { res.writeHead(404); res.end('absent'); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(data);
      });
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

// ------------------------------------------------------------ résultats
const etapes = [];
let page, t0 = Date.now();
const temps = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
async function capture(nom) { try { fs.mkdirSync(CAPT, { recursive: true }); await page.screenshot({ path: path.join(CAPT, nom + '.png') }); } catch (e) { /* (pas grave) */ } }
async function etape(nom, fn) {
  const d = Date.now();
  try {
    const info = await fn();
    etapes.push({ nom, ok: true, info: info || '', s: ((Date.now() - d) / 1000).toFixed(1) });
    console.log(`  OK      ${nom}${info ? ' — ' + info : ''}  (${((Date.now() - d) / 1000).toFixed(1)} s)`);
    await capture(String(etapes.length).padStart(2, '0') + '_' + nom.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40));
    return true;
  } catch (e) {
    etapes.push({ nom, ok: false, info: e.message, s: ((Date.now() - d) / 1000).toFixed(1) });
    console.log(`  ÉCHEC   ${nom} — ${e.message}`);
    await capture(String(etapes.length).padStart(2, '0') + '_ECHEC_' + nom.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40));
    return false;
  }
}

// ------------------------------------------------------------ outils de jeu (dans la page)
const etat = () => page.evaluate(() => ({
  pile: DW.Game.stack.map(s => s.constructor.name), haut: DW.Game.top() && DW.Game.top().constructor.name,
  carte: DW.ow && DW.ow.mapId, x: DW.ow && DW.ow.p.x, y: DW.ow && DW.ow.p.y, nom: DW.state && DW.state.name,
  equipe: DW.state && DW.state.party ? DW.state.party.length : 0, starter: DW.state && DW.state.flags && DW.state.flags.starter,
  libre: !!(DW.ow && DW.Game.top() === DW.ow && !DW.ow.locked && !DW.ow.cine && DW.Fade && !(DW.Fade.a > 0.5)),
}));
const pause = ms => new Promise(r => setTimeout(r, ms));
async function touche(k, n = 1, entre = 260) { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await pause(entre); } }
async function tenir(k, ms) { await page.keyboard.down(k); await pause(ms); await page.keyboard.up(k); await pause(200); }
// appuie sur ESPACE tant que la condition n'est pas remplie (dialogues, cinématiques)
async function avancerJusqua(cond, limite, nom) {
  const fin = Date.now() + limite;
  while (Date.now() < fin) {
    if (await page.evaluate(cond)) return;
    await page.keyboard.press('Space'); await pause(320);
  }
  throw new Error(`délai dépassé (${limite / 1000} s) : ${nom}`);
}
// écran titre : ESPACE jusqu'au menu (le démarrage du Digivice, puis « APPUIE SUR ESPACE », selon où il en est)
// (jamais d'ESPACE une fois le menu ouvert : il choisirait une ligne)
async function menuDuTitre() {
  const fin = Date.now() + 30000;
  while (Date.now() < fin) {
    const ph = await page.evaluate(() => DW.Game.top() instanceof DW.TitleScene ? DW.Game.top().phase : null);
    if (ph === 'menu') { await attendre(() => DW.Game.top().menuIn.v > 0.9, 5000, 'menu affiché'); return; }
    if (ph === 'press' && !(await page.evaluate(() => DW.Game.top().logoIn.v > 0.6))) { await pause(200); continue; }
    await page.keyboard.press('Space'); await pause(400);
  }
  throw new Error('délai dépassé (30 s) : menu du titre');
}
// une question du jeu (DW.ask) : une fenêtre de dialogue avec des choix (fonction évaluée dans la page)
const question = () => DW.Game.top() instanceof DW.DialogScene && !!(DW.Game.top().o && DW.Game.top().o.choices);
async function attendre(cond, limite, nom) {
  try { await page.waitForFunction(cond, null, { timeout: limite, polling: 250 }); } catch (e) { throw new Error(`délai dépassé (${limite / 1000} s) : ${nom}`); }
}

(async () => {
  const srv = process.env.URL ? null : await serveur();
  const URL = process.env.URL || `http://127.0.0.1:${srv.address().port}/`;
  console.log(`Parcours de joueur : ${URL}  (Chrome : ${CHROME})`);
  const nav = await chromium.launch({ executablePath: CHROME, headless: !process.env.AFFICHER, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await nav.newContext({ viewport: { width: 960, height: 720 } });
  page = await ctx.newPage();
  const erreurs = [], absents = [];
  page.on('pageerror', e => erreurs.push('page : ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erreurs.push('console : ' + m.text().slice(0, 200)); });
  page.on('response', r => { if (r.status() >= 400) absents.push(r.status() + ' ' + r.url().replace(URL, '')); });
  page.on('requestfailed', r => absents.push('échec ' + r.url().replace(URL, '')));

  let ok = await etape('lancement et écran titre', async () => {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await attendre(() => window.DW && DW.Game && DW.Game.top() instanceof DW.TitleScene, 120000, 'écran titre');
    return 'TitleScene en ' + temps();
  });
  ok = ok && await etape('chargement des décors terminé', async () => {
    await attendre(() => DW.Textures && DW.Textures.fini, 240000, 'images du jeu');
    return (await page.evaluate(() => Object.keys(DW.Textures.img).length)) + ' images chargées';
  });
  ok = ok && await etape('NOUVELLE PARTIE et emplacement 1', async () => {
    await page.mouse.click(480, 360);
    await menuDuTitre();
    const i = await page.evaluate(() => DW.Game.top().i);
    if (i) await touche('ArrowUp', i, 300);   // NOUVELLE PARTIE (la première ligne)
    await touche('Space');
    await attendre(() => DW.Game.top() instanceof DW.SlotScene, 15000, 'choix de l\'emplacement');
    await touche('Space');                     // emplacement 1
    await attendre(() => DW.Game.top() instanceof DW.CreateScene, 60000, 'création du personnage');
  });
  ok = ok && await etape('création du personnage (« C\'est moi ! »)', async () => {
    await touche('Space', 3, 500);
    await attendre(() => DW.Game.top() instanceof DW.NameScene, 15000, 'saisie du prénom');
    const s = await etat(); return 'héros : ' + (await page.evaluate(() => DW.state.look && DW.state.look.ligne));
  });
  ok = ok && await etape('prénom « Kenji »', async () => {
    await touche('Enter', 1, 500);   // le prénom proposé
    await touche('Enter', 1, 500);   // VALIDER
    await attendre(() => DW.state.name === 'Kenji', 10000, 'prénom enregistré');
    return 'nom : ' + (await etat()).nom;
  });
  ok = ok && await etape('introduction jusqu\'au début dans la forêt', async () => {
    await page.evaluate(() => { DW.timeScale = 4; });   // (accélérée : la cinématique dure une minute à vitesse normale)
    await avancerJusqua(() => !!(DW.ow && DW.state.flags.starter), 240000, 'premier partenaire dans la forêt');
    return 'partenaire : ' + (await page.evaluate(() => DW.state.party[0] && DW.state.party[0].name));
  });
  ok = ok && await etape('réveil chez Jijimon, le joueur a la main', async () => {
    await avancerJusqua(() => !!(DW.ow && DW.ow.mapId === 'maison' && DW.Game.top() === DW.ow && !DW.ow.locked && !DW.ow.cine && !(DW.Fade && DW.Fade.a > 0.5)), 300000, 'contrôle chez Jijimon');
    await page.evaluate(() => { DW.timeScale = 1; });
    const s = await etat(); return `${s.carte} (${s.x}, ${s.y})`;
  });
  ok = ok && await etape('déplacement au clavier', async () => {
    const a = await etat();
    for (const k of ['ArrowDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp']) {
      await tenir(k, 700);
      const b = await etat(); if (b.x !== a.x || b.y !== a.y) return `(${a.x}, ${a.y}) → (${b.x}, ${b.y})`;
    }
    throw new Error('le héros n\'a pas bougé');
  });
  ok = ok && await etape('dialogue avec un habitant (ESPACE)', async () => {
    // (scénario contrôlé : le héros est posé juste devant un habitant de la maison, tourné vers lui)
    const qui = await page.evaluate(() => {
      const ow = DW.ow, n = (ow.map.npcs || []).find(n => !n.cond || n.cond(DW.state)); if (!n) return null;
      const [dx, dy, dir] = [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']].find(([dx, dy]) => !ow.solid(n.x + dx, n.y + dy)) || [0, 1, 'up'];
      ow.load(ow.mapId, n.x + dx, n.y + dy, dir); return n.sp || n.hero || n.name || 'habitant';
    });
    if (!qui) throw new Error('aucun habitant dans la maison');
    await pause(500); await touche('Space');
    await attendre(() => DW.Game.top() instanceof DW.DialogScene, 8000, 'fenêtre de dialogue');
    await avancerJusqua(() => DW.Game.top() === DW.ow, 60000, 'fin du dialogue');
    return 'parlé à : ' + qui;
  });
  ok = ok && await etape('changement de carte (sortie de la maison)', async () => {
    const avant = (await etat()).carte;
    const sortie = await page.evaluate(() => {
      const ow = DW.ow, W = [...(ow.map.warps || []), ...(ow.map.doors || [])].find(w => w.to && w.to !== ow.mapId); if (!W) return null;
      const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[W.dir || 'down'];
      ow.load(ow.mapId, W.x - D[0], W.y - D[1], W.dir || 'down'); return { to: W.to, dir: W.dir || 'down' };
    });
    if (!sortie) throw new Error('aucune sortie trouvée');
    await pause(500);
    const K = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[sortie.dir];
    for (let i = 0; i < 4 && (await etat()).carte === avant; i++) await tenir(K, 500);
    await attendre(() => DW.ow && DW.Game.top() === DW.ow && !DW.ow.locked, 60000, 'nouvelle carte prête');
    const s = await etat(); if (s.carte === avant) throw new Error('toujours sur ' + avant);
    return `${avant} → ${s.carte}`;
  });
  ok = ok && await etape('combat contrôlé jusqu\'à la victoire', async () => {
    // (scénario contrôlé : un Botamon sauvage de niveau 1 contre le partenaire de départ ; joué ensuite au clavier)
    await page.evaluate(() => { window.__fin = null; DW.ow.battle({ enemy: new DW.Digimon('botamon', 1) }).then(r => { window.__fin = r; }); });
    await attendre(() => DW.Game.top() instanceof DW.BattleScene, 30000, 'entrée en combat');
    await avancerJusqua(() => window.__fin != null, 180000, 'fin du combat');
    await avancerJusqua(() => DW.Game.top() === DW.ow, 30000, 'retour à l\'exploration');
    return 'résultat : ' + (await page.evaluate(() => window.__fin));
  });
  ok = ok && await etape('sauvegarde par le menu du Digivice', async () => {
    await page.evaluate(() => { window.__avant = DW.state.savedAt || 0; });
    await touche('Enter', 1, 600);   // menu
    await attendre(() => DW.Game.top() && DW.Game.top().constructor.name === 'MenuScene', 8000, 'menu ouvert');
    const i = await page.evaluate(() => DW.Game.top().items.findIndex(([k]) => k === 'systeme'));
    const n = await page.evaluate(() => DW.Game.top().items.length);
    await touche(i <= n / 2 ? 'ArrowRight' : 'ArrowLeft', i <= n / 2 ? i : n - i, 300);
    await touche('Space', 1, 600);   // Système
    await attendre(question, 8000, 'choix du Système');
    await touche('Space', 1, 600);   // Sauvegarder
    await attendre(() => DW.Game.top() instanceof DW.DialogScene && !!(DW.Game.top().o && DW.Game.top().o.choices) && /progression/.test(DW.Game.top().pages.flat().join(' ')), 8000, 'confirmation');
    await touche('Space', 1, 600);   // Oui
    await attendre(() => (DW.state.savedAt || 0) > window.__avant, 8000, 'partie sauvegardée');
    await avancerJusqua(() => DW.Game.top() && DW.Game.top().constructor.name === 'MenuScene', 15000, 'message de sauvegarde');
    await touche('Delete', 1, 600);  // fermer le menu
    await attendre(() => DW.Game.top() === DW.ow, 8000, 'menu fermé');
    const s = await etat(); return `sauvé sur ${s.carte} (${s.x}, ${s.y})`;
  });
  const sauve = ok ? await etat() : null;
  ok = ok && await etape('rechargement de la page puis CONTINUER', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await attendre(() => window.DW && DW.Game && DW.Game.top() instanceof DW.TitleScene, 120000, 'écran titre');
    await page.mouse.click(480, 360);
    await menuDuTitre();
    const opts = await page.evaluate(() => DW.Game.top().opts);
    if (!opts.includes('CONTINUER')) throw new Error('pas de CONTINUER à l\'écran titre : ' + opts.join(', '));
    const i = await page.evaluate(() => DW.Game.top().i);
    await touche(i === 1 ? 'Space' : 'ArrowDown', 1, 400); if (i !== 1) await touche('Space');
    await attendre(() => DW.Game.top() instanceof DW.SlotScene, 15000, 'choix de la partie');
    await touche('Space');
    await attendre(() => DW.ow && DW.Game.top() === DW.ow && DW.state.name === 'Kenji', 240000, 'partie reprise');
    const s = await etat();
    if (s.carte !== sauve.carte || s.equipe !== sauve.equipe) throw new Error(`état différent : ${JSON.stringify(s)} au lieu de ${JSON.stringify(sauve)}`);
    return `${s.nom} retrouvé sur ${s.carte} (${s.x}, ${s.y}), ${s.equipe} Digimon`;
  });

  console.log('\nErreurs de la console : ' + (erreurs.length ? '\n  ' + [...new Set(erreurs)].slice(0, 20).join('\n  ') : 'aucune'));
  console.log('Fichiers introuvables : ' + (absents.length ? '\n  ' + [...new Set(absents)].slice(0, 20).join('\n  ') : 'aucun'));
  const n = etapes.filter(e => e.ok).length;
  console.log(`\n${n} étape(s) réussie(s) sur ${etapes.length}, en ${temps()} ; captures : dev/captures/e2e/`);
  await nav.close(); if (srv) srv.close();
  process.exit(n === etapes.length && !erreurs.length ? 0 : 1);
})().catch(async e => { console.error('Parcours interrompu :', e); process.exit(2); });
