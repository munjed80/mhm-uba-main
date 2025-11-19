// smarttools.js — initializer for Smart Tools page
(function () {
  function initSmartTools() {
    try {
      if (typeof initSmartToolsStandalone === 'function') return initSmartToolsStandalone();
      if (typeof renderSmartToolsGrid === 'function') return renderSmartToolsGrid();
    } catch (e) {
      console.warn('initSmartTools error', e);
    }
  }

  window.initSmartTools = initSmartTools;
})();
