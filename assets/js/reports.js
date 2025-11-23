// reports.js — comprehensive analytics dashboard
(function () {
  
  // Data aggregation functions
  function calculateRevenueMetrics() {
    const invoices = window.ubaStore?.invoices?.getAll() || [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let totalRevenue = 0;
    let monthlyRevenue = {};
    let paidInvoices = 0;
    let overdueInvoices = 0;
    let thisMonthRevenue = 0;
    
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.date || invoice.created_at || Date.now());
      const invoiceMonth = invoiceDate.getMonth();
      const invoiceYear = invoiceDate.getFullYear();
      const monthKey = `${invoiceYear}-${invoiceMonth}`;
      
      if (invoice.status === 'paid') {
        totalRevenue += invoice.amount || 0;
        paidInvoices++;
        
        if (!monthlyRevenue[monthKey]) monthlyRevenue[monthKey] = 0;
        monthlyRevenue[monthKey] += invoice.amount || 0;
        
        if (invoiceMonth === currentMonth && invoiceYear === currentYear) {
          thisMonthRevenue += invoice.amount || 0;
        }
      } else if (invoice.status === 'overdue' || 
                 (invoice.status === 'sent' && invoiceDate < currentDate)) {
        overdueInvoices++;
      }
    });
    
    return {
      totalRevenue,
      monthlyRevenue,
      paidInvoices,
      overdueInvoices,
      thisMonthRevenue,
      totalInvoices: invoices.length
    };
  }
  
  function calculateClientMetrics() {
    const clients = window.ubaStore?.clients?.getAll() || [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let totalClients = clients.length;
    let newThisMonth = 0;
    
    clients.forEach(client => {
      const clientDate = new Date(client.created_at || Date.now());
      if (clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear) {
        newThisMonth++;
      }
    });
    
    return { totalClients, newThisMonth };
  }
  
  function calculateProjectMetrics() {
    const projects = window.ubaStore?.projects?.getAll() || [];
    
    const metrics = {
      lead: 0,
      in_progress: 0,
      ongoing: 0,
      completed: 0,
      stalled: 0
    };
    
    projects.forEach(project => {
      const stage = project.stage || 'lead';
      if (metrics.hasOwnProperty(stage)) {
        metrics[stage]++;
      }
    });
    
    return metrics;
  }
  
  function calculateTaskMetrics() {
    const tasks = window.ubaStore?.tasks?.getAll() || [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const metrics = {
      todo: 0,
      in_progress: 0,
      done: 0,
      completedThisMonth: 0
    };
    
    tasks.forEach(task => {
      const status = task.status || 'todo';
      if (metrics.hasOwnProperty(status)) {
        metrics[status]++;
      }
      
      if (status === 'done') {
        const taskDate = new Date(task.updated_at || task.created_at || Date.now());
        if (taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear) {
          metrics.completedThisMonth++;
        }
      }
    });
    
    return metrics;
  }
  
  // Chart rendering functions
  function drawBarChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size accounting for device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = options.padding || 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Clear canvas
    ctx.fillStyle = options.backgroundColor || '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    if (!data.labels || !data.values || data.values.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
      return;
    }
    
    const maxValue = Math.max(...data.values);
    const barWidth = chartWidth / data.values.length * 0.8;
    const barSpacing = chartWidth / data.values.length * 0.2;
    
    // Draw bars
    data.values.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * (barWidth + barSpacing);
      const y = padding + (chartHeight - barHeight);
      
      // Draw bar
      ctx.fillStyle = options.barColor || '#3b82f6';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw value label
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        options.formatValue ? options.formatValue(value) : value.toString(),
        x + barWidth / 2,
        y - 5
      );
      
      // Draw x-axis label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px system-ui';
      ctx.fillText(
        data.labels[index],
        x + barWidth / 2,
        height - padding + 15
      );
    });
  }
  
  function drawLineChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = options.padding || 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Clear canvas
    ctx.fillStyle = options.backgroundColor || '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    if (!data.labels || !data.values || data.values.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
      return;
    }
    
    const maxValue = Math.max(...data.values, 1);
    const points = [];
    
    // Calculate points
    data.values.forEach((value, index) => {
      const x = padding + (index * chartWidth) / (data.values.length - 1);
      const y = padding + (chartHeight - (value / maxValue) * chartHeight);
      points.push({ x, y, value });
    });
    
    // Draw line
    ctx.strokeStyle = options.lineColor || '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = options.pointColor || '#3b82f6';
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    data.labels.forEach((label, index) => {
      const point = points[index];
      if (point) {
        ctx.fillText(label, point.x, height - padding + 15);
      }
    });
    
    // Draw values
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '12px system-ui';
    points.forEach(point => {
      const text = options.formatValue ? options.formatValue(point.value) : point.value.toString();
      ctx.fillText(text, point.x, point.y - 10);
    });
  }
  
  function drawDonutChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const innerRadius = radius * 0.6;
    
    // Clear canvas
    ctx.fillStyle = options.backgroundColor || '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    if (!data.values || data.values.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
      return;
    }
    
    const total = data.values.reduce((sum, val) => sum + val, 0);
    const colors = options.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    
    let currentAngle = -Math.PI / 2;
    
    data.values.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();
      
      // Draw label
      if (value > 0) {
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelRadius = radius + 20;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;
        
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`${data.labels[index]}: ${value}`, labelX, labelY);
      }
      
      currentAngle += sliceAngle;
    });
  }
  
  function getMonthlyRevenueData(monthlyRevenue) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const data = { labels: [], values: [] };
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      data.labels.push(months[date.getMonth()]);
      data.values.push(monthlyRevenue[monthKey] || 0);
    }
    
    return data;
  }
  
  function formatCurrency(value) {
    return `€${value.toLocaleString()}`;
  }
  
  function initReportsPage() {
    console.log('📊 Initializing enhanced reports page with unified metrics');
    
    // Use unified metrics if available, otherwise fallback to local calculations
    let metrics;
    if (window.UBAMetrics) {
      metrics = window.UBAMetrics.calculate();
    } else {
      // Fallback to original calculations
      const revenueMetrics = calculateRevenueMetrics();
      const clientMetrics = calculateClientMetrics();
      const projectMetrics = calculateProjectMetrics();
      const taskMetrics = calculateTaskMetrics();
      
      metrics = {
        revenue: revenueMetrics,
        clients: clientMetrics,
        projects: projectMetrics,
        tasks: taskMetrics
      };
    }
    
    // Update KPI cards with unified data
    const kpiTotalRevenue = document.getElementById('kpi-total-revenue');
    const kpiRevenueChange = document.getElementById('kpi-revenue-change');
    const kpiTotalInvoices = document.getElementById('kpi-total-invoices');
    const kpiInvoicesChange = document.getElementById('kpi-invoices-change');
    const kpiTotalClients = document.getElementById('kpi-total-clients');
    const kpiClientsChange = document.getElementById('kpi-clients-change');
    const kpiTasksCompleted = document.getElementById('kpi-tasks-completed');
    const kpiTasksChange = document.getElementById('kpi-tasks-change');
    
    if (kpiTotalRevenue) {
      const formatCurrency = window.UBAMetrics ? window.UBAMetrics.formatCurrency : (val => `€${(val || 0).toLocaleString()}`);
      kpiTotalRevenue.textContent = formatCurrency(metrics.revenue.totalRevenue || 0);
    }
    
    if (kpiRevenueChange) {
      kpiRevenueChange.textContent = `€${(metrics.revenue.thisMonthRevenue || 0).toLocaleString()} this month`;
    }
    
    if (kpiTotalInvoices) {
      kpiTotalInvoices.textContent = (metrics.revenue.totalInvoices || 0).toString();
    }
    
    if (kpiInvoicesChange) {
      const overdueCount = metrics.revenue.overdueInvoices || 0;
      kpiInvoicesChange.textContent = overdueCount > 0 ? `${overdueCount} overdue` : 'All current';
      kpiInvoicesChange.className = 'reports-kpi-change' + (overdueCount > 0 ? ' negative' : '');
    }
    
    if (kpiTotalClients) {
      kpiTotalClients.textContent = (metrics.clients.totalClients || 0).toString();
    }
    
    if (kpiClientsChange) {
      kpiClientsChange.textContent = `${metrics.clients.newThisMonth || 0} new this month`;
    }
    
    if (kpiTasksCompleted) {
      kpiTasksCompleted.textContent = (metrics.tasks.done || metrics.tasks.completedThisMonth || 0).toString();
    }
    
    if (kpiTasksChange) {
      kpiTasksChange.textContent = `${metrics.tasks.todo || 0} due today`;
    }
    
    // Render charts with unified metrics data
    const revenueChart = document.getElementById('revenue-chart');
    if (revenueChart && metrics.revenue.monthlyRevenue) {
      const monthlyData = getMonthlyRevenueData(metrics.revenue.monthlyRevenue);
      drawLineChart(revenueChart, monthlyData, {
        lineColor: '#10b981',
        pointColor: '#10b981',
        formatValue: (val) => `€${(val || 0).toLocaleString()}`
      });
    }
    
    const invoicesChart = document.getElementById('invoices-chart');
    if (invoicesChart) {
      const invoiceData = {
        labels: ['Paid', 'Overdue', 'Draft'],
        values: [
          metrics.revenue.paidInvoices || 0,
          Math.round(metrics.revenue.overdueInvoices / Math.max(metrics.revenue.averageInvoiceValue || 1000, 1)),
          metrics.revenue.draftInvoices || 0
        ]
      };
      drawDonutChart(invoicesChart, invoiceData, {
        colors: ['#10b981', '#ef4444', '#6b7280']
      });
    }
    
    const projectsChart = document.getElementById('projects-chart');
    if (projectsChart) {
      const projectData = {
        labels: ['Lead', 'In Progress', 'Ongoing', 'Completed'],
        values: [
          metrics.projects.lead,
          metrics.projects.in_progress,
          metrics.projects.ongoing,
          metrics.projects.completed
        ]
      };
      drawBarChart(projectsChart, projectData, {
        barColor: '#3b82f6'
      });
    }
    
    const tasksChart = document.getElementById('tasks-chart');
    if (tasksChart) {
      const taskData = {
        labels: ['To Do', 'In Progress', 'Done'],
        values: [metrics.tasks.todo, metrics.tasks.in_progress, metrics.tasks.done]
      };
      drawDonutChart(tasksChart, taskData, {
        colors: ['#f59e0b', '#3b82f6', '#10b981']
      });
    }
  }

  window.initReportsPage = initReportsPage;
})();
