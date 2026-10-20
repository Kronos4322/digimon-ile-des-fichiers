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
    // (règle du joueur) ESPACE : parler, frapper, valider    ENTRÉE : ouvrir le menu (Digivice)    SUPPR : sortir / retour
    Space: 'ok', KeyJ: 'ok', Enter: 'menu', NumpadEnter: 'menu',
    Delete: 'back', Backspace: 'back', KeyK: 'back', KeyX: 'back', Escape: 'menu',
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
    runLock: false,     // COURIR du téléphone (interrupteur, ui/touch.js) : le héros court sans qu'on tienne Maj
    // appareil utilisé en dernier ('key' | 'pad' | 'touch') et famille de manette ('xbox' | 'ps' | 'nintendo')
    device: 'key', padKind: 'xbox',
    padMag: 0,          // inclinaison du stick gauche (0 à 1) : poussé à fond, le héros court
    analogRun() { return this.device === 'pad' && this.padMag > 0.9; },
    // vibration de la manette (si elle en est capable) : force 0 à 1, durée en ms
    rumble(strong = 0.5, ms = 120) {
      if (this.device !== 'pad' || !navigator.getGamepads) return;
      try { for (const p of navigator.getGamepads()) { const v = p && p.connected && p.vibrationActuator; if (v && v.playEffect) v.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: Math.min(1, strong + 0.2) }).catch(() => {}); } } catch (e) { /* sans vibration */ }
    },
    // noms des commandes selon l'appareil : les textes du jeu écrivent ESPACE / ÉCHAP / ENTRÉE / Maj,
    // ils sont traduits à l'affichage (manette Xbox, PlayStation, Nintendo, écran tactile)
    NAMES: {
      key: { ok: 'ESPACE', back: 'SUPPR', menu: 'ENTRÉE', run: 'Maj', move: 'flèches ou ZQSD' },
      xbox: { ok: 'A', back: 'B', menu: 'START', run: 'X', move: 'stick gauche' },
      ps: { ok: 'Croix', back: 'Rond', menu: 'START', run: 'Carré', move: 'stick gauche' },
      nintendo: { ok: 'B', back: 'A', menu: '+', run: 'Y', move: 'stick gauche' },
      touch: { ok: 'A', back: 'B', menu: 'MENU', run: 'COURIR', move: 'stick' },   // (les boutons de l'écran : ui/touch.js)
    },
    names() { return this.NAMES[this.device === 'pad' ? this.padKind : this.device] || this.NAMES.key; },
    // (les textes écrivent ÉCHAP pour « retour » et ENTRÉE pour « menu » : au clavier, c'est SUPPR et ENTRÉE ;
    //  remplacement en une seule passe, pour ne pas retraduire un mot déjà traduit)
    keys(s) {
      if (typeof s !== 'string' || !/ESPACE|ÉCHAP|Échap|ENTRÉE|Maj|ZQSD/.test(s)) return s;
      const N = this.names(), T = { 'flèches ou ZQSD': N.move, ESPACE: N.ok, 'ÉCHAP': N.back, 'Échap': N.back, 'ENTRÉE': N.menu, Maj: N.run };
      return s.replace(/flèches ou ZQSD|ESPACE|ÉCHAP|Échap|ENTRÉE|Maj/g, w => T[w]);
    },
    // petit message qui s'affiche quelques secondes en haut de l'écran (manette branchée...)
    notice: null,
    notify(text) { this.notice = { text, t: 0 }; },
    clear() { this.pressed = {}; this.typed = []; },
    // une source (touche, bouton) enfonce une action ; repeat = répétition automatique du clavier
    press(src, a, repeat = false) {
      DW.Audio.init();
      if (!repeat || DIRS.includes(a)) this.pressed[a] = true;
      (sources[a] = sources[a] || new Set()).add(src);
      if (DIRS.includes(a) && !repeat) { this.dirStack = this.dirStack.filter(d => d !== a); this.dirStack.push(a); }
      if (!repeat) this.device = src.startsWith('pad') ? 'pad' : src.startsWith('touch') ? 'touch' : 'key';
      this.held[a] = true;
      if (a === 'mute' && !repeat) { DW.Audio.toggleMute(); DW.Options.save(); }   // (retenu au prochain lancement)
    },
    release(src, a) {
      const s = sources[a];
      if (!s || !s.delete(src)) return;
      this.held[a] = s.size > 0;
      if (!this.held[a] && DIRS.includes(a)) this.dirStack = this.dirStack.filter(d => d !== a);
    },
    releaseAll() { for (const a in sources) sources[a].clear(); this.held = {}; this.dirStack = []; },
    // stick (manette ou tactile) : 8 secteurs de 45° ; autour du secteur actuel `prev`, ~28° de marge pour ne pas
    // hésiter entre deux directions. Renvoie le numéro du secteur (SECT : ses directions)
    SECT: ['right', 'right,down', 'down', 'down,left', 'left', 'left,up', 'up', 'up,right'],
    secteur(x, y, prev) {
      const a = (Math.atan2(y, x) / (Math.PI / 4) + 8) % 8;
      return prev >= 0 && Math.abs(((a - prev + 12) % 8) - 4) < 0.62 ? prev : Math.round(a) % 8;
    },
    // appelé au début de chaque image par la boucle (core.js)
    poll() { pollPads(); },
  };
  window.addEventListener('keydown', e => {
    DW.Audio.init();
    if (Input.textMode) {
      if (e.target && e.target.dataset && e.target.dataset.saisie) return; // champ de saisie tactile (ui/touch.js)
      if (e.key.length === 1 || ['Backspace', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) { Input.typed.push(e.key); e.preventDefault(); }
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
  // stick gauche : zone morte circulaire, puis 8 secteurs de 45° (Input.secteur)
  const DEAD = 0.32;
  const padSector = {};        // secteur retenu par manette
  function stick(p) {
    const x = p.axes[0] || 0, y = p.axes[1] || 0;
    if (Math.hypot(x, y) < DEAD) { padSector[p.index] = -1; return []; }
    const s = padSector[p.index] = Input.secteur(x, y, padSector[p.index]);
    return Input.SECT[s].split(',');
  }
  const padHeld = new Map();   // sources de manette actuellement enfoncées -> instant de l'appui (répétition)
  const kindOf = id => (/054c|playstation|dualshock|dualsense/i.test(id) ? 'ps' : /057e|nintendo|switch|joy-con|pro controller/i.test(id) ? 'nintendo' : 'xbox');
  window.addEventListener('gamepadconnected', e => {
    Input.padKind = kindOf(e.gamepad.id);
    Input.notify(`Manette connectée (${{ xbox: 'Xbox / standard', ps: 'PlayStation', nintendo: 'Nintendo' }[Input.padKind]}) : appuie sur un bouton pour jouer.`);
  });
  window.addEventListener('gamepaddisconnected', () => { Input.notify('Manette débranchée : le clavier reprend la main.'); Input.device = 'key'; Input.releaseAll(); padHeld.clear(); });
  // maintenir une direction dans un menu : la sélection défile (comme la répétition du clavier)
  const REPEAT_DELAY = 380, REPEAT_EVERY = 85;
  // saisie du nom : la croix / le stick déplacent la sélection parmi les prénoms proposés
  const ARROW = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
  function pollPads() {
    if (!navigator.getGamepads) return;
    let pads;
    try { pads = navigator.getGamepads(); } catch (e) { return; }
    const now = new Set();
    let mag = 0;
    for (const p of pads) {
      if (!p || !p.connected) continue;
      for (const i in PAD_BTN) { const b = p.buttons[i]; if (b && (b.pressed || b.value > 0.5)) now.add(`pad${p.index}:b${i}:${PAD_BTN[i]}`); }
      for (const d of stick(p)) now.add(`pad${p.index}:st:${d}`);
      mag = Math.max(mag, Math.min(1, Math.hypot(p.axes[0] || 0, p.axes[1] || 0)));
      if (now.size && Input.device !== 'pad') Input.padKind = kindOf(p.id);
    }
    Input.padMag = mag;
    const action = src => src.slice(src.lastIndexOf(':') + 1), t = performance.now();
    for (const src of [...padHeld.keys()]) if (!now.has(src)) { padHeld.delete(src); Input.release(src, action(src)); }
    for (const [src, t0] of padHeld) {
      const a = action(src);
      if (DIRS.includes(a) && t - t0 > REPEAT_DELAY) { padHeld.set(src, t - REPEAT_DELAY + REPEAT_EVERY); if (!Input.textMode) Input.press(src, a, true); else Input.typed.push(ARROW[a]); }
    }
    for (const src of now) if (!padHeld.has(src)) {
      padHeld.set(src, t);
      // dans la saisie du nom, la manette valide (nom par défaut) ou efface
      if (Input.textMode) { const a = action(src); if (a === 'ok' || a === 'menu') Input.typed.push('Enter'); else if (a === 'back') Input.typed.push('Backspace'); else if (ARROW[a]) Input.typed.push(ARROW[a]); continue; }
      Input.press(src, action(src));
    }
  }
})();
