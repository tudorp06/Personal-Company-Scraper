from __future__ import annotations

import json
import sqlite3
import urllib.parse
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterator, List, Optional


@dataclass
class CompanySuggestion:
    name: str
    domain: Optional[str]
    country: Optional[str]
    source: str
    logo_url: Optional[str] = None

    def as_dict(self) -> dict:
        return {
            "name": self.name,
            "domain": self.domain,
            "country": self.country,
            "source": self.source,
            "logo_url": self.logo_url,
        }


BASELINE_COMPANIES: List[CompanySuggestion] = [
    CompanySuggestion("Adobe", "adobe.com", "US", "baseline"),
    CompanySuggestion("Airbnb", "airbnb.com", "US", "baseline"),
    CompanySuggestion("Bitdefender", "bitdefender.com", "RO", "baseline"),
    CompanySuggestion("Booking.com", "booking.com", "NL", "baseline"),
    CompanySuggestion("Canva", "canva.com", "AU", "baseline"),
    CompanySuggestion("Cloudflare", "cloudflare.com", "US", "baseline"),
    CompanySuggestion("Datadog", "datadoghq.com", "US", "baseline"),
    CompanySuggestion("Deezer", "deezer.com", "FR", "baseline"),
    CompanySuggestion("Endava", "endava.com", "RO", "baseline"),
    CompanySuggestion("Epic Games", "epicgames.com", "US", "baseline"),
    CompanySuggestion("Fortech", "fortech.ro", "RO", "baseline"),
    CompanySuggestion("Figma", "figma.com", "US", "baseline"),
    CompanySuggestion("Google", "google.com", "US", "baseline"),
    CompanySuggestion("GitHub", "github.com", "US", "baseline"),
    CompanySuggestion("HubSpot", "hubspot.com", "US", "baseline"),
    CompanySuggestion("Hootsuite", "hootsuite.com", "CA", "baseline"),
    CompanySuggestion("IBM", "ibm.com", "US", "baseline"),
    CompanySuggestion("Intercom", "intercom.com", "IE", "baseline"),
    CompanySuggestion("JetBrains", "jetbrains.com", "CZ", "baseline"),
    CompanySuggestion("Just Eat", "just-eat.com", "GB", "baseline"),
    CompanySuggestion("Klarna", "klarna.com", "SE", "baseline"),
    CompanySuggestion("Kickstarter", "kickstarter.com", "US", "baseline"),
    CompanySuggestion("LinkedIn", "linkedin.com", "US", "baseline"),
    CompanySuggestion("Lufthansa", "lufthansa.com", "DE", "baseline"),
    CompanySuggestion("Microsoft", "microsoft.com", "US", "baseline"),
    CompanySuggestion("MongoDB", "mongodb.com", "US", "baseline"),
    CompanySuggestion("NTT DATA Romania", "ro.nttdata.com", "RO", "baseline"),
    CompanySuggestion("Notion", "notion.so", "US", "baseline"),
    CompanySuggestion("OpenAI", "openai.com", "US", "baseline"),
    CompanySuggestion("Oracle", "oracle.com", "US", "baseline"),
    CompanySuggestion("PayPal", "paypal.com", "US", "baseline"),
    CompanySuggestion("Pinterest", "pinterest.com", "US", "baseline"),
    CompanySuggestion("Qualcomm", "qualcomm.com", "US", "baseline"),
    CompanySuggestion("Quora", "quora.com", "US", "baseline"),
    CompanySuggestion("Revolut", "revolut.com", "GB", "baseline"),
    CompanySuggestion("Ryanair", "ryanair.com", "IE", "baseline"),
    CompanySuggestion("Stripe", "stripe.com", "US", "baseline"),
    CompanySuggestion("Spotify", "spotify.com", "SE", "baseline"),
    CompanySuggestion("TikTok", "tiktok.com", "CN", "baseline"),
    CompanySuggestion("Tesla", "tesla.com", "US", "baseline"),
    CompanySuggestion("UiPath", "uipath.com", "RO", "baseline"),
    CompanySuggestion("Uber", "uber.com", "US", "baseline"),
    CompanySuggestion("Vercel", "vercel.com", "US", "baseline"),
    CompanySuggestion("Vodafone", "vodafone.com", "GB", "baseline"),
    CompanySuggestion("Wikipedia", "wikipedia.org", "US", "baseline"),
    CompanySuggestion("Wise", "wise.com", "GB", "baseline"),
    CompanySuggestion("Xero", "xero.com", "NZ", "baseline"),
    CompanySuggestion("Xiaomi", "xiaomi.com", "CN", "baseline"),
    CompanySuggestion("Yahoo", "yahoo.com", "US", "baseline"),
    CompanySuggestion("YouTube", "youtube.com", "US", "baseline"),
    CompanySuggestion("Zendesk", "zendesk.com", "US", "baseline"),
    CompanySuggestion("Zalando", "zalando.com", "DE", "baseline"),
]


