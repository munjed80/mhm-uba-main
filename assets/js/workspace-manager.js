// workspace-manager.js — Multi-workspace management system
(function () {
  const WORKSPACE_MANAGER_KEY = 'uba-workspace-manager';
  const CURRENT_WORKSPACE_KEY = 'uba-current-workspace';
  const MIGRATION_FLAG_KEY = 'uba-workspace-migrated';

  // Workspace management utilities
  function getWorkspaceManager() {
    try {
      const data = localStorage.getItem(WORKSPACE_MANAGER_KEY);
      return data ? JSON.parse(data) : {
        workspaces: {},
        workspaceOrder: []
      };
    } catch (e) {
      console.warn('Error reading workspace manager:', e);
      return {
        workspaces: {},
        workspaceOrder: []
      };
    }
  }

  function saveWorkspaceManager(manager) {
    try {
      localStorage.setItem(WORKSPACE_MANAGER_KEY, JSON.stringify(manager));
      return true;
    } catch (e) {
      console.warn('Error saving workspace manager:', e);
      return false;
    }
  }

  function getCurrentWorkspaceId() {
    return localStorage.getItem(CURRENT_WORKSPACE_KEY) || 'default';
  }

  function setCurrentWorkspaceId(workspaceId) {
    localStorage.setItem(CURRENT_WORKSPACE_KEY, workspaceId);
  }

  function generateWorkspaceId() {
    return 'ws-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Migration function for existing data
  function migrateExistingData() {
    const migrated = localStorage.getItem(MIGRATION_FLAG_KEY);
    if (migrated) return; // Already migrated

    console.log('Migrating existing data to workspace system...');
    
    // Check if there's any existing data to migrate
    const dataToMigrate = {};
    const keysToCheck = [
      'uba-local-clients',
      'uba-local-projects', 
      'uba-local-tasks',
      'uba-local-invoices',
      'uba-local-leads',
      'uba-local-expenses',
      'uba-local-files',
      'uba-local-reports',
      'uba-local-automations',
      'uba-local-automation-logs',
      'uba-settings'
    ];

    let hasExistingData = false;
    keysToCheck.forEach(key => {
      const data = localStorage.getItem(key);
      if (data && data !== '[]' && data !== '{}') {
        dataToMigrate[key] = data;
        hasExistingData = true;
      }
    });

    if (hasExistingData) {
      // Create default workspace
      const manager = getWorkspaceManager();
      const defaultWorkspace = {
        id: 'default',
        name: 'Default Workspace',
        description: 'Your original workspace data',
        createdAt: Date.now(),
        isDefault: true
      };

      manager.workspaces['default'] = defaultWorkspace;
      manager.workspaceOrder = ['default'];
      saveWorkspaceManager(manager);

      // Migrate the data to workspace-specific keys
      Object.keys(dataToMigrate).forEach(oldKey => {
        const newKey = oldKey + '-default';
        localStorage.setItem(newKey, dataToMigrate[oldKey]);
      });

      // Set default as current workspace
      setCurrentWorkspaceId('default');
      console.log('Migration completed. Created default workspace.');
    } else {
      // No existing data, create a fresh default workspace
      createDefaultWorkspace();
    }

    // Mark as migrated
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  }

  function createDefaultWorkspace() {
    const manager = getWorkspaceManager();
    if (!manager.workspaces['default']) {
      const defaultWorkspace = {
        id: 'default',
        name: 'My Workspace',
        description: 'Your primary workspace',
        createdAt: Date.now(),
        isDefault: true
      };

      manager.workspaces['default'] = defaultWorkspace;
      if (!manager.workspaceOrder.includes('default')) {
        manager.workspaceOrder.unshift('default');
      }
      saveWorkspaceManager(manager);
      setCurrentWorkspaceId('default');
    }
  }

  // Core workspace functions
  function createWorkspace(name, description = '') {
    const manager = getWorkspaceManager();
    const id = generateWorkspaceId();
    
    const workspace = {
      id: id,
      name: name,
      description: description,
      createdAt: Date.now(),
      isDefault: false
    };

    manager.workspaces[id] = workspace;
    manager.workspaceOrder.push(id);
    saveWorkspaceManager(manager);
    
    return workspace;
  }

  function getWorkspace(workspaceId) {
    const manager = getWorkspaceManager();
    return manager.workspaces[workspaceId] || null;
  }

  function getAllWorkspaces() {
    const manager = getWorkspaceManager();
    return manager.workspaceOrder.map(id => manager.workspaces[id]).filter(Boolean);
  }

  function updateWorkspace(workspaceId, updates) {
    const manager = getWorkspaceManager();
    if (manager.workspaces[workspaceId]) {
      manager.workspaces[workspaceId] = {
        ...manager.workspaces[workspaceId],
        ...updates,
        updatedAt: Date.now()
      };
      saveWorkspaceManager(manager);
      return manager.workspaces[workspaceId];
    }
    return null;
  }

  function deleteWorkspace(workspaceId) {
    if (workspaceId === 'default') {
      throw new Error('Cannot delete the default workspace');
    }

    const manager = getWorkspaceManager();
    if (!manager.workspaces[workspaceId]) {
      throw new Error('Workspace not found');
    }

    // Delete all data for this workspace
    const keysToDelete = [
      'uba-local-clients',
      'uba-local-projects',
      'uba-local-tasks', 
      'uba-local-invoices',
      'uba-local-leads',
      'uba-local-expenses',
      'uba-local-files',
      'uba-local-reports',
      'uba-local-automations',
      'uba-local-automation-logs',
      'uba-settings'
    ];

    keysToDelete.forEach(baseKey => {
      localStorage.removeItem(`${baseKey}-${workspaceId}`);
    });

    // Remove from manager
    delete manager.workspaces[workspaceId];
    manager.workspaceOrder = manager.workspaceOrder.filter(id => id !== workspaceId);
    saveWorkspaceManager(manager);

    // If this was the current workspace, switch to default
    if (getCurrentWorkspaceId() === workspaceId) {
      setCurrentWorkspaceId('default');
    }

    return true;
  }

  function switchWorkspace(workspaceId) {
    const manager = getWorkspaceManager();
    if (!manager.workspaces[workspaceId]) {
      throw new Error('Workspace not found');
    }

    setCurrentWorkspaceId(workspaceId);
    
    // Trigger page reload to refresh all data
    window.location.reload();
  }

  function getCurrentWorkspace() {
    const currentId = getCurrentWorkspaceId();
    return getWorkspace(currentId);
  }

  // UI Helper functions
  function renderWorkspaceSelector(selectElement, includeActions = false) {
    if (!selectElement) return;

    const workspaces = getAllWorkspaces();
    const currentId = getCurrentWorkspaceId();
    
    selectElement.innerHTML = workspaces.map(ws => 
      `<option value="${ws.id}" ${ws.id === currentId ? 'selected' : ''}>
        ${ws.name}
      </option>`
    ).join('');

    // Add change handler
    selectElement.onchange = function() {
      if (this.value !== currentId) {
        switchWorkspace(this.value);
      }
    };
  }

  function showWorkspaceCreateDialog() {
    const name = prompt('Enter workspace name:');
    if (name && name.trim()) {
      const description = prompt('Enter workspace description (optional):') || '';
      try {
        const workspace = createWorkspace(name.trim(), description.trim());
        alert(`Workspace "${workspace.name}" created successfully!`);
        
        // Refresh any workspace selectors on the page
        updateAllWorkspaceSelectors();
        
        return workspace;
      } catch (error) {
        alert(`Error creating workspace: ${error.message}`);
      }
    }
    return null;
  }

  function showWorkspaceRenameDialog(workspaceId) {
    const workspace = getWorkspace(workspaceId);
    if (!workspace) return null;

    const newName = prompt('Enter new workspace name:', workspace.name);
    if (newName && newName.trim() && newName.trim() !== workspace.name) {
      try {
        const updated = updateWorkspace(workspaceId, { name: newName.trim() });
        alert(`Workspace renamed to "${updated.name}"`);
        updateAllWorkspaceSelectors();
        return updated;
      } catch (error) {
        alert(`Error renaming workspace: ${error.message}`);
      }
    }
    return null;
  }

  function showWorkspaceDeleteDialog(workspaceId) {
    const workspace = getWorkspace(workspaceId);
    if (!workspace) return false;

    if (workspace.id === 'default') {
      alert('Cannot delete the default workspace');
      return false;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${workspace.name}"?

` +
      'This will permanently delete all data in this workspace including:
' +
      '• All clients, projects, and tasks
' +
      '• All invoices and financial data
' +
      '• All files and documents
' +
      '• All settings and customizations

' +
      'This action cannot be undone!'
    );

    if (confirmed) {
      try {
        deleteWorkspace(workspaceId);
        alert(`Workspace "${workspace.name}" has been deleted.`);
        updateAllWorkspaceSelectors();
        return true;
      } catch (error) {
        alert(`Error deleting workspace: ${error.message}`);
      }
    }
    return false;
  }

  function updateAllWorkspaceSelectors() {
    // Update all workspace selectors on the page
    document.querySelectorAll('.workspace-selector').forEach(select => {
      renderWorkspaceSelector(select);
    });

    // Update workspace name displays
    const currentWorkspace = getCurrentWorkspace();
    if (currentWorkspace) {
      document.querySelectorAll('.current-workspace-name').forEach(el => {
        el.textContent = currentWorkspace.name;
      });
    }
  }

  // Export workspace data
  function exportWorkspaceData(workspaceId) {
    const workspace = getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const exportData = {
      workspace: workspace,
      data: {},
      exportedAt: Date.now(),
      version: '1.0'
    };

    const keysToExport = [
      'uba-local-clients',
      'uba-local-projects',
      'uba-local-tasks',
      'uba-local-invoices', 
      'uba-local-leads',
      'uba-local-expenses',
      'uba-local-files',
      'uba-local-reports',
      'uba-local-automations',
      'uba-local-automation-logs',
      'uba-settings'
    ];

    keysToExport.forEach(baseKey => {
      const fullKey = `${baseKey}-${workspaceId}`;
      const data = localStorage.getItem(fullKey);
      if (data) {
        exportData.data[baseKey] = JSON.parse(data);
      }
    });

    return exportData;
  }

  // Import workspace data
  function importWorkspaceData(importData, targetWorkspaceId = null) {
    if (!importData.workspace || !importData.data) {
      throw new Error('Invalid import data format');
    }

    const workspaceId = targetWorkspaceId || generateWorkspaceId();
    
    // Create or update workspace
    let workspace;
    if (targetWorkspaceId && getWorkspace(targetWorkspaceId)) {
      workspace = updateWorkspace(targetWorkspaceId, {
        name: importData.workspace.name,
        description: importData.workspace.description
      });
    } else {
      workspace = createWorkspace(
        importData.workspace.name,
        importData.workspace.description
      );
    }

    // Import the data
    Object.keys(importData.data).forEach(baseKey => {
      const fullKey = `${baseKey}-${workspace.id}`;
      localStorage.setItem(fullKey, JSON.stringify(importData.data[baseKey]));
    });

    return workspace;
  }

  // Initialize workspace system
  function initWorkspaceSystem() {
    // Run migration on first load
    migrateExistingData();

    // Ensure default workspace exists
    createDefaultWorkspace();

    // Set up global click handlers for workspace actions
    document.addEventListener('click', function(e) {
      if (e.target.matches('[data-workspace-action]')) {
        const action = e.target.dataset.workspaceAction;
        const workspaceId = e.target.dataset.workspaceId;
        
        switch (action) {
          case 'create':
            showWorkspaceCreateDialog();
            break;
          case 'rename':
            if (workspaceId) showWorkspaceRenameDialog(workspaceId);
            break;
          case 'delete':
            if (workspaceId) showWorkspaceDeleteDialog(workspaceId);
            break;
          case 'switch':
            if (workspaceId) switchWorkspace(workspaceId);
            break;
        }
      }
    });

    // Update any workspace displays on the page
    updateAllWorkspaceSelectors();
  }

  // Public API
  window.WorkspaceManager = {
    // Core functions
    createWorkspace,
    getWorkspace,
    getAllWorkspaces,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace,
    getCurrentWorkspace,
    getCurrentWorkspaceId,
    
    // UI helpers
    renderWorkspaceSelector,
    updateAllWorkspaceSelectors,
    showWorkspaceCreateDialog,
    showWorkspaceRenameDialog,
    showWorkspaceDeleteDialog,
    
    // Data management
    exportWorkspaceData,
    importWorkspaceData,
    
    // Initialization
    init: initWorkspaceSystem
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkspaceSystem);
  } else {
    initWorkspaceSystem();
  }
})();