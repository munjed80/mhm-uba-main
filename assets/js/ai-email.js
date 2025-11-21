/**
 * UBA AI Email Generator - Smart Email Composition
 * Generate professional emails with AI assistance
 */

(function() {
  'use strict';

  // AI Email namespace
  window.UBA = window.UBA || {};
  
  const AIEmail = {
    currentEmail: null,
    currentType: null,
    
    /**
     * Generate Email
     */
    async generateEmail(type, payload = {}) {
      console.log('[UBA AI Email] Generating email:', type);
      
      try {
        const settings = await this._getAISettings();
        const tone = settings.aiTone || 'professional';
        const verbosity = settings.aiVerbosity || 'medium';
        
        let email;
        
        switch (type) {
          case 'follow-up':
            email = this._generateFollowUpEmail(payload, tone, verbosity);
            break;
          case 'invoice-reminder':
            email = this._generateInvoiceReminder(payload, tone, verbosity);
            break;
          case 'project-update':
            email = this._generateProjectUpdate(payload, tone, verbosity);
            break;
          case 'quotation':
            email = this._generateQuotation(payload, tone, verbosity);
            break;
          case 'welcome':
            email = this._generateWelcomeEmail(payload, tone, verbosity);
            break;
          default:
            throw new Error(`Unknown email type: ${type}`);
        }
        
        this.currentEmail = email;
        this.currentType = type;
        
        // Track analytics
        if (UBA.analytics) {
          await UBA.analytics.track.trackAIAction('generate-email', { type, tone });
        }
        
        return {
          success: true,
          email
        };
      } catch (error) {
        console.error('[UBA AI Email] Email generation error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * Polish email (more professional)
     */
    async polishEmail(emailText) {
      // In local mode, just add professional touches
      let polished = emailText;
      
      // Add professional salutations if missing
      if (!polished.match(/^(Dear|Hi|Hello)/i)) {
        polished = 'Dear valued customer,

' + polished;
      }
      
      // Add professional closing if missing
      if (!polished.match(/(Regards|Sincerely|Best)/i)) {
        polished += '

Best regards,
The Team';
      }
      
      return polished;
    },

    /**
     * Make email shorter
     */
    async shortenEmail(emailText) {
      // In local mode, remove unnecessary parts
      let shortened = emailText
        .replace(/I hope this email finds you well\.\s*/gi, '')
        .replace(/Please do not hesitate to contact us if you have any questions\.\s*/gi, '')
        .replace(/We look forward to hearing from you\.\s*/gi, '');
      
      return shortened.trim();
    },

    /**
     * Make email more formal
     */
    async formalizeEmail(emailText) {
      // In local mode, replace casual phrases
      let formal = emailText
        .replace(/Hi\s/gi, 'Dear ')
        .replace(/Thanks/gi, 'Thank you')
        .replace(/\bcan't\b/gi, 'cannot')
        .replace(/\bwon't\b/gi, 'will not')
        .replace(/\bdon't\b/gi, 'do not')
        .replace(/Cheers/gi, 'Best regards');
      
      return formal;
    },

    /**
     * Show Email Modal
     */
    showEmailModal(email) {
      const modal = document.getElementById('ai-email-modal');
      if (!modal) {
        this._createEmailModal();
        return this.showEmailModal(email);
      }
      
      document.getElementById('ai-email-to').value = email.to || '';
      document.getElementById('ai-email-subject').value = email.subject || '';
      document.getElementById('ai-email-body').value = email.body || '';
      
      if (window.showModal) {
        window.showModal('ai-email-modal');
      } else {
        modal.style.display = 'flex';
      }
    },

    /**
     * Hide Email Modal
     */
    hideEmailModal() {
      const modal = document.getElementById('ai-email-modal');
      if (modal) {
        if (window.hideModal) {
          window.hideModal('ai-email-modal');
        } else {
          modal.style.display = 'none';
        }
      }
    },

    // ============ Email Templates ============

    /**
     * Generate Follow-up Email
     */
    _generateFollowUpEmail(payload, tone, verbosity) {
      const clientName = payload.clientName || payload.name || 'there';
      const context = payload.context || 'our recent conversation';
      const nextSteps = payload.nextSteps || 'discuss next steps';
      
      let greeting, body, closing;
      
      if (tone === 'friendly') {
        greeting = `Hi ${clientName},`;
        body = `I hope you're doing well! I wanted to follow up on ${context}.

`;
        body += `I'd love to ${nextSteps} and see how we can help you achieve your goals.`;
        closing = `

Looking forward to hearing from you!

Cheers,`;
      } else if (tone === 'formal') {
        greeting = `Dear ${clientName},`;
        body = `I trust this message finds you well. I am writing to follow up on ${context}.

`;
        body += `I would appreciate the opportunity to ${nextSteps} at your earliest convenience.`;
        closing = `

Yours sincerely,`;
      } else {
        greeting = `Hi ${clientName},`;
        body = `I wanted to follow up on ${context}.

`;
        body += `Let's schedule a time to ${nextSteps}.`;
        closing = `

Best regards,`;
      }
      
      if (verbosity === 'short') {
        body = `Following up on ${context}. Can we schedule a time to ${nextSteps}?`;
      } else if (verbosity === 'long') {
        body += `

We value your business and are committed to providing you with the best possible service. `;
        body += `Please let me know if there's anything specific you'd like to discuss or if you have any questions.`;
      }
      
      return {
        to: payload.email || '',
        subject: `Follow-up: ${context}`,
        body: `${greeting}

${body}${closing}`
      };
    },

    /**
     * Generate Invoice Reminder
     */
    _generateInvoiceReminder(payload, tone, verbosity) {
      const clientName = payload.clientName || 'valued customer';
      const invoiceNumber = payload.invoiceNumber || 'INV-XXXX';
      const amount = payload.amount || '0.00';
      const dueDate = payload.dueDate ? new Date(payload.dueDate).toLocaleDateString() : 'the due date';
      
      let greeting, body, closing;
      
      if (tone === 'friendly') {
        greeting = `Hi ${clientName},`;
        body = `Just a friendly reminder about invoice ${invoiceNumber} for €${amount}.

`;
        body += `The payment was due on ${dueDate}. If you've already sent it, please disregard this message!`;
        closing = `

Thanks!

Best,`;
      } else if (tone === 'formal') {
        greeting = `Dear ${clientName},`;
        body = `This is a formal reminder regarding invoice ${invoiceNumber} in the amount of €${amount}.

`;
        body += `Payment was due on ${dueDate}. We kindly request that you process this payment at your earliest convenience.`;
        closing = `

Yours sincerely,`;
      } else {
        greeting = `Hi ${clientName},`;
        body = `This is a reminder about invoice ${invoiceNumber} for €${amount}.

`;
        body += `Payment was due on ${dueDate}. Please process the payment when convenient.`;
        closing = `

Best regards,`;
      }
      
      if (verbosity === 'long') {
        body += `

If you have any questions or concerns about this invoice, please don't hesitate to reach out. `;
        body += `We're here to help and appreciate your prompt attention to this matter.`;
      }
      
      return {
        to: payload.email || '',
        subject: `Payment Reminder - Invoice ${invoiceNumber}`,
        body: `${greeting}

${body}${closing}`
      };
    },

    /**
     * Generate Project Update
     */
    _generateProjectUpdate(payload, tone, verbosity) {
      const clientName = payload.clientName || 'there';
      const projectName = payload.projectName || 'your project';
      const progress = payload.progress || '50%';
      const milestones = payload.milestones || 'several key milestones';
      const nextSteps = payload.nextSteps || 'continue as planned';
      
      let greeting, body, closing;
      
      if (tone === 'friendly') {
        greeting = `Hi ${clientName},`;
        body = `Great news! I wanted to give you a quick update on ${projectName}.

`;
        body += `We're currently at ${progress} completion and have achieved ${milestones}. `;
        body += `Next up, we'll ${nextSteps}.`;
        closing = `

Excited to keep the momentum going!

Cheers,`;
      } else if (tone === 'formal') {
        greeting = `Dear ${clientName},`;
        body = `I am pleased to provide you with a progress update on ${projectName}.

`;
        body += `Current progress stands at ${progress}, with ${milestones} successfully completed. `;
        body += `Our next phase will ${nextSteps}.`;
        closing = `

Yours sincerely,`;
      } else {
        greeting = `Hi ${clientName},`;
        body = `Here's an update on ${projectName}.

`;
        body += `Progress: ${progress}
Completed: ${milestones}
Next: ${nextSteps}`;
        closing = `

Best regards,`;
      }
      
      if (verbosity === 'long') {
        body += `

We remain committed to delivering exceptional results and meeting all project objectives. `;
        body += `Please feel free to reach out if you have any questions or would like to discuss the project in more detail.`;
      }
      
      return {
        to: payload.email || '',
        subject: `Project Update: ${projectName}`,
        body: `${greeting}

${body}${closing}`
      };
    },

    /**
     * Generate Quotation Email
     */
    _generateQuotation(payload, tone, verbosity) {
      const clientName = payload.clientName || 'there';
      const serviceName = payload.serviceName || 'our services';
      const amount = payload.amount || '0.00';
      const validUntil = payload.validUntil ? new Date(payload.validUntil).toLocaleDateString() : '30 days';
      
      let greeting, body, closing;
      
      if (tone === 'friendly') {
        greeting = `Hi ${clientName},`;
        body = `Thanks for your interest in ${serviceName}!

`;
        body += `I'm happy to provide you with a quote of €${amount}. `;
        body += `This quote is valid until ${validUntil}.`;
        closing = `

Let me know if you have any questions!

Best,`;
      } else if (tone === 'formal') {
        greeting = `Dear ${clientName},`;
        body = `Thank you for your inquiry regarding ${serviceName}.

`;
        body += `We are pleased to provide you with a quotation in the amount of €${amount}. `;
        body += `This quotation remains valid until ${validUntil}.`;
        closing = `

Yours sincerely,`;
      } else {
        greeting = `Hi ${clientName},`;
        body = `Thank you for your interest in ${serviceName}.

`;
        body += `Quote: €${amount}
Valid until: ${validUntil}`;
        closing = `

Best regards,`;
      }
      
      if (verbosity === 'long') {
        body += `

This quotation includes all the details we discussed. `;
        body += `We're confident we can deliver exceptional value and look forward to the opportunity to work with you. `;
        body += `Please don't hesitate to reach out with any questions or if you'd like to discuss further.`;
      }
      
      return {
        to: payload.email || '',
        subject: `Quotation for ${serviceName}`,
        body: `${greeting}

${body}${closing}`
      };
    },

    /**
     * Generate Welcome Email
     */
    _generateWelcomeEmail(payload, tone, verbosity) {
      const clientName = payload.clientName || 'there';
      const companyName = payload.companyName || 'us';
      
      let greeting, body, closing;
      
      if (tone === 'friendly') {
        greeting = `Hi ${clientName},`;
        body = `Welcome to ${companyName}! We're so excited to have you on board! 🎉

`;
        body += `We're here to help you succeed. Feel free to reach out anytime you need assistance.`;
        closing = `

Can't wait to work with you!

Cheers,`;
      } else if (tone === 'formal') {
        greeting = `Dear ${clientName},`;
        body = `Welcome to ${companyName}. We are delighted to have you join us.

`;
        body += `Our team is committed to providing you with exceptional service and support.`;
        closing = `

Yours sincerely,`;
      } else {
        greeting = `Hi ${clientName},`;
        body = `Welcome to ${companyName}!

`;
        body += `We're here to help. Reach out anytime you need assistance.`;
        closing = `

Best regards,`;
      }
      
      if (verbosity === 'long') {
        body += `

As you get started, we'd like to share a few resources to help you make the most of our services:
`;
        body += `- Getting Started Guide
`;
        body += `- Support Documentation
`;
        body += `- Contact Information

`;
        body += `We look forward to a successful partnership and are here to support you every step of the way.`;
      }
      
      return {
        to: payload.email || '',
        subject: `Welcome to ${companyName}!`,
        body: `${greeting}

${body}${closing}`
      };
    },

    // ============ Helper Methods ============

    /**
     * Get AI settings from localStorage
     */
    async _getAISettings() {
      try {
        const settings = JSON.parse(localStorage.getItem('uba-settings') || '{}');
        return {
          aiTone: settings.aiTone || 'professional',
          aiVerbosity: settings.aiVerbosity || 'medium',
          aiLanguage: settings.aiLanguage || settings.language || 'en'
        };
      } catch (error) {
        return {
          aiTone: 'professional',
          aiVerbosity: 'medium',
          aiLanguage: 'en'
        };
      }
    },

    /**
     * Create Email Modal
     */
    _createEmailModal() {
      const modal = document.createElement('div');
      modal.id = 'ai-email-modal';
      modal.className = 'uba-modal is-hidden';
      modal.innerHTML = `
        <div class="uba-modal-backdrop"></div>
        <div class="uba-modal-content" style="max-width: 700px;">
          <div class="uba-modal-header">
            <h2>AI Email Generator</h2>
            <button class="uba-modal-close" onclick="UBA.ai.email.hideEmailModal()">×</button>
          </div>
          <div class="uba-modal-body">
            <div style="margin-bottom: 16px;">
              <label for="ai-email-to" style="display: block; margin-bottom: 4px; font-weight: 500;">To:</label>
              <input type="email" id="ai-email-to" class="uba-input" placeholder="recipient@example.com" />
            </div>
            <div style="margin-bottom: 16px;">
              <label for="ai-email-subject" style="display: block; margin-bottom: 4px; font-weight: 500;">Subject:</label>
              <input type="text" id="ai-email-subject" class="uba-input" placeholder="Email subject" />
            </div>
            <div style="margin-bottom: 16px;">
              <label for="ai-email-body" style="display: block; margin-bottom: 4px; font-weight: 500;">Body:</label>
              <textarea id="ai-email-body" class="uba-textarea" rows="12" placeholder="Email body"></textarea>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
              <button class="uba-btn-secondary" onclick="UBA.ai.email.handleRegenerate()">
                🔄 Regenerate
              </button>
              <button class="uba-btn-secondary" onclick="UBA.ai.email.handlePolish()">
                ✨ Polish
              </button>
              <button class="uba-btn-secondary" onclick="UBA.ai.email.handleShorten()">
                ✂️ Shorter
              </button>
              <button class="uba-btn-secondary" onclick="UBA.ai.email.handleFormalize()">
                👔 More Formal
              </button>
            </div>
          </div>
          <div class="uba-modal-footer">
            <button class="uba-btn-secondary" onclick="UBA.ai.email.hideEmailModal()">Close</button>
            <button class="uba-btn" onclick="UBA.ai.email.handleCopy()">📋 Copy to Clipboard</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    },

    /**
     * Handle regenerate button
     */
    async handleRegenerate() {
      if (!this.currentType) return;
      
      const result = await this.generateEmail(this.currentType, {
        email: document.getElementById('ai-email-to').value,
        clientName: 'Customer'
      });
      
      if (result.success) {
        document.getElementById('ai-email-subject').value = result.email.subject;
        document.getElementById('ai-email-body').value = result.email.body;
      }
    },

    /**
     * Handle polish button
     */
    async handlePolish() {
      const body = document.getElementById('ai-email-body').value;
      const polished = await this.polishEmail(body);
      document.getElementById('ai-email-body').value = polished;
    },

    /**
     * Handle shorten button
     */
    async handleShorten() {
      const body = document.getElementById('ai-email-body').value;
      const shortened = await this.shortenEmail(body);
      document.getElementById('ai-email-body').value = shortened;
    },

    /**
     * Handle formalize button
     */
    async handleFormalize() {
      const body = document.getElementById('ai-email-body').value;
      const formal = await this.formalizeEmail(body);
      document.getElementById('ai-email-body').value = formal;
    },

    /**
     * Handle copy to clipboard
     */
    handleCopy() {
      const to = document.getElementById('ai-email-to').value;
      const subject = document.getElementById('ai-email-subject').value;
      const body = document.getElementById('ai-email-body').value;
      
      const emailText = `To: ${to}
Subject: ${subject}

${body}`;
      
      navigator.clipboard.writeText(emailText).then(() => {
        alert('Email copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = emailText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Email copied to clipboard!');
      });
    }
  };

  // Expose to UBA namespace
  UBA.ai = UBA.ai || {};
  UBA.ai.email = AIEmail;

  console.log('[UBA AI Email] Email module loaded');

})();
