'use strict';
// =====================================================================
//  QUARTIERS DE LA VILLE — champs, moulin, cascade, poste, décor animé
//  frames : nombre d'images d'animation (draw(d, v, f)), fps : vitesse
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;
  const WOOD = '#9a6a3a', WOOD_D = '#5a3a1e', WOOD_L = '#c8945a';
  // enseignes : lettres en pixels (3×5), peintes sur un volume existant
  const GLYPH = { A: '010101111101101', B: '110101110101110', C: '011100100100011', E: '111100110100111', N: '101111111111101', Q: '010101101110011', U: '101101101101111', W: '101101111111101', O: '010101101101010', J: '001001001101010', D: '110101101101110', I: '111010010010111', T: '111010010010010', L: '100100100100111',
    P: '110101110100100', G: '011100101101011', X: '101101010101101', S: '011100010001110', R: '110101110101101', M: '101111111101101', H: '101101111101101', V: '101101101101010', 'Â': '010101111101101' };
  const sign = (d, s, x, y, col, k = 1) => { [...s].forEach((ch, i) => { const g = GLYPH[ch]; if (g) for (let p = 0; p < 15; p++) if (g[p] === '1') d.deco.rect(x + (i * 4 + (p % 3)) * k, y + Math.floor(p / 3) * k, k, k, col, { unlit: true }); }); };
  DW.World.signText = sign;
  const shadeK = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k))); return '#' + [16, 8, 0].map(b => f((n >> b) & 255).toString(16).padStart(2, '0')).join(''); };
  const rot = (cx, cy, a, pts) => pts.map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);

  Object.assign(OBJ, {
    // ---------------------------------------------------------- moulin à vent (ailes qui tournent)
    // v0 : à l'abandon (ailes déchirées, immobiles)  v1 : en marche
    windmill: { w: 76, h: 112, n: 2, frames: 6, fps: 5, lights: [[38, 70, 16]], draw(d, v, f) {
      d.ell(38, 108, 26, 4, '#3a2a18', 0, { flat: true });
      d.rect(16, 96, 44, 12, '#a8a296', { round: 0.2, tex: 0.35 });
      d.poly([[20, 100], [26, 46], [50, 46], [56, 100]], '#eadcb6', { tex: 0.15 });
      for (let y = 54; y < 100; y += 7) d.deco.line(20 + (100 - y) * 0.11, y, 56 - (100 - y) * 0.11, y, 0.7, '#c8b48a');
      d.deco.ell(38, 92, 6, 6, '#6a3c1a'); d.deco.rect(32, 92, 12, 9, '#6a3c1a');
      d.deco.rect(34, 68, 8, 8, '#4a2e16'); d.deco.rect(35, 69, 6, 6, '#ffd88a');
      d.poly([[22, 50], [38, 28], [54, 50]], '#b8583a', { shiny: true });
      for (let y = 36; y < 50; y += 4) d.deco.line(38 - (y - 28) * 0.72, y, 38 + (y - 28) * 0.72, y, 0.7, '#8a3a24');
      // ailes
      const a0 = v ? (f / 6) * (Math.PI / 2) : 0.35, hub = [38, 40];
      for (let k = 0; k < 4; k++) {
        const a = a0 + k * Math.PI / 2;
        d.poly(rot(hub[0], hub[1], a, [[2, -1], [34, -1], [34, 1], [2, 1]]), WOOD_D, { noshadow: true });
        if (v || k % 2) d.poly(rot(hub[0], hub[1], a, v ? [[10, 1], [34, 1], [34, 9], [10, 7]] : [[10, 1], [22, 1], [18, 6], [10, 5]]), v ? '#f4ecd8' : '#b8a888', { noshadow: true, tex: 0.1 });
        d.deco.poly(rot(hub[0], hub[1], a, [[10, 4], [34, 4], [34, 4.8], [10, 4.6]]), '#c8b48a');
      }
      d.circ(38, 40, 3.6, '#7a5230');
    } },
    // ---------------------------------------------------------- cascade (sur une falaise)
    waterfall: { w: 36, h: 56, n: 1, frames: 4, fps: 8, draw(d, v, f) {
      d.blob([[0, 52], [2, 8], [8, 0], [10, 50]], '#8a8478', { tex: 0.35 });
      d.blob([[26, 50], [28, 0], [34, 8], [36, 52]], '#7e786c', { tex: 0.35 });
      d.rect(8, 0, 20, 46, '#4ab0e8', { unlit: true, noline: true });
      for (let i = 0; i < 6; i++) { const x = 10 + i * 3.2, y0 = ((f * 6 + i * 13) % 24) - 8; d.deco.line(x, y0, x, y0 + 10, 1, '#c8f0ff', { unlit: true }); d.deco.line(x + 1.4, y0 + 22, x + 1.4, y0 + 30, 0.8, '#e8faff', { unlit: true }); }
      d.deco.rect(8, 0, 20, 2, '#a8e8ff', { unlit: true });
      for (let i = 0; i < 6; i++) d.circ(8 + i * 4 + ((f + i) % 2), 48 + ((f + i) % 3) * 0.6, 3.2 + ((f + i) % 2) * 0.8, '#f4fcff', { unlit: true, noline: true, noshadow: true });
    } },
    // rondins posés sur l'eau (on marche dessus)
    steplog: { w: 16, h: 14, n: 2, draw(d, v) {
      if (v) { d.ell(8, 8, 7, 4.4, '#9a968c', 0, { tex: 0.3 }); d.deco.ell(6, 6.6, 3, 1.4, '#c8c4bc'); return; }
      d.ell(8, 9.6, 7, 3.6, '#6a4424');
      d.ell(8, 7.6, 7, 3.6, '#c8945a');
      d.deco.ell(8, 7.6, 4.4, 2.2, '#a87442'); d.deco.ell(8, 7.6, 2, 1, '#c8945a');
    } },
    // ---------------------------------------------------------- linge qui sèche (3 cases)
    laundry: { w: 50, h: 34, n: 1, frames: 4, fps: 3, draw(d, v, f) {
      d.tube([[3, 33], [3, 6]], 2, 2, WOOD_D); d.tube([[47, 33], [47, 6]], 2, 2, WOOD_D);
      d.curve([[3, 7], [25, 11], [47, 7]], 0.8, '#e8e0d0', { noline: true });
      const cols = ['#e85a5a', '#5a8ae0', '#ffd84a', '#f4f0e8', '#7ac860'];
      for (let i = 0; i < 5; i++) {
        const x = 7 + i * 8, y = 8 + Math.sin((x / 50) * Math.PI) * 3, sw = Math.sin(f * Math.PI / 2 + i) * 1.6;
        d.poly([[x, y], [x + 6, y], [x + 6 + sw, y + 9 + (i % 2) * 3], [x + sw, y + 9 + (i % 2) * 3]], cols[i], { tex: 0.1 });
        d.deco.circ(x + 1, y, 0.8, '#c8a060'); d.deco.circ(x + 5, y, 0.8, '#c8a060');
      }
    } },
    // ---------------------------------------------------------- enseigne qui se balance (v : 0 viande, 1 éclair, 2 couverts, 3 fleur, 4 lettre)
    hangsign: { w: 22, h: 30, n: 5, frames: 4, fps: 3, draw(d, v, f) {
      d.tube([[4, 29], [4, 3]], 2.2, 2, WOOD_D); d.tube([[3, 4], [19, 4]], 1.8, 1.8, WOOD_D);
      const a = Math.sin(f * Math.PI / 2) * 0.12, P = (pts) => rot(14, 5, a, pts);
      d.deco.line(10, 4, 10 + Math.sin(a) * 4, 9, 0.6, '#2a1a10'); d.deco.line(18, 4, 18 + Math.sin(a) * 4, 9, 0.6, '#2a1a10');
      d.poly(P([[-6, 4], [6, 4], [6, 16], [-6, 16]]), '#c89858', { tex: 0.2 });
      const [cx, cy] = P([[0, 10]])[0];
      if (v === 0) { d.deco.ell(cx, cy, 3.4, 2.2, '#b04a2a'); d.deco.circ(cx - 3, cy, 1, '#fff4e0', { unlit: true }); }
      else if (v === 1) d.deco.poly([[cx + 1, cy - 4], [cx - 2.4, cy + 0.6], [cx, cy + 0.6], [cx - 1, cy + 4], [cx + 2.6, cy - 1], [cx, cy - 1]], '#ffe040', { unlit: true });
      else if (v === 2) { d.deco.circ(cx - 1.6, cy, 2.4, '#f8f0e0'); d.deco.line(cx + 2.6, cy - 3, cx + 2.6, cy + 3, 0.8, '#f8f0e0'); }
      else if (v === 3) { for (let i = 0; i < 5; i++) { const t = i / 5 * Math.PI * 2; d.deco.circ(cx + Math.cos(t) * 2, cy + Math.sin(t) * 2, 1.3, '#ff8ac0'); } d.deco.circ(cx, cy, 1, '#ffe060'); }
      else { d.deco.rect(cx - 3.4, cy - 2.4, 6.8, 4.8, '#f8f0e0'); d.deco.poly([[cx - 3.4, cy - 2.4], [cx, cy + 0.4], [cx + 3.4, cy - 2.4]], '#c8b8a0'); }
    } },
    // ---------------------------------------------------------- grange de Palmon (5×3)
    barn: { w: 104, h: 100, n: 1, lights: [[52, 46, 18]], draw(d) {
      d.ell(52, 97, 48, 3.4, '#3a2a18', 0, { flat: true });
      d.rect(8, 46, 88, 50, '#b8483a', { round: 0.05, tex: 0.25 });
      for (let x = 12; x < 96; x += 6) d.deco.line(x, 48, x, 96, 0.7, '#8a3428');
      // grandes portes en croix
      d.deco.rect(34, 62, 36, 34, '#f0e8d8');
      d.deco.rect(37, 65, 13.5, 28, '#9a3a2e'); d.deco.rect(53.5, 65, 13.5, 28, '#9a3a2e');
      for (const x of [37, 53.5]) { d.deco.line(x, 65, x + 13.5, 93, 1.2, '#f0e8d8'); d.deco.line(x + 13.5, 65, x, 93, 1.2, '#f0e8d8'); }
      // fenêtre du grenier et foin
      d.deco.rect(44, 40, 16, 14, '#f0e8d8'); d.deco.rect(46, 42, 12, 10, '#5a3418'); d.deco.rect(46, 47, 12, 5, '#e8c860');
      for (const x of [16, 80]) { d.deco.rect(x, 64, 10, 10, '#f0e8d8'); d.deco.rect(x + 1.5, 65.5, 7, 7, '#9ad8f0'); }
      // toit
      d.poly([[0, 50], [12, 26], [52, 10], [92, 26], [104, 50], [96, 50], [86, 30], [52, 18], [18, 30], [8, 50]], '#5a4a4a', { shiny: true });
      d.poly([[8, 50], [18, 30], [52, 18], [86, 30], [96, 50], [52, 40]], '#6a5858', { tex: 0.15 });
      for (let y = 26; y < 50; y += 5) d.deco.line(20 - (y - 26) * 0.3, y, 84 + (y - 26) * 0.3, y, 0.7, '#4a3a3a');
      d.circ(52, 26, 5, '#f0e8d8'); d.deco.circ(52, 26, 3, '#4aa046'); d.deco.circ(52, 26, 1.2, '#ff8ac0');
      // bottes de foin
      d.ell(10, 92, 8, 6, '#e8c860', 0, { tex: 0.4 }); d.deco.ell(6, 90, 3, 4, '#c8a040');
      d.ell(96, 92, 8, 6, '#e8c860', 0, { tex: 0.4 }); d.deco.ell(100, 90, 3, 4, '#c8a040');
    } },
    // parcelle de Digiviande (3×2) : la viande pousse sur la plante ! v0 récoltée (pousses), v1 mûre
    meatpatch: { w: 52, h: 38, n: 2, draw(d, v) {
      d.rect(1, 8, 50, 29, '#6a4428', { round: 0.08, flat: true, tex: 0.25 });
      for (let r = 0; r < 3; r++) d.deco.rect(3, 14 + r * 8, 46, 2.2, '#4a2c16');
      for (let r = 0; r < 3; r++) for (let x = 7; x < 48; x += 9) {
        const y = 13 + r * 8;
        d.tube([[x, y + 3], [x, y - (v ? 4 : 1)]], 1.6, 1.2, '#3e8a30');
        d.ell(x - 2.4, y, 2.6, 1.2, '#5ab452', -0.5); d.ell(x + 2.4, y - 0.6, 2.6, 1.2, '#4aa046', 0.5);
        if (v) { d.ell(x + 0.6, y - 6, 3.6, 2.6, '#b04a2a', 0.2); d.deco.ell(x + 1.2, y - 6.8, 1.6, 0.8, '#e07a5a', 0.2); d.circ(x - 3.2, y - 6.4, 1.1, '#fff4e0', { noshadow: true }); }
      }
      d.rect(0, 33, 52, 4, '#a87442', { round: 0.3 }); for (let x = 3; x < 52; x += 8) d.rect(x, 30, 2, 7, '#a87442', { round: 0.3 });
    } },
    // cabane à outils de Tanemon (2×2)
    shed: { w: 42, h: 44, n: 1, draw(d) {
      d.ell(21, 42, 19, 2.6, '#3a2a18', 0, { flat: true });
      d.rect(4, 18, 34, 24, '#a87442', { round: 0.06, tex: 0.3 });
      for (let x = 8; x < 38; x += 5) d.deco.line(x, 19, x, 42, 0.7, '#7a5028');
      d.deco.rect(15, 26, 12, 16, '#5a3418'); d.deco.line(15, 26, 27, 42, 0.8, '#8a5a30'); d.deco.line(27, 26, 15, 42, 0.8, '#8a5a30');
      d.blob([[0, 22], [6, 10], [21, 4], [36, 10], [42, 22], [21, 19]], '#6a9a48', { tex: 0.45, texSize: 1 });
      d.deco.circ(14, 12, 1.4, '#ff8ac0', { unlit: true }); d.deco.circ(28, 13, 1.4, '#fff070', { unlit: true });
      // arrosoir et fourche
      d.rect(34, 34, 7, 6, '#5a9ad8', { round: 0.3, shiny: true }); d.tube([[40, 35], [43, 31]], 1.2, 0.8, '#5a9ad8');
      d.tube([[3, 42], [6, 24]], 1.2, 1.2, '#8a5a32'); d.deco.line(4.8, 24, 7.4, 21, 0.6, '#9aa0a8');
    } },
    // Banque (5×3) : gros coffre noir aux planches croisées, enseigne jaune (comme l'Item Bank de Digimon World)
    bank: { w: 92, h: 96, n: 1, lights: [[46, 30, 24]], draw(d) {
      d.ell(46, 93, 42, 3.4, '#1a1a1a', 0, { flat: true });
      d.rect(6, 12, 80, 80, '#2e2e34', { round: 0.03, tex: 0.12 });
      d.deco.rect(6, 12, 80, 4, '#46464e');
      d.deco.line(8, 16, 84, 44, 2.2, '#1e1e24'); d.deco.line(84, 16, 8, 44, 2.2, '#1e1e24');
      d.deco.rect(6, 44, 80, 2, '#1e1e24');
      // enseigne jaune
      d.rect(14, 24, 64, 14, '#e8b830', { round: 0.15 }); d.deco.rect(15, 25, 62, 2, '#f8d860');
      sign(d, 'BANQUE', 23, 28, '#1a1a1a', 2);
      // porte, rampe, digicode, pièce dorée
      d.deco.rect(30, 56, 32, 36, '#0e0e12'); d.deco.rect(31, 57, 30, 2, '#3a3a42');
      d.rect(26, 86, 40, 8, '#a8743c', { round: 0.1, tex: 0.3 }); for (let x = 30; x < 64; x += 6) d.deco.line(x, 87, x, 93, 0.7, '#7a5028');
      d.deco.rect(68, 64, 8, 10, '#5a5a62'); for (let i = 0; i < 6; i++) d.deco.rect(69 + (i % 2) * 3.4, 65.4 + Math.floor(i / 2) * 2.8, 2, 2, '#5ae890', { unlit: true });
      d.circ(16, 66, 5, '#c8a040', { shiny: true }); d.deco.circ(16, 66, 3, '#e8c050');
      // câbles qui pendent du toit
      d.curve([[8, 14], [2, 30], [6, 48]], 1.4, '#c8a040', { noline: true }); d.curve([[84, 14], [90, 34], [86, 52]], 1.4, '#c8a040', { noline: true });
    } },
    // ---------------------------------------------------------- Terrain d'entraînement
    // panneau de poste (comme Digimon World) : v0 PV cœur, v1 Attaque soleil, v2 Défense bouclier, v3 Vitesse chevrons, v4 Intelligence œil
    stationsign: { w: 24, h: 30, n: 6, draw(d, v) {
      d.ell(12, 29, 8, 1.6, '#1a1a1a', 0, { flat: true });
      d.tube([[5, 29], [5, 14]], 2, 2, '#4a3a2e'); d.tube([[19, 29], [19, 14]], 2, 2, '#4a3a2e');
      d.rect(0, 1, 24, 18, '#f0e6c8', { round: 0.1 });   // cadre clair : il se voit de loin
      d.rect(1.5, 2.5, 21, 15, '#2a2a30', { round: 0.08 });
      d.deco.rect(1.5, 2.5, 21, 1.4, '#5a4a3e'); d.deco.rect(1.5, 16.1, 21, 1.4, '#5a4a3e');
      const C = ['#ff5a7a', '#ffd040', '#5ab8ff', '#7aff7a', '#c88aff', '#4ae0f0'][v];
      if (v === 0) { d.deco.circ(9.6, 8, 2.6, C, { unlit: true }); d.deco.circ(14.4, 8, 2.6, C, { unlit: true }); d.deco.poly([[7, 9], [17, 9], [12, 15]], C, { unlit: true }); }
      else if (v === 1) { d.deco.circ(12, 10, 3, C, { unlit: true }); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; d.deco.line(12 + Math.cos(a) * 4, 10 + Math.sin(a) * 4, 12 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 1, C, { unlit: true }); } }
      else if (v === 2) { d.deco.poly([[7, 5], [17, 5], [17, 10], [12, 15], [7, 10]], C, { unlit: true }); d.deco.line(12, 6, 12, 13, 0.8, '#2a2a30'); }
      else if (v === 3) { for (const x of [6, 11]) d.deco.poly([[x, 5], [x + 3, 5], [x + 7, 10], [x + 3, 15], [x, 15], [x + 4, 10]], C, { unlit: true }); }
      else if (v === 4) { d.deco.ell(12, 10, 6, 3.6, C, 0, { unlit: true }); d.deco.circ(12, 10, 2, '#2a2a30'); d.deco.circ(12.6, 9.4, 0.7, '#ffffff', { unlit: true }); }
      else d.deco.poly([[12, 4], [16, 10], [12, 16], [8, 10]], C, { unlit: true });   // cristal (PM)
    } },
    // pieu de frappe enveloppé de corde
    stake: { w: 14, h: 34, n: 1, draw(d) {
      d.ell(7, 32, 6, 1.8, '#2a1a10', 0, { flat: true });
      d.tube([[7, 33], [7, 4]], 9, 8, '#8a6040', { tex: 0.3 }); d.ell(7, 4, 4.2, 1.8, '#b08a5a');
      for (let y = 10; y < 26; y += 3) d.deco.line(2.6, y, 11.4, y + 1.4, 1, '#d8c890');
    } },
    // sac de frappe rouge suspendu à un portique
    punchbag: { w: 26, h: 40, n: 1, draw(d) {
      d.ell(13, 38, 11, 2, '#2a1a10', 0, { flat: true });
      d.tube([[3, 39], [3, 4]], 2.4, 2, '#5a4a3a'); d.tube([[23, 39], [23, 4]], 2.4, 2, '#5a4a3a'); d.tube([[2, 4], [24, 4]], 2, 2, '#6a5a4a');
      d.deco.line(13, 4, 13, 9, 0.8, '#c8c0b0');
      d.rect(7, 9, 12, 22, '#c83a2e', { round: 0.5, shiny: true });
      d.deco.line(7, 14, 19, 14, 0.8, '#8a2418'); d.deco.line(7, 26, 19, 26, 0.8, '#8a2418');
    } },
    // gros rocher peint de signes rouges (Endurance)
    kanjirock: { w: 44, h: 38, n: 1, draw(d) {
      d.ell(22, 36, 20, 2.6, '#2a1a10', 0, { flat: true });
      d.blob([[2, 36], [3, 18], [12, 5], [26, 3], [38, 10], [42, 24], [41, 36]], '#9a948c', { tex: 0.4, texSize: 1 });
      d.deco.line(14, 12, 24, 12, 1.6, '#d02a2a', { unlit: true }); d.deco.line(19, 10, 17, 28, 1.6, '#d02a2a', { unlit: true }); d.deco.line(12, 20, 26, 22, 1.6, '#d02a2a', { unlit: true });
      d.deco.line(28, 14, 34, 16, 1.4, '#d02a2a', { unlit: true }); d.deco.line(31, 12, 30, 28, 1.4, '#d02a2a', { unlit: true }); d.deco.line(27, 24, 35, 27, 1.4, '#d02a2a', { unlit: true });
      d.deco.ell(8, 30, 4, 2, '#5aa040');
    } },
    // marquages blancs de la piste ovale (décalque au sol, sans contour)
    tracklines: { w: 224, h: 144, n: 1, noOutline: true, draw(d) {
      const cx = 112, cy = 72, RX = 99, RY = 62, F = { unlit: true, noline: true, noshadow: true, flat: true };
      for (const k of [0.74, 0.86]) {
        for (let i = 0; i < 48; i++) {
          if (i % 2) continue;
          const a0 = i / 48 * Math.PI * 2, a1 = (i + 1) / 48 * Math.PI * 2;
          d.curve([[cx + Math.cos(a0) * RX * k, cy + Math.sin(a0) * RY * k], [cx + Math.cos(a1) * RX * k, cy + Math.sin(a1) * RY * k]], 1.2, '#f4ecd8', F);
        }
      }
      // ligne de départ
      for (let i = 0; i < 4; i++) d.rect(cx - 2 + (i % 2) * 2, cy + RY * 0.64 + i * 3, 2, 3, i % 2 ? '#2a2a2a' : '#f4ecd8', F);
      for (let i = 0; i < 4; i++) d.rect(cx + (i % 2) * 2, cy + RY * 0.64 + i * 3, 2, 3, i % 2 ? '#f4ecd8' : '#2a2a2a', F);
    } },
    // tapis de paille sous les mannequins
    mat: { w: 80, h: 48, n: 1, noOutline: true, draw(d) {
      const F = { flat: true, noline: true, noshadow: true, tex: 0.2 };
      d.rect(4, 6, 72, 38, '#c8a858', F);
      d.rect(6, 8, 68, 34, '#dcc070', F);
      for (let y = 10; y < 42; y += 3) d.deco.line(7, y, 73, y, 0.6, '#b89848');
      for (let x = 12; x < 72; x += 10) d.deco.line(x, 8, x, 42, 0.6, '#c8a858');
    } },
    // sable ratissé du jardin zen (cercles autour du sanctuaire, lignes parallèles ailleurs)
    zenrakes: { w: 96, h: 64, n: 1, noOutline: true, draw(d) {
      const F = { unlit: true, noline: true, noshadow: true, flat: true };
      for (let y = 6; y < 62; y += 5) d.curve([[2, y], [30, y + 1], [60, y], [94, y + 1]], 0.8, '#f6e6bc', F);
      for (const r of [14, 19, 24]) { const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; pts.push([56 + Math.cos(a) * r, 38 + Math.sin(a) * r * 0.6]); } d.curve(pts, 0.9, '#c8a870', F); }
    } },
    // gradins en bois (3 marches)
    bleachers: { w: 68, h: 44, n: 1, draw(d) {
      d.ell(34, 42, 32, 2.4, '#3a2a18', 0, { flat: true });
      for (let k = 0; k < 3; k++) {
        const y = 8 + k * 11;
        d.rect(2 + k * 2, y + 4, 64 - k * 4, 7, '#7a5030', { round: 0.1, tex: 0.25 });
        d.rect(1 + k * 2, y, 66 - k * 4, 5, '#c8945a', { round: 0.3, tex: 0.2 });
        for (let x = 6 + k * 2; x < 64 - k * 2; x += 12) d.deco.line(x, y + 5, x, y + 11, 0.7, '#5a3a1e');
      }
      d.rect(0, 0, 4, 42, '#8a5a32', { round: 0.3 }); d.rect(64, 0, 4, 42, '#8a5a32', { round: 0.3 });
      d.poly([[4, 2], [12, 2], [8, 8]], '#e04848', { noshadow: true }); d.poly([[56, 2], [64, 2], [60, 8]], '#3a8ae8', { noshadow: true });
    } },
    // torche : vasque en fer et vraie flamme (animée par l'ambiance)
    torch: { w: 16, h: 40, n: 1, fire: [8, 10], lights: [[8, 8, 44]], draw(d) {
      d.ell(8, 38, 6, 1.8, '#2a2a2a', 0, { flat: true });
      d.rect(3, 32, 10, 6, '#8a847a', { round: 0.3, tex: 0.3 });
      d.tube([[8, 33], [8, 15]], 3, 2.4, '#5a4a3a');
      d.poly([[1, 9], [15, 9], [12, 16], [4, 16]], '#4a4a52', { shiny: true });
      d.deco.rect(2, 9, 12, 1.6, '#ff9a3a', { unlit: true });
      d.ell(8, 8, 5, 2.4, '#ff7a20', 0, { unlit: true, noline: true }); d.ell(8, 6, 3, 3, '#ffd060', 0, { unlit: true, noline: true });
    } },
    shieldrack: { w: 26, h: 30, n: 1, draw(d) {
      d.ell(13, 28, 11, 2, '#3a2a18', 0, { flat: true });
      d.tube([[3, 29], [3, 6]], 2, 2, '#8a5a32'); d.tube([[23, 29], [23, 6]], 2, 2, '#8a5a32'); d.tube([[2, 8], [24, 8]], 2, 2, '#9a6a3a');
      for (const [x, c] of [[7, '#c84838'], [13, '#3a6ac8'], [19, '#c8a040']]) { d.circ(x, 17, 5, c, { shiny: true }); d.deco.circ(x, 17, 2.4, '#e8e0d0'); d.deco.circ(x, 17, 1, c); }
      d.deco.line(15, 13, 18, 18, 0.8, '#2a2a3a');
    } },
    rockpile: { w: 36, h: 26, n: 1, draw(d) {
      d.ell(18, 24, 16, 2.4, '#3a2a18', 0, { flat: true });
      d.blob([[1, 24], [2, 15], [8, 11], [14, 14], [15, 24]], '#9a948a', { tex: 0.35, texSize: 1 });
      d.blob([[13, 24], [14, 12], [21, 9], [28, 12], [30, 24]], '#8a847a', { tex: 0.35, texSize: 1 });
      d.blob([[8, 14], [10, 5], [17, 2], [23, 6], [22, 12], [14, 14]], '#a8a296', { tex: 0.35, texSize: 1 });
      d.blob([[28, 24], [29, 17], [33, 15], [35, 24]], '#958f86', { tex: 0.35 });
      d.deco.line(10, 18, 13, 22, 0.7, '#6a665e'); d.deco.line(20, 15, 24, 19, 0.7, '#6a665e');
    } },
    // rocher marin couvert de bernacles et d'algues
    searock: { w: 26, h: 22, n: 3, draw(d, v) {
      d.ell(13, 20, 11, 2.4, '#8a7050', 0, { flat: true });
      d.blob([[1, 20], [2, 11], [7, 4], [15, 3], [22, 8], [25, 20]], ['#8a8a92', '#7e8088', '#96928a'][v], { tex: 0.35, texSize: 1 });
      d.ell(18, 15, 5, 3.6, ['#7a7a84', '#70727a', '#86827a'][v], 0, { tex: 0.3 });
      for (const [x, y] of [[6, 14], [9, 16], [12, 8], [20, 11]]) d.deco.circ(x, y, 1, '#e8e4dc');
      d.deco.ell(5, 18, 4, 1.6, '#3a7a4a'); d.deco.ell(21, 18, 3, 1.4, '#4a8a3a');
    } },
    driftwood: { w: 34, h: 16, n: 2, draw(d, v) {
      d.ell(17, 13, 15, 2, '#a88a5a', 0, { flat: true });
      d.tube([[3, 10], [17, 8], [31, 10]], 6, 4, '#c8b49a', { tex: 0.3 });
      d.tube([[20, 8], [26, 3]], 2.4, 1, '#c8b49a');
      d.deco.line(6, 9, 26, 8.6, 0.6, '#9a8468'); d.deco.ell(31, 10, 1.6, 2, '#8a7458');
      if (v) d.ell(10, 6, 2.6, 1.4, '#3a7a4a');
    } },
    // rocher avec une petite cuvette d'eau (crabe, étoile de mer)
    tidepool: { w: 34, h: 24, n: 1, draw(d) {
      d.ell(17, 21, 15, 2.6, '#8a7050', 0, { flat: true });
      d.blob([[1, 20], [3, 9], [12, 4], [24, 4], [32, 10], [33, 20]], '#8e8a84', { tex: 0.35, texSize: 1 });
      d.deco.ell(17, 11, 9, 4, '#2a6a9a'); d.deco.ell(17, 11, 7.6, 3, '#4ab0e8'); d.deco.ell(14, 10, 3, 1, '#c8f0ff');
      d.deco.circ(21, 12, 1.6, '#f07a3a'); d.deco.ell(5, 17, 3, 1.4, '#3a7a4a');
      for (const [x, y] of [[26, 15], [8, 13], [29, 18]]) d.deco.circ(x, y, 1, '#e8e4dc');
    } },
    sandcastle: { w: 30, h: 26, n: 1, draw(d) {
      d.ell(15, 23, 13, 2.4, '#b8945a', 0, { flat: true });
      d.rect(3, 13, 24, 10, '#e6c88a', { round: 0.15, tex: 0.3 });
      for (const x of [3, 12, 21]) { d.rect(x, 7, 6, 8, '#ecd096', { round: 0.15, tex: 0.3 }); d.deco.rect(x + 1, 6, 1.4, 1.6, '#ecd096'); d.deco.rect(x + 3.6, 6, 1.4, 1.6, '#ecd096'); }
      d.deco.ell(15, 19, 2.6, 3, '#8a6a3a');
      d.tube([[15, 7], [15, 0]], 0.8, 0.8, '#8a5a32'); d.poly([[15.4, 0.4], [21, 2], [15.4, 3.6]], '#e04848', { noline: true });
      d.deco.circ(7, 18, 1.2, '#ffe0e8'); d.deco.circ(23, 19, 1.2, '#f07a3a');
    } },
    // ---------------------------------------------------------- décor numérique dans la nature
    // tuyau rouillé en coude qui sort du sol (fumée : voir smoke)
    pipe: { w: 34, h: 32, n: 2, smoke: [26, 4], draw(d, v) {
      const M = v ? '#8a8e96' : '#9a7a5a', Md = v ? '#6a6e76' : '#7a5a3a';
      d.ell(17, 30, 14, 2.6, '#1e2a1a', 0, { flat: true });
      d.blob([[2, 30], [4, 24], [10, 22], [14, 25], [14, 30]], '#6a5a3a', { tex: 0.4 });
      d.tube([[9, 29], [9, 14], [14, 8], [26, 8]], 9, 9, M, { tex: 0.25, shiny: true });
      d.ell(27, 8, 3, 5, Md); d.deco.ell(27.4, 8, 1.8, 3.4, '#1a1a1a');
      for (const [x, y] of [[9, 22], [12, 10], [20, 8]]) { d.deco.circ(x - 3, y, 0.9, '#d8d0c0'); d.deco.circ(x + 3, y, 0.9, '#d8d0c0'); }
      d.deco.line(5, 18, 13, 18, 1, Md); d.deco.ell(7, 26, 2.4, 1.4, '#5aa040');
      if (!v) d.deco.ell(16, 12, 3, 1.6, '#b0603a');
    } },
    // antenne de données : mât métallique, voyant qui clignote la nuit
    antenna: { w: 18, h: 46, n: 2, lights: [[9, 6, 22]], draw(d, v) {
      d.ell(9, 44, 7, 2, '#1e2a1a', 0, { flat: true });
      d.rect(4, 38, 10, 6, '#7a7e86', { round: 0.2, tex: 0.3 });
      d.tube([[9, 40], [9, 10]], 2.6, 1.6, '#9aa0a8', { shiny: true });
      d.tube([[9, 26], [3, 20]], 1, 1, '#9aa0a8'); d.tube([[9, 22], [15, 16]], 1, 1, '#9aa0a8');
      d.circ(9, 6, 3.6, v ? '#5ae890' : '#ff5a5a', { shiny: true, unlit: true });
      d.deco.circ(8, 5, 1.2, '#ffffff', { unlit: true });
      d.deco.line(5, 41, 13, 41, 0.8, '#ffd040');
    } },
    // panneau de circuit à moitié enterré, aux lignes lumineuses
    datapanel: { w: 34, h: 22, n: 2, lights: [[17, 10, 18]], draw(d, v) {
      d.ell(17, 20, 15, 2.4, '#1e2a1a', 0, { flat: true });
      d.poly([[2, 18], [6, 6], [30, 3], [32, 16]], v ? '#2a4a3a' : '#2a3a5a', { tex: 0.1 });
      const L = v ? '#7aff9a' : '#5ae8f0';
      d.deco.line(8, 14, 14, 8, 1, L, { unlit: true }); d.deco.line(14, 8, 24, 7, 1, L, { unlit: true }); d.deco.line(24, 7, 28, 12, 1, L, { unlit: true });
      d.deco.line(12, 15, 20, 12, 1, L, { unlit: true });
      for (const [x, y] of [[14, 8], [24, 7], [20, 12]]) d.deco.circ(x, y, 1.4, '#e8ffff', { unlit: true });
      d.deco.rect(8, 9, 3, 3, '#1a1a1a'); d.deco.rect(26, 9, 3, 3, '#1a1a1a');
      d.ell(4, 17, 4, 2.4, '#5aa040', 0, { tex: 0.4 }); d.ell(30, 18, 3.4, 2, '#4a9036', 0, { tex: 0.4 });
    } },
    // monolithe de données (Clairière) : pierre ancienne parcourue de lignes numériques qui luisent
    monolith: { w: 22, h: 46, n: 2, lights: [[11, 20, 26]], draw(d, v) {
      d.ell(11, 44, 9, 2.4, '#2a3a2a', 0, { flat: true });
      d.poly([[3, 44], [4, 10], [8, 3], [15, 2], [19, 9], [19, 44]], v ? '#8a96a4' : '#9a9a94', { tex: 0.3 });
      d.deco.line(7, 12, 7, 38, 1, '#5ae8f0', { unlit: true }); d.deco.line(7, 22, 12, 22, 1, '#5ae8f0', { unlit: true }); d.deco.line(12, 22, 12, 34, 1, '#5ae8f0', { unlit: true });
      d.deco.line(15, 8, 15, 18, 1, '#5ae8f0', { unlit: true }); d.deco.circ(12, 34, 1.4, '#c8ffff', { unlit: true }); d.deco.circ(7, 12, 1.2, '#c8ffff', { unlit: true });
      d.deco.ell(6, 40, 4, 2.6, '#5aa040'); d.deco.ell(16, 6, 3, 1.6, '#5aa040');
      d.rect(1, 40, 20, 5, '#7a7a74', { round: 0.3, tex: 0.3 });
    } },
    // lanterne de pierre moussue (Sentier)
    stonelantern: { w: 18, h: 34, n: 1, lights: [[9, 14, 30]], draw(d) {
      d.ell(9, 32, 7, 2, '#1a2a22', 0, { flat: true });
      d.rect(3, 26, 12, 6, '#8a8e86', { round: 0.3, tex: 0.3 });
      d.rect(6, 19, 6, 8, '#9a9e96', { round: 0.3, tex: 0.3 });
      d.rect(2, 10, 14, 10, '#a4a8a0', { round: 0.2, tex: 0.3 });
      d.deco.rect(6, 12.5, 6, 5, '#ffd88a', { unlit: true });
      d.poly([[0, 11], [9, 3], [18, 11]], '#8a8e86', { tex: 0.3 }); d.circ(9, 3, 2, '#9a9e96');
      d.deco.ell(5, 9, 3.4, 1.4, '#5aa040'); d.deco.ell(12, 29, 3, 1.4, '#5aa040'); d.deco.ell(4, 24, 1.4, 2, '#4a9036');
    } },
    // fleur géante (Prairie) : v0 tournesol, v1 tulipe rose, v2 campanule bleue
    giantflower: { w: 34, h: 52, n: 3, draw(d, v) {
      d.ell(17, 50, 8, 2, '#2a4a1a', 0, { flat: true });
      d.tube([[17, 51], [16, 32], [17, 16]], 3.2, 2.4, '#3e8a30');
      d.ell(10, 36, 7, 3, '#4aa046', -0.6); d.ell(24, 30, 7, 3, '#4aa046', 0.6);
      if (v === 0) {
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; d.ell(17 + Math.cos(a) * 9, 14 + Math.sin(a) * 9, 4.6, 2.2, '#f8c830', a, { noshadow: true }); }
        d.circ(17, 14, 6, '#7a4a1a', { tex: 0.5, texSize: 1 }); d.deco.circ(15, 12, 2, '#a86a2a');
      } else if (v === 1) {
        d.blob([[8, 20], [8, 8], [12, 3], [17, 8], [22, 3], [26, 8], [26, 20], [17, 24]], '#ff7aa8', { shiny: true });
        d.deco.line(17, 9, 17, 22, 0.8, '#d84a80');
      } else {
        d.blob([[7, 10], [17, 4], [27, 10], [28, 22], [24, 19], [21, 23], [17, 19], [13, 23], [10, 19], [6, 22]], '#7a8aff', { shiny: true });
        d.tube([[17, 18], [17, 26]], 1, 1, '#ffe060');
      }
    } },
    // champignon géant (Bois des Géants) : v0 rouge à pois, v1 bleu lumineux
    giantshroom: { w: 42, h: 58, n: 2, lights: [[21, 20, 36]], draw(d, v) {
      d.ell(21, 56, 14, 2.6, '#10241a', 0, { flat: true });
      d.tube([[21, 57], [20, 40], [21, 26]], 12, 9, '#f0eadc', { tex: 0.15 });
      d.deco.line(17, 52, 18, 30, 0.7, '#c8c0b0'); d.deco.ell(20, 46, 2, 3, '#3a2a1a');
      d.ell(21, 26, 20, 5, v ? '#2a6aa8' : '#a83a2a');
      d.ell(21, 20, 20, 13, v ? '#4ab0f0' : '#e04838', 0, { shiny: true });
      for (const [x, y, r] of [[12, 16, 3], [24, 12, 3.4], [31, 20, 2.6], [18, 23, 2], [6, 22, 1.6]]) d.deco.circ(x, y, r, v ? '#c8f4ff' : '#fff4e8', { unlit: !!v });
      d.ell(36, 54, 4, 2.6, v ? '#4ab0f0' : '#e04838'); d.ell(7, 55, 3, 2, v ? '#4ab0f0' : '#e04838');
    } },
    // arbre mort tordu (Lisière du Ravin)
    deadtree: { w: 36, h: 46, n: 2, draw(d, v) {
      d.ell(18, 44, 9, 2.4, '#3a2a14', 0, { flat: true });
      const B = v ? '#6a5a4a' : '#5a4a3a';
      d.tube([[18, 45], [17, 30], [19, 18]], 8, 4, B, { tex: 0.35 });
      d.tube([[18, 28], [8, 20], [4, 10]], 3, 1, B); d.tube([[19, 22], [28, 14], [31, 5]], 3, 1, B); d.tube([[19, 18], [17, 8], [20, 2]], 2.4, 0.8, B);
      d.tube([[8, 20], [3, 21]], 1.4, 0.6, B); d.tube([[28, 14], [33, 16]], 1.4, 0.6, B);
      d.deco.ell(17, 36, 1.6, 2.6, '#2a1a0c');
      for (const [x, y, c] of [[4, 10, '#e0702a'], [31, 5, '#f0b030'], [33, 16, '#d84a2a']]) d.circ(x, y, 2, c, { noshadow: true });
    } },
    haybale: { w: 22, h: 18, n: 1, draw(d) {
      d.ell(11, 16, 10, 2, '#4a3a1a', 0, { flat: true });
      d.rect(1, 4, 20, 12, '#e8c860', { round: 0.6, tex: 0.5 });
      d.deco.ell(4, 10, 3, 5.4, '#d8a840'); d.deco.ell(4, 10, 1.6, 3, '#c89030');
      d.deco.line(10, 4, 10, 16, 0.7, '#a87a30');
    } },
    // ---------------------------------------------------------- Poste de Biyomon (5×3)
    poste: { w: 100, h: 98, n: 1, lights: [[30, 70, 16], [70, 70, 16]], draw(d) {
      d.ell(50, 95, 46, 3.4, '#3a2a18', 0, { flat: true });
      d.rect(10, 48, 80, 46, '#f2e6cc', { round: 0.08, tex: 0.1 });
      d.deco.rect(10, 84, 80, 10, '#c8b08a');
      d.deco.ell(50, 72, 9, 8, '#4a6aa8'); d.deco.rect(41, 72, 18, 22, '#4a6aa8'); d.deco.line(50, 64, 50, 94, 0.8, '#2a3a6a');
      d.deco.circ(55, 82, 1.1, '#f0c040', { unlit: true });
      for (const x of [24, 70]) { d.deco.rect(x - 1.5, 62.5, 15, 13, '#2a3a6a'); d.deco.rect(x, 64, 12, 10, '#ffe8a8'); d.deco.line(x + 6, 64, x + 6, 74, 0.8, '#2a3a6a'); }
      d.blob([[0, 52], [8, 34], [50, 18], [92, 34], [100, 52], [50, 48]], '#3a6ac8', { shiny: true });
      for (let y = 30; y < 50; y += 5) d.deco.curve([[6, y + 4], [50, y - 10], [94, y + 4]], 0.8, '#2a4a98');
      // tourelle-nichoir
      d.rect(62, 4, 18, 26, '#f2e6cc', { round: 0.2 }); d.deco.circ(71, 16, 4, '#2a1a10');
      d.poly([[58, 6], [71, -2], [84, 6]], '#e85a5a', { shiny: true });
      // enseigne lettre
      d.rect(30, 36, 26, 14, '#e85a5a', { round: 0.25 });
      d.deco.rect(35, 39, 16, 9, '#f8f0e0'); d.deco.poly([[35, 39], [43, 44.4], [51, 39]], '#c8b8a0');
      // boîte aux lettres
      d.rect(90, 70, 8, 12, '#e85a5a', { round: 0.4, shiny: true }); d.tube([[94, 94], [94, 82]], 2, 2, WOOD_D); d.deco.rect(91.5, 73, 5, 1, '#3a1a10');
    } },
    // ---------------------------------------------------------- ponton de pêche de Gomamon (posé sur le pont)
    fishing: { w: 24, h: 30, n: 1, draw(d) {
      d.tube([[4, 28], [20, 2]], 1.4, 0.8, WOOD_D);
      d.curve([[20, 2], [23, 14], [22, 26]], 0.5, '#e8e8e8', { noline: true });
      d.rect(2, 20, 9, 9, '#7a7a82', { round: 0.3, shiny: true }); d.deco.ell(6.5, 20.6, 4, 1.2, '#4ab0e8');
      d.ell(6, 19, 2.4, 1, '#5ab8f0', 0, { shiny: true });
    } },
    // ---------------------------------------------------------- portail du quartier (arche en bois)
    arch: { w: 48, h: 50, n: 1, draw(d) {
      d.tube([[5, 49], [5, 10]], 4, 4, WOOD); d.tube([[43, 49], [43, 10]], 4, 4, WOOD);
      d.rect(0, 8, 48, 6, WOOD_L, { round: 0.3, tex: 0.25 }); d.rect(2, 3, 44, 6, '#b8583a', { round: 0.4, shiny: true });
      d.rect(14, 14, 20, 9, '#e8d8b0', { round: 0.2 }); d.deco.line(17, 18.5, 31, 18.5, 1, '#6a4a28');
      for (const x of [5, 43]) for (let y = 20; y < 48; y += 7) d.deco.circ(x + ((y / 7) % 2 ? 1.4 : -1.4), y, 1.8, '#4aa046');
      for (const x of [5, 43]) for (let y = 23; y < 48; y += 9) d.deco.circ(x, y, 1, '#ff8ac0', { unlit: true });
    } },
    // ---------------------------------------------------------- stand d'une recrue (3×1) : comptoir, auvent rayé, enseigne à pictogramme
    // v : 0 clinique  1 puce  2 grill  3 glace  4 cartes  5 disque  6 livre  7 lune  8 rumeurs  9 plume  10 cœur
    //     11 note  12 étoile  13 paquet-cadeau  14 poing  15 conseil
    kiosk: { w: 60, h: 66, n: 16, draw(d, v) {
      const COL = ['#e84a5a', '#4a8ad8', '#e8682a', '#6ac8e8', '#c8a030', '#5a7ab8', '#4aa05a', '#5a4a9a', '#9a7a5a', '#e8a040', '#ff7ab0', '#3ab8a0', '#d8b828', '#c85aa8', '#c84a3a', '#5a9ae0'];
      const c = COL[v], cd = shadeK(c, -0.25);
      d.ell(30, 63, 27, 2.6, '#2a2018', 0, { flat: true });
      // poteaux et fond
      d.tube([[7, 62], [7, 20]], 1.6, 1.4, WOOD_D); d.tube([[53, 62], [53, 20]], 1.6, 1.4, WOOD_D);
      d.rect(9, 26, 42, 16, '#e8dcc0', { round: 0.05, far: true, tex: 0.15 });
      // comptoir (façade à la couleur du stand, planches)
      d.rect(4, 44, 52, 18, WOOD, { round: 0.06, tex: 0.3 });
      d.deco.rect(4, 44, 52, 2.4, WOOD_L);
      d.deco.rect(10, 49, 40, 10, c); for (let x = 14; x < 50; x += 6) d.deco.line(x, 49, x, 59, 0.6, cd);
      // marchandises sur le comptoir
      const goods = [c, '#f8f0e0', shadeK(c, 0.3)];
      for (let k = 0; k < 7; k++) d.circ(10 + k * 6.6, 42, 2.4, goods[k % 3], { shiny: true });
      // auvent rayé, bord festonné
      d.poly([[0, 28], [60, 28], [55, 16], [5, 16]], c);
      for (let x = 8; x < 54; x += 9) d.deco.poly([[x, 16], [x + 4.5, 16], [x + 5.2, 28], [x + 0.7, 28]], '#fff6e8');
      for (let x = 2; x < 60; x += 7) d.deco.ell(x + 2.5, 28, 3, 2, c);
      // enseigne
      d.rect(16, 1, 28, 16, '#f4ead0', { round: 0.25 });
      d.deco.rect(17.5, 2.5, 25, 13, '#fffaf0');
      const x = 30, y = 9, P = (col, o) => Object.assign({ unlit: true }, o);
      if (v === 0) { d.deco.rect(x - 1.8, y - 5, 3.6, 10, '#e83a4a', P()); d.deco.rect(x - 5, y - 1.8, 10, 3.6, '#e83a4a', P()); }
      else if (v === 1) { d.deco.rect(x - 4, y - 4, 8, 8, '#2a3a4a'); for (let k = -3; k <= 3; k += 2) { d.deco.line(x + k, y - 6, x + k, y - 4, 0.7, '#e8c860'); d.deco.line(x + k, y + 4, x + k, y + 6, 0.7, '#e8c860'); } d.deco.rect(x - 2, y - 2, 4, 4, '#5ae8a8', P()); }
      else if (v === 2) { d.deco.poly([[x, y - 6], [x + 4, y], [x + 2, y + 5], [x - 2, y + 5], [x - 4, y]], '#ff7a2a', P()); d.deco.poly([[x, y - 2], [x + 2, y + 2], [x, y + 5], [x - 2, y + 2]], '#ffe040', P()); }
      else if (v === 3) { d.deco.poly([[x - 3, y], [x + 3, y], [x, y + 6]], '#d8a060'); d.deco.circ(x - 1.4, y - 1.6, 2.6, '#ff9ac0', P()); d.deco.circ(x + 1.6, y - 2.4, 2.4, '#8ae0ff', P()); }
      else if (v === 4) { d.deco.rect(x - 6, y - 4, 6, 8, '#4a8ad8'); d.deco.rect(x - 2, y - 5, 6, 8, '#e84a5a'); d.deco.rect(x + 1, y - 3, 6, 8, '#ffd040'); }
      else if (v === 5) { d.deco.circ(x, y, 5, '#3a3a4a'); d.deco.circ(x, y, 3.4, '#8ac8ff', P()); d.deco.circ(x, y, 1.2, '#fffaf0'); }
      else if (v === 6) { d.deco.poly([[x - 6, y - 4], [x, y - 3], [x, y + 5], [x - 6, y + 4]], '#4aa05a'); d.deco.poly([[x + 6, y - 4], [x, y - 3], [x, y + 5], [x + 6, y + 4]], '#5ab86a'); d.deco.line(x, y - 3, x, y + 5, 0.6, '#2a5a2a'); }
      else if (v === 7) { d.deco.circ(x, y, 5, '#ffe070', P()); d.deco.circ(x + 2.4, y - 1.4, 4.4, '#fffaf0'); }
      else if (v === 8) { d.deco.ell(x, y - 1, 7, 4.6, '#9a7a5a'); d.deco.poly([[x - 3, y + 2], [x - 5, y + 6], [x, y + 3]], '#9a7a5a'); for (const k of [-3, 0, 3]) d.deco.circ(x + k, y - 1, 0.9, '#fffaf0'); }
      else if (v === 9) { d.deco.poly([[x - 5, y + 5], [x + 5, y - 6], [x + 2, y + 2]], '#e8a040'); d.deco.poly([[x - 5, y + 5], [x + 5, y - 6], [x - 2, y - 1]], '#ffc860'); }
      else if (v === 10) { d.deco.circ(x - 2.4, y - 1.4, 3, '#ff5a8a', P()); d.deco.circ(x + 2.4, y - 1.4, 3, '#ff5a8a', P()); d.deco.poly([[x - 5.2, y], [x + 5.2, y], [x, y + 5.6]], '#ff5a8a', P()); }
      else if (v === 11) { d.deco.ell(x - 2.6, y + 3, 2.4, 1.8, '#3ab8a0'); d.deco.line(x - 0.6, y + 3, x - 0.6, y - 5, 1, '#3ab8a0'); d.deco.poly([[x - 0.6, y - 5], [x + 4, y - 3], [x - 0.6, y - 2]], '#3ab8a0'); }
      else if (v === 12) { const s = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 2.4 : 6; s.push([x + Math.cos(a) * r, y + 0.6 + Math.sin(a) * r]); } d.deco.poly(s, '#ffd030', P()); }
      else if (v === 13) { d.deco.rect(x - 5, y - 2, 10, 7, '#c85aa8'); d.deco.rect(x - 6, y - 4, 12, 3, '#d87ab8'); d.deco.rect(x - 1, y - 4, 2, 9, '#ffe060'); }
      else if (v === 14) { d.deco.ell(x, y, 5, 4.4, '#f0b080'); for (let k = -3; k <= 3; k += 2) d.deco.line(x + k, y - 3, x + k, y - 1, 0.6, '#a86040'); }
      else { d.deco.circ(x, y - 2, 4, '#5a9ae0', P()); d.deco.circ(x, y - 2, 1.8, '#fffaf0'); d.deco.rect(x - 1, y + 1, 2, 2.4, '#5a9ae0', P()); d.deco.circ(x, y + 5, 1.1, '#5a9ae0', P()); }
    } },
  });
  OBJ.kiosk.scale = 1.15;
  OBJ.stationsign.scale = 1.5;   // panneaux des postes d'entraînement : bien visibles
})();
