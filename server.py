from __future__ import annotations

import json
import os
import secrets
from hashlib import sha256
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from company_directory import CompanyDirectoryService
from models import User
from repository import Repository

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
repository = Repository(str(ROOT_DIR / "app.db"))
repository.init_db()
SESSION_COOKIE_NAME = "session_id"


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
        if parsed.path == "/api/company-insights":
            return self._handle_company_insights(parsed.query)
        if parsed.path == "/api/auth/me":
            return self._handle_auth_me()
        if parsed.path == "/api/user/saved-employers":
            return self._handle_list_saved_employers()

        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/auth/register":
            return self._handle_auth_register()
        if parsed.path == "/api/auth/login":
            return self._handle_auth_login()
        if parsed.path == "/api/auth/logout":
            return self._handle_auth_logout()
        if parsed.path == "/api/user/saved-employers":
            return self._handle_save_employer()
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

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

    def _handle_company_insights(self, raw_query: str) -> None:
        params = parse_qs(raw_query)
        name = params.get("name", [""])[0].strip()
        domain = params.get("domain", [""])[0].strip().lower()
        country = params.get("country", [""])[0].strip().upper()
        if not name:
            return self._send_json({"employees": [], "email_terminations": []})

        insights = _build_company_insights(name=name, domain=domain, country=country)
        self._send_json(insights)

    def _send_json(self, payload_obj: dict) -> None:
        payload = json.dumps(payload_obj).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}

    def _session_cookie(self) -> str:
        raw = self.headers.get("Cookie", "")
        for chunk in raw.split(";"):
            part = chunk.strip()
            if part.startswith(f"{SESSION_COOKIE_NAME}="):
                return part.split("=", 1)[1]
        return ""

    def _current_user(self):
        session_id = self._session_cookie()
        if not session_id:
            return None
        return repository.get_user_by_session(session_id)

    def _send_json_with_cookie(self, payload_obj: dict, set_cookie_header: str) -> None:
        payload = json.dumps(payload_obj).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Set-Cookie", set_cookie_header)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_status_json(self, status: int, payload_obj: dict) -> None:
        payload = json.dumps(payload_obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _handle_auth_register(self) -> None:
        data = self._read_json_body()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        display_name = str(data.get("display_name", "")).strip()
        if not email or not password or not display_name:
            return self._send_status_json(HTTPStatus.BAD_REQUEST, {"error": "email, password, display_name required"})
        if len(password) < 8:
            return self._send_status_json(HTTPStatus.BAD_REQUEST, {"error": "password must be at least 8 characters"})
        if repository.get_user_by_email(email):
            return self._send_status_json(HTTPStatus.CONFLICT, {"error": "email already registered"})

        password_hash = _hash_password(password)
        user = User(email=email, password_hash=password_hash, display_name=display_name)
        repository.create_user(user)
        return self._send_status_json(
            HTTPStatus.CREATED,
            {"user": {"id": user.user_id, "email": user.email, "display_name": user.display_name, "role": user.role.value}},
        )

    def _handle_auth_login(self) -> None:
        data = self._read_json_body()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        user = repository.get_user_by_email(email) if email else None
        if not user or not _verify_password(password, user.password_hash):
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "invalid credentials"})

        session_id = secrets.token_urlsafe(32)
        expires_at = _session_expiry_iso(days=14)
        repository.create_session(session_id=session_id, user_id=user.user_id, expires_at_iso=expires_at)
        cookie = f"{SESSION_COOKIE_NAME}={session_id}; Path=/; HttpOnly; SameSite=Lax"
        return self._send_json_with_cookie(
            {"user": {"id": user.user_id, "email": user.email, "display_name": user.display_name, "role": user.role.value}},
            cookie,
        )

    def _handle_auth_logout(self) -> None:
        session_id = self._session_cookie()
        if session_id:
            repository.delete_session(session_id)
        cookie = f"{SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
        return self._send_json_with_cookie({"ok": True}, cookie)

    def _handle_auth_me(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        return self._send_json(
            {"user": {"id": user.user_id, "email": user.email, "display_name": user.display_name, "role": user.role.value}}
        )

    def _handle_save_employer(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        data = self._read_json_body()
        company_name = str(data.get("company_name", "")).strip()
        employer_name = str(data.get("employer_name", "")).strip()
        employer_role = str(data.get("employer_role", "")).strip()
        if not company_name or not employer_name or not employer_role:
            return self._send_status_json(
                HTTPStatus.BAD_REQUEST,
                {"error": "company_name, employer_name, employer_role are required"},
            )
        repository.save_valuable_employer_for_user(
            user_id=user.user_id,
            company_name=company_name,
            company_domain=str(data.get("company_domain", "")).strip() or None,
            company_logo=str(data.get("company_logo", "")).strip() or None,
            employer_name=employer_name,
            employer_role=employer_role,
            employer_email=str(data.get("employer_email", "")).strip() or None,
            employer_location=str(data.get("employer_location", "")).strip() or None,
            lead_score=float(data.get("lead_score", 0)),
        )
        return self._send_json({"ok": True})

    def _handle_list_saved_employers(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        return self._send_json({"items": repository.list_saved_employers_for_user(user.user_id)})


def _build_company_insights(name: str, domain: str, country: str) -> dict:
    company_slug = "".join(ch for ch in name.lower() if ch.isalnum()) or "company"
    domain_base = domain or f"{company_slug}.company"
    digest = sha256(f"{name}|{domain_base}|{country}".encode("utf-8")).hexdigest()

    ro_context = country == "RO" or any(k in name.lower() for k in ("arobs", "fortech", "uipath", "bitdefender"))
    if ro_context:
        base_people = [
            ("Tudor", "Popescu", "Technical Partnerships Manager", "Cluj-Napoca, Romania"),
            ("Razvan", "Ionescu", "Director of Implementation", "Bucharest, Romania"),
            ("Andrei", "Marinescu", "Solutions Engineering Lead", "Timisoara, Romania"),
            ("Calin", "Vaduva", "Head of Strategic Accounts", "Oradea, Romania"),
            ("Voicu", "Oprean", "Executive Advisor - Growth", "Cluj-Napoca, Romania"),
        ]
    else:
        base_people = [
            ("Heather", "Taylor", "User Research Manager", "Berlin, Germany"),
            ("Brandon", "Anders", "Director of Partner Engineering", "London, UK"),
            ("Sara", "Stone", "Director of Creator Partnerships", "Paris, France"),
            ("William", "Lane", "Director of Analytics", "Madrid, Spain"),
            ("Tim", "Keller", "Director of Partnerships", "Amsterdam, Netherlands"),
        ]

    employees = []
    for idx, person in enumerate(base_people):
        first, last, role, location = person
        p_seed = int(digest[idx * 4 : idx * 4 + 4], 16)
        dept_rise = 8 + (p_seed % 18)
        interviews = 2 + (p_seed % 7)
        contact = 52 + (p_seed % 44)
        score = min(98, 58 + (p_seed % 40))
        employees.append(
            {
                "id": f"{company_slug}-{first.lower()}-{last.lower()}",
                "first_name": first,
                "last_name": last,
                "role": role,
                "email": f"{{redacted}}@{domain_base}",
                "location": location,
                "department_rise_percent": dept_rise,
                "interviews_held_recently": interviews,
                "contact_likelihood_percent": contact,
                "valuable_lead_score": score,
                "outreach_window": "Best in next 7 days" if idx % 2 == 0 else "Strong this month",
            }
        )

    root = domain_base.replace("www.", "")
    prefix = root.split(".", 1)[0]
    terminations = [
        f"@{root}",
        f"@careers.{root}",
        f"@people.{root}",
        f"@{prefix}.io",
    ]
    return {"employees": employees, "email_terminations": terminations}


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()
    return f"{salt}:{digest}"


def _verify_password(password: str, stored: str) -> bool:
    if ":" not in stored:
        return False
    salt, digest = stored.split(":", 1)
    candidate = sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()
    return secrets.compare_digest(candidate, digest)


def _session_expiry_iso(days: int = 14) -> str:
    from datetime import datetime, timedelta, timezone

    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def run(host: str = "127.0.0.1", port: int = 5500) -> None:
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"Server running at http://{host}:{port}")
    print(f"Frontend: http://{host}:{port}/")
    print(f"API: http://{host}:{port}/api/company-search?q=arobs&country=ro")
    server.serve_forever()


if __name__ == "__main__":
    configured_port = int(os.getenv("APP_PORT", "5500"))
    run(port=configured_port)
