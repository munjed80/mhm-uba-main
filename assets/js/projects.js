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
