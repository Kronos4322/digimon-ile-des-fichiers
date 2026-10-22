'use strict';
// =====================================================================
//  PÊCHE À LA CANNE (cadeau de Gomamon, maps/champs.js)
//  Face à l'eau (game/paysage.js), « Pêcher » : un lancer toutes les 30 minutes de jeu.
//  Chaque eau a ses poissons (mer, rivière, lac) ; les gros sortent la nuit et au petit matin.
//  Parfois, c'est un Digimon aquatique qui mord... et il n'est pas content !
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const COOL = 30;   // minutes de jeu entre deux lancers
  // poids des prises : [objet, poids, poids la nuit / au petit matin]
  const CATCH = {
    mer: [['digianchois', 40, 30], ['digivivaneau', 30, 30], ['digisilure', 4, 10], ['digibar', 1, 3]],
    riviere: [['digianchois', 30, 20], ['digitruite', 25, 25], ['digivivaneau', 18, 15], ['truite_noire', 4, 10], ['digisilure', 3, 6]],
    lac: [['digitruite', 30, 25], ['digivivaneau', 25, 20], ['digisilure', 8, 14], ['truite_noire', 6, 12], ['digibar', 1, 4]],
  };
  const BITERS = { mer: ['bukamon', 'gomamon', 'shellmon'], riviere: ['betamon', 'gomamon'], lac: ['betamon', 'gomamon', 'gekomon'] };
  const LAKES = new Set(['lac', 'marais', 'gel']);
  // le boss du chapitre 1 (Shellmon) et Gomamon (partenaire de Joe, encore un bébé au début de l'île) ne mordent qu'à partir
  // du chapitre 2 ; niveau d'un Digimon qui mord : celui des Digimon sauvages du coin (écart par stade comme game/wild.js)
  const DES_CH = { shellmon: 2, gomamon: 2 };
  const ECART = { 'Bébé': -4, 'Entraînement': -2, Disciple: 0, Champion: 2 };
  function niveau(map, sp) {
    const E = map.encounters || [], e = E.find(x => x.sp === sp), ec = x => ECART[DW.SPECIES[x].stage] || 0;
    if (e) return DW.rand(e.min, e.max);
    const ref = E.length ? E.reduce((a, x) => a + (x.min + x.max) / 2 - ec(x.sp), 0) / E.length
      : DW.Wild.TABLES[map.region] ? DW.Wild.TABLES[map.region][0] : ((DW.Care && DW.Care.lead()) || { level: 7 }).level - 1;
    return Math.max(3, Math.round(ref) + ec(sp) + DW.rand(-1, 1));
  }

  DW.Peche = {
    has: () => (st().bag || {}).canne > 0,
    kindAt(ow) {
      const m = ow.map, P = ow.p, [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[P.dir] || [0, 0];
      const sel = DW.Paysage && DW.Paysage.salee(m, P.x + dx, P.y + dy);   // (la mer : là où l'eau est salée)
      return sel === true ? 'mer' : LAKES.has(m.region) || sel === 'trouble' ? 'lac' : 'riviere';
    },
    async cast(ow, kind) {
      const s = st(), last = s.flags.rod;
      if (last != null && s.clock - last < COOL && s.clock >= last) { await say(`Les poissons se méfient... Attends encore ${Math.ceil(COOL - (s.clock - last))} minutes avant de relancer.`); return; }
      s.flags.rod = s.clock;
      DW.Audio.sfx('water');
      const r = await DW.Game.push(new DW.Activities.scenes.FishScene());
      s.clock += 10;
      if (r === 'early') { await say('Trop tôt ! Le bouchon a fait fuir les poissons.'); return; }
      if (r !== 'catch') { await say('Le poisson a filé avec l\'appât...'); return; }
      // un Digimon aquatique au bout de la ligne
      const ch = s.flags.chapter || 1, bit = (BITERS[kind] || []).filter(sp => DW.SPECIES[sp] && ch >= (DES_CH[sp] || 1));
      if (bit.length && Math.random() < 0.1) {
        const sp = DW.pick(bit);
        ow.shake = 0.5; DW.Audio.sfx('roar');
        await say(`Ça tire très fort... SPLASH ! Un ${DW.SPECIES[sp].name} jaillit de l'eau, furieux d'avoir été hameçonné !`);
        await ow.battle({ enemy: new DW.Digimon(sp, niveau(ow.map, sp)) });
        return;
      }
      const h = DW.Time.hour(), big = h >= 20 || h < 7;
      const T = CATCH[kind] || CATCH.riviere, tot = T.reduce((a, x) => a + x[big ? 2 : 1], 0);
      let k = Math.random() * tot, id = T[0][0];
      for (const x of T) { k -= x[big ? 2 : 1]; if (k <= 0) { id = x[0]; break; } }
      const extra = DW.giveItem(id, 1, false); DW.Audio.sfx('buy');
      await say(`Tu remontes : ${DW.ITEMS[id].name} !${DW.extraMsg(extra)}`);
      const pt = ow.partner;
      if (pt && Math.random() < 0.3) { pt.addHappy(1); await say(`${pt.name} applaudit ta prise ! (bonheur +1)`); }
    },
  };
})();
