// clients.js — per-page initializer for Clients standalone page
(function () {
  function initClientsPage() {
    try {
      if (typeof renderClientsPage === "function") {
        renderClientsPage();
        return;
      }
      // fallback: try to render clients table if present
      if (typeof window.renderClients === "function")
        return window.renderClients();
    } catch (e) {
      console.warn("initClientsPage error", e);
    }
  }

  // Expose globally for page-loader
  window.initClientsPage = initClientsPage;
})();
