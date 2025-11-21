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
  }
  
  /**
   * Refresh dashboard metrics with current filters
   */
  function refreshDashboardMetrics() {
    if (!window.UBAMetrics) {
      console.warn('UBAMetrics not available, using fallback');
      return;
    }
    
    const filters = getCurrentFilters();
    currentMetrics = window.UBAMetrics.calculate(filters);
    
    // Update KPI values
    updateKPIValues();
    
    // Update sparklines
    updateSparklines();
    
    console.log('✓ Dashboard metrics refreshed', currentMetrics);
  }
  
  /**
   * Update KPI card values
   */
  function updateKPIValues() {
    if (!currentMetrics) return;
    
    const { revenue, clients, tasks, projects } = currentMetrics;
    
    // Revenue KPI
    const revenueEl = document.getElementById('kpi-billed');
    const revenueTrendEl = document.getElementById('kpi-billed-trend');
    if (revenueEl) {
      revenueEl.textContent = window.UBAMetrics.formatCurrency(revenue.totalRevenue);
    }
    if (revenueTrendEl) {
      const change = window.UBAMetrics.calculateChange(revenue.monthlyRevenue, revenue.totalRevenue / 12);
      revenueTrendEl.textContent = `${change >= 0 ? '+' : ''}${change}% this period`;
    }
    
    // Open Invoices KPI
    const openInvoicesEl = document.getElementById('kpi-open-invoices');
    const openTrendEl = document.getElementById('kpi-open-invoices-trend');
    if (openInvoicesEl) {
      openInvoicesEl.textContent = window.UBAMetrics.formatCurrency(revenue.openInvoices + revenue.overdueInvoices);
    }
    if (openTrendEl) {
      const overdueCount = Math.round(revenue.overdueInvoices / Math.max(revenue.averageInvoiceValue, 1));
      openTrendEl.textContent = overdueCount > 0 ? `${overdueCount} overdue` : 'All current';
    }
    
    // Active Clients KPI
    const clientsEl = document.getElementById('kpi-active-clients');
    const clientsTrendEl = document.getElementById('kpi-active-clients-trend');
    if (clientsEl) {
      clientsEl.textContent = clients.totalClients;
    }
    if (clientsTrendEl) {
      clientsTrendEl.textContent = `${clients.newThisMonth} new this month`;
    }
    
    // Tasks Today KPI
    const tasksEl = document.getElementById('kpi-tasks-today');
    const tasksTrendEl = document.getElementById('kpi-tasks-today-trend');
    if (tasksEl) {
      tasksEl.textContent = tasks.tasksDueToday;
    }
    if (tasksTrendEl) {
      tasksTrendEl.textContent = `${tasks.completedTasks} completed`;
    }
  }
  
  /**
   * Update sparkline charts
   */
  function updateSparklines() {
    if (!currentMetrics || !window.UBASparkline) return;
    
    const { revenue, clients, tasks, projects } = currentMetrics;
    
    // Revenue sparkline
    const revenueContainer = document.getElementById('revenue-sparkline');
    if (revenueContainer && revenue.revenueTrend) {
      window.UBASparkline.createKPI(revenueContainer, revenue.revenueTrend, 'revenue', {
        width: 80,
        height: 24
      });
    }
    
    // Invoices sparkline (show overdue trend)
    const invoicesContainer = document.getElementById('invoices-sparkline');
    if (invoicesContainer) {
      // Create a simple trend based on invoice status
      const invoiceTrend = [
        revenue.draftInvoices,
        revenue.openInvoices,
        revenue.overdueInvoices,
        revenue.paidInvoices
      ];
      window.UBASparkline.createKPI(invoicesContainer, invoiceTrend, 'danger', {
        width: 80,
        height: 24
      });
    }
    
    // Clients sparkline
    const clientsContainer = document.getElementById('clients-sparkline');
    if (clientsContainer && clients.clientTrend) {
      window.UBASparkline.createKPI(clientsContainer, clients.clientTrend, 'clients', {
        width: 80,
        height: 24
      });
    }
    
    // Tasks sparkline
    const tasksContainer = document.getElementById('tasks-sparkline');
    if (tasksContainer && tasks.taskTrend) {
      window.UBASparkline.createKPI(tasksContainer, tasks.taskTrend, 'tasks', {
        width: 80,
        height: 24
      });
    }
  }
  
  /**
   * Export current metrics (for reports consistency)
   */
  function exportCurrentMetrics() {
    return currentMetrics;
  }
  
  /**
   * Force refresh from external trigger
   */
  function forceRefresh() {
    refreshDashboardMetrics();
  }
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedDashboard);
  } else {
    initEnhancedDashboard();
  }
  
  // Expose enhanced dashboard API
  window.UBAEnhancedDashboard = {
    init: initEnhancedDashboard,
    refresh: forceRefresh,
    exportMetrics: exportCurrentMetrics,
    getCurrentFilters: getCurrentFilters
  };
  
  console.log('✓ Enhanced Dashboard module loaded');
  
})();