# Workspace Members & Roles System

## Overview

The Workspace Members & Roles system provides complete multi-user collaboration with role-based permissions and access control. Built on top of the UBA architecture, it enables workspace owners to invite team members, assign roles, and manage permissions - all while operating in local mode without requiring a backend.

## Architecture

### Module: `assets/js/members.js`

**Key Components:**
- Member invitation and management
- Role-based permission system
- Permission enforcement across UI
- Member operations (invite, update role, remove, resend)

### Integration Points

**Uses UBA Architecture:**
```javascript
// Workspace
UBA.workspace.get(workspaceId)
UBA.workspace.update(workspaceId, { members: [...] })
UBA.workspace.getCurrent()

// Authentication
UBA.auth.getCurrentUser()
UBA.auth.getUser(userId)

// Session
UBA.session.currentUser
UBA.session.currentWorkspace
```

## Roles & Permissions

### Role Definitions

#### Owner
**Full Control** - Creator of the workspace

Permissions:
- ✅ Manage members (invite, remove, change roles)
- ✅ Manage workspace settings
- ✅ Delete workspace
- ✅ Manage all data (clients, tasks, invoices, etc.)
- ✅ Manage automations
- ✅ Full CRUD on all entities
- ✅ View all reports

**Cannot:**
- Be removed from workspace
- Have role changed

#### Admin
**Near-Full Permissions** - Trusted team member

Permissions:
- ✅ Manage members (invite, remove, change roles)
- ✅ Manage workspace settings
- ✅ Manage all data (clients, tasks, invoices, etc.)
- ✅ Manage automations
- ✅ Full CRUD on all entities
- ✅ View all reports

**Cannot:**
- ❌ Delete workspace
- ❌ Change owner's role
- ❌ Remove owner

#### Editor
**Data Manager** - Can create and edit content

Permissions:
- ✅ Manage clients, tasks, invoices, expenses
- ✅ Manage projects, leads, files
- ✅ Full CRUD on data entities
- ✅ View reports

**Cannot:**
- ❌ Manage members
- ❌ Access workspace settings
- ❌ Manage automations
- ❌ Delete workspace

#### Viewer
**Read-Only** - Can only view data

Permissions:
- ✅ View all data (clients, tasks, invoices, etc.)
- ✅ View reports

**Cannot:**
- ❌ Create, edit, or delete any data
- ❌ Manage members
- ❌ Access settings
- ❌ Manage automations

## Data Model

### Member Object

```javascript
{
  id: 'member-xxx',              // Unique member ID
  email: 'user@example.com',     // Member's email (unique per workspace)
  name: 'John Doe',              // Display name
  role: 'editor',                // owner | admin | editor | viewer
  status: 'pending',             // pending | active
  joinedAt: '2025-01-01T...',    // ISO timestamp
  invitedBy: 'user-xxx'          // ID of user who sent invitation
}
```

### Storage Location

Members are stored in the workspace object:

```javascript
{
  id: 'ws-xxx',
  name: 'My Workspace',
  ownerUserId: 'user-xxx',
  members: [                     // Array of member objects
    {
      id: 'member-1',
      email: 'user@example.com',
      name: 'User Name',
      role: 'editor',
      status: 'pending',
      joinedAt: '2025-01-01T...',
      invitedBy: 'user-owner'
    }
  ],
  // ... other workspace fields
}
```

## Member Operations

### 1. Invite Member

```javascript
// Invite a new member
const newMember = await Members.inviteMember(
  'colleague@example.com',  // Email (required)
  'Colleague Name',         // Name (optional)
  'editor'                  // Role: admin | editor | viewer
);
```

**Validation:**
- Email must be valid (contains @)
- Email must be unique in workspace
- Role must be valid (owner, admin, editor, viewer)

**Process:**
1. Validates email and role
2. Checks for duplicate email
3. Creates member object with 'pending' status
4. Adds to workspace.members array
5. Saves via `UBA.workspace.update()`
6. Refreshes member list
7. Shows success message

### 2. Update Member Role

```javascript
// Change a member's role
await Members.updateMemberRole('member-xxx', 'admin');
```

**Validation:**
- Cannot change owner's role
- Cannot change own role
- New role must be valid

**Process:**
1. Finds member in workspace
2. Validates role change
3. Updates member.role
4. Saves to workspace
5. Refreshes member list
6. Shows success message

### 3. Remove Member

```javascript
// Remove a member from workspace
await Members.removeMember('member-xxx');
```

**Validation:**
- Cannot remove workspace owner
- Confirmation dialog required

**Process:**
1. Finds member
2. Shows confirmation dialog
3. Removes from members array
4. Saves to workspace
5. Refreshes member list
6. Shows success message

### 4. Resend Invitation

```javascript
// Resend invitation (local-mode mock)
await Members.resendInvitation('member-xxx');
```

