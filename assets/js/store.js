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
    if (window.crypto && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  };

  const nowISO = () => new Date().toISOString();

  // Generic collection API
  const loadCollection = (name) => read(KEYS[name] || name);
  const saveCollection = (name, items) => write(KEYS[name] || name, items);

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
    if (!items || items.length === 0) {
      saveCollection(name, seed || []);
      return loadCollection(name);
    }
    return items;
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
  };

  window.ubaStore = store;
})();
