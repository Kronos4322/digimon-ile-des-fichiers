'use strict';
// =====================================================================
//  CHAPITRE 3 — DÉSERT DES POTEAUX, VILLAGE DES YOKOMON, MONT MIHARASHI (épisode 4 de la saison 1)
//  Thème « desert » : terre sèche pâle, herbes grises, ciel immense ; poteaux télégraphiques penchés
//  et panneaux routiers plantés au milieu de nulle part ; huttes de chaume rondes des Yokomon,
//  fontaine de pierre (à sec tant que Meramon brûle tout), épave de bateau au fond du lac asséché.
//  Tous peints au pinceau HD (o.paint), lumière en haut à gauche comme le reste du décor.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ, TH = DW.World.THEMES, hash = DW.Art.hash;

  // palettes COMMUNES au pays de Meramon : de part et d'autre d'une frontière, la même herbe, la même terre, le même
  // sable et le même feuillage (sinon une ligne droite apparaît au raccord, même quand le terrain se poursuit)
  const GREEN = ['#3e6a2e', '#4a7a36', '#588a40', '#68984a', '#7aa856', '#8eb866'];
  const DIRT = ['#6e5638', '#82683f', '#977c4c', '#ac905c', '#c0a46e', '#d4b884'];
  const SAND = ['#c8bc94', '#d4c8a2', '#ded4b0', '#e8debe', '#f0e8cc', '#f8f2dc'];
  const LEAF = ['#1e3a1a', '#284a22', '#345c2a', '#426e34', '#52803e', '#64924a'];
  Object.assign(TH, {
    // désert des poteaux : terre pâle gris-vert, sable clair, lisières de roche basse
    desert: { grass: ['#8e8c70', '#9e9c7e', '#b0ad8c', '#c0bc9a', '#cecaa8', '#dcd8ba'], canopy: LEAF, dirt: DIRT, sand: SAND,
      cliff: ['#5a4e3c', '#6c5e48', '#807056', '#948466', '#a89878', '#bcae8e'], tall: ['#7a7a5a', '#a4a27e', '#d0ceaa'], trees: [[0, 1]],
      rock: ['#4a2e1e', '#623c26', '#7c4e30', '#96623c', '#b07a4a', '#c8945c', '#dcae72', '#ecc890'],
      objMap: { bush: 'drybush', mossrock: 'boulder', fern: 'drybush', glowshroom: 'drybush', hollowlog: 'boulder', stump: 'drybush' }, trees2: [[0, 1]],
      litter: ['#c8c0a0', '#8a8466'], particle: 'dust', leaves: ['#d8d0b0', '#b8b090'], noFlowers: true, noFlies: true, sky: ['#5aa8f0', '#f4f6ff'], marks: ['telpole', 'roadsign'], vignette: 'rgba(80,70,40,0.22)' },
    // village des Yokomon : terre battue claire, herbe rase verte (les Yokomon entretiennent leurs fleurs)
    yokovillage: { grass: GREEN, canopy: LEAF, dirt: DIRT, sand: SAND, tall: ['#4a7a2a', '#7aaa4a', '#b4dc84'], trees: [[0, 1]], trees2: [[0, 1], [1, 1]],
      litter: ['#e0d8b8', '#7a9a4a'], particle: 'petals', leaves: ['#5a8ae0', '#f0a0c8', '#ffe070'], sky: ['#5aa8f0', '#f4f6ff'], vignette: 'rgba(60,50,20,0.15)' },
    // Mont Miharashi : pentes vertes en terrasses (comme dans l'anime), roche brune, braises au sommet
    miharashi: { rock: ['#2e2a24', '#423a30', '#584c3c', '#6e5e4a', '#86725a', '#a08a6c', '#b8a282', '#d0bc9c'], grass: GREEN, canopy: LEAF, sand: SAND,
      dirt: DIRT, cliff: ['#3a4a2a', '#4a5a34', '#5a6c3e', '#6c7e4a', '#809258', '#94a66a'],
      tall: ['#3a6a2a', '#5a9a3a', '#a4d474'], trees: [[0, 1]], trees2: [[0, 1], [1, 1]], litter: ['#8aa860', '#5a7a3a'], particle: 'ember', leaves: ['#ffb040', '#ff7020'], sky: ['#6ab0f0', '#fff0e0'], vignette: 'rgba(40,20,0,0.2)' },
  });

  // ------------------------------------------------------------ petits outils de pinceau
  const lin = (x, x0, y0, x1, y1, stops) => { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach(([k, c]) => g.addColorStop(k, c)); return g; };
  const shadow = (x, cx, cy, rx, ry, a = 0.3) => { x.fillStyle = `rgba(30,26,10,${a})`; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  const draw0 = (w, h, col) => function (d) { d.rect(w / 2 - 1, 2, 2, h - 4, col); };   // (secours : rendu en volumes si le pinceau manque)

  // ------------------------------------------------------------ poteau télégraphique en bois, un peu penché (v : inclinaison)
  OBJ.telpole = { w: 18, h: 64, n: 4, scale: 1.6, draw: draw0(18, 64, '#a8a49a'),
    paint(x, v) {
      const lean = [-2.4, -1, 1.2, 2.6][v % 4], bx = 9, by = 62, tx = 9 + lean, ty = 3;
      shadow(x, bx + 3, by, 5, 1.6, 0.28);
      // fût : bois grisé par le soleil, éclairé à gauche
      x.save();
      x.beginPath(); x.moveTo(bx - 2, by); x.lineTo(tx - 1.4, ty); x.lineTo(tx + 1.4, ty); x.lineTo(bx + 2, by); x.closePath();
      x.fillStyle = lin(x, bx - 2, 0, bx + 2, 0, [[0, '#e6e2d6'], [0.35, '#c4bfb0'], [0.75, '#948e80'], [1, '#6e685c']]); x.fill();
      x.strokeStyle = 'rgba(60,54,44,0.8)'; x.lineWidth = 0.6; x.stroke();
      x.clip();
      // veines et fentes du bois
      for (let i = 0; i < 7; i++) { const yy = 8 + hash(v, i, 71) * 50, k = (by - yy) / (by - ty), cx = bx + (tx - bx) * k + (hash(v, i, 72) - 0.5) * 1.6;
        x.strokeStyle = 'rgba(70,62,50,0.45)'; x.lineWidth = 0.35; x.beginPath(); x.moveTo(cx, yy); x.lineTo(cx + lean * 0.04, yy + 3 + hash(v, i, 73) * 5); x.stroke(); }
      x.restore();
      // bague de métal au pied
      x.fillStyle = '#5a5850'; x.fillRect(bx - 2.2, by - 9, 4.4, 1.4); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(bx - 2.2, by - 9, 1.2, 1.4);
      // traverses (une ou deux) avec isolateurs de verre
      const bars = v % 2 ? [[8, 15], [15, 10]] : [[8, 15]];
      for (const [yy, hw] of bars) {
        const cx = bx + (tx - bx) * ((by - yy) / (by - ty));
        x.save(); x.translate(cx, yy); x.rotate(lean * 0.02);
        x.fillStyle = lin(x, 0, -1.4, 0, 1.4, [[0, '#d8d2c2'], [1, '#7a7466']]); x.fillRect(-hw / 2 - 1, -1.2, hw + 2, 2.4);
        x.strokeStyle = 'rgba(60,54,44,0.7)'; x.lineWidth = 0.5; x.strokeRect(-hw / 2 - 1, -1.2, hw + 2, 2.4);
        for (const ix of [-hw / 2, -hw / 6, hw / 6, hw / 2]) { x.fillStyle = '#9ad0c0'; x.beginPath(); x.ellipse(ix, -2.4, 0.9, 1.2, 0, 0, 7); x.fill(); x.fillStyle = '#e8fff8'; x.fillRect(ix - 0.5, -3.2, 0.5, 0.6); }
        x.restore();
      }
      // fils cassés qui pendent
      x.strokeStyle = 'rgba(40,40,40,0.55)'; x.lineWidth = 0.4;
      x.beginPath(); x.moveTo(tx - 6, 6); x.quadraticCurveTo(tx - 9, 14, tx - 8, 20); x.stroke();
      if (v > 1) { x.beginPath(); x.moveTo(tx + 6, 6); x.quadraticCurveTo(tx + 9, 12, tx + 7, 17); x.stroke(); }
    } };

  // ------------------------------------------------------------ panneaux routiers (v : sens interdit, cédez le passage, flèche gauche, flèche droite)
  OBJ.roadsign = { w: 18, h: 36, n: 4, scale: 1.3, draw: draw0(18, 36, '#8a8a90'),
    paint(x, v) {
      shadow(x, 10, 34.5, 4, 1.2, 0.28);
      x.fillStyle = lin(x, 8, 0, 10.5, 0, [[0, '#e0e2e8'], [0.5, '#9a9ca6'], [1, '#5c5e66']]); x.fillRect(8, 12, 2.4, 23);
      x.strokeStyle = 'rgba(40,40,50,0.6)'; x.lineWidth = 0.4; x.strokeRect(8, 12, 2.4, 23);
      const cx = 9.2, cy = 8.5;
      if (v === 0) {   // sens interdit
        x.fillStyle = '#8a1010'; x.beginPath(); x.arc(cx, cy, 7.4, 0, 7); x.fill();
        x.fillStyle = lin(x, cx - 7, cy - 7, cx + 7, cy + 7, [[0, '#ff6a5a'], [0.5, '#e02a24'], [1, '#a81414']]); x.beginPath(); x.arc(cx, cy, 6.8, 0, 7); x.fill();
        x.fillStyle = '#f8f6f0'; x.fillRect(cx - 4.8, cy - 1.2, 9.6, 2.4);
        x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(cx - 2.6, cy - 3.6, 2.6, 1.2, -0.5, 0, 7); x.fill();
      } else if (v === 1) {   // cédez le passage (triangle pointe en bas)
        const T = s => { x.beginPath(); x.moveTo(cx - s, cy - s * 0.8); x.lineTo(cx + s, cy - s * 0.8); x.lineTo(cx, cy + s * 0.95); x.closePath(); };
        x.fillStyle = '#b01818'; T(8); x.fill(); x.fillStyle = '#f8f6f0'; T(5.2); x.fill();
        x.strokeStyle = 'rgba(60,10,10,0.7)'; x.lineWidth = 0.5; T(8); x.stroke();
      } else {   // flèches bleues
        const d = v === 2 ? -1 : 1;
        x.fillStyle = '#1a3a7a'; x.fillRect(cx - 8.6, cy - 4.6, 17.2, 9.2);
        x.fillStyle = lin(x, 0, cy - 4, 0, cy + 4, [[0, '#5a8ae0'], [1, '#2a58b0']]); x.fillRect(cx - 8, cy - 4, 16, 8);
        x.fillStyle = '#f4f6fa'; x.beginPath();
        x.moveTo(cx + d * 6, cy); x.lineTo(cx + d * 1.5, cy - 3.2); x.lineTo(cx + d * 1.5, cy - 1.2); x.lineTo(cx - d * 6, cy - 1.2);
        x.lineTo(cx - d * 6, cy + 1.2); x.lineTo(cx + d * 1.5, cy + 1.2); x.lineTo(cx + d * 1.5, cy + 3.2); x.closePath(); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(cx - 8, cy - 4, 16, 1.4);
      }
    } };

  // ------------------------------------------------------------ hutte de chaume ronde des Yokomon (v : 0 paille grise, 1 paille blonde, 2 roussie par Meramon)
  OBJ.yokohut = { w: 64, h: 58, n: 3, draw: draw0(64, 58, '#8a8676'),
    paint(x, v) {
      const burnt = v === 2;
      shadow(x, 34, 53, 30, 5, 0.32);
      // dôme de chaume : pointe en haut, bord évasé qui déborde au ras du sol
      const dome = () => { x.beginPath(); x.moveTo(3, 52); x.bezierCurveTo(2, 34, 14, 14, 31, 7); x.lineTo(33, 7); x.bezierCurveTo(50, 14, 62, 34, 61, 52); x.quadraticCurveTo(32, 58, 3, 52); x.closePath(); };
      const C = burnt ? ['#7a705e', '#5a5244', '#3a342a'] : v === 1 ? ['#d0bc8a', '#a8925e', '#6e5c38'] : ['#b4ae96', '#8c8672', '#5e5a4a'];
      dome(); x.fillStyle = (() => { const g = x.createRadialGradient(22, 18, 2, 32, 34, 34); g.addColorStop(0, C[0]); g.addColorStop(0.55, C[1]); g.addColorStop(1, C[2]); return g; })(); x.fill();
      x.save(); dome(); x.clip();
      // brins de paille en couches (rangs qui suivent la courbe du dôme)
      for (let row = 0; row < 7; row++) {
        const yy = 13 + row * 6.2, half = 6 + Math.sqrt(row + 0.5) * 11.5;
        for (let i = 0; i < 26 + row * 4; i++) {
          const k = i / (25 + row * 4), px = 32 - half + k * half * 2 + (hash(row, i, 81) - 0.5) * 2, len = 5 + hash(row, i, 82) * 3;
          const lite = k < 0.45; x.strokeStyle = lite ? `rgba(240,234,210,${0.28 + hash(row, i, 83) * 0.25})` : `rgba(40,36,26,${0.2 + hash(row, i, 84) * 0.2})`;
          x.lineWidth = 0.5; x.beginPath(); x.moveTo(px, yy); x.quadraticCurveTo(px + (px - 32) * 0.05, yy + len * 0.5, px + (px - 32) * 0.08, yy + len); x.stroke();
        }
        // ombre sous le rebord de chaque rang
        x.strokeStyle = 'rgba(30,26,18,0.25)'; x.lineWidth = 0.8; x.beginPath(); x.ellipse(32, yy + 5.6, half, 1.6, 0, 0.1, Math.PI - 0.1); x.stroke();
      }
      // reflet de lumière en haut à gauche, ombre froide à droite
      x.fillStyle = 'rgba(255,250,230,0.16)'; x.beginPath(); x.ellipse(20, 24, 9, 16, 0.35, 0, 7); x.fill();
      x.fillStyle = 'rgba(30,40,70,0.16)'; x.beginPath(); x.ellipse(52, 38, 10, 18, -0.2, 0, 7); x.fill();
      if (burnt) for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(20,14,10,0.35)'; x.beginPath(); x.ellipse(10 + hash(i, 1, 85) * 44, 20 + hash(i, 2, 85) * 28, 4 + hash(i, 3, 85) * 5, 2 + hash(i, 4, 85) * 3, 0, 0, 7); x.fill(); }
      x.restore();
      // contour
      dome(); x.strokeStyle = 'rgba(46,40,30,0.85)'; x.lineWidth = 0.9; x.stroke();
      // petite porte en arche (à la taille d'un Yokomon)
      x.fillStyle = '#2a2218'; x.beginPath(); x.moveTo(26, 54); x.lineTo(26, 46); x.quadraticCurveTo(32, 39, 38, 46); x.lineTo(38, 54); x.closePath(); x.fill();
      x.fillStyle = '#120e0a'; x.beginPath(); x.moveTo(28, 54); x.lineTo(28, 47); x.quadraticCurveTo(32, 42, 36, 47); x.lineTo(36, 54); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(200,190,160,0.6)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(26, 54); x.lineTo(26, 46); x.quadraticCurveTo(32, 39, 38, 46); x.lineTo(38, 54); x.stroke();
      // faîte : une pointe de bois liée de paille
      x.fillStyle = '#6a5034'; x.beginPath(); x.moveTo(30.6, 8); x.lineTo(32, 0.5); x.lineTo(33.4, 8); x.closePath(); x.fill();
      x.fillStyle = C[0]; x.fillRect(29.5, 6.5, 5, 2); x.strokeStyle = 'rgba(46,40,30,0.7)'; x.lineWidth = 0.4; x.strokeRect(29.5, 6.5, 5, 2);
    } };

  // ------------------------------------------------------------ fontaine de pierre ronde (v : 0 à sec, 1 l'eau jaillit de nouveau)
  OBJ.stonefountain = { w: 80, h: 60, n: 2, frames: 4, draw: draw0(80, 60, '#8a8478'),
    paint(x, v, f = 0) {
      const wet = v === 1;
      shadow(x, 42, 55, 38, 5, 0.3);
      // margelle : un anneau de pierre épais
      const cx = 40, cy = 42, rx = 36, ry = 12, H = 9;
      x.fillStyle = lin(x, 0, cy, 0, cy + H + ry, [[0, '#a49e90'], [1, '#6a6458']]);
      x.beginPath(); x.ellipse(cx, cy + H, rx, ry, 0, 0, Math.PI); x.lineTo(cx - rx, cy); x.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); x.closePath(); x.fill();
      // pierres de la margelle (joints)
      x.strokeStyle = 'rgba(60,54,44,0.55)'; x.lineWidth = 0.5;
      for (let i = 1; i < 12; i++) { const a = Math.PI * i / 12, px = cx - Math.cos(a) * rx, py = cy + Math.sin(a) * ry; x.beginPath(); x.moveTo(px, py); x.lineTo(px, py + H); x.stroke(); }
      x.beginPath(); x.ellipse(cx, cy + H * 0.5, rx, ry, 0, 0, Math.PI); x.stroke();
      // dessus de la margelle
      x.fillStyle = lin(x, cx - rx, cy - ry, cx + rx, cy + ry, [[0, '#dcd6c8'], [1, '#9a9488']]); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill();
      // bassin : eau, ou terre craquelée
      x.save(); x.beginPath(); x.ellipse(cx, cy + 0.5, rx - 4, ry - 3, 0, 0, 7); x.clip();
      if (wet) {
        x.fillStyle = lin(x, 0, cy - ry, 0, cy + ry, [[0, '#2a6aa8'], [1, '#5ab0e0']]); x.fillRect(0, 0, 80, 60);
        for (let i = 0; i < 6; i++) { const r = ((f / 4 + i / 6) % 1) * 30; x.strokeStyle = `rgba(230,250,255,${0.5 * (1 - r / 30)})`; x.lineWidth = 0.6; x.beginPath(); x.ellipse(cx, cy, r, r * 0.33, 0, 0, 7); x.stroke(); }
      } else {
        x.fillStyle = lin(x, 0, cy - ry, 0, cy + ry, [[0, '#6a5a44'], [1, '#9a8866']]); x.fillRect(0, 0, 80, 60);
        x.strokeStyle = 'rgba(50,38,24,0.6)'; x.lineWidth = 0.5;
        for (let i = 0; i < 14; i++) { const px = 8 + hash(i, 1, 91) * 64, py = cy - 8 + hash(i, 2, 91) * 16; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (hash(i, 3, 91) - 0.5) * 9, py + (hash(i, 4, 91) - 0.5) * 4); x.lineTo(px + (hash(i, 5, 91) - 0.5) * 12, py + (hash(i, 6, 91) - 0.5) * 5); x.stroke(); }
      }
      x.restore();
      x.strokeStyle = 'rgba(60,54,44,0.8)'; x.lineWidth = 0.7; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.stroke();
      x.beginPath(); x.ellipse(cx, cy + 0.5, rx - 4, ry - 3, 0, 0, 7); x.stroke();
      // colonne centrale
      x.fillStyle = lin(x, cx - 5, 0, cx + 5, 0, [[0, '#d8d2c4'], [0.5, '#a49e90'], [1, '#6e685c']]);
      x.beginPath(); x.moveTo(cx - 5, cy + 1); x.lineTo(cx - 4, 18); x.lineTo(cx + 4, 18); x.lineTo(cx + 5, cy + 1); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(60,54,44,0.7)'; x.lineWidth = 0.5; x.stroke();
      x.fillStyle = lin(x, cx - 8, 0, cx + 8, 0, [[0, '#e4dfd2'], [1, '#8a8478']]); x.beginPath(); x.ellipse(cx, 18, 8, 2.6, 0, 0, 7); x.fill(); x.stroke();
      // jets d'eau en arcs (comme dans l'anime) ou trace de calcaire séché
      if (wet) {
        x.strokeStyle = 'rgba(220,245,255,0.85)'; x.lineWidth = 1.2;
        for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 1.5, 17); x.bezierCurveTo(cx + s * 4, -2 + (f % 2), cx + s * 14, 2, cx + s * 18, cy - 4); x.stroke(); }
        x.fillStyle = 'rgba(240,252,255,0.8)'; for (let i = 0; i < 8; i++) x.fillRect(cx - 20 + hash(i, f, 93) * 40, cy - 6 + hash(i, f, 94) * 6, 0.8, 0.8);
      } else { x.fillStyle = 'rgba(240,236,220,0.45)'; x.fillRect(cx - 3, 19, 1.2, cy - 20); x.fillRect(cx + 2, 19, 0.8, cy - 22); }
    } };

  // ------------------------------------------------------------ épave d'un vieux bateau à voile, échouée au fond du lac asséché
  OBJ.shipwreck = { w: 112, h: 80, n: 1, draw: draw0(112, 80, '#6a4a2a'),
    paint(x) {
      shadow(x, 58, 72, 52, 7, 0.34);
      x.save(); x.translate(56, 60); x.rotate(-0.07);
      // coque : proue pointue à gauche, poupe haute à droite
      const hull = () => { x.beginPath(); x.moveTo(-54, -16); x.quadraticCurveTo(-30, 12, 0, 12); x.quadraticCurveTo(34, 12, 50, 0); x.lineTo(52, -22); x.lineTo(30, -18); x.lineTo(-20, -16); x.closePath(); };
      hull(); x.fillStyle = lin(x, 0, -22, 0, 12, [[0, '#a87a4a'], [0.45, '#7a5430'], [1, '#3e2a18']]); x.fill();
      x.save(); hull(); x.clip();
      // bordages (planches) et clous
      for (let i = 0; i < 7; i++) { const yy = -18 + i * 4.6; x.strokeStyle = 'rgba(40,26,14,0.6)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(-56, yy - 2); x.quadraticCurveTo(0, yy + 6, 54, yy - 6); x.stroke();
        x.strokeStyle = 'rgba(230,190,140,0.25)'; x.beginPath(); x.moveTo(-56, yy - 1.2); x.quadraticCurveTo(0, yy + 6.8, 54, yy - 5.2); x.stroke(); }
      for (let i = 0; i < 9; i++) { x.strokeStyle = 'rgba(40,26,14,0.4)'; x.beginPath(); const px = -40 + i * 10; x.moveTo(px, -18); x.lineTo(px + 2, 12); x.stroke(); }
      // trou dans la coque, algues séchées, moisissure
      x.fillStyle = '#140c06'; x.beginPath(); x.moveTo(8, -6); x.lineTo(16, -9); x.lineTo(22, -3); x.lineTo(18, 4); x.lineTo(10, 3); x.closePath(); x.fill();
      x.fillStyle = 'rgba(70,90,50,0.45)'; x.fillRect(-56, 4, 112, 10);
      x.restore();
      hull(); x.strokeStyle = 'rgba(30,18,8,0.9)'; x.lineWidth = 0.9; x.stroke();
      // bastingage et cabine de poupe
      x.fillStyle = '#8a6038'; x.fillRect(-20, -19.5, 52, 2.2); x.fillStyle = '#5a3a1e'; for (let i = 0; i < 9; i++) x.fillRect(-18 + i * 6, -24, 1.2, 5);
      x.fillStyle = lin(x, 30, -36, 30, -18, [[0, '#b08050'], [1, '#6a4826']]); x.fillRect(30, -34, 20, 14);
      x.strokeStyle = 'rgba(30,18,8,0.8)'; x.lineWidth = 0.6; x.strokeRect(30, -34, 20, 14);
      x.fillStyle = '#2a1c10'; x.fillRect(34, -30, 4, 4); x.fillRect(42, -30, 4, 4);
      x.fillStyle = '#6a4826'; x.fillRect(28, -36, 24, 2.4);
      // mât brisé et voile en lambeaux
      x.fillStyle = lin(x, -4, 0, 0, 0, [[0, '#c09060'], [1, '#6a4826']]); x.fillRect(-5, -56, 4, 40);
      x.fillStyle = '#e8e0c8'; x.beginPath(); x.moveTo(-1, -52); x.lineTo(20, -48); x.lineTo(16, -40); x.lineTo(22, -34); x.lineTo(6, -30); x.lineTo(-1, -28); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(90,80,60,0.6)'; x.lineWidth = 0.5; x.stroke();
      x.fillStyle = 'rgba(120,100,70,0.3)'; x.beginPath(); x.moveTo(-1, -40); x.lineTo(14, -38); x.lineTo(6, -30); x.lineTo(-1, -28); x.closePath(); x.fill();
      x.fillStyle = '#5a3a1e'; x.beginPath(); x.moveTo(-5, -56); x.lineTo(-3, -60); x.lineTo(-1, -55); x.lineTo(-1, -56); x.closePath(); x.fill();
      // cordages
      x.strokeStyle = 'rgba(40,30,20,0.6)'; x.lineWidth = 0.4;
      x.beginPath(); x.moveTo(-3, -54); x.lineTo(-50, -15); x.moveTo(-3, -54); x.lineTo(30, -20); x.stroke();
      // lumière du soleil sur le flanc
      x.fillStyle = 'rgba(255,240,200,0.12)'; x.beginPath(); x.ellipse(-24, -10, 22, 6, 0.2, 0, 7); x.fill();
      x.restore();
    } };

  // ------------------------------------------------------------ CRATÈRE DU MONT MIHARASHI : grand cratère au sommet
  // lèvre de basalte noir (plus haute au fond, plus basse devant : on voit dedans), lac de lave qui bouillonne
  // (croûte sombre craquelée, veines jaunes, bulles), braises, coulées figées sur les flancs. 4 images animées.
  OBJ.cratere = { w: 176, h: 124, n: 1, frames: 4, smoke: [88, 30], lights: [[88, 70, 90, 'rgba(255,110,30,0.75)']], draw: draw0(176, 124, '#3a2a24'),
    paint(x, v, f = 0) {
      const cx = 88, cy = 74;
      shadow(x, cx, 114, 86, 9, 0.45);
      // cône extérieur : roche brun-noir, rayée de coulées figées
      x.beginPath(); x.moveTo(2, 112); x.bezierCurveTo(10, 70, 40, 34, cx, 30); x.bezierCurveTo(136, 34, 166, 70, 174, 112); x.quadraticCurveTo(cx, 124, 2, 112); x.closePath();
      const g = x.createLinearGradient(0, 30, 176, 112); g.addColorStop(0, '#6a5446'); g.addColorStop(0.45, '#3e302a'); g.addColorStop(1, '#1e1614');
      x.fillStyle = g; x.fill();
      x.save(); x.clip();
      for (let i = 0; i < 70; i++) {   // blocs de basalte
        const bx = hash(i, 1, 801) * 176, by = 34 + hash(i, 2, 801) * 84, r = 3 + hash(i, 3, 801) * 7;
        x.fillStyle = hash(i, 4, 801) < 0.5 ? 'rgba(120,96,80,0.35)' : 'rgba(10,6,6,0.35)'; x.beginPath(); x.ellipse(bx, by, r, r * 0.6, hash(i, 5, 801), 0, 7); x.fill();
      }
      for (let i = 0; i < 9; i++) {   // coulées figées (rouge sombre) qui descendent les flancs
        const sx = 30 + i * 14 + hash(i, 6, 802) * 8, w = 3 + hash(i, 7, 802) * 3;
        x.strokeStyle = `rgba(${120 + i * 6},40,20,0.55)`; x.lineWidth = w; x.beginPath(); x.moveTo(sx, 52 + hash(i, 8, 802) * 6); x.bezierCurveTo(sx + (hash(i, 9, 802) - 0.5) * 20, 80, sx + (hash(i, 10, 802) - 0.5) * 24, 96, sx + (hash(i, 11, 802) - 0.5) * 30, 118); x.stroke();
      }
      const lg = x.createLinearGradient(0, 30, 176, 110); lg.addColorStop(0, 'rgba(255,220,180,0.18)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,20,0.35)');
      x.fillStyle = lg; x.fillRect(0, 28, 176, 96);
      x.restore();
      // la bouche : lèvre arrière haute, intérieur sombre, lac de lave
      const mouth = () => { x.beginPath(); x.ellipse(cx, 58, 52, 20, 0, 0, 7); };
      mouth(); x.fillStyle = '#140c0a'; x.fill();
      x.save(); mouth(); x.clip();
      const lava = x.createRadialGradient(cx, 66, 4, cx, 66, 54);
      lava.addColorStop(0, '#fff6b0'); lava.addColorStop(0.25, '#ffd040'); lava.addColorStop(0.6, '#ff7a18'); lava.addColorStop(1, '#a82a0c');
      x.fillStyle = lava; x.beginPath(); x.ellipse(cx, 66, 50, 15, 0, 0, 7); x.fill();
      // croûte sombre craquelée qui dérive (selon l'image)
      for (let i = 0; i < 16; i++) {
        const px = cx - 42 + ((hash(i, 1, 803) * 84 + f * 3) % 84), py = 58 + hash(i, 2, 803) * 14, r = 4 + hash(i, 3, 803) * 6;
        x.fillStyle = 'rgba(40,14,8,0.75)'; x.beginPath(); x.ellipse(px, py, r, r * 0.4, hash(i, 4, 803), 0, 7); x.fill();
        x.strokeStyle = 'rgba(255,220,90,0.8)'; x.lineWidth = 0.6; x.beginPath(); x.ellipse(px, py, r, r * 0.4, hash(i, 4, 803), 0, 7); x.stroke();
      }
      for (let i = 0; i < 5; i++) { const bx = cx - 30 + hash(i, f, 804) * 60, by = 62 + hash(i, f + 9, 804) * 8; x.fillStyle = 'rgba(255,250,200,0.9)'; x.beginPath(); x.arc(bx, by, 1.2 + hash(i, f, 805) * 1.8, 0, 7); x.fill(); }   // bulles
      // paroi intérieure du fond (éclairée par la lave)
      const wall = x.createLinearGradient(0, 38, 0, 60); wall.addColorStop(0, '#2a1a14'); wall.addColorStop(1, '#c0501a');
      x.fillStyle = wall; x.beginPath(); x.ellipse(cx, 50, 52, 12, 0, Math.PI, 0); x.lineTo(cx + 52, 56); x.quadraticCurveTo(cx, 50, cx - 52, 56); x.closePath(); x.fill();
      x.restore();
      // lèvre de basalte : arrière épaisse et haute, avant basse ; blocs irréguliers
      for (let i = 0; i < 40; i++) {
        const a = i / 40 * Math.PI * 2, rx = cx + Math.cos(a) * 54, ry = 58 + Math.sin(a) * 21, back = Math.sin(a) < 0, r = (back ? 6 : 4.5) + hash(i, 1, 806) * 3;
        const rg = x.createRadialGradient(rx - r * 0.3, ry - r * 0.4, 0.5, rx, ry, r * 1.2); rg.addColorStop(0, back ? '#8a7466' : '#6a5a50'); rg.addColorStop(1, '#1a1210');
        x.fillStyle = rg; x.beginPath(); x.ellipse(rx, ry - (back ? 3 : 0), r * 1.3, r * 0.8, hash(i, 2, 806), 0, 7); x.fill();
        if (!back) { x.fillStyle = 'rgba(255,140,40,0.35)'; x.beginPath(); x.ellipse(rx, ry - r * 0.6, r, r * 0.3, 0, Math.PI, 0); x.fill(); }   // reflet de la lave sur la lèvre avant
      }
      // braises qui s'élèvent
      for (let i = 0; i < 10; i++) { const k = ((hash(i, 1, 807) + f * 0.25) % 1), ex = cx - 40 + hash(i, 2, 807) * 80, ey = 56 - k * 46; x.fillStyle = `rgba(255,${160 + Math.floor(hash(i, 3, 807) * 80)},60,${1 - k})`; x.fillRect(ex + Math.sin(k * 6 + i) * 4, ey, 1.6, 1.6); }
    } };
  // ------------------------------------------------------------ légende des cartes
  const CH = DW.World.CH, add = (ch, o) => { CH[ch] = Object.assign({ t: 'grass', solid: true }, o); if (CH[ch].solid) DW.SOLID.add(ch); };
  add('Ţ', { obj: 'telpole', t: 'dirt' });     // poteau télégraphique
  add('Ŝ', { obj: 'roadsign', t: 'dirt' });    // panneau routier
})();
