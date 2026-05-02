from __future__ import annotations

import json
import os
import secrets
import threading
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from company_directory import CompanyDirectoryService
from models import User
from paths import (
    get_app_db_path,
    get_company_cache_db_path,
    get_curated_leaders_path,
    get_dotenv_path,
    get_frontend_dir,
    get_seed_companies_path,
)
from repository import Repository

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = get_frontend_dir()
CURATED_LEADERS_PATH = get_curated_leaders_path()

def _load_dotenv() -> None:
    env_path = get_dotenv_path()
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


def _normalize_key(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum())


def _load_curated_company_leaders() -> list[dict]:
    if not CURATED_LEADERS_PATH.exists():
        return []
    try:
        raw = json.loads(CURATED_LEADERS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(raw, list):
        return []
    cleaned: list[dict] = []
    for entry in raw:
        if not isinstance(entry, dict):
            continue
        company_keys = entry.get("company_keys")
        leaders = entry.get("leaders")
        if not isinstance(company_keys, dict) or not isinstance(leaders, list):
            continue
        names = [n.strip() for n in company_keys.get("names", []) if isinstance(n, str) and n.strip()]
        domains = [d.strip().lower() for d in company_keys.get("domains", []) if isinstance(d, str) and d.strip()]
        normalized_leaders = []
        for leader in leaders:
            if not isinstance(leader, dict):
                continue
            first_name = str(leader.get("first_name", "")).strip()
            last_name = str(leader.get("last_name", "")).strip()
            role = str(leader.get("role", "")).strip()
            if not first_name or not last_name or not role:
                continue
            normalized_leaders.append({"first_name": first_name, "last_name": last_name, "role": role})
        if names and normalized_leaders:
            cleaned.append({"company_keys": {"names": names, "domains": domains}, "leaders": normalized_leaders})
    return cleaned


CURATED_COMPANY_LEADERS = _load_curated_company_leaders()


def _match_curated_leaders(company_name: str, company_domain: str) -> list[dict]:
    normalized_name = _normalize_key(company_name)
    normalized_domain = company_domain.lower().strip().removeprefix("www.")
    for entry in CURATED_COMPANY_LEADERS:
        keys = entry["company_keys"]
        name_matches = any(_normalize_key(candidate) in normalized_name or normalized_name in _normalize_key(candidate) for candidate in keys["names"])
        domain_matches = any(
            normalized_domain == domain or normalized_domain.endswith(f".{domain}") or domain.endswith(f".{normalized_domain}")
            for domain in keys["domains"]
            if normalized_domain
        )
        if name_matches or domain_matches:
            return entry["leaders"]
    return []

directory_service = CompanyDirectoryService(
    brandfetch_client_id=os.getenv("BRANDFETCH_CLIENT_ID"),
    cache_db_path=str(get_company_cache_db_path()),
    seed_json_path=str(get_seed_companies_path()),
)
repository = Repository(str(get_app_db_path()))
repository.init_db()
SESSION_COOKIE_NAME = "session_id"


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR.parent), **kwargs)

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
        if parsed.path == "/api/user/profile":
            return self._handle_get_user_profile()
        if parsed.path == "/api/user/lead-notes":
            return self._handle_list_user_lead_notes()
        if parsed.path == "/api/user/lead-status":
            return self._handle_list_user_lead_statuses()
        if parsed.path == "/api/user/lead-notifications":
            return self._handle_list_user_lead_notifications(parsed.query)

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
        if parsed.path == "/api/user/profile":
            return self._handle_upsert_user_profile()
        if parsed.path == "/api/user/lead-notes":
            return self._handle_upsert_user_lead_note()
        if parsed.path == "/api/user/lead-status":
            return self._handle_upsert_user_lead_status()
        if parsed.path == "/api/user/lead-notifications/read":
            return self._handle_mark_user_lead_notifications_read()
        if parsed.path == "/api/user/lead-notifications/test":
            return self._handle_create_test_user_lead_notification()
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/user/saved-employers":
            params = parse_qs(parsed.query)
            saved_employer_id = params.get("id", [""])[0].strip()
            if saved_employer_id:
                return self._handle_delete_saved_employer_by_id(saved_employer_id)
            company_name = params.get("company_name", [""])[0].strip()
            employer_name = params.get("employer_name", [""])[0].strip()
            employer_role = params.get("employer_role", [""])[0].strip()
            if company_name and employer_name and employer_role:
                return self._handle_delete_saved_employer(company_name, employer_name, employer_role)
            return self._handle_clear_saved_employers()
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

    def _handle_clear_saved_employers(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        repository.clear_saved_employers_for_user(user.user_id)
        return self._send_json({"ok": True})

    def _handle_get_user_profile(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        profile = repository.get_user_profile(user.user_id)
        return self._send_json(
            {
                "user": {
                    "id": user.user_id,
                    "email": user.email,
                    "display_name": user.display_name,
                    "role": user.role.value,
                },
                "profile": profile,
            }
        )

    def _handle_upsert_user_profile(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        data = self._read_json_body()
        headline = str(data.get("headline", "")).strip()
        cv_text = str(data.get("cv_text", "")).strip()
        target_sectors = str(data.get("target_sectors", "")).strip()
        target_company_size = str(data.get("target_company_size", "")).strip()
        target_countries = str(data.get("target_countries", "")).strip()
        target_work_mode = str(data.get("target_work_mode", "")).strip()
        repository.upsert_user_profile(
            user.user_id,
            headline=headline,
            cv_text=cv_text,
            target_sectors=target_sectors,
            target_company_size=target_company_size,
            target_countries=target_countries,
            target_work_mode=target_work_mode,
        )
        profile = repository.get_user_profile(user.user_id)
        return self._send_json({"ok": True, "profile": profile})

    def _handle_list_user_lead_notes(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        return self._send_json({"items": repository.list_user_lead_notes(user.user_id)})

    def _handle_upsert_user_lead_note(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        data = self._read_json_body()
        saved_employer_id = str(data.get("saved_employer_id", "")).strip()
        if not saved_employer_id:
            return self._send_status_json(HTTPStatus.BAD_REQUEST, {"error": "saved_employer_id required"})
        note_text = str(data.get("note_text", "")).strip()
        repository.upsert_user_lead_note(user.user_id, saved_employer_id=saved_employer_id, note_text=note_text)
        return self._send_json({"ok": True})

    def _handle_delete_saved_employer(self, company_name: str, employer_name: str, employer_role: str) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        repository.delete_saved_employer_for_user(
            user.user_id,
            company_name=company_name,
            employer_name=employer_name,
            employer_role=employer_role,
        )
        return self._send_json({"ok": True})

    def _handle_delete_saved_employer_by_id(self, saved_employer_id: str) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        repository.delete_saved_employer_by_id_for_user(user.user_id, saved_employer_id=saved_employer_id)
        return self._send_json({"ok": True})

    def _handle_list_user_lead_statuses(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        items = repository.list_user_lead_statuses(user.user_id)
        return self._send_json({"items": items})

    def _handle_upsert_user_lead_status(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        data = self._read_json_body()
        saved_employer_id = str(data.get("saved_employer_id", "")).strip()
        if not saved_employer_id:
            return self._send_status_json(HTTPStatus.BAD_REQUEST, {"error": "saved_employer_id required"})
        lead_status = str(data.get("lead_status", "")).strip().lower()
        if lead_status not in {"hot", "follow-up", "cv"}:
            lead_status = "hot"
        repository.set_user_lead_status(user.user_id, saved_employer_id=saved_employer_id, lead_status=lead_status)
        return self._send_json({"ok": True, "saved_employer_id": saved_employer_id, "lead_status": lead_status})

    def _handle_list_user_lead_notifications(self, raw_query: str) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        params = parse_qs(raw_query)
        try:
            limit = max(1, min(int(params.get("limit", ["10"])[0]), 50))
        except ValueError:
            limit = 10
        unread_only = params.get("unread_only", ["0"])[0].strip() == "1"
        include_simulated = params.get("simulate", ["1"])[0].strip() != "0"
        simulation_meta = {}
        if include_simulated:
            simulation_meta = _create_booster_updates_for_user(user.user_id)
        items = repository.list_user_lead_notifications(user.user_id, unread_only=unread_only, limit=limit)
        unread_count = len(repository.list_user_lead_notifications(user.user_id, unread_only=True, limit=200))
        payload = {"items": items, "unread_count": unread_count}
        if simulation_meta:
            payload["eligibility"] = {
                "saved_count": int(simulation_meta.get("saved_count") or 0),
                "follow_up_count": int(simulation_meta.get("follow_up_count") or 0),
                "eligible_count": int(simulation_meta.get("eligible_count") or 0),
                "created_count": int(simulation_meta.get("created_count") or 0),
                "fallback_created": bool(simulation_meta.get("fallback_created")),
            }
            status_message = str(simulation_meta.get("status_message") or "").strip()
            if status_message:
                payload["status_message"] = status_message
        return self._send_json(payload)

    def _handle_mark_user_lead_notifications_read(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})
        data = self._read_json_body()
        ids = data.get("ids", [])
        mark_all = bool(data.get("mark_all", False))
        if mark_all:
            updated = repository.mark_all_user_lead_notifications_read(user.user_id)
            return self._send_json({"ok": True, "updated": updated})
        if not isinstance(ids, list):
            return self._send_status_json(HTTPStatus.BAD_REQUEST, {"error": "ids must be an array"})
        cleaned_ids = [str(item).strip() for item in ids if str(item).strip()]
        updated = repository.mark_user_lead_notifications_read(user.user_id, cleaned_ids)
        return self._send_json({"ok": True, "updated": updated})

    def _handle_create_test_user_lead_notification(self) -> None:
        user = self._current_user()
        if not user:
            return self._send_status_json(HTTPStatus.UNAUTHORIZED, {"error": "not authenticated"})

        created = _create_test_notification_for_user(user.user_id)
        if not created:
            return self._send_status_json(
                HTTPStatus.BAD_REQUEST,
                {
                    "error": (
                        "No eligible leads for test notification. "
                        "Save at least one lead and set it to Follow-up first."
                    )
                },
            )
        return self._send_json({"ok": True, "message": "Test notification created.", "notification_id": created})


def _build_company_insights(name: str, domain: str, country: str) -> dict:
    company_slug = "".join(ch for ch in name.lower() if ch.isalnum()) or "company"
    domain_base = domain or f"{company_slug}.company"
    digest = sha256(f"{name}|{domain_base}|{country}".encode("utf-8")).hexdigest()

    ro_context = country == "RO" or any(k in name.lower() for k in ("arobs", "fortech", "uipath", "bitdefender"))
    roles_pool = [
        "Ecosystem Partnerships Specialist",
        "Developer Relations Engineer",
        "Applied Research Engineer",
        "Platform Integration Engineer",
        "Product Operations Specialist",
        "Hardware Validation Engineer",
        "Cloud Solutions Architect",
        "Strategic Programs Specialist",
        "Solutions Consultant",
        "Customer Success Engineer",
    ]
    interests_map = {
        "nvidia": "3D-printing, thermal management, and simulation startups that improve GPU manufacturing and datacenter performance",
        "amd": "EDA verification, advanced packaging, and AI compiler startups for chip design and deployment",
        "qualcomm": "edge AI, automotive connectivity, and low-power IoT startups for on-device intelligence",
        "uber": "in-vehicle displays, fleet telematics, and routing optimization startups for mobility operations",
        "google": "developer infrastructure, AI orchestration, and cloud cost observability startups",
        "alphabet": "moonshot-ready startups in robotics, autonomous systems, and scalable AI infrastructure",
        "meta": "creator monetization, AR/VR interaction, and recommendation-quality startups",
        "amazon": "warehouse robotics, supply-chain visibility, and seller automation startups",
        "microsoft": "enterprise copilots, identity-security, and workflow automation startups",
        "netflix": "streaming QoE analytics, content localization tooling, and ad-tech measurement startups",
        "apple": "device-side AI, battery efficiency, and human-interface startups for premium hardware ecosystems",
        "logitech": "hybrid-work peripherals, low-latency collaboration, and creator hardware software startups",
        "adobe": "generative design, marketing personalization, and creative workflow automation startups",
        "salesforce": "CRM intelligence, RevOps automation, and customer data unification startups",
        "oracle": "database performance, enterprise integration, and regulated-cloud tooling startups",
        "sap": "enterprise process mining and supply-chain planning startups",
        "tesla": "battery lifecycle analytics, factory robotics, and embedded autonomy tooling startups",
        "spotify": "music recommendation tuning, creator growth tooling, and audio ad-tech startups",
        "tiktok": "short-form creator tooling, safety moderation AI, and social commerce startups",
        "airbnb": "trust-and-safety automation, host tooling, and travel operations optimization startups",
        "booking": "hotel revenue optimization and travel pricing intelligence startups",
        "stripe": "payment orchestration, fraud prevention, and B2B billing automation startups",
        "paypal": "cross-border payments, checkout conversion, and digital wallet security startups",
        "revolut": "SME finance automation and multi-currency treasury tooling startups",
        "wise": "cross-border payment rails and remittance compliance automation startups",
        "datadog": "observability correlation, incident intelligence, and platform reliability startups",
        "cloudflare": "edge security, bot mitigation, and performance routing startups",
        "github": "developer productivity, secure software supply-chain, and code review automation startups",
        "gitlab": "DevSecOps pipeline optimization and compliance automation startups",
        "notion": "knowledge graph, team productivity, and AI workspace assistant startups",
        "figma": "design systems governance, prototyping intelligence, and product design collaboration startups",
        "canva": "template intelligence, brand consistency automation, and creator tooling startups",
        "openai": "AI infrastructure reliability, model evaluation, and domain-specific agent startups",
        "uipath": "process mining, enterprise automation governance, and agentic RPA startups",
        "bitdefender": "threat detection automation, endpoint behavior analytics, and SMB cyber defense startups",
        "crowdstrike": "identity threat detection and autonomous SOC tooling startups",
        "fortinet": "network security orchestration and zero-trust enforcement startups",
        "palo alto": "cloud posture remediation and AI-driven security operations startups",
        "ibm": "enterprise AI governance, mainframe modernization, and hybrid cloud integration startups",
        "intel": "semiconductor optimization, AI acceleration software, and fab process startups",
        "samsung": "consumer hardware UX, display innovations, and smart-device integration startups",
        "xiaomi": "IoT ecosystem orchestration and smart-device affordability optimization startups",
        "lufthansa": "aviation operations analytics, baggage automation, and passenger experience startups",
        "ryanair": "turnaround efficiency and ancillary revenue optimization startups",
        "vodafone": "5G enterprise services, network intelligence, and telecom automation startups",
        "deezer": "audio personalization and creator monetization analytics startups",
        "epic games": "real-time 3D tooling, creator ecosystems, and game pipeline optimization startups",
    }
    sector_interests = {
        "cyber": "cybersecurity analytics, SOC automation, and zero-trust implementation startups",
        "bank": "fintech risk models, fraud prevention, and payment automation startups",
        "pay": "payment optimization, fraud prevention, and checkout conversion startups",
        "cloud": "cloud reliability, spend optimization, and platform engineering startups",
        "design": "design workflow automation and brand consistency tooling startups",
        "auto": "mobility software, embedded systems, and fleet intelligence startups",
        "travel": "travel operations optimization and personalized booking experience startups",
        "chip": "semiconductor validation, packaging innovation, and firmware optimization startups",
        "media": "content intelligence, personalization engines, and creator growth startups",
        "retail": "inventory forecasting, logistics automation, and customer analytics startups",
    }
    collaboration_profiles = [
        {
            "keywords": ("nvidia", "amd", "qualcomm", "intel", "samsung"),
            "score": "High",
            "channels": ["Developer ecosystem", "Hardware integration pilots", "Strategic partner programs"],
            "note": "Strong fit for technical startups that can prove integration value fast.",
        },
        {
            "keywords": ("google", "microsoft", "amazon", "meta", "netflix", "oracle", "salesforce", "adobe"),
            "score": "High",
            "channels": ["API ecosystem", "Cloud marketplace", "Partner co-sell motions"],
            "note": "Best path is product integration with measurable business impact.",
        },
        {
            "keywords": ("stripe", "paypal", "revolut", "wise", "bank", "capital"),
            "score": "Medium",
            "channels": ["Fintech partnerships", "Compliance-first vendor onboarding", "Pilot-to-procurement"],
            "note": "Readiness is good, but trust, compliance, and risk controls matter early.",
        },
        {
            "keywords": ("uber", "tesla", "airbnb", "booking", "ryanair", "lufthansa"),
            "score": "Medium",
            "channels": ["Operational pilots", "Mobility/travel innovation programs", "Procurement-led partnerships"],
            "note": "Most collaborations start with operational proof and clear ROI.",
        },
        {
            "keywords": ("bitdefender", "crowdstrike", "palo alto", "fortinet", "cyber", "security"),
            "score": "Medium",
            "channels": ["Security integrations", "Technology alliance programs", "Joint go-to-market"],
            "note": "Expect security validation and integration depth before expansion.",
        },
    ]
    if ro_context:
        first_names = [
            "Tudor",
            "Razvan",
            "Andrei",
            "Calin",
            "Voicu",
            "Mihai",
            "Vlad",
            "Stefan",
            "Alexandru",
            "Radu",
            "Ioana",
            "Andreea",
            "Elena",
            "Maria",
        ]
        last_names = [
            "Popescu",
            "Ionescu",
            "Marinescu",
            "Vaduva",
            "Oprean",
            "Stan",
            "Dumitrescu",
            "Georgescu",
            "Moldovan",
            "Lazar",
            "Ilie",
            "Matei",
        ]
        locations = [
            "Cluj-Napoca, Romania",
            "Bucharest, Romania",
            "Timisoara, Romania",
            "Oradea, Romania",
            "Iasi, Romania",
            "Brasov, Romania",
        ]
    else:
        first_names = [
            "Heather",
            "Brandon",
            "Sara",
            "William",
            "Tim",
            "Sophie",
            "Liam",
            "Noah",
            "Emma",
            "Ava",
            "Lucas",
            "Mia",
            "Olivia",
            "Ethan",
        ]
        last_names = [
            "Taylor",
            "Anders",
            "Stone",
            "Lane",
            "Keller",
            "Murphy",
            "Carter",
            "Hughes",
            "Bennett",
            "Reed",
            "Walker",
            "Parker",
        ]
        locations = [
            "Berlin, Germany",
            "London, UK",
            "Paris, France",
            "Madrid, Spain",
            "Amsterdam, Netherlands",
            "Dublin, Ireland",
            "Stockholm, Sweden",
        ]

    interest_text = "specialized startups that directly improve the company's core product or platform economics"
    lowered_name = name.lower()
    for key, value in interests_map.items():
        if key in lowered_name:
            interest_text = value
            break
    if interest_text.startswith("specialized startups"):
        lowered_domain = (domain or "").lower()
        combined = f"{lowered_name} {lowered_domain}"
        for key, value in sector_interests.items():
            if key in combined:
                interest_text = value
                break

    employees = []
    curated_leaders = _match_curated_leaders(company_name=name, company_domain=domain_base)
    for idx, leader in enumerate(curated_leaders):
        p_seed = int(digest[(idx % 16) * 4 : (idx % 16) * 4 + 4], 16)
        employees.append(
            {
                "id": f"{company_slug}-curated-{_normalize_key(leader['first_name'])}-{_normalize_key(leader['last_name'])}",
                "first_name": leader["first_name"],
                "last_name": leader["last_name"],
                "role": leader["role"],
                "email": f"{{redacted}}@{domain_base}",
                "location": locations[(p_seed // 13) % len(locations)],
                "department_rise_percent": 10 + (p_seed % 15),
                "interviews_held_recently": 1 + (p_seed % 4),
                "contact_likelihood_percent": 35 + (p_seed % 35),
                "valuable_lead_score": min(88, 55 + (p_seed % 30)),
                "outreach_window": "Best in next 7 days" if idx % 2 == 0 else "Strong this month",
                "open_for_interviews_count": 1 + (p_seed % 2),
                "interested_in": interest_text,
                "pathway_reason": "Real public leadership contact included for company credibility context.",
            }
        )

    synthetic_target_count = max(6, len(employees))
    synthetic_needed = max(0, synthetic_target_count - len(employees))
    for idx in range(synthetic_needed):
        digest_idx = idx + len(employees)
        p_seed = int(digest[(digest_idx % 16) * 4 : (digest_idx % 16) * 4 + 4], 16)
        first = first_names[p_seed % len(first_names)]
        last = last_names[(p_seed // 7) % len(last_names)]
        role = roles_pool[(p_seed // 11) % len(roles_pool)]
        location = locations[(p_seed // 13) % len(locations)]
        dept_rise = 8 + (p_seed % 18)
        interviews = 2 + (p_seed % 7)
        contact = 52 + (p_seed % 44)
        score = min(98, 58 + (p_seed % 40))
        open_interviews = 1 + (p_seed % 2)
        pathway_reason = (
            "Works across partner teams and can route strong startup intros to hiring and product groups."
            if idx % 2 == 0
            else "Owns integration-level decisions and often collaborates with recruiters for niche roles."
        )
        employees.append(
            {
                "id": f"{company_slug}-{first.lower()}-{last.lower()}-{idx}",
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
                "open_for_interviews_count": open_interviews,
                "interested_in": interest_text,
                "pathway_reason": pathway_reason,
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
    default_collab = {
        "score": "Medium",
        "channels": ["Pilot programs", "Partner referrals", "Procurement onboarding"],
        "note": "Most firms collaborate after a small proof-of-value engagement.",
    }
    collaboration_readiness = default_collab
    lowered_full = f"{name.lower()} {domain_base.lower()}"
    for profile in collaboration_profiles:
        if any(keyword in lowered_full for keyword in profile["keywords"]):
            collaboration_readiness = {
                "score": profile["score"],
                "channels": profile["channels"],
                "note": profile["note"],
            }
            break
    return {
        "employees": employees,
        "email_terminations": terminations,
        "collaboration_readiness": collaboration_readiness,
    }


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
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def _create_booster_updates_for_user(user_id: str) -> dict:
    status_items = repository.list_user_lead_statuses(user_id)
    follow_up_ids = {
        str(item.get("saved_employer_id") or "").strip()
        for item in status_items
        if str(item.get("lead_status") or "").strip().lower() == "follow-up"
    }
    saved_items = repository.list_saved_employers_for_user(user_id)
    saved_by_id = {}
    for lead in saved_items:
        lead_id = str(lead.get("id") or "").strip()
        if not lead_id:
            continue
        saved_by_id[lead_id] = lead
    eligible_ids = [lead_id for lead_id in saved_by_id if lead_id in follow_up_ids]
    summary = {
        "saved_count": len(saved_by_id),
        "follow_up_count": len(follow_up_ids),
        "eligible_count": len(eligible_ids),
        "created_count": 0,
        "fallback_created": False,
        "status_message": "",
    }
    if not eligible_ids:
        if saved_by_id and not follow_up_ids:
            summary["status_message"] = "No Follow-up leads yet. Set a saved lead to Follow-up to receive booster updates."
        elif not saved_by_id:
            summary["status_message"] = "No saved leads yet. Save leads to unlock booster updates."
        return summary

    today = datetime.now(timezone.utc).date().isoformat()
    existing_items = repository.list_user_lead_notifications(user_id, unread_only=False, limit=300)
    unread_existing = 0
    last_by_lead: dict[str, datetime] = {}
    for item in existing_items:
        if int(item.get("is_read") or 0) == 0:
            unread_existing += 1
        lead_id = str(item.get("saved_employer_id") or "")
        created_at_raw = str(item.get("created_at") or "")
        if not lead_id or not created_at_raw:
            continue
        try:
            created_at = datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
        except ValueError:
            continue
        if lead_id not in last_by_lead or created_at > last_by_lead[lead_id]:
            last_by_lead[lead_id] = created_at

    cooldown = timedelta(hours=20)
    now = datetime.now(timezone.utc)
    for lead_id in eligible_ids:
        lead = saved_by_id[lead_id]
        # deterministic daily simulation seed per user + lead + day
        daily_seed = sha256(f"{user_id}|{lead_id}|{today}".encode("utf-8")).hexdigest()
        chance_gate = int(daily_seed[:2], 16)
        if chance_gate > 82:
            continue
        if lead_id in last_by_lead and now - last_by_lead[lead_id] < cooldown:
            continue
        reason_idx = int(daily_seed[2:4], 16) % 2
        reason = "Open to interviews" if reason_idx == 0 else "Seen your message and is thinking"
        event_key = f"{lead_id}:{today}:{reason_idx}"
        notification_id = sha256(f"{user_id}:{event_key}".encode("utf-8")).hexdigest()[:32]
        created = repository.create_user_lead_notification(
            notification_id=notification_id,
            user_id=user_id,
            saved_employer_id=lead_id,
            event_key=event_key,
            title="Lead update",
            reason=reason,
            cta_text="Great time to follow up",
            company_name=str(lead.get("company_name") or ""),
            company_logo=str(lead.get("company_logo") or ""),
            employer_name=str(lead.get("employer_name") or ""),
        )
        if created:
            summary["created_count"] += 1

    # Safe fallback: if user has eligible leads but nothing unread, create one low-frequency deterministic event.
    fallback_cooldown = timedelta(hours=12)
    if summary["created_count"] == 0 and unread_existing == 0 and eligible_ids:
        fallback_lead_id = sorted(eligible_ids)[0]
        lead = saved_by_id[fallback_lead_id]
        last_created = last_by_lead.get(fallback_lead_id)
        if not last_created or now - last_created >= fallback_cooldown:
            fallback_key = f"{fallback_lead_id}:{today}:fallback"
            fallback_id = sha256(f"{user_id}:{fallback_key}".encode("utf-8")).hexdigest()[:32]
            fallback_created = repository.create_user_lead_notification(
                notification_id=fallback_id,
                user_id=user_id,
                saved_employer_id=fallback_lead_id,
                event_key=fallback_key,
                title="Lead update",
                reason="Quick check-in moment: this lead still looks warm for follow-up.",
                cta_text="Send a short follow-up message",
                company_name=str(lead.get("company_name") or ""),
                company_logo=str(lead.get("company_logo") or ""),
                employer_name=str(lead.get("employer_name") or ""),
            )
            if fallback_created:
                summary["created_count"] += 1
                summary["fallback_created"] = True

    if summary["created_count"] == 0 and unread_existing == 0:
        summary["status_message"] = "No fresh lead responses yet. Keep a few leads in Follow-up to increase update chances."
    return summary


def _create_test_notification_for_user(user_id: str) -> str | None:
    status_items = repository.list_user_lead_statuses(user_id)
    follow_up_ids = {
        str(item.get("saved_employer_id") or "").strip()
        for item in status_items
        if str(item.get("lead_status") or "").strip().lower() == "follow-up"
    }
    if not follow_up_ids:
        return None

    saved_items = repository.list_saved_employers_for_user(user_id)
    eligible_items = []
    for lead in saved_items:
        lead_id = str(lead.get("id") or "").strip()
        if not lead_id:
            continue
        if lead_id in follow_up_ids:
            eligible_items.append(lead)
    if not eligible_items:
        return None

    lead = sorted(eligible_items, key=lambda item: str(item.get("created_at") or ""))[0]
    lead_id = str(lead.get("id") or "").strip()
    now_iso = datetime.now(timezone.utc).isoformat()
    event_key = f"test:{lead_id}:{now_iso}"
    notification_id = sha256(f"{user_id}:{event_key}".encode("utf-8")).hexdigest()[:32]
    created = repository.create_user_lead_notification(
        notification_id=notification_id,
        user_id=user_id,
        saved_employer_id=lead_id,
        event_key=event_key,
        title="Test lead update",
        reason="Manual test notification created for reliability verification.",
        cta_text="If you see this, bell and toast wiring works.",
        company_name=str(lead.get("company_name") or ""),
        company_logo=str(lead.get("company_logo") or ""),
        employer_name=str(lead.get("employer_name") or ""),
    )
    if created:
        return notification_id
    return None


_active_http_server: ThreadingHTTPServer | None = None
_active_http_server_lock = threading.Lock()


def run(host: str = "127.0.0.1", port: int = 5500) -> None:
    global _active_http_server
    httpd = ThreadingHTTPServer((host, port), AppHandler)
    with _active_http_server_lock:
        _active_http_server = httpd
    print(f"Server running at http://{host}:{port}")
    print(f"Frontend: http://{host}:{port}/")
    print(f"API: http://{host}:{port}/api/company-search?q=arobs&country=ro")
    try:
        httpd.serve_forever()
    finally:
        with _active_http_server_lock:
            _active_http_server = None


def stop_http_server() -> None:
    """Stop the background HTTP server (safe to call from another thread)."""
    with _active_http_server_lock:
        inst = _active_http_server
    if inst is not None:
        inst.shutdown()


if __name__ == "__main__":
    configured_port = int(os.getenv("APP_PORT", "5500"))
    run(port=configured_port)
