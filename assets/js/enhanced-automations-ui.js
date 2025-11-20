// enhanced-automations.js (Part 2) - UI Management and Modal Handlers

// Extend the UBAEnhancedAutomations object with UI methods
Object.assign(window.UBAEnhancedAutomations, {

  /**
   * Setup modal event handlers
   */
  setupModalEventHandlers() {
    console.log('🔧 Setting up modal event handlers');
    
    // Handle form submission with Enter key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.getElementById('automation-modal').style.display !== 'none') {
        e.preventDefault();
        this.saveAutomation();
      }
    });
  },

  /**
   * Open automation modal
   */
  openModal(automationId = null) {
    console.log('🖼️ Opening automation modal');
    
    const modal = document.getElementById('automation-modal');
    if (!modal) {
      console.error('Automation modal not found');
      return;
    }
    
    // Show modal
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Reset form
    this.resetForm();
    
    // If editing, populate form
    if (automationId) {
      this.populateFormForEdit(automationId);
      document.getElementById('automation-modal-title').innerHTML = 
        '<span class="icon">✏️</span> تعديل الأتمتة (Edit Automation)';
      document.getElementById('delete-automation-btn').style.display = 'inline-block';
    } else {
      document.getElementById('automation-modal-title').innerHTML = 
        '<span class="icon">🤖</span> إنشاء أتمتة جديدة (Create New Automation)';
      document.getElementById('delete-automation-btn').style.display = 'none';
    }
    
    // Focus on name input
    setTimeout(() => {
      document.getElementById('automation-name')?.focus();
    }, 100);
  },

  /**
   * Close automation modal
   */
  closeModal() {
    const modal = document.getElementById('automation-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      this.resetForm();
    }
  },

  /**
   * Reset form to initial state
   */
  resetForm() {
    document.getElementById('enhanced-automation-form')?.reset();
    document.getElementById('automation-edit-id').value = '';
    document.getElementById('automation-enabled').checked = true;
    document.getElementById('trigger-config').classList.add('hidden');
    document.getElementById('actions-container').innerHTML = '';
    document.getElementById('no-actions').style.display = 'block';
    this.clearValidationMessage();
  },

  /**
   * Populate form for editing
   */
  populateFormForEdit(automationId) {
    const automation = this.automations.find(a => a.id === automationId);
    if (!automation) return;
    
    document.getElementById('automation-edit-id').value = automation.id;
    document.getElementById('automation-name').value = automation.name;
    document.getElementById('automation-description').value = automation.description || '';
    document.getElementById('automation-enabled').checked = automation.enabled;
    document.getElementById('automation-trigger').value = automation.trigger;
    
    // Load trigger configuration
    this.onTriggerChange(automation.triggerConfig || {});
    
    // Load actions
    automation.actions.forEach((action, index) => {
      this.addAction(action, index);
    });
  },

  /**
   * Handle trigger change
   */
  onTriggerChange(existingConfig = {}) {
    const triggerId = document.getElementById('automation-trigger').value;
    const configDiv = document.getElementById('trigger-config');
    
    if (!triggerId) {
      configDiv.classList.add('hidden');
      return;
    }
    
    const trigger = this.triggers[triggerId];
    if (!trigger || !trigger.configurable) {
      configDiv.classList.add('hidden');
      return;
    }
    
    // Build configuration form
    configDiv.innerHTML = this.buildTriggerConfigForm(trigger, existingConfig);
    configDiv.classList.remove('hidden');
  },

  /**
   * Build trigger configuration form
   */
  buildTriggerConfigForm(trigger, existingConfig) {
    if (!trigger.conditions) return '';
    
    const conditions = Object.entries(trigger.conditions);
    if (conditions.length === 0) return '';
    
    return `
      <div class="trigger-config-section">
        <h5>Trigger Conditions</h5>
        <p>Configure when this trigger should fire:</p>
        ${conditions.map(([key, condition]) => 
          this.buildConditionField(key, condition, existingConfig[key])
        ).join('')}
      </div>
    `;
  },

  /**
   * Build condition field
   */
  buildConditionField(key, condition, existingValue) {
    const fieldName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    
    if (Array.isArray(condition)) {
      return `
        <div class="form-group">
          <label for="trigger-${key}">${capitalizedName}</label>
          <select id="trigger-${key}" class="uba-select">
            <option value="">Any ${fieldName}</option>
            ${condition.map(option => 
              `<option value="${option}" ${existingValue === option ? 'selected' : ''}>${option}</option>`
            ).join('')}
          </select>
        </div>
      `;
    }
    
    if (typeof condition === 'object' && condition.min !== undefined) {
      return `
        <div class="form-grid">
          <div class="form-group">
            <label for="trigger-${key}-min">Min ${capitalizedName}</label>
            <input type="number" id="trigger-${key}-min" class="uba-input" 
                   min="${condition.min}" max="${condition.max}" 
                   value="${existingValue?.min || condition.min}" />
          </div>
          <div class="form-group">
            <label for="trigger-${key}-max">Max ${capitalizedName}</label>
            <input type="number" id="trigger-${key}-max" class="uba-input" 
                   min="${condition.min}" max="${condition.max}" 
                   value="${existingValue?.max || condition.max}" />
          </div>
        </div>
      `;
    }
    
    if (condition === 'dynamic') {
      return `
        <div class="form-group">
          <label for="trigger-${key}">${capitalizedName}</label>
          <select id="trigger-${key}" class="uba-select">
            <option value="">Any ${fieldName}</option>
            ${this.getDynamicOptions(key).map(option => 
              `<option value="${option.value}" ${existingValue === option.value ? 'selected' : ''}>${option.label}</option>`
            ).join('')}
          </select>
        </div>
      `;
    }
    
    return '';
  },

  /**
   * Get dynamic options for dropdowns
   */
  getDynamicOptions(key) {
    switch (key) {
      case 'assignee':
      case 'recipients':
        return [
          { value: 'admin', label: 'Admin' },
          { value: 'manager', label: 'Manager' },
          { value: 'user', label: 'User' }
        ];
      case 'project':
        if (window.ubaStore?.projects) {
          return window.ubaStore.projects.getAll().map(p => ({
            value: p.id,
            label: p.name
          }));
        }
        return [];
      case 'client':
        if (window.ubaStore?.clients) {
          return window.ubaStore.clients.getAll().map(c => ({
            value: c.id,
            label: c.name
          }));
        }
        return [];
      case 'country':
        return [
          { value: 'SA', label: 'Saudi Arabia' },
          { value: 'AE', label: 'UAE' },
          { value: 'KW', label: 'Kuwait' },
          { value: 'QA', label: 'Qatar' },
          { value: 'BH', label: 'Bahrain' },
          { value: 'OM', label: 'Oman' }
        ];
      default:
        return [];
    }
  },

  /**
   * Add action to the form
   */
  addAction(existingAction = null, index = null) {
    const container = document.getElementById('actions-container');
    const noActionsMsg = document.getElementById('no-actions');
    
    const actionIndex = index !== null ? index : container.children.length;
    const actionDiv = document.createElement('div');
    actionDiv.className = 'action-item';
    actionDiv.dataset.actionIndex = actionIndex;
    
    actionDiv.innerHTML = this.buildActionForm(existingAction, actionIndex);
    
    if (index !== null && container.children[index]) {
      container.replaceChild(actionDiv, container.children[index]);
    } else {
      container.appendChild(actionDiv);
    }
    
    noActionsMsg.style.display = 'none';
    
    // If existing action, populate the form
    if (existingAction) {
      setTimeout(() => {
        this.populateActionForm(actionIndex, existingAction);
      }, 100);
    }
  },

  /**
   * Build action form HTML
   */
  buildActionForm(existingAction, index) {
    return `
      <div class="action-header">
        <h6>Action ${index + 1}</h6>
        <button type="button" class="uba-btn uba-btn-sm uba-btn-danger" 
                onclick="window.UBAEnhancedAutomations.removeAction(${index})">Remove</button>
      </div>
      
      <div class="action-config">
        <div class="form-group">
          <label for="action-type-${index}">Action Type *</label>
          <select id="action-type-${index}" class="uba-select" required 
                  onchange="window.UBAEnhancedAutomations.onActionTypeChange(${index})">
            <option value="">Choose an action...</option>
            ${Object.entries(this.actions).map(([id, action]) => 
              `<option value="${id}" ${existingAction?.type === id ? 'selected' : ''}>${action.icon} ${action.name}</option>`
            ).join('')}
          </select>
        </div>
        
        <div id="action-config-${index}" class="action-config-fields">
          <!-- Dynamic action configuration will be loaded here -->
        </div>
      </div>
    `;
  },

  /**
   * Populate action form with existing data
   */
  populateActionForm(index, actionData) {
    document.getElementById(`action-type-${index}`).value = actionData.type;
    this.onActionTypeChange(index, actionData.config);
  },

  /**
   * Handle action type change
   */
  onActionTypeChange(actionIndex, existingConfig = {}) {
    const actionType = document.getElementById(`action-type-${actionIndex}`).value;
    const configDiv = document.getElementById(`action-config-${actionIndex}`);
    
    if (!actionType) {
      configDiv.innerHTML = '';
      return;
    }
    
    const action = this.actions[actionType];
    if (!action || !action.configurable) {
      configDiv.innerHTML = '';
      return;
    }
    
    // Build configuration form
    configDiv.innerHTML = this.buildActionConfigForm(action, actionIndex, existingConfig);
  },

  /**
   * Build action configuration form
   */
  buildActionConfigForm(action, actionIndex, existingConfig) {
    if (!action.config) return '';
    
    return Object.entries(action.config).map(([key, configDef]) => 
      this.buildActionConfigField(key, configDef, actionIndex, existingConfig[key])
    ).join('');
  },

  /**
   * Build action configuration field
   */
  buildActionConfigField(key, configDef, actionIndex, existingValue) {
    const fieldId = `action-${actionIndex}-${key}`;
    const fieldName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    
    const required = configDef.required ? 'required' : '';
    const placeholder = configDef.placeholder || '';
    const description = configDef.description ? `<small>${configDef.description}</small>` : '';
    
    switch (configDef.type) {
      case 'text':
      case 'url':
        return `
          <div class="form-group">
            <label for="${fieldId}">${capitalizedName} ${configDef.required ? '*' : ''}</label>
            <input type="${configDef.type}" id="${fieldId}" class="uba-input" 
                   placeholder="${placeholder}" ${required} 
                   value="${existingValue || ''}" />
            ${description}
          </div>
        `;
      
      case 'textarea':
        return `
          <div class="form-group">
            <label for="${fieldId}">${capitalizedName} ${configDef.required ? '*' : ''}</label>
            <textarea id="${fieldId}" class="uba-textarea" rows="3" 
                      placeholder="${placeholder}" ${required}>${existingValue || ''}</textarea>
            ${description}
          </div>
        `;
      
      case 'select':
        const options = configDef.options === 'dynamic' ? 
          this.getDynamicOptions(key) : 
          configDef.options.map(opt => ({ value: opt, label: opt }));
        
        return `
          <div class="form-group">
            <label for="${fieldId}">${capitalizedName} ${configDef.required ? '*' : ''}</label>
            <select id="${fieldId}" class="uba-select" ${required}>
              <option value="">${placeholder || `Choose ${fieldName}...`}</option>
              ${options.map(option => 
                `<option value="${option.value}" ${existingValue === option.value ? 'selected' : ''}>${option.label}</option>`
              ).join('')}
            </select>
            ${description}
          </div>
        `;
      
      case 'boolean':
        return `
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="${fieldId}" ${existingValue ? 'checked' : ''} />
              ${capitalizedName}
            </label>
            ${description}
          </div>
        `;
      
      case 'number':
        return `
          <div class="form-group">
            <label for="${fieldId}">${capitalizedName} ${configDef.required ? '*' : ''}</label>
            <input type="number" id="${fieldId}" class="uba-input" 
                   placeholder="${placeholder}" ${required} 
                   value="${existingValue || ''}" />
            ${description}
          </div>
        `;
      
      default:
        return '';
    }
  },

  /**
   * Remove action from form
   */
  removeAction(actionIndex) {
    const container = document.getElementById('actions-container');
    const actionItem = container.querySelector(`[data-action-index="${actionIndex}"]`);
    
    if (actionItem) {
      actionItem.remove();
      
      // Update indices of remaining actions
      Array.from(container.children).forEach((item, index) => {
        item.dataset.actionIndex = index;
        item.querySelector('.action-header h6').textContent = `Action ${index + 1}`;
      });
      
      // Show no actions message if empty
      if (container.children.length === 0) {
        document.getElementById('no-actions').style.display = 'block';
      }
    }
  },

  /**
   * Save automation
   */
  saveAutomation() {
    console.log('💾 Saving automation');
    
    try {
      // Collect form data
      const automationData = this.collectFormData();
      
      // Validate
      const errors = this.validateAutomation(automationData);
      if (errors.length > 0) {
        this.showValidationMessage(errors.join('. '), 'error');
        return;
      }
      
      // Save or update
      const editId = document.getElementById('automation-edit-id').value;
      if (editId) {
        this.updateExistingAutomation(editId, automationData);
      } else {
        this.createNewAutomation(automationData);
      }
      
      // Success
      this.saveAutomations();
      this.closeModal();
      this.renderEnhancedAutomationsTable();
      this.showNotification('Automation saved successfully!', 'success');
      
    } catch (error) {
      console.error('Failed to save automation:', error);
      this.showValidationMessage('Failed to save automation. Please try again.', 'error');
    }
  },

  /**
   * Collect form data
   */
  collectFormData() {
    const formData = {
      name: document.getElementById('automation-name').value.trim(),
      description: document.getElementById('automation-description').value.trim(),
      enabled: document.getElementById('automation-enabled').checked,
      trigger: document.getElementById('automation-trigger').value,
      triggerConfig: this.collectTriggerConfig(),
      actions: this.collectActions()
    };
    
    return formData;
  },

  /**
   * Collect trigger configuration
   */
  collectTriggerConfig() {
    const triggerId = document.getElementById('automation-trigger').value;
    const trigger = this.triggers[triggerId];
    
    if (!trigger || !trigger.conditions) return {};
    
    const config = {};
    
    Object.keys(trigger.conditions).forEach(key => {
      const element = document.getElementById(`trigger-${key}`);
      if (element && element.value) {
        config[key] = element.value;
      }
      
      // Handle range inputs
      const minElement = document.getElementById(`trigger-${key}-min`);
      const maxElement = document.getElementById(`trigger-${key}-max`);
      if (minElement && maxElement) {
        config[key] = {
          min: parseFloat(minElement.value),
          max: parseFloat(maxElement.value)
        };
      }
    });
    
    return config;
  },

  /**
   * Collect actions
   */
  collectActions() {
    const container = document.getElementById('actions-container');
    const actions = [];
    
    Array.from(container.children).forEach((actionItem, index) => {
      const actionType = document.getElementById(`action-type-${index}`)?.value;
      if (!actionType) return;
      
      const actionDef = this.actions[actionType];
      if (!actionDef) return;
      
      const actionConfig = {};
      
      if (actionDef.config) {
        Object.keys(actionDef.config).forEach(key => {
          const element = document.getElementById(`action-${index}-${key}`);
          if (element) {
            if (element.type === 'checkbox') {
              actionConfig[key] = element.checked;
            } else {
              actionConfig[key] = element.value;
            }
          }
        });
      }
      
      actions.push({
        type: actionType,
        config: actionConfig
      });
    });
    
    return actions;
  },

  /**
   * Create new automation
   */
  createNewAutomation(automationData) {
    const automation = {
      id: 'auto-' + Date.now(),
      ...automationData,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0
    };
    
    this.automations.push(automation);
  },

  /**
   * Update existing automation
   */
  updateExistingAutomation(automationId, automationData) {
    const index = this.automations.findIndex(a => a.id === automationId);
    if (index !== -1) {
      this.automations[index] = {
        ...this.automations[index],
        ...automationData,
        updatedAt: new Date().toISOString()
      };
    }
  },

  /**
   * Delete automation
   */
  deleteAutomation() {
    const automationId = document.getElementById('automation-edit-id').value;
    if (!automationId) return;
    
    if (confirm('Are you sure you want to delete this automation?')) {
      this.deleteAutomationById(automationId);
      this.closeModal();
      this.renderEnhancedAutomationsTable();
      this.showNotification('Automation deleted successfully!', 'success');
    }
  },

  /**
   * Delete automation from table
   */
  deleteAutomationFromTable(automationId) {
    if (confirm('Are you sure you want to delete this automation?')) {
      this.deleteAutomationById(automationId);
      this.renderEnhancedAutomationsTable();
      this.showNotification('Automation deleted successfully!', 'success');
    }
  },

  /**
   * Delete automation by ID
   */
  deleteAutomationById(automationId) {
    this.automations = this.automations.filter(a => a.id !== automationId);
    this.saveAutomations();
  },

  /**
   * Edit automation
   */
  editAutomation(automationId) {
    this.openModal(automationId);
  },

  /**
   * Test automation
   */
  testAutomation(automationId) {
    const automation = this.automations.find(a => a.id === automationId);
    if (!automation) return;
    
    // Create mock test data
    const testData = this.createMockTestData(automation.trigger);
    
    // Execute automation
    this.executeAutomation(automation, 'test.trigger', testData);
    
    this.showNotification(`Test executed for "${automation.name}"`, 'info');
  },

  /**
   * Create mock test data
   */
  createMockTestData(triggerId) {
    switch (triggerId) {
      case 'onTaskCreated':
        return {
          id: 'test-task-' + Date.now(),
          title: 'Test Task',
          priority: 'medium',
          category: 'work',
          assignee: 'admin'
        };
      
      case 'onInvoiceDue':
        return {
          id: 'test-invoice-' + Date.now(),
          label: 'INV-001',
          amount: 1000,
          daysUntilDue: 3,
          client: { name: 'Test Client' }
        };
      
      case 'onLeadUpdated':
        return {
          id: 'test-lead-' + Date.now(),
          name: 'Test Lead',
          status: 'qualified',
          score: 85,
          source: 'website'
        };
      
      case 'onProjectMoved':
        return {
          id: 'test-project-' + Date.now(),
          name: 'Test Project',
          oldStage: 'planning',
          newStage: 'development',
          priority: 'high'
        };
      
      default:
        return {
          id: 'test-record-' + Date.now(),
          name: 'Test Record'
        };
    }
  },

  /**
   * Show validation message
   */
  showValidationMessage(message, type = 'error') {
    const messageEl = document.getElementById('validation-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `validation-message ${type}`;
    }
  },

  /**
   * Clear validation message
   */
  clearValidationMessage() {
    const messageEl = document.getElementById('validation-message');
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.className = 'validation-message';
    }
  }

});

console.log('✅ Enhanced Automations UI management loaded');