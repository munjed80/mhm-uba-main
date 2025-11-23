/**
 * Automations Engine V2 - Advanced business automation system
 * 
 * Features:
 * - Standardized automation rule model
 * - Robust execution engine with runAutomations()
 * - Comprehensive logging system
 * - Dark dashboard UI with enhanced modal forms
 * - Integration hooks for invoices, tasks, and clients
 */

let isEditMode = false;
let editAutomationId = null;

// V2 Automation Configuration
const TRIGGER_TYPES = {
    invoice_created: { label: 'Invoice Created', description: 'When a new invoice is created' },
    invoice_status_changed: { label: 'Invoice Status Changed', description: 'When an invoice status is modified' },
    invoice_overdue: { label: 'Invoice Overdue', description: 'When an invoice becomes overdue' },
    client_created: { label: 'Client Created', description: 'When a new client is added' },
    task_created: { label: 'Task Created', description: 'When a new task is created' },
    task_completed: { label: 'Task Completed', description: 'When a task is marked as completed' }
};

const ACTION_TYPES = {
    create_task: { 
        label: 'Create Task', 
        description: 'Create a new task',
        config: ['taskTitle', 'daysOffset']
    },
    add_note_to_client: { 
        label: 'Add Note to Client', 
        description: 'Add a note to the client record',
        config: ['noteText']
    },
    show_notification: { 
        label: 'Show Notification', 
        description: 'Log a notification entry',
        config: ['message']
    },
    mark_invoice_as_overdue: { 
        label: 'Mark Invoice as Overdue', 
        description: 'Automatically mark invoice as overdue when date is past due',
        config: ['overdueDays']
    }
};

function initAutomationsPage() {
    console.log('🤖 Initializing Automations V2 page...');
    
    // Initialize Enhanced Automation System first
    if (window.UBAEnhancedAutomations && typeof window.UBAEnhancedAutomations.init === 'function') {
        try {
            window.UBAEnhancedAutomations.init();
        } catch (error) {
            console.error('❌ Enhanced Automation System initialization failed:', error);
        }
    }
    
    // Check if required elements exist
    const requiredElements = {
        'new-automation-btn': 'New Automation button',
        'save-automation-btn': 'Save button',
        'automation-form': 'Automation form',
        'automations-body': 'Automations table body',
        'automation-modal': 'Automation modal',
        'automation-logs-body': 'Automation logs table body'
    };
    
    let missingElements = [];
    for (const [id, name] of Object.entries(requiredElements)) {
        if (!document.getElementById(id)) {
            missingElements.push(`${name} (ID: ${id})`);
        }
    }
    
    if (missingElements.length > 0) {
        console.error('❌ Missing required elements:', missingElements);
        return;
    }
    
    // Check if ubaStore is available
    if (!window.ubaStore) {
        console.error('❌ window.ubaStore not available');
        return;
    }
    
    console.log('✓ All required elements found');
    console.log('✓ ubaStore available');
    
    // Ensure automation collections exist
    ensureAutomationCollections();
    
    // Initialize modal event handlers
    initModalEvents();
    
    // Setup action type change handler
    setupActionConfigHandlers();
    
    // Render the automations table
    renderAutomationsTable();
    
    // Render automation logs
    renderAutomationLogs();
    
    // Update automation metrics
    updateAutomationMetrics();
    
    console.log('✅ Automations V2 page initialization complete');
}

function initModalEvents() {
    console.log('🔗 Setting up automation modal event handlers...');
    
    // New automation button
    const newAutomationBtn = document.getElementById('new-automation-btn');
    if (newAutomationBtn) {
        newAutomationBtn.addEventListener('click', () => {
            console.log('🆕 New automation button clicked');
            openAutomationModal();
        });
        console.log('  ✓ New automation button event attached');
    }

    // Save button
    const saveBtn = document.getElementById('save-automation-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveAutomation);
        console.log('  ✓ Save button event attached');
    }

    // Form submission
    const form = document.getElementById('automation-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            console.log('📋 Automation form submitted');
            e.preventDefault();
            handleSaveAutomation();
        });
        console.log('  ✓ Form submission event attached');
    }

    // Clear logs button
    const clearLogsBtn = document.getElementById('clear-logs-btn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all automation logs?')) {
                clearAutomationLogs();
            }
        });
        console.log('  ✓ Clear logs button event attached');
    }
    
    console.log('✓ Modal events setup complete');
}

