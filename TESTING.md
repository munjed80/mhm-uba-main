Quick test instructions

Manual smoke test (recommended):
1. Serve the project from the repo root:

```powershell
cd e:\uba\mhm-uba-main
python -m http.server 8000
```

2. Open `http://localhost:8000/index.html` in a browser.
3. Navigate: Dashboard → Projects → Tasks → Invoices → Projects → Tasks.
4. Projects: click `Add project`, create a project, edit it, then delete it. Verify localStorage under key `uba-local-projects`.
5. Smart Tools: open Assistant and check that messages persist in localStorage under `ubaAssistantHistory`.

Run Cypress smoke test (optional):
1. Install Cypress or run with npx:

```powershell
cd e:\uba\mhm-uba-main
npx cypress open --config baseUrl=http://localhost:8000
```

2. Choose the `smoke.cy.js` test and run it. It performs the basic Projects CRUD flow.

Notes
- The Cypress test is a best-effort smoke test and may need small selectors tweaks depending on runtime DOM differences.
- i18n keys for the project modal were added to `assets/js/i18n.js` (English + Arabic). Other languages fallback to English.
