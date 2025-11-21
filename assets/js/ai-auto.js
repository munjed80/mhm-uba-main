/**
 * UBA AI Auto-Actions - Automated AI Agents
 * Agents that run automatically to detect issues and generate insights
 */

(function() {
  'use strict';

  // AI Auto namespace
  window.UBA = window.UBA || {};
  
  // Constants for time intervals
  const HOURLY_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  const DAILY_RUN_INTERVAL_MS = 23 * 60 * 60 * 1000; // 23 hours
  const WEEKLY_RUN_INTERVAL_MS = 6.5 * 24 * 60 * 60 * 1000; // 6.5 days
  
  // Lead follow-up configuration
  const COLD_LEAD_THRESHOLD_DAYS = 7;
  
  // Project health scoring constants
  const OVERDUE_TASK_PENALTY_PER_TASK = 10;
  const MAX_OVERDUE_TASK_PENALTY = 30;
  const OVER_BUDGET_PENALTY = 20;
  const MISSED_DEADLINE_PENALTY = 30;
  const INACTIVE_PROJECT_THRESHOLD_DAYS = 14;
  const INACTIVE_PROJECT_PENALTY = 15;
  
  const AIAuto = {
    // Configuration
    config: {
      dailyRunHour: 9, // 9 AM
      weeklyRunDay: 1, // Monday
      enabled: true,
      lastDailyRun: null,
      lastWeeklyRun: null
    },

    /**
     * Initialize Auto-Actions
     */
    async init() {
      console.log('[UBA AI Auto] Initializing Auto-Actions...');
      
      // Load config from settings
      const settings = await this._loadSettings();
      if (settings && settings.autoActionsEnabled !== undefined) {
        this.config.enabled = settings.autoActionsEnabled;
      }
      
      // Check if we should run scheduled tasks
      this._checkScheduledRuns();
      
      // Set up interval to check every hour
      setInterval(() => this._checkScheduledRuns(), HOURLY_CHECK_INTERVAL_MS);
      
      console.log('[UBA AI Auto] Auto-Actions initialized');
      return true;
    },

    /**
     * Daily Run - executed once per day
     */
    async dailyRun() {
      console.log('[UBA AI Auto] Running daily checks...');
      
      if (!this.config.enabled) {
        console.log('[UBA AI Auto] Auto-actions disabled, skipping daily run');
        return;
      }
      
      try {
        const results = [];
        
        // Run all daily checks
        results.push(await this.autoOverdueCheck());
        results.push(await this.autoLeadFollowup());
        results.push(await this.autoBillingInsights());
        
        // Update last run time
        this.config.lastDailyRun = new Date().toISOString();
        await this._saveSettings();
        
        // Track analytics
        if (UBA.analytics) {
          await UBA.analytics.track.trackAIAction('daily-run', { results });
        }
        
        console.log('[UBA AI Auto] Daily run complete:', results);
        return { success: true, results };
      } catch (error) {
        console.error('[UBA AI Auto] Daily run error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Weekly Run - executed once per week
     */
    async weeklyRun() {
      console.log('[UBA AI Auto] Running weekly checks...');
      
      if (!this.config.enabled) {
        console.log('[UBA AI Auto] Auto-actions disabled, skipping weekly run');
        return;
      }
      
      try {
        const results = [];
        
        // Run all weekly checks
        results.push(await this.autoProjectHealth());
        
        // Generate weekly summary
        if (UBA.ai && UBA.ai.generateSummary) {
          const summary = await UBA.ai.generateSummary('workspace-activity', null);
          results.push(summary);
          
          // Post to AI chat
          this._postToAIChat('📊 **Weekly Summary**

' + (summary.content || 'Summary generated'));
        }
        
        // Update last run time
        this.config.lastWeeklyRun = new Date().toISOString();
        await this._saveSettings();
        
        // Track analytics
        if (UBA.analytics) {
          await UBA.analytics.track.trackAIAction('weekly-run', { results });
        }
        
        console.log('[UBA AI Auto] Weekly run complete:', results);
        return { success: true, results };
      } catch (error) {
        console.error('[UBA AI Auto] Weekly run error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Auto Overdue Check - detect overdue tasks and notify
     */
    async autoOverdueCheck() {
      console.log('[UBA AI Auto] Checking overdue tasks...');
      
      try {
        const tasks = await UBA.data.list('tasks');
        const now = new Date();
        const overdueTasks = tasks.filter(t => {
          const dueDate = new Date(t.dueDate);
          return dueDate < now && t.status !== 'done';
        });
        
        if (overdueTasks.length > 0) {
          const message = `⚠️ **Overdue Tasks Alert**

You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}:

` +
            overdueTasks.slice(0, 5).map((t, i) => 
              `${i + 1}. ${t.title || t.name || 'Untitled'} (due ${new Date(t.dueDate).toLocaleDateString()})`
            ).join('
') +
            (overdueTasks.length > 5 ? `

...and ${overdueTasks.length - 5} more.` : '') +
            '

💡 Tip: Consider rescheduling or delegating these tasks.';
          
          this._postToAIChat(message);
          
          // Log event
          if (UBA.analytics) {
            await UBA.analytics.track.trackAIAction('auto-overdue-check', {
              overdueCount: overdueTasks.length
            });
          }
        }
        
        return {
          type: 'overdue-check',
          overdueCount: overdueTasks.length,
          alerted: overdueTasks.length > 0
        };
      } catch (error) {
        console.error('[UBA AI Auto] Overdue check error:', error);
        return { type: 'overdue-check', error: error.message };
      }
    },

    /**
     * Auto Lead Follow-up - detect cold leads and suggest follow-ups
     */
    async autoLeadFollowup() {
      console.log('[UBA AI Auto] Checking leads for follow-up...');
      
      try {
        const leads = await UBA.data.list('leads');
        const now = new Date();
        
        const coldLeads = leads.filter(lead => {
          if (!lead.lastContactDate) return true;
          const lastContact = new Date(lead.lastContactDate);
          const daysDiff = (now - lastContact) / (1000 * 60 * 60 * 24);
          return daysDiff > COLD_LEAD_THRESHOLD_DAYS && lead.status !== 'converted' && lead.status !== 'lost';
        });
        
        if (coldLeads.length > 0) {
          const message = `🧲 **Lead Follow-up Reminder**

${coldLeads.length} lead${coldLeads.length > 1 ? 's need' : ' needs'} follow-up:

` +
            coldLeads.slice(0, 5).map((l, i) => {
              const lastContact = l.lastContactDate ? new Date(l.lastContactDate).toLocaleDateString() : 'Never';
              return `${i + 1}. ${l.name || l.company || 'Untitled'} (Last contact: ${lastContact})`;
            }).join('
') +
            (coldLeads.length > 5 ? `

...and ${coldLeads.length - 5} more.` : '') +
            '

💡 Tip: Reach out to keep the conversation warm!';
          
          this._postToAIChat(message);
          
          // Log event
          if (UBA.analytics) {
            await UBA.analytics.track.trackAIAction('auto-lead-followup', {
              coldLeadsCount: coldLeads.length
            });
          }
        }
        
        return {
          type: 'lead-followup',
          coldLeadsCount: coldLeads.length,
          alerted: coldLeads.length > 0
        };
      } catch (error) {
        console.error('[UBA AI Auto] Lead follow-up error:', error);
        return { type: 'lead-followup', error: error.message };
      }
    },

    /**
     * Auto Project Health - compute health score for each project
     */
    async autoProjectHealth() {
      console.log('[UBA AI Auto] Analyzing project health...');
      
      try {
        const projects = await UBA.data.list('projects');
        const healthScores = [];
        
        for (const project of projects) {
          const score = await this._calculateProjectHealth(project);
          healthScores.push({ project: project.name, score, id: project.id });
        }
        
        // Find at-risk projects (score < 50)
        const atRiskProjects = healthScores.filter(p => p.score < 50);
        
        if (atRiskProjects.length > 0) {
          const message = `⚠️ **Project Health Alert**

${atRiskProjects.length} project${atRiskProjects.length > 1 ? 's are' : ' is'} at risk:

` +
            atRiskProjects.map((p, i) => 
              `${i + 1}. ${p.project} - Health Score: ${p.score}/100`
            ).join('
') +
            '

💡 Tip: Review timeline, budget, and resources for these projects.';
          
          this._postToAIChat(message);
          
          // Log event
          if (UBA.analytics) {
            await UBA.analytics.track.trackAIAction('auto-project-health', {
              atRiskCount: atRiskProjects.length,
              totalProjects: projects.length
            });
          }
        }
        
        return {
          type: 'project-health',
          totalProjects: projects.length,
          atRiskCount: atRiskProjects.length,
          healthScores
        };
      } catch (error) {
        console.error('[UBA AI Auto] Project health error:', error);
        return { type: 'project-health', error: error.message };
      }
    },

    /**
     * Auto Billing Insights - analyze invoices and upcoming renewals
     */
    async autoBillingInsights() {
      console.log('[UBA AI Auto] Analyzing billing insights...');
      
      try {
        const invoices = await UBA.data.list('invoices');
        const now = new Date();
        const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        // Analyze unpaid invoices
        const unpaid = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
        const unpaidTotal = unpaid.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        
        // Find invoices due soon
        const dueSoon = invoices.filter(i => {
          if (i.status !== 'sent') return false;
          const dueDate = new Date(i.dueDate);
          return dueDate >= now && dueDate <= next30Days;
        });
        
        // Find overdue invoices
        const overdue = invoices.filter(i => {
          const dueDate = new Date(i.dueDate);
          return dueDate < now && (i.status === 'sent' || i.status === 'overdue');
        });
        
        const insights = [];
        
        if (overdue.length > 0) {
          insights.push(`⚠️ ${overdue.length} overdue invoice${overdue.length > 1 ? 's' : ''}`);
        }
        
        if (dueSoon.length > 0) {
          insights.push(`📅 ${dueSoon.length} invoice${dueSoon.length > 1 ? 's' : ''} due in next 30 days`);
        }
        
        if (unpaidTotal > 0) {
          insights.push(`💰 €${unpaidTotal.toFixed(2)} total outstanding`);
        }
        
        if (insights.length > 0) {
          const message = `💳 **Billing Insights**

` + insights.join('
') +
            '

💡 Tip: Send reminders for overdue invoices and follow up on upcoming payments.';
          
          this._postToAIChat(message);
          
          // Log event
          if (UBA.analytics) {
            await UBA.analytics.track.trackAIAction('auto-billing-insights', {
              unpaidCount: unpaid.length,
              overdueCount: overdue.length,
              unpaidTotal
            });
          }
        }
        
        return {
          type: 'billing-insights',
          unpaidCount: unpaid.length,
          overdueCount: overdue.length,
          dueSoonCount: dueSoon.length,
          unpaidTotal
        };
      } catch (error) {
        console.error('[UBA AI Auto] Billing insights error:', error);
        return { type: 'billing-insights', error: error.message };
      }
    },

    // ============ Private Methods ============

    /**
     * Calculate project health score
     */
    async _calculateProjectHealth(project) {
      let score = 100;
      
      // Check if project has overdue tasks
      const tasks = await UBA.data.list('tasks');
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const overdueTasks = projectTasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        return dueDate < new Date() && t.status !== 'done';
      });
      
      if (overdueTasks.length > 0) {
        score -= Math.min(overdueTasks.length * OVERDUE_TASK_PENALTY_PER_TASK, MAX_OVERDUE_TASK_PENALTY);
      }
      
      // Check budget if available
      if (project.budget && project.spent) {
        const budgetUsage = (project.spent / project.budget) * 100;
        if (budgetUsage > 100) {
          score -= OVER_BUDGET_PENALTY;
        } else if (budgetUsage > 90) {
          score -= OVER_BUDGET_PENALTY / 2;
        }
      }
      
      // Check timeline
      if (project.dueDate) {
        const dueDate = new Date(project.dueDate);
        const now = new Date();
        if (dueDate < now && project.stage !== 'completed') {
          score -= MISSED_DEADLINE_PENALTY;
        }
      }
      
      // Check activity
      if (project.updatedAt) {
        const lastUpdate = new Date(project.updatedAt);
        const daysSinceUpdate = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > INACTIVE_PROJECT_THRESHOLD_DAYS) {
          score -= INACTIVE_PROJECT_PENALTY;
        }
      }
      
      return Math.max(0, Math.min(100, score));
    },

    /**
     * Post message to AI chat panel
     */
    _postToAIChat(message) {
      if (window.AIUI && typeof window.AIUI.addMessage === 'function') {
        window.AIUI.addMessage('ai', message, { automated: true });
      }
    },

    /**
     * Check if scheduled runs should execute
     */
    _checkScheduledRuns() {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay();
      
      // Check daily run
      if (currentHour === this.config.dailyRunHour) {
        const lastDaily = this.config.lastDailyRun ? new Date(this.config.lastDailyRun) : null;
        const shouldRunDaily = !lastDaily || 
          (now.getTime() - lastDaily.getTime()) > DAILY_RUN_INTERVAL_MS;
        
        if (shouldRunDaily) {
          this.dailyRun();
        }
      }
      
      // Check weekly run
      if (currentDay === this.config.weeklyRunDay && currentHour === this.config.dailyRunHour) {
        const lastWeekly = this.config.lastWeeklyRun ? new Date(this.config.lastWeeklyRun) : null;
        const shouldRunWeekly = !lastWeekly || 
          (now.getTime() - lastWeekly.getTime()) > WEEKLY_RUN_INTERVAL_MS;
        
        if (shouldRunWeekly) {
          this.weeklyRun();
        }
      }
    },

    /**
     * Load settings from localStorage
     */
    async _loadSettings() {
      try {
        const settings = await UBA.data.get('settings', 'ai-auto-config');
        if (settings) {
          Object.assign(this.config, settings);
        }
        return settings;
      } catch (error) {
        console.warn('[UBA AI Auto] Failed to load settings:', error);
        return null;
      }
    },

    /**
     * Save settings to localStorage
     */
    async _saveSettings() {
      try {
        await UBA.data.upsert('settings', 'ai-auto-config', this.config);
      } catch (error) {
        console.error('[UBA AI Auto] Failed to save settings:', error);
      }
    }
  };

  // Expose to UBA namespace
  UBA.ai = UBA.ai || {};
  UBA.ai.auto = AIAuto;

  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UBA.ai.auto.init());
  } else {
    UBA.ai.auto.init();
  }

  console.log('[UBA AI Auto] Auto-Actions module loaded');

})();
