'use strict';
// =====================================================================
//  INTERFACE : textes, panneaux, barres, étiquettes, curseurs
// =====================================================================
(function () {
  const W = DW.W, H = DW.H;
  // ------------------------------------------------------------ UI
  const UI = DW.UI = {};
  UI.font = (size) => `${size}px "DotGothic16", "Trebuchet MS", sans-serif`;
  UI.text = (c, s, x, y, o = {}) => {
    s = DW.Input ? DW.Input.keys(s) : s;   // noms des commandes selon le clavier / la manette (engine/input.js)
    c.font = o.font || UI.font(o.size || 10, o.bold);
    c.textAlign = o.align || 'left';
    c.textBaseline = 'alphabetic';
    if (o.shadow !== false) {
      c.fillStyle = o.shadowColor || 'rgba(0,0,24,0.8)';
      c.fillText(s, x + 0.8, y + 0.8);
    }
    c.fillStyle = o.color || '#fff';
    c.fillText(s, x, y);
  };
  UI.measure = (c, s, size = 10, bold) => { c.font = UI.font(size, bold); return c.measureText(DW.Input ? DW.Input.keys(s) : s).width; };
  // bouton de commande dessiné à l'image de l'appareil (touche, A/B/X/Y, croix/rond/carré/triangle, OK tactile) ; renvoie sa largeur
  UI.btn = (c, action, x, y) => {
    const I = DW.Input, dev = I.device === 'pad' ? I.padKind : I.device;
    if (dev === 'key' || dev === 'touch') {
      const label = I.names()[action] || action, w = UI.measure(c, label, 7) + 8;
      c.fillStyle = '#e8eef6'; c.fillRect(x, y - 8, w, 10); c.fillStyle = '#8a98ac'; c.fillRect(x, y + 1, w, 1.5);
      c.fillStyle = '#1a2030'; c.font = UI.font(7); c.textAlign = 'left'; c.fillText(label, x + 4, y);
      return w;
    }
    const r = 5.5, cx = x + r, cy = y - 3;
    if (dev === 'ps') {
      const col = { ok: '#7aa8f0', back: '#f06a6a', run: '#e88ad0', menu: '#5ad0a0' }[action] || '#c8d0e0';
      c.fillStyle = '#1a1e2a'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.2; c.beginPath();
      if (action === 'ok') { c.moveTo(cx - 2.6, cy - 2.6); c.lineTo(cx + 2.6, cy + 2.6); c.moveTo(cx + 2.6, cy - 2.6); c.lineTo(cx - 2.6, cy + 2.6); c.stroke(); }
      else if (action === 'back') { c.arc(cx, cy, 2.7, 0, 7); c.stroke(); }
      else if (action === 'run') c.strokeRect(cx - 2.4, cy - 2.4, 4.8, 4.8);
      else { c.moveTo(cx, cy - 3); c.lineTo(cx + 3, cy + 2.2); c.lineTo(cx - 3, cy + 2.2); c.closePath(); c.stroke(); }
      return r * 2;
    }
    const N = I.names(), label = N[action] || '?';
    const col = dev === 'nintendo' ? '#3a3a44' : ({ A: '#3ab048', B: '#e04040', X: '#3a7ae8', Y: '#e8b820' }[label] || '#4a4e5a');
    if (label.length > 1) {   // START / +
      const w = UI.measure(c, label, 6) + 8;
      c.fillStyle = '#2a2e3a'; c.fillRect(x, y - 8, w, 10); c.fillStyle = '#e8eef6'; c.font = UI.font(6); c.textAlign = 'left'; c.fillText(label, x + 4, y - 0.5);
      return w;
    }
    c.fillStyle = col; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; c.font = UI.font(8, true); c.textAlign = 'center'; c.fillText(label, cx, cy + 3);
    c.textAlign = 'left';
    return r * 2;
  };
  // largeur du bouton dessiné par UI.btn (sans le dessiner)
  UI.btnW = (c, action) => {
    const I = DW.Input, dev = I.device === 'pad' ? I.padKind : I.device, label = I.names()[action] || action;
    if (dev === 'key' || dev === 'touch') return UI.measure(c, label, 7) + 8;
    if (dev !== 'ps' && label.length > 1) return UI.measure(c, label, 6) + 8;
    return 11;
  };
  // ligne d'aide : [[action, 'texte'], ...] alignée à droite en x (ou à gauche si o.left)
  UI.hints = (c, list, x, y, o = {}) => {
    const GAP = 8, parts = list.map(([a, t]) => ({ a, t, bw: UI.btnW(c, a), tw: UI.measure(c, t, 7) }));
    const total = parts.reduce((s, p) => s + p.bw + 3 + p.tw, 0) + GAP * (parts.length - 1);
    c.save();
    let cx = o.left ? x : x - total;
    for (const p of parts) { UI.btn(c, p.a, cx, y); UI.text(c, p.t, cx + p.bw + 3, y, { size: 7, color: o.color || '#a8d8f0' }); cx += p.bw + 3 + p.tw + GAP; }
    c.restore();
    return total;
  };
  UI.wrap = (c, s, maxW, size = 10) => {
    c.font = UI.font(size);
    if (DW.Input) s = DW.Input.keys(String(s));
    const out = [];
    for (const para of String(s).split('\n')) {
      let line = '';
      for (const w of para.split(' ')) {
        const t = line ? line + ' ' + w : w;
        if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  };
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }
  UI.rr = rr;
  const BOX = {
    blue: ['#3358c8', '#101e66', '#0a0a24', '#e8f0ff'],
    dark: ['#2a2a48', '#0c0c1c', '#000008', '#9aa8d8'],
    light: ['#ffffff', '#cfdaf4', '#1a2048', '#ffffff'],
    orange: ['#f09a30', '#b04a10', '#2a1004', '#ffe8c0'],
    green: ['#3aa860', '#0e4a28', '#02140a', '#d8ffe8'],
    dw: ['#13506a', '#062434', '#01080e', '#62dcf4'],
    dwsel: ['#1f7a96', '#0b3a52', '#01080e', '#c8f6ff'],
  };
  // couleur de l'écusson du héros (Courage orange, Amitié bleu...) : liseré intérieur des fenêtres
  UI.accent = () => (DW.state && DW.state.hero && DW.heroLook ? DW.heroLook().crestCol : null);
  UI.box = (c, x, y, w, h, style = 'dw') => {
    let [a, b, out, inner] = BOX[style] || BOX.blue;
    if (style === 'dw' || style === 'dwsel') inner = UI.accent() || inner;
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, a); g.addColorStop(1, b);
    rr(c, x, y, w, h, 4);
    c.fillStyle = g; c.globalAlpha = style === 'light' ? 1 : style === 'dw' ? 0.9 : 0.95; c.fill(); c.globalAlpha = 1;
    if (style === 'dw' || style === 'dwsel') { c.fillStyle = 'rgba(160,240,255,0.10)'; c.fillRect(x + 3, y + 2.4, w - 6, Math.min(5, h / 4)); }
    c.lineWidth = 1.4; c.strokeStyle = out; c.stroke();
    rr(c, x + 1.6, y + 1.6, w - 3.2, h - 3.2, 3);
    c.lineWidth = 0.8; c.strokeStyle = inner; c.stroke();
  };
  // case de valeur façon Digimon World : fond sombre, liseré cyan
  UI.field = (c, x, y, w, txt, col = '#ffffff', size = 8) => {
    c.fillStyle = 'rgba(0,10,16,0.6)'; c.fillRect(x, y, w, size + 3);
    c.strokeStyle = '#3a8aa0'; c.lineWidth = 0.6; c.strokeRect(x + 0.3, y + 0.3, w - 0.6, size + 2.4);
    const fit = UI.fit(c, String(txt), w - 6, size);
    UI.text(c, fit.s, x + 3, y + size + 0.6, { size: fit.size, color: col });
  };
  // texte qui doit tenir dans une largeur : taille réduite d'un ou deux crans, puis coupure « … »
  UI.fit = (c, s, maxW, size = 8, minSize = size - 2) => {
    for (let z = size; z >= minSize; z--) if (UI.measure(c, s, z) <= maxW) return { s, size: z };
    let t = s;
    while (t.length > 1 && UI.measure(c, t + '…', minSize) > maxW) t = t.slice(0, -1);
    return { s: t.trimEnd() + '…', size: minSize };
  };
  // nom de champ bleu à liseré blanc (NAME, DIGI, AGE... dans Digimon World)
  UI.fieldName = (c, s, x, y, size = 8) => {
    c.font = UI.font(size); c.textAlign = 'left';
    c.fillStyle = '#ffffff'; for (const [dx, dy] of [[-0.7, 0], [0.7, 0], [0, -0.7], [0, 0.7]]) c.fillText(s, x + dx, y + dy);
    c.fillStyle = '#3a6af0'; c.fillText(s, x, y);
  };
  // onglets du haut d'une fenêtre (Status / Tech dans Digimon World) ; renvoie rien
  UI.tabs = (c, names, sel, x = 8, w = 78) => {
    names.forEach((s, k) => {
      const xx = x + k * w, on = k === sel;
      UI.box(c, xx, on ? 3 : 6, w - 4, on ? 20 : 17, on ? 'dwsel' : 'dw');
      UI.text(c, s, xx + (w - 4) / 2, on ? 17 : 18, { size: 10, align: 'center', color: on ? '#ffffff' : '#7ac8dc' });
    });
  };
  // étiquette jaune façon Digimon World (PROFIL, CONDITION...)
  UI.label = (c, s, x, y, col = '#f8d040') => {
    c.font = UI.font(8);
    const w = c.measureText(s).width + 8;
    c.fillStyle = '#1a1006'; c.fillRect(x - 0.6, y - 0.6, w + 1.2, 11.2);
    const g = c.createLinearGradient(0, y, 0, y + 10); g.addColorStop(0, col); g.addColorStop(1, '#c88a10');
    c.fillStyle = g; c.fillRect(x, y, w, 10);
    UI.text(c, s, x + 4, y + 8, { size: 8, color: '#2a1404', shadow: false });
    return w;
  };
  UI.cursor = (c, x, y, t) => {
    const o = Math.round(Math.sin((t || 0) * 10) * 1);
    c.fillStyle = '#0a0a24';
    c.beginPath(); c.moveTo(x - 1 + o, y - 5); c.lineTo(x + 6 + o, y); c.lineTo(x - 1 + o, y + 5); c.closePath(); c.fill();
    c.fillStyle = '#ffd040';
    c.beginPath(); c.moveTo(x + o, y - 3.5); c.lineTo(x + 4.5 + o, y); c.lineTo(x + o, y + 3.5); c.closePath(); c.fill();
  };
  UI.downArrow = (c, x, y, t) => {
    const o = Math.round(Math.sin((t || 0) * 8) * 1.5);
    c.fillStyle = '#ffd040';
    c.beginPath(); c.moveTo(x - 4, y + o); c.lineTo(x + 4, y + o); c.lineTo(x, y + 5 + o); c.closePath(); c.fill();
  };
  UI.hpColor = r => (r > 0.5 ? '#48d858' : r > 0.2 ? '#f8c828' : '#f04838');
  UI.bar = (c, x, y, w, h, ratio, col) => {
    c.fillStyle = '#0a0a20'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
    c.fillStyle = '#3a3a52'; c.fillRect(x, y, w, h);
    const fw = Math.max(0, Math.min(1, ratio)) * w;
    c.fillStyle = col; c.fillRect(x, y, fw, h);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, y, fw, Math.max(1, h / 3));
  };
  UI.tag = (c, label, x, y, col, size = 7) => {
    c.font = UI.font(size, true);
    const w = c.measureText(label).width + 6;
    rr(c, x, y, w, size + 3, 2);
    c.fillStyle = col; c.fill();
    c.lineWidth = 0.7; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.stroke();
    UI.text(c, label, x + 3, y + size + 0.5, { size, bold: true, shadowColor: 'rgba(0,0,0,0.6)' });
    return w;
  };
  UI.typeTag = (c, type, x, y, size = 7) => UI.tag(c, type.toUpperCase(), x, y, (DW.TYPES[type] || { c: '#888' }).c, size);

  // Fond "monde numérique" des menus plein écran
  UI.menuBg = (c, t, title) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04222e'); g.addColorStop(1, '#010a10');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // lignes de données qui défilent
    for (let y = 0; y < H; y += 3) { c.fillStyle = `rgba(60,200,230,${0.03 + 0.03 * Math.sin(y * 0.3 + t * 2)})`; c.fillRect(0, y, W, 1); }
    c.strokeStyle = 'rgba(90,220,240,0.08)'; c.lineWidth = 0.6;
    const o = (t * 6) % 20;
    for (let x = -20 + o; x < W; x += 20) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    if (title) {
      UI.box(c, 6, 4, 130, 18, 'dwsel');
      UI.text(c, title, 14, 17, { size: 10, color: '#ffffff' });
    }
  };
})();
