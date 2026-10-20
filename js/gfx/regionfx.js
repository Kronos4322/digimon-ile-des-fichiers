'use strict';
// =====================================================================
//  AMBIANCES DE RÉGION (au-dessus du décor, autour de la caméra) :
//    marais : bulles qui remontent, feux follets verts la nuit     volcan : braises et cendres
//    neige / sommet : scintillements au sol                         cimetière : feux follets bleus, chauves-souris
//    usine / décharge / égouts : étincelles et vapeur               plage : mouettes, écume qui brille
//    jungle / dinosaures : papillons tropicaux, feuilles qui tombent   jouets : confettis et étoiles
//    brume : nappes de brouillard        canyon / savane : tourbillons de poussière
//    forêts : pollen, feuilles (rousses en automne)
// =====================================================================
(function () {
  // type d'effet → { n (particules à l'écran), make, step, draw }
  const R = Math.random;
  const FX = {
    bubbles: { n: 14, make: (x, y) => ({ x, y, vy: -(8 + R() * 10), life: 1.5 + R() * 2, r: 1 + R() * 2 }), step: (p, dt, t) => { p.y += p.vy * dt; p.x += Math.sin(t * 3 + p.r * 9) * 6 * dt; },
      draw: (c, p) => { c.strokeStyle = 'rgba(200,240,210,0.7)'; c.lineWidth = 0.8; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(p.x - p.r * 0.4, p.y - p.r * 0.5, 1, 1); } },
    embers: { n: 26, glow: true, make: (x, y) => ({ x, y, vy: -(14 + R() * 22), vx: (R() - 0.5) * 10, life: 1 + R() * 2.2 }), step: (p, dt) => { p.y += p.vy * dt; p.x += p.vx * dt; },
      draw: (c, p, t) => { const a = Math.min(1, p.life) * (0.6 + 0.4 * Math.sin(t * 20 + p.x)); c.fillStyle = `rgba(255,${120 + Math.floor(R() * 80)},40,${a})`; c.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); } },
    ash: { n: 18, make: (x, y) => ({ x, y: y - 200, vy: 10 + R() * 8, life: 6 }), step: (p, dt, t) => { p.y += p.vy * dt; p.x += Math.sin(t + p.vy) * 8 * dt; },
      draw: (c, p) => { c.fillStyle = 'rgba(90,86,90,0.6)'; c.fillRect(Math.round(p.x), Math.round(p.y), 2, 1); } },
    sparkle: { n: 20, glow: true, make: (x, y) => ({ x, y, life: 0.6 + R() * 0.8 }), step: () => {},
      draw: (c, p) => { const a = Math.sin(Math.min(1, p.life) * Math.PI); c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3); c.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1); } },
    wisps: { n: 6, glow: true, night: true, make: (x, y) => ({ x, y, ph: R() * 6, life: 4 + R() * 4, col: R() < 0.5 ? '120,170,255' : '190,130,255' }), step: (p, dt, t) => { p.x += Math.sin(t * 0.7 + p.ph) * 10 * dt; p.y += Math.cos(t * 0.9 + p.ph) * 6 * dt; },
      draw: (c, p, t) => { const a = Math.min(1, p.life / 2) * (0.6 + 0.3 * Math.sin(t * 4 + p.ph)); c.fillStyle = `rgba(${p.col},${a * 0.25})`; c.beginPath(); c.arc(p.x, p.y, 6, 0, 7); c.fill(); c.fillStyle = `rgba(${p.col},${a})`; c.beginPath(); c.arc(p.x, p.y, 2, 0, 7); c.fill(); } },
    swampwisps: { n: 5, glow: true, night: true, make: (x, y) => ({ x, y, ph: R() * 6, life: 4 + R() * 4, col: '150,255,140' }), step: (p, dt, t) => { p.x += Math.sin(t * 0.7 + p.ph) * 10 * dt; p.y += Math.cos(t * 0.9 + p.ph) * 6 * dt; } },
    bats: { n: 3, night: true, make: (x, y) => ({ x: x - 200, y: y - 60, vx: 50 + R() * 30, ph: R() * 6, life: 9 }), step: (p, dt, t) => { p.x += p.vx * dt; p.y += Math.sin(t * 6 + p.ph) * 14 * dt; },
      draw: (c, p, t) => { const f = Math.sin(t * 22 + p.ph) > 0 ? 2 : -1; c.fillStyle = '#1a1424'; c.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 2); c.fillRect(Math.round(p.x) - 4, Math.round(p.y) - f, 3, 1); c.fillRect(Math.round(p.x) + 2, Math.round(p.y) - f, 3, 1); } },
    sparks: { n: 10, glow: true, burst: true, make: (x, y) => ({ x, y, vx: (R() - 0.5) * 80, vy: -30 - R() * 50, life: 0.5 + R() * 0.4 }), step: (p, dt) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; },
      draw: (c, p) => { c.fillStyle = `rgba(255,230,120,${Math.min(1, p.life * 2)})`; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } },
    steam: { n: 8, make: (x, y) => ({ x, y, vy: -12 - R() * 6, life: 2.5 + R(), r: 3 }), step: (p, dt) => { p.y += p.vy * dt; p.r += 3 * dt; },
      draw: (c, p) => { c.fillStyle = `rgba(220,225,230,${Math.min(0.35, p.life * 0.15)})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); } },
    gulls: { n: 3, make: (x, y) => ({ x: x - 220, y: y - 80 + R() * 60, vx: 40 + R() * 25, ph: R() * 6, life: 12 }), step: (p, dt, t) => { p.x += p.vx * dt; p.y += Math.sin(t * 1.5 + p.ph) * 6 * dt; },
      draw: (c, p, t) => { const f = Math.sin(t * 5 + p.ph) > 0 ? 2 : 0; c.strokeStyle = '#f8f8f8'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x - 4, p.y - f); c.lineTo(p.x, p.y); c.lineTo(p.x + 4, p.y - f); c.stroke(); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(Math.round(p.x) - 2, Math.round(p.y) + 40, 4, 1); } },
    butterflies: { n: 8, day: true, make: (x, y) => ({ x, y, ph: R() * 6, life: 6 + R() * 4, col: ['#ff5a8a', '#5ac8ff', '#ffd040', '#b07aff', '#ff8a2a'][Math.floor(R() * 5)] }), step: (p, dt, t) => { p.x += Math.sin(t * 0.8 + p.ph) * 18 * dt; p.y += Math.cos(t * 1.1 + p.ph) * 12 * dt; },
      draw: (c, p, t) => { const w = Math.abs(Math.sin(t * 12 + p.ph)) * 2.5 + 0.5; c.fillStyle = p.col; c.fillRect(Math.round(p.x - w), Math.round(p.y), Math.round(w), 3); c.fillRect(Math.round(p.x + 1), Math.round(p.y), Math.round(w), 3); c.fillStyle = '#2a2a2a'; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 3); } },
    leaves: { n: 12, make: (x, y) => ({ x, y: y - 180, vy: 14 + R() * 10, ph: R() * 6, life: 9 }), step: (p, dt, t) => { p.y += p.vy * dt; p.x += Math.sin(t * 2 + p.ph) * 16 * dt; },
      draw: (c, p, t, M) => { c.fillStyle = M.leaf[Math.floor(p.ph * 10) % M.leaf.length]; const f = Math.sin(t * 4 + p.ph) > 0; c.fillRect(Math.round(p.x), Math.round(p.y), f ? 3 : 2, f ? 2 : 3); } },
    pollen: { n: 14, day: true, glow: true, make: (x, y) => ({ x, y, ph: R() * 6, life: 4 + R() * 3 }), step: (p, dt, t) => { p.x += (Math.sin(t * 0.6 + p.ph) * 6 + 4) * dt; p.y += Math.cos(t * 0.8 + p.ph) * 4 * dt; },
      draw: (c, p) => { c.fillStyle = `rgba(255,250,200,${Math.min(0.8, p.life * 0.3)})`; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } },
    confetti: { n: 22, make: (x, y) => ({ x, y: y - 160, vy: 18 + R() * 12, ph: R() * 6, life: 8, col: ['#ff5a8a', '#5ac8ff', '#ffd040', '#7ae07a', '#ffffff'][Math.floor(R() * 5)] }), step: (p, dt, t) => { p.y += p.vy * dt; p.x += Math.sin(t * 3 + p.ph) * 14 * dt; },
      draw: (c, p, t) => { c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), Math.sin(t * 8 + p.ph) > 0 ? 2 : 1, 2); } },
    mist: { n: 5, make: (x, y) => ({ x: x - 160, y, vx: 6 + R() * 6, r: 30 + R() * 30, life: 30 }), step: (p, dt) => { p.x += p.vx * dt; },
      draw: (c, p) => { const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, 'rgba(230,236,240,0.22)'); g.addColorStop(1, 'rgba(230,236,240,0)'); c.fillStyle = g; c.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); } },
    dust: { n: 2, make: (x, y) => ({ x, y, vx: 20 + R() * 15, life: 4 + R() * 2, ph: R() * 6 }), step: (p, dt) => { p.x += p.vx * dt; },
      draw: (c, p, t) => { c.fillStyle = 'rgba(210,170,110,0.45)'; for (let i = 0; i < 10; i++) { const a = t * 8 + i * 0.7 + p.ph, r = 2 + i * 0.9; c.fillRect(Math.round(p.x + Math.cos(a) * r), Math.round(p.y - i * 2 + Math.sin(a) * r * 0.3), 1, 1); } } },
  };
  FX.swampwisps.draw = FX.wisps.draw;
  // effets par thème de zone
  const BY_THEME = {
    swamp: ['bubbles', 'swampwisps'], mangrove: ['bubbles', 'butterflies'], volcano: ['embers', 'ash'], snow: ['sparkle'], summit: ['sparkle'],
    cemetery: ['wisps', 'bats'], factory: ['sparks', 'steam'], trash: ['sparks'], sewer: ['steam', 'bubbles'], beach: ['gulls', 'sparkle'],
    jungle: ['butterflies', 'leaves'], dino: ['butterflies', 'leaves'], toy: ['confetti', 'sparkle'], fog: ['mist'], misty: ['mist', 'pollen'],
    canyon: ['dust'], savanna: ['dust', 'pollen'], spring: ['pollen', 'leaves'], meadow: ['pollen'], deep: ['leaves', 'pollen'], autumn: ['leaves'], beetle: ['leaves', 'pollen'],
  };
  const LEAF = { autumn: ['#d06a2a', '#e8a040', '#a84a24'], default: ['#6aa040', '#8ac050', '#4a8a30'] };

  DW.RegionFx = {
    draw(ow, c) {
      if (ow.map.indoor) return;
      const kinds = BY_THEME[ow.map.theme];
      if (!kinds) return;
      const st = ow.rfx && ow.rfx.map === ow.mapId ? ow.rfx : (ow.rfx = { map: ow.mapId, ps: {}, last: ow.t });
      const dt = Math.min(0.05, Math.max(0, ow.t - st.last)); st.last = ow.t;
      const cam = ow.camera(), dark = DW.Time.light().dark, M = { leaf: ow.map.theme === 'autumn' ? LEAF.autumn : LEAF.default };
      for (const k of kinds) {
        const F = FX[k];
        if (F.night && dark < 0.3) continue;
        if (F.day && dark > 0.45) continue;
        const list = st.ps[k] = st.ps[k] || [];
        // nouvelles particules autour de la caméra (les étincelles jaillissent par gerbes)
        if (list.length < F.n && R() < (F.burst ? 0.04 : 0.5)) {
          const x = cam.cx + R() * DW.W, y = cam.cy + R() * DW.H;
          if (F.burst) for (let i = 0; i < 8; i++) list.push(F.make(x, y)); else list.push(F.make(x, y));
        }
        if (F.glow) { c.save(); c.globalCompositeOperation = 'lighter'; }
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          p.life -= dt; F.step(p, dt, ow.t);
          if (p.life <= 0) { list.splice(i, 1); continue; }
          F.draw(c, p, ow.t, M);
        }
        if (F.glow) c.restore();
      }
    },
  };
})();
