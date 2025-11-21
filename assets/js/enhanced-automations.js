// enhanced-automations.js - Professional Automation System
(function() {
  'use strict';
  
  /**
   * Enhanced Automations System
   * Features: Real triggers, Actions, Validation, Enable/Disable, Better Design
   */
  window.UBAEnhancedAutomations = {
    
    // State management
    automations: [],
    logs: [],
    eventListeners: new Map(),
    
    // Real trigger definitions
    triggers: {
      onTaskCreated: {
        id: 'onTaskCreated',
        name: 'Task Created (عند إنشاء مهمة)',
        description: 'Triggered when a new task is created',
        icon: '✅',
        category: 'tasks',
        events: ['task.created'],
        configurable: true,
        conditions: {
          priority: ['high', 'medium', 'low'],
          category: ['work', 'personal', 'urgent'],
          assignee: 'dynamic', // populated from users
          project: 'dynamic' // populated from projects
        }
      },
      onInvoiceDue: {
        id: 'onInvoiceDue',
        name: 'Invoice Due (عند استحقاق فاتورة)',
        description: 'Triggered when an invoice becomes due or overdue',
        icon: '💵',
        category: 'invoices',
        events: ['invoice.due', 'invoice.overdue'],
        configurable: true,
        conditions: {
          daysBeforeDue: [1, 3, 7, 14, 30],
          amount: { min: 0, max: 100000 },
          client: 'dynamic',
          status: ['draft', 'sent', 'overdue']
        }
      },
      onLeadUpdated: {
        id: 'onLeadUpdated',
        name: 'Lead Updated (عند تحديث عميل محتمل)',
        description: 'Triggered when a lead status or information is updated',
        icon: '🧲',
        category: 'leads',
        events: ['lead.updated', 'lead.status_changed'],
        configurable: true,
        conditions: {
          status: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
          score: { min: 0, max: 100 },
          source: ['website', 'referral', 'social', 'email', 'event'],
          budget: { min: 0, max: 1000000 }
        }
      },
      onProjectMoved: {
        id: 'onProjectMoved',
        name: 'Project Stage Changed (عند تغيير مرحلة المشروع)',
        description: 'Triggered when a project moves to a different stage',
        icon: '💼',
        category: 'projects',
        events: ['project.stage_changed', 'project.status_changed'],
        configurable: true,
        conditions: {
          fromStage: ['lead', 'planning', 'development', 'testing', 'deployment'],
          toStage: ['lead', 'planning', 'development', 'testing', 'deployment'],
          budget: { min: 0, max: 1000000 },
          priority: ['high', 'medium', 'low']
        }
      },
      onClientCreated: {
        id: 'onClientCreated',
        name: 'Client Created (عند إضافة عميل)',
        description: 'Triggered when a new client is added',
        icon: '👤',
        category: 'clients',
        events: ['client.created'],
        configurable: true,
        conditions: {
          type: ['individual', 'business'],
          country: 'dynamic',
          source: ['referral', 'website', 'social', 'cold_call']
        }
      },
      onDeadlineApproaching: {
        id: 'onDeadlineApproaching',
        name: 'Deadline Approaching (عند اقتراب الموعد النهائي)',
        description: 'Triggered when any deadline is approaching',
        icon: '⏰',
        category: 'deadlines',
        events: ['deadline.approaching'],
        configurable: true,
        conditions: {
          daysBeforeDeadline: [1, 2, 3, 7, 14],
          type: ['task', 'project', 'invoice', 'meeting'],
          priority: ['high', 'medium', 'low']
        }
      }
    },
    
    // Real action definitions
    actions: {
      sendNotification: {
        id: 'sendNotification',
        name: 'Send Notification (إرسال تنبيه)',
        description: 'Send a notification message',
        icon: '🔔',
        category: 'notifications',
        configurable: true,
        config: {
          message: { type: 'text', required: true, placeholder: 'Notification message' },
          type: { type: 'select', options: ['info', 'warning', 'success', 'error'], default: 'info' },
          persistent: { type: 'boolean', default: false, description: 'Keep notification until dismissed' },
          recipients: { type: 'multiselect', options: 'dynamic', description: 'Who should receive this notification' }
        }
      },
      createTask: {
        id: 'createTask',
        name: 'Create Task (إنشاء مهمة)',
        description: 'Create a new task automatically',
        icon: '✅',
        category: 'tasks',
        configurable: true,
        config: {
          title: { type: 'text', required: true, placeholder: 'Task title (can use variables)' },
          description: { type: 'textarea', placeholder: 'Task description (can use variables)' },
          priority: { type: 'select', options: ['high', 'medium', 'low'], default: 'medium' },
          assignee: { type: 'select', options: 'dynamic', placeholder: 'Assign to user' },
          dueDate: { type: 'select', options: ['today', 'tomorrow', '+3days', '+1week', '+2weeks', 'custom'] },
          project: { type: 'select', options: 'dynamic', placeholder: 'Link to project' }
        }
      },
      addLogEntry: {
        id: 'addLogEntry',
        name: 'Add Log Entry (إضافة سجل)',
        description: 'Add an entry to the activity log',
        icon: '📝',
        category: 'logging',
        configurable: true,
        config: {
          message: { type: 'text', required: true, placeholder: 'Log message (can use variables)' },
          level: { type: 'select', options: ['info', 'warning', 'error', 'success'], default: 'info' },
          category: { type: 'text', placeholder: 'Log category' },
          associatedRecord: { type: 'boolean', default: true, description: 'Associate with triggering record' }
        }
      },
      updateRecord: {
        id: 'updateRecord',
        name: 'Update Record (تحديث سجل)',
        description: 'Update the record that triggered this automation',
        icon: '✏️',
        category: 'data',
        configurable: true,
        config: {
          field: { type: 'select', options: 'dynamic', placeholder: 'Field to update' },
          value: { type: 'text', placeholder: 'New value (can use variables)' },
          condition: { type: 'text', placeholder: 'Only update if condition is met' }
        }
      },
      sendEmail: {
        id: 'sendEmail',
        name: 'Send Email (إرسال بريد إلكتروني)',
        description: 'Send an email notification',
        icon: '📧',
        category: 'communications',
        configurable: true,
        config: {
          to: { type: 'text', required: true, placeholder: 'Recipient email (can use variables)' },
          subject: { type: 'text', required: true, placeholder: 'Email subject' },
          body: { type: 'textarea', required: true, placeholder: 'Email body (can use variables)' },
          template: { type: 'select', options: 'dynamic', placeholder: 'Use email template' }
        }
      },
      webhook: {
        id: 'webhook',
        name: 'Webhook (ويب هوك)',
        description: 'Send data to external webhook URL',
        icon: '🔗',
        category: 'integrations',
        configurable: true,
        config: {
          url: { type: 'url', required: true, placeholder: 'Webhook URL' },
          method: { type: 'select', options: ['POST', 'PUT', 'PATCH'], default: 'POST' },
          headers: { type: 'textarea', placeholder: 'Custom headers (JSON format)' },
          payload: { type: 'textarea', placeholder: 'Custom payload (JSON, can use variables)' }
        }
      }
    },
    
    /**
     * Initialize enhanced automation system
     */
    init() {
      console.log('🤖 Initializing Enhanced Automation System');

      this.loadAutomations();

      const isAutomationsContext = this.isAutomationsPage();
      if (!isAutomationsContext) {
        this.teardownDetachedUI();
        console.log('↩️ Skipping Enhanced Automation UI wiring – no automations view on this page');
        return;
      }
      
      this.setupRealTriggers();
      this.enhanceAutomationModal();
      this.setupValidationRules();
      this.addToggleControls();
      this.enhanceDesign();
      this.initializeEventSystem();
      
      console.log('✅ Enhanced Automation System initialized');
    },

    /**
     * Detect if current page contains the automations experience
     */
    isAutomationsPage() {
      const pageMarker = document.getElementById('page-id');
      if (pageMarker?.dataset?.page) {
        return pageMarker.dataset.page === 'automations-page';
      }

      if (document.body?.dataset?.activeView === 'automations') {
        return true;
      }

      if (document.querySelector('[data-view="automations"]')) {
        return true;
      }

      return window.location.pathname.includes('automations');
    },

    /**
     * Remove stray modals/overlays when not on the automations page
     */
    teardownDetachedUI() {
      const modal = document.getElementById('automation-modal');
      if (modal) {
        if (!modal.classList.contains('is-hidden') && modal.style.display !== 'none') {
          document.body.style.overflow = '';
          document.body.classList.remove('modal-open');
        }
        modal.remove();
      }

      // Clear any automation-related event listeners
      this.eventListeners.forEach((listener, element) => {
        try {
          element.removeEventListener('click', listener);
        } catch (e) {
          // Ignore errors for removed elements
        }
      });
      this.eventListeners.clear();
    },
    
    /**
     * Load automations from storage
     */
    loadAutomations() {
      try {
        const saved = localStorage.getItem('uba-enhanced-automations');
        this.automations = saved ? JSON.parse(saved) : this.getDefaultAutomations();
        
        const savedLogs = localStorage.getItem('uba-automation-logs');
        this.logs = savedLogs ? JSON.parse(savedLogs) : [];
        
        console.log('✅ Automations loaded:', this.automations.length);
      } catch (error) {
        console.warn('⚠️ Failed to load automations:', error);
        this.automations = this.getDefaultAutomations();
      }
    },
    
    /**
     * Get default automations
     */
    getDefaultAutomations() {
      return [
        {
          id: 'auto-1',
          name: 'Welcome New Clients',
          description: 'Send welcome notification when new client is added',
          trigger: 'onClientCreated',
          triggerConfig: {},
          actions: [
            {
              type: 'sendNotification',
              config: {
                message: 'New client {{client.name}} has been added to the system',
                type: 'success',
                persistent: false
              }
            },
            {
              type: 'createTask',
              config: {
                title: 'Follow up with {{client.name}}',
                description: 'Schedule initial consultation call',
                priority: 'high',
                dueDate: '+3days'
              }
            }
          ],
          enabled: true,
          createdAt: new Date().toISOString(),
          lastTriggered: null,
          triggerCount: 0
        },
        {
          id: 'auto-2',
          name: 'Invoice Due Reminder',
          description: 'Create follow-up task when invoice is due',
          trigger: 'onInvoiceDue',
          triggerConfig: {
            daysBeforeDue: 3
          },
          actions: [
            {
              type: 'createTask',
              config: {
                title: 'Follow up on invoice {{invoice.label}}',
                description: 'Invoice for {{client.name}} is due in 3 days',
                priority: 'medium',
                dueDate: 'today'
              }
            },
            {
              type: 'addLogEntry',
              config: {
                message: 'Invoice {{invoice.label}} due reminder created',
                level: 'info',
                category: 'invoices'
              }
            }
          ],
          enabled: true,
          createdAt: new Date().toISOString(),
          lastTriggered: null,
          triggerCount: 0
        }
      ];
    },
    
    /**
     * Setup real trigger system
     */
    setupRealTriggers() {
      console.log('🎯 Setting up real trigger system');
      
      // Hook into existing systems
      this.hookIntoTaskSystem();
      this.hookIntoInvoiceSystem();
      this.hookIntoLeadSystem();
      this.hookIntoProjectSystem();
      this.hookIntoClientSystem();
      
      // Setup periodic checks
      this.setupPeriodicTriggers();
    },
    
    /**
     * Hook into task system
     */
    hookIntoTaskSystem() {
      if (window.ubaStore?.tasks) {
        const originalCreate = window.ubaStore.tasks.create;
        const originalUpdate = window.ubaStore.tasks.update;
        
        // Override task creation
        window.ubaStore.tasks.create = (taskData) => {
          const result = originalCreate.call(window.ubaStore.tasks, taskData);
          this.triggerEvent('task.created', taskData);
          return result;
        };
        
        // Override task updates
        window.ubaStore.tasks.update = (taskId, taskData) => {
          const oldTask = window.ubaStore.tasks.getById(taskId);
          const result = originalUpdate.call(window.ubaStore.tasks, taskId, taskData);
          
          if (oldTask && taskData.status !== oldTask.status && taskData.status === 'completed') {
            this.triggerEvent('task.completed', { ...taskData, id: taskId, oldStatus: oldTask.status });
          }
          
          return result;
        };
        
        console.log('✅ Task system hooked');
      }
    },
    
    /**
     * Hook into invoice system
     */
    hookIntoInvoiceSystem() {
      if (window.ubaStore?.invoices) {
        const originalCreate = window.ubaStore.invoices.create;
        const originalUpdate = window.ubaStore.invoices.update;
        
        // Override invoice creation
        window.ubaStore.invoices.create = (invoiceData) => {
          const result = originalCreate.call(window.ubaStore.invoices, invoiceData);
          this.triggerEvent('invoice.created', invoiceData);
          return result;
        };
        
        // Override invoice updates
        window.ubaStore.invoices.update = (invoiceId, invoiceData) => {
          const oldInvoice = window.ubaStore.invoices.getById(invoiceId);
          const result = originalUpdate.call(window.ubaStore.invoices, invoiceId, invoiceData);
          
          if (oldInvoice && invoiceData.status !== oldInvoice.status) {
            this.triggerEvent('invoice.status_changed', { 
              ...invoiceData, 
              id: invoiceId, 
              oldStatus: oldInvoice.status,
              newStatus: invoiceData.status
            });
          }
          
          return result;
        };
        
        console.log('✅ Invoice system hooked');
      }
    },
    
    /**
     * Hook into lead system
     */
    hookIntoLeadSystem() {
      if (window.ubaStore?.leads) {
        const originalUpdate = window.ubaStore.leads.update;
        
        // Override lead updates
        window.ubaStore.leads.update = (leadId, leadData) => {
          const oldLead = window.ubaStore.leads.getById(leadId);
          const result = originalUpdate.call(window.ubaStore.leads, leadId, leadData);
          
          this.triggerEvent('lead.updated', { 
            ...leadData, 
            id: leadId, 
            oldData: oldLead
          });
          
          if (oldLead && leadData.status !== oldLead.status) {
            this.triggerEvent('lead.status_changed', {
              ...leadData,
              id: leadId,
              oldStatus: oldLead.status,
              newStatus: leadData.status
            });
          }
          
          return result;
        };
        
        console.log('✅ Lead system hooked');
      }
    },
    
    /**
     * Hook into project system
     */
    hookIntoProjectSystem() {
      if (window.ubaStore?.projects) {
        const originalUpdate = window.ubaStore.projects.update;
        
        // Override project updates
        window.ubaStore.projects.update = (projectId, projectData) => {
          const oldProject = window.ubaStore.projects.getById(projectId);
          const result = originalUpdate.call(window.ubaStore.projects, projectId, projectData);
          
          if (oldProject && projectData.stage !== oldProject.stage) {
            this.triggerEvent('project.stage_changed', {
              ...projectData,
              id: projectId,
              oldStage: oldProject.stage,
              newStage: projectData.stage
            });
          }
          
          if (oldProject && projectData.status !== oldProject.status) {
            this.triggerEvent('project.status_changed', {
              ...projectData,
              id: projectId,
              oldStatus: oldProject.status,
              newStatus: projectData.status
            });
          }
          
          return result;
        };
        
        console.log('✅ Project system hooked');
      }
    },
    
    /**
     * Hook into client system
     */
    hookIntoClientSystem() {
      if (window.ubaStore?.clients) {
        const originalCreate = window.ubaStore.clients.create;
        
        // Override client creation
        window.ubaStore.clients.create = (clientData) => {
          const result = originalCreate.call(window.ubaStore.clients, clientData);
          this.triggerEvent('client.created', clientData);
          return result;
        };
        
        console.log('✅ Client system hooked');
      }
    },
    
    /**
     * Setup periodic triggers (for due dates, deadlines, etc.)
     */
    setupPeriodicTriggers() {
      // Check for due invoices every hour
      setInterval(() => {
        this.checkInvoiceDueDates();
        this.checkApproachingDeadlines();
      }, 60 * 60 * 1000); // Every hour
      
      // Initial check
      setTimeout(() => {
        this.checkInvoiceDueDates();
        this.checkApproachingDeadlines();
      }, 5000);
    },
    
    /**
     * Check invoice due dates
     */
    checkInvoiceDueDates() {
      if (!window.ubaStore?.invoices) return;
      
      const invoices = window.ubaStore.invoices.getAll() || [];
      const now = new Date();
      
      invoices.forEach(invoice => {
        if (invoice.due && invoice.status !== 'paid') {
          const dueDate = new Date(invoice.due);
          const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 0 && invoice.status !== 'overdue') {
            this.triggerEvent('invoice.overdue', invoice);
          } else if (daysDiff > 0 && daysDiff <= 7) {
            this.triggerEvent('invoice.due', { ...invoice, daysUntilDue: daysDiff });
          }
        }
      });
    },
    
    /**
     * Check approaching deadlines
     */
    checkApproachingDeadlines() {
      const now = new Date();
      
      // Check tasks
      if (window.ubaStore?.tasks) {
        const tasks = window.ubaStore.tasks.getAll() || [];
        tasks.forEach(task => {
          if (task.due && task.status !== 'completed') {
            const dueDate = new Date(task.due);
            const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 0 && daysDiff <= 3) {
              this.triggerEvent('deadline.approaching', {
                ...task,
                type: 'task',
                daysUntilDeadline: daysDiff
              });
            }
          }
        });
      }
      
      // Check projects
      if (window.ubaStore?.projects) {
        const projects = window.ubaStore.projects.getAll() || [];
        projects.forEach(project => {
          const deadline = project.due || project.deadline;
          if (deadline && project.status === 'active') {
            const deadlineDate = new Date(deadline);
            const daysDiff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 0 && daysDiff <= 7) {
              this.triggerEvent('deadline.approaching', {
                ...project,
                type: 'project',
                daysUntilDeadline: daysDiff
              });
            }
          }
        });
      }
    },
    
    /**
     * Trigger an automation event
     */
    triggerEvent(eventType, eventData) {
      console.log(`🎯 Triggering event: ${eventType}`, eventData);
      
      // Find matching automations
      const matchingAutomations = this.automations.filter(automation => {
        if (!automation.enabled) return false;
        
        const trigger = this.triggers[automation.trigger];
        if (!trigger) return false;
        
        return trigger.events.includes(eventType);
      });
      
      // Execute matching automations
      matchingAutomations.forEach(automation => {
        this.executeAutomation(automation, eventType, eventData);
      });
    },
    
    /**
     * Execute an automation
     */
    async executeAutomation(automation, eventType, eventData) {
      console.log(`🚀 Executing automation: ${automation.name}`);
      
      try {
        // Check conditions
        if (!this.checkConditions(automation, eventData)) {
          this.logExecution(automation, 'skipped', 'Conditions not met', eventData);
          return;
        }
        
        // Execute actions
        const results = [];
        for (const action of automation.actions) {
          try {
            const result = await this.executeAction(action, eventData, automation);
            results.push({ action: action.type, success: true, result });
          } catch (error) {
            console.error(`❌ Action ${action.type} failed:`, error);
            results.push({ action: action.type, success: false, error: error.message });
          }
        }
        
        // Update automation stats
        automation.lastTriggered = new Date().toISOString();
        automation.triggerCount = (automation.triggerCount || 0) + 1;
        this.saveAutomations();
        
        // Log successful execution
        this.logExecution(automation, 'success', `Executed ${results.length} actions`, eventData, results);
        
      } catch (error) {
        console.error(`❌ Automation ${automation.name} failed:`, error);
        this.logExecution(automation, 'error', error.message, eventData);
      }
    },
    
    /**
     * Check automation conditions
     */
    checkConditions(automation, eventData) {
      const triggerConfig = automation.triggerConfig || {};
      const trigger = this.triggers[automation.trigger];
      
      if (!trigger || !trigger.conditions) return true;
      
      // Check each configured condition
      for (const [conditionKey, conditionValue] of Object.entries(triggerConfig)) {
        if (!this.evaluateCondition(conditionKey, conditionValue, eventData, trigger.conditions)) {
          return false;
        }
      }
      
      return true;
    },
    
    /**
     * Evaluate a single condition
     */
    evaluateCondition(key, expectedValue, eventData, triggerConditions) {
      const actualValue = this.getValueFromData(key, eventData);
      const conditionDef = triggerConditions[key];
      
      if (!conditionDef) return true;
      
      if (Array.isArray(conditionDef)) {
        return conditionDef.includes(actualValue);
      }
      
      if (typeof conditionDef === 'object' && conditionDef.min !== undefined) {
        const numValue = parseFloat(actualValue);
        return numValue >= conditionDef.min && numValue <= conditionDef.max;
      }
      
      return actualValue === expectedValue;
    },
    
    /**
     * Get value from event data using dot notation
     */
    getValueFromData(path, data) {
      return path.split('.').reduce((obj, key) => obj && obj[key], data);
    },
    
    /**
     * Execute an action
     */
    async executeAction(action, eventData, automation) {
      const actionDef = this.actions[action.type];
      if (!actionDef) {
        throw new Error(`Unknown action type: ${action.type}`);
      }
      
      // Process config with variable substitution
      const processedConfig = this.processActionConfig(action.config, eventData);
      
      switch (action.type) {
        case 'sendNotification':
          return this.executeSendNotification(processedConfig);
        
        case 'createTask':
          return this.executeCreateTask(processedConfig);
        
        case 'addLogEntry':
          return this.executeAddLogEntry(processedConfig, eventData);
        
        case 'updateRecord':
          return this.executeUpdateRecord(processedConfig, eventData);
        
        case 'sendEmail':
          return this.executeSendEmail(processedConfig);
        
        case 'webhook':
          return this.executeWebhook(processedConfig, eventData);
        
        default:
          throw new Error(`Action type ${action.type} not implemented`);
      }
    },
    
    /**
     * Process action config with variable substitution
     */
    processActionConfig(config, eventData) {
      const processed = {};
      
      for (const [key, value] of Object.entries(config)) {
        if (typeof value === 'string') {
          processed[key] = this.substituteVariables(value, eventData);
        } else {
          processed[key] = value;
        }
      }
      
      return processed;
    },
    
    /**
     * Substitute variables in string
     */
    substituteVariables(template, data) {
      return template.replace(/\\{\\{([^}]+)\\}\\}/g, (match, path) => {
        const value = this.getValueFromData(path.trim(), data);
        return value !== undefined ? value : match;
      });
    },
    
    /**
     * Execute send notification action
     */
    executeSendNotification(config) {
      if (window.showToast) {
        window.showToast(config.message, config.type || 'info', {
          persistent: config.persistent || false
        });
      } else {
        console.log(`📢 Notification: ${config.message}`);
      }
      
      return { message: config.message, type: config.type };
    },
    
    /**
     * Execute create task action
     */
    executeCreateTask(config) {
      if (!window.ubaStore?.tasks) {
        throw new Error('Task store not available');
      }
      
      const taskData = {
        id: 'task-auto-' + Date.now(),
        title: config.title,
        description: config.description || '',
        priority: config.priority || 'medium',
        status: 'todo',
        createdAt: new Date().toISOString(),
        due: this.calculateDueDate(config.dueDate),
        assignee: config.assignee,
        projectId: config.project,
        automationGenerated: true
      };
      
      window.ubaStore.tasks.create(taskData);
      
      return { taskId: taskData.id, title: taskData.title };
    },
    
    /**
     * Calculate due date from config
     */
    calculateDueDate(dueDateConfig) {
      if (!dueDateConfig) return null;
      
      const now = new Date();
      
      switch (dueDateConfig) {
        case 'today':
          return now.toISOString().slice(0, 10);
        case 'tomorrow':
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().slice(0, 10);
        case '+3days':
          const threeDays = new Date(now);
          threeDays.setDate(threeDays.getDate() + 3);
          return threeDays.toISOString().slice(0, 10);
        case '+1week':
          const oneWeek = new Date(now);
          oneWeek.setDate(oneWeek.getDate() + 7);
          return oneWeek.toISOString().slice(0, 10);
        case '+2weeks':
          const twoWeeks = new Date(now);
          twoWeeks.setDate(twoWeeks.getDate() + 14);
          return twoWeeks.toISOString().slice(0, 10);
        default:
          return dueDateConfig; // Custom date
      }
    },
    
    /**
     * Execute add log entry action
     */
    executeAddLogEntry(config, eventData) {
      const logEntry = {
        id: 'log-auto-' + Date.now(),
        message: config.message,
        level: config.level || 'info',
        category: config.category || 'automation',
        timestamp: new Date().toISOString(),
        associatedRecord: config.associatedRecord ? eventData : null,
        automationGenerated: true
      };
      
      this.logs.push(logEntry);
      this.saveLogs();
      
      return { logId: logEntry.id, message: logEntry.message };
    },
    
    /**
     * Execute update record action
     */
    executeUpdateRecord(config, eventData) {
      // This would update the record that triggered the automation
      // Implementation depends on the specific record type and field
      return { field: config.field, value: config.value };
    },
    
    /**
     * Execute send email action
     */
    executeSendEmail(config) {
      // Email functionality would be implemented here
      console.log(`📧 Email to ${config.to}: ${config.subject}`);
      return { to: config.to, subject: config.subject };
    },
    
    /**
     * Execute webhook action
     */
    async executeWebhook(config, eventData) {
      try {
        const response = await fetch(config.url, {
          method: config.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...JSON.parse(config.headers || '{}')
          },
          body: config.payload ? 
            this.substituteVariables(config.payload, eventData) : 
            JSON.stringify(eventData)
        });
        
        return { status: response.status, ok: response.ok };
      } catch (error) {
        throw new Error(`Webhook failed: ${error.message}`);
      }
    },
    
    /**
     * Log automation execution
     */
    logExecution(automation, status, message, eventData, results = null) {
      const logEntry = {
        id: 'exec-' + Date.now(),
        automationId: automation.id,
        automationName: automation.name,
        status: status, // 'success', 'error', 'skipped'
        message: message,
        timestamp: new Date().toISOString(),
        eventData: eventData,
        results: results
      };
      
      this.logs.push(logEntry);
      this.saveLogs();
      
      // Limit log size
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-500);
        this.saveLogs();
      }
    },
    
    /**
     * Enhance automation modal
     */
    enhanceAutomationModal() {
      console.log('🎨 Enhancing automation modal');
      
      this.replaceAutomationModal();
      this.setupModalEventHandlers();
    },
    
    /**
     * Replace existing automation modal with enhanced version
     */
    replaceAutomationModal() {
      // Remove existing modal
      const existingModal = document.getElementById('automation-modal');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Create enhanced modal
      const modal = document.createElement('div');
      modal.id = 'automation-modal';
      modal.className = 'uba-modal enhanced-automation-modal';
      modal.innerHTML = this.getEnhancedModalHTML();
      
      document.body.appendChild(modal);
    },
    
    /**
     * Get enhanced modal HTML
     */
    getEnhancedModalHTML() {
      return `
        <div class=\"uba-modal-overlay\" onclick=\"window.UBAEnhancedAutomations.closeModal()\"></div>
        <div class=\"uba-modal-dialog enhanced-automation-dialog\">
          <div class=\"uba-modal-header automation-header\">
            <h3 id=\"automation-modal-title\">
              <span class=\"icon\">🤖</span> 
              إنشاء أتمتة جديدة (Create New Automation)
            </h3>
            <button class=\"uba-modal-close\" onclick=\"window.UBAEnhancedAutomations.closeModal()\">×</button>
          </div>
          
          <div class=\"uba-modal-body automation-body\">
            <form id=\"enhanced-automation-form\" class=\"automation-form\">
              <input type=\"hidden\" id=\"automation-edit-id\" />
              
              <!-- Basic Information -->
              <div class=\"form-section\">
                <div class=\"section-header\">
                  <h4><span class=\"icon\">📋</span> Basic Information</h4>
                  <p>Define the automation name and description</p>
                </div>
                
                <div class=\"form-grid\">
                  <div class=\"form-group\">
                    <label for=\"automation-name\">Automation Name *</label>
                    <input type=\"text\" id=\"automation-name\" class=\"uba-input\" placeholder=\"e.g., Welcome New Clients\" required />
                  </div>
                  
                  <div class=\"form-group\">
                    <label class=\"toggle-label\">
                      <input type=\"checkbox\" id=\"automation-enabled\" checked />
                      <span class=\"toggle-slider\"></span>
                      Enabled
                    </label>
                  </div>
                </div>
                
                <div class=\"form-group\">
                  <label for=\"automation-description\">Description</label>
                  <textarea id=\"automation-description\" class=\"uba-textarea\" rows=\"2\" 
                           placeholder=\"Brief description of what this automation does\"></textarea>
                </div>
              </div>
              
              <!-- Trigger Configuration -->
              <div class=\"form-section\">
                <div class=\"section-header\">
                  <h4><span class=\"icon\">🎯</span> Trigger (المحفز)</h4>
                  <p>What event should trigger this automation?</p>
                </div>
                
                <div class=\"form-group\">
                  <label for=\"automation-trigger\">Select Trigger *</label>
                  <select id=\"automation-trigger\" class=\"uba-select enhanced-dropdown\" required 
                          onchange=\"window.UBAEnhancedAutomations.onTriggerChange()\">
                    <option value=\"\">Choose a trigger...</option>
                    ${Object.entries(this.triggers).map(([id, trigger]) => 
                      `<option value=\"${id}\">${trigger.icon} ${trigger.name}</option>`
                    ).join('')}
                  </select>
                </div>
                
                <div id=\"trigger-config\" class=\"trigger-config hidden\">
                  <!-- Dynamic trigger configuration will be loaded here -->
                </div>
              </div>
              
              <!-- Actions Configuration -->
              <div class=\"form-section\">
                <div class=\"section-header\">
                  <h4><span class=\"icon\">⚡</span> Actions (الإجراءات)</h4>
                  <p>What should happen when the trigger fires?</p>
                  <button type=\"button\" class=\"uba-btn uba-btn-sm uba-btn-primary\" 
                          onclick=\"window.UBAEnhancedAutomations.addAction()\">
                    + Add Action
                  </button>
                </div>
                
                <div id=\"actions-container\" class=\"actions-container\">
                  <!-- Actions will be dynamically added here -->
                </div>
                
                <div id=\"no-actions\" class=\"no-actions\">
                  <p>📝 No actions configured. Click \"Add Action\" to get started.</p>
                </div>
              </div>
            </form>
          </div>
          
          <div class=\"uba-modal-footer automation-footer\">
            <div class=\"footer-info\">
              <small id=\"validation-message\" class=\"validation-message\"></small>
            </div>
            <div class=\"footer-actions\">
              <button type=\"button\" class=\"uba-btn uba-btn-ghost\" 
                      onclick=\"window.UBAEnhancedAutomations.closeModal()\">Cancel</button>
              <button type=\"button\" class=\"uba-btn uba-btn-danger\" id=\"delete-automation-btn\" 
                      onclick=\"window.UBAEnhancedAutomations.deleteAutomation()\" style=\"display: none;\">Delete</button>
              <button type=\"button\" class=\"uba-btn uba-btn-primary\" 
                      onclick=\"window.UBAEnhancedAutomations.saveAutomation()\">Save Automation</button>
            </div>
          </div>
        </div>
      `;
    },
    
    /**
     * Setup validation rules
     */
    setupValidationRules() {
      console.log('✅ Setting up validation rules');
      
      this.validationRules = {
        name: {
          required: true,
          minLength: 3,
          maxLength: 100,
          message: 'Automation name must be between 3-100 characters'
        },
        trigger: {
          required: true,
          message: 'Please select a trigger'
        },
        actions: {
          minLength: 1,
          message: 'At least one action is required'
        }
      };
    },
    
    /**
     * Validate automation
     */
    validateAutomation(automationData) {
      const errors = [];
      
      // Validate name
      if (!automationData.name || automationData.name.length < 3) {
        errors.push('Automation name is required (minimum 3 characters)');
      }
      
      // Validate trigger
      if (!automationData.trigger) {
        errors.push('Please select a trigger');
      }
      
      // Validate actions
      if (!automationData.actions || automationData.actions.length === 0) {
        errors.push('At least one action is required');
      }
      
      // Validate each action
      if (automationData.actions) {
        automationData.actions.forEach((action, index) => {
          if (!action.type) {
            errors.push(`Action ${index + 1}: Action type is required`);
          }
          
          const actionDef = this.actions[action.type];
          if (actionDef && actionDef.config) {
            Object.entries(actionDef.config).forEach(([key, configDef]) => {
              if (configDef.required && (!action.config || !action.config[key])) {
                errors.push(`Action ${index + 1}: ${key} is required`);
              }
            });
          }
        });
      }
      
      return errors;
    },
    
    /**
     * Add toggle controls to existing automations
     */
    addToggleControls() {
      console.log('🎛️ Adding toggle controls');
      
      // This will enhance the existing table with toggle switches
      this.enhanceAutomationsTable();
    },
    
    /**
     * Enhance existing automations table
     */
    enhanceAutomationsTable() {
      // Override the existing renderAutomationsTable function
      const originalRender = window.renderAutomationsTable;
      
      window.renderAutomationsTable = () => {
        // Call original if exists
        if (originalRender) {
          originalRender();
        }
        
        // Enhance with our data and controls
        this.renderEnhancedAutomationsTable();
      };
    },
    
    /**
     * Render enhanced automations table
     */
    renderEnhancedAutomationsTable() {
      const tableBody = document.getElementById('automations-body');
      if (!tableBody) return;
      
      tableBody.innerHTML = this.automations.map(automation => {
        const trigger = this.triggers[automation.trigger];
        const lastTriggered = automation.lastTriggered ? 
          new Date(automation.lastTriggered).toLocaleDateString() : 'Never';
        
        return `
          <tr class=\"automation-row ${automation.enabled ? 'enabled' : 'disabled'}\" 
              data-automation-id=\"${automation.id}\">
            <td class=\"automation-name-cell\">
              <div class=\"automation-info\">
                <strong class=\"automation-name\">${automation.name}</strong>
                <small class=\"automation-description\">${automation.description || 'No description'}</small>
              </div>
            </td>
            <td class=\"automation-trigger-cell\">
              <div class=\"trigger-display\">
                <span class=\"trigger-icon\">${trigger?.icon || '🤖'}</span>
                <span class=\"trigger-name\">${trigger?.name || 'Unknown Trigger'}</span>
              </div>
            </td>
            <td class=\"automation-actions-cell\">
              <div class=\"actions-summary\">
                ${automation.actions.map(action => {
                  const actionDef = this.actions[action.type];
                  return `<span class=\"action-badge\">${actionDef?.icon || '⚡'} ${actionDef?.name || action.type}</span>`;
                }).join('')}
              </div>
            </td>
            <td class=\"automation-stats-cell\">
              <div class=\"stats-info\">
                <div class=\"trigger-count\">${automation.triggerCount || 0} executions</div>
                <div class=\"last-triggered\">Last: ${lastTriggered}</div>
              </div>
            </td>
            <td class=\"automation-status-cell\">
              <label class=\"toggle-switch\">
                <input type=\"checkbox\" ${automation.enabled ? 'checked' : ''} 
                       onchange=\"window.UBAEnhancedAutomations.toggleAutomation('${automation.id}')\" />
                <span class=\"toggle-slider\"></span>
              </label>
            </td>
            <td class=\"automation-actions-cell\">
              <div class=\"action-buttons\">
                <button class=\"uba-btn uba-btn-sm uba-btn-ghost\" 
                        onclick=\"window.UBAEnhancedAutomations.editAutomation('${automation.id}')\" 
                        title=\"Edit automation\">
                  ✏️
                </button>
                <button class=\"uba-btn uba-btn-sm uba-btn-danger\" 
                        onclick=\"window.UBAEnhancedAutomations.deleteAutomationFromTable('${automation.id}')\" 
                        title=\"Delete automation\">
                  🗑️
                </button>
                <button class=\"uba-btn uba-btn-sm uba-btn-primary\" 
                        onclick=\"window.UBAEnhancedAutomations.testAutomation('${automation.id}')\" 
                        title=\"Test automation\">
                  🧪
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },
    
    /**
     * Toggle automation enabled/disabled
     */
    toggleAutomation(automationId) {
      const automation = this.automations.find(a => a.id === automationId);
      if (automation) {
        automation.enabled = !automation.enabled;
        this.saveAutomations();
        
        this.showNotification(
          `Automation \"${automation.name}\" ${automation.enabled ? 'enabled' : 'disabled'}`,
          automation.enabled ? 'success' : 'info'
        );
      }
    },
    
    /**
     * Enhance design
     */
    enhanceDesign() {
      console.log('🎨 Enhancing design');
      
      // Add enhanced styles to the page
      this.addEnhancedStyles();
      
      // Update the create button
      this.enhanceCreateButton();
    },
    
    /**
     * Add enhanced styles
     */
    addEnhancedStyles() {
      // Enhanced styles will be loaded via CSS file
      const existingStyles = document.querySelector('link[href*=\"enhanced-automations\"]');
      if (existingStyles) return;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/css/enhanced-automations.css';
      document.head.appendChild(link);
    },
    
    /**
     * Enhance create button
     */
    enhanceCreateButton() {
      const createBtn = document.getElementById('new-automation-btn');
      if (createBtn) {
        createBtn.innerHTML = '<span class=\"icon\">➕</span> Create Automation';
        createBtn.onclick = () => this.openModal();
      }
    },
    
    /**
     * Initialize event system
     */
    initializeEventSystem() {
      // Load existing automations and start monitoring
      setTimeout(() => {
        this.renderEnhancedAutomationsTable();
      }, 1000);
    },
    
    /**
     * Save automations to storage
     */
    saveAutomations() {
      try {
        localStorage.setItem('uba-enhanced-automations', JSON.stringify(this.automations));
      } catch (error) {
        console.error('Failed to save automations:', error);
      }
    },
    
    /**
     * Save logs to storage
     */
    saveLogs() {
      try {
        localStorage.setItem('uba-automation-logs', JSON.stringify(this.logs));
      } catch (error) {
        console.error('Failed to save logs:', error);
      }
    },
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
      if (window.showToast) {
        window.showToast(message, type);
      } else {
        console.log(`${type.toUpperCase()}: ${message}`);
      }
    }
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => window.UBAEnhancedAutomations.init(), 1000);
    });
  } else {
    setTimeout(() => window.UBAEnhancedAutomations.init(), 1000);
  }
  
  console.log('✅ Enhanced Automations module loaded');
  
})();