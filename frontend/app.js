const input = document.getElementById("lead-search");
const appShell = document.getElementById("app-shell");
const authScreen = document.getElementById("auth-screen");
const showRegisterButton = document.getElementById("show-register");
const showLoginButton = document.getElementById("show-login");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const authMessage = document.getElementById("auth-message");
const logoutButton = document.getElementById("logout-button");
const dashboardToggleButton = document.getElementById("dashboard-toggle");
const contrastToggleButton = document.getElementById("contrast-toggle");
const homeView = document.getElementById("home-view");
const dashboardView = document.getElementById("dashboard-view");
const savedLeadsList = document.getElementById("saved-leads-list");
const refreshSavedLeadsButton = document.getElementById("refresh-saved-leads");
const notificationsToggleButton = document.getElementById("notifications-toggle");
const resetSavedLeadsButton = document.getElementById("reset-saved-leads");
const savedLeadsStatus = document.getElementById("saved-leads-status");
const sectorFilters = document.getElementById("sector-filters");
const removeModal = document.getElementById("remove-modal");
const removeModalSubtitle = document.getElementById("remove-modal-subtitle");
const cancelRemoveLeadButton = document.getElementById("cancel-remove-lead");
const confirmRemoveLeadButton = document.getElementById("confirm-remove-lead");
const goalTargetInput = document.getElementById("goal-target-input");
const saveGoalTargetButton = document.getElementById("save-goal-target");
const goalProgressText = document.getElementById("goal-progress-text");
const suggestions = document.getElementById("suggestions");
const themeToggle = document.getElementById("theme-toggle");
const companyCard = document.getElementById("company-card");
const selectedCompanyLogo = document.getElementById("selected-company-logo");
const selectedCompanyName = document.getElementById("selected-company-name");
const selectedCompanyDetails = document.getElementById("selected-company-details");
const employeeList = document.getElementById("employee-list");
const employeeCard = document.getElementById("employee-card");
const employeeCardCompanyLogo = document.getElementById("employee-card-company-logo");
const employeeCardCompanyName = document.getElementById("employee-card-company-name");
const employeeCardFirstName = document.getElementById("employee-card-first-name");
const employeeCardLastName = document.getElementById("employee-card-last-name");
const employeeCardEmail = document.getElementById("employee-card-email");
const employeeCardRole = document.getElementById("employee-card-role");
const employeeCardCompany = document.getElementById("employee-card-company");
const employeeCardLocation = document.getElementById("employee-card-location");
const favoriteButton = document.getElementById("favorite-button");
const employeeTabs = Array.from(document.querySelectorAll(".employee-tab"));
const valuableLeadsPanel = document.getElementById("valuable-leads-panel");
const addressesPanel = document.getElementById("addresses-panel");
let activeController = null;
let debounceTimer = null;
let currentSuggestions = [];
let selectedCompanyKey = null;
let selectedCompany = null;
let currentEmployees = [];
let selectedEmployee = null;
let activeEmployeeView = "people";
let companyInsights = { employees: [], email_terminations: [] };
let activeMainView = "home";
let activeSectorFilter = "All";
let pendingRemoveLead = null;
let currentUserEmail = "guest";
let lastLoadedSavedLeads = [];
const THEME_STORAGE_KEY = "ui_theme_preference";
const CONTRAST_STORAGE_KEY = "ui_contrast_preference";
const FAVORITES_STORAGE_KEY = "favorite_employees";
const LEADS_NOTIFICATIONS_ENABLED_KEY = "leads_notifications_enabled";
const LEADS_NOTIFICATIONS_MAP_KEY = "leads_notifications_map";
const LEADS_STATUS_MAP_KEY = "leads_status_map";
const BRANDFETCH_CLIENT_ID = "1id6iCSRkbc4cqe2MBu";
const LEAD_SECTORS = ["All", "BigTech", "Tech", "Economics", "Properties", "CyberSec", "Graphic Design"];
const CONTRAST_PRESETS = ["default", "high"];
const FALLBACK_COMPANIES = [
  { name: "AROBS", domain: "arobs.com", country: "RO", source: "fallback", logo_url: "" },
  { name: "NTT DATA Romania", domain: "ro.nttdata.com", country: "RO", source: "fallback", logo_url: "" },
  { name: "Fortech", domain: "fortech.ro", country: "RO", source: "fallback", logo_url: "" },
  { name: "YouTube", domain: "youtube.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Yahoo", domain: "yahoo.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Yonder", domain: "yonder.com", country: "GB", source: "fallback", logo_url: "" },
  { name: "Yamaha", domain: "yamaha.com", country: "JP", source: "fallback", logo_url: "" },
  { name: "UiPath", domain: "uipath.com", country: "RO", source: "fallback", logo_url: "" },
  { name: "Bitdefender", domain: "bitdefender.com", country: "RO", source: "fallback", logo_url: "" },
  { name: "Endava", domain: "endava.com", country: "RO", source: "fallback", logo_url: "" },
  { name: "NVIDIA", domain: "nvidia.com", country: "US", source: "fallback", logo_url: "" },
  { name: "AMD", domain: "amd.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Qualcomm", domain: "qualcomm.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Logitech", domain: "logitech.com", country: "CH", source: "fallback", logo_url: "" },
  { name: "Apple", domain: "apple.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Amazon", domain: "amazon.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Facebook", domain: "facebook.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Meta", domain: "meta.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Netflix", domain: "netflix.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Google", domain: "google.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Microsoft", domain: "microsoft.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Alphabet", domain: "abc.xyz", country: "US", source: "fallback", logo_url: "" },
  { name: "Amazon Web Services", domain: "aws.amazon.com", country: "US", source: "fallback", logo_url: "" },
  { name: "JPMorgan Chase", domain: "jpmorganchase.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Goldman Sachs", domain: "goldmansachs.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Morgan Stanley", domain: "morganstanley.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Citigroup", domain: "citi.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Wells Fargo", domain: "wellsfargo.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Capital One", domain: "capitalone.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Visa", domain: "visa.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Robinhood", domain: "robinhood.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Stripe", domain: "stripe.com", country: "US", source: "fallback", logo_url: "" },
];

