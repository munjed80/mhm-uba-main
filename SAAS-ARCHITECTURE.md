# MHM UBA SaaS Architecture

## Overview

This document describes the SaaS-ready architecture implemented in MHM UBA. The system now supports multi-tenancy, user authentication, and workspace management while maintaining full compatibility with local-only mode.

## Architecture Components

### 1. Data Layer (`assets/js/data-layer.js`)

The data layer provides a unified API for data access that abstracts away storage implementation details.

**Key Features:**
- **Unified API**: `UBA.data` provides consistent methods: `list()`, `get()`, `create()`, `update()`, `remove()`, `saveAll()`
- **Promise-based**: All methods return Promises, ready for async operations
- **Multi-tenant**: Automatically scopes data to current workspace
- **Future-ready**: Structured to support REST/GraphQL backends with minimal changes

**Configuration:**
```javascript
window.UBA.config = {
  storageMode: 'local',  // 'local' or 'remote'
  apiBaseUrl: '',        // For future remote mode
  debugMode: true
}
```

**Usage Example:**
```javascript
// List all clients in current workspace
const clients = await UBA.data.list('clients');

// Create a new client
const newClient = await UBA.data.create('clients', {
  name: 'Acme Corp',
  email: 'contact@acme.com'
});

// Update a client
await UBA.data.update('clients', clientId, {
  status: 'active'
});

// Remove a client
await UBA.data.remove('clients', clientId);
```

### 2. Session Management (`UBA.session`)

Manages current user and workspace context.

**Properties:**
- `currentUser` - Currently logged-in user object
- `currentWorkspaceId` - Active workspace ID
- `currentWorkspace` - Active workspace object

**Auto-initialization:**
- Creates guest user/workspace if none exists
- Persists session across page reloads
- Handles workspace switching

### 3. Authentication (`UBA.auth`)

Provides user authentication without requiring a backend in local mode.

**Methods:**
```javascript
// Register new user
await UBA.auth.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secure123',
  language: 'en'
});

// Login
await UBA.auth.login('john@example.com', 'secure123');

// Logout
await UBA.auth.logout();

// Check authentication status
const isAuth = UBA.auth.isAuthenticated();

// Get current user
const user = UBA.auth.getCurrentUser();

// Update user profile
await UBA.auth.updateUser(userId, {
  name: 'Jane Doe',
  language: 'es'
});
```

### 4. Workspace Management (`UBA.workspace`)

Manages workspaces for multi-tenancy.

**Methods:**
```javascript
// List all workspaces for a user
const workspaces = await UBA.workspace.list(userId);

// Get specific workspace
const workspace = await UBA.workspace.get(workspaceId);

// Create new workspace
const newWorkspace = await UBA.workspace.create({
  name: 'My Agency',
  ownerUserId: userId,
  plan: 'pro'
});

// Update workspace
await UBA.workspace.update(workspaceId, {
  name: 'Renamed Workspace'
});

// Delete workspace
await UBA.workspace.delete(workspaceId);

// Switch to different workspace
await UBA.workspace.switch(workspaceId);
// Note: This updates session and requires page reload to refresh data

// Get current workspace
const current = UBA.workspace.getCurrent();
```

## Data Model

### User Object
```javascript
{
  id: 'user-xxx',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed',      // In production, use proper hashing
  language: 'en',
  timezone: 'UTC',
  theme: 'light',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
}
```

### Workspace Object
```javascript
{
  id: 'ws-xxx',
  name: 'My Workspace',
  ownerUserId: 'user-xxx',
  plan: 'free',            // 'free', 'pro', 'enterprise'
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
}
```

### Entity Records (Clients, Projects, Tasks, etc.)
All entity records now include:
```javascript
{
  id: 'entity-xxx',
  workspaceId: 'ws-xxx',   // Automatic workspace scoping
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  // ... entity-specific fields
}
```

## Migration Strategy

### Automatic Data Migration

The data layer automatically migrates existing data on first load:

1. **Detection**: Checks for data without `workspaceId` fields
2. **Migration**: Wraps old records with workspace metadata
3. **Preservation**: Keeps `createdAt` from original records where available
4. **One-time**: Sets migration flag to prevent re-running

### Backward Compatibility

The existing `ubaStore` API continues to work:
- All page scripts can continue using `window.ubaStore.clients.getAll()`, etc.
- The data layer uses `ubaStore` as its backend in local mode
- No breaking changes to existing code required

