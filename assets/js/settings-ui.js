// settings-ui.js — Fully functional Settings UI for UBA dashboard
// Integrates with UBA namespace, data-layer.js, and authentication system
(function () {
  'use strict';

  // Default settings structure
  const DEFAULT_SETTINGS = {
    // User profile
    userName: '',
    userEmail: '',
    
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
  };

  // State
  let currentSettings = { ...DEFAULT_SETTINGS };
  let isInitialized = false;

  // ===============================
  // Utilities
  // ===============================
  
  function log(...args) {
    console.log('[Settings UI]', ...args);
  }

  function warn(...args) {
    console.warn('[Settings UI]', ...args);
  }

  function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('settings-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `uba-settings-status uba-status-${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  // ===============================
  // Settings Storage (using UBA.data)
  // ===============================

  async function loadSettings() {
    try {
      // Get current user and workspace from UBA session
      const currentUser = window.UBA?.session?.currentUser;
      const currentWorkspace = window.UBA?.session?.currentWorkspace;

      // Load settings from UBA.data if available
      if (window.UBA && window.UBA.data) {
        const settingsList = await window.UBA.data.list('settings');
        const workspaceSettings = settingsList && settingsList.length > 0 
          ? settingsList[0] 
          : null;

        if (workspaceSettings) {
          currentSettings = {
            ...DEFAULT_SETTINGS,
            ...workspaceSettings
          };
        }
      }

      // Load user data
      if (currentUser) {
        currentSettings.userName = currentUser.name || '';
        currentSettings.userEmail = currentUser.email || '';
        currentSettings.language = currentUser.language || 'en';
        currentSettings.theme = currentUser.theme || 'light';
      }

      // Load workspace data
      if (currentWorkspace) {
        currentSettings.workspaceName = currentWorkspace.name || 'My Workspace';
        currentSettings.workspaceDescription = currentWorkspace.description || '';
        currentSettings.workspaceIndustry = currentWorkspace.industry || '';
        currentSettings.workspaceTimezone = currentWorkspace.timezone || 'UTC';
      }

      // Fallback to localStorage for legacy settings
      const legacySettings = localStorage.getItem('uba-settings');
      if (legacySettings) {
        try {
          const parsed = JSON.parse(legacySettings);
          currentSettings = { ...currentSettings, ...parsed };
        } catch (e) {
          warn('Failed to parse legacy settings', e);
        }
      }

      // Load individual preference flags from localStorage
      currentSettings.theme = localStorage.getItem('uba-theme') || currentSettings.theme;
      currentSettings.language = localStorage.getItem('uba-lang') || currentSettings.language;
      currentSettings.compactMode = localStorage.getItem('uba-compact-mode') === 'true';

      log('Settings loaded:', currentSettings);
      return currentSettings;
    } catch (error) {
      warn('Error loading settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  async function saveSettings(updates = {}) {
    try {
      // Merge updates
      currentSettings = { ...currentSettings, ...updates };

      // Save to UBA.data
      if (window.UBA && window.UBA.data) {
        const settingsList = await window.UBA.data.list('settings');
        
        if (settingsList && settingsList.length > 0) {
          // Update existing settings
          await window.UBA.data.update('settings', settingsList[0].id, currentSettings);
        } else {
          // Create new settings record
          await window.UBA.data.create('settings', currentSettings);
        }
      }

      // Save to localStorage for backward compatibility
      localStorage.setItem('uba-settings', JSON.stringify(currentSettings));
      
      // Save individual flags
      localStorage.setItem('uba-theme', currentSettings.theme);
      localStorage.setItem('uba-lang', currentSettings.language);
      localStorage.setItem('uba-compact-mode', currentSettings.compactMode.toString());

      log('Settings saved:', currentSettings);
      return currentSettings;
    } catch (error) {
      warn('Error saving settings:', error);
      throw error;
    }
  }

  // ===============================
  // User Profile Management
  // ===============================

  async function updateUserProfile(data) {
    try {
      const { userName, userEmail, timezone } = data;

      // Update via UBA.auth if available
      if (window.UBA && window.UBA.auth) {
        const currentUser = window.UBA.auth.getCurrentUser();
        if (currentUser) {
          await window.UBA.auth.updateUser(currentUser.id, {
            name: userName,
            email: userEmail,
            timezone: timezone
          });
          log('User profile updated via UBA.auth');
        }
      }

      // Also update in settings
      await saveSettings({
        userName,
        userEmail,
        workspaceTimezone: timezone
      });

      showStatus('Profile updated successfully', 'success');
      return true;
    } catch (error) {
      warn('Error updating user profile:', error);
      showStatus('Failed to update profile', 'error');
      return false;
    }
  }

  async function updatePassword(newPassword, confirmPassword) {
    try {
      // Validation
      if (!newPassword || newPassword.length < 6) {
        showStatus('Password must be at least 6 characters', 'error');
        return false;
      }

      if (newPassword !== confirmPassword) {
        showStatus('Passwords do not match', 'error');
        return false;
      }

      // Update via UBA.auth (local mode mock)
      if (window.UBA && window.UBA.auth) {
        const currentUser = window.UBA.auth.getCurrentUser();
        if (currentUser) {
          await window.UBA.auth.updateUser(currentUser.id, {
            password: newPassword
          });
          log('Password updated (local mode)');
          showStatus('Password updated successfully', 'success');
          return true;
        }
      }

      showStatus('Unable to update password', 'error');
      return false;
    } catch (error) {
      warn('Error updating password:', error);
      showStatus('Failed to update password', 'error');
      return false;
    }
  }

  // ===============================
  // Workspace Management
  // ===============================

  async function updateWorkspaceSettings(data) {
    try {
      const { workspaceName, workspaceDescription, workspaceIndustry, workspaceTimezone } = data;

      // Update via UBA.workspace if available
      if (window.UBA && window.UBA.workspace) {
        const currentWorkspace = window.UBA.workspace.getCurrent();
        if (currentWorkspace) {
          await window.UBA.workspace.update(currentWorkspace.id, {
            name: workspaceName,
            description: workspaceDescription,
            industry: workspaceIndustry,
            timezone: workspaceTimezone
          });
          log('Workspace updated via UBA.workspace');
        }
      }

      // Also update in settings
      await saveSettings({
        workspaceName,
        workspaceDescription,
        workspaceIndustry,
        workspaceTimezone
      });

      showStatus('Workspace settings updated successfully', 'success');
      
      // Update workspace selector if present
      updateWorkspaceSelector();
      
      return true;
    } catch (error) {
      warn('Error updating workspace settings:', error);
      showStatus('Failed to update workspace settings', 'error');
      return false;
    }
  }

  async function createNewWorkspace(name, description = '') {
    try {
      if (!name || name.trim() === '') {
        showStatus('Workspace name is required', 'error');
        return null;
      }

      // Create via UBA.workspace
      if (window.UBA && window.UBA.workspace) {
        const currentUser = window.UBA.auth?.getCurrentUser();
        const newWorkspace = await window.UBA.workspace.create({
          name: name.trim(),
          description: description.trim(),
          ownerUserId: currentUser?.id
        });

        log('New workspace created:', newWorkspace);
        showStatus(`Workspace "${name}" created successfully`, 'success');
        
        // Refresh workspace list
        await renderWorkspaceList();
        
        return newWorkspace;
      }

      return null;
    } catch (error) {
      warn('Error creating workspace:', error);
      showStatus('Failed to create workspace', 'error');
      return null;
    }
  }

  async function switchWorkspace(workspaceId) {
    try {
      if (window.UBA && window.UBA.workspace) {
        await window.UBA.workspace.switch(workspaceId);
        log('Switched to workspace:', workspaceId);
        showStatus('Switching workspace...', 'success');
        
        // Reload page to refresh data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      warn('Error switching workspace:', error);
      showStatus('Failed to switch workspace', 'error');
    }
  }

  async function deleteWorkspace(workspaceId, workspaceName) {
    try {
      const confirmed = confirm(`Are you sure you want to delete "${workspaceName}"?

This will permanently delete all data in this workspace.`);
      
      if (!confirmed) return false;

      if (window.UBA && window.UBA.workspace) {
        await window.UBA.workspace.delete(workspaceId);
        log('Workspace deleted:', workspaceId);
        showStatus(`Workspace "${workspaceName}" deleted`, 'success');
        
        // Refresh workspace list
        await renderWorkspaceList();
        
        return true;
      }

      return false;
    } catch (error) {
      warn('Error deleting workspace:', error);
      showStatus(error.message || 'Failed to delete workspace', 'error');
      return false;
    }
  }

  // ===============================
  // Preferences Management
  // ===============================

  async function updatePreferences(data) {
    try {
      const { theme, language, compactMode, singlePageNav, notifications, rtl } = data;

      // Apply theme immediately
      if (theme !== undefined) {
        applyTheme(theme);
      }

      // Apply language immediately
      if (language !== undefined) {
        applyLanguage(language);
      }

      // Apply compact mode immediately
      if (compactMode !== undefined) {
        applyCompactMode(compactMode);
      }

      // Apply RTL immediately
      if (rtl !== undefined) {
        applyRTL(rtl);
      }

      // Save preferences
      await saveSettings({
        theme,
        language,
        compactMode,
        singlePageNav,
        notifications,
        rtl
      });

      log('Preferences updated');
      return true;
    } catch (error) {
      warn('Error updating preferences:', error);
      return false;
    }
  }

  function applyTheme(theme) {
    const body = document.body;
    const isDark = theme === 'dark';

    body.classList.toggle('uba-dark-theme', isDark);
    body.classList.toggle('uba-light-theme', !isDark);

    localStorage.setItem('uba-theme', theme);
    log('Theme applied:', theme);
  }

  function applyLanguage(language) {
    localStorage.setItem('uba-lang', language);

    // Apply translations if i18n is available
    if (window.ubaI18n && typeof window.ubaI18n.applyTranslations === 'function') {
      window.ubaI18n.applyTranslations(language);
    }

    // Update document direction for RTL languages
    const isRTL = language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    currentSettings.rtl = isRTL;

    log('Language applied:', language);
  }

  function applyCompactMode(isCompact) {
    document.body.classList.toggle('uba-compact-view', isCompact);
    localStorage.setItem('uba-compact-mode', isCompact.toString());
    log('Compact mode applied:', isCompact);
  }

  function applyRTL(isRTL) {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    log('RTL applied:', isRTL);
  }

  // ===============================
  // UI Rendering
  // ===============================

  function populateFormFields() {
    // User profile fields
    const userNameInput = document.getElementById('setting-user-name');
    const userEmailInput = document.getElementById('setting-user-email');
    const timezoneSelect = document.getElementById('setting-timezone');

    if (userNameInput) userNameInput.value = currentSettings.userName || '';
    if (userEmailInput) {
      userEmailInput.value = currentSettings.userEmail || '';
      // Make email read-only as specified
      userEmailInput.readOnly = true;
      userEmailInput.style.opacity = '0.6';
      userEmailInput.style.cursor = 'not-allowed';
    }
    if (timezoneSelect) timezoneSelect.value = currentSettings.workspaceTimezone || 'UTC';

    // Workspace fields
    const workspaceNameInput = document.getElementById('setting-workspace-name');
    const workspaceDescInput = document.getElementById('setting-workspace-description');
    const workspaceIndustryInput = document.getElementById('setting-workspace-industry');

    if (workspaceNameInput) workspaceNameInput.value = currentSettings.workspaceName || '';
    if (workspaceDescInput) workspaceDescInput.value = currentSettings.workspaceDescription || '';
    if (workspaceIndustryInput) workspaceIndustryInput.value = currentSettings.workspaceIndustry || '';

    // Language
    const languageSelect = document.getElementById('language-select-settings');
    if (languageSelect) languageSelect.value = currentSettings.language || 'en';

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.checked = currentSettings.theme === 'dark';
    }

    // Preferences checkboxes
    const notificationsCheckbox = document.getElementById('setting-notifications');
    const singlePageCheckbox = document.getElementById('setting-single-page');
    const compactViewCheckbox = document.getElementById('setting-compact-view');

    if (notificationsCheckbox) notificationsCheckbox.checked = currentSettings.notifications !== false;
    if (singlePageCheckbox) singlePageCheckbox.checked = currentSettings.singlePageNav !== false;
    if (compactViewCheckbox) compactViewCheckbox.checked = currentSettings.compactMode === true;

    log('Form fields populated');
  }

  async function renderWorkspaceList() {
    const container = document.getElementById('workspace-list-container');
    if (!container) return;

    try {
      // Get all workspaces for current user
      const currentUser = window.UBA?.auth?.getCurrentUser();
      if (!currentUser) {
        container.innerHTML = '<p style="color: var(--muted);">Please log in to manage workspaces.</p>';
        return;
      }

      const workspaces = await window.UBA.workspace.list(currentUser.id);
      const currentWorkspaceId = window.UBA.session?.currentWorkspaceId;

      if (!workspaces || workspaces.length === 0) {
        container.innerHTML = '<p style="color: var(--muted);">No workspaces available.</p>';
        return;
      }

      container.innerHTML = workspaces.map(ws => `
        <div class="workspace-item ${ws.id === currentWorkspaceId ? 'active' : ''}" data-workspace-id="${ws.id}">
          <div class="workspace-info">
            <div class="workspace-name">${escapeHtml(ws.name)}</div>
            <div class="workspace-meta">
              ${ws.id === currentWorkspaceId ? '<span class="workspace-badge">Current</span>' : ''}
              ${ws.plan ? `<span class="workspace-plan">${ws.plan}</span>` : ''}
            </div>
          </div>
          <div class="workspace-actions">
            ${ws.id !== currentWorkspaceId ? `
              <button class="uba-btn-sm uba-btn-ghost" onclick="window.SettingsUI.switchWorkspace('${ws.id}')">
                Switch
              </button>
            ` : ''}
            ${ws.id !== 'default' ? `
              <button class="uba-btn-sm uba-btn-ghost" onclick="window.SettingsUI.deleteWorkspace('${ws.id}', '${escapeHtml(ws.name)}')">
                Delete
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');

      log('Workspace list rendered:', workspaces.length, 'workspaces');
    } catch (error) {
      warn('Error rendering workspace list:', error);
      container.innerHTML = '<p style="color: var(--error);">Failed to load workspaces.</p>';
    }
  }

  function updateWorkspaceSelector() {
    const selector = document.getElementById('workspace-select');
    if (!selector) return;

    const currentWorkspace = window.UBA?.workspace?.getCurrent();
    if (currentWorkspace && currentSettings.workspaceName) {
      // Update the current option text
      const currentOption = selector.querySelector('option[selected]');
      if (currentOption) {
        currentOption.textContent = currentSettings.workspaceName;
      }
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===============================
  // Event Handlers
  // ===============================

  function attachEventHandlers() {
    // Save all settings button
    const saveAllBtn = document.getElementById('save-all-settings');
    if (saveAllBtn) {
      saveAllBtn.addEventListener('click', async () => {
        await handleSaveAllSettings();
      });
    }

    // Save workspace settings button
    const saveWorkspaceBtn = document.getElementById('save-workspace-settings');
    if (saveWorkspaceBtn) {
      saveWorkspaceBtn.addEventListener('click', async () => {
        await handleSaveWorkspaceSettings();
      });
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('change', async (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        await updatePreferences({ theme });
      });
    }

    // Language select
    const languageSelect = document.getElementById('language-select-settings');
    if (languageSelect) {
      languageSelect.addEventListener('change', async (e) => {
        await updatePreferences({ language: e.target.value });
      });
    }

    // Compact mode checkbox
    const compactViewCheckbox = document.getElementById('setting-compact-view');
    if (compactViewCheckbox) {
      compactViewCheckbox.addEventListener('change', async (e) => {
        await updatePreferences({ compactMode: e.target.checked });
      });
    }

    // Notifications checkbox
    const notificationsCheckbox = document.getElementById('setting-notifications');
    if (notificationsCheckbox) {
      notificationsCheckbox.addEventListener('change', async (e) => {
        await updatePreferences({ notifications: e.target.checked });
      });
    }

    // Single page navigation checkbox
    const singlePageCheckbox = document.getElementById('setting-single-page');
    if (singlePageCheckbox) {
      singlePageCheckbox.addEventListener('change', async (e) => {
        await updatePreferences({ singlePageNav: e.target.checked });
      });
    }

    // Workspace creation button
    document.querySelectorAll('[data-workspace-action="create"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = prompt('Enter workspace name:');
        if (name) {
          const description = prompt('Enter workspace description (optional):') || '';
          await createNewWorkspace(name, description);
        }
      });
    });

    // Reset demo data button
    const resetBtn = document.getElementById('reset-demo-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all demo data? This cannot be undone.')) {
          handleResetDemoData();
        }
      });
    }

    // Logout button
    const logoutBtn = document.querySelector('.uba-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await handleLogout();
      });
    }

    log('Event handlers attached');
  }

  async function handleSaveAllSettings() {
    try {
      // Gather all form data
      const userNameInput = document.getElementById('setting-user-name');
      const userEmailInput = document.getElementById('setting-user-email');
      const timezoneSelect = document.getElementById('setting-timezone');
      const workspaceNameInput = document.getElementById('setting-workspace-name');
      const workspaceDescInput = document.getElementById('setting-workspace-description');
      const workspaceIndustryInput = document.getElementById('setting-workspace-industry');
      const languageSelect = document.getElementById('language-select-settings');
      const themeToggle = document.getElementById('theme-toggle');
      const notificationsCheckbox = document.getElementById('setting-notifications');
      const singlePageCheckbox = document.getElementById('setting-single-page');
      const compactViewCheckbox = document.getElementById('setting-compact-view');

      // Update user profile
      await updateUserProfile({
        userName: userNameInput?.value || '',
        userEmail: userEmailInput?.value || '',
        timezone: timezoneSelect?.value || 'UTC'
      });

      // Update workspace settings
      await updateWorkspaceSettings({
        workspaceName: workspaceNameInput?.value || '',
        workspaceDescription: workspaceDescInput?.value || '',
        workspaceIndustry: workspaceIndustryInput?.value || '',
        workspaceTimezone: timezoneSelect?.value || 'UTC'
      });

      // Update preferences
      await updatePreferences({
        language: languageSelect?.value || 'en',
        theme: themeToggle?.checked ? 'dark' : 'light',
        notifications: notificationsCheckbox?.checked !== false,
        singlePageNav: singlePageCheckbox?.checked !== false,
        compactMode: compactViewCheckbox?.checked === true
      });

      showStatus('All settings saved successfully!', 'success');
    } catch (error) {
      warn('Error saving all settings:', error);
      showStatus('Failed to save some settings', 'error');
    }
  }

  async function handleSaveWorkspaceSettings() {
    const workspaceNameInput = document.getElementById('setting-workspace-name');
    const workspaceDescInput = document.getElementById('setting-workspace-description');
    const workspaceIndustryInput = document.getElementById('setting-workspace-industry');
    const timezoneSelect = document.getElementById('setting-timezone');

    await updateWorkspaceSettings({
      workspaceName: workspaceNameInput?.value || '',
      workspaceDescription: workspaceDescInput?.value || '',
      workspaceIndustry: workspaceIndustryInput?.value || '',
      workspaceTimezone: timezoneSelect?.value || 'UTC'
    });
  }

  function handleResetDemoData() {
    // Clear all demo data from localStorage
    const keysToReset = [
      'uba-local-clients',
      'uba-local-projects',
      'uba-local-tasks',
      'uba-local-invoices',
      'uba-local-leads',
      'uba-local-expenses',
      'uba-local-files',
      'uba-local-automations',
      'uba-local-automation-logs'
    ];

    const currentWorkspaceId = window.UBA?.session?.currentWorkspaceId || 'default';
    
    keysToReset.forEach(baseKey => {
      const key = `${baseKey}-${currentWorkspaceId}`;
      localStorage.removeItem(key);
    });

    showStatus('Demo data reset successfully', 'success');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  async function handleLogout() {
    try {
      if (window.UBA && window.UBA.auth) {
        await window.UBA.auth.logout();
        log('User logged out');
        window.location.href = 'login.html';
      }
    } catch (error) {
      warn('Error during logout:', error);
    }
  }

  // ===============================
  // Initialization
  // ===============================

  async function init() {
    if (isInitialized) {
      log('Already initialized');
      return;
    }

    log('Initializing Settings UI');

    try {
      // Load current settings
      await loadSettings();

      // Populate form fields with current values
      populateFormFields();

      // Render workspace list
      await renderWorkspaceList();

      // Attach event handlers
      attachEventHandlers();

      // Apply current theme and preferences
      applyTheme(currentSettings.theme);
      applyCompactMode(currentSettings.compactMode);
      
      isInitialized = true;
      log('Settings UI initialized successfully');
    } catch (error) {
      warn('Error initializing Settings UI:', error);
    }
  }

  // ===============================
  // Public API
  // ===============================

  window.SettingsUI = {
    init,
    loadSettings,
    saveSettings,
    updateUserProfile,
    updatePassword,
    updateWorkspaceSettings,
    updatePreferences,
    createNewWorkspace,
    switchWorkspace,
    deleteWorkspace,
    applyTheme,
    applyLanguage,
    applyCompactMode
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  log('Settings UI module loaded');
})();
