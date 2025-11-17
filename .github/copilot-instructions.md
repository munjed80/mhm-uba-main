### Purpose
This file gives AI coding agents focused, repo-specific instructions so they can be productive immediately.

**Big Picture**
- **Type:** Static single-page web app (no build tool). Files live under the repo root and `assets/`.
- **UI entry:** `index.html` — loads `assets/js/i18n.js` then `assets/js/app.js` and the Supabase CDN.
- **Data model & flow:** Authenticated data uses Supabase (tables: `invoices`, `clients`, `tasks`, `projects`). When no user exists the app falls back to local/demo seeds stored in `localStorage`.

**Where to look (key files)**
- `index.html` — main layout and DOM structure (data-i18n attributes, IDs used by JS).
- `assets/js/app.js` — primary app logic: Supabase client, auth guard, data loaders, UI wiring, and local-seed helpers (`LOCAL_KEYS`, `defaultSettings`).
- `assets/js/i18n.js` — translation dictionary and helpers (`applyTranslations`, `t`, `data-i18n` and `data-i18n-placeholder` usage).
- `assets/css/style.css` — global styles and component classes.

**Project-specific conventions & patterns**
- Local-first demo mode: if no Supabase session and on dashboard, `app.js` enables `demo` data and UI (`loadDemoDashboard`). Change seeds in `app.js` when updating demo content.
- Local storage keys are centralized in `LOCAL_KEYS` inside `assets/js/app.js` (e.g. `uba-local-clients`, `uba-local-invoices`). Use these keys when reading or writing local data.
- i18n: DOM strings use `data-i18n` (text) and `data-i18n-placeholder`. Use `window.ubaI18n.t(...)` for programmatic translations. The canonical translation map is in `assets/js/i18n.js`.
- Window-exposed functions: `login`, `logout`, `deleteClient` are defined globally (on `window`) and referenced from HTML. Keep signatures intact if editing.

**Database table & status conventions (used in queries)**
- Table names: `invoices`, `clients`, `tasks`, `projects`. Example: `supabase.from("invoices").select("amount, created_at, status")` in `loadKPIs`.
- Invoice statuses: `draft`, `sent`, `paid`, and code sometimes expects `overdue`.
- Task statuses: `todo`, `in_progress`, `done` (see `loadTasks`).
- Project stages: `lead`, `in_progress`, `ongoing` (see `loadPipeline`).

**Supabase integration notes**
- Supabase client is created in `assets/js/app.js` with `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants at top. These are currently placeholder values and must be replaced to test authenticated flows.
- The project pulls the Supabase library from CDN in `index.html`: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`.
- Query patterns: mostly `.from(...).select(...).eq('user_id', userId)` and `.insert(...)` / `.update(...)` / `.delete()`; follow existing patterns and error handling style (try/catch with console.error).

**UI wiring & lifecycle**
- The app runs an IIFE on load that checks the path and session and triggers `loadDashboardData` or `loadDemoDashboard`.
- Many renderers are idempotent and called on navigation (e.g., `renderClientsPage`, `renderInvoicePage`, `renderProjectsBoard`). If you change DOM IDs or class names, update their references in `app.js`.
- DOM wiring is done on `DOMContentLoaded` in `app.js`. Add event listeners there to follow existing conventions.

**Debug / dev workflow**
- No build step: open `index.html` in a browser or serve the directory with a simple static server (e.g. `npx http-server` or `python -m http.server`) to avoid CORS issues.
- To test Supabase flows, replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `assets/js/app.js` and reload.
- Use the browser console — the app logs lifecycle events (`Auth guard:` logs, `Supabase initialized:` etc.). Keep console logging consistent with current style when adding debug output.

**Examples to reference when editing**
- Replace Supabase keys: `assets/js/app.js` top constants `SUPABASE_URL` / `SUPABASE_ANON_KEY`.
- Local seeds: `localMiniInvoices`, `clientSeed`, `invoiceSeed`, `projectStagesSeed` in `assets/js/app.js` — update to change demo content.
- i18n example: elements use `<span data-i18n="nav.dashboard">Dashboard</span>` and placeholders like `data-i18n-placeholder="form.clientName"`.
- KPI query example: see `loadKPIs(userId)` in `assets/js/app.js` which computes totals using `.from('invoices')` and `.from('clients')`.

**What AI agents should not assume**
- There is no backend in this repo beyond Supabase usage; do not add server-side code here unless the user asks.
- Some features are intentionally local/demo; do not convert local seed usage to remote writes without confirming intended design.

If anything above is unclear or you want additional examples (e.g., sample Supabase row shape or a suggested unit-test harness), tell me which area and I will iterate the guidance.