function showAuthScreen() {
  authScreen?.classList.remove("hidden");
  appShell?.classList.add("hidden");
}

function showAppShell() {
  authScreen?.classList.add("hidden");
  appShell?.classList.remove("hidden");
  setMainView("home");
}

function setAuthTab(mode) {
  const registerMode = mode === "register";
  showRegisterButton?.classList.toggle("active", registerMode);
  showLoginButton?.classList.toggle("active", !registerMode);
  registerForm?.classList.toggle("hidden", !registerMode);
  loginForm?.classList.toggle("hidden", registerMode);
  if (authMessage) authMessage.textContent = "";
}

async function authRequest(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data: json };
}

async function resolveSession() {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) {
      showAuthScreen();
      return;
    }
    const payload = await response.json().catch(() => ({}));
    currentUserEmail = payload?.user?.email || "guest";
    loadGoalTarget();
    showAppShell();
  } catch {
    showAuthScreen();
  }
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle?.setAttribute("aria-label", "Switch to light mode");
    return;
  }
  document.documentElement.removeAttribute("data-theme");
  themeToggle?.setAttribute("aria-label", "Switch to dark mode");
}

function goalTargetStorageKey() {
  return `goal_target_${currentUserEmail || "guest"}`;
}

function contrastStorageKey() {
  return CONTRAST_STORAGE_KEY;
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyContrastPreset(preset) {
  const safePreset = preset === "high" ? "high" : "default";
  document.documentElement.setAttribute("data-contrast", safePreset);
  if (contrastToggleButton) {
    contrastToggleButton.textContent = safePreset === "high" ? "Contrast: High" : "Contrast: Default";
  }
}

function getInitialContrast() {
  const stored = localStorage.getItem(contrastStorageKey());
  return stored === "high" ? "high" : "default";
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
}

function toggleContrast() {
  const current = document.documentElement.getAttribute("data-contrast") === "high" ? "high" : "default";
  const next = current === "high" ? "default" : "high";
  localStorage.setItem(contrastStorageKey(), next);
  applyContrastPreset(next);
}

function createSuggestionItem(company) {
  const item = document.createElement("li");
  item.className = "suggestion-item";

  const logo = document.createElement("img");
  logo.className = "company-logo";
  logo.src = company.logo_url || brandfetchLogoUrl(company.domain);
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
  currentSuggestions = companies;
  suggestions.innerHTML = "";
  companies.forEach((company, index) => {
    const row = createSuggestionItem(company);
    row.dataset.index = String(index);
    suggestions.appendChild(row);
  });
}

function buildCompanyDomain(company) {
  if (company.domain) return company.domain;
  return `${company.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.company`;
}

function brandfetchLogoUrl(domain) {
  if (!domain) return "";
  return `https://cdn.brandfetch.io/${encodeURIComponent(domain)}?c=${encodeURIComponent(BRANDFETCH_CLIENT_ID)}`;
}

function employeeMocks(companyName) {
  const normalized = companyName.toLowerCase();
  const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "") || "company";
  const redactedEmail = `{redacted}@${companySlug}.company`;
  const romanianCompany =
    normalized.includes("fortech") ||
    normalized.includes("arobs") ||
    normalized.includes("uipath") ||
    normalized.includes("bitdefender") ||
    normalized.includes("endava") ||
    normalized.includes("ntt data romania");
  const roles = [
    "Technical Partnerships Manager",
    "Director of Implementation",
    "Solutions Engineering Lead",
    "Head of Strategic Accounts",
    "Executive Advisor - Growth",
    "Platform Partnerships Lead",
    "Business Development Manager",
  ];
  const roFirst = ["Tudor", "Razvan", "Andrei", "Calin", "Voicu", "Mihai", "Vlad", "Alexandru", "Radu", "Ioana"];
  const roLast = ["Popescu", "Ionescu", "Marinescu", "Vaduva", "Oprean", "Stan", "Dumitrescu", "Moldovan"];
  const roLocations = ["Cluj-Napoca, Romania", "Bucharest, Romania", "Timisoara, Romania", "Oradea, Romania", "Iasi, Romania"];
  const intlFirst = ["Heather", "Brandon", "Sara", "William", "Tim", "Sophie", "Liam", "Noah", "Emma", "Ava"];
  const intlLast = ["Taylor", "Anders", "Stone", "Lane", "Keller", "Murphy", "Carter", "Hughes"];
  const intlLocations = ["Berlin, Germany", "London, UK", "Paris, France", "Madrid, Spain", "Amsterdam, Netherlands", "Dublin, Ireland"];

  const firstPool = romanianCompany ? roFirst : intlFirst;
  const lastPool = romanianCompany ? roLast : intlLast;
  const locPool = romanianCompany ? roLocations : intlLocations;
  const base = Array.from(companySlug).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Array.from({ length: 6 }).map((_, idx) => {
    const seed = base + idx * 17;
    const firstName = firstPool[seed % firstPool.length];
    const lastName = lastPool[(seed * 3) % lastPool.length];
    return {
      id: `${companySlug}-${firstName.toLowerCase()}-${lastName.toLowerCase()}-${idx}`,
      firstName,
      lastName,
      role: roles[(seed * 5) % roles.length],
      email: redactedEmail,
      location: locPool[(seed * 7) % locPool.length],
    };
  });
}

