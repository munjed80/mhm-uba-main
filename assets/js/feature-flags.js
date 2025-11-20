// feature-flags.js — Enterprise Feature Flags System for MHM UBA
// Supports boolean, percentage rollout, role-based, workspace-based, plan-based, and user-targeted rollouts
(function () {
  'use strict';

  // ===============================
  // Feature Flag Definitions
  // ===============================
  const DEFAULT_FLAGS = {
    'new-dashboard-layout': {
      id: 'new-dashboard-layout',
      name: 'New Dashboard Layout',
      description: 'Redesigned dashboard with modern UI',
      type: 'boolean', // boolean, percentage, role, workspace, plan, user
      enabled: false,
      rolloutPercentage: 0, // 0-100
      targetRoles: [], // ['owner', 'admin', 'editor', 'viewer']
      targetWorkspaces: [], // ['ws-xxx', 'ws-yyy']
      targetPlans: [], // ['free', 'pro', 'enterprise']
      targetUsers: [], // ['user-xxx@example.com']
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'advanced-automation-rules': {
      id: 'advanced-automation-rules',
      name: 'Advanced Automation Rules',
      description: 'Complex automation with conditional logic',
      type: 'plan',
      enabled: true,
      rolloutPercentage: 100,
      targetRoles: [],
      targetWorkspaces: [],
      targetPlans: ['pro', 'enterprise'],
      targetUsers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'ai-powered-insights': {
      id: 'ai-powered-insights',
      name: 'AI-Powered Insights',
      description: 'Machine learning insights and recommendations',
      type: 'plan',
      enabled: true,
      rolloutPercentage: 100,
      targetRoles: [],
      targetWorkspaces: [],
      targetPlans: ['pro', 'enterprise'],
      targetUsers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'beta-reporting-engine': {
      id: 'beta-reporting-engine',
      name: 'Beta Reporting Engine',
      description: 'Next-generation reporting with custom queries',
      type: 'percentage',
      enabled: true,
      rolloutPercentage: 25, // 25% gradual rollout
      targetRoles: [],
      targetWorkspaces: [],
      targetPlans: [],
      targetUsers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'mobile-app-beta': {
      id: 'mobile-app-beta',
      name: 'Mobile App Beta Access',
      description: 'Early access to mobile application',
      type: 'role',
      enabled: true,
      rolloutPercentage: 100,
      targetRoles: ['owner', 'admin'],
      targetWorkspaces: [],
      targetPlans: [],
      targetUsers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'real-time-collaboration': {
      id: 'real-time-collaboration',
      name: 'Real-time Collaboration',
      description: 'Live updates and collaborative editing',
      type: 'workspace',
      enabled: true,
      rolloutPercentage: 100,
      targetRoles: [],
      targetWorkspaces: [], // Will be populated with specific workspace IDs
      targetPlans: [],
      targetUsers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };

  // ===============================
  // Storage Keys
  // ===============================
  const FLAGS_STORAGE_KEY = 'uba-feature-flags';
  const FLAGS_OVERRIDES_KEY = 'uba-feature-flags-overrides';

  // ===============================
  // Utility Functions
  // ===============================
  function log(...args) {
    console.log('[UBA Feature Flags]', ...args);
  }

  function warn(...args) {
    console.warn('[UBA Feature Flags]', ...args);
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

  // Hash function for percentage rollout (deterministic based on user/workspace)
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  function getPercentageBucket(identifier) {
    // Returns 0-99
    return simpleHash(identifier) % 100;
  }

  // ===============================
  // Feature Flags Engine
  // ===============================
  const FeatureFlagsEngine = {
    /**
     * Initialize feature flags
     */
    async init() {
      log('Initializing Feature Flags System');

      // Load flags from storage or use defaults
      let flags = getJSON(FLAGS_STORAGE_KEY);
      if (!flags) {
        flags = DEFAULT_FLAGS;
        setJSON(FLAGS_STORAGE_KEY, flags);
        log('Initialized with default flags');
      }

      log('Feature Flags ready:', Object.keys(flags).length, 'flags loaded');
      return flags;
    },

    /**
     * Get all feature flags
     */
    async getAllFlags() {
      const flags = getJSON(FLAGS_STORAGE_KEY, DEFAULT_FLAGS);
      return Promise.resolve(flags);
    },

    /**
     * Get a specific flag
     */
    async getFlag(flagId) {
      const flags = await this.getAllFlags();
      return Promise.resolve(flags[flagId] || null);
    },

    /**
     * Check if a feature is enabled for the current context
     * @param {string} flagId - Feature flag ID
     * @param {object} context - Context object { user, workspace, role, plan }
     */
    async isEnabled(flagId, context = {}) {
      const flags = await this.getAllFlags();
      const overrides = getJSON(FLAGS_OVERRIDES_KEY, {});

      // Check manual override first
      if (overrides[flagId] !== undefined) {
        log(`Flag "${flagId}" overridden to:`, overrides[flagId]);
        return Promise.resolve(overrides[flagId]);
      }

      const flag = flags[flagId];
      if (!flag) {
        warn(`Flag "${flagId}" not found`);
        return Promise.resolve(false);
      }

      if (!flag.enabled) {
        return Promise.resolve(false);
      }

      // Extract context
      const user = context.user || (window.UBA && window.UBA.session ? window.UBA.session.currentUser : null);
      const workspace = context.workspace || (window.UBA && window.UBA.session ? window.UBA.session.currentWorkspace : null);
      const role = context.role || (window.Members ? window.Members.getCurrentUserRole() : null);
      const plan = context.plan || (workspace && workspace.subscription ? workspace.subscription.planId : 'free');

      // Evaluate based on flag type
      switch (flag.type) {
        case 'boolean':
          return Promise.resolve(flag.enabled);

        case 'percentage':
          // Use user email or workspace ID for consistent bucketing
          const identifier = user ? user.email : (workspace ? workspace.id : 'anonymous');
          const bucket = getPercentageBucket(identifier);
          const enabled = bucket < flag.rolloutPercentage;
          log(`Flag "${flagId}" percentage rollout: ${bucket}/${flag.rolloutPercentage} = ${enabled}`);
          return Promise.resolve(enabled);

        case 'role':
          if (!role || flag.targetRoles.length === 0) {
            return Promise.resolve(false);
          }
          const roleEnabled = flag.targetRoles.includes(role);
          log(`Flag "${flagId}" role check: ${role} in ${flag.targetRoles} = ${roleEnabled}`);
          return Promise.resolve(roleEnabled);

        case 'workspace':
          if (!workspace || flag.targetWorkspaces.length === 0) {
            return Promise.resolve(false);
          }
          const workspaceEnabled = flag.targetWorkspaces.includes(workspace.id);
          log(`Flag "${flagId}" workspace check: ${workspace.id} in ${flag.targetWorkspaces} = ${workspaceEnabled}`);
          return Promise.resolve(workspaceEnabled);

        case 'plan':
          if (!plan || flag.targetPlans.length === 0) {
            return Promise.resolve(false);
          }
          const planEnabled = flag.targetPlans.includes(plan);
          log(`Flag "${flagId}" plan check: ${plan} in ${flag.targetPlans} = ${planEnabled}`);
          return Promise.resolve(planEnabled);

        case 'user':
          if (!user || flag.targetUsers.length === 0) {
            return Promise.resolve(false);
          }
          const userEnabled = flag.targetUsers.includes(user.email);
          log(`Flag "${flagId}" user check: ${user.email} in ${flag.targetUsers} = ${userEnabled}`);
          return Promise.resolve(userEnabled);

        default:
          warn(`Unknown flag type: ${flag.type}`);
          return Promise.resolve(false);
      }
    },

    /**
     * Create or update a feature flag
     */
    async updateFlag(flagId, updates) {
      const flags = await this.getAllFlags();

      if (!flags[flagId]) {
        // Create new flag
        flags[flagId] = {
          id: flagId,
          name: updates.name || flagId,
          description: updates.description || '',
          type: updates.type || 'boolean',
          enabled: updates.enabled !== undefined ? updates.enabled : false,
          rolloutPercentage: updates.rolloutPercentage || 0,
          targetRoles: updates.targetRoles || [],
          targetWorkspaces: updates.targetWorkspaces || [],
          targetPlans: updates.targetPlans || [],
          targetUsers: updates.targetUsers || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        // Update existing flag
        flags[flagId] = {
          ...flags[flagId],
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }

      setJSON(FLAGS_STORAGE_KEY, flags);
      log(`Flag "${flagId}" updated`);
      return Promise.resolve(flags[flagId]);
    },

    /**
     * Delete a feature flag
     */
    async deleteFlag(flagId) {
      const flags = await this.getAllFlags();
      if (flags[flagId]) {
        delete flags[flagId];
        setJSON(FLAGS_STORAGE_KEY, flags);
        log(`Flag "${flagId}" deleted`);
      }
      return Promise.resolve(true);
    },

    /**
     * Set manual override for testing
     */
    async setOverride(flagId, value) {
      const overrides = getJSON(FLAGS_OVERRIDES_KEY, {});
      overrides[flagId] = value;
      setJSON(FLAGS_OVERRIDES_KEY, overrides);
      log(`Override set: "${flagId}" = ${value}`);
      return Promise.resolve(true);
    },

    /**
     * Clear manual override
     */
    async clearOverride(flagId) {
      const overrides = getJSON(FLAGS_OVERRIDES_KEY, {});
      delete overrides[flagId];
      setJSON(FLAGS_OVERRIDES_KEY, overrides);
      log(`Override cleared: "${flagId}"`);
      return Promise.resolve(true);
    },

    /**
     * Clear all overrides
     */
    async clearAllOverrides() {
      localStorage.removeItem(FLAGS_OVERRIDES_KEY);
      log('All overrides cleared');
      return Promise.resolve(true);
    },

    /**
     * Get all active overrides
     */
    async getOverrides() {
      return Promise.resolve(getJSON(FLAGS_OVERRIDES_KEY, {}));
    },

    /**
     * Batch check multiple flags
     */
    async checkFlags(flagIds, context = {}) {
      const results = {};
      for (const flagId of flagIds) {
        results[flagId] = await this.isEnabled(flagId, context);
      }
      return Promise.resolve(results);
    },

    /**
     * Get flags summary with evaluation results
     */
    async getFlagsSummary(context = {}) {
      const flags = await this.getAllFlags();
      const overrides = await this.getOverrides();
      const summary = {};

      for (const [flagId, flag] of Object.entries(flags)) {
        summary[flagId] = {
          ...flag,
          isOverridden: overrides[flagId] !== undefined,
          overrideValue: overrides[flagId],
          currentlyEnabled: await this.isEnabled(flagId, context)
        };
      }

      return Promise.resolve(summary);
    }
  };

  // ===============================
  // Expose API
  // ===============================
  if (!window.UBA) {
    window.UBA = {};
  }

  window.UBA.flags = {
    // Core methods
    init: () => FeatureFlagsEngine.init(),
    isEnabled: (flagId, context) => FeatureFlagsEngine.isEnabled(flagId, context),

    // Flag management
    getAllFlags: () => FeatureFlagsEngine.getAllFlags(),
    getFlag: (flagId) => FeatureFlagsEngine.getFlag(flagId),
    updateFlag: (flagId, updates) => FeatureFlagsEngine.updateFlag(flagId, updates),
    deleteFlag: (flagId) => FeatureFlagsEngine.deleteFlag(flagId),

    // Overrides
    setOverride: (flagId, value) => FeatureFlagsEngine.setOverride(flagId, value),
    clearOverride: (flagId) => FeatureFlagsEngine.clearOverride(flagId),
    clearAllOverrides: () => FeatureFlagsEngine.clearAllOverrides(),
    getOverrides: () => FeatureFlagsEngine.getOverrides(),

    // Utilities
    checkFlags: (flagIds, context) => FeatureFlagsEngine.checkFlags(flagIds, context),
    getFlagsSummary: (context) => FeatureFlagsEngine.getFlagsSummary(context)
  };

  // Auto-initialize
  document.addEventListener('DOMContentLoaded', () => {
    UBA.flags.init();
  });

  log('Feature Flags module loaded');
})();
