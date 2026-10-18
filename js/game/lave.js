'use strict';
// =====================================================================
//  DANGERS VOLCANIQUES (Mont Miharashi) : on peut y marcher, mais ça brûle
//  - boule de lave (OBJ.bouledelave, posée au sol) : la marcher fait perdre des PV au partenaire ;
//  - fissure fumante (OBJ.fissure) : jets de vapeur brûlante, un peu moins forts ;
//  - coulées de lave (map.coulees : chemins de cases depuis le cratère) : de temps en temps, une coulée descend,
//    reste brûlante quelques secondes puis refroidit et noircit. On la voit venir : il suffit de s'écarter.
//  Jamais de K.O. par la lave : le partenaire garde au moins 1 PV (le danger pousse à faire attention, sans punir).
// =====================================================================
(function () {
  const TS = 16, PEINE = { bouledelave: 0.1, fissure: 0.06, coulee: 0.14 };
  const MOTS = {
    bouledelave: n => `Aïe ! ${n} a marché sur une boule de lave !`,
    fissure: n => `Un jet de vapeur brûlante jaillit de la fissure ! ${n} est ébouillanté !`,
    coulee: n => `La coulée de lave brûle les pattes de ${n} !`,
  };
  const etat = new WeakMap();   // (par carte : coulées en cours, dangers déjà annoncés)
  const E = map => { let s = etat.get(map); if (!s) { s = { coulees: (map.coulees || []).map((c, i) => ({ c, phase: 'repos', t: 4 + i * 7 + Math.random() * 12, n: 0 })), vus: new Set() }; etat.set(map, s); } return s; };

  // cases chaudes des coulées (pendant qu'elles coulent, et un moment après)
  function chaudes(map) {
    const out = new Set(); for (const C of E(map).coulees) if (C.phase === 'coule' || (C.phase === 'fige' && C.t < 2.5)) for (let i = 0; i < Math.min(C.c.length, Math.floor(C.n)); i++) out.add(C.c[i].join());
    return out;
  }
  const L = DW.Lave = {
    // danger de la case (x, y) : 'bouledelave', 'fissure', 'coulee' ou null
    danger(map, x, y) {
      if (map.coulees && chaudes(map).has(x + ',' + y)) return 'coulee';
      for (const o of map.objects || []) if ((o.kind === 'bouledelave' || o.kind === 'fissure') && x >= o.x && x < o.x + (o.w || 1) && y >= o.y && y < o.y + (o.h || 1)) return o.kind;
      return null;
    },
    // après chaque pas du héros
    pas(ow) {
      const map = ow.map; if (!map.coulees && !(map.objects || []).some(o => o.kind === 'bouledelave' || o.kind === 'fissure')) return null;
      const k = L.danger(map, ow.p.x, ow.p.y); if (!k) return null;
      const m = ow.partner; if (!m) return null;
      const perte = Math.min(m.hp - 1, Math.max(1, Math.round(m.maxHp * PEINE[k])));
      if (perte > 0) m.hp -= perte;
      ow.shake = 0.25; DW.Audio.sfx('bump'); if (DW.Input && DW.Input.rumble) DW.Input.rumble(0.3, 120);
      L.bulles.push({ x: ow.p.x * TS + 8, y: ow.p.y * TS - 6, t: 0, txt: perte > 0 ? `-${perte}` : '…' });
      const S = E(map);
      if (S.vus.has(k)) return null;   // (le message, une seule fois par sorte de danger et par visite)
      S.vus.add(k);
      return async () => { await DW.say(`${MOTS[k](m.name)} (-${perte} PV)${m.hp <= 1 ? ` ${m.name} est à bout de forces : il faut vite se soigner !` : ''}`); };
    },
    bulles: [],
    update(ow, dt) {
      for (const b of L.bulles) b.t += dt; L.bulles = L.bulles.filter(b => b.t < 1.1);
      const map = ow.map; if (!map.coulees) return;
      for (const C of E(map).coulees) {
        C.t -= dt;
        if (C.phase === 'repos' && C.t <= 0) { C.phase = 'coule'; C.n = 0; }
        else if (C.phase === 'coule') { C.n += dt * 3.2; if (C.n >= C.c.length) { C.phase = 'fige'; C.t = 6; } }
        else if (C.phase === 'fige' && C.t <= 0) { C.phase = 'repos'; C.t = 14 + Math.random() * 26; C.n = 0; }
      }
      // le héros ne reste pas sur une coulée qui arrive sous ses pieds sans le sentir
      if (!ow.p.moving && !ow.locked && chaudes(map).has(ow.p.x + ',' + ow.p.y)) { const S = E(map); S.pique = (S.pique || 0) - dt; if (S.pique <= 0) { S.pique = 1; const ev = L.pas(ow); if (ev) ow.runScript(ev); } }
    },
    // coulées (sous les personnages, sur le sol) : cœur jaune, bord rouge, croûte qui noircit en refroidissant
    draw(ow, c) {
      const map = ow.map, t = ow.t || 0;
      if (map.coulees) for (const C of E(map).coulees) {
        if (C.phase === 'repos') continue;
        const n = Math.min(C.c.length, Math.ceil(C.n)), froid = C.phase === 'fige' ? 1 - C.t / 6 : 0;
        for (let i = 0; i < n; i++) {
          const [x, y] = C.c[i], X = x * TS + 8, Y = y * TS + 8, tete = C.phase === 'coule' && i >= n - 2, w = 6.5 + Math.sin(i * 1.7) * 1.5;
          c.fillStyle = `rgba(${Math.round(120 - froid * 70)},${Math.round(30 - froid * 10)},${Math.round(16)},0.95)`; c.beginPath(); c.ellipse(X, Y, w + 1.5, w * 0.8 + 1, 0, 0, 7); c.fill();
          if (froid < 1) {
            const g = c.createRadialGradient(X, Y, 0.5, X, Y, w);
            const a = 1 - froid, flick = 0.85 + Math.sin(t * 9 + i) * 0.15;
            g.addColorStop(0, `rgba(255,${Math.round(230 * flick)},120,${a})`); g.addColorStop(0.55, `rgba(255,${Math.round(120 * flick)},30,${a})`); g.addColorStop(1, `rgba(200,40,20,${a * 0.6})`);
            c.fillStyle = g; c.beginPath(); c.ellipse(X, Y, w, w * 0.78, 0, 0, 7); c.fill();
          }
          if (froid > 0.2) { c.strokeStyle = `rgba(30,24,22,${froid * 0.8})`; c.lineWidth = 1; c.beginPath(); c.moveTo(X - w * 0.6, Y - 1); c.lineTo(X + w * 0.2, Y + 1); c.lineTo(X + w * 0.6, Y - 2); c.stroke(); }
          if (tete) { c.fillStyle = 'rgba(255,240,180,0.9)'; c.beginPath(); c.arc(X + Math.sin(t * 12) * 1.5, Y - 1, 2.4, 0, 7); c.fill(); }
        }
        // fumée au-dessus de la coulée qui refroidit
        if (C.phase === 'fige' && n) for (let k = 0; k < 3; k++) { const [x, y] = C.c[Math.floor((k + 0.5) / 3 * n)], p = (t * 0.6 + k * 0.33) % 1; c.fillStyle = `rgba(200,196,190,${0.35 * (1 - p)})`; c.beginPath(); c.arc(x * TS + 8 + Math.sin(t + k) * 3, y * TS + 4 - p * 18, 3 + p * 5, 0, 7); c.fill(); }
      }
    },
    // chiffres de dégâts qui montent au-dessus du héros
    drawTop(ow, c) {
      c.font = 'bold 9px monospace'; c.textAlign = 'center';
      for (const b of L.bulles) { const a = 1 - b.t / 1.1; c.fillStyle = `rgba(40,10,0,${a})`; c.fillText(b.txt, b.x + 1, b.y - b.t * 14 + 1); c.fillStyle = `rgba(255,110,60,${a})`; c.fillText(b.txt, b.x, b.y - b.t * 14); }
      c.textAlign = 'left';
    },
  };
})();
