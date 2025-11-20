// assets/js/settings.js - Advanced Settings Center for MHM UBA

/**
 * Extended settings state with theme support
 */
const extendedDefaultSettings = {
  workspaceName: "Main workspace",
  workspaceDescription: "",
  timezone: "UTC",
  language: localStorage.getItem("uba-lang") || "en",
  theme: localStorage.getItem("uba-theme") || "light",
  singlePage: true,
  notifications: true,
  compactView: false,
};

/**
 * Load extended settings from localStorage
 */
function loadExtendedSettings() {
  try {
    const stored = localStorage.getItem("uba-settings");
    const settings = stored ? JSON.parse(stored) : {};
    return { ...extendedDefaultSettings, ...settings };
  } catch (error) {
    console.warn("Failed to load settings:", error);
    return extendedDefaultSettings;
  }
}

/**
 * Save extended settings to localStorage
 */
function saveExtendedSettings(updates = {}) {
  try {
    const current = loadExtendedSettings();
    const newSettings = { ...current, ...updates };
    localStorage.setItem("uba-settings", JSON.stringify(newSettings));
    return newSettings;
  } catch (error) {
    console.error("Failed to save settings:", error);
    return loadExtendedSettings();
  }
}

/**
 * Apply theme to the page
 */
function applyTheme(theme) {
  const body = document.body;
  const isDark = theme === "dark";
  
  // Toggle theme classes
  body.classList.toggle("uba-dark-theme", isDark);
  body.classList.toggle("uba-light-theme", !isDark);
  
  // Save to localStorage for persistence across sessions
  localStorage.setItem("uba-theme", theme);
  
  console.log(`Applied theme: ${theme}`);
}

/**
 * Apply language immediately
 */
function applyLanguageChange(language) {
  // Save to localStorage
  localStorage.setItem("uba-lang", language);
  
  // Apply translations if available
  if (window.ubaI18n && typeof window.ubaI18n.applyTranslations === "function") {
    window.ubaI18n.applyTranslations(language);
  }
  
  // Update document direction for RTL languages
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  
  console.log(`Applied language: ${language}`);
}

/**
 * Update workspace via ubaStore if available
 */
function updateWorkspaceData(workspaceName, workspaceDescription, industry) {
  try {
    const store = window.ubaStore;
    if (store && store.workspace && typeof store.workspace.getCurrentWorkspace === "function") {
      const currentWorkspace = store.workspace.getCurrentWorkspace();
      if (currentWorkspace && typeof store.workspace.updateWorkspace === "function") {
        const metaPatch = { 
          ...(currentWorkspace.meta || {}), 
          industry,
          description: workspaceDescription 
        };
        store.workspace.updateWorkspace(currentWorkspace.id, {
          name: workspaceName,
          meta: metaPatch,
        });
        console.log("Updated workspace data via store");
      }
    }
  } catch (error) {
    console.warn("Failed to update workspace via store:", error);
  }
}

/**
 * Update user profile via ubaStore if available
 */
function updateUserProfile(name, email, language, timezone) {
  try {
    const store = window.ubaStore;
    if (store && store.auth && typeof store.auth.currentUser === "function") {
      const currentUser = store.auth.currentUser();
      if (currentUser && typeof store.auth.updateUser === "function") {
        store.auth.updateUser(currentUser.id, {
          name,
          email,
          language,
          timezone,
        });
        console.log("Updated user profile via store");
      }
    }
  } catch (error) {
    console.warn("Failed to update user profile via store:", error);
  }
}

/**
 * Initialize advanced settings page
 */
