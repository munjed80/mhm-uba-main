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
                
                // Trigger automations for invoice update
                const updatedInvoice = window.ubaStore.invoices.getById(editInvoiceId);
                if (updatedInvoice && typeof window.runAutomations === 'function') {
                    // Check for overdue status
                    if (updatedInvoice.status === 'overdue') {
                        window.runAutomations('invoice_overdue', { invoice: updatedInvoice });
                    }
                }
                
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
                
                // Trigger automations for new invoice
                if (typeof window.runAutomations === 'function') {
                    window.runAutomations('invoice_created', { invoice: newInvoice });
                    
                    // Also check if it's already overdue
                    if (newInvoice.status === 'overdue') {
                        window.runAutomations('invoice_overdue', { invoice: newInvoice });
                    }
                }
                
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

// View invoice in detailed modal
function viewInvoice(id) {
    console.log('👁️ Viewing invoice:', id);
    
    if (!window.ubaStore || !window.ubaStore.invoices) {
        console.error('❌ ubaStore.invoices not available');
        alert('Data store not available. Please refresh the page.');
        return;
    }
    
    const invoice = window.ubaStore.invoices.getById(id);
    if (invoice) {
        openInvoiceViewModal(invoice);
    } else {
        console.error('❌ Invoice not found:', id);
        alert('Invoice not found. The table will be refreshed.');
        renderInvoicesTable();
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

// Make functions available globally for HTML onclick handlers
window.viewInvoice = viewInvoice;
window.closeInvoiceViewModal = closeInvoiceViewModal;
window.printInvoice = printInvoice;
window.downloadInvoicePDF = downloadInvoicePDF;
