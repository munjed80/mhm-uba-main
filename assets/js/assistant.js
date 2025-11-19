// assistant.js — UBA Assistant (standalone script)
// This file provides a lightweight client-side assistant UI and API.
(function () {
  if (window.ubaAssistant) return; // preserve existing instance

  const knowledge = [
    { section: 'dashboard', questionTags: ['kpi','revenue','invoices'], answer: 'The dashboard shows KPIs from invoices, tasks and clients.' },
    { section: 'clients', questionTags: ['client','crm','contact'], answer: 'Clients live in the Clients view. Use it to add, edit and delete contacts.' },
    { section: 'invoices', questionTags: ['invoice','billing'], answer: 'Invoices are managed in the Invoices view and mini-invoices on the dashboard.' },
    { section: 'projects', questionTags: ['project','pipeline'], answer: 'Projects are shown in the Projects board; move cards between columns to update stage.' },
    { section: 'tasks', questionTags: ['task','todo'], answer: 'Tasks live on the Tasks board and can be moved between columns.' },
    { section: 'global', questionTags: ['help','how','what','where'], answer: 'Ask about Dashboard, Clients, Projects, Tasks or Invoices.' },
  ];

  function escapeHtml(s){ return (s||'').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c)); }

  function createAssistantUI(){
    if (document.getElementById('uba-assistant-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'uba-assistant-panel';
    panel.className = 'uba-card uba-assistant-panel is-hidden';
    panel.innerHTML = `
      <div class="uba-card-header"><div><div class="uba-card-title">UBA Assistant</div><div class="uba-card-sub">Contextual help</div></div><button id="uba-assistant-close" class="uba-btn-ghost">✕</button></div>
      <div class="uba-assistant-quick"><button class="uba-assistant-quick-btn uba-btn-ghost">How do I add a client?</button><button class="uba-assistant-quick-btn uba-btn-ghost">How do I create an invoice?</button></div>
      <div class="uba-assistant-messages" aria-live="polite"></div>
      <div class="uba-assistant-input-row"><input id="uba-assistant-input" class="uba-assistant-input" placeholder="Ask a question..." /><button id="uba-assistant-send" class="uba-btn-primary">Send</button></div>
    `;
    document.body.appendChild(panel);
    const close = panel.querySelector('#uba-assistant-close'); if (close) close.addEventListener('click', closeAssistant);
    const send = panel.querySelector('#uba-assistant-send'); const input = panel.querySelector('#uba-assistant-input');
    if (send) send.addEventListener('click', handleSend);
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); handleSend(); } });
    Array.from(panel.querySelectorAll('.uba-assistant-quick-btn')).forEach(b => b.addEventListener('click', ()=> { const q = b.textContent.trim(); setInputAndSend(q); }));
  }

  function appendMessage(who, text){
    try{
      if (!window._uba_conversation) window._uba_conversation = [];
      window._uba_conversation.push({ role: who==='user'?'user':'assistant', text });
      renderAssistantMessage(who === 'user' ? 'user' : 'bot', text);
    }catch(e){console.warn(e)}
  }

  function renderAssistantMessage(who, text){
    const convo = document.querySelector('.uba-assistant-messages'); if (!convo) return;
    const wrapper = document.createElement('div'); wrapper.className = `assistant-msg ${who}`;
    const bubble = document.createElement('div'); bubble.className = `uba-assistant-bubble ${who==='user'?'user':'bot'}`;
    bubble.innerHTML = escapeHtml(text).replace(/\n/g,'<br/>'); wrapper.appendChild(bubble); convo.appendChild(wrapper); convo.scrollTop = convo.scrollHeight;
  }

  function generateReply(text){
    const q = (text||'').toLowerCase();
    for (const item of knowledge){ for (const tag of item.questionTags){ if (q.indexOf(tag)!==-1) return item.answer; } }
    return "I don't fully understand — try asking about clients, invoices, tasks or projects.";
  }

  function respondTo(question){
    const convoArea = document.querySelector('.uba-assistant-messages'); if (!convoArea) return;
    appendMessage('assistant', 'Thinking...');
    setTimeout(()=>{
      // remove last thinking
      const msgs = Array.from(convoArea.querySelectorAll('.assistant-msg.bot'));
      if (msgs.length){ const last = msgs[msgs.length-1]; if (last && last.textContent && last.textContent.trim() === 'Thinking...') last.remove(); }
      const reply = generateReply(question); appendMessage('assistant', reply);
    }, 300);
  }

  function handleSend(){ const input = document.getElementById('uba-assistant-input'); if (!input) return; const txt = input.value.trim(); if (!txt) return; appendMessage('user', txt); input.value=''; respondTo(txt); }
  function openAssistant(){ createAssistantUI(); const panel = document.getElementById('uba-assistant-panel'); if (!panel) return; panel.classList.remove('is-hidden'); panel.setAttribute('aria-hidden','false'); const input = document.getElementById('uba-assistant-input'); if (input) input.focus(); }
  function closeAssistant(){ const panel = document.getElementById('uba-assistant-panel'); if (!panel) return; panel.classList.add('is-hidden'); panel.setAttribute('aria-hidden','true'); }
  function setInputAndSend(text){ const input = document.getElementById('uba-assistant-input'); if (!input) return; input.value = text; handleSend(); }

  // auto-init on smart-tools pages only
  function isSmartToolsPage(){ const p = window.location.pathname.toLowerCase(); if (p.endsWith('smart-tools.html') || p.includes('smart-tools')) return true; if (document.getElementById('smart-tools-grid')) return true; return false; }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', ()=>{ if (isSmartToolsPage()) createAssistantUI(); }); } else { if (isSmartToolsPage()) createAssistantUI(); }

  document.addEventListener('click', function(e){ if (!isSmartToolsPage()) return; if (e.target && e.target.matches('.uba-support-card[data-assistant-card] .uba-btn-ghost, .uba-support-card[data-assistant-card]')){ createAssistantUI(); openAssistant(); return; } const card = e.target.closest && e.target.closest('.uba-support-card[data-assistant-card]'); if (card){ createAssistantUI(); openAssistant(); } });

  window.ubaAssistant = { open: openAssistant, close: closeAssistant, knowledge };
  // also expose a simple init function for page-loader
  window.initAssistant = function(){ if (!window.ubaAssistant) return; /* assistant lib will auto-init when needed */ };
})();
// UBA Assistant – local, client-side assistant (no external APIs)
// Adds a slide-in panel and floating button; answers come from a local knowledge base.

