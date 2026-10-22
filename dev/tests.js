'use strict';
// =====================================================================
//  TESTS AUTOMATIQUES de la logique du jeu (sans navigateur)
//  Lancer depuis le dossier du projet :   node dev/tests.js
//  Le jeu est chargé dans un faux navigateur minimal (canvas factice) ; on vérifie
//  ce qui ne se voit pas à l'écran : sauvegarde, combat, expérience, drapeaux,
//  liste des scripts. Les cartes et l'arbre des Digivolutions : dev/check.html.
// =====================================================================
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

// ------------------------------------------------------------ faux navigateur
function fakeCtx() {
  const stub = () => {};
  const base = {
    canvas: null,
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    createLinearGradient: () => ({ addColorStop: stub }), createRadialGradient: () => ({ addColorStop: stub }),
    createPattern: () => ({}), measureText: t => ({ width: String(t).length * 5 }),
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),   // (dessins des objets : engine/art.js)
  };
  return new Proxy(base, { get: (o, k) => (k in o ? o[k] : stub), set: (o, k, v) => ((o[k] = v), true) });
}
function fakeCanvas() { const c = { width: 1, height: 1, style: {}, getContext: () => { const x = fakeCtx(); x.canvas = c; return x; } }; return c; }
const store = new Map();
const LIST = require(path.join(ROOT, 'js', 'scripts.js'));   // (avant le faux document : sinon scripts.js se croit dans un navigateur)
// Le faux navigateur est posé sur l'objet global de Node et les scripts du jeu s'exécutent dans le contexte principal
// (vm.runInThisContext) : dans un contexte vm.createContext, chaque accès à une variable globale (Math, DW...) passe par
// un intercepteur, Math.* y était environ 200 fois plus lent et la suite prenait plusieurs minutes.
const sandbox = globalThis, poser = (k, v) => Object.defineProperty(sandbox, k, { value: v, writable: true, configurable: true });
poser('setInterval', () => 0); poser('clearInterval', () => {}); poser('requestAnimationFrame', () => 0);
poser('innerWidth', 960); poser('innerHeight', 720);
poser('addEventListener', () => {}); poser('removeEventListener', () => {}); poser('dispatchEvent', () => {});
poser('matchMedia', () => ({ matches: false }));
poser('navigator', {});
poser('ImageData', class { constructor(d, w, h) { this.data = d; this.width = w; this.height = h; } });
poser('Event', class { constructor(t) { this.type = t; } });
poser('localStorage', { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) });
poser('document', {
  getElementById: () => fakeCanvas(),
  createElement: t => (t === 'canvas' ? fakeCanvas() : { style: {}, appendChild() {}, addEventListener() {}, classList: { add() {} } }),
  addEventListener: () => {}, body: { appendChild() {}, classList: { add() {}, toggle() {} } }, head: { appendChild() {} }, fonts: null,
});
poser('window', sandbox);
for (const f of LIST) {
  if (f === 'main.js') continue;
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), { filename: 'js/' + f });
}
const DW = sandbox.DW;
DW.say = async () => {}; DW.ask = async () => 0; DW.choose = async () => 0;   // dialogues : réponses automatiques

