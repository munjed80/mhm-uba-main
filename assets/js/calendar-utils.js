(function () {
  const TYPE_META = {
    task: { label: "Task", icon: "✅", href: "tasks.html", param: "taskId" },
    invoice: { label: "Invoice", icon: "💵", href: "invoices.html", param: "invoiceId" },
    project: { label: "Project", icon: "💼", href: "projects.html", param: "projectId" },
  };

  function normalizeDate(value) {
    if (!value) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split("T")[0];
  }

  function toIndex(records) {
    return (records || []).reduce((acc, item) => {
      if (item && (item.id || item.clientId)) {
        acc[String(item.id || item.clientId)] = item;
      }
      return acc;
    }, {});
  }

  function buildLink(type, entityId) {
    const meta = TYPE_META[type];
    if (!meta) return "#";
    if (!entityId) return meta.href;
    return `${meta.href}?${meta.param}=${encodeURIComponent(entityId)}`;
  }

  function formatCurrency(amount) {
    if (!Number.isFinite(amount)) return "";
    return `€ ${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  function startOfDay(date) {
    const clone = new Date(date);
    clone.setHours(0, 0, 0, 0);
    return clone;
  }

  function formatRelativeDate(dateStr) {
    if (!dateStr) return "";
    const today = startOfDay(new Date());
    const target = startOfDay(new Date(`${dateStr}T00:00:00`));
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";

    return target.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function getEventSeverity(event) {
    if (!event) return "normal";
    if (event.type === "invoice" && event.status === "overdue") return "high";
    if (event.type === "task" && event.priority === "high") return "high";
    if (event.type === "invoice" && event.status === "paid") return "success";
    if (event.type === "project" && event.stage === "completed") return "success";
    return "normal";
  }

  function formatEventMeta(event) {
    if (!event) return "";
    const relative = formatRelativeDate(event.date);
    if (event.type === "invoice") {
      const parts = [event.clientName].filter(Boolean);
      if (event.amount) parts.push(formatCurrency(event.amount));
      if (event.status) parts.push(capitalize(event.status));
      return `${parts.join(" • ")} • ${relative}`;
    }
    if (event.type === "task") {
      const parts = [event.projectName || event.clientName || "Workspace"];
      if (event.priority) parts.push(`${capitalize(event.priority)} priority`);
      return `${parts.join(" • ")} • ${relative}`;
    }
    if (event.type === "project") {
      const parts = [event.clientName].filter(Boolean);
      if (event.stage) parts.push(capitalize(event.stage));
      return `${parts.join(" • ")} • ${relative}`;
    }
    return relative;
  }

  function capitalize(str) {
    if (!str) return "";
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  }

  function createEvent(type, payload) {
    const meta = TYPE_META[type];
    if (!meta || !payload) return null;
    const date = normalizeDate(payload.date);
    if (!date) return null;

    const entityId = payload.entityId || payload.id || payload.referenceId;
    const id = payload.id || `${type}-${entityId || crypto.randomUUID?.() || Date.now()}`;

    return {
      id,
      entityId,
      type,
      date,
      timestamp: new Date(`${date}T00:00:00`).getTime(),
      title: payload.title || meta.label,
      subtitle: payload.subtitle || "",
      status: payload.status || "",
      priority: payload.priority || "",
      stage: payload.stage || "",
      amount: payload.amount != null ? Number(payload.amount) : null,
      clientName: payload.clientName || "",
      projectName: payload.projectName || "",
      icon: payload.icon || meta.icon,
      sourceLabel: payload.sourceLabel || meta.label,
      url: payload.url || buildLink(type, entityId),
      raw: payload.raw || null,
    };
  }

  function collectFromStore() {
    const store = window.ubaStore || {};
    const clients = toIndex(store.clients?.getAll?.());
    const projects = toIndex(store.projects?.getAll?.());

    const events = [];

    const tasks = store.tasks?.getAll?.() || [];
    tasks.forEach((task) => {
      const date = task.due || task.dueDate;
      const project = task.projectId ? projects[String(task.projectId)] : null;
      const client = task.clientId ? clients[String(task.clientId)] : null;
      const event = createEvent("task", {
        id: `task-${task.id}`,
        entityId: task.id,
        date,
        title: task.title || "Task",
        status: task.status,
        priority: task.priority,
        clientName: client?.name || task.clientName,
        projectName: project?.name || task.projectName,
        subtitle: task.description || "",
        raw: task,
      });
      if (event) events.push(event);
    });

    const invoices = store.invoices?.getAll?.() || [];
    invoices.forEach((invoice) => {
      const date = invoice.due || invoice.dueDate;
      const client = invoice.clientId ? clients[String(invoice.clientId)] : null;
      const event = createEvent("invoice", {
        id: `invoice-${invoice.id}`,
        entityId: invoice.id,
        date,
        title: invoice.label || `Invoice ${invoice.number || ""}`.trim(),
        status: invoice.status,
        amount: invoice.amount,
        clientName: invoice.client || client?.name,
        raw: invoice,
      });
      if (event) events.push(event);
    });

    const projectList = store.projects?.getAll?.() || [];
    projectList.forEach((project) => {
      const date = project.deadline || project.due || project.date;
      const client = project.clientId ? clients[String(project.clientId)] : null;
      const event = createEvent("project", {
        id: `project-${project.id}`,
        entityId: project.id,
        date,
        title: project.name || project.title || "Project",
        stage: project.stage || project.status,
        clientName: project.client || client?.name,
        subtitle: project.summary || "",
        raw: project,
      });
      if (event) events.push(event);
    });

    return events;
  }

  function collectFromFallback() {
    if (!Array.isArray(window.ubaCalendarEvents)) return [];
    return window.ubaCalendarEvents
      .map((item, idx) =>
        createEvent(item.type || "task", {
          id: item.id || `seed-${idx}`,
          date: item.date,
          title: item.title,
          status: item.status,
          priority: item.priority,
          stage: item.stage,
          clientName: item.client,
          amount: item.amount,
        }),
      )
      .filter(Boolean);
  }

  function applyFilters(events, options = {}) {
    let filtered = events.slice();

    if (options.types && options.types.length) {
      filtered = filtered.filter((event) => options.types.includes(event.type));
    }

    if (options.date) {
      filtered = filtered.filter((event) => event.date === options.date);
    }

    if (options.rangeStart) {
      const start = new Date(`${normalizeDate(options.rangeStart)}T00:00:00`).getTime();
      filtered = filtered.filter((event) => event.timestamp >= start);
    }

    if (options.rangeEnd) {
      const end = new Date(`${normalizeDate(options.rangeEnd)}T23:59:59`).getTime();
      filtered = filtered.filter((event) => event.timestamp <= end);
    }

    if (options.search) {
      const query = options.search.toLowerCase();
      filtered = filtered.filter((event) =>
        [event.title, event.clientName, event.projectName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query)),
      );
    }

    filtered.sort((a, b) => {
      if (options.sort === "desc") {
        return b.timestamp - a.timestamp;
      }
      return a.timestamp - b.timestamp;
    });

    if (Number.isFinite(options.limit) && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  function collectEvents(options = {}) {
    const fromStore = collectFromStore();
    const source = fromStore.length ? fromStore : collectFromFallback();
    return applyFilters(source, options);
  }

  const api = {
    collectEvents,
    buildLink,
    formatCurrency,
    formatRelativeDate,
    formatEventMeta,
    getEventSeverity,
    capitalize,
  };

  window.UBACalendar = api;
  window.UBA = window.UBA || {};
  window.UBA.calendar = api;
})();
