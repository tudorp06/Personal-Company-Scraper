from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator, List, Optional

from models import Company, CompanySize, ContactChannel, Employee, Lead, LeadStatus, User, UserRole


class Repository:
    def __init__(self, db_path: str = "app.db") -> None:
        self.db_path = db_path

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS companies (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    domain TEXT NOT NULL UNIQUE,
                    size TEXT NOT NULL,
                    industry TEXT,
                    country TEXT,
                    website_url TEXT,
                    tracked INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS employees (
                    id TEXT PRIMARY KEY,
                    company_id TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    title TEXT NOT NULL,
                    department TEXT NOT NULL,
                    seniority TEXT,
                    contact_channel TEXT NOT NULL,
                    public_profile_url TEXT,
                    hiring_influence_score REAL NOT NULL,
                    contact_openness_score REAL NOT NULL,
                    recency_score REAL NOT NULL,
                    department_productivity_score REAL NOT NULL DEFAULT 0,
                    confidence_score REAL NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (company_id) REFERENCES companies(id)
                );

                CREATE TABLE IF NOT EXISTS leads (
                    id TEXT PRIMARY KEY,
                    company_id TEXT NOT NULL,
                    employee_id TEXT NOT NULL,
                    user_profile_summary TEXT NOT NULL,
                    role_fit_score REAL NOT NULL,
                    status TEXT NOT NULL,
                    notes TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (company_id) REFERENCES companies(id),
                    FOREIGN KEY (employee_id) REFERENCES employees(id)
                );

                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    display_name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS user_sessions (
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS user_saved_employers (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    company_domain TEXT,
                    company_logo TEXT,
                    employer_name TEXT NOT NULL,
                    employer_role TEXT NOT NULL,
                    employer_email TEXT,
                    employer_location TEXT,
                    lead_score REAL NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS user_profiles (
                    user_id TEXT PRIMARY KEY,
                    headline TEXT,
                    cv_text TEXT,
                    target_sectors TEXT,
                    target_company_size TEXT,
                    target_countries TEXT,
                    target_work_mode TEXT,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS user_lead_notes (
                    user_id TEXT NOT NULL,
                    saved_employer_id TEXT NOT NULL,
                    note_text TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, saved_employer_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS user_lead_contacted (
                    user_id TEXT NOT NULL,
                    saved_employer_id TEXT NOT NULL,
                    is_contacted INTEGER NOT NULL DEFAULT 0,
                    contacted_at TEXT,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, saved_employer_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS user_lead_notifications (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    saved_employer_id TEXT NOT NULL,
                    event_key TEXT NOT NULL,
                    title TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    cta_text TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    employer_name TEXT NOT NULL,
                    is_read INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    read_at TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );

                CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
                CREATE INDEX IF NOT EXISTS idx_leads_company_status ON leads(company_id, status);
                CREATE INDEX IF NOT EXISTS idx_saved_employers_user ON user_saved_employers(user_id, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_lead_contacted_user ON user_lead_contacted(user_id, updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_lead_notifications_user ON user_lead_notifications(user_id, created_at DESC);
                CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_notifications_event ON user_lead_notifications(user_id, event_key);
                """
            )
            self._ensure_department_productivity_column(conn)
            self._ensure_user_profile_columns(conn)

    def _ensure_department_productivity_column(self, conn: sqlite3.Connection) -> None:
        columns = conn.execute("PRAGMA table_info(employees)").fetchall()
        column_names = {row["name"] for row in columns}
        if "department_productivity_score" not in column_names:
            conn.execute(
                """
                ALTER TABLE employees
                ADD COLUMN department_productivity_score REAL NOT NULL DEFAULT 0
                """
            )

    def _ensure_user_profile_columns(self, conn: sqlite3.Connection) -> None:
        columns = conn.execute("PRAGMA table_info(user_profiles)").fetchall()
        column_names = {row["name"] for row in columns}
        additions = [
            ("target_sectors", "TEXT"),
            ("target_company_size", "TEXT"),
            ("target_countries", "TEXT"),
            ("target_work_mode", "TEXT"),
        ]
        for column_name, column_type in additions:
            if column_name in column_names:
                continue
            conn.execute(f"ALTER TABLE user_profiles ADD COLUMN {column_name} {column_type}")

    def add_company(self, company: Company) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO companies (
                    id, name, domain, size, industry, country, website_url, tracked, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    company.company_id,
                    company.name,
                    company.domain,
                    company.size.value,
                    company.industry,
                    company.country,
                    company.website_url,
                    int(company.tracked),
                    company.created_at.isoformat(),
                    company.updated_at.isoformat(),
                ),
            )

    def list_tracked_companies(self) -> List[Company]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM companies WHERE tracked = 1 ORDER BY updated_at DESC"
            ).fetchall()
        return [self._row_to_company(row) for row in rows]

    def add_employee(self, employee: Employee) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO employees (
                    id, company_id, full_name, title, department, seniority, contact_channel,
                    public_profile_url, hiring_influence_score, contact_openness_score,
                    recency_score, department_productivity_score, confidence_score, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    employee.employee_id,
                    employee.company_id,
                    employee.full_name,
                    employee.title,
                    employee.department,
                    employee.seniority,
                    employee.contact_channel.value,
                    employee.public_profile_url,
                    employee.hiring_influence_score,
                    employee.contact_openness_score,
                    employee.recency_score,
                    employee.department_productivity_score,
                    employee.confidence_score,
                    employee.created_at.isoformat(),
                    employee.updated_at.isoformat(),
                ),
            )

    def top_valuable_employers(
        self, company_id: str, min_score: float = 55.0, limit: int = 10
    ) -> List[Employee]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM employees
                WHERE company_id = ?
                ORDER BY (
                    hiring_influence_score * 0.30 +
                    contact_openness_score * 0.20 +
                    recency_score * 0.15 +
                    department_productivity_score * 0.15 +
                    confidence_score * 0.20
                ) DESC
                LIMIT ?
                """,
                (company_id, limit),
            ).fetchall()
        employees = [self._row_to_employee(row) for row in rows]
        return [employee for employee in employees if employee.valuable_employer_score >= min_score]

    def add_lead(self, lead: Lead) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO leads (
                    id, company_id, employee_id, user_profile_summary, role_fit_score,
                    status, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    lead.lead_id,
                    lead.company_id,
                    lead.employee_id,
                    lead.user_profile_summary,
                    lead.role_fit_score,
                    lead.status.value,
                    lead.notes,
                    lead.created_at.isoformat(),
                    lead.updated_at.isoformat(),
                ),
            )

    def update_lead_status(
        self, lead_id: str, status: LeadStatus, notes: Optional[str] = None
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE leads
                SET status = ?, notes = COALESCE(?, notes), updated_at = ?
                WHERE id = ?
                """,
                (status.value, notes, now, lead_id),
            )

    def create_user(self, user: User) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO users (
                    id, email, password_hash, display_name, role, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user.user_id,
                    user.email,
                    user.password_hash,
                    user.display_name,
                    user.role.value,
                    user.created_at.isoformat(),
                    user.updated_at.isoformat(),
                ),
            )

    def get_user_by_email(self, email: str) -> Optional[User]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE email = ?",
                (email.strip().lower(),),
            ).fetchone()
        if not row:
            return None
        return self._row_to_user(row)

    def create_session(self, session_id: str, user_id: str, expires_at_iso: str) -> None:
        now_iso = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO user_sessions (session_id, user_id, created_at, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                (session_id, user_id, now_iso, expires_at_iso),
            )

    def delete_session(self, session_id: str) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM user_sessions WHERE session_id = ?", (session_id,))

    def get_user_by_session(self, session_id: str) -> Optional[User]:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT u.* FROM user_sessions s
                INNER JOIN users u ON u.id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > ?
                """,
                (session_id, datetime.now(timezone.utc).isoformat()),
            ).fetchone()
        if not row:
            return None
        return self._row_to_user(row)

    def save_valuable_employer_for_user(
        self,
        user_id: str,
        company_name: str,
        company_domain: Optional[str],
        company_logo: Optional[str],
        employer_name: str,
        employer_role: str,
        employer_email: Optional[str],
        employer_location: Optional[str],
        lead_score: float,
    ) -> None:
        entity_id = f"{user_id}:{company_name}:{employer_name}:{employer_role}".lower()
        now_iso = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO user_saved_employers (
                    id, user_id, company_name, company_domain, company_logo,
                    employer_name, employer_role, employer_email, employer_location,
                    lead_score, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    company_logo = COALESCE(excluded.company_logo, user_saved_employers.company_logo),
                    employer_email = COALESCE(excluded.employer_email, user_saved_employers.employer_email),
                    employer_location = COALESCE(excluded.employer_location, user_saved_employers.employer_location),
                    lead_score = excluded.lead_score
                """,
                (
                    entity_id,
                    user_id,
                    company_name,
                    company_domain,
                    company_logo,
                    employer_name,
                    employer_role,
                    employer_email,
                    employer_location,
                    round(float(lead_score), 2),
                    now_iso,
                ),
            )

    def list_saved_employers_for_user(self, user_id: str) -> List[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT id, company_name, company_domain, company_logo, employer_name, employer_role,
                       employer_email, employer_location, lead_score, created_at
                FROM user_saved_employers
                WHERE user_id = ?
                ORDER BY created_at DESC
                """,
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def clear_saved_employers_for_user(self, user_id: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "DELETE FROM user_saved_employers WHERE user_id = ?",
                (user_id,),
            )

    def delete_saved_employer_for_user(
        self,
        user_id: str,
        company_name: str,
        employer_name: str,
        employer_role: str,
    ) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                DELETE FROM user_saved_employers
                WHERE user_id = ? AND company_name = ? AND employer_name = ? AND employer_role = ?
                """,
                (user_id, company_name, employer_name, employer_role),
            )

    def delete_saved_employer_by_id_for_user(self, user_id: str, saved_employer_id: str) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                DELETE FROM user_saved_employers
                WHERE user_id = ? AND id = ?
                """,
                (user_id, saved_employer_id),
            )

    def get_user_profile(self, user_id: str) -> dict:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT headline, cv_text, target_sectors, target_company_size, target_countries, target_work_mode, updated_at
                FROM user_profiles
                WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()
        if not row:
            return {
                "headline": "",
                "cv_text": "",
                "target_sectors": "",
                "target_company_size": "",
                "target_countries": "",
                "target_work_mode": "",
                "updated_at": None,
            }
        return dict(row)

    def upsert_user_profile(
        self,
        user_id: str,
        headline: Optional[str],
        cv_text: Optional[str],
        target_sectors: Optional[str],
        target_company_size: Optional[str],
        target_countries: Optional[str],
        target_work_mode: Optional[str],
    ) -> None:
        now_iso = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO user_profiles (
                    user_id, headline, cv_text, target_sectors, target_company_size, target_countries, target_work_mode, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    headline = excluded.headline,
                    cv_text = excluded.cv_text,
                    target_sectors = excluded.target_sectors,
                    target_company_size = excluded.target_company_size,
                    target_countries = excluded.target_countries,
                    target_work_mode = excluded.target_work_mode,
                    updated_at = excluded.updated_at
                """,
                (
                    user_id,
                    (headline or "").strip(),
                    (cv_text or "").strip(),
                    (target_sectors or "").strip(),
                    (target_company_size or "").strip(),
                    (target_countries or "").strip(),
                    (target_work_mode or "").strip(),
                    now_iso,
                ),
            )

    def list_user_lead_notes(self, user_id: str) -> List[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT saved_employer_id, note_text, updated_at
                FROM user_lead_notes
                WHERE user_id = ?
                ORDER BY updated_at DESC
                """,
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def upsert_user_lead_note(self, user_id: str, saved_employer_id: str, note_text: str) -> None:
        cleaned = (note_text or "").strip()
        with self._connect() as conn:
            if not cleaned:
                conn.execute(
                    "DELETE FROM user_lead_notes WHERE user_id = ? AND saved_employer_id = ?",
                    (user_id, saved_employer_id),
                )
                return
            now_iso = datetime.now(timezone.utc).isoformat()
            conn.execute(
                """
                INSERT INTO user_lead_notes (user_id, saved_employer_id, note_text, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, saved_employer_id) DO UPDATE SET
                    note_text = excluded.note_text,
                    updated_at = excluded.updated_at
                """,
                (user_id, saved_employer_id, cleaned, now_iso),
            )

    def set_user_lead_contacted(self, user_id: str, saved_employer_id: str, is_contacted: bool) -> None:
        now_iso = datetime.now(timezone.utc).isoformat()
        contacted_at = now_iso if is_contacted else None
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO user_lead_contacted (user_id, saved_employer_id, is_contacted, contacted_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, saved_employer_id) DO UPDATE SET
                    is_contacted = excluded.is_contacted,
                    contacted_at = excluded.contacted_at,
                    updated_at = excluded.updated_at
                """,
                (user_id, saved_employer_id, int(bool(is_contacted)), contacted_at, now_iso),
            )

    def list_user_lead_contacted(self, user_id: str) -> List[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT saved_employer_id, is_contacted, contacted_at, updated_at
                FROM user_lead_contacted
                WHERE user_id = ?
                ORDER BY updated_at DESC
                """,
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def create_user_lead_notification(
        self,
        notification_id: str,
        user_id: str,
        saved_employer_id: str,
        event_key: str,
        title: str,
        reason: str,
        cta_text: str,
        company_name: str,
        employer_name: str,
    ) -> bool:
        now_iso = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            exists = conn.execute(
                "SELECT 1 FROM user_lead_notifications WHERE user_id = ? AND event_key = ? LIMIT 1",
                (user_id, event_key),
            ).fetchone()
            if exists:
                return False
            conn.execute(
                """
                INSERT INTO user_lead_notifications (
                    id, user_id, saved_employer_id, event_key, title, reason, cta_text,
                    company_name, employer_name, is_read, created_at, read_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL)
                """,
                (
                    notification_id,
                    user_id,
                    saved_employer_id,
                    event_key,
                    title,
                    reason,
                    cta_text,
                    company_name,
                    employer_name,
                    now_iso,
                ),
            )
            return True

    def list_user_lead_notifications(self, user_id: str, unread_only: bool = False, limit: int = 20) -> List[dict]:
        safe_limit = max(1, min(int(limit), 100))
        unread_clause = "AND is_read = 0" if unread_only else ""
        with self._connect() as conn:
            rows = conn.execute(
                f"""
                SELECT id, saved_employer_id, event_key, title, reason, cta_text, company_name,
                       employer_name, is_read, created_at, read_at
                FROM user_lead_notifications
                WHERE user_id = ?
                {unread_clause}
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (user_id, safe_limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def mark_user_lead_notifications_read(self, user_id: str, notification_ids: List[str]) -> int:
        ids = [item for item in notification_ids if item]
        if not ids:
            return 0
        now_iso = datetime.now(timezone.utc).isoformat()
        placeholders = ",".join("?" for _ in ids)
        with self._connect() as conn:
            cursor = conn.execute(
                f"""
                UPDATE user_lead_notifications
                SET is_read = 1, read_at = ?
                WHERE user_id = ? AND id IN ({placeholders}) AND is_read = 0
                """,
                (now_iso, user_id, *ids),
            )
            return int(cursor.rowcount or 0)

    def mark_all_user_lead_notifications_read(self, user_id: str) -> int:
        now_iso = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            cursor = conn.execute(
                """
                UPDATE user_lead_notifications
                SET is_read = 1, read_at = ?
                WHERE user_id = ? AND is_read = 0
                """,
                (now_iso, user_id),
            )
            return int(cursor.rowcount or 0)

    def _row_to_company(self, row: sqlite3.Row) -> Company:
        company = Company(
            company_id=row["id"],
            name=row["name"],
            domain=row["domain"],
            size=CompanySize(row["size"]),
            industry=row["industry"],
            country=row["country"],
            website_url=row["website_url"],
            tracked=bool(row["tracked"]),
        )
        company.created_at = datetime.fromisoformat(row["created_at"])
        company.updated_at = datetime.fromisoformat(row["updated_at"])
        return company

    def _row_to_employee(self, row: sqlite3.Row) -> Employee:
        employee = Employee(
            employee_id=row["id"],
            company_id=row["company_id"],
            full_name=row["full_name"],
            title=row["title"],
            department=row["department"],
            seniority=row["seniority"],
            contact_channel=ContactChannel(row["contact_channel"]),
            public_profile_url=row["public_profile_url"],
            hiring_influence_score=row["hiring_influence_score"],
            contact_openness_score=row["contact_openness_score"],
            recency_score=row["recency_score"],
            department_productivity_score=row["department_productivity_score"],
            confidence_score=row["confidence_score"],
        )
        employee.created_at = datetime.fromisoformat(row["created_at"])
        employee.updated_at = datetime.fromisoformat(row["updated_at"])
        return employee

    def _row_to_user(self, row: sqlite3.Row) -> User:
        user = User(
            user_id=row["id"],
            email=row["email"],
            password_hash=row["password_hash"],
            display_name=row["display_name"],
            role=UserRole(row["role"]),
        )
        user.created_at = datetime.fromisoformat(row["created_at"])
        user.updated_at = datetime.fromisoformat(row["updated_at"])
        return user

