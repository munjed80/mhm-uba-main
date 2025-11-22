# MHM UBA - Week 1 Setup Guide: Supabase Backend

This guide will help you set up the Supabase backend for the MHM UBA MVP.

## Prerequisites

- A GitHub account (for Supabase sign-up)
- Basic understanding of SQL (for running migrations)
- Text editor for configuration

## Step 1: Create Supabase Project

1. **Go to Supabase:**
   - Visit https://supabase.com
   - Click "Start your project"
   - Sign in with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - **Name:** `mhm-uba-mvp` (or your preferred name)
     - **Database Password:** Choose a strong password (save it securely!)
     - **Region:** Choose closest to your users
     - **Pricing Plan:** Free (sufficient for MVP)
   - Click "Create new project"
   - Wait 2-3 minutes for setup to complete

## Step 2: Run Database Migrations

1. **Open SQL Editor:**
   - In your Supabase dashboard, click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run Schema Migration:**
   - Open `supabase/migrations/20251122_001_create_tables.sql` from this repo
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - You should see: "Success. No rows returned"

3. **Run RLS Policies:**
   - Click "New query" again
   - Open `supabase/migrations/20251122_002_enable_rls.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run"
   - You should see: "Success. No rows returned"

4. **Verify Tables Created:**
   - Click "Table Editor" in the left sidebar
   - You should see 4 tables:
     - clients
     - projects
     - tasks
     - invoices

## Step 3: Configure Authentication

1. **Enable Email Auth:**
   - Click "Authentication" in the left sidebar
   - Click "Providers"
   - Ensure "Email" is enabled (should be by default)
   - Optional: Configure email templates under "Email Templates"

2. **Configure Site URL (Important!):**
   - Click "Authentication" > "URL Configuration"
   - Set **Site URL** to your development URL:
     - Local: `http://localhost:8000` or `http://127.0.0.1:8000`
     - Production: Your actual domain
   - Set **Redirect URLs** (same as above)

## Step 4: Get API Credentials

1. **Navigate to API Settings:**
   - Click "Project Settings" (gear icon) in the left sidebar
   - Click "API" section

2. **Copy Your Credentials:**
   - **Project URL:** Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public key:** Copy this (long JWT token)
   - ⚠️ **DO NOT** copy the `service_role` key (that's for server-side only)

## Step 5: Configure Frontend

1. **Create Config File:**
   ```bash
   cd /path/to/mhm-uba-main
   cp supabase-config.template.js supabase-config.js
   ```

2. **Edit Config File:**
   - Open `supabase-config.js`
   - Replace `your-project-id` with your actual project URL
   - Replace `your-anon-key-here` with your actual anon key
   - Save the file

3. **Add to .gitignore:**
   - Open `.gitignore`
   - Add this line: `supabase-config.js`
   - This prevents committing your credentials

## Step 6: Update HTML Files

Add these script tags to your main HTML files (e.g., `index.html`, `login.html`) in the `<head>` section, **before** any other JavaScript:

```html
<!-- Supabase Client Library (from CDN) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase Configuration (your credentials) -->
<script src="supabase-config.js"></script>

<!-- Supabase API Service (wrapper) -->
<script src="assets/js/supabase-api-service.js"></script>
```

**Order matters!** Load in this sequence:
1. Supabase library
2. Your config
3. API service wrapper

## Step 7: Test the Connection

1. **Start Local Server:**
   ```bash
   cd /path/to/mhm-uba-main
   python -m http.server 8000
   # or
   npx http-server -p 8000
   ```

2. **Open Browser Console:**
   - Navigate to `http://localhost:8000`
   - Open Developer Tools (F12)
   - Go to Console tab

3. **Check for Success Message:**
   - You should see: `[API Service] Supabase initialized successfully`
   - And: `[API Service] UBA API initialized. Available at window.UBAApi`

4. **Test Authentication (in Console):**
   ```javascript
   // Test signup
   await window.UBAApi.auth.signup('test@example.com', 'password123', {name: 'Test User'});
   
   // Test login
   await window.UBAApi.auth.login('test@example.com', 'password123');
   
   // Test get current user
   await window.UBAApi.auth.getCurrentUser();
   
   // Test logout
   await window.UBAApi.auth.logout();
   ```

## Step 8: Verify Row Level Security

1. **Test Data Isolation:**
   - Sign up as User A
   - Create a client
   - Log out
   - Sign up as User B
   - Try to fetch clients
   - You should see NO clients (User A's data is protected!)

2. **Check in Supabase Dashboard:**
   - Go to "Table Editor"
   - View the clients table
   - You'll see all data (you're viewing as admin)
   - But users can only access their own data through the API

## Troubleshooting

### "Supabase credentials not configured"
- Make sure `supabase-config.js` exists
- Check that it's loaded before `supabase-api-service.js`
- Verify your URL and key are correct

### "User not authenticated"
- Check that you're logged in: `await window.UBAApi.auth.getCurrentUser()`
- Session might have expired - try logging in again

### "Row Level Security policy violation"
- This means RLS is working! Users can't access others' data
- Make sure you're logged in with the right user
- Check that user_id matches in the database

### "Error: Invalid API key"
- Your anon key might be wrong
- Go back to Supabase dashboard > Settings > API
- Copy the "anon public" key again

### CORS Errors
- Make sure you've configured the Site URL in Supabase
- Authentication > URL Configuration
- Add your development URL (http://localhost:8000)

## Next Steps (Week 2)

Now that your backend is set up, you're ready for Week 2:
- The database is created
- RLS policies are active
- Frontend can communicate with Supabase
- Users can sign up, log in, and access their own data

In Week 2, you'll:
- Test all CRUD operations
- Add input validation
- Create seed data for testing
- Document the API endpoints

## API Usage Examples

### Authentication

```javascript
// Signup
const result = await window.UBAApi.auth.signup('user@example.com', 'password123', {
  name: 'John Doe'
});

// Login
const result = await window.UBAApi.auth.login('user@example.com', 'password123');

// Logout
await window.UBAApi.auth.logout();

// Get current user
const user = await window.UBAApi.auth.getCurrentUser();
```

### Clients

```javascript
// Get all clients
const clients = await window.UBAApi.clients.getAll();

// Create client
const client = await window.UBAApi.clients.create({
  name: 'Acme Corp',
  email: 'contact@acme.com',
  phone: '+1234567890',
  company: 'Acme Corporation',
  notes: 'Important client'
});

// Update client
await window.UBAApi.clients.update(client.id, {
  name: 'Acme Corporation Inc.'
});

// Delete client
await window.UBAApi.clients.delete(client.id);
```

### Projects, Tasks, Invoices

Same pattern as clients - see `supabase-api-service.js` for all available methods.

### Dashboard Stats

```javascript
const stats = await window.UBAApi.dashboard.getStats();
console.log('Total clients:', stats.totalClients);
console.log('Total revenue:', stats.totalRevenue);
console.log('Recent clients:', stats.recentClients);
```

## Security Notes

⚠️ **Important:**
- Never commit `supabase-config.js` with real credentials
- The anon key is safe to use in frontend (it respects RLS policies)
- Never use the `service_role` key in frontend code
- Always use HTTPS in production

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check Supabase logs: Dashboard > Logs
3. Verify RLS policies: Table Editor > RLS tab
4. Test SQL queries directly in SQL Editor

---

**Setup Complete! ✅**

Your backend is now ready. The database, authentication, and API are all configured.
You can now proceed to Week 3 to connect the existing UI to these Supabase endpoints.
