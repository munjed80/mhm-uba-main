# Enterprise Features Implementation Guide

Complete documentation for the enterprise-grade features added to MHM UBA SaaS platform.

## Overview

This guide covers all enterprise features implemented for the MHM UBA platform:
- Feature Flags System
- Usage Analytics
- Stripe Webhook Mock
- SaaS License Keys Mode
- Multi-Region Billing

All features work in local mode (no backend required) and are architected for seamless transition to remote mode.

---

## 1. Feature Flags System

### Purpose
Enable/disable features dynamically with granular targeting based on rollout percentage, user roles, workspace, plans, or specific users.

### Architecture
- **Module**: `assets/js/feature-flags.js`
- **UI Module**: `assets/js/feature-flags-ui.js`
- **Storage**: `localStorage` key `uba-feature-flags`
- **Namespace**: `window.UBA.flags`

### Flag Types

| Type | Description | Use Case |
|------|-------------|----------|
| `boolean` | Simple on/off | Enable/disable feature globally |
| `percentage` | Gradual rollout 0-100% | Canary deployments, A/B testing |
| `role` | Target specific roles | Beta features for admins/owners |
| `workspace` | Target specific workspaces | Custom features for enterprise clients |
| `plan` | Target subscription plans | Premium features for paid plans |
| `user` | Target specific user emails | VIP access, early adopters |

### API Reference

```javascript
// Check if feature enabled
const enabled = await UBA.flags.isEnabled('feature-name');

// With context
const enabled = await UBA.flags.isEnabled('feature-name', {
  user: currentUser,
  workspace: currentWorkspace,
  role: 'admin',
  plan: 'pro'
});

// Get all flags
const flags = await UBA.flags.getAllFlags();

// Create/update flag
await UBA.flags.updateFlag('my-feature', {
  name: 'My Feature',
  description: 'Description',
  type: 'percentage',
  enabled: true,
  rolloutPercentage: 25,
  targetRoles: ['admin', 'owner'],
  targetPlans: ['pro', 'enterprise'],
  targetWorkspaces: ['ws-123'],
  targetUsers: ['user@example.com']
});

// Delete flag
await UBA.flags.deleteFlag('feature-id');

// Manual override (testing)
await UBA.flags.setOverride('feature-name', true);
await UBA.flags.clearOverride('feature-name');
await UBA.flags.clearAllOverrides();

// Batch check
const results = await UBA.flags.checkFlags(['feature-1', 'feature-2']);
// Returns: { 'feature-1': true, 'feature-2': false }

// Get summary with evaluation
const summary = await UBA.flags.getFlagsSummary();
```

### Default Flags

1. **new-dashboard-layout** - Boolean, disabled
2. **advanced-automation-rules** - Plan-based (Pro/Enterprise)
3. **ai-powered-insights** - Plan-based (Pro/Enterprise)
4. **beta-reporting-engine** - Percentage rollout (25%)
5. **mobile-app-beta** - Role-based (Owner/Admin)
6. **real-time-collaboration** - Workspace-based

### Usage in Code

```javascript
// Check before rendering feature
async function renderAdvancedFeature() {
  const enabled = await UBA.flags.isEnabled('advanced-feature');
  if (!enabled) {
    return; // Feature hidden
  }
  
  // Render feature
  document.getElementById('advanced-section').style.display = 'block';
}

// Check at route/page load
if (await UBA.flags.isEnabled('new-dashboard-layout')) {
  loadNewDashboard();
} else {
  loadClassicDashboard();
}
```

### UI Components

The Feature Flags UI in Settings page provides:
- Toggle switches for enable/disable
- Rollout percentage sliders (0-100%)
- Role targeting checkboxes (Owner, Admin, Editor, Viewer)
- Plan targeting checkboxes (Free, Pro, Enterprise)
- Override indicators and clear buttons
- Visual status badges (Enabled/Disabled)

---

## 2. Usage Analytics System

### Purpose
Track user activity, measure engagement, and provide insights on workspace performance.

### Architecture
- **Module**: `assets/js/analytics.js`
- **UI Module**: `assets/js/analytics-dashboard-ui.js`
- **Storage**: `localStorage` key `uba-analytics-events`
- **Namespace**: `window.UBA.analytics`

### Event Types

