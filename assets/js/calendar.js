// calendar.js — unified calendar view linked with workspace data
(function () {
  let currentDate = new Date();
  let currentFilter = "all";
  let selectedDate = null;
  let highlightedEventId = null;
  let eventsCache = [];
  let searchQuery = "";
  let currentViewMode = "month";

  function refreshEvents() {
    try {
      if (window.UBACalendar && typeof window.UBACalendar.collectEvents === "function") {
        eventsCache = window.UBACalendar.collectEvents();
      } else {
        eventsCache = [];
      }
    } catch (err) {
      console.warn("calendar: failed to refresh events", err);
      eventsCache = [];
    }
  }

  function ensureEvents() {
    if (!eventsCache.length) {
      refreshEvents();
    }
    return eventsCache;
  }

  function getTodayISO() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function formatMonthYear(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  }

  function toISODate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function getMonthRange(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { startISO: toISODate(start), endISO: toISODate(end) };
  }

  function parseISODate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    if ([y, m, d].some((value) => Number.isNaN(value))) return null;
    return new Date(y, m - 1, d);
  }

  function formatAgendaLabels(dateStr) {
    const date = parseISODate(dateStr);
    if (!date) {
      return { primary: dateStr || "", secondary: "" };
    }
    return {
      primary: date.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      secondary: date.toLocaleDateString(undefined, { weekday: "short" }),
    };
  }

  function matchesSearch(event) {
    if (!searchQuery) return true;
    const haystack = [event.title, event.clientName, event.projectName, event.sourceLabel]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(searchQuery);
  }

  function includeEvent(event) {
    if (!event) return false;
    if (currentFilter !== "all" && event.type !== currentFilter) return false;
    return matchesSearch(event);
  }

  function isToday(year, month, day) {
    const today = new Date();
    return (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    );
  }

  function createEventPill(event) {
    const pill = document.createElement("div");
    pill.className = `uba-calendar-event uba-calendar-event-${event.type}`;
    pill.textContent = `${event.icon || "•"} ${event.title}`;
    pill.title = event.title;
    pill.dataset.eventId = event.id;
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      selectDate(event.date, event.id);
    });
    return pill;
  }

  function getEventsForDate(dateStr) {
    return ensureEvents().filter(
      (event) => event.date === dateStr && includeEvent(event),
    );
  }

  function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    if (!grid) return;

    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const events = ensureEvents().filter(includeEvent);

    const monthTitle = document.getElementById("current-month");
    if (monthTitle) {
      monthTitle.textContent = formatMonthYear(currentDate);
    }

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "uba-calendar-day uba-calendar-day-empty";
      grid.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "uba-calendar-day";
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dayElement.dataset.date = dateStr;

      if (isToday(year, month, day)) {
        dayElement.classList.add("uba-calendar-day-today");
      }

      if (selectedDate === dateStr) {
        dayElement.classList.add("selected");
      }

      dayElement.addEventListener("click", () => selectDate(dateStr));

      const dayNumber = document.createElement("div");
      dayNumber.className = "uba-calendar-day-number";
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);

      const eventsContainer = document.createElement("div");
      eventsContainer.className = "uba-calendar-day-events";
      const dayEvents = events.filter((event) => event.date === dateStr);

      dayEvents.slice(0, 3).forEach((event) => {
        const pill = createEventPill(event);
        eventsContainer.appendChild(pill);
      });

      if (dayEvents.length > 3) {
        const moreElement = document.createElement("div");
        moreElement.className = "uba-calendar-event-more";
        moreElement.textContent = `+${dayEvents.length - 3} more`;
        eventsContainer.appendChild(moreElement);
      }

        dayElement.appendChild(eventsContainer);
        grid.appendChild(dayElement);
      }

      updateHeroStats();
      updateViewModeUI();
  }

  function highlightCalendarCells() {
    document.querySelectorAll(".uba-calendar-day[data-date]").forEach((cell) => {
      if (cell.dataset.date === selectedDate) {
        cell.classList.add("selected");
      } else {
        cell.classList.remove("selected");
      }
    });
  }

  function renderDayPanel() {
    const dateLabel = document.getElementById("calendar-panel-date");
    const summary = document.getElementById("calendar-panel-summary");
    const list = document.getElementById("calendar-day-events");
    if (!dateLabel || !summary || !list) return;

    if (!selectedDate) {
      dateLabel.textContent = "Choose a date";
      summary.textContent = "Select a day in the calendar to view linked work.";
      list.innerHTML = `
        <div class="calendar-empty-state">
          <p>No date selected yet</p>
          <small>Select any day to inspect its linked work.</small>
        </div>
      `;
      return;
    }

    const readable = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
      undefined,
      { weekday: "long", month: "long", day: "numeric" },
    );
    dateLabel.textContent = readable;

    const events = getEventsForDate(selectedDate);
    if (!events.length) {
      summary.textContent = "No linked tasks, invoices, or projects on this day.";
      list.innerHTML = `
        <div class="calendar-empty-state">
          <p>No linked work</p>
          <small>Add a task, invoice, or milestone to populate this date.</small>
        </div>
      `;
      return;
    }

    summary.textContent = `${events.length} linked ${events.length === 1 ? "item" : "items"}.`;
    list.innerHTML = events.map((event) => renderLinkedItem(event)).join("");

    list.querySelectorAll("[data-event-link]").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        openEventLink(button.getAttribute("data-event-link"));
      });
    });

    if (highlightedEventId) {
      const target = list.querySelector(`[data-event-id="${highlightedEventId}"]`);
      if (target) {
        target.classList.add("active");
        target.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }

  function updateHeroStats() {
    const totalEl = document.getElementById("calendar-stat-total");
    const weekEl = document.getElementById("calendar-stat-week");
    const overdueEl = document.getElementById("calendar-stat-overdue");
    if (!totalEl && !weekEl && !overdueEl) return;

    const events = ensureEvents();
    const { startISO, endISO } = getMonthRange(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAhead = new Date(today);
    weekAhead.setDate(weekAhead.getDate() + 7);

    const monthEvents = events.filter((event) => event.date >= startISO && event.date <= endISO);
    const weekEvents = events.filter((event) => {
      const date = parseISODate(event.date);
      if (!date) return false;
      return date >= today && date <= weekAhead;
    });

    const overdueEvents = events.filter((event) => {
      const date = parseISODate(event.date);
      if (!date) return false;
      const inPast = date < today;
      if (event.type === "invoice") {
        return event.status === "overdue" || (inPast && event.status !== "paid");
      }
      if (event.type === "task") {
        return inPast && !["done", "completed"].includes((event.status || "").toLowerCase());
      }
      return false;
    });

    if (totalEl) totalEl.textContent = monthEvents.length.toLocaleString();
    if (weekEl) weekEl.textContent = weekEvents.length.toLocaleString();
    if (overdueEl) overdueEl.textContent = overdueEvents.length.toLocaleString();
  }

  function renderAgenda() {
    const agendaEl = document.getElementById("calendar-agenda");
    const monthView = document.querySelector(".uba-calendar");
    if (!agendaEl || !monthView) return;

    const isAgenda = currentViewMode === "agenda";
    agendaEl.hidden = !isAgenda;
    monthView.classList.toggle("is-hidden", isAgenda);

    if (!isAgenda) return;

    const { startISO, endISO } = getMonthRange(currentDate);
    const events = ensureEvents()
      .filter((event) => event.date >= startISO && event.date <= endISO)
      .filter(includeEvent)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (!events.length) {
      agendaEl.innerHTML = `
        <div class="calendar-agenda-empty">
          <p>No linked work</p>
          <small>Add a task, invoice, or milestone to populate this month.</small>
        </div>
      `;
      return;
    }

    agendaEl.innerHTML = events
      .map((event) => {
        const labels = formatAgendaLabels(event.date);
        const meta = window.UBACalendar?.formatEventMeta?.(event) || "";
        const isActive = event.id === highlightedEventId || event.date === selectedDate;
        const pillLabel = window.UBACalendar?.capitalize?.(event.type) || event.type;
        return `
          <article class="calendar-agenda-item${isActive ? " active" : ""}" data-event-id="${event.id}" data-date="${event.date}">
            <div class="agenda-date">
              <span>${labels.primary}</span>
              <small>${labels.secondary}</small>
            </div>
            <div class="agenda-body">
              <p class="agenda-title">${event.title}</p>
              <p class="agenda-meta">${meta}</p>
            </div>
            <span class="agenda-pill agenda-pill-${event.type}">${pillLabel}</span>
          </article>
        `;
      })
      .join("");

    agendaEl.querySelectorAll(".calendar-agenda-item").forEach((item) => {
      item.addEventListener("click", () => {
        selectDate(item.dataset.date, item.getAttribute("data-event-id"));
      });
    });
  }

  function updateViewModeUI() {
    document.querySelectorAll("[data-calendar-view]").forEach((button) => {
      const mode = button.getAttribute("data-calendar-view");
      const isActive = mode === currentViewMode;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    renderAgenda();
  }

  function renderLinkedItem(event) {
    const severity = window.UBACalendar?.getEventSeverity?.(event) || "normal";
    const meta = window.UBACalendar?.formatEventMeta?.(event) || "";
    return `
      <div class="calendar-linked-item" data-event-id="${event.id}" data-type="${event.type}" data-severity="${severity}">
        <div class="calendar-linked-type">${event.icon || "•"}</div>
        <div class="calendar-linked-body">
          <p class="calendar-linked-title">${event.title}</p>
          <p class="calendar-linked-meta">${meta}</p>
        </div>
        <div class="calendar-linked-actions">
          <button class="uba-btn uba-btn-ghost uba-btn-sm" data-event-link="${event.id}">Open</button>
        </div>
      </div>
    `;
  }

  function openEventLink(eventId) {
    const event = ensureEvents().find((item) => item.id === eventId);
    if (!event) return;
    if (event.url) {
      window.location.href = event.url;
    }
  }

  function selectDate(dateStr, eventId) {
    selectedDate = dateStr;
    highlightedEventId = eventId || null;
    highlightCalendarCells();
    renderDayPanel();
    renderAgenda();
    highlightedEventId = null;
  }

  function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
    highlightCalendarCells();
  }

  function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-filter") === filter);
    });
    renderCalendar();
    renderDayPanel();
  }

  function setViewMode(mode) {
    if (!mode || mode === currentViewMode) return;
    currentViewMode = mode;
    updateViewModeUI();
    highlightCalendarCells();
  }

  function handlePanelAction(action) {
    switch (action) {
      case "new-task":
        window.location.href = "tasks.html#new";
        break;
      case "new-invoice":
        window.location.href = "invoices.html#new";
        break;
      case "open-dashboard":
        window.location.href = "index.html";
        break;
      default:
        break;
    }
  }

  function handleSearchInput(value) {
    const next = (value || "").trim().toLowerCase();
    if (next === searchQuery) return;
    searchQuery = next;
    renderCalendar();
    renderDayPanel();
  }

  function initCalendarPage() {
    refreshEvents();
    renderCalendar();
    selectDate(getTodayISO());

    const prevBtn = document.getElementById("prev-month");
    const nextBtn = document.getElementById("next-month");
    const todayBtn = document.getElementById("calendar-today-btn");
    const refreshBtn = document.getElementById("calendar-refresh-btn");

    if (prevBtn) prevBtn.addEventListener("click", () => navigateMonth(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => navigateMonth(1));
    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        currentDate = new Date();
        renderCalendar();
        selectDate(getTodayISO());
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        refreshEvents();
        renderCalendar();
        renderDayPanel();
      });
    }

    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => setFilter(button.getAttribute("data-filter") || "all"));
    });

    const searchInput = document.getElementById("calendar-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => handleSearchInput(e.target.value));
    }

    document.querySelectorAll("[data-calendar-view]").forEach((button) => {
      button.addEventListener("click", () => setViewMode(button.getAttribute("data-calendar-view")));
    });

    document.querySelectorAll("[data-panel-action]").forEach((button) => {
      button.addEventListener("click", () => handlePanelAction(button.getAttribute("data-panel-action")));
    });

    document.addEventListener("keydown", (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          navigateMonth(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          navigateMonth(1);
          break;
        case "Home":
          e.preventDefault();
          currentDate = new Date();
          renderCalendar();
          selectDate(getTodayISO());
          break;
        default:
          break;
      }
    });
  }

  window.initCalendarPage = initCalendarPage;
})();
