// page-loader.js — lightweight per-page initializer and API
(function () {
  function safeCall(fn, label) {
    try {
      return fn();
    } catch (err) {
      if (label) {
        console.warn(label + ' error', err);
      } else {
        console.warn('page-loader callback error', err);
      }
    }
  }

  function runStandaloneRenderers() {
    safeCall(() => {
      if (typeof initSmartToolsStandalone === 'function') {
        initSmartToolsStandalone();
      }
    }, 'initSmartToolsStandalone');

    safeCall(() => {
      if (typeof renderSmartToolsGrid === 'function' && document.getElementById('smart-tools-grid')) {
        renderSmartToolsGrid();
      }
    }, 'renderSmartToolsGrid');

    safeCall(() => {
      if (
        typeof window.renderProjectsStandalone === 'function' &&
        (document.getElementById('projects-leads') || document.getElementById('projects-inprogress'))
      ) {
        window.renderProjectsStandalone();
      }
    }, 'renderProjectsStandalone');

    safeCall(() => {
      if (
        typeof window.renderTasksStandalone === 'function' &&
        (document.getElementById('tasks-backlog') || document.getElementById('tasks-inprogress'))
      ) {
        window.renderTasksStandalone();
      }
    }, 'renderTasksStandalone');

    safeCall(() => {
      if (typeof renderProjectsBoard === 'function' && document.getElementById('projects-columns')) {
        renderProjectsBoard();
      }
    }, 'renderProjectsBoard');

    safeCall(() => {
      if (typeof renderTasksBoard === 'function' && document.getElementById('tasks-columns')) {
        renderTasksBoard();
      }
    }, 'renderTasksBoard');
  }

  function applyTranslations(pageId) {
    try {
      if (window.ubaI18n && typeof window.ubaI18n.applyTranslations === 'function') {
        if (pageId) {
          const viewKey = (pageId || '').replace(/-page$/, '');
          if (typeof window.ubaI18n.setCurrentView === 'function') {
            window.ubaI18n.setCurrentView(viewKey);
          }
        }
        window.ubaI18n.applyTranslations();
      }
    } catch (err) {
      console.warn('i18n apply after init failed', err);
    }
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
        case 'assistant-page':
          if (typeof initAssistantPage === 'function') initAssistantPage();
          break;
        default:
          if (pageId && pageId.indexOf('projects') !== -1 && typeof initProjectsPage === 'function') {
            initProjectsPage();
          }
          if (pageId && pageId.indexOf('tasks') !== -1 && typeof initTasksPage === 'function') {
            initTasksPage();
          }
          break;
      }
    } catch (err) {
      console.warn('loadPageScripts error', err);
    }

    applyTranslations(pageId);
  }

  function init() {
    try {
      runStandaloneRenderers();
      const pageId = document.getElementById('page-id')?.dataset?.page;
      if (pageId) {
        loadPageScripts(pageId);
      } else {
        applyTranslations();
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

  window.ubaPageLoader = { init, loadPageScripts };
  window.loadPageScripts = loadPageScripts;
})();
