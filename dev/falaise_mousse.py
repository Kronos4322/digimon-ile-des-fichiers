"""
FALAISE MOUSSUE : la paroi des falaises « C » des prairies (Champs, Lisière du Ravin, ville...), tirée de la planche
Montagnes du joueur (photo_2026-10-19_18-08-55.jpg, 4e bloc : roche grise moussue) -> assets/commun/jeu/falaise_mousse.webp

La planche montre un pan de falaise vu de biais (sur fond vert) ; il faut une bande vue de face qui se répète en largeur :
1. le bloc est détouré (clé verte démêlée au contour) puis REDRESSÉ : chaque colonne est remise entre le haut et le bas de
   la paroi (droites ajustées sur ses bords), les piliers restent verticaux, les joints deviennent horizontaux ;
2. la bande est RECOUSUE en largeur (« quilting ») : des morceaux de la planche pris au hasard, joints par des coutures qui
   suivent le chemin de moindre différence (entre deux piliers, le plus souvent) ; la fin est recousue sur le début :
   la bande se répète tous les 240 px du jeu (15 cases), sans motif qui revienne plus tôt ;
3. une VERSION PAR HAUTEUR de falaise (1, 2, 3, 4 cases : 16, 32, 48, 64 px du jeu, empilées dans l'image) : le rebord
   moussu du haut, la roche, et le pied (éboulis, herbe) gardent leur taille ; la roche du milieu est raccourcie, ses
   morceaux joints par des coutures horizontales de moindre différence. Le dessus de la mousse (vu d'en haut sur la
   planche) est laissé de côté : c'est l'herbe de la carte qui s'y fond (le haut est transparent, en bord irrégulier).
Le jeu (gfx/terrain.js) peint les pixels transparents avec l'herbe de la carte, et teinte la mousse de la même herbe.

Lancer depuis le dossier du projet :   python dev/falaise_mousse.py            (écrit l'image du jeu)
                                       python dev/falaise_mousse.py apercu.png (et une planche d'aperçu, agrandie)
"""
import os, sys
import numpy as np
from PIL import Image

ICI = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(ICI, '..', 'assets', 'ASSETS - Digimon', 'Montagnes', 'photo_2026-10-19_18-08-55.jpg')
SORTIE = os.path.join(ICI, '..', 'assets', 'commun', 'jeu', 'falaise_mousse.webp')
BLOC = (755, 10, 1015, 450)       # le bloc moussu sur la planche (x0, y0, x1, y1)
UTILE = (30, 245)                 # colonnes du bloc gardées (sans ses deux bouts arrondis)
HS = 330                          # hauteur de la paroi redressée (pixels de la planche)
ECH = 96 / HS                     # la paroi entière ferait 96 px du jeu (6 cases) : piliers de 8 à 12 px
P = 825                           # période de la bande (planche) = 240 px du jeu
HAUTEURS = (16, 32, 48, 64)       # versions, dans l'ordre de l'image
LIP0 = 34                         # première ligne gardée du rebord moussu (au-dessus : le dessus de la mousse, vu d'en haut)
CLE = np.array([2, 250, 4], np.float32)


