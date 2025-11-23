// assets/js/projects-new.js — Modernized Projects Kanban Board
// Consolidated and simplified implementation with improved UX
(function () {
  'use strict';

  // State management
  const state = {
    draggedElement: null,
    draggedProjectId: null,
    currentFilter: 'all',
    currentSort: 'created',
    eventsBound: false
  };

  // Utility functions
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => document.querySelectorAll(selector);

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0);
    } catch (e) {
      return `€${amount || 0}`;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return date;
    }
  };

  // Get store (supports both Supabase and local)
  const getStore = () => window.SupabaseStore || window.ubaStore;

  // Get all projects
  const getProjects = async () => {
    const store = getStore();
    if (!store || !store.projects) return [];
    
    if (window.SupabaseStore) {
      return await store.projects.getAll() || [];
    }
    return store.projects.getAll() || [];
  };

  // Get project by ID
  const getProject = async (id) => {
    const store = getStore();
    if (!store || !store.projects) return null;
    
    if (window.SupabaseStore) {
      return await store.projects.get(id);
    }
    return store.projects.get(id);
  };

  // Get tasks for a project
  const getProjectTasks = (projectId) => {
    const store = getStore();
    if (!store || !store.tasks) return [];
    
    const tasks = store.tasks.getAll() || [];
    return tasks.filter(t => t.projectId === projectId || t.project_id === projectId);
  };

  // Show toast notification
  const showToast = (message, type = 'info') => {
    if (window.UBANotifications && window.UBANotifications.show) {
      window.UBANotifications.show(message, type);
      return;
    }

    // Fallback toast implementation
    const toast = document.createElement('div');
    toast.className = `uba-toast uba-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      z-index: 10000;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Modal management
  const showModal = (modalId) => {
    const modal = $(modalId);
    if (modal) {
      modal.classList.remove('is-hidden');
      modal.setAttribute('aria-hidden', 'false');
      modal.style.display = 'flex';
      modal.style.pointerEvents = 'auto';
      document.body.style.overflow = 'hidden';
    }
  };

  const hideModal = (modalId) => {
    const modal = $(modalId);
    if (modal) {
      modal.classList.add('is-hidden');
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
      modal.style.pointerEvents = 'none';
      document.body.style.overflow = '';
    }
  };

  // Sorting and filtering
  const sortProjects = (projects) => {
    return [...projects].sort((a, b) => {
      switch (state.currentSort) {
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
  };

  const filterProjects = (projects) => {
    switch (state.currentFilter) {
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
  };

  // Update counts
  const updateCounts = async () => {
    const projects = await getProjects();
    const stages = ['lead', 'in_progress', 'ongoing', 'completed'];
    
    stages.forEach(stage => {
      const count = projects.filter(p => p.stage === stage).length;
      const countEl = $(`${stage}-count`);
      if (countEl) countEl.textContent = count;
      
      const columnBody = $(`projects-${stage}`);
      const emptyEl = columnBody?.querySelector('.uba-column-empty');
      if (emptyEl) {
        const hasProjects = columnBody.querySelectorAll('.uba-project-card').length > 0;
        emptyEl.style.display = hasProjects ? 'none' : 'flex';
      }
    });
    
    const activeCount = projects.filter(p => p.stage !== 'completed').length;
    const totalCountEl = $('projects-count');
    if (totalCountEl) totalCountEl.textContent = activeCount;
  };

  // Create project card
  const createProjectCard = (project) => {
    const card = document.createElement('div');
    card.className = 'uba-project-card';
    card.draggable = true;
    card.dataset.projectId = project.id;
    card.dataset.stage = project.stage || 'lead';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Project: ${project.title || 'Untitled'}`);

    // Priority badge color
    const priorityClass = project.priority ? `priority-${project.priority}` : 'priority-medium';
    const priorityLabel = (project.priority || 'medium').charAt(0).toUpperCase();

    // Get task count
    const tasks = getProjectTasks(project.id);
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed');
    const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    card.innerHTML = `
      <div class="uba-card-header-compact">
        <div class="uba-card-title-group">
          <h4 class="uba-card-title-compact" title="${project.title || 'Untitled Project'}">${project.title || 'Untitled Project'}</h4>
          <span class="uba-priority-badge ${priorityClass}" title="Priority: ${project.priority || 'medium'}">${priorityLabel}</span>
        </div>
        <div class="uba-card-drag-handle" title="Drag to move" aria-label="Drag to move project">⋮⋮</div>
      </div>
      
      <div class="uba-card-content-compact">
        ${project.client || project.budget ? `
          <div class="uba-card-meta-compact">
            ${project.client ? `<span>👤 ${project.client}</span>` : ''}
            ${project.client && project.budget ? '<span>•</span>' : ''}
            ${project.budget ? `<span>💰 ${formatCurrency(project.budget)}</span>` : ''}
          </div>
        ` : ''}
        
        ${project.deadline ? `
          <div class="uba-card-meta-compact">
            <span>📅 Due: ${formatDate(project.deadline)}</span>
          </div>
        ` : ''}
        
        ${project.notes ? `
          <div class="uba-card-notes-compact" title="${project.notes}">
            ${project.notes.length > 60 ? project.notes.substring(0, 60) + '...' : project.notes}
          </div>
        ` : ''}
        
        ${tasks.length > 0 ? `
          <div class="uba-project-progress-bar">
            <div class="uba-progress-label">
              <span>Progress</span>
              <span>${progress}%</span>
            </div>
            <div class="uba-progress-track">
              <div class="uba-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="uba-progress-stats">
              <small>${completedTasks.length}/${tasks.length} tasks completed</small>
            </div>
          </div>
        ` : ''}
      </div>
      
      <div class="uba-card-footer-compact">
        <div class="uba-card-actions-compact">
          <button class="uba-action-btn uba-action-view" title="View details" aria-label="View project details">👁️</button>
          <button class="uba-action-btn uba-action-edit" title="Edit project" aria-label="Edit project">✏️</button>
          <button class="uba-action-btn uba-action-delete" title="Delete project" aria-label="Delete project">🗑️</button>
        </div>
        <div class="uba-card-tasks-link" ${tasks.length ? 'style="cursor: pointer;"' : ''}>
          ${tasks.length > 0 
            ? `<span class="uba-tasks-icon">✅</span> ${tasks.length} task${tasks.length !== 1 ? 's' : ''}` 
            : `<span class="uba-tasks-icon">➕</span> Add tasks`
          }
        </div>
      </div>
    `;

    // Event listeners
    card.querySelector('.uba-action-view').addEventListener('click', (e) => {
      e.stopPropagation();
      viewProject(project.id);
    });

    card.querySelector('.uba-action-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      editProject(project.id);
    });

    card.querySelector('.uba-action-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteProject(project.id);
    });

    card.querySelector('.uba-card-tasks-link').addEventListener('click', (e) => {
      e.stopPropagation();
      if (tasks.length > 0) {
        window.location.href = `tasks.html?project=${project.id}`;
      } else {
        window.location.href = `tasks.html?new=true&project=${project.id}`;
      }
    });

    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('click', () => viewProject(project.id));

    return card;
  };

  // Render all projects
  const renderProjects = async () => {
    let projects = await getProjects();
    projects = filterProjects(sortProjects(projects));
    
    const stages = ['lead', 'in_progress', 'ongoing', 'completed'];
    
    // Clear columns
    stages.forEach(stage => {
      const column = $(`projects-${stage}`);
      if (column) {
        const cards = column.querySelectorAll('.uba-project-card');
        cards.forEach(card => card.remove());
      }
    });
    
    // Render projects
    projects.forEach(project => {
      const card = createProjectCard(project);
      const column = $(`projects-${project.stage || 'lead'}`);
      if (column) {
        const emptyState = column.querySelector('.uba-column-empty');
        if (emptyState) {
          column.insertBefore(card, emptyState);
        } else {
          column.appendChild(card);
        }
      }
    });
    
    await updateCounts();
  };

  // Drag and drop handlers
  const handleDragStart = (e) => {
    state.draggedElement = e.target;
    state.draggedProjectId = e.target.dataset.projectId;
    
    e.target.style.opacity = '0.5';
    e.target.style.transform = 'rotate(3deg)';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
    
    // Highlight drop zones
    $$('.uba-drop-zone').forEach(zone => {
      zone.classList.add('uba-drop-active');
    });
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    e.target.style.transform = '';
    state.draggedElement = null;
    state.draggedProjectId = null;
    
    // Remove highlights
    $$('.uba-drop-active, .uba-drop-over').forEach(zone => {
      zone.classList.remove('uba-drop-active', 'uba-drop-over');
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    if (e.target.classList.contains('uba-drop-zone')) {
      e.target.classList.add('uba-drop-over');
    }
  };

  const handleDragLeave = (e) => {
    if (e.target.classList.contains('uba-drop-zone')) {
      e.target.classList.remove('uba-drop-over');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dropZone = e.target.classList.contains('uba-drop-zone') 
      ? e.target 
      : e.target.closest('.uba-drop-zone');
    
    if (!dropZone || !state.draggedProjectId) return;
    
    const newStage = dropZone.dataset.stage;
    const project = await getProject(state.draggedProjectId);
    
    if (!project || project.stage === newStage) return;
    
    // Update project
    const store = getStore();
    if (store && store.projects) {
      try {
        if (window.SupabaseStore) {
          await store.projects.update(state.draggedProjectId, {
            stage: newStage,
            updated: new Date().toISOString()
          });
        } else {
          store.projects.update(state.draggedProjectId, {
            stage: newStage,
            updated: new Date().toISOString()
          });
        }
        
        const stageNames = {
          lead: 'Leads',
          in_progress: 'In Progress',
          ongoing: 'Ongoing',
          completed: 'Completed'
        };
        
        showToast(`Project moved to ${stageNames[newStage]}`, 'success');
        await renderProjects();
      } catch (err) {
        console.error('Error moving project:', err);
        showToast('Failed to move project', 'error');
      }
    }
    
    dropZone.classList.remove('uba-drop-over');
  };

  // Project CRUD operations
  const openProjectForm = async (projectId = null, stage = 'lead') => {
    const form = $('project-form');
    const titleEl = $('project-form-title');
    
    if (projectId) {
      const project = await getProject(projectId);
      if (!project) return;
      
      $('project-id').value = project.id;
      $('project-title').value = project.title || '';
      $('project-client').value = project.client || '';
      $('project-budget').value = project.budget || '';
      $('project-stage').value = project.stage || 'lead';
      $('project-priority').value = project.priority || 'medium';
      $('project-deadline').value = project.deadline || '';
      $('project-notes').value = project.notes || '';
      
      if (titleEl) titleEl.textContent = 'Edit Project';
    } else {
      form.reset();
      $('project-id').value = '';
      $('project-stage').value = stage;
      $('project-priority').value = 'medium';
      
      if (titleEl) titleEl.textContent = 'New Project';
    }
    
    showModal('project-form-modal');
    $('project-title').focus();
  };

  const saveProject = async (e) => {
    e.preventDefault();
    
    const store = getStore();
    if (!store || !store.projects) return;
    
    const id = $('project-id').value;
    const title = $('project-title').value.trim();
    
    if (!title) {
      showToast('Project title is required', 'error');
      $('project-title').focus();
      return;
    }
    
    const payload = {
      title,
      client: $('project-client').value.trim(),
      budget: Number($('project-budget').value) || 0,
      stage: $('project-stage').value || 'lead',
      priority: $('project-priority').value || 'medium',
      deadline: $('project-deadline').value || null,
      notes: $('project-notes').value.trim(),
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
        showToast(`Project "${title}" updated`, 'success');
      } else {
        if (window.SupabaseStore) {
          await store.projects.create(payload);
        } else {
          store.projects.create(payload);
        }
        showToast(`Project "${title}" created`, 'success');
      }
      
      hideModal('project-form-modal');
      await renderProjects();
    } catch (e) {
      console.error('Error saving project:', e);
      showToast('Failed to save project', 'error');
    }
  };

  const viewProject = async (projectId) => {
    const project = await getProject(projectId);
    if (!project) return;
    
    const tasks = getProjectTasks(projectId);
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed');
    const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    
    const titleEl = $('project-detail-title');
    const contentEl = $('project-detail-content');
    
    if (titleEl) titleEl.textContent = project.title || 'Project Details';
    
    if (contentEl) {
      const stageEmoji = {
        lead: '🔍',
        in_progress: '🚀',
        ongoing: '⚡',
        completed: '✅'
      };
      
      const stageName = {
        lead: 'Lead',
        in_progress: 'In Progress',
        ongoing: 'Ongoing',
        completed: 'Completed'
      };
      
      contentEl.innerHTML = `
        <div class="uba-detail-grid">
          <div class="uba-detail-section">
            <h4>Project Information</h4>
            <div class="uba-detail-item">
              <label>Stage</label>
              <div class="uba-detail-value">
                <span class="uba-stage-badge stage-${project.stage || 'lead'}">
                  ${stageEmoji[project.stage || 'lead']} ${stageName[project.stage || 'lead']}
                </span>
              </div>
            </div>
            ${project.client ? `
              <div class="uba-detail-item">
                <label>Client</label>
                <div class="uba-detail-value">${project.client}</div>
              </div>
            ` : ''}
            ${project.budget ? `
              <div class="uba-detail-item">
                <label>Budget</label>
                <div class="uba-detail-value">${formatCurrency(project.budget)}</div>
              </div>
            ` : ''}
            ${project.priority ? `
              <div class="uba-detail-item">
                <label>Priority</label>
                <div class="uba-detail-value">
                  <span class="uba-priority-badge priority-${project.priority}">${project.priority}</span>
                </div>
              </div>
            ` : ''}
            ${project.deadline ? `
              <div class="uba-detail-item">
                <label>Deadline</label>
                <div class="uba-detail-value">${formatDate(project.deadline)}</div>
              </div>
            ` : ''}
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
                    <div class="uba-progress-fill" style="width: ${progress}%"></div>
                  </div>
                  <span>${completedTasks.length} of ${tasks.length} (${progress}%)</span>
                </div>
              </div>
              <div class="uba-detail-item">
                <label>Recent Tasks</label>
                <div class="uba-detail-value">
                  ${tasks.slice(0, 5).map(t => `
                    <div class="uba-task-item">
                      <span class="uba-task-status status-${t.status || 'todo'}">
                        ${t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔄' : '⏳'}
                      </span>
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
              <a href="tasks.html?project=${projectId}" class="uba-btn uba-btn-primary uba-btn-sm">
                <span class="icon">✅</span> ${tasks.length ? 'Manage Tasks' : 'Add Tasks'}
              </a>
              <button class="uba-btn uba-btn-ghost uba-btn-sm" onclick="window.editProject('${projectId}'); window.hideModal('project-detail-modal');">
                <span class="icon">✏️</span> Edit Project
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    showModal('project-detail-modal');
  };

  const editProject = (projectId) => {
    openProjectForm(projectId);
  };

  const deleteProject = async (projectId) => {
    const project = await getProject(projectId);
    if (!project) return;
    
    if (!confirm(`Delete "${project.title}"?\n\nThis action cannot be undone.`)) return;
    
    const store = getStore();
    if (!store || !store.projects) return;
    
    try {
      if (window.SupabaseStore) {
        await store.projects.delete(projectId);
      } else {
        store.projects.delete(projectId);
      }
      showToast(`Project "${project.title}" deleted`, 'success');
      await renderProjects();
    } catch (e) {
      console.error('Error deleting project:', e);
      showToast('Failed to delete project', 'error');
    }
  };

  // Setup drop zones
  const setupDropZones = () => {
    $$('.uba-drop-zone').forEach(zone => {
      zone.addEventListener('dragover', handleDragOver);
      zone.addEventListener('drop', handleDrop);
      zone.addEventListener('dragenter', handleDragEnter);
      zone.addEventListener('dragleave', handleDragLeave);
    });
  };

  // Bind event listeners
  const bindEvents = () => {
    if (state.eventsBound) return;
    state.eventsBound = true;
    
    // Form submission
    const form = $('project-form');
    if (form) {
      form.addEventListener('submit', saveProject);
    }
    
    // Filter and sort
    const filterSelect = $('project-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        state.currentFilter = e.target.value;
        renderProjects();
      });
    }
    
    const sortSelect = $('project-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        renderProjects();
      });
    }
    
    // Add project button
    const addBtn = $('add-project-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => openProjectForm());
    }
    
    // Column add buttons
    $$('.uba-column-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stage = e.target.closest('[data-stage]').dataset.stage;
        openProjectForm(null, stage);
      });
    });
    
    // Empty state buttons
    $$('.uba-column-empty button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stage = e.target.dataset.stage || e.target.closest('[data-stage]')?.dataset.stage;
        if (stage) openProjectForm(null, stage);
      });
    });
    
    // Modal controls
    const cancelBtn = $('project-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => hideModal('project-form-modal'));
    }
    
    const formCloseBtn = $('project-form-close');
    if (formCloseBtn) {
      formCloseBtn.addEventListener('click', () => hideModal('project-form-modal'));
    }
    
    const detailCloseBtn = $('project-detail-close');
    if (detailCloseBtn) {
      detailCloseBtn.addEventListener('click', () => hideModal('project-detail-modal'));
    }
    
    const detailCancelBtn = $('project-detail-cancel');
    if (detailCancelBtn) {
      detailCancelBtn.addEventListener('click', () => hideModal('project-detail-modal'));
    }
    
    // Modal overlay clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('uba-modal-overlay')) {
        const modal = e.target.closest('.uba-modal');
        if (modal) {
          hideModal(modal.id);
        }
      }
    });
    
    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!$('project-form-modal').classList.contains('is-hidden')) {
          hideModal('project-form-modal');
        } else if (!$('project-detail-modal').classList.contains('is-hidden')) {
          hideModal('project-detail-modal');
        }
      }
    });
  };

  // Initialize
  const initProjectsPage = async () => {
    try {
      bindEvents();
      setupDropZones();
      await renderProjects();
    } catch (e) {
      console.error('Error initializing projects page:', e);
    }
  };

  // Global exports
  window.viewProject = viewProject;
  window.editProject = editProject;
  window.deleteProject = deleteProject;
  window.initProjectsPage = initProjectsPage;
  window.renderProjectsStandalone = renderProjects;
  window.hideModal = hideModal;

  // Auto-initialize
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if ($('projects-lead') || $('projects-board')) {
      initProjectsPage();
    }
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if ($('projects-lead') || $('projects-board')) {
        initProjectsPage();
      }
    });
  }
})();
