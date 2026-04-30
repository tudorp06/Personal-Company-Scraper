from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4


class CompanySize(str, Enum):
    STARTUP = "startup"
    SMB = "smb"
    ENTERPRISE = "enterprise"


class ContactChannel(str, Enum):
    UNKNOWN = "unknown"
    EMAIL = "email"
    CONTACT_FORM = "contact_form"
    TWITTER = "twitter"
    GITHUB = "github"
    WEBSITE = "website"


class LeadStatus(str, Enum):
    NEW = "new"
    WATCHING = "watching"
    ALERTED = "alerted"
    CONTACTED = "contacted"
    CONVERTED = "converted"
    DISMISSED = "dismissed"


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class Company:
    def __init__(
        self,
        name: str,
        domain: str,
        size: CompanySize = CompanySize.STARTUP,
        industry: Optional[str] = None,
        country: Optional[str] = None,
        website_url: Optional[str] = None,
        tracked: bool = True,
        company_id: Optional[str] = None,
    ) -> None:
        self.company_id = company_id or str(uuid4())
        self.name = name
        self.domain = domain
        self.size = size
        self.industry = industry
        self.country = country
        self.website_url = website_url
        self.tracked = tracked
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at

    @property
    def name(self) -> str:
        return self._name

    @name.setter
    def name(self, value: str) -> None:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("company name is required")
        self._name = cleaned

    @property
    def domain(self) -> str:
        return self._domain

    @domain.setter
    def domain(self, value: str) -> None:
        cleaned = value.strip().lower()
        if not cleaned or "." not in cleaned:
            raise ValueError("domain must be a valid host, e.g. example.com")
        self._domain = cleaned

    @property
    def size(self) -> CompanySize:
        return self._size

    @size.setter
    def size(self, value: CompanySize) -> None:
        if not isinstance(value, CompanySize):
            raise ValueError("size must be a CompanySize enum value")
        self._size = value

    @property
    def industry(self) -> Optional[str]:
        return self._industry

    @industry.setter
    def industry(self, value: Optional[str]) -> None:
        self._industry = value.strip() if value else None

    @property
    def country(self) -> Optional[str]:
        return self._country

    @country.setter
    def country(self, value: Optional[str]) -> None:
        self._country = value.strip() if value else None

    @property
    def website_url(self) -> Optional[str]:
        return self._website_url

    @website_url.setter
    def website_url(self, value: Optional[str]) -> None:
        if value is None:
            self._website_url = None
            return
        cleaned = value.strip()
        if not cleaned.startswith(("http://", "https://")):
            raise ValueError("website_url must start with http:// or https://")
        self._website_url = cleaned

    @property
    def tracked(self) -> bool:
        return self._tracked

    @tracked.setter
    def tracked(self, value: bool) -> None:
        if not isinstance(value, bool):
            raise ValueError("tracked must be a boolean")
        self._tracked = value

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self) -> str:
        return (
            "Company("
            f"company_id={self.company_id!r}, name={self.name!r}, domain={self.domain!r}, "
            f"size={self.size.value!r}, tracked={self.tracked!r})"
        )

    def __str__(self) -> str:
        return f"{self.name} ({self.domain})"


