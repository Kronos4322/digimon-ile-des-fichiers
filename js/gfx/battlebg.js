'use strict';
// =====================================================================
//  MONDE — fonds de combat et plateformes
// =====================================================================
(function () {
  const Art = DW.Art, hash = Art.hash, fbm = Art.fbm;
  const World = DW.World, PAL = World.PAL;

  // ------------------------------------------------------------ fonds de combat
  const bgCache = {};
  // « foret@autumn » : fond de forêt aux couleurs du thème de la zone (arbres, sol, ciel, repères)
  const SKY = { spring: ['#6cb8f0', '#d8f2e8'], misty: ['#8ab8c0', '#d8ece8'], meadow: ['#5ab0f0', '#f8f0c8'], deep: ['#3a6a8a', '#a8d0c0'],
    autumn: ['#e8a868', '#f8e0b8'], town: ['#6cb8f0', '#e0f4f0'], farm: ['#68b4f0', '#f4f0d0'] };
  const MARK = { spring: ['monolith', 'datapanel'], misty: ['stonelantern', 'pipe'], meadow: ['giantflower', 'antenna'], deep: ['giantshroom', 'pipe'], autumn: ['deadtree', 'antenna'] };
  World.battleBg = key => {
    if (bgCache[key]) return bgCache[key];
    const [type, theme] = key.split('@'), TH = theme && World.THEMES[theme];
    const W = DW.W, H = DW.H, HZ = 100;
    const cv = Art.canvas(W, H), c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    const sky = (TH && TH.sky) || (theme && SKY[theme]) || { foret: ['#6cb8f0', '#cfeef0'], plage: ['#4aa8f4', '#d4f0ff'], village: ['#f0a8d8', '#fff2f0'] }[type];
    let g = c.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, HZ);
    const ground = (cols, seed, ripples) => {
      const id = c.getImageData(0, HZ, W, H - HZ), d = id.data;
      for (let y = 0; y < H - HZ; y++) for (let x = 0; x < W; x++) {
        const depth = (y + 4) / (H - HZ);
        const sx = (x - W / 2) / depth, sy = 40 / depth;
        let v = 2.2 + (fbm(sx * 0.02, sy * 0.06, seed) - 0.5) * 2.6 + Art.bayer(x, y) * 0.7 + depth * 1.2;
        if (ripples && Math.sin(sx * 0.03 + sy * 0.35 + fbm(sx * 0.01, sy * 0.02, seed + 1) * 8) > 0.9) v -= 1;
        if (hash(Math.floor(sx), Math.floor(sy), seed + 2) < 0.02) v += 1;
        const col = cols[DW.clamp(Math.round(v), 0, cols.length - 1)];
        const i = (y * W + x) * 4;
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      }
      c.putImageData(id, 0, HZ);
    };
    const place = (kind, v, x, y, sc = 1, tint) => {
      const s = World.obj(kind, v);
      let img = s.img;
      if (tint) img = Art.tint(s.img, tint);
      c.drawImage(img, Math.round(x - s.w * sc / 2), Math.round(y - s.h * sc), s.w * sc, s.h * sc);
    };
    if (type === 'foret') {
      // arbres du thème (variantes pondérées), silhouettes lointaines teintées par la canopée
      const tv = i => { if (!TH) return i % 3; const tot = TH.trees.reduce((a, t) => a + t[1], 0); let r = hash(i, 7, 33) * tot; for (const [v, w] of TH.trees) { if (r < w) return v; r -= w; } return TH.trees[0][0]; };
      const far = TH ? TH.canopy[3] : '#3d7a64';
      c.fillStyle = TH ? TH.canopy[4] : '#9ac8b0'; c.globalAlpha = 0.55;
      for (let i = 0; i < 12; i++) { c.beginPath(); c.ellipse(i * 30 + 8, HZ, 22, 30 + (i % 3) * 8, 0, Math.PI, 0); c.fill(); }
      c.globalAlpha = 1;
      ground(TH ? TH.grass.map(Art.hex) : PAL.grass, 31, false);
      const TK = (TH && TH.objMap && TH.objMap.tree) || 'tree', tv2 = i => TK === 'tree' ? tv(i) : Math.floor(hash(i, 9, 33) * World.OBJ[TK].n);
      for (let i = 0; i < 14; i++) place(TK, tv2(i), i * 25 + (i % 2) * 8, HZ - 4, 1, far);
      for (let i = 0; i < 10; i++) place(TK, tv2(i + 20), i * 36 + 4, HZ + 6);
      c.fillStyle = 'rgba(0,30,10,0.25)'; c.fillRect(0, HZ, W, 4);
      place(TK, tv2(40), -6, 214, 2); place(TK, tv2(41), W + 4, 206, 2);
      // repères de la zone dans le décor (monolithe, lanterne, fleur géante, champignon, arbre mort) et décor numérique
      if (TH && TH.marks) TH.marks.forEach((k, i) => place(k, 0, i ? 286 : 44, i ? 120 : 118));   // (un ou deux repères)
      else if (theme && MARK[theme]) { place(MARK[theme][0], 0, 44, 118); place(MARK[theme][1], 1, 286, 120); }
      else { place('bush', 1, 150, 112); place('rock', 0, 60, 110); }
      if (theme === 'misty') { const g2 = c.createLinearGradient(0, HZ - 30, 0, HZ + 30); g2.addColorStop(0, 'rgba(230,245,240,0)'); g2.addColorStop(0.5, 'rgba(230,245,240,0.45)'); g2.addColorStop(1, 'rgba(230,245,240,0)'); c.fillStyle = g2; c.fillRect(0, HZ - 30, W, 60); }
      if (theme === 'deep') { c.fillStyle = 'rgba(10,30,20,0.22)'; c.fillRect(0, 0, W, H); }
    } else if (type === 'plage') {
      g = c.createLinearGradient(0, 70, 0, HZ);
      g.addColorStop(0, '#2a74c8'); g.addColorStop(1, '#4ab4e8');
      c.fillStyle = g; c.fillRect(0, 70, W, HZ - 70);
      c.fillStyle = '#5a8a6a'; c.beginPath(); c.ellipse(250, 72, 34, 7, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#7aaa78'; c.beginPath(); c.ellipse(244, 72, 18, 4, 0, Math.PI, 0); c.fill();
      ground(PAL.sand, 41, true);
      g = c.createLinearGradient(0, HZ, 0, HZ + 10);
      g.addColorStop(0, 'rgba(240,255,255,0.9)'); g.addColorStop(1, 'rgba(240,255,255,0)');
      c.fillStyle = g; c.fillRect(0, HZ, W, 10);
      place('booth', 0, 140, 104); place('booth', 0, 154, 104); place('booth', 0, 168, 104);
      place('palm', 0, 10, 232, 2); place('palm', 1, W - 10, 226, 2);
      place('rock', 1, 290, 118);
    } else {
      c.fillStyle = '#e8c0ec';
      for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(i * 64 + 20, HZ, 50, 30, 0, Math.PI, 0); c.fill(); }
      c.fillStyle = '#c8e8c8';
      for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(i * 80 + 50, HZ + 2, 44, 18, 0, Math.PI, 0); c.fill(); }
      ground(PAL.lawn, 51, false);
      for (let i = 0; i < 9; i++) place('candytree', i % 3, i * 40 + 6, HZ + 6);
      place('crib', 0, 120, 112); place('crib', 1, 150, 112); place('block', 0, 200, 114); place('block', 2, 214, 116);
      place('candytree', 0, -4, 230, 2); place('candytree', 2, W + 4, 224, 2);
    }
    return (bgCache[key] = cv);
  };
  World.platform = (c, key, x, y, rx, ry) => {
    const [type, theme] = key.split('@'), TH = theme && World.THEMES[theme];
    const cols = TH && type === 'foret' ? [TH.grass[1], TH.grass[3], TH.grass[4]] : { foret: ['#3a8a3a', '#5cb452', '#74c860'], plage: ['#c8a468', '#e6ca8e', '#f8eac6'], village: ['#76c488', '#a8e4ac', '#ddfad8'] }[type] || ['#555', '#777', '#999'];
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(x, y + 3, rx, ry, 0, 0, 7); c.fill();
    c.fillStyle = cols[0]; c.beginPath(); c.ellipse(x, y + 1, rx, ry, 0, 0, 7); c.fill();
    c.fillStyle = cols[1]; c.beginPath(); c.ellipse(x, y, rx - 2, ry - 2, 0, 0, 7); c.fill();
    c.fillStyle = cols[2]; c.beginPath(); c.ellipse(x - rx * 0.2, y - ry * 0.25, rx * 0.55, ry * 0.4, 0, 0, 7); c.fill();
  };
})();
