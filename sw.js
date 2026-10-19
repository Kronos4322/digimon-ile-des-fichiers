'use strict';
// =====================================================================
//  SERVICE WORKER : le jeu installé (PC ou téléphone) marche hors ligne
//  Réseau d'abord : chaque mise à jour publiée est prise dès qu'on est en ligne ;
//  sans réseau, on joue avec la dernière version gardée en cache.
// =====================================================================
const CACHE = 'digimon-ile-2026-10-19';   // (nouveau nom à chaque grand ménage : l'ancien cache est vidé)

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);   // (images et scripts supprimés du jeu : plus gardés sur le téléphone)
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   // (tout le jeu, polices comprises, est sur le même site)
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
