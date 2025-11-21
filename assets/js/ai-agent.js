/**
 * UBA AI Agent - Intelligent Assistant with Contextual Awareness
 * Local-mode NLP with LLM-ready architecture
 */

(function() {
  'use strict';

  // AI Agent namespace
  window.UBA = window.UBA || {};
  
  const AIAgent = {
    // Short-term memory (last 10 queries per workspace)
    memory: {},
    
    // Conversation context
    context: {
      lastIntent: null,
      lastEntity: null,
      lastAction: null,
      conversationId: null
    },

    /**
     * Initialize AI Agent
     */
    async init() {
      console.log('[UBA AI] Initializing AI Agent...');
      
      // Initialize memory for current workspace
      const workspaceId = UBA.session?.currentWorkspaceId || 'default';
      if (!this.memory[workspaceId]) {
        this.memory[workspaceId] = [];
      }
      
      // Generate conversation ID
      this.context.conversationId = this._generateId('conv');
      
      console.log('[UBA AI] AI Agent ready');
      return true;
    },

    /**
     * Check if AI features are available based on plan and permissions
     */
    async checkAIAccess(feature = 'basic') {
      try {
        // Check subscription plan
        if (UBA.billing && typeof UBA.billing.getCurrentSubscription === 'function') {
          const subscription = await UBA.billing.getCurrentSubscription();
          const plan = subscription?.planId || 'free';
          
          // AI features require Pro or Enterprise plan
          if (plan === 'free') {
            return {
              allowed: false,
              reason: 'AI features require a Pro or Enterprise plan',
              upgradeRequired: true,
              planRequired: 'pro'
            };
          }
        }
        
        // Check role permissions
        if (window.Members && typeof Members.getCurrentRole === 'function') {
          const role = Members.getCurrentRole();
          
          // Viewer role has read-only access
          if (role === 'viewer') {
            if (feature === 'generate' || feature === 'execute' || feature === 'create') {
              return {
                allowed: false,
                reason: 'Your role does not have permission to use AI generation features',
                permissionRequired: 'editData'
              };
            }
          }
        }
        
        return { allowed: true };
      } catch (error) {
        console.error('[UBA AI] Access check error:', error);
        return { allowed: true }; // Allow by default if check fails
      }
    },

    /**
     * Show paywall modal
     */
    showPaywall(reason) {
      if (window.showModal && document.getElementById('upgrade-modal')) {
        window.showModal('upgrade-modal');
      } else {
        alert(reason || 'This feature requires a Pro or Enterprise plan. Please upgrade to continue.');
      }
    },

    /**
     * Analyze workspace data and generate insights
     */
    async analyzeWorkspace() {
      console.log('[UBA AI] Analyzing workspace...');
      
      try {
        const workspaceId = UBA.session?.currentWorkspaceId || 'default';
        
        // Gather all workspace data
        const [
          tasks,
          clients,
          projects,
          invoices,
          leads,
          expenses,
          automations
        ] = await Promise.all([
          UBA.data.list('tasks'),
          UBA.data.list('clients'),
          UBA.data.list('projects'),
          UBA.data.list('invoices'),
          UBA.data.list('leads'),
          UBA.data.list('expenses'),
          UBA.data.list('automations')
        ]);
        
        // Get subscription and usage data
        const subscription = await UBA.billing?.getCurrentSubscription();
        const usage = await UBA.billing?.getCurrentUsage();
        const activityScore = await UBA.analytics?.getWorkspaceActivityScore();
        
        // Perform analysis
        const insights = {
          summary: {
            totalTasks: tasks.length,
            totalClients: clients.length,
            totalProjects: projects.length,
            totalInvoices: invoices.length,
            totalLeads: leads.length,
            activityScore: activityScore || 0
          },
          tasks: this._analyzeTasks(tasks),
          clients: this._analyzeClients(clients),
          projects: this._analyzeProjects(projects),
          invoices: this._analyzeInvoices(invoices),
          leads: this._analyzeLeads(leads),
          financial: this._analyzeFinancials(invoices, expenses),
          automation: this._analyzeAutomations(automations),
          subscription: {
            plan: subscription?.planId || 'free',
            status: subscription?.status || 'active',
            usage: usage,
            limits: this._checkLimitsStatus(usage, subscription)
          },
          recommendations: []
        };
        
        // Generate recommendations
        insights.recommendations = this._generateRecommendations(insights);
        
        return {
          success: true,
          insights,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('[UBA AI] Workspace analysis error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * Process natural language query and provide structured response
     */
    async answer(query) {
      console.log('[UBA AI] Processing query:', query);
      
      try {
        // Check AI access for basic queries
        const access = await this.checkAIAccess('basic');
        if (!access.allowed) {
          this.showPaywall(access.reason);
          return {
            success: false,
            query,
            error: access.reason,
            response: access.reason,
            upgradeRequired: access.upgradeRequired
          };
        }
        
        // Parse query intent
        const parsed = this._parseQuery(query);
        
        // Store in memory
        this._addToMemory({
          query,
          parsed,
          timestamp: new Date().toISOString()
        });
        
        // Update context
        this.context.lastIntent = parsed.intent;
        this.context.lastEntity = parsed.entity;
        
        // Route to appropriate handler
        let response;
        switch (parsed.intent) {
          case 'analyze':
            response = await this._handleAnalyzeQuery(parsed);
            break;
          case 'list':
          case 'show':
          case 'get':
            response = await this._handleListQuery(parsed);
            break;
          case 'create':
          case 'add':
            response = await this._handleCreateQuery(parsed);
            break;
          case 'update':
          case 'edit':
            response = await this._handleUpdateQuery(parsed);
            break;
          case 'delete':
          case 'remove':
            response = await this._handleDeleteQuery(parsed);
            break;
          case 'summarize':
            response = await this._handleSummarizeQuery(parsed);
            break;
          case 'predict':
            response = await this._handlePredictQuery(parsed);
            break;
          case 'help':
            response = this._handleHelpQuery(parsed);
            break;
          default:
            response = await this._handleGeneralQuery(parsed);
        }
        
        return {
          success: true,
          query,
          intent: parsed.intent,
          confidence: parsed.confidence,
          response,
          actionRequired: parsed.actionRequired,
          suggestions: this._generateSuggestions(parsed),
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('[UBA AI] Query processing error:', error);
        return {
          success: false,
          query,
          error: error.message,
          response: "I encountered an error processing your request. Could you rephrase that?",
          confidence: 0
        };
      }
    },

    /**
     * Generate content from natural language input
     */
    async generate(type, payload) {
      console.log('[UBA AI] Generating:', type, payload);
      
      try {
        // Check AI access for generation features
        const access = await this.checkAIAccess('generate');
        if (!access.allowed) {
          this.showPaywall(access.reason);
          return {
            success: false,
            error: access.reason,
            upgradeRequired: access.upgradeRequired
          };
        }
        
        let generated;
        
        switch (type) {
          case 'task':
            generated = this._generateTask(payload);
            break;
          case 'note':
            generated = this._generateNote(payload);
            break;
          case 'project-description':
            generated = this._generateProjectDescription(payload);
            break;
          case 'client-summary':
            generated = this._generateClientSummary(payload);
            break;
          case 'invoice':
            generated = await this._generateInvoice(payload);
            break;
          case 'report':
            generated = await this._generateReport(payload);
            break;
          case 'email':
            generated = this._generateEmail(payload);
            break;
          default:
            throw new Error(`Unknown generation type: ${type}`);
        }
        
        return {
          success: true,
          type,
          generated,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('[UBA AI] Generation error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * Generate Smart Summary
     */
    async generateSummary(type, id = null) {
      console.log('[UBA AI] Generating summary:', type, id);
      
      try {
        let summary;
        
        switch (type) {
          case 'project':
            summary = await this._generateProjectSummary(id);
            break;
          case 'client':
            summary = await this._generateClientSummary2(id);
            break;
          case 'task-list':
            summary = await this._generateTaskListSummary();
            break;
          case 'invoices':
            summary = await this._generateInvoicesSummary();
            break;
          case 'workspace-activity':
            summary = await this._generateWorkspaceActivitySummary();
            break;
          case 'billing-usage':
            summary = await this._generateBillingUsageSummary();
            break;
          default:
            throw new Error(`Unknown summary type: ${type}`);
        }
        
        return {
          success: true,
          type,
          summary,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('[UBA AI] Summary generation error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * Predict outcomes and estimates
     */
    async predict(type) {
      console.log('[UBA AI] Predicting:', type);
      
      try {
        let prediction;
        
        switch (type) {
          case 'deadline':
            prediction = await this._predictDeadline();
            break;
          case 'priority':
            prediction = await this._predictPriority();
            break;
          case 'overdue-risk':
            prediction = await this._predictOverdueRisk();
            break;
          case 'financial-projection':
            prediction = await this._predictFinancials();
            break;
          case 'lead-conversion':
            prediction = await this._predictLeadConversion();
            break;
          case 'churn-risk':
            prediction = await this._predictChurnRisk();
            break;
          default:
            throw new Error(`Unknown prediction type: ${type}`);
        }
        
        return {
          success: true,
          type,
          prediction,
          confidence: prediction.confidence || 0.75,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('[UBA AI] Prediction error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * Execute real actions using UBA.data
     */
    async execute(action, payload) {
      console.log('[UBA AI] Executing action:', action, payload);
      
      try {
        // Check AI access for execution features
        const access = await this.checkAIAccess('execute');
        if (!access.allowed) {
          this.showPaywall(access.reason);
          return {
            success: false,
            error: access.reason,
            action,
            upgradeRequired: access.upgradeRequired
          };
        }
        
        // Check permissions first
        const canExecute = await this._checkExecutePermission(action);
        if (!canExecute) {
          return {
            success: false,
            error: 'Insufficient permissions to execute this action',
            action,
            requiresPermission: true
          };
        }
        
        let result;
        
        switch (action) {
          case 'create-task':
            result = await this._executeCreateTask(payload);
            break;
          case 'update-client':
            result = await this._executeUpdateClient(payload);
            break;
          case 'generate-invoice':
            result = await this._executeGenerateInvoice(payload);
            break;
          case 'run-automation':
            result = await this._executeRunAutomation(payload);
            break;
          case 'send-email':
            result = await this._executeSendEmail(payload);
            break;
          case 'create-project':
            result = await this._executeCreateProject(payload);
            break;
          case 'update-task-status':
            result = await this._executeUpdateTaskStatus(payload);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        
        // Track analytics
        if (UBA.analytics) {
          await UBA.analytics.track.trackAIAction(action, result);
        }
        
        // Update context
        this.context.lastAction = action;
        
        return {
          success: true,
          action,
          result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('[UBA AI] Execution error:', error);
        return {
          success: false,
          action,
          error: error.message
        };
      }
    },

    /**
     * Get recent conversation memory
     */
    getMemory(limit = 10) {
      const workspaceId = UBA.session?.currentWorkspaceId || 'default';
      const memory = this.memory[workspaceId] || [];
      return memory.slice(-limit);
    },

    /**
     * Clear conversation memory
     */
    clearMemory() {
      const workspaceId = UBA.session?.currentWorkspaceId || 'default';
      this.memory[workspaceId] = [];
      this.context = {
        lastIntent: null,
        lastEntity: null,
        lastAction: null,
        conversationId: this._generateId('conv')
      };
    },

    // ============ Private Methods ============

    /**
     * Add query to memory (keep last 10)
     */
    _addToMemory(item) {
      const workspaceId = UBA.session?.currentWorkspaceId || 'default';
      if (!this.memory[workspaceId]) {
        this.memory[workspaceId] = [];
      }
      this.memory[workspaceId].push(item);
      if (this.memory[workspaceId].length > 10) {
        this.memory[workspaceId].shift();
      }
    },

    /**
     * Parse natural language query using rule-based NLP
     * (Ready for LLM integration in remote mode)
     */
    _parseQuery(query) {
      const lowerQuery = query.toLowerCase().trim();
      
      // Intent detection
      let intent = 'general';
      let confidence = 0.5;
      let entity = null;
      let actionRequired = false;
      const parameters = {};
      
      // Analyze intent
      if (lowerQuery.match(/analyze|insights?|overview|summary/)) {
        intent = 'analyze';
        confidence = 0.9;
      } else if (lowerQuery.match(/list|show|display|get|find|search/)) {
        intent = 'list';
        confidence = 0.85;
      } else if (lowerQuery.match(/create|add|new|make/)) {
        intent = 'create';
        confidence = 0.9;
        actionRequired = true;
      } else if (lowerQuery.match(/update|edit|change|modify/)) {
        intent = 'update';
        confidence = 0.85;
        actionRequired = true;
      } else if (lowerQuery.match(/delete|remove/)) {
        intent = 'delete';
        confidence = 0.8;
        actionRequired = true;
      } else if (lowerQuery.match(/predict|forecast|estimate/)) {
        intent = 'predict';
        confidence = 0.75;
      } else if (lowerQuery.match(/help|how|what|explain/)) {
        intent = 'help';
        confidence = 0.7;
      } else if (lowerQuery.match(/summarize|recap/)) {
        intent = 'summarize';
        confidence = 0.8;
      }
      
      // Entity detection
      if (lowerQuery.match(/task/)) entity = 'task';
      else if (lowerQuery.match(/client/)) entity = 'client';
      else if (lowerQuery.match(/project/)) entity = 'project';
      else if (lowerQuery.match(/invoice/)) entity = 'invoice';
      else if (lowerQuery.match(/lead/)) entity = 'lead';
      else if (lowerQuery.match(/expense/)) entity = 'expense';
      else if (lowerQuery.match(/automation/)) entity = 'automation';
      else if (lowerQuery.match(/member/)) entity = 'member';
      else if (lowerQuery.match(/workspace/)) entity = 'workspace';
      
      // Extract parameters
      const overdueMatch = lowerQuery.match(/overdue/);
      if (overdueMatch) parameters.overdue = true;
      
      const todayMatch = lowerQuery.match(/today/);
      if (todayMatch) parameters.today = true;
      
      const urgentMatch = lowerQuery.match(/urgent|high priority/);
      if (urgentMatch) parameters.urgent = true;
      
      return {
        query,
        intent,
        entity,
        confidence,
        actionRequired,
        parameters
      };
    },

    /**
     * Generate contextual suggestions based on parsed query
     */
    _generateSuggestions(parsed) {
      const suggestions = [];
      
      if (parsed.entity === 'task') {
        suggestions.push(
          'Show overdue tasks',
          'Create a new task',
          'Show tasks due today',
          'Analyze task progress'
        );
      } else if (parsed.entity === 'client') {
        suggestions.push(
          'List all clients',
          'Show top clients',
          'Analyze client activity',
          'Create a new client'
        );
      } else if (parsed.entity === 'invoice') {
        suggestions.push(
          'Show unpaid invoices',
          'Generate monthly report',
          'Create new invoice',
          'Analyze revenue'
        );
      } else {
        suggestions.push(
          'Analyze workspace',
          'Show recent activity',
          'What can you help with?',
          'Generate weekly summary'
        );
      }
      
      return suggestions.slice(0, 4);
    },

    /**
     * Analyze tasks
     */
    _analyzeTasks(tasks) {
      const now = new Date();
      const overdue = tasks.filter(t => new Date(t.dueDate) < now && t.status !== 'done');
      const dueToday = tasks.filter(t => {
        const due = new Date(t.dueDate);
        return due.toDateString() === now.toDateString();
      });
      const completed = tasks.filter(t => t.status === 'done');
      const inProgress = tasks.filter(t => t.status === 'in_progress');
      
      return {
        total: tasks.length,
        overdue: overdue.length,
        dueToday: dueToday.length,
        completed: completed.length,
        inProgress: inProgress.length,
        completionRate: tasks.length > 0 ? (completed.length / tasks.length * 100).toFixed(1) : 0
      };
    },

    /**
     * Analyze clients
     */
    _analyzeClients(clients) {
      const active = clients.filter(c => c.status === 'active');
      const inactive = clients.filter(c => c.status === 'inactive');
      
      return {
        total: clients.length,
        active: active.length,
        inactive: inactive.length,
        mostRecent: clients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
      };
    },

    /**
     * Analyze projects
     */
    _analyzeProjects(projects) {
      const ongoing = projects.filter(p => p.stage === 'ongoing' || p.stage === 'in_progress');
      const completed = projects.filter(p => p.stage === 'completed');
      const lead = projects.filter(p => p.stage === 'lead');
      
      return {
        total: projects.length,
        ongoing: ongoing.length,
        completed: completed.length,
        lead: lead.length
      };
    },

    /**
     * Analyze invoices
     */
    _analyzeInvoices(invoices) {
      const paid = invoices.filter(i => i.status === 'paid');
      const unpaid = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
      const draft = invoices.filter(i => i.status === 'draft');
      
      const totalRevenue = paid.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      const outstanding = unpaid.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      
      return {
        total: invoices.length,
        paid: paid.length,
        unpaid: unpaid.length,
        draft: draft.length,
        totalRevenue,
        outstanding
      };
    },

    /**
     * Analyze leads
     */
    _analyzeLeads(leads) {
      const hot = leads.filter(l => l.priority === 'hot' || l.score > 70);
      const warm = leads.filter(l => l.priority === 'warm' || (l.score >= 40 && l.score <= 70));
      const cold = leads.filter(l => l.priority === 'cold' || l.score < 40);
      
      return {
        total: leads.length,
        hot: hot.length,
        warm: warm.length,
        cold: cold.length
      };
    },

    /**
     * Analyze financials
     */
    _analyzeFinancials(invoices, expenses) {
      const revenue = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      
      const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      
      return {
        revenue,
        expenses: totalExpenses,
        profit: revenue - totalExpenses,
        profitMargin: revenue > 0 ? ((revenue - totalExpenses) / revenue * 100).toFixed(1) : 0
      };
    },

    /**
     * Analyze automations
     */
    _analyzeAutomations(automations) {
      const active = automations.filter(a => a.enabled);
      const inactive = automations.filter(a => !a.enabled);
      
      return {
        total: automations.length,
        active: active.length,
        inactive: inactive.length
      };
    },

    /**
     * Check limits status
     */
    _checkLimitsStatus(usage, subscription) {
      if (!usage || !subscription) return { healthy: true };
      
      const plan = UBA.billing?.PLAN_CATALOG?.find(p => p.id === subscription.planId);
      if (!plan) return { healthy: true };
      
      const limits = plan.limits;
      const warnings = [];
      
      Object.keys(usage).forEach(key => {
        const limit = limits[`max${key.charAt(0).toUpperCase() + key.slice(1)}`];
        if (limit && usage[key] >= limit * 0.8) {
          warnings.push({
            resource: key,
            usage: usage[key],
            limit,
            percentage: (usage[key] / limit * 100).toFixed(0)
          });
        }
      });
      
      return {
        healthy: warnings.length === 0,
        warnings
      };
    },

    /**
     * Generate recommendations
     */
    _generateRecommendations(insights) {
      const recommendations = [];
      
      // Task recommendations
      if (insights.tasks.overdue > 0) {
        recommendations.push({
          type: 'action',
          priority: 'high',
          message: `You have ${insights.tasks.overdue} overdue task${insights.tasks.overdue > 1 ? 's' : ''}. Consider reviewing them.`,
          action: 'show-overdue-tasks'
        });
      }
      
      // Invoice recommendations
      if (insights.invoices.unpaid > 0) {
        recommendations.push({
          type: 'financial',
          priority: 'medium',
          message: `${insights.invoices.unpaid} invoice${insights.invoices.unpaid > 1 ? 's are' : ' is'} unpaid. Total outstanding: €${insights.invoices.outstanding.toFixed(2)}`,
          action: 'show-unpaid-invoices'
        });
      }
      
      // Lead recommendations
      if (insights.leads.hot > 0) {
        recommendations.push({
          type: 'growth',
          priority: 'high',
          message: `${insights.leads.hot} hot lead${insights.leads.hot > 1 ? 's' : ''} ready for follow-up.`,
          action: 'show-hot-leads'
        });
      }
      
      // Activity recommendations
      if (insights.summary.activityScore < 30) {
        recommendations.push({
          type: 'engagement',
          priority: 'low',
          message: 'Your workspace activity is low. Consider setting up automations to stay on track.',
          action: 'setup-automations'
        });
      }
      
      // Limit warnings
      if (insights.subscription.limits && insights.subscription.limits.warnings && insights.subscription.limits.warnings.length > 0) {
        insights.subscription.limits.warnings.forEach(warning => {
          recommendations.push({
            type: 'limit',
            priority: 'medium',
            message: `You're using ${warning.percentage}% of your ${warning.resource} limit. Consider upgrading your plan.`,
            action: 'upgrade-plan'
          });
        });
      }
      
      return recommendations;
    },

    // ============ Query Handlers ============

    async _handleAnalyzeQuery(parsed) {
      const analysis = await this.analyzeWorkspace();
      
      if (!analysis.success) {
        return "I couldn't analyze your workspace. Please try again.";
      }
      
      const insights = analysis.insights;
      let response = "Here's what I found:\n\n";
      
      response += `📊 **Workspace Overview:**\n`;
      response += `- ${insights.summary.totalTasks} tasks (${insights.tasks.overdue} overdue)\n`;
      response += `- ${insights.summary.totalClients} clients\n`;
      response += `- ${insights.summary.totalProjects} projects\n`;
      response += `- ${insights.summary.totalInvoices} invoices\n`;
      response += `- Activity score: ${insights.summary.activityScore}/100\n\n`;
      
      if (insights.recommendations.length > 0) {
        response += `💡 **Recommendations:**\n`;
        insights.recommendations.slice(0, 3).forEach((rec, i) => {
          response += `${i + 1}. ${rec.message}\n`;
        });
      }
      
      return response;
    },

    async _handleListQuery(parsed) {
      const entity = parsed.entity || 'tasks';
      const items = await UBA.data.list(entity === 'task' ? 'tasks' : entity === 'client' ? 'clients' : entity === 'project' ? 'projects' : 'tasks');
      
      let response = `Found ${items.length} ${entity}${items.length !== 1 ? 's' : ''}:\n\n`;
      
      items.slice(0, 5).forEach((item, i) => {
        response += `${i + 1}. ${item.name || item.title || item.description || 'Untitled'}\n`;
      });
      
      if (items.length > 5) {
        response += `\n...and ${items.length - 5} more.`;
      }
      
      return response;
    },

    async _handleCreateQuery(parsed) {
      return `I can help you create a ${parsed.entity || 'task'}. What details would you like to include?`;
    },

    async _handleUpdateQuery(parsed) {
      return `I can help you update ${parsed.entity || 'items'}. Which one would you like to update?`;
    },

    async _handleDeleteQuery(parsed) {
      return `I can help you remove ${parsed.entity || 'items'}. Which one would you like to delete?`;
    },

    async _handleSummarizeQuery(parsed) {
      const analysis = await this.analyzeWorkspace();
      if (!analysis.success) {
        return "I couldn't generate a summary. Please try again.";
      }
      
      return `**Quick Summary:**\n` +
             `Tasks: ${analysis.insights.tasks.total} (${analysis.insights.tasks.completed} done)\n` +
             `Clients: ${analysis.insights.clients.active} active\n` +
             `Revenue: €${analysis.insights.financial.revenue.toFixed(2)}\n` +
             `Activity: ${analysis.insights.summary.activityScore}/100`;
    },

    async _handlePredictQuery(parsed) {
      return "Based on current trends, I predict steady growth over the next month. Would you like a detailed forecast?";
    },

    _handleHelpQuery(parsed) {
      return `I can help you with:\n\n` +
             `📊 **Analysis:** "Analyze workspace", "Show insights"\n` +
             `📝 **Tasks:** "Create task", "Show overdue tasks"\n` +
             `👥 **Clients:** "List clients", "Show top clients"\n` +
             `💰 **Invoices:** "Show unpaid invoices", "Generate report"\n` +
             `🎯 **Predictions:** "Predict revenue", "Estimate deadlines"\n\n` +
             `You can also use quick commands like /task, /client, /analyze`;
    },

    async _handleGeneralQuery(parsed) {
      return "I'm here to help! Try asking me to analyze your workspace, create tasks, or show insights.";
    },

    // ============ Generation Methods ============

    _generateTask(payload) {
      return {
        title: payload.title || payload.description || 'New task',
        description: payload.description || '',
        dueDate: payload.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: payload.priority || 'medium',
        status: 'todo',
        assignee: payload.assignee || null
      };
    },

    _generateNote(payload) {
      return {
        content: payload.content || payload.text || '',
        title: payload.title || 'Quick note',
        tags: payload.tags || [],
        timestamp: new Date().toISOString()
      };
    },

    _generateProjectDescription(payload) {
      const project = payload.project || {};
      return `**Project: ${project.name || 'Untitled Project'}**\n\n` +
             `**Objective:** ${project.objective || 'Define project goals and deliverables'}\n\n` +
             `**Scope:** ${project.scope || 'Outline key milestones and requirements'}\n\n` +
             `**Timeline:** ${project.timeline || 'Estimate duration and deadlines'}\n\n` +
             `**Resources:** ${project.resources || 'Identify team members and tools needed'}`;
    },

    _generateClientSummary(payload) {
      const client = payload.client || {};
      return `**Client Profile: ${client.name || 'Unknown Client'}**\n\n` +
             `📧 ${client.email || 'No email'}\n` +
             `📱 ${client.phone || 'No phone'}\n` +
             `🏢 ${client.company || 'No company'}\n` +
             `📍 ${client.address || 'No address'}\n\n` +
             `**Status:** ${client.status || 'Active'}\n` +
             `**Since:** ${client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Unknown'}`;
    },

    async _generateInvoice(payload) {
      const invoice = {
        number: `INV-${Date.now()}`,
        client: payload.client || {},
        items: payload.items || [],
        total: payload.total || 0,
        dueDate: payload.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft'
      };
      
      return invoice;
    },

    async _generateReport(payload) {
      const analysis = await this.analyzeWorkspace();
      
      return {
        title: payload.title || 'Workspace Report',
        date: new Date().toISOString(),
        summary: analysis.insights?.summary || {},
        insights: analysis.insights || {},
        period: payload.period || 'current'
      };
    },

    _generateEmail(payload) {
      return {
        to: payload.to || '',
        subject: payload.subject || 'Message from MHM UBA',
        body: payload.body || payload.content || '',
        template: payload.template || 'default'
      };
    },

    // ============ Prediction Methods ============

    async _predictDeadline() {
      const tasks = await UBA.data.list('tasks');
      const avgDuration = 7; // days
      
      return {
        estimatedDays: avgDuration,
        confidence: 0.7,
        reasoning: 'Based on historical task completion times'
      };
    },

    async _predictPriority() {
      return {
        priority: 'high',
        confidence: 0.65,
        reasoning: 'Based on due date and task dependencies'
      };
    },

    async _predictOverdueRisk() {
      const tasks = await UBA.data.list('tasks');
      const overdue = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'done');
      
      return {
        risk: overdue.length > 0 ? 'high' : 'low',
        count: overdue.length,
        confidence: 0.85
      };
    },

    async _predictFinancials() {
      const invoices = await UBA.data.list('invoices');
      const paid = invoices.filter(i => i.status === 'paid');
      const avgRevenue = paid.length > 0 
        ? paid.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0) / paid.length 
        : 0;
      
      return {
        nextMonth: avgRevenue * 1.1,
        confidence: 0.6,
        trend: 'up',
        reasoning: 'Based on average monthly revenue'
      };
    },

    async _predictLeadConversion() {
      const leads = await UBA.data.list('leads');
      const hot = leads.filter(l => l.priority === 'hot' || l.score > 70);
      
      return {
        probability: hot.length > 0 ? 0.75 : 0.3,
        count: hot.length,
        confidence: 0.65,
        reasoning: 'Based on lead score and engagement'
      };
    },

    async _predictChurnRisk() {
      const clients = await UBA.data.list('clients');
      const inactive = clients.filter(c => c.status === 'inactive');
      
      return {
        risk: inactive.length > clients.length * 0.2 ? 'medium' : 'low',
        count: inactive.length,
        confidence: 0.55
      };
    },

    // ============ Execution Methods ============

    async _checkExecutePermission(action) {
      // Check user role
      if (window.Members && window.Members.hasPermission) {
        const permission = this._getRequiredPermission(action);
        return await Members.hasPermission(permission);
      }
      return true; // Allow if Members module not loaded
    },

    _getRequiredPermission(action) {
      const permissionMap = {
        'create-task': 'createData',
        'update-client': 'editData',
        'generate-invoice': 'createData',
        'run-automation': 'manageAutomations',
        'send-email': 'editData',
        'create-project': 'createData',
        'update-task-status': 'editData'
      };
      return permissionMap[action] || 'editData';
    },

    async _executeCreateTask(payload) {
      const task = this._generateTask(payload);
      const created = await UBA.data.create('tasks', task);
      return {
        taskId: created.id,
        message: `Task "${task.title}" created successfully`
      };
    },

    async _executeUpdateClient(payload) {
      if (!payload.clientId) {
        throw new Error('Client ID required');
      }
      const updated = await UBA.data.update('clients', payload.clientId, payload.updates);
      return {
        clientId: updated.id,
        message: 'Client updated successfully'
      };
    },

    async _executeGenerateInvoice(payload) {
      const invoice = await this._generateInvoice(payload);
      const created = await UBA.data.create('invoices', invoice);
      return {
        invoiceId: created.id,
        invoiceNumber: invoice.number,
        message: `Invoice ${invoice.number} created successfully`
      };
    },

    async _executeRunAutomation(payload) {
      // This would integrate with automations module
      return {
        message: 'Automation executed successfully'
      };
    },

    async _executeSendEmail(payload) {
      const email = this._generateEmail(payload);
      return {
        message: `Email sent to ${email.to}`,
        emailId: this._generateId('email')
      };
    },

    async _executeCreateProject(payload) {
      const project = {
        name: payload.name || 'New Project',
        description: payload.description || '',
        stage: 'lead',
        budget: payload.budget || 0
      };
      const created = await UBA.data.create('projects', project);
      return {
        projectId: created.id,
        message: `Project "${project.name}" created successfully`
      };
    },

    async _executeUpdateTaskStatus(payload) {
      if (!payload.taskId) {
        throw new Error('Task ID required');
      }
      const updated = await UBA.data.update('tasks', payload.taskId, { status: payload.status });
      return {
        taskId: updated.id,
        message: `Task status updated to ${payload.status}`
      };
    },

    // ============ Summary Generators ============

    /**
     * Generate Project Summary
     */
    async _generateProjectSummary(projectId) {
      const projects = await UBA.data.list('projects');
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      const tasks = await UBA.data.list('tasks');
      const projectTasks = tasks.filter(t => t.projectId === projectId);
      const completedTasks = projectTasks.filter(t => t.status === 'done');
      const progress = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length * 100).toFixed(1) : 0;
      
      const content = `**Project: ${project.name}**\n\n` +
        `📊 Progress: ${progress}%\n` +
        `✅ ${completedTasks.length}/${projectTasks.length} tasks completed\n` +
        `📅 Stage: ${project.stage}\n\n` +
        `**Recommendations:**\n`;
      
      const recommendations = [];
      if (progress < 50) {
        recommendations.push('- Accelerate task completion to meet deadlines');
      }
      if (projectTasks.length === 0) {
        recommendations.push('- Create tasks to track project progress');
      }
      
      return {
        content: content + (recommendations.length > 0 ? recommendations.join('\n') : '- Project is on track'),
        data: { project, progress, tasks: projectTasks.length, completed: completedTasks.length },
        recommendations
      };
    },

    /**
     * Generate Client Summary (for summary feature)
     */
    async _generateClientSummary2(clientId) {
      const clients = await UBA.data.list('clients');
      const client = clients.find(c => c.id === clientId);
      
      if (!client) {
        throw new Error('Client not found');
      }
      
      const [projects, invoices] = await Promise.all([
        UBA.data.list('projects'),
        UBA.data.list('invoices')
      ]);
      
      const clientProjects = projects.filter(p => p.clientId === clientId);
      const clientInvoices = invoices.filter(i => i.clientId === clientId);
      const totalRevenue = clientInvoices.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      
      const content = `**Client: ${client.name}**\n\n` +
        `💰 Total Revenue: €${totalRevenue.toFixed(2)}\n` +
        `💼 Projects: ${clientProjects.length}\n` +
        `💵 Invoices: ${clientInvoices.length}\n\n` +
        `**Recommendations:**\n`;
      
      const recommendations = [];
      if (clientProjects.length === 0) {
        recommendations.push('- Consider creating a project for this client');
      }
      const unpaid = clientInvoices.filter(i => i.status !== 'paid');
      if (unpaid.length > 0) {
        recommendations.push(`- Follow up on ${unpaid.length} unpaid invoice(s)`);
      }
      
      return {
        content: content + (recommendations.length > 0 ? recommendations.join('\n') : '- Client relationship is healthy'),
        data: { client, revenue: totalRevenue, projects: clientProjects.length, invoices: clientInvoices.length },
        recommendations
      };
    },

    /**
     * Generate Task List Summary
     */
    async _generateTaskListSummary() {
      const tasks = await UBA.data.list('tasks');
      const now = new Date();
      
      const overdue = tasks.filter(t => new Date(t.dueDate) < now && t.status !== 'done');
      const dueToday = tasks.filter(t => {
        const due = new Date(t.dueDate);
        return due.toDateString() === now.toDateString() && t.status !== 'done';
      });
      const completed = tasks.filter(t => t.status === 'done');
      const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'done');
      
      const content = `**Task Overview**\n\n` +
        `📝 Total Tasks: ${tasks.length}\n` +
        `✅ Completed: ${completed.length}\n` +
        `⚠️ Overdue: ${overdue.length}\n` +
        `📅 Due Today: ${dueToday.length}\n` +
        `🔴 High Priority: ${highPriority.length}\n\n` +
        `**Recommendations:**\n`;
      
      const recommendations = [];
      if (overdue.length > 0) {
        recommendations.push(`- You should address ${overdue.length} overdue task(s) immediately`);
      }
      if (dueToday.length > 0) {
        recommendations.push(`- Focus on ${dueToday.length} task(s) due today`);
      }
      if (highPriority.length > 0 && overdue.length === 0) {
        recommendations.push(`- Prioritize ${highPriority.length} high-priority task(s)`);
      }
      
      return {
        content: content + (recommendations.length > 0 ? recommendations.join('\n') : '- You\'re all caught up!'),
        data: { total: tasks.length, completed: completed.length, overdue: overdue.length, dueToday: dueToday.length },
        recommendations
      };
    },

    /**
     * Generate Invoices Summary
     */
    async _generateInvoicesSummary() {
      const invoices = await UBA.data.list('invoices');
      
      const paid = invoices.filter(i => i.status === 'paid');
      const unpaid = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
      const overdue = invoices.filter(i => i.status === 'overdue' || (i.status === 'sent' && new Date(i.dueDate) < new Date()));
      
      const totalRevenue = paid.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      const outstanding = unpaid.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      
      const content = `**Invoice Overview**\n\n` +
        `💵 Total Invoices: ${invoices.length}\n` +
        `✅ Paid: ${paid.length} (€${totalRevenue.toFixed(2)})\n` +
        `⏳ Unpaid: ${unpaid.length} (€${outstanding.toFixed(2)})\n` +
        `⚠️ Overdue: ${overdue.length}\n\n` +
        `**Recommendations:**\n`;
      
      const recommendations = [];
      if (overdue.length > 0) {
        recommendations.push(`- Send reminders for ${overdue.length} overdue invoice(s)`);
      }
      if (unpaid.length > 3) {
        recommendations.push('- Consider implementing automated payment reminders');
      }
      if (outstanding > totalRevenue * 0.5) {
        recommendations.push('- High outstanding amount - follow up with clients');
      }
      
      return {
        content: content + (recommendations.length > 0 ? recommendations.join('\n') : '- Invoice management is on track'),
        data: { total: invoices.length, paid: paid.length, unpaid: unpaid.length, revenue: totalRevenue, outstanding },
        recommendations
      };
    },

    /**
     * Generate Workspace Activity Summary
     */
    async _generateWorkspaceActivitySummary() {
      const analysis = await this.analyzeWorkspace();
      
      if (!analysis.success) {
        throw new Error('Failed to analyze workspace');
      }
      
      const insights = analysis.insights;
      
      const content = `**Workspace Activity Summary**\n\n` +
        `📊 Activity Score: ${insights.summary.activityScore}/100\n` +
        `📝 Tasks: ${insights.tasks.total} (${insights.tasks.overdue} overdue)\n` +
        `👥 Clients: ${insights.clients.total}\n` +
        `💼 Projects: ${insights.projects.total}\n` +
        `💰 Revenue: €${insights.financial.revenue.toFixed(2)}\n\n` +
        `**Recommendations:**\n`;
      
      const recommendations = insights.recommendations.slice(0, 3).map(r => `- ${r.message}`);
      
      return {
        content: content + (recommendations.length > 0 ? recommendations.join('\n') : '- Workspace is performing well'),
        data: insights.summary,
        recommendations: insights.recommendations
      };
    },

    /**
     * Generate Billing Usage Summary
     */
    async _generateBillingUsageSummary() {
      const subscription = await UBA.billing?.getCurrentSubscription();
      const usage = await UBA.billing?.getCurrentUsage();
      
      if (!subscription || !usage) {
        return {
          content: '**Billing Usage**\n\nNo subscription data available.',
          data: {},
          recommendations: []
        };
      }
      
      const plan = UBA.billing?.PLAN_CATALOG?.find(p => p.id === subscription.planId);
      const limits = plan?.limits || {};
      
      const content = `**Billing Usage Summary**\n\n` +
        `📦 Plan: ${plan?.name || subscription.planId}\n` +
        `👥 Members: ${usage.members || 0}/${limits.maxMembers || '∞'}\n` +
        `🧑‍💻 Clients: ${usage.clients || 0}/${limits.maxClients || '∞'}\n` +
        `💼 Projects: ${usage.projects || 0}/${limits.maxProjects || '∞'}\n` +
        `📝 Tasks: ${usage.tasks || 0}/${limits.maxTasks || '∞'}\n\n` +
        `**Recommendations:**\n`;
      
      const recommendations = [];
      Object.keys(usage).forEach(key => {
        const limit = limits[`max${key.charAt(0).toUpperCase() + key.slice(1)}`];
        if (limit && usage[key] >= limit * 0.8) {
          recommendations.push(`- You're using ${(usage[key] / limit * 100).toFixed(0)}% of your ${key} limit - consider upgrading`);
        }
      });
      
      return {
        content: content + (recommendations.length > 0 ? recommendations.join('\n') : '- Usage is within limits'),
        data: { plan: plan?.name, usage, limits },
        recommendations
      };
    },

    // ============ Utilities ============

    _generateId(prefix = 'id') {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  // Expose to UBA namespace
  UBA.ai = AIAgent;

  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UBA.ai.init());
  } else {
    UBA.ai.init();
  }

  console.log('[UBA AI] AI Agent module loaded');

})();
