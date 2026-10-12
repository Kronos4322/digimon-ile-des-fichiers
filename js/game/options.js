'use strict';
// =====================================================================
//  OPTIONS DU JOUEUR (enregistrées à part de la sauvegarde)
// =====================================================================
(function () {
  const KEY = 'digimon_ile_des_fichiers_options';
  const SPEEDS = [{ name: 'Lente', cps: 30 }, { name: 'Normale', cps: 60 }, { name: 'Rapide', cps: 120 }, { name: 'Instantanée', cps: 99999 }];
  const O = DW.Options = {
    textSpeed: 1,
    battleMode: 0, // 0 : manuel (on choisit chaque attaque)  1 : ordres (le Digimon agit seul, comme dans Digimon World 1)
    SPEEDS,
    cps() { return SPEEDS[this.textSpeed].cps; },
    // avance rapide : Maj maintenu (ou ESPACE maintenu un instant)
    fastForward(holdOk) { return DW.Input.isDown('run') || holdOk > 0.35; },
    load() { try { Object.assign(this, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* options par défaut */ } },
    save() { try { localStorage.setItem(KEY, JSON.stringify({ textSpeed: this.textSpeed, muted: DW.Audio.muted, battleMode: this.battleMode })); } catch (e) { /* stockage indisponible */ } },
  };
  O.load();
  if (O.muted) DW.Audio.muted = true;
})();
