// Simple localStorage-backed data store for MHM UBA
// Exposes `window.ubaStore` with collection helpers and seeding
(function () {
  const PREFIX = "uba_";

  // Keys intentionally match the app's LOCAL_KEYS naming convention
  const KEYS = {
    clients: "uba-local-clients",
    projects: "uba-local-projects",
    tasks: "uba-local-tasks",
    invoices: "uba-local-invoices",
    leads: "uba-local-leads",
    expenses: "uba-local-expenses",
    files: "uba-local-files",
    reports: "uba-local-reports",
    automations: "uba-local-automations",
    automationLogs: "uba-local-automation-logs",
    settings: "uba-settings",
  };

  const read = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch (e) {
      console.warn("ubaStore: read error", e);
      return [];
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value || []));
      return true;
    } catch (e) {
      console.warn("ubaStore: write error", e);
      return false;
    }
  };

  const generateId = (prefix = "id") => {
    if (window.crypto && crypto.randomUUID)
      return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  };

  const nowISO = () => new Date().toISOString();

  // Session (current user + workspace) persisted in localStorage
  const SESSION_KEY = `${PREFIX}session`;
  const USERS_KEY = `${PREFIX}users`;
  const WORKSPACES_KEY = `${PREFIX}workspaces`;

  const readJSON = (k, fallback) => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  };

  const saveJSON = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      return false;
    }
  };

  const getSession = () => readJSON(SESSION_KEY, null);
  const setSession = (obj) => saveJSON(SESSION_KEY, obj);
  const clearSession = () => localStorage.removeItem(SESSION_KEY);

  // Helper: resolve storage key for a collection, scoped to current workspace
  const resolveStorageKey = (name) => {
    // Get current workspace ID from WorkspaceManager
    const currentWorkspaceId = window.WorkspaceManager ? 
      window.WorkspaceManager.getCurrentWorkspaceId() : 
      (localStorage.getItem('uba-current-workspace') || 'default');
    
    const baseKey = KEYS[name] || `uba-local-${name}`;
    return `${baseKey}-${currentWorkspaceId}`;
  };

  // Generic collection API
  const loadCollection = (name) => read(resolveStorageKey(name));
  const saveCollection = (name, items) => write(resolveStorageKey(name), items);

  // CRUD factories
  const makeHelpers = (name) => ({
    getAll() {
      return loadCollection(name) || [];
    },
    get(id) {
      return (loadCollection(name) || []).find((i) => i.id === id) || null;
    },
    create(payload = {}) {
      const items = loadCollection(name) || [];
      const id = payload.id || generateId(name);
      const now = nowISO();
      const item = { id, createdAt: now, updatedAt: now, ...payload };
      items.unshift(item);
      saveCollection(name, items);
      return item;
    },
    update(id, patch = {}) {
      const items = loadCollection(name) || [];
      let found = null;
      const next = items.map((it) => {
        if (it.id === id) {
          found = { ...it, ...patch, updatedAt: nowISO() };
          return found;
        }
        return it;
      });
      saveCollection(name, next);
      return found;
    },
    delete(id) {
      const items = loadCollection(name) || [];
      const next = items.filter((it) => it.id !== id);
      saveCollection(name, next);
      return true;
    },
    saveAll(items = []) {
      saveCollection(name, items);
      return items;
    },
  });

  // Provide seeds for first-run demo data
  const ensureSeed = (name, seed) => {
    const items = loadCollection(name);
    if (!items || (Array.isArray(items) && items.length === 0)) {
      saveCollection(name, Array.isArray(seed) ? seed : seed || []);
      return loadCollection(name);
    }
    return items;
  };

  // ------------------
  // Auth & workspace helpers
  // ------------------
  const getAllUsers = () => readJSON(USERS_KEY, []);
  const saveAllUsers = (u) => saveJSON(USERS_KEY, u || []);
  const getAllWorkspaces = () => readJSON(WORKSPACES_KEY, []);
  const saveAllWorkspaces = (w) => saveJSON(WORKSPACES_KEY, w || []);

  const auth = {
    createUser({ name, email, password, language } = {}) {
      if (!email) throw new Error("Email required");
      const users = getAllUsers();
      if (users.find((u) => u.email === email)) throw new Error("User exists");
      const id = generateId("user");
      const user = {
        id,
        name: name || "",
        email,
        password: password || "",
        language: language || "en",
        createdAt: nowISO(),
      };
      users.push(user);
      saveAllUsers(users);
      return user;
    },
    getUserByEmail(email) {
      if (!email) return null;
      const users = getAllUsers();
      return users.find((u) => u.email === email) || null;
    },
    login(email, password) {
      const user = auth.getUserByEmail(email);
      if (!user) throw new Error("No such user");
      if (user.password !== password) throw new Error("Invalid credentials");
      // choose a workspace for the user or create a default one
      const workspaces = getAllWorkspaces();
      let ws = workspaces.find((w) => w.ownerId === user.id);
      if (!ws) {
        ws = {
          id: generateId("ws"),
          ownerId: user.id,
          name: `${user.name || "Workspace"}`,
          meta: { timezone: "UTC", industry: "" },
          createdAt: nowISO(),
        };
        workspaces.push(ws);
        saveAllWorkspaces(workspaces);
      }
      const session = { userId: user.id, workspaceId: ws.id };
      setSession(session);
      return { user, workspace: ws };
    },
    logout() {
      clearSession();
    },
    currentUser() {
      const s = getSession();
      if (!s || !s.userId) return null;
      const users = getAllUsers();
      return users.find((u) => u.id === s.userId) || null;
    },
    setCurrentUserById(userId) {
      const s = getSession() || {};
      s.userId = userId;
      setSession(s);
    },
    updateUser(userId, patch = {}) {
      const users = getAllUsers();
      let found = false;
      const next = users.map((u) => {
        if (u.id === userId) {
          found = true;
          return { ...u, ...patch, updatedAt: nowISO() };
        }
        return u;
      });
      if (found) {
        saveAllUsers(next);
        return next.find((u) => u.id === userId) || null;
      }
      return null;
    },
  };

  const workspace = {
    createWorkspace({ name, ownerId, meta } = {}) {
      const w = {
        id: generateId("ws"),
        ownerId: ownerId || null,
        name: name || "Workspace",
        meta: meta || { timezone: "UTC" },
        createdAt: nowISO(),
      };
      const all = getAllWorkspaces();
      all.push(w);
      saveAllWorkspaces(all);
      return w;
    },
    listForUser(userId) {
      const all = getAllWorkspaces();
      return all.filter((w) => w.ownerId === userId);
    },
    getCurrentWorkspace() {
      const s = getSession();
      if (!s || !s.workspaceId) return null;
      return getAllWorkspaces().find((w) => w.id === s.workspaceId) || null;
    },
    setCurrentWorkspace(workspaceId) {
      const s = getSession() || {};
      s.workspaceId = workspaceId;
      setSession(s);
    },
    updateWorkspace(workspaceId, patch = {}) {
      const all = getAllWorkspaces();
      let found = false;
      const next = all.map((w) => {
        if (w.id === workspaceId) {
          found = true;
          // merge meta object carefully
          const nextMeta = { ...(w.meta || {}), ...(patch.meta || {}) };
          return { ...w, ...patch, meta: nextMeta, updatedAt: nowISO() };
        }
        return w;
      });
      if (found) {
        saveAllWorkspaces(next);
        return next.find((w) => w.id === workspaceId) || null;
      }
      return null;
    },
  };

  const store = {
    KEYS,
    loadCollection,
    saveCollection,
    generateId,
    ensureSeed,
    clients: makeHelpers("clients"),
    projects: makeHelpers("projects"),
    tasks: makeHelpers("tasks"),
    invoices: makeHelpers("invoices"),
    leads: makeHelpers("leads"),
    expenses: makeHelpers("expenses"),
    files: makeHelpers("files"),
    automations: makeHelpers("automations"),
    automationLogs: makeHelpers("automationLogs"),
    auth,
    workspace,
    _internal: {
      getSession,
      setSession,
      clearSession,
      getAllUsers,
      getAllWorkspaces,
    },
  };

  window.ubaStore = store;
})();
