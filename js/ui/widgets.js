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
  UI.measure = (c, s, size = 10, bold) => { c.font = UI.font(size, bold); return c.measureText(s).width; };
  UI.wrap = (c, s, maxW, size = 10) => {
    c.font = UI.font(size);
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