- `page_view` - Page navigation
- `entity_create` - New record created
- `entity_update` - Record edited
- `entity_delete` - Record deleted
- `automation_run` - Automation executed
- `billing_action` - Subscription change
- `member_action` - Team member invite/remove
- `paywall_trigger` - Upgrade prompt shown
- `login` / `logout` - Authentication
- `workspace_switch` - Workspace changed
- `export` / `import` - Data export/import
- `report_generate` - Report created

### API Reference

```javascript
// Track events
await UBA.analytics.trackEvent('custom_event', { data: 'value' });

// Convenience trackers
await UBA.analytics.track.trackPageView('/clients.html');
await UBA.analytics.track.trackEntityCreate('clients', 'id-123', 'Acme Corp');
await UBA.analytics.track.trackEntityUpdate('clients', 'id-123', 'Acme', { name: 'New Name' });
await UBA.analytics.track.trackEntityDelete('projects', 'proj-456', 'Project X');
await UBA.analytics.track.trackAutomationRun('auto-1', 'Email Reminder', 'success');
await UBA.analytics.track.trackBillingAction('upgrade', 'pro', 29);
await UBA.analytics.track.trackMemberAction('invite', 'member-1', 'user@example.com', 'editor');
await UBA.analytics.track.trackPaywallTrigger('automations', 'pro', 'free');
await UBA.analytics.track.trackLogin('user@example.com');
await UBA.analytics.track.trackLogout();
await UBA.analytics.track.trackWorkspaceSwitch('ws-1', 'ws-2');
await UBA.analytics.track.trackExport('clients', 25);
await UBA.analytics.track.trackImport('invoices', 10);
await UBA.analytics.track.trackReportGenerate('revenue', { year: 2025 });

// Get events
const events = await UBA.analytics.getEvents();
const filtered = await UBA.analytics.getEventsByDateRange('2025-01-01', '2025-01-31');

// Get insights
const summary = await UBA.analytics.getUsageSummary();
// Returns: { totalEvents, eventsByType, eventsByPage, eventsByUser, dailyActivity, weeklyActivity, monthlyActivity }

const timeline = await UBA.analytics.getEventTimeline(30); // Last 30 days
// Returns: [{ date: '2025-01-01', total: 10, byType: { page_view: 5, ... } }, ...]

const topClients = await UBA.analytics.getTopEntities('clients', 10);
// Returns: [{ id, name, type, createCount, updateCount, deleteCount, totalActivity }, ...]

const heatmap = await UBA.analytics.getUserHeatmap(30);
// Returns: { '2025-01-01': { 0: 0, 1: 2, 2: 1, ... 23: 3 }, ... }

const score = await UBA.analytics.getWorkspaceActivityScore();
// Returns: 0-100 score based on events, consistency, diversity, engagement

// Utilities
await UBA.analytics.clearAnalytics(); // Clear workspace events
const exportData = await UBA.analytics.exportAnalytics(); // Export all analytics data
```

### Activity Score Calculation

Score (0-100) based on:
- **Events** (30 points): Total event count
- **Consistency** (30 points): Active days in last 7 days
- **Diversity** (20 points): Unique event types
- **Engagement** (20 points): Number of active users

### Analytics Dashboard UI

Displays in Settings page:
1. **Activity Score Circle** - Visual 0-100 gauge with color coding
2. **Usage Summary Cards** - Total events, active users, pages visited, event types
3. **Event Timeline** - 14-day bar chart
4. **Top Entities** - Most active clients and projects (top 5)
5. **Events Distribution** - Breakdown by event type with percentages

### Auto-Tracking

