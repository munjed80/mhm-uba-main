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

  function appendBotMessage(obj) {
    renderAssistantMessage('bot', obj);
    window._uba_conversation = window._uba_conversation || [];
    window._uba_conversation.push({ role: 'assistant', text: obj.text, time: new Date().toISOString(), lang: 'en' });
    saveConversationToStorage();
  }

  // Conversation persistence
  const ASSISTANT_HISTORY_KEY = 'ubaAssistantHistory';

  function saveConversationToStorage() {
    try {
      const list = window._uba_conversation || [];
      // keep full history but persist only last 200 messages
      const toSave = list.slice(-200);
      localStorage.setItem(ASSISTANT_HISTORY_KEY, JSON.stringify(toSave));
    } catch (e) { console.warn('assistant save error', e); }
  }

  function loadConversationFromStorage() {
    try {
      const raw = localStorage.getItem(ASSISTANT_HISTORY_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw) || [];
      window._uba_conversation = arr;
      return arr;
    } catch (e) { return []; }
  }

  function renderConversationHistory(limit = 20) {
    try {
      const convoArea = document.querySelector('.uba-assistant-messages');
      if (!convoArea) return;
      convoArea.innerHTML = '';
      const list = (window._uba_conversation || []).slice(-limit);
      list.forEach(m => {
        if (m.role === 'user') renderAssistantMessage('user', { text: m.text });
        else renderAssistantMessage('bot', { text: m.text, suggestions: m.suggestions || [], actions: m.actions || [] });
      });
    } catch (e) { console.warn(e); }
  }

  function detectLanguage(text) {
    if (!text) return 'en';
    const ar = /[\u0600-\u06FF]/;
    return ar.test(text) ? 'ar' : 'en';
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

  // --- Local intent detection and response generation ---
  function generateResponse(question) {
    const q = (question || '').toLowerCase();
    const lang = detectLanguage(question);

    // navigation keywords (english => target page, plus Arabic equivalents)
    const navMap = [
      { kws: ['clients', 'client', 'crm', 'عملاء'], target: 'clients' },
      { kws: ['projects', 'project', 'pipeline', 'مشاريع'], target: 'projects' },
      { kws: ['tasks', 'task', 'todo', 'مهام'], target: 'tasks' },
      { kws: ['invoices', 'invoice', 'bill', 'فواتير'], target: 'invoices' },
      { kws: ['calendar', 'calendar', 'تقويم'], target: 'calendar' },
      { kws: ['leads', 'lead', 'عملاء محتملون'], target: 'leads' },
      { kws: ['expenses', 'expense', 'مصروفات'], target: 'expenses' },
      { kws: ['files', 'file', 'ملفات'], target: 'files' },
      { kws: ['reports', 'report', 'تقارير'], target: 'reports' },
      { kws: ['smart tools', 'assistant', 'smarttools', 'مختص الذكاء'], target: 'smart-tools' },
      { kws: ['insights', 'insight', 'analytics', 'تحليلات'], target: 'insights' },
      { kws: ['support', 'help', 'success desk', 'مساعدة', 'support'], target: 'help' },
      { kws: ['settings', 'setting', 'إعدادات'], target: 'settings' }
    ];

    // CRUD keywords
    const crudMap = [
      { kws: ['add client', 'create client', 'new client', 'إضافة عميل'], intent: 'add_client' },
      { kws: ['edit client', 'update client', 'delete client', 'حذف عميل', 'تعديل عميل'], intent: 'crud_client' },
      { kws: ['create invoice', 'new invoice', 'add invoice', 'إنشاء فاتورة'], intent: 'crud_invoice' },
      { kws: ['create project', 'new project', 'add project', 'إنشاء مشروع'], intent: 'crud_project' },
      { kws: ['create task', 'new task', 'add task', 'إضافة مهمة'], intent: 'crud_task' }
    ];

    // Summaries and data queries
    const summaryKws = ['summary', 'how many', 'count', 'how many open', 'summary of', 'كم', 'كم عدد'];

    // FAQ simple checks
    const faqKws = ['what is', 'explain', 'how to use', 'كيف', 'ما هي'];

    // 1) navigation intent
    for (const m of navMap) {
      for (const kw of m.kws) {
        if (q.indexOf(kw) !== -1) {
          const text = `Opening ${capitalize(m.target)}...`; // user-visible
          // attempt SPA load then fallback to navigation
          try {
            if (typeof window.loadPageScripts === 'function') window.loadPageScripts(m.target + '-page');
          } catch (e) {}
          try { window.location.href = `${m.target}.html`; } catch (e) {}
          return { text: text, suggestions: [], actions: [{ label: `Open ${capitalize(m.target)}`, type: 'navigate', target: m.target }] };
        }
      }
    }

    // 2) CRUD guidance
    for (const c of crudMap) {
      for (const kw of c.kws) {
        if (q.indexOf(kw) !== -1) {
          return { text: crudHelpText(c.intent), suggestions: ['Show steps', 'Open page'], actions: c.intent.indexOf('client') !== -1 ? [{ label: 'Open Clients', type: 'navigate', target: 'clients' }] : [] };
        }
      }
    }

    // 3) data summaries
    for (const sk of summaryKws) {
      if (q.indexOf(sk) !== -1) {
        // check specific collections
        if (q.indexOf('client') !== -1 || q.indexOf('عملاء') !== -1) {
          const clients = (window.ubaStore && window.ubaStore.clients) ? window.ubaStore.clients.getAll() : [];
          return { text: `You have ${clients.length} client${clients.length !== 1 ? 's' : ''}.`, suggestions: ['Show recent clients', 'Open Clients'], actions: [{ label: 'Open Clients', type: 'navigate', target: 'clients' }] };
        }
        if (q.indexOf('invoice') !== -1 || q.indexOf('فاتورة') !== -1) {
          const invoices = (window.ubaStore && window.ubaStore.invoices) ? window.ubaStore.invoices.getAll() : [];
          const openInv = invoices.filter(i => !(i.status && i.status.toLowerCase() === 'paid')).length;
          return { text: `There are ${invoices.length} invoices total and ${openInv} open/unpaid.`, suggestions: ['Show invoices', 'Open Invoices'], actions: [{ label: 'Open Invoices', type: 'navigate', target: 'invoices' }] };
        }
        if (q.indexOf('task') !== -1 || q.indexOf('مهام') !== -1) {
          const tasks = (window.ubaStore && window.ubaStore.tasks) ? window.ubaStore.tasks.getAll() : [];
          const todo = tasks.filter(t => !(t.status && t.status === 'done')).length;
          return { text: `You have ${tasks.length} tasks, ${todo} are not done yet.`, suggestions: ['Show tasks', 'Open Tasks'], actions: [{ label: 'Open Tasks', type: 'navigate', target: 'tasks' }] };
        }
      }
    }

    // 4) FAQs
    for (const fk of faqKws) {
      if (q.indexOf(fk) !== -1) {
        return { text: faqAnswer(q), suggestions: ['How do I add a client?', 'How do I create an invoice?'], actions: [] };
      }
    }

    // 5) fallback
    return { text: "I didn't fully understand. Try asking about Clients, Invoices, Projects, or Tasks. You can also say 'Open Clients' or 'How many invoices are open?'.", suggestions: ['Open Clients', 'How many open invoices?'], actions: [] };
  }

  function crudHelpText(intent) {
    switch (intent) {
      case 'add_client':
        return 'To add a client: open the Clients page, click "New Client", fill in the contact details and save.';
      case 'crud_client':
        return 'To edit a client: open the client in the Clients page, change fields and save. To delete, open the client and choose Delete (confirmation required).';
      case 'crud_invoice':
        return 'Create an invoice from the Invoices page or the mini-invoice form on the dashboard. Fill client, items and amounts, then save as draft or send.';
      case 'crud_project':
        return 'Create a project on the Projects page. Add title, description, and move cards between pipeline columns to update stage.';
      case 'crud_task':
        return 'Quick tasks can be added from the Tasks page or the dashboard. Click a task to edit, or drag between columns to change status.';
      default:
        return 'To perform CRUD actions, open the appropriate page (Clients, Invoices, Projects, Tasks) and use the New / Edit controls.';
    }
  }

  function faqAnswer(q) {
    if (q.indexOf('dashboard') !== -1 || q.indexOf('لوحة') !== -1) {
      return 'The dashboard surfaces KPIs from your invoices, tasks and clients. Use demo mode to explore sample data or connect Supabase for real data.';
    }
    if (q.indexOf('projects') !== -1 || q.indexOf('pipeline') !== -1) {
      return 'The Projects board uses columns to represent stages. Drag a card between columns to update its stage; click a card to edit details.';
    }
    if (q.indexOf('calendar') !== -1) {
      return 'The Calendar view shows events and due dates. Click a day to add events and use filters to display tasks or invoices.';
    }
    return 'This workspace contains Clients, Projects, Tasks, Invoices and Smart Tools; ask about any of those for more details.';
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
    const TYPING_TEXT = 'Typing...';
    // show typing indicator (not persisted)
    renderAssistantMessage('bot', { text: TYPING_TEXT });

    // compute reply asynchronously to simulate thinking
    setTimeout(() => {
      // remove the last typing bubble if present
      const convo = document.querySelector('.uba-assistant-messages');
      if (convo) {
        const msgs = convo.querySelectorAll('.assistant-msg.bot .uba-assistant-bubble');
        if (msgs && msgs.length) {
          const last = msgs[msgs.length - 1];
          if (last && last.textContent.trim() === TYPING_TEXT) {
            const parent = last.closest('.assistant-msg.bot');
            if (parent) parent.remove();
          }
        }
      }

      // generate reply using local logic
      const result = generateResponse(question);
      if (result && result.text) {
        appendBotMessage({ text: result.text, suggestions: result.suggestions || [], actions: result.actions || [] });
      } else {
        appendBotMessage({ text: "Sorry, I couldn't find an answer — could you rephrase?", suggestions: ['How do I add a client?', 'Open Clients'], actions: [] });
      }

      // optional feedback prompt
      appendBotMessage({ text: 'Did this help?', suggestions: ['Yes', 'No'], actions: [] });

      // re-enable send button if present
      try {
        const panel = document.getElementById('uba-assistant-panel');
        if (panel) {
          const send = panel.querySelector('#uba-assistant-send');
          if (send) send.disabled = false;
        }
      } catch (e) {}
    }, 600 + Math.floor(Math.random() * 400));
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
    if (send) send.addEventListener('click', () => {
      if (!input) return;
      const v = input.value.trim();
      if (!v) return;
      // disable send and show typing
      send.disabled = true;
      appendUserMessage(v);
      input.value = '';
      // process
      respond(v);
    });

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
    // quick buttons in static panel (e.g. 'How do I add a new client?')
    try {
      Array.from(panel.querySelectorAll('.uba-assistant-quick-btn')).forEach((btn) => {
        btn.addEventListener('click', () => {
          const q = (btn.textContent || '').trim(); if (!q) return; setInputAndSend(q);
        });
      });
    } catch (e) { /* ignore */ }
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

  // On init, restore history if present
  try {
    const hist = loadConversationFromStorage();
    if (hist && hist.length) {
      // ensure UI exists so messages can be rendered
      document.addEventListener('DOMContentLoaded', function () {
        createAssistantUI();
        renderConversationHistory(20);
      });
    }
  } catch (e) {
    /* ignore */
  }

  // Auto-initialize when script loads if on Smart Tools page
  try { if (document.readyState === 'complete' || document.readyState === 'interactive') { window.initAssistant(); } else { document.addEventListener('DOMContentLoaded', window.initAssistant); } } catch (e) { console.warn('assistant init error', e); }

  // Open assistant when the assistant card/button is clicked in Smart Tools
  document.addEventListener('click', function (e) {
    try {
      const el = e.target;
      if (!el) return;
      // If click inside a .uba-support-card with data-assistant-card
      const card = el.closest && el.closest('.uba-support-card[data-assistant-card]');
      if (card) {
        createAssistantUI();
        openAssistant();
        return;
      }
      // Also if an explicit open-assistant button exists
      if (el.matches && el.matches('[data-open-assistant], .uba-support-card [data-i18n="tool.assistant.open"]')) {
        createAssistantUI(); openAssistant(); return;
      }
    } catch (err) {
      // non-fatal
    }
  });
})();
