// analytics-dashboard-ui.js — Usage Analytics Dashboard UI for Settings
// Displays charts, metrics, and insights from usage analytics data
(function () {
  'use strict';

  function log(...args) {
    console.log('[Analytics Dashboard]', ...args);
  }

  const AnalyticsDashboardUI = {
    async init() {
      log('Initializing Analytics Dashboard');
      await this.loadDashboard();
    },

    async loadDashboard() {
      await Promise.all([
        this.renderActivityScore(),
        this.renderUsageSummary(),
        this.renderEventTimeline(),
        this.renderTopEntities(),
        this.renderEventsByType()
      ]);
    },

    async renderActivityScore() {
      const container = document.getElementById('activity-score-display');
      if (!container) return;

      const score = await window.UBA.analytics.getWorkspaceActivityScore();

      const scoreClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';

      container.innerHTML = `
        <div class="activity-score ${scoreClass}">
          <div class="score-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" stroke-width="8"/>
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent)" stroke-width="8"
                      stroke-dasharray="${score * 3.4} 340" 
                      stroke-linecap="round"
                      transform="rotate(-90 60 60)"/>
            </svg>
            <div class="score-value">${score}</div>
          </div>
          <div class="score-label">Workspace Activity Score</div>
          <p class="score-description">
            ${score >= 70 ? 'Excellent! Your workspace is highly active.' :
              score >= 40 ? 'Good activity level. Consider increasing engagement.' :
              'Low activity. Encourage team to use the platform more.'}
          </p>
        </div>
      `;
    },

    async renderUsageSummary() {
      const container = document.getElementById('usage-summary-display');
      if (!container) return;

      const summary = await window.UBA.analytics.getUsageSummary();

      container.innerHTML = `
        <div class="usage-summary-grid">
          <div class="usage-card">
            <div class="usage-icon">📊</div>
            <div class="usage-value">${summary.totalEvents}</div>
            <div class="usage-label">Total Events</div>
          </div>
          <div class="usage-card">
            <div class="usage-icon">👥</div>
            <div class="usage-value">${Object.keys(summary.eventsByUser).length}</div>
            <div class="usage-label">Active Users</div>
          </div>
          <div class="usage-card">
            <div class="usage-icon">📄</div>
            <div class="usage-value">${Object.keys(summary.eventsByPage).length}</div>
            <div class="usage-label">Pages Visited</div>
          </div>
          <div class="usage-card">
            <div class="usage-icon">🎯</div>
            <div class="usage-value">${Object.keys(summary.eventsByType).length}</div>
            <div class="usage-label">Event Types</div>
          </div>
        </div>

        <div class="usage-breakdown">
          <h4>Events by Type</h4>
          <div class="event-type-list">
            ${Object.entries(summary.eventsByType)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([type, count]) => `
                <div class="event-type-item">
                  <span class="event-type-name">${this.formatEventType(type)}</span>
                  <span class="event-type-count">${count}</span>
                </div>
              `).join('')}
          </div>
        </div>
      `;
    },

    async renderEventTimeline() {
      const container = document.getElementById('event-timeline-chart');
      if (!container) return;

      const timeline = await window.UBA.analytics.getEventTimeline(30);

      // Simple ASCII-style bar chart
      const maxEvents = Math.max(...timeline.map(d => d.total), 1);

      container.innerHTML = `
        <h4>Event Timeline (Last 30 Days)</h4>
        <div class="timeline-chart">
          ${timeline.slice(-14).map(day => {
            const height = (day.total / maxEvents) * 100;
            return `
              <div class="timeline-bar-wrapper">
                <div class="timeline-bar" 
                     style="height: ${height}%" 
                     title="${day.date}: ${day.total} events">
                  <span class="timeline-value">${day.total}</span>
                </div>
                <div class="timeline-date">${this.formatDate(day.date)}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    },

    async renderTopEntities() {
      const container = document.getElementById('top-entities-display');
      if (!container) return;

      const topClients = await window.UBA.analytics.getTopEntities('clients', 5);
      const topProjects = await window.UBA.analytics.getTopEntities('projects', 5);

      container.innerHTML = `
        <div class="top-entities-grid">
          <div class="top-entities-card">
            <h4>Most Active Clients</h4>
            ${topClients.length > 0 ? `
              <div class="entity-list">
                ${topClients.map((entity, i) => `
                  <div class="entity-item">
                    <span class="entity-rank">${i + 1}</span>
                    <span class="entity-name">${entity.name}</span>
                    <span class="entity-activity">${entity.totalActivity} events</span>
                  </div>
                `).join('')}
              </div>
            ` : '<p class="text-muted">No client activity yet</p>'}
          </div>

          <div class="top-entities-card">
            <h4>Most Active Projects</h4>
            ${topProjects.length > 0 ? `
              <div class="entity-list">
                ${topProjects.map((entity, i) => `
                  <div class="entity-item">
                    <span class="entity-rank">${i + 1}</span>
                    <span class="entity-name">${entity.name}</span>
                    <span class="entity-activity">${entity.totalActivity} events</span>
                  </div>
                `).join('')}
              </div>
            ` : '<p class="text-muted">No project activity yet</p>'}
          </div>
        </div>
      `;
    },

    async renderEventsByType() {
      const container = document.getElementById('events-by-type-chart');
      if (!container) return;

      const summary = await window.UBA.analytics.getUsageSummary();
      const eventTypes = Object.entries(summary.eventsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      const total = eventTypes.reduce((sum, [, count]) => sum + count, 0);

      container.innerHTML = `
        <h4>Events Distribution</h4>
        <div class="events-pie-chart">
          ${eventTypes.map(([type, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            return `
              <div class="pie-slice-label">
                <span class="pie-color" style="background: ${this.getColorForEventType(type)}"></span>
                <span class="pie-type">${this.formatEventType(type)}</span>
                <span class="pie-percentage">${percentage}%</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    },

    formatEventType(type) {
      return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    },

    formatDate(dateStr) {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    },

    getColorForEventType(type) {
      const colors = {
        'page_view': '#3b82f6',
        'entity_create': '#10b981',
        'entity_update': '#f59e0b',
        'entity_delete': '#ef4444',
        'automation_run': '#8b5cf6',
        'billing_action': '#06b6d4',
        'member_action': '#ec4899',
        'paywall_trigger': '#f97316'
      };
      return colors[type] || '#6b7280';
    }
  };

  // Expose globally
  window.AnalyticsDashboardUI = AnalyticsDashboardUI;

  log('Analytics Dashboard UI module loaded');
})();
