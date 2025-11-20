// unified-metrics.js — Unified KPI calculations for dashboard and reports
(function() {
  'use strict';
  
  // Default filter state
  let currentFilters = {
    year: new Date().getFullYear(),
    month: null, // null = all months
    workspace: 'main' // workspace filtering
  };
  
  // Cached historical data for sparklines
  let metricsHistory = {};
  
  /**
   * Core unified metric calculation function
   * @param {Object} options - Filter options (year, month, workspace)
   * @returns {Object} Complete metrics object
   */
  function calculateUnifiedMetrics(options = {}) {
    const filters = { ...currentFilters, ...options };
    const store = window.ubaStore;
    
    if (!store) {
      console.warn('ubaStore not available for metrics calculation');
      return getEmptyMetrics();
    }
    
    const invoices = store.invoices ? store.invoices.getAll() : [];
    const clients = store.clients ? store.clients.getAll() : [];
    const tasks = store.tasks ? store.tasks.getAll() : [];
    const projects = store.projects ? store.projects.getAll() : [];
    
    // Apply date filtering
    const filteredInvoices = filterByDate(invoices, filters);
    const filteredTasks = filterByDate(tasks, filters);
    const filteredProjects = filterByDate(projects, filters);
    
    return {
      revenue: calculateRevenueMetrics(filteredInvoices),
      clients: calculateClientMetrics(clients, filters),
      tasks: calculateTaskMetrics(filteredTasks),
      projects: calculateProjectMetrics(filteredProjects),
      filters: filters
    };
  }
  
  /**
   * Filter data by date range based on current filters
   */
  function filterByDate(data, filters) {
    if (!filters.year && !filters.month) return data;
    
    return data.filter(item => {
      const date = new Date(item.created_at || item.date || item.due || Date.now());
      const itemYear = date.getFullYear();
      const itemMonth = date.getMonth() + 1; // 1-based
      
      if (filters.year && itemYear !== filters.year) return false;
      if (filters.month && itemMonth !== filters.month) return false;
      
      return true;
    });
  }
  
  /**
   * Calculate revenue metrics (unified for dashboard and reports)
   */
  function calculateRevenueMetrics(invoices) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let weeklyRevenue = 0;
    let openInvoices = 0;
    let overdueInvoices = 0;
    let paidInvoices = 0;
    let draftInvoices = 0;
    
    // Revenue trend for sparkline (last 12 months)
    const revenueTrend = [];
    const monthlyBreakdown = {};
    
    invoices.forEach(invoice => {
      const amount = parseFloat(invoice.amount) || 0;
      const invoiceDate = new Date(invoice.created_at || invoice.date || Date.now());
      const monthKey = `${invoiceDate.getFullYear()}-${invoiceDate.getMonth() + 1}`;
      
      // Count by status
      switch (invoice.status) {
        case 'paid':
          totalRevenue += amount;
          paidInvoices++;
          
          // Monthly revenue (current month)
          if (invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear) {
            monthlyRevenue += amount;
          }
          
          // Weekly revenue (last 7 days)
          if (invoiceDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
            weeklyRevenue += amount;
          }
          break;
          
        case 'sent':
          openInvoices += amount;
          break;
          
        case 'overdue':
          overdueInvoices += amount;
          break;
          
        case 'draft':
          draftInvoices += amount;
          break;
      }
      
      // Build monthly breakdown for trends
      if (!monthlyBreakdown[monthKey]) monthlyBreakdown[monthKey] = 0;
      if (invoice.status === 'paid') {
        monthlyBreakdown[monthKey] += amount;
      }
    });
    
    // Generate 12-month trend for sparkline
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      revenueTrend.push(monthlyBreakdown[monthKey] || 0);
    }
    
    return {
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      openInvoices,
      overdueInvoices,
      paidInvoices,
      draftInvoices,
      totalInvoices: invoices.length,
      revenueTrend, // for sparkline
      averageInvoiceValue: totalRevenue / Math.max(paidInvoices, 1)
    };
  }
  
  /**
   * Calculate client metrics
   */
  function calculateClientMetrics(clients, filters) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalClients = clients.length;
    let newThisMonth = 0;
    let newThisWeek = 0;
    
    // Client growth trend (last 12 months)
    const clientTrend = [];
    const monthlyGrowth = {};
    
    clients.forEach(client => {
      const clientDate = new Date(client.created_at || Date.now());
      const monthKey = `${clientDate.getFullYear()}-${clientDate.getMonth() + 1}`;
      
      // Count new clients this month
      if (clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear) {
        newThisMonth++;
      }
      
      // Count new clients this week
      if (clientDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        newThisWeek++;
      }
      
      // Build monthly growth
      if (!monthlyGrowth[monthKey]) monthlyGrowth[monthKey] = 0;
      monthlyGrowth[monthKey]++;
    });
    
    // Generate 12-month growth trend
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      clientTrend.push(monthlyGrowth[monthKey] || 0);
    }
    
    return {
      totalClients,
      newThisMonth,
      newThisWeek,
      clientTrend, // for sparkline
      averageClientValue: 0 // could be calculated from invoices
    };
  }
  
  /**
   * Calculate task metrics
   */
  function calculateTaskMetrics(tasks) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let totalTasks = tasks.length;
    let completedTasks = 0;
    let tasksDueToday = 0;
    let overdueTasks = 0;
    let inProgressTasks = 0;
    
    // Task completion trend (last 30 days)
    const taskTrend = [];
    const dailyCompletion = {};
    
    tasks.forEach(task => {
      switch (task.status) {
        case 'done':
          completedTasks++;
          break;
        case 'in_progress':
          inProgressTasks++;
          break;
      }
      
      // Tasks due today
      if (task.due && task.due.startsWith(today) && task.status !== 'done') {
        tasksDueToday++;
      }
      
      // Overdue tasks
      if (task.due && task.due < today && task.status !== 'done') {
        overdueTasks++;
      }
      
      // Build completion trend
      const taskDate = new Date(task.updated_at || task.created_at || Date.now());
      const dayKey = taskDate.toISOString().split('T')[0];
      if (task.status === 'done') {
        if (!dailyCompletion[dayKey]) dailyCompletion[dayKey] = 0;
        dailyCompletion[dayKey]++;
      }
    });
    
    // Generate 30-day completion trend
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      taskTrend.push(dailyCompletion[dayKey] || 0);
    }
    
    return {
      totalTasks,
      completedTasks,
      tasksDueToday,
      overdueTasks,
      inProgressTasks,
      taskTrend, // for sparkline
      completionRate: Math.round((completedTasks / Math.max(totalTasks, 1)) * 100)
    };
  }
  
  /**
   * Calculate project metrics
   */
  function calculateProjectMetrics(projects) {
    let totalProjects = projects.length;
    let activeProjects = 0;
    let leadProjects = 0;
    let completedProjects = 0;
    
    // Project trend by stage
    const projectTrend = [];
    
    projects.forEach(project => {
      switch (project.stage || project.status) {
        case 'lead':
          leadProjects++;
          break;
        case 'in_progress':
        case 'ongoing':
          activeProjects++;
          break;
        case 'completed':
        case 'done':
          completedProjects++;
          break;
      }
    });
    
    // Simple trend based on project distribution
    projectTrend.push(leadProjects, activeProjects, completedProjects);
    
    return {
      totalProjects,
      activeProjects,
      leadProjects,
      completedProjects,
      projectTrend // for sparkline
    };
  }
  
  /**
   * Get empty metrics structure
   */
  function getEmptyMetrics() {
    return {
      revenue: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        openInvoices: 0,
        overdueInvoices: 0,
        totalInvoices: 0,
        revenueTrend: Array(12).fill(0)
      },
      clients: {
        totalClients: 0,
        newThisMonth: 0,
        clientTrend: Array(12).fill(0)
      },
      tasks: {
        totalTasks: 0,
        completedTasks: 0,
        tasksDueToday: 0,
        taskTrend: Array(30).fill(0)
      },
      projects: {
        totalProjects: 0,
        activeProjects: 0,
        projectTrend: [0, 0, 0]
      }
    };
  }
  
  /**
   * Update current filters and recalculate
   */
  function updateFilters(newFilters) {
    currentFilters = { ...currentFilters, ...newFilters };
    return calculateUnifiedMetrics();
  }
  
  /**
   * Get current filters
   */
  function getCurrentFilters() {
    return { ...currentFilters };
  }
  
  /**
   * Format currency values
   */
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  }
  
  /**
   * Calculate percentage change between two values
   */
  function calculateChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }
  
  // Expose unified metrics API
  window.UBAMetrics = {
    calculate: calculateUnifiedMetrics,
    updateFilters: updateFilters,
    getCurrentFilters: getCurrentFilters,
    formatCurrency: formatCurrency,
    calculateChange: calculateChange
  };
  
  console.log('✓ UBA Unified Metrics module loaded');
  
})();