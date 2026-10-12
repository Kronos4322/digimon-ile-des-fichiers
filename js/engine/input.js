'use strict';
// =====================================================================
//  ENTRÉES : clavier (AZERTY/QWERTY), manette, écran tactile (voir ui/touch.js)
//  Chaque action (up, ok, menu...) est tenue par une ou plusieurs « sources »
//  (une touche, un bouton de manette, un bouton tactile) : elle n'est relâchée
//  que lorsque plus aucune source ne la tient.
// =====================================================================
(function () {

  // ------------------------------------------------------------ clavier
  // e.code = position physique : KeyW/A/S/D = Z/Q/S/D sur clavier AZERTY
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    // ESPACE : parler / valider    ENTRÉE : menu
    Space: 'ok', KeyJ: 'ok', Enter: 'menu', NumpadEnter: 'menu',
    Escape: 'back', Backspace: 'back', KeyK: 'back', KeyX: 'back',
    ShiftLeft: 'run', ShiftRight: 'run', Tab: 'menu', KeyM: 'mute', Semicolon: 'mute',
  };
  const DIRS = ['up', 'down', 'left', 'right'];
  const sources = {};   // action -> Set des sources qui la tiennent
  const Input = DW.Input = {
    held: {}, pressed: {}, typed: [], textMode: false,
    dirStack: [],
    isDown(a) { return !!this.held[a]; },
    hit(a) { return !!this.pressed[a]; },
    // direction maintenue la plus récente (évite les blocages quand deux flèches sont pressées)
    dir() {
      for (let i = this.dirStack.length - 1; i >= 0; i--) if (this.held[this.dirStack[i]]) return this.dirStack[i];
      // sinon une direction appuyée puis relâchée pendant la même image (tape très brève sur l'écran)
      return DIRS.find(d => this.held[d]) || DIRS.find(d => this.pressed[d]) || null;
    },
    // direction sur 2 axes (-1, 0, 1) pour les déplacements en diagonale ; deux flèches opposées : la plus récente gagne
    vec() {
      const axis = (a, b) => (this.held[a] && this.held[b] ? (this.dirStack.lastIndexOf(a) > this.dirStack.lastIndexOf(b) ? -1 : 1) : this.held[a] ? -1 : this.held[b] ? 1 : 0);
      let x = axis('left', 'right'), y = axis('up', 'down');
      if (!x && !y) { const d = this.dir(); if (d) { x = d === 'left' ? -1 : d === 'right' ? 1 : 0; y = d === 'up' ? -1 : d === 'down' ? 1 : 0; } }
      return { x, y };
    },
    padActive: false,   // la dernière direction vient de la manette (pas de « se tourner sur place »)
    clear() { this.pressed = {}; this.typed = []; },
    // une source (touche, bouton) enfonce une action ; repeat = répétition automatique du clavier
    press(src, a, repeat = false) {
      DW.Audio.init();
      if (!repeat || DIRS.includes(a)) this.pressed[a] = true;
      (sources[a] = sources[a] || new Set()).add(src);
      if (DIRS.includes(a) && !repeat) { this.dirStack = this.dirStack.filter(d => d !== a); this.dirStack.push(a); this.padActive = src.startsWith('pad') || src.startsWith('touch:pad'); }
      this.held[a] = true;
      if (a === 'mute' && !repeat) DW.Audio.toggleMute();
    },
    release(src, a) {
      const s = sources[a];
      if (!s || !s.delete(src)) return;
      this.held[a] = s.size > 0;
      if (!this.held[a] && DIRS.includes(a)) this.dirStack = this.dirStack.filter(d => d !== a);
    },
    releaseAll() { for (const a in sources) sources[a].clear(); this.held = {}; this.dirStack = []; },
    // appelé au début de chaque image par la boucle (core.js)
    poll() { pollPads(); },
  };
  window.addEventListener('keydown', e => {
    DW.Audio.init();
    if (Input.textMode) {
      if (e.target && e.target.dataset && e.target.dataset.saisie) return; // champ de saisie tactile (ui/touch.js)
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') { Input.typed.push(e.key); e.preventDefault(); }
      return;
    }
    const a = KEYMAP[e.code];
    if (!a) return;
    e.preventDefault();
    Input.press('key:' + e.code, a, e.repeat);
  });
  window.addEventListener('keyup', e => {
    const a = KEYMAP[e.code];
    if (a) Input.release('key:' + e.code, a);
  });
  window.addEventListener('blur', () => Input.releaseAll());

  // ------------------------------------------------------------ manette (disposition « standard » des navigateurs)
  // A / Croix = valider, B / Rond = retour, X / Carré = courir, Y / Triangle et START = menu, croix directionnelle ou stick gauche
  const PAD_BTN = { 0: 'ok', 1: 'back', 2: 'run', 3: 'menu', 9: 'menu', 8: 'back', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
  // stick gauche : zone morte circulaire, puis 8 secteurs de 45° (avec une marge pour ne pas hésiter entre deux secteurs)
  const DEAD = 0.32, SECT = ['right', 'right,down', 'down', 'down,left', 'left', 'left,up', 'up', 'up,right'];
  const padSector = {};        // secteur retenu par manette
  function stick(p) {
    const x = p.axes[0] || 0, y = p.axes[1] || 0;
    if (Math.hypot(x, y) < DEAD) { padSector[p.index] = -1; return []; }
    const a = (Math.atan2(y, x) / (Math.PI / 4) + 8) % 8, prev = padSector[p.index];
    let s = Math.round(a) % 8;
    if (prev >= 0) { const d = Math.abs(((a - prev + 12) % 8) - 4); if (d < 0.62) s = prev; }   // ~28° de marge autour du secteur actuel
    padSector[p.index] = s;
    return SECT[s].split(',');
  }
  const padHeld = new Set();   // sources de manette actuellement enfoncées
  function pollPads() {
    if (!navigator.getGamepads) return;
    let pads;
    try { pads = navigator.getGamepads(); } catch (e) { return; }
    const now = new Set();
    for (const p of pads) {
      if (!p || !p.connected) continue;
      for (const i in PAD_BTN) { const b = p.buttons[i]; if (b && (b.pressed || b.value > 0.5)) now.add(`pad${p.index}:b${i}:${PAD_BTN[i]}`); }
      for (const d of stick(p)) now.add(`pad${p.index}:st:${d}`);
    }
    const action = src => src.slice(src.lastIndexOf(':') + 1);
    for (const src of padHeld) if (!now.has(src)) { padHeld.delete(src); Input.release(src, action(src)); }
    for (const src of now) if (!padHeld.has(src)) {
      padHeld.add(src);
      // dans la saisie du nom, la manette valide (nom par défaut) ou efface
      if (Input.textMode) { const a = action(src); if (a === 'ok' || a === 'menu') Input.typed.push('Enter'); else if (a === 'back') Input.typed.push('Backspace'); continue; }
      Input.press(src, action(src));
    }
  }
})();
