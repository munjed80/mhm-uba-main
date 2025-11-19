// automations.js — automations page initializer
(function () {
  function initAutomationsPage() {
    const ctaButton = document.querySelector('[data-automation-new]');
    if (ctaButton) {
      ctaButton.addEventListener('click', () => {
        alert('Automation builder coming soon.');
      });
    }
  }

  window.initAutomationsPage = initAutomationsPage;
})();
