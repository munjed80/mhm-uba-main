// license-keys.js — SaaS License Keys Mode for MHM UBA
// Manage software licenses, activation, validation, and offline licensing
(function () {
  'use strict';

  // ===============================
  // Configuration
  // ===============================
  const LICENSE_STORAGE_KEY = 'uba-license-keys';
  const ACTIVATION_LOG_KEY = 'uba-activation-log';

  // License types
  const LICENSE_TYPES = {
    TRIAL: 'trial',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    LIFETIME: 'lifetime',
    ENTERPRISE: 'enterprise'
  };

  // License status
  const LICENSE_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    SUSPENDED: 'suspended',
    REVOKED: 'revoked',
    PENDING: 'pending'
  };

  // ===============================
  // Utility Functions
  // ===============================
  function log(...args) {
    console.log('[UBA License Keys]', ...args);
  }

  function warn(...args) {
    console.warn('[UBA License Keys]', ...args);
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

  function generateLicenseKey() {
    // Format: XXXX-XXXX-XXXX-XXXX-XXXX
    const segments = [];
    for (let i = 0; i < 5; i++) {
      const segment = Math.random().toString(36).substring(2, 6).toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  function getMachineFingerprint() {
    // Generate a unique fingerprint for this device/browser
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown'
    ];
    return hashString(components.join('|'));
  }

  // ===============================
  // License Key Engine
  // ===============================
  const LicenseEngine = {
    /**
     * Generate a new license key
     */
    async generateLicense(plan, duration, maxActivations = 1, customData = {}) {
      const licenseKey = generateLicenseKey();
      const now = new Date();
      let expiresAt = null;

      if (duration === 'monthly') {
        expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
      } else if (duration === 'yearly') {
        expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
      } else if (duration === 'trial') {
        expiresAt = new Date(now.setDate(now.getDate() + 14)).toISOString();
      }
      // lifetime has no expiry

      const license = {
        key: licenseKey,
        plan: plan, // free, pro, enterprise
        type: duration, // trial, monthly, yearly, lifetime, enterprise
        status: LICENSE_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt,
        maxActivations: maxActivations,
        activations: [],
        metadata: customData
      };

      // Store license
      const allLicenses = getJSON(LICENSE_STORAGE_KEY, {});
      allLicenses[licenseKey] = license;
      setJSON(LICENSE_STORAGE_KEY, allLicenses);

      log('License generated:', licenseKey);
      return Promise.resolve(license);
    },

    /**
     * Activate a license key
     */
    async activateLicense(licenseKey, workspaceId = null) {
      const allLicenses = getJSON(LICENSE_STORAGE_KEY, {});
      const license = allLicenses[licenseKey];

      if (!license) {
        return Promise.resolve({
          success: false,
          error: 'Invalid license key'
        });
      }

      // Check if expired
      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        license.status = LICENSE_STATUS.EXPIRED;
        setJSON(LICENSE_STORAGE_KEY, allLicenses);
        return Promise.resolve({
          success: false,
          error: 'License key has expired'
        });
      }

      // Check if revoked or suspended
      if (license.status === LICENSE_STATUS.REVOKED || license.status === LICENSE_STATUS.SUSPENDED) {
        return Promise.resolve({
          success: false,
          error: `License is ${license.status}`
        });
      }

      // Check activation limit
      if (license.activations.length >= license.maxActivations) {
        return Promise.resolve({
          success: false,
          error: 'Maximum activations reached'
        });
      }

      // Get workspace and machine fingerprint
      const workspace = workspaceId || (window.UBA && window.UBA.session ? window.UBA.session.currentWorkspace.id : null);
      const machineId = getMachineFingerprint();

      // Check if already activated on this machine/workspace
      const existingActivation = license.activations.find(a =>
        a.machineId === machineId && a.workspaceId === workspace
      );

      if (existingActivation) {
        return Promise.resolve({
          success: true,
          license: license,
          message: 'License already activated on this machine'
        });
      }

      // Add activation
      const activation = {
        activationId: `act-${Date.now()}`,
        workspaceId: workspace,
        machineId: machineId,
        activatedAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      };

      license.activations.push(activation);
      license.status = LICENSE_STATUS.ACTIVE;

      // Save license
      setJSON(LICENSE_STORAGE_KEY, allLicenses);

      // Log activation
      this.logActivation(licenseKey, activation, 'activated');

      // Apply license to workspace subscription
      if (window.UBA && window.UBA.workspace && workspace) {
        const ws = await window.UBA.workspace.get(workspace);
        if (ws) {
          ws.licenseKey = licenseKey;
          ws.subscription = ws.subscription || {};
          ws.subscription.planId = license.plan;
          ws.subscription.status = 'active';
          ws.subscription.licenseType = license.type;
          await window.UBA.workspace.update(workspace, {
            licenseKey,
            subscription: ws.subscription
          });
        }
      }

      log('License activated:', licenseKey);
      return Promise.resolve({
        success: true,
        license: license,
        activation: activation
      });
    },

    /**
     * Validate a license key
     */
    async validateLicense(licenseKey, workspaceId = null) {
      const allLicenses = getJSON(LICENSE_STORAGE_KEY, {});
      const license = allLicenses[licenseKey];

      if (!license) {
        return Promise.resolve({
          valid: false,
          error: 'Invalid license key'
        });
      }

      // Check expiry
      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        license.status = LICENSE_STATUS.EXPIRED;
        setJSON(LICENSE_STORAGE_KEY, allLicenses);
        return Promise.resolve({
          valid: false,
          license: license,
          error: 'License has expired'
        });
      }

      // Check status
      if (license.status !== LICENSE_STATUS.ACTIVE) {
        return Promise.resolve({
          valid: false,
          license: license,
          error: `License is ${license.status}`
        });
      }

      // Check activation
      const workspace = workspaceId || (window.UBA && window.UBA.session ? window.UBA.session.currentWorkspace.id : null);
      const machineId = getMachineFingerprint();

      const activation = license.activations.find(a =>
        a.machineId === machineId && a.workspaceId === workspace
      );

      if (!activation) {
        return Promise.resolve({
          valid: false,
          license: license,
          error: 'License not activated on this machine'
        });
      }

      // Update last validated timestamp
      activation.lastValidated = new Date().toISOString();
      setJSON(LICENSE_STORAGE_KEY, allLicenses);

      return Promise.resolve({
        valid: true,
        license: license,
        activation: activation
      });
    },

    /**
     * Deactivate a license key
     */
    async deactivateLicense(licenseKey, workspaceId = null) {
      const allLicenses = getJSON(LICENSE_STORAGE_KEY, {});
      const license = allLicenses[licenseKey];

      if (!license) {
        return Promise.resolve({
          success: false,
          error: 'Invalid license key'
        });
      }

      const workspace = workspaceId || (window.UBA && window.UBA.session ? window.UBA.session.currentWorkspace.id : null);
      const machineId = getMachineFingerprint();

      // Find and remove activation
      const index = license.activations.findIndex(a =>
        a.machineId === machineId && a.workspaceId === workspace
      );

      if (index === -1) {
        return Promise.resolve({
          success: false,
          error: 'License not activated on this machine'
        });
      }

      const activation = license.activations[index];
      license.activations.splice(index, 1);

      // Update status if no activations left
      if (license.activations.length === 0) {
        license.status = LICENSE_STATUS.PENDING;
      }

      setJSON(LICENSE_STORAGE_KEY, allLicenses);
      this.logActivation(licenseKey, activation, 'deactivated');

      log('License deactivated:', licenseKey);
      return Promise.resolve({
        success: true,
        license: license
      });
    },

    /**
     * Revoke a license key (permanent)
     */
    async revokeLicense(licenseKey) {
      const allLicenses = getJSON(LICENSE_STORAGE_KEY, {});
      const license = allLicenses[licenseKey];

      if (!license) {
        return Promise.resolve({
          success: false,
          error: 'Invalid license key'
        });
      }

      license.status = LICENSE_STATUS.REVOKED;
      license.revokedAt = new Date().toISOString();

      setJSON(LICENSE_STORAGE_KEY, allLicenses);

      log('License revoked:', licenseKey);
      return Promise.resolve({
        success: true,
        license: license
      });
    },

    /**
     * Get license info
     */
    async getLicenseInfo(licenseKey) {
      const allLicenses = getJSON(LICENSE_STORAGE_KEY, {});
      const license = allLicenses[licenseKey];

      if (!license) {
        return Promise.resolve(null);
      }

      return Promise.resolve(license);
    },

    /**
     * Get all licenses
     */
    async getAllLicenses() {
      const allLicenses = getJSON(LICENSE_STORAGE_KEY, {});
      return Promise.resolve(Object.values(allLicenses));
    },

    /**
     * Get current workspace license
     */
    async getCurrentLicense() {
      const workspace = window.UBA && window.UBA.session ? window.UBA.session.currentWorkspace : null;
      if (!workspace || !workspace.licenseKey) {
        return Promise.resolve(null);
      }

      return await this.getLicenseInfo(workspace.licenseKey);
    },

    /**
     * Log activation/deactivation
     */
    logActivation(licenseKey, activation, action) {
      const logs = getJSON(ACTIVATION_LOG_KEY, []);
      logs.push({
        licenseKey,
        action,
        activation,
        timestamp: new Date().toISOString()
      });

      // Keep last 1000 logs
      if (logs.length > 1000) {
        logs.shift();
      }

      setJSON(ACTIVATION_LOG_KEY, logs);
    },

    /**
     * Get activation logs
     */
    async getActivationLogs(licenseKey = null) {
      const logs = getJSON(ACTIVATION_LOG_KEY, []);
      if (licenseKey) {
        return Promise.resolve(logs.filter(l => l.licenseKey === licenseKey));
      }
      return Promise.resolve(logs);
    }
  };

  // ===============================
  // Expose API
  // ===============================
  if (!window.UBA) {
    window.UBA = {};
  }

  window.UBA.license = {
    // License management
    generateLicense: (plan, duration, maxActivations, customData) =>
      LicenseEngine.generateLicense(plan, duration, maxActivations, customData),
    activateLicense: (key, workspaceId) =>
      LicenseEngine.activateLicense(key, workspaceId),
    validateLicense: (key, workspaceId) =>
      LicenseEngine.validateLicense(key, workspaceId),
    deactivateLicense: (key, workspaceId) =>
      LicenseEngine.deactivateLicense(key, workspaceId),
    revokeLicense: (key) =>
      LicenseEngine.revokeLicense(key),

    // License info
    getLicenseInfo: (key) =>
      LicenseEngine.getLicenseInfo(key),
    getAllLicenses: () =>
      LicenseEngine.getAllLicenses(),
    getCurrentLicense: () =>
      LicenseEngine.getCurrentLicense(),

    // Logs
    getActivationLogs: (key) =>
      LicenseEngine.getActivationLogs(key),

    // Utilities
    getMachineFingerprint: () => getMachineFingerprint(),

    // Constants
    LICENSE_TYPES,
    LICENSE_STATUS
  };

  log('License Keys module loaded');
})();
