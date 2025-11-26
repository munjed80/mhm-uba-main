// assets/js/projects.js — Modern Projects page with sophisticated Kanban functionality
(function () {
  let draggedProject = null;
  let currentFilter = 'all';
  let currentSort = 'created';
  let eventsBound = false;

  function qs(id) {
    return document.getElementById(id);
  }

  const toast = (message, type = 'info') => {
    if (typeof window.showToast === 'function') {
      window.showToast(message, typeof type === 'string' ? { type } : type);
      return;
    }

    if (window.UBANotifications) {
      const notifier =
        window.UBANotifications[type] || window.UBANotifications.info;
      if (typeof notifier === 'function') {
        notifier.call(window.UBANotifications, message);
        return;
      }
    }

    console.log(`[Toast:${type}]`, message);
  };

  const modal = {
    show(id) {
      if (typeof window.showModal === 'function') {
        window.showModal(id);
        return;
      }

      const el = qs(id);
      if (el) {
        el.classList.remove('is-hidden');
        el.setAttribute('aria-hidden', 'false');
        el.style.display = 'flex';
      }
    },
    hide(id) {
      if (typeof window.hideModal === 'function') {
        window.hideModal(id);
        return;
      }

      const el = qs(id);
      if (el) {
        el.classList.add('is-hidden');
        el.setAttribute('aria-hidden', 'true');
        el.style.display = 'none';
      }
    }
  };

  function formatCurrency(n) {
    try {
      return Number(n || 0).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      });
    } catch (e) {
      return n;
    }
  }

  async function updateProjectCounts() {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.projects) return;
    
    let projects = [];
    if (window.SupabaseStore) {
      projects = await store.projects.getAll() || [];
    } else {
      projects = store.projects.getAll() || [];
    }
    
    const stages = ['lead', 'in_progress', 'ongoing', 'completed'];
    
    // Update individual column counts
    stages.forEach(stage => {
      const count = projects.filter(p => p.stage === stage).length;
      const countEl = qs(`${stage}-count`);
      if (countEl) countEl.textContent = count;
      
      // Show/hide empty state
      const columnBody = qs(`projects-${stage}`);
      const emptyEl = columnBody?.querySelector('.uba-column-empty');
      if (emptyEl) {
        emptyEl.style.display = count === 0 ? 'flex' : 'none';
      }
    });
    
    // Update total active projects count
    const activeCount = projects.filter(p => p.stage !== 'completed').length;
    const totalCountEl = qs('projects-count');
    if (totalCountEl) totalCountEl.textContent = activeCount;
  }

  function sortProjects(projects) {
    return projects.sort((a, b) => {
      switch (currentSort) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'budget':
          return (b.budget || 0) - (a.budget || 0);
        case 'client':
          return (a.client || '').localeCompare(b.client || '');
        case 'created':
        default:
          return new Date(b.created || 0) - new Date(a.created || 0);
      }
    });
  }

  function filterProjects(projects) {
    switch (currentFilter) {
      case 'lead':
        return projects.filter(p => p.stage === 'lead');
      case 'active':
        return projects.filter(p => p.stage === 'in_progress' || p.stage === 'ongoing');
      case 'completed':
        return projects.filter(p => p.stage === 'completed');
      case 'all':
      default:
        return projects;
    }
  }

  async function renderProjects() {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.projects) return;
    
    let projects = [];
    if (window.SupabaseStore) {
      projects = await store.projects.getAll() || [];
    } else {
      projects = store.projects.getAll() || [];
    }
    
    projects = filterProjects(sortProjects(projects));
    
    const stages = ['lead', 'in_progress', 'ongoing', 'completed'];

    // Clear all columns
    stages.forEach(stage => {
      const col = qs(`projects-${stage}`);
      if (col) {
        const cards = col.querySelectorAll('.uba-project-card');
        cards.forEach(card => card.remove());
      }
    });

    // Render filtered projects
    projects.forEach((p) => {
      const card = createProjectCard(p);
      const targetCol = qs(`projects-${p.stage || 'lead'}`);
      if (targetCol) {
        const emptyEl = targetCol.querySelector('.uba-column-empty');
        targetCol.insertBefore(card, emptyEl);
      }
    });

    await updateProjectCounts();
  }

  function createProjectCard(project) {
    const card = document.createElement("div");
    card.className = "uba-project-card";
    card.draggable = true;
    card.dataset.projectId = project.id;
    card.dataset.stage = project.stage || 'lead';

    const header = document.createElement("div");
    header.className = "uba-card-header-compact";
    
    const titleGroup = document.createElement("div");
    titleGroup.className = "uba-card-title-group";
    
    const title = document.createElement("h4");
    title.className = "uba-card-title-compact";
    title.textContent = project.title || "Untitled Project";
    title.title = project.title || "Untitled Project";
    
    const priorityBadge = document.createElement("span");
    priorityBadge.className = `uba-priority-badge priority-${project.priority || 'medium'}`;
    priorityBadge.textContent = (project.priority || 'medium').charAt(0).toUpperCase();
    priorityBadge.title = `Priority: ${project.priority || 'medium'}`;
    
    titleGroup.appendChild(title);
    titleGroup.appendChild(priorityBadge);
    
    const dragHandle = document.createElement("div");
    dragHandle.className = "uba-card-drag-handle";
    dragHandle.innerHTML = "⋮⋮";
    dragHandle.title = "Drag to move";
    
    header.appendChild(titleGroup);
    header.appendChild(dragHandle);

    const content = document.createElement("div");
    content.className = "uba-card-content-compact";
    
    if (project.client || project.budget) {
      const meta = document.createElement("div");
      meta.className = "uba-card-meta-compact";
      
      const clientText = project.client ? `👤 ${project.client}` : '';
      const budgetText = project.budget ? `💰 €${formatCurrency(project.budget)}` : '';
      const separator = clientText && budgetText ? ' • ' : '';
      
      meta.innerHTML = `${clientText}${separator}${budgetText}`;
      content.appendChild(meta);
    }

    if (project.notes) {
      const notes = document.createElement("div");
      notes.className = "uba-card-notes-compact";
      const truncated = project.notes.length > 60 
        ? project.notes.substring(0, 60) + "..." 
        : project.notes;
      notes.textContent = truncated;
      notes.title = project.notes;
      content.appendChild(notes);
    }

    const footer = document.createElement("div");
    footer.className = "uba-card-footer-compact";
    
    const actions = document.createElement("div");
    actions.className = "uba-card-actions-compact";
    
    const viewBtn = document.createElement("button");
    viewBtn.className = "uba-action-btn uba-action-view";
    viewBtn.innerHTML = "👁️";
    viewBtn.title = "View details";
    viewBtn.onclick = (e) => {
      e.stopPropagation();
      viewProject(project.id);
    };
    
    const editBtn = document.createElement("button");
    editBtn.className = "uba-action-btn uba-action-edit";
    editBtn.innerHTML = "✏️";
    editBtn.title = "Edit project";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      editProject(project.id);
    };
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "uba-action-btn uba-action-delete";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Delete project";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteProject(project.id);
    };
    
    actions.appendChild(viewBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    const tasksLink = document.createElement("div");
    tasksLink.className = "uba-card-tasks-link";
    
    // Count related tasks
    const store = window.ubaStore;
    const tasks = store.tasks ? store.tasks.getAll().filter(t => t.projectId === project.id) : [];
    
    if (tasks.length > 0) {
      tasksLink.innerHTML = `<span class="uba-tasks-icon">✅</span> ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
      tasksLink.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `tasks.html?project=${project.id}`;
      };
      tasksLink.style.cursor = 'pointer';
    } else {
      tasksLink.innerHTML = `<span class="uba-tasks-icon">➕</span> Add tasks`;
      tasksLink.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `tasks.html?new=true&project=${project.id}`;
      };
      tasksLink.style.cursor = 'pointer';
    }
    
    footer.appendChild(actions);
    footer.appendChild(tasksLink);

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);

    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('click', () => viewProject(project.id));

    return card;
  }

  function handleDragStart(e) {
    draggedProject = e.target;
    e.target.style.opacity = '0.6';
    e.target.style.transform = 'rotate(5deg)';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // Add drag feedback to all drop zones
    document.querySelectorAll('.uba-drop-zone').forEach(zone => {
      zone.classList.add('uba-drag-active');
    });
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '';
    e.target.style.transform = '';
    draggedProject = null;
    
    // Remove drag feedback
    document.querySelectorAll('.uba-drop-zone').forEach(zone => {
      zone.classList.remove('uba-drag-active', 'uba-drag-over');
    });
  }

  function setupDropZones() {
    const zones = document.querySelectorAll('.uba-drop-zone');
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
    if (e.target.classList.contains('uba-drop-zone')) {
      e.target.classList.add('uba-drag-over');
    }
  }

  function handleDragLeave(e) {
    if (e.target.classList.contains('uba-drop-zone')) {
      e.target.classList.remove('uba-drag-over');
    }
  }

  async function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('uba-drag-over');
    
    if (!draggedProject) return;

    const projectId = draggedProject.dataset.projectId;
    const oldStage = draggedProject.dataset.stage;
    const newStage = e.target.dataset.stage || e.target.closest('[data-stage]')?.dataset.stage;
    
    if (!projectId || !newStage || oldStage === newStage) return;

    // Update project stage in store
    const store = window.SupabaseStore || window.ubaStore;
    if (store && store.projects) {
      try {
        if (window.SupabaseStore) {
          await store.projects.update(projectId, { 
            stage: newStage,
            updated: new Date().toISOString()
          });
        } else {
          store.projects.update(projectId, { 
            stage: newStage,
            updated: new Date().toISOString()
          });
        }
        
        // Show success feedback
        toast(`Project moved to ${newStage.replace('_', ' ')}`, 'success');
        
        await renderProjects();
      } catch (err) {
        console.warn('Error updating project stage:', err);
        toast('Failed to move project', 'error');
      }
    }
  }

  function openAddForm(stage = 'lead') {
    qs("project-id").value = "";
    qs("project-title").value = "";
    qs("project-client").value = "";
    qs("project-budget").value = "";
    qs("project-stage").value = stage;
    qs("project-notes").value = "";
    
    const titleEl = qs("project-form-title");
    if (titleEl) titleEl.textContent = "New Project";
    
    modal.show("project-form-modal");
    qs("project-title").focus();
  }

  async function openEditForm(id) {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.projects) return;
    
    let project = null;
    if (window.SupabaseStore) {
      project = await store.projects.get(id);
    } else {
      project = store.projects.get(id);
    }
    
    if (!project) return;
    
    qs("project-id").value = project.id;
    qs("project-title").value = project.title || "";
    qs("project-client").value = project.client || "";
    qs("project-budget").value = project.budget || "";
    qs("project-stage").value = project.stage || "lead";
    qs("project-notes").value = project.notes || "";
    
    const titleEl = qs("project-form-title");
    if (titleEl) titleEl.textContent = "Edit Project";
    
    modal.show("project-form-modal");
    qs("project-title").focus();
  }

  function viewProject(id) {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    
    const project = store.projects.get(id);
    if (!project) return;

    // Get related tasks
    const tasks = store.tasks ? store.tasks.getAll().filter(t => t.projectId === id) : [];
    const completedTasks = tasks.filter(t => t.status === 'done');

    const content = qs("project-detail-content");
    const titleEl = qs("project-detail-title");
    
    if (titleEl) titleEl.textContent = project.title || "Project Details";
    
    if (content) {
      const stageEmoji = {
        lead: '🔍',
        in_progress: '🚀',
        ongoing: '⚡',
        completed: '✅'
      };
      
      content.innerHTML = `
        <div class="uba-detail-grid">
          <div class="uba-detail-section">
            <h4>Project Information</h4>
            <div class="uba-detail-item">
              <label>Stage</label>
              <div class="uba-detail-value">
                <span class="uba-stage-badge stage-${project.stage || 'lead'}">
                  ${stageEmoji[project.stage || 'lead']} ${(project.stage || 'lead').replace('_', ' ')}
                </span>
              </div>
            </div>
            <div class="uba-detail-item">
              <label>Client</label>
              <div class="uba-detail-value">${project.client || 'No client assigned'}</div>
            </div>
            <div class="uba-detail-item">
              <label>Budget</label>
              <div class="uba-detail-value">${project.budget ? '€' + formatCurrency(project.budget) : 'No budget set'}</div>
            </div>
            ${project.notes ? `
              <div class="uba-detail-item">
                <label>Notes</label>
                <div class="uba-detail-value uba-detail-notes">${project.notes}</div>
              </div>
            ` : ''}
          </div>
          
          <div class="uba-detail-section">
            <h4>Task Progress</h4>
            <div class="uba-detail-item">
              <label>Total Tasks</label>
              <div class="uba-detail-value">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</div>
            </div>
            ${tasks.length > 0 ? `
              <div class="uba-detail-item">
                <label>Completed</label>
                <div class="uba-detail-value">
                  <div class="uba-progress-bar">
                    <div class="uba-progress-fill" style="width: ${(completedTasks.length / tasks.length * 100)}%"></div>
                  </div>
                  <span>${completedTasks.length} of ${tasks.length} (${Math.round(completedTasks.length / tasks.length * 100)}%)</span>
                </div>
              </div>
              <div class="uba-detail-item">
                <label>Recent Tasks</label>
                <div class="uba-detail-value">
                  ${tasks.slice(0, 5).map(t => `
                    <div class="uba-task-item">
                      <span class="uba-task-status status-${t.status || 'todo'}">${t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔄' : '⏳'}</span>
                      <span class="uba-task-title">${t.title || 'Untitled'}</span>
                    </div>
                  `).join('')}
                  ${tasks.length > 5 ? `<div class="uba-task-more">+ ${tasks.length - 5} more tasks</div>` : ''}
                </div>
              </div>
            ` : `
              <div class="uba-detail-item">
                <div class="uba-detail-empty">
                  <span class="uba-empty-icon">📝</span>
                  <p>No tasks created yet</p>
                </div>
              </div>
            `}
            <div class="uba-detail-actions">
              <a href="tasks.html?project=${id}" class="uba-btn uba-btn-primary uba-btn-sm">
                <span class="icon">✅</span> ${tasks.length ? 'Manage Tasks' : 'Add Tasks'}
              </a>
              <button class="uba-btn uba-btn-ghost uba-btn-sm" onclick="editProject('${id}'); hideModal('project-detail-modal');">
                <span class="icon">✏️</span> Edit Project
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    modal.show("project-detail-modal");
  }

  async function deleteProject(id) {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.projects) return;
    
    let project = null;
    if (window.SupabaseStore) {
      project = await store.projects.get(id);
    } else {
      project = store.projects.get(id);
    }
    
    if (!project) return;
    
    if (!confirm(`Delete "${project.title}"?

This action cannot be undone.`)) return;
    
    try {
      if (window.SupabaseStore) {
        await store.projects.delete(id);
      } else {
        store.projects.delete(id);
      }
      toast(`Project "${project.title}" deleted`, 'success');
      await renderProjects();
    } catch (e) {
      console.warn("Error deleting project:", e);
      toast('Failed to delete project', 'error');
    }
  }

  function addProjectToStage(stage) {
    openAddForm(stage);
  }

  function bindEvents() {
    // Prevent duplicate event binding
    if (eventsBound) return;
    eventsBound = true;
    
    // Form submission
    const form = qs("project-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const store = window.SupabaseStore || window.ubaStore;
        if (!store || !store.projects) return;
        
        const id = qs("project-id").value;
        const title = qs("project-title").value.trim();
        
        if (!title) {
          toast('Project title is required', 'error');
          qs("project-title").focus();
          return;
        }
        
        const payload = {
          title: title,
          client: qs("project-client").value.trim(),
          budget: Number(qs("project-budget").value) || 0,
          stage: qs("project-stage").value || "lead",
          notes: qs("project-notes").value.trim(),
          updated: new Date().toISOString()
        };
        
        if (!id) {
          payload.created = new Date().toISOString();
        }
        
        try {
          if (id) {
            if (window.SupabaseStore) {
              await store.projects.update(id, payload);
            } else {
              store.projects.update(id, payload);
            }
            toast(`Project "${title}" updated`, 'success');
          } else {
            if (window.SupabaseStore) {
              await store.projects.create(payload);
            } else {
              store.projects.create(payload);
            }
            toast(`Project "${title}" created`, 'success');
          }
          modal.hide("project-form-modal");
          await renderProjects();
        } catch (e) {
          console.warn("Error saving project:", e);
          toast('Failed to save project', 'error');
        }
      });
    }

    // Filter and sort controls
    const filterSelect = qs("project-filter");
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderProjects();
      });
    }

    const sortSelect = qs("project-sort");
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderProjects();
      });
    }

    // Modal controls
    const addBtn = qs("add-project-btn");
    if (addBtn) addBtn.addEventListener("click", () => openAddForm());

    const cancelBtn = qs("project-cancel");
    if (cancelBtn) cancelBtn.addEventListener("click", () => modal.hide("project-form-modal"));

    const closeBtn = qs("project-form-close");
    if (closeBtn) closeBtn.addEventListener("click", () => modal.hide("project-form-modal"));

    const detailCloseBtn = qs("project-detail-close");
    if (detailCloseBtn) detailCloseBtn.addEventListener("click", () => modal.hide("project-detail-modal"));

    // Modal overlay clicks and ESC behavior are centralized in app.js so
    // every page uses the exact same interaction patterns.
  }

  async function initProjectsPage() {
    try {
      bindEvents();
      setupDropZones();
      await renderProjects();
      
      // Auto-focus search if no projects exist
      const store = window.SupabaseStore || window.ubaStore;
      if (store && store.projects) {
        let projects = [];
        if (window.SupabaseStore) {
          projects = await store.projects.getAll() || [];
        } else {
          projects = store.projects.getAll() || [];
        }
        if (projects.length === 0) {
          // Show welcome state or auto-open add form after a delay
          setTimeout(() => {
            const addBtn = qs("add-project-btn");
            if (addBtn && !document.querySelector('.uba-modal:not(.is-hidden)')) {
              // Could auto-open form or show welcome tooltip
            }
          }, 1000);
        }
      }
    } catch (e) {
      console.warn("initProjectsPage error:", e);
    }
  }

  // Global functions for onclick handlers
  window.viewProject = viewProject;
  window.editProject = openEditForm;
  window.deleteProject = deleteProject;
  window.addProjectToStage = addProjectToStage;

  // Expose main functions
  window.initProjectsPage = initProjectsPage;
  window.renderProjectsStandalone = renderProjects;

  // Auto-init if page is ready
  if (document.readyState === "complete" || document.readyState === "interactive") {
    if (qs("projects-lead") || qs("projects-board")) {
      try {
        initProjectsPage();
      } catch (e) {
        console.warn("Auto-init projects error:", e);
      }
    }
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (qs("projects-lead") || qs("projects-board")) {
        try {
          initProjectsPage();
        } catch (e) {
          console.warn("DOMContentLoaded projects error:", e);
        }
      }
    });
  }
})();