async function fetchCompanyInsights(company) {
  const query = new URLSearchParams({
    name: company.name || "",
    domain: company.domain || "",
    country: company.country || "",
  });
  const response = await fetch(`/api/company-insights?${query.toString()}`);
  if (!response.ok) throw new Error(`Insights failed with ${response.status}`);
  return response.json();
}

function favoritesMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "{}");
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveFavorite(employee, company) {
  const map = favoritesMap();
  map[employee.id] = {
    employeeId: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    role: employee.role,
    email: employee.email,
    location: employee.location,
    companyName: company.name,
    companyDomain: buildCompanyDomain(company),
    companyLogo: company.logo_url || brandfetchLogoUrl(company.domain),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(map));
}

async function saveFavoriteToServer(employee, company) {
  const response = await fetch("/api/user/saved-employers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_name: company.name,
      company_domain: buildCompanyDomain(company),
      company_logo: company.logo_url || brandfetchLogoUrl(company.domain),
      employer_name: `${employee.firstName} ${employee.lastName}`,
      employer_role: employee.role,
      employer_email: employee.email,
      employer_location: employee.location,
      lead_score: employee.valuableLeadScore || 0,
    }),
  });
  return response.ok;
}

function showSavedLeadsStatus(message) {
  if (!savedLeadsStatus) return;
  if (!message) {
    savedLeadsStatus.textContent = "";
    savedLeadsStatus.classList.add("hidden");
    return;
  }
  savedLeadsStatus.textContent = message;
  savedLeadsStatus.classList.remove("hidden");
}

function leadNotificationKey(item) {
  return `${item.company_name || ""}|${item.employer_name || ""}|${item.employer_role || ""}`.toLowerCase();
}

function leadNotificationsMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEADS_NOTIFICATIONS_MAP_KEY) || "{}");
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveLeadNotificationsMap(map) {
  localStorage.setItem(LEADS_NOTIFICATIONS_MAP_KEY, JSON.stringify(map));
}

function notificationsEnabled() {
  return localStorage.getItem(LEADS_NOTIFICATIONS_ENABLED_KEY) === "1";
}

function updateNotificationsToggleButton() {
  if (!notificationsToggleButton) return;
  const enabled = notificationsEnabled();
  notificationsToggleButton.textContent = enabled ? "Notifications On" : "Notifications Off";
}

function setNotificationsEnabled(enabled) {
  localStorage.setItem(LEADS_NOTIFICATIONS_ENABLED_KEY, enabled ? "1" : "0");
  updateNotificationsToggleButton();
  if (enabled) {
    showSavedLeadsStatus("Notifications are active for selected leads.");
  } else {
    showSavedLeadsStatus("Notifications are paused. Turn them on to receive interview-open alerts.");
  }
}

function isLeadNotificationOn(item) {
  const map = leadNotificationsMap();
  return Boolean(map[leadNotificationKey(item)]);
}

function setLeadNotification(item, enabled) {
  const map = leadNotificationsMap();
  map[leadNotificationKey(item)] = Boolean(enabled);
  saveLeadNotificationsMap(map);
}

function leadStatusMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEADS_STATUS_MAP_KEY) || "{}");
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveLeadStatusMap(map) {
  localStorage.setItem(LEADS_STATUS_MAP_KEY, JSON.stringify(map));
}

function leadStatusFor(item) {
  const map = leadStatusMap();
  return map[leadNotificationKey(item)] || "hot";
}

function setLeadStatus(item, status) {
  const safeStatus = ["hot", "follow-up", "cv"].includes(status) ? status : "hot";
  const map = leadStatusMap();
  map[leadNotificationKey(item)] = safeStatus;
  saveLeadStatusMap(map);
}

function leadAlertForScore(scoreRaw) {
  const score = Number(scoreRaw) || 0;
  if (score >= 85) return { badge: "High", label: "High priority", tier: "high" };
  if (score >= 70) return { badge: "Medium", label: "Strong lead", tier: "mid" };
  return { badge: "Low", label: "Watch lead", tier: "low" };
}

async function clearSavedLeadsOnServer() {
  const response = await fetch("/api/user/saved-employers", { method: "DELETE" });
  return response.ok;
}

