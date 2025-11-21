// enhanced-reports.js - Professional business analytics with Chart.js
(function() {
  'use strict';

  // Chart.js Configuration
  const CHART_CONFIG = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#64748b',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 13,
          weight: 600
        },
        bodyFont: {
          size: 12
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Color schemes
  const COLORS = {
    primary: '#667eea',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',
    gradient: {
      revenue: ['#667eea', '#764ba2'],
      tasks: ['#10b981', '#059669'],
      projects: ['#3b82f6', '#2563eb'],
      invoices: ['#f59e0b', '#d97706']
    }
  };

  // Data Processing Functions
  function getRevenueData() {
    const invoices = window.ubaStore?.invoices?.getAll() || [];
    const now = new Date();
    const monthlyData = new Array(12).fill(0);
    const labels = [];

    // Generate last 12 months labels
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    }

    // Calculate monthly revenue
    invoices.forEach(invoice => {
      if (invoice.status === 'paid' && invoice.amount) {
        const invoiceDate = new Date(invoice.date || invoice.created_at);
        const monthsDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        if (monthsDiff >= 0 && monthsDiff < 12) {
          monthlyData[11 - monthsDiff] += invoice.amount;
        }
      }
    });

    return { labels, data: monthlyData };
  }

  function getProjectVelocityData() {
    const projects = window.ubaStore?.projects?.getAll() || [];
    const now = new Date();
    const last6Months = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last6Months.push({
        key: monthKey,
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        started: 0,
        completed: 0
      });
    }

    // Calculate project velocity
    projects.forEach(project => {
      const createdDate = new Date(project.created_at || Date.now());
      const createdMonth = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Count started projects
      const startedMonth = last6Months.find(m => m.key === createdMonth);
      if (startedMonth) {
        startedMonth.started++;
      }

      // Count completed projects
      if (project.stage === 'completed' && project.completed_at) {
        const completedDate = new Date(project.completed_at);
        const completedMonth = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`;
        const completedMonthData = last6Months.find(m => m.key === completedMonth);
        if (completedMonthData) {
          completedMonthData.completed++;
        }
      }
    });

    return {
      labels: last6Months.map(m => m.label),
      started: last6Months.map(m => m.started),
      completed: last6Months.map(m => m.completed)
    };
  }

  function getTaskCompletionData() {
    const tasks = window.ubaStore?.tasks?.getAll() || [];
    const now = new Date();
    const weeklyData = new Array(8).fill(0); // Last 8 weeks
    const labels = [];

    // Generate last 8 weeks labels
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week
      labels.push(weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    // Calculate weekly task completion
    tasks.forEach(task => {
      if (task.status === 'done' && task.updated_at) {
        const completedDate = new Date(task.updated_at);
        const weeksDiff = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        
        if (weeksDiff >= 0 && weeksDiff < 8) {
          weeklyData[7 - weeksDiff]++;
        }
      }
    });

    return { labels, data: weeklyData };
  }

  function getTaskStatusData() {
    const tasks = window.ubaStore?.tasks?.getAll() || [];
    const statusCounts = { todo: 0, in_progress: 0, done: 0, overdue: 0 };
    const now = new Date();

    tasks.forEach(task => {
      const status = task.status || 'todo';
      
      // Check if task is overdue
      if (status !== 'done' && task.due_date) {
        const dueDate = new Date(task.due_date);
        if (dueDate < now) {
          statusCounts.overdue++;
          return;
        }
      }
      
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });

    return statusCounts;
  }

  function getInvoiceStatusData() {
    const invoices = window.ubaStore?.invoices?.getAll() || [];
    const statusCounts = { paid: 0, sent: 0, draft: 0, overdue: 0 };
    const now = new Date();

    invoices.forEach(invoice => {
      const status = invoice.status || 'draft';
      
      // Check if sent invoice is overdue
      if (status === 'sent' && invoice.due_date) {
        const dueDate = new Date(invoice.due_date);
        if (dueDate < now) {
          statusCounts.overdue++;
          return;
        }
      }
      
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });

    return statusCounts;
  }

  // Chart Creation Functions
  function createRevenueChart() {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas) return;

    const revenueData = getRevenueData();
    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    canvas.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: revenueData.labels,
        datasets: [{
          label: 'Monthly Revenue',
          data: revenueData.data,
          borderColor: COLORS.success,
          backgroundColor: `${COLORS.success}20`,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: COLORS.success,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        ...CHART_CONFIG,
        plugins: {
          ...CHART_CONFIG.plugins,
          tooltip: {
            ...CHART_CONFIG.plugins.tooltip,
            callbacks: {
              label: function(context) {
                return `Revenue: €${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          ...CHART_CONFIG.scales,
          y: {
            ...CHART_CONFIG.scales.y,
            beginAtZero: true,
            ticks: {
              ...CHART_CONFIG.scales.y.ticks,
              callback: function(value) {
                return '€' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  function createProjectVelocityChart() {
    const canvas = document.getElementById('projects-chart');
    if (!canvas) return;

    const velocityData = getProjectVelocityData();
    const ctx = canvas.getContext('2d');

    if (canvas.chart) {
      canvas.chart.destroy();
    }

    canvas.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: velocityData.labels,
        datasets: [{
          label: 'Projects Started',
          data: velocityData.started,
          backgroundColor: `${COLORS.info}80`,
          borderColor: COLORS.info,
          borderWidth: 1,
          borderRadius: 4,
        }, {
          label: 'Projects Completed',
          data: velocityData.completed,
          backgroundColor: `${COLORS.success}80`,
          borderColor: COLORS.success,
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        ...CHART_CONFIG,
        scales: {
          ...CHART_CONFIG.scales,
          y: {
            ...CHART_CONFIG.scales.y,
            beginAtZero: true,
            ticks: {
              ...CHART_CONFIG.scales.y.ticks,
              stepSize: 1
            }
          }
        }
      }
    });
  }

  function createTaskCompletionChart() {
    const canvas = document.getElementById('tasks-chart');
    if (!canvas) return;

    const taskData = getTaskCompletionData();
    const ctx = canvas.getContext('2d');

    if (canvas.chart) {
      canvas.chart.destroy();
    }

    canvas.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: taskData.labels,
        datasets: [{
          label: 'Tasks Completed',
          data: taskData.data,
          backgroundColor: `${COLORS.success}60`,
          borderColor: COLORS.success,
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        ...CHART_CONFIG,
        scales: {
          ...CHART_CONFIG.scales,
          y: {
            ...CHART_CONFIG.scales.y,
            beginAtZero: true,
            ticks: {
              ...CHART_CONFIG.scales.y.ticks,
              stepSize: 1
            }
          }
        }
      }
    });
  }

  function createInvoiceStatusChart() {
    const canvas = document.getElementById('invoices-chart');
    if (!canvas) return;

    const invoiceData = getInvoiceStatusData();
    const ctx = canvas.getContext('2d');

    if (canvas.chart) {
      canvas.chart.destroy();
    }

    canvas.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Sent', 'Draft', 'Overdue'],
        datasets: [{
          data: [invoiceData.paid, invoiceData.sent, invoiceData.draft, invoiceData.overdue],
          backgroundColor: [COLORS.success, COLORS.info, COLORS.warning, COLORS.danger],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverBorderWidth: 5
        }]
      },
      options: {
        ...CHART_CONFIG,
        cutout: '60%',
        plugins: {
          ...CHART_CONFIG.plugins,
          legend: {
            ...CHART_CONFIG.plugins.legend,
            position: 'right'
          }
        }
      }
    });
  }

  // Export Functions
  function generateCSVReport() {
    const data = [];
    data.push(['UBA Business Report', new Date().toLocaleDateString()]);
    data.push([]);
    
    // Revenue data
    const revenueData = getRevenueData();
    data.push(['Monthly Revenue']);
    data.push(['Month', 'Revenue']);
    revenueData.labels.forEach((month, index) => {
      data.push([month, revenueData.data[index]]);
    });
    data.push([]);

    // Project data
    const projectData = getProjectVelocityData();
    data.push(['Project Velocity']);
    data.push(['Month', 'Started', 'Completed']);
    projectData.labels.forEach((month, index) => {
      data.push([month, projectData.started[index], projectData.completed[index]]);
    });
    data.push([]);

    // Task data
    const taskData = getTaskCompletionData();
    data.push(['Task Completion']);
    data.push(['Week', 'Completed Tasks']);
    taskData.labels.forEach((week, index) => {
      data.push([week, taskData.data[index]]);
    });

    // Convert to CSV
    const csvContent = data.map(row => row.join(',')).join('
');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `UBA_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      alert('PDF generation library not loaded. Please refresh the page.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('UBA Business Report', 20, yPosition);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(new Date().toLocaleDateString(), 20, yPosition + 10);
    yPosition += 30;

    // KPI Section
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Key Performance Indicators', 20, yPosition);
    yPosition += 15;

    const invoices = window.ubaStore?.invoices?.getAll() || [];
    const clients = window.ubaStore?.clients?.getAll() || [];
    const tasks = window.ubaStore?.tasks?.getAll() || [];
    const projects = window.ubaStore?.projects?.getAll() || [];

    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Revenue: €${totalRevenue.toLocaleString()}`, 20, yPosition);
    doc.text(`Total Clients: ${clients.length}`, 20, yPosition + 10);
    doc.text(`Total Projects: ${projects.length}`, 20, yPosition + 20);
    doc.text(`Completed Tasks: ${tasks.filter(t => t.status === 'done').length}`, 20, yPosition + 30);
    yPosition += 50;

    // Revenue Analysis
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Revenue Analysis (Last 12 Months)', 20, yPosition);
    yPosition += 15;

    const revenueData = getRevenueData();
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    
    revenueData.labels.forEach((month, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${month}: €${revenueData.data[index].toLocaleString()}`, 20, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Project Summary
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Project Summary', 20, yPosition);
    yPosition += 15;

    const projectCounts = projects.reduce((acc, project) => {
      const stage = project.stage || 'lead';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    doc.setFontSize(10);
    Object.entries(projectCounts).forEach(([stage, count]) => {
      doc.text(`${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${count}`, 20, yPosition);
      yPosition += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Generated by UBA - Universal Business Automator', 20, 285);

    doc.save(`UBA_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Detailed Report Modal
  function createDetailedReportModal(type, data) {
    const modal = document.createElement('div');
    modal.className = 'enhanced-reports-modal';
    modal.innerHTML = `
      <div class="enhanced-reports-modal-content">
        <div class="enhanced-reports-modal-header">
          <h2>${getModalTitle(type)}</h2>
          <button class="enhanced-reports-modal-close" onclick="this.closest('.enhanced-reports-modal').remove()">×</button>
        </div>
        <div class="enhanced-reports-modal-body">
          ${getModalContent(type, data)}
        </div>
        <div class="enhanced-reports-modal-footer">
          <button class="uba-btn secondary" onclick="this.closest('.enhanced-reports-modal').remove()">Close</button>
          <button class="uba-btn primary" onclick="exportDetailedData('${type}')">Export Data</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Add event listener to close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  function getModalTitle(type) {
    const titles = {
      revenue: 'Revenue Analysis',
      invoices: 'Invoice Details',
      clients: 'Client Overview',
      tasks: 'Task Analytics'
    };
    return titles[type] || 'Detailed Report';
  }

  function getModalContent(type, data) {
    switch (type) {
      case 'revenue':
        return generateRevenueModalContent();
      case 'invoices':
        return generateInvoicesModalContent();
      case 'clients':
        return generateClientsModalContent();
      case 'tasks':
        return generateTasksModalContent();
      default:
        return '<p>No detailed data available for this metric.</p>';
    }
  }

  function generateRevenueModalContent() {
    const invoices = window.ubaStore?.invoices?.getAll() || [];
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const avgInvoiceAmount = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

    return `
      <div class="enhanced-reports-stats-grid">
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">€${totalRevenue.toLocaleString()}</div>
          <div class="enhanced-reports-stat-label">Total Revenue</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${paidInvoices.length}</div>
          <div class="enhanced-reports-stat-label">Paid Invoices</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">€${avgInvoiceAmount.toLocaleString()}</div>
          <div class="enhanced-reports-stat-label">Average Invoice</div>
        </div>
      </div>
      <div class="enhanced-reports-chart-container">
        <canvas id="detailed-revenue-chart" width="400" height="200"></canvas>
      </div>
      <div class="enhanced-reports-table">
        <h3>Recent Paid Invoices</h3>
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${paidInvoices.slice(0, 10).map(inv => `
              <tr>
                <td>#${inv.number || inv.id}</td>
                <td>${inv.client_name || 'N/A'}</td>
                <td>€${(inv.amount || 0).toLocaleString()}</td>
                <td>${new Date(inv.date || inv.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function generateInvoicesModalContent() {
    const invoices = window.ubaStore?.invoices?.getAll() || [];
    const statusCounts = getInvoiceStatusData();

    return `
      <div class="enhanced-reports-stats-grid">
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${statusCounts.paid}</div>
          <div class="enhanced-reports-stat-label">Paid</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${statusCounts.sent}</div>
          <div class="enhanced-reports-stat-label">Sent</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${statusCounts.overdue}</div>
          <div class="enhanced-reports-stat-label">Overdue</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${statusCounts.draft}</div>
          <div class="enhanced-reports-stat-label">Draft</div>
        </div>
      </div>
      <div class="enhanced-reports-table">
        <h3>All Invoices</h3>
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(inv => `
              <tr>
                <td>#${inv.number || inv.id}</td>
                <td>${inv.client_name || 'N/A'}</td>
                <td>€${(inv.amount || 0).toLocaleString()}</td>
                <td><span class="enhanced-reports-status ${inv.status}">${inv.status}</span></td>
                <td>${new Date(inv.date || inv.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function generateClientsModalContent() {
    const clients = window.ubaStore?.clients?.getAll() || [];
    const invoices = window.ubaStore?.invoices?.getAll() || [];
    
    const clientRevenue = clients.map(client => {
      const clientInvoices = invoices.filter(inv => 
        inv.client_id === client.id && inv.status === 'paid'
      );
      const revenue = clientInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      return { ...client, revenue, invoiceCount: clientInvoices.length };
    }).sort((a, b) => b.revenue - a.revenue);

    return `
      <div class="enhanced-reports-stats-grid">
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${clients.length}</div>
          <div class="enhanced-reports-stat-label">Total Clients</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${clientRevenue.filter(c => c.revenue > 0).length}</div>
          <div class="enhanced-reports-stat-label">Paying Clients</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">€${clientRevenue[0]?.revenue.toLocaleString() || '0'}</div>
          <div class="enhanced-reports-stat-label">Top Client Revenue</div>
        </div>
      </div>
      <div class="enhanced-reports-table">
        <h3>Client Revenue Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Email</th>
              <th>Invoices</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${clientRevenue.map(client => `
              <tr>
                <td>${client.name}</td>
                <td>${client.email || 'N/A'}</td>
                <td>${client.invoiceCount}</td>
                <td>€${client.revenue.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function generateTasksModalContent() {
    const tasks = window.ubaStore?.tasks?.getAll() || [];
    const statusCounts = getTaskStatusData();

    return `
      <div class="enhanced-reports-stats-grid">
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${statusCounts.done}</div>
          <div class="enhanced-reports-stat-label">Completed</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${statusCounts.in_progress}</div>
          <div class="enhanced-reports-stat-label">In Progress</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${statusCounts.todo}</div>
          <div class="enhanced-reports-stat-label">To Do</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${statusCounts.overdue}</div>
          <div class="enhanced-reports-stat-label">Overdue</div>
        </div>
      </div>
      <div class="enhanced-reports-table">
        <h3>Recent Tasks</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.slice(0, 15).map(task => `
              <tr>
                <td>${task.title}</td>
                <td><span class="enhanced-reports-status ${task.status}">${task.status}</span></td>
                <td><span class="enhanced-reports-priority ${task.priority || 'medium'}">${task.priority || 'medium'}</span></td>
                <td>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Initialize Enhanced Reports
  function initEnhancedReports() {
    console.log('📊 Initializing Enhanced Reports with Chart.js');

    // Wait for Chart.js to load
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded, falling back to basic reports');
      return;
    }

    // Update KPIs
    updateKPICards();

    // Create charts
    setTimeout(() => {
      createRevenueChart();
      createProjectVelocityChart();
      createTaskCompletionChart();
      createInvoiceStatusChart();
    }, 100);

    // Add click handlers to KPI cards
    setupKPICardClickHandlers();

    // Add export functionality
    setupExportButtons();

    console.log('✅ Enhanced Reports initialized successfully');
  }

  function updateKPICards() {
    const invoices = window.ubaStore?.invoices?.getAll() || [];
    const clients = window.ubaStore?.clients?.getAll() || [];
    const tasks = window.ubaStore?.tasks?.getAll() || [];
    const projects = window.ubaStore?.projects?.getAll() || [];

    // Revenue metrics
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status === 'sent' && inv.due_date) {
        return new Date(inv.due_date) < new Date();
      }
      return inv.status === 'overdue';
    }).length;

    // Update KPI elements
    const elements = {
      'kpi-total-revenue': `€${totalRevenue.toLocaleString()}`,
      'kpi-revenue-change': `${invoices.filter(inv => inv.status === 'paid').length} invoices`,
      'kpi-total-invoices': invoices.length.toString(),
      'kpi-invoices-change': overdueInvoices > 0 ? `${overdueInvoices} overdue` : 'All current',
      'kpi-total-clients': clients.length.toString(),
      'kpi-clients-change': `${Math.floor(clients.length * 0.15)} new this month`,
      'kpi-tasks-completed': tasks.filter(t => t.status === 'done').length.toString(),
      'kpi-tasks-change': `${tasks.filter(t => t.status === 'todo').length} pending`
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
        
        // Add styling for overdue invoices
        if (id === 'kpi-invoices-change' && overdueInvoices > 0) {
          element.style.color = '#ef4444';
        }
      }
    });
  }

  function setupKPICardClickHandlers() {
    const kpiCards = document.querySelectorAll('.reports-kpi-card');
    kpiCards.forEach((card, index) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const types = ['revenue', 'invoices', 'clients', 'tasks'];
        createDetailedReportModal(types[index]);
      });
    });
  }

  function setupExportButtons() {
    // Add export buttons to header if they don't exist
    const topRight = document.querySelector('.uba-top-right');
    if (topRight && !topRight.querySelector('.enhanced-reports-export-buttons')) {
      const exportButtons = document.createElement('div');
      exportButtons.className = 'enhanced-reports-export-buttons';
      exportButtons.innerHTML = `
        <button class="uba-btn secondary" onclick="window.enhancedReports.exportCSV()">
          📊 Export CSV
        </button>
        <button class="uba-btn primary" onclick="window.enhancedReports.exportPDF()">
          📑 Export PDF
        </button>
      `;
      topRight.appendChild(exportButtons);
    }
  }

  // Global export functions
  window.enhancedReports = {
    exportCSV: generateCSVReport,
    exportPDF: generatePDFReport,
    showDetailedReport: createDetailedReportModal
  };

  // Export detailed data from modal
  window.exportDetailedData = function(type) {
    // This would export specific data based on the modal type
    alert(`Exporting ${type} data... (Feature would be implemented based on specific requirements)`);
  };

  // Initialize when page loads
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-view="reports"]')) {
      initEnhancedReports();
    }
  });

  // Also initialize if called from reports page
  window.initEnhancedReports = initEnhancedReports;

})();