"""Kit d'habillage du joueur (création du personnage, ui/intro.js « QUI ES-TU ? »).

Ses planches PErsonnages/ (assets/ASSETS - Digimon) -> pièces détourées, mises à l'échelle d'un repère commun,
rangées en une planche par catégorie (assets/commun/kit/<cat>.png), et leurs repères (js/gfx/kit_donnees.js) :
  corps (10 teintes de peau ; les garçons ont les jambes plus courtes, comme leurs vêtements), têtes de filles (30),
  têtes de garçons (10 coiffures, le visage pris sur ses expressions), hauts (30), ensembles (20 tenues complètes),
  bas (10 filles, 10 garçons), chaussures (20), chapeaux (10), sacs (16), accessoires (13).
Repère : le haut du cou, au milieu, en (0, 0) ; le corps fait HB pixels du cou aux pieds.
Le jeu (gfx/persos.js) empile les pièces sur ces repères et donne à la peau des pièces la teinte du corps choisi.

    python dev/kit_persos.py
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ICI = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'ASSETS - Digimon', 'PErsonnages')
DST = os.path.join(ICI, '..', 'assets', 'commun', 'kit')
JS = os.path.join(ICI, '..', 'js', 'gfx', 'kit_donnees.js')
P = lambda n: os.path.join(SRC, 'photo_2026-10-19_18-09-' + n + '.jpg')

HB = 200          # hauteur du corps (haut du cou -> plante des pieds)
YC, CJ = 0.30, 0.74   # garçons : sous 30 % du corps, jambes raccourcies (leurs pantalons sont dessinés ainsi)
# échelle de chaque catégorie par rapport à sa planche (chaque planche a sa propre échelle)
F = {'tete': 0.485, 'haut_f': 0.364, 'tshirt': 0.376, 'veste': 0.39, 'bas_f': 0.43, 'bas_g': 0.46, 'chaus_f': 0.34, 'chaus_g': 0.36,
     'chapeau': 0.44, 'sac': 0.30, 'sac_f': 0.28}


# ------------------------------------------------------------------ découpe
def cellule(f, cols, rows, k, clair, marge=0):
    """Case k d'une planche en grille : fond (vert, ou gris clair quadrillé) enlevé ; tous les morceaux de la case gardés
    (paires de chaussures, gants), sauf ceux d'une case voisine qui débordent (collés au bord gauche ou droit) ;
    marge : case élargie d'autant de chaque côté (une pièce qui déborde sur la case voisine)."""
    im = Image.open(f).convert('RGB'); W, H = im.size; cw, ch = W / cols, H / rows
    x0, y0 = int((k % cols) * cw), int((k // cols) * ch)
    a = np.array(im.crop((max(0, x0 + 4 - marge), y0 + 4, min(W, int(x0 + cw) - 4 + marge), int(y0 + ch) - 4))).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if clair:   # fond clair (sa teinte : le tour de la case) et quadrillage plus sombre de même teinte, reliés au bord
        tour = np.concatenate([a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3), a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3)])
        R, G, B = np.median(tour, 0)   # (un visage vide, crème rosé, n'a pas la teinte du fond : il reste)
        lab, n = ndimage.label((r + g + b > 3 * 165) & (np.abs((r - b) - (R - B)) < 7) & (np.abs((r - g) - (R - G)) < 6))
        bords = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        fond = np.isin(lab, list(bords))
    else: fond = (g > 150) & (g - np.maximum(r, b) > 70)
    obj = ndimage.binary_opening(~fond, iterations=1)
    lab, n = ndimage.label(obj)
    if n > 1:
        t = ndimage.sum(obj, lab, range(1, n + 1)); grand = 1 + int(np.argmax(t)); garde = []
        for i, sl in enumerate(ndimage.find_objects(lab), 1):
            voisin = (sl[1].start <= 1 or sl[1].stop >= obj.shape[1] - 1) and i != grand and sl[1].stop - sl[1].start < obj.shape[1] * 0.12
            if t[i - 1] > max(150, t.max() * 0.04) and not voisin: garde.append(i)
        obj = np.isin(lab, garde)
    if clair:   # liseré clair (fond mêlé au contour) enlevé : le contour sombre du dessin reste
        for _ in range(2):
            bord = ndimage.binary_dilation(~obj, iterations=1) & obj
            obj = obj & ~(bord & (r + g + b > 3 * 170) & (np.max(a, -1) - np.min(a, -1) < 40))
    else:   # liseré vert (JPEG) neutralisé
        bord = ndimage.binary_dilation(~obj, iterations=2) & obj
        gmax = np.maximum(r, b) + 8; g = np.where(bord & (g > gmax), gmax, g)
    out = Image.fromarray(np.dstack([r, g, b, np.where(obj, 255, 0)]).clip(0, 255).astype('uint8'), 'RGBA')
    box = out.getchannel('A').getbbox()
    return out.crop(box) if box else out


