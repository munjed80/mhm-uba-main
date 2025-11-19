# MHM UBA Release QA Checklist

## 1. CRUD Flows
- [ ] Projects: Add, edit, delete projects; verify correct pipeline column.
- [ ] Tasks: Add, edit, delete tasks; check board updates.
- [ ] Clients: Add, edit, delete clients; confirm CRM list updates.
- [ ] Leads: Add, edit, delete leads; check pipeline.
- [ ] Expenses: Add, edit, delete expenses; verify list.
- [ ] Invoices: Add, edit, delete invoices; check billing table.

## 2. Persistence
- [ ] Make changes to each entity, reload the page, and confirm data is retained.

## 3. Navigation
- [ ] Use sidebar to navigate between all main pages (dashboard, clients, projects, tasks, invoices, smart tools, etc.).
- [ ] Confirm each page loads and displays correct data.

## 4. Assistant & Smart Tools
- [ ] Open UBA Assistant, ask questions, verify responses.
- [ ] Use smart tools features (quick insights, outreach, etc.), confirm UI updates.

## 5. Language & RTL
- [ ] Change language using selector; verify all labels and content update.
- [ ] Switch to Arabic; confirm RTL layout and correct translations.

## 6. Console & Errors
- [ ] Check browser console for errors or warnings on all pages.

## 7. Mobile & Desktop
- [ ] Test UI on desktop and mobile browsers; confirm responsive layout.

## 8. Accessibility
- [ ] Confirm modals/forms have labels, focus, and aria attributes.

---
If all boxes are checked, the app is ready for release!
