// assets/js/projects.js — Projects page renderer and CRUD (localStorage via ubaStore)
(function () {
  function qs(id) {
    return document.getElementById(id);
  }

  function formatCurrency(n) {
    try {
      return Number(n || 0).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      });
    } catch (e) {
      return n;
    }
  }

  function renderProjects() {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    const list = store.projects.getAll() || [];

    const cols = {
      leads: qs("projects-leads"),
      in_progress: qs("projects-inprogress"),
      ongoing: qs("projects-ongoing"),
      completed: qs("projects-completed"),
    };

    Object.values(cols).forEach((c) => {
      if (c) c.innerHTML = "";
    });

    list.forEach((p) => {
      const card = document.createElement("div");
      card.className = "uba-support-card";
      card.style.marginBottom = "8px";

      const title = document.createElement("h4");
      title.style.margin = "0";
      title.textContent = p.title || "Untitled";
      const meta = document.createElement("div");
      meta.style.fontSize = "13px";
      meta.style.color = "var(--muted, #6b7280)";
      meta.textContent =
        (p.client ? p.client + " • " : "") +
        (p.budget ? "€ " + formatCurrency(p.budget) : "");

      const actions = document.createElement("div");
      actions.style.marginTop = "8px";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "uba-btn-link";
      edit.textContent = "Edit";
      const del = document.createElement("button");
      del.type = "button";
      del.className = "uba-btn-link";
      del.textContent = "Delete";

      edit.addEventListener("click", () => openEditForm(p.id));
      del.addEventListener("click", () => {
        if (!confirm("Delete project?")) return;
        try {
          store.projects.delete(p.id);
          renderProjects();
        } catch (e) {
          console.warn(e);
        }
      });

      actions.appendChild(edit);
      actions.appendChild(del);

      const notes = document.createElement("div");
      notes.style.marginTop = "6px";
      notes.style.fontSize = "13px";
      notes.textContent = p.notes || "";

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(notes);
      card.appendChild(actions);

      const target = cols[p.stage] || cols.leads;
      if (target) target.appendChild(card);
    });
  }

  function showModal() {
    const m = qs("project-form-modal");
    if (!m) return;
    m.classList.remove("is-hidden");
    m.setAttribute("aria-hidden", "false");
  }
  function hideModal() {
    const m = qs("project-form-modal");
    if (!m) return;
    m.classList.add("is-hidden");
    m.setAttribute("aria-hidden", "true");
  }

  function openAddForm() {
    qs("project-id").value = "";
    qs("project-title").value = "";
    qs("project-client").value = "";
    qs("project-budget").value = "";
    qs("project-stage").value = "leads";
    qs("project-notes").value = "";
    showModal();
    qs("project-title").focus();
  }

  function openEditForm(id) {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    const p = store.projects.get(id);
    if (!p) return;
    qs("project-id").value = p.id;
    qs("project-title").value = p.title || "";
    qs("project-client").value = p.client || "";
    qs("project-budget").value = p.budget || "";
    qs("project-stage").value = p.stage || "leads";
    qs("project-notes").value = p.notes || "";
    showModal();
    qs("project-title").focus();
  }

  function bindForm() {
    const form = qs("project-form");
    if (!form) return;
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const store = window.ubaStore;
      if (!store || !store.projects) return;
      const id = qs("project-id").value;
      const payload = {
        title: qs("project-title").value.trim(),
        client: qs("project-client").value.trim(),
        budget: Number(qs("project-budget").value) || 0,
        stage: qs("project-stage").value || "leads",
        notes: qs("project-notes").value.trim(),
      };
      try {
        if (id) {
          store.projects.update(id, payload);
        } else {
          store.projects.create(payload);
        }
        hideModal();
        renderProjects();
      } catch (e) {
        console.warn("project save error", e);
      }
    });

    const cancel = qs("project-cancel");
    if (cancel)
      cancel.addEventListener("click", (e) => {
        e.preventDefault();
        hideModal();
      });
    const close = qs("project-form-close");
    if (close) close.addEventListener("click", () => hideModal());
  }

  function initProjectsPage() {
    try {
      const boardGrid = document.getElementById("projects-columns");
      if (boardGrid && typeof window.renderProjectsBoard === "function") {
        window.renderProjectsBoard();
        return;
      }

      // wire add button
      const add = qs("add-project-btn");
      if (add) add.addEventListener("click", openAddForm);

      bindForm();

      // initial render
      renderProjects();
      // initial render done
    } catch (e) {
      console.warn("initProjectsPage error", e);
    }
  }

  // expose
  window.initProjectsPage = initProjectsPage;
  window.renderProjectsStandalone = renderProjects;

  // auto-init if page is present
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    if (
      document.getElementById("projects-leads") ||
      document.getElementById("projects-inprogress")
    ) {
      try {
        initProjectsPage();
      } catch (e) {}
    }
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (
        document.getElementById("projects-leads") ||
        document.getElementById("projects-inprogress")
      ) {
        try {
          initProjectsPage();
        } catch (e) {}
      }
    });
  }
})();
// Note: previous code included a second renderer here which caused duplicate
// `initProjectsPage`/`renderProjectsStandalone` definitions. That duplicated
// functionality has been removed to avoid re-defining the same globals.
