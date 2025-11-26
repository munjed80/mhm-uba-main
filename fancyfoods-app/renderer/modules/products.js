window.productsModule = function (container) {
  const layout = document.createElement('div');
  layout.innerHTML = `
    <div class="module-header">
      <div>
        <h3>Products</h3>
        <p class="text-muted mb-0">Manage nuts, seeds, mixed and roasted goods.</p>
      </div>
      <div class="d-flex gap-2">
        <input class="form-control" placeholder="Search products" id="productSearch" />
        <button class="btn btn-primary" id="addProduct">Add Product</button>
      </div>
    </div>
    <div id="productForm" class="card card-compact mb-3 d-none">
      <div class="card-body">
        <div class="row g-3">
          <input type="hidden" id="productId" />
          <div class="col-md-4">
            <label class="form-label">Name</label>
            <input class="form-control" id="productName" required />
          </div>
          <div class="col-md-3">
            <label class="form-label">Category</label>
            <select class="form-select" id="productCategory">
              <option value="nuts">Nuts</option>
              <option value="seeds">Seeds</option>
              <option value="mixed">Mixed</option>
              <option value="roasted">Roasted</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Unit</label>
            <select class="form-select" id="productUnit">
              <option value="kg">Kg</option>
              <option value="box">Box</option>
              <option value="bag">Bag</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Price</label>
            <input type="number" class="form-control" id="productPrice" step="0.01" />
          </div>
          <div class="col-12">
            <label class="form-label">Notes</label>
            <textarea class="form-control" id="productNotes" rows="2"></textarea>
          </div>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-success" id="saveProduct">Save</button>
          <button class="btn btn-secondary" id="cancelProduct">Cancel</button>
        </div>
      </div>
    </div>
    <table class="table table-hover align-middle" id="productsTable">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Unit</th>
          <th class="text-end">Price</th>
          <th>Notes</th>
          <th class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  container.appendChild(layout);

  const tableBody = layout.querySelector('#productsTable tbody');
  const searchInput = layout.querySelector('#productSearch');
  const form = layout.querySelector('#productForm');
  const addBtn = layout.querySelector('#addProduct');

  addBtn.addEventListener('click', () => toggleForm(true));
  layout.querySelector('#cancelProduct').addEventListener('click', () => toggleForm(false));
  layout.querySelector('#saveProduct').addEventListener('click', saveProduct);
  searchInput.addEventListener('input', () => loadProducts(searchInput.value));

  async function loadProducts(term = '') {
    const res = term ? await window.fancyAPI.searchProducts(term) : await window.fancyAPI.listProducts();
    if (!res.success) return alert(res.error);
    tableBody.innerHTML = '';
    res.data.forEach((p) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.name}</td>
        <td><span class="badge bg-light text-dark text-capitalize">${p.category || ''}</span></td>
        <td>${p.unit || ''}</td>
        <td class="text-end">${Number(p.price || 0).toFixed(2)}</td>
        <td>${p.notes || ''}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" data-id="${p.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-remove="${p.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  tableBody.addEventListener('click', (e) => {
    if (e.target.dataset.id) {
      editProduct(e.target.dataset.id);
    }
    if (e.target.dataset.remove) {
      deleteProduct(e.target.dataset.remove);
    }
  });

  function toggleForm(show) {
    form.classList.toggle('d-none', !show);
    if (!show) {
      form.querySelector('form')?.reset?.();
      form.querySelector('#productId').value = '';
    }
  }

  async function editProduct(id) {
    const res = await window.fancyAPI.listProducts();
    const product = res.data.find((p) => p.id == id);
    if (!product) return;
    toggleForm(true);
    form.querySelector('#productId').value = product.id;
    form.querySelector('#productName').value = product.name;
    form.querySelector('#productCategory').value = product.category || 'nuts';
    form.querySelector('#productUnit').value = product.unit || 'kg';
    form.querySelector('#productPrice').value = product.price;
    form.querySelector('#productNotes').value = product.notes || '';
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    const res = await window.fancyAPI.deleteProduct(Number(id));
    if (!res.success) return alert(res.error);
    loadProducts();
  }

  async function saveProduct() {
    const payload = {
      id: Number(form.querySelector('#productId').value) || null,
      name: form.querySelector('#productName').value,
      category: form.querySelector('#productCategory').value,
      unit: form.querySelector('#productUnit').value,
      price: Number(form.querySelector('#productPrice').value) || 0,
      notes: form.querySelector('#productNotes').value
    };
    if (!payload.name) return alert('Product name required');
    const res = await window.fancyAPI.saveProduct(payload);
    if (!res.success) return alert(res.error);
    toggleForm(false);
    loadProducts();
  }

  loadProducts();
};
