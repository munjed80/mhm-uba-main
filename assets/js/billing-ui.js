// billing-ui.js — Billing UI for MHM UBA Settings
// Manages billing section in settings page
(function () {
  'use strict';

  function log(...args) {
    console.log('[Billing UI]', ...args);
  }

  function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function formatCurrency(amount, currency = '€') {
    return `${currency}${amount}`;
  }

  function daysUntil(isoString) {
    if (!isoString) return 0;
    const target = new Date(isoString);
    const now = new Date();
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  async function renderBillingSection() {
    const container = document.getElementById('billing-section-container');
    if (!container) return;

    try {
      const subscription = await window.UBA.billing.getCurrentSubscription();
      if (!subscription) {
        container.innerHTML = '<p style="color: var(--error);">Failed to load billing information</p>';
        return;
      }

      const plan = window.UBA.billing.PLAN_CATALOG[subscription.planId];
      const usage = subscription.usage || {};

      container.innerHTML = `
        <!-- Current Plan Card -->
        <div class="billing-current-plan">
          <div class="billing-plan-header">
            <div>
              <h4>${plan.name} Plan</h4>
              <p class="billing-plan-desc">${plan.description}</p>
            </div>
            <div class="billing-plan-price">
              ${subscription.planId !== 'free' ? `
                <span class="billing-price-amount">${formatCurrency(
                  subscription.period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
                  plan.currency
                )}</span>
                <span class="billing-price-period">/${subscription.period === 'monthly' ? 'month' : 'year'}</span>
              ` : '<span class="billing-price-free">Free Forever</span>'}
            </div>
          </div>

          ${subscription.isTrial ? `
            <div class="billing-trial-banner">
              <span class="billing-trial-icon">🎉</span>
              <div>
                <strong>Trial Active</strong>
                <p>${daysUntil(subscription.trialEndsAt)} days remaining in your ${plan.name} trial</p>
              </div>
            </div>
          ` : ''}

          ${subscription.cancelAtPeriodEnd ? `
            <div class="billing-cancel-banner">
              <span class="billing-cancel-icon">⚠️</span>
              <div>
                <strong>Subscription Canceled</strong>
                <p>Your subscription will end on ${formatDate(subscription.renewalDate)}</p>
              </div>
              <button class="uba-btn-sm uba-btn-primary" onclick="window.BillingUI.resumeSubscription()">
                Resume Subscription
              </button>
            </div>
          ` : ''}

          <div class="billing-info-grid">
            <div class="billing-info-item">
              <span class="billing-info-label">Status</span>
              <span class="billing-info-value billing-status-${subscription.status}">
                ${subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>
            <div class="billing-info-item">
              <span class="billing-info-label">
                ${subscription.cancelAtPeriodEnd ? 'Ends On' : 'Renews On'}
              </span>
              <span class="billing-info-value">${formatDate(subscription.renewalDate)}</span>
            </div>
            ${subscription.planId !== 'free' ? `
              <div class="billing-info-item">
                <span class="billing-info-label">Billing Period</span>
                <span class="billing-info-value">${subscription.period === 'monthly' ? 'Monthly' : 'Yearly'}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Usage Stats -->
        <div class="billing-usage-section">
          <h4>Usage & Limits</h4>
          <div class="billing-usage-grid">
            ${renderUsageItem('Clients', usage.clients || 0, plan.limits.maxClients)}
            ${renderUsageItem('Projects', usage.projects || 0, plan.limits.maxProjects)}
            ${renderUsageItem('Tasks', usage.tasks || 0, plan.limits.maxTasks)}
            ${renderUsageItem('Invoices (This Month)', usage.invoicesThisMonth || 0, plan.limits.maxInvoicesPerMonth)}
            ${renderUsageItem('Team Members', usage.members || 0, plan.limits.maxMembers)}
            ${renderUsageItem('Storage', formatBytes(usage.storage || 0), formatBytes(plan.limits.maxStorage))}
          </div>
        </div>

        <!-- Plan Comparison -->
        <div class="billing-plans-section">
          <div class="billing-plans-header">
            <h4>Available Plans</h4>
            <div class="billing-period-toggle">
              <label class="billing-toggle-label">
                <input type="radio" name="billing-period" value="monthly" checked onchange="window.BillingUI.togglePeriod(this.value)">
                <span>Monthly</span>
              </label>
              <label class="billing-toggle-label">
                <input type="radio" name="billing-period" value="yearly" onchange="window.BillingUI.togglePeriod(this.value)">
                <span>Yearly</span>
                <small class="billing-save-badge">Save 17%</small>
              </label>
            </div>
          </div>

          <div id="billing-plans-container" class="billing-plans-grid">
            ${renderAllPlans(subscription, 'monthly')}
          </div>
        </div>

        <!-- Billing History -->
        <div class="billing-history-section">
          <h4>Billing History</h4>
          <div id="billing-history-container">
            ${await renderBillingHistory()}
          </div>
        </div>

        <div id="billing-status" class="billing-status-message" style="display: none;"></div>
      `;

      log('Billing section rendered');
    } catch (error) {
      console.error('Error rendering billing section:', error);
      container.innerHTML = '<p style="color: var(--error);">Failed to load billing information</p>';
    }
  }

  function renderUsageItem(label, current, limit) {
    const isUnlimited = limit > 900000;
    const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
    const isNearLimit = percentage > 80;
    const limitText = isUnlimited ? 'Unlimited' : limit;

    return `
      <div class="billing-usage-item ${isNearLimit ? 'near-limit' : ''}">
        <div class="billing-usage-label">${label}</div>
        <div class="billing-usage-bar">
          <div class="billing-usage-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="billing-usage-stats">
          <span>${current}</span>
          <span class="billing-usage-limit">of ${limitText}</span>
        </div>
      </div>
    `;
  }

  function renderAllPlans(subscription, period) {
    const plans = Object.values(window.UBA.billing.PLAN_CATALOG);
    
    return plans.map(plan => {
      const isCurrent = plan.id === subscription.planId;
      const price = period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

      return `
        <div class="billing-plan-card ${isCurrent ? 'current' : ''} ${plan.popular ? 'popular' : ''}">
          ${plan.popular ? '<div class="billing-plan-badge popular">Most Popular</div>' : ''}
          ${isCurrent ? '<div class="billing-plan-badge current">Current Plan</div>' : ''}
          
          <div class="billing-plan-card-header">
            <h3>${plan.name}</h3>
            <div class="billing-plan-card-price">
              <span class="billing-price-currency">${plan.currency}</span>
              <span class="billing-price-amount">${price}</span>
              <span class="billing-price-period">/${period === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <p class="billing-plan-card-desc">${plan.description}</p>
          </div>

          <ul class="billing-plan-features">
            ${plan.features.map(f => `<li><span class="billing-feature-check">✓</span>${f}</li>`).join('')}
          </ul>

          <div class="billing-plan-actions">
            ${renderPlanButton(plan, subscription, period)}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderPlanButton(plan, subscription, period) {
    if (plan.id === subscription.planId) {
      if (!subscription.cancelAtPeriodEnd && plan.id !== 'free') {
        return `
          <button class="uba-btn-secondary" onclick="window.BillingUI.cancelSubscription()">
            Cancel Plan
          </button>
        `;
      }
      return '<button class="uba-btn-secondary" disabled>Current Plan</button>';
    }

    const planOrder = { free: 0, pro: 1, enterprise: 2 };
    const isUpgrade = planOrder[plan.id] > planOrder[subscription.planId];
    const buttonText = plan.id === 'free' ? 'Downgrade' : (isUpgrade ? 'Upgrade' : 'Switch');
    
    if (plan.id === 'free') {
      return `
        <button class="uba-btn-outline" onclick="window.BillingUI.downgradePlan('${plan.id}')">
          Downgrade to Free
        </button>
      `;
    }

    return `
      <button class="uba-btn-primary" onclick="window.BillingUI.${isUpgrade ? 'upgradePlan' : 'switchPlan'}('${plan.id}', '${period}')">
        ${buttonText} to ${plan.name}
      </button>
    `;
  }

  async function renderBillingHistory() {
    try {
      const history = await window.UBA.billing.getBillingHistory();
      
      if (!history || history.length === 0) {
        return '<p class="billing-no-history">No billing history yet</p>';
      }

      return `
        <table class="billing-history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${history.map(invoice => `
              <tr>
                <td>${formatDate(invoice.createdAt)}</td>
                <td>${invoice.description}</td>
                <td>${formatCurrency(invoice.amount, invoice.currency || '€')}</td>
                <td><span class="billing-invoice-status ${invoice.status}">${invoice.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (error) {
      console.error('Error rendering billing history:', error);
      return '<p class="billing-no-history">Failed to load billing history</p>';
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes > 900000000000) return 'Unlimited';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('billing-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `billing-status-message billing-status-${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  // ===============================
  // Public API
  // ===============================
  window.BillingUI = {
    init: async function() {
      log('Initializing Billing UI');
      
      // Wait for UBA.billing to be ready
      if (!window.UBA || !window.UBA.billing) {
        setTimeout(() => this.init(), 100);
        return;
      }

      await renderBillingSection();
      log('Billing UI initialized');
    },

    togglePeriod: function(period) {
      const container = document.getElementById('billing-plans-container');
      if (!container) return;

      window.UBA.billing.getCurrentSubscription().then(subscription => {
        container.innerHTML = renderAllPlans(subscription, period);
      });
    },

    upgradePlan: async function(planId, period) {
      try {
        showStatus('Upgrading plan...', 'info');
        await window.UBA.billing.upgradePlan(planId);
        showStatus(`Successfully upgraded to ${window.UBA.billing.PLAN_CATALOG[planId].name} plan!`, 'success');
        
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('Error upgrading plan:', error);
        showStatus('Failed to upgrade plan', 'error');
      }
    },

    switchPlan: async function(planId, period) {
      if (confirm(`Switch to ${window.UBA.billing.PLAN_CATALOG[planId].name} plan?`)) {
        await this.upgradePlan(planId, period);
      }
    },

    downgradePlan: async function(planId) {
      if (confirm('Are you sure you want to downgrade to the Free plan? This change will take effect at the end of your current billing period.')) {
        try {
          showStatus('Scheduling downgrade...', 'info');
          await window.UBA.billing.downgradePlan(planId);
          showStatus('Downgrade scheduled for end of billing period', 'success');
          
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          console.error('Error downgrading plan:', error);
          showStatus('Failed to schedule downgrade', 'error');
        }
      }
    },

    cancelSubscription: async function() {
      if (confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
        try {
          showStatus('Canceling subscription...', 'info');
          await window.UBA.billing.cancelPlan();
          showStatus('Subscription canceled. Access will continue until renewal date.', 'success');
          
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          console.error('Error canceling subscription:', error);
          showStatus('Failed to cancel subscription', 'error');
        }
      }
    },

    resumeSubscription: async function() {
      try {
        showStatus('Resuming subscription...', 'info');
        await window.UBA.billing.resumePlan();
        showStatus('Subscription resumed successfully!', 'success');
        
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('Error resuming subscription:', error);
        showStatus('Failed to resume subscription', 'error');
      }
    },

    refresh: async function() {
      await renderBillingSection();
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.BillingUI.init());
  } else {
    window.BillingUI.init();
  }

  log('Billing UI module loaded');
})();
