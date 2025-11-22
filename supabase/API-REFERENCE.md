# Supabase API Quick Reference

**Version:** Week 1 - MVP Backend Setup  
**Status:** Ready for Integration

## Available APIs

All APIs are available through `window.UBAApi` after including the service layer.

---

## Authentication

### Signup
```javascript
const result = await window.UBAApi.auth.signup(email, password, metadata);
// Example:
await window.UBAApi.auth.signup('john@example.com', 'password123', {
  name: 'John Doe'
});
```

### Login
```javascript
const result = await window.UBAApi.auth.login(email, password);
// Example:
await window.UBAApi.auth.login('john@example.com', 'password123');
```

### Logout
```javascript
await window.UBAApi.auth.logout();
```

### Get Current User
```javascript
const user = await window.UBAApi.auth.getCurrentUser();
console.log(user.email, user.id);
```

### Get Session
```javascript
const session = await window.UBAApi.auth.getSession();
```

### Reset Password
```javascript
await window.UBAApi.auth.resetPassword('user@example.com');
```

---

## Clients CRUD

### Get All Clients
```javascript
const clients = await window.UBAApi.clients.getAll();
```

### Get Client by ID
```javascript
const client = await window.UBAApi.clients.getById(id);
```

### Create Client
```javascript
const client = await window.UBAApi.clients.create({
  name: 'Acme Corp',
  email: 'contact@acme.com',
  phone: '+1234567890',
  company: 'Acme Corporation',
  notes: 'Important client'
});
```

### Update Client
```javascript
await window.UBAApi.clients.update(id, {
  name: 'Updated Name',
  email: 'newemail@example.com'
});
```

### Delete Client
```javascript
await window.UBAApi.clients.delete(id);
```

---

## Projects CRUD

### Get All Projects
```javascript
const projects = await window.UBAApi.projects.getAll();
// Returns projects with client info: { ..., clients: { name, company } }
```

### Get Project by ID
```javascript
const project = await window.UBAApi.projects.getById(id);
```

### Create Project
```javascript
const project = await window.UBAApi.projects.create({
  client_id: 'uuid-of-client',
  title: 'Website Redesign',
  description: 'Complete website overhaul',
  budget: 5000.00,
  status: 'active', // 'active', 'completed', or 'archived'
  start_date: '2025-01-01',
  end_date: '2025-06-30'
});
```

### Update Project
```javascript
await window.UBAApi.projects.update(id, {
  status: 'completed',
  end_date: '2025-05-15'
});
```

### Delete Project
```javascript
await window.UBAApi.projects.delete(id);
```

---

## Tasks CRUD

### Get All Tasks
```javascript
const tasks = await window.UBAApi.tasks.getAll();
// Returns tasks with project info: { ..., projects: { title } }
```

### Get Task by ID
```javascript
const task = await window.UBAApi.tasks.getById(id);
```

### Create Task
```javascript
const task = await window.UBAApi.tasks.create({
  project_id: 'uuid-of-project',
  title: 'Design homepage',
  description: 'Create mockup for homepage',
  status: 'todo', // 'todo', 'in_progress', or 'done'
  due_date: '2025-02-01'
});
```

### Update Task
```javascript
await window.UBAApi.tasks.update(id, {
  status: 'in_progress'
});
```

### Delete Task
```javascript
await window.UBAApi.tasks.delete(id);
```

---

## Invoices CRUD

### Get All Invoices
```javascript
const invoices = await window.UBAApi.invoices.getAll();
// Returns invoices with client info: { ..., clients: { name, company } }
```

### Get Invoice by ID
```javascript
const invoice = await window.UBAApi.invoices.getById(id);
```

### Create Invoice
```javascript
const invoice = await window.UBAApi.invoices.create({
  client_id: 'uuid-of-client',
  invoice_number: 'INV-001',
  title: 'Website Development',
  amount: 5000.00,
  status: 'draft', // 'draft', 'sent', or 'paid'
  issue_date: '2025-01-15',
  due_date: '2025-02-15',
  notes: 'Payment terms: Net 30'
});
```

### Update Invoice
```javascript
await window.UBAApi.invoices.update(id, {
  status: 'paid'
});
```

### Delete Invoice
```javascript
await window.UBAApi.invoices.delete(id);
```

---

## Dashboard Stats

### Get All Stats
```javascript
const stats = await window.UBAApi.dashboard.getStats();

// Available fields:
console.log(stats.totalClients);      // Number of clients
console.log(stats.totalProjects);     // Number of projects
console.log(stats.activeProjects);    // Active projects count
console.log(stats.totalTasks);        // Total tasks
console.log(stats.activeTasks);       // Tasks not done
console.log(stats.totalRevenue);      // Sum of paid invoices
console.log(stats.pendingRevenue);    // Sum of sent invoices
console.log(stats.recentClients);     // Last 5 clients
console.log(stats.recentProjects);    // Last 5 projects
console.log(stats.recentTasks);       // Last 5 tasks
console.log(stats.recentInvoices);    // Last 5 invoices
```

---

## Error Handling

All methods throw errors that can be caught:

```javascript
try {
  const client = await window.UBAApi.clients.create({
    name: 'Test Client'
  });
  console.log('Client created:', client.id);
} catch (error) {
  console.error('Error creating client:', error.message);
  // Show error to user
}
```

---

## Database Schema Reference

### Clients Table
```
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- name: TEXT (required)
- email: TEXT
- phone: TEXT
- company: TEXT
- notes: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Projects Table
```
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- client_id: UUID (foreign key to clients, nullable)
- title: TEXT (required)
- description: TEXT
- budget: DECIMAL(10,2)
- status: TEXT ('active', 'completed', 'archived')
- start_date: DATE
- end_date: DATE
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Tasks Table
```
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- project_id: UUID (foreign key to projects, nullable)
- title: TEXT (required)
- description: TEXT
- status: TEXT ('todo', 'in_progress', 'done')
- due_date: DATE
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Invoices Table
```
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- client_id: UUID (foreign key to clients, nullable)
- invoice_number: TEXT (required, unique per user)
- title: TEXT (required)
- amount: DECIMAL(10,2) (required)
- status: TEXT ('draft', 'sent', 'paid')
- issue_date: DATE (required)
- due_date: DATE (required)
- notes: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

---

## Row Level Security

All tables are protected by RLS policies:
- Users can only view their own data
- Users can only create data for themselves
- Users can only update their own data
- Users can only delete their own data

This is enforced at the database level - no way to bypass it through the API.

---

## Testing in Browser Console

Open your browser's developer console and test:

```javascript
// Test authentication
const signup = await window.UBAApi.auth.signup('test@test.com', 'password123', {name: 'Test'});
const login = await window.UBAApi.auth.login('test@test.com', 'password123');
const user = await window.UBAApi.auth.getCurrentUser();

// Test clients
const client = await window.UBAApi.clients.create({name: 'Test Client'});
const clients = await window.UBAApi.clients.getAll();

// Test dashboard
const stats = await window.UBAApi.dashboard.getStats();
```

---

## Next Steps

In Week 3, you'll connect the existing UBA UI to these APIs:
1. Replace localStorage calls with UBAApi calls
2. Update forms to use the new API
3. Add loading states and error handling
4. Test all CRUD operations through the UI

---

**Documentation Complete** ✅  
All backend infrastructure is ready for frontend integration.
