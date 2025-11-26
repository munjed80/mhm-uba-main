window.brokerModule = function (container) {
  const layout = document.createElement('div');
  layout.innerHTML = `
    <div class="module-header">
      <div>
        <h3>Broker Deals</h3>
        <p class="text-muted mb-0">Manage rice, starch, coffee, spices and more.</p>
      </div>
      <button class="btn btn-primary" id="addDeal">New Deal</button>
    </div>
    <div id="dealForm" class="card card-compact mb-3 d-none">
      <div class="card-body">
        <div class="row g-3">
          <input type="hidden" id="dealId" />
          <div class="col-md-3">
            <label class="form-label">Trader Name</label>
            <input class="form-control" id="dealTrader" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Product</label>
            <input class="form-control" id="dealProduct" placeholder="Rice, coffee, spices..." />
          </div>
          <div class="col-md-2">
            <label class="form-label">Quantity (tons)</label>
            <input type="number" class="form-control" id="dealQty" step="0.01" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Price/Ton</label>
            <input type="number" class="form-control" id="dealPrice" step="0.01" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Supplier</label>
            <input class="form-control" id="dealSupplier" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Status</label>
            <select class="form-select" id="dealStatus">
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div class="col-12">
            <label class="form-label">Notes</label>
            <textarea class="form-control" id="dealNotes" rows="2"></textarea>
          </div>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-success" id="saveDeal">Save Deal</button>
          <button class="btn btn-secondary" id="cancelDeal">Cancel</button>
        </div>
      </div>
    </div>
    <div class="table-responsive">
      <table class="table align-middle" id="dealsTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Trader</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price/Ton</th>
            <th>Supplier</th>
            <th>Status</th>
            <th>Attachments</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  container.appendChild(layout);
  const form = layout.querySelector('#dealForm');
  const tableBody = layout.querySelector('#dealsTable tbody');

  layout.querySelector('#addDeal').addEventListener('click', () => toggleForm(true));
  layout.querySelector('#cancelDeal').addEventListener('click', () => toggleForm(false));
  layout.querySelector('#saveDeal').addEventListener('click', saveDeal);

  tableBody.addEventListener('click', (e) => {
    if (e.target.dataset.id) editDeal(e.target.dataset.id);
    if (e.target.dataset.remove) deleteDeal(e.target.dataset.remove);
    if (e.target.dataset.attach) attachFile(e.target.dataset.attach);
  });

  async function loadDeals() {
    const res = await window.fancyAPI.listDeals();
    if (!res.success) return alert(res.error);
    tableBody.innerHTML = '';
    for (const d of res.data) {
      const attachments = (await listAttachments(d.id)).join(', ');
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${d.id}</td>
        <td>${d.trader_name || ''}</td>
        <td>${d.product || ''}</td>
        <td>${d.quantity || 0}</td>
        <td>${d.price_per_ton || 0}</td>
        <td>${d.supplier || ''}</td>
        <td><span class="badge ${d.status === 'closed' ? 'bg-success' : 'bg-warning text-dark'}">${d.status}</span></td>
        <td>${attachments || 'None'}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary me-1" data-attach="${d.id}">Attach</button>
          <button class="btn btn-sm btn-outline-primary me-1" data-id="${d.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-remove="${d.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    }
  }

  async function listAttachments(id) {
    const res = await window.fancyAPI.getAttachmentPath(id);
    if (!res || !res.data) return [];
    try {
      return window.fancyAPI.readDir(res.data) || [];
    } catch (e) {
      return [];
    }
  }

  function toggleForm(show) {
    form.classList.toggle('d-none', !show);
    if (!show) form.querySelector('#dealId').value = '';
  }

  async function editDeal(id) {
    const res = await window.fancyAPI.listDeals();
    const deal = res.data.find((d) => d.id == id);
    if (!deal) return;
    toggleForm(true);
    form.querySelector('#dealId').value = deal.id;
    form.querySelector('#dealTrader').value = deal.trader_name || '';
    form.querySelector('#dealProduct').value = deal.product || '';
    form.querySelector('#dealQty').value = deal.quantity || '';
    form.querySelector('#dealPrice').value = deal.price_per_ton || '';
    form.querySelector('#dealSupplier').value = deal.supplier || '';
    form.querySelector('#dealStatus').value = deal.status || 'open';
    form.querySelector('#dealNotes').value = deal.notes || '';
  }

  async function deleteDeal(id) {
    if (!confirm('Delete this deal?')) return;
    const res = await window.fancyAPI.deleteDeal(Number(id));
    if (!res.success) return alert(res.error);
    loadDeals();
  }

  async function saveDeal() {
    const payload = {
      id: Number(form.querySelector('#dealId').value) || null,
      trader_name: form.querySelector('#dealTrader').value,
      product: form.querySelector('#dealProduct').value,
      quantity: Number(form.querySelector('#dealQty').value) || 0,
      price_per_ton: Number(form.querySelector('#dealPrice').value) || 0,
      supplier: form.querySelector('#dealSupplier').value,
      status: form.querySelector('#dealStatus').value,
      notes: form.querySelector('#dealNotes').value
    };
    const res = await window.fancyAPI.saveDeal(payload);
    if (!res.success) return alert(res.error);
    toggleForm(false);
    loadDeals();
  }

  async function attachFile(id) {
    const res = await window.fancyAPI.attachFileToDeal(Number(id));
    if (!res.success) return alert(res.error);
    alert('File attached');
    loadDeals();
  }

  loadDeals();
};
