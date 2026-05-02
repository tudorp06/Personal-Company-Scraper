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
const profileToggleButton = document.getElementById("profile-toggle");
const homeView = document.getElementById("home-view");
const dashboardView = document.getElementById("dashboard-view");
const profileView = document.getElementById("profile-view");
const savedLeadsList = document.getElementById("saved-leads-list");
const refreshSavedLeadsButton = document.getElementById("refresh-saved-leads");
const notificationsToggleButton = document.getElementById("notifications-toggle");
const testNotificationButton = document.getElementById("test-notification-button");
const notificationBellButton = document.getElementById("notification-bell");
const notificationBellCount = document.getElementById("notification-bell-count");
const notificationPanel = document.getElementById("notification-panel");
const notificationList = document.getElementById("notification-list");
const notificationEmpty = document.getElementById("notification-empty");
const notificationMarkAllButton = document.getElementById("notification-mark-all");
const boosterToastStack = document.getElementById("booster-toast-stack");
const resetSavedLeadsButton = document.getElementById("reset-saved-leads");
const savedLeadsStatus = document.getElementById("saved-leads-status");
const sectorFilters = document.getElementById("sector-filters");
const dashboardPreferencesSummary = document.getElementById("dashboard-preferences-summary");
const removeModal = document.getElementById("remove-modal");
const removeModalSubtitle = document.getElementById("remove-modal-subtitle");
const cancelRemoveLeadButton = document.getElementById("cancel-remove-lead");
const confirmRemoveLeadButton = document.getElementById("confirm-remove-lead");
const goalTargetInput = document.getElementById("goal-target-input");
const saveGoalTargetButton = document.getElementById("save-goal-target");
const goalProgressText = document.getElementById("goal-progress-text");
const profileDisplayName = document.getElementById("profile-display-name");
const profileEmail = document.getElementById("profile-email");
const profileRole = document.getElementById("profile-role");
const profileHeadlineInput = document.getElementById("profile-headline");
const profileCvTextInput = document.getElementById("profile-cv-text");
const profileTargetSectorsInput = document.getElementById("profile-target-sectors");
const profileTargetCompanySizeInput = document.getElementById("profile-target-company-size");
const profileTargetCountriesInput = document.getElementById("profile-target-countries");
const profileTargetWorkModeInput = document.getElementById("profile-target-work-mode");
const savePreferencesButton = document.getElementById("save-preferences-button");
const profilePreferencesPreview = document.getElementById("profile-preferences-preview");
const saveProfileButton = document.getElementById("save-profile-button");
const profileHeadlinePreview = document.getElementById("profile-headline-preview");
const profileCvPreview = document.getElementById("profile-cv-preview");
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
const employeeCardRoleIcon = document.getElementById("employee-card-role-icon");
const employeeCardRoleBadge = document.getElementById("employee-card-role-badge");
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
const outreachPlanPanel = document.getElementById("outreach-plan-panel");
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
let leadNotesById = {};
let leadNotifications = [];
let notificationPanelOpen = false;
let shownToastNotificationIds = {};
let lastNotificationStatusMessage = "";
let notificationPollTimer = null;
let userPreferences = {
  target_sectors: "",
  target_company_size: "",
  target_countries: "",
  target_work_mode: "",
};
const THEME_STORAGE_KEY = "ui_theme_preference";
const CONTRAST_STORAGE_KEY = "ui_contrast_preference";
const FAVORITES_STORAGE_KEY = "favorite_employees";
const LEADS_NOTIFICATIONS_ENABLED_KEY = "leads_notifications_enabled";
const LEADS_NOTIFICATIONS_MAP_KEY = "leads_notifications_map";
const LEADS_STATUS_MAP_KEY = "leads_status_map";
const BOOSTER_TOAST_LIMIT = 2;
const BRANDFETCH_CLIENT_ID = "1id6iCSRkbc4cqe2MBu";
const LEAD_SECTORS = ["All", "BigTech", "Tech", "Economics", "Properties", "CyberSec", "Graphic Design"];
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

async function fetchUserProfile() {
  const response = await fetch("/api/user/profile");
  if (!response.ok) throw new Error(`Profile failed with ${response.status}`);
  return response.json();
}

