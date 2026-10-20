'use strict';
// =====================================================================
//  FERME — cultures variées, vergers, épouvantail, foin, ruches, étal, serre, brouette
//  (Quartier des Champs). cropbed : v = type de culture (0 carottes, 1 choux, 2 citrouilles,
//  3 blé, 4 maïs, 5 tournesols, 6 tomates) ; frames : léger balancement au vent.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const SOIL = '#6a4428', SOIL_D = '#4a2c16';
  function bed(d) { d.rect(1, 8, 50, 29, SOIL, { round: 0.08, flat: true, tex: 0.3 }); for (let r = 0; r < 3; r++) d.deco.rect(3, 14 + r * 8, 46, 2.2, SOIL_D); }
  Object.assign(OBJ, {
    cropbed: { w: 52, h: 46, n: 7, frames: 2, fps: 1.2, draw(d, v, f) {
      bed(d);
      const sw = f ? 0.6 : -0.6;
      for (let r = 0; r < 3; r++) for (let x = 7; x < 48; x += 9) {
        const y = 13 + r * 8 + 8;
        if (v === 0) { d.tube([[x, y - 2], [x + sw, y - 9]], 1.2, 0.6, '#4aa046'); d.tube([[x, y - 2], [x - 2 + sw, y - 8]], 1, 0.5, '#5ab452'); d.deco.ell(x, y - 1, 1.6, 1, '#f08a20'); }
        else if (v === 1) { d.circ(x, y - 4, 4, '#7ac858', { shiny: true }); d.deco.circ(x, y - 4.4, 2.2, '#b8e890'); }
        else if (v === 2) { d.ell(x, y - 3, 4.6, 3.6, '#f08a20', 0, { shiny: true }); d.deco.line(x, y - 6.4, x, y - 0.4, 0.5, '#c8641a'); d.tube([[x, y - 6.6], [x + 1, y - 8.6]], 0.8, 0.6, '#4a7a2a'); }
        else if (v === 3) for (let k = -1; k <= 1; k++) { d.tube([[x + k * 2, y - 1], [x + k * 2 + sw, y - 13]], 0.8, 0.6, '#c8a848'); d.ell(x + k * 2 + sw, y - 13, 1, 2.4, '#e8c860'); }
        else if (v === 4) { d.tube([[x, y - 1], [x + sw, y - 16]], 1.6, 1, '#5aa848'); d.ell(x + 1.6 + sw, y - 10, 1.6, 3, '#f0d050'); d.ell(x - 2 + sw, y - 6, 3, 1, '#4a9a3a', -0.6); }
        else if (v === 5) { d.tube([[x, y - 1], [x + sw, y - 17]], 1.2, 1, '#4a9a3a'); d.circ(x + sw, y - 18, 3.6, '#f8c830', { shiny: true }); d.deco.circ(x + sw, y - 18, 1.6, '#6a4220'); }
        else { d.tube([[x, y - 1], [x + sw, y - 12]], 1, 0.8, '#4a9a3a'); for (const [a, b] of [[-1.6, -6], [1.6, -9], [0, -4]]) d.circ(x + a + sw, y + b, 1.6, '#e03a2a', { shiny: true }); }
      }
    } },
    fruittree: { w: 46, h: 64, n: 3, draw(d, v) {
      const fruit = ['#e03a3a', '#f0a020', '#4a8ae0'][v];
      d.tube([[23, 62], [23, 34]], 4, 3, '#6a4426');
      d.tube([[23, 40], [14, 30]], 2, 1.4, '#6a4426'); d.tube([[23, 38], [32, 30]], 2, 1.4, '#6a4426');
      for (const [x, y, r] of [[23, 20, 15], [11, 28, 10], [35, 28, 10], [23, 32, 11]]) d.circ(x, y, r, '#4a9a3a', { tex: 0.35 });
      for (const [x, y] of [[14, 22], [28, 16], [33, 30], [20, 30], [10, 32], [26, 26], [36, 22], [18, 14]]) d.circ(x, y, 2.4, fruit, { shiny: true });
    } },
    scarecrow: { w: 30, h: 50, n: 1, frames: 2, fps: 1, draw(d, v, f) {
      const s = f ? 1 : -1;
      d.tube([[15, 49], [15, 14]], 1.6, 1.6, '#6a4a2a'); d.tube([[3, 22 + s], [27, 22 - s]], 1.4, 1.4, '#6a4a2a');
      d.rect(9, 18, 12, 16, '#4a7ad8', { round: 0.2, tex: 0.3 }); d.deco.rect(13, 24, 4, 4, '#e8c860');
      d.circ(15, 12, 5, '#e8d8a0'); d.deco.circ(13, 11, 0.8, '#2a1a10', { unlit: true }); d.deco.circ(17, 11, 0.8, '#2a1a10', { unlit: true }); d.deco.curve([[12.6, 14], [15, 15.4], [17.4, 14]], 0.5, '#8a4a2a');
      d.poly([[6, 9], [15, 1], [24, 9]], '#b8843a', { shiny: true });
      for (const x of [3, 27]) for (let k = 0; k < 3; k++) d.tube([[x, 22], [x + (x < 15 ? -2 : 2), 25 + k]], 0.6, 0.4, '#e8c860');
    } },
    haybale: { w: 30, h: 24, n: 2, draw(d, v) {
      if (v) { d.ell(15, 14, 13, 9, '#e0bc5a', 0, { tex: 0.5 }); d.deco.ell(15, 14, 6, 4.4, '#c89a40'); }
      else { d.rect(2, 6, 26, 16, '#e0bc5a', { round: 0.15, tex: 0.5 }); d.deco.rect(2, 10, 26, 1.4, '#a8843a'); d.deco.rect(2, 17, 26, 1.4, '#a8843a'); }
    } },
    beehive: { w: 22, h: 34, n: 1, frames: 2, fps: 3, draw(d, v, f) {
      d.tube([[11, 33], [11, 24]], 1.4, 1.4, '#6a4a2a');
      for (let k = 0; k < 4; k++) d.ell(11, 21 - k * 4.4, 8 - k * 1.2, 3, '#e8b840', 0, { shiny: true });
      d.deco.ell(11, 18, 1.8, 1.4, '#4a2e10');
      for (const [x, y] of f ? [[3, 8], [18, 12], [6, 3]] : [[5, 6], [17, 9], [9, 2]]) { d.deco.ell(x, y, 1, 0.8, '#2a2a2a', 0, { unlit: true }); d.deco.ell(x, y - 0.8, 1, 0.5, '#ffffff', 0, { unlit: true }); }
    } },
    producestand: { w: 64, h: 56, n: 1, draw: DW.World.secours.boite(64, 56) },
    greenhouse: { w: 86, h: 70, n: 1, draw(d) {
      d.ell(43, 68, 40, 3, '#1a2a14', 0, { flat: true });
      d.rect(4, 26, 78, 42, '#8ec8c0', { round: 0.04, shiny: true }); d.deco.rect(6, 46, 74, 20, '#5a9a6a');
      d.poly([[2, 28], [43, 4], [84, 28]], '#b8e4e0', { shiny: true }); d.deco.poly([[20, 22], [43, 9], [50, 13], [27, 26]], '#e8f8f6');
      for (let x = 4; x <= 82; x += 13) d.deco.line(x, 26, x, 68, 0.8, '#3a5a54');
      for (let k = 0; k < 4; k++) d.deco.line(8 + k * 10, 26 - k * 5.6, 78 - k * 10, 26 - k * 5.6, 0.7, '#3a5a54');
      for (let x = 10; x < 80; x += 8) { if (x > 33 && x < 51) continue; d.deco.circ(x, 52, 4, '#3a8a3a'); d.deco.circ(x, 60, 3.6, '#4aa046'); d.deco.circ(x + 1, 50, 1.4, x % 16 ? '#e03a3a' : '#f8c830', { unlit: true }); d.deco.circ(x - 1.4, 58, 1.2, x % 24 ? '#f06a8a' : '#f8f0f0', { unlit: true }); }
      d.rect(36, 42, 14, 26, '#3a5a54', { round: 0.1 }); d.deco.rect(38, 44, 10, 24, '#a8dcd4'); d.deco.circ(46, 56, 0.8, '#f0d040', { unlit: true });
    } },
    wheelbarrow: { w: 34, h: 24, n: 1, draw(d) {
      d.circ(8, 18, 4.4, '#3a3a40'); d.deco.circ(8, 18, 1.6, '#8a8a92');
      d.poly([[4, 8], [26, 8], [22, 17], [8, 17]], '#c84a3a', { shiny: true });
      for (const [x, c] of [[10, '#f08a20'], [15, '#7ac858'], [20, '#e03a3a']]) d.circ(x, 7, 2.6, c, { shiny: true });
      d.tube([[24, 15], [33, 20]], 1, 1, '#6a4a2a'); d.tube([[18, 17], [20, 23]], 1, 1, '#6a4a2a');
    } },
  });
})();
