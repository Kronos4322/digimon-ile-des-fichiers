'use strict';
// =====================================================================
//  RENDU ARTISTIQUE — direction artistique commune à toutes les cartes (façon Sea of Stars / Octopath)
//  - étalonnage des couleurs par ambiance : lumière chaude et dorée, ombres bleutées, teinte propre au lieu
//    (forêt vert-or, village ambré, plage marine, intérieur chaleureux, grotte et donjon froids)
//  - rais de lumière qui traversent les feuillages, poussières qui scintillent dedans
//  - ombres de contact douces sous les arbres et les objets (ils sont posés au sol, pas collés dessus)
//  Tout est pré-dessiné (calques en cache) : quelques drawImage par image, rien de coûteux.
// =====================================================================
(function () {
  const W = DW.W, H = DW.H, TAU = Math.PI * 2;
  const hash = DW.Art.hash;
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ------------------------------------------------------------ ambiances (choisies d'après la carte)
  // light : couleur de la lumière (haut-gauche) ; shade : couleur des ombres (bas-droite) ; k : force de l'étalonnage
  const MOODS = {
    forest:  { light: '#ffd98a', shade: '#1c4a5e', k: 0.34, bloom: '#fff2c0', rays: 1 },
    deep:    { light: '#d8f0a0', shade: '#0e2c3a', k: 0.42, bloom: '#e8ffd0', rays: 1 },
    town:    { light: '#ffcf8a', shade: '#3a3a6a', k: 0.28, bloom: '#fff0d0', rays: 0 },
    beach:   { light: '#fff0c0', shade: '#1a5a8a', k: 0.26, bloom: '#ffffff', rays: 0 },
    snow:    { light: '#fff6e0', shade: '#3a5a9a', k: 0.3, bloom: '#ffffff', rays: 0 },
    volcano: { light: '#ffb060', shade: '#3a0a1a', k: 0.38, bloom: '#ffd0a0', rays: 0 },
    home:    { light: '#ffd8a0', shade: '#3a2440', k: 0.3, bloom: '#fff0d8', rays: 0 },
    cave:    { light: '#a8d8ff', shade: '#120a2a', k: 0.4, bloom: '#c8e8ff', rays: 0 },
  };
  function moodOf(map) {
    if (map.mood && MOODS[map.mood]) return MOODS[map.mood];
    if (map.indoor) return map.dark && map.dark.d > 0.3 ? MOODS.cave : MOODS.home;
    if (map.climate === 'snow') return MOODS.snow;
    if (map.climate === 'volcano') return MOODS.volcano;
    if (map.ambient === 'beach' || map.climate === 'beach') return MOODS.beach;
    if (map.ambient === 'town' || map.ambient === 'village') return MOODS.town;
    if (map.theme === 'deep' || map.theme === 'misty') return MOODS.deep;
    return MOODS.forest;
  }

  // ------------------------------------------------------------ étalonnage (calque « lumière douce » en cache)
  const gradeCache = {};
  function gradeLayer(M) {
    const key = M.light + M.shade;
    if (gradeCache[key]) return gradeCache[key];
    const c = cv(W, H), x = c.getContext('2d');
    // lumière qui vient du haut-gauche, ombre qui tombe vers le bas-droite
    const g = x.createLinearGradient(0, 0, W * 0.75, H * 1.1);
    g.addColorStop(0, M.light); g.addColorStop(0.45, '#808080'); g.addColorStop(1, M.shade);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    return (gradeCache[key] = c);
  }
  // halo doux au-dessus de l'écran (le ciel éclaire la scène), ajouté en « lighter »
  const bloomCache = {};
  function bloomLayer(M) {
    if (bloomCache[M.bloom]) return bloomCache[M.bloom];
    const c = cv(W, H), x = c.getContext('2d');
    const g = x.createRadialGradient(W * 0.18, -H * 0.15, 10, W * 0.18, -H * 0.15, W * 0.95);
    const rgb = DW.Art.hex(M.bloom).join(',');
    g.addColorStop(0, `rgba(${rgb},0.22)`); g.addColorStop(0.5, `rgba(${rgb},0.06)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    return (bloomCache[M.bloom] = c);
  }
  // vignette douce, légèrement teintée par l'ombre de l'ambiance
  const vigCache = {};
  function vignetteLayer(M) {
    if (vigCache[M.shade]) return vigCache[M.shade];
    const c = cv(W, H), x = c.getContext('2d');
    const g = x.createRadialGradient(W / 2, H * 0.52, H * 0.42, W / 2, H * 0.52, W * 0.72);
    const rgb = DW.Art.mix(DW.Art.hex(M.shade), [0, 0, 0], 0.55).map(Math.round).join(',');
    g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},0.42)`);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    return (vigCache[M.shade] = c);
  }

  // ------------------------------------------------------------ rais de lumière (forêt, de jour)
  const rayCache = {};
  function rayLayer(col) {
    if (rayCache[col]) return rayCache[col];
    const c = cv(90, H + 60), x = c.getContext('2d');
    const rgb = DW.Art.hex(col).join(',');
    const g = x.createLinearGradient(0, 0, 0, H + 60);
    g.addColorStop(0, `rgba(${rgb},0.30)`); g.addColorStop(0.55, `rgba(${rgb},0.10)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g;
    x.beginPath(); x.moveTo(52, 0); x.lineTo(90, 0); x.lineTo(38, H + 60); x.lineTo(0, H + 60); x.closePath(); x.fill();
    // bords adoucis : le même faisceau plus étroit par-dessus (cœur plus lumineux)
    x.globalAlpha = 0.6; x.beginPath(); x.moveTo(62, 0); x.lineTo(80, 0); x.lineTo(28, H + 60); x.lineTo(12, H + 60); x.closePath(); x.fill();
    return (rayCache[col] = c);
  }
  function drawRays(c, ow, cam, M, day) {
    if (!M.rays || day <= 0) return;
    const t = ow.t, R = rayLayer(M.bloom);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const span = W + 220, x = ((i * 113 + 40 - cam.cx * 0.35) % span + span) % span - 110;
      c.globalAlpha = day * (0.5 + 0.35 * Math.sin(t * 0.45 + i * 1.7)) * (i % 2 ? 0.7 : 1);
      c.drawImage(R, x, -30);
      // poussières qui flottent dans le faisceau
      for (let k = 0; k < 6; k++) {
        const ph = hash(i, k, 701) * TAU, yy = ((hash(i, k, 702) * (H + 40) - t * (4 + k)) % (H + 40) + H + 40) % (H + 40);
        const xx = x + 45 - yy * 0.32 + Math.sin(t * 0.8 + ph) * 6;
        c.globalAlpha = day * (0.35 + 0.35 * Math.sin(t * 2 + ph));
        c.fillStyle = '#fff6d8'; c.fillRect(Math.round(xx), Math.round(yy), 1, 1);
      }
    }
    c.restore();
  }

  // ------------------------------------------------------------ ombres de contact (dans le monde, sous les objets)
  const aoCache = {};
  function aoSprite(rw) {
    const k = Math.max(4, Math.round(rw / 2) * 2);
    if (aoCache[k]) return aoCache[k];
    const c = cv(k * 2 + 4, Math.round(k * 0.8) + 4), x = c.getContext('2d');
    const g = x.createRadialGradient(k + 2, (k * 0.8 + 4) / 2, 0, k + 2, (k * 0.8 + 4) / 2, k);
    g.addColorStop(0, 'rgba(6,14,18,0.55)'); g.addColorStop(0.6, 'rgba(6,14,18,0.22)'); g.addColorStop(1, 'rgba(6,14,18,0)');
    x.save(); x.translate(0, 0); x.scale(1, 0.4); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height / 0.4); x.restore();
    return (aoCache[k] = c);
  }
  function drawContact(c, objs, x0, x1, y0, y1, indoor) {
    for (const o of objs) {
      if (o.flat || o.x < x0 - 30 || o.x > x1 + 30 || o.y < y0 || o.y > y1 + 40) continue;
      const rw = Math.min(26, (o.spr.w || 16) * (o.big ? 0.42 : 0.36));
      if (rw < 4) continue;
      const S = aoSprite(rw);
      c.globalAlpha = indoor ? 0.7 : 1;
      c.drawImage(S, Math.round(o.x - S.width / 2), Math.round(o.y - S.height / 2 - 1));
    }
    c.globalAlpha = 1;
  }

  // ------------------------------------------------------------ image retournée (gauche ↔ droite), en cache
  const mirrors = new WeakMap();
  function mirror(img) {
    let m = mirrors.get(img);
    if (m) return m;
    m = cv(img.width, img.height); const x = m.getContext('2d');
    x.translate(img.width, 0); x.scale(-1, 1); DW.Art.drawRaw(x, img, 0, 0);
    m._k = img._k; mirrors.set(img, m);
    return m;
  }

  // ------------------------------------------------------------ ombres projetées (bâtiments, arbres, grands objets)
  // La silhouette réelle de l'objet, couchée au sol à l'opposé du soleil : courte à midi (un peu vers la droite,
  // la lumière vient du haut-gauche), longue le matin et le soir. Silhouette floutée une fois, mise en cache.
  const sils = {};
  function silhouette(img, tint = '#0a1a26') {
    const sil = sils[tint] || (sils[tint] = new WeakMap());
    let s = sil.get(img);
    if (s) return s;
    const k = img._k || 1, pad = Math.ceil(3 * k);
    s = cv(img.width + pad * 2, img.height + pad * 2); const x = s.getContext('2d');
    x.filter = `blur(${(1.2 * k).toFixed(1)}px)`;
    DW.Art.drawRaw(x, img, pad, pad); x.filter = 'none';
    x.globalCompositeOperation = 'source-in'; x.fillStyle = tint; x.fillRect(0, 0, s.width, s.height);
    s._k = k; s._pad = pad / k;
    // pied réel du dessin (dernière ligne non transparente) : l'ombre part de là, collée à l'objet
    const d = DW.Art.drawRaw ? (() => { const t = cv(img.width, img.height), tx = t.getContext('2d'); DW.Art.drawRaw(tx, img, 0, 0); return tx.getImageData(0, 0, img.width, img.height).data; })() : null;
    let bot = img.height - 1;
    if (d) { search: for (; bot > 0; bot--) for (let xx = 0; xx < img.width; xx += 2) if (d[(bot * img.width + xx) * 4 + 3] > 100) break search; }
    s._bot = (bot + 1) / k;
    sil.set(img, s);
    return s;
  }
  function cast(ow, c, list, sun) {
    // COURSE DU SOLEIL : lever à l'est (droite), coucher à l'ouest (gauche). Le matin l'ombre part vers la gauche et
    // s'allonge, à midi elle est courte (un peu vers le bas, la lumière vient du sud), le soir elle part vers la droite.
    // Couleur de l'ombre : bleu froid à midi, violet le matin, brun pourpre au couchant.
    const dx = sun.dx, shear = dx * 0.85, sq = 0.22 + Math.abs(dx) * 0.38, a = Math.min(0.45, sun.a * 1.6);
    const tint = dx < -0.4 ? '#241a3c' : dx > 0.4 ? '#2e1428' : '#0a1a2a';
    c.save(); c.globalAlpha = a;
    for (const o of list) {
      if (!o.spr || o.flat || o.spr.h < 34) continue;
      const img = o.sprs ? o.sprs[0].img : o.spr.img, S = silhouette(o.flip ? mirror(img) : img, tint), h = o.spr.h, w = o.spr.w, p = S._pad;
      const X = Math.round(o.x - w / 2), Y = Math.round(o.y - h + 1), hb = S._bot, base = Y + hb;
      // (u, v) de l'image → (X + u + (hb - v)·shear , base + (hb - v)·sq) : la silhouette se couche sur le sol, depuis le pied
      c.save();
      c.transform(1, 0, -shear, -sq, X + hb * shear, base + hb * sq);
      c.drawImage(S, -p, -p);
      c.restore();
    }
    c.restore();
  }

  // ------------------------------------------------------------ passes appelées par Overworld.draw
  DW.Rendu = {
    MOODS, moodOf, mirror, cast,
    // sous les objets : ombres de contact
    contact(ow, c, x0, x1, y0, y1) { if (ow.gfx && ow.gfx.objs) drawContact(c, ow.gfx.objs, x0, x1, y0, y1, ow.map.indoor); },
    // après le décor (écran) : rais de lumière
    scene(ow, c, cam) {
      const M = moodOf(ow.map), L = DW.Time.light(), day = ow.map.indoor ? 0 : Math.max(0, 1 - L.dark * 2.6) * (DW.Time.weather() === 'clear' ? 1 : 0.35);
      drawRays(c, ow, cam, M, day);
    },
    // tout à la fin (après la lumière du jour/nuit) : étalonnage, halo du ciel, vignette
    grade(ow, c) {
      const M = moodOf(ow.map), L = DW.Time.light(), day = Math.max(0, 1 - L.dark * 1.6);
      c.save();
      c.globalCompositeOperation = 'soft-light'; c.globalAlpha = M.k * (0.55 + 0.45 * day);
      c.drawImage(gradeLayer(M), 0, 0);
      if (day > 0.05 && !ow.map.indoor) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = day; c.drawImage(bloomLayer(M), 0, 0); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.drawImage(vignetteLayer(M), 0, 0);
      c.restore();
    },
  };
})();
