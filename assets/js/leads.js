/**
 * Leads Page - Complete CRUD Interface
 */

let isEditMode = false;
let editLeadId = null;

function initLeadsPage() {
    console.log('🧲 Initializing leads page with CRUD interface');
    
    // Check if required elements exist
    const requiredElements = {
        'new-lead-btn': 'New Lead button',
        'save-lead-btn': 'Save button',
        'lead-form': 'Lead form',
        'leads-body': 'Leads table body',
        'lead-modal': 'Lead modal'
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
    
    // Initialize modal event handlers
    initModalEvents();
    
    // Render the leads table
    renderLeadsTable();
    
    // Update lead metrics
    updateLeadMetrics();
    
    console.log('✓ Leads page initialization complete');
}

function initModalEvents() {
    console.log('🔗 Setting up lead modal event handlers...');
    
    // New lead button
    const newLeadBtn = document.getElementById('new-lead-btn');
    if (newLeadBtn) {
        newLeadBtn.addEventListener('click', () => {
            console.log('📝 New lead button clicked');
            openLeadModal();
        });
        console.log('  ✓ New lead button event attached');
    }

    // Save button
    const saveBtn = document.getElementById('save-lead-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveLead);
        console.log('  ✓ Save button event attached');
    }

    // Form submission
    const form = document.getElementById('lead-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            console.log('📋 Lead form submitted');
            e.preventDefault();
            handleSaveLead();
        });
        console.log('  ✓ Form submission event attached');
    }
    
    console.log('✓ Modal events setup complete');
}

