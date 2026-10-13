'use strict';
// =====================================================================
//  CORE : canvas, utilitaires, timers & tweens, fondu, scènes, boucle principale
// =====================================================================
window.DW = window.DW || {};
(function () {
  const W = 320, H = 240, SCALE = 3;
  DW.W = W; DW.H = H; DW.SCALE = SCALE;
  const canvas = document.getElementById('game');
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  DW.canvas = canvas; DW.ctx = ctx;

  function fit() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
  }
  window.addEventListener('resize', fit); fit();

  // ------------------------------------------------------------ utilitaires
  DW.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  DW.chance = p => Math.random() < p;
  DW.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  DW.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  DW.lerp = (a, b, t) => a + (b - a) * t;
  DW.ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  DW.linear = t => t;
  DW.weighted = list => {
    const tot = list.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * tot;
    for (const e of list) { r -= e.w; if (r < 0) return e; }
    return list[list.length - 1];
  };

  // ------------------------------------------------------------ timers & tweens (globaux)
  const timers = [], tweens = [];
  DW.wait = s => new Promise(r => timers.push({ t: s, r }));
  DW.tween = (obj, props, dur, ease = DW.ease) => new Promise(r => {
    const from = {};
    for (const k in props) from[k] = obj[k];
    tweens.push({ obj, from, props, dur: Math.max(0.0001, dur), t: 0, ease, r });
  });
  function updateTimers(dt) {
    for (let i = timers.length - 1; i >= 0; i--) {
      timers[i].t -= dt;
      if (timers[i].t <= 0) { const r = timers[i].r; timers.splice(i, 1); r(); }
    }
    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i];
      w.t += dt;
      const k = Math.min(1, w.t / w.dur), e = w.ease(k);
      for (const p in w.props) w.obj[p] = w.from[p] + (w.props[p] - w.from[p]) * e;
      if (k >= 1) { tweens.splice(i, 1); w.r(); }
    }
  }

  // ------------------------------------------------------------ fondu
  const Fade = { a: 0, from: 0, to: 0, t: 0, dur: 0, r: null, color: '#000', style: null };
  // style 'digi' : l'écran se décompose en blocs de données (balayage en diagonale, bords verts lumineux)
  DW.fade = (to, dur = 0.35, color, style) => new Promise(r => {
    if (Fade.r) Fade.r();
    Fade.style = style || null;
    if (color) Fade.color = color; else if (to > 0 && Fade.a === 0) Fade.color = '#000';
    Object.assign(Fade, { from: Fade.a, to, t: 0, dur, r });
  });
  function updateFade(dt) {
    if (!Fade.r) return;
    Fade.t += dt;
    const k = Math.min(1, Fade.t / Fade.dur);
    Fade.a = DW.lerp(Fade.from, Fade.to, k);
    if (k >= 1) { const r = Fade.r; Fade.r = null; r(); }
  }

  // ------------------------------------------------------------ scènes
  class Scene {
    constructor() { this.t = 0; this.overlay = false; this._resolve = null; }
    enter() {}
    update(dt) {}   // logique + entrées (seulement la scène du dessus)
    tick(dt) {}     // animations (toutes les scènes de la pile)
    draw(c) {}
    close(result) {
      Game.remove(this);
      if (this._resolve) { const r = this._resolve; this._resolve = null; r(result); }
    }
  }
  DW.Scene = Scene;

  const Game = DW.Game = {
    stack: [],
    push(s) {
      this.stack.push(s);
      const p = new Promise(r => (s._resolve = r));
      s.enter();
      return p;
    },
    remove(s) { const i = this.stack.indexOf(s); if (i >= 0) this.stack.splice(i, 1); },
    replaceAll(s) { this.stack = []; return this.push(s); },
    top() { return this.stack[this.stack.length - 1]; },
  };

  // ------------------------------------------------------------ erreurs
  // Une erreur ne doit jamais figer le jeu : on la note dans la console (une seule fois par message)
  // et on l'affiche quelques secondes en bas de l'écran, puis la boucle continue.
  const seenErr = new Set();
  let errShow = null;
  DW.reportError = (e, where = '') => {
    const text = (e && e.message) || String(e);
    if (!seenErr.has(where + text)) { seenErr.add(where + text); console.error(`[${where || 'jeu'}]`, e); }
    errShow = { text: `Erreur ${where ? '(' + where + ') ' : ''}: ${text}`, t: 6 };
  };
  window.addEventListener('error', e => DW.reportError(e.error || e.message, 'script'));
  window.addEventListener('unhandledrejection', e => DW.reportError(e.reason, 'script'));
  function drawError(dt) {
    if (!errShow) return;
    errShow.t -= dt;
    if (errShow.t <= 0) { errShow = null; return; }
    ctx.font = '7px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(120,0,0,0.85)'; ctx.fillRect(0, H - 12, W, 12);
    ctx.fillStyle = '#fff'; ctx.fillText(errShow.text.slice(0, 90) + ' — voir la console (F12)', 4, H - 4);
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame); // demandé en premier : la boucle survit à une erreur dans une scène
    const dt = Math.min(0.05, (now - last) / 1000) * (DW.timeScale || 1); // timeScale : debug
    last = now;
    if (DW.Input.poll) DW.Input.poll(); // manettes
    const top = Game.top();
    for (const s of Game.stack.slice()) {
      try { s.t += dt; s.tick(dt); } catch (e) { DW.reportError(e, s.constructor.name + '.tick'); }
    }
    if (top) try { top.update(dt); } catch (e) { DW.reportError(e, top.constructor.name + '.update'); }
    updateTimers(dt);
    updateFade(dt);

    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    let start = 0;
    for (let i = Game.stack.length - 1; i >= 0; i--) if (!Game.stack[i].overlay) { start = i; break; }
    for (let i = start; i < Game.stack.length; i++) {
      const s = Game.stack[i];
      ctx.save();
      try { s.draw(ctx); } catch (e) { DW.reportError(e, s.constructor.name + '.draw'); }
      ctx.restore();
    }
    if (Fade.a > 0 && Fade.style === 'digi' && Fade.a < 1) drawDigiFade(ctx, Fade.a);
    else if (Fade.a > 0) {
      ctx.globalAlpha = Fade.a; ctx.fillStyle = Fade.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    }
    drawError(dt);
    DW.Input.clear();
  }
  function drawDigiFade(c, a) {
    const B = 10, cols = W / B, rows = H / B;
    c.font = 'bold 7px monospace'; c.textAlign = 'center';
    for (let by = 0; by < rows; by++) for (let bx = 0; bx < cols; bx++) {
      const h = ((bx * 73 + by * 151) % 97) / 97, thr = ((bx + by) / (cols + rows)) * 0.7 + h * 0.3;
      const k = Math.max(0, Math.min(1, (a * 1.35 - thr) / 0.35));
      if (k <= 0) continue;
      const x = bx * B, y = by * B;
      if (k >= 1) { c.fillStyle = '#000'; c.fillRect(x, y, B, B); continue; }
      const sz = Math.ceil(B * k);
      c.fillStyle = '#04140c'; c.fillRect(x + (B - sz) / 2, y + (B - sz) / 2, sz, sz);
      c.fillStyle = `rgba(90,255,170,${0.9 * (1 - k)})`; c.fillRect(x + (B - sz) / 2, y + (B - sz) / 2, sz, 1); c.fillRect(x + (B - sz) / 2, y + (B - sz) / 2, 1, sz);
      if (h < 0.35) { c.fillStyle = `rgba(160,255,200,${1 - k})`; c.fillText(h < 0.17 ? '1' : '0', x + B / 2, y + B - 2); }
    }
    c.textAlign = 'left';
  }
  DW.start = () => requestAnimationFrame(t => { last = t; frame(t); });
})();
