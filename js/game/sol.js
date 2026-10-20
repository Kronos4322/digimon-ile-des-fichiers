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
  DW.Ground = {
    // à l'arrivée sur une carte : les trouvailles du jour qui y sont encore
    decorate(ow) {
      ow.map.npcs = (ow.map.npcs || []).filter(n => !n.ground);
      for (const [x, y, id] of listOf(ow.mapId)) ow.map.npcs.push(npcFor(ow.mapId, x, y, id));
    },
    // une trouvaille apparaît près du héros (appelé en marchant, voir game/companion.js)
    spawn(ow) {
      const P = ow.p, cand = [];
      for (let dy = -5; dy <= 5; dy++) for (let dx = -7; dx <= 7; dx++) {
        const x = P.x + dx, y = P.y + dy, d = Math.abs(dx) + Math.abs(dy);
        if (d < 3 || ow.solid(x, y) || DW.World.isTall(ow.tileAt(x, y)) || '~w_'.includes(ow.tileAt(x, y)) || (ow.map.signs || {})[x + ',' + y]) continue;
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
