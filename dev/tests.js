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
  };
  return new Proxy(base, { get: (o, k) => (k in o ? o[k] : stub), set: (o, k, v) => ((o[k] = v), true) });
}
function fakeCanvas() { const c = { width: 1, height: 1, style: {}, getContext: () => { const x = fakeCtx(); x.canvas = c; return x; } }; return c; }
const store = new Map();
const sandbox = {
  console, Math, JSON, Date, Promise, Set, Map, WeakMap, Symbol, Proxy, Reflect, Error, TypeError, Object, Array, String, Number, Boolean, RegExp,
  Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Int32Array, Uint32Array, Int16Array, Uint16Array, ArrayBuffer, Intl,
  parseInt, parseFloat, isNaN, isFinite, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {},
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 0,
  innerWidth: 960, innerHeight: 720,
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
  matchMedia: () => ({ matches: false }),
  navigator: {},
  ImageData: class { constructor(d, w, h) { this.data = d; this.width = w; this.height = h; } },
  Event: class { constructor(t) { this.type = t; } },
  localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  document: {
    getElementById: () => fakeCanvas(),
    createElement: t => (t === 'canvas' ? fakeCanvas() : { style: {}, appendChild() {}, addEventListener() {}, classList: { add() {} } }),
    addEventListener: () => {}, body: { appendChild() {}, classList: { add() {}, toggle() {} } }, head: { appendChild() {} }, fonts: null,
  },
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const LIST = require(path.join(ROOT, 'js', 'scripts.js'));
for (const f of LIST) {
  if (f === 'main.js') continue;
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), sandbox, { filename: 'js/' + f });
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
test('js/scripts.js liste tous les fichiers du jeu, et seulement eux', () => {
  const js = path.join(ROOT, 'js');
  const onDisk = srcFiles(js).map(f => path.relative(js, f).split(path.sep).join('/')).filter(f => f !== 'scripts.js');
  const missing = onDisk.filter(f => !LIST.includes(f)), extra = LIST.filter(f => !onDisk.includes(f));
  yes(!missing.length, 'absents de la liste : ' + missing.join(', '));
  yes(!extra.length, 'listés mais introuvables : ' + extra.join(', '));
  eq(new Set(LIST).size, LIST.length, 'doublons dans la liste');
});
test('aucune page HTML ne recopie la liste des scripts', () => {
  for (const f of ['index.html', 'dev/check.html', 'dev/gallery.html']) {
    const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    yes(/scripts\.js/.test(s), f + ' ne charge pas js/scripts.js');
    yes(!/js\/(engine|game|gfx|ui|maps|data)\//.test(s), f + ' charge encore des scripts à la main');
  }
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

// ------------------------------------------------------------ lancement
(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); ok++; console.log('  OK  ' + name); }
    catch (e) { ko++; console.log('  ÉCHEC  ' + name + '\n        ' + (e && e.message)); }
  }
  console.log(`\n${ok} réussi(s), ${ko} échoué(s)`);
  process.exit(ko ? 1 : 0);
})();
