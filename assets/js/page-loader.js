// page-loader.js — lightweight per-page initializer and API
(function () {
  const initializedPages = new Set();
  function safeCall(fn, label) {
    try {
      return fn();
    } catch (err) {
      if (label) {
        console.warn(label + " error", err);
      } else {
        console.warn("page-loader callback error", err);
      }
    }
  }

  function runStandaloneRenderers() {
    safeCall(() => {
      if (typeof initSmartToolsStandalone === "function") {
        initSmartToolsStandalone();
      }
    }, "initSmartToolsStandalone");

    safeCall(() => {
      if (
        typeof renderSmartToolsGrid === "function" &&
        document.getElementById("smart-tools-grid")
      ) {
        renderSmartToolsGrid();
      }
    }, "renderSmartToolsGrid");

    safeCall(() => {
      if (
        typeof window.renderProjectsStandalone === "function" &&
        (document.getElementById("projects-leads") ||
          document.getElementById("projects-inprogress"))
      ) {
        window.renderProjectsStandalone();
      }
    }, "renderProjectsStandalone");

    safeCall(() => {
      if (
        typeof window.renderTasksStandalone === "function" &&
        (document.getElementById("tasks-backlog") ||
          document.getElementById("tasks-inprogress"))
      ) {
        window.renderTasksStandalone();
      }
    }, "renderTasksStandalone");

    safeCall(() => {
      if (
        typeof renderProjectsBoard === "function" &&
        document.getElementById("projects-columns")
      ) {
        renderProjectsBoard();
      }
    }, "renderProjectsBoard");

    safeCall(() => {
      if (
        typeof renderTasksBoard === "function" &&
        document.getElementById("tasks-columns")
      ) {
        renderTasksBoard();
      }
    }, "renderTasksBoard");
  }

  function applyTranslations(pageId) {
    try {
      if (
        window.ubaI18n &&
        typeof window.ubaI18n.applyTranslations === "function"
      ) {
        if (pageId) {
          const viewKey = (pageId || "").replace(/-page$/, "");
          if (typeof window.ubaI18n.setCurrentView === "function") {
            window.ubaI18n.setCurrentView(viewKey);
          }
        }
        window.ubaI18n.applyTranslations();
      }
    } catch (err) {
      console.warn("i18n apply after init failed", err);
    }
  }

  function loadPageScripts(pageId, options = {}) {
    const resolvedPageId = pageId || document.getElementById("page-id")?.dataset?.page;
    if (!resolvedPageId) {
      console.warn("page-loader: missing pageId");
      applyTranslations();
      return;
    }

    const force = !!options.force;
    if (!force && initializedPages.has(resolvedPageId)) {
      console.log("page-loader: skip duplicate init for", resolvedPageId);
      applyTranslations(resolvedPageId);
      return;
    }

    initializedPages.add(resolvedPageId);
    console.log("page-loader: initialize", resolvedPageId);
    try {
      switch (resolvedPageId) {
        case "index-page":
          if (typeof initIndexPage === "function") {
            console.log("✅ Calling initIndexPage");
            initIndexPage();
          } else {
            console.warn("❌ initIndexPage function not found");
          }
          break;
        case "clients-page":
          if (typeof initClientsPage === "function") {
            console.log("✅ Calling initClientsPage");
            initClientsPage();
          } else {
            console.warn("❌ initClientsPage function not found");
          }
          break;
        case "projects-page":
          if (typeof initProjectsPage === "function") {
            console.log("✅ Calling initProjectsPage");
            initProjectsPage();
          } else {
            console.warn("❌ initProjectsPage function not found");
          }
          break;
        case "tasks-page":
          if (typeof initTasksPage === "function") {
            console.log("✅ Calling initTasksPage");
            initTasksPage();
          } else {
            console.warn("❌ initTasksPage function not found");
          }
          break;
        case "invoices-page":
          if (typeof initInvoicesPage === "function") {
            console.log("✅ Calling initInvoicesPage");
            initInvoicesPage();
          } else if (typeof renderInvoicePage === "function") {
            console.log("✅ Calling renderInvoicePage");
            renderInvoicePage();
          } else {
            console.warn("❌ initInvoicesPage and renderInvoicePage functions not found");
          }
          break;
        case "automations-page":
          if (typeof initAutomationsPage === "function") {
            console.log("✅ Calling initAutomationsPage");
            initAutomationsPage();
          } else {
            console.warn("❌ initAutomationsPage function not found");
          }
          break;
        case "leads-page":
          if (typeof initLeadsPage === "function") {
            console.log("✅ Calling initLeadsPage");
            initLeadsPage();
          } else {
            console.warn("❌ initLeadsPage function not found");
          }
          break;
        case "expenses-page":
          if (typeof initExpensesPage === "function") initExpensesPage();
          break;
        case "files-page":
          if (typeof initFilesPage === "function") initFilesPage();
          break;
        case "reports-page":
          if (typeof initReportsPage === "function") initReportsPage();
          break;
        case "smarttools-page":
          if (typeof initSmartTools === "function") initSmartTools();
          break;
        case "insights-page":
          if (typeof initInsightsPage === "function") initInsightsPage();
          break;
        case "calendar-page":
          if (typeof initCalendarPage === "function") initCalendarPage();
          break;
        case "assistant-page":
          if (typeof initAssistantPage === "function") initAssistantPage();
          break;
        default:
          if (
            resolvedPageId &&
            resolvedPageId.indexOf("projects") !== -1 &&
            typeof initProjectsPage === "function"
          ) {
            initProjectsPage();
          }
          if (
            resolvedPageId &&
            resolvedPageId.indexOf("tasks") !== -1 &&
            typeof initTasksPage === "function"
          ) {
            initTasksPage();
          }
          break;
      }
    } catch (err) {
      console.warn("loadPageScripts error", err);
    }

    applyTranslations(resolvedPageId);
  }

  function resetPageInitialization(pageId) {
    if (pageId) {
      initializedPages.delete(pageId);
      return;
    }
    initializedPages.clear();
  }

  function init() {
    try {
      runStandaloneRenderers();
      const pageId = document.getElementById("page-id")?.dataset?.page;
      if (pageId) {
        loadPageScripts(pageId);
      } else {
        applyTranslations();
      }
    } catch (err) {
      console.warn("ubaPageLoader init error", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.ubaPageLoader = { init, loadPageScripts, reset: resetPageInitialization };
  window.loadPageScripts = loadPageScripts;
})();
