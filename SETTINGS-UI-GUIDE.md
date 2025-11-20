# Settings UI Implementation Guide

## Overview

The Settings UI is a fully functional, production-ready module that integrates seamlessly with the UBA architecture. It provides comprehensive user profile management, workspace configuration, and preference controls, all stored in the authenticated workspace using the UBA.data abstraction layer.

## Architecture

### Module: `assets/js/settings-ui.js`

**Key Components:**
- User Profile Management
- Workspace Settings
- Workspace Management (Multi-tenancy)
- Preference Toggles
- Data Persistence via UBA.data

### Integration Points

**Uses UBA Namespace:**
```javascript
// Data Layer
UBA.data.list('settings')
UBA.data.create('settings', data)
UBA.data.update('settings', id, updates)

// Authentication
UBA.auth.getCurrentUser()
UBA.auth.updateUser(userId, updates)

// Workspace
UBA.workspace.getCurrent()
UBA.workspace.update(workspaceId, updates)
UBA.workspace.create(data)
UBA.workspace.delete(workspaceId)
UBA.workspace.switch(workspaceId)
UBA.workspace.list(userId)

// Session
UBA.session.currentUser
UBA.session.currentWorkspace
UBA.session.currentWorkspaceId
```

## Features

### 1. User Profile Management

**Fields:**
- **Display Name**: Editable text field
- **Email**: Read-only (as requested)
- **Timezone**: Dropdown selector

**Implementation:**
```javascript
async function updateUserProfile(data) {
  const { userName, userEmail, timezone } = data;
  
  // Update via UBA.auth
  await UBA.auth.updateUser(currentUser.id, {
    name: userName,
    email: userEmail,
    timezone: timezone
  });
  
  // Also persist in settings
  await saveSettings({
    userName,
    userEmail,
    workspaceTimezone: timezone
  });
}
```

### 2. Password Update (Local Mode Mock)

**Fields:**
- New Password (min 6 chars)
- Confirm Password

**Validation:**
- Minimum length check
- Password matching
- User-friendly error messages

**Implementation:**
```javascript
async function updatePassword(newPassword, confirmPassword) {
  // Validation
  if (newPassword.length < 6) {
    showStatus('Password must be at least 6 characters', 'error');
    return false;
  }
  
  if (newPassword !== confirmPassword) {
    showStatus('Passwords do not match', 'error');
    return false;
  }
  
  // Update via UBA.auth
  await UBA.auth.updateUser(currentUser.id, {
    password: newPassword
  });
}
```

### 3. Workspace Settings

**Fields:**
- Workspace Name
- Description (optional)
- Industry
- Timezone

**Implementation:**
```javascript
async function updateWorkspaceSettings(data) {
  const { workspaceName, workspaceDescription, workspaceIndustry, workspaceTimezone } = data;
  
  // Update via UBA.workspace
  await UBA.workspace.update(currentWorkspace.id, {
    name: workspaceName,
    description: workspaceDescription,
    industry: workspaceIndustry,
    timezone: workspaceTimezone
  });
  
  // Persist in settings
  await saveSettings({
    workspaceName,
    workspaceDescription,
    workspaceIndustry,
    workspaceTimezone
  });
}
```

### 4. Workspace Management

**Features:**
- **List Workspaces**: Shows all workspaces for current user
- **Create Workspace**: Prompts for name and description
- **Switch Workspace**: Changes active workspace and reloads
- **Delete Workspace**: Removes workspace with confirmation

**UI Elements:**
- Current workspace highlighted with "Current" badge
- Plan indicator (free/pro)
- Switch/Delete buttons for non-current workspaces
- Protection against deleting default workspace

**Implementation:**
```javascript
async function createNewWorkspace(name, description = '') {
  const newWorkspace = await UBA.workspace.create({
    name: name.trim(),
    description: description.trim(),
    ownerUserId: currentUser.id
  });
  
  await renderWorkspaceList();
  showStatus(`Workspace "${name}" created successfully`, 'success');
}

async function switchWorkspace(workspaceId) {
  await UBA.workspace.switch(workspaceId);
  showStatus('Switching workspace...', 'success');
  
  // Reload to refresh data for new workspace
  setTimeout(() => window.location.reload(), 500);
}

async function deleteWorkspace(workspaceId, workspaceName) {
  const confirmed = confirm(`Are you sure you want to delete "${workspaceName}"?`);
  if (!confirmed) return false;
  
  await UBA.workspace.delete(workspaceId);
  await renderWorkspaceList();
}
```

