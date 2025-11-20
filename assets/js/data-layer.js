// data-layer.js — SaaS-ready data abstraction layer for MHM UBA
// Provides unified API for local and future remote data access
(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    storageMode: 'local', // 'local' or 'remote'
    apiBaseUrl: '', // For future remote mode
    debugMode: true
  };

  // Entity types managed by the system
  const ENTITY_TYPES = [
    'clients',
    'projects',
    'tasks',
    'invoices',
    'leads',
    'expenses',
    'files',
    'automations',
    'automationLogs',
    'reports',
    'settings'
  ];

  // Session management
  const SESSION_KEY = 'uba-session-v2';
  const USERS_KEY = 'uba-users';
  const WORKSPACES_KEY = 'uba-workspaces';
  const MIGRATION_FLAG = 'uba-data-layer-migrated';

  // Utilities
  function generateId(prefix = 'id') {
    if (window.crypto && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function log(...args) {
    if (CONFIG.debugMode) {
      console.log('[UBA Data Layer]', ...args);
    }
  }

  function warn(...args) {
    console.warn('[UBA Data Layer]', ...args);
  }

  // LocalStorage helpers
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
  // Session Management
  // ===============================
  const Session = {
    get() {
      const session = getJSON(SESSION_KEY, null);
      if (!session) {
        // Auto-create guest session
        return this.createGuest();
      }
      return session;
    },

    set(session) {
      setJSON(SESSION_KEY, session);
      return session;
    },

    clear() {
      localStorage.removeItem(SESSION_KEY);
    },

    createGuest() {
      // Create a default guest user and workspace
      const guestUser = {
        id: 'user-guest',
        name: 'Guest User',
        email: 'guest@local',
        language: localStorage.getItem('uba-lang') || 'en',
        timezone: 'UTC',
        theme: localStorage.getItem('uba-theme') || 'light',
        isGuest: true,
        createdAt: nowISO()
      };

      const defaultWorkspace = {
        id: 'default',
        name: 'My Workspace',
        ownerUserId: 'user-guest',
        plan: 'free',
        createdAt: nowISO()
      };

      // Save user and workspace
      const users = getJSON(USERS_KEY, []);
      if (!users.find(u => u.id === 'user-guest')) {
        users.push(guestUser);
        setJSON(USERS_KEY, users);
      }

      const workspaces = getJSON(WORKSPACES_KEY, []);
      if (!workspaces.find(w => w.id === 'default')) {
        workspaces.push(defaultWorkspace);
        setJSON(WORKSPACES_KEY, workspaces);
      }

      const session = {
        userId: 'user-guest',
        currentWorkspaceId: 'default',
        isAuthenticated: false,
        createdAt: nowISO()
      };

      this.set(session);
      return session;
    },

    get currentUser() {
      const session = this.get();
      if (!session || !session.userId) return null;
      const users = getJSON(USERS_KEY, []);
      return users.find(u => u.id === session.userId) || null;
    },

    get currentWorkspaceId() {
      const session = this.get();
      return session ? session.currentWorkspaceId : 'default';
    },

    set currentWorkspaceId(workspaceId) {
      const session = this.get();
      session.currentWorkspaceId = workspaceId;
      this.set(session);
    },

    get currentWorkspace() {
      const workspaceId = this.currentWorkspaceId;
      const workspaces = getJSON(WORKSPACES_KEY, []);
      return workspaces.find(w => w.id === workspaceId) || null;
    }
  };

  // ===============================
  // Auth Management
  // ===============================
  const Auth = {
    async register(userData) {
      return new Promise((resolve, reject) => {
        try {
          const { name, email, password, language = 'en' } = userData;
          
          if (!email || !password) {
            reject(new Error('Email and password are required'));
            return;
          }

          const users = getJSON(USERS_KEY, []);
          
          // Check if user exists
          if (users.find(u => u.email === email)) {
            reject(new Error('User already exists'));
            return;
          }

          // Create new user
          const user = {
            id: generateId('user'),
            name: name || '',
            email,
            password, // In real implementation, this would be hashed
            language,
            timezone: 'UTC',
            theme: 'light',
            createdAt: nowISO()
          };

          users.push(user);
          setJSON(USERS_KEY, users);

          // Create default workspace for user
          const workspaces = getJSON(WORKSPACES_KEY, []);
          const workspace = {
            id: generateId('ws'),
            name: `${name}'s Workspace` || 'My Workspace',
            ownerUserId: user.id,
            plan: 'free',
            createdAt: nowISO()
          };
          workspaces.push(workspace);
          setJSON(WORKSPACES_KEY, workspaces);

          // Create session
          const session = {
            userId: user.id,
            currentWorkspaceId: workspace.id,
            isAuthenticated: true,
            createdAt: nowISO()
          };
          Session.set(session);

          log('User registered:', email);
          resolve({ user, workspace });
        } catch (error) {
          reject(error);
        }
      });
    },

    async login(email, password) {
      return new Promise((resolve, reject) => {
        try {
          if (!email || !password) {
            reject(new Error('Email and password are required'));
            return;
          }

          const users = getJSON(USERS_KEY, []);
          const user = users.find(u => u.email === email);

          if (!user) {
            reject(new Error('User not found'));
            return;
          }

          if (user.password !== password) {
            reject(new Error('Invalid password'));
            return;
          }

          // Find user's workspace
          const workspaces = getJSON(WORKSPACES_KEY, []);
          let workspace = workspaces.find(w => w.ownerUserId === user.id);

          if (!workspace) {
            // Create workspace if doesn't exist
            workspace = {
              id: generateId('ws'),
              name: `${user.name}'s Workspace` || 'My Workspace',
              ownerUserId: user.id,
              plan: 'free',
              createdAt: nowISO()
            };
            workspaces.push(workspace);
            setJSON(WORKSPACES_KEY, workspaces);
          }

          // Create session
          const session = {
            userId: user.id,
            currentWorkspaceId: workspace.id,
            isAuthenticated: true,
            createdAt: nowISO()
          };
          Session.set(session);

          log('User logged in:', email);
          resolve({ user, workspace });
        } catch (error) {
          reject(error);
        }
      });
    },

    async logout() {
      return new Promise((resolve) => {
        Session.clear();
        // Create new guest session
        Session.createGuest();
        log('User logged out');
        resolve(true);
      });
    },

    isAuthenticated() {
      const session = Session.get();
      return session && session.isAuthenticated === true;
    },

    getCurrentUser() {
      return Session.currentUser;
    },

    async updateUser(userId, updates) {
      return new Promise((resolve, reject) => {
        try {
          const users = getJSON(USERS_KEY, []);
          const index = users.findIndex(u => u.id === userId);

          if (index === -1) {
            reject(new Error('User not found'));
            return;
          }

          users[index] = {
            ...users[index],
            ...updates,
            updatedAt: nowISO()
          };

          setJSON(USERS_KEY, users);
          log('User updated:', userId);
          resolve(users[index]);
        } catch (error) {
          reject(error);
        }
      });
    }
  };

  // ===============================
  // Workspace Management
  // ===============================
  const Workspace = {
    async list(userId = null) {
      return new Promise((resolve) => {
        const workspaces = getJSON(WORKSPACES_KEY, []);
        if (userId) {
          resolve(workspaces.filter(w => w.ownerUserId === userId));
        } else {
          resolve(workspaces);
        }
      });
    },

    async get(workspaceId) {
      return new Promise((resolve) => {
        const workspaces = getJSON(WORKSPACES_KEY, []);
        resolve(workspaces.find(w => w.id === workspaceId) || null);
      });
    },

    async create(data) {
      return new Promise((resolve, reject) => {
        try {
          const { name, ownerUserId, plan = 'free' } = data;
          
          if (!name) {
            reject(new Error('Workspace name is required'));
            return;
          }

          const workspace = {
            id: generateId('ws'),
            name,
            ownerUserId: ownerUserId || Session.get().userId,
            plan,
            createdAt: nowISO()
          };

          const workspaces = getJSON(WORKSPACES_KEY, []);
          workspaces.push(workspace);
          setJSON(WORKSPACES_KEY, workspaces);

          log('Workspace created:', workspace.id);
          resolve(workspace);
        } catch (error) {
          reject(error);
        }
      });
    },

    async update(workspaceId, updates) {
      return new Promise((resolve, reject) => {
        try {
          const workspaces = getJSON(WORKSPACES_KEY, []);
          const index = workspaces.findIndex(w => w.id === workspaceId);

          if (index === -1) {
            reject(new Error('Workspace not found'));
            return;
          }

          workspaces[index] = {
            ...workspaces[index],
            ...updates,
            updatedAt: nowISO()
          };

          setJSON(WORKSPACES_KEY, workspaces);
          log('Workspace updated:', workspaceId);
          resolve(workspaces[index]);
        } catch (error) {
          reject(error);
        }
      });
    },

    async delete(workspaceId) {
      return new Promise((resolve, reject) => {
        try {
          if (workspaceId === 'default') {
            reject(new Error('Cannot delete default workspace'));
            return;
          }

          const workspaces = getJSON(WORKSPACES_KEY, []);
          const filtered = workspaces.filter(w => w.id !== workspaceId);

          if (filtered.length === workspaces.length) {
            reject(new Error('Workspace not found'));
            return;
          }

          setJSON(WORKSPACES_KEY, filtered);

          // Delete all data for this workspace
          ENTITY_TYPES.forEach(entityType => {
            const key = `uba-local-${entityType}-${workspaceId}`;
            localStorage.removeItem(key);
          });

          // If current workspace, switch to default
          if (Session.currentWorkspaceId === workspaceId) {
            Session.currentWorkspaceId = 'default';
          }

          log('Workspace deleted:', workspaceId);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });
    },

    async switch(workspaceId) {
      return new Promise((resolve, reject) => {
        try {
          const workspaces = getJSON(WORKSPACES_KEY, []);
          if (!workspaces.find(w => w.id === workspaceId)) {
            reject(new Error('Workspace not found'));
            return;
          }

          Session.currentWorkspaceId = workspaceId;
          log('Switched to workspace:', workspaceId);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });
    },

    getCurrent() {
      return Session.currentWorkspace;
    }
  };

  // ===============================
  // Data Layer (CRUD operations)
  // ===============================
  const Data = {
    // Helper to get storage key for entity
    _getStorageKey(entityType) {
      const workspaceId = Session.currentWorkspaceId;
      return `uba-local-${entityType}-${workspaceId}`;
    },

    // Helper to add metadata to record
    _addMetadata(record, entityType, isNew = true) {
      const now = nowISO();
      const workspaceId = Session.currentWorkspaceId;
      
      if (isNew) {
        return {
          id: record.id || generateId(entityType),
          ...record,
          workspaceId,
          createdAt: record.createdAt || now,
          updatedAt: now
        };
      } else {
        return {
          ...record,
          workspaceId,
          updatedAt: now
        };
      }
    },

    async list(entityType, filters = {}) {
      return new Promise((resolve) => {
        try {
          // Use ubaStore if available in local mode
          if (CONFIG.storageMode === 'local' && window.ubaStore && window.ubaStore[entityType]) {
            let items = window.ubaStore[entityType].getAll() || [];

            // Apply filters
            if (filters && Object.keys(filters).length > 0) {
              items = items.filter(item => {
                return Object.keys(filters).every(filterKey => {
                  return item[filterKey] === filters[filterKey];
                });
              });
            }

            resolve(items);
          } else {
            // Direct storage access fallback
            const key = this._getStorageKey(entityType);
            let items = getJSON(key, []);

            if (filters && Object.keys(filters).length > 0) {
              items = items.filter(item => {
                return Object.keys(filters).every(filterKey => {
                  return item[filterKey] === filters[filterKey];
                });
              });
            }

            resolve(items);
          }
        } catch (error) {
          warn('list error:', entityType, error);
          resolve([]);
        }
      });
    },

    async get(entityType, id) {
      return new Promise((resolve) => {
        try {
          // Use ubaStore if available in local mode
          if (CONFIG.storageMode === 'local' && window.ubaStore && window.ubaStore[entityType]) {
            const item = window.ubaStore[entityType].get(id);
            resolve(item || null);
          } else {
            // Direct storage access fallback
            const key = this._getStorageKey(entityType);
            const items = getJSON(key, []);
            const item = items.find(i => i.id === id);
            resolve(item || null);
          }
        } catch (error) {
          warn('get error:', entityType, id, error);
          resolve(null);
        }
      });
    },

    async create(entityType, data) {
      return new Promise((resolve, reject) => {
        try {
          const newItem = this._addMetadata(data, entityType, true);
          
          // Use ubaStore if available in local mode
          if (CONFIG.storageMode === 'local' && window.ubaStore && window.ubaStore[entityType]) {
            const created = window.ubaStore[entityType].create(newItem);
            log('Created:', entityType, created.id);
            resolve(created);
          } else {
            // Direct storage access fallback
            const key = this._getStorageKey(entityType);
            const items = getJSON(key, []);
            items.unshift(newItem);
            setJSON(key, items);
            log('Created:', entityType, newItem.id);
            resolve(newItem);
          }
        } catch (error) {
          warn('create error:', entityType, error);
          reject(error);
        }
      });
    },

    async update(entityType, id, updates) {
      return new Promise((resolve, reject) => {
        try {
          // Use ubaStore if available in local mode
          if (CONFIG.storageMode === 'local' && window.ubaStore && window.ubaStore[entityType]) {
            const updated = window.ubaStore[entityType].update(id, updates);
            if (updated) {
              log('Updated:', entityType, id);
              resolve(updated);
            } else {
              reject(new Error(`${entityType} not found: ${id}`));
            }
          } else {
            // Direct storage access fallback
            const key = this._getStorageKey(entityType);
            const items = getJSON(key, []);
            const index = items.findIndex(i => i.id === id);

            if (index === -1) {
              reject(new Error(`${entityType} not found: ${id}`));
              return;
            }

            items[index] = this._addMetadata({
              ...items[index],
              ...updates
            }, entityType, false);

            setJSON(key, items);
            log('Updated:', entityType, id);
            resolve(items[index]);
          }
        } catch (error) {
          warn('update error:', entityType, id, error);
          reject(error);
        }
      });
    },

    async remove(entityType, id) {
      return new Promise((resolve, reject) => {
        try {
          // Use ubaStore if available in local mode
          if (CONFIG.storageMode === 'local' && window.ubaStore && window.ubaStore[entityType]) {
            window.ubaStore[entityType].delete(id);
            log('Removed:', entityType, id);
            resolve(true);
          } else {
            // Direct storage access fallback
            const key = this._getStorageKey(entityType);
            const items = getJSON(key, []);
            const filtered = items.filter(i => i.id !== id);

            if (filtered.length === items.length) {
              reject(new Error(`${entityType} not found: ${id}`));
              return;
            }

            setJSON(key, filtered);
            log('Removed:', entityType, id);
            resolve(true);
          }
        } catch (error) {
          warn('remove error:', entityType, id, error);
          reject(error);
        }
      });
    },

    async saveAll(entityType, items) {
      return new Promise((resolve, reject) => {
        try {
          // Use ubaStore if available in local mode
          if (CONFIG.storageMode === 'local' && window.ubaStore && window.ubaStore[entityType]) {
            window.ubaStore[entityType].saveAll(items);
            log('Saved all:', entityType, items.length, 'items');
            resolve(items);
          } else {
            // Direct storage access fallback
            const key = this._getStorageKey(entityType);
            setJSON(key, items);
            log('Saved all:', entityType, items.length, 'items');
            resolve(items);
          }
        } catch (error) {
          warn('saveAll error:', entityType, error);
          reject(error);
        }
      });
    }
  };

  // ===============================
  // Migration Logic
  // ===============================
  function migrateExistingData() {
    const migrated = localStorage.getItem(MIGRATION_FLAG);
    if (migrated === 'true') {
      log('Data already migrated');
      return;
    }

    log('Starting data migration...');
    const workspaceId = Session.currentWorkspaceId;

    ENTITY_TYPES.forEach(entityType => {
      const oldKey = `uba-local-${entityType}`;
      const newKey = `uba-local-${entityType}-${workspaceId}`;
      
      // Check if old data exists
      const oldData = getJSON(oldKey, null);
      const newData = getJSON(newKey, null);

      if (oldData && Array.isArray(oldData) && oldData.length > 0 && !newData) {
        // Migrate old data to new workspace-scoped key
        const migratedData = oldData.map(item => ({
          ...item,
          workspaceId: workspaceId,
          createdAt: item.createdAt || item.created_at || item.created || nowISO(),
          updatedAt: item.updatedAt || item.updated_at || nowISO()
        }));
        
        setJSON(newKey, migratedData);
        log(`Migrated ${migratedData.length} ${entityType} to workspace ${workspaceId}`);
      }
    });

    localStorage.setItem(MIGRATION_FLAG, 'true');
    log('Migration completed');
  }

  // ===============================
  // Initialization
  // ===============================
  function init() {
    log('Initializing UBA Data Layer');
    
    // Ensure session exists
    Session.get();
    
    // Run migration
    migrateExistingData();
    
    log('UBA Data Layer ready');
  }

  // ===============================
  // Public API
  // ===============================
  window.UBA = {
    config: CONFIG,
    session: Session,
    auth: Auth,
    workspace: Workspace,
    data: Data,
    _internal: {
      generateId,
      nowISO,
      getJSON,
      setJSON
    }
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
