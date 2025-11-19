// page-loader.js — lightweight per-page initializer and API
(function () {
  function init() {
    try {
      // Call general standalone initializers if their containers exist
      if (typeof initSmartToolsStandalone === 'function') {
        try { initSmartToolsStandalone(); } catch (e) { console.warn('initSmartToolsStandalone error', e); }
      }

      if (typeof renderSmartToolsGrid === 'function' && document.getElementById('smart-tools-grid')) {
        try { renderSmartToolsGrid(); } catch (e) { console.warn('renderSmartToolsGrid error', e); }
      }

      if (typeof window.renderProjectsStandalone === 'function' && (document.getElementById('projects-leads') || document.getElementById('projects-inprogress'))) {
        try { window.renderProjectsStandalone(); } catch (e) { console.warn('renderProjectsStandalone error', e); }
      }

      if (typeof window.renderTasksStandalone === 'function' && (document.getElementById('tasks-backlog') || document.getElementById('tasks-inprogress'))) {
        try { window.renderTasksStandalone(); } catch (e) { console.warn('renderTasksStandalone error', e); }
      }

      if (typeof renderProjectsBoard === 'function' && document.getElementById('projects-columns')) {
        try { renderProjectsBoard(); } catch (e) { /* noop */ }
      }
      if (typeof renderTasksBoard === 'function' && document.getElementById('tasks-columns')) {
        try { renderTasksBoard(); } catch (e) { /* noop */ }
      }

      // After running any init tasks, ensure translations are applied for the page
      try {
        if (window.ubaI18n && typeof window.ubaI18n.applyTranslations === 'function') {
          window.ubaI18n.applyTranslations();
        }
      } catch (e) {
        console.warn('i18n apply after init failed', e);
      }
    } catch (err) {
      console.warn('ubaPageLoader init error', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function loadPageScripts(pageId) {
    console.log('page-loader: initialize', pageId);
    try {
      switch (pageId) {
        case 'index-page':
          if (typeof initIndexPage === 'function') initIndexPage();
          break;
        case 'clients-page':
          if (typeof initClientsPage === 'function') initClientsPage();
          break;
        case 'projects-page':
          if (typeof initProjectsPage === 'function') initProjectsPage();
          break;
        case 'tasks-page':
          if (typeof initTasksPage === 'function') initTasksPage();
          break;
        case 'invoices-page':
          if (typeof renderInvoicePage === 'function') renderInvoicePage();
          break;
        case 'smarttools-page':
          if (typeof initSmartTools === 'function') initSmartTools();
          break;
        case 'insights-page':
          if (typeof initInsightsPage === 'function') initInsightsPage();
          break;
        case 'calendar-page':
          if (typeof initCalendarPage === 'function') initCalendarPage();
          break;
        case 'clients-page':
          if (typeof initClientsPage === 'function') initClientsPage();
          break;
        case 'assistant-page':
          if (typeof initAssistant === 'function') initAssistant();
          break;
        default:
          // try generic fallbacks
          if (pageId && pageId.indexOf('projects') !== -1 && typeof initProjectsPage === 'function') initProjectsPage();
          if (pageId && pageId.indexOf('tasks') !== -1 && typeof initTasksPage === 'function') initTasksPage();
          break;
      }
    } catch (e) {
      console.warn('loadPageScripts error', e);
    }

    // After initializing the page, ensure translations are applied and view header is updated
    try {
      if (window.ubaI18n && typeof window.ubaI18n.applyTranslations === 'function') {
        // set a sensible view key if available (strip -page suffix)
        try {
          const viewKey = (pageId || '').replace(/-page$/, '');
          if (typeof window.ubaI18n.setCurrentView === 'function') {
            window.ubaI18n.setCurrentView(viewKey);
          }
        } catch (e) {
          // ignore
        }
        window.ubaI18n.applyTranslations();
      }
    } catch (e) {
      console.warn('i18n apply after loadPageScripts failed', e);
    }
  }

  window.ubaPageLoader = { init, loadPageScripts };
  window.loadPageScripts = loadPageScripts; // convenience alias for inline snippets
})();
// Page loader: initialize page-specific modules when a standalone page loads
// Lightweight adapter that calls into existing renderers if present (keeps code minimal)
(function () {
  function init() {
    try {
      // Smart Tools (standalone)
      if (typeof initSmartToolsStandalone === 'function') {
        try { initSmartToolsStandalone(); } catch (e) { console.warn('initSmartToolsStandalone error', e); }
      }
      // Support in-page smart tools grid for index SPA or standalone pages
      if (typeof renderSmartToolsGrid === 'function' && document.getElementById('smart-tools-grid')) {
        try { renderSmartToolsGrid(); } catch (e) { console.warn('renderSmartToolsGrid error', e); }
      }

      // Projects standalone renderer (fills #projects-leads, #projects-inprogress, #projects-ongoing, #projects-completed)
      if (typeof window.renderProjectsStandalone === 'function' && (document.getElementById('projects-leads') || document.getElementById('projects-inprogress'))) {
        try { window.renderProjectsStandalone(); } catch (e) { console.warn('renderProjectsStandalone error', e); }
      }

      // Tasks standalone renderer (fills #tasks-backlog, #tasks-today, #tasks-inprogress, #tasks-done)
      if (typeof window.renderTasksStandalone === 'function' && (document.getElementById('tasks-backlog') || document.getElementById('tasks-inprogress'))) {
        try { window.renderTasksStandalone(); } catch (e) { console.warn('renderTasksStandalone error', e); }
      }

      // Fallbacks: if the SPA-style renderers exist and their container IDs exist, call them too
      if (typeof renderProjectsBoard === 'function' && document.getElementById('projects-columns')) {
        try { renderProjectsBoard(); } catch (e) { /* noop */ }
      }
      if (typeof renderTasksBoard === 'function' && document.getElementById('tasks-columns')) {
        try { renderTasksBoard(); } catch (e) { /* noop */ }
      }

      // After running any init tasks, ensure translations are applied for the page
      try {
        if (window.ubaI18n && typeof window.ubaI18n.applyTranslations === 'function') {
          window.ubaI18n.applyTranslations();
        }
      } catch (e) {
        console.warn('i18n apply after init failed', e);
      }
    } catch (err) {
      console.warn('ubaPageLoader init error', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose a small API for manual initialization or tests
    // This function runs every time a new HTML page is injected / opened
    function loadPageScripts(pageId) {
    console.log("Initializing page:", pageId);

    switch (pageId) {

      case "clients-page":
        if (typeof initClientsPage === "function") {
          initClientsPage();
        }
        break;

      case "projects-page":
        if (typeof initProjectsPage === "function") {
          initProjectsPage();
        }
        break;

      case "tasks-page":
        if (typeof initTasksPage === "function") {
          initTasksPage();
        }
        break;

      case "smarttools-page":
        if (typeof initSmartTools === "function") {
          initSmartTools();
        }
        break;

      case "assistant-page":
        if (typeof initAssistant === "function") {
          initAssistant();
        }
        break;

      default:
        console.log("No initialization defined for:", pageId);
    }

    // After initializing the page, ensure translations are applied and view header is updated
    try {
      if (window.ubaI18n && typeof window.ubaI18n.applyTranslations === 'function') {
        try {
          const viewKey = (pageId || '').replace(/-page$/, '');
          if (typeof window.ubaI18n.setCurrentView === 'function') {
            window.ubaI18n.setCurrentView(viewKey);
          }
        } catch (e) { /* ignore */ }
        window.ubaI18n.applyTranslations();
      }
    } catch (e) {
      console.warn('i18n apply after loadPageScripts failed', e);
    }
    }

    window.ubaPageLoader = {
    init,
    loadPageScripts,
    };
    // expose simple global alias for inline page-init scripts
    window.loadPageScripts = loadPageScripts;
})();
