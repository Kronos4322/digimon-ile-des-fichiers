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
    const zoneFor = lv => lv < 6 ? 'dunes' : lv < 8 ? 'bosquet' : lv < 9 ? 'plage' : lv < 10 ? 'lisiere' : lv < 11 ? 'sentier' : lv < 13 || !DW.state.flags.kuwagamon ? 'clairiere' : lv < 15 ? 'antre1' : 'antre2';
    const ENC = id => (DW.FIRST_ZONES && DW.FIRST_ZONES[id]) || DW.getMap(id).encounters;
    const fight = async (enemy, boss, ally) => {
      DW.timeScale = 4;
      let res = '?'; DW.ow.battle({ enemy, boss, canLose: !!boss, ally }).then(r => (res = r));
      for (let i = 0; i < 900 && res === '?'; i++) {
        const b = DW.Game.top();
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
      if (m.hp > 0 && m.hp < m.maxHp * 0.7) { if (!DW.state.bag.soin_p) { DW.state.bits -= 300; DW.giveItem('soin_p', 3); pt.buys = (pt.buys || 0) + 3; } DW.useItem('soin_p', m); }
      if ((m.thirst || 0) >= 60) { DW.state.bits -= 40; m.thirst = Math.max(0, m.thirst - 70); }
      if (DW.Life.sleepy(m) || m.tired >= 85) { await DW.Life.sleep(); log('dodo'); }
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
      if (need.length && m.tired < 60) {
        const k = need[0], sc = new DW.TrainingScene(m, k); sc.hits = [2, 1, 1]; sc.finish(); pt.trains++;
        if (pt.trains % 3 === 1) log(`entraînement ${DW.Training.STATS[k].name} (${m.tr[k]} / ${req[k]})`);
        await wait(80); continue;
      }
      // combat dans la zone de son niveau
      const z = zoneFor(m.level), list = ENC(z), e = DW.weighted(list.map(x => ({ ...x, w: x.w || 1 })));
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
