// reports.js — reports page initializer
(function () {
  function initReportsPage() {
    const reports = window.ubaReports || {};
    const revenueKpi = document.getElementById("revenue-kpi");
    const revenueTable = document.getElementById("revenue-table");
    const activeClients = document.getElementById("active-clients");
    const projectsSummary = document.getElementById("projects-summary");
    const tasksOverview = document.getElementById("tasks-overview");

    if (revenueKpi) {
      revenueKpi.innerHTML = `<div class="uba-kpi"><div class="uba-kpi-label">This month</div><div class="uba-kpi-value">€ ${
        reports.revenue?.thisMonth || 0
      }</div></div>`;
    }

    if (revenueTable) {
      revenueTable.innerHTML = `<tr><td>Invoices</td><td>${reports.revenue?.invoices || 0}</td></tr><tr><td>Revenue</td><td>€ ${
        reports.revenue?.thisMonth || 0
      }</td></tr>`;
    }

    if (activeClients) {
      activeClients.textContent = reports.activeClients || 0;
    }

    if (projectsSummary) {
      projectsSummary.innerHTML = `<div>In progress: ${reports.projects?.inProgress || 0}</div><div>Completed: ${
        reports.projects?.completed || 0
      }</div><div>Stalled: ${reports.projects?.stalled || 0}</div>`;
    }

    if (tasksOverview) {
      tasksOverview.innerHTML = `<div>To do: ${reports.tasks?.todo || 0}</div><div>In progress: ${
        reports.tasks?.inProgress || 0
      }</div><div>Done: ${reports.tasks?.done || 0}</div>`;
    }
  }

  window.initReportsPage = initReportsPage;
})();
