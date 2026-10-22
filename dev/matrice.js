'use strict';
// =====================================================================
//  MATRICE DES CONTENUS : écrit docs/audit/MATRICE_CONTENUS.md à partir des vraies données du jeu (chargé dans Node avec
//  un faux navigateur, comme dev/tests.js) et de l'inventaire des cartes de l'audit (docs/audit/graphe/inventaire_complet.tsv :
//  le chapitre où chaque carte est atteinte pour la première fois depuis la maison de Jijimon).
//  Lancer depuis le dossier du projet :   node dev/matrice.js
// =====================================================================
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

// ------------------------------------------------------------ faux navigateur (le même que dev/tests.js, en plus court)
function fakeCtx() {
  const stub = () => {};
  const base = { canvas: null, getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    createLinearGradient: () => ({ addColorStop: stub }), createRadialGradient: () => ({ addColorStop: stub }),
    createPattern: () => ({}), measureText: t => ({ width: String(t).length * 5 }), getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) };
  return new Proxy(base, { get: (o, k) => (k in o ? o[k] : stub), set: (o, k, v) => ((o[k] = v), true) });
}
function fakeCanvas() { const c = { width: 1, height: 1, style: {}, getContext: () => { const x = fakeCtx(); x.canvas = c; return x; } }; return c; }
const store = new Map(), LIST = require(path.join(ROOT, 'js', 'scripts.js'));
const poser = (k, v) => Object.defineProperty(globalThis, k, { value: v, writable: true, configurable: true });
poser('setInterval', () => 0); poser('clearInterval', () => {}); poser('requestAnimationFrame', () => 0);
poser('innerWidth', 960); poser('innerHeight', 720);
poser('addEventListener', () => {}); poser('removeEventListener', () => {}); poser('dispatchEvent', () => {});
poser('matchMedia', () => ({ matches: false })); poser('navigator', {});
poser('ImageData', class { constructor(d, w, h) { this.data = d; this.width = w; this.height = h; } });
poser('Event', class { constructor(t) { this.type = t; } });
poser('localStorage', { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) });
poser('document', { getElementById: () => fakeCanvas(), createElement: t => (t === 'canvas' ? fakeCanvas() : { style: {}, appendChild() {}, addEventListener() {}, classList: { add() {} } }),
  addEventListener: () => {}, body: { appendChild() {}, classList: { add() {}, toggle() {} } }, head: { appendChild() {} }, fonts: null });
poser('window', globalThis);
for (const f of LIST) if (f !== 'main.js') vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), { filename: 'js/' + f });
const DW = globalThis.DW;

// ------------------------------------------------------------ données
const STADES = ['Bébé', 'Entraînement', 'Disciple', 'Champion', 'Ultime', 'Méga'];
const esc = s => String(s == null ? '' : s).replace(/\|/g, '/');
// chapitre où chaque carte est atteinte (inventaire de l'audit des cartes ; « — » : jamais atteinte aux chapitres 1 à 4)
const INV = path.join(ROOT, 'docs', 'audit', 'graphe', 'inventaire_complet.tsv'), chap = {};
if (fs.existsSync(INV)) for (const l of fs.readFileSync(INV, 'utf8').split('\n').slice(1)) {
  const c = l.split('\t'); if (c.length < 7) continue; const m = /^ch(\d)/.exec(c[6]); chap[c[0]] = m ? +m[1] : null;
}
const especes = Object.values(DW.SPECIES).sort((a, b) => STADES.indexOf(a.stage) - STADES.indexOf(b.stage) || a.name.localeCompare(b.name, 'fr'));
const sauvage = {};   // espèce → { ch: premier chapitre où on la croise, cartes: nombre de cartes atteintes aux ch. 1-3 }
for (const [id, M] of Object.entries(DW.MAPS)) {
  const c = chap[id]; if (!c || c > 3) continue;
  for (const e of M.encounters || []) {
    const ch = Math.max(c, e.ch || 1); if (ch > 3) continue;
    const s = sauvage[e.sp] = sauvage[e.sp] || { ch, cartes: 0 }; s.ch = Math.min(s.ch, ch); s.cartes++;
  }
}
// régions qu'aucune carte atteinte aux chapitres 1 à 3 ne touche (hors Mont Panorama, compté à part)
const fermees = [...new Set(Object.values(DW.MAPS).map(M => M.region).filter(Boolean))].filter(r => r !== 'volcan' && !Object.keys(DW.MAPS).some(id => DW.MAPS[id].region === r && chap[id] && chap[id] <= 3)).sort();
const image = sp => fs.existsSync(path.join(ROOT, 'assets', 'commun', 'jeu', `digi_${sp}_combat.webp`));
const vers = sp => [...new Set((DW.Evo.options(sp) || []).map(o => o.to))].filter(t => DW.SPECIES[t]).map(t => DW.SPECIES[t].name);
const nbEvo = especes.reduce((a, s) => a + (DW.Evo.options(s.id) || []).length, 0);
const avecEcusson = especes.reduce((a, s) => a + (DW.Evo.options(s.id) || []).filter(o => DW.Crests.requirement(o.to)).length, 0);

