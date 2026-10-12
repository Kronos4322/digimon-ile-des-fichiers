# Serveur de développement local sans cache (python dev/serve.py)
# POST /dev/save?name=xxx.png  : enregistre le corps (image PNG ou fichier texte) dans le dossier captures/
#                                (utilisé par dev/captures.js pour la galerie de captures d'écran)
import http.server, os, sys, re, urllib.parse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        name = urllib.parse.parse_qs(url.query).get('name', [''])[0]
        # nom de fichier simple uniquement, dans captures/
        if url.path != '/dev/save' or not re.fullmatch(r'[a-zA-Z0-9_\-]+\.(png|html)', name):
            self.send_error(400, 'requete invalide')
            return
        size = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(size)
        out = os.path.join(ROOT, 'captures')
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, name), 'wb') as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'ok')

os.chdir(ROOT)
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
http.server.ThreadingHTTPServer(('127.0.0.1', port), NoCache).serve_forever()
