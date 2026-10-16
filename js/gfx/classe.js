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
    // gymnase (4×2) : salle de sport au toit arrondi, murs bleu acier, grandes portes, fenêtres hautes, enseigne
    // v0 : ouvert ; v1 : fermé (planches clouées en travers des portes, panneau « FERMÉ ») tant que Leomon n'est pas revenu
    gymnase: { w: 76, h: 74, n: 2, lights: [[38, 54, 16]], draw(d, v) {
      d.ell(38, 72, 36, 3, '#1a2028', 0, { flat: true });
      d.rect(4, 30, 68, 42, '#7a92b0', { round: 0.04, tex: 0.2 });
      for (let x = 10; x < 70; x += 8) d.deco.line(x, 32, x, 71, 0.6, '#6a809c');           // bardage
      d.deco.rect(4, 64, 68, 8, '#5a6a80');                                                    // soubassement
      d.poly([[0, 32], [6, 18], [20, 10], [38, 7], [56, 10], [70, 18], [76, 32]], '#c84a3a', { shiny: true });   // toit arrondi
      for (let k = 1; k < 6; k++) d.deco.line(6 + k * 11, 30, 10 + k * 9.5, 10, 0.6, '#a83a2a');
      for (let x = 10; x < 66; x += 12) { d.deco.rect(x, 36, 8, 7, '#e8f0f8'); d.deco.rect(x + 1, 37, 6, 5, '#8ac8f0'); }   // fenêtres hautes
      d.deco.rect(26, 48, 24, 24, '#3a4a5a'); d.deco.rect(27.5, 49.5, 10, 22, '#c88a3a'); d.deco.rect(38.5, 49.5, 10, 22, '#c88a3a');   // grandes portes
      d.deco.circ(36, 61, 1, '#f0d070'); d.deco.circ(40, 61, 1, '#f0d070');
      d.rect(16, 21, 44, 9, '#2a3a5a', { round: 0.2 }); d.deco.rect(18, 23, 40, 5, '#3a4e74');
      const T = DW.World.signText; if (T) T(d, 'GYMNASE', 22, 23.4, '#ffe070', 1);
      if (v === 1) {   // fermé : deux planches en croix sur les portes, un écriteau
        d.deco.poly([[25, 52], [28, 49], [51, 67], [48, 70]], '#8a6a42'); d.deco.poly([[48, 49], [51, 52], [28, 70], [25, 67]], '#9a7a4e');
        for (const [x, y] of [[27, 51], [49, 51], [27, 68], [49, 68]]) d.deco.circ(x, y, 0.8, '#3a3a3a');
        d.deco.rect(29, 55, 18, 7, '#e8dcc0'); d.deco.rect(29, 55, 18, 1, '#b8a888'); if (T) T(d, 'FERMÉ', 30.5, 56.2, '#c83a2a', 1);
        for (const x of [12, 24, 36, 48, 60]) if (x < 66) d.deco.rect(x + 1, 37, 6, 5, '#5a6a7a');   // vitres éteintes
      }
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
