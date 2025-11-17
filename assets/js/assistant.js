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
    if (document.getElementById("uba-assistant-panel")) return;

    // Panel
    const panel = document.createElement("div");
    panel.id = "uba-assistant-panel";
    panel.className = "uba-card uba-assistant-panel";
    panel.innerHTML = `
      <div class="uba-card-header">
        <div>
          <div class="uba-card-title">UBA Assistant</div>
          <div class="uba-card-sub">Contextual help — powered by local knowledge</div>
        </div>
        <button id="uba-assistant-close" class="uba-btn-ghost">✕</button>
      </div>
      <div id="uba-assistant-conversation" class="uba-assistant-conversation" aria-live="polite"></div>
      <div class="uba-assistant-suggest">
        <button class="uba-btn-ghost uba-assist-suggest">How do I create an invoice?</button>
        <button class="uba-btn-ghost uba-assist-suggest">How do I add a new client?</button>
        <button class="uba-btn-ghost uba-assist-suggest">How do I track tasks?</button>
      </div>
      <div class="uba-assistant-input-row">
        <input id="uba-assistant-input" placeholder="Ask a question..." />
        <button id="uba-assistant-send" class="uba-btn-primary">Send</button>
      </div>
    `;

    document.body.appendChild(panel);

    // Floating button
    const fab = document.createElement("button");
    fab.id = "uba-assistant-fab";
    fab.className = "uba-btn-primary uba-assistant-fab";
    fab.textContent = "Ask UBA Assistant";
    document.body.appendChild(fab);

    // i18n: use the shared translator and set data attributes so
    // `applyTranslations` updates the panel when language changes.
    const i18n = window.ubaI18n;
    const t = (k, fallback = "") => (i18n && typeof i18n.t === 'function') ? i18n.t(k, fallback) : fallback || k;
    const titleEl = panel.querySelector('.uba-card-title');
    const subEl = panel.querySelector('.uba-card-sub');
    const inputEl = panel.querySelector('#uba-assistant-input');
    if (titleEl) {
      titleEl.setAttribute('data-i18n', 'assistant_title');
      titleEl.textContent = t('assistant_title', 'UBA Assistant');
    }
    if (subEl) {
      subEl.setAttribute('data-i18n', 'assistant_subtitle');
      subEl.textContent = t('assistant_subtitle', 'Contextual help — powered by local knowledge');
    }
    if (inputEl) {
      inputEl.setAttribute('data-i18n-placeholder', 'assistant_placeholder');
      inputEl.placeholder = t('assistant_placeholder', 'Ask a question…');
    }

    // Wire events
    fab.addEventListener("click", () => openAssistant());
    document.getElementById("uba-assistant-close").addEventListener("click", () => closeAssistant());

    document.getElementById("uba-assistant-send").addEventListener("click", () => handleSend());
    document.getElementById("uba-assistant-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSend();
    });

    Array.from(panel.querySelectorAll(".uba-assist-suggest")).forEach((btn) => {
      btn.addEventListener("click", () => {
        const q = btn.textContent.trim();
        appendMessage("user", q);
        respondTo(q);
        openAssistant();
      });
    });
  }

  // Convenience: append a user/bot message using the renderer
  function appendMessage(who, text) {
    // who: 'user' or 'bot'
    renderAssistantMessage(who === 'user' ? 'user' : 'bot', text);
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

  function respondTo(question) {
    const section = getCurrentSection();
    const convo = document.getElementById("uba-assistant-conversation");
    renderAssistantMessage("bot", "Thinking...");

    setTimeout(() => {
      // remove the last 'Thinking...' bot message
      const placeholders = convo.querySelectorAll('.assistant-msg.bot');
      if (placeholders && placeholders.length) {
        const last = placeholders[placeholders.length - 1];
        if (last && last.textContent && last.textContent.trim() === 'Thinking...') last.remove();
      }

      const match = findBestAnswer(question, section);
      if (match) {
        // render the matched answer
        renderAssistantMessage('bot', match.answer);

        // if entry asked to navigate, trigger SPA navigation by clicking the sidebar button
        if (match.navigateTo) {
          const navBtn = document.querySelector(`.uba-nav-btn[data-section="${match.navigateTo}"]`);
          if (navBtn) navBtn.click();
        }
      } else {
        // fallback: show helpful summary for section
        const sectionEntries = ubaAssistantKnowledge.filter((e) => e.section === section || e.section === 'global');
        const summary = sectionEntries.length
          ? sectionEntries.map((s) => `• ${s.answer}`).join('\n\n')
          : 'I don’t have an exact answer yet. Try asking about the dashboard, clients, invoices, projects, tasks or settings.';
        renderAssistantMessage('bot', `I don't have an exact answer yet, but here's what you can do in this section:\n\n${summary}`);
      }
      convo.scrollTop = convo.scrollHeight;
    }, 350);
  }

  // Render a message bubble in the conversation area.
  function renderAssistantMessage(who, text) {
    const convo = document.getElementById('uba-assistant-conversation');
    if (!convo) return;
    const wrapper = document.createElement('div');
    wrapper.className = `assistant-msg ${who}`;
    const bubble = document.createElement('div');
    bubble.className = 'assistant-bubble uba-assistant-message';
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
    const input = document.getElementById("uba-assistant-input");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    appendMessage("user", text);
    input.value = "";
    respondTo(text);
  }

  function openAssistant() {
    createAssistantUI();
    document.getElementById("uba-assistant-panel").classList.add("open");
    const panel = document.getElementById("uba-assistant-panel");
    const input = document.getElementById("uba-assistant-input");
    if (input) input.focus();
  }

  function closeAssistant() {
    const panel = document.getElementById("uba-assistant-panel");
    if (panel) panel.classList.remove("open");
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createAssistantUI);
  } else {
    createAssistantUI();
  }

  // Open assistant when user clicks the UBA Assistant card in the Smart Tools grid
  document.addEventListener('click', function (e) {
    const h = e.target.closest && e.target.closest('#smart-tools-grid');
    if (h) {
      // clicked inside grid; find nearest card title
      const card = e.target.closest('.uba-support-card');
      if (card) {
        const titleEl = card.querySelector('h4');
        if (titleEl && titleEl.textContent.trim() === 'UBA Assistant') {
          // ensure UI exists and open
          createAssistantUI();
          openAssistant();
        }
      }
    }
  });

  // Expose a small API for tests or other scripts
  window.ubaAssistant = {
    open: openAssistant,
    close: closeAssistant,
    knowledge: ubaAssistantKnowledge,
  };
})();