Page views are automatically tracked on every page load:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  UBA.analytics.track.trackPageView(window.location.pathname);
});
```

---

## 3. Stripe Webhook Mock Engine

### Purpose
Simulate Stripe webhook events for local development and testing without a real Stripe account.

### Architecture
- **Module**: `assets/js/stripe-mock.js`
- **Storage**: `localStorage` key `uba-webhook-events`
- **Namespace**: `window.UBA.webhooks`

### Webhook Event Types

| Event | Description | Handler |
|-------|-------------|---------|
| `invoice.paid` | Payment received | Set subscription to active, show success notification |
| `invoice.payment_failed` | Payment failed | Set subscription to past_due, show error notification |
| `customer.subscription.updated` | Subscription changed | Update subscription status |
| `customer.subscription.deleted` | Subscription canceled | Set status to canceled, notify user |
| `customer.subscription.trial_will_end` | Trial ending soon | Show warning notification (3 days before) |
| `charge.refunded` | Refund processed | Show refund notification |

### API Reference

```javascript
// Trigger specific event
await UBA.webhooks.triggerEvent('invoice.paid', { amount: 29 });
await UBA.webhooks.triggerEvent('invoice.payment_failed', { amount: 29 });
await UBA.webhooks.triggerEvent('customer.subscription.updated', { status: 'active' });
await UBA.webhooks.triggerEvent('customer.subscription.deleted');
await UBA.webhooks.triggerEvent('customer.subscription.trial_will_end', { daysRemaining: 3 });
await UBA.webhooks.triggerEvent('charge.refunded', { amount: 29 });

// Quick simulations
await UBA.webhooks.simulatePaymentSuccess(); // Triggers invoice.paid
await UBA.webhooks.simulatePaymentFailure(); // Triggers invoice.payment_failed
await UBA.webhooks.simulateTrialEnding(); // Triggers trial_will_end

// Get events
const events = await UBA.webhooks.getEvents(workspaceId);
const unprocessed = await UBA.webhooks.getUnprocessedEvents(workspaceId);

// Clear events
await UBA.webhooks.clearEvents();

// Manual processing
await UBA.webhooks.processEvent(event);
```

### Event Structure

Events match Stripe webhook format:
```javascript
{
  id: 'evt_xxxxx',
  type: 'invoice.paid',
  created: 1234567890,
  data: {
    object: {
      id: 'in_xxxxx',
      customer: 'cus_xxxxx',
      subscription: 'sub_xxxxx',
      amount_paid: 2900, // cents
      currency: 'eur',
      status: 'paid',
      metadata: {
        workspace_id: 'ws-123',
        plan_id: 'pro'
      }
    }
  },
  workspaceId: 'ws-123'
}
```

### Auto-Processing

Webhooks are automatically processed when triggered (configurable):
```javascript
await UBA.webhooks.init();
// Config: { enabled: true, autoProcess: true, notifyOnEvent: true }
```

### Integration

Webhooks automatically:
- Update workspace subscription status
- Show notifications to users
- Create billing invoices in history
- Handle trial expiry warnings

---

## 4. SaaS License Keys Mode

### Purpose
Generate, activate, and validate software license keys for desktop or offline scenarios.

### Architecture
- **Module**: `assets/js/license-keys.js`
- **Storage**: `localStorage` key `uba-license-keys`
- **Namespace**: `window.UBA.license`

### License Types

- `trial` - 14-day trial
- `monthly` - Monthly subscription
- `yearly` - Annual subscription
- `lifetime` - Perpetual license
- `enterprise` - Custom enterprise license

### License Status

- `pending` - Generated but not activated
- `active` - Activated and valid
- `expired` - License expired
- `suspended` - Temporarily disabled
- `revoked` - Permanently revoked

### API Reference

```javascript
// Generate license
const license = await UBA.license.generateLicense(
  'pro',        // Plan: free, pro, enterprise
  'yearly',     // Type: trial, monthly, yearly, lifetime, enterprise
  3,            // Max activations
  { metadata: 'custom data' } // Optional custom data
);
console.log(license.key); // "ABCD-EFGH-IJKL-MNOP-QRST"

// Activate license
const result = await UBA.license.activateLicense(
  'ABCD-EFGH-IJKL-MNOP-QRST',
  workspaceId // Optional
);
if (result.success) {
  console.log('License activated:', result.activation);
} else {
  console.error('Activation failed:', result.error);
}

// Validate license
const validation = await UBA.license.validateLicense(
  'ABCD-EFGH-IJKL-MNOP-QRST',
  workspaceId
);
if (validation.valid) {
  console.log('License valid until:', validation.license.expiresAt);
} else {
  console.error('Invalid:', validation.error);
}

// Deactivate license
await UBA.license.deactivateLicense(licenseKey, workspaceId);

// Revoke license (permanent)
await UBA.license.revokeLicense(licenseKey);

