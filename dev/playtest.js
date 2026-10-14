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
    const zoneFor = lv => lv < 6 ? 'dunes' : lv < 8 ? 'bosquet' : lv < 9 ? 'plage' : lv < 10 ? 'lisiere' : lv < 11 ? 'sentier' : 'clairiere';
    const ENC = id => (DW.FIRST_ZONES && DW.FIRST_ZONES[id]) || DW.getMap(id).encounters;
    const fight = async (enemy, boss) => {
      DW.timeScale = 4;
      let res = '?'; DW.ow.battle({ enemy, boss, canLose: !!boss }).then(r => (res = r));
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
    for (let step = 0; step < (o.steps || 400) && !DW.state.flags.kuwagamon; step++) {
      const m = DW.state.party[0];
      if (!m) { log('plus de Digimon !'); break; }
      // soins : manger, toilettes, maladie, blessure, sommeil
      if (m.hunger >= 60) { if (!DW.state.bag.viande) { DW.state.bits -= 50; DW.giveItem('viande', 3); } DW.useItem('viande', m); }
      if (m.need >= 70) { m.need = 0; DW.state.clock += 5; }
      if (m.sick) { DW.state.bits -= 200; m.sick = 0; m.germs = 20; log('malade : médicament'); }
      if (m.hurt) { m.hurt = 0; }
      // un joueur se soigne : Viande (600 PV) sous 70 % de PV, rachetée au Bazar
      if (m.hp > 0 && m.hp < m.maxHp * 0.7) { if (!DW.state.bag.viande) { DW.state.bits -= 150; DW.giveItem('viande', 3); pt.buys = (pt.buys || 0) + 3; } DW.useItem('viande', m); }
      if (DW.Life.sleepy(m) || m.tired >= 85) { await DW.Life.sleep(); log('dodo'); }
      // Digivolution dès que possible
      const evo = DW.Evo.available(m);
      if (evo.length) { const to = evo[0].to; m.evolve(to); DW.state.seen[to] = DW.state.owned[to] = true; log(`DIGIVOLUTION → ${DW.SPECIES[to].name}`); continue; }
      // Kuwagamon (à partir du niveau 11, une tentative tous les 2 niveaux)
      if (m.level >= 11 && m.level !== pt.lastKuwa && m.level % 2 === 1) {
        pt.lastKuwa = m.level; pt.kuwaTries++; m.hp = m.maxHp; m.mp = m.maxMp;
        const r = await fight(new DW.Digimon('kuwagamon', 13), true);
        log(`KUWAGAMON : ${r === 'win' ? 'VICTOIRE' : 'défaite'}`);
        if (r === 'win') { DW.state.flags.kuwagamon = true; break; }
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
    pt.sum = `${DW.state.flags.kuwagamon ? 'Kuwagamon VAINCU' : 'Kuwagamon pas encore vaincu'} après ${hours()} h de jeu, ${pt.fights} combats (${pt.wins} victoires, ${pt.losses} défaites), ${pt.trains} séances d'entraînement, ${pt.buys || 0} Viandes achetées, ${pt.kuwaTries} tentative(s) ; ${m ? m.name + ' niveau ' + m.level : ''}`;
    pt.done = true;
    return pt.sum;
  };
})();
