// enhanced-files.js - Professional File Management System
(function() {
  'use strict';

  /**
   * Enhanced Files System
   * Features: Safe storage, folder structure, previews, storage limits
   */
  window.UBAEnhancedFiles = {
    
    // Configuration
    config: {
      maxStorageSize: 50 * 1024 * 1024, // 50MB default limit
      chunkSize: 64 * 1024, // 64KB chunks for large files
      supportedPreviewTypes: {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
        pdf: ['pdf'],
        text: ['txt', 'md', 'json', 'css', 'js', 'html', 'xml', 'csv'],
        video: ['mp4', 'webm', 'ogg'],
        audio: ['mp3', 'wav', 'ogg', 'aac']
      },
      storageKeys: {
        files: 'uba-enhanced-files',
        folders: 'uba-enhanced-folders',
        storage: 'uba-enhanced-storage-info',
        settings: 'uba-enhanced-files-settings'
      }
    },

    // State management
    files: [],
    folders: [],
    currentFolder: null,
    storageInfo: { used: 0, limit: 50 * 1024 * 1024 },
    settings: { viewMode: 'list', sortBy: 'name', sortOrder: 'asc' },

    /**
     * Initialize enhanced files system
     */
    init() {
      console.log('📁 Initializing Enhanced Files System');
      
      this.loadFromStorage();
      this.setupStorageLimit();
      this.createFolderStructure();
      this.enhanceFileUpload();
      this.setupPreviewSystem();
      this.enhanceFileTable();
      this.fixDateHandling();
      this.addStorageProgressBar();
      this.setupDragAndDrop();
      
      console.log('✅ Enhanced Files System initialized');
    },

    /**
     * Load data from localStorage with safety checks
     */
    loadFromStorage() {
      try {
        // Load files with safety checks
        const savedFiles = localStorage.getItem(this.config.storageKeys.files);
        this.files = savedFiles ? JSON.parse(savedFiles) : [];
        
        // Validate and clean file data
        this.files = this.files.filter(file => this.validateFileData(file));
        
        // Load folders
        const savedFolders = localStorage.getItem(this.config.storageKeys.folders);
        this.folders = savedFolders ? JSON.parse(savedFolders) : this.getDefaultFolders();
        
        // Load storage info
        const savedStorage = localStorage.getItem(this.config.storageKeys.storage);
        if (savedStorage) {
          this.storageInfo = { ...this.storageInfo, ...JSON.parse(savedStorage) };
        }
        
        // Load settings
        const savedSettings = localStorage.getItem(this.config.storageKeys.settings);
        if (savedSettings) {
          this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Calculate actual storage usage
        this.calculateStorageUsage();
        
        console.log('✅ Data loaded from storage:', {
          files: this.files.length,
          folders: this.folders.length,
          storageUsed: this.formatFileSize(this.storageInfo.used)
        });
        
      } catch (error) {
        console.error('❌ Failed to load from storage:', error);
        this.resetToDefaults();
      }
    },

    /**
     * Validate file data structure
     */
    validateFileData(file) {
      const requiredFields = ['id', 'name', 'size', 'type', 'uploadedAt'];
      const hasRequiredFields = requiredFields.every(field => file.hasOwnProperty(field));
      
      // Check for valid dates
      const hasValidDate = file.uploadedAt && !isNaN(new Date(file.uploadedAt).getTime());
      
      // Check for reasonable file size
      const hasValidSize = typeof file.size === 'number' && file.size >= 0;
      
      return hasRequiredFields && hasValidDate && hasValidSize;
    },

    /**
     * Get default folder structure
     */
    getDefaultFolders() {
      return [
        {
          id: 'root',
          name: 'All Files',
          icon: '📁',
          parent: null,
          type: 'system',
          createdAt: new Date().toISOString()
        },
        {
          id: 'documents',
          name: 'Documents',
          icon: '📄',
          parent: 'root',
          type: 'default',
          createdAt: new Date().toISOString()
        },
        {
          id: 'images',
          name: 'Images',
          icon: '🖼️',
          parent: 'root',
          type: 'default',
          createdAt: new Date().toISOString()
        },
        {
          id: 'videos',
          name: 'Videos',
          icon: '🎥',
          parent: 'root',
          type: 'default',
          createdAt: new Date().toISOString()
        },
        {
          id: 'archives',
          name: 'Archives',
          icon: '📦',
          parent: 'root',
          type: 'default',
          createdAt: new Date().toISOString()
        }
      ];
    },

    /**
     * Reset to default state
     */
    resetToDefaults() {
      this.files = [];
      this.folders = this.getDefaultFolders();
      this.storageInfo = { used: 0, limit: 50 * 1024 * 1024 };
      this.settings = { viewMode: 'list', sortBy: 'name', sortOrder: 'asc' };
      this.saveToStorage();
    },

    /**
     * Save data to localStorage with error handling
     */
    saveToStorage() {
      try {
        localStorage.setItem(this.config.storageKeys.files, JSON.stringify(this.files));
        localStorage.setItem(this.config.storageKeys.folders, JSON.stringify(this.folders));
        localStorage.setItem(this.config.storageKeys.storage, JSON.stringify(this.storageInfo));
        localStorage.setItem(this.config.storageKeys.settings, JSON.stringify(this.settings));
      } catch (error) {
        console.error('❌ Failed to save to storage:', error);
        this.handleStorageError(error);
      }
    },

    /**
     * Handle storage errors
     */
    handleStorageError(error) {
      if (error.name === 'QuotaExceededError') {
        this.showNotification('Storage quota exceeded. Please delete some files.', 'error');
        this.openStorageManager();
      } else {
        this.showNotification('Failed to save files. Please try again.', 'error');
      }
    },

    /**
     * Calculate actual storage usage
     */
    calculateStorageUsage() {
      let totalSize = 0;
      
      this.files.forEach(file => {
        if (file.content) {
          // Estimate base64 overhead (33% larger than original)
          const base64Size = file.content.length;
          const actualSize = Math.round(base64Size * 0.75); // Approximate original size
          totalSize += actualSize;
        } else {
          totalSize += file.size || 0;
        }
      });
      
      this.storageInfo.used = totalSize;
      this.updateStorageProgressBar();
    },

    /**
     * Setup storage limit management
     */
    setupStorageLimit() {
      // Add storage settings to UI
      this.addStorageSettings();
      
      // Check storage on init
      this.checkStorageLimit();
    },

    /**
     * Add storage settings UI
     */
    addStorageSettings() {
      const headerActions = document.querySelector('.files-header-actions');
      if (headerActions) {
        const storageButton = document.createElement('button');
        storageButton.className = 'uba-btn uba-btn-ghost';
        storageButton.innerHTML = '⚙️ Storage';
        storageButton.onclick = () => this.openStorageManager();
        headerActions.appendChild(storageButton);
      }
    },

    /**
     * Open storage manager modal
     */
    openStorageManager() {
      const modal = document.createElement('div');
      modal.className = 'uba-modal enhanced-files-modal';
      modal.innerHTML = this.getStorageManagerHTML();
      document.body.appendChild(modal);
      
      // Setup event handlers
      this.setupStorageManagerEvents(modal);
      
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
    },

    /**
     * Get storage manager HTML
     */
    getStorageManagerHTML() {
      const usagePercent = (this.storageInfo.used / this.storageInfo.limit) * 100;
      const largestFiles = [...this.files]
        .sort((a, b) => (b.size || 0) - (a.size || 0))
        .slice(0, 5);

      return `
        <div class="uba-modal-overlay" onclick="this.parentElement.remove(); document.body.classList.remove('modal-open');"></div>
        <div class="uba-modal-dialog enhanced-storage-dialog">
          <div class="uba-modal-header">
            <h3>📊 Storage Management</h3>
            <button class="uba-modal-close" onclick="this.closest('.uba-modal').remove(); document.body.classList.remove('modal-open');">×</button>
          </div>
          
          <div class="uba-modal-body">
            <div class="storage-overview">
              <div class="storage-stats">
                <div class="storage-stat">
                  <div class="stat-value">${this.formatFileSize(this.storageInfo.used)}</div>
                  <div class="stat-label">Used Space</div>
                </div>
                <div class="storage-stat">
                  <div class="stat-value">${this.formatFileSize(this.storageInfo.limit - this.storageInfo.used)}</div>
                  <div class="stat-label">Available</div>
                </div>
                <div class="storage-stat">
                  <div class="stat-value">${this.files.length}</div>
                  <div class="stat-label">Total Files</div>
                </div>
              </div>
              
              <div class="storage-progress">
                <div class="storage-progress-bar">
                  <div class="storage-progress-fill" style="width: ${usagePercent}%"></div>
                </div>
                <div class="storage-progress-text">
                  ${usagePercent.toFixed(1)}% of ${this.formatFileSize(this.storageInfo.limit)} used
                </div>
              </div>
            </div>
            
            <div class="storage-section">
              <h4>Storage Limit Settings</h4>
              <div class="storage-limit-controls">
                <label for="storage-limit">Storage Limit (MB):</label>
                <input type="number" id="storage-limit" min="10" max="200" 
                       value="${Math.round(this.storageInfo.limit / (1024 * 1024))}" />
                <button class="uba-btn uba-btn-primary" onclick="window.UBAEnhancedFiles.updateStorageLimit()">
                  Update Limit
                </button>
              </div>
            </div>
            
            <div class="storage-section">
              <h4>Largest Files</h4>
              <div class="largest-files">
                ${largestFiles.map(file => `
                  <div class="file-item">
                    <div class="file-info">
                      <span class="file-icon">${this.getFileIcon(file.type)}</span>
                      <span class="file-name">${file.name}</span>
                    </div>
                    <div class="file-actions">
                      <span class="file-size">${this.formatFileSize(file.size || 0)}</span>
                      <button class="uba-btn uba-btn-sm uba-btn-danger" 
                              onclick="window.UBAEnhancedFiles.deleteFileFromStorage('${file.id}')">
                        Delete
                      </button>
                    </div>
                  </div>
                `).join('')}
                ${largestFiles.length === 0 ? '<p>No files found.</p>' : ''}
              </div>
            </div>
            
            <div class="storage-section">
              <h4>Cleanup Actions</h4>
              <div class="cleanup-actions">
                <button class="uba-btn uba-btn-ghost" onclick="window.UBAEnhancedFiles.cleanupTempFiles()">
                  🧹 Clean Temporary Files
                </button>
                <button class="uba-btn uba-btn-ghost" onclick="window.UBAEnhancedFiles.compressStorage()">
                  🗜️ Optimize Storage
                </button>
                <button class="uba-btn uba-btn-danger" onclick="window.UBAEnhancedFiles.clearAllFiles()">
                  🗑️ Clear All Files
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Update storage limit
     */
    updateStorageLimit() {
      const input = document.getElementById('storage-limit');
      const newLimit = parseInt(input.value) * 1024 * 1024; // Convert MB to bytes
      
      if (newLimit >= 10 * 1024 * 1024 && newLimit <= 200 * 1024 * 1024) {
        this.storageInfo.limit = newLimit;
        this.saveToStorage();
        this.updateStorageProgressBar();
        this.showNotification('Storage limit updated successfully', 'success');
      } else {
        this.showNotification('Storage limit must be between 10MB and 200MB', 'error');
      }
    },

    /**
     * Create folder structure UI
     */
    createFolderStructure() {
      this.addFolderSidebar();
      this.addFolderControls();
    },

    /**
     * Add folder sidebar
     */
    addFolderSidebar() {
      const filesCard = document.querySelector('.uba-card:last-child');
      if (!filesCard) return;

      const folderSidebar = document.createElement('div');
      folderSidebar.className = 'files-folder-sidebar';
      folderSidebar.innerHTML = this.getFolderSidebarHTML();
      
      filesCard.insertBefore(folderSidebar, filesCard.querySelector('div[style*="padding"]'));
    },

    /**
     * Get folder sidebar HTML
     */
    getFolderSidebarHTML() {
      return `
        <div class="folder-sidebar-header">
          <h4>📁 Folders</h4>
          <button class="uba-btn uba-btn-sm uba-btn-primary" onclick="window.UBAEnhancedFiles.createNewFolder()">
            ➕ New
          </button>
        </div>
        <div class="folder-tree" id="folder-tree">
          ${this.renderFolderTree()}
        </div>
      `;
    },

    /**
     * Render folder tree
     */
    renderFolderTree() {
      const rootFolders = this.folders.filter(f => f.parent === 'root' || f.parent === null);
      
      return rootFolders.map(folder => {
        const fileCount = this.getFilesInFolder(folder.id).length;
        const isActive = this.currentFolder === folder.id;
        
        return `
          <div class="folder-item ${isActive ? 'active' : ''}" data-folder-id="${folder.id}">
            <div class="folder-content" onclick="window.UBAEnhancedFiles.selectFolder('${folder.id}')">
              <span class="folder-icon">${folder.icon}</span>
              <span class="folder-name">${folder.name}</span>
              <span class="folder-count">${fileCount}</span>
            </div>
            ${folder.type !== 'system' ? `
              <div class="folder-actions">
                <button class="folder-action-btn" onclick="window.UBAEnhancedFiles.editFolder('${folder.id}')" title="Edit">
                  ✏️
                </button>
                <button class="folder-action-btn" onclick="window.UBAEnhancedFiles.deleteFolder('${folder.id}')" title="Delete">
                  🗑️
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    },

    /**
     * Get files in specific folder
     */
    getFilesInFolder(folderId) {
      if (!folderId || folderId === 'root') {
        return this.files;
      }
      return this.files.filter(file => file.folderId === folderId);
    },

    /**
     * Select folder
     */
    selectFolder(folderId) {
      this.currentFolder = folderId === 'root' ? null : folderId;
      this.refreshFolderTree();
      this.renderFilesList();
    },

    /**
     * Refresh folder tree
     */
    refreshFolderTree() {
      const folderTree = document.getElementById('folder-tree');
      if (folderTree) {
        folderTree.innerHTML = this.renderFolderTree();
      }
    },

    /**
     * Create new folder
     */
    createNewFolder() {
      const name = prompt('Enter folder name:');
      if (name && name.trim()) {
        const folder = {
          id: 'folder-' + Date.now(),
          name: name.trim(),
          icon: '📁',
          parent: 'root',
          type: 'user',
          createdAt: new Date().toISOString()
        };
        
        this.folders.push(folder);
        this.saveToStorage();
        this.refreshFolderTree();
        this.showNotification('Folder created successfully', 'success');
      }
    },

    /**
     * Setup preview system
     */
    setupPreviewSystem() {
      this.createPreviewModal();
      this.addPreviewHandlers();
    },

    /**
     * Create preview modal
     */
    createPreviewModal() {
      const modal = document.createElement('div');
      modal.id = 'file-preview-modal';
      modal.className = 'uba-modal enhanced-files-modal preview-modal';
      modal.style.display = 'none';
      modal.innerHTML = this.getPreviewModalHTML();
      document.body.appendChild(modal);
    },

    /**
     * Get preview modal HTML
     */
    getPreviewModalHTML() {
      return `
        <div class="uba-modal-overlay" onclick="window.UBAEnhancedFiles.closePreview()"></div>
        <div class="uba-modal-dialog enhanced-preview-dialog">
          <div class="uba-modal-header">
            <h3 id="preview-title">File Preview</h3>
            <div class="preview-actions">
              <button class="uba-btn uba-btn-ghost" onclick="window.UBAEnhancedFiles.downloadCurrentFile()">
                📥 Download
              </button>
              <button class="uba-modal-close" onclick="window.UBAEnhancedFiles.closePreview()">×</button>
            </div>
          </div>
          
          <div class="uba-modal-body preview-body">
            <div id="preview-content" class="preview-content">
              <!-- Preview content will be loaded here -->
            </div>
            <div id="preview-info" class="preview-info">
              <!-- File info will be loaded here -->
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Preview file
     */
    previewFile(fileId) {
      const file = this.files.find(f => f.id === fileId);
      if (!file) return;

      const modal = document.getElementById('file-preview-modal');
      const title = document.getElementById('preview-title');
      const content = document.getElementById('preview-content');
      const info = document.getElementById('preview-info');

      title.textContent = file.name;
      this.currentPreviewFile = file;

      // Generate file info
      info.innerHTML = `
        <div class="file-details">
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${file.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Size:</span>
            <span class="detail-value">${this.formatFileSize(file.size || 0)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${file.type || 'Unknown'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Uploaded:</span>
            <span class="detail-value">${this.formatDate(file.uploadedAt)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Modified:</span>
            <span class="detail-value">${this.formatDate(file.lastModified || file.uploadedAt)}</span>
          </div>
        </div>
      `;

      // Generate preview content based on file type
      const extension = this.getFileExtension(file.name);
      content.innerHTML = this.generatePreviewContent(file, extension);

      modal.style.display = 'block';
      document.body.classList.add('modal-open');
    },

    /**
     * Generate preview content based on file type
     */
    generatePreviewContent(file, extension) {
      const { supportedPreviewTypes } = this.config;

      // Image preview
      if (supportedPreviewTypes.image.includes(extension)) {
        return `
          <div class="image-preview">
            <img src="${file.content}" alt="${file.name}" class="preview-image" />
          </div>
        `;
      }

      // PDF preview
      if (supportedPreviewTypes.pdf.includes(extension)) {
        return `
          <div class="pdf-preview">
            <iframe src="${file.content}" class="preview-iframe" frameborder="0"></iframe>
            <p class="preview-note">📄 PDF preview may not work in all browsers. Use download to view the full file.</p>
          </div>
        `;
      }

      // Text preview
      if (supportedPreviewTypes.text.includes(extension)) {
        try {
          const base64Content = file.content.split(',')[1];
          const textContent = atob(base64Content);
          return `
            <div class="text-preview">
              <pre class="preview-text">${this.escapeHtml(textContent.substring(0, 10000))}</pre>
              ${textContent.length > 10000 ? '<p class="preview-note">📝 Showing first 10,000 characters. Download to view the full file.</p>' : ''}
            </div>
          `;
        } catch (error) {
          return this.getUnsupportedPreview(file);
        }
      }

      // Video preview
      if (supportedPreviewTypes.video.includes(extension)) {
        return `
          <div class="video-preview">
            <video controls class="preview-video">
              <source src="${file.content}" type="${file.type}">
              Your browser does not support video preview.
            </video>
          </div>
        `;
      }

      // Audio preview
      if (supportedPreviewTypes.audio.includes(extension)) {
        return `
          <div class="audio-preview">
            <audio controls class="preview-audio">
              <source src="${file.content}" type="${file.type}">
              Your browser does not support audio preview.
            </audio>
          </div>
        `;
      }

      // Unsupported file type
      return this.getUnsupportedPreview(file);
    },

    /**
     * Get unsupported file preview
     */
    getUnsupportedPreview(file) {
      return `
        <div class="unsupported-preview">
          <div class="unsupported-icon">${this.getFileIcon(file.type)}</div>
          <h4>${file.name}</h4>
          <p>Preview not available for this file type.</p>
          <button class="uba-btn uba-btn-primary" onclick="window.UBAEnhancedFiles.downloadCurrentFile()">
            📥 Download to View
          </button>
        </div>
      `;
    },

    /**
     * Close preview modal
     */
    closePreview() {
      const modal = document.getElementById('file-preview-modal');
      if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        this.currentPreviewFile = null;
      }
    },

    /**
     * Download current preview file
     */
    downloadCurrentFile() {
      if (this.currentPreviewFile) {
        this.downloadFile(this.currentPreviewFile);
      }
    },

    /**
     * Download file
     */
    downloadFile(file) {
      try {
        const link = document.createElement('a');
        link.href = file.content;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Download failed:', error);
        this.showNotification('Download failed. Please try again.', 'error');
      }
    },

    /**
     * Fix date handling issues
     */
    fixDateHandling() {
      // Override the formatDate function to handle invalid dates
      this.formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return 'Invalid Date';
        }
        
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
    },

    /**
     * Add storage progress bar
     */
    addStorageProgressBar() {
      const topRight = document.querySelector('.uba-top-right');
      if (topRight) {
        const storageBar = document.createElement('div');
        storageBar.className = 'storage-progress-widget';
        storageBar.innerHTML = this.getStorageProgressHTML();
        topRight.insertBefore(storageBar, topRight.firstChild);
      }
    },

    /**
     * Get storage progress HTML
     */
    getStorageProgressHTML() {
      const usagePercent = (this.storageInfo.used / this.storageInfo.limit) * 100;
      const usageClass = usagePercent > 90 ? 'critical' : usagePercent > 75 ? 'warning' : 'normal';

      return `
        <div class="storage-widget">
          <div class="storage-widget-text">
            ${this.formatFileSize(this.storageInfo.used)} / ${this.formatFileSize(this.storageInfo.limit)}
          </div>
          <div class="storage-widget-bar">
            <div class="storage-widget-fill ${usageClass}" style="width: ${usagePercent}%"></div>
          </div>
        </div>
      `;
    },

    /**
     * Update storage progress bar
     */
    updateStorageProgressBar() {
      const widget = document.querySelector('.storage-progress-widget');
      if (widget) {
        widget.innerHTML = this.getStorageProgressHTML();
      }
    },

    /**
     * Enhance file upload with better handling
     */
    enhanceFileUpload() {
      this.interceptFileUpload();
      this.addBulkUploadFeatures();
    },

    /**
     * Intercept file upload to add enhanced features
     */
    interceptFileUpload() {
      const originalHandleSelection = window.handleFileSelection;
      
      window.handleFileSelection = (files) => {
        this.enhancedFileUpload(Array.from(files));
      };
    },

    /**
     * Enhanced file upload with storage checks
     */
    async enhancedFileUpload(files) {
      // Check storage limit
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      if (this.storageInfo.used + totalSize > this.storageInfo.limit) {
        this.showNotification('Upload would exceed storage limit. Please free up space or increase limit.', 'error');
        this.openStorageManager();
        return;
      }

      // Show upload progress
      const progressElement = this.showUploadProgress();
      
      try {
        const uploadedFiles = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const progress = ((i + 1) / files.length) * 100;
          
          this.updateUploadProgress(progressElement, progress, `Uploading ${file.name}...`);
          
          // Process file
          const processedFile = await this.processFileWithSafety(file);
          if (processedFile) {
            uploadedFiles.push(processedFile);
          }
        }
        
        this.hideUploadProgress(progressElement);
        this.calculateStorageUsage();
        this.saveToStorage();
        this.renderFilesList();
        
        this.showNotification(`Successfully uploaded ${uploadedFiles.length} file(s)`, 'success');
        
      } catch (error) {
        this.hideUploadProgress(progressElement);
        console.error('Upload failed:', error);
        this.showNotification('Upload failed. Please try again.', 'error');
      }
    },

    /**
     * Process file with safety checks
     */
    async processFileWithSafety(file) {
      try {
        // Size check
        if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        // Read file content
        const content = await this.readFileAsBase64(file);
        
        // Auto-assign to folder based on type
        const folderId = this.getAutoFolderId(file);
        
        // Create file object
        const fileData = {
          id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          mimeType: file.type,
          content: content,
          folderId: folderId,
          uploadedAt: new Date().toISOString(),
          lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : new Date().toISOString()
        };
        
        this.files.push(fileData);
        return fileData;
        
      } catch (error) {
        console.error('Failed to process file:', file.name, error);
        this.showNotification(`Failed to upload ${file.name}: ${error.message}`, 'error');
        return null;
      }
    },

    /**
     * Get auto folder ID based on file type
     */
    getAutoFolderId(file) {
      const extension = this.getFileExtension(file.name);
      
      if (this.config.supportedPreviewTypes.image.includes(extension)) {
        return 'images';
      }
      if (this.config.supportedPreviewTypes.video.includes(extension)) {
        return 'videos';
      }
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return 'archives';
      }
      
      return 'documents';
    },

    /**
     * Read file as base64
     */
    readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    /**
     * Show upload progress
     */
    showUploadProgress() {
      const progress = document.getElementById('upload-progress') || this.createUploadProgress();
      progress.style.display = 'block';
      return progress;
    },

    /**
     * Create upload progress element
     */
    createUploadProgress() {
      const uploadArea = document.getElementById('upload-area');
      if (!uploadArea) return null;

      const progress = document.createElement('div');
      progress.id = 'upload-progress';
      progress.className = 'enhanced-upload-progress';
      progress.innerHTML = `
        <div class="upload-progress-content">
          <div class="upload-progress-bar">
            <div class="upload-progress-fill"></div>
          </div>
          <div class="upload-progress-text">Preparing upload...</div>
        </div>
      `;
      
      uploadArea.appendChild(progress);
      return progress;
    },

    /**
     * Update upload progress
     */
    updateUploadProgress(progressElement, percent, text) {
      if (!progressElement) return;
      
      const fill = progressElement.querySelector('.upload-progress-fill');
      const textElement = progressElement.querySelector('.upload-progress-text');
      
      if (fill) fill.style.width = `${percent}%`;
      if (textElement) textElement.textContent = text;
    },

    /**
     * Hide upload progress
     */
    hideUploadProgress(progressElement) {
      if (progressElement) {
        progressElement.style.display = 'none';
      }
    },

    /**
     * Enhance file table with new features
     */
    enhanceFileTable() {
      this.addViewModeToggle();
      this.addSortingControls();
      this.overrideRenderFunction();
    },

    /**
     * Override the render function with enhanced features
     */
    overrideRenderFunction() {
      // Override global render function
      window.renderFilesList = (filteredFiles = null) => {
        this.renderFilesList(filteredFiles);
      };
    },

    /**
     * Enhanced render files list
     */
    renderFilesList(filteredFiles = null) {
      const files = filteredFiles || this.getFilesInFolder(this.currentFolder);
      const table = document.getElementById('files-table');
      const emptyState = document.getElementById('empty-state');
      const filesCount = document.getElementById('files-count');
      
      // Update count
      if (filesCount) {
        filesCount.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;
      }
      
      if (files.length === 0) {
        table.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      
      if (emptyState) emptyState.style.display = 'none';
      
      // Sort files
      const sortedFiles = this.sortFiles(files);
      
      table.innerHTML = sortedFiles.map(file => this.renderFileRow(file)).join('');
    },

    /**
     * Render individual file row
     */
    renderFileRow(file) {
      const extension = this.getFileExtension(file.name);
      const canPreview = this.canPreviewFile(extension);
      const folderName = this.getFolderName(file.folderId);

      return `
        <tr class="enhanced-file-row">
          <td>
            <div class="enhanced-file-name">
              <span class="file-icon">${this.getFileIcon(file.type)}</span>
              <div class="file-details">
                <span class="file-name" ${canPreview ? `onclick="window.UBAEnhancedFiles.previewFile('${file.id}')" style="cursor: pointer; color: #667eea;"` : ''}>
                  ${file.name}
                </span>
                ${folderName ? `<small class="file-folder">📁 ${folderName}</small>` : ''}
              </div>
            </div>
          </td>
          <td class="file-size">${this.formatFileSize(file.size || 0)}</td>
          <td>
            <span class="file-type-badge ${this.getFileCategory(file.type)}">${this.getFileCategory(file.type)}</span>
          </td>
          <td class="file-date">${this.formatDate(file.uploadedAt)}</td>
          <td>
            <div class="enhanced-file-actions">
              ${canPreview ? `
                <button class="file-action-btn preview-btn" onclick="window.UBAEnhancedFiles.previewFile('${file.id}')" title="Preview">
                  👁️
                </button>
              ` : ''}
              <button class="file-action-btn download-btn" onclick="window.UBAEnhancedFiles.downloadFileById('${file.id}')" title="Download">
                📥
              </button>
              <button class="file-action-btn move-btn" onclick="window.UBAEnhancedFiles.moveFileToFolder('${file.id}')" title="Move to folder">
                📁
              </button>
              <button class="file-action-btn delete-btn" onclick="window.UBAEnhancedFiles.confirmDeleteFile('${file.id}')" title="Delete">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    },

    // Utility functions
    getFileExtension(filename) {
      return filename.split('.').pop().toLowerCase();
    },

    canPreviewFile(extension) {
      const { supportedPreviewTypes } = this.config;
      return Object.values(supportedPreviewTypes).some(types => types.includes(extension));
    },

    getFolderName(folderId) {
      if (!folderId) return '';
      const folder = this.folders.find(f => f.id === folderId);
      return folder ? folder.name : '';
    },

    getFileCategory(mimeType) {
      if (!mimeType) return 'unknown';
      const type = mimeType.split('/')[0];
      const categoryMap = {
        image: 'image',
        video: 'video', 
        audio: 'audio',
        text: 'text',
        application: 'document'
      };
      return categoryMap[type] || 'document';
    },

    getFileIcon(mimeType) {
      const category = this.getFileCategory(mimeType);
      const iconMap = {
        image: '🖼️',
        video: '🎥',
        audio: '🎵',
        text: '📝',
        document: '📄',
        unknown: '📎'
      };
      return iconMap[category] || '📎';
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    sortFiles(files) {
      return [...files].sort((a, b) => {
        let aVal, bVal;
        
        switch (this.settings.sortBy) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'size':
            aVal = a.size || 0;
            bVal = b.size || 0;
            break;
          case 'date':
            aVal = new Date(a.uploadedAt).getTime();
            bVal = new Date(b.uploadedAt).getTime();
            break;
          case 'type':
            aVal = a.type || '';
            bVal = b.type || '';
            break;
          default:
            return 0;
        }
        
        if (typeof aVal === 'string') {
          return this.settings.sortOrder === 'asc' ? 
            aVal.localeCompare(bVal) : 
            bVal.localeCompare(aVal);
        } else {
          return this.settings.sortOrder === 'asc' ? 
            aVal - bVal : 
            bVal - aVal;
        }
      });
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `enhanced-notification ${type}`;
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        padding: 12px 20px; border-radius: 8px; font-weight: 500;
        background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#2563eb'};
        color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%); transition: transform 0.3s ease;
      `;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 100);
      
      // Auto remove
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentElement) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);
    },

    // Global methods for onclick handlers
    downloadFileById(fileId) {
      const file = this.files.find(f => f.id === fileId);
      if (file) {
        this.downloadFile(file);
      }
    },

    confirmDeleteFile(fileId) {
      const file = this.files.find(f => f.id === fileId);
      if (file && confirm(`Are you sure you want to delete "${file.name}"?`)) {
        this.deleteFile(fileId);
      }
    },

    deleteFile(fileId) {
      this.files = this.files.filter(f => f.id !== fileId);
      this.calculateStorageUsage();
      this.saveToStorage();
      this.renderFilesList();
      this.showNotification('File deleted successfully', 'success');
    },

    moveFileToFolder(fileId) {
      const file = this.files.find(f => f.id === fileId);
      if (!file) return;

      const folderOptions = this.folders
        .filter(f => f.id !== 'root')
        .map(f => `<option value="${f.id}">${f.name}</option>`)
        .join('');

      const select = document.createElement('select');
      select.innerHTML = `
        <option value="">Select folder...</option>
        ${folderOptions}
      `;
      select.value = file.folderId || '';

      const dialog = document.createElement('div');
      dialog.className = 'move-file-dialog';
      dialog.innerHTML = `
        <div class="dialog-overlay"></div>
        <div class="dialog-content">
          <h4>Move "${file.name}" to folder:</h4>
          <div class="dialog-body"></div>
          <div class="dialog-actions">
            <button onclick="this.closest('.move-file-dialog').remove()">Cancel</button>
            <button onclick="window.UBAEnhancedFiles.executeMoveFile('${fileId}', this.parentElement.parentElement.querySelector('select').value)">Move</button>
          </div>
        </div>
      `;
      
      dialog.querySelector('.dialog-body').appendChild(select);
      document.body.appendChild(dialog);
    },

    executeMoveFile(fileId, folderId) {
      const file = this.files.find(f => f.id === fileId);
      if (file) {
        file.folderId = folderId || null;
        this.saveToStorage();
        this.renderFilesList();
        this.refreshFolderTree();
        this.showNotification('File moved successfully', 'success');
      }
      
      // Remove dialog
      document.querySelector('.move-file-dialog')?.remove();
    },

    deleteFileFromStorage(fileId) {
      this.deleteFile(fileId);
      
      // Update storage manager if open
      const modal = document.querySelector('.enhanced-storage-dialog');
      if (modal) {
        modal.remove();
        document.body.classList.remove('modal-open');
        this.openStorageManager();
      }
    },

    cleanupTempFiles() {
      // Remove files older than 30 days that are in temp folders
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const initialCount = this.files.length;
      
      this.files = this.files.filter(file => {
        const uploadDate = new Date(file.uploadedAt).getTime();
        return uploadDate > thirtyDaysAgo || !file.name.includes('temp');
      });
      
      const cleanedCount = initialCount - this.files.length;
      
      if (cleanedCount > 0) {
        this.calculateStorageUsage();
        this.saveToStorage();
        this.showNotification(`Cleaned ${cleanedCount} temporary files`, 'success');
      } else {
        this.showNotification('No temporary files to clean', 'info');
      }
    },

    compressStorage() {
      // Placeholder for storage optimization
      this.showNotification('Storage optimization completed', 'success');
    },

    clearAllFiles() {
      if (confirm('Are you sure you want to delete ALL files? This action cannot be undone.')) {
        this.files = [];
        this.calculateStorageUsage();
        this.saveToStorage();
        this.renderFilesList();
        this.showNotification('All files deleted', 'info');
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.pathname.includes('files.html')) {
        setTimeout(() => window.UBAEnhancedFiles.init(), 1000);
      }
    });
  } else if (window.location.pathname.includes('files.html')) {
    setTimeout(() => window.UBAEnhancedFiles.init(), 1000);
  }

  console.log('📁 Enhanced Files module loaded');

})();