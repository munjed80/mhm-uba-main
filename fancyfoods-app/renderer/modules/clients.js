window.clientsModule = function (container) {
  const layout = document.createElement('div');
  layout.innerHTML = `
    <div class="module-header">
      <div>
        <h3>Clients</h3>
        <p class="text-muted mb-0">Shops, wholesalers and partners.</p>
      </div>
      <div class="d-flex gap-2">
        <input class="form-control" placeholder="Search by name or phone" id="clientSearch" />
        <button class="btn btn-primary" id="addClient">Add Client</button>
      </div>
    </div>
    <div id="clientForm" class="card card-compact mb-3 d-none">
      <div class="card-body">
        <div class="row g-3">
          <input type="hidden" id="clientId" />
          <div class="col-md-4">
            <label class="form-label">Name</label>
            <input class="form-control" id="clientName" required />
          </div>
          <div class="col-md-2">
            <label class="form-label">Phone</label>
            <input class="form-control" id="clientPhone" />
          </div>
          <div class="col-md-2">
            <label class="form-label">WhatsApp</label>
            <input class="form-control" id="clientWhatsapp" />
          </div>
          <div class="col-md-2">
            <label class="form-label">City</label>
            <input class="form-control" id="clientCity" />
          </div>
          <div class="col-md-12">
            <label class="form-label">Notes</label>
            <textarea class="form-control" id="clientNotes" rows="2"></textarea>
          </div>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-success" id="saveClient">Save</button>
          <button class="btn btn-secondary" id="cancelClient">Cancel</button>
        </div>
      </div>
    </div>
    <table class="table table-striped align-middle" id="clientsTable">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>WhatsApp</th>
          <th>City</th>
          <th>Notes</th>
          <th class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  container.appendChild(layout);

  const tableBody = layout.querySelector('#clientsTable tbody');
  const searchInput = layout.querySelector('#clientSearch');
  const form = layout.querySelector('#clientForm');

  layout.querySelector('#addClient').addEventListener('click', () => toggleForm(true));
  layout.querySelector('#cancelClient').addEventListener('click', () => toggleForm(false));
  layout.querySelector('#saveClient').addEventListener('click', saveClient);
  searchInput.addEventListener('input', () => loadClients(searchInput.value));

  async function loadClients(term = '') {
    const res = term ? await window.fancyAPI.searchClients(term) : await window.fancyAPI.listClients();
    if (!res.success) return alert(res.error);
    tableBody.innerHTML = '';
    res.data.forEach((c) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${c.name}</td>
        <td>${c.phone || ''}</td>
        <td>${c.whatsapp || ''}</td>
        <td>${c.city || ''}</td>
        <td>${c.notes || ''}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" data-id="${c.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-remove="${c.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  tableBody.addEventListener('click', (e) => {
    if (e.target.dataset.id) editClient(e.target.dataset.id);
    if (e.target.dataset.remove) deleteClient(e.target.dataset.remove);
  });

  function toggleForm(show) {
    form.classList.toggle('d-none', !show);
    if (!show) {
      form.querySelector('#clientId').value = '';
    }
  }

  async function editClient(id) {
    const res = await window.fancyAPI.listClients();
    const client = res.data.find((c) => c.id == id);
    if (!client) return;
    toggleForm(true);
    form.querySelector('#clientId').value = client.id;
    form.querySelector('#clientName').value = client.name;
    form.querySelector('#clientPhone').value = client.phone || '';
    form.querySelector('#clientWhatsapp').value = client.whatsapp || '';
    form.querySelector('#clientCity').value = client.city || '';
    form.querySelector('#clientNotes').value = client.notes || '';
  }

  async function deleteClient(id) {
    if (!confirm('Delete this client?')) return;
    const res = await window.fancyAPI.deleteClient(Number(id));
    if (!res.success) return alert(res.error);
    loadClients();
  }

  async function saveClient() {
    const payload = {
      id: Number(form.querySelector('#clientId').value) || null,
      name: form.querySelector('#clientName').value,
      phone: form.querySelector('#clientPhone').value,
      whatsapp: form.querySelector('#clientWhatsapp').value,
      city: form.querySelector('#clientCity').value,
      notes: form.querySelector('#clientNotes').value
    };
    if (!payload.name) return alert('Client name required');
    const res = await window.fancyAPI.saveClient(payload);
    if (!res.success) return alert(res.error);
    toggleForm(false);
    loadClients();
  }

  loadClients();
};
