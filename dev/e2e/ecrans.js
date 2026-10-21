'use strict';
// =====================================================================
//  FORMATS D'ÉCRAN — Playwright, avec le Chrome installé sur le PC : le jeu ouvert sur des écrans de PC (petite fenêtre,
//  Full HD, 4K à forte densité), de téléphone (paysage, portrait) et de tablette ; pour chacun, l'écran titre puis une
//  carte en jeu : le jeu tient dans l'écran sans déborder, en 4:3, les pixels restent nets (image-rendering), les commandes
//  tactiles apparaissent sur les appareils tactiles et pas sur PC, aucune erreur dans la console.
//  Lancer : node dev/e2e/ecrans.js      (captures dans dev/captures/e2e/ecrans/, non publié)
// =====================================================================
const { chromium, devices } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');

const RACINE = path.resolve(__dirname, '..', '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CAPT = path.join(RACINE, 'dev', 'captures', 'e2e', 'ecrans');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const FORMATS = [
  { nom: 'PC petite fenêtre 800x600', viewport: { width: 800, height: 600 } },
  { nom: 'PC Full HD 1920x1080', viewport: { width: 1920, height: 1080 } },
  { nom: 'PC 4K densité 2 (2560x1440)', viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 2 },
  { nom: 'téléphone paysage', ...devices['Pixel 5 landscape'] },
  { nom: 'téléphone portrait', ...devices['Pixel 5'] },
  { nom: 'tablette paysage', ...devices['iPad (gen 7) landscape'], defaultBrowserType: undefined },
];

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

(async () => {
  const srv = await serveur(), URL = `http://127.0.0.1:${srv.address().port}/`;
  const nav = await chromium.launch({ executablePath: CHROME, headless: !process.env.AFFICHER });
  fs.mkdirSync(CAPT, { recursive: true });
  let bons = 0;
  for (const F of FORMATS) {
    const { nom, defaultBrowserType, ...opts } = F;
    const ctx = await nav.newContext(opts), page = await ctx.newPage(), erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text().slice(0, 160)); });
    const pb = [];
    try {
      await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForFunction(() => window.DW && DW.Game && DW.Game.top() instanceof DW.TitleScene && DW.Textures && DW.Textures.fini, null, { timeout: 240000, polling: 300 });
      await page.waitForTimeout(3500);
      const m = await page.evaluate(() => {
        const c = document.getElementById('game'), r = c.getBoundingClientRect(), cs = getComputedStyle(c);
        return { vw: innerWidth, vh: innerHeight, x: r.left, y: r.top, w: r.width, h: r.height, rendu: cs.imageRendering, tactile: !!(DW.Touch && DW.Touch.on),
          defil: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1 };
      });
      if (m.x < -1 || m.y < -1 || m.x + m.w > m.vw + 1 || m.y + m.h > m.vh + 1) pb.push(`le jeu déborde de l'écran (${Math.round(m.w)}x${Math.round(m.h)} dans ${m.vw}x${m.vh})`);
      if (Math.abs(m.w / m.h - 4 / 3) > 0.02) pb.push(`proportions ${(m.w / m.h).toFixed(2)} au lieu de 4:3`);
      if (m.w < Math.min(m.vw, m.vh * 4 / 3) * 0.6) pb.push(`jeu très petit (${Math.round(m.w)} px de large sur ${m.vw})`);
      if (!/pixelated|crisp-edges/.test(m.rendu)) pb.push(`mise à l'échelle floue (image-rendering : ${m.rendu})`);
      if (m.defil) pb.push('barre de défilement');
      const doitTactile = !!opts.hasTouch;
      if (doitTactile !== m.tactile) pb.push(doitTactile ? 'pas de commandes tactiles sur un appareil tactile' : 'commandes tactiles affichées sur PC');
      await page.screenshot({ path: path.join(CAPT, nom.replace(/[^\p{L}\p{N}]+/gu, '_') + '_titre.png') });
      // une carte en jeu (scénario contrôlé) : le village, avec un partenaire
      await page.evaluate(() => {
        DW.state = DW.newState(); DW.state.name = 'Kenji'; DW.state.hero = 'perso'; DW.state.flags.starter = 'koromon';
        DW.addDigimon(new DW.Digimon('koromon', 6)); DW.Game.replaceAll(new DW.Overworld('village', 20, 20, 'down')); DW.fade(0, 0.01);
      });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(CAPT, nom.replace(/[^\p{L}\p{N}]+/gu, '_') + '_village.png') });
      if (erreurs.length) pb.push('erreurs : ' + [...new Set(erreurs)].slice(0, 3).join(' | '));
      console.log(`  ${pb.length ? 'ÉCHEC' : 'OK   '}  ${nom} — jeu ${Math.round(m.w)}x${Math.round(m.h)} dans ${m.vw}x${m.vh}, ${m.rendu}${m.tactile ? ', commandes tactiles' : ''}${pb.length ? '\n          ' + pb.join('\n          ') : ''}`);
      if (!pb.length) bons++;
    } catch (e) {
      console.log(`  ÉCHEC  ${nom} — ${e.message.split('\n')[0]}`);
    }
    await ctx.close();
  }
  console.log(`\n${bons} format(s) sur ${FORMATS.length} sans problème ; captures : dev/captures/e2e/ecrans/`);
  await nav.close(); srv.close();
  process.exit(bons === FORMATS.length ? 0 : 1);
})().catch(e => { console.error('Essai interrompu :', e); process.exit(2); });
