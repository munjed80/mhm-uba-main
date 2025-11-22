/**
 * MHM UBA - Supabase API Service Layer
 * 
 * This file provides a wrapper around the Supabase client for the MHM UBA application.
 * It handles authentication and CRUD operations for all entities.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Install Supabase client: Add this to your HTML before this file:
 *    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * 
 * 2. Configure environment variables in index.html or create a config.js:
 *    const SUPABASE_URL = 'your-project-url.supabase.co';
 *    const SUPABASE_ANON_KEY = 'your-anon-key';
 */

(function() {
  'use strict';

  // =====================================================
  // CONFIGURATION
  // =====================================================
  // These will be set from environment or config file
  const SUPABASE_URL = window.SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

  // Initialize Supabase client
  let supabase = null;

  // =====================================================
  // INITIALIZE SUPABASE
  // =====================================================
  function initSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
      return null;
    }

    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('[API Service] Supabase initialized successfully');
      return supabase;
    } else {
      console.error('Supabase library not loaded. Please include the Supabase CDN script.');
      return null;
    }
  }

  // =====================================================
  // AUTHENTICATION METHODS
  // =====================================================
  const auth = {
    /**
     * Sign up a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {Object} metadata - Additional user data (e.g., {name: 'John Doe'})
     * @returns {Promise<Object>} User data or error
     */
    async signup(email, password, metadata = {}) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        });

        if (error) throw error;
        
        console.log('[Auth] User signed up successfully:', data.user?.email);
        return { success: true, user: data.user, session: data.session };
      } catch (error) {
        console.error('[Auth] Signup error:', error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Sign in an existing user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data or error
     */
    async login(email, password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        
        console.log('[Auth] User logged in successfully:', data.user?.email);
        return { success: true, user: data.user, session: data.session };
      } catch (error) {
        console.error('[Auth] Login error:', error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Sign out the current user
     * @returns {Promise<Object>} Success or error
     */
    async logout() {
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        console.log('[Auth] User logged out successfully');
        return { success: true };
      } catch (error) {
        console.error('[Auth] Logout error:', error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get the current user
     * @returns {Promise<Object>} Current user or null
     */
    async getCurrentUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        return user;
      } catch (error) {
        console.error('[Auth] Get current user error:', error.message);
        return null;
      }
    },

    /**
     * Get the current session
     * @returns {Promise<Object>} Current session or null
     */
    async getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        return session;
      } catch (error) {
        console.error('[Auth] Get session error:', error.message);
        return null;
      }
    },

    /**
     * Reset password (send reset email)
     * @param {string} email - User email
     * @returns {Promise<Object>} Success or error
     */
    async resetPassword(email) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        
        if (error) throw error;
        
        console.log('[Auth] Password reset email sent');
        return { success: true };
      } catch (error) {
        console.error('[Auth] Password reset error:', error.message);
        return { success: false, error: error.message };
      }
    }
  };

  // =====================================================
  // CLIENTS CRUD
  // =====================================================
  const clients = {
    /**
     * Get all clients for the current user
     * @returns {Promise<Array>} List of clients
     */
    async getAll() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('[Clients] Get all error:', error.message);
        throw error;
      }
    },

    /**
     * Get a single client by ID
     * @param {string} id - Client ID
     * @returns {Promise<Object>} Client data
     */
    async getById(id) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('[Clients] Get by ID error:', error.message);
        throw error;
      }
    },

    /**
     * Create a new client
     * @param {Object} clientData - Client information
     * @returns {Promise<Object>} Created client
     */
    async create(clientData) {
      try {
        // Get current user to set user_id
        const user = await auth.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('clients')
          .insert([{ ...clientData, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        
        console.log('[Clients] Created:', data.id);
        return data;
      } catch (error) {
        console.error('[Clients] Create error:', error.message);
        throw error;
      }
    },

    /**
     * Update an existing client
     * @param {string} id - Client ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated client
     */
    async update(id, updates) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        console.log('[Clients] Updated:', id);
        return data;
      } catch (error) {
        console.error('[Clients] Update error:', error.message);
        throw error;
      }
    },

    /**
     * Delete a client
     * @param {string} id - Client ID
     * @returns {Promise<boolean>} Success
     */
    async delete(id) {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        console.log('[Clients] Deleted:', id);
        return true;
      } catch (error) {
        console.error('[Clients] Delete error:', error.message);
        throw error;
      }
    }
  };

  // =====================================================
  // PROJECTS CRUD
  // =====================================================
  const projects = {
    /**
     * Get all projects for the current user
     * @returns {Promise<Array>} List of projects with client info
     */
    async getAll() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, clients(name, company)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('[Projects] Get all error:', error.message);
        throw error;
      }
    },

    /**
     * Get a single project by ID
     * @param {string} id - Project ID
     * @returns {Promise<Object>} Project data
     */
    async getById(id) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, clients(name, company)')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('[Projects] Get by ID error:', error.message);
        throw error;
      }
    },

    /**
     * Create a new project
     * @param {Object} projectData - Project information
     * @returns {Promise<Object>} Created project
     */
    async create(projectData) {
      try {
        const user = await auth.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('projects')
          .insert([{ ...projectData, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        
        console.log('[Projects] Created:', data.id);
        return data;
      } catch (error) {
        console.error('[Projects] Create error:', error.message);
        throw error;
      }
    },

    /**
     * Update an existing project
     * @param {string} id - Project ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated project
     */
    async update(id, updates) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        console.log('[Projects] Updated:', id);
        return data;
      } catch (error) {
        console.error('[Projects] Update error:', error.message);
        throw error;
      }
    },

    /**
     * Delete a project
     * @param {string} id - Project ID
     * @returns {Promise<boolean>} Success
     */
    async delete(id) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        console.log('[Projects] Deleted:', id);
        return true;
      } catch (error) {
        console.error('[Projects] Delete error:', error.message);
        throw error;
      }
    }
  };

  // =====================================================
  // TASKS CRUD
  // =====================================================
  const tasks = {
    /**
     * Get all tasks for the current user
     * @returns {Promise<Array>} List of tasks with project info
     */
    async getAll() {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*, projects(title)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('[Tasks] Get all error:', error.message);
        throw error;
      }
    },

    /**
     * Get a single task by ID
     * @param {string} id - Task ID
     * @returns {Promise<Object>} Task data
     */
    async getById(id) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*, projects(title)')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('[Tasks] Get by ID error:', error.message);
        throw error;
      }
    },

    /**
     * Create a new task
     * @param {Object} taskData - Task information
     * @returns {Promise<Object>} Created task
     */
    async create(taskData) {
      try {
        const user = await auth.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('tasks')
          .insert([{ ...taskData, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        
        console.log('[Tasks] Created:', data.id);
        return data;
      } catch (error) {
        console.error('[Tasks] Create error:', error.message);
        throw error;
      }
    },

    /**
     * Update an existing task
     * @param {string} id - Task ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated task
     */
    async update(id, updates) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        console.log('[Tasks] Updated:', id);
        return data;
      } catch (error) {
        console.error('[Tasks] Update error:', error.message);
        throw error;
      }
    },

    /**
     * Delete a task
     * @param {string} id - Task ID
     * @returns {Promise<boolean>} Success
     */
    async delete(id) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        console.log('[Tasks] Deleted:', id);
        return true;
      } catch (error) {
        console.error('[Tasks] Delete error:', error.message);
        throw error;
      }
    }
  };

  // =====================================================
  // INVOICES CRUD
  // =====================================================
  const invoices = {
    /**
     * Get all invoices for the current user
     * @returns {Promise<Array>} List of invoices with client info
     */
    async getAll() {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*, clients(name, company)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('[Invoices] Get all error:', error.message);
        throw error;
      }
    },

    /**
     * Get a single invoice by ID
     * @param {string} id - Invoice ID
     * @returns {Promise<Object>} Invoice data
     */
    async getById(id) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*, clients(name, company)')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('[Invoices] Get by ID error:', error.message);
        throw error;
      }
    },

    /**
     * Create a new invoice
     * @param {Object} invoiceData - Invoice information
     * @returns {Promise<Object>} Created invoice
     */
    async create(invoiceData) {
      try {
        const user = await auth.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('invoices')
          .insert([{ ...invoiceData, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        
        console.log('[Invoices] Created:', data.id);
        return data;
      } catch (error) {
        console.error('[Invoices] Create error:', error.message);
        throw error;
      }
    },

    /**
     * Update an existing invoice
     * @param {string} id - Invoice ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated invoice
     */
    async update(id, updates) {
      try {
        const { data, error} = await supabase
          .from('invoices')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        console.log('[Invoices] Updated:', id);
        return data;
      } catch (error) {
        console.error('[Invoices] Update error:', error.message);
        throw error;
      }
    },

    /**
     * Delete an invoice
     * @param {string} id - Invoice ID
     * @returns {Promise<boolean>} Success
     */
    async delete(id) {
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        console.log('[Invoices] Deleted:', id);
        return true;
      } catch (error) {
        console.error('[Invoices] Delete error:', error.message);
        throw error;
      }
    }
  };

  // =====================================================
  // DASHBOARD STATS
  // =====================================================
  const dashboard = {
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} Dashboard stats
     */
    async getStats() {
      try {
        // Fetch all data in parallel
        const [clientsData, projectsData, tasksData, invoicesData] = await Promise.all([
          clients.getAll(),
          projects.getAll(),
          tasks.getAll(),
          invoices.getAll()
        ]);

        // Calculate stats
        const totalClients = clientsData.length;
        const totalProjects = projectsData.length;
        const activeProjects = projectsData.filter(p => p.status === 'active').length;
        const activeTasks = tasksData.filter(t => t.status !== 'done').length;
        const totalTasks = tasksData.length;
        
        // Calculate revenue
        const totalRevenue = invoicesData
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
        
        const pendingRevenue = invoicesData
          .filter(inv => inv.status === 'sent')
          .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

        return {
          totalClients,
          totalProjects,
          activeProjects,
          totalTasks,
          activeTasks,
          totalRevenue,
          pendingRevenue,
          recentClients: clientsData.slice(0, 5),
          recentProjects: projectsData.slice(0, 5),
          recentTasks: tasksData.slice(0, 5),
          recentInvoices: invoicesData.slice(0, 5)
        };
      } catch (error) {
        console.error('[Dashboard] Get stats error:', error.message);
        throw error;
      }
    }
  };

  // =====================================================
  // EXPORT API
  // =====================================================
  // Initialize Supabase on load
  initSupabase();

  // Expose API to window
  window.UBAApi = {
    auth,
    clients,
    projects,
    tasks,
    invoices,
    dashboard,
    supabase // Expose raw supabase client for advanced use
  };

  console.log('[API Service] UBA API initialized. Available at window.UBAApi');
})();