async function saveUserProfile(headline, cvText) {
  const response = await fetch("/api/user/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      headline: headline || "",
      cv_text: cvText || "",
      target_sectors: profileTargetSectorsInput?.value || "",
      target_company_size: profileTargetCompanySizeInput?.value || "",
      target_countries: profileTargetCountriesInput?.value || "",
      target_work_mode: profileTargetWorkModeInput?.value || "",
    }),
  });
  if (!response.ok) throw new Error(`Profile save failed with ${response.status}`);
  return response.json();
}

async function fetchLeadNotes() {
  const response = await fetch("/api/user/lead-notes");
  if (!response.ok) throw new Error(`Lead notes failed with ${response.status}`);
  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];
  const map = {};
  items.forEach((item) => {
    if (item.saved_employer_id) {
      map[item.saved_employer_id] = item.note_text || "";
    }
  });
  return map;
}

async function saveLeadNote(savedEmployerId, noteText) {
  const response = await fetch("/api/user/lead-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      saved_employer_id: savedEmployerId || "",
      note_text: noteText || "",
    }),
  });
  return response.ok;
}

async function fetchLeadStatuses() {
  const response = await fetch("/api/user/lead-status");
  if (!response.ok) throw new Error(`Lead status failed with ${response.status}`);
  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];
  const map = {};
  items.forEach((item) => {
    if (item.saved_employer_id) {
      const status = String(item.lead_status || "").trim().toLowerCase();
      map[item.saved_employer_id] = ["hot", "follow-up", "cv"].includes(status) ? status : "hot";
    }
  });
  return map;
}

async function saveLeadStatus(savedEmployerId, leadStatus) {
  const safeStatus = ["hot", "follow-up", "cv"].includes(leadStatus) ? leadStatus : "hot";
  const response = await fetch("/api/user/lead-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      saved_employer_id: savedEmployerId || "",
      lead_status: safeStatus,
    }),
  });
  return response.ok;
}

async function fetchLeadNotifications(options = {}) {
  const params = new URLSearchParams({
    limit: String(options.limit || 20),
    unread_only: options.unreadOnly ? "1" : "0",
    simulate: options.simulate === false ? "0" : "1",
  });
  const response = await fetch(`/api/user/lead-notifications?${params.toString()}`);
  if (!response.ok) throw new Error(`Lead notifications failed with ${response.status}`);
  return response.json();
}

async function markAllLeadNotificationsRead() {
  const response = await fetch("/api/user/lead-notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mark_all: true }),
  });
  return response.ok;
}

