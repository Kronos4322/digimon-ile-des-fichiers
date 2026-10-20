'use strict';
// =====================================================================
//  PREMIÈRES VERSIONS DES BOUTIQUES, PEINTES (même pinceau que la cabane de Jijimon : gfx/maisons.js)
//  - Bazar de Gotsumon (v 0) : un étal de marché en planches sous une toile rayée, viandes, fioles, disquettes,
//    caisses et tonneau ; enseigne à la viande.
//  - Restaurant de Mushroomon (v 0) : une maison-champignon, chapeau violet à pois, pied crème,
//    porte en arche, hublots éclairés, cheminée de pierre, ardoise du menu, petits champignons.
//  - Dojo d'Elecmon (v 0) : plancher surélevé, murs de papier, toit de tuiles bleues relevé, bannières à l'éclair.
//  - Poste de Biyomon : maison crème au toit bleu en écailles, tourelle-nichoir, enseigne à la lettre, boîte aux lettres.
//  Les versions agrandies (v 1, v 2) restent celles de gfx/grandir.js. Repère : boîte 150 × 128 (grandir.js),
//  l'ancien dessin occupait x 25-125 ; la porte reste au centre.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ, P = DW.World.Paint, B = DW.World.Brush, hash = DW.Art.hash;
  if (!B || !OBJ.bazar || !OBJ.restaurant || !OBJ.dojo) return;
  const { rgb, mix, INK } = P;
  const { rr, plank, stone, tufts, roof } = B;
  const shadow = (x, cx, cy, rx, ry) => { const g = x.createRadialGradient(cx, cy, 1, cx, cy, rx); g.addColorStop(0, 'rgba(20,24,16,0.5)'); g.addColorStop(1, 'rgba(20,24,16,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  // planche horizontale (tablier, comptoir)
  const board = (x, x0, y0, w, h, base, seed) => { x.save(); x.translate(x0, y0 + h); x.rotate(-Math.PI / 2); plank(x, 0, 0, h, w, base, seed); x.restore(); };

  // petits articles de l'étal
  const meat = (x, cx, cy, s) => {
    x.strokeStyle = '#f4ecd8'; x.lineWidth = 1.4 * s; x.beginPath(); x.moveTo(cx - 4 * s, cy + 2 * s); x.lineTo(cx - 1 * s, cy); x.stroke();
    x.fillStyle = '#f4ecd8'; x.beginPath(); x.arc(cx - 4.4 * s, cy + 2.4 * s, 1.1 * s, 0, 7); x.fill();
    const g = x.createRadialGradient(cx + 1 * s, cy - 1.5 * s, 0.3, cx + 1.5 * s, cy - 0.5 * s, 4 * s); g.addColorStop(0, '#f09060'); g.addColorStop(0.6, '#c0502a'); g.addColorStop(1, '#7a2a14');
    x.fillStyle = g; x.beginPath(); x.ellipse(cx + 1.6 * s, cy - 0.8 * s, 3.4 * s, 2.6 * s, -0.5, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,230,200,0.6)'; x.beginPath(); x.ellipse(cx + 0.8 * s, cy - 1.8 * s, 1.1 * s, 0.6 * s, -0.5, 0, 7); x.fill();
  };
  const bottle = (x, cx, by, col, s) => {
    x.fillStyle = '#c8c0b0'; x.fillRect(cx - 0.8 * s, by - 7.5 * s, 1.6 * s, 1.6 * s);
    const g = x.createLinearGradient(cx - 2.2 * s, 0, cx + 2.2 * s, 0); g.addColorStop(0, rgb(mix(col, '#ffffff', 0.45))); g.addColorStop(0.5, col); g.addColorStop(1, rgb(mix(col, INK, 0.45)));
    x.fillStyle = g; rr(x, cx - 2.2 * s, by - 6 * s, 4.4 * s, 6 * s, 1.4 * s); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.6)'; x.fillRect(cx - 1.4 * s, by - 5 * s, 0.7 * s, 3 * s);
  };
  const disk = (x, cx, by, col, s) => { x.fillStyle = col; rr(x, cx - 2.6 * s, by - 5.2 * s, 5.2 * s, 5.2 * s, 0.6 * s); x.fill(); x.fillStyle = '#e8ecf4'; x.fillRect(cx - 1.4 * s, by - 5.2 * s, 2.8 * s, 1.8 * s); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(cx - 2.6 * s, by - 0.8 * s, 5.2 * s, 0.8 * s); };

  // ------------------------------------------------------------ BAZAR (v 0) : l'étal de marché
  function stall(x) {
    const L = 27, R = 123, s = 7;
    shadow(x, 75, 124, 62, 6);
    // tonneau à gauche, caisses à droite
    { const bx = 18, by = 124, g = x.createLinearGradient(bx - 7, 0, bx + 7, 0); g.addColorStop(0, '#b07a44'); g.addColorStop(0.5, '#8a5a30'); g.addColorStop(1, '#4a2e18');
      x.fillStyle = g; x.beginPath(); x.moveTo(bx - 6, by - 16); x.quadraticCurveTo(bx - 8.4, by - 8, bx - 6, by); x.lineTo(bx + 6, by); x.quadraticCurveTo(bx + 8.4, by - 8, bx + 6, by - 16); x.closePath(); x.fill();
      x.fillStyle = '#3a3a40'; for (const yy of [by - 13, by - 3]) x.fillRect(bx - 7.4, yy, 14.8, 1.4);
      x.fillStyle = '#6a4424'; x.beginPath(); x.ellipse(bx, by - 16, 6, 1.6, 0, 0, 7); x.fill();
      for (let i = 0; i < 4; i++) { x.fillStyle = ['#e04a3a', '#f0c040', '#e04a3a', '#7ac040'][i]; x.beginPath(); x.arc(bx - 3 + i * 2, by - 17.2 - (i % 2), 1.6, 0, 7); x.fill(); } }   // fruits sur le tonneau
    for (const [cx, cy, w, h, sd] of [[132, 112, 14, 12, 1], [137, 100, 10, 10, 2]]) {
      for (let i = 0; i < 3; i++) plank(x, cx - w / 2 + i * w / 3, cy - h / 2, w / 3, h, '#a8804c', s + sd * 10 + i);
      x.strokeStyle = '#5a3a1e'; x.lineWidth = 0.8; x.strokeRect(cx - w / 2, cy - h / 2, w, h); x.beginPath(); x.moveTo(cx - w / 2, cy - h / 2); x.lineTo(cx + w / 2, cy + h / 2); x.stroke();
    }
    // plancher de l'étal
    board(x, L - 6, 116, R - L + 12, 7, '#8a6440', s + 1);
    // mur du fond en planches, étagères chargées
    x.save(); x.beginPath(); x.rect(L, 62, R - L, 56); x.clip();
    for (let i = 0, px = L; px < R; i++, px += 7) plank(x, px, 61, 7, 58, '#7a5a3a', s * 3 + i);
    x.fillStyle = 'rgba(10,16,26,0.45)'; x.fillRect(L, 62, R - L, 10);   // ombre sous la toile
    x.restore();
    for (const sy of [80, 96]) { board(x, L + 3, sy, R - L - 6, 2.4, '#b08a58', s + sy); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(L + 3, sy + 2.4, R - L - 6, 1.2); }
    const COLS = ['#5ad870', '#3ab8e0', '#a05ae0', '#f0c030', '#ff7a3a', '#f0f0f0'];
    for (let i = 0; i < 9; i++) bottle(x, L + 10 + i * 10.4, 80, COLS[i % COLS.length], 1);
    for (let i = 0; i < 7; i++) { const cx = L + 12 + i * 13; if (i % 2) disk(x, cx, 96, ['#5ab0ff', '#f08a30', '#3a8ae0', '#e05ab0'][i % 4], 1); else meat(x, cx, 93, 1); }
    // poteaux de l'auvent
    plank(x, L - 4, 52, 4, 66, '#6a4c30', s + 41); plank(x, R, 52, 4, 66, '#6a4c30', s + 42);
    // comptoir : planches verticales, plateau clair, articles posés dessus
    x.save(); x.beginPath(); x.rect(L - 2, 100, R - L + 4, 17); x.clip();
    for (let i = 0, px = L - 2; px < R + 2; i++, px += 8) plank(x, px, 99, 8, 19, '#a0784c', s * 5 + i);
    x.fillStyle = 'rgba(10,16,26,0.25)'; x.fillRect(L - 2, 100, R - L + 4, 3);
    x.restore();
    board(x, L - 4, 97, R - L + 8, 3.6, '#c8a06a', s + 51);
    for (const [cx, kind, c] of [[L + 8, 'm'], [L + 20, 'b', '#5ad870'], [L + 28, 'b', '#3ab8e0'], [R - 30, 'd', '#f08a30'], [R - 20, 'm'], [R - 9, 'b', '#f0c030']]) {
      if (kind === 'm') meat(x, cx, 95, 1.15); else if (kind === 'b') bottle(x, cx, 97, c, 1.1); else disk(x, cx, 97, c, 1.1);
    }
    // une balance au milieu du comptoir
    { const cx = 75; x.strokeStyle = '#7a6a50'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(cx, 97); x.lineTo(cx, 88); x.moveTo(cx - 7, 89); x.lineTo(cx + 7, 89); x.stroke();
      for (const sx of [-7, 7]) { x.fillStyle = '#c8a040'; x.beginPath(); x.ellipse(cx + sx, 92, 3.4, 1.1, 0, 0, 7); x.fill(); x.strokeStyle = '#7a6a50'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(cx + sx, 89); x.lineTo(cx + sx - 3, 92); x.moveTo(cx + sx, 89); x.lineTo(cx + sx + 3, 92); x.stroke(); } }
    // toile rayée rouge et blanc, bord festonné
    const aT = 44, aB = 62, aL = L - 10, aR = R + 10;
    x.save(); x.beginPath(); x.moveTo(aL + 6, aT); x.lineTo(aR - 6, aT); x.lineTo(aR, aB); x.lineTo(aL, aB); x.closePath(); x.clip();
    for (let i = 0, sx = aL - 4; sx < aR + 8; i++, sx += 8) {
      x.fillStyle = i % 2 ? '#f6f0e4' : '#d8382c';
      x.beginPath(); x.moveTo(sx + (sx - 75) * -0.06, aT); x.lineTo(sx + 8 + (sx + 8 - 75) * -0.06, aT); x.lineTo(sx + 8, aB); x.lineTo(sx, aB); x.closePath(); x.fill();
    }
    const sh = x.createLinearGradient(0, aT, 0, aB); sh.addColorStop(0, 'rgba(255,240,200,0.25)'); sh.addColorStop(1, 'rgba(20,10,30,0.25)'); x.fillStyle = sh; x.fillRect(aL, aT, aR - aL, aB - aT);
    x.restore();
    for (let i = 0, sx = aL; sx < aR; i++, sx += 8) { x.fillStyle = i % 2 ? '#f6f0e4' : '#d8382c'; x.beginPath(); x.arc(sx + 4, aB, 4, 0, Math.PI); x.fill(); x.strokeStyle = 'rgba(90,20,20,0.5)'; x.lineWidth = 0.4; x.beginPath(); x.arc(sx + 4, aB, 4, 0, Math.PI); x.stroke(); }
    x.strokeStyle = 'rgba(90,20,20,0.6)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(aL + 6, aT); x.lineTo(aR - 6, aT); x.lineTo(aR, aB); x.moveTo(aL + 6, aT); x.lineTo(aL, aB); x.stroke();
    // petit toit de tuiles au-dessus de la toile
    roof(x, [[L - 8, 46], [L + 8, 30], [R - 8, 30], [R + 8, 46]], 30, 46, '#a8583a', s + 61, 150);
    // enseigne : une planche avec une grosse viande peinte
    x.strokeStyle = '#3a2a1a'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(62, 31); x.lineTo(64, 24); x.moveTo(88, 31); x.lineTo(86, 24); x.stroke();
    board(x, 58, 12, 34, 13, '#9a6a3a', s + 71);
    x.strokeStyle = '#5a3a1e'; x.lineWidth = 0.8; rr(x, 58, 12, 34, 13, 1.5); x.stroke();
    meat(x, 75, 18.5, 1.5);
    tufts(x, 10, 142, 124.5, s + 81, 16);
  }

  // ------------------------------------------------------------ RESTAURANT (v 0) : la maison-champignon
  function mushroomHouse(x) {
    const s = 13, cx = 75;
    shadow(x, cx, 124, 58, 6);
    // pied : cylindre crème, ombré sur la droite
    const L = 46, R = 104, T = 64, Bt = 122;
    const g = x.createLinearGradient(L, 0, R, 0); g.addColorStop(0, '#fffaf0'); g.addColorStop(0.35, '#f2e6d0'); g.addColorStop(1, '#b8a888');
    x.fillStyle = g; x.beginPath(); x.moveTo(L + 2, T); x.lineTo(R - 2, T); x.quadraticCurveTo(R + 3, 100, R + 1, Bt); x.lineTo(L - 1, Bt); x.quadraticCurveTo(L - 3, 100, L + 2, T); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(90,70,50,0.6)'; x.lineWidth = 0.7; x.stroke();
    // fibres du pied
    x.strokeStyle = 'rgba(160,140,110,0.35)'; x.lineWidth = 0.4;
    for (let i = 0; i < 9; i++) { const fx = L + 4 + i * 6.4; x.beginPath(); x.moveTo(fx, T + 4); x.quadraticCurveTo(fx + 1, 96, fx - 0.5, Bt - 2); x.stroke(); }
    // soubassement de pierres
    for (let i = 0, sx = L - 2; sx < R + 2; i++) { const rx = 2.6 + hash(s, i, 701) * 1.8; stone(x, sx + rx, Bt, rx, 2.2, '#a8a094', s * 3 + i); sx += rx * 1.8; }
    // porte en arche, planches, poignée
    const dl = 67, dr = 83, dt = 96;
    x.fillStyle = '#3a2214'; x.beginPath(); x.moveTo(dl - 1.4, Bt); x.lineTo(dl - 1.4, dt + 2); x.quadraticCurveTo(75, dt - 9, dr + 1.4, dt + 2); x.lineTo(dr + 1.4, Bt); x.closePath(); x.fill();
    x.save(); x.beginPath(); x.moveTo(dl, Bt); x.lineTo(dl, dt + 2); x.quadraticCurveTo(75, dt - 7.4, dr, dt + 2); x.lineTo(dr, Bt); x.closePath(); x.clip();
    for (let i = 0; i < 4; i++) plank(x, dl + i * 4, dt - 8, 4, Bt - dt + 8, '#8a5a34', s + 20 + i);
    x.restore();
    x.fillStyle = '#e8c060'; x.beginPath(); x.arc(dr - 3, 110, 0.9, 0, 7); x.fill();
    // hublots éclairés
    for (const wx of [56, 94]) {
      x.fillStyle = '#5a3a20'; x.beginPath(); x.arc(wx, 92, 6, 0, 7); x.fill();
      const lg = x.createRadialGradient(wx - 1, 91, 0.5, wx, 92, 5); lg.addColorStop(0, '#fff2b0'); lg.addColorStop(1, '#f0a050');
      x.save(); x.shadowColor = '#ffc860'; x.shadowBlur = 3; x.fillStyle = lg; x.beginPath(); x.arc(wx, 92, 4.6, 0, 7); x.fill(); x.restore();
      x.fillStyle = '#5a3a20'; x.fillRect(wx - 0.5, 87.4, 1, 9.2); x.fillRect(wx - 4.6, 91.5, 9.2, 1);
      x.fillStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.arc(wx - 1.6, 90, 1.2, 0, 7); x.fill();
    }
    // enseigne au-dessus de la porte : fourchette et couteau
    board(x, 63, 79, 24, 9, '#a8743c', s + 31); x.strokeStyle = '#5a3a1e'; x.lineWidth = 0.6; rr(x, 63, 79, 24, 9, 1.2); x.stroke();
    x.strokeStyle = '#f4f0e4'; x.lineWidth = 1; x.beginPath(); x.moveTo(71, 81); x.lineTo(71, 86.4); x.moveTo(69.6, 81); x.lineTo(69.6, 83); x.moveTo(72.4, 81); x.lineTo(72.4, 83); x.moveTo(79, 81); x.lineTo(79, 86.4); x.stroke();
    x.fillStyle = '#f4f0e4'; x.beginPath(); x.ellipse(79.6, 82.6, 1.2, 1.8, 0, 0, 7); x.fill();
    // chapeau du champignon : dôme violet, bord ondulé, pois blancs
    const cap = () => { x.beginPath(); x.moveTo(12, 70); x.bezierCurveTo(10, 30, 46, 10, 75, 10); x.bezierCurveTo(104, 10, 140, 30, 138, 70);
      for (let i = 0; i <= 10; i++) { const px = 138 - i * 12.6, py = 70 + (i % 2 ? 3 : 0); x.lineTo(px, py); } x.closePath(); };
    const cg = x.createRadialGradient(52, 26, 4, 75, 44, 76); cg.addColorStop(0, '#d6a8ff'); cg.addColorStop(0.35, '#a670e0'); cg.addColorStop(0.8, '#6e3aa8'); cg.addColorStop(1, '#4a2280');
    cap(); x.fillStyle = cg; x.fill();
    x.save(); cap(); x.clip();
    for (const [px, py, r] of [[40, 34, 7], [70, 22, 6], [100, 30, 7.5], [56, 54, 5.5], [92, 54, 6], [122, 52, 5], [24, 54, 4.5], [118, 34, 3.5]]) {
      const sg = x.createRadialGradient(px - r * 0.3, py - r * 0.35, 0.4, px, py, r); sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.7, '#f2e8ff'); sg.addColorStop(1, '#c8b4e8');
      x.fillStyle = sg; x.beginPath(); x.ellipse(px, py, r, r * 0.78, 0, 0, 7); x.fill();
    }
    // dessous du chapeau (lamelles) et ombre sur le pied
    x.fillStyle = 'rgba(40,10,60,0.35)'; x.fillRect(0, 64, 150, 10);
    x.restore();
    x.strokeStyle = '#3a1660'; x.lineWidth = 0.9; cap(); x.stroke();
    x.fillStyle = '#e8d8c0'; x.beginPath(); x.ellipse(75, 71, 60, 4, 0, 0, Math.PI); x.fill();
    x.strokeStyle = 'rgba(150,120,90,0.6)'; x.lineWidth = 0.35; for (let i = 0; i < 24; i++) { const a = Math.PI * (i + 0.5) / 24; x.beginPath(); x.moveTo(75, 71); x.lineTo(75 - Math.cos(a) * 58, 71 + Math.sin(a) * 3.8); x.stroke(); }
    // cheminée de pierres sur le chapeau
    for (let r = 0, yy = 24; yy > 6; r++, yy -= 3) for (let c = 0; c < 2; c++) stone(x, 106 + c * 4.4 + (r % 2) * 1.2, yy, 2.4, 1.6, '#8a8478', s + r * 5 + c);
    x.fillStyle = '#2a2220'; x.fillRect(104.4, 5, 10, 1.8);
    // ardoise du menu à gauche, petits champignons à droite
    { x.fillStyle = '#6a4424'; x.fillRect(30, 104, 1.4, 18); x.fillRect(40, 104, 1.4, 18);
      x.fillStyle = '#2a2e2a'; rr(x, 28, 98, 15, 16, 1); x.fill(); x.strokeStyle = '#8a6a44'; x.lineWidth = 1; rr(x, 28, 98, 15, 16, 1); x.stroke();
      x.strokeStyle = 'rgba(240,240,230,0.85)'; x.lineWidth = 0.5; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(31, 102 + k * 3); x.lineTo(31 + 5 + hash(k, 1, 711) * 4, 102 + k * 3); x.stroke(); } }
    for (const [mx, my, r, col] of [[116, 122, 4, '#e04a4a'], [123, 123, 3, '#f0a040'], [110, 123.4, 2.4, '#e04a4a']]) {
      x.fillStyle = '#f4ecd8'; x.fillRect(mx - r * 0.3, my - r * 1.2, r * 0.6, r * 1.2);
      x.fillStyle = col; x.beginPath(); x.ellipse(mx, my - r * 1.2, r, r * 0.7, 0, Math.PI, 0); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(mx - r * 0.3, my - r * 1.5, r * 0.2, 0, 7); x.fill();
    }
    tufts(x, 20, 132, 124.5, s + 41, 14);
  }

  // ------------------------------------------------------------ DOJO (v 0) : le petit dojo d'Elecmon
  // plancher surélevé (engawa), murs de papier (shoji) entre des poteaux sombres, porte coulissante entrouverte,
  // toit de tuiles bleues aux bords relevés, plaque à l'éclair, bannières rouges, lanternes de papier
  const bolt = (x, cx, cy, k, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(cx + 1.4 * k, cy - 4 * k); x.lineTo(cx - 2 * k, cy + 0.6 * k); x.lineTo(cx + 0.2 * k, cy + 0.6 * k); x.lineTo(cx - 1.4 * k, cy + 4 * k); x.lineTo(cx + 2.2 * k, cy - 0.8 * k); x.lineTo(cx, cy - 0.8 * k); x.closePath(); x.fill(); };
  function dojoHouse(x) {
    const s = 23, L = 28, R = 122;
    shadow(x, 75, 124, 60, 6);
    // soubassement de pierres et plancher surélevé
    for (let i = 0, sx = L - 2; sx < R + 2; i++) { const rx = 2.6 + hash(s, i, 721) * 1.6; stone(x, sx + rx, 121, rx, 2.4, '#9a948a', s * 3 + i); sx += rx * 1.8; }
    board(x, L - 4, 106, R - L + 8, 6, '#9a6a3a', s + 1);
    board(x, L - 4, 112, R - L + 8, 6, '#7a5230', s + 2);
    // marches devant la porte
    board(x, 63, 117, 24, 4, '#a87a48', s + 3); board(x, 61, 121, 28, 4, '#8a6038', s + 4);
    // murs : poteaux sombres et panneaux de papier
    const shoji = (x0, x1, y0, y1) => {
      const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#e0d8c4');
      x.fillStyle = g; x.fillRect(x0, y0, x1 - x0, y1 - y0);
      x.strokeStyle = '#6a4a2a'; x.lineWidth = 0.7;
      for (let gx = x0 + (x1 - x0) / 3; gx < x1 - 1; gx += (x1 - x0) / 3) { x.beginPath(); x.moveTo(gx, y0); x.lineTo(gx, y1); x.stroke(); }
      for (let gy = y0 + 6; gy < y1 - 1; gy += 6) { x.beginPath(); x.moveTo(x0, gy); x.lineTo(x1, gy); x.stroke(); }
      x.strokeRect(x0, y0, x1 - x0, y1 - y0);
    };
    shoji(L + 4, 60, 72, 106); shoji(90, R - 4, 72, 106);
    // porte coulissante entrouverte : l'intérieur sombre, un tatami
    x.fillStyle = '#2a1e16'; x.fillRect(62, 72, 26, 34);
    x.fillStyle = '#9a8a4a'; x.fillRect(64, 98, 22, 8);
    shoji(62, 74, 72, 106); shoji(81, 88, 72, 106);
    for (const px of [L, 60, 88, R - 4]) plank(x, px, 68, 4, 39, '#4a3020', s + px);
    // poutre sous le toit
    board(x, L - 2, 66, R - L + 4, 4, '#5a3a22', s + 5);
    // lanternes de papier rouges sous l'avant-toit
    for (const lx of [44, 106]) {
      x.strokeStyle = '#2a2a2e'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(lx, 66); x.lineTo(lx, 70); x.stroke();
      const lg = x.createRadialGradient(lx - 1, 73, 0.5, lx, 74, 5); lg.addColorStop(0, '#ff9a6a'); lg.addColorStop(1, '#c02a1a');
      x.save(); x.shadowColor = '#ff8040'; x.shadowBlur = 3; x.fillStyle = lg; x.beginPath(); x.ellipse(lx, 74, 3.6, 4.4, 0, 0, 7); x.fill(); x.restore();
      x.fillStyle = '#2a2a2e'; x.fillRect(lx - 2, 69.4, 4, 1); x.fillRect(lx - 2, 78.2, 4, 1);
    }
    // toit de tuiles bleues aux bords relevés
    const roofPath = () => { x.beginPath(); x.moveTo(L - 14, 64); x.quadraticCurveTo(L - 6, 66, L + 4, 58); x.lineTo(L + 18, 38); x.lineTo(R - 18, 38); x.lineTo(R - 4, 58); x.quadraticCurveTo(R + 6, 66, R + 14, 64); x.quadraticCurveTo(75, 70, L - 14, 64); x.closePath(); };
    const rg = x.createLinearGradient(0, 38, 0, 68); rg.addColorStop(0, '#5a6a9a'); rg.addColorStop(0.6, '#3a4a7a'); rg.addColorStop(1, '#26305a');
    roofPath(); x.fillStyle = rg; x.fill();
    x.save(); roofPath(); x.clip();
    for (let tx = L - 14; tx < R + 16; tx += 3.6) {   // rangées de tuiles rondes
      x.strokeStyle = 'rgba(160,180,230,0.35)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(tx + (75 - tx) * 0.22, 38); x.lineTo(tx, 68); x.stroke();
      x.strokeStyle = 'rgba(10,14,30,0.35)'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(tx + 1.4 + (75 - tx) * 0.22, 38); x.lineTo(tx + 1.4, 68); x.stroke();
    }
    const lgt = x.createLinearGradient(L - 14, 38, R + 14, 68); lgt.addColorStop(0, 'rgba(255,240,200,0.22)'); lgt.addColorStop(0.5, 'rgba(255,240,200,0)'); lgt.addColorStop(1, 'rgba(10,16,40,0.3)');
    x.fillStyle = lgt; x.fillRect(L - 16, 36, R - L + 32, 34);
    x.restore();
    roofPath(); x.strokeStyle = '#141a34'; x.lineWidth = 0.9; x.stroke();
    // faîtage et ornements
    x.fillStyle = '#2a3460'; rr(x, L + 14, 34, R - L - 28, 5, 1.5); x.fill();
    for (const ox of [L + 14, R - 14]) { x.fillStyle = '#d8b040'; x.beginPath(); x.moveTo(ox - 2, 35); x.quadraticCurveTo(ox, 27, ox + (ox < 75 ? -3 : 3), 29); x.quadraticCurveTo(ox + (ox < 75 ? 1 : -1), 31, ox + 2, 35); x.closePath(); x.fill(); }
    // plaque à l'éclair d'Elecmon
    board(x, 63, 44, 24, 13, '#6a4424', s + 6); x.strokeStyle = '#d8b040'; x.lineWidth = 0.8; rr(x, 63, 44, 24, 13, 1.2); x.stroke();
    bolt(x, 75, 50.5, 1.3, '#ffe040');
    // bannières rouges (nobori) à l'éclair
    for (const [bx, dir] of [[20, 1], [130, -1]]) {
      x.fillStyle = '#4a3020'; x.fillRect(bx - 0.8, 60, 1.6, 64);
      x.fillStyle = '#4a3020'; x.fillRect(bx, 62, 9 * dir, 1.2);
      const bl = Math.min(bx, bx + 9 * dir), bg = x.createLinearGradient(bl, 0, bl + 9, 0); bg.addColorStop(0, '#e8402a'); bg.addColorStop(1, '#a82018');
      x.fillStyle = bg; x.beginPath(); x.moveTo(bl, 63); x.lineTo(bl + 9, 63); x.lineTo(bl + 9, 94); x.lineTo(bl + 4.5, 90); x.lineTo(bl, 94); x.closePath(); x.fill();
      bolt(x, bl + 4.5, 76, 1, '#ffe040');
    }
    tufts(x, 12, 140, 124.5, s + 9, 14);
  }
  OBJ.dojo.paint = x => dojoHouse(x); OBJ.dojo.painted = v => v === 0;
  // ------------------------------------------------------------ POSTE de Biyomon (boîte 100 × 98, porte au centre)
  // maison crème au toit bleu arrondi, tourelle-nichoir au toit rouge, enseigne à la lettre, boîte aux lettres rouge
  function postOffice(x) {
    const s = 31, L = 10, R = 90, T = 50, Bt = 94;
    shadow(x, 50, 95, 46, 4.6);
    // murs crème (enduit), soubassement de pierres
    const wg = x.createLinearGradient(L, 0, R, 0); wg.addColorStop(0, '#fff8e6'); wg.addColorStop(0.4, '#f2e6cc'); wg.addColorStop(1, '#c8b896');
    x.fillStyle = wg; x.fillRect(L, T, R - L, Bt - T);
    for (let i = 0; i < 40; i++) { x.fillStyle = hash(i, 1, 731) < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(150,120,80,0.18)'; x.fillRect(L + hash(i, 2, 731) * (R - L), T + hash(i, 3, 731) * (Bt - T), 0.8, 0.8); }
    x.fillStyle = 'rgba(10,20,40,0.35)'; x.fillRect(L, T, R - L, 5);
    for (let i = 0, sx = L - 1; sx < R + 1; i++) { const rx = 2.2 + hash(s, i, 732) * 1.4; stone(x, sx + rx, Bt - 1.6, rx, 2.4, '#b0a898', s * 3 + i); sx += rx * 1.8; }
    // fenêtres éclairées à volets bleus
    for (const wx of [22, 66]) {
      x.fillStyle = '#2a3a6a'; x.fillRect(wx - 3.4, 62, 3, 13); x.fillRect(wx + 12.4, 62, 3, 13);
      x.fillStyle = '#4a3220'; x.fillRect(wx - 0.8, 61.2, 13.6, 14.6);
      const lg = x.createLinearGradient(0, 62, 0, 75); lg.addColorStop(0, '#fff0b0'); lg.addColorStop(1, '#f0a850');
      x.save(); x.shadowColor = '#ffc860'; x.shadowBlur = 3; x.fillStyle = lg; x.fillRect(wx, 62, 12, 13); x.restore();
      x.fillStyle = '#4a3220'; x.fillRect(wx + 5.5, 62, 1, 13); x.fillRect(wx, 68, 12, 1);
      x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.moveTo(wx, 70); x.lineTo(wx + 5, 62); x.lineTo(wx + 7, 62); x.lineTo(wx, 73); x.fill();
      board(x, wx - 2, 75.4, 16, 2, '#8a6440', s + wx);
      for (let k = 0; k < 5; k++) { x.fillStyle = '#3a8a3a'; x.beginPath(); x.arc(wx + 1 + k * 2.6, 74.6, 1.3, 0, 7); x.fill(); x.fillStyle = ['#ff6a8a', '#ffe060', '#ffffff'][k % 3]; x.beginPath(); x.arc(wx + 1 + k * 2.6, 73.8, 0.8, 0, 7); x.fill(); }
    }
    // porte bleue en arche
    x.fillStyle = '#1a2448'; x.beginPath(); x.moveTo(40, Bt - 2); x.lineTo(40, 72); x.quadraticCurveTo(50, 61, 60, 72); x.lineTo(60, Bt - 2); x.closePath(); x.fill();
    const dg = x.createLinearGradient(41, 0, 59, 0); dg.addColorStop(0, '#6a8ad8'); dg.addColorStop(1, '#2a4a98');
    x.fillStyle = dg; x.beginPath(); x.moveTo(41.4, Bt - 2); x.lineTo(41.4, 72.4); x.quadraticCurveTo(50, 63, 58.6, 72.4); x.lineTo(58.6, Bt - 2); x.closePath(); x.fill();
    x.strokeStyle = '#1a2a5a'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(50, 65); x.lineTo(50, Bt - 2); x.stroke();
    x.fillStyle = '#f0c040'; x.beginPath(); x.arc(54.6, 82, 1, 0, 7); x.fill();
    // toit bleu arrondi en écailles
    const roofP = () => { x.beginPath(); x.moveTo(0, 53); x.quadraticCurveTo(6, 36, 50, 20); x.quadraticCurveTo(94, 36, 100, 53); x.quadraticCurveTo(50, 47, 0, 53); x.closePath(); };
    const rg = x.createLinearGradient(0, 20, 0, 53); rg.addColorStop(0, '#6a9ae8'); rg.addColorStop(1, '#2a4a98');
    roofP(); x.fillStyle = rg; x.fill();
    x.save(); roofP(); x.clip();
    for (let r = 0; r < 8; r++) for (let i = -1; i < 22; i++) {
      const cx = i * 5 + (r % 2) * 2.5, cy = 22 + r * 4.4;
      x.fillStyle = `rgba(20,40,110,${0.25 + (r / 20)})`; x.beginPath(); x.arc(cx, cy + 2.2, 2.8, 0, Math.PI); x.fill();
      x.strokeStyle = 'rgba(180,210,255,0.35)'; x.lineWidth = 0.4; x.beginPath(); x.arc(cx, cy + 2.2, 2.6, Math.PI * 0.1, Math.PI * 0.9); x.stroke();
    }
    const lgt = x.createLinearGradient(0, 20, 100, 53); lgt.addColorStop(0, 'rgba(255,245,210,0.25)'); lgt.addColorStop(0.5, 'rgba(255,245,210,0)'); lgt.addColorStop(1, 'rgba(10,20,50,0.3)');
    x.fillStyle = lgt; x.fillRect(0, 18, 100, 38);
    x.restore();
    roofP(); x.strokeStyle = '#14285a'; x.lineWidth = 0.9; x.stroke();
    // tourelle-nichoir (Biyomon y dort) au toit rouge
    const tg = x.createLinearGradient(62, 0, 80, 0); tg.addColorStop(0, '#fff8e6'); tg.addColorStop(1, '#c8b896');
    x.fillStyle = tg; rr(x, 62, 6, 18, 30, 3); x.fill(); x.strokeStyle = "rgba(90,70,50,0.6)"; x.lineWidth = 0.6; rr(x, 62, 6, 18, 30, 3); x.stroke();
    x.fillStyle = '#2a1a10'; x.beginPath(); x.arc(71, 16, 4, 0, 7); x.fill();
    board(x, 66, 21, 10, 1.6, '#8a6440', s + 41);
    x.fillStyle = '#d8402a'; x.beginPath(); x.moveTo(57, 7); x.lineTo(71, -1); x.lineTo(85, 7); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,200,180,0.35)'; x.beginPath(); x.moveTo(57, 7); x.lineTo(71, -1); x.lineTo(70, 2); x.lineTo(60, 7); x.closePath(); x.fill();
    // enseigne : une lettre sur fond rouge
    x.fillStyle = '#d8402a'; rr(x, 30, 36, 26, 14, 2.5); x.fill(); x.strokeStyle = '#8a1a10'; x.lineWidth = 0.7; rr(x, 30, 36, 26, 14, 2.5); x.stroke();
    x.fillStyle = '#f8f0e0'; x.fillRect(35, 39, 16, 9); x.strokeStyle = '#a89878'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(35, 39); x.lineTo(43, 44.4); x.lineTo(51, 39); x.stroke();
    x.fillStyle = '#e8403a'; x.beginPath(); x.arc(43, 45.6, 1.1, 0, 7); x.fill();
    // boîte aux lettres rouge sur son pied
    x.fillStyle = '#5a3a20'; x.fillRect(93, 80, 2, 15);
    const mg = x.createLinearGradient(89, 0, 99, 0); mg.addColorStop(0, '#ff7a6a'); mg.addColorStop(1, '#a82a1a');
    x.fillStyle = mg; rr(x, 89, 68, 10, 13, 3); x.fill(); x.fillStyle = '#3a1a10'; x.fillRect(91.4, 72, 5, 1.1);
    tufts(x, 6, 96, 96.5, s + 51, 10);
  }
  if (OBJ.poste) { OBJ.poste.paint = x => postOffice(x); }
  OBJ.bazar.paint = x => stall(x); OBJ.bazar.painted = v => v === 0;
  OBJ.restaurant.paint = x => mushroomHouse(x); OBJ.restaurant.painted = v => v === 0;
})();
