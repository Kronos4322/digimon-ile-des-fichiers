'use strict';
// Outils de capture pour le développement (à charger dans la console du jeu) :
//   const s = document.createElement('script'); s.src = 'dev/shots.js'; document.head.appendChild(s);
//   await DEV.town(niveau)        vue d'ensemble de la ville au niveau 0..5
//   await DEV.map('maison')       vue d'ensemble d'une carte
//   DEV.sheet([['jhouse'], ['fence', 4]], 2)   planche d'objets
(function () {
  window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const show = cv => {
    let im = document.getElementById('dbg');
    if (!im) { im = document.createElement('img'); im.id = 'dbg'; im.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;object-fit:contain;background:#000;image-rendering:pixelated;z-index:99'; im.onclick = () => (im.style.display = 'none'); document.body.appendChild(im); }
    im.src = cv.toDataURL(); im.style.display = 'block';
  };
  window.DEV = {
    hide() { const im = document.getElementById('dbg'); if (im) im.style.display = 'none'; },
    async ensure(mapId, x, y) {
      if (!DW.ow || DW.Game.top() !== DW.ow) {
        if (!DW.state.party.length) { DW.state.flags.starter = 'koromon'; DW.addDigimon(new DW.Digimon('koromon', 5)); }
        DW.Game.replaceAll(new DW.Overworld(mapId, x, y, 'down'));
      } else DW.ow.load(mapId, x, y, 'down');
      DW.ow.banner.t = 99;
      await wait(400);
    },
    async map(mapId, x, y, hour) {
      if (hour != null) DW.state.clock = Math.floor(DW.state.clock / 1440) * 1440 + hour * 60;
      const M = DW.getMap(mapId);
      await this.ensure(mapId, x != null ? x : Math.floor(M.w / 2), y != null ? y : Math.floor(M.h / 2));
      const ow = DW.ow, cv = DW.canvas, W = ow.map.w * 16, H = ow.map.h * 16;
      const big = document.createElement('canvas'); big.width = Math.max(W, 320); big.height = Math.max(H, 240);
      const g = big.getContext('2d'); g.imageSmoothingEnabled = false;
      const orig = ow.camera, clock = DW.Time.drawClock, hud = DW.Care.drawHUD;
      DW.Time.drawClock = () => {}; DW.Care.drawHUD = () => {};
      for (let cy = 0; cy < big.height; cy += 240) for (let cx = 0; cx < big.width; cx += 320) {
        const X = Math.min(cx, big.width - 320), Y = Math.min(cy, big.height - 240);
        ow.camera = () => ({ cx: X, cy: Y });
        await wait(120);
        g.drawImage(cv, 0, 0, cv.width, cv.height, X, Y, 320, 240);
      }
      ow.camera = orig; DW.Time.drawClock = clock; DW.Care.drawHUD = hud;
      this.last = big;
      show(big);
      return 'ok';
    },
    // plusieurs cartes réduites sur une même planche (2 colonnes)
    async grid(ids, hour) {
      const cvs = [];
      for (const id of ids) { await this.map(id, null, null, hour); cvs.push(this.last); }
      const big = document.createElement('canvas'); big.width = 960; big.height = Math.ceil(ids.length / 2) * 370;
      const g = big.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, big.width, big.height);
      cvs.forEach((cv, i) => { const k = Math.min(470 / cv.width, 360 / cv.height); g.drawImage(cv, (i % 2) * 480, Math.floor(i / 2) * 370, cv.width * k, cv.height * k); g.fillStyle = '#fff'; g.font = '14px monospace'; g.fillText(ids[i], (i % 2) * 480 + 6, Math.floor(i / 2) * 370 + 16); });
      show(big);
      return 'ok';
    },
    async town(lvl, hour) {
      const ids = ['gotsumon', 'betamon', 'elecmon', 'mushroomon', 'yokomon'];
      DW.state.recruits = {}; ids.slice(0, lvl).forEach(i => (DW.state.recruits[i] = true));
      return this.map('village', 20, 7, hour);
    },
    sheet(list, scale = 2, bg = '#6ab05a') {
      const big = document.createElement('canvas'); big.width = 960; big.height = 720;
      const g = big.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = bg; g.fillRect(0, 0, 960, 720);
      let x = 8, y = 8, rowH = 0;
      for (const [k, v] of list) {
        const s = DW.World.obj(k, v || 0), w = s.w * scale, h = s.h * scale;
        if (x + w > 950) { x = 8; y += rowH + 8; rowH = 0; }
        g.drawImage(s.img, x, y, w, h); x += w + 8; rowH = Math.max(rowH, h);
      }
      show(big);
      return 'ok';
    },
  };
  if (DW.start) DW.start();
})();
