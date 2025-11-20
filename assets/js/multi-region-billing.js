// multi-region-billing.js — Multi-Region Billing for MHM UBA
// Support for regional pricing, currency conversion, and tax compliance
(function () {
  'use strict';

  // ===============================
  // Configuration
  // ===============================
  const REGION_CONFIG_KEY = 'uba-region-config';
  const CURRENCY_RATES_KEY = 'uba-currency-rates';

  // Supported regions
  const REGIONS = {
    EU: {
      id: 'eu',
      name: 'Europe',
      currency: 'EUR',
      symbol: '€',
      taxName: 'VAT',
      taxRate: 0.21, // 21% VAT
      stripeAccount: 'acct_eu_example'
    },
    US: {
      id: 'us',
      name: 'United States',
      currency: 'USD',
      symbol: '$',
      taxName: 'Sales Tax',
      taxRate: 0.08, // 8% sales tax (varies by state)
      stripeAccount: 'acct_us_example'
    },
    UK: {
      id: 'uk',
      name: 'United Kingdom',
      currency: 'GBP',
      symbol: '£',
      taxName: 'VAT',
      taxRate: 0.20, // 20% VAT
      stripeAccount: 'acct_uk_example'
    },
    CA: {
      id: 'ca',
      name: 'Canada',
      currency: 'CAD',
      symbol: 'C$',
      taxName: 'GST/HST',
      taxRate: 0.13, // 13% HST (varies by province)
      stripeAccount: 'acct_ca_example'
    },
    AU: {
      id: 'au',
      name: 'Australia',
      currency: 'AUD',
      symbol: 'A$',
      taxName: 'GST',
      taxRate: 0.10, // 10% GST
      stripeAccount: 'acct_au_example'
    },
    IN: {
      id: 'in',
      name: 'India',
      currency: 'INR',
      symbol: '₹',
      taxName: 'GST',
      taxRate: 0.18, // 18% GST
      stripeAccount: 'acct_in_example'
    },
    BR: {
      id: 'br',
      name: 'Brazil',
      currency: 'BRL',
      symbol: 'R$',
      taxName: 'Tax',
      taxRate: 0.15, // Simplified
      stripeAccount: 'acct_br_example'
    },
    JP: {
      id: 'jp',
      name: 'Japan',
      currency: 'JPY',
      symbol: '¥',
      taxName: 'Consumption Tax',
      taxRate: 0.10, // 10%
      stripeAccount: 'acct_jp_example'
    }
  };

  // Mock exchange rates (EUR base)
  const DEFAULT_EXCHANGE_RATES = {
    EUR: 1.0,
    USD: 1.10,
    GBP: 0.85,
    CAD: 1.45,
    AUD: 1.60,
    INR: 90.0,
    BRL: 5.50,
    JPY: 160.0
  };

  // Regional pricing adjustments (multipliers)
  const REGIONAL_PRICING = {
    eu: 1.0,     // Base price
    us: 1.0,     // Same as EU
    uk: 0.95,    // Slight discount
    ca: 1.05,    // Slight premium
    au: 1.10,    // Higher due to taxes/costs
    in: 0.70,    // Lower purchasing power parity
    br: 0.80,    // Lower purchasing power parity
    jp: 1.05     // Slight premium
  };

  // ===============================
  // Utility Functions
  // ===============================
  function log(...args) {
    console.log('[UBA Multi-Region]', ...args);
  }

  function warn(...args) {
    console.warn('[UBA Multi-Region]', ...args);
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

  // ===============================
  // Multi-Region Billing Engine
  // ===============================
  const MultiRegionEngine = {
    /**
     * Initialize multi-region billing
     */
    async init() {
      log('Initializing Multi-Region Billing');

      // Load or set default region config
      let config = getJSON(REGION_CONFIG_KEY);
      if (!config) {
        config = {
          currentRegion: 'eu',
          autoDetect: true,
          lastUpdated: new Date().toISOString()
        };
        setJSON(REGION_CONFIG_KEY, config);
      }

      // Load or set exchange rates
      let rates = getJSON(CURRENCY_RATES_KEY);
      if (!rates) {
        rates = {
          base: 'EUR',
          rates: DEFAULT_EXCHANGE_RATES,
          lastUpdated: new Date().toISOString()
        };
        setJSON(CURRENCY_RATES_KEY, rates);
      }

      log('Multi-Region Billing ready:', config.currentRegion);
      return Promise.resolve(config);
    },

    /**
     * Detect user's region based on browser/timezone
     */
    async detectRegion() {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language || navigator.userLanguage;

      log('Timezone:', timezone, 'Language:', language);

      // Simple region detection logic
      if (timezone.includes('America')) {
        if (timezone.includes('New_York') || timezone.includes('Chicago')) {
          return Promise.resolve('us');
        } else if (timezone.includes('Toronto')) {
          return Promise.resolve('ca');
        } else if (timezone.includes('Sao_Paulo')) {
          return Promise.resolve('br');
        }
        return Promise.resolve('us'); // Default to US for Americas
      } else if (timezone.includes('Europe')) {
        if (timezone.includes('London')) {
          return Promise.resolve('uk');
        }
        return Promise.resolve('eu'); // Default to EU for Europe
      } else if (timezone.includes('Asia')) {
        if (timezone.includes('Tokyo')) {
          return Promise.resolve('jp');
        } else if (timezone.includes('Kolkata') || timezone.includes('India')) {
          return Promise.resolve('in');
        }
        return Promise.resolve('eu'); // Default
      } else if (timezone.includes('Australia')) {
        return Promise.resolve('au');
      }

      return Promise.resolve('eu'); // Global default
    },

    /**
     * Get current region
     */
    async getCurrentRegion() {
      const config = getJSON(REGION_CONFIG_KEY, { currentRegion: 'eu' });
      return Promise.resolve(REGIONS[config.currentRegion] || REGIONS.eu);
    },

    /**
     * Set current region
     */
    async setRegion(regionId) {
      if (!REGIONS[regionId]) {
        return Promise.resolve({
          success: false,
          error: 'Invalid region'
        });
      }

      const config = getJSON(REGION_CONFIG_KEY, {});
      config.currentRegion = regionId;
      config.lastUpdated = new Date().toISOString();
      setJSON(REGION_CONFIG_KEY, config);

      log('Region set to:', regionId);
      return Promise.resolve({
        success: true,
        region: REGIONS[regionId]
      });
    },

    /**
     * Convert price from EUR to target currency
     */
    async convertPrice(amountEUR, targetCurrency) {
      const rates = getJSON(CURRENCY_RATES_KEY, { rates: DEFAULT_EXCHANGE_RATES });
      const rate = rates.rates[targetCurrency] || 1.0;
      const converted = amountEUR * rate;

      return Promise.resolve({
        original: amountEUR,
        converted: Math.round(converted * 100) / 100,
        currency: targetCurrency,
        rate: rate
      });
    },

    /**
     * Get regional price for a plan
     */
    async getRegionalPrice(basePriceEUR, regionId = null) {
      const region = regionId || (await this.getCurrentRegion()).id;
      const regionData = REGIONS[region];

      if (!regionData) {
        return Promise.resolve({
          basePrice: basePriceEUR,
          regionalPrice: basePriceEUR,
          currency: 'EUR',
          symbol: '€'
        });
      }

      // Apply regional pricing adjustment
      const adjustment = REGIONAL_PRICING[region] || 1.0;
      const adjustedPrice = basePriceEUR * adjustment;

      // Convert to regional currency
      const conversion = await this.convertPrice(adjustedPrice, regionData.currency);

      return Promise.resolve({
        basePrice: basePriceEUR,
        regionalPrice: conversion.converted,
        priceBeforeTax: conversion.converted,
        taxRate: regionData.taxRate,
        taxAmount: Math.round(conversion.converted * regionData.taxRate * 100) / 100,
        totalPrice: Math.round(conversion.converted * (1 + regionData.taxRate) * 100) / 100,
        currency: regionData.currency,
        symbol: regionData.symbol,
        taxName: regionData.taxName,
        region: regionData.name,
        exchangeRate: conversion.rate,
        regionalAdjustment: adjustment
      });
    },

    /**
     * Get all regional prices for a plan
     */
    async getAllRegionalPrices(basePriceEUR) {
      const prices = {};

      for (const [regionId, regionData] of Object.entries(REGIONS)) {
        prices[regionId] = await this.getRegionalPrice(basePriceEUR, regionId);
      }

      return Promise.resolve(prices);
    },

    /**
     * Calculate tax for a price
     */
    async calculateTax(amount, regionId = null) {
      const region = regionId || (await this.getCurrentRegion()).id;
      const regionData = REGIONS[region];

      if (!regionData) {
        return Promise.resolve({
          amount: amount,
          tax: 0,
          total: amount
        });
      }

      const taxAmount = Math.round(amount * regionData.taxRate * 100) / 100;
      const total = Math.round((amount + taxAmount) * 100) / 100;

      return Promise.resolve({
        amount: amount,
        taxRate: regionData.taxRate,
        taxName: regionData.taxName,
        tax: taxAmount,
        total: total,
        currency: regionData.currency,
        symbol: regionData.symbol
      });
    },

    /**
     * Format price in regional currency
     */
    async formatPrice(amount, regionId = null) {
      const region = regionId || (await this.getCurrentRegion()).id;
      const regionData = REGIONS[region];

      if (!regionData) {
        return Promise.resolve(`€${amount}`);
      }

      // Format based on currency
      let formatted;
      if (regionData.currency === 'JPY') {
        // JPY doesn't use decimals
        formatted = `${regionData.symbol}${Math.round(amount)}`;
      } else {
        formatted = `${regionData.symbol}${amount.toFixed(2)}`;
      }

      return Promise.resolve(formatted);
    },

    /**
     * Get all supported regions
     */
    async getAllRegions() {
      return Promise.resolve(Object.values(REGIONS));
    },

    /**
     * Get Stripe account for region
     */
    async getStripeAccountForRegion(regionId = null) {
      const region = regionId || (await this.getCurrentRegion()).id;
      const regionData = REGIONS[region];

      return Promise.resolve(regionData ? regionData.stripeAccount : null);
    },

    /**
     * Update exchange rates (in production, this would fetch from API)
     */
    async updateExchangeRates(newRates = null) {
      const rates = newRates || DEFAULT_EXCHANGE_RATES;

      const ratesData = {
        base: 'EUR',
        rates: rates,
        lastUpdated: new Date().toISOString()
      };

      setJSON(CURRENCY_RATES_KEY, ratesData);
      log('Exchange rates updated');

      return Promise.resolve(ratesData);
    },

    /**
     * Get current exchange rates
     */
    async getExchangeRates() {
      const rates = getJSON(CURRENCY_RATES_KEY, {
        base: 'EUR',
        rates: DEFAULT_EXCHANGE_RATES,
        lastUpdated: new Date().toISOString()
      });

      return Promise.resolve(rates);
    }
  };

  // ===============================
  // Expose API
  // ===============================
  if (!window.UBA) {
    window.UBA = {};
  }

  window.UBA.multiRegion = {
    // Core methods
    init: () => MultiRegionEngine.init(),
    detectRegion: () => MultiRegionEngine.detectRegion(),
    getCurrentRegion: () => MultiRegionEngine.getCurrentRegion(),
    setRegion: (regionId) => MultiRegionEngine.setRegion(regionId),

    // Pricing
    convertPrice: (amount, currency) => MultiRegionEngine.convertPrice(amount, currency),
    getRegionalPrice: (basePrice, regionId) => MultiRegionEngine.getRegionalPrice(basePrice, regionId),
    getAllRegionalPrices: (basePrice) => MultiRegionEngine.getAllRegionalPrices(basePrice),
    calculateTax: (amount, regionId) => MultiRegionEngine.calculateTax(amount, regionId),
    formatPrice: (amount, regionId) => MultiRegionEngine.formatPrice(amount, regionId),

    // Regions
    getAllRegions: () => MultiRegionEngine.getAllRegions(),
    getStripeAccountForRegion: (regionId) => MultiRegionEngine.getStripeAccountForRegion(regionId),

    // Exchange rates
    updateExchangeRates: (rates) => MultiRegionEngine.updateExchangeRates(rates),
    getExchangeRates: () => MultiRegionEngine.getExchangeRates(),

    // Constants
    REGIONS
  };

  // Auto-initialize
  document.addEventListener('DOMContentLoaded', () => {
    UBA.multiRegion.init();
  });

  log('Multi-Region Billing module loaded');
})();
