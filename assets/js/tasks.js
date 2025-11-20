// assets/js/tasks.js — Tasks page with drag-and-drop Kanban functionality
(function () {
  let draggedTask = null;
  let activeFilters = { project: '', status: '', priority: '' };

  function qs(id) {
    return document.getElementById(id);
  }

  function safeText(value) {
    if (typeof window.escapeHtml === "function") {
      return window.escapeHtml(value || "");
    }
    return (value || "").toString().replace(/[&<>"']/g, function (c) {
      return (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c
      );
    });
  }

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      project: params.get('project') || ''
    };
  }

  function renderTasks() {
    const store = window.ubaStore;
    if (!store || !store.tasks) return;
    
    const allTasks = store.tasks.getAll() || [];
    const filteredTasks = filterTasks(allTasks);
    const statuses = ['todo', 'in_progress', 'done'];

    // Clear all columns
    statuses.forEach(status => {
      const col = qs(`tasks-${status}`);
      if (col) col.innerHTML = '';
    });

    // Render filtered tasks
    filteredTasks.forEach((task) => {
      const card = createTaskCard(task);
      const targetCol = qs(`tasks-${task.status || 'todo'}`);
      if (targetCol) targetCol.appendChild(card);
    });

    // Show empty state if no tasks
    statuses.forEach(status => {
      const col = qs(`tasks-${status}`);
      if (col && col.children.length === 0) {
        const empty = document.createElement("div");
        empty.className = "uba-pipe-item";
        empty.style.opacity = "0.6";
        empty.textContent = "No tasks";
        col.appendChild(empty);
      }
    });
  }

  function filterTasks(tasks) {
    return tasks.filter(task => {
      if (activeFilters.project && task.projectId !== activeFilters.project) return false;
      if (activeFilters.status && task.status !== activeFilters.status) return false;
      if (activeFilters.priority && task.priority !== activeFilters.priority) return false;
      return true;
    });
  }

  function createTaskCard(task) {
    const card = document.createElement("div");
    card.className = "uba-pipe-item";
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.style.cursor = "grab";

    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b', 
      high: '#ef4444'
    };

    const priorityColor = priorityColors[task.priority] || '#6b7280';

    const title = document.createElement("h4");
    title.className = "uba-pipe-title";
    title.textContent = task.title || "Untitled Task";

    const meta = document.createElement("div");
    meta.style.fontSize = "12px";
    meta.style.color = "var(--muted)";
    meta.style.marginTop = "4px";

    // Add project info if available
    if (task.projectId) {
      const store = window.ubaStore;
      const project = store.projects ? store.projects.get(task.projectId) : null;
      if (project) {
        const projectSpan = document.createElement("span");
        projectSpan.textContent = project.title || 'Project';
        projectSpan.style.marginRight = "8px";
        meta.appendChild(projectSpan);
      }
    }

    // Add due date if available
    if (task.due) {
      const dueSpan = document.createElement("span");
      dueSpan.textContent = new Date(task.due).toLocaleDateString();
      dueSpan.style.color = isDueToday(task.due) ? '#ef4444' : 'var(--muted)';
      meta.appendChild(dueSpan);
    }

    const description = document.createElement("div");
    description.style.fontSize = "12px";
    description.style.marginTop = "4px";
    description.style.color = "var(--muted)";
    if (task.description) {
      description.textContent = task.description.length > 60 
        ? task.description.substring(0, 60) + "..." 
        : task.description;
    }

    // Priority indicator
    const priorityBadge = document.createElement("div");
    priorityBadge.style.width = "12px";
    priorityBadge.style.height = "3px";
    priorityBadge.style.backgroundColor = priorityColor;
    priorityBadge.style.borderRadius = "2px";
    priorityBadge.style.marginTop = "6px";
    priorityBadge.title = `Priority: ${task.priority || 'low'}`;

    const actions = document.createElement("div");
    actions.className = "uba-chip-row";
    actions.style.marginTop = "8px";
    actions.innerHTML = `
      <button type="button" class="uba-chip" onclick="editTask('${task.id}')">Edit</button>
      <button type="button" class="uba-chip" onclick="deleteTask('${task.id}')">Delete</button>
    `;

    card.appendChild(title);
    if (meta.textContent.trim()) card.appendChild(meta);
    if (task.description) card.appendChild(description);
    card.appendChild(priorityBadge);
    card.appendChild(actions);

    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
  }

  function isDueToday(dueDate) {
    if (!dueDate) return false;
    try {
      const today = new Date().toISOString().split('T')[0];
      const due = new Date(dueDate).toISOString().split('T')[0];
      return due === today;
    } catch (e) {
      return false;
    }
  }

  function handleDragStart(e) {
    draggedTask = e.target;
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '';
    draggedTask = null;
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
    
    if (!draggedTask) return;

    const taskId = draggedTask.dataset.taskId;
    const newStatus = e.target.closest('.uba-pipe-col').dataset.status;
    
    if (!taskId || !newStatus) return;

    // Update task status in store
    const store = window.ubaStore;
    if (store && store.tasks) {
      try {
        store.tasks.update(taskId, { status: newStatus });
        renderTasks(); // Re-render to show updated position
      } catch (err) {
        console.warn('Error updating task status:', err);
      }
    }
  }

  function populateProjectDropdowns() {
    const store = window.ubaStore;
    const projects = store && store.projects ? store.projects.getAll() : [];
    
    const filterSelect = qs('filter-project');
    const taskSelect = qs('task-project');
    
    [filterSelect, taskSelect].forEach(select => {
      if (!select) return;
      
      // Keep first option (All Projects / No Project)
      const firstOption = select.querySelector('option');
      select.innerHTML = '';
      if (firstOption) select.appendChild(firstOption);
      
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.title || 'Untitled Project';
        select.appendChild(option);
      });
    });

    // Auto-select project from URL params
    const urlParams = getUrlParams();
    if (urlParams.project && filterSelect) {
      filterSelect.value = urlParams.project;
      activeFilters.project = urlParams.project;
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
    qs("task-id").value = "";
    qs("task-title").value = "";
    qs("task-project").value = activeFilters.project || "";
    qs("task-status").value = "todo";
    qs("task-priority").value = "medium";
    qs("task-due").value = "";
    qs("task-description").value = "";
    showModal("task-form-modal");
    qs("task-title").focus();
  }

  function openEditForm(id) {
    const store = window.ubaStore;
    if (!store || !store.tasks) return;
    
    const task = store.tasks.get(id);
    if (!task) return;
    
    qs("task-id").value = task.id;
    qs("task-title").value = task.title || "";
    qs("task-project").value = task.projectId || "";
    qs("task-status").value = task.status || "todo";
    qs("task-priority").value = task.priority || "medium";
    qs("task-due").value = task.due || "";
    qs("task-description").value = task.description || "";
    showModal("task-form-modal");
    qs("task-title").focus();
  }

  function deleteTask(id) {
    if (!confirm("Delete this task? This action cannot be undone.")) return;
    
    const store = window.ubaStore;
    if (store && store.tasks) {
      try {
        store.tasks.delete(id);
        renderTasks();
      } catch (e) {
        console.warn("Error deleting task:", e);
      }
    }
  }

  function setupFilters() {
    const projectFilter = qs('filter-project');
    const statusFilter = qs('filter-status');
    const priorityFilter = qs('filter-priority');
    const clearBtn = qs('clear-filters');

    [projectFilter, statusFilter, priorityFilter].forEach(filter => {
      if (filter) {
        filter.addEventListener('change', (e) => {
          const filterType = e.target.id.replace('filter-', '');
          activeFilters[filterType] = e.target.value;
          renderTasks();
        });
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        activeFilters = { project: '', status: '', priority: '' };
        if (projectFilter) projectFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        if (priorityFilter) priorityFilter.value = '';
        renderTasks();
      });
    }
  }

  function bindEvents() {
    // Form submission
    const form = qs("task-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const store = window.ubaStore;
        if (!store || !store.tasks) return;
        
        const id = qs("task-id").value;
        const payload = {
          title: qs("task-title").value.trim(),
          projectId: qs("task-project").value || null,
          status: qs("task-status").value || "todo",
          priority: qs("task-priority").value || "medium",
          due: qs("task-due").value || null,
          description: qs("task-description").value.trim(),
        };
        
        try {
          if (id) {
            store.tasks.update(id, payload);
          } else {
            store.tasks.create(payload);
          }
          hideModal("task-form-modal");
          renderTasks();
        } catch (e) {
          console.warn("Error saving task:", e);
        }
      });
    }

    // Modal controls
    const addBtn = qs("add-task-btn");
    if (addBtn) addBtn.addEventListener("click", openAddForm);

    const cancelBtn = qs("task-cancel");
    if (cancelBtn) cancelBtn.addEventListener("click", () => hideModal("task-form-modal"));

    const closeBtn = qs("task-form-close");
    if (closeBtn) closeBtn.addEventListener("click", () => hideModal("task-form-modal"));

    // Modal overlay clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('uba-modal-overlay')) {
        if (e.target.closest('#task-form-modal')) {
          hideModal('task-form-modal');
        }
      }
    });
  }

  function initTasksPage() {
    try {
      populateProjectDropdowns();
      setupFilters();
      bindEvents();
      setupDropZones();
      renderTasks();
    } catch (e) {
      console.warn("initTasksPage error:", e);
    }
  }

  // Global functions for onclick handlers
  window.editTask = openEditForm;
  window.deleteTask = deleteTask;

  // Expose main functions
  window.renderTasksStandalone = renderTasks;
  window.initTasksPage = initTasksPage;

  // Auto-init if page is ready
  if (document.readyState === "complete" || document.readyState === "interactive") {
    if (qs("tasks-todo") || qs("tasks-columns")) {
      try {
        initTasksPage();
      } catch (e) {
        console.warn("Auto-init tasks error:", e);
      }
    }
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (qs("tasks-todo") || qs("tasks-columns")) {
        try {
          initTasksPage();
        } catch (e) {
          console.warn("DOMContentLoaded tasks error:", e);
        }
      }
    });
  }
})();
