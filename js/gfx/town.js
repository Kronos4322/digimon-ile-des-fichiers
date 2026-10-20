'use strict';
// =====================================================================
//  VILLE DES FICHIERS — bâtiments et petit mobilier urbain
//  (s'ajoutent à World.OBJ ; même moteur de volumes que objects.js)
//  lights : fenêtres éclairées la nuit [x, y, rayon] (repère du sprite)
//  smoke  : sortie de cheminée [x, y]
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ;

  Object.assign(OBJ, {
    // ---------------------------------------------------------- cabane du joueur au début (taudis) : peinte (gfx/maisons.js)
    shack: { w: 80, h: 70, n: 1 },
    // ---------------------------------------------------------- maison de Jijimon : 0 = taudis (ville en ruines, peint : gfx/maisons.js),
    // 1 = rénovée, 2 = cossue (fanions dorés, massifs) : grande maison qui remplit sa parcelle, toit visible en entier ;
    // soubassement de pierre, colombages, porte en arche au centre (la porte de la carte), fenêtres à volets et
    // jardinières, lanternes, enseigne, grand toit de tuiles rouges à deux lucarnes, cheminée, parabole, lierre
    jhouse: { w: 184, h: 118, n: 3, lights: [[60, 82, 18], [124, 82, 18], [92, 74, 20], [52, 34, 12], [132, 34, 12]], smoke: [152, 6], draw(d, v) {
      const Wl = '#ecdcb8', Tb = '#7a4a28', St = '#a8a296', Sd = '#7a7468', R = '#c84a32', Rd = '#9a3424', Rl = '#e06a4a';
      // terrasse en bois, marches
      d.rect(14, 102, 156, 12, '#b8844c', { round: 0.06, tex: 0.3 });
      for (let x = 20; x < 168; x += 9) d.deco.line(x, 103, x, 114, 0.7, '#7a5028');
      d.rect(72, 108, 40, 8, '#c8945a', { round: 0.1 }); d.deco.line(72, 112, 112, 112, 0.8, '#8a5a30');
      // soubassement en pierres
      d.rect(18, 88, 148, 16, St, { round: 0.04, tex: 0.3 });
      for (let y = 92; y < 104; y += 6) for (let x = 18 + ((y / 6) % 2) * 6; x < 166; x += 12) d.deco.rect(x, y, 0.8, 6, Sd);
      d.deco.line(18, 92, 166, 92, 0.8, Sd); d.deco.line(18, 98, 166, 98, 0.8, Sd);
      // murs crème à colombages
      d.rect(20, 50, 144, 40, Wl, { tex: 0.12 });
      for (const x of [20, 52, 132, 162]) d.deco.rect(x, 50, 3, 40, Tb);
      d.deco.rect(20, 50, 144, 3, Tb); d.deco.rect(20, 87, 144, 2, Tb);
      // grande porte en arche (au centre : la porte de la carte)
      d.ell(92, 78, 19, 17, St, 0, { tex: 0.2 }); d.rect(73, 78, 38, 26, St, { tex: 0.2 });
      d.deco.ell(92, 79, 14, 13, '#5a3418'); d.deco.rect(78, 79, 28, 25, '#5a3418');
      d.deco.ell(92, 82, 10, 9, '#7a4a24'); d.deco.rect(82, 82, 20, 22, '#7a4a24');
      for (const x of [87, 92, 97]) d.deco.line(x, 74, x, 104, 0.8, '#5a3418');
      d.deco.circ(99, 92, 1.6, '#e8c860', { unlit: true });
      // enseigne au-dessus de la porte
      d.rect(74, 54, 36, 8, '#8a5a30', { round: 0.2, tex: 0.3 }); d.deco.rect(76, 56, 32, 4, '#c8945a');
      for (let i = 0; i < 6; i++) d.deco.rect(79 + i * 5, 57, 3, 1.6, '#5a3418');
      // lanternes
      for (const x of [60, 124]) { d.tube([[x, 76], [x, 70]], 1.2, 1.2, '#3a3a3a'); d.rect(x - 4, 76, 8, 10, '#2a2a2a', { round: 0.3 }); d.deco.rect(x - 2.6, 78, 5.2, 6, '#ffd070', { unlit: true }); }
      // fenêtres à volets et jardinières fleuries
      for (const x of [36, 148]) {
        d.deco.rect(x - 9, 62, 18, 15, '#5a3a22'); d.deco.rect(x - 7, 64, 14, 11, '#9ad8f0'); d.deco.line(x, 64, x, 75, 0.8, '#5a3a22'); d.deco.line(x - 7, 69.5, x + 7, 69.5, 0.8, '#5a3a22');
        d.deco.rect(x - 7, 64, 5, 3, '#e8f8ff', { unlit: true });
        d.rect(x - 15, 61, 6, 17, '#4a7a3a', { round: 0.1 }); d.rect(x + 9, 61, 6, 17, '#4a7a3a', { round: 0.1 });
        d.rect(x - 10, 77, 20, 5, '#8a5a30', { round: 0.2 });
        [[-7, '#ff6a8a'], [-3, '#ffe060'], [1, '#ffffff'], [5, '#ff6a8a']].forEach(([dx, c]) => { d.deco.circ(x + dx, 76, 1.8, '#3a8a3a'); d.deco.circ(x + dx, 75, 1.2, c, { unlit: true }); });
      }
      // grand toit de tuiles rouges
      d.poly([[4, 56], [30, 14], [154, 14], [180, 56]], R, { tex: 0.18 });
      for (let r = 0; r < 8; r++) { const y = 19 + r * 4.8, x0 = 28 - r * 3.1, x1 = 156 + r * 3.1; for (let x = x0; x < x1; x += 8) d.deco.ell(x + (r % 2) * 4, y, 3.6, 2.4, Rd); }
      d.deco.line(4, 56, 180, 56, 2, '#7a2a1a');
      d.poly([[30, 14], [92, 4], [154, 14]], Rl, { shiny: true });
      // lucarnes
      for (const x of [52, 132]) {
        d.rect(x - 10, 26, 20, 18, Wl, { tex: 0.1 }); d.poly([[x - 13, 28], [x, 16], [x + 13, 28]], R, { shiny: true });
        d.deco.rect(x - 6.5, 30, 13, 11, '#5a3a22'); d.deco.rect(x - 5, 31.4, 10, 8.4, '#9ad8f0'); d.deco.line(x, 31, x, 40, 0.8, '#5a3a22');
        d.deco.rect(x - 5, 31.4, 3.6, 2.6, '#e8f8ff', { unlit: true });
      }
      // cheminée de pierre et parabole (la touche Digimon)
      d.rect(144, 2, 16, 22, St, { round: 0.1, tex: 0.3 }); d.deco.rect(142, 2, 20, 4, Sd);
      d.tube([[92, 14], [92, 6]], 1.4, 1.4, '#7a7a82'); d.ell(92, 4, 8, 4, '#e8ecf0', 0, { shiny: true }); d.deco.circ(92, 4, 1.2, '#5a5a62');
      // lierre qui grimpe sur le coin gauche
      for (let i = 0; i < 12; i++) { const y = 90 - i * 3.4, x = 21 + Math.sin(i * 1.3) * 3; d.deco.circ(x, y, 2.2, i % 3 ? '#3a8a3a' : '#5aaa4a'); }
      if (v === 2) {
        // fanions dorés sous le toit, massifs fleuris de part et d'autre de la terrasse
        for (let k = 0; k < 12; k++) { const x = 14 + k * 13.5; d.deco.poly([[x, 57], [x + 9, 57], [x + 4.5, 64]], k % 2 ? '#ffd040' : '#3a8ae0', { unlit: true }); }
        for (const x of [8, 164]) { d.ell(x + 6, 110, 9, 4, '#3a8a3a'); for (let k = 0; k < 5; k++) d.deco.circ(x + 1 + k * 2.6, 108 - (k % 2) * 2, 1.6, ['#ff6a8a', '#ffe060', '#ffffff', '#ff9ad0', '#b48aff'][k], { unlit: true }); }
      }
    } },
    // ---------------------------------------------------------- Bazar de Gotsumon (5×3)
    bazar: { w: 100, h: 92, n: 1, lights: [[50, 62, 26]] },   // (forme 0 : façade peinte, gfx/facades.js ; agrandie : gfx/grandir.js)

    // ---------------------------------------------------------- Dojo d'Elecmon (5×3)
    dojo: { w: 108, h: 96, n: 1, lights: [[54, 70, 24], [20, 54, 10], [88, 54, 10]] },   // (forme 0 : façade peinte, gfx/facades.js ; agrandie : gfx/grandir.js)

    // ---------------------------------------------------------- Restaurant de Mushroomon (5×3)
    restaurant: { w: 100, h: 104, n: 1, lights: [[34, 72, 18], [72, 72, 18], [52, 50, 14]], smoke: [80, 6] },   // (forme 0 : façade peinte, gfx/facades.js ; agrandie : gfx/grandir.js)

    // ---------------------------------------------------------- Jardin de Yokomon : serre fleurie (5×3)
    garden: { w: 100, h: 90, n: 1, lights: [[50, 58, 26]], draw(d) {
      // muret
      d.rect(6, 72, 88, 15, '#c8b8a0', { round: 0.2, tex: 0.25 });
      for (let x = 10; x < 92; x += 10) d.deco.line(x, 74, x, 86, 0.7, '#9a8a74');
      // serre de verre
      d.blob([[8, 74], [10, 46], [22, 26], [50, 16], [78, 26], [90, 46], [92, 74]], '#a8e0e8', { shiny: true, tex: 0.08 });
      for (const k of [-1, -0.5, 0, 0.5, 1]) d.deco.curve([[50 + k * 42, 74], [50 + k * 38, 44], [50 + k * 22, 24], [50, 17]], 1, '#f4fbff');
      for (const y of [34, 50, 62]) d.deco.curve([[8 + (74 - y) * 0.05, y + 4], [50, y - 10], [92 - (74 - y) * 0.05, y + 4]], 0.9, '#f4fbff');
      // plantes à l'intérieur
      for (const [x, y, r, c] of [[24, 62, 7, '#4aa046'], [40, 58, 8, '#5ab452'], [60, 60, 7, '#3e9a40'], [76, 62, 7, '#5ab452'], [32, 48, 5, '#6ac860'], [66, 46, 5, '#6ac860']]) d.deco.circ(x, y, r, c);
      [[22, 58, '#ff8ac0'], [30, 62, '#fff070'], [42, 54, '#ffffff'], [48, 60, '#ff8ac0'], [58, 56, '#b48aff'], [66, 62, '#fff070'], [76, 58, '#ff8ac0'], [34, 46, '#ffffff'], [64, 44, '#ff8ac0']]
        .forEach(([x, y, c]) => d.deco.circ(x, y, 1.6, c, { unlit: true }));
      // porte en arche fleurie
      d.deco.ell(50, 68, 9, 8, '#7a5a3a'); d.deco.rect(41, 68, 18, 19, '#7a5a3a');
      d.deco.ell(50, 69, 7.4, 6.6, '#cfeef2'); d.deco.rect(42.6, 69, 14.8, 18, '#cfeef2'); d.deco.line(50, 62, 50, 87, 0.8, '#7a5a3a');
      d.tube([[38, 88], [38, 64], [44, 56], [50, 54], [56, 56], [62, 64], [62, 88]], 3.2, 3.2, '#3e9a40', { tex: 0.4 });
      [[38, 80], [38, 70], [41, 60], [47, 55], [53, 55], [59, 60], [62, 70], [62, 80]].forEach(([x, y], i) => d.deco.circ(x, y, 1.8, ['#ff8ac0', '#ffffff', '#fff070'][i % 3], { unlit: true }));
      // girouette fleur
      d.tube([[50, 17], [50, 6]], 1.4, 1.4, '#7a7a82');
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; d.circ(50 + Math.cos(a) * 3, 6 + Math.sin(a) * 3, 2, '#ff9ac8', { noshadow: true }); }
      d.circ(50, 6, 1.6, '#ffe060');
    } },

    // ---------------------------------------------------------- grande fontaine de la place (4×2) : v1 en eau, v2 à sec
    bigfountain: { w: 70, h: 56, n: 3, draw: DW.World.secours.pierre(70, 56) },
    // potager (3×2) : v0 envahi d'herbes, v1 cultivé
    vegpatch: { w: 52, h: 38, n: 2, draw(d, v) {
      if (!v) {
        // champ abandonné : terre craquelée envahie d'herbes folles
        d.blob([[1, 34], [2, 12], [12, 8], [30, 10], [50, 9], [51, 30], [40, 36], [14, 36]], '#7a5a38', { flat: true, tex: 0.3 });
        for (let r = 0; r < 4; r++) d.deco.line(5, 14 + r * 6.5, 47, 15 + r * 6.5, 1.6, '#5e4228');
        for (let i = 0; i < 14; i++) { const x = 4 + ((i * 37) % 44), y = 12 + ((i * 23) % 22); d.tube([[x, y + 3], [x - 1.5, y - 3]], 1.6, 0.6, i % 3 ? '#8a9a3a' : '#6a8a30'); d.tube([[x + 1, y + 3], [x + 2.5, y - 2]], 1.4, 0.6, '#9aaa48'); }
        d.tube([[44, 36], [43, 18]], 1.6, 1.4, '#6a4a2a'); d.tube([[43, 22], [48, 26]], 1.2, 1, '#6a4a2a');
        return;
      }
      d.rect(1, 8, 50, 29, '#7a5030', { round: 0.08, flat: true });
      for (let r = 0; r < 4; r++) {
        const y = 12 + r * 6.5;
        d.deco.rect(3, y + 2, 46, 2.4, '#5a3818');
        for (let x = 6; x < 44; x += 6) { const c = r % 2 ? '#5ab452' : '#7ac850'; d.circ(x, y, 2.8, c, { tex: 0.4, noshadow: true }); if (r % 2) d.deco.circ(x + 1, y + 1, 0.8, '#ff8a3a', { unlit: true }); }
      }
      // épouvantail
      d.tube([[46, 36], [46, 10]], 1.6, 1.6, '#8a5a32');
      d.tube([[39, 16], [53, 16]], 1.4, 1.4, '#8a5a32'); d.blob([[41, 17], [51, 17], [50, 28], [42, 28]], '#4a7ac8', { tex: 0.2 }); d.circ(46, 10, 4, '#e8c878'); d.poly([[40, 8], [46, 3], [52, 8]], '#c8943a');
    } },

    // ---------------------------------------------------------- mobilier urbain
    // clôture de v cases (posée via map.objects)
    fence: { w: v => v * 16, h: 22, n: 1, draw(d, v) {
      const W = v * 16;
      d.rect(0, 8, W, 3, '#c8945a', { round: 0.3, tex: 0.2 }); d.rect(0, 14, W, 3, '#b8844c', { round: 0.3, tex: 0.2 });
      for (let x = 3; x < W; x += 16) { d.rect(x - 2, 4, 4, 17, '#a87442', { round: 0.3, tex: 0.25 }); d.poly([[x - 2, 4.5], [x, 2], [x + 2, 4.5]], '#a87442'); }
      d.rect(W - 4, 4, 4, 17, '#a87442', { round: 0.3, tex: 0.25 });
    } },
    hedge: { w: 18, h: 20, n: 2, draw: DW.World.secours.buisson(18, 20) },
    flowerbed: { w: 20, h: 16, n: 3, draw: DW.World.secours.buisson(20, 16) },
    // PUITS : v 0 = plein (eau sombre qui brille, seau au bout de la corde), v 1 = vide (fond de terre sèche, cailloux,
    // corde effilochée sans seau, toit abîmé, mousse sèche)
    well: { w: 30, h: 40, n: 2, draw: DW.World.secours.pierre(30, 40) },
    crates: { w: 18, h: 24, n: 2, draw: DW.World.secours.boite(18, 24) },
    mailbox: { w: 12, h: 24, n: 1, draw: DW.World.secours.boite(12, 24) },
    bunting: { w: v => v * 16, h: 18, n: 1, draw(d, v) {
      const W = v * 16, cols = ['#e04848', '#ffd040', '#3a8ae8', '#4ac878', '#ff8ac0'];
      d.curve([[0, 3], [W / 2, 9], [W, 3]], 0.9, '#5a4a3a', { noline: true });
      for (let x = 4, i = 0; x < W - 3; x += 7, i++) { const y = 3 + Math.sin((x / W) * Math.PI) * 6; d.poly([[x - 2.6, y], [x + 2.6, y], [x, y + 6]], cols[i % 5], { noline: true, noshadow: true }); }
    } },
    // ---------------------------------------------------------- grand panneau d'affichage de la ville (façon tableau d'école), 2×1
    // v = nombre de notes épinglées (une par habitant revenu, 0 à 8) : le panneau se remplit avec la ville
    noticeboard: { w: 58, h: 62, n: 9, draw: DW.World.secours.boite(58, 62) },
  });
  // avec l'image du joueur (gfx/textures.js) : les affiches des habitants revenus, épinglées par-dessus (v = leur nombre)
  OBJ.noticeboard.surImage = (x, v, w, h) => {
    const notes = ['#fff4a0', '#ffc0d0', '#c0e8ff', '#c8f0b0', '#ffd8a0', '#e0c8ff', '#fff4a0', '#c0e8ff'];
    for (let k = 0; k < v; k++) {
      const nx = w * (0.3 + (k % 4) * 0.11), ny = h * (0.4 + Math.floor(k / 4) * 0.14), r = DW.Art.hash(k, v, 977) - 0.5;
      x.save(); x.translate(nx, ny); x.rotate(r * 0.3);
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(-2, -2.5, 5, 6.5);
      x.fillStyle = notes[k]; x.fillRect(-2.5, -3, 5, 6.5);
      x.fillStyle = '#e04848'; x.beginPath(); x.arc(0, -2.4, 0.8, 0, 7); x.fill();
      x.restore();
    }
  };
})();
