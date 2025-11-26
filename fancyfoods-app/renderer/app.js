const modules = {
  products: window.productsModule,
  clients: window.clientsModule,
  broker: window.brokerModule,
  orders: window.ordersModule,
  email: window.emailModule,
  workflow: window.workflowModule
};

const mainContent = document.getElementById('mainContent');
const sidebarButtons = document.querySelectorAll('#sidebar .list-group-item');

sidebarButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    sidebarButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderModule(btn.dataset.target);
  });
});

document.getElementById('backupExport').addEventListener('click', async () => {
  const res = await window.fancyAPI.exportBackup();
  alert(res.success ? `Backup saved to ${res.data}` : res.error);
});

document.getElementById('backupImport').addEventListener('click', async () => {
  const res = await window.fancyAPI.importBackup();
  alert(res.success ? 'Backup imported. Restart app if needed.' : res.error);
});

function renderModule(name) {
  mainContent.innerHTML = '';
  if (modules[name]) {
    modules[name](mainContent);
  }
}

// default view
sidebarButtons[0].click();
