# -*- coding: utf-8 -*-
"""COPIES ALLÉGÉES DES TEXTURES DESSINÉES (pour le téléphone et le site)

Les images fabriquées avec ChatGPT font souvent 1000 à 1800 px et 2 à 3 Mo chacune.
Ce script en fait des copies à 4 fois la taille du jeu (assez fin pour la haute définition), dans
assets/<dossier>/jeu/<nom>.png. Le jeu charge ces copies d'abord (js/gfx/textures.js), l'original sinon.
Les originaux ne sont jamais modifiés.

    python dev/optimiser_textures.py            (tous les dossiers d'assets connus)

PLANCHES (plusieurs objets par image, sur fond vert) : une entrée (fichier, numéro) prend le n-ième objet de la
planche, dans l'ordre de lecture (rangées de haut en bas, puis de gauche à droite) ; (fichier, [a, b]) réunit deux
morceaux. Le fond vert est enlevé et le liseré vert des bords neutralisé (numpy et scipy nécessaires).
"""
import os, sys
from PIL import Image

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
# même table que TAILLE dans js/gfx/textures.js (pixels du jeu, 1 case = 16) ; copie = 4 fois plus grande
TAILLE = {
    'sol_cendres': (128, 128), 'dessus_falaise': (176, 176), 'lave': (128, 128),
    'falaise_basalte': (80, 64), 'paroi_cratere': (80, 64), 'escalier': (48, 64),
    'pic_1': {'h': 34}, 'pic_2': {'h': 30}, 'pic_3': {'h': 32}, 'rocher_magma': {'w': 24}, 'fumerolle': {'w': 18}, 'cone_lave': {'w': 26},
    'plante_feu_1': {'h': 16}, 'plante_feu_2': {'h': 14}, 'plante_feu_3': {'h': 16},
}
K = 4
DOSSIERS = ['volcan']
# images restées sous le nom donné par ChatGPT : nom du jeu -> fichier (sinon <nom>.png)
NOMS = {
    'volcan': {
        'fumerolle': 'Image ChatGPT 19 oct. 2026, 00_08_57-1.png',
        'cone_lave': 'Image ChatGPT 19 oct. 2026, 00_08_58-2.png',
        'plante_feu_1': 'Image ChatGPT 19 oct. 2026, 00_08_59-3.png',
        'plante_feu_2': 'Image ChatGPT 19 oct. 2026, 00_09_00-4.png',
        'plante_feu_3': 'Image ChatGPT 19 oct. 2026, 00_09_01-5.png',
        'paroi_cratere': 'Image ChatGPT 19 oct. 2026, 00_09_02-6.png',
    },
}


