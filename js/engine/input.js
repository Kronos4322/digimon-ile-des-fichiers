'use strict';
// =====================================================================
//  CLAVIER : actions, touches AZERTY/QWERTY, direction prioritaire
// =====================================================================
(function () {

  // ------------------------------------------------------------ entrées
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
  const codes = new Set();
  const Input = DW.Input = {
    held: {}, pressed: {}, typed: [], textMode: false,
    dirStack: [],
    isDown(a) { return !!this.held[a]; },
    hit(a) { return !!this.pressed[a]; },
    // direction maintenue la plus récente (évite les blocages quand deux flèches sont pressées)
    dir() {
      for (let i = this.dirStack.length - 1; i >= 0; i--) if (this.held[this.dirStack[i]]) return this.dirStack[i];
      return DIRS.find(d => this.held[d]) || null;
    },
    clear() { this.pressed = {}; this.typed = []; },
  };
  window.addEventListener('keydown', e => {
    DW.Audio.init();
    if (Input.textMode) {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') { Input.typed.push(e.key); e.preventDefault(); }
      return;
    }
    const a = KEYMAP[e.code];
    if (!a) return;
    e.preventDefault();
    if (!e.repeat || DIRS.includes(a)) Input.pressed[a] = true;
    codes.add(e.code);
    if (DIRS.includes(a) && !e.repeat) { Input.dirStack = Input.dirStack.filter(d => d !== a); Input.dirStack.push(a); }
    Input.held[a] = true;
    if (a === 'mute' && !e.repeat) DW.Audio.toggleMute();
  });
  window.addEventListener('keyup', e => {
    const a = KEYMAP[e.code];
    if (!a) return;
    // plusieurs touches partagent une action (ex. flèche haut et Z) : on ne relâche que si aucune n'est enfoncée
    codes.delete(e.code);
    Input.held[a] = [...codes].some(c => KEYMAP[c] === a);
    if (Input.held[a]) return;
    if (DIRS.includes(a)) Input.dirStack = Input.dirStack.filter(d => d !== a);
  });
  window.addEventListener('blur', () => { Input.held = {}; Input.dirStack = []; codes.clear(); });
})();