// Get license info
const info = await UBA.license.getLicenseInfo(licenseKey);
const currentLicense = await UBA.license.getCurrentLicense(); // For active workspace

// Get all licenses
const allLicenses = await UBA.license.getAllLicenses();

// Get activation logs
const logs = await UBA.license.getActivationLogs(licenseKey);

// Get machine fingerprint
const fingerprint = UBA.license.getMachineFingerprint();
```

### License Object Structure

```javascript
{
  key: 'ABCD-EFGH-IJKL-MNOP-QRST',
  plan: 'pro',
  type: 'yearly',
  status: 'active',
  createdAt: '2025-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:00:00.000Z', // null for lifetime
  maxActivations: 3,
  activations: [
    {
      activationId: 'act-123',
      workspaceId: 'ws-456',
      machineId: 'abc123def',
      activatedAt: '2025-01-01T00:00:00.000Z',
      lastValidated: '2025-01-15T00:00:00.000Z'
    }
  ],
  metadata: { customField: 'value' }
}
```

### Machine Fingerprinting

Unique device/browser identification based on:
- User agent
- Language
- Screen resolution
- Timezone offset
- Hardware concurrency

### Activation Limits

- Prevent over-activation
- Track which machines/workspaces have license active
- Allow deactivation to free up slots

### Integration with Subscriptions

When a license is activated, it automatically:
- Updates workspace subscription plan
- Sets subscription status to active
- Stores license key in workspace

---

## 5. Multi-Region Billing

### Purpose
Support global customers with regional pricing, currencies, and tax compliance.

### Architecture
- **Module**: `assets/js/multi-region-billing.js`
- **Storage**: `localStorage` key `uba-region-config`
- **Namespace**: `window.UBA.multiRegion`

### Supported Regions

| Region | Currency | Symbol | Tax | Rate | Stripe Account |
|--------|----------|--------|-----|------|----------------|
| EU | EUR | € | VAT | 21% | acct_eu_example |
| US | USD | $ | Sales Tax | 8% | acct_us_example |
| UK | GBP | £ | VAT | 20% | acct_uk_example |
| CA | CAD | C$ | GST/HST | 13% | acct_ca_example |
| AU | AUD | A$ | GST | 10% | acct_au_example |
| IN | INR | ₹ | GST | 18% | acct_in_example |
| BR | BRL | R$ | Tax | 15% | acct_br_example |
| JP | JPY | ¥ | Consumption Tax | 10% | acct_jp_example |

### API Reference

```javascript
// Detect user's region
const regionId = await UBA.multiRegion.detectRegion();
// Returns: 'us', 'eu', 'uk', etc. based on timezone/language

// Get current region
const region = await UBA.multiRegion.getCurrentRegion();
// Returns: { id: 'us', name: 'United States', currency: 'USD', symbol: '$', ... }

// Set region
await UBA.multiRegion.setRegion('us');

// Convert price
const conversion = await UBA.multiRegion.convertPrice(29, 'USD');
// Returns: { original: 29, converted: 31.90, currency: 'USD', rate: 1.10 }

// Get regional price (with adjustments and tax)
const price = await UBA.multiRegion.getRegionalPrice(29); // €29 base
// Returns: {
//   basePrice: 29,
//   regionalPrice: 31.90, // USD after conversion and adjustment
//   priceBeforeTax: 31.90,
//   taxRate: 0.08,
//   taxAmount: 2.55,
//   totalPrice: 34.45,
//   currency: 'USD',
//   symbol: '$',
//   taxName: 'Sales Tax',
//   region: 'United States',
//   exchangeRate: 1.10,
//   regionalAdjustment: 1.0
// }

// Get all regional prices
const allPrices = await UBA.multiRegion.getAllRegionalPrices(29);
// Returns: { eu: {...}, us: {...}, uk: {...}, ... }

// Calculate tax
const tax = await UBA.multiRegion.calculateTax(100, 'us');
// Returns: { amount: 100, taxRate: 0.08, taxName: 'Sales Tax', tax: 8, total: 108, currency: 'USD', symbol: '$' }

// Format price
const formatted = await UBA.multiRegion.formatPrice(29.99, 'us');
// Returns: "$29.99"

