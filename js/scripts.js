'use strict';
// =====================================================================
//  LISTE UNIQUE DES SCRIPTS DU JEU, dans l'ordre de chargement
//  index.html et les pages de dev/ chargent seulement ce fichier :
//    <script src="js/scripts.js"></script>
//    <script src="../js/scripts.js" data-sans-main></script>   (outils : tout sauf main.js)
//  Ajouter un fichier au jeu = l'ajouter ICI (et nulle part ailleurs).
//  Les tests (dev/tests.js, Node) lisent aussi cette liste.
// =====================================================================
(function () {
  const LIST = [
    // moteur : boucle et scènes, clavier/manette/tactile, audio, rendu des volumes
    'engine/core.js', 'engine/input.js', 'engine/audio.js', 'engine/art.js',
    // interface de base : widgets et dialogues
    'ui/widgets.js', 'ui/dialog.js',
    // données du jeu
    'data/types.js', 'data/moves.js', 'data/species.js', 'data/species2.js', 'data/evolutions.js', 'data/items.js',
    'data/music.js', 'data/flags.js',
    // graphismes
    'gfx/sprites.js',
    'gfx/digimon/entrainement.js', 'gfx/digimon/disciples.js', 'gfx/digimon/champions.js', 'gfx/digimon/ultimes.js',
    'gfx/digimon/ultimes2.js', 'gfx/digimon/ile.js', 'gfx/digimon/agumon.js', 'gfx/digimon/bebes.js',
    'gfx/hero.js', 'gfx/icons.js', 'gfx/objects.js', 'gfx/town.js', 'gfx/district.js', 'gfx/themes.js',
    'gfx/interior.js', 'gfx/nursery.js', 'gfx/biomes.js', 'gfx/sites.js', 'gfx/terrain.js', 'gfx/ambient.js',
    'gfx/battlebg.js', 'engine/time.js',
    // logique de jeu
    'game/options.js', 'game/monster.js', 'game/training.js', 'game/care.js', 'game/life.js', 'game/autoevo.js',
    'game/companion.js', 'game/wild.js', 'game/town.js', 'game/fx.js', 'game/battle.js', 'game/evolution.js',
    'game/overworld.js',
    // écrans et menus
    'ui/menus.js', 'ui/status.js', 'ui/evotable.js', 'ui/learn.js', 'ui/hatch.js', 'ui/farm.js', 'ui/worldmap.js',
    'ui/title.js', 'ui/intro.js', 'ui/touch.js',
    // cartes et scénario (un fichier par région)
    'maps/common.js', 'maps/foret.js', 'maps/plage.js', 'maps/village.js', 'maps/maison.js', 'maps/interieurs.js',
    'maps/champs.js', 'maps/gym.js', 'maps/berceau.js', 'maps/regions.js',
    'game/activities.js', 'game/story.js',
    // démarrage
    'main.js',
  ];
  if (typeof document === 'undefined') { module.exports = LIST; return; } // lu par les tests Node

  // document.write garde l'ordre d'exécution ET passe avant les scripts suivants de la page
  // (ex. checkmaps.js ou le script de la galerie), ce que ne garantit pas un ajout dynamique.
  const me = document.currentScript, base = me.src.replace(/scripts\.js(\?.*)?$/, '');
  const noMain = me.hasAttribute('data-sans-main');
  for (const f of LIST) if (!(noMain && f === 'main.js')) document.write(`<script src="${base}${f}"></` + 'script>');
})();
