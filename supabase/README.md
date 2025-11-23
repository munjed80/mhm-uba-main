# MHM UBA - Supabase Backend

This folder contains all Supabase-related files for the MHM UBA MVP backend.

## 📁 Folder Structure

```
supabase/
├── migrations/              # SQL migration files
│   ├── 20251122_001_create_tables.sql   # Database schema
│   └── 20251122_002_enable_rls.sql      # Row Level Security policies
├── SETUP-GUIDE.md          # Complete setup instructions
├── API-REFERENCE.md        # API documentation
└── README.md               # This file
```

## 🚀 Quick Start

1. **Read the Setup Guide**: Start with `SETUP-GUIDE.md` for complete instructions
2. **Run Migrations**: Execute SQL files in Supabase SQL Editor
3. **Configure Frontend**: Copy `supabase-config.template.js` and add your credentials
4. **Test API**: Use examples in `API-REFERENCE.md`

## 📚 Documentation

- **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** - Step-by-step setup instructions
  - Creating Supabase project
  - Running migrations
  - Configuring authentication
  - Testing the connection

- **[API-REFERENCE.md](./API-REFERENCE.md)** - Complete API documentation
  - Authentication methods
  - CRUD operations for all entities
  - Dashboard stats
  - Error handling
  - Code examples

## 🗄️ Database Schema

### Tables Created
- **clients** - Client/customer management
- **projects** - Project tracking
- **tasks** - Task management
- **invoices** - Billing and invoices

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Enforced at database level

## 🔐 Configuration

### Required Files
1. `supabase-config.js` - Your Supabase credentials (gitignored)
2. Created from `supabase-config.template.js`

### Environment Variables
```javascript
window.SUPABASE_URL = 'https://your-project.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key';
```

## 🧪 Testing

Test the API in browser console:

```javascript
// Check if API is loaded
console.log(window.UBAApi);

// Test authentication
await window.UBAApi.auth.signup('test@example.com', 'password123', {name: 'Test'});

// Test CRUD
const client = await window.UBAApi.clients.create({name: 'Test Client'});
```

## 📦 What's Included

### SQL Migrations
- ✅ Complete database schema
- ✅ Foreign key relationships
- ✅ Indexes for performance
- ✅ Updated_at triggers
- ✅ RLS policies

### Frontend Service Layer
- ✅ Authentication (signup, login, logout)
- ✅ Clients CRUD
- ✅ Projects CRUD
- ✅ Tasks CRUD
- ✅ Invoices CRUD
- ✅ Dashboard stats

### Documentation
- ✅ Setup guide
- ✅ API reference
- ✅ Code examples
- ✅ Troubleshooting

## 🔄 Migration Order

**Important:** Run migrations in order:

1. `20251122_001_create_tables.sql` - Creates tables and triggers
2. `20251122_002_enable_rls.sql` - Enables security policies

## ⚠️ Important Notes

- **Never commit** `supabase-config.js` with real credentials
- Use the **anon key** in frontend (not service_role)
- RLS policies protect user data automatically
- Session expires after 1 hour (configurable in Supabase)

## 🆘 Troubleshooting

**"Supabase not initialized"**
- Check that Supabase CDN is loaded
- Verify config file is loaded before api-service.js

**"User not authenticated"**
- Call `await window.UBAApi.auth.login()` first
- Check session: `await window.UBAApi.auth.getSession()`

**"RLS policy violation"**
- This is correct behavior! Users can't access others' data
- Make sure you're logged in with the right user

## 📖 Next Steps

After completing Week 1 setup:

**Week 2: Testing**
- Test all CRUD operations
- Add input validation
- Create seed data

**Week 3: Frontend Integration**
- Connect UI to API
- Replace localStorage calls
- Add loading states

See `MVP-DEVELOPMENT-PLAN.md` in the root folder for complete roadmap.

## 🔗 Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)

---

**Backend Setup Complete!** ✅

Your Supabase backend is ready for the MHM UBA MVP.
