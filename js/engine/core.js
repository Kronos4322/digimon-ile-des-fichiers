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
  const Fade = { a: 0, from: 0, to: 0, t: 0, dur: 0, r: null, color: '#000' };
  DW.fade = (to, dur = 0.35, color) => new Promise(r => {
    if (Fade.r) Fade.r();
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

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * (DW.timeScale || 1); // timeScale : debug
    last = now;
    const top = Game.top();
    for (const s of Game.stack.slice()) { s.t += dt; s.tick(dt); }
    if (top) top.update(dt);
    updateTimers(dt);
    updateFade(dt);

    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    let start = 0;
    for (let i = Game.stack.length - 1; i >= 0; i--) if (!Game.stack[i].overlay) { start = i; break; }
    for (let i = start; i < Game.stack.length; i++) Game.stack[i].draw(ctx);
    if (Fade.a > 0) {
      ctx.globalAlpha = Fade.a; ctx.fillStyle = Fade.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    }
    DW.Input.clear();
    requestAnimationFrame(frame);
  }
  DW.start = () => requestAnimationFrame(t => { last = t; frame(t); });
})();
