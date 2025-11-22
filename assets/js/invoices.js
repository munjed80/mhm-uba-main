/**
 * Invoices Page - Modern CRUD Interface with Validation and Pagination
 */

let isEditMode = false;
let editInvoiceId = null;
let currentPage = 1;
let pageSize = 20;
let filteredInvoices = [];

// Validation schema for invoices
const invoiceValidationSchema = {
    'invoice-client': { required: true, type: 'string' },
    'invoice-amount': { required: true, type: 'number', options: { min: 0.01 } },
    'invoice-label': { required: false, type: 'string' },
    'invoice-status': { required: true, type: 'string' },
    'invoice-due': { required: false, type: 'date' },
    'invoice-notes': { required: false, type: 'string' }
};

function initInvoicesPage() {
    console.log('🧯 Initializing enhanced invoices page with validation and pagination');
    
    // Check if required elements exist
    const requiredElements = {
        'new-invoice-btn': 'New Invoice button',
        'save-invoice-btn': 'Save button',
        'invoice-form': 'Invoice form',
        'invoices-body': 'Invoices table body',
        'invoice-modal': 'Invoice modal'
    };
    
    let missingElements = [];
    for (const id in requiredElements) {
        if (requiredElements.hasOwnProperty(id)) {
            if (!document.getElementById(id)) {
                missingElements.push(requiredElements[id] + ' (ID: ' + id + ')');
            }
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
    
    // Initialize pagination with search and sort
    initInvoicesPagination();
    
    // Render the invoices table
    renderInvoicesTable();
    
    // Update invoice count and total
    updateInvoiceMetrics();
    
    console.log('✓ Enhanced invoices page initialization complete');
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

async function handleSaveInvoice() {
    const client = document.getElementById('invoice-client').value.trim();
    const label = document.getElementById('invoice-label').value.trim();
    const amount = parseFloat(document.getElementById('invoice-amount').value) || 0;
    const status = document.getElementById('invoice-status').value;
    const due = document.getElementById('invoice-due').value;
    const notes = document.getElementById('invoice-notes').value.trim();
    
    // Clear previous errors
    if (window.UBAValidation) {
        window.UBAValidation.clearAllErrors('invoice-form');
    }
    
    // Prepare form data for validation
    const formData = {
        'invoice-client': client,
        'invoice-amount': amount,
        'invoice-label': label,
        'invoice-status': status,
        'invoice-due': due,
        'invoice-notes': notes
    };
    
    // Validate form if validation is available
    if (window.UBAValidation) {
        const isValid = window.UBAValidation.validateAndShowErrors(
            invoiceValidationSchema, 
            formData, 
            'invoice-form'
        );
        
        if (!isValid) {
            return;
        }
    } else {
        // Fallback validation
        if (!client) {
            showInvoiceError('Client name is required');
            return;
        }
        
        if (amount <= 0) {
            showInvoiceError('Amount must be greater than 0');
            return;
        }
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
        // Use Supabase store if available, otherwise fall back to localStorage
        const store = window.SupabaseStore || window.ubaStore;
        if (!store || !store.invoices) {
            showInvoiceError('Data store not available. Please refresh the page.');
            return;
        }
        
        if (isEditMode && editInvoiceId) {
            // Get original invoice for comparison
            let originalInvoice = null;
            if (window.SupabaseStore) {
                originalInvoice = await store.invoices.get(editInvoiceId);
            } else {
                originalInvoice = store.invoices.getById ? store.invoices.getById(editInvoiceId) : store.invoices.get(editInvoiceId);
            }
            const originalStatus = originalInvoice ? originalInvoice.status : null;
            
            // Update existing invoice
            let success = false;
            if (window.SupabaseStore) {
                const result = await store.invoices.update(editInvoiceId, invoiceData);
                success = !!result;
            } else {
                success = store.invoices.update(editInvoiceId, invoiceData);
            }
            
            if (success) {
                console.log('✅ Invoice updated successfully');
                
                // Trigger automations for invoice update
                let updatedInvoice = null;
                if (window.SupabaseStore) {
                    updatedInvoice = await store.invoices.get(editInvoiceId);
                } else {
                    updatedInvoice = store.invoices.getById ? store.invoices.getById(editInvoiceId) : store.invoices.get(editInvoiceId);
                }
                
                if (updatedInvoice && typeof window.runAutomations === 'function') {
                    // Check if status changed
                    if (originalStatus && originalStatus !== updatedInvoice.status) {
                        window.runAutomations('invoice_status_changed', { 
                            invoice: updatedInvoice, 
                            previousStatus: originalStatus 
                        });
                    }
                    
                    // Check for overdue status
                    if (updatedInvoice.status === 'overdue') {
                        window.runAutomations('invoice_overdue', { invoice: updatedInvoice });
                    }
                }
                
                closeInvoiceModal();
                await renderInvoicesTable();
                await updateInvoiceMetrics();
            } else {
                showInvoiceError('Failed to update invoice');
            }
        } else {
            // Create new invoice
            let newInvoice = null;
            if (window.SupabaseStore) {
                newInvoice = await store.invoices.create(invoiceData);
            } else {
                newInvoice = store.invoices.create(invoiceData);
            }
            
            if (newInvoice) {
                console.log('✅ Invoice created successfully:', newInvoice);
                
                // Trigger automations for new invoice
                if (typeof window.runAutomations === 'function') {
                    window.runAutomations('invoice_created', { invoice: newInvoice });
                    
                    // Also check if it's already overdue
                    if (newInvoice.status === 'overdue') {
                        window.runAutomations('invoice_overdue', { invoice: newInvoice });
                    }
                }
                
                closeInvoiceModal();
                await renderInvoicesTable();
                await updateInvoiceMetrics();
            } else {
                showInvoiceError('Failed to create invoice');
            }
        }
    } catch (error) {
        console.error('❌ Error saving invoice:', error);
        showInvoiceError('An error occurred while saving the invoice');
    }
}

async function editInvoice(id) {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.invoices) {
        console.error('❌ Store not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    let invoice = null;
    if (window.SupabaseStore) {
        invoice = await store.invoices.get(id);
    } else {
        invoice = store.invoices.getById ? store.invoices.getById(id) : store.invoices.get(id);
    }
    
    if (invoice) {
        openInvoiceModal(invoice);
    } else {
        console.error('❌ Invoice not found:', id);
        alert('Invoice not found. The table will be refreshed.');
        await renderInvoicesTable();
    }
}

// View invoice in detailed modal
async function viewInvoice(id) {
    console.log('👁️ Viewing invoice:', id);
    
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.invoices) {
        console.error('❌ Store not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    let invoice = null;
    if (window.SupabaseStore) {
        invoice = await store.invoices.get(id);
    } else {
        invoice = store.invoices.getById ? store.invoices.getById(id) : store.invoices.get(id);
    }
    
    if (invoice) {
        openInvoiceViewModal(invoice);
    } else {
        console.error('❌ Invoice not found:', id);
        alert('Invoice not found. The table will be refreshed.');
        await renderInvoicesTable();
    }
}

// Open invoice view modal
function openInvoiceViewModal(invoice) {
    // Check if view modal already exists, if not create it
    let viewModal = document.getElementById('invoice-view-modal');
    if (!viewModal) {
        createInvoiceViewModal();
        viewModal = document.getElementById('invoice-view-modal');
    }
    
    if (!viewModal) {
        console.error('❌ Could not create or find invoice view modal');
        return;
    }
    
    // Populate the modal with invoice data
    populateInvoiceView(invoice);
    
    // Show the modal
    viewModal.style.display = 'flex';
}

// Create invoice view modal HTML
function createInvoiceViewModal() {
    const modalHTML = `
        <div id="invoice-view-modal" class="uba-modal invoice-view-modal" style="display: none;">
            <div class="uba-modal-content invoice-view-content">
                <div class="invoice-view-header">
                    <h2>Invoice Details</h2>
                    <div class="invoice-view-actions">
                        <button class="uba-btn-secondary" onclick="printInvoice()">
                            🖨️ Print
                        </button>
                        <button class="uba-btn-primary" onclick="downloadInvoicePDF()">
                            📄 Download PDF
                        </button>
                        <button class="uba-modal-close" onclick="closeInvoiceViewModal()">
                            ✕
                        </button>
                    </div>
                </div>
                
                <div class="invoice-view-body" id="invoice-view-content">
                    <!-- Invoice content will be populated here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Populate invoice view with data
function populateInvoiceView(invoice) {
    const content = document.getElementById('invoice-view-content');
    if (!content) return;
    
    const invoiceNumber = invoice.id.replace('inv-', 'INV-');
    const issueDate = formatDate(invoice.created_at || Date.now());
    const dueDate = formatDate(invoice.due);
    const amount = formatAmount(invoice.amount);
    const status = capitalizeFirst(invoice.status);
    
    // Get company settings for invoice header
    const companySettings = getCompanySettings();
    
    content.innerHTML = `
        <div class="invoice-document">
            <!-- Invoice Header -->
            <div class="invoice-header">
                <div class="invoice-company">
                    <h1>${companySettings.name}</h1>
                    <div class="company-details">
                        <p>${companySettings.address}</p>
                        <p>${companySettings.city}, ${companySettings.postalCode}</p>
                        <p>${companySettings.country}</p>
                        <p>Email: ${companySettings.email}</p>
                        <p>Phone: ${companySettings.phone}</p>
                    </div>
                </div>
                <div class="invoice-meta">
                    <h2>INVOICE</h2>
                    <div class="invoice-details">
                        <div class="detail-row">
                            <span class="label">Invoice #:</span>
                            <span class="value">${invoiceNumber}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Issue Date:</span>
                            <span class="value">${issueDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Due Date:</span>
                            <span class="value">${dueDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Status:</span>
                            <span class="value status-${invoice.status}">${status}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Bill To Section -->
            <div class="invoice-billing">
                <div class="bill-to">
                    <h3>Bill To:</h3>
                    <div class="client-details">
                        <p class="client-name">${invoice.client}</p>
                        ${invoice.clientEmail ? `<p>${invoice.clientEmail}</p>` : ''}
                        ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Invoice Items -->
            <div class="invoice-items">
                <h3>Invoice Details</h3>
                <table class="invoice-items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>${invoice.label || 'Service'}</strong>
                                ${invoice.description ? `<br><small>${invoice.description}</small>` : ''}
                            </td>
                            <td>1</td>
                            <td>${amount}</td>
                            <td>${amount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Invoice Totals -->
            <div class="invoice-totals">
                <div class="totals-table">
                    <div class="total-row">
                        <span class="label">Subtotal:</span>
                        <span class="value">${amount}</span>
                    </div>
                    <div class="total-row">
                        <span class="label">Tax (0%):</span>
                        <span class="value">€0.00</span>
                    </div>
                    <div class="total-row final-total">
                        <span class="label">Total:</span>
                        <span class="value">${amount}</span>
                    </div>
                </div>
            </div>
            
            <!-- Invoice Footer -->
            <div class="invoice-footer">
                <div class="payment-info">
                    <h4>Payment Information</h4>
                    <p><strong>Bank:</strong> ${companySettings.bankName || 'Your Bank Name'}</p>
                    <p><strong>Account:</strong> ${companySettings.bankAccount || 'IBAN: NL12 3456 7890 1234 56'}</p>
                    <p><strong>Reference:</strong> ${invoiceNumber}</p>
                </div>
                
                <div class="terms">
                    <h4>Terms & Conditions</h4>
                    <p>Payment is due within ${companySettings.paymentTerms || '30'} days of invoice date.</p>
                    <p>Late payments may incur additional fees as outlined in our service agreement.</p>
                </div>
            </div>
        </div>
    `;
    
    // Store current invoice for PDF generation
    window.currentInvoiceForPDF = invoice;
}

// Close invoice view modal
function closeInvoiceViewModal() {
    const modal = document.getElementById('invoice-view-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Print invoice
function printInvoice() {
    const content = document.getElementById('invoice-view-content');
    if (!content) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - Print</title>
            <style>
                ${getInvoicePrintCSS()}
            </style>
        </head>
        <body>
            ${content.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Download invoice as PDF
function downloadInvoicePDF() {
    const invoice = window.currentInvoiceForPDF;
    if (!invoice) {
        console.error('❌ No invoice data available for PDF generation');
        return;
    }
    
    // Check if jsPDF is available
    if (typeof window.jsPDF === 'undefined') {
        // Load jsPDF dynamically
        loadJSPDF().then(() => {
            generateInvoicePDF(invoice);
        }).catch(error => {
            console.error('❌ Failed to load jsPDF:', error);
            // Fallback to browser print
            printInvoice();
        });
    } else {
        generateInvoicePDF(invoice);
    }
}

// Load jsPDF library dynamically
function loadJSPDF() {
    return new Promise((resolve, reject) => {
        if (typeof window.jsPDF !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            if (typeof window.jsPDF !== 'undefined') {
                resolve();
            } else {
                reject(new Error('jsPDF failed to load'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load jsPDF script'));
        document.head.appendChild(script);
    });
}

// Generate PDF using jsPDF
function generateInvoicePDF(invoice) {
    try {
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        const companySettings = getCompanySettings();
        const invoiceNumber = invoice.id.replace('inv-', 'INV-');
        const issueDate = formatDate(invoice.created_at || Date.now());
        const dueDate = formatDate(invoice.due);
        const amount = formatAmount(invoice.amount);
        
        // Set font
        doc.setFont('helvetica');
        
        // Company Header
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(companySettings.name, 20, 30);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(companySettings.address, 20, 45);
        doc.text(`${companySettings.city}, ${companySettings.postalCode}`, 20, 55);
        doc.text(companySettings.country, 20, 65);
        doc.text(`Email: ${companySettings.email}`, 20, 75);
        doc.text(`Phone: ${companySettings.phone}`, 20, 85);
        
        // Invoice Title and Details
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 150, 30);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice #: ${invoiceNumber}`, 150, 45);
        doc.text(`Issue Date: ${issueDate}`, 150, 55);
        doc.text(`Due Date: ${dueDate}`, 150, 65);
        doc.text(`Status: ${capitalizeFirst(invoice.status)}`, 150, 75);
        
        // Bill To
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 20, 110);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.client, 20, 125);
        if (invoice.clientEmail) {
            doc.text(invoice.clientEmail, 20, 135);
        }
        
        // Items Table Header
        const tableStartY = 160;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Description', 20, tableStartY);
        doc.text('Qty', 120, tableStartY);
        doc.text('Rate', 140, tableStartY);
        doc.text('Amount', 170, tableStartY);
        
        // Draw line under header
        doc.line(20, tableStartY + 5, 190, tableStartY + 5);
        
        // Items
        doc.setFont('helvetica', 'normal');
        const itemY = tableStartY + 20;
        doc.text(invoice.label || 'Service', 20, itemY);
        doc.text('1', 120, itemY);
        doc.text(amount, 140, itemY);
        doc.text(amount, 170, itemY);
        
        // Total section
        const totalY = itemY + 30;
        doc.line(120, totalY - 10, 190, totalY - 10);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Subtotal:', 140, totalY);
        doc.text(amount, 170, totalY);
        
        doc.text('Tax (0%):', 140, totalY + 10);
        doc.text('€0.00', 170, totalY + 10);
        
        doc.setFontSize(14);
        doc.text('Total:', 140, totalY + 25);
        doc.text(amount, 170, totalY + 25);
        
        // Payment Info
        const paymentY = totalY + 50;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Information:', 20, paymentY);
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Bank: ${companySettings.bankName || 'Your Bank Name'}`, 20, paymentY + 15);
        doc.text(`Account: ${companySettings.bankAccount || 'IBAN: NL12 3456 7890 1234 56'}`, 20, paymentY + 25);
        doc.text(`Reference: ${invoiceNumber}`, 20, paymentY + 35);
        
        // Terms
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions:', 20, paymentY + 55);
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Payment is due within ${companySettings.paymentTerms || '30'} days of invoice date.`, 20, paymentY + 65);
        
        // Save PDF
        const filename = `invoice-${invoiceNumber.toLowerCase()}-${invoice.client.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
        doc.save(filename);
        
        // Show notification
        if (window.showToast) {
            window.showToast(`Invoice PDF downloaded: ${filename}`, 'success', {
                title: 'PDF Generated',
                duration: 4000
            });
        }
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        if (window.showToast) {
            window.showToast('Failed to generate PDF. Using print instead.', 'warning');
        }
        printInvoice();
    }
}

// Get company settings for invoice
function getCompanySettings() {
    // Try to get from localStorage or use defaults
    const settings = JSON.parse(localStorage.getItem('uba-company-settings') || '{}');
    
    return {
        name: settings.name || 'MHM Business Solutions',
        address: settings.address || '123 Business Street',
        city: settings.city || 'Amsterdam',
        postalCode: settings.postalCode || '1000 AB',
        country: settings.country || 'Netherlands',
        email: settings.email || 'info@mhmuba.com',
        phone: settings.phone || '+31 20 123 4567',
        bankName: settings.bankName || 'ABN AMRO Bank',
        bankAccount: settings.bankAccount || 'NL12 ABNA 0123 4567 89',
        paymentTerms: settings.paymentTerms || '30'
    };
}

// Get invoice print CSS
function getInvoicePrintCSS() {
    return `
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        
        .invoice-document {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }
        
        .invoice-company h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            color: #2c3e50;
        }
        
        .company-details p {
            margin: 3px 0;
            color: #666;
        }
        
        .invoice-meta h2 {
            margin: 0 0 15px 0;
            font-size: 24px;
            color: #e74c3c;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            min-width: 200px;
        }
        
        .label {
            font-weight: bold;
        }
        
        .value.status-paid { color: #27ae60; }
        .value.status-sent { color: #f39c12; }
        .value.status-draft { color: #95a5a6; }
        .value.status-overdue { color: #e74c3c; }
        
        .bill-to {
            margin: 30px 0;
        }
        
        .bill-to h3 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        
        .client-name {
            font-weight: bold;
            font-size: 16px;
        }
        
        .invoice-items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .invoice-items-table th,
        .invoice-items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .invoice-items-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .invoice-totals {
            margin: 30px 0;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            min-width: 300px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
        }
        
        .final-total {
            border-top: 2px solid #2c3e50;
            font-weight: bold;
            font-size: 18px;
            color: #2c3e50;
        }
        
        .invoice-footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        
        .invoice-footer > div {
            flex: 1;
            margin-right: 30px;
        }
        
        .invoice-footer h4 {
            color: #2c3e50;
            margin: 0 0 10px 0;
        }
        
        .invoice-footer p {
            margin: 5px 0;
            color: #666;
        }
        
        @media print {
            body { margin: 0; padding: 15px; }
            .invoice-header { page-break-after: avoid; }
            .invoice-totals { page-break-before: avoid; }
        }
    `;
}

async function deleteInvoice(id) {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.invoices) {
        console.error('❌ Store not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    let invoice = null;
    if (window.SupabaseStore) {
        invoice = await store.invoices.get(id);
    } else {
        invoice = store.invoices.getById ? store.invoices.getById(id) : store.invoices.get(id);
    }
    
    if (!invoice) {
        console.error('Invoice not found:', id);
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete the invoice for "${invoice.client}"?

This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        try {
            let success = false;
            if (window.SupabaseStore) {
                await store.invoices.delete(id);
                success = true;
            } else {
                success = store.invoices.delete(id);
            }
            
            if (success) {
                console.log('✅ Invoice deleted successfully');
                await renderInvoicesTable();
                await updateInvoiceMetrics();
            } else {
                alert('Failed to delete invoice');
            }
        } catch (error) {
            console.error('❌ Error deleting invoice:', error);
            alert('An error occurred while deleting the invoice');
        }
    }
}

async function renderInvoicesTable() {
    const tbody = document.getElementById('invoices-body');
    if (!tbody) {
        console.warn('❌ invoices-body element not found');
        return;
    }
    
    // Use Supabase store if available, otherwise fall back to localStorage
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.invoices) {
        console.warn('❌ Store not available');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span>Data store not available. Please check your setup.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    let allInvoices = [];
    if (window.SupabaseStore) {
        allInvoices = await store.invoices.getAll();
    } else {
        allInvoices = store.invoices.getAll();
    }
    
    if (!allInvoices || allInvoices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span data-i18n="mini.none">No invoices yet. Add your first one.</span>
                </td>
            </tr>
        `;
        return;
    }
    
    // Apply search filter
    const searchInput = document.getElementById('invoices-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    filteredInvoices = allInvoices.filter(invoice => {
        if (!searchTerm) return true;
        return (
            (invoice.client || '').toLowerCase().includes(searchTerm) ||
            (invoice.label || '').toLowerCase().includes(searchTerm) ||
            (invoice.status || '').toLowerCase().includes(searchTerm)
        );
    });
    
    // Apply sorting
    const sortSelect = document.getElementById('invoices-sort');
    const sortBy = sortSelect ? sortSelect.value : 'date_desc';
    
    filteredInvoices.sort((a, b) => {
        switch (sortBy) {
            case 'date_asc':
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            case 'date_desc':
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            case 'amount_asc':
                return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
            case 'amount_desc':
                return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
            case 'client_asc':
                return (a.client || '').localeCompare(b.client || '');
            case 'client_desc':
                return (b.client || '').localeCompare(a.client || '');
            case 'status':
                return (a.status || '').localeCompare(b.status || '');
            default:
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
    });
    
    // Get paged results
    const pagedInvoices = getPagedInvoices();
    
    if (pagedInvoices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <span>No invoices found matching your search.</span>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pagedInvoices.map(invoice => {
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
                                onclick="viewInvoice('${invoice.id}')"
                                title="View Invoice"
                            >
                                👁️
                            </button>
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
    
    // Update pagination controls
    updateInvoicesPagination();
}

function initInvoicesPagination() {
    // Add toolbar if it doesn't exist
    const table = document.getElementById("invoices-page-table");
    if (table && !document.getElementById('invoices-toolbar')) {
        addInvoicesToolbar();
    }
    
    // Add pagination container if it doesn't exist
    if (table && !document.getElementById('invoices-pagination')) {
        const paginationHtml = `
            <div id="invoices-pagination" class="uba-pagination">
                <button id="invoices-prev-page" class="uba-btn-ghost uba-btn-sm" disabled>Previous</button>
                <span id="invoices-page-info" class="uba-page-info">Page 1 of 1</span>
                <button id="invoices-next-page" class="uba-btn-ghost uba-btn-sm" disabled>Next</button>
            </div>
        `;
        table.parentElement.insertAdjacentHTML('afterend', paginationHtml);
        
        // Attach event listeners
        document.getElementById('invoices-prev-page').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderInvoicesTable();
            }
        });
        
        document.getElementById('invoices-next-page').addEventListener('click', () => {
            const totalPages = Math.ceil(filteredInvoices.length / pageSize);
            if (currentPage < totalPages) {
                currentPage++;
                renderInvoicesTable();
            }
        });
    }
}

function updateInvoicesPagination() {
    const totalPages = Math.ceil(filteredInvoices.length / pageSize);
    const prevBtn = document.getElementById('invoices-prev-page');
    const nextBtn = document.getElementById('invoices-next-page');
    const pageInfo = document.getElementById('invoices-page-info');
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${Math.max(1, totalPages)} (${filteredInvoices.length} total)`;
}

function getPagedInvoices() {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredInvoices.slice(startIndex, endIndex);
}

function addInvoicesToolbar() {
    const table = document.getElementById("invoices-page-table");
    if (!table) return;
    
    const toolbarHtml = `
        <div id="invoices-toolbar" class="uba-table-toolbar">
            <div class="uba-toolbar-left">
                <input type="text" id="invoices-search" placeholder="Search invoices..." class="uba-input uba-input-sm">
            </div>
            <div class="uba-toolbar-right">
                <select id="invoices-sort" class="uba-input uba-input-sm">
                    <option value="date_desc">Date (Newest)</option>
                    <option value="date_asc">Date (Oldest)</option>
                    <option value="amount_desc">Amount (High to Low)</option>
                    <option value="amount_asc">Amount (Low to High)</option>
                    <option value="client_asc">Client (A-Z)</option>
                    <option value="client_desc">Client (Z-A)</option>
                    <option value="status">Status</option>
                </select>
            </div>
        </div>
    `;
    
    table.parentElement.insertAdjacentHTML('beforebegin', toolbarHtml);
    
    // Attach event listeners
    const searchInput = document.getElementById('invoices-search');
    const sortSelect = document.getElementById('invoices-sort');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1; // Reset to first page on search
            renderInvoicesTable();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentPage = 1; // Reset to first page on sort
            renderInvoicesTable();
        });
    }
}

async function updateInvoiceMetrics() {
    const store = window.SupabaseStore || window.ubaStore;
    if (!store || !store.invoices) {
        console.warn('❌ Store not available for metrics');
        return;
    }
    
    let invoices = [];
    if (window.SupabaseStore) {
        invoices = await store.invoices.getAll() || [];
    } else {
        invoices = store.invoices.getAll() || [];
    }
    
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

// Verification function to test all connections (sanitized strings)
window.verifyInvoicesSetup = function verifyInvoicesSetup() {
    console.log('🔍 VERIFYING INVOICES SETUP...');

    const elements = [
        'new-invoice-btn',
        'save-invoice-btn',
        'invoice-form',
        'invoices-body',
        'invoice-modal',
        'invoice-client',
        'invoice-amount',
        'invoice-status'
    ];
    console.log('1️⃣ Checking HTML elements:');
    elements.forEach((id) => {
        const el = document.getElementById(id);
        console.log(`   ${el ? '✅' : '❌'} ${id}: ${el ? 'Found' : 'MISSING'}`);
    });

    console.log('\n2️⃣ Checking global functions:');
    const functions = [
        'initInvoicesPage',
        'openInvoiceModal',
        'closeInvoiceModal',
        'editInvoice',
        'deleteInvoice'
    ];
    functions.forEach((fn) => {
        const exists = typeof window[fn] === 'function';
        console.log(`   ${exists ? '✅' : '❌'} ${fn}: ${exists ? 'Available' : 'MISSING'}`);
    });

    console.log('\n3️⃣ Checking data store:');
    const hasUbaStore = !!window.ubaStore;
    console.log(`   ${hasUbaStore ? '✅' : '❌'} window.ubaStore: ${hasUbaStore ? 'Available' : 'MISSING'}`);
    if (hasUbaStore) {
        const hasInvoices = !!window.ubaStore.invoices;
        console.log(`   ${hasInvoices ? '✅' : '❌'} ubaStore.invoices: ${hasInvoices ? 'Available' : 'MISSING'}`);
        if (hasInvoices) {
            const methods = ['getAll', 'getById', 'create', 'update', 'delete'];
            methods.forEach((method) => {
                const exists = typeof window.ubaStore.invoices[method] === 'function';
                console.log(`   ${exists ? '✅' : '❌'} invoices.${method}: ${exists ? 'Available' : 'MISSING'}`);
            });
        }
    }

    console.log('\n4️⃣ Testing modal functionality:');
    try {
        const modal = document.getElementById('invoice-modal');
        if (modal) {
            openInvoiceModal();
            const isVisible = modal.style.display === 'flex';
            console.log(`   ${isVisible ? '✅' : '❌'} Modal opens: ${isVisible ? 'Success' : 'Failed'}`);
            closeInvoiceModal();
            const isHidden = modal.style.display === 'none';
            console.log(`   ${isHidden ? '✅' : '❌'} Modal closes: ${isHidden ? 'Success' : 'Failed'}`);
        } else {
            console.log('   ❌ Modal element not found');
        }
    } catch (error) {
        console.log('   ❌ Modal test failed:', error.message);
    }

    console.log('\n5️⃣ Testing data operations:');
    if (window.ubaStore && window.ubaStore.invoices) {
        try {
            const testInvoice = {
                client: 'Test Client',
                amount: 100,
                status: 'draft',
                label: 'Test Invoice'
            };
            const created = window.ubaStore.invoices.create(testInvoice);
            const createSuccess = !!created && !!created.id;
            console.log(`   ${createSuccess ? '✅' : '❌'} Create: ${createSuccess ? 'Success' : 'Failed'}`);
            if (createSuccess) {
                const retrieved = window.ubaStore.invoices.getById(created.id);
                const readSuccess = !!retrieved && retrieved.client === 'Test Client';
                console.log(`   ${readSuccess ? '✅' : '❌'} Read: ${readSuccess ? 'Success' : 'Failed'}`);
                const updated = window.ubaStore.invoices.update(created.id, { amount: 200 });
                const updateSuccess = !!updated && updated.amount === 200;
                console.log(`   ${updateSuccess ? '✅' : '❌'} Update: ${updateSuccess ? 'Success' : 'Failed'}`);
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

// Make functions available globally for HTML onclick handlers
window.viewInvoice = viewInvoice;
window.closeInvoiceViewModal = closeInvoiceViewModal;
window.printInvoice = printInvoice;
window.downloadInvoicePDF = downloadInvoicePDF;