// ------------------------------------------------------------ document
const L = [];
const p = (...x) => L.push(...x);
p('# Matrice des contenus', '',
  `Écrite par \`node dev/matrice.js\` à partir des données du jeu (commit ${process.env.COMMIT || 'courant'}) et de l'inventaire des cartes de l'audit.`,
  'Ne pas la modifier à la main : relancer le script.', '',
  '## 1. Ce que contient cette version', '',
  '| Contenu | État |', '|---|---|',
  '| Chapitre 1 « L\'Île des Fichiers » (Kuwagamon, Shellmon, Tai délivré) | jouable de bout en bout |',
  '| Chapitre 2 « Le Lac et le Loup » (Monochromon, Seadramon, Matt délivré) | jouable de bout en bout |',
  '| Chapitre 3 « La Montagne de Feu » (grotte de Sora, Drimogemon, Meramon, Sora délivrée) | jouable de bout en bout |',
  '| Chapitre 4 « L\'Insecte Électrique » | annoncé (« À suivre... »), pas encore écrit |',
  '| Mont Panorama (13 cartes, région « volcan ») | fermé pour l\'instant (décision du joueur) |',
  '| Gymnase | fermé aux chapitres 1 à 3 (décision du joueur) |',
  '| Carte du monde dessinée | mise en pause à la demande du joueur (branche locale `carte-monde-vraie`, non publiée) |',
  `| Régions des chapitres suivants (${fermees.length} régions : ${fermees.join(', ')}) | générées, fermées par le voile de données |`, '');

p('## 2. Cartes par région', '');
const RES = path.join(ROOT, 'docs', 'audit', 'graphe', 'resume_regions.md');
if (fs.existsSync(RES)) {
  const t = fs.readFileSync(RES, 'utf8'), a = t.indexOf('| Région'), b = t.indexOf('\n\n', a);
  p('Ville au complet. « Atteintes » : cartes atteintes pour la première fois au chapitre indiqué (audit des cartes, `docs/audit/graphe/`).', '', t.slice(a, b).trim(), '');
}
p(`Total : ${Object.keys(DW.MAPS).length} cartes. Graphe des connexions complet : \`docs/audit/graphe/graphe_regions_complet.md\` et \`graphe_aretes_complet.tsv\`.`, '');

p('## 3. Boss et combats d\'histoire (chapitres 1 à 3)', '',
  '| Chapitre | Boss | Niveau | Lieu | Remarque |', '|---|---|---|---|---|',
  '| 1 | Kuwagamon | 11 | Grand Arbre | défaite : retour chez Jijimon, sans K.O. compté |',
  '| 1 | Shellmon | 17 | Antre de Shellmon (sous les cabines de la plage) | Tai et Greymon arrivent à 35 % de ses PV ; fin du chapitre 1 |',
  '| 1-2 | Whamon | 24 | Crique du Radeau | facultatif ; décor de pleine mer |',
  '| 2 | Monochromon | 21 | Rive Sud du lac | ouvre les rives du lac |',
  '| 2 | Seadramon | 26 | Lac du Tramway (la nuit) | Matt et Garurumon arrivent à 40 % ; fin du chapitre 2 |',
  '| 3 | Drimogemon | 29 | fond de la grotte de Sora (5 cartes sous le volcan) | gardien obligatoire avant Sora |',
  '| 3 | Meramon | 30 | Mont Miharashi | sans Sora : combat écrasant et fuite ; avec Sora, Birdramon arrive à 40 % ; fin du chapitre 3 |',
  '', 'Taux de victoire mesurés selon le partenaire : `docs/audit/rapports/digimon_combats.md`, § 4.2.', '');