// Get Stripe account for region
const stripeAccount = await UBA.multiRegion.getStripeAccountForRegion('us');
// Returns: 'acct_us_example'

// Update exchange rates (mock in local mode, real API in production)
await UBA.multiRegion.updateExchangeRates({
  EUR: 1.0,
  USD: 1.10,
  GBP: 0.85,
  // ...
});

// Get current rates
const rates = await UBA.multiRegion.getExchangeRates();
// Returns: { base: 'EUR', rates: { EUR: 1.0, USD: 1.10, ... }, lastUpdated: '...' }

// Get all regions
const regions = await UBA.multiRegion.getAllRegions();
```

### Regional Pricing Adjustments

Purchase power parity (PPP) adjustments:
- EU: 1.0x (base)
- US: 1.0x
- UK: 0.95x (5% discount)
- CA: 1.05x (5% premium)
- AU: 1.10x (10% premium)
- IN: 0.70x (30% discount)
- BR: 0.80x (20% discount)
- JP: 1.05x (5% premium)

### Currency Formatting

- JPY doesn't use decimals: ¥2900 (not ¥2900.00)
- Other currencies use 2 decimals: $29.00, €29.00, £29.00

### Auto-Detection Logic

Based on browser timezone:
- America/* → US (default), CA (Toronto), BR (Sao Paulo)
- Europe/* → UK (London), EU (others)
- Asia/* → JP (Tokyo), IN (Kolkata/India)
- Australia/* → AU

### Integration with Billing

When used with `UBA.billing`:
```javascript
// Get plan price for user's region
const basePriceEUR = 29;
const regionalPrice = await UBA.multiRegion.getRegionalPrice(basePriceEUR);

// Display
console.log(`${regionalPrice.symbol}${regionalPrice.totalPrice} (incl. ${regionalPrice.taxName})`);
// "$34.45 (incl. Sales Tax)"

// Charge correct Stripe account
const stripeAccount = await UBA.multiRegion.getStripeAccountForRegion();
// Use this account when creating Stripe checkout session
```

---

## Local vs. Remote Mode

All enterprise features are designed for seamless transition:

### Local Mode (Current)
- Data in `localStorage`
- No network calls
- Instant operations
- Mock implementations

### Remote Mode (Future)

Simply change config and implement remote methods:

```javascript
// Feature Flags
UBA.config.storageMode = 'remote';
// Now UBA.flags methods call API instead of localStorage

