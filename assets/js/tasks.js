// assets/js/tasks.js — Modern Tasks page with sophisticated Kanban functionality
(function () {
  let draggedTask = null;
  let currentProjectFilter = '';
  let currentPriorityFilter = '';
  let currentSort = 'created';
  let eventsBound = false;
  const statuses = ['todo', 'in_progress', 'done'];

  function qs(id) {
    return document.getElementById(id);
  }

  function formatTimeEstimate(hours) {
    if (!hours || hours === 0) return '';
    if (hours < 1) return `${hours * 60}m`;
    if (hours % 1 === 0) return `${hours}h`;
    return `${Math.floor(hours)}h ${(hours % 1) * 60}m`;
  }

  function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;
    try {
      const today = new Date();
      const due = new Date(dueDate);
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return null;
    }
  }

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      project: params.get('project') || '',
      new: params.get('new') === 'true'
    };
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

  async function getAllTasks() {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.tasks) return [];

    if (window.SupabaseStore) {
      return (await store.tasks.getAll()) || [];
    }

    return store.tasks.getAll() || [];
  }

  async function updateTaskCounts(tasks) {
    const sourceTasks = Array.isArray(tasks) && tasks.length ? tasks : await getAllTasks();
    const filtered = filterTasks(sourceTasks);

    const statusCounts = filtered.reduce((acc, task) => {
      const status = statuses.includes(task.status) ? task.status : 'todo';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    statuses.forEach(status => {
      const count = statusCounts[status] || 0;
      const countEl = qs(`${status}-count`);
      if (countEl) countEl.textContent = count;

      const columnBody = qs(`tasks-${status}`);
      const emptyEl = columnBody?.querySelector('.uba-column-empty');
      if (emptyEl) {
        emptyEl.style.display = count === 0 ? 'flex' : 'none';
      }
    });

    const activeTasks = filtered.filter(t => t.status !== 'done');
    const totalCountEl = qs('tasks-count');
    if (totalCountEl) totalCountEl.textContent = activeTasks.length;
  }

  function sortTasks(tasks) {
    return tasks.sort((a, b) => {
      switch (currentSort) {
        case 'due':
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return new Date(a.due) - new Date(b.due);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'created':
        default:
          return new Date(b.created || 0) - new Date(a.created || 0);
      }
    });
  }

  function filterTasks(tasks) {
    return tasks.filter(task => {
      if (currentProjectFilter && task.projectId !== currentProjectFilter) return false;
      if (currentPriorityFilter && task.priority !== currentPriorityFilter) return false;
      return true;
    });
  }

  async function renderTasks() {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.tasks) return;

    const tasks = sortTasks(filterTasks(await getAllTasks()));

    const columnFragments = statuses.reduce((acc, status) => {
      acc[status] = document.createDocumentFragment();
      return acc;
    }, {});

    statuses.forEach(status => {
      const col = qs(`tasks-${status}`);
      if (col) {
        col.querySelectorAll('.uba-task-card').forEach(card => card.remove());
      }
    });

    tasks.forEach((task) => {
      const status = statuses.includes(task.status) ? task.status : 'todo';
      columnFragments[status].appendChild(createTaskCard(task));
    });

    statuses.forEach(status => {
      const targetCol = qs(`tasks-${status}`);
      if (targetCol) {
        const emptyEl = targetCol.querySelector('.uba-column-empty');
        const insertionTarget = emptyEl || null;
        targetCol.insertBefore(columnFragments[status], insertionTarget);
      }
    });

    await updateTaskCounts(tasks);
  }

  function createTaskCard(task) {
    const card = document.createElement("div");
    card.className = "uba-task-card";
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.status = task.status || 'todo';

    const header = document.createElement("div");
    header.className = "uba-card-header-compact";
    
    const titleGroup = document.createElement("div");
    titleGroup.className = "uba-card-title-group";
    
    const title = document.createElement("h4");
    title.className = "uba-card-title-compact";
    title.textContent = task.title || "Untitled Task";
    title.title = task.title || "Untitled Task";
    
    const priorityBadge = document.createElement("span");
    priorityBadge.className = `uba-priority-badge priority-${task.priority || 'medium'}`;
    priorityBadge.textContent = (task.priority || 'medium').charAt(0).toUpperCase();
    priorityBadge.title = `Priority: ${task.priority || 'medium'}`;
    
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
    
    // Meta information
    const meta = document.createElement("div");
    meta.className = "uba-card-meta-compact";
    
    const metaParts = [];
    
    // Project info
    if (task.projectId) {
      const store = window.ubaStore;
      const project = store.projects ? store.projects.get(task.projectId) : null;
      if (project) {
        metaParts.push(`💼 ${project.title}`);
      }
    }
    
    // Due date with urgency indicator
    if (task.due) {
      const daysUntil = getDaysUntilDue(task.due);
      const dateStr = new Date(task.due).toLocaleDateString();
      let duePart = `📅 ${dateStr}`;
      
      if (daysUntil !== null) {
        if (daysUntil < 0) {
          duePart = `🔴 ${dateStr} (overdue)`;
        } else if (daysUntil === 0) {
          duePart = `🟡 ${dateStr} (today)`;
        } else if (daysUntil <= 3) {
          duePart = `🟠 ${dateStr} (${daysUntil} days)`;
        }
      }
      
      metaParts.push(duePart);
    }
    
    // Time estimate
    if (task.estimate) {
      metaParts.push(`⏱️ ${formatTimeEstimate(task.estimate)}`);
    }
    
    if (metaParts.length > 0) {
      meta.innerHTML = metaParts.join(' • ');
      content.appendChild(meta);
    }

    // Description
    if (task.description) {
      const description = document.createElement("div");
      description.className = "uba-card-notes-compact";
      const truncated = task.description.length > 80 
        ? task.description.substring(0, 80) + "..." 
        : task.description;
      description.textContent = truncated;
      description.title = task.description;
      content.appendChild(description);
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
      viewTask(task.id);
    };
    
    const editBtn = document.createElement("button");
    editBtn.className = "uba-action-btn uba-action-edit";
    editBtn.innerHTML = "✏️";
    editBtn.title = "Edit task";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      editTask(task.id);
    };
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "uba-action-btn uba-action-delete";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Delete task";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    };
    
    actions.appendChild(viewBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    // Project link or quick status toggle
    const statusActions = document.createElement("div");
    statusActions.className = "uba-card-status-actions";
    
    if (task.status === 'todo') {
      const startBtn = document.createElement("button");
      startBtn.className = "uba-status-btn uba-status-start";
      startBtn.innerHTML = "▶️ Start";
      startBtn.onclick = (e) => {
        e.stopPropagation();
        updateTaskStatus(task.id, 'in_progress');
      };
      statusActions.appendChild(startBtn);
    } else if (task.status === 'in_progress') {
      const completeBtn = document.createElement("button");
      completeBtn.className = "uba-status-btn uba-status-complete";
      completeBtn.innerHTML = "✅ Complete";
      completeBtn.onclick = (e) => {
        e.stopPropagation();
        updateTaskStatus(task.id, 'done');
      };
      statusActions.appendChild(completeBtn);
    } else if (task.status === 'done') {
      const reopenBtn = document.createElement("button");
      reopenBtn.className = "uba-status-btn uba-status-reopen";
      reopenBtn.innerHTML = "🔄 Reopen";
      reopenBtn.onclick = (e) => {
        e.stopPropagation();
        updateTaskStatus(task.id, 'todo');
      };
      statusActions.appendChild(reopenBtn);
    }
    
    footer.appendChild(actions);
    footer.appendChild(statusActions);

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);

    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('click', () => viewTask(task.id));

    return card;
  }

  async function updateTaskStatus(taskId, newStatus) {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.tasks) return;
    
    try {
      // Get original task for automation trigger
      let originalTask = null;
      if (window.SupabaseStore) {
        originalTask = await store.tasks.get(taskId);
      } else {
        originalTask = store.tasks.getById ? store.tasks.getById(taskId) : 
                            store.tasks.get ? store.tasks.get(taskId) : null;
      }
      
      const oldStatus = originalTask ? originalTask.status : null;
      
      if (window.SupabaseStore) {
        await store.tasks.update(taskId, { 
          status: newStatus, 
          updated: new Date().toISOString()
        });
      } else {
        store.tasks.update(taskId, { 
          status: newStatus, 
          updated: new Date().toISOString()
        });
      }
      
      const statusLabels = {
        todo: 'To Do',
        in_progress: 'In Progress',
        done: 'Done'
      };
      
      // Trigger automations for task status changes
      if (typeof window.runAutomations === 'function' && originalTask) {
        if (newStatus === 'done' && oldStatus !== 'done') {
          window.runAutomations('task_completed', { task: { ...originalTask, status: newStatus } });
        }
      }
      
      toast(`Task moved to ${statusLabels[newStatus]}`, 'success');
      await renderTasks();
    } catch (err) {
      console.warn('Error updating task status:', err);
      toast('Failed to update task', 'error');
    }
  }

  function handleDragStart(e) {
    draggedTask = e.target;
    e.target.style.opacity = '0.6';
    e.target.style.transform = 'rotate(3deg)';
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
    draggedTask = null;
    
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

  function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('uba-drag-over');
    
    if (!draggedTask) return;

    const taskId = draggedTask.dataset.taskId;
    const oldStatus = draggedTask.dataset.status;
    const newStatus = e.target.dataset.status || e.target.closest('[data-status]')?.dataset.status;
    
    if (!taskId || !newStatus || oldStatus === newStatus) return;

    updateTaskStatus(taskId, newStatus);
  }

  function populateProjectDropdowns() {
    const store = window.ubaStore;
    const projects = store && store.projects ? store.projects.getAll() : [];
    
    const filterSelect = qs('task-filter-project');
    const taskSelect = qs('task-project');
    
    [filterSelect, taskSelect].forEach(select => {
      if (!select) return;
      
      // Keep first option
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
      currentProjectFilter = urlParams.project;
    }
  }

  function addTaskToStatus(status = 'todo') {
    openAddForm(status);
  }

  function openAddForm(status = 'todo') {
    qs("task-id").value = "";
    qs("task-title").value = "";
    qs("task-project").value = currentProjectFilter || "";
    qs("task-status").value = status;
    qs("task-priority").value = "medium";
    qs("task-due").value = "";
    qs("task-estimate").value = "";
    qs("task-description").value = "";
    
    const titleEl = qs("task-form-title");
    if (titleEl) titleEl.textContent = "New Task";
    
    modal.show("task-form-modal");
    qs("task-title").focus();
  }

  async function editTask(id) {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.tasks) return;
    
    let task = null;
    if (window.SupabaseStore) {
      task = await store.tasks.get(id);
    } else {
      task = store.tasks.get(id);
    }
    
    if (!task) return;
    
    qs("task-id").value = task.id;
    qs("task-title").value = task.title || "";
    qs("task-project").value = task.projectId || "";
    qs("task-status").value = task.status || "todo";
    qs("task-priority").value = task.priority || "medium";
    qs("task-due").value = task.due || "";
    qs("task-estimate").value = task.estimate || "";
    qs("task-description").value = task.description || "";
    
    const titleEl = qs("task-form-title");
    if (titleEl) titleEl.textContent = "Edit Task";
    
    modal.show("task-form-modal");
    qs("task-title").focus();
  }

  async function viewTask(id) {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.tasks) return;
    
    let task = null;
    if (window.SupabaseStore) {
      task = await store.tasks.get(id);
    } else {
      task = store.tasks.get(id);
    }
    
    if (!task) return;

    const project = task.projectId && store.projects ? (window.SupabaseStore ? await store.projects.get(task.projectId) : store.projects.get(task.projectId)) : null;

    const content = qs("task-detail-content");
    const titleEl = qs("task-detail-title");
    
    if (titleEl) titleEl.textContent = task.title || "Task Details";
    
    if (content) {
      const statusEmoji = {
        todo: '📋',
        in_progress: '🔄',
        done: '✅'
      };
      
      const priorityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
      };
      
      const daysUntil = getDaysUntilDue(task.due);
      let dueDateHtml = '';
      
      if (task.due) {
        const dateStr = new Date(task.due).toLocaleDateString();
        let urgencyClass = '';
        let urgencyText = '';
        
        if (daysUntil !== null) {
          if (daysUntil < 0) {
            urgencyClass = 'overdue';
            urgencyText = ` (${Math.abs(daysUntil)} days overdue)`;
          } else if (daysUntil === 0) {
            urgencyClass = 'today';
            urgencyText = ' (due today)';
          } else if (daysUntil <= 3) {
            urgencyClass = 'soon';
            urgencyText = ` (${daysUntil} days left)`;
          }
        }
        
        dueDateHtml = `
          <div class="uba-detail-item">
            <label>Due Date</label>
            <div class="uba-detail-value">
              <span class="uba-due-date ${urgencyClass}">${dateStr}${urgencyText}</span>
            </div>
          </div>
        `;
      }
      
      content.innerHTML = `
        <div class="uba-detail-grid">
          <div class="uba-detail-section">
            <h4>Task Information</h4>
            <div class="uba-detail-item">
              <label>Status</label>
              <div class="uba-detail-value">
                <span class="uba-status-badge status-${task.status || 'todo'}">
                  ${statusEmoji[task.status || 'todo']} ${(task.status || 'todo').replace('_', ' ')}
                </span>
              </div>
            </div>
            <div class="uba-detail-item">
              <label>Priority</label>
              <div class="uba-detail-value">
                <span class="uba-priority-badge-detail priority-${task.priority || 'medium'}">
                  ${priorityEmoji[task.priority || 'medium']} ${(task.priority || 'medium')} Priority
                </span>
              </div>
            </div>
            ${dueDateHtml}
            ${task.estimate ? `
              <div class="uba-detail-item">
                <label>Time Estimate</label>
                <div class="uba-detail-value">${formatTimeEstimate(task.estimate)}</div>
              </div>
            ` : ''}
            ${project ? `
              <div class="uba-detail-item">
                <label>Project</label>
                <div class="uba-detail-value">
                  <a href="projects.html" class="uba-project-link">💼 ${project.title}</a>
                </div>
              </div>
            ` : ''}
            ${task.description ? `
              <div class="uba-detail-item">
                <label>Description</label>
                <div class="uba-detail-value uba-detail-notes">${task.description}</div>
              </div>
            ` : ''}
          </div>
          
          <div class="uba-detail-section">
            <h4>Quick Actions</h4>
            <div class="uba-detail-actions-grid">
              ${task.status === 'todo' ? `
                <button class="uba-quick-action uba-action-start" onclick="updateTaskStatus('${task.id}', 'in_progress'); hideModal('task-detail-modal');">
                  <span class="icon">▶️</span>
                  <span>Start Task</span>
                </button>
              ` : ''}
              ${task.status === 'in_progress' ? `
                <button class="uba-quick-action uba-action-complete" onclick="updateTaskStatus('${task.id}', 'done'); hideModal('task-detail-modal');">
                  <span class="icon">✅</span>
                  <span>Mark Complete</span>
                </button>
              ` : ''}
              ${task.status === 'done' ? `
                <button class="uba-quick-action uba-action-reopen" onclick="updateTaskStatus('${task.id}', 'todo'); hideModal('task-detail-modal');">
                  <span class="icon">🔄</span>
                  <span>Reopen Task</span>
                </button>
              ` : ''}
              <button class="uba-quick-action uba-action-edit" onclick="editTask('${task.id}'); hideModal('task-detail-modal');">
                <span class="icon">✏️</span>
                <span>Edit Task</span>
              </button>
              <button class="uba-quick-action uba-action-duplicate" onclick="duplicateTask('${task.id}'); hideModal('task-detail-modal');">
                <span class="icon">📋</span>
                <span>Duplicate</span>
              </button>
              <button class="uba-quick-action uba-action-delete" onclick="deleteTask('${task.id}'); hideModal('task-detail-modal');">
                <span class="icon">🗑️</span>
                <span>Delete</span>
              </button>
            </div>
            
            <div class="uba-detail-timestamps">
              <div class="uba-detail-item">
                <label>Created</label>
                <div class="uba-detail-value">${task.created ? new Date(task.created).toLocaleString() : 'Unknown'}</div>
              </div>
              ${task.updated ? `
                <div class="uba-detail-item">
                  <label>Last Updated</label>
                  <div class="uba-detail-value">${new Date(task.updated).toLocaleString()}</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }
    
    modal.show("task-detail-modal");
  }

  async function duplicateTask(id) {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.tasks) return;
    
    let task = null;
    if (window.SupabaseStore) {
      task = await store.tasks.get(id);
    } else {
      task = store.tasks.get(id);
    }
    
    if (!task) return;
    
    const newTaskData = {
      title: `${task.title} (Copy)`,
      projectId: task.projectId,
      status: 'todo',
      priority: task.priority,
      due: task.due,
      estimate: task.estimate,
      description: task.description,
      created: new Date().toISOString()
    };
    
    try {
      let createdTask = null;
      if (window.SupabaseStore) {
        createdTask = await store.tasks.create(newTaskData);
      } else {
        createdTask = store.tasks.create(newTaskData);
      }
      
      // Trigger automations for new task
      if (typeof window.runAutomations === 'function' && createdTask) {
        window.runAutomations('task_created', { task: createdTask });
      }
      
      toast('Task duplicated successfully', 'success');
      await renderTasks();
    } catch (e) {
      console.warn("Error duplicating task:", e);
      toast('Failed to duplicate task', 'error');
    }
  }

  async function deleteTask(id) {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.tasks) return;
    
    let task = null;
    if (window.SupabaseStore) {
      task = await store.tasks.get(id);
    } else {
      task = store.tasks.get(id);
    }
    
    if (!task) return;
    
    if (!confirm(`Delete "${task.title}"?

This action cannot be undone.`)) return;
    
    try {
      if (window.SupabaseStore) {
        await store.tasks.delete(id);
      } else {
        store.tasks.delete(id);
      }
      toast(`Task "${task.title}" deleted`, 'success');
      await renderTasks();
    } catch (e) {
      console.warn("Error deleting task:", e);
      toast('Failed to delete task', 'error');
    }
  }

  function bindEvents() {
    // Prevent duplicate event binding
    if (eventsBound) return;
    eventsBound = true;
    
    // Form submission
    const form = qs("task-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const store = window.SupabaseStore || window.ubaStore;
        if (!store || !store.tasks) return;
        
        const id = qs("task-id").value;
        const title = qs("task-title").value.trim();
        
        if (!title) {
          toast('Task title is required', 'error');
          qs("task-title").focus();
          return;
        }
        
        const payload = {
          title: title,
          projectId: qs("task-project").value || null,
          status: qs("task-status").value || "todo",
          priority: qs("task-priority").value || "medium",
          due: qs("task-due").value || null,
          estimate: Number(qs("task-estimate").value) || null,
          description: qs("task-description").value.trim(),
          updated: new Date().toISOString()
        };
        
        if (!id) {
          payload.created = new Date().toISOString();
        }
        
        try {
          if (id) {
            if (window.SupabaseStore) {
              await store.tasks.update(id, payload);
            } else {
              store.tasks.update(id, payload);
            }
            toast(`Task "${title}" updated`, 'success');
          } else {
            let newTask = null;
            if (window.SupabaseStore) {
              newTask = await store.tasks.create(payload);
            } else {
              newTask = store.tasks.create(payload);
            }
            toast(`Task "${title}" created`, 'success');
            
            // Trigger automations for new task
            if (typeof window.runAutomations === 'function' && newTask) {
              window.runAutomations('task_created', { task: newTask });
            }
          }
          modal.hide("task-form-modal");
          await renderTasks();
        } catch (e) {
          console.warn("Error saving task:", e);
          toast('Failed to save task', 'error');
        }
      });
    }

    // Filter and sort controls
    const projectFilter = qs("task-filter-project");
    if (projectFilter) {
      projectFilter.addEventListener('change', (e) => {
        currentProjectFilter = e.target.value;
        renderTasks();
      });
    }

    const priorityFilter = qs("task-filter-priority");
    if (priorityFilter) {
      priorityFilter.addEventListener('change', (e) => {
        currentPriorityFilter = e.target.value;
        renderTasks();
      });
    }

    const sortSelect = qs("task-sort");
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderTasks();
      });
    }

    // Modal controls
    const addBtn = qs("add-task-btn");
    if (addBtn) addBtn.addEventListener("click", () => openAddForm());

    const cancelBtn = qs("task-cancel");
    if (cancelBtn) cancelBtn.addEventListener("click", () => modal.hide("task-form-modal"));

    const closeBtn = qs("task-form-close");
    if (closeBtn) closeBtn.addEventListener("click", () => modal.hide("task-form-modal"));

    const detailCloseBtn = qs("task-detail-close");
    if (detailCloseBtn) detailCloseBtn.addEventListener("click", () => modal.hide("task-detail-modal"));

    // Note: Modal overlay clicks and ESC-to-close handling are centralized
    // in assets/js/app.js to keep behavior consistent across pages.
  }

  async function initTasksPage() {
    try {
      populateProjectDropdowns();
      bindEvents();
      setupDropZones();
      await renderTasks();

      // Handle URL parameters
      const urlParams = getUrlParams();
      if (urlParams.new) {
        // Auto-open task creation form
        setTimeout(() => openAddForm(), 500);
      }
    } catch (e) {
      console.warn("initTasksPage error:", e);
    }
  }

  // Global functions for onclick handlers
  window.editTask = editTask;
  window.deleteTask = deleteTask;
  window.viewTask = viewTask;
  window.addTaskToStatus = addTaskToStatus;
  window.updateTaskStatus = updateTaskStatus;
  window.duplicateTask = duplicateTask;

  // Expose main functions
  window.initTasksPage = initTasksPage;
  window.renderTasksStandalone = renderTasks;

  // Auto-init if page is ready
  if (document.readyState === "complete" || document.readyState === "interactive") {
    if (qs("tasks-todo") || qs("tasks-board")) {
      try {
        initTasksPage();
      } catch (e) {
        console.warn("Auto-init tasks error:", e);
      }
    }
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (qs("tasks-todo") || qs("tasks-board")) {
        try {
          initTasksPage();
        } catch (e) {
          console.warn("DOMContentLoaded tasks error:", e);
        }
      }
    });
  }
})();
