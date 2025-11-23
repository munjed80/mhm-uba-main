// enhanced-leads.js - Advanced Lead Management System with Scoring, Contact Logs, and Project Integration
(function() {
  'use strict';
  
  /**
   * Enhanced Leads System - Advanced Lead Management
   * Features: Lead scoring (0-100), Contact logging, Project integration, Enhanced table views
   */
  window.UBAEnhancedLeads = {
    
    // State management
    leads: [],
    contactLogs: [],
    leadScoreConfig: {},
    projects: [],
    
    /**
     * Initialize enhanced leads system
     */
    init() {
      console.log('🧲 Initializing Enhanced Leads System');
      
      this.loadLeadsData();
      this.setupLeadScoring();
      this.setupContactLogging();
      this.setupProjectIntegration();
      this.enhanceTableView();
      this.initializeUI();
      
      console.log('✅ Enhanced Leads System initialized');
    },
    
    /**
     * Load leads data and enhance with scoring
     */
    loadLeadsData() {
      try {
        // Load existing leads
        this.leads = window.ubaStore?.leads?.getAll() || this.getDemoLeads();
        
        // Load contact logs
        const savedLogs = localStorage.getItem('uba-contact-logs');
        this.contactLogs = savedLogs ? JSON.parse(savedLogs) : [];
        
        // Load lead score configuration
        this.loadScoreConfiguration();
        
        console.log('✅ Leads data loaded');
      } catch (error) {
        console.warn('⚠️ Failed to load leads data:', error);
        this.leads = this.getDemoLeads();
      }
    },
    
    /**
     * Setup lead scoring system
     */
    setupLeadScoring() {
      console.log('🎯 Setting up lead scoring system');
      
      // Add scoring section to leads page
      this.addScoringInterface();
      
      // Calculate scores for existing leads
      this.calculateAllLeadScores();
    },
    
    /**
     * Load score configuration
     */
    loadScoreConfiguration() {
      const saved = localStorage.getItem('uba-lead-score-config');
      this.leadScoreConfig = saved ? JSON.parse(saved) : this.getDefaultScoreConfig();
    },
    
    /**
     * Get default scoring configuration
     */
    getDefaultScoreConfig() {
      return {
        engagement: {
          weight: 25,
          criteria: {
            'initial_contact': 10,
            'responded_quickly': 15,
            'multiple_touchpoints': 20,
            'requested_demo': 25,
            'scheduled_meeting': 30
          }
        },
        company: {
          weight: 20,
          criteria: {
            'startup': 10,
            'small_business': 15,
            'medium_business': 20,
            'enterprise': 25,
            'fortune_500': 30
          }
        },
        budget: {
          weight: 25,
          criteria: {
            'under_1k': 5,
            '1k_5k': 10,
            '5k_15k': 15,
            '15k_50k': 20,
            'over_50k': 25
          }
        },
        timeline: {
          weight: 15,
          criteria: {
            'immediate': 25,
            'this_quarter': 20,
            'next_quarter': 15,
            'this_year': 10,
            'no_timeline': 5
          }
        },
        authority: {
          weight: 15,
          criteria: {
            'decision_maker': 25,
            'influencer': 20,
            'recommender': 15,
            'evaluator': 10,
            'end_user': 5
          }
        }
      };
    },
    
    /**
     * Add scoring interface to leads page
     */
    addScoringInterface() {
      const leadsPage = document.querySelector('#leads-page');
      if (!leadsPage) return;
      
      // Add scoring overview section
      const scoringOverview = document.createElement('div');
      scoringOverview.className = 'scoring-overview';
      scoringOverview.innerHTML = `
        <div class=\"uba-card scoring-card\">
          <div class=\"uba-card-header\">
            <div>
              <div class=\"uba-card-title\">🎯 Lead Scoring Overview</div>
              <p class=\"uba-card-sub\">Intelligent lead prioritization system</p>
            </div>
            <div class=\"scoring-actions\">
              <button class=\"uba-btn uba-btn-ghost\" onclick=\"window.UBAEnhancedLeads.openScoreConfig()\">Configure Scoring</button>
              <button class=\"uba-btn uba-btn-primary\" onclick=\"window.UBAEnhancedLeads.recalculateAllScores()\">Recalculate All</button>
            </div>
          </div>
          <div class=\"scoring-metrics\">
            <div class=\"score-metric\">
              <div class=\"score-value\" id=\"avg-lead-score\">0</div>
              <div class=\"score-label\">Avg Score</div>
            </div>
            <div class=\"score-metric\">
              <div class=\"score-value\" id=\"high-quality-leads\">0</div>
              <div class=\"score-label\">High Quality (80+)</div>
            </div>
            <div class=\"score-metric\">
              <div class=\"score-value\" id=\"medium-quality-leads\">0</div>
              <div class=\"score-label\">Medium Quality (50-79)</div>
            </div>
            <div class=\"score-metric\">
              <div class=\"score-value\" id=\"low-quality-leads\">0</div>
              <div class=\"score-label\">Low Quality (<50)</div>
            </div>
          </div>
        </div>
      `;
      
      // Insert before the main leads table
      const leadsTable = leadsPage.querySelector('.uba-card');
      if (leadsTable) {
        leadsPage.insertBefore(scoringOverview, leadsTable);
      }
      
      // Create score configuration modal
      this.createScoreConfigModal();
    },
    
    /**
     * Create score configuration modal
     */
    createScoreConfigModal() {
      const modal = document.createElement('div');
      modal.id = 'score-config-modal';
      modal.className = 'uba-modal score-config-modal';
      modal.style.display = 'none'; // Hide by default
      modal.innerHTML = `
        <div class=\"uba-modal-overlay\" onclick=\"window.UBAEnhancedLeads.closeScoreConfig()\"></div>
        <div class=\"uba-modal-dialog score-config-dialog\">
          <div class=\"uba-modal-header\">
            <h3>🎯 Lead Scoring Configuration</h3>
            <button class=\"uba-modal-close\" onclick=\"window.UBAEnhancedLeads.closeScoreConfig()\">×</button>
          </div>
          <div class=\"uba-modal-body\">
            <div class=\"scoring-categories\">
              <!-- Dynamic scoring categories will be rendered here -->
            </div>
            <div class=\"scoring-preview\">
              <h4>Preview Score Calculation</h4>
              <div class=\"score-preview-content\">
                <div class=\"preview-lead-score\">85</div>
                <div class=\"preview-breakdown\">
                  <!-- Score breakdown will be shown here -->
                </div>
              </div>
            </div>
          </div>
          <div class=\"uba-modal-footer\">
            <button class=\"uba-btn uba-btn-ghost\" onclick=\"window.UBAEnhancedLeads.resetScoreConfig()\">Reset to Default</button>
            <button class=\"uba-btn uba-btn-primary\" onclick=\"window.UBAEnhancedLeads.saveScoreConfig()\">Save Configuration</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    },
    
    /**
     * Calculate lead score
     */
    calculateLeadScore(lead) {
      let totalScore = 0;
      
      for (const [category, config] of Object.entries(this.leadScoreConfig)) {
        const categoryScore = this.calculateCategoryScore(lead, category, config);
        const weightedScore = (categoryScore * config.weight) / 100;
        totalScore += weightedScore;
      }
      
      return Math.min(Math.round(totalScore), 100);
    },
    
    /**
     * Calculate category score
     */
    calculateCategoryScore(lead, category, config) {
      const leadValue = lead.scoring?.[category] || this.inferCategoryValue(lead, category);
      return config.criteria[leadValue] || 0;
    },
    
    /**
     * Infer category value from lead data
     */
    inferCategoryValue(lead, category) {
      switch (category) {
        case 'budget':
          if (lead.budget) {
            if (lead.budget < 1000) return 'under_1k';
            if (lead.budget < 5000) return '1k_5k';
            if (lead.budget < 15000) return '5k_15k';
            if (lead.budget < 50000) return '15k_50k';
            return 'over_50k';
          }
          return 'under_1k';
          
        case 'company':
          if (lead.companySize) {
            if (lead.companySize === 'Enterprise') return 'enterprise';
            if (lead.companySize === 'Medium') return 'medium_business';
            if (lead.companySize === 'Small') return 'small_business';
          }
          return 'startup';
          
        case 'timeline':
          if (lead.timeline) {
            if (lead.timeline.includes('immediate')) return 'immediate';
            if (lead.timeline.includes('quarter')) return 'this_quarter';
            if (lead.timeline.includes('year')) return 'this_year';
          }
          return 'no_timeline';
          
        default:
          return Object.keys(this.leadScoreConfig[category]?.criteria || {})[0] || '';
      }
    },
    
    /**
     * Calculate all lead scores
     */
    calculateAllLeadScores() {
      this.leads.forEach(lead => {
        lead.score = this.calculateLeadScore(lead);
        lead.scoreUpdated = new Date().toISOString();
      });
      
      // Update scoring metrics
      this.updateScoringMetrics();
    },
    
    /**
     * Update scoring metrics display
     */
    updateScoringMetrics() {
      const scores = this.leads.map(lead => lead.score || 0).filter(score => score > 0);
      
      if (scores.length === 0) return;
      
      const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      const highQuality = scores.filter(score => score >= 80).length;
      const mediumQuality = scores.filter(score => score >= 50 && score < 80).length;
      const lowQuality = scores.filter(score => score < 50).length;
      
      // Update UI
      this.updateElement('avg-lead-score', avgScore);
      this.updateElement('high-quality-leads', highQuality);
      this.updateElement('medium-quality-leads', mediumQuality);
      this.updateElement('low-quality-leads', lowQuality);
    },
    
    /**
     * Setup contact logging system
     */
    setupContactLogging() {
      console.log('💬 Setting up contact logging system');
      
      // Add contact log interface to lead details
      this.enhanceLeadDetailsWithLogs();
    },
    
    /**
     * Enhance lead details with contact logs
     */
    enhanceLeadDetailsWithLogs() {
      // This will be added to the lead modal when opened
      // We'll inject the contact log section dynamically
    },
    
    /**
     * Add contact log section to lead modal
     */
    addContactLogToModal(leadId) {
      const modal = document.getElementById('lead-modal');
      if (!modal) return;
      
      // Check if contact log section already exists
      if (modal.querySelector('.contact-log-section')) return;
      
      const modalBody = modal.querySelector('.uba-modal-body');
      if (!modalBody) return;
      
      const contactLogSection = document.createElement('div');
      contactLogSection.className = 'contact-log-section';
      contactLogSection.innerHTML = `
        <div class=\"contact-log-tabs\">
          <button class=\"log-tab active\" data-tab=\"timeline\">📋 Timeline</button>
          <button class=\"log-tab\" data-tab=\"conversations\">💬 Conversations</button>
          <button class=\"log-tab\" data-tab=\"notes\">📝 Notes</button>
          <button class=\"log-tab\" data-tab=\"activities\">🎯 Activities</button>
        </div>
        
        <div class=\"contact-log-content\">
          <!-- Timeline Tab -->
          <div class=\"log-tab-content active\" data-tab=\"timeline\">
            <div class=\"timeline-header\">
              <h4>محادثات – ملاحظات – نشاط (Contact Timeline)</h4>
              <button class=\"uba-btn uba-btn-sm uba-btn-primary\" onclick=\"window.UBAEnhancedLeads.addTimelineEntry('${leadId}')\">
                + Add Entry
              </button>
            </div>
            <div id=\"timeline-${leadId}\" class=\"contact-timeline\">
              <!-- Timeline entries will be rendered here -->
            </div>
          </div>
          
          <!-- Conversations Tab -->
          <div class=\"log-tab-content\" data-tab=\"conversations\">
            <div class=\"conversations-header\">
              <h4>Conversation History</h4>
              <button class=\"uba-btn uba-btn-sm uba-btn-primary\" onclick=\"window.UBAEnhancedLeads.addConversation('${leadId}')\">
                + New Conversation
              </button>
            </div>
            <div id=\"conversations-${leadId}\" class=\"conversations-list\">
              <!-- Conversations will be rendered here -->
            </div>
          </div>
          
          <!-- Notes Tab -->
          <div class=\"log-tab-content\" data-tab=\"notes\">
            <div class=\"notes-header\">
              <h4>Internal Notes</h4>
              <button class=\"uba-btn uba-btn-sm uba-btn-primary\" onclick=\"window.UBAEnhancedLeads.addNote('${leadId}')\">
                + Add Note
              </button>
            </div>
            <div id=\"notes-${leadId}\" class=\"notes-list\">
              <!-- Notes will be rendered here -->
            </div>
          </div>
          
          <!-- Activities Tab -->
          <div class=\"log-tab-content\" data-tab=\"activities\">
            <div class=\"activities-header\">
              <h4>Activities & Follow-ups</h4>
              <button class=\"uba-btn uba-btn-sm uba-btn-primary\" onclick=\"window.UBAEnhancedLeads.scheduleActivity('${leadId}')\">
                + Schedule Activity
              </button>
            </div>
            <div id=\"activities-${leadId}\" class=\"activities-list\">
              <!-- Activities will be rendered here -->
            </div>
          </div>
        </div>
      `;
      
      modalBody.appendChild(contactLogSection);
      
      // Setup tab switching
      this.setupContactLogTabs();
      
      // Render existing logs
      this.renderContactLogs(leadId);
    },
    
    /**
     * Setup contact log tabs
     */
    setupContactLogTabs() {
      const tabs = document.querySelectorAll('.log-tab');
      const contents = document.querySelectorAll('.log-tab-content');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetTab = tab.getAttribute('data-tab');
          
          // Update tab states
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Update content states
          contents.forEach(content => {
            content.classList.remove('active');
            if (content.getAttribute('data-tab') === targetTab) {
              content.classList.add('active');
            }
          });
        });
      });
    },
    
    /**
     * Add timeline entry
     */
    addTimelineEntry(leadId) {
      const entry = {
        id: 'timeline-' + Date.now(),
        leadId: leadId,
        type: 'timeline',
        timestamp: new Date().toISOString(),
        title: prompt('Enter timeline entry title:'),
        description: prompt('Enter description (optional):') || '',
        category: 'general'
      };
      
      if (entry.title) {
        this.contactLogs.push(entry);
        this.saveContactLogs();
        this.renderContactLogs(leadId);
      }
    },
    
    /**
     * Add conversation
     */
    addConversation(leadId) {
      const conversation = {
        id: 'conv-' + Date.now(),
        leadId: leadId,
        type: 'conversation',
        timestamp: new Date().toISOString(),
        medium: prompt('Communication medium (email, phone, meeting):') || 'email',
        summary: prompt('Conversation summary:'),
        outcome: prompt('Outcome/Next steps:') || '',
        participants: ['User'] // Could be enhanced to include multiple participants
      };
      
      if (conversation.summary) {
        this.contactLogs.push(conversation);
        this.saveContactLogs();
        this.renderContactLogs(leadId);
      }
    },
    
    /**
     * Add note
     */
    addNote(leadId) {
      const note = {
        id: 'note-' + Date.now(),
        leadId: leadId,
        type: 'note',
        timestamp: new Date().toISOString(),
        content: prompt('Enter note content:'),
        category: prompt('Note category (research, follow-up, technical):') || 'general',
        private: confirm('Make this note private (internal only)?')
      };
      
      if (note.content) {
        this.contactLogs.push(note);
        this.saveContactLogs();
        this.renderContactLogs(leadId);
      }
    },
    
    /**
     * Schedule activity
     */
    scheduleActivity(leadId) {
      const activity = {
        id: 'activity-' + Date.now(),
        leadId: leadId,
        type: 'activity',
        timestamp: new Date().toISOString(),
        activityType: prompt('Activity type (call, demo, meeting, proposal):') || 'call',
        title: prompt('Activity title:'),
        scheduledFor: prompt('Schedule for (YYYY-MM-DD HH:MM):'),
        description: prompt('Activity description:') || '',
        status: 'scheduled'
      };
      
      if (activity.title) {
        this.contactLogs.push(activity);
        this.saveContactLogs();
        this.renderContactLogs(leadId);
      }
    },
    
    /**
     * Render contact logs for a specific lead
     */
    renderContactLogs(leadId) {
      const leadLogs = this.contactLogs.filter(log => log.leadId === leadId);
      
      // Render timeline
      this.renderTimeline(leadId, leadLogs);
      
      // Render conversations
      this.renderConversations(leadId, leadLogs.filter(log => log.type === 'conversation'));
      
      // Render notes
      this.renderNotes(leadId, leadLogs.filter(log => log.type === 'note'));
      
      // Render activities
      this.renderActivities(leadId, leadLogs.filter(log => log.type === 'activity'));
    },
    
    /**
     * Render timeline
     */
    renderTimeline(leadId, logs) {
      const timeline = document.getElementById(`timeline-${leadId}`);
      if (!timeline) return;
      
      const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      timeline.innerHTML = sortedLogs.map(log => {
        const date = new Date(log.timestamp).toLocaleDateString();
        const time = new Date(log.timestamp).toLocaleTimeString();
        const icon = this.getLogIcon(log.type);
        
        return `
          <div class=\"timeline-entry ${log.type}\">
            <div class=\"timeline-marker\">${icon}</div>
            <div class=\"timeline-content\">
              <div class=\"timeline-header\">
                <strong>${log.title || log.summary || log.content || 'Activity'}</strong>
                <span class=\"timeline-time\">${date} ${time}</span>
              </div>
              ${log.description || log.outcome || log.category ? `
                <div class=\"timeline-details\">
                  ${log.description || log.outcome || log.category}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    },
    
    /**
     * HTML escape utility
     */
    escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    /**
     * Render conversations
     */
    renderConversations(leadId, conversations) {
      const container = document.getElementById(`conversations-${leadId}`);
      if (!container) return;
      
      if (conversations.length === 0) {
        container.innerHTML = '<p class="uba-empty-state">No conversations yet</p>';
        return;
      }
      
      container.innerHTML = conversations.map(conv => `
        <div class="conversation-item">
          <div class="conversation-header">
            <strong>${this.escapeHtml(conv.medium || 'Contact')}</strong>
            <span>${new Date(conv.timestamp).toLocaleDateString()}</span>
          </div>
          <div class="conversation-summary">${this.escapeHtml(conv.summary || '')}</div>
        </div>
      `).join('');
    },
    
    /**
     * Render notes
     */
    renderNotes(leadId, notes) {
      const container = document.getElementById(`notes-${leadId}`);
      if (!container) return;
      
      if (notes.length === 0) {
        container.innerHTML = '<p class="uba-empty-state">No notes yet</p>';
        return;
      }
      
      container.innerHTML = notes.map(note => `
        <div class="note-item">
          <div class="note-header">
            <span class="note-category">${this.escapeHtml(note.category || 'General')}</span>
            <span>${new Date(note.timestamp).toLocaleDateString()}</span>
          </div>
          <div class="note-content">${this.escapeHtml(note.content || '')}</div>
        </div>
      `).join('');
    },
    
    /**
     * Render activities
     */
    renderActivities(leadId, activities) {
      const container = document.getElementById(`activities-${leadId}`);
      if (!container) return;
      
      if (activities.length === 0) {
        container.innerHTML = '<p class="uba-empty-state">No activities scheduled</p>';
        return;
      }
      
      container.innerHTML = activities.map(activity => `
        <div class="activity-item">
          <div class="activity-header">
            <strong>${this.escapeHtml(activity.activityType || 'Activity')}: ${this.escapeHtml(activity.title || '')}</strong>
            <span class="activity-status">${this.escapeHtml(activity.status || 'scheduled')}</span>
          </div>
          <div class="activity-details">
            ${activity.scheduledFor ? `<div>Scheduled: ${this.escapeHtml(activity.scheduledFor)}</div>` : ''}
            ${activity.description ? `<div>${this.escapeHtml(activity.description)}</div>` : ''}
          </div>
        </div>
      `).join('');
    },
    
    /**
     * Get icon for log type
     */
    getLogIcon(type) {
      const icons = {
        'timeline': '📋',
        'conversation': '💬',
        'note': '📝',
        'activity': '🎯'
      };
      return icons[type] || '📌';
    },
    
    /**
     * Save contact logs to localStorage
     */
    saveContactLogs() {
      try {
        localStorage.setItem('uba-contact-logs', JSON.stringify(this.contactLogs));
      } catch (error) {
        console.error('❌ Failed to save contact logs:', error);
      }
    },
    
    /**
     * Setup project integration
     */
    setupProjectIntegration() {
      console.log('🔗 Setting up project integration');
      
      // Add project conversion functionality
      this.addProjectConversionInterface();
      
      // Load existing projects for linking
      this.loadProjectsData();
    },
    
    /**
     * Add project conversion interface
     */
    addProjectConversionInterface() {
      // This will be added to lead modal and table actions
      // Enhanced when lead modal is opened
    },
    
    /**
     * Convert lead to project
     */
    convertLeadToProject(leadId) {
      const lead = this.leads.find(l => l.id === leadId);
      if (!lead) return;
      
      const project = {
        id: 'proj-' + Date.now(),
        name: lead.company + ' Project',
        client: lead.name,
        clientCompany: lead.company,
        email: lead.email,
        phone: lead.phone,
        description: `Project converted from lead: ${lead.description || 'No description'}`,
        stage: 'planning',
        status: 'active',
        budget: lead.budget || 0,
        startDate: new Date().toISOString().slice(0, 10),
        priority: this.getProjectPriority(lead.score),
        leadId: leadId,
        createdAt: new Date().toISOString(),
        tags: ['converted-from-lead']
      };
      
      // Save project
      if (window.ubaStore?.projects) {
        window.ubaStore.projects.create(project);
      }
      
      // Update lead status
      lead.status = 'converted';
      lead.projectId = project.id;
      lead.convertedAt = new Date().toISOString();
      
      // Add conversion log
      this.contactLogs.push({
        id: 'conv-log-' + Date.now(),
        leadId: leadId,
        type: 'timeline',
        timestamp: new Date().toISOString(),
        title: 'Lead converted to project',
        description: `Project \"${project.name}\" created`,
        category: 'conversion'
      });
      
      this.saveContactLogs();
      
      this.showNotification(`Lead successfully converted to project: \"${project.name}\"`, 'success');
      
      // Offer to navigate to projects
      if (confirm('Would you like to view the new project?')) {
        window.location.href = `projects.html?id=${project.id}`;
      }
    },
    
    /**
     * Get project priority based on lead score
     */
    getProjectPriority(score) {
      if (score >= 80) return 'high';
      if (score >= 60) return 'medium';
      return 'low';
    },
    
    /**
     * Enhance table view
     */
    enhanceTableView() {
      console.log('📊 Enhancing table view');
      
      // Add advanced filtering and sorting
      this.addAdvancedFilters();
      
      // Add bulk actions
      this.addBulkActions();
      
      // Enhance table columns
      this.enhanceTableColumns();
      
      // Add export functionality
      this.addExportFunctionality();
    },
    
    /**
     * Add advanced filters
     */
    addAdvancedFilters() {
      const leadsCard = document.querySelector('#leads-page .uba-card');
      if (!leadsCard) return;
      
      const filtersSection = document.createElement('div');
      filtersSection.className = 'leads-filters';
      filtersSection.innerHTML = `
        <div class=\"filters-row\">
          <div class=\"filter-group\">
            <label>Score Range</label>
            <select id=\"score-filter\" class=\"uba-select enhanced-dropdown\">
              <option value=\"\">All Scores</option>
              <option value=\"high\">High (80-100)</option>
              <option value=\"medium\">Medium (50-79)</option>
              <option value=\"low\">Low (0-49)</option>
            </select>
          </div>
          
          <div class=\"filter-group\">
            <label>Status</label>
            <select id=\"status-filter\" class=\"uba-select enhanced-dropdown\">
              <option value=\"\">All Statuses</option>
              <option value=\"new\">New</option>
              <option value=\"contacted\">Contacted</option>
              <option value=\"qualified\">Qualified</option>
              <option value=\"proposal\">Proposal</option>
              <option value=\"negotiation\">Negotiation</option>
              <option value=\"won\">Won</option>
              <option value=\"lost\">Lost</option>
              <option value=\"converted\">Converted</option>
            </select>
          </div>
          
          <div class=\"filter-group\">
            <label>Source</label>
            <select id=\"source-filter\" class=\"uba-select enhanced-dropdown\">
              <option value=\"\">All Sources</option>
              <option value=\"website\">Website</option>
              <option value=\"referral\">Referral</option>
              <option value=\"social\">Social Media</option>
              <option value=\"email\">Email Campaign</option>
              <option value=\"event\">Event/Conference</option>
              <option value=\"cold_call\">Cold Call</option>
              <option value=\"other\">Other</option>
            </select>
          </div>
          
          <div class=\"filter-group\">
            <label>Date Range</label>
            <select id=\"date-filter\" class=\"uba-select enhanced-dropdown\">
              <option value=\"\">All Time</option>
              <option value=\"today\">Today</option>
              <option value=\"week\">This Week</option>
              <option value=\"month\">This Month</option>
              <option value=\"quarter\">This Quarter</option>
            </select>
          </div>
          
          <div class=\"filter-actions\">
            <button class=\"uba-btn uba-btn-ghost\" onclick=\"window.UBAEnhancedLeads.clearFilters()\">Clear</button>
            <button class=\"uba-btn uba-btn-primary\" onclick=\"window.UBAEnhancedLeads.applyFilters()\">Apply Filters</button>
          </div>
        </div>
      `;
      
      // Insert after card header
      const cardBody = leadsCard.querySelector('.uba-card-body') || leadsCard;
      cardBody.insertBefore(filtersSection, cardBody.firstChild);
    },
    
    /**
     * Add bulk actions
     */
    addBulkActions() {
      const leadsTable = document.querySelector('#leads-table');
      if (!leadsTable) return;
      
      // Add checkbox column to table header
      const thead = leadsTable.querySelector('thead tr');
      if (thead) {
        const checkboxTh = document.createElement('th');
        checkboxTh.innerHTML = '<input type=\"checkbox\" id=\"select-all-leads\" onchange=\"window.UBAEnhancedLeads.toggleSelectAll()\" />';
        thead.insertBefore(checkboxTh, thead.firstChild);
      }
      
      // Add bulk actions bar
      const bulkActions = document.createElement('div');
      bulkActions.id = 'bulk-actions-bar';
      bulkActions.className = 'bulk-actions-bar hidden';
      bulkActions.innerHTML = `
        <div class=\"bulk-actions-content\">
          <span class=\"selected-count\">0 leads selected</span>
          <div class=\"bulk-action-buttons\">
            <button class=\"uba-btn uba-btn-sm uba-btn-ghost\" onclick=\"window.UBAEnhancedLeads.bulkUpdateStatus()\">Update Status</button>
            <button class=\"uba-btn uba-btn-sm uba-btn-ghost\" onclick=\"window.UBAEnhancedLeads.bulkAssignOwner()\">Assign Owner</button>
            <button class=\"uba-btn uba-btn-sm uba-btn-primary\" onclick=\"window.UBAEnhancedLeads.bulkConvertToProjects()\">Convert to Projects</button>
            <button class=\"uba-btn uba-btn-sm uba-btn-danger\" onclick=\"window.UBAEnhancedLeads.bulkDelete()\">Delete</button>
          </div>
          <button class=\"close-bulk-actions\" onclick=\"window.UBAEnhancedLeads.clearSelection()\">×</button>
        </div>
      `;
      
      leadsTable.parentNode.insertBefore(bulkActions, leadsTable);
    },
    
    /**
     * Enhance table columns with score display
     */
    enhanceTableColumns() {
      // This will be done when rendering the table
      // Add score column, improve status display, add action buttons
    },
    
    /**
     * Add export functionality
     */
    addExportFunctionality() {
      // Stub implementation - export functionality not yet implemented
      // This prevents the initialization error
      console.log('Export functionality placeholder');
    },
    
    /**
     * Initialize UI components
     */
    initializeUI() {
      // Update scoring metrics
      setTimeout(() => {
        this.updateScoringMetrics();
      }, 500);
      
      // Enhance existing lead modal opening
      this.enhanceLeadModalOpening();
    },
    
    /**
     * Enhance lead modal opening
     */
    enhanceLeadModalOpening() {
      // Override the original openLeadModal function if it exists
      const originalOpenModal = window.openLeadModal;
      
      window.openLeadModal = (leadData = null) => {
        if (originalOpenModal) {
          originalOpenModal(leadData);
        }
        
        // Add our enhancements
        if (leadData?.id) {
          setTimeout(() => {
            this.addContactLogToModal(leadData.id);
            this.addProjectConversionToModal(leadData.id);
          }, 100);
        }
      };
    },
    
    /**
     * Add project conversion to modal
     */
    addProjectConversionToModal(leadId) {
      const modal = document.getElementById('lead-modal');
      if (!modal || modal.querySelector('.project-conversion-section')) return;
      
      const lead = this.leads.find(l => l.id === leadId);
      if (!lead) return;
      
      const conversionSection = document.createElement('div');
      conversionSection.className = 'project-conversion-section';
      conversionSection.innerHTML = `
        <div class=\"conversion-card\">
          <div class=\"conversion-header\">
            <h4>🚀 Project Conversion (ربط lead بالـ projects)</h4>
            <div class=\"lead-score-display\">
              <span class=\"score-label\">Score:</span>
              <span class=\"score-badge score-${this.getScoreClass(lead.score || 0)}\">${lead.score || 0}</span>
            </div>
          </div>
          
          ${lead.status === 'converted' ? `
            <div class=\"conversion-status converted\">
              <span class=\"status-icon\">✅</span>
              <span>Already converted to project</span>
              ${lead.projectId ? `<button class=\"uba-btn uba-btn-sm uba-btn-ghost\" onclick=\"window.location.href='projects.html?id=${lead.projectId}'\">View Project</button>` : ''}
            </div>
          ` : `
            <div class=\"conversion-actions\">
              <p class=\"conversion-description\">Convert this lead to an active project with automated data transfer.</p>
              <div class=\"conversion-preview\">
                <div class=\"preview-item\">
                  <strong>Project Name:</strong> ${lead.company} Project
                </div>
                <div class=\"preview-item\">
                  <strong>Client:</strong> ${lead.name}
                </div>
                <div class=\"preview-item\">
                  <strong>Budget:</strong> €${lead.budget || 0}
                </div>
                <div class=\"preview-item\">
                  <strong>Priority:</strong> ${this.getProjectPriority(lead.score || 0)}
                </div>
              </div>
              <button class=\"uba-btn uba-btn-primary conversion-btn\" onclick=\"window.UBAEnhancedLeads.convertLeadToProject('${leadId}')\">
                🚀 Convert to Project
              </button>
            </div>
          `}
        </div>
      `;
      
      const modalBody = modal.querySelector('.uba-modal-body');
      if (modalBody) {
        modalBody.appendChild(conversionSection);
      }
    },
    
    /**
     * Get score class for styling
     */
    getScoreClass(score) {
      if (score >= 80) return 'high';
      if (score >= 50) return 'medium';
      return 'low';
    },
    
    // Utility methods
    
    /**
     * Load projects data
     */
    loadProjectsData() {
      this.projects = window.ubaStore?.projects?.getAll() || [];
    },
    
    /**
     * Get demo leads data
     */
    getDemoLeads() {
      return [
        {
          id: 'lead-demo-1',
          name: 'Ahmed Al-Rashid',
          company: 'Tech Solutions MENA',
          email: 'ahmed@techsolutions.ae',
          phone: '+971-50-123-4567',
          status: 'qualified',
          source: 'website',
          budget: 25000,
          description: 'Looking for CRM automation solution',
          createdAt: '2024-11-15T10:00:00Z',
          score: 85
        },
        {
          id: 'lead-demo-2',
          name: 'Sarah Johnson',
          company: 'Digital Marketing Pro',
          email: 'sarah@digitalmarketingpro.com',
          phone: '+1-555-0123',
          status: 'contacted',
          source: 'referral',
          budget: 15000,
          description: 'Needs marketing automation tools',
          createdAt: '2024-11-18T14:30:00Z',
          score: 72
        }
      ];
    },
    
    /**
     * Update element content safely
     */
    updateElement(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    },
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', options = {}) {
      if (window.showToast) {
        window.showToast(message, type, options);
      } else {
        console.log(`${type.toUpperCase()}: ${message}`);
      }
    }
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => window.UBAEnhancedLeads.init(), 1000);
    });
  } else {
    setTimeout(() => window.UBAEnhancedLeads.init(), 1000);
  }
  
  console.log('✅ Enhanced Leads module loaded');
  
})();