const parStade = STADES.map(s => [s, especes.filter(e => e.stage === s)]);
p('## 4. Espèces de Digimon', '',
  `${especes.length} espèces (${parStade.map(([s, l]) => `${l.length} ${s}`).join(', ')}).`,
  `${especes.filter(e => image(e.id)).length} ont les images dessinées par le joueur (4 vues : combat, profil, face, dos) ; les autres sont dessinées par le code.`,
  `${nbEvo} Digivolutions, dont ${avecEcusson} demandent un écusson (Ultime : l'écusson de l'enfant ; Méga : les écussons réunis).`, '',
  '« Sauvage » : premier chapitre où l\'espèce se rencontre sur une carte atteinte (et nombre de ces cartes).', '',
  '| Espèce | Stade | Types | Attribut | Images du joueur | Sauvage (ch. 1-3) | Digivolue en |', '|---|---|---|---|---|---|---|');
for (const e of especes) {
  const w = sauvage[e.id];
  p(`| ${esc(e.name)} | ${e.stage} | ${esc((e.types || []).join(', '))} | ${esc(e.attr)} | ${image(e.id) ? 'oui' : 'non'} | ${w ? `ch. ${w.ch} (${w.cartes})` : '—'} | ${esc(vers(e.id).join(', ')) || '—'} |`);
}
p('');

const parUsage = {};
for (const id of DW.ITEM_ORDER) { const it = DW.ITEMS[id]; (parUsage[it.use] = parUsage[it.use] || []).push(it.name); }
const USAGE = { heal: 'soins et nourriture', mp: 'PM', cure: 'statut', revive: 'réveil', sick: 'maladie', hurt: 'blessure', chip: 'puces (bonus permanents)',
  manual: 'manuel de technique', buff: 'renfort en combat', protect: 'protection en combat', evo: 'objets de Digivolution', equip: 'équipements',
  repel: 'répulsif', bell: 'cloche', home: 'retour à la ville', potty: 'pot portable', pack: 'paquets de cartes', none: 'objets de quête ou de vente', passive: 'objets passifs (outils, sacs)' };
p('## 5. Objets', '', `${DW.ITEM_ORDER.length} objets. Catalogue complet, avec l'effet mesuré de chacun : \`docs/audit/rapports/systemes.md\`, annexe A.`, '',
  '| Usage | Nombre | Objets |', '|---|---|---|');
for (const [u, l] of Object.entries(parUsage).sort((a, b) => b[1].length - a[1].length)) p(`| ${USAGE[u] || u} | ${l.length} | ${esc(l.join(', '))} |`);
p('');

p('## 6. Quêtes, événements et drapeaux', '',
  `${Object.keys(DW.FLAGS).length} drapeaux déclarés (\`js/data/flags.js\`) : chacun est un événement ou un état de l'histoire.`,
  'Quêtes annexes des chapitres 1 à 3 : les Bukamon égarés (chapitre 2), la soif des Yokomon et le trésor de l\'épave (chapitre 3),',
  `les demandes des habitants (${Object.keys(DW.Requests.PROFILE).length - 1} profils, plus un profil commun ; la 3e demande réussie donne l'objet de Digivolution de l'habitant),`,
  'les recettes de Mushroomon, l\'album de cartes.', '',
  '| Drapeau | Signification |', '|---|---|');
for (const [k, v] of Object.entries(DW.FLAGS)) p(`| \`${k}\` | ${esc(v)} |`);
p('');

p('## 7. Musiques', '', `${Object.keys(DW.MUSIC).length} musiques synthétisées (aucun fichier son) : ${Object.keys(DW.MUSIC).join(', ')}.`, '');

const out = path.join(ROOT, 'docs', 'audit', 'MATRICE_CONTENUS.md');
fs.writeFileSync(out, L.join('\n'), 'utf8');
console.log(`écrit : docs/audit/MATRICE_CONTENUS.md (${L.length} lignes, ${especes.length} espèces, ${DW.ITEM_ORDER.length} objets, ${Object.keys(DW.FLAGS).length} drapeaux)`);
process.exit(0);
