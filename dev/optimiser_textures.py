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


if __name__ == '__main__':
    for d in (sys.argv[1:] or DOSSIERS):
        optimiser(d)
