# Linkedln Scraper (beta)

This app is a small side project: search for registered Linkedln companies on a first-page searchbar, skim “people” style views, save leads you care about, and keep notes. Built for learning and for my own outreach workflow—not a polished SaaS, maybe I am considering that for the future. 

The app is basically intended to help people that want to enter a work sector, either through CV and experience or stuff they've already built (e.g. startup), get in contact with other valuable members of corporate teams (not the directors or managers), that are, at a given moment, open to get in contact through interviews, or have departments that are in desperate search of a certain candidate -> that's where the Valuable Leads functionality appears.

**Note:** it uses public-ish data (real information of the listed companies, but not from APIs) and a logo API, which is Brandfetch. It does **not** scrape LinkedIn. Don’t put real secrets in git; use `.env`.

## Important Functionalities

- **Live company search** — typeahead with logos; open a company for more detail.
- **Company views** — people-style lists, **Valuable Leads** (non-manager, pathway-style signals), addresses / email patterns, and an **Outreach Plan** tab.
- **Saved leads** — dashboard with filters, notes, statuses, CSV export, and optional lead updates when you’re following up.
- **Account & profile** — register/login, saved data per user; headline, CV text, and **target preferences** (sectors, size, countries, work mode).

---

## How to run it (Windows)

1. Copy `.env.example` to `.env` and add `BRANDFETCH_CLIENT_ID` if you want live logos.
2. In PowerShell, from this folder:

```powershell
.\run.ps1
```

1. Open `http://localhost:5500/` in the browser.

---

