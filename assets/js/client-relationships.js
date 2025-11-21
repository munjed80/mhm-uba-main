// client-relationships.js — Cross-linking system for clients, projects, and invoices
(function() {
  'use strict';
  
  /**
   * Get all projects related to a client
   * @param {string} clientId - Client ID or name
   * @returns {Array} Array of related projects
   */
  function getClientProjects(clientId) {
    const store = window.ubaStore;
    if (!store || !store.projects) return [];
    
    const projects = store.projects.getAll();
    const clients = store.clients.getAll();
    
    // Find client by ID or name
    const client = clients.find(c => c.id === clientId || c.name === clientId);
    if (!client) return [];
    
    // Find projects that mention this client
    return projects.filter(project => {
      return (
        project.client_id === client.id ||
        project.client === client.name ||
        (project.name && project.name.toLowerCase().includes(client.name.toLowerCase())) ||
        (project.description && project.description.toLowerCase().includes(client.name.toLowerCase()))
      );
    });
  }
  
  /**
   * Get all invoices related to a client
   * @param {string} clientId - Client ID or name  
   * @returns {Array} Array of related invoices
   */
  function getClientInvoices(clientId) {
    const store = window.ubaStore;
    if (!store || !store.invoices) return [];
    
    const invoices = store.invoices.getAll();
    const clients = store.clients.getAll();
    
    // Find client by ID or name
    const client = clients.find(c => c.id === clientId || c.name === clientId);
    if (!client) return [];
    
    // Find invoices for this client
    return invoices.filter(invoice => {
      return (
        invoice.client_id === client.id ||
        invoice.client === client.name ||
        (invoice.client && invoice.client.toLowerCase().includes(client.name.toLowerCase()))
      );
    });
  }
  
  /**
   * Get client summary with financial and project data
   * @param {string} clientId - Client ID
   * @returns {Object} Client summary object
   */
  function getClientSummary(clientId) {
    const store = window.ubaStore;
    if (!store || !store.clients) return null;
    
    const client = store.clients.getAll().find(c => c.id === clientId);
    if (!client) return null;
    
    const projects = getClientProjects(clientId);
    const invoices = getClientInvoices(clientId);
    
    // Calculate financial metrics
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const unpaidInvoices = invoices.filter(inv => ['sent', 'draft', 'overdue'].includes(inv.status));
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    
    // Calculate project metrics
    const activeProjects = projects.filter(p => ['in_progress', 'ongoing'].includes(p.stage || p.status));
    const completedProjects = projects.filter(p => ['completed', 'done'].includes(p.stage || p.status));
    const leadProjects = projects.filter(p => p.stage === 'lead');
    
    // Calculate engagement metrics
    const lastInvoice = invoices
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
    const lastProject = projects
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
    
    const daysSinceLastInvoice = lastInvoice ? 
      Math.floor((Date.now() - new Date(lastInvoice.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null;
    const daysSinceLastProject = lastProject ?
      Math.floor((Date.now() - new Date(lastProject.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    return {
      client,
      projects,
      invoices,
      metrics: {
        totalInvoiced,
        totalPaid,
        totalUnpaid,
        invoiceCount: invoices.length,
        paidInvoiceCount: paidInvoices.length,
        unpaidInvoiceCount: unpaidInvoices.length,
        projectCount: projects.length,
        activeProjectCount: activeProjects.length,
        completedProjectCount: completedProjects.length,
        leadProjectCount: leadProjects.length,
        daysSinceLastInvoice,
        daysSinceLastProject
      },
      engagement: {
        level: calculateEngagementLevel(daysSinceLastInvoice, daysSinceLastProject, totalPaid),
        lastActivity: getLastActivity(lastInvoice, lastProject)
      }
    };
  }
  
  /**
   * Calculate client engagement level
   */
  function calculateEngagementLevel(daysSinceInvoice, daysSinceProject, totalPaid) {
    if (totalPaid > 10000 && (daysSinceInvoice < 30 || daysSinceProject < 30)) {
      return 'high';
    }
    if (totalPaid > 1000 && (daysSinceInvoice < 90 || daysSinceProject < 90)) {
      return 'medium';
    }
    if (daysSinceInvoice > 180 && daysSinceProject > 180) {
      return 'low';
    }
    return 'medium';
  }
  
  /**
   * Get last activity description
   */
  function getLastActivity(lastInvoice, lastProject) {
    const invoiceDate = lastInvoice ? new Date(lastInvoice.created_at) : null;
    const projectDate = lastProject ? new Date(lastProject.created_at) : null;
    
    if (!invoiceDate && !projectDate) {
      return 'No recent activity';
    }
    
    if (!projectDate || (invoiceDate && invoiceDate > projectDate)) {
      const days = Math.floor((Date.now() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      return `Invoice \"${lastInvoice.label || 'Untitled'}\" ${days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}`;
    } else {
      const days = Math.floor((Date.now() - projectDate.getTime()) / (1000 * 60 * 60 * 24));
      return `Project \"${lastProject.name || 'Untitled'}\" ${days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}`;
    }
  }
  
  /**
   * Create or update relationships when creating/editing records
   */
  function updateClientRelationships(clientId, projectIds = [], invoiceIds = []) {
    const store = window.ubaStore;
    if (!store) return;
    
    // Update projects to reference client
    if (store.projects && projectIds.length > 0) {
      projectIds.forEach(projectId => {
        const project = store.projects.getAll().find(p => p.id === projectId);
        if (project && !project.client_id) {
          store.projects.update(projectId, { ...project, client_id: clientId });
        }
      });
    }
    
    // Update invoices to reference client
    if (store.invoices && invoiceIds.length > 0) {
      invoiceIds.forEach(invoiceId => {
        const invoice = store.invoices.getAll().find(i => i.id === invoiceId);
        if (invoice && !invoice.client_id) {
          store.invoices.update(invoiceId, { ...invoice, client_id: clientId });
        }
      });
    }
  }
  
  /**
   * Find orphaned projects and invoices (not linked to any client)
   */
  function findOrphanedRecords() {
    const store = window.ubaStore;
    if (!store) return { projects: [], invoices: [] };
    
    const clients = store.clients ? store.clients.getAll() : [];
    const clientNames = clients.map(c => c.name.toLowerCase());
    const clientIds = clients.map(c => c.id);
    
    const orphanedProjects = [];
    const orphanedInvoices = [];
    
    // Find projects without client linkage
    if (store.projects) {
      const projects = store.projects.getAll();
      projects.forEach(project => {
        const hasClientId = project.client_id && clientIds.includes(project.client_id);
        const hasClientName = project.client && clientNames.includes(project.client.toLowerCase());
        
        if (!hasClientId && !hasClientName) {
          orphanedProjects.push(project);
        }
      });
    }
    
    // Find invoices without client linkage
    if (store.invoices) {
      const invoices = store.invoices.getAll();
      invoices.forEach(invoice => {
        const hasClientId = invoice.client_id && clientIds.includes(invoice.client_id);
        const hasClientName = invoice.client && clientNames.includes(invoice.client.toLowerCase());
        
        if (!hasClientId && !hasClientName) {
          orphanedInvoices.push(invoice);
        }
      });
    }
    
    return {
      projects: orphanedProjects,
      invoices: orphanedInvoices
    };
  }
  
  /**
   * Suggest client matches for orphaned records
   */
  function suggestClientMatches(orphanedRecord, recordType) {
    const store = window.ubaStore;
    if (!store || !store.clients) return [];
    
    const clients = store.clients.getAll();
    const suggestions = [];
    
    const recordText = (
      orphanedRecord.name || 
      orphanedRecord.label || 
      orphanedRecord.client || 
      orphanedRecord.description || 
      ''
    ).toLowerCase();
    
    clients.forEach(client => {
      let score = 0;
      const clientName = client.name.toLowerCase();
      const clientCompany = (client.company || '').toLowerCase();
      
      // Exact name match
      if (recordText.includes(clientName)) {
        score += 10;
      }
      
      // Exact company match
      if (clientCompany && recordText.includes(clientCompany)) {
        score += 8;
      }
      
      // Partial name match
      const nameWords = clientName.split(' ');
      nameWords.forEach(word => {
        if (word.length > 2 && recordText.includes(word)) {
          score += 3;
        }
      });
      
      // Email domain match (for invoices)
      if (recordType === 'invoice' && orphanedRecord.client && client.email) {
        const recordDomain = orphanedRecord.client.split('@')[1];
        const clientDomain = client.email.split('@')[1];
        if (recordDomain && clientDomain && recordDomain === clientDomain) {
          score += 7;
        }
      }
      
      if (score > 0) {
        suggestions.push({
          client,
          score,
          confidence: score > 8 ? 'high' : score > 5 ? 'medium' : 'low'
        });
      }
    });
    
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 3);
  }
  
  /**
   * Auto-link records to clients based on suggestions
   */
  function autoLinkRecords(threshold = 8) {
    const orphaned = findOrphanedRecords();
    const linked = {
      projects: 0,
      invoices: 0,
      suggestions: []
    };
    
    const store = window.ubaStore;
    if (!store) return linked;
    
    // Auto-link high-confidence projects
    orphaned.projects.forEach(project => {
      const suggestions = suggestClientMatches(project, 'project');
      if (suggestions.length > 0 && suggestions[0].score >= threshold) {
        const client = suggestions[0].client;
        if (store.projects) {
          store.projects.update(project.id, { ...project, client_id: client.id, client: client.name });
          linked.projects++;
        }
      } else if (suggestions.length > 0) {
        linked.suggestions.push({
          type: 'project',
          record: project,
          suggestions: suggestions
        });
      }
    });
    
    // Auto-link high-confidence invoices
    orphaned.invoices.forEach(invoice => {
      const suggestions = suggestClientMatches(invoice, 'invoice');
      if (suggestions.length > 0 && suggestions[0].score >= threshold) {
        const client = suggestions[0].client;
        if (store.invoices) {
          store.invoices.update(invoice.id, { ...invoice, client_id: client.id, client: client.name });
          linked.invoices++;
        }
      } else if (suggestions.length > 0) {
        linked.suggestions.push({
          type: 'invoice',
          record: invoice,
          suggestions: suggestions
        });
      }
    });
    
    return linked;
  }
  
  /**
   * Format currency for display
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }
  
  /**
   * Show client details with relationships
   */
  function showClientDetails(clientId) {
    const summary = getClientSummary(clientId);
    if (!summary) return;
    
    const modal = document.getElementById('client-details-modal');
    const title = document.getElementById('client-details-title');
    const basicInfo = document.getElementById('client-basic-info');
    const customInfo = document.getElementById('client-custom-info');
    const relationships = document.getElementById('client-relationships');
    const relatedProjects = document.getElementById('related-projects');
    const relatedInvoices = document.getElementById('related-invoices');
    
    if (!modal) return;
    
    // Set title
    if (title) {
      title.textContent = summary.client.name;
    }
    
    // Basic info
    if (basicInfo) {
      basicInfo.innerHTML = `
        <h4>Contact Information</h4>
        <div class=\"uba-client-info-grid\">
          <div><strong>Email:</strong> ${summary.client.email || 'Not provided'}</div>
          <div><strong>Phone:</strong> ${summary.client.phone || 'Not provided'}</div>
          <div><strong>Company:</strong> ${summary.client.company || 'Not provided'}</div>
          <div><strong>Notes:</strong> ${summary.client.notes || 'No notes'}</div>
        </div>
        <div class=\"uba-client-metrics\">
          <div class=\"uba-metric\">
            <span class=\"uba-metric-label\">Total Revenue:</span>
            <span class=\"uba-metric-value\">${formatCurrency(summary.metrics.totalPaid)}</span>
          </div>
          <div class=\"uba-metric\">
            <span class=\"uba-metric-label\">Unpaid Amount:</span>
            <span class=\"uba-metric-value\">${formatCurrency(summary.metrics.totalUnpaid)}</span>
          </div>
          <div class=\"uba-metric\">
            <span class=\"uba-metric-label\">Engagement:</span>
            <span class=\"uba-metric-value uba-engagement-${summary.engagement.level}\">${summary.engagement.level}</span>
          </div>
        </div>
      `;
    }
    
    // Related projects
    if (relatedProjects) {
      if (summary.projects.length === 0) {
        relatedProjects.innerHTML = '<p class=\"uba-empty-state\">No related projects found</p>';
      } else {
        relatedProjects.innerHTML = summary.projects.map(project => `
          <div class=\"uba-related-item\">
            <div>
              <strong>${project.name || 'Untitled Project'}</strong>
              <br><small>Stage: ${project.stage || project.status || 'Unknown'}</small>
            </div>
            <div class=\"uba-item-actions\">
              <button class=\"uba-btn-sm uba-btn-ghost\" onclick=\"viewProject('${project.id}')\">View</button>
            </div>
          </div>
        `).join('');
      }
    }
    
    // Related invoices
    if (relatedInvoices) {
      if (summary.invoices.length === 0) {
        relatedInvoices.innerHTML = '<p class=\"uba-empty-state\">No related invoices found</p>';
      } else {
        relatedInvoices.innerHTML = summary.invoices.map(invoice => `
          <div class=\"uba-related-item\">
            <div>
              <strong>${invoice.label || 'Invoice'} - ${formatCurrency(invoice.amount)}</strong>
              <br><small>Status: <span class=\"uba-status uba-status-${invoice.status}\">${invoice.status}</span></small>
            </div>
            <div class=\"uba-item-actions\">
              <button class=\"uba-btn-sm uba-btn-ghost\" onclick=\"viewInvoice('${invoice.id}')\">View</button>
            </div>
          </div>
        `).join('');
      }
    }
    
    // Show modal
    modal.style.display = 'block';
  }
  
  // Expose client relationships API
  window.UBAClientRelationships = {
    getClientProjects,
    getClientInvoices,
    getClientSummary,
    updateClientRelationships,
    findOrphanedRecords,
    suggestClientMatches,
    autoLinkRecords,
    showClientDetails
  };
  
  console.log('✓ Client Relationships module loaded');
  
})();