## Local Mode vs Remote Mode

### Local Mode (Current)
- Data stored in `localStorage`
- Uses `ubaStore` as backend
- No network calls required
- Full offline functionality

### Remote Mode (Future)
To switch to remote mode:

1. Update configuration:
```javascript
UBA.config.storageMode = 'remote';
UBA.config.apiBaseUrl = 'https://api.example.com';
```

2. The data layer will automatically:
   - Use `fetch()` for all operations
   - Send workspace context in headers
   - Handle authentication tokens
   - Manage error states

**No changes required to page scripts** - they continue using the same `UBA.data` API.

## Integration Points

### Login/Signup Pages
- `login.html` - Wired to `UBA.auth.login()`
- `signup.html` - Wired to `UBA.auth.register()`
- Auto-redirect to dashboard on success
- Error handling with user feedback

### Settings Page (Future Enhancement)
Will be updated to support:
- User profile editing (name, email, language, timezone, theme)
- Workspace management (create, rename, switch, delete)
- Workspace member management (future)
- Billing/plan management (future)

### All Application Pages
- Load `data-layer.js` after `store.js`
- Session initialized automatically
- Data scoped to current workspace
- User info available in header

## Storage Keys

The system uses namespaced localStorage keys:

**Session & Auth:**
- `uba-session-v2` - Current session (user + workspace)
- `uba-users` - User accounts
- `uba-workspaces` - Workspace definitions

**Entity Data (workspace-scoped):**
- `uba-local-clients-{workspaceId}`
- `uba-local-projects-{workspaceId}`
- `uba-local-tasks-{workspaceId}`
- `uba-local-invoices-{workspaceId}`
- `uba-local-leads-{workspaceId}`
- `uba-local-expenses-{workspaceId}`
- `uba-local-files-{workspaceId}`
- `uba-local-automations-{workspaceId}`
- `uba-local-automation-logs-{workspaceId}`

**Migration:**
- `uba-data-layer-migrated` - Migration completion flag

## Testing

The architecture has been tested with:
- ✅ User registration (signup)
- ✅ User authentication (login)
- ✅ Session persistence
- ✅ Data migration from old format
- ✅ Workspace scoping
- ✅ Backward compatibility with existing code

## Future Enhancements

### Phase 1: Settings UI (Next Step)
- [ ] User profile editing in Settings page
- [ ] Workspace management UI
- [ ] Workspace switcher in header

### Phase 2: Backend Integration
- [ ] REST API implementation
- [ ] JWT token management
- [ ] API error handling
- [ ] Offline sync queue

### Phase 3: Advanced Multi-tenancy
- [ ] Workspace members/teams
- [ ] Role-based permissions
- [ ] Workspace invitations
- [ ] Activity logging

### Phase 4: SaaS Features
- [ ] Subscription management
- [ ] Usage analytics
- [ ] Billing integration
- [ ] Email notifications

## Developer Notes

### Adding New Entity Types
To add support for a new entity type:

1. Add to `ENTITY_TYPES` array in `data-layer.js`:
```javascript
const ENTITY_TYPES = [
  'clients', 'projects', 'tasks', 'invoices',
  'your-new-entity'  // Add here
];
```

2. Create collection helper in `store.js`:
```javascript
yourNewEntity: makeHelpers("yourNewEntity"),
```

3. Use the standard API:
```javascript
const items = await UBA.data.list('yourNewEntity');
```

### Debugging

Enable debug mode to see data layer operations:
```javascript
UBA.config.debugMode = true;
```

Console will show:
- `[UBA Data Layer] Initializing...`
- `[UBA Data Layer] Created: clients client-xxx`
- `[UBA Data Layer] Updated: projects project-xxx`
- etc.

## Security Considerations

### Current (Local Mode)
- No security required - all data is local
- Password storage is plain text (acceptable for local demo)

### Future (Remote Mode)
Must implement:
- ✅ HTTPS for all API calls
- ✅ JWT or session tokens
- ✅ Password hashing (bcrypt/argon2)
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ XSS prevention
- ✅ SQL injection prevention (if using SQL)

## Conclusion

The MHM UBA codebase is now architecturally ready for SaaS deployment. The abstraction layer allows seamless transition from local storage to remote APIs without rewriting application code. Multi-tenancy support is built-in from the ground up, making it trivial to add workspace isolation and user management features.
