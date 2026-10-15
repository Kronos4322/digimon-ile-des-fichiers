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

test('fins de ligne Unix (LF) partout : jamais de CRLF (règle du projet)', () => {
  const files = [...srcFiles(path.join(ROOT, 'js')), ...srcFiles(path.join(ROOT, 'dev'))];
  const bad = files.filter(f => fs.readFileSync(f, 'utf8').includes(String.fromCharCode(13))).map(f => path.relative(ROOT, f));
  yes(!bad.length, 'fichiers en CRLF (à normaliser) : ' + bad.join(', '));
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

// ------------------------------------------------------------ combat en arène (game/arena.js)
// arène sans carte (noMap) ; les effets visuels sont remplacés par une attente nulle
const arena = (pSp = 'agumon', eSp = 'palmon', lv = 15) => {
  fresh();
  const P = new DW.Digimon(pSp, lv), E = new DW.Digimon(eSp, lv);
  DW.state.party = [P];
  const A = new DW.ArenaScene({ enemy: E, noMap: true });
  A.active = P; A.live = true; A.mode = 'live'; A.hpShow = { p: P.hp, e: E.hp };
  return { A, P, E };
};
// (sans écran : les effets visuels ne durent rien, les sprites ont une taille fixe)
const noFx = async fn => {
  const f = DW.playFXAt, p = DW.playFX, sb = DW.Sprites.battle, sp = DW.Sprites.pose;
  DW.playFXAt = async () => {}; DW.playFX = async () => {}; DW.Sprites.battle = DW.Sprites.pose = () => ({ w: 60, h: 60 });
  try { return await fn(); } finally { DW.playFXAt = f; DW.playFX = p; DW.Sprites.battle = sb; DW.Sprites.pose = sp; }
};
const firstMove = (cond) => Object.keys(DW.MOVES).find(id => cond(DW.MOVES[id]));
test('arène : chaque technique a une portée (corps à corps, proche, loin, terrain, sur soi)', () => {
  const S = DW.ArenaScene.shapeOf;
  eq(S(DW.MOVES[firstMove(m => m.contact && m.pow > 0)]), 'melee');
  eq(S(DW.MOVES[firstMove(m => m.fx === 'wave' && m.pow > 0)]), 'field');
  eq(S(DW.MOVES[firstMove(m => m.heal && !m.pow)]), 'self');
  for (const id in DW.MOVES) yes(['melee', 'near', 'far', 'field', 'self'].includes(S(DW.MOVES[id])), 'portée inconnue : ' + id);
});
test("arène : une attaque à distance touche la cible restée dans la zone visée, et rate si elle en est sortie", async () => {
  const far = firstMove(m => m.pow > 0 && !m.contact && DW.ArenaScene.shapeOf(m) === 'far' && (m.acc || 100) >= 90);
  await noFx(async () => {
    // touché : la cible ne bouge pas
    let { A, E } = arena();
    await withRandom(0.6, async () => { A.startCast('p', { id: far }); await A.release('p'); });
    yes(E.hp < E.maxHp, "la cible restée sur place n'a pas été touchée");
    // raté : la cible part à l'autre bout du terrain après la visée
    ({ A, E } = arena());
    await withRandom(0.6, async () => {
      A.startCast('p', { id: far });
      const F = DW.ArenaScene.FIELD; A.B.e.x = A.B.e.x > (F.x0 + F.x1) / 2 ? F.x0 + 2 : F.x1 - 2; A.B.e.y = A.B.e.y > (F.y0 + F.y1) / 2 ? F.y0 + 2 : F.y1 - 2;
      await A.release('p');
    });
    eq(E.hp, E.maxHp, 'la cible sortie de la zone a quand même été touchée');
  });
});
test("arène : pendant que le joueur choisit dans la roue, l'ennemi continue d'agir", async () => {
  await noFx(async () => {
    const { A } = arena();
    A.mode = 'acmd'; A.sub = 'wheel'; A.B.e.cd = 0.2;
    for (let i = 0; i < 20 && !A.B.e.cast; i++) A.update(0.05);
    yes(!!A.B.e.cast, "l'ennemi n'a rien lancé pendant le menu");
    eq(A.mode, 'acmd', 'le menu a été fermé');
  });
});
test("arène : l'ennemi vaincu termine le combat (victoire)", async () => {
  await noFx(async () => {
    const { A, E } = arena('agumon', 'palmon', 30);
    let result = null; A.endR = r => { result = r; };
    E.hp = 1;
    const far = firstMove(m => m.pow > 0 && !m.contact && DW.ArenaScene.shapeOf(m) === 'far' && (m.acc || 100) >= 90);
    await withRandom(0.6, async () => { A.startCast('p', { id: far }); await A.release('p'); });
    eq(result, 'win'); yes(!A.live, "le combat continue après la victoire");
  });
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
  for (const id of ['antre1', 'antre2']) {
    const m = DW.MAPS[id], occ = new Set();
    for (const o of m.objects) if (!o.walk) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y);
    const free = (x, y) => m.rows[y] && m.rows[y][x] !== undefined && !DW.SOLID.has(m.rows[y][x]) && !occ.has(x + ',' + y);
    const seen = new Set([m.entry.x + ',' + m.entry.y]), q = [[m.entry.x, m.entry.y]];
    while (q.length) { const [x, y] = q.shift(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + a) + ',' + (y + b); if (!seen.has(k) && free(x + a, y + b)) { seen.add(k); q.push([x + a, y + b]); } } }
    yes(seen.has(m.exitAt.x + ',' + m.exitAt.y), `${id} : sortie inaccessible`);
    yes(Math.abs(m.entry.x - m.exitAt.x) + Math.abs(m.entry.y - m.exitAt.y) > 25, `${id} : les deux portes sont trop proches`);
  }
});
test("Shellmon : Tai et son Digimon (devenu Greymon) rejoignent le combat à mi-vie et frappent seuls (tour par tour)", async () => {
  fresh();
  const B = new DW.BattleScene({ enemy: new DW.Digimon('shellmon', 16), boss: true, ally: { at: 0.5, sp: 'greymon', lvl: 16, move: 'mega_flamme' } });
  B.active = new DW.Digimon('agumon', 15);
  B.msg = async () => {}; B.sparkle = () => {}; B.checkFaints = async () => null;
  B.applyDamage = async (side, d) => { B.enemy.hp = Math.max(0, B.enemy.hp - d); };
  await B.allyTurn(); yes(!B.allyMon, "l'allié arrive avant la moitié des PV");
  B.enemy.hp = Math.floor(B.enemy.maxHp * 0.45);
  await B.allyTurn(); yes(B.allyMon && B.allyMon.sp === 'greymon', "Greymon ne rejoint pas le combat");
  const hp = B.enemy.hp; await B.allyTurn(); yes(B.enemy.hp < hp, "l'allié ne frappe pas");
});
test('Tai délivré : sa chambre apparaît dans ta maison (porte du salon), et il ne reste pas chez Jijimon', () => {
  fresh();
  DW.state.hero = 'perso';
  const M = DW.MAPS.maison_joueur; M.version = null; M.build();
  yes(!M.warps.some(w => w.to === 'maison_joueur_tai'), 'chambre de Tai avant sa libération');
  DW.Crests.freeKid('tai'); M.version = null; M.build();
  yes(M.warps.some(w => w.to === 'maison_joueur_tai'), 'pas de porte vers la chambre de Tai');
  const atJiji = DW.MAPS.maison.npcs.find(n => n.hero === 'tai');
  yes(!atJiji || !atJiji.cond(DW.state), 'Tai attend encore chez Jijimon');
});
test("poids : un repas fait grossir, un combat fait à peine maigrir (on peut atteindre les Digivolutions « costaudes »)", () => {
  fresh();
  const m = new DW.Digimon('agumon', 12); DW.state.party = [m]; DW.Life.init(m); m.fat = 0; m.hunger = 80;
  DW.Care.feed(m, 60);
  yes(m.fat >= 1, `une Viande ne fait presque pas grossir (${m.fat})`);
  const f0 = m.fat; for (let i = 0; i < 20; i++) DW.Life.addFat(m, -0.02);
  yes(f0 - m.fat <= 1.01, 'vingt combats font trop maigrir');
});

(async () => {
  for (const [name, fn] of tests) {
    const t0 = Date.now(); try { await fn(); ok++; console.log('  OK  ' + name + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)'); }
    catch (e) { ko++; console.log('  ÉCHEC  ' + name + '\n        ' + (e && e.message) + (process.env.PILE ? '\n' + e.stack : '')); }   // PILE=1 : détail de l'erreur
  }
  console.log(`\n${ok} réussi(s), ${ko} échoué(s)`);
  process.exit(ko ? 1 : 0);
})();