function setupActionConfigHandlers() {
    const actionSelect = document.getElementById('automation-action');
    if (actionSelect) {
        actionSelect.addEventListener('change', (e) => {
            showActionConfig(e.target.value);
        });
    }
}

function showActionConfig(actionType) {
    // Hide all config sections
    const configSections = document.querySelectorAll('.config-section');
    configSections.forEach(section => section.style.display = 'none');
    
    const configContainer = document.getElementById('action-config');
    const configLabel = document.getElementById('config-label');
    
    if (!actionType || actionType === '') {
        configContainer.style.display = 'none';
        return;
    }
    
    configContainer.style.display = 'block';
    
    // Show specific config section
    switch (actionType) {
        case 'create_task':
            document.getElementById('config-create-task').style.display = 'block';
            configLabel.textContent = 'Task Configuration';
            break;
        case 'add_note_to_client':
            document.getElementById('config-add-note').style.display = 'block';
            configLabel.textContent = 'Note Configuration';
            break;
        case 'show_notification':
            document.getElementById('config-notification').style.display = 'block';
            configLabel.textContent = 'Notification Configuration';
            break;
        case 'mark_invoice_as_overdue':
            document.getElementById('config-mark-overdue').style.display = 'block';
            configLabel.textContent = 'Overdue Configuration';
            break;
        default:
            configContainer.style.display = 'none';
    }
}