class CompanyDirectoryService:
    def __init__(
        self,
        brandfetch_client_id: Optional[str] = None,
        cache_db_path: str = "company_cache.db",
        seed_json_path: str = "seed_companies.json",
    ) -> None:
        self.brandfetch_client_id = brandfetch_client_id
        self._logo_cache: Dict[str, Optional[str]] = {}
        self.cache_db_path = str(Path(cache_db_path))
        self.seed_json_path = str(Path(seed_json_path))
        self._init_cache_db()
        self._seed_baseline_cache()
        self._seed_from_json()

    def search(self, query: str, limit: int = 12, country: Optional[str] = None) -> List[dict]:
        query = query.strip()
        if not query:
            return []

        local_results = self._search_cache(query=query, limit=limit, country=country)
        if len(local_results) >= max(5, limit // 2):
            return [company.as_dict() for company in local_results[:limit]]

        combined: List[CompanySuggestion] = list(local_results)
        remote_results = self._fetch_remote(query=query, limit=limit, country=country)
        combined.extend(remote_results)
        deduped = self._dedupe(combined)

        for company in deduped:
            if not company.logo_url:
                company.logo_url = self._resolve_logo_url(company.domain)

        self._upsert_cache(deduped)
        return [company.as_dict() for company in deduped[:limit]]

    @contextmanager
    def _connect_cache(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.cache_db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_cache_db(self) -> None:
        with self._connect_cache() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS company_cache (
                    cache_key TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    name_lower TEXT NOT NULL,
                    domain TEXT,
                    country TEXT,
                    source TEXT NOT NULL,
                    logo_url TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_company_cache_name_lower
                ON company_cache(name_lower);

                CREATE INDEX IF NOT EXISTS idx_company_cache_domain
                ON company_cache(domain);
                """
            )

    def _seed_baseline_cache(self) -> None:
        with self._connect_cache() as conn:
            row = conn.execute("SELECT COUNT(*) AS total FROM company_cache").fetchone()
            existing = int(row["total"]) if row else 0
        if existing > 0:
            return

        baseline_with_logos: List[CompanySuggestion] = []
        for company in BASELINE_COMPANIES:
            logo = self._resolve_logo_url(company.domain)
            baseline_with_logos.append(
                CompanySuggestion(
                    name=company.name,
                    domain=company.domain,
                    country=company.country,
                    source=company.source,
                    logo_url=logo,
                )
            )
        self._upsert_cache(baseline_with_logos)

    def _seed_from_json(self) -> None:
        seed_path = Path(self.seed_json_path)
        if not seed_path.exists():
            return

        try:
            raw = json.loads(seed_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return

        if not isinstance(raw, list):
            return

        items: List[CompanySuggestion] = []
        for entry in raw:
            if not isinstance(entry, dict):
                continue
            name = entry.get("name")
            domain = entry.get("domain")
            if not isinstance(name, str) or not name.strip():
                continue
            if not isinstance(domain, str) or not domain.strip():
                continue
            country = entry.get("country")
            source = entry.get("source") if isinstance(entry.get("source"), str) else "seed"
            logo = self._resolve_logo_url(domain)
            items.append(
                CompanySuggestion(
                    name=name.strip(),
                    domain=domain.strip().lower(),
                    country=country.strip().upper() if isinstance(country, str) and country else None,
                    source=source,
                    logo_url=logo,
                )
            )

        self._upsert_cache(items)

    def _fetch_remote(self, query: str, limit: int, country: Optional[str]) -> List[CompanySuggestion]:
        # Paid providers removed; rely on seeded/local cache for now.
        return []

    def _search_cache(self, query: str, limit: int, country: Optional[str]) -> List[CompanySuggestion]:
        normalized = query.lower()
        starts_with = f"{normalized}%"
        contains = f"%{normalized}%"
        sql = """
            SELECT name, domain, country, source, logo_url,
                CASE
                    WHEN name_lower LIKE ? THEN 100
                    WHEN name_lower LIKE ? THEN 70
                    WHEN LOWER(COALESCE(domain, '')) LIKE ? THEN 60
                    ELSE 0
                END AS rank
            FROM company_cache
            WHERE (
                name_lower LIKE ?
                OR name_lower LIKE ?
                OR LOWER(COALESCE(domain, '')) LIKE ?
            )
        """
        params: List[object] = [starts_with, contains, contains, starts_with, contains, contains]
        if country:
            sql += " AND UPPER(COALESCE(country, '')) = ?"
            params.append(country.upper())
        sql += " ORDER BY rank DESC, name_lower ASC LIMIT ?"
        params.append(limit)

        with self._connect_cache() as conn:
            rows = conn.execute(sql, params).fetchall()

        return [
            CompanySuggestion(
                name=row["name"],
                domain=row["domain"],
                country=row["country"],
                source=row["source"],
                logo_url=row["logo_url"],
            )
            for row in rows
        ]

    def _upsert_cache(self, companies: List[CompanySuggestion]) -> None:
        if not companies:
            return
        now = datetime.now(timezone.utc).isoformat()
        with self._connect_cache() as conn:
            for company in companies:
                cache_key = self._cache_key(company.name, company.domain)
                conn.execute(
                    """
                    INSERT INTO company_cache (
                        cache_key, name, name_lower, domain, country, source, logo_url, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(cache_key) DO UPDATE SET
                        name = excluded.name,
                        name_lower = excluded.name_lower,
                        domain = COALESCE(excluded.domain, company_cache.domain),
                        country = COALESCE(excluded.country, company_cache.country),
                        source = excluded.source,
                        logo_url = COALESCE(excluded.logo_url, company_cache.logo_url),
                        updated_at = excluded.updated_at
                    """,
                    (
                        cache_key,
                        company.name,
                        company.name.strip().lower(),
                        company.domain,
                        company.country,
                        company.source,
                        company.logo_url,
                        now,
                        now,
                    ),
                )

    def _resolve_logo_url(self, domain: Optional[str]) -> Optional[str]:
        if not domain:
            return None
        key = domain.lower()
        if key in self._logo_cache:
            return self._logo_cache[key]

        logo_url = self._brandfetch_cdn_logo_url(domain)

        self._logo_cache[key] = logo_url
        return logo_url

    def _brandfetch_cdn_logo_url(self, domain: str) -> str:
        base = f"https://cdn.brandfetch.io/{urllib.parse.quote(domain)}"
        if self.brandfetch_client_id:
            return f"{base}?c={urllib.parse.quote(self.brandfetch_client_id)}"
        return base

    def _dedupe(self, companies: List[CompanySuggestion]) -> List[CompanySuggestion]:
        seen: Dict[str, CompanySuggestion] = {}
        for company in companies:
            key = self._cache_key(company.name, company.domain)
            if key not in seen:
                seen[key] = company
        return list(seen.values())

    def _cache_key(self, name: str, domain: Optional[str]) -> str:
        return f"{name.strip().lower()}|{(domain or '').strip().lower()}"

    def _extract_domain(self, website_url: Optional[str]) -> Optional[str]:
        if not website_url:
            return None
        parsed = urllib.parse.urlparse(website_url if "://" in website_url else f"https://{website_url}")
        host = parsed.netloc or parsed.path
        host = host.lower().strip()
        if host.startswith("www."):
            host = host[4:]
        return host or None

    def _extract_country_from_location_identifiers(self, locations: list) -> Optional[str]:
        for location in locations:
            value = location.get("value")
            if isinstance(value, str) and len(value) == 2:
                return value.upper()
        return None
