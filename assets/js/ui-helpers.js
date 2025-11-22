/**
 * UBA UI Helpers Module
 * Provides loading states, notifications, and UI utilities
 * 
 * Week 5 MVP Implementation
 */

(function() {
  'use strict';

  // Notification System
  const UBANotifications = {
    /**
     * Show success notification
     * @param {string} message - Success message
     * @param {number} duration - Duration in ms (default: 3000)
     */
    success(message, duration = 3000) {
      this.show(message, 'success', duration);
    },

    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {number} duration - Duration in ms (default: 5000)
     */
    error(message, duration = 5000) {
      this.show(message, 'error', duration);
    },

    /**
     * Show info notification
     * @param {string} message - Info message
     * @param {number} duration - Duration in ms (default: 3000)
     */
    info(message, duration = 3000) {
      this.show(message, 'info', duration);
    },

    /**
     * Show warning notification
     * @param {string} message - Warning message
     * @param {number} duration - Duration in ms (default: 4000)
     */
    warning(message, duration = 4000) {
      this.show(message, 'warning', duration);
    },

    /**
     * Show notification
     * @param {string} message - Message to display
     * @param {string} type - Type: success, error, info, warning
     * @param {number} duration - Duration in ms
     */
    show(message, type = 'info', duration = 3000) {
      // Ensure container exists
      let container = document.getElementById('uba-notifications-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'uba-notifications-container';
        container.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 400px;
        `;
        document.body.appendChild(container);
      }

      // Create notification element
      const notification = document.createElement('div');
      notification.className = `uba-notification uba-notification-${type}`;
      notification.style.cssText = `
        background: ${this.getBackgroundColor(type)};
        color: white;
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: slideIn 0.3s ease-out;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      // Use safe text content
      const messageSpan = document.createElement('span');
      messageSpan.textContent = message;
      notification.appendChild(messageSpan);

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 15px;
        padding: 0;
        line-height: 1;
      `;
      closeBtn.onclick = () => this.remove(notification);
      notification.appendChild(closeBtn);

      container.appendChild(notification);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => this.remove(notification), duration);
      }

      return notification;
    },

    /**
     * Remove notification
     * @param {HTMLElement} notification - Notification element to remove
     */
    remove(notification) {
      if (notification && notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    },

    /**
     * Get background color for notification type
     * @param {string} type - Notification type
     * @returns {string} - CSS color
     */
    getBackgroundColor(type) {
      const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };
      return colors[type] || colors.info;
    }
  };

  // Loading State Manager
  const UBALoading = {
    activeLoaders: new Set(),

    /**
     * Show loading state on a container
     * @param {string} containerId - Container element ID
     * @param {string} message - Loading message
     */
    show(containerId, message = 'Loading...') {
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`Container not found: ${containerId}`);
        return;
      }

      // Don't add multiple loaders to same container
      if (this.activeLoaders.has(containerId)) {
        return;
      }

      this.activeLoaders.add(containerId);

      const loader = document.createElement('div');
      loader.className = 'uba-loading-overlay';
      loader.setAttribute('data-loader-for', containerId);
      loader.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        text-align: center;
        color: #6b7280;
      `;

      const spinner = document.createElement('div');
      spinner.className = 'uba-spinner';
      spinner.style.cssText = `
        border: 3px solid #f3f4f6;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 12px;
      `;

      const text = document.createElement('div');
      text.textContent = message;
      text.style.cssText = `
        font-size: 14px;
        font-weight: 500;
      `;

      content.appendChild(spinner);
      content.appendChild(text);
      loader.appendChild(content);

      // Ensure container is positioned
      const position = window.getComputedStyle(container).position;
      if (position === 'static') {
        container.style.position = 'relative';
      }

      container.appendChild(loader);
    },

    /**
     * Hide loading state from container
     * @param {string} containerId - Container element ID
     */
    hide(containerId) {
      this.activeLoaders.delete(containerId);
      
      const loaders = document.querySelectorAll(`[data-loader-for="${containerId}"]`);
      loaders.forEach(loader => {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      });
    },

    /**
     * Check if container is loading
     * @param {string} containerId - Container element ID
     * @returns {boolean} - True if loading
     */
    isLoading(containerId) {
      return this.activeLoaders.has(containerId);
    }
  };

  // Form Helpers
  const UBAFormHelpers = {
    /**
     * Show inline validation error
     * @param {string} fieldId - Field element ID
     * @param {string} message - Error message
     */
    showFieldError(fieldId, message) {
      const field = document.getElementById(fieldId);
      if (!field) return;

      // Remove existing error
      this.clearFieldError(fieldId);

      // Add error class
      field.classList.add('uba-field-error');

      // Create error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'uba-field-error-message';
      errorDiv.setAttribute('data-error-for', fieldId);
      errorDiv.style.cssText = `
        color: #ef4444;
        font-size: 12px;
        margin-top: 4px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      errorDiv.textContent = message;

      // Insert after field
      field.parentNode.insertBefore(errorDiv, field.nextSibling);
    },

    /**
     * Clear field error
     * @param {string} fieldId - Field element ID
     */
    clearFieldError(fieldId) {
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.remove('uba-field-error');
      }

      const errorMsg = document.querySelector(`[data-error-for="${fieldId}"]`);
      if (errorMsg && errorMsg.parentNode) {
        errorMsg.parentNode.removeChild(errorMsg);
      }
    },

    /**
     * Clear all form errors
     * @param {string} formId - Form element ID
     */
    clearFormErrors(formId) {
      const form = document.getElementById(formId);
      if (!form) return;

      form.querySelectorAll('.uba-field-error').forEach(field => {
        field.classList.remove('uba-field-error');
      });

      form.querySelectorAll('.uba-field-error-message').forEach(msg => {
        if (msg.parentNode) {
          msg.parentNode.removeChild(msg);
        }
      });
    }
  };

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .uba-field-error {
      border-color: #ef4444 !important;
    }
  `;
  document.head.appendChild(style);

  // Expose globally
  window.UBANotifications = UBANotifications;
  window.UBALoading = UBALoading;
  window.UBAFormHelpers = UBAFormHelpers;

  // Shorter aliases
  window.notifySuccess = UBANotifications.success.bind(UBANotifications);
  window.notifyError = UBANotifications.error.bind(UBANotifications);
  window.notifyInfo = UBANotifications.info.bind(UBANotifications);
  window.notifyWarning = UBANotifications.warning.bind(UBANotifications);
  window.showLoading = UBALoading.show.bind(UBALoading);
  window.hideLoading = UBALoading.hide.bind(UBALoading);

  console.log('✅ UBA UI Helpers Module loaded');
})();