// ------------------------------------------------------------ mini cadre de test
let ok = 0, ko = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg ? msg + ' : ' : ''}attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`); };
const yes = (v, msg) => { if (!v) throw new Error(msg || 'condition fausse'); };
const srcFiles = dir => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? srcFiles(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []);
const SAVE = 'digimon_ile_des_fichiers_save';
const fresh = () => { store.clear(); DW.state = DW.newState(); DW.ow = null; };
// erreurs attendues (sauvegarde cassée exprès) : pas d'affichage dans la console
const quiet = fn => { const r = DW.reportError; DW.reportError = () => {}; try { return fn(); } finally { DW.reportError = r; } };
const withRandom = (v, fn) => { const r = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = r; } };

// ------------------------------------------------------------ liste des scripts
// GÉOGRAPHIE DU MONDE (chapitres 1 à 3) : posées à leur place (passages alignés), les cartes forment UN territoire :
// toutes les boucles se referment, rien ne se chevauche, et aucune frontière n'a de rupture (côte d'un seul côté,
// rivière qui disparaît, chemin qui finit dans l'eau, arrivée dans un obstacle, niveaux d'altitude différents)
test('monde des chapitres 1 à 3 : cartes raccordées en un seul territoire, sans rupture géographique', () => {
  for (const f of ['geographie.js', 'assemblage.js']) vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'dev', f), 'utf8'), { filename: 'dev/' + f });
  const REG = new Set(['plage', 'foret', 'lac', 'village', 'miharashi']), ids = ['clairiere'], seen = new Set(ids);
  for (let i = 0; i < ids.length; i++) for (const w of DW.getMap(ids[i]).warps || []) {
    const t = DW.MAPS[w.to]; if (!t || seen.has(w.to) || t.indoor || !w.dir || w.enclos || !REG.has(t.region) || ['residentiel', 'numerique', 'marche'].includes(w.to)) continue;
    seen.add(w.to); ids.push(w.to);
  }
  yes(ids.length >= 29, 'cartes trouvées : ' + ids.length);
  DW.Monde.build();
  const horsCoeur = DW.Monde.horsGrille().filter(id => DW.Monde.coeur(id));
  eq(horsCoeur.length, 0, 'cartes des chapitres 1-3 hors grille : ' + horsCoeur.join(', ') + ' — ' + DW.Monde.conflits().filter(c => horsCoeur.some(id => c.includes(id))).join(' ; '));
  for (const id of ids) yes(DW.Monde.pos(id), 'pas de place dans la grille du monde : ' + id);
  const errs = sandbox.GEO.verifier(ids).ruptures.flatMap(r => r.problemes.filter(p => p[0] === 'ERREUR').map(p => r.liaison + ' : ' + p[1]));
  eq(errs.length, 0, errs.slice(0, 6).join(' ; '));
});

test('js/scripts.js liste tous les fichiers du jeu, et seulement eux', () => {
  const js = path.join(ROOT, 'js');
  const onDisk = srcFiles(js).map(f => path.relative(js, f).split(path.sep).join('/')).filter(f => f !== 'scripts.js');
  const missing = onDisk.filter(f => !LIST.includes(f)), extra = LIST.filter(f => !onDisk.includes(f));
  yes(!missing.length, 'absents de la liste : ' + missing.join(', '));
  yes(!extra.length, 'listés mais introuvables : ' + extra.join(', '));
  eq(new Set(LIST).size, LIST.length, 'doublons dans la liste');
});
test('scripts : chaque script a son empreinte à jour (bloc VERSIONS de js/scripts.js : python dev/versions.py)', () => {
  const crypto = require('crypto'), s = fs.readFileSync(path.join(ROOT, 'js', 'scripts.js'), 'utf8');
  const V = Object.fromEntries([...s.slice(s.indexOf('const VERSIONS = {'), s.indexOf('(fin des versions)')).matchAll(/'([\w/]+\.js)': '([0-9a-f]+)'/g)].map(m => [m[1], m[2]]));
  // (les retouches de l'atelier, souvent modifiées sans être publiées, n'en ont pas : toujours redemandées au serveur)
  for (const f of LIST) eq(V[f], f === 'maps/retouches_donnees.js' ? undefined : crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'js', f))).digest('hex').slice(0, 8), f + ' : empreinte périmée');
  eq(Object.keys(V).length, LIST.length - 1, 'empreintes de scripts disparus');
});
test('paquets du site en ligne : chacun est la réunion exacte de ses scripts, avec son empreinte (python dev/versions.py)', () => {
  const crypto = require('crypto'), s = fs.readFileSync(path.join(ROOT, 'js', 'scripts.js'), 'utf8');
  const P = [...s.slice(s.indexOf('const PAQUETS = ['), s.indexOf('(fin des paquets)')).matchAll(/\{ f: '([^']+)'(?:, v: '([0-9a-f]+)')? \}/g)].map(m => [m[1], m[2]]);
  yes(P.length >= 2, 'bloc PAQUETS vide');
  let k = 0;   // (les fichiers de LIST, dans l'ordre, répartis dans les paquets)
  for (const [f, v] of P) {
    if (!f.startsWith('../paquets/')) { eq(f, LIST[k], 'fichier à part attendu'); k++; continue; }
    const txt = fs.readFileSync(path.join(ROOT, 'paquets', path.basename(f)), 'utf8');
    eq(crypto.createHash('sha256').update(txt).digest('hex').slice(0, 8), v, f + ' : empreinte périmée');
    const SEP = /\n\/\/ ===== js\/([\w/]+\.js)\n/g, fichiers = [...txt.matchAll(SEP)].map(m => m[1]), morceaux = txt.split(/\n\/\/ ===== js\/[\w/]+\.js\n/).slice(1);
    fichiers.forEach((g, i) => { eq(g, LIST[k], f + ' : ordre des scripts'); k++; eq(morceaux[i].replace(/\n;\n$/, ''), fs.readFileSync(path.join(ROOT, 'js', g), 'utf8').replace(/\n+$/, ''), f + ' : ' + g + ' périmé'); });
  }
  eq(k, LIST.length, 'scripts absents des paquets');
});
test('images : chaque image servie a son empreinte à jour (js/data/versions_images.js : python dev/versions.py)', () => {
  const crypto = require('crypto'), V = DW.VERSIONS_IMAGES, A = path.join(ROOT, 'assets'), vus = new Set();
  for (const d of fs.readdirSync(A)) for (const sous of ['jeu', 'kit']) {
    const p = path.join(A, d, sous); if (d.startsWith('ASSETS') || !fs.existsSync(p)) continue;
    for (const f of fs.readdirSync(p)) if (/\.(png|webp|jpg)$/i.test(f)) {
      const k = `${d}/${sous}/${f}`; vus.add(k);
      eq(V[k], crypto.createHash('sha256').update(fs.readFileSync(path.join(p, f))).digest('hex').slice(0, 8), k + ' : empreinte périmée');
    }
  }
  const trop = Object.keys(V).filter(k => !vus.has(k));
  yes(!trop.length, 'images disparues : ' + trop.join(', '));
});
test('aucune page HTML ne recopie la liste des scripts', () => {
  for (const f of ['index.html', 'dev/check.html', 'dev/gallery.html']) {
    const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    yes(/scripts\.js/.test(s), f + ' ne charge pas js/scripts.js');
    yes(!/js\/(engine|game|gfx|ui|maps|data)\//.test(s), f + ' charge encore des scripts à la main');
  }
});

test('fins de ligne Unix (LF) partout : jamais de CRLF (règle du projet)', () => {
  const files = [...srcFiles(path.join(ROOT, 'js')), ...srcFiles(path.join(ROOT, 'dev'))];
  const bad = files.filter(f => fs.readFileSync(f, 'utf8').includes(String.fromCharCode(13))).map(f => path.relative(ROOT, f));
  yes(!bad.length, 'fichiers en CRLF (à normaliser) : ' + bad.join(', '));
});

// ------------------------------------------------------------ écrans appelés par un nom inconnu (oubli après un découpage de fichier)
test('chaque écran « new XxxScene(...) » est déclaré dans son fichier (sinon : DW.XxxScene)', () => {
  const bad = [];
  for (const f of srcFiles(path.join(ROOT, 'js'))) {
    const s = fs.readFileSync(f, 'utf8'), declared = new Set([...s.matchAll(/\b(?:class|const|let|function)\s+([A-Z]\w*Scene)\b/g)].map(m => m[1]));
    for (const m of s.matchAll(/(?<![.\w])new\s+([A-Z]\w*Scene)\s*\(/g)) if (!declared.has(m[1])) bad.push(path.basename(f) + ' : ' + m[1]);
  }
  yes(!bad.length, 'écrans inconnus : ' + bad.join(', '));
});

// ------------------------------------------------------------ drapeaux
test('tous les drapeaux utilisés sont déclarés dans js/data/flags.js', () => {
  const unknown = new Set();
  for (const f of srcFiles(path.join(ROOT, 'js'))) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/flags\.([A-Za-z_]\w*)/g)) if (m[1] !== 'js' && !DW.flagKnown(m[1])) unknown.add(`${m[1]} (${path.basename(f)})`);
    for (const m of s.matchAll(/flags\[['"]([^'"]+)['"]\]/g)) if (!DW.flagKnown(m[1])) unknown.add(`${m[1]} (${path.basename(f)})`);
  }
  yes(!unknown.size, 'non déclarés : ' + [...unknown].join(', '));
});

// ------------------------------------------------------------ données
test('aucun déclencheur sans condition ne bloque un passage vers une autre carte', () => {
  for (const id in DW.MAPS) {
    if (DW.MAPS[id].spec && !(DW.MAPS[id].triggers || []).length) continue;   // sous-zones générées sans déclencheur : inutile de les construire (lent)
    const m = DW.getMap(id);
    for (const t of m.triggers || []) if (!t.cond) for (const w of m.warps || []) {
      const dx = Math.max(0, w.x - (t.x + (t.w || 1) - 1), t.x - (w.x + (w.w || 1) - 1)), dy = Math.max(0, w.y - (t.y + (t.h || 1) - 1), t.y - (w.y + (w.h || 1) - 1));
      yes(dx + dy > 3, `${id} : déclencheur (${t.x},${t.y}) collé au passage vers ${w.to}`);
    }
  }
});
test('chaque carte a un climat connu (météo)', () => {
  for (const id in DW.MAPS) { const c = DW.MAPS[id].climate; if (c) yes(DW.Time.CLIMATES[c], `${id} : climat inconnu ${c}`); }
});
test('les drapeaux créés par programme (préfixes) sont déclarés', () => {
  for (const k of ['act_cup_0', 'act_curling', 'act_dig', 'act_fish', 'pk_clairiere']) yes(DW.flagKnown(k), k + ' non déclaré');
});
test('chaque technique a un nom, un élément et un coût en PM (plus de PP)', () => {
  for (const id in DW.MOVES) {
    const mv = DW.MOVES[id];
    yes(mv.name, id + ' sans nom'); yes(mv.type, id + ' sans élément');
    yes(Number.isFinite(DW.mpCost(id)), id + ' : coût en PM invalide');
    yes(!('pp' in mv), id + ' : reliquat de PP');
  }
});
test('les coups spéciaux (DW.SIG) existent', () => {
  for (const sp in DW.SIG) { yes(DW.SPECIES[sp], 'espèce inconnue ' + sp); yes(DW.MOVES[DW.SIG[sp]], `${sp} : coup spécial inconnu ${DW.SIG[sp]}`); }
});

// ------------------------------------------------------------ Digimon, expérience
test("l'expérience demandée par niveau est strictement croissante", () => {
  for (let l = 2; l <= 100; l++) yes(DW.xpForLevel(l) > DW.xpForLevel(l - 1), 'niveau ' + l);
});
test("gagner de l'expérience fait monter de niveau, sans dépasser 100", () => {
  fresh();
  const m = new DW.Digimon('agumon', 5);
  const ev = m.addXp(DW.xpForLevel(8) - m.xp);
  eq(m.level, 8); eq(ev.filter(e => e.type === 'level').length, 3);
  m.addXp(1e9); eq(m.level, 100);
});
test('un Digimon ne connaît jamais plus de DW.MAX_MOVES techniques', () => {
  for (const sp in DW.SPECIES) { const m = new DW.Digimon(sp, 60); yes(m.moves.length <= DW.MAX_MOVES, sp); }
});

// ------------------------------------------------------------ combat
test('dégâts : au moins 1, coup spécial plus fort, Feu efficace sur Plante', () => {
  fresh();
  const B = new DW.BattleScene({ enemy: new DW.Digimon('palmon', 20), bg: 'foret' });
  B.active = new DW.Digimon('agumon', 20);
  const fire = Object.keys(DW.MOVES).find(id => DW.MOVES[id].type === 'Feu' && DW.MOVES[id].pow > 0);
  withRandom(0.5, () => {
    const a = B.calc('p', DW.MOVES[fire], B.active, B.enemy), s = B.calc('p', DW.MOVES[fire], B.active, B.enemy, 1.5);
    yes(a.dmg >= 1, 'dégâts nuls');
    yes(s.dmg > a.dmg, 'le coup spécial ne fait pas plus mal');
    yes(a.tm > 1, 'Feu devrait être efficace sur Plante');
  });
});
test("boss avec toute l'équipe K.O. : combat refusé proprement (pas de blocage)", async () => {
  fresh();
  const m = new DW.Digimon('koromon', 8); m.hp = 0; DW.state.party = [m];
  let pushed = false; const push = DW.Game.push; DW.Game.push = () => { pushed = true; return Promise.resolve('win'); };
  try {
    const fakeOw = { map: { music: 'foret' }, battleKey: () => 'foret' };
    const res = await DW.Overworld.prototype.battle.call(fakeOw, { enemy: new DW.Digimon('kuwagamon', 9), boss: true });
    eq(res, 'none'); yes(!pushed, "l'écran de combat a été ouvert");
  } finally { DW.Game.push = push; }
});
test('une erreur pendant un combat referme le combat au lieu de le bloquer', async () => {
  fresh();
  const B = new DW.BattleScene({ enemy: new DW.Digimon('kuwagamon', 9), boss: true });
  B.run = async () => { throw new Error('erreur de test'); };
  const rep = DW.reportError, fade = DW.fade; let reported = false;
  DW.reportError = () => { reported = true; }; DW.fade = async () => {};
  const res = new Promise(r => { B._resolve = r; });
  try {
    B.enter();
    eq(await Promise.race([res, new Promise(r => setTimeout(() => r('BLOQUÉ'), 3000))]), 'error');
    yes(reported, 'erreur non signalée');
  } finally { DW.reportError = rep; DW.fade = fade; }
});

// ------------------------------------------------------------ Digivolutions, ABI, combats (audit des Digimon)
// banc de combat : la vraie logique de BattleScene (tours, dégâts, coup spécial, statuts, expérience), sans animations ;
// le partenaire joue sa meilleure attaque payable (coup spécial dès que la jauge est pleine) ; hasard reproductible (graine)
async function combatSimule(o, party, graine) {
  const R = Math.random, garde = { tween: DW.tween, wait: DW.wait, fade: DW.fade, playFX: DW.playFX, impact: DW.Elem.impact, rumble: DW.Input.rumble };
  let s = graine >>> 0;
  const hasard = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  Math.random = hasard;
  DW.tween = (x, p) => { Object.assign(x, p); return Promise.resolve(); }; DW.wait = async () => {}; DW.fade = async () => {}; DW.playFX = async () => {};
  DW.Elem.impact = () => {}; DW.Input.rumble = () => {};
  try {
    DW.state.party = party; DW.state.weather = { type: 'clear', until: 1e12 };
    const B = new DW.BattleScene(o);
    Object.assign(B, { msg: async () => {}, attackAnim: async () => {}, hitAnim: async () => {}, sparkle: () => {}, center: () => ({ x: 0, y: 0 }), chargeUp: async () => 70 });
    B.faint = async side => { B.spr[side].vis = false; };
    const attendu = (P, mv) => { if (!(mv.pow > 0)) return 0; Math.random = () => 0.5; try { return B.calc('p', mv, P, B.enemy).dmg * (mv.acc ? mv.acc / 100 : 1); } finally { Math.random = hasard; } };
    B.playerTurn = async () => {
      const P = B.active;
      if (B.energy.p >= 100 && DW.sigOf(P)) return { type: 'move', special: true };
      const pay = P.moves.map((m, i) => ({ i, e: attendu(P, DW.MOVES[m.id]) })).filter(x => P.canPay(P.moves[x.i].id)).sort((a, b) => b.e - a.e);
      return pay.length && pay[0].e > 0 ? { type: 'move', slot: pay[0].i } : { type: 'move', slot: -1 };
    };
    return await B.run();
  } finally { Math.random = R; DW.tween = garde.tween; DW.wait = garde.wait; DW.fade = garde.fade; DW.playFX = garde.playFX; DW.Elem.impact = garde.impact; DW.Input.rumble = garde.rumble; }
}
const IV7 = { hp: 7, atk: 7, def: 7, spd: 7, int: 7 };
test("ABI : +1 la première fois qu'il atteint une forme, +2 la première fois qu'il en dé-digivolue (plus de boucle), gardé par la sauvegarde", () => {
  fresh();
  const m = new DW.Digimon('koromon', 7); m.tr.atk = 10; m.wins = 3; DW.state.party = [m];
  for (let i = 0; i < 10; i++) { m.evolve('agumon'); m.evolve(DW.Evo.prev1(m.sp, m.parcours)); }
  eq(m.sp, 'koromon'); eq(m.abi, 3, '10 allers-retours Koromon ↔ Agumon (avant : ABI 30)');
  eq(DW.Training.cap(m), 10 + 7 * 3 + 4 * 3, "plafond d'entraînement au N.7");
  // la sauvegarde garde les formes atteintes et les dé-digivolutions faites
  yes(DW.save(), 'échec de la sauvegarde'); DW.state = DW.newState(); yes(DW.load(), 'échec du chargement');
  const n = DW.state.party[0]; n.evolve('agumon'); n.evolve('koromon'); eq(n.abi, 3, "après rechargement, l'aller-retour ne rapporte plus rien");
  n.evolve('gabumon'); eq(n.abi, 4, 'une forme nouvelle : +1'); n.evolve('koromon'); eq(n.abi, 6, 'première dé-digivolution depuis Gabumon : +2');
  // une ancienne sauvegarde, sans ces listes, se charge et repart de son parcours et de sa forme actuelle
  const o = new DW.Digimon('agumon', 12, { parcours: ['botamon', 'koromon'], abi: 2 }).toJSON(); delete o.formes; delete o.dedigiDe;
  const v = DW.Digimon.from(JSON.parse(JSON.stringify(o)));
  eq(v.formes.join(), 'botamon,koromon,agumon'); eq(v.dedigiDe.length, 0);
  DW.state.party = [v];
  yes(/ABI \+2/.test(new DW.EvoTableScene(0).abiTxt('koromon')), "la fiche n'annonce pas l'ABI +2 de la première dé-digivolution");
  v.evolve('koromon'); eq(v.abi, 4); v.evolve('agumon'); eq(v.abi, 4, 'Agumon déjà atteint : pas de +1');
  // la fiche Digivolution dit la vérité quand il n'y a plus de gain
  yes(/pas d'ABI en plus/.test(new DW.EvoTableScene(0).abiTxt('koromon')), 'la fiche annonce encore « ABI +2 »');
});
test('écussons : chaque Ultime en demande un (MegaKabuterimon : Izzy ; MagnaAngemon et Angewomon : T.K.)', () => {
  for (const sp in DW.EVO) for (const o of DW.EVO[sp]) if (DW.SPECIES[o.to].stage === 'Ultime') yes(DW.Crests.OF[o.to], `${sp} → ${o.to} : aucun écusson demandé`);
  for (const [a, b, k] of [['kabuterimon', 'megakabuterimon', 'izzy'], ['angemon', 'magnaangemon', 'tk'], ['gatomon', 'angewomon', 'tk']]) {
    fresh();
    const m = new DW.Digimon(a, 40); m.tr = { hp: 64, mp: 64, atk: 64, def: 64, spd: 64, int: 64 }; m.wins = 999; m.happy = 100; m.disc = 100;
    const o = DW.Evo.options(a).find(x => x.to === b), row = () => DW.Evo.check(m, o).rows.find(r => /Écusson/.test(r.label));
    yes(!DW.Evo.check(m, o).ok && row() && row().crest === k, `${a} → ${b} possible sans l'écusson ${k}`);
    DW.Crests.give(k); yes(DW.Evo.check(m, o).ok, `${a} → ${b} refusé avec l'écusson ${k}`);
  }
});
test("dé-digivolution et renaissance après un objet de Digivolution : la vraie forme d'avant (Gabumon de Matt + Aile de flammes)", () => {
  fresh();
  const m = new DW.Digimon('punimon', 5); m.evolve('tsunomon'); m.evolve('gabumon'); m.evolve(DW.ITEMS.aile_flamme.to);
  eq(m.sp, 'birdramon'); eq(DW.Evo.prev1(m.sp, m.parcours), 'gabumon', 'forme précédente (avant : Biyomon)'); eq(DW.Life.babyOf(m), 'punimon', 'renaissance (avant : Nyokimon)');
  m.evolve(DW.Evo.prev1(m.sp, m.parcours)); eq(m.sp, 'gabumon'); eq(m.parcours.join(), 'punimon,tsunomon');
  const g = new DW.Digimon('greymon', 26, { parcours: ['botamon', 'koromon', 'agumon'] }); g.evolve(DW.ITEMS.x_bandage.to);
  eq(DW.Evo.prev1(g.sp, g.parcours), 'greymon', 'Greymon + Bandage X → Monzaemon : redevient Greymon (avant : Numemon)');
  // Omegamon, né d'une fusion, ne dé-digivolue pas (le partenaire de fusion était perdu)
  yes(DW.Evo.estFusion('omegamon') && !DW.Evo.estFusion('wargreymon'), 'fusion mal reconnue');
});
test('formes de négligence : Ogremon → Etemon et Devimon → Megadramon ne plafonnent pas les erreurs de soin', () => {
  fresh(); DW.Crests.give('tai'); DW.Crests.give('matt');
  for (const [a, mid, b] of [['gabumon', 'ogremon', 'etemon'], ['patamon', 'devimon', 'megadramon']]) {
    const m = new DW.Digimon(a, 18); m.tr = { hp: 99, mp: 0, atk: 99, def: 99, spd: 99, int: 99 }; m.mistakes = 3; m.wins = 99; m.happy = 100; m.disc = 100;
    yes(DW.Evo.check(m, DW.Evo.options(a).find(o => o.to === mid)).ok, `${a} → ${mid} (3 erreurs)`);
    m.evolve(mid); m.level = 40; m.mistakes = 6;
    const c = DW.Evo.check(m, DW.Evo.options(mid).find(o => o.to === b));
    yes(c.ok, `${mid} N.40 → ${b} impossible : ${c.rows.filter(r => !r.ok).map(r => r.label).join(', ')}`);
  }
  eq(DW.Evo.options('leomon').find(o => o.to === 'etemon').req.mistakesMax, 2, 'Leomon → Etemon garde son plafond');
  eq(DW.Evo.options('gomamon').find(o => o.to === 'shellmon').req.wins, 10, 'Gomamon → Shellmon : 10 victoires');
});
test('un Digimon K.O. ne digivolue pas depuis sa fiche, et une Digivolution ne relève jamais un K.O.', async () => {
  fresh();
  const m = new DW.Digimon('agumon', 15); m.tr.atk = 28; m.wins = 10; m.hp = 0; DW.state.party = [m];
  const T = new DW.EvoTableScene(0); T.col = 1; T.sel = T.opts.findIndex(o => o.to === 'greymon');
  yes(T.sel >= 0 && DW.Evo.check(m, T.opts[T.sel]).ok, 'conditions de Greymon non remplies');
  let ouvert = false; const push = DW.Game.push; DW.Game.push = () => { ouvert = true; return Promise.resolve(); };
  try { await T.act(); } finally { DW.Game.push = push; }
  eq(m.sp, 'agumon', 'le Digimon K.O. a digivolué'); yes(!ouvert, "l'écran de Digivolution s'est ouvert");
  m.evolve('greymon'); eq(m.hp, 0, 'K.O. relevé par une Digivolution (objet)'); m.evolve('agumon'); eq(m.hp, 0, 'K.O. relevé par la dé-digivolution');
  m.hp = 1; m.evolve('greymon'); yes(m.hp >= 1 && m.hp <= m.maxHp, 'PV hors bornes');
  // au chargement, les PV restent dans leurs bornes ; une stat affichée vaut au moins 1
  const j = m.toJSON(); j.hp = 99999; eq(DW.Digimon.from(j).hp, m.maxHp, 'PV au-dessus du maximum au chargement');
  const b = new DW.Digimon('botamon', 4); b.raw = { atk: -15, def: -15 }; yes(b.stat('atk') >= 1 && b.stat('def') >= 1, 'stat négative');
});
test("Digimon d'Entraînement : chacun a une technique de son élément ; Koromon, Mochimon, Tokomon et Tsunomon dès le N.1, apprise d'instinct en digivoluant", async () => {
  fresh();
  const elem = (sp, max) => { const d = DW.SPECIES[sp]; return d.learn.some(([l, id]) => l <= max && DW.MOVES[id] && DW.MOVES[id].pow > 0 && d.types.includes(DW.MOVES[id].type)); };
  for (const sp of Object.keys(DW.SPECIES).filter(k => DW.SPECIES[k].stage === 'Entraînement')) yes(elem(sp, 100), `${sp} : aucune technique de son élément`);
  for (const sp of ['koromon', 'motimon', 'tokomon', 'tsunomon']) yes(elem(sp, 1), `${sp} : pas de technique de son élément au N.1`);
  eq(DW.MOVES[DW.SIG.koromon].type, 'Feu', 'coup spécial de Koromon');
  const b = new DW.Digimon('botamon', 5); DW.state.party = [b]; b.evolve('koromon'); await DW.learnEvoMoves(b);
  yes(b.moves.some(x => DW.MOVES[x.id].type === 'Feu'), 'un Koromon né de Botamon ne sait aucune technique de Feu');
});
test("Koromon (lignée de Tai) ne perd plus presque tous ses combats contre les autres Entraînement (N.6, 30 combats chacun)", async () => {
  // (avant : 2 % contre Bukamon, Tanemon et Yokomon, 5 % contre Pyocomon — audit des Digimon, E1)
  const E = Object.keys(DW.SPECIES).filter(k => DW.SPECIES[k].stage === 'Entraînement' && k !== 'koromon'), bilan = [];
  for (const sp of E) {
    let v = 0;
    for (let i = 0; i < 30; i++) {
      fresh(); const k = new DW.Digimon('koromon', 6, { iv: IV7, happy: 60 }); k.disc = 50;
      if (await combatSimule({ enemy: new DW.Digimon(sp, 6, { iv: IV7 }) }, [k], 1000 + i) === 'win') v++;
    }
    bilan.push(`${sp} ${Math.round(v / 0.3)} %`);
    yes(v >= 6, `Koromon ne gagne que ${v} combats sur 30 contre ${sp} (${bilan.join(', ')})`);
  }
});
test('sommeil : un Digimon endormi perd exactement 2 actions (le réveil compte)', async () => {
  fresh();
  const B = new DW.BattleScene({ enemy: new DW.Digimon('agumon', 10), boss: true });
  B.active = new DW.Digimon('gabumon', 10); B.msg = async () => {}; B.sparkle = () => {};
  B.enemy.status = 'slp'; B.enemy.slp = 2;   // (comme après Parfum Soporifique : inflict)
  let agit = 0; B.attackAnim = async () => { agit++; }; B.hitAnim = async () => {}; B.applyDamage = async () => {}; B.center = () => ({ x: 0, y: 0 });
  const impact = DW.Elem.impact; DW.Elem.impact = () => {};
  try { for (let i = 0; i < 3; i++) await B.useMove('e', { id: 'charge' }); } finally { DW.Elem.impact = impact; }
  eq(agit, 1, 'actions jouées sur 3 tours (avant : 2)'); eq(B.enemy.status, null);
});
test("combats : la Lutte toujours proposée en dernier, le dojo d'Elecmon amical, les Bits du plus haut niveau, l'EXP partagée de moitié", async () => {
  fresh();
  // la Lutte : choisie en dernier dans le menu des attaques, même avec des PM pour Garde et Intimidation
  const g = new DW.Digimon('greymon', 40); g.moves = [{ id: 'garde' }, { id: 'grondement' }];
  const B = new DW.BattleScene({ enemy: new DW.Digimon('agumon', 10), boss: true }); B.active = g;
  B.menu = async mode => (mode === 'cmd' ? 0 : g.moves.length);
  const a = await B.playerTurn(); eq(a.type + ':' + a.slot, 'move:-1', 'Lutte non proposée');
  // le dojo d'Elecmon : combat amical (pas « sauvage », pas de fuite, pas de bonus de dégâts des sauvages)
  const D = new DW.BattleScene({ enemy: new DW.Digimon('agumon', 10), amical: true, canLose: true });
  yes(!D.wild && D.label('e') === D.enemy.name, 'le combat du dojo reste « sauvage »');
  // Bits et EXP : un bébé envoyé pour le dernier coup ne multiplie plus les Bits ; un équipier resté au fond gagne la moitié
  const bits = async (lv) => {
    fresh(); const fort = new DW.Digimon('greymon', 30), bebe = new DW.Digimon('botamon', 3), fond = new DW.Digimon('punimon', 3);
    DW.state.party = [fort, bebe, fond]; const W = new DW.BattleScene({ enemy: new DW.Digimon('agumon', 10) });
    W.msg = async () => {}; W.observe = async () => {}; W.parts = new Set([fort, bebe]); W.active = lv === 'bebe' ? bebe : fort;
    const tween = DW.tween, R = Math.random; DW.tween = async () => {}; Math.random = () => 0.99; const x0 = fond.xp, xb = bebe.xp;
    try { await W.giveXp(); } finally { DW.tween = tween; Math.random = R; }
    return { bits: DW.state.bits, fond: fond.xp - x0, bebe: bebe.xp - xb };
  };
  const r1 = await bits('fort'), r2 = await bits('bebe');
  eq(r2.bits, r1.bits, 'les Bits dépendent du Digimon en jeu au K.O.');
  eq(r1.fond, Math.max(1, Math.floor(r1.bebe / 2)), "l'équipier resté au fond gagne autant que celui qui a combattu");
});
test("entraînement « Statistique » : difficulté sur ce qui est entraîné, gain d'au plus ~1,25 fois l'objectif « Digivolution »", () => {
  fresh();
  const T = DW.Training, douze = mode => {
    const m = new DW.Digimon('agumon', 10, { iv: IV7 }); m.abi = 2; const a0 = m.stat('atk'), dif = [];
    for (let i = 0; i < 12; i++) { T.opts = { mode, level: T.LEVELS[2] }; const sc = new DW.TrainingScene(m, 'atk'); dif.push(sc.dif); sc.hits = [2, 2, 2]; m.tired = 0; m.hunger = 0; sc.finish(); }
    return { gain: m.stat('atk') - a0, dif };
  };
  const e = douze('evo'), s = douze('stat');
  yes(s.gain <= e.gain * 1.3, `Statistique +${s.gain}, Digivolution +${e.gain} (avant : +384 contre +83)`);
  yes(s.dif[11] > s.dif[0], 'la difficulté du mode « Statistique » reste figée');
  // une séance ne fait jamais baisser une stat déjà gagnée (anciennes parties, plafond plus haut)
  const m = new DW.Digimon('agumon', 10, { iv: IV7 }); m.raw = { atk: 120 }; const a = m.stat('atk');
  T.opts = { mode: 'stat', level: T.LEVELS[2] }; const sc = new DW.TrainingScene(m, 'atk'); sc.hits = [2, 2, 2]; sc.finish(); eq(m.stat('atk'), a);
});
test('corpulence : nourri à la demande et entraîné 4 fois par jour, il reste léger (formes agiles) sans fermer Greymon', () => {
  fresh();
  const m = new DW.Digimon('biyomon', 12); DW.state.party = [m]; DW.Life.init(m); m.fat = 0;
  // 5 journées : une journée de repas complète (game/care.js : ~1,6 de corpulence) et 4 séances chacune
  // (avant : +0,8 par jour, Birdramon fermé au 4e jour)
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < DW.Care.mealsDay(m); i++) { m.hunger = 30; DW.Care.feed(m, 60); }
    for (let i = 0; i < 4; i++) { DW.Training.opts = { mode: 'evo', level: DW.Training.LEVELS[1] }; const sc = new DW.TrainingScene(m, 'spd'); sc.hits = [1, 1, 1]; m.tired = 0; m.tr.spd = 0; sc.finish(); }
  }
  const r = Math.round(m.fat);
  yes(r <= DW.Evo.options('biyomon').find(o => o.to === 'birdramon').req.fatMax, `Birdramon fermé (corpulence ${m.fat.toFixed(2)})`);
  yes(r >= DW.Evo.options('agumon').find(o => o.to === 'greymon').req.fatMin, `Greymon fermé (corpulence ${m.fat.toFixed(2)})`);
});

