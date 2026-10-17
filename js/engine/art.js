'use strict';
// =====================================================================
//  MOTEUR DE RENDU "PRÉ-RENDU 3D" EN PIXEL ART
//  Chaque forme dessinée est un volume : on calcule un relief à partir
//  de la distance au bord, on en déduit des normales, puis un éclairage
//  en bandes (cel-shading), des contours internes et des ombres portées.
// =====================================================================
(function () {
  const Art = DW.Art = {};

  // ------------------------------------------------------------ couleurs
  const hexCache = {};
  const hex = h => {
    if (hexCache[h]) return hexCache[h];
    let s = h.replace('#', '');
    if (s.length === 3) s = s.split('').map(c => c + c).join('');
    const n = parseInt(s, 16);
    return (hexCache[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  Art.hex = hex; Art.mix = mix;
  const rampCache = {};
  // 5 tons : ombre profonde, ombre, base, lumière, reflet (avec décalage de teinte)
  Art.ramp = col => {
    if (rampCache[col]) return rampCache[col];
    const c = hex(col);
    const r = {
      b: [mix(c, [40, 22, 78], 0.55), mix(c, [70, 50, 120], 0.3), c, mix(c, [255, 248, 216], 0.36), mix(c, [255, 255, 255], 0.78)],
      inner: mix(c, [24, 10, 40], 0.66),
      out: mix(c, [14, 6, 24], 0.82),
    };
    return (rampCache[col] = r);
  };

  // ------------------------------------------------------------ bruit
  Art.hash = (x, y, s = 0) => {
    let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  };
  const sm = t => t * t * (3 - 2 * t);
  Art.noise = (x, y, s = 0) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = sm(x - ix), fy = sm(y - iy), h = Art.hash;
    const a = h(ix, iy, s), b = h(ix + 1, iy, s), c = h(ix, iy + 1, s), d = h(ix + 1, iy + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  Art.fbm = (x, y, s = 0) => Art.noise(x, y, s) * 0.55 + Art.noise(x * 2.1, y * 2.1, s + 7) * 0.3 + Art.noise(x * 4.3, y * 4.3, s + 13) * 0.15;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - 0.5);
  Art.bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

  Art.canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ------------------------------------------------------------ kit de formes (enregistrées, rendues plus tard)
  class Kit {
    constructor() {
      this.shapes = []; this._deco = false;
      this.deco = {};
      for (const m of ['ell', 'circ', 'rect', 'poly', 'blob', 'line', 'curve', 'tube']) {
        this.deco[m] = (...a) => { this._deco = true; this[m](...a); this._deco = false; };
      }
    }
    add(type, args, col, o = {}) { this.shapes.push({ type, args, col, o, deco: this._deco || !!o.deco }); }
    ell(x, y, rx, ry, col, rot = 0, o) { this.add('ell', [x, y, rx, ry, rot], col, o); }
    circ(x, y, r, col, o) { this.add('ell', [x, y, r, r, 0], col, o); }
    rect(x, y, w, h, col, o) { this.add('rect', [x, y, w, h], col, o); }
    poly(pts, col, o) { this.add('poly', [pts], col, o); }
    blob(pts, col, o) { this.add('blob', [pts], col, o); }
    line(x1, y1, x2, y2, w, col, o) { this.add('curve', [[[x1, y1], [x2, y2]], w], col, o); }
    curve(pts, w, col, o) { this.add('curve', [pts, w], col, o); }
    tube(pts, w0, w1, col, o) { this.add('tube', [pts, w0, w1], col, o); }
    // œil standard : contour, blanc, iris, pupille, reflet
    eye(x, y, rx, ry, iris = '#202020', o = {}) {
      const look = o.look || 0.3;
      this.deco.ell(x, y, rx + 0.9, ry + 0.9, '#1a0e22', o.rot || 0, { unlit: true });
      this.deco.ell(x, y, rx, ry, o.white || '#ffffff', o.rot || 0);
      this.deco.ell(x + rx * look, y + ry * 0.1, rx * 0.62, ry * 0.74, iris);
      this.deco.ell(x + rx * (look + 0.1), y + ry * 0.14, rx * 0.3, ry * 0.4, '#0a0610', 0, { unlit: true });
      this.deco.ell(x + rx * (look + 0.18), y - ry * 0.3, Math.max(rx * 0.24, 0.8), Math.max(ry * 0.2, 0.8), '#ffffff', 0, { unlit: true });
    }
  }
  Art.Kit = Kit;

  // boîte englobante d'une forme (repère de dessin), marge comprise
  function bounds(s) {
    const a = s.args;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const add = (x, y, r = 0) => { if (x - r < x0) x0 = x - r; if (y - r < y0) y0 = y - r; if (x + r > x1) x1 = x + r; if (y + r > y1) y1 = y + r; };
    switch (s.type) {
      case 'ell': { const r = Math.max(a[2], a[3]); add(a[0], a[1], r); break; }
      case 'rect': add(a[0], a[1]); add(a[0] + a[2], a[1] + a[3]); break;
      case 'poly': case 'blob': for (const p of a[0]) add(p[0], p[1]); break;
      case 'curve': for (const p of a[0]) add(p[0], p[1], a[1] / 2); break;
      case 'tube': { const r = Math.max(a[1], a[2]) / 2; for (const p of a[0]) add(p[0], p[1], r); break; }
    }
    return [x0 - 2, y0 - 2, x1 + 2, y1 + 2];
  }
  function trace(c, s) {
    const a = s.args;
    c.beginPath();
    switch (s.type) {
      case 'ell': c.ellipse(a[0], a[1], Math.max(0.1, a[2]), Math.max(0.1, a[3]), a[4], 0, Math.PI * 2); c.fill(); break;
      case 'rect': c.fillRect(a[0], a[1], a[2], a[3]); break;
      case 'poly': a[0].forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); break;
      case 'blob': {
        const p = a[0], n = p.length, mid = (i, j) => [(p[i][0] + p[j][0]) / 2, (p[i][1] + p[j][1]) / 2];
        const m0 = mid(0, 1);
        c.moveTo(m0[0], m0[1]);
        for (let i = 1; i <= n; i++) { const q = p[i % n], m = mid(i % n, (i + 1) % n); c.quadraticCurveTo(q[0], q[1], m[0], m[1]); }
        c.closePath(); c.fill(); break;
      }
      case 'curve':
        c.lineWidth = a[1]; c.lineCap = 'round'; c.lineJoin = 'round';
        a[0].forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
        c.stroke(); break;
      case 'tube': {
        const p = a[0], w0 = a[1], w1 = a[2], n = p.length;
        const L = [], R = [];
        for (let i = 0; i < n; i++) {
          const pa = p[Math.max(0, i - 1)], pb = p[Math.min(n - 1, i + 1)];
          let dx = pb[0] - pa[0], dy = pb[1] - pa[1];
          const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
          const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
          L.push([p[i][0] - dy * w, p[i][1] + dx * w]); R.push([p[i][0] + dy * w, p[i][1] - dx * w]);
        }
        [...L, ...R.reverse()].forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
        c.closePath(); c.fill();
        c.beginPath(); c.arc(p[0][0], p[0][1], w0 / 2, 0, Math.PI * 2); c.fill();
        if (w1 > 0.6) { c.beginPath(); c.arc(p[n - 1][0], p[n - 1][1], w1 / 2, 0, Math.PI * 2); c.fill(); }
        break;
      }
    }
  }

  // ------------------------------------------------------------ rendu
  // draw(kit) ; W×H pixels ; o.box = [bw,bh] repère des coordonnées ; o.squash = facteur respiration
  const L = (() => { const v = [-0.55, -0.8, 0.95], l = Math.hypot(...v); return v.map(x => x / l); })();
  const renderRaw = (draw, W, H, o = {}) => {
    const k = new Kit();
    draw(k, o.param);
    const shapes = k.shapes;
    const bw = o.box ? o.box[0] : W, bh = o.box ? o.box[1] : H;
    const cv = Art.canvas(W, H), c = cv.getContext('2d', { willReadFrequently: true });
    const N = W * H;
    const id = new Int16Array(N).fill(-1), dec = new Int16Array(N).fill(-1);
    let prev = null;
    shapes.forEach((s, si) => {
      c.setTransform(1, 0, 0, 1, 0, 0);
      if (prev) c.clearRect(prev[0], prev[1], prev[2], prev[3]);
      c.setTransform(W / bw, 0, 0, H / bh, 0, 0);
      if (o.shear) { // inclinaison (pose d'attaque / de recul) autour du sol
        const g = o.ground != null ? o.ground : bh - 2;
        c.translate(0, g); c.transform(1, 0, -o.shear, 1, 0, 0); c.translate(0, -g);
      }
      if (o.squash) {
        const g = o.ground != null ? o.ground : bh - 2, cx = bw / 2;
        c.translate(cx, g); c.scale(1 / Math.sqrt(o.squash), o.squash); c.translate(-cx, -g);
      }
      // zone réellement touchée par la forme (après transformations), en pixels
      const m = c.getTransform(), [bx0, by0, bx1, by1] = bounds(s);
      let X0 = W, Y0 = H, X1 = 0, Y1 = 0;
      for (const [px, py] of [[bx0, by0], [bx1, by0], [bx0, by1], [bx1, by1]]) {
        const tx = m.a * px + m.c * py + m.e, ty = m.b * px + m.d * py + m.f;
        if (tx < X0) X0 = tx; if (ty < Y0) Y0 = ty; if (tx > X1) X1 = tx; if (ty > Y1) Y1 = ty;
      }
      X0 = Math.max(0, Math.floor(X0)); Y0 = Math.max(0, Math.floor(Y0)); X1 = Math.min(W, Math.ceil(X1)); Y1 = Math.min(H, Math.ceil(Y1));
      const bwp = X1 - X0, bhp = Y1 - Y0;
      if (bwp <= 0 || bhp <= 0) { prev = null; return; }
      c.fillStyle = '#000'; c.strokeStyle = '#000';
      trace(c, s);
      prev = [X0, Y0, bwp, bhp];
      const a = c.getImageData(X0, Y0, bwp, bhp).data;
      const thr = s.o.thr || 110;
      for (let yy = 0; yy < bhp; yy++) for (let xx = 0; xx < bwp; xx++) {
        if (a[(yy * bwp + xx) * 4 + 3] < thr) continue;
        const i = (Y0 + yy) * W + X0 + xx;
        if (!s.deco) { id[i] = si; dec[i] = -1; }
        else if (id[i] >= 0) dec[i] = si;
      }
    });
    // distance au bord (chanfrein), par partie ; une partie située devant n'est pas un bord
    // (boucles à plat, sans allocation par pixel : c'est le cœur du rendu)
    const d = new Float32Array(N).fill(1e9);
    const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, p = id[i];
      if (p < 0) continue;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) { d[i] = 1; continue; }
      let q;
      if ((q = id[i - W - 1]) < p || (q = id[i - W]) < p || (q = id[i - W + 1]) < p || (q = id[i - 1]) < p ||
          (q = id[i + 1]) < p || (q = id[i + W - 1]) < p || (q = id[i + W]) < p || (q = id[i + W + 1]) < p) d[i] = 1;
    }
    const SQ2 = 1.414;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, p = id[i];
      if (p < 0) continue;
      let v = d[i];
      if (x > 0 && id[i - 1] === p && d[i - 1] + 1 < v) v = d[i - 1] + 1;
      if (y > 0) {
        const u = i - W;
        if (x > 0 && id[u - 1] === p && d[u - 1] + SQ2 < v) v = d[u - 1] + SQ2;
        if (id[u] === p && d[u] + 1 < v) v = d[u] + 1;
        if (x < W - 1 && id[u + 1] === p && d[u + 1] + SQ2 < v) v = d[u + 1] + SQ2;
      }
      d[i] = v;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x, p = id[i];
      if (p < 0) continue;
      let v = d[i];
      if (x < W - 1 && id[i + 1] === p && d[i + 1] + 1 < v) v = d[i + 1] + 1;
      if (y < H - 1) {
        const u = i + W;
        if (x < W - 1 && id[u + 1] === p && d[u + 1] + SQ2 < v) v = d[u + 1] + SQ2;
        if (id[u] === p && d[u] + 1 < v) v = d[u] + 1;
        if (x > 0 && id[u - 1] === p && d[u - 1] + SQ2 < v) v = d[u - 1] + SQ2;
      }
      d[i] = v;
    }
    const maxD = new Float32Array(shapes.length);
    for (let i = 0; i < N; i++) if (id[i] >= 0 && d[i] < 1e8 && d[i] > maxD[id[i]]) maxD[id[i]] = d[i];
    const Hh = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const p = id[i];
      if (p < 0) continue;
      const so = shapes[p].o;
      if (so.flat) { Hh[i] = 0; continue; }
      const R = Math.max(1.5, maxD[p] * (so.round || 1));
      const t = Math.min((d[i] > 1e8 ? R : d[i]) / R, 1);
      Hh[i] = R * Math.sqrt(1 - (1 - t) * (1 - t));
    }
    // éclairage
    const out = Art.canvas(W + 2, H + 2), ox = out.getContext('2d');
    const od = ox.createImageData(W + 2, H + 2), D = od.data;
    const light = o.light || L, L0 = light[0], L1 = light[1], L2 = light[2];
    const dither = o.dither != null ? o.dither : 0.09;
    // propriétés de chaque forme, lues une fois
    const noline = shapes.map(s => !!s.o.noline);
    // hauteur vue depuis le pixel i (forme p) vers le voisin n ; hors image ou forme derrière = 0
    const hAt = (i, p, n, ok) => {
      if (!ok) return 0;
      const q = id[n];
      if (q < 0 || q < p) return 0;
      return q > p ? Hh[i] : Hh[n];
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, p = id[i];
      if (p < 0) continue;
      const s = shapes[p], ds = dec[i] >= 0 ? shapes[dec[i]] : null, src = ds || s, so = src.o;
      let nx = hAt(i, p, i - 1, x > 0) - hAt(i, p, i + 1, x < W - 1), ny = hAt(i, p, i - W, y > 0) - hAt(i, p, i + W, y < H - 1), nz = 2;
      const l = Math.sqrt(nx * nx + ny * ny + nz * nz); nx /= l; ny /= l; nz /= l;
      let v = nx * L0 + ny * L1 + nz * L2;
      v = (v - 0.45) * 1.6;
      if (so.tex) v += (Art.hash(x >> (so.texSize || 0), y >> (so.texSize || 0), 3) - 0.5) * so.tex;
      const bay = BAYER[(y & 3) * 4 + (x & 3)];
      v += bay * dither;
      let band = v < -0.62 ? 0 : v < -0.12 ? 1 : v < 0.5 ? 2 : 3;
      if ((so.shiny || s.o.shiny) && v > 0.82) band = 4;
      if (s.o.far) band = Math.max(0, band - 1);
      // ombre portée par une forme située devant (en haut à gauche)
      if (!s.o.noshadow) {
        let q;
        if ((x >= 1 && y >= 1 && (q = id[i - W - 1]) > p && !noline[q]) ||
            (x >= 2 && y >= 2 && (q = id[i - 2 * W - 2]) > p && !noline[q]) ||
            (x >= 1 && y >= 2 && (q = id[i - 2 * W - 1]) > p && !noline[q]) ||
            (x >= 2 && y >= 3 && (q = id[i - 3 * W - 2]) > p && !noline[q])) band = Math.max(0, band - 1);
      }
      let col;
      if (so.unlit) col = hex(src.col);
      else col = Art.ramp(src.col).b[so.soft ? Math.max(1, Math.min(3, band)) : band];
      // liseré lumineux (contre-jour) sur le bord dans l'ombre : donne du relief
      if (o.rim && !so.unlit && band <= 1 && ((x + 1 < W && id[i + 1] < 0) || (y + 1 < H && id[i + W] < 0)) && bay > -0.3) {
        col = Art.mix(Art.ramp(src.col).b[2], [170, 205, 255], 0.38);
      }
      if (!s.o.noline && !ds) {
        let q;
        if ((x + 1 < W && (q = id[i + 1]) >= 0 && q < p) || (x > 0 && (q = id[i - 1]) >= 0 && q < p) ||
            (y + 1 < H && (q = id[i + W]) >= 0 && q < p) || (y > 0 && (q = id[i - W]) >= 0 && q < p)) col = Art.ramp(s.col).inner;
      }
      const j = ((y + 1) * (W + 2) + (x + 1)) * 4;
      D[j] = col[0]; D[j + 1] = col[1]; D[j + 2] = col[2]; D[j + 3] = 255;
    }
    // contour extérieur
    if (!o.noOutline) {
      for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) {
        if (inb(x, y) && id[y * W + x] >= 0) continue;
        let src = -1, lit = false;
        for (const [ax, ay] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
          const qx = x + ax, qy = y + ay;
          if (inb(qx, qy) && id[qy * W + qx] >= 0) { src = id[qy * W + qx]; lit = ax === 1 || ay === 1; break; }
        }
        if (src < 0) continue;
        // contour sélectif : coloré côté lumière (haut/gauche), sombre côté ombre
        const rp = Art.ramp(shapes[src].col);
        const col = shapes[src].o.outline ? hex(shapes[src].o.outline) : (o.selout && lit ? Art.mix(rp.b[0], rp.out, 0.45) : rp.out);
        const j = ((y + 1) * (W + 2) + (x + 1)) * 4;
        D[j] = col[0]; D[j + 1] = col[1]; D[j + 2] = col[2]; D[j + 3] = 255;
      }
    }
    ox.putImageData(od, 0, 0);
    const R = { img: out, w: W + 2, h: H + 2, data: od };
    if (o.silhouettes !== false) {
      R.white = Art.tint(out, '#ffffff');
      R.black = Art.tint(out, '#10142a');
    }
    return R;
  };
  // HAUTE DÉFINITION : chaque dessin est calculé Art.HD fois plus fin (le canvas du jeu fait 960 × 720 pour un
  // écran logique de 320 × 240). L'image garde sa taille logique (R.w, R.h) : son facteur est noté img._k,
  // et drawImage (ci-dessous) la place toujours à sa taille logique, quel que soit l'appel.
  Art.HD = 2;
  Art.render = (draw, W, H, o = {}) => {
    const k = o.hd != null ? o.hd : Art.HD;
    if (!(k > 1)) return renderRaw(draw, W, H, o);
    const R = renderRaw(draw, Math.round(W * k), Math.round(H * k), { ...o, box: o.box || [W, H] });
    for (const im of [R.img, R.white, R.black]) if (im) im._k = k;
    R.w = R.img.width / k; R.h = R.img.height / k; R.k = k;
    return R;
  };
  Art.tint = (img, col) => {
    const c = Art.canvas(img.width, img.height), x = c.getContext('2d');
    HD_DRAW.call(x, img, 0, 0);   // (copie pixel pour pixel, haute définition comprise)
    x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    c._k = img._k;
    return c;
  };
  // drawImage d'une image haute définition : (img, x, y) → taille logique ; (img, sx, sy, sw, sh, ...) → découpe en coordonnées logiques
  const C2D = typeof CanvasRenderingContext2D !== 'undefined' ? CanvasRenderingContext2D : null;   // (absent sous Node : tests)
  const HD_DRAW = C2D ? C2D.prototype.drawImage : function () {};
  if (C2D) C2D.prototype.drawImage = function (img, a, b, c, d, e, f, g, h) {
    const k = img && img._k;
    if (!k || k === 1) return HD_DRAW.apply(this, arguments);
    if (arguments.length === 3) return HD_DRAW.call(this, img, a, b, img.width / k, img.height / k);
    if (arguments.length === 5) return HD_DRAW.call(this, img, a, b, c, d);
    return HD_DRAW.call(this, img, a * k, b * k, c * k, d * k, e, f, g, h);
  };
  Art.drawRaw = (ctx, ...args) => HD_DRAW.apply(ctx, args);
})();
