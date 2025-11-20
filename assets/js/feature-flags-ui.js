// feature-flags-ui.js — Feature Flags UI for Settings Page
// Provides UI for managing feature flags, overrides, and rollout percentages
(function () {
  'use strict';

  function log(...args) {
    console.log('[Feature Flags UI]', ...args);
  }

  const FeatureFlagsUI = {
    async init() {
      log('Initializing Feature Flags UI');
      await this.renderFlagsList();
      this.attachEventListeners();
    },

    async renderFlagsList() {
      const container = document.getElementById('feature-flags-list');
      if (!container) return;

      const summary = await window.UBA.flags.getFlagsSummary();
      const flags = Object.values(summary);

      if (flags.length === 0) {
        container.innerHTML = '<p class="text-muted">No feature flags configured</p>';
        return;
      }

      container.innerHTML = flags.map(flag => `
        <div class="flag-item" data-flag-id="${flag.id}">
          <div class="flag-header">
            <div class="flag-info">
              <h4 class="flag-name">${flag.name}</h4>
              <p class="flag-description">${flag.description}</p>
              <div class="flag-meta">
                <span class="flag-type-badge">${flag.type}</span>
                ${flag.isOverridden ? '<span class="flag-override-badge">Overridden</span>' : ''}
                <span class="flag-status-badge ${flag.currentlyEnabled ? 'status-active' : 'status-inactive'}">
                  ${flag.currentlyEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div class="flag-actions">
              <label class="toggle-switch">
                <input type="checkbox" 
                       class="flag-toggle" 
                       data-flag-id="${flag.id}"
                       ${flag.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          ${flag.type === 'percentage' ? `
            <div class="flag-rollout">
              <label>Rollout Percentage: <span class="rollout-value">${flag.rolloutPercentage}%</span></label>
              <input type="range" 
                     min="0" 
                     max="100" 
                     value="${flag.rolloutPercentage}"
                     class="rollout-slider"
                     data-flag-id="${flag.id}">
            </div>
          ` : ''}

          ${flag.type === 'role' ? `
            <div class="flag-targets">
              <label>Target Roles:</label>
              <div class="role-checkboxes">
                ${['owner', 'admin', 'editor', 'viewer'].map(role => `
                  <label>
                    <input type="checkbox" 
                           class="role-checkbox" 
                           data-flag-id="${flag.id}"
                           value="${role}"
                           ${flag.targetRoles.includes(role) ? 'checked' : ''}>
                    ${role.charAt(0).toUpperCase() + role.slice(1)}
                  </label>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${flag.type === 'plan' ? `
            <div class="flag-targets">
              <label>Target Plans:</label>
              <div class="plan-checkboxes">
                ${['free', 'pro', 'enterprise'].map(plan => `
                  <label>
                    <input type="checkbox" 
                           class="plan-checkbox" 
                           data-flag-id="${flag.id}"
                           value="${plan}"
                           ${flag.targetPlans.includes(plan) ? 'checked' : ''}>
                    ${plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </label>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${flag.isOverridden ? `
            <div class="flag-override-info">
              <p>⚠️ This flag has a manual override active.</p>
              <button class="btn btn-secondary btn-sm clear-override-btn" data-flag-id="${flag.id}">
                Clear Override
              </button>
            </div>
          ` : ''}
        </div>
      `).join('');
    },

    attachEventListeners() {
      // Toggle switches
      document.querySelectorAll('.flag-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
          const flagId = e.target.dataset.flagId;
          this.updateFlagEnabled(flagId, e.target.checked);
        });
      });

      // Rollout sliders
      document.querySelectorAll('.rollout-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
          const flagId = e.target.dataset.flagId;
          const value = e.target.value;
          const valueDisplay = e.target.parentElement.querySelector('.rollout-value');
          if (valueDisplay) {
            valueDisplay.textContent = `${value}%`;
          }
        });

        slider.addEventListener('change', (e) => {
          const flagId = e.target.dataset.flagId;
          const value = parseInt(e.target.value);
          this.updateFlagRollout(flagId, value);
        });
      });

      // Role checkboxes
      document.querySelectorAll('.role-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const flagId = e.target.dataset.flagId;
          this.updateFlagRoles(flagId);
        });
      });

      // Plan checkboxes
      document.querySelectorAll('.plan-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const flagId = e.target.dataset.flagId;
          this.updateFlagPlans(flagId);
        });
      });

      // Clear override buttons
      document.querySelectorAll('.clear-override-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const flagId = e.target.dataset.flagId;
          this.clearOverride(flagId);
        });
      });
    },

    async updateFlagEnabled(flagId, enabled) {
      await window.UBA.flags.updateFlag(flagId, { enabled });
      log(`Flag "${flagId}" enabled: ${enabled}`);
      this.showMessage(`Feature flag updated`, 'success');
      await this.renderFlagsList();
    },

    async updateFlagRollout(flagId, percentage) {
      await window.UBA.flags.updateFlag(flagId, { rolloutPercentage: percentage });
      log(`Flag "${flagId}" rollout: ${percentage}%`);
      this.showMessage(`Rollout percentage updated to ${percentage}%`, 'success');
    },

    async updateFlagRoles(flagId) {
      const checkboxes = document.querySelectorAll(`.role-checkbox[data-flag-id="${flagId}"]`);
      const selectedRoles = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      await window.UBA.flags.updateFlag(flagId, { targetRoles: selectedRoles });
      log(`Flag "${flagId}" roles updated:`, selectedRoles);
      this.showMessage('Target roles updated', 'success');
    },

    async updateFlagPlans(flagId) {
      const checkboxes = document.querySelectorAll(`.plan-checkbox[data-flag-id="${flagId}"]`);
      const selectedPlans = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      await window.UBA.flags.updateFlag(flagId, { targetPlans: selectedPlans });
      log(`Flag "${flagId}" plans updated:`, selectedPlans);
      this.showMessage('Target plans updated', 'success');
    },

    async clearOverride(flagId) {
      await window.UBA.flags.clearOverride(flagId);
      log(`Override cleared for "${flagId}"`);
      this.showMessage('Override cleared', 'success');
      await this.renderFlagsList();
    },

    showMessage(text, type = 'info') {
      const statusDiv = document.getElementById('flags-status');
      if (!statusDiv) return;

      statusDiv.className = `uba-status-${type}`;
      statusDiv.textContent = text;
      statusDiv.style.display = 'block';

      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  };

  // Expose globally
  window.FeatureFlagsUI = FeatureFlagsUI;

  log('Feature Flags UI module loaded');
})();