def redresser():
    a = np.asarray(Image.open(SOURCE).convert('RGB')).astype(np.float32)[BLOC[1]:BLOC[3], BLOC[0]:BLOC[2]]
    k = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    alpha = np.clip((100 - k) / 60, 0, 1)                  # opaque si le vert dépasse peu, transparent sur la clé
    am = np.maximum(alpha, 0.05)[..., None]
    a = np.where(alpha[..., None] < 1, (a - (1 - am) * CLE) / am, a).clip(0, 255)   # démêlage : le vert quitte le contour
    H, W = alpha.shape
    haut = np.full(W, np.nan); bas = np.full(W, np.nan)
    for x in range(W):
        ys = np.where(alpha[:, x] > 0.5)[0]
        if len(ys) > 20: haut[x] = ys.min(); bas[x] = ys.max()
    xs = np.arange(W); sel = (xs >= UTILE[0]) & (xs <= UTILE[1])
    ph = np.polyfit(xs[sel], haut[sel], 1); pb = np.polyfit(xs[sel], bas[sel], 1)
    S = np.zeros((HS, UTILE[1] - UTILE[0], 4), np.float32)
    for i, x in enumerate(range(*UTILE)):
        t0 = np.polyval(ph, x) - 6; t1 = np.polyval(pb, x) + 4
        ys = t0 + (np.arange(HS) + 0.5) / HS * (t1 - t0)
        y0 = np.clip(np.floor(ys).astype(int), 0, H - 1); y1 = np.clip(y0 + 1, 0, H - 1); f = ys - np.floor(ys)
        S[:, i, :3] = a[y0, x] * (1 - f)[:, None] + a[y1, x] * f[:, None]
        S[:, i, 3] = alpha[y0, x] * (1 - f) + alpha[y1, x] * f
    return S


def cout(A, B):
    """Différence par pixel entre deux morceaux (couleur pondérée par l'opacité, et opacité)."""
    return ((A[..., :3] * A[..., 3:4] - B[..., :3] * B[..., 3:4]) ** 2).sum(-1) / 3 + ((A[..., 3] - B[..., 3]) * 255) ** 2


def chemin(E):
    """Couture de moindre coût de haut en bas de E (h, w) : la colonne choisie pour chaque ligne (pas de ±1)."""
    h, w = E.shape; C = E.copy(); arg = np.zeros((h, w), int)
    for y in range(1, h):
        p = C[y - 1]; st = np.stack([np.r_[np.inf, p[:-1]], p, np.r_[p[1:], np.inf]])
        C[y] += st.min(0); arg[y] = np.arange(w) + st.argmin(0) - 1
    seam = np.zeros(h, int); seam[-1] = int(np.argmin(C[-1]))
    for y in range(h - 1, 0, -1): seam[y - 1] = arg[y, seam[y]]
    return seam


