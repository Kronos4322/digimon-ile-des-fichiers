'use strict';
// =====================================================================
//  ÉTAT DE PARTIE ET SAUVEGARDE : 3 emplacements, copie précédente, ancienne partie, migrations (SAVE_V)
// =====================================================================
(function () {
  const Digimon = DW.Digimon;
  // ------------------------------------------------------------ état de partie & sauvegarde
  // Trois emplacements : la sauvegarde, la copie précédente (écrite juste avant chaque sauvegarde)
  // et une copie « illisible » mise de côté si le chargement échoue (jamais écrasée par une nouvelle partie).
  // 3 emplacements de sauvegarde (DW.slot = 1, 2 ou 3) ; l'emplacement 1 garde le nom d'origine (anciennes parties)
  const BASE = 'digimon_ile_des_fichiers_save';
  DW.slot = 1;
  const keyOf = n => (n > 1 ? BASE + '_' + n : BASE);
  const K = { get KEY() { return keyOf(DW.slot); }, get BAK() { return keyOf(DW.slot) + '_precedente'; }, get BROKEN() { return keyOf(DW.slot) + '_illisible'; } };
  DW.SAVE_V = 5; // v2 : Digimon sauvages visibles, Engrenages Noirs, puces, règles DW1 — v3 : « obtenus » (owned), plus de PP — v4 : cartes faites à la main agrandies ×2 — v5 : PV / PM en milliers (×20)
  DW.newState = () => ({
    name: 'Tai', hero: 'tai', party: [], box: [], bag: {}, bits: 300, flags: {}, seen: {}, owned: {},
    map: 'maison', x: 12, y: 5, dir: 'down', heal: { map: 'maison', x: 12, y: 5 }, time: 0, recruits: {},
    clock: 8 * 60, weather: { type: 'clear', until: 12 * 60 }, visited: {}, zoneSeen: {}, poops: {}, bank: {}, wildGone: {}, gears: {}, daily: {},
    orphans: [], v: DW.SAVE_V,
  });
  DW.state = DW.newState();
  DW.addDigimon = mon => {
    const st = DW.state;
    st.seen[mon.sp] = st.owned[mon.sp] = true;
    if (st.party.length < 6) { st.party.push(mon); return 'party'; }
    st.box.push(mon); return 'box';
  };
  const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  // supprimer un emplacement (la sauvegarde et sa copie précédente)
  DW.deleteSave = n => { const keep = DW.slot; DW.slot = n; try { localStorage.removeItem(K.KEY); localStorage.removeItem(K.BAK); } catch (e) { /* stockage indisponible */ } finally { DW.slot = keep; } };
  // VERSIONS d'un emplacement : la partie actuelle, la version précédente (avant la dernière sauvegarde)
  // et l'ANCIENNE partie (mise de côté quand on commence une nouvelle partie sur cet emplacement)
  const infoOf = json => {
    try {
      const o = JSON.parse(json); if (!o) return null;
      const m = DW.MAPS[o.map], lead = o.party && o.party[0];
      return { name: o.name, time: o.time || 0, place: m ? m.name : '?', partner: lead && DW.SPECIES[lead.sp] ? lead.sp : null,
        level: lead ? lead.level : 0, dex: Object.keys(o.owned || o.caught || {}).length, day: Math.floor((o.clock || 0) / 1440) + 1, savedAt: o.savedAt };
    } catch (e) { return null; }
  };
  const OLD = n => keyOf(n) + '_ancienne';
  DW.archiveSave = n => { const keep = DW.slot; DW.slot = n; try { const cur = read(K.KEY) || read(K.BAK); if (cur) write(OLD(n), cur); } finally { DW.slot = keep; } };
  DW.saveVariants = n => {
    const keep = DW.slot; DW.slot = n;
    try {
      const cur = read(K.KEY), bak = read(K.BAK), old = read(OLD(n)), out = [];
      if (cur) out.push({ kind: 'actuelle', label: 'Partie actuelle', info: infoOf(cur) });
      if (bak && bak !== cur) out.push({ kind: 'precedente', label: 'Version précédente', info: infoOf(bak) });
      if (old && old !== cur && old !== bak) out.push({ kind: 'ancienne', label: 'Ancienne partie (mise de côté)', info: infoOf(old) });
      return out.filter(v => v.info);
    } finally { DW.slot = keep; }
  };
  // reprendre une autre version : elle devient la partie de l'emplacement ; la partie remplacée est mise de côté (rien n'est perdu)
  DW.restoreVariant = (n, kind) => {
    const keep = DW.slot; DW.slot = n;
    try {
      const cur = read(K.KEY), pick = kind === 'precedente' ? read(K.BAK) : kind === 'ancienne' ? read(OLD(n)) : cur;
      if (!pick || pick === cur) return;
      // (échange : la partie remplacée prend la place de celle qu'on reprend — précédente ou ancienne —, l'autre ne bouge pas)
      if (cur) write(kind === 'precedente' ? K.BAK : OLD(n), cur);
      write(K.KEY, pick);
    } finally { DW.slot = keep; }
  };
  // résumé affiché sur l'écran titre
  DW.saveInfo = (slot = DW.slot) => {
    const keep = DW.slot; DW.slot = slot;
    try {
      const o = JSON.parse(read(K.KEY) || read(K.BAK));
      if (!o) return null;
      const m = DW.MAPS[o.map], lead = o.party && o.party[0];
      return { name: o.name, time: o.time || 0, place: m ? m.name : '?', partner: lead && DW.SPECIES[lead.sp] ? lead.sp : null,
        level: lead ? lead.level : 0, dex: Object.keys(o.owned || o.caught || {}).length, day: Math.floor((o.clock || 0) / 1440) + 1, savedAt: o.savedAt };
    } catch (e) { return null; } finally { DW.slot = keep; }
  };
  // sauvegarde automatique silencieuse (changement de zone, après un combat)
  const warnedFlags = new Set();
  DW.autosave = () => { if (DW.state.flags.starter) { DW.save(); DW.saveFlash = 2; } };
  DW.save = () => {
    const st = DW.state;
    if (DW.ow) { st.map = DW.ow.mapId; st.x = DW.ow.p.x; st.y = DW.ow.p.y; st.dir = DW.ow.p.dir; }
    st.savedAt = Date.now();
    const unknown = Object.keys(st.flags).filter(k => DW.flagKnown && !DW.flagKnown(k) && !warnedFlags.has(k));
    if (unknown.length) { unknown.forEach(k => warnedFlags.add(k)); console.warn('Drapeaux non déclarés dans js/data/flags.js :', unknown.join(', ')); }
    let json;
    try { json = JSON.stringify(st); } catch (e) { DW.reportError(e, 'sauvegarde'); return false; }
    const old = read(K.KEY);
    if (old && old !== json) write(K.BAK, old);
    const ok = write(K.KEY, json);
    if (ok && DW.SaveFile) DW.SaveFile.afterSave();   // copie dans le fichier de l'ordinateur (game/fichier.js)
    return ok;
  };

  // Digimon d'une sauvegarde : une espèce ou une technique disparue du jeu ne doit pas tout casser.
  // Un Digimon d'espèce inconnue est gardé tel quel dans st.orphans (et rendu si l'espèce revient).
  function revive(o) {
    if (!o || !DW.SPECIES[o.sp]) return null;
    const moves = (o.moves || []).filter(m => m && DW.MOVES[m.id]).map(m => ({ id: m.id }));
    const m = Digimon.from({ ...o, moves: moves.length ? moves : null });
    if (!Number.isFinite(m.hp)) m.hp = m.maxHp;
    m.hp = DW.clamp(m.hp, 0, m.maxHp);
    return m;
  }
  function parseState(raw) {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') throw new Error('sauvegarde vide');
    const st = Object.assign(DW.newState(), o);
    if (!DW.MAPS[st.map]) Object.assign(st, { map: 'maison', x: 12, y: 5 });
    if (!st.heal || !DW.MAPS[st.heal.map]) st.heal = { map: 'maison', x: 12, y: 5 };
    st.recruits = st.recruits || {}; st.flags = st.flags || {}; st.bag = st.bag || {}; st.bank = st.bank || {};
    // migration des anciennes sauvegardes
    const v = o.v || 1;
    if (v < 2) { st.wildGone = {}; st.gears = st.gears || {}; }
      for (const k of ['autoEvo', 'solo']) delete st.flags[k];   // anciennes règles au choix (retirées)
    if (v < 3) { st.owned = Object.assign({}, o.caught || {}, o.owned || {}); delete st.caught; }
    if (v < 4) {   // positions sur les cartes agrandies ×2 (MapKit.ZOOM)
      const Zm = DW.MapKit.ZOOM, zp = (id, x, y) => DW.MapKit.zpt(id, x, y);
      if (Zm[st.map]) [st.x, st.y] = zp(st.map, st.x, st.y);
      if (Zm[st.heal.map]) [st.heal.x, st.heal.y] = zp(st.heal.map, st.heal.x, st.heal.y);
      for (const id in st.poops || {}) if (Zm[id]) st.poops[id] = st.poops[id].map(([x, y]) => zp(id, x, y));
    }
    st.v = DW.SAVE_V;
    for (const box of [st.bag, st.bank, st.fridge || {}]) for (const k in box) if (!DW.ITEMS[k]) delete box[k];
    const orphans = (st.orphans || []).slice();
    st.orphans = [];
    // v5 : PV et PM passent à l'échelle Digimon World (×20) ; les PV restants suivent
    if (v < 5) for (const x of [...(o.party || []), ...(o.box || []), ...orphans]) if (x) { if (Number.isFinite(x.hp)) x.hp *= DW.SCALE.hp; if (Number.isFinite(x.mp)) x.mp *= DW.SCALE.mp; }
    const keep = list => list.map(x => { const m = revive(x); if (!m && x) st.orphans.push(x); return m; }).filter(Boolean);
    st.party = keep(o.party || []);
    st.box = keep(o.box || []).concat(keep(orphans));   // espèce revenue dans le jeu : retour dans la boîte
    if (!st.party.length && st.box.length) st.party.push(st.box.shift());
    return st;
  }
  // message à afficher après le chargement (copie de secours utilisée, Digimon mis de côté...)
  DW.loadNote = null;
  DW.load = () => {
    DW.loadNote = null;
    const main = read(K.KEY);
    try {
      if (!main) throw new Error('aucune sauvegarde');
      DW.state = parseState(main);
    } catch (e) {
      const bak = read(K.BAK);
      if (main) { write(K.BROKEN, main); DW.reportError(e, 'chargement'); }
      try { DW.state = parseState(bak); } catch (e2) { return false; }
      DW.loadNote = 'La dernière sauvegarde était illisible : la sauvegarde précédente a été chargée (l\'autre est conservée à part).';
    }
    if (DW.state.orphans.length) {
      const n = DW.state.orphans.length;
      DW.loadNote = (DW.loadNote ? DW.loadNote + ' ' : '') +
        `${n} Digimon d'une espèce absente de cette version ${n > 1 ? 'sont mis' : 'est mis'} de côté (rien n'est perdu).`;
    }
    return true;
  };
})();
