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
    });\n    \n    // Only return if confidence is high enough\n    return bestScore > 0.6 ? bestMatch : null;\n  }\n  \n  /**\n   * Get searchable text from an item\n   */\n  function getSearchableText(item) {\n    const parts = [];\n    \n    // Add relevant text fields based on item type\n    ['title', 'name', 'label', 'description', 'notes', 'client'].forEach(field => {\n      if (item[field]) {\n        parts.push(item[field]);\n      }\n    });\n    \n    return parts.join(' ');\n  }\n  \n  /**\n   * Calculate match score between two text strings\n   */\n  function calculateMatchScore(text, pattern) {\n    if (!text || !pattern) return 0;\n    \n    const textLower = text.toLowerCase();\n    const patternLower = pattern.toLowerCase();\n    \n    // Exact substring match\n    if (textLower.includes(patternLower)) {\n      return Math.min(1.0, patternLower.length / textLower.length * 2);\n    }\n    \n    // Word boundary match\n    const words = patternLower.split(' ').filter(w => w.length > 2);\n    let matchedWords = 0;\n    \n    words.forEach(word => {\n      if (textLower.includes(word)) {\n        matchedWords++;\n      }\n    });\n    \n    return words.length > 0 ? matchedWords / words.length * 0.7 : 0;\n  }\n  \n  /**\n   * Find common meaningful words between two texts\n   */\n  function findCommonWords(text1, text2) {\n    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);\n    \n    const words1 = text1.toLowerCase().match(/\\b\\w{3,}\\b/g) || [];\n    const words2 = text2.toLowerCase().match(/\\b\\w{3,}\\b/g) || [];\n    \n    const set2 = new Set(words2.filter(w => !stopWords.has(w)));\n    \n    return words1.filter(w => !stopWords.has(w) && set2.has(w));\n  }\n  \n  /**\n   * Link a project to an item\n   */\n  function linkProjectToItem(projectId, collection, itemId) {\n    const store = window.ubaStore;\n    if (!store || !store[collection]) return false;\n    \n    try {\n      const item = store[collection].get(itemId);\n      if (item) {\n        store[collection].update(itemId, {\n          project_id: projectId,\n          linked_at: new Date().toISOString()\n        });\n        \n        // Update project's last activity\n        updateProjectActivity(projectId);\n        \n        return true;\n      }\n    } catch (error) {\n      console.error('Error linking project to item:', error);\n    }\n    \n    return false;\n  }\n  \n  /**\n   * Unlink a project from an item\n   */\n  function unlinkProjectFromItem(collection, itemId) {\n    const store = window.ubaStore;\n    if (!store || !store[collection]) return false;\n    \n    try {\n      const item = store[collection].get(itemId);\n      if (item && item.project_id) {\n        const updates = { ...item };\n        delete updates.project_id;\n        delete updates.linked_at;\n        \n        store[collection].update(itemId, updates);\n        return true;\n      }\n    } catch (error) {\n      console.error('Error unlinking project from item:', error);\n    }\n    \n    return false;\n  }\n  \n  /**\n   * Update project's last activity timestamp\n   */\n  function updateProjectActivity(projectId) {\n    const store = window.ubaStore;\n    if (!store || !store.projects) return;\n    \n    try {\n      const project = store.projects.get(projectId);\n      if (project) {\n        store.projects.update(projectId, {\n          last_activity: new Date().toISOString()\n        });\n      }\n    } catch (error) {\n      console.error('Error updating project activity:', error);\n    }\n  }\n  \n  /**\n   * Get all projects\n   */\n  function getProjects() {\n    const store = window.ubaStore;\n    if (!store || !store.projects) return [];\n    \n    return store.projects.getAll() || [];\n  }\n  \n  /**\n   * Get linked items for a project\n   */\n  function getProjectLinkedItems(projectId) {\n    const store = window.ubaStore;\n    if (!store) return { tasks: [], invoices: [] };\n    \n    const tasks = store.tasks ? store.tasks.getAll().filter(t => t.project_id === projectId) : [];\n    const invoices = store.invoices ? store.invoices.getAll().filter(i => i.project_id === projectId) : [];\n    \n    return { tasks, invoices };\n  }\n  \n  /**\n   * Get project summary with linked data\n   */\n  function getProjectSummary(projectId) {\n    const project = getProjectById(projectId);\n    if (!project) return null;\n    \n    const linked = getProjectLinkedItems(projectId);\n    \n    // Calculate statistics\n    const stats = {\n      totalTasks: linked.tasks.length,\n      completedTasks: linked.tasks.filter(t => t.status === 'done').length,\n      totalInvoices: linked.invoices.length,\n      paidInvoices: linked.invoices.filter(i => i.status === 'paid').length,\n      totalRevenue: linked.invoices.reduce((sum, i) => sum + (i.amount || 0), 0),\n      pendingRevenue: linked.invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.amount || 0), 0)\n    };\n    \n    return {\n      project,\n      linked,\n      stats,\n      progress: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0\n    };\n  }\n  \n  /**\n   * Get project by ID\n   */\n  function getProjectById(projectId) {\n    const store = window.ubaStore;\n    if (!store || !store.projects) return null;\n    \n    return store.projects.get(projectId);\n  }\n  \n  /**\n   * Setup project selectors in forms\n   */\n  function setupProjectSelectors() {\n    // Add project selectors to task and invoice forms\n    addProjectSelectorToForms();\n  }\n  \n  /**\n   * Add project selector to forms\n   */\n  function addProjectSelectorToForms() {\n    // Look for task form\n    const taskForm = document.querySelector('#task-form, #new-task-form');\n    if (taskForm && !taskForm.querySelector('#task-project-select')) {\n      addProjectSelectorToForm(taskForm, 'task');\n    }\n    \n    // Look for invoice form\n    const invoiceForm = document.querySelector('#invoice-form, #new-invoice-form');\n    if (invoiceForm && !invoiceForm.querySelector('#invoice-project-select')) {\n      addProjectSelectorToForm(invoiceForm, 'invoice');\n    }\n    \n    // Re-check periodically for dynamically added forms\n    setTimeout(addProjectSelectorToForms, 2000);\n  }\n  \n  /**\n   * Add project selector to a specific form\n   */\n  function addProjectSelectorToForm(form, type) {\n    const projects = getProjects().filter(p => p.stage !== 'completed');\n    if (projects.length === 0) return;\n    \n    const selector = document.createElement('div');\n    selector.className = 'uba-form-group';\n    selector.innerHTML = `\n      <label for=\"${type}-project-select\" class=\"uba-form-label\">Link to Project</label>\n      <select id=\"${type}-project-select\" class=\"uba-select\">\n        <option value=\"\">Select a project (optional)</option>\n        ${projects.map(p => `<option value=\"${p.id}\">${p.name}${p.client ? ` (${p.client})` : ''}</option>`).join('')}\n      </select>\n      <small class=\"uba-form-help\">Link this ${type} to a project for better organization and tracking.</small>\n    `;\n    \n    // Insert near the top of the form, after title/name field\n    const titleField = form.querySelector('input[type=\"text\"]');\n    if (titleField && titleField.parentElement) {\n      titleField.parentElement.insertAdjacentElement('afterend', selector);\n    } else {\n      // Fallback: insert at the beginning\n      form.insertBefore(selector, form.firstElementChild);\n    }\n    \n    // Add form submission handler\n    const selectElement = selector.querySelector('select');\n    addProjectLinkingToFormSubmission(form, selectElement, type);\n  }\n  \n  /**\n   * Add project linking to form submission\n   */\n  function addProjectLinkingToFormSubmission(form, selectElement, type) {\n    const originalOnSubmit = form.onsubmit;\n    \n    form.addEventListener('submit', function(e) {\n      const selectedProjectId = selectElement.value;\n      \n      if (selectedProjectId) {\n        // Store the project ID for later linking\n        form.dataset.selectedProjectId = selectedProjectId;\n        \n        // Wait for the item to be created, then link it\n        setTimeout(() => {\n          const store = window.ubaStore;\n          if (store && store[type + 's']) {\n            const items = store[type + 's'].getAll();\n            const latestItem = items[items.length - 1]; // Assume latest is the one just created\n            \n            if (latestItem && !latestItem.project_id) {\n              linkProjectToItem(selectedProjectId, type + 's', latestItem.id);\n            }\n          }\n        }, 100);\n      }\n      \n      // Call original handler if exists\n      if (originalOnSubmit) {\n        return originalOnSubmit.call(this, e);\n      }\n    });\n  }\n  \n  /**\n   * Setup project-based filtering\n   */\n  function setupProjectFilters() {\n    // Add project filters to pages that show tasks/invoices\n    addProjectFiltersToPages();\n  }\n  \n  /**\n   * Add project filters to relevant pages\n   */\n  function addProjectFiltersToPages() {\n    // Check if we're on tasks or invoices page\n    const pageId = document.querySelector('[data-page]')?.dataset.page;\n    \n    if (pageId === 'tasks-page') {\n      addProjectFilterToTasksPage();\n    } else if (pageId === 'invoices-page') {\n      addProjectFilterToInvoicesPage();\n    }\n  }\n  \n  /**\n   * Add project filter to tasks page\n   */\n  function addProjectFilterToTasksPage() {\n    const controlsRight = document.querySelector('.uba-controls-right');\n    if (!controlsRight || controlsRight.querySelector('#tasks-project-filter')) return;\n    \n    const projects = getProjects();\n    if (projects.length === 0) return;\n    \n    const filter = document.createElement('select');\n    filter.id = 'tasks-project-filter';\n    filter.className = 'uba-select uba-select-compact';\n    filter.innerHTML = `\n      <option value=\"all\">All Projects</option>\n      <option value=\"unlinked\">Unlinked Tasks</option>\n      ${projects.map(p => `<option value=\"${p.id}\">${p.name}</option>`).join('')}\n    `;\n    \n    filter.addEventListener('change', filterTasksByProject);\n    \n    // Insert before the last element (usually add button)\n    const lastChild = controlsRight.lastElementChild;\n    if (lastChild) {\n      controlsRight.insertBefore(filter, lastChild);\n    } else {\n      controlsRight.appendChild(filter);\n    }\n  }\n  \n  /**\n   * Add project filter to invoices page\n   */\n  function addProjectFilterToInvoicesPage() {\n    const controlsRight = document.querySelector('.uba-controls-right');\n    if (!controlsRight || controlsRight.querySelector('#invoices-project-filter')) return;\n    \n    const projects = getProjects();\n    if (projects.length === 0) return;\n    \n    const filter = document.createElement('select');\n    filter.id = 'invoices-project-filter';\n    filter.className = 'uba-select uba-select-compact';\n    filter.innerHTML = `\n      <option value=\"all\">All Projects</option>\n      <option value=\"unlinked\">Unlinked Invoices</option>\n      ${projects.map(p => `<option value=\"${p.id}\">${p.name}</option>`).join('')}\n    `;\n    \n    filter.addEventListener('change', filterInvoicesByProject);\n    \n    // Insert before the last element (usually add button)\n    const lastChild = controlsRight.lastElementChild;\n    if (lastChild) {\n      controlsRight.insertBefore(filter, lastChild);\n    } else {\n      controlsRight.appendChild(filter);\n    }\n  }\n  \n  /**\n   * Filter tasks by project\n   */\n  function filterTasksByProject(e) {\n    const selectedValue = e.target.value;\n    const taskCards = document.querySelectorAll('.uba-task-card, .uba-task-item');\n    \n    taskCards.forEach(card => {\n      const taskId = card.dataset.taskId || card.dataset.id;\n      if (!taskId) return;\n      \n      const store = window.ubaStore;\n      const task = store?.tasks?.get(taskId);\n      if (!task) return;\n      \n      let shouldShow = true;\n      \n      if (selectedValue === 'all') {\n        shouldShow = true;\n      } else if (selectedValue === 'unlinked') {\n        shouldShow = !task.project_id;\n      } else {\n        shouldShow = task.project_id === selectedValue;\n      }\n      \n      card.style.display = shouldShow ? '' : 'none';\n    });\n  }\n  \n  /**\n   * Filter invoices by project\n   */\n  function filterInvoicesByProject(e) {\n    const selectedValue = e.target.value;\n    const invoiceCards = document.querySelectorAll('.uba-invoice-card, .uba-invoice-item');\n    \n    invoiceCards.forEach(card => {\n      const invoiceId = card.dataset.invoiceId || card.dataset.id;\n      if (!invoiceId) return;\n      \n      const store = window.ubaStore;\n      const invoice = store?.invoices?.get(invoiceId);\n      if (!invoice) return;\n      \n      let shouldShow = true;\n      \n      if (selectedValue === 'all') {\n        shouldShow = true;\n      } else if (selectedValue === 'unlinked') {\n        shouldShow = !invoice.project_id;\n      } else {\n        shouldShow = invoice.project_id === selectedValue;\n      }\n      \n      card.style.display = shouldShow ? '' : 'none';\n    });\n  }\n  \n  /**\n   * Suggest project links for existing unlinked items\n   */\n  function suggestProjectLinks() {\n    const store = window.ubaStore;\n    if (!store) return [];\n    \n    const suggestions = [];\n    const projects = getProjects();\n    \n    if (projects.length === 0) return suggestions;\n    \n    // Check unlinked tasks\n    if (store.tasks) {\n      const unlinkedTasks = store.tasks.getAll().filter(t => !t.project_id);\n      unlinkedTasks.forEach(task => {\n        const match = findMatchingProject(task, projects);\n        if (match) {\n          suggestions.push({\n            type: 'task',\n            item: task,\n            project: match,\n            confidence: 'high'\n          });\n        }\n      });\n    }\n    \n    // Check unlinked invoices\n    if (store.invoices) {\n      const unlinkedInvoices = store.invoices.getAll().filter(i => !i.project_id);\n      unlinkedInvoices.forEach(invoice => {\n        const match = findMatchingProject(invoice, projects);\n        if (match) {\n          suggestions.push({\n            type: 'invoice',\n            item: invoice,\n            project: match,\n            confidence: 'high'\n          });\n        }\n      });\n    }\n    \n    return suggestions;\n  }\n  \n  /**\n   * Apply suggested project links\n   */\n  function applySuggestedLinks(suggestions) {\n    if (!suggestions || suggestions.length === 0) return;\n    \n    let applied = 0;\n    \n    suggestions.forEach(suggestion => {\n      const success = linkProjectToItem(\n        suggestion.project.id,\n        suggestion.type + 's',\n        suggestion.item.id\n      );\n      \n      if (success) {\n        applied++;\n      }\n    });\n    \n    if (applied > 0 && window.showToast) {\n      window.showToast(`Applied ${applied} suggested project links`, 'success');\n    }\n    \n    return applied;\n  }\n  \n  // Expose Project Linking API\n  window.UBAProjectLinking = {\n    init: initProjectLinking,\n    link: linkProjectToItem,\n    unlink: unlinkProjectFromItem,\n    getLinkedItems: getProjectLinkedItems,\n    getSummary: getProjectSummary,\n    suggestLinks: suggestProjectLinks,\n    applyLinks: applySuggestedLinks,\n    autoLink: autoLinkProjectToItem\n  };\n  \n  // Auto-initialize\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', initProjectLinking);\n  } else {\n    // Delay initialization to ensure store is ready\n    setTimeout(initProjectLinking, 200);\n  }\n  \n  console.log('✓ Project Linking module loaded');\n  \n})();