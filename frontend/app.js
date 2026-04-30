const input = document.getElementById("lead-search");
const appShell = document.getElementById("app-shell");
const authScreen = document.getElementById("auth-screen");
const showRegisterButton = document.getElementById("show-register");
const showLoginButton = document.getElementById("show-login");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const authMessage = document.getElementById("auth-message");
const logoutButton = document.getElementById("logout-button");
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
const THEME_STORAGE_KEY = "ui_theme_preference";
const FAVORITES_STORAGE_KEY = "favorite_employees";
const BRANDFETCH_CLIENT_ID = "1id6iCSRkbc4cqe2MBu";
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
  { name: "Google", domain: "google.com", country: "US", source: "fallback", logo_url: "" },
  { name: "Stripe", domain: "stripe.com", country: "US", source: "fallback", logo_url: "" },
];

function showAuthScreen() {
  authScreen?.classList.remove("hidden");
  appShell?.classList.add("hidden");
}

function showAppShell() {
  authScreen?.classList.add("hidden");
  appShell?.classList.remove("hidden");
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
  const parts = companyName.split(" ");
  const first = parts[0] || companyName;
  const companyDomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const redactedEmail = `{redacted}@${companyDomain}.company`;
  const romanianCompany =
    normalized.includes("fortech") ||
    normalized.includes("arobs") ||
    normalized.includes("uipath") ||
    normalized.includes("bitdefender") ||
    normalized.includes("endava") ||
    normalized.includes("ntt data romania");

  if (romanianCompany) {
    return [
      { id: `${first}-tudor`, firstName: "Tudor", lastName: "Popescu", role: "Technical Partnerships Manager", email: redactedEmail, location: "Cluj-Napoca, Romania" },
      { id: `${first}-razvan`, firstName: "Razvan", lastName: "Ionescu", role: "Director of Implementation", email: redactedEmail, location: "Bucharest, Romania" },
      { id: `${first}-andrei`, firstName: "Andrei", lastName: "Marinescu", role: "Solutions Engineering Lead", email: redactedEmail, location: "Timisoara, Romania" },
      { id: `${first}-calin`, firstName: "Calin", lastName: "Vaduva", role: "Head of Strategic Accounts", email: redactedEmail, location: "Oradea, Romania" },
      { id: `${first}-voicu`, firstName: "Voicu", lastName: "Oprean", role: "Executive Advisor - Growth", email: redactedEmail, location: "Cluj-Napoca, Romania" },
    ];
  }
  return [
    { id: `${first}-heather`, firstName: "Heather", lastName: "Taylor", role: "User Research Manager", email: redactedEmail, location: "Berlin, Germany" },
    { id: `${first}-brandon`, firstName: "Brandon", lastName: "Anders", role: "Director of Partner Engineering", email: redactedEmail, location: "London, UK" },
    { id: `${first}-sara`, firstName: "Sara", lastName: "Stone", role: "Director of Creator Partnerships", email: redactedEmail, location: "Paris, France" },
    { id: `${first}-william`, firstName: "William", lastName: "Lane", role: "Director of Analytics", email: redactedEmail, location: "Cluj-Napoca, Romania" },
    { id: `${first}-tim`, firstName: "Tim", lastName: "Keller", role: "Director of Partnerships", email: redactedEmail, location: "Madrid, Spain" },
  ];
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
  return currentEmployees.map((employee, index) => {
    const deptRise = employee.departmentRisePercent ?? 8 + index * 3;
    const interviews = employee.interviewsHeldRecently ?? 3 + index;
    const contactChance = employee.contactLikelihoodPercent ?? 58 + index * 7;
    const score = employee.valuableLeadScore ?? Math.min(95, 64 + index * 6);
    const outreachWindow = employee.outreachWindow ?? (index % 2 === 0 ? "Best in next 7 days" : "Strong this month");
    return {
      employee,
      deptRise,
      interviews,
      contactChance,
      score,
      outreachWindow,
      recentTrigger: `${company.name} department growth +${deptRise}% in last quarter`,
    };
  });
}

function renderValuableLeads(company) {
  const insights = buildValuableLeadInsights(company);
  valuableLeadsPanel.innerHTML = "";
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
          <p class="lead-metric-label">Department rising</p>
          <p class="lead-metric-value">+${item.deptRise}%</p>
        </div>
        <div class="lead-metric">
          <p class="lead-metric-label">Recent interviews</p>
          <p class="lead-metric-value">${item.interviews} held</p>
        </div>
        <div class="lead-metric">
          <p class="lead-metric-label">Contact likelihood</p>
          <p class="lead-metric-value">${item.contactChance}%</p>
        </div>
        <div class="lead-metric">
          <p class="lead-metric-label">Outreach window</p>
          <p class="lead-metric-value">${item.outreachWindow}</p>
        </div>
      </div>
      <p class="lead-role">${item.recentTrigger}</p>
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
  }
  updateFavoriteButton(selectedEmployee);
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
  showAppShell();
});
logoutButton?.addEventListener("click", async () => {
  await authRequest("/api/auth/logout", {});
  showAuthScreen();
});
applyTheme(getInitialTheme());
setAuthTab("register");
showAuthScreen();
void resolveSession();
