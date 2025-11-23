/**
 * Automations MVP - Simple, Stable Automation Management
 * 
 * Features:
 * - Simple CRUD operations for automation rules
 * - Filter by status (All/Active/Paused)
 * - Modal-based Add/Edit interface
 * - No complex execution logic - UI + data only
 * - Uses existing ubaStore for persistence
 */

(function() {
  'use strict';

  // ============================================================================
  // DATA MODEL & CONFIGURATION
  // ============================================================================

  const TRIGGER_OPTIONS = [
    { value: 'client_created', label: 'New client' },
    { value: 'invoice_overdue', label: 'Invoice overdue' },
    { value: 'invoice_paid', label: 'Invoice paid' },
    { value: 'task_completed', label: 'Task completed' },
    { value: 'task_overdue', label: 'Task overdue' },
    { value: 'project_stage_changed', label: 'Project stage changed' }
  ];

  const ACTION_OPTIONS = [
    { value: 'send_email', label: 'Send email' },
    { value: 'create_task', label: 'Create task' },
    { value: 'add_note', label: 'Add note' },
    { value: 'send_notification', label: 'Send notification' }
  ];

  // Current filter state
  let currentFilter = 'all'; // 'all', 'active', 'paused'
  let isEditMode = false;
  let editingId = null;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the automations page
   */
  function initAutomationsPage() {
    console.log('[Automations MVP] Initializing...');

    // Ensure data store is ready
    if (!window.ubaStore || !window.ubaStore.automations) {
      console.error('[Automations MVP] ubaStore.automations not available');
      showError('Data store not initialized. Please refresh the page.');
      return;
    }

    // Setup event listeners
    setupEventListeners();

    // Initial render
    renderAutomationsList();
    updateMetrics();

    console.log('[Automations MVP] Initialized successfully');
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Add automation button
    const addBtn = document.getElementById('add-automation-btn');
    if (addBtn) {
      addBtn.addEventListener('click', openAddModal);
    }

    // Filter dropdown
    const filterSelect = document.getElementById('automation-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', handleFilterChange);
    }

    // Modal close button and overlay
    const modal = document.getElementById('automation-modal');
    if (modal) {
      const closeBtn = modal.querySelector('.uba-modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }

      const overlay = modal.querySelector('.uba-modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', closeModal);
      }
    }

    // Cancel button in modal
    const cancelBtn = document.getElementById('cancel-automation-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }

    // Save button
    const saveBtn = document.getElementById('save-automation-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', handleSave);
    }

    // Form submission
    const form = document.getElementById('automation-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSave();
      });
    }

    // Event delegation for table action buttons
    const tbody = document.getElementById('automations-tbody');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('automation-edit-btn')) {
          handleEdit(id);
        } else if (target.classList.contains('automation-toggle-btn')) {
          handleToggle(id);
        } else if (target.classList.contains('automation-delete-btn')) {
          handleDelete(id);
        }
      });
    }

    console.log('[Automations MVP] Event listeners attached');
  }

  // ============================================================================
  // DATA OPERATIONS
  // ============================================================================

  /**
   * Load all automations from store
   */
  async function loadAutomations() {
    try {
      const automations = window.ubaStore.automations.getAll() || [];
      return automations;
    } catch (error) {
      console.error('[Automations MVP] Error loading automations:', error);
      return [];
    }
  }

  /**
   * Create a new automation
   */
  async function createAutomation(data) {
    try {
      const automation = {
        name: data.name,
        trigger: data.trigger,
        action: data.action,
        notes: data.notes || '',
        status: data.status || 'active',
        lastRunAt: null,
        createdAt: new Date().toISOString()
      };

      const created = window.ubaStore.automations.create(automation);
      console.log('[Automations MVP] Automation created:', created.id);
      return created;
    } catch (error) {
      console.error('[Automations MVP] Error creating automation:', error);
      throw error;
    }
  }

  /**
   * Update an existing automation
   */
  async function updateAutomation(id, data) {
    try {
      const updates = {
        name: data.name,
        trigger: data.trigger,
        action: data.action,
        notes: data.notes || '',
        status: data.status,
        updatedAt: new Date().toISOString()
      };

      const updated = window.ubaStore.automations.update(id, updates);
      console.log('[Automations MVP] Automation updated:', id);
      return updated;
    } catch (error) {
      console.error('[Automations MVP] Error updating automation:', error);
      throw error;
    }
  }

  /**
   * Delete an automation
   */
  async function deleteAutomation(id) {
    try {
      window.ubaStore.automations.delete(id);
      console.log('[Automations MVP] Automation deleted:', id);
      return true;
    } catch (error) {
      console.error('[Automations MVP] Error deleting automation:', error);
      throw error;
    }
  }

  /**
   * Toggle automation status
   */
  async function toggleAutomationStatus(id) {
    try {
      const automation = window.ubaStore.automations.get(id);
      if (!automation) {
        throw new Error('Automation not found');
      }

      const newStatus = automation.status === 'active' ? 'paused' : 'active';
      const updated = window.ubaStore.automations.update(id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      console.log('[Automations MVP] Status toggled:', id, newStatus);
      return updated;
    } catch (error) {
      console.error('[Automations MVP] Error toggling status:', error);
      throw error;
    }
  }

  // ============================================================================
  // UI RENDERING
  // ============================================================================

  /**
   * Render the automations list
   */
  async function renderAutomationsList() {
    const tbody = document.getElementById('automations-tbody');
    if (!tbody) {
      console.warn('[Automations MVP] Table body not found');
      return;
    }

    try {
      const allAutomations = await loadAutomations();
      
      // Apply filter
      let automations = allAutomations;
      if (currentFilter === 'active') {
        automations = allAutomations.filter(a => a.status === 'active');
      } else if (currentFilter === 'paused') {
        automations = allAutomations.filter(a => a.status === 'paused');
      }

      // Sort by creation date (newest first)
      automations.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      if (automations.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted, #666);">
              ${currentFilter === 'all' ? 'No automations yet. Click "Add Automation" to create one.' : `No ${currentFilter} automations.`}
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = automations.map(automation => {
        const trigger = TRIGGER_OPTIONS.find(t => t.value === automation.trigger);
        const action = ACTION_OPTIONS.find(a => a.value === automation.action);
        const statusBadgeClass = automation.status === 'active' ? 'uba-status-success' : 'uba-status-neutral';
        const lastRun = automation.lastRunAt ? formatDateTime(automation.lastRunAt) : 'Never';
        const escapedId = escapeHtml(automation.id);

        return `
          <tr data-automation-id="${escapedId}">
            <td>
              <strong>${escapeHtml(automation.name)}</strong>
              ${automation.notes ? `<br><small style="color: var(--text-muted, #666);">${escapeHtml(automation.notes)}</small>` : ''}
            </td>
            <td>${trigger ? escapeHtml(trigger.label) : escapeHtml(automation.trigger)}</td>
            <td>${action ? escapeHtml(action.label) : escapeHtml(automation.action)}</td>
            <td>
              <span class="uba-status ${statusBadgeClass}">
                ${automation.status === 'active' ? 'Active' : 'Paused'}
              </span>
            </td>
            <td>${lastRun}</td>
            <td>
              <div class="uba-table-actions">
                <button class="uba-btn-sm uba-btn-ghost automation-edit-btn" data-id="${escapedId}" title="Edit">
                  ✏️
                </button>
                <button class="uba-btn-sm uba-btn-ghost automation-toggle-btn" data-id="${escapedId}" title="Toggle">
                  ${automation.status === 'active' ? '⏸️' : '▶️'}
                </button>
                <button class="uba-btn-sm uba-btn-danger automation-delete-btn" data-id="${escapedId}" title="Delete">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    } catch (error) {
      console.error('[Automations MVP] Error rendering list:', error);
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--bad, #d32f2f);">
            Error loading automations. Please refresh the page.
          </td>
        </tr>
      `;
    }
  }

  /**
   * Update metrics display
   */
  async function updateMetrics() {
    try {
      const automations = await loadAutomations();
      const activeCount = automations.filter(a => a.status === 'active').length;
      const totalCount = automations.length;

      const activeMetric = document.getElementById('metric-active-automations');
      const totalMetric = document.getElementById('metric-total-automations');

      if (activeMetric) activeMetric.textContent = activeCount;
      if (totalMetric) totalMetric.textContent = totalCount;

    } catch (error) {
      console.error('[Automations MVP] Error updating metrics:', error);
    }
  }

  // ============================================================================
  // MODAL MANAGEMENT
  // ============================================================================

  /**
   * Open modal for adding new automation
   */
  function openAddModal() {
    isEditMode = false;
    editingId = null;

    const modal = document.getElementById('automation-modal');
    const modalTitle = document.getElementById('automation-modal-title');
    const form = document.getElementById('automation-form');

    if (!modal || !form) {
      console.error('[Automations MVP] Modal elements not found');
      return;
    }

    // Reset form
    form.reset();
    
    // Set active status by default
    const statusCheckbox = document.getElementById('automation-status');
    if (statusCheckbox) statusCheckbox.checked = true;

    // Update title
    if (modalTitle) modalTitle.textContent = 'Add Automation';

    // Clear any error messages
    clearFormError();

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Focus on name field
    setTimeout(() => {
      const nameInput = document.getElementById('automation-name');
      if (nameInput) nameInput.focus();
    }, 100);
  }

  /**
   * Open modal for editing automation
   */
  function openEditModal(id) {
    const automation = window.ubaStore.automations.get(id);
    if (!automation) {
      showError('Automation not found');
      return;
    }

    isEditMode = true;
    editingId = id;

    const modal = document.getElementById('automation-modal');
    const modalTitle = document.getElementById('automation-modal-title');
    const form = document.getElementById('automation-form');

    if (!modal || !form) {
      console.error('[Automations MVP] Modal elements not found');
      return;
    }

    // Populate form
    document.getElementById('automation-name').value = automation.name || '';
    document.getElementById('automation-trigger').value = automation.trigger || '';
    document.getElementById('automation-action').value = automation.action || '';
    document.getElementById('automation-notes').value = automation.notes || '';
    document.getElementById('automation-status').checked = automation.status === 'active';

    // Update title
    if (modalTitle) modalTitle.textContent = 'Edit Automation';

    // Clear any error messages
    clearFormError();

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the modal
   */
  function closeModal() {
    const modal = document.getElementById('automation-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    isEditMode = false;
    editingId = null;
    clearFormError();
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle filter change
   */
  function handleFilterChange(event) {
    currentFilter = event.target.value;
    console.log('[Automations MVP] Filter changed to:', currentFilter);
    renderAutomationsList();
  }

  /**
   * Handle save (create or update)
   */
  async function handleSave() {
    // Get form values
    const name = document.getElementById('automation-name').value.trim();
    const trigger = document.getElementById('automation-trigger').value;
    const action = document.getElementById('automation-action').value;
    const notes = document.getElementById('automation-notes').value.trim();
    const status = document.getElementById('automation-status').checked ? 'active' : 'paused';

    // Validation
    if (!name) {
      showFormError('Please enter an automation name');
      return;
    }

    if (!trigger) {
      showFormError('Please select a trigger');
      return;
    }

    if (!action) {
      showFormError('Please select an action');
      return;
    }

    try {
      const data = { name, trigger, action, notes, status };

      if (isEditMode && editingId) {
        await updateAutomation(editingId, data);
        showSuccess('Automation updated successfully');
      } else {
        await createAutomation(data);
        showSuccess('Automation created successfully');
      }

      closeModal();
      renderAutomationsList();
      updateMetrics();

    } catch (error) {
      console.error('[Automations MVP] Save error:', error);
      showFormError('Failed to save automation. Please try again.');
    }
  }

  /**
   * Handle edit button click
   */
  function handleEdit(id) {
    openEditModal(id);
  }

  /**
   * Handle toggle button click
   */
  async function handleToggle(id) {
    try {
      await toggleAutomationStatus(id);
      renderAutomationsList();
      updateMetrics();
      showSuccess('Automation status updated');
    } catch (error) {
      console.error('[Automations MVP] Toggle error:', error);
      showError('Failed to toggle automation status');
    }
  }

  /**
   * Handle delete button click
   */
  async function handleDelete(id) {
    const automation = window.ubaStore.automations.get(id);
    if (!automation) {
      showError('Automation not found');
      return;
    }

    const confirmMessage = `Are you sure you want to delete "${automation.name}"?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteAutomation(id);
      renderAutomationsList();
      updateMetrics();
      showSuccess('Automation deleted');
    } catch (error) {
      console.error('[Automations MVP] Delete error:', error);
      showError('Failed to delete automation');
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date/time for display
   */
  function formatDateTime(isoString) {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  }

  /**
   * Show success notification
   */
  function showSuccess(message) {
    if (window.UBANotifications && window.UBANotifications.success) {
      window.UBANotifications.success(message);
    } else {
      console.log('[Automations MVP] Success:', message);
    }
  }

  /**
   * Show error notification
   */
  function showError(message) {
    if (window.UBANotifications && window.UBANotifications.error) {
      window.UBANotifications.error(message);
    } else {
      console.error('[Automations MVP] Error:', message);
      alert(message);
    }
  }

  /**
   * Show form error message
   */
  function showFormError(message) {
    const errorEl = document.getElementById('form-error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    } else {
      alert(message);
    }
  }

  /**
   * Clear form error message
   */
  function clearFormError() {
    const errorEl = document.getElementById('form-error-message');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  // Expose public API
  window.AutomationsMVP = {
    init: initAutomationsPage,
    handleEdit,
    handleToggle,
    handleDelete
  };

  // Also expose as global function for page-loader.js compatibility
  window.initAutomationsPage = initAutomationsPage;

  console.log('[Automations MVP] Module loaded');

})();
