// assets/js/assistant.js — UBA Assistant (standalone + overlay)
(function () {
  if (window.ubaAssistant) return;

  const STORAGE_KEY = "uba-assistant-history";
  const OVERLAY_HISTORY_LIMIT = 30;

  const KB = [
    {
      section: "dashboard",
      tags: ["kpi", "revenue", "invoices", "metrics"],
      answer:
        "The dashboard shows KPIs from invoices, tasks and clients. Use demo mode to explore sample data or connect Supabase to sync real data.",
      navigateTo: "index",
    },
    {
      section: "clients",
      tags: ["client", "crm", "contact", "clients"],
      answer:
        "Clients live in the Clients view. You can add, edit and delete contacts there. Use the export button to download a CSV of your clients.",
      navigateTo: "clients",
    },
    {
      section: "invoices",
      tags: ["invoice", "billing", "payment", "invoices"],
      answer:
        "Invoices are created and managed in the Invoices view. Use the mini-invoice form on the dashboard for quick entries and mark them paid when you receive payment.",
      navigateTo: "invoices",
    },
    {
      section: "projects",
      tags: ["project", "pipeline", "stage", "projects"],
      answer:
        "Projects are arranged in a pipeline. Move a card between columns to update its stage or click a card to edit the details.",
      navigateTo: "projects",
    },
    {
      section: "tasks",
      tags: ["task", "todo", "in_progress", "done", "tasks"],
      answer:
        "Tasks are on the Tasks board and on the dashboard. Create quick tasks or move them between columns; mark them done when complete.",
      navigateTo: "tasks",
    },
    {
      section: "smarttools",
      tags: ["assistant", "smart", "tools", "uba assistant"],
      answer:
        "UBA Smart Tools contains assistants and utilities. Open the Assistant card to get contextual help or suggestions.",
      navigateTo: "smart-tools",
    },
    {
      section: "settings",
      tags: ["settings", "preferences", "workspace", "language"],
      answer:
        "Workspace settings let you change language, timezone and toggle single-page navigation. Reset demo data from Settings if you want to start fresh.",
      navigateTo: "settings",
    },
    {
      section: "global",
      tags: ["help", "how", "what", "where"],
      answer:
        "Ask about Dashboard, Clients, Projects, Tasks, or Invoices. Try: 'How do I add a client?' or 'How do I connect Supabase?'.",
    },
  ];

  // --------------
  // Utilities
  // --------------
  const qs = (sel) => document.querySelector(sel);

  function escapeHtml(str) {
    return (str || "")
      .toString()
      .replace(
        /[&<>\"]/g,
        (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[s],
      );
  }

  function nowTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function readHistory(key = STORAGE_KEY) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (err) {
      console.warn("assistant: failed to read history", err);
      return [];
    }
  }

  function writeHistory(history, key = STORAGE_KEY) {
    try {
      localStorage.setItem(key, JSON.stringify(history));
    } catch (err) {
      console.warn("assistant: failed to save history", err);
    }
  }

  function detectIntent(text) {
    const normalized = (text || "").toLowerCase();
    let match = KB.find((item) =>
      item.tags.some((tag) => normalized.includes(tag)),
    );
    if (!match) match = KB.find((item) => item.section === "global");
    return match;
  }

  function navigateTo(target) {
    if (!target) return;
    const href = `${target}.html`;
    window.location.href = href;
  }

  // --------------
  // Overlay assistant helpers
  // --------------
  function renderAssistantMessage(container, role, payload) {
    if (!container) return;
    const wrapper = document.createElement("div");
    wrapper.className = `assistant-msg ${role}`;

    const meta = document.createElement("div");
    meta.className = "assistant-meta";
    meta.innerHTML = `<span class="assistant-role">${role === "user" ? "You" : "UBA"}</span><span class="assistant-time">${nowTime()}</span>`;

    const bubble = document.createElement("div");
    bubble.className = `uba-assistant-bubble ${role === "user" ? "user" : "bot"}`;
    bubble.innerHTML = escapeHtml(payload.text || "").replace(/\n/g, "<br />");

    wrapper.append(meta, bubble);

    if (payload.suggestions?.length) {
      const chips = document.createElement("div");
      chips.className = "assistant-chips";
      payload.suggestions.forEach((text) => {
        const chip = document.createElement("button");
        chip.className = "uba-chip uba-assist-suggest";
        chip.type = "button";
        chip.textContent = text;
        chip.addEventListener("click", () => setInputAndSend(text));
        chips.appendChild(chip);
      });
      wrapper.appendChild(chips);
    }

    if (payload.actions?.length) {
      const actionsRow = document.createElement("div");
      actionsRow.className = "assistant-actions";
      payload.actions.forEach((action) => {
        const btn = document.createElement("button");
        btn.className = "uba-btn-ghost assistant-action-btn";
        btn.type = "button";
        btn.textContent = action.label;
        btn.addEventListener("click", () => handleAction(action));
        actionsRow.appendChild(btn);
      });
      wrapper.appendChild(actionsRow);
    }

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }

  function renderConversationHistory(limit = OVERLAY_HISTORY_LIMIT) {
    const container = qs(".uba-assistant-messages");
    if (!container) return;
    container.innerHTML = "";
    const history = readHistory(STORAGE_KEY).slice(-limit);
    history.forEach((msg) => renderAssistantMessage(container, msg.role, msg));
  }

  function handleAction(action) {
    if (!action) return;
    if (action.type === "navigate") {
      navigateTo(action.target);
    }
  }

  function setInputAndSend(text) {
    const input = qs("#uba-assistant-input");
    if (!input) return;
    input.value = text;
    input.focus();
    sendAssistantMessage();
  }

  function closeAssistant() {
    const panel = document.getElementById("uba-assistant-panel");
    if (panel) {
      panel.classList.add("is-hidden");
    }
    const fab = document.getElementById("uba-assistant-fab");
    if (fab) fab.focus({ preventScroll: true });
  }

  function openAssistant() {
    createAssistantUI();
    const panel = document.getElementById("uba-assistant-panel");
    if (panel) {
      panel.classList.remove("is-hidden");
      const input = panel.querySelector("#uba-assistant-input");
      if (input) input.focus();
      renderConversationHistory();
    }
  }

  function sendAssistantMessage() {
    const input = qs("#uba-assistant-input");
    const container = qs(".uba-assistant-messages");
    if (!input || !container) return;
    const text = input.value.trim();
    if (!text) return;

    const history = readHistory(STORAGE_KEY);
    const userPayload = { role: "user", text };
    history.push(userPayload);
    renderAssistantMessage(container, "user", userPayload);

    const intent = detectIntent(text);
    const reply = {
      role: "assistant",
      text:
        intent?.answer ||
        "I'm here to help. Try asking about clients, tasks or invoices.",
      suggestions: [
        "Show me my clients",
        "How do I add an invoice?",
        "Where is the task board?",
      ],
      actions: intent?.navigateTo
        ? [{ label: "Open page", type: "navigate", target: intent.navigateTo }]
        : [],
    };
    history.push(reply);
    renderAssistantMessage(container, "assistant", reply);

    writeHistory(history);
    input.value = "";
    input.focus();
  }

  function bindAssistantControls() {
    const sendButton = qs("#uba-assistant-send");
    const input = qs("#uba-assistant-input");
    const closeButton = qs("#uba-assistant-close");
    if (sendButton) {
      ["click", "touchend"].forEach((evt) =>
        sendButton.addEventListener(evt, sendAssistantMessage),
      );
    }
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendAssistantMessage();
        }
      });
    }
    if (closeButton) closeButton.addEventListener("click", closeAssistant);
  }

  function createAssistantUI() {
    const existing = document.getElementById("uba-assistant-panel");
    if (existing) return;

    const panel = document.createElement("div");
    panel.id = "uba-assistant-panel";
    panel.className = "uba-card uba-assistant-panel is-hidden";
    panel.innerHTML = `
      <div class="uba-card-header uba-assistant-header">
        <div>
          <div class="uba-card-title">UBA Assistant</div>
          <div class="uba-card-sub">Contextual help — local assistant</div>
        </div>
        <div class="assistant-header-actions">
          <button id="uba-assistant-close" class="uba-btn-ghost" aria-label="Close assistant">✕</button>
        </div>
      </div>
      <div class="uba-assistant-messages" aria-live="polite" role="region"></div>
      <form class="uba-assistant-input-row" id="uba-assistant-overlay-form">
        <label class="sr-only" for="uba-assistant-input">Ask UBA a question</label>
        <input
          id="uba-assistant-input"
          class="uba-assistant-input"
          placeholder="Ask UBA a question, e.g. 'How do I add a client?'"
          aria-label="Assistant input"
          autocomplete="off"
        />
        <button id="uba-assistant-send" class="uba-btn-primary" type="button">Send</button>
      </form>
    `;

    document.body.appendChild(panel);

    if (!document.getElementById("uba-assistant-fab")) {
      const fab = document.createElement("button");
      fab.id = "uba-assistant-fab";
      fab.className = "uba-assistant-fab uba-btn-primary";
      fab.type = "button";
      fab.title = "Open UBA Assistant";
      fab.innerHTML = "🤖";
      ["click", "touchend"].forEach((evt) =>
        fab.addEventListener(evt, openAssistant),
      );
      document.body.appendChild(fab);
    }

    bindAssistantControls();
    renderConversationHistory();
  }

  // --------------
  // Standalone assistant page (assistant.html)
  // --------------
  function initAssistantPage() {
    const pageId = document.getElementById("page-id");
    if (!pageId || pageId.dataset.page !== "assistant-page") return;

    const key = `${STORAGE_KEY}-page`;
    const container = document.getElementById("assistant-messages");
    const form = document.getElementById("assistant-form");
    const input = document.getElementById("assistant-input");

    function renderMessages() {
      const history = readHistory(key);
      if (!container) return;
      container.innerHTML = "";
      history.forEach((msg) => {
        const row = document.createElement("div");
        row.className = `uba-chat-msg ${msg.role === "user" ? "uba-chat-user" : "uba-chat-assistant"}`;
        row.textContent = msg.text;
        container.appendChild(row);
      });
      container.scrollTop = container.scrollHeight;
    }

    function sendFromForm(e) {
      e.preventDefault();
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      const history = readHistory(key);
      history.push({ role: "user", text });
      const intent = detectIntent(text);
      history.push({
        role: "assistant",
        text: intent?.answer || "Let me help you navigate the workspace.",
      });
      writeHistory(history, key);
      input.value = "";
      renderMessages();
    }

    if (form) form.addEventListener("submit", sendFromForm);
    renderMessages();
  }

  function initOverlayAssistant() {
    const pageId = document.getElementById("page-id")?.dataset?.page || "";
    if (pageId === "assistant-page") return; // standalone page handles its own UI
    createAssistantUI();
  }

  const api = {
    initAssistant: initOverlayAssistant,
    openAssistant,
    closeAssistant,
    initAssistantPage,
  };
  window.ubaAssistant = api;
  window.initAssistantPage = initAssistantPage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOverlayAssistant);
  } else {
    initOverlayAssistant();
  }
})();
