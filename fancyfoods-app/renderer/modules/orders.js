window.ordersModule = function (container) {
  const layout = document.createElement('div');
  layout.innerHTML = `
    <div class="module-header">
      <div>
        <h3>Orders</h3>
        <p class="text-muted mb-0">Create sales orders and track totals.</p>
      </div>
      <button class="btn btn-primary" id="addOrder">New Order</button>
    </div>
    <div id="orderForm" class="card card-compact mb-3 d-none">
      <div class="card-body">
        <div class="row g-3">
          <input type="hidden" id="orderId" />
          <div class="col-md-4">
            <label class="form-label">Client</label>
            <select class="form-select" id="orderClient"></select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Order Date</label>
            <input type="date" class="form-control" id="orderDate" />
          </div>
        </div>
        <div class="mt-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Items</h6>
            <button class="btn btn-sm btn-outline-primary" id="addItem">Add Item</button>
          </div>
          <div id="itemsContainer" class="vstack gap-3"></div>
        </div>
        <div class="mt-3 d-flex gap-3 align-items-center">
          <strong>Total: <span id="orderTotal">0.00</span></strong>
          <div class="flex-fill"></div>
          <button class="btn btn-success" id="saveOrder">Save Order</button>
          <button class="btn btn-secondary" id="cancelOrder">Cancel</button>
        </div>
      </div>
    </div>
    <table class="table table-hover align-middle" id="ordersTable">
      <thead>
        <tr>
          <th>#</th>
          <th>Client</th>
          <th>Date</th>
          <th>Total</th>
          <th class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  container.appendChild(layout);

  const form = layout.querySelector('#orderForm');
  const itemsContainer = layout.querySelector('#itemsContainer');
  const ordersTableBody = layout.querySelector('#ordersTable tbody');
  const totalEl = layout.querySelector('#orderTotal');

  layout.querySelector('#addOrder').addEventListener('click', () => toggleForm(true));
  layout.querySelector('#cancelOrder').addEventListener('click', () => toggleForm(false));
  layout.querySelector('#saveOrder').addEventListener('click', saveOrder);
  layout.querySelector('#addItem').addEventListener('click', addItemRow);
  ordersTableBody.addEventListener('click', (e) => {
    if (e.target.dataset.id) editOrder(e.target.dataset.id);
    if (e.target.dataset.remove) deleteOrder(e.target.dataset.remove);
  });

  async function loadClients() {
    const res = await window.fancyAPI.listClients();
    if (!res.success) return alert(res.error);
    const select = form.querySelector('#orderClient');
    select.innerHTML = '<option value="">Select client</option>';
    res.data.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  }

  async function loadProducts() {
    const res = await window.fancyAPI.listProducts();
    if (!res.success) return [];
    return res.data;
  }

  async function loadOrders() {
    const res = await window.fancyAPI.listOrders();
    if (!res.success) return alert(res.error);
    ordersTableBody.innerHTML = '';
    res.data.forEach((o) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${o.id}</td>
        <td>${o.client_name || ''}</td>
        <td>${o.order_date || ''}</td>
        <td>${Number(o.total_price || 0).toFixed(2)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" data-id="${o.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-remove="${o.id}">Delete</button>
        </td>
      `;
      ordersTableBody.appendChild(row);
    });
  }

  async function toggleForm(show) {
    form.classList.toggle('d-none', !show);
    if (show) {
      form.querySelector('#orderDate').value = new Date().toISOString().split('T')[0];
      await loadClients();
      itemsContainer.innerHTML = '';
      addItemRow();
    } else {
      form.querySelector('#orderId').value = '';
      itemsContainer.innerHTML = '';
      totalEl.textContent = '0.00';
    }
  }

  async function addItemRow(prefill) {
    const products = await loadProducts();
    const row = document.createElement('div');
    row.className = 'card card-compact p-3';
    row.innerHTML = `
      <div class="row g-2 align-items-end">
        <div class="col-md-4">
          <label class="form-label">Product</label>
          <select class="form-select product-select"></select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Quantity</label>
          <input type="number" step="0.01" class="form-control quantity" value="${prefill?.quantity || ''}" />
        </div>
        <div class="col-md-2">
          <label class="form-label">Price</label>
          <input type="number" step="0.01" class="form-control price" value="${prefill?.price || ''}" />
        </div>
        <div class="col-md-2">
          <label class="form-label">Line Total</label>
          <input type="text" class="form-control total" disabled value="0.00" />
        </div>
        <div class="col-md-2 text-end">
          <button class="btn btn-outline-danger remove-item">Remove</button>
        </div>
      </div>
    `;

    const select = row.querySelector('.product-select');
    products.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
    if (prefill?.product_id) select.value = prefill.product_id;

    row.addEventListener('input', calculateTotals);
    row.querySelector('.remove-item').addEventListener('click', () => {
      row.remove();
      calculateTotals();
    });

    itemsContainer.appendChild(row);
    calculateTotals();
  }

  function calculateTotals() {
    let total = 0;
    itemsContainer.querySelectorAll('.card').forEach((card) => {
      const qty = Number(card.querySelector('.quantity').value) || 0;
      const price = Number(card.querySelector('.price').value) || 0;
      const line = qty * price;
      card.querySelector('.total').value = line.toFixed(2);
      total += line;
    });
    totalEl.textContent = total.toFixed(2);
  }

  async function editOrder(id) {
    await toggleForm(true);
    const res = await window.fancyAPI.listOrders();
    const order = res.data.find((o) => o.id == id);
    if (!order) return;
    form.querySelector('#orderId').value = order.id;
    form.querySelector('#orderClient').value = order.client_id;
    form.querySelector('#orderDate').value = order.order_date;
    itemsContainer.innerHTML = '';
    const itemsRes = await window.fancyAPI.getOrderItems(order.id);
    itemsRes.data.forEach((item) => addItemRow(item));
    calculateTotals();
  }

  async function deleteOrder(id) {
    if (!confirm('Delete this order?')) return;
    const res = await window.fancyAPI.deleteOrder(Number(id));
    if (!res.success) return alert(res.error);
    loadOrders();
  }

  async function saveOrder() {
    const items = Array.from(itemsContainer.querySelectorAll('.card')).map((card) => ({
      product_id: Number(card.querySelector('.product-select').value),
      quantity: Number(card.querySelector('.quantity').value) || 0,
      price: Number(card.querySelector('.price').value) || 0
    }));
    const payload = {
      id: Number(form.querySelector('#orderId').value) || null,
      client_id: Number(form.querySelector('#orderClient').value),
      order_date: form.querySelector('#orderDate').value,
      total_price: Number(totalEl.textContent) || 0,
      items
    };
    if (!payload.client_id) return alert('Select a client');
    if (!items.length) return alert('Add at least one item');
    const res = await window.fancyAPI.saveOrder(payload);
    if (!res.success) return alert(res.error);
    toggleForm(false);
    loadOrders();
  }

  loadOrders();
};
