'use strict';
// =====================================================================
//  DANGERS VOLCANIQUES (Mont Miharashi, et toute carte volcanique) : ça brûle
//  - boule de lave (OBJ.bouledelave) et fissure fumante (OBJ.fissure) : on peut marcher dessus, mais ça brûle ;
//  - rocher magmatique (case « ë ») : le toucher brûle ; de temps en temps il rougeoit puis EXPLOSE (étincelles,
//    fumée) et brûle tout ce qui est juste à côté ;
//  - fumerolle (case « ì ») : la toucher brûle ; de temps en temps elle crache un jet de vapeur brûlante ;
//  - boule de lave : de temps en temps, elle gonfle et ÉCLATE (gouttes de lave, éclats, fumée) : ça brûle à côté ;
//  - cratère (map.bouche) : le niveau de la lave monte lentement jusqu'au bord, DÉBORDE (éruption : bombes de lave
//    projetées très haut qui retombent autour, panache de cendres, et les coulées partent), puis redescend : les coulées
//    ne sont plus alimentées et refroidissent. La lave ne coule QUE pendant le débordement ;
//  - coulées de lave (map.coulees : chemins de cases depuis le cratère) : de temps en temps, une coulée descend en
//    serpentant, s'étale au bout en lobes, reste brûlante puis refroidit en croûte noire qui fume.
//  Jamais de K.O. par la lave : le partenaire garde au moins 1 PV (le danger pousse à faire attention, sans punir).
// =====================================================================
(function () {
  const TS = 16, H2 = (a, b, c) => DW.Art.hash(a, b, c);
  const PEINE = { bombe: 0.15, bouledelave: 0.1, fissure: 0.06, coulee: 0.14, rocher: 0.08, explosion: 0.12, fumerolle: 0.05, jet: 0.08, boule: 0.1 };
  const MOTS = {
    bouledelave: n => `Aïe ! ${n} a marché sur une boule de lave !`,
    fissure: n => `Un jet de vapeur brûlante jaillit de la fissure ! ${n} est ébouillanté !`,
    coulee: n => `La coulée de lave brûle les pattes de ${n} !`,
    rocher: n => `Ce rocher magmatique est brûlant ! ${n} s'est brûlé en le touchant.`,
    explosion: n => `BOUM ! Le rocher magmatique a explosé tout près ! ${n} est criblé d'éclats brûlants.`,
    fumerolle: n => `La fumerolle est brûlante ! ${n} retire vite la patte.`,
    jet: n => `PSCHHH ! La fumerolle a craché un jet de vapeur sur ${n} !`,
    bombe: n => `Une bombe de lave s'écrase juste à côté ! ${n} est brûlé par les projections !`,
    boule: n => `PLOC ! Une boule de lave a éclaté juste à côté ! ${n} est éclaboussé de lave et d'éclats brûlants.`,
  };
  const etat = new WeakMap();
  // état d'une carte : coulées, rochers magmatiques, fumerolles, dangers déjà annoncés
  function E(map) {
    let s = etat.get(map); if (s) return s;
    s = { vus: new Set(), parts: [], coulees: (map.coulees || []).map((c, i) => ({ c, phase: 'repos', t: 2 + Math.random() * 18, n: 0, v: 2.2 + Math.random() * 1.4, w: 4.8 + Math.random() * 2.8, seed: i * 7 + 3, pts: null })), sources: [],
      cr: map.bouche ? { niv: 0, phase: 'bas', t: 6 + Math.random() * 10 } : null };
    for (const C of s.coulees) C.t += 10;   // (les coulées partent surtout quand le cratère déborde)
    for (const o of map.objects || []) if (o.kind === 'bouledelave') s.sources.push({ x: o.x, y: o.y, k: 'boule', phase: 'calme', t: 3 + Math.random() * 14 });
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const c = map.rows[y][x];
      if (c === 'ë') s.sources.push({ x, y, k: 'rocher', phase: 'calme', t: 4 + Math.random() * 20 });
      else if (c === 'ì') s.sources.push({ x, y, k: 'fumerolle', phase: 'calme', t: 2 + Math.random() * 12 });
    }
    etat.set(map, s); return s;
  }
  const volcanique = map => !!(map.coulees || map.bouche || E(map).sources.length || (map.objects || []).some(o => o.kind === 'bouledelave' || o.kind === 'fissure'));
  // cases chaudes des coulées (pendant qu'elles coulent, et un moment après)
  function chaudes(map) {
    const out = new Set(); for (const C of E(map).coulees) if (C.phase === 'coule' || (C.phase === 'fige' && C.t > 4.5)) for (let i = 0; i < Math.min(C.c.length, Math.floor(C.n)); i++) out.add(C.c[i][0] + ',' + C.c[i][1]);
    return out;
  }
  // brûlure : PV perdus (au moins 1 PV gardé), secousse, chiffre rouge ; le message une seule fois par sorte de danger
  function bruler(ow, k) {
    const m = ow.partner; if (!m) return null;
    const perte = Math.min(m.hp - 1, Math.max(1, Math.round(m.maxHp * PEINE[k])));
    if (perte > 0) m.hp -= perte;
    ow.shake = 0.25; DW.Audio.sfx('bump'); if (DW.Input && DW.Input.rumble) DW.Input.rumble(0.3, 120);
    L.bulles.push({ x: ow.p.x * TS + 8, y: ow.p.y * TS - 6, t: 0, txt: perte > 0 ? `-${perte}` : '…' });
    const S = E(ow.map); if (S.vus.has(k)) return null; S.vus.add(k);
    return async () => { await DW.say(`${MOTS[k](m.name)} (-${perte} PV)${m.hp <= 1 ? ` ${m.name} est à bout de forces : il faut vite se soigner !` : ''}`); };
  }
  const L = DW.Lave = {
    bulles: [],
    etat: E,   // (pour les essais : état des coulées et des rochers d'une carte)
    danger(map, x, y) {
      if (map.coulees && chaudes(map).has(x + ',' + y)) return 'coulee';
      for (const o of map.objects || []) if ((o.kind === 'bouledelave' || o.kind === 'fissure') && x >= o.x && x < o.x + (o.w || 1) && y >= o.y && y < o.y + (o.h || 1)) return o.kind;
      return null;
    },
    // ÉRUPTION d'un piège (les Corniches de l'Abîme : maps/sous_volcan.js) : des coulées sur ces chemins, qui partent tout
    // de suite (tot) ou au fil du temps, puis reviennent de temps en temps comme les autres
    declencher(map, chemins, tot = true) {
      const S = E(map); map.coulees = map.coulees || [];
      for (const c of chemins) {
        if (map.coulees.includes(c)) continue;
        map.coulees.push(c);
        S.coulees.push({ c, phase: 'repos', t: tot ? Math.random() * 2.5 : 3 + Math.random() * 25, n: 0, v: 2.4 + Math.random() * 1.4, w: 4.8 + Math.random() * 2.8, seed: S.coulees.length * 7 + 3, pts: null });
      }
    },
    // après chaque pas du héros
    pas(ow) { if (!volcanique(ow.map)) return null; const k = L.danger(ow.map, ow.p.x, ow.p.y); return k ? bruler(ow, k) : null; },
    // le héros se cogne à une case (game/overworld.js : tryMove) : rocher magmatique ou fumerolle brûlants
    touche(ow, x, y) {
      const c = ow.map.rows[y] && ow.map.rows[y][x], k = c === 'ë' ? 'rocher' : c === 'ì' ? 'fumerolle' : null; if (!k) return;
      const S = E(ow.map), now = ow.t || 0; if (S.dernierContact && now - S.dernierContact < 0.8) return; S.dernierContact = now;
      const ev = bruler(ow, k); if (ev) ow.runScript(ev);
    },
    update(ow, dt) {
      for (const b of L.bulles) b.t += dt; L.bulles = L.bulles.filter(b => b.t < 1.1);
      const map = ow.map; if (!volcanique(map)) return;
      const S = E(map), P = ow.p;
      for (const C of S.coulees) {
        C.t -= dt;
        if (C.phase === 'repos' && C.t <= 0) { if (!S.cr) { C.phase = 'coule'; C.n = 0; } }
        else if (C.phase === 'coule') {
          // elle file dans les pentes (le long d'une falaise, par-dessus un rebord) et ralentit sur le plat, puis en s'allongeant
          const [x, y] = C.c[Math.min(C.c.length - 1, Math.floor(C.n))], [x2, y2] = C.c[Math.min(C.c.length - 1, Math.floor(C.n) + 1)];
          const pente = map.rows[y][x] === 'Ŵ' ? 2.8 : map.alt && map.alt[y2 * map.w + x2] < map.alt[y * map.w + x] ? 2 : 1;
          C.n += dt * C.v * pente * (1 - Math.min(0.4, C.n / C.c.length * 0.4)); if (C.n >= C.c.length) { C.phase = 'fige'; C.t = 7; }
        }
        else if (C.phase === 'fige' && C.t <= 0) { C.phase = 'repos'; C.t = 20 + Math.random() * 40; C.n = 0; C.v = 2.2 + Math.random() * 1.4; }
      }
      const K = S.cr;
      if (K) {
        K.t -= dt;
        const O = DW.World.OBJ.bouche, F = O.forme, bx = map.bouche.x * TS, by = map.bouche.y * TS - 1;
        // un point au hasard sur la lave (pour les gerbes et les bombes)
        const surLave = () => { const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 0.75; return [bx + F.cx + Math.cos(a) * F.rx * d, by + F.cy + F.ry * 0.1 + Math.sin(a) * F.ry * 0.65 * d]; };
        if (K.phase === 'bas' && K.t <= 0) { K.phase = 'monte'; K.t = 14; }
        else if (K.phase === 'monte') {
          const u = 1 - Math.max(0, K.t) / 14; K.niv = u * u * (3 - 2 * u);
          if (K.niv > 0.7 && Math.random() < dt * 3) { const [x, y] = surLave(); for (let i = 0; i < 5; i++) S.parts.push({ x, y, vx: (Math.random() - 0.5) * 40, vy: -50 - Math.random() * 50, t: 0, vie: 0.6 + Math.random() * 0.4, k: 'goutte' }); }   // ça bouillonne de plus en plus
          if (K.t <= 0) {   // À RAS BORD : le volcan entre en éruption, la lave déborde et les coulées partent
            K.phase = 'haut'; K.t = 16; K.erupt = 0; ow.shake = Math.max(ow.shake || 0, 0.6); DW.Audio.sfx('roar');
            const libres = S.coulees.filter(C => C.phase === 'repos').sort(() => Math.random() - 0.5);
            for (const C of libres.slice(0, 3 + Math.floor(Math.random() * 3))) { C.phase = 'coule'; C.n = 0; C.v = 2.4 + Math.random() * 1.4; }
          }
        }
        else if (K.phase === 'haut') {
          K.niv = 1.1 + Math.sin(K.t * 2.5) * 0.02;   // (au-dessus de la lèvre : ça déborde)
          // ÉRUPTIONS : éclair, secousse, bombes de lave projetées très haut qui retombent autour, gerbe, panache de cendres
          K.erupt -= dt;
          if (K.erupt <= 0) {
            K.erupt = 0.9 + Math.random() * 1.4;
            const [x, y] = surLave(), fort = 0.7 + Math.random() * 0.5;
            S.flashs = S.flashs || []; S.flashs.push({ x, y: y - 10, t: 0, r: 70 * fort });
            ow.shake = Math.max(ow.shake || 0, 0.45 * fort); DW.Audio.sfx('explode'); if (DW.Input && DW.Input.rumble) DW.Input.rumble(0.5 * fort, 200);
            for (let i = 0; i < 8 + fort * 8; i++) { const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 120; S.parts.push({ k: 'bombe', gx: x, gy: y, vgx: Math.cos(a) * d / 2.2, vgy: Math.sin(a) * d * 0.75 / 2.2 + 12, h: 0, vh: 190 + Math.random() * 120 * fort, r: 2.2 + Math.random() * 2.2, t: 0, vie: 8, x, y }); }
            for (let i = 0; i < 26; i++) { const an = -Math.PI / 2 + (Math.random() - 0.5) * 1.4, v = 60 + Math.random() * 110; S.parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, t: 0, vie: 0.7 + Math.random() * 0.6, k: i % 2 ? 'goutte' : 'etincelle' }); }
            for (let i = 0; i < 7; i++) S.parts.push({ x: x + (Math.random() - 0.5) * 20, y: y - 6, vx: (Math.random() - 0.5) * 16, vy: -22 - Math.random() * 26, t: 0, vie: 2.6 + Math.random() * 1.6, k: 'cendre' });
          }
          if (K.t <= 0) {   // la lave redescend : les coulées ne sont plus alimentées, elles s'arrêtent et refroidissent
            K.phase = 'descend'; K.t = 18;
            for (const C of S.coulees) if (C.phase === 'coule') { C.phase = 'fige'; C.t = 7; }
          }
        }
        else if (K.phase === 'descend') { const u = Math.max(0, K.t) / 18; K.niv = u * u * (3 - 2 * u); if (K.t <= 0) { K.phase = 'bas'; K.niv = 0; K.t = 20 + Math.random() * 25; } }
      }
      // rochers magmatiques et fumerolles : calme → charge (ça rougeoit / ça gronde) → éclat (explosion, jet)
      for (const Q of S.sources) {
        Q.t -= dt;
        const CH = { rocher: 1.4, fumerolle: 0.7, boule: 1 }, EC = { rocher: 0.9, fumerolle: 1.4, boule: 0.7 }, PAUSE = { rocher: [9, 22], fumerolle: [4, 12], boule: [6, 16] };
        if (Q.phase === 'calme' && Q.t <= 0) { Q.phase = 'charge'; Q.t = CH[Q.k]; }
        else if (Q.phase === 'charge' && Q.t <= 0) {
          Q.phase = 'eclat'; Q.t = EC[Q.k];
          const X = Q.x * TS + 8, Y = Q.y * TS + (Q.k === 'fumerolle' ? 10 : 7);
          if (Q.k === 'fumerolle') for (let i = 0; i < 14; i++) S.parts.push({ x: X, y: Y, vx: (Math.random() - 0.5) * 12, vy: -40 - Math.random() * 30, t: 0, vie: 0.6 + Math.random() * 0.7, k: 'vapeur' });
          else {
            // EXPLOSION : étincelles, gouttes de lave, éclats de roche noire qui retombent, et un panache de fumée
            const fort = Q.k === 'rocher' ? 1 : 0.7;
            for (let i = 0; i < 26 * fort; i++) { const a = Math.random() * Math.PI * 2, v = (30 + Math.random() * 70) * fort; S.parts.push({ x: X, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 35, t: 0, vie: 0.5 + Math.random() * 0.6, k: i % 3 === 0 ? 'goutte' : 'etincelle' }); }
            for (let i = 0; i < 8 * fort; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = (40 + Math.random() * 50) * fort; S.parts.push({ x: X, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, vie: 0.7 + Math.random() * 0.4, k: 'eclat', r: Math.random() * 6 }); }
            for (let i = 0; i < 6; i++) S.parts.push({ x: X + (Math.random() - 0.5) * 8, y: Y - 2, vx: (Math.random() - 0.5) * 14, vy: -16 - Math.random() * 18, t: 0, vie: 1.2 + Math.random() * 0.8, k: 'fumee' });
            S.flashs = S.flashs || []; S.flashs.push({ x: X, y: Y, t: 0 });
            if (Q.k === 'rocher') DW.Audio.sfx('bump');
          }
          const d = Math.max(Math.abs(P.x - Q.x), Math.abs(P.y - Q.y));
          if (Math.hypot(ow.p.x * TS - Q.x * TS, ow.p.y * TS - Q.y * TS) < 80) { ow.shake = Math.max(ow.shake || 0, Q.k === 'rocher' ? 0.35 : 0.15); }
          if (d <= 1 && !ow.locked) { const ev = bruler(ow, Q.k === 'rocher' ? 'explosion' : Q.k === 'boule' ? 'boule' : 'jet'); if (ev) ow.runScript(ev); }
        } else if (Q.phase === 'eclat' && Q.t <= 0) { Q.phase = 'calme'; Q.t = PAUSE[Q.k][0] + Math.random() * PAUSE[Q.k][1]; }
      }
      for (const p of S.parts) if (p.k === 'bombe') {
        p.t += dt; p.gx += p.vgx * dt; p.gy += p.vgy * dt; p.h += p.vh * dt; p.vh -= 260 * dt;
        if (p.h <= 0 && p.vh < 0) {
          p.t = p.vie;
          for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = 30 + Math.random() * 50; S.parts.push({ x: p.gx, y: p.gy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, vie: 0.4 + Math.random() * 0.4, k: i % 2 ? 'goutte' : 'eclat', r: Math.random() * 6 }); }
          S.parts.push({ x: p.gx, y: p.gy - 2, vx: 0, vy: -14, t: 0, vie: 1.2, k: 'fumee' });
          S.impacts = S.impacts || []; S.impacts.push({ x: p.gx, y: p.gy, t: 0, r: p.r });
          if (Math.abs(P.x * TS + 8 - p.gx) < 15 && Math.abs(P.y * TS + 10 - p.gy) < 14 && !ow.locked) { ow.shake = Math.max(ow.shake || 0, 0.3); const ev = bruler(ow, 'bombe'); if (ev) ow.runScript(ev); }
        }
      }
      if (S.impacts) { for (const m of S.impacts) m.t += dt; S.impacts = S.impacts.filter(m => m.t < 4); }
      for (const p of S.parts) { if (p.k === 'bombe') continue; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.k === 'cendre') { p.vx *= 0.99; p.vy *= 0.995; continue; } if (p.k === 'etincelle' || p.k === 'goutte' || p.k === 'eclat') p.vy += 150 * dt; else p.vx *= 0.96; if (p.k === 'eclat') p.r += dt * 12; }
      if (S.flashs) { for (const f of S.flashs) f.t += dt; S.flashs = S.flashs.filter(f => f.t < 0.35); }
      S.parts = S.parts.filter(p => p.t < p.vie);
      // le héros ne reste pas sur une coulée qui arrive sous ses pieds sans le sentir
      if (!P.moving && !ow.locked && chaudes(map).has(P.x + ',' + P.y)) { S.pique = (S.pique || 0) - dt; if (S.pique <= 0) { S.pique = 1; const ev = L.pas(ow); if (ev) ow.runScript(ev); } }
    },
    // ---------------------------------------------------------------- dessin au sol : coulées, lueurs des rochers
    draw(ow, c) {
      const map = ow.map; if (!volcanique(map)) return;
      const S = E(map), t = ow.t || 0, { cx, cy } = ow.camera(), V = [cx - 40, cy - 40, cx + DW.W + 40, cy + DW.H + 60];
      if (map.bouche) bouche(c, map, S, t);
      for (const m of S.impacts || []) { const a = 1 - m.t / 4, rr = m.r * 2.2; c.fillStyle = `rgba(40,18,12,${0.6 * a})`; c.beginPath(); c.ellipse(m.x, m.y, rr * 1.4, rr * 0.8, 0, 0, 7); c.fill(); c.fillStyle = `rgba(255,${Math.round(120 + 100 * a)},40,${a})`; c.beginPath(); c.ellipse(m.x, m.y, rr * 0.8 * a + 0.5, rr * 0.45 * a + 0.4, 0, 0, 7); c.fill(); }
      for (const p of S.parts) if (p.k === 'bombe') { const k = Math.max(0.3, 1 - p.h / 200); c.fillStyle = `rgba(20,10,8,${0.35 * k})`; c.beginPath(); c.ellipse(p.gx, p.gy, p.r * 1.6 * k + 1, p.r * 0.8 * k + 0.5, 0, 0, 7); c.fill(); }
      for (const C of S.coulees) if (C.phase !== 'repos') coulee(c, map, C, t, V);
      for (const Q of S.sources) if (Q.phase !== 'calme') {
        const X = Q.x * TS + 8, Y = Q.y * TS + 9;
        if (Q.k === 'rocher') { const a = Q.phase === 'charge' ? 0.4 + 0.4 * Math.sin(t * 30) * (1 - Q.t / 1.4) + (1 - Q.t / 1.4) * 0.4 : Math.max(0, Q.t / 0.9); const g = c.createRadialGradient(X, Y, 1, X, Y, 18); g.addColorStop(0, `rgba(255,220,120,${a})`); g.addColorStop(0.5, `rgba(255,110,30,${a * 0.6})`); g.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(X, Y, 18, 0, 7); c.fill(); }
        else if (Q.k === 'boule') { if (Q.phase === 'charge') { const u = 1 - Q.t / 1, g = c.createRadialGradient(X, Y - 1, 1, X, Y - 1, 8 + u * 8); g.addColorStop(0, `rgba(255,240,170,${0.5 + u * 0.4})`); g.addColorStop(1, 'rgba(255,100,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(X, Y - 1, 8 + u * 8, 0, 7); c.fill(); c.fillStyle = 'rgba(255,230,140,0.95)'; c.beginPath(); c.arc(X + Math.sin(t * 40) * 1.2, Y - 2 - u * 2, 1.5 + u * 2.5, 0, 7); c.fill(); } }
        else if (Q.phase === 'charge') { c.fillStyle = `rgba(240,236,230,${0.3 + Math.sin(t * 40) * 0.15})`; c.beginPath(); c.arc(X + Math.sin(t * 50) * 1.5, Y - 4, 3, 0, 7); c.fill(); }
      }
    },
    // ---------------------------------------------------------------- au-dessus de tout : étincelles, fumée, vapeur, PV perdus
    drawTop(ow, c) {
      const map = ow.map;
      if (volcanique(map)) for (const p of E(map).parts) {
        const u = p.t / p.vie;
        if (p.k === 'bombe') {   // bombe de lave en vol : traînée de feu, croûte sombre, cœur brillant
          const X = p.gx, Y = p.gy - p.h, tx = X - p.vgx * 0.06, ty = Y + p.vh * 0.06;
          c.strokeStyle = 'rgba(255,140,40,0.55)'; c.lineWidth = p.r * 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(X, Y); c.stroke();
          c.fillStyle = '#4a1a0e'; c.beginPath(); c.arc(X, Y, p.r + 0.8, 0, 7); c.fill();
          c.fillStyle = '#ff9a30'; c.beginPath(); c.arc(X, Y, p.r, 0, 7); c.fill(); c.fillStyle = '#fff0a8'; c.beginPath(); c.arc(X - p.r * 0.3, Y - p.r * 0.3, p.r * 0.45, 0, 7); c.fill();
          continue;
        }
        if (p.k === 'cendre') { const r = 5 + u * 22; c.fillStyle = `rgba(${Math.round(84 - u * 20)},${Math.round(74 - u * 16)},${Math.round(70 - u * 14)},${0.5 * (1 - u) * Math.min(1, p.t * 4)})`; c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fill(); continue; }
        if (p.k === 'etincelle') { c.fillStyle = `rgba(255,${Math.round(220 - u * 140)},${Math.round(90 - u * 60)},${1 - u})`; c.fillRect(p.x - 1, p.y - 1, 2.2, 2.2); }
        else if (p.k === 'goutte') { c.fillStyle = `rgba(255,${Math.round(170 - u * 90)},${Math.round(50 - u * 30)},${1 - u * 0.7})`; c.beginPath(); c.arc(p.x, p.y, 1.8 - u * 0.6, 0, 7); c.fill(); }
        else if (p.k === 'eclat') { c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = `rgba(34,24,22,${1 - u * 0.5})`; c.beginPath(); c.moveTo(-2, -1.4); c.lineTo(2.2, -0.6); c.lineTo(0.6, 1.8); c.closePath(); c.fill(); c.fillStyle = `rgba(255,120,40,${0.8 * (1 - u)})`; c.fillRect(-0.6, -0.6, 1.2, 1.2); c.restore(); }
        else { const r = (p.k === 'vapeur' ? 3 : 4) + u * (p.k === 'vapeur' ? 9 : 7), g = p.k === 'vapeur' ? 236 : 90; c.fillStyle = `rgba(${g},${g - 6},${g - 12},${(p.k === 'vapeur' ? 0.55 : 0.5) * (1 - u)})`; c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fill(); }
      }
      if (volcanique(map) && E(map).flashs) for (const f of E(map).flashs) { const a = 1 - f.t / 0.35, R = f.r || 26, g = c.createRadialGradient(f.x, f.y, 1, f.x, f.y, R); g.addColorStop(0, `rgba(255,250,210,${a})`); g.addColorStop(0.4, `rgba(255,150,50,${a * 0.6})`); g.addColorStop(1, 'rgba(255,80,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, R, 0, 7); c.fill(); }
      c.font = 'bold 9px monospace'; c.textAlign = 'center';
      for (const b of L.bulles) { const a = 1 - b.t / 1.1; c.fillStyle = `rgba(40,10,0,${a})`; c.fillText(b.txt, b.x + 1, b.y - b.t * 14 + 1); c.fillStyle = `rgba(255,110,60,${a})`; c.fillText(b.txt, b.x, b.y - b.t * 14); }
      c.textAlign = 'left';
    },
  };

  // ---------------------------------------------------------------- LA BOUCHE DU VOLCAN (gfx/premium.js « bouche »)
  // le trou peint (lèvre, parois, lave tout au fond), puis la lave au niveau du moment : une ellipse qui monte en
  // s'élargissant (texture « bouchelave » découpée), une croûte sombre contre les parois, la lueur sur la roche juste
  // au-dessus, et l'ombre de la lèvre sud
  function bouche(c, map, S, t) {
    const B = map.bouche, O = DW.World.OBJ.bouche, F = O.forme, bord = O.bord, W = DW.World;
    if (!W.objReady('bouche', 0, 0) || !W.objReady('bouchelave', 0, 0)) return;
    // (les images suivantes de l'animation arrivent peu après l'entrée sur la carte : en attendant, celles qui sont prêtes)
    let n = 1; while (n < O.frames && W.objReady('bouche', 0, n) && W.objReady('bouchelave', 0, n)) n++;
    const i = Math.floor(t * 5) % n, s = W.objFrame('bouche', 0, i), lv = W.objFrame('bouchelave', 0, i);
    const X = Math.round((B.x + B.w / 2) * TS - s.w / 2), Y = Math.round((B.y + B.h) * TS - 1 - s.h + 1);
    c.drawImage(s.img, X, Y);
    const niv = S.cr ? S.cr.niv : 0, x0 = X + 1, y0 = Y + 1;
    const sur = Math.max(0, niv - 1), n1 = Math.min(1, niv);   // (sur : la lave passe par-dessus la lèvre)
    const cy2 = F.cy + F.ry * (0.42 - 0.38 * n1), rx2 = F.rx * (0.86 + 0.11 * n1) * (1 + sur * 0.9), ry2 = F.ry * (0.58 + 0.34 * n1) * (1 + sur * 1.1);
    const ell = (cx, cy, rx, ry, k = 1) => { c.beginPath(); for (let q = 0; q <= 72; q++) { const a = q / 72 * Math.PI * 2, r = bord(a) * k; const px = x0 + cx + Math.cos(a) * rx * r, py = y0 + cy + Math.sin(a) * ry * r; q ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); };
    c.save();
    ell(F.cx, F.cy, F.rx, F.ry, 0.995 + sur * 0.9); c.clip();
    // lueur de la lave sur la paroi, juste au-dessus de la surface
    c.globalCompositeOperation = 'lighter';
    ell(F.cx, cy2 - 6, rx2 * 1.04, ry2 * 1.08); c.fillStyle = `rgba(255,96,24,${0.16 + niv * 0.1})`; c.fill();
    c.globalCompositeOperation = 'source-over';
    ell(F.cx, cy2, rx2, ry2); c.save(); c.clip(); c.drawImage(lv.img, X, Y);
    // petits cônes de lave qui fument, posés sur le lac (image dessinée « cone_lave »)
    const cone = DW.Textures && DW.Textures.a('volcan/cone_lave');
    if (cone && niv < 1) for (const [ux, uy, k] of [[-0.3, 0.15, 0], [0.32, 0.05, 1]]) {
      const w = cone.naturalWidth / 4, h = cone.naturalHeight / 4, X2 = x0 + F.cx + ux * rx2, Y2 = y0 + cy2 + uy * ry2 + Math.sin(t * 1.3 + k * 2) * 0.8;
      c.drawImage(cone, X2 - w / 2, Y2 - h, w, h);
      const u = (t * 0.5 + k * 0.5) % 1; c.fillStyle = `rgba(226,214,204,${0.4 * (1 - u)})`; c.beginPath(); c.arc(X2 + Math.sin(t + k) * 3, Y2 - h - u * 24, 3 + u * 7, 0, 7); c.fill();
    }
    // croûte tassée contre les parois
    ell(F.cx, cy2, rx2, ry2); c.lineWidth = 5; c.strokeStyle = 'rgba(70,18,10,0.55)'; c.stroke(); c.lineWidth = 1.6; c.strokeStyle = 'rgba(40,12,8,0.9)'; c.stroke();
    c.restore();
    // ombre de la lèvre sud sur la lave (sauf quand elle déborde)
    if (sur < 0.02) c.beginPath(); else { c.restore(); return; } for (let q = 0; q <= 36; q++) { const a = q / 36 * Math.PI, r = bord(a) * 0.995; const px = x0 + F.cx + Math.cos(a) * F.rx * r, py = y0 + F.cy + Math.sin(a) * F.ry * r; q ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.lineWidth = 7; c.strokeStyle = 'rgba(24,8,4,0.45)'; c.stroke();
    c.restore();
  }

  // ---------------------------------------------------------------- UNE COULÉE PEINTE
  // tracé lissé (centres des cases bien décalés, lissage de Chaikin), largeur qui gonfle et se resserre (ondulations),
  // peinte en touches rondes qui se chevauchent (bords irréguliers), petits lobes qui débordent sur les côtés, langue
  // étalée en éventail au bout ; reflets qui avancent dans le sens du courant ; le long d'une falaise, filets et gouttes
  function trace(map, C) {
    if (C.pts) return C.pts;
    const roc = (x, y) => map.rows[y] && map.rows[y][x] === 'Ŵ', al = (x, y) => (map.alt ? map.alt[y * map.w + x] : 0);
    // (sur la roche, la lave tombe tout droit : pas de décalage de côté, pour qu'elle colle à la paroi)
    let P = C.c.map(([x, y], i) => [x * TS + 8 + (roc(x, y) ? (H2(x, 0, C.seed) - 0.5) * 4 : (H2(x, y, C.seed) - 0.5) * 9), y * TS + 8 + (roc(x, y) ? 0 : (H2(y, x, C.seed + 1) - 0.5) * 8), roc(x, y), i]);
    C.chutes = [];
    for (let i = 0; i + 1 < C.c.length; i++) { const [x, y] = C.c[i], [x2, y2] = C.c[i + 1]; if (!roc(x, y) && !roc(x2, y2) && al(x2, y2) < al(x, y)) C.chutes.push({ i: i + 0.5, x: (x + x2) * 8 + 8, y: (y + y2) * 8 + 8, dx: x2 - x, dy: y2 - y }); }
    // (pied de chaque chute le long d'une falaise : la lave s'écrase et éclabousse)
    for (let i = 1; i < C.c.length; i++) { const [x, y] = C.c[i], [x0, y0] = C.c[i - 1]; if (roc(x0, y0) && !roc(x, y)) C.chutes.push({ i, x: x * TS + 8, y: y * TS + 4, dx: 0, dy: 1, pied: true }); }
    for (let it = 0; it < 2; it++) { const Q = [P[0]]; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1]; Q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25, a[2], a[3] + 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75, b[2], a[3] + 0.75]); } Q.push(P[P.length - 1]); P = Q; }
    // ré-échantillonnage tous les 2,5 px (pour peindre en touches régulières)
    const out = []; let acc = 0;
    for (let i = 0; i + 1 < P.length; i++) {
      const a = P[i], b = P[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = acc; s < d; s += 2.5) { const u = s / d; out.push({ x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, roche: u < 0.5 ? a[2] : b[2], k: a[3] + (b[3] - a[3]) * u, nx: -(b[1] - a[1]) / (d || 1), ny: (b[0] - a[0]) / (d || 1) }); }
      acc = (acc - d) % 2.5; if (acc < 0) acc += 2.5;
    }
    return (C.pts = out);
  }
  function coulee(c, map, C, t, V) {
    const pts = trace(map, C), len = C.c.length, n = Math.min(len, C.n), froid = C.phase === 'fige' ? 1 - C.t / 7 : 0;
    let tot = 0; while (tot < pts.length && pts[tot].k <= n) tot++;
    if (tot < 2) return;
    const vis = pts, mx = (a, b, u) => Math.round(a + (b - a) * u), hors = p => p.x < V[0] || p.y < V[1] || p.x > V[2] || p.y > V[3];
    // largeur : gonfle et se resserre (deux ondulations lentes + un bruit propre à chaque couche), plus fine sur la roche,
    // étalée en langue au bout
    const rayon = (p, i, k = 0) => {
      const u = i / Math.max(1, tot - 1), ond = 0.75 + 0.3 * Math.sin(i * 0.31 + C.seed) + 0.18 * Math.sin(i * 0.09 + C.seed * 3) + (k ? 0.16 * Math.sin(i * 0.53 + k * 2.1 + C.seed) + 0.1 * Math.sin(i * 1.7 + k * 5 + C.seed) : 0);
      let r = C.w * ond * (1.05 - 0.35 * u); if (p.roche) r *= 0.5;
      if (i > tot - 7 && C.phase === 'coule') r *= 1 + (i - (tot - 7)) * 0.07;
      return r;
    };
    // une couche = UNE forme (union de disques remplie d'un coup) : pas de « perles » au bord, une seule transparence
    const couche = (k, plus, col, lobes) => {
      c.fillStyle = col; c.beginPath();
      for (let i = 0; i < tot; i++) {
        const p = vis[i]; if (hors(p)) continue; const r = Math.max(0.6, rayon(p, i, k) * (k ? k : 1) + plus);
        c.moveTo(p.x + r, p.y); c.arc(p.x, p.y, r, 0, 7);
        if (lobes && i % 4 === 1 && !p.roche) {   // petits lobes qui débordent sur les côtés (la lave déborde de son chenal)
          const s = H2(i, C.seed, 51) < 0.5 ? -1 : 1, o = r * (0.55 + H2(i, C.seed, 52) * 0.5), lx = p.x + p.nx * o * s, ly = p.y + p.ny * o * s, lr = r * (0.4 + H2(i, C.seed, 53) * 0.25);
          c.moveTo(lx + lr, ly); c.ellipse(lx, ly, lr, lr * 0.8, 0, 0, 7);
        }
      }
      c.fill();
    };
    // halo de chaleur, croûte sombre (avec lobes), lave orange, cœur jaune
    if (froid < 0.6) couche(1.6, 3, `rgba(255,110,30,${0.12 * (1 - froid)})`);
    couche(1, 1.6, `rgba(${mx(96, 34, froid)},${mx(22, 26, froid)},${mx(14, 26, froid)},0.97)`, true);
    if (froid < 1) {
      const motif = froid < 0.5 && DW.Textures && map.textures ? DW.Textures.motif(c, map.textures + '/lave') : null;   // (image dessinée : gfx/textures.js)
      couche(0.86, 0, motif || `rgba(${mx(222, 70, froid)},${mx(76, 40, froid)},${mx(24, 30, froid)},${1 - froid * 0.6})`);
      const fl = 0.85 + 0.15 * Math.sin(t * 6 + C.seed);
      couche(0.42, 0, `rgba(255,${Math.round(200 * fl)},${Math.round(84 * fl)},${(1 - froid) * (motif ? 0.35 : 0.95)})`);
      // plaques de croûte noire qui dérivent avec le courant (et se cassent sur les falaises)
      c.fillStyle = `rgba(${mx(70, 30, froid)},${mx(22, 24, froid)},${mx(14, 22, froid)},${0.8 * (1 - froid * 0.5)})`;
      const pas = 9, dec = (t * C.v * 2.2) % pas;
      for (let q = 0; q * pas < tot; q++) {
        const i = Math.floor(q * pas + dec + H2(q, C.seed, 61) * 3); if (i >= tot - 3) break; const p = vis[i]; if (hors(p) || p.roche) continue;
        const r = rayon(p, i), s = (H2(q, C.seed, 62) - 0.5) * r * 0.9, px = p.x + p.nx * s, py = p.y + p.ny * s, a = H2(q, C.seed, 63) * 3, w = r * (0.28 + H2(q, C.seed, 64) * 0.22);
        c.beginPath(); c.ellipse(px, py, w, w * 0.65, a, 0, 7); c.fill();
      }
      // reflets clairs qui filent dans le sens du courant (très vite le long des falaises)
      c.fillStyle = `rgba(255,244,190,${0.75 * (1 - froid)})`;
      for (let q = 0; q * 7 < tot; q++) {
        const i = Math.floor((q * 7 + t * C.v * 6 + H2(q, C.seed, 71) * 4) % tot); const p = vis[i]; if (hors(p)) continue;
        const r = rayon(p, i) * 0.22; c.beginPath(); c.ellipse(p.x, p.y, Math.max(0.6, r * (p.roche ? 0.7 : 1.6)), Math.max(0.6, r * (p.roche ? 1.8 : 0.7)), p.roche ? 0 : Math.atan2(p.ny, p.nx) + Math.PI / 2, 0, 7); c.fill();
      }
    }
    // en refroidissant : fentes qui rougeoient sur la croûte
    if (froid > 0.15) { c.strokeStyle = `rgba(255,120,40,${0.55 * (1 - froid)})`; c.lineWidth = 0.8; for (let i = 3; i < tot - 2; i += 6) { const p = vis[i]; if (hors(p)) continue; const r = rayon(p, i); c.beginPath(); c.moveTo(p.x - p.ny * r * 0.6, p.y + p.nx * r * 0.6); c.lineTo(p.x + p.nx * 1.5, p.y + p.ny * 1.5); c.lineTo(p.x + p.ny * r * 0.6, p.y - p.nx * r * 0.6); c.stroke(); } }
    // tête : bourrelet brillant qui palpite
    if (C.phase === 'coule') { const p = vis[tot - 1], r = rayon(p, tot - 1); c.fillStyle = `rgba(255,240,180,${0.8 + 0.2 * Math.sin(t * 12)})`; c.beginPath(); c.ellipse(p.x, p.y, r * 0.75, r * 0.6, 0, 0, 7); c.fill(); }
    // rebord franchi, pied de falaise : lueur, éclaboussures de lave et étincelles
    if (froid < 0.7) for (const h of C.chutes || []) {
      if (h.i > n || h.x < V[0] || h.x > V[2] || h.y < V[1] || h.y > V[3]) continue;
      const a = 1 - froid, g = c.createRadialGradient(h.x, h.y, 1, h.x, h.y, 14); g.addColorStop(0, `rgba(255,230,140,${0.55 * a})`); g.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = g; c.beginPath(); c.arc(h.x, h.y, 14, 0, 7); c.fill();
      for (let q = 0; q < 4; q++) { const u = (t * 1.8 + q * 0.25 + h.i * 0.1) % 1, ang = (H2(q, Math.floor(h.i), C.seed) - 0.5) * 2.4 - Math.PI / 2, d = u * 7;
        c.fillStyle = `rgba(255,${190 + Math.round(50 * (1 - u))},90,${a * (1 - u)})`; c.fillRect(h.x + Math.cos(ang) * d - 0.8, h.y + Math.sin(ang) * d + u * u * 6 - 0.8, 1.8, 1.8); }
    }
    // le long d'une falaise : gouttes qui tombent
    if (froid < 0.6) for (let i = 0; i < tot; i += 3) { const p = vis[i]; if (!p.roche) continue; const q = (t * 1.5 + i * 0.13 + C.seed) % 1; c.fillStyle = `rgba(255,${150 + Math.round(60 * (1 - q))},60,${0.9 * (1 - q)})`; c.beginPath(); c.arc(p.x + Math.sin(i + C.seed) * 2, p.y + q * 12, 1.5, 0, 7); c.fill(); }
    // fumée au-dessus de la coulée qui refroidit
    if (C.phase === 'fige') for (let q = 0; q < 3; q++) { const p = vis[Math.floor((q + 0.5) / 3 * (tot - 1))], u = (t * 0.6 + q * 0.33 + C.seed * 0.1) % 1; c.fillStyle = `rgba(206,200,194,${0.35 * (1 - u) * (1 - froid * 0.5)})`; c.beginPath(); c.arc(p.x + Math.sin(t + q) * 3, p.y - 4 - u * 18, 3 + u * 5, 0, 7); c.fill(); }
  }
})();
