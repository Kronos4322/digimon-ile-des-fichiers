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
  const boot = () => { Game.push(new DW.TitleScene()); DW.start(); };
  if (document.fonts && document.fonts.load) {
    Promise.race([
      Promise.all([document.fonts.load('10px "DotGothic16"'), document.fonts.load('28px "Press Start 2P"')]),
      new Promise(r => setTimeout(r, 1500)),
    ]).then(boot, boot);
  } else boot();
})();
