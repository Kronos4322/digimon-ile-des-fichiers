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
# joueur, rangés sur son Bureau (ASSETS - Digimon). Sols et eaux : textures qui se répètent (128 px du jeu) ; arbres :
# fond noir enlevé, recadrés, posés dans le cadre des arbres du jeu (36 x 46, agrandi 1,55 fois en jeu).
SOURCE_COMMUN = os.path.join(os.path.expanduser('~'), 'Desktop', 'ASSETS - Digimon')
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
# planche à PANNEAUX (Mobiliers exterieurs, 10 catégories en 5 x 2, bandeau de titre) : ('panneau', catégorie, n°)
_E = 'Mobiliers exterieurs/photo_2026-10-19_23-15-35.jpg'
COMMUN.update({
    'ext_caisse': (_E, ('panneau', 2, 0)), 'ext_caisse2': (_E, ('panneau', 2, 1)),
    'ext_distrib_rouge': (_E, ('panneau', 4, 0)), 'ext_distrib_bleu': (_E, ('panneau', 4, 1)), 'ext_distrib_blanc': (_E, ('panneau', 4, 2)),
    'ext_boite_lettres': (_E, ('panneau', 1, 6)), 'ext_toilettes': (_E, ('panneau', 5, 1)),
    'ext_jardiniere_verte': (_E, ('panneau', 3, 0)), 'ext_jardiniere_blanche': (_E, ('panneau', 3, 1)), 'ext_jardiniere_rose': (_E, ('panneau', 3, 2)),
    'ext_etal_fruits': (_E, ('panneau', 8, 1)), 'ext_etal_legumes': (_E, ('panneau', 8, 2)), 'ext_etal_pain': (_E, ('panneau', 8, 3)),
    'ext_puits': (_E, ('panneau', 9, 3)),
})
SOLS_PLANCHE = {'mont_gravier', 'mont_herbe_alpine', 'mont_terre_seche'}
# taille maximale de la copie (plus grand côté) pour les grands objets des planches ; sinon 160 px
GRAND = {'mont_sapin': 220, 'mont_grotte': 200, 'ville_fontaine_etages': 200, 'ville_fontaine_vasque': 200, 'ville_fontaine_octogone': 200}
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


def morceau(f, k):
    if isinstance(k, tuple) and k[0] == 'panneau': return panneau(f, k[1])[k[2]]
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
            im = morceau(f, part); w, h = im.size; k = min(1.0, GRAND.get(nom, 160) / max(w, h))
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


if __name__ == '__main__':
    for d in (sys.argv[1:] or DOSSIERS + ['commun']):
        if d == 'commun': optimiser_commun()
        else: optimiser(d)
