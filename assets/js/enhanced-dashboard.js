// enhanced-dashboard.js — Enhanced dashboard with unified metrics, filters, and sparklines
(function() {
  'use strict';
  
  let dashboardInitialized = false;
  let currentMetrics = null;
  
  /**
   * Initialize enhanced dashboard
   */
  function initEnhancedDashboard() {
    if (dashboardInitialized) return;
    
    console.log('🚀 Initializing enhanced dashboard with unified metrics');
    
    // Setup filter controls
    setupFilterControls();
    
    // Load initial metrics
    refreshDashboardMetrics();
    
    dashboardInitialized = true;
    console.log('✓ Enhanced dashboard initialization complete');
  }
  
  /**
   * Setup filter control event handlers
   */
  function setupFilterControls() {
    const yearFilter = document.getElementById('metrics-year-filter');
    const monthFilter = document.getElementById('metrics-month-filter');
    
    if (yearFilter) {
      // Set current year as default
      const currentYear = new Date().getFullYear();
      yearFilter.value = currentYear;
      
      yearFilter.addEventListener('change', () => {
        refreshDashboardMetrics();
      });
    }
    
    if (monthFilter) {
      // Set current month as default
      const currentMonth = new Date().getMonth() + 1;
      monthFilter.value = currentMonth;
      
      monthFilter.addEventListener('change', () => {
        refreshDashboardMetrics();
      });
    }
  }
  
  /**
   * Get current filter values
   */
  function getCurrentFilters() {
    const yearFilter = document.getElementById('metrics-year-filter');
    const monthFilter = document.getElementById('metrics-month-filter');
    
    return {
      year: yearFilter ? parseInt(yearFilter.value) : new Date().getFullYear(),
      month: monthFilter && monthFilter.value ? parseInt(monthFilter.value) : null,
      workspace: 'main'
    };
  }\n  \n  /**\n   * Refresh dashboard metrics with current filters\n   */\n  function refreshDashboardMetrics() {\n    if (!window.UBAMetrics) {\n      console.warn('UBAMetrics not available, using fallback');\n      return;\n    }\n    \n    const filters = getCurrentFilters();\n    currentMetrics = window.UBAMetrics.calculate(filters);\n    \n    // Update KPI values\n    updateKPIValues();\n    \n    // Update sparklines\n    updateSparklines();\n    \n    console.log('✓ Dashboard metrics refreshed', currentMetrics);\n  }\n  \n  /**\n   * Update KPI card values\n   */\n  function updateKPIValues() {\n    if (!currentMetrics) return;\n    \n    const { revenue, clients, tasks, projects } = currentMetrics;\n    \n    // Revenue KPI\n    const revenueEl = document.getElementById('kpi-billed');\n    const revenueTrendEl = document.getElementById('kpi-billed-trend');\n    if (revenueEl) {\n      revenueEl.textContent = window.UBAMetrics.formatCurrency(revenue.totalRevenue);\n    }\n    if (revenueTrendEl) {\n      const change = window.UBAMetrics.calculateChange(revenue.monthlyRevenue, revenue.totalRevenue / 12);\n      revenueTrendEl.textContent = `${change >= 0 ? '+' : ''}${change}% this period`;\n    }\n    \n    // Open Invoices KPI\n    const openInvoicesEl = document.getElementById('kpi-open-invoices');\n    const openTrendEl = document.getElementById('kpi-open-invoices-trend');\n    if (openInvoicesEl) {\n      openInvoicesEl.textContent = window.UBAMetrics.formatCurrency(revenue.openInvoices + revenue.overdueInvoices);\n    }\n    if (openTrendEl) {\n      const overdueCount = Math.round(revenue.overdueInvoices / Math.max(revenue.averageInvoiceValue, 1));\n      openTrendEl.textContent = overdueCount > 0 ? `${overdueCount} overdue` : 'All current';\n    }\n    \n    // Active Clients KPI\n    const clientsEl = document.getElementById('kpi-active-clients');\n    const clientsTrendEl = document.getElementById('kpi-active-clients-trend');\n    if (clientsEl) {\n      clientsEl.textContent = clients.totalClients;\n    }\n    if (clientsTrendEl) {\n      clientsTrendEl.textContent = `${clients.newThisMonth} new this month`;\n    }\n    \n    // Tasks Today KPI\n    const tasksEl = document.getElementById('kpi-tasks-today');\n    const tasksTrendEl = document.getElementById('kpi-tasks-today-trend');\n    if (tasksEl) {\n      tasksEl.textContent = tasks.tasksDueToday;\n    }\n    if (tasksTrendEl) {\n      tasksTrendEl.textContent = `${tasks.completedTasks} completed`;\n    }\n  }\n  \n  /**\n   * Update sparkline charts\n   */\n  function updateSparklines() {\n    if (!currentMetrics || !window.UBASparkline) return;\n    \n    const { revenue, clients, tasks, projects } = currentMetrics;\n    \n    // Revenue sparkline\n    const revenueContainer = document.getElementById('revenue-sparkline');\n    if (revenueContainer && revenue.revenueTrend) {\n      window.UBASparkline.createKPI(revenueContainer, revenue.revenueTrend, 'revenue', {\n        width: 80,\n        height: 24\n      });\n    }\n    \n    // Invoices sparkline (show overdue trend)\n    const invoicesContainer = document.getElementById('invoices-sparkline');\n    if (invoicesContainer) {\n      // Create a simple trend based on invoice status\n      const invoiceTrend = [\n        revenue.draftInvoices,\n        revenue.openInvoices,\n        revenue.overdueInvoices,\n        revenue.paidInvoices\n      ];\n      window.UBASparkline.createKPI(invoicesContainer, invoiceTrend, 'danger', {\n        width: 80,\n        height: 24\n      });\n    }\n    \n    // Clients sparkline\n    const clientsContainer = document.getElementById('clients-sparkline');\n    if (clientsContainer && clients.clientTrend) {\n      window.UBASparkline.createKPI(clientsContainer, clients.clientTrend, 'clients', {\n        width: 80,\n        height: 24\n      });\n    }\n    \n    // Tasks sparkline\n    const tasksContainer = document.getElementById('tasks-sparkline');\n    if (tasksContainer && tasks.taskTrend) {\n      window.UBASparkline.createKPI(tasksContainer, tasks.taskTrend, 'tasks', {\n        width: 80,\n        height: 24\n      });\n    }\n  }\n  \n  /**\n   * Export current metrics (for reports consistency)\n   */\n  function exportCurrentMetrics() {\n    return currentMetrics;\n  }\n  \n  /**\n   * Force refresh from external trigger\n   */\n  function forceRefresh() {\n    refreshDashboardMetrics();\n  }\n  \n  // Initialize on DOM ready\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', initEnhancedDashboard);\n  } else {\n    initEnhancedDashboard();\n  }\n  \n  // Expose enhanced dashboard API\n  window.UBAEnhancedDashboard = {\n    init: initEnhancedDashboard,\n    refresh: forceRefresh,\n    exportMetrics: exportCurrentMetrics,\n    getCurrentFilters: getCurrentFilters\n  };\n  \n  console.log('✓ Enhanced Dashboard module loaded');\n  \n})();