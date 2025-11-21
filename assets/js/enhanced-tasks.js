// enhanced-tasks.js — Advanced task management with due date reminders, details popup, priority coding, and smart search
(function() {
  'use strict';
  
  // Enhanced tasks state
  let enhancedTasksState = {
    reminderInterval: null,
    lastReminderCheck: null,
    searchQuery: '',
    priorityFilter: 'all',
    dueDateFilter: 'all',
    tasksData: [],
    overdueNotified: new Set(),
    upcomingNotified: new Set()
  };
  
  /**
   * Initialize enhanced tasks system
   */
  function initEnhancedTasks() {
    console.log('📋 Initializing enhanced tasks with reminders, details, and smart search');
    
    // Setup due date reminder system
    setupDueDateReminders();
    
    // Setup task details popup
    setupTaskDetailsPopup();
    
    // Setup priority color coding
    setupPriorityColorCoding();
    
    // Setup smart search system
    setupSmartSearch();
    
    // Initial render
    renderEnhancedTasks();
    
    // Start reminder monitoring
    startReminderMonitoring();
    
    console.log('✓ Enhanced tasks system initialized');
  }
  
  /**
   * Setup due date reminder system
   */
  function setupDueDateReminders() {
    // Check for due date reminders every minute
    enhancedTasksState.reminderInterval = setInterval(checkDueDateReminders, 60000);
    
    // Initial check
    setTimeout(checkDueDateReminders, 1000);
  }
  
  /**
   * Check for due date reminders
   */
  function checkDueDateReminders() {
    const store = window.ubaStore;
    if (!store || !store.tasks) return;
    
    const tasks = store.tasks.getAll();
    const now = new Date();
    
    tasks.forEach(task => {
      if (!task.due || task.status === 'done') return;
      
      const dueDate = new Date(task.due);
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Check for overdue tasks
      if (timeDiff < 0 && !enhancedTasksState.overdueNotified.has(task.id)) {
        showDueDateReminder(task, 'overdue', Math.abs(daysDiff));
        enhancedTasksState.overdueNotified.add(task.id);
      }
      
      // Check for tasks due today
      else if (daysDiff === 0 && !enhancedTasksState.upcomingNotified.has(task.id)) {
        showDueDateReminder(task, 'today', 0);
        enhancedTasksState.upcomingNotified.add(task.id);
      }
      
      // Check for tasks due tomorrow
      else if (daysDiff === 1 && !enhancedTasksState.upcomingNotified.has(task.id)) {
        showDueDateReminder(task, 'tomorrow', 1);
        enhancedTasksState.upcomingNotified.add(task.id);
      }
      
      // Check for tasks due in 3 days (weekly reminder)
      else if (daysDiff === 3 && !enhancedTasksState.upcomingNotified.has(task.id)) {
        showDueDateReminder(task, 'upcoming', 3);
        enhancedTasksState.upcomingNotified.add(task.id);
      }
    });
    
    enhancedTasksState.lastReminderCheck = now;
  }
  
  /**
   * Show due date reminder notification
   */
  function showDueDateReminder(task, type, days) {
    let message, notificationType, title;
    
    switch (type) {
      case 'overdue':
        message = `Task \"${task.title}\" is ${days} day${days !== 1 ? 's' : ''} overdue`;
        notificationType = 'error';
        title = 'Overdue Task';
        break;
      case 'today':
        message = `Task \"${task.title}\" is due today`;
        notificationType = 'warning';
        title = 'Task Due Today';
        break;
      case 'tomorrow':
        message = `Task \"${task.title}\" is due tomorrow`;
        notificationType = 'warning';
        title = 'Task Due Tomorrow';
        break;
      case 'upcoming':
        message = `Task \"${task.title}\" is due in ${days} days`;
        notificationType = 'info';
        title = 'Upcoming Task';
        break;
    }
    
    // Show notification
    if (window.showToast) {
      window.showToast(message, notificationType, {
        title: title,
        duration: type === 'overdue' ? 10000 : 5000,
        action: {
          text: 'View Task',
          callback: () => showTaskDetails(task.id)
        }
      });
    }
    
    // Create persistent notification for important reminders
    if (type === 'overdue' || type === 'today') {
      createDueDateNotificationBadge(task, type);
    }
  }
  
  /**
   * Create due date notification badge
   */
  function createDueDateNotificationBadge(task, type) {
    // Add visual indicators to task cards
    const taskCards = document.querySelectorAll(`[data-task-id=\"${task.id}\"]`);
    
    taskCards.forEach(card => {
      // Remove existing badges
      const existingBadge = card.querySelector('.uba-due-badge');
      if (existingBadge) existingBadge.remove();
      
      // Create new badge
      const badge = document.createElement('div');
      badge.className = `uba-due-badge uba-due-${type}`;
      badge.innerHTML = `
        <span class=\"uba-due-icon\">${type === 'overdue' ? '🚨' : '⚠️'}</span>
        <span class=\"uba-due-text\">${type === 'overdue' ? 'Overdue' : 'Due Today'}</span>
      `;
      
      // Add to card header
      const header = card.querySelector('.uba-card-header, .uba-task-header');
      if (header) {
        header.appendChild(badge);
      } else {
        card.insertBefore(badge, card.firstChild);
      }
    });
  }
  
  /**
   * Start reminder monitoring
   */
  function startReminderMonitoring() {
    // Check reminders when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkDueDateReminders();
      }
    });
    
    // Check reminders when window gains focus
    window.addEventListener('focus', checkDueDateReminders);
  }
  
  /**
   * Setup task details popup
   */
  function setupTaskDetailsPopup() {
    createTaskDetailsModal();
  }
  
  /**
   * Create task details modal
   */
  function createTaskDetailsModal() {
    if (document.getElementById('task-details-modal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'task-details-modal';
    modal.className = 'uba-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class=\"uba-modal-overlay\" onclick=\"closeTaskDetailsModal()\"></div>
      <div class=\"uba-modal-content uba-modal-large\">
        <div class=\"uba-modal-header\">
          <h3 id=\"task-details-title\">Task Details</h3>
          <button type=\"button\" class=\"uba-modal-close\" onclick=\"closeTaskDetailsModal()\">×</button>
        </div>
        <div class=\"uba-modal-body\">
          <div class=\"uba-task-details\">
            <!-- Task details will be rendered here -->
          </div>
        </div>
        <div class=\"uba-modal-footer\">
          <button type=\"button\" class=\"uba-btn-ghost\" onclick=\"closeTaskDetailsModal()\">Close</button>
          <button type=\"button\" class=\"uba-btn-secondary\" onclick=\"editTaskFromDetails()\">Edit Task</button>
          <button type=\"button\" class=\"uba-btn-primary\" onclick=\"completeTaskFromDetails()\">Mark Complete</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  /**
   * Show task details in modal
   */
  function showTaskDetails(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    
    const modal = document.getElementById('task-details-modal');
    const title = document.getElementById('task-details-title');
    const detailsContainer = modal.querySelector('.uba-task-details');
    
    if (!modal || !detailsContainer) return;
    
    // Set title
    if (title) {
      title.textContent = task.title || 'Task Details';
    }
    
    // Get linked project
    const linkedProject = getTaskProject(task);
    
    // Calculate time information
    const timeInfo = calculateTaskTimeInfo(task);
    
    // Render task details
    detailsContainer.innerHTML = `
      <div class=\"uba-task-overview\">
        <div class=\"uba-overview-section\">
          <h4>Task Information</h4>
          <div class=\"uba-task-info-grid\">
            <div><strong>Status:</strong> <span class=\"uba-status uba-status-${task.status}\">${formatTaskStatus(task.status)}</span></div>
            <div><strong>Priority:</strong> <span class=\"uba-priority uba-priority-${task.priority || 'medium'}\">${formatPriority(task.priority || 'medium')}</span></div>
            <div><strong>Created:</strong> ${formatDate(task.created_at)}</div>
            <div><strong>Due Date:</strong> ${task.due ? formatDueDate(task.due) : 'Not set'}</div>
          </div>
          ${task.description ? `<div class=\"uba-task-description\"><h5>Description</h5><p>${task.description}</p></div>` : ''}
        </div>
        
        ${timeInfo.html ? `<div class=\"uba-overview-section\">
          <h4>Time Information</h4>
          ${timeInfo.html}
        </div>` : ''}
        
        ${linkedProject ? `<div class=\"uba-overview-section\">
          <h4>Linked Project</h4>
          <div class=\"uba-linked-project\" onclick=\"showProjectDetails('${linkedProject.id}')\">
            <div class=\"uba-project-info\">
              <h5>${linkedProject.name}</h5>
              <p>Stage: <span class=\"uba-stage-badge uba-stage-${linkedProject.stage}\">${formatStage(linkedProject.stage)}</span></p>
              ${linkedProject.client ? `<p>Client: ${linkedProject.client}</p>` : ''}
            </div>
            <button class=\"uba-btn-sm uba-btn-ghost\">View Project</button>
          </div>
        </div>` : ''}
        
        <div class=\"uba-overview-section\">
          <h4>Task Actions</h4>
          <div class=\"uba-task-actions-grid\">
            <button class=\"uba-action-btn uba-action-edit\" onclick=\"editTaskFromDetails()\">
              <span class=\"uba-action-icon\">✏️</span>
              <span>Edit Task</span>
            </button>
            <button class=\"uba-action-btn uba-action-duplicate\" onclick=\"duplicateTask('${task.id}')\">
              <span class=\"uba-action-icon\">📋</span>
              <span>Duplicate</span>
            </button>
            <button class=\"uba-action-btn uba-action-move\" onclick=\"moveTaskToColumn('${task.id}')\">
              <span class=\"uba-action-icon\">🔄</span>
              <span>Move Status</span>
            </button>
            <button class=\"uba-action-btn uba-action-delete\" onclick=\"deleteTaskFromDetails('${task.id}')\">
              <span class=\"uba-action-icon\">🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
        
        <div class=\"uba-overview-section\">
          <h4>Activity Log</h4>
          <div class=\"uba-activity-log\">
            ${generateTaskActivityLog(task)}
          </div>
        </div>
      </div>
    `;
    
    // Show modal
    modal.style.display = 'block';
    modal.dataset.taskId = taskId;
  }
  
  /**
   * Calculate task time information
   */
  function calculateTaskTimeInfo(task) {
    if (!task.due) return { html: null };
    
    const now = new Date();
    const dueDate = new Date(task.due);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    let statusClass, statusText, statusIcon;
    
    if (timeDiff < 0) {
      statusClass = 'overdue';
      statusText = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}`;
      statusIcon = '🚨';
    } else if (daysDiff === 0) {
      statusClass = 'due-today';
      statusText = 'Due today';
      statusIcon = '⚠️';
    } else if (daysDiff === 1) {
      statusClass = 'due-soon';
      statusText = 'Due tomorrow';
      statusIcon = '📅';
    } else if (daysDiff <= 7) {
      statusClass = 'due-week';
      statusText = `Due in ${daysDiff} days`;
      statusIcon = '📅';
    } else {
      statusClass = 'due-future';
      statusText = `Due in ${daysDiff} days`;
      statusIcon = '📅';
    }
    
    return {
      html: `
        <div class=\"uba-time-status uba-time-${statusClass}\">
          <span class=\"uba-time-icon\">${statusIcon}</span>
          <span class=\"uba-time-text\">${statusText}</span>
          <span class=\"uba-time-date\">${formatDate(task.due)}</span>
        </div>
      `
    };
  }
  
  /**
   * Generate task activity log
   */
  function generateTaskActivityLog(task) {
    const activities = [];
    
    // Created
    if (task.created_at) {
      activities.push({
        action: 'created',
        timestamp: task.created_at,
        icon: '✨',
        text: 'Task created'
      });
    }
    
    // Updated
    if (task.updated_at && task.updated_at !== task.created_at) {
      activities.push({
        action: 'updated',
        timestamp: task.updated_at,
        icon: '✏️',
        text: 'Task updated'
      });
    }
    
    // Status changes
    if (task.status === 'done' && task.completed_at) {
      activities.push({
        action: 'completed',
        timestamp: task.completed_at,
        icon: '✅',
        text: 'Task completed'
      });
    }
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (activities.length === 0) {
      return '<p class=\"uba-empty-state\">No activity recorded</p>';
    }
    
    return activities.map(activity => `
      <div class=\"uba-activity-item\">
        <span class=\"uba-activity-icon\">${activity.icon}</span>
        <span class=\"uba-activity-text\">${activity.text}</span>
        <span class=\"uba-activity-time\">${formatTimeAgo(activity.timestamp)}</span>
      </div>
    `).join('');
  }
  
  /**
   * Setup priority color coding
   */
  function setupPriorityColorCoding() {
    // Enhanced priority system with better visual indicators
    enhanceExistingTaskCards();
    
    // Add priority filter
    addPriorityFilter();
  }
  
  /**
   * Enhance existing task cards with priority coding
   */
  function enhanceExistingTaskCards() {
    const taskCards = document.querySelectorAll('.uba-task-card, .uba-task-item');
    
    taskCards.forEach(card => {
      const taskId = card.dataset.taskId || card.dataset.id;
      if (!taskId) return;
      
      const task = getTaskById(taskId);
      if (!task) return;
      
      // Add priority visual indicators
      addPriorityIndicators(card, task);
      
      // Add due date indicators
      addDueDateIndicators(card, task);
      
      // Add click handler for details popup
      addTaskDetailsHandler(card, task);
    });
  }
  
  /**
   * Add priority indicators to task card
   */
  function addPriorityIndicators(card, task) {
    const priority = task.priority || 'medium';
    
    // Add priority class to card
    card.classList.add(`uba-priority-${priority}`);
    
    // Add priority badge if not exists
    if (!card.querySelector('.uba-priority-badge')) {
      const badge = document.createElement('div');
      badge.className = `uba-priority-badge uba-priority-${priority}`;
      badge.innerHTML = `
        <span class=\"uba-priority-dot\"></span>
        <span class=\"uba-priority-label\">${formatPriority(priority)}</span>
      `;
      
      // Add to card header or top
      const header = card.querySelector('.uba-card-header, .uba-task-header');
      if (header) {
        header.appendChild(badge);
      } else {
        card.insertBefore(badge, card.firstChild);
      }
    }
  }
  
  /**
   * Add due date indicators to task card
   */
  function addDueDateIndicators(card, task) {
    if (!task.due) return;
    
    const now = new Date();
    const dueDate = new Date(task.due);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Add due date class
    if (timeDiff < 0) {
      card.classList.add('uba-task-overdue');
    } else if (daysDiff <= 1) {
      card.classList.add('uba-task-due-soon');
    } else if (daysDiff <= 7) {
      card.classList.add('uba-task-due-week');
    }
    
    // Add due date display if not exists
    if (!card.querySelector('.uba-due-date-display')) {
      const dueDateDisplay = document.createElement('div');
      dueDateDisplay.className = 'uba-due-date-display';
      dueDateDisplay.innerHTML = `
        <span class=\"uba-due-icon\">📅</span>
        <span class=\"uba-due-text\">${formatDueDate(task.due)}</span>
      `;
      
      // Add to card footer or bottom
      const footer = card.querySelector('.uba-card-footer, .uba-task-footer');
      if (footer) {
        footer.appendChild(dueDateDisplay);
      } else {
        card.appendChild(dueDateDisplay);
      }
    }
  }
  
  /**
   * Add task details handler
   */
  function addTaskDetailsHandler(card, task) {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on action buttons
      if (e.target.closest('.uba-card-actions, .uba-task-actions')) return;
      
      showTaskDetails(task.id);
    });
  }
  
  /**
   * Add priority filter
   */
  function addPriorityFilter() {
    const controlsContainer = document.querySelector('.uba-controls-right, .uba-task-controls');
    if (!controlsContainer || controlsContainer.querySelector('#task-priority-filter')) return;
    
    const filter = document.createElement('select');
    filter.id = 'task-priority-filter';
    filter.className = 'uba-select uba-select-compact';
    filter.innerHTML = `
      <option value=\"all\">All Priorities</option>
      <option value=\"high\">🔴 High Priority</option>
      <option value=\"medium\">🟡 Medium Priority</option>
      <option value=\"low\">🟢 Low Priority</option>
    `;
    
    filter.addEventListener('change', filterTasksByPriority);
    
    // Insert before the last element (usually add button)
    const lastChild = controlsContainer.lastElementChild;
    if (lastChild) {
      controlsContainer.insertBefore(filter, lastChild);
    } else {
      controlsContainer.appendChild(filter);
    }
  }
  
  /**
   * Filter tasks by priority
   */
  function filterTasksByPriority(e) {
    enhancedTasksState.priorityFilter = e.target.value;
    applyTaskFilters();
  }
  
  /**
   * Setup smart search system
   */
  function setupSmartSearch() {
    createSmartSearchInterface();
  }
  
  /**
   * Create smart search interface
   */
  function createSmartSearchInterface() {
    const controlsContainer = document.querySelector('.uba-controls-left, .uba-task-controls');
    if (!controlsContainer || controlsContainer.querySelector('#task-smart-search')) return;
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'uba-smart-search';
    searchContainer.innerHTML = `
      <div class=\"uba-search-input-container\">
        <input type=\"text\" id=\"task-smart-search\" class=\"uba-search-input\" placeholder=\"Search tasks...\">
        <button type=\"button\" class=\"uba-search-clear\" id=\"task-search-clear\" style=\"display: none;\">×</button>
      </div>
      <div class=\"uba-search-filters\">
        <select id=\"task-due-filter\" class=\"uba-select uba-select-compact\">
          <option value=\"all\">All Dates</option>
          <option value=\"overdue\">Overdue</option>
          <option value=\"today\">Due Today</option>
          <option value=\"week\">This Week</option>
          <option value=\"month\">This Month</option>
        </select>
      </div>
    `;
    
    controlsContainer.appendChild(searchContainer);
    
    // Setup search functionality
    const searchInput = searchContainer.querySelector('#task-smart-search');
    const clearButton = searchContainer.querySelector('#task-search-clear');
    const dueFilter = searchContainer.querySelector('#task-due-filter');
    
    searchInput.addEventListener('input', handleSmartSearch);
    searchInput.addEventListener('keydown', handleSearchKeydown);
    clearButton.addEventListener('click', clearSearch);
    dueFilter.addEventListener('change', filterTasksByDueDate);
  }
  
  /**
   * Handle smart search
   */
  function handleSmartSearch(e) {
    const query = e.target.value.trim();
    enhancedTasksState.searchQuery = query;
    
    // Show/hide clear button
    const clearButton = document.getElementById('task-search-clear');
    if (clearButton) {
      clearButton.style.display = query ? 'block' : 'none';
    }
    
    // Apply search with debouncing
    clearTimeout(enhancedTasksState.searchTimeout);
    enhancedTasksState.searchTimeout = setTimeout(() => {
      applyTaskFilters();
    }, 300);
  }
  
  /**
   * Handle search keydown
   */
  function handleSearchKeydown(e) {
    if (e.key === 'Escape') {
      clearSearch();
    }
  }
  
  /**
   * Clear search
   */
  function clearSearch() {
    const searchInput = document.getElementById('task-smart-search');
    const clearButton = document.getElementById('task-search-clear');
    
    if (searchInput) searchInput.value = '';
    if (clearButton) clearButton.style.display = 'none';
    
    enhancedTasksState.searchQuery = '';
    applyTaskFilters();
  }
  
  /**
   * Filter tasks by due date
   */
  function filterTasksByDueDate(e) {
    enhancedTasksState.dueDateFilter = e.target.value;
    applyTaskFilters();
  }
  
  /**
   * Apply all task filters
   */
  function applyTaskFilters() {
    const taskCards = document.querySelectorAll('.uba-task-card, .uba-task-item');
    
    taskCards.forEach(card => {
      const taskId = card.dataset.taskId || card.dataset.id;
      if (!taskId) return;
      
      const task = getTaskById(taskId);
      if (!task) return;
      
      const shouldShow = (
        matchesSearchQuery(task) &&
        matchesPriorityFilter(task) &&
        matchesDueDateFilter(task)
      );
      
      // Apply filter with animation
      if (shouldShow) {
        card.style.display = '';
        card.classList.remove('uba-filtered-out');
        highlightSearchMatches(card, task);
      } else {
        card.style.display = 'none';
        card.classList.add('uba-filtered-out');
      }
    });
    
    // Update filter counts
    updateFilterCounts();
  }
  
  /**
   * Check if task matches search query
   */
  function matchesSearchQuery(task) {
    if (!enhancedTasksState.searchQuery) return true;
    
    const query = enhancedTasksState.searchQuery.toLowerCase();
    const searchableText = getTaskSearchableText(task).toLowerCase();
    
    return searchableText.includes(query);
  }
  
  /**
   * Get searchable text from task
   */
  function getTaskSearchableText(task) {
    const parts = [];
    
    ['title', 'description', 'notes'].forEach(field => {
      if (task[field]) {
        parts.push(task[field]);
      }
    });
    
    // Add project name if linked
    const project = getTaskProject(task);
    if (project) {
      parts.push(project.name, project.client || '');
    }
    
    return parts.join(' ');
  }
  
  /**
   * Check if task matches priority filter
   */
  function matchesPriorityFilter(task) {
    if (enhancedTasksState.priorityFilter === 'all') return true;
    
    const taskPriority = task.priority || 'medium';
    return taskPriority === enhancedTasksState.priorityFilter;
  }
  
  /**
   * Check if task matches due date filter
   */
  function matchesDueDateFilter(task) {
    if (enhancedTasksState.dueDateFilter === 'all') return true;
    
    if (!task.due) return enhancedTasksState.dueDateFilter === 'all';
    
    const now = new Date();
    const dueDate = new Date(task.due);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    switch (enhancedTasksState.dueDateFilter) {
      case 'overdue':
        return timeDiff < 0;
      case 'today':
        return daysDiff === 0;
      case 'week':
        return daysDiff >= 0 && daysDiff <= 7;
      case 'month':
        return daysDiff >= 0 && daysDiff <= 30;
      default:
        return true;
    }
  }
  
  /**
   * Highlight search matches in task card
   */
  function highlightSearchMatches(card, task) {
    if (!enhancedTasksState.searchQuery) {
      // Remove existing highlights
      card.querySelectorAll('.uba-search-highlight').forEach(el => {
        el.outerHTML = el.textContent;
      });
      return;
    }
    
    const query = enhancedTasksState.searchQuery;
    const titleElement = card.querySelector('.uba-card-title, .uba-task-title');
    
    if (titleElement) {
      highlightTextInElement(titleElement, query);
    }
  }
  
  /**
   * Highlight text in element
   */
  function highlightTextInElement(element, query) {
    if (!element || !query) return;
    
    const text = element.textContent;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    
    if (regex.test(text)) {
      element.innerHTML = text.replace(regex, '<span class=\"uba-search-highlight\">$1</span>');
    }
  }
  
  /**
   * Escape regex special characters
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
  }
  
  /**
   * Update filter counts
   */
  function updateFilterCounts() {
    const visibleCards = document.querySelectorAll('.uba-task-card:not([style*=\"display: none\"]), .uba-task-item:not([style*=\"display: none\"])');
    const totalCards = document.querySelectorAll('.uba-task-card, .uba-task-item');
    
    // Update task count display if exists
    const countDisplay = document.querySelector('.uba-task-count, #tasks-count');
    if (countDisplay) {
      const visibleCount = visibleCards.length;
      const totalCount = totalCards.length;
      
      if (visibleCount !== totalCount) {
        countDisplay.textContent = `${visibleCount} of ${totalCount} tasks`;
      } else {
        countDisplay.textContent = `${totalCount} tasks`;
      }
    }
  }
  
  /**
   * Render enhanced tasks
   */
  function renderEnhancedTasks() {
    const store = window.ubaStore;
    if (!store || !store.tasks) return;
    
    const tasks = store.tasks.getAll();
    enhancedTasksState.tasksData = tasks;
    
    // Enhance existing task cards
    setTimeout(() => {
      enhanceExistingTaskCards();
      applyTaskFilters();
    }, 100);
  }
  
  /**
   * Utility functions
   */
  function getTaskById(taskId) {
    const store = window.ubaStore;
    if (!store || !store.tasks) return null;
    
    return store.tasks.get(taskId) || store.tasks.getAll().find(t => t.id === taskId);
  }
  
  function getTaskProject(task) {
    if (!task.project_id) return null;
    
    const store = window.ubaStore;
    if (!store || !store.projects) return null;
    
    return store.projects.get(task.project_id);
  }
  
  function formatTaskStatus(status) {
    const statusNames = {
      todo: 'To Do',
      in_progress: 'In Progress',
      done: 'Done'
    };
    return statusNames[status] || status;
  }
  
  function formatPriority(priority) {
    const priorityNames = {
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    };
    return priorityNames[priority] || priority;
  }
  
  function formatStage(stage) {
    const stageNames = {
      lead: 'Lead',
      in_progress: 'In Progress',
      ongoing: 'Ongoing',
      completed: 'Completed'
    };
    return stageNames[stage] || stage;
  }
  
  function formatDate(date) {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function formatDueDate(date) {
    if (!date) return 'No due date';
    
    const now = new Date();
    const dueDate = new Date(date);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (timeDiff < 0) {
      return `Overdue (${formatDate(date)})`;
    } else if (daysDiff === 0) {
      return 'Due today';
    } else if (daysDiff === 1) {
      return 'Due tomorrow';
    } else {
      return formatDate(date);
    }
  }
  
  function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return formatDate(timestamp);
    }
  }
  
  // Global functions for modal interactions
  window.closeTaskDetailsModal = function() {
    const modal = document.getElementById('task-details-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  };
  
  window.editTaskFromDetails = function() {
    const modal = document.getElementById('task-details-modal');
    const taskId = modal?.dataset.taskId;
    
    if (taskId) {
      // Close details modal
      closeTaskDetailsModal();
      
      // Open edit modal or navigate to edit page
      if (window.editTask) {
        window.editTask(taskId);
      } else {
        console.log('Edit task functionality to be implemented');
      }
    }
  };
  
  window.completeTaskFromDetails = function() {
    const modal = document.getElementById('task-details-modal');
    const taskId = modal?.dataset.taskId;
    
    if (taskId && window.ubaStore && window.ubaStore.tasks) {
      const task = getTaskById(taskId);
      if (task && task.status !== 'done') {
        // Update task status
        window.ubaStore.tasks.update(taskId, {
          status: 'done',
          completed_at: new Date().toISOString()
        });
        
        // Show notification
        if (window.showToast) {
          window.showToast(`Task \"${task.title}\" marked as complete`, 'success');
        }
        
        // Close modal and refresh
        closeTaskDetailsModal();
        renderEnhancedTasks();
      }
    }
  };
  
  window.deleteTaskFromDetails = function(taskId) {
    if (!taskId) return;
    
    const task = getTaskById(taskId);
    if (!task) return;
    
    if (confirm(`Are you sure you want to delete task \"${task.title}\"? This action cannot be undone.`)) {
      if (window.ubaStore && window.ubaStore.tasks) {
        window.ubaStore.tasks.delete(taskId);
        
        // Show notification
        if (window.showToast) {
          window.showToast(`Task \"${task.title}\" deleted`, 'success');
        }
        
        // Close modal and refresh
        closeTaskDetailsModal();
        renderEnhancedTasks();
      }
    }
  };
  
  window.showTaskDetails = showTaskDetails;
  
  // Expose enhanced tasks API
  window.UBAEnhancedTasks = {
    init: initEnhancedTasks,
    showDetails: showTaskDetails,
    checkReminders: checkDueDateReminders,
    applyFilters: applyTaskFilters,
    clearSearch: clearSearch
  };
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedTasks);
  } else {
    // Delay initialization to ensure other modules are loaded
    setTimeout(initEnhancedTasks, 100);
  }
  
  console.log('✓ Enhanced Tasks module loaded');
  
})();