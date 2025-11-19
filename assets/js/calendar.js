// calendar.js — calendar page initializer
(function () {
  function collectCalendarEvents() {
    const events = [];
    const store = window.ubaStore;

    try {
      if (store && store.invoices && typeof store.invoices.getAll === 'function') {
        (store.invoices.getAll() || []).forEach((invoice) => {
          if (invoice.due) {
            events.push({
              id: `inv-${invoice.id}`,
              date: invoice.due,
              type: 'invoice',
              title: `${invoice.label || 'Invoice'} — ${invoice.client || ''}`,
              time: invoice.time || '',
            });
          }
        });
      }

      if (store && store.tasks && typeof store.tasks.getAll === 'function') {
        const tasksRaw = store.tasks.getAll() || [];
        if (Array.isArray(tasksRaw) && tasksRaw.length && tasksRaw[0].tasks) {
          tasksRaw.forEach((col) =>
            (col.tasks || []).forEach((task) => {
              if (task.due && /^\d{4}-\d{2}-\d{2}/.test(task.due)) {
                events.push({
                  id: `task-${task.id}`,
                  date: task.due,
                  type: 'project',
                  title: task.title,
                  time: task.time || '',
                });
              }
            })
          );
        } else if (Array.isArray(tasksRaw)) {
          tasksRaw.forEach((task) => {
            if (task.due && /^\d{4}-\d{2}-\d{2}/.test(task.due)) {
              events.push({
                id: `task-${task.id}`,
                date: task.due,
                type: 'project',
                title: task.title,
                time: task.time || '',
              });
            }
          });
        }
      }

      if (store && store.projects && typeof store.projects.getAll === 'function') {
        const projectsRaw = store.projects.getAll() || [];
        if (Array.isArray(projectsRaw)) {
          projectsRaw.forEach((stage) =>
            (stage.items || []).forEach((item) => {
              const date = item.due || item.date;
              if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
                events.push({
                  id: `proj-${item.id}`,
                  date,
                  type: 'project',
                  title: item.name || item.title || 'Project milestone',
                  time: item.time || '',
                });
              }
            })
          );
        }
      }

      if (window.ubaCalendarEvents && Array.isArray(window.ubaCalendarEvents)) {
        window.ubaCalendarEvents.forEach((evt) => events.push(evt));
      }
    } catch (err) {
      console.warn('calendar aggregate error', err);
    }

    return events;
  }

  function renderCalendar(grid, events, filter, filterLabelNode) {
    grid.innerHTML = '';
    for (let d = 1; d <= 30; d++) {
      const day = document.createElement('div');
      day.className = 'uba-card uba-calendar-day';
      const dateStr = `2025-11-${String(d).padStart(2, '0')}`;

      const title = document.createElement('div');
      title.className = 'calendar-day-label';
      title.style.marginBottom = '6px';
      title.textContent = `Nov ${d}`;
      day.appendChild(title);

      const list = document.createElement('div');
      list.className = 'calendar-events';
      const todays = events.filter((event) => event.date === dateStr && (filter === 'all' || event.type === filter));
      if (todays.length) {
        todays.forEach((event) => {
          const eventDiv = document.createElement('div');
          eventDiv.className = 'uba-support-card calendar-event-card';
          eventDiv.innerHTML = `<div style="width:36px;">${event.time || ''}</div><div><strong>${event.title}</strong><div style="font-size:12px;color:var(--muted)">${event.type}</div></div>`;
          list.appendChild(eventDiv);
        });
      } else {
        const empty = document.createElement('div');
        empty.className = 'calendar-empty';
        empty.textContent = '—';
        list.appendChild(empty);
      }

      day.appendChild(list);
      grid.appendChild(day);
    }

    if (filterLabelNode) {
      const active = document.querySelector(`[data-filter="${filter}"]`);
      filterLabelNode.textContent = active ? active.textContent : 'All';
    }
  }

  function initCalendarPage() {
    const grid = document.getElementById('calendar-grid');
    const filterButtons = document.querySelectorAll('[data-filter]');
    const filterLabel = document.getElementById('calendar-filter');
    if (!grid || !filterButtons.length) return;

    const events = collectCalendarEvents();
    let currentFilter = 'all';

    const render = () => renderCalendar(grid, events, currentFilter, filterLabel);

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        currentFilter = button.getAttribute('data-filter') || 'all';
        render();
      });
    });

    render();
  }

  window.initCalendarPage = initCalendarPage;
})();
