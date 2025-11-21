/**
 * UBA AI Reports - Smart Report Generation
 * Generate PDF/HTML reports with AI insights
 */

(function() {
  'use strict';

  // AI Reports namespace
  window.UBA = window.UBA || {};
  
  const AIReports = {
    /**
     * Generate PDF Report
     */
    async generatePDFReport(type, payload = {}) {
      console.log('[UBA AI Reports] Generating report:', type);
      
      try {
        let reportData;
        
        switch (type) {
          case 'financial-summary':
            reportData = await this._generateFinancialSummary(payload);
            break;
          case 'monthly-activities':
            reportData = await this._generateMonthlyActivities(payload);
            break;
          case 'client-overview':
            reportData = await this._generateClientOverview(payload);
            break;
          case 'project-progress':
            reportData = await this._generateProjectProgress(payload);
            break;
          default:
            throw new Error(`Unknown report type: ${type}`);
        }
        
        // Store report in data layer
        const report = {
          id: this._generateId('report'),
          type,
          title: reportData.title,
          generatedAt: new Date().toISOString(),
          data: reportData,
          format: 'html', // Future: 'pdf'
          createdBy: UBA.session?.userId || 'system'
        };
        
        await UBA.data.create('reports', report);
        
        // Track analytics
        if (UBA.analytics) {
          await UBA.analytics.track.trackAIAction('generate-report', { type });
        }
        
        return {
          success: true,
          report,
          html: this._renderReportHTML(reportData)
        };
      } catch (error) {
        console.error('[UBA AI Reports] Report generation error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * Get all generated reports
     */
    async getReports() {
      try {
        const reports = await UBA.data.list('reports');
        return reports.sort((a, b) => 
          new Date(b.generatedAt) - new Date(a.generatedAt)
        );
      } catch (error) {
        console.error('[UBA AI Reports] Failed to get reports:', error);
        return [];
      }
    },

    /**
     * Delete a report
     */
    async deleteReport(reportId) {
      try {
        await UBA.data.delete('reports', reportId);
        return { success: true };
      } catch (error) {
        console.error('[UBA AI Reports] Failed to delete report:', error);
        return { success: false, error: error.message };
      }
    },

    // ============ Report Generators ============

    /**
     * Generate Financial Summary Report
     */
    async _generateFinancialSummary(payload) {
      const period = payload.period || 'current-month';
      const invoices = await UBA.data.list('invoices');
      const expenses = await UBA.data.list('expenses');
      
      // Filter by period
      const { startDate, endDate } = this._getPeriodDates(period);
      const periodInvoices = invoices.filter(i => {
        const date = new Date(i.createdAt);
        return date >= startDate && date <= endDate;
      });
      const periodExpenses = expenses.filter(e => {
        const date = new Date(e.date || e.createdAt);
        return date >= startDate && date <= endDate;
      });
      
      // Calculate metrics
      const totalRevenue = periodInvoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      
      const totalExpenses = periodExpenses
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      
      const profit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue * 100).toFixed(1) : 0;
      
      const paidInvoices = periodInvoices.filter(i => i.status === 'paid');
      const unpaidInvoices = periodInvoices.filter(i => i.status === 'sent' || i.status === 'overdue');
      const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      
      // Generate insights
      const insights = [];
      if (profit > 0) {
        insights.push(`✅ Profitable period with ${profitMargin}% margin`);
      } else {
        insights.push(`⚠️ Loss of €${Math.abs(profit).toFixed(2)} this period`);
      }
      
      if (unpaidTotal > 0) {
        insights.push(`💰 €${unpaidTotal.toFixed(2)} in outstanding invoices`);
      }
      
      if (totalExpenses > totalRevenue * 0.7) {
        insights.push(`⚠️ High expense ratio (${(totalExpenses / totalRevenue * 100).toFixed(1)}%)`);
      }
      
      // Generate recommendations
      const recommendations = [];
      if (unpaidInvoices.length > 0) {
        recommendations.push('Follow up on unpaid invoices to improve cash flow');
      }
      if (totalExpenses > totalRevenue * 0.8) {
        recommendations.push('Review and optimize expenses to improve profitability');
      }
      if (paidInvoices.length < 5) {
        recommendations.push('Increase sales activities to grow revenue');
      }
      
      return {
        type: 'financial-summary',
        title: `Financial Summary - ${this._formatPeriod(period)}`,
        period: this._formatPeriod(period),
        summary: {
          totalRevenue,
          totalExpenses,
          profit,
          profitMargin,
          paidInvoicesCount: paidInvoices.length,
          unpaidInvoicesCount: unpaidInvoices.length,
          unpaidTotal,
          expensesCount: periodExpenses.length
        },
        insights,
        recommendations,
        charts: {
          revenueVsExpenses: [
            { label: 'Revenue', value: totalRevenue },
            { label: 'Expenses', value: totalExpenses }
          ]
        }
      };
    },

    /**
     * Generate Monthly Activities Report
     */
    async _generateMonthlyActivities(payload) {
      const period = payload.period || 'current-month';
      const { startDate, endDate } = this._getPeriodDates(period);
      
      // Gather all activity data
      const [tasks, clients, projects, invoices, leads] = await Promise.all([
        UBA.data.list('tasks'),
        UBA.data.list('clients'),
        UBA.data.list('projects'),
        UBA.data.list('invoices'),
        UBA.data.list('leads')
      ]);
      
      // Filter by period
      const filterByPeriod = (items) => items.filter(item => {
        const date = new Date(item.createdAt);
        return date >= startDate && date <= endDate;
      });
      
      const periodTasks = filterByPeriod(tasks);
      const periodClients = filterByPeriod(clients);
      const periodProjects = filterByPeriod(projects);
      const periodInvoices = filterByPeriod(invoices);
      const periodLeads = filterByPeriod(leads);
      
      // Calculate metrics
      const completedTasks = periodTasks.filter(t => t.status === 'done');
      const convertedLeads = periodLeads.filter(l => l.status === 'converted');
      
      // Generate insights
      const insights = [];
      insights.push(`📝 Created ${periodTasks.length} tasks (${completedTasks.length} completed)`);
      insights.push(`👥 Added ${periodClients.length} new clients`);
      insights.push(`💼 Started ${periodProjects.length} new projects`);
      insights.push(`💵 Generated ${periodInvoices.length} invoices`);
      insights.push(`🧲 Added ${periodLeads.length} leads (${convertedLeads.length} converted)`);
      
      // Task completion rate
      const taskCompletionRate = periodTasks.length > 0 
        ? (completedTasks.length / periodTasks.length * 100).toFixed(1)
        : 0;
      
      // Lead conversion rate
      const leadConversionRate = periodLeads.length > 0
        ? (convertedLeads.length / periodLeads.length * 100).toFixed(1)
        : 0;
      
      const recommendations = [];
      if (taskCompletionRate < 50) {
        recommendations.push('Task completion rate is low. Consider reviewing priorities and deadlines');
      }
      if (periodClients.length === 0) {
        recommendations.push('No new clients this period. Focus on lead generation and conversion');
      }
      if (leadConversionRate < 20 && periodLeads.length > 0) {
        recommendations.push('Lead conversion rate is low. Review follow-up processes');
      }
      
      return {
        type: 'monthly-activities',
        title: `Monthly Activities - ${this._formatPeriod(period)}`,
        period: this._formatPeriod(period),
        summary: {
          tasksCreated: periodTasks.length,
          tasksCompleted: completedTasks.length,
          taskCompletionRate,
          clientsAdded: periodClients.length,
          projectsStarted: periodProjects.length,
          invoicesGenerated: periodInvoices.length,
          leadsAdded: periodLeads.length,
          leadsConverted: convertedLeads.length,
          leadConversionRate
        },
        insights,
        recommendations,
        activityTimeline: this._generateActivityTimeline(
          periodTasks,
          periodClients,
          periodProjects,
          periodInvoices,
          periodLeads
        )
      };
    },

    /**
     * Generate Client Overview Report
     */
    async _generateClientOverview(payload) {
      const clientId = payload.clientId;
      const clients = await UBA.data.list('clients');
      
      let targetClients = clientId 
        ? clients.filter(c => c.id === clientId)
        : clients;
      
      if (targetClients.length === 0) {
        throw new Error('No clients found');
      }
      
      const client = targetClients[0];
      
      // Get related data
      const [projects, invoices, tasks] = await Promise.all([
        UBA.data.list('projects'),
        UBA.data.list('invoices'),
        UBA.data.list('tasks')
      ]);
      
      const clientProjects = projects.filter(p => p.clientId === clientId);
      const clientInvoices = invoices.filter(i => i.clientId === clientId);
      const clientTasks = tasks.filter(t => t.clientId === clientId);
      
      // Calculate metrics
      const totalRevenue = clientInvoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      
      const unpaidAmount = clientInvoices
        .filter(i => i.status === 'sent' || i.status === 'overdue')
        .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      
      const activeProjects = clientProjects.filter(p => p.stage === 'ongoing' || p.stage === 'in_progress');
      const completedProjects = clientProjects.filter(p => p.stage === 'completed');
      
      // Generate insights
      const insights = [];
      insights.push(`💰 Total revenue: €${totalRevenue.toFixed(2)}`);
      insights.push(`💼 ${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}`);
      insights.push(`✅ ${completedProjects.length} completed project${completedProjects.length !== 1 ? 's' : ''}`);
      if (unpaidAmount > 0) {
        insights.push(`⚠️ €${unpaidAmount.toFixed(2)} outstanding`);
      }
      
      const recommendations = [];
      if (unpaidAmount > 0) {
        recommendations.push('Follow up on outstanding invoices');
      }
      if (activeProjects.length === 0 && completedProjects.length > 0) {
        recommendations.push('Client has no active projects. Consider reaching out for new opportunities');
      }
      
      return {
        type: 'client-overview',
        title: `Client Overview - ${client.name || 'Untitled Client'}`,
        client: {
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          status: client.status,
          createdAt: client.createdAt
        },
        summary: {
          totalRevenue,
          unpaidAmount,
          projectsTotal: clientProjects.length,
          projectsActive: activeProjects.length,
          projectsCompleted: completedProjects.length,
          invoicesTotal: clientInvoices.length,
          tasksTotal: clientTasks.length
        },
        insights,
        recommendations,
        recentActivity: {
          projects: clientProjects.slice(0, 5),
          invoices: clientInvoices.slice(0, 5),
          tasks: clientTasks.slice(0, 5)
        }
      };
    },

    /**
     * Generate Project Progress Report
     */
    async _generateProjectProgress(payload) {
      const projectId = payload.projectId;
      const projects = await UBA.data.list('projects');
      
      let targetProjects = projectId 
        ? projects.filter(p => p.id === projectId)
        : projects.filter(p => p.stage !== 'completed');
      
      if (targetProjects.length === 0) {
        throw new Error('No projects found');
      }
      
      const projectsData = [];
      
      for (const project of targetProjects) {
        const tasks = await UBA.data.list('tasks');
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        
        const completedTasks = projectTasks.filter(t => t.status === 'done');
        const overdueTasks = projectTasks.filter(t => {
          const dueDate = new Date(t.dueDate);
          return dueDate < new Date() && t.status !== 'done';
        });
        
        const progress = projectTasks.length > 0
          ? (completedTasks.length / projectTasks.length * 100).toFixed(1)
          : 0;
        
        // Calculate health score
        let healthScore = 100;
        if (overdueTasks.length > 0) healthScore -= Math.min(overdueTasks.length * 10, 30);
        if (project.budget && project.spent && project.spent > project.budget) healthScore -= 20;
        if (project.dueDate && new Date(project.dueDate) < new Date()) healthScore -= 30;
        healthScore = Math.max(0, healthScore);
        
        const status = healthScore >= 70 ? 'On Track' : healthScore >= 40 ? 'At Risk' : 'Critical';
        
        projectsData.push({
          id: project.id,
          name: project.name,
          stage: project.stage,
          progress,
          healthScore,
          status,
          tasksTotal: projectTasks.length,
          tasksCompleted: completedTasks.length,
          tasksOverdue: overdueTasks.length,
          budget: project.budget,
          spent: project.spent,
          dueDate: project.dueDate
        });
      }
      
      // Generate insights
      const insights = [];
      const onTrack = projectsData.filter(p => p.healthScore >= 70);
      const atRisk = projectsData.filter(p => p.healthScore >= 40 && p.healthScore < 70);
      const critical = projectsData.filter(p => p.healthScore < 40);
      
      insights.push(`✅ ${onTrack.length} project${onTrack.length !== 1 ? 's' : ''} on track`);
      if (atRisk.length > 0) {
        insights.push(`⚠️ ${atRisk.length} project${atRisk.length !== 1 ? 's' : ''} at risk`);
      }
      if (critical.length > 0) {
        insights.push(`🚨 ${critical.length} project${critical.length !== 1 ? 's' : ''} critical`);
      }
      
      const recommendations = [];
      if (critical.length > 0) {
        recommendations.push('Review critical projects immediately and adjust resources/timeline');
      }
      if (atRisk.length > 0) {
        recommendations.push('Monitor at-risk projects closely and address blockers');
      }
      
      const avgProgress = projectsData.reduce((sum, p) => sum + parseFloat(p.progress), 0) / projectsData.length;
      
      return {
        type: 'project-progress',
        title: projectId ? `Project Progress - ${targetProjects[0].name}` : 'All Projects Progress',
        summary: {
          totalProjects: projectsData.length,
          onTrack: onTrack.length,
          atRisk: atRisk.length,
          critical: critical.length,
          averageProgress: avgProgress.toFixed(1)
        },
        projects: projectsData,
        insights,
        recommendations
      };
    },

    // ============ Helper Methods ============

    /**
     * Get period start and end dates
     */
    _getPeriodDates(period) {
      const now = new Date();
      let startDate, endDate;
      
      switch (period) {
        case 'current-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'current-quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
          break;
        case 'current-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }
      
      return { startDate, endDate };
    },

    /**
     * Format period name
     */
    _formatPeriod(period) {
      const now = new Date();
      switch (period) {
        case 'current-month':
          return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        case 'last-month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        case 'current-quarter':
          const quarter = Math.floor(now.getMonth() / 3) + 1;
          return `Q${quarter} ${now.getFullYear()}`;
        case 'current-year':
          return now.getFullYear().toString();
        default:
          return period;
      }
    },

    /**
     * Generate activity timeline
     */
    _generateActivityTimeline(tasks, clients, projects, invoices, leads) {
      const events = [];
      
      tasks.forEach(t => events.push({ type: 'task', date: t.createdAt, name: t.title }));
      clients.forEach(c => events.push({ type: 'client', date: c.createdAt, name: c.name }));
      projects.forEach(p => events.push({ type: 'project', date: p.createdAt, name: p.name }));
      invoices.forEach(i => events.push({ type: 'invoice', date: i.createdAt, name: i.number }));
      leads.forEach(l => events.push({ type: 'lead', date: l.createdAt, name: l.name }));
      
      return events
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);
    },

    /**
     * Render report as HTML
     */
    _renderReportHTML(reportData) {
      const styles = `
        <style>
          .ai-report {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #1a1a1a;
          }
          .ai-report h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .ai-report .report-meta {
            color: #666;
            font-size: 14px;
            margin-bottom: 32px;
          }
          .ai-report .report-section {
            margin-bottom: 32px;
          }
          .ai-report h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #2563eb;
          }
          .ai-report .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          .ai-report .metric-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
          }
          .ai-report .metric-label {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 4px;
          }
          .ai-report .metric-value {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
          }
          .ai-report .insight-list {
            list-style: none;
            padding: 0;
          }
          .ai-report .insight-list li {
            padding: 12px;
            background: #fef3c7;
            border-left: 3px solid #f59e0b;
            margin-bottom: 8px;
            border-radius: 4px;
          }
          .ai-report .recommendation-list {
            list-style: none;
            padding: 0;
          }
          .ai-report .recommendation-list li {
            padding: 12px;
            background: #dbeafe;
            border-left: 3px solid #2563eb;
            margin-bottom: 8px;
            border-radius: 4px;
          }
        </style>
      `;
      
      let html = styles + `<div class="ai-report">`;
      html += `<h1>${reportData.title}</h1>`;
      html += `<div class="report-meta">Generated on ${new Date().toLocaleDateString()}</div>`;
      
      // Summary section
      if (reportData.summary) {
        html += `<div class="report-section">`;
        html += `<h2>Summary</h2>`;
        html += `<div class="metric-grid">`;
        
        Object.entries(reportData.summary).forEach(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const isMoneyField = key.includes('Revenue') || key.includes('Total') || key.includes('Amount');
          const isPercentageField = key.includes('Rate') || key.includes('Margin');
          const formattedValue = (typeof value === 'number' && isMoneyField)
            ? `€${value.toFixed(2)}`
            : (typeof value === 'number' && isPercentageField)
            ? `${value}%`
            : value;
          
          html += `
            <div class="metric-card">
              <div class="metric-label">${label}</div>
              <div class="metric-value">${formattedValue}</div>
            </div>
          `;
        });
        
        html += `</div></div>`;
      }
      
      // Insights section
      if (reportData.insights && reportData.insights.length > 0) {
        html += `<div class="report-section">`;
        html += `<h2>Key Insights</h2>`;
        html += `<ul class="insight-list">`;
        reportData.insights.forEach(insight => {
          html += `<li>${insight}</li>`;
        });
        html += `</ul></div>`;
      }
      
      // Recommendations section
      if (reportData.recommendations && reportData.recommendations.length > 0) {
        html += `<div class="report-section">`;
        html += `<h2>Recommendations</h2>`;
        html += `<ul class="recommendation-list">`;
        reportData.recommendations.forEach(rec => {
          html += `<li>${rec}</li>`;
        });
        html += `</ul></div>`;
      }
      
      html += `</div>`;
      return html;
    },

    /**
     * Generate unique ID
     */
    _generateId(prefix = 'id') {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }
  };

  // Expose to UBA namespace
  UBA.ai = UBA.ai || {};
  UBA.ai.reports = AIReports;

  console.log('[UBA AI Reports] Reports module loaded');

})();
