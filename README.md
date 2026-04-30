# Personal Company Scraper

Linkedln Scraper (BETA) is a lead discovery platform designed to help:

- young startup founders who need the right internal contact points inside companies
- job seekers who want to find the most relevant people for CV submission in niche departments

The goal is not to spam broad HR channels, but to identify **valuable employers**: people and teams that are often closer to real hiring or decision flow in specialized functions.

## Scope

This project helps users:

- track companies they care about
- search companies quickly with a live typeahead interface
- surface relevant organizations across European and global markets
- rank internal profiles by a valuable-employer score
- prioritize outreach with clear alert levels

## Problem It Solves

Many candidates and founders only contact generic inboxes or highly visible executives.  
This app focuses on finding hidden but impactful gateway roles in departments like:

- implementation
- operations
- customer engineering
- partner teams
- other specialized org units with real influence

## Core Features

- **Company discovery search**
  - Live search with instant suggestions while typing.
  - Cached local results for fast responses.
  - API-backed enrichment from selected providers.

- **Valuable employer scoring**
  - Uses weighted signals such as:
    - hiring influence
    - contact openness
    - recency
    - department productivity
    - confidence

- **Alert system**
  - `!`, `!!`, `!!!` levels to highlight high-priority opportunities.

- **Formal UI**
  - Work-oriented interface with light/dark mode toggle.

## Data & Compliance Approach

This project is built with a public-data and provider-API approach.

- Uses provider APIs (for example Crunchbase, OpenCorporates, Brandfetch).
- Uses local caching for speed and reduced API usage.
- Keeps API keys in `.env` (ignored by git).
- Avoids committing secrets.

## Tech Stack

- **Backend:** Python
- **Storage:** SQLite
- **Frontend:** HTML/CSS/JavaScript
- **Server:** lightweight Python HTTP server with JSON API endpoints

## Quick Start

1. Create and fill `.env` (or let `run.ps1` generate from `.env.example`).
2. Add your provider key:
   - `BRANDFETCH_CLIENT_ID`  ## This one is used for the Company Logos API provided by Brandfetch -> it has a 500.000 free credit plan.
3. Run:

```powershell
.\run.ps1
```

4. Open:

`http://localhost:5500/`

## Vision

Make company outreach smarter for early builders and candidates by turning noisy company lists into actionable, high-confidence introductions to the right people.
# Personal-Company-Scraper