(function () {
  // Knowledge base
  // Each entry: { section, questionTags: [...], answer, navigateTo?: 'invoices'|'clients'|... }
  const ubaAssistantKnowledge = [
    // TODO: future - provide translated `answer` fields keyed by language and use i18n helper to select.
    {
      section: "dashboard",
      questionTags: ["kpi", "revenue", "invoices", "metrics"],
      answer:
        "The dashboard surfaces KPIs from your invoices, tasks and clients. Connect Supabase to populate real data, or use demo mode to explore local seeds.",
    },
    {
      section: "clients",
      questionTags: ["client", "crm", "contact", "clients"],
      answer:
        "Clients live in the CRM. Use the Clients view to add, edit, or delete contacts. In authenticated mode they are stored in the `clients` table in Supabase.",
      navigateTo: "clients",
    },
    {
      section: "invoices",
      questionTags: ["invoice", "billing", "payment", "invoices"],
      answer:
        "Invoices are managed in the Invoices view and mini-invoices on the dashboard. By default demo invoices are stored in localStorage; when connected, invoices are stored in Supabase `invoices`.",
      navigateTo: "invoices",
    },
    {
      section: "projects",
      questionTags: ["project", "pipeline", "stage", "projects"],
      answer:
        "The Projects board stores pipeline stages locally in demo mode. Move cards between columns to change stage; in Supabase-backed mode projects come from the `projects` table.",
      navigateTo: "projects",
    },
    {
      section: "tasks",
      questionTags: ["task", "todo", "in_progress", "done", "tasks"],
      answer:
        "Tasks appear on the Tasks board and the dashboard. You can move tasks between columns and mark them done; in Supabase mode tasks are stored in the `tasks` table.",
      navigateTo: "tasks",
    },
    {
      section: "smartTools",
      questionTags: ["assistant", "smart", "tools", "uba assistant"],
      answer:
        "UBA Smart Tools are a set of cards that show assistants and utilities. Use the UBA Assistant to get contextual help without leaving the app.",
    },
    {
      section: "settings",
      questionTags: ["settings", "preferences", "workspace", "language"],
      answer:
        "Workspace preferences live in Settings. You can set workspace name, timezone, language, and toggle single-page navigation. These are saved in localStorage.",
      navigateTo: "settings",
    },
    {
      section: "global",
      questionTags: ["help", "how", "what", "where"],
      answer:
        "Ask about the Dashboard, Clients, Projects, Tasks, Invoices, Automations, or Settings. Try: 'How do I add a client?' or 'How do I connect Supabase?'.",
    },
  ];

  // Create assistant DOM once
  function createAssistantUI() {
    // If the page already includes a static panel, don't create a new one.
    if (document.getElementById("uba-assistant-panel")) return;

    // otherwise create a minimal floating panel (fallback)
    const panel = document.createElement("div");
    panel.id = "uba-assistant-panel";
    panel.className = "uba-card uba-assistant-panel";
    panel.innerHTML = `
      <div class="uba-card-header">
        <div>
          <div class="uba-card-title">UBA Assistant</div>
          <div class="uba-card-sub">Contextual help — local assistant</div>
        </div>
        <button id="uba-assistant-close" class="uba-btn-ghost">✕</button>
      </div>
      <div class="uba-assistant-quick">
        <button class="uba-assistant-quick-btn uba-btn-ghost">How do I add a new client?</button>
        <button class="uba-assistant-quick-btn uba-btn-ghost">How do I create an invoice?</button>
        <button class="uba-assistant-quick-btn uba-btn-ghost">How do I track tasks?</button>
      </div>
      <div class="uba-assistant-messages" aria-live="polite"></div>
      <div class="uba-assistant-input-row">
        <input id="uba-assistant-input" class="uba-assistant-input" placeholder="Ask a question..." />
        <button id="uba-assistant-send" class="uba-btn-primary">Send</button>
      </div>
    `;
    document.body.appendChild(panel);

    // wire events for fallback panel
    const closeBtn = panel.querySelector('#uba-assistant-close');
    if (closeBtn) closeBtn.addEventListener('click', () => closeAssistant());
    const sendBtn = panel.querySelector('#uba-assistant-send');
    const inputField = panel.querySelector('#uba-assistant-input');
    if (sendBtn) sendBtn.addEventListener('click', () => handleSend());
    if (inputField) inputField.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    Array.from(panel.querySelectorAll('.uba-assistant-quick-btn')).forEach((btn) => btn.addEventListener('click', () => { const q = btn.textContent.trim(); setInputAndSend(q); }));
  }

  // Convenience: append a user/bot message using the renderer
  function appendMessage(who, text) {
    // who: 'user' or 'bot'
    try {
      // store in-memory conversation
      if (!window._uba_conversation) window._uba_conversation = [];
      window._uba_conversation.push({ role: who === 'user' ? 'user' : 'assistant', text: text });
      renderAssistantMessage(who === 'user' ? 'user' : 'bot', text);
    } catch (err) {
      console.error('Assistant appendMessage error', err);
    }
  }

  function getCurrentSection() {
    // Prefer active view set by the main app
    const active = document.body.dataset.activeView;
    if (active) return active;
    // Fallback: infer from pathname
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith("/index.html") || path === "/" || path.endsWith("/index")) return "dashboard";
    if (path.endsWith("/help.html")) return "support";
    if (path.includes("clients")) return "clients";
    if (path.includes("projects")) return "projects";
    if (path.includes("tasks")) return "tasks";
    if (path.includes("invoices")) return "invoices";
    return "global";
  }

  function normalizeText(s) {
    return (s || "").toLowerCase();
  }

  // Find the best matching KB entry for a question.
  // Returns the full entry object {section, questionTags, answer, navigateTo?} or null.
  function findBestAnswer(question, section) {
    const q = normalizeText(question);

    // exact section matches (highest priority)
    const sectionMatches = ubaAssistantKnowledge.filter((e) => e.section === section);
    for (const item of sectionMatches) {
      for (const tag of item.questionTags) {
        if (q.indexOf(tag.toLowerCase()) !== -1) return item;
      }
    }

    // then global entries
    const globalMatches = ubaAssistantKnowledge.filter((e) => e.section === "global");
    for (const item of globalMatches) {
      for (const tag of item.questionTags) {
        if (q.indexOf(tag.toLowerCase()) !== -1) return item;
      }
    }

    // fuzzy: any tag anywhere
    for (const item of ubaAssistantKnowledge) {
      for (const tag of item.questionTags) {
        if (q.indexOf(tag.toLowerCase()) !== -1) return item;
      }
    }

    return null;
  }

  // Simple intent router: return a friendly multi-paragraph reply text
  function generateReply(text) {
    const q = (text || '').toLowerCase();
    if (q.includes('client')) {
      return (
        'Clients (CRM)\n\n' +
        '• To add a client: Open the Clients page and click the "New Client" button, fill the contact details and save.\n' +
        '• To edit: click a client row to open details, update fields and save.\n' +
        '• To remove: open the client and choose Delete (confirmation required).'
      );
    }
    if (q.includes('invoice')) {
      return (
        'Invoices\n\n' +
        '• Create an invoice from the Invoices page or use the mini-invoice form on the dashboard.\n' +
        '• Fill client, items and amounts, then save as draft or send.\n' +
        '• Mark as paid when payment arrives; overdue invoices appear in KPIs.'
      );
    }
    if (q.includes('project')) {
      return (
        'Projects & Pipeline\n\n' +
        '• The Projects board shows pipeline columns (lead, in_progress, ongoing).\n' +
        '• Drag cards between columns to update stage.\n' +
        '• Click a project card to edit details and assign tasks.'
      );
    }
    if (q.includes('task')) {
      return (
        'Tasks\n\n' +
        '• Use the Tasks board to view todo, in_progress and done lists.\n' +
        '• Click a task to edit, use the checkbox to mark done, or drag to reorder.\n' +
        '• Create quick tasks from the dashboard or the Tasks page.'
      );
    }
    if (q.includes('lead')) {
      return (
        'Leads\n\n' +
        '• Leads flow through the pipeline similar to projects.\n' +
        '• Capture new leads from forms or import, then qualify and move them through stages.\n' +
        '• Use notes to track communications.'
      );
    }
    if (q.includes('calendar')) {
      return (
        'Calendar\n\n' +
        '• The Calendar view shows events and due dates.\n' +
        '• Use filters to show tasks, invoices or project milestones.\n' +
        '• Click a day to add a new event.'
      );
    }
    if (q.includes('language') || q.includes('translate')) {
      return (
        'Language & Translations\n\n' +
        '• Use the Language selector in the sidebar to switch languages.\n' +
        '• Supported languages are English, Arabic, Dutch, French, Spanish and German.\n' +
        '• When switching to Arabic the layout will flip to RTL.'
      );
    }
    if (q.includes('reset') || q.includes('demo data')) {
      return (
        'Reset Demo Data\n\n' +
        '• You can reset the local demo data in Settings → Reset demo data.\n' +
        '• This clears localStorage seeds and restores the app to demo defaults.\n' +
        '• Use this when you want to start fresh or test onboarding flows.'
      );
    }

    // fallback
    return (
      "I'm not sure I fully understand, but here are some tips:\n\n" +
      "• Navigate using the sidebar to open Dashboard, Clients, Projects, Tasks or Invoices.\n" +
      "• Try asking about clients, invoices, tasks or settings for specific help."
    );
  }

  function respondTo(question) {
    const convoArea = document.querySelector('.uba-assistant-messages') || document.getElementById('uba-assistant-conversation');
    if (!convoArea) return;
    // show small thinking indicator
    appendMessage('assistant', 'Thinking...');
    setTimeout(() => {
      // remove the last 'Thinking...' message
      const msgs = Array.from(convoArea.querySelectorAll('.assistant-msg.bot'));
      if (msgs.length) {
        const last = msgs[msgs.length - 1];
        if (last && last.textContent && last.textContent.trim() === 'Thinking...') last.remove();
      }
      const reply = generateReply(question);
      appendMessage('assistant', reply);
      // scroll
      convoArea.scrollTop = convoArea.scrollHeight;
    }, 350);
  }

  // Render a message bubble in the conversation area.
  function renderAssistantMessage(who, text) {
    const convo = document.querySelector('.uba-assistant-messages') || document.getElementById('uba-assistant-conversation');
    if (!convo) return;
    const wrapper = document.createElement('div');
    wrapper.className = `assistant-msg ${who}`;
    const bubble = document.createElement('div');
    bubble.className = `uba-assistant-bubble ${who === 'user' ? 'user' : 'bot'}`;
    bubble.innerHTML = escapeHtml(text).replace(/\n/g, '<br/>');
    wrapper.appendChild(bubble);
    convo.appendChild(wrapper);
    convo.scrollTop = convo.scrollHeight;
  }

  function escapeHtml(unsafe) {
    return (unsafe || "").replace(/[&<>"]+/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c;
    });
  }

  function handleSend() {
    const input = document.getElementById('uba-assistant-input');
    const sendBtn = document.getElementById('uba-assistant-send');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    if (sendBtn) sendBtn.disabled = true;
    try {
      appendMessage('user', text);
      input.value = '';
      respondTo(text);
    } finally {
      if (sendBtn) setTimeout(() => (sendBtn.disabled = false), 400);
    }
  }

  function openAssistant() {
    createAssistantUI();
    const panel = document.getElementById('uba-assistant-panel');
    if (!panel) return;
    panel.classList.remove('is-hidden');
    panel.setAttribute('aria-hidden','false');
    const input = document.getElementById('uba-assistant-input');
    if (input) input.focus();
    // bind quick buttons and send/close if not already bound
    bindAssistantControls();
  }

  function closeAssistant() {
    const panel = document.getElementById('uba-assistant-panel');
    if (!panel) return;
    panel.classList.add('is-hidden');
    panel.setAttribute('aria-hidden','true');
  }

  function setInputAndSend(text){
    const input = document.getElementById('uba-assistant-input');
    if (!input) return;
    input.value = text;
    handleSend();
  }

  // Bind send/close/quick buttons once
  let _assistantBound = false;
  function bindAssistantControls(){
    if (_assistantBound) return; _assistantBound = true;
    const panel = document.getElementById('uba-assistant-panel');
    if (!panel) return;
    const closeBtn = panel.querySelector('#uba-assistant-close');
    if (closeBtn) closeBtn.addEventListener('click', () => closeAssistant());
    const sendBtn = panel.querySelector('#uba-assistant-send');
    const input = panel.querySelector('#uba-assistant-input');
    if (sendBtn) sendBtn.addEventListener('click', () => handleSend());
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } if (e.key === 'Escape') closeAssistant(); });
    Array.from(panel.querySelectorAll('.uba-assistant-quick-btn, .uba-assist-suggest')).forEach((btn) => {
      btn.addEventListener('click', (ev)=>{
        const q = (ev.target.textContent || '').trim();
        if (!q) return; setInputAndSend(q);
      });
    });
    // allow ESC to close when panel open
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const p = document.getElementById('uba-assistant-panel'); if (p && !p.classList.contains('is-hidden')) closeAssistant(); } });
  }

  // Only initialize the assistant UI automatically on the Smart Tools page.
  function isSmartToolsPage() {
    const p = window.location.pathname.toLowerCase();
    if (p.endsWith('smart-tools.html') || p.includes('smart-tools')) return true;
    if (document.querySelector('[data-view="smart-tools"]')) return true;
    if (document.getElementById('smart-tools-grid')) return true;
    return false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (isSmartToolsPage()) createAssistantUI();
    });
  } else {
    if (isSmartToolsPage()) createAssistantUI();
  }

  // Fix: Open assistant when user clicks the UBA Assistant card OR its button in the Smart Tools grid
  document.addEventListener('click', function (e) {
    if (!isSmartToolsPage()) return;
    // If the Open Assistant button is clicked
    if (e.target && e.target.matches('.uba-support-card[data-assistant-card] .uba-btn-ghost, .uba-support-card[data-assistant-card]')) {
      createAssistantUI();
      openAssistant();
      return;
    }
    // If the card itself is clicked (not the button)
    const card = e.target.closest && e.target.closest('.uba-support-card[data-assistant-card]');
    if (card) {
      createAssistantUI();
      openAssistant();
    }
  });

  // Expose a small API for tests or other scripts
  window.ubaAssistant = {
    open: openAssistant,
    close: closeAssistant,
    knowledge: ubaAssistantKnowledge,
  };
})();
