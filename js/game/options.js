'use strict';
// =====================================================================
//  OPTIONS DU JOUEUR (enregistrées à part de la sauvegarde)
// =====================================================================
(function () {
  const KEY = 'digimon_ile_des_fichiers_options';
  const SPEEDS = [{ name: 'Lente', cps: 30 }, { name: 'Normale', cps: 60 }, { name: 'Rapide', cps: 120 }, { name: 'Instantanée', cps: 99999 }];
  const O = DW.Options = {
    textSpeed: 1,
    SPEEDS,
    cps() { return SPEEDS[this.textSpeed].cps; },
    // avance rapide : Maj maintenu (ou ESPACE maintenu un instant) ; l'interrupteur COURIR du téléphone n'en est pas un
    fastForward(holdOk) { return DW.Input.isDown('run') || holdOk > 0.35; },
    load() { try { Object.assign(this, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* options par défaut */ } },
    save() { try { localStorage.setItem(KEY, JSON.stringify({ textSpeed: this.textSpeed, muted: DW.Audio.muted, musique: DW.Audio.volMus, bruitages: DW.Audio.volFx })); } catch (e) { /* stockage indisponible */ } },
  };
  O.load();
  delete O.classic; delete O.battleMode;   // anciens réglages retirés (arène temps réel, mode « Ordres »)
  if (O.muted) DW.Audio.muted = true;
  // volumes de la musique et des bruitages (0 à 1 ; par défaut 0,5 et 0,9 : les réglages d'avant)
  const vol = (v, d) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
  DW.Audio.volumes(vol(O.musique, 0.5), vol(O.bruitages, 0.9));
})();
