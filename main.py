from models import Company, Employee, Lead
from repository import Repository


def bootstrap() -> None:
    repo = Repository("app.db")
    repo.init_db()

    company = Company(name="Acme Labs", domain="acme.com")
    repo.add_company(company)

    employee = Employee(
        company_id=company.company_id,
        full_name="Jordan Blake",
        title="Implementation Lead",
        department="Customer Engineering",
        hiring_influence_score=82,
        contact_openness_score=76,
        recency_score=67,
        department_productivity_score=91,
        confidence_score=88,
    )
    repo.add_employee(employee)

    lead = Lead(
        company_id=company.company_id,
        employee_id=employee.employee_id,
        user_profile_summary="Python engineer with B2B SaaS onboarding and integrations experience.",
        role_fit_score=79,
    )
    repo.add_lead(lead)


if __name__ == "__main__":
    bootstrap()
