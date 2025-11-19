// tasks.js — per-page initializer for Tasks standalone page
(function () {
  function initTasksPage() {
    try {
      if (typeof window.renderTasksStandalone === 'function') return window.renderTasksStandalone();
      if (typeof renderTasksBoard === 'function') return renderTasksBoard();
    } catch (e) {
      console.warn('initTasksPage error', e);
    }
  }

  window.initTasksPage = initTasksPage;
})();
