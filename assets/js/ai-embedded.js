/**
 * UBA AI Embedded Panels - Mini AI assistants throughout the UI
 * Contextual AI helpers for tasks, projects, clients, and invoices
 */

(function() {
  'use strict';

  // AI Embedded namespace
  window.UBA = window.UBA || {};
  
  const AIEmbedded = {
    /**
     * Show AI panel for tasks
     */
    async showTaskPanel(taskId, buttonElement) {
      try {
        const tasks = await UBA.data.list('tasks');
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
          throw new Error('Task not found');
        }
        
        const response = await UBA.ai.answer(`Suggest improvements for task: ${task.title || task.name}`);
        
        this._showPanel({
          title: 'AI Task Assistant',
          content: response.response,
          suggestions: [
            { label: 'Rewrite Task', action: () => this.rewriteTask(taskId) },
            { label: 'Suggest Subtasks', action: () => this.suggestSubtasks(taskId) },
            { label: 'Estimate Time', action: () => this.estimateTaskTime(taskId) }
          ],
          element: buttonElement
        });
      } catch (error) {
        console.error('[AI Embedded] Task panel error:', error);
        alert('Failed to show AI assistant');
      }
    },

    /**
     * Show AI panel for projects
     */
    async showProjectPanel(projectId, buttonElement) {
      try {
        const summary = await UBA.ai.generateSummary('project', projectId);
        
        if (!summary.success) {
          throw new Error(summary.error || 'Failed to generate summary');
        }
        
        this._showPanel({
          title: 'AI Project Assistant',
          content: summary.summary.content,
          suggestions: [
            { label: 'Generate Report', action: () => this.generateProjectReport(projectId) },
            { label: 'Suggest Tasks', action: () => this.suggestProjectTasks(projectId) },
            { label: 'Health Check', action: () => this.checkProjectHealth(projectId) }
          ],
          element: buttonElement
        });
      } catch (error) {
        console.error('[AI Embedded] Project panel error:', error);
        alert('Failed to show AI assistant');
      }
    },

    /**
     * Show AI panel for clients
     */
    async showClientPanel(clientId, buttonElement) {
      try {
        const summary = await UBA.ai.generateSummary('client', clientId);
        
        if (!summary.success) {
          throw new Error(summary.error || 'Failed to generate summary');
        }
        
        this._showPanel({
          title: 'AI Client Assistant',
          content: summary.summary.content,
          suggestions: [
            { label: 'Generate Follow-up', action: () => this.generateClientFollowup(clientId) },
            { label: 'View Overview', action: () => this.viewClientOverview(clientId) },
            { label: 'Suggest Upsells', action: () => this.suggestUpsells(clientId) }
          ],
          element: buttonElement
        });
      } catch (error) {
        console.error('[AI Embedded] Client panel error:', error);
        alert('Failed to show AI assistant');
      }
    },

    /**
     * Show AI panel for invoices
     */
    async showInvoicePanel(invoiceId, buttonElement) {
      try {
        const invoices = await UBA.data.list('invoices');
        const invoice = invoices.find(i => i.id === invoiceId);
        
        if (!invoice) {
          throw new Error('Invoice not found');
        }
        
        const clients = await UBA.data.list('clients');
        const client = clients.find(c => c.id === invoice.clientId);
        
        const content = `**Invoice ${invoice.number}**

` +
          `Amount: €${invoice.amount}
` +
          `Status: ${invoice.status}
` +
          `Client: ${client?.name || 'Unknown'}

` +
          `**AI Suggestions:**
` +
          (invoice.status === 'overdue' ? '- Send payment reminder immediately
' : '') +
          (invoice.status === 'sent' ? '- Follow up in 3-5 days if not paid
' : '') +
          '- Keep client communication professional and friendly';
        
        this._showPanel({
          title: 'AI Invoice Assistant',
          content,
          suggestions: [
            { label: 'Generate Reminder', action: () => this.generateInvoiceReminder(invoiceId) },
            { label: 'Payment Tips', action: () => this.showPaymentTips(invoiceId) },
            { label: 'View History', action: () => this.viewInvoiceHistory(invoiceId) }
          ],
          element: buttonElement
        });
      } catch (error) {
        console.error('[AI Embedded] Invoice panel error:', error);
        alert('Failed to show AI assistant');
      }
    },

    /**
     * Show generic AI panel
     */
    _showPanel(options) {
      // Remove any existing panels
      const existing = document.querySelector('.uba-ai-mini-panel.active');
      if (existing) {
        existing.remove();
      }
      
      // Create new panel
      const panel = document.createElement('div');
      panel.className = 'uba-ai-mini-panel active';
      
      panel.innerHTML = `
        <div class="uba-ai-mini-header">${options.title}</div>
        <div class="uba-ai-mini-content">${this._formatContent(options.content)}</div>
        <div class="uba-ai-mini-actions">
          ${options.suggestions.map((s, i) => 
            `<button onclick="window.UBA.ai.embedded._handleSuggestion(${i})">${s.label}</button>`
          ).join('')}
        </div>
        <button 
          style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: #a0aec0; cursor: pointer; font-size: 18px;"
          onclick="this.parentElement.remove()"
        >×</button>
      `;
      
      // Position panel near the button
      if (options.element) {
        const rect = options.element.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.top = `${rect.bottom + 8}px`;
        panel.style.left = `${rect.left}px`;
        panel.style.zIndex = '10000';
      }
      
      // Store suggestions for callback
      this._currentSuggestions = options.suggestions;
      
      document.body.appendChild(panel);
      
      // Auto-close on outside click
      setTimeout(() => {
        document.addEventListener('click', function closePanel(e) {
          if (!panel.contains(e.target) && !options.element.contains(e.target)) {
            panel.remove();
            document.removeEventListener('click', closePanel);
          }
        });
      }, 100);
    },

    /**
     * Handle suggestion click
     */
    _handleSuggestion(index) {
      if (this._currentSuggestions && this._currentSuggestions[index]) {
        const suggestion = this._currentSuggestions[index];
        if (typeof suggestion.action === 'function') {
          suggestion.action();
        }
      }
    },

    /**
     * Format content with simple markdown
     */
    _formatContent(content) {
      return content
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/
/g, '<br>');
    },

    // ============ Action Methods ============

    async rewriteTask(taskId) {
      const tasks = await UBA.data.list('tasks');
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        const result = await UBA.ai.answer(`Rewrite this task to be more clear and actionable: ${task.title || task.name}`);
        if (result.success && window.AIUI) {
          window.AIUI.togglePanel();
          window.AIUI.addMessage('ai', result.response);
        }
      }
    },

    async suggestSubtasks(taskId) {
      const tasks = await UBA.data.list('tasks');
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        const result = await UBA.ai.answer(`Break down this task into subtasks: ${task.title || task.name}`);
        if (result.success && window.AIUI) {
          window.AIUI.togglePanel();
          window.AIUI.addMessage('ai', result.response);
        }
      }
    },

    async estimateTaskTime(taskId) {
      const tasks = await UBA.data.list('tasks');
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        const result = await UBA.ai.answer(`Estimate how long this task will take: ${task.title || task.name}`);
        if (result.success && window.AIUI) {
          window.AIUI.togglePanel();
          window.AIUI.addMessage('ai', result.response);
        }
      }
    },

    async generateProjectReport(projectId) {
      if (window.UBA.ai.reports) {
        const result = await UBA.ai.reports.generatePDFReport('project-progress', { projectId });
        if (result.success) {
          alert('Project report generated! Check Reports section.');
        }
      }
    },

    async suggestProjectTasks(projectId) {
      const projects = await UBA.data.list('projects');
      const project = projects.find(p => p.id === projectId);
      
      if (project) {
        const result = await UBA.ai.answer(`Suggest tasks for project: ${project.name}`);
        if (result.success && window.AIUI) {
          window.AIUI.togglePanel();
          window.AIUI.addMessage('ai', result.response);
        }
      }
    },

    async checkProjectHealth(projectId) {
      const summary = await UBA.ai.generateSummary('project', projectId);
      if (summary.success && window.AIUI) {
        window.AIUI.togglePanel();
        window.AIUI.addMessage('ai', summary.summary.content);
      }
    },

    async generateClientFollowup(clientId) {
      const clients = await UBA.data.list('clients');
      const client = clients.find(c => c.id === clientId);
      
      if (client && window.UBA.ai.email) {
        const result = await UBA.ai.email.generateEmail('follow-up', {
          clientName: client.name,
          email: client.email,
          context: 'our recent project'
        });
        
        if (result.success) {
          UBA.ai.email.showEmailModal(result.email);
        }
      }
    },

    async viewClientOverview(clientId) {
      if (window.UBA.ai.reports) {
        const result = await UBA.ai.reports.generatePDFReport('client-overview', { clientId });
        if (result.success && result.html) {
          // Show in modal or new window
          const win = window.open('', '_blank');
          win.document.write(result.html);
          win.document.close();
        }
      }
    },

    async suggestUpsells(clientId) {
      const clients = await UBA.data.list('clients');
      const client = clients.find(c => c.id === clientId);
      
      if (client) {
        const result = await UBA.ai.answer(`Suggest upsell opportunities for client: ${client.name}`);
        if (result.success && window.AIUI) {
          window.AIUI.togglePanel();
          window.AIUI.addMessage('ai', result.response);
        }
      }
    },

    async generateInvoiceReminder(invoiceId) {
      const invoices = await UBA.data.list('invoices');
      const invoice = invoices.find(i => i.id === invoiceId);
      
      if (invoice && window.UBA.ai.email) {
        const clients = await UBA.data.list('clients');
        const client = clients.find(c => c.id === invoice.clientId);
        
        const result = await UBA.ai.email.generateEmail('invoice-reminder', {
          clientName: client?.name || 'Customer',
          email: client?.email || '',
          invoiceNumber: invoice.number,
          amount: invoice.amount,
          dueDate: invoice.dueDate
        });
        
        if (result.success) {
          UBA.ai.email.showEmailModal(result.email);
        }
      }
    },

    async showPaymentTips(invoiceId) {
      const result = await UBA.ai.answer('Give me tips for collecting payment on overdue invoices professionally');
      if (result.success && window.AIUI) {
        window.AIUI.togglePanel();
        window.AIUI.addMessage('ai', result.response);
      }
    },

    async viewInvoiceHistory(invoiceId) {
      const invoices = await UBA.data.list('invoices');
      const invoice = invoices.find(i => i.id === invoiceId);
      
      if (invoice) {
        const result = await UBA.ai.answer(`Show me the history and details for invoice ${invoice.number}`);
        if (result.success && window.AIUI) {
          window.AIUI.togglePanel();
          window.AIUI.addMessage('ai', result.response);
        }
      }
    },

    /**
     * Add AI button to element
     */
    addAIButton(element, type, id) {
      // Check if AI buttons are enabled in settings
      const settings = JSON.parse(localStorage.getItem('uba-settings') || '{}');
      if (settings.aiEmbeddedButtons === false) {
        return;
      }
      
      const button = document.createElement('button');
      button.className = 'uba-ai-embed-btn';
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        AI
      `;
      
      button.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        switch (type) {
          case 'task':
            this.showTaskPanel(id, button);
            break;
          case 'project':
            this.showProjectPanel(id, button);
            break;
          case 'client':
            this.showClientPanel(id, button);
            break;
          case 'invoice':
            this.showInvoicePanel(id, button);
            break;
        }
      };
      
      element.appendChild(button);
    }
  };

  // Expose to UBA namespace
  UBA.ai = UBA.ai || {};
  UBA.ai.embedded = AIEmbedded;

  console.log('[UBA AI Embedded] Embedded panels module loaded');

})();
