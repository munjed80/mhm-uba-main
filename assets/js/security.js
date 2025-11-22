/**
 * UBA Security Module
 * Provides XSS protection and safe DOM manipulation utilities
 * 
 * Week 5 MVP Implementation
 */

(function() {
  'use strict';

  const UBASecurity = {
    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} str - The string to escape
     * @returns {string} - The escaped string
     */
    escapeHTML(str) {
      if (str === null || str === undefined) return '';
      
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    },

    /**
     * Safely set text content on a DOM node
     * @param {HTMLElement} node - The DOM node
     * @param {string} text - The text to set
     */
    safeText(node, text) {
      if (!node) return;
      node.textContent = text || '';
    },

    /**
     * Safely set innerHTML with escaped content
     * Use only when you need HTML structure with user data
     * @param {HTMLElement} node - The DOM node
     * @param {string} html - The HTML string (will be escaped)
     */
    safeHTML(node, html) {
      if (!node) return;
      node.innerHTML = this.escapeHTML(html);
    },

    /**
     * Create a safe text node
     * @param {string} text - The text content
     * @returns {Text} - A text node
     */
    createTextNode(text) {
      return document.createTextNode(text || '');
    },

    /**
     * Sanitize URL to prevent javascript: and data: URIs
     * @param {string} url - The URL to sanitize
     * @returns {string} - Safe URL or empty string
     */
    sanitizeURL(url) {
      if (!url) return '';
      
      const str = String(url).trim().toLowerCase();
      
      // Block dangerous protocols
      if (str.startsWith('javascript:') || 
          str.startsWith('data:') || 
          str.startsWith('vbscript:')) {
        return '';
      }
      
      return url;
    },

    /**
     * Validate and sanitize email
     * @param {string} email - The email to validate
     * @returns {string} - Sanitized email or empty string
     */
    sanitizeEmail(email) {
      if (!email) return '';
      
      const sanitized = String(email).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      return emailRegex.test(sanitized) ? sanitized : '';
    },

    /**
     * Password strength validation
     * @param {string} password - The password to validate
     * @returns {object} - {valid: boolean, errors: string[]}
     */
    validatePassword(password) {
      const errors = [];
      
      if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      
      if (!/[a-zA-Z]/.test(password)) {
        errors.push('Password must contain at least one letter');
      }
      
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    },

    /**
     * Sanitize user input for storage
     * @param {string} input - User input
     * @returns {string} - Sanitized input
     */
    sanitizeInput(input) {
      if (!input) return '';
      
      // Trim whitespace
      let sanitized = String(input).trim();
      
      // Remove null bytes
      sanitized = sanitized.replace(/\0/g, '');
      
      // Limit length to prevent DoS
      if (sanitized.length > 10000) {
        sanitized = sanitized.substring(0, 10000);
      }
      
      return sanitized;
    },

    /**
     * Safe JSON parse with error handling
     * @param {string} jsonString - JSON string to parse
     * @param {*} defaultValue - Default value if parsing fails
     * @returns {*} - Parsed object or default value
     */
    safeJSONParse(jsonString, defaultValue = null) {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.error('JSON parse error:', e);
        return defaultValue;
      }
    },

    /**
     * Check if content contains potential XSS vectors
     * @param {string} content - Content to check
     * @returns {boolean} - True if suspicious content detected
     */
    containsXSS(content) {
      if (!content) return false;
      
      const str = String(content).toLowerCase();
      const xssPatterns = [
        '<script',
        'javascript:',
        'onerror=',
        'onload=',
        'onclick=',
        'onmouseover=',
        '<iframe',
        'eval(',
        'expression('
      ];
      
      return xssPatterns.some(pattern => str.includes(pattern));
    }
  };

  // Expose globally
  window.UBASecurity = UBASecurity;

  // Also create shorter aliases for convenience
  window.escapeHTML = UBASecurity.escapeHTML.bind(UBASecurity);
  window.safeText = UBASecurity.safeText.bind(UBASecurity);
  window.sanitizeInput = UBASecurity.sanitizeInput.bind(UBASecurity);

  console.log('✅ UBA Security Module loaded');
})();
