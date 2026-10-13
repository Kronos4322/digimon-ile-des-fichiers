'use strict';
// =====================================================================
//  MUSIQUES DES RÉGIONS (compositions originales) — une ambiance par région de l'île
//  Même notation que data/music.js : NOTE/durée (en croches), « - » = silence, « | » = barre de mesure.
//  DW.REGION_MUSIC : région → morceau (lu par maps/regions.js et les cartes faites à la main).
// =====================================================================
(function () {
  Object.assign(DW.MUSIC, {
    // forêt : douce et sautillante, en sol majeur
    forest: { bpm: 118, ch: [
      { w: 'triangle', v: 0.2, n: 'D5 G5 B5/2 A5 G5 E5/2 | D5/2 E5 G5 A5/4 | B5 A5 G5/2 E5 D5 B4/2 | D5/6 -/2 | G5 A5 B5/2 D6 B5 A5/2 | G5/2 E5 D5 E5/4 | C5 E5 G5/2 B5 A5 F#5/2 | G5/6 -/2' },
      { w: 'square', v: 0.035, n: 'G4/2 B4/2 D5/2 B4/2 | C4/2 E4/2 G4/2 E4/2 | E4/2 G4/2 B4/2 G4/2 | D4/2 F#4/2 A4/2 F#4/2 | G4/2 B4/2 D5/2 B4/2 | E4/2 G4/2 B4/2 G4/2 | C4/2 E4/2 D4/2 F#4/2 | G4/8' },
      { w: 'triangle', v: 0.14, n: 'G2/4 D3/4 | C3/4 G2/4 | E2/4 B2/4 | D3/4 A2/4 | G2/4 D3/4 | E2/4 B2/4 | C3/4 D3/4 | G2/8' },
    ] },
    // montagne : large et héroïque, en ré
    mountain: { bpm: 104, ch: [
      { w: 'square', v: 0.07, n: 'D5/3 A4 D5/2 F#5/2 | E5/3 D5 C#5/2 A4/2 | B4/3 D5 G5/2 F#5/2 | E5/8 | D5/3 A4 D5/2 F#5/2 | G5/3 F#5 E5/2 D5/2 | C#5/2 E5/2 A5/2 G5/2 | F#5/6 -/2' },
      { w: 'triangle', v: 0.22, n: 'D3/4 A2/4 | A2/4 E3/4 | G2/4 D3/4 | A2/4 C#3/4 | D3/4 A2/4 | G2/4 B2/4 | A2/4 A3/4 | D3/8' },
    ] },
    // volcan : grave, menaçant, en mi mineur
    volcano: { bpm: 132, ch: [
      { w: 'sawtooth', v: 0.05, n: 'E4 E4 G4 E4 A#4/2 A4/2 | G4 F#4 E4/2 B3/4 | E4 E4 G4 B4 C5/2 B4/2 | A4 G4 F#4/2 D#4/4 | E5/2 D5 C5 B4/2 A4/2 | G4/2 A4 B4 E4/4 | C5/2 B4 A4 G4/2 F#4/2 | E4/6 -/2' },
      { w: 'triangle', v: 0.24, n: 'E2 E2 E3 E2 E2 E2 E3 E2 | C2 C2 C3 C2 B1 B1 B2 B1 | E2 E2 E3 E2 E2 E2 E3 E2 | A1 A1 A2 A1 B1 B1 B2 B1' },
    ] },
    // savane : percussive, ensoleillée, pentatonique
    savanna: { bpm: 126, ch: [
      { w: 'square', v: 0.06, n: 'A4 C5 D5/2 E5 G5 E5/2 | D5 C5 A4/2 G4/4 | A4 C5 D5/2 E5 A5 G5/2 | E5/6 -/2 | G5 E5 D5/2 C5 D5 E5/2 | A4/2 C5 D5 E5/4 | D5 C5 A4/2 G4 A4 C5/2 | A4/6 -/2' },
      { w: 'triangle', v: 0.22, n: 'A2 - A2 E3 A2 - G2 E2 | D2 - D2 A2 D2 - E2 G2 | A2 - A2 E3 A2 - G2 E2 | C3 - C3 G2 E2 - D2 E2' },
    ] },
    // ville-usine : mécanique, régulière
    factory: { bpm: 140, ch: [
      { w: 'square', v: 0.05, n: 'C5 - C5 - D#5 - C5 - | G4 - G4 - A#4 - G4 - | F4 - F4 - G#4 - G4 - | C5/2 D5/2 D#5/4 | C5 - C5 - D#5 - F5 - | G5 - F5 - D#5 - D5 - | C5 - A#4 - G#4 - G4 - | C5/6 -/2' },
      { w: 'triangle', v: 0.22, n: 'C2 C3 C2 C3 C2 C3 C2 C3 | G1 G2 G1 G2 G1 G2 G1 G2 | F1 F2 F1 F2 G1 G2 G1 G2 | C2 C3 C2 C3 C2 C3 C2 C3' },
    ] },
    // décharge : bancale et drôle
    trash: { bpm: 112, ch: [
      { w: 'square', v: 0.07, n: 'C5 - B4 C5 D#5/2 C5/2 | G4/2 - A4 B4/2 G4/2 | C5 - B4 C5 F5/2 D#5/2 | D5/6 -/2 | G5 - F5 D#5 D5/2 C5/2 | A#4/2 G4 A#4 C5/4 | D#5 D5 C5 A#4 G4/2 A#4/2 | C5/6 -/2' },
      { w: 'triangle', v: 0.2, n: 'C3/2 G2/2 C3/2 G2/2 | F2/2 C3/2 F2/2 C3/2 | C3/2 G2/2 C3/2 G2/2 | G2/2 D3/2 G2/4' },
    ] },
    // canyon : chaleur, guitare imaginaire en ré mineur
    canyon: { bpm: 96, ch: [
      { w: 'triangle', v: 0.2, n: 'D5/3 E5 F5/2 A5/2 | G5/3 F5 E5/2 C5/2 | D5/3 C5 A4/2 F4/2 | E4/6 -/2 | A4/3 D5 F5/2 E5/2 | D5/3 A#4 A4/2 G4/2 | F4/3 G4 A4/2 C#5/2 | D5/6 -/2' },
      { w: 'square', v: 0.035, n: 'D4 A4 D5 A4 D4 A4 D5 A4 | C4 G4 C5 G4 C4 G4 C5 G4 | A#3 F4 A#4 F4 A#3 F4 A#4 F4 | A3 E4 A4 E4 A3 C#4 E4 A4' },
    ] },
    // région des dinosaures : lourde, primitive
    dino: { bpm: 100, ch: [
      { w: 'sawtooth', v: 0.045, n: 'G4/2 G4 A#4 C5/2 A#4/2 | G4/2 F4 D#4 F4/4 | G4/2 G4 A#4 D5/2 C5/2 | A#4/6 -/2 | D5/2 C5 A#4 G4/2 F4/2 | D#4/2 F4 G4 A#4/4 | C5/2 A#4 G4 F4/2 D4/2 | G4/6 -/2' },
      { w: 'triangle', v: 0.26, n: 'G1/2 G2/2 G1/2 G2/2 | D#2/2 D#3/2 F2/2 F3/2 | G1/2 G2/2 G1/2 G2/2 | D2/2 D3/2 D2/4' },
    ] },
    // jungle : moite et rythmée
    jungle: { bpm: 122, ch: [
      { w: 'triangle', v: 0.2, n: 'E5 - G5 A5 - B5 A5 G5 | E5/2 D5 E5/4 | G5 - A5 B5 - D6 B5 A5 | G5/6 -/2 | A5 G5 E5/2 D5 E5 G5/2 | A5/2 B5 A5 G5/4 | E5 D5 B4/2 D5 E5 G5/2 | E5/6 -/2' },
      { w: 'square', v: 0.04, n: 'E3 - E4 - B3 - E4 B3 | A3 - A4 - E4 - A4 E4 | D3 - D4 - A3 - D4 A3 | E3 - E4 - B3 - E4 B3' },
    ] },
    // cimetière d'Overdell : lugubre, valse en la mineur
    cemetery: { bpm: 84, ch: [
      { w: 'triangle', v: 0.2, n: 'A4/3 C5/3 E5/2 | D5/3 C5/3 B4/2 | A4/3 G#4/3 B4/2 | E4/8 | A4/3 C5/3 E5/2 | F5/3 E5/3 D5/2 | C5/3 B4/3 G#4/2 | A4/8' },
      { w: 'square', v: 0.03, n: 'A3/2 E4/2 E4/2 C4/2 | D3/2 F4/2 F4/2 A3/2 | E3/2 B3/2 B3/2 G#3/2 | A3/2 E4/2 E4/4' },
    ] },
    // bois brumeux : flottant, mystérieux
    fog: { bpm: 90, ch: [
      { w: 'triangle', v: 0.18, n: 'B4/4 D5/4 | C#5/4 A4/4 | B4/2 F#5/2 E5/2 D5/2 | C#5/8 | D5/4 F#5/4 | E5/4 C#5/4 | D5/2 C#5/2 B4/2 A#4/2 | B4/8' },
      { w: 'square', v: 0.025, n: 'B3 F#4 B4 F#4 B3 F#4 B4 F#4 | A3 E4 A4 E4 A3 E4 A4 E4 | G3 D4 G4 D4 G3 D4 G4 D4 | F#3 C#4 F#4 C#4 F#3 A#3 C#4 F#4' },
    ] },
    // ville des jouets : boîte à musique
    toy: { bpm: 136, ch: [
      { w: 'triangle', v: 0.18, n: 'C6 G5 E5 G5 C6 G5 E5 G5 | D6 B5 G5 B5 D6/4 | E6 C6 G5 C6 E6 C6 G5 C6 | D6/6 -/2 | F6 C6 A5 C6 F6 C6 A5 C6 | E6 C6 G5 C6 E6/4 | D6 B5 G5 B5 D6 E6 F6 D6 | C6/6 -/2' },
      { w: 'triangle', v: 0.14, n: 'C4/4 G3/4 | G3/4 D4/4 | C4/4 G3/4 | G3/4 G3/4 | F3/4 C4/4 | C4/4 G3/4 | G3/4 G3/4 | C4/8' },
    ] },
    // terre gelée : cristalline, lente
    snow: { bpm: 92, ch: [
      { w: 'triangle', v: 0.18, n: 'E6/2 B5/2 G5/2 B5/2 | D6/4 A5/4 | C6/2 G5/2 E5/2 G5/2 | B5/8 | A5/2 C6/2 E6/2 C6/2 | B5/4 G5/4 | A5/2 F#5/2 D#5/2 F#5/2 | E5/8' },
      { w: 'square', v: 0.025, n: 'E3/4 B3/4 | D3/4 A3/4 | C3/4 G3/4 | B2/4 F#3/4 | A2/4 E3/4 | G2/4 D3/4 | B2/4 F#3/4 | E3/8' },
    ] },
    // lac, marais : eau calme ou glauque
    lake: { bpm: 100, ch: [
      { w: 'triangle', v: 0.2, n: 'F5/2 A5 C6 A5/2 G5/2 | F5/2 D5 C5 D5/4 | A#4/2 D5 F5 E5/2 D5/2 | C5/6 -/2 | F5/2 A5 C6 D6/2 C6/2 | A#5/2 A5 G5 F5/4 | G5/2 E5 C5 D5/2 E5/2 | F5/6 -/2' },
      { w: 'square', v: 0.03, n: 'F3 C4 F4 A4 F4 C4 F3 C4 | A#2 F3 A#3 D4 A#3 F3 A#2 F3 | G2 D3 G3 A#3 C3 G3 C4 E4 | F3 C4 F4 A4 F4 C4 F3 C4' },
    ] },
    swamp: { bpm: 88, ch: [
      { w: 'square', v: 0.05, n: 'D4/2 F4 G#4/2 G4 F4 D4 | C4/2 D4 F4/4 - | D4/2 F4 A4/2 G#4 G4 F4 | D4/6 -/2' },
      { w: 'triangle', v: 0.22, n: 'D2/2 A2/2 D2/2 G#2/2 | C2/2 G2/2 C2/4 | D2/2 A2/2 D2/2 G#2/2 | D2/8' },
    ] },
    // grottes et tunnel, donjons des écussons : résonant, inquiétant
    cave: { bpm: 80, ch: [
      { w: 'triangle', v: 0.18, n: 'C5/4 - D#5/2 D5/2 | C5/2 G4/2 -/4 | G#4/4 G4/2 F4/2 | G4/8 | C5/4 - D#5/2 F5/2 | G5/2 F5/2 D#5/4 | D5/2 C5/2 B4/2 D5/2 | C5/8' },
      { w: 'square', v: 0.025, n: 'C3/8 | C3/8 | G#2/8 | G2/8 | C3/8 | A#2/8 | G2/8 | C3/8' },
    ] },
    dungeon: { bpm: 108, ch: [
      { w: 'square', v: 0.05, n: 'E5 - E5 F5 G5/2 E5/2 | D5 - C5 D5 B4/4 | C5 - C5 D5 E5/2 C5/2 | A4/6 -/2 | E5 - G5 A5 B5/2 G5/2 | F5 - E5 D5 E5/4 | C5 - B4 A4 G#4/2 B4/2 | A4/6 -/2' },
      { w: 'triangle', v: 0.22, n: 'A2 A3 A2 A3 E2 E3 E2 E3 | G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 E3 E2 E3 E2 E3 G#2 B2' },
    ] },
    // pays des scarabées : vif, bourdonnant
    beetle: { bpm: 150, ch: [
      { w: 'square', v: 0.06, n: 'G5 F#5 G5 A5 B5 A5 G5 E5 | D5 E5 G5 E5 D5/4 | G5 F#5 G5 A5 B5 D6 B5 A5 | G5/6 -/2 | C6 B5 A5 G5 A5 B5 C6 A5 | B5 A5 G5 F#5 G5/4 | E5 F#5 G5 A5 B5 A5 G5 F#5 | G5/6 -/2' },
      { w: 'triangle', v: 0.2, n: 'G2 D3 G3 D3 G2 D3 G3 D3 | C3 G3 C4 G3 D3 A3 D4 A3 | G2 D3 G3 D3 G2 D3 G3 D3 | C3 G3 D3 A3 G2 D3 G3 B3' },
    ] },
  });
  // région → musique (les régions sans entrée gardent la musique de leur carte)
  DW.REGION_MUSIC = {
    foret: 'forest', montagne: 'mountain', volcan: 'volcano', savane: 'savanna', usine: 'factory', decharge: 'trash',
    canyon: 'canyon', dino: 'dino', jungle: 'jungle', overdell: 'cemetery', brumes: 'fog', jouets: 'toy', gel: 'snow',
    lac: 'lake', marais: 'swamp', tunnel: 'cave', scarabees: 'beetle',
  };
})();
