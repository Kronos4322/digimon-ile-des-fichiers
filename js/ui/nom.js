'use strict';
// =====================================================================
//  SAISIE DU NOM : prénoms proposés ou clavier, 3 lettres minimum
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;

  // ------------------------------------------------------------ saisie du nom
  // Prénoms proposés (on les touche ou on les choisit aux flèches), ou on tape le sien.
  // Il faut au moins 3 lettres : impossible de partir à l'aventure sans nom.
  // (pas les prénoms des enfants de l'aventure : nommé « Matt », le héros entendait « Moi, c'est Matt » et prenait son
  //  portrait ; ces prénoms sont refusés, PRIS)
  const NAMES = ['Kenji', 'Aiko', 'Hiro', 'Yuki', 'Léo', 'Lina', 'Kaito', 'Emma', 'Noa', 'Sami', 'Rin', 'Théo'];
  const norme = s => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f.\s'\-]/g, '');
  const PRIS = () => new Set([...Object.keys(DW.HEROES).filter(k => k !== 'perso').map(k => DW.HEROES[k].name),
    'TK', 'Kari', 'Hikari', 'Taichi', 'Yamato', 'Koushiro', 'Takeru', 'Gennai'].map(norme));
  const NCOL = 4, CHW = 66, CHH = 18, CHX = 19, CHY = 98, GAPX = 6, GAPY = 5;
  const BTN = { clear: [52, 172, 96, 22], ok: [172, 172, 96, 22] };
  class NameScene extends DW.Scene {
    constructor(def) {
      super(); this.name = ''; this.def = def || 'Kenji';
      this.sel = Math.max(0, NAMES.indexOf(this.def)); this.err = 0;
    }
    enter() { Input.textMode = true; Input.textValue = this.name; }
    letters() { return (this.name.match(/\p{L}/gu) || []).length; }
    chipRect(i) { return [CHX + (i % NCOL) * (CHW + GAPX), CHY + Math.floor(i / NCOL) * (CHH + GAPY), CHW, CHH]; }
    // 0..11 prénoms, 12 = EFFACER, 13 = VALIDER
    rectOf(i) { return i < NAMES.length ? this.chipRect(i) : i === NAMES.length ? BTN.clear : BTN.ok; }
    act(i) {
      if (i < NAMES.length) { this.name = NAMES[i]; this.sel = NAMES.length + 1; Audio.sfx('select'); }
      else if (i === NAMES.length) { this.name = ''; Audio.sfx('back'); }
      else return this.validate();
      return false;
    }
    validate() {
      if (this.letters() < 3) { this.err = 2.2; this.errMsg = 'Il faut un nom d’au moins 3 lettres !'; Audio.sfx('back'); return false; }
      if (PRIS().has(norme(this.name))) { this.err = 2.6; this.errMsg = 'C’est le prénom d’un enfant de l’aventure !'; Audio.sfx('back'); return false; }
      Input.textMode = false; Audio.sfx('select');
      this.close(this.name.trim());
      return true;
    }
    move(dx, dy) {
      const N = NAMES.length; let i = this.sel;
      if (i < N) {
        const col = i % NCOL, row = Math.floor(i / NCOL);
        if (dx) i = row * NCOL + (col + dx + NCOL) % NCOL;
        if (dy > 0) i = row === N / NCOL - 1 ? (col < 2 ? N : N + 1) : i + NCOL;
        if (dy < 0 && row > 0) i -= NCOL;
      } else {
        if (dx) i = i === N ? N + 1 : N;
        if (dy < 0) i = N - NCOL + (i === N ? 1 : 2);
      }
      this.sel = i; Audio.sfx('move');
    }
    update(dt) {
      if (this.err > 0) this.err -= dt;
      for (const k of Input.typed) {
        if (k.startsWith('Tap:')) {
          const [x, y] = k.slice(4).split(',').map(Number);
          for (let i = 0; i <= NAMES.length + 1; i++) { const [rx, ry, rw, rh] = this.rectOf(i); if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) { this.sel = i; if (this.act(i)) return; break; } }
          continue;
        }
        if (k.startsWith('Set:')) {   // (téléphone : le texte entier du champ de saisie, ui/touch.js)
          const v = [...k.slice(4)].filter(ch => /^[\p{L}\p{N} '\-]$/u.test(ch)).join('').slice(0, 10);
          if (v !== this.name) { this.name = v; this.sel = NAMES.length + 1; Audio.sfx('text'); }
          continue;
        }
        if (k === 'Enter') { if (this.act(this.sel)) return; continue; }
        if (k === 'ArrowLeft') this.move(-1, 0); else if (k === 'ArrowRight' || k === 'Tab') this.move(1, 0);
        else if (k === 'ArrowUp') this.move(0, -1); else if (k === 'ArrowDown') this.move(0, 1);
        // (retour à la création : ÉCHAP, SUPPR, ou un nouvel appui sur Retour arrière quand le nom est vide — pas ses
        //  répétitions quand on le garde enfoncé pour effacer : on en sortait sans le vouloir)
        else if (k === 'Escape' || k === 'Delete' || (k === 'Backspace' && !this.name)) { Input.textMode = false; Audio.sfx('back'); this.close(null); return; }
        else if (k === 'Backspace' || k === 'BackspaceRepeat') this.name = this.name.slice(0, -1);
        else if (this.name.length < 10 && /^[\p{L}\p{N} '\-]$/u.test(k)) { this.name += k; this.sel = NAMES.length + 1; Audio.sfx('text'); }
      }
      Input.textValue = this.name;   // (recopié dans le champ de saisie du téléphone)
    }
    draw(c) {
      UI.menuBg(c, this.t);
      UI.box(c, 10, 10, 300, 220);
      UI.text(c, 'Comment t’appelles-tu ?', 160, 32, { size: 13, align: 'center', bold: true, color: '#ffe680' });
      // cadre du nom
      const [fx, fy, fw, fh] = NameScene.FIELD;
      UI.box(c, fx, fy, fw, fh, 'dark');
      const caret = Math.floor(this.t * 2) % 2 ? '_' : ' ';
      if (this.name) UI.text(c, this.name + caret, 160, fy + 20, { size: 15, align: 'center', bold: true, color: '#ffd860' });
      else UI.text(c, (DW.Touch && DW.Touch.on ? 'Touche ici pour écrire' : 'Tape ton nom') + caret, 160, fy + 19, { size: 9, align: 'center', color: '#6a7aa8' });
      // règle des 3 lettres
      const n = this.letters();
      const msg = this.err > 0 ? this.errMsg : n >= 3 ? 'Nom valide !' : `Au moins 3 lettres (encore ${3 - n})`;
      UI.text(c, msg, 160, 89, { size: 8, align: 'center', bold: this.err > 0, color: this.err > 0 ? '#ff7070' : n >= 3 ? '#7aff8a' : '#9ab0e8' });
      // prénoms proposés
      NAMES.forEach((nm, i) => {
        const [x, y, w, h] = this.chipRect(i), on = i === this.sel, cur = nm === this.name;
        UI.box(c, x, y, w, h, on ? 'dwsel' : 'dw');
        UI.text(c, nm, x + w / 2, y + 13, { size: 9, align: 'center', bold: on || cur, color: cur ? '#ffe070' : '#ffffff' });
      });
      // boutons
      for (const [i, key, label] of [[NAMES.length, 'clear', 'EFFACER'], [NAMES.length + 1, 'ok', 'VALIDER']]) {
        const [x, y, w, h] = BTN[key], on = this.sel === i, dis = key === 'ok' && n < 3;
        UI.box(c, x, y, w, h, on ? 'dwsel' : 'dw');
        UI.text(c, label, x + w / 2, y + 15, { size: 10, align: 'center', bold: true, color: dis ? '#6a7aa8' : key === 'ok' ? '#7aff8a' : '#ffb0a0' });
      }
      UI.text(c, DW.Touch && DW.Touch.on ? 'Touche un prénom, ou le cadre pour écrire le tien (B : retour)' : 'Tape ton nom ou choisis un prénom (Échap : retour)', 160, 212, { size: 7, align: 'center', color: '#7a8ab8' });
    }
  }
  NameScene.FIELD = [70, 44, 180, 32];
  NameScene.NAMES = NAMES;
  DW.NameScene = NameScene;
})();