function openAutomationModal(automationData = null) {
    const modal = document.getElementById('automation-modal');
    const modalTitle = document.getElementById('automation-modal-title');
    const form = document.getElementById('automation-form');
    
    if (!modal || !form) return;
    
    // Reset form and error states
    form.reset();
    hideAutomationError();
    
    // Hide config initially
    document.getElementById('action-config').style.display = 'none';
    
    if (automationData) {
        // Edit mode
        isEditMode = true;
        editAutomationId = automationData.id;
        modalTitle.textContent = 'Edit Automation';
        
        // Populate form fields
        document.getElementById('automation-edit-id').value = automationData.id;
        document.getElementById('automation-name').value = automationData.name || '';
        
        // Set description if field exists
        const descField = document.getElementById('automation-description');
        if (descField) {
            descField.value = automationData.description || '';
        }
        
        document.getElementById('automation-trigger').value = automationData.triggerType || '';
        document.getElementById('automation-action').value = automationData.actionType || '';
        
        // Show and populate action config
        if (automationData.actionType) {
            showActionConfig(automationData.actionType);
            populateActionConfig(automationData.actionType, automationData.config || {});
        }
        
        // Update save button text
        const saveBtn = document.getElementById('save-automation-btn');
        if (saveBtn) {
            const span = saveBtn.querySelector('span');
            if (span) span.textContent = 'Update Automation';
        }
    } else {
        // Create mode
        isEditMode = false;
        editAutomationId = null;
        modalTitle.textContent = 'New Automation';
        
        // Update save button text
        const saveBtn = document.getElementById('save-automation-btn');
        if (saveBtn) {
            const span = saveBtn.querySelector('span');
            if (span) span.textContent = 'Save Automation';
        }
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus on first input
    setTimeout(() => {
        const nameInput = document.getElementById('automation-name');
        if (nameInput) nameInput.focus();
    }, 100);
}

function populateActionConfig(actionType, config) {
    switch (actionType) {
        case 'create_task':
            const taskTitleEl = document.getElementById('config-task-title');
            const daysOffsetEl = document.getElementById('config-days-offset');
            if (taskTitleEl) taskTitleEl.value = config.taskTitle || '';
            if (daysOffsetEl) daysOffsetEl.value = config.daysOffset || '';
            break;
        case 'add_note_to_client':
            const noteTextEl = document.getElementById('config-note-text');
            if (noteTextEl) noteTextEl.value = config.noteText || '';
            break;
        case 'show_notification':
            const messageEl = document.getElementById('config-notification-message');
            if (messageEl) messageEl.value = config.message || '';
            break;
        case 'mark_invoice_as_overdue':
            const overdueDaysEl = document.getElementById('config-overdue-days');
            if (overdueDaysEl) overdueDaysEl.value = config.overdueDays || '7';
            break;
    }
}

function closeAutomationModal() {
    const modal = document.getElementById('automation-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Reset states
    isEditMode = false;
    editAutomationId = null;
    hideAutomationError();
}

function handleSaveAutomation() {
    const name = document.getElementById('automation-name').value.trim();
    const triggerType = document.getElementById('automation-trigger').value;
    const actionType = document.getElementById('automation-action').value;
    
    // Get description if field exists
    const descField = document.getElementById('automation-description');
    const description = descField ? descField.value.trim() : '';
    
    // Validation
    if (!name) {
        showAutomationError('Automation name is required');
        return;
    }
    
    if (!triggerType) {
        showAutomationError('Please select a trigger type');
        return;
    }
    
    if (!actionType) {
        showAutomationError('Please select an action type');
        return;
    }
    
    // Get action configuration
    const config = getActionConfig(actionType);
    if (config === false) {
        // Error already shown in getActionConfig
        return;
    }
    
    // Prepare automation data using V2 standardized model
    const currentTime = new Date().toISOString();
    const automationData = {
        name,
        description,
        triggerType,
        actionType,
        active: true,
        config,
        createdAt: isEditMode ? null : currentTime,
        updatedAt: currentTime
    };
    
    try {
        // Check if ubaStore is available
        if (!window.ubaStore || !window.ubaStore.automations) {
            showAutomationError('Data store not available. Please refresh the page.');
            return;
        }
        
        if (isEditMode && editAutomationId) {
            // Update existing automation
            const success = window.ubaStore.automations.update(editAutomationId, automationData);
            if (success) {
                console.log('✅ Automation updated successfully');
                closeAutomationModal();
                renderAutomationsTable();
                updateAutomationMetrics();
            } else {
                showAutomationError('Failed to update automation');
            }
        } else {
            // Create new automation
            const newAutomation = window.ubaStore.automations.create(automationData);
            if (newAutomation) {
                console.log('✅ Automation created successfully:', newAutomation);
                closeAutomationModal();
                renderAutomationsTable();
                updateAutomationMetrics();
            } else {
                showAutomationError('Failed to create automation');
            }
        }
    } catch (error) {
        console.error('❌ Error saving automation:', error);
        showAutomationError('An error occurred while saving the automation');
    }
}

function getActionConfig(actionType) {
    const config = {};
    
    switch (actionType) {
        case 'create_task':
            const taskTitle = document.getElementById('config-task-title').value.trim();
            const daysOffset = document.getElementById('config-days-offset').value;
            
            if (!taskTitle) {
                showAutomationError('Task title is required for create task action');
                return false;
            }
            
            config.taskTitle = taskTitle;
            config.daysOffset = parseInt(daysOffset) || 0;
            break;
            
        case 'add_note_to_client':
            const noteText = document.getElementById('config-note-text').value.trim();
            
            if (!noteText) {
                showAutomationError('Note text is required for add note action');
                return false;
            }
            
            config.noteText = noteText;
            break;
            
        case 'show_notification':
            const message = document.getElementById('config-notification-message').value.trim();
            
            if (!message) {
                showAutomationError('Message is required for notification action');
                return false;
            }
            
            config.message = message;
            break;
            
        case 'mark_invoice_as_overdue':
            const overdueDays = document.getElementById('config-overdue-days').value;
            
            config.overdueDays = parseInt(overdueDays) || 7;
            break;
            
        default:
            showAutomationError('Unknown action type');
            return false;
    }
    
    return config;
}

function editAutomation(id) {
    if (!window.ubaStore || !window.ubaStore.automations) {
        console.error('❌ ubaStore not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    const automation = window.ubaStore.automations.getById(id);
    if (automation) {
        openAutomationModal(automation);
    } else {
        console.error('❌ Automation not found:', id);
        alert('Automation not found. The table will be refreshed.');
        renderAutomationsTable();
    }
}

function deleteAutomation(id) {
    if (!window.ubaStore || !window.ubaStore.automations) {
        console.error('❌ ubaStore not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    const automation = window.ubaStore.automations.getById(id);
    if (!automation) {
        console.error('❌ Automation not found:', id);
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete the automation "${automation.name}"?

This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        try {
            const success = window.ubaStore.automations.delete(id);
            if (success) {
                console.log('✅ Automation deleted successfully');
                renderAutomationsTable();
                updateAutomationMetrics();
            } else {
                alert('Failed to delete automation');
            }
        } catch (error) {
            console.error('❌ Error deleting automation:', error);
            alert('An error occurred while deleting the automation');
        }
    }
}

function toggleAutomation(id) {
    if (!window.ubaStore || !window.ubaStore.automations) {
        console.error('❌ ubaStore not available');
        return;
    }
    
    const automation = window.ubaStore.automations.getById(id);
    if (!automation) {
        console.error('❌ Automation not found:', id);
        return;
    }
    
    try {
        const success = window.ubaStore.automations.update(id, { active: !automation.active });
        if (success) {
            console.log(`✅ Automation ${automation.active ? 'paused' : 'activated'}`);
            renderAutomationsTable();
            updateAutomationMetrics();
        } else {
            alert('Failed to update automation status');
        }
    } catch (error) {
        console.error('❌ Error toggling automation:', error);
        alert('An error occurred while updating the automation');
    }
}

function renderAutomationsTable() {
    const tbody = document.getElementById('automations-body');
    if (!tbody) {
        console.warn('❌ automations-body element not found');
        return;
    }
    
    // Check if ubaStore is available
    if (!window.ubaStore || !window.ubaStore.automations) {
        console.warn('❌ ubaStore.automations not available');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span>Data store not available. Please check your setup.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    const automations = window.ubaStore.automations.getAll();
    
    if (!automations || automations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span data-i18n="automations.empty">No automations yet. Create your first rule.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    // Get automation logs for last run info
    const logs = window.ubaStore.automationLogs ? window.ubaStore.automationLogs.getAll() : [];
    
    // Sort automations by creation date (newest first)
    const sortedAutomations = automations.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);
        return dateB - dateA;
    });
    
    tbody.innerHTML = sortedAutomations.map(automation => {
        const triggerLabel = TRIGGER_TYPES[automation.triggerType]?.label || automation.triggerType;
        const actionLabel = ACTION_TYPES[automation.actionType]?.label || automation.actionType;
        const statusClass = automation.active ? 'uba-status-success' : 'uba-status-neutral';
        const statusText = automation.active ? 'Active' : 'Paused';
        const toggleText = automation.active ? 'Pause' : 'Activate';
        const toggleIcon = automation.active ? '⏸️' : '▶️';
        
        // Find last run for this automation
        const lastRun = logs
            .filter(log => log.ruleId === automation.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        
        const lastRunText = lastRun 
            ? formatRelativeTime(lastRun.timestamp)
            : '—';
        
        return `
            <tr>
                <td>
                    <strong>${escapeHtml(automation.name)}</strong>
                    ${automation.description ? `<br><small style="color: var(--text-muted);">${escapeHtml(automation.description)}</small>` : ''}
                </td>
                <td>
                    <span class="uba-automation-trigger">
                        ${escapeHtml(triggerLabel)}
                    </span>
                </td>
                <td>
                    <span class="uba-automation-action">
                        ${escapeHtml(actionLabel)}
                    </span>
                </td>
                <td>
                    <span class="uba-status ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <span style="color: var(--text-muted);">${lastRunText}</span>
                </td>
                <td>
                    <div class="uba-table-actions">
                        <button 
                            class="uba-btn-sm uba-btn-ghost" 
                            onclick="toggleAutomation('${automation.id}')"
                            title="${toggleText} Automation"
                        >
                            ${toggleIcon}
                        </button>
                        <button 
                            class="uba-btn-sm uba-btn-ghost" 
                            onclick="editAutomation('${automation.id}')"
                            title="Edit Automation"
                        >
                            ✏️
                        </button>
                        <button 
                            class="uba-btn-sm uba-btn-danger" 
                            onclick="deleteAutomation('${automation.id}')"
                            title="Delete Automation"
                        >
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderAutomationLogs() {
    const tbody = document.getElementById('automation-logs-body');
    if (!tbody) return;
    
    if (!window.ubaStore || !window.ubaStore.automationLogs) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span>No automation logs available.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    const logs = window.ubaStore.automationLogs.getAll();
    
    if (!logs || logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span data-i18n="automations.noLogs">No automation runs yet.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort logs by timestamp (newest first) and limit to 50
    const sortedLogs = logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50);
    
    tbody.innerHTML = sortedLogs.map(log => {
        const statusClass = log.success ? 'uba-status-success' : 'uba-status-danger';
        const statusText = log.success ? 'Success' : 'Failed';
        const timestamp = formatDateTime(log.timestamp);
        const payloadSummary = log.payloadSummary || '';
        
        return `
            <tr>
                <td>
                    <strong>${escapeHtml(log.ruleName || 'Unknown Rule')}</strong>
                </td>
                <td>
                    <span class="uba-automation-trigger">
                        ${escapeHtml(TRIGGER_TYPES[log.triggerType]?.label || log.triggerType || 'Unknown')}
                    </span>
                </td>
                <td>
                    <span class="uba-status ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    ${log.result ? `<span style="color: var(--text-muted); font-size: 14px;">${escapeHtml(log.result)}</span>` : '—'}
                    ${payloadSummary ? `<br><small style="color: var(--text-muted); font-size: 12px;">${escapeHtml(payloadSummary)}</small>` : ''}
                </td>
                <td>
                    <span style="color: var(--text-muted); font-size: 14px;">${timestamp}</span>
                </td>
            </tr>
        `;
    }).join('');
}

function updateAutomationMetrics() {
    if (!window.ubaStore || !window.ubaStore.automations) {
        console.warn('❌ ubaStore not available for metrics');
        return;
    }
    
    const automations = window.ubaStore.automations.getAll() || [];
    const activeCount = automations.filter(auto => auto.active).length;
    
    // Count total runs from logs
    let totalRuns = 0;
    if (window.ubaStore.automationLogs) {
        const logs = window.ubaStore.automationLogs.getAll() || [];
        totalRuns = logs.length;
    }
    
    const countEl = document.getElementById('automation-count');
    const runsEl = document.getElementById('automation-runs');
    
    if (countEl) countEl.textContent = activeCount;
    if (runsEl) runsEl.textContent = totalRuns;
}

function clearAutomationLogs() {
    if (!window.ubaStore || !window.ubaStore.automationLogs) {
        console.warn('❌ ubaStore.automationLogs not available');
        return;
    }
    
    try {
        // Clear all logs
        window.ubaStore.automationLogs.saveAll([]);
        console.log('✅ Automation logs cleared');
        renderAutomationLogs();
        updateAutomationMetrics();
    } catch (error) {
        console.error('❌ Error clearing logs:', error);
        alert('Failed to clear logs');
    }
}

function showAutomationError(message) {
    const errorEl = document.getElementById('automation-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function hideAutomationError() {
    const errorEl = document.getElementById('automation-error');
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
}

// ============================================================================
// AUTOMATION EXECUTION ENGINE V2
// ============================================================================

/**
 * Ensure automation collections exist in ubaStore
 */
function ensureAutomationCollections() {
    if (!window.ubaStore) return;
    
    // Ensure automations collection exists
    if (!window.ubaStore.automations && window.ubaStore.makeHelpers) {
        window.ubaStore.automations = window.ubaStore.makeHelpers('automations');
        console.log('✓ Created automations collection');
    }
    
    // Ensure automationLogs collection exists
    if (!window.ubaStore.automationLogs && window.ubaStore.makeHelpers) {
        window.ubaStore.automationLogs = window.ubaStore.makeHelpers('automationLogs');
        console.log('✓ Created automationLogs collection');
    }
}

/**
 * Main automation execution function
 * @param {string} triggerType - The type of trigger (e.g., 'invoice_created')
 * @param {object} payload - Data associated with the trigger
 */
function runAutomations(triggerType, payload = {}) {
    console.log(`🚀 Running automations for trigger: ${triggerType}`, payload);
    
    // Check if automations are available
    if (!window.ubaStore || !window.ubaStore.automations) {
        console.warn('❌ ubaStore.automations not available - skipping automation run');
        return;
    }
    
    try {
        // Get all active automations
        const automations = window.ubaStore.automations.getAll() || [];
        const activeAutomations = automations.filter(auto => auto.active && auto.triggerType === triggerType);
        
        console.log(`📋 Found ${activeAutomations.length} active automations for trigger ${triggerType}`);
        
        if (activeAutomations.length === 0) {
            return; // No automations to run
        }
        
        // Execute each matching automation
        activeAutomations.forEach(automation => {
            executeAutomation(automation, payload);
        });
        
        // Update UI if on automations page
        if (window.location.pathname.includes('automations.html')) {
            setTimeout(() => {
                renderAutomationLogs();
                updateAutomationMetrics();
            }, 100);
        }
        
    } catch (error) {
        console.error('❌ Error running automations:', error);
        logAutomationRun(null, triggerType, false, `Error: ${error.message}`);
    }
}

/**
 * Execute a single automation rule
 * @param {object} automation - The automation rule to execute
 * @param {object} payload - Data from the trigger
 */
function executeAutomation(automation, payload) {
    console.log(`🎬 Executing automation: ${automation.name}`);
    
    try {
        let result = '';
        let success = false;
        
        switch (automation.actionType) {
            case 'create_task':
                result = executeCreateTask(automation.config, payload);
                success = !!result && !result.startsWith('Failed') && !result.includes('Error');
                break;
                
            case 'add_note_to_client':
                result = executeAddNoteToClient(automation.config, payload);
                success = !!result && !result.startsWith('Failed') && !result.includes('Error');
                break;
                
            case 'show_notification':
                result = executeShowNotification(automation.config, payload);
                success = !!result;
                break;
                
            case 'mark_invoice_as_overdue':
                result = executeMarkInvoiceAsOverdue(automation.config, payload);
                success = !!result && !result.startsWith('Failed') && !result.includes('Error');
                break;
                
            default:
                result = `Unknown action type: ${automation.actionType}`;
                success = false;
        }
        
        // Generate payload summary for logging
        const payloadSummary = generatePayloadSummary(payload);
        
        // Log the automation run
        logAutomationRun(automation, automation.triggerType, success, result, payloadSummary);
        
        if (success) {
            console.log(`✅ Automation executed successfully: ${automation.name} - ${result}`);
        } else {
            console.warn(`⚠️ Automation failed: ${automation.name} - ${result}`);
        }
        
    } catch (error) {
        console.error(`❌ Error executing automation ${automation.name}:`, error);
        logAutomationRun(automation, automation.triggerType, false, `Error: ${error.message}`);
    }
}

/**
 * Create a task action
 */
function executeCreateTask(config, payload) {
    if (!window.ubaStore || !window.ubaStore.tasks) {
        return 'Failed: Tasks store not available';
    }
    
    try {
        // Process task title with payload data
        let taskTitle = config.taskTitle || 'New Task';
        taskTitle = processTemplate(taskTitle, payload);
        
        // Calculate due date with offset
        const daysOffset = parseInt(config.daysOffset) || 0;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysOffset);
        
        // Determine project ID from payload if available
        let projectId = null;
        if (payload.invoice && payload.invoice.projectId) {
            projectId = payload.invoice.projectId;
        } else if (payload.task && payload.task.projectId) {
            projectId = payload.task.projectId;
        }
        
        // Create the task
        const taskData = {
            title: taskTitle,
            description: `Automatically created by automation`,
            status: 'todo',
            due: daysOffset > 0 ? dueDate.toISOString().split('T')[0] : null,
            priority: 'medium',
            projectId,
            created_at: new Date().toISOString(),
            created: new Date().toISOString()
        };
        
        const newTask = window.ubaStore.tasks.create(taskData);
        return newTask ? `Created task: "${taskTitle}"` : 'Failed to create task';
        
    } catch (error) {
        return `Task creation failed: ${error.message}`;
    }
}

/**
 * Add note to client action
 */
function executeAddNoteToClient(config, payload) {
    if (!window.ubaStore || !window.ubaStore.clients) {
        return 'Failed: Clients store not available';
    }
    
    try {
        // Find client from payload
        let clientId = null;
        let clientName = 'Unknown Client';
        
        if (payload.invoice && payload.invoice.client) {
            // Find client by name (in a real app, you'd use client ID)
            const clients = window.ubaStore.clients.getAll() || [];
            const client = clients.find(c => c.name === payload.invoice.client);
            if (client) {
                clientId = client.id;
                clientName = client.name;
            }
        } else if (payload.client) {
            clientId = payload.client.id;
            clientName = payload.client.name;
        }
        
        if (!clientId) {
            return 'Failed: No client found to add note to';
        }
        
        // Process note text
        let noteText = config.noteText || 'Automation note';
        noteText = processTemplate(noteText, payload);
        
        // Add note to client
        const client = window.ubaStore.clients.getById(clientId);
        if (!client) {
            return 'Failed: Client not found';
        }
        
        const notes = client.notes || '';
        const timestamp = new Date().toLocaleString();
        const separator = notes ? '\n' : '';
        const newNotes = `${notes}${separator}[${timestamp}] ${noteText}`;
        
        const success = window.ubaStore.clients.update(clientId, { 
            notes: newNotes,
            updatedAt: new Date().toISOString()
        });
        
        return success ? `Added note to client: "${clientName}"` : 'Failed to update client';
        
    } catch (error) {
        return `Client update failed: ${error.message}`;
    }
}

/**
 * Show notification action
 */
function executeShowNotification(config, payload) {
    try {
        // Process message template
        let message = config.message || 'Automation notification';
        message = processTemplate(message, payload);
        
        // Log as notification (in a real app, this would show a toast/notification)
        console.log(`📢 Automation Notification: ${message}`);
        
        return `Notification: "${message}"`;
        
    } catch (error) {
        return `Notification failed: ${error.message}`;
    }
}

/**
 * Mark invoice as overdue action
 */
function executeMarkInvoiceAsOverdue(config, payload) {
    if (!window.ubaStore || !window.ubaStore.invoices) {
        return 'Failed: Invoices store not available';
    }
    
    try {
        // Get invoice from payload
        let invoice = null;
        if (payload.invoice) {
            invoice = payload.invoice;
        } else {
            return 'Failed: No invoice in payload';
        }
        
        // Check if invoice has a due date
        if (!invoice.due) {
            return 'Failed: Invoice has no due date';
        }
        
        // Calculate if invoice is overdue
        const dueDate = new Date(invoice.due);
        const today = new Date();
        const overdueDays = parseInt(config.overdueDays) || 0;
        const overdueThreshold = new Date(dueDate);
        overdueThreshold.setDate(overdueThreshold.getDate() + overdueDays);
        
        if (today < overdueThreshold) {
            return `Invoice not yet overdue (due: ${invoice.due})`;
        }
        
        // Update invoice status to overdue if not already
        if (invoice.status === 'overdue') {
            return `Invoice already marked as overdue`;
        }
        
        const success = window.ubaStore.invoices.update(invoice.id, { 
            status: 'overdue',
            updatedAt: new Date().toISOString()
        });
        
        return success ? `Marked invoice as overdue: ${invoice.label || invoice.client}` : 'Failed to update invoice';
        
    } catch (error) {
        return `Mark overdue failed: ${error.message}`;
    }
}

/**
 * Process template strings with payload data
 */
function processTemplate(template, payload) {
    let processed = template;
    
    // Replace common placeholders
    if (payload.invoice) {
        processed = processed.replace(/\{client\}/g, payload.invoice.client || 'Unknown Client');
        processed = processed.replace(/\{amount\}/g, payload.invoice.amount || '0');
        processed = processed.replace(/\{status\}/g, payload.invoice.status || 'unknown');
        processed = processed.replace(/\{label\}/g, payload.invoice.label || 'invoice');
    }
    
    if (payload.client) {
        processed = processed.replace(/\{client\}/g, payload.client.name || 'Unknown Client');
        processed = processed.replace(/\{company\}/g, payload.client.company || '');
    }
    
    if (payload.task) {
        processed = processed.replace(/\{task\}/g, payload.task.title || 'Unknown Task');
        processed = processed.replace(/\{priority\}/g, payload.task.priority || 'medium');
    }
    
    // Replace trigger placeholder
    processed = processed.replace(/\{trigger\}/g, payload.triggerType || 'unknown trigger');
    
    return processed;
}

/**
 * Generate payload summary for logging
 */
function generatePayloadSummary(payload) {
    const summaryParts = [];
    
    if (payload.invoice) {
        summaryParts.push(`Invoice: ${payload.invoice.client || 'Unknown'} - $${payload.invoice.amount || 0}`);
    }
    
    if (payload.client) {
        summaryParts.push(`Client: ${payload.client.name || 'Unknown'}`);
    }
    
    if (payload.task) {
        summaryParts.push(`Task: ${payload.task.title || 'Unknown'}`);
    }
    
    return summaryParts.join(', ') || 'No details';
}

/**
 * Log an automation run
 */
function logAutomationRun(automation, triggerType, success, result, payloadSummary = '') {
    if (!window.ubaStore) return;
    
    // Ensure automationLogs collection exists
    if (!window.ubaStore.automationLogs) {
        ensureAutomationCollections();
        if (!window.ubaStore.automationLogs) {
            console.warn('Could not initialize automationLogs collection');
            return;
        }
    }
    
    const logEntry = {
        ruleId: automation?.id || null,
        ruleName: automation?.name || 'Unknown Rule',
        triggerType,
        success,
        result,
        payloadSummary,
        timestamp: new Date().toISOString()
    };
    
    try {
        window.ubaStore.automationLogs.create(logEntry);
        
        // Keep only last 50 logs to prevent storage bloat
        const logs = window.ubaStore.automationLogs.getAll() || [];
        if (logs.length > 50) {
            const trimmedLogs = logs
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 50);
            window.ubaStore.automationLogs.saveAll(trimmedLogs);
        }
    } catch (error) {
        console.warn('Failed to log automation run:', error);
    }
}

// Utility functions
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return date.toLocaleString();
    } catch (e) {
        return '—';
    }
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    } catch (e) {
        return '—';
    }
}

// Make functions available globally
window.openAutomationModal = openAutomationModal;
window.closeAutomationModal = closeAutomationModal;
window.editAutomation = editAutomation;
window.deleteAutomation = deleteAutomation;
window.toggleAutomation = toggleAutomation;
window.initAutomationsPage = initAutomationsPage;
window.runAutomations = runAutomations;
