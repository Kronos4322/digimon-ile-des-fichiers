'use strict';
// =====================================================================
//  ÉLÉMENTS & ATTRIBUTS
// =====================================================================
(function () {
  // ------------------------------------------------------------ éléments
  DW.TYPES = {
    'Neutre': { c: '#9a9488' }, 'Feu': { c: '#e8542c' }, 'Eau': { c: '#2f86e8' },
    'Plante': { c: '#3fae46' }, 'Électrique': { c: '#e0b414' }, 'Glace': { c: '#4cc0d8' },
    'Terre': { c: '#a8783c' }, 'Air': { c: '#7c94e8' }, 'Insecte': { c: '#8aa818' },
    'Lumière': { c: '#d8c050' }, 'Ténèbres': { c: '#6a4a7a' },
  };
  const EFF = DW.EFF = {};
  const set = (a, list, m) => list.forEach(d => ((EFF[a] = EFF[a] || {})[d] = m));
  set('Feu', ['Plante', 'Glace', 'Insecte'], 2); set('Feu', ['Eau', 'Terre', 'Feu'], 0.5);
  set('Eau', ['Feu', 'Terre'], 2); set('Eau', ['Eau', 'Plante'], 0.5);
  set('Plante', ['Eau', 'Terre'], 2); set('Plante', ['Feu', 'Plante', 'Air', 'Insecte'], 0.5);
  set('Électrique', ['Eau', 'Air'], 2); set('Électrique', ['Électrique', 'Plante', 'Terre'], 0.5);
  set('Glace', ['Plante', 'Air', 'Terre'], 2); set('Glace', ['Feu', 'Eau', 'Glace'], 0.5);
  set('Terre', ['Feu', 'Électrique'], 2); set('Terre', ['Plante', 'Air'], 0.5);
  set('Air', ['Plante', 'Insecte'], 2); set('Air', ['Électrique', 'Terre'], 0.5);
  set('Insecte', ['Plante', 'Ténèbres'], 2); set('Insecte', ['Feu', 'Air'], 0.5);
  set('Lumière', ['Ténèbres'], 2); set('Lumière', ['Lumière'], 0.5);
  set('Ténèbres', ['Lumière'], 2); set('Ténèbres', ['Ténèbres'], 0.5);
  // efficacité adoucie (façon Digimon World : l'élément aide, mais ne décide pas tout seul du combat)
  // avantage ×1,5, désavantage ×0,7 par type du défenseur ; total borné entre ×0,5 et ×1,8 (mesuré au simulateur)
  DW.typeMult = (atk, defTypes) => DW.clamp(defTypes.reduce((m, t) => { const f = (EFF[atk] && EFF[atk][t]) || 1; return m * (f > 1 ? 1.5 : f < 1 ? 0.7 : 1); }, 1), 0.5, 1.8);

  // Triangle d'attributs (Digimon) : Vaccin > Virus > Données > Vaccin
  DW.ATTR_ADV = { 'Vaccin': 'Virus', 'Virus': 'Données', 'Données': 'Vaccin' };

  // statuts de combat
  DW.STATUS_NAME = { brn: 'BRÛ', psn: 'PSN', par: 'PAR', slp: 'SOM' };
  DW.STATUS_COL = { brn: '#e8602c', psn: '#9a48c0', par: '#d0b018', slp: '#8090a8' };
})();