def morceaux(im, n=2, axe=0):
    """les n plus gros morceaux d'une pièce (une paire de gants, deux bracelets), rangés de gauche à droite (axe 0) ou de haut en bas"""
    m = np.array(im)[..., 3] > 128; lab, k = ndimage.label(ndimage.binary_dilation(m, iterations=2))
    t = ndimage.sum(m, lab, range(1, k + 1)); ids = [1 + int(i) for i in np.argsort(-t)[:n]]
    out = []
    sls = ndimage.find_objects(lab)
    for i in ids:
        sl = sls[i - 1]; c = np.array(im).copy(); c[..., 3] = np.where(lab == i, c[..., 3], 0)
        p = Image.fromarray(c, 'RGBA').crop((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)); out.append((sl[1 - axe].start, p))
    return [p for _, p in sorted(out, key=lambda q: q[0])]


sc = lambda im, f: im.resize((max(1, round(im.width * f)), max(1, round(im.height * f))), Image.LANCZOS)
A = lambda im: np.array(im)[..., 3] > 128


def hexa(c): return '#%02x%02x%02x' % tuple(int(v) for v in c[:3]) if c is not None else None


def peau(im):
    """la teinte de peau la plus fréquente d'une pièce (None s'il n'y a pas de peau)"""
    a = np.asarray(im).astype(int)
    k = (a[..., 3] > 200) & (a[..., 0] > 90) & (a[..., 0] > a[..., 2] + 25) & (a[..., 1] > a[..., 2]) & (a[..., 0] - a[..., 1] < 80) & (a[..., 0] - a[..., 1] > 15)
    if k.sum() < 20: return None
    px = a[k][:, :3] // 8 * 8 + 4; v, c = np.unique(px, axis=0, return_counts=True)
    return v[np.argmax(c)].tolist()


def couleur(im, sauf_peau=True, zone=None):
    """la couleur dominante (hors contours sombres, hors peau) : pour le petit sprite de marche"""
    a = np.asarray(im).astype(int); k = (a[..., 3] > 200) & (a[..., :3].max(-1) > 50)
    if zone is not None: k &= zone
    if sauf_peau:
        p = peau(im)
        if p: k &= np.abs(a[..., :3] - np.array(p)).sum(-1) > 60
    if k.sum() < 10: k = a[..., 3] > 200
    px = a[k][:, :3] // 24 * 24 + 12; v, c = np.unique(px, axis=0, return_counts=True)
    return v[np.argmax(c)].tolist()


# ------------------------------------------------------------------ têtes de garçons : coiffure (visage vide) + traits d'une expression
PEAU = np.array([248, 200, 148.]); PALE = np.array([248, 230, 214.])
proche = lambda a, c, tol: (a[..., 3] > 200) & (np.abs(a[..., :3] - c).sum(-1) < tol)
arr = lambda im: np.array(im).astype(float)


def visage_vide(a):
    m = proche(a, PALE, 60) & (a[..., 0] - a[..., 2] > 5); lab, n = ndimage.label(m)   # (pâle et chaud : pas une mèche argentée)
    if n == 0: return m
    t = ndimage.sum(m, lab, range(1, n + 1)); cy = ndimage.center_of_mass(m, lab, range(1, n + 1))
    # (les zones pâles du haut de la tête sont des mèches claires, pas le visage)
    return np.isin(lab, [i + 1 for i in range(n) if t[i] > t.max() * 0.02 and cy[i][0] > m.shape[0] * 0.4])


