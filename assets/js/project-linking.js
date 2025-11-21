// project-linking.js — Advanced project linking system for tasks and invoices
(function() {
  'use strict';
  
  /**
   * Initialize project linking system
   */
  function initProjectLinking() {
    console.log('🔗 Initializing project linking system');
    
    // Setup automatic linking when data changes
    setupAutoLinking();
    
    // Setup linking UI in forms
    setupProjectSelectors();
    
    // Setup project-based filtering
    setupProjectFilters();
    
    console.log('✓ Project linking system initialized');
  }
  
  /**
   * Setup automatic linking based on name/content matching
   */
  function setupAutoLinking() {
    // Listen for data changes to auto-link items
    if (window.ubaStore) {
      const store = window.ubaStore;
      
      // Override store methods to add auto-linking
      ['tasks', 'invoices'].forEach(collection => {
        if (store[collection]) {
          const originalCreate = store[collection].create;
          const originalUpdate = store[collection].update;
          
          store[collection].create = function(item) {
            const result = originalCreate.call(this, item);
            if (result) {
              autoLinkProjectToItem(collection, result);
            }
            return result;
          };
          
          store[collection].update = function(id, updates) {
            const result = originalUpdate.call(this, id, updates);
            if (result) {
              const fullItem = this.get(id);
              autoLinkProjectToItem(collection, fullItem);
            }
            return result;
          };
        }
      });
    }
  }
  
  /**
   * Auto-link project to item based on content analysis
   */
  function autoLinkProjectToItem(collection, item) {
    if (!item || item.project_id) return; // Already linked
    
    const projects = getProjects();
    if (projects.length === 0) return;
    
    // Try to find matching project
    const matchedProject = findMatchingProject(item, projects);
    
    if (matchedProject) {
      // Create link
      linkProjectToItem(matchedProject.id, collection, item.id);
      
      // Show notification about auto-linking
      if (window.showToast) {
        const itemType = collection.slice(0, -1); // Remove 's' from end
        window.showToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} auto-linked to project "${matchedProject.name}"`, 'info');
      }
    }
  }
  
  /**
   * Find matching project for an item
   */
  function findMatchingProject(item, projects) {
    if (!item) return null;
    
    // Get searchable text from item
    const searchText = getSearchableText(item).toLowerCase();
    if (!searchText) return null;
    
    let bestMatch = null;
    let bestScore = 0;
    
    projects.forEach(project => {
      const projectName = (project.name || '').toLowerCase();
      const projectClient = (project.client || '').toLowerCase();
      const projectNotes = (project.notes || project.description || '').toLowerCase();
      
      // Direct name match in content
      if (searchText.includes(projectName) && projectName.length > 2) {
        const score = calculateMatchScore(searchText, projectName);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = project;
        }
      }
      
      // Client name match
      if (projectClient && searchText.includes(projectClient) && projectClient.length > 2) {
        const score = calculateMatchScore(searchText, projectClient) * 0.8; // Slightly lower priority
        if (score > bestScore) {
          bestScore = score;
          bestMatch = project;
        }
      }
      
      // Keyword matching from project notes
      if (projectNotes) {
        const commonWords = findCommonWords(searchText, projectNotes);
        if (commonWords.length >= 2) {
          const score = commonWords.length * 0.3;
          if (score > bestScore && score > 0.5) {
            bestScore = score;
            bestMatch = project;
          }
        }
      }
    });
    
    // Only return if confidence is high enough
    return bestScore > 0.6 ? bestMatch : null;
  }
  
  /**
   * Get searchable text from an item
   */
  function getSearchableText(item) {
    const parts = [];
    
    // Add relevant text fields based on item type
    ['title', 'name', 'label', 'description', 'notes', 'client'].forEach(field => {
      if (item[field]) {
        parts.push(item[field]);
      }
    });
    
    return parts.join(' ');
  }
  
  /**
   * Calculate match score between two text strings
   */
  function calculateMatchScore(text, pattern) {
    if (!text || !pattern) return 0;
    
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    // Exact substring match
    if (textLower.includes(patternLower)) {
      return Math.min(1.0, patternLower.length / textLower.length * 2);
    }
    
    // Word boundary match
    const words = patternLower.split(' ').filter(w => w.length > 2);
    let matchedWords = 0;
    
    words.forEach(word => {
      if (textLower.includes(word)) {
        matchedWords++;
      }
    });
    
    return words.length > 0 ? matchedWords / words.length * 0.7 : 0;
  }
  
  /**
   * Find common meaningful words between two texts
   */
  function findCommonWords(text1, text2) {
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    const words1 = text1.toLowerCase().match(/\\b\\w{3,}\\b/g) || [];
    const words2 = text2.toLowerCase().match(/\\b\\w{3,}\\b/g) || [];
    
    const set2 = new Set(words2.filter(w => !stopWords.has(w)));
    
    return words1.filter(w => !stopWords.has(w) && set2.has(w));
  }
  
  /**
   * Link a project to an item
   */
  function linkProjectToItem(projectId, collection, itemId) {
    const store = window.ubaStore;
    if (!store || !store[collection]) return false;
    
    try {
      const item = store[collection].get(itemId);
      if (item) {
        store[collection].update(itemId, {
          project_id: projectId,
          linked_at: new Date().toISOString()
        });
        
        // Update project's last activity
        updateProjectActivity(projectId);
        
        return true;
      }
    } catch (error) {
      console.error('Error linking project to item:', error);
    }
    
    return false;
  }
  
  /**
   * Unlink a project from an item
   */
  function unlinkProjectFromItem(collection, itemId) {
    const store = window.ubaStore;
    if (!store || !store[collection]) return false;
    
    try {
      const item = store[collection].get(itemId);
      if (item && item.project_id) {
        const updates = { ...item };
        delete updates.project_id;
        delete updates.linked_at;
        
        store[collection].update(itemId, updates);
        return true;
      }
    } catch (error) {
      console.error('Error unlinking project from item:', error);
    }
    
    return false;
  }
  
  /**
   * Update project's last activity timestamp
   */
  function updateProjectActivity(projectId) {
    const store = window.ubaStore;
    if (!store || !store.projects) return;
    
    try {
      const project = store.projects.get(projectId);
      if (project) {
        store.projects.update(projectId, {
          last_activity: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating project activity:', error);
    }
  }
  
  /**
   * Get all projects
   */
  function getProjects() {
    const store = window.ubaStore;
    if (!store || !store.projects) return [];
    
    return store.projects.getAll() || [];
  }
  
  /**
   * Get linked items for a project
   */
  function getProjectLinkedItems(projectId) {
    const store = window.ubaStore;
    if (!store) return { tasks: [], invoices: [] };
    
    const tasks = store.tasks ? store.tasks.getAll().filter(t => t.project_id === projectId) : [];
    const invoices = store.invoices ? store.invoices.getAll().filter(i => i.project_id === projectId) : [];
    
    return { tasks, invoices };
  }
  
  /**
   * Get project summary with linked data
   */
  function getProjectSummary(projectId) {
    const project = getProjectById(projectId);
    if (!project) return null;
    
    const linked = getProjectLinkedItems(projectId);
    
    // Calculate statistics
    const stats = {
      totalTasks: linked.tasks.length,
      completedTasks: linked.tasks.filter(t => t.status === 'done').length,
      totalInvoices: linked.invoices.length,
      paidInvoices: linked.invoices.filter(i => i.status === 'paid').length,
      totalRevenue: linked.invoices.reduce((sum, i) => sum + (i.amount || 0), 0),
      pendingRevenue: linked.invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.amount || 0), 0)
    };
    
    return {
      project,
      linked,
      stats,
      progress: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
    };
  }
  
  /**
   * Get project by ID
   */
  function getProjectById(projectId) {
    const store = window.ubaStore;
    if (!store || !store.projects) return null;
    
    return store.projects.get(projectId);
  }
  
  /**
   * Setup project selectors in forms
   */
  function setupProjectSelectors() {
    // Add project selectors to task and invoice forms
    addProjectSelectorToForms();
  }
  
  /**
   * Add project selector to forms
   */
  function addProjectSelectorToForms() {
    // Look for task form
    const taskForm = document.querySelector('#task-form, #new-task-form');
    if (taskForm && !taskForm.querySelector('#task-project-select')) {
      addProjectSelectorToForm(taskForm, 'task');
    }
    
    // Look for invoice form
    const invoiceForm = document.querySelector('#invoice-form, #new-invoice-form');
    if (invoiceForm && !invoiceForm.querySelector('#invoice-project-select')) {
      addProjectSelectorToForm(invoiceForm, 'invoice');
    }
    
    // Re-check periodically for dynamically added forms
    setTimeout(addProjectSelectorToForms, 2000);
  }
  
  /**
   * Add project selector to a specific form
   */
  function addProjectSelectorToForm(form, type) {
    const projects = getProjects().filter(p => p.stage !== 'completed');
    if (projects.length === 0) return;
    
    const selector = document.createElement('div');
    selector.className = 'uba-form-group';
    selector.innerHTML = `
      <label for=\"${type}-project-select\" class=\"uba-form-label\">Link to Project</label>
      <select id=\"${type}-project-select\" class=\"uba-select\">
        <option value=\"\">Select a project (optional)</option>
        ${projects.map(p => `<option value=\"${p.id}\">${p.name}${p.client ? ` (${p.client})` : ''}</option>`).join('')}
      </select>
      <small class=\"uba-form-help\">Link this ${type} to a project for better organization and tracking.</small>
    `;
    
    // Insert near the top of the form, after title/name field
    const titleField = form.querySelector('input[type=\"text\"]');
    if (titleField && titleField.parentElement) {
      titleField.parentElement.insertAdjacentElement('afterend', selector);
    } else {
      // Fallback: insert at the beginning
      form.insertBefore(selector, form.firstElementChild);
    }
    
    // Add form submission handler
    const selectElement = selector.querySelector('select');
    addProjectLinkingToFormSubmission(form, selectElement, type);
  }
  
  /**
   * Add project linking to form submission
   */
  function addProjectLinkingToFormSubmission(form, selectElement, type) {
    const originalOnSubmit = form.onsubmit;
    
    form.addEventListener('submit', function(e) {
      const selectedProjectId = selectElement.value;
      
      if (selectedProjectId) {
        // Store the project ID for later linking
        form.dataset.selectedProjectId = selectedProjectId;
        
        // Wait for the item to be created, then link it
        setTimeout(() => {
          const store = window.ubaStore;
          if (store && store[type + 's']) {
            const items = store[type + 's'].getAll();
            const latestItem = items[items.length - 1]; // Assume latest is the one just created
            
            if (latestItem && !latestItem.project_id) {
              linkProjectToItem(selectedProjectId, type + 's', latestItem.id);
            }
          }
        }, 100);
      }
      
      // Call original handler if exists
      if (originalOnSubmit) {
        return originalOnSubmit.call(this, e);
      }
    });
  }
  
  /**
   * Setup project-based filtering
   */
  function setupProjectFilters() {
    // Add project filters to pages that show tasks/invoices
    addProjectFiltersToPages();
  }
  
  /**
   * Add project filters to relevant pages
   */
  function addProjectFiltersToPages() {
    // Check if we're on tasks or invoices page
    const pageId = document.querySelector('[data-page]')?.dataset.page;
    
    if (pageId === 'tasks-page') {
      addProjectFilterToTasksPage();
    } else if (pageId === 'invoices-page') {
      addProjectFilterToInvoicesPage();
    }
  }
  
  /**
   * Add project filter to tasks page
   */
  function addProjectFilterToTasksPage() {
    const controlsRight = document.querySelector('.uba-controls-right');
    if (!controlsRight || controlsRight.querySelector('#tasks-project-filter')) return;
    
    const projects = getProjects();
    if (projects.length === 0) return;
    
    const filter = document.createElement('select');
    filter.id = 'tasks-project-filter';
    filter.className = 'uba-select uba-select-compact';
    filter.innerHTML = `
      <option value=\"all\">All Projects</option>
      <option value=\"unlinked\">Unlinked Tasks</option>
      ${projects.map(p => `<option value=\"${p.id}\">${p.name}</option>`).join('')}
    `;
    
    filter.addEventListener('change', filterTasksByProject);
    
    // Insert before the last element (usually add button)
    const lastChild = controlsRight.lastElementChild;
    if (lastChild) {
      controlsRight.insertBefore(filter, lastChild);
    } else {
      controlsRight.appendChild(filter);
    }
  }
  
  /**
   * Add project filter to invoices page
   */
  function addProjectFilterToInvoicesPage() {
    const controlsRight = document.querySelector('.uba-controls-right');
    if (!controlsRight || controlsRight.querySelector('#invoices-project-filter')) return;
    
    const projects = getProjects();
    if (projects.length === 0) return;
    
    const filter = document.createElement('select');
    filter.id = 'invoices-project-filter';
    filter.className = 'uba-select uba-select-compact';
    filter.innerHTML = `
      <option value=\"all\">All Projects</option>
      <option value=\"unlinked\">Unlinked Invoices</option>
      ${projects.map(p => `<option value=\"${p.id}\">${p.name}</option>`).join('')}
    `;
    
    filter.addEventListener('change', filterInvoicesByProject);
    
    // Insert before the last element (usually add button)
    const lastChild = controlsRight.lastElementChild;
    if (lastChild) {
      controlsRight.insertBefore(filter, lastChild);
    } else {
      controlsRight.appendChild(filter);
    }
  }
  
  /**
   * Filter tasks by project
   */
  function filterTasksByProject(e) {
    const selectedValue = e.target.value;
    const taskCards = document.querySelectorAll('.uba-task-card, .uba-task-item');
    
    taskCards.forEach(card => {
      const taskId = card.dataset.taskId || card.dataset.id;
      if (!taskId) return;
      
      const store = window.ubaStore;
      const task = store?.tasks?.get(taskId);
      if (!task) return;
      
      let shouldShow = true;
      
      if (selectedValue === 'all') {
        shouldShow = true;
      } else if (selectedValue === 'unlinked') {
        shouldShow = !task.project_id;
      } else {
        shouldShow = task.project_id === selectedValue;
      }
      
      card.style.display = shouldShow ? '' : 'none';
    });
  }
  
  /**
   * Filter invoices by project
   */
  function filterInvoicesByProject(e) {
    const selectedValue = e.target.value;
    const invoiceCards = document.querySelectorAll('.uba-invoice-card, .uba-invoice-item');
    
    invoiceCards.forEach(card => {
      const invoiceId = card.dataset.invoiceId || card.dataset.id;
      if (!invoiceId) return;
      
      const store = window.ubaStore;
      const invoice = store?.invoices?.get(invoiceId);
      if (!invoice) return;
      
      let shouldShow = true;
      
      if (selectedValue === 'all') {
        shouldShow = true;
      } else if (selectedValue === 'unlinked') {
        shouldShow = !invoice.project_id;
      } else {
        shouldShow = invoice.project_id === selectedValue;
      }
      
      card.style.display = shouldShow ? '' : 'none';
    });
  }
  
  /**
   * Suggest project links for existing unlinked items
   */
  function suggestProjectLinks() {
    const store = window.ubaStore;
    if (!store) return [];
    
    const suggestions = [];
    const projects = getProjects();
    
    if (projects.length === 0) return suggestions;
    
    // Check unlinked tasks
    if (store.tasks) {
      const unlinkedTasks = store.tasks.getAll().filter(t => !t.project_id);
      unlinkedTasks.forEach(task => {
        const match = findMatchingProject(task, projects);
        if (match) {
          suggestions.push({
            type: 'task',
            item: task,
            project: match,
            confidence: 'high'
          });
        }
      });
    }
    
    // Check unlinked invoices
    if (store.invoices) {
      const unlinkedInvoices = store.invoices.getAll().filter(i => !i.project_id);
      unlinkedInvoices.forEach(invoice => {
        const match = findMatchingProject(invoice, projects);
        if (match) {
          suggestions.push({
            type: 'invoice',
            item: invoice,
            project: match,
            confidence: 'high'
          });
        }
      });
    }
    
    return suggestions;
  }
  
  /**
   * Apply suggested project links
   */
  function applySuggestedLinks(suggestions) {
    if (!suggestions || suggestions.length === 0) return;
    
    let applied = 0;
    
    suggestions.forEach(suggestion => {
      const success = linkProjectToItem(
        suggestion.project.id,
        suggestion.type + 's',
        suggestion.item.id
      );
      
      if (success) {
        applied++;
      }
    });
    
    if (applied > 0 && window.showToast) {
      window.showToast(`Applied ${applied} suggested project links`, 'success');
    }
    
    return applied;
  }
  
  // Expose Project Linking API
  window.UBAProjectLinking = {
    init: initProjectLinking,
    link: linkProjectToItem,
    unlink: unlinkProjectFromItem,
    getLinkedItems: getProjectLinkedItems,
    getSummary: getProjectSummary,
    suggestLinks: suggestProjectLinks,
    applyLinks: applySuggestedLinks,
    autoLink: autoLinkProjectToItem
  };
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectLinking);
  } else {
    // Delay initialization to ensure store is ready
    setTimeout(initProjectLinking, 200);
  }
  
  console.log('✓ Project Linking module loaded');
  
})();