// assets/js/assistant.js — UBA Assistant (improved)
(function () {
  if (window.ubaAssistant) return; // preserve existing instance

  // Small knowledge base for local assistant
  const KB = [
    { section: 'dashboard', tags: ['kpi','revenue','invoices','metrics'], answer: 'The dashboard shows KPIs from invoices, tasks and clients. Use demo mode to explore sample data or connect Supabase to sync real data.', navigateTo: 'index' },
    { section: 'clients', tags: ['client','crm','contact','clients'], answer: 'Clients live in the Clients view. You can add, edit, and delete contacts there. Use the export button to download CSV of your clients.', navigateTo: 'clients' },
    { section: 'invoices', tags: ['invoice','billing','payment','invoices'], answer: 'Invoices are created and managed in the Invoices view. Use the mini-invoice form on the dashboard for quick entries. Mark invoices as paid when you receive payment.', navigateTo: 'invoices' },
    { section: 'projects', tags: ['project','pipeline','stage','projects'], answer: 'Projects are arranged in a pipeline. Move a card between columns to update its stage. Click a card to see more details or edit.', navigateTo: 'projects' },
    { section: 'tasks', tags: ['task','todo','in_progress','done','tasks'], answer: 'Tasks are on the Tasks board and on the dashboard. Create quick tasks or move them between columns; mark them done when complete.', navigateTo: 'tasks' },
    { section: 'smarttools', tags: ['assistant','smart','tools','uba assistant'], answer: 'UBA Smart Tools contains assistants and utilities. Open the Assistant card to get contextual help or suggestions.', navigateTo: 'smart-tools' },
    { section: 'settings', tags: ['settings','preferences','workspace','language'], answer: 'Workspace settings let you change language, timezone, and toggle single-page navigation. Reset demo data from Settings if you want to start fresh.', navigateTo: 'settings' },
    { section: 'global', tags: ['help','how','what','where'], answer: "Ask about Dashboard, Clients, Projects, Tasks, or Invoices. Try: 'How do I add a client?' or 'How do I connect Supabase?'." }
  ];

  // Utilities
  function escapeHtml(str) {
    return (str || '').toString().replace(/[&<>\\\"]/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[s] || s;
    });
  }

  function nowTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Create assistant UI only once
  function createAssistantUI() {
    if (document.getElementById('uba-assistant-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'uba-assistant-panel';
    panel.className = 'uba-card uba-assistant-panel is-hidden';
    panel.innerHTML = `
      <div class="uba-card-header uba-assistant-header">
        <div>
          <div class="uba-card-title">UBA Assistant</div>
          <div class="uba-card-sub">Contextual help — local assistant</div>
        </div>
        <button id="uba-assistant-close" class="uba-btn-ghost" aria-label="Close assistant">✕</button>
      </div>
      <div class="uba-assistant-messages" aria-live="polite"></div>
      <div class="uba-assistant-input-row">
        <input id="uba-assistant-input" class="uba-assistant-input" placeholder="Ask UBA a question, e.g. 'How do I add a client?'" aria-label="Assistant input" />
        <button id="uba-assistant-send" class="uba-btn-primary">Send</button>
      </div>
    `;

    document.body.appendChild(panel);

    // Floating open button (if not already present)
    if (!document.getElementById('uba-assistant-fab')) {
      const fab = document.createElement('button');
      fab.id = 'uba-assistant-fab';
      fab.className = 'uba-assistant-fab uba-btn-primary';
      fab.title = 'Open UBA Assistant';
      fab.innerHTML = '🤖';
      fab.addEventListener('click', () => openAssistant());
      document.body.appendChild(fab);
    }

    bindAssistantControls();
  }

  // Render helpers
  function renderAssistantMessage(role, payload) {
    // payload: { text: string, suggestions?: [string], actions?: [{label, type, target}] }
    const convo = document.querySelector('.uba-assistant-messages');
    if (!convo) return;

    const wrapper = document.createElement('div');
    wrapper.className = `assistant-msg ${role}`;

    const meta = document.createElement('div');
    meta.className = 'assistant-meta';
    meta.innerHTML = `<span class="assistant-role">${role === 'user' ? 'You' : 'UBA'}</span><span class="assistant-time">${nowTime()}</span>`;

    const bubble = document.createElement('div');
    bubble.className = `uba-assistant-bubble ${role === 'user' ? 'user' : 'bot'}`;
    bubble.innerHTML = escapeHtml(payload.text || '').replace(/\n/g, '<br/>');

    wrapper.appendChild(meta);
    wrapper.appendChild(bubble);

    // suggestions (chips)
    if (payload.suggestions && Array.isArray(payload.suggestions) && payload.suggestions.length) {
      const chips = document.createElement('div');
      chips.className = 'assistant-chips';
      payload.suggestions.forEach(s => {
        const c = document.createElement('button');
        c.className = 'uba-chip uba-assist-suggest';
        c.type = 'button';
        c.textContent = s;
        c.addEventListener('click', () => setInputAndSend(s));
        chips.appendChild(c);
      });
      wrapper.appendChild(chips);
    }

    // actions (buttons like Open Clients)
    if (payload.actions && Array.isArray(payload.actions) && payload.actions.length) {
      const actionsRow = document.createElement('div');
      actionsRow.className = 'assistant-actions';
      payload.actions.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'uba-btn-ghost assistant-action-btn';
        btn.type = 'button';
        btn.textContent = a.label;
        btn.addEventListener('click', () => {
          handleAction(a);
        });
        actionsRow.appendChild(btn);
      });
      wrapper.appendChild(actionsRow);
    }

    convo.appendChild(wrapper);
    convo.scrollTop = convo.scrollHeight;
  }

  function appendUserMessage(text) {
    renderAssistantMessage('user', { text });
    // store conversation history in-memory
    window._uba_conversation = window._uba_conversation || [];
    window._uba_conversation.push({ role: 'user', text, time: new Date().toISOString() });
  }

  function appendBotMessage(obj) {
    renderAssistantMessage('bot', obj);
    window._uba_conversation = window._uba_conversation || [];
    window._uba_conversation.push({ role: 'assistant', text: obj.text, time: new Date().toISOString() });
  }

  // Simple KB lookup
  function findKBEntry(question) {
    const q = (question || '').toLowerCase();
    // prefer tag matches
    for (const entry of KB) {
      for (const tag of entry.tags) {
        if (q.includes(tag.toLowerCase())) return entry;
      }
    }
    // fallback: section match or generic
    return KB.find(e => e.section === 'global') || null;
  }

  // Compose a richer reply object
  function composeReply(question) {
    const entry = findKBEntry(question);
    const suggestions = [];
    const actions = [];

    if (entry) {
      // suggestions: follow-up prompts
      suggestions.push('Show me steps');
      suggestions.push('Open the page');
      suggestions.push('How do I export data?');

      // action to navigate if available
      if (entry.navigateTo) {
        actions.push({ label: `Open ${capitalize(entry.navigateTo)}`, type: 'navigate', target: entry.navigateTo });
      }

      const text = entry.answer;
      return { text, suggestions, actions };
    }

    // default fallback
    return {
      text: "I didn't fully understand. Try asking about Clients, Invoices, Projects, or Tasks. You can also ask 'How do I add a client?' or 'How do I reset demo data?'.",
      suggestions: ['How do I add a client?', 'How do I create an invoice?', 'Reset demo data'],
      actions: []
    };
  }

  function capitalize(s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); }

  // Action handler
  function handleAction(action) {
    if (!action || !action.type) return;
    if (action.type === 'navigate') {
      const target = action.target;
      try {
        // If page-loader is available, call it; otherwise navigate to standalone page
        if (typeof window.loadPageScripts === 'function') {
          // try load script (initializes widgets) then navigate if not index
          window.loadPageScripts(target + '-page');
        }
      } catch (e) {
        // ignore
      }
      // For explicit navigation prefer opening the standalone page
      try { window.location.href = `${target}.html`; } catch (e) {}
    }
    if (action.type === 'run') {
      // run a named function if exists
      try { if (typeof window[action.target] === 'function') window[action.target](); } catch (e) { console.warn(e); }
    }
  }

  // Main responder
  function respond(question) {
    // show typing indicator
    appendBotMessage({ text: 'Thinking...' });
    setTimeout(() => {
      // remove the last 'Thinking...' bubble
      const convo = document.querySelector('.uba-assistant-messages');
      if (convo) {
        const msgs = convo.querySelectorAll('.assistant-msg.bot .uba-assistant-bubble');
        if (msgs && msgs.length) {
          const last = msgs[msgs.length - 1];
          if (last && last.textContent.trim() === 'Thinking...') {
            const parent = last.closest('.assistant-msg.bot');
            if (parent) parent.remove();
          }
        }
      }

      const reply = composeReply(question);
      // make reply text clearer: add a short lead when appropriate
      const lead = '';
      appendBotMessage({ text: (lead ? lead + '\n\n' : '') + reply.text, suggestions: reply.suggestions, actions: reply.actions });

      // after reply, offer quick feedback chips
      appendBotMessage({ text: 'Did this help?', suggestions: ['Yes', 'No'], actions: [] });
    }, 400);
  }

  // Bind UI controls
  let bound = false;
  function bindAssistantControls() {
    if (bound) return; bound = true;
    const panel = document.getElementById('uba-assistant-panel');
    if (!panel) return;
    const close = panel.querySelector('#uba-assistant-close');
    const send = panel.querySelector('#uba-assistant-send');
    const input = panel.querySelector('#uba-assistant-input');

    if (close) close.addEventListener('click', closeAssistant);
    if (send) send.addEventListener('click', () => { const v = input.value.trim(); if (!v) return; appendUserMessage(v); input.value = ''; respond(v); });
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send.click(); } if (e.key === 'Escape') closeAssistant(); });

    // delegate suggestion chips and action buttons
    document.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!t) return;
      if (t.classList && t.classList.contains('uba-assist-suggest')) {
        const q = t.textContent.trim(); setInputAndSend(q); return;
      }
      if (t.classList && t.classList.contains('assistant-action-btn')) {
        // action buttons already have click handlers attached directly on creation
      }
    });
  }

  function openAssistant() {
    createAssistantUI();
    const panel = document.getElementById('uba-assistant-panel');
    if (!panel) return;
    panel.classList.remove('is-hidden');
    panel.setAttribute('aria-hidden', 'false');
    const input = panel.querySelector('#uba-assistant-input');
    if (input) input.focus();
  }

  function closeAssistant() {
    const panel = document.getElementById('uba-assistant-panel');
    if (!panel) return;
    panel.classList.add('is-hidden');
    panel.setAttribute('aria-hidden', 'true');
  }

  function setInputAndSend(text) {
    const input = document.getElementById('uba-assistant-input');
    if (!input) return;
    input.value = text;
    const send = document.getElementById('uba-assistant-send');
    if (send) send.click();
  }

  // Exposed API
  window.ubaAssistant = {
    open: openAssistant,
    close: closeAssistant,
    ask: (q) => { appendUserMessage(q); respond(q); },
    kb: KB,
  };

  // Small init function used by page-loader
  window.initAssistant = function () {
    // Only auto-create UI when on a page that has the Smart Tools view or the assistant card
    const isSmart = (function () {
      const p = window.location.pathname.toLowerCase();
      if (p.endsWith('smart-tools.html') || p.includes('smart-tools')) return true;
      if (document.querySelector('[data-view="smart-tools"]')) return true;
      if (document.getElementById('smart-tools-grid')) return true;
      return false;
    })();

    if (isSmart) createAssistantUI();
  };

  // Auto-initialize when script loads if on Smart Tools page
  try { if (document.readyState === 'complete' || document.readyState === 'interactive') { window.initAssistant(); } else { document.addEventListener('DOMContentLoaded', window.initAssistant); } } catch (e) { console.warn('assistant init error', e); }
})();