// Example remote implementation:
async isEnabled(flagId, context) {
  if (UBA.config.storageMode === 'remote') {
    const response = await fetch(`${UBA.config.apiBaseUrl}/flags/${flagId}/evaluate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(context)
    });
    return await response.json();
  } else {
    // Local mode implementation
  }
}
```

Same pattern applies to all modules.

---

## Testing Enterprise Features

### Feature Flags Testing

```javascript
// Override for testing
await UBA.flags.setOverride('beta-feature', true);

// Check
if (await UBA.flags.isEnabled('beta-feature')) {
  console.log('Feature enabled via override');
}

// Clear override
await UBA.flags.clearOverride('beta-feature');
```

### Analytics Testing

```javascript
// Track test events
for (let i = 0; i < 10; i++) {
  await UBA.analytics.track.trackEntityCreate('clients', `client-${i}`, `Client ${i}`);
}

// Check summary
const summary = await UBA.analytics.getUsageSummary();
console.log(summary.totalEvents); // 10

// Check score
const score = await UBA.analytics.getWorkspaceActivityScore();
console.log(score); // Should increase with activity
```

### Webhook Testing

```javascript
// Simulate payment success
await UBA.webhooks.simulatePaymentSuccess();
// Check notification appeared

// Simulate payment failure
await UBA.webhooks.simulatePaymentFailure();
// Subscription should be past_due

// Simulate trial ending
await UBA.webhooks.simulateTrialEnding();
// Warning notification should appear
```

### License Keys Testing

```javascript
// Generate and activate
const license = await UBA.license.generateLicense('pro', 'yearly', 3);
const key = license.key;

const result = await UBA.license.activateLicense(key);
console.log(result.success); // true

// Validate
const validation = await UBA.license.validateLicense(key);
console.log(validation.valid); // true

// Check workspace subscription updated
const workspace = await UBA.workspace.getCurrent();
console.log(workspace.licenseKey); // Should equal key
console.log(workspace.subscription.planId); // 'pro'
```

### Multi-Region Testing

```javascript
// Test different regions
for (const regionId of ['us', 'eu', 'uk', 'jp']) {
  await UBA.multiRegion.setRegion(regionId);
  const price = await UBA.multiRegion.getRegionalPrice(29);
  console.log(`${regionId}: ${price.symbol}${price.totalPrice}`);
}

// Test detection
const detected = await UBA.multiRegion.detectRegion();
console.log('Detected region:', detected);
```

---

## Performance Considerations

### Storage Limits
- Analytics: Max 10,000 events per workspace
- Webhooks: Max 1,000 events total
- Flags: No limit (small data)
- Licenses: No limit
- Region: Minimal data

### Optimization Tips
1. Clear old analytics periodically:
   ```javascript
   await UBA.analytics.clearAnalytics();
   ```

2. Export analytics before clearing:
   ```javascript
   const backup = await UBA.analytics.exportAnalytics();
   // Save backup somewhere
   await UBA.analytics.clearAnalytics();
   ```

3. Use batch flag checks:
   ```javascript
   const flags = await UBA.flags.checkFlags(['flag1', 'flag2', 'flag3']);
   // Single call instead of 3
   ```

---

## Security Considerations

### Local Mode Security
- Data in localStorage is **not encrypted**
- Suitable for development/testing only
- Do not store sensitive data

### Remote Mode Security
- Use HTTPS for all API calls
- Validate flags server-side (don't trust client)
- Implement proper authentication (JWT)
- Validate license keys server-side
- Use Stripe webhooks for payment verification (never trust client-side status)

### Best Practices
1. **Feature Flags**: Always validate server-side for security features
2. **Analytics**: Sanitize user input before storing
3. **Webhooks**: Verify webhook signatures in production
4. **Licenses**: Validate on server on every request
5. **Multi-Region**: Use Stripe's native multi-currency support

---

## Migration Checklist

When moving to remote mode:

- [ ] Set up backend API endpoints for each feature
- [ ] Implement authentication (JWT/session)
- [ ] Add database tables for:
  - [ ] Feature flags
  - [ ] Analytics events
  - [ ] Webhook events
  - [ ] License keys
  - [ ] Regional pricing
- [ ] Update `UBA.config.storageMode = 'remote'`
- [ ] Implement remote methods in each module
- [ ] Set up Stripe webhooks (real)
- [ ] Configure multi-region Stripe accounts
- [ ] Add webhook signature verification
- [ ] Implement server-side license validation
- [ ] Set up exchange rate API
- [ ] Add caching layer for flags and pricing
- [ ] Test all features in staging
- [ ] Deploy to production

---

## Support & Troubleshooting

### Common Issues

**Feature flag not updating:**
```javascript
// Clear overrides
await UBA.flags.clearAllOverrides();

// Check flag status
const flag = await UBA.flags.getFlag('flag-id');
console.log(flag);
```

**Analytics not tracking:**
```javascript
// Check if initialized
console.log(window.UBA.analytics);

// Manually track
await UBA.analytics.trackEvent('test', { data: 'value' });

// Check events
const events = await UBA.analytics.getEvents();
console.log(events);
```

**License activation failing:**
```javascript
// Check license info
const info = await UBA.license.getLicenseInfo(licenseKey);
console.log(info.status); // Check if expired/revoked

// Check activations
console.log(info.activations.length, 'of', info.maxActivations);
```

**Pricing calculation issues:**
```javascript
// Check exchange rates
const rates = await UBA.multiRegion.getExchangeRates();
console.log(rates);

// Update rates
await UBA.multiRegion.updateExchangeRates();
```

### Debug Mode

Enable debug logging:
```javascript
UBA.config.debugMode = true;
// All modules will log to console
```

---

## Conclusion

All enterprise features are now fully implemented and tested in local mode. The architecture is designed for:

✅ **Zero Breaking Changes**: Existing code works without modification
✅ **Future-Ready**: Easy transition to remote APIs
✅ **Scalable**: Designed for SaaS scale
✅ **Testable**: Full local testing without backend
✅ **Documented**: Comprehensive API documentation

For questions or issues, refer to module-specific logs in browser console.