class Employee:
    def __init__(
        self,
        company_id: str,
        full_name: str,
        title: str,
        department: str,
        seniority: Optional[str] = None,
        contact_channel: ContactChannel = ContactChannel.UNKNOWN,
        public_profile_url: Optional[str] = None,
        hiring_influence_score: float = 0.0,
        contact_openness_score: float = 0.0,
        recency_score: float = 0.0,
        department_productivity_score: float = 0.0,
        confidence_score: float = 0.0,
        employee_id: Optional[str] = None,
    ) -> None:
        self.employee_id = employee_id or str(uuid4())
        self.company_id = company_id
        self.full_name = full_name
        self.title = title
        self.department = department
        self.seniority = seniority
        self.contact_channel = contact_channel
        self.public_profile_url = public_profile_url
        self.hiring_influence_score = hiring_influence_score
        self.contact_openness_score = contact_openness_score
        self.recency_score = recency_score
        self.department_productivity_score = department_productivity_score
        self.confidence_score = confidence_score
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at

    @property
    def company_id(self) -> str:
        return self._company_id

    @company_id.setter
    def company_id(self, value: str) -> None:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("company_id is required")
        self._company_id = cleaned

    @property
    def full_name(self) -> str:
        return self._full_name

    @full_name.setter
    def full_name(self, value: str) -> None:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("full_name must have at least 2 characters")
        self._full_name = cleaned

    @property
    def title(self) -> str:
        return self._title

    @title.setter
    def title(self, value: str) -> None:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("title is required")
        self._title = cleaned

    @property
    def department(self) -> str:
        return self._department

    @department.setter
    def department(self, value: str) -> None:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("department is required")
        self._department = cleaned

    @property
    def seniority(self) -> Optional[str]:
        return self._seniority

    @seniority.setter
    def seniority(self, value: Optional[str]) -> None:
        self._seniority = value.strip() if value else None

    @property
    def contact_channel(self) -> ContactChannel:
        return self._contact_channel

    @contact_channel.setter
    def contact_channel(self, value: ContactChannel) -> None:
        if not isinstance(value, ContactChannel):
            raise ValueError("contact_channel must be a ContactChannel enum value")
        self._contact_channel = value

    @property
    def public_profile_url(self) -> Optional[str]:
        return self._public_profile_url

    @public_profile_url.setter
    def public_profile_url(self, value: Optional[str]) -> None:
        if value is None:
            self._public_profile_url = None
            return
        cleaned = value.strip()
        if not cleaned.startswith(("http://", "https://")):
            raise ValueError("public_profile_url must start with http:// or https://")
        self._public_profile_url = cleaned

    def _validate_score(self, score_name: str, value: float) -> float:
        if value < 0 or value > 100:
            raise ValueError(f"{score_name} must be between 0 and 100")
        return round(float(value), 2)

    @property
    def hiring_influence_score(self) -> float:
        return self._hiring_influence_score

    @hiring_influence_score.setter
    def hiring_influence_score(self, value: float) -> None:
        self._hiring_influence_score = self._validate_score("hiring_influence_score", value)

    @property
    def contact_openness_score(self) -> float:
        return self._contact_openness_score

    @contact_openness_score.setter
    def contact_openness_score(self, value: float) -> None:
        self._contact_openness_score = self._validate_score("contact_openness_score", value)

    @property
    def recency_score(self) -> float:
        return self._recency_score

    @recency_score.setter
    def recency_score(self, value: float) -> None:
        self._recency_score = self._validate_score("recency_score", value)

    @property
    def confidence_score(self) -> float:
        return self._confidence_score

    @confidence_score.setter
    def confidence_score(self, value: float) -> None:
        self._confidence_score = self._validate_score("confidence_score", value)

    @property
    def department_productivity_score(self) -> float:
        return self._department_productivity_score

    @department_productivity_score.setter
    def department_productivity_score(self, value: float) -> None:
        self._department_productivity_score = self._validate_score(
            "department_productivity_score", value
        )

    @property
    def valuable_employer_score(self) -> float:
        # Weighted score for "gateway" potential inside a company.
        weighted = (
            (self.hiring_influence_score * 0.30)
            + (self.contact_openness_score * 0.20)
            + (self.recency_score * 0.15)
            + (self.department_productivity_score * 0.15)
            + (self.confidence_score * 0.20)
        )
        return round(weighted, 2)

    @property
    def alert_level(self) -> str:
        if self.valuable_employer_score >= 85:
            return "!!!"
        if self.valuable_employer_score >= 70:
            return "!!"
        if self.valuable_employer_score >= 55:
            return "!"
        return "-"

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self) -> str:
        return (
            "Employee("
            f"employee_id={self.employee_id!r}, company_id={self.company_id!r}, "
            f"full_name={self.full_name!r}, title={self.title!r}, department={self.department!r}, "
            f"score={self.valuable_employer_score!r}, alert={self.alert_level!r})"
        )

    def __str__(self) -> str:
        return f"{self.full_name} - {self.title} [{self.alert_level}]"


class Lead:
    def __init__(
        self,
        company_id: str,
        employee_id: str,
        user_profile_summary: str,
        role_fit_score: float,
        status: LeadStatus = LeadStatus.NEW,
        notes: Optional[str] = None,
        lead_id: Optional[str] = None,
    ) -> None:
        self.lead_id = lead_id or str(uuid4())
        self.company_id = company_id
        self.employee_id = employee_id
        self.user_profile_summary = user_profile_summary
        self.role_fit_score = role_fit_score
        self.status = status
        self.notes = notes
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at

    @property
    def company_id(self) -> str:
        return self._company_id

    @company_id.setter
    def company_id(self, value: str) -> None:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("company_id is required")
        self._company_id = cleaned

    @property
    def employee_id(self) -> str:
        return self._employee_id

    @employee_id.setter
    def employee_id(self, value: str) -> None:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("employee_id is required")
        self._employee_id = cleaned

    @property
    def user_profile_summary(self) -> str:
        return self._user_profile_summary

    @user_profile_summary.setter
    def user_profile_summary(self, value: str) -> None:
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise ValueError("user_profile_summary must have at least 10 characters")
        self._user_profile_summary = cleaned

    @property
    def role_fit_score(self) -> float:
        return self._role_fit_score

    @role_fit_score.setter
    def role_fit_score(self, value: float) -> None:
        if value < 0 or value > 100:
            raise ValueError("role_fit_score must be between 0 and 100")
        self._role_fit_score = round(float(value), 2)

    @property
    def status(self) -> LeadStatus:
        return self._status

    @status.setter
    def status(self, value: LeadStatus) -> None:
        if not isinstance(value, LeadStatus):
            raise ValueError("status must be a LeadStatus enum value")
        self._status = value

    @property
    def notes(self) -> Optional[str]:
        return self._notes

    @notes.setter
    def notes(self, value: Optional[str]) -> None:
        self._notes = value.strip() if value else None

    def mark_contacted(self, note: Optional[str] = None) -> None:
        self.status = LeadStatus.CONTACTED
        if note:
            self.notes = note
        self.updated_at = datetime.now(timezone.utc)

    def mark_converted(self, note: Optional[str] = None) -> None:
        self.status = LeadStatus.CONVERTED
        if note:
            self.notes = note
        self.updated_at = datetime.now(timezone.utc)

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self) -> str:
        return (
            "Lead("
            f"lead_id={self.lead_id!r}, company_id={self.company_id!r}, employee_id={self.employee_id!r}, "
            f"role_fit_score={self.role_fit_score!r}, status={self.status.value!r})"
        )

    def __str__(self) -> str:
        return f"Lead {self.lead_id} [{self.status.value}]"


class User:
    def __init__(
        self,
        email: str,
        password_hash: str,
        display_name: str,
        role: UserRole = UserRole.USER,
        user_id: Optional[str] = None,
    ) -> None:
        self.user_id = user_id or str(uuid4())
        self.email = email
        self.password_hash = password_hash
        self.display_name = display_name
        self.role = role
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at

    @property
    def email(self) -> str:
        return self._email

    @email.setter
    def email(self, value: str) -> None:
        cleaned = value.strip().lower()
        if "@" not in cleaned or "." not in cleaned.split("@")[-1]:
            raise ValueError("email must be valid")
        self._email = cleaned

    @property
    def password_hash(self) -> str:
        return self._password_hash

    @password_hash.setter
    def password_hash(self, value: str) -> None:
        cleaned = value.strip()
        if len(cleaned) < 20:
            raise ValueError("password_hash appears invalid")
        self._password_hash = cleaned

    @property
    def display_name(self) -> str:
        return self._display_name

    @display_name.setter
    def display_name(self, value: str) -> None:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("display_name must have at least 2 characters")
        self._display_name = cleaned

    @property
    def role(self) -> UserRole:
        return self._role

    @role.setter
    def role(self, value: UserRole) -> None:
        if not isinstance(value, UserRole):
            raise ValueError("role must be a UserRole enum value")
        self._role = value

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self) -> str:
        return (
            "User("
            f"user_id={self.user_id!r}, email={self.email!r}, "
            f"display_name={self.display_name!r}, role={self.role.value!r})"
        )

    def __str__(self) -> str:
        return f"{self.display_name} <{self.email}>"
