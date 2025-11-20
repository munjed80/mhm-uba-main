/**
 * Invoices Page - Modern CRUD Interface
 */

let isEditMode = false;
let editInvoiceId = null;

function initInvoicesPage() {
    console.log('🧯 Initializing invoices page with modal CRUD interface');
    
    // Check if required elements exist
    const requiredElements = {
        'new-invoice-btn': 'New Invoice button',
        'save-invoice-btn': 'Save button',
        'invoice-form': 'Invoice form',
        'invoices-body': 'Invoices table body',
        'invoice-modal': 'Invoice modal'
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
    
    // Render the invoices table
    renderInvoicesTable();
    
    // Update invoice count and total
    updateInvoiceMetrics();
    
    console.log('✓ Invoices page initialization complete');
}

function initModalEvents() {
    console.log('🔗 Setting up modal event handlers...');
    
    // New invoice button
    const newInvoiceBtn = document.getElementById('new-invoice-btn');
    if (newInvoiceBtn) {
        newInvoiceBtn.addEventListener('click', () => {
            console.log('📝 New invoice button clicked');
            openInvoiceModal();
        });
        console.log('  ✓ New invoice button event attached');
    } else {
        console.warn('  ⚠️ New invoice button not found');
    }

    // Save button
    const saveBtn = document.getElementById('save-invoice-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveInvoice);
        console.log('  ✓ Save button event attached');
    } else {
        console.warn('  ⚠️ Save button not found');
    }

    // Form submission (Enter key handling)
    const form = document.getElementById('invoice-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            console.log('📋 Form submitted');
            e.preventDefault();
            handleSaveInvoice();
        });
        console.log('  ✓ Form submission event attached');
    } else {
        console.warn('  ⚠️ Invoice form not found');
    }
    
    console.log('✓ Modal events setup complete');
}