// ------------------------------------------------------------ sauvegarde
test("sauvegarde puis chargement : la partie revient à l'identique", () => {
  fresh();
  const st = DW.state; st.flags.starter = 'koromon'; st.bits = 1234; st.bag.viande = 3;
  const m = new DW.Digimon('agumon', 12); m.nick = 'Agu'; m.tr.atk = 7; st.party.push(m); st.owned.agumon = true;
  yes(DW.save(), 'échec de la sauvegarde');
  DW.state = DW.newState();
  yes(DW.load(), 'échec du chargement');
  const L = DW.state, lm = L.party[0];
  eq(L.bits, 1234); eq(L.bag.viande, 3); eq(L.flags.starter, 'koromon'); eq(L.owned.agumon, true);
  eq(lm.sp, 'agumon'); eq(lm.level, 12); eq(lm.nick, 'Agu'); eq(lm.tr.atk, 7); eq(lm.hp, m.hp);
  eq(DW.loadNote, null);
});
test('une espèce disparue ne casse pas le chargement (Digimon mis de côté, puis rendu)', () => {
  fresh();
  DW.state.party.push(new DW.Digimon('agumon', 10), new DW.Digimon('gabumon', 10)); DW.save();
  const raw = JSON.parse(store.get(SAVE));
  raw.party[1].sp = 'espece_supprimee'; raw.party[0].moves.push({ id: 'technique_supprimee' });
  store.set(SAVE, JSON.stringify(raw));
  yes(DW.load(), 'échec du chargement');
  eq(DW.state.party.length, 1); eq(DW.state.orphans.length, 1); yes(DW.loadNote, 'pas de message au joueur');
  yes(DW.state.party[0].moves.every(mv => DW.MOVES[mv.id]), 'technique inconnue gardée');
  // l'espèce revient dans une version suivante : le Digimon est rendu
  DW.SPECIES.espece_supprimee = DW.SPECIES.gabumon; DW.save();
  try { DW.load(); eq(DW.state.orphans.length, 0); eq(DW.state.box.length, 1); }
  finally { delete DW.SPECIES.espece_supprimee; }
});
test("sauvegarde illisible : la précédente est chargée, l'illisible est gardée à part", () => {
  fresh();
  DW.state.party.push(new DW.Digimon('agumon', 10)); DW.state.bits = 111; DW.save();
  DW.state.bits = 222; DW.save();
  store.set(SAVE, '{ pas du JSON');
  yes(quiet(DW.load), 'la copie précédente aurait dû être chargée');
  eq(DW.state.bits, 111); yes(DW.loadNote, 'pas de message au joueur');
  eq(store.get(SAVE + '_illisible'), '{ pas du JSON');
});
test('aucune sauvegarde lisible : DW.load() renvoie false sans rien effacer', () => {
  fresh();
  store.set(SAVE, 'cassé');
  eq(quiet(DW.load), false);
  eq(store.get(SAVE), 'cassé');
});
test('migration v2 → v3 : « caught » devient « owned », les PP disparaissent', () => {
  fresh();
  const old = { ...DW.newState(), v: 2, caught: { agumon: true }, party: [new DW.Digimon('agumon', 6).toJSON()] };
  delete old.owned; old.party[0].moves = old.party[0].moves.map(mv => ({ ...mv, pp: 10 }));
  store.set(SAVE, JSON.stringify(old));
  yes(DW.load()); eq(DW.state.owned.agumon, true); eq('caught' in DW.state, false); eq(DW.state.v, DW.SAVE_V);
  yes(DW.state.party[0].moves.every(mv => !('pp' in mv)), 'PP conservés');
});

