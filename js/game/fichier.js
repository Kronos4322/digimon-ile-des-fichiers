'use strict';
// =====================================================================
//  FICHIER DE SAUVEGARDE SUR L'ORDINATEUR
//  Chaque adresse du jeu (site en ligne, application installée, version locale) a son propre stockage :
//  une partie faite à un endroit n'apparaissait pas ailleurs. Ici, toutes les parties (3 emplacements,
//  copies précédentes et anciennes parties) sont aussi écrites dans UN fichier choisi sur l'ordinateur
//  (ex. Documents/Digimon-sauvegarde.json). Où qu'on ouvre le jeu, on relie ce même fichier : la partie
//  la plus récente de chaque emplacement est reprise, et chaque sauvegarde met le fichier à jour.
//  Navigateurs sans accès aux fichiers (téléphone, Firefox) : exporter / importer le fichier à la main.
// =====================================================================
(function () {
  const PREFIX = 'digimon_ile_des_fichiers_save';
  const can = typeof window !== 'undefined' && 'showSaveFilePicker' in window && 'indexedDB' in window;
  const ls = () => { try { return window.localStorage; } catch (e) { return null; } };
  const GESTES = ['pointerup', 'keyup', 'click'];   // (gestes qui autorisent l'ouverture du sélecteur de fichier)

  // ------------------------------------------------------------ poignée du fichier, gardée d'une visite à l'autre (IndexedDB)
  const db = () => new Promise((res, rej) => { const r = indexedDB.open('digimon_fichier', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const idb = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('h', mode), s = t.objectStore('h'), r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); };
  const getHandle = () => (can ? idb('readonly', s => s.get('fichier')).catch(() => null) : Promise.resolve(null));
  const setHandle = h => idb('readwrite', s => s.put(h, 'fichier')).catch(() => null);

  // ------------------------------------------------------------ contenu : toutes les clés de sauvegarde
  function bundle() {
    const S = ls(), slots = {};
    if (S) for (let i = 0; i < S.length; i++) { const k = S.key(i); if (k && k.startsWith(PREFIX)) slots[k] = S.getItem(k); }
    return JSON.stringify({ jeu: 'Digimon — L\'Aventure de l\'Île des Fichiers', format: 1, ecrit: Date.now(), slots }, null, 1);
  }
  const savedAt = v => { try { const o = JSON.parse(v); return (o && o.savedAt) || 0; } catch (e) { return 0; } };
  // fusion : pour chaque emplacement, la partie la plus récente gagne ; rien n'est perdu (la partie locale remplacée
  // devient la « version précédente » de l'emplacement)
  function merge(text) {
    const o = JSON.parse(text);
    if (!o || !o.slots || typeof o.slots !== 'object') throw new Error('fichier de sauvegarde invalide');
    const S = ls(); if (!S) return 0;
    let n = 0;
    for (const [k, v] of Object.entries(o.slots)) {
      if (!k.startsWith(PREFIX) || typeof v !== 'string') continue;
      const cur = S.getItem(k);
      if (cur === v) continue;
      const main = !/_(precedente|ancienne|illisible)$/.test(k);
      if (cur == null || (main && savedAt(v) > savedAt(cur))) {
        if (cur != null && main) S.setItem(k + '_precedente', cur);
        S.setItem(k, v); n++;
      }
    }
    return n;
  }

  // ------------------------------------------------------------ écriture (après chaque sauvegarde), groupée
  let handle = null, pending = null, writing = false;
  async function writeNow() {
    if (!handle || writing) return;
    writing = true;
    try {
      if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') return;
      const w = await handle.createWritable(); await w.write(bundle()); await w.close();
      F.lastWrite = Date.now();
    } catch (e) { /* fichier déplacé ou verrouillé : on réessaiera à la prochaine sauvegarde */ } finally { writing = false; }
  }
  const schedule = () => { clearTimeout(pending); pending = setTimeout(writeNow, 400); };

  const F = DW.SaveFile = {
    can, lastWrite: 0,
    name: () => (handle ? handle.name : null),
    // au démarrage : retrouver le fichier relié ; si l'accès est déjà permis, reprendre les parties plus récentes
    async init() {
      if (!can) return;
      handle = await getHandle();
      if (!handle) return;
      try {
        if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') { merge(await (await handle.getFile()).text()); F.ready = true; }
        else F.needsPermission = true;
      } catch (e) { handle = null; }
    },
    // relier un fichier existant (ou en choisir un nouveau) : à appeler depuis un choix du joueur (clic, touche)
    async open() {
      const [h] = await window.showOpenFilePicker({ types: [{ description: 'Sauvegarde Digimon', accept: { 'application/json': ['.json'] } }], multiple: false });
      if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') return { ok: false };
      const n = merge(await (await h.getFile()).text());
      handle = h; await setHandle(h); F.needsPermission = false; F.ready = true;
      await writeNow();
      return { ok: true, n };
    },
    async create() {
      const h = await window.showSaveFilePicker({ suggestedName: 'Digimon-sauvegarde.json', types: [{ description: 'Sauvegarde Digimon', accept: { 'application/json': ['.json'] } }] });
      handle = h; await setHandle(h); F.needsPermission = false; F.ready = true;
      await writeNow();
      return { ok: true };
    },
    // redonner l'accès au fichier déjà relié (le navigateur le redemande à chaque visite)
    async reconnect() {
      if (!handle) return { ok: false };
      if ((await handle.requestPermission({ mode: 'readwrite' })) !== 'granted') return { ok: false };
      const n = merge(await (await handle.getFile()).text());
      F.needsPermission = false; F.ready = true; await writeNow();
      return { ok: true, n };
    },
    // sans accès aux fichiers : téléchargement et import manuels
    exportFile() {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bundle()], { type: 'application/json' }));
      a.download = 'Digimon-sauvegarde.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);   // (Safari demande d'abord l'accord : le lien doit encore marcher)
    },
    // choisir un fichier ; le sélecteur fermé sans fichier rend { annule: true } (l'écran titre attendait pour toujours)
    importFile() {
      return new Promise(res => {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
        inp.style.display = 'none'; document.body.appendChild(inp);
        let fini = false, demande = false, relache = false;
        const ouvrir = () => { if (demande) return; demande = true; for (const ev of GESTES) window.removeEventListener(ev, ouvrir, true); inp.click(); };
        const annule = () => { if (!inp.files || !inp.files.length) fin({ ok: false, annule: true }); };
        const retour = () => { if (!document.hidden) setTimeout(annule, 1500); };   // (de retour sur la page sans fichier choisi)
        // filet : sélecteur jamais ouvert, ou fermé sans aucun signal → un nouvel appui sur OK ou Retour dans le jeu annule
        const garde = setInterval(() => { if (!(DW.Input.held.ok || DW.Input.held.back)) relache = true; else if (relache) annule(); }, 100);
        function fin(r) {
          if (fini) return; fini = true; clearInterval(garde); inp.remove();
          for (const ev of GESTES) window.removeEventListener(ev, ouvrir, true);
          window.removeEventListener('focus', retour); document.removeEventListener('visibilitychange', retour);
          res(r);
        }
        inp.onchange = async () => { if (!inp.files || !inp.files.length) return annule(); try { fin({ ok: true, n: merge(await inp.files[0].text()) }); } catch (e) { fin({ ok: false }); } };
        inp.addEventListener('cancel', annule);
        window.addEventListener('focus', retour); document.addEventListener('visibilitychange', retour);
        // le navigateur n'ouvre le sélecteur que juste après un geste : au toucher, OK part dès l'appui du doigt, le
        // sélecteur s'ouvre donc quand le doigt se lève
        if (!navigator.userActivation || navigator.userActivation.isActive) ouvrir();
        else for (const ev of GESTES) window.addEventListener(ev, ouvrir, true);
      });
    },
    afterSave: schedule,
    merge, bundle,
  };
  F.init();

  // ------------------------------------------------------------ menu « Fichier sur l'ordinateur »
  // (le menu s'ouvre aussi depuis l'écran titre, où aucune partie n'est chargée : on n'enregistre que s'il y en a une,
  //  sinon l'emplacement de la vraie partie était écrasé par une partie vide)
  const enregistrerPartie = () => { if (DW.state && DW.state.party && DW.state.party.length) DW.save(); };
  DW.saveFileMenu = async () => {
    const say = DW.say;
    if (!can) {
      const r = await DW.ask('Sauvegarde sur l\'ordinateur : ce navigateur ne peut pas écrire directement dans un fichier. Tu peux télécharger tes parties, puis les recharger ailleurs.', ['Télécharger mes parties', 'Charger un fichier', 'Retour']);
      if (r === 0) { enregistrerPartie(); F.exportFile(); await say('Fichier « Digimon-sauvegarde.json » téléchargé. Garde-le précieusement !'); }
      else if (r === 1) { const res = await F.importFile(); if (!res.annule) await say(res.ok ? `Parties chargées depuis le fichier (${res.n} mise${res.n > 1 ? 's' : ''} à jour).` : 'Ce fichier n\'est pas une sauvegarde du jeu.'); }
      return;
    }
    if (handle && F.needsPermission) {
      const r = await DW.ask(`Ton fichier de sauvegarde « ${handle.name} » est relié. Le navigateur demande ton accord pour l'utiliser.`, ['Autoriser', 'Choisir un autre fichier', 'Retour']);
      if (r === 0) { const res = await F.reconnect(); await say(res.ok ? 'C\'est bon : tes parties sont à jour, et chaque sauvegarde ira aussi dans le fichier.' : 'Accès refusé : le fichier n\'est pas utilisé pour l\'instant.'); }
      else if (r === 1) await pick();
      return;
    }
    if (handle) {
      const r = await DW.ask(`Tes parties sont enregistrées dans le fichier « ${handle.name} », à chaque sauvegarde. Ouvre le jeu où tu veux sur ce PC et relie ce même fichier : tu retrouveras tout.`, ['D\'accord', 'Choisir un autre fichier', 'Télécharger une copie'], null, 0);
      if (r === 1) await pick();
      else if (r === 2) { enregistrerPartie(); F.exportFile(); }
      return;
    }
    await pick();
    async function pick() {
      const r = await DW.ask('Enregistrer tes parties dans un fichier sur l\'ordinateur ? Ainsi tu les retrouves partout : site en ligne, application installée...', ['Créer le fichier', 'J\'ai déjà un fichier', 'Retour']);
      try {
        if (r === 0) { enregistrerPartie(); await F.create(); await say(`Fichier « ${handle.name} » créé ! Chaque sauvegarde y sera aussi écrite. Sur une autre version du jeu, choisis « J'ai déjà un fichier ».`); }
        else if (r === 1) {
          const res = await F.open();
          if (!res.ok) { await say('Accès refusé.'); return; }
          await say(res.n ? `Fichier relié : ${res.n} partie${res.n > 1 ? 's' : ''} plus récente${res.n > 1 ? 's' : ''} reprise${res.n > 1 ? 's' : ''}. Retourne à l'écran titre pour les continuer.` : 'Fichier relié : tes parties sont déjà à jour.');
        }
      } catch (e) { if (e && e.name !== 'AbortError') await say('Impossible d\'utiliser ce fichier.'); }
    }
  };
})();
