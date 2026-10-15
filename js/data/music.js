'use strict';
// =====================================================================
//  MUSIQUES (compositions originales)
// =====================================================================
(function () {
  // ------------------------------------------------------------ musiques (compositions originales)
  // notation : NOTE/durée (en croches), "-" = silence, "|" = barre de mesure (ignorée)
  DW.MUSIC = {
    title: { bpm: 120, ch: [
      { w: 'square', v: 0.1, n: 'C5/3 G4 C5/2 E5/2 | D5/3 C5 D5/2 G5/2 | E5/3 D5 C5/2 A4/2 | B4/4 G4/4 | C5/3 G4 C5/2 E5/2 | F5/3 E5 F5/2 A5/2 | G5/2 E5/2 D5/2 B4/2 | C5/8' },
      { w: 'triangle', v: 0.22, n: 'C3/2 G3/2 C3/2 G3/2 | G2/2 D3/2 G2/2 D3/2 | A2/2 E3/2 F2/2 C3/2 | G2/2 D3/2 G2/4 | C3/2 G3/2 C3/2 G3/2 | F2/2 C3/2 F2/2 C3/2 | G2/2 D3/2 G2/2 D3/2 | C3/2 G3/2 C3/4' },
    ] },
    field: { bpm: 140, ch: [
      { w: 'square', v: 0.08, n: 'E5 G5 C6/2 B5 G5 A5/2 | G5 E5 F5 G5/2 E5 C5/2 | D5 E5 F5/2 A5 G5 F5/2 | E5/2 D5/2 C5/4 | A5 G5 E5/2 C5 D5 E5/2 | F5 A5 C6/2 B5 A5 G5/2 | E5 G5 C6/2 D6 C6 B5/2 | C6/4 G5/2 -/2' },
      { w: 'triangle', v: 0.2, n: 'C3/2 G3/2 C3/2 G3/2 | F3/2 C4/2 C3/2 G3/2 | D3/2 A3/2 G3/2 D3/2 | C3/2 G3/2 C3/4 | A2/2 E3/2 A2/2 E3/2 | F3/2 C4/2 F3/2 C4/2 | G3/2 D4/2 G3/2 B3/2 | C3/2 G3/2 C3/4' },
    ] },
    beach: { bpm: 128, ch: [
      { w: 'triangle', v: 0.2, n: 'G5/2 E5 G5 A5/2 G5/2 | E5/2 C5 D5 E5/4 | F5/2 D5 F5 A5/2 G5/2 | E5/6 -/2 | G5/2 E5 G5 C6/2 B5/2 | A5/2 F5 G5 A5/4 | G5/2 E5 D5 C5/2 D5/2 | C5/6 -/2' },
      { w: 'square', v: 0.05, n: 'C4 E4 G4 E4 C4 E4 G4 E4 | A3 C4 E4 C4 A3 C4 E4 C4 | D4 F4 A4 F4 G3 B3 D4 B3 | C4 E4 G4 E4 C4 E4 G4 E4 | C4 E4 G4 E4 E4 G4 B4 G4 | F4 A4 C5 A4 F4 A4 C5 A4 | G3 B3 D4 B3 G3 B3 D4 B3 | C4 E4 G4 E4 C4/4' },
      { w: 'triangle', v: 0.16, n: 'C3/4 G2/4 | A2/4 E3/4 | D3/4 G2/4 | C3/8 | C3/4 E3/4 | F3/4 F2/4 | G2/4 G3/4 | C3/8' },
    ] },
    village: { bpm: 110, ch: [
      { w: 'triangle', v: 0.22, n: 'F5/2 A5 C6 A5/2 F5/2 | G5/2 A#5 A5 G5/4 | E5/2 G5 A#5 G5/2 E5/2 | F5/4 C5/4 | D5/2 F5 A5 G5/2 F5/2 | E5/2 G5 C6 A#5/4 | A5/2 G5 F5 E5/2 G5/2 | F5/6 -/2' },
      { w: 'square', v: 0.04, n: 'A4/2 C5/2 A4/2 C5/2 | A#4/2 C5/2 A#4/2 C5/2 | G4/2 A#4/2 G4/2 A#4/2 | A4/2 C5/2 A4/4 | F4/2 A4/2 F4/2 A4/2 | G4/2 C5/2 G4/2 C5/2 | C5/2 A#4/2 G4/2 E4/2 | F4/8' },
      { w: 'triangle', v: 0.15, n: 'F3/4 C3/4 | C3/4 E3/4 | C3/4 G3/4 | F3/4 C3/4 | D3/4 A3/4 | C3/4 G3/4 | C3/4 C3/4 | F3/8' },
    ] },
    battle: { bpm: 180, ch: [
      { w: 'square', v: 0.08, n: 'A4 A4 C5 A4 D5 A4 E5 D5 | C5 C5 E5 C5 G5 E5 D5 C5 | F4 F4 A4 F4 C5 A4 D5 C5 | E5/2 G#4/2 B4/2 E5/2 | A5 G5 E5 C5 A4 C5 E5 G5 | F5 E5 C5 A4 F4 A4 C5 F5 | D5 C5 B4 G4 E4 G4 B4 D5 | E5/2 E5 F5 E5/2 G#5/2' },
      { w: 'triangle', v: 0.22, n: 'A2 A3 A2 A3 A2 A3 A2 A3 | C3 C4 C3 C4 C3 C4 C3 C4 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 E3 E2 E3 E2 E3 E2 E3' },
    ] },
    boss: { bpm: 150, ch: [
      { w: 'sawtooth', v: 0.06, n: 'D5/2 D5 F5 E5/2 C5/2 | D5/2 A4/2 -/4 | D5/2 D5 F5 G5/2 A5/2 | A#5/2 A5/2 G5/2 E5/2 | F5/2 F5 A5 G5/2 E5/2 | F5/2 D5/2 -/4 | D6/2 C6 A#5 A5/2 G5/2 | A5/2 C#5/2 E5/2 A5/2' },
      { w: 'triangle', v: 0.24, n: 'D2 D3 D2 D3 D2 D3 C3 C2 | D2 D3 D2 D3 A2 A3 A2 A3 | D2 D3 D2 D3 D2 D3 D2 D3 | A#2 A#3 A#2 A#3 A2 A3 A2 A3' },
    ] },
    // l'antre de Shellmon : temple ensablé, mode oriental (mi phrygien dominant), lent et mystérieux
    temple: { bpm: 96, ch: [
      { w: 'triangle', v: 0.09, n: 'E4/2 F4 G#4 A4/2 G#4 F4 | E4/4 -/4 | B4/2 C5 B4 A4/2 G#4 A4 | G#4/2 F4/2 E4/4 | E5/2 D5 C5 B4/2 A4 G#4 | A4/2 G#4/2 F4/2 E4/2 | F4 G#4 A4 B4 C5/2 B4/2 | G#4/4 E4/4' },
      { w: 'triangle', v: 0.2, n: 'E2/4 E3/4 | E2/4 E3/4 | F2/4 F3/4 | E2/4 E3/4 | C3/4 B2/4 | A2/4 G#2/4 | F2/4 G#2/4 | E2/8' },
    ] },
    // combat contre Shellmon : rapide et menaçant (la mineur)
    shellmon: { bpm: 160, ch: [
      { w: 'sawtooth', v: 0.055, n: 'A4 C5 E5 A5 G5 E5 C5 E5 | F4 A4 C5 F5 E5 C5 A4 C5 | G4 B4 D5 G5 F5 D5 B4 D5 | E5/2 E5 F5 G#5/2 B5/2 | A5/2 G5 F5 E5/2 C5/2 | D5/2 F5 E5 D5/2 B4/2 | C5 E5 A5 C6 B5 G#5 E5 B4 | A4/4 -/4' },
      { w: 'triangle', v: 0.24, n: 'A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 | G2 G3 G2 G3 G2 G3 G2 G3 | E2 E3 E2 E3 E2 E3 E2 E3 | A2 A3 A2 A3 F2 F3 F2 F3 | D2 D3 D2 D3 G2 G3 G2 G3 | A2 A3 A2 A3 E2 E3 E2 E3 | A2/4 E2/4' },
    ] },
    evolve: { bpm: 200, ch: [
      { w: 'square', v: 0.06, n: 'C5 E5 G5 C6 E6 C6 G5 E5 | D5 F5 A5 D6 F6 D6 A5 F5 | E5 G5 B5 E6 G6 E6 B5 G5 | F5 A5 C6 F6 A6 F6 C6 A5' },
      { w: 'triangle', v: 0.22, n: 'C3/8 | D3/8 | E3/8 | F3/8' },
    ] },
    victory: { bpm: 150, loop: false, ch: [
      { w: 'square', v: 0.1, n: 'G5 G5 G5 G5/3 D#5/3 F5/3 G5/2 F5 G5/6' },
      { w: 'triangle', v: 0.2, n: 'C3 C3 C3 C3/3 G#2/3 A#2/3 C3/2 A#2 C3/6' },
    ] },
  };
})();
