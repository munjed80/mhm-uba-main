# UBA Dashboard - Comprehensive Test Plan

Complete manual testing guide for validating all MVP features before and after deployment.

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Authentication Testing](#authentication-testing)
3. [Clients Module Testing](#clients-module-testing)
4. [Projects Module Testing](#projects-module-testing)
5. [Tasks Module Testing](#tasks-module-testing)
6. [Invoices Module Testing](#invoices-module-testing)
7. [Dashboard Testing](#dashboard-testing)
8. [Cross-Browser Testing](#cross-browser-testing)
9. [Mobile Testing](#mobile-testing)
10. [Performance Testing](#performance-testing)
11. [Security Testing](#security-testing)
12. [Regression Testing](#regression-testing)

---

## Test Environment Setup

### Prerequisites

**Before testing:**
- [ ] Supabase project configured
- [ ] SQL migrations applied
- [ ] Environment variables set
- [ ] Application deployed (or running locally)
- [ ] Browser DevTools open
- [ ] Console cleared of errors

### Test Data Preparation

**Create sample data:**
- 5 clients
- 3 projects (different stages)
- 10 tasks (different statuses)
- 5 invoices (different statuses)

**Test users:**
- Primary test user: `test@example.com` / `Test123!`
- Secondary test user: `test2@example.com` / `Test456!`

---

## Authentication Testing

### Test Case 1.1: User Registration (Signup)

**Steps:**
1. Navigate to `/signup.html`
2. Enter:
   - Name: `Test User`
   - Email: `newuser@test.com`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
3. Click "Sign Up"

**Expected Results:**
- ✅ Form validation passes
- ✅ Success notification appears
- ✅ Redirect to login page
- ✅ User created in Supabase auth table

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 1.2: User Registration (Weak Password)

**Steps:**
1. Navigate to `/signup.html`
2. Enter weak password: `weak`
3. Click "Sign Up"

**Expected Results:**
- ✅ Validation error appears
- ✅ Error message: "Password must be at least 8 characters"
- ✅ No form submission
- ✅ Error clears when field updated

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 1.3: User Registration (Password Mismatch)

**Steps:**
1. Navigate to `/signup.html`
2. Enter:
   - Password: `Test123!`
   - Confirm: `Different123!`
3. Click "Sign Up"

**Expected Results:**
- ✅ Validation error: "Passwords do not match"
- ✅ Red border on password fields
- ✅ No submission

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 1.4: User Login (Valid Credentials)

**Steps:**
1. Navigate to `/login.html`
2. Enter valid credentials
3. Click "Log In"

**Expected Results:**
- ✅ Success notification
- ✅ Redirect to dashboard (index.html)
- ✅ User name displayed in header
- ✅ Session persists

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 1.5: User Login (Invalid Credentials)

**Steps:**
1. Navigate to `/login.html`
2. Enter wrong password
3. Click "Log In"

**Expected Results:**
- ✅ Error notification: "Invalid email or password"
- ✅ No raw Supabase error shown
- ✅ No redirect
- ✅ Form not cleared

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 1.6: Session Persistence

**Steps:**
1. Login successfully
2. Navigate to dashboard
3. Refresh page (F5)

**Expected Results:**
- ✅ User remains logged in
- ✅ No redirect to login
- ✅ User data loads correctly

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 1.7: Protected Page Access (Unauthorized)

**Steps:**
1. Logout or open incognito window
2. Navigate directly to `/index.html`

**Expected Results:**
- ✅ Automatic redirect to `/login.html`
- ✅ Return URL saved
- ✅ After login, redirect back to intended page

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 1.8: Logout

**Steps:**
1. Login successfully
2. Click logout button
3. Try to access protected page

**Expected Results:**
- ✅ Session cleared
- ✅ Redirect to login page
- ✅ Cannot access protected pages
- ✅ Success notification

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

## Clients Module Testing

### Test Case 2.1: View Clients List

**Steps:**
1. Login and navigate to `/clients.html`

**Expected Results:**
- ✅ Page loads without errors
- ✅ Table displays all clients
- ✅ Columns: Name, Email, Phone, Company, Actions
- ✅ Loading state shown initially

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 2.2: Create New Client

**Steps:**
1. Click "Add Client" button
2. Fill form:
   - Name: `Acme Corporation`
   - Email: `contact@acme.com`
   - Phone: `555-0123`
   - Company: `Acme Corp`
   - Notes: `Test client`
3. Click "Save"

**Expected Results:**
- ✅ Form validation passes
- ✅ Success notification
- ✅ Client appears in table
- ✅ Modal closes
- ✅ Data saved in Supabase

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 2.3: Edit Existing Client

**Steps:**
1. Click "Edit" on a client row
2. Modify name to `Updated Client`
3. Click "Save"

**Expected Results:**
- ✅ Modal pre-fills with current data
- ✅ Success notification
- ✅ Table updates immediately
- ✅ Changes persisted in database

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 2.4: Delete Client

**Steps:**
1. Click "Delete" on a client
2. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Success notification after confirmation
- ✅ Client removed from table
- ✅ Deleted from database

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 2.5: Client Form Validation

**Steps:**
1. Click "Add Client"
2. Leave name empty
3. Enter invalid email: `notanemail`
4. Click "Save"

**Expected Results:**
- ✅ Validation errors shown
- ✅ "Name is required"
- ✅ "Invalid email format"
- ✅ No submission
- ✅ Inline error messages (red border)

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

## Projects Module Testing

### Test Case 3.1: View Projects Board

**Steps:**
1. Navigate to `/projects.html`

**Expected Results:**
- ✅ Kanban board displays
- ✅ Columns: Lead, In Progress, Ongoing
- ✅ Projects in correct columns
- ✅ Counts displayed accurately

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 3.2: Create New Project

**Steps:**
1. Click "Add Project"
2. Fill form:
   - Title: `New Website`
   - Client: Select from dropdown
   - Budget: `$5000`
   - Description: `Build company website`
   - Status: `lead`
3. Click "Save"

**Expected Results:**
- ✅ Validation passes
- ✅ Success notification
- ✅ Project appears in "Lead" column
- ✅ Counts updated
- ✅ Saved in database

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 3.3: Drag and Drop Project

**Steps:**
1. Drag project from "Lead" column
2. Drop in "In Progress" column

**Expected Results:**
- ✅ Visual feedback during drag
- ✅ Project moves to new column
- ✅ Counts updated
- ✅ Status saved in database
- ✅ Success notification

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 3.4: Edit Project

**Steps:**
1. Click project card
2. Click "Edit"
3. Update budget to `$7500`
4. Click "Save"

**Expected Results:**
- ✅ Modal shows current data
- ✅ Changes saved
- ✅ Card updates
- ✅ Success notification

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 3.5: Delete Project

**Steps:**
1. Click project card
2. Click "Delete"
3. Confirm

**Expected Results:**
- ✅ Confirmation required
- ✅ Project removed
- ✅ Counts updated
- ✅ Success notification

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

## Tasks Module Testing

### Test Case 4.1: View Tasks Board

**Steps:**
1. Navigate to `/tasks.html`

**Expected Results:**
- ✅ Kanban board displays
- ✅ Columns: To Do, In Progress, Done
- ✅ Tasks in correct columns
- ✅ Counts accurate

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 4.2: Create New Task

**Steps:**
1. Click "Add Task"
2. Fill form:
   - Title: `Design homepage`
   - Project: Select from dropdown
   - Description: `Create mockup`
   - Due Date: Tomorrow
   - Priority: `high`
   - Status: `todo`
3. Click "Save"

**Expected Results:**
- ✅ Task created
- ✅ Appears in "To Do" column
- ✅ Success notification
- ✅ Counts updated

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 4.3: Drag and Drop Task

**Steps:**
1. Drag task from "To Do"
2. Drop in "In Progress"

**Expected Results:**
- ✅ Task moves
- ✅ Status updated in DB
- ✅ Counts recalculated
- ✅ Success notification

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 4.4: View Task Details

**Steps:**
1. Click on a task card

**Expected Results:**
- ✅ Modal opens
- ✅ All task details shown
- ✅ Edit/Delete buttons visible
- ✅ Project name displayed

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 4.5: Duplicate Task

**Steps:**
1. Click task
2. Click "Duplicate"

**Expected Results:**
- ✅ New task created
- ✅ Same details except ID
- ✅ Title prefixed with "Copy of"
- ✅ Success notification

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 4.6: Delete Task

**Steps:**
1. Click task
2. Click "Delete"
3. Confirm

**Expected Results:**
- ✅ Confirmation dialog
- ✅ Task removed
- ✅ Success notification
- ✅ Counts updated

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

## Invoices Module Testing

### Test Case 5.1: View Invoices Table

**Steps:**
1. Navigate to `/invoices.html`

**Expected Results:**
- ✅ Table displays all invoices
- ✅ Columns: Number, Client, Amount, Status, Date, Actions
- ✅ Metrics shown (total, paid, unpaid)

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 5.2: Create New Invoice

**Steps:**
1. Click "Add Invoice"
2. Fill form:
   - Invoice Number: `INV-001`
   - Client: Select from dropdown
   - Amount: `2500`
   - Status: `draft`
   - Issue Date: Today
   - Due Date: Next week
3. Click "Save"

**Expected Results:**
- ✅ Validation passes
- ✅ Invoice created
- ✅ Appears in table
- ✅ Metrics updated
- ✅ Success notification

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 5.3: Update Invoice Status

**Steps:**
1. Click "Edit" on invoice
2. Change status from `draft` to `sent`
3. Click "Save"

**Expected Results:**
- ✅ Status updates
- ✅ Table reflects change
- ✅ Metrics recalculated
- ✅ Success notification

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 5.4: View Invoice Details

**Steps:**
1. Click "View" on an invoice

**Expected Results:**
- ✅ Modal opens
- ✅ All invoice details displayed
- ✅ Client info shown
- ✅ Formatted currency

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 5.5: Delete Invoice

**Steps:**
1. Click "Delete" on invoice
2. Confirm deletion

**Expected Results:**
- ✅ Confirmation required
- ✅ Invoice removed
- ✅ Metrics updated
- ✅ Success notification

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

## Dashboard Testing

### Test Case 6.1: View Dashboard Stats

**Steps:**
1. Login and navigate to dashboard

**Expected Results:**
- ✅ KPI cards display correctly
- ✅ Total clients count accurate
- ✅ Total projects count accurate
- ✅ Total tasks count accurate
- ✅ Overdue tasks count accurate
- ✅ Invoice totals correct
- ✅ Revenue calculations accurate

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 6.2: Recent Items Display

**Steps:**
1. View dashboard
2. Check "Recent Clients", "Recent Projects", etc.

**Expected Results:**
- ✅ Shows last 5 items
- ✅ Sorted by creation date (newest first)
- ✅ Links work correctly
- ✅ Data matches actual records

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 6.3: Dashboard Auto-Refresh

**Steps:**
1. Open dashboard
2. In another tab, create new client
3. Return to dashboard tab
4. Refresh or navigate

**Expected Results:**
- ✅ New client appears in count
- ✅ Recent clients updated
- ✅ Stats recalculated

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

## Cross-Browser Testing

### Browser Compatibility Matrix

| Feature | Chrome | Firefox | Edge | Safari | Status |
|---------|--------|---------|------|--------|--------|
| **Authentication** |
| Signup | [ ] | [ ] | [ ] | [ ] | |
| Login | [ ] | [ ] | [ ] | [ ] | |
| Logout | [ ] | [ ] | [ ] | [ ] | |
| Session persist | [ ] | [ ] | [ ] | [ ] | |
| **Clients** |
| View list | [ ] | [ ] | [ ] | [ ] | |
| Create | [ ] | [ ] | [ ] | [ ] | |
| Edit | [ ] | [ ] | [ ] | [ ] | |
| Delete | [ ] | [ ] | [ ] | [ ] | |
| **Projects** |
| View board | [ ] | [ ] | [ ] | [ ] | |
| Drag/drop | [ ] | [ ] | [ ] | [ ] | |
| Create | [ ] | [ ] | [ ] | [ ] | |
| Edit | [ ] | [ ] | [ ] | [ ] | |
| **Tasks** |
| View board | [ ] | [ ] | [ ] | [ ] | |
| Drag/drop | [ ] | [ ] | [ ] | [ ] | |
| Duplicate | [ ] | [ ] | [ ] | [ ] | |
| **Invoices** |
| View table | [ ] | [ ] | [ ] | [ ] | |
| Create | [ ] | [ ] | [ ] | [ ] | |
| Status change | [ ] | [ ] | [ ] | [ ] | |
| **Dashboard** |
| View stats | [ ] | [ ] | [ ] | [ ] | |
| Recent items | [ ] | [ ] | [ ] | [ ] | |
| **UI Components** |
| Notifications | [ ] | [ ] | [ ] | [ ] | |
| Loading states | [ ] | [ ] | [ ] | [ ] | |
| Modals | [ ] | [ ] | [ ] | [ ] | |

### Browser Versions to Test

- **Chrome:** Latest stable (v120+)
- **Firefox:** Latest stable (v120+)
- **Edge:** Latest stable (v120+)
- **Safari:** Latest stable (v17+)

---

## Mobile Testing

### iOS Testing (iPhone/iPad)

**Devices:**
- iPhone 12/13/14 (iOS 16+)
- iPad (latest)

**Test Cases:**

| Feature | iPhone | iPad | Status |
|---------|--------|------|--------|
| Login form | [ ] | [ ] | |
| Signup form | [ ] | [ ] | |
| Navigation menu | [ ] | [ ] | |
| Clients table | [ ] | [ ] | |
| Projects Kanban | [ ] | [ ] | |
| Drag/drop (touch) | [ ] | [ ] | |
| Tasks Kanban | [ ] | [ ] | |
| Invoices table | [ ] | [ ] | |
| Dashboard stats | [ ] | [ ] | |
| Notifications (toast) | [ ] | [ ] | |
| Modal dialogs | [ ] | [ ] | |
| Form inputs | [ ] | [ ] | |
| Date pickers | [ ] | [ ] | |
| Dropdowns | [ ] | [ ] | |

### Android Testing

**Devices:**
- Samsung Galaxy S20+ (Android 12+)
- Google Pixel (latest)

**Test Cases:**

| Feature | Samsung | Pixel | Status |
|---------|---------|-------|--------|
| Login form | [ ] | [ ] | |
| Signup form | [ ] | [ ] | |
| Navigation menu | [ ] | [ ] | |
| Clients table | [ ] | [ ] | |
| Projects Kanban | [ ] | [ ] | |
| Drag/drop (touch) | [ ] | [ ] | |
| Tasks Kanban | [ ] | [ ] | |
| Invoices table | [ ] | [ ] | |
| Dashboard stats | [ ] | [ ] | |
| Notifications (toast) | [ ] | [ ] | |

### Mobile-Specific Tests

**Test Case M.1: Touch Gestures**
- [ ] Swipe to scroll
- [ ] Pinch to zoom (should be disabled)
- [ ] Tap to select
- [ ] Long press for context menu

**Test Case M.2: Screen Orientation**
- [ ] Portrait mode works
- [ ] Landscape mode works
- [ ] Rotation preserves state

**Test Case M.3: Keyboard Behavior**
- [ ] Virtual keyboard doesn't obscure input fields
- [ ] "Done" button submits forms
- [ ] Auto-complete works
- [ ] Email keyboard for email fields

---

## Performance Testing

### Lighthouse Audit

**Target Scores:**
- Performance: 80+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 80+

**Run audit for each page:**

| Page | Performance | Accessibility | Best Practices | SEO | Status |
|------|-------------|---------------|----------------|-----|--------|
| index.html | ___/100 | ___/100 | ___/100 | ___/100 | [ ] |
| login.html | ___/100 | ___/100 | ___/100 | ___/100 | [ ] |
| signup.html | ___/100 | ___/100 | ___/100 | ___/100 | [ ] |
| clients.html | ___/100 | ___/100 | ___/100 | ___/100 | [ ] |
| projects.html | ___/100 | ___/100 | ___/100 | ___/100 | [ ] |
| tasks.html | ___/100 | ___/100 | ___/100 | ___/100 | [ ] |
| invoices.html | ___/100 | ___/100 | ___/100 | ___/100 | [ ] |

### Page Load Time Testing

**Test with throttling:**
- Slow 3G
- Fast 3G
- No throttling

| Page | Slow 3G | Fast 3G | No Throttling | Target |
|------|---------|---------|---------------|--------|
| Dashboard | ___s | ___s | ___s | < 3s |
| Clients | ___s | ___s | ___s | < 2s |
| Projects | ___s | ___s | ___s | < 2s |
| Tasks | ___s | ___s | ___s | < 2s |
| Invoices | ___s | ___s | ___s | < 2s |

### API Response Time Testing

**Test in browser console:**

```javascript
// Test clients API
console.time('clients');
await window.SupabaseStore.clients.getAll();
console.timeEnd('clients');
// Target: < 500ms

// Test projects API
console.time('projects');
await window.SupabaseStore.projects.getAll();
console.timeEnd('projects');
// Target: < 500ms

// Test dashboard stats
console.time('dashboard');
await window.SupabaseStore.dashboard.getStats();
console.timeEnd('dashboard');
// Target: < 1000ms
```

**Results:**

| API Call | Time (ms) | Target | Status |
|----------|-----------|--------|--------|
| clients.getAll() | ___ | < 500 | [ ] |
| projects.getAll() | ___ | < 500 | [ ] |
| tasks.getAll() | ___ | < 500 | [ ] |
| invoices.getAll() | ___ | < 500 | [ ] |
| dashboard.getStats() | ___ | < 1000 | [ ] |

---

## Security Testing

### Test Case S.1: XSS Prevention

**Steps:**
1. Try to inject script in client name:
   ```
   <script>alert('XSS')</script>
   ```
2. Save and view client list

**Expected Results:**
- ✅ Script not executed
- ✅ Displayed as plain text
- ✅ HTML escaped

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case S.2: SQL Injection (Supabase RLS)

**Steps:**
1. Try malicious input in search:
   ```
   '; DROP TABLE clients; --
   ```

**Expected Results:**
- ✅ No database error
- ✅ No data deleted
- ✅ RLS prevents unauthorized access

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case S.3: Authentication Bypass Attempt

**Steps:**
1. Logout
2. Try to access `/index.html` directly
3. Try to manipulate localStorage session

**Expected Results:**
- ✅ Redirect to login
- ✅ No data accessible
- ✅ Session validation enforced

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case S.4: Password Security

**Steps:**
1. Attempt signup with weak password: `123`
2. Attempt signup with no digits: `password`
3. Attempt signup with no letters: `12345678`

**Expected Results:**
- ✅ All rejected with clear errors
- ✅ Min 8 chars enforced
- ✅ Letter + digit required

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case S.5: HTTPS Enforcement (Production)

**Steps:**
1. Try to access via HTTP: `http://yourdomain.com`

**Expected Results:**
- ✅ Auto-redirect to HTTPS
- ✅ SSL certificate valid
- ✅ No mixed content warnings

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

### Test Case S.6: Session Timeout

**Steps:**
1. Login
2. Wait 24 hours (or manually expire session in Supabase)
3. Try to perform action

**Expected Results:**
- ✅ Session expired message
- ✅ Redirect to login
- ✅ Return URL preserved

**Actual Results:** ________________

**Status:** [ ] PASS [ ] FAIL

---

## Regression Testing

### Post-Deployment Regression Checklist

**Run after each deployment:**

- [ ] Authentication flow works end-to-end
- [ ] All CRUD operations functional
- [ ] Drag-and-drop works on projects/tasks
- [ ] Dashboard stats accurate
- [ ] Notifications display correctly
- [ ] Loading states show/hide properly
- [ ] No console errors on any page
- [ ] Mobile responsive on all pages
- [ ] Forms validate correctly
- [ ] Session persists across refreshes
- [ ] Logout clears session completely
- [ ] XSS protection still in place
- [ ] Environment variables loaded correctly
- [ ] Supabase connection successful
- [ ] RLS policies enforced

### Critical Path Testing

**Test this sequence after every major change:**

1. [ ] Signup new account
2. [ ] Login with new account
3. [ ] Create a client
4. [ ] Create a project for that client
5. [ ] Create a task for that project
6. [ ] Create an invoice for that client
7. [ ] Drag project to different stage
8. [ ] Drag task to "Done"
9. [ ] Update invoice status to "Paid"
10. [ ] Verify dashboard shows correct stats
11. [ ] Logout
12. [ ] Login again
13. [ ] Verify all data persists
14. [ ] Delete all test data
15. [ ] Logout

**Time to complete:** ~5 minutes

**Frequency:** After each deployment

---

## Test Results Summary

### Overall Test Statistics

- Total test cases: ___
- Passed: ___
- Failed: ___
- Blocked: ___
- Pass rate: ___%

### Critical Issues Found

| Issue # | Description | Severity | Status | Assignee |
|---------|-------------|----------|--------|----------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### Known Issues (Acceptable for MVP)

| Issue | Impact | Workaround | Target Fix |
|-------|--------|------------|------------|
| Console logs in production | Minor | None | Post-MVP |
| 237+ innerHTML in non-MVP modules | Low | Deferred | Phase 2 |
| No server-side validation | Medium | Client-side only | Week 6 |

---

## Sign-Off

### QA Approval

**Tested by:** ________________  
**Date:** ________________  
**Environment:** ________________  
**Build/Version:** ________________  

**Status:** [ ] APPROVED FOR PRODUCTION [ ] NEEDS FIXES

**Comments:** 
________________________________________________________________
________________________________________________________________
________________________________________________________________

---

**Test Plan Status:** Ready for execution ✅

Use this comprehensive test plan to ensure quality before and after each deployment!
