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
    const existing = document.getElementById('uba-assistant-panel');
    if (existing) {
      // If a static panel exists in the page markup, ensure controls are bound and FAB is present
        bindAssistantControls();
        // render any saved history
        renderConversationHistory(20);
      if (!document.getElementById('uba-assistant-fab')) {
        const fab = document.createElement('button');
        fab.id = 'uba-assistant-fab';
        fab.className = 'uba-assistant-fab uba-btn-primary';
        fab.title = 'Open UBA Assistant';
        fab.innerHTML = '🤖';
        fab.addEventListener('click', () => openAssistant());
        document.body.appendChild(fab);
      }
      return;
    }

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
    // store conversation history in-memory and persist
    window._uba_conversation = window._uba_conversation || [];
    window._uba_conversation.push({ role: 'user', text, time: new Date().toISOString(), lang: detectLanguage(text) });
    saveConversationToStorage();
  }


  (function() {
    // Only run on assistant.html
    const pageId = document.getElementById('page-id');
    if (!pageId || pageId.dataset.page !== 'assistant-page') return;

    // Message history
    function getHistory() {
      try {
        return JSON.parse(localStorage.getItem('uba-assistant-history') || '[]');
      } catch {
        return [];
      }
    }
    function saveHistory(messages) {
      localStorage.setItem('uba-assistant-history', JSON.stringify(messages));
    }

    // Render messages
    function renderMessages(messages) {
      const container = document.getElementById('assistant-messages');
      if (!container) return;
      container.innerHTML = '';
      messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'uba-chat-msg ' + (msg.role === 'user' ? 'uba-chat-user' : 'uba-chat-assistant');
        div.textContent = msg.text;
        container.appendChild(div);
      });
      container.scrollTop = container.scrollHeight;
    }

    // Demo reply logic
    function demoReply(userText) {
      if (/hello|hi|hey|مرحبا|أهلا/i.test(userText)) return "Hello! How can I help you today?";
      if (/project|مشروع/i.test(userText)) return "You can manage projects from the Projects page.";
      if (/client|عميل/i.test(userText)) return "Clients info is available on the Clients page.";
      if (/task|مهمة/i.test(userText)) return "Tasks are managed on the Tasks page.";
      if (/invoice|فاتورة/i.test(userText)) return "Invoices are available on the Invoices page.";
      return "I'm here to assist you. Try asking about projects, tasks, or clients!";
    }

    // Form wiring
    function bindForm(messages) {
      const form = document.getElementById('assistant-form');
      const input = document.getElementById('assistant-input');
      if (!form || !input) return;
      form.onsubmit = function(e) {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        messages.push({ role: 'user', text });
        const reply = demoReply(text);
        messages.push({ role: 'assistant', text: reply });
        renderMessages(messages);
        saveHistory(messages);
        input.value = '';
        input.focus();
      };
    }

    // Init
    function initAssistantPage() {
      const messages = getHistory();
      renderMessages(messages);
      bindForm(messages);
      if (window.ubaI18n) window.ubaI18n.applyTranslations();
    }

