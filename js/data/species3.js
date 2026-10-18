'use strict';
// =====================================================================
//  DIGIMON DU CHAPITRE 3 (Pays de Meramon, Mont Miharashi) — choisis par le joueur :
//  Disciples : Guilmon, Candlemon (avec Agumon, déjà là) ; Champion : Flarizamon (avec Meramon et Birdramon, déjà là)
//  Dessins : gfx/digimon/chapitre3.js ; rencontres : game/wild.js (table « miharashi »).
// =====================================================================
(function () {
  const S = DW.SPECIES, M = DW.MOVES;
  const def = (id, o) => (S[id] = Object.assign({ id }, o));
  const mv = (id, o, fx) => { M[id] = Object.assign({ acc: 95 }, o); M[id].fx = fx || (o.contact ? 'tackle' : 'orb'); };
  // ------------------------------------------------------------ techniques signature
  mv('pyro_sphere', { name: 'Pyro-Sphère', type: 'Feu', pow: 55, st: { s: 'brn', ch: 0.1 }, desc: 'Crache une sphère de feu brûlante.' }, 'fireball');
  mv('bombe_paraffine', { name: 'Bombe de Paraffine', type: 'Feu', pow: 50, desc: 'Lance une boule de cire enflammée qui colle et brûle.' }, 'fireball');
  mv('flamme_follet', { name: 'Flamme Follet', type: 'Feu', pow: 40, acc: 100, st: { s: 'brn', ch: 0.3 }, desc: 'Une petite flamme dansante qui brûle sans prévenir.' }, 'orb');
  mv('morsure_ardente', { name: 'Morsure Ardente', type: 'Feu', pow: 85, contact: true, st: { s: 'brn', ch: 0.15 }, desc: 'Mord de toutes ses dents chauffées à blanc.' }, 'bite');
  mv('poing_lave', { name: 'Poing de Lave', type: 'Feu', pow: 95, acc: 90, contact: true, desc: 'Un coup de poing enrobé de lave en fusion.' }, 'firepunch');

  def('guilmon', { name: 'Guilmon', stage: 'Disciple', types: ['Feu'], attr: 'Virus', base: { hp: 58, atk: 64, def: 50, spd: 54, int: 50 }, kg: 12,
    learn: [[1, 'griffe'], [1, 'grondement'], [1, 'pyro_sphere'], [10, 'vive_attaque'], [13, 'morsure'], [16, 'coup_tete'], [19, 'souffle_ardent'], [22, 'mega_flamme']], evo: { to: 'flarizamon', lvl: 18 }, rate: 120, xp: 72,
    desc: 'Un jeune dinosaure rouge au cœur sauvage. Le symbole du Danger Numérique brille sur son ventre. Il crache la Pyro-Sphère.' });
  def('candlemon', { name: 'Candlemon', stage: 'Disciple', types: ['Feu'], attr: 'Données', base: { hp: 52, atk: 50, def: 48, spd: 50, int: 66 }, kg: 6,
    learn: [[1, 'charge'], [1, 'flamme_follet'], [1, 'garde'], [10, 'flamme_bebe'], [13, 'bombe_paraffine'], [16, 'flamme_spirale'], [19, 'souffle_ardent'], [22, 'boule_feu']], evo: { to: 'meramon', lvl: 18 }, rate: 140, xp: 66,
    desc: 'Une bougie vivante. Sa flamme ne s\'éteint jamais, même sous la pluie. Il lance des Bombes de Paraffine brûlantes.' });
  def('flarizamon', { name: 'Flarizamon', stage: 'Champion', types: ['Feu', 'Terre'], attr: 'Vaccin', base: { hp: 80, atk: 94, def: 72, spd: 78, int: 70 }, kg: 55,
    learn: [[0, 'morsure_ardente'], [1, 'poing_lave'], [1, 'souffle_ardent'], [1, 'grondement'], [24, 'mega_flamme'], [28, 'coup_queue'], [32, 'poing_ardent']], rate: 45, xp: 152,
    desc: 'Un lézard guerrier aux écailles brûlantes. Sa crête et son dos sont en feu. Il garde les pentes des volcans.' });
  DW.DEX_ORDER.push('guilmon', 'candlemon', 'flarizamon');
  // évolutions (fusionnées dans data/evolutions.js) : Guilmon → Flarizamon (force), Candlemon → Meramon (intelligence)
  Object.assign(DW.EVO_EXTRA = DW.EVO_EXTRA || {}, {
    guilmon: [{ to: 'flarizamon', lvl: 15, req: { atk: 28, wins: 10 } }],
    candlemon: [{ to: 'meramon', lvl: 15, req: { int: 28, wins: 10 } }],
  });
})();