def repere(m):
    """menton (milieu des rangées les plus basses) et largeur de la mâchoire (à 25 % de la hauteur au-dessus du menton)"""
    ys, xs = np.nonzero(m); bas = ys.max(); cx = xs[ys >= bas - 2].mean(); yj = int(bas - 0.25 * (bas - ys.min()))
    row = np.nonzero(m[yj])[0]
    return dict(cx=cx, menton=bas, larg=(row.max() - row.min()) if len(row) else 1)


def boite(a):
    ys, xs = np.nonzero(a[..., 3] > 128); return xs.min(), ys.min(), xs.max(), ys.max()


# les traits du visage sur le dessin des expressions (sa planche « 04 (3) ») : sourcils, yeux, nez, bouche ;
# sans la mèche de la frange qui descend entre les sourcils
TRAITS = (58, 100, 166, 213); MECHE = (93, 100, 114, 143)


def tete_garcon(coiffures, visage, k):
    """coiffure k (la n°1 est celle des expressions : son dessin avec visage est pris tel quel) ; menton en coordonnées de l'image"""
    if k == 0:
        v = arr(visage); m = proche(v, PEAU, 70); lab, n = ndimage.label(m); t = ndimage.sum(m, lab, range(1, n + 1))
        r = repere(lab == 1 + int(np.argmax(t))); return visage, r
    c, c0, v = arr(coiffures[k]), arr(coiffures[0]), arr(visage)
    fv = visage_vide(c)
    # les traits : ce qui n'est pas de la peau dans le cadre du visage de l'expression
    trait = np.zeros(v.shape[:2], bool); x0, y0, x1, y1 = TRAITS; trait[y0:y1, x0:x1] = True
    x0, y0, x1, y1 = MECHE; trait[y0:y1, x0:x1] = False
    trait &= ~proche(v, PEAU, 55) & (v[..., 3] > 200)
    tv = v.copy(); tv[~trait, 3] = 0
    # expression -> coiffure n°1 (même chevelure : boîtes alignées) -> coiffure k (menton contre menton, largeur de la mâchoire)
    bx0, by0, bx1, by1 = boite(c0); vx0, vy0, vx1, vy1 = boite(v); s0 = (bx1 - bx0) / (vx1 - vx0)
    r0, rk = repere(visage_vide(c0)), repere(fv); sk = rk['larg'] / r0['larg']; s = s0 * sk
    ox = round(rk['cx'] + (bx0 - vx0 * s0 - r0['cx']) * sk); oy = round(rk['menton'] + (by0 - vy0 * s0 - r0['menton']) * sk)
    out = c.copy(); out[fv, :3] = np.clip(c[fv, :3] * (PEAU / PALE), 0, 255)   # (le visage vide prend la teinte de la peau)
    nw, nh = round(v.shape[1] * s), round(v.shape[0] * s)
    vs = arr(Image.fromarray(tv.clip(0, 255).astype('uint8'), 'RGBA').resize((nw, nh), Image.LANCZOS))
    H, W = fv.shape
    for y in range(nh):
        Y = y + oy
        if not 0 <= Y < H: continue
        for x in range(nw):
            X = x + ox
            if 0 <= X < W and vs[y, x, 3] > 90 and fv[Y, X]:
                a = vs[y, x, 3] / 255; out[Y, X, :3] = out[Y, X, :3] * (1 - a) + vs[y, x, :3] * a
    return Image.fromarray(out.clip(0, 255).astype('uint8'), 'RGBA'), rk


