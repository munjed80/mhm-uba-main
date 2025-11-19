// tasks.js — standalone Tasks pipeline renderer
(function () {
  function safeText(value) {
    if (typeof window.escapeHtml === "function") {
      return window.escapeHtml(value || "");
    }
    return (value || "").toString().replace(/[&<>"']/g, function (c) {
      return (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
          c
        ] || c
      );
    });
  }

  function loadTaskColumns() {
    try {
      const store = window.ubaStore;
      if (store && store.tasks && typeof store.tasks.getAll === "function") {
        return JSON.parse(JSON.stringify(store.tasks.getAll() || []));
      }
      if (
        typeof ensureSeedData === "function" &&
        typeof LOCAL_KEYS !== "undefined"
      ) {
        const data = ensureSeedData(LOCAL_KEYS.tasks, taskBoardSeed || []);
        return JSON.parse(JSON.stringify(data || []));
      }
    } catch (e) {
      console.warn("renderTasksStandalone: failed to load data", e);
    }
    if (typeof taskBoardSeed !== "undefined") {
      return JSON.parse(JSON.stringify(taskBoardSeed || []));
    }
    return [];
  }

  function normalizeColumns(data) {
    if (!Array.isArray(data)) return [];
    if (data.length && data[0] && Array.isArray(data[0].tasks)) {
      return data.map((col) => ({
        id: (col.id || col.title || "").toString().toLowerCase(),
        title: col.title || col.id || "Tasks",
        tasks: Array.isArray(col.tasks) ? col.tasks.slice() : [],
      }));
    }
    return [{ id: "todo", title: "Tasks", tasks: data.slice() }];
  }

  function isDueToday(value) {
    if (!value) return false;
    const lower = value.toString().toLowerCase();
    if (lower.includes("today")) return true;
    try {
      const parsed = new Date(value);
      if (!isNaN(parsed)) {
        const todayISO = new Date().toISOString().slice(0, 10);
        return parsed.toISOString().slice(0, 10) === todayISO;
      }
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function collectTodayTasks(columns) {
    const ids = new Set();
    const tasks = [];
    columns.forEach((col) => {
      (col.tasks || []).forEach((task) => {
        const taskId = task.id || `${col.id}-${task.title}`;
        if (taskId && isDueToday(task.due) && !ids.has(taskId)) {
          ids.add(taskId);
          tasks.push(task);
        }
      });
    });
    return { ids, tasks };
  }

  function renderTaskCard(task) {
    const card = document.createElement("div");
    card.className = "uba-pipe-item";
    card.innerHTML = `
      <p class="uba-pipe-title">${safeText(task.title || "Untitled task")}</p>
      ${task.owner ? `<p class="uba-pipe-meta">Owner: ${safeText(task.owner)}</p>` : ""}
      ${task.due ? `<div class="uba-chip-row"><span class="uba-chip soft">${safeText(task.due)}</span></div>` : ""}
    `;
    return card;
  }

  function renderTaskList(container, source, skipIds, emptyMessage) {
    if (!container) return;
    container.innerHTML = "";
    const tasks = Array.isArray(source && source.tasks)
      ? source.tasks
      : Array.isArray(source)
        ? source
        : [];
    const filtered = tasks.filter((task) => {
      if (!skipIds) return true;
      const taskId = task && (task.id || task.title);
      return !taskId || !skipIds.has(taskId);
    });
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "uba-pipe-item";
      empty.textContent = emptyMessage || "No tasks yet.";
      container.appendChild(empty);
      return;
    }
    filtered.forEach((task) => container.appendChild(renderTaskCard(task)));
  }

  function renderTasksStandalone() {
    const backlogEl = document.getElementById("tasks-backlog");
    const todayEl = document.getElementById("tasks-today");
    const progressEl = document.getElementById("tasks-inprogress");
    const doneEl = document.getElementById("tasks-done");
    if (![backlogEl, todayEl, progressEl, doneEl].some(Boolean)) return;

    const columns = normalizeColumns(loadTaskColumns());
    const todayData = collectTodayTasks(columns);

    const matchStage = (needles, fallback) => {
      const found = columns.find((col) =>
        needles.some((needle) => col.id.includes(needle)),
      );
      if (found) return found;
      return fallback || { id: needles[0], tasks: [] };
    };

    const backlogColumn = matchStage(["backlog", "todo"], columns[0]);
    const inProgressBase = matchStage(["inprogress", "progress"], columns[1]);
    const reviewColumn = matchStage(["review"], null);
    const inProgressTasks = [];
    if (inProgressBase && Array.isArray(inProgressBase.tasks))
      inProgressTasks.push(...inProgressBase.tasks);
    if (
      reviewColumn &&
      reviewColumn !== inProgressBase &&
      Array.isArray(reviewColumn.tasks)
    ) {
      inProgressTasks.push(...reviewColumn.tasks);
    }
    const inProgress = { id: "inprogress", tasks: inProgressTasks };
    const doneColumn = matchStage(
      ["done", "complete", "completed"],
      columns[columns.length - 1],
    );

    renderTaskList(
      backlogEl,
      backlogColumn,
      todayData.ids,
      "No tasks in backlog.",
    );
    renderTaskList(todayEl, todayData.tasks, null, "Nothing due today.");
    renderTaskList(
      progressEl,
      inProgress,
      todayData.ids,
      "No active tasks right now.",
    );
    renderTaskList(
      doneEl,
      doneColumn,
      todayData.ids,
      "No tasks marked done yet.",
    );
  }

  function initTasksPage() {
    try {
      const boardGrid = document.getElementById("tasks-columns");
      if (boardGrid && typeof window.renderTasksBoard === "function") {
        window.renderTasksBoard();
        return;
      }

      renderTasksStandalone();
    } catch (e) {
      console.warn("initTasksPage error", e);
    }
  }

  window.renderTasksStandalone = renderTasksStandalone;
  window.initTasksPage = initTasksPage;
})();
