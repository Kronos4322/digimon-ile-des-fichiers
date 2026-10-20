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
    P: '110101110100100', G: '011100101101011', X: '101101010101101', S: '011100010001110', R: '110101110101101', M: '101111111101101', H: '101101111101101', V: '101101101101010', 'Â': '010101111101101',
    // (lettres manquantes : « GYMNASE » et « FERMÉ » s'affichaient « G MNASE », « ERM »)
    Y: '101101010010010', F: '111100110100100', K: '101101110101101', Z: '111001010100111', 'É': '111100110100111', 'È': '111100110100111', 'Ç': '011100100100011' };
  const sign = (d, s, x, y, col, k = 1) => { [...s].forEach((ch, i) => { const g = GLYPH[ch]; if (g) for (let p = 0; p < 15; p++) if (g[p] === '1') d.deco.rect(x + (i * 4 + (p % 3)) * k, y + Math.floor(p / 3) * k, k, k, col, { unlit: true }); }); };
  DW.World.signText = sign;
  const shadeK = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k))); return '#' + [16, 8, 0].map(b => f((n >> b) & 255).toString(16).padStart(2, '0')).join(''); };
  const rot = (cx, cy, a, pts) => pts.map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);

  Object.assign(OBJ, {
    // ---------------------------------------------------------- moulin à vent (ailes qui tournent)
    // v0 : à l'abandon (ailes déchirées, immobiles)  v1 : en marche
    windmill: { w: 76, h: 112, n: 2, frames: 6, fps: 5, lights: [[38, 70, 16]], draw(d, v, f) {
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
    steplog: { w: 16, h: 14, n: 2, draw: DW.World.secours.bois(16, 14) },
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
    stationsign: { w: 24, h: 30, n: 7, draw(d, v) {
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
      else if (v === 6) { d.deco.rect(7, 7, 10, 7, '#ff8a4a', { unlit: true }); for (const x of [7.5, 10, 12.5, 15]) d.deco.rect(x, 5, 2, 3, '#ffb07a', { unlit: true }); d.deco.rect(5, 9, 3, 4, '#ff8a4a', { unlit: true }); d.deco.rect(9, 14, 6, 2, '#c8603a', { unlit: true }); }   // poing (sac de frappe)
      else d.deco.poly([[12, 4], [16, 10], [12, 16], [8, 10]], C, { unlit: true });   // cristal (PM)
    } },
    // sac de frappe suspendu à un portique (image du joueur, dossier SPORT)
    punchbag: { w: 27, h: 40, n: 1, draw: DW.World.secours.boite(27, 40) },
    // gros rocher peint de signes rouges (Endurance)
    kanjirock: { w: 44, h: 38, n: 1, draw(d) {
      d.blob([[2, 36], [3, 18], [12, 5], [26, 3], [38, 10], [42, 24], [41, 36]], '#9a948c', { tex: 0.4, texSize: 1 });
      d.deco.line(14, 12, 24, 12, 1.6, '#d02a2a', { unlit: true }); d.deco.line(19, 10, 17, 28, 1.6, '#d02a2a', { unlit: true }); d.deco.line(12, 20, 26, 22, 1.6, '#d02a2a', { unlit: true });
      d.deco.line(28, 14, 34, 16, 1.4, '#d02a2a', { unlit: true }); d.deco.line(31, 12, 30, 28, 1.4, '#d02a2a', { unlit: true }); d.deco.line(27, 24, 35, 27, 1.4, '#d02a2a', { unlit: true });
      d.deco.ell(8, 30, 4, 2, '#5aa040');
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
    // torche : vasque en fer et vraie flamme (animée par l'ambiance)
    torch: { w: 16, h: 40, n: 1, fire: [8, 10], lights: [[8, 8, 44]], draw(d) {
      d.rect(3, 32, 10, 6, '#8a847a', { round: 0.3, tex: 0.3 });
      d.tube([[8, 33], [8, 15]], 3, 2.4, '#5a4a3a');
      d.poly([[1, 9], [15, 9], [12, 16], [4, 16]], '#4a4a52', { shiny: true });
      d.deco.rect(2, 9, 12, 1.6, '#ff9a3a', { unlit: true });
      d.ell(8, 8, 5, 2.4, '#ff7a20', 0, { unlit: true, noline: true }); d.ell(8, 6, 3, 3, '#ffd060', 0, { unlit: true, noline: true });
    } },
    shieldrack: { w: 27, h: 30, n: 1, draw: DW.World.secours.boite(27, 30) },
    // autres appareils (images du joueur, dossier SPORT) : postes du Terrain d'entraînement (DW.Training.POSTES : épouvantail,
    // traîneau, pneus), décor (slalom, mannequin de bois), appareils du Gymnase de Leomon (un par élément : maps/gymnase.js),
    // matériel de la salle de classe
    epouvantail: { w: 26, h: 30, n: 1, draw: DW.World.secours.bois(26, 30) },
    traineau: { w: 27, h: 30, n: 1, draw: DW.World.secours.pierre(27, 30) },
    pneus: { w: 27, h: 30, n: 1, draw: DW.World.secours.boite(27, 30) },
    slalom: { w: 20, h: 30, n: 1, draw: DW.World.secours.boite(20, 30) },
    mannequinbois: { w: 27, h: 30, n: 1, draw: DW.World.secours.bois(27, 30) },
    anneaufeu: { w: 24, h: 30, n: 1, lights: [[12, 14, 30, 'rgba(255,140,50,0.6)']], draw: DW.World.secours.boite(24, 30) },
    cascade: { w: 20, h: 30, n: 1, draw: DW.World.secours.pierre(20, 30) },
    bainglace: { w: 25, h: 30, n: 1, draw: DW.World.secours.boite(25, 30) },
    portailvent: { w: 24, h: 30, n: 1, draw: DW.World.secours.boite(24, 30) },
    bobinefoudre: { w: 19, h: 30, n: 1, lights: [[9.5, 6, 22, 'rgba(140,220,255,0.6)']], draw: DW.World.secours.boite(19, 30) },
    rochersuspendu: { w: 21, h: 30, n: 1, draw: DW.World.secours.rocher(21, 30) },
    portailombre: { w: 23, h: 30, n: 1, lights: [[11.5, 15, 20, 'rgba(170,90,255,0.5)']], draw: DW.World.secours.pierre(23, 30) },
    tableaumemoire: { w: 25, h: 30, n: 1, draw: DW.World.secours.boite(25, 30) },
    telescope: { w: 19, h: 30, n: 1, draw: DW.World.secours.boite(19, 30) },
    formes: { w: 25, h: 30, n: 1, draw: DW.World.secours.boite(25, 30) },
    // rocher marin couvert de bernacles et d'algues
    searock: { w: 26, h: 22, n: 3, draw: DW.World.secours.rocher(26, 22) },
    driftwood: { w: 34, h: 16, n: 2, draw: DW.World.secours.bois(34, 16) },
    // rocher avec une petite cuvette d'eau (crabe, étoile de mer)
    tidepool: { w: 34, h: 24, n: 1, draw: DW.World.secours.rocher(34, 24) },
    sandcastle: { w: 30, h: 26, n: 1, draw: DW.World.secours.pierre(30, 26) },
    // ---------------------------------------------------------- décor numérique dans la nature
    // tuyau rouillé en coude qui sort du sol (fumée : voir smoke)
    pipe: { w: 34, h: 32, n: 2, smoke: [26, 4], draw: DW.World.secours.pierre(34, 32) },
    // antenne de données : mât métallique, voyant qui clignote la nuit
    antenna: { w: 18, h: 46, n: 2, lights: [[9, 6, 22]], draw: DW.World.secours.pierre(18, 46) },
    // panneau de circuit à moitié enterré, aux lignes lumineuses
    datapanel: { w: 34, h: 22, n: 2, lights: [[17, 10, 18]], draw: DW.World.secours.pierre(34, 22) },
    // monolithe de données (Clairière) : pierre ancienne parcourue de lignes numériques qui luisent
    monolith: { w: 22, h: 46, n: 2, lights: [[11, 30, 26]], draw: DW.World.secours.pierre(22, 46) },   // (lueur : les runes, au milieu de la pierre)
    // lanterne de pierre moussue (Sentier)
    stonelantern: { w: 18, h: 34, n: 1, lights: [[9, 14, 30]], draw: DW.World.secours.pierre(18, 34) },
    // fleur géante (Prairie) : v0 tournesol, v1 tulipe rose, v2 campanule bleue
    // (saisons, gfx/meteo.js : v3 perce-neige géant en hiver, v4 colchique mauve en automne — jamais tirées au hasard)
    giantflower: { w: 34, h: 52, n: 3, draw: DW.World.secours.plante(34, 52) },
    // champignon géant (Bois des Géants) : v0 rouge à pois, v1 bleu lumineux
    giantshroom: { w: 42, h: 58, n: 2, lights: [[21, 20, 36]], draw: DW.World.secours.champignon(42, 58) },
    // arbre mort tordu (Lisière du Ravin)
    deadtree: { w: 36, h: 46, n: 2, draw: DW.World.secours.arbre(36, 46) },
    // ---------------------------------------------------------- Poste de Biyomon (5×3)
    poste: { w: 100, h: 98, n: 1, lights: [[30, 70, 16], [70, 70, 16]] },   // (peinte : gfx/facades.js)
    // ---------------------------------------------------------- ponton de pêche de Gomamon (posé sur le pont)
    fishing: { w: 24, h: 30, n: 1, draw(d) {
      d.tube([[4, 28], [20, 2]], 1.4, 0.8, WOOD_D);
      d.curve([[20, 2], [23, 14], [22, 26]], 0.5, '#e8e8e8', { noline: true });
      d.rect(2, 20, 9, 9, '#7a7a82', { round: 0.3, shiny: true }); d.deco.ell(6.5, 20.6, 4, 1.2, '#4ab0e8');
      d.ell(6, 19, 2.4, 1, '#5ab8f0', 0, { shiny: true });
    } },
    // ---------------------------------------------------------- stand d'une recrue (3×1) : comptoir, auvent rayé, enseigne à pictogramme
    // v : 0 clinique  1 puce  2 grill  3 glace  4 cartes  5 disque  6 livre  7 lune  8 rumeurs  9 plume  10 cœur
    //     11 note  12 étoile  13 paquet-cadeau  14 poing  15 conseil
    kiosk: { w: 60, h: 66, n: 16, draw(d, v) {
      const COL = ['#e84a5a', '#4a8ad8', '#e8682a', '#6ac8e8', '#c8a030', '#5a7ab8', '#4aa05a', '#5a4a9a', '#9a7a5a', '#e8a040', '#ff7ab0', '#3ab8a0', '#d8b828', '#c85aa8', '#c84a3a', '#5a9ae0'];
      const c = COL[v], cd = shadeK(c, -0.25);
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
  OBJ.stationsign.scale = 1.25;   // panneaux des postes d'entraînement : bien visibles, sans cacher les appareils
})();
