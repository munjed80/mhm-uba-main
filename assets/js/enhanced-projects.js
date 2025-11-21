// enhanced-projects.js — Advanced project management with drag & drop, details page, and progress tracking
(function() {
  'use strict';
  
  // Enhanced projects state
  let enhancedProjectsState = {
    draggedElement: null,
    draggedProject: null,
    draggedFromStage: null,
    dropZone: null,
    isDragging: false,
    touchStartPos: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    animationFrameId: null,
    projectsData: [],
    stageColumns: ['lead', 'in_progress', 'ongoing', 'completed']
  };
  
  /**
   * Initialize enhanced projects system
   */
  function initEnhancedProjects() {
    console.log('🚀 Initializing enhanced projects with advanced drag & drop');
    
    // Setup enhanced drag & drop
    setupEnhancedDragDrop();
    
    // Setup project details functionality
    setupProjectDetails();
    
    // Setup progress tracking
    setupProgressTracking();
    
    // Setup task and invoice linking
    setupProjectLinking();
    
    // Initial render
    renderEnhancedProjects();
    
    console.log('✓ Enhanced projects system initialized');
  }
  
  /**
   * Setup enhanced drag & drop with smooth animations
   */
  function setupEnhancedDragDrop() {
    // Handle mouse events
    document.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Handle touch events for mobile
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Prevent default drag behavior on project cards
    document.addEventListener('dragstart', (e) => {
      if (e.target.closest('.uba-project-card')) {
        e.preventDefault();
      }
    });
  }
  
  /**
   * Handle drag start
   */
  function handleDragStart(e) {
    const projectCard = e.target.closest('.uba-project-card');
    if (!projectCard || e.button !== 0) return; // Only left mouse button
    
    const projectId = projectCard.dataset.projectId;
    const project = getProjectById(projectId);
    if (!project) return;
    
    e.preventDefault();
    
    // Initialize drag state
    enhancedProjectsState.isDragging = true;
    enhancedProjectsState.draggedElement = projectCard;
    enhancedProjectsState.draggedProject = project;
    enhancedProjectsState.draggedFromStage = project.stage;
    
    // Calculate drag offset
    const rect = projectCard.getBoundingClientRect();
    enhancedProjectsState.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Start drag visual feedback
    startDragVisuals(projectCard, e.clientX, e.clientY);
    
    // Add body class to change cursor
    document.body.classList.add('uba-dragging');
  }
  
  /**
   * Handle drag move
   */
  function handleDragMove(e) {
    if (!enhancedProjectsState.isDragging) return;
    
    e.preventDefault();
    
    // Update drag position
    updateDragPosition(e.clientX, e.clientY);
    
    // Update drop zones
    updateDropZones(e.clientX, e.clientY);
  }
  
  /**
   * Handle drag end
   */
  function handleDragEnd(e) {
    if (!enhancedProjectsState.isDragging) return;
    
    e.preventDefault();
    
    // Determine drop target
    const dropResult = getDropTarget(e.clientX, e.clientY);
    
    if (dropResult.isValid) {
      // Valid drop - update project stage
      updateProjectStage(enhancedProjectsState.draggedProject.id, dropResult.stage);
      
      // Animate to final position
      animateToFinalPosition(dropResult.targetElement);
    } else {
      // Invalid drop - animate back to original position
      animateToOriginalPosition();
    }
    
    // Clean up drag state
    setTimeout(cleanupDragState, 300);
  }
  
  /**
   * Handle touch start
   */
  function handleTouchStart(e) {
    const projectCard = e.target.closest('.uba-project-card');
    if (!projectCard) return;
    
    const touch = e.touches[0];
    enhancedProjectsState.touchStartPos = { x: touch.clientX, y: touch.clientY };
    
    // Start touch drag after a short delay to distinguish from tap
    setTimeout(() => {
      if (e.touches.length === 1) { // Still touching
        handleDragStart({
          target: e.target,
          button: 0,
          clientX: touch.clientX,
          clientY: touch.clientY,
          preventDefault: () => e.preventDefault()
        });
      }
    }, 150);
  }
  
  /**
   * Handle touch move
   */
  function handleTouchMove(e) {
    if (!enhancedProjectsState.isDragging) return;
    
    const touch = e.touches[0];
    handleDragMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => e.preventDefault()
    });
  }
  
  /**
   * Handle touch end
   */
  function handleTouchEnd(e) {
    if (!enhancedProjectsState.isDragging) return;
    
    const touch = e.changedTouches[0];
    handleDragEnd({
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => e.preventDefault()
    });
  }
  
  /**
   * Start drag visual feedback
   */
  function startDragVisuals(element, x, y) {
    // Create drag preview
    const preview = element.cloneNode(true);
    preview.classList.add('uba-drag-preview');
    preview.style.position = 'fixed';
    preview.style.pointerEvents = 'none';
    preview.style.zIndex = '10000';
    preview.style.transform = 'rotate(5deg) scale(1.05)';
    preview.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
    preview.style.opacity = '0.9';
    
    document.body.appendChild(preview);
    
    // Position preview
    updateDragPosition(x, y, preview);
    
    // Fade out original element
    element.style.opacity = '0.3';
    element.style.transform = 'scale(0.95)';
    
    // Highlight drop zones
    highlightDropZones();
  }
  
  /**
   * Update drag position
   */
  function updateDragPosition(x, y, preview = null) {
    const dragPreview = preview || document.querySelector('.uba-drag-preview');
    if (!dragPreview) return;
    
    const { dragOffset } = enhancedProjectsState;
    dragPreview.style.left = (x - dragOffset.x) + 'px';
    dragPreview.style.top = (y - dragOffset.y) + 'px';
  }
  
  /**
   * Highlight drop zones
   */
  function highlightDropZones() {
    const stages = document.querySelectorAll('.uba-pipeline-stage');
    stages.forEach(stage => {
      stage.classList.add('uba-drop-zone-active');
    });
  }
  
  /**
   * Update drop zones during drag
   */
  function updateDropZones(x, y) {
    const dropTarget = document.elementFromPoint(x, y);
    const stage = dropTarget?.closest('.uba-pipeline-stage');
    
    // Clear previous drop zone highlights
    document.querySelectorAll('.uba-drop-zone-highlight').forEach(el => {
      el.classList.remove('uba-drop-zone-highlight');
    });
    
    // Highlight current drop zone
    if (stage) {
      stage.classList.add('uba-drop-zone-highlight');
      enhancedProjectsState.dropZone = stage;
    } else {
      enhancedProjectsState.dropZone = null;
    }
  }
  
  /**
   * Get drop target information
   */
  function getDropTarget(x, y) {
    const element = document.elementFromPoint(x, y);
    const stageElement = element?.closest('.uba-pipeline-stage');
    
    if (!stageElement) {
      return { isValid: false, stage: null, targetElement: null };
    }
    
    const stage = stageElement.dataset.stage;
    const isValidDrop = enhancedProjectsState.stageColumns.includes(stage) &&
                       stage !== enhancedProjectsState.draggedFromStage;
    
    return {
      isValid: isValidDrop,
      stage: stage,
      targetElement: stageElement
    };
  }
  
  /**
   * Animate to final position
   */
  function animateToFinalPosition(targetElement) {
    const dragPreview = document.querySelector('.uba-drag-preview');
    if (!dragPreview || !targetElement) return;
    
    const targetRect = targetElement.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    dragPreview.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    dragPreview.style.transform = 'scale(0.8) rotate(0deg)';
    dragPreview.style.left = targetX + 'px';
    dragPreview.style.top = targetY + 'px';
    dragPreview.style.opacity = '0';
  }
  
  /**
   * Animate back to original position
   */
  function animateToOriginalPosition() {
    const dragPreview = document.querySelector('.uba-drag-preview');
    const originalElement = enhancedProjectsState.draggedElement;
    
    if (!dragPreview || !originalElement) return;
    
    const originalRect = originalElement.getBoundingClientRect();
    
    dragPreview.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    dragPreview.style.transform = 'scale(1) rotate(0deg)';
    dragPreview.style.left = originalRect.left + 'px';
    dragPreview.style.top = originalRect.top + 'px';
    dragPreview.style.opacity = '0';
  }
  
  /**
   * Clean up drag state
   */
  function cleanupDragState() {
    // Remove drag preview
    const dragPreview = document.querySelector('.uba-drag-preview');
    if (dragPreview) {
      dragPreview.remove();
    }
    
    // Reset original element
    if (enhancedProjectsState.draggedElement) {
      enhancedProjectsState.draggedElement.style.opacity = '';
      enhancedProjectsState.draggedElement.style.transform = '';
    }
    
    // Clear drop zone highlights
    document.querySelectorAll('.uba-drop-zone-active, .uba-drop-zone-highlight').forEach(el => {
      el.classList.remove('uba-drop-zone-active', 'uba-drop-zone-highlight');
    });
    
    // Remove body class
    document.body.classList.remove('uba-dragging');
    
    // Reset state
    enhancedProjectsState.isDragging = false;
    enhancedProjectsState.draggedElement = null;
    enhancedProjectsState.draggedProject = null;
    enhancedProjectsState.draggedFromStage = null;
    enhancedProjectsState.dropZone = null;
  }
  
  /**
   * Update project stage
   */
  function updateProjectStage(projectId, newStage) {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    
    const project = store.projects.getAll().find(p => p.id === projectId);
    if (!project) return;
    
    // Update project stage
    const updatedProject = { ...project, stage: newStage, updated_at: new Date().toISOString() };
    store.projects.update(projectId, updatedProject);
    
    // Show success notification
    showProjectMoveNotification(project.name, newStage);
    
    // Re-render projects
    setTimeout(() => {
      renderEnhancedProjects();
    }, 300);
  }
  
  /**
   * Show project move notification
   */
  function showProjectMoveNotification(projectName, newStage) {
    const stageLabels = {
      lead: 'Lead',
      in_progress: 'In Progress',
      ongoing: 'Ongoing',
      completed: 'Completed'
    };
    
    const message = `Project \"${projectName}\" moved to ${stageLabels[newStage]}`;
    
    if (window.UBANotifications) {
      window.UBANotifications.show(message, 'success');
    }
  }
  
  /**
   * Get project by ID
   */
  function getProjectById(projectId) {
    const store = window.ubaStore;
    if (!store || !store.projects) return null;
    
    return store.projects.getAll().find(p => p.id === projectId);
  }
  
  /**
   * Setup project details functionality
   */
  function setupProjectDetails() {
    // Create project details modal if it doesn't exist
    createProjectDetailsModal();
  }
  
  /**
   * Create project details modal
   */
  function createProjectDetailsModal() {
    if (document.getElementById('project-details-modal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'project-details-modal';
    modal.className = 'uba-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class=\"uba-modal-overlay\" onclick=\"closeProjectDetailsModal()\"></div>
      <div class=\"uba-modal-content uba-modal-large\">
        <div class=\"uba-modal-header\">
          <h3 id=\"project-details-title\">Project Details</h3>
          <button type=\"button\" class=\"uba-modal-close\" onclick=\"closeProjectDetailsModal()\">×</button>
        </div>
        <div class=\"uba-modal-body\">
          <div class=\"uba-project-details\">
            <!-- Project details will be rendered here -->
          </div>
        </div>
        <div class=\"uba-modal-footer\">
          <button type=\"button\" class=\"uba-btn-ghost\" onclick=\"closeProjectDetailsModal()\">Close</button>
          <button type=\"button\" class=\"uba-btn-primary\" onclick=\"editProjectFromDetails()\">Edit Project</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  /**
   * Setup progress tracking
   */
  function setupProgressTracking() {
    // Progress tracking will be based on linked tasks completion
  }
  
  /**
   * Setup project linking with tasks and invoices
   */
  function setupProjectLinking() {
    // This will integrate with the client relationships system
  }
  
  /**
   * Render enhanced projects
   */
  function renderEnhancedProjects() {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    
    const projects = store.projects.getAll();
    enhancedProjectsState.projectsData = projects;
    
    // Update project cards with enhanced features
    enhanceExistingProjectCards();
  }
  
  /**
   * Enhance existing project cards
   */
  function enhanceExistingProjectCards() {
    const projectCards = document.querySelectorAll('.uba-project-card');
    
    projectCards.forEach(card => {
      // Add project ID as data attribute
      const projectName = card.querySelector('.uba-card-title')?.textContent;
      const project = enhancedProjectsState.projectsData.find(p => p.name === projectName);
      
      if (project) {
        card.dataset.projectId = project.id;
        
        // Add progress bar if not exists
        addProgressBarToCard(card, project);
        
        // Add click handler for project details
        addProjectDetailsHandler(card, project);
        
        // Enhance card styling
        enhanceCardStyling(card);
      }
    });
  }
  
  /**
   * Add progress bar to project card
   */
  function addProgressBarToCard(card, project) {
    if (card.querySelector('.uba-project-progress')) return;
    
    const progress = calculateProjectProgress(project);
    
    const progressBar = document.createElement('div');
    progressBar.className = 'uba-project-progress';
    progressBar.innerHTML = `
      <div class=\"uba-progress-label\">
        <span>Progress</span>
        <span>${progress.percentage}%</span>
      </div>
      <div class=\"uba-progress-bar\">
        <div class=\"uba-progress-fill\" style=\"width: ${progress.percentage}%\"></div>
      </div>
      <div class=\"uba-progress-details\">
        <small>${progress.completed}/${progress.total} tasks completed</small>
      </div>
    `;
    
    // Insert before card actions or at the end
    const cardActions = card.querySelector('.uba-card-actions');
    if (cardActions) {
      card.insertBefore(progressBar, cardActions);
    } else {
      card.appendChild(progressBar);
    }
  }
  
  /**
   * Calculate real project progress based on linked tasks
   */
  function calculateProjectProgress(project) {
    // Get linked tasks
    const linkedTasks = getProjectTasks(project.id);
    
    if (linkedTasks.length === 0) {
      return { percentage: 0, completed: 0, total: 0 };
    }
    
    const completedTasks = linkedTasks.filter(task => task.status === 'done').length;
    const percentage = Math.round((completedTasks / linkedTasks.length) * 100);
    
    return {
      percentage,
      completed: completedTasks,
      total: linkedTasks.length
    };
  }
  
  /**
   * Get tasks linked to a project
   */
  function getProjectTasks(projectId) {
    const store = window.ubaStore;
    if (!store || !store.tasks) return [];
    
    const tasks = store.tasks.getAll();
    const project = getProjectById(projectId);
    if (!project) return [];
    
    // Find tasks linked to this project
    return tasks.filter(task => {
      return (
        task.project_id === projectId ||
        task.project === project.name ||
        (task.title && task.title.toLowerCase().includes(project.name.toLowerCase()))
      );
    });
  }
  
  /**
   * Add project details handler
   */
  function addProjectDetailsHandler(card, project) {
    // Remove existing handlers
    const existingHandler = card.onclick;
    
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on action buttons
      if (e.target.closest('.uba-card-actions')) return;
      if (enhancedProjectsState.isDragging) return;
      
      showProjectDetails(project.id);
    });
    
    // Add details button if not exists
    if (!card.querySelector('.uba-project-details-btn')) {
      let actionsContainer = card.querySelector('.uba-card-actions');
      if (!actionsContainer) {
        actionsContainer = document.createElement('div');
        actionsContainer.className = 'uba-card-actions';
        card.appendChild(actionsContainer);
      }
      
      const detailsBtn = document.createElement('button');
      detailsBtn.className = 'uba-btn-sm uba-btn-ghost uba-project-details-btn';
      detailsBtn.innerHTML = '👁️ Details';
      detailsBtn.onclick = (e) => {
        e.stopPropagation();
        showProjectDetails(project.id);
      };
      
      actionsContainer.appendChild(detailsBtn);
    }
  }
  
  /**
   * Enhance card styling for better drag feedback
   */
  function enhanceCardStyling(card) {
    card.style.transition = 'all 0.2s ease';
    card.style.cursor = 'grab';
    
    card.addEventListener('mouseenter', () => {
      if (!enhancedProjectsState.isDragging) {
        card.style.transform = 'translateY(-2px)';
      }
    });
    
    card.addEventListener('mouseleave', () => {
      if (!enhancedProjectsState.isDragging) {
        card.style.transform = '';
      }
    });
  }
  
  /**
   * Show project details in modal
   */
  function showProjectDetails(projectId) {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const modal = document.getElementById('project-details-modal');
    const title = document.getElementById('project-details-title');
    const detailsContainer = modal.querySelector('.uba-project-details');
    
    if (!modal || !detailsContainer) return;
    
    // Set title
    if (title) {
      title.textContent = project.name || 'Project Details';
    }
    
    // Get linked data
    const linkedTasks = getProjectTasks(projectId);
    const linkedInvoices = getProjectInvoices(projectId);
    const progress = calculateProjectProgress(project);
    
    // Render project details
    detailsContainer.innerHTML = `
      <div class=\"uba-project-overview\">
        <div class=\"uba-overview-section\">
          <h4>Project Information</h4>
          <div class=\"uba-project-info-grid\">
            <div><strong>Stage:</strong> <span class=\"uba-stage-badge uba-stage-${project.stage}\">${formatStage(project.stage)}</span></div>
            <div><strong>Created:</strong> ${formatDate(project.created_at)}</div>
            <div><strong>Budget:</strong> ${formatCurrency(project.budget || 0)}</div>
            <div><strong>Progress:</strong> ${progress.percentage}% (${progress.completed}/${progress.total} tasks)</div>
          </div>
          ${project.description ? `<p class=\"uba-project-description\">${project.description}</p>` : ''}
        </div>
        
        <div class=\"uba-overview-section\">
          <h4>Progress Overview</h4>
          <div class=\"uba-project-progress-detailed\">
            <div class=\"uba-progress-bar-large\">
              <div class=\"uba-progress-fill\" style=\"width: ${progress.percentage}%\"></div>
            </div>
            <div class=\"uba-progress-stats\">
              <div class=\"uba-stat\">
                <span class=\"uba-stat-label\">Completed Tasks:</span>
                <span class=\"uba-stat-value\">${progress.completed}</span>
              </div>
              <div class=\"uba-stat\">
                <span class=\"uba-stat-label\">Remaining Tasks:</span>
                <span class=\"uba-stat-value\">${progress.total - progress.completed}</span>
              </div>
              <div class=\"uba-stat\">
                <span class=\"uba-stat-label\">Total Tasks:</span>
                <span class=\"uba-stat-value\">${progress.total}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class=\"uba-overview-section\">
          <h4>Linked Tasks (${linkedTasks.length})</h4>
          <div class=\"uba-linked-items\">
            ${linkedTasks.length === 0 ? '<p class=\"uba-empty-state\">No linked tasks found</p>' : 
              linkedTasks.map(task => `
                <div class=\"uba-linked-item uba-task-item\">
                  <div class=\"uba-item-info\">
                    <div class=\"uba-item-title\">${task.title || 'Untitled Task'}</div>
                    <div class=\"uba-item-meta\">
                      <span class=\"uba-status uba-status-${task.status}\">${formatTaskStatus(task.status)}</span>
                      ${task.due ? `<span class=\"uba-due-date\">Due: ${formatDate(task.due)}</span>` : ''}
                    </div>
                  </div>
                  <div class=\"uba-item-actions\">
                    <button class=\"uba-btn-sm uba-btn-ghost\" onclick=\"viewTask('${task.id}')\">View</button>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
        
        <div class=\"uba-overview-section\">
          <h4>Linked Invoices (${linkedInvoices.length})</h4>
          <div class=\"uba-linked-items\">
            ${linkedInvoices.length === 0 ? '<p class=\"uba-empty-state\">No linked invoices found</p>' : 
              linkedInvoices.map(invoice => `
                <div class=\"uba-linked-item uba-invoice-item\">
                  <div class=\"uba-item-info\">
                    <div class=\"uba-item-title\">${invoice.label || 'Invoice'} - ${formatCurrency(invoice.amount)}</div>
                    <div class=\"uba-item-meta\">
                      <span class=\"uba-status uba-status-${invoice.status}\">${formatInvoiceStatus(invoice.status)}</span>
                      ${invoice.due ? `<span class=\"uba-due-date\">Due: ${formatDate(invoice.due)}</span>` : ''}
                    </div>
                  </div>
                  <div class=\"uba-item-actions\">
                    <button class=\"uba-btn-sm uba-btn-ghost\" onclick=\"viewInvoice('${invoice.id}')\">View</button>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    `;
    
    // Show modal
    modal.style.display = 'block';
  }
  
  /**
   * Get invoices linked to a project
   */
  function getProjectInvoices(projectId) {
    const store = window.ubaStore;
    if (!store || !store.invoices) return [];
    
    const invoices = store.invoices.getAll();
    const project = getProjectById(projectId);
    if (!project) return [];
    
    // Find invoices linked to this project
    return invoices.filter(invoice => {
      return (
        invoice.project_id === projectId ||
        (invoice.label && invoice.label.toLowerCase().includes(project.name.toLowerCase()))
      );
    });
  }
  
  /**
   * Format currency
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }
  
  /**
   * Format date
   */
  function formatDate(date) {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  /**
   * Format stage name
   */
  function formatStage(stage) {
    const stageNames = {
      lead: 'Lead',
      in_progress: 'In Progress',
      ongoing: 'Ongoing',
      completed: 'Completed'
    };
    return stageNames[stage] || stage;
  }
  
  /**
   * Format task status
   */
  function formatTaskStatus(status) {
    const statusNames = {
      todo: 'To Do',
      in_progress: 'In Progress',
      done: 'Done'
    };
    return statusNames[status] || status;
  }
  
  /**
   * Format invoice status
   */
  function formatInvoiceStatus(status) {
    const statusNames = {
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue'
    };
    return statusNames[status] || status;
  }
  
  // Global functions for modal interactions
  window.closeProjectDetailsModal = function() {
    const modal = document.getElementById('project-details-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  };
  
  window.editProjectFromDetails = function() {
    // Implementation for editing project from details modal
    console.log('Edit project functionality to be implemented');
  };
  
  window.showProjectDetails = showProjectDetails;
  
  // Expose enhanced projects API
  window.UBAEnhancedProjects = {
    init: initEnhancedProjects,
    showDetails: showProjectDetails,
    calculateProgress: calculateProjectProgress,
    getProjectTasks: getProjectTasks,
    getProjectInvoices: getProjectInvoices
  };
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedProjects);
  } else {
    // Delay initialization to ensure other modules are loaded
    setTimeout(initEnhancedProjects, 100);
  }
  
  console.log('✓ Enhanced Projects module loaded');
  
})();