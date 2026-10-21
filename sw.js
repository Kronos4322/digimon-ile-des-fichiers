'use strict';
// =====================================================================
//  SERVICE WORKER : le jeu installé (PC ou téléphone) démarre vite et marche hors ligne
//  - SCRIPTS (réunis en paquets : paquets/) et IMAGES versionnés (?v=<empreinte> : dev/versions.py) : pris dans le cache, sans rien demander au serveur
//    (avant : les 159 scripts, l'un après l'autre, et les 249 images étaient redemandés à chaque lancement, ~20 s) ;
//    un fichier modifié a une autre adresse : il est téléchargé, l'ancienne version est retirée du cache
//  - le reste (la page, la liste des scripts js/scripts.js, les polices) : réseau d'abord — chaque mise à jour publiée
//    est prise dès qu'on est en ligne ; sans réseau (ou réseau bloqué plus de 6 s), la dernière version gardée en cache
//  - à l'installation : la page et les scripts sont rangés dans le cache ; les images, au fur et à mesure que le jeu les
//    demande (avant, toutes étaient retéléchargées en même temps que le jeu chargeait les siennes : le premier lancement
//    après une mise à jour durait deux fois plus longtemps) ; les anciennes versions sont retirées
//  - le serveur du site (GitHub Pages) NE TIENT PAS COMPTE de « ?v= » : pendant les 10 minutes qui suivent une mise à jour,
//    il peut encore servir l'ancien fichier à la nouvelle adresse (vérifié le 21/10). Un fichier téléchargé n'est donc
//    gardé que si son contenu a bien l'empreinte attendue (SHA-256, comme dev/versions.py) ; sinon il est redemandé, et
//    au pire servi sans être gardé (il sera repris au lancement suivant) — avant, l'ancienne version restait pour toujours
// =====================================================================
// (un seul cache, gardé d'une version du jeu à l'autre : rien n'est retéléchargé pour rien ; son nom change seulement pour
//  repartir d'un cache neuf partout — 21/10 : un joueur restait bloqué au camp, sans la création du personnage)
const CACHE = 'digimon-ile-2';

// les fichiers du jeu : la page et ses fichiers de départ ; les scripts (bloc VERSIONS de js/scripts.js) et les images
// (js/data/versions_images.js) à leur adresse versionnée
async function fichiersDuJeu() {
  const texte = async u => (await fetch(u, { cache: 'no-cache' })).text(), abs = u => new URL(u, self.registration.scope).href;
  const S = await texte('js/scripts.js'), V = await texte('js/data/versions_images.js');
  // (les paquets du site en ligne : bloc PAQUETS de js/scripts.js ; sans eux, les scripts un par un)
  const P = [...S.matchAll(/f: '\.\.\/(paquets\/[^']+)', v: '([0-9a-f]+)'/g)].map(m => abs(m[1] + '?v=' + m[2]));
  const versionnes = [...(P.length ? P : [...S.matchAll(/'([\w/]+\.js)': '([0-9a-f]+)'/g)].map(m => abs('js/' + m[1] + '?v=' + m[2]))),
    ...[...V.matchAll(/"([^"]+)": "([0-9a-f]+)"/g)].map(m => abs('assets/' + m[1] + '?v=' + m[2]))];
  return { pages: ['./', 'index.html', 'js/scripts.js', 'js/maps/retouches_donnees.js', 'assets/css/style.css', 'manifest.webmanifest'], versionnes };
}

self.addEventListener('install', e => e.waitUntil((async () => {
  try {
    const cache = await caches.open(CACHE), { pages, versionnes } = await fichiersDuJeu();
    await Promise.allSettled(pages.map(u => cache.add(new Request(u, { cache: 'no-cache' }))));
    // les scripts qui manquent (les images : à la demande) ; les versions qui ne servent plus sont retirées
    const garde = new Set(versionnes), manque = [];
    for (const u of versionnes) if (/\.js\?v=/.test(u) && !(await cache.match(u))) manque.push(u);
    const ouvrier = async () => { while (manque.length) { const u = manque.shift(); try { const { res, bon } = await telecharge(u); if (bon) await cache.put(u, res); } catch (err) { /* plus tard */ } } };
    await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(ouvrier));
    for (const req of await cache.keys()) if (new URL(req.url).searchParams.has('v') && !garde.has(req.url)) await cache.delete(req);
  } catch (err) { /* hors ligne : les fichiers seront rangés au fil des lancements */ }
  await self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);   // (anciens caches : nom daté des versions d'avant)
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // (tout le jeu, polices comprises, est sur le même site)
  e.respondWith(url.searchParams.has('v') ? versionne(req, url) : reseauDabord(req));
});

// l'empreinte d'un contenu : les 8 premiers caractères de son SHA-256 (dev/versions.py)
async function empreinte(buf) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(h.slice(0, 4), b => b.toString(16).padStart(2, '0')).join('');
}
// télécharge un fichier versionné et vérifie son contenu : { res, bon } (bon : c'est la version demandée, on peut la garder)
async function telecharge(u) {
  const v = new URL(u).searchParams.get('v');
  let res = null;
  for (let essai = 0; essai < 3; essai++) {
    if (essai) await new Promise(r => setTimeout(r, 1500 * essai));
    res = await fetch(u, { cache: essai ? 'reload' : 'default' });
    if (!res.ok) return { res, bon: false };
    if (!v || !(self.crypto && crypto.subtle)) return { res, bon: true };
    if ((await empreinte(await res.clone().arrayBuffer())) === v) return { res, bon: true };
  }
  return { res, bon: false };   // (encore l'ancienne version sur le serveur : servie cette fois, pas gardée)
}

async function versionne(req, url) {
  const cache = await caches.open(CACHE), hit = await cache.match(req);
  if (hit) return hit;
  const { res, bon } = await telecharge(req.url);
  if (bon) {
    await cache.put(req, res.clone());
    // (l'ancienne version de ce fichier n'a plus d'usage)
    for (const k of await cache.keys()) { const u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) await cache.delete(k); }
  }
  return res;
}

async function reseauDabord(req) {
  const cache = await caches.open(CACHE);
  const reseau = fetch(req, { cache: 'no-cache' }).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
  reseau.catch(() => {});
  const ancien = () => cache.match(req, { ignoreSearch: true });
  try {
    // réseau bloqué plus de 6 s : la version gardée en cache, s'il y en a une (le réseau la remplacera pour la suite)
    return await Promise.race([reseau, new Promise(r => setTimeout(r, 6000)).then(async () => (await ancien()) || reseau)]);
  } catch (err) {
    const hit = await ancien();
    if (hit) return hit;
    throw err;
  }
}
