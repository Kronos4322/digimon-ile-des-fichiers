'use strict';
// Captures « avant / après » (dev) : mêmes vues du jeu, enregistrées dans dev/captures/<prefixe>_<vue>.png
//   await DEV.views('avant')  — ville, forêt, intérieur, combat, gros plan des personnages
(function () {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const save = async (cv, name) => { const b = await new Promise(r => cv.toBlob(r, 'image/png')); await fetch('/dev/save?name=' + name, { method: 'POST', body: b }); };
  const snap = async name => { await wait(700); await save(DW.canvas, name); };
  DEV.views = async prefix => {
    const S = DW.state; S.hero = 'perso'; S.flags.starter = 'koromon'; S.flags.chapter = 2; S.flags.homeIntro = true;
    S.look = { gender: 0, style: 0, hair: 0, shirt: 0, top: 1, head: 2, bag: 1, v2: true, baby: 'botamon' };
    S.party = []; DW.addDigimon(new DW.Digimon('agumon', 12)); S.recruits = {}; DW.Town.RECRUITS.slice(0, 9).forEach(r => S.recruits[r.id] = true);
    S.clock = Math.floor(S.clock / 1440) * 1440 + 13 * 60; S.weather = { type: 'clear', until: S.clock + 6000 };
    DW.MAPS.village.version = null;
    await DEV.ensure('village', 20, 12); DW.ow.banner.t = 99; await DW.fade(0, 0.05); await snap(prefix + '_ville.png');
    await DEV.ensure('sentier', 30, 40); DW.ow.banner.t = 99; await snap(prefix + '_foret.png');
    await DEV.ensure('plage', 40, 50); DW.ow.banner.t = 99; await snap(prefix + '_plage.png');
    await DEV.ensure('maison', 9, 9); DW.ow.banner.t = 99; await snap(prefix + '_interieur.png');
    // gros plan : le héros et des Digimon (taille réelle ×4)
    const cv = document.createElement('canvas'); cv.width = 960; cv.height = 360; const g = cv.getContext('2d');
    g.fillStyle = '#6ab05a'; g.fillRect(0, 0, 960, 360); g.imageSmoothingEnabled = false;
    const h = DW.Sprites.hero('down', 0); g.drawImage(h.img, 20, 40, h.w * 6, h.h * 6);
    let x = 220; for (const sp of ['agumon', 'gabumon', 'greymon', 'garurumon']) { const s = DW.Sprites.battle(sp); const k = Math.min(3, 300 / s.h, 170 / s.w); g.drawImage(s.img, x, 330 - s.h * k, s.w * k, s.h * k); x += s.w * k + 10; }
    await save(cv, prefix + '_personnages.png');
    return 'ok';
  };
})();