### 5. Preference Toggles

**Settings:**
- **Theme**: Light/Dark toggle
- **Language**: Dropdown (en, ar, nl, fr, es, de)
- **Compact Mode**: Checkbox
- **Single-Page Navigation**: Checkbox
- **Notifications**: Checkbox
- **RTL**: Auto-enabled for Arabic

**Instant Application:**
All preferences are applied immediately when changed.

**Implementation:**
```javascript
async function updatePreferences(data) {
  const { theme, language, compactMode, singlePageNav, notifications, rtl } = data;
  
  // Apply instantly
  if (theme !== undefined) applyTheme(theme);
  if (language !== undefined) applyLanguage(language);
  if (compactMode !== undefined) applyCompactMode(compactMode);
  if (rtl !== undefined) applyRTL(rtl);
  
  // Persist
  await saveSettings({
    theme, language, compactMode, singlePageNav, notifications, rtl
  });
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('uba-dark-theme', isDark);
  document.body.classList.toggle('uba-light-theme', !isDark);
  localStorage.setItem('uba-theme', theme);
}

function applyLanguage(language) {
  localStorage.setItem('uba-lang', language);
  
  // Apply i18n if available
  if (window.ubaI18n?.applyTranslations) {
    window.ubaI18n.applyTranslations(language);
  }
  
  // RTL for Arabic
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
}

function applyCompactMode(isCompact) {
  document.body.classList.toggle('uba-compact-view', isCompact);
  localStorage.setItem('uba-compact-mode', isCompact.toString());
}
```

## Data Storage

### Settings Structure

```javascript
{
  // User Profile
  userName: 'Guest User',
  userEmail: 'guest@local',
  
  // Workspace
  workspaceName: 'My Workspace',
  workspaceDescription: '',
  workspaceIndustry: '',
  workspaceTimezone: 'UTC',
  
  // Preferences
  language: 'en',
  theme: 'light',
  compactMode: false,
  singlePageNav: true,
  notifications: true,
  rtl: false,
  
  // Metadata (auto-added by UBA.data)
  id: 'settings-xxx',
  workspaceId: 'ws-xxx',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
}
```

### Storage Locations

**Primary:**
- `UBA.data.settings` (via data-layer.js)
- Stored in: `uba-local-settings-{workspaceId}`

**Fallback/Legacy:**
- `localStorage['uba-settings']`
- `localStorage['uba-theme']`
- `localStorage['uba-lang']`
- `localStorage['uba-compact-mode']`

### Load/Save Flow

**On Load:**
1. Load from `UBA.data.list('settings')`
2. Merge with `UBA.session.currentUser` data
3. Merge with `UBA.session.currentWorkspace` data
4. Fallback to legacy `localStorage['uba-settings']`
5. Populate form fields

**On Save:**
1. Merge updates with current settings
2. Save to `UBA.data.update('settings', id, updates)`
3. Save to `localStorage` for backward compatibility
4. Save individual flags (`uba-theme`, `uba-lang`, etc.)
5. Update user/workspace via `UBA.auth` and `UBA.workspace`

## UI Components

### HTML Structure

```html
<!-- Theme Toggle -->
<div class="uba-theme-toggle">
  <label class="uba-toggle-switch">
    <input type="checkbox" id="theme-toggle" />
    <span class="uba-toggle-slider"></span>
    <span class="uba-toggle-labels">
      <span>Light</span>
      <span>Dark</span>
    </span>
  </label>
</div>

<!-- Workspace List -->
<div class="workspace-items">
  <div class="workspace-item active">
    <div class="workspace-info">
      <div class="workspace-name">My Workspace</div>
      <div class="workspace-meta">
        <span class="workspace-badge">Current</span>
        <span class="workspace-plan">free</span>
      </div>
    </div>
  </div>
  
  <div class="workspace-item">
    <div class="workspace-info">
      <div class="workspace-name">Test Agency</div>
      <div class="workspace-meta">
        <span class="workspace-plan">free</span>
      </div>
    </div>
    <div class="workspace-actions">
      <button class="uba-btn-sm uba-btn-ghost">Switch</button>
      <button class="uba-btn-sm uba-btn-ghost">Delete</button>
    </div>
  </div>
</div>
```

