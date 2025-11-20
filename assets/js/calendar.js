// calendar.js — modern calendar page with improved styling and full functionality
(function () {
  let currentDate = new Date();
  let currentFilter = "all";

  function collectCalendarEvents() {
    const events = [];
    const store = window.ubaStore;

    try {
      // Tasks with due dates
      if (store && store.tasks && typeof store.tasks.getAll === "function") {
        const tasks = store.tasks.getAll() || [];
        tasks.forEach((task) => {
          if (task.due && /^\d{4}-\d{2}-\d{2}/.test(task.due)) {
            events.push({
              id: `task-${task.id}`,
              date: task.due.split('T')[0], // Handle datetime format
              type: "task",
              title: task.title || "Task",
              description: task.description || "",
              priority: task.priority || "medium",
              status: task.status || "todo",
              projectId: task.projectId
            });
          }
        });
      }

      // Invoices with due dates
      if (store && store.invoices && typeof store.invoices.getAll === "function") {
        const invoices = store.invoices.getAll() || [];
        invoices.forEach((invoice) => {
          if (invoice.due && /^\d{4}-\d{2}-\d{2}/.test(invoice.due)) {
            events.push({
              id: `invoice-${invoice.id}`,
              date: invoice.due.split('T')[0],
              type: "invoice",
              title: `${invoice.label || "Invoice"} — ${invoice.client || ""}`,
              amount: invoice.amount,
              status: invoice.status || "draft",
              client: invoice.client
            });
          }
        });
      }

      // Projects with deadlines
      if (store && store.projects && typeof store.projects.getAll === "function") {
        const projects = store.projects.getAll() || [];
        projects.forEach((project) => {
          const date = project.due || project.deadline || project.date;
          if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
            events.push({
              id: `project-${project.id}`,
              date: date.split('T')[0],
              type: "project",
              title: project.title || project.name || "Project",
              stage: project.stage || "lead",
              client: project.client,
              budget: project.budget
            });
          }
        });
      }

    } catch (err) {
      console.warn("calendar events collection error", err);
    }

    return events;
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    // Adjust to make Monday = 0
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  }

  function formatMonthYear(date) {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  function isToday(year, month, day) {
    const today = new Date();
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  }

  function getEventsByDate(events, dateStr) {
    return events.filter(event => 
      event.date === dateStr && 
      (currentFilter === "all" || event.type === currentFilter)
    );
  }

  function createEventPill(event) {
    const pill = document.createElement("div");
    pill.className = `uba-calendar-event uba-calendar-event-${event.type}`;
    
    let content = "";
    let icon = "";
    
    switch (event.type) {
      case "task":
        icon = event.priority === "high" ? "🔥" : event.priority === "low" ? "📝" : "✅";
        content = `${icon} ${event.title}`;
        if (event.status === "done") {
          pill.classList.add("completed");
        }
        break;
      case "invoice":
        icon = event.status === "paid" ? "💚" : event.status === "overdue" ? "🔴" : "💵";
        content = `${icon} ${event.client || "Invoice"}`;
        if (event.amount) {
          content += ` (€${event.amount})`;
        }
        break;
      case "project":
        icon = "💼";
        content = `${icon} ${event.title}`;
        if (event.stage === "completed") {
          pill.classList.add("completed");
        }
        break;
    }
    
    pill.textContent = content;
    pill.title = event.title + (event.description ? ` - ${event.description}` : "");
    
    return pill;
  }

  function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    if (!grid) return;
    
    grid.innerHTML = "";
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const events = collectCalendarEvents();
    
    // Update month title
    const monthTitle = document.getElementById("current-month");
    if (monthTitle) {
      monthTitle.textContent = formatMonthYear(currentDate);
    }

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "uba-calendar-day uba-calendar-day-empty";
      grid.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "uba-calendar-day";
      
      if (isToday(year, month, day)) {
        dayElement.classList.add("uba-calendar-day-today");
      }

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Day number
      const dayNumber = document.createElement("div");
      dayNumber.className = "uba-calendar-day-number";
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);

      // Events container
      const eventsContainer = document.createElement("div");
      eventsContainer.className = "uba-calendar-day-events";

      const dayEvents = getEventsByDate(events, dateStr);

      // Show up to 3 events as pills
      dayEvents.slice(0, 3).forEach((event) => {
        const eventPill = createEventPill(event);
        eventsContainer.appendChild(eventPill);
      });

      // Show "more" indicator if there are additional events
      if (dayEvents.length > 3) {
        const moreElement = document.createElement("div");
        moreElement.className = "uba-calendar-event-more";
        moreElement.textContent = `+${dayEvents.length - 3} more`;
        eventsContainer.appendChild(moreElement);
      }

      dayElement.appendChild(eventsContainer);
      grid.appendChild(dayElement);
    }
  }

  function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
  }

  function setFilter(filter) {
    currentFilter = filter;
    
    // Update filter button states
    const filterButtons = document.querySelectorAll("[data-filter]");
    filterButtons.forEach(btn => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-filter") === filter) {
        btn.classList.add("active");
      }
    });
    
    renderCalendar();
  }

  function initCalendarPage() {
    // Navigation buttons
    const prevBtn = document.getElementById("prev-month");
    const nextBtn = document.getElementById("next-month");
    
    if (prevBtn) {
      prevBtn.addEventListener("click", () => navigateMonth(-1));
    }
    
    if (nextBtn) {
      nextBtn.addEventListener("click", () => navigateMonth(1));
    }
    
    // Filter buttons
    const filterButtons = document.querySelectorAll("[data-filter]");
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.getAttribute("data-filter") || "all";
        setFilter(filter);
      });
    });
    
    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return; // Don't interfere with form inputs
      }
      
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
          currentDate = new Date(); // Go to current month
          renderCalendar();
          break;
      }
    });

    // Initial render
    renderCalendar();
  }

  window.initCalendarPage = initCalendarPage;
})();
