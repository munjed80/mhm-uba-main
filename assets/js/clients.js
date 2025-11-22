// clients.js — Enhanced client management with validation and pagination

let currentPage = 1;
let pageSize = 20;
let filteredClients = [];
// Note: clientsFormBound and clientsEditingId are defined in app.js

// Validation schema for clients
const clientValidationSchema = {
  'clients-name': { required: true, type: 'string' },
  'clients-email': { required: false, type: 'email' },
  'clients-company': { required: false, type: 'string' },
  'clients-phone': { required: false, type: 'phone' },
  'clients-notes': { required: false, type: 'string' }
};

function initClientsPage() {
  console.log('👥 Initializing enhanced clients page with validation and pagination');
  
  try {
    // Initialize pagination
    initClientsPagination();
    
    // Render clients with pagination
    if (typeof renderClientsPage === "function") {
      renderClientsPage();
      return;
    }
    
    // fallback: try to render clients table if present
    if (typeof window.renderClients === "function")
      return window.renderClients();
      
  } catch (e) {
    console.warn("initClientsPage error", e);
  }
}

function initClientsPagination() {
  // Add pagination container if it doesn't exist
  const table = document.getElementById("clients-page-table");
  if (table && !document.getElementById('clients-pagination')) {
    const paginationHtml = `
      <div id="clients-pagination" class="uba-pagination">
        <button id="clients-prev-page" class="uba-btn-ghost uba-btn-sm" disabled>Previous</button>
        <span id="clients-page-info" class="uba-page-info">Page 1 of 1</span>
        <button id="clients-next-page" class="uba-btn-ghost uba-btn-sm" disabled>Next</button>
      </div>
    `;
    table.parentElement.insertAdjacentHTML('afterend', paginationHtml);
    
    // Attach event listeners
    document.getElementById('clients-prev-page').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderClientsPage();
      }
    });
    
    document.getElementById('clients-next-page').addEventListener('click', () => {
      const totalPages = Math.ceil(filteredClients.length / pageSize);
      if (currentPage < totalPages) {
        currentPage++;
        renderClientsPage();
      }
    });
  }
}

function updateClientsPagination() {
  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const prevBtn = document.getElementById('clients-prev-page');
  const nextBtn = document.getElementById('clients-next-page');
  const pageInfo = document.getElementById('clients-page-info');
  
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${Math.max(1, totalPages)} (${filteredClients.length} total)`;
}

function getPagedClients() {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return filteredClients.slice(startIndex, endIndex);
}

async function editClient(id) {
  // Use Supabase store if available, otherwise fall back to localStorage
  const store = window.SupabaseStore || window.ubaStore;
  
  let client = null;
  if (window.SupabaseStore) {
    client = await store.clients.get(id);
  } else {
    const clients = (store && store.clients.getAll()) || [];
    client = clients.find(c => c.id === id);
  }
  
  if (!client) return;
  
  clientsEditingId = id;
  
  // Populate form
  const nameInput = document.getElementById("clients-name");
  const emailInput = document.getElementById("clients-email");
  const companyInput = document.getElementById("clients-company");
  const phoneInput = document.getElementById("clients-phone");
  const notesInput = document.getElementById("clients-notes");
  const submitBtn = document.querySelector("#clients-page-form button[type='submit']");
  
  if (nameInput) nameInput.value = client.name || "";
  if (emailInput) emailInput.value = client.email || "";
  if (companyInput) companyInput.value = client.company || "";
  if (phoneInput) phoneInput.value = client.phone || "";
  if (notesInput) notesInput.value = client.notes || "";
  if (submitBtn) submitBtn.textContent = "Update Client";
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose globally for page-loader
window.initClientsPage = initClientsPage;
window.editClient = editClient;
