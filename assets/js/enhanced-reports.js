// enhanced-reports.js - Professional business analytics with Chart.js
(function() {
  'use strict';

  const REPORT_CONSTANTS = {
    currency: 'EUR',
    monthsBack: 12,
    projectMonthsBack: 6,
    taskWeeksBack: 8,
    maxModalRows: 15,
    reportPrefix: 'UBA Business Report'
  };

  const REPORT_STATE = {
    exportControls: null,
    charts: new Set(),
    kpiHandlersBound: false,
    snapshot: null
  };

  const KPI_CONFIG = [
    {
      valueId: 'kpi-total-revenue',
      changeId: 'kpi-revenue-change',
      modal: 'revenue',
      value: (snapshot) => formatCurrency(snapshot.revenue.total, { maximumFractionDigits: 0 }),
      change: (snapshot) => snapshot.revenue.trend === null
        ? 'Stable quarter'
        : `${snapshot.revenue.trend >= 0 ? '+' : ''}${snapshot.revenue.trend.toFixed(1)}% QoQ`,
      highlight: (snapshot) => snapshot.revenue.trend !== null && snapshot.revenue.trend < 0
    },
    {
      valueId: 'kpi-total-invoices',
      changeId: 'kpi-invoices-change',
      modal: 'invoices',
      value: (snapshot) => snapshot.meta.invoices.length.toString(),
      change: (snapshot) => snapshot.invoiceStatus.overdueCount > 0
        ? `${snapshot.invoiceStatus.overdueCount} overdue`
        : 'All current',
      highlight: (snapshot) => snapshot.invoiceStatus.overdueCount > 0
    },
    {
      valueId: 'kpi-total-clients',
      changeId: 'kpi-clients-change',
      modal: 'clients',
      value: (snapshot) => snapshot.clients.total.toString(),
      change: (snapshot) => snapshot.clients.total === 0
        ? 'No clients yet'
        : `${snapshot.clients.paying} paying (${formatPercentage(snapshot.clients.paying / snapshot.clients.total)})`,
      highlight: () => false
    },
    {
      valueId: 'kpi-tasks-completed',
      changeId: 'kpi-tasks-change',
      modal: 'tasks',
      value: (snapshot) => snapshot.taskStatus.done.toString(),
      change: (snapshot) => `${snapshot.taskStatus.todo} open / ${snapshot.taskStatus.overdue} overdue`,
      highlight: (snapshot) => snapshot.taskStatus.overdue > 0
    }
  ];

  const MODAL_TITLES = {
    revenue: 'Revenue Analysis',
    invoices: 'Invoice Performance',
    clients: 'Client Overview',
    tasks: 'Task Analytics'
  };

  const CHART_COLORS = {
    primary: '#667eea',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    slate: '#64748b',
    gradient: {
      revenue: ['#0f172a', '#0f172a00'],
      tasks: ['#10b981', '#10b98100']
    }
  };

  const CHART_BASE_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          color: '#64748b',
          padding: 16,
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
          color: 'rgba(148, 163, 184, 0.12)',
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
          color: 'rgba(148, 163, 184, 0.12)',
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

  function isReportsPage() {
    const pageMarker = document.getElementById('page-id');
    if (pageMarker?.dataset?.page === 'reports-page') {
      return true;
    }
    if (document.body?.dataset?.activeView === 'reports') {
      return true;
    }
    if (document.querySelector('[data-view="reports"]')) {
      return true;
    }
    return window.location.pathname.includes('reports');
  }

  function teardownReportsUI() {
    REPORT_STATE.charts.forEach((chart) => {
      try {
        chart?.destroy?.();
      } catch (error) {
        console.warn('Chart teardown failed', error);
      }
    });
    REPORT_STATE.charts.clear();

    document.querySelectorAll('.enhanced-reports-modal').forEach((modal) => modal.remove());

    if (REPORT_STATE.exportControls) {
      REPORT_STATE.exportControls.remove();
      REPORT_STATE.exportControls = null;
    }

    REPORT_STATE.kpiHandlersBound = false;
    REPORT_STATE.snapshot = null;
  }

  function registerChartInstance(canvas, chart) {
    if (!chart || !canvas) return;
    if (canvas.chart) {
      REPORT_STATE.charts.delete(canvas.chart);
      canvas.chart.destroy();
    }
    canvas.chart = chart;
    REPORT_STATE.charts.add(chart);
  }

  function ensureReportsContext() {
    const isContext = isReportsPage();
    if (!isContext) {
      teardownReportsUI();
    }
    return isContext;
  }

  function getReportSnapshot({ force = false } = {}) {
    if (force || !REPORT_STATE.snapshot) {
      REPORT_STATE.snapshot = collectReportData();
    }
    return REPORT_STATE.snapshot;
  }

  function collectReportData() {
    const invoices = getStoreCollection('invoices');
    const clients = getStoreCollection('clients');
    const tasks = getStoreCollection('tasks');
    const projects = getStoreCollection('projects');

    return {
      revenue: buildRevenueSeries(invoices),
      projectVelocity: buildProjectVelocitySeries(projects),
      taskCompletion: buildTaskCompletionSeries(tasks),
      taskStatus: buildTaskStatusBreakdown(tasks),
      invoiceStatus: buildInvoiceStatusBreakdown(invoices),
      clients: buildClientRevenueInsights(clients, invoices),
      meta: { invoices, clients, tasks, projects }
    };
  }

  function getStoreCollection(key) {
    return window.ubaStore?.[key]?.getAll?.() || [];
  }

  function resolveDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function calculateMonthIndex(target, reference) {
    const ref = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const tgt = new Date(target.getFullYear(), target.getMonth(), 1);
    return (ref.getFullYear() - tgt.getFullYear()) * 12 + (ref.getMonth() - tgt.getMonth());
  }

  function calculateWeekIndex(target, reference) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const ref = new Date(reference);
    const tgt = new Date(target);
    ref.setHours(0, 0, 0, 0);
    tgt.setHours(0, 0, 0, 0);
    return Math.floor((ref - tgt) / msPerWeek);
  }

  function calculatePercentageChange(current, previous) {
    if (previous === 0) {
      return current === 0 ? 0 : null;
    }
    return ((current - previous) / previous) * 100;
  }

  function formatCurrency(value = 0, options = {}) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: options.currency || REPORT_CONSTANTS.currency,
      notation: options.compact ? 'compact' : 'standard',
      maximumFractionDigits: options.maximumFractionDigits ?? (options.compact ? 1 : 2)
    });
    return formatter.format(Number(value) || 0);
  }

  function formatPercentage(value, fallback = '0%') {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return fallback;
    }
    return `${(value * 100).toFixed(0)}%`;
  }

  function formatDate(value, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
    const date = resolveDate(value);
    return date ? date.toLocaleDateString('en-US', options) : '—';
  }

  function escapeHtml(value = '') {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildRevenueSeries(invoices) {
    const now = new Date();
    const labels = [];
    const data = new Array(REPORT_CONSTANTS.monthsBack).fill(0);

    for (let i = REPORT_CONSTANTS.monthsBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    }

    const paidInvoices = [];

    invoices.forEach((invoice) => {
      if (invoice.status !== 'paid') return;
      const invoiceDate = resolveDate(invoice.date || invoice.created_at);
      if (!invoiceDate) return;
      const diff = calculateMonthIndex(invoiceDate, now);
      if (diff < 0 || diff >= REPORT_CONSTANTS.monthsBack) return;
      const bucketIndex = REPORT_CONSTANTS.monthsBack - 1 - diff;
      data[bucketIndex] += Number(invoice.amount) || 0;
      paidInvoices.push({ ...invoice, parsedDate: invoiceDate });
    });

    const total = data.reduce((sum, value) => sum + value, 0);
    const avgInvoice = paidInvoices.length ? total / paidInvoices.length : 0;
    const trailing = data.slice(-3).reduce((sum, value) => sum + value, 0);
    const prior = data.slice(-6, -3).reduce((sum, value) => sum + value, 0);
    const trend = data.length < 6 ? null : calculatePercentageChange(trailing, prior);
    const peakIndex = data.indexOf(Math.max(...data));

    paidInvoices.sort((a, b) => b.parsedDate - a.parsedDate);

    return {
      labels,
      data,
      total,
      avgInvoice,
      paidInvoices,
      trend,
      bestMonth: peakIndex >= 0 ? labels[peakIndex] : null,
      lastUpdated: new Date()
    };
  }

  function buildProjectVelocitySeries(projects) {
    const now = new Date();
    const buckets = [];

    for (let i = REPORT_CONSTANTS.projectMonthsBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        started: 0,
        completed: 0
      });
    }

    projects.forEach((project) => {
      const createdDate = resolveDate(project.created_at || project.createdAt || project.date_created);
      if (createdDate) {
        const bucket = buckets.find((entry) => entry.key === `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`);
        if (bucket) {
          bucket.started += 1;
        }
      }

      let completionDate = resolveDate(project.completed_at || project.completedAt);
      if (!completionDate && (project.progress >= 100 || project.status === 'done')) {
        completionDate = resolveDate(project.updated_at || project.updatedAt);
      }

      if (completionDate) {
        const bucket = buckets.find((entry) => entry.key === `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}`);
        if (bucket) {
          bucket.completed += 1;
        }
      }
    });

    return {
      labels: buckets.map((bucket) => bucket.label),
      started: buckets.map((bucket) => bucket.started),
      completed: buckets.map((bucket) => bucket.completed)
    };
  }

  function buildTaskCompletionSeries(tasks) {
    const now = new Date();
    const labels = [];
    const data = new Array(REPORT_CONSTANTS.taskWeeksBack).fill(0);

    for (let i = REPORT_CONSTANTS.taskWeeksBack - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * 7);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      labels.push(weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    tasks.forEach((task) => {
      if (task.status !== 'done') return;
      const completionDate = resolveDate(task.completed_at || task.completedAt || task.updated_at);
      if (!completionDate) return;
      const diff = calculateWeekIndex(completionDate, now);
      if (diff < 0 || diff >= REPORT_CONSTANTS.taskWeeksBack) return;
      const bucketIndex = REPORT_CONSTANTS.taskWeeksBack - 1 - diff;
      data[bucketIndex] += 1;
    });

    return { labels, data };
  }

  function buildTaskStatusBreakdown(tasks) {
    const statusCounts = { todo: 0, in_progress: 0, done: 0, overdue: 0 };
    const now = new Date();

    tasks.forEach((task) => {
      const status = task.status || 'todo';
      if (status !== 'done' && task.due_date) {
        const dueDate = resolveDate(task.due_date);
        if (dueDate && dueDate < now) {
          statusCounts.overdue += 1;
          return;
        }
      }
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status] += 1;
      } else {
        statusCounts.todo += 1;
      }
    });

    return statusCounts;
  }

  function buildInvoiceStatusBreakdown(invoices) {
    const statusCounts = { paid: 0, sent: 0, draft: 0, overdue: 0 };
    const overdueInvoices = [];
    const now = new Date();

    invoices.forEach((invoice) => {
      const status = invoice.status || 'draft';
      if (status === 'sent' && invoice.due_date) {
        const dueDate = resolveDate(invoice.due_date);
        if (dueDate && dueDate < now) {
          statusCounts.overdue += 1;
          overdueInvoices.push(invoice);
          return;
        }
      }
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status] += 1;
      }
    });

    return {
      breakdown: statusCounts,
      overdueCount: overdueInvoices.length,
      overdueInvoices
    };
  }

  function buildClientRevenueInsights(clients, invoices) {
    const clientEntries = clients.map((client) => {
      const paidInvoices = invoices.filter((invoice) => invoice.client_id === client.id && invoice.status === 'paid');
      const revenue = paidInvoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
      return {
        ...client,
        revenue,
        invoiceCount: paidInvoices.length
      };
    });

    const sortedEntries = [...clientEntries].sort((a, b) => b.revenue - a.revenue);
    const payingClients = sortedEntries.filter((client) => client.revenue > 0);

    return {
      total: clients.length,
      paying: payingClients.length,
      topClient: payingClients[0] || null,
      revenueTable: sortedEntries
    };
  }

  function buildGradient(ctx, colors) {
    if (!ctx || !colors?.length) return colors?.[0] || CHART_COLORS.primary;
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    return gradient;
  }

  function createChart(canvasId, builder) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    const chart = builder(ctx);
    registerChartInstance(canvas, chart);
  }

  // Chart Creation Functions
  function createRevenueChart(snapshot) {
    createChart('revenue-chart', (ctx) => new Chart(ctx, {
      type: 'line',
      data: {
        labels: snapshot.revenue.labels,
        datasets: [{
          label: 'Monthly Revenue',
          data: snapshot.revenue.data,
          borderColor: CHART_COLORS.success,
          backgroundColor: buildGradient(ctx, CHART_COLORS.gradient.revenue),
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: CHART_COLORS.success,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        ...CHART_BASE_OPTIONS,
        plugins: {
          ...CHART_BASE_OPTIONS.plugins,
          tooltip: {
            ...CHART_BASE_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (context) => `Revenue: ${formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          ...CHART_BASE_OPTIONS.scales,
          y: {
            ...CHART_BASE_OPTIONS.scales.y,
            beginAtZero: true,
            ticks: {
              ...CHART_BASE_OPTIONS.scales.y.ticks,
              callback: (value) => formatCurrency(value, { maximumFractionDigits: 0 })
            }
          }
        }
      }
    }));
  }

  function createProjectVelocityChart(snapshot) {
    createChart('projects-chart', (ctx) => new Chart(ctx, {
      type: 'bar',
      data: {
        labels: snapshot.projectVelocity.labels,
        datasets: [
          {
            label: 'Projects Started',
            data: snapshot.projectVelocity.started,
            backgroundColor: `${CHART_COLORS.info}80`,
            borderColor: CHART_COLORS.info,
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Projects Completed',
            data: snapshot.projectVelocity.completed,
            backgroundColor: `${CHART_COLORS.success}90`,
            borderColor: CHART_COLORS.success,
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        ...CHART_BASE_OPTIONS,
        scales: {
          ...CHART_BASE_OPTIONS.scales,
          y: {
            ...CHART_BASE_OPTIONS.scales.y,
            beginAtZero: true,
            ticks: {
              ...CHART_BASE_OPTIONS.scales.y.ticks,
              stepSize: 1
            }
          }
        }
      }
    }));
  }

  function createTaskCompletionChart(snapshot) {
    createChart('tasks-chart', (ctx) => new Chart(ctx, {
      type: 'bar',
      data: {
        labels: snapshot.taskCompletion.labels,
        datasets: [{
          label: 'Tasks Completed',
          data: snapshot.taskCompletion.data,
          backgroundColor: buildGradient(ctx, CHART_COLORS.gradient.tasks),
          borderColor: CHART_COLORS.success,
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        ...CHART_BASE_OPTIONS,
        scales: {
          ...CHART_BASE_OPTIONS.scales,
          y: {
            ...CHART_BASE_OPTIONS.scales.y,
            beginAtZero: true,
            ticks: {
              ...CHART_BASE_OPTIONS.scales.y.ticks,
              stepSize: 1
            }
          }
        }
      }
    }));
  }

  function createInvoiceStatusChart(snapshot) {
    const labels = ['Paid', 'Sent', 'Draft', 'Overdue'];
    const data = labels.map((label) => snapshot.invoiceStatus.breakdown[label.toLowerCase()] || 0);

    createChart('invoices-chart', (ctx) => new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [CHART_COLORS.success, CHART_COLORS.info, CHART_COLORS.warning, CHART_COLORS.danger],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverBorderWidth: 5
        }]
      },
      options: {
        ...CHART_BASE_OPTIONS,
        cutout: '60%',
        plugins: {
          ...CHART_BASE_OPTIONS.plugins,
          legend: {
            ...CHART_BASE_OPTIONS.plugins.legend,
            position: 'right'
          }
        }
      }
    }));
  }

  // Export Functions
  function generateCSVReport(snapshot = getReportSnapshot()) {
    const rows = [];
    rows.push([REPORT_CONSTANTS.reportPrefix, new Date().toLocaleDateString()]);
    rows.push([]);

    rows.push(['Revenue (Last 12 Months)']);
    rows.push(['Month', 'Revenue']);
    snapshot.revenue.labels.forEach((label, index) => {
      rows.push([label, snapshot.revenue.data[index]]);
    });
    rows.push([]);

    rows.push(['Project Velocity']);
    rows.push(['Month', 'Started', 'Completed']);
    snapshot.projectVelocity.labels.forEach((label, index) => {
      rows.push([label, snapshot.projectVelocity.started[index], snapshot.projectVelocity.completed[index]]);
    });
    rows.push([]);

    rows.push(['Task Completion']);
    rows.push(['Week', 'Completed Tasks']);
    snapshot.taskCompletion.labels.forEach((label, index) => {
      rows.push([label, snapshot.taskCompletion.data[index]]);
    });
    rows.push([]);

    rows.push(['Invoice Status']);
    rows.push(['Paid', 'Sent', 'Draft', 'Overdue']);
    const status = snapshot.invoiceStatus.breakdown;
    rows.push([status.paid, status.sent, status.draft, status.overdue]);
    rows.push([]);

    rows.push(['Client Revenue Breakdown']);
    rows.push(['Client', 'Email', 'Invoices', 'Revenue']);
    snapshot.clients.revenueTable.forEach((client) => {
      rows.push([
        client.name || 'Unnamed Client',
        client.email || 'N/A',
        client.invoiceCount,
        client.revenue
      ]);
    });

    downloadTextFile(buildCSV(rows), `${REPORT_CONSTANTS.reportPrefix.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  }

  function generatePDFReport(snapshot = getReportSnapshot()) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert('PDF generation library not loaded. Please refresh the page.');
      return;
    }

    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text(REPORT_CONSTANTS.reportPrefix, 20, yPosition);

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(new Date().toLocaleDateString(), 20, yPosition + 10);
    yPosition += 30;

    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Key Metrics', 20, yPosition);
    yPosition += 12;

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Revenue: ${formatCurrency(snapshot.revenue.total)}`, 20, yPosition);
    doc.text(`Paid Invoices: ${snapshot.revenue.paidInvoices.length}`, 20, yPosition + 8);
    doc.text(`Active Clients: ${snapshot.clients.total}`, 20, yPosition + 16);
    doc.text(`Completed Tasks: ${snapshot.taskStatus.done}`, 20, yPosition + 24);
    doc.text(`Overdue Invoices: ${snapshot.invoiceStatus.overdueCount}`, 20, yPosition + 32);
    yPosition += 48;

    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Revenue Trend', 20, yPosition);
    yPosition += 12;

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    snapshot.revenue.labels.forEach((label, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${label}: ${formatCurrency(snapshot.revenue.data[index])}`, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Client Highlights', 20, yPosition);
    yPosition += 12;

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const topClients = snapshot.clients.revenueTable.slice(0, 5);
    if (topClients.length === 0) {
      doc.text('No paying clients yet.', 20, yPosition);
      yPosition += 6;
    }
    topClients.forEach((client) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${client.name || 'Unnamed Client'} · ${client.invoiceCount} invoices · ${formatCurrency(client.revenue)}`, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text('Operational Snapshot', 20, yPosition);
    yPosition += 12;

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Tasks - To Do: ${snapshot.taskStatus.todo}, In Progress: ${snapshot.taskStatus.in_progress}, Overdue: ${snapshot.taskStatus.overdue}`, 20, yPosition);
    doc.text(`Projects - Started vs Completed (last ${REPORT_CONSTANTS.projectMonthsBack} months)`, 20, yPosition + 8);
    yPosition += 30;

    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Generated by UBA - Universal Business Automator', 20, 285);

    doc.save(`${REPORT_CONSTANTS.reportPrefix.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  function buildCSV(rows) {
    return rows.map((row) => row.map((cell) => {
      const value = cell === null || cell === undefined ? '' : cell;
      const stringValue = typeof value === 'number' ? value : String(value);
      if (typeof value === 'number') {
        return value;
      }
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',')).join('\n');
  }

  function downloadTextFile(content, filename, mime = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Detailed Report Modal
  function createDetailedReportModal(type, snapshot) {
    const modalContentBuilder = {
      revenue: generateRevenueModalContent,
      invoices: generateInvoicesModalContent,
      clients: generateClientsModalContent,
      tasks: generateTasksModalContent
    }[type];

    const modal = document.createElement('div');
    modal.className = 'enhanced-reports-modal';
    modal.innerHTML = `
      <div class="enhanced-reports-modal-content">
        <div class="enhanced-reports-modal-header">
          <h2>${escapeHtml(MODAL_TITLES[type] || 'Detailed Report')}</h2>
          <button class="enhanced-reports-modal-close" aria-label="Close" type="button">×</button>
        </div>
        <div class="enhanced-reports-modal-body">
          ${modalContentBuilder ? modalContentBuilder(snapshot) : '<p>No data available.</p>'}
        </div>
        <div class="enhanced-reports-modal-footer">
          <button class="uba-btn secondary" data-modal-action="close">Close</button>
          <button class="uba-btn primary" data-modal-action="export" data-modal-type="${type}">Export Data</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.matches('[data-modal-action="close"], .enhanced-reports-modal-close')) {
        modal.remove();
      }
      if (event.target.matches('[data-modal-action="export"]')) {
        exportDetailedData(event.target.dataset.modalType);
      }
    });

    document.body.appendChild(modal);
  }

  function generateRevenueModalContent(snapshot) {
    const { revenue } = snapshot;
    const invoices = revenue.paidInvoices.slice(0, REPORT_CONSTANTS.maxModalRows);

    return `
      <div class="enhanced-reports-stats-grid">
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${formatCurrency(revenue.total)}</div>
          <div class="enhanced-reports-stat-label">Total Revenue</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${revenue.paidInvoices.length}</div>
          <div class="enhanced-reports-stat-label">Paid Invoices</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${formatCurrency(revenue.avgInvoice)}</div>
          <div class="enhanced-reports-stat-label">Average Invoice</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${revenue.bestMonth || '—'}</div>
          <div class="enhanced-reports-stat-label">Peak Month</div>
        </div>
      </div>
      <div class="enhanced-reports-table">
        <h3>Recent Paid Invoices</h3>
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Paid Date</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.length === 0 ? '<tr><td colspan="4">No paid invoices available.</td></tr>' : invoices.map((invoice) => `
              <tr>
                <td>#${escapeHtml(invoice.number || invoice.id)}</td>
                <td>${escapeHtml(invoice.client_name || 'N/A')}</td>
                <td>${formatCurrency(invoice.amount)}</td>
                <td>${formatDate(invoice.date || invoice.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function generateInvoicesModalContent(snapshot) {
    const invoices = snapshot.meta.invoices;

    return `
      <div class="enhanced-reports-stats-grid">
        ${['paid', 'sent', 'overdue', 'draft'].map((status) => `
          <div class="enhanced-reports-stat">
            <div class="enhanced-reports-stat-value">${snapshot.invoiceStatus.breakdown[status]}</div>
            <div class="enhanced-reports-stat-label">${status.charAt(0).toUpperCase() + status.slice(1)}</div>
          </div>
        `).join('')}
      </div>
      <div class="enhanced-reports-table">
        <h3>Invoices</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Issued</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.length === 0 ? '<tr><td colspan="5">No invoices recorded.</td></tr>' : invoices.slice(0, REPORT_CONSTANTS.maxModalRows).map((invoice) => `
              <tr>
                <td>#${escapeHtml(invoice.number || invoice.id)}</td>
                <td>${escapeHtml(invoice.client_name || 'N/A')}</td>
                <td>${formatCurrency(invoice.amount)}</td>
                <td><span class="enhanced-reports-status ${escapeHtml(invoice.status || 'draft')}">${escapeHtml(invoice.status || 'draft')}</span></td>
                <td>${formatDate(invoice.date || invoice.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function generateClientsModalContent(snapshot) {
    const tableRows = snapshot.clients.revenueTable.slice(0, REPORT_CONSTANTS.maxModalRows);

    return `
      <div class="enhanced-reports-stats-grid">
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${snapshot.clients.total}</div>
          <div class="enhanced-reports-stat-label">Total Clients</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${snapshot.clients.paying}</div>
          <div class="enhanced-reports-stat-label">Paying Clients</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${snapshot.clients.topClient ? formatCurrency(snapshot.clients.topClient.revenue) : '—'}</div>
          <div class="enhanced-reports-stat-label">Top Client Revenue</div>
        </div>
      </div>
      <div class="enhanced-reports-table">
        <h3>Client Revenue</h3>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Invoices</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows.length === 0 ? '<tr><td colspan="4">No client data available.</td></tr>' : tableRows.map((client) => `
              <tr>
                <td>${escapeHtml(client.name || 'Unnamed Client')}</td>
                <td>${escapeHtml(client.email || 'N/A')}</td>
                <td>${client.invoiceCount}</td>
                <td>${formatCurrency(client.revenue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function generateTasksModalContent(snapshot) {
    const tasks = snapshot.meta.tasks.slice(0, REPORT_CONSTANTS.maxModalRows);

    return `
      <div class="enhanced-reports-stats-grid">
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${snapshot.taskStatus.done}</div>
          <div class="enhanced-reports-stat-label">Completed</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${snapshot.taskStatus.in_progress}</div>
          <div class="enhanced-reports-stat-label">In Progress</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${snapshot.taskStatus.todo}</div>
          <div class="enhanced-reports-stat-label">To Do</div>
        </div>
        <div class="enhanced-reports-stat">
          <div class="enhanced-reports-stat-value">${snapshot.taskStatus.overdue}</div>
          <div class="enhanced-reports-stat-label">Overdue</div>
        </div>
      </div>
      <div class="enhanced-reports-table">
        <h3>Tasks</h3>
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
            ${tasks.length === 0 ? '<tr><td colspan="4">No tasks available.</td></tr>' : tasks.map((task) => `
              <tr>
                <td>${escapeHtml(task.title || 'Untitled Task')}</td>
                <td><span class="enhanced-reports-status ${escapeHtml(task.status || 'todo')}">${escapeHtml(task.status || 'todo')}</span></td>
                <td><span class="enhanced-reports-priority ${escapeHtml(task.priority || 'medium')}">${escapeHtml(task.priority || 'medium')}</span></td>
                <td>${task.due_date ? formatDate(task.due_date) : 'No due date'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function buildDetailedCsv(type, snapshot) {
    switch (type) {
      case 'revenue': {
        const rows = [['Invoice #', 'Client', 'Amount', 'Paid Date']];
        snapshot.revenue.paidInvoices.forEach((invoice) => {
          rows.push([
            invoice.number || invoice.id,
            invoice.client_name || 'N/A',
            invoice.amount || 0,
            formatDate(invoice.date || invoice.created_at)
          ]);
        });
        return buildCSV(rows);
      }
      case 'invoices': {
        const rows = [['Invoice #', 'Client', 'Amount', 'Status', 'Issued']];
        snapshot.meta.invoices.forEach((invoice) => {
          rows.push([
            invoice.number || invoice.id,
            invoice.client_name || 'N/A',
            invoice.amount || 0,
            invoice.status || 'draft',
            formatDate(invoice.date || invoice.created_at)
          ]);
        });
        return buildCSV(rows);
      }
      case 'clients': {
        const rows = [['Client', 'Email', 'Invoices', 'Revenue']];
        snapshot.clients.revenueTable.forEach((client) => {
          rows.push([
            client.name || 'Unnamed Client',
            client.email || 'N/A',
            client.invoiceCount,
            client.revenue
          ]);
        });
        return buildCSV(rows);
      }
      case 'tasks': {
        const rows = [['Title', 'Status', 'Priority', 'Due Date']];
        snapshot.meta.tasks.forEach((task) => {
          rows.push([
            task.title || 'Untitled Task',
            task.status || 'todo',
            task.priority || 'medium',
            task.due_date ? formatDate(task.due_date) : ''
          ]);
        });
        return buildCSV(rows);
      }
      default:
        return '';
    }
  }

  function exportDetailedData(type) {
    const snapshot = getReportSnapshot();
    const csv = buildDetailedCsv(type, snapshot);
    if (!csv) {
      alert('No export available for this dataset yet.');
      return;
    }
    downloadTextFile(csv, `UBA_${type}_detail_${new Date().toISOString().split('T')[0]}.csv`);
  }

  // Initialize Enhanced Reports
  function initEnhancedReports({ forceRefresh = false } = {}) {
    console.log('📊 Initializing Enhanced Reports with Chart.js');

    if (!ensureReportsContext()) {
      console.log('↩️ Enhanced Reports init skipped — not on reports page');
      return;
    }

    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded, Enhanced Reports unavailable');
      return;
    }

    const snapshot = getReportSnapshot({ force: forceRefresh });
    updateKPICards(snapshot);

    setTimeout(() => {
      createRevenueChart(snapshot);
      createProjectVelocityChart(snapshot);
      createTaskCompletionChart(snapshot);
      createInvoiceStatusChart(snapshot);
    }, 0);

    setupKPICardClickHandlers();
    setupExportButtons();

    console.log('✅ Enhanced Reports initialized successfully');
  }

  function updateKPICards(snapshot) {
    KPI_CONFIG.forEach((config) => {
      const valueElement = document.getElementById(config.valueId);
      const changeElement = document.getElementById(config.changeId);
      const highlight = config.highlight(snapshot);

      if (valueElement) {
        valueElement.textContent = config.value(snapshot);
        valueElement.style.color = highlight ? CHART_COLORS.danger : '';
      }

      if (changeElement) {
        changeElement.textContent = config.change(snapshot);
        changeElement.style.color = highlight ? CHART_COLORS.danger : '';
      }
    });
  }

  function setupKPICardClickHandlers() {
    if (REPORT_STATE.kpiHandlersBound) return;

    const kpiCards = document.querySelectorAll('.reports-kpi-card');
    kpiCards.forEach((card, index) => {
      const config = KPI_CONFIG[index];
      if (!config) return;
      card.style.cursor = 'pointer';
      card.dataset.modalTarget = config.modal;
      card.addEventListener('click', () => {
        createDetailedReportModal(config.modal, getReportSnapshot());
      });
    });

    REPORT_STATE.kpiHandlersBound = true;
  }

  function setupExportButtons() {
    const topRight = document.querySelector('.uba-top-right');
    if (!topRight || REPORT_STATE.exportControls) return;

    const exportButtons = document.createElement('div');
    exportButtons.className = 'enhanced-reports-export-buttons';
    exportButtons.innerHTML = `
      <button class="uba-btn secondary" data-export="csv">📊 Export CSV</button>
      <button class="uba-btn primary" data-export="pdf">📑 Export PDF</button>
    `;

    exportButtons.querySelector('[data-export="csv"]').addEventListener('click', () => {
      generateCSVReport(getReportSnapshot());
    });

    exportButtons.querySelector('[data-export="pdf"]').addEventListener('click', () => {
      generatePDFReport(getReportSnapshot());
    });

    topRight.appendChild(exportButtons);
    REPORT_STATE.exportControls = exportButtons;
  }

  window.enhancedReports = {
    exportCSV: () => generateCSVReport(getReportSnapshot()),
    exportPDF: () => generatePDFReport(getReportSnapshot()),
    showDetailedReport: (type) => createDetailedReportModal(type, getReportSnapshot()),
    refresh: () => initEnhancedReports({ forceRefresh: true })
  };

  window.exportDetailedData = exportDetailedData;

  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-view="reports"]')) {
      initEnhancedReports();
    } else {
      ensureReportsContext();
    }
  });

  window.initEnhancedReports = initEnhancedReports;

})();