// files.js — files page initializer
(function () {
  function renderFilesTable(store) {
    const body = document.getElementById('files-body');
    if (!body) return;

    const files = (store && store.files && typeof store.files.getAll === 'function' && store.files.getAll()) || window.ubaFiles || [];
    body.innerHTML = '';

    files.forEach((file) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${file.name}</td><td>${file.type}</td><td>${file.linked}</td><td>${file.updated}</td>`;

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'uba-btn-link';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => {
        const name = prompt('File name', file.name) || file.name;
        const type = prompt('Type', file.type) || file.type;
        const linked = prompt('Linked to', file.linked) || file.linked;
        const updated = prompt('Updated (YYYY-MM-DD)', file.updated) || file.updated;
        if (store && store.files && typeof store.files.update === 'function') {
          store.files.update(file.id, { name, type, linked, updated });
          renderFilesTable(store);
        }
      });

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'uba-btn-link';
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        if (!confirm('Delete file?')) return;
        if (store && store.files && typeof store.files.delete === 'function') {
          store.files.delete(file.id);
          renderFilesTable(store);
        }
      });

      const actions = document.createElement('td');
      actions.appendChild(edit);
      actions.appendChild(del);
      row.appendChild(actions);
      body.appendChild(row);
    });
  }

  function mountAddControls(store) {
    const header = document.querySelector('.uba-card-header');
    if (!header || document.getElementById('file-add')) return;

    const bar = document.createElement('div');
    bar.style.display = 'flex';
    bar.style.gap = '8px';
    bar.style.marginTop = '8px';
    bar.innerHTML = `
      <input id="file-name" placeholder="File name" style="flex:1;" />
      <input id="file-type" placeholder="Type" style="width:120px;" />
      <input id="file-linked" placeholder="Linked to" style="width:160px;" />
      <input id="file-updated" type="date" style="width:140px;" />
      <button id="file-add" class="uba-btn-primary">Add</button>
    `;

    header.appendChild(bar);

    const addBtn = bar.querySelector('#file-add');
    addBtn.addEventListener('click', () => {
      const name = document.getElementById('file-name').value.trim();
      if (!name) {
        alert('Name required');
        return;
      }
      const type = document.getElementById('file-type').value.trim() || 'File';
      const linked = document.getElementById('file-linked').value.trim() || '';
      const updated = document.getElementById('file-updated').value || new Date().toISOString().slice(0, 10);
      if (store && store.files && typeof store.files.create === 'function') {
        store.files.create({ name, type, linked, updated });
        renderFilesTable(store);
      }
      document.getElementById('file-name').value = '';
      document.getElementById('file-type').value = '';
      document.getElementById('file-linked').value = '';
      document.getElementById('file-updated').value = '';
    });
  }

  function initFilesPage() {
    const store = window.ubaStore;
    renderFilesTable(store);
    mountAddControls(store);
  }

  window.initFilesPage = initFilesPage;
})();
