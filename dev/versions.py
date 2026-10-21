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
# PAQUETS DU SITE EN LIGNE : les scripts réunis en quelques fichiers (paquets/jeu-<n>.js), coupés à chaque fichier exclu
# (les retouches de l'atelier restent un fichier à part, toujours redemandé) ; bloc PAQUETS de js/scripts.js
PAQUETS_DIR = os.path.join(RACINE, 'paquets')
DEBUT_P, FIN_P = '  const PAQUETS = [', '  ];   // (fin des paquets)'
ENTETE_P = ("'use strict';\n// FICHIER FABRIQUÉ PAR dev/versions.py : des scripts du jeu (liste de js/scripts.js), dans l'ordre, réunis pour le\n"
            "// site en ligne (une seule demande au lieu d'une par fichier). Ne pas modifier : modifier js/, puis relancer dev/versions.py.\n")


def paquets(liste, lire):
    # [(nom du paquet, fichiers, texte)] : un paquet par suite de fichiers non exclus ; un fichier exclu reste seul (nom None)
    out, cur = [], []
    for f in liste:
        if f in EXCLUS:
            if cur: out.append(cur); cur = []
            out.append(f)
        else: cur.append(f)
    if cur: out.append(cur)
    res, n = [], 0
    for p in out:
        if isinstance(p, str): res.append((None, p, None)); continue
        n += 1
        texte = ENTETE_P + ''.join('\n// ===== js/%s\n%s\n;\n' % (f, lire(f).rstrip('\n')) for f in p)
        res.append(('jeu-%d.js' % n, p, texte))
    return res
ENTETE = """'use strict';
// =====================================================================
//  VERSIONS DES IMAGES (fichier fabriqué par dev/versions.py : ne pas modifier à la main)
//  Une empreinte par image servie ; l'image est demandée avec ?v=<empreinte> : le service worker (sw.js) la garde
//  sans la redemander tant qu'elle n'a pas changé. Les tests (dev/tests.js) vérifient que les empreintes sont à jour.
// =====================================================================
"""


def empreinte(f):
    with open(f, 'rb') as fh: return hashlib.sha256(fh.read()).hexdigest()[:8]


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
    s = s[:i] + bloc + s[j + len(FIN):]
    # paquets du site en ligne (fichiers écrits en LF : leur empreinte est celle de leur texte)
    os.makedirs(PAQUETS_DIR, exist_ok=True)
    lire = lambda f: open(os.path.join(JS, f), encoding='utf-8').read()
    P = paquets(liste, lire)
    for nom, fichiers, texte in P:
        if nom: ecrire_si_change(os.path.join(PAQUETS_DIR, nom), texte)
    for f in os.listdir(PAQUETS_DIR):
        if f.endswith('.js') and f not in [p[0] for p in P]: os.remove(os.path.join(PAQUETS_DIR, f))
    lignes = ''.join(("    { f: '../paquets/%s', v: '%s' },\n" % (nom, hashlib.sha256(texte.encode('utf-8')).hexdigest()[:8])) if nom else ("    { f: '%s' },\n" % fichiers) for nom, fichiers, texte in P)
    i, j = s.index(DEBUT_P), s.index(FIN_P)
    s = s[:i] + DEBUT_P + '\n' + lignes + FIN_P + s[j + len(FIN_P):]
    ch_s = ecrire_si_change(SCRIPTS, s)
    print('empreintes : %d images%s, %d scripts%s, %d paquets' % (len(V), '' if ch_i else ' (inchangées)', len(liste), '' if ch_s else ' (inchangés)', len([p for p in P if p[0]])))


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
    faux = [c for (c, h), b in zip(paires, contenus) if b is None or hashlib.sha256(b).hexdigest()[:8] != h]
    # paquets du site en ligne : chacun doit être exactement la réunion des fichiers du commit, avec son empreinte
    liste = re.findall(r"'([\w/]+\.js)'", s[s.index('const LIST = ['):s.index('];', s.index('const LIST = ['))])
    contenu = {c: b for (c, h), b in zip(paires, contenus)}
    lire = lambda f: (contenu.get('js/' + f) or git('show', 'HEAD:js/' + f)).decode('utf-8')
    attendus = dict(re.findall(r"f: '\.\./paquets/([^']+)', v: '([0-9a-f]+)'", s))
    for nom, fichiers, texte in paquets(liste, lire):
        if not nom: continue
        b = git('show', 'HEAD:paquets/' + nom)
        if b.decode('utf-8') != texte or hashlib.sha256(b).hexdigest()[:8] != attendus.get(nom): faux.append('paquets/' + nom)
    paires += [('paquets/' + n, h) for n, h in attendus.items()]
    print('dernier commit : %d empreintes, %d fausses%s' % (len(paires), len(faux), (' : ' + ', '.join(faux[:10])) if faux else ''))
    return not faux


if __name__ == '__main__':
    if '--verifier' in sys.argv: sys.exit(0 if verifier() else 1)
    ecrire()