function openLeadModal(leadData = null) {
    const modal = document.getElementById('lead-modal');
    const modalTitle = document.getElementById('lead-modal-title');
    const form = document.getElementById('lead-form');
    
    if (!modal || !form) return;
    
    // Reset form and error states
    form.reset();
    hideLeadError();
    
    if (leadData) {
        // Edit mode
        isEditMode = true;
        editLeadId = leadData.id;
        modalTitle.textContent = 'Edit Lead';
        modalTitle.setAttribute('data-i18n', 'leads.edit');
        
        // Populate form fields
        document.getElementById('lead-edit-id').value = leadData.id;
        document.getElementById('lead-name').value = leadData.name || '';
        document.getElementById('lead-company').value = leadData.company || '';
        document.getElementById('lead-email').value = leadData.email || '';
        document.getElementById('lead-phone').value = leadData.phone || '';
        document.getElementById('lead-value').value = leadData.value || '';
        document.getElementById('lead-status').value = leadData.status || 'new';
        document.getElementById('lead-source').value = leadData.source || 'website';
        document.getElementById('lead-priority').value = leadData.priority || 'medium';
        document.getElementById('lead-notes').value = leadData.notes || '';
        
        // Update save button text
        const saveBtn = document.getElementById('save-lead-btn');
        if (saveBtn) {
            const span = saveBtn.querySelector('span');
            if (span) {
                span.textContent = 'Update Lead';
                span.setAttribute('data-i18n', 'action.update');
            }
        }
    } else {
        // Create mode
        isEditMode = false;
        editLeadId = null;
        modalTitle.textContent = 'New Lead';
        modalTitle.setAttribute('data-i18n', 'leads.new');
        
        // Set defaults
        document.getElementById('lead-status').value = 'new';
        document.getElementById('lead-source').value = 'website';
        document.getElementById('lead-priority').value = 'medium';
        
        // Update save button text
        const saveBtn = document.getElementById('save-lead-btn');
        if (saveBtn) {
            const span = saveBtn.querySelector('span');
            if (span) {
                span.textContent = 'Save Lead';
                span.setAttribute('data-i18n', 'action.save');
            }
        }
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus on first input
    setTimeout(() => {
        const nameInput = document.getElementById('lead-name');
        if (nameInput) nameInput.focus();
    }, 100);
}

function closeLeadModal() {
    const modal = document.getElementById('lead-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Reset states
    isEditMode = false;
    editLeadId = null;
    hideLeadError();
}

function handleSaveLead() {
    const name = document.getElementById('lead-name').value.trim();
    const company = document.getElementById('lead-company').value.trim();
    const email = document.getElementById('lead-email').value.trim();
    const phone = document.getElementById('lead-phone').value.trim();
    const value = parseFloat(document.getElementById('lead-value').value) || 0;
    const status = document.getElementById('lead-status').value;
    const source = document.getElementById('lead-source').value;
    const priority = document.getElementById('lead-priority').value;
    const notes = document.getElementById('lead-notes').value.trim();
    
    // Validation
    if (!name) {
        showLeadError('Lead name is required');
        return;
    }
    
    if (email && !isValidEmail(email)) {
        showLeadError('Please enter a valid email address');
        return;
    }
    
    // Prepare lead data
    const leadData = {
        name,
        company,
        email,
        phone,
        value,
        status,
        source,
        priority,
        notes,
        created_at: isEditMode ? null : new Date().toISOString()
    };
    
    // Remove null created_at for edit mode to preserve original
    if (isEditMode) {
        delete leadData.created_at;
    }
    
    try {
        // Check if ubaStore is available
        if (!window.ubaStore || !window.ubaStore.leads) {
            showLeadError('Data store not available. Please refresh the page.');
            return;
        }
        
        if (isEditMode && editLeadId) {
            // Update existing lead
            const success = window.ubaStore.leads.update(editLeadId, leadData);
            if (success) {
                console.log('✅ Lead updated successfully');
                
                // Show notification
                if (window.showToast) {
                    window.showToast(`Lead "${leadData.company}" updated successfully`, 'success', {
                        title: 'Lead Updated',
                        data: { leadId: editLeadId, leadName: leadData.company }
                    });
                }
                
                // Trigger automation for lead update if applicable
                if (typeof window.runAutomations === 'function') {
                    const updatedLead = window.ubaStore.leads.getById(editLeadId);
                    if (updatedLead) {
                        window.runAutomations('lead_updated', { lead: updatedLead });
                        
                        // Check for status-specific triggers
                        if (updatedLead.status === 'qualified') {
                            window.runAutomations('lead_qualified', { lead: updatedLead });
                        } else if (updatedLead.status === 'won') {
                            window.runAutomations('lead_won', { lead: updatedLead });
                        }
                    }
                }
                
                closeLeadModal();
                renderLeadsTable();
                updateLeadMetrics();
            } else {
                showLeadError('Failed to update lead');
            }
        } else {
            // Create new lead
            const newLead = window.ubaStore.leads.create(leadData);
            if (newLead) {
                console.log('✅ Lead created successfully:', newLead);
                
                // Show notification
                if (window.showToast) {
                    window.showToast(`New lead "${leadData.company}" added to pipeline`, 'lead', {
                        title: 'New Lead Added',
                        data: { leadId: newLead.id, leadName: leadData.company }
                    });
                }
                
                // Trigger automation for new lead
                if (typeof window.runAutomations === 'function') {
                    window.runAutomations('lead_created', { lead: newLead });
                }
                
                closeLeadModal();
                refreshLeadsData();
            } else {
                showLeadError('Failed to create lead');
            }
        }
    } catch (error) {
        console.error('❌ Error saving lead:', error);
        showLeadError('An error occurred while saving the lead');
    }
}

function editLead(id) {
    if (!window.ubaStore || !window.ubaStore.leads) {
        console.error('❌ ubaStore not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    const lead = window.ubaStore.leads.getById(id);
    if (lead) {
        openLeadModal(lead);
    } else {
        console.error('❌ Lead not found:', id);
        alert('Lead not found. The table will be refreshed.');
        renderLeadsTable();
    }
}

function deleteLead(id) {
    if (!window.ubaStore || !window.ubaStore.leads) {
        console.error('❌ ubaStore not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    const lead = window.ubaStore.leads.getById(id);
    if (!lead) {
        console.error('❌ Lead not found:', id);
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete the lead "${lead.name}" from ${lead.company || 'Unknown Company'}?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        try {
            const success = window.ubaStore.leads.delete(id);
            if (success) {
                console.log('✅ Lead deleted successfully');
                renderLeadsTable();
                updateLeadMetrics();
                
                // Show notification
                if (window.showToast) {
                    window.showToast(`Lead "${lead.company}" removed from pipeline`, 'info', {
                        title: 'Lead Deleted',
                        data: { leadName: lead.company }
                    });
                }
            } else {
                alert('Failed to delete lead');
            }
        } catch (error) {
            console.error('❌ Error deleting lead:', error);
            alert('An error occurred while deleting the lead');
        }
    }
}

function renderLeadsTable() {
    const tbody = document.getElementById('leads-body');
    if (!tbody) {
        console.warn('❌ leads-body element not found');
        return;
    }
    
    // Check if ubaStore is available
    if (!window.ubaStore || !window.ubaStore.leads) {
        console.warn('❌ ubaStore.leads not available');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span>Data store not available. Please check your setup.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    const leads = window.ubaStore.leads.getAll();
    
    if (!leads || leads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span data-i18n="leads.empty">No leads yet. Add your first lead.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort leads by creation date (newest first)
    const sortedLeads = leads.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
    });
    
    tbody.innerHTML = sortedLeads.map(lead => {
        const statusClass = getLeadStatusClass(lead.status);
        const priorityClass = getPriorityClass(lead.priority);
        const formattedValue = formatCurrency(lead.value);
        const sourceLabel = getSourceLabel(lead.source);
        
        return `
            <tr>
                <td>
                    <strong>${escapeHtml(lead.name)}</strong>
                    <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">
                        <span class="uba-priority ${priorityClass}" style="font-size: 10px;">
                            ${capitalizeFirst(lead.priority || 'medium')}
                        </span>
                    </div>
                </td>
                <td>${escapeHtml(lead.company || '—')}</td>
                <td>
                    ${lead.email ? `<a href="mailto:${escapeHtml(lead.email)}" style="color: var(--accent);">${escapeHtml(lead.email)}</a>` : '—'}
                    ${lead.phone ? `<br><small style="color: var(--muted);">${escapeHtml(lead.phone)}</small>` : ''}
                </td>
                <td>
                    <strong>${formattedValue}</strong>
                </td>
                <td>
                    <span class="uba-status ${statusClass}">
                        ${capitalizeFirst(lead.status)}
                    </span>
                </td>
                <td>
                    <span class="uba-source-badge">
                        ${sourceLabel}
                    </span>
                </td>
                <td>
                    <div class="uba-table-actions">
                        <button 
                            class="uba-btn-sm uba-btn-ghost" 
                            onclick="editLead('${lead.id}')"
                            title="Edit Lead"
                        >
                            ✏️
                        </button>
                        <button 
                            class="uba-btn-sm uba-btn-danger" 
                            onclick="deleteLead('${lead.id}')"
                            title="Delete Lead"
                        >
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateLeadMetrics() {
    if (!window.ubaStore || !window.ubaStore.leads) {
        console.warn('❌ ubaStore not available for metrics');
        return;
    }
    
    const leads = window.ubaStore.leads.getAll() || [];
    const count = leads.length;
    const totalValue = leads.reduce((sum, lead) => sum + (parseFloat(lead.value) || 0), 0);
    
    // Calculate conversion rate (won leads / total leads * 100)
    const wonLeads = leads.filter(lead => lead.status === 'won').length;
    const conversionRate = count > 0 ? Math.round((wonLeads / count) * 100) : 0;
    
    const countEl = document.getElementById('lead-count');
    const valueEl = document.getElementById('lead-value');
    const conversionEl = document.getElementById('lead-conversion');
    
    if (countEl) countEl.textContent = count;
    if (valueEl) valueEl.textContent = formatCurrency(totalValue);
    if (conversionEl) conversionEl.textContent = `${conversionRate}%`;
}

function showLeadError(message) {
    const errorEl = document.getElementById('lead-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function hideLeadError() {
    const errorEl = document.getElementById('lead-error');
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
}

// Utility functions
function getLeadStatusClass(status) {
    switch (status) {
        case 'won': return 'uba-status-success';
        case 'qualified': 
        case 'proposal': return 'uba-status-info';
        case 'contacted': return 'uba-status-warning';
        case 'lost': return 'uba-status-danger';
        case 'new':
        default: return 'uba-status-neutral';
    }
}

function getPriorityClass(priority) {
    switch (priority) {
        case 'high': return 'uba-priority-high';
        case 'low': return 'uba-priority-low';
        case 'medium':
        default: return 'uba-priority-medium';
    }
}

function getSourceLabel(source) {
    const sources = {
        website: 'Website',
        referral: 'Referral',
        social: 'Social',
        email: 'Email',
        cold_call: 'Cold Call',
        event: 'Event',
        other: 'Other'
    };
    return sources[source] || 'Unknown';
}

function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return `€ ${num.toLocaleString()}`;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Update leads data and refresh search index
function refreshLeadsData() {
    loadLeadsData();
    renderLeadsTable();
    updateLeadMetrics();
    
    // Rebuild search index after data changes
    if (typeof window.search?.buildIndex === 'function') {
        setTimeout(() => window.search.buildIndex(), 100);
    }
}

// Filter leads based on search, filter, and sort criteria
function filterLeads(searchQuery = '', filterBy = '', sortBy = '') {
    let filteredLeads = [...leadsData];
    
    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredLeads = filteredLeads.filter(lead => {
            return [lead.company, lead.contactName, lead.email, lead.phone, lead.industry, lead.source, lead.notes]
                .some(field => field && field.toLowerCase().includes(query));
        });
    }
    
    // Apply status/category filter
    if (filterBy) {
        filteredLeads = filteredLeads.filter(lead => {
            switch (filterBy) {
                case 'status':
                    return lead.status === filterBy;
                case 'industry':
                    return lead.industry === filterBy;
                case 'source':
                    return lead.source === filterBy;
                case 'priority':
                    return lead.priority === filterBy;
                default:
                    return true;
            }
        });
    }
    
    // Apply sorting
    if (sortBy) {
        const [field, direction] = sortBy.split('-');
        filteredLeads.sort((a, b) => {
            let valueA = a[field] || '';
            let valueB = b[field] || '';
            
            // Handle different data types
            if (field === 'value' || field === 'createdAt') {
                valueA = new Date(valueA).getTime() || 0;
                valueB = new Date(valueB).getTime() || 0;
            } else if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            if (direction === 'desc') {
                return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
            } else {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            }
        });
    }
    
    // Re-render table with filtered results
    renderLeadsTableWithData(filteredLeads);
}

// Render leads table with specific data
function renderLeadsTableWithData(leads) {
    const tbody = document.getElementById('leads-table-body');
    if (!tbody) return;

    if (leads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--muted);">
                    <div style="font-size: 18px; margin-bottom: 8px;">No leads found</div>
                    <div style="font-size: 14px;">Try adjusting your search or filter criteria</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = leads.map(lead => {
        const statusClass = getStatusClass(lead.status);
        const priorityClass = getPriorityClass(lead.priority);
        const formattedValue = formatCurrency(lead.value);

        return `
            <tr>
                <td>
                    <div style="font-weight: 600;">${lead.company}</div>
                    <div style="font-size: 12px; color: var(--muted);">${lead.industry || 'Not specified'}</div>
                </td>
                <td>
                    <div style="font-weight: 500;">${lead.contactName}</div>
                    <div style="font-size: 12px; color: var(--muted);">${lead.email}</div>
                </td>
                <td>${lead.phone || 'Not provided'}</td>
                <td>
                    <span class="uba-category-badge">${lead.source}</span>
                </td>
                <td style="font-weight: 600;">${formattedValue}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="uba-status-badge ${statusClass}">
                            ${capitalizeFirst(lead.status)}
                        </span>
                        <span class="uba-priority-badge ${priorityClass}">
                            ${capitalizeFirst(lead.priority)}
                        </span>
                    </div>
                </td>
                <td>
                    <div class="uba-table-actions">
                        <button class="uba-btn-link" onclick="editLead('${lead.id}')" title="Edit lead">
                            Edit
                        </button>
                        <button class="uba-btn-link uba-btn-danger" onclick="deleteLead('${lead.id}')" title="Delete lead">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Make functions available globally for HTML onclick handlers
window.filterLeads = filterLeads;
window.openLeadModal = openLeadModal;
window.closeLeadModal = closeLeadModal;
window.editLead = editLead;
window.deleteLead = deleteLead;
window.initLeadsPage = initLeadsPage;