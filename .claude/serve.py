# Local preview server for the portfolio: like `python3 -m http.server`, but tells the
# browser not to cache, so edits to CSS/JS show up on a normal refresh.
import functools
import http.server
import sys
from pathlib import Path


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    root = Path(__file__).resolve().parent.parent
    handler = functools.partial(NoCacheHandler, directory=str(root))
    http.server.ThreadingHTTPServer(("", port), handler).serve_forever()
