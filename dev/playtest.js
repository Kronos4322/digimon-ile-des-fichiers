'use strict';
// =====================================================================
//  PARTIE TEST DU CHAPITRE 1 (joueur automatique) — mesure le rythme réel du jeu
//  À lancer dans la console du jeu :
//    const s = document.createElement('script'); s.src = 'dev/playtest.js'; document.body.appendChild(s);
//    puis  DEV.playtest()  (le journal se remplit dans DEV.pt.log ; résumé dans DEV.pt.sum)
//  Le joueur automatique joue avec les vraies règles : il nourrit, couche et soigne son Digimon, l'entraîne
//  pour la Digivolution visée, combat dans l'arène (il attaque sans esquiver, comme un débutant), fait
//  digivoluer dès que possible, et tente Kuwagamon (niveau 13) à partir du niveau 11.
// =====================================================================
(function () {
  const DEV = window.DEV = window.DEV || {};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const key = code => { window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code })), 40); };
  const hours = () => ((DW.state.clock - 8 * 60) / 60).toFixed(1);
  DEV.playtest = async (o = {}) => {
    window.requestAnimationFrame = f => setTimeout(() => f(performance.now()), 16);
    const pt = DEV.pt = { log: [], fights: 0, wins: 0, losses: 0, trains: 0, kuwaTries: 0, done: false };
    const log = t => { const m = DW.state.party[0]; pt.log.push(`[${hours()} h] ${m ? m.name + ' N.' + m.level : ''} — ${t}`); };
    // instantanés : fondus, dialogues et choix (le joueur répond « oui »)
    DW.fade = async () => {}; DW.say = async () => {}; DW.ask = async q => (/Digivice vibre/.test(q) ? 1 : 0); DW.choose = async () => 0;
    // partie neuve, comme après le récit d'ouverture
    const st = DW.state = DW.newState(); st.name = 'Tai'; st.hero = st.hero || 'tai';
    const baby = DW.heroLine ? DW.heroLine().baby : 'botamon', m0 = new DW.Digimon(baby, 4); m0.happy = 70; DW.addDigimon(m0);
    st.flags.starter = baby; st.flags.arenaTuto = true; st.flags.tour = true; DW.giveItem('viande', 5); DW.giveItem('remede', 3);
    DW.Game.replaceAll(new DW.Overworld('dunes', 30, 26, 'down'));
    await wait(600);
    log(`départ avec ${DW.SPECIES[baby].name}`);
    // un joueur avisé combat des Digimon UN PEU PLUS FORTS que le sien (plus d'EXP et de Bits) : la zone dont les
    // adversaires dépassent son niveau d'un ou deux crans
    const ZONES = ['dunes', 'bosquet', 'plage', 'lisiere', 'geants', 'sentier', 'clairiere', 'antre1', 'antre2'];
    const zoneFor = lv => {
      const ok = ZONES.filter(z => !z.startsWith('antre') || DW.state.flags.kuwagamon);
      const maxOf = z => Math.max(...ENC(z).map(e => e.max));
      return ok.find(z => maxOf(z) >= lv + 1) || ok[ok.length - 1];
    };
    const ENC = id => (DW.FIRST_ZONES && DW.FIRST_ZONES[id]) || DW.getMap(id).encounters;
    const fight = async (enemy, boss, ally) => {
      DW.timeScale = 4;
      let res = '?'; DW.ow.battle({ enemy, boss, canLose: !!boss, ally }).then(r => (res = r));
      for (let i = 0; i < 900 && res === '?'; i++) {
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
        if (b.arena) { if (b.mode === 'live' && !b.B.p.cast && b.B.p.cd <= 0) { key('Space'); await wait(50); key('Space'); } else if (b.mode === 'msg' || b.mode === 'charge') key('Space'); }
        else if (b !== DW.ow) key('Space');
        await wait(70);
      }
      DW.timeScale = 1;
      for (let i = 0; i < 30 && DW.Game.top() !== DW.ow; i++) { key('Space'); await wait(150); }
      return res;
    };
    for (let step = 0; step < (o.steps || 400) && !DW.state.flags.shellmon; step++) {
      const m = DW.state.party[0];
      if (!m) { log('plus de Digimon !'); break; }
      // soins : manger, toilettes, maladie, blessure, sommeil
      // un joueur attentif nourrit plus souvent quand la Digivolution visée demande un Digimon bien en chair
      const nx = (DW.EVO[m.sp] || [])[0], fatNeed = nx && nx.req.fatMin != null && (m.fat || 0) < nx.req.fatMin;
      if (m.hunger >= (fatNeed ? 30 : 60)) { if (!DW.state.bag.viande) { DW.state.bits -= 50; DW.giveItem('viande', 3); } DW.useItem('viande', m); }
      if (m.need >= 70) { m.need = 0; DW.state.clock += 5; }
      if (m.hp <= 0) { m.heal(); DW.state.clock += 60; log('K.O. : repos chez Jijimon'); }   // un joueur rentre se soigner
      if (m.sick) { DW.state.bits -= 200; m.sick = 0; m.germs = 20; log('malade : médicament'); }
      if (m.hurt) { m.hurt = 0; }
      // un joueur se soigne : RAM PV (500 PV) sous 70 % de PV, achetée au distributeur ; il boit quand il a soif
      if ((DW.state.bag.soin_p || 0) < 3 && DW.state.bits >= 300) { DW.state.bits -= 300; DW.giveItem('soin_p', 3); pt.buys = (pt.buys || 0) + 3; }
      if (m.hp > 0 && m.hp < m.maxHp * 0.7) { if (!DW.state.bag.soin_p) { DW.state.bits -= 300; DW.giveItem('soin_p', 3); pt.buys = (pt.buys || 0) + 3; } DW.useItem('soin_p', m); }
      // soif : une Eau fraîche (distributeur, 40 Bits) ; sans Bits, il boit à la rivière (gratuit, mais 10 minutes de marche)
      if ((m.thirst || 0) >= 55) { if (!DW.state.bag.eau_fraiche && DW.state.bits >= 80) { DW.state.bits -= 80; DW.giveItem('eau_fraiche', 2); } if (DW.state.bag.eau_fraiche) DW.useItem('eau_fraiche', m); else { DW.Care.drink(m, 70); DW.state.clock += 10; } }
      // la nuit, il dort chez Jijimon : une nuit là-bas efface un K.O.
      if (DW.Life.sleepy(m) || m.tired >= 85) { await DW.Life.sleep(); const k0 = m.kos || 0; if (k0 > 0) m.kos = k0 - 1; log(`nuit chez Jijimon${k0 ? " : un K.O. s'efface (" + m.kos + '/3)' : ''}`); }
      // Digivolution dès que possible
      const evo = DW.Evo.available(m);
      if (evo.length) { const to = evo[0].to; m.evolve(to); DW.state.seen[to] = DW.state.owned[to] = true; log(`DIGIVOLUTION → ${DW.SPECIES[to].name}`); continue; }
      // Kuwagamon (boss du milieu, à partir du niveau 11, une tentative tous les 2 niveaux)
      if (!DW.state.flags.kuwagamon && m.level >= 11 && m.level !== pt.lastKuwa && m.level % 2 === 1) {
        pt.lastKuwa = m.level; pt.kuwaTries++; m.hp = m.maxHp; m.mp = m.maxMp;
        const r = await fight(new DW.Digimon('kuwagamon', 11), true);
        log(`KUWAGAMON : ${r === 'win' ? 'VICTOIRE' : 'défaite'}`);
        if (r === 'win') { DW.state.flags.kuwagamon = true; pt.kuwaAt = hours(); }
        m.hp = m.maxHp; continue;
      }
      // Shellmon (boss final, niveau 16, Tai et Greymon arrivent à mi-vie), après Kuwagamon, une tentative par niveau
      if (DW.state.flags.kuwagamon && m.level >= 14 && m.level !== pt.lastShell) {
        pt.lastShell = m.level; pt.shellTries = (pt.shellTries || 0) + 1; m.hp = m.maxHp; m.mp = m.maxMp;
        const r = await fight(new DW.Digimon('shellmon', 16), true, { at: 0.5, from: 'agumon', sp: 'greymon', lvl: 16, hero: 'tai', name: 'Tai', move: 'mega_flamme', join: 'Tai arrive !' });
        log(`SHELLMON : ${r === 'win' ? 'VICTOIRE' : 'défaite'}`);
        if (r === 'win') { DW.state.flags.shellmon = true; break; }
        m.hp = m.maxHp; continue;
      }
      // entraînement pour la Digivolution visée (si le potentiel le permet), sinon combat
      const next = (DW.EVO[m.sp] || [])[0], req = next ? next.req : {};
      const need = Object.keys(DW.Training.STATS).filter(k => req[k] && m.tr[k] < req[k] && !DW.Training.blocked(m, k));
      // il s'entraîne aussi pour se renforcer (Attaque, Défense, Vitesse) quand la Digivolution visée est prête côté points
      // + une leçon d'Intelligence de temps en temps (à l'école : chance d'apprendre une technique) ; sinon renforcer ses stats
      if (m.tired < 40 && pt.trains % 4 === 3 && !DW.Training.blocked(m, 'int')) need.unshift('int');
      else if (!need.length && m.tired < 40 && (pt.trains % 3 !== 2 || Math.random() < 0.4)) { const k = ['atk', 'def', 'spd', 'hp'][pt.trains % 4]; if (!DW.Training.blocked(m, k)) need.push(k); }
      if (need.length && m.tired < 60) {
        const k = need[0], evoGoal = req[k] && m.tr[k] < req[k];
        DW.Training.opts = { mode: evoGoal ? 'evo' : 'stat', level: DW.Training.LEVELS[1] };
        // la séance se joue AU POSTE du Terrain d'entraînement (comme sur le téléphone) ; l'Intelligence, à l'école
        let sc;
        if (k !== 'int') {
          if (DW.ow.mapId !== 'gym') DW.ow.load('gym', ...DW.MapKit.zpt('gym', 16, 9), 'down');
          const M = DW.ow.map, eqs = k === 'atk' ? ['dummy', 'punchbag'] : [null], eq = eqs[pt.trains % eqs.length];
          let spot = null;
          if (eq === 'punchbag') { const b = M.objects.find(o => o.kind === 'punchbag'); spot = { x: b.x, y: b.y + (b.h || 1) - 1, eq }; }
          else for (let y = 0; y < M.h && !spot; y++) for (let x = 0; x < M.w; x++) if (DW.World.info(DW.ow.tileAt(x, y)).train === k) { spot = { x, y }; break; }
          DW.ow.load('gym', spot.x - 1, spot.y + 1, 'up'); await wait(150);
          sc = new DW.FieldTrainingScene(m, k, spot);
        } else sc = new DW.TrainingScene(m, k);
        DW.Game.push(sc);
        await wait(900); sc.start(); await wait(1300);
        for (let j = 0; j < 3; j++) {
          await wait(900);
          const r = Math.random() < 0.35 ? 2 : Math.random() < 0.8 ? 1 : 0;
          if (sc.rep) { while (sc.anim) await wait(50); if (sc.eq === 'datacrystal') sc.charge = 0.7; sc.rep(r); } else sc.hit(r);
        }
        while (sc.state !== 'done') await wait(60);
        await wait(1300); sc.close('stop'); pt.trains++;
        if (k === 'int' && DW.Classe) { const n0 = m.moves.length; await DW.Classe.after(m, sc.score || 4); if (m.moves.length > n0 || pt.learned !== m.moves.map(x => x.id).join()) log(`leçon à l'école : techniques ${m.moves.map(x => DW.MOVES[x.id].name).join(', ')}`); pt.learned = m.moves.map(x => x.id).join(); }
        log(`entraînement ${DW.Training.STATS[k].name}${sc.eq ? ' (' + sc.eq + ')' : ''} — ${evoGoal ? 'points ' + m.tr[k] + ' / ' + req[k] : DW.Training.STATS[k].stat + ' ' + m.stat(k)} — fatigue ${Math.round(m.tired)} %`);
        await wait(200); continue;
      }
      // stratégie : on ne part au combat qu'en pleine forme (sinon une heure de repos chez Jijimon) ;
      // avec 2 K.O., plus AUCUN combat avant d'avoir dormi chez Jijimon (au 3e, il meurt)
      if ((m.kos || 0) >= 2 || m.hp < m.maxHp * 0.9 || m.tired >= 50) {
        const before = m.kos || 0; await DW.Life.restOrSleep(); pt.rests = (pt.rests || 0) + 1;
        if (DW.Life.sleepy(m) === false && before >= 2 && pt.rests % 4 === 1) log(`2 K.O. : pas de combat, il se repose (fatigue ${Math.round(m.tired)} %)`);
        await wait(60); continue;
      }
      // combat : un cran au-dessus de son niveau, sauf après un K.O. (zone de son niveau)
      const z = zoneFor(m.level - ((m.kos || 0) ? 1 : 0)), list = ENC(z), e = DW.weighted(list.map(x => ({ ...x, w: x.w || 1 })));
      if (DW.ow.mapId !== z) DW.ow.load(z, 20, 20, 'down');
      const r = await fight(new DW.Digimon(e.sp, DW.rand(e.min, e.max)), false);
      pt.fights++; if (r === 'win') pt.wins++; else if (r === 'lose') { pt.losses++; log(`défaite contre ${DW.SPECIES[e.sp].name} (K.O. ${m.kos || 0}/3)`); }
      DW.state.clock += 8;
      if (pt.fights % 10 === 0) log(`${pt.fights} combats (${pt.wins} victoires) — zone ${z}`);
    }
    const m = DW.state.party[0];
    pt.sum = `Kuwagamon ${DW.state.flags.kuwagamon ? 'vaincu à ' + pt.kuwaAt + ' h' : 'NON vaincu'} ; Shellmon ${DW.state.flags.shellmon ? 'VAINCU' : 'non vaincu'} après ${hours()} h de jeu (${pt.shellTries || 0} essai(s)), ${pt.fights} combats (${pt.wins} victoires, ${pt.losses} défaites), ${pt.trains} séances d'entraînement, ${pt.buys || 0} RAM PV achetées, ${DW.state.bits} Bits à la fin, ${pt.kuwaTries} tentative(s) ; ${m ? m.name + ' niveau ' + m.level : ''}`;
    pt.done = true;
    return pt.sum;
  };
})();