**Process:**
1. Finds member
2. Shows success message (mock operation in local mode)

### 5. View Permissions

```javascript
// Show permission dialog for a role
Members.viewPermissions('admin');
```

**Process:**
1. Gets role definition
2. Formats permissions list
3. Shows alert dialog with ✅/❌ indicators

## Permission Checking

### Check Specific Permission

```javascript
// Check if current user has a specific permission
if (Members.hasPermission('manageMembers')) {
  // Show member management UI
}
```

### Get Current User's Role

```javascript
// Get role of current user in workspace
const role = Members.getCurrentUserRole();
// Returns: 'owner' | 'admin' | 'editor' | 'viewer' | null
```

### Check Common Permissions

```javascript
// Check if can manage members
if (Members.canManageMembers()) {
  // Show invite button
}

// Check if can access settings
if (Members.canAccessSettings()) {
  // Show settings page
}
```

## Permission Enforcement

### Automatic UI Enforcement

Called automatically on page load:

```javascript
Members.enforceUIPermissions();
```

**What it does:**
1. Gets current user's role
2. Checks permissions for each UI element
3. Hides/disables elements without access
4. Adds role badge to header (if not owner)

### Manual Permission Checks

For custom UI elements:

```javascript
// Example: Show delete button only if user can delete data
const deleteBtn = document.getElementById('delete-client-btn');
if (!Members.hasPermission('deleteData')) {
  deleteBtn.style.display = 'none';
}
```

### Permission Map

Elements hidden based on permissions:

| Element Selector | Permission Required |
|-----------------|-------------------|
| `.settings-section` | `manageSettings` |
| `.workspace-delete-btn` | `deleteWorkspace` |
| `.automation-section` | `manageAutomations` |
| `.client-create-btn` | `createData` |
| `.task-create-btn` | `createData` |
| `.invoice-create-btn` | `createData` |

## UI Components

### Invite Form

**HTML Structure:**
```html
<div class="member-invite-form">
  <input id="invite-email" type="email" placeholder="Email" />
  <input id="invite-name" type="text" placeholder="Name (optional)" />
  <select id="invite-role">
    <option value="editor">Editor</option>
    <option value="admin">Admin</option>
    <option value="viewer">Viewer</option>
  </select>
  <button id="invite-member-btn">Send Invitation</button>
</div>
```

### Member List Item

**HTML Structure:**
```html
<div class="member-item">
  <div class="member-avatar">J</div>
  <div class="member-info">
    <div class="member-name">
      John Doe
      <span class="member-badge-you">You</span>
    </div>
    <div class="member-email">john@example.com</div>
    <div class="member-meta">
      <span class="member-role-badge role-admin">Admin</span>
      <span class="member-status-badge">Pending</span>
      <span class="member-joined">Joined Today</span>
    </div>
  </div>
  <div class="member-actions">
    <select class="member-role-select">...</select>
    <button>Resend</button>
    <button>Remove</button>
    <button>View Permissions</button>
  </div>
</div>
```

### Role Badges

Color-coded by role:

**Owner:** Orange gradient (`#f59e0b` → `#f97316`)
**Admin:** Purple gradient (`#8b5cf6` → `#a855f7`)
**Editor:** Blue gradient (`#3b82f6` → `#22d3ee`)
**Viewer:** Gray (`var(--border)`)

### Status Indicators

**Pending:** Orange badge with "Pending" text
**Active:** No badge shown (implied)
**You:** Green badge with "You" text (for current user)

## Workflow Examples

### Example 1: Inviting a Team Member

1. Owner navigates to Settings → Workspace Members
2. Fills invite form:
   - Email: `designer@company.com`
   - Name: `Jane Designer`
   - Role: Editor
3. Clicks "Send Invitation"
4. System creates member with 'pending' status
5. Member appears in list with:
   - Avatar "J"
   - Role badge "Editor"
   - Status "Pending"
   - Resend button available

### Example 2: Changing Member Role

1. Owner/Admin clicks role dropdown for member
2. Selects new role (e.g., from Editor to Admin)
3. System validates and updates role
4. Member list refreshes with new role badge
5. Success message shown

### Example 3: Permission Enforcement

1. Editor logs in to workspace
2. `Members.enforceUIPermissions()` runs automatically
3. System hides:
   - Settings navigation item
   - Automation management section
   - Workspace delete button
   - Member management section
4. Editor badge shown in header
5. User can only access allowed sections

## API Reference

### Public Methods

```javascript
// Member Management
Members.inviteMember(email, name, role)
Members.updateMemberRole(memberId, newRole)
Members.removeMember(memberId)
Members.resendInvitation(memberId)
Members.viewPermissions(role)
Members.getWorkspaceMembers(workspaceId)

// Permission Checks
Members.hasPermission(permission)
Members.getCurrentUserRole()
Members.canManageMembers()
Members.canAccessSettings()

// UI Operations
Members.enforceUIPermissions()
Members.renderMembersList()
Members.init()

// Constants
Members.ROLES  // Role definitions with permissions
```