async function createTestLeadNotification() {
  const response = await fetch("/api/user/lead-notifications/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data: payload };
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
    void loadUserPreferencesOnly();
    void refreshNotifications({ limit: 20, unreadOnly: false, simulate: true });
    startNotificationPolling();
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

function updateNotificationBell(unreadCount) {
  if (!notificationBellCount || !notificationBellButton) return;
  const safeCount = Math.max(0, Number(unreadCount) || 0);
  notificationBellButton.classList.toggle("has-unread", safeCount > 0);
  notificationBellCount.textContent = safeCount > 99 ? "99+" : String(safeCount);
  notificationBellCount.classList.toggle("hidden", safeCount <= 0);
}

function formatNotificationTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveNotificationLogoUrl(notification) {
  if (!notification || typeof notification !== "object") return "";
  const directLogo = String(notification.company_logo || "").trim();
  if (directLogo) return directLogo;

  const savedEmployerId = String(notification.saved_employer_id || "").trim();
  if (savedEmployerId) {
    const savedLead = (lastLoadedSavedLeads || []).find((item) => String(item?.id || "").trim() === savedEmployerId);
    if (savedLead) {
      const savedLeadLogo = String(savedLead.company_logo || "").trim();
      if (savedLeadLogo) return savedLeadLogo;
      const savedLeadDomain = String(savedLead.company_domain || "").trim();
      if (savedLeadDomain) return brandfetchLogoUrl(savedLeadDomain);
    }
  }

  const domain = String(notification.company_domain || "").trim();
  if (domain) return brandfetchLogoUrl(domain);
  return "";
}

function notificationLogoMarkup(notification, companyName) {
  const safeCompany = String(companyName || "Company").trim() || "Company";
  const safeName = escapeHtml(safeCompany);
  const safeUrl = escapeHtml(resolveNotificationLogoUrl(notification));
  const fallbackIconMarkup = `
    <span class="notification-company-logo notification-company-logo-fallback" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M4 21h16v-2H4v2Zm2-3h4V5H6v13Zm8 0h4V9h-4v9ZM11 18h2v-6h-2v6Zm0-8h2V7h-2v3Z"></path>
      </svg>
    </span>
  `;
  if (safeUrl) {
    return `
      <span class="notification-company-logo-wrap">
        <img
          class="notification-company-logo"
          src="${safeUrl}"
          alt="${safeName} logo"
          loading="lazy"
          onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='inline-flex';"
        />
        <span class="notification-company-logo notification-company-logo-fallback" aria-hidden="true" style="display:none;">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M4 21h16v-2H4v2Zm2-3h4V5H6v13Zm8 0h4V9h-4v9ZM11 18h2v-6h-2v6Zm0-8h2V7h-2v3Z"></path>
          </svg>
        </span>
      </span>
    `;
  }
  return fallbackIconMarkup;
}

function renderNotificationPanel() {
  if (!notificationList || !notificationEmpty || !notificationMarkAllButton) return;
  notificationList.innerHTML = "";
  const items = Array.isArray(leadNotifications) ? leadNotifications : [];
  notificationEmpty.classList.toggle("hidden", items.length > 0);
  items.slice(0, 12).forEach((item) => {
    const row = document.createElement("li");
    const isUnread = !item.is_read;
    const companyName = item.company_name || "Company";
    const safeCompanyName = escapeHtml(companyName);
    const safeEmployerName = escapeHtml(item.employer_name || "Lead");
    row.className = `notification-item ${isUnread ? "is-unread" : ""}`;
    row.innerHTML = `
      <p class="notification-item-title">${item.title || "Lead update"}</p>
      <p class="notification-item-meta">
        <span class="notification-company-text">${safeCompanyName}</span>
        ${notificationLogoMarkup(item, companyName)}
      </p>
      <p class="notification-item-employer">${safeEmployerName}</p>
      <p class="notification-item-reason">${item.reason || "Positive update received."}</p>
      <p class="notification-item-time">${formatNotificationTime(item.created_at)}</p>
    `;
    notificationList.appendChild(row);
  });
  const unreadCount = items.filter((item) => !item.is_read).length;
  notificationMarkAllButton.disabled = unreadCount === 0;
}

function setNotificationPanelOpen(open) {
  notificationPanelOpen = Boolean(open);
  notificationPanel?.classList.toggle("hidden", !notificationPanelOpen);
  notificationBellButton?.setAttribute("aria-expanded", notificationPanelOpen ? "true" : "false");
}

async function refreshNotifications(options = {}) {
  await loadLeadNotifications(options);
  if (notificationPanelOpen) renderNotificationPanel();
}

function dismissToastCard(toast) {
  if (!toast) return;
  toast.classList.add("is-exit");
  setTimeout(() => toast.remove(), 230);
}

function renderBoosterToast(notification) {
  if (!boosterToastStack) return;
  if (!notificationsEnabled()) return;
  const existingCount = boosterToastStack.querySelectorAll(".booster-toast-card").length;
  if (existingCount >= BOOSTER_TOAST_LIMIT) return;

  const toast = document.createElement("article");
  toast.className = "booster-toast-card";
  toast.dataset.notificationId = notification.id || "";
  const companyName = notification.company_name || "Company";
  const safeCompanyName = escapeHtml(companyName);
  const safeEmployerName = escapeHtml(notification.employer_name || "Lead");
  toast.innerHTML = `
    <p class="booster-toast-title">${notification.title || "Lead update"}</p>
    <p class="booster-toast-company">
      <span class="notification-company-text">${safeCompanyName}</span>
      ${notificationLogoMarkup(notification, companyName)}
    </p>
    <p class="booster-toast-employer">${safeEmployerName}</p>
    <p class="booster-toast-reason">${notification.reason || "Positive update received"}</p>
    <p class="booster-toast-cta">${notification.cta_text || "Great time to follow up"}</p>
  `;
  boosterToastStack.appendChild(toast);
  setTimeout(() => dismissToastCard(toast), 5200);
}

async function loadLeadNotifications(options = {}) {
  try {
    const payload = await fetchLeadNotifications(options);
    const items = Array.isArray(payload.items) ? payload.items : [];
    const forceToastIds = new Set(Array.isArray(options.forceToastIds) ? options.forceToastIds : []);
    leadNotifications = items;
    const unreadCount = Math.max(0, Number(payload.unread_count) || 0);
    updateNotificationBell(unreadCount);
    items.forEach((item) => {
      const notificationId = item.id || "";
      if (!notificationId || item.is_read) return;
      const shouldForceToast = forceToastIds.has(notificationId);
      if (shownToastNotificationIds[notificationId] && !shouldForceToast) return;
      shownToastNotificationIds[notificationId] = true;
      renderBoosterToast(item);
    });
    const statusMessage = typeof payload.status_message === "string" ? payload.status_message.trim() : "";
    if (statusMessage && unreadCount === 0 && notificationsEnabled()) {
      if (statusMessage !== lastNotificationStatusMessage) {
        showSavedLeadsStatus(statusMessage);
        lastNotificationStatusMessage = statusMessage;
      }
    } else if (unreadCount > 0) {
      lastNotificationStatusMessage = "";
    }
  } catch {
    // Keep current bell state on transient failures.
  }
}

function stopNotificationPolling() {
  if (notificationPollTimer) {
    clearInterval(notificationPollTimer);
    notificationPollTimer = null;
  }
}

function startNotificationPolling() {
  stopNotificationPolling();
  notificationPollTimer = setInterval(() => {
    void refreshNotifications({ limit: 20, unreadOnly: false, simulate: true });
  }, 45000);
}

function leadNotificationKey(item) {
  if (!item || typeof item !== "object") return "";
  const candidates = [
    item.id,
    item.saved_employer_id,
    item.savedEmployerId,
    item.company_name,
    item.company_domain,
    item.employer_name,
    item.employer_role,
    item.employer_email,
    item.created_at,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  if (candidates.length > 0) {
    return candidates.join("|");
  }
  return "";
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
    boosterToastStack?.querySelectorAll(".booster-toast-card").forEach((node) => node.remove());
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
  const status = map[leadNotificationKey(item)] || "hot";
  return ["hot", "follow-up", "cv"].includes(status) ? status : "hot";
}

function leadAlertForScore(scoreRaw) {
  const score = Number(scoreRaw) || 0;
  if (score >= 85) return { badge: "High", label: "High priority", tier: "high" };
  if (score >= 70) return { badge: "Medium", label: "Strong lead", tier: "mid" };
  return { badge: "Low", label: "Watch lead", tier: "low" };
}

function getSavedLeadId(item) {
  if (!item || typeof item !== "object") return "";
  const raw = item.id ?? item.saved_employer_id ?? item.savedEmployerId ?? "";
  return String(raw).trim();
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
    try {
      leadNotesById = await fetchLeadNotes();
    } catch {
      leadNotesById = {};
    }
    try {
      const serverStatuses = await fetchLeadStatuses();
      const statusMap = leadStatusMap();
      Object.keys(serverStatuses).forEach((leadId) => {
        statusMap[leadId] = serverStatuses[leadId];
      });
      saveLeadStatusMap(statusMap);
    } catch {
      // Keep local statuses if status API fails.
    }
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
    items.forEach((item, index) => {
      const row = document.createElement("li");
      row.className = "saved-lead-item";
      const notifyOn = notifyMasterOn && isLeadNotificationOn(item);
      const key = leadNotificationKey(item) || `lead-row-${index}`;
      const status = leadStatusFor(item);
      const alert = leadAlertForScore(item.lead_score);
      const leadId = getSavedLeadId(item);
      const savedNoteText = leadNotesById[leadId] || "";
      const trimmedSavedNoteText = savedNoteText.trim();
      const hasSavedNote = Boolean(trimmedSavedNoteText);
      row.innerHTML = `
        <div class="saved-lead-item-head">
          <p class="saved-lead-title">
            <span class="saved-lead-alert saved-lead-alert-${alert.tier}" title="${alert.label}">${alert.badge}</span>
            ${item.employer_name} · ${item.employer_role}
          </p>
          <div class="saved-lead-actions-right">
            <button type="button" class="saved-lead-action-button saved-lead-notify ${notifyOn ? "is-on" : ""}" data-lead-key="${key}" ${notifyMasterOn ? "" : "disabled"}>
              ${notifyOn ? "Notify On" : "Notify Off"}
            </button>
            <button type="button" class="saved-lead-action-button saved-lead-export" data-lead-id="${leadId}">Export CSV</button>
            <button
              type="button"
              class="saved-lead-action-button saved-lead-delete"
              data-delete-lead="${key}"
              data-lead-id="${leadId}"
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
        <div class="saved-lead-note-wrap ${hasSavedNote ? "is-display-mode" : "is-editor-mode"}" data-note-wrap-id="${leadId}">
          <label class="saved-lead-note-label" for="lead-note-${leadId || key}">Private note</label>
          <div class="saved-lead-note-editor">
            <textarea id="lead-note-${leadId || key}" class="saved-lead-note-input" data-note-lead-id="${leadId}" placeholder="Private note for this lead...">${savedNoteText}</textarea>
            <button type="button" class="saved-lead-note-save" data-note-save-id="${leadId}">Save Note</button>
          </div>
          <div class="saved-lead-note-display ${hasSavedNote ? "" : "hidden"}">
            <p class="saved-lead-note-preview ${hasSavedNote ? "" : "hidden"}" data-note-preview-id="${leadId}">
              Instruction: ${trimmedSavedNoteText}
            </p>
            <button type="button" class="saved-lead-note-edit" data-note-edit-id="${leadId}">Edit note</button>
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
  activeMainView = view === "dashboard" || view === "profile" ? view : "home";
  homeView?.classList.toggle("hidden", activeMainView !== "home");
  dashboardView?.classList.toggle("hidden", activeMainView !== "dashboard");
  profileView?.classList.toggle("hidden", activeMainView !== "profile");
  dashboardToggleButton?.classList.toggle("is-active", activeMainView === "dashboard");
  profileToggleButton?.classList.toggle("active", activeMainView === "profile");
  if (dashboardToggleButton) {
    dashboardToggleButton.textContent = activeMainView === "dashboard" ? "Home" : "Saved Leads";
  }
  if (activeMainView === "dashboard") {
    void loadSavedLeads();
    void refreshNotifications({ limit: 20, unreadOnly: false, simulate: true });
  }
  if (activeMainView === "profile") {
    void loadProfileView();
    void refreshNotifications({ limit: 20, unreadOnly: false, simulate: true });
  }
  if (activeMainView === "home") {
    void refreshNotifications({ limit: 20, unreadOnly: false, simulate: true });
  }
}

function refreshDashboardPreferencesSummary() {
  if (!dashboardPreferencesSummary) return;
  const sectors = userPreferences.target_sectors || "Any sectors";
  const companySize = userPreferences.target_company_size || "Any company size";
  const countries = userPreferences.target_countries || "Any country";
  const workMode = userPreferences.target_work_mode || "Any work mode";
  dashboardPreferencesSummary.textContent = `${sectors} · ${companySize} · ${countries} · ${workMode}`;
}

function refreshProfilePreferencesPreview() {
  if (!profilePreferencesPreview) return;
  const sectors = userPreferences.target_sectors || "Any sectors";
  const companySize = userPreferences.target_company_size || "Any company size";
  const countries = userPreferences.target_countries || "Any country";
  const workMode = userPreferences.target_work_mode || "Any work mode";
  profilePreferencesPreview.textContent = `Saved picks: ${sectors} · ${companySize} · ${countries} · ${workMode}`;
}

async function loadProfileView() {
  try {
    const payload = await fetchUserProfile();
    const user = payload?.user || {};
    const profile = payload?.profile || {};
    profileDisplayName.textContent = user.display_name || "";
    profileEmail.textContent = user.email || "";
    profileRole.textContent = user.role || "";
    profileHeadlineInput.value = profile.headline || "";
    profileCvTextInput.value = profile.cv_text || "";
    profileTargetSectorsInput.value = profile.target_sectors || "";
    profileTargetCompanySizeInput.value = profile.target_company_size || "";
    profileTargetCountriesInput.value = profile.target_countries || "";
    profileTargetWorkModeInput.value = profile.target_work_mode || "";
    userPreferences = {
      target_sectors: profile.target_sectors || "",
      target_company_size: profile.target_company_size || "",
      target_countries: profile.target_countries || "",
      target_work_mode: profile.target_work_mode || "",
    };
    refreshDashboardPreferencesSummary();
    refreshProfilePreferencesPreview();
    profileHeadlinePreview.textContent = profile.headline || "No headline yet.";
    profileCvPreview.textContent = profile.cv_text || "No CV saved yet.";
    showSavedLeadsStatus("");
  } catch {
    showSavedLeadsStatus("Could not load profile right now.");
  }
}

async function loadUserPreferencesOnly() {
  try {
    const payload = await fetchUserProfile();
    const profile = payload?.profile || {};
    userPreferences = {
      target_sectors: profile.target_sectors || "",
      target_company_size: profile.target_company_size || "",
      target_countries: profile.target_countries || "",
      target_work_mode: profile.target_work_mode || "",
    };
    refreshDashboardPreferencesSummary();
    refreshProfilePreferencesPreview();
  } catch {
    userPreferences = {
      target_sectors: "",
      target_company_size: "",
      target_countries: "",
      target_work_mode: "",
    };
    refreshDashboardPreferencesSummary();
    refreshProfilePreferencesPreview();
  }
}

function renderOutreachPlan(company) {
  if (!outreachPlanPanel) return;
  const readiness = companyInsights.collaboration_readiness || {};
  const preferredSectors = userPreferences.target_sectors || "your selected sectors";
  const channels = Array.isArray(readiness.channels) ? readiness.channels : ["Partner referrals", "Pilot programs"];
  const topLead = buildValuableLeadInsights(company)[0];
  const opener = topLead
    ? `${topLead.employee.firstName} ${topLead.employee.lastName} (${topLead.employee.role})`
    : "the strongest pathway contact";
  outreachPlanPanel.innerHTML = `
    <article class="lead-readiness-card outreach-plan-card">
      <p class="lead-readiness-title outreach-plan-title">Outreach Plan</p>
      <p class="outreach-plan-subtitle">A clear first-touch sequence for ${company.name}.</p>
      <div class="outreach-plan-steps">
        <p class="outreach-plan-row">
          <span class="outreach-plan-label">Best first path</span>
          <span class="outreach-plan-value">${opener}</span>
        </p>
        <p class="outreach-plan-row">
          <span class="outreach-plan-label">Message angle</span>
          <span class="outreach-plan-value">Show how your profile/startup fits ${preferredSectors} and aligns with ${company.name}'s current collaboration channels.</span>
        </p>
        <p class="outreach-plan-row">
          <span class="outreach-plan-label">Proof to attach</span>
          <span class="outreach-plan-value">CV, one relevant project/case study, and a concise integration idea.</span>
        </p>
        <p class="outreach-plan-row">
          <span class="outreach-plan-label">Preferred channels</span>
          <span class="outreach-plan-value">${channels.join(" · ")}</span>
        </p>
      </div>
      <div class="outreach-plan-note">
        <strong>Risk flag:</strong> if no response in 7 days, switch to an alternate lead and refine the pitch around concrete ROI.
      </div>
    </article>
  `;
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

function roleVisual(role) {
  const lower = String(role || "").toLowerCase();
  if (/(engineer|developer|platform|technical|solution)/.test(lower)) {
    return { icon: "⚙", label: "Engineering Path" };
  }
  if (/(partner|business development|accounts|ecosystem)/.test(lower)) {
    return { icon: "🤝", label: "Partnership Path" };
  }
  if (/(research|analytics|data)/.test(lower)) {
    return { icon: "📊", label: "Insight Path" };
  }
  if (/(product|program|operations)/.test(lower)) {
    return { icon: "🚀", label: "Execution Path" };
  }
  return { icon: "🧭", label: "Team Pathway" };
}

function renderEmployeeCard(employee, company) {
  selectedEmployee = employee;
  const roleInfo = roleVisual(employee.role);
  employeeCardCompanyLogo.src = company.logo_url || brandfetchLogoUrl(company.domain);
  employeeCardCompanyName.textContent = company.name;
  if (employeeCardRoleIcon) employeeCardRoleIcon.textContent = roleInfo.icon;
  if (employeeCardRoleBadge) employeeCardRoleBadge.textContent = roleInfo.label;
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
  outreachPlanPanel.classList.toggle("hidden", view !== "outreach");
  employeeCard.classList.toggle("hidden", view !== "people" || !selectedEmployee);

  if (!selectedCompany) return;
  if (view === "valuable") renderValuableLeads(selectedCompany);
  if (view === "addresses") renderAddresses(selectedCompany);
  if (view === "outreach") renderOutreachPlan(selectedCompany);
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
  const nextView = activeMainView === "dashboard" ? "home" : "dashboard";
  setMainView(nextView);
});
profileToggleButton?.addEventListener("click", () => {
  const nextView = activeMainView === "profile" ? "home" : "profile";
  setMainView(nextView);
});
notificationsToggleButton?.addEventListener("click", () => {
  const next = !notificationsEnabled();
  setNotificationsEnabled(next);
  void loadSavedLeads();
});
notificationBellButton?.addEventListener("click", () => {
  void (async () => {
    const nextOpen = !notificationPanelOpen;
    setNotificationPanelOpen(nextOpen);
    if (!nextOpen) return;
    await refreshNotifications({ limit: 20, unreadOnly: false, simulate: true });
    renderNotificationPanel();
  })();
});
notificationMarkAllButton?.addEventListener("click", () => {
  void (async () => {
    const unreadIds = leadNotifications.filter((item) => !item.is_read).map((item) => item.id).filter(Boolean);
    if (unreadIds.length === 0) return;
    const ok = await markAllLeadNotificationsRead().catch(() => false);
    if (!ok) {
      showSavedLeadsStatus("Could not mark updates as read right now.");
      return;
    }
    leadNotifications = leadNotifications.map((item) => ({ ...item, is_read: true }));
    updateNotificationBell(0);
    renderNotificationPanel();
    showSavedLeadsStatus("Lead updates marked as read.");
  })();
});
document.addEventListener("click", (event) => {
  if (!notificationPanelOpen) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (notificationPanel?.contains(target) || notificationBellButton?.contains(target)) return;
  setNotificationPanelOpen(false);
});
testNotificationButton?.addEventListener("click", () => {
  void (async () => {
    setNotificationsEnabled(true);
    const result = await createTestLeadNotification().catch(() => ({ ok: false, data: {} }));
    if (!result.ok) {
      const message = String(result?.data?.error || "Could not create test notification.");
      showSavedLeadsStatus(message);
      return;
    }
    const notificationId = String(result?.data?.notification_id || "").trim();
    await refreshNotifications({
      limit: 20,
      unreadOnly: false,
      simulate: false,
      forceToastIds: notificationId ? [notificationId] : [],
    });
    renderNotificationPanel();
    showSavedLeadsStatus("Test notification created. Bell count and toast should be visible now.");
  })();
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
  saveLeadStatusMap({});
  showSavedLeadsStatus("Saved leads list was reset.");
  void loadSavedLeads();
});
savedLeadsList?.addEventListener("click", (event) => {
  const noteSaveButton = event.target.closest(".saved-lead-note-save");
  if (noteSaveButton) {
    const leadId = noteSaveButton.dataset.noteSaveId || "";
    if (!leadId) return;
    const textarea = savedLeadsList.querySelector(`.saved-lead-note-input[data-note-lead-id="${leadId}"]`);
    const noteText = textarea?.value || "";
    void (async () => {
      const ok = await saveLeadNote(leadId, noteText).catch(() => false);
      if (!ok) {
        showSavedLeadsStatus("Could not save note right now.");
        return;
      }
      leadNotesById[leadId] = noteText;
      const noteWrap = savedLeadsList.querySelector(`.saved-lead-note-wrap[data-note-wrap-id="${leadId}"]`);
      const noteDisplay = noteWrap?.querySelector(".saved-lead-note-display");
      const preview = savedLeadsList.querySelector(`.saved-lead-note-preview[data-note-preview-id="${leadId}"]`);
      if (preview) {
        if (noteText.trim()) {
          preview.textContent = `Instruction: ${noteText.trim()}`;
          preview.classList.remove("hidden");
          noteWrap?.classList.remove("is-editor-mode");
          noteWrap?.classList.add("is-display-mode");
          noteDisplay?.classList.remove("hidden");
        } else {
          preview.textContent = "";
          preview.classList.add("hidden");
          noteWrap?.classList.remove("is-display-mode");
          noteWrap?.classList.add("is-editor-mode");
          noteDisplay?.classList.add("hidden");
        }
      }
      showSavedLeadsStatus("Private note saved.");
    })();
    return;
  }

  const noteEditButton = event.target.closest(".saved-lead-note-edit");
  if (noteEditButton) {
    const leadId = noteEditButton.dataset.noteEditId || "";
    if (!leadId) return;
    const noteWrap = savedLeadsList.querySelector(`.saved-lead-note-wrap[data-note-wrap-id="${leadId}"]`);
    const noteDisplay = noteWrap?.querySelector(".saved-lead-note-display");
    noteWrap?.classList.remove("is-display-mode");
    noteWrap?.classList.add("is-editor-mode");
    noteDisplay?.classList.add("hidden");
    return;
  }

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
    const item = lastLoadedSavedLeads.find((lead) => leadNotificationKey(lead) === key);
    const leadId = getSavedLeadId(item);
    if (leadId) {
      void (async () => {
        const ok = await saveLeadStatus(leadId, nextStatus).catch(() => false);
        if (!ok) {
          showSavedLeadsStatus("Could not sync lead status right now.");
        }
      })();
    }

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
savePreferencesButton?.addEventListener("click", () => {
  const headline = profileHeadlineInput?.value || "";
  const cvText = profileCvTextInput?.value || "";
  void (async () => {
    try {
      const result = await saveUserProfile(headline, cvText);
      const profile = result?.profile || {};
      userPreferences = {
        target_sectors: profile.target_sectors || "",
        target_company_size: profile.target_company_size || "",
        target_countries: profile.target_countries || "",
        target_work_mode: profile.target_work_mode || "",
      };
      refreshDashboardPreferencesSummary();
      refreshProfilePreferencesPreview();
      showSavedLeadsStatus("Target picks saved.");
    } catch {
      showSavedLeadsStatus("Could not save picks right now.");
    }
  })();
});
saveProfileButton?.addEventListener("click", () => {
  const headline = profileHeadlineInput?.value || "";
  const cvText = profileCvTextInput?.value || "";
  void (async () => {
    try {
      const result = await saveUserProfile(headline, cvText);
      const profile = result?.profile || {};
      userPreferences = {
        target_sectors: profile.target_sectors || "",
        target_company_size: profile.target_company_size || "",
        target_countries: profile.target_countries || "",
        target_work_mode: profile.target_work_mode || "",
      };
      refreshDashboardPreferencesSummary();
      refreshProfilePreferencesPreview();
      profileHeadlinePreview.textContent = profile.headline || "No headline yet.";
      profileCvPreview.textContent = profile.cv_text || "No CV saved yet.";
      showSavedLeadsStatus("Profile and CV saved.");
    } catch {
      showSavedLeadsStatus("Could not save profile right now.");
    }
  })();
});
sectorFilters?.addEventListener("click", (event) => {
  const chip = event.target.closest(".sector-filter-chip");
  if (!chip) return;
  const next = chip.dataset.sector || "All";
  activeSectorFilter = LEAD_SECTORS.includes(next) ? next : "All";
  renderSectorFilters();
  void loadSavedLeads();
});
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
  void loadUserPreferencesOnly();
  void refreshNotifications({ limit: 20, unreadOnly: false, simulate: true });
  startNotificationPolling();
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
  void loadUserPreferencesOnly();
  void refreshNotifications({ limit: 20, unreadOnly: false, simulate: true });
  startNotificationPolling();
  showAppShell();
});
logoutButton?.addEventListener("click", async () => {
  await authRequest("/api/auth/logout", {});
  currentUserEmail = "guest";
  loadGoalTarget();
  userPreferences = { target_sectors: "", target_company_size: "", target_countries: "", target_work_mode: "" };
  refreshDashboardPreferencesSummary();
  refreshProfilePreferencesPreview();
  stopNotificationPolling();
  leadNotifications = [];
  updateNotificationBell(0);
  showAuthScreen();
});
applyTheme(getInitialTheme());
localStorage.removeItem(CONTRAST_STORAGE_KEY);
document.documentElement.removeAttribute("data-contrast");
renderSectorFilters();
refreshDashboardPreferencesSummary();
refreshProfilePreferencesPreview();
updateNotificationsToggleButton();
loadGoalTarget();
if (!localStorage.getItem(LEADS_NOTIFICATIONS_ENABLED_KEY)) {
  // First-run default should be enabled so users can actually observe the notification UX.
  setNotificationsEnabled(true);
}
setAuthTab("register");
showAuthScreen();
void resolveSession();
