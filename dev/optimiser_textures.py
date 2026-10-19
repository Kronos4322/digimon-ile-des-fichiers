# -*- coding: utf-8 -*-
"""COPIES ALLÉGÉES DES TEXTURES DESSINÉES (pour le téléphone et le site)

Les images fabriquées avec ChatGPT font souvent 1000 à 1800 px et 2 à 3 Mo chacune.
Ce script en fait des copies à 4 fois la taille du jeu (assez fin pour la haute définition), dans
assets/<dossier>/jeu/<nom>.png. Le jeu charge ces copies d'abord (js/gfx/textures.js), l'original sinon.
Les originaux ne sont jamais modifiés.

    python dev/optimiser_textures.py            (tous les dossiers d'assets connus)
"""
import os, sys
from PIL import Image

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
# même table que TAILLE dans js/gfx/textures.js (pixels du jeu, 1 case = 16) ; copie = 4 fois plus grande
TAILLE = {
    'sol_cendres': (128, 128), 'dessus_falaise': (176, 176), 'lave': (128, 128), 'herbe': (128, 128), 'herbe_seche': (128, 128), 'sable': (128, 128), 'chemin': (128, 128),
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
    'terre_craquelee': S + 'photo_2026-10-19_07-14-38.jpg', 'rocaille': S + 'photo_2026-10-19_07-14-39 (2).jpg', 'sable_desert': S + 'photo_2026-10-19_07-14-39.jpg',
    'eau_mer': E + 'photo_2026-10-19_07-14-33 (2).jpg', 'eau_douce': E + 'photo_2026-10-19_07-14-33.jpg',
    # arbres (fond noir)
    'arbre_sapin': A + 'photo_2026-10-19_07-14-21.jpg', 'arbre_cerisier': A + 'photo_2026-10-19_07-14-24 (2).jpg', 'arbre_chene_clair': A + 'photo_2026-10-19_07-14-24.jpg',
    'arbre_saule': A + 'photo_2026-10-19_07-14-26.jpg', 'arbre_mauve': A + 'photo_2026-10-19_07-14-27 (2).jpg', 'arbre_chene': A + 'photo_2026-10-19_07-14-27 (3).jpg',
    'arbre_vert': A + 'photo_2026-10-19_07-14-27.jpg', 'arbre_vert_vif': A + 'photo_2026-10-19_07-14-31 (2).jpg', 'arbre_bouleau': A + 'photo_2026-10-19_07-14-31.jpg',
    'arbre_fleurs': A + 'photo_2026-10-19_07-14-32.jpg', 'arbre_automne_brun': A + 'photo_2026-10-19_07-17-30 (2).jpg', 'arbre_erable_orange': A + 'photo_2026-10-19_07-17-30.jpg',
    'arbre_erable_rouge': A + 'photo_2026-10-19_07-17-31 (2).jpg', 'arbre_erable_orange2': A + 'photo_2026-10-19_07-17-31 (3).jpg', 'arbre_erable_orange3': A + 'photo_2026-10-19_07-17-31 (4).jpg',
    'arbre_bouleau_automne': A + 'photo_2026-10-19_07-17-31 (5).jpg', 'arbre_erable_vif': A + 'photo_2026-10-19_07-17-31 (6).jpg', 'arbre_peuplier_automne': A + 'photo_2026-10-19_07-17-31 (7).jpg',
    'arbre_mi_automne': A + 'photo_2026-10-19_07-17-31 (8).jpg', 'arbre_chene_automne': A + 'photo_2026-10-19_07-17-31.jpg',
    # arbres enneigés
    'arbre_neige_tordu': A + 'photo_2026-10-19_07-26-51 (2).jpg', 'arbre_neige_bouleau': A + 'photo_2026-10-19_07-26-51.jpg', 'arbre_neige_peuplier': A + 'photo_2026-10-19_07-26-52 (2).jpg',
    'arbre_neige_rond': A + 'photo_2026-10-19_07-26-52 (3).jpg', 'arbre_neige_chene': A + 'photo_2026-10-19_07-26-52 (4).jpg', 'arbre_neige_sapin': A + 'photo_2026-10-19_07-26-52.jpg',
    'arbre_neige_sapin2': A + 'photo_2026-10-19_07-26-53 (2).jpg', 'arbre_neige_sapin3': A + 'photo_2026-10-19_07-26-53 (3).jpg', 'arbre_neige_nu': A + 'photo_2026-10-19_07-26-53.jpg',
    # décors (fond noir) : buissons, champignons, fleurs, fougères, rocher, objets de forêt
    'buisson_fleuri': 'Buissons/1photo_2026-10-19_07-40-27.jpg', 'roncier': 'Buissons/photo_2026-10-19_07-30-07 (2).jpg', 'buisson_baies': 'Buissons/photo_2026-10-19_07-30-07.jpg',
    'buisson_baies2': 'Buissons/photo_2026-10-19_07-40-26.jpg', 'buisson': 'Buissons/photo_2026-10-19_07-40-27.jpg', 'amanites': 'Champignons/photo_2026-10-19_07-30-08 (2).jpg',
    'fleur_1': 'Fleurs/photo_2026-10-19_07-30-06.jpg', 'fleur_2': 'Fleurs/photo_2026-10-19_07-30-09 (2).jpg', 'fleur_3': 'Fleurs/photo_2026-10-19_07-30-09 (3).jpg',
    'fleur_4': 'Fleurs/photo_2026-10-19_07-30-09.jpg', 'fleur_5': 'Fleurs/photo_2026-10-19_07-30-10 (2).jpg', 'fleur_6': 'Fleurs/photo_2026-10-19_07-30-10 (3).jpg',
    'fleur_7': 'Fleurs/photo_2026-10-19_07-30-10 (4).jpg', 'fleur_8': 'Fleurs/photo_2026-10-19_07-30-10 (5).jpg', 'fleur_9': 'Fleurs/photo_2026-10-19_07-30-10.jpg',
    'fleur_10': 'Fleurs/photo_2026-10-19_07-30-11.jpg', 'fougere_1': 'Fougère/photo_2026-10-19_07-30-07.jpg', 'fougere_2': 'Fougère/photo_2026-10-19_07-40-27 (2).jpg',
    'tronc_couche': 'Objet foret/arbre mort 1.jpg', 'panneau': 'Objet foret/panneau direction.jpg', 'racines': 'Objet foret/photo_2026-10-19_07-30-07 (2).jpg',
    'monolithe': 'Objet foret/photo_2026-10-19_07-40-28.jpg', 'plante_lanternes': 'Objet foret/photo_2026-10-19_07-40-29 (2).jpg', 'sanctuaire': 'Objet foret/photo_2026-10-19_07-40-29.jpg',
    'totem': 'Objet foret/photo_2026-10-19_07-40-30 (2).jpg', 'lianes': 'Objet foret/photo_2026-10-19_07-40-30.jpg', 'fleur_cristal': 'Objet foret/photo_2026-10-19_07-40-31 (2).jpg',
    'arche': 'Objet foret/photo_2026-10-19_07-40-31 (3).jpg', 'cristaux': 'Objet foret/photo_2026-10-19_07-40-31 (4).jpg', 'souche': 'Objet foret/souche1.jpg',
    'source': 'Objet foret/source magique .jpg', 'rocher_mousse': 'Rocher/photo_2026-10-19_07-30-08.jpg',
}
SOLS_COMMUN = {'herbe_claire', 'herbe_verte', 'sable_terre', 'herbe_seche', 'herbe_fleurie', 'herbe_dense', 'terre_claire', 'herbe_haute', 'herbe_terre', 'sable_dunes',
               'terre_brune', 'terre_sombre', 'sable_plage', 'terre_savane', 'terre_cailloux', 'terre_craquelee', 'rocaille', 'sable_desert', 'eau_mer', 'eau_douce'}


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


def optimiser_commun():
    if not os.path.isdir(SOURCE_COMMUN):
        print('dossier introuvable :', SOURCE_COMMUN); return
    dst = os.path.join(RACINE, 'commun', 'jeu'); os.makedirs(dst, exist_ok=True)
    for nom, rel in COMMUN.items():
        f = os.path.join(SOURCE_COMMUN, rel)
        if not os.path.exists(f):
            print('absent :', rel); continue
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
