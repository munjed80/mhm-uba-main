// stripe-mock.js — Stripe Webhook Mock Engine for MHM UBA
// Simulates Stripe webhook events for local-mode testing and development
(function () {
  'use strict';

  // ===============================
  // Configuration
  // ===============================
  const WEBHOOKS_STORAGE_KEY = 'uba-webhook-events';
  const WEBHOOKS_CONFIG_KEY = 'uba-webhook-config';

  // Webhook event types
  const WEBHOOK_EVENTS = {
    INVOICE_PAID: 'invoice.paid',
    INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
    SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    SUBSCRIPTION_CANCELED: 'customer.subscription.deleted',
    TRIAL_WILL_END: 'customer.subscription.trial_will_end',
    CHARGE_REFUNDED: 'charge.refunded',
    PAYMENT_METHOD_ATTACHED: 'payment_method.attached',
    PAYMENT_METHOD_DETACHED: 'payment_method.detached',
    CUSTOMER_CREATED: 'customer.created',
    CUSTOMER_UPDATED: 'customer.updated'
  };

  // ===============================
  // Utility Functions
  // ===============================
  function log(...args) {
    console.log('[UBA Stripe Mock]', ...args);
  }

  function warn(...args) {
    console.warn('[UBA Stripe Mock]', ...args);
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

  function generateId(prefix = 'evt') {
    return `${prefix}_${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===============================
  // Webhook Event Templates
  // ===============================
  function createInvoicePaidEvent(workspaceId, amount, planId) {
    return {
      id: generateId('evt'),
      type: WEBHOOK_EVENTS.INVOICE_PAID,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: generateId('in'),
          customer: generateId('cus'),
          subscription: generateId('sub'),
          amount_paid: amount * 100, // Stripe uses cents
          currency: 'eur',
          status: 'paid',
          metadata: {
            workspace_id: workspaceId,
            plan_id: planId
          },
          paid: true,
          period_start: Math.floor(Date.now() / 1000),
          period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        }
      },
      workspaceId: workspaceId
    };
  }

  function createInvoicePaymentFailedEvent(workspaceId, amount, planId) {
    return {
      id: generateId('evt'),
      type: WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: generateId('in'),
          customer: generateId('cus'),
          subscription: generateId('sub'),
          amount_due: amount * 100,
          currency: 'eur',
          status: 'open',
          metadata: {
            workspace_id: workspaceId,
            plan_id: planId
          },
          paid: false,
          attempt_count: 1
        }
      },
      workspaceId: workspaceId
    };
  }

  function createSubscriptionUpdatedEvent(workspaceId, planId, status) {
    return {
      id: generateId('evt'),
      type: WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: generateId('sub'),
          customer: generateId('cus'),
          status: status, // active, past_due, canceled, etc.
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
          metadata: {
            workspace_id: workspaceId,
            plan_id: planId
          },
          items: {
            data: [{
              price: {
                id: `price_${planId}`,
                product: `prod_${planId}`
              }
            }]
          }
        }
      },
      workspaceId: workspaceId
    };
  }

  function createSubscriptionCanceledEvent(workspaceId, planId) {
    return {
      id: generateId('evt'),
      type: WEBHOOK_EVENTS.SUBSCRIPTION_CANCELED,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: generateId('sub'),
          customer: generateId('cus'),
          status: 'canceled',
          canceled_at: Math.floor(Date.now() / 1000),
          metadata: {
            workspace_id: workspaceId,
            plan_id: planId
          }
        }
      },
      workspaceId: workspaceId
    };
  }

  function createTrialWillEndEvent(workspaceId, planId, daysRemaining) {
    const trialEnd = Math.floor(Date.now() / 1000) + (daysRemaining * 24 * 60 * 60);
    return {
      id: generateId('evt'),
      type: WEBHOOK_EVENTS.TRIAL_WILL_END,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: generateId('sub'),
          customer: generateId('cus'),
          status: 'trialing',
          trial_end: trialEnd,
          metadata: {
            workspace_id: workspaceId,
            plan_id: planId
          }
        }
      },
      workspaceId: workspaceId
    };
  }

  function createChargeRefundedEvent(workspaceId, amount) {
    return {
      id: generateId('evt'),
      type: WEBHOOK_EVENTS.CHARGE_REFUNDED,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: generateId('ch'),
          amount: amount * 100,
          amount_refunded: amount * 100,
          currency: 'eur',
          refunded: true,
          metadata: {
            workspace_id: workspaceId
          }
        }
      },
      workspaceId: workspaceId
    };
  }

  // ===============================
  // Webhook Engine
  // ===============================
  const WebhookEngine = {
    /**
     * Initialize webhook system
     */
    async init() {
      log('Initializing Stripe Webhook Mock');

      const config = getJSON(WEBHOOKS_CONFIG_KEY, {
        enabled: true,
        autoProcess: true,
        notifyOnEvent: true
      });

      setJSON(WEBHOOKS_CONFIG_KEY, config);
      log('Webhook system ready');
      return Promise.resolve(config);
    },

    /**
     * Trigger a webhook event manually
     */
    async triggerEvent(eventType, data = {}) {
      const workspace = window.UBA && window.UBA.session ? window.UBA.session.currentWorkspace : null;
      if (!workspace) {
        warn('No active workspace');
        return Promise.resolve(null);
      }

      let event;
      const workspaceId = workspace.id;
      const subscription = workspace.subscription || {};
      const planId = subscription.planId || 'free';

      switch (eventType) {
        case WEBHOOK_EVENTS.INVOICE_PAID:
          const amount = data.amount || (planId === 'pro' ? 29 : planId === 'enterprise' ? 99 : 0);
          event = createInvoicePaidEvent(workspaceId, amount, planId);
          break;

        case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
          const failAmount = data.amount || (planId === 'pro' ? 29 : planId === 'enterprise' ? 99 : 0);
          event = createInvoicePaymentFailedEvent(workspaceId, failAmount, planId);
          break;

        case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
          const status = data.status || 'active';
          event = createSubscriptionUpdatedEvent(workspaceId, planId, status);
          break;

        case WEBHOOK_EVENTS.SUBSCRIPTION_CANCELED:
          event = createSubscriptionCanceledEvent(workspaceId, planId);
          break;

        case WEBHOOK_EVENTS.TRIAL_WILL_END:
          const daysRemaining = data.daysRemaining || 3;
          event = createTrialWillEndEvent(workspaceId, planId, daysRemaining);
          break;

        case WEBHOOK_EVENTS.CHARGE_REFUNDED:
          const refundAmount = data.amount || 29;
          event = createChargeRefundedEvent(workspaceId, refundAmount);
          break;

        default:
          warn(`Unknown event type: ${eventType}`);
          return Promise.resolve(null);
      }

      // Store event
      await this.storeEvent(event);

      // Process event if auto-processing enabled
      const config = getJSON(WEBHOOKS_CONFIG_KEY, { autoProcess: true });
      if (config.autoProcess) {
        await this.processEvent(event);
      }

      log(`Webhook event triggered: ${eventType}`, event);
      return Promise.resolve(event);
    },

    /**
     * Store webhook event
     */
    async storeEvent(event) {
      const allEvents = getJSON(WEBHOOKS_STORAGE_KEY, []);
      allEvents.push({
        ...event,
        storedAt: new Date().toISOString(),
        processed: false
      });

      // Keep last 1000 events
      if (allEvents.length > 1000) {
        allEvents.shift();
      }

      setJSON(WEBHOOKS_STORAGE_KEY, allEvents);
      return Promise.resolve(true);
    },

    /**
     * Process webhook event
     */
    async processEvent(event) {
      log(`Processing webhook: ${event.type}`);

      try {
        switch (event.type) {
          case WEBHOOK_EVENTS.INVOICE_PAID:
            await this.handleInvoicePaid(event);
            break;

          case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
            await this.handleInvoicePaymentFailed(event);
            break;

          case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
            await this.handleSubscriptionUpdated(event);
            break;

          case WEBHOOK_EVENTS.SUBSCRIPTION_CANCELED:
            await this.handleSubscriptionCanceled(event);
            break;

          case WEBHOOK_EVENTS.TRIAL_WILL_END:
            await this.handleTrialWillEnd(event);
            break;

          case WEBHOOK_EVENTS.CHARGE_REFUNDED:
            await this.handleChargeRefunded(event);
            break;

          default:
            log(`No handler for event type: ${event.type}`);
        }

        // Mark as processed
        await this.markEventProcessed(event.id);

        return Promise.resolve(true);
      } catch (error) {
        warn('Error processing webhook:', error);
        return Promise.resolve(false);
      }
    },

    /**
     * Handler: Invoice Paid
     */
    async handleInvoicePaid(event) {
      const invoice = event.data.object;
      log('Invoice paid:', invoice.id, invoice.amount_paid / 100);

      // Update subscription status if needed
      if (window.UBA && window.UBA.billing) {
        // Subscription is now active
        const subscription = await window.UBA.billing.getCurrentSubscription();
        if (subscription && subscription.status !== 'active') {
          // Update via workspace
          const workspace = window.UBA.session.currentWorkspace;
          workspace.subscription.status = 'active';
          await window.UBA.workspace.update(workspace.id, { subscription: workspace.subscription });
        }
      }

      // Show notification
      if (window.Notifications) {
        window.Notifications.show('Payment received! Your subscription is active.', 'success');
      }

      return Promise.resolve(true);
    },

    /**
     * Handler: Invoice Payment Failed
     */
    async handleInvoicePaymentFailed(event) {
      const invoice = event.data.object;
      log('Invoice payment failed:', invoice.id);

      // Update subscription status
      if (window.UBA && window.UBA.billing) {
        const workspace = window.UBA.session.currentWorkspace;
        workspace.subscription.status = 'past_due';
        await window.UBA.workspace.update(workspace.id, { subscription: workspace.subscription });
      }

      // Show notification
      if (window.Notifications) {
        window.Notifications.show('Payment failed. Please update your payment method.', 'error');
      }

      return Promise.resolve(true);
    },

    /**
     * Handler: Subscription Updated
     */
    async handleSubscriptionUpdated(event) {
      const subscription = event.data.object;
      log('Subscription updated:', subscription.id, subscription.status);

      if (window.UBA && window.UBA.billing) {
        const workspace = window.UBA.session.currentWorkspace;
        workspace.subscription.status = subscription.status;
        await window.UBA.workspace.update(workspace.id, { subscription: workspace.subscription });
      }

      return Promise.resolve(true);
    },

    /**
     * Handler: Subscription Canceled
     */
    async handleSubscriptionCanceled(event) {
      const subscription = event.data.object;
      log('Subscription canceled:', subscription.id);

      if (window.UBA && window.UBA.billing) {
        const workspace = window.UBA.session.currentWorkspace;
        workspace.subscription.status = 'canceled';
        workspace.subscription.canceledAt = new Date().toISOString();
        await window.UBA.workspace.update(workspace.id, { subscription: workspace.subscription });
      }

      // Show notification
      if (window.Notifications) {
        window.Notifications.show('Subscription canceled. You have access until the end of your billing period.', 'info');
      }

      return Promise.resolve(true);
    },

    /**
     * Handler: Trial Will End
     */
    async handleTrialWillEnd(event) {
      const subscription = event.data.object;
      const trialEnd = new Date(subscription.trial_end * 1000);
      log('Trial ending soon:', trialEnd);

      // Show notification
      if (window.Notifications) {
        const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
        window.Notifications.show(`Your trial ends in ${daysLeft} days. Add a payment method to continue.`, 'warning');
      }

      return Promise.resolve(true);
    },

    /**
     * Handler: Charge Refunded
     */
    async handleChargeRefunded(event) {
      const charge = event.data.object;
      log('Charge refunded:', charge.id, charge.amount_refunded / 100);

      // Show notification
      if (window.Notifications) {
        window.Notifications.show(`Refund processed: €${charge.amount_refunded / 100}`, 'success');
      }

      return Promise.resolve(true);
    },

    /**
     * Mark event as processed
     */
    async markEventProcessed(eventId) {
      const allEvents = getJSON(WEBHOOKS_STORAGE_KEY, []);
      const event = allEvents.find(e => e.id === eventId);
      if (event) {
        event.processed = true;
        event.processedAt = new Date().toISOString();
        setJSON(WEBHOOKS_STORAGE_KEY, allEvents);
      }
      return Promise.resolve(true);
    },

    /**
     * Get all webhook events
     */
    async getEvents(workspaceId = null) {
      const allEvents = getJSON(WEBHOOKS_STORAGE_KEY, []);
      if (workspaceId) {
        return Promise.resolve(allEvents.filter(e => e.workspaceId === workspaceId));
      }
      return Promise.resolve(allEvents);
    },

    /**
     * Get unprocessed events
     */
    async getUnprocessedEvents(workspaceId = null) {
      const events = await this.getEvents(workspaceId);
      return Promise.resolve(events.filter(e => !e.processed));
    },

    /**
     * Clear all events
     */
    async clearEvents() {
      localStorage.removeItem(WEBHOOKS_STORAGE_KEY);
      log('All webhook events cleared');
      return Promise.resolve(true);
    },

    /**
     * Simulate automatic payment success/failure
     */
    async simulatePaymentAttempt(success = true) {
      if (success) {
        await this.triggerEvent(WEBHOOK_EVENTS.INVOICE_PAID);
      } else {
        await this.triggerEvent(WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED);
      }
      return Promise.resolve(true);
    },

    /**
     * Simulate trial ending warning (3 days before)
     */
    async simulateTrialEnding() {
      await this.triggerEvent(WEBHOOK_EVENTS.TRIAL_WILL_END, { daysRemaining: 3 });
      return Promise.resolve(true);
    }
  };

  // ===============================
  // Expose API
  // ===============================
  if (!window.UBA) {
    window.UBA = {};
  }

  window.UBA.webhooks = {
    // Core methods
    init: () => WebhookEngine.init(),
    triggerEvent: (type, data) => WebhookEngine.triggerEvent(type, data),
    processEvent: (event) => WebhookEngine.processEvent(event),

    // Event management
    getEvents: (workspaceId) => WebhookEngine.getEvents(workspaceId),
    getUnprocessedEvents: (workspaceId) => WebhookEngine.getUnprocessedEvents(workspaceId),
    clearEvents: () => WebhookEngine.clearEvents(),

    // Simulations
    simulatePaymentSuccess: () => WebhookEngine.simulatePaymentAttempt(true),
    simulatePaymentFailure: () => WebhookEngine.simulatePaymentAttempt(false),
    simulateTrialEnding: () => WebhookEngine.simulateTrialEnding(),

    // Constants
    WEBHOOK_EVENTS
  };

  // Auto-initialize
  document.addEventListener('DOMContentLoaded', () => {
    UBA.webhooks.init();
  });

  log('Stripe Webhook Mock module loaded');
})();
