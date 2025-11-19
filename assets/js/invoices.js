// invoices.js — invoices page initializer
(function () {
  function initInvoicesPage() {
    if (typeof renderInvoicePage === 'function') {
      renderInvoicePage();
    }
  }

  window.initInvoicesPage = initInvoicesPage;
})();
