#!/usr/bin/env python3
"""Start a local preview server for all three scenes and open the browser."""

import http.server
import os
import socketserver
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8123"))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def open_preview():
    webbrowser.open(f"http://127.0.0.1:{PORT}/#dining")


if __name__ == "__main__":
    os.chdir(ROOT)
    try:
        httpd = Server(("127.0.0.1", PORT), Handler)
    except OSError:
        print(f"Preview already running on port {PORT}; opening it.")
        open_preview()
        raise SystemExit(0)

    threading.Timer(1.2, open_preview).start()
    with httpd:
        print(f"Combined preview : http://127.0.0.1:{PORT}/#dining")
        print(f"Kitchen preview  : http://127.0.0.1:{PORT}/#kitchen")
        print(f"Single dorm home : http://127.0.0.1:{PORT}/")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
