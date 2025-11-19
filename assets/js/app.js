// ======================================================
// MHM UBA – App Logic (Auth + Navigation + Dashboard Data)
// ======================================================

// 1) Local-only mode: Supabase removed for offline/local usage
// ------------------------------------------------------
console.log("Running in local/demo mode — Supabase disabled");

// ------------------------------------------------------
// Local i18n helpers
// ------------------------------------------------------
const fallbackI18n = {
  t: (key, fallback = "") => fallback || key,
  applyTranslations: () => {},
  syncLanguageSelects: () => {},
  updateViewHeader: () => {},
  setCurrentView: () => {},
  getCurrentView: () => "dashboard",
};

// Per-page init stubs used by page-loader's `loadPageScripts` dispatcher.
function initClientsPage() {
  try {
    if (typeof renderClientsPage === 'function') renderClientsPage();
  } catch (e) { console.warn('initClientsPage error', e); }
}

function initProjectsPage() {
  try {
    if (typeof window.renderProjectsStandalone === 'function') return window.renderProjectsStandalone();
    if (typeof renderProjectsBoard === 'function') return renderProjectsBoard();
  } catch (e) { console.warn('initProjectsPage error', e); }
}

function initTasksPage() {
  try {
    if (typeof window.renderTasksStandalone === 'function') return window.renderTasksStandalone();
    if (typeof renderTasksBoard === 'function') return renderTasksBoard();
  } catch (e) { console.warn('initTasksPage error', e); }
}

function initSmartTools() {
  try {
    if (typeof initSmartToolsStandalone === 'function') return initSmartToolsStandalone();
    if (typeof renderSmartToolsGrid === 'function') return renderSmartToolsGrid();
  } catch (e) { console.warn('initSmartTools error', e); }
}

function initAssistant() {
  try {
    // Ensure assistant API is available; do not auto-open.
    if (window.ubaAssistant) return; // assistant script will initialize itself
  } catch (e) { console.warn('initAssistant error', e); }
}


const i18n = window.ubaI18n || fallbackI18n;
const t = i18n.t || fallbackI18n.t;

// ---------------------
// Shared utilities
// ---------------------
function genId(prefix = '') {
  if (window.crypto && crypto.randomUUID) return prefix + crypto.randomUUID();
  return prefix + Date.now() + '-' + Math.floor(Math.random() * 9999);
}

function formatDateISO(d) {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch (e) {
    return '';
  }
}

function showToast(message, opts = {}) {
  // simple non-blocking toast (aria-live)
  let container = document.getElementById('uba-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'uba-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.style.position = 'fixed';
    container.style.right = '20px';
    container.style.bottom = '20px';
    container.style.zIndex = '1400';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.className = 'uba-toast';
  el.textContent = message;
  if (opts.type === 'error') el.style.background = 'linear-gradient(120deg,#ef4444,#f97316)';
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(()=>el.remove(), 300); }, opts.duration || 3000);
}

function setFieldError(input, message) {
  if (!input) return;
  input.classList.add('uba-field-error-input');
  let err = input.parentElement && input.parentElement.querySelector('.uba-field-error');
  if (!err) {
    err = document.createElement('div');
    err.className = 'uba-field-error';
    input.parentElement.appendChild(err);
  }
  err.textContent = message || '';
}

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove('uba-field-error-input');
  const err = input.parentElement && input.parentElement.querySelector('.uba-field-error');
  if (err) err.textContent = '';
}

function isValidEmail(val) {
  if (!val) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function escapeHtml(unsafe) {
  return (unsafe || "").toString().replace(/[&<>\"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c;
  });
}

function setButtonLoading(btn, loading, label) {
  if (!btn) return;
  if (loading) {
    btn.dataset._orig = btn.textContent;
    btn.textContent = label || t('action.saving','Saving...');
    btn.disabled = true;
    btn.classList.add('is-loading');
  } else {
    btn.textContent = btn.dataset._orig || label || t('action.save','Save');
    btn.disabled = false;
    btn.classList.remove('is-loading');
  }
}

// ---------------------
// Smart helpers (analytics & suggestions)
// ---------------------
function _getStoreCollection(name, fallback) {
  const store = window.ubaStore;
  if (store && store[name] && typeof store[name].getAll === 'function') return store[name].getAll() || [];
  // fallback to localStorage keys
  const key = LOCAL_KEYS[name] || null;
  if (key) return ensureSeedData(key, fallback || []) || [];
  return fallback || [];
}

function getClientById(id) {
  const clients = _getStoreCollection('clients', clientSeed);
  return clients.find(c => c.id === id) || null;
}

function getInvoicesByClient(clientName) {
  const invoices = _getStoreCollection('invoices', invoiceSeed);
  return invoices.filter(i => (i.client || '').toLowerCase() === (clientName || '').toLowerCase());
}

function getProjectsByClient(clientName) {
  const projects = _getStoreCollection('projects', projectStagesSeed);
  const items = [];
  if (Array.isArray(projects)) {
    projects.forEach(stage => {
      (stage.items || []).forEach(it => { if ((it.client||'').toLowerCase() === (clientName||'').toLowerCase()) items.push(it); });
    });
  }
  return items;
}

function getTasksByClient(clientName) {
  const tasksRaw = _getStoreCollection('tasks', taskBoardSeed);
  const out = [];
  if (Array.isArray(tasksRaw) && tasksRaw.length && tasksRaw[0].tasks) {
    tasksRaw.forEach(col => (col.tasks || []).forEach(t => { if ((t.client||t.owner||'').toLowerCase().includes((clientName||'').toLowerCase())) out.push(t); }));
  } else if (Array.isArray(tasksRaw)) {
    tasksRaw.forEach(t => { if ((t.client||t.owner||'').toLowerCase().includes((clientName||'').toLowerCase())) out.push(t); });
  }
  return out;
}

function daysSince(dateStr) {
  try {
    const then = new Date(dateStr).getTime();
    if (!then) return Infinity;
    return Math.floor((Date.now() - then) / (24*60*60*1000));
  } catch (e) { return Infinity; }
}

function getTopClientsByRevenue(limit = 3) {
  const invoices = _getStoreCollection('invoices', invoiceSeed);
  const map = {};
  invoices.forEach(i => {
    const name = i.client || 'Unknown';
    map[name] = (map[name]||0) + Number(i.amount || 0);
  });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([name, amount]) => ({ name, amount }));
}

function getOverdueTasks() {
  const tasksRaw = _getStoreCollection('tasks', taskBoardSeed);
  const out = [];
  const pushIf = (t) => { if (t && t.due && /^\d{4}-\d{2}-\d{2}/.test(t.due)) { const then = new Date(t.due).getTime(); if (then < Date.now()) out.push(t); } };
  if (Array.isArray(tasksRaw) && tasksRaw.length && tasksRaw[0].tasks) {
    tasksRaw.forEach(col => (col.tasks || []).forEach(pushIf));
  } else if (Array.isArray(tasksRaw)) {
    tasksRaw.forEach(pushIf);
  }
  return out;
}

function getInactiveClients(days = 30) {
  const clients = _getStoreCollection('clients', clientSeed);
  const invoices = _getStoreCollection('invoices', invoiceSeed);
  return clients.filter(c => {
    const clientName = (c.name || '').toLowerCase();
    const recent = invoices.find(i => (i.client||'').toLowerCase() === clientName && daysSince(i.createdAt || i.created_at || i.due || Date.now()) <= days);
    return !recent;
  });
}

function suggestOutreachTemplates(client) {
  const invs = getInvoicesByClient(client.name);
  const overdue = invs.filter(i => { try { return ['overdue'].includes(i.status) || (i.due && new Date(i.due).getTime() < Date.now() && i.status !== 'paid'); } catch(e){return false;} });
  const lastInvoiceDays = invs.length ? daysSince(invs[0].createdAt || invs[0].created_at || invs[0].due || new Date()) : Infinity;
  const templates = [];
  if (overdue.length) {
    templates.push({ title: t('smart.outreach.reminder','Invoice reminder'), text: `Hi ${client.name},\n\nWe noticed invoice ${overdue[0].id || ''} for €${Number(overdue[0].amount||0)} is still outstanding. Could you confirm payment date? Thanks!` });
    templates.push({ title: t('smart.outreach.nudge','Friendly nudge'), text: `Hi ${client.name},\n\nQuick check-in — just following up on the outstanding invoice and next steps for the project.` });
  } else if (lastInvoiceDays > 90) {
    templates.push({ title: t('smart.outreach.reengage','Re-engagement'), text: `Hi ${client.name},\n\nIt's been a while since we last worked together. Would you like to schedule a short catch-up to explore next opportunities?` });
    templates.push({ title: t('smart.outreach.share','Share update'), text: `Hi ${client.name},\n\nWe have some updates and ideas that may help your project — would you be open to a 20-min call?` });
  } else {
    templates.push({ title: t('smart.outreach.thanks','Quick thanks'), text: `Hi ${client.name},\n\nThanks for the recent work together. Let us know if there's anything else we can help with.` });
  }
  return templates.slice(0,3);
}

function nextBestActions(limit = 5) {
  const actions = [];
  // overdue invoices
  const invoices = _getStoreCollection('invoices', invoiceSeed);
  invoices.forEach(i => { try { if (i.due && new Date(i.due).getTime() < Date.now() && i.status !== 'paid') actions.push({ type: 'invoice_followup', title: `Follow up invoice ${i.id||''}`, meta: i }); } catch(e){} });
  // overdue tasks
  const overdueTasks = getOverdueTasks();
  overdueTasks.forEach(t=> actions.push({ type: 'task', title: `Complete task: ${t.title}`, meta: t }));
  // leads with no recent activity
  const leads = _getStoreCollection('leads', leadsSeed);
  leads.forEach(l => { const inactiveDays = daysSince(l.updatedAt || l.lastContact || new Date()); if (inactiveDays > 30) actions.push({ type: 'lead', title: `Reconnect lead: ${l.name}`, meta: l }); });
  // projects in proposal
  const projects = _getStoreCollection('projects', projectStagesSeed);
  if (Array.isArray(projects)) {
    projects.forEach(stage => { (stage.items||[]).forEach(it=>{ if ((stage.id||stage.title||'').toLowerCase().includes('proposal')) actions.push({ type: 'project', title: `Advance proposal: ${it.name||it.title}`, meta: it }); }); });
  }
  // dedupe and return top N
  return actions.slice(0, limit);
}

function quickInsights() {
  const top = getTopClientsByRevenue(3);
  const overdueTasks = getOverdueTasks();
  const expenses = _getStoreCollection('expenses', expensesSeed);
  const cats = {};
  expenses.forEach(e=> cats[e.category] = (cats[e.category]||0) + Number(e.amount||0));
  const topCat = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
  return { topClients: top, overdueTasksCount: overdueTasks.length, topExpenseCategory: topCat ? { category: topCat[0], amount: topCat[1] } : null };
}

// ------------------------------------------------------
// Utility: Get current user id (local stub)
// ------------------------------------------------------
async function getCurrentUserId() {
  try {
    const store = window.ubaStore;
    if (store && store.auth && typeof store.auth.currentUser === 'function') {
      const u = store.auth.currentUser();
      if (u && u.id) return u.id;
    }
  } catch (e) {
    console.warn('getCurrentUserId error', e);
  }
  return "local-user";
}

// 2) Global auth guard & dashboard data trigger
// ------------------------------------------------------
(async () => {
  const rawPath = window.location.pathname || "/";
  const path = rawPath.toLowerCase();

  const isLoginPage =
    path.endsWith("/login.html") || path === "/login" || path.endsWith("/login");
  const isSignupPage =
    path.endsWith("/signup.html") || path === "/signup" || path.endsWith("/signup");
  const isPublicPage = isLoginPage || isSignupPage;

  const isDashboardPage =
    !isPublicPage &&
    (path === "/" || path.endsWith("/index.html") || path.endsWith("/index"));

  // Local-only startup: run demo dashboard on index.html
  const enableDemo = false;

  if (isDashboardPage) {
    const label = document.getElementById("uba-user-label");
    try {
      const store = window.ubaStore;
      const current = store && store.auth && typeof store.auth.currentUser === 'function' ? store.auth.currentUser() : null;
      if (label) {
        label.textContent = (current && current.name) ? current.name : "Demo user";
      }
    } catch (e) {
      if (label) label.textContent = "Demo user";
    }
    if (enableDemo) {
      document.body.classList.add("uba-demo-mode");
      await loadDemoDashboard();
    } else {
      const uid = await getCurrentUserId();
      await loadDashboardData(uid);
    }
  }
})();

