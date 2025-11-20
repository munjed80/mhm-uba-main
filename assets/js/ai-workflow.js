/**
 * UBA AI Workflow Builder - Natural Language to Automation Converter
 * Convert natural language descriptions into automation rules
 */

(function() {
  'use strict';

  // AI Workflow namespace
  window.UBA = window.UBA || {};
  
  const AIWorkflow = {
    /**
     * Build automation from natural language
     */
    async buildFromNaturalLanguage(description) {
      console.log('[UBA AI Workflow] Building automation from:', description);
      
      try {
        const automation = this._parseDescription(description);
        
        if (!automation) {
          return {
            success: false,
            error: 'Could not parse automation description'
          };
        }
        
        // Track analytics
        if (UBA.analytics) {
          await UBA.analytics.track.trackAIAction('build-workflow', {
            description: description.substring(0, 100)
          });
        }
        
        return {
          success: true,
          automation,
          preview: JSON.stringify(automation, null, 2)
        };
      } catch (error) {
        console.error('[UBA AI Workflow] Build error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * Create automation using UBA.automations
     */
    async createAutomation(automation) {
      try {
        // Check if automations module is available
        if (!window.UBA.automations && !window.ubaStore) {
          throw new Error('Automations module not available');
        }
        
        let created;
        
        // Use data layer if available
        if (window.UBA.data && typeof UBA.data.create === 'function') {
          created = await UBA.data.create('automations', automation);
        } else if (window.ubaStore && typeof ubaStore.create === 'function') {
          created = await ubaStore.create('automations', automation);
        } else {
          throw new Error('No data layer available');
        }
        
        // Track analytics
        if (UBA.analytics) {
          await UBA.analytics.track.trackAIAction('create-automation-ai', {
            trigger: automation.trigger,
            actions: automation.actions.length
          });
        }
        
        return {
          success: true,
          automation: created,
          message: `Automation "${automation.name}" created successfully!`
        };
      } catch (error) {
        console.error('[UBA AI Workflow] Create error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    // ============ Parser Methods ============

    /**
     * Parse natural language description into automation rule
     */
    _parseDescription(description) {
      const lower = description.toLowerCase();
      
      // Detect trigger
      const trigger = this._detectTrigger(lower);
      if (!trigger) return null;
      
      // Detect conditions
      const conditions = this._detectConditions(lower);
      
      // Detect actions
      const actions = this._detectActions(lower);
      if (actions.length === 0) return null;
      
      // Detect delay
      const delay = this._detectDelay(lower);
      
      // Generate automation object
      return {
        id: this._generateId('auto'),
        name: this._generateName(trigger, actions),
        description: description,
        trigger,
        conditions: conditions.length > 0 ? conditions : undefined,
        actions,
        delay,
        enabled: true,
        createdAt: new Date().toISOString(),
        createdBy: UBA.session?.userId || 'system'
      };
    },

    /**
     * Detect trigger from description
     */
    _detectTrigger(description) {
      const triggerPatterns = {
        'invoice_created': /when (a |an )?invoice is created|new invoice|invoice.* created/i,
        'invoice_status_changed': /when invoice status|invoice (status )?chang/i,
        'invoice_overdue': /when invoice.* overdue|invoice (becomes|is) overdue/i,
        'client_created': /when (a |an )?client is (added|created)|new client/i,
        'task_created': /when (a |an )?task is created|new task/i,
        'task_completed': /when (a |an )?task is (completed|done|finished)/i,
        'lead_created': /when (a |an )?lead is (added|created)|new lead/i,
        'project_created': /when (a |an )?project is (added|created|started)|new project/i
      };
      
      for (const [trigger, pattern] of Object.entries(triggerPatterns)) {
        if (pattern.test(description)) {
          return trigger;
        }
      }
      
      return null;
    },

    /**
     * Detect conditions from description
     */
    _detectConditions(description) {
      const conditions = [];
      
      // Amount condition
      const amountMatch = description.match(/amount (is )?(?:greater than|over|above) (\d+)/i);
      if (amountMatch) {
        conditions.push({
          field: 'amount',
          operator: 'greater_than',
          value: parseFloat(amountMatch[2])
        });
      }
      
      // Status condition
      const statusMatch = description.match(/status (is |equals )?["']?(\w+)["']?/i);
      if (statusMatch) {
        conditions.push({
          field: 'status',
          operator: 'equals',
          value: statusMatch[2]
        });
      }
      
      // Priority condition
      const priorityMatch = description.match(/priority (is |equals )?["']?(high|medium|low)["']?/i);
      if (priorityMatch) {
        conditions.push({
          field: 'priority',
          operator: 'equals',
          value: priorityMatch[2].toLowerCase()
        });
      }
      
      return conditions;
    },

    /**
     * Detect actions from description
     */
    _detectActions(description) {
      const actions = [];
      
      // Create task action
      const taskMatch = description.match(/create (a |an )?task|add (a |an )?task/i);
      if (taskMatch) {
        // Try to extract task title
        const titleMatch = description.match(/task ["']([^"']+)["']|task (?:to |called )["']?([^"',.]+)["']?/i);
        const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : 'Follow up';
        
        actions.push({
          type: 'create_task',
          config: {
            taskTitle: title.trim(),
            daysOffset: this._extractDaysOffset(description) || 0
          }
        });
      }
      
      // Send notification action
      const notifyMatch = description.match(/send (a |an )?notification|notify/i);
      if (notifyMatch) {
        const messageMatch = description.match(/notification ["']([^"']+)["']|message ["']([^"']+)["']/i);
        const message = messageMatch ? (messageMatch[1] || messageMatch[2]) : 'Notification triggered';
        
        actions.push({
          type: 'show_notification',
          config: {
            message: message.trim()
          }
        });
      }
      
      // Send email action
      const emailMatch = description.match(/send (a |an )?email|email/i);
      if (emailMatch) {
        actions.push({
          type: 'send_email',
          config: {
            template: 'default',
            subject: 'Automated notification'
          }
        });
      }
      
      // Add note action
      const noteMatch = description.match(/add (a |an )?note/i);
      if (noteMatch) {
        const noteTextMatch = description.match(/note ["']([^"']+)["']/i);
        const noteText = noteTextMatch ? noteTextMatch[1] : 'Automated note';
        
        actions.push({
          type: 'add_note_to_client',
          config: {
            noteText: noteText.trim()
          }
        });
      }
      
      // Mark as overdue action
      const overdueMatch = description.match(/mark (as |invoice as )?overdue/i);
      if (overdueMatch) {
        actions.push({
          type: 'mark_invoice_as_overdue',
          config: {
            overdueDays: this._extractDaysOffset(description) || 0
          }
        });
      }
      
      return actions;
    },

    /**
     * Detect delay from description
     */
    _detectDelay(description) {
      // Check for "wait X days/hours"
      const waitMatch = description.match(/wait (\d+) (day|hour|minute)s?/i);
      if (waitMatch) {
        const amount = parseInt(waitMatch[1]);
        const unit = waitMatch[2].toLowerCase();
        
        switch (unit) {
          case 'day':
            return amount * 24 * 60 * 60 * 1000;
          case 'hour':
            return amount * 60 * 60 * 1000;
          case 'minute':
            return amount * 60 * 1000;
        }
      }
      
      // Check for "after X days/hours"
      const afterMatch = description.match(/after (\d+) (day|hour|minute)s?/i);
      if (afterMatch) {
        const amount = parseInt(afterMatch[1]);
        const unit = afterMatch[2].toLowerCase();
        
        switch (unit) {
          case 'day':
            return amount * 24 * 60 * 60 * 1000;
          case 'hour':
            return amount * 60 * 60 * 1000;
          case 'minute':
            return amount * 60 * 1000;
        }
      }
      
      return 0; // No delay
    },

    /**
     * Extract days offset for task creation
     */
    _extractDaysOffset(description) {
      const match = description.match(/(?:in|after) (\d+) days?/i);
      return match ? parseInt(match[1]) : null;
    },

    /**
     * Generate automation name from trigger and actions
     */
    _generateName(trigger, actions) {
      const triggerNames = {
        'invoice_created': 'New Invoice',
        'invoice_status_changed': 'Invoice Status Changed',
        'invoice_overdue': 'Invoice Overdue',
        'client_created': 'New Client',
        'task_created': 'New Task',
        'task_completed': 'Task Completed',
        'lead_created': 'New Lead',
        'project_created': 'New Project'
      };
      
      const actionNames = {
        'create_task': 'Create Task',
        'show_notification': 'Send Notification',
        'send_email': 'Send Email',
        'add_note_to_client': 'Add Note',
        'mark_invoice_as_overdue': 'Mark Overdue'
      };
      
      const triggerName = triggerNames[trigger] || trigger;
      const actionList = actions.map(a => actionNames[a.type] || a.type).join(' + ');
      
      return `${triggerName} → ${actionList}`;
    },

    /**
     * Show Workflow Builder Panel
     */
    showBuilder() {
      const panel = document.getElementById('ai-workflow-builder-panel');
      if (!panel) {
        this._createBuilderPanel();
        return this.showBuilder();
      }
      
      if (window.showModal) {
        window.showModal('ai-workflow-builder-panel');
      } else {
        panel.style.display = 'flex';
      }
    },

    /**
     * Hide Workflow Builder Panel
     */
    hideBuilder() {
      const panel = document.getElementById('ai-workflow-builder-panel');
      if (panel) {
        if (window.hideModal) {
          window.hideModal('ai-workflow-builder-panel');
        } else {
          panel.style.display = 'none';
        }
      }
    },

    /**
     * Create Workflow Builder Panel
     */
    _createBuilderPanel() {
      const panel = document.createElement('div');
      panel.id = 'ai-workflow-builder-panel';
      panel.className = 'uba-modal is-hidden';
      panel.innerHTML = `
        <div class="uba-modal-backdrop"></div>
        <div class="uba-modal-content" style="max-width: 700px;">
          <div class="uba-modal-header">
            <h2>🤖 AI Workflow Builder</h2>
            <button class="uba-modal-close" onclick="UBA.ai.workflow.hideBuilder()">×</button>
          </div>
          <div class="uba-modal-body">
            <p style="margin-bottom: 16px; color: var(--text-secondary);">
              Describe your automation in plain English and let AI convert it to a workflow.
            </p>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Describe your automation:</label>
              <textarea 
                id="ai-workflow-description" 
                class="ai-workflow-input" 
                placeholder="Example: When a new lead is added, wait 2 days then create a task to follow up"
                rows="4"
              ></textarea>
            </div>
            <div style="margin-bottom: 16px;">
              <button class="uba-btn" onclick="UBA.ai.workflow.handleBuild()">
                ✨ Build Automation
              </button>
            </div>
            <div id="ai-workflow-preview-container" style="display: none;">
              <h3 style="font-size: 14px; margin-bottom: 8px;">Preview:</h3>
              <div id="ai-workflow-preview" class="ai-workflow-preview"></div>
            </div>
          </div>
          <div class="uba-modal-footer">
            <button class="uba-btn-secondary" onclick="UBA.ai.workflow.hideBuilder()">Cancel</button>
            <button class="uba-btn" id="ai-workflow-create-btn" onclick="UBA.ai.workflow.handleCreate()" style="display: none;">
              💾 Create Automation
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    },

    /**
     * Handle build button
     */
    async handleBuild() {
      const description = document.getElementById('ai-workflow-description').value.trim();
      
      if (!description) {
        alert('Please describe your automation');
        return;
      }
      
      const result = await this.buildFromNaturalLanguage(description);
      
      if (!result.success) {
        alert(result.error || 'Failed to build automation. Try rephrasing your description.');
        return;
      }
      
      // Show preview
      const previewContainer = document.getElementById('ai-workflow-preview-container');
      const preview = document.getElementById('ai-workflow-preview');
      const createBtn = document.getElementById('ai-workflow-create-btn');
      
      if (previewContainer && preview && createBtn) {
        preview.textContent = result.preview;
        previewContainer.style.display = 'block';
        createBtn.style.display = 'block';
        
        // Store automation for creation
        this.currentAutomation = result.automation;
      }
    },

    /**
     * Handle create button
     */
    async handleCreate() {
      if (!this.currentAutomation) {
        alert('No automation to create');
        return;
      }
      
      const result = await this.createAutomation(this.currentAutomation);
      
      if (result.success) {
        alert(result.message);
        this.hideBuilder();
        
        // Clear form
        document.getElementById('ai-workflow-description').value = '';
        document.getElementById('ai-workflow-preview-container').style.display = 'none';
        document.getElementById('ai-workflow-create-btn').style.display = 'none';
        this.currentAutomation = null;
        
        // Reload page if on automations page
        if (window.location.pathname.includes('automations.html')) {
          window.location.reload();
        }
      } else {
        alert(result.error || 'Failed to create automation');
      }
    },

    /**
     * Generate unique ID
     */
    _generateId(prefix = 'id') {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  // Expose to UBA namespace
  UBA.ai = UBA.ai || {};
  UBA.ai.workflow = AIWorkflow;

  console.log('[UBA AI Workflow] Workflow Builder module loaded');

})();
