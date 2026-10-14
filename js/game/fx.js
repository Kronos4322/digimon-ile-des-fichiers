'use strict';
// =====================================================================
//  EFFETS D'ATTAQUE : une animation propre à chaque technique
//  Chaque effet reçoit (B = scène de combat, a = centre lanceur, b = centre cible, side = 'p'|'e')
// =====================================================================
(function () {
  const A = DW.Audio, wait = DW.wait, lerp = DW.lerp;
  const TAU = Math.PI * 2;

  // ------------------------------------------------------------ outils
  const add = (B, dur, draw, delay = 0) => { B.fxd.push({ t: -delay, dur, draw }); };
  const burst = (B, x, y, n, cols, o = {}) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = (o.v || 60) * (0.4 + Math.random());
      B.pt.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), life: o.life || 0.4, max: o.life || 0.4, col: cols[i % cols.length], size: o.size || 2, g: o.g || 0 });
    }
  };
  const lunge = async (B, side, dist = 34, dur = 0.14) => {
    const s = B.spr[side], dir = side === 'p' ? 1 : -1;
    await DW.tween(s, { dx: dir * dist, dy: -dir * dist * 0.45 }, dur);
    DW.tween(s, { dx: 0, dy: 0 }, 0.2);
  };
  const recoil = async (B, side) => { const s = B.spr[side], dir = side === 'p' ? 1 : -1; await DW.tween(s, { dx: -dir * 6 }, 0.1); DW.tween(s, { dx: 0 }, 0.15); };
  const star = (c, x, y, r, col, n = 8) => {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr = i % 2 ? r * 0.4 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.fill();
  };
  const impact = (B, b, cols = ['#ffffff', '#ffe060'], r = 14) => {
    add(B, 0.25, (c, k) => { c.globalAlpha = 1 - k; star(c, b.x, b.y, r * (0.5 + k), cols[0]); star(c, b.x, b.y, r * 0.5 * (0.5 + k), cols[1]); c.globalAlpha = 1; });
    burst(B, b.x, b.y, 12, cols, { v: 70 });
  };
  const ring = (B, x, y, col, r0, r1, dur, delay = 0, w = 2) => add(B, dur, (c, k) => {
    c.strokeStyle = col; c.globalAlpha = 1 - k; c.lineWidth = w * (1 - k) + 0.5;
    c.beginPath(); c.ellipse(x, y, lerp(r0, r1, k), lerp(r0, r1, k) * 0.7, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
  }, delay);
  const explode = (B, b, cols = ['#ff6a1a', '#ffd040', '#ffffff'], r = 20) => {
    A.sfx('explode');
    add(B, 0.45, (c, k) => {
      for (let i = 0; i < 3; i++) {
        c.globalAlpha = (1 - k) * (1 - i * 0.25); c.fillStyle = cols[i];
        c.beginPath(); c.arc(b.x, b.y, r * (0.4 + k) * (1 - i * 0.3), 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
    });
    burst(B, b.x, b.y, 20, cols, { v: 90, life: 0.5 });
    B.shake = Math.max(B.shake, 0.35);
  };
  // projectile générique : draw(c, x, y, k)
  const shoot = (B, a, b, dur, draw, arc = 0, delay = 0) => add(B, dur, (c, k) => {
    const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * arc;
    draw(c, x, y, k);
  }, delay);
  const flame = (c, x, y, r, t) => {
    c.fillStyle = '#e8401a'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = '#ff9a2a'; c.beginPath(); c.arc(x - r * 0.15, y - r * 0.15, r * 0.7, 0, TAU); c.fill();
    c.fillStyle = '#fff2a0'; c.beginPath(); c.arc(x - r * 0.25, y - r * 0.25, r * 0.35 * (0.8 + 0.2 * Math.sin(t * 40)), 0, TAU); c.fill();
  };
  const bolt = (c, x0, y0, x1, y1, col, seg = 7, j = 6) => {
    c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0, y0);
    for (let i = 1; i < seg; i++) { const k = i / seg; c.lineTo(lerp(x0, x1, k) + (Math.random() - 0.5) * j * 2, lerp(y0, y1, k) + (Math.random() - 0.5) * j); }
    c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = 0.6; c.stroke();
  };
  const leaf = (c, x, y, r, a, col) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, r, r * 0.45, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-r * 0.6, -0.3, r * 1.2, 0.6); c.restore(); };

  // ------------------------------------------------------------ effets
  const FX = {
    async tackle(B, a, b, side) { A.sfx('swoosh'); await lunge(B, side); impact(B, b); },
    async dash(B, a, b, side) {
      A.sfx('swoosh');
      for (let i = 0; i < 4; i++) add(B, 0.2, (c, k) => { c.strokeStyle = `rgba(255,255,255,${1 - k})`; c.lineWidth = 1; c.beginPath(); c.moveTo(a.x - 20, a.y - 10 + i * 7); c.lineTo(a.x - 50, a.y - 10 + i * 7); c.stroke(); }, i * 0.03);
      await lunge(B, side, 44, 0.09); impact(B, b);
    },
    async claw(B, a, b, side) {
      await lunge(B, side, 24, 0.12);
      for (let i = 0; i < 3; i++) {
        DW.wait(i * 0.07).then(() => A.sfx('slash'));
        add(B, 0.3, (c, k) => {
          const o = (i - 1) * 7, p = Math.min(1, k * 3);
          c.strokeStyle = `rgba(255,255,255,${1 - k})`; c.lineWidth = 2.2 * (1 - k) + 0.6;
          c.beginPath(); c.moveTo(b.x - 14 + o, b.y - 16); c.lineTo(lerp(b.x - 14 + o, b.x + 10 + o, p), lerp(b.y - 16, b.y + 16, p)); c.stroke();
          c.strokeStyle = `rgba(255,120,80,${(1 - k) * 0.6})`; c.lineWidth = 4 * (1 - k); c.stroke();
        }, i * 0.07);
      }
      await wait(0.3);
    },
    async bite(B, a, b, side) {
      await lunge(B, side, 22, 0.12);
      A.sfx('slash');
      add(B, 0.35, (c, k) => {
        const g = Math.max(0, 12 - k * 30);
        c.fillStyle = '#ffffff'; c.globalAlpha = 1 - Math.max(0, k - 0.6) * 2.5;
        for (let i = -2; i <= 2; i++) {
          c.beginPath(); c.moveTo(b.x + i * 6 - 3, b.y - g - 8); c.lineTo(b.x + i * 6 + 3, b.y - g - 8); c.lineTo(b.x + i * 6, b.y - g); c.fill();
          c.beginPath(); c.moveTo(b.x + i * 6 - 3, b.y + g + 8); c.lineTo(b.x + i * 6 + 3, b.y + g + 8); c.lineTo(b.x + i * 6, b.y + g); c.fill();
        }
        c.globalAlpha = 1;
      });
      await wait(0.2); impact(B, b, ['#ffffff', '#ff6060'], 10);
    },
    async horn(B, a, b, side) { A.sfx('swoosh'); await lunge(B, side, 40, 0.1); impact(B, b, ['#ffffff', '#ffd040'], 20); ring(B, b.x, b.y, '#ffffff', 6, 30, 0.3); },
    async punch(B, a, b, side) {
      A.sfx('swoosh'); await lunge(B, side, 30, 0.1);
      impact(B, b, ['#ffffff', '#ff8a3a'], 16); ring(B, b.x, b.y, '#ffd0a0', 4, 26, 0.3); ring(B, b.x, b.y, '#ffffff', 2, 18, 0.3, 0.06);
      B.shake = 0.25;
    },
    async scissor(B, a, b, side) {
      await lunge(B, side, 30, 0.12);
      A.sfx('slash');
      add(B, 0.35, (c, k) => {
        const p = Math.min(1, k * 2.5);
        c.strokeStyle = `rgba(230,240,255,${1 - k})`; c.lineWidth = 3;
        c.beginPath(); c.arc(b.x - 14 + p * 10, b.y, 16, -0.9, 0.9); c.stroke();
        c.beginPath(); c.arc(b.x + 14 - p * 10, b.y, 16, Math.PI - 0.9, Math.PI + 0.9); c.stroke();
      });
      await wait(0.25); impact(B, b, ['#ffffff', '#c8d0ff'], 14);
    },
    async roar(B, a, b, side) {
      A.sfx('roar');
      for (let i = 0; i < 4; i++) ring(B, a.x, a.y, '#ffffff', 10, 60, 0.5, i * 0.12, 2.5);
      B.shake = 0.4;
      await recoil(B, side); await wait(0.5);
    },
    async shield(B, a, b, side) {
      A.sfx('buff');
      add(B, 0.7, (c, k) => {
        c.strokeStyle = `rgba(140,220,255,${Math.sin(k * Math.PI)})`; c.lineWidth = 2;
        c.beginPath();
        for (let i = 0; i <= 6; i++) { const t = i / 6 * TAU + k; c.lineTo(a.x + Math.cos(t) * 30, a.y + Math.sin(t) * 26); }
        c.stroke();
        c.fillStyle = `rgba(140,220,255,${Math.sin(k * Math.PI) * 0.2})`; c.fill();
      });
      await wait(0.7);
    },
    async bubbles(B, a, b, side) {
      A.sfx('water'); await recoil(B, side);
      for (let i = 0; i < 9; i++) shoot(B, a, { x: b.x + DW.rand(-10, 10), y: b.y + DW.rand(-10, 10) }, 0.55, (c, x, y, k) => {
        const r = 2.5 + (i % 3);
        c.strokeStyle = '#c8f0ff'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y + Math.sin(k * 12 + i) * 4, r, 0, TAU); c.stroke();
        c.fillStyle = 'rgba(160,220,255,0.35)'; c.fill();
        c.fillStyle = '#ffffff'; c.fillRect(x - r * 0.5, y + Math.sin(k * 12 + i) * 4 - r * 0.5, 1, 1);
      }, 10, i * 0.05);
      await wait(0.95); burst(B, b.x, b.y, 10, ['#c8f0ff', '#ffffff'], { v: 50 });
    },
    async fireball(B, a, b, side) {
      A.sfx('fire'); await recoil(B, side);
      shoot(B, a, b, 0.45, (c, x, y, k) => { flame(c, x, y, 7, k); if (Math.random() < 0.7) B.pt.push({ x, y, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 20, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ff9a2a' : '#ffd040', size: 2 }); }, 6);
      await wait(0.45); explode(B, b, ['#e8401a', '#ff9a2a', '#fff2a0'], 18);
    },
    async flamebeam(B, a, b, side) {
      A.sfx('beam'); A.sfx('fire'); await recoil(B, side);
      add(B, 0.8, (c, k) => {
        for (let i = 0; i < 14; i++) {
          const p = ((k * 3 + i / 14) % 1);
          const x = lerp(a.x, b.x, p), y = lerp(a.y, b.y, p) + Math.sin(p * 20 + k * 30) * 4;
          flame(c, x, y, 3 + p * 6, k + i);
        }
      });
      await wait(0.75); explode(B, b, ['#e8401a', '#ff9a2a', '#fff2a0'], 28);
    },
    async spiral(B, a, b, side) {
      A.sfx('fire'); await recoil(B, side);
      for (let i = 0; i < 16; i++) shoot(B, a, b, 0.6, (c, x, y, k) => flame(c, x + Math.cos(k * 14 + i) * 10 * (1 - k), y + Math.sin(k * 14 + i) * 10 * (1 - k), 3.5, k), 0, i * 0.02);
      await wait(0.9); explode(B, b, ['#e8401a', '#ff9a2a', '#fff2a0'], 18);
    },
    async fish(B, a, b, side) {
      A.sfx('water');
      for (let i = 0; i < 6; i++) {
        const sx = b.x + (i - 2.5) * 10, sy = b.y + 30;
        add(B, 0.6, (c, k) => {
          const x = sx + k * 6, y = sy - Math.sin(k * Math.PI) * 50;
          c.save(); c.translate(x, y); c.rotate(-Math.cos(k * Math.PI) * 1.2);
          c.fillStyle = i % 2 ? '#5ab0f0' : '#f0a040'; c.beginPath(); c.ellipse(0, 0, 5, 2.6, 0, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(-4, 0); c.lineTo(-8, -3); c.lineTo(-8, 3); c.fill();
          c.fillStyle = '#ffffff'; c.fillRect(2, -1, 1, 1);
          c.restore();
        }, i * 0.08);
      }
      await wait(0.7); burst(B, b.x, b.y + 10, 14, ['#c8f0ff', '#5ab0f0', '#ffffff'], { v: 60, up: 40 });
    },
    async harpoon(B, a, b, side) {
      A.sfx('swoosh'); await recoil(B, side);
      shoot(B, a, b, 0.35, (c, x, y, k) => {
        c.save(); c.translate(x, y); c.rotate(Math.atan2(b.y - a.y, b.x - a.x));
        c.fillStyle = '#f0c060'; c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -3); c.lineTo(-6, 3); c.fill();
        c.fillStyle = '#c8d0e0'; c.fillRect(-10, -2, 5, 4); c.restore();
        B.pt.push({ x, y, vx: 0, vy: -6, life: 0.4, max: 0.4, col: 'rgba(230,230,240,0.8)', size: 3 });
      });
      await wait(0.35); explode(B, b, ['#5ab0f0', '#ffffff', '#c8f0ff'], 26);
    },
    async waterbeam(B, a, b, side) {
      A.sfx('water'); A.sfx('beam'); await recoil(B, side);
      add(B, 0.7, (c, k) => {
        const w = 5 + Math.sin(k * 40) * 1.5;
        c.strokeStyle = '#3a8ae8'; c.lineWidth = w + 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(lerp(a.x, b.x, Math.min(1, k * 4)), lerp(a.y, b.y, Math.min(1, k * 4))); c.stroke();
        c.strokeStyle = '#c8f4ff'; c.lineWidth = w * 0.5; c.stroke(); c.lineCap = 'butt';
      });
      await wait(0.6); burst(B, b.x, b.y, 18, ['#c8f0ff', '#5ab0f0', '#ffffff'], { v: 80 });
    },
    async wave(B, a, b, side) {
      A.sfx('water');
      add(B, 0.8, (c, k) => {
        const h = Math.sin(k * Math.PI) * 50, x0 = b.x - 50 + k * 30;
        c.fillStyle = 'rgba(40,120,220,0.8)'; c.beginPath(); c.moveTo(x0, b.y + 30);
        for (let i = 0; i <= 20; i++) c.lineTo(x0 + i * 5, b.y + 30 - h * Math.sin(i / 20 * Math.PI) - Math.sin(i + k * 20) * 2);
        c.lineTo(x0 + 100, b.y + 30); c.fill();
        c.strokeStyle = '#e8fcff'; c.lineWidth = 2; c.stroke();
      });
      await wait(0.7); burst(B, b.x, b.y, 16, ['#ffffff', '#8ad0ff'], { v: 70 });
    },
    async icebreath(B, a, b, side) {
      A.sfx('water'); await recoil(B, side);
      for (let i = 0; i < 18; i++) shoot(B, a, { x: b.x + DW.rand(-14, 14), y: b.y + DW.rand(-12, 12) }, 0.5, (c, x, y) => { c.fillStyle = i % 2 ? '#e0f8ff' : '#8ae0ff'; c.fillRect(x, y, 2, 2); }, 0, i * 0.02);
      await wait(0.75);
      add(B, 0.5, (c, k) => { c.globalAlpha = 1 - k; for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU; c.strokeStyle = '#e0f8ff'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x + Math.cos(ang) * 18 * (0.5 + k), b.y + Math.sin(ang) * 18 * (0.5 + k)); c.stroke(); } c.globalAlpha = 1; });
    },
    async blizzard(B, a, b, side) {
      A.sfx('swoosh'); A.sfx('water');
      add(B, 1.0, (c, k) => { for (let i = 0; i < 60; i++) { const x = ((i * 53 + k * 400) % 360) - 20, y = (i * 37 + k * 120) % 240; c.fillStyle = i % 3 ? '#ffffff' : '#bfefff'; c.fillRect(x, y, 2, 2); } c.fillStyle = `rgba(200,240,255,${Math.sin(k * Math.PI) * 0.25})`; c.fillRect(0, 0, 320, 240); });
      await wait(1.0);
    },
    async vine(B, a, b, side) {
      A.sfx('leaf'); await recoil(B, side);
      for (let v = 0; v < 2; v++) add(B, 0.5, (c, k) => {
        const p = Math.min(1, k * 2.2);
        c.strokeStyle = '#2e8a3a'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(a.x, a.y);
        const cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - 40 + v * 30;
        for (let i = 1; i <= 12; i++) { const t = i / 12 * p; c.lineTo((1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x, (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y); }
        c.stroke(); c.strokeStyle = '#6ad060'; c.lineWidth = 1; c.stroke();
      }, v * 0.1);
      await wait(0.5); A.sfx('slash'); impact(B, b, ['#ffffff', '#6ad060'], 12);
    },
    async spores(B, a, b, side) {
      A.sfx('status');
      for (let i = 0; i < 24; i++) shoot(B, a, { x: b.x + DW.rand(-20, 20), y: b.y + DW.rand(-20, 10) }, 0.9, (c, x, y, k) => {
        c.fillStyle = i % 2 ? `rgba(255,170,220,${1 - k * 0.5})` : `rgba(255,240,150,${1 - k * 0.5})`; c.beginPath(); c.arc(x + Math.sin(k * 10 + i) * 6, y, 1.6 + (i % 3) * 0.5, 0, TAU); c.fill();
      }, 20, i * 0.02);
      await wait(1.0);
    },
    async needles(B, a, b, side) {
      A.sfx('leaf'); await recoil(B, side);
      for (let i = 0; i < 18; i++) shoot(B, { x: a.x + DW.rand(-10, 10), y: a.y + DW.rand(-14, 14) }, { x: b.x + DW.rand(-14, 14), y: b.y + DW.rand(-14, 14) }, 0.3, (c, x, y) => {
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        c.strokeStyle = '#f8f8d0'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(ang) * 6, y - Math.sin(ang) * 6); c.stroke();
      }, 0, i * 0.03);
      await wait(0.8); impact(B, b, ['#ffffff', '#c8f080'], 14);
    },
    async leaves(B, a, b, side) {
      A.sfx('leaf'); await recoil(B, side);
      for (let i = 0; i < 10; i++) shoot(B, a, { x: b.x + DW.rand(-12, 12), y: b.y + DW.rand(-12, 12) }, 0.5, (c, x, y, k) => leaf(c, x, y, 4, k * 20 + i, i % 2 ? '#5ac04a' : '#9ae070'), 14, i * 0.04);
      await wait(0.8); A.sfx('slash'); impact(B, b, ['#ffffff', '#9ae070'], 10);
    },
    async tornado(B, a, b, side) {
      A.sfx('swoosh');
      add(B, 0.9, (c, k) => {
        for (let i = 0; i < 26; i++) {
          const y = b.y + 30 - i * 3, r = 4 + i * 0.9, ang = k * 30 + i * 0.6;
          c.fillStyle = `rgba(220,235,255,${0.7 * Math.sin(k * Math.PI)})`;
          c.fillRect(b.x + Math.cos(ang) * r, y, 2, 1.4);
        }
      });
      await wait(0.9);
    },
    async web(B, a, b, side) {
      A.sfx('status');
      shoot(B, a, b, 0.35, (c, x, y) => { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill(); }, 10);
      await wait(0.35);
      add(B, 0.8, (c, k) => {
        c.strokeStyle = `rgba(255,255,255,${1 - k * 0.7})`; c.lineWidth = 0.7; const r = 26 * Math.min(1, k * 3);
        for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x + Math.cos(ang) * r, b.y + Math.sin(ang) * r); c.stroke(); }
        for (let j = 1; j <= 3; j++) { c.beginPath(); for (let i = 0; i <= 8; i++) { const ang = i / 8 * TAU; c.lineTo(b.x + Math.cos(ang) * r * j / 3, b.y + Math.sin(ang) * r * j / 3); } c.stroke(); }
      });
      await wait(0.6);
    },
    async wire(B, a, b, side) {
      A.sfx('elec'); await recoil(B, side);
      add(B, 0.6, (c, k) => { const p = Math.min(1, k * 3); bolt(c, a.x, a.y, lerp(a.x, b.x, p), lerp(a.y, b.y, p), '#ffe040', 9, 4); });
      await wait(0.5); impact(B, b, ['#ffffff', '#ffe040'], 12);
    },
    async shock(B, a, b, side) {
      A.sfx('elec');
      add(B, 0.6, (c, k) => { for (let i = 0; i < 4; i++) { const ang = Math.random() * TAU; bolt(c, b.x, b.y, b.x + Math.cos(ang) * 24, b.y + Math.sin(ang) * 24, '#ffe040', 4, 4); } });
      await wait(0.6);
    },
    async thunder(B, a, b, side) {
      A.sfx('thunder'); A.sfx('elec');
      add(B, 0.5, (c, k) => { if (k < 0.7) { bolt(c, b.x + 10, b.y - 140, b.x, b.y, '#fff080', 10, 12); bolt(c, b.x - 8, b.y - 140, b.x, b.y, '#ffe040', 8, 10); } });
      B.flash = 0.8; await wait(0.45); impact(B, b, ['#ffffff', '#ffe040'], 22);
    },
    async mushbomb(B, a, b, side) {
      A.sfx('swoosh'); await recoil(B, side);
      for (let i = 0; i < 3; i++) shoot(B, a, { x: b.x + (i - 1) * 12, y: b.y }, 0.5, (c, x, y, k) => {
        c.save(); c.translate(x, y); c.rotate(k * 10);
        c.fillStyle = '#f4ead8'; c.fillRect(-1, 0, 2, 4); c.fillStyle = '#9a4cc8'; c.beginPath(); c.arc(0, 0, 4, Math.PI, 0); c.fill();
        c.fillStyle = '#ead0fa'; c.fillRect(-2, -2, 1, 1); c.restore();
      }, 40, i * 0.08);
      await wait(0.7); explode(B, b, ['#8a3ac8', '#d090ff', '#ffffff'], 20);
    },
    async rocks(B, a, b, side) {
      A.sfx('swoosh'); await recoil(B, side);
      for (let i = 0; i < 4; i++) shoot(B, a, { x: b.x + DW.rand(-12, 12), y: b.y + DW.rand(-8, 8) }, 0.45, (c, x, y, k) => { c.fillStyle = '#8a8070'; c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill(); c.fillStyle = '#b0a898'; c.fillRect(x - 2, y - 2, 2, 1); }, 30, i * 0.07);
      await wait(0.7); impact(B, b, ['#ffffff', '#c0a070'], 14);
    },
    async missiles(B, a, b, side) {
      A.sfx('beam');
      for (let i = 0; i < 2; i++) shoot(B, a, b, 0.6, (c, x, y, k) => {
        const yy = y + (i ? 1 : -1) * Math.sin(k * Math.PI) * 24;
        c.fillStyle = '#c8d0e0'; c.beginPath(); c.ellipse(x, yy, 6, 2.6, Math.atan2(b.y - a.y, b.x - a.x), 0, TAU); c.fill();
        c.fillStyle = '#ff4040'; c.beginPath(); c.arc(x + (b.x > a.x ? 5 : -5), yy, 1.6, 0, TAU); c.fill();
        B.pt.push({ x, y: yy, vx: 0, vy: -4, life: 0.5, max: 0.5, col: 'rgba(220,220,230,0.8)', size: 3 });
      }, 0, i * 0.1);
      await wait(0.7); explode(B, b, ['#e8401a', '#ff9a2a', '#ffffff'], 34); B.flash = 0.6;
    },
    async hammer(B, a, b, side) {
      A.sfx('swoosh'); await lunge(B, side, 30, 0.15);
      add(B, 0.4, (c, k) => {
        const y = lerp(b.y - 60, b.y - 6, Math.min(1, k * 2));
        c.fillStyle = '#8a5a32'; c.fillRect(b.x - 2, y - 30, 4, 30);
        c.fillStyle = '#c8d0e0'; c.fillRect(b.x - 14, y - 6, 28, 14); c.fillStyle = '#f0d050'; c.fillRect(b.x - 14, y - 2, 28, 3);
      });
      await wait(0.25); A.sfx('explode'); B.shake = 0.7; ring(B, b.x, b.y + 20, '#ffe060', 6, 60, 0.4, 0, 3); impact(B, b, ['#ffffff', '#ffe060'], 24);
    },
    async boomerang(B, a, b, side) {
      A.sfx('swoosh');
      add(B, 0.9, (c, k) => {
        const p = k < 0.5 ? k * 2 : 2 - k * 2;
        const x = lerp(a.x, b.x, p), y = lerp(a.y, b.y, p) - Math.sin(p * Math.PI) * 26 * (k < 0.5 ? 1 : -1);
        c.save(); c.translate(x, y); c.rotate(k * 30);
        c.fillStyle = '#c8823a'; c.beginPath(); c.ellipse(0, 0, 9, 5, 0, 0, TAU); c.fill();
        c.fillStyle = '#f0e8d0'; for (let i = -1; i <= 1; i++) c.fillRect(i * 4 - 1, -4, 2, 2); c.restore();
      });
      await wait(0.45); impact(B, b, ['#ffffff', '#f0c080'], 16); await wait(0.45);
    },
    async flowercannon(B, a, b, side) {
      A.sfx('buff');
      add(B, 0.6, (c, k) => { for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU + k * 4; c.fillStyle = '#ff8ac0'; c.beginPath(); c.ellipse(a.x + 16 + Math.cos(ang) * 8 * (1 - k), a.y + Math.sin(ang) * 8 * (1 - k), 4, 2.4, ang, 0, TAU); c.fill(); } c.fillStyle = `rgba(255,255,200,${k})`; c.beginPath(); c.arc(a.x + 16, a.y, 6 * k, 0, TAU); c.fill(); });
      await wait(0.6); A.sfx('beam');
      add(B, 0.6, (c, k) => {
        c.strokeStyle = '#ff6ab0'; c.lineWidth = 14 * Math.sin(k * Math.PI) + 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(a.x + 16, a.y); c.lineTo(b.x, b.y); c.stroke();
        c.strokeStyle = '#fff4fa'; c.lineWidth = 5 * Math.sin(k * Math.PI) + 1; c.stroke(); c.lineCap = 'butt';
      });
      B.flash = 0.5; await wait(0.5); explode(B, b, ['#ff6ab0', '#ffd0e8', '#ffffff'], 30);
    },
    async hearts(B, a, b, side) {
      A.sfx('status');
      for (let i = 0; i < 6; i++) shoot(B, a, { x: b.x + DW.rand(-12, 12), y: b.y + DW.rand(-12, 12) }, 0.7, (c, x, y, k) => {
        c.fillStyle = `rgba(255,110,170,${1 - k * 0.4})`;
        c.beginPath(); c.arc(x - 2, y, 2.4, 0, TAU); c.arc(x + 2, y, 2.4, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(x - 4.4, y + 1); c.lineTo(x, y + 5.5); c.lineTo(x + 4.4, y + 1); c.fill();
      }, 16, i * 0.07);
      await wait(1.0);
    },
    async orb(B, a, b, side, mv) {
      const [c1, c2] = { 'Feu': ['#ff6a1a', '#ffd040'], 'Eau': ['#4aa8ff', '#e0f4ff'], 'Plante': ['#40c848', '#b8f878'], 'Électrique': ['#ffe030', '#ffffff'] }[mv.type] || ['#ffffff', '#c8d8ff'];
      await recoil(B, side);
      shoot(B, a, b, 0.4, (c, x, y) => { c.fillStyle = c1; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill(); c.fillStyle = c2; c.beginPath(); c.arc(x, y, 2.5, 0, TAU); c.fill(); });
      await wait(0.4); impact(B, b, [c2, c1], 14);
    },
  };
  DW.FX = FX;
  DW.playFX = (B, mv, uSide) => {
    const a = B.center(uSide), b = B.center(uSide === 'p' ? 'e' : 'p');
    return (FX[mv.fx] || FX.orb)(B, a, b, uSide, mv);
  };
  // même effet, mais vers un point visé (combat en arène : le tir peut rater si la cible a bougé)
  DW.playFXAt = (B, mv, uSide, a, b) => (FX[mv.fx] || FX.orb)(B, a, b, uSide, mv);
})();
