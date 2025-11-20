// calendar.js — modern calendar page with improved styling
(function () {
  function collectCalendarEvents() {
    const events = [];
    const store = window.ubaStore;

    try {
      if (store && store.invoices && typeof store.invoices.getAll === "function") {
        (store.invoices.getAll() || []).forEach((invoice) => {
          if (invoice.due) {
            events.push({
              id: `inv-${invoice.id}`,
              date: invoice.due,
              type: "invoice",
              title: `${invoice.label || "Invoice"} — ${invoice.client || ""}`,
              time: invoice.time || "",
            });
          }
        });
      }

      if (store && store.tasks && typeof store.tasks.getAll === "function") {
        const tasksRaw = store.tasks.getAll() || [];
        if (Array.isArray(tasksRaw)) {
          tasksRaw.forEach((task) => {
            if (task.due && /^\d{4}-\d{2}-\d{2}/.test(task.due)) {
              events.push({
                id: `task-${task.id}`,
                date: task.due,
                type: "task",
                title: task.title || "Task",
                time: task.time || "",
              });
            }
          });
        }
      }

      if (store && store.projects && typeof store.projects.getAll === "function") {
        const projectsRaw = store.projects.getAll() || [];
        if (Array.isArray(projectsRaw)) {
          projectsRaw.forEach((project) => {
            const date = project.due || project.date;
            if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
              events.push({
                id: `proj-${project.id}`,
                date,
                type: "project",
                title: project.title || project.name || "Project",
                time: project.time || "",
              });
            }
          });
        }
      }

      if (window.ubaCalendarEvents && Array.isArray(window.ubaCalendarEvents)) {
        window.ubaCalendarEvents.forEach((evt) => events.push(evt));
      }
    } catch (err) {
      console.warn("calendar aggregate error", err);
    }

    return events;
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function renderCalendar(grid, events, filter) {
    if (!grid) return;
    
    grid.innerHTML = "";
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
    
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Monday = 0

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "calendar-day empty";
      grid.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";
      
      if (day === currentDay) {
        dayElement.classList.add("today");
      }

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const dayNumber = document.createElement("div");
      dayNumber.className = "calendar-day-number";
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);

      const eventsContainer = document.createElement("div");
      eventsContainer.className = "calendar-day-events";

      const dayEvents = events.filter(
        (event) => event.date === dateStr && (filter === "all" || event.type === filter)
      );

      dayEvents.slice(0, 3).forEach((event, index) => {
        const eventElement = document.createElement("div");
        eventElement.className = `calendar-event event-${event.type}`;
        eventElement.textContent = event.title;
        eventElement.title = `${event.title} (${event.type})`;
        eventsContainer.appendChild(eventElement);
      });

      if (dayEvents.length > 3) {
        const moreElement = document.createElement("div");
        moreElement.className = "calendar-event-more";
        moreElement.textContent = `+${dayEvents.length - 3} more`;
        eventsContainer.appendChild(moreElement);
      }

      dayElement.appendChild(eventsContainer);
      grid.appendChild(dayElement);
    }
  }

  function initCalendarPage() {
    const grid = document.getElementById("calendar-grid");
    const filterButtons = document.querySelectorAll("[data-filter]");
    
    if (!grid || !filterButtons.length) return;

    const events = collectCalendarEvents();
    let currentFilter = "all";

    const render = () => renderCalendar(grid, events, currentFilter);

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove("active"));
        // Add active class to clicked button
        button.classList.add("active");
        
        currentFilter = button.getAttribute("data-filter") || "all";
        render();
      });
    });

    render();
  }

  window.initCalendarPage = initCalendarPage;
})();
