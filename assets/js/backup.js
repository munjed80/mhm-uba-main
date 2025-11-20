// assets/js/backup.js - Complete LocalStorage backup system for MHM UBA

/**
 * Export all ubaStore data to a downloadable JSON file
 */
function exportUBA() {
  try {
    const store = window.ubaStore;
    if (!store) {
      alert('UBA Store not available. Please refresh the page and try again.');
      return;
    }

    // Collect all data from store modules
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {}
    };

    // Get all collections that have getAll() method
    const collections = [
      'clients', 'projects', 'tasks', 'invoices', 
      'automations', 'leads', 'expenses', 'files', 'reports'
    ];

    collections.forEach(collectionName => {
      try {
        if (store[collectionName] && typeof store[collectionName].getAll === 'function') {
          backupData.data[collectionName] = store[collectionName].getAll();
          console.log(`Exported ${collectionName}:`, backupData.data[collectionName].length, 'items');
        }
      } catch (error) {
        console.warn(`Failed to export ${collectionName}:`, error);
        backupData.data[collectionName] = [];
      }
    });

    // Add settings and other localStorage data
    try {
      const settings = localStorage.getItem('uba-settings');
      if (settings) {
        backupData.data.settings = JSON.parse(settings);
      }
    } catch (error) {
      console.warn('Failed to export settings:', error);
    }

    try {
      const language = localStorage.getItem('uba-lang');
      if (language) {
        backupData.data.language = language;
      }
    } catch (error) {
      console.warn('Failed to export language:', error);
    }

    // Create and download file
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mhm-uba-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('Backup exported successfully!');
    
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed. Please check the console for details.');
  }
}

/**
 * Import backup data from JSON and restore the workspace
 */
function importUBA(jsonData) {
  try {
    const store = window.ubaStore;
    if (!store) {
      alert('UBA Store not available. Please refresh the page and try again.');
      return;
    }

    let backupData;
    
    // Parse JSON if it's a string
    if (typeof jsonData === 'string') {
      backupData = JSON.parse(jsonData);
    } else {
      backupData = jsonData;
    }

    // Validate backup structure
    if (!backupData.data) {
      throw new Error('Invalid backup format: missing data section');
    }

    console.log('Importing backup from:', backupData.timestamp);

    // Clear and restore each collection
    const collections = [
      'clients', 'projects', 'tasks', 'invoices', 
      'automations', 'leads', 'expenses', 'files', 'reports'
    ];

    collections.forEach(collectionName => {
      try {
        const collectionData = backupData.data[collectionName];
        if (collectionData && Array.isArray(collectionData) && store[collectionName]) {
          
          // Clear existing data
          if (typeof store[collectionName].clear === 'function') {
            store[collectionName].clear();
          } else {
            // Fallback: remove all items individually
            const existing = store[collectionName].getAll();
            existing.forEach(item => {
              if (item.id && typeof store[collectionName].delete === 'function') {
                store[collectionName].delete(item.id);
              }
            });
          }

          // Import new data
          collectionData.forEach(item => {
            if (typeof store[collectionName].add === 'function') {
              store[collectionName].add(item);
            } else if (typeof store[collectionName].set === 'function') {
              store[collectionName].set(item.id, item);
            }
          });

          console.log(`Imported ${collectionName}:`, collectionData.length, 'items');
        }
      } catch (error) {
        console.warn(`Failed to import ${collectionName}:`, error);
      }
    });

    // Restore settings
    try {
      if (backupData.data.settings) {
        localStorage.setItem('uba-settings', JSON.stringify(backupData.data.settings));
      }
    } catch (error) {
      console.warn('Failed to import settings:', error);
    }

    // Restore language
    try {
      if (backupData.data.language) {
        localStorage.setItem('uba-lang', backupData.data.language);
      }
    } catch (error) {
      console.warn('Failed to import language:', error);
    }

    alert('Backup imported successfully! The page will reload to apply changes.');
    
    // Reload page to refresh all data
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('Import failed:', error);
    alert('Import failed: ' + error.message);
  }
}

/**
 * Handle file input for backup import
 */
function handleBackupImport(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().includes('.json')) {
    alert('Please select a valid JSON backup file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const jsonData = e.target.result;
      importUBA(jsonData);
    } catch (error) {
      alert('Failed to read backup file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

/**
 * Initialize backup UI handlers
 */
function initBackupHandlers() {
  // Export button handler
  const exportBtn = document.getElementById('export-backup-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportUBA);
  }

  // Import file input handler
  const importInput = document.getElementById('import-backup-input');
  if (importInput) {
    importInput.addEventListener('change', handleBackupImport);
  }

  // Import button handler (triggers file input)
  const importBtn = document.getElementById('import-backup-btn');
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => {
      importInput.click();
    });
  }
}

// Attach functions to window for global access
window.exportUBA = exportUBA;
window.importUBA = importUBA;
window.handleBackupImport = handleBackupImport;
window.initBackupHandlers = initBackupHandlers;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBackupHandlers);
} else {
  initBackupHandlers();
}