test('migration v3 → v4 : positions sur les cartes agrandies ×2', () => {
  fresh();
  const old = { ...DW.newState(), v: 3, map: 'village', x: 20, y: 16, heal: { map: 'clairiere', x: 9, y: 9 }, poops: { plage: [[10, 10]] }, party: [new DW.Digimon('agumon', 6).toJSON()] };
  store.set(SAVE, JSON.stringify(old));
  yes(DW.load()); eq(DW.state.x, 40); eq(DW.state.y, 32); eq(DW.state.heal.x, 18); eq(DW.state.poops.plage[0][0], 20);
});
test('arrivées vers les cartes agrandies converties une seule fois', () => {
  const m = DW.getMap('maison'), w = m.warps.find(w => w.to === 'village');
  eq(w.tx, 38); eq(w.ty, 12);
  DW.getMap('maison'); eq(w.tx, 38);
});
// (chaque étape de la génération qui remplace les lignes passe par DW.MapKit.changerLignes : sinon les étapes suivantes
//  et le décor se refaisaient à chaque préparation, et une carte voisine préparée en fond n'était jamais finie)
test('préparer de nouveau une carte ne la change pas (lignes, décor, panneaux)', () => {
  for (const id of ['lac1', 'montagne9', 'volcan1', 'clairiere', 'plage', 'village', 'gym']) {
    const m = DW.preparerCarte(id), rows = m.rows, n = m.objects.length, s = Object.keys(m.signs || {}).length;
    DW.preparerCarte(id);
    yes(m.rows === rows, id + ' : lignes refaites'); eq(m.objects.length, n, id + ' : objets'); eq(Object.keys(m.signs || {}).length, s, id + ' : panneaux');
  }
});
test('un commerce qui grandit avec la ville prend sa nouvelle taille (sinon sa sortie était hors de la carte)', () => {
  const lv = DW.Town.level;
  try {
    for (const id of ['bazar_in', 'resto_in', 'dojo_in', 'serre_in']) for (const L of [0, 5, 8, 0]) {
      DW.Town.level = () => L;
      const m = DW.preparerCarte(id);
      eq(m.w + 'x' + m.h, m.rows[0].length + 'x' + m.rows.length, `${id} au niveau ${L}`);
      yes(m.warps.every(w => w.x < m.w && w.y < m.h), `${id} au niveau ${L} : sortie hors de la carte`);
    }
  } finally { DW.Town.level = lv; }
});
test('maladie : jamais au hasard, seulement par accumulation de négligences', () => {
  fresh();
  const m = new DW.Digimon('agumon', 6); DW.state.party = [m]; DW.state.clock = 12 * 60; m.slept = DW.state.clock;
  const r = Math.random; Math.random = () => 0;   // le pire tirage possible
  try {
    for (let i = 0; i < 48; i++) DW.Life.health(m, 30);   // 24 h bien soigné
    eq(!!m.sick, false); eq(m.germs, 0);
    DW.state.poops = { village: [[1, 1], [2, 2], [3, 3], [4, 4]] }; m.hunger = 100;
    for (let i = 0; i < 24 && !m.sick; i++) DW.Life.health(m, 30);
    yes(!!m.sick, 'jamais malade malgré les négligences');
  } finally { Math.random = r; DW.state.poops = {}; }
});

test('échelle Digimon World : PV/PM en centaines-milliers (max 9999), stats ≤ 999, PM entraînables', () => {
  const a = new DW.Digimon('agumon', 12);
  yes(a.maxHp >= 300 && a.maxHp <= 2000, 'PV ' + a.maxHp); yes(a.maxMp >= 300, 'PM ' + a.maxMp);
  const z = new DW.Digimon('wargreymon', 100); z.tr = { hp: 64, mp: 64, atk: 64, def: 64, spd: 64, int: 64 };
  yes(z.maxHp <= 9999 && z.maxMp <= 9999 && ['atk', 'def', 'spd', 'int'].every(k => z.stat(k) <= 999));
  const mp0 = a.maxMp; a.tr.mp = 20; yes(a.maxMp > mp0, 'entraînement PM sans effet');
  yes(DW.Training.STATS.mp && DW.World.CH['Ψ'].train === 'mp');
});
test('migration v4 → v5 : PV et PM restants passent à l\'échelle ×20', () => {
  fresh();
  const d = new DW.Digimon('agumon', 12).toJSON(); d.hp = 10; d.mp = 5;
  store.set(SAVE, JSON.stringify({ ...DW.newState(), v: 4, party: [d] }));
  yes(DW.load()); eq(DW.state.party[0].hp, 200); eq(DW.state.party[0].mp, 100);
});

test('écussons : un Ultime exige l\'écusson de sa famille, la Méga les sept ; chaque donjon est relié à sa région', () => {
  fresh();
  const g = new DW.Digimon('greymon', 40); g.tr = { hp: 64, mp: 64, atk: 64, def: 64, spd: 64, int: 64 }; g.wins = 999; g.happy = 100; g.disc = 100;
  const opt = DW.Evo.options('greymon').find(o => o.to === 'metalgreymon');
  const row = () => DW.Evo.check(g, opt).rows.find(r => /Écusson/.test(r.label));
  yes(row() && !row().ok, 'MetalGreymon devrait demander l\'écusson du Courage');
  DW.Crests.give('tai');
  yes(row().ok, 'avec l\'écusson du Courage, la condition est remplie');
  const mega = DW.Evo.options('metalgreymon').find(o => DW.SPECIES[o.to].stage === 'Méga');
  if (mega) { const r = () => DW.Evo.check(g, mega).rows.find(x => /Écussons/.test(x.label)); yes(!r().ok); DW.Crests.ORDER.forEach(k => DW.Crests.give(k)); yes(r().ok); }
  for (const D of DW.Donjons.LIST) {
    const hall = DW.MAPS['donjon_' + D.kid + '_hall'], out = hall.warps.find(w => w.dir === 'down');
    yes(out && DW.MAPS[out.to] && out.to.startsWith(D.region), `donjon ${D.kid} : sortie vers ${out && out.to}`);
    const M = DW.getMap(out.to);
    yes((M.doors || []).some(d => d.to === hall.id || d.to === 'donjon_' + D.kid + '_hall'), `${out.to} : pas de portail vers le donjon de ${D.kid}`);
  }
});

// ------------------------------------------------------------ lancement
// ------------------------------------------------------------ chapitre 1 : cabines, antre de Shellmon, Tai, poids
test("eau salée : la mer (plage, crique, côte de la ville, Pays de Meramon) ne se boit pas, l'eau douce de l'intérieur se boit", () => {
  const S = DW.Paysage.salee;
  const eauDe = (id, f) => { const m = DW.getMap(id); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const c = m.rows[y][x]; if (DW.World.info(c).t === 'water' && DW.SOLID.has(c) && f(x, y, m)) return [m, x, y]; } return null; };
  for (const id of ['plage', 'crique']) { const r = eauDe(id, () => true); yes(r && S(...r) === true, id + ' : la mer est salée'); }
  const cote = eauDe('village', (x, y, m) => x < 3 && y > 20 && m.rows[y][x] !== '≋'); yes(cote && S(...cote) === true, 'côte de la ville : salée');
  const riv = eauDe('village', (x, y, m) => x >= 4 && x <= 7 && y < 25 && m.rows[y][x] === '~'); yes(!riv || S(...riv) === false, 'rivière de la ville : douce');   // (si elle n'a pas été repeinte dans l'éditeur)
  const lac = eauDe('lac0', () => true); yes(lac && S(...lac) === false, 'grand lac : doux');
  const sen = eauDe('sentier', () => true); yes(sen && S(...sen) === false, 'rivière du Sentier : douce');
  const yoko = eauDe('miharashi1', (x, y) => Math.hypot(x - 24, y - 49) < 5); yes(yoko && S(...yoko) === false, 'lac du Village des Yokomon : doux');
  const mer = eauDe('miharashi1', (x, y, m) => x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1); yes(!mer || S(...mer) === true, 'mer du Pays de Meramon : salée');
  const m = DW.getMap('sentier'); yes(S({ ...m, rows: m.rows.map((r, y) => y === 0 ? '≈' + r.slice(1) : r) }, 0, 0) === true, 'eau « mer » peinte : salée');
});
test("cabines de la plage : les mots dans le bon ordre ouvrent l'antre, un mauvais mot remet à zéro", async () => {
  fresh();
  DW.state.hero = 'perso'; DW.state.flags.kuwagamon = true;
  const ow = { shake: 0, load() {} };
  const O = DW.Antre.ORDER;
  await DW.Antre.booth(ow, O[0]); await DW.Antre.booth(ow, O[2]);   // un mot de travers
  yes(!DW.state.flags.shellLair, "l'antre s'ouvre avec une phrase fausse");
  for (const i of O) await DW.Antre.booth(ow, i);
  yes(DW.state.flags.shellLair, "la bonne phrase n'ouvre pas l'antre");
});
test("antre de Shellmon : chaque labyrinthe se traverse de la porte d'entrée à celle de sortie, et les deux sont éloignées", () => {
  for (const id of ['antre1', 'antre_lagune', 'antre2', 'antre_crypte']) {
    const m = DW.MAPS[id], occ = new Set();
    for (const o of m.objects) if (!o.walk) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y);
    const free = (x, y) => m.rows[y] && m.rows[y][x] !== undefined && !DW.SOLID.has(m.rows[y][x]) && !occ.has(x + ',' + y);
    const seen = new Set([m.entry.x + ',' + m.entry.y]), q = [[m.entry.x, m.entry.y]];
    while (q.length) { const [x, y] = q.shift(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + a) + ',' + (y + b); if (!seen.has(k) && free(x + a, y + b)) { seen.add(k); q.push([x + a, y + b]); } } }
    yes(seen.has(m.exitAt.x + ',' + m.exitAt.y), `${id} : sortie inaccessible`);
    yes(Math.abs(m.entry.x - m.exitAt.x) + Math.abs(m.entry.y - m.exitAt.y) > 25, `${id} : les deux portes sont trop proches`);
  }
});
test("antre de Shellmon : galeries → lagune → temple → crypte → Shellmon, et chaque escalier ramène à la carte d'avant", async () => {
  fresh(); DW.state.flags.shellmon = true;   // (porte de la crypte ouverte : son passage est vérifié à part)
  const fade = DW.fade; DW.fade = async () => {};
  try {
    const ORDRE = ['antre1', 'antre_lagune', 'antre2', 'antre_crypte', 'antre_shellmon'];
    const va = async (id, i) => { let to = null; const tr = DW.MAPS[id].triggers[i]; await tr.run({ charger: async t => { to = t; } }); return to; };
    for (let k = 0; k + 1 < ORDRE.length; k++) {
      eq(await va(ORDRE[k], 1), ORDRE[k + 1], ORDRE[k] + ' : porte du fond');
      eq(await va(ORDRE[k + 1], 0), ORDRE[k], ORDRE[k + 1] + " : escalier d'entrée");
    }
  } finally { DW.fade = fade; }
});
test("crypte des gardiens : la porte scellée ne s'ouvre qu'une fois les trois ankhs allumés (dans n'importe quel ordre)", async () => {
  fresh();
  const M = DW.MAPS.antre_crypte, ow = { shake: 0 }, porte = () => M.objects.find(o => o.scellee), passage = M.triggers.find(t => t.cond);
  M.populate();
  yes(!passage.cond(DW.state) && porte().block.length === 3, 'porte ouverte sans ankh');
  await DW.Antre.allumer(ow, 2); await DW.Antre.allumer(ow, 0); await DW.Antre.allumer(ow, 0);
  yes(!passage.cond(DW.state) && porte().block.length === 3, 'porte ouverte avec deux ankhs');
  yes(M.objects.filter(o => o.ankh != null && o.kind === 'tex_grotte_ankh_lumineux').length === 2, 'ankhs allumés mal dessinés');
  await DW.Antre.allumer(ow, 1);
  yes(passage.cond(DW.state) && porte().block.length === 2 && porte().kind === 'tex_grotte_porte_temple', 'porte toujours scellée après les trois ankhs');
  yes(ow.shake > 0, "pas de secousse à l'ouverture");
});
// SOUS LE MONT MIHARASHI (maps/sous_volcan.js) : les cinq cercles de la grotte de Sora
const SV = i => 'sous_volcan' + i;
// cases atteintes à pied depuis l'arrivée (décors, côtés bloqués des portes ; PNJ visibles)
function atteintes(id) {
  const m = DW.preparerCarte(id), occ = new Set();
  for (const o of m.objects) { if (!o.walk) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y); for (const [bx, by] of o.block || []) occ.add((o.x + bx) + ',' + (o.y + by)); }
  for (const n of m.npcs) if (!n.cond || n.cond(DW.state)) occ.add(n.x + ',' + n.y);
  const free = (x, y) => m.rows[y] && m.rows[y][x] !== undefined && !DW.SOLID.has(m.rows[y][x]) && !occ.has(x + ',' + y);
  const seen = new Set([m.entry.x + ',' + m.entry.y]), q = [[m.entry.x, m.entry.y]];
  while (q.length) { const [x, y] = q.shift(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + a) + ',' + (y + b); if (!seen.has(k) && free(x + a, y + b)) { seen.add(k); q.push([x + a, y + b]); } } }
  return seen;
}
test("souterrains du Mont Miharashi : chaque cercle se traverse de l'arrivée à la sortie ; le gros rocher ferme le trésor des foreurs", () => {
  fresh();
  for (let i = 1; i <= 5; i++) {
    const m = DW.MAPS[SV(i)], seen = atteintes(SV(i));
    yes(seen.has(m.exitAt.x + ',' + m.exitAt.y), `${SV(i)} : sortie inaccessible`);
    yes(Math.abs(m.entry.x - m.exitAt.x) + Math.abs(m.entry.y - m.exitAt.y) > 9, `${SV(i)} : l'arrivée et la sortie sont trop proches`);
    for (const t of m.triggers) { let ok = false; for (let x = t.x; x < t.x + (t.w || 1); x++) if (seen.has(x + ',' + t.y)) ok = true; yes(ok, `${SV(i)} : passage inaccessible en ${t.x},${t.y}`); }
  }
  const coffre = DW.MAPS[SV(1)].objects.find(o => o.kind === 'tex_grotte_coffre'), pres = s => [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([a, b]) => s.has((coffre.x + a) + ',' + (coffre.y + b)));
  yes(!pres(atteintes(SV(1))), 'le trésor des foreurs est accessible sans pousser le rocher');
  DW.state.flags.svRocher = true;
  yes(pres(atteintes(SV(1))), 'rocher poussé : le trésor des foreurs reste inaccessible');
});
test("souterrains : la grotte du Mont Miharashi → cercle 1 → 2 → 3 → 4 → 5, et chaque escalier ramène au cercle d'avant", async () => {
  fresh();
  const fade = DW.fade; DW.fade = async () => {};
  try {
    const va = async (id, i) => { let to = null; await DW.MAPS[id].triggers[i].run({ charger: async t => { to = t; } }); return to; };
    eq(await va(SV(1), 0), 'miharashi4', "cercle 1 : l'escalier remonte au pied du mont");
    for (let k = 1; k < 5; k++) {
      eq(await va(SV(k), 1), SV(k + 1), SV(k) + ' : passage du fond');
      eq(await va(SV(k + 1), 0), SV(k), SV(k + 1) + " : escalier d'arrivée");
    }
    // l'entrée : la grotte au pied du Mont Miharashi (posée avec l'image du joueur : absente ici, sans images) ; fermée
    // avant le chapitre 3
    let to = null; const ow = { charger: async t => { to = t; } };
    DW.state.flags.chapter = 2; await DW.SousVolcan.entrer(ow); eq(to, null, 'les souterrains sont ouverts avant le chapitre 3');
    DW.state.flags.chapter = 3; await DW.SousVolcan.entrer(ow); eq(to, SV(1), 'la grotte du Mont Miharashi ne mène pas aux souterrains');
  } finally { DW.fade = fade; }
});
test("sauvetage de Sora : Biyomon seule à la fontaine, Sora au fond ; le gardien vaincu, Sora retrouvée et l'échelle des foreurs ouverte", async () => {
  fresh();
  const f = DW.state.flags; DW.state.hero = 'perso'; f.chapter = 3;
  const V = DW.preparerCarte('miharashi1'), M5 = DW.preparerCarte(SV(5)), vis = (m, k) => m.npcs.filter(n => (n.hero === k || n.sp === k) && (!n.cond || n.cond(DW.state)));
  yes(vis(V, 'biyomon').length === 1 && !vis(V, 'sora').length, 'avant : Biyomon seule à la fontaine');
  yes(vis(M5, 'sora').length === 1 && vis(M5, 'drimogemon').some(n => n.gear), 'avant : Sora prisonnière au fond, le gardien possédé sur le pont');
  yes(!M5.objects.some(o => o.echelle) && !DW.preparerCarte(SV(1)).objects.some(o => o.echelle), "l'échelle des foreurs est là avant le gardien");
  const fade = DW.fade; DW.fade = async () => {};
  try { await DW.SousVolcan.delivrance({ p: { x: 32, y: 31 }, solid: () => false, map: { npcs: [] }, shake: 0 }); } finally { DW.fade = fade; }
  yes(f.soraMet && f.svGardien, 'après le gardien : Sora pas retrouvée');
  yes(!vis(M5, 'sora').length && vis(V, 'sora').length === 1 && vis(V, 'biyomon').length === 1, 'après : Sora et Biyomon pas réunies à la fontaine');
  yes(DW.preparerCarte(SV(5)).objects.some(o => o.echelle) && DW.preparerCarte(SV(1)).objects.some(o => o.echelle), "l'échelle des foreurs ne s'ouvre pas");
  yes(!vis(M5, 'drimogemon').some(n => n.gear), 'le gardien est toujours possédé');
});
test("périls des souterrains : un rocher coûte des PV sans K.O., les gravats bloquent un moment, un partenaire à bout de forces s'évanouit", async () => {
  fresh();
  const m = new DW.Digimon('agumon', 20); DW.state.party = [m];
  const M = DW.preparerCarte(SV(1)), P = { x: 30, y: 40, tx: 30, ty: 40, moving: false, t: 0 }, F = { x: 31, y: 40, tx: 31, ty: 40 };
  let to = null;
  const ow = { map: M, mapId: SV(1), gfx: { solid: new Set() }, p: P, f: F, locked: false, shake: 0, t: 0, partner: m,
    npcAt: () => null, solid: () => false, falaise: () => false, pos: e => ({ x: e.x, y: e.y }), camera: () => ({ cx: 0, cy: 0 }),
    runScript: async fn => fn(ow), forceStep: async () => {}, charger: async (id, x, y) => { to = [id, x, y]; } };
  const fade = DW.fade, wait = DW.wait; DW.fade = async () => {}; DW.wait = async () => {};
  try {
    DW.Perils.entree(ow); const S = DW.Perils.etat(M); S.grace = 0;
    S.chutes.push({ x: 30, y: 40, t: 2, k: 'rocher' }); DW.Perils.update(ow, 0.01); await DW.wait();
    yes(m.hp < m.maxHp && m.hp >= 1, 'le rocher ne fait pas perdre de PV (ou met K.O.)');
    S.grace = 0; S.chutes.push({ x: 34, y: 40, t: 2, k: 'rocher' }); DW.Perils.update(ow, 0.01);
    yes(DW.Perils.bloque(ow, 34, 40), 'pas de gravats après la chute');
    DW.Perils.update(ow, 12); yes(!DW.Perils.bloque(ow, 34, 40), 'les gravats ne s\'effritent pas');
    m.hp = 1; S.grace = 0; S.chutes.push({ x: 30, y: 40, t: 2, k: 'rocher' }); DW.Perils.update(ow, 0.01);
    for (let i = 0; i < 5 && !to; i++) await new Promise(r => setTimeout(r, 0));
    yes(m.hp === 1, 'un partenaire à bout de forces tombe K.O. au lieu de s\'évanouir');
    yes(to && to[0] === SV(1) && to[1] === M.entry.x && to[2] === M.entry.y, "évanoui : pas ramené au début du cercle");
  } finally { DW.fade = fade; DW.wait = wait; }
});
test("Shellmon : Tai et son Digimon (devenu Greymon) rejoignent le combat au seuil prévu par le jeu et frappent seuls (tour par tour)", async () => {
  fresh();
  // (la vraie configuration du combat, celle du PNJ Shellmon de maps/antre.js : avant, le test recopiait « à mi-vie »,
  //  alors que Tai n'arrive qu'à 35 % des PV de Shellmon)
  DW.state.hero = 'perso'; DW.state.party = [new DW.Digimon('agumon', 15)];
  let o = null; await DW.MAPS.antre_shellmon.npcs.find(n => n.sp === 'shellmon').talk({ battle: async x => { o = x; return 'lose'; }, bossDefeat: async () => {} });
  yes(o && o.ally && o.ally.at > 0 && o.ally.at < 1, 'pas d\'allié dans le combat de Shellmon');
  const B = new DW.BattleScene(o), at = o.ally.at;
  B.active = DW.state.party[0];
  B.msg = async () => {}; B.sparkle = () => {}; B.checkFaints = async () => null;
  B.applyDamage = async (side, d) => { B.enemy.hp = Math.max(0, B.enemy.hp - d); };
  const push = DW.Game.push; DW.Game.push = () => Promise.resolve();   // (sa Digivolution en Greymon, à son arrivée)
  try {
    B.enemy.hp = Math.ceil(B.enemy.maxHp * (at + 0.05)); await B.allyTurn(); yes(!B.allyMon, `l'allié arrive avant ${Math.round(at * 100)} % des PV`);
    B.enemy.hp = Math.floor(B.enemy.maxHp * (at - 0.05)); await B.allyTurn(); yes(B.allyMon && B.allyMon.sp === 'greymon', 'Greymon ne rejoint pas le combat');
    const hp = B.enemy.hp; await B.allyTurn(); yes(B.enemy.hp < hp, "l'allié ne frappe pas");
  } finally { DW.Game.push = push; }
});
test('Tai délivré : sa chambre apparaît à l’étage de ta maison (escalier dans le salon), et il ne reste pas chez Jijimon', () => {
  fresh();
  DW.state.hero = 'perso';
  const M = DW.MAPS.maison_joueur; M.version = null; M.build();
  yes(!M.warps.some(w => w.to === 'maison_joueur_tai'), 'chambre de Tai avant sa libération');
  DW.Crests.freeKid('tai'); M.version = null; M.build();
  // (les chambres des enfants sont à l'étage : un escalier apparaît dans le salon)
  yes(M.doors.some(d => d.to === 'maison_joueur_etage'), "pas d'escalier vers l'étage");
  const E = DW.MAPS.maison_joueur_etage; E.version = null; E.build();
  yes(E.doors.some(d => d.to === 'maison_joueur_tai'), 'pas de porte vers la chambre de Tai (couloir de l’étage)');
  const atJiji = DW.MAPS.maison.npcs.find(n => n.hero === 'tai');
  yes(!atJiji || !atJiji.cond(DW.state), 'Tai attend encore chez Jijimon');
});
test('Sora délivrée : sa chambre à l’étage (avec Biyomon), et elle ne reste pas chez Jijimon', () => {
  fresh();
  DW.state.hero = 'perso';
  DW.Crests.freeKid('sora');
  const E = DW.MAPS.maison_joueur_etage; E.version = null; E.build();
  yes(E.doors.some(d => d.to === 'maison_joueur_sora'), 'pas de porte vers la chambre de Sora (couloir de l’étage)');
  const R = DW.preparerCarte('maison_joueur_sora');
  yes(R.npcs.some(n => n.hero === 'sora') && R.npcs.some(n => n.sp === 'biyomon'), 'Sora et Biyomon absents de sa chambre');
  const atJiji = DW.MAPS.maison.npcs.find(n => n.hero === 'sora');
  yes(!atJiji || !atJiji.cond(DW.state), 'Sora attend encore chez Jijimon');
});
test('Journal : chaque onglet et chaque région se dessinent sans erreur (début, chapitre 4, 12 Engrenages)', () => {
  fresh();
  const c = fakeCanvas().getContext('2d'), s = DW.state;
  const etats = [() => {}, () => { s.flags.chapter = 4; s.flags.meramon = true; s.gears.miharashi = true; s.visited.miharashi4 = s.visited.lac0 = true; },
    () => { for (const r of ['montagne', 'lac', 'brumes', 'marais', 'savane', 'miharashi', 'usine', 'decharge', 'tunnel', 'jouets', 'canyon', 'scarabees']) s.gears[r] = s.visited[r + '0'] = true; }];
  for (const f of etats) { f(); const J = new DW.Story.JournalScene(); for (J.tab = 0; J.tab < 3; J.tab++) for (J.i = 0; J.i < 16; J.i++) J.draw(c); }
});
test('renaissance et dé-digivolution : le vrai chemin du Digimon, sinon la lignée de l’animé (Gabumon ← Tsunomon ← Punimon)', () => {
  fresh();
  const chemin = (...sps) => { const m = new DW.Digimon(sps[0], 10); for (const sp of sps.slice(1)) m.evolve(sp); return m; };
  eq(DW.Life.babyOf(chemin('punimon', 'tsunomon', 'gabumon', 'garurumon')), 'punimon', 'Garurumon de Matt');
  eq(DW.Life.babyOf(chemin('pabumon', 'motimon', 'tentomon')), 'pabumon', 'Tentomon d’Izzy');
  const g = chemin('botamon', 'koromon', 'gabumon');
  eq(DW.Life.babyOf(g), 'botamon', 'Gabumon venu de Koromon'); eq(DW.Evo.prev1(g.sp, g.parcours), 'koromon', 'sa forme précédente');
  g.evolve('koromon'); eq(g.parcours.join(), 'botamon', 'parcours après la dé-digivolution');
  for (const [sp, bebe] of [['gabumon', 'punimon'], ['tentomon', 'pabumon'], ['patamon', 'poyomon'], ['angemon', 'poyomon'], ['greymon', 'botamon']]) eq(DW.Life.babyOf(new DW.Digimon(sp, 20)), bebe, sp + ' sans passé');
  eq(DW.Digimon.from(JSON.parse(JSON.stringify(chemin('poyomon', 'tokomon', 'patamon')))).parcours.join(), 'poyomon,tokomon', 'parcours sauvegardé');
});
test('cuisine : Mushroomon propose une recette dont on peut trouver les ingrédients (la Brochette attend le Piment de Meramon)', async () => {
  fresh();
  const has = DW.Town.has;
  try {
    DW.state.recipes = { grillade: true };
    DW.Town.has = id => ['gotsumon', 'mushroomon'].includes(id);
    await DW.Cuisine.mushroomQuest(); eq(DW.state.flags.recipeQuest, 'soupe', 'sans Meramon en ville');
    DW.Town.has = id => ['gotsumon', 'mushroomon', 'meramon'].includes(id); delete DW.state.flags.recipeQuest;
    await DW.Cuisine.mushroomQuest(); eq(DW.state.flags.recipeQuest, 'brochette', 'avec Meramon en ville');
  } finally { DW.Town.has = has; }
});
test('quêtes annexes : les Bukamon égarés (chapitre 2), la soif des Yokomon et le trésor de l’épave (chapitre 3)', async () => {
  fresh();
  const s = DW.state; s.hero = 'perso'; s.flags.starter = 'agumon'; s.flags.chapter = 2; s.flags.monoCh2 = true;
  // un faux Overworld : la carte préparée, ses obstacles, puis les personnages posés à l'arrivée (histoire, quêtes)
  const arriver = (id, x, y) => {
    const m = DW.preparerCarte(id), solid = new Set();
    for (const o of m.objects) if (!o.walk && !o.top) for (let yy = 0; yy < (o.h || 1); yy++) for (let xx = 0; xx < (o.w || 1); xx++) solid.add((o.x + xx) + ',' + (o.y + yy));
    const ow = Object.create(DW.Overworld.prototype);
    if (x == null) [x, y] = m.spec ? m.spec.hub : [m.w >> 1, m.h >> 1];
    Object.assign(ow, { map: m, mapId: id, wilds: [], gfx: { solid, objs: [] }, p: { x, y, dir: 'down', moving: false, sx: x, sy: y, tx: x, ty: y } });
    DW.Story.decorate(ow); DW.Quetes.decorate(ow); return ow;
  };
  const pnj = (ow, sp) => ow.map.npcs.find(n => n.sp === sp && (!n.cond || n.cond(s)));
  let ow = arriver('lac0'); const g = pnj(ow, 'gomamon'); yes(g, 'pas de Gomamon sur la Rive Sud'); await g.talk(ow); eq(s.flags.bukaQuete, 1, 'quête acceptée');
  for (const id of ['lac1', 'lac4', 'lac6']) { ow = arriver(id); const b = pnj(ow, 'bukamon'); yes(b, `pas de Bukamon sur ${id}`); await b.talk(ow); }
  const bits = s.bits; ow = arriver('lac0'); await pnj(ow, 'gomamon').talk(ow); eq(s.flags.bukaQuete, 2, 'quête terminée'); yes(s.bits > bits, 'pas de récompense');
  s.flags.chapter = 3; s.bag.eau_fraiche = 1;
  ow = arriver('miharashi0'); const y = pnj(ow, 'yokomon'); yes(y, "pas de Yokomon à l'oasis"); await y.talk(ow); yes(s.flags.yokoSoif && !s.bag.eau_fraiche, 'Yokomon pas secouru');
  s.flags.meramon = true;
  const V = DW.preparerCarte('miharashi1'), c = V.objects.find(o => o.epave); yes(c, "pas de coffre dans l'épave");
  // le coffre est atteignable depuis le carrefour du village (passage de planches)
  const occ = new Set(); for (const o of V.objects) if (!o.walk) for (let yy = o.y; yy < o.y + (o.h || 1); yy++) for (let xx = o.x; xx < o.x + (o.w || 1); xx++) occ.add(xx + ',' + yy);
  const free = (x2, y2) => V.rows[y2] && V.rows[y2][x2] !== undefined && !DW.SOLID.has(V.rows[y2][x2]) && !occ.has(x2 + ',' + y2);
  const [hx, hy] = V.spec.hub, seen = new Set([hx + ',' + hy]), q = [[hx, hy]];
  while (q.length) { const [x2, y2] = q.shift(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x2 + a) + ',' + (y2 + b); if (!seen.has(k) && free(x2 + a, y2 + b)) { seen.add(k); q.push([x2 + a, y2 + b]); } } }
  yes([[0, 1], [1, 0], [-1, 0], [0, -1]].some(([a, b]) => seen.has((c.x + a) + ',' + (c.y + b))), "coffre de l'épave inaccessible");
});
test("poids : un repas fait grossir, un combat fait à peine maigrir (on peut atteindre les Digivolutions « costaudes »)", () => {
  fresh();
  const m = new DW.Digimon('agumon', 12); DW.state.party = [m]; DW.Life.init(m); m.fat = 0;
  // une journée de repas (8 pour un Disciple, game/care.js) fait prendre du poids
  for (let i = 0; i < DW.Care.mealsDay(m); i++) { m.hunger = 30; DW.Care.feed(m, 60); }
  yes(m.fat >= 1, `une journée de repas ne fait presque pas grossir (${m.fat})`);
  const f0 = m.fat; for (let i = 0; i < 20; i++) DW.Life.addFat(m, -0.02);
  yes(f0 - m.fat <= 1.01, 'vingt combats font trop maigrir');
});
test("Meramon sans Sora : un seul coup laisse ton Digimon à 1 PV, et tu prends la fuite", async () => {
  fresh();
  const B = new DW.BattleScene({ enemy: new DW.Digimon('meramon', 30), boss: true, ecrasant: { textes: ['Il faut fuir !'] } });
  B.active = new DW.Digimon('agumon', 15);
  B.msg = async () => {}; B.attackAnim = async () => {}; B.hitAnim = async () => {};
  B.applyDamage = async (side, d) => { B.active.hp -= d; };
  const r = await B.ecrasement(B.o.ecrasant);
  yes(r === 'run', `le combat ne se termine pas par la fuite (${r})`);
  yes(B.active.hp === 1, `il reste ${B.active.hp} PV au lieu de 1`);
});
test("Corniches de l'Abîme : l'éruption s'annonce à la première arrivée ; partir à temps l'évite, puis la lave revient de temps en temps", () => {
  fresh();
  DW.state.flags.chapter = 3;
  const m2 = DW.preparerCarte('sous_volcan2'), m1 = DW.preparerCarte('sous_volcan1');
  yes(m2.eruption && m2.eruption.coulees.length >= 10, "pas de coulées prévues pour l'éruption");
  DW.Perils.compte = null;
  DW.Perils.entree({ map: m2 });
  yes(DW.Perils.compte && DW.Perils.compte.t === 15, 'pas de compte à rebours de 15 secondes');
  DW.Perils.entree({ map: m1 });
  yes(DW.state.flags.svEruption === 'evitee', "partir des corniches n'évite pas l'éruption");
  DW.Perils.entree({ map: m2 });
  yes(!DW.Perils.compte, 'le compte à rebours recommence à chaque visite');
  yes(DW.Lave.etat(m2).coulees.length >= 10, "le volcan ne reste pas en colère (pas de coulées) après l'éruption");
});
test("lignées de la série (données par le joueur) : chaque enfant suit la sienne, et WarGreymon + MetalGarurumon fusionnent en Omegamon", () => {
  fresh();
  const suit = (sp, ...apres) => { for (const to of apres) { yes(DW.Evo.options(sp).some(e => e.to === to), `${sp} ne peut pas devenir ${to}`); sp = to; } };
  suit('botamon', 'koromon', 'agumon', 'greymon', 'metalgreymon', 'wargreymon', 'omegamon'); suit('greymon', 'skullgreymon');
  suit('punimon', 'tsunomon', 'gabumon', 'garurumon', 'weregarurumon', 'metalgarurumon', 'omegamon');
  suit('nyokimon', 'pyocomon', 'biyomon', 'birdramon', 'garudamon'); suit('pabumon', 'motimon', 'tentomon', 'kabuterimon', 'megakabuterimon');
  suit('poyomon', 'tanemon', 'palmon', 'togemon', 'lillymon'); suit('pichimon', 'bukamon', 'gomamon', 'ikkakumon', 'zudomon');
  suit('poyomon', 'tokomon', 'patamon', 'angemon', 'magnaangemon'); suit('yukimibotamon', 'nyaromon', 'salamon', 'gatomon', 'angewomon', 'ophanimon'); suit('angewomon', 'magnadramon');
  // (Mimi et T.K. ont le même bébé : la lignée choisie à la création décide du partenaire)
  DW.state.hero = 'perso'; DW.state.look = { baby: 'poyomon', ligne: 'tk' }; yes(DW.heroLine().partner === 'patamon', 'T.K. : pas Patamon');
  DW.state.look = { baby: 'poyomon', ligne: 'mimi' }; yes(DW.heroLine().partner === 'palmon', 'Mimi : pas Palmon');
  DW.state.look = { baby: 'yuramon' }; yes(DW.heroLine().partner === 'palmon', 'ancienne partie de Mimi (Yuramon) : pas Palmon');
  // fusion : seulement avec MetalGarurumon dans l'équipe
  const W = new DW.Digimon('wargreymon', 60), o = DW.Evo.options('wargreymon').find(e => e.to === 'omegamon');
  DW.state.party = [W];
  yes(!DW.Evo.partenaireFusion(W, o), 'fusion possible sans MetalGarurumon');
  const MG = new DW.Digimon('metalgarurumon', 60); DW.state.party.push(MG);
  yes(DW.Evo.partenaireFusion(W, o) === MG, "MetalGarurumon de l'équipe pas trouvé pour la fusion");
  yes(DW.Evo.check(W, o).rows.some(r => r.label === 'Avec MetalGarurumon' && r.ok), 'la condition de fusion ne se coche pas');
});

// (une attente qui ne se termine jamais — une animation attendue sans boucle de jeu — vidait la file de Node : la suite
//  s'arrêtait en silence avec le code 0, comme une réussite)
let enCours = null, fini = false;
process.on('exit', () => { if (!fini) { console.log(`  ÉCHEC  ${enCours || '(avant le premier test)'}\n        la suite s'est arrêtée avant la fin : une attente qui ne se termine jamais (animation attendue, promesse jamais résolue)`); process.exitCode = 1; } });
(async () => {
  for (const [name, fn] of tests) {
    if (process.env.SEUL && !name.includes(process.env.SEUL)) continue;   // SEUL=texte : seulement les tests dont le nom le contient
    enCours = name;
    const t0 = Date.now(); try { await fn(); ok++; console.log('  OK  ' + name + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)'); }
    catch (e) { ko++; console.log('  ÉCHEC  ' + name + '\n        ' + (e && e.message) + (process.env.PILE ? '\n' + e.stack : '')); }   // PILE=1 : détail de l'erreur
  }
  fini = true;
  console.log(`\n${ok} réussi(s), ${ko} échoué(s)`);
  process.exit(ko ? 1 : 0);
})();