# ------------------------------------------------------------------ noms et genres (pour les menus et le petit sprite de marche)
NOMS = {
    'haut_f': ['Veste de survêtement rouge', 'Sweat à capuche bleu', 'Ciré jaune', 'Chemisier à jabot', 'Gilet rose', 'Doudoune sans manches',
               'Veste militaire kaki', 'Pull torsadé violet', 'Veste en jean', 'Col marin'],
    'tshirt': ['Chemise rouge', 'Tee-shirt bleu', 'Polo vert', 'Polo blanc', 'Sweat jaune', 'Tee-shirt orange', 'Débardeur noir', 'Marinière',
               'Blouse rose', "Chemise d'explorateur"],
    'veste': ['Blouson rouge', 'Teddy bleu', 'Gilet de baroudeur', 'Gilet de cuir noir', 'Veste saharienne', 'Sweat zippé orange', 'Parka rouge',
              'Veste blanche et bleue', 'Veste en jean délavé', 'Manteau violet'],
    'bas_f': ['Short en jean', 'Jupe plissée marine', 'Bermuda cargo kaki', 'Jean', 'Legging noir', 'Pantalon cargo', 'Jupe écossaise rose',
              'Salopette en jean', 'Pantacourt beige', 'Short de sport'],
    'bas_g': ['Short beige', 'Short en jean', 'Pantalon cargo vert', 'Jean', 'Pantalon noir', 'Short de sport rouge', 'Jupe rose', 'Jupe-short bleue',
              'Bermuda cargo', 'Pantalon renforcé'],
    'chaus_f': ['Baskets rouges', 'Chaussures de rando', 'Sandales', 'Mocassins noirs', 'Baskets montantes', 'Bottines', 'Bottes de pluie',
                'Baskets roses', 'Bottes fourrées', 'Tennis en toile'],
    'chaus_g': ['Baskets rouge et blanc', 'Baskets bleues', 'Baskets blanches', 'Chaussures de marche', 'Rangers', 'Sandales de cuir',
                'Baskets jaunes', 'Bottes de neige', 'Baskets de course', 'Mocassins'],
    'chapeau': ["Lunettes d'aviateur", 'Casquette rouge', 'Casquette verte', 'Bonnet orange', "Chapeau d'explorateur", 'Bob', 'Visière',
                'Capuche rouge', 'Casque audio', 'Bonnet à pompon'],
    'sac': ['Sac à dos rouge', 'Sac de randonnée', 'Besace en cuir', 'Sacoche noire', 'Bourse dorée', 'Musette bleue', 'Sac à dos techno',
            'Sac de sport', 'Banane', "Sac d'aventurier"],
    'sac_f': ['Sac à dos rouge et noir', 'Petit sac à dos', 'Sac de messager', 'Cartable', 'Banane orange', 'Sac de plage'],
}
# petit sprite de marche (gfx/hero.js) : haut (veste ouverte, sweat, tee-shirt), bas (short, pantalon, large, jupe), accessoire de tête
TYPE = {
    'haut_f': ['jacket', 'hoodie', 'jacket', 'tee', 'jacket', 'jacket', 'jacket', 'tee', 'jacket', 'tee'],
    'tshirt': ['tee', 'tee', 'tee', 'tee', 'hoodie', 'tee', 'tee', 'tee', 'tee', 'tee'],
    'veste': ['jacket', 'jacket', 'jacket', 'jacket', 'jacket', 'hoodie', 'jacket', 'jacket', 'jacket', 'jacket'],
    'bas_f': ['shorts', 'skirt', 'shorts', 'pants', 'pants', 'baggy', 'skirt', 'baggy', 'pants', 'shorts'],
    'bas_g': ['shorts', 'shorts', 'baggy', 'pants', 'pants', 'shorts', 'skirt', 'skirt', 'shorts', 'pants'],
    'chapeau': ['goggles', 'cap', 'cap', 'beanie', 'bucket', 'bucket', 'cap', 'beanie', '', 'beanie'],
}
# chapeaux : bas du chapeau au-dessus du menton (en fractions de HB) ; derrière = 1 : passe derrière la tête
# (la capuche, n°8 de sa planche, ne rend rien sur une tête vue de face : écartée)
CHAPEAU = [(0.27, 0), (0.32, 0), (0.32, 0), (0.34, 0), (0.33, 0), (0.33, 0), (0.28, 0), None, (0.17, 0), (0.33, 0)]
# têtes de filles qui portent déjà quelque chose (planche « 01 ») : pour le petit sprite de marche ; pas de second chapeau au hasard
COIFFE_F = {0: 'goggles', 1: 'glasses', 5: 'cap', 6: 'beanie', 7: 'bucket', 9: ''}
COUPE_G = ['spiky', 'spiky', 'bob', 'long', 'long', 'bob', 'spiky', 'short', 'short', 'spiky']
# accessoires : (planche, case, nom, où, échelle, morceaux)
ACC = [('03 (5)', 0, 'Lunettes rondes', 'yeux', 0.26, 1), ('03 (5)', 1, 'Lunettes de soleil', 'yeux', 0.26, 1),
       ('03 (5)', 2, 'Écharpe rouge', 'cou', 0.26, 1), ('03 (5)', 3, 'Écharpe jaune', 'cou', 0.26, 1), ('00', 6, 'Écharpe à carreaux', 'cou', 0.24, 1),
       ('03 (5)', 4, 'Gants', 'mains', 0.16, 2), ('00', 7, 'Mitaines', 'mains', 0.15, 2, 40), ('03 (5)', 5, 'Serre-poignets', 'poignets', 0.13, 2),
       ('00', 8, 'Bracelets', 'poignets', 0.11, 2), ('03 (5)', 6, 'Montre', 'poignet', 0.11, 1),
       ('03 (5)', 7, 'Pendentif bleu', 'poitrine', 0.17, 1), ('00', 9, 'Pendentif doré', 'poitrine', 0.17, 1), ('03 (5)', 8, 'Sacoche de ceinture', 'hanche', 0.2, 1)]