function initAdvancedSettings() {
  const settings = loadExtendedSettings();
  
  // Get all form elements
  const themeToggle = document.getElementById("theme-toggle");
  const languageSelect = document.getElementById("language-select-settings");
  const workspaceNameInput = document.getElementById("setting-workspace-name");
  const workspaceDescInput = document.getElementById("setting-workspace-description");
  const industryInput = document.getElementById("setting-workspace-industry");
  const userNameInput = document.getElementById("setting-user-name");
  const userEmailInput = document.getElementById("setting-user-email");
  const timezoneSelect = document.getElementById("setting-timezone");
  const notificationsToggle = document.getElementById("setting-notifications");
  const singlePageToggle = document.getElementById("setting-single-page");
  const compactViewToggle = document.getElementById("setting-compact-view");
  const saveAllBtn = document.getElementById("save-all-settings");
  const statusEl = document.getElementById("settings-status");
  
  // Apply current theme immediately
  applyTheme(settings.theme);
  
  // Populate form fields with current settings
  if (themeToggle) {
    themeToggle.checked = settings.theme === "dark";
  }
  
  if (languageSelect) {
    languageSelect.value = settings.language;
  }
  
  if (workspaceNameInput) {
    workspaceNameInput.value = settings.workspaceName;
  }
  
  if (workspaceDescInput) {
    workspaceDescInput.value = settings.workspaceDescription || "";
  }
  
  if (timezoneSelect) {
    timezoneSelect.value = settings.timezone;
  }
  
  if (notificationsToggle) {
    notificationsToggle.checked = settings.notifications;
  }
  
  if (singlePageToggle) {
    singlePageToggle.checked = settings.singlePage;
  }
  
  if (compactViewToggle) {
    compactViewToggle.checked = settings.compactView;
  }
  
  // Load user and workspace data from store
  try {
    const store = window.ubaStore;
    if (store) {
      // Load current user data
      if (store.auth && typeof store.auth.currentUser === "function") {
        const currentUser = store.auth.currentUser();
        if (currentUser) {
          if (userNameInput) userNameInput.value = currentUser.name || "";
          if (userEmailInput) userEmailInput.value = currentUser.email || "";
        }
      }
      
      // Load workspace data
      if (store.workspace && typeof store.workspace.getCurrentWorkspace === "function") {
        const currentWorkspace = store.workspace.getCurrentWorkspace();
        if (currentWorkspace) {
          if (workspaceNameInput && !workspaceNameInput.value) {
            workspaceNameInput.value = currentWorkspace.name || "";
          }
          if (currentWorkspace.meta) {
            if (industryInput) industryInput.value = currentWorkspace.meta.industry || "";
            if (workspaceDescInput && !workspaceDescInput.value) {
              workspaceDescInput.value = currentWorkspace.meta.description || "";
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn("Failed to load data from store:", error);
  }
  
  // Theme toggle handler
  if (themeToggle) {
    themeToggle.addEventListener("change", function() {
      const theme = this.checked ? "dark" : "light";
      applyTheme(theme);
      saveExtendedSettings({ theme });
      showStatus("Theme updated", "success");
    });
  }
  
  // Language change handler
  if (languageSelect) {
    languageSelect.addEventListener("change", function() {
      const language = this.value;
      applyLanguageChange(language);
      saveExtendedSettings({ language });
      showStatus("Language updated", "success");
    });
  }
  
  // Individual preference toggles
  if (notificationsToggle) {
    notificationsToggle.addEventListener("change", function() {
      saveExtendedSettings({ notifications: this.checked });
      showStatus("Notifications preference updated", "success");
    });
  }
  
  if (singlePageToggle) {
    singlePageToggle.addEventListener("change", function() {
      const singlePage = this.checked;
      saveExtendedSettings({ singlePage });
      document.body.classList.toggle("uba-single-view", singlePage);
      showStatus("Navigation preference updated", "success");
    });
  }
  
  if (compactViewToggle) {
    compactViewToggle.addEventListener("change", function() {
      const compactView = this.checked;
      saveExtendedSettings({ compactView });
      document.body.classList.toggle("uba-compact-view", compactView);
      showStatus("View preference updated", "success");
    });
  }
  
  // Save all settings handler
  if (saveAllBtn) {
    saveAllBtn.addEventListener("click", function() {
      const updatedSettings = {
        workspaceName: workspaceNameInput?.value?.trim() || settings.workspaceName,
        workspaceDescription: workspaceDescInput?.value?.trim() || "",
        timezone: timezoneSelect?.value || settings.timezone,
        language: languageSelect?.value || settings.language,
        theme: themeToggle?.checked ? "dark" : "light",
        notifications: notificationsToggle?.checked ?? settings.notifications,
        singlePage: singlePageToggle?.checked ?? settings.singlePage,
        compactView: compactViewToggle?.checked ?? settings.compactView,
      };
      
      // Save settings
      saveExtendedSettings(updatedSettings);
      
      // Update user profile
      const userName = userNameInput?.value?.trim() || "";
      const userEmail = userEmailInput?.value?.trim() || "";
      if (userName || userEmail) {
        updateUserProfile(userName, userEmail, updatedSettings.language, updatedSettings.timezone);
      }
      
      // Update workspace
      const industry = industryInput?.value?.trim() || "";
      updateWorkspaceData(updatedSettings.workspaceName, updatedSettings.workspaceDescription, industry);
      
      // Apply changes immediately
      applyTheme(updatedSettings.theme);
      applyLanguageChange(updatedSettings.language);
      
      showStatus("All settings saved successfully!", "success");
    });
  }
  
  function showStatus(message, type = "info") {
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `uba-settings-status uba-status-${type}`;
      
      // Clear status after 3 seconds
      setTimeout(() => {
        statusEl.textContent = "";
        statusEl.className = "uba-settings-status";
      }, 3000);
    }
  }
  
  // Show initial status
  showStatus("Settings loaded", "info");
}

// Attach to window for global access
window.initAdvancedSettings = initAdvancedSettings;
window.loadExtendedSettings = loadExtendedSettings;
window.saveExtendedSettings = saveExtendedSettings;
window.applyTheme = applyTheme;

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdvancedSettings);
} else {
  initAdvancedSettings();
}

// Apply saved theme on page load
document.addEventListener("DOMContentLoaded", function() {
  const savedTheme = localStorage.getItem("uba-theme") || "light";
  applyTheme(savedTheme);
});