/**
 * MHM UBA - Supabase API Service Layer
 * 
 * Complete API wrapper for all UBA operations using Supabase backend
 * Provides authentication and CRUD operations for all entities
 * 
 * DEPENDENCIES:
 * - Supabase JS Client: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
 * - supabase-config.js: Configuration file with credentials
 * 
 * USAGE:
 * All functions are available via window.UbaAPI
 * Example: await window.UbaAPI.auth.login(email, password)
 */

(function() {
  'use strict';

  // =====================================================
  // INITIALIZE SUPABASE CLIENT
  // =====================================================
  
  let supabase = null;

  function initializeSupabase() {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      console.error('[UBA API] Supabase credentials not configured');
      console.error('[UBA API] Please configure supabase-config.js first');
      return null;
    }

    if (!window.supabase || !window.supabase.createClient) {
      console.error('[UBA API] Supabase client library not loaded');
      console.error('[UBA API] Include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
      return null;
    }

    try {
      const options = window.SUPABASE_OPTIONS || {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      };

      supabase = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY,
        options
      );

      console.log('[UBA API] ✅ Supabase client initialized successfully');
      return supabase;
    } catch (error) {
      console.error('[UBA API] Failed to initialize Supabase:', error);
      return null;
    }
  }

  // Initialize on load
  supabase = initializeSupabase();

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  /**
   * Get current user ID from session
   * @returns {string|null} User ID or null
   */
  async function getCurrentUserId() {
    if (!supabase) return null;
    
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  /**
   * Standard response format
   * @param {*} data - Response data
   * @param {*} error - Error object
   * @returns {Object}
   */
  function formatResponse(data, error) {
    if (error) {
      return { 
        success: false, 
        data: null, 
        error: error.message || error 
      };
    }
    return { 
      success: true, 
      data: data, 
      error: null 
    };
  }

  // =====================================================
  // AUTHENTICATION API
  // =====================================================

  const auth = {
    /**
     * Sign up a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {Object} metadata - Additional user metadata (optional)
     * @returns {Promise<Object>}
     */
    async signup(email, password, metadata = {}) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        });

        if (error) throw error;

        console.log('[Auth] User signed up:', data.user?.email);
        return formatResponse({
          user: data.user,
          session: data.session
        }, null);
      } catch (error) {
        console.error('[Auth] Signup error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Sign in existing user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>}
     */
    async login(email, password) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        console.log('[Auth] User logged in:', data.user?.email);
        return formatResponse({
          user: data.user,
          session: data.session
        }, null);
      } catch (error) {
        console.error('[Auth] Login error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Sign out current user
     * @returns {Promise<Object>}
     */
    async logout() {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;

        console.log('[Auth] User logged out');
        return formatResponse({ message: 'Logged out successfully' }, null);
      } catch (error) {
        console.error('[Auth] Logout error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Get current authenticated user
     * @returns {Promise<Object>}
     */
    async getCurrentUser() {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;

        return formatResponse(user, null);
      } catch (error) {
        console.error('[Auth] Get user error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Get current session
     * @returns {Promise<Object>}
     */
    async getSession() {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        return formatResponse(session, null);
      } catch (error) {
        console.error('[Auth] Get session error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Reset password
     * @param {string} email - User email
     * @returns {Promise<Object>}
     */
    async resetPassword(email) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        
        if (error) throw error;

        return formatResponse({ message: 'Password reset email sent' }, null);
      } catch (error) {
        console.error('[Auth] Reset password error:', error);
        return formatResponse(null, error);
      }
    }
  };

  // =====================================================
  // CLIENTS API
  // =====================================================

  const clients = {
    /**
     * Get all clients for current user
     * @returns {Promise<Object>}
     */
    async getClients() {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return formatResponse(data, null);
      } catch (error) {
        console.error('[Clients] Get error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Get single client by ID
     * @param {string} id - Client ID
     * @returns {Promise<Object>}
     */
    async getClient(id) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return formatResponse(data, null);
      } catch (error) {
        console.error('[Clients] Get one error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Add new client
     * @param {Object} clientData - Client information
     * @returns {Promise<Object>}
     */
    async addClient(clientData) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('clients')
          .insert([{
            user_id: userId,
            ...clientData
          }])
          .select()
          .single();

        if (error) throw error;

        console.log('[Clients] Added:', data.name);
        return formatResponse(data, null);
      } catch (error) {
        console.error('[Clients] Add error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Update existing client
     * @param {string} id - Client ID
     * @param {Object} updates - Updated fields
     * @returns {Promise<Object>}
     */
    async updateClient(id, updates) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        console.log('[Clients] Updated:', data.name);
        return formatResponse(data, null);
      } catch (error) {
        console.error('[Clients] Update error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Delete client
     * @param {string} id - Client ID
     * @returns {Promise<Object>}
     */
    async deleteClient(id) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

        if (error) throw error;

        console.log('[Clients] Deleted:', id);
        return formatResponse({ message: 'Client deleted' }, null);
      } catch (error) {
        console.error('[Clients] Delete error:', error);
        return formatResponse(null, error);
      }
    }
  };

  // =====================================================
  // PROJECTS API
  // =====================================================

  const projects = {
    /**
     * Get all projects for current user
     * @returns {Promise<Object>}
     */
    async getProjects() {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            client:clients(id, name, email, company)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return formatResponse(data, null);
      } catch (error) {
        console.error('[Projects] Get error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Get single project by ID
     * @param {string} id - Project ID
     * @returns {Promise<Object>}
     */
    async getProject(id) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            client:clients(id, name, email, company)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        return formatResponse(data, null);
      } catch (error) {
        console.error('[Projects] Get one error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Add new project
     * @param {Object} projectData - Project information
     * @returns {Promise<Object>}
     */
    async addProject(projectData) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('projects')
          .insert([{
            user_id: userId,
            ...projectData
          }])
          .select()
          .single();

        if (error) throw error;

        console.log('[Projects] Added:', data.title);
        return formatResponse(data, null);
      } catch (error) {
        console.error('[Projects] Add error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Update existing project
     * @param {string} id - Project ID
     * @param {Object} updates - Updated fields
     * @returns {Promise<Object>}
     */
    async updateProject(id, updates) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        console.log('[Projects] Updated:', data.title);
        return formatResponse(data, null);
      } catch (error) {
        console.error('[Projects] Update error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Delete project
     * @param {string} id - Project ID
     * @returns {Promise<Object>}
     */
    async deleteProject(id) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) throw error;

        console.log('[Projects] Deleted:', id);
        return formatResponse({ message: 'Project deleted' }, null);
      } catch (error) {
        console.error('[Projects] Delete error:', error);
        return formatResponse(null, error);
      }
    }
  };

  // =====================================================
  // TASKS API
  // =====================================================

  const tasks = {
    /**
     * Get all tasks for current user
     * @returns {Promise<Object>}
     */
    async getTasks() {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects(id, title, client_id)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return formatResponse(data, null);
      } catch (error) {
        console.error('[Tasks] Get error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Get single task by ID
     * @param {string} id - Task ID
     * @returns {Promise<Object>}
     */
    async getTask(id) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects(id, title, client_id)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        return formatResponse(data, null);
      } catch (error) {
        console.error('[Tasks] Get one error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Add new task
     * @param {Object} taskData - Task information
     * @returns {Promise<Object>}
     */
    async addTask(taskData) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            user_id: userId,
            ...taskData
          }])
          .select()
          .single();

        if (error) throw error;

        console.log('[Tasks] Added:', data.title);
        return formatResponse(data, null);
      } catch (error) {
        console.error('[Tasks] Add error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Update existing task
     * @param {string} id - Task ID
     * @param {Object} updates - Updated fields
     * @returns {Promise<Object>}
     */
    async updateTask(id, updates) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        console.log('[Tasks] Updated:', data.title);
        return formatResponse(data, null);
      } catch (error) {
        console.error('[Tasks] Update error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Delete task
     * @param {string} id - Task ID
     * @returns {Promise<Object>}
     */
    async deleteTask(id) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);

        if (error) throw error;

        console.log('[Tasks] Deleted:', id);
        return formatResponse({ message: 'Task deleted' }, null);
      } catch (error) {
        console.error('[Tasks] Delete error:', error);
        return formatResponse(null, error);
      }
    }
  };

  // =====================================================
  // INVOICES API
  // =====================================================

  const invoices = {
    /**
     * Get all invoices for current user
     * @returns {Promise<Object>}
     */
    async getInvoices() {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(id, name, email, company)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return formatResponse(data, null);
      } catch (error) {
        console.error('[Invoices] Get error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Get single invoice by ID
     * @param {string} id - Invoice ID
     * @returns {Promise<Object>}
     */
    async getInvoice(id) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(id, name, email, company)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        return formatResponse(data, null);
      } catch (error) {
        console.error('[Invoices] Get one error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Add new invoice
     * @param {Object} invoiceData - Invoice information
     * @returns {Promise<Object>}
     */
    async addInvoice(invoiceData) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('invoices')
          .insert([{
            user_id: userId,
            ...invoiceData
          }])
          .select()
          .single();

        if (error) throw error;

        console.log('[Invoices] Added:', data.invoice_number);
        return formatResponse(data, null);
      } catch (error) {
        console.error('[Invoices] Add error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Update existing invoice
     * @param {string} id - Invoice ID
     * @param {Object} updates - Updated fields
     * @returns {Promise<Object>}
     */
    async updateInvoice(id, updates) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { data, error } = await supabase
          .from('invoices')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        console.log('[Invoices] Updated:', data.invoice_number);
        return formatResponse(data, null);
      } catch (error) {
        console.error('[Invoices] Update error:', error);
        return formatResponse(null, error);
      }
    },

    /**
     * Delete invoice
     * @param {string} id - Invoice ID
     * @returns {Promise<Object>}
     */
    async deleteInvoice(id) {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', id);

        if (error) throw error;

        console.log('[Invoices] Deleted:', id);
        return formatResponse({ message: 'Invoice deleted' }, null);
      } catch (error) {
        console.error('[Invoices] Delete error:', error);
        return formatResponse(null, error);
      }
    }
  };

  // =====================================================
  // DASHBOARD API
  // =====================================================

  const dashboard = {
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
      if (!supabase) {
        return formatResponse(null, 'Supabase not initialized');
      }

      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Use the database function for better performance
        const { data, error } = await supabase
          .rpc('get_dashboard_stats', { p_user_id: userId });

        if (error) throw error;

        return formatResponse(data, null);
      } catch (error) {
        // Fallback to individual queries if function fails
        console.warn('[Dashboard] RPC failed, using fallback method');
        
        try {
          const [clientsRes, projectsRes, invoicesRes, tasksRes] = await Promise.all([
            supabase.from('clients').select('id', { count: 'exact', head: true }),
            supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
            supabase.from('invoices').select('amount').eq('status', 'paid'),
            supabase.from('tasks').select('id, status', { count: 'exact' })
          ]);

          const totalRevenue = invoicesRes.data?.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0) || 0;
          const completedTasks = tasksRes.data?.filter(t => t.status === 'done').length || 0;

          const stats = {
            total_clients: clientsRes.count || 0,
            active_projects: projectsRes.count || 0,
            total_revenue: totalRevenue,
            pending_invoices: 0, // Would need another query
            total_tasks: tasksRes.count || 0,
            completed_tasks: completedTasks
          };

          return formatResponse(stats, null);
        } catch (fallbackError) {
          console.error('[Dashboard] Stats error:', fallbackError);
          return formatResponse(null, fallbackError);
        }
      }
    }
  };

  // =====================================================
  // EXPORT API
  // =====================================================

  window.UbaAPI = {
    auth,
    clients,
    projects,
    tasks,
    invoices,
    dashboard,
    
    // Utility functions
    getSupabaseClient: () => supabase,
    reinitialize: initializeSupabase,
    isReady: () => !!supabase
  };

  // Log API ready status
  if (supabase) {
    console.log('[UBA API] ✅ API initialized and ready to use');
    console.log('[UBA API] Available via window.UbaAPI');
  } else {
    console.warn('[UBA API] ⚠️ API not ready - Supabase not configured');
  }

})();
