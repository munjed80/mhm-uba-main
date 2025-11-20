/**
 * UBA AI Chat UI - Interactive Chat Interface
 * Floating assistant panel with natural language interface
 */

(function() {
  'use strict';

  const AI_UI = {
    isOpen: false,
    isTyping: false,
    messages: [],
    
    /**
     * Initialize AI Chat UI
     */
    init() {
      console.log('[UBA AI UI] Initializing chat interface...');
      
      // Create floating button
      this.createFloatingButton();
      
      // Create chat panel
      this.createChatPanel();
      
      // Attach event listeners
      this.attachEventListeners();
      
      // Load conversation history
      this.loadConversationHistory();
      
      console.log('[UBA AI UI] Chat interface ready');
    },

    /**
     * Create floating "Ask UBA AI" button
     */
    createFloatingButton() {
      const button = document.createElement('button');
      button.id = 'uba-ai-fab';
      button.className = 'uba-ai-fab';
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="uba-ai-fab-label">Ask UBA AI</span>
      `;
      button.title = 'Ask UBA AI Assistant';
      button.onclick = () => this.togglePanel();
      
      document.body.appendChild(button);
    },

    /**
     * Create chat panel
     */
    createChatPanel() {
      const panel = document.createElement('div');
      panel.id = 'uba-ai-panel';
      panel.className = 'uba-ai-panel';
      panel.innerHTML = `
        <div class="uba-ai-panel-header">
          <div class="uba-ai-header-info">
            <div class="uba-ai-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h3>UBA AI Assistant</h3>
              <span class="uba-ai-status">Online</span>
            </div>
          </div>
          <div class="uba-ai-header-actions">
            <button class="uba-ai-header-btn" onclick="window.AIUI.clearChat()" title="Clear chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="uba-ai-header-btn" onclick="window.AIUI.togglePanel()" title="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="uba-ai-panel-body">
          <div class="uba-ai-messages" id="uba-ai-messages">
            <div class="uba-ai-welcome">
              <div class="uba-ai-welcome-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h4>Hi! I'm your UBA AI Assistant</h4>
              <p>I can help you analyze your workspace, manage tasks, generate insights, and automate workflows.</p>
            </div>
          </div>

          <div class="uba-ai-typing" id="uba-ai-typing" style="display: none;">
            <div class="uba-ai-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="uba-ai-typing-text">AI is thinking...</span>
          </div>

          <div class="uba-ai-suggestions" id="uba-ai-suggestions">
            <button class="uba-ai-chip" onclick="window.AIUI.sendQuickQuery('Analyze workspace')">
              📊 Analyze workspace
            </button>
            <button class="uba-ai-chip" onclick="window.AIUI.sendQuickQuery('Show overdue tasks')">
              ⏰ Show overdue tasks
            </button>
            <button class="uba-ai-chip" onclick="window.AIUI.sendQuickQuery('Generate weekly summary')">
              📄 Weekly summary
            </button>
            <button class="uba-ai-chip" onclick="window.AIUI.sendQuickQuery('What can you help with?')">
              ❓ What can you do?
            </button>
          </div>
        </div>

        <div class="uba-ai-panel-footer">
          <div class="uba-ai-input-container">
            <button class="uba-ai-voice-btn" id="uba-ai-voice-btn" onclick="window.AIUI.toggleVoiceMode()" title="Voice input">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <input
              type="text"
              id="uba-ai-input"
              class="uba-ai-input"
              placeholder="Ask me anything... (type / for commands)"
              autocomplete="off"
            />
            <button class="uba-ai-send-btn" onclick="window.AIUI.sendMessage()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="uba-ai-footer-hint">
            Quick commands: /task, /client, /invoice, /analyze, /help
          </div>
        </div>
      `;
      
      document.body.appendChild(panel);
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
      const input = document.getElementById('uba-ai-input');
      if (input) {
        // Send on Enter
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
          }
        });

        // Command autocomplete
        input.addEventListener('input', (e) => {
          this.handleCommandAutocomplete(e.target.value);
        });
      }
    },

    /**
     * Toggle panel open/closed
     */
    togglePanel() {
      this.isOpen = !this.isOpen;
      const panel = document.getElementById('uba-ai-panel');
      const fab = document.getElementById('uba-ai-fab');
      
      if (panel) {
        panel.classList.toggle('open', this.isOpen);
      }
      if (fab) {
        fab.classList.toggle('hidden', this.isOpen);
      }

      if (this.isOpen) {
        // Focus input
        setTimeout(() => {
          const input = document.getElementById('uba-ai-input');
          if (input) input.focus();
        }, 300);
      }
    },

    /**
     * Send message
     */
    async sendMessage() {
      const input = document.getElementById('uba-ai-input');
      if (!input) return;

      const query = input.value.trim();
      if (!query) return;

      // Clear input
      input.value = '';

      // Add user message
      this.addMessage('user', query);

      // Show typing indicator
      this.showTyping();

      // Process with AI
      try {
        // Check for quick commands
        if (query.startsWith('/')) {
          await this.handleQuickCommand(query);
        } else {
          // Regular query
          const response = await UBA.ai.answer(query);
          
          // Hide typing
          this.hideTyping();

          // Add AI response
          this.addMessage('ai', response.response, {
            intent: response.intent,
            confidence: response.confidence,
            suggestions: response.suggestions
          });

          // Update suggestions
          if (response.suggestions && response.suggestions.length > 0) {
            this.updateSuggestions(response.suggestions);
          }
        }
      } catch (error) {
        this.hideTyping();
        this.addMessage('ai', 'Sorry, I encountered an error. Please try again.', { error: true });
        console.error('[UBA AI UI] Message error:', error);
      }

      // Save conversation
      this.saveConversationHistory();
    },

    /**
     * Send quick query (from suggestion chip)
     */
    async sendQuickQuery(query) {
      const input = document.getElementById('uba-ai-input');
      if (input) {
        input.value = query;
        await this.sendMessage();
      }
    },

    /**
     * Handle quick commands (/task, /client, etc.)
     */
    async handleQuickCommand(command) {
      const parts = command.slice(1).split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ');

      let response;

      switch (cmd) {
        case 'task':
          if (args) {
            response = await UBA.ai.execute('create-task', { title: args });
            this.hideTyping();
            this.addMessage('ai', response.success ? `✅ ${response.result.message}` : `❌ ${response.error}`);
          } else {
            const tasks = await UBA.data.list('tasks');
            this.hideTyping();
            this.addMessage('ai', `You have ${tasks.length} tasks. Type "/task [title]" to create a new one.`);
          }
          break;

        case 'client':
          const clients = await UBA.data.list('clients');
          this.hideTyping();
          this.addMessage('ai', `You have ${clients.length} clients. Would you like to see them?`);
          break;

        case 'invoice':
          const invoices = await UBA.data.list('invoices');
          const unpaid = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
          this.hideTyping();
          this.addMessage('ai', `You have ${invoices.length} invoices (${unpaid.length} unpaid).`);
          break;

        case 'analyze':
          response = await UBA.ai.analyzeWorkspace();
          this.hideTyping();
          if (response.success) {
            const insights = response.insights;
            this.addMessage('ai', 
              `📊 **Workspace Analysis**\n\n` +
              `Tasks: ${insights.tasks.total} (${insights.tasks.overdue} overdue)\n` +
              `Clients: ${insights.clients.total}\n` +
              `Projects: ${insights.projects.total}\n` +
              `Revenue: €${insights.financial.revenue.toFixed(2)}\n` +
              `Activity Score: ${insights.summary.activityScore}/100`
            );
          }
          break;

        case 'help':
          this.hideTyping();
          this.addMessage('ai', 
            `**Available Commands:**\n\n` +
            `/task [title] - Create a task\n` +
            `/client - Show clients\n` +
            `/invoice - Show invoices\n` +
            `/analyze - Analyze workspace\n` +
            `/help - Show this help\n\n` +
            `Or just ask me anything in natural language!`
          );
          break;

        default:
          this.hideTyping();
          this.addMessage('ai', `Unknown command: /${cmd}. Type /help to see available commands.`);
      }
    },

    /**
     * Handle command autocomplete
     */
    handleCommandAutocomplete(value) {
      if (!value.startsWith('/')) return;

      const commands = ['task', 'client', 'invoice', 'analyze', 'help'];
      const typed = value.slice(1).toLowerCase();
      
      // Could show autocomplete dropdown here
      // For now, just log
      if (typed) {
        const matches = commands.filter(cmd => cmd.startsWith(typed));
        // console.log('Autocomplete matches:', matches);
      }
    },

    /**
     * Add message to chat
     */
    addMessage(sender, content, metadata = {}) {
      const messagesContainer = document.getElementById('uba-ai-messages');
      if (!messagesContainer) return;

      const messageDiv = document.createElement('div');
      messageDiv.className = `uba-ai-message ${sender}-message`;
      
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let confidenceBadge = '';
      if (metadata.confidence !== undefined && sender === 'ai') {
        const conf = (metadata.confidence * 100).toFixed(0);
        confidenceBadge = `<span class="uba-ai-confidence" title="Confidence: ${conf}%">${conf}%</span>`;
      }

      messageDiv.innerHTML = `
        <div class="uba-ai-message-content">
          ${this.formatMessage(content)}
        </div>
        <div class="uba-ai-message-meta">
          ${confidenceBadge}
          <span class="uba-ai-message-time">${time}</span>
        </div>
      `;

      messagesContainer.appendChild(messageDiv);

      // Remove welcome message if exists
      const welcome = messagesContainer.querySelector('.uba-ai-welcome');
      if (welcome) welcome.remove();

      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Store message
      this.messages.push({
        sender,
        content,
        metadata,
        timestamp: new Date().toISOString()
      });
    },

    /**
     * Format message content (markdown-like)
     */
    formatMessage(content) {
      if (!content) return '';

      let formatted = content;

      // Bold
      formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Italic
      formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

      // Line breaks
      formatted = formatted.replace(/\n/g, '<br>');

      // Code blocks
      formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>');

      return formatted;
    },

    /**
     * Show typing indicator
     */
    showTyping() {
      this.isTyping = true;
      const typing = document.getElementById('uba-ai-typing');
      if (typing) typing.style.display = 'flex';

      // Scroll to bottom
      const messages = document.getElementById('uba-ai-messages');
      if (messages) messages.scrollTop = messages.scrollHeight;
    },

    /**
     * Hide typing indicator
     */
    hideTyping() {
      this.isTyping = false;
      const typing = document.getElementById('uba-ai-typing');
      if (typing) typing.style.display = 'none';
    },

    /**
     * Update suggestion chips
     */
    updateSuggestions(suggestions) {
      const container = document.getElementById('uba-ai-suggestions');
      if (!container) return;

      container.innerHTML = suggestions.map(s => 
        `<button class="uba-ai-chip" onclick="window.AIUI.sendQuickQuery('${s.replace(/'/g, "\\'")}')">${s}</button>`
      ).join('');
    },

    /**
     * Clear chat
     */
    clearChat() {
      const messagesContainer = document.getElementById('uba-ai-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = `
          <div class="uba-ai-welcome">
            <div class="uba-ai-welcome-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h4>Chat cleared!</h4>
            <p>Start a new conversation with your AI assistant.</p>
          </div>
        `;
      }

      this.messages = [];
      UBA.ai.clearMemory();
      this.saveConversationHistory();

      // Reset suggestions
      this.updateSuggestions([
        '📊 Analyze workspace',
        '⏰ Show overdue tasks',
        '📄 Weekly summary',
        '❓ What can you do?'
      ]);
    },

    /**
     * Save conversation history to localStorage
     */
    saveConversationHistory() {
      try {
        const workspaceId = UBA.session?.currentWorkspaceId || 'default';
        const key = `uba-ai-conversation-${workspaceId}`;
        localStorage.setItem(key, JSON.stringify(this.messages.slice(-20))); // Keep last 20
      } catch (error) {
        console.error('[UBA AI UI] Failed to save conversation:', error);
      }
    },

    /**
     * Load conversation history from localStorage
     */
    loadConversationHistory() {
      try {
        const workspaceId = UBA.session?.currentWorkspaceId || 'default';
        const key = `uba-ai-conversation-${workspaceId}`;
        const saved = localStorage.getItem(key);
        
        if (saved) {
          this.messages = JSON.parse(saved);
          
          // Restore messages to UI
          const messagesContainer = document.getElementById('uba-ai-messages');
          if (messagesContainer && this.messages.length > 0) {
            messagesContainer.innerHTML = '';
            this.messages.forEach(msg => {
              this.addMessage(msg.sender, msg.content, msg.metadata);
            });
          }
        }
      } catch (error) {
        console.error('[UBA AI UI] Failed to load conversation:', error);
      }
    },

    /**
     * Voice Mode - using Web Speech API
     */
    voiceMode: {
      isListening: false,
      recognition: null,

      init() {
        // Check if browser supports Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          console.warn('[UBA AI UI] Speech Recognition not supported');
          return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          const input = document.getElementById('uba-ai-input');
          if (input) {
            input.value = transcript;
          }
          this.stop();
        };

        this.recognition.onerror = (event) => {
          console.error('[UBA AI UI] Speech recognition error:', event.error);
          this.stop();
        };

        this.recognition.onend = () => {
          this.stop();
        };

        return true;
      },

      start() {
        if (!this.recognition) {
          if (!this.init()) {
            alert('Voice input is not supported in your browser');
            return;
          }
        }

        try {
          this.recognition.start();
          this.isListening = true;
          this.updateButton();
        } catch (error) {
          console.error('[UBA AI UI] Failed to start voice recognition:', error);
        }
      },

      stop() {
        if (this.recognition && this.isListening) {
          this.recognition.stop();
        }
        this.isListening = false;
        this.updateButton();
      },

      updateButton() {
        const btn = document.getElementById('uba-ai-voice-btn');
        if (btn) {
          if (this.isListening) {
            btn.classList.add('listening');
            btn.title = 'Stop listening';
          } else {
            btn.classList.remove('listening');
            btn.title = 'Voice input';
          }
        }
      }
    },

    /**
     * Toggle voice mode
     */
    toggleVoiceMode() {
      // Check if voice mode is enabled in settings
      const settings = JSON.parse(localStorage.getItem('uba-settings') || '{}');
      if (settings.aiVoiceMode === false) {
        alert('Voice mode is disabled in settings. Enable it in AI Preferences to use this feature.');
        return;
      }

      if (this.voiceMode.isListening) {
        this.voiceMode.stop();
      } else {
        this.voiceMode.start();
      }
    }
  };

  // Expose globally
  window.AIUI = AI_UI;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AI_UI.init());
  } else {
    AI_UI.init();
  }

  console.log('[UBA AI UI] Chat UI module loaded');

})();