// 3) Login (login.html)
// ------------------------------------------------------
window.login = async function () {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorBox = document.getElementById("errorBox");

  if (errorBox) errorBox.textContent = "";

  if (!emailInput || !passwordInput) {
    console.error("Login inputs not found (#email, #password)");
    if (errorBox) {
      errorBox.textContent = t("errors.form");
    }
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    if (errorBox) {
      errorBox.textContent = t("auth.login.missing");
    }
    return;
  }

  try {
    const store = window.ubaStore;
    if (store && store.auth && typeof store.auth.login === 'function') {
      const result = store.auth.login(email, password);
      // set label if present
      const label = document.getElementById("uba-user-label");
      if (label && result && result.user) label.textContent = result.user.name || result.user.email || 'User';
      window.location.href = "index.html";
      return;
    }
    // fallback: redirect
    window.location.href = "index.html";
  } catch (e) {
    console.error('login error', e);
    if (errorBox) errorBox.textContent = e.message || t("auth.login.network");
  }
};

// 4) Logout (index.html)
// ------------------------------------------------------
window.logout = async function () {
  try {
    const store = window.ubaStore;
    if (store && store.auth && typeof store.auth.logout === 'function') {
      store.auth.logout();
    }
  } catch (e) {
    console.warn('logout error', e);
  }
  window.location.href = "login.html";
};

// ======================================================
// 5) DASHBOARD DATA MODULES
// ======================================================

/**
 * Main dispatcher to load all dashboard components.
 * @param {string} userId - Supabase user id
 */
async function loadDashboardData(userId) {
  console.log("Starting dashboard data load…");
  await loadKPIs(userId);
  await loadTasks(userId);
  await loadPipeline(userId);
}

/**
 * Demo dashboard (local, no auth required)
 */
