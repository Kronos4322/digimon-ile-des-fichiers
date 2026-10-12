'use strict';
// =====================================================================
//  CARTES : outils communs (légende, constructeurs de grilles, soins, intro)
//  Légende complète : voir World.CH dans world.js
//  . herbe  , herbes hautes  = chemin  s sable  ; herbes des dunes  ~ eau
//  _ pont  C falaise  ^ escalier  # canopée  T arbre  b buisson  r/R rocher
//  p palmier  P cabine  S/Z/Q panneau  O source  L tronc  k souche
//  f fleurs  m champignons  v pelouse  : herbes pastel  o pavés  q fleurs pastel
//  c berceau  B cube-jouet  h arbre-bonbon  X éboulis
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const MAPS = DW.MAPS = {};

  // "T17 . = . T20" -> ligne (caractère + nombre de répétitions)
  const rle = s => s.trim().split(/\s+/).map(tok => tok[0].repeat(tok.length > 1 ? +tok.slice(1) : 1)).join('');
  // grille peinte par opérations (pratique pour placer beaucoup d'objets)
  const paint = (w, h, fill, fn) => {
    const g = Array.from({ length: h }, () => Array(w).fill(fill));
    const api = {
      get: (x, y) => g[y] && g[y][x],
      set: (x, y, ch) => { if (g[y] && x >= 0 && x < w) g[y][x] = ch; },
      rect: (x, y, ww, hh, ch) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) api.set(i, j, ch); },
      scatter: (ch, x, y, ww, hh, n, seed, on) => {
        for (let k = 0; k < n; k++) {
          const i = x + Math.floor(DW.Art.hash(k, 1, seed) * ww), j = y + Math.floor(DW.Art.hash(k, 2, seed) * hh);
          if (!on || on.includes(api.get(i, j))) api.set(i, j, ch);
        }
      },
    };
    fn(api);
    return g.map(r => r.join(''));
  };

  DW.getMap = id => {
    const m = MAPS[id];
    if (!m.rows && m.build) m.build(); // cartes générées à la demande (régions)
    if (!m.w) {
      m.w = Math.max(...m.rows.map(r => r.length));
      m.rows.forEach((r, i) => { if (r.length !== m.w) console.warn(`[carte ${id}] ligne ${i} : ${r.length} au lieu de ${m.w}`); });
      m.rows = m.rows.map(r => r.padEnd(m.w, '#'));
      m.h = m.rows.length;
    }
    return m;
  };

  // ------------------------------------------------------------ scripts partagés
  async function healAll(msg) {
    await DW.fade(0.7, 0.3, '#ffffff');
    DW.Audio.sfx('heal');
    st().party.forEach(m => { m.heal(); m.slept = st().clock; m.sick = 0; m.hurt = 0; });
    await DW.wait(1.0);
    await DW.fade(0, 0.3);
    if (msg) await say(msg);
  }

  // ------------------------------------------------------------ introduction
  // scénario d'ouverture : défini dans maps/village.js (réveil chez Jijimon)
  DW.Story = {};

  // ------------------------------------------------------------ générateur de forêt
  // o : { w, h, seed, paths:[{pts, r, dirt}], clearings:[{x,y,rx,ry}], rivers:[{pts, r}], lakes:[{x,y,rx,ry}],
  //       tall:[{x,y,r}], autoTall, deco (densité), bigtrees:[[x,y]], free:[[x,y,r]] (zones sans obstacle), set:[[x,y,ch]],
  //       landmarks:[[ch, nombre]] (repères propres à la zone, posés sur de l'herbe dégagée loin des chemins),
  //       avoid:[[x,y]] (cases à laisser libres : PNJ, objets à ramasser) }
  function forestGen(o) {
    const { w, h, seed } = o;
    const Hs = (x, y, k) => DW.Art.hash(x, y, seed * 31 + k);
    const Ns = (x, y, k) => DW.Art.noise(x, y, seed * 31 + k);
    const g = Array.from({ length: h }, () => Array(w).fill('#'));
    const segD = (px, py, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
      let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t);
    };
    const polyD = (px, py, pts) => { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, segD(px, py, pts[i], pts[i + 1])); return m; };
    const paths = o.paths || [];
    // distances aux chemins calculées une seule fois par case (mêmes valeurs qu'avant, beaucoup plus rapide)
    const PD = paths.map(p => { const a = new Float64Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a[y * w + x] = polyD(x, y, p.pts); return a; });
    const DMIN = new Float64Array(w * h).fill(1e9);
    for (const a of PD) for (let i = 0; i < a.length; i++) if (a[i] < DMIN[i]) DMIN[i] = a[i];
    const pathD = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? DMIN[y * w + x] : Math.min(1e9, ...paths.map(p => polyD(x, y, p.pts))));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = Ns(x * 0.3, y * 0.3, 1) - 0.5;
      if (paths.some((p, k) => PD[k][y * w + x] <= p.r + n * 1.3)) g[y][x] = '.';
      for (const c of o.clearings || []) if (Math.hypot((x - c.x) / c.rx, (y - c.y) / c.ry) < 1 + n * 0.35) g[y][x] = '.';
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = Ns(x * 0.25, y * 0.25, 2) - 0.5;
      for (const r of o.rivers || []) if (polyD(x, y, r.pts) <= r.r + n * 0.8) g[y][x] = '~';
      for (const l of o.lakes || []) if (Math.hypot((x - l.x) / l.rx, (y - l.y) / l.ry) < 1 + n * 0.3) g[y][x] = '~';
    }
    // chemins de terre et ponts
    paths.forEach((p, k) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (PD[k][y * w + x] < 0.62) { if (g[y][x] === '~') g[y][x] = '_'; else if (p.dirt !== false) g[y][x] = '='; }
    } });
    // herbes hautes
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (g[y][x] !== '.') continue;
      const n = Ns(x * 0.3, y * 0.3, 3);
      const inBlob = (o.tall || []).some(t => Math.hypot(x - t.x, y - t.y) < t.r * (0.8 + n * 0.5));
      const auto = o.autoTall != null && Ns(x * 0.17, y * 0.17, 7) > o.autoTall && pathD(x, y) > 1.3;
      if (inBlob || auto) g[y][x] = ',';
    }
    const walk = ch => ch !== '#' && ch !== 'T';
    const near = (x, y, f) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
        if ((dx || dy) && g[y + dy] && g[y + dy][x + dx] !== undefined && f(g[y + dy][x + dx])) return true;
      return false;
    };
    // nénuphars
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '~' && Hs(x, y, 4) < 0.1 && !near(x, y, c => c === '_')) g[y][x] = 'w';
    // lisière d'arbres
    const fr = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '#' && near(x, y, walk)) fr.push([x, y]);
    fr.forEach(([x, y]) => { if (Hs(x, y, 5) < 0.9) g[y][x] = 'T'; });
    const fr2 = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '#' && near(x, y, c => c === 'T') && Hs(x, y, 6) < 0.3) fr2.push([x, y]);
    fr2.forEach(([x, y]) => (g[y][x] = 'T'));
    // décor
    const free = o.free || [];
    const isFree = (x, y) => free.some(([fx, fy, r]) => Math.hypot(x - fx, y - fy) <= r);
    const dens = o.deco != null ? o.deco : 1;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const ch = g[y][x];
      if (ch !== '.' && ch !== ',') continue;
      const r = Hs(x, y, 9) / dens, pd = pathD(x, y);
      if (ch === ',') { if (r < 0.05) g[y][x] = 'n'; continue; }
      if (r < 0.04) g[y][x] = 'f';
      else if (r < 0.065) g[y][x] = 'm';
      else if (r < 0.1 && near(x, y, c => c === 'T' || c === '#')) g[y][x] = 'n';
      else if (pd > 1.6 && !isFree(x, y) && !near(x, y, c => 'bMrkGLHY'.includes(c))) {
        if (r < 0.115) g[y][x] = 'b';
        else if (r < 0.125) g[y][x] = 'M';
        else if (r < 0.132) g[y][x] = 'k';
        else if (r < 0.14) g[y][x] = 'G';
        else if (r < 0.145) g[y][x] = 'H';
      }
    }
    // repères : case d'herbe entourée de cases praticables, loin des chemins et des autres repères
    const marks = [];
    for (const [ch, n] of o.landmarks || []) {
      const cand = [];
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
        if (!'.f,'.includes(g[y][x])) continue;
        let ok = pathD(x, y) > 1.4 && !isFree(x, y) && !(o.avoid || []).some(([ax, ay]) => Math.abs(ax - x) <= 1 && Math.abs(ay - y) <= 1);
        for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (!'.,fmn='.includes(g[y + dy][x + dx])) { ok = false; break; }
        if (ok) cand.push([Hs(x, y, 300 + ch.charCodeAt(0)), x, y]);
      }
      cand.sort((a, b) => a[0] - b[0]);
      let k = 0;
      for (const [, x, y] of cand) {
        if (k >= n) break;
        if (marks.some(([mx, my]) => Math.abs(mx - x) + Math.abs(my - y) < 4)) continue;
        g[y][x] = ch; marks.push([x, y]); k++;
      }
    }
    for (const [x, y] of o.bigtrees || []) { g[y][x] = 'Y'; if (g[y][x - 1] && g[y][x - 1] !== '~') g[y][x - 1] = 'g'; if (g[y][x + 1] !== undefined && g[y][x + 1] !== '~') g[y][x + 1] = 'g'; }
    for (const [x, y, ch] of o.set || []) g[y][x] = ch;
    return g.map(r => r.join(''));
  }

  // ------------------------------------------------------------ Digimon à recruter pour la ville
  // o : { sp, x, y, lvl, face, lines:[...], win, lose, cond(s), noBattle }
  function recruitNPC(o) {
    const name = DW.SPECIES[o.sp].name;
    return {
      sp: o.sp, x: o.x, y: o.y, face: o.face || 'left', recruit: true,
      cond: s => !(s.recruits && s.recruits[o.sp]) && (!o.cond || o.cond(s)),
      talk: async ow => {
        for (const l of o.lines) await say(l, name);
        if (!o.noBattle) {
          if (!st().party.some(m => m.hp > 0)) { await say('Reviens avec un Digimon en forme !', name); return; }
          const r = await DW.ask(`Relever le défi de ${name} ?`);
          if (r !== 0) { await say('Reviens quand tu seras prêt !', name); return; }
          const res = await ow.battle({ enemy: new DW.Digimon(o.sp, o.lvl), boss: true, canLose: true, intro: `${name} veut tester ta force !` });
          if (res !== 'win') { await say(o.lose || "Tu n'es pas encore assez fort... Entraîne-toi et reviens !", name); return; }
          st().party.forEach(m => m.heal());
        }
        await say(o.win, name);
        await DW.Town.recruit(o.sp);
      },
    };
  }

  // ------------------------------------------------------------ chemin de terre sinueux (cartes peintes avec paint)
  // pts : ligne brisée (en cases), r : demi-largeur ; bords irréguliers ; sur l'eau, le chemin devient un pont
  function trail(g, w, h, pts, r, ch = '=', seed = 1) {
    const segD = (x, y, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
      let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segD(x, y, pts[i], pts[i + 1]));
      if (d > r + (DW.Art.hash(x, y, 820 + seed) - 0.5) * 0.7) continue;
      const c = g.get(x, y);
      g.set(x, y, c === '~' || c === 'w' || c === '_' ? '_' : ch);
    }
  }

  DW.MapKit = { say, st, rle, paint, healAll, forestGen, recruitNPC, trail };
})();
