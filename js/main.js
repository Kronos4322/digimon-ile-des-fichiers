'use strict';
// =====================================================================
//  DÉMARRAGE : lancement de partie et chargement des polices
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;

  DW.startGame = isNew => {
    const st = DW.state;
    // nouvelle partie (personnage original) : le début se JOUE dans la forêt (game/debut.js) — le bébé rejoint le héros là-bas
    if (isNew && st.hero === 'perso' && DW.Debut) {
      DW.giveItem('viande', 5); DW.giveItem('remede', 3);
      const [x, y] = DW.MapKit.zpt('clairiere', 18, 13);
      const ow = new DW.Overworld('clairiere', x, y, 'down');
      Game.replaceAll(ow);
      ow.runScript(() => DW.Debut.run(ow));
      return;
    }
    // nouvelle partie : le bébé de la lignée du héros est déjà là, à ses côtés, au réveil
    if (isNew && !st.party.length) {
      const sp = DW.heroLine().baby, m = new DW.Digimon(sp, 4);
      m.happy = 70; DW.addDigimon(m); st.flags.starter = sp;
      DW.giveItem('viande', 5); DW.giveItem('remede', 3);
    }
    const ow = new DW.Overworld(st.map, st.x, st.y, st.dir);
    Game.replaceAll(ow);
    DW.fade(0, 0.8);
    // nouvelle partie : réveil chez Jijimon (paupières qui s'ouvrent), puis le récit d'ouverture
    // (sauvegarde dès la fin du récit : fermer le jeu juste après ne fait pas tout recommencer)
    if (isNew) ow.runScript(async () => { await Game.push(new DW.WakeScene()); await DW.Story.opening(); DW.autosave(); });
  };

  // ------------------------------------------------------------ démarrage
  // ESSAI DEPUIS L'ÉDITEUR DE CARTES (seulement en local) : ?essai=carte,x,y ouvre directement la carte, avec un
  // Digimon prêté ; rien n'est sauvegardé (les vraies sauvegardes ne sont jamais touchées)
  const essai = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get('essai');
  if (essai) {
    const [id, x, y] = essai.split(','), st = DW.state;
    DW.save = () => true; DW.autosave = () => {};
    if (!st.party.length) { st.flags.starter = 'agumon'; DW.addDigimon(new DW.Digimon('agumon', 12)); }
    const M = DW.getMap(id), [x0, y0] = x != null ? [+x, +y] : [M.w >> 1, M.h >> 1];
    const go = () => { Game.replaceAll(new DW.Overworld(id, x0, y0, 'down')); DW.start(); };
    if (document.fonts && document.fonts.load) document.fonts.load('10px "DotGothic16"').then(go, go); else go();
    return;
  }
  const boot = () => { Game.push(new DW.TitleScene()); DW.start(); };
  if (document.fonts && document.fonts.load) {
    Promise.race([
      Promise.all([document.fonts.load('10px "DotGothic16"'), document.fonts.load('28px "Press Start 2P"')]),
      new Promise(r => setTimeout(r, 1500)),
    ]).then(boot, boot);
  } else boot();
})();
