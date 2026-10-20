'use strict';
// =====================================================================
//  DÉMARRAGE : lancement de partie et chargement des polices
// =====================================================================
(function () {
  const { UI, Game } = DW;
  const W = DW.W, H = DW.H;

  // les images des décors (gfx/textures.js) se chargent pendant l'écran titre ; si on lance la partie (ou l'introduction)
  // avant la fin, un écran de chargement avec sa barre attend qu'elles soient prêtes. On l'appelle sur un écran noir :
  // il apparaît en fondu, puis le noir revient avant la suite.
  class ChargementScene extends DW.Scene {
    update() { if (!DW.Textures || DW.Textures.fini) this.close(); }
    draw(c) {
      c.fillStyle = '#070a14'; c.fillRect(0, 0, W, H);
      const T = DW.Textures, tot = T ? Object.values(T.LISTE).flat().length : 1, n = T ? Object.keys(T.img).length : tot, k = Math.min(1, n / tot);
      UI.text(c, 'Chargement des décors...', W / 2, H / 2 - 14, { size: 10, align: 'center', bold: true, color: '#ffe680' });
      c.fillStyle = '#1a2440'; c.fillRect(W / 2 - 80, H / 2, 160, 8);
      c.fillStyle = '#5ad08a'; c.fillRect(W / 2 - 80, H / 2, Math.round(160 * k), 8);
      UI.text(c, Math.round(k * 100) + ' %', W / 2, H / 2 + 22, { size: 8, align: 'center', color: '#9ab0e8' });
    }
  }
  DW.attendreDecors = async () => {
    if (!DW.Textures || DW.Textures.fini) return;
    DW.fade(0, 0.25);
    await Game.push(new ChargementScene());
    await DW.fade(1, 0.2);
  };
  DW.startGame = async isNew => {
    await DW.attendreDecors();
    // personnage créé avec le kit : le petit sprite reprend ses vraies couleurs (aussi pour les parties déjà commencées)
    const st = DW.state;
    if (st.hero === 'perso' && st.perso && DW.Perso) {
      await DW.Perso.charger();
      const cols = DW.Perso.couleurs(st.perso);
      if (cols && st.look) st.look = { ...st.look, cols };
    }
    lancer(isNew);
  };
  const lancer = isNew => {
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
    const [id, x, y] = essai.split(','), st = DW.state, chap = +(new URLSearchParams(location.search).get('chap') || 0);
    DW.save = () => true; DW.autosave = () => {};
    // chapitre de l'essai : 0 = tout ouvert (aucun passage fermé), sinon les règles de ce chapitre
    if (chap > 0) st.flags.chapter = chap; else DW.essaiLibre = true;
    if (!st.party.length) { st.flags.starter = 'agumon'; DW.addDigimon(new DW.Digimon('agumon', 12)); }
    // (si l'essai échoue, on l'écrit à l'écran au lieu d'un écran noir)
    const oups = e => {
      const p = document.createElement('pre');
      p.style.cssText = 'position:fixed;left:12px;top:12px;right:12px;z-index:99;padding:10px;background:#120a14;color:#ff9a9a;font:13px monospace;white-space:pre-wrap';
      p.textContent = `Essai impossible sur « ${id} » : ${e && e.message}\n(enregistre dans l'atelier, puis relance l'essai)\n\n${String(e && e.stack || '').split('\n').slice(0, 6).join('\n')}`;
      document.body.appendChild(p); console.error(e);
    };
    const go = () => { try { const M = DW.getMap(id), [x0, y0] = x != null ? [+x, +y] : [M.w >> 1, M.h >> 1]; Game.replaceAll(new DW.Overworld(id, x0, y0, 'down')); DW.start(); } catch (e) { oups(e); } };
    if (!DW.MAPS[id]) { oups(new Error('carte inconnue')); return; }
    const tex = DW.Textures ? DW.Textures.charge : Promise.resolve();   // (images dessinées : gfx/textures.js)
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('10px "DotGothic16"'), tex]).then(go, go); else tex.then(go, go);
    return;
  }
  const boot = () => { Game.push(new DW.TitleScene()); DW.start(); };
  if (document.fonts && document.fonts.load) {
    // (l'écran titre n'attend que les polices, au plus 1,5 s ; les images des décors arrivent pendant ce temps)
    Promise.race([Promise.all([document.fonts.load('10px "DotGothic16"'), document.fonts.load('28px "Press Start 2P"')]), new Promise(r => setTimeout(r, 1500))]).then(boot, boot);
  } else boot();
})();