### CSS Styling

**Key Classes:**
- `.workspace-item` - Workspace list item
- `.workspace-item.active` - Current workspace highlight
- `.workspace-badge` - "Current" indicator
- `.workspace-plan` - Plan type badge
- `.uba-status-success` - Success message
- `.uba-status-error` - Error message
- `.uba-settings-grid` - Responsive 2-column grid

**Theme Support:**
All colors use CSS variables that adapt to light/dark theme:
- `var(--text)` - Text color
- `var(--panel)` - Panel background
- `var(--border)` - Border color
- `var(--accent)` - Accent color
- `var(--good)` - Success color
- `var(--bad)` - Error color

## Public API

### Window.SettingsUI

```javascript
window.SettingsUI = {
  // Initialization
  init()
  
  // Settings Management
  loadSettings()
  saveSettings(updates)
  
  // User Profile
  updateUserProfile(data)
  updatePassword(newPassword, confirmPassword)
  
  // Workspace
  updateWorkspaceSettings(data)
  createNewWorkspace(name, description)
  switchWorkspace(workspaceId)
  deleteWorkspace(workspaceId, name)
  
  // Preferences
  updatePreferences(data)
  applyTheme(theme)
  applyLanguage(language)
  applyCompactMode(isCompact)
}
```

### Event Handlers

**Auto-attached on DOMContentLoaded:**
- Theme toggle change
- Language select change
- Compact mode checkbox change
- Notifications checkbox change
- Single-page nav checkbox change
- Save All Settings button
- Save Workspace Settings button
- Update Password button
- Create Workspace button
- Reset Demo Data button
- Logout button

## Error Handling

### Validation Errors
- Password too short: "Password must be at least 6 characters"
- Passwords don't match: "Passwords do not match"
- Workspace name missing: "Workspace name is required"
- Cannot delete default: "Cannot delete default workspace"

### User Feedback
- Success messages: Green background, 3-second auto-hide
- Error messages: Red background, 3-second auto-hide
- Confirmation dialogs: For destructive actions (delete workspace)

## Testing

### Manual Tests Performed

✅ **Theme Toggle**
- Light to Dark: Works
- Dark to Light: Works
- Persists across reload: Works

✅ **Workspace Creation**
- Created "Test Agency" workspace
- Appears in workspace list
- Shows correct plan badge

✅ **Workspace List**
- Shows current workspace with "Current" badge
- Shows other workspaces with Switch/Delete buttons
- Protects default workspace

✅ **Form Population**
- User profile fields populate correctly
- Workspace fields populate correctly
- Preferences checkboxes reflect current state

## Future Enhancements

1. **Email Validation**: Add regex validation for email field
2. **Password Strength**: Visual indicator for password strength
3. **Workspace Icons**: Allow custom workspace icons/colors
4. **Export Settings**: Download settings as JSON
5. **Import Settings**: Upload settings JSON
6. **Team Management**: Add workspace members (requires backend)
7. **Role-Based Permissions**: Owner/Admin/Member roles
8. **Billing Integration**: Connect plan to payment system

## Backward Compatibility

✅ **Existing Code**: All existing pages continue to work
✅ **Legacy Settings**: Old `localStorage` settings are migrated
✅ **No Breaking Changes**: UBA namespace is additive only
✅ **Graceful Degradation**: Works without UBA if needed

## Production Checklist

- [x] Clean, modular code
- [x] Error handling throughout
- [x] Input validation
- [x] User feedback (success/error messages)
- [x] Console logging for debugging
- [x] No backend calls (local mode)
- [x] Integrated with UBA architecture
- [x] Fully functional UI
- [x] Responsive design
- [x] Theme support (light/dark)
- [x] i18n ready
- [x] RTL support
- [x] Tested manually

## Files Modified/Created

**Created:**
- `assets/js/settings-ui.js` (650+ lines)

**Modified:**
- `settings.html` (added password section, styles, script integration)
- `assets/js/data-layer.js` (added 'settings' to ENTITY_TYPES)
- `assets/js/store.js` (added settings helper)

**Total Lines**: ~1,000 lines of production-ready code

---

The Settings UI is now fully functional, integrated, and ready for production use in local mode. When a backend is added, the same UI will continue to work with minimal changes - just the UBA.data implementation needs to be updated to call REST APIs instead of localStorage.
