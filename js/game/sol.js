'use strict';
// =====================================================================
//  TROUVAILLES AU SOL : de temps en temps, un DigiChampignon ou de la Digiviande apparaît par terre
//  (3 par jour au plus, à l'extérieur, près du héros). Le partenaire le signale d'un « ! »,
//  mais il ne ramasse rien lui-même : c'est au joueur d'aller le prendre (ESPACE devant l'objet).
//  Les trouvailles restent sur leur carte jusqu'au lendemain : state.ground[mapId] = { day, list: [[x, y, objet]] }.
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const FINDS = [{ id: 'viande', w: 55 }, { id: 'digichampi', w: 45 }];
  const today = () => DW.Time.day();
  const listOf = mapId => {
    const g = st().ground = st().ground || {}, e = g[mapId];
    if (!e || e.day !== today()) g[mapId] = { day: today(), list: [] };
    return g[mapId].list;
  };
  const npcFor = (mapId, x, y, id) => ({ item: id, x, y, walk: false, ground: true, talk: async ow => {
    const L = listOf(mapId), k = L.findIndex(([a, b]) => a === x && b === y);
    if (k >= 0) L.splice(k, 1);
    ow.map.npcs = ow.map.npcs.filter(n => !(n.ground && n.x === x && n.y === y));
    const extra = DW.giveItem(id, 1); DW.Audio.sfx('buy');
    await say(`Tu ramasses ${id === 'viande' ? 'de la Digiviande' : 'un DigiChampignon'} !${DW.extraMsg(extra)}`);
  } });
  // CASES ACCESSIBLES : celles qu'on atteint à pied depuis une entrée de la carte (passages du bord, devant les portes,
  // autour des portails) ou depuis le héros. Une trouvaille ne tombe plus dans un coin fermé par une clôture, une haie ou des
  // maisons (avant : une trentaine de cases possibles en ville, davantage aux Champs). Parcours en largeur sur les obstacles
  // FIXES (sol, décor, collisions de l'atelier, falaises : comme Overworld.solid, sans les personnages ni les Digimon
  // sauvages qui passent) ; refait seulement quand la carte ou ses obstacles changent.
  let acces = null;
  function accessibles(ow) {
    const m = ow.map, W = m.w, H = m.h, ici = ow.p ? ow.p.y * W + ow.p.x : -1;
    // (le héros arrivé dans un coin que les entrées ne rejoignent pas — après un vol, une scène — : on refait le parcours avec lui)
    if (acces && acces.m === m && acces.rows === m.rows && acces.gfx === ow.gfx && acces.fb === m.forceBloque && acces.fl === m.forceLibre && (ici < 0 || acces.vu[ici])) return acces.vu;
    const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const libre = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return false;
      const k = x + ',' + y;
      if (m.forceBloque && m.forceBloque.has(k)) return false;
      if (m.forceLibre && m.forceLibre.has(k)) return true;
      return !DW.SOLID.has(ow.tileAt(x, y)) && !(ow.gfx && ow.gfx.solid && ow.gfx.solid.has(k));
    };
    const vu = new Uint8Array(W * H), file = [];
    const graine = (x, y) => { if (libre(x, y) && !vu[y * W + x]) { vu[y * W + x] = 1; file.push(y * W + x); } };
    for (const w of m.warps || []) for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) graine(x, y);
    for (const d of m.doors || []) { const [dx, dy] = DIR[d.dir] || DIR.up; for (let x = d.x; x < d.x + (d.w || 1); x++) graine(x - dx, d.y - dy); }   // (on y entre en marchant dans sa direction)
    for (const o of m.portails || []) for (let y = o.y - 1; y <= o.y + (o.h || 1); y++) for (let x = o.x - 1; x <= o.x + (o.w || 1); x++) graine(x, y);
    if (ici >= 0 && ici < W * H && !vu[ici]) { vu[ici] = 1; file.push(ici); }   // (là où il se tient, il y est bien arrivé)
    for (let i = 0; i < file.length; i++) {
      const k = file[i], x = k % W, y = (k - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (libre(nx, ny) && !vu[ny * W + nx] && !ow.falaise(x, y, nx, ny)) { vu[ny * W + nx] = 1; file.push(ny * W + nx); }
      }
    }
    acces = { m, rows: m.rows, gfx: ow.gfx, fb: m.forceBloque, fl: m.forceLibre, vu };
    return vu;
  }
  DW.Ground = {
    // à l'arrivée sur une carte : les trouvailles du jour qui y sont encore
    decorate(ow) {
      ow.map.npcs = (ow.map.npcs || []).filter(n => !n.ground);
      for (const [x, y, id] of listOf(ow.mapId)) ow.map.npcs.push(npcFor(ow.mapId, x, y, id));
    },
    // une trouvaille apparaît près du héros (appelé en marchant, voir game/companion.js), sur une case qu'on peut atteindre
    spawn(ow) {
      const P = ow.p, cand = [], vu = accessibles(ow), W = ow.map.w;
      for (let dy = -5; dy <= 5; dy++) for (let dx = -7; dx <= 7; dx++) {
        const x = P.x + dx, y = P.y + dy, d = Math.abs(dx) + Math.abs(dy);
        if (d < 3 || ow.solid(x, y) || !vu[y * W + x] || DW.World.isTall(ow.tileAt(x, y)) || '~w_'.includes(ow.tileAt(x, y)) || (ow.map.signs || {})[x + ',' + y]) continue;
        cand.push([x, y]);
      }
      if (!cand.length) return false;
      const [x, y] = DW.pick(cand), id = DW.weighted(FINDS).id;
      listOf(ow.mapId).push([x, y, id]);
      ow.map.npcs.push(npcFor(ow.mapId, x, y, id));
      return true;
    },
  };
})();
