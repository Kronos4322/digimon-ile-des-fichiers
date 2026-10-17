'use strict';
// =====================================================================
//  EFFETS D'ÉLÉMENT (combats, façon Digimon World 1 / 2003)
//  En plus de l'animation propre à chaque technique (game/fx.js), chaque élément a sa signature :
//   - impact : flammes et braises (Feu), gerbe et gouttes (Eau), arcs (Électrique), éclats et givre (Glace),
//     feuilles (Plante), rochers et poussière (Terre), bourrasque (Air), dards (Insecte), rayons (Lumière),
//     fumée violette (Ténèbres), bulles et nuage toxique (Poison), étoiles (Neutre)
//   - marque au sol dans l'arène (brûlure, flaque, givre, cratère, tache toxique...) qui s'efface lentement
//   - aura de l'élément sous le Digimon qui prépare une technique (on voit ce qui arrive)
//   - statuts visibles sur le Digimon : flammèches (brûlé), bulles (empoisonné), étincelles (paralysé), Zz (endormi)
//  Les grandes animations nouvelles (tempête de feu, raz-de-marée, orage, séisme...) s'ajoutent à DW.FX.
// =====================================================================
(function () {
  const TAU = Math.PI * 2, A = DW.Audio, wait = DW.wait, lerp = DW.lerp, R = Math.random;
  // palette par élément : [sombre, principal, clair]
  const PAL = {
    'Feu': ['#c8301a', '#ff7a1a', '#ffe060'], 'Eau': ['#1a5ac8', '#4aa8ff', '#e0f6ff'], 'Électrique': ['#c89a10', '#ffe030', '#ffffff'],
    'Glace': ['#4aa0c8', '#9ae8ff', '#ffffff'], 'Plante': ['#2a8a2e', '#5ac84a', '#c8f890'], 'Terre': ['#6a4a28', '#a8783c', '#e0c890'],
    'Air': ['#7c94e8', '#c8d8ff', '#ffffff'], 'Insecte': ['#6a8a10', '#a8c820', '#f0f880'], 'Lumière': ['#d8b030', '#fff0a0', '#ffffff'],
    'Ténèbres': ['#2a1a3a', '#6a3a8a', '#c890f0'], 'Poison': ['#4a1a6a', '#9a48c0', '#d8a0ff'], 'Neutre': ['#9a9488', '#ffffff', '#ffe0a0'],
  };
  const pal = t => PAL[t] || PAL.Neutre;
  const add = (B, dur, draw, delay = 0) => B.fxd.push({ t: -delay, dur, draw });
  const part = (B, x, y, vx, vy, life, col, size = 2, extra) => B.pt.push(Object.assign({ x, y, vx, vy, life, max: life, col, size }, extra || {}));

  // ------------------------------------------------------------ impact selon l'élément (x, y = centre de la cible)
  function impact(B, p, type, big) {
    const [c0, c1, c2] = pal(type), k = big ? 1.8 : 1, x = p.x, y = p.y;
    switch (type) {
      case 'Feu':
        for (let i = 0; i < 18 * k; i++) part(B, x + (R() - 0.5) * 16, y + (R() - 0.5) * 10, (R() - 0.5) * 40, -30 - R() * 60, 0.5 + R() * 0.4, [c0, c1, c2][i % 3], 2 + (i % 2));
        add(B, 0.6, (c, t) => { for (let i = 0; i < 6; i++) { const fx = x + (i - 2.5) * 6 * k, fh = (14 + (i % 3) * 6) * k * (1 - t) ; c.fillStyle = i % 2 ? c1 : c0; c.globalAlpha = 1 - t; c.beginPath(); c.moveTo(fx - 4, y + 8); c.quadraticCurveTo(fx + Math.sin(t * 30 + i) * 3, y + 8 - fh, fx + 4, y + 8); c.fill(); } c.globalAlpha = 1; });
        break;
      case 'Eau':
        for (let i = 0; i < 20 * k; i++) { const a = -Math.PI * (0.1 + R() * 0.8); part(B, x, y, Math.cos(a) * (40 + R() * 50), Math.sin(a) * (50 + R() * 50), 0.6, i % 2 ? c1 : c2, 2, { g: 160 }); }
        add(B, 0.5, (c, t) => { c.strokeStyle = c2; c.globalAlpha = 1 - t; c.lineWidth = 2; for (let j = 0; j < 2; j++) { c.beginPath(); c.ellipse(x, y + 10, (8 + t * 26 + j * 8) * k, (3 + t * 8 + j * 3) * k, 0, 0, TAU); c.stroke(); } c.globalAlpha = 1; });
        break;
      case 'Électrique':
        add(B, 0.45, (c, t) => { if (Math.floor(t * 20) % 2) return; c.strokeStyle = c2; c.lineWidth = 1.4; for (let i = 0; i < 5 * k; i++) { const a = R() * TAU, r = (16 + R() * 14) * k; c.beginPath(); c.moveTo(x, y); let px = x, py = y; for (let s = 1; s <= 4; s++) { px = x + Math.cos(a) * r * s / 4 + (R() - 0.5) * 6; py = y + Math.sin(a) * r * s / 4 + (R() - 0.5) * 6; c.lineTo(px, py); } c.stroke(); } c.strokeStyle = c1; c.lineWidth = 0.7; });
        for (let i = 0; i < 14 * k; i++) part(B, x, y, (R() - 0.5) * 140, (R() - 0.5) * 140, 0.3, i % 2 ? c1 : c2, 1);
        B.flash = Math.max(B.flash || 0, big ? 0.5 : 0.25);
        break;
      case 'Glace':
        add(B, 0.6, (c, t) => { c.globalAlpha = 1 - t * 0.8; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, r = (8 + Math.min(1, t * 4) * 14) * k; c.fillStyle = i % 2 ? c1 : c2; c.beginPath(); c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8); c.lineTo(x + Math.cos(a + 0.18) * r * 0.4, y + Math.sin(a + 0.18) * r * 0.3); c.lineTo(x + Math.cos(a - 0.18) * r * 0.4, y + Math.sin(a - 0.18) * r * 0.3); c.fill(); } c.globalAlpha = 1; });
        for (let i = 0; i < 16 * k; i++) part(B, x, y, (R() - 0.5) * 90, (R() - 0.5) * 90, 0.6, i % 2 ? c2 : c1, 2);
        break;
      case 'Plante':
        for (let i = 0; i < 14 * k; i++) part(B, x, y, (R() - 0.5) * 100, -20 - R() * 60, 0.9, i % 3 ? c1 : c2, 3, { g: 60, leaf: true, rot: R() * 6 });
        break;
      case 'Terre':
        for (let i = 0; i < 10 * k; i++) part(B, x + (R() - 0.5) * 10, y + 8, (R() - 0.5) * 90, -40 - R() * 70, 0.7, i % 2 ? c0 : c1, 3, { g: 260 });
        add(B, 0.7, (c, t) => { c.fillStyle = `rgba(200,170,120,${0.5 * (1 - t)})`; c.beginPath(); c.ellipse(x, y + 10, (12 + t * 22) * k, (5 + t * 7) * k, 0, 0, TAU); c.fill(); });
        B.shake = Math.max(B.shake || 0, big ? 0.6 : 0.25);
        break;
      case 'Air':
        add(B, 0.5, (c, t) => { c.strokeStyle = `rgba(230,240,255,${1 - t})`; c.lineWidth = 1.2; for (let i = 0; i < 4; i++) { const r = (8 + t * 20 + i * 4) * k; c.beginPath(); c.arc(x, y, r, t * 8 + i, t * 8 + i + 2.2); c.stroke(); } });
        break;
      case 'Insecte':
        for (let i = 0; i < 10 * k; i++) part(B, x, y, (R() - 0.5) * 120, (R() - 0.5) * 120, 0.35, i % 2 ? c1 : c2, 1);
        add(B, 0.3, (c, t) => { c.strokeStyle = c2; c.globalAlpha = 1 - t; c.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); c.lineTo(x + Math.cos(a) * 14 * k, y + Math.sin(a) * 14 * k); c.stroke(); } c.globalAlpha = 1; });
        break;
      case 'Lumière':
        add(B, 0.6, (c, t) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - t; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t; c.strokeStyle = i % 2 ? c1 : c2; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 26 * k, y + Math.sin(a) * 26 * k); c.stroke(); } c.restore(); });
        for (let i = 0; i < 12 * k; i++) part(B, x + (R() - 0.5) * 20, y + (R() - 0.5) * 20, 0, -20 - R() * 20, 0.8, c2, 1, { twinkle: true });
        B.flash = Math.max(B.flash || 0, 0.3);
        break;
      case 'Ténèbres':
        add(B, 0.7, (c, t) => { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + t * 2, r = (6 + t * 18) * k; c.fillStyle = `rgba(60,20,80,${0.6 * (1 - t)})`; c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 7 * k * (1 - t * 0.5), 0, TAU); c.fill(); } });
        for (let i = 0; i < 10 * k; i++) part(B, x, y, (R() - 0.5) * 60, -10 - R() * 40, 0.7, i % 2 ? c1 : c2, 2);
        break;
      case 'Poison':
        for (let i = 0; i < 14 * k; i++) part(B, x + (R() - 0.5) * 14, y + (R() - 0.5) * 8, (R() - 0.5) * 30, -15 - R() * 30, 0.9, i % 2 ? c1 : c2, 2 + (i % 2), { bubble: true });
        add(B, 0.9, (c, t) => { c.fillStyle = `rgba(150,70,190,${0.35 * (1 - t)})`; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x + (i - 1.5) * 8 * k, y - t * 10, (8 + t * 10) * k, 0, TAU); c.fill(); } });
        break;
      default:
        add(B, 0.25, (c, t) => { c.globalAlpha = 1 - t; c.fillStyle = c1; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = (i % 2 ? 5 : 14) * k * (0.5 + t); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); c.globalAlpha = 1; });
        for (let i = 0; i < 10 * k; i++) part(B, x, y, (R() - 0.5) * 120, (R() - 0.5) * 120, 0.35, i % 2 ? c1 : c2, 2);
    }
  }

  // ------------------------------------------------------------ marques au sol (arène)
  function decal(B, x, y, type, big) {
    if (!B.decals) B.decals = [];
    B.decals.push({ x, y, type, t: 0, life: big ? 9 : 6, r: (big ? 16 : 9) + R() * 4, seed: R() * 100 });
    if (B.decals.length > 24) B.decals.shift();
  }
  function drawDecals(B, c) {
    for (const d of B.decals || []) {
      const a = Math.min(1, (d.life - d.t) / 2), [c0, c1] = pal(d.type);
      c.globalAlpha = a * 0.75;
      if (d.type === 'Feu') { c.fillStyle = '#2a1a10'; c.beginPath(); c.ellipse(d.x, d.y, d.r, d.r * 0.45, 0, 0, TAU); c.fill(); c.fillStyle = `rgba(255,${100 + Math.floor(Math.sin(d.t * 8 + d.seed) * 50)},20,${0.6 * a})`; for (let i = 0; i < 4; i++) c.fillRect(d.x - d.r * 0.6 + i * d.r * 0.4, d.y - 1, 2, 2); }
      else if (d.type === 'Eau') { c.fillStyle = 'rgba(60,140,220,0.55)'; c.beginPath(); c.ellipse(d.x, d.y, d.r, d.r * 0.4, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(220,245,255,0.6)'; c.fillRect(d.x - d.r * 0.4, d.y - 1, d.r * 0.5, 1); }
      else if (d.type === 'Glace') { c.fillStyle = 'rgba(200,240,255,0.7)'; c.beginPath(); c.ellipse(d.x, d.y, d.r, d.r * 0.4, 0, 0, TAU); c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 0.6; for (let i = 0; i < 5; i++) { const ang = i / 5 * TAU + d.seed; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + Math.cos(ang) * d.r, d.y + Math.sin(ang) * d.r * 0.4); c.stroke(); } }
      else if (d.type === 'Terre') { c.fillStyle = '#4a3420'; c.beginPath(); c.ellipse(d.x, d.y, d.r, d.r * 0.42, 0, 0, TAU); c.fill(); c.strokeStyle = '#2a1c10'; c.lineWidth = 0.8; for (let i = 0; i < 4; i++) { const ang = i / 4 * TAU + d.seed; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + Math.cos(ang) * d.r * 1.3, d.y + Math.sin(ang) * d.r * 0.55); c.stroke(); } }
      else if (d.type === 'Poison' || d.type === 'Ténèbres') { c.fillStyle = d.type === 'Poison' ? 'rgba(130,60,170,0.55)' : 'rgba(40,20,60,0.55)'; c.beginPath(); c.ellipse(d.x, d.y, d.r, d.r * 0.42, 0, 0, TAU); c.fill(); if (d.type === 'Poison' && Math.floor(d.t * 3 + d.seed) % 3 === 0) { c.strokeStyle = '#d8a0ff'; c.beginPath(); c.arc(d.x + Math.sin(d.seed) * d.r * 0.5, d.y - 2, 1.5, 0, TAU); c.stroke(); } }
      else if (d.type === 'Électrique') { if (Math.sin(d.t * 30 + d.seed) > 0.6) { c.strokeStyle = '#ffe040'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(d.x - d.r, d.y); c.lineTo(d.x - d.r * 0.3, d.y - 2); c.lineTo(d.x + d.r * 0.2, d.y + 1); c.lineTo(d.x + d.r, d.y - 1); c.stroke(); } c.fillStyle = 'rgba(40,40,30,0.4)'; c.beginPath(); c.ellipse(d.x, d.y, d.r * 0.7, d.r * 0.3, 0, 0, TAU); c.fill(); }
      else if (d.type === 'Plante') { c.fillStyle = c1; for (let i = 0; i < 6; i++) c.fillRect(d.x + Math.cos(i + d.seed) * d.r, d.y + Math.sin(i * 2 + d.seed) * d.r * 0.4, 3, 1); }
      else { c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(d.x, d.y, d.r * 0.8, d.r * 0.3, 0, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    }
  }
  function tickDecals(B, dt) {
    if (!B.decals) return;
    for (let i = B.decals.length - 1; i >= 0; i--) { const d = B.decals[i]; d.t += dt; if (d.t >= d.life) B.decals.splice(i, 1); }
  }

  // ------------------------------------------------------------ aura de préparation (sous le Digimon)
  function aura(c, x, y, type, t, s = 1) {
    const [c0, c1, c2] = pal(type), p = 0.5 + 0.5 * Math.sin(t * 10);
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 2, x, y, 22 * s);
    g.addColorStop(0, `${c1}aa`); g.addColorStop(1, `${c1}00`);
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, 22 * s, 8 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = c2; c.globalAlpha = 0.6 + 0.4 * p; c.lineWidth = 1;
    c.beginPath(); c.ellipse(x, y, (14 + p * 6) * s, (5 + p * 2) * s, 0, 0, TAU); c.stroke();
    for (let i = 0; i < 6; i++) { const a = t * 3 + i, r = 12 * s, yy = y - ((t * 30 + i * 9) % 30) * s; c.fillStyle = i % 2 ? c1 : c2; c.fillRect(x + Math.cos(a) * r, yy, 1.5, 1.5); }
    c.restore();
  }

  // ------------------------------------------------------------ statuts visibles (x = centre, top = haut du sprite, y = pieds)
  function status(c, m, x, top, y, t) {
    if (!m || !m.status) return;
    if (m.status === 'brn') for (let i = 0; i < 4; i++) { const fx = x + (i - 1.5) * 6, h = 5 + Math.sin(t * 14 + i * 2) * 2, fy = top + 14 + (i % 2) * 6; c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(fx - 2, fy); c.quadraticCurveTo(fx, fy - h * 2, fx + 2, fy); c.fill(); c.fillStyle = '#ffe060'; c.fillRect(fx - 0.5, fy - h * 0.6, 1, 2); }
    else if (m.status === 'psn') for (let i = 0; i < 3; i++) { const by = top + 6 - ((t * 14 + i * 7) % 18), bx = x + (i - 1) * 7 + Math.sin(t * 3 + i) * 2; c.strokeStyle = '#c070ff'; c.lineWidth = 1; c.beginPath(); c.arc(bx, by, 1.6 + (i % 2), 0, TAU); c.stroke(); }
    else if (m.status === 'par' && Math.floor(t * 8) % 3 === 0) { c.strokeStyle = '#ffe040'; c.lineWidth = 1; for (let i = 0; i < 2; i++) { const sx = x + (R() - 0.5) * 20, sy = top + 8 + R() * (y - top - 10); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 3, sy + 3); c.lineTo(sx, sy + 5); c.lineTo(sx + 3, sy + 8); c.stroke(); } }
    else if (m.status === 'slp') { c.fillStyle = '#c8d4ff'; c.font = DW.UI.font(7); c.textAlign = 'center'; for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i * 0.5) % 1; c.globalAlpha = 1 - k; c.fillText('z', x + 8 + k * 8, top - k * 10); } c.globalAlpha = 1; c.textAlign = 'left'; }
  }

  // ------------------------------------------------------------ particules (gravité, bulles, feuilles, scintillements)
  function drawParticle(c, p) {
    c.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max * 0.5)));
    if (p.bubble) { c.strokeStyle = p.col; c.lineWidth = 0.8; c.beginPath(); c.arc(p.x, p.y, p.size * 0.8, 0, TAU); c.stroke(); }
    else if (p.leaf) { c.save(); c.translate(p.x, p.y); c.rotate((p.rot || 0) + p.life * 6); c.fillStyle = p.col; c.fillRect(-2, -1, 4, 2); c.restore(); }
    else if (p.twinkle) { c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3); c.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1); }
    else { c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
  }

  // ------------------------------------------------------------ grandes animations (s'ajoutent à DW.FX ; a = lanceur, b = cible)
  const FX = DW.FX;
  const shoot = (B, a, b, dur, draw, arc = 0, delay = 0) => add(B, dur, (c, k) => draw(c, lerp(a.x, b.x, k), lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * arc, k), delay);
  const zig = (c, x0, y0, x1, y1, col, w = 1.6, seg = 8, j = 8) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); for (let i = 1; i < seg; i++) { const k = i / seg; c.lineTo(lerp(x0, x1, k) + (R() - 0.5) * j, lerp(y0, y1, k) + (R() - 0.5) * j * 0.4); } c.lineTo(x1, y1); c.stroke(); };
  Object.assign(FX, {
    // POISON
    async venomsting(B, a, b) {
      A.sfx('swoosh');
      for (let i = 0; i < 3; i++) shoot(B, a, { x: b.x + (i - 1) * 6, y: b.y + (i - 1) * 4 }, 0.3, (c, x, y) => { const ang = Math.atan2(b.y - a.y, b.x - a.x); c.strokeStyle = '#e8d0ff'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(ang) * 8, y - Math.sin(ang) * 8); c.stroke(); c.fillStyle = '#9a48c0'; c.fillRect(x - 1, y - 1, 2, 2); }, 4, i * 0.06);
      await wait(0.42);
    },
    async sludge(B, a, b) {
      A.sfx('water');
      shoot(B, a, b, 0.5, (c, x, y, k) => { c.fillStyle = '#6a2a8a'; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); c.fillStyle = '#b070e0'; c.beginPath(); c.arc(x - 2, y - 2, 2.4, 0, TAU); c.fill(); if (R() < 0.6) part(B, x, y, (R() - 0.5) * 20, 10, 0.4, '#8a3ab0', 2); }, 26);
      await wait(0.5); A.sfx('hit');
      for (let i = 0; i < 14; i++) part(B, b.x, b.y, (R() - 0.5) * 100, -30 - R() * 50, 0.6, i % 2 ? '#6a2a8a' : '#b070e0', 3, { g: 200 });
    },
    async toxiccloud(B, a, b) {
      A.sfx('status');
      add(B, 1.1, (c, k) => { for (let i = 0; i < 7; i++) { const ang = i / 7 * TAU + k * 2, r = 10 + Math.sin(k * Math.PI) * 14; c.fillStyle = `rgba(${i % 2 ? '150,70,190' : '110,170,60'},${0.45 * Math.sin(k * Math.PI)})`; c.beginPath(); c.arc(b.x + Math.cos(ang) * r, b.y + Math.sin(ang) * r * 0.6 - k * 6, 9, 0, TAU); c.fill(); } });
      for (let i = 0; i < 12; i++) part(B, b.x + (R() - 0.5) * 30, b.y, 0, -12 - R() * 14, 1, '#d8a0ff', 2, { bubble: true });
      await wait(1.0);
    },
    async acidspray(B, a, b) {
      A.sfx('water');
      for (let i = 0; i < 16; i++) shoot(B, a, { x: b.x + (R() - 0.5) * 24, y: b.y + (R() - 0.5) * 16 }, 0.4, (c, x, y) => { c.fillStyle = i % 2 ? '#a8e040' : '#d0f070'; c.fillRect(x, y, 2, 2); }, 12, i * 0.02);
      await wait(0.6);
      add(B, 0.5, (c, k) => { c.fillStyle = `rgba(160,220,60,${0.5 * (1 - k)})`; c.beginPath(); c.arc(b.x, b.y, 8 + k * 10, 0, TAU); c.fill(); });
    },
    // FEU : colonnes de flammes autour de la cible
    async firestorm(B, a, b) {
      A.sfx('fire'); B.shake = 0.5;
      add(B, 1.1, (c, k) => {
        for (let i = 0; i < 9; i++) {
          const ang = i / 9 * TAU + k * 3, r = 10 + i % 3 * 10, x = b.x + Math.cos(ang) * r, y = b.y + 16 + Math.sin(ang) * r * 0.4, h = (30 + (i % 3) * 14) * Math.sin(k * Math.PI);
          c.fillStyle = '#c8301a'; c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x + Math.sin(k * 30 + i) * 4, y - h, x + 6, y); c.fill();
          c.fillStyle = '#ff9a2a'; c.beginPath(); c.moveTo(x - 3, y); c.quadraticCurveTo(x, y - h * 0.7, x + 3, y); c.fill();
          c.fillStyle = '#fff2a0'; c.fillRect(x - 1, y - h * 0.3, 2, 3);
        }
      });
      for (let i = 0; i < 30; i++) part(B, b.x + (R() - 0.5) * 50, b.y + 10, (R() - 0.5) * 20, -30 - R() * 50, 1, ['#ff5a1a', '#ffb030', '#ffe060'][i % 3], 2);
      await wait(1.0);
    },
    // EAU : une vague qui déferle sur la cible
    async tidalwave(B, a, b) {
      A.sfx('water'); A.sfx('swoosh');
      add(B, 1.1, (c, k) => {
        const dir = b.x > a.x ? 1 : -1, x0 = b.x - dir * (90 - k * 120), h = 26 + Math.sin(k * Math.PI) * 30;
        c.fillStyle = 'rgba(30,110,210,0.85)'; c.beginPath(); c.moveTo(x0 - dir * 70, b.y + 20);
        for (let i = 0; i <= 24; i++) { const xx = x0 - dir * 70 + dir * i * 5.8, w = Math.sin(i / 24 * Math.PI); c.lineTo(xx, b.y + 20 - h * w - Math.sin(i * 0.8 + k * 20) * 2); }
        c.lineTo(x0 + dir * 70, b.y + 20); c.fill();
        c.strokeStyle = '#e8fcff'; c.lineWidth = 2; c.stroke();
        for (let i = 0; i < 3; i++) part(B, x0 + dir * (40 + R() * 20), b.y + 20 - h, (R() - 0.5) * 40, -20 - R() * 30, 0.5, '#ffffff', 2, { g: 160 });
      });
      await wait(1.0); B.shake = 0.5;
    },
    // ÉLECTRIQUE : plusieurs éclairs tombent du ciel autour de la cible
    async thunderstorm(B, a, b) {
      A.sfx('thunder');
      add(B, 1.1, (c, k) => {
        c.fillStyle = `rgba(20,20,50,${0.35 * Math.sin(k * Math.PI)})`; c.fillRect(b.x - 200, b.y - 200, 400, 400);
        const i = Math.floor(k * 6);
        if (Math.floor(k * 40) % 2 === 0) { const ox = [0, -18, 14, -6, 20, 0][i]; zig(c, b.x + ox + 10, b.y - 140, b.x + ox, b.y + 4, '#fff6a0', 2.4, 10, 14); zig(c, b.x + ox + 10, b.y - 140, b.x + ox, b.y + 4, '#ffffff', 0.8, 10, 14); }
      });
      for (let t = 0; t < 5; t++) DW.wait(0.15 + t * 0.18).then(() => { A.sfx('elec'); B.flash = 0.3; });
      await wait(1.05);
    },
    // GLACE : des pics jaillissent du sol sous la cible
    async icespikes(B, a, b) {
      A.sfx('water');
      add(B, 0.9, (c, k) => {
        for (let i = 0; i < 7; i++) {
          const x = b.x + (i - 3) * 7, h = Math.min(1, Math.max(0, k * 4 - i * 0.25)) * (20 + (i % 3) * 8), y = b.y + 18;
          c.fillStyle = '#9ae8ff'; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x, y - h); c.lineTo(x + 4, y); c.fill();
          c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - 1, y); c.lineTo(x, y - h); c.lineTo(x + 1, y); c.fill();
        }
      });
      await wait(0.6); A.sfx('hit');
      await wait(0.3);
    },
    // TERRE : la terre tremble, des rochers jaillissent
    async quake(B, a, b) {
      A.sfx('explode'); B.shake = 1.2;
      add(B, 1.0, (c, k) => {
        c.strokeStyle = '#3a2410'; c.lineWidth = 2;
        for (let i = 0; i < 5; i++) { const ang = i / 5 * TAU; c.beginPath(); c.moveTo(b.x, b.y + 16); for (let s = 1; s <= 4; s++) c.lineTo(b.x + Math.cos(ang) * s * 10 * Math.min(1, k * 3) + (R() - 0.5) * 3, b.y + 16 + Math.sin(ang) * s * 4 * Math.min(1, k * 3)); c.stroke(); }
      });
      for (let i = 0; i < 10; i++) DW.wait(i * 0.07).then(() => part(B, b.x + (R() - 0.5) * 50, b.y + 16, (R() - 0.5) * 40, -80 - R() * 60, 0.8, i % 2 ? '#8a6a40' : '#b09060', 4, { g: 300 }));
      await wait(1.0);
    },
    // LUMIÈRE : un pilier de lumière descend sur la cible
    async holybeam(B, a, b) {
      A.sfx('buff');
      add(B, 0.9, (c, k) => {
        const w = 18 * Math.sin(k * Math.PI);
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createLinearGradient(b.x - w, 0, b.x + w, 0); g.addColorStop(0, 'rgba(255,240,160,0)'); g.addColorStop(0.5, 'rgba(255,250,220,0.9)'); g.addColorStop(1, 'rgba(255,240,160,0)');
        c.fillStyle = g; c.fillRect(b.x - w, b.y - 200, w * 2, 220);
        c.restore();
      });
      for (let i = 0; i < 20; i++) part(B, b.x + (R() - 0.5) * 30, b.y + 10, 0, -40 - R() * 40, 0.9, '#fff8d0', 1, { twinkle: true });
      B.flash = 0.6; await wait(0.9);
    },
    // TÉNÈBRES : une sphère noire qui aspire la lumière
    async darkorb(B, a, b) {
      A.sfx('status');
      add(B, 0.5, (c, k) => { c.fillStyle = '#1a0a2a'; c.beginPath(); c.arc(a.x + (b.x > a.x ? 14 : -14), a.y, 4 + k * 6, 0, TAU); c.fill(); c.strokeStyle = '#c890f0'; c.lineWidth = 1; c.stroke(); });
      await wait(0.5);
      shoot(B, a, b, 0.5, (c, x, y, k) => { c.fillStyle = '#1a0a2a'; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); c.strokeStyle = '#8a4ab0'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 11 + Math.sin(k * 30) * 2, 0, TAU); c.stroke(); });
      await wait(0.5);
      add(B, 0.6, (c, k) => { c.fillStyle = `rgba(20,0,40,${0.6 * (1 - k)})`; c.beginPath(); c.arc(b.x, b.y, 10 + k * 26, 0, TAU); c.fill(); });
    },
    // PLANTE : tourbillon de pétales
    async petalstorm(B, a, b) {
      A.sfx('leaf');
      add(B, 1.0, (c, k) => { for (let i = 0; i < 24; i++) { const ang = k * 12 + i, r = 6 + i * 1.2, x = b.x + Math.cos(ang) * r, y = b.y + 10 - i * 2 + Math.sin(ang) * r * 0.3; c.fillStyle = i % 3 ? '#ff9ac8' : '#ffffff'; c.fillRect(x, y, 3, 2); } });
      await wait(1.0);
    },
  });
  // animations attendues par des techniques mais jamais écrites (elles retombaient sur une simple boule)
  Object.assign(FX, {
    // météore : une boule d'énergie tombe du ciel et explose (couleur de l'élément)
    async meteor(B, a, b, side, mv) {
      const [c0, c1, c2] = pal(mv && mv.type);
      A.sfx('beam');
      add(B, 0.55, (c, k) => { const x = b.x + 60 * (1 - k), y = b.y - 150 * (1 - k); c.fillStyle = c1; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); c.fillStyle = c2; c.beginPath(); c.arc(x - 2, y - 2, 4, 0, TAU); c.fill(); for (let i = 1; i < 6; i++) { c.globalAlpha = 0.5 - i * 0.08; c.fillStyle = c0; c.beginPath(); c.arc(x + i * 6, y - i * 14, 9 - i, 0, TAU); c.fill(); } c.globalAlpha = 1; });
      await wait(0.55);
      A.sfx('explode'); B.shake = 0.8; B.flash = 0.6;
      add(B, 0.6, (c, k) => { for (let i = 0; i < 3; i++) { c.globalAlpha = (1 - k) * (1 - i * 0.25); c.fillStyle = [c0, c1, c2][i]; c.beginPath(); c.arc(b.x, b.y, 34 * (0.3 + k) * (1 - i * 0.3), 0, TAU); c.fill(); } c.globalAlpha = 1; });
      for (let i = 0; i < 26; i++) { const ang = R() * TAU, v = 60 + R() * 80; part(B, b.x, b.y, Math.cos(ang) * v, Math.sin(ang) * v, 0.6, [c0, c1, c2][i % 3], 2); }
      await wait(0.3);
    },
    // flamme bleue : un jet de feu bleu-blanc qui part de la GUEULE (pas du ventre) et reste continu jusqu'à la cible
    async bluefire(B, a, b) {
      A.sfx('fire');
      const dir = b.x >= a.x ? 1 : -1, m = { x: a.x + dir * 18, y: a.y - 12 };   // la gueule : devant et en haut du sprite
      add(B, 0.8, (c, k) => {
        const p = Math.min(1, k * 2.4), fade = k > 0.8 ? (1 - k) * 5 : 1, N = 40;
        c.globalAlpha = fade;
        for (const [rs, col] of [[1.6, '#2a5aff'], [1.1, '#6aa8ff'], [0.55, '#e8f4ff']]) {   // halo, cœur, âme blanche
          c.fillStyle = col;
          for (let i = 0; i <= N; i++) {
            const t = i / N * p, x = lerp(m.x, b.x, t), y = lerp(m.y, b.y, t) + Math.sin(t * 18 - k * 40) * 2.4 * t;
            c.beginPath(); c.arc(x, y, (2.6 + t * 6.5) * rs, 0, TAU); c.fill();
          }
        }
        // langues de feu qui lèchent le bord du jet
        c.fillStyle = '#9ac8ff';
        for (let i = 0; i < 6; i++) { const t = ((i / 6 + k * 3) % 1) * p, x = lerp(m.x, b.x, t), y = lerp(m.y, b.y, t) - 6 - t * 8 - (i % 2) * 3; c.beginPath(); c.arc(x, y, 1.6 + t * 2, 0, TAU); c.fill(); }
        c.globalAlpha = 1;
      });
      await wait(0.6);
      for (let i = 0; i < 18; i++) part(B, b.x, b.y, (R() - 0.5) * 60, -20 - R() * 50, 0.6, i % 2 ? '#4a8aff' : '#ffffff', 2);
      await wait(0.25);
    },
    // poing de feu : bond, poing enflammé, explosion
    async firepunch(B, a, b, side) {
      A.sfx('swoosh');
      const s = B.spr[side], dir = side === 'p' ? 1 : -1;
      await DW.tween(s, { dx: dir * 30, dy: -dir * 12 }, 0.14);
      add(B, 0.35, (c, k) => { for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU + k * 4, r = 8 + k * 12; c.fillStyle = i % 2 ? '#ff7a1a' : '#ffe060'; c.beginPath(); c.arc(b.x + Math.cos(ang) * r, b.y + Math.sin(ang) * r, 4 * (1 - k) + 1, 0, TAU); c.fill(); } });
      A.sfx('explode'); B.shake = 0.5;
      DW.tween(s, { dx: 0, dy: 0 }, 0.2);
      await wait(0.35);
    },
  });
  // les anciens effets « plein écran » suivent la cible (dans l'arène, la caméra bouge)
  FX.blizzard = async (B, a, b) => {
    A.sfx('swoosh'); A.sfx('water');
    add(B, 1.0, (c, k) => { for (let i = 0; i < 70; i++) { const x = b.x - 170 + ((i * 53 + k * 400) % 340), y = b.y - 120 + (i * 37 + k * 120) % 240; c.fillStyle = i % 3 ? '#ffffff' : '#bfefff'; c.fillRect(x, y, 2, 2); } c.fillStyle = `rgba(200,240,255,${Math.sin(k * Math.PI) * 0.25})`; c.fillRect(b.x - 170, b.y - 120, 340, 240); });
    await wait(1.0);
  };

  DW.Elem = { PAL, pal, impact, decal, drawDecals, tickDecals, aura, status, drawParticle };
})();
