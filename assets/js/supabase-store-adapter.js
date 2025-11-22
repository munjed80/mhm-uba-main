/**
 * Supabase Store Adapter
 * 
 * This file provides a compatibility layer between the existing UBA Store interface
 * and the new Supabase backend. It allows existing UI code to work with minimal changes.
 * 
 * Usage:
 * Instead of: const clients = store.clients.getAll();
 * Use: const clients = await SupabaseStore.clients.getAll();
 */

(function() {
  'use strict';

  // Production mode detection
  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' &&
                       !window.location.hostname.includes('192.168');

  // Disable console logs in production (except errors/warnings)
  if (isProduction) {
    const originalLog = console.log;
    console.log = function(...args) {
      // Only log in development or when explicitly enabled
      if (window.UBA_DEBUG_MODE) {
        originalLog.apply(console, args);
      }
    };
  }

  // Check if Supabase API service is available
  if (!window.UBAApi) {
    console.error('[SupabaseStoreAdapter] UBAApi not found. Please load supabase-api-service.js first.');
    return;
  }

  const api = window.UBAApi;

  // Helper: Show loading indicator
  function showLoading(message = 'Loading...') {
    // Use UI helpers if available (Week 5)
    if (window.UBALoading && window.UBALoading.show) {
      // Loading will be shown per-container by calling code
      console.log(`[Loading] ${message}`);
    } else {
      console.log(`[Loading] ${message}`);
    }
  }

  // Helper: Hide loading indicator
  function hideLoading() {
    if (window.UBALoading && window.UBALoading.hide) {
      // Loading will be hidden per-container by calling code
      console.log('[Loading] Complete');
    } else {
      console.log('[Loading] Complete');
    }
  }

  // Helper: Show error message
  function showError(message) {
    // Use notifications if available (Week 5)
    if (window.notifyError) {
      window.notifyError(message, 5000);
    } else {
      alert(`Error: ${message}`);
    }
    console.error('[Error]', message);
  }

  // Helper: Show success message
  function showSuccess(message) {
    // Use notifications if available (Week 5)
    if (window.notifySuccess) {
      window.notifySuccess(message, 3000);
    }
    console.log('[Success]', message);
  }

  // =====================================================
  // CLIENTS ADAPTER
  // =====================================================
  const clients = {
    async getAll() {
      try {
        showLoading('Loading clients...');
        const result = await api.clients.getAll();
        hideLoading();
        return result || [];
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to load clients');
        return [];
      }
    },

    async get(id) {
      try {
        const result = await api.clients.getById(id);
        return result;
      } catch (error) {
        showError(error.message || 'Failed to load client');
        return null;
      }
    },

    async create(payload) {
      try {
        showLoading('Creating client...');
        const result = await api.clients.create(payload);
        hideLoading();
        return result;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to create client');
        throw error;
      }
    },

    async update(id, patch) {
      try {
        showLoading('Updating client...');
        const result = await api.clients.update(id, patch);
        hideLoading();
        return result;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to update client');
        throw error;
      }
    },

    async delete(id) {
      try {
        showLoading('Deleting client...');
        await api.clients.delete(id);
        hideLoading();
        return true;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to delete client');
        throw error;
      }
    }
  };

  // =====================================================
  // PROJECTS ADAPTER
  // =====================================================
  const projects = {
    async getAll() {
      try {
        showLoading('Loading projects...');
        const result = await api.projects.getAll();
        hideLoading();
        return result || [];
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to load projects');
        return [];
      }
    },

    async get(id) {
      try {
        const result = await api.projects.getById(id);
        return result;
      } catch (error) {
        showError(error.message || 'Failed to load project');
        return null;
      }
    },

    async create(payload) {
      try {
        showLoading('Creating project...');
        const result = await api.projects.create(payload);
        hideLoading();
        return result;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to create project');
        throw error;
      }
    },

    async update(id, patch) {
      try {
        showLoading('Updating project...');
        const result = await api.projects.update(id, patch);
        hideLoading();
        return result;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to update project');
        throw error;
      }
    },

    async delete(id) {
      try {
        showLoading('Deleting project...');
        await api.projects.delete(id);
        hideLoading();
        return true;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to delete project');
        throw error;
      }
    }
  };

  // =====================================================
  // TASKS ADAPTER
  // =====================================================
  const tasks = {
    async getAll() {
      try {
        showLoading('Loading tasks...');
        const result = await api.tasks.getAll();
        hideLoading();
        return result || [];
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to load tasks');
        return [];
      }
    },

    async get(id) {
      try {
        const result = await api.tasks.getById(id);
        return result;
      } catch (error) {
        showError(error.message || 'Failed to load task');
        return null;
      }
    },

    // Alias for backward compatibility
    async getById(id) {
      return this.get(id);
    },

    async create(payload) {
      try {
        showLoading('Creating task...');
        const result = await api.tasks.create(payload);
        hideLoading();
        return result;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to create task');
        throw error;
      }
    },

    async update(id, patch) {
      try {
        showLoading('Updating task...');
        const result = await api.tasks.update(id, patch);
        hideLoading();
        return result;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to update task');
        throw error;
      }
    },

    async delete(id) {
      try {
        showLoading('Deleting task...');
        await api.tasks.delete(id);
        hideLoading();
        return true;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to delete task');
        throw error;
      }
    }
  };

  // =====================================================
  // INVOICES ADAPTER
  // =====================================================
  const invoices = {
    async getAll() {
      try {
        showLoading('Loading invoices...');
        const result = await api.invoices.getAll();
        hideLoading();
        return result || [];
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to load invoices');
        return [];
      }
    },

    async get(id) {
      try {
        const result = await api.invoices.getById(id);
        return result;
      } catch (error) {
        showError(error.message || 'Failed to load invoice');
        return null;
      }
    },

    async create(payload) {
      try {
        showLoading('Creating invoice...');
        const result = await api.invoices.create(payload);
        hideLoading();
        return result;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to create invoice');
        throw error;
      }
    },

    async update(id, patch) {
      try {
        showLoading('Updating invoice...');
        const result = await api.invoices.update(id, patch);
        hideLoading();
        return result;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to update invoice');
        throw error;
      }
    },

    async delete(id) {
      try {
        showLoading('Deleting invoice...');
        await api.invoices.delete(id);
        hideLoading();
        return true;
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to delete invoice');
        throw error;
      }
    }
  };

  // =====================================================
  // DASHBOARD STATS ADAPTER
  // =====================================================
  const dashboard = {
    async getStats() {
      try {
        showLoading('Loading dashboard stats...');
        const result = await api.dashboard.getStats();
        hideLoading();
        return result || {
          totalClients: 0,
          totalProjects: 0,
          totalTasks: 0,
          overdueTasks: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          unpaidInvoices: 0,
          totalRevenue: 0,
          recentClients: [],
          recentProjects: [],
          recentTasks: [],
          recentInvoices: []
        };
      } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to load dashboard stats');
        return {
          totalClients: 0,
          totalProjects: 0,
          totalTasks: 0,
          overdueTasks: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          unpaidInvoices: 0,
          totalRevenue: 0,
          recentClients: [],
          recentProjects: [],
          recentTasks: [],
          recentInvoices: []
        };
      }
    }
  };

  // =====================================================
  // EXPORT AS GLOBAL
  // =====================================================
  window.SupabaseStore = {
    clients,
    projects,
    tasks,
    invoices,
    dashboard
  };

  console.log('[SupabaseStoreAdapter] Initialized successfully');

})();
