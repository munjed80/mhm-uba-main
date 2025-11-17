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

const i18n = window.ubaI18n || fallbackI18n;
const t = i18n.t || fallbackI18n.t;

// ------------------------------------------------------
// Utility: Get current user id (local stub)
// ------------------------------------------------------
async function getCurrentUserId() {
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
  const enableDemo = true;

  if (isDashboardPage) {
    const label = document.getElementById("uba-user-label");
    if (label) {
      label.textContent = "Demo user";
    }
    if (enableDemo) {
      document.body.classList.add("uba-demo-mode");
      await loadDemoDashboard();
    } else {
      await loadDashboardData("local-user");
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

  // Local stub: accept any credentials and redirect to the dashboard
  try {
    window.location.href = "index.html";
  } catch (e) {
    if (errorBox) errorBox.textContent = t("auth.login.network");
  }
};

// 4) Logout (index.html)
// ------------------------------------------------------
window.logout = async function () {
  // Local stub: just redirect to login page
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

  const total = localMiniInvoices.reduce(
    (sum, inv) => sum + (Number.isFinite(inv.amount) ? Number(inv.amount) : 0),
    0
  );
  if (totalLabel) totalLabel.textContent = `€ ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  if (countLabel) countLabel.textContent = `${localMiniInvoices.length}`;

  if (!localMiniInvoices.length) {
    tbody.innerHTML = `<tr><td colspan="4">${t("mini.none")}</td></tr>`;
    return;
  }

  localMiniInvoices.forEach((invoice) => {
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
  localMiniInvoices.unshift({ ...payload, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() });
  renderMiniInvoices();
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
    }
  } catch (e) {
    console.warn('Failed to seed local store', e);
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

      // Local stubbed signup — just show success and redirect to index
      try {
        if (successBox) {
          successBox.textContent = t("auth.signup.successRedirect") || "Account created";
        }
        setTimeout(() => {
          window.location.href = "index.html";
        }, 800);
      } catch (e) {
        if (errorBox) errorBox.textContent = t("errors.network");
      }
    });
  }

  // 6.3 Tasks click → toggle status done/todo
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
          // tasks are stored as columns; find the task and update its status field if present
          const all = store.tasks.getAll();
          // If tasks are board-style (array of columns), update accordingly
          if (Array.isArray(all) && all.length && all[0].tasks) {
            const cols = all;
            for (const col of cols) {
              const task = col.tasks && col.tasks.find((t) => t.id === taskId);
              if (task) {
                task.status = newStatus;
              }
            }
            store.tasks.saveAll(cols);
          } else {
            // Flat tasks list
            const task = all.find((t) => t.id === taskId);
            if (task) store.tasks.update(task.id, { status: newStatus });
          }
        }
      } catch (e) {
        console.error("Failed to toggle task completion:", e);
        li.classList.toggle("completed"); // revert on error
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
        // Open a dedicated help page for the Support / Success Desk menu
        if (target === "support") {
          window.location.href = "success.html";
          return;
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
        const store = window.ubaStore;
        if (store && store.clients) {
          store.clients.create({
            name,
            email: emailInput.value.trim() || "",
            company: companyInput.value.trim() || "",
            phone: phoneInput.value.trim() || "",
            notes: notesInput.value.trim() || "",
          });
        } else {
          // Fallback: use local write helpers
          const clients = ensureSeedData(LOCAL_KEYS.clients, clientSeed) || [];
          const payload = {
            id: `client-${Date.now()}`,
            name,
            email: emailInput.value.trim() || "",
            company: companyInput.value.trim() || "",
            phone: phoneInput.value.trim() || "",
            notes: notesInput.value.trim() || "",
          };
          writeLocalData(LOCAL_KEYS.clients, [payload, ...clients]);
        }

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

const readLocalData = (key, fallback) => {
  try {
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
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("writeLocalData error", e);
  }
};

const ensureSeedData = (key, seed) => {
  const stored = readLocalData(key, null);
  if (stored === null || stored === undefined) {
    writeLocalData(key, seed);
    return Array.isArray(seed) ? [...seed] : seed;
  }
  return stored;
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
      const clients = ensureSeedData(LOCAL_KEYS.clients, clientSeed) || [];
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
        id: clientsEditingId || `client-${Date.now()}`,
        name,
        email: emailInput?.value.trim() || "",
        company: companyInput?.value.trim() || "",
        phone: phoneInput?.value.trim() || "",
        notes: notesInput?.value.trim() || "",
      };

      const nextClients = clientsEditingId
        ? clients.map((c) => (c.id === clientsEditingId ? payload : c))
        : [...clients, payload];

      writeLocalData(LOCAL_KEYS.clients, nextClients);
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

  const clients = ensureSeedData(LOCAL_KEYS.clients, clientSeed) || [];

  if (!clients.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = t("clients.none");
    tr.appendChild(td);
    table.appendChild(tr);
  } else {
    clients.forEach((client) => {
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
          const nextClients = clients.filter((c) => c.id !== client.id);
          writeLocalData(LOCAL_KEYS.clients, nextClients);
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
      const invoices = ensureSeedData(LOCAL_KEYS.invoices, invoiceSeed) || [];
      const clientInput = document.getElementById("invoice-client");
      const labelInput = document.getElementById("invoice-label");
      const amountInput = document.getElementById("invoice-amount");
      const statusSelect = document.getElementById("invoice-status");
      const dueInput = document.getElementById("invoice-due");
      const notesInput = document.getElementById("invoice-notes");
      const submitBtn = form.querySelector("button[type='submit']");

      if (errorBox) errorBox.textContent = "";

      const client = clientInput?.value.trim();
      const amount = amountInput ? Number(amountInput.value) : NaN;

      if (!client || Number.isNaN(amount) || amount < 0) {
        if (errorBox) errorBox.textContent = t("mini.required");
        return;
      }

      const payload = {
        id: invoiceEditingId || `inv-${Date.now()}`,
        client,
        label: labelInput?.value.trim() || t("mini.untitled"),
        amount,
        status: statusSelect?.value || "draft",
        due: dueInput?.value || "",
        notes: notesInput?.value.trim() || "",
      };

      const nextInvoices = invoiceEditingId
        ? invoices.map((inv) => (inv.id === invoiceEditingId ? payload : inv))
        : [...invoices, payload];

      writeLocalData(LOCAL_KEYS.invoices, nextInvoices);
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

  const invoices = ensureSeedData(LOCAL_KEYS.invoices, invoiceSeed) || [];

  if (!invoices.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = t("mini.none");
    tr.appendChild(td);
    table.appendChild(tr);
  } else {
    invoices.forEach((inv) => {
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
          const nextInvoices = invoices.filter((item) => item.id !== inv.id);
          writeLocalData(LOCAL_KEYS.invoices, nextInvoices);
          renderInvoicePage();
        });

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
    const name = document.getElementById('proj-name').value.trim();
    if (!name) { alert('Project name required'); return; }
    const client = document.getElementById('proj-client').value.trim();
    const budget = document.getElementById('proj-budget').value.trim();
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
      store.projects.create({ name, client, budget, stage: stageKey });
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
        const name = prompt('Project name', item.name) || item.name;
        const client = prompt('Client', item.client) || item.client;
        const budget = prompt('Budget', item.budget||item.value) || item.budget||item.value;
        if (store && store.projects) store.projects.update(item.id, { name, client, budget });
        renderProjectsBoard();
      });
      const delBtn = document.createElement('button'); delBtn.type='button'; delBtn.className='uba-btn-link'; delBtn.textContent='Delete';
      delBtn.addEventListener('click', ()=>{ if(!confirm('Delete project?')) return; if(store && store.projects) store.projects.delete(item.id); renderProjectsBoard(); });
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
  document.getElementById('task-add').addEventListener('click', ()=>{
    const title = document.getElementById('task-title').value.trim(); if(!title){alert('Title required');return;}
    const owner = document.getElementById('task-owner').value.trim(); const due = document.getElementById('task-due').value.trim(); const colId = document.getElementById('task-col').value;
    // find column
    const cols = columns;
    const target = cols.find(c=>c.id===colId) || cols[0];
    const newTask = { id: `task-${Date.now()}`, title, owner, due };
    if (!target.tasks) target.tasks = [];
    target.tasks.push(newTask);
    if (store && store.tasks) store.tasks.saveAll(cols);
    renderTasksBoard();
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
      delBtn.addEventListener('click', ()=>{ if(!confirm('Delete task?')) return; const colTasks = col.tasks || []; col.tasks = colTasks.filter(t=>t.id!==task.id); if(store && store.tasks) store.tasks.saveAll(columns); renderTasksBoard(); });

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

  smartToolsSeed.forEach((tool) => {
    const card = document.createElement("div");
    card.className = "uba-support-card";
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
};

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
  summaryItems.forEach((item) => {
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
  const timezoneSelect = document.getElementById("setting-timezone");
  const languageSelect = document.getElementById("language-select-settings");
  const singlePageToggle = document.getElementById("setting-single-page");
  const notificationsToggle = document.getElementById("setting-notifications");
  const statusEl = document.getElementById("settings-status");

  const settings = loadSettingsState();

  if (workspaceInput) workspaceInput.value = settings.workspaceName || "";
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
      const payload = {
        workspaceName: workspaceInput?.value.trim() || defaultSettings.workspaceName,
        timezone: timezoneSelect?.value || defaultSettings.timezone,
        language: languageSelect?.value || defaultSettings.language,
      };
      const saved = saveSettingsState(payload);
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
};