async function loadDemoDashboard() {
  console.log("Loading demo dashboard data…");

  const banner = document.getElementById("demo-banner");
  if (banner) {
    banner.hidden = false;
  }

  const demoKPIs = {
    billed: 12850,
    open: 3620,
    clients: 8,
    tasksToday: 4,
  };

  const demoTasks = [
    { title: "Send SOW to Atlas Labs", status: "in_progress" },
    { title: "Review invoice NW-104", status: "todo" },
    { title: "Prep onboarding for Lumen", status: "todo" },
    { title: "Sync with marketing on launch", status: "in_progress" },
  ];

  const demoPipeline = {
    lead: [
      { name: "Lumen Analytics", budget: 5400 },
      { name: "Bright Robotics", budget: 7200 },
    ],
    in_progress: [
      { name: "Atlas Labs", budget: 9500 },
      { name: "Northwind", budget: 4200 },
    ],
    ongoing: [{ name: "Helios Solar", budget: 6100 }],
  };

  const demoActivity = [
    { text: "Created mini invoice INV-204 for Northwind", tag: "Invoices" },
    { text: "Updated pipeline: Atlas Labs → In progress", tag: "Projects" },
    { text: "Client Lumen added to CRM", tag: "Clients" },
  ];

  // KPIs
  const kpiBilled = document.getElementById("kpi-billed");
  const kpiOpen = document.getElementById("kpi-open-invoices");
  const kpiClients = document.getElementById("kpi-active-clients");
  const kpiTasks = document.getElementById("kpi-tasks-today");
  const kpiTasksTrend = document.getElementById("kpi-tasks-today-trend");

  if (kpiBilled) kpiBilled.textContent = `€ ${demoKPIs.billed.toLocaleString()}`;
  if (kpiOpen) kpiOpen.textContent = `€ ${demoKPIs.open.toLocaleString()}`;
  if (kpiClients) kpiClients.textContent = `${demoKPIs.clients}`;
  if (kpiTasks) kpiTasks.textContent = `${demoKPIs.tasksToday}`;
  if (kpiTasksTrend) kpiTasksTrend.textContent = "Demo tasks for today";

  // Tasks
  const taskList = document.getElementById("task-list");
  if (taskList) {
    taskList.innerHTML = "";
    demoTasks.forEach((task) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class=\"uba-task-main\">
          <span class=\"uba-task-dot\"></span>
          <span>${task.title}</span>
        </div>
        <span class=\"uba-task-tag\">${task.status === "in_progress" ? "In progress" : "Todo"}</span>
      `;
      taskList.appendChild(li);
    });
  }

  // Pipeline
  renderPipelineColumns(demoPipeline);

  // Activity
  const activity = document.getElementById("activity-log");
  if (activity) {
    activity.innerHTML = "";
    demoActivity.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `${item.text}<span class="tag">${item.tag}</span>`;
      activity.appendChild(li);
    });
  }
}

/**
 * KPIs
 * Uses: invoices (amount, status, created_at, user_id)
 *       clients (user_id)
 */
async function loadKPIs(userId) {
  try {
    // Use local store (window.ubaStore) for invoices and clients
    const store = window.ubaStore;
    const invoices = (store && store.invoices.getAll()) || [];
    const clients = (store && store.clients.getAll()) || [];

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const totalBilled = invoices
      .filter((inv) => inv.status === "paid" && new Date(inv.createdAt || inv.created_at || 0).getTime() >= thirtyDaysAgo)
      .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

    const totalOpen = invoices
      .filter((inv) => ["sent", "overdue"].includes(inv.status))
      .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

    const kpiBilled = document.getElementById("kpi-billed");
    const kpiOpen = document.getElementById("kpi-open-invoices");
    const kpiClients = document.getElementById("kpi-active-clients");

    if (kpiBilled) kpiBilled.textContent = `€ ${totalBilled.toLocaleString()}`;
    if (kpiOpen) kpiOpen.textContent = `€ ${totalOpen.toLocaleString()}`;
    if (kpiClients) kpiClients.textContent = `${clients.length}`;
  } catch (e) {
    console.error("Error loading KPIs:", e);
    ["kpi-billed", "kpi-open-invoices", "kpi-active-clients"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "N/A";
    });
  }
}

/**
 * Tasks list
 * Uses: tasks (id, title, status, user_id)
 * Convention: status = 'todo' | 'in_progress' | 'done'
 */
async function loadTasks(userId) {
  const taskList = document.getElementById("task-list");
  if (!taskList) return;

  taskList.innerHTML =
    `<li><div class="uba-task-main"><span>Loading tasks...</span></div></li>`;

  try {
    const store = window.ubaStore;
    const all = (store && store.tasks.getAll()) || [];
    const tasks = all.filter((t) => t.status !== "done").slice(0, 4);
    taskList.innerHTML = "";

    if (!tasks || tasks.length === 0) {
      taskList.innerHTML = `<li><div class="uba-task-main"><span>No outstanding tasks.</span></div></li>`;
      return;
    }

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.setAttribute("data-task-id", task.id);

      const statusLabel =
        task.status === "in_progress"
          ? "In progress"
          : task.status === "done"
          ? "Done"
          : "Todo";

      li.innerHTML = `
        <div class="uba-task-main">
          <span class="uba-task-dot"></span>
          <span>${task.title}</span>
        </div>
        <span class="uba-task-tag">${statusLabel}</span>
      `;
      taskList.appendChild(li);
    });
  } catch (e) {
    console.error("Error loading tasks:", e);
    taskList.innerHTML = `<li><div class="uba-task-main"><span>Failed to load tasks.</span></div></li>`;
  }
}

/**
 * Pipeline
 * Uses: projects (name, status, budget, user_id)
 * Convention: status = 'lead' | 'in_progress' | 'ongoing'
 */
async function loadPipeline(userId) {
  const pipelineColumns = document.getElementById("pipeline-columns");
  if (!pipelineColumns) return;
  const LABELS = {
    lead: "Leads",
    in_progress: "In progress",
    ongoing: "Ongoing",
  };

  pipelineColumns.innerHTML = `<div class="uba-pipe-col"><h4>Leads</h4><div class="uba-pipe-item">Loading...</div></div>`;

  try {
    const store = window.ubaStore;
    const projects = (store && store.projects.getAll()) || [];
    const grouped = (projects || []).reduce((acc, project) => {
      const stage = project.status || project.stage || "lead";
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(project);
      return acc;
    }, {});

    renderPipelineColumns(grouped, LABELS);
  } catch (e) {
    console.error("Error loading pipeline:", e);
    pipelineColumns.innerHTML = `<div class="uba-pipe-col"><h4>Error</h4><div class="uba-pipe-item">Failed to load pipeline.</div></div>`;
  }
}

/**
 * Shared renderer for pipeline columns
 */
function renderPipelineColumns(grouped, labels) {
  const pipelineColumns = document.getElementById("pipeline-columns");
  if (!pipelineColumns) return;

  const LABELS =
    labels || {
      lead: "Leads",
      in_progress: "In progress",
      ongoing: "Ongoing",
    };

  const STAGES = Object.keys(LABELS);
  pipelineColumns.innerHTML = "";

  STAGES.forEach((stageKey) => {
    const col = document.createElement("div");
    col.className = "uba-pipe-col";
    col.innerHTML = `<h4>${LABELS[stageKey]}</h4>`;

    const inStage = grouped?.[stageKey] || [];
    if (inStage.length === 0) {
      col.innerHTML += `<div class="uba-pipe-item">No projects in this stage.</div>`;
    } else {
      inStage.forEach((project) => {
        const budgetText = project.budget != null ? `Budget: €${project.budget}` : "";
        col.innerHTML += `
          <div class="uba-pipe-item">
            <p class="uba-pipe-title">${project.name}</p>
            <p class="uba-pipe-meta">${budgetText}</p>
          </div>
        `;
      });
    }
    pipelineColumns.appendChild(col);
  });
}

// ======================================================
// 6) DOM CONTENT LOADED – UI wiring
// ======================================================
const localMiniInvoices = [
  { id: "seed-1", client: "Atlas Labs", label: "AI consulting", amount: 1850, status: "sent" },
  { id: "seed-2", client: "Northwind", label: "Maintenance retainer", amount: 1200, status: "paid" },
];

function renderMiniInvoices() {
  const tbody = document.querySelector("#mini-invoice-table tbody");
  const totalLabel = document.getElementById("mini-total");
  const countLabel = document.getElementById("mini-count");
  if (!tbody) return;

  tbody.innerHTML = "";

  const store = window.ubaStore;
  const invoicesSource = (store && store.invoices.getAll && store.invoices.getAll()) || localMiniInvoices || [];
  const total = invoicesSource.reduce(
    (sum, inv) => sum + (Number.isFinite(inv.amount) ? Number(inv.amount) : 0),
    0
  );
  if (totalLabel) totalLabel.textContent = `€ ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  if (countLabel) countLabel.textContent = `${invoicesSource.length}`;

  if (!invoicesSource.length) {
    tbody.innerHTML = `<tr><td colspan="4">${t("mini.none")}</td></tr>`;
    return;
  }

  invoicesSource.slice(0, 8).forEach((invoice) => {
    const statusLabel = invoice.status
      ? t(`form.${invoice.status}`, invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1))
      : t("form.draft", "Draft");
    const amountText = invoice.amount != null
      ? `€ ${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${invoice.client || ""}</td>
      <td>${invoice.label || ""}</td>
      <td>${amountText}</td>
      <td><span class="mini-invoice-status ${invoice.status || "draft"}">${statusLabel}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function addMiniInvoice(payload) {
  try {
    const store = window.ubaStore;
    if (store && store.invoices) {
      store.invoices.create(payload);
    } else {
      localMiniInvoices.unshift({ ...payload, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() });
    }
  } catch (e) {
    console.warn('addMiniInvoice fallback', e);
    localMiniInvoices.unshift({ ...payload, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() });
  }
  renderMiniInvoices();
}

// =====================
// Utility: CSV export + print helper
// =====================
function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const esc = (v) => (`"${String(v || "").replace(/"/g, '""')}"`);
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(rows.map(r => headers.map(h => esc(r[h])).join(",")))
    .join("\n");
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printInvoiceById(id) {
  const store = window.ubaStore;
  const invoices = (store && store.invoices.getAll && store.invoices.getAll()) || ensureSeedData(LOCAL_KEYS.invoices, invoiceSeed) || [];
  const inv = invoices.find(i => i.id === id);
  if (!inv) { alert(t('errors.notFound') || 'Invoice not found'); return; }
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${inv.id}</title><style>body{font-family:system-ui,Segoe UI,Roboto,Arial;background:#fff;color:#000;padding:28px} .header{display:flex;justify-content:space-between;align-items:center} .brand{font-weight:800} .box{border:1px solid #ddd;padding:16px;margin-top:18px}</style></head><body><div class="header"><div class="brand">MHM UBA</div><div>Invoice: ${inv.id}</div></div><div class="box"><h2>${inv.label||''}</h2><p><strong>Client:</strong> ${inv.client||''}</p><p><strong>Amount:</strong> € ${Number(inv.amount||0).toLocaleString()}</p><p><strong>Status:</strong> ${inv.status||''}</p><p><strong>Due:</strong> ${inv.due||''}</p><div style="margin-top:18px">${inv.notes||''}</div></div><script>window.print();</script></body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert(t('errors.popupBlocked') || 'Unable to open print window'); return; }
  w.document.write(html);
  w.document.close();
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded, wiring UI…");

  if (i18n.applyTranslations) {
    i18n.applyTranslations(localStorage.getItem("uba-lang") || i18n.currentLanguage || "en");
  }

  // Initialize local store seeds on first run so demo data is available
  try {
    const store = window.ubaStore;
    if (store && store.ensureSeed) {
      store.ensureSeed('clients', clientSeed || []);
      store.ensureSeed('invoices', invoiceSeed || []);
      store.ensureSeed('projects', projectStagesSeed || []);
      store.ensureSeed('tasks', taskBoardSeed || []);
      store.ensureSeed('leads', leadsSeed || []);
      store.ensureSeed('expenses', expensesSeed || []);
      store.ensureSeed('files', filesSeed || []);
      store.ensureSeed('reports', reportsSeed || {});
    }
  } catch (e) {
    console.warn('Failed to seed local store', e);
  }

  // Show current user name in standalone pages if present
  try {
    const store = window.ubaStore;
    const label = document.getElementById('uba-user-label');
    const current = store && store.auth && typeof store.auth.currentUser === 'function' ? store.auth.currentUser() : null;
    if (label) label.textContent = (current && (current.name || current.email)) ? (current.name || current.email) : label.textContent;
  } catch (e) {
    // ignore
  }

  const languageSwitchers = document.querySelectorAll(
    "#language-select, #language-select-top, #language-select-settings"
  );
  languageSwitchers.forEach((select) => {
    select.addEventListener("change", (event) => {
      const lang = event.target.value;
      if (i18n.applyTranslations) {
        i18n.applyTranslations(lang);
      }
      saveSettingsState({ language: lang });
      renderSettingsSummary(loadSettingsState());
    });
  });

  // 6.1 Logout button
  const logoutBtn = document.querySelector(".uba-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.logout();
    });
  }

  // 6.2 Signup page handler
  const signupBtn = document.getElementById("signup-btn");
  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      const emailInput = document.getElementById("signup-email");
      const passInput = document.getElementById("signup-password");
      const confirmInput = document.getElementById("signup-password-confirm");
      const errorBox = document.getElementById("signupError");
      const successBox = document.getElementById("signupSuccess");

      if (errorBox) errorBox.textContent = "";
      if (successBox) successBox.textContent = "";

      if (!emailInput || !passInput || !confirmInput) {
        if (errorBox) errorBox.textContent = t("errors.form");
        return;
      }

      const email = emailInput.value.trim();
      const password = passInput.value;
      const confirm = confirmInput.value;

      if (!email || !password || !confirm) {
        if (errorBox) errorBox.textContent = t("auth.signup.missing");
        return;
      }

      if (password !== confirm) {
        if (errorBox) errorBox.textContent = t("auth.signup.mismatch");
        return;
      }

      try {
        const store = window.ubaStore;
        if (store && store.auth && typeof store.auth.createUser === 'function') {
          // create account and auto-login
          const user = store.auth.createUser({ name: '', email, password, language: (loadSettingsState()||{}).language });
          if (store.auth && typeof store.auth.login === 'function') {
            store.auth.login(email, password);
          }
          if (successBox) successBox.textContent = t("auth.signup.successRedirect") || "Account created";
          setTimeout(() => { window.location.href = "index.html"; }, 600);
          return;
        }
        // fallback behavior
        if (successBox) successBox.textContent = t("auth.signup.successRedirect") || "Account created";
        setTimeout(() => { window.location.href = "index.html"; }, 800);
      } catch (e) {
        console.error('signup error', e);
        if (errorBox) errorBox.textContent = e.message || t("errors.network");
      }
    });
  }
  // 6.3 Tasks click → toggle status done/todo
  // NOTE: Task list toggling remains available for dashboard `#task-list` element.
  // Standalone tasks page wiring is handled by `initTasksPage` / `renderTasksStandalone`.
  const taskList = document.getElementById("task-list");
  if (taskList) {
    taskList.addEventListener("click", (event) => {
      const li = event.target.closest("li");
      const taskId = li ? li.getAttribute("data-task-id") : null;
      if (!li || !taskId) return;

      const isCompleted = li.classList.contains("completed");
      const newStatus = isCompleted ? "todo" : "done";
      li.classList.toggle("completed");

      try {
        const store = window.ubaStore;
        if (store && store.tasks) {
          const all = store.tasks.getAll();
          if (Array.isArray(all) && all.length && all[0].tasks) {
            const cols = all;
            for (const col of cols) {
              const task = col.tasks && col.tasks.find((t) => t.id === taskId);
              if (task) {
                task.status = newStatus;
              }
            }
            if (store.tasks.saveAll) store.tasks.saveAll(cols);
          } else {
            const task = all.find((t) => t.id === taskId);
            if (task && store.tasks.update) store.tasks.update(task.id, { status: newStatus });
          }
        }
      } catch (e) {
        console.error("Failed to toggle task completion:", e);
        li.classList.toggle("completed");
      }
    });
  }

  // 6.4 Mini invoices – currently not integrated
  const miniForm = document.getElementById("mini-invoice-form");
  const miniModeBadge = document.getElementById("mini-mode-badge");
  const miniFeedback = document.getElementById("mini-invoice-feedback");

  const setMiniFeedback = (message, isError = false) => {
    if (!miniFeedback) return;
    miniFeedback.textContent = message || "";
    miniFeedback.classList.remove("uba-text-danger", "uba-text-success");
    if (message) {
      miniFeedback.classList.add(isError ? "uba-text-danger" : "uba-text-success");
    }
  };

  if (miniModeBadge) {
    miniModeBadge.textContent = t("mini.badgeDemo");
  }

  renderMiniInvoices();

  if (miniForm) {
    miniForm.addEventListener("submit", (event) => {
      event.preventDefault();
      setMiniFeedback("");

      const clientName = document.getElementById("mini-client-name");
      const amountInput = document.getElementById("mini-amount");
      const labelInput = document.getElementById("mini-label");
      const statusSelect = document.getElementById("mini-status");

      const client = clientName?.value.trim();
      const amount = amountInput ? Number(amountInput.value) : NaN;

      if (!client || Number.isNaN(amount) || amount <= 0) {
        setMiniFeedback(t("mini.required"), true);
        return;
      }

      const label = labelInput?.value.trim() || t("mini.untitled");
      const status = statusSelect?.value || "draft";

      addMiniInvoice({ client, amount, label, status });

      if (miniForm instanceof HTMLFormElement) {
        miniForm.reset();
      }

      setMiniFeedback(t("mini.saved"));
    });
  }
  // Standalone page initializers (Smart Tools / Projects / Tasks) are now invoked by the page-loader
  // via `initSmartTools`, `initProjectsPage`, and `initTasksPage` so we do not auto-run them here.

  // 6.5 Sidebar navigation
  const navButtons = document.querySelectorAll(".uba-nav-btn[data-section]");
  const viewSections = document.querySelectorAll(".uba-view[data-view]");

  const viewRenderers = {
    clients: renderClientsPage,
    projects: renderProjectsBoard,
    tasks: renderTasksBoard,
    invoices: renderInvoicePage,
    automations: renderAutomationsPage,
    "smart-tools": renderSmartToolsGrid,
    support: renderSupportTopics,
    insights: renderInsightsLab,
    settings: renderSettingsPage,
  };

  const showView = (target) => {
    const selected = target || "dashboard";
    const singlePageMode = loadSettingsState().singlePage !== false;

    viewSections.forEach((section) => {
      const isMatch = section.getAttribute("data-view") === selected;
      if (singlePageMode) {
        section.classList.toggle("is-hidden", !isMatch);
      } else {
        section.classList.toggle("is-hidden", false);
      }
    });

    navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-section") === selected);
    });

    document.body.dataset.activeView = selected;
    document.body.classList.toggle("uba-single-view", !!singlePageMode);

    if (i18n.setCurrentView) {
      i18n.setCurrentView(selected);
    }

    const renderer = viewRenderers[selected];
    if (typeof renderer === "function") {
      renderer();
    }
  };

    if (navButtons.length && viewSections.length) {
    console.log("Navigation wiring active.");

    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-section") || "dashboard";
        console.log("Switching view to:", target);
        // Open the standalone help page for the Support / Success Desk menu
        if (target === "support") {
          window.location.href = "help.html";
          return;
        }
        // If we're on a standalone page (not index.html), navigate to the page instead
        try {
          const path = (window.location.pathname || '').toLowerCase();
          const isIndex = path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/index');
          if (!isIndex && target && target !== 'dashboard') {
            // redirect to the standalone page for this section
            window.location.href = `${target}.html`;
            return;
          }
        } catch (e) {
          // ignore and fall back to SPA show
        }
        showView(target);
      });
    });

    // If the URL contains a hash (e.g. index.html#clients) use it to select a view
    const hash = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    const initialView = hash || (i18n.getCurrentView ? i18n.getCurrentView() : "dashboard");
    showView(initialView);
  }

  // 6.6 Workspace select (log only)
  const workspaceSelect = document.getElementById("workspace-select");
  if (workspaceSelect) {
    workspaceSelect.addEventListener("change", () => {
      console.log("Workspace changed to:", workspaceSelect.value);
    });
  }

  // 6.7 Clients form
  const clientForm = document.getElementById("client-form");
  if (clientForm) {
    clientForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nameInput = document.getElementById("client-name");
      const emailInput = document.getElementById("client-email");
      const companyInput = document.getElementById("client-company");
      const phoneInput = document.getElementById("client-phone");
      const notesInput = document.getElementById("client-notes");
      const errorBox = document.getElementById("client-error");

      if (errorBox) errorBox.textContent = "";

      const name = nameInput.value.trim();
      if (!name) {
        if (errorBox) errorBox.textContent = "Client name is required.";
        return;
      }

      try {
        // Use centralized helper (will prefer store when present)
        await createClient({
          name,
          email: emailInput.value.trim() || "",
          company: companyInput.value.trim() || "",
          phone: phoneInput.value.trim() || "",
          notes: notesInput.value.trim() || "",
        });

        nameInput.value = "";
        emailInput.value = "";
        companyInput.value = "";
        phoneInput.value = "";
        notesInput.value = "";

        renderClientsPage();
      } catch (e) {
        console.error("createClient error:", e);
        if (errorBox) {
          errorBox.textContent = e.message || "Failed to add client.";
        }
      }
    });
  }
});

