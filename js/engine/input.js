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
    clear() { this.pressed = {}; this.typed = []; },
    // une source (touche, bouton) enfonce une action ; repeat = répétition automatique du clavier
    press(src, a, repeat = false) {
      DW.Audio.init();
      if (!repeat || DIRS.includes(a)) this.pressed[a] = true;
      (sources[a] = sources[a] || new Set()).add(src);
      if (DIRS.includes(a) && !repeat) { this.dirStack = this.dirStack.filter(d => d !== a); this.dirStack.push(a); }
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
  const DEAD = 0.5;
  const padHeld = new Set();   // sources de manette actuellement enfoncées
  function pollPads() {
    if (!navigator.getGamepads) return;
    let pads;
    try { pads = navigator.getGamepads(); } catch (e) { return; }
    const now = new Set();
    for (const p of pads) {
      if (!p || !p.connected) continue;
      for (const i in PAD_BTN) { const b = p.buttons[i]; if (b && (b.pressed || b.value > 0.5)) now.add(`pad${p.index}:b${i}:${PAD_BTN[i]}`); }
      const x = p.axes[0] || 0, y = p.axes[1] || 0;
      if (x < -DEAD) now.add(`pad${p.index}:ax:left`); else if (x > DEAD) now.add(`pad${p.index}:ax:right`);
      if (y < -DEAD) now.add(`pad${p.index}:ay:up`); else if (y > DEAD) now.add(`pad${p.index}:ay:down`);
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
