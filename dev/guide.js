'use strict';
// Guide du joueur (dev) : capture complète d'une carte avec des repères numérotés sur chaque Digimon / enfant,
// et la liste de ce qu'on y trouve (PNJ, Digimon sauvages). À charger dans la page du jeu après dev/shots.js :
//   const g = await DEV.guide('plage');   → enregistre captures/guide_plage.png, renvoie { name, npcs, wild }
(function () {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const nameOf = n => (n.hero ? (DW.HEROES[n.hero] ? DW.HEROES[n.hero].name : n.hero) : DW.SPECIES[n.sp] ? DW.SPECIES[n.sp].name : n.sp);
  async function save(cv, name) {
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    await fetch('/dev/save?name=' + name, { method: 'POST', body: blob });
  }
  DEV.guide = async function (id, hour = 13) {
    const M = DW.getMap(id);
    // beau temps, sans interface ni Digimon sauvages : une vue nette du lieu
    const st = DW.state, spawn = DW.Wild.spawn, toasts = DW.Care.drawToasts, mood = DW.Care.drawMood;
    st.clock = Math.floor(st.clock / 1440) * 1440 + hour * 60;
    st.weather = { type: 'clear', until: st.clock + 6000 };
    DW.Wild.spawn = ow => { ow.wilds = []; }; DW.Care.drawToasts = () => {}; DW.Care.drawMood = () => {};
    await DEV.ensure(id, Math.floor(M.w / 2), Math.floor(M.h / 2));
    const ow = DW.ow; ow.cine = true; ow.wilds = [];
    // héros et partenaire rangés hors de la vue (coin de la carte)
    const big = document.createElement('canvas'); big.width = Math.max(ow.map.w * 16, 320); big.height = Math.max(ow.map.h * 16, 240);
    const g = big.getContext('2d'); g.imageSmoothingEnabled = false;
    const orig = ow.camera, cv = DW.canvas, P = ow.p, F = ow.f, hp = { ...P }, hf = { ...F };
    Object.assign(P, { x: -5, y: -5, sx: -5, sy: -5, tx: -5, ty: -5 }); Object.assign(F, { x: -5, y: -5, sx: -5, sy: -5, tx: -5, ty: -5 });
    for (let cy = 0; cy < big.height; cy += 240) for (let cx = 0; cx < big.width; cx += 320) {
      const X = Math.min(cx, big.width - 320), Y = Math.min(cy, big.height - 240);
      ow.camera = () => ({ cx: X, cy: Y });
      await wait(140);
      g.drawImage(cv, 0, 0, cv.width, cv.height, X, Y, 320, 240);
    }
    ow.camera = orig; Object.assign(P, hp); Object.assign(F, hf); ow.cine = false;
    DW.Wild.spawn = spawn; DW.Care.drawToasts = toasts; DW.Care.drawMood = mood;
    // repères : un rond numéroté par personnage (or : à ramener en ville, rouge : boss, bleu : enfant, blanc : habitant)
    const list = [];
    for (const n of ow.map.npcs || []) {
      if (n.pickup || n.item || n.obj || (!n.sp && !n.hero) || n.hamlet) continue;
      const kind = n.recruit ? 'recruit' : n.hero ? 'kid' : n.gear || ['kuwagamon', 'shellmon', 'whamon'].includes(n.sp) ? 'boss' : 'npc';
      list.push({ n, kind, name: nameOf(n), x: n.x, y: n.y });
    }
    const COL = { recruit: '#ffcc22', boss: '#ff4a3a', kid: '#4aa8ff', npc: '#ffffff' };
    list.forEach((e, i) => {
      const X = e.x * 16 + 8, Y = e.y * 16 - 22;
      g.strokeStyle = '#000'; g.lineWidth = 7; g.beginPath(); g.arc(e.x * 16 + 8, e.y * 16 + 6, 18, 0, 7); g.stroke();
      g.strokeStyle = COL[e.kind]; g.lineWidth = 4; g.stroke();
      g.fillStyle = COL[e.kind]; g.beginPath(); g.arc(X, Y, 14, 0, 7); g.fill();
      g.strokeStyle = '#000'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#000'; g.font = 'bold 18px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), X, Y + 1);
    });
    await save(big, `guide_${id}.png`);
    // Digimon sauvages de la carte
    const wild = (M.encounters || []).map(e => ({ sp: e.sp, name: DW.SPECIES[e.sp] ? DW.SPECIES[e.sp].name : e.sp, min: e.min, max: e.max, w: e.w, night: e.night, flag: e.flag }));
    return { id, name: M.name, w: big.width, h: big.height, npcs: list.map((e, i) => ({ k: i + 1, kind: e.kind, name: e.name, sp: e.n.sp || null, x: e.x, y: e.y })), wild };
  };
})();