function openInvoiceModal(invoiceData = null) {
    const modal = document.getElementById('invoice-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('invoice-form');
    
    if (!modal || !form) return;
    
    // Reset form and error states
    form.reset();
    hideInvoiceError();
    
    if (invoiceData) {
        // Edit mode
        isEditMode = true;
        editInvoiceId = invoiceData.id;
        modalTitle.textContent = 'Edit Invoice';
        modalTitle.setAttribute('data-i18n', 'invoices.edit');
        
        // Populate form fields
        document.getElementById('invoice-edit-id').value = invoiceData.id;
        document.getElementById('invoice-client').value = invoiceData.client || '';
        document.getElementById('invoice-label').value = invoiceData.label || '';
        document.getElementById('invoice-amount').value = invoiceData.amount || '';
        document.getElementById('invoice-status').value = invoiceData.status || 'draft';
        document.getElementById('invoice-due').value = invoiceData.due || '';
        document.getElementById('invoice-notes').value = invoiceData.notes || '';
        
        // Update save button text
        const saveBtn = document.getElementById('save-invoice-btn');
        if (saveBtn) {
            const span = saveBtn.querySelector('span');
            if (span) {
                span.textContent = 'Update Invoice';
                span.setAttribute('data-i18n', 'action.update');
            }
        }
    } else {
        // Create mode
        isEditMode = false;
        editInvoiceId = null;
        modalTitle.textContent = 'New Invoice';
        modalTitle.setAttribute('data-i18n', 'invoices.new');
        
        // Set default due date (30 days from now)
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + 30);
        document.getElementById('invoice-due').value = defaultDue.toISOString().split('T')[0];
        
        // Update save button text
        const saveBtn = document.getElementById('save-invoice-btn');
        if (saveBtn) {
            const span = saveBtn.querySelector('span');
            if (span) {
                span.textContent = 'Save Invoice';
                span.setAttribute('data-i18n', 'action.save');
            }
        }
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus on first input
    setTimeout(() => {
        const clientInput = document.getElementById('invoice-client');
        if (clientInput) clientInput.focus();
    }, 100);
}

function closeInvoiceModal() {
    const modal = document.getElementById('invoice-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Reset states
    isEditMode = false;
    editInvoiceId = null;
    hideInvoiceError();
}

function handleSaveInvoice() {
    const client = document.getElementById('invoice-client').value.trim();
    const label = document.getElementById('invoice-label').value.trim();
    const amount = parseFloat(document.getElementById('invoice-amount').value) || 0;
    const status = document.getElementById('invoice-status').value;
    const due = document.getElementById('invoice-due').value;
    const notes = document.getElementById('invoice-notes').value.trim();
    
    // Validation
    if (!client) {
        showInvoiceError('Client name is required');
        return;
    }
    
    if (amount <= 0) {
        showInvoiceError('Amount must be greater than 0');
        return;
    }
    
    // Prepare invoice data
    const invoiceData = {
        client,
        label,
        amount,
        status,
        due,
        notes
    };
    
    // Only set created_at for new invoices
    if (!isEditMode) {
        invoiceData.created_at = new Date().toISOString();
    }
    
    try {
        // Check if ubaStore is available
        if (!window.ubaStore || !window.ubaStore.invoices) {
            showInvoiceError('Data store not available. Please refresh the page.');
            return;
        }
        
        if (isEditMode && editInvoiceId) {
            // Update existing invoice
            const success = window.ubaStore.invoices.update(editInvoiceId, invoiceData);
            if (success) {
                console.log('✅ Invoice updated successfully');
                closeInvoiceModal();
                renderInvoicesTable();
                updateInvoiceMetrics();
            } else {
                showInvoiceError('Failed to update invoice');
            }
        } else {
            // Create new invoice
            const newInvoice = window.ubaStore.invoices.create(invoiceData);
            if (newInvoice) {
                console.log('✅ Invoice created successfully:', newInvoice);
                closeInvoiceModal();
                renderInvoicesTable();
                updateInvoiceMetrics();
            } else {
                showInvoiceError('Failed to create invoice');
            }
        }
    } catch (error) {
        console.error('❌ Error saving invoice:', error);
        showInvoiceError('An error occurred while saving the invoice');
    }
}

function editInvoice(id) {
    if (!window.ubaStore || !window.ubaStore.invoices) {
        console.error('❌ ubaStore not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    const invoice = window.ubaStore.invoices.getById(id);
    if (invoice) {
        openInvoiceModal(invoice);
    } else {
        console.error('❌ Invoice not found:', id);
        alert('Invoice not found. The table will be refreshed.');
        renderInvoicesTable();
    }
}

function deleteInvoice(id) {
    if (!window.ubaStore || !window.ubaStore.invoices) {
        console.error('❌ ubaStore not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    const invoice = window.ubaStore.invoices.getById(id);
    if (!invoice) {
        console.error('Invoice not found:', id);
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete the invoice for "${invoice.client}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        try {
            const success = window.ubaStore.invoices.delete(id);
            if (success) {
                console.log('✅ Invoice deleted successfully');
                renderInvoicesTable();
                updateInvoiceMetrics();
            } else {
                alert('Failed to delete invoice');
            }
        } catch (error) {
            console.error('❌ Error deleting invoice:', error);
            alert('An error occurred while deleting the invoice');
        }
    }
}

function renderInvoicesTable() {
    const tbody = document.getElementById('invoices-body');
    if (!tbody) {
        console.warn('❌ invoices-body element not found');
        return;
    }
    
    // Check if ubaStore is available
    if (!window.ubaStore || !window.ubaStore.invoices) {
        console.warn('❌ ubaStore.invoices not available');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span>Data store not available. Please check your setup.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    const invoices = window.ubaStore.invoices.getAll();
    
    if (!invoices || invoices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span data-i18n="mini.none">No invoices yet. Add your first one.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort invoices by creation date (newest first)
    const sortedInvoices = invoices.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
    });
    
    tbody.innerHTML = sortedInvoices.map(invoice => {
        const statusClass = getStatusClass(invoice.status);
        const formattedAmount = formatAmount(invoice.amount);
        const formattedDue = formatDate(invoice.due);
        
        return `
            <tr>
                <td>
                    <strong>${escapeHtml(invoice.client)}</strong>
                </td>
                <td>${escapeHtml(invoice.label || '—')}</td>
                <td>
                    <strong>${formattedAmount}</strong>
                </td>
                <td>
                    <span class="uba-status ${statusClass}">
                        ${capitalizeFirst(invoice.status)}
                    </span>
                </td>
                <td>${formattedDue}</td>
                <td>
                    <div class="uba-table-actions">
                        <button 
                            class="uba-btn-sm uba-btn-ghost" 
                            onclick="editInvoice('${invoice.id}')"
                            title="Edit Invoice"
                        >
                            ✏️
                        </button>
                        <button 
                            class="uba-btn-sm uba-btn-danger" 
                            onclick="deleteInvoice('${invoice.id}')"
                            title="Delete Invoice"
                        >
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateInvoiceMetrics() {
    if (!window.ubaStore || !window.ubaStore.invoices) {
        console.warn('❌ ubaStore not available for metrics');
        return;
    }
    
    const invoices = window.ubaStore.invoices.getAll() || [];
    const count = invoices.length;
    const total = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    
    const countEl = document.getElementById('invoice-count');
    const totalEl = document.getElementById('invoice-total');
    
    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = formatAmount(total);
}

function showInvoiceError(message) {
    const errorEl = document.getElementById('invoice-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function hideInvoiceError() {
    const errorEl = document.getElementById('invoice-error');
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
}

// Utility functions
function getStatusClass(status) {
    switch (status) {
        case 'paid': return 'uba-status-success';
        case 'sent': return 'uba-status-info';
        case 'overdue': return 'uba-status-danger';
        case 'draft':
        default: return 'uba-status-neutral';
    }
}

function formatAmount(amount) {
    const num = parseFloat(amount) || 0;
    return `€ ${num.toFixed(2)}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    } catch (e) {
        return '—';
    }
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

// Make functions available globally for HTML onclick handlers
window.openInvoiceModal = openInvoiceModal;
window.closeInvoiceModal = closeInvoiceModal;
window.editInvoice = editInvoice;
window.deleteInvoice = deleteInvoice;
window.initInvoicesPage = initInvoicesPage;

// Verification function to test all connections
window.verifyInvoicesSetup = function() {
    console.log('🔍 VERIFYING INVOICES SETUP...\n');
    
    // 1. Check HTML elements
    const elements = [
        'new-invoice-btn', 'save-invoice-btn', 'invoice-form', 
        'invoices-body', 'invoice-modal', 'invoice-client', 
        'invoice-amount', 'invoice-status'
    ];
    
    console.log('1️⃣ Checking HTML elements:');
    elements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`   ${el ? '✅' : '❌'} ${id}: ${el ? 'Found' : 'MISSING'}`);
    });
    
    // 2. Check global functions
    console.log('\n2️⃣ Checking global functions:');
    const functions = [
        'initInvoicesPage', 'openInvoiceModal', 'closeInvoiceModal', 
        'editInvoice', 'deleteInvoice'
    ];
    
    functions.forEach(fn => {
        const exists = typeof window[fn] === 'function';
        console.log(`   ${exists ? '✅' : '❌'} ${fn}: ${exists ? 'Available' : 'MISSING'}`);
    });
    
    // 3. Check ubaStore
    console.log('\n3️⃣ Checking data store:');
    const hasUbaStore = !!window.ubaStore;
    console.log(`   ${hasUbaStore ? '✅' : '❌'} window.ubaStore: ${hasUbaStore ? 'Available' : 'MISSING'}`);
    
    if (hasUbaStore) {
        const hasInvoices = !!window.ubaStore.invoices;
        console.log(`   ${hasInvoices ? '✅' : '❌'} ubaStore.invoices: ${hasInvoices ? 'Available' : 'MISSING'}`);
        
        if (hasInvoices) {
            const methods = ['getAll', 'getById', 'create', 'update', 'delete'];
            methods.forEach(method => {
                const exists = typeof window.ubaStore.invoices[method] === 'function';
                console.log(`   ${exists ? '✅' : '❌'} invoices.${method}: ${exists ? 'Available' : 'MISSING'}`);
            });
        }
    }
    
    // 4. Test modal functionality
    console.log('\n4️⃣ Testing modal functionality:');
    try {
        const modal = document.getElementById('invoice-modal');
        if (modal) {
            // Test opening
            openInvoiceModal();
            const isVisible = modal.style.display === 'flex';
            console.log(`   ${isVisible ? '✅' : '❌'} Modal opens: ${isVisible ? 'Success' : 'Failed'}`);
            
            // Test closing
            closeInvoiceModal();
            const isHidden = modal.style.display === 'none';
            console.log(`   ${isHidden ? '✅' : '❌'} Modal closes: ${isHidden ? 'Success' : 'Failed'}`);
        } else {
            console.log('   ❌ Modal element not found');
        }
    } catch (error) {
        console.log('   ❌ Modal test failed:', error.message);
    }
    
    // 5. Test data operations
    console.log('\n5️⃣ Testing data operations:');
    if (window.ubaStore && window.ubaStore.invoices) {
        try {
            const testInvoice = {
                client: 'Test Client',
                amount: 100,
                status: 'draft',
                label: 'Test Invoice'
            };
            
            // Create
            const created = window.ubaStore.invoices.create(testInvoice);
            const createSuccess = !!created && !!created.id;
            console.log(`   ${createSuccess ? '✅' : '❌'} Create: ${createSuccess ? 'Success' : 'Failed'}`);
            
            if (createSuccess) {
                // Read
                const retrieved = window.ubaStore.invoices.getById(created.id);
                const readSuccess = !!retrieved && retrieved.client === 'Test Client';
                console.log(`   ${readSuccess ? '✅' : '❌'} Read: ${readSuccess ? 'Success' : 'Failed'}`);
                
                // Update
                const updated = window.ubaStore.invoices.update(created.id, { amount: 200 });
                const updateSuccess = !!updated && updated.amount === 200;
                console.log(`   ${updateSuccess ? '✅' : '❌'} Update: ${updateSuccess ? 'Success' : 'Failed'}`);
                
                // Delete
                const deleted = window.ubaStore.invoices.delete(created.id);
                const deleteSuccess = deleted === true;
                console.log(`   ${deleteSuccess ? '✅' : '❌'} Delete: ${deleteSuccess ? 'Success' : 'Failed'}`);
            }
        } catch (error) {
            console.log('   ❌ Data operations failed:', error.message);
        }
    } else {
        console.log('   ❌ Cannot test - ubaStore not available');
    }
    
    console.log('\n🔍 VERIFICATION COMPLETE');
    console.log('Run this verification by calling: verifyInvoicesSetup()');
};

// Test function to add sample data
window.addTestInvoices = function() {
    console.log('🧪 Adding test invoice data...');
    
    if (!window.ubaStore || !window.ubaStore.invoices) {
        console.error('❌ ubaStore not available');
        return;
    }
    
    const testInvoices = [
        {
            client: 'Acme Corporation',
            label: 'Website Development',
            amount: 2500.00,
            status: 'sent',
            due: '2025-12-15',
            notes: 'Initial development phase'
        },
        {
            client: 'Tech Startup Inc',
            label: 'Consulting Services',
            amount: 1200.50,
            status: 'paid',
            due: '2025-11-30',
            notes: 'Monthly consulting retainer'
        },
        {
            client: 'Local Business',
            label: 'Logo Design',
            amount: 800.00,
            status: 'draft',
            due: '2025-12-20',
            notes: 'Brand identity package'
        }
    ];
    
    testInvoices.forEach(invoice => {
        window.ubaStore.invoices.create(invoice);
    });
    
    console.log('✅ Test invoices added');
    renderInvoicesTable();
    updateInvoiceMetrics();
    console.log('✅ Table and metrics updated');
};

// Test function to clear all invoices
window.clearAllInvoices = function() {
    console.log('🗑️ Clearing all invoices...');
    
    if (!window.ubaStore || !window.ubaStore.invoices) {
        console.error('❌ ubaStore not available');
        return;
    }
    
    const invoices = window.ubaStore.invoices.getAll() || [];
    invoices.forEach(invoice => {
        window.ubaStore.invoices.delete(invoice.id);
    });
    
    console.log('✅ All invoices cleared');
    renderInvoicesTable();
    updateInvoiceMetrics();
    console.log('✅ Table and metrics updated');
};
