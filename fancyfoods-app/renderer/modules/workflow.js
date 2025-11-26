window.workflowModule = function (container) {
  const layout = document.createElement('div');
  layout.innerHTML = `
    <div class="module-header">
      <div>
        <h3>Daily Workflow</h3>
        <p class="text-muted mb-0">Automated checklist for the day.</p>
      </div>
      <button class="btn btn-outline-primary" id="refreshWorkflow">Refresh</button>
    </div>
    <div class="row" id="workflowCards"></div>
  `;
  container.appendChild(layout);

  layout.querySelector('#refreshWorkflow').addEventListener('click', buildWorkflow);

  async function buildWorkflow() {
    const cards = layout.querySelector('#workflowCards');
    cards.innerHTML = '';

    const orders = await window.fancyAPI.listOrders();
    const products = await window.fancyAPI.listProducts();
    const deals = await window.fancyAPI.listDeals();

    const sections = [
      {
        title: 'Step 1: Review new orders',
        items: (orders.data || []).map((o) => `Order #${o.id} - ${o.client_name || 'Client'} (${o.order_date})`)
      },
      {
        title: 'Step 2: Check inventory low stock',
        items: (products.data || [])
          .filter((p) => Number(p.price) <= 0)
          .map((p) => `${p.name} needs pricing/stock check`)
      },
      {
        title: 'Step 3: Pending brokerage deals',
        items: (deals.data || [])
          .filter((d) => d.status === 'open')
          .map((d) => `${d.product} with ${d.trader_name || 'Trader'} (${d.quantity} tons)`) || []
      },
      {
        title: 'Step 4: Prepare shipments',
        items: (orders.data || []).map((o) => `Schedule shipment for order #${o.id}`)
      },
      {
        title: 'Step 5: Contact traders',
        items: (deals.data || []).map((d) => `Follow up with ${d.trader_name || 'Trader'}`)
      }
    ];

    sections.forEach((section) => {
      const card = document.createElement('div');
      card.className = 'col-md-6 mb-3';
      card.innerHTML = `
        <div class="card card-compact h-100">
          <div class="card-body">
            <h5 class="card-title">${section.title}</h5>
            <ul class="list-group list-group-flush">
              ${section.items
                .map((item) => `<li class="list-group-item d-flex align-items-center"><input class="form-check-input me-2" type="checkbox"/> ${item}</li>`)
                .join('') || '<li class="list-group-item text-muted">No items</li>'}
            </ul>
          </div>
        </div>
      `;
      cards.appendChild(card);
    });
  }

  buildWorkflow();
};
