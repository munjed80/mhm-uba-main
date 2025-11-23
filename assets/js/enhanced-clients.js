// enhanced-clients.js — Advanced client management with validation, custom fields, and cross-linking
(function() {
  'use strict';
  
  // Enhanced client management state
  let enhancedClientsState = {
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    sortBy: 'name',
    sortOrder: 'asc',
    filteredClients: [],
    isEditing: false,
    editingId: null,
    customFields: [],
    showDuplicateWarning: false
  };
  
  /**
   * Initialize enhanced clients system
   */
  function initEnhancedClients() {
    console.log('👥 Initializing enhanced clients with advanced features');
    
    // Load custom fields configuration
    loadCustomFields();
    
    // Setup enhanced form validation
    setupEnhancedValidation();
    
    // Setup pagination and search
    setupAdvancedPagination();
    
    // Setup cross-linking features
    setupCrossLinking();
    
    // Initial render
    renderEnhancedClientsPage();
    
    console.log('✓ Enhanced clients system initialized');
  }
  
  /**
   * Load custom fields configuration
   */
  function loadCustomFields() {
    const saved = localStorage.getItem('uba-client-custom-fields');
    enhancedClientsState.customFields = saved ? JSON.parse(saved) : getDefaultCustomFields();
  }
  
  /**
   * Get default custom fields
   */
  function getDefaultCustomFields() {
    return [
      { id: 'industry', label: 'Industry', type: 'select', options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Other'], required: false },
      { id: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'], required: false },
      { id: 'source', label: 'Lead Source', type: 'select', options: ['Website', 'Referral', 'Social Media', 'Direct', 'Other'], required: false },
      { id: 'budget', label: 'Budget Range', type: 'select', options: ['< €1K', '€1K - €5K', '€5K - €10K', '€10K+'], required: false },
      { id: 'website', label: 'Website', type: 'url', required: false },
      { id: 'linkedin', label: 'LinkedIn', type: 'url', required: false }
    ];
  }
  
  /**
   * Setup enhanced form validation with real-time feedback
   */
  function setupEnhancedValidation() {
    const form = document.getElementById('clients-page-form');
    if (!form) return;
    
    // Real-time validation on input
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        validateClientField(input);
      });
      
      input.addEventListener('input', () => {
        // Clear previous errors on input
        window.UBAValidation.clearFieldError(input.id);
        
        // Real-time duplicate detection for name, email, phone
        if (['clients-name', 'clients-email', 'clients-phone'].includes(input.id)) {
          setTimeout(() => checkForDuplicates(), 500);
        }
      });
    });
    
    // Enhanced form submission
    form.addEventListener('submit', handleEnhancedSubmit);
  }
  
  /**
   * Validate individual client field
   */
  function validateClientField(field) {
    const clientData = getCurrentFormData();
    const existingClients = window.ubaStore?.clients?.getAll() || [];
    
    if (window.UBAValidation && window.UBAValidation.validateClient) {
      const validation = window.UBAValidation.validateClient(
        clientData, 
        existingClients, 
        enhancedClientsState.editingId
      );
      
      // Show field-specific errors
      const fieldName = field.id.replace('clients-', '');
      if (validation.errors[fieldName]) {
        window.UBAValidation.showFieldError(field.id, validation.errors[fieldName]);
      }
      
      // Show warnings
      if (validation.warnings.length > 0) {
        showValidationWarnings(validation.warnings);
      }
    }
  }
  
  /**
   * Check for duplicates in real-time
   */
  function checkForDuplicates() {
    const clientData = getCurrentFormData();
    const existingClients = window.ubaStore?.clients?.getAll() || [];
    
    if (window.UBAValidation && window.UBAValidation.findClientDuplicates) {
      const duplicates = window.UBAValidation.findClientDuplicates(
        clientData, 
        existingClients, 
        enhancedClientsState.editingId
      );
      
      if (duplicates.length > 0) {
        showDuplicateWarning(duplicates[0]);
      } else {
        hideDuplicateWarning();
      }
    }
  }
  
  /**
   * Show duplicate warning
   */
  function showDuplicateWarning(duplicate) {
    enhancedClientsState.showDuplicateWarning = true;
    
    // Create warning element if it doesn't exist
    let warningEl = document.getElementById('duplicate-warning');
    if (!warningEl) {
      warningEl = document.createElement('div');
      warningEl.id = 'duplicate-warning';
      warningEl.className = 'uba-warning-banner';
      
      const form = document.getElementById('clients-page-form');
      if (form) {
        form.insertBefore(warningEl, form.firstChild);
      }
    }
    
    warningEl.innerHTML = `
      <div class=\"uba-warning-content\">
        <span class=\"uba-warning-icon\">⚠️</span>
        <div>
          <strong>Potential Duplicate Client</strong>
          <p>Similar client found: ${duplicate.name} (${duplicate.email || duplicate.phone || 'no contact info'})</p>
        </div>
        <button type=\"button\" class=\"uba-btn-sm uba-btn-ghost\" onclick=\"viewSimilarClient('${duplicate.id}')\">
          View Similar
        </button>
      </div>
    `;
    
    warningEl.style.display = 'block';
  }
  
  /**
   * Hide duplicate warning
   */
  function hideDuplicateWarning() {
    enhancedClientsState.showDuplicateWarning = false;
    const warningEl = document.getElementById('duplicate-warning');
    if (warningEl) {
      warningEl.style.display = 'none';
    }
  }
  
  /**
   * View similar client
   */
  function viewSimilarClient(clientId) {
    const clients = window.ubaStore?.clients?.getAll() || [];
    const client = clients.find(c => c.id === clientId);
    
    if (client) {
      // Show client details in a modal or sidebar
      showClientDetails(client);
    }
  }
  
  /**
   * Get current form data
   */
  function getCurrentFormData() {
    const form = document.getElementById('clients-page-form');
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    // Standard fields
    data.name = document.getElementById('clients-name')?.value?.trim() || '';
    data.email = document.getElementById('clients-email')?.value?.trim() || '';
    data.company = document.getElementById('clients-company')?.value?.trim() || '';
    data.phone = document.getElementById('clients-phone')?.value?.trim() || '';
    data.notes = document.getElementById('clients-notes')?.value?.trim() || '';
    
    // Custom fields
    enhancedClientsState.customFields.forEach(field => {
      const fieldEl = document.getElementById(`custom-${field.id}`);
      if (fieldEl) {
        data[field.id] = fieldEl.value?.trim() || '';
      }
    });
    
    return data;
  }
  
  /**
   * Setup advanced pagination with better UX
   */
  function setupAdvancedPagination() {
    // Search functionality
    const searchInput = document.getElementById('clients-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        enhancedClientsState.searchTerm = e.target.value;
        enhancedClientsState.currentPage = 1;
        applyFiltersAndRender();
      });
    }
    
    // Sort functionality
    const sortSelect = document.getElementById('clients-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const [sortBy, sortOrder] = e.target.value.split('_');
        enhancedClientsState.sortBy = sortBy;
        enhancedClientsState.sortOrder = sortOrder;
        applyFiltersAndRender();
      });
    }
    
    // Page size selector
    const pageSizeSelect = document.getElementById('clients-page-size');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        enhancedClientsState.pageSize = parseInt(e.target.value);
        enhancedClientsState.currentPage = 1;
        applyFiltersAndRender();
      });
    }
  }
  
  /**
   * Setup cross-linking with projects and invoices
   */
  function setupCrossLinking() {
    // This will be implemented to show related projects and invoices
    // when viewing or editing a client
  }
  
  /**
   * Apply filters and re-render
   */
  function applyFiltersAndRender() {
    const allClients = window.ubaStore?.clients?.getAll() || [];
    
    // Apply search filter
    let filtered = allClients.filter(client => {
      if (!enhancedClientsState.searchTerm) return true;
      
      const searchLower = enhancedClientsState.searchTerm.toLowerCase();
      return (
        client.name?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.company?.toLowerCase().includes(searchLower) ||
        client.phone?.toLowerCase().includes(searchLower)
      );
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[enhancedClientsState.sortBy] || '';
      const bVal = b[enhancedClientsState.sortBy] || '';
      
      if (enhancedClientsState.sortOrder === 'asc') {
        return aVal.toString().localeCompare(bVal.toString());
      } else {
        return bVal.toString().localeCompare(aVal.toString());
      }
    });
    
    enhancedClientsState.filteredClients = filtered;
    renderEnhancedClientsPage();
  }
  
  /**
   * Render enhanced clients page
   */
  function renderEnhancedClientsPage() {
    renderClientsToolbar();
    renderClientsTable();
    renderPaginationControls();
  }
  
  /**
   * Render clients toolbar with search and filters
   */
  function renderClientsToolbar() {
    // Implementation will be added to render the enhanced toolbar
  }
  
  /**
   * Render clients table with current data
   */
  function renderClientsTable() {
    const clients = enhancedClientsState.filteredClients.length > 0 
      ? enhancedClientsState.filteredClients 
      : (window.ubaStore?.clients?.getAll() || []);
    
    const table = document.getElementById('clients-page-table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    // Get paginated clients
    const pageSize = enhancedClientsState.pageSize;
    const startIndex = (enhancedClientsState.currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedClients = clients.slice(startIndex, endIndex);
    
    if (pagedClients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No clients found</td></tr>';
      return;
    }
    
    tbody.innerHTML = pagedClients.map(client => `
      <tr>
        <td><strong>${escapeHtml(client.name || '')}</strong></td>
        <td>${escapeHtml(client.company || '')}</td>
        <td>${escapeHtml(client.email || '')}</td>
        <td>${escapeHtml(client.phone || '')}</td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="uba-btn-ghost uba-btn-sm" onclick="editClient('${client.id}')">Edit</button>
            <button class="uba-btn-ghost uba-btn-sm" onclick="deleteClient('${client.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  /**
   * Render pagination controls
   */
  function renderPaginationControls() {
    const clients = enhancedClientsState.filteredClients.length > 0 
      ? enhancedClientsState.filteredClients 
      : (window.ubaStore?.clients?.getAll() || []);
    
    const totalPages = Math.ceil(clients.length / enhancedClientsState.pageSize);
    const pagination = document.getElementById('clients-pagination');
    
    if (!pagination) return;
    
    const prevBtn = pagination.querySelector('#clients-prev-page');
    const nextBtn = pagination.querySelector('#clients-next-page');
    const pageInfo = pagination.querySelector('#clients-page-info');
    
    if (prevBtn) prevBtn.disabled = enhancedClientsState.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = enhancedClientsState.currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${enhancedClientsState.currentPage} of ${Math.max(1, totalPages)}`;
  }
  
  /**
   * Helper function to escape HTML
   */
  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Enhanced form submission handler
   */
  function handleEnhancedSubmit(e) {
    e.preventDefault();
    
    const clientData = getCurrentFormData();
    const existingClients = window.ubaStore?.clients?.getAll() || [];
    
    // Comprehensive validation
    if (window.UBAValidation && window.UBAValidation.validateClient) {
      const validation = window.UBAValidation.validateClient(
        clientData, 
        existingClients, 
        enhancedClientsState.editingId
      );
      
      if (!validation.isValid) {
        // Show all errors
        Object.keys(validation.errors).forEach(field => {
          const fieldId = field === 'name' ? 'clients-name' : 
                         field === 'email' ? 'clients-email' :
                         field === 'phone' ? 'clients-phone' :
                         field === 'company' ? 'clients-company' :
                         field === 'notes' ? 'clients-notes' : 
                         `custom-${field}`;
          
          if (fieldId !== 'duplicate') {
            window.UBAValidation.showFieldError(fieldId, validation.errors[field]);
          }
        });
        
        // Handle duplicate error specially
        if (validation.errors.duplicate) {
          showDuplicateError(validation.errors.duplicate);
        }
        
        return;
      }
      
      // Show warnings but allow submission
      if (validation.warnings.length > 0) {
        showValidationWarnings(validation.warnings);
      }
    }
    
    // Proceed with saving
    saveEnhancedClient(clientData);
  }
  
  /**
   * Save enhanced client with custom fields
   */
  function saveEnhancedClient(clientData) {
    try {
      const store = window.ubaStore;
      if (!store || !store.clients) {
        throw new Error('Client store not available');
      }
      
      if (enhancedClientsState.isEditing && enhancedClientsState.editingId) {
        // Update existing client
        store.clients.update(enhancedClientsState.editingId, clientData);
        console.log('✓ Client updated successfully');
      } else {
        // Create new client
        const newClient = {
          ...clientData,
          id: generateClientId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        store.clients.add(newClient);
        console.log('✓ New client created successfully');
      }
      
      // Reset form and state
      resetClientForm();
      applyFiltersAndRender();
      
      // Show success message
      showSuccessMessage(enhancedClientsState.isEditing ? 'Client updated successfully' : 'Client created successfully');
      
    } catch (error) {
      console.error('Error saving client:', error);
      showErrorMessage('Failed to save client. Please try again.');
    }
  }
  
  /**
   * Generate unique client ID
   */
  function generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Reset client form and editing state
   */
  function resetClientForm() {
    enhancedClientsState.isEditing = false;
    enhancedClientsState.editingId = null;
    
    const form = document.getElementById('clients-page-form');
    if (form) {
      form.reset();
    }
    
    // Clear all validation errors
    const errorElements = document.querySelectorAll('.uba-field-error');
    errorElements.forEach(el => el.remove());
    
    const inputElements = document.querySelectorAll('.uba-input-error');
    inputElements.forEach(el => el.classList.remove('uba-input-error'));
    
    hideDuplicateWarning();
  }
  
  /**
   * Show success message
   */
  function showSuccessMessage(message) {
    // Implementation to show success notification
    if (window.UBANotifications) {
      window.UBANotifications.show(message, 'success');
    }
  }
  
  /**
   * Show error message
   */
  function showErrorMessage(message) {
    // Implementation to show error notification
    if (window.UBANotifications) {
      window.UBANotifications.show(message, 'error');
    }
  }
  
  /**
   * Show validation warnings
   */
  function showValidationWarnings(warnings) {
    warnings.forEach(warning => {
      if (window.UBANotifications) {
        window.UBANotifications.show(warning, 'warning');
      }
    });
  }
  
  /**
   * Show duplicate error
   */
  function showDuplicateError(message) {
    const form = document.getElementById('clients-page-form');
    if (form) {
      let errorEl = document.getElementById('duplicate-error');
      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'duplicate-error';
        errorEl.className = 'uba-error-banner';
        form.insertBefore(errorEl, form.firstChild);
      }
      
      errorEl.innerHTML = `
        <span class=\"uba-error-icon\">❌</span>
        <span>${message}</span>
        <button type=\"button\" onclick=\"this.parentElement.style.display='none'\">×</button>
      `;
      errorEl.style.display = 'block';
    }
  }
  
  // Expose enhanced clients API
  window.UBAEnhancedClients = {
    init: initEnhancedClients,
    viewSimilarClient: viewSimilarClient,
    resetForm: resetClientForm
  };
  
  // Auto-initialize if on clients page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('clients-page-form')) {
        initEnhancedClients();
      }
    });
  } else if (document.getElementById('clients-page-form')) {
    initEnhancedClients();
  }
  
  console.log('✓ Enhanced Clients module loaded');
  
})();