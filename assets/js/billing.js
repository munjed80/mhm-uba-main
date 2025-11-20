// billing.js — Subscription & Billing System for MHM UBA
// Complete SaaS billing architecture ready for Stripe/Paddle integration
(function () {
  'use strict';

  // ===============================
  // Plan Catalog
  // ===============================
  const PLAN_CATALOG = {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: '€',
      features: [
        'Up to 3 clients',
        'Up to 5 projects',
        'Up to 10 tasks',
        'Up to 5 invoices/month',
        'Basic reports',
        '100MB storage',
        'Email support'
      ],
      limits: {
        maxMembers: 1,
        maxClients: 3,
        maxProjects: 5,
        maxTasks: 10,
        maxInvoicesPerMonth: 5,
        maxStorage: 100 * 1024 * 1024, // 100MB in bytes
        maxFiles: 10,
        maxAutomations: 0,
        maxLeads: 10
      },
      features_flags: {
        automations: false,
        advancedReports: false,
        assistant: false,
        insights: false,
        apiAccess: false,
        customBranding: false,
        prioritySupport: false
      }
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      description: 'For growing businesses',
      monthlyPrice: 29,
      yearlyPrice: 290, // 2 months free
      currency: '€',
      popular: true,
      features: [
        'Up to 50 clients',
        'Unlimited projects',
        'Unlimited tasks',
        'Unlimited invoices',
        'Advanced reports & analytics',
        '10GB storage',
        'Automations',
        'AI Assistant',
        'Insights Lab',
        'Priority email support'
      ],
      limits: {
        maxMembers: 5,
        maxClients: 50,
        maxProjects: 999999,
        maxTasks: 999999,
        maxInvoicesPerMonth: 999999,
        maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
        maxFiles: 1000,
        maxAutomations: 10,
        maxLeads: 200
      },
      features_flags: {
        automations: true,
        advancedReports: true,
        assistant: true,
        insights: true,
        apiAccess: false,
        customBranding: false,
        prioritySupport: true
      }
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large teams and organizations',
      monthlyPrice: 99,
      yearlyPrice: 990, // 2 months free
      currency: '€',
      features: [
        'Unlimited clients',
        'Unlimited projects',
        'Unlimited tasks',
        'Unlimited invoices',
        'Advanced reports & analytics',
        'Unlimited storage',
        'Unlimited automations',
        'AI Assistant',
        'Insights Lab',
        'API access',
        'Custom branding',
        'Dedicated support',
        'SSO integration'
      ],
      limits: {
        maxMembers: 999999,
        maxClients: 999999,
        maxProjects: 999999,
        maxTasks: 999999,
        maxInvoicesPerMonth: 999999,
        maxStorage: 999999 * 1024 * 1024 * 1024, // Unlimited
        maxFiles: 999999,
        maxAutomations: 999999,
        maxLeads: 999999
      },
      features_flags: {
        automations: true,
        advancedReports: true,
        assistant: true,
        insights: true,
        apiAccess: true,
        customBranding: true,
        prioritySupport: true
      }
    }
  };

  // ===============================
  // Utilities
  // ===============================
  function log(...args) {
    console.log('[UBA Billing]', ...args);
  }

  function warn(...args) {
    console.warn('[UBA Billing]', ...args);
  }

  function generateId(prefix = 'id') {
    if (window.crypto && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
  }

  function addYears(date, years) {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString();
  }

  // ===============================
  // Subscription Model
  // ===============================
  function createDefaultSubscription(workspaceId) {
    return {
      id: generateId('sub'),
      workspaceId: workspaceId,
      planId: 'free',
      status: 'active', // active, trialing, past_due, canceled, expired
      period: 'monthly', // monthly, yearly
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: '€',
      isTrial: false,
      trialEndsAt: null,
      renewalDate: addMonths(nowISO(), 1),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      usage: {
        members: 0,
        clients: 0,
        projects: 0,
        tasks: 0,
        invoices: 0,
        invoicesThisMonth: 0,
        files: 0,
        storage: 0,
        automations: 0,
        leads: 0
      }
    };
  }

  // ===============================
  // Billing Engine
  // ===============================
  const BillingEngine = {
    async getCurrentSubscription() {
      try {
        if (!window.UBA || !window.UBA.workspace) {
          warn('UBA.workspace not available');
          return null;
        }

        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) {
          warn('No current workspace');
          return null;
        }

        // Get or create subscription
        let subscription = workspace.subscription;
        if (!subscription) {
          subscription = createDefaultSubscription(workspace.id);
          await window.UBA.workspace.update(workspace.id, { subscription });
          log('Created default subscription for workspace');
        }

        return subscription;
      } catch (error) {
        warn('Error getting current subscription:', error);
        return null;
      }
    },

    async listPlans() {
      return new Promise((resolve) => {
        resolve(Object.values(PLAN_CATALOG));
      });
    },

    async getPlan(planId) {
      return new Promise((resolve) => {
        resolve(PLAN_CATALOG[planId] || null);
      });
    },

    async startTrial(planId, trialDays = 14) {
      try {
        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) throw new Error('No current workspace');

        const plan = PLAN_CATALOG[planId];
        if (!plan) throw new Error('Invalid plan');

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

        const subscription = {
          ...createDefaultSubscription(workspace.id),
          planId: planId,
          status: 'trialing',
          isTrial: true,
          trialEndsAt: trialEndsAt.toISOString(),
          renewalDate: trialEndsAt.toISOString()
        };

        await window.UBA.workspace.update(workspace.id, { subscription });
        log('Started trial for plan:', planId);

        return subscription;
      } catch (error) {
        warn('Error starting trial:', error);
        throw error;
      }
    },

    async activatePlan(planId, period = 'monthly') {
      try {
        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) throw new Error('No current workspace');

        const plan = PLAN_CATALOG[planId];
        if (!plan) throw new Error('Invalid plan');

        const currentSub = await this.getCurrentSubscription();
        
        const subscription = {
          ...currentSub,
          planId: planId,
          status: 'active',
          period: period,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          currency: plan.currency,
          isTrial: false,
          trialEndsAt: null,
          renewalDate: period === 'monthly' ? 
            addMonths(nowISO(), 1) : 
            addYears(nowISO(), 1),
          updatedAt: nowISO(),
          cancelAtPeriodEnd: false,
          canceledAt: null
        };

        await window.UBA.workspace.update(workspace.id, { subscription });
        
        // Add invoice record
        await this.addInvoice({
          planId: planId,
          period: period,
          amount: period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
          status: 'paid',
          description: `${plan.name} Plan - ${period === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`
        });

        log('Activated plan:', planId, period);
        return subscription;
      } catch (error) {
        warn('Error activating plan:', error);
        throw error;
      }
    },

    async upgradePlan(newPlanId) {
      try {
        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) throw new Error('No current workspace');

        const currentSub = await this.getCurrentSubscription();
        const newPlan = PLAN_CATALOG[newPlanId];
        if (!newPlan) throw new Error('Invalid plan');

        const subscription = {
          ...currentSub,
          planId: newPlanId,
          monthlyPrice: newPlan.monthlyPrice,
          yearlyPrice: newPlan.yearlyPrice,
          updatedAt: nowISO()
        };

        await window.UBA.workspace.update(workspace.id, { subscription });
        
        // Add invoice for upgrade
        await this.addInvoice({
          planId: newPlanId,
          period: currentSub.period,
          amount: currentSub.period === 'monthly' ? newPlan.monthlyPrice : newPlan.yearlyPrice,
          status: 'paid',
          description: `Upgrade to ${newPlan.name} Plan`,
          type: 'upgrade'
        });

        log('Upgraded to plan:', newPlanId);
        return subscription;
      } catch (error) {
        warn('Error upgrading plan:', error);
        throw error;
      }
    },

    async downgradePlan(newPlanId) {
      try {
        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) throw new Error('No current workspace');

        const currentSub = await this.getCurrentSubscription();
        const newPlan = PLAN_CATALOG[newPlanId];
        if (!newPlan) throw new Error('Invalid plan');

        // Downgrade takes effect at next renewal
        const subscription = {
          ...currentSub,
          scheduledPlanId: newPlanId,
          updatedAt: nowISO()
        };

        await window.UBA.workspace.update(workspace.id, { subscription });
        log('Scheduled downgrade to plan:', newPlanId);
        return subscription;
      } catch (error) {
        warn('Error downgrading plan:', error);
        throw error;
      }
    },

    async cancelPlan() {
      try {
        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) throw new Error('No current workspace');

        const currentSub = await this.getCurrentSubscription();
        
        const subscription = {
          ...currentSub,
          cancelAtPeriodEnd: true,
          canceledAt: nowISO(),
          updatedAt: nowISO()
        };

        await window.UBA.workspace.update(workspace.id, { subscription });
        log('Canceled subscription (at period end)');
        return subscription;
      } catch (error) {
        warn('Error canceling plan:', error);
        throw error;
      }
    },

    async resumePlan() {
      try {
        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) throw new Error('No current workspace');

        const currentSub = await this.getCurrentSubscription();
        
        const subscription = {
          ...currentSub,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          updatedAt: nowISO()
        };

        await window.UBA.workspace.update(workspace.id, { subscription });
        log('Resumed subscription');
        return subscription;
      } catch (error) {
        warn('Error resuming plan:', error);
        throw error;
      }
    },

    async getBillingHistory() {
      try {
        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) return [];

        const invoices = workspace.billingInvoices || [];
        return invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (error) {
        warn('Error getting billing history:', error);
        return [];
      }
    },

    async addInvoice(invoiceData) {
      try {
        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) throw new Error('No current workspace');

        const invoice = {
          id: generateId('inv'),
          workspaceId: workspace.id,
          ...invoiceData,
          createdAt: nowISO()
        };

        const invoices = workspace.billingInvoices || [];
        invoices.push(invoice);

        await window.UBA.workspace.update(workspace.id, { billingInvoices: invoices });
        return invoice;
      } catch (error) {
        warn('Error adding invoice:', error);
        throw error;
      }
    }
  };

  // ===============================
  // Usage Tracking
  // ===============================
  const UsageTracking = {
    async trackUsage(entityType, count = 1) {
      try {
        const workspace = window.UBA.workspace.getCurrent();
        if (!workspace) return;

        const subscription = workspace.subscription;
        if (!subscription) return;

        const usage = subscription.usage || {};
        
        // Update usage counter
        if (entityType === 'storage') {
          usage.storage = (usage.storage || 0) + count;
        } else {
          usage[entityType] = (usage[entityType] || 0) + count;
        }

        // Special tracking for monthly invoice count
        if (entityType === 'invoices') {
          const now = new Date();
          const lastReset = subscription.invoiceCountResetAt ? new Date(subscription.invoiceCountResetAt) : null;
          
          if (!lastReset || lastReset.getMonth() !== now.getMonth()) {
            usage.invoicesThisMonth = 1;
            subscription.invoiceCountResetAt = now.toISOString();
          } else {
            usage.invoicesThisMonth = (usage.invoicesThisMonth || 0) + 1;
          }
        }

        subscription.usage = usage;
        subscription.updatedAt = nowISO();

        await window.UBA.workspace.update(workspace.id, { subscription });
        log('Usage tracked:', entityType, count);
      } catch (error) {
        warn('Error tracking usage:', error);
      }
    },

    async getCurrentUsage() {
      try {
        const subscription = await BillingEngine.getCurrentSubscription();
        if (!subscription) return {};

        return subscription.usage || {};
      } catch (error) {
        warn('Error getting current usage:', error);
        return {};
      }
    },

    async checkLimits(entityType, additionalCount = 1) {
      try {
        const subscription = await BillingEngine.getCurrentSubscription();
        if (!subscription) return { allowed: false, reason: 'No subscription' };

        const plan = PLAN_CATALOG[subscription.planId];
        if (!plan) return { allowed: false, reason: 'Invalid plan' };

        const usage = subscription.usage || {};
        const limits = plan.limits;

        // Check entity-specific limits
        let limitKey = `max${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
        
        // Special case for monthly invoices
        if (entityType === 'invoices') {
          const currentCount = usage.invoicesThisMonth || 0;
          const limit = limits.maxInvoicesPerMonth;
          
          if (currentCount + additionalCount > limit) {
            return {
              allowed: false,
              reason: `Monthly invoice limit reached (${limit})`,
              current: currentCount,
              limit: limit,
              entityType: 'invoices'
            };
          }
        }

        // Check general limit
        if (limits[limitKey]) {
          const currentCount = usage[entityType] || 0;
          const limit = limits[limitKey];

          if (currentCount + additionalCount > limit) {
            return {
              allowed: false,
              reason: `${entityType} limit reached (${limit})`,
              current: currentCount,
              limit: limit,
              entityType: entityType
            };
          }
        }

        return { allowed: true };
      } catch (error) {
        warn('Error checking limits:', error);
        return { allowed: true }; // Fail open in local mode
      }
    },

    async enforcePlanLimits(entityType) {
      const check = await this.checkLimits(entityType);
      if (!check.allowed) {
        return check;
      }
      return { allowed: true };
    },

    async checkFeatureAccess(featureName) {
      try {
        const subscription = await BillingEngine.getCurrentSubscription();
        if (!subscription) return false;

        const plan = PLAN_CATALOG[subscription.planId];
        if (!plan) return false;

        return plan.features_flags[featureName] || false;
      } catch (error) {
        warn('Error checking feature access:', error);
        return false;
      }
    }
  };

  // ===============================
  // Paywall System
  // ===============================
  const Paywall = {
    show(limitInfo) {
      // Create modal if doesn't exist
      let modal = document.getElementById('uba-paywall-modal');
      if (!modal) {
        modal = this.createModal();
        document.body.appendChild(modal);
      }

      // Update modal content
      this.updateModalContent(modal, limitInfo);
      
      // Show modal
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    },

    hide() {
      const modal = document.getElementById('uba-paywall-modal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    },

    createModal() {
      const modal = document.createElement('div');
      modal.id = 'uba-paywall-modal';
      modal.className = 'uba-paywall-modal';
      modal.innerHTML = `
        <div class="uba-paywall-overlay" onclick="window.UBA.billing.Paywall.hide()"></div>
        <div class="uba-paywall-content">
          <button class="uba-paywall-close" onclick="window.UBA.billing.Paywall.hide()">×</button>
          <div id="uba-paywall-body"></div>
        </div>
      `;
      return modal;
    },

    async updateModalContent(modal, limitInfo) {
      const body = modal.querySelector('#uba-paywall-body');
      const subscription = await BillingEngine.getCurrentSubscription();
      const currentPlan = PLAN_CATALOG[subscription.planId];

      const entityName = limitInfo.entityType.charAt(0).toUpperCase() + limitInfo.entityType.slice(1);
      
      body.innerHTML = `
        <div class="uba-paywall-header">
          <div class="uba-paywall-icon">🔒</div>
          <h2>Upgrade to Create More ${entityName}</h2>
          <p>You've reached the limit of your ${currentPlan.name} plan</p>
        </div>

        <div class="uba-paywall-limit-info">
          <div class="uba-paywall-limit-bar">
            <div class="uba-paywall-limit-fill" style="width: ${(limitInfo.current / limitInfo.limit) * 100}%"></div>
          </div>
          <p><strong>${limitInfo.current} / ${limitInfo.limit}</strong> ${entityName.toLowerCase()} used</p>
        </div>

        <div class="uba-paywall-plans">
          ${this.renderPlanComparison(subscription.planId, limitInfo.entityType)}
        </div>

        <div class="uba-paywall-footer">
          <p>Need help choosing? <a href="mailto:support@mhm-uba.com">Contact us</a></p>
        </div>
      `;
    },

    renderPlanComparison(currentPlanId, entityType) {
      const plans = Object.values(PLAN_CATALOG).filter(p => p.id !== 'free');
      
      return plans.map(plan => {
        const isCurrent = plan.id === currentPlanId;
        const limitKey = `max${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
        const limit = plan.limits[limitKey];
        const limitText = limit > 900000 ? 'Unlimited' : limit;

        return `
          <div class="uba-paywall-plan ${isCurrent ? 'current' : ''} ${plan.popular ? 'popular' : ''}">
            ${plan.popular ? '<div class="uba-plan-badge">Most Popular</div>' : ''}
            ${isCurrent ? '<div class="uba-plan-badge current-plan">Current Plan</div>' : ''}
            
            <h3>${plan.name}</h3>
            <div class="uba-plan-price">
              <span class="uba-price-amount">${plan.currency}${plan.monthlyPrice}</span>
              <span class="uba-price-period">/month</span>
            </div>
            
            <div class="uba-plan-limit">
              <strong>${limitText}</strong> ${entityType}
            </div>

            <ul class="uba-plan-features">
              ${plan.features.slice(0, 4).map(f => `<li>✓ ${f}</li>`).join('')}
            </ul>

            ${!isCurrent ? `
              <button class="uba-btn-primary" onclick="window.UBA.billing.upgradeTo('${plan.id}', 'monthly')">
                Upgrade to ${plan.name}
              </button>
            ` : `
              <button class="uba-btn-secondary" disabled>Current Plan</button>
            `}
          </div>
        `;
      }).join('');
    }
  };

  // ===============================
  // Public API
  // ===============================
  window.UBA = window.UBA || {};
  window.UBA.billing = {
    // Plan Catalog
    PLAN_CATALOG,
    
    // Billing Engine
    getCurrentSubscription: () => BillingEngine.getCurrentSubscription(),
    listPlans: () => BillingEngine.listPlans(),
    getPlan: (planId) => BillingEngine.getPlan(planId),
    startTrial: (planId, days) => BillingEngine.startTrial(planId, days),
    activatePlan: (planId, period) => BillingEngine.activatePlan(planId, period),
    upgradePlan: (planId) => BillingEngine.upgradePlan(planId),
    downgradePlan: (planId) => BillingEngine.downgradePlan(planId),
    cancelPlan: () => BillingEngine.cancelPlan(),
    resumePlan: () => BillingEngine.resumePlan(),
    getBillingHistory: () => BillingEngine.getBillingHistory(),
    
    // Usage Tracking
    trackUsage: (type, count) => UsageTracking.trackUsage(type, count),
    getCurrentUsage: () => UsageTracking.getCurrentUsage(),
    checkLimits: (type, count) => UsageTracking.checkLimits(type, count),
    enforcePlanLimits: (type) => UsageTracking.enforcePlanLimits(type),
    checkFeatureAccess: (feature) => UsageTracking.checkFeatureAccess(feature),
    
    // Paywall
    Paywall,
    showPaywall: (limitInfo) => Paywall.show(limitInfo),
    hidePaywall: () => Paywall.hide(),
    
    // Convenience method for upgrade flow
    async upgradeTo(planId, period = 'monthly') {
      try {
        await BillingEngine.upgradePlan(planId);
        Paywall.hide();
        
        // Show success message
        if (window.showNotification) {
          window.showNotification(`Successfully upgraded to ${PLAN_CATALOG[planId].name} plan!`, 'success');
        }
        
        // Reload page to refresh UI
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        warn('Error upgrading:', error);
        if (window.showNotification) {
          window.showNotification('Failed to upgrade plan', 'error');
        }
      }
    }
  };

  log('Billing module loaded');
})();
