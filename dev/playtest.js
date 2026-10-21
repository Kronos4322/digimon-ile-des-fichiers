'use strict';
// =====================================================================
//  PARTIE TEST DU CHAPITRE 1 (joueur automatique « réaliste ») — mesure le rythme réel du jeu
//  À lancer dans la console du jeu :
//    const s = document.createElement('script'); s.src = 'dev/playtest.js'; document.body.appendChild(s);
//    puis  DEV.playtest()  (le journal se remplit dans DEV.pt.log ; résumé dans DEV.pt.sum)
//  Le joueur automatique joue comme un vrai joueur, avec les vraies scènes du jeu :
//   - nouvelle partie (personnage original) : le début JOUÉ dans la forêt, réveil chez Jijimon ;
//   - il nourrit, abreuve, couche son Digimon (une nuit chez Jijimon efface un K.O.), garde des RAM PV ;
//   - il s'entraîne AUX POSTES du Terrain (les vrais mini-jeux : Attaque, Défense, Vitesse, PV, PM)
//     et à la salle de classe (Intelligence : nouvelles techniques) ;
//   - il ne combat qu'en forme, un cran au-dessus de son niveau (pas après un K.O. ; plus du tout à 2 K.O.) ;
//   - Kuwagamon dans le Grand Arbre une fois Champion, l'énigme des cabines, l'antre, puis Shellmon (Tai à mi-vie).
// =====================================================================
(function () {
  const DEV = window.DEV = window.DEV || {};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const key = code => { window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code })), 40); };
  const hours = () => ((DW.state.clock - 8 * 60) / 60).toFixed(1);
  DEV.playtest = async (o = {}) => {
    window.requestAnimationFrame = f => setTimeout(() => f(performance.now()), 16);
    const SP = o.fast ? 0.15 : 1;   // DEV.playtest({ fast: true }) : séances accélérées
    const pt = DEV.pt = { log: [], fights: 0, wins: 0, losses: 0, trains: 0, kuwaTries: 0, shellTries: 0, streak: 0, moves: 0, done: false };
    const lead = () => DW.state.party[0];
    const log = t => { const m = lead(); pt.log.push(`[${hours()} h] ${m ? m.name + ' N.' + m.level : ''} — ${t}`); };
    // instantanés : fondus, dialogues et choix (le joueur répond « oui »)
    DW.fade = async () => {}; DW.say = async () => {}; DW.ask = async q => (/Digivice vibre/.test(q) ? 1 : 0); DW.choose = async () => 0;

    // pilote : fait avancer les scènes (combats au tour par tour ou dans l'arène, cinématiques) jusqu'à la fin d'une promesse
    const drive = async (p, max = 1500) => {
      let done = false, res; p.then(r => { done = true; res = r; }, e => { done = true; res = 'error'; log('ERREUR ' + e); });
      for (let i = 0; i < max && !done; i++) {
        const b = DW.Game.top();
        if (b.constructor === DW.BagScene && pt.wantHeal) { pt.wantHeal = false; pt.ramFight = (pt.ramFight || 0) + 1; b.close({ item: 'soin_p', target: 0 }); await wait(70); continue; }
        if (b.mode === 'cmd' && b.active) {
          const P = b.active;
          if (P.hp < P.maxHp * 0.35 && DW.state.bag.soin_p) { pt.wantHeal = true; b.cursor = 1; b.resolveMenu(1); await wait(120); continue; }
          b.cursor = 0;
        }
        if (b.mode === 'moves' && b.active) {   // la technique la plus puissante qu'il peut payer
          let best = 0, bp = -1; b.active.moves.forEach((mv, i) => { const M = DW.MOVES[mv.id] || {}; if (b.active.canPay(mv.id) && (M.pow || 0) > bp) { bp = M.pow || 0; best = i; } }); b.mcursor = best;
        }
        if (b !== DW.ow) key('Space');
        await wait(o.fast ? 45 : 70);
      }
      for (let i = 0; i < 40 && DW.Game.top() !== DW.ow; i++) { key('Space'); await wait(150); }
      return res;
    };
    const fight = async (enemy, boss, ally) => { DW.timeScale = o.fast ? 12 : 4; const r = await drive(DW.ow.battle({ enemy, boss, canLose: !!boss, ally })); DW.timeScale = 1; return r; };
    const script = fn => drive(new Promise((ok, ko) => DW.ow.runScript(async ow => { try { ok(await fn(ow)); } catch (e) { ko(e); } })), 4000);

    // ---------------------------------------------------------------- nouvelle partie : le vrai début, dans la forêt
    const st = DW.state = DW.newState(); st.name = 'Kenji'; st.hero = 'perso';
    st.look = { gender: 0, style: 0, hair: 0, shirt: 0, head: 0, baby: Object.values(DW.HERO_LINE)[0].baby };
    DW.startGame(true);
    for (let i = 0; i < 900 && !(DW.ow && DW.ow.mapId === 'maison' && DW.Game.top() === DW.ow && !DW.ow.locked); i++) { if (DW.Game.top() !== DW.ow) key('Space'); await wait(80); }
    st.flags.tour = true;
    log(`début joué dans la forêt → réveil chez Jijimon avec ${lead() ? lead().name : '???'} (Kuwagamon vu : ${!!st.flags.kuwaChase})`);

    const ZONES = ['dunes', 'bosquet', 'plage', 'lisiere', 'geants', 'sentier', 'clairiere', 'antre1', 'antre_lagune', 'antre2', 'antre_crypte'];
    const ENC = id => (DW.FIRST_ZONES && DW.FIRST_ZONES[id]) || DW.getMap(id).encounters;
    const zoneFor = lv => {
      const ok = ZONES.filter(z => !z.startsWith('antre') || DW.state.flags.shellLair);
      const maxOf = z => Math.max(...ENC(z).map(e => e.max));
      return ok.find(z => maxOf(z) >= lv + 1) || ok[ok.length - 1];
    };
    const champion = m => ['Champion', 'Ultime', 'Méga'].includes(m.d.stage);
    // poste d'entraînement d'une stat sur la carte (le sac de frappe : un poste d'Attaque à part)
    const stationOf = (k, eq) => {
      const M = DW.ow.map;
      if (eq === 'punchbag') { const b = M.objects.find(x => x.kind === 'punchbag'); return { x: b.x, y: b.y + (b.h || 1) - 1, eq }; }
      if (k === 'int') { const sg = M.objects.find(x => x.kind === 'stationsign' && x.v === 4); return { x: sg.x, y: sg.y }; }
      for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) if (DW.World.info(DW.ow.tileAt(x, y)).train === k) return { x, y };
      return null;
    };

    for (let step = 0; step < (o.steps || 3000) && !DW.state.flags.shellmon; step++) {
      const m = lead();
      if (!m) { log('plus de Digimon !'); break; }
      if (pt.lastStage && pt.lastStage !== 'Bébé' && m.d.stage === 'Bébé') log(`MORT de son Digimon : il renaît en ${m.name}`);
      pt.lastStage = m.d.stage;
      // soins : manger, boire, toilettes, maladie, blessure
      const nx = (DW.EVO[m.sp] || [])[0], fatNeed = nx && nx.req.fatMin != null && (m.fat || 0) < nx.req.fatMin;
      if (m.hunger >= (fatNeed ? 30 : 60)) { if (!DW.state.bag.viande) { DW.state.bits -= 50; DW.giveItem('viande', 3); } DW.useItem('viande', m); }
      if ((m.thirst || 0) >= 55) { if (!DW.state.bag.eau_fraiche && DW.state.bits >= 80) { DW.state.bits -= 80; DW.giveItem('eau_fraiche', 2); } if (DW.state.bag.eau_fraiche) DW.useItem('eau_fraiche', m); else { DW.Care.drink(m, 70); DW.state.clock += 10; } }
      if (m.need >= 70) { m.need = 0; DW.state.clock += 5; }
      if (m.sick) { DW.state.bits -= 200; m.sick = 0; m.germs = 20; log('malade : médicament'); }
      if (m.hurt) { m.hurt = 0; }
      // RAM PV : il en garde 3 dans le sac (distributeur, 100 Bits) ; sous 70 % de PV, il en utilise une
      if ((DW.state.bag.soin_p || 0) < 3 && DW.state.bits >= 300) { DW.state.bits -= 300; DW.giveItem('soin_p', 3); pt.buys = (pt.buys || 0) + 3; }
      if (m.hp > 0 && m.hp < m.maxHp * 0.7 && DW.state.bag.soin_p) DW.useItem('soin_p', m);
      // la nuit, il dort chez Jijimon : une nuit là-bas efface un K.O.
      if (DW.Life.sleepy(m) || m.tired >= 85) { await DW.Life.sleep(); m.heal(); const k0 = m.kos || 0; if (k0 > 0) m.kos = k0 - 1; log(`nuit chez Jijimon${k0 ? " : un K.O. s'efface (" + m.kos + '/3)' : ''}`); continue; }
      // Digivolution dès que possible
      const evo = DW.Evo.available(m);
      if (evo.length) { const to = evo[0].to; m.evolve(to); DW.state.seen[to] = DW.state.owned[to] = true; await drive(DW.learnEvoMoves(m), 300); log(`DIGIVOLUTION → ${DW.SPECIES[to].name} (${DW.SPECIES[to].stage})`); continue; }
      const fit = m.hp >= m.maxHp * 0.95 && !(m.kos || 0) && m.tired < 50;

      // ---------- KUWAGAMON, dans le Cœur du Grand Arbre (le vrai combat scripté), une fois Champion
      if (!DW.state.flags.kuwagamon && champion(m) && fit && m.level !== pt.lastKuwa) {
        pt.lastKuwa = m.level; pt.kuwaTries++;
        DW.ow.load('arbre_kuwagamon', 9, 11, 'up'); await wait(200);
        const n = DW.ow.map.npcs.find(x => x.sp === 'kuwagamon');
        DW.timeScale = o.fast ? 12 : 4; await script(ow => n.talk(ow, n)); DW.timeScale = 1;
        log(`KUWAGAMON : ${DW.state.flags.kuwagamon ? 'VICTOIRE' : 'défaite'}`);
        if (DW.state.flags.kuwagamon) pt.kuwaAt = hours();
        continue;
      }
      // ---------- l'énigme des cabines (« Aide-moi, je suis sous le sable »)
      if (DW.state.flags.kuwagamon && !DW.state.flags.shellLair) {
        DW.ow.load('plage', 20, 10, 'up'); await wait(200);
        for (const i of DW.Antre.ORDER) await script(ow => DW.Antre.booth(ow, i));
        log(`cabines : ${DW.state.flags.shellLair ? "le sable s'ouvre, l'antre de Shellmon !" : "ÉCHEC de l'énigme"}`);
        continue;
      }
      // ---------- SHELLMON (Tai et Greymon à mi-vie), au fond de l'antre
      if (DW.state.flags.shellLair && champion(m) && m.level >= 15 && fit && m.level !== pt.lastShell) {
        pt.lastShell = m.level; pt.shellTries++;
        DW.ow.load('antre_shellmon', 30, 23, 'up'); await wait(200);
        DW.timeScale = o.fast ? 12 : 4; await script(ow => DW.Antre.fight(ow)); DW.timeScale = 1;
        log(`SHELLMON : ${DW.state.flags.shellmon ? 'VICTOIRE — Tai délivré : ' + !!(DW.state.kids || {}).tai : 'défaite'}`);
        continue;
      }

      // ---------- entraînement (au plus 2 séances d'affilée, ensuite il va combattre : le niveau fixe le potentiel)
      //  priorité : les points de la Digivolution visée ; une leçon en classe sur 4 (techniques) ; sinon PV, PM, Attaque...
      const next = (DW.EVO[m.sp] || [])[0], req = next ? next.req : {};
      const need = Object.keys(DW.Training.STATS).filter(k => req[k] && m.tr[k] < req[k] && !DW.Training.blocked(m, k));
      if (pt.trains % 4 === 3 && !DW.Training.blocked(m, 'int')) need.unshift('int');
      else if (!need.length) { const k = ['hp', 'atk', 'mp', 'def', 'spd'][pt.trains % 5]; if (!DW.Training.blocked(m, k)) need.push(k); }
      if (need.length && m.tired < 55 && pt.streak < 2 && (pt.fightRun == null || pt.fightRun >= 6)) {   // 2 séances, puis ~6 combats
        const k = need[0], evoGoal = (req[k] && m.tr[k] < req[k]) || k === 'int';   // (l'Intelligence en points : elle ouvre les techniques de la classe)
        DW.Training.opts = { mode: evoGoal ? 'evo' : 'stat', level: DW.Training.LEVELS[1] };
        const where = k === 'int' ? 'classe' : 'gym', eq = k === 'atk' && Math.floor(pt.trains / 5) % 2 ? 'punchbag' : null;
        if (DW.ow.mapId !== where) { DW.ow.load(where, ...(where === 'gym' ? DW.MapKit.zpt('gym', 16, 9) : [7, 9]), 'up'); await wait(150); }
        const spot = stationOf(k, eq);
        DW.ow.load(where, spot.x, spot.y + 1, 'up'); await wait(150);
        const sc = new DW.FieldTrainingScene(m, k, spot);
        DW.Game.push(sc);
        await wait(700 * SP); sc.start(); await wait(1200 * SP);
        for (let j = 0; j < 3; j++) {
          await wait(800 * SP);
          while (sc.anim) await wait(50);
          if (sc.hits.length > j) continue;
          const r = Math.random() < 0.35 ? 2 : Math.random() < 0.8 ? 1 : 0;
          if (sc.eq === 'datacrystal') sc.charge = 0.7;
          sc.rep(r);
        }
        for (let i = 0; i < 200 && sc.state !== 'done'; i++) await wait(60);
        await wait(1000 * SP); sc.close('stop'); pt.trains++; pt.streak++; if (pt.streak >= 2) pt.fightRun = 0;
        if (k === 'int' && DW.Classe) { const n0 = m.moves.map(x => x.id).join(); await drive(DW.Classe.after(m, sc.score || 4), 300); if (m.moves.map(x => x.id).join() !== n0) { pt.moves++; log(`leçon en classe : NOUVELLE TECHNIQUE → ${m.moves.map(x => DW.MOVES[x.id].name).join(', ')}`); } }
        log(`entraînement ${DW.Training.STATS[k].name}${sc.eq && sc.eq !== k ? ' (' + sc.eq + ')' : ''} — ${evoGoal ? 'points ' + m.tr[k] + (req[k] ? ' / ' + req[k] : '') : DW.Training.STATS[k].stat + ' ' + m.stat(k)}`);
        await wait(150); continue;
      }
      // ---------- repos : on ne part au combat qu'en forme ; à 2 K.O., plus aucun combat avant une nuit chez Jijimon
      if ((m.kos || 0) >= 2 || m.hp < m.maxHp * 0.9 || m.tired >= 60) {
        if (DW.ow.mapId !== 'maison') { DW.ow.load('maison', 12, 5, 'down'); await wait(100); }
        await DW.Life.restOrSleep(); pt.rests = (pt.rests || 0) + 1;   // (le repos ne remet pas le compteur de séances : il faut aller combattre)
        await wait(60); continue;
      }
      // ---------- combat : un cran au-dessus de son niveau, sauf après un K.O. (zone de son niveau)
      pt.streak = 0; pt.fightRun = (pt.fightRun || 0) + 1;
      const z = zoneFor(m.level - ((m.kos || 0) ? 1 : 0)), list = ENC(z), e = DW.weighted(list.map(x => ({ ...x, w: x.w || 1 })));
      if (DW.ow.mapId !== z) DW.ow.load(z, 20, 20, 'down');
      const r = await fight(new DW.Digimon(e.sp, DW.rand(e.min, e.max)), false);
      pt.fights++; if (r === 'win') pt.wins++; else if (r === 'lose') { pt.losses++; log(`défaite contre ${DW.SPECIES[e.sp].name} (K.O. ${m.kos || 0}/3)`); }
      DW.state.clock += 8;
      if (pt.fights % 10 === 0) log(`${pt.fights} combats (${pt.wins} victoires) — zone ${z} — ${DW.state.bits} Bits, ${DW.state.bag.soin_p || 0} RAM PV`);
    }
    const m = lead();
    pt.sum = `Kuwagamon ${DW.state.flags.kuwagamon ? 'vaincu à ' + pt.kuwaAt + ' h (' + pt.kuwaTries + ' essai(s))' : 'NON vaincu'} ; cabines ${DW.state.flags.shellLair ? 'OK' : 'non'} ; Shellmon ${DW.state.flags.shellmon ? 'VAINCU' : 'non vaincu'} (${pt.shellTries} essai(s)), Tai ${(DW.state.kids || {}).tai ? 'délivré' : 'prisonnier'} ; ${hours()} h de jeu ; ${pt.fights} combats (${pt.wins} victoires, ${pt.losses} défaites), ${pt.trains} séances (${pt.moves} techniques apprises en classe), ${pt.rests || 0} repos, ${pt.buys || 0} RAM PV achetées (${pt.ramFight || 0} utilisées en combat), ${DW.state.bits} Bits ; ${m ? m.name + ' niveau ' + m.level : ''}`;
    pt.done = true;
    return pt.sum;
  };
})();
