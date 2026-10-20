# EMPREINTES DES FICHIERS DU JEU : une empreinte (8 caractères) par script (bloc VERSIONS de js/scripts.js) et par image
# servie (assets/<dossier>/jeu/*, assets/commun/kit/* : js/data/versions_images.js). Le jeu demande chaque fichier avec
# ?v=<empreinte> : le service worker (sw.js) le garde sans le redemander au serveur tant qu'il n'a pas changé ; un fichier
# modifié change d'adresse (jamais de version périmée). À relancer après chaque modification d'un script ou d'une image
# (dev/optimiser_textures.py le fait pour les images) ; les tests (dev/tests.js) refusent des empreintes périmées.
# Les retouches de l'atelier (maps/retouches_donnees.js, souvent modifiées sans être publiées) n'ont pas d'empreinte :
# elles sont toujours redemandées au serveur.
#   python dev/versions.py              : met les empreintes à jour (fichiers du dossier)
#   python dev/versions.py --verifier   : vérifie le dernier commit (ce qui sera publié) : chaque empreinte correspond-elle
#                                         au fichier commité ? (sinon un téléphone garderait une version périmée)
import hashlib, json, os, re, subprocess, sys

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ASSETS = os.path.join(RACINE, 'assets')
JS = os.path.join(RACINE, 'js')
SORTIE_IMAGES = os.path.join(JS, 'data', 'versions_images.js')
SCRIPTS = os.path.join(JS, 'scripts.js')
SOUS = ('jeu', 'kit')   # (les images d'origine du joueur, « ASSETS - Digimon », ne sont pas servies)
DEBUT, FIN = '  const VERSIONS = {', '  };   // (fin des versions)'
EXCLUS = {'maps/retouches_donnees.js'}
ENTETE = """'use strict';
// =====================================================================
//  VERSIONS DES IMAGES (fichier fabriqué par dev/versions.py : ne pas modifier à la main)
//  Une empreinte par image servie ; l'image est demandée avec ?v=<empreinte> : le service worker (sw.js) la garde
//  sans la redemander tant qu'elle n'a pas changé. Les tests (dev/tests.js) vérifient que les empreintes sont à jour.
// =====================================================================
"""


def empreinte(f):
    with open(f, 'rb') as fh: return hashlib.md5(fh.read()).hexdigest()[:8]


def images():
    out = {}
    for d in sorted(os.listdir(ASSETS)):
        if d.startswith('ASSETS'): continue
        for sous in SOUS:
            p = os.path.join(ASSETS, d, sous)
            if not os.path.isdir(p): continue
            for f in sorted(os.listdir(p)):
                if f.lower().endswith(('.png', '.webp', '.jpg')): out['%s/%s/%s' % (d, sous, f)] = empreinte(os.path.join(p, f))
    return out


def ecrire_si_change(f, texte):
    ancien = open(f, encoding='utf-8').read() if os.path.exists(f) else ''
    if texte != ancien:
        with open(f, 'w', encoding='utf-8', newline='\n') as fh: fh.write(texte)
    return texte != ancien


def ecrire():
    V = images()
    t = (ENTETE + 'DW.VERSIONS_IMAGES = {\n' + ''.join('  %s: %s,\n' % (json.dumps(k), json.dumps(v)) for k, v in V.items()) + '};\n'
         + "// suffixe d'adresse d'une image (chemin sous assets/, ex. 'commun/jeu/herbe_verte.png')\n"
         + "DW.versionImage = chemin => (DW.VERSIONS_IMAGES[chemin] ? '?v=' + DW.VERSIONS_IMAGES[chemin] : '');\n")
    ch_i = ecrire_si_change(SORTIE_IMAGES, t)
    # scripts : la liste de js/scripts.js (versions_images.js compris, une fois écrit)
    s = open(SCRIPTS, encoding='utf-8').read()
    liste = re.findall(r"'([\w/]+\.js)'", s[s.index('const LIST = ['):s.index('];', s.index('const LIST = ['))])
    i, j = s.index(DEBUT), s.index(FIN)
    bloc = DEBUT + '\n' + ''.join("    '%s': '%s',\n" % (f, empreinte(os.path.join(JS, f))) for f in liste if f not in EXCLUS) + FIN
    ch_s = ecrire_si_change(SCRIPTS, s[:i] + bloc + s[j + len(FIN):])
    print('empreintes : %d images%s, %d scripts%s' % (len(V), '' if ch_i else ' (inchangées)', len(liste), '' if ch_s else ' (inchangés)'))


def verifier():
    # le dernier commit : ses empreintes (scripts.js, versions_images.js) contre ses propres fichiers
    git = lambda *a: subprocess.run(['git', '-C', RACINE] + list(a), capture_output=True).stdout
    s = git('show', 'HEAD:js/scripts.js').decode('utf-8')
    v = git('show', 'HEAD:js/data/versions_images.js').decode('utf-8')
    paires = [('js/' + f, h) for f, h in re.findall(r"'([\w/]+\.js)': '([0-9a-f]+)'", s)] + [('assets/' + k, h) for k, h in re.findall(r'"([^"]+)": "([0-9a-f]+)"', v)]
    # (tous les fichiers du commit en une seule commande : git cat-file --batch)
    out = subprocess.run(['git', '-C', RACINE, 'cat-file', '--batch'], input=''.join('HEAD:%s\n' % c for c, h in paires).encode('utf-8'), capture_output=True).stdout
    i, contenus = 0, []
    for c, h in paires:
        j = out.index(b'\n', i); tete = out[i:j].split()
        if tete[-1] == b'missing': contenus.append(None); i = j + 1; continue
        n = int(tete[2]); contenus.append(out[j + 1:j + 1 + n]); i = j + 1 + n + 1
    faux = [c for (c, h), b in zip(paires, contenus) if b is None or hashlib.md5(b).hexdigest()[:8] != h]
    print('dernier commit : %d empreintes, %d fausses%s' % (len(paires), len(faux), (' : ' + ', '.join(faux[:10])) if faux else ''))
    return not faux


if __name__ == '__main__':
    if '--verifier' in sys.argv: sys.exit(0 if verifier() else 1)
    ecrire()
