from __future__ import annotations

import json
import os
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from company_directory import CompanyDirectoryService

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"

def _load_dotenv() -> None:
    env_path = ROOT_DIR / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value

_load_dotenv()

directory_service = CompanyDirectoryService(
    brandfetch_client_id=os.getenv("BRANDFETCH_CLIENT_ID"),
)


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.path = "/frontend/index.html"
            return super().do_GET()

        if parsed.path == "/api/company-search":
            return self._handle_company_search(parsed.query)

        return super().do_GET()

    def _handle_company_search(self, raw_query: str) -> None:
        params = parse_qs(raw_query)
        query = params.get("q", [""])[0]
        limit_raw = params.get("limit", ["12"])[0]
        country = params.get("country", [""])[0] or None

        try:
            limit = max(1, min(int(limit_raw), 30))
        except ValueError:
            limit = 12

        companies = directory_service.search(query=query, limit=limit, country=country)
        payload = json.dumps({"companies": companies}).encode("utf-8")

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def run(host: str = "127.0.0.1", port: int = 5500) -> None:
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"Server running at http://{host}:{port}")
    print(f"Frontend: http://{host}:{port}/")
    print(f"API: http://{host}:{port}/api/company-search?q=arobs&country=ro")
    server.serve_forever()


if __name__ == "__main__":
    configured_port = int(os.getenv("APP_PORT", "5500"))
    run(port=configured_port)