def recoudre(S, graine=7, B=84, O=26):
    """Bande de période P, faite de morceaux de S (largeur B, recouvrement O) joints par des coutures verticales."""
    rng = np.random.default_rng(graine); WS = S.shape[1]
    out = np.zeros((HS, P + B + O, 4), np.float32)
    u = int(rng.integers(0, WS - B)); out[:, :B] = S[:, u:u + B]; pos = B - O; prev = u
    while pos < P + O:
        cands = sorted((cout(out[:, pos:pos + O], S[:, v:v + O]).mean(), v) for v in range(0, WS - B + 1, 2)
                       if abs(v - (prev + B - O)) >= 30)   # (pas la simple suite de la planche : on la recopierait)
        v = cands[int(rng.integers(0, max(1, len(cands) // 8)))][1]
        seam = chemin(cout(out[:, pos:pos + O], S[:, v:v + O]))
        blk = S[:, v:v + B].copy()
        for y in range(HS): blk[y, :seam[y]] = out[y, pos:pos + seam[y]]
        out[:, pos:pos + B] = blk; prev = v; pos += B - O
    seam = chemin(cout(out[:, P:P + O], out[:, :O]))         # la fin recousue sur le début : bande périodique
    band = out[:, :P].copy()
    for y in range(HS): band[y, :seam[y]] = out[y, P:P + seam[y]]
    return band


def joindre(A, B, ov):
    """A posé sur B, ses ov dernières lignes recouvrant les ov premières de B : couture horizontale (périodique en x)."""
    zA, zB = A[-ov:], B[:ov]
    E = cout(zA, zB).T
    seam = chemin(np.concatenate([E, E, E], 0))[P:2 * P]
    z = zB.copy()
    for x in range(P): z[:seam[x], x] = zA[:seam[x], x]
    return np.concatenate([A[:-ov], z, B[ov:]], 0)


def version(band, hj):
    """La falaise de hj px du jeu : rebord moussu, roche raccourcie, pied ; le haut fondu (transparent) dans l'herbe."""
    hs = int(round(hj / ECH))
    L = int(round(10 + (hj - 16) * 0.25)); F = int(round(9 + (hj - 16) * 0.4)); M = hs - L - F; ov = max(8, min(20, M // 3))
    # (la roche du milieu : prise dans le haut des piliers, éclairé — leur pied, sombre, est déjà dans le pied de la paroi)
    m0 = min(range(56, max(57, min(150, HS - 40 - M)), 3), key=lambda m: cout(band[LIP0 + L:LIP0 + L + ov], band[m:m + ov]).mean()
             + cout(band[m + M - ov:m + M], band[HS - F - ov:HS - F]).mean())
    T = joindre(joindre(band[LIP0:LIP0 + L + ov], band[m0:m0 + M], ov), band[HS - F - ov:], ov)
    bruit = np.convolve(np.random.default_rng(11).random(P + 16), np.ones(9) / 9, 'same')[8:P + 8]
    bord = 2 + (bruit - bruit.min()) / (np.ptp(bruit) + 1e-6) * 6
    T[..., 3] *= np.clip((np.arange(hs)[:, None] - bord[None, :]) / 3, 0, 1)
    return T


def reduire(arr, w, h):
    """À la taille du jeu, en gardant la périodicité (bordé de ses colonnes opposées), couleurs prémultipliées."""
    pad = 24
    ext = np.concatenate([arr[:, -pad:], arr, arr[:, :pad]], 1)
    im_rgb = Image.fromarray((ext[..., :3] * ext[..., 3:4]).clip(0, 255).astype(np.uint8))
    im_a = Image.fromarray((ext[..., 3] * 255).clip(0, 255).astype(np.uint8))
    W2 = int(round(ext.shape[1] * w / arr.shape[1])); p2 = int(round(pad * w / arr.shape[1]))
    rr = np.asarray(im_rgb.resize((W2, h), Image.LANCZOS)).astype(np.float32)[:, p2:p2 + w]
    aa = np.asarray(im_a.resize((W2, h), Image.LANCZOS)).astype(np.float32)[:, p2:p2 + w] / 255
    rr = np.where(aa[..., None] > 0.02, rr / np.maximum(aa[..., None], 0.02), 0)
    return np.dstack([rr.clip(0, 255), (aa * 255).clip(0, 255)]).astype(np.uint8)


def main():
    band = recoudre(redresser())
    # roche un peu plus claire que sur la planche (à côté de l'herbe claire des prairies, elle faisait un trou sombre)
    rgb = band[..., :3]; mousse = (rgb[..., 1] > rgb[..., 0] + 8) & (rgb[..., 1] > rgb[..., 2] + 30)
    band[..., :3] = np.where(mousse[..., None], rgb, (rgb * 1.12 + 8).clip(0, 255))
    PJ = int(round(P * ECH))
    atlas = np.concatenate([reduire(version(band, h), PJ, h) for h in HAUTEURS], 0)
    Image.fromarray(atlas, 'RGBA').save(SORTIE, 'WEBP', lossless=True, method=6)
    print('falaise_mousse.webp', atlas.shape[1], 'x', atlas.shape[0], '-', os.path.getsize(SORTIE), 'octets')
    if len(sys.argv) > 1:   # aperçu : chaque version deux fois de suite sur de l'herbe unie, agrandie 2 fois
        im = Image.fromarray(atlas, 'RGBA'); w = im.width
        fond = Image.new('RGBA', (w * 2, atlas.shape[0] + 8 * len(HAUTEURS)), (88, 140, 60, 255)); y = 0
        for k, h in enumerate(HAUTEURS):
            part = im.crop((0, y, w, y + h)); fond.alpha_composite(part, (0, y + k * 8)); fond.alpha_composite(part, (w, y + k * 8)); y += h
        fond.resize((fond.width * 2, fond.height * 2), Image.NEAREST).save(sys.argv[1])


if __name__ == '__main__':
    main()
