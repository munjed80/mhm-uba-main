// assets/js/projects.js — Projects page with drag-and-drop Kanban functionality
(function () {
  let draggedProject = null;

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
    const stages = ['lead', 'in_progress', 'ongoing', 'completed'];

    // Clear all columns
    stages.forEach(stage => {
      const col = qs(`projects-${stage}`);
      if (col) col.innerHTML = '';
    });

    list.forEach((p) => {
      const card = createProjectCard(p);
      const targetCol = qs(`projects-${p.stage || 'lead'}`);
      if (targetCol) targetCol.appendChild(card);
    });
  }

  function createProjectCard(project) {
    const card = document.createElement("div");
    card.className = "uba-pipe-item";
    card.draggable = true;
    card.dataset.projectId = project.id;
    card.style.cursor = "grab";

    const title = document.createElement("h4");
    title.className = "uba-pipe-title";
    title.textContent = project.title || "Untitled Project";

    const meta = document.createElement("div");
    meta.className = "uba-pipe-meta";
    meta.style.fontSize = "13px";
    meta.style.color = "var(--muted, #6b7280)";
    meta.textContent = 
      (project.client ? project.client + " • " : "") +
      (project.budget ? "€ " + formatCurrency(project.budget) : "");

    const notes = document.createElement("div");
    notes.style.fontSize = "12px";
    notes.style.marginTop = "4px";
    notes.style.color = "var(--muted)";
    if (project.notes) {
      notes.textContent = project.notes.length > 50 
        ? project.notes.substring(0, 50) + "..." 
        : project.notes;
    }

    const actions = document.createElement("div");
    actions.className = "uba-chip-row";
    actions.style.marginTop = "8px";
    actions.innerHTML = `
      <button type="button" class="uba-chip" onclick="viewProject('${project.id}')">View</button>
      <button type="button" class="uba-chip" onclick="editProject('${project.id}')">Edit</button>
      <button type="button" class="uba-chip" onclick="deleteProject('${project.id}')">Delete</button>
    `;

    card.appendChild(title);
    card.appendChild(meta);
    if (project.notes) card.appendChild(notes);
    card.appendChild(actions);

    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
  }

  function handleDragStart(e) {
    draggedProject = e.target;
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '';
    draggedProject = null;
  }

  function setupDropZones() {
    const zones = document.querySelectorAll('.uba-pipe-zone');
    zones.forEach(zone => {
      zone.addEventListener('dragover', handleDragOver);
      zone.addEventListener('drop', handleDrop);
      zone.addEventListener('dragenter', handleDragEnter);
      zone.addEventListener('dragleave', handleDragLeave);
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(e) {
    e.preventDefault();
    e.target.style.backgroundColor = 'var(--accent-bg, rgba(59, 130, 246, 0.1))';
  }

  function handleDragLeave(e) {
    e.target.style.backgroundColor = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    e.target.style.backgroundColor = '';
    
    if (!draggedProject) return;

    const projectId = draggedProject.dataset.projectId;
    const newStage = e.target.closest('.uba-pipe-col').dataset.stage;
    
    if (!projectId || !newStage) return;

    // Update project stage in store
    const store = window.ubaStore;
    if (store && store.projects) {
      try {
        store.projects.update(projectId, { stage: newStage });
        renderProjects(); // Re-render to show updated position
      } catch (err) {
        console.warn('Error updating project stage:', err);
      }
    }
  }

  function showModal(modalId) {
    const modal = qs(modalId);
    if (modal) {
      modal.classList.remove("is-hidden");
      modal.setAttribute("aria-hidden", "false");
    }
  }

  function hideModal(modalId) {
    const modal = qs(modalId);
    if (modal) {
      modal.classList.add("is-hidden");
      modal.setAttribute("aria-hidden", "true");
    }
  }

  function openAddForm() {
    qs("project-id").value = "";
    qs("project-title").value = "";
    qs("project-client").value = "";
    qs("project-budget").value = "";
    qs("project-stage").value = "lead";
    qs("project-notes").value = "";
    showModal("project-form-modal");
    qs("project-title").focus();
  }

  function openEditForm(id) {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    
    const project = store.projects.get(id);
    if (!project) return;
    
    qs("project-id").value = project.id;
    qs("project-title").value = project.title || "";
    qs("project-client").value = project.client || "";
    qs("project-budget").value = project.budget || "";
    qs("project-stage").value = project.stage || "lead";
    qs("project-notes").value = project.notes || "";
    showModal("project-form-modal");
    qs("project-title").focus();
  }

  function viewProject(id) {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    
    const project = store.projects.get(id);
    if (!project) return;

    // Get related tasks
    const tasks = store.tasks ? store.tasks.getAll().filter(t => t.projectId === id) : [];

    const content = qs("project-detail-content");
    const titleEl = qs("project-detail-title");
    
    if (titleEl) titleEl.textContent = project.title || "Project Details";
    
    if (content) {
      content.innerHTML = `
        <div class="uba-form-group">
          <label>Client</label>
          <div class="uba-detail-value">${project.client || 'N/A'}</div>
        </div>
        <div class="uba-form-group">
          <label>Budget</label>
          <div class="uba-detail-value">${project.budget ? '€' + formatCurrency(project.budget) : 'N/A'}</div>
        </div>
        <div class="uba-form-group">
          <label>Stage</label>
          <div class="uba-detail-value">${project.stage || 'lead'}</div>
        </div>
        <div class="uba-form-group">
          <label>Notes</label>
          <div class="uba-detail-value">${project.notes || 'No notes'}</div>
        </div>
        <div class="uba-form-group">
          <label>Related Tasks (${tasks.length})</label>
          <div class="uba-detail-value">
            ${tasks.length ? 
              tasks.map(t => `<div style="padding: 4px 0; border-bottom: 1px solid var(--border);"><strong>${t.title || 'Untitled'}</strong><br><small>Status: ${t.status || 'todo'}</small></div>`).join('') :
              '<em>No tasks linked to this project</em>'
            }
          </div>
          ${tasks.length ? `<div style="margin-top: 8px;"><a href="tasks.html?project=${id}" class="uba-btn uba-btn-sm">View Tasks →</a></div>` : ''}
        </div>
      `;
    }
    
    showModal("project-detail-modal");
  }

  function deleteProject(id) {
    if (!confirm("Delete this project? This action cannot be undone.")) return;
    
    const store = window.ubaStore;
    if (store && store.projects) {
      try {
        store.projects.delete(id);
        renderProjects();
      } catch (e) {
        console.warn("Error deleting project:", e);
      }
    }
  }

  function bindEvents() {
    // Form submission
    const form = qs("project-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const store = window.ubaStore;
        if (!store || !store.projects) return;
        
        const id = qs("project-id").value;
        const payload = {
          title: qs("project-title").value.trim(),
          client: qs("project-client").value.trim(),
          budget: Number(qs("project-budget").value) || 0,
          stage: qs("project-stage").value || "lead",
          notes: qs("project-notes").value.trim(),
        };
        
        try {
          if (id) {
            store.projects.update(id, payload);
          } else {
            store.projects.create(payload);
          }
          hideModal("project-form-modal");
          renderProjects();
        } catch (e) {
          console.warn("Error saving project:", e);
        }
      });
    }

    // Modal controls
    const addBtn = qs("add-project-btn");
    if (addBtn) addBtn.addEventListener("click", openAddForm);

    const cancelBtn = qs("project-cancel");
    if (cancelBtn) cancelBtn.addEventListener("click", () => hideModal("project-form-modal"));

    const closeBtn = qs("project-form-close");
    if (closeBtn) closeBtn.addEventListener("click", () => hideModal("project-form-modal"));

    const detailCloseBtn = qs("project-detail-close");
    if (detailCloseBtn) detailCloseBtn.addEventListener("click", () => hideModal("project-detail-modal"));

    // Modal overlay clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('uba-modal-overlay')) {
        if (e.target.closest('#project-form-modal')) {
          hideModal('project-form-modal');
        } else if (e.target.closest('#project-detail-modal')) {
          hideModal('project-detail-modal');
        }
      }
    });
  }

  function initProjectsPage() {
    try {
      bindEvents();
      setupDropZones();
      renderProjects();
    } catch (e) {
      console.warn("initProjectsPage error:", e);
    }
  }

  // Global functions for onclick handlers
  window.viewProject = viewProject;
  window.editProject = openEditForm;
  window.deleteProject = deleteProject;

  // Expose main functions
  window.initProjectsPage = initProjectsPage;
  window.renderProjectsStandalone = renderProjects;

  // Auto-init if page is ready
  if (document.readyState === "complete" || document.readyState === "interactive") {
    if (qs("projects-lead") || qs("projects-columns")) {
      try {
        initProjectsPage();
      } catch (e) {
        console.warn("Auto-init projects error:", e);
      }
    }
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (qs("projects-lead") || qs("projects-columns")) {
        try {
          initProjectsPage();
        } catch (e) {
          console.warn("DOMContentLoaded projects error:", e);
        }
      }
    });
  }
})();
