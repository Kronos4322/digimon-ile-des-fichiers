'use strict';
// =====================================================================
//  GYMNASE (comme dans Digimon World 3) — ouvre au Terrain d'entraînement après le chapitre 1
//  Leomon, le coach, y fait travailler les RÉSISTANCES aux éléments : chaque appareil endurcit le Digimon
//  contre un élément (les dégâts de cet élément baissent : jusqu'à -40 % à 100 points, game/battle.js),
//  avec un effet secondaire comme dans DW3 : le Mur de flammes donne des PM, le Bombardement des PV,
//  les autres font un peu baisser une statistique. Deux appareils n'ouvrent que plus tard dans l'aventure.
//  Une séance : 3 essais à la jauge (comme au Terrain), 120 Bits, 1 h 30, fatigue +25.
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const FEE = 120, MINUTES = 90, TIRE = 25, CAP = 100;
  const NAME = { hp: 'PV max', mp: 'PM max', atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intelligence' };
  // appareils : élément travaillé, effet secondaire (stat, sens), chapitre d'ouverture
  const GYM = [
    { id: 'feu', name: 'Mur de flammes', type: 'Feu', side: ['mp', 1], ch: 2, fx: ['#ff6a1a', '#ffd040'] },
    { id: 'eau', name: 'Cascade glacée', type: 'Eau', side: ['int', -1], ch: 2, fx: ['#4aa8ff', '#e0f4ff'] },
    { id: 'glace', name: 'Chambre froide', type: 'Glace', side: ['spd', -1], ch: 2, fx: ['#98ecff', '#ffffff'] },
    { id: 'air', name: 'Soufflerie', type: 'Air', side: ['atk', -1], ch: 2, fx: ['#b8c8ff', '#ffffff'] },
    { id: 'elec', name: 'Paratonnerre', type: 'Électrique', side: ['def', -1], ch: 2, fx: ['#ffe030', '#ffffff'] },
    { id: 'terre', name: 'Bombardement de rochers', type: 'Terre', side: ['hp', 1], ch: 3, fx: ['#9a6a38', '#d8a860'] },
    { id: 'tenebres', name: 'Chambre noire', type: 'Ténèbres', side: ['int', -1], ch: 4, fx: ['#6a3a8a', '#c890f0'] },
  ];
  const Gym = DW.Gymnase = {
    GYM, CAP,
    open: () => (st().flags.chapter || 1) >= 2,
    unlocked: g => (st().flags.chapter || 1) >= g.ch,
    // part des dégâts d'un élément qui est encaissée (0 à 0,4)
    resist: (m, type) => Math.min(0.4, ((m && m.res && m.res[type]) || 0) / 250),
    // modifie une statistique affichée de n points (stockée dans m.raw, comme l'entraînement « Statistique »)
    addStat(m, k, n) {
      const S = DW.SCALE, unit = 0.8 * (k === 'hp' ? S.hp : k === 'mp' ? S.mp : S.stat);
      m.raw = m.raw || {};
      const before = m.stat(k);
      m.raw[k] = Math.max(-15, (m.raw[k] || 0) + n / unit);
      return m.stat(k) - before;
    },
  };

  // ------------------------------------------------------------ icônes des appareils (liste) : flamme, goutte, flocon, tourbillon, éclair, rocher, œil
  function icon(c, id, x, y, on) {
    c.save(); c.translate(x, y);
    if (!on) { c.fillStyle = '#3a4a5a'; c.fillRect(-5, -5, 10, 10); c.fillStyle = '#5a6a7a'; c.font = DW.UI.font(8, true); c.textAlign = 'center'; c.fillText('?', 0, 3); c.restore(); return; }
    const P = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); c.fill(); };
    if (id === 'feu') { P([[0, -6], [4, -1], [3, 4], [-3, 4], [-4, -1]], '#ff6a1a'); P([[0, -2], [2, 1], [1, 4], [-1, 4], [-2, 1]], '#ffe040'); }
    else if (id === 'eau') { P([[0, -6], [4, 1], [2.5, 4.5], [-2.5, 4.5], [-4, 1]], '#3a8ae8'); c.fillStyle = '#c8ecff'; c.fillRect(-2, 0, 1.5, 2.5); }
    else if (id === 'glace') { c.strokeStyle = '#a8f0ff'; c.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; c.beginPath(); c.moveTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5); c.lineTo(-Math.cos(a) * 5.5, -Math.sin(a) * 5.5); c.stroke(); } c.fillStyle = '#ffffff'; c.fillRect(-1, -1, 2, 2); }
    else if (id === 'air') { c.strokeStyle = '#c8d8ff'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, 4.5, 0.3, 5.2); c.stroke(); c.beginPath(); c.arc(0.5, 0, 2, 0.8, 5.6); c.stroke(); }
    else if (id === 'elec') P([[1, -6], [-3, 1], [0, 1], [-1, 6], [3, -1], [0, -1]], '#ffe030');
    else if (id === 'terre') { P([[-5, 3], [-4, -2], [-1, -4], [3, -3], [5, 1], [3, 4], [-2, 5]], '#9a6a38'); c.fillStyle = '#c8945a'; c.fillRect(-2, -2, 3, 2); }
    else { c.fillStyle = '#c890f0'; c.beginPath(); c.ellipse(0, 0, 5.5, 3.2, 0, 0, 7); c.fill(); c.fillStyle = '#1a0a24'; c.beginPath(); c.arc(0, 0, 2, 0, 7); c.fill(); }
    c.restore();
  }
  // la salle d'entraînement : sol de dalles métalliques, l'appareil de l'élément en action sur le Digimon
  function drawRoom(c, g, t, x0, y0, w, h, hitT, res) {
    const cx = x0 + w / 2, fy = y0 + h - 8;
    // murs et sol (façon DW3 : salle grise, panneaux bleus)
    c.fillStyle = '#2a3442'; c.fillRect(x0, y0, w, h);
    for (let x = x0; x < x0 + w; x += 16) { c.fillStyle = '#34405a'; c.fillRect(x + 2, y0 + 3, 12, 18); c.fillStyle = '#4a6a9a'; c.fillRect(x + 4, y0 + 6, 8, 2); }
    c.fillStyle = '#3e4652'; c.fillRect(x0, y0 + 24, w, h - 24);
    for (let x = x0 - ((t * 0) % 12); x < x0 + w; x += 12) for (let y = y0 + 26; y < y0 + h; y += 7) { c.fillStyle = ((x + y) / 6 | 0) % 2 ? '#48505e' : '#424a58'; c.fillRect(x, y, 11, 6); }
    const k = hitT > 0 ? 1 : 0.55, [A, B] = g.fx, R = n => DW.Art.hash(Math.floor(t * 20), n, 7);
    c.save();
    if (g.id === 'feu') {   // deux lance-flammes tirent sur le Digimon
      for (const sx of [x0 + 10, x0 + w - 10]) { c.fillStyle = '#5a5e6a'; c.fillRect(sx - 5, fy - 22, 10, 22); c.fillStyle = '#8a3a2a'; c.fillRect(sx - 3, fy - 26, 6, 5);
        for (let i = 0; i < 10 * k; i++) { const u = (t * 2.4 + i / 10) % 1, dx = (cx - sx) * u * 0.8; c.fillStyle = i % 2 ? A : B; c.globalAlpha = 1 - u * 0.6; c.beginPath(); c.arc(sx + dx, fy - 24 + Math.sin(u * 9 + i) * 3, 2.5 + u * 3, 0, 7); c.fill(); } c.globalAlpha = 1; }
    } else if (g.id === 'eau') {   // une cascade tombe du plafond
      c.fillStyle = 'rgba(74,168,255,0.35)'; c.fillRect(cx - 18, y0, 36, fy - y0);
      for (let i = 0; i < 18 * k; i++) { const u = (t * 1.6 + i / 18) % 1; c.fillStyle = i % 3 ? A : B; c.fillRect(cx - 16 + R(i) * 32, y0 + u * (fy - y0), 2, 6); }
      c.fillStyle = 'rgba(224,244,255,0.6)'; c.beginPath(); c.ellipse(cx, fy, 26, 4, 0, 0, 7); c.fill();
    } else if (g.id === 'glace') {   // chambre froide : givre aux murs, flocons, souffle glacé
      c.fillStyle = 'rgba(200,240,255,0.18)'; c.fillRect(x0, y0, w, h);
      for (let i = 0; i < 26 * k; i++) { const u = (t * 0.5 + i / 26) % 1; c.fillStyle = '#ffffff'; c.fillRect(x0 + R(i + 40) * w, y0 + u * h, 1.5, 1.5); }
      for (const sx of [x0 + 4, x0 + w - 12]) { c.fillStyle = '#a8e8ff'; c.beginPath(); c.moveTo(sx, y0 + 24); c.lineTo(sx + 8, y0 + 24); c.lineTo(sx + 4, y0 + 34); c.fill(); }
    } else if (g.id === 'air') {   // une grande soufflerie
      const fx = x0 + 14, fy2 = fy - 20; c.fillStyle = '#5a5e6a'; c.beginPath(); c.arc(fx, fy2, 13, 0, 7); c.fill(); c.fillStyle = '#2a2e38'; c.beginPath(); c.arc(fx, fy2, 10, 0, 7); c.fill();
      c.save(); c.translate(fx, fy2); c.rotate(t * 18); c.fillStyle = '#c8ccd8'; for (let b = 0; b < 3; b++) { c.rotate(Math.PI * 2 / 3); c.fillRect(-1.5, -9, 3, 9); } c.restore();
      c.strokeStyle = '#e0e8ff'; c.lineWidth = 1; for (let i = 0; i < 9 * k; i++) { const u = (t * 2 + i / 9) % 1, yy = fy2 - 10 + R(i + 9) * 20; c.globalAlpha = 1 - u; c.beginPath(); c.moveTo(fx + 14 + u * (w - 30), yy); c.lineTo(fx + 26 + u * (w - 30), yy); c.stroke(); } c.globalAlpha = 1;
    } else if (g.id === 'elec') {   // le paratonnerre : éclairs qui tombent sur le Digimon
      c.fillStyle = '#7a7e8a'; c.fillRect(cx - 1, y0, 2, 14); c.fillStyle = '#ffe030'; c.beginPath(); c.arc(cx, y0 + 15, 3, 0, 7); c.fill();
      if (hitT > 0 || (t * 3) % 1 < 0.25) { c.strokeStyle = (t * 10 | 0) % 2 ? A : B; c.lineWidth = 1.6; c.beginPath(); let yy = y0 + 18, xx = cx; c.moveTo(xx, yy); while (yy < fy - 26) { yy += 6; xx = cx + (R(yy) - 0.5) * 10; c.lineTo(xx, yy); } c.stroke(); }
    } else if (g.id === 'terre') {   // bombardement de rochers
      for (let i = 0; i < 5 * k; i++) { const u = (t * 1.2 + i / 5) % 1; c.fillStyle = i % 2 ? A : B; c.beginPath(); c.arc(cx - 20 + R(i + 77) * 40, y0 + u * (fy - y0 - 20), 3.5, 0, 7); c.fill(); }
    } else {   // chambre noire : l'obscurité, des yeux qui brillent
      c.fillStyle = 'rgba(10,0,20,0.6)'; c.fillRect(x0, y0, w, h);
      for (let i = 0; i < 4; i++) { const ex = x0 + 12 + i * (w - 24) / 3, ey = y0 + 16 + (i % 2) * 8, o = (Math.sin(t * 2 + i * 2) + 1) / 2; c.fillStyle = `rgba(200,140,255,${o})`; c.fillRect(ex - 3, ey, 2, 1.5); c.fillRect(ex + 1, ey, 2, 1.5); }
    }
    c.restore();
    // l'éclat du coup encaissé
    if (hitT > 0) { c.fillStyle = `rgba(255,255,255,${hitT * 0.5})`; c.fillRect(x0, y0, w, h); }
    // badge de la résistance actuelle
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x0 + w - 44, y0 + h - 12, 42, 10);
    DW.UI.text(c, `${g.type.slice(0, 4).toUpperCase()} ${res}`, x0 + w - 4, y0 + h - 4, { size: 7, align: 'right', color: '#ffffff' });
  }

  // ------------------------------------------------------------ l'écran du gymnase (façon DW3)
  class GymScene extends DW.Scene {
    constructor(m) { super(); this.m = m; this.i = 0; this.state = 'menu'; this.msg = ''; this.pt = []; this.hits = []; }
    get G() { return GYM[this.i]; }
    update(dt) {
      for (let k = this.pt.length - 1; k >= 0; k--) { const p = this.pt[k]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.life <= 0) this.pt.splice(k, 1); }
      if (this.state === 'menu') {
        if (Input.hit('up')) { this.i = (this.i + GYM.length - 1) % GYM.length; Audio.sfx('move'); this.msg = ''; }
        if (Input.hit('down')) { this.i = (this.i + 1) % GYM.length; Audio.sfx('move'); this.msg = ''; }
        if (Input.hit('back')) { Audio.sfx('back'); this.close(); }
        if (Input.hit('ok')) this.start();
        return;
      }
      if (this.state === 'play') {
        if (this.pause > 0) { this.pause -= dt; return; }
        this.t2 += dt; this.p = (Math.sin(this.t2 * this.speed * Math.PI - Math.PI / 2) + 1) / 2;
        if (Math.random() < 0.6) this.puff(1);
        if (Input.hit('ok')) {
          const d = Math.abs(this.p - this.c), r = d < this.w / 6 ? 2 : d < this.w / 2 ? 1 : 0;
          this.hits.push(r); Audio.sfx(r === 2 ? 'super' : r ? 'hit' : 'weak'); this.puff(r ? 14 : 4); this.shake = r ? 0.2 : 0.35; this.hitT = 0.4;
          if (this.hits.length >= 3) { this.pause = 0.8; this.finishT = 0.8; this.state = 'end'; }
          else { this.pause = 0.5; this.newRep(); }
        }
        return;
      }
      if (this.state === 'end') { if ((this.finishT -= dt) <= 0) this.finish(); return; }
      if (this.state === 'result' && (Input.hit('ok') || Input.hit('back'))) { Audio.sfx('select'); this.state = 'menu'; }
    }
    newRep() { this.t2 = 0; this.c = 0.3 + Math.random() * 0.4; this.w = 0.26 - Math.min(0.12, ((this.m.res || {})[this.G.type] || 0) / 800); this.speed = 1.4 + ((this.m.res || {})[this.G.type] || 0) / 70; }
    puff(n) {
      const [a, b] = this.G.fx;
      for (let k = 0; k < n; k++) this.pt.push({ x: 214 + (Math.random() - 0.5) * 60, y: 150 - Math.random() * 40, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 50, life: 0.6 + Math.random() * 0.4, col: Math.random() < 0.5 ? a : b });
    }
    start() {
      const m = this.m, g = this.G, s = st();
      const no = !Gym.unlocked(g) ? "Cet appareil est encore en réparation... Il ouvrira plus tard dans l'aventure."
        : m.hp <= 0 ? `${m.name} est K.O. Soigne-le d'abord !` : m.sick ? `${m.name} est malade...` : m.tired >= 80 ? `${m.name} est trop fatigué. Fais-le se reposer !`
        : ((m.res || {})[g.type] || 0) >= CAP ? `${m.name} résiste déjà au maximum à l'élément ${g.type} !` : s.bits < FEE ? `Il faut ${FEE} Bits pour une séance.` : null;
      if (no) { Audio.sfx('bump'); this.msg = no; return; }
      s.bits -= FEE; Audio.sfx('buff');
      this.state = 'play'; this.hits = []; this.pause = 0.8; this.newRep();
    }
    finish() {
      const m = this.m, g = this.G, score = this.hits.reduce((a, b) => a + b, 0);
      m.res = m.res || {};
      const before = m.res[g.type] || 0, gain = [3, 6, 9, 13, 16, 20, 24][score];
      m.res[g.type] = Math.min(CAP, before + gain);
      const [k, sgn] = g.side, delta = Gym.addStat(m, k, sgn * (k === 'hp' || k === 'mp' ? 6 + score * 4 : 1 + Math.ceil(score / 2)));
      m.tired = Math.min(100, (m.tired || 0) + TIRE); st().clock += MINUTES;
      DW.Life.addFat && DW.Life.addFat(m, -0.15);
      const R = m.res[g.type] - before;
      this.msg = `La résistance ${g.type === 'Air' ? "à l'Air" : g.type === 'Eau' ? "à l'Eau" : `au ${g.type}`.replace('au Glace', 'à la Glace').replace('au Terre', 'à la Terre').replace('au Électrique', "à l'Électricité").replace('au Ténèbres', 'aux Ténèbres')} monte de ${R} !  (${NAME[k]} ${delta >= 0 ? '+' : '-'}${Math.abs(delta)})`;
      this.state = 'result'; Audio.sfx('levelup');
      DW.autosave();
    }
    draw(c) {
      const m = this.m, g = this.G, t = this.t;
      UI.menuBg(c, t);
      // bandeau
      UI.box(c, 6, 4, W - 12, 20); UI.label(c, 'GYMNASE', 12, 8);
      UI.text(c, `${m.name}  N.${m.level}`, 92, 17, { size: 9, color: '#ffe070' }); UI.text(c, `${st().bits} Bits`, W - 14, 17, { size: 8, align: 'right', color: '#c8f0ff' });
      // colonne de gauche : statistiques et résistances
      UI.box(c, 6, 28, 112, 160);
      const S = [['hp', 'PV'], ['mp', 'PM'], ['atk', 'Atq'], ['def', 'Déf'], ['spd', 'Vit'], ['int', 'Int']];
      S.forEach(([k, l], j) => { const y = 40 + (j % 3) * 11, x = j < 3 ? 12 : 64; UI.text(c, l, x, y, { size: 7, color: '#8ae0f0' }); UI.text(c, String(m.stat(k)), x + 46, y, { size: 7, align: 'right' }); });
      UI.text(c, 'RÉSISTANCES', 12, 80, { size: 7, color: '#ffe070' });
      GYM.forEach((G, j) => {
        const y = 92 + j * 13, v = (m.res || {})[G.type] || 0, on = Gym.unlocked(G);
        UI.typeTag(c, G.type, 12, y - 6, 6);
        UI.bar(c, 64, y - 3, 38, 3, v / CAP, on ? DW.TYPES[G.type].c : '#3a4a5a');
        UI.text(c, on ? String(v) : '—', 112, y, { size: 7, align: 'right', color: on ? '#ffffff' : '#5a6a7a' });
      });
      // à droite : les appareils
      UI.box(c, 122, 28, W - 128, 84);
      GYM.forEach((G, j) => {
        const y = 40 + j * 11, on = Gym.unlocked(G), sel = j === this.i;
        if (sel) { c.fillStyle = 'rgba(255,224,112,0.14)'; c.fillRect(125, y - 8, W - 134, 10); }
        icon(c, G.id, 132, y - 3, on);
        UI.text(c, on ? G.name : '???', 141, y, { size: 8, color: !on ? '#5a6a7a' : sel ? '#ffe070' : '#c8f0ff' });
        if (on) UI.text(c, `${FEE} B`, W - 12, y, { size: 7, align: 'right', color: '#8ae0f0' });
      });
      // la salle : l'appareil de l'élément en action, le Digimon encaisse ; essais réussis / ratés (○ ×) comme dans DW3
      UI.box(c, 122, 114, W - 128, 74);
      c.save(); c.beginPath(); c.rect(125, 117, W - 134, 68); c.clip();
      if (this.shake > 0) { this.shake -= 1 / 60; c.translate((Math.random() - 0.5) * 4, 0); }
      if (this.hitT > 0) this.hitT -= 1 / 60;
      drawRoom(c, g, t, 125, 117, W - 134, 68, Math.max(0, this.hitT || 0), (m.res || {})[g.type] || 0);
      const spr = DW.Sprites.battle(m.sp), k = Math.min(1, 46 / spr.h), hurt = (this.hitT || 0) > 0;
      DW.Sprites.draw(c, hurt ? DW.Sprites.pose(m.sp, 'hurt') : spr, 214, 180, { frame: Math.floor(t * 4), scale: k });
      for (const p of this.pt) { c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = p.col; c.fillRect(p.x, p.y, 2, 2); }
      c.globalAlpha = 1; c.restore();
      if (this.hits.length) this.hits.forEach((h, j) => { const x = 132 + j * 12, y = 124; if (h) { c.strokeStyle = h === 2 ? '#ffe070' : '#5ab0ff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 4, 0, 7); c.stroke(); } else { c.strokeStyle = '#ff4a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 4, y - 4); c.lineTo(x + 4, y + 4); c.moveTo(x + 4, y - 4); c.lineTo(x - 4, y + 4); c.stroke(); } });
      // bas : jauge, message
      UI.box(c, 6, 192, W - 12, 42);
      if (this.state === 'play' || this.state === 'end') {
        const x0 = 16, w = 220, y = 202;
        c.fillStyle = '#0a1426'; c.fillRect(x0 - 1, y - 1, w + 2, 10); c.fillStyle = '#2a3a5a'; c.fillRect(x0, y, w, 8);
        c.fillStyle = g.fx[0]; c.fillRect(x0 + (this.c - this.w / 2) * w, y, this.w * w, 8);
        c.fillStyle = '#ffffff'; c.fillRect(x0 + (this.c - this.w / 6) * w, y, this.w / 3 * w, 8);
        if (this.pause <= 0) { c.fillStyle = '#ff4040'; c.fillRect(Math.round(x0 + this.p * w) - 1, y - 3, 3, 14); }
        UI.text(c, `${g.name} : A pour encaisser au bon moment !`, 16, 224, { size: 7, color: '#c8f0ff' });
        for (let j = 0; j < 3; j++) { const h = this.hits[j]; UI.text(c, h == null ? '·' : h === 2 ? '★' : h ? '●' : '✘', W - 50 + j * 14, 210, { size: 10, align: 'center', color: h == null ? '#5a8aa0' : h ? '#ffe060' : '#ff7a7a' }); }
      } else {
        const txt = this.msg || (Gym.unlocked(g) ? `${g.name} : endurcit contre l'élément ${g.type}. ${NAME[g.side[0]]} ${g.side[1] > 0 ? '+' : '-'}. (1 h 30, fatigue +${TIRE} %)` : "Appareil en réparation : il ouvrira plus tard dans l'aventure.");
        UI.wrap(c, txt, W - 36, 8).slice(0, 2).forEach((l, j) => UI.text(c, l, 16, 205 + j * 11, { size: 8, color: this.state === 'result' ? '#7aff8a' : '#ffffff' }));
        UI.hints(c, this.state === 'result' ? [['ok', 'continuer']] : [['ok', 'séance'], ['back', 'sortir']], W - 14, 230);
      }
    }
  }
  DW.GymScene = GymScene;

  // ------------------------------------------------------------ la salle du gymnase (intérieur)
  const room = DW.Palais.room('gymnase', 'village', { name: 'Gymnase', w: 18, h: 12, music: 'village',
    floor: { type: 'tatami', cols: ['#d8c890', '#b8a870', '#6a5a3a'] }, wall: { base: '#9ab0c8', alt: '#8aa0b8', pattern: 'stripes', wood: '#4a5a6a' },
    objects: [
      { kind: 'guardwall', x: 2, y: 3, w: 1, h: 1, small: true }, { kind: 'datacrystal', x: 5, y: 3, w: 1, h: 1, small: true },
      { kind: 'weights', x: 12, y: 3, w: 1, h: 1, small: true }, { kind: 'shieldrack', x: 15, y: 3, w: 1, h: 1, small: true },
      { kind: 'mat', x: 6, y: 6, w: 6, h: 3, walk: true }, { kind: 'barrel', v: 0, x: 1, y: 9, w: 1, h: 1, small: true }, { kind: 'bench', x: 15, y: 9, w: 1, h: 1, small: true },
    ] });
  room.calm = true;
  DW.Palais.entrance('gymnase');
  for (const w of room.warps) if (w.to === '?') Object.assign(w, { to: 'gym', tx: 9, ty: 5 });
  room.npcs.push({ sp: 'leomon', x: 9, y: 4, face: 'down', talk: async () => {
    const s = st();
    if (!s.party.length) { await say("Reviens avec un partenaire, petit !", 'Leomon'); return; }
    if (!s.flags.gymIntro) {
      s.flags.gymIntro = true;
      await say("Bienvenue au Gymnase ! Je suis Leomon. Ici, on ne muscle pas : on ENDURCIT.", 'Leomon');
      await say("Chaque appareil habitue ton Digimon à un élément : le feu, l'eau, la glace, le vent, la foudre... Les attaques de cet élément le blesseront de moins en moins.", 'Leomon');
      await say("Mais rien n'est gratuit : la Cascade fait un peu baisser l'Intelligence, la Soufflerie l'Attaque... Le Mur de flammes, lui, donne des PM. À toi de choisir !", 'Leomon');
    }
    let m = s.party[0];
    if (s.party.length > 1) { const i = await Game.push(new DW.PartyScene({ mode: 'select', title: 'GYMNASE' })); if (i == null || i < 0) return; m = s.party[i]; }
    await Game.push(new GymScene(m));
  } });
  for (const k of ['2,3', '5,3', '12,3', '15,3']) room.signs[k] = 'Un appareil du gymnase. Parle à Leomon pour commencer une séance.';
})();
