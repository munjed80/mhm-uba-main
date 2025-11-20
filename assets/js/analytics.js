// analytics.js — Usage Analytics System for MHM UBA
// Track events, aggregate data, and provide insights on workspace activity
(function () {
  'use strict';

  // ===============================
  // Configuration
  // ===============================
  const ANALYTICS_STORAGE_KEY = 'uba-analytics-events';
  const ANALYTICS_SUMMARY_KEY = 'uba-analytics-summary';
  const MAX_EVENTS_PER_WORKSPACE = 10000; // Limit to prevent excessive storage

  // Event types
  const EVENT_TYPES = {
    PAGE_VIEW: 'page_view',
    ENTITY_CREATE: 'entity_create',
    ENTITY_UPDATE: 'entity_update',
    ENTITY_DELETE: 'entity_delete',
    AUTOMATION_RUN: 'automation_run',
    BILLING_ACTION: 'billing_action',
    MEMBER_ACTION: 'member_action',
    PAYWALL_TRIGGER: 'paywall_trigger',
    LOGIN: 'login',
    LOGOUT: 'logout',
    WORKSPACE_SWITCH: 'workspace_switch',
    EXPORT: 'export',
    IMPORT: 'import',
    REPORT_GENERATE: 'report_generate'
  };

  // ===============================
  // Utility Functions
  // ===============================
  function log(...args) {
    console.log('[UBA Analytics]', ...args);
  }

  function warn(...args) {
    console.warn('[UBA Analytics]', ...args);
  }

  function getJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      warn('getJSON error:', key, e);
      return fallback;
    }
  }

  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      warn('setJSON error:', key, e);
      return false;
    }
  }

  function generateId() {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function getDateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getWeekKey(date) {
    const d = new Date(date);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  function getMonthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // ===============================
  // Analytics Engine
  // ===============================
  const AnalyticsEngine = {
    /**
     * Track an event
     */
    async trackEvent(eventType, data = {}) {
      const workspace = window.UBA && window.UBA.session ? window.UBA.session.currentWorkspace : null;
      const user = window.UBA && window.UBA.session ? window.UBA.session.currentUser : null;

      if (!workspace) {
        warn('Cannot track event: no active workspace');
        return Promise.resolve(null);
      }

      const event = {
        id: generateId(),
        type: eventType,
        workspaceId: workspace.id,
        userId: user ? user.id : null,
        userEmail: user ? user.email : null,
        timestamp: new Date().toISOString(),
        data: data,
        page: window.location.pathname,
        userAgent: navigator.userAgent
      };

      // Get existing events
      const allEvents = getJSON(ANALYTICS_STORAGE_KEY, {});
      if (!allEvents[workspace.id]) {
        allEvents[workspace.id] = [];
      }

      // Add new event
      allEvents[workspace.id].push(event);

      // Trim if exceeds limit
      if (allEvents[workspace.id].length > MAX_EVENTS_PER_WORKSPACE) {
        allEvents[workspace.id] = allEvents[workspace.id].slice(-MAX_EVENTS_PER_WORKSPACE);
      }

      // Save
      setJSON(ANALYTICS_STORAGE_KEY, allEvents);

      log(`Event tracked: ${eventType}`, data);
      return Promise.resolve(event);
    },

    /**
     * Get all events for current workspace
     */
    async getEvents(workspaceId = null) {
      const workspace = workspaceId || (window.UBA && window.UBA.session ? window.UBA.session.currentWorkspace.id : null);
      if (!workspace) {
        return Promise.resolve([]);
      }

      const allEvents = getJSON(ANALYTICS_STORAGE_KEY, {});
      return Promise.resolve(allEvents[workspace] || []);
    },

    /**
     * Get events filtered by date range
     */
    async getEventsByDateRange(startDate, endDate, workspaceId = null) {
      const events = await this.getEvents(workspaceId);
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      const filtered = events.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= start && eventTime <= end;
      });

      return Promise.resolve(filtered);
    },

    /**
     * Get usage summary
     */
    async getUsageSummary(period = 'daily', workspaceId = null) {
      const events = await this.getEvents(workspaceId);

      const summary = {
        totalEvents: events.length,
        eventsByType: {},
        eventsByPage: {},
        eventsByUser: {},
        dailyActivity: {},
        weeklyActivity: {},
        monthlyActivity: {}
      };

      events.forEach(event => {
        // By type
        summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;

        // By page
        summary.eventsByPage[event.page] = (summary.eventsByPage[event.page] || 0) + 1;

        // By user
        const userKey = event.userEmail || 'anonymous';
        summary.eventsByUser[userKey] = (summary.eventsByUser[userKey] || 0) + 1;

        // By day
        const dayKey = getDateKey(event.timestamp);
        summary.dailyActivity[dayKey] = (summary.dailyActivity[dayKey] || 0) + 1;

        // By week
        const weekKey = getWeekKey(event.timestamp);
        summary.weeklyActivity[weekKey] = (summary.weeklyActivity[weekKey] || 0) + 1;

        // By month
        const monthKey = getMonthKey(event.timestamp);
        summary.monthlyActivity[monthKey] = (summary.monthlyActivity[monthKey] || 0) + 1;
      });

      return Promise.resolve(summary);
    },

    /**
     * Get event timeline (daily aggregates for charts)
     */
    async getEventTimeline(days = 30, workspaceId = null) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await this.getEventsByDateRange(startDate, endDate, workspaceId);

      const timeline = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = getDateKey(d);
        timeline[key] = {
          date: key,
          total: 0,
          byType: {}
        };
      }

      events.forEach(event => {
        const key = getDateKey(event.timestamp);
        if (timeline[key]) {
          timeline[key].total++;
          timeline[key].byType[event.type] = (timeline[key].byType[event.type] || 0) + 1;
        }
      });

      return Promise.resolve(Object.values(timeline));
    },

    /**
     * Get top entities by activity
     */
    async getTopEntities(entityType = 'clients', limit = 10, workspaceId = null) {
      const events = await this.getEvents(workspaceId);

      const entityEvents = events.filter(e =>
        (e.type === EVENT_TYPES.ENTITY_CREATE ||
         e.type === EVENT_TYPES.ENTITY_UPDATE ||
         e.type === EVENT_TYPES.ENTITY_DELETE) &&
        e.data.entityType === entityType
      );

      const entityCounts = {};
      entityEvents.forEach(event => {
        const entityId = event.data.entityId || 'unknown';
        const entityName = event.data.entityName || entityId;

        if (!entityCounts[entityId]) {
          entityCounts[entityId] = {
            id: entityId,
            name: entityName,
            type: entityType,
            createCount: 0,
            updateCount: 0,
            deleteCount: 0,
            totalActivity: 0
          };
        }

        if (event.type === EVENT_TYPES.ENTITY_CREATE) {
          entityCounts[entityId].createCount++;
        } else if (event.type === EVENT_TYPES.ENTITY_UPDATE) {
          entityCounts[entityId].updateCount++;
        } else if (event.type === EVENT_TYPES.ENTITY_DELETE) {
          entityCounts[entityId].deleteCount++;
        }

        entityCounts[entityId].totalActivity++;
      });

      const sorted = Object.values(entityCounts)
        .sort((a, b) => b.totalActivity - a.totalActivity)
        .slice(0, limit);

      return Promise.resolve(sorted);
    },

    /**
     * Get user activity heatmap
     */
    async getUserHeatmap(days = 30, workspaceId = null) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await this.getEventsByDateRange(startDate, endDate, workspaceId);

      const heatmap = {};
      events.forEach(event => {
        const dateKey = getDateKey(event.timestamp);
        const hour = new Date(event.timestamp).getHours();

        if (!heatmap[dateKey]) {
          heatmap[dateKey] = {};
          for (let h = 0; h < 24; h++) {
            heatmap[dateKey][h] = 0;
          }
        }

        heatmap[dateKey][hour]++;
      });

      return Promise.resolve(heatmap);
    },

    /**
     * Get workspace activity score (0-100)
     */
    async getWorkspaceActivityScore(workspaceId = null) {
      const summary = await this.getUsageSummary('daily', workspaceId);
      const timeline = await this.getEventTimeline(7, workspaceId); // Last 7 days

      // Calculate score based on various metrics
      let score = 0;

      // Base score from total events (max 30 points)
      const eventScore = Math.min(30, summary.totalEvents / 10);
      score += eventScore;

      // Consistency score (max 30 points)
      const activeDays = timeline.filter(day => day.total > 0).length;
      const consistencyScore = (activeDays / 7) * 30;
      score += consistencyScore;

      // Diversity score (max 20 points)
      const uniqueEventTypes = Object.keys(summary.eventsByType).length;
      const diversityScore = Math.min(20, uniqueEventTypes * 2);
      score += diversityScore;

      // User engagement score (max 20 points)
      const activeUsers = Object.keys(summary.eventsByUser).length;
      const engagementScore = Math.min(20, activeUsers * 5);
      score += engagementScore;

      return Promise.resolve(Math.round(score));
    },

    /**
     * Clear analytics data
     */
    async clearAnalytics(workspaceId = null) {
      const workspace = workspaceId || (window.UBA && window.UBA.session ? window.UBA.session.currentWorkspace.id : null);
      if (!workspace) {
        return Promise.resolve(false);
      }

      const allEvents = getJSON(ANALYTICS_STORAGE_KEY, {});
      delete allEvents[workspace];
      setJSON(ANALYTICS_STORAGE_KEY, allEvents);

      log(`Analytics cleared for workspace: ${workspace}`);
      return Promise.resolve(true);
    },

    /**
     * Export analytics data
     */
    async exportAnalytics(workspaceId = null) {
      const events = await this.getEvents(workspaceId);
      const summary = await this.getUsageSummary('daily', workspaceId);
      const timeline = await this.getEventTimeline(30, workspaceId);
      const score = await this.getWorkspaceActivityScore(workspaceId);

      return Promise.resolve({
        events,
        summary,
        timeline,
        activityScore: score,
        exportedAt: new Date().toISOString()
      });
    }
  };

  // ===============================
  // Convenience Trackers
  // ===============================
  const Trackers = {
    trackPageView(page) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.PAGE_VIEW, { page });
    },

    trackEntityCreate(entityType, entityId, entityName) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.ENTITY_CREATE, {
        entityType,
        entityId,
        entityName
      });
    },

    trackEntityUpdate(entityType, entityId, entityName, changes) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.ENTITY_UPDATE, {
        entityType,
        entityId,
        entityName,
        changes
      });
    },

    trackEntityDelete(entityType, entityId, entityName) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.ENTITY_DELETE, {
        entityType,
        entityId,
        entityName
      });
    },

    trackAutomationRun(automationId, automationName, result) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.AUTOMATION_RUN, {
        automationId,
        automationName,
        result
      });
    },

    trackBillingAction(action, planId, amount) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.BILLING_ACTION, {
        action,
        planId,
        amount
      });
    },

    trackMemberAction(action, memberId, memberEmail, role) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.MEMBER_ACTION, {
        action,
        memberId,
        memberEmail,
        role
      });
    },

    trackPaywallTrigger(feature, planRequired, currentPlan) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.PAYWALL_TRIGGER, {
        feature,
        planRequired,
        currentPlan
      });
    },

    trackLogin(email) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.LOGIN, { email });
    },

    trackLogout() {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.LOGOUT, {});
    },

    trackWorkspaceSwitch(fromWorkspaceId, toWorkspaceId) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.WORKSPACE_SWITCH, {
        fromWorkspaceId,
        toWorkspaceId
      });
    },

    trackExport(exportType, recordCount) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.EXPORT, {
        exportType,
        recordCount
      });
    },

    trackImport(importType, recordCount) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.IMPORT, {
        importType,
        recordCount
      });
    },

    trackReportGenerate(reportType, filters) {
      return AnalyticsEngine.trackEvent(EVENT_TYPES.REPORT_GENERATE, {
        reportType,
        filters
      });
    }
  };

  // ===============================
  // Expose API
  // ===============================
  if (!window.UBA) {
    window.UBA = {};
  }

  window.UBA.analytics = {
    // Core methods
    trackEvent: (type, data) => AnalyticsEngine.trackEvent(type, data),
    getEvents: (workspaceId) => AnalyticsEngine.getEvents(workspaceId),
    getEventsByDateRange: (start, end, workspaceId) => AnalyticsEngine.getEventsByDateRange(start, end, workspaceId),

    // Summary & insights
    getUsageSummary: (period, workspaceId) => AnalyticsEngine.getUsageSummary(period, workspaceId),
    getEventTimeline: (days, workspaceId) => AnalyticsEngine.getEventTimeline(days, workspaceId),
    getTopEntities: (entityType, limit, workspaceId) => AnalyticsEngine.getTopEntities(entityType, limit, workspaceId),
    getUserHeatmap: (days, workspaceId) => AnalyticsEngine.getUserHeatmap(days, workspaceId),
    getWorkspaceActivityScore: (workspaceId) => AnalyticsEngine.getWorkspaceActivityScore(workspaceId),

    // Utilities
    clearAnalytics: (workspaceId) => AnalyticsEngine.clearAnalytics(workspaceId),
    exportAnalytics: (workspaceId) => AnalyticsEngine.exportAnalytics(workspaceId),

    // Convenience trackers
    track: Trackers,

    // Constants
    EVENT_TYPES
  };

  // Auto-track page views
  document.addEventListener('DOMContentLoaded', () => {
    UBA.analytics.track.trackPageView(window.location.pathname);
  });

  log('Analytics module loaded');
})();
