# Valuable Employer Alert Schema

This schema is designed for a compliant, public-data-first platform that tracks selected companies and alerts users when a high-value "valuable employer" appears.

## Core entities

### companies
- id (uuid, pk)
- name (text, required)
- domain (text, unique, required)
- size (enum: startup|smb|enterprise)
- industry (text, nullable)
- country (text, nullable)
- website_url (text, nullable)
- tracked (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

### employees
- id (uuid, pk)
- company_id (uuid, fk -> companies.id, required)
- full_name (text, required)
- title (text, required)
- department (text, required)
- seniority (text, nullable)
- contact_channel (enum: unknown|email|contact_form|twitter|github|website)
- public_profile_url (text, nullable)
- hiring_influence_score (numeric(5,2), range 0..100)
- contact_openness_score (numeric(5,2), range 0..100)
- recency_score (numeric(5,2), range 0..100)
- department_productivity_score (numeric(5,2), range 0..100)
- confidence_score (numeric(5,2), range 0..100)
- valuable_employer_score (numeric(5,2), computed)
- alert_level (text, derived: -, !, !!, !!!)
- created_at (timestamp)
- updated_at (timestamp)

### leads
- id (uuid, pk)
- company_id (uuid, fk -> companies.id, required)
- employee_id (uuid, fk -> employees.id, required)
- user_profile_summary (text, required)
- role_fit_score (numeric(5,2), range 0..100)
- status (enum: new|watching|alerted|contacted|converted|dismissed)
- notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

## Suggested indexing
- companies(domain)
- employees(company_id, department)
- employees(company_id, valuable_employer_score desc)
- leads(company_id, status)

## Alert rule

For a tracked company, emit an alert when:
- employee.valuable_employer_score >= 55 (`!`)
- >= 70 (`!!`)
- >= 85 (`!!!`)

### Example weighted score

valuable_employer_score =
- 0.30 * hiring_influence_score
- 0.20 * contact_openness_score
- 0.15 * recency_score
- 0.15 * department_productivity_score
- 0.20 * confidence_score

## Compliance notes
- Store source URL and retrieval timestamp for every signal.
- Add provenance metadata to every employee score component.
- Use only public data or licensed APIs.