async function deleteSavedLeadOnServer(item) {
  const query = new URLSearchParams({ id: item.id || "" });
  const response = await fetch(`/api/user/saved-employers?${query.toString()}`, { method: "DELETE" });
  return response.ok;
}

function inferCompanySector(item) {
  const text = `${item.company_name || ""} ${(item.company_domain || "")}`.toLowerCase();
  if (/google|alphabet|apple|amazon|meta|microsoft|netflix/.test(text)) return "BigTech";
  if (/nvidia|amd|qualcomm|snap|logitech|openai|stripe|adobe|oracle|salesforce|uber|airbnb|spotify|figma|canva/.test(text)) return "Tech";
  if (/bank|capital|finance|econom|visa|mastercard|paypal|revolut|wise|jpmorgan|goldman|morgan/.test(text)) return "Economics";
  if (/estate|property|properties|realty|real estate|imobil|housing/.test(text)) return "Properties";
  if (/bitdefender|crowdstrike|palo alto|fortinet|sentinel|cyber|security/.test(text)) return "CyberSec";
  if (/design|figma|canva|adobe/.test(text)) return "Graphic Design";
  return "Tech";
}

function renderSectorFilters() {
  if (!sectorFilters) return;
  sectorFilters.innerHTML = "";
  LEAD_SECTORS.forEach((sector) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `sector-filter-chip ${activeSectorFilter === sector ? "is-active" : ""}`;
    button.dataset.sector = sector;
    button.textContent = sector;
    sectorFilters.appendChild(button);
  });
}

function loadGoalTarget() {
  const raw = Number(localStorage.getItem(goalTargetStorageKey()) || "10");
  const target = Number.isFinite(raw) && raw > 0 ? Math.min(100, Math.floor(raw)) : 10;
  if (goalTargetInput) goalTargetInput.value = String(target);
  return target;
}

function saveGoalTarget() {
  const raw = Number(goalTargetInput?.value || "10");
  const target = Number.isFinite(raw) && raw > 0 ? Math.min(100, Math.floor(raw)) : 10;
  localStorage.setItem(goalTargetStorageKey(), String(target));
  if (goalTargetInput) goalTargetInput.value = String(target);
  updateGoalProgress(lastLoadedSavedLeads);
}

function updateGoalProgress(items) {
  const target = loadGoalTarget();
  const done = (items || []).filter((item) => {
    const status = leadStatusFor(item);
    return status === "follow-up" || status === "cv";
  }).length;
  if (goalProgressText) {
    goalProgressText.textContent = `${done} / ${target} completed this week`;
  }
}

function toCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function exportLeadToCsv(item) {
  const columns = [
    "id",
    "employer_name",
    "employer_role",
    "company_name",
    "company_domain",
    "employer_email",
    "employer_location",
    "lead_score",
    "sector",
    "status",
    "notifications_enabled",
    "created_at",
  ];
  const row = [
    item.id,
    item.employer_name,
    item.employer_role,
    item.company_name,
    item.company_domain,
    item.employer_email,
    item.employer_location,
    item.lead_score,
    item.sector || inferCompanySector(item),
    leadStatusFor(item),
    isLeadNotificationOn(item) ? "true" : "false",
    item.created_at,
  ];
  const csv = `${columns.join(",")}\n${row.map(toCsvValue).join(",")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const safeName = `${item.employer_name || "lead"}-${item.company_name || "company"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  anchor.download = `${safeName || "saved-lead"}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildLeadRecordFromEmployee(employee, company) {
  return {
    id: employee.id || `${(company.name || "company").toLowerCase()}-${(employee.firstName || "lead").toLowerCase()}`,
    employer_name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
    employer_role: employee.role || "",
    company_name: company.name || "",
    company_domain: buildCompanyDomain(company),
    employer_email: employee.email || "",
    employer_location: employee.location || "",
    lead_score: employee.valuableLeadScore || 0,
    sector: inferCompanySector({ company_name: company.name, company_domain: company.domain }),
    created_at: new Date().toISOString(),
  };
}

function openRemoveModal(item, key) {
  pendingRemoveLead = { item, key };
  if (removeModalSubtitle) {
    removeModalSubtitle.textContent = `${item.employer_name} · ${item.employer_role} at ${item.company_name}`;
  }
  removeModal?.classList.remove("hidden");
}

function closeRemoveModal() {
  pendingRemoveLead = null;
  removeModal?.classList.add("hidden");
}

async function loadSavedLeads() {
  if (!savedLeadsList) return;
  savedLeadsList.innerHTML = "";
  try {
    const response = await fetch("/api/user/saved-employers");
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    lastLoadedSavedLeads = rawItems.map((item) => ({ ...item, sector: inferCompanySector(item) }));
    updateGoalProgress(lastLoadedSavedLeads);
    const items = rawItems
      .map((item) => ({ ...item, sector: inferCompanySector(item) }))
      .filter((item) => activeSectorFilter === "All" || item.sector === activeSectorFilter);
    if (items.length === 0) {
      if (rawItems.length === 0) {
        lastLoadedSavedLeads = [];
        updateGoalProgress([]);
      }
      const empty = document.createElement("li");
      empty.className = "saved-lead-item";
      empty.innerHTML = `<p class="saved-lead-meta">No saved leads for this sector yet.</p>`;
      savedLeadsList.appendChild(empty);
      showSavedLeadsStatus("");
      return;
    }
    const notifyMasterOn = notificationsEnabled();
    items.forEach((item) => {
      const row = document.createElement("li");
      row.className = "saved-lead-item";
      const notifyOn = notifyMasterOn && isLeadNotificationOn(item);
    const key = leadNotificationKey(item);
      const status = leadStatusFor(item);
      const alert = leadAlertForScore(item.lead_score);
      row.innerHTML = `
        <div class="saved-lead-item-head">
          <p class="saved-lead-title">
            <span class="saved-lead-alert saved-lead-alert-${alert.tier}" title="${alert.label}">${alert.badge}</span>
            ${item.employer_name} · ${item.employer_role}
          </p>
          <div class="saved-lead-actions-right">
            <button type="button" class="saved-lead-notify ${notifyOn ? "is-on" : ""}" data-lead-key="${key}" ${notifyMasterOn ? "" : "disabled"}>
              ${notifyOn ? "Notify On" : "Notify Off"}
            </button>
            <button type="button" class="saved-lead-export" data-lead-id="${item.id || ""}">Export CSV</button>
            <button
              type="button"
              class="saved-lead-delete"
              data-delete-lead="${key}"
              data-lead-id="${item.id || ""}"
              data-employer-name="${item.employer_name || ""}"
              data-employer-role="${item.employer_role || ""}"
              data-company-name="${item.company_name || ""}"
            >
              Remove
            </button>
          </div>
        </div>
        <p class="saved-lead-meta">${item.company_name} · score ${item.lead_score}</p>
        <div class="saved-lead-controls">
          <span class="saved-lead-sector">${item.sector}</span>
          <div class="saved-lead-status-chips" role="group" aria-label="Lead status">
            <button type="button" class="saved-lead-status-chip ${status === "hot" ? "is-active" : ""}" data-lead-key="${key}" data-status="hot" aria-pressed="${status === "hot"}">Hot</button>
            <button type="button" class="saved-lead-status-chip ${status === "follow-up" ? "is-active" : ""}" data-lead-key="${key}" data-status="follow-up" aria-pressed="${status === "follow-up"}">Follow-up</button>
            <button type="button" class="saved-lead-status-chip ${status === "cv" ? "is-active" : ""}" data-lead-key="${key}" data-status="cv" aria-pressed="${status === "cv"}">CV</button>
          </div>
        </div>
      `;
      savedLeadsList.appendChild(row);
    });
    if (!notifyMasterOn) {
      showSavedLeadsStatus("Notifications are paused. Turn them on to receive interview-open alerts.");
    } else {
      showSavedLeadsStatus("");
    }
  } catch {
    lastLoadedSavedLeads = [];
    updateGoalProgress([]);
    const error = document.createElement("li");
    error.className = "saved-lead-item";
    error.innerHTML = `<p class="saved-lead-meta">Could not load saved leads.</p>`;
    savedLeadsList.appendChild(error);
    showSavedLeadsStatus("Could not refresh saved leads right now.");
  }
}

function setMainView(view) {
  activeMainView = view === "dashboard" ? "dashboard" : "home";
  homeView?.classList.toggle("hidden", activeMainView !== "home");
  dashboardView?.classList.toggle("hidden", activeMainView !== "dashboard");
  dashboardToggleButton?.classList.toggle("is-active", activeMainView === "dashboard");
  if (dashboardToggleButton) {
    dashboardToggleButton.textContent = activeMainView === "dashboard" ? "Home" : "Saved Leads";
  }
  if (activeMainView === "dashboard") {
    void loadSavedLeads();
  }
}

function isFavorite(employeeId) {
  return Boolean(favoritesMap()[employeeId]);
}

function updateFavoriteButton(employee) {
  if (!employee) {
    favoriteButton.classList.remove("is-favorite");
    favoriteButton.textContent = "Add to Favorites";
    return;
  }
  if (isFavorite(employee.id)) {
    favoriteButton.classList.add("is-favorite");
    favoriteButton.textContent = "Saved to Favorites";
  } else {
    favoriteButton.classList.remove("is-favorite");
    favoriteButton.textContent = "Add to Favorites";
  }
}

function renderEmployeeCard(employee, company) {
  selectedEmployee = employee;
  employeeCardCompanyLogo.src = company.logo_url || brandfetchLogoUrl(company.domain);
  employeeCardCompanyName.textContent = company.name;
  employeeCardFirstName.textContent = employee.firstName;
  employeeCardLastName.textContent = employee.lastName;
  employeeCardEmail.textContent = employee.email;
  employeeCardRole.textContent = employee.role;
  employeeCardCompany.textContent = company.name;
  employeeCardLocation.textContent = employee.location;
  updateFavoriteButton(employee);
  employeeCard.classList.remove("hidden");
}

function renderEmployeeRows(company) {
  employeeList.innerHTML = "";
  currentEmployees = (companyInsights.employees || []).map((employee) => ({
    id: employee.id,
    firstName: employee.first_name,
    lastName: employee.last_name,
    role: employee.role,
    email: employee.email,
    location: employee.location,
    departmentRisePercent: employee.department_rise_percent,
    interviewsHeldRecently: employee.interviews_held_recently,
    contactLikelihoodPercent: employee.contact_likelihood_percent,
    valuableLeadScore: employee.valuable_lead_score,
    outreachWindow: employee.outreach_window,
    openForInterviewsCount: employee.open_for_interviews_count,
    interestedIn: employee.interested_in,
    pathwayReason: employee.pathway_reason,
  }));
  if (currentEmployees.length === 0) {
    currentEmployees = employeeMocks(company.name);
  }
  currentEmployees.forEach((employee, index) => {
    const row = document.createElement("li");
    row.className = "employee-row";
    row.dataset.index = String(index);
    row.innerHTML = `
      <input class="employee-checkbox" type="checkbox" />
      <div>
        <p class="employee-name">${employee.firstName} ${employee.lastName}<span class="employee-role">| ${employee.role}</span></p>
        <p class="employee-email">${employee.email}</p>
      </div>
    `;
    employeeList.appendChild(row);
  });
}

function buildValuableLeadInsights(company) {
  const blockedManagerRoles = /(ceo|cto|tech manager|vp|chief|founder|head of engineering)/i;
  const chosen = currentEmployees
    .filter((employee) => !blockedManagerRoles.test(employee.role || ""))
    .sort((a, b) => (b.valuableLeadScore || 0) - (a.valuableLeadScore || 0))
    .slice(0, 3);
  return chosen.map((employee, index) => {
    const interviews = employee.openForInterviewsCount ?? (1 + (index % 2));
    const score = employee.valuableLeadScore ?? Math.min(95, 64 + index * 6);
    const outreachWindow = employee.outreachWindow ?? (index % 2 === 0 ? "Best in next 7 days" : "Strong this month");
    return {
      employee,
      interviews,
      score,
      outreachWindow,
      pathwayReason:
        employee.pathwayReason ||
        "Collaborates across product and talent teams, making them a practical intro point into the company.",
      interestedIn:
        employee.interestedIn || "high-upside technical startups that solve concrete operational problems",
    };
  });
}

function renderValuableLeads(company) {
  const insights = buildValuableLeadInsights(company);
  valuableLeadsPanel.innerHTML = "";
  const readiness = companyInsights.collaboration_readiness || null;
  if (readiness) {
    const channels = Array.isArray(readiness.channels) ? readiness.channels : [];
    const readinessCard = document.createElement("article");
    readinessCard.className = "lead-readiness-card";
    readinessCard.innerHTML = `
      <p class="lead-readiness-title">Collaboration readiness: ${readiness.score || "Medium"}</p>
      <p class="lead-role">${readiness.note || ""}</p>
      <p class="lead-role"><strong>Best channels:</strong> ${channels.join(" · ")}</p>
    `;
    valuableLeadsPanel.appendChild(readinessCard);
  }
  if (insights.length === 0) {
    const empty = document.createElement("p");
    empty.className = "lead-role";
    empty.textContent = "No suitable pathway contacts found yet for this company.";
    valuableLeadsPanel.appendChild(empty);
    return;
  }
  insights.forEach((item) => {
    const card = document.createElement("article");
    card.className = "lead-insight-card";
    card.innerHTML = `
      <div class="lead-insight-header">
        <div>
          <p class="lead-person">${item.employee.firstName} ${item.employee.lastName}</p>
          <p class="lead-role">${item.employee.role}</p>
        </div>
        <span class="lead-score">Lead score ${item.score}/100</span>
      </div>
      <div class="lead-metrics">
        <div class="lead-metric">
          <p class="lead-metric-label">Is open for</p>
          <p class="lead-metric-value">${item.interviews} interview${item.interviews === 1 ? "" : "s"}</p>
        </div>
        <div class="lead-metric">
          <p class="lead-metric-label">Outreach window</p>
          <p class="lead-metric-value">${item.outreachWindow}</p>
        </div>
      </div>
      <p class="lead-role"><strong>Why this is a pathway:</strong> ${item.pathwayReason}</p>
      <p class="lead-role"><strong>Usually interested in:</strong> ${item.interestedIn}</p>
      <div class="lead-actions">
        <button type="button" class="lead-action-btn lead-action-save" data-employee-id="${item.employee.id}">Add to Favorites</button>
        <button type="button" class="lead-action-btn lead-action-export" data-employee-id="${item.employee.id}">Export CSV</button>
      </div>
    `;
    valuableLeadsPanel.appendChild(card);
  });
}

function renderAddresses(company) {
  addressesPanel.innerHTML = "";
  const domain = buildCompanyDomain(company);
  const rows = [
    { title: "Hiring mailbox", value: `careers@${domain}` },
    { title: "Partnerships mailbox", value: `partnerships@${domain}` },
    { title: "Talent outreach", value: `talent@${domain}` },
    { title: "Main domain", value: domain },
  ];
  const terminations = (companyInsights.email_terminations || []).map((item) => ({
    title: "E-mail termination",
    value: item,
  }));
  const mergedRows = [...rows, ...terminations];
  mergedRows.forEach((row) => {
    const item = document.createElement("article");
    item.className = "address-row";
    item.innerHTML = `
      <p class="address-title">${row.title}</p>
      <p class="address-value">${row.value}</p>
    `;
    addressesPanel.appendChild(item);
  });
}

function setEmployeeView(view) {
  activeEmployeeView = view;
  employeeTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });

  employeeList.classList.toggle("hidden", view !== "people");
  valuableLeadsPanel.classList.toggle("hidden", view !== "valuable");
  addressesPanel.classList.toggle("hidden", view !== "addresses");
  employeeCard.classList.toggle("hidden", view !== "people" || !selectedEmployee);

  if (!selectedCompany) return;
  if (view === "valuable") renderValuableLeads(selectedCompany);
  if (view === "addresses") renderAddresses(selectedCompany);
}

function companyKey(company) {
  return `${company.name}|${company.domain || ""}`;
}

async function toggleCompanyCard(company) {
  const key = companyKey(company);
  if (selectedCompanyKey === key) {
    selectedCompanyKey = null;
    selectedCompany = null;
    companyCard.classList.add("hidden");
    employeeCard.classList.add("hidden");
    return;
  }

  selectedCompanyKey = key;
  selectedCompany = company;
  selectedCompanyLogo.src = company.logo_url || brandfetchLogoUrl(company.domain);
  selectedCompanyLogo.alt = `${company.name} logo`;
  selectedCompanyName.textContent = company.name;
  selectedCompanyDetails.textContent = [company.domain, company.country, company.source].filter(Boolean).join(" • ");
  try {
    companyInsights = await fetchCompanyInsights(company);
  } catch {
    companyInsights = { employees: [], email_terminations: [] };
  }
  renderEmployeeRows(company);
  renderValuableLeads(company);
  renderAddresses(company);
  setEmployeeView(activeEmployeeView);
  employeeCard.classList.add("hidden");
  companyCard.classList.remove("hidden");
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
suggestions.addEventListener("click", (event) => {
  const row = event.target.closest(".suggestion-item");
  if (!row) return;
  const index = Number(row.dataset.index);
  const company = currentSuggestions[index];
  if (!company) return;
  void toggleCompanyCard(company);
});
employeeList.addEventListener("click", (event) => {
  const row = event.target.closest(".employee-row");
  if (!row || !selectedCompany) return;
  if (activeEmployeeView !== "people") return;
  const index = Number(row.dataset.index);
  const employee = currentEmployees[index];
  if (!employee) return;
  renderEmployeeCard(employee, selectedCompany);
});
employeeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const view = tab.dataset.view || "people";
    setEmployeeView(view);
  });
});
favoriteButton?.addEventListener("click", async () => {
  if (!selectedEmployee || !selectedCompany) return;
  let savedToServer = false;
  try {
    savedToServer = await saveFavoriteToServer(selectedEmployee, selectedCompany);
  } catch {
    savedToServer = false;
  }
  if (!savedToServer) {
    // Fallback for users not logged in yet.
    saveFavorite(selectedEmployee, selectedCompany);
  } else {
    // Keep local visual state in sync with successful server save.
    saveFavorite(selectedEmployee, selectedCompany);
  }
  if (savedToServer) {
    void loadSavedLeads();
  }
  updateFavoriteButton(selectedEmployee);
  favoriteButton.classList.add("favorite-flash");
  setTimeout(() => {
    favoriteButton.classList.remove("favorite-flash");
  }, 450);
});
refreshSavedLeadsButton?.addEventListener("click", () => {
  void loadSavedLeads();
});
dashboardToggleButton?.addEventListener("click", () => {
  const nextView = activeMainView === "home" ? "dashboard" : "home";
  setMainView(nextView);
});
notificationsToggleButton?.addEventListener("click", () => {
  const next = !notificationsEnabled();
  setNotificationsEnabled(next);
  void loadSavedLeads();
});
resetSavedLeadsButton?.addEventListener("click", async () => {
  const confirmed = window.confirm("Reset saved leads list? This will remove all saved leads for your account.");
  if (!confirmed) return;
  const ok = await clearSavedLeadsOnServer().catch(() => false);
  if (!ok) {
    showSavedLeadsStatus("Could not reset list right now.");
    return;
  }
  saveLeadNotificationsMap({});
  showSavedLeadsStatus("Saved leads list was reset.");
  void loadSavedLeads();
});
savedLeadsList?.addEventListener("click", (event) => {
  const exportButton = event.target.closest(".saved-lead-export");
  if (exportButton) {
    const leadId = exportButton.dataset.leadId || "";
    if (!leadId) return;
    const item = lastLoadedSavedLeads.find((lead) => lead.id === leadId);
    if (!item) return;
    exportLeadToCsv(item);
    showSavedLeadsStatus("Lead exported to CSV.");
    return;
  }

  const deleteButton = event.target.closest(".saved-lead-delete");
  if (deleteButton) {
    const key = deleteButton.dataset.deleteLead || "";
    const id = deleteButton.dataset.leadId || "";
    const employer_name = deleteButton.dataset.employerName || "";
    const employer_role = deleteButton.dataset.employerRole || "";
    const company_name = deleteButton.dataset.companyName || "";
    if (!key || !id) return;
    openRemoveModal({ id, company_name, employer_name, employer_role }, key);
    return;
  }

  const statusChip = event.target.closest(".saved-lead-status-chip");
  if (statusChip) {
    const key = statusChip.dataset.leadKey || "";
    const nextStatus = statusChip.dataset.status || "hot";
    if (!key) return;
    const map = leadStatusMap();
    map[key] = nextStatus;
    saveLeadStatusMap(map);

    const group = statusChip.closest(".saved-lead-status-chips");
    if (!group) return;
    const chips = group.querySelectorAll(".saved-lead-status-chip");
    chips.forEach((chip) => {
      const active = chip === statusChip;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
    return;
  }

  const button = event.target.closest(".saved-lead-notify");
  if (!button) return;
  const key = button.dataset.leadKey || "";
  if (!key) return;
  const map = leadNotificationsMap();
  const next = !Boolean(map[key]);
  map[key] = next;
  saveLeadNotificationsMap(map);
  button.classList.toggle("is-on", next);
  button.textContent = next ? "Notify On" : "Notify Off";
});
valuableLeadsPanel?.addEventListener("click", (event) => {
  const actionButton = event.target.closest(".lead-action-btn");
  if (!actionButton || !selectedCompany) return;
  const employeeId = actionButton.dataset.employeeId || "";
  const employee = currentEmployees.find((item) => item.id === employeeId);
  if (!employee) return;
  const leadRecord = buildLeadRecordFromEmployee(employee, selectedCompany);

  if (actionButton.classList.contains("lead-action-export")) {
    exportLeadToCsv(leadRecord);
    showSavedLeadsStatus("Valuable lead exported to CSV.");
    return;
  }

  if (actionButton.classList.contains("lead-action-save")) {
    void (async () => {
      let savedToServer = false;
      try {
        savedToServer = await saveFavoriteToServer(employee, selectedCompany);
      } catch {
        savedToServer = false;
      }
      saveFavorite(employee, selectedCompany);
      showSavedLeadsStatus(savedToServer ? "Lead added to favorites." : "Lead saved locally (not authenticated on backend).");
      updateFavoriteButton(selectedEmployee);
      if (savedToServer && activeMainView === "dashboard") {
        await loadSavedLeads();
      }
    })();
  }
});
cancelRemoveLeadButton?.addEventListener("click", () => {
  closeRemoveModal();
});
removeModal?.addEventListener("click", (event) => {
  if (event.target === removeModal) closeRemoveModal();
});
confirmRemoveLeadButton?.addEventListener("click", () => {
  if (!pendingRemoveLead) return;
  const { item, key } = pendingRemoveLead;
  closeRemoveModal();
  void (async () => {
    const ok = await deleteSavedLeadOnServer(item).catch(() => false);
    if (!ok) {
      showSavedLeadsStatus("Could not remove lead right now.");
      return;
    }
    const notifications = leadNotificationsMap();
    const statuses = leadStatusMap();
    delete notifications[key];
    delete statuses[key];
    saveLeadNotificationsMap(notifications);
    saveLeadStatusMap(statuses);
    showSavedLeadsStatus("Lead removed.");
    await loadSavedLeads();
  })();
});
saveGoalTargetButton?.addEventListener("click", () => {
  saveGoalTarget();
  showSavedLeadsStatus("Goal target saved.");
});
sectorFilters?.addEventListener("click", (event) => {
  const chip = event.target.closest(".sector-filter-chip");
  if (!chip) return;
  const next = chip.dataset.sector || "All";
  activeSectorFilter = LEAD_SECTORS.includes(next) ? next : "All";
  renderSectorFilters();
  void loadSavedLeads();
});
contrastToggleButton?.addEventListener("click", toggleContrast);
themeToggle?.addEventListener("click", toggleTheme);
showRegisterButton?.addEventListener("click", () => setAuthTab("register"));
showLoginButton?.addEventListener("click", () => setAuthTab("login"));
registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const displayName = document.getElementById("register-name")?.value?.trim() || "";
  const email = document.getElementById("register-email")?.value?.trim() || "";
  const password = document.getElementById("register-password")?.value || "";
  const registerRes = await authRequest("/api/auth/register", {
    display_name: displayName,
    email,
    password,
  });
  if (!registerRes.ok) {
    if (authMessage) authMessage.textContent = registerRes.data?.error || "Registration failed.";
    return;
  }
  const loginRes = await authRequest("/api/auth/login", { email, password });
  if (!loginRes.ok) {
    if (authMessage) authMessage.textContent = "Account created, but sign-in failed.";
    return;
  }
  currentUserEmail = email || "guest";
  loadGoalTarget();
  showAppShell();
});
loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("login-email")?.value?.trim() || "";
  const password = document.getElementById("login-password")?.value || "";
  const loginRes = await authRequest("/api/auth/login", { email, password });
  if (!loginRes.ok) {
    if (authMessage) authMessage.textContent = loginRes.data?.error || "Sign in failed.";
    return;
  }
  currentUserEmail = email || "guest";
  loadGoalTarget();
  showAppShell();
});
logoutButton?.addEventListener("click", async () => {
  await authRequest("/api/auth/logout", {});
  currentUserEmail = "guest";
  loadGoalTarget();
  showAuthScreen();
});
applyTheme(getInitialTheme());
applyContrastPreset(getInitialContrast());
renderSectorFilters();
updateNotificationsToggleButton();
loadGoalTarget();
if (!localStorage.getItem(LEADS_NOTIFICATIONS_ENABLED_KEY)) {
  setNotificationsEnabled(false);
}
setAuthTab("register");
showAuthScreen();
void resolveSession();
