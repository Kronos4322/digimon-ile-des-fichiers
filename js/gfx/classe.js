'use strict';
// =====================================================================
//  SALLE DE CLASSE DU TERRAIN D'ENTRAÎNEMENT — graphismes
//  ecole (4×2) : petite école de bois au Terrain d'entraînement ; tableau (3×2, mural) ; pupitre (1×1)
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  Object.assign(OBJ, {
    ecole: { w: 76, h: 74, n: 1, lights: [[38, 50, 16]], draw(d) {
      d.ell(38, 72, 36, 3, '#2a2418', 0, { flat: true });
      d.rect(6, 34, 64, 38, '#d8b878', { round: 0.04, tex: 0.25 });
      for (let y = 38; y < 72; y += 5) d.deco.line(6, y, 70, y, 0.6, '#b8945a');
      d.deco.rect(30, 48, 16, 24, '#7a4a28'); d.deco.rect(31.5, 49.5, 13, 22, '#9a6038'); d.deco.circ(42, 60, 1, '#f0d070');   // porte
      for (const x of [12, 52]) { d.deco.rect(x, 44, 12, 12, '#f4ead4'); d.deco.rect(x + 1.5, 45.5, 9, 9, '#8ad0f0'); d.deco.line(x + 6, 45, x + 6, 55, 0.7, '#f4ead4'); }
      d.poly([[0, 38], [38, 12], [76, 38], [70, 38], [38, 18], [6, 38]], '#b84a3a', { shiny: true });
      d.poly([[6, 38], [38, 18], [70, 38]], '#c85a48', { tex: 0.2 });
      d.rect(32, 4, 12, 14, '#d8b878', { round: 0.1 }); d.poly([[30, 6], [38, 0], [46, 6]], '#b84a3a');
      d.circ(38, 11, 3.4, '#e8c040', { shiny: true });   // cloche
      d.rect(20, 26, 36, 9, '#2e5a3e', { round: 0.2 }); d.deco.rect(22, 28, 32, 5, '#3e6e4e');
      const W = DW.World.signText; if (W) W(d, 'ECOLE', 28.5, 28.4, '#f0f0e0', 1);
    } },
    tableau: { w: 56, h: 36, n: 1, draw(d) {
      d.rect(0, 2, 56, 30, '#7a5230', { round: 0.05 });
      d.deco.rect(3, 5, 50, 24, '#2e5a3e'); d.deco.rect(3, 5, 50, 2, '#3e6e4e');
      for (let k = 0; k < 4; k++) d.deco.line(8, 11 + k * 5, 8 + 20 + (k * 9) % 18, 11 + k * 5, 0.7, '#e8ecdc', { unlit: true });
      d.deco.circ(44, 16, 5, '#e8ecdc', { unlit: true }); d.deco.circ(44, 16, 3.6, '#2e5a3e'); d.deco.line(44, 16, 47, 13, 0.6, '#e8ecdc', { unlit: true });
      d.rect(6, 30, 44, 3, '#a07a4a');
    } },
    pupitre: { w: 22, h: 24, n: 2, draw(d, v) {
      d.ell(11, 22, 9, 1.8, '#2a2418', 0, { flat: true });
      d.tube([[4, 22], [4, 12]], 1.2, 1.2, '#5a4a3a'); d.tube([[18, 22], [18, 12]], 1.2, 1.2, '#5a4a3a');
      d.rect(1, 9, 20, 5, '#c89a5a', { round: 0.2, tex: 0.2 });
      d.deco.rect(5, 9.6, 6, 3.6, v ? '#e84a4a' : '#4a8ae8'); d.deco.rect(12, 10, 5, 1, '#3a3a3a');   // cahier, crayon
    } },
  });
})();
