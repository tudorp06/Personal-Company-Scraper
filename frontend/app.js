const input = document.getElementById("lead-search");
const suggestions = document.getElementById("suggestions");
const themeToggle = document.getElementById("theme-toggle");
let activeController = null;
let debounceTimer = null;
const THEME_STORAGE_KEY = "ui_theme_preference";
const FALLBACK_COMPANIES = [
  { name: "AROBS", domain: "arobs.com", country: "RO", source: "fallback", logo_url: "https://logo.clearbit.com/arobs.com" },
  { name: "NTT DATA Romania", domain: "ro.nttdata.com", country: "RO", source: "fallback", logo_url: "https://logo.clearbit.com/nttdata.com" },
  { name: "Fortech", domain: "fortech.ro", country: "RO", source: "fallback", logo_url: "https://logo.clearbit.com/fortech.ro" },
  { name: "YouTube", domain: "youtube.com", country: "US", source: "fallback", logo_url: "https://logo.clearbit.com/youtube.com" },
  { name: "Yahoo", domain: "yahoo.com", country: "US", source: "fallback", logo_url: "https://logo.clearbit.com/yahoo.com" },
  { name: "Yonder", domain: "yonder.com", country: "GB", source: "fallback", logo_url: "https://logo.clearbit.com/yonder.com" },
  { name: "Yamaha", domain: "yamaha.com", country: "JP", source: "fallback", logo_url: "https://logo.clearbit.com/yamaha.com" },
  { name: "UiPath", domain: "uipath.com", country: "RO", source: "fallback", logo_url: "https://logo.clearbit.com/uipath.com" },
  { name: "Bitdefender", domain: "bitdefender.com", country: "RO", source: "fallback", logo_url: "https://logo.clearbit.com/bitdefender.com" },
  { name: "Endava", domain: "endava.com", country: "RO", source: "fallback", logo_url: "https://logo.clearbit.com/endava.com" },
  { name: "Google", domain: "google.com", country: "US", source: "fallback", logo_url: "https://logo.clearbit.com/google.com" },
  { name: "Stripe", domain: "stripe.com", country: "US", source: "fallback", logo_url: "https://logo.clearbit.com/stripe.com" },
];

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle?.setAttribute("aria-label", "Switch to light mode");
    return;
  }
  document.documentElement.removeAttribute("data-theme");
  themeToggle?.setAttribute("aria-label", "Switch to dark mode");
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
}

function createSuggestionItem(company) {
  const item = document.createElement("li");
  item.className = "suggestion-item";

  const logo = document.createElement("img");
  logo.className = "company-logo";
  logo.src = company.logo_url || "";
  logo.alt = `${company.name} logo`;
  logo.loading = "lazy";

  const meta = document.createElement("div");
  meta.className = "company-meta";

  const name = document.createElement("span");
  name.className = "company-name";
  name.textContent = company.name;

  const details = document.createElement("span");
  details.className = "company-domain";
  const parts = [company.domain, company.country, company.source].filter(Boolean);
  details.textContent = parts.join(" • ");

  meta.appendChild(name);
  meta.appendChild(details);
  item.appendChild(logo);
  item.appendChild(meta);
  return item;
}

function renderSuggestions(companies) {
  suggestions.innerHTML = "";
  companies.forEach((company) => {
    suggestions.appendChild(createSuggestionItem(company));
  });
}

function fallbackMatches(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return FALLBACK_COMPANIES.filter((company) => {
    const name = company.name.toLowerCase();
    const domain = (company.domain || "").toLowerCase();
    return name.includes(normalized) || domain.includes(normalized);
  }).slice(0, 12);
}

async function fetchCompanies(query) {
  if (activeController) activeController.abort();
  activeController = new AbortController();

  const url = `/api/company-search?q=${encodeURIComponent(query)}&limit=20`;
  const response = await fetch(url, { signal: activeController.signal });
  if (!response.ok) throw new Error(`Search failed with ${response.status}`);
  const payload = await response.json();
  return payload.companies || [];
}

function scheduleSearch() {
  const query = input.value.trim();
  clearTimeout(debounceTimer);

  if (!query) {
    renderSuggestions([]);
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const companies = await fetchCompanies(query);
      if (companies.length > 0) {
        renderSuggestions(companies);
      } else {
        renderSuggestions(fallbackMatches(query));
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        renderSuggestions(fallbackMatches(query));
      }
    }
  }, 180);
}

input.addEventListener("input", scheduleSearch);
themeToggle?.addEventListener("click", toggleTheme);
applyTheme(getInitialTheme());
