from __future__ import annotations

import os
import sys
from pathlib import Path

APP_NAME = "LinkedInScraper"
SOURCE_ROOT = Path(__file__).resolve().parent
IS_FROZEN = bool(getattr(sys, "frozen", False))
RESOURCE_ROOT = Path(getattr(sys, "_MEIPASS", SOURCE_ROOT))


def _app_data_root() -> Path:
    local_app_data = os.getenv("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data) / APP_NAME
    return Path.home() / f".{APP_NAME}"


def get_data_root() -> Path:
    return _app_data_root() if IS_FROZEN else SOURCE_ROOT


def ensure_data_root() -> Path:
    data_root = get_data_root()
    data_root.mkdir(parents=True, exist_ok=True)
    return data_root


def get_frontend_dir() -> Path:
    return RESOURCE_ROOT / "frontend"


def get_curated_leaders_path() -> Path:
    return RESOURCE_ROOT / "curated_company_leaders.json"


def get_seed_companies_path() -> Path:
    bundled = RESOURCE_ROOT / "seed_companies.json"
    if bundled.exists():
        return bundled
    return SOURCE_ROOT / "seed_companies.json"


def get_app_db_path() -> Path:
    return ensure_data_root() / "app.db"


def get_company_cache_db_path() -> Path:
    return ensure_data_root() / "company_cache.db"


def get_dotenv_path() -> Path:
    if not IS_FROZEN:
        return SOURCE_ROOT / ".env"

    exe_dir = Path(sys.executable).resolve().parent
    for candidate in (exe_dir / ".env", ensure_data_root() / ".env", Path.cwd() / ".env"):
        if candidate.exists():
            return candidate
    return exe_dir / ".env"
