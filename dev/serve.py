# Serveur de développement local sans cache (python dev/serve.py [port])
# POST /dev/save?name=xxx.png  : enregistre le corps (image PNG ou fichier texte) dans le dossier dev/captures/
#                                (utilisé par dev/captures.js pour la galerie de captures d'écran)
# ATELIER DES CARTES (dossier dev/editeur/, seulement sur ce PC : le serveur n'écoute que 127.0.0.1)
# POST /dev/retouches            : réécrit js/maps/retouches_donnees.js (les cartes retouchées) ; copie de sûreté
#                                  de l'ancienne version dans dev/editeur/sauvegardes/
# GET  /dev/retouches_validees   : la dernière version VALIDÉE de ce fichier (celle du dernier commit) : l'atelier
#                                  compare avec elle pour lister ce qui reste à faire valider
# POST /dev/validation?name=...  : le rapport « à valider » (a_valider.md) et ses images avant / après, dans
#                                  dev/editeur/validation/ ; POST /dev/validation?vider=1 : on repart d'un dossier vide
# (pas de publication directe : Claude relit le rapport, vérifie les cartes, puis met en ligne)
import http.server, os, sys, re, urllib.parse, shutil, subprocess, time

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
RET = os.path.join(ROOT, 'js', 'maps', 'retouches_donnees.js')
VALIDATION = os.path.join(ROOT, 'dev', 'editeur', 'validation')

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Document-Policy', 'js-profiling')   # (mesure des performances : new Profiler() dans la page)
        super().end_headers()

    def reply(self, code, text):
        data = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if urllib.parse.urlparse(self.path).path == '/dev/retouches_validees':
            r = subprocess.run(['git', 'show', 'HEAD:js/maps/retouches_donnees.js'], cwd=ROOT, capture_output=True)
            return self.reply(200, r.stdout.decode('utf-8', errors='replace') if r.returncode == 0 else '')
        return super().do_GET()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        size = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(size)
        query = urllib.parse.parse_qs(url.query)
        if url.path == '/dev/retouches':
            txt = data.decode('utf-8')
            if not txt.lstrip().startswith("'use strict';") or 'DW.RETOUCHES = ' not in txt:
                return self.reply(400, 'contenu inattendu')
            if os.path.exists(RET):
                out = os.path.join(ROOT, 'dev', 'editeur', 'sauvegardes')
                os.makedirs(out, exist_ok=True)
                old = sorted(f for f in os.listdir(out) if f.startswith('retouches_'))
                # (une copie au plus toutes les 5 minutes : la sauvegarde automatique ne noie pas les anciennes versions)
                if not old or time.time() - os.path.getmtime(os.path.join(out, old[-1])) > 300:
                    shutil.copy(RET, os.path.join(out, time.strftime('retouches_%Y%m%d_%H%M%S.js')))
                old = sorted(f for f in os.listdir(out) if f.startswith('retouches_'))
                for f in old[:-40]:   # on garde les 40 dernières versions
                    os.remove(os.path.join(out, f))
            with open(RET, 'w', encoding='utf-8', newline='\n') as f:
                f.write(txt.replace('\r\n', '\n'))
            return self.reply(200, 'ok')
        if url.path == '/dev/validation':
            os.makedirs(VALIDATION, exist_ok=True)
            if query.get('vider'):
                for f in os.listdir(VALIDATION):
                    if re.fullmatch(r'[a-zA-Z0-9_\-]+\.(png|md)', f):
                        os.remove(os.path.join(VALIDATION, f))
                return self.reply(200, 'ok')
            name = query.get('name', [''])[0]
            if not re.fullmatch(r'[a-zA-Z0-9_\-]+\.(png|md)', name):
                return self.reply(400, 'nom de fichier invalide')
            with open(os.path.join(VALIDATION, name), 'wb') as f:
                f.write(data)
            return self.reply(200, 'ok')
        name = query.get('name', [''])[0]
        # nom de fichier simple uniquement, dans dev/captures/
        if url.path != '/dev/save' or not re.fullmatch(r'[a-zA-Z0-9_\-]+\.(png|html)', name):
            self.send_error(400, 'requete invalide')
            return
        out = os.path.join(ROOT, 'dev', 'captures')
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, name), 'wb') as f:
            f.write(data)
        self.reply(200, 'ok')

os.chdir(ROOT)
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
http.server.ThreadingHTTPServer.request_queue_size = 128   # (le jeu charge des dizaines d'images d'un coup)
http.server.ThreadingHTTPServer(('127.0.0.1', port), NoCache).serve_forever()