### Permission Names

Available permissions:
- `manageMembers`
- `manageWorkspace`
- `deleteWorkspace`
- `manageSettings`
- `manageClients`
- `manageTasks`
- `manageInvoices`
- `manageExpenses`
- `manageAutomations`
- `manageFiles`
- `manageProjects`
- `manageLeads`
- `viewReports`
- `createData`
- `editData`
- `deleteData`
- `viewData`

## Local vs Remote Mode

### Current (Local Mode)

**Member Invitations:**
- Creates member with 'pending' status
- No actual email sent
- Member appears in list immediately
- "Resend" shows mock success message

**Authentication:**
- Members stored in workspace object
- No token or session validation
- Role checked on every page load

**Data Access:**
- UI-level enforcement only
- No backend validation
- Data filtered by workspace in UBA.data

### Future (Remote Mode)

When backend is added:

**Member Invitations:**
```javascript
// POST /api/workspaces/{id}/members
{
  email: 'user@example.com',
  name: 'User Name',
  role: 'editor'
}

// Backend sends actual invitation email
// Member receives link to accept invitation
// Status changes to 'active' when accepted
```

**Authentication:**
```javascript
// Include role in JWT token
// Backend validates permissions on each request
// Frontend uses same Members.hasPermission() checks
```

**Data Access:**
```javascript
// Backend enforces permissions on API
// Returns 403 Forbidden for unauthorized access
// Frontend maintains same UI enforcement
```

## Security Considerations

### Current (Local Mode)

**No Security Required:**
- All data is local to device
- No network requests
- UI-level enforcement only

### Future (Remote Mode)

**Must Implement:**

✅ **Backend Validation:**
- Validate permissions on every API request
- Check role from authenticated session
- Reject unauthorized operations with 403

✅ **Invitation Security:**
- Generate secure invitation tokens
- Set expiration on invitations
- Verify email ownership

✅ **Role Changes:**
- Log all role changes
- Prevent privilege escalation
- Require owner approval for admin promotion

✅ **Data Access:**
- Filter queries by workspace membership
- Validate user is member of workspace
- Enforce row-level security

## Testing

### Manual Tests Performed

✅ **Invite Member:**
- Email validation works
- Duplicate email prevented
- Member appears with correct role
- Success message shown

✅ **Update Role:**
- Role dropdown populated correctly
- Owner role protected
- Changes saved and displayed
- Success message shown

✅ **Remove Member:**
- Owner cannot be removed
- Confirmation dialog shown
- Member removed from list
- Success message shown

✅ **View Permissions:**
- Correct permissions shown for each role
- ✅/❌ indicators clear
- Alert dialog displays properly

✅ **Permission Enforcement:**
- Current user role detected correctly
- UI elements hidden based on permissions
- Role badge shown in header

## Troubleshooting

### Member Not Appearing

**Check:**
1. Email validation passed
2. No duplicate email in workspace
3. `renderMembersList()` called after invite
4. Browser console for errors

### Role Change Not Working

**Check:**
1. User has `manageMembers` permission
2. Not trying to change owner role
3. Workspace saved successfully
4. Member list refreshed

### Permissions Not Enforced

**Check:**
1. `Members.init()` called on page load
2. `UBA.workspace` and `UBA.auth` initialized
3. Current workspace has members array
4. User exists in workspace members

## Future Enhancements

### Phase 1: Enhanced Invitations
- [ ] Email templates
- [ ] Invitation acceptance flow
- [ ] Invitation expiration
- [ ] Bulk invitations

### Phase 2: Advanced Permissions
- [ ] Custom role creation
- [ ] Permission templates
- [ ] Resource-level permissions
- [ ] Audit logging

### Phase 3: Team Features
- [ ] Team/group management
- [ ] Department structure
- [ ] Permission inheritance
- [ ] Activity feeds

### Phase 4: Enterprise Features
- [ ] SSO integration
- [ ] Active Directory sync
- [ ] SCIM provisioning
- [ ] Compliance reporting

## Backward Compatibility

✅ **Existing Workspaces:**
- Work without members array
- Owner auto-detected
- No breaking changes

✅ **Existing Code:**
- No changes required to page scripts
- Permission checks are additive
- Optional enforcement

✅ **Guest Users:**
- Continue to work
- Treated as workspace owner
- Full permissions

## Conclusion

The Workspace Members & Roles system provides enterprise-grade multi-user collaboration with role-based access control, all while maintaining the simplicity of local-mode operation. The architecture is designed to seamlessly transition to a remote backend when ready, with the same API and UI components continuing to work without modification.