def optimiser(dossier):
    src = os.path.join(RACINE, dossier)
    dst = os.path.join(src, 'jeu')
    os.makedirs(dst, exist_ok=True)
    for nom, t in TAILLE.items():
        f = os.path.join(src, nom + '.png')
        if not os.path.exists(f) and NOMS.get(dossier, {}).get(nom):
            f = os.path.join(src, NOMS[dossier][nom])
        if not os.path.exists(f):
            continue
        im = Image.open(f).convert('RGBA')
        if isinstance(t, dict):   # objet : recadré sur son contenu, puis mis à l'échelle
            box = im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
            if box:
                im = im.crop(box)
            w, h = im.size
            if 'h' in t:
                H = t['h'] * K; W = round(H * w / h)
            else:
                W = t['w'] * K; H = round(W * h / w)
        else:
            W, H = t[0] * K, t[1] * K
        out = im.resize((W, H), Image.LANCZOS)
        cible = os.path.join(dst, nom + '.png')
        out.save(cible, optimize=True)
        print('%-18s %5dx%-5d -> %4dx%-4d  %4d Ko' % (nom, im.size[0], im.size[1], W, H, os.path.getsize(cible) // 1024))


# ---------------------------------------------------------------- DOSSIER COMMUN (tout le jeu) : les assets maison du
# joueur, rangés dans assets/ASSETS - Digimon. Sols et eaux : textures qui se répètent (128 px du jeu) ; arbres :
# fond noir enlevé, recadrés, posés dans le cadre des arbres du jeu (36 x 46, agrandi 1,55 fois en jeu).
# (le dossier est rangé dans le jeu : assets/ASSETS - Digimon ; ses originaux ne vont pas sur GitHub, seules les copies jeu/)
SOURCE_COMMUN = os.path.join(RACINE, 'ASSETS - Digimon')
H = 'Texture herbe/'; S = 'Sables et terre/'; E = 'eau/'; A = 'Arbres/'
COMMUN = {
    # sols (128 x 128 px du jeu = 8 x 8 cases)
    'herbe_claire': H + '06df2b66-7197-43d1-9809-5d6edd75cd24.png', 'herbe_verte': H + '25d82adf-577d-4baa-98d7-e3afb459b534.png',
    'sable_terre': H + '6114858b-6758-49c2-9ec3-a76ce320868a.png', 'herbe_seche': H + '6eeddf93-bc5f-4604-b80e-e87feef1eadc.png',
    'herbe_fleurie': H + '7e3d6c5b-2771-4681-a98a-e58be5665c1f.png', 'herbe_dense': H + 'b3425793-a4bc-4161-9eed-c5cba141b759.png',
    'terre_claire': H + 'bc05cedd-48da-4256-8cba-95fdd647e538.png', 'herbe_haute': H + 'bc2fa687-b132-4c6e-a518-5488c382a96e.png',
    'herbe_terre': H + 'ca78ae01-01ed-4a43-b31b-173f02e83bb3.png',
    'sable_dunes': S + 'photo_2026-10-19_07-14-33.jpg', 'terre_brune': S + 'photo_2026-10-19_07-14-34.jpg', 'terre_sombre': S + 'photo_2026-10-19_07-14-35.jpg',
    'sable_plage': S + 'photo_2026-10-19_07-14-36.jpg', 'terre_savane': S + 'photo_2026-10-19_07-14-38 (2).jpg', 'terre_cailloux': S + 'photo_2026-10-19_07-14-38 (3).jpg',
    'terre_craquelee': S + 'photo_2026-10-19_07-14-38.jpg', 'sable_desert': S + 'photo_2026-10-19_07-14-39.jpg',
    'eau_mer': E + 'photo_2026-10-19_07-14-33 (2).jpg', 'eau_douce': E + 'photo_2026-10-19_07-14-33.jpg',
    # arbres (fond noir)
    'arbre_sapin': A + 'photo_2026-10-19_07-14-21.jpg', 'arbre_cerisier': A + 'photo_2026-10-19_07-14-24 (2).jpg', 'arbre_chene_clair': A + 'photo_2026-10-19_07-14-24.jpg',
    'arbre_saule': A + 'photo_2026-10-19_07-14-26.jpg', 'arbre_mauve': A + 'photo_2026-10-19_07-14-27 (2).jpg', 'arbre_chene': A + 'photo_2026-10-19_07-14-27 (3).jpg',
    'arbre_vert': A + 'photo_2026-10-19_07-14-27.jpg', 'arbre_vert_vif': A + 'photo_2026-10-19_07-14-31 (2).jpg', 'arbre_bouleau': A + 'photo_2026-10-19_07-14-31.jpg',
    'arbre_fleurs': A + 'photo_2026-10-19_07-14-32.jpg', 'arbre_automne_brun': A + 'photo_2026-10-19_07-17-30 (2).jpg', 'arbre_erable_orange': A + 'photo_2026-10-19_07-17-30.jpg',
    'arbre_erable_rouge': A + 'photo_2026-10-19_07-17-31 (2).jpg', 'arbre_bouleau_automne': A + 'photo_2026-10-19_07-17-31 (5).jpg', 'arbre_mi_automne': A + 'photo_2026-10-19_07-17-31 (8).jpg', 'arbre_chene_automne': A + 'photo_2026-10-19_07-17-31.jpg',
    # arbres enneigés
    'arbre_neige_tordu': A + 'photo_2026-10-19_07-26-51 (2).jpg', 'arbre_neige_bouleau': A + 'photo_2026-10-19_07-26-51.jpg', 'arbre_neige_rond': A + 'photo_2026-10-19_07-26-52 (3).jpg', 'arbre_neige_chene': A + 'photo_2026-10-19_07-26-52 (4).jpg', 'arbre_neige_sapin': A + 'photo_2026-10-19_07-26-52.jpg',
    'arbre_neige_sapin3': A + 'photo_2026-10-19_07-26-53 (3).jpg', 'arbre_neige_nu': A + 'photo_2026-10-19_07-26-53.jpg',
    # décors (fond noir) : buissons, champignons, fleurs, fougères, rocher, objets de forêt
    'buisson_fleuri': 'Buissons/1photo_2026-10-19_07-40-27.jpg', 'buisson_baies': 'Buissons/photo_2026-10-19_07-30-07.jpg',
    'buisson_baies2': 'Buissons/photo_2026-10-19_07-40-26.jpg', 'buisson': 'Buissons/photo_2026-10-19_07-40-27.jpg', 'amanites': 'Champignons/photo_2026-10-19_07-30-08 (2).jpg',
    'fleur_1': 'Fleurs/photo_2026-10-19_07-30-06.jpg', 'fleur_2': 'Fleurs/photo_2026-10-19_07-30-09 (2).jpg', 'fleur_3': 'Fleurs/photo_2026-10-19_07-30-09 (3).jpg',
    'fleur_4': 'Fleurs/photo_2026-10-19_07-30-09.jpg', 'fleur_5': 'Fleurs/photo_2026-10-19_07-30-10 (2).jpg', 'fleur_6': 'Fleurs/photo_2026-10-19_07-30-10 (3).jpg',
    'fleur_7': 'Fleurs/photo_2026-10-19_07-30-10 (4).jpg', 'fleur_8': 'Fleurs/photo_2026-10-19_07-30-10 (5).jpg', 'fleur_9': 'Fleurs/photo_2026-10-19_07-30-10.jpg',
    'fleur_10': 'Fleurs/photo_2026-10-19_07-30-11.jpg', 'fougere_1': 'Fougère/photo_2026-10-19_07-30-07.jpg', 'fougere_2': 'Fougère/photo_2026-10-19_07-40-27 (2).jpg',
    'tronc_couche': 'Objet foret/arbre mort 1.jpg', 'panneau': 'Objet foret/panneau direction.jpg', 'racines': 'Objet foret/photo_2026-10-19_07-30-07 (2).jpg',
    'monolithe': 'Objet foret/photo_2026-10-19_07-40-28.jpg', 'sanctuaire': 'Objet foret/photo_2026-10-19_07-40-29.jpg',
    'totem': 'Objet foret/photo_2026-10-19_07-40-30 (2).jpg', 'fleur_cristal': 'Objet foret/photo_2026-10-19_07-40-31 (2).jpg',
    'cristaux': 'Objet foret/photo_2026-10-19_07-40-31 (4).jpg', 'souche': 'Objet foret/souche1.jpg',
    'source': 'Objet foret/source magique .jpg', 'rocher_mousse': 'Rocher/photo_2026-10-19_07-30-08.jpg',
    # champignons et objets (2e envoi)
    'amanites2': 'Champignons/photo_2026-10-19_07-40-31.jpg', 'champi_violet': 'Champignons/photo_2026-10-19_07-40-32 (2).jpg', 'champi_bleu': 'Champignons/photo_2026-10-19_07-40-32.jpg',
    'cepes': 'Champignons/photo_2026-10-19_08-45-48 (2).jpg', 'girolles': 'Champignons/photo_2026-10-19_08-45-48 (4).jpg',
    'rond_sorcieres': 'Champignons/photo_2026-10-19_08-45-48 (5).jpg', 'souche_champignons': 'Champignons/photo_2026-10-19_08-45-48.jpg', 'champi_blancs': 'Champignons/photo_2026-10-19_08-45-49 (2).jpg',
    'champi_vert': 'Champignons/photo_2026-10-19_08-45-49.jpg',
    'tuyau': 'Objet foret/photo_2026-10-19_11-07-26 (2).jpg', 'pierre_runique': 'Objet foret/photo_2026-10-19_11-07-26 (4).jpg',
    'cairn': 'Objet foret/photo_2026-10-19_11-07-27 (2).jpg', 'eboulis': 'Objet foret/photo_2026-10-19_11-07-27 (3).jpg',
    'lanterne_pierre': 'Objet foret/photo_2026-10-19_11-07-27 (4).jpg', 'borne_bleue': 'Objet foret/photo_2026-10-19_11-07-27 (5).jpg', 'borne_rouge': 'Objet foret/photo_2026-10-19_11-07-27 (6).jpg',
    'banc_simple': 'Mobiliers exterieurs/photo_2026-10-19_11-19-18 (2).jpg', 'table_ronde': 'Mobiliers exterieurs/photo_2026-10-19_11-19-18 (3).jpg', 'banc_courbe': 'Mobiliers exterieurs/photo_2026-10-19_11-19-18 (4).jpg',
    'banc_dossier': 'Mobiliers exterieurs/photo_2026-10-19_11-19-18 (5).jpg', 'banc_rondin': 'Mobiliers exterieurs/photo_2026-10-19_11-19-18 (6).jpg', 'table_souche': 'Mobiliers exterieurs/photo_2026-10-19_11-19-18 (7).jpg', 'banc_mousse': 'Mobiliers exterieurs/photo_2026-10-19_11-19-18 (8).jpg',
    'table_rect': 'Mobiliers exterieurs/photo_2026-10-19_11-19-18.jpg', 'table_banquet': 'Mobiliers exterieurs/photo_2026-10-19_11-19-19 (2).jpg', 'table_pique_nique': 'Mobiliers exterieurs/photo_2026-10-19_11-19-19.jpg',
    'dalle_runique': 'Objet foret/photo_2026-10-19_11-07-27.jpg',
}
# planches (fond vert) : MOBILIER URBAIN (ville_) et MOBILIER D'INTÉRIEUR (maison_), seulement les objets vus de face
# (règle du joueur : un objet vu de biais garde l'ancien dessin)
_U = lambda n: 'Mobiliers urbains/photo_2026-10-19_18-08-' + n + '.jpg'
_I = lambda n: 'Mobiliers intérieurs/photo_2026-10-19_' + n + '.jpg'
COMMUN.update({
    'ville_fontaine_vasque': (_U('51 (2)'), 0), 'ville_fontaine_octogone': (_U('51 (2)'), 2),
    'ville_puits_treuil': (_U('51 (2)'), 4), 'ville_fontaine_etages': (_U('51 (2)'), 8),
    'ville_tonneaux': (_U('51'), 5), 'ville_sacs': (_U('51'), 6),
    'ville_pot_arbuste': (_U('52 (4)'), 3), 'ville_buis': (_U('52 (4)'), 5),
    'maison_tableau': (_I('18-08-58 (2)'), 0), 'maison_vase_fleurs': (_I('18-08-58 (2)'), 1),
    'maison_lit': (_I('18-08-59 (2)'), 0), 'maison_chevet': (_I('18-08-59 (2)'), 2), 'maison_armoire': (_I('18-08-59 (2)'), 3),
    'maison_tabouret': (_I('18-08-59 (2)'), 6), 'maison_coffre_jouets': (_I('18-08-59 (2)'), 7), 'maison_etagere_murale': (_I('18-08-59 (2)'), 9),
    'maison_bureau': (_I('18-08-59 (3)'), 0), 'maison_bibliotheque': (_I('18-08-59 (3)'), 2),
    'maison_tapis': (_I('18-08-59'), 5),
    'maison_bibliotheque_basse': (_I('18-08-59'), 6), 'maison_lampadaire': (_I('18-08-59'), 7), 'maison_plante': (_I('18-08-59'), 8),
    'maison_coussins': (_I('18-09-00 (2)'), 5),
    'maison_frigo': (_I('18-09-00'), 4), 'maison_tonneau': (_I('18-09-00'), 8),
})
# planche MONTAGNES (mont_) : plantes, rochers, entrée de grotte ; sols (carreaux rendus raccordables : SOLS_PLANCHE)
_M = lambda n: 'Montagnes/photo_2026-10-19_18-08-' + n + '.jpg'
COMMUN.update({
    'mont_sapin': (_M('57 (2)'), 1), 'mont_buisson': (_M('57 (2)'), 2), 'mont_arbuste_sec': (_M('57 (2)'), 3), 'mont_herbes_hautes': (_M('57 (2)'), 4),
    'mont_herbes_seches': (_M('57 (2)'), 5), 'mont_herbe_rousse': (_M('57 (2)'), 6), 'mont_edelweiss': (_M('57 (2)'), 7), 'mont_fleurs_violettes': (_M('57 (2)'), 8),
    'mont_buisson_baies': (_M('57 (2)'), 9),
    'mont_grotte': (_M('57 (3)'), 5),
    'mont_petit_rocher': (_M('57'), 0), 'mont_rocher': (_M('57'), 1), 'mont_gros_rocher': (_M('57'), 2), 'mont_aiguille': (_M('57'), 4),
    'mont_eboulis_gros': (_M('57'), 5), 'mont_rocher_mousse': (_M('57'), 6), 'mont_eboulis': (_M('57'), 7), 'mont_cairn': (_M('57'), 8),
    'mont_gravier': (_M('55 (2)'), 2), 'mont_herbe_alpine': (_M('55 (2)'), 6), 'mont_terre_seche': (_M('55 (2)'), 7),
})
COMMUN.update({
    'maison_aquarium': (_I('18-08-58 (2)'), 5), 'maison_ordinateur': (_I('18-08-59 (3)'), 3), 'maison_cuisiniere': (_I('18-09-00'), 3),
    'ville_lampadaire_noir': (_U('53 (4)'), 0), 'ville_paves': (_U('52 (3)'), 0),
})
# (pavés : un motif régulier ; rendu raccordable en miroir, sans fondu qui doublerait les joints)
SOLS_MIROIR = {'ville_paves'}
# (PERSONNAGES : le kit d'habillage du joueur est fait par dev/kit_persos.py)
ECHELLE = {}   # (échelle imposée d'un objet, au lieu de sa taille maximale)
# planches PLAGE : rochers, arche, herbes de dune, coquillages, mares, palmiers, bois flotté, château de sable, barque, radeau, sables
_PL = lambda n: 'PLAGE/photo_2026-10-20_00-17-' + n + '.jpg'
COMMUN.update({
    'plage_rocher': (_PL('46 (3)'), 3),
    'plage_rochers': (_PL('46 (3)'), 2),
    'plage_pile_rochers': (_PL('46 (3)'), 9),
    'plage_arche': (_PL('46 (3)'), 7),
    'plage_herbe_dune': (_PL('46'), 0),
    'plage_herbe_seche': (_PL('46'), 1),
    'plage_conque': (_PL('47 (2)'), 0),
    'plage_escargot': (_PL('47 (2)'), 1),
    'plage_coquille': (_PL('47 (2)'), 2),
    'plage_etoile': (_PL('47 (2)'), 3),
    'plage_mare': (_PL('47 (2)'), 6),
    'plage_palmier': (_PL('47 (4)'), 0),
    'plage_palmier_courbe': (_PL('47 (4)'), 1),
    'plage_palmier_double': (_PL('47 (4)'), 2),
    'plage_bois_flotte': (_PL('47 (5)'), 0),
    'plage_bois_flotte2': (_PL('47 (5)'), 1),
    'plage_chateau': (_PL('46 (2)'), 0),
    'plage_barque': (_PL('46 (4)'), 2),
    'plage_radeau': (_PL('46 (4)'), 0),
    'plage_sable': (_PL('47'), 0), 'plage_borne': (_PL('47 (6)'), 9),
})
# planche à PANNEAUX (Mobiliers exterieurs, 10 catégories en 5 x 2, bandeau de titre) : ('panneau', catégorie, n°)
_E = 'Mobiliers exterieurs/photo_2026-10-19_23-15-35.jpg'
COMMUN.update({
    'ext_caisse': (_E, ('panneau', 2, 0)), 'ext_caisse2': (_E, ('panneau', 2, 1)),
    'ext_distrib_rouge': (_E, ('panneau', 4, 0)), 'ext_distrib_bleu': (_E, ('panneau', 4, 1)), 'ext_distrib_blanc': (_E, ('panneau', 4, 2)),
    'ext_boite_lettres': (_E, ('panneau', 1, 6)), 'ext_toilettes': (_E, ('panneau', 5, 1)),
    'ext_jardiniere_verte': (_E, ('panneau', 3, 0)), 'ext_jardiniere_blanche': (_E, ('panneau', 3, 1)), 'ext_jardiniere_rose': (_E, ('panneau', 3, 2)),
    'ext_etal_fruits': (_E, ('panneau', 8, 1)), 'ext_etal_legumes': (_E, ('panneau', 8, 2)), 'ext_etal_pain': (_E, ('panneau', 8, 3)),
    'ext_puits': (_E, ('panneau', 9, 3)), 'ext_panneau': (_E, ('panneau', 1, 8)),
})
SOLS_PLANCHE = {'mont_gravier', 'mont_herbe_alpine', 'mont_terre_seche', 'plage_sable'}
# planches SPORT (fond vert, 5 x 2 appareils par planche : cases()) : le matériel d'entraînement retenu pour le jeu
# (Terrain d'entraînement, Gymnase de Leomon, salle de classe : gfx/sport.js) ; les autres appareils attendent dans le dossier
_SP = lambda n: 'SPORT/photo_2026-10-20_11-39-' + n + '.jpg'
COMMUN.update({
    'sport_pilier_cristal': (_SP('57'), ('case', 1)),
    'sport_mannequin_cible': (_SP('57 (2)'), ('case', 0)), 'sport_rocher_socle': (_SP('57 (2)'), ('case', 1)), 'sport_mur_soleil': (_SP('57 (2)'), ('case', 2)),
    'sport_bobine_foudre': (_SP('57 (3)'), ('case', 0)), 'sport_portail_vent': (_SP('57 (3)'), ('case', 1)), 'sport_rocher_suspendu': (_SP('57 (3)'), ('case', 2)),
    'sport_portail_ombre': (_SP('57 (3)'), ('case', 5)),
    'sport_sac_frappe': (_SP('58'), ('case', 1)), 'sport_pneus': (_SP('58'), ('case', 2)), 'sport_traineau': (_SP('58'), ('case', 4)), 'sport_epouvantail': (_SP('58'), ('case', 9)),
    'sport_glace_bain': (_SP('58 (2)'), ('case', 9)),
    'sport_eau_cascade': (_SP('58 (3)'), ('case', 4)),
    'sport_int_memoire': (_SP('58 (4)'), ('case', 3)), 'sport_int_telescope': (_SP('58 (4)'), ('case', 4)), 'sport_int_formes': (_SP('58 (4)'), ('case', 6)),
    'sport_def_boucliers': (_SP('58 (5)'), ('case', 0)), 'sport_def_mannequin_bois': (_SP('58 (5)'), ('case', 5)),
    'sport_feu_anneau': (_SP('58 (6)'), ('case', 4)),
    'sport_vit_haies': (_SP('59'), ('case', 0)), 'sport_vit_slalom': (_SP('59'), ('case', 1)),
})
# taille maximale de la copie (plus grand côté) pour les grands objets des planches ; sinon 160 px
GRAND = {'plage_palmier': 220, 'plage_palmier_courbe': 220, 'plage_palmier_double': 220, 'plage_arche': 200, 'mont_sapin': 220, 'mont_grotte': 200, 'ville_fontaine_etages': 200, 'ville_fontaine_vasque': 200, 'ville_fontaine_octogone': 200}
GRAND.update({n: 200 for n in COMMUN if n.startswith('sport_')})   # (nets aussi quand la séance zoome sur le poste)
SOLS_COMMUN = {'herbe_claire', 'herbe_verte', 'sable_terre', 'herbe_seche', 'herbe_fleurie', 'herbe_dense', 'terre_claire', 'herbe_haute', 'herbe_terre', 'sable_dunes',
               'terre_brune', 'terre_sombre', 'sable_plage', 'terre_savane', 'terre_cailloux', 'terre_craquelee', 'sable_desert', 'eau_mer', 'eau_douce'}


def detourer(im):
    """Fond noir -> transparent : tout le noir RELIÉ AU BORD de l'image (les creux sombres du feuillage restent)."""
    from collections import deque
    im = im.convert('RGBA'); w, h = im.size; px = im.load()
    lum = lambda p: (p[0] * 3 + p[1] * 6 + p[2]) / 10
    vu = bytearray(w * h); q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft(); i = y * w + x
        if vu[i]:
            continue
        p = px[x, y]
        if lum(p) > 34:
            continue
        vu[i] = 1; px[x, y] = (p[0], p[1], p[2], 0)
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    # trous de fond enfermés entre les branches (arbres nus) : le noir presque pur disparaît aussi, partout
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3] and max(p[0], p[1], p[2]) < 26:
                vu[y * w + x] = 1; px[x, y] = (p[0], p[1], p[2], 0)
    # bord adouci : un pixel sombre collé au fond devient à moitié transparent (plus de liseré noir de JPEG)
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            p = px[x, y]
            if p[3] and lum(p) < 70 and (vu[y * w + x - 1] or vu[y * w + x + 1] or vu[(y - 1) * w + x] or vu[(y + 1) * w + x]):
                px[x, y] = (p[0], p[1], p[2], int(255 * max(0.0, (lum(p) - 34) / 36)))
    return im


_PLANCHES = {}
def planche(f):
    """Objets d'une planche sur fond vert, en RGBA recadrés, dans l'ordre de lecture (mis en mémoire pour ce passage)."""
    if f in _PLANCHES: return _PLANCHES[f]
    import numpy as np
    from scipy import ndimage
    a = np.array(Image.open(f).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fond = (g > 150) & (g - np.maximum(r, b) > 70)
    obj = ndimage.binary_opening(~fond, iterations=1)
    lab, n = ndimage.label(ndimage.binary_dilation(obj, iterations=2))
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        aire = int((obj[sl] & (lab[sl] == i + 1)).sum())
        if aire >= 60: comps.append([sl[0].start, sl[1].start, sl[0].stop, sl[1].stop, aire])
    # petits morceaux détachés (lueur, guirlande, brin) : rattachés à l'objet le plus proche
    med = float(np.median([c[4] for c in comps]))
    grands = [c for c in comps if c[4] >= med * 0.12]
    for c in comps:
        if c in grands: continue
        cy, cx = (c[0] + c[2]) / 2, (c[1] + c[3]) / 2
        d = lambda q: max(0, q[1] - cx, cx - q[3]) + max(0, q[0] - cy, cy - q[2])
        q = min(grands, key=d)
        if d(q) < 60: q[0], q[1], q[2], q[3] = min(q[0], c[0]), min(q[1], c[1]), max(q[2], c[2]), max(q[3], c[3])
    # deux objets collés (boîte bien trop large) : coupés à la colonne la plus vide du milieu
    lw = float(np.median([q[3] - q[1] for q in grands])); boites = []
    for q in grands:
        y0, x0, y1, x1 = q[:4]
        if x1 - x0 > lw * 1.6:
            prof = obj[y0:y1, x0:x1].sum(0); m0, m1 = int((x1 - x0) * 0.3), int((x1 - x0) * 0.7)
            cut = x0 + m0 + int(np.argmin(prof[m0:m1]))
            for a0, a1 in ((x0, cut), (cut, x1)):
                ys = np.where(obj[y0:y1, a0:a1].any(1))[0]
                if len(ys): boites.append((y0 + ys[0], a0, y0 + ys[-1] + 1, a1))
        else: boites.append((y0, x0, y1, x1))
    boites.sort(key=lambda q: (q[0] + q[2]) / 2)
    rangs, cur = [], []
    for q in boites:
        if cur and (q[0] + q[2]) / 2 - (cur[-1][0] + cur[-1][2]) / 2 > (cur[-1][2] - cur[-1][0]) * 0.5: rangs.append(cur); cur = []
        cur.append(q)
    if cur: rangs.append(cur)
    ordre = [q for rg in rangs for q in sorted(rg, key=lambda q: q[1])]
    # fond transparent ; liseré vert des bords (JPEG) neutralisé : le vert ne dépasse plus le rouge et le bleu
    alpha = np.where(obj, 255, 0)
    bord = ndimage.binary_dilation(~obj, iterations=3) & obj
    gmax = np.maximum(r, b) + 8
    g2 = np.where(bord & (g > gmax), gmax, g)
    rgba = np.dstack([r, g2, b, alpha]).clip(0, 255).astype('uint8')
    im = Image.fromarray(rgba, 'RGBA')
    _PLANCHES[f] = (im, ordre)
    return _PLANCHES[f]


def raccordable(im, n=256):
    """Carreau de sol d'une planche -> texture qui se répète sans couture : le bord irrégulier est rogné, puis le carreau
    est fondu avec lui-même décalé d'une demi-taille (au bord, c'est le milieu du carreau qui se raccorde)."""
    import numpy as np
    w, h = im.size; m = int(min(w, h) * 0.09)
    a = np.array(im.convert('RGB').crop((m, m, w - m, h - m)).resize((n, n), Image.LANCZOS)).astype(float)
    b = np.roll(np.roll(a, n // 2, 0), n // 2, 1)
    t = np.minimum(np.arange(n), n - 1 - np.arange(n)) / (n / 2)
    k = np.clip(np.minimum.outer(t, t) * 2.2, 0, 1)[..., None]
    return Image.fromarray((a * k + b * (1 - k)).astype('uint8'), 'RGB')


def miroir(im, n=256):
    """Carreau à motif régulier (pavés) -> texture raccordable : bord irrégulier rogné, puis 2 x 2 copies en miroir."""
    w, h = im.size; m = int(min(w, h) * 0.09); half = n // 2
    a = im.convert('RGB').crop((m, m, w - m, h - m)).resize((half, half), Image.LANCZOS)
    out = Image.new('RGB', (n, n)); fx = a.transpose(Image.FLIP_LEFT_RIGHT)
    out.paste(a, (0, 0)); out.paste(fx, (half, 0)); out.paste(a.transpose(Image.FLIP_TOP_BOTTOM), (0, half)); out.paste(fx.transpose(Image.FLIP_TOP_BOTTOM), (half, half))
    return out


_PANNEAUX = {}
def panneau(f, p, cols=5, rows=2, titre=0.075):
    """Objets d'un panneau (catégorie) d'une planche à panneaux, en RGBA recadrés, dans l'ordre de lecture du panneau."""
    if (f, p) in _PANNEAUX: return _PANNEAUX[(f, p)]
    import numpy as np
    from scipy import ndimage
    im = Image.open(f).convert('RGB'); W, H = im.size; pw, ph = W / cols, H / rows
    x0, y0 = int((p % cols) * pw), int((p // cols) * ph)
    a = np.array(im.crop((x0, y0, int(x0 + pw), int(y0 + ph)))).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    obj = ~((g > 140) & (g - np.maximum(r, b) > 60))
    obj[:int(ph * titre) + 4] = False; obj[:, :6] = False; obj[:, -6:] = False; obj[-6:] = False   # (bandeau de titre, cadre)
    obj = ndimage.binary_opening(obj, iterations=2)
    lab, n = ndimage.label(ndimage.binary_dilation(obj, iterations=3))
    bx = [(sl[0].start, sl[1].start, sl[0].stop, sl[1].stop) for i, sl in enumerate(ndimage.find_objects(lab)) if int((obj[sl] & (lab[sl] == i + 1)).sum()) >= 150]
    bx.sort(key=lambda q: (q[0] + q[2]) / 2); rg, cur = [], []
    for q in bx:
        if cur and (q[0] + q[2]) / 2 - (cur[-1][0] + cur[-1][2]) / 2 > (cur[-1][2] - cur[-1][0]) * 0.5: rg.append(cur); cur = []
        cur.append(q)
    if cur: rg.append(cur)
    ordre = [q for R in rg for q in sorted(R, key=lambda q: q[1])]
    bord = ndimage.binary_dilation(~obj, iterations=2) & obj
    gmax = np.maximum(r, b) + 8; g2 = np.where(bord & (g > gmax), gmax, g)
    rgba = Image.fromarray(np.dstack([r, g2, b, np.where(obj, 255, 0)]).clip(0, 255).astype('uint8'), 'RGBA')
    _PANNEAUX[(f, p)] = [rgba.crop((q[1], q[0], q[3], q[2])) for q in ordre]
    return _PANNEAUX[(f, p)]


def grille(f, cols, rows, k, clair=False):
    """Case k d'une planche rangée en grille (cols x rows) : fond vert, ou clair et quadrillé (clair=True), enlevé."""
    import numpy as np
    from scipy import ndimage
    im = Image.open(f).convert('RGB'); W, H = im.size; cw, ch = W / cols, H / rows
    x0, y0 = int((k % cols) * cw), int((k // cols) * ch)
    a = np.array(im.crop((x0 + 4, y0 + 4, int(x0 + cw) - 4, int(y0 + ch) - 4))).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if clair:   # (fond crème et lignes du quadrillage, reliés au bord de la case)
        lab, n = ndimage.label((r + g + b > 3 * 196) & (np.max(a, -1) - np.min(a, -1) < 34))
        bords = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        fond = np.isin(lab, list(bords))
    else: fond = (g > 150) & (g - np.maximum(r, b) > 70)
    obj = ndimage.binary_opening(~fond, iterations=1)
    lab, n = ndimage.label(obj)   # (on garde le plus gros morceau et ce qui le touche presque : pas les voisins qui débordent)
    if n > 1:
        tailles = ndimage.sum(obj, lab, range(1, n + 1)); grand = 1 + int(np.argmax(tailles))
        proche = ndimage.binary_dilation(lab == grand, iterations=6)
        garde = np.isin(lab, [i + 1 for i in range(n) if (proche & (lab == i + 1)).any() and tailles[i] > 30])
        obj = obj & garde
    if not clair:
        bord = ndimage.binary_dilation(~obj, iterations=2) & obj
        gmax = np.maximum(r, b) + 8; g = np.where(bord & (g > gmax), gmax, g)
    out = Image.fromarray(np.dstack([r, g, b, np.where(obj, 255, 0)]).clip(0, 255).astype('uint8'), 'RGBA')
    box = out.getchannel('A').getbbox()
    return out.crop(box) if box else out


def cases(f, cols=5, rows=2):
    """Planche rangée en grille (cols x rows), un objet par case : chaque morceau (fond vert enlevé) va à la case de son
    centre (un objet qui déborde sur sa voisine reste entier, un objet en plusieurs morceaux est réuni) ; deux objets
    collés (boîte bien trop large) sont coupés à la colonne la plus vide. -> (image RGBA, étiquettes, [(boîte, morceaux)])"""
    if ('cases', f) in _PLANCHES: return _PLANCHES[('cases', f)]
    import numpy as np
    from scipy import ndimage
    a = np.array(Image.open(f).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    obj = ndimage.binary_opening(~((g > 150) & (g - np.maximum(r, b) > 70)), iterations=1)
    lab, n = ndimage.label(obj)
    H, W = obj.shape
    aires = ndimage.sum(obj, lab, range(1, n + 1)); centres = ndimage.center_of_mass(obj, lab, range(1, n + 1))
    case = lambda cy, cx: int(min(rows - 1, cy // (H / rows))) * cols + int(min(cols - 1, cx // (W / cols)))
    par = {}
    for i in range(n):
        if aires[i] >= 20: par.setdefault(case(*centres[i]), []).append(i + 1)
    # deux objets collés : la case qui a tout pris est coupée à la colonne la plus vide de son milieu, l'autre moitié va
    # à sa voisine restée vide
    for k in range(cols * rows):
        ids = par.get(k, [])
        if not ids: continue
        m = np.isin(lab, ids); xs = np.where(m.any(0))[0]
        if xs[-1] - xs[0] < (W / cols) * 1.6: continue
        prof = m[:, xs[0]:xs[-1]].sum(0); a0, a1 = int(len(prof) * 0.35), int(len(prof) * 0.65)
        cut = xs[0] + a0 + int(np.argmin(prof[a0:a1]))
        voisine = k + 1 if (k % cols) < cols - 1 and cut > (k % cols + 1) * W / cols - W / cols / 2 else k - 1
        nouv = lab.max() + 1
        droite = m & (np.arange(W)[None, :] >= cut) if voisine > k else m & (np.arange(W)[None, :] < cut)
        lab = np.where(droite, nouv, lab)
        par.setdefault(voisine, []).append(nouv)
    res = []
    for k in range(cols * rows):
        ids = par.get(k, [])
        if not ids: res.append(None); continue
        m = np.isin(lab, ids)
        ys, xs = np.where(m.any(1))[0], np.where(m.any(0))[0]
        res.append(((ys[0], xs[0], ys[-1] + 1, xs[-1] + 1), ids))
    bord = ndimage.binary_dilation(~obj, iterations=3) & obj
    gmax = np.maximum(r, b) + 8
    rgba = np.dstack([r, np.where(bord & (g > gmax), gmax, g), b, np.where(obj, 255, 0)]).clip(0, 255).astype('uint8')
    _PLANCHES[('cases', f)] = (rgba, lab, res)
    return _PLANCHES[('cases', f)]


def morceau(f, k):
    if isinstance(k, tuple) and k[0] == 'panneau': return panneau(f, k[1])[k[2]]
    if isinstance(k, tuple) and k[0] == 'case':   # (seulement les morceaux de cet objet : pas ce qui déborde d'une voisine)
        import numpy as np
        rgba, lab, res = cases(f); (y0, x0, y1, x1), ids = res[k[1]]
        a = rgba[y0:y1, x0:x1].copy(); a[..., 3] = np.where(np.isin(lab[y0:y1, x0:x1], ids), a[..., 3], 0)
        return Image.fromarray(a, 'RGBA')
    if isinstance(k, tuple) and k[0] in ('grille', 'grille_clair'): return grille(f, k[1], k[2], k[3], k[0] == 'grille_clair')
    im, ordre = planche(f)
    ks = k if isinstance(k, list) else [k]
    y0 = min(ordre[i][0] for i in ks); x0 = min(ordre[i][1] for i in ks); y1 = max(ordre[i][2] for i in ks); x1 = max(ordre[i][3] for i in ks)
    c = im.crop((x0, y0, x1, y1))
    box = c.getchannel('A').getbbox()
    return c.crop(box) if box else c


def optimiser_commun():
    if not os.path.isdir(SOURCE_COMMUN):
        print('dossier introuvable :', SOURCE_COMMUN); return
    dst = os.path.join(RACINE, 'commun', 'jeu'); os.makedirs(dst, exist_ok=True)
    for nom, rel in COMMUN.items():
        part = None
        if isinstance(rel, tuple): rel, part = rel
        f = os.path.join(SOURCE_COMMUN, rel)
        if not os.path.exists(f):
            print('absent :', rel); continue
        cible = os.path.join(dst, nom + '.png')
        if os.path.exists(cible) and os.path.getmtime(cible) >= os.path.getmtime(f) and '--tout' not in sys.argv:
            continue
        if part is not None and (nom in SOLS_PLANCHE or nom in SOLS_MIROIR):   # sol d'une planche : texture raccordable
            out = (miroir if nom in SOLS_MIROIR else raccordable)(morceau(f, part)); out.save(cible, optimize=True)
            print('%-24s -> %4dx%-4d  %4d Ko (sol)' % (nom, out.width, out.height, os.path.getsize(cible) // 1024))
            continue
        if part is not None:   # objet d'une planche (fond vert)
            im = morceau(f, part); w, h = im.size; k = ECHELLE.get(nom) or min(1.0, GRAND.get(nom, 160) / max(w, h))
            out = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
            out.save(cible, optimize=True)
            print('%-24s -> %4dx%-4d  %4d Ko' % (nom, out.width, out.height, os.path.getsize(cible) // 1024))
            continue
        im = Image.open(f)
        if nom not in SOLS_COMMUN:   # arbres et décors : fond noir enlevé, recadrés
            im = detourer(im)
            box = im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
            if box: im = im.crop(box)
            w, h = im.size
            if nom.startswith('arbre_'): k = min(36 * 1.55 * 2 / w, 46 * 1.55 * 2 / h)   # (taille affichée en haute définition)
            else: k = min(1.0, 128 / max(w, h))   # (les décors sont plus petits qu'un arbre)
            W, Hh = round(w * k), round(h * k)
        else:
            im = im.convert('RGB'); W = Hh = 128 * 2   # (le sol est peint à 16 px par case : 2 fois plus fin suffit)
        out = im.resize((W, Hh), Image.LANCZOS)
        cible = os.path.join(dst, nom + '.png'); out.save(cible, optimize=True)
        print('%-24s -> %4dx%-4d  %4d Ko' % (nom, W, Hh, os.path.getsize(cible) // 1024))


# ---------------------------------------------------------------- DIGIMON : planches du joueur (dossier Digimon/, fond vert),
# une pose par dessin. Quatre vues par espèce, tournées vers la DROITE (« miroir » quand la planche les montre vers la
# gauche) : combat (de trois quarts : combats, menus), profil (de côté : marche à gauche ou à droite), face (marche vers
# le bas), dos (marche vers le haut) -> assets/commun/jeu/digi_<espèce>_<vue>.png ; le jeu les met à la taille de chaque
# écran (js/gfx/sprites.js : IMAGES). Le numéro d'une pose : son rang dans l'ordre de lecture de la planche (rangées de
# haut en bas, puis de gauche à droite).
DIGIMON = {
    'koromon':  ('Koromon.jpg',  {'combat': 5, 'profil': (2, 'miroir'), 'face': 0, 'dos': 1}),
    'tsunomon': ('TSUNOMON.jpg', {'combat': (1, 'miroir'), 'profil': (2, 'miroir'), 'face': 0, 'dos': 4}),
    'bukamon':  ('BUKAMON.jpg',  {'combat': 5, 'profil': 3, 'face': 8, 'dos': 1}),
    'nyokimon': ('NYAKOMON.jpg', {'combat': 6, 'profil': 12, 'face': 0, 'dos': 8}),
    'pabumon':  ('PABUMON.jpg',  {'combat': (2, 'miroir'), 'profil': (3, 'miroir'), 'face': 0, 'dos': 7}),
    'poyomon':  ('POYOMON.jpg',  {'combat': 3, 'profil': (2, 'miroir'), 'face': 0, 'dos': 4}),
    'punimon':  ('PUNIMON.jpg',  {'combat': 5, 'profil': 4, 'face': 0, 'dos': 3}),
}
HAUT_DIGIMON = 168   # hauteur des copies : le plus grand affichage d'un Bébé ou d'un Digimon d'entraînement (combat, en haute définition)


def planche_digimon(f):
    """Poses d'une planche de Digimon : (image, part de vert, [(y0, x0, y1, x1, masque)]) dans l'ordre de lecture."""
    import numpy as np
    from scipy import ndimage
    a = np.array(Image.open(f).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    vert = g - np.maximum(r, b)
    # fond : le vert pur, clair ou sombre (les ombres vertes sous les poses qui sautent) ; les feuilles d'un Digimon,
    # vert-jaune, restent
    fond = (vert > 100) | ((r < 40) & (b < 40) & (g > 80))
    obj = ndimage.binary_opening(~fond, iterations=1)
    lab, n = ndimage.label(obj)
    aires = ndimage.sum(obj, lab, range(1, n + 1))
    boites = ndimage.find_objects(lab)
    B = [(s[0].start, s[1].start, s[0].stop, s[1].stop) for s in boites]
    grands = [i for i in range(n) if aires[i] >= aires.max() * 0.12]
    groupe = {i: [i + 1] for i in grands}
    # un morceau détaché (bulle, étincelle, trait de vitesse) va à la pose juste en dessous de lui (les bulles montent),
    # sinon à la plus proche
    for i in range(n):
        if i in groupe or aires[i] < 12: continue
        y0, x0, y1, x1 = B[i]; cy, cx = (y0 + y1) / 2, (x0 + x1) / 2
        dessous = [q for q in grands if B[q][1] - 15 <= cx <= B[q][3] + 15 and B[q][0] > cy - 10 and B[q][0] - y1 < 90]
        if dessous:
            q = min(dessous, key=lambda q: B[q][0] - y1)
        else:
            dist = lambda q: max(0, B[q][1] - cx, cx - B[q][3]) + max(0, B[q][0] - cy, cy - B[q][2])
            q = min(grands, key=dist)
            if dist(q) > 50: continue
        groupe[q].append(i + 1)
    poses = []
    for q, ks in groupe.items():
        m = np.isin(lab, ks); ys, xs = np.where(m)
        poses.append((ys.min(), xs.min(), ys.max() + 1, xs.max() + 1, m))
    poses.sort(key=lambda p: (p[0] + p[2]) / 2)
    rangs, cur = [], []
    for p in poses:
        if cur and (p[0] + p[2]) / 2 - (cur[-1][0] + cur[-1][2]) / 2 > (cur[-1][2] - cur[-1][0]) * 0.5: rangs.append(cur); cur = []
        cur.append(p)
    if cur: rangs.append(cur)
    return a, vert, [p for rg in rangs for p in sorted(rg, key=lambda p: p[1])]


def pose_digimon(a, vert, p, miroir=False):
    """Une pose détourée (RGBA recadré) : bord doux de 2 pixels, liseré vert neutralisé."""
    import numpy as np
    from scipy import ndimage
    y0, x0, y1, x1, m = p
    sub = a[y0:y1, x0:x1].copy(); v = vert[y0:y1, x0:x1]; mm = m[y0:y1, x0:x1]
    bord = mm & ndimage.binary_dilation(~mm, iterations=2)
    interieur = mm & ~bord
    ref = max(0, int(np.percentile(v[interieur], 97))) if interieur.any() else 0   # (le vert propre au Digimon : ses feuilles)
    alpha = np.where(mm, 255.0, 0.0)
    alpha[bord] = 255 * np.clip((150 - v[bord]) / (150 - max(ref, 20)), 0, 1)
    gmax = np.maximum(sub[..., 0], sub[..., 2]) + ref
    sub[..., 1] = np.where(bord & (sub[..., 1] > gmax), gmax, sub[..., 1])
    im = Image.fromarray(np.dstack([sub, alpha]).clip(0, 255).astype('uint8'), 'RGBA')
    return im.transpose(Image.FLIP_LEFT_RIGHT) if miroir else im


def numeroter_digimon():
    """python dev/optimiser_textures.py digimon --numeros : chaque planche avec le numéro de ses poses (dev/captures/),
    pour choisir les quatre vues d'une nouvelle espèce."""
    from PIL import ImageDraw
    src = os.path.join(SOURCE_COMMUN, 'Digimon'); dst = os.path.join(RACINE, '..', 'dev', 'captures'); os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        a, vert, poses = planche_digimon(os.path.join(src, f))
        im = Image.open(os.path.join(src, f)).convert('RGB'); dr = ImageDraw.Draw(im)
        for i, (y0, x0, y1, x1, m) in enumerate(poses):
            dr.rectangle([x0, y0, x1, y1], outline=(255, 0, 0), width=3)
            dr.rectangle([x0, y0, x0 + 34, y0 + 22], fill=(0, 0, 0)); dr.text((x0 + 4, y0 + 4), str(i), fill=(255, 255, 0))
        cible = os.path.join(dst, 'planche_' + os.path.splitext(f)[0] + '_numeros.png'); im.save(cible)
        print('%-16s %3d poses -> %s' % (f, len(poses), os.path.relpath(cible)))


def optimiser_digimon():
    if '--numeros' in sys.argv: return numeroter_digimon()
    src = os.path.join(SOURCE_COMMUN, 'Digimon')
    dst = os.path.join(RACINE, 'commun', 'jeu'); os.makedirs(dst, exist_ok=True)
    for sp, (fichier, vues) in DIGIMON.items():
        f = os.path.join(src, fichier)
        if not os.path.exists(f):
            print('absent :', fichier); continue
        cibles = {v: os.path.join(dst, 'digi_%s_%s.png' % (sp, v)) for v in vues}
        if all(os.path.exists(c) and os.path.getmtime(c) >= os.path.getmtime(f) for c in cibles.values()) and '--tout' not in sys.argv:
            continue
        a, vert, poses = planche_digimon(f)
        for v, k in vues.items():
            n, miroir = (k[0], True) if isinstance(k, tuple) else (k, False)
            im = pose_digimon(a, vert, poses[n], miroir)
            w, h = im.size; s = min(1.0, HAUT_DIGIMON / h)
            out = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
            out.save(cibles[v], optimize=True)
            print('%-24s -> %4dx%-4d  %4d Ko' % ('digi_%s_%s' % (sp, v), out.width, out.height, os.path.getsize(cibles[v]) // 1024))


if __name__ == '__main__':
    # (les options --numeros et --tout ne sont pas des dossiers)
    for d in ([a for a in sys.argv[1:] if not a.startswith('--')] or DOSSIERS + ['commun', 'digimon']):
        if d == 'commun': optimiser_commun()
        elif d == 'digimon': optimiser_digimon()
        else: optimiser(d)
    # empreintes des fichiers servis (dev/versions.py : le téléphone reprend une image changée)
    import versions; versions.ecrire()