// ======================================================
// 7) CLIENTS MODULE (Local store)
// ======================================================
async function loadClients() {
  const tbody = document.getElementById("clients-table-body");
  const errorBox = document.getElementById("client-error");
  if (!tbody) return;

  if (errorBox) errorBox.textContent = "";
  tbody.innerHTML = `<tr><td colspan="5">${t("clients.loading")}</td></tr>`;

  try {
    const store = window.ubaStore;
    const data = (store && store.clients.getAll()) || ensureSeedData(LOCAL_KEYS.clients, clientSeed) || [];

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">${t("clients.none")}</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    data.forEach((client) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${client.name || ""}</td>
        <td>${client.company || ""}</td>
        <td>${client.email || ""}</td>
        <td>${client.phone || ""}</td>
        <td>
          <button type="button" class="uba-btn-link" data-client-id="${client.id}">${t("action.delete")}</button>
        </td>
      `;
      const btn = tr.querySelector('button[data-client-id]');
      if (btn) {
        btn.addEventListener('click', () => {
          if (!confirm(t('clients.deleteConfirm'))) return;
          try {
            if (store && store.clients) store.clients.delete(client.id);
            else {
              const next = (readLocalData(LOCAL_KEYS.clients, []) || []).filter(c => c.id !== client.id);
              writeLocalData(LOCAL_KEYS.clients, next);
            }
            loadClients();
          } catch (err) {
            console.error('delete client error', err);
            if (errorBox) errorBox.textContent = err.message || t('errors.deleteClient');
          }
        });
      }
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("loadClients exception:", e);
    if (errorBox) {
      errorBox.textContent = e.message || t("errors.loadClients");
    }
    tbody.innerHTML = "";
  }
}

async function createClient(payload) {
  const store = window.ubaStore;
  if (store && store.clients) return store.clients.create(payload);
  const clients = ensureSeedData(LOCAL_KEYS.clients, clientSeed) || [];
  const item = { id: `client-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...payload };
  writeLocalData(LOCAL_KEYS.clients, [item, ...clients]);
  return item;
}

window.deleteClient = async function (id) {
  const errorBox = document.getElementById("client-error");
  if (errorBox) errorBox.textContent = "";

  if (!confirm(t("clients.deleteConfirm"))) return;

  try {
    const store = window.ubaStore;
    if (store && store.clients) store.clients.delete(id);
    else {
      const next = (readLocalData(LOCAL_KEYS.clients, []) || []).filter((c) => c.id !== id);
      writeLocalData(LOCAL_KEYS.clients, next);
    }
    await loadClients();
  } catch (e) {
    console.error("deleteClient error:", e);
    if (errorBox) {
      errorBox.textContent = e.message || t("errors.deleteClient");
    }
  }
};

// ======================================================
// 8) LOCAL VIEW HELPERS (Clients, Invoices, Projects, Tasks, Automations, Tools, Support)
// ======================================================
const LOCAL_KEYS = {
  clients: "uba-local-clients",
  invoices: "uba-local-invoices",
  projects: "uba-local-projects",
  tasks: "uba-local-tasks",
  leads: "uba-local-leads",
  expenses: "uba-local-expenses",
  files: "uba-local-files",
  reports: "uba-local-reports",
  settings: "uba-settings",
};

const defaultSettings = {
  workspaceName: "Main workspace",
  timezone: "UTC",
  language: localStorage.getItem("uba-lang") || "en",
  singlePage: true,
  notifications: true,
};

const insightsPanelsSeed = [
  {
    titleKey: "insights.panels.revenue.title",
    descKey: "insights.panels.revenue.desc",
    tagKey: "insights.panels.revenue.tag",
  },
  {
    titleKey: "insights.panels.clients.title",
    descKey: "insights.panels.clients.desc",
    tagKey: "insights.panels.clients.tag",
  },
  {
    titleKey: "insights.panels.projects.title",
    descKey: "insights.panels.projects.desc",
    tagKey: "insights.panels.projects.tag",
  },
  {
    titleKey: "insights.panels.workload.title",
    descKey: "insights.panels.workload.desc",
    tagKey: "insights.panels.workload.tag",
  },
];

const insightsBriefSeed = [
  {
    titleKey: "insights.brief.items.readout.title",
    descKey: "insights.brief.items.readout.desc",
  },
  {
    titleKey: "insights.brief.items.nextSteps.title",
    descKey: "insights.brief.items.nextSteps.desc",
  },
  {
    titleKey: "insights.brief.items.risks.title",
    descKey: "insights.brief.items.risks.desc",
  },
];

const clientSeed = [
  {
    id: "client-atlas",
    name: "Atlas Labs",
    company: "Atlas Labs",
    email: "ops@atlaslabs.io",
    phone: "+31 20 555 0192",
    notes: "Retainer – weekly standup on Mondays",
  },
  {
    id: "client-river",
    name: "River & Co",
    company: "River & Co",
    email: "hello@riverco.io",
    phone: "+44 20 7123 4412",
    notes: "Invoice renewal next month",
  },
];

const invoiceSeed = [
  {
    id: "inv-1001",
    client: "Atlas Labs",
    label: "Sprint 12 delivery",
    amount: 4200,
    status: "sent",
    due: "2024-11-01",
    notes: "Net 14",
  },
  {
    id: "inv-1002",
    client: "River & Co",
    label: "Discovery workshop",
    amount: 1800,
    status: "draft",
    due: "2024-11-05",
    notes: "Awaiting PO",
  },
];

