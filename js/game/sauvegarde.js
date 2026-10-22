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
  DW.SAVE_V = 7; // v2 : Digimon sauvages visibles, Engrenages Noirs, puces, règles DW1 — v3 : « obtenus » (owned), plus de PP — v4 : cartes faites à la main agrandies ×2 — v5 : PV / PM en milliers (×20) — v6 : antre de Shellmon redessinée — v7 : l'Engrenage de Meramon compte pour le Pays de Meramon
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
  // une sauvegarde LISIBLE : du JSON d'un objet dont l'équipe et la boîte sont des listes (ce que parseState sait charger)
  const objetDe = json => {
    if (typeof json !== 'string' || !json) return null;
    try { const o = JSON.parse(json); return o && typeof o === 'object' && !Array.isArray(o) && (o.party == null || Array.isArray(o.party)) && (o.box == null || Array.isArray(o.box)) ? o : null; } catch (e) { return null; }
  };
  const lisible = json => !!objetDe(json);
  // une sauvegarde illisible est mise de côté (les deux dernières : « _illisible », puis « _illisible_2 ») ; jamais effacée
  // par une autre (avant : la 2e copie abîmée écrasait la 1re)
  const deCote = json => { const b = read(K.BROKEN); if (b === json) return; if (b) write(K.BROKEN + '_2', b); write(K.BROKEN, json); };
  // supprimer un emplacement (la sauvegarde et sa copie précédente)
  // (toutes ses versions : sinon l'emplacement vide dans NOUVELLE PARTIE restait plein dans CONTINUER)
  DW.deleteSave = n => { const keep = DW.slot; DW.slot = n; try { for (const k of [K.KEY, K.BAK, K.BROKEN, K.BROKEN + '_2', OLD(n), OLD2(n), SWAP(n)]) localStorage.removeItem(k); } catch (e) { /* stockage indisponible */ } finally { DW.slot = keep; } };
  // VERSIONS d'un emplacement : la partie actuelle, la version précédente (avant la dernière sauvegarde)
  // et l'ANCIENNE partie (mise de côté quand on commence une nouvelle partie sur cet emplacement)
  const infoOf = json => {
    const o = objetDe(json); if (!o) return null;
    const m = DW.MAPS[o.map], lead = o.party && o.party[0], num = v => (Number.isFinite(v) ? v : 0);
    return { name: String(o.name || '?'), time: num(o.time), place: m ? m.name : '?', partner: lead && DW.SPECIES[lead.sp] ? lead.sp : null,
      level: lead ? lead.level : 0, dex: Object.keys(o.owned || o.caught || {}).length, day: Math.floor(num(o.clock) / 1440) + 1, savedAt: o.savedAt };
  };
  const OLD = n => keyOf(n) + '_ancienne', OLD2 = n => keyOf(n) + '_ancienne_2', SWAP = n => keyOf(n) + '_remplacee';
  // mettre de côté la partie d'un emplacement (nouvelle partie dessus) : sa dernière version LISIBLE ; les deux dernières
  // parties mises de côté sont gardées (avant : une 2e nouvelle partie effaçait la 1re, pourtant annoncée récupérable)
  DW.archiveSave = n => {
    const keep = DW.slot; DW.slot = n;
    try {
      const cur = [read(K.KEY), read(K.BAK)].find(lisible), old = read(OLD(n));
      if (!cur || cur === old) return;
      if (old) write(OLD2(n), old);
      write(OLD(n), cur);
    } finally { DW.slot = keep; }
  };
  DW.saveVariants = n => {
    const keep = DW.slot; DW.slot = n;
    try {
      const L = [['actuelle', 'Partie actuelle', K.KEY], ['precedente', 'Version précédente', K.BAK], ['ancienne', 'Ancienne partie (mise de côté)', OLD(n)],
        ['ancienne_2', 'Partie mise de côté avant', OLD2(n)], ['remplacee', 'Partie d\'avant ta reprise', SWAP(n)]];
      const vues = new Set(), out = [];
      for (const [kind, label, k] of L) {
        const j = read(k); if (!j || vues.has(j)) continue;
        vues.add(j); const info = infoOf(j); if (info) out.push({ kind, label, info });
      }
      return out;
    } finally { DW.slot = keep; }
  };
  // reprendre une autre version : elle devient la partie de l'emplacement ; la partie remplacée est mise de côté à part
  // (avant : elle prenait la place de la version précédente, que la sauvegarde suivante écrasait — elle était perdue)
  DW.restoreVariant = (n, kind) => {
    const keep = DW.slot; DW.slot = n;
    try {
      const cur = read(K.KEY), pick = { precedente: read(K.BAK), ancienne: read(OLD(n)), ancienne_2: read(OLD2(n)), remplacee: read(SWAP(n)) }[kind] || cur;
      if (!pick || pick === cur) return;
      if (cur) { if (lisible(cur)) write(SWAP(n), cur); else deCote(cur); }
      write(K.KEY, pick);
    } finally { DW.slot = keep; }
  };
  // résumé affiché sur l'écran titre
  // (la principale, sinon la précédente lisible : avant, une principale abîmée cachait la précédente encore bonne,
  //  NOUVELLE PARTIE montrait l'emplacement « vide », le choisissait d'office, et la vraie partie était écrasée)
  DW.saveInfo = (slot = DW.slot) => {
    const keep = DW.slot; DW.slot = slot;
    try { return infoOf(read(K.KEY)) || infoOf(read(K.BAK)); } finally { DW.slot = keep; }
  };
  // sauvegarde automatique silencieuse (changement de zone, après un combat) ; renvoie true si elle a vraiment réussi
  // (« Sauvegardé » seulement si c'est vrai ; sinon un avertissement qui ne bloque pas le jeu, au plus toutes les 2 minutes)
  const warnedFlags = new Set();
  DW.SAVE_ECHEC = "La sauvegarde a échoué : mémoire du navigateur pleine ? Utilise FICHIER (menu Système, « Fichier sur l'ordinateur ») pour télécharger ta partie.";
  let averti = 0;
  const prevenir = msg => { if (DW.Care && DW.Care.toast && Date.now() - averti > 120000) { averti = Date.now(); DW.Care.toast(msg, '#ff8a8a'); } };
  DW.autosave = () => {
    if (!DW.state.flags.starter) return null;   // (pas encore de partenaire : rien n'est sauvegardé, ce n'est pas un échec)
    const ok = DW.save();
    if (ok) DW.saveFlash = 2;
    else prevenir('Sauvegarde impossible : mémoire du navigateur pleine ?');
    return ok;
  };
  DW.save = () => {
    const st = DW.state;
    if (DW.ow) { st.map = DW.ow.mapId; st.x = DW.ow.p.x; st.y = DW.ow.p.y; st.dir = DW.ow.p.dir; }
    st.savedAt = Date.now();
    const unknown = Object.keys(st.flags).filter(k => DW.flagKnown && !DW.flagKnown(k) && !warnedFlags.has(k));
    if (unknown.length) { unknown.forEach(k => warnedFlags.add(k)); console.warn('Drapeaux non déclarés dans js/data/flags.js :', unknown.join(', ')); }
    let json;
    try { json = JSON.stringify(st); } catch (e) { DW.reportError(e, 'sauvegarde'); return false; }
    // la copie « précédente » n'est faite que d'une principale LISIBLE ; une principale abîmée est mise de côté à part (avant :
    //  elle remplaçait la précédente encore bonne, et deux sauvegardes plus tard il ne restait plus rien de lisible)
    const old = read(K.KEY);
    let copie = true;
    if (old && old !== json) { if (lisible(old)) copie = write(K.BAK, old); else deCote(old); }
    const ok = write(K.KEY, json);
    if (ok && !copie) prevenir('Copie de secours impossible : mémoire du navigateur presque pleine. FICHIER peut garder ta partie.');
    // écriture refusée (mémoire du navigateur pleine...) : la partie est gardée à part, pour que FICHIER la télécharge
    // quand même — sinon le fichier ne contenait que l'ancienne sauvegarde (game/fichier.js, bundle)
    DW.saveRefusee = ok ? null : { k: K.KEY, json };
    if (DW.SaveFile) DW.SaveFile.afterSave();   // copie dans le fichier de l'ordinateur (game/fichier.js)
    // stockage « persistant » demandé une fois : le navigateur n'efface plus les parties pour faire de la place
    if (ok && !persiste) { persiste = true; try { navigator.storage.persist().catch(() => {}); } catch (e) { /* non disponible */ } }
    return ok;
  };
  let persiste = false;
  // le jeu passe en arrière-plan (téléphone : autre appli, écran éteint ; l'appareil peut alors le fermer sans prévenir) :
  // sauvegarde si on se promène librement (pas pendant un combat, une scène, un dialogue ou un menu)
  if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', () => {
    const ow = DW.ow;
    if (document.hidden && ow && !ow.locked && DW.Game.top() === ow && DW.state.flags.starter) DW.save();
  });

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
    const st = Object.assign(DW.newState(), o), d = DW.newState(), num = Number.isFinite;
    // champs simples abîmés (texte, null, liste...) : valeur de départ (avant : des Bits en texte, puis « bits -= prix » = NaN)
    for (const k of ['bits', 'clock', 'time']) if (!num(st[k])) st[k] = d[k];
    for (const k of ['flags', 'bag', 'bank', 'seen', 'owned', 'recruits', 'visited', 'zoneSeen', 'poops', 'wildGone', 'gears', 'daily'])
      if (!st[k] || typeof st[k] !== 'object' || Array.isArray(st[k])) st[k] = d[k];
    if (st.fridge != null && (typeof st.fridge !== 'object' || Array.isArray(st.fridge))) st.fridge = {};
    if (!st.heal || !DW.MAPS[st.heal.map] || !num(st.heal.x) || !num(st.heal.y)) st.heal = { map: 'maison', x: 12, y: 5 };
    if (!DW.MAPS[st.map] || !num(st.x) || !num(st.y)) Object.assign(st, { map: st.heal.map, x: st.heal.x, y: st.heal.y });
    // fin de chapitre interrompue (jeu fermé pendant le bilan, avant la sauvegarde du nouveau chapitre — corrigé en 10/2026) :
    //  le boss vaincu fait foi, sinon le voile restait fermé et rien ne relançait la fin du chapitre
    const f = st.flags, ch = () => f.chapter || 1;
    if (f.shellmon && ch() < 2) f.chapter = 2;
    if ((f.seadramon || st.gears.lac) && ch() === 2) f.chapter = 3;
    if (f.meramon && ch() === 3) f.chapter = 4;
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
    // v6 : l'antre de Shellmon est redessinée (images du joueur) : une partie sauvegardée dedans reprend à l'entrée de la salle
    if (v < 6 && /^antre/.test(st.map) && DW.MAPS[st.map] && DW.MAPS[st.map].entry) Object.assign(st, { x: DW.MAPS[st.map].entry.x, y: DW.MAPS[st.map].entry.y, dir: 'up' });
    // v7 : l'Engrenage de Meramon (chapitre 3, Mont Miharashi) était compté pour le Mont Panorama (gears.volcan) ; il compte
    //  désormais pour le Pays de Meramon (game/story.js). Seulement si Meramon a bien été calmé au Mont Miharashi ; l'ancien
    //  engrenage n'est retiré que s'il ne peut pas venir de l'ancien boss du Mont Panorama (son Belvédère jamais visité)
    if (v < 7 && st.flags.meramon) { st.gears = st.gears || {}; st.gears.miharashi = true; if (!(st.visited || {}).volcan7) delete st.gears.volcan; }
    futur = v > DW.SAVE_V;   // (partie d'une version plus récente du jeu : DW.load le dit)
    st.v = DW.SAVE_V;
    // objets inconnus de cette version (plus récente, ou objet retiré) : gardés à part et rendus quand ils existent de nouveau
    //  (avant : effacés du sac, du coffre et du frigo à la sauvegarde suivante)
    const OI = st.orphanItems = st.orphanItems && typeof st.orphanItems === 'object' ? st.orphanItems : {};
    for (const nom of ['bag', 'bank', 'fridge']) {
      const box = st[nom];
      if (!box) continue;
      const mis = OI[nom] = OI[nom] || {};
      for (const k in mis) if (DW.ITEMS[k]) { box[k] = (box[k] || 0) + mis[k]; delete mis[k]; }
      for (const k in box) if (!DW.ITEMS[k]) { mis[k] = (mis[k] || 0) + (num(box[k]) ? box[k] : 0); delete box[k]; }
      if (!Object.keys(mis).length) delete OI[nom];
    }
    if (!Object.keys(OI).length) delete st.orphanItems;
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
  let futur = false;
  DW.load = () => {
    DW.loadNote = null; futur = false;
    const main = read(K.KEY);
    try {
      if (!main) throw new Error('aucune sauvegarde');
      DW.state = parseState(main);
    } catch (e) {
      const bak = read(K.BAK);
      if (main) { deCote(main); DW.reportError(e, 'chargement'); }
      try { DW.state = parseState(bak); } catch (e2) { return false; }
      // (la précédente redevient la principale : sinon la sauvegarde suivante recopiait la principale abîmée dans la
      //  précédente, et une 2e panne ne laissait plus rien)
      write(K.KEY, bak);
      DW.loadNote = main ? 'La dernière sauvegarde était illisible : la sauvegarde précédente a été chargée (l\'autre est conservée à part).'
        : 'La sauvegarde principale manquait : la sauvegarde précédente a été chargée.';
    }
    if (futur) DW.loadNote = (DW.loadNote ? DW.loadNote + ' ' : '') + "Cette partie vient d'une version plus récente du jeu : recharge la page pour l'avoir (ce que cette version ne connaît pas est gardé de côté).";
    if (DW.state.orphans.length) {
      const n = DW.state.orphans.length;
      DW.loadNote = (DW.loadNote ? DW.loadNote + ' ' : '') +
        `${n} Digimon d'une espèce absente de cette version ${n > 1 ? 'sont mis' : 'est mis'} de côté (rien n'est perdu).`;
    }
    return true;
  };
})();
