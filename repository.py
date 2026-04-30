from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator, List, Optional

from models import Company, CompanySize, ContactChannel, Employee, Lead, LeadStatus


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

                CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
                CREATE INDEX IF NOT EXISTS idx_leads_company_status ON leads(company_id, status);
                """
            )
            self._ensure_department_productivity_column(conn)

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