const projectStagesSeed = [
  {
    id: "discovery",
    title: "Discovery",
    items: [
      {
        id: "proj-1",
        name: "Atlas Labs scope",
        client: "Atlas Labs",
        value: "€12k",
        note: "Interviews scheduled",
      },
    ],
  },
  {
    id: "proposal",
    title: "Proposal",
    items: [
      {
        id: "proj-2",
        name: "River & Co retainer",
        client: "River & Co",
        value: "€6k",
        note: "Sent draft SOW",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    items: [
      {
        id: "proj-3",
        name: "Nova Analytics rollout",
        client: "Nova Analytics",
        value: "€18k",
        note: "QA in progress",
      },
    ],
  },
  {
    id: "maintenance",
    title: "Maintenance",
    items: [
      {
        id: "proj-4",
        name: "Helio Support",
        client: "Helio",
        value: "€2.5k",
        note: "Monthly check-in",
      },
    ],
  },
];

const taskBoardSeed = [
  {
    id: "todo",
    title: "To do",
    tasks: [
      { id: "task-1", title: "Prep onboarding doc", owner: "Mara", due: "Today" },
      { id: "task-2", title: "Collect invoice proof", owner: "Jules", due: "Tomorrow" },
    ],
  },
  {
    id: "progress",
    title: "In progress",
    tasks: [
      { id: "task-3", title: "Pipeline review", owner: "Sam", due: "This week" },
    ],
  },
  {
    id: "review",
    title: "Review",
    tasks: [{ id: "task-4", title: "QA sprint 12", owner: "Lena", due: "Friday" }],
  },
  {
    id: "done",
    title: "Done",
    tasks: [{ id: "task-5", title: "Send follow-up deck", owner: "Mara", due: "Yesterday" }],
  },
];

// Additional demo seeds: leads, expenses, files, reports
const leadsSeed = [
  { id: genId('lead-'), name: 'Umbrella Corp', company: 'Umbrella', value: 12000, status: 'new' },
  { id: genId('lead-'), name: 'Wayne Enterprises', company: 'Wayne Ent.', value: 8000, status: 'contacted' },
  { id: genId('lead-'), name: 'Stark Solutions', company: 'Stark', value: 22000, status: 'qualified' },
];

const expensesSeed = [
  { id: genId('exp-'), date: formatDateISO(new Date()), category: 'Software', desc: 'Project management tool', amount: 49.99, status: 'paid' },
  { id: genId('exp-'), date: formatDateISO(new Date()), category: 'Travel', desc: 'Client visit', amount: 320.0, status: 'pending' },
];

const filesSeed = [
  { id: genId('file-'), name: 'Proposal_ACME.pdf', type: 'PDF', linked: 'Umbrella Corp', updated: formatDateISO(new Date()) },
];

const reportsSeed = { revenue: { thisMonth: 45230, invoices: 27 }, activeClients: 42 };

const automationTiles = [
  { id: "auto-1", name: "Invoice nudges", desc: "Ping clients 3 days after due date.", badge: "Live" },
  { id: "auto-2", name: "Client silence alert", desc: "Flag CRM records with 14 days inactivity.", badge: "Preview" },
  { id: "auto-3", name: "Task balance", desc: "Reassign when workload crosses 80%", badge: "Rule" },
];

const automationLogSeed = [
  { id: "log-1", name: "Invoice nudges", status: "Sent", when: "3m ago" },
  { id: "log-2", name: "Client silence alert", status: "Queued", when: "1h ago" },
  { id: "log-3", name: "Task balance", status: "Completed", when: "Today" },
];

const smartToolsSeed = [
  {
    id: "tool-brief",
    title: "Client brief",
    desc: "Auto-compile key facts from CRM, invoices, and tasks.",
    badge: "Context",
  },
  {
    id: "tool-outreach",
    title: "Smart outreach",
    desc: "Draft follow-up emails with next-best actions.",
    badge: "AI ops",
  },
  {
    id: "tool-actions",
    title: "Next-best action",
    desc: "Suggest what to prioritize based on pipeline and tasks.",
    badge: "Planner",
  },
  {
    id: "tool-insights",
    title: "Quick insights",
    desc: "Summaries of revenue pace and open invoices.",
    badge: "Insights",
  },
  {
    id: "tool-assistant",
    title: "UBA Assistant",
    desc: "Ask UBA Assistant for guided help and quick tips.",
    badge: "Assistant",
  },
];

const supportTopicsSeed = [
  {
    id: "topic-crm",
    title: "CRM hygiene",
    desc: "How to add, update, and archive clients without losing notes.",
    cta: "View SOP",
  },
  {
    id: "topic-invoices",
    title: "Invoice cadence",
    desc: "Weekly sweep for drafts, sent items, and overdue follow-ups.",
    cta: "Open checklist",
  },
  {
    id: "topic-tasks",
    title: "Task triage",
    desc: "When to move tasks to review or escalate to owners.",
    cta: "See guide",
  },
  {
    id: "topic-automations",
    title: "Automations quickstart",
    desc: "Enable reminders and alerts to keep the workspace tidy.",
    cta: "Preview flow",
  },
];

const mapKeyToCollection = (key) => {
  try {
    if (!key || typeof key !== 'string') return null;
    for (const k in LOCAL_KEYS) {
      if (Object.prototype.hasOwnProperty.call(LOCAL_KEYS, k) && LOCAL_KEYS[k] === key) return k;
    }
    return null;
  } catch (e) {
    return null;
  }
};

const readLocalData = (key, fallback) => {
  try {
    const store = window.ubaStore;
    const coll = mapKeyToCollection(key);
    if (store && coll) {
      // prefer store collection getter
      const helper = store[coll];
      if (helper && typeof helper.getAll === 'function') return helper.getAll() || fallback;
      // fallback to generic loader
      if (typeof store.loadCollection === 'function') return store.loadCollection(coll) || fallback;
    }
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("readLocalData error", e);
    return fallback;
  }
};

const writeLocalData = (key, value) => {
  try {
    const store = window.ubaStore;
    const coll = mapKeyToCollection(key);
    if (store && coll) {
      // use store save if available
      const helper = store[coll];
      if (helper && typeof helper.saveAll === 'function') return helper.saveAll(Array.isArray(value) ? value : [value]);
      if (typeof store.saveCollection === 'function') return store.saveCollection(coll, value);
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("writeLocalData error", e);
  }
};

const ensureSeedData = (key, seed) => {
  try {
    const store = window.ubaStore;
    const coll = mapKeyToCollection(key);
    if (store && coll && typeof store.ensureSeed === 'function') {
      return store.ensureSeed(coll, seed || []);
    }
    const stored = readLocalData(key, null);
    if (stored === null || stored === undefined) {
      writeLocalData(key, seed);
      return Array.isArray(seed) ? [...seed] : seed;
    }
    return stored;
  } catch (e) {
    console.warn('ensureSeedData error', e);
    const stored = readLocalData(key, null);
    if (stored === null || stored === undefined) {
      writeLocalData(key, seed);
      return Array.isArray(seed) ? [...seed] : seed;
    }
    return stored;
  }
};

let settingsState = null;

const loadSettingsState = () => {
  if (settingsState) return settingsState;
  const stored = readLocalData(LOCAL_KEYS.settings, {});
  settingsState = { ...defaultSettings, ...(stored || {}) };
  return settingsState;
};

const saveSettingsState = (updates = {}) => {
  settingsState = { ...loadSettingsState(), ...updates };
  writeLocalData(LOCAL_KEYS.settings, settingsState);
  return settingsState;
};

// Clients page helpers
let clientsFormBound = false;
let clientsEditingId = null;

const renderClientsPage = () => {
  const table = document.getElementById("clients-page-table");
  const totalEl = document.getElementById("clients-total");
  const recentEl = document.getElementById("clients-recent");
  const highlightEl = document.getElementById("clients-highlight");
  const form = document.getElementById("clients-page-form");
  const errorBox = document.getElementById("clients-page-error");
  if (!table) return;

  if (form && !clientsFormBound) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const store = window.ubaStore;
      const clients = (store && store.clients.getAll()) || ensureSeedData(LOCAL_KEYS.clients, clientSeed) || [];
      const nameInput = document.getElementById("clients-name");
      const emailInput = document.getElementById("clients-email");
      const companyInput = document.getElementById("clients-company");
      const phoneInput = document.getElementById("clients-phone");
      const notesInput = document.getElementById("clients-notes");
      const submitBtn = form.querySelector("button[type='submit']");

      if (errorBox) errorBox.textContent = "";

      const name = nameInput?.value.trim();
      if (!name) {
        if (errorBox) errorBox.textContent = t("form.clientName");
        return;
      }

      const payload = {
        name,
        email: emailInput?.value.trim() || "",
        company: companyInput?.value.trim() || "",
        phone: phoneInput?.value.trim() || "",
        notes: notesInput?.value.trim() || "",
      };

      if (clientsEditingId) {
        // update via store if available, otherwise update local array
        if (store && store.clients) {
          store.clients.update(clientsEditingId, payload);
        } else {
          const next = clients.map((c) => (c.id === clientsEditingId ? { ...c, ...payload, updatedAt: new Date().toISOString() } : c));
          writeLocalData(LOCAL_KEYS.clients, next);
        }
      } else {
        // create new client (centralized helper)
        createClient(payload);
      }
      clientsEditingId = null;

      if (nameInput) nameInput.value = "";
      if (emailInput) emailInput.value = "";
      if (companyInput) companyInput.value = "";
      if (phoneInput) phoneInput.value = "";
      if (notesInput) notesInput.value = "";
      if (submitBtn) submitBtn.textContent = t("form.saveClient");

      renderClientsPage();
    });
    clientsFormBound = true;
  }

  table.innerHTML = "";

  // Toolbar: search, sort, export
  const toolbarId = 'clients-toolbar';
  let toolbar = document.getElementById(toolbarId);
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = toolbarId;
    toolbar.style.display = 'flex'; toolbar.style.gap = '8px'; toolbar.style.marginBottom = '10px';
    toolbar.innerHTML = `<input id="clients-search" placeholder="${t('table.search','Search')}" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(55,65,81,.7);" /><select id="clients-sort" style="width:160px;padding:8px;border-radius:8px;border:1px solid rgba(55,65,81,.7);"><option value="name_asc">${t('sort.nameAsc','Name ↑')}</option><option value="name_desc">${t('sort.nameDesc','Name ↓')}</option></select><button id="clients-export" class="uba-btn-ghost">${t('action.export','Export')}</button>`;
    table.parentElement.insertBefore(toolbar, table);

    toolbar.querySelector('#clients-search').addEventListener('input', () => renderClientsPage());
    toolbar.querySelector('#clients-sort').addEventListener('change', () => renderClientsPage());
    toolbar.querySelector('#clients-export').addEventListener('click', () => {
      const store = window.ubaStore;
      const clientsList = (store && store.clients.getAll()) || ensureSeedData(LOCAL_KEYS.clients, clientSeed) || [];
      if (!clientsList.length) return alert(t('export.noData','No data to export'));
      const rows = clientsList.map(c => ({ id: c.id, name: c.name, company: c.company, email: c.email, phone: c.phone }));
      downloadCSV('clients.csv', rows);
    });
  }

  const store = window.ubaStore;
  const clients = (store && store.clients.getAll()) || ensureSeedData(LOCAL_KEYS.clients, clientSeed) || [];

  const searchInput = document.getElementById('clients-search');
  const sortSelect = document.getElementById('clients-sort');
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  let filtered = clients.filter(c => {
    if (!q) return true;
    return (c.name||'').toLowerCase().includes(q) || (c.company||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.phone||'').toLowerCase().includes(q);
  });
  const sortVal = sortSelect ? sortSelect.value : 'name_asc';
  filtered.sort((a,b)=> {
    if (sortVal === 'name_desc') return (b.name||'').localeCompare(a.name||'');
    return (a.name||'').localeCompare(b.name||'');
  });

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = t("clients.none");
    tr.appendChild(td);
    table.appendChild(tr);
  } else {
    filtered.forEach((client) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${client.name || ""}</td>
        <td>${client.company || ""}</td>
        <td>${client.email || ""}</td>
        <td>${client.phone || ""}</td>
        <td></td>
      `;

      const actionsCell = tr.querySelector("td:last-child");
      if (actionsCell) {
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "uba-btn-link";
        editBtn.textContent = t("action.edit", "Edit");
        editBtn.addEventListener("click", () => {
          clientsEditingId = client.id;
          const nameInput = document.getElementById("clients-name");
          const emailInput = document.getElementById("clients-email");
          const companyInput = document.getElementById("clients-company");
          const phoneInput = document.getElementById("clients-phone");
          const notesInput = document.getElementById("clients-notes");
          const submitBtn = form?.querySelector("button[type='submit']");

          if (nameInput) nameInput.value = client.name || "";
          if (emailInput) emailInput.value = client.email || "";
          if (companyInput) companyInput.value = client.company || "";
          if (phoneInput) phoneInput.value = client.phone || "";
          if (notesInput) notesInput.value = client.notes || "";
          if (submitBtn) submitBtn.textContent = t("form.updateClient", "Update client");
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "uba-btn-link";
        deleteBtn.textContent = t("action.delete");
        deleteBtn.addEventListener("click", () => {
          if (!confirm(t("clients.deleteConfirm"))) return;
          if (store && store.clients) store.clients.delete(client.id);
          else {
            const nextClients = clients.filter((c) => c.id !== client.id);
            writeLocalData(LOCAL_KEYS.clients, nextClients);
          }
          renderClientsPage();
        });

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
      }

      table.appendChild(tr);
    });
  }

  if (totalEl) totalEl.textContent = clients.length;
  if (recentEl) recentEl.textContent = clients[0]?.notes || t("clients.none");
  if (highlightEl) {
    highlightEl.textContent = clients.length
      ? t("view.clients.tipDone", "Clients saved locally")
      : t("view.clients.tip");
  }
};

// Invoices page helpers
let invoicesFormBound = false;
let invoiceEditingId = null;

const renderInvoicePage = () => {
  const table = document.getElementById("invoice-table-body");
  const countEl = document.getElementById("invoice-count");
  const totalEl = document.getElementById("invoice-total");
  const form = document.getElementById("invoice-form");
  const errorBox = document.getElementById("invoice-error");
  if (!table) return;

  if (form && !invoicesFormBound) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const store = window.ubaStore;
      const invoices = (store && store.invoices.getAll()) || ensureSeedData(LOCAL_KEYS.invoices, invoiceSeed) || [];
      const clientInput = document.getElementById("invoice-client");
      const labelInput = document.getElementById("invoice-label");
      const amountInput = document.getElementById("invoice-amount");
      const statusSelect = document.getElementById("invoice-status");
      const dueInput = document.getElementById("invoice-due");
      const notesInput = document.getElementById("invoice-notes");
      const submitBtn = form.querySelector("button[type='submit']");

      if (errorBox) errorBox.textContent = "";

      // clear per-field errors
      clearFieldError(clientInput); clearFieldError(amountInput);

      const client = clientInput?.value.trim();
      const amount = amountInput ? Number(amountInput.value) : NaN;

      if (!client) {
        setFieldError(clientInput, t('form.clientName'));
        if (errorBox) errorBox.textContent = t('errors.form');
        return;
      }
      if (Number.isNaN(amount) || amount < 0) {
        setFieldError(amountInput, t('errors.invalidAmount','Invalid amount'));
        return;
      }

      const payload = {
        client,
        label: labelInput?.value.trim() || t("mini.untitled"),
        amount,
        status: statusSelect?.value || "draft",
        due: dueInput?.value || "",
        notes: notesInput?.value.trim() || "",
      };

      try {
        setButtonLoading(form.querySelector('button[type=submit]'), true, t('action.saving','Saving...'));
        if (invoiceEditingId) {
          if (store && store.invoices) {
            store.invoices.update(invoiceEditingId, payload);
          } else {
            const next = invoices.map((inv) => (inv.id === invoiceEditingId ? { ...inv, ...payload, updatedAt: new Date().toISOString() } : inv));
            writeLocalData(LOCAL_KEYS.invoices, next);
          }
        } else {
          if (store && store.invoices) store.invoices.create(payload);
          else {
            const item = { id: `inv-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...payload };
            writeLocalData(LOCAL_KEYS.invoices, [item, ...invoices]);
          }
        }
        setButtonLoading(form.querySelector('button[type=submit]'), false);
        if (window.showToast) window.showToast(t('invoices.saved','Invoice saved'));
      } catch (err) {
        setButtonLoading(form.querySelector('button[type=submit]'), false);
        console.error('invoice save error', err);
        if (errorBox) errorBox.textContent = err.message || t('errors.save');
      }
      invoiceEditingId = null;

      if (clientInput) clientInput.value = "";
      if (labelInput) labelInput.value = "";
      if (amountInput) amountInput.value = "";
      if (dueInput) dueInput.value = "";
      if (notesInput) notesInput.value = "";
      if (submitBtn) submitBtn.textContent = t("form.saveInvoice");

      renderInvoicePage();
    });
    invoicesFormBound = true;
  }

  table.innerHTML = "";

  // toolbar: search / status filter / sort / export
  const toolbarId = 'invoices-toolbar';
  let toolbar = document.getElementById(toolbarId);
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = toolbarId;
    toolbar.style.display = 'flex'; toolbar.style.gap = '8px'; toolbar.style.marginBottom = '10px';
    toolbar.innerHTML = `<input id="invoices-search" placeholder="${t('table.search','Search')}" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(55,65,81,.7);" /><select id="invoices-filter" style="width:140px;padding:8px;border-radius:8px;border:1px solid rgba(55,65,81,.7);"><option value="all">${t('filter.all','All')}</option><option value="draft">${t('form.draft','Draft')}</option><option value="sent">${t('form.sent','Sent')}</option><option value="paid">${t('form.paid','Paid')}</option></select><select id="invoices-sort" style="width:160px;padding:8px;border-radius:8px;border:1px solid rgba(55,65,81,.7);"><option value="date_desc">${t('sort.dateDesc','Date ↓')}</option><option value="date_asc">${t('sort.dateAsc','Date ↑')}</option><option value="amount_desc">${t('sort.amountDesc','Amount ↓')}</option><option value="amount_asc">${t('sort.amountAsc','Amount ↑')}</option></select><button id="invoices-export" class="uba-btn-ghost">${t('action.export','Export')}</button>`;
    table.parentElement.insertBefore(toolbar, table);
    toolbar.querySelector('#invoices-search').addEventListener('input', ()=> renderInvoicePage());
    toolbar.querySelector('#invoices-filter').addEventListener('change', ()=> renderInvoicePage());
    toolbar.querySelector('#invoices-sort').addEventListener('change', ()=> renderInvoicePage());
    toolbar.querySelector('#invoices-export').addEventListener('click', ()=>{
      const store = window.ubaStore;
      const invoicesList = (store && store.invoices.getAll()) || ensureSeedData(LOCAL_KEYS.invoices, invoiceSeed) || [];
      if (!invoicesList.length) return alert(t('export.noData','No data to export'));
      const rows = invoicesList.map(i => ({ id: i.id, client: i.client, label:i.label, amount: i.amount, status:i.status, due:i.due }));
      downloadCSV('invoices.csv', rows);
    });
  }

  const store = window.ubaStore;
  const invoices = (store && store.invoices.getAll()) || ensureSeedData(LOCAL_KEYS.invoices, invoiceSeed) || [];

  const q = (document.getElementById('invoices-search')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('invoices-filter')?.value || 'all';
  const sortVal = document.getElementById('invoices-sort')?.value || 'date_desc';

  let filtered = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (!q) return true;
    return (inv.client||'').toLowerCase().includes(q) || (inv.label||'').toLowerCase().includes(q) || (inv.id||'').toLowerCase().includes(q);
  });

  filtered.sort((a,b)=>{
    if (sortVal === 'amount_desc') return Number(b.amount||0)-Number(a.amount||0);
    if (sortVal === 'amount_asc') return Number(a.amount||0)-Number(b.amount||0);
    const da = new Date(a.due||a.createdAt||0).getTime();
    const db = new Date(b.due||b.createdAt||0).getTime();
    if (sortVal === 'date_asc') return da - db;
    return db - da;
  });

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = t("mini.none");
    tr.appendChild(td);
    table.appendChild(tr);
  } else {
    filtered.forEach((inv) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${inv.client}</td>
        <td>${inv.label}</td>
        <td>€ ${inv.amount.toLocaleString()}</td>
        <td><span class="uba-pill">${inv.status}</span></td>
        <td>${inv.due || "—"}</td>
        <td></td>
      `;

      const actionsCell = tr.querySelector("td:last-child");
      if (actionsCell) {
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "uba-btn-link";
        editBtn.textContent = t("action.edit", "Edit");
        editBtn.addEventListener("click", () => {
          invoiceEditingId = inv.id;
          const clientInput = document.getElementById("invoice-client");
          const labelInput = document.getElementById("invoice-label");
          const amountInput = document.getElementById("invoice-amount");
          const statusSelect = document.getElementById("invoice-status");
          const dueInput = document.getElementById("invoice-due");
          const notesInput = document.getElementById("invoice-notes");
          const submitBtn = form?.querySelector("button[type='submit']");

          if (clientInput) clientInput.value = inv.client;
          if (labelInput) labelInput.value = inv.label;
          if (amountInput) amountInput.value = inv.amount;
          if (statusSelect) statusSelect.value = inv.status;
          if (dueInput) dueInput.value = inv.due || "";
          if (notesInput) notesInput.value = inv.notes || "";
          if (submitBtn) submitBtn.textContent = t("form.updateInvoice", "Update invoice");
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "uba-btn-link";
        deleteBtn.textContent = t("action.delete");
        deleteBtn.addEventListener("click", () => {
          if (!confirm(t("clients.deleteConfirm"))) return;
          if (store && store.invoices) store.invoices.delete(inv.id);
          else {
            const nextInvoices = invoices.filter((item) => item.id !== inv.id);
            writeLocalData(LOCAL_KEYS.invoices, nextInvoices);
          }
          renderInvoicePage();
        });

        // view/print button
        const viewBtn = document.createElement('button'); viewBtn.type='button'; viewBtn.className='uba-btn-link'; viewBtn.textContent = t('action.view','View');
        viewBtn.addEventListener('click', ()=> { printInvoiceById(inv.id); });

        actionsCell.appendChild(viewBtn);
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
      }

      table.appendChild(tr);
    });
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  if (countEl) countEl.textContent = invoices.length;
  if (totalEl) totalEl.textContent = `€ ${totalAmount.toLocaleString()}`;
};

// Projects board
const renderProjectsBoard = () => {
  const container = document.getElementById("projects-columns");
  if (!container) return;
  const store = window.ubaStore;
  const stages = (store && store.projects.getAll()) || ensureSeedData(LOCAL_KEYS.projects, projectStagesSeed) || [];

  container.innerHTML = "";

  // Add simple create form at top of container
  const formBar = document.createElement('div');
  formBar.style.display = 'flex'; formBar.style.gap = '8px'; formBar.style.marginBottom = '10px';
  formBar.innerHTML = `<input id="proj-name" placeholder="Project name" style="flex:1;"/><input id="proj-client" placeholder="Client" style="width:180px;"/><input id="proj-budget" placeholder="Budget" style="width:120px;"/><select id="proj-stage"><option value="discovery">Discovery</option><option value="proposal">Proposal</option><option value="delivery">Delivery</option><option value="maintenance">Maintenance</option></select><button id="proj-add" class="uba-btn-primary">Add project</button>`;
  container.appendChild(formBar);

  const addBtn = formBar.querySelector('#proj-add');
  addBtn.addEventListener('click', () => {
    const nameEl = document.getElementById('proj-name');
    const clientEl = document.getElementById('proj-client');
    const budgetEl = document.getElementById('proj-budget');
    const name = nameEl.value.trim();
    if (!name) { setFieldError(nameEl, t('form.projectName','Project name required')); nameEl.focus(); return; }
    const client = clientEl.value.trim();
    const budget = budgetEl.value.trim();
    const stageKey = document.getElementById('proj-stage').value;

    // If store holds an array of stages, insert into matching stage.items
    if (Array.isArray(stages) && stages.length && (stages[0].items || stages[0].title)) {
      const targetStage = stages.find(s => (s.id === stageKey || s.title === stageKey || s.id === stageKey));
      const newItem = { id: `proj-${Date.now()}`, name, client, budget, note: '' };
      if (targetStage) {
        targetStage.items = targetStage.items || [];
        targetStage.items.push(newItem);
      } else {
        // fallback: push into first stage
        stages[0].items = stages[0].items || [];
        stages[0].items.push(newItem);
      }
      if (store && store.projects) store.projects.saveAll(stages);
    } else if (store && store.projects) {
      // fallback: create as flat project
        store.projects.create({ id: genId('proj-'), name, client, budget, stage: stageKey });
        if (window.showToast) window.showToast(t('projects.added','Project added'));
    }

    document.getElementById('proj-name').value=''; document.getElementById('proj-client').value=''; document.getElementById('proj-budget').value='';
    renderProjectsBoard();
  });

  stages.forEach((stage) => {
    const column = document.createElement("div");
    column.style.background = "#f9fafb";
    column.style.border = "1px solid #e5e7eb";
    column.style.borderRadius = "12px";
    column.style.padding = "12px";
    column.style.display = "flex";
    column.style.flexDirection = "column";
    column.style.gap = "8px";

    const title = document.createElement("div");
    title.className = "uba-card-title";
    title.textContent = stage.title || stage.id || stage.name;
    column.appendChild(title);

    const items = stage.items || stage.projects || [];
    if (items.length === 0) {
      const empty = document.createElement('div'); empty.className='uba-pipe-item'; empty.textContent = 'No projects in this stage.'; column.appendChild(empty);
    }

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "uba-support-card";
      const valueLine = item.budget || item.value ? `<span class="uba-chip">${item.budget||item.value}</span>` : "";
      card.innerHTML = `
        <div class="uba-support-icon">📌</div>
        <div>
          <h4>${item.name}</h4>
          <p>${item.client || ''}</p>
          <div class="uba-chip-row">
            ${valueLine}
            <span class="uba-chip soft">${item.note || ''}</span>
          </div>
        </div>
      `;

      const actions = document.createElement('div'); actions.className='uba-chip-row';
      const editBtn = document.createElement('button'); editBtn.type='button'; editBtn.className='uba-btn-link'; editBtn.textContent='Edit';
      editBtn.addEventListener('click', ()=>{
        const nameNew = prompt('Project name', item.name) || item.name;
        const clientNew = prompt('Client', item.client) || item.client;
        const budgetNew = prompt('Budget', item.budget||item.value) || item.budget||item.value;
        // Support both shapes: grouped stages with nested items, or flat project list
        try {
          if (Array.isArray(stages) && stages.length && (stages[0].items || stages[0].title)) {
            // update nested item inside stages
            let updated = false;
            for (const s of stages) {
              s.items = s.items || [];
              for (let i = 0; i < s.items.length; i++) {
                if (s.items[i].id === item.id) {
                  s.items[i] = { ...s.items[i], name: nameNew, client: clientNew, budget: budgetNew, updatedAt: new Date().toISOString() };
                  updated = true;
                  break;
                }
              }
              if (updated) break;
            }
            if (updated && store && store.projects) store.projects.saveAll(stages);
          } else if (store && store.projects) {
            store.projects.update(item.id, { name: nameNew, client: clientNew, budget: budgetNew });
          }
        } catch (e) {
          console.error('Project edit error', e);
        }
        renderProjectsBoard();
      });
      const delBtn = document.createElement('button'); delBtn.type='button'; delBtn.className='uba-btn-link'; delBtn.textContent='Delete';
      delBtn.addEventListener('click', ()=>{
        if (!confirm(t('projects.deleteConfirm','Delete project?'))) return;
        try {
          if (Array.isArray(stages) && stages.length && (stages[0].items || stages[0].title)) {
            for (const s of stages) {
              s.items = s.items || [];
              const before = s.items.length;
              s.items = s.items.filter(it => it.id !== item.id);
              if (s.items.length !== before) {
                if (store && store.projects) store.projects.saveAll(stages);
                break;
              }
            }
          } else if (store && store.projects) {
            store.projects.delete(item.id);
          }
        } catch (e) {
          console.error('Project delete error', e);
        }
        renderProjectsBoard();
      });
      actions.appendChild(editBtn); actions.appendChild(delBtn);
      card.appendChild(actions);

      column.appendChild(card);
    });

    container.appendChild(column);
  });
};

// Tasks board
const renderTasksBoard = () => {
  const container = document.getElementById("tasks-columns");
  if (!container) return;
  const store = window.ubaStore;
  const columns = (store && store.tasks.getAll()) || ensureSeedData(LOCAL_KEYS.tasks, taskBoardSeed) || [];

  container.innerHTML = "";

  // add quick task form
  const formBar = document.createElement('div'); formBar.style.display='flex'; formBar.style.gap='8px'; formBar.style.marginBottom='10px';
  formBar.innerHTML = `<input id="task-title" placeholder="Task title" style="flex:1;"/><input id="task-owner" placeholder="Owner" style="width:140px;"/><input id="task-due" placeholder="Due" style="width:120px;"/><select id="task-col"><option value="todo">To do</option><option value="progress">In progress</option><option value="review">Review</option><option value="done">Done</option></select><button id="task-add" class="uba-btn-primary">Add task</button>`;
  container.appendChild(formBar);
  // If there are no columns, show a friendly empty state
  if (!Array.isArray(columns) || columns.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'uba-pipe-item';
    empty.textContent = t('tasks.empty','No tasks yet. Add a task to get started.');
    container.appendChild(empty);
    return;
  }
  document.getElementById('task-add').addEventListener('click', ()=>{
    const titleEl = document.getElementById('task-title');
    const ownerEl = document.getElementById('task-owner');
    const dueEl = document.getElementById('task-due');
    const title = titleEl.value.trim(); if(!title){ setFieldError(titleEl, t('form.taskTitle','Title required')); titleEl.focus(); return; }
    const owner = ownerEl.value.trim(); const due = dueEl.value.trim(); const colId = document.getElementById('task-col').value;
    // find column
    const cols = columns;
    const target = cols.find(c=>c.id===colId) || cols[0];
    const newTask = { id: `task-${Date.now()}`, title, owner, due };
    if (!target.tasks) target.tasks = [];
    target.tasks.push(newTask);
    if (store && store.tasks) store.tasks.saveAll(cols);
    renderTasksBoard();
    if (window.showToast) window.showToast(t('tasks.added','Task added'));
  });

  const moveTask = (taskId, fromId, direction) => {
    const currentIndex = columns.findIndex((col) => col.id === fromId);
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const sourceColumn = columns[currentIndex];
    const targetColumn = columns[targetIndex];
    const task = sourceColumn.tasks.find((t) => t.id === taskId);
    if (!task) return;

    sourceColumn.tasks = sourceColumn.tasks.filter((t) => t.id !== taskId);
    targetColumn.tasks = [...(targetColumn.tasks||[]), task];
    if (store && store.tasks) store.tasks.saveAll(columns);
    renderTasksBoard();
  };

  columns.forEach((col, colIndex) => {
    const column = document.createElement("div");
    column.style.background = "#f9fafb";
    column.style.border = "1px solid #e5e7eb";
    column.style.borderRadius = "12px";
    column.style.padding = "12px";
    column.style.display = "flex";
    column.style.flexDirection = "column";
    column.style.gap = "8px";

    const title = document.createElement("div");
    title.className = "uba-card-title";
    title.textContent = col.title || col.id;
    column.appendChild(title);

    (col.tasks||[]).forEach((task) => {
      const card = document.createElement("div");
      card.className = "uba-support-card";
      card.innerHTML = `
        <div class="uba-support-icon">✅</div>
        <div>
          <h4>${task.title}</h4>
          <p>${t("view.tasks.owner", "Owner")}: ${task.owner || ''} · ${task.due || ''}</p>
        </div>
      `;

      const actions = document.createElement("div");
      actions.className = "uba-chip-row";

      if (colIndex > 0) {
        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.className = "uba-btn-link";
        backBtn.textContent = t("view.tasks.moveBack", "Move back");
        backBtn.addEventListener("click", () => moveTask(task.id, col.id, -1));
        actions.appendChild(backBtn);
      }

      if (colIndex < columns.length - 1) {
        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "uba-btn-link";
        nextBtn.textContent = t("view.tasks.moveForward", "Move next");
        nextBtn.addEventListener("click", () => moveTask(task.id, col.id, 1));
        actions.appendChild(nextBtn);
      }

      const editBtn = document.createElement('button'); editBtn.type='button'; editBtn.className='uba-btn-link'; editBtn.textContent='Edit';
      editBtn.addEventListener('click', ()=>{
        const title = prompt('Title', task.title)||task.title; const owner = prompt('Owner', task.owner)||task.owner; const due = prompt('Due', task.due)||task.due;
        task.title = title; task.owner = owner; task.due = due;
        if (store && store.tasks) store.tasks.saveAll(columns);
        renderTasksBoard();
      });

      const delBtn = document.createElement('button'); delBtn.type='button'; delBtn.className='uba-btn-link'; delBtn.textContent='Delete';
      delBtn.addEventListener('click', ()=>{ if(!confirm(t('tasks.deleteConfirm','Delete task?'))) return; const colTasks = col.tasks || []; col.tasks = colTasks.filter(t=>t.id!==task.id); if(store && store.tasks) store.tasks.saveAll(columns); renderTasksBoard(); });

      actions.appendChild(editBtn); actions.appendChild(delBtn);
      card.appendChild(actions);
      column.appendChild(card);
    });

    container.appendChild(column);
  });
};

// Automations overview
const renderAutomationsPage = () => {
  const tileContainer = document.getElementById("automation-tiles");
  const logBody = document.getElementById("automation-log-body");
  if (!tileContainer || !logBody) return;

  tileContainer.innerHTML = "";
  automationTiles.forEach((tile) => {
    const card = document.createElement("div");
    card.className = "uba-support-card";
    card.innerHTML = `
      <div class="uba-support-icon">🤖</div>
      <div>
        <h4>${tile.name}</h4>
        <p>${tile.desc}</p>
        <div class="uba-chip-row"><span class="uba-chip">${tile.badge}</span></div>
      </div>
    `;
    tileContainer.appendChild(card);
  });

  logBody.innerHTML = "";
  automationLogSeed.forEach((log) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.name}</td>
      <td>${log.status}</td>
      <td>${log.when}</td>
    `;
    logBody.appendChild(tr);
  });
};