# ------------------------------------------------------------------ construction
class Planche:
    """les pièces d'une catégorie rangées en lignes (10 par ligne) dans une seule image"""
    def __init__(self, nom): self.nom, self.ims, self.infos = nom, [], []
    def ajoute(self, im, info): self.ims.append(im); self.infos.append(info); return info
    def ecrit(self):
        lignes = [self.ims[i:i + 10] for i in range(0, len(self.ims), 10)]
        W = max(sum(i.width + 2 for i in l) for l in lignes); H = sum(max(i.height for i in l) + 2 for l in lignes)
        out = Image.new('RGBA', (W, H)); y = 0; k = 0
        for l in lignes:
            x = 0
            for im in l:
                out.alpha_composite(im, (x, y)); self.infos[k]['r'] = [x, y, im.width, im.height]; x += im.width + 2; k += 1
            y += max(i.height for i in l) + 2
        # (palette de 256 couleurs : 4 fois plus léger, sans différence visible)
        out.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(os.path.join(DST, self.nom + '.png'), optimize=True)
        print('%-10s %2d pièces  %4dx%-4d %4d Ko' % (self.nom, len(self.ims), W, H, os.path.getsize(os.path.join(DST, self.nom + '.png')) // 1024))
        return self.infos


def corps(k, garcon):
    im = cellule(P('00 (4)'), 5, 2, k, False); im = im.resize((round(im.width * HB / im.height), HB), Image.LANCZOS)
    if garcon:
        t = int(HB * YC); a = im.crop((0, 0, im.width, t)); b = im.crop((0, t, im.width, HB))
        b = b.resize((im.width, round(b.height * CJ)), Image.LANCZOS)
        out = Image.new('RGBA', (im.width, t + b.height)); out.paste(a, (0, 0)); out.paste(b, (0, t)); im = out
    m = A(im); h, w = m.shape; xs = np.nonzero(m[:4].any(0))[0]; cx = (xs.min() + xs.max()) / 2
    def main(c0, c1):   # le plus bas des bras (colonnes extérieures, hors jambes)
        ys2, xs2 = np.nonzero(m[:, c0:c1]); yb = ys2.max(); return [round(float(xs2[ys2 >= yb - 3].mean() + c0 - cx), 1), int(yb)]
    d = int(w * 0.3)
    return im, dict(a=[round(cx, 1), 0], pieds=h - 1, mains=[main(0, int(cx - d)), main(int(cx + d), w)], peau=hexa(peau(im)))


def construire():
    os.makedirs(DST, exist_ok=True)
    K = {'HB': HB, 'epaule': round(0.07 * HB, 1), 'taille': round(0.27 * HB, 1), 'menton': round(0.05 * HB, 1)}
    # corps (fille, garçon)
    for g, nom in ((0, 'corps_f'), (1, 'corps_g')):
        pl = Planche(nom)
        for k in range(10): im, info = corps(k, g); pl.ajoute(im, info)
        K[nom] = pl.ecrit()
    # têtes de filles : menton = la peau la plus basse près du milieu
    pl = Planche('tete_f')
    for j, f in enumerate(['01', '02 (4)', '02']):
        for i in range(10):
            im = sc(cellule(P(f), 5, 2, i, False), F['tete']); a = np.array(im).astype(int); m = a[..., 3] > 128; h, w = m.shape
            pk = peau(im); sk = m & (np.abs(a[..., :3] - np.array(pk)).sum(-1) < 90)
            ys, xs = np.nonzero(sk[:, int(w * 0.38):int(w * 0.62)]); mt = int(ys.max())
            ys2, xs2 = np.nonzero(sk[max(0, mt - 4):mt + 1]); mx = float(xs2.mean())
            haut_cheveux = np.zeros_like(m); haut_cheveux[int(h * 0.2):int(h * 0.75), :int(w * 0.24)] = True; haut_cheveux[int(h * 0.2):int(h * 0.75), int(w * 0.76):] = True
            if (haut_cheveux & m).sum() < 60: haut_cheveux[:int(h * 0.3)] = True
            long_ = bool((m[mt + int(0.08 * HB):] if mt + int(0.08 * HB) < h else m[h:]).any())
            info = dict(a=[round(mx, 1), mt], peau=hexa(pk), cheveux=hexa(couleur(im, zone=haut_cheveux)), coupe='long' if long_ else 'bob')
            if j == 0 and i in COIFFE_F: info['coiffe'] = COIFFE_F[i]
            pl.ajoute(im, info)
    K['tete_f'] = pl.ecrit()
    # têtes de garçons
    coiffures = [cellule(P('04 (5)'), 5, 2, k, True) for k in range(10)]; visage = cellule(P('04 (3)'), 5, 2, 0, True)
    pl = Planche('tete_g')
    for k in range(10):
        im, rk = tete_garcon(coiffures, visage, k); f = F['tete']; im2 = sc(im, f)
        zone = np.zeros(im2.size[::-1], bool); zone[:int(im2.height * 0.3)] = True
        pl.ajoute(im2, dict(a=[round(rk['cx'] * f, 1), int(rk['menton'] * f)], peau=hexa(peau(im2)), cheveux=hexa(couleur(im2, zone=zone)), coupe=COUPE_G[k]))
    K['tete_g'] = pl.ecrit()
    # hauts : la ligne des épaules (haut des colonnes à ± 32 % du milieu)
    pl = Planche('haut')
    for cat, f, clair in (('haut_f', '02 (3)', False), ('tshirt', '03 (3)', True), ('veste', '03 (2)', True)):
        for i in range(10):
            im = sc(cellule(P(f), 5, 2, i, clair), F[cat]); m = A(im); h, w = m.shape; ep = []
            for x in (int(w / 2 - w * 0.32), int(w / 2 + w * 0.32)):
                ys = np.nonzero(m[:, x])[0]
                if len(ys): ep.append(int(ys[0]))
            pl.ajoute(im, dict(a=[w / 2, round(float(np.mean(ep)), 1)], peau=hexa(peau(im)), coul=hexa(couleur(im)), nom=NOMS[cat][i], type=TYPE[cat][i]))
    K['haut'] = pl.ecrit()
    # ensembles (tenues complètes sans tête) : à la taille d'un corps de fille, le haut du cou en repère
    pl = Planche('ensemble')
    for j, f in enumerate(['01 (2)', '01 (3)']):
        for i in range(10):
            im = cellule(P(f), 5, 2, i, False); im = im.resize((round(im.width * HB * 1.0 / im.height), HB), Image.LANCZOS)
            m = A(im); xs = np.nonzero(m[:4].any(0))[0]
            pl.ajoute(im, dict(a=[round((xs.min() + xs.max()) / 2, 1), 0], peau=hexa(peau(im)), coul=hexa(couleur(im)), nom='Ensemble %d' % (10 * j + i + 1)))
    K['ensemble'] = pl.ecrit()
    # bas : filles (jambes et chaussures comprises : calés sur les pieds) ; garçons (calés à la taille)
    for cat, f, clair in (('bas_f', '01 (4)', False), ('bas_g', '03 (4)', True)):
        pl = Planche(cat)
        for i in range(10):
            im = sc(cellule(P(f), 5, 2, i, clair), F[cat]); w, h = im.size
            pl.ajoute(im, dict(a=[w / 2, h - 1 if cat == 'bas_f' else 0], peau=hexa(peau(im)), coul=hexa(couleur(im)), nom=NOMS[cat][i], type=TYPE[cat][i]))
        K[cat] = pl.ecrit()
    # chaussures (la semelle sur le sol)
    pl = Planche('chaus')
    for cat, f, clair in (('chaus_f', '02 (2)', False), ('chaus_g', '03', True)):
        for i in range(10):
            im = sc(cellule(P(f), 5, 2, i, clair), F[cat]); w, h = im.size
            pl.ajoute(im, dict(a=[w / 2, h - 1], coul=hexa(couleur(im)), nom=NOMS[cat][i]))
    K['chaus'] = pl.ecrit()
    # chapeaux
    pl = Planche('chapeau')
    for i in range(10):
        if CHAPEAU[i] is None: continue
        im = sc(cellule(P('04'), 5, 2, i, True), F['chapeau']); w, h = im.size
        pl.ajoute(im, dict(a=[w / 2, h - 1], dy=CHAPEAU[i][0], derriere=CHAPEAU[i][1], nom=NOMS['chapeau'][i], type=TYPE['chapeau'][i]))
    K['chapeau'] = pl.ecrit()
    # sacs (portés derrière, sur le côté)
    pl = Planche('sac')
    for cat, f, clair, n in (('sac', '04 (2)', True, 10), ('sac_f', '00', False, 6)):
        for i in range(n):
            im = sc(cellule(P(f), 5, 2, i, clair), F[cat]); w, h = im.size
            pl.ajoute(im, dict(a=[w / 2, h / 2], nom=NOMS[cat][i]))
    K['sac'] = pl.ecrit()
    # accessoires (une paire : deux pièces, gauche puis droite)
    pl = Planche('acc'); acc = []
    for f, i, nom, ou, e, n, *mg in ACC:
        im = cellule(P(f), 5, 2, i, f.startswith('03'), *mg)
        ps = morceaux(im, 2, 1 if nom == 'Bracelets' else 0) if n == 2 else [im]
        acc.append(dict(nom=nom, ou=ou, p=[len(pl.ims) + j for j in range(len(ps))]))
        for p in ps: p = sc(p, e); pl.ajoute(p, dict(a=[p.width / 2, p.height / 2]))
    infos = pl.ecrit()
    K['acc'] = [dict(x, p=[infos[j] for j in x['p']]) for x in acc]
    with open(JS, 'w', encoding='utf-8', newline='\n') as fo:
        fo.write("'use strict';\n// Fait par dev/kit_persos.py (ne pas modifier à la main) : repères des pièces du kit d'habillage du joueur\n")
        fo.write('// (assets/commun/kit/<catégorie>.png ; r = [x, y, l, h] dans la planche, a = point d\'ancrage dans la pièce)\n')
        fo.write('DW.KIT = ' + json.dumps(K, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('->', os.path.relpath(JS, os.path.join(ICI, '..')), os.path.getsize(JS) // 1024, 'Ko')


if __name__ == '__main__':
    construire()
