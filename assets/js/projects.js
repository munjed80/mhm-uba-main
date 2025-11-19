// assets/js/projects.js — Projects page renderer and CRUD (localStorage via ubaStore)
(function () {
  function qs(id) { return document.getElementById(id); }

  function formatCurrency(n) {
    try { return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }); } catch (e) { return n; }
  }

  function renderProjects() {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    const list = store.projects.getAll() || [];

    const cols = {
      leads: qs('projects-leads'),
      in_progress: qs('projects-inprogress'),
      ongoing: qs('projects-ongoing'),
      completed: qs('projects-completed')
    };

    Object.values(cols).forEach(c => { if (c) c.innerHTML = ''; });

    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'uba-support-card';
      card.style.marginBottom = '8px';

      const title = document.createElement('h4'); title.style.margin = '0'; title.textContent = p.title || 'Untitled';
      const meta = document.createElement('div'); meta.style.fontSize = '13px'; meta.style.color = 'var(--muted, #6b7280)';
      meta.textContent = (p.client ? p.client + ' • ' : '') + (p.budget ? '€ ' + formatCurrency(p.budget) : '');

      const actions = document.createElement('div'); actions.style.marginTop = '8px';
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'uba-btn-link'; edit.textContent = 'Edit';
      const del = document.createElement('button'); del.type = 'button'; del.className = 'uba-btn-link'; del.textContent = 'Delete';

      edit.addEventListener('click', () => openEditForm(p.id));
      del.addEventListener('click', () => {
        if (!confirm('Delete project?')) return;
        try { store.projects.delete(p.id); renderProjects(); } catch (e) { console.warn(e); }
      });

      actions.appendChild(edit); actions.appendChild(del);

      const notes = document.createElement('div'); notes.style.marginTop = '6px'; notes.style.fontSize = '13px'; notes.textContent = p.notes || '';

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(notes);
      card.appendChild(actions);

      const target = cols[p.stage] || cols.leads;
      if (target) target.appendChild(card);
    });
  }

  function showModal() { const m = qs('project-form-modal'); if (!m) return; m.classList.remove('is-hidden'); m.setAttribute('aria-hidden','false'); }
  function hideModal() { const m = qs('project-form-modal'); if (!m) return; m.classList.add('is-hidden'); m.setAttribute('aria-hidden','true'); }

  function openAddForm() {
    qs('project-id').value = '';
    qs('project-title').value = '';
    qs('project-client').value = '';
    qs('project-budget').value = '';
    qs('project-stage').value = 'leads';
    qs('project-notes').value = '';
    showModal();
    qs('project-title').focus();
  }

  function openEditForm(id) {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    const p = store.projects.get(id);
    if (!p) return;
    qs('project-id').value = p.id;
    qs('project-title').value = p.title || '';
    qs('project-client').value = p.client || '';
    qs('project-budget').value = p.budget || '';
    qs('project-stage').value = p.stage || 'leads';
    qs('project-notes').value = p.notes || '';
    showModal();
    qs('project-title').focus();
  }

  function bindForm() {
    const form = qs('project-form');
    if (!form) return;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const store = window.ubaStore;
      if (!store || !store.projects) return;
      const id = qs('project-id').value;
      const payload = {
        title: qs('project-title').value.trim(),
        client: qs('project-client').value.trim(),
        budget: Number(qs('project-budget').value) || 0,
        stage: qs('project-stage').value || 'leads',
        notes: qs('project-notes').value.trim()
      };
      try {
        if (id) {
          store.projects.update(id, payload);
        } else {
          store.projects.create(payload);
        }
        hideModal();
        renderProjects();
      } catch (e) { console.warn('project save error', e); }
    });

    const cancel = qs('project-cancel'); if (cancel) cancel.addEventListener('click', (e) => { e.preventDefault(); hideModal(); });
    const close = qs('project-form-close'); if (close) close.addEventListener('click', () => hideModal());
  }

  function initProjectsPage() {
    try {
      // wire add button
      const add = qs('add-project-btn'); if (add) add.addEventListener('click', openAddForm);

      bindForm();

      // initial render
      renderProjects();

      // expose for debugging
      window.renderProjectsStandalone = renderProjects;
    } catch (e) { console.warn('initProjectsPage error', e); }
  }

  // expose
  window.initProjectsPage = initProjectsPage;
  window.renderProjectsStandalone = renderProjects;

  // auto-init if page is present
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (document.getElementById('projects-leads') || document.getElementById('projects-inprogress')) {
      try { initProjectsPage(); } catch (e) {}
    }
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('projects-leads') || document.getElementById('projects-inprogress')) {
        try { initProjectsPage(); } catch (e) {}
      }
    });
  }

})();
// assets/js/projects.js — standalone Projects pipeline renderer
(function () {
  function safeText(value) {
    if (typeof window.escapeHtml === 'function') {
      return window.escapeHtml(value || '');
    }
    return (value || '').toString().replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c;
    });
  }

  function cloneStages() {
    try {
      const store = window.ubaStore;
      if (store && store.projects && typeof store.projects.getAll === 'function') {
        const items = store.projects.getAll() || [];
        return JSON.parse(JSON.stringify(items));
      }
      if (typeof ensureSeedData === 'function' && typeof LOCAL_KEYS !== 'undefined') {
        const data = ensureSeedData(LOCAL_KEYS.projects, projectStagesSeed || []);
        return JSON.parse(JSON.stringify(data || []));
      }
    } catch (e) {
      console.warn('renderProjectsStandalone: failed to load data', e);
    }
    if (typeof projectStagesSeed !== 'undefined') {
      return JSON.parse(JSON.stringify(projectStagesSeed || []));
    }
    return [];
  }

  const COLUMN_MATCHERS = [
    { key: 'projects-leads', matches: ['lead', 'discovery', 'prospect'] },
    { key: 'projects-inprogress', matches: ['progress', 'proposal', 'active'] },
    { key: 'projects-ongoing', matches: ['ongoing', 'delivery', 'execution'] },
    { key: 'projects-completed', matches: ['complete', 'completed', 'maintenance', 'done'] },
  ];

  function pullStage(pool, matches) {
    const idx = pool.findIndex((stage) => {
      const id = (stage.id || '').toString().toLowerCase();
      const title = (stage.title || stage.name || '').toString().toLowerCase();
      return matches.some((token) => id.includes(token) || title.includes(token));
    });
    if (idx !== -1) {
      return pool.splice(idx, 1)[0];
    }
    return pool.length ? pool.splice(0, 1)[0] : null;
  }

  function buildProjectCard(item, onSelect) {
    const card = document.createElement('div');
    card.className = 'uba-pipe-item';
    card.tabIndex = 0;
    card.dataset.projectId = item.id || '';
    const note = item.note || item.status || '';
    const valueLine = item.value || item.budget || '';
    card.innerHTML = `
      <p class="uba-pipe-title">${safeText(item.name || 'Untitled project')}</p>
      <p class="uba-pipe-meta">${safeText(item.client || '')}</p>
      <div class="uba-chip-row">
        ${valueLine ? `<span class="uba-chip">${safeText(valueLine)}</span>` : ''}
        ${note ? `<span class="uba-chip soft">${safeText(note)}</span>` : ''}
      </div>
    `;
    if (typeof onSelect === 'function') {
      const handler = (evt) => {
        evt.preventDefault();
        onSelect(item, card);
      };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          handler(evt);
        }
      });
    }
    return card;
  }

  function renderColumn(container, stage, onSelect, selectedId) {
    if (!container) return;
    container.innerHTML = '';
    const items = stage && Array.isArray(stage.items)
      ? stage.items
      : stage && Array.isArray(stage.projects)
      ? stage.projects
      : [];
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'uba-pipe-item';
      empty.textContent = 'No projects in this stage yet.';
      container.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const card = buildProjectCard(item, onSelect);
      if (selectedId && item.id === selectedId) {
        card.classList.add('is-active');
      }
      container.appendChild(card);
    });
  }

  function updateDetailPanel(item, card) {
    const panel = document.getElementById('project-detail-drawer');
    if (!panel) return;
    if (!item) {
      panel.textContent = 'No project selected.';
      panel.removeAttribute('data-project-id');
      return;
    }
    try {
      document.querySelectorAll('[data-project-id]').forEach((node) => node.classList && node.classList.remove('is-active'));
      if (card && card.classList) card.classList.add('is-active');
    } catch (e) { /* ignore */ }
    panel.dataset.projectId = item.id || '';
    panel.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div>
          <h3 style="margin:0;">${safeText(item.name || 'Untitled project')}</h3>
          <p style="margin:2px 0;color:var(--muted);">${safeText(item.client || '')}</p>
        </div>
        <div class="uba-chip-row">
          ${item.value || item.budget ? `<span class="uba-chip">${safeText(item.value || item.budget)}</span>` : ''}
          ${item.note ? `<span class="uba-chip soft">${safeText(item.note)}</span>` : ''}
        </div>
        ${item.description ? `<p style="margin:6px 0;white-space:pre-wrap;">${safeText(item.description)}</p>` : ''}
      </div>
    `;
  }

  function renderProjectsStandalone() {
    const containers = COLUMN_MATCHERS.map((cfg) => ({ id: cfg.key, el: document.getElementById(cfg.key), matches: cfg.matches }));
    if (!containers.some((c) => c.el)) return;

    const stages = cloneStages();
    const stagePool = Array.isArray(stages) ? stages.slice() : [];
    const detailPanel = document.getElementById('project-detail-drawer');
    const selectedId = detailPanel ? detailPanel.dataset.projectId : '';

    containers.forEach((cfg, idx) => {
      if (!cfg.el) return;
      const stage = pullStage(stagePool, cfg.matches || []);
      renderColumn(cfg.el, stage || { items: [] }, updateDetailPanel, selectedId);
    });

    // Ensure detail panel has a default message
    if (detailPanel && !detailPanel.dataset.projectId) {
      detailPanel.textContent = 'No project selected.';
    }
  }

  function initProjectsPage() {
    try {
      renderProjectsStandalone();
    } catch (err) {
      console.warn('initProjectsPage error', err);
    }
  }

  window.renderProjectsStandalone = renderProjectsStandalone;
  window.initProjectsPage = initProjectsPage;
})();