// Smart tools cards
const renderSmartToolsGrid = () => {
  const grid = document.getElementById("smart-tools-grid");
  if (!grid) return;
  grid.innerHTML = "";

  try {
    // Compose dynamic tools based on local data (workspace-scoped via ubaStore)
    const insights = quickInsights();
    const actions = nextBestActions(6) || [];
    const topClients = getTopClientsByRevenue(3) || [];
    const inactive = getInactiveClients(60) || [];

    const cards = [];

    // Quick insights card
    cards.push({ title: t('tool.insights.title','Quick insights'), desc: t('tool.insights.desc','Snapshot of revenue, overdue tasks and expenses.'), badge: 'Insights', body: (() => {
      const lines = [];
      if (insights.topClients && insights.topClients.length) lines.push(t('tool.insights.topClients','Top clients:') + ' ' + insights.topClients.map(c=>`${c.name} (€${Number(c.amount||0).toLocaleString()})`).join(', '));
      lines.push(t('tool.insights.overdue','Overdue tasks:') + ' ' + (insights.overdueTasksCount || 0));
      if (insights.topExpenseCategory) lines.push(t('tool.insights.topExpense','Top expense:') + ` ${insights.topExpenseCategory.category} (€${Number(insights.topExpenseCategory.amount||0).toLocaleString()})`);
      return lines.join('\n');
    })() });

    // Next-best actions card
    cards.push({ title: t('tool.actions.title','Next-best actions'), desc: t('tool.actions.desc','Short list of suggested actions.'), badge: `${actions.length}`, body: (actions.length ? actions.slice(0,4).map(a=>`• ${a.title}`).join('\n') : t('tool.actions.empty','No immediate actions')) });

    // Top clients
    if (topClients.length) {
      cards.push({ title: t('tool.topClients.title','Top clients'), desc: t('tool.topClients.desc','Clients by revenue'), badge: 'CRM', body: topClients.map(c => `• ${c.name}: €${Number(c.amount||0).toLocaleString()}`).join('\n') });
    }

    // Re-engage inactive
    if (inactive.length) {
      cards.push({ title: t('tool.reengage.title','Re-engage clients'), desc: t('tool.reengage.desc','Clients without recent invoices'), badge: 'CRM', body: inactive.slice(0,4).map(c=>`• ${c.name}`).join('\n') });
    }

    // UBA Assistant card (always present)
    cards.push({ title: t('tool.assistant.title','UBA Assistant'), desc: t('tool.assistant.desc','Ask UBA Assistant for help and quick tips.'), badge: 'Assistant', body: t('tool.assistant.hint','Click to open the assistant') });

    // Render cards
    cards.forEach((tool) => {
      const card = document.createElement('div');
      card.className = 'uba-support-card';
      card.innerHTML = `
        <div class="uba-support-icon">🧠</div>
        <div>
          <h4>${tool.title}</h4>
          <p>${tool.desc}</p>
          <div style="white-space:pre-wrap;margin-top:8px;color:var(--muted, #6b7280);">${escapeHtml(tool.body || '')}</div>
          <div class="uba-chip-row"><span class="uba-chip">${tool.badge || ''}</span></div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    console.error('renderSmartToolsGrid error', e);
    // fallback to static seed so UI never breaks
    smartToolsSeed.forEach((tool) => {
      const card = document.createElement('div');
      card.className = 'uba-support-card';
      card.innerHTML = `
        <div class="uba-support-icon">🧠</div>
        <div>
          <h4>${tool.title}</h4>
          <p>${tool.desc}</p>
          <div class="uba-chip-row"><span class="uba-chip">${tool.badge}</span></div>
        </div>
      `;
      grid.appendChild(card);
    });
  }
};

// ---------------------
// Smart Tools — standalone page helpers
// ---------------------
function populateClientSelect(selectEl, searchEl) {
  try {
    const store = window.ubaStore;
    const clients = (store && store.clients.getAll()) || ensureSeedData(LOCAL_KEYS.clients, clientSeed) || [];
    selectEl.innerHTML = '';
    const emptyOpt = document.createElement('option'); emptyOpt.value = ''; emptyOpt.textContent = t('table.client','Client'); selectEl.appendChild(emptyOpt);
    clients.forEach(c => {
      const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name || c.company || c.email || c.id; selectEl.appendChild(opt);
    });

    if (searchEl) {
      searchEl.addEventListener('input', (e) => {
        const q = (e.target.value || '').toLowerCase().trim();
        Array.from(selectEl.options).forEach(opt => {
          if (!opt.value) return opt.hidden = false;
          const text = (opt.textContent||'').toLowerCase();
          opt.hidden = q ? !text.includes(q) : false;
        });
      });
    }
  } catch (e) { console.error('populateClientSelect', e); }
}

function renderSmartClientBrief(clientId) {
  const container = document.getElementById('smart-client-brief');
  if (!container) return;
  container.innerHTML = '';
  try {
    const client = getClientById(clientId);
    if (!client) {
      container.innerHTML = `<div class="uba-support-card">${t('smart.client.selectPrompt','Select a client to view a brief.')}</div>`;
      return;
    }

    const invoices = getInvoicesByClient(client.name || client.company || '');
    const openInvoices = invoices.filter(i => !i.status || i.status !== 'paid');
    const projects = getProjectsByClient(client.name || client.company || '');
    const tasks = getTasksByClient(client.name || client.company || '');

    const lastActivityDate = (() => {
      const dates = [];
      invoices.forEach(i => i.updatedAt && dates.push(new Date(i.updatedAt).getTime()));
      projects.forEach(p => p.updatedAt && dates.push(new Date(p.updatedAt).getTime()));
      tasks.forEach(t => t.updatedAt && dates.push(new Date(t.updatedAt).getTime()));
      if (dates.length === 0) return t('smart.client.noActivity','No recent activity');
      const max = Math.max(...dates);
      return formatDateISO(new Date(max));
    })();

    const card = document.createElement('div');
    card.className = 'uba-support-card';
    card.innerHTML = `
      <div class="uba-support-icon">👤</div>
      <div>
        <h4>${escapeHtml(client.name || client.company || client.email || '')}</h4>
        <p>${escapeHtml(client.email || '')} ${client.phone ? '· ' + escapeHtml(client.phone) : ''}</p>
        <p style="margin-top:8px;color:var(--muted,#6b7280);">${t('smart.client.lastActivity','Last activity')}: ${escapeHtml(lastActivityDate)}</p>
        <div class="uba-chip-row" style="margin-top:8px;">
          <span class="uba-chip soft">${t('smart.client.openInvoices','Open invoices')}: ${openInvoices.length}</span>
          <span class="uba-chip soft">${t('smart.client.activeProjects','Active projects')}: ${projects.length}</span>
          <span class="uba-chip soft">${t('smart.client.recentTasks','Recent tasks')}: ${tasks.length}</span>
        </div>
        <p style="white-space:pre-wrap;margin-top:8px;color:var(--muted,#6b7280);">${escapeHtml(client.notes || '')}</p>
      </div>
    `;
    container.appendChild(card);
  } catch (e) { console.error('renderSmartClientBrief', e); }
}

function renderSmartOutreach(clientId) {
  const container = document.getElementById('smart-outreach');
  if (!container) return;
  container.innerHTML = '';
  try {
    const client = getClientById(clientId);
    if (!client) {
      container.innerHTML = `<div class="uba-support-card">${t('tool.outreach.hint','Select a client to see outreach suggestions.')}</div>`;
      return;
    }
    const templates = suggestOutreachTemplates(client) || [];
    if (!templates.length) {
      container.innerHTML = `<div class="uba-support-card">${t('tool.outreach.empty','No suggestions at the moment.')}</div>`;
      return;
    }
    templates.slice(0,3).forEach(tpl => {
      const c = document.createElement('div'); c.className='uba-support-card';
      c.innerHTML = `<div class="uba-support-icon">✉️</div><div><h4>${escapeHtml(tpl.title)}</h4><p style="white-space:pre-wrap;color:var(--muted,#6b7280);">${escapeHtml(tpl.text)}</p></div>`;
      container.appendChild(c);
    });
  } catch (e) { console.error('renderSmartOutreach', e); }
}

function renderNextBestActionsPanel() {
  const container = document.getElementById('smart-actions');
  if (!container) return;
  container.innerHTML = '';
  try {
    const actions = nextBestActions(6) || [];
    if (!actions.length) {
      container.innerHTML = `<div class="uba-support-card">${t('tool.actions.empty','No immediate actions')}</div>`;
      return;
    }
    actions.slice(0,5).forEach(a => {
      const c = document.createElement('div'); c.className='uba-support-card';
      const body = a.meta && (a.meta.client || a.meta.name || a.meta.title) ? (a.meta.client || a.meta.name || a.meta.title) : '';
      c.innerHTML = `<div class="uba-support-icon">⚡</div><div><h4>${escapeHtml(a.title)}</h4><p style="color:var(--muted,#6b7280);">${escapeHtml(body)}</p></div>`;
      container.appendChild(c);
    });
  } catch (e) { console.error('renderNextBestActionsPanel', e); }
}

function renderQuickInsightsPanel() {
  const container = document.getElementById('smart-insights');
  if (!container) return;
  container.innerHTML = '';
  try {
    const insights = quickInsights() || {};
    // top clients
    const topClients = (insights.topClients || []).slice(0,3);
    if (topClients.length) {
      const c = document.createElement('div'); c.className='uba-support-card';
      c.innerHTML = `<div class="uba-support-icon">💰</div><div><h4>${t('tool.insights.topClients','Top clients')}</h4><p style="color:var(--muted,#6b7280);">${topClients.map(x=>`${escapeHtml(x.name)}: €${Number(x.amount||0).toLocaleString()}`).join('\n')}</p></div>`;
      container.appendChild(c);
    }
    // overdue tasks
    const overdueCount = insights.overdueTasksCount || 0;
    const c2 = document.createElement('div'); c2.className='uba-support-card';
    c2.innerHTML = `<div class="uba-support-icon">⏰</div><div><h4>${t('tool.insights.overdueTasks','Overdue tasks')}</h4><p style="color:var(--muted,#6b7280);">${escapeHtml(String(overdueCount))} ${t('tool.insights.overdueLabel','overdue')}</p></div>`;
    container.appendChild(c2);
    // top expense category
    if (insights.topExpenseCategory) {
      const c3 = document.createElement('div'); c3.className='uba-support-card';
      c3.innerHTML = `<div class="uba-support-icon">📤</div><div><h4>${t('tool.insights.topExpense','Top expense')}</h4><p style="color:var(--muted,#6b7280);">${escapeHtml(insights.topExpenseCategory.category)} — €${Number(insights.topExpenseCategory.amount||0).toLocaleString()}</p></div>`;
      container.appendChild(c3);
    }
  } catch (e) { console.error('renderQuickInsightsPanel', e); }
}

// Initialize Smart Tools standalone page wiring if present
function initSmartToolsStandalone() {
  try {
    const select = document.getElementById('smart-client-select');
    const search = document.getElementById('smart-client-search');
    if (!select) return;
    populateClientSelect(select, search);
    select.addEventListener('change', () => {
      const id = select.value;
      renderSmartClientBrief(id);
      renderSmartOutreach(id);
    });
    // pick first client if any
    if (select.options && select.options.length > 1) {
      select.selectedIndex = 1;
      const id = select.value;
      renderSmartClientBrief(id);
      renderSmartOutreach(id);
    } else {
      renderSmartClientBrief(''); renderSmartOutreach('');
    }

    renderNextBestActionsPanel();
    renderQuickInsightsPanel();
  } catch (e) { console.error('initSmartToolsStandalone', e); }
}

// Success desk topics
const renderSupportTopics = () => {
  const grid = document.getElementById("support-topics");
  if (!grid) return;
  grid.innerHTML = "";

  supportTopicsSeed.forEach((topic) => {
    const card = document.createElement("div");
    card.className = "uba-support-card";
    card.innerHTML = `
      <div class="uba-support-icon">💡</div>
      <div>
        <h4>${topic.title}</h4>
        <p>${topic.desc}</p>
        <div class="uba-chip-row"><button class="uba-btn-link" type="button">${topic.cta}</button></div>
      </div>
    `;
    grid.appendChild(card);
  });
};

// Insights lab
const renderInsightsPanels = () => {
  const grid = document.getElementById("insights-panel-grid");
  if (!grid) return;
  grid.innerHTML = "";

  insightsPanelsSeed.forEach((panel) => {
    const card = document.createElement("div");
    card.className = "uba-analytic-panel";
    card.innerHTML = `
      <div class="uba-analytic-meta"><span class="uba-chip" data-i18n="${panel.tagKey}">${t(panel.tagKey)}</span></div>
      <h4 data-i18n="${panel.titleKey}">${t(panel.titleKey)}</h4>
      <p data-i18n="${panel.descKey}">${t(panel.descKey)}</p>
      <div class="uba-analytic-placeholder" aria-hidden="true"></div>
    `;
    grid.appendChild(card);
  });
};

const renderInsightsBrief = () => {
  const list = document.getElementById("insights-brief-list");
  if (!list) return;
  list.innerHTML = "";

  insightsBriefSeed.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <h5 data-i18n="${item.titleKey}">${t(item.titleKey)}</h5>
      <p data-i18n="${item.descKey}">${t(item.descKey)}</p>
    `;
    list.appendChild(li);
  });
};

const renderInsightsLab = () => {
  renderInsightsPanels();
  renderInsightsBrief();
};

// Settings
let settingsEventsBound = false;

const renderSettingsSummary = (settings) => {
  const summary = document.getElementById("settings-summary");
  if (!summary) return;

  const summaryItems = [
    // show current user + workspace when available
  ];

  try {
    const store = window.ubaStore;
    const currentUser = store && store.auth && typeof store.auth.currentUser === 'function' ? store.auth.currentUser() : null;
    const currentWorkspace = store && store.workspace && typeof store.workspace.getCurrentWorkspace === 'function' ? store.workspace.getCurrentWorkspace() : null;
    if (currentUser) {
      summaryItems.unshift({ label: t('settings.summary.userLabel','User'), value: `${currentUser.name || currentUser.email || ''}` });
    }
    if (currentWorkspace) {
      summaryItems.splice(currentUser ? 1 : 0, 0, { label: t('settings.summary.currentWorkspace','Workspace'), value: `${currentWorkspace.name || ''}` });
    }
  } catch (e) {
    // ignore
  }

  // default items
  const defaults = [
    {
      label: t("settings.summary.workspaceLabel", "Workspace"),
      value:
        settings.workspaceName?.trim() ||
        t("settings.workspace.placeholder", defaultSettings.workspaceName),
    },
    {
      label: t("settings.summary.languageLabel", "Language"),
      value: t(`language.${settings.language}`, settings.language?.toUpperCase() || "EN"),
    },
    {
      label: t("settings.summary.timezoneLabel", "Timezone"),
      value: settings.timezone || defaultSettings.timezone,
    },
    {
      label: t("settings.summary.singlePageLabel", "Single-page view"),
      value: settings.singlePage ? t("settings.summary.enabled", "Enabled") : t("settings.summary.disabled", "Disabled"),
    },
    {
      label: t("settings.summary.notificationsLabel", "Notifications"),
      value: settings.notifications ? t("settings.summary.enabled", "Enabled") : t("settings.summary.disabled", "Disabled"),
    },
  ];

  summary.innerHTML = "";
  const allItems = summaryItems.concat(defaults);
  allItems.forEach((item) => {
    const tile = document.createElement("div");
    tile.className = "uba-summary-tile";
    tile.innerHTML = `
      <p class="uba-summary-label">${item.label}</p>
      <p class="uba-summary-value">${item.value}</p>
    `;
    summary.appendChild(tile);
  });
};

const renderSettingsPage = () => {
  const form = document.getElementById("settings-form");
  const workspaceInput = document.getElementById("setting-workspace-name");
  const userNameInput = document.getElementById("setting-user-name");
  const userEmailInput = document.getElementById("setting-user-email");
  const timezoneSelect = document.getElementById("setting-timezone");
  const languageSelect = document.getElementById("language-select-settings");
  const workspaceIndustry = document.getElementById("setting-workspace-industry");
  const singlePageToggle = document.getElementById("setting-single-page");
  const notificationsToggle = document.getElementById("setting-notifications");
  const statusEl = document.getElementById("settings-status");

  const settings = loadSettingsState();

  if (workspaceInput) workspaceInput.value = settings.workspaceName || "";
  try {
    const store = window.ubaStore;
    const currentUser = store && store.auth && typeof store.auth.currentUser === 'function' ? store.auth.currentUser() : null;
    const currentWorkspace = store && store.workspace && typeof store.workspace.getCurrentWorkspace === 'function' ? store.workspace.getCurrentWorkspace() : null;
    if (userNameInput && currentUser) userNameInput.value = currentUser.name || '';
    if (userEmailInput && currentUser) userEmailInput.value = currentUser.email || '';
    if (workspaceIndustry && currentWorkspace) workspaceIndustry.value = (currentWorkspace.meta && currentWorkspace.meta.industry) || '';
  } catch (e) {
    // ignore
  }
  if (timezoneSelect) timezoneSelect.value = settings.timezone || defaultSettings.timezone;
  if (languageSelect) languageSelect.value = settings.language || defaultSettings.language;
  if (singlePageToggle) singlePageToggle.checked = !!settings.singlePage;
  if (notificationsToggle) notificationsToggle.checked = !!settings.notifications;
  if (statusEl) statusEl.textContent = t("settings.workspace.saved", "Saved");

  renderSettingsSummary(settings);
  document.body.classList.toggle("uba-single-view", !!settings.singlePage);

  if (settingsEventsBound) return;

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const workspaceNameVal = workspaceInput?.value.trim() || defaultSettings.workspaceName;
      const timezoneVal = timezoneSelect?.value || defaultSettings.timezone;
      const languageVal = languageSelect?.value || defaultSettings.language;

      // Save basic settingsState
      const saved = saveSettingsState({ workspaceName: workspaceNameVal, timezone: timezoneVal, language: languageVal });

      // Update user profile and workspace metadata when store is available
      try {
        const store = window.ubaStore;
        const currentUser = store && store.auth && typeof store.auth.currentUser === 'function' ? store.auth.currentUser() : null;
        const currentWorkspace = store && store.workspace && typeof store.workspace.getCurrentWorkspace === 'function' ? store.workspace.getCurrentWorkspace() : null;

        // Update user profile: name + (email optional) + language
        if (currentUser && store && store.auth && typeof store.auth.updateUser === 'function') {
          const newName = userNameInput?.value.trim() || currentUser.name || '';
          const newEmail = userEmailInput?.value.trim() || currentUser.email || '';
          store.auth.updateUser(currentUser.id, { name: newName, email: newEmail, language: languageVal });
        }

        // Update workspace metadata
        if (currentWorkspace && store && store.workspace && typeof store.workspace.updateWorkspace === 'function') {
          const industry = workspaceIndustry?.value?.trim() || '';
          const metaPatch = { ...(currentWorkspace.meta || {}), industry };
          store.workspace.updateWorkspace(currentWorkspace.id, { name: workspaceNameVal, meta: metaPatch });
        }
      } catch (e) {
        console.warn('Failed to persist profile/workspace via store:', e);
      }

      renderSettingsSummary(saved);
      if (statusEl) statusEl.textContent = t("settings.workspace.saved", "Saved");
      if (i18n.applyTranslations) {
        i18n.applyTranslations(saved.language);
      }
    });
  }

  if (singlePageToggle) {
    singlePageToggle.addEventListener("change", () => {
      const saved = saveSettingsState({ singlePage: singlePageToggle.checked });
      document.body.classList.toggle("uba-single-view", !!saved.singlePage);
      renderSettingsSummary(saved);
    });
  }

  if (notificationsToggle) {
    notificationsToggle.addEventListener("change", () => {
      const saved = saveSettingsState({ notifications: notificationsToggle.checked });
      renderSettingsSummary(saved);
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener("change", (event) => {
      const lang = event.target.value;
      const saved = saveSettingsState({ language: lang });
      renderSettingsSummary(saved);
      if (i18n.applyTranslations) {
        i18n.applyTranslations(lang);
      }
    });
  }

  settingsEventsBound = true;

  // Reset demo data button (clears local keys and reseeds)
  const resetBtn = document.getElementById('reset-demo-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm(t('settings.resetConfirm','Reset demo data? This will clear local changes.'))) return;
      try {
        const store = window.ubaStore;
        // clear known keys
        Object.values(LOCAL_KEYS).forEach(k => localStorage.removeItem(k));
        // re-seed
        if (store && store.ensureSeed) {
          store.ensureSeed('clients', clientSeed || []);
          store.ensureSeed('invoices', invoiceSeed || []);
          store.ensureSeed('projects', projectStagesSeed || []);
          store.ensureSeed('tasks', taskBoardSeed || []);
          store.ensureSeed('leads', leadsSeed || []);
          store.ensureSeed('expenses', expensesSeed || []);
          store.ensureSeed('files', filesSeed || []);
          store.ensureSeed('reports', reportsSeed || {});
        }
        showToast(t('settings.resetDone','Demo data reset'), { duration: 2500 });
        setTimeout(()=> window.location.reload(), 700);
      } catch (e) {
        console.error('reset demo error', e);
        showToast(t('errors.generic','Failed to reset demo data'), { type: 'error' });
      }
    });
  }
};
