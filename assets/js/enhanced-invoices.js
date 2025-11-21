// enhanced-invoices.js - Comprehensive invoice enhancements with PDF export, monthly grouping, preview, templates, and auto client linking
(function() {
  'use strict';
  
  /**
   * Enhanced Invoices System - Main Module
   * Features: PDF export, Monthly grouping, Invoice preview, Template system, Auto client linking
   */
  window.UBAEnhancedInvoices = {
    
    // State management
    currentInvoice: null,
    templates: {},
    brandingSettings: {},
    clientList: [],
    
    /**
     * Initialize enhanced invoice system
     */
    init() {
      console.log('🧾 Initializing Enhanced Invoice System');
      
      this.loadBrandingSettings();
      this.loadInvoiceTemplates();
      this.setupMonthlyGrouping();
      this.setupInvoicePreview();
      this.setupAutoClientLinking();
      this.setupPDFExport();
      this.enhanceInvoiceModal();
      
      console.log('✅ Enhanced Invoice System initialized');
    },
    
    /**
     * Load branding settings from localStorage
     */
    loadBrandingSettings() {
      try {
        const settings = localStorage.getItem('uba-invoice-branding');
        this.brandingSettings = settings ? JSON.parse(settings) : this.getDefaultBrandingSettings();
        console.log('✅ Branding settings loaded');
      } catch (error) {
        console.warn('⚠️ Failed to load branding settings:', error);
        this.brandingSettings = this.getDefaultBrandingSettings();
      }
    },
    
    /**
     * Get default branding settings
     */
    getDefaultBrandingSettings() {
      return {
        companyName: 'MHM Business Solutions',
        companyAddress: '123 Business Avenue',
        companyCity: 'Amsterdam',
        companyCountry: 'Netherlands',
        companyPhone: '+31 20 123 4567',
        companyEmail: 'info@mhmuba.com',
        companyWebsite: 'www.mhmuba.com',
        logoUrl: '',
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        accentColor: '#0f172a',
        fontFamily: 'Arial, sans-serif',
        headerStyle: 'modern',
        footerText: 'Thank you for your business!',
        paymentTerms: '30 days',
        bankDetails: {
          bankName: 'ABN AMRO Bank',
          accountNumber: 'NL12 ABNA 0123 4567 89',
          swiftCode: 'ABNANL2A'
        }
      };
    },
    
    /**
     * Save branding settings
     */
    saveBrandingSettings(settings) {
      try {
        this.brandingSettings = { ...this.brandingSettings, ...settings };
        localStorage.setItem('uba-invoice-branding', JSON.stringify(this.brandingSettings));
        console.log('✅ Branding settings saved');
        this.updateTemplatesWithBranding();
      } catch (error) {
        console.error('❌ Failed to save branding settings:', error);
      }
    },
    
    /**
     * Load invoice templates
     */
    loadInvoiceTemplates() {
      try {
        const templates = localStorage.getItem('uba-invoice-templates');
        this.templates = templates ? JSON.parse(templates) : this.getDefaultTemplates();
        console.log('✅ Invoice templates loaded');
      } catch (error) {
        console.warn('⚠️ Failed to load templates:', error);
        this.templates = this.getDefaultTemplates();
      }
    },
    
    /**
     * Get default invoice templates
     */
    getDefaultTemplates() {
      return {
        modern: {
          id: 'modern',
          name: 'Modern Professional',
          description: 'Clean, modern design with professional layout',
          headerStyle: 'modern',
          colorScheme: 'blue',
          layoutStyle: 'standard'
        },
        classic: {
          id: 'classic',
          name: 'Classic Business',
          description: 'Traditional business invoice layout',
          headerStyle: 'classic',
          colorScheme: 'gray',
          layoutStyle: 'traditional'
        },
        creative: {
          id: 'creative',
          name: 'Creative Design',
          description: 'Colorful and creative layout for design agencies',
          headerStyle: 'creative',
          colorScheme: 'colorful',
          layoutStyle: 'creative'
        }
      };
    },
    
    /**
     * Update templates with current branding
     */
    updateTemplatesWithBranding() {
      // Apply branding to all templates
      Object.keys(this.templates).forEach(templateId => {
        this.templates[templateId].branding = this.brandingSettings;
      });
    },
    
    /**
     * Setup monthly grouping functionality
     */
    setupMonthlyGrouping() {
      console.log('📅 Setting up monthly invoice grouping');
      
      // Add monthly view toggle to invoice page
      const invoicesCard = document.getElementById('invoices-page');
      if (invoicesCard) {
        const header = invoicesCard.querySelector('.uba-card-header');
        if (header) {
          // Add view toggle buttons
          const viewToggle = document.createElement('div');
          viewToggle.className = 'invoice-view-toggle';
          viewToggle.innerHTML = `
            <div class=\"uba-btn-group\">
              <button class=\"uba-btn uba-btn-sm invoice-view-btn active\" data-view=\"list\">
                📋 List View
              </button>
              <button class=\"uba-btn uba-btn-sm invoice-view-btn\" data-view=\"monthly\">
                📅 Monthly View
              </button>
            </div>
          `;
          
          // Insert before new invoice button
          const newInvoiceBtn = header.querySelector('#new-invoice-btn');
          if (newInvoiceBtn) {
            newInvoiceBtn.parentNode.insertBefore(viewToggle, newInvoiceBtn);
          }
          
          // Attach event listeners
          viewToggle.querySelectorAll('.invoice-view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchInvoiceView(btn.dataset.view));
          });
        }
      }
      
      // Create monthly view container
      this.createMonthlyViewContainer();
    },
    
    /**
     * Create monthly view container
     */
    createMonthlyViewContainer() {
      const invoicesPage = document.getElementById('invoices-page');
      if (!invoicesPage) return;
      
      const monthlyView = document.createElement('div');
      monthlyView.id = 'monthly-invoices-view';
      monthlyView.className = 'monthly-invoices-container hidden';
      monthlyView.innerHTML = `
        <div class=\"monthly-header\">
          <div class=\"monthly-controls\">
            <button class=\"uba-btn uba-btn-ghost\" id=\"prev-month\">‹ Previous</button>
            <h3 id=\"current-month-title\">Current Month</h3>
            <button class=\"uba-btn uba-btn-ghost\" id=\"next-month\">Next ›</button>
          </div>
          <div class=\"monthly-stats\">
            <div class=\"stat-item\">
              <span class=\"stat-value\" id=\"month-total-amount\">€0</span>
              <span class=\"stat-label\">Total Amount</span>
            </div>
            <div class=\"stat-item\">
              <span class=\"stat-value\" id=\"month-invoice-count\">0</span>
              <span class=\"stat-label\">Invoices</span>
            </div>
            <div class=\"stat-item\">
              <span class=\"stat-value\" id=\"month-paid-count\">0</span>
              <span class=\"stat-label\">Paid</span>
            </div>
          </div>
        </div>
        <div id=\"monthly-invoices-list\" class=\"monthly-invoices-list\">
          <!-- Monthly grouped invoices will be rendered here -->
        </div>
      `;
      
      // Insert after the regular table
      const tableWrap = invoicesPage.querySelector('.uba-table-wrap');
      if (tableWrap) {
        tableWrap.parentNode.insertBefore(monthlyView, tableWrap.nextSibling);
      }
      
      // Setup monthly navigation
      this.setupMonthlyNavigation();
    },
    
    /**
     * Setup monthly navigation
     */
    setupMonthlyNavigation() {
      this.currentMonthDate = new Date();
      
      const prevBtn = document.getElementById('prev-month');
      const nextBtn = document.getElementById('next-month');
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() - 1);
          this.renderMonthlyView();
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() + 1);
          this.renderMonthlyView();
        });
      }
    },
    
    /**
     * Switch between list and monthly view
     */
    switchInvoiceView(viewType) {
      // Update button states
      document.querySelectorAll('.invoice-view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewType);
      });
      
      const listView = document.querySelector('.uba-table-wrap');
      const monthlyView = document.getElementById('monthly-invoices-view');
      
      if (viewType === 'monthly') {
        listView?.classList.add('hidden');
        monthlyView?.classList.remove('hidden');
        this.renderMonthlyView();
      } else {
        listView?.classList.remove('hidden');
        monthlyView?.classList.add('hidden');
      }
    },
    
    /**
     * Render monthly invoice view
     */
    renderMonthlyView() {
      if (!window.ubaStore?.invoices) return;
      
      const invoices = window.ubaStore.invoices.getAll();
      const currentMonth = this.currentMonthDate.getMonth();
      const currentYear = this.currentMonthDate.getFullYear();
      
      // Filter invoices for current month
      const monthlyInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.created_at);
        return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      });
      
      // Update month title
      const monthTitle = document.getElementById('current-month-title');
      if (monthTitle) {
        const monthName = this.currentMonthDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });
        monthTitle.textContent = monthName;
      }
      
      // Calculate statistics
      const totalAmount = monthlyInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
      const paidInvoices = monthlyInvoices.filter(inv => inv.status === 'paid');
      
      // Update statistics
      this.updateElement('month-total-amount', this.formatAmount(totalAmount));
      this.updateElement('month-invoice-count', monthlyInvoices.length);
      this.updateElement('month-paid-count', paidInvoices.length);
      
      // Render invoice list
      const listContainer = document.getElementById('monthly-invoices-list');
      if (listContainer) {
        if (monthlyInvoices.length === 0) {
          listContainer.innerHTML = `
            <div class=\"empty-month\">
              <p>No invoices found for ${monthTitle?.textContent}</p>
            </div>
          `;
        } else {
          listContainer.innerHTML = this.renderMonthlyInvoicesList(monthlyInvoices);
        }
      }
    },
    
    /**
     * Render monthly invoices list HTML
     */
    renderMonthlyInvoicesList(invoices) {
      return `
        <div class=\"monthly-invoices-grid\">
          ${invoices.map(invoice => `
            <div class=\"monthly-invoice-card\">
              <div class=\"invoice-card-header\">
                <div class=\"invoice-info\">
                  <h4>${this.escapeHtml(invoice.client)}</h4>
                  <p class=\"invoice-label\">${this.escapeHtml(invoice.label || 'Invoice')}</p>
                </div>
                <div class=\"invoice-amount\">
                  <span class=\"amount\">${this.formatAmount(invoice.amount)}</span>
                  <span class=\"status status-${invoice.status}\">${this.capitalizeFirst(invoice.status)}</span>
                </div>
              </div>
              <div class=\"invoice-card-meta\">
                <span class=\"invoice-date\">Created: ${this.formatDate(invoice.created_at)}</span>
                ${invoice.due ? `<span class=\"invoice-due\">Due: ${this.formatDate(invoice.due)}</span>` : ''}
              </div>
              <div class=\"invoice-card-actions\">
                <button class=\"uba-btn uba-btn-sm uba-btn-ghost\" onclick=\"window.UBAEnhancedInvoices.previewInvoice('${invoice.id}')\">
                  👁️ Preview
                </button>
                <button class=\"uba-btn uba-btn-sm uba-btn-ghost\" onclick=\"window.UBAEnhancedInvoices.exportToPDF('${invoice.id}')\">
                  📄 PDF
                </button>
                <button class=\"uba-btn uba-btn-sm uba-btn-ghost\" onclick=\"editInvoice('${invoice.id}')\">
                  ✏️ Edit
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },
    
    /**
     * Setup invoice preview functionality
     */
    setupInvoicePreview() {
      console.log('👁️ Setting up invoice preview');
      
      // Create preview modal
      this.createInvoicePreviewModal();
      
      // Add preview button to invoice form
      this.addPreviewButtonToForm();
    },
    
    /**
     * Create invoice preview modal
     */
    createInvoicePreviewModal() {
      const previewModal = document.createElement('div');
      previewModal.id = 'invoice-preview-modal';
      previewModal.className = 'uba-modal invoice-preview-modal';
      previewModal.innerHTML = `
        <div class=\"uba-modal-overlay\" onclick=\"window.UBAEnhancedInvoices.closePreview()\"></div>
        <div class=\"uba-modal-dialog invoice-preview-dialog\">
          <div class=\"uba-modal-header\">
            <h3>Invoice Preview</h3>
            <div class=\"preview-actions\">
              <button class=\"uba-btn uba-btn-ghost\" onclick=\"window.UBAEnhancedInvoices.exportToPDF()\">
                📄 Export PDF
              </button>
              <button class=\"uba-btn uba-btn-primary\" onclick=\"window.UBAEnhancedInvoices.saveFromPreview()\">
                💾 Save Invoice
              </button>
              <button class=\"uba-modal-close\" onclick=\"window.UBAEnhancedInvoices.closePreview()\">×</button>
            </div>
          </div>
          <div class=\"uba-modal-body preview-body\">
            <div id=\"invoice-preview-content\" class=\"invoice-preview-content\">
              <!-- Preview content will be rendered here -->
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(previewModal);
    },
    
    /**
     * Add preview button to invoice form
     */
    addPreviewButtonToForm() {
      const saveBtn = document.getElementById('save-invoice-btn');
      if (saveBtn) {
        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'uba-btn uba-btn-ghost';
        previewBtn.innerHTML = '<span>👁️ Preview</span>';
        previewBtn.onclick = () => this.showInvoicePreview();
        
        // Insert before save button
        saveBtn.parentNode.insertBefore(previewBtn, saveBtn);
      }
    },
    
    /**
     * Show invoice preview
     */
    showInvoicePreview(invoiceId = null) {
      let invoiceData;
      
      if (invoiceId) {
        // Preview existing invoice
        invoiceData = window.ubaStore?.invoices?.getById(invoiceId);
        if (!invoiceData) {
          console.error('Invoice not found:', invoiceId);
          return;
        }
      } else {
        // Preview current form data
        invoiceData = this.getFormData();
        if (!this.validateFormData(invoiceData)) {
          return;
        }
      }
      
      this.currentInvoice = invoiceData;
      
      // Render preview content
      const previewContent = document.getElementById('invoice-preview-content');
      if (previewContent) {
        previewContent.innerHTML = this.generateInvoiceHTML(invoiceData);
      }
      
      // Show modal
      const modal = document.getElementById('invoice-preview-modal');
      if (modal) {
        modal.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
      }
    },
    
    /**
     * Get form data for preview
     */
    getFormData() {
      return {
        id: document.getElementById('invoice-edit-id')?.value || 'preview-' + Date.now(),
        client: document.getElementById('invoice-client')?.value || '',
        label: document.getElementById('invoice-label')?.value || '',
        amount: parseFloat(document.getElementById('invoice-amount')?.value) || 0,
        status: document.getElementById('invoice-status')?.value || 'draft',
        due: document.getElementById('invoice-due')?.value || '',
        notes: document.getElementById('invoice-notes')?.value || '',
        created_at: new Date().toISOString()
      };
    },
    
    /**
     * Validate form data
     */
    validateFormData(data) {
      if (!data.client.trim()) {
        this.showNotification('Client name is required', 'error');
        return false;
      }
      if (!data.amount || data.amount <= 0) {
        this.showNotification('Valid amount is required', 'error');
        return false;
      }
      return true;
    },
    
    /**
     * Close preview modal
     */
    closePreview() {
      const modal = document.getElementById('invoice-preview-modal');
      if (modal) {
        modal.classList.remove('is-visible');
        document.body.style.overflow = '';
      }
      this.currentInvoice = null;
    },
    
    /**
     * Save invoice from preview
     */
    saveFromPreview() {
      if (this.currentInvoice) {
        // If it's a preview of form data, trigger normal save
        if (this.currentInvoice.id.startsWith('preview-')) {
          this.closePreview();
          // Trigger the normal save process
          const saveBtn = document.getElementById('save-invoice-btn');
          if (saveBtn) {
            saveBtn.click();
          }
        } else {
          // Already saved invoice, just close preview
          this.closePreview();
        }
      }
    },
    
    /**
     * Generate invoice HTML for preview/PDF
     */
    generateInvoiceHTML(invoice, template = 'modern') {
      const settings = this.brandingSettings;
      const invoiceNumber = invoice.id.replace(/^(inv-|preview-)/, 'INV-');
      const issueDate = this.formatDate(invoice.created_at);
      const dueDate = this.formatDate(invoice.due);
      
      return `
        <div class=\"invoice-document template-${template}\">
          ${this.generateInvoiceHeader(settings, invoice, invoiceNumber, issueDate, dueDate)}
          ${this.generateBillToSection(invoice)}
          ${this.generateInvoiceItems(invoice)}
          ${this.generateInvoiceTotals(invoice)}
          ${this.generateInvoiceFooter(settings, invoiceNumber)}
        </div>
      `;
    },
    
    /**
     * Generate invoice header
     */
    generateInvoiceHeader(settings, invoice, invoiceNumber, issueDate, dueDate) {
      return `
        <div class=\"invoice-header\">
          <div class=\"company-info\">
            ${settings.logoUrl ? `<img src=\"${settings.logoUrl}\" alt=\"Company Logo\" class=\"company-logo\" />` : ''}
            <h1 style=\"color: ${settings.primaryColor}\">${settings.companyName}</h1>
            <div class=\"company-details\">
              <p>${settings.companyAddress}</p>
              <p>${settings.companyCity}, ${settings.companyCountry}</p>
              <p>Phone: ${settings.companyPhone}</p>
              <p>Email: ${settings.companyEmail}</p>
              ${settings.companyWebsite ? `<p>Web: ${settings.companyWebsite}</p>` : ''}
            </div>
          </div>
          <div class=\"invoice-details\">
            <h2 style=\"color: ${settings.accentColor}\">INVOICE</h2>
            <div class=\"invoice-meta\">
              <div class=\"meta-row\">
                <span class=\"label\">Invoice #:</span>
                <span class=\"value\">${invoiceNumber}</span>
              </div>
              <div class=\"meta-row\">
                <span class=\"label\">Date:</span>
                <span class=\"value\">${issueDate}</span>
              </div>
              <div class=\"meta-row\">
                <span class=\"label\">Due Date:</span>
                <span class=\"value\">${dueDate}</span>
              </div>
              <div class=\"meta-row\">
                <span class=\"label\">Status:</span>
                <span class=\"value status-${invoice.status}\">${this.capitalizeFirst(invoice.status)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    
    /**
     * Generate bill to section
     */
    generateBillToSection(invoice) {
      return `
        <div class=\"bill-to-section\">
          <h3>Bill To:</h3>
          <div class=\"client-info\">
            <p class=\"client-name\">${this.escapeHtml(invoice.client)}</p>
          </div>
        </div>
      `;
    },
    
    /**
     * Generate invoice items
     */
    generateInvoiceItems(invoice) {
      return `
        <div class=\"invoice-items\">
          <table class=\"items-table\">
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
                  <strong>${this.escapeHtml(invoice.label || 'Service')}</strong>
                  ${invoice.notes ? `<br><small>${this.escapeHtml(invoice.notes)}</small>` : ''}
                </td>
                <td>1</td>
                <td>${this.formatAmount(invoice.amount)}</td>
                <td>${this.formatAmount(invoice.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    },
    
    /**
     * Generate invoice totals
     */
    generateInvoiceTotals(invoice) {
      const amount = parseFloat(invoice.amount) || 0;
      const tax = 0; // No tax for now
      const total = amount + tax;
      
      return `
        <div class=\"invoice-totals\">
          <div class=\"totals-section\">
            <div class=\"total-row\">
              <span class=\"label\">Subtotal:</span>
              <span class=\"value\">${this.formatAmount(amount)}</span>
            </div>
            <div class=\"total-row\">
              <span class=\"label\">Tax:</span>
              <span class=\"value\">${this.formatAmount(tax)}</span>
            </div>
            <div class=\"total-row final-total\">
              <span class=\"label\">Total:</span>
              <span class=\"value\">${this.formatAmount(total)}</span>
            </div>
          </div>
        </div>
      `;
    },
    
    /**
     * Generate invoice footer
     */
    generateInvoiceFooter(settings, invoiceNumber) {
      return `
        <div class=\"invoice-footer\">
          <div class=\"payment-info\">
            <h4>Payment Information</h4>
            <p><strong>Bank:</strong> ${settings.bankDetails.bankName}</p>
            <p><strong>Account:</strong> ${settings.bankDetails.accountNumber}</p>
            <p><strong>Swift:</strong> ${settings.bankDetails.swiftCode}</p>
            <p><strong>Reference:</strong> ${invoiceNumber}</p>
          </div>
          <div class=\"terms\">
            <h4>Payment Terms</h4>
            <p>Payment due within ${settings.paymentTerms} from invoice date.</p>
            <p>${settings.footerText}</p>
          </div>
        </div>
      `;
    },
    
    /**
     * Setup auto client linking
     */
    setupAutoClientLinking() {
      console.log('🔗 Setting up auto client linking');
      
      const clientInput = document.getElementById('invoice-client');
      if (!clientInput) return;
      
      // Replace text input with searchable dropdown
      this.createClientDropdown(clientInput);
    },
    
    /**
     * Create client dropdown with search
     */
    createClientDropdown(originalInput) {
      // Create container
      const container = document.createElement('div');
      container.className = 'client-dropdown-container';
      
      // Create searchable input
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.id = 'invoice-client-search';
      searchInput.className = 'uba-input client-search-input';
      searchInput.placeholder = 'Search or add new client...';
      searchInput.value = originalInput.value;
      
      // Create dropdown list
      const dropdown = document.createElement('div');
      dropdown.className = 'client-dropdown-list';
      dropdown.id = 'client-dropdown-list';
      
      // Assemble container
      container.appendChild(searchInput);
      container.appendChild(dropdown);
      
      // Replace original input
      originalInput.parentNode.insertBefore(container, originalInput);
      originalInput.style.display = 'none';
      
      // Setup event listeners
      this.setupClientDropdownEvents(searchInput, dropdown, originalInput);
      
      // Load initial client list
      this.updateClientList();
    },
    
    /**
     * Setup client dropdown events
     */
    setupClientDropdownEvents(searchInput, dropdown, hiddenInput) {
      let isDropdownOpen = false;
      
      // Search input events
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        this.filterClientDropdown(query);
        hiddenInput.value = e.target.value;
        
        if (!isDropdownOpen) {
          this.showClientDropdown();
          isDropdownOpen = true;
        }
      });
      
      searchInput.addEventListener('focus', () => {
        this.showClientDropdown();
        isDropdownOpen = true;
      });
      
      searchInput.addEventListener('blur', () => {
        // Delay hiding to allow clicks on dropdown items
        setTimeout(() => {
          this.hideClientDropdown();
          isDropdownOpen = false;
        }, 200);
      });
      
      // Click outside to close
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.client-dropdown-container')) {
          this.hideClientDropdown();
          isDropdownOpen = false;
        }
      });
    },
    
    /**
     * Update client list from store
     */
    updateClientList() {
      if (window.ubaStore?.clients) {
        this.clientList = window.ubaStore.clients.getAll() || [];
      } else {
        // Fallback: extract clients from invoices
        const invoices = window.ubaStore?.invoices?.getAll() || [];
        const clientNames = [...new Set(invoices.map(inv => inv.client).filter(Boolean))];
        this.clientList = clientNames.map(name => ({ name, id: name.toLowerCase().replace(/\\s+/g, '-') }));
      }
      
      this.renderClientDropdown();
    },
    
    /**
     * Render client dropdown
     */
    renderClientDropdown() {
      const dropdown = document.getElementById('client-dropdown-list');
      if (!dropdown) return;
      
      if (this.clientList.length === 0) {
        dropdown.innerHTML = `
          <div class=\"dropdown-item dropdown-empty\">
            <span>No clients found</span>
          </div>
        `;
        return;
      }
      
      dropdown.innerHTML = this.clientList.map(client => `
        <div class=\"dropdown-item\" data-client-name=\"${this.escapeHtml(client.name || client.id)}\">
          <span class=\"client-name\">${this.escapeHtml(client.name || client.id)}</span>
          ${client.email ? `<small class=\"client-email\">${this.escapeHtml(client.email)}</small>` : ''}
        </div>
      `).join('');
      
      // Attach click events
      dropdown.querySelectorAll('.dropdown-item[data-client-name]').forEach(item => {
        item.addEventListener('click', () => {
          const clientName = item.dataset.clientName;
          this.selectClient(clientName);
        });
      });
    },
    
    /**
     * Filter client dropdown
     */
    filterClientDropdown(query) {
      const dropdown = document.getElementById('client-dropdown-list');
      if (!dropdown) return;
      
      const items = dropdown.querySelectorAll('.dropdown-item[data-client-name]');
      let visibleCount = 0;
      
      items.forEach(item => {
        const clientName = item.dataset.clientName.toLowerCase();
        const isVisible = clientName.includes(query);
        item.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
      });
      
      // Show \"Add new client\" option if no matches and query is not empty
      if (visibleCount === 0 && query.trim()) {
        const addNewItem = dropdown.querySelector('.dropdown-add-new');
        if (!addNewItem) {
          const newItem = document.createElement('div');
          newItem.className = 'dropdown-item dropdown-add-new';
          newItem.innerHTML = `
            <span class=\"add-new-text\">➕ Add \"${this.escapeHtml(query)}\" as new client</span>
          `;
          newItem.addEventListener('click', () => {
            this.selectClient(query);
          });
          dropdown.appendChild(newItem);
        } else {
          addNewItem.innerHTML = `
            <span class=\"add-new-text\">➕ Add \"${this.escapeHtml(query)}\" as new client</span>
          `;
          addNewItem.style.display = 'block';
        }
      } else {
        const addNewItem = dropdown.querySelector('.dropdown-add-new');
        if (addNewItem) {
          addNewItem.style.display = 'none';
        }
      }
    },
    
    /**
     * Select client from dropdown
     */
    selectClient(clientName) {
      const searchInput = document.getElementById('invoice-client-search');
      const hiddenInput = document.getElementById('invoice-client');
      
      if (searchInput) searchInput.value = clientName;
      if (hiddenInput) hiddenInput.value = clientName;
      
      this.hideClientDropdown();
    },
    
    /**
     * Show client dropdown
     */
    showClientDropdown() {
      const dropdown = document.getElementById('client-dropdown-list');
      if (dropdown) {
        dropdown.classList.add('visible');
      }
    },
    
    /**
     * Hide client dropdown
     */
    hideClientDropdown() {
      const dropdown = document.getElementById('client-dropdown-list');
      if (dropdown) {
        dropdown.classList.remove('visible');
      }
    },
    
    /**
     * Setup PDF export functionality
     */
    setupPDFExport() {
      console.log('📄 Setting up PDF export functionality');
      
      // Add export buttons to invoice actions
      this.enhanceInvoiceActions();
    },
    
    /**
     * Enhance invoice actions with PDF export
     */
    enhanceInvoiceActions() {
      // This will be called after the table is rendered
      // We'll add export buttons dynamically
    },
    
    /**
     * Export invoice to PDF
     */
    async exportToPDF(invoiceId = null) {
      try {
        let invoice;
        
        if (invoiceId) {
          invoice = window.ubaStore?.invoices?.getById(invoiceId);
          if (!invoice) {
            this.showNotification('Invoice not found', 'error');
            return;
          }
        } else {
          // Export current preview
          invoice = this.currentInvoice;
          if (!invoice) {
            this.showNotification('No invoice to export', 'error');
            return;
          }
        }
        
        // Load jsPDF if not already loaded
        await this.loadJSPDF();
        
        // Generate PDF
        this.generatePDF(invoice);
        
      } catch (error) {
        console.error('❌ Error exporting PDF:', error);
        this.showNotification('Failed to export PDF', 'error');
      }
    },
    
    /**
     * Load jsPDF library
     */
    async loadJSPDF() {
      if (window.jsPDF) return;
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
          if (window.jsPDF) {
            resolve();
          } else {
            reject(new Error('jsPDF failed to initialize'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(script);
      });
    },
    
    /**
     * Generate PDF document
     */
    generatePDF(invoice) {
      const { jsPDF } = window.jsPDF;
      const doc = new jsPDF('p', 'mm', 'a4');
      const settings = this.brandingSettings;
      
      // Set up fonts
      doc.setFont('helvetica');
      
      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      let yPos = margin;
      
      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(settings.primaryColor || '#2563eb');
      doc.text(settings.companyName, margin, yPos);
      
      yPos += 15;
      
      // Company details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(settings.companyAddress, margin, yPos);
      yPos += 5;
      doc.text(`${settings.companyCity}, ${settings.companyCountry}`, margin, yPos);
      yPos += 5;
      doc.text(`Phone: ${settings.companyPhone}`, margin, yPos);
      yPos += 5;
      doc.text(`Email: ${settings.companyEmail}`, margin, yPos);
      
      // Invoice title and details (right side)
      const rightX = pageWidth - 80;
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('INVOICE', rightX, margin + 10);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const invoiceNumber = invoice.id.replace(/^(inv-|preview-)/, 'INV-');
      doc.text(`Invoice #: ${invoiceNumber}`, rightX, margin + 20);
      doc.text(`Date: ${this.formatDate(invoice.created_at)}`, rightX, margin + 25);
      doc.text(`Due: ${this.formatDate(invoice.due)}`, rightX, margin + 30);
      doc.text(`Status: ${this.capitalizeFirst(invoice.status)}`, rightX, margin + 35);
      
      yPos = margin + 50;
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      // Bill To
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('Bill To:', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.client, margin, yPos);
      yPos += 20;
      
      // Items table header
      const tableY = yPos;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      
      doc.text('Description', margin, tableY);
      doc.text('Qty', pageWidth - 80, tableY);
      doc.text('Rate', pageWidth - 60, tableY);
      doc.text('Amount', pageWidth - 40, tableY);
      
      // Table header line
      doc.setDrawColor(150, 150, 150);
      doc.line(margin, tableY + 2, pageWidth - margin, tableY + 2);
      
      yPos = tableY + 10;
      
      // Items
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.label || 'Service', margin, yPos);
      doc.text('1', pageWidth - 80, yPos);
      doc.text(this.formatAmount(invoice.amount), pageWidth - 60, yPos);
      doc.text(this.formatAmount(invoice.amount), pageWidth - 40, yPos);
      
      yPos += 20;
      
      // Totals
      const totalsX = pageWidth - 80;
      doc.setDrawColor(100, 100, 100);
      doc.line(totalsX, yPos, pageWidth - margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', totalsX, yPos);
      doc.text(this.formatAmount(invoice.amount), pageWidth - 40, yPos);
      yPos += 6;
      
      doc.text('Tax:', totalsX, yPos);
      doc.text('€0.00', pageWidth - 40, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total:', totalsX, yPos);
      doc.text(this.formatAmount(invoice.amount), pageWidth - 40, yPos);
      
      yPos += 30;
      
      // Payment information
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Information:', margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Bank: ${settings.bankDetails.bankName}`, margin, yPos);
      yPos += 5;
      doc.text(`Account: ${settings.bankDetails.accountNumber}`, margin, yPos);
      yPos += 5;
      doc.text(`Swift: ${settings.bankDetails.swiftCode}`, margin, yPos);
      yPos += 5;
      doc.text(`Reference: ${invoiceNumber}`, margin, yPos);
      yPos += 15;
      
      // Terms
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Terms:', margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Payment due within ${settings.paymentTerms} from invoice date.`, margin, yPos);
      yPos += 5;
      doc.text(settings.footerText, margin, yPos);
      
      // Save PDF
      const filename = `invoice-${invoiceNumber.toLowerCase()}-${invoice.client.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
      doc.save(filename);
      
      this.showNotification(`PDF saved: ${filename}`, 'success');
    },
    
    /**
     * Enhance invoice modal with new features
     */
    enhanceInvoiceModal() {
      // Add template selector to modal
      this.addTemplateSelector();
      
      // Add branding settings button
      this.addBrandingButton();
    },
    
    /**
     * Add template selector to modal
     */
    addTemplateSelector() {
      const notesGroup = document.querySelector('#invoice-modal .uba-form-group:last-child');
      if (!notesGroup) return;
      
      const templateGroup = document.createElement('div');
      templateGroup.className = 'uba-form-group';
      templateGroup.innerHTML = `
        <label for=\"invoice-template\">Invoice Template</label>
        <select id=\"invoice-template\" class=\"uba-select\">
          ${Object.values(this.templates).map(template => `
            <option value=\"${template.id}\">${template.name}</option>
          `).join('')}
        </select>
        <small class=\"form-help\">Choose the template style for your invoice</small>
      `;
      
      // Insert before notes
      notesGroup.parentNode.insertBefore(templateGroup, notesGroup);
    },
    
    /**
     * Add branding settings button
     */
    addBrandingButton() {
      const modalFooter = document.querySelector('#invoice-modal .uba-modal-footer');
      if (!modalFooter) return;
      
      const brandingBtn = document.createElement('button');
      brandingBtn.type = 'button';
      brandingBtn.className = 'uba-btn uba-btn-ghost';
      brandingBtn.innerHTML = '<span>🎨 Branding</span>';
      brandingBtn.onclick = () => this.openBrandingSettings();
      
      // Insert before cancel button
      const cancelBtn = modalFooter.querySelector('.uba-btn-ghost');
      if (cancelBtn) {
        modalFooter.insertBefore(brandingBtn, cancelBtn);
      }
    },
    
    /**
     * Open branding settings modal
     */
    openBrandingSettings() {
      // Create branding settings modal if it doesn't exist
      if (!document.getElementById('branding-settings-modal')) {
        this.createBrandingModal();
      }
      
      // Show modal
      const modal = document.getElementById('branding-settings-modal');
      if (modal) {
        modal.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
        this.populateBrandingForm();
      }
    },
    
    /**
     * Create branding settings modal
     */
    createBrandingModal() {
      const modal = document.createElement('div');
      modal.id = 'branding-settings-modal';
      modal.className = 'uba-modal branding-settings-modal';
      modal.innerHTML = `
        <div class=\"uba-modal-overlay\" onclick=\"window.UBAEnhancedInvoices.closeBrandingSettings()\"></div>
        <div class=\"uba-modal-dialog\">
          <div class=\"uba-modal-header\">
            <h3>Invoice Branding Settings</h3>
            <button class=\"uba-modal-close\" onclick=\"window.UBAEnhancedInvoices.closeBrandingSettings()\">×</button>
          </div>
          <div class=\"uba-modal-body\">
            <form id=\"branding-form\" class=\"uba-form\">
              <div class=\"uba-form-row\">
                <div class=\"uba-form-group\">
                  <label for=\"branding-company-name\">Company Name</label>
                  <input type=\"text\" id=\"branding-company-name\" class=\"uba-input\" />
                </div>
                <div class=\"uba-form-group\">
                  <label for=\"branding-logo-url\">Logo URL</label>
                  <input type=\"url\" id=\"branding-logo-url\" class=\"uba-input\" placeholder=\"https://...\" />
                </div>
              </div>
              
              <div class=\"uba-form-group\">
                <label for=\"branding-address\">Address</label>
                <input type=\"text\" id=\"branding-address\" class=\"uba-input\" />
              </div>
              
              <div class=\"uba-form-row\">
                <div class=\"uba-form-group\">
                  <label for=\"branding-city\">City</label>
                  <input type=\"text\" id=\"branding-city\" class=\"uba-input\" />
                </div>
                <div class=\"uba-form-group\">
                  <label for=\"branding-country\">Country</label>
                  <input type=\"text\" id=\"branding-country\" class=\"uba-input\" />
                </div>
              </div>
              
              <div class=\"uba-form-row\">
                <div class=\"uba-form-group\">
                  <label for=\"branding-phone\">Phone</label>
                  <input type=\"text\" id=\"branding-phone\" class=\"uba-input\" />
                </div>
                <div class=\"uba-form-group\">
                  <label for=\"branding-email\">Email</label>
                  <input type=\"email\" id=\"branding-email\" class=\"uba-input\" />
                </div>
              </div>
              
              <div class=\"uba-form-group\">
                <label for=\"branding-website\">Website</label>
                <input type=\"text\" id=\"branding-website\" class=\"uba-input\" placeholder=\"www.example.com\" />
              </div>
              
              <div class=\"uba-form-section\">
                <h4>Colors</h4>
                <div class=\"uba-form-row\">
                  <div class=\"uba-form-group\">
                    <label for=\"branding-primary-color\">Primary Color</label>
                    <input type=\"color\" id=\"branding-primary-color\" class=\"uba-input color-input\" />
                  </div>
                  <div class=\"uba-form-group\">
                    <label for=\"branding-accent-color\">Accent Color</label>
                    <input type=\"color\" id=\"branding-accent-color\" class=\"uba-input color-input\" />
                  </div>
                </div>
              </div>
              
              <div class=\"uba-form-section\">
                <h4>Payment Details</h4>
                <div class=\"uba-form-row\">
                  <div class=\"uba-form-group\">
                    <label for=\"branding-bank-name\">Bank Name</label>
                    <input type=\"text\" id=\"branding-bank-name\" class=\"uba-input\" />
                  </div>
                  <div class=\"uba-form-group\">
                    <label for=\"branding-payment-terms\">Payment Terms (days)</label>
                    <input type=\"number\" id=\"branding-payment-terms\" class=\"uba-input\" min=\"1\" />
                  </div>
                </div>
                <div class=\"uba-form-row\">
                  <div class=\"uba-form-group\">
                    <label for=\"branding-account-number\">Account Number / IBAN</label>
                    <input type=\"text\" id=\"branding-account-number\" class=\"uba-input\" />
                  </div>
                  <div class=\"uba-form-group\">
                    <label for=\"branding-swift-code\">Swift Code</label>
                    <input type=\"text\" id=\"branding-swift-code\" class=\"uba-input\" />
                  </div>
                </div>
              </div>
              
              <div class=\"uba-form-group\">
                <label for=\"branding-footer-text\">Footer Text</label>
                <textarea id=\"branding-footer-text\" class=\"uba-textarea\" rows=\"2\" placeholder=\"Thank you message...\"></textarea>
              </div>
            </form>
          </div>
          <div class=\"uba-modal-footer\">
            <button type=\"button\" class=\"uba-btn uba-btn-ghost\" onclick=\"window.UBAEnhancedInvoices.closeBrandingSettings()\">Cancel</button>
            <button type=\"button\" class=\"uba-btn uba-btn-primary\" onclick=\"window.UBAEnhancedInvoices.saveBrandingSettings()\">Save Branding</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    },
    
    /**
     * Populate branding form with current settings
     */
    populateBrandingForm() {
      const settings = this.brandingSettings;
      
      this.updateElement('branding-company-name', settings.companyName, 'value');
      this.updateElement('branding-logo-url', settings.logoUrl, 'value');
      this.updateElement('branding-address', settings.companyAddress, 'value');
      this.updateElement('branding-city', settings.companyCity, 'value');
      this.updateElement('branding-country', settings.companyCountry, 'value');
      this.updateElement('branding-phone', settings.companyPhone, 'value');
      this.updateElement('branding-email', settings.companyEmail, 'value');
      this.updateElement('branding-website', settings.companyWebsite, 'value');
      this.updateElement('branding-primary-color', settings.primaryColor, 'value');
      this.updateElement('branding-accent-color', settings.accentColor, 'value');
      this.updateElement('branding-bank-name', settings.bankDetails.bankName, 'value');
      this.updateElement('branding-account-number', settings.bankDetails.accountNumber, 'value');
      this.updateElement('branding-swift-code', settings.bankDetails.swiftCode, 'value');
      this.updateElement('branding-payment-terms', settings.paymentTerms, 'value');
      this.updateElement('branding-footer-text', settings.footerText, 'value');
    },
    
    /**
     * Save branding settings
     */
    saveBrandingSettings() {
      const formData = {
        companyName: document.getElementById('branding-company-name')?.value || '',
        logoUrl: document.getElementById('branding-logo-url')?.value || '',
        companyAddress: document.getElementById('branding-address')?.value || '',
        companyCity: document.getElementById('branding-city')?.value || '',
        companyCountry: document.getElementById('branding-country')?.value || '',
        companyPhone: document.getElementById('branding-phone')?.value || '',
        companyEmail: document.getElementById('branding-email')?.value || '',
        companyWebsite: document.getElementById('branding-website')?.value || '',
        primaryColor: document.getElementById('branding-primary-color')?.value || '#2563eb',
        accentColor: document.getElementById('branding-accent-color')?.value || '#0f172a',
        paymentTerms: document.getElementById('branding-payment-terms')?.value || '30',
        footerText: document.getElementById('branding-footer-text')?.value || '',
        bankDetails: {
          bankName: document.getElementById('branding-bank-name')?.value || '',
          accountNumber: document.getElementById('branding-account-number')?.value || '',
          swiftCode: document.getElementById('branding-swift-code')?.value || ''
        }
      };
      
      this.saveBrandingSettings(formData);
      this.closeBrandingSettings();
      this.showNotification('Branding settings saved successfully!', 'success');
    },
    
    /**
     * Close branding settings modal
     */
    closeBrandingSettings() {
      const modal = document.getElementById('branding-settings-modal');
      if (modal) {
        modal.classList.remove('is-visible');
        document.body.style.overflow = '';
      }
    },
    
    // Utility methods
    
    /**
     * Preview specific invoice
     */
    previewInvoice(invoiceId) {
      this.showInvoicePreview(invoiceId);
    },
    
    /**
     * Update element content or attribute
     */
    updateElement(id, value, type = 'textContent') {
      const element = document.getElementById(id);
      if (element && value !== undefined) {
        element[type] = value;
      }
    },
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', options = {}) {
      if (window.showToast) {
        window.showToast(message, type, options);
      } else {
        console.log(`${type.toUpperCase()}: ${message}`);
      }
    },
    
    /**
     * Format amount with currency
     */
    formatAmount(amount) {
      const num = parseFloat(amount) || 0;
      return `€${num.toFixed(2)}`;
    },
    
    /**
     * Format date
     */
    formatDate(dateStr) {
      if (!dateStr) return '—';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB');
      } catch (e) {
        return '—';
      }
    },
    
    /**
     * Escape HTML
     */
    escapeHtml(text) {
      if (typeof text !== 'string') return text || '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => window.UBAEnhancedInvoices.init(), 1000);
    });
  } else {
    setTimeout(() => window.UBAEnhancedInvoices.init(), 1000);
  }
  
  console.log('✅ Enhanced Invoices module loaded');
  